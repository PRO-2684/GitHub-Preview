// ==UserScript==
// @name         GitHub Preview (UserScript)
// @name:zh-CN   GitHub 预览 (UserScript)
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Adds a button on GitHub to preview HTML files directly.
// @description:zh-CN 在 GitHub 上添加一个按钮，用于直接预览 HTML 文件。
// @author       PRO-2684
// @match        https://github.com/*
// @run-at       document-start
// @icon         http://github.com/favicon.ico
// @license      gpl-3.0
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    const PREVIEW_URL = new URL(
        "https://pro-2684.github.io/GitHub-Preview/?preview=1",
    );
    const OCTICON_ATTRS =
        'data-component="Octicon" aria-hidden="true" focusable="false" class="octicon octicon-eye" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align: text-bottom;"';
    const EYE_OCTICON = `<svg ${OCTICON_ATTRS}><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg>`;
    const ANCHOR_BUTTON = "a[data-testid='raw-button']";
    const REFERENCE_BUTTON = "a[data-testid='edit-button']";
    /**
     * Create a "Preview" button.
     * @param {HTMLLinkElement | null} refButton - The reference button.
     * @param {URL} rawUrl - The GitHub raw URL of the file.
     * @returns {HTMLDivElement | null} The container element with the preview button and tooltip, or null if creation failed.
     */
    function createPreviewButton(refButton, rawUrl) {
        const refTooltip = refButton.nextElementSibling;
        if (!refTooltip) {
            console.warn(
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
        const previewUrl = new URL(PREVIEW_URL);
        previewUrl.searchParams.set("url", rawUrl.href);
        previewButton.setAttribute("href", previewUrl.href);
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
        console.log("Checking for preview button insertion...");
        const buttons = document.querySelector(
            ".react-blob-header-edit-and-raw-actions",
        );
        const anchorButton = buttons?.querySelector(ANCHOR_BUTTON);
        const refButton = buttons?.querySelector(REFERENCE_BUTTON);
        if (!anchorButton || !refButton) {
            console.warn(
                "Required buttons not found. Skipping preview button insertion.",
            );
            return;
        }

        // Check if the file is an HTML file or if we've already added a preview button
        const rawUrl = new URL(anchorButton?.href);
        const extension = rawUrl.pathname.split(".").pop().toLowerCase();
        if (
            !["html", "htm"].includes(extension) ||
            buttons.querySelector("a[data-testid='preview-button']")
        )
            return;

        const previewButton = createPreviewButton(refButton, rawUrl);
        if (!previewButton) return;
        anchorButton.parentElement.after(previewButton);
        fixTooltipPosition(previewButton);
        console.log("Preview button inserted successfully.");
    }

    document.addEventListener("soft-nav:react-done", githubPreview);
    document.addEventListener("turbo:load", githubPreview);
})();
