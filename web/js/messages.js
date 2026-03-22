const Messages = (() => {
  const selectors = {
    list: "#message-list",
    form: "#message-form",
    input: "#message-input",
  };

  async function loadMessages(chatId) {
    try {
      const { messages } = await API.getMessages(chatId);
      State.setMessages(chatId, messages);
      renderMessages(chatId);
    } catch {
      UI.showError("Не удалось загрузить сообщения");
    }
  }

  function renderMessages(chatId) {
    const container = document.querySelector(selectors.list);
    if (!container) return;

    const msgs = State.getMessages(chatId);
    container.innerHTML = "";

    msgs.forEach((m) => {
      const item = document.createElement("div");
      item.className = "message-item";

      const me = State.user && State.user.id === m.sender_id;
      item.classList.add(me ? "from-me" : "from-them");

      const name = m.sender_name || m.sender_username || "User";
      const text = document.createElement("div");
      text.className = "message-text";
      text.textContent = m.content;

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = name;

      item.appendChild(meta);
      item.appendChild(text);
      container.appendChild(item);
    });

    container.scrollTop = container.scrollHeight;
  }

  function setupSendForm() {
    const form = document.querySelector(selectors.form);
    const input = document.querySelector(selectors.input);
    if (!form || !input) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const chatId = State.currentChatId;
      if (!chatId) return;

      const content = input.value.trim();
      if (!content) return;

      input.value = "";

      try {
        const { message } = await API.sendMessage(chatId, content);
        State.addMessage(chatId, message);
        renderMessages(chatId);
      } catch {
        UI.showError("Не удалось отправить сообщение");
      }
    });

    WS.onMessage((msg) => {
      if (msg.type === "message") {
        const { chatId, message } = msg;
        State.addMessage(chatId, message);
        if (State.currentChatId === chatId) {
          renderMessages(chatId);
        }
      }
    });
  }

  return {
    loadMessages,
    renderMessages,
    setupSendForm,
  };
})();
