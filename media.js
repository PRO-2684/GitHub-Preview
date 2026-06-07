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

    const url = new URL(input);
    if (
        url.protocol !== "https:" ||
        url.hostname !== "raw.githubusercontent.com"
    ) {
        throw new Error("Expected an HTTPS raw GitHub URL");
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

const MediaPreview = {
    mediaExtensions,
    getMediaType,
    parseMediaUrl,
    createPlayerUrl,
};

if (typeof module !== "undefined") {
    module.exports = MediaPreview;
}
if (typeof window !== "undefined") {
    window.MediaPreview = MediaPreview;
}
