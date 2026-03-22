function applyPhoneMask(input, countryCode) {
    input.oninput = () => {
        let digits = input.value.replace(/\D/g, "");
        input.value = countryCode + " " + digits;
    };
}
