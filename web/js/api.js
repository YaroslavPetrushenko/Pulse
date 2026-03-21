import { CONFIG } from "./state.js";

const API = CONFIG.API;

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, data };
}

export async function apiCheckUser(phone) {
  return jsonFetch(API + "/api/checkUser?phone=" + encodeURIComponent(phone));
}

export async function apiCheckUsername(username) {
  return jsonFetch(API + "/api/checkUsername?u=" + encodeURIComponent(username));
}

export async function apiLogin(phone, password) {
  return jsonFetch(API + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password })
  });
}

export async function apiRegister({ phone, name, username, password }) {
  return jsonFetch(API + "/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, username, password })
  });
}

export async function apiGetChats(userId) {
  const { data } = await jsonFetch(API + "/api/chats?userId=" + userId);
  return data || [];
}

export async function apiGetMessages(chatId, userId) {
  const { data } = await jsonFetch(
    API + "/api/messages?chatId=" + chatId + "&userId=" + userId
  );
  return data || [];
}

export async function apiCreateChat(user1, user2) {
  return jsonFetch(API + "/api/createChat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1, user2 })
  });
}

export async function apiFindUser(q) {
  const { data } = await jsonFetch(
    API + "/api/findUser?q=" + encodeURIComponent(q)
  );
  return data || [];
}

export async function apiSearchMessages(userId, q) {
  const { data } = await jsonFetch(
    API +
      "/api/searchMessages?userId=" +
      userId +
      "&q=" +
      encodeURIComponent(q)
  );
  return data || [];
}
ы