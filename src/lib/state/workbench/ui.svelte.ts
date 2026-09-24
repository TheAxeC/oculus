// Layer 2, client state. What the page looks like and what each open view remembers: the theme, the
// CRT overlay, the wallpaper, the glyph mode, the app and terminal sizes, and one blob of state per
// view instance, keyed by the instance id the layout gives it. Two instances of the same view
// therefore remember different things.
//
// The six appearance values save together under the one key, so what a browser was left looking
// like comes back whole, and so do the status bar's own two: the items the reader hid from it and
// whether its notifications are kept quiet. What the six start as is config/appearance.yml's, read
// through state/words/appearance.ts, and never a literal here.
//
// It saves the same way the layout store does, under its own key and through the same small slice
// of Storage, so a test hands it a plain object and no test touches localStorage.

import { crtDefault, defaultTheme, themes, wallpaperOnTheme } from '../words/appearance.ts';

/** The key the appearance and the per-instance state are saved under. */
export const UI_KEY = 'oculus.ui.v1';

/** The envelope version saveUi writes. */
export const UI_VERSION = 2;

/**
 * The one earlier envelope loadUi still reads. It differs in a single field: its `wallpaper` was
 * written by every save rather than by the toggle alone, so a value there is not the viewer's
 * choice and is read as none.
 */
const UI_VERSION_UNCHOSEN = 1;

/** What the store needs of a Storage, so a test can hand it a plain object. */
type Storable = Pick<Storage, 'getItem' | 'setItem'>;

type Ui = {
    theme: string;
    crt: boolean;
    /** The toggle's own value, or null wherever a wallpaper shows, which is the theme's answer. */
    wallpaper: boolean | null;
    /** Whether a terminal theme keeps the icons rather than drawing the ASCII stand-ins. */
    icons: boolean;
    textScale: number | null;
    terminalFont: number | null;
    /** The status bar items the reader hid, by the id the bar gives each. */
    statusHidden: string[];
    /** Whether Do Not Disturb is on: a notification goes into the list and shows no toast. */
    statusQuiet: boolean;
    /** One entry per view instance, by instance id. The shape of the value is the view's own. */
    instances: Record<string, unknown>;
};

/**
 * One reorder the keyboard asked a view for: which instance was focused, which card its cursor
 * held, which way it goes, and a sequence number so a view performs one request once. The shell
 * knows nothing of what a card is ordered by, so it asks and the view writes.
 */
export type CardMove = { instance: string; card: string; step: -1 | 1; seq: number };

/** What the page looks like and what each open view remembers, for one client. */
export type UiStore = {
    theme: () => string;
    crt: () => boolean;
    wallpaper: () => boolean;
    icons: () => boolean;
    textScale: () => number | null;
    terminalFont: () => number | null;
    statusHidden: () => string[];
    statusQuiet: () => boolean;
    instanceState: (id: string) => unknown;
    registerUnsaved: (reports: (id: string) => boolean) => void;
    unsaved: (id: string) => boolean;
    requestUpdateTray: () => void;
    updateTrayRequested: () => number;
    requestCardMove: (instance: string, card: string, step: -1 | 1) => void;
    cardMoveRequested: (instance: string) => CardMove | null;
    loadUi: (storage?: Storable) => boolean;
    setTheme: (name: string) => void;
    setCrt: (on: boolean) => void;
    setWallpaper: (on: boolean) => void;
    setIcons: (on: boolean) => void;
    setTextScale: (scale: number | null) => void;
    stepTextScale: (by: -1 | 1) => void;
    setTerminalFont: (size: number | null) => void;
    setStatusHidden: (item: string, hidden: boolean) => void;
    setStatusQuiet: (on: boolean) => void;
    setInstanceState: (id: string, state: unknown) => void;
    clearInstanceState: (id: string) => void;
};

export function createUi(): UiStore {
    /**
     * What a browser that has saved nothing starts on. Two of the six come from
     * config/appearance.yml rather than from a literal here: the theme is the first of its list and
     * the overlay is its `crt.default`. The wallpaper starts on none, which wallpaper() answers
     * from the theme in force, so it shows wherever one is configured until the toggle says
     * otherwise. The glyphs start as the theme's own, which is the ASCII stand-ins on a terminal
     * palette; `icons` is what turns that off and keeps the icons.
     */
    function defaultUi(): Ui {
        const theme = defaultTheme();
        return {
            theme,
            crt: crtDefault(),
            wallpaper: null,
            icons: false,
            textScale: null,
            terminalFont: null,
            statusHidden: [],
            statusQuiet: false,
            instances: {}
        };
    }

    const store: { current: Ui } = $state({ current: defaultUi() });

    /** A transient signal from a view to the shell that owns the Update tray. */
    const updateTray = $state({ requested: 0 });

    const cardMove = $state<{ held: CardMove | null }>({ held: null });

    /** Where save() writes, once loadUi has named it. Nothing is saved before that. */
    let backing: Storable | null = null;

    /** What the stores holding unsaved text registered, asked in turn by unsaved(). */
    const unsavedReports: ((id: string) => boolean)[] = [];

    /** The theme's name, one of the names config/appearance.yml lists. */
    function theme(): string {
        return store.current.theme;
    }

    /** Whether the CRT overlay is on. */
    function crt(): boolean {
        return store.current.crt;
    }

    /**
     * Whether the viewer wants the wallpaper. A browser that has never pressed the toggle holds
     * none, and the answer is then the theme's: on wherever a wallpaper shows, so a save of any
     * other field cannot put it out. Whether one is actually drawn is this and the theme together:
     * the shell asks appearance.wallpaperOnTheme() as well, so switching to a theme the wallpaper
     * does not show under hides it without forgetting the choice.
     */
    function wallpaper(): boolean {
        const chosen = store.current.wallpaper;
        return chosen ?? wallpaperOnTheme(store.current.theme);
    }

    /** Whether the icons are kept on a terminal theme instead of their ASCII stand-ins. */
    function icons(): boolean {
        return store.current.icons;
    }

    /** The app-wide multiplier, or null when the default multiplier of one is in force. */
    function textScale(): number | null {
        return store.current.textScale;
    }

    /** The terminal grid size chosen by the viewer, or null when the config default is in force. */
    function terminalFont(): number | null {
        return store.current.terminalFont;
    }

    /** The status bar items the reader hid. */
    function statusHidden(): string[] {
        return store.current.statusHidden;
    }

    /** Whether Do Not Disturb is on. */
    function statusQuiet(): boolean {
        return store.current.statusQuiet;
    }

    /** What a view instance saved, or undefined when it has saved nothing yet. */
    function instanceState(id: string): unknown {
        return store.current.instances[id];
    }

    /**
     * What answers whether one instance holds text no save has taken. A store that keeps such text
     * registers one at the point the client is wired, so the shell asks the instance id and never a
     * view's own store: a view that gains unsaved state later registers the same way and the pane
     * that closes tabs is not edited for it.
     */
    function registerUnsaved(reports: (id: string) => boolean): void {
        unsavedReports.push(reports);
    }

    /** Whether the instance holds unsaved text, which is what a close asks a confirmation about. */
    function unsaved(id: string): boolean {
        return unsavedReports.some((reports) => reports(id));
    }

    /** Ask the shell to open the Update tray. Every request changes the observed value. */
    function requestUpdateTray(): void {
        updateTray.requested += 1;
    }

    /** The request value the workbench observes without putting shell state in a view. */
    function updateTrayRequested(): number {
        return updateTray.requested;
    }

    /** Ask the view that holds one card to move it one place, in its own order. */
    function requestCardMove(instance: string, card: string, step: -1 | 1): void {
        const seq = (cardMove.held?.seq ?? 0) + 1;
        cardMove.held = { instance, card, step, seq };
    }

    /** The reorder asked of one instance, or null when the last request was for another. */
    function cardMoveRequested(instance: string): CardMove | null {
        const held = cardMove.held;
        return held !== null && held.instance === instance ? held : null;
    }

    /** A theme name config/appearance.yml lists, and the default for one it does not. */
    function known(name: unknown): string {
        if (typeof name !== 'string') return defaultTheme();
        return themes().some((entry) => entry.name === name) ? name : defaultTheme();
    }

    /**
     * Read the saved appearance and make it current, falling back to the default for anything the
     * saved value does not hold or holds wrongly. Returns whether a saved value was read at all.
     * The default argument is evaluated at the call and not at the import, so a test that never
     * calls this touches no localStorage.
     */
    function loadUi(storage: Storable = localStorage): boolean {
        backing = storage;
        let raw: string | null;
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
        if (held.version !== UI_VERSION && held.version !== UI_VERSION_UNCHOSEN) return false;

        const instances = held.instances;
        const started = defaultUi();
        store.current = {
            theme: known(held.theme),
            crt: typeof held.crt === 'boolean' ? held.crt : started.crt,
            wallpaper:
                held.version === UI_VERSION && typeof held.wallpaper === 'boolean'
                    ? held.wallpaper
                    : null,
            icons: typeof held.icons === 'boolean' ? held.icons : held.unicode === true,
            textScale: boundedTextScale(held.textScale),
            terminalFont:
                typeof held.terminalFont === 'number' && Number.isFinite(held.terminalFont)
                    ? Math.min(40, Math.max(6, held.terminalFont))
                    : null,
            statusHidden: Array.isArray(held.statusHidden)
                ? [
                      ...new Set(
                          held.statusHidden.filter(
                              (item): item is string => typeof item === 'string' && item !== ''
                          )
                      )
                  ]
                : [],
            statusQuiet: held.statusQuiet === true,
            instances:
                typeof instances === 'object' && instances !== null && !Array.isArray(instances)
                    ? { ...(instances as Record<string, unknown>) }
                    : {}
        };
        // A value saved under the field's older name, `unicode`, and not under `icons` is read
        // above and written back here under `icons`, so a browser keeps the choice it made.
        if (typeof held.icons !== 'boolean' && typeof held.unicode === 'boolean')
            save(store.current);
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
    function setTheme(name: string): void {
        save({ ...store.current, theme: known(name) });
    }

    /** Turn the CRT overlay on or off. */
    function setCrt(on: boolean): void {
        save({ ...store.current, crt: on });
    }

    /**
     * Turn the wallpaper on or off. The only writer of the field, so the value saved is a choice.
     */
    function setWallpaper(on: boolean): void {
        save({ ...store.current, wallpaper: on });
    }

    /** Keep the icons on a terminal theme, or let it use the ASCII stand-ins. */
    function setIcons(on: boolean): void {
        save({ ...store.current, icons: on });
    }

    /** A tenth-step app-wide multiplier from 0.7 to 1.6, or the null default at one. */
    function setTextScale(scale: number | null): void {
        save({ ...store.current, textScale: boundedTextScale(scale) });
    }

    /** Move the app-wide multiplier by one tenth in either direction. */
    function stepTextScale(by: -1 | 1): void {
        setTextScale((textScale() ?? 1) + by / 10);
    }

    /** Normalise saved and chosen scale values to the ten supported steps and the null default. */
    function boundedTextScale(scale: unknown): number | null {
        if (typeof scale !== 'number' || !Number.isFinite(scale)) return null;
        const bounded = Math.min(1.6, Math.max(0.7, Math.round(scale * 10) / 10));
        return bounded === 1 ? null : bounded;
    }

    /** Choose a terminal grid size between 6 and 40 CSS pixels, or restore the config default. */
    function setTerminalFont(size: number | null): void {
        const bounded =
            size === null || !Number.isFinite(size) ? null : Math.min(40, Math.max(6, size));
        save({ ...store.current, terminalFont: bounded });
    }

    /** Hide one status bar item, or show it again. */
    function setStatusHidden(item: string, hidden: boolean): void {
        if (item === '') return;
        const others = store.current.statusHidden.filter((one) => one !== item);
        save({ ...store.current, statusHidden: hidden ? [...others, item] : others });
    }

    /** Turn Do Not Disturb on or off. */
    function setStatusQuiet(on: boolean): void {
        save({ ...store.current, statusQuiet: on });
    }

    /** What a view instance wants remembered. */
    function setInstanceState(id: string, state: unknown): void {
        save({ ...store.current, instances: { ...store.current.instances, [id]: state } });
    }

    /**
     * Forget an instance's state when its tab closes, so a closed editor's draft does not linger.
     */
    function clearInstanceState(id: string): void {
        if (!(id in store.current.instances)) return;
        const instances = { ...store.current.instances };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete instances[id];
        save({ ...store.current, instances });
    }

    return {
        theme,
        crt,
        wallpaper,
        icons,
        textScale,
        terminalFont,
        statusHidden,
        statusQuiet,
        instanceState,
        registerUnsaved,
        unsaved,
        requestUpdateTray,
        updateTrayRequested,
        requestCardMove,
        cardMoveRequested,
        loadUi,
        setTheme,
        setCrt,
        setWallpaper,
        setIcons,
        setTextScale,
        stepTextScale,
        setTerminalFont,
        setStatusHidden,
        setStatusQuiet,
        setInstanceState,
        clearInstanceState
    };
}
