/**
 * Utility für iFrame-Einbettung in Reveal.js / Quarto
 */
export function setupEmbedMode(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get("embed") === "true" || window.self !== window.top;

  if (isEmbed) {
    document.body.classList.add("embed");

    // Verhindert, dass Tastenanschläge (Leertaste, Pfeiltasten) an Reveal.js leaken, wenn fokussiert
    window.addEventListener(
      "keydown",
      (e) => {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
          e.stopPropagation();
        }
      },
      { capture: true }
    );
  }

  return isEmbed;
}
