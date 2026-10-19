// Layer 3, primitive, and one of the three that are not components. Putting a theme on the
// document: the class string on the body, the derived colour tokens on the root element, and beside
// them the three custom properties the wallpaper's translucent surfaces are painted through. It
// also names the classes the sheets hold a theme block for (`themeClasses`), which the Settings
// view offers as the words of a theme's `class`.
//
// The stylesheets (tokens.css, themes.css, the rice palettes of rice/ and the generated vscode.css)
// reach this module as text through Vite's `?raw` import, which is the same bytes the page is
// styled with. The derivation therefore runs on the authored values themselves and nothing restates
// a colour in TypeScript. The caller may pass its own tokens sheet and its own theme sheets, which
// is how the test runs it over the files read from disk.

import { deriveTokens } from '$lib/themes/derive';
import { parseBlocks, resolveTheme } from '$lib/themes/parse';
import tokensCss from '$lib/themes/tokens.css?raw';
import themesCss from '$lib/themes/themes.css?raw';
import vscodeCss from '$lib/themes/vscode.css?raw';

/** The rice palettes, one sheet per family, in the order of their file names. */
const riceSheets: Record<string, string> = import.meta.glob('/src/lib/themes/rice/*.css', {
    query: '?raw',
    import: 'default',
    eager: true
});

/**
 * What this needs of a Document, so a test can hand it a plain object and read back what was set.
 */
export type Themeable = {
    body: { className: string };
    documentElement: { style: { setProperty: (name: string, value: string) => void } };
};

/** The sheets that hold theme blocks, themes.css, rice/ and vscode.css, as one text. */
export const THEME_SHEETS = [themesCss, ...Object.values(riceSheets), vscodeCss].join('\n');

/** The body class the CRT overlay is switched on by; themes.css draws it on top of any theme. */
export const CRT_CLASS = 'crt';

/**
 * The body class a rice theme draws its buttons, chips and tags without brackets under: the
 * Brackets toggle off. The rules that draw the brackets select `body.rice` without it.
 */
const RICE_PLAIN_CLASS = 'rice-plain';

/**
 * The body class a rice theme draws its interface in the default sans font under: the Monospace
 * toggle off. The rules that set the monospace font select `body.rice` without it.
 */
const RICE_SANS_CLASS = 'rice-sans';

/**
 * The per-browser looks drawn beside a theme's own classes: the CRT overlay, and the two rice
 * toggles, whose classes are put on only when the toggle is off, so a page that sets neither
 * draws the rice look whole.
 */
export type BodyLooks = { crt: boolean; brackets: boolean; monospace: boolean };

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
 * What applyWallpaper needs of the configuration: state/shared/words/appearance.ts's Wallpaper,
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
 * config/appearance.yml entry, the CRT class joins it when the overlay is on, and the classes of
 * the rice toggles join it when a toggle is off. The tokens the components paint text with are
 * derived from the theme the two sheets resolve to and set on the root element, since a
 * stylesheet cannot compute them.
 */
export function applyTheme(
    document: Themeable,
    classes: string,
    looks: BodyLooks,
    tokens: string = tokensCss,
    themes: string = THEME_SHEETS
): Record<string, string> {
    const className = [
        classes,
        looks.crt ? CRT_CLASS : '',
        looks.brackets ? '' : RICE_PLAIN_CLASS,
        looks.monospace ? '' : RICE_SANS_CLASS
    ]
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

/**
 * The body classes the sheets hold a theme block for, in the order the sheet declares them: every
 * `body.<class>` block `parseBlocks` reads, without `:root` and without the CRT overlay's class,
 * which themes.css draws on top of any theme and is not one.
 */
export function themeClasses(tokens: string = tokensCss, themes: string = THEME_SHEETS): string[] {
    return Object.keys(parseBlocks(`${tokens}\n${themes}`)).filter(
        (name) => name !== ':root' && name !== CRT_CLASS
    );
}

/**
 * The names of the custom properties a theme sets on the document: every property tokens.css
 * declares on `:root` and every one the derivation adds to them. An app's frame is given the value
 * each has on the page, so it is painted in the page's colours.
 */
export function tokenNames(tokens: string = tokensCss, themes: string = THEME_SHEETS): string[] {
    const blocks = parseBlocks(`${tokens}\n${themes}`);
    const base = resolveTheme(blocks, '');
    return [...new Set([...Object.keys(base), ...Object.keys(deriveTokens(base))])];
}
