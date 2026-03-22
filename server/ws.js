// ws.js
import { WebSocketServer } from "ws";
import { WS_PATH } from "./config.js";
import { addMessage } from "./messages.js";
import { getOrCreateChat } from "./chats.js";

const clients = new Map(); // userId -> Set(ws)

export function initWs(server) {
  const wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      ws.close();
      return;
    }

    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    ws.on("close", () => {
      const set = clients.get(userId);
      if (!set) return;
      set.delete(ws);
      if (!set.size) clients.delete(userId);
    });

    ws.on("message", async data => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "send") {
          const { to, text } = msg;
          if (!to || !text) return;

          const chat = await getOrCreateChat(Number(userId), Number(to));
          const saved = await addMessage(chat.id, Number(userId), text);

          const payload = JSON.stringify({
            type: "message",
            message: saved
          });

          broadcastToUser(userId, payload);
          broadcastToUser(String(to), payload);
        }
      } catch (e) {
        console.error("WS message error:", e);
      }
    });
  });
}

function broadcastToUser(userId, payload) {
  const set = clients.get(String(userId));
  if (!set) return;
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}
