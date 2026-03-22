// api.js
// Надёжный слой общения с backend

const BASE_URL =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "";

const DEFAULT_TIMEOUT = 15000;

async function withTimeout(promise, ms = DEFAULT_TIMEOUT) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function request(path, options = {}) {
  const url = BASE_URL + path;

  try {
    const res = await withTimeout(
      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        credentials: "include",
        ...options
      })
    );

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const err = new Error("API error");
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (e) {
    console.error("API request failed:", path, e);
    throw e;
  }
}

// ---------- AUTH ----------

export function apiCheckUser(phone) {
  if (!phone) return Promise.reject(new Error("phone_required"));
  const q = encodeURIComponent(phone);
  return request(`/api/checkUser?phone=${q}`);
}

export function apiCheckUsername(username) {
  if (!username) return Promise.reject(new Error("username_required"));
  const q = encodeURIComponent(username.trim());
  return request(`/api/checkUsername?u=${q}`);
}

export function apiLogin(phone, password) {
  if (!phone || !password) {
    return Promise.reject(new Error("missing_credentials"));
  }
  return request("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone, password })
  });
}

export function apiRegister({ phone, name, username, password }) {
  if (!phone || !name || !username || !password) {
    return Promise.reject(new Error("missing_fields"));
  }
  return request("/api/register", {
    method: "POST",
    body: JSON.stringify({ phone, name, username, password })
  });
}

// ---------- CHATS ----------

export function apiGetChats() {
  return request(`/api/chats`);
}

export function apiCreateChat(peerId) {
  if (!peerId) {
    return Promise.reject(new Error("peer_required"));
  }
  return request("/api/chats/with", {
    method: "POST",
    body: JSON.stringify({ peerId })
  });
}

// ---------- MESSAGES ----------

export function apiGetMessages(chatId, userId) {
  if (!chatId || !userId) {
    return Promise.reject(new Error("missing_params"));
  }
  const qChat = encodeURIComponent(chatId);
  const qUser = encodeURIComponent(userId);
  return request(`/api/messages?chatId=${qChat}&userId=${qUser}`);
}

// ---------- SEARCH ----------

export function apiFindUser(query) {
  const q = (query || "").trim();
  if (!q) return Promise.resolve([]);
  return request(`/api/users/search?q=${encodeURIComponent(q)}`);
}

export function apiSearchMessages(userId, query) {
  const q = (query || "").trim();
  if (!userId || !q) return Promise.resolve([]);
  return request(
    `/api/searchMessages?userId=${encodeURIComponent(
      userId
    )}&q=${encodeURIComponent(q)}`
  );
}
