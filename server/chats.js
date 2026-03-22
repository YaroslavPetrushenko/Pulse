const express = require("express");
const db = require("./db");

const router = express.Router();

// список чатов пользователя
router.get("/", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "unauthorized" });

  const userId = req.session.userId;

  db.all(
    `
    SELECT c.id, c.title, c.is_direct, c.created_at
    FROM chats c
    JOIN chat_members m ON m.chat_id = c.id
    WHERE m.user_id = ?
    ORDER BY c.created_at DESC
  `,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json({ chats: rows });
    }
  );
});

// создать direct‑чат с другим пользователем
router.post("/direct", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "unauthorized" });

  const userId = req.session.userId;
  const { otherUserId } = req.body || {};
  if (!otherUserId) return res.status(400).json({ error: "missing_otherUserId" });

  db.get(
    `
    SELECT c.id
    FROM chats c
    JOIN chat_members m1 ON m1.chat_id = c.id AND m1.user_id = ?
    JOIN chat_members m2 ON m2.chat_id = c.id AND m2.user_id = ?
    WHERE c.is_direct = 1
  `,
    [userId, otherUserId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "db_error" });
      if (row) return res.json({ chatId: row.id });

      db.run(
        "INSERT INTO chats (title, is_direct) VALUES (?, 1)",
        [null],
        function (e2) {
          if (e2) return res.status(500).json({ error: "db_error" });

          const chatId = this.lastID;
          const stmt = db.prepare(
            "INSERT INTO chat_members (chat_id, user_id, role) VALUES (?, ?, ?)"
          );
          stmt.run(chatId, userId, "member");
          stmt.run(chatId, otherUserId, "member", (e3) => {
            if (e3) return res.status(500).json({ error: "db_error" });
            res.json({ chatId });
          });
        }
      );
    }
  );
});

module.exports = router;
