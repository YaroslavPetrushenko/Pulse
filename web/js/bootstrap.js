// bootstrap.js
// Точка входа фронтенда

import { loadStorage } from "./storage.js";
import { state } from "./state.js";
import { initAuth } from "./auth.js";
import { initMessages } from "./messages.js";
import { initSearch } from "./search.js";
import { initWS } from "./ws.js";
import { applyTheme, showScreen } from "./ui.js";
import { loadChats } from "./chats.js";

window.addEventListener("DOMContentLoaded", async () => {
  loadStorage();
  applyTheme();

  initAuth();
  initMessages();
  initSearch();

  if (state.user) {
    showScreen("chats");
    await loadChats();
    initWS();
  } else {
    showScreen("auth");
  }
});
