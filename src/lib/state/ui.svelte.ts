// Layer 2, client state. What the page looks like and what each open view remembers: the theme, the
// CRT overlay, the wallpaper, the glyph mode, and one blob of state per view instance, keyed by the
// instance id the layout gives it. Two instances of the same view therefore remember different
// things, which is what DESIGN.md's "Layout as data" means by separate state by construction.
//
// The four appearance flags save together under the one key, so what a browser was left looking
// like comes back whole. What they start as is config/appearance.yml's, read through
// state/appearance.ts, and never a literal here.
//
// It saves the same way the layout store does, under its own key and through the same small slice of
// Storage, so a test hands it a plain object and no test touches localStorage.

import { crtDefault, defaultTheme, themes, wallpaperOnTheme } from './appearance.ts';

/** The key the appearance and the per-instance state are saved under. */
export const UI_KEY = 'oculus.ui.v1';

/** The envelope version saveUi writes and loadUi demands. */
export const UI_VERSION = 1;

/** What the store needs of a Storage, so a test can hand it a plain object. */
type Storable = Pick<Storage, 'getItem' | 'setItem'>;

type Ui = {
    theme: string;
    crt: boolean;
    wallpaper: boolean;
    unicode: boolean;
    /** One entry per view instance, by instance id. The shape of the value is the view's own. */
    instances: Record<string, unknown>;
};

/**
 * What a browser that has saved nothing starts on. Three of the four come from
 * config/appearance.yml rather than from a literal here: the theme is the first of its list, the
 * overlay is its `crt.default`, and the wallpaper is on wherever one is configured and the theme it
 * starts on is one the wallpaper shows under. The glyphs start as the theme's own, which is the
 * ASCII stand-ins on a terminal palette; `unicode` is what turns that off.
 */
function defaultUi(): Ui {
    const theme = defaultTheme();
    return {
        theme,
        crt: crtDefault(),
        wallpaper: wallpaperOnTheme(theme),
        unicode: false,
        instances: {}
    };
}

const store: { current: Ui } = $state({ current: defaultUi() });

/** A transient signal from a view to the shell that owns the Update tray. */
const updateTray = $state({ requested: 0 });

/** Where save() writes, once loadUi has named it. Nothing is saved before that. */
let backing: Storable | null = null;

/** The theme's name, one of the names config/appearance.yml lists. */
export function theme(): string {
    return store.current.theme;
}

/** Whether the CRT overlay is on. */
export function crt(): boolean {
    return store.current.crt;
}

/**
 * Whether the viewer wants the wallpaper. Whether one is actually drawn is this and the theme
 * together: the shell asks appearance.wallpaperOnTheme() as well, so switching to a theme the
 * wallpaper does not show under hides it without forgetting this.
 */
export function wallpaper(): boolean {
    return store.current.wallpaper;
}

/** Whether the real glyphs are kept on a terminal theme instead of their ASCII stand-ins. */
export function unicode(): boolean {
    return store.current.unicode;
}

/** What a view instance saved, or undefined when it has saved nothing yet. */
export function instanceState(id: string): unknown {
    return store.current.instances[id];
}

/** Ask the shell to open the Update tray. Every request changes the observed value. */
export function requestUpdateTray(): void {
    updateTray.requested += 1;
}

/** The request value the workbench observes without putting shell state in a view. */
export function updateTrayRequested(): number {
    return updateTray.requested;
}

/** A theme name config/appearance.yml lists, and the default for one it does not. */
function known(name: unknown): string {
    if (typeof name !== 'string') return defaultTheme();
    return themes().some((entry) => entry.name === name) ? name : defaultTheme();
}

/**
 * Read the saved appearance and make it current, falling back to the default for anything the saved
 * value does not hold or holds wrongly. Returns whether a saved value was read at all. The default
 * argument is evaluated at the call and not at the import, so a test that never calls this touches
 * no localStorage.
 */
export function loadUi(storage: Storable = localStorage): boolean {
    backing = storage;
    let raw: string | null = null;
    try {
        raw = storage.getItem(UI_KEY);
    } catch {
        // A browser with storage refused still runs; it just forgets the theme.
        raw = null;
    }
    store.current = defaultUi();
    if (raw === null) return false;

    let saved: unknown;
    try {
        saved = JSON.parse(raw);
    } catch {
        return false;
    }
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return false;
    const held = saved as Record<string, unknown>;
    if (held.version !== UI_VERSION) return false;

    const instances = held.instances;
    const started = defaultUi();
    store.current = {
        theme: known(held.theme),
        crt: typeof held.crt === 'boolean' ? held.crt : started.crt,
        wallpaper: typeof held.wallpaper === 'boolean' ? held.wallpaper : started.wallpaper,
        unicode: held.unicode === true,
        instances:
            typeof instances === 'object' && instances !== null && !Array.isArray(instances)
                ? { ...(instances as Record<string, unknown>) }
                : {}
    };
    return true;
}

function save(next: Ui): void {
    store.current = next;
    if (backing === null) return;
    try {
        backing.setItem(UI_KEY, JSON.stringify({ version: UI_VERSION, ...next }));
    } catch {
        // A full or refused storage loses the appearance at the next load and nothing else.
    }
}

/** Switch to a theme. A name config/appearance.yml does not list is the default theme. */
export function setTheme(name: string): void {
    save({ ...store.current, theme: known(name) });
}

/** Turn the CRT overlay on or off. */
export function setCrt(on: boolean): void {
    save({ ...store.current, crt: on });
}

/** Turn the wallpaper on or off. */
export function setWallpaper(on: boolean): void {
    save({ ...store.current, wallpaper: on });
}

/** Keep the real glyphs on a terminal theme, or let it use the ASCII stand-ins. */
export function setUnicode(on: boolean): void {
    save({ ...store.current, unicode: on });
}

/** What a view instance wants remembered. */
export function setInstanceState(id: string, state: unknown): void {
    save({ ...store.current, instances: { ...store.current.instances, [id]: state } });
}
