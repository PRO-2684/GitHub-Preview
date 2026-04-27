const VERSION = "1777301053";
const CACHE_NAME = `github-preview-${VERSION}`;
const APP_RESOURCES = [
    "app.js",
    "index.html",
    "style.css",
    "favicon.svg",
    "manifest.json",
];

const ORIGIN = self.location.origin;
const PREFIX = self.location.pathname.split("/").slice(0, -1).join("/") + "/";
const CONTENT_TYPES = new Map([
    [".html", "text/html"],
    [".htm", "text/html"],
    [".js", "application/javascript"],
    [".mjs", "application/javascript"],
    [".jsonld", "application/ld+json"],
    [".json", "application/json"],
    [".webmanifest", "application/manifest+json"],
    [".css", "text/css"],
    [".svg", "image/svg+xml"],
    [".xml", "application/xml"],
    [".md", "text/markdown"],
]);

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(async (cache) => {
                console.info("Caching app resources...");
                await cache.addAll(APP_RESOURCES);
                console.info("App resources cached successfully.");
            })
            .catch((error) => {
                console.error("Cache installation failed:", error);
            }),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.info(`Deleting cache: ${name}`);
                        return caches.delete(name);
                    }
                }),
            );
        }),
    );
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
    if (parts.length === 1) {
        // If length = 1, it should be a request to the app itself
        let filename = parts[0];
        if (filename === "") {
            filename = "index.html"; // Normalize to index.html
            url.pathname += "index.html"; // Update URL for caching lookup
        }
        if (!APP_RESOURCES.includes(filename)) {
            return new Response("Not found", { status: 404 });
        }
        return caches
            .match(url, { ignoreSearch: true })
            .then((response) => response || fetchAndCache(request));
    } else if (parts.length < 4) {
        return new Response("Not found", { status: 404 });
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

async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        if (
            response &&
            (response.status === 200 ||
                response.status === 0 ||
                response.type === "basic")
        ) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response("You are offline", { status: 503 });
    }
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
