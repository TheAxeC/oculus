// Layer 3, view support. The terminal grid's look, from the tokens of the theme in force: its
// palette, its selection and its font. xterm.js paints the glyphs itself and takes these as strings
// through its own API, so they are read as computed values here and handed to the grid when it is
// built and again on every theme change, rather than set as CSS. The colours the find bar marks its
// matches in are read the same way, since the search addon draws them as decorations of its own.

import type { ISearchOptions } from '@xterm/addon-search';
import type { ITerminalOptions, ITheme } from '@xterm/xterm';
import type { TerminalOptions } from '$lib/state/shared/words/appearance';
import { COLOR_NAMES, colorToken } from '$lib/state/sessions/terminal/terminal-marks';
import { copySelection, type SelectionClipboard } from './grid-actions';
import './grid.css';

/** The grid's palette and its font family, as the theme in force gives them. */
export type GridLook = { theme: ITheme; fontFamily: string };

/** The sixteen ANSI slots, in xterm's order: each name and its bright twin from one token. */
const ANSI: [keyof ITheme, string][] = COLOR_NAMES.flatMap((name) => {
    const bright = `bright${name[0].toUpperCase()}${name.slice(1)}` as keyof ITheme;
    const token = colorToken(name) ?? '';
    return [
        [name, token],
        [bright, token]
    ] as [keyof ITheme, string][];
});

/**
 * The grid's palette and font in force, read off the body, which is where the theme's class sits
 * and where its tokens are set (`body.rice.dracula` and the like in themes/rice/); the root element
 * carries the light defaults only, so a read there would paint a light grid under a dark theme.
 * The grid paints no background: its background is the panel's colour with no alpha, so the
 * Terminal view's box behind it shows (Terminal.svelte), solid in the panel's colour, or over a
 * wallpaper at the terminal's share of it (`--terminal-on-wall`), and xterm takes the panel's
 * colour for what it derives from the background: inverse video and the selection's blend. Every
 * theme's `--panel` is a hex colour; one that is not is handed on whole, and the grid then paints
 * it solid.
 * The font is the page's monospace token, and a selection is drawn as the selected row of a tree
 * is, on `--accent-bg` in `--on-accent-bg`, the one selection surface every theme derives. Before
 * a theme is applied the root carries no `--on-accent-bg`, and the selection is then drawn in
 * `--ink`, as every other use of that token falls back.
 */
export function gridLook(): GridLook {
    const root = getComputedStyle(document.body);
    const of = (name: string) => root.getPropertyValue(name).trim();
    const theme: ITheme = {
        background: clear(of('--panel')),
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
 * (`convertEol` off, so xterm adds no carriage return), the font size when there is one, xterm's
 * own size otherwise, xterm's proposed API, which the search addon's match marks and the
 * wide-character tables (`term.unicode`) need and throw without, and the cursor and Option options
 * the config holds (`terminal`). An option the config leaves out is left out, so xterm's own
 * default stands; the copy key is the grid's to follow (`followTerminalOptions`), not xterm's.
 */
export function gridOptions(
    look: GridLook,
    size: number | undefined,
    terminal: TerminalOptions = {}
): ITerminalOptions {
    const options: ITerminalOptions = { ...look, convertEol: false, allowProposedApi: true };
    if (size !== undefined) options.fontSize = size;
    if (terminal.cursorStyle !== undefined) options.cursorStyle = terminal.cursorStyle;
    if (terminal.cursorBlink !== undefined) options.cursorBlink = terminal.cursorBlink;
    if (terminal.macOptionIsMeta !== undefined) options.macOptionIsMeta = terminal.macOptionIsMeta;
    return options;
}

/** What `followTerminalOptions` needs of a grid: its options and its selection. */
export type OptionsTarget = {
    options: ITerminalOptions;
    getSelection: () => string;
    onSelectionChange: (listener: () => void) => { dispose: () => void };
};

/**
 * Put the config's cursor and Option options on a grid that is already drawn, and follow its
 * copy key. An option the config leaves out goes back to xterm's default (a block cursor that does
 * not blink, Option not Meta), since a key taken out of the file is a change like any other. Only
 * options are set, so the grid is neither refitted nor resized. While copy on selection is on, each
 * change of the selection that leaves text selected writes it to the clipboard `clipboard` answers
 * at that moment; the call returned stops following.
 */
export function followTerminalOptions(
    term: OptionsTarget,
    options: TerminalOptions,
    clipboard: () => SelectionClipboard | undefined
): () => void {
    term.options.cursorStyle = options.cursorStyle ?? 'block';
    term.options.cursorBlink = options.cursorBlink ?? false;
    term.options.macOptionIsMeta = options.macOptionIsMeta ?? false;
    if (options.copyOnSelection !== true) return () => undefined;
    const listening = term.onSelectionChange(() => {
        copySelection(term.getSelection(), clipboard());
    });
    return () => listening.dispose();
}

/**
 * Put a look on a grid that is already drawn: the palette always, since a theme change moves it,
 * and the font family only when it differs, since setting it makes xterm measure its cells again.
 */
export function applyLook(options: ITerminalOptions, look: GridLook): void {
    options.theme = look.theme;
    if (options.fontFamily !== look.fontFamily) options.fontFamily = look.fontFamily;
}

/** The colours the search addon marks matches in: its decoration options. */
export type FindLook = NonNullable<ISearchOptions['decorations']>;

/** A hex colour with its alpha set to none, `#rrggbb00`; any other colour as it was. */
function clear(value: string): string {
    const six = sixDigits(value);
    return six.startsWith('#') ? `${six}00` : value;
}

/**
 * A colour as `#rrggbb`, which is the one form the search addon draws a mark in: a three- or
 * four-digit hex is spelled out and an alpha channel dropped. Anything that is not a hex colour is
 * handed on as it was; every theme's accent tokens are hex, so none reaches the addon that way.
 */
function sixDigits(value: string): string {
    const digits = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value)?.[1];
    if (digits === undefined) return value;
    const long = digits.length <= 4 ? digits.replace(/./g, '$&$&') : digits;
    return `#${long.slice(0, 6).toLowerCase()}`;
}

/**
 * The find bar's match colours in force, read off the body as `gridLook` reads the palette: every
 * match on `--accent-bg`, the surface a selected row sits on, and the active match in `--accent`,
 * each also its mark in the overview ruler. Read again on every theme change.
 */
export function findLook(): FindLook {
    const root = getComputedStyle(document.body);
    const of = (name: string) => sixDigits(root.getPropertyValue(name).trim());
    const match = of('--accent-bg');
    const active = of('--accent');
    return {
        matchBackground: match,
        matchOverviewRuler: match,
        activeMatchBackground: active,
        activeMatchColorOverviewRuler: active
    };
}
