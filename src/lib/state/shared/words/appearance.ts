// Layer 2, client state. config/appearance.yml as the page reads it: the picker's order, the class
// string each theme puts on the body, the words it is offered under and the glyph drawn before
// them, the wallpaper's numbers, what the CRT overlay and terminal text size start as, the terminal
// grid's cursor, Option key and copy-on-selection settings, the code theme the editors start on,
// and what a pane's top row draws (`show_tabs`, `editor_actions`). It is installed the way the tone
// vocabulary is: the server ships the `themes` key as the page's data at first load, and every
// later edit of config/appearance.yml arrives on the `config` channel, so a theme is added by
// editing YAML and nothing else.
//
// This holds no runes of its own: every lookup is pure over what was last installed and reads the
// configuration's generation, state/shared/words/generation.svelte.ts, so a component calling one
// during its first render gets the page's data and draws again when a push replaces it. What the
// viewer picked out of this list is state/workbench/ui.svelte.ts's, which is the store that
// persists.
//
// Each key of the file is read through a schema below that repairs a value of the wrong type to
// its default, so a half-edited file still draws a page.

import { z } from 'zod';
import { configGeneration } from './generation.svelte.ts';
import { hasGlyph } from './text.ts';
import { CODE_TOKENS, isCodeTheme } from '../../../data/helpers/code-themes.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { anyNumberShape, readAs, rowsShape } from '../../../data/shapes/shapes.ts';

export { CODE_TOKENS, codeThemeInfo, isCodeTheme } from '../../../data/helpers/code-themes.ts';

/**
 * One theme of the picker: the name the store saves, the body class, the glyph name drawn before
 * the words (empty for a row that names none), and the words shown.
 */
export type Theme = { name: string; class: string; glyph: string; label: string };

/**
 * The wallpaper as config/appearance.yml describes it, with every number already resolved: the
 * folder and the chosen file are the server's half and are not here, the rest is what the page
 * paints with. `panel` and `popover` are percentages because that is what color-mix takes.
 */
export type Wallpaper = {
    /** How far the image is darkened, 0 raw to 1 black. */
    dim: number;
    /** Blur on the image itself, in pixels. */
    blur: number;
    /** Which themes it shows under: `rice` is the terminal palettes alone, `all` is every theme. */
    themes: 'rice' | 'all';
    /** How solid a pane stays over the image, 0 to 100. */
    panel: number;
    /** The same for a menu, which floats over a pane and so stays closer to solid. */
    popover: number;
    /** Backdrop blur behind a pane, in pixels. */
    panelBlur: number;
};

/**
 * The terminal grid's settings from `terminal:` of config/appearance.yml, in xterm's own names and
 * values. A key the file leaves out, or writes with a value of the wrong type, is absent here, so
 * the grid keeps what it would do without the key.
 */
export type TerminalOptions = {
    /** Whether Option sends Meta on macOS, xterm's `macOptionIsMeta`. */
    macOptionIsMeta?: boolean;
    /** Whether a selection is copied to the clipboard as it is made. */
    copyOnSelection?: boolean;
    /** xterm's `cursorStyle`; the file's `line` is xterm's `bar`. */
    cursorStyle?: 'block' | 'underline' | 'bar';
    /** Whether the cursor blinks, xterm's `cursorBlink`. */
    cursorBlink?: boolean;
};

/** How many tabs a pane's top row draws: all, the active one alone, or none. */
export type TabBar = 'multiple' | 'single' | 'none';

/** Where a pane draws its Split Right button and pane menu. */
export type EditorActions = 'strip' | 'hidden';

/** The class the terminal palettes carry, and the one `themes: rice` selects on. */
const RICE = 'rice';

/** The theme a browser starts on when config/appearance.yml lists none at all. */
const FALLBACK_THEME = 'light';

let list: Theme[] = [];
let byName: Record<string, Theme | undefined> = {};
let paper: Wallpaper | null = null;
let crt = false;
let codeTheme = CODE_TOKENS;
let tabBar: TabBar = 'multiple';
let actionsAt: EditorActions = 'strip';
let wrapping = false;
/** The terminal settings as last installed: the text size, and the four other keys. */
let terminal: { fontPx: number | null; options: TerminalOptions } = { fontPx: null, options: {} };

/** A finite number cut to `low`..`high`; any other value reads as `fallback`. */
function clamped(fallback: number, low: number, high: number): z.ZodType<number> {
    return z
        .number()
        .transform((value) => Math.min(high, Math.max(low, value)))
        .catch(fallback);
}

/** The cursor styles the file names, each as xterm names it. */
const CURSOR_STYLES: Record<string, TerminalOptions['cursorStyle']> = {
    block: 'block',
    underline: 'underline',
    line: 'bar'
};

/** A flag that is left out when the file does not write it as a boolean. */
const flagShape = z.boolean().optional().catch(undefined);

/**
 * The `terminal:` key: the size, bounded and null when the key is absent or not a finite number,
 * and the four other keys, each left out when it is absent or mistyped.
 */
const terminalShape = z
    .object({
        font_px: z
            .number()
            .transform((value) => Math.min(40, Math.max(6, value)))
            .nullable()
            .catch(null),
        mac_option_is_meta: flagShape,
        copy_on_selection: flagShape,
        cursor_style: z.string().catch(''),
        cursor_blinking: flagShape
    })
    .transform((node) => {
        const options: TerminalOptions = {};
        if (node.mac_option_is_meta !== undefined)
            options.macOptionIsMeta = node.mac_option_is_meta;
        if (node.copy_on_selection !== undefined) options.copyOnSelection = node.copy_on_selection;
        const style = byKey(CURSOR_STYLES, node.cursor_style);
        if (style !== undefined) options.cursorStyle = style;
        if (node.cursor_blinking !== undefined) options.cursorBlink = node.cursor_blinking;
        return { fontPx: node.font_px, options };
    });

/** The terminal settings the config holds, and none for a key that is no map. */
function readTerminal(config: Record<string, unknown>): typeof terminal {
    return readAs(terminalShape, config.terminal) ?? { fontPx: null, options: {} };
}

/** A fraction as the percentage color-mix takes. */
function percent(fraction: number): number {
    return Math.round(fraction * 100);
}

/**
 * The `wallpaper` key of the merged config. An unset `popover_opacity` is three quarters of the
 * way from the panel's own opacity to solid, since a menu is read through the pane beneath it as
 * well as through the picture. A `popover_opacity` that is a number but not a finite one is the
 * default of a menu.
 */
const wallpaperShape = z
    .object({
        dim: clamped(0.72, 0, 1),
        blur: clamped(0, 0, 64),
        themes: z.enum([RICE, 'all']).catch(RICE),
        panel_opacity: clamped(0.86, 0, 1),
        popover_opacity: anyNumberShape
            .transform((value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.97))
            .optional()
            .catch(undefined),
        panel_blur: clamped(6, 0, 64)
    })
    .transform((raw): Wallpaper => {
        const panel = percent(raw.panel_opacity);
        return {
            dim: raw.dim,
            blur: raw.blur,
            themes: raw.themes,
            panel,
            popover:
                raw.popover_opacity === undefined
                    ? Math.min(100, Math.round(panel + (100 - panel) * 0.75))
                    : percent(raw.popover_opacity),
            panelBlur: raw.panel_blur
        };
    });

/** One row of the `themes` key: the name is a word that is not empty and not `__proto__`. */
const themeRowShape = z
    .object({
        name: z
            .string()
            .min(1)
            .refine((name) => name !== '__proto__'),
        class: z.string().catch(''),
        glyph: z.string().catch(''),
        label: z.string().optional().catch(undefined)
    })
    .transform((row): Theme => ({
        name: row.name,
        class: row.class,
        glyph: row.glyph,
        label: row.label ?? row.name
    }));

/** The rows of the `themes` key that are themes, in the config's order. */
const themeRowsShape = rowsShape(themeRowShape);

/** The `show_tabs` key; a value that is none of the three reads as `multiple`. */
const tabBarShape = z.enum(['multiple', 'single', 'none']).catch('multiple');

/** The `editor_actions` key; a value that is neither of the two reads as `strip`. */
const editorActionsShape = z.enum(['strip', 'hidden']).catch('strip');

/** The `crt` key: whether the overlay starts on. */
const crtShape = z.object({ default: z.boolean().catch(false) });

/**
 * Install the theme list from the merged config's `themes` key. A row with no `name` is dropped,
 * and so is a row repeating a name an earlier row gave, since the picker keys its entries by the
 * name; a row with no `class` is the empty class, which is what the light theme carries. A key the
 * config does not hold installs as an empty list, so the lookups answer with their own fallbacks
 * rather than throwing and a half-read config still renders a page. data/sources/config/themes.ts
 * reports the rows this drops or draws without a glyph.
 */
export function setAppearance(config: Record<string, unknown>): void {
    list = [];
    byName = {};
    paper = readAs(wallpaperShape, config.wallpaper);
    crt = readAs(crtShape, config.crt)?.default ?? false;
    codeTheme = isCodeTheme(config.code_theme) ? config.code_theme : CODE_TOKENS;
    tabBar = readAs(tabBarShape, config.show_tabs) ?? 'multiple';
    actionsAt = readAs(editorActionsShape, config.editor_actions) ?? 'strip';
    wrapping = config.wrap_tabs === true;
    terminal = readTerminal(config);
    for (const theme of readAs(themeRowsShape, config.themes) ?? []) {
        if (Object.hasOwn(byName, theme.name)) continue;
        list.push(theme);
        byName[theme.name] = theme;
    }
}

/**
 * Every theme the picker offers, in the config's order. A copy, so a caller cannot edit the list.
 * A glyph the vocabulary does not hold, or none, is the empty name: the row is drawn with its
 * words alone rather than as a Glyph that throws.
 */
export function themes(): Theme[] {
    configGeneration();
    return list.map((theme) => ({ ...theme, glyph: hasGlyph(theme.glyph) ? theme.glyph : '' }));
}

/** The body class string a theme lands on the document as. The light theme's is empty. */
export function themeClass(name: string): string {
    configGeneration();
    return byKey(byName, name)?.class ?? '';
}

/** A theme's words in the picker, and the theme's own name for one the config does not list. */
export function themeLabel(name: string): string {
    configGeneration();
    return byKey(byName, name)?.label ?? name;
}

/** The theme a browser that has saved none starts on: the first the config lists. */
export function defaultTheme(): string {
    configGeneration();
    return list[0]?.name ?? FALLBACK_THEME;
}

/** What the CRT overlay starts as, the `crt.default` of config/appearance.yml. */
export function crtDefault(): boolean {
    configGeneration();
    return crt;
}

/**
 * The code theme a browser that has picked none starts on: the `code_theme` of
 * config/appearance.yml when it is `tokens` or the id of a Shiki theme, otherwise `tokens`, which
 * data/sources/config/themes.ts reports.
 */
export function codeThemeDefault(): string {
    configGeneration();
    return codeTheme;
}

/** How many tabs a pane's top row draws, the `show_tabs` of config/appearance.yml. */
export function showTabs(): TabBar {
    configGeneration();
    return tabBar;
}

/** Where a pane draws its actions, the `editor_actions` of config/appearance.yml. */
export function editorActions(): EditorActions {
    configGeneration();
    return actionsAt;
}

/**
 * Whether a pane's strip wraps its tabs onto more rows, the `wrap_tabs` of config/appearance.yml.
 */
export function wrapTabs(): boolean {
    configGeneration();
    return wrapping;
}

/** The terminal grid's configured CSS pixel size, or null when it follows the page's type scale. */
export function terminalFontPx(): number | null {
    configGeneration();
    return terminal.fontPx;
}

/** The terminal grid's cursor, Option key and copy settings the config holds; a copy. */
export function terminalOptions(): TerminalOptions {
    configGeneration();
    return { ...terminal.options };
}

/** The wallpaper's numbers, or null when config/appearance.yml configures none. */
export function wallpaperSettings(): Wallpaper | null {
    configGeneration();
    return paper;
}

/**
 * Whether the wallpaper shows under a theme: never when none is configured, otherwise every theme
 * under `themes: all` and only the terminal palettes under `themes: rice`, which is the class the
 * palettes that were built to be seen through carry.
 */
export function wallpaperOnTheme(name: string): boolean {
    configGeneration();
    if (paper === null) return false;
    if (paper.themes === 'all') return true;
    return terminalTheme(name);
}

/**
 * Whether a theme is one of the terminal palettes, which is what its class string carrying `rice`
 * says. It is the condition for two things: the wallpaper under `themes: rice`, and the ASCII
 * stand-ins, since a drawn icon in the corner of a terminal screenshot is what they exist to
 * remove.
 */
export function terminalTheme(name: string): boolean {
    return themeClass(name).split(/\s+/).includes(RICE);
}
