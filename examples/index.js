setTimeout(() => {
    fetch("./data.json")
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("output").textContent =
                JSON.stringify(data);
        });
}, 1000);
