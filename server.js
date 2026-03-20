// server.js
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// ----------------------
// DEV CONFIG
// ----------------------
const DEV_PHONE = "+79620491617";
const DEV_USERNAME = "&Developer&Official&";

// ----------------------
// DATABASE
// ----------------------
const db = new sqlite3.Database("messenger.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      isDeveloper INTEGER DEFAULT 0,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      type TEXT NOT NULL DEFAULT 'dialog'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(chat_id, user_id)
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

// ----------------------
// UTILS
// ----------------------
function getUserByPhone(phone) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function createUser(phone, name, username, password, isDev) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (phone, name, username, password, isDeveloper) VALUES (?, ?, ?, ?, ?)",
      [phone, name, username, password, isDev ? 1 : 0],
      function (err) {
        if (err) reject(err);
        else resolve({
          id: this.lastID,
          phone,
          name,
          username,
          isDeveloper: isDev ? 1 : 0
        });
      }
    );
  });
}

// ----------------------
// CHECK USER (EXISTS?)
// ----------------------
app.get("/api/checkUser", async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: "missing_phone" });

    const user = await getUserByPhone(phone);
    res.json({ exists: !!user });
  } catch (e) {
    console.error("CHECK USER ERROR:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ----------------------
// CHECK USERNAME
// ----------------------
app.get("/api/checkUsername", async (req, res) => {
  try {
    const u = (req.query.u || "").trim();

    // DEV username — всегда разрешён, но только для DEV_PHONE
    if (u === DEV_USERNAME) {
      return res.json({
        available: true,
        dev: true
      });
    }

    // обычным пользователям — только латиница, цифры, _
    if (!/^[a-z0-9_]{5,32}$/i.test(u)) {
      return res.json({
        available: false,
        invalid: true,
        reason: "spec_symbols_forbidden"
      });
    }

    const user = await getUserByUsername(u);
    res.json({ available: !user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ available: false });
  }
});

// ----------------------
// REGISTER
// ----------------------
app.post("/api/register", async (req, res) => {
  console.log("REGISTER PHONE:", req.body.phone);
  try {
    const { phone, name, username, password } = req.body;

    if (!phone || !name || !username || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const uname = username.trim();

    // DEV registration — только один такой пользователь
    if (phone === DEV_PHONE) {
  // username должен быть строго один
  if (uname !== DEV_USERNAME) {
    return res.status(400).json({ error: "dev_username_required" });
  }

  // если DEV уже существует — просто логинимся, а не выдаём ошибку
  const existingDev = await getUserByPhone(phone);
  if (existingDev) {
    return res.json({ user: existingDev });
  }

  // если username занят — но это НЕ DEV — запрещаем
  const existingDevByUsername = await getUserByUsername(uname);
  if (existingDevByUsername && existingDevByUsername.phone !== DEV_PHONE) {
    return res.status(400).json({ error: "username_taken" });
  }

  const user = await createUser(phone, name, uname, password, true);
  return res.json({ user });
}


    // NORMAL USER
    if (!/^[a-z0-9_]{5,32}$/i.test(uname)) {
      return res.status(400).json({ error: "invalid_username" });
    }

    const existingPhone = await getUserByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({ error: "user_exists" });
    }

    const existingUsername = await getUserByUsername(uname);
    if (existingUsername) {
      return res.status(400).json({ error: "username_taken" });
    }

    const user = await createUser(phone, name, uname, password, false);
    res.json({ user });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ----------------------
// LOGIN
// ----------------------
app.post("/api/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await getUserByPhone(phone);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        username: user.username,
        isDeveloper: user.isDeveloper
      }
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ----------------------
// SEARCH USERS
// ----------------------
app.get("/api/findUser", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const like = `%${q}%`;

  db.all(
    `
    SELECT id, name, phone, username, isDeveloper
    FROM users
    WHERE phone LIKE ? OR name LIKE ? OR username LIKE ?
    ORDER BY isDeveloper DESC, name ASC
    LIMIT 20
    `,
    [like, like, like],
    (err, rows) => {
      if (err) {
        console.error("FIND USER ERROR:", err);
        return res.status(500).json({ error: "server_error" });
      }
      res.json(rows);
    }
  );
});
// ----------------------
// CHAT HELPERS
// ----------------------
function createOrGetChat(userId, peerId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT c.id
      FROM chats c
      JOIN chat_participants p1 ON p1.chat_id = c.id AND p1.user_id = ?
      JOIN chat_participants p2 ON p2.chat_id = c.id AND p2.user_id = ?
      WHERE c.type = 'dialog'
      LIMIT 1
      `,
      [userId, peerId],
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(row.id);

        db.run(
          "INSERT INTO chats (title, type) VALUES (?, 'dialog')",
          [null],
          function (err2) {
            if (err2) return reject(err2);
            const chatId = this.lastID;
            db.run(
              "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)",
              [chatId, userId, chatId, peerId],
              (err3) => {
                if (err3) return reject(err3);
                resolve(chatId);
              }
            );
          }
        );
      }
    );
  });
}

function saveMessage(chatId, senderId, text) {
  return new Promise((resolve, reject) => {
    const ts = Date.now();
    db.run(
      "INSERT INTO messages (chat_id, sender_id, text, created_at) VALUES (?, ?, ?, ?)",
      [chatId, senderId, text, ts],
      function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          chat_id: chatId,
          sender_id: senderId,
          text,
          created_at: ts
        });
      }
    );
  });
}

// ----------------------
// LIST CHATS FOR USER
// ----------------------
app.get("/api/chats", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "missing_user" });

  const sql = `
    SELECT
      c.id,
      c.type,
      u.id AS peerId,
      u.name AS name,
      u.username AS peerUsername,
      u.phone AS peerPhone,
      u.isDeveloper AS peerIsDeveloper,
      m.text AS lastMessage,
      m.created_at AS lastTime
    FROM chats c
    JOIN chat_participants cp_self ON cp_self.chat_id = c.id AND cp_self.user_id = ?
    JOIN chat_participants cp_peer ON cp_peer.chat_id = c.id AND cp_peer.user_id != ?
    JOIN users u ON u.id = cp_peer.user_id
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages
      WHERE chat_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    )
    ORDER BY lastTime DESC NULLS LAST, c.id DESC
  `;

  db.all(sql, [userId, userId], (err, rows) => {
    if (err) {
      console.error("CHATS ERROR:", err);
      return res.status(500).json({ error: "server_error" });
    }
    const mapped = rows.map(r => ({
      id: r.id,
      type: r.type,
      peerId: r.peerId,
      name: r.name || r.peerUsername || r.peerPhone,
      peerUsername: r.peerUsername,
      lastMessage: r.lastMessage || "",
      lastTime: r.lastTime ? new Date(r.lastTime).toLocaleTimeString() : ""
    }));
    res.json(mapped);
  });
});

// ----------------------
// LIST MESSAGES IN CHAT
// ----------------------
app.get("/api/messages", (req, res) => {
  const chatId = Number(req.query.chatId);
  const userId = Number(req.query.userId);
  if (!chatId || !userId) {
    return res.status(400).json({ error: "missing_params" });
  }

  db.all(
    `
    SELECT id, chat_id, sender_id, text, created_at
    FROM messages
    WHERE chat_id = ?
    ORDER BY created_at ASC, id ASC
    `,
    [chatId],
    (err, rows) => {
      if (err) {
        console.error("MESSAGES ERROR:", err);
        return res.status(500).json({ error: "server_error" });
      }
      res.json(rows);
    }
  );
});

// ----------------------
// SEARCH MESSAGES
// ----------------------
app.get("/api/searchMessages", (req, res) => {
  const userId = Number(req.query.userId);
  const q = (req.query.q || "").trim();
  if (!userId || !q) return res.json([]);

  const like = `%${q}%`;

  const sql = `
    SELECT
      m.id,
      m.chat_id AS chatId,
      m.text,
      m.created_at,
      u.name AS peerName,
      u.username AS peerUsername
    FROM messages m
    JOIN chats c ON c.id = m.chat_id
    JOIN chat_participants cp_self ON cp_self.chat_id = c.id AND cp_self.user_id = ?
    JOIN chat_participants cp_peer ON cp_peer.chat_id = c.id AND cp_peer.user_id != ?
    JOIN users u ON u.id = cp_peer.user_id
    WHERE m.text LIKE ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `;

  db.all(sql, [userId, userId, like], (err, rows) => {
    if (err) {
      console.error("SEARCH MESSAGES ERROR:", err);
      return res.status(500).json({ error: "server_error" });
    }
    const mapped = rows.map(r => ({
      id: r.id,
      chatId: r.chatId,
      snippet: r.text,
      peerName: r.peerName || r.peerUsername,
      peerUsername: r.peerUsername
    }));
    res.json(mapped);
  });
});

// ----------------------
// STATIC
// ----------------------
app.use(express.static(path.join(__dirname, "static")));

// ----------------------
// WEBSOCKET
// ----------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const userId = Number(url.searchParams.get("userId"));
  if (!userId) return ws.close();

  clients.set(userId, ws);

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type !== "send") return;

      const { to, text } = msg;
      if (!to || !text) return;

      const chatId = await createOrGetChat(userId, to);
      const saved = await saveMessage(chatId, userId, text);

      const payload = JSON.stringify({
        type: "message",
        message: saved
      });

      // отправляем себе
      const wsFrom = clients.get(userId);
      if (wsFrom && wsFrom.readyState === wsFrom.OPEN) {
        wsFrom.send(payload);
      }

      // отправляем собеседнику
      const wsTo = clients.get(to);
      if (wsTo && wsTo.readyState === wsTo.OPEN) {
        wsTo.send(payload);
      }
    } catch (e) {
      console.error("WS error:", e);
    }
  });

  ws.on("close", () => clients.delete(userId));
});
// ----------------------
// GLOBAL ERROR HANDLER — чтобы НИКОГДА не было 500
// ----------------------
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(400).json({ error: "bad_request" });
});

// ----------------------
// START
// ----------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

