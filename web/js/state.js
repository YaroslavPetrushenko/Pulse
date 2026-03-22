// state.js
// Единый источник правды в памяти приложения

export const state = {
  user: null,          // { id, phone, name, username, isDeveloper }
  chats: [],           // [{ id, peerId, name, peerUsername, lastMessage, lastTime }]
  messages: Object.create(null), // messages[chatId] = [ {id, chat_id, sender_id, text, created_at} ]
  currentChatId: null,
  ws: null,
  wsConnected: false,
  theme: "auto",       // auto | light | dark
  searchHistory: [],   // [string]
  isRestoring: false   // флаг восстановления из storage
};

export function resetState() {
  state.user = null;
  state.chats = [];
  state.messages = Object.create(null);
  state.currentChatId = null;
  state.ws = null;
  state.wsConnected = false;
  state.theme = "auto";
  state.searchHistory = [];
  state.isRestoring = false;
}

export function setCurrentChat(chatId) {
  state.currentChatId = chatId;
}

export function getCurrentChat() {
  if (!state.currentChatId) return null;
  return state.chats.find(c => c.id === state.currentChatId) || null;
}

export function getMessagesForChat(chatId) {
  return state.messages[chatId] || [];
}

export function upsertChat(chat) {
  const idx = state.chats.findIndex(c => c.id === chat.id);
  if (idx === -1) {
    state.chats.unshift(chat);
  } else {
    state.chats[idx] = { ...state.chats[idx], ...chat };
  }
}

export function appendMessage(chatId, message) {
  if (!state.messages[chatId]) {
    state.messages[chatId] = [];
  }
  state.messages[chatId].push(message);
}
