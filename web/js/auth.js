const Auth = (() => {
  const selectors = {
    loginForm: "#login-form",
    registerForm: "#register-form",
    logoutBtn: "#logout-btn",
  };

  async function initSession() {
    try {
      const { user } = await API.getMe();
      if (user) {
        State.setUser(user);
        Storage.saveUser(user);
        UI.showApp();
        await Chats.loadChats();
      } else {
        const cached = Storage.loadUser();
        if (cached) {
          State.setUser(cached);
          UI.showApp();
          await Chats.loadChats();
        } else {
          UI.showAuth();
        }
      }
    } catch {
      UI.showAuth();
    }
  }

  function setupForms() {
    const loginForm = document.querySelector(selectors.loginForm);
    const registerForm = document.querySelector(selectors.registerForm);
    const logoutBtn = document.querySelector(selectors.logoutBtn);

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = loginForm.querySelector("input[name=phone]").value.trim();
        const password = loginForm.querySelector("input[name=password]").value.trim();

        try {
          const { user } = await API.login({ phone, password });
          State.setUser(user);
          Storage.saveUser(user);
          UI.showApp();
          await Chats.loadChats();
        } catch (err) {
          UI.showError("Неверный телефон или пароль");
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = registerForm.querySelector("input[name=phone]").value.trim();
        const name = registerForm.querySelector("input[name=name]").value.trim();
        const username = registerForm.querySelector("input[name=username]").value.trim();
        const password = registerForm.querySelector("input[name=password]").value.trim();

        try {
          const { user } = await API.register({ phone, name, username, password });
          State.setUser(user);
          Storage.saveUser(user);
          UI.showApp();
          await Chats.loadChats();
        } catch (err) {
          if (String(err.message).includes("user_exists")) {
            UI.showError("Пользователь с таким телефоном или username уже существует");
          } else {
            UI.showError("Ошибка регистрации");
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await API.logout();
        } catch {}
        State.setUser(null);
        Storage.saveUser(null);
        UI.showAuth();
      });
    }
  }

  async function setup() {
    setupForms();
    await initSession();
  }

  return {
    setup,
  };
})();
