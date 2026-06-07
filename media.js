const mediaExtensions = {
    // https://www.chromium.org/audio-video/
    video: ["webm", "ogv", "mkv", "mp4", "mov"],
    audio: ["mp3", "flac", "ogg", "opus", "wav", "m4a", "aac"],
};

/**
 * Classify a path using its final filename extension.
 * @param {string} path
 * @returns {"video" | "audio" | null}
 */
function getMediaType(path) {
    const cleanPath = path.split(/[?#]/, 1)[0];
    const extension = cleanPath.split(".").pop()?.toLowerCase();
    if (!extension || extension === cleanPath.toLowerCase()) return null;

    for (const [type, extensions] of Object.entries(mediaExtensions)) {
        if (extensions.includes(extension)) return type;
    }
    return null;
}

/**
 * Validate a raw GitHub media URL.
 * @param {string} input
 * @returns {{ type: "video" | "audio", url: URL }}
 */
function parseMediaUrl(input) {
    if (!input) throw new Error("Missing media URL");

    let url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);

    if (url.origin === "https://raw.githubusercontent.com") {
        const [owner, repo, ...rest] = parts;
        if (!owner || !repo || rest.length < 2) {
            throw new Error("Expected an HTTPS GitHub raw URL");
        }

        const resolvedUrl = new URL(
            `https://github.com/${owner}/${repo}/raw/${rest.join("/")}`,
        );
        resolvedUrl.search = url.search;
        resolvedUrl.hash = url.hash;
        url = resolvedUrl;
    } else if (
        url.origin !== "https://github.com" ||
        parts[2] !== "raw" ||
        parts.length < 5
    ) {
        throw new Error("Expected an HTTPS GitHub raw URL");
    }

    const type = getMediaType(url.pathname);
    if (!type) throw new Error("Unsupported media extension");

    return { type, url };
}

/**
 * Build the standalone player URL.
 * @param {string} mediaUrl
 * @param {string} baseUrl
 * @returns {string}
 */
function createPlayerUrl(mediaUrl, baseUrl) {
    const playerUrl = new URL("player.html", baseUrl);
    playerUrl.searchParams.set("url", mediaUrl);
    return playerUrl.href;
}

/**
 * Convert a service-worker preview path to GitHub's LFS-aware raw route.
 * @param {string} path
 * @param {string} [search]
 * @returns {string | null}
 */
function createGitHubRawUrl(path, search = "") {
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 4 || !getMediaType(parts.at(-1))) return null;

    const [owner, repo, ...rest] = parts;
    const url = new URL(
        `https://github.com/${owner}/${repo}/raw/${rest.join("/")}`,
    );
    url.search = search;
    return url.href;
}

/**
 * Select the service-worker redirect target for a media request.
 * @param {string} path
 * @param {string} appBaseUrl
 * @param {string} search
 * @param {boolean} isNavigation
 * @returns {string | null}
 */
function createMediaRedirectUrl(path, appBaseUrl, search, isNavigation) {
    const mediaUrl = createGitHubRawUrl(path, search);
    if (!mediaUrl) return null;
    return isNavigation ? createPlayerUrl(mediaUrl, appBaseUrl) : mediaUrl;
}

const MediaPreview = {
    mediaExtensions,
    getMediaType,
    parseMediaUrl,
    createPlayerUrl,
    createGitHubRawUrl,
    createMediaRedirectUrl,
};

if (typeof module !== "undefined") {
    module.exports = MediaPreview;
}
globalThis.MediaPreview = MediaPreview;
