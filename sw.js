const ORIGIN = self.location.origin;
const PREFIX = self.location.pathname.split("/").slice(0, -1).join("/") + "/";

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== ORIGIN) return; // Only handle same-origin requests
    event.respondWith(handleSameOriginRequest(event.request, url));
});

async function handleSameOriginRequest(request, url) {
    // Strip prefix
    const path = url.pathname.replace(PREFIX, "");

    // Split: owner/repo/(commit|refs/heads|refs/tags)/...
    const parts = path.split("/");
    if (parts.length < 4) {
        // If length < 4, it should be a request to the app itself, so we don't modify it
        return fetch(request);
    }

    const [owner, repo, ...rest] = parts;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join("/")}`;

    // Fetch original
    const res = await fetch(rawUrl);
    if (!res.ok) return res;

    // Return with inferred content type
    const newHeaders = new Headers(res.headers);
    newHeaders.set("Content-Type", inferType(rest[rest.length - 1]));
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
    });
}

function inferType(path) {
    // TODO: better MIME inference
    if (path.endsWith(".html")) return "text/html";
    if (path.endsWith(".js")) return "application/javascript";
    if (path.endsWith(".json")) return "application/json";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
    return "text/plain";
}
