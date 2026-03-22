const UI = (() => {
  const selectors = {
    authScreen: "#auth-screen",
    appScreen: "#app-screen",
    errorBar: "#error-bar",
    chatList: "#chat-list",
  };

  function showAuth() {
    const auth = document.querySelector(selectors.authScreen);
    const app = document.querySelector(selectors.appScreen);
    if (auth) auth.style.display = "block";
    if (app) app.style.display = "none";
  }

  function showApp() {
    const auth = document.querySelector(selectors.authScreen);
    const app = document.querySelector(selectors.appScreen);
    if (auth) auth.style.display = "none";
    if (app) app.style.display = "flex";
  }

  function showError(msg) {
    const bar = document.querySelector(selectors.errorBar);
    if (!bar) return;
    bar.textContent = msg;
    bar.style.opacity = "1";
    setTimeout(() => {
      bar.style.opacity = "0";
    }, 3000);
  }

  function highlightChat(chatId) {
    const list = document.querySelector(selectors.chatList);
    if (!list) return;
    list.querySelectorAll(".chat-item").forEach((el) => {
      if (String(el.dataset.chatId) === String(chatId)) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  async function init() {
    WS.connect();
  }

  return {
    showAuth,
    showApp,
    showError,
    highlightChat,
    init,
  };
})();
