const UsernameCheck = (() => {
  const selectors = {
    input: "#username-input",
    status: "#username-status",
  };

  let timer = null;
  let lastValue = "";

  function setStatus(text, color = "#888") {
    const el = document.querySelector(selectors.status);
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  }

  async function check(username) {
    if (!username || username.length < 3) {
      setStatus("Минимум 3 символа", "red");
      return;
    }

    try {
      const { users } = await API.searchUsers(username);

      const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());

      if (exists) {
        setStatus("Имя занято", "red");
      } else {
        setStatus("Имя свободно", "green");
      }
    } catch {
      setStatus("Ошибка проверки", "red");
    }
  }

  function setup() {
    const input = document.querySelector(selectors.input);
    if (!input) return;

    input.addEventListener("input", () => {
      const value = input.value.trim();
      lastValue = value;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (value === lastValue) {
          check(value);
        }
      }, 300);
    });
  }

  return { setup };
})();
