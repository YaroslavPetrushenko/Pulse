function checkUsername(input, indicator) {
    let timer = null;

    input.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const username = input.value.trim();
            if (!username) return;

            const res = await fetch(`/api/check-username?u=${username}`).then(r => r.json());

            if (res.exists) {
                indicator.textContent = "Занято";
                indicator.style.color = "red";
            } else {
                indicator.textContent = "Свободно";
                indicator.style.color = "green";
            }
        }, 300);
    };
}
