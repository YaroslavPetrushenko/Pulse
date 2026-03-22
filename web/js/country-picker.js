const CountryPicker = (() => {
  const countries = [
    { code: "RU", name: "Россия", dial: "+7", flag: "🇷🇺" },
    { code: "UA", name: "Украина", dial: "+380", flag: "🇺🇦" },
    { code: "KZ", name: "Казахстан", dial: "+7", flag: "🇰🇿" },
    { code: "BY", name: "Беларусь", dial: "+375", flag: "🇧🇾" },
    { code: "GE", name: "Грузия", dial: "+995", flag: "🇬🇪" },
    { code: "AM", name: "Армения", dial: "+374", flag: "🇦🇲" },
    { code: "KG", name: "Киргизия", dial: "+996", flag: "🇰🇬" },
    { code: "UZ", name: "Узбекистан", dial: "+998", flag: "🇺🇿" },
    { code: "TJ", name: "Таджикистан", dial: "+992", flag: "🇹🇯" },
    { code: "TR", name: "Турция", dial: "+90", flag: "🇹🇷" },
    { code: "DE", name: "Германия", dial: "+49", flag: "🇩🇪" },
    { code: "PL", name: "Польша", dial: "+48", flag: "🇵🇱" },
    { code: "US", name: "США", dial: "+1", flag: "🇺🇸" },
  ];

  let picker = null;
  let phoneInput = null;

  function populate() {
    picker.innerHTML = "";
    countries.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.dial;
      opt.textContent = `${c.flag} ${c.name} (${c.dial})`;
      picker.appendChild(opt);
    });
  }

  function applyDialCode() {
    const dial = picker.value;
    if (!dial || !phoneInput) return;

    let raw = phoneInput.value.replace(/\D/g, "");
    raw = raw.replace(/^7/, ""); // убираем старый код
    raw = raw.replace(/^1/, "");
    raw = raw.replace(/^49/, "");

    phoneInput.value = dial + " " + raw;
  }

  function setup() {
    picker = document.querySelector("#country-picker");
    phoneInput = document.querySelector("[data-phone]");

    if (!picker || !phoneInput) return;

    populate();

    picker.addEventListener("change", () => {
      applyDialCode();
      PhoneMask.format(phoneInput);
    });

    phoneInput.addEventListener("focus", () => {
      if (!phoneInput.value.trim()) {
        applyDialCode();
        PhoneMask.format(phoneInput);
      }
    });
  }

  return { setup };
})();
