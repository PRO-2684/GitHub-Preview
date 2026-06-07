# Technical Notes

## GitHub `/raw` And Git LFS

Observed on June 7, 2026:

- `raw.githubusercontent.com/...` returns normal Git objects directly.
- For Git LFS files, `raw.githubusercontent.com/...` returns the small text
  pointer rather than the stored object.
- `github.com/{owner}/{repo}/raw/{ref}/{path}` returns `302`:
  - Normal Git objects redirect to `raw.githubusercontent.com`.
  - Git LFS objects redirect to `media.githubusercontent.com`.
- Ranged requests survive both redirect chains. A request for
  `Range: bytes=0-15` produced a final `206 Partial Content` response with the
  expected `Content-Range` and 16-byte body.
- Both final content hosts advertise `Access-Control-Allow-Origin: *` and
  `Accept-Ranges: bytes`.
- The initial `github.com/.../raw/...` redirect does not provide usable CORS
  headers. Browser `fetch(..., { mode: "cors" })` fails before following the
  redirect for both normal and LFS files.

The service worker must fetch and rewrap content to preserve the preview
origin, relative paths, MIME correction, and runtime requests. It therefore
cannot replace its `raw.githubusercontent.com` fetch with the GitHub `/raw`
resolver. Git LFS support is intentionally deferred.
