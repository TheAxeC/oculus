// Layer 3, primitive, and one of the three that are not components. Putting a theme on the
// document: the class string on the body, the derived colour tokens on the root element, and beside
// them the three custom properties the wallpaper's translucent surfaces are painted through.
//
// The two stylesheets reach this module as text through Vite's `?raw` import, which is the same
// bytes the page is styled with. The derivation therefore runs on the authored values themselves
// and nothing restates a colour in TypeScript. The caller may pass its own two sheets instead,
// which is how the test runs it over the files read from disk.

import { deriveTokens } from '$lib/themes/derive';
import { parseBlocks, resolveTheme } from '$lib/themes/parse';
import tokensCss from '$lib/themes/tokens.css?raw';
import themesCss from '$lib/themes/themes.css?raw';

/**
 * What this needs of a Document, so a test can hand it a plain object and read back what was set.
 */
export type Themeable = {
    body: { className: string };
    documentElement: { style: { setProperty: (name: string, value: string) => void } };
};

/** The body class the CRT overlay is switched on by; themes.css draws it on top of any theme. */
export const CRT_CLASS = 'crt';

/**
 * The body class the wallpaper is switched on by. Every rule that makes a surface translucent hangs
 * off it, so taking it away returns the flat field in one step. No block in themes.css carries it:
 * it selects the rules the shell components declare for themselves.
 */
export const WALL_CLASS = 'wall';

/** The three custom properties the translucent surfaces are painted through. */
export const WALL_PANEL = '--wall-panel';
export const WALL_POPOVER = '--wall-popover';
export const WALL_BLUR = '--wall-blur';

/**
 * What applyWallpaper needs of the configuration: state/words/appearance.ts's Wallpaper,
 * structurally.
 */
export type WallpaperStyle = {
    panel: number;
    popover: number;
    panelBlur: number;
};

/**
 * The wallpaper's three custom properties on the root element, beside the theme's derived tokens.
 * `panel` and `popover` are the percentages a pane and a menu keep of their own surface colour;
 * `panelBlur` is the backdrop blur behind them. Off, or configured with nothing, clears all three,
 * so a rule that names one paints nothing rather than the last theme's value.
 */
export function applyWallpaper(
    document: Themeable,
    config: WallpaperStyle | null,
    on: boolean
): void {
    const style = document.documentElement.style;
    if (!on || config === null) {
        for (const name of [WALL_PANEL, WALL_POPOVER, WALL_BLUR]) style.setProperty(name, '');
        return;
    }
    style.setProperty(WALL_PANEL, `${config.panel}%`);
    style.setProperty(WALL_POPOVER, `${config.popover}%`);
    style.setProperty(WALL_BLUR, `${config.panelBlur}px`);
}

/**
 * Put a theme on the document: `classes` is the theme's own body class string, the `class` of its
 * config/appearance.yml entry, and the CRT class joins it when the overlay is on. The tokens the
 * components paint text with are derived from the theme the two sheets resolve to and set on the
 * root element, since a stylesheet cannot compute them.
 */
export function applyTheme(
    document: Themeable,
    classes: string,
    crt: boolean,
    tokens: string = tokensCss,
    themes: string = themesCss
): Record<string, string> {
    const className = [classes, crt ? CRT_CLASS : '']
        .join(' ')
        .split(/\s+/)
        .filter((name) => name.length > 0)
        .join(' ');
    document.body.className = className;

    const blocks = parseBlocks(`${tokens}\n${themes}`);
    const derived = deriveTokens(resolveTheme(blocks, className));
    for (const [name, value] of Object.entries(derived)) {
        document.documentElement.style.setProperty(name, value);
    }
    return derived;
}
