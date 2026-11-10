// Layer 2, client state. What the page looks like and what each open view remembers: the theme, the
// CRT overlay, the wallpaper, the glyph mode, the text and terminal sizes, the code theme of the
// editors, the status bar's own values, and one record of state per view instance, keyed by the
// instance id the layout gives it. Two instances of the same view therefore remember different
// things. A view may also keep a record under a fixed id of its own that no instance has, as the
// file view keeps the places of the PDFs it has shown under `pdf-place`
// (state/sources/explorer/pdf-place.ts).
//
// The look is the options' (state/shared/words/appearance.ts, `configuredLook`): the `theme`,
// `text_size`, `rice`, `wallpaper.show`, `crt.on`, `code_theme`, `terminal.font_px` and
// `terminal.transcript_font_px` options of the appearance defaults and the `status_bar` and
// `editor.suggest_details` options of the behavior defaults, as the open workspace file sets them
// or oculus's defaults hold them, with `terminal.transcript_font_px` in the workspace file alone,
// since it has no default. A control that changes one writes the option through the Settings write
// path, so every page of the server shows the new value from the config push that follows the
// write. Until that push arrives, the value written is held over the configured one (`pending`), so
// the control answers at once; a write that does not land drops it, and the writes store says why.
// With no workspace file open (the unsaved workspace) a control writes nothing and the page offers
// Save Workspace instead (`noWorkspace`).
//
// It also writes who the user is, the key `self` of the primary hub's `.oculus/local.yml`, which
// the Person page sets (`setSelf`): through the config key write of that file, in a saved workspace
// and an unsaved one alike, since the file is the primary's and no workspace file holds the key.
//
// The records are the page state's view states (state/shared/stores/page-state.svelte.ts), which
// the server keeps in `views.json` of the state folder: every page of the server sees a record
// another page set, and a record outlives a reload. A theme or a file icon theme the palette's
// `:theme` and `:file-icons` lists preview is held beside them and never written (`preview`), so
// moving through a list draws each choice and leaving it draws the chosen one again. The fields of
// a view whose typed text was refused are held the same way, beside the records and never written
// (`refusedFields`), so a Settings tab does not count refused text as unsaved work.

import { SvelteMap } from 'svelte/reactivity';
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
    boundedTerminalPx,
    boundedTextSize,
    codeThemeDefault,
    configuredLook,
    terminalFontPx,
    themeFor,
    transcriptFontPx,
    wallpaperOnTheme
} from '../shared/words/appearance.ts';

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

/** The appearance and behavior defaults files, by the names the writes take. */
const APPEARANCE = 'appearance.yml';
const BEHAVIOR = 'behavior.yml';
/** The machine's own file, whose key `self` alone a write sets, in the primary hub's copy. */
const LOCAL = 'local.yml';

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
    /** The two rice toggles, each null while no look is installed. */
    brackets: () => boolean | null;
    monospace: () => boolean | null;
    /** The text size, or null at one, the size of the theme's own tokens. */
    textScale: () => number | null;
    /** The terminal grid's size in CSS pixels, or null where it follows the page's text size. */
    terminalFont: () => number | null;
    /** The transcript's size in CSS pixels, or null where it follows `--fs-sm`. */
    transcriptFont: () => number | null;
    /** The code theme the editors paint, or null while no config is installed. */
    codeTheme: () => string | null;
    /** A value that changes with the editors' look: the theme, the text size and the code theme. */
    editorLook: () => string;
    /** The status bar's hidden items and Do Not Disturb, each null while no look is installed. */
    statusHidden: () => string[] | null;
    statusQuiet: () => boolean | null;
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
    setTheme: (name: string) => void;
    setCrt: (on: boolean) => void;
    setTerminalFont: (size: number | null) => void;
    setTranscriptFont: (size: number | null) => void;
    setStatusHidden: (item: string, hidden: boolean) => void;
    setStatusQuiet: (on: boolean) => void;
    /** Keep the repository chosen in the status bar's repository item; null forgets it. */
    setStatusRepository: (root: string | null) => void;
    /** Write the reader's choice of the suggest list's description panel. */
    setSuggestDetails: (shown: boolean) => void;
    /**
     * Write the user's own person key to `self` of the primary hub's `local.yml`, answering whether
     * the write landed; an empty key writes nothing and answers false. A refusal is said by the
     * writes store, as every refused write is.
     */
    setSelf: (key: string) => Promise<boolean>;
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
    /**
     * The fields of an instance whose typed text its writer refused, each by the name the view
     * gives it: state of this page alone, never saved with the instance's record, and forgotten
     * with that record.
     */
    refusedFields: (id: string) => ReadonlySet<string>;
    /** Mark one field of an instance as refused, or take the mark away. */
    markRefused: (id: string, field: string, refused: boolean) => void;
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

    /** What a palette list shows while its selection rests on it, which nothing writes. */
    let previewing = $state<Preview>(NO_PREVIEW);

    /** What the stores holding a tab's work registered, which a close asks about the tab. */
    const hooks = createCloseHooks();

    /** The refused fields of each instance that has one, by instance id; never written. */
    const refused = new SvelteMap<string, ReadonlySet<string>>();

    /** Per option key, the latest write asked for and the end of the writes sent before it. */
    const sends: Partial<Record<string, { turn: number; last: Promise<unknown> }>> = {};

    /** An option's value as shown: the one written and not yet pushed, else the config's. */
    function held<T>(key: string, configured: T): T {
        const one = pending[key];
        if (one !== undefined && (one.settled === null || one.settled === configGeneration())) {
            return one.value as T;
        }
        return configured;
    }

    /**
     * Send one write of `key` after the writes of that key already sent, so a later press can never
     * be overtaken by an earlier one. A write a later one replaced before its turn is not sent, and
     * answers null.
     */
    function inTurn<T>(key: string, send: () => Promise<T>): Promise<T | null> {
        const turn = (sends[key]?.turn ?? 0) + 1;
        const before = sends[key]?.last ?? Promise.resolve();
        const answer = before.then(() => (sends[key]?.turn === turn ? send() : null));
        sends[key] = { turn, last: answer.catch(() => null) };
        return answer;
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
        const answer = await inTurn(key, () =>
            Array.isArray(value)
                ? deps.writes.writeConfigValue(file, key, value, base)
                : deps.writes.writeConfigKey(file, key, value)
        );
        if (answer === null) return true;
        if (answer.ok && answer.refused.length === 0) {
            pending[key] = { value, settled: configGeneration() };
            return true;
        }
        Reflect.deleteProperty(pending, key);
        return false;
    }

    /** Take an option out of the open workspace file, so the file no longer sets it. */
    function resetOption(file: string, key: string): void {
        if (deps.workspaceFile() === false) {
            deps.noWorkspace();
            return;
        }
        Reflect.deleteProperty(pending, key);
        void inTurn(key, () => deps.writes.resetConfig(file, key));
    }

    /** A theme name the config lists, and the start for one it does not. */
    function known(name: unknown): string {
        return themeFor(name, deps.inApp, deps.offers());
    }

    /** The name of the theme the `theme` option names, as the page draws it. */
    function chosenTheme(): string {
        return known(held('theme', configuredLook()?.theme));
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

    /** Whether the CRT overlay is drawn: only while an installed look, or a write, turns it on. */
    function crt(): boolean {
        return held('crt.on', configuredLook()?.crt) === true;
    }

    /**
     * Whether the wallpaper shows: `shown` and `hidden` say so, and the empty value is the theme's
     * answer, on wherever a wallpaper shows. Whether one is actually drawn is this and the theme
     * together: the shell asks appearance.wallpaperOnTheme() as well, so switching to a theme the
     * wallpaper does not show under hides it without changing the option.
     */
    function wallpaper(): boolean {
        const show = held('wallpaper.show', configuredLook()?.wallpaper);
        if (show === 'shown') return true;
        if (show === 'hidden') return false;
        return wallpaperOnTheme(chosenTheme(), deps.offers(), deps.inApp);
    }

    /** Whether the terminal themes keep their icons: only while the option turns them on. */
    function icons(): boolean {
        return held('rice.icons', configuredLook()?.icons) === true;
    }

    function brackets(): boolean | null {
        return held('rice.brackets', configuredLook()?.brackets) ?? null;
    }

    function monospace(): boolean | null {
        return held('rice.monospace', configuredLook()?.monospace) ?? null;
    }

    function textScale(): number | null {
        const configured = held('text_size', configuredLook()?.textSize);
        if (configured === undefined) return null;
        const size = boundedTextSize(configured);
        return size === 1 ? null : size;
    }

    function terminalFont(): number | null {
        return held('terminal.font_px', terminalFontPx());
    }

    function transcriptFont(): number | null {
        return held('terminal.transcript_font_px', transcriptFontPx());
    }

    function codeTheme(): string | null {
        return held('code_theme', codeThemeDefault());
    }

    function editorLook(): string {
        return `${theme()} ${String(textScale() ?? 1)} ${codeTheme() ?? ''}`;
    }

    function statusHidden(): string[] | null {
        return held('status_bar.hidden', configuredLook()?.statusHidden) ?? null;
    }

    function statusQuiet(): boolean | null {
        return held('status_bar.quiet', configuredLook()?.statusQuiet) ?? null;
    }

    function statusRepository(): string | null {
        const root = held('status_bar.repository', configuredLook()?.statusRepository);
        return root === undefined || root === '' ? null : root;
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

    /** Switch to a theme: one the config does not list is written as the start, the empty name. */
    function setTheme(name: string): void {
        const named = known(name) === name ? name : '';
        void writeOption(APPEARANCE, 'theme', named);
    }

    function setCrt(on: boolean): void {
        void writeOption(APPEARANCE, 'crt.on', on);
    }

    /**
     * Write a terminal text size, between 6 and 40 CSS pixels and to a hundredth of a pixel, since
     * a press adds to a token times the text scale, and 12 times 1.2 is 14.399999999999999 to a
     * double. Null takes the key out.
     */
    function writeTerminalSize(key: string, size: number | null): void {
        if (size === null || !Number.isFinite(size)) {
            resetOption(APPEARANCE, key);
            return;
        }
        void writeOption(APPEARANCE, key, Math.round(boundedTerminalPx(size) * 100) / 100);
    }

    /** A terminal grid size; null puts oculus's size back. */
    function setTerminalFont(size: number | null): void {
        writeTerminalSize('terminal.font_px', size);
    }

    /** A transcript size; null leaves it to follow the `--fs-sm` token. */
    function setTranscriptFont(size: number | null): void {
        writeTerminalSize('terminal.transcript_font_px', size);
    }

    /** Hide one status bar item, or show it again. */
    function setStatusHidden(item: string, hidden: boolean): void {
        if (item === '') return;
        const shown = statusHidden();
        if (shown === null) return;
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

    /**
     * Write who the user is, the key of their own person, to `self` of the primary hub's
     * `local.yml`. The file is the machine's and no layer of the workspace, so the write is sent in
     * an unsaved workspace too, with no offer to save it; the server refuses it with no primary.
     * Clearing it is the Settings row's, so an empty key writes nothing.
     */
    async function setSelf(key: string): Promise<boolean> {
        if (key === '') return false;
        const answer = await deps.writes.writeConfigKey(LOCAL, 'self', key);
        return answer.ok && answer.refused.length === 0;
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
        refused.delete(id);
        if (!Object.hasOwn(deps.state.views(), id)) return;
        deps.state.changeViews({}, [id]);
    }

    function refusedFields(id: string): ReadonlySet<string> {
        return refused.get(id) ?? new Set<string>();
    }

    function markRefused(id: string, field: string, on: boolean): void {
        const held = refusedFields(id);
        if (held.has(field) === on) return;
        const next = new Set(held);
        if (on) next.add(field);
        else next.delete(field);
        if (next.size === 0) refused.delete(id);
        else refused.set(id, next);
    }

    function instanceKeys(prefix: string): string[] {
        return Object.keys(deps.state.views()).filter((id) => id.startsWith(prefix));
    }

    /**
     * Forget every instance record whose id starts with a prefix, in one change: the records a view
     * keeps under an owner of its own beside the instance's, as a project card keeps its tree.
     */
    function clearInstanceStates(prefix: string): void {
        for (const id of [...refused.keys()]) if (id.startsWith(prefix)) refused.delete(id);
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
        transcriptFont,
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
        setTheme,
        setCrt,
        setTerminalFont,
        setTranscriptFont,
        setStatusHidden,
        setStatusQuiet,
        setStatusRepository,
        setSuggestDetails,
        setSelf,
        setPaneStrip,
        setFileIcons,
        setInstanceState,
        updateInstanceState,
        clearInstanceState,
        instanceKeys,
        clearInstanceStates,
        refusedFields,
        markRefused
    };
}
