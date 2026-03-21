import { dom, normalizePhone, setupAuthScreen, resetAuthFields, updateAuthPhoneText } from "./ui.js";
import { state, DEV_PHONE, DEV_USERNAME } from "./state.js";
import { apiCheckUser, apiCheckUsername, apiLogin, apiRegister } from "./api.js";
import { savePhone, saveUser, clearStorage } from "./storage.js";
import { initMainScreen } from "./bootstrap.js";
import { connectWs } from "./ws.js";

let usernameTimer = null;

export function initAuthHandlers() {
  dom.countrySelect.addEventListener("change", () => {
    const code = dom.countrySelect.selectedOptions[0].dataset.code;
    dom.phoneCodeSpan.textContent = code;
  });

  dom.btnPhoneNext.addEventListener("click", onPhoneNext);
  dom.backToPhone1.onclick = dom.backToPhone2.onclick = () => {
    resetAuthFields();
    clearStorage();
    showPhoneScreen();
  };

  dom.regUsername.oninput = onUsernameInput;
  dom.btnLogin.addEventListener("click", onLogin);
  dom.btnRegister.addEventListener("click", onRegister);
}

function showPhoneScreen() {
  state.fullPhone = "";
  dom.phoneLocalInput.value = "";
  dom.phoneCodeSpan.textContent =
    dom.countrySelect.selectedOptions[0].dataset.code || "+7";
  dom.authPassword.value = "";
  resetAuthFields();
  import("./ui.js").then(({ showScreen }) => showScreen("phone"));
}

async function onPhoneNext() {
  const code = dom.countrySelect.selectedOptions[0].dataset.code;
  const local = dom.phoneLocalInput.value.trim();
  if (!local) return;

  state.fullPhone = normalizePhone(code, local);
  savePhone(state.fullPhone);

  try {
    const { data } = await apiCheckUser(state.fullPhone);
    setupAuthScreen(data && data.exists);
    import("./ui.js").then(({ showScreen }) => showScreen("auth"));
  } catch (e) {
    console.error(e);
    alert("Ошибка сервера");
  }
}

function onUsernameInput() {
  const u = dom.regUsername.value.trim();

  if (!u) {
    dom.usernameStatus.textContent = "";
    dom.usernameStatus.className = "";
    return;
  }

  if (u === DEV_USERNAME && state.fullPhone === DEV_PHONE) {
    dom.usernameStatus.textContent = "Уникальное имя разработчика";
    dom.usernameStatus.className = "username-status-dev";
    return;
  }

  if (!/^[a-z0-9_]{5,32}$/i.test(u)) {
    dom.usernameStatus.textContent =
      "Спец-символы запрещены. Только латиница, цифры и _ (минимум 5 символов)";
    dom.usernameStatus.className = "username-status-error";
    return;
  }

  dom.usernameStatus.textContent = "Проверяем...";
  dom.usernameStatus.className = "";
  clearTimeout(usernameTimer);
  usernameTimer = setTimeout(checkUsernameRemote, 300);
}

async function checkUsernameRemote() {
  const u = dom.regUsername.value.trim();
  if (!u) return;

  try {
    const { data } = await apiCheckUsername(u);

    if (data.dev) {
      dom.usernameStatus.textContent = "Уникальное имя разработчика";
      dom.usernameStatus.className = "username-status-dev";
    } else if (data.invalid && data.reason === "spec_symbols_forbidden") {
      dom.usernameStatus.textContent =
        "Спец-символы запрещены. Только латиница, цифры и _ (минимум 5 символов)";
      dom.usernameStatus.className = "username-status-error";
    } else if (data.available) {
      dom.usernameStatus.textContent = "Имя свободно";
      dom.usernameStatus.className = "username-status-ok";
    } else {
      dom.usernameStatus.textContent = "Имя занято";
      dom.usernameStatus.className = "username-status-error";
    }
  } catch (e) {
    console.error(e);
    dom.usernameStatus.textContent = "Ошибка проверки";
    dom.usernameStatus.className = "username-status-error";
  }
}

async function onLogin() {
  const pass = dom.authPassword.value.trim();
  if (!pass) return;

  try {
    const { ok, data } = await apiLogin(state.fullPhone, pass);
    if (!ok) {
      alert("Неверный пароль или номер");
      return;
    }

    state.currentUser = data.user;
    saveUser(state.currentUser);

    await initMainScreen();
    connectWs();
    import("./ui.js").then(({ showScreen }) => showScreen("main"));
  } catch (e) {
    console.error(e);
    alert("Ошибка сервера");
  }
}

async function onRegister() {
  const name = dom.regName.value.trim();
  const username = dom.regUsername.value.trim();
  const pass = dom.regPassword.value.trim();

  if (!name || !username || !pass) {
    alert("Заполните все поля");
    return;
  }

  if (state.fullPhone === DEV_PHONE) {
    if (username !== DEV_USERNAME) {
      alert("Для этого номера доступно только имя " + DEV_USERNAME);
      return;
    }
  } else {
    if (!/^[a-z0-9_]{5,32}$/i.test(username)) {
      alert(
        "Спец-символы запрещены. Только латиница, цифры и _ (минимум 5 символов)"
      );
      return;
    }
  }

  try {
    const { ok, data } = await apiRegister({
      phone: state.fullPhone,
      name,
      username,
      password: pass
    });

    if (!ok) {
      if (data?.error === "user_exists") {
        alert("Аккаунт с таким номером уже существует, попробуйте войти");
      } else if (data?.error === "username_taken") {
        alert("Имя пользователя уже занято");
      } else if (data?.error === "invalid_username") {
        alert("Некорректный username");
      } else if (data?.error === "dev_username_required") {
        alert("Для этого номера доступно только имя " + DEV_USERNAME);
      } else {
        alert("Ошибка регистрации");
      }
      return;
    }

    state.currentUser = data.user;
    saveUser(state.currentUser);

    await initMainScreen();
    connectWs();
    import("./ui.js").then(({ showScreen }) => showScreen("main"));
  } catch (e) {
    console.error(e);
    alert("Ошибка сервера");
  }
}
