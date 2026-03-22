// index.js
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { PORT } from "./config.js";
import { initDb } from "./db.js";
import { normalizePhone, comparePassword } from "./utils.js";
import {
  getUserByPhone,
  getUserByUsername,
  createUser,
  getUserById,
  searchUsers
} from "./users.js";
import { getChatsForUser, getOrCreateChat } from "./chats.js";
import { getMessagesForChat, searchMessages } from "./messages.js";
import { initWs } from "./ws.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDb();

const app = express();
app.use(express.json());

// статика
app.use(express.static(path.join(__dirname, "..", "web")));

// ---------- AUTH ----------

app.get("/api/checkUser", async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone || "");
    if (!phone) return res.json({ exists: false });

    const user = await getUserByPhone(phone);
    res.json({ exists: !!user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/checkUsername", async (req, res) => {
  try {
    const username = (req.query.u || "").trim();
    if (!username) return res.json({ available: false });

    const user = await getUserByUsername(username);
    res.json({ available: !user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { phone, name, username, password } = req.body || {};
    if (!phone || !name || !username || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const normPhone = normalizePhone(phone);
    const existingPhone = await getUserByPhone(normPhone);
    if (existingPhone) {
      return res.status(400).json({ error: "phone_taken" });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "username_taken" });
    }

    const user = await createUser({
      phone: normPhone,
      name,
      username,
      password
    });

    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const normPhone = normalizePhone(phone);
    const user = await getUserByPhone(normPhone);
    if (!user) return res.status(400).json({ error: "user_not_found" });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "invalid_password" });

    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- CHATS ----------

app.get("/api/chats", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ error: "userId_required" });

    const chats = await getChatsForUser(userId);
    res.json(chats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/createChat", async (req, res) => {
  try {
    const { user1, user2 } = req.body || {};
    if (!user1 || !user2) {
      return res.status(400).json({ error: "missing_users" });
    }

    const chat = await getOrCreateChat(Number(user1), Number(user2));
    const peerId = chat.user1_id === Number(user1) ? chat.user2_id : chat.user1_id;
    const peer = await getUserById(peerId);

    res.json({
      id: chat.id,
      peerId,
      name: peer?.name || "Пользователь",
      peerUsername: peer?.username || ""
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- MESSAGES ----------

app.get("/api/messages", async (req, res) => {
  try {
    const chatId = Number(req.query.chatId);
    const userId = Number(req.query.userId);
    if (!chatId || !userId) {
      return res.status(400).json({ error: "missing_params" });
    }

    const list = await getMessagesForChat(chatId, userId);
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- SEARCH ----------

app.get("/api/findUser", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const users = await searchUsers(q);
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/searchMessages", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const q = (req.query.q || "").trim();
    if (!userId || !q) return res.json([]);

    const list = await searchMessages(userId, q);
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- SPA fallback ----------

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

// ---------- START ----------

const server = http.createServer(app);
initWs(server);

server.listen(PORT, () => {
  console.log("Pulse server listening on", PORT);
});

// ---------- HELPERS ----------

function sanitizeUser(u) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    username: u.username,
    isDeveloper: !!u.is_developer
  };
}
