// messages.js
// Идеальная логика сообщений: загрузка, отправка, синхронизация, рендер

import { apiGetMessages } from "./api.js";
import { state, appendMessage } from "./state.js";
import {
  saveMessages,
  addMessageToStorage
} from "./storage.js";
import { renderMessages } from "./ui.js";
import { wsSendMessage } from "./ws.js";

// DOM элементы
const msgInput = document.getElementById("msgInput");
const msgSendBtn = document.getElementById("msgSendBtn");

// Флаг, чтобы не было двойной загрузки
let loadingMessages = false;

// Инициализация
export function initMessages() {
  msgInput.addEventListener("input", () => {
    msgSendBtn.classList.toggle("hidden", !msgInput.value.trim());
  });

  msgSendBtn.onclick = sendMessage;
}

// -------------------------
// ЗАГРУЗКА ИСТОРИИ ЧАТА
// -------------------------

export async function loadMessages(chatId) {
  if (!chatId || !state.user) return;
  if (loadingMessages) return;

  loadingMessages = true;

  try {
    const list = await apiGetMessages(chatId, state.user.id);

    if (!Array.isArray(list)) {
      console.warn("Некорректный формат сообщений");
      return;
    }

    // Сохраняем в state
    state.messages[chatId] = list;

    // Сохраняем локально
    saveMessages(chatId, list);

    // Рендерим
    renderMessages();
  } catch (e) {
    console.error("Ошибка загрузки сообщений:", e);
  } finally {
    loadingMessages = false;
  }
}

// -------------------------
// ОТПРАВКА СООБЩЕНИЯ
// -------------------------

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  const chatId = state.currentChatId;
  if (!chatId) return;

  // Локальный оптимистичный рендер
  const tempMessage = {
    id: "temp_" + Date.now(),
    chat_id: chatId,
    sender_id: state.user.id,
    text,
    created_at: Date.now()
  };

  appendMessage(chatId, tempMessage);
  addMessageToStorage(chatId, tempMessage);
  renderMessages();

  // Очищаем поле
  msgInput.value = "";
  msgSendBtn.classList.add("hidden");

  // Отправляем через WebSocket
  try {
    wsSendMessage(chatId, text);
  } catch (e) {
    console.error("Ошибка отправки WS:", e);
  }
}

// -------------------------
// ПРИЁМ СООБЩЕНИЯ (вызывается из ws.js)
// -------------------------

export function onIncomingMessage(msg) {
  const chatId = msg.chat_id;

  appendMessage(chatId, msg);
  addMessageToStorage(chatId, msg);

  // Если открыт этот чат — обновляем UI
  if (state.currentChatId === chatId) {
    renderMessages();
  }
}
