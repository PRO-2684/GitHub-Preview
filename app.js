async function registerSW() {
    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("./sw.js", {
            scope: "./",
        });
    }
}

class GitHubLink {
    constructor({ user, repo, path, ref }) {
        this.user = user;
        this.repo = repo;
        this.path = path;
        this.ref = ref;
    }

    static parse(input) {
        const url = new URL(input);
        const parts = url.pathname.split("/").filter(Boolean);

        if (url.origin === "https://raw.githubusercontent.com") {
            return GitHubLink.parseRaw(parts);
        }

        if (url.origin === "https://github.com" && parts[2] === "blob") {
            return GitHubLink.parseBlob(parts);
        }

        throw new Error("Only raw.githubusercontent.com and github.com/blob links are supported");
    }

    static parseRaw(parts) {
        if (parts.length < 4) throw new Error("Invalid raw GitHub URL");

        const [user, repo, third, fourth, fifth, ...rest] = parts;

        if (third === "refs" && (fourth === "heads" || fourth === "tags")) {
            if (!fifth || rest.length === 0) throw new Error("Invalid raw GitHub URL");

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

    toRawPath() {
        const base = [this.user, this.repo];

        if (this.ref.type === "branch") {
            return [...base, "refs", "heads", this.ref.value, this.path].join("/");
        }

        if (this.ref.type === "tag") {
            return [...base, "refs", "tags", this.ref.value, this.path].join("/");
        }

        return [...base, this.ref.value, this.path].join("/");
    }
}

registerSW();

const input = document.getElementById("url");
const form = document.getElementById("preview-form");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
        const link = GitHubLink.parse(input.value.trim());
        location.href = `./${link.toRawPath()}`;
    } catch (error) {
        alert(error.message);
    }
});
