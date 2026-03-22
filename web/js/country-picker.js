const countries = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  // добавлю все страны позже
];

function openCountryPicker(onSelect) {
    const list = document.createElement("div");
    list.className = "country-picker";

    list.innerHTML = `
        <input class="search" placeholder="Search country">
        <div class="items"></div>
    `;

    document.body.appendChild(list);

    const items = list.querySelector(".items");
    const search = list.querySelector(".search");

    function render(filter = "") {
        items.innerHTML = "";
        countries
            .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(c => {
                const el = document.createElement("div");
                el.className = "country-item";
                el.innerHTML = `${c.flag} ${c.name} <span>${c.code}</span>`;
                el.onclick = () => {
                    onSelect(c);
                    list.remove();
                };
                items.appendChild(el);
            });
    }

    search.oninput = () => render(search.value);
    render();
}
