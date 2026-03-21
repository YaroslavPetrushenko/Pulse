const { db, getUserById, getOrCreateChat } = require("./db");

// /api/createChat
function registerCreateChatRoute(app) {
  app.post("/api/createChat", async (req, res) => {
    const { user1, user2 } = req.body || {};

    if (!user1 || !user2) {
      return res.status(400).json({ error: "missing_params" });
    }

    try {
      const chat = await getOrCreateChat(user1, user2);

      const peerId = chat.user1_id === user1 ? chat.user2_id : chat.user1_id;
      const peer = await getUserById(peerId);

      if (!peer) {
        return res.status(500).json({ error: "peer_not_found" });
      }

      const result = {
        id: chat.id,
        peerId: peer.id,
        name: peer.name || peer.username || "Пользователь",
        peerUsername: peer.username,
        lastMessage: "",
        lastTime: ""
      };

      res.json(result);
    } catch (err) {
      console.error("createChat error:", err);
      res.status(500).json({ error: "server_error" });
    }
  });
}

// /api/chats
function registerChatsListRoute(app) {
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

        const result = rows.map((r) => ({
          id: r.id,
          peerId: r.peer_id,
          name: r.peer_name || r.peer_username || "Пользователь",
          peerUsername: r.peer_username,
          lastMessage: r.last_message || "",
          lastTime: r.last_time
            ? new Date(r.last_time).toLocaleTimeString()
            : ""
        }));

        res.json(result);
      }
    );
  });
}

function registerChatRoutes(app) {
  registerCreateChatRoute(app);
  registerChatsListRoute(app);
}

module.exports = {
  registerChatRoutes
};
