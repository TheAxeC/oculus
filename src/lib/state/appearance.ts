// Layer 2, client state. config/appearance.yml as the page reads it: the picker's order, the class
// string each theme puts on the body, the words it is offered under, the wallpaper's numbers and
// what the CRT overlay starts as. It is
// installed the way the tone vocabulary is - the server ships the `themes` key as the page's data at
// first load, and every later edit of config/appearance.yml arrives on the `config` channel - so a
// theme is added by editing YAML and nothing else.
//
// This holds no runes: every lookup is pure over what was last installed, so a component calling one
// during its first render gets the page's data and re-renders when a push replaces it. What the
// viewer picked out of this list is state/ui.svelte.ts's, which is the store that persists.

/** One theme of the picker: the name the store saves, the body class, and the words shown. */
export type Theme = { name: string; class: string; label: string };

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

/** The class the terminal palettes carry, and the one `themes: rice` selects on. */
const RICE = 'rice';

/** The theme a browser starts on when config/appearance.yml lists none at all. */
const FALLBACK_THEME = 'light';

let list: Theme[] = [];
let byName: Record<string, Theme> = {};
let paper: Wallpaper | null = null;
let crt = false;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The string at `key` of a record, or nothing. */
function stringAt(node: unknown, key: string): string | undefined {
    if (!isRecord(node)) return undefined;
    const value = node[key];
    return typeof value === 'string' ? value : undefined;
}

/** The number at `key` of a record, clamped to `low`..`high`, or the fallback when it is not one. */
function numberAt(node: unknown, key: string, fallback: number, low: number, high: number): number {
    const value = isRecord(node) ? node[key] : undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(high, Math.max(low, value));
}

/** A fraction as the percentage color-mix takes. */
function percent(fraction: number): number {
    return Math.round(fraction * 100);
}

/**
 * The `wallpaper` key of the merged config, or null when it holds none. The defaults are the
 * cockpit's, which is where these numbers were arrived at: a busy photograph wants most of its
 * light taken out and the windows over it mostly solid. An unset `popover_opacity` is three
 * quarters of the way from the panel's own opacity to solid, since a menu is read through the pane
 * beneath it as well as through the picture.
 */
function readWallpaper(config: Record<string, unknown>): Wallpaper | null {
    const raw = config.wallpaper;
    if (!isRecord(raw)) return null;
    const panel = percent(numberAt(raw, 'panel_opacity', 0.86, 0, 1));
    const popover =
        typeof raw.popover_opacity === 'number'
            ? percent(numberAt(raw, 'popover_opacity', 0.97, 0, 1))
            : Math.min(100, Math.round(panel + (100 - panel) * 0.75));
    return {
        dim: numberAt(raw, 'dim', 0.72, 0, 1),
        blur: numberAt(raw, 'blur', 0, 0, 64),
        themes: stringAt(raw, 'themes') === 'all' ? 'all' : RICE,
        panel,
        popover,
        panelBlur: numberAt(raw, 'panel_blur', 6, 0, 64)
    };
}

/**
 * Install the theme list from the merged config's `themes` key. A row with no `name` is dropped; a
 * row with no `class` is the empty class, which is what the light theme carries. A key the config
 * does not hold installs as an empty list, so the lookups answer with their own fallbacks rather
 * than throwing and a half-read config still renders a page.
 */
export function setAppearance(config: Record<string, unknown>): void {
    list = [];
    byName = {};
    paper = readWallpaper(config);
    crt = isRecord(config.crt) && config.crt.default === true;
    const rows = config.themes;
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
        const name = stringAt(row, 'name');
        if (name === undefined || name.length === 0) continue;
        const theme: Theme = {
            name,
            class: stringAt(row, 'class') ?? '',
            label: stringAt(row, 'label') ?? name
        };
        list.push(theme);
        byName[name] = theme;
    }
}

/** Every theme the picker offers, in the config's order. A copy, so a caller cannot edit the list. */
export function themes(): Theme[] {
    return [...list];
}

/** The body class string a theme lands on the document as. The light theme's is empty. */
export function themeClass(name: string): string {
    return byName[name]?.class ?? '';
}

/** A theme's words in the picker, and the theme's own name for one the config does not list. */
export function themeLabel(name: string): string {
    return byName[name]?.label ?? name;
}

/** The theme a browser that has saved none starts on: the first the config lists. */
export function defaultTheme(): string {
    return list[0]?.name ?? FALLBACK_THEME;
}

/** What the CRT overlay starts as, the `crt.default` of config/appearance.yml. */
export function crtDefault(): boolean {
    return crt;
}

/** The wallpaper's numbers, or null when config/appearance.yml configures none. */
export function wallpaperSettings(): Wallpaper | null {
    return paper;
}

/**
 * Whether the wallpaper shows under a theme: never when none is configured, otherwise every theme
 * under `themes: all` and only the terminal palettes under `themes: rice`, which is the class the
 * palettes that were built to be seen through carry.
 */
export function wallpaperOnTheme(name: string): boolean {
    if (paper === null) return false;
    if (paper.themes === 'all') return true;
    return terminalTheme(name);
}

/**
 * Whether a theme is one of the terminal palettes, which is what its class string carrying `rice`
 * says. It is the condition for two things: the wallpaper under `themes: rice`, and the ASCII
 * stand-ins, since an emoji in the corner of a terminal screenshot is what they exist to remove.
 */
export function terminalTheme(name: string): boolean {
    return themeClass(name).split(/\s+/).includes(RICE);
}
