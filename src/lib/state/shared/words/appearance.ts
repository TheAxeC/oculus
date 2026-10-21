// Layer 2, client state. The appearance options as the page reads them out of the merged config:
// the theme list's order, the class string each theme puts on the body, the words it is offered
// under, the glyph drawn before them and the group it is drawn in, the wallpaper's numbers, the
// terminal grid's text size, cursor, Option key and copy-on-selection settings, the code theme of
// the editors, what a pane's top row draws (`show_tabs`, `editor_actions`), and the look
// (`configuredLook`): the theme, the theme a page in the desktop app's window starts on, the text
// size, the terminal themes' three settings, the wallpaper's and the CRT overlay's switches and the
// status bar's three values. It is installed the way the tone vocabulary is: the server ships these
// keys as the page's data at first load, and every later edit of oculus's defaults, the hub's
// settings file or the workspace file's `settings:` arrives on the `config` channel, so a theme is
// added by editing YAML and nothing else.
//
// The colour themes the acting apps offer are not held here: the apps store holds the offers made
// from the rows of the `apps` channel (null until the first payload arrives), and every reader that
// lists or tells an app theme takes them as `offers`. An app theme is offered under its saved name
// (data/helpers/files/apps/choices.ts) and draws as the body class `app-theme` once the page has
// converted its file (ui/theme/app-theme.ts). A page with no `apps` channel takes its offers from
// the files of the app themes the `theme` and `app_theme` options name, which its first load
// carries (choices.ts, `fileOffers`). An app theme whose app is not approved and enabled, or whose
// file does not resolve, draws as the start theme (`startChoice`).
//
// The file icon theme is the `file_icons` key, read from the configuration the caller holds
// (`fileIconsOf`): `seti` or the saved name of an icon theme an acting app offers, which the
// readers tell from the same `offers`. The page draws an app's icon theme once its file has been
// loaded (ui/display/icon-theme/held.svelte.ts), and draws Seti while its app is not offering it or
// the payload has not arrived.
//
// This holds no runes of its own: every lookup is pure over what was last installed and reads the
// configuration's generation, state/shared/words/generation.svelte.ts, so a component calling one
// during its first render gets the page's data and draws again when a push replaces it. A change of
// one of these options is written by state/workbench/ui.svelte.ts through the Settings write path,
// which holds the value it sent until the push that carries it arrives.
//
// Each key of the file is read through a schema below that repairs a value of the wrong type to
// its default, so a half-edited file still draws a page.

import { z } from 'zod';
import { configGeneration } from './generation.svelte.ts';
import { hasGlyph, t } from './text.ts';
import { CODE_TOKENS, isCodeTheme } from '../../../data/helpers/editor/code-themes.ts';
import { startOf, startTheme } from '../../../data/helpers/editor/start-theme.ts';
import {
    APP_THEME_CLASS,
    splitAppChoice,
    type AppOffers,
    type IconThemeOffer,
    type ThemeOffer
} from '../../../data/helpers/files/apps/choices.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { anyNumberShape, readAs, rowsShape } from '../../../data/shapes/shapes.ts';

/** The `file_icons` value that draws Seti, the default file icon theme. */
const SETI_ICONS = 'seti';

/**
 * One theme of the theme list: the name the store saves, the body class, the glyph name drawn
 * before the words (empty for a row that names none), the words shown, and the words of the group
 * the Settings view's choice and Cmd-K's `:theme` draw it under (empty for a row drawn before the
 * groups).
 */
export type Theme = { name: string; class: string; glyph: string; label: string; group: string };

/**
 * The wallpaper as the `wallpaper` options describe it, with every number already resolved: the
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
    /** The same for the editor, `editor.opacity`; the pane's when the key is left out. */
    editor: number;
    /** The same for the Terminal view, `terminal.opacity`; the pane's when the key is left out. */
    terminal: number;
    /** Backdrop blur behind a pane, in pixels. */
    panelBlur: number;
};

/**
 * The terminal grid's settings from the `terminal` options, in xterm's own names and
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

/** The theme a browser starts on when the `themes` option lists none at all. */
const FALLBACK_THEME = 'light';

/**
 * The theme a page shows: the named one when `listed` holds it, or an app's theme while `pending`
 * says the apps have sent nothing of it, else the start. The start is `start` (the `app_theme`
 * option, for a page in the desktop app's window) when `listed` holds it, and the `fallback` (the
 * first theme listed) otherwise: the rule `startTheme` of data/helpers/editor/start-theme.ts,
 * which the desktop host reads the window's first colours by. A pure function of its arguments.
 */
function chosenTheme(
    saved: unknown,
    start: string | undefined,
    listed: readonly string[],
    fallback: string,
    pending = false
): string {
    if (pending && typeof saved === 'string' && splitAppChoice(saved) !== null) return saved;
    return startTheme(saved, listed, start, fallback);
}

/**
 * The look the options set, as the merged config holds them: the theme named (empty for the
 * start), the theme a page in the desktop app's window starts on (`app_theme`), the text size, the
 * terminal themes' three settings (`rice.icons`, `rice.brackets` and `rice.monospace`), whether
 * the wallpaper shows (`shown`, `hidden`, or empty for the theme's answer), whether the CRT overlay
 * is drawn, and the status bar's hidden items, Do Not Disturb and the repository last chosen in it.
 */
export type Look = {
    theme: string;
    appTheme: string;
    textSize: number;
    icons: boolean;
    brackets: boolean;
    monospace: boolean;
    wallpaper: 'shown' | 'hidden' | '';
    crt: boolean;
    statusHidden: string[];
    statusQuiet: boolean;
    statusRepository: string;
};

/** The look of a config that sets none of its keys, which oculus's defaults files also hold. */
const NO_LOOK: Look = {
    theme: '',
    appTheme: '',
    textSize: 1,
    icons: false,
    brackets: true,
    monospace: true,
    wallpaper: '',
    crt: false,
    statusHidden: [],
    statusQuiet: false,
    statusRepository: ''
};

let list: Theme[] = [];
let byName: Record<string, Theme | undefined> = {};
let paper: Wallpaper | null = null;
let look: Look = NO_LOOK;
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
 * The `opacity` of an `editor:` or `terminal:` block, a fraction cut to 0..1, or undefined when the
 * block holds no number there, so a key left out follows `wallpaper.panel_opacity`.
 */
const opacityShape = z.object({
    opacity: z
        .number()
        .transform((value) => Math.min(1, Math.max(0, value)))
        .optional()
        .catch(undefined)
});

/** The share, a percentage, an `editor:` or `terminal:` block keeps: its own, or `panel`. */
function shareOf(block: unknown, panel: number): number {
    const opacity = readAs(opacityShape, block)?.opacity;
    return opacity === undefined ? panel : percent(opacity);
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
    .transform((raw): Omit<Wallpaper, 'editor' | 'terminal'> => {
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

/**
 * One row of the `themes` key: the name is a word that is not empty and not `__proto__`, and a
 * group that is not words is none, so the row is drawn before the groups.
 */
const themeRowShape = z
    .object({
        name: z
            .string()
            .min(1)
            .refine((name) => name !== '__proto__'),
        class: z.string().catch(''),
        glyph: z.string().catch(''),
        label: z.string().optional().catch(undefined),
        group: z.string().catch('')
    })
    .transform((row): Theme => ({
        name: row.name,
        class: row.class,
        glyph: row.glyph,
        label: row.label ?? row.name,
        group: row.group
    }));

/** The rows of the `themes` key that are themes, in the config's order. */
const themeRowsShape = rowsShape(themeRowShape);

/** The `show_tabs` key; a value that is none of the three reads as `multiple`. */
const tabBarShape = z.enum(['multiple', 'single', 'none']).catch('multiple');

/** The `editor_actions` key; a value that is neither of the two reads as `strip`. */
const editorActionsShape = z.enum(['strip', 'hidden']).catch('strip');

/** A text size the options allow: 0.7 to 1.6 in tenths, and one for any other value. */
export function boundedTextSize(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
    return Math.min(1.6, Math.max(0.7, Math.round(value * 10) / 10));
}

/**
 * The keys of the look, each read on its own: a key that is missing or of the wrong type reads as
 * the value a config that sets none holds, so a half-edited file still draws a page.
 */
const lookShape = z
    .object({
        theme: z.string().catch(NO_LOOK.theme),
        app_theme: z.string().catch(NO_LOOK.appTheme),
        text_size: z.unknown().transform(boundedTextSize),
        rice: z
            .object({
                icons: z.boolean().catch(NO_LOOK.icons),
                brackets: z.boolean().catch(NO_LOOK.brackets),
                monospace: z.boolean().catch(NO_LOOK.monospace)
            })
            .catch({
                icons: NO_LOOK.icons,
                brackets: NO_LOOK.brackets,
                monospace: NO_LOOK.monospace
            }),
        wallpaper: z
            .object({ show: z.enum(['shown', 'hidden', '']).catch('') })
            .catch({ show: '' }),
        crt: z.object({ on: z.boolean().catch(false) }).catch({ on: false }),
        status_bar: z
            .object({
                hidden: rowsShape(z.string().min(1))
                    .transform((items) => [...new Set(items)])
                    .catch([]),
                quiet: z.boolean().catch(false),
                repository: z.string().catch('')
            })
            .catch({ hidden: [], quiet: false, repository: '' })
    })
    .transform((node): Look => ({
        theme: node.theme,
        appTheme: node.app_theme,
        textSize: node.text_size,
        icons: node.rice.icons,
        brackets: node.rice.brackets,
        monospace: node.rice.monospace,
        wallpaper: node.wallpaper.show,
        crt: node.crt.on,
        statusHidden: node.status_bar.hidden,
        statusQuiet: node.status_bar.quiet,
        statusRepository: node.status_bar.repository
    }));

/**
 * Install the theme list from the merged config's `themes` key. A row with no `name` is dropped,
 * and so is a row repeating a name an earlier row gave, since the theme list keys its entries by
 * the name; a row with no `class` is the empty class, which is what the light theme carries. A key
 * the config does not hold installs as an empty list, so the lookups answer with their own
 * fallbacks rather than throwing and a half-read config still renders a page.
 * data/sources/config/sections/themes.ts reports the rows this drops or draws without a glyph.
 *
 * `classes` are the classes a VS Code code theme may name, the keys of the TextMate rules the
 * checkout ships (data/places/code-rules.ts), which the server hands the page beside the config: a
 * row of `code_themes.vscode` whose class is not among them makes no code theme
 * (data/helpers/editor/code-themes.ts), so a `code_theme` naming it installs as `tokens`.
 */
export function setAppearance(config: Record<string, unknown>, classes: readonly string[]): void {
    list = [];
    byName = {};
    const wall = readAs(wallpaperShape, config.wallpaper);
    paper =
        wall === null
            ? null
            : {
                  ...wall,
                  editor: shareOf(config.editor, wall.panel),
                  terminal: shareOf(config.terminal, wall.panel)
              };
    look = readAs(lookShape, config) ?? NO_LOOK;
    codeTheme = isCodeTheme(config.code_theme, config, new Set(classes))
        ? config.code_theme
        : CODE_TOKENS;
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

/** The saved names of the app themes the page can draw: the ones the offers hold. */
function drawable(offers: AppOffers): string[] {
    return (offers.themes ?? []).map((offer) => offer.choice);
}

/** The offer an app theme's saved name stands for, or undefined. */
function offerOf(name: string, offers: AppOffers): ThemeOffer | undefined {
    return offers.themes?.find((offer) => offer.choice === name);
}

/**
 * What the page knows of a saved theme name: `none` for a theme of the configuration, `pending`
 * for an app's theme while the offers hold no list, `ready` for one the offers hold and `missing`
 * for one they do not.
 */
export function appThemeState(
    name: string,
    offers: AppOffers
): 'none' | 'pending' | 'ready' | 'missing' {
    configGeneration();
    if (Object.hasOwn(byName, name) || splitAppChoice(name) === null) return 'none';
    if (offers.themes === null) return 'pending';
    return offerOf(name, offers) === undefined ? 'missing' : 'ready';
}

/**
 * Every theme the theme list offers, in the config's order and then the apps' themes, each app's
 * themes in the group of the app's title. A copy, so a caller cannot edit the list. A glyph the
 * vocabulary does not hold, or none, is the empty name: the row is drawn with its words alone
 * rather than as a Glyph that throws.
 */
export function themes(offers: AppOffers): Theme[] {
    configGeneration();
    const own = list.map((theme) => ({
        ...theme,
        glyph: hasGlyph(theme.glyph) ? theme.glyph : ''
    }));
    const glyph = hasGlyph('theme_base') ? 'theme_base' : '';
    const apps = (offers.themes ?? []).map((offer) => ({
        name: offer.choice,
        class: APP_THEME_CLASS,
        glyph,
        label: appThemeWords(offer),
        group: offer.appTitle
    }));
    return [...own, ...apps];
}

/** An app theme's words in the theme list: its label, then the title of the app that offers it. */
function appThemeWords(offer: ThemeOffer): string {
    return `${offer.label} (${offer.appTitle})`;
}

/**
 * The body class string a theme lands on the document as, on a page in the desktop app's window
 * when `inApp` is true. The light theme's is empty. An app's theme is `app-theme` while it is
 * `ready`; while it is `pending` (the apps are not known yet) or `missing` (its app is not approved
 * and enabled, or its file does not resolve), it is the class of the start theme (`startChoice`),
 * the theme the desktop host fills the window with in its window.
 */
export function themeClass(name: string, offers: AppOffers, inApp: boolean): string {
    configGeneration();
    const state = appThemeState(name, offers);
    if (state === 'ready') return APP_THEME_CLASS;
    if (state === 'none') return byKey(byName, name)?.class ?? '';
    const start = startChoice(inApp, offers);
    if (appThemeState(start, offers) === 'ready') return APP_THEME_CLASS;
    return byKey(byName, start)?.class ?? '';
}

/**
 * The offers less the colour themes `names` holds, which a page could not get the file of, so the
 * page passes over each of them to the start theme as it passes over a theme no acting app offers.
 */
export function withoutThemes(offers: AppOffers, names: readonly string[]): AppOffers {
    if (offers.themes === null || names.length === 0) return offers;
    return { ...offers, themes: offers.themes.filter((one) => !names.includes(one.choice)) };
}

/**
 * The name of the theme a page starts on, by startTheme over the theme list and the app themes the
 * page can draw (`drawable`): the theme `app_theme` names in the desktop app's window when the page
 * can draw it, an app's theme included, and the first theme of the list otherwise and elsewhere.
 * The page draws it for an app's theme that is not `ready`.
 */
export function startChoice(inApp: boolean, offers: AppOffers): string {
    configGeneration();
    const names = [...list.map((theme) => theme.name), ...drawable(offers)];
    return startTheme(undefined, names, inApp ? look.appTheme : undefined, defaultTheme());
}

/**
 * The class of the theme of the list a page starts on, by `startOf` of
 * data/helpers/editor/start-theme.ts, the lookup the desktop host's window start makes too: the
 * theme `app_theme` names in the desktop app's window when the list holds it, and the first theme
 * otherwise and elsewhere. The page draws it for an app's theme whose file it cannot load, the
 * start of `startChoice` among them.
 */
export function startClass(inApp: boolean): string {
    configGeneration();
    const start = startOf(list, [], undefined, inApp ? look.appTheme : undefined);
    return 'cls' in start ? start.cls : '';
}

/** A theme's words in the theme list, and the theme's own name for one the config does not list. */
export function themeLabel(name: string, offers: AppOffers): string {
    configGeneration();
    const offer = offerOf(name, offers);
    if (offer !== undefined) return appThemeWords(offer);
    return byKey(byName, name)?.label ?? name;
}

/** The words of the colour themes the acting apps offer, as the theme list lists them. */
export function appThemeLabels(offers: AppOffers): string[] {
    configGeneration();
    return (offers.themes ?? []).map(appThemeWords);
}

/**
 * The name of the theme a text stands for: a name the theme list holds, or the words it lists one
 * by (an app's theme is `Paper (Notes)`), without regard to case. Null for a text naming none.
 */
export function themeNamed(text: string, offers: AppOffers): string | null {
    const wanted = text.trim().toLowerCase();
    const all = themes(offers);
    const found =
        all.find((one) => one.name.toLowerCase() === wanted) ??
        all.find((one) => one.label.toLowerCase() === wanted);
    return found?.name ?? null;
}

/** The theme a browser starts on when the `theme` option names none: the first the config lists. */
function defaultTheme(): string {
    configGeneration();
    return list[0]?.name ?? FALLBACK_THEME;
}

/**
 * The theme a page shows given the name it is asked for (any value, since an option or a preview
 * may name anything) and whether the page is in the desktop app's window: `chosenTheme` over the
 * list the config installed and the app themes the page can draw (`drawable`), with the
 * `app_theme` option as the start in the desktop app's window. An app's theme is kept while the
 * offers hold no list.
 */
export function themeFor(saved: unknown, inApp: boolean, offers: AppOffers): string {
    configGeneration();
    return chosenTheme(
        saved,
        inApp ? look.appTheme : undefined,
        [...list.map((theme) => theme.name), ...drawable(offers)],
        defaultTheme(),
        offers.themes === null
    );
}

/**
 * The look the merged config sets: the `theme`, `text_size`, `rice`, `wallpaper.show` and `crt.on`
 * options of the appearance defaults and the `status_bar` options of the behavior defaults, as the
 * open workspace file or oculus's defaults hold them.
 */
export function configuredLook(): Look {
    configGeneration();
    return look;
}

/**
 * The theme the config names, or the start when it names none or one neither the config nor the
 * offers hold. A page with no `apps` channel, the find bar and the presenter's pages, draws it
 * with the offers its first load's files make (choices.ts, `fileOffers`).
 */
export function configuredTheme(inApp: boolean, offers: AppOffers): string {
    return themeFor(configuredLook().theme, inApp, offers);
}

/**
 * The code theme the editors draw: the `code_theme` option when it is `tokens`, the class of a VS
 * Code code theme or the id of a Shiki theme the choice offers, otherwise `tokens`, which
 * data/sources/config/sections/themes.ts reports.
 */
export function codeThemeDefault(): string {
    configGeneration();
    return codeTheme;
}

/** How many tabs a pane's top row draws, the `show_tabs` option. */
export function showTabs(): TabBar {
    configGeneration();
    return tabBar;
}

/** Where a pane draws its actions, the `editor_actions` option. */
export function editorActions(): EditorActions {
    configGeneration();
    return actionsAt;
}

/** Whether a pane's strip wraps its tabs onto more rows, the `wrap_tabs` option. */
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

/** The wallpaper's numbers, or null when the `wallpaper` options configure none. */
export function wallpaperSettings(): Wallpaper | null {
    configGeneration();
    return paper;
}

/**
 * Whether the wallpaper shows under a theme: never when none is configured, otherwise every theme
 * under `themes: all` and only the terminal palettes under `themes: rice`, which is the class the
 * palettes that were built to be seen through carry.
 */
export function wallpaperOnTheme(name: string, offers: AppOffers, inApp: boolean): boolean {
    configGeneration();
    if (paper === null) return false;
    if (paper.themes === 'all') return true;
    return terminalTheme(name, offers, inApp);
}

/**
 * Whether a theme is one of the terminal palettes, which is what its class string carrying `rice`
 * says. It is the condition for two things: the wallpaper under `themes: rice`, and the ASCII
 * stand-ins, since a drawn icon in the corner of a terminal screenshot is what they exist to
 * remove.
 */
export function terminalTheme(name: string, offers: AppOffers, inApp: boolean): boolean {
    return themeClass(name, offers, inApp).split(/\s+/).includes(RICE);
}

/** The label of a saved app theme, or the saved name itself when it names none. */
export function appThemeLabel(choice: string): string {
    return splitAppChoice(choice)?.name ?? choice;
}

/** The file icon theme a configuration names: `seti` or the saved name of an app's theme. */
export function fileIconsOf(config: Record<string, unknown>): string {
    return typeof config.file_icons === 'string' && config.file_icons !== ''
        ? config.file_icons
        : SETI_ICONS;
}

/**
 * What the page knows of the file icon theme saved as `choice`: `seti` for the default (a value
 * that names no app's theme draws Seti too), `pending` for an app's theme while the `apps` channel
 * has sent nothing, `ready` for one an acting app offers and `missing` for one no acting app
 * offers.
 */
export function fileIconsState(
    choice: string,
    offers: AppOffers
): 'seti' | 'pending' | 'ready' | 'missing' {
    if (splitAppChoice(choice) === null) return 'seti';
    if (offers.icons === null) return 'pending';
    return offers.icons.some((offer) => offer.choice === choice) ? 'ready' : 'missing';
}

/** An icon theme's words in the icon theme list: its label, then the title of its app. */
function appIconWords(offer: IconThemeOffer): string {
    return `${offer.label} (${offer.appTitle})`;
}

/** The file icon themes, as the Settings row and `:file-icons` list them: Seti, then the apps'. */
export function fileIconThemes(offers: AppOffers): { name: string; label: string }[] {
    configGeneration();
    return [
        { name: SETI_ICONS, label: t('apps.icons_seti') },
        ...(offers.icons ?? []).map((offer) => ({
            name: offer.choice,
            label: appIconWords(offer)
        }))
    ];
}
