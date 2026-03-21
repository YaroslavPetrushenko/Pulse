import { DEV_PHONE, DEV_USERNAME, state } from "./state.js";

export const dom = {
  screens: {},
  countrySelect: null,
  phoneCodeSpan: null,
  phoneLocalInput: null,
  btnPhoneNext: null,
  authTitle: null,
  authPhoneText: null,
  authExisting: null,
  authNew: null,
  authPassword: null,
  regName: null,
  regUsername: null,
  usernameStatus: null,
  regPassword: null,
  btnLogin: null,
  btnRegister: null,
  backToPhone1: null,
  backToPhone2: null,
  sidebarUser: null,
  chatListEl: null,
  chatTitle: null,
  chatSub: null,
  mainEmpty: null,
  messagesEl: null,
  msgInput: null,
  msgSend: null,
  logoutLink: null,
  searchInput: null
};

export function initDom() {
  dom.screens = {
    phone: document.getElementById("screen-phone"),
    auth: document.getElementById("screen-auth"),
    main: document.getElementById("screen-main")
  };

  dom.countrySelect = document.getElementById("countrySelect");
  dom.phoneCodeSpan = document.getElementById("phoneCode");
  dom.phoneLocalInput = document.getElementById("phoneLocal");
  dom.btnPhoneNext = document.getElementById("btnPhoneNext");

  dom.authTitle = document.getElementById("authTitle");
  dom.authPhoneText = document.getElementById("authPhoneText");
  dom.authExisting = document.getElementById("authExisting");
  dom.authNew = document.getElementById("authNew");
  dom.authPassword = document.getElementById("authPassword");
  dom.regName = document.getElementById("regName");
  dom.regUsername = document.getElementById("regUsername");
  dom.usernameStatus = document.getElementById("usernameStatus");
  dom.regPassword = document.getElementById("regPassword");
  dom.btnLogin = document.getElementById("btnLogin");
  dom.btnRegister = document.getElementById("btnRegister");
  dom.backToPhone1 = document.getElementById("backToPhone1");
  dom.backToPhone2 = document.getElementById("backToPhone2");

  dom.sidebarUser = document.getElementById("sidebarUser");
  dom.chatListEl = document.getElementById("chatList");
  dom.chatTitle = document.getElementById("chatTitle");
  dom.chatSub = document.getElementById("chatSub");
  dom.mainEmpty = document.getElementById("mainEmpty");
  dom.messagesEl = document.getElementById("messages");
  dom.msgInput = document.getElementById("msgInput");
  dom.msgSend = document.getElementById("msgSend");
  dom.logoutLink = document.getElementById("logoutLink");
  dom.searchInput = document.getElementById("searchInput");
}

export function showScreen(name) {
  Object.values(dom.screens).forEach((s) => (s.style.display = "none"));
  dom.screens[name].style.display = "flex";
}

export function normalizePhone(code, local) {
  return code + local.replace(/\D/g, "");
}

export function resetAuthFields() {
  state.fullPhone = "";
  dom.authPassword.value = "";
  dom.regName.value = "";
  dom.regUsername.value = "";
  dom.regPassword.value = "";
  dom.usernameStatus.textContent = "";
  dom.usernameStatus.className = "";
}

export function updateAuthPhoneText() {
  dom.authPhoneText.textContent = "Номер: " + state.fullPhone;
}

export function setupAuthScreen(exists) {
  updateAuthPhoneText();
  if (exists) {
    dom.authTitle.textContent = "Вход";
    dom.authExisting.style.display = "flex";
    dom.authNew.style.display = "none";
  } else {
    dom.authTitle.textContent = "Регистрация";
    dom.authExisting.style.display = "none";
    dom.authNew.style.display = "flex";
  }
}

export function updateSidebarUser() {
  const u = state.currentUser;
  if (!u) {
    dom.sidebarUser.textContent = "";
    dom.sidebarUser.classList.remove("sidebar-user-dev");
    return;
  }

  const uname = u.username ? "@" + u.username : "";
  dom.sidebarUser.textContent =
    u.name + (uname ? " · " + uname : " · " + u.phone);

  if (u.isDeveloper || u.username === DEV_USERNAME || u.phone === DEV_PHONE) {
    dom.sidebarUser.classList.add("sidebar-user-dev");
    dom.sidebarUser.textContent += " · DEV";
  } else {
    dom.sidebarUser.classList.remove("sidebar-user-dev");
  }
}

export function setChatHeader(chat) {
  if (!chat) {
    dom.chatTitle.textContent = "Нет чата";
    dom.chatTitle.classList.remove("main-header-title-dev");
    dom.chatTitle.style.color = "";
    dom.chatSub.textContent = "Выберите контакт, чтобы начать общение";
    dom.mainEmpty.style.display = "flex";
    dom.messagesEl.style.display = "none";
    dom.msgInput.disabled = true;
    dom.msgSend.disabled = true;
    return;
  }

  dom.chatTitle.textContent = chat.name;
  dom.chatTitle.classList.remove("main-header-title-dev");
  dom.chatTitle.style.color = "";

  if (chat.peerUsername === DEV_USERNAME) {
    dom.chatTitle.style.color = "#ff8c00";
    dom.chatTitle.classList.add("main-header-title-dev");
  } else if (chat.peerUsername === "NatashaLove") {
    dom.chatTitle.style.color = "#ff4fa3";
  }

  dom.chatSub.textContent = chat.peerUsername ? "@" + chat.peerUsername : "";
  dom.mainEmpty.style.display = "none";
  dom.messagesEl.style.display = "block";
  dom.msgInput.disabled = false;
  dom.msgSend.disabled = false;
}
