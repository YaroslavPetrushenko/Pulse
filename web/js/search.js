const Search = (() => {
  const selectors = {
    input: "#search-input",
    results: "#search-results",
  };

  let lastQuery = "";
  let timer = null;

  function setup() {
    const input = document.querySelector(selectors.input);
    if (!input) return;

    input.addEventListener("input", () => {
      const q = input.value.trim();
      lastQuery = q;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!q) {
          renderResults([]);
          return;
        }
        doSearch(q);
      }, 300);
    });
  }

  async function doSearch(q) {
    try {
      const { users } = await API.searchUsers(q);
      if (q !== lastQuery) return;
      renderResults(users);
    } catch {
      // тихо
    }
  }

  function renderResults(users) {
    const container = document.querySelector(selectors.results);
    if (!container) return;

    container.innerHTML = "";
    if (!users || !users.length) return;

    users.forEach((u) => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.textContent = `${u.name} (@${u.username})`;

      item.addEventListener("click", async () => {
        try {
          const { chatId } = await API.createDirectChat(u.id);
          await Chats.loadChats();
          State.setCurrentChatId(chatId);
          UI.highlightChat(chatId);
          await Messages.loadMessages(chatId);
          WS.subscribeChat(chatId);
        } catch {
          UI.showError("Не удалось открыть диалог");
        }
      });

      container.appendChild(item);
    });
  }

  return {
    setup,
  };
})();
