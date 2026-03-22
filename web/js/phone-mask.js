function applyPhoneMask(input) {
    input.addEventListener("input", () => {
        // Оставляем только цифры
        let digits = input.value.replace(/\D/g, "");

        // Ограничиваем ровно 8 цифр
        if (digits.length > 8) {
            digits = digits.slice(0, 8);
        }

        input.value = digits;
    });
}
