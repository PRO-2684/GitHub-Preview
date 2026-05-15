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
    // Fetch (streaming)
    fetch("./lorem.txt")
        .then(async (response) => {
            if (!response.body) {
                throw new Error("ReadableStream not supported");
            }

            const status = document.getElementById("fetch-streaming");
            const totalBytes = Number(response.headers.get("Content-Length"));
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let receivedBytes = 0;
            let text = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                receivedBytes += value.byteLength;
                text += decoder.decode(value, { stream: true });
                if (Number.isFinite(totalBytes) && totalBytes > 0) {
                    const percent = Math.round((receivedBytes / totalBytes) * 100);
                    status.textContent = `🟡 Streaming... ${receivedBytes}/${totalBytes} bytes (${percent}%)`;
                } else {
                    status.textContent = `🟡 Streaming... ${receivedBytes} bytes`;
                }
            }
            text += decoder.decode();

            status.textContent =
                "🟢 Success! " + text.trim().slice(0, 120) + "...";
        })
        .catch((error) => {
            console.error("Streaming fetch error:", error);
            document.getElementById("fetch-streaming").textContent =
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
