import { state } from "./state.js";

const PHONE_KEY = "phone";
const USER_KEY = "user";

export function loadFromStorage() {
  let phone = null;
  let user = null;

  try {
    phone = localStorage.getItem(PHONE_KEY) || null;
    const raw = localStorage.getItem(USER_KEY);
    if (raw) user = JSON.parse(raw);
  } catch (e) {
    phone = null;
    user = null;
  }

  if (user && (!user.id || !user.username || !user.name || !user.phone)) {
    console.warn("Битый user в localStorage — очищаю");
    clearStorage();
    phone = null;
    user = null;
  }

  if (phone) state.fullPhone = phone;
  if (user) state.currentUser = user;

  return { phone, user };
}

export function savePhone(phone) {
  state.fullPhone = phone;
  localStorage.setItem(PHONE_KEY, phone);
}

export function saveUser(user) {
  state.currentUser = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStorage() {
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(USER_KEY);
  state.fullPhone = "";
  state.currentUser = null;
}
