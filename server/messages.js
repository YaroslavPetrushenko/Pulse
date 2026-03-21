const { db } = require("./db");

// /api/messages
function registerMessagesRoute(app) {
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
}

// /api/searchMessages
function registerSearchMessagesRoute(app) {
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

        const result = rows.map((r) => ({
          id: r.id,
          chatId: r.chat_id,
          text: r.text,
          snippet:
            r.text.length > 80 ? r.text.slice(0, 77) + "..." : r.text,
          peerName: r.peer_name || r.peer_username || "Пользователь",
          peerUsername: r.peer_username
        }));

        res.json(result);
      }
    );
  });
}

function registerMessageRoutes(app) {
  registerMessagesRoute(app);
  registerSearchMessagesRoute(app);
}

module.exports = {
  registerMessageRoutes
};
