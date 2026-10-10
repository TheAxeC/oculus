// Layer 2, client state. What the page looks like and what each open view remembers: the theme, the
// CRT overlay, the wallpaper, the glyph mode, the app and terminal sizes, the code theme of the
// editors, and one blob of state per view instance, keyed by the instance id the layout gives it.
// Two instances of the same view therefore remember different things. A view may also keep a record
// under a fixed id of its own that no instance has, as the file view keeps the places of the PDFs
// it has shown under `pdf-place` (state/sources/explorer/pdf-place.ts).
//
// The seven appearance values save together under the one key, so what a browser was left looking
// like comes back whole, and so do the status bar's own three: the items the reader hid from it,
// whether its notifications are kept quiet and the repository the reader last chose in its
// repository item (a root of the `git` channel, or none). What the seven start as is
// config/appearance.yml's, read through state/shared/words/appearance.ts, and never a literal here.
//
// It saves the same way the layout store does, under its own key and through the same small slice
// of Storage, so a test hands it a plain object and no test touches localStorage.
//
// Every browser tab of one server writes the one key, and the appearance is each tab's own while
// the instance records are the views' state that belongs with the arrangement the layout store
// shares. A save therefore reads the saved value first and writes the saved records with the ones
// this tab changed or removed laid over them, so it never drops a record another tab saved; and the
// store listens for the browser's `storage` event and takes the saved records when another tab
// saves, leaving the appearance as this tab has it (`takeSavedInstances`).

import { z } from 'zod';
import type { BusyTerminal } from '../sessions/terminal/pty/pty-io.ts';
import { mapOfShape, mapShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
import { followKey } from '../shared/stores/storage-events.ts';
import {
    codeThemeDefault,
    crtDefault,
    isCodeTheme,
    themeFor,
    wallpaperOnTheme
} from '../shared/words/appearance.ts';

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

/**
 * The saved envelope, a field at a time. A field of the wrong type reads as the value the viewer
 * never set: absent for a choice, none for a list, off for the quiet flag. The theme, the text
 * scale and the code theme are read as they came, since each is checked against the lists the
 * appearance config holds. The instance records are a fresh map of the saved ones, an own
 * `__proto__` key included.
 */
const savedUiShape = z.object({
    version: z.union([z.literal(UI_VERSION), z.literal(UI_VERSION_UNCHOSEN)]),
    theme: z.unknown().optional(),
    crt: z.boolean().optional().catch(undefined),
    wallpaper: z.boolean().optional().catch(undefined),
    icons: z.boolean().optional().catch(undefined),
    unicode: z.boolean().optional().catch(undefined),
    textScale: z.unknown().optional(),
    terminalFont: z.number().optional().catch(undefined),
    codeTheme: z.unknown().optional(),
    statusHidden: rowsShape(z.string().min(1))
        .transform((items) => [...new Set(items)])
        .catch(() => []),
    statusQuiet: z.boolean().catch(false),
    statusRepository: z.string().min(1).nullable().catch(null),
    instances: mapShape.transform((records) => ({ ...records })).catch(() => ({}))
});

/** A saved envelope as `savedUiShape` reads it. */
type SavedUi = z.infer<typeof savedUiShape>;

/** A number that is not `NaN` or an infinity: a text scale that can be rounded. */
const finiteNumberShape = z.number();

/**
 * The instance records of the storage with an own `__proto__` key left out, because assigning to
 * it would replace the prototype of the map a save builds instead of adding a record.
 */
const savedRecordsShape = mapOfShape(z.unknown());

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
    /**
     * The code theme the viewer picked (`tokens` or a listed Shiki theme id), or null until they
     * pick one, so a save of any other field never freezes config/appearance.yml's `code_theme:`
     * into the envelope and an edit of that key reaches a browser that has not picked.
     */
    codeTheme: string | null;
    /** The status bar items the reader hid, by the id the bar gives each. */
    statusHidden: string[];
    /** Whether Do Not Disturb is on: a notification goes into the list and shows no toast. */
    statusQuiet: boolean;
    /** The repository last chosen in the status bar's repository item, by its root, or none. */
    statusRepository: string | null;
    /**
     * One entry per view instance, by instance id, and one for each fixed id a view keeps a record
     * under. The shape of the value is the view's own.
     */
    instances: Record<string, unknown>;
};

/**
 * One reorder the keyboard asked a view for: which instance was focused, which card its cursor
 * held, which way it goes, and a sequence number so a view performs one request once. The shell
 * knows nothing of what a card is ordered by, so it asks and the view writes.
 */
export type CardMove = { instance: string; card: string; step: -1 | 1; seq: number };

export type { BusyTerminal };

/**
 * The seven appearance values as this browser holds them of its own: a value that is null is one
 * this browser has not chosen, which the config's answer stands in for. `initial()` gives what a
 * browser that saved nothing holds, so a value that differs from it is one this browser chose.
 */
export type Chosen = {
    theme: string;
    codeTheme: string | null;
    textScale: number | null;
    terminalFont: number | null;
    crt: boolean;
    wallpaper: boolean | null;
    icons: boolean;
};

/** An instance as a terminal owner reads it: its identity, its view and the state it holds. */
export type OwnedInstance = { id: string; view: string; state?: unknown };

/**
 * What the store owning terminals registers with the ui store, in the shape of `registerUnsaved`:
 * which running terminals a set of instances owns, a fresh read of which of them run a program, and
 * ending them. The shell asks the instance list and never the terminals store, which it may not
 * read.
 */
export type TerminalOwner = {
    running: (instances: readonly OwnedInstance[]) => string[];
    busy: (ids: string[]) => Promise<BusyTerminal[]>;
    end: (ids: string[]) => void;
};

/** What the page looks like and what each open view remembers, for one client. */
export type UiStore = {
    theme: () => string;
    crt: () => boolean;
    wallpaper: () => boolean;
    icons: () => boolean;
    textScale: () => number | null;
    terminalFont: () => number | null;
    codeTheme: () => string;
    statusHidden: () => string[];
    statusQuiet: () => boolean;
    /** The repository last chosen in the status bar's repository item, by its root, or null. */
    statusRepository: () => string | null;
    chosen: () => Chosen;
    initial: () => Chosen;
    instanceState: (id: string) => unknown;
    registerUnsaved: (reports: (id: string) => boolean) => void;
    unsaved: (id: string) => boolean;
    /** Register what answers whether a file is deleted on disk under a tab that holds it. */
    registerGone: (reports: (root: string, path: string) => boolean) => void;
    /** Whether a tab over this file holds it as deleted on disk. */
    fileGone: (root: string, path: string) => boolean;
    /** Register what saves the tabs a close may save instead of asking about them. */
    registerSaveBeforeClose: (save: (ids: string[]) => Promise<void>) => void;
    /**
     * Save the tabs among these that the autosave mode saves on a close, and answer the ids that
     * hold unsaved text afterwards, which are the ones the close asks about.
     */
    saveBeforeClose: (ids: string[]) => Promise<string[]>;
    registerTerminalOwner: (owner: TerminalOwner) => void;
    busyTerminals: (instances: readonly OwnedInstance[]) => Promise<BusyTerminal[]>;
    endTerminals: (instances: readonly OwnedInstance[]) => void;
    requestUpdateTray: () => void;
    updateTrayRequested: () => number;
    /** Ask the shell to open the palette with this text typed in it. */
    requestPalette: (text: string) => void;
    /** The palette request the workbench observes: its number moves with every request. */
    paletteRequested: () => { seq: number; text: string };
    requestCardMove: (instance: string, card: string, step: -1 | 1) => void;
    cardMoveRequested: (instance: string) => CardMove | null;
    loadUi: (storage?: Storable, source?: EventTarget) => boolean;
    stopFollowing: () => void;
    setTheme: (name: string) => void;
    setCrt: (on: boolean) => void;
    setWallpaper: (on: boolean | null) => void;
    setIcons: (on: boolean) => void;
    setTextScale: (scale: number | null) => void;
    stepTextScale: (by: -1 | 1) => void;
    setTerminalFont: (size: number | null) => void;
    setCodeTheme: (id: string | null) => void;
    setStatusHidden: (item: string, hidden: boolean) => void;
    setStatusQuiet: (on: boolean) => void;
    /** Keep the repository chosen in the status bar's repository item; null forgets it. */
    setStatusRepository: (root: string | null) => void;
    setPaneStrip: (key: PaneStripKey, value: string) => void;
    setInstanceState: (id: string, state: unknown) => void;
    /**
     * Change a record from what the storage holds for it at this moment, which another browser
     * tab may have written since this one last heard of it: `change` is given the saved record,
     * or this tab's when none is saved, and what it returns is kept and saved.
     */
    updateInstanceState: (id: string, change: (held: unknown) => unknown) => void;
    clearInstanceState: (id: string) => void;
    /** The ids of the instance records whose id starts with a prefix. */
    instanceKeys: (prefix: string) => string[];
    /** Forget every instance record whose id starts with a prefix, in one save. */
    clearInstanceStates: (prefix: string) => void;
};

/** The two keys of config/appearance.yml that say what a pane's top row draws. */
export type PaneStripKey = 'show_tabs' | 'editor_actions';

/**
 * The store of the page's look. `writeConfigKey` is the client writes store's: the two pane strip
 * settings live in config/appearance.yml, so a pick of the strip menu is written there rather than
 * saved in the browser, and the store given none ignores the pick.
 */
export function createUi(
    writeConfigKey: (file: string, key: string, value: unknown) => Promise<unknown> = () =>
        Promise.resolve(null),
    inApp = false
): UiStore {
    /**
     * What a browser that has saved nothing starts on. Two of the seven come from
     * config/appearance.yml rather than from a literal here: the theme is the first of its list
     * (the app's dark theme in the desktop app) and the overlay is its `crt.default`. The wallpaper
     * starts on none, which wallpaper() answers from the theme in force, so it shows wherever one
     * is configured until the toggle says otherwise, and the code theme starts on none the same
     * way, answered by codeTheme() from the config's `code_theme:` until a pick is made. The glyphs
     * start as the theme's own, which is the ASCII stand-ins on a terminal palette; `icons` is what
     * turns that off and keeps the icons.
     */
    function defaultUi(): Ui {
        const theme = themeFor(null, inApp);
        return {
            theme,
            crt: crtDefault(),
            wallpaper: null,
            icons: false,
            textScale: null,
            terminalFont: null,
            codeTheme: null,
            statusHidden: [],
            statusQuiet: false,
            statusRepository: null,
            instances: {}
        };
    }

    const store: { current: Ui } = $state({ current: defaultUi() });

    /** A transient signal from a view to the shell that owns the Update tray. */
    const updateTray = $state({ requested: 0 });
    const palette = $state({ seq: 0, text: '' });

    const cardMove = $state<{ held: CardMove | null }>({ held: null });

    /** Where save() writes, once loadUi has named it. Nothing is saved before that. */
    let backing: Storable | null = null;

    /**
     * The instance records as last read from or written to the storage, each as its JSON text: what
     * a save compares this tab's records with to tell the ones this tab changed or removed.
     */
    let synced: Record<string, string> = {};

    /** Stops listening for another browser tab's save, once loadUi was given a window. */
    let unfollow: () => void = () => undefined;

    /** What the stores holding unsaved text registered, asked in turn by unsaved(). */
    const unsavedReports: ((id: string) => boolean)[] = [];

    /** What the stores that know a file's state on disk registered, asked in turn by fileGone(). */
    const goneReports: ((root: string, path: string) => boolean)[] = [];

    /** What saves tabs on a close, registered by the autosave store. */
    const closeSavers: ((ids: string[]) => Promise<void>)[] = [];

    /** The stores owning terminals that registered, asked by busyTerminals() and endTerminals(). */
    const terminalOwners: TerminalOwner[] = [];

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
        const picked = store.current.wallpaper;
        return picked ?? wallpaperOnTheme(store.current.theme);
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

    /** The code theme of the editors: the viewer's pick, else the config's `code_theme:`. */
    function codeTheme(): string {
        return store.current.codeTheme ?? codeThemeDefault();
    }

    /** The status bar items the reader hid. */
    function statusHidden(): string[] {
        return store.current.statusHidden;
    }

    /** Whether Do Not Disturb is on. */
    function statusQuiet(): boolean {
        return store.current.statusQuiet;
    }

    /** The repository last chosen in the status bar's repository item, or null. */
    function statusRepository(): string | null {
        return store.current.statusRepository;
    }

    /** The seven appearance values as this browser holds them of its own. */
    function chosen(): Chosen {
        const { theme, codeTheme, textScale, terminalFont, crt, wallpaper, icons } = store.current;
        return { theme, codeTheme, textScale, terminalFont, crt, wallpaper, icons };
    }

    /** The seven appearance values of a browser that saved nothing, given the config. */
    function initial(): Chosen {
        const { theme, codeTheme, textScale, terminalFont, crt, wallpaper, icons } = defaultUi();
        return { theme, codeTheme, textScale, terminalFont, crt, wallpaper, icons };
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

    /** Register what answers whether a file under an open tab is deleted on disk. */
    function registerGone(reports: (root: string, path: string) => boolean): void {
        goneReports.push(reports);
    }

    /** Whether a tab over the file holds it as deleted on disk. */
    function fileGone(root: string, path: string): boolean {
        return goneReports.some((reports) => reports(root, path));
    }

    /** Register what saves tabs before a close asks about them. */
    function registerSaveBeforeClose(save: (ids: string[]) => Promise<void>): void {
        closeSavers.push(save);
    }

    async function saveBeforeClose(ids: string[]): Promise<string[]> {
        for (const save of closeSavers) await save(ids);
        return ids.filter(unsaved);
    }

    /** Register a store that owns terminals, at the point the client is wired. */
    function registerTerminalOwner(owner: TerminalOwner): void {
        terminalOwners.push(owner);
    }

    /**
     * A fresh read of which running terminals the instances own are running a program other than
     * their shell. Nothing is read for instances owning no running terminal.
     */
    async function busyTerminals(instances: readonly OwnedInstance[]): Promise<BusyTerminal[]> {
        const found = await Promise.all(
            terminalOwners.map((owner) => {
                const ids = owner.running(instances);
                return ids.length === 0 ? Promise.resolve([]) : owner.busy(ids);
            })
        );
        return found.flat();
    }

    /** End the running terminals the instances own. The instances are the ones being removed. */
    function endTerminals(instances: readonly OwnedInstance[]): void {
        for (const owner of terminalOwners) {
            const ids = owner.running(instances);
            if (ids.length > 0) owner.end(ids);
        }
    }

    /** Ask the shell to open the Update tray. Every request changes the observed value. */
    function requestUpdateTray(): void {
        updateTray.requested += 1;
    }

    /** The request value the workbench observes without putting shell state in a view. */
    function updateTrayRequested(): number {
        return updateTray.requested;
    }

    /** Ask the shell to open the palette with a text typed in it, as a view's menu item does. */
    function requestPalette(text: string): void {
        palette.seq += 1;
        palette.text = text;
    }

    function paletteRequested(): { seq: number; text: string } {
        return { seq: palette.seq, text: palette.text };
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

    /** A theme name config/appearance.yml lists, and the start for one it does not. */
    function known(name: unknown): string {
        return themeFor(name, inApp);
    }

    /**
     * Read the saved appearance and make it current, falling back to the default for anything the
     * saved value does not hold or holds wrongly. Returns whether a saved value was read at all.
     * The default argument is evaluated at the call and not at the import, so a test that never
     * calls this touches no localStorage.
     */
    function loadUi(storage: Storable = localStorage, source?: EventTarget): boolean {
        backing = storage;
        unfollow();
        unfollow =
            source === undefined ? () => undefined : followKey(source, UI_KEY, takeSavedInstances);
        store.current = defaultUi();
        synced = {};
        const held = savedHeld(storage);
        if (held === null) return false;

        const { instances } = held;
        const started = defaultUi();
        store.current = {
            theme: known(held.theme),
            crt: held.crt ?? started.crt,
            wallpaper: held.version === UI_VERSION ? (held.wallpaper ?? null) : null,
            icons: held.icons ?? held.unicode === true,
            textScale: boundedTextScale(held.textScale),
            terminalFont:
                held.terminalFont === undefined
                    ? null
                    : Math.min(40, Math.max(6, held.terminalFont)),
            codeTheme: isCodeTheme(held.codeTheme) ? held.codeTheme : null,
            statusHidden: held.statusHidden,
            statusQuiet: held.statusQuiet,
            statusRepository: held.statusRepository,
            instances
        };
        synced = textsOf(instances);
        // A value saved under the field's older name, `unicode`, and not under `icons` is read
        // above and written back here under `icons`, so a browser keeps the choice it made.
        if (held.icons === undefined && held.unicode !== undefined) save(store.current);
        return true;
    }

    /**
     * The saved envelope of a storage when it holds one of a version this store reads, else null:
     * nothing saved, a storage that refuses to be read, a value that does not parse, or another
     * shape.
     */
    function savedHeld(storage: Storable): SavedUi | null {
        let raw: string | null;
        try {
            raw = storage.getItem(UI_KEY);
        } catch {
            // A browser with storage refused still runs; it just forgets the theme.
            return null;
        }
        if (raw === null) return null;
        let saved: unknown;
        try {
            saved = JSON.parse(raw);
        } catch {
            return null;
        }
        return readAs(savedUiShape, saved);
    }

    /** Each record as its JSON text. */
    function textsOf(instances: Record<string, unknown>): Record<string, string> {
        return Object.fromEntries(
            Object.entries(instances).map(([id, state]) => [
                id,
                (JSON.stringify(state) as string | undefined) ?? ''
            ])
        );
    }

    /**
     * The records a save writes: the ones the storage holds, with the ones this tab changed or
     * added laid over them and the ones this tab removed taken out. A record this tab holds as it
     * last read or wrote it is left as the storage has it, so another tab's newer record stands and
     * one it removed stays removed. Where the storage holds nothing readable, every record this tab
     * holds is written.
     */
    function mergedInstances(mine: Record<string, unknown>): Record<string, unknown> {
        const held = backing === null ? null : savedHeld(backing);
        if (held === null) return mine;
        const saved = readAs(savedRecordsShape, held.instances) ?? {};
        const own = readAs(savedRecordsShape, mine) ?? {};
        const texts = textsOf(mine);
        const merged: Record<string, unknown> = {};
        for (const [id, state] of Object.entries(saved)) {
            if (id in mine || !(id in synced)) merged[id] = state;
        }
        for (const [id, state] of Object.entries(own)) {
            if (texts[id] !== synced[id]) merged[id] = state;
        }
        return merged;
    }

    /**
     * Another browser tab saved: take the instance records it left in the storage. The appearance
     * stays as this tab has it, and nothing is written back.
     */
    function takeSavedInstances(): void {
        if (backing === null) return;
        const held = savedHeld(backing);
        if (held === null) return;
        const { instances } = held;
        store.current = { ...store.current, instances };
        synced = textsOf(instances);
    }

    function save(next: Ui): void {
        if (backing === null) {
            store.current = next;
            return;
        }
        const instances = mergedInstances(next.instances);
        store.current = { ...next, instances };
        try {
            backing.setItem(UI_KEY, JSON.stringify({ version: UI_VERSION, ...store.current }));
            synced = textsOf(instances);
        } catch {
            // A full or refused storage loses the appearance at the next load and nothing else; the
            // records stay as they were last saved, so the next save writes them again.
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
     * Turn the wallpaper on or off. The only writer of the field, so the value saved is a choice;
     * null forgets the choice, and the theme's answer applies again.
     */
    function setWallpaper(on: boolean | null): void {
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
        const finite = readAs(finiteNumberShape, scale);
        if (finite === null) return null;
        const bounded = Math.min(1.6, Math.max(0.7, Math.round(finite * 10) / 10));
        return bounded === 1 ? null : bounded;
    }

    /** Choose a terminal grid size between 6 and 40 CSS pixels, or restore the config default. */
    function setTerminalFont(size: number | null): void {
        const bounded =
            size === null || !Number.isFinite(size) ? null : Math.min(40, Math.max(6, size));
        save({ ...store.current, terminalFont: bounded });
    }

    /**
     * Pick the code theme of the editors: `tokens` or the id of a Shiki theme. The only writer of
     * the field, so the value saved is a choice; null, and anything else, the empty string
     * included, clears the pick and the config's `code_theme:` answers again.
     */
    function setCodeTheme(id: string | null): void {
        save({ ...store.current, codeTheme: isCodeTheme(id) ? id : null });
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

    /** Keep the repository chosen in the status bar, or forget it with null or the empty text. */
    function setStatusRepository(root: string | null): void {
        const next = root === '' ? null : root;
        if (next === store.current.statusRepository) return;
        save({ ...store.current, statusRepository: next });
    }

    /** Stop taking another browser tab's saved records, which `loadUi` given a window started. */
    function stopFollowing(): void {
        unfollow();
        unfollow = () => undefined;
    }

    /** What a view instance wants remembered. */
    function setInstanceState(id: string, state: unknown): void {
        save({ ...store.current, instances: { ...store.current.instances, [id]: state } });
    }

    /**
     * Change one record from the value the storage holds for it now. The storage is read here and
     * not taken from the last `storage` event, so an entry another browser tab saved in between is
     * in what `change` is given. The record is saved even when this tab's copy already reads the
     * same, since the storage's differs. Two tabs that write within the same instant can still
     * overwrite one another, as the storage has no lock.
     */
    function updateInstanceState(id: string, change: (held: unknown) => unknown): void {
        const saved = backing === null ? null : savedHeld(backing);
        const held =
            saved !== null && id in saved.instances ? saved.instances[id] : instanceState(id);
        synced = Object.fromEntries(Object.entries(synced).filter(([key]) => key !== id));
        setInstanceState(id, change(held));
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

    /** The ids of the instance records whose id starts with a prefix. */
    function instanceKeys(prefix: string): string[] {
        return Object.keys(store.current.instances).filter((id) => id.startsWith(prefix));
    }

    /**
     * Forget every instance record whose id starts with a prefix, in one save: the records a view
     * keeps under an owner of its own beside the instance's, as a project card keeps its tree.
     */
    function clearInstanceStates(prefix: string): void {
        const gone = instanceKeys(prefix);
        if (gone.length === 0) return;
        const instances = Object.fromEntries(
            Object.entries(store.current.instances).filter(([id]) => !gone.includes(id))
        );
        save({ ...store.current, instances });
    }

    /** Write one pane strip setting to config/appearance.yml. */
    function setPaneStrip(key: PaneStripKey, value: string): void {
        void writeConfigKey('appearance.yml', key, value);
    }

    return {
        theme,
        crt,
        wallpaper,
        icons,
        textScale,
        terminalFont,
        codeTheme,
        statusHidden,
        statusQuiet,
        statusRepository,
        chosen,
        initial,
        instanceState,
        registerUnsaved,
        unsaved,
        registerGone,
        fileGone,
        registerSaveBeforeClose,
        saveBeforeClose,
        registerTerminalOwner,
        busyTerminals,
        endTerminals,
        requestUpdateTray,
        updateTrayRequested,
        requestPalette,
        paletteRequested,
        requestCardMove,
        cardMoveRequested,
        loadUi,
        stopFollowing,
        setTheme,
        setCrt,
        setWallpaper,
        setIcons,
        setTextScale,
        stepTextScale,
        setTerminalFont,
        setCodeTheme,
        setStatusHidden,
        setStatusQuiet,
        setStatusRepository,
        setPaneStrip,
        setInstanceState,
        updateInstanceState,
        clearInstanceState,
        instanceKeys,
        clearInstanceStates
    };
}
