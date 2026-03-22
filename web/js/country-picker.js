window.countries = [
    { flag: "🇷🇺", code: "+7", name: "Russia" },
    { flag: "🇰🇿", code: "+7", name: "Kazakhstan" },
    { flag: "🇺🇸", code: "+1", name: "United States" },
    { flag: "🇩🇪", code: "+49", name: "Germany" },
    { flag: "🇬🇧", code: "+44", name: "United Kingdom" },
    { flag: "🇺🇦", code: "+380", name: "Ukraine" },
    { flag: "🇫🇷", code: "+33", name: "France" },
    { flag: "🇮🇹", code: "+39", name: "Italy" },
    { flag: "🇪🇸", code: "+34", name: "Spain" },
    { flag: "🇨🇦", code: "+1", name: "Canada" },
];
function openCountryPickerOverlay(onSelect) {
    const overlay = document.createElement('div');
    overlay.className = 'country-picker-overlay';

    const box = document.createElement('div');
    box.className = 'country-picker';
    box.innerHTML = `
        <input class="search" placeholder="Поиск страны">
        <div class="items"></div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const items = box.querySelector('.items');
    const search = box.querySelector('.search');

    function render(filter = '') {
        items.innerHTML = '';
        window.countries
            .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(c => {
                const el = document.createElement('div');
                el.className = 'country-item';
                el.innerHTML = `
                    <span>${c.flag} ${c.name}</span>
                    <span class="code">${c.code}</span>
                `;
                el.onclick = () => {
                    onSelect(c);
                    overlay.remove();
                };
                items.appendChild(el);
            });
    }

    search.oninput = () => render(search.value);
    render();

    overlay.onclick = e => {
        if (e.target === overlay) overlay.remove();
    };
}
