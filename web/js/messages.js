import { dom } from "./ui.js";
import { apiGetMessages } from "./api.js";
import { state } from "./state.js";

export function appendMessage(msg) {
  const row = document.createElement("div");
  row.className = "msg-row " + (msg.fromMe ? "me" : "other");
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = msg.text;
  row.appendChild(bubble);
  dom.messagesEl.appendChild(row);
  dom.messagesEl.scrollTop = dom.messagesEl.scrollHeight;
}

export async function loadMessagesForChat(chat) {
  dom.messagesEl.innerHTML = "";
  const list = await apiGetMessages(chat.id, state.currentUser.id);
  list.forEach((m) =>
    appendMessage({
      fromMe: m.sender_id === state.currentUser.id,
      text: m.text
    })
  );
}
ы