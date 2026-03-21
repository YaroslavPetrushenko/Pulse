import { initDom, showScreen, updateSidebarUser } from "./ui.js";
import { loadFromStorage, clearStorage } from "./storage.js";
import { state } from "./state.js";
import { initAuthHandlers } from "./auth.js";
import { renderChatList, selectChat } from "./chats.js";
import { connectWs, closeWs, sendWsMessage } from "./ws.js";
import { dom } from "./ui.js";
import { handleSearchInput } from "./search.js";

export async function initMainScreen() {
  updateSidebarUser();
  await renderChatList();
  await selectChat(null);
}

export async function bootstrap() {
  initDom();
  initAuthHandlers();
  initMainEvents();

  const { phone, user } = loadFromStorage();

  if (!phone || !user) {
    showScreen("phone");
    return;
  }

  try {
    const res = await fetch(
      "https://pulse-production-1a74.up.railway.app/api/checkUser?phone=" +
        encodeURIComponent(user.phone)
    );
    const data = await res.json();
    if (!data.exists) {
      console.warn("Пользователь отсутствует на сервере — сбрасываю");
      clearStorage();
      showScreen("phone");
      return;
    }
  } catch (e) {
    console.warn("Ошибка проверки пользователя — сбрасываю");
    clearStorage();
    showScreen("phone");
    return;
  }

  state.currentUser = user;
  await initMainScreen();
  connectWs();
  showScreen("main");
}

function initMainEvents() {
  dom.msgSend.addEventListener("click", () => {
    const text = dom.msgInput.value.trim();
    if (!text || !state.currentChat) return;
    sendWsMessage(state.currentChat.peerId, text);
    import("./messages.js").then(({ appendMessage }) => {
      appendMessage({ fromMe: true, text });
    });
    dom.msgInput.value = "";
  });

  dom.msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      dom.msgSend.click();
    }
  });

  dom.logoutLink.addEventListener("click", () => {
    clearStorage();
    state.currentUser = null;
    state.currentChat = null;
    closeWs();
    showScreen("phone");
  });

  dom.searchInput.addEventListener("input", () => {
    if (!state.currentUser) return;
    handleSearchInput();
  });
}
