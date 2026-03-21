import { CONFIG, state } from "./state.js";
import { appendMessage } from "./messages.js";

export function connectWs() {
  if (!state.currentUser) return;
  if (state.ws && state.ws.readyState === WebSocket.OPEN) return;

  const url = CONFIG.WS_URL + "/?userId=" + state.currentUser.id;
  const ws = new WebSocket(url);
  state.ws = ws;

  ws.onopen = () => {
    console.log("WS connected");
  };

  ws.onclose = () => {
    console.log("WS closed, retry...");
    state.ws = null;
    setTimeout(() => {
      if (state.currentUser) connectWs();
    }, 2000);
  };

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.type === "message") {
        const m = data.message;
        if (!state.currentChat || m.chat_id !== state.currentChat.id) return;
        appendMessage({
          fromMe: m.sender_id === state.currentUser.id,
          text: m.text
        });
      }
    } catch (e) {
      console.error("WS parse error", e);
    }
  };
}

export function sendWsMessage(toUserId, text) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(
    JSON.stringify({
      type: "send",
      to: toUserId,
      text
    })
  );
}

export function closeWs() {
  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }
}
