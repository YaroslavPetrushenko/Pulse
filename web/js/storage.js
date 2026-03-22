// storage.js
// Надёжная работа с localStorage + синхронизация со state

import {
  state,
  resetState,
  upsertChat,
  appendMessage
} from "./state.js";

const STORAGE_VERSION = 1;
const PREFIX = "pulse_v" + STORAGE_VERSION + "_";

const KEY_USER = PREFIX + "user";
const KEY_CHATS = PREFIX + "chats";
const KEY_MESSAGES = PREFIX + "messages";
const KEY_THEME = PREFIX + "theme";
const KEY_SEARCH = PREFIX + "search_history";

function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function loadStorage() {
  state.isRestoring = true;

  const user = safeParse(localStorage.getItem(KEY_USER), null);
  const chats = safeParse(localStorage.getItem(KEY_CHATS), []);
  const messages = safeParse(localStorage.getItem(KEY_MESSAGES), {});
  const theme = localStorage.getItem(KEY_THEME) || "auto";
  const history = safeParse(localStorage.getItem(KEY_SEARCH), []);

  if (user && user.id && user.phone) {
    state.user = user;
  }

  if (Array.isArray(chats)) {
    state.chats = chats;
  }

  if (messages && typeof messages === "object") {
    state.messages = messages;
  }

  if (theme === "light" || theme === "dark" || theme === "auto") {
    state.theme = theme;
  }

  if (Array.isArray(history)) {
    state.searchHistory = history.filter(q => typeof q === "string" && q.trim());
  }

  state.isRestoring = false;
}

export function saveUser(user) {
  if (!user || !user.id) return;
  state.user = user;
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function saveChats(chats) {
  if (!Array.isArray(chats)) return;
  state.chats = chats;
  localStorage.setItem(KEY_CHATS, JSON.stringify(chats));
}

export function saveMessages(chatId, list) {
  if (!chatId) return;
  if (!Array.isArray(list)) return;
  state.messages[chatId] = list;
  localStorage.setItem(KEY_MESSAGES, JSON.stringify(state.messages));
}

export function addMessageToStorage(chatId, message) {
  appendMessage(chatId, message);
  localStorage.setItem(KEY_MESSAGES, JSON.stringify(state.messages));
}

export function upsertChatInStorage(chat) {
  upsertChat(chat);
  localStorage.setItem(KEY_CHATS, JSON.stringify(state.chats));
}

export function saveTheme(theme) {
  if (!["auto", "light", "dark"].includes(theme)) return;
  state.theme = theme;
  localStorage.setItem(KEY_THEME, theme);
}

export function saveSearchHistory(history) {
  if (!Array.isArray(history)) return;
  const cleaned = history
    .map(q => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean)
    .slice(-5);
  state.searchHistory = cleaned;
  localStorage.setItem(KEY_SEARCH, JSON.stringify(cleaned));
}

export function clearStorage() {
  resetState();
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
