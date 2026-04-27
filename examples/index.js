setTimeout(() => {
    // Fetch (relative path)
    fetch("./data.json")
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("fetch-relative").textContent =
                JSON.stringify(data);
        });
    // Fetch (absolute path)
    fetch("/data.json")
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("fetch-absolute").textContent =
                JSON.stringify(data);
        });
    // Service Worker registration
    const swStatus = document.getElementById("service-worker");
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("./sw.js")
            .then((registration) => {
                swStatus.textContent = "🟢 Success!";
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
                swStatus.textContent = "🔴 Failed!";
            });
    } else {
        swStatus.textContent = "🟡 Service Worker not supported!";
    }
}, 1000);
