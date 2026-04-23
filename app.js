async function registerSW() {
    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("./sw.js", {
            scope: "./",
        });
    }
}

registerSW();

function go() {
    const path = document.getElementById("url").value;
    location.href = `./${path}`;
}
