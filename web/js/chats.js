import { dom, setChatHeader } from "./ui.js";
import { apiGetChats, apiCreateChat } from "./api.js";
import { state, DEV_USERNAME } from "./state.js";
import { loadMessagesForChat } from "./messages.js";

export async function loadChatsFromServer() {
  const chats = await apiGetChats(state.currentUser.id);
  state.allChats = chats || [];
  return state.allChats;
}

export function renderChatItemFromChat(chat) {
  const item = document.createElement("div");
  item.className = "chat-item";
  item.onclick = () => selectChat(chat);

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = chat.name ? chat.name[0] : "?";

  const meta = document.createElement("div");
  meta.className = "chat-meta";

  const top = document.createElement("div");
  top.className = "chat-top";

  const name = document.createElement("div");
  name.className = "chat-name";
  name.textContent = chat.name;

  if (chat.peerUsername === DEV_USERNAME) {
    name.classList.add("chat-name-dev");
  } else if (chat.peerUsername === "NatashaLove") {
    name.classList.add("chat-name-natasha");
  } else {
    name.classList.add("chat-name-normal");
  }

  const time = document.createElement("div");
  time.className = "chat-time";
  time.textContent = chat.lastTime || "";

  top.appendChild(name);
  top.appendChild(time);

  const bottom = document.createElement("div");
  bottom.className = "chat-bottom";
  bottom.textContent = chat.lastMessage || "";

  meta.appendChild(top);
  meta.appendChild(bottom);

  item.appendChild(avatar);
  item.appendChild(meta);

  return item;
}

export async function renderChatList() {
  await loadChatsFromServer();

  dom.chatListEl.innerHTML = "";

  if (!state.allChats.length) {
    dom.chatListEl.textContent = "У вас пока нет чатов";
    dom.chatListEl.style.color = "var(--text-soft)";
    return;
  }

  const label = document.createElement("div");
  label.className = "section-label";
  label.textContent = "Чаты";
  dom.chatListEl.appendChild(label);

  state.allChats.forEach((chat) => {
    dom.chatListEl.appendChild(renderChatItemFromChat(chat));
  });
}

export async function selectChat(chat) {
  state.currentChat = chat;

  if (!chat) {
    setChatHeader(null);
    return;
  }

  setChatHeader(chat);
  await loadMessagesForChat(chat);
}

export async function openOrCreateChatWithUser(user) {
  const existing = await apiGetChats(state.currentUser.id);
  let found = existing.find((c) => c.peerId === user.id);

  if (!found) {
    const { ok, data } = await apiCreateChat(state.currentUser.id, user.id);
    if (!ok) {
      alert("Не удалось создать чат");
      return;
    }
    found = data;
  }

  state.allChats = existing;
  if (!state.allChats.find((c) => c.id === found.id)) {
    state.allChats.push(found);
  }

  await selectChat(found);
}
