const API = (() => {
  const base = "";

  async function request(path, options = {}) {
    const res = await fetch(base + path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const err = (data && data.error) || "request_failed";
      throw new Error(err);
    }

    return data;
  }

  return {
    getMe() {
      return request("/api/users/me");
    },
    register(payload) {
      return request("/api/users/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    login(payload) {
      return request("/api/users/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    logout() {
      return request("/api/users/logout", { method: "POST" });
    },
    searchUsers(q) {
      const url = "/api/users/search?q=" + encodeURIComponent(q);
      return request(url);
    },
    getChats() {
      return request("/api/chats");
    },
    createDirectChat(otherUserId) {
      return request("/api/chats/direct", {
        method: "POST",
        body: JSON.stringify({ otherUserId }),
      });
    },
    getMessages(chatId) {
      return request(`/api/messages/${chatId}`);
    },
    sendMessage(chatId, content) {
      return request(`/api/messages/${chatId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
  };
})();
