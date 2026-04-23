# GitHub-Preview

Preview static assets like HTML on GitHub.

## Usage

1. Visit [GitHub-Preview](https://pro-2684.github.io/GitHub-Preview/) once. (Registers [service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker))
2. Replace `https://raw.githubusercontent.com/` with `https://pro-2684.github.io/GitHub-Preview/` and visit the URL. Alternatively, paste the link in the input box on the homepage and submit.

Here's a few examples:

- <https://pro-2684.github.io/GitHub-Preview/twbs/bootstrap/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html>
    - [Source code](https://github.com/twbs/bootstrap/blob/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
    - [GitHub raw](https://raw.githubusercontent.com/twbs/bootstrap/0d0ca30f5db73cceb456597c78b3c8750263c2d5/2.3.2/index.html)
- TODO

## TODO

- [ ] Better MIME type detection (currently only based on file extension)
- [ ] Better landing page
    - [ ] Clickable Examples
    - [ ] Explanation of how to use
    - [ ] Technical details of how it works
- [ ] Asset caching and offline support
    - [ ] Cache assets of this app
    - [ ] Cache assets of the previewed page (user control?)
