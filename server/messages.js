const express = require("express");
const db = require("./db");

const router = express.Router();

// сообщения чата
router.get("/:chatId", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "unauthorized" });

  const chatId = parseInt(req.params.chatId, 10);
  if (!chatId) return res.status(400).json({ error: "invalid_chatId" });

  db.all(
    `
    SELECT m.id, m.chat_id, m.sender_id, u.name AS sender_name, u.username AS sender_username,
           m.content, m.created_at
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC
  `,
    [chatId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json({ messages: rows });
    }
  );
});

// отправка сообщения
router.post("/:chatId", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "unauthorized" });

  const chatId = parseInt(req.params.chatId, 10);
  const { content } = req.body || {};
  if (!chatId || !content) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const senderId = req.session.userId;

  db.run(
    "INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)",
    [chatId, senderId, content],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });

      const messageId = this.lastID;
      db.get(
        `
        SELECT m.id, m.chat_id, m.sender_id, u.name AS sender_name, u.username AS sender_username,
               m.content, m.created_at
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.id = ?
      `,
        [messageId],
        (e2, row) => {
          if (e2) return res.status(500).json({ error: "db_error" });

          // WebSocket уведомление
          if (req.app.locals.broadcastMessage) {
            req.app.locals.broadcastMessage(chatId, row);
          }

          res.json({ message: row });
        }
      );
    }
  );
});

module.exports = router;
