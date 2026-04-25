# GitHub-Preview

Preview HTML files directly from GitHub without cloning.

## Usage

1. Visit [GitHub-Preview](https://pro-2684.github.io/GitHub-Preview/) once. (Registers [service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker))
2. Paste the raw/blob link in the input box on the homepage and submit. Alternatively, replace `https://raw.githubusercontent.com/` with `https://pro-2684.github.io/GitHub-Preview/` and visit the URL.

Here's a few examples:

- [Bootstrap's page](https://pro-2684.github.io/GitHub-Preview/twbs/bootstrap/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
    - [Blob](https://github.com/twbs/bootstrap/blob/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
    - [Raw](https://raw.githubusercontent.com/twbs/bootstrap/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
- [A Comprehensive Example](https://pro-2684.github.io/GitHub-Preview/PRO-2684/GitHub-Preview/raw/refs/heads/main/examples/index.html)
    - [Blob](https://github.com/PRO-2684/GitHub-Preview/blob/main/examples/index.html)
    - [Raw](https://raw.githubusercontent.com/PRO-2684/GitHub-Preview/refs/heads/main/examples/index.html)

## How it works

This project uses a Service Worker as a client-side proxy:

1. Requests under `GitHub-Preview/...` are intercepted by the Service Worker.
2. The path is mapped to `raw.githubusercontent.com/...`.
3. The Service Worker fetches the original content.
4. It fixes `Content-Type` (e.g. `text/plain` → `text/html`)
5. Returns the modified response to the browser.

Because all requests (including those triggered by scripts like `fetch("./data.json")`) go through the Service Worker, runtime resource loading works transparently.

## Comparison

Key differences between this project and other popular solutions:

| Approach | Description |
|----------|------------|
| This project | Intercepts **all network requests** via Service Worker and remaps them |
| [raw.githack.com](https://raw.githack.com/) | Uses a **server-side proxy** to serve corrected responses |
| [htmlpreview](https://htmlpreview.github.io/) | Rewrites **HTML content only**, cannot intercept runtime behavior |

Detailed feature comparison:

| Feature | This project | [raw.githack.com](https://raw.githack.com/) | [htmlpreview](https://htmlpreview.github.io/) |
|--------|-------------|------------------|-------------|
| Architecture | Client-side (Service Worker) | Server-side proxy | Client + Server (optional proxy fallback) |
| Mechanism | Network interception | Server Proxy | HTML rewrite |
| Backend-free | 🟢 | 🔴 | 🟡 (proxy fallback) |
| Fix `Content-Type` | 🟢 | 🟢 | 🟢 |
| Static assets (`<img>`, `<script>`, `<link>`) | 🟢 | 🟢 | 🟢 |
| Runtime requests (`fetch`, XHR) | 🟢 | 🟢 | 🔴 |
| Dynamic resources | 🟢 | 🟢 | 🔴 |
| Relative path handling | 🟢 (request remapping) | 🟢 | 🟡 (`<base>` + rewriting) |
| Reliability | High | Depends on service | High |

## Caveats

- Some websites may use absolute paths (e.g. `/assets/style.css`). This will error.
- Since service workers cannot intercept other service workers' scripts, so the service workers on the previewed page won't work.

## Credits

- [htmlpreview](https://htmlpreview.github.io/)

## TODO

- [ ] Asset caching and offline support
    - [ ] Cache assets of this app
    - [ ] Cache assets of the previewed page (user control?)
