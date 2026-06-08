# GitHub-Preview

Preview HTML and media files directly from GitHub without cloning. [No backend. No privacy concerns.](#how-it-works)

## 📖 Usage

1. Visit [GitHub-Preview](https://pro-2684.github.io/GitHub-Preview/) once. (Registers [service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker))
2. Paste the raw/blob link in the input box on the landing page and submit. HTML files open through the preview proxy; supported video and audio files open in a native media player. Alternatively, replace `https://raw.githubusercontent.com/` with `https://pro-2684.github.io/GitHub-Preview/` and visit the URL.

Share links with `?url=...&preview=1` so the landing page can install the service worker before opening the preview.

Media type is selected by extension:

- Video: `webm`, `ogv`, `mkv`, `mp4`, `mov`
- Audio: `mp3`, `flac`, `ogg`, `opus`, `wav`, `m4a`, `aac`

The landing page opens recognized media in the player.

Here's a few examples you can try:

- [Bootstrap's page](https://pro-2684.github.io/GitHub-Preview/?url=https%3A%2F%2Fgithub.com%2Ftwbs%2Fbootstrap%2Fblob%2F0d0ca30f5db73cceb456597c78b3c8750263c2d5%2F2.3.2%2Findex.html&preview=1)
    - [Blob](https://github.com/twbs/bootstrap/blob/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
    - [Raw](https://raw.githubusercontent.com/twbs/bootstrap/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
- [A Comprehensive Example](https://pro-2684.github.io/GitHub-Preview/?url=https%3A%2F%2Fraw.githubusercontent.com%2FPRO-2684%2FGitHub-Preview%2Frefs%2Fheads%2Fmain%2Fexamples%2Findex.html&preview=1)
    - [Blob](https://github.com/PRO-2684/GitHub-Preview/blob/main/examples/index.html)
    - [Raw](https://raw.githubusercontent.com/PRO-2684/GitHub-Preview/refs/heads/main/examples/index.html)
- [Aria Math (`audio`)](https://pro-2684.github.io/GitHub-Preview/?url=https%3A%2F%2Fgithub.com%2FInventivetalentDev%2Fminecraft-assets%2Fblob%2F26.1.2%2Fassets%2Fminecraft%2Fsounds%2Fmusic%2Fgame%2Fcreative%2Faria_math.ogg&preview=1)
    - [Blob](https://github.com/InventivetalentDev/minecraft-assets/blob/26.1.2/assets/minecraft/sounds/music/game/creative/aria_math.ogg)
    - [Raw](https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1.2/assets/minecraft/sounds/music/game/creative/aria_math.ogg)
- [Blinding Lights (`video`)](https://pro-2684.github.io/GitHub-Preview/?url=https%3A%2F%2Fgithub.com%2FPRO-2684%2FGitHub-Preview%2Fblob%2Fmain%2Fexamples%2Fdata%2F4NRXx6U8ABQ.mp4&preview=1)
    - [Blob](https://github.com/PRO-2684/GitHub-Preview/blob/main/examples/data/4NRXx6U8ABQ.mp4)
    - [Raw](https://raw.githubusercontent.com/PRO-2684/GitHub-Preview/refs/heads/main/examples/data/4NRXx6U8ABQ.mp4)

## ⚙️ Integrations

- [GitHub Preview (UserScript)](./integrations/userscript/): Adds preview button on code viewer.

## 🤔 How it works

This project uses a Service Worker as a client-side proxy:

1. Requests under `GitHub-Preview/...` are intercepted by the Service Worker.
2. The path is mapped to `raw.githubusercontent.com/...`.
3. The Service Worker fetches the original content.
4. It fixes `Content-Type` (e.g. `text/plain` → `text/html`)
5. Returns the modified response to the browser.

Because all requests (including those triggered by scripts like `fetch("./data.json")`) go through the Service Worker, runtime resource loading works transparently.

## 🔎 Comparison

Key differences between this project and other popular solutions:

| Approach                                                                                      | Description                                                                |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| This project                                                                                  | Intercepts **all network requests** via Service Worker and remaps them     |
| [raw.githack.com](https://raw.githack.com/)                                                   | Uses a **server-side proxy** to serve corrected responses                  |
| [htmlpreview](https://htmlpreview.github.io/)                                                 | Rewrites **HTML content only**, cannot intercept runtime behavior          |
| [github-html-preview-extension](https://github.com/dohyeon5626/github-html-preview-extension) | Browser extension, uses a **server-side proxy** similar to raw.githack.com |

Detailed feature comparison:

| Feature                                       | This project           | [raw.githack.com](https://raw.githack.com/) | [htmlpreview](https://htmlpreview.github.io/) |
| --------------------------------------------- | ---------------------- | ------------------------------------------- | --------------------------------------------- |
| Architecture                                  | Client-side            | Server-side                                 | Client + Server                               |
| Mechanism                                     | Service Worker         | Server Proxy                                | HTML rewrite + optional proxy fallback        |
| Backend-free                                  | 🟢                     | 🔴                                          | 🟡 (proxy fallback)                           |
| Fix `Content-Type`                            | 🟢                     | 🟢                                          | 🟢                                            |
| Static assets (`<img>`, `<script>`, `<link>`) | 🟢                     | 🟢                                          | 🟢                                            |
| Runtime requests (`fetch`, XHR)               | 🟢                     | 🟢                                          | 🟡 (`<base>`)                                 |
| Dynamic resources                             | 🟢                     | 🟢                                          | 🔴                                            |
| Relative path handling                        | 🟢 (request remapping) | 🟢                                          | 🟢 (`<base>`)                                 |
| Absolute path handling                        | 🔴                     | 🔴                                          | 🔴                                            |
| Service Worker on target                      | 🔴                     | 🟢                                          | 🔴                                            |

## 🕳️ Caveats

- Some websites may use absolute paths (e.g. `/assets/style.css`). This will error.
- Since service workers cannot intercept other service workers' scripts, so the service workers on the previewed page won't work.
- If the website is using incorrect file extensions, this app won't work, because it guesses the content type based on the extension solely.
- Git LFS files are not supported. GitHub's raw content host returns the LFS
  pointer instead of the stored object. See [docs/NOTE.md](./docs/NOTE.md).

## 🎉 Credits

- [htmlpreview](https://htmlpreview.github.io/)

## ✅ TODO

- [x] Asset caching and offline support for this app
