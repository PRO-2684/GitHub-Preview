/** @type {HTMLElement} */
const player = document.getElementById("player");

try {
    const input = new URL(location.href).searchParams.get("url");
    const { type, url } = MediaPreview.parseMediaUrl(input);
    const media = document.createElement(type);

    media.controls = true;
    media.src = url.href;
    media.textContent = "Your browser does not support this media.";
    player.append(media);
} catch (error) {
    const message = document.createElement("p");
    message.className = "player-error";
    message.textContent =
        error instanceof Error ? error.message : "Unable to open media";
    player.append(message);
}
