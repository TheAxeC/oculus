// Layer 2, client state. What the page looks like and what each open view remembers: the theme, the
// CRT overlay, the wallpaper, the glyph mode, the text and terminal sizes, the code theme of the
// editors, the status bar's own values, and one record of state per view instance, keyed by the
// instance id the layout gives it. Two instances of the same view therefore remember different
// things. A view may also keep a record under a fixed id of its own that no instance has, as the
// file view keeps the places of the PDFs it has shown under `pdf-place`
// (state/sources/explorer/pdf-place.ts).
//
// The look is the options' (state/shared/words/appearance.ts, `configuredLook`): the `theme`,
// `text_size`, `rice`, `wallpaper.show`, `crt.on`, `code_theme` and `terminal.font_px` options of
// the appearance defaults and the `status_bar` and `editor.suggest_details` options of the behavior
// defaults, as the open workspace file sets them or oculus's defaults hold them. A control that
// changes one writes the option through the Settings write path, so every page of the server shows
// the new value from the config push that follows the write. Until that push arrives, the value
// written is held over the configured one (`pending`), so the control answers at once; a write
// that does not land drops it, and the writes store says why. With no workspace file open (the
// unsaved workspace) a control writes nothing and the page offers Save Workspace instead
// (`noWorkspace`).
//
// The records are the page state's view states (state/shared/stores/page-state.svelte.ts), which
// the server keeps in `views.json` of the state folder: every page of the server sees a record
// another page set, and a record outlives a reload. A theme or a file icon theme the palette's
// `:theme` and `:file-icons` lists preview is held beside them and never written (`preview`), so
// moving through a list draws each choice and leaving it draws the chosen one again.

import type { BusyTerminal } from '../sessions/terminal/pty/pty-io.ts';
import {
    createCloseHooks,
    type CloseHooks,
    type OwnedInstance,
    type TerminalOwner
} from './layout/tabs/close-hooks.ts';
import { NO_OFFERS, type AppOffers } from '../../data/helpers/files/apps/choices.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import type { PageStateStore } from '../shared/stores/page-state.svelte.ts';
import { configGeneration } from '../shared/words/generation.svelte.ts';
import {
    boundedTextSize,
    codeThemeDefault,
    configuredLook,
    terminalFontPx,
    themeFor,
    wallpaperOnTheme
} from '../shared/words/appearance.ts';

/**
 * One reorder the keyboard asked a view for: which instance was focused, which card its cursor
 * held, which way it goes, and a sequence number so a view performs one request once. The shell
 * knows nothing of what a card is ordered by, so it asks and the view writes.
 */
export type CardMove = { instance: string; card: string; step: -1 | 1; seq: number };

export type { BusyTerminal, OwnedInstance, TerminalOwner };

/**
 * The theme and the file icon theme a palette list draws while its selection rests on one, before
 * Enter keeps it; null for one it does not preview.
 */
export type Preview = { theme: string | null; fileIcons: string | null };

/** No preview: the chosen theme and file icon theme are drawn. */
export const NO_PREVIEW: Preview = { theme: null, fileIcons: null };

/** The two pane strip options that say what a pane's top row draws. */
export type PaneStripKey = 'show_tabs' | 'editor_actions';

/** The writes of the Settings write path the store sends an option through. */
type OptionWrites = {
    writeConfigKey: (file: string, key: string, value: unknown) => Promise<WriteAnswer>;
    writeConfigValue: (
        file: string,
        key: string,
        value: unknown,
        base: unknown
    ) => Promise<WriteAnswer>;
    resetConfig: (file: string, key: string) => Promise<WriteAnswer>;
};

/** What the store reads and writes through, each with a stand-in for a store given none. */
export type UiDeps = {
    /** The view states of the page state, which the records are. */
    state: Pick<PageStateStore, 'views' | 'changeViews'>;
    writes: OptionWrites;
    /** Whether the page is in the desktop app's window, which starts on the app's dark theme. */
    inApp: boolean;
    /** The colour and icon themes the acting apps offer. */
    offers: () => AppOffers;
    /**
     * Whether a workspace file is open to write an option into: false for the unsaved workspace,
     * null while the workspace answer has not come.
     */
    workspaceFile: () => boolean | null;
    /** Say that a setting has no file to go to, and offer to save the workspace to one. */
    noWorkspace: () => void;
};

/** A view state store held in the page alone, for a store given no page state. */
function localViews(): UiDeps['state'] {
    const held: { views: Record<string, unknown> } = $state({ views: {} });
    return {
        views: () => held.views,
        changeViews: (set, remove) => {
            const views = { ...held.views, ...set };
            for (const id of remove) Reflect.deleteProperty(views, id);
            held.views = views;
        }
    };
}

/** The answer a store given no writes takes from each: refused, with nothing written. */
const NOT_WRITTEN: WriteAnswer = { ok: false, changed: [], refused: [] };

/** The writes of a store given none: each answers that nothing was written. */
const NO_WRITES: OptionWrites = {
    writeConfigKey: () => Promise.resolve(NOT_WRITTEN),
    writeConfigValue: () => Promise.resolve(NOT_WRITTEN),
    resetConfig: () => Promise.resolve(NOT_WRITTEN)
};

/** The appearance defaults file and the behavior defaults file, by the names the writes take. */
const APPEARANCE = 'appearance.yml';
const BEHAVIOR = 'behavior.yml';

/**
 * A value written and not yet in the config the page holds: the value, and the configuration's
 * generation when its write was answered, null while it is on its way. It stands until a push of a
 * later generation arrives, which carries it or a later change.
 */
type Pending = { value: unknown; settled: number | null };

/**
 * What the page looks like and what each open view remembers, for one client, and the
 * registrations a close asks about a tab (layout/tabs/close-hooks.ts).
 */
export type UiStore = CloseHooks & {
    /** The theme drawn: the one a palette list previews, else the one the `theme` option names. */
    theme: () => string;
    /** The theme the `theme` option names, whatever a palette list previews. */
    chosenTheme: () => string;
    /** What a palette list previews: a theme and a file icon theme, each null for none. */
    preview: () => Preview;
    /** Draw a theme or a file icon theme without writing it; NO_PREVIEW draws the chosen ones. */
    setPreview: (next: Preview) => void;
    crt: () => boolean;
    wallpaper: () => boolean;
    icons: () => boolean;
    brackets: () => boolean;
    monospace: () => boolean;
    /** The text size, or null at one, the size of the theme's own tokens. */
    textScale: () => number | null;
    /** The terminal grid's size in CSS pixels, or null where it follows the page's text size. */
    terminalFont: () => number | null;
    codeTheme: () => string;
    /** A value that changes with the editors' look: the theme, the text size and the code theme. */
    editorLook: () => string;
    statusHidden: () => string[];
    statusQuiet: () => boolean;
    /** The repository last chosen in the status bar's repository item, by its root, or null. */
    statusRepository: () => string | null;
    /** The suggest list's description panel as just toggled, or null to read the option. */
    suggestDetails: () => boolean | null;
    instanceState: (id: string) => unknown;
    requestUpdateTray: () => void;
    updateTrayRequested: () => number;
    /** Ask the shell to open the palette with this text typed in it. */
    requestPalette: (text: string) => void;
    /** The palette request the workbench observes: its number moves with every request. */
    paletteRequested: () => { seq: number; text: string };
    requestCardMove: (instance: string, card: string, step: -1 | 1) => void;
    cardMoveRequested: (instance: string) => CardMove | null;
    setTheme: (name: string) => void;
    setCrt: (on: boolean) => void;
    setTerminalFont: (size: number | null) => void;
    setStatusHidden: (item: string, hidden: boolean) => void;
    setStatusQuiet: (on: boolean) => void;
    /** Keep the repository chosen in the status bar's repository item; null forgets it. */
    setStatusRepository: (root: string | null) => void;
    /** Write the reader's choice of the suggest list's description panel. */
    setSuggestDetails: (shown: boolean) => void;
    setPaneStrip: (key: PaneStripKey, value: string) => void;
    /** Write the file icon theme to the `file_icons` option, for every page. */
    setFileIcons: (name: string) => Promise<boolean>;
    setInstanceState: (id: string, state: unknown) => void;
    /**
     * Change a record from what the page holds for it at this moment, which another page may have
     * set since: `change` is given the record held, and what it returns is kept.
     */
    updateInstanceState: (id: string, change: (held: unknown) => unknown) => void;
    clearInstanceState: (id: string) => void;
    /** The ids of the instance records whose id starts with a prefix. */
    instanceKeys: (prefix: string) => string[];
    /** Forget every instance record whose id starts with a prefix, in one change. */
    clearInstanceStates: (prefix: string) => void;
};

/** The store of the page's look and of the views' records. */
export function createUi(given: Partial<UiDeps> = {}): UiStore {
    const deps: UiDeps = {
        state: given.state ?? localViews(),
        writes: given.writes ?? NO_WRITES,
        inApp: given.inApp ?? false,
        offers: given.offers ?? (() => NO_OFFERS),
        workspaceFile: given.workspaceFile ?? (() => null),
        noWorkspace: given.noWorkspace ?? (() => undefined)
    };

    /** The values written and not yet in the config the page holds, by option path. */
    const pending: Partial<Record<string, Pending>> = $state({});

    /** A transient signal from a view to the shell that owns the Update tray. */
    const updateTray = $state({ requested: 0 });
    const palette = $state({ seq: 0, text: '' });

    const cardMove = $state<{ held: CardMove | null }>({ held: null });

    /** What a palette list shows while its selection rests on it, which nothing writes. */
    let previewing = $state<Preview>(NO_PREVIEW);

    /** What the stores holding a tab's work registered, which a close asks about the tab. */
    const hooks = createCloseHooks();

    /** An option's value as shown: the one written and not yet pushed, else the config's. */
    function held<T>(key: string, configured: T): T {
        const one = pending[key];
        if (one !== undefined && (one.settled === null || one.settled === configGeneration())) {
            return one.value as T;
        }
        return configured;
    }

    /**
     * Write one option through the Settings write path, and hold the value until the push that
     * carries it. A list is written whole, refused unless the place still holds `base`, the list
     * the page showed. With the unsaved workspace nothing is sent and the offer to save the
     * workspace is made. Answers whether the write landed.
     */
    async function writeOption(
        file: string,
        key: string,
        value: unknown,
        base?: unknown
    ): Promise<boolean> {
        if (deps.workspaceFile() === false) {
            deps.noWorkspace();
            return false;
        }
        pending[key] = { value, settled: null };
        const answer = Array.isArray(value)
            ? await deps.writes.writeConfigValue(file, key, value, base)
            : await deps.writes.writeConfigKey(file, key, value);
        if (answer.ok && answer.refused.length === 0) {
            pending[key] = { value, settled: configGeneration() };
            return true;
        }
        Reflect.deleteProperty(pending, key);
        return false;
    }

    /** Take an option out of the open workspace file, so oculus's value is in force again. */
    function resetOption(file: string, key: string): void {
        if (deps.workspaceFile() === false) {
            deps.noWorkspace();
            return;
        }
        Reflect.deleteProperty(pending, key);
        void deps.writes.resetConfig(file, key);
    }

    /** A theme name the config lists, and the start for one it does not. */
    function known(name: unknown): string {
        return themeFor(name, deps.inApp, deps.offers());
    }

    /** The name of the theme the `theme` option names, as the page draws it. */
    function chosenTheme(): string {
        return known(held('theme', configuredLook().theme));
    }

    function theme(): string {
        return previewing.theme ?? chosenTheme();
    }

    function preview(): Preview {
        return previewing;
    }

    function setPreview(next: Preview): void {
        previewing = {
            theme: next.theme === null ? null : known(next.theme),
            fileIcons: next.fileIcons
        };
    }

    function crt(): boolean {
        return held('crt.on', configuredLook().crt);
    }

    /**
     * Whether the wallpaper shows: `shown` and `hidden` say so, and the empty value is the theme's
     * answer, on wherever a wallpaper shows. Whether one is actually drawn is this and the theme
     * together: the shell asks appearance.wallpaperOnTheme() as well, so switching to a theme the
     * wallpaper does not show under hides it without changing the option.
     */
    function wallpaper(): boolean {
        const show = held('wallpaper.show', configuredLook().wallpaper);
        if (show === 'shown') return true;
        if (show === 'hidden') return false;
        return wallpaperOnTheme(chosenTheme(), deps.offers());
    }

    function icons(): boolean {
        return held('rice.icons', configuredLook().icons);
    }

    function brackets(): boolean {
        return held('rice.brackets', configuredLook().brackets);
    }

    function monospace(): boolean {
        return held('rice.monospace', configuredLook().monospace);
    }

    function textScale(): number | null {
        const size = boundedTextSize(held('text_size', configuredLook().textSize));
        return size === 1 ? null : size;
    }

    function terminalFont(): number | null {
        return held('terminal.font_px', terminalFontPx());
    }

    function codeTheme(): string {
        return held('code_theme', codeThemeDefault());
    }

    function editorLook(): string {
        return `${theme()} ${String(textScale() ?? 1)} ${codeTheme()}`;
    }

    function statusHidden(): string[] {
        return held('status_bar.hidden', configuredLook().statusHidden);
    }

    function statusQuiet(): boolean {
        return held('status_bar.quiet', configuredLook().statusQuiet);
    }

    function statusRepository(): string | null {
        const root = held('status_bar.repository', configuredLook().statusRepository);
        return root === '' ? null : root;
    }

    /**
     * The suggest list's description panel as the reader just toggled it, while the write is on its
     * way, else null: the editors read the `editor.suggest_details` option otherwise.
     */
    function suggestDetails(): boolean | null {
        const one = pending['editor.suggest_details'];
        if (one === undefined || (one.settled !== null && one.settled !== configGeneration())) {
            return null;
        }
        return one.value === true;
    }

    function instanceState(id: string): unknown {
        return deps.state.views()[id];
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
        const one = cardMove.held;
        return one !== null && one.instance === instance ? one : null;
    }

    /** Switch to a theme: one the config does not list is written as the start, the empty name. */
    function setTheme(name: string): void {
        const named = known(name) === name ? name : '';
        void writeOption(APPEARANCE, 'theme', named);
    }

    function setCrt(on: boolean): void {
        void writeOption(APPEARANCE, 'crt.on', on);
    }

    /** A terminal grid size between 6 and 40 CSS pixels; null puts oculus's size back. */
    function setTerminalFont(size: number | null): void {
        if (size === null || !Number.isFinite(size)) {
            resetOption(APPEARANCE, 'terminal.font_px');
            return;
        }
        void writeOption(APPEARANCE, 'terminal.font_px', Math.min(40, Math.max(6, size)));
    }

    /** Hide one status bar item, or show it again. */
    function setStatusHidden(item: string, hidden: boolean): void {
        if (item === '') return;
        const shown = statusHidden();
        const others = shown.filter((one) => one !== item);
        void writeOption(BEHAVIOR, 'status_bar.hidden', hidden ? [...others, item] : others, shown);
    }

    function setStatusQuiet(on: boolean): void {
        void writeOption(BEHAVIOR, 'status_bar.quiet', on);
    }

    /** Keep the repository chosen in the status bar, or forget it with null or the empty text. */
    function setStatusRepository(root: string | null): void {
        const next = root ?? '';
        if (next === (statusRepository() ?? '')) return;
        void writeOption(BEHAVIOR, 'status_bar.repository', next);
    }

    /**
     * Write the reader's choice of the suggest list's description panel; a choice already on its
     * way writes nothing again.
     */
    function setSuggestDetails(shown: boolean): void {
        if (shown === suggestDetails()) return;
        void writeOption(BEHAVIOR, 'editor.suggest_details', shown);
    }

    /** What a view instance wants remembered. */
    function setInstanceState(id: string, state: unknown): void {
        deps.state.changeViews({ [id]: state }, []);
    }

    function updateInstanceState(id: string, change: (held: unknown) => unknown): void {
        setInstanceState(id, change(instanceState(id)));
    }

    /**
     * Forget an instance's state when its tab closes, so a closed editor's draft does not linger.
     */
    function clearInstanceState(id: string): void {
        if (!Object.hasOwn(deps.state.views(), id)) return;
        deps.state.changeViews({}, [id]);
    }

    function instanceKeys(prefix: string): string[] {
        return Object.keys(deps.state.views()).filter((id) => id.startsWith(prefix));
    }

    /**
     * Forget every instance record whose id starts with a prefix, in one change: the records a view
     * keeps under an owner of its own beside the instance's, as a project card keeps its tree.
     */
    function clearInstanceStates(prefix: string): void {
        const gone = instanceKeys(prefix);
        if (gone.length > 0) deps.state.changeViews({}, gone);
    }

    function setPaneStrip(key: PaneStripKey, value: string): void {
        void writeOption(APPEARANCE, key, value);
    }

    async function setFileIcons(name: string): Promise<boolean> {
        return writeOption(APPEARANCE, 'file_icons', name);
    }

    return {
        theme,
        chosenTheme,
        preview,
        setPreview,
        crt,
        wallpaper,
        icons,
        brackets,
        monospace,
        textScale,
        terminalFont,
        codeTheme,
        editorLook,
        statusHidden,
        statusQuiet,
        statusRepository,
        suggestDetails,
        instanceState,
        ...hooks,
        requestUpdateTray,
        updateTrayRequested,
        requestPalette,
        paletteRequested,
        requestCardMove,
        cardMoveRequested,
        setTheme,
        setCrt,
        setTerminalFont,
        setStatusHidden,
        setStatusQuiet,
        setStatusRepository,
        setSuggestDetails,
        setPaneStrip,
        setFileIcons,
        setInstanceState,
        updateInstanceState,
        clearInstanceState,
        instanceKeys,
        clearInstanceStates
    };
}
