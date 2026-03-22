const WebSocket = require("ws");
const cookie = require("cookie");
const session = require("express-session");
const { sessionSecret } = require("./config");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  const sessionParser = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  });

  server.on("upgrade", (req, socket, head) => {
    sessionParser(req, {}, () => {
      if (!req.session || !req.session.userId) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.userId = req.session.userId;
        wss.emit("connection", ws, req);
      });
    });
  });

  const clientsByChat = new Map();

  function subscribe(ws, chatId) {
    const id = String(chatId);
    if (!clientsByChat.has(id)) clientsByChat.set(id, new Set());
    clientsByChat.get(id).add(ws);

    ws._subs = ws._subs || new Set();
    ws._subs.add(id);
  }

  function unsubscribe(ws) {
    if (!ws._subs) return;
    ws._subs.forEach((id) => {
      const set = clientsByChat.get(id);
      if (set) {
        set.delete(ws);
        if (!set.size) clientsByChat.delete(id);
      }
    });
  }

  function broadcastMessage(chatId, message) {
    const id = String(chatId);
    const set = clientsByChat.get(id);
    if (!set) return;

    const payload = JSON.stringify({
      type: "message",
      chatId,
      message,
    });

    set.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
  }

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (msg.type === "subscribe") {
        subscribe(ws, msg.chatId);
      }
    });

    ws.on("close", () => unsubscribe(ws));
  });

  return { wss, broadcastMessage };
}

module.exports = setupWebSocket;
