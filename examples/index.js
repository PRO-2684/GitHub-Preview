setTimeout(() => {
    // Fetch (relative path)
    fetch("./data.json")
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("fetch-relative").textContent =
                "🟢 Success! " + JSON.stringify(data);
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            document.getElementById("fetch-relative").textContent =
                "🔴 Failed: " + error.message;
        });
    // Fetch (absolute path)
    fetch("/data.json")
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("fetch-absolute").textContent =
                "🟢 Success! " + JSON.stringify(data);
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            document.getElementById("fetch-absolute").textContent =
                "🔴 Failed: " + error.message;
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
                swStatus.textContent = "🔴 Failed: " + error.message;
            });
    } else {
        swStatus.textContent = "🟡 Service Worker not supported!";
    }
}, 1000);
