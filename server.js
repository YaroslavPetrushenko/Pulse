// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, "cloud.db");
const db = new sqlite3.Database(DB_FILE);

// ---------- ИНИЦИАЛИЗАЦИЯ БАЗЫ ----------
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      is_developer INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user1_id, user2_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
});

function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

// ---------- ВСПОМОГАТЕЛЬНОЕ ----------
function getUserByPhone(phone) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function normalizeUserPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    username: u.username,
    isDeveloper: !!u.is_developer
  };
}

// ---------- API: ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ----------
app.get("/api/checkUser", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.json({ exists: false });

  try {
    const user = await getUserByPhone(phone);
    res.json({ exists: !!user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- API: ПРОВЕРКА USERNAME ----------
app.get("/api/checkUsername", async (req, res) => {
  const u = (req.query.u || "").trim();
  if (!u) return res.json({ available: false });

  try {
    const user = await getUserByUsername(u);
    if (user) {
      return res.json({ available: false });
    }
    res.json({ available: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- API: РЕГИСТРАЦИЯ ----------
app.post("/api/register", async (req, res) => {
  const { phone, name, username, password } = req.body || {};
  if (!phone || !name || !username || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const existingPhone = await getUserByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({ error: "user_exists" });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "username_taken" });
    }

    const now = Date.now();
    const hash = hashPassword(password);

    db.run(
      `INSERT INTO users (phone, name, username, password_hash, is_developer, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [phone, name, username, hash, now],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "server_error" });
        }
        const user = {
          id: this.lastID,
          phone,
          name,
          username,
          is_developer: 0
        };
        res.json({ user: normalizeUserPublic(user) });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- API: ЛОГИН ----------
app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(403).json({ error: "invalid_credentials" });
    }
    if (user.password_hash !== hashPassword(password)) {
      return res.status(403).json({ error: "invalid_credentials" });
    }
    res.json({ user: normalizeUserPublic(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- API: ПОИСК ПОЛЬЗОВАТЕЛЯ ----------
app.get("/api/findUser", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const like = `%${q}%`;
  db.all(
    `
    SELECT id, phone, name, username, is_developer
    FROM users
    WHERE phone LIKE ? OR name LIKE ? OR username LIKE ?
    LIMIT 20
  `,
    [like, like, like],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "server_error" });
      }
      res.json(rows.map(normalizeUserPublic));
    }
  );
});

// ---------- ВСПОМОГАТЕЛЬНОЕ: ПОЛУЧИТЬ ИЛИ СОЗДАТЬ ЧАТ ----------
function getOrCreateChat(userId, peerId) {
  return new Promise((resolve, reject) => {
    const a = Math.min(userId, peerId);
    const b = Math.max(userId, peerId);

    db.get(
      "SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?",
      [a, b],
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(row);

        const now = Date.now();
        db.run(
          "INSERT INTO chats (user1_id, user2_id, created_at) VALUES (?, ?, ?)",
          [a, b, now],
          function (err2) {
            if (err2) return reject(err2);
            db.get(
              "SELECT * FROM chats WHERE id = ?",
              [this.lastID],
              (err3, row2) => {
                if (err3) return reject(err3);
                resolve(row2);
              }
            );
          }
        );
      }
    );
  });
}

// ---------- API: СПИСОК ЧАТОВ ----------
app.get("/api/chats", (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) return res.json([]);

  db.all(
    `
    SELECT
      c.id,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS peer_id,
      u.name AS peer_name,
      u.username AS peer_username,
      u.is_developer AS peer_is_developer,
      (
        SELECT text FROM messages m
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT created_at FROM messages m
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_time
    FROM chats c
    JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY last_time DESC NULLS LAST, c.created_at DESC
  `,
    [userId, userId, userId, userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "server_error" });
      }

      const result = rows.map(r => ({
        id: r.id,
        peerId: r.peer_id,
        name: r.peer_name || r.peer_username || "Пользователь",
        peerUsername: r.peer_username,
        lastMessage: r.last_message || "",
        lastTime: r.last_time ? new Date(r.last_time).toLocaleTimeString() : ""
      }));

      res.json(result);
    }
  );
});

// ---------- API: СООБЩЕНИЯ ЧАТА ----------
app.get("/api/messages", (req, res) => {
  const chatId = parseInt(req.query.chatId, 10);
  const userId = parseInt(req.query.userId, 10);
  if (!chatId || !userId) return res.json([]);

  db.all(
    `
    SELECT id, chat_id, sender_id, text, created_at
    FROM messages
    WHERE chat_id = ?
    ORDER BY created_at ASC
  `,
    [chatId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "server_error" });
      }
      res.json(rows);
    }
  );
});

// ---------- API: ПОИСК СООБЩЕНИЙ ----------
app.get("/api/searchMessages", (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  const q = (req.query.q || "").trim();
  if (!userId || !q) return res.json([]);

  const like = `%${q}%`;

  db.all(
    `
    SELECT
      m.id,
      m.chat_id,
      m.text,
      m.created_at,
      u.name AS peer_name,
      u.username AS peer_username
    FROM messages m
    JOIN chats c ON c.id = m.chat_id
    JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
    WHERE (c.user1_id = ? OR c.user2_id = ?)
      AND m.text LIKE ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `,
    [userId, userId, userId, like],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "server_error" });
      }

      const result = rows.map(r => ({
        id: r.id,
        chatId: r.chat_id,
        text: r.text,
        snippet: r.text.length > 80 ? r.text.slice(0, 77) + "..." : r.text,
        peerName: r.peer_name || r.peer_username || "Пользователь",
        peerUsername: r.peer_username
      }));

      res.json(result);
    }
  );
});

// ---------- WEBSOCKET ----------
const wsClients = new Map(); // userId -> ws

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const userId = parseInt(url.searchParams.get("userId"), 10);

  if (!userId) {
    ws.close();
    return;
  }

  wsClients.set(userId, ws);

  ws.on("close", () => {
    wsClients.delete(userId);
  });

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "send") {
        const fromId = userId;
        const toId = parseInt(data.to, 10);
        const text = (data.text || "").trim();
        if (!toId || !text) return;

        const chat = await getOrCreateChat(fromId, toId);
        const now = Date.now();

        db.run(
          "INSERT INTO messages (chat_id, sender_id, text, created_at) VALUES (?, ?, ?, ?)",
          [chat.id, fromId, text, now],
          function (err) {
            if (err) {
              console.error(err);
              return;
            }

            const message = {
              id: this.lastID,
              chat_id: chat.id,
              sender_id: fromId,
              text,
              created_at: now
            };

            // отправляем себе
            const wsFrom = wsClients.get(fromId);
            if (wsFrom && wsFrom.readyState === WebSocket.OPEN) {
              wsFrom.send(JSON.stringify({ type: "message", message }));
            }

            // отправляем собеседнику
            const wsTo = wsClients.get(toId);
            if (wsTo && wsTo.readyState === WebSocket.OPEN) {
              wsTo.send(JSON.stringify({ type: "message", message }));
            }
          }
        );
      }
    } catch (e) {
      console.error("WS message error", e);
    }
  });
});

// ---------- СТАРТ ----------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
