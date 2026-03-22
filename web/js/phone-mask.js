const PhoneMask = {
  format(input) {
    let v = input.value.replace(/\D/g, "");
    if (!v) {
      input.value = "";
      return;
    }

    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) v = "7" + v;

    let res = "+7 ";
    if (v.length > 1) res += "(" + v.slice(1, 4);
    if (v.length >= 4) res += ") " + v.slice(4, 7);
    if (v.length >= 7) res += "-" + v.slice(7, 9);
    if (v.length >= 9) res += "-" + v.slice(9, 11);

    input.value = res;
  },

  setup() {
    document.querySelectorAll("[data-phone]").forEach((input) => {
      input.addEventListener("input", () => PhoneMask.format(input));
      input.addEventListener("blur", () => PhoneMask.format(input));
    });
  },
};
