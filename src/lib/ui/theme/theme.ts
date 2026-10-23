// Layer 3, primitive, and one of the three that are not components. Putting a theme on the
// document: the class string on the body, the derived colour tokens on the root element, and beside
// them the three custom properties the wallpaper's translucent surfaces are painted through; the
// first theme put on the document takes away the ground element the page's first HTML was sent
// with (`GROUND_STYLE_ID`). It also names the classes the sheets hold a theme block for
// (`themeClasses`), which the Settings view offers as the words of a theme's `class`, and hands the
// server the derivation of the tokens (`derivedTokens`), which it writes into the page's first HTML
// for the theme the page starts on.
//
// The stylesheets (tokens.css, themes.css, the rice palettes of rice/ and the generated vscode.css)
// reach this module as text through Vite's `?raw` import, which is the same bytes the page is
// styled with. The derivation therefore runs on the authored values themselves and nothing restates
// a colour in TypeScript. The caller may pass its own tokens sheet and its own theme sheets, which
// is how the test runs it over the files read from disk.

import { CRT_CLASS, bodyClass, type BodyLooks } from '$lib/data/helpers/editor/start-theme';
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
    getElementById: (id: string) => { remove: () => void } | null;
};

/**
 * The id of the style element that paints the start theme's ground, and the rule of the page's
 * scrollbar sheet (ui/theme/scrollbar.css), in the page's first HTML (hooks.server.ts), before any
 * stylesheet has loaded. The page's first `applyTheme` takes it away, so from then on the ground
 * is the layout's rule over the loaded sheets and a theme put on later paints the whole window.
 */
export const GROUND_STYLE_ID = 'oculus-ground';

/** The sheets that hold theme blocks, themes.css, rice/ and vscode.css, as one text. */
export const THEME_SHEETS = [themesCss, ...Object.values(riceSheets), vscodeCss].join('\n');

/**
 * The sheets an app's theme's tokens are derived over: the theme sheets with the block its
 * conversion makes after them, as the page's draw puts it in the document.
 */
export function withThemeBlock(block: string): string {
    return `${THEME_SHEETS}\n${block}`;
}

/**
 * The body class the wallpaper is switched on by. Every rule that makes a surface translucent hangs
 * off it, so taking it away returns the flat field in one step. No block in themes.css carries it:
 * it selects the rules the shell components declare for themselves.
 */
export const WALL_CLASS = 'wall';

/**
 * The custom properties the translucent surfaces are painted through: a pane's, a menu's, the
 * editor's and the terminal's share of their surface colour, and the blur behind them.
 */
const WALL_PANEL = '--wall-panel';
const WALL_POPOVER = '--wall-popover';
const WALL_EDITOR = '--wall-editor';
const WALL_TERMINAL = '--wall-terminal';
const WALL_BLUR = '--wall-blur';

/**
 * What applyWallpaper needs of the configuration: state/shared/words/appearance.ts's Wallpaper,
 * structurally.
 */
export type WallpaperStyle = {
    panel: number;
    popover: number;
    editor: number;
    terminal: number;
    panelBlur: number;
};

/**
 * The wallpaper's custom properties on the root element, beside the theme's derived tokens.
 * `panel`, `popover`, `editor` and `terminal` are the percentages a pane, a menu, the editor and
 * the terminal keep of their own surface colour; `panelBlur` is the backdrop blur behind them. Off,
 * or configured with nothing, clears them all, so a rule that names one paints nothing rather than
 * the last theme's value.
 */
export function applyWallpaper(
    document: Themeable,
    config: WallpaperStyle | null,
    on: boolean
): void {
    const style = document.documentElement.style;
    if (!on || config === null) {
        for (const name of [WALL_PANEL, WALL_POPOVER, WALL_EDITOR, WALL_TERMINAL, WALL_BLUR]) {
            style.setProperty(name, '');
        }
        return;
    }
    style.setProperty(WALL_PANEL, `${config.panel}%`);
    style.setProperty(WALL_POPOVER, `${config.popover}%`);
    style.setProperty(WALL_EDITOR, `${config.editor}%`);
    style.setProperty(WALL_TERMINAL, `${config.terminal}%`);
    style.setProperty(WALL_BLUR, `${config.panelBlur}px`);
}

/**
 * The tokens derived for the body class string `className` over the tokens sheet and the theme
 * sheets: what `applyTheme` sets on the root element, and what the server writes on the root
 * element of the page's first HTML for the theme the page starts on (hooks.server.ts), so a frame
 * that paints the page before its script draws has the start theme's derived tokens.
 */
export function derivedTokens(
    className: string,
    tokens: string = tokensCss,
    themes: string = THEME_SHEETS
): Record<string, string> {
    return deriveTokens(resolveTheme(parseBlocks(`${tokens}\n${themes}`), className));
}

/**
 * Put a theme on the document: `classes` is the theme's own body class string, the `class` of its
 * config/defaults/appearance.yml entry, and the body takes it joined with the CRT class when the
 * overlay is on and the classes of the rice toggles when a toggle is off (`bodyClass` of
 * data/helpers/editor/start-theme.ts, by which the server writes the same string into the page's
 * first HTML, so the page's first draw keeps the class the page was sent with). The tokens the
 * components paint text with are derived from the theme the sheets resolve to and set on the root
 * element, since a stylesheet cannot compute them (`derivedTokens`). The ground element the page's
 * first HTML carries (`GROUND_STYLE_ID`) is taken away, which only the page's first draw finds, so
 * no colour of the start theme stays on the root element's background once the theme changes.
 */
export function applyTheme(
    document: Themeable,
    classes: string,
    looks: BodyLooks,
    tokens: string = tokensCss,
    themes: string = THEME_SHEETS
): Record<string, string> {
    const className = bodyClass(classes, looks);
    document.body.className = className;
    document.getElementById(GROUND_STYLE_ID)?.remove();

    const derived = derivedTokens(className, tokens, themes);
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
