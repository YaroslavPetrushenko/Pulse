const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { phone, name, username, password } = req.body || {};

  if (!phone || !name || !username || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    db.run(
      `
      INSERT INTO users (phone, name, username, password_hash)
      VALUES (?, ?, ?, ?)
      `,
      [phone, name, username, hash],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ error: "user_exists" });
          }
          return res.status(500).json({ error: "db_error" });
        }

        req.session.userId = this.lastID;
        res.json({ ok: true, userId: this.lastID });
      }
    );
  } catch (e) {
    res.status(500).json({ error: "hash_error" });
  }
});

// LOGIN
router.post("/login", (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  db.get(
    `
    SELECT id, password_hash
    FROM users
    WHERE phone = ?
    `,
    [phone],
    async (err, user) => {
      if (err) return res.status(500).json({ error: "db_error" });
      if (!user) return res.status(400).json({ error: "not_found" });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: "wrong_password" });

      req.session.userId = user.id;
      res.json({ ok: true, userId: user.id });
    }
  );
});

// ME
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  db.get(
    `
    SELECT id, phone, name, username
    FROM users
    WHERE id = ?
    `,
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json({ user });
    }
  );
});

module.exports = router;
