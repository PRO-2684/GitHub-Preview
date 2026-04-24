/**
 * @typedef {"branch" | "tag" | "commit"} GitRefType
 */

/**
 * Parsed Git reference information.
 * @typedef {{ type: GitRefType, value: string }} GitRef
 */

/**
 * Constructor input for a parsed GitHub link.
 * @typedef {{ user: string, repo: string, path: string, ref: GitRef }} GitHubLinkInit
 */

/**
 * Parsed info rendered on the landing page.
 * @typedef {{ repo: string, path: string, ref: string }} ParsedInfo
 */

/**
 * Register the service worker for local preview routing.
 * @returns {Promise<void>}
 */
async function registerSW() {
    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("./sw.js", {
            scope: "./",
        });
    }
}

class GitHubLink {
    /**
     * @param {GitHubLinkInit} options
     */
    constructor({ user, repo, path, ref }) {
        this.user = user;
        this.repo = repo;
        this.path = path;
        this.ref = ref;
    }

    /**
     * Parse a supported GitHub URL into a normalized link object.
     * @param {string} input
     * @returns {GitHubLink}
     */
    static parse(input) {
        const url = new URL(input);
        const parts = url.pathname.split("/").filter(Boolean);

        if (url.origin === "https://raw.githubusercontent.com") {
            return GitHubLink.parseRaw(parts);
        }

        if (url.origin === "https://github.com" && parts[2] === "blob") {
            return GitHubLink.parseBlob(parts);
        }

        throw new Error(
            "Only raw.githubusercontent.com and github.com/blob links are supported",
        );
    }

    /**
     * Parse a raw GitHub URL.
     * Supports both `refs/heads|tags/...` and direct commit paths.
     * @param {string[]} parts
     * @returns {GitHubLink}
     */
    static parseRaw(parts) {
        if (parts.length < 4) throw new Error("Invalid raw GitHub URL");

        const [user, repo, third, fourth, fifth, ...rest] = parts;

        if (third === "refs" && (fourth === "heads" || fourth === "tags")) {
            if (!fifth || rest.length === 0)
                throw new Error("Invalid raw GitHub URL");

            return new GitHubLink({
                user,
                repo,
                path: rest.join("/"),
                ref: {
                    type: fourth === "heads" ? "branch" : "tag",
                    value: fifth,
                },
            });
        }

        if (!fourth) throw new Error("Invalid raw GitHub URL");

        return new GitHubLink({
            user,
            repo,
            path: [fourth, fifth, ...rest].filter(Boolean).join("/"),
            ref: {
                type: "commit",
                value: third,
            },
        });
    }

    /**
     * Parse a `github.com/.../blob/...` URL.
     * Blob URLs only expose a branch-like ref or a commit SHA.
     * @param {string[]} parts
     * @returns {GitHubLink}
     */
    static parseBlob(parts) {
        const [user, repo, , refValue, ...pathParts] = parts;
        if (!user || !repo || !refValue || pathParts.length === 0) {
            throw new Error("Invalid GitHub blob URL");
        }

        return new GitHubLink({
            user,
            repo,
            path: pathParts.join("/"),
            ref: {
                type: /^[0-9a-f]{7,40}$/i.test(refValue) ? "commit" : "branch",
                value: refValue,
            },
        });
    }

    /**
     * Convert the normalized link back to the raw preview route.
     * @returns {string}
     */
    toRawPath() {
        const base = [this.user, this.repo];

        if (this.ref.type === "branch") {
            return [...base, "refs", "heads", this.ref.value, this.path].join(
                "/",
            );
        }

        if (this.ref.type === "tag") {
            return [...base, "refs", "tags", this.ref.value, this.path].join(
                "/",
            );
        }

        return [...base, this.ref.value, this.path].join("/");
    }

    /**
     * Format parsed fields for display in the landing page info section.
     * Branches are shown as `head (name)` to match the underlying raw route.
     * @returns {ParsedInfo}
     */
    toInfo() {
        const refType = this.ref.type === "branch" ? "head" : this.ref.type;

        return {
            repo: `${this.user}/${this.repo}`,
            path: `/${this.path}`,
            ref: `${refType} (${this.ref.value})`,
        };
    }
}

registerSW();

/** @type {HTMLInputElement} */
const input = document.getElementById("url");
/** @type {HTMLFormElement} */
const form = document.getElementById("preview-form");
/** @type {HTMLElement} */
const examples = document.getElementById("examples");
/** @type {HTMLElement} */
const infoRepo = document.getElementById("info-repo");
/** @type {HTMLElement} */
const infoPath = document.getElementById("info-path");
/** @type {HTMLElement} */
const infoRef = document.getElementById("info-ref");

/**
 * Render parsed info for the current input value.
 * Invalid or empty input falls back to the hint message.
 * @returns {void}
 */
function updateInfo() {
    const value = input.value.trim();

    if (!value) {
        infoRepo.textContent = "Waiting for input...";
        infoPath.textContent = "Waiting for input...";
        infoRef.textContent = "Waiting for input...";
        return;
    }

    try {
        const info = GitHubLink.parse(value).toInfo();
        infoRepo.textContent = info.repo;
        infoPath.textContent = info.path;
        infoRef.textContent = info.ref;
    } catch {
        infoRepo.textContent = "Invalid URL";
        infoPath.textContent = "Invalid URL";
        infoRef.textContent = "Invalid URL";
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
        const link = GitHubLink.parse(input.value.trim());
        location.href = `./${link.toRawPath()}`;
    } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
    }
});

examples.addEventListener("click", (event) => {
    const button = event.target.closest("[data-url]");
    if (!button) return;
    input.value = button.dataset.url;
    updateInfo();
    input.focus();
});

input.addEventListener("input", updateInfo);

document.addEventListener("keydown", (event) => {
    // Focus on Enter
    if (event.key === "Enter" && document.activeElement !== input) {
        input.focus();
        event.preventDefault();
    }
    // Clear / blur on Escape
    if (event.key === "Escape" && document.activeElement === input) {
        if (input.value) {
            input.value = "";
            updateInfo();
        } else {
            input.blur();
        }
        event.preventDefault();
    }
});

updateInfo();
