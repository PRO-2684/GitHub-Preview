async function registerSW() {
    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("./sw.js", {
            scope: "./",
        });
    }
}

function go() {
    const url = new URL(document.getElementById("url").value);
    const origin = url.origin;
    if (origin !== "https://raw.githubusercontent.com")
        alert("Only raw.githubusercontent.com is allowed");
    const path = url.pathname;
    location.href = `./${path}`;
}

registerSW();

const input = document.getElementById("url");
const button = document.getElementById("preview");

input.addEventListener("input", go);
button.addEventListener("click", go);
