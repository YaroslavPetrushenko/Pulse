// server/users.js
// Пользователи: регистрация, логин, проверки, поиск

const db = require("./db");
const bcrypt = require("bcrypt");
const { ensureSelfChat } = require("./chats");

const SPECIAL_PHONE = "9620491617";

// GET /api/checkUser?phone=
async function checkUser(req, res) {
  try {
    const phone = (req.query.phone || "").trim();
    if (!phone) return res.status(400).json({ error: "phone_required" });

    const user = await db.get(
      "SELECT id, phone, name, username FROM users WHERE phone = ?",
      [phone]
    );

    if (!user) return res.json({ exists: false });
    res.json({ exists: true, user });
  } catch (e) {
    console.error("checkUser error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// GET /api/checkUsername?u=
async function checkUsername(req, res) {
  try {
    const username = (req.query.u || "").trim();
    if (!username) return res.status(400).json({ error: "username_required" });

    const row = await db.get(
      "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
      [username]
    );

    res.json({ available: !row });
  } catch (e) {
    console.error("checkUsername error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// POST /api/register
// body: { phone, name, username, password }
async function register(req, res) {
  try {
    const { phone, name, username, password } = req.body || {};
    if (!phone || !name || !username || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const existing = await db.get(
      "SELECT id FROM users WHERE phone = ? OR LOWER(username) = LOWER(?)",
      [phone, username]
    );
    if (existing) {
      return res.status(409).json({ error: "user_exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const isSpecial = phone === SPECIAL_PHONE ? 1 : 0;

    const resDb = await db.run(
      `
      INSERT INTO users (phone, name, username, password_hash, is_special)
      VALUES (?, ?, ?, ?, ?)
    `,
      [phone, name, username, hash, isSpecial]
    );

    const user = await db.get(
      "SELECT id, phone, name, username, is_special FROM users WHERE id = ?",
      [resDb.lastID]
    );

    // создаём личный чат
    await ensureSelfChat(user.id);

    // сессия
    req.session.userId = user.id;

    res.json(user);
  } catch (e) {
    console.error("register error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// POST /api/login
// body: { phone, password }
async function login(req, res) {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({ error: "missing_credentials" });
    }

    const user = await db.get(
      "SELECT id, phone, name, username, password_hash, is_special FROM users WHERE phone = ?",
      [phone]
    );
    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // гарантируем личный чат
    await ensureSelfChat(user.id);

    req.session.userId = user.id;

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      username: user.username,
      is_special: user.is_special
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// GET /api/users/search?q=
async function searchUsers(req, res) {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    if (!q) return res.json([]);

    const rows = await db.all(
      `
      SELECT id, username, name
      FROM users
      WHERE LOWER(username) LIKE ?
      ORDER BY id
      LIMIT 20
    `,
      [`%${q}%`]
    );

    res.json(rows);
  } catch (e) {
    console.error("searchUsers error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

module.exports = {
  checkUser,
  checkUsername,
  register,
  login,
  searchUsers
};
