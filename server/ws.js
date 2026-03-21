const WebSocket = require("ws");
const { db, getOrCreateChat } = require("./db");

function initWs(server) {
  const wss = new WebSocket.Server({ server });
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

              const wsFrom = wsClients.get(fromId);
              if (wsFrom && wsFrom.readyState === WebSocket.OPEN) {
                wsFrom.send(JSON.stringify({ type: "message", message }));
              }

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

  return wss;
}

module.exports = {
  initWs
};
