// auth.js
// Логика входа и регистрации

import { apiCheckUser, apiLogin, apiRegister } from "./api.js";
import { saveUser } from "./storage.js";
import { state } from "./state.js";
import { showScreen } from "./ui.js";

const phoneInput = document.getElementById("phoneInput");
const btnAuthNext = document.getElementById("btnAuthNext");

export function initAuth() {
  btnAuthNext.onclick = onAuthNext;
}

async function onAuthNext() {
  const phone = phoneInput.value.trim();
  if (!phone) return alert("Введите номер телефона");

  try {
    const check = await apiCheckUser(phone);

    if (check.exists) {
      // Пользователь существует → логин
      const password = prompt("Введите пароль:");
      if (!password) return;

      const res = await apiLogin(phone, password);
      if (!res.user) return alert("Неверный пароль");

      saveUser(res.user);
      state.user = res.user;

      showScreen("chats");
    } else {
      // Регистрация
      const name = prompt("Ваше имя:");
      const username = prompt("Юзернейм:");
      const password = prompt("Пароль:");

      if (!name || !username || !password) {
        return alert("Все поля обязательны");
      }

      const reg = await apiRegister({ phone, name, username, password });
      if (!reg.user) return alert("Ошибка регистрации");

      saveUser(reg.user);
      state.user = reg.user;

      showScreen("chats");
    }
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения");
  }
}
