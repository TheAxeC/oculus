// Layer 2, client state. The appearance options as the page reads them out of the merged config:
// the theme list's order, the class string each theme puts on the body, the words it is offered
// under, the glyph drawn before them and the group it is drawn in, the wallpaper's numbers, the
// text sizes of the terminal grid and the transcript, the grid's cursor, Option key and
// copy-on-selection settings, the agent a start that names none opens with, the code theme of the
// editors, what a pane's top row draws (`show_tabs`, `editor_actions`), and the look
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
// Each key is read through a schema below and invents no value: the merged config holds oculus's
// defaults and keeps a default where a file sets a value the option refuses, with a finding naming
// the key and the value, so a key that does not read is a config the page has not been given. Until
// then the store holds nothing for it, and what it draws (the pane's top row, the wallpaper, the
// look's classes) is not drawn.

import { z } from 'zod';
import { configGeneration } from './generation.svelte.ts';
import { hasGlyph, t } from './text.ts';
import { isCodeTheme } from '../../../data/helpers/editor/code-themes.ts';
import { settingEntry } from '../../../data/sources/config/settings/reader.ts';
import {
    configLooks,
    startOf,
    startTheme,
    type BodyLooks
} from '../../../data/helpers/editor/start-theme.ts';
import {
    APP_THEME_CLASS,
    splitAppChoice,
    type AppOffers,
    type IconThemeOffer,
    type ThemeOffer
} from '../../../data/helpers/files/apps/choices.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { AGENT_IDS, type AgentId } from '../../../data/model/index.ts';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';

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

let list: Theme[] = [];
let byName: Record<string, Theme | undefined> = {};
let paper: Wallpaper | null = null;
let look: Look | null = null;
let codeTheme: string | null = null;
let tabBar: TabBar | null = null;
let actionsAt: EditorActions | null = null;
let wrapping: boolean | null = null;
/**
 * The terminal settings as last installed: the two text sizes, the four other keys, and the agent
 * a start that names none opens with (`terminal.default_agent`), null before the config is.
 */
let terminal: {
    fontPx: number | null;
    transcriptFontPx: number | null;
    options: TerminalOptions;
    agent: AgentId | null;
} = { fontPx: null, transcriptFontPx: null, options: {}, agent: null };

/** The `terminal.default_agent` key: one of the agents oculus starts. */
const startAgentShape = z
    .object({ default_agent: z.string() })
    .transform((node) => AGENT_IDS.find((one) => one === node.default_agent) ?? null);

/** The cursor styles the file names, each as xterm names it. */
const CURSOR_STYLES: Record<string, TerminalOptions['cursorStyle']> = {
    block: 'block',
    underline: 'underline',
    line: 'bar'
};

/** A flag the file may leave out. */
const flagShape = z.boolean().optional();

/** A terminal text size held to the options' bounds of 6 to 40 CSS pixels. */
export function boundedTerminalPx(value: number): number {
    return Math.min(40, Math.max(6, value));
}

/** A terminal text size, bounded, and null when the file leaves the key out. */
const terminalPxShape = z
    .number()
    .transform(boundedTerminalPx)
    .optional()
    .transform((value) => value ?? null);

/**
 * The `terminal:` key: the grid's size and the transcript's, and the four other keys, each left out
 * of the options when the file leaves it out, so the grid keeps xterm's own behaviour for it.
 */
const terminalShape = z
    .object({
        font_px: terminalPxShape,
        transcript_font_px: terminalPxShape,
        mac_option_is_meta: flagShape,
        copy_on_selection: flagShape,
        cursor_style: z.string().optional(),
        cursor_blinking: flagShape
    })
    .transform((node) => {
        const options: TerminalOptions = {};
        if (node.mac_option_is_meta !== undefined)
            options.macOptionIsMeta = node.mac_option_is_meta;
        if (node.copy_on_selection !== undefined) options.copyOnSelection = node.copy_on_selection;
        const style =
            node.cursor_style === undefined ? undefined : byKey(CURSOR_STYLES, node.cursor_style);
        if (style !== undefined) options.cursorStyle = style;
        if (node.cursor_blinking !== undefined) options.cursorBlink = node.cursor_blinking;
        return { fontPx: node.font_px, transcriptFontPx: node.transcript_font_px, options };
    });

/** The terminal settings the config holds, and none for a key that is no map. */
function readTerminal(config: Record<string, unknown>): typeof terminal {
    const read = readAs(terminalShape, config.terminal) ?? {
        fontPx: null,
        transcriptFontPx: null,
        options: {}
    };
    return { ...read, agent: readAs(startAgentShape, config.terminal) };
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
 * The `wallpaper` key of the merged config, each number within the bounds its option holds it to
 * (config/options/appearance.yml). An unset `popover_opacity` is three quarters of the way from the
 * panel's own opacity to solid, since a menu is read through the pane beneath it as well as through
 * the picture.
 */
const wallpaperShape = z
    .object({
        dim: z.number().min(0).max(1),
        blur: z.number().min(0).max(64),
        themes: z.enum([RICE, 'all']),
        panel_opacity: z.number().min(0).max(1),
        popover_opacity: z.number().min(0).max(1).optional(),
        panel_blur: z.number().min(0).max(64)
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

/** The `show_tabs` key. */
const tabBarShape = z.enum(['multiple', 'single', 'none']);

/** The `editor_actions` key. */
const editorActionsShape = z.enum(['strip', 'hidden']);

/** A text size the options allow: 0.7 to 1.6 in tenths. */
export function boundedTextSize(value: number): number {
    return Math.min(1.6, Math.max(0.7, Math.round(value * 10) / 10));
}

/**
 * The keys of the look, every one required, so a config missing one gives no look. The three
 * options the body's class is joined with, `crt.on`, `rice.brackets` and `rice.monospace`, are read
 * by `configLooks` of data/helpers/editor/start-theme.ts, by which the server reads them for the
 * class it sends the page with, so the two reads cannot disagree.
 */
const lookShape = z
    .object({
        theme: z.string(),
        app_theme: z.string(),
        text_size: z.number().transform(boundedTextSize),
        rice: z.object({ icons: z.boolean() }),
        wallpaper: z.object({ show: z.enum(['shown', 'hidden', '']) }),
        status_bar: z.object({
            hidden: z.array(z.string().min(1)).transform((items) => [...new Set(items)]),
            quiet: z.boolean(),
            repository: z.string()
        })
    })
    .transform((node): Omit<Look, keyof BodyLooks> => ({
        theme: node.theme,
        appTheme: node.app_theme,
        textSize: node.text_size,
        icons: node.rice.icons,
        wallpaper: node.wallpaper.show,
        statusHidden: node.status_bar.hidden,
        statusQuiet: node.status_bar.quiet,
        statusRepository: node.status_bar.repository
    }));

/** The look of a merged config, or null for one that lacks a key of it. */
function readLook(config: Record<string, unknown>): Look | null {
    const own = readAs(lookShape, config);
    const body = configLooks(config);
    return own === null || body === null ? null : { ...own, ...body };
}

/**
 * The default of the options entry of `code_theme`, which a saved value that names no code theme
 * reads, or null for a configuration that holds no options catalog yet or an entry whose default
 * names no code theme.
 */
function entryTheme(config: Record<string, unknown>, ruled: ReadonlySet<string>): string | null {
    try {
        const held = settingEntry(config, 'code_theme', 'appearance.yml').default;
        return isCodeTheme(held, config, ruled) ? held : null;
    } catch {
        return null;
    }
}

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
 * (data/helpers/editor/code-themes.ts), so a `code_theme` naming it installs as the default of the
 * key's options entry (`entryTheme`).
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
    look = readLook(config);
    const ruled = new Set(classes);
    codeTheme = isCodeTheme(config.code_theme, config, ruled)
        ? config.code_theme
        : entryTheme(config, ruled);
    tabBar = readAs(tabBarShape, config.show_tabs);
    actionsAt = readAs(editorActionsShape, config.editor_actions);
    wrapping = typeof config.wrap_tabs === 'boolean' ? config.wrap_tabs : null;
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
    return startTheme(undefined, names, inApp ? look?.appTheme : undefined, defaultTheme());
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
    const start = startOf(list, [], undefined, inApp ? look?.appTheme : undefined);
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

/**
 * The theme a browser starts on when the `theme` option names none: the first the config lists, and
 * the empty name, which draws no theme class, while the config lists none.
 */
function defaultTheme(): string {
    configGeneration();
    return list[0]?.name ?? '';
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
        inApp ? look?.appTheme : undefined,
        [...list.map((theme) => theme.name), ...drawable(offers)],
        defaultTheme(),
        offers.themes === null
    );
}

/**
 * The look the merged config sets: the `theme`, `text_size`, `rice`, `wallpaper.show` and `crt.on`
 * options of the appearance defaults and the `status_bar` options of the behavior defaults, as the
 * open workspace file or oculus's defaults hold them. Null before a config is installed and for one
 * that lacks a key of it.
 */
export function configuredLook(): Look | null {
    configGeneration();
    return look;
}

/**
 * The theme the config names, or the start when it names none, names one neither the config nor
 * the offers hold, or no look is installed. A page with no `apps` channel, the find bar and the
 * presenter's pages, draws it with the offers its first load's files make (choices.ts,
 * `fileOffers`).
 */
export function configuredTheme(inApp: boolean, offers: AppOffers): string {
    return themeFor(configuredLook()?.theme, inApp, offers);
}

/**
 * The code theme the editors draw: the `code_theme` option when it is `tokens`, the class of a VS
 * Code code theme or the id of a Shiki theme the choice offers, otherwise the default of the key's
 * options entry (`entryTheme`), a value data/sources/config/sections/themes.ts reports; null
 * before a config and when that default names no code theme either.
 */
export function codeThemeDefault(): string | null {
    configGeneration();
    return codeTheme;
}

/** How many tabs a pane's top row draws, the `show_tabs` option, or null before a config. */
export function showTabs(): TabBar | null {
    configGeneration();
    return tabBar;
}

/** Where a pane draws its actions, the `editor_actions` option, or null before a config. */
export function editorActions(): EditorActions | null {
    configGeneration();
    return actionsAt;
}

/**
 * Whether a pane's strip wraps its tabs onto more rows, the `wrap_tabs` option, or null before a
 * config.
 */
export function wrapTabs(): boolean | null {
    configGeneration();
    return wrapping;
}

/** The terminal grid's configured CSS pixel size, or null when it follows the page's type scale. */
export function terminalFontPx(): number | null {
    configGeneration();
    return terminal.fontPx;
}

/** The transcript's configured CSS pixel size, or null when it follows the `--fs-sm` token. */
export function transcriptFontPx(): number | null {
    configGeneration();
    return terminal.transcriptFontPx;
}

/** The terminal grid's cursor, Option key and copy settings the config holds; a copy. */
export function terminalOptions(): TerminalOptions {
    configGeneration();
    return { ...terminal.options };
}

/**
 * The agent a start that names none opens with, the `terminal.default_agent` option, or null before
 * the page has its settings, when such a start does not happen.
 */
export function defaultAgent(): AgentId | null {
    configGeneration();
    return terminal.agent;
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
