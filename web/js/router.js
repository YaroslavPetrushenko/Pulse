const Router = {
  showScreen(id) {
    document.querySelectorAll("[data-screen]").forEach((el) => {
      el.style.display = el.dataset.screen === id ? "block" : "none";
    });
  },
};
