const ORIGIN = self.location.origin;
const PREFIX = self.location.pathname.split("/").slice(0, -1).join("/") + "/";
const CONTENT_TYPES = new Map([
    [".html", "text/html"],
    [".js", "application/javascript"],
    [".json", "application/json"],
    [".css", "text/css"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
]);

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
    newHeaders.set(
        "Content-Type",
        fixMIME(rest[rest.length - 1], res.headers.get("Content-Type")),
    );
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
    });
}

function fixMIME(path, contentType = "") {
    const [origMIME, ...params] = contentType.split(";");
    if (origMIME && origMIME.trim() !== "text/plain") {
        return contentType; // If the original MIME is not text/plain, we trust it
    }
    const ext = path.slice(path.lastIndexOf("."));
    const newMIME = CONTENT_TYPES.get(ext) || "text/plain";
    return [newMIME, ...params].join(";").trim();
}
