// ==UserScript==
// @name         GitHub Preview (UserScript)
// @name:zh-CN   GitHub 预览 (UserScript)
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  Adds a button on GitHub to preview HTML and media files directly.
// @description:zh-CN 在 GitHub 上添加一个按钮，用于直接预览 HTML 和媒体文件。
// @author       PRO-2684
// @match        https://github.com/*
// @run-at       document-start
// @icon         http://github.com/favicon.ico
// @license      gpl-3.0
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    const { name } = GM_info.script;
    const log = console.log.bind(console, `[${name}]`);
    const warn = console.warn.bind(console, `[${name}]`);

    const EXTENSIONS = new Set([
        // HTML
        "html",
        "htm",
        // Video per https://www.chromium.org/audio-video/
        "webm",
        "ogv",
        "mkv",
        "mp4",
        "mov",
        // Audio per https://www.chromium.org/audio-video/
        "mp3",
        "flac",
        "ogg",
        "opus",
        "wav",
        "m4a",
        "aac",
    ]);
    const PREVIEW_URL = new URL(
        "https://pro-2684.github.io/GitHub-Preview/?preview=1",
    );
    const OCTICON_ATTRS =
        'data-component="Octicon" aria-hidden="true" focusable="false" class="octicon octicon-eye" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align: text-bottom;"';
    const EYE_OCTICON = `<svg ${OCTICON_ATTRS}><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg>`;
    const ANCHOR_BUTTON = "a[data-testid='raw-button']";
    const REFERENCE_BUTTON = "button[data-testid='copy-raw-button']";

    /**
     * Checks if the current repository is public.
     * @returns {boolean} True if the repository is public, false otherwise.
     */
    function isPublic() {
        const embeddedData = document.querySelector(
            `react-app[app-name="code-view"] > script[type="application/json"][data-target="react-app.embeddedData"]`,
        )?.textContent;
        if (!embeddedData) {
            warn("Embedded data not found. Assuming repository is public.");
            return true;
        }
        try {
            const data = JSON.parse(embeddedData);
            return data?.payload?.codeViewLayoutRoute?.repo?.public ?? true;
        } catch (error) {
            warn("Failed to parse embedded data:", error);
            return true;
        }
    }
    /**
     * Enables or disables a button element.
     * @param {HTMLButtonElement | HTMLAnchorElement} button - The button element to enable or disable.
     * @param {boolean} enabled - True to enable the button, false to disable it.
     */
    function setButtonEnabled(button, enabled) {
        button.disabled = !enabled;
        button.ariaDisabled = String(!enabled);
        button.ariaBusy = String(!enabled);
        if (!enabled) {
            button.style.cursor = "wait";
        } else {
            button.style.cursor = "";
        }
    }
    /**
     * Resolves the raw URL with an authentication token.
     * @param {URL} rawUrl - The original raw URL of the file.
     * @returns {Promise<string | null>} A promise that resolves to the authenticated raw URL.
     */
    async function resolveRawWithToken(url) {
        // Perform a HEAD request and return the redirected URL
        return fetch(url.href, { method: "HEAD" })
            .then((response) => {
                if (response.ok) {
                    log(
                        "Successfully resolved raw URL with token:",
                        response.url,
                    );
                    return response.url;
                } else {
                    warn(
                        "Failed to resolve raw URL with token.",
                        response.status,
                    );
                    return null;
                }
            })
            .catch((error) => {
                warn("Error resolving raw URL with token:", error);
                return null;
            });
    }
    /**
     * Create a "Preview" button.
     * @param {HTMLLinkElement | null} refButton - The reference button.
     * @param {URL} rawUrl - The GitHub raw URL of the file.
     * @returns {HTMLDivElement | null} The container element with the preview button and tooltip, or null if creation failed.
     */
    function createPreviewButton(refButton, rawUrl) {
        const refTooltip = refButton.nextElementSibling;
        if (!refTooltip) {
            warn(
                "Reference tooltip not found. Skipping preview button insertion.",
            );
            return;
        }
        const previewButton = document.createElement("a");
        for (const attr of refButton.attributes) {
            // Copy attributes from the reference button
            previewButton.setAttribute(attr.name, attr.value);
        }
        // Override specific attributes for the preview button
        if (isPublic()) {
            const previewUrl = new URL(PREVIEW_URL);
            previewUrl.searchParams.set("url", rawUrl.href);
            previewButton.setAttribute("href", previewUrl.href);
        } else {
            /**
             * Handles the click event on the preview button.
             * @param {PointerEvent} event - The click event object.
             */
            async function onClick(event) {
                event.preventDefault();
                // Prevent multiple clicks while resolving the URL
                if (previewButton.disabled) return;
                setButtonEnabled(previewButton, false);
                log("Resolving raw URL with authentication token...");
                const resolvedUrl = await resolveRawWithToken(rawUrl);
                setButtonEnabled(previewButton, true);
                if (resolvedUrl) {
                    previewButton.removeEventListener("click", onClick);
                    const previewUrl = new URL(PREVIEW_URL);
                    previewUrl.searchParams.set("url", resolvedUrl);
                    previewButton.setAttribute("href", previewUrl.href);
                    // Simulate the click again with same modifiers
                    const clickEvent = new MouseEvent("click", {
                        ctrlKey: event.ctrlKey,
                        shiftKey: event.shiftKey,
                        altKey: event.altKey,
                        metaKey: event.metaKey,
                    });
                    previewButton.dispatchEvent(clickEvent);
                } else {
                    alert(
                        "Failed to resolve the raw URL with authentication. See console for details.",
                    );
                }
            }
            previewButton.setAttribute("href", "#");
            previewButton.addEventListener("click", onClick);
        }
        previewButton.setAttribute("data-testid", "preview-button");
        previewButton.setAttribute("aria-labelledby", "preview-tooltip");
        previewButton.setAttribute("interestfor", "preview-tooltip"); // https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
        previewButton.innerHTML = EYE_OCTICON;
        // Create the tooltip element
        const tooltip = document.createElement("div");
        for (const attr of refTooltip.attributes) {
            // Copy attributes from the reference tooltip
            tooltip.setAttribute(attr.name, attr.value);
        }
        // Override specific attributes for the preview tooltip
        tooltip.setAttribute("id", "preview-tooltip");
        tooltip.textContent = "Preview this file";
        // Insert the preview button and tooltip
        const container = document.createElement("div");
        container.append(previewButton, tooltip);
        return container;
    }
    /**
     * Fixes the tooltip position.
     * @param {HTMLDivElement} container - The container element that holds the preview button and tooltip.
     */
    function fixTooltipPosition(container) {
        const button = container.querySelector(
            "a[data-testid='preview-button']",
        );
        const tooltip = container.querySelector("div[id='preview-tooltip']");
        const { x, y } = button.getBoundingClientRect();
        tooltip.style.left = `${x - 41.7}px`;
        tooltip.style.top = `${y - 31.5}px`;
    }

    /**
     * Adds preview button if applicable.
     */
    function githubPreview() {
        log("Checking for preview button insertion...");
        const buttons = document.querySelector(
            ".react-blob-header-edit-and-raw-actions",
        );
        const anchorButton = buttons?.querySelector(ANCHOR_BUTTON);
        const refButton = buttons?.querySelector(REFERENCE_BUTTON);
        if (!anchorButton || !refButton) {
            warn(
                "Required buttons not found. Skipping preview button insertion.",
            );
            return;
        }

        // Check if the file has an accepted extension or if we've already added a preview button
        const rawUrl = new URL(anchorButton?.href);
        const extension = rawUrl.pathname.split(".").pop().toLowerCase();
        if (
            !EXTENSIONS.has(extension) ||
            buttons.querySelector("a[data-testid='preview-button']")
        )
            return;

        const previewButton = createPreviewButton(refButton, rawUrl);
        if (!previewButton) return;
        anchorButton.parentElement.after(previewButton);
        fixTooltipPosition(previewButton);
        log("Preview button inserted successfully.");
    }

    document.addEventListener("soft-nav:react-done", githubPreview);
    document.addEventListener("turbo:load", githubPreview);
})();
