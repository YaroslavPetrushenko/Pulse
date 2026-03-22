// ws.js
// WebSocket соединение

import { state, appendMessage } from "./state.js";
import { addMessageToStorage, upsertChatInStorage } from "./storage.js";
import { renderMessages, renderChats } from "./ui.js";

let reconnectTimer = null;

export function initWS() {
  if (!state.user) return;

  const url = `${location.origin.replace("http", "ws")}/ws?userId=${state.user.id}`;
  state.ws = new WebSocket(url);

  state.ws.onopen = () => {
    state.wsConnected = true;
    console.log("WS connected");
  };

  state.ws.onclose = () => {
    state.wsConnected = false;
    console.log("WS closed, reconnecting...");
    reconnect();
  };

  state.ws.onerror = () => {
    console.log("WS error");
  };

  state.ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data);

      if (data.type === "message") {
        const msg = data.message;
        appendMessage(msg.chat_id, msg);
        addMessageToStorage(msg.chat_id, msg);

        renderMessages();
        renderChats();
      }
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };
}

function reconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWS();
  }, 2000);
}

export function wsSendMessage(chatId, text) {
  if (!state.wsConnected) return;

  state.ws.send(
    JSON.stringify({
      type: "send",
      to: getPeerId(chatId),
      text
    })
  );
}

function getPeerId(chatId) {
  const chat = state.chats.find(c => c.id === chatId);
  return chat?.peerId;
}
