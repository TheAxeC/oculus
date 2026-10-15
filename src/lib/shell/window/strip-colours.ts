// Layer 3, shell. The colours the window's title bar strip is drawn in, as the desktop host takes
// them: off macOS the system draws the window buttons over the strip's right end, and the host
// colours them with the strip's background and the colour of its words (desktop/decide/
// window-options.ts, `overlayColours`), which it takes only as hex colours. The strip is read as
// drawn, so the colours are `--titlebar-bg` and `--titlebar-txt` as the theme on screen computes
// them, whatever form the theme writes them in. The system draws the buttons on an opaque fill, so
// each colour is painted on a one-pixel canvas over what shows under it (the window's own fill,
// the page's background and, for the words, the strip) and read back as the opaque `#rrggbb` seen.
// The page sends them once each theme is drawn (appearance.svelte.ts).

/** The window's fill under a page that paints none: `WINDOW_BACKGROUND` of window-options.ts. */
const WINDOW_FILL = '#181818';

/** A pixel's red, green and blue bytes as a hex colour, `#rrggbb`. */
function hexOf(bytes: ArrayLike<number>): string {
    const digits = [0, 1, 2].map((at) => Math.round(bytes[at]).toString(16).padStart(2, '0'));
    return `#${digits.join('')}`;
}

/** The strip's background and the colour of its words, as hex colours; null with no strip drawn. */
export function stripColours(document: Document): { color: string; symbolColor: string } | null {
    const strip = document.querySelector('[data-titlebar]');
    const view = document.defaultView;
    if (strip === null || view === null) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const pen = canvas.getContext('2d', { willReadFrequently: true });
    if (pen === null) return null;
    /** The colour seen where `fills` are painted one over the other, the first at the bottom. */
    const paint = (...fills: string[]): string => {
        for (const fill of fills) {
            pen.fillStyle = fill;
            pen.fillRect(0, 0, 1, 1);
        }
        return hexOf(pen.getImageData(0, 0, 1, 1).data);
    };
    const page = view.getComputedStyle(document.body).backgroundColor;
    const style = view.getComputedStyle(strip);
    return {
        color: paint(WINDOW_FILL, page, style.backgroundColor),
        symbolColor: paint(WINDOW_FILL, page, style.backgroundColor, style.color)
    };
}
