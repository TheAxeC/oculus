// Layer 3, shell. The colours the window's title bar strip is drawn in, as the desktop host takes
// them: off macOS the system draws the window buttons over the strip's right end, and the host
// colours them with the strip's background and the colour of its words (desktop/decide/
// window-options.ts, `overlayColours`), which it takes only as hex colours. The strip is read as
// drawn, so the colours are `--titlebar-bg` and `--titlebar-txt` as the theme on screen computes
// them, whatever form the theme writes them in. The system draws the buttons on an opaque fill, so
// each colour is painted on a one-pixel canvas over what shows under it (the window's own fill,
// the page's background and, for the words, the strip) and read back as the opaque `#rrggbb` seen.
// The page sends them once each theme is drawn (appearance.svelte.ts), with the background of the
// theme drawn: its `--bg` as the body computes it, the token the host fills a window by before its
// page paints (`windowColours` of themes/parse.ts), painted to an opaque `#rrggbb` the same way.
// The host makes it the window's own fill (desktop/windows/bridge.ts), so the strip's colours are
// painted over that fill, and the fill and the strip are of one theme, an app's theme included. A
// `--bg` that is no colour gives an empty background, which the host takes as no fill, and nothing
// is painted under the page for it.

/** A pixel's red, green and blue bytes as a hex colour, `#rrggbb`. */
function hexOf(bytes: ArrayLike<number>): string {
    const digits = [0, 1, 2].map((at) => Math.round(bytes[at]).toString(16).padStart(2, '0'));
    return `#${digits.join('')}`;
}

/**
 * What the page sends the host once a theme is drawn: the strip's background and the colour of its
 * words, and the drawn theme's background, each a hex colour; the background is empty when the
 * theme's `--bg` is no colour.
 */
export type StripColours = { color: string; symbolColor: string; background: string };

/** The colours the page sends the host for the theme drawn; null with no strip drawn. */
export function stripColours(document: Document): StripColours | null {
    const strip = document.querySelector('[data-titlebar]');
    const view = document.defaultView;
    if (strip === null || view === null) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const pen = canvas.getContext('2d', { willReadFrequently: true });
    if (pen === null) return null;
    /**
     * The colour seen where `fills` are painted one over the other on an empty pixel, the first at
     * the bottom.
     */
    const paint = (...fills: string[]): string => {
        pen.clearRect(0, 0, 1, 1);
        for (const fill of fills) {
            pen.fillStyle = fill;
            pen.fillRect(0, 0, 1, 1);
        }
        return hexOf(pen.getImageData(0, 0, 1, 1).data);
    };
    const body = view.getComputedStyle(document.body);
    const drawn = body.getPropertyValue('--bg').trim();
    const background = drawn !== '' && view.CSS.supports('color', drawn) ? paint(drawn) : '';
    const under = background === '' ? [] : [background];
    const style = view.getComputedStyle(strip);
    return {
        color: paint(...under, body.backgroundColor, style.backgroundColor),
        symbolColor: paint(...under, body.backgroundColor, style.backgroundColor, style.color),
        background
    };
}
