const State = (() => {
  let currentUser = null;
  let chats = [];
  let currentChatId = null;
  let messagesByChat = new Map();

  return {
    get user() {
      return currentUser;
    },
    setUser(u) {
      currentUser = u;
    },

    get chats() {
      return chats;
    },
    setChats(list) {
      chats = list || [];
    },

    get currentChatId() {
      return currentChatId;
    },
    setCurrentChatId(id) {
      currentChatId = id;
    },

    getMessages(chatId) {
      return messagesByChat.get(chatId) || [];
    },
    setMessages(chatId, msgs) {
      messagesByChat.set(chatId, msgs || []);
    },
    addMessage(chatId, msg) {
      const arr = messagesByChat.get(chatId) || [];
      arr.push(msg);
      messagesByChat.set(chatId, arr);
    },
  };
})();
