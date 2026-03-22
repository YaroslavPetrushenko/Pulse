const express = require("express");
const db = require("./db");
const { hashPassword, comparePassword, sanitizeUser } = require("./utils");

const router = express.Router();

// текущий пользователь
router.get("/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });

  db.get(
    "SELECT * FROM users WHERE id = ?",
    [req.session.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json({ user: sanitizeUser(row) });
    }
  );
});

// регистрация
router.post("/register", (req, res) => {
  const { phone, name, username, password } = req.body || {};
  if (!phone || !name || !username || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const passwordHash = hashPassword(password);

  const stmt = db.prepare(
    "INSERT INTO users (phone, name, username, password_hash) VALUES (?, ?, ?, ?)"
  );
  stmt.run(phone, name, username, passwordHash, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(409).json({ error: "user_exists" });
      }
      return res.status(500).json({ error: "db_error" });
    }

    const userId = this.lastID;
    req.session.userId = userId;

    db.get("SELECT * FROM users WHERE id = ?", [userId], (e2, row) => {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.json({ user: sanitizeUser(row) });
    });
  });
});

// логин
router.post("/login", (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, user) => {
    if (err) return res.status(500).json({ error: "db_error" });
    if (!user) return res.status(401).json({ error: "invalid_credentials" });

    const ok = comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    req.session.userId = user.id;
    res.json({ user: sanitizeUser(user) });
  });
});

// logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// поиск пользователей
router.get("/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [] });

  const like = `%${q}%`;
  db.all(
    `
    SELECT id, phone, name, username, created_at
    FROM users
    WHERE phone LIKE ? OR name LIKE ? OR username LIKE ?
    ORDER BY created_at DESC
    LIMIT 50
  `,
    [like, like, like],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json({ users: rows });
    }
  );
});

module.exports = router;
