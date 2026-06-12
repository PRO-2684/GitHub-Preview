# GitHub Preview (UserScript)

[![Greasy Fork](https://img.shields.io/greasyfork/dt/577730?logo=greasyfork)](https://greasyfork.org/scripts/577730) [![GitHub Repo stars](https://img.shields.io/github/stars/PRO-2684/GitHub-Preview?style=flat&logo=github)](https://github.com/PRO-2684/GitHub-Preview/tree/main/integrations/userscript/)

Adds a button on GitHub to preview HTML and media files directly. Uses [GitHub Preview](https://github.com/PRO-2684/GitHub-Preview/).

![Preview Button](./preview-button.png)

## 🪄 Features

- Event-driven: Faster and more efficient than mutation observers. Less error-prone than monkey-patching.
- Seamless: Reuses GitHub's design language and icon. Blends in perfectly with the UI.

## 🔒 Private Repos

This script works on private repositories as well, as long as you have access to the files. To do that, this script simply issues a `HEAD` request to the raw file URL, follows the redirect, and use the final URL which would include a `token`.
