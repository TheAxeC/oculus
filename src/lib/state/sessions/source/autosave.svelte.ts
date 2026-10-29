// Layer 2, client state. Saving a source tab without a press of Save, by `editor.autosave`: `off`
// saves only when asked, `after_delay` saves a tab `editor.autosave_delay_ms` after its last edit,
// and `on_focus_change` saves it when its editor loses focus and every such tab when the page loses
// focus. A change of the key into either mode saves every such tab at once. The timers run on the
// pair of functions the store is handed, so a test says exactly when one fires.
//
// A tab is saved this way only while it holds unsaved text of a file on disk that it read whole and
// may write, and the disk has not moved under it: a tab marked changed, and one whose last save was
// refused because the file changed, wait for the reader to save, overwrite or revert. An automatic
// save is the Save of the tab with its base, so it never writes over a change on disk, and it tells
// the page what a save tells it. A save the server refuses puts its sentence on the tab's line and
// is not tried again until the next edit. An `after_delay` save never formats the document; an
// `on_focus_change` save formats it when the language's record says so and the tab's editor is
// mounted.
//
// Closing a tab with unsaved text saves it first when the mode would have saved it already (every
// `on_focus_change` close, and an `after_delay` close when the delay is one second or less); the
// tabs it could not save are the ones the close still asks about. An app's `workspace.saveAll` asks
// for every tab with unsaved text to be saved whatever the mode (`saveEvery`), and nothing else, so
// an app never writes a view's held changes. The File menu's Save All saves the same tabs and then
// runs the saves a view joined it with (`saveJoined`, `joinSaveEvery`: a Settings view's changes
// in every scope). Each tab is saved as a press of Save on it does, formatting where the
// language's record says so and the tab's editor is mounted. The Save of a close question saves
// one tab the same way (`saveAsked`).
//
// A note (a Markdown file of a hub's notes folder, `note` says which tab holds one and how long it
// waits) saves itself `notes.autosave_ms` after its last edit whatever the mode, through the same
// save with the same rules, and a close of its tab always saves it first. A note removed while its
// save waits has the save dropped (`drop`), so nothing is written where it was.

import type { Autosave } from '../../../data/helpers/editor/editor.ts';
import { diskFileOf, type SourceDraft } from './draft.ts';
import type { SaveRules, SourceStore } from './source.svelte.ts';
import { t } from '../../shared/words/text.ts';

/** The longest delay at which closing a tab saves it without the question. */
const CLOSE_SAVES_WITHIN = 1000;

/** A pair of functions that run a call later and cancel it. */
type Timers = {
    setTimeout: (run: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
};

/** The mode and delay the configuration holds, or null before it has arrived. */
type AutosaveOptions = { autosave: Autosave; autosaveDelay: number } | null;

export type AutosaveDeps = {
    source: Pick<
        SourceStore,
        'sourceDraft' | 'saveSourceDraft' | 'openDrafts' | 'formatOf' | 'onEdit'
    >;
    options: () => AutosaveOptions;
    rules: (id: string, draft: SourceDraft, root: string, path: string) => SaveRules;
    timers: Timers;
    /** The wait of a tab's file, `root/path`, when it is a note, else null. */
    note?: (file: string) => number | null;
};

export type AutosaveStore = {
    /** A tab's editor lost focus. */
    blurred: (id: string) => void;
    /** The page lost focus. */
    pageBlurred: () => void;
    /**
     * Save every tab with unsaved text and nothing else, for an app's `workspace.saveAll`; whether
     * every one was written.
     */
    saveEvery: () => Promise<boolean>;
    /**
     * The File menu's Save All: every tab with unsaved text, then every save that joined it;
     * whether every one was written.
     */
    saveJoined: () => Promise<boolean>;
    /**
     * Join the File menu's Save All with a save of a view's own (a Settings view's changes in every
     * scope), which answers whether it wrote everything; the answer takes it out again.
     */
    joinSaveEvery: (save: () => Promise<boolean>) => () => void;
    /**
     * Save one tab as a press of Save does, for the Save of a close question; whether it was
     * written. A tab that cannot be written (untitled, read-only, changed on disk) is not.
     */
    saveAsked: (id: string) => Promise<boolean>;
    /**
     * Save the tabs among these that the mode saves on a close, and every note among them; the
     * others are left alone.
     */
    saveBeforeClose: (ids: string[]) => Promise<void>;
    /** Drop a tab's waiting save, for a tab whose file was removed. */
    drop: (id: string) => void;
    /** Follow the page's focus: the window's blur and the document turning hidden. */
    followPage: (page: {
        addEventListener: (type: string, listener: () => void) => void;
        document: {
            addEventListener: (type: string, listener: () => void) => void;
            hidden: boolean;
        };
    }) => void;
};

export function createAutosave(deps: AutosaveDeps): AutosaveStore {
    const { source, timers } = deps;
    const waiting = new Map<string, unknown>();
    /** The tabs whose automatic save was refused, until the reader types again. */
    const blocked = new Set<string>();
    let mode: Autosave | null = null;

    function current(): AutosaveOptions {
        return deps.options();
    }

    /**
     * Whether a save may write this tab now: it holds unsaved text of a file it read whole and may
     * write, and the disk has not moved. An automatic save also waits while the tab is blocked.
     */
    function eligible(id: string, asked = false): boolean {
        const draft = source.sourceDraft(id);
        return (
            draft.loaded &&
            draft.text !== draft.saved &&
            !draft.readonly &&
            !draft.truncated &&
            !draft.notText &&
            draft.disk === 'same' &&
            !draft.conflict &&
            (asked || !blocked.has(id)) &&
            diskFileOf(draft.file) !== null
        );
    }

    /**
     * Save one tab, as an automatic save unless `asked`. A refusal of an automatic save blocks the
     * tab until its next edit. Whether the text was written.
     */
    async function save(id: string, asked = false): Promise<boolean> {
        const draft = source.sourceDraft(id);
        const place = diskFileOf(draft.file);
        if (place === null) return false;
        const rules = deps.rules(id, draft, place.root, place.path);
        const format = (asked || current()?.autosave === 'on_focus_change') && rules.formatOnSave;
        const formatter = format ? source.formatOf(id) : undefined;
        const written = await source.saveSourceDraft(id, place.root, place.path, {
            automatic: !asked,
            format: formatter,
            ...(format && formatter === undefined
                ? { unformatted: t('source.format_unmounted') }
                : {})
        });
        if (!written && !asked) blocked.add(id);
        return written;
    }

    /** The saves that joined Save All: a Settings view's save of every scope. */
    const joined = new Set<() => Promise<boolean>>();

    /**
     * Save every tab that holds unsaved text, as a press of Save on each does, and nothing else; an
     * app's `workspace.saveAll` runs this, so it never reaches a save a view joined. Whether every
     * such tab was written. A tab that cannot be written (read-only, changed on disk) counts as
     * not.
     */
    async function saveEvery(): Promise<boolean> {
        const dirty = source.openDrafts().filter((id) => {
            const draft = source.sourceDraft(id);
            return draft.loaded && draft.text !== draft.saved;
        });
        const writable = dirty.filter((id) => eligible(id, true));
        const written = await Promise.all(writable.map((id) => save(id, true)));
        return writable.length === dirty.length && written.every(Boolean);
    }

    /**
     * The File menu's Save All: every tab as `saveEvery` saves it, then every save a view joined
     * (`joined`); whether every one wrote everything.
     */
    async function saveJoined(): Promise<boolean> {
        const tabs = await saveEvery();
        const others = await Promise.all([...joined].map((one) => one()));
        return tabs && others.every(Boolean);
    }

    function cancel(id: string): void {
        const handle = waiting.get(id);
        if (handle === undefined) return;
        timers.clearTimeout(handle);
        waiting.delete(id);
    }

    /** The wait of a tab that holds a note, or null for one that does not. */
    function noteWait(id: string): number | null {
        return deps.note?.(source.sourceDraft(id).file) ?? null;
    }

    // Each edit starts the wait again, and an edit lifts a refusal.
    source.onEdit((id) => {
        blocked.delete(id);
        cancel(id);
        const options = current();
        const note = noteWait(id);
        if (note === null && options?.autosave !== 'after_delay') return;
        const wait = note ?? options?.autosaveDelay ?? 0;
        waiting.set(
            id,
            timers.setTimeout(() => {
                waiting.delete(id);
                const saves = noteWait(id) !== null || current()?.autosave === 'after_delay';
                if (saves && eligible(id)) void save(id);
            }, wait)
        );
    });

    /** Save every tab the mode covers that holds unsaved text. */
    function saveAll(): void {
        for (const id of source.openDrafts()) {
            if (eligible(id)) void save(id);
        }
    }

    // A change of the key into a mode that saves, from any other value, saves what is waiting.
    $effect.root(() => {
        $effect(() => {
            const next = current()?.autosave ?? null;
            const before = mode;
            mode = next;
            if (before !== null && next !== null && next !== before && next !== 'off') saveAll();
        });
    });

    function blurred(id: string): void {
        if (current()?.autosave === 'on_focus_change' && eligible(id)) void save(id);
    }

    function pageBlurred(): void {
        if (current()?.autosave === 'on_focus_change') saveAll();
    }

    async function saveBeforeClose(ids: string[]): Promise<void> {
        const options = current();
        const covers =
            options?.autosave === 'on_focus_change' ||
            (options?.autosave === 'after_delay' && options.autosaveDelay <= CLOSE_SAVES_WITHIN);
        const saved = ids.filter((id) => (covers || noteWait(id) !== null) && eligible(id));
        await Promise.all(saved.map((id) => save(id)));
    }

    function followPage(page: Parameters<AutosaveStore['followPage']>[0]): void {
        page.addEventListener('blur', pageBlurred);
        page.document.addEventListener('visibilitychange', () => {
            if (page.document.hidden) pageBlurred();
        });
    }

    return {
        blurred,
        pageBlurred,
        saveBeforeClose,
        saveEvery,
        saveJoined,
        joinSaveEvery: (save) => {
            joined.add(save);
            return () => {
                joined.delete(save);
            };
        },
        saveAsked: (id) => (eligible(id, true) ? save(id, true) : Promise.resolve(false)),
        followPage,
        drop: cancel
    };
}
