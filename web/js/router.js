const Router = {
    current: null,

    async go(screen, params = {}) {
        const container = document.getElementById("app");

        // Загружаем HTML экрана
        const html = await fetch(`/screens/${screen}.html`).then(r => r.text());

        // Анимация исчезновения старого экрана
        if (this.current) {
            container.classList.add("slide-out");
            await new Promise(r => setTimeout(r, 200));
        }

        container.innerHTML = html;
        this.current = screen;

        // Анимация появления нового экрана
        container.classList.remove("slide-out");
        container.classList.add("slide-in");
        setTimeout(() => container.classList.remove("slide-in"), 200);

        // Инициализация логики экрана
        if (window.ScreenInit && window.ScreenInit[screen]) {
            window.ScreenInit[screen](params);
        }
    }
};
