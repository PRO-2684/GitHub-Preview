const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createGitHubRawUrl,
    createPlayerUrl,
    getMediaType,
    parseMediaUrl,
} = require("../media.js");

test("classifies configured video extensions case-insensitively", () => {
    for (const extension of ["webm", "ogv", "mkv", "mp4", "mov"]) {
        assert.equal(getMediaType(`/media/file.${extension}`), "video");
        assert.equal(getMediaType(`/media/file.${extension.toUpperCase()}`), "video");
    }
});

test("classifies configured audio extensions case-insensitively", () => {
    for (const extension of [
        "mp3",
        "flac",
        "ogg",
        "opus",
        "wav",
        "m4a",
        "aac",
    ]) {
        assert.equal(getMediaType(`/media/file.${extension}`), "audio");
        assert.equal(getMediaType(`/media/file.${extension.toUpperCase()}`), "audio");
    }
});

test("does not classify unsupported paths", () => {
    assert.equal(getMediaType("/index.html"), null);
    assert.equal(getMediaType("/video.mp4.txt"), null);
    assert.equal(getMediaType("/no-extension"), null);
});

test("ignores query and fragment suffixes while classifying", () => {
    assert.equal(getMediaType("/demo.mp4?download=1"), "video");
    assert.equal(getMediaType("/song.ogg#preview"), "audio");
});

test("normalizes raw GitHub media URLs through the LFS-aware route", () => {
    const result = parseMediaUrl(
        "https://raw.githubusercontent.com/user/repo/main/media/demo.mp4?raw=1#start",
    );

    assert.equal(result.type, "video");
    assert.equal(
        result.url.href,
        "https://github.com/user/repo/raw/main/media/demo.mp4?raw=1#start",
    );
});

test("accepts GitHub raw routes without changing them", () => {
    const result = parseMediaUrl(
        "https://github.com/user/repo/raw/main/media/demo.mp4",
    );

    assert.equal(result.type, "video");
    assert.equal(
        result.url.href,
        "https://github.com/user/repo/raw/main/media/demo.mp4",
    );
});

test("creates an encoded player URL relative to the app", () => {
    assert.equal(
        createPlayerUrl(
            "https://raw.githubusercontent.com/user/repo/main/demo.mp4?raw=1",
            "https://example.com/GitHub-Preview/",
        ),
        "https://example.com/GitHub-Preview/player.html?url=https%3A%2F%2Fraw.githubusercontent.com%2Fuser%2Frepo%2Fmain%2Fdemo.mp4%3Fraw%3D1",
    );
});

test("creates an LFS-aware raw URL from a preview path", () => {
    assert.equal(
        createGitHubRawUrl(
            "user/repo/refs/heads/main/media/demo.mp4",
            "?download=1",
        ),
        "https://github.com/user/repo/raw/refs/heads/main/media/demo.mp4?download=1",
    );
});

test("does not create raw URLs for unsupported preview paths", () => {
    assert.equal(
        createGitHubRawUrl("user/repo/refs/heads/main/index.html"),
        null,
    );
    assert.equal(createGitHubRawUrl("invalid.mp4"), null);
});

test("rejects missing, non-raw, and unsupported media URLs", () => {
    assert.throws(() => parseMediaUrl(""), /Missing media URL/);
    assert.throws(
        () => parseMediaUrl("https://example.com/demo.mp4"),
        /GitHub raw URL/,
    );
    assert.throws(
        () => parseMediaUrl("http://raw.githubusercontent.com/u/r/main/a.mp4"),
        /GitHub raw URL/,
    );
    assert.throws(
        () =>
            parseMediaUrl(
                "https://raw.githubusercontent.com/u/r/main/index.html",
            ),
        /Unsupported media extension/,
    );
});
