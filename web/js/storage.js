const Storage = (() => {
  const KEY_USER = "pulse_user";

  function saveUser(user) {
    if (!user) {
      localStorage.removeItem(KEY_USER);
    } else {
      localStorage.setItem(KEY_USER, JSON.stringify(user));
    }
  }

  function loadUser() {
    const raw = localStorage.getItem(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return {
    saveUser,
    loadUser,
  };
})();
