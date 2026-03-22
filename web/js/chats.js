const Chats = (() => {
  const selectors = {
    list: "#chat-list",
  };

  async function loadChats() {
    try {
      const { chats } = await API.getChats();
      State.setChats(chats);
      renderChats();
    } catch {
      UI.showError("Не удалось загрузить чаты");
    }
  }

  function renderChats() {
    const container = document.querySelector(selectors.list);
    if (!container) return;

    const chats = State.chats;
    container.innerHTML = "";

    chats.forEach((chat) => {
      const item = document.createElement("div");
      item.className = "chat-item";
      item.dataset.chatId = chat.id;

      const title = chat.title || "Диалог #" + chat.id;
      item.textContent = title;

      item.addEventListener("click", async () => {
        State.setCurrentChatId(chat.id);
        UI.highlightChat(chat.id);
        await Messages.loadMessages(chat.id);
        WS.subscribeChat(chat.id);
      });

      container.appendChild(item);
    });
  }

  return {
    loadChats,
    renderChats,
  };
})();
