function applyPhoneMask(input) {
    input.addEventListener("input", () => {
        // Оставляем только цифры
        let digits = input.value.replace(/\D/g, "");

        // Ограничиваем ровно 10 цифр
        if (digits.length > 10) {
            digits = digits.slice(0, 10);
        }

        input.value = digits;
    });
}
