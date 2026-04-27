// Dummy service worker file that just logs a message to the console when it is installed and activated.
self.addEventListener("install", (event) => {
    console.log("Service worker installed");
});

self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
});
