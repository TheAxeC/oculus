// Layer 3, view support. The terminal grid's look, from the tokens of the theme in force: its
// palette, its selection and its font. xterm.js paints the glyphs itself and takes these as strings
// through its own API, so they are read as computed values here and handed to the grid when it is
// built and again on every theme change, rather than set as CSS.

import type { ITerminalOptions, ITheme } from '@xterm/xterm';

/** The grid's palette and its font family, as the theme in force gives them. */
export type GridLook = { theme: ITheme; fontFamily: string };

/** The sixteen ANSI slots, in xterm's order, and the token each one is painted from. */
const ANSI: [keyof ITheme, string][] = [
    ['black', '--muted'],
    ['red', '--c-red'],
    ['green', '--c-green'],
    ['yellow', '--c-gold'],
    ['blue', '--c-blue'],
    ['magenta', '--c-magenta'],
    ['cyan', '--c-cyan'],
    ['white', '--ink'],
    ['brightBlack', '--muted'],
    ['brightRed', '--c-red'],
    ['brightGreen', '--c-green'],
    ['brightYellow', '--c-gold'],
    ['brightBlue', '--c-blue'],
    ['brightMagenta', '--c-magenta'],
    ['brightCyan', '--c-cyan'],
    ['brightWhite', '--ink']
];

/**
 * The grid's palette and font in force, read off the body, which is where the theme's class sits
 * and where its tokens are set (`body.rice.dracula` and the like in themes.css); the root element
 * carries the light defaults only, so a read there would paint a light grid under a dark theme.
 * The font is the page's monospace token, and a selection is drawn as the selected row of a tree
 * is, on `--accent-bg` in `--on-accent-bg`, the one selection surface every theme derives. Before
 * a theme is applied the root carries no `--on-accent-bg`, and the selection is then drawn in
 * `--ink`, as every other use of that token falls back.
 */
export function gridLook(): GridLook {
    const root = getComputedStyle(document.body);
    const of = (name: string) => root.getPropertyValue(name).trim();
    const theme: ITheme = {
        background: of('--panel'),
        foreground: of('--ink'),
        cursor: of('--accent'),
        selectionBackground: of('--accent-bg'),
        selectionForeground: of('--on-accent-bg') || of('--ink')
    };
    for (const [slot, token] of ANSI) {
        (theme as Record<string, string>)[slot] = of(token);
    }
    return { theme, fontFamily: of('--font-mono') };
}

/**
 * The options a new grid is built with: the look, a line feed drawn as the program wrote it
 * (`convertEol` off, so xterm adds no carriage return), and the font size when there is one,
 * xterm's own size otherwise.
 */
export function gridOptions(look: GridLook, size: number | undefined): ITerminalOptions {
    const options: ITerminalOptions = { ...look, convertEol: false };
    return size === undefined ? options : { ...options, fontSize: size };
}

/**
 * Put a look on a grid that is already drawn: the palette always, since a theme change moves it,
 * and the font family only when it differs, since setting it makes xterm measure its cells again.
 */
export function applyLook(options: ITerminalOptions, look: GridLook): void {
    options.theme = look.theme;
    if (options.fontFamily !== look.fontFamily) options.fontFamily = look.fontFamily;
}
