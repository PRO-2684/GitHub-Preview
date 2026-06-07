# Media Preview Design

## Goal

Add automatic preview support for common video and audio files. The project
continues to trust filename extensions when deciding how content should be
rendered.

## Routing

The landing page parses the submitted GitHub URL as it does today and inspects
the final path extension case-insensitively.

```js
const mediaExtensions = {
    // https://www.chromium.org/audio-video/
    video: ["webm", "ogv", "mkv", "mp4", "mov"],
    audio: ["mp3", "flac", "ogg", "opus", "wav", "m4a", "aac"],
};
```

HTML and all unrecognized extensions continue to navigate to the existing
service-worker preview route. Recognized media extensions navigate to
`player.html` with the normalized raw GitHub URL in a query parameter.

Automatic previews opened through `?url=...&preview=1` use the same dispatch
logic as form submissions. Share links therefore retain their existing format
and behavior.

The service worker applies the same media classification to preview paths and
redirects recognized media directly to GitHub's raw route. It does not inspect
whether the request is a top-level navigation or a subresource. Only landing
page dispatch opens `player.html`.

## Player Page

`player.html` is a focused, standalone media document rather than an embedded
section of the landing page. It reads the media URL, classifies its extension
with the shared extension rules, and creates exactly one native element:

- Video extensions render `<video controls>`.
- Audio extensions render `<audio controls>`.

The element source is the normalized `https://github.com/.../raw/...` URL.
GitHub redirects ordinary files to raw content and Git LFS files to
`media.githubusercontent.com`, so both storage types work without inspecting
file contents. The browser makes native media and range requests directly
instead of sending them through the service worker.

The player fills the available viewport while preserving the media aspect
ratio. Audio uses a compact control bar centered in the page. Native browser
controls provide playback, volume, seeking, fullscreen, and download behavior
where supported.

## Validation And Errors

The landing page remains responsible for accepting only the GitHub raw and blob
URL formats already supported by `GitHubLink`.

The player also treats its query string as untrusted input. It accepts only an
HTTPS `raw.githubusercontent.com` URL or a `github.com/.../raw/...` URL whose
path has one of the configured media extensions. Raw-content URLs are
normalized to the GitHub raw route so Git LFS pointers resolve to their stored
objects. A missing, malformed, unsupported, or non-raw URL produces a visible
error message and no media element.

Browser codec support is not inferred from the extension. If Chromium or
another browser cannot decode a listed format, the native media element reports
the playback failure. This feature promises correct wrapping, not transcoding
or codec fallback.

## Code Organization

- `app.js` owns GitHub URL parsing, raw URL generation, extension
  classification, and landing-page navigation.
- `player.html` owns the standalone media document and its minimal player
  markup.
- `player.js` validates the player query, classifies the media type, and creates
  the native media element.
- `style.css` provides the shared player layout styles.
- `sw.js` loads the shared media rules, adds the player resources to the
  application cache, and redirects recognized media to raw content instead of
  proxying it.

`media.js` exposes one shared extension map and routing helpers to the landing
page, player, service worker, and Node tests.

## Verification

Verification covers:

- Every configured video extension routes to `player.html`.
- Every configured audio extension routes to `player.html`.
- Extension matching is case-insensitive and ignores URL query/hash suffixes.
- Existing HTML preview navigation remains unchanged.
- Blob and raw GitHub URLs normalize to the same raw media source.
- Shared `?url=...&preview=1` links dispatch media correctly after service
  worker registration.
- Invalid player URLs and unsupported extensions render an error.
- A supported video and audio file render native controls and request the raw
  GitHub URL directly.
- The service worker caches `player.html` and `player.js`.

## Out Of Scope

- Transcoding, codec detection, captions, playlists, thumbnails, or custom
  controls.
- MIME sniffing or content-based media detection.
- Image, PDF, or other document preview wrappers.
- Proxying media bytes through the service worker.
