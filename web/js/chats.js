// chats.js
// Работа со списком чатов

import { apiGetChats, apiCreateChat } from "./api.js";
import { state, setCurrentChat } from "./state.js";
import { saveChats, upsertChatInStorage } from "./storage.js";
import {
  renderChats,
  renderChatHeader,
  renderMessages,
  openChatMobile
} from "./ui.js";

export async function loadChats() {
  if (!state.user) return;

  try {
    const res = await apiGetChats();
    if (!Array.isArray(res)) return;

    state.chats = res;
    saveChats(res);
    renderChats();
  } catch (e) {
    console.error("Ошибка загрузки чатов:", e);
  }
}

export async function openChatWithUser(peerId) {
  if (!peerId) return;

  try {
    const chat = await apiCreateChat(peerId);
    if (!chat || !chat.id) return;

    upsertChatInStorage(chat);
    setCurrentChat(chat.id);

    renderChats();
    renderChatHeader();
    renderMessages();
    openChatMobile();
  } catch (e) {
    console.error("Ошибка создания/открытия чата:", e);
  }
}
