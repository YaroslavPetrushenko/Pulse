// ui.js
// Управление экранами, рендер списков, рендер сообщений, мобильная логика

import { state, getMessagesForChat, getCurrentChat } from "./state.js";
import { saveTheme } from "./storage.js";

// ---------- ЭКРАНЫ ----------

const screens = {
  auth: document.getElementById("screen-auth"),
  chats: document.getElementById("screen-chats"),
  chat: document.getElementById("screen-chat"),
  profile: document.getElementById("screen-profile"),
  search: document.getElementById("screen-search"),
  settings: document.getElementById("screen-settings")
};

export function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ---------- МОБИЛЬНОЕ ПОВЕДЕНИЕ ----------

export function openChatMobile() {
  showScreen("chat");
}

export function closeChatMobile() {
  showScreen("chats");
}

// ---------- ТЕМА ----------

export function applyTheme() {
  if (state.theme === "auto") {
    document.body.classList.remove("theme-dark");
    return;
  }
  if (state.theme === "dark") {
    document.body.classList.add("theme-dark");
  } else {
    document.body.classList.remove("theme-dark");
  }
}

export function toggleTheme() {
  if (state.theme === "auto") {
    state.theme = "dark";
  } else if (state.theme === "dark") {
    state.theme = "light";
  } else {
    state.theme = "auto";
  }
  saveTheme(state.theme);
  applyTheme();
}

// ---------- РЕНДЕР ЧАТОВ ----------

const chatList = document.getElementById("chatList");

export function renderChats() {
  chatList.innerHTML = "";

  if (!state.chats.length) {
    chatList.innerHTML = `
      <div class="empty-state">
        <div>У вас пока нет чатов</div>
      </div>
    `;
    return;
  }

  for (const chat of state.chats) {
    const isDev = chat.peerUsername === "@&Developer&Official&";
    const isNatasha = chat.peerUsername?.toLowerCase().includes("natasha");

    const card = document.createElement("div");
    card.className = "chat-card";
    card.dataset.chatId = chat.id;

    card.innerHTML = `
      <div class="chat-avatar">
        ${chat.name[0] || "?"}
        ${isNatasha ? `<div class="natasha-dot"></div>` : ""}
      </div>

      <div class="chat-main">
        <div class="chat-row-top">
          <div class="chat-name ${isDev ? "chat-name-dev" : ""} ${isNatasha ? "chat-name-natasha" : ""}">
            ${chat.name}
          </div>
          <div class="chat-meta">
            <div class="chat-time">${chat.lastTime || ""}</div>
            ${chat.unread ? `<div class="chat-unread">${chat.unread}</div>` : ""}
          </div>
        </div>
        <div class="chat-last">${chat.lastMessage || ""}</div>
      </div>
    `;

    card.onclick = () => {
      openChatMobile();
      state.currentChatId = chat.id;
      renderChatHeader();
      renderMessages();
    };

    chatList.appendChild(card);
  }
}

// ---------- РЕНДЕР ШАПКИ ЧАТА ----------

export function renderChatHeader() {
  const chat = getCurrentChat();
  if (!chat) return;

  const isNatasha = chat.peerUsername?.toLowerCase().includes("natasha");

  document.getElementById("chatTitle").textContent = chat.name;
  document.getElementById("chatSubtitle").textContent = chat.peerUsername || "";
  document.getElementById("chatHeart").style.display = isNatasha ? "inline" : "none";
}

// ---------- РЕНДЕР СООБЩЕНИЙ ----------

const messagesList = document.getElementById("messagesList");

export function renderMessages() {
  const chatId = state.currentChatId;
  if (!chatId) return;

  const list = getMessagesForChat(chatId);
  messagesList.innerHTML = "";

  for (const msg of list) {
    const isMe = msg.sender_id === state.user.id;

    const row = document.createElement("div");
    row.className = "msg-row " + (isMe ? "me" : "other");

    row.innerHTML = `
      <div class="msg-bubble">${escapeHtml(msg.text)}</div>
    `;

    const meta = document.createElement("div");
    meta.className = "msg-meta " + (isMe ? "me" : "other");
    meta.innerHTML = `
      <span>${formatTime(msg.created_at)}</span>
      ${isMe ? `<span class="msg-checks read">✔✔</span>` : ""}
    `;

    messagesList.appendChild(row);
    messagesList.appendChild(meta);
  }

  messagesList.scrollTop = messagesList.scrollHeight;
}

// ---------- УТИЛИТЫ ----------

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m] || m
    );
  });
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
