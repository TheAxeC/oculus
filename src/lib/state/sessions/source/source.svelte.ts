// Layer 2, client state. The source tab's drafts: the initial whole-text read, the read again of a
// tab with no unsaved text after its file was written, the read again of a HEAD or index tab after
// the version git holds moved, Revert File, and the whole-text save through the shared
// authenticated write sender.
//
// A save sends the hash of the bytes the tab last read or wrote (`base`), and the server refuses it
// when the file holds other bytes; the tab then offers Compare, Overwrite and Revert. A tab's saves
// run one at a time, each sending the hash the one before answered. A save first applies the
// language's rules to the text, in VS Code's order: trailing whitespace trimmed, the document
// formatted by the tab's editor when it is mounted, a final newline ended; each is applied to the
// tab as the smallest edits, so the editor keeps its caret and its scroll and one undo restores the
// text. What the disk says of the file meanwhile is disk.svelte.ts's.

import { tick, untrack } from 'svelte';
import { endText, trimText, type KeptPlace } from '../../../data/helpers/files/save-text.ts';
import { sameDiskFile, type RootFolder } from '../../../data/helpers/hub-names.ts';
import { editsBetween, type TextEdit } from '../../../data/prose/text-edits.ts';
import type { WordWrap } from '../../../data/helpers/editor/editor.ts';
import type {
    SocketStore,
    WriteAnswer,
    WritesStore,
    InstanceStates
} from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import {
    LIBRARY_FILE,
    LIFETIME,
    diskFileOf,
    draftOf,
    loadHeadFile,
    loadSource,
    loadSourceReadonly,
    type HeadStage,
    type Indent,
    type LibraryAnswer,
    type SourceDraft,
    type SourceLoad
} from './draft.ts';
import { createDisk } from './disk.svelte.ts';

/** What a save does to the text of a tab before it is sent. */
export type SaveRules = { trim: boolean; finalNewline: boolean; formatOnSave: boolean };

/** What the store asks of the client that makes it. */
export type SourceDeps = {
    /** The page's socket, for the channel of each file an open tab holds. */
    socket: Pick<SocketStore, 'subscribe' | 'unsubscribe' | 'listen'>;
    /** The rules of the tab's language for a save, resolved from the configuration. */
    rules: (id: string, draft: SourceDraft, root: string, path: string) => SaveRules;
    /** The places the carets of a tab are at, which an automatic save leaves alone. */
    kept: (id: string) => KeptPlace[];
    /** The roots the file browser serves, which decide whether two names are one file on disk. */
    roots: () => readonly RootFolder[];
    /**
     * The keys of the roots the page serves, and null while the page has not read them: an empty
     * list read that way says nothing about what is served.
     */
    served: () => readonly string[] | null;
    /** Whether the page's read of its served roots failed; they stay unknown until a later read. */
    rootsFailed: () => boolean;
};

/** How one save of a tab is made. */
type SaveOptions = {
    /**
     * What runs between the trim and the final newline: the tab's editor formatting its document.
     * A save without it does not format.
     */
    format?: () => Promise<void>;
    /**
     * Why a save that was to be formatted was not: the tab has no editor to format its document.
     * A save that lands then draws the `source.format_failed` line in place of the saved line.
     */
    unformatted?: string;
    /** Whether the save was not asked for, which leaves the whitespace at a caret alone. */
    automatic?: boolean;
    /** Write the text over whatever the file holds now, with no base (the conflict's Overwrite). */
    overwrite?: boolean;
};

/** The source tab's drafts and saves, for one client. */
export type SourceStore = {
    sourceDraft: (id: string) => SourceDraft;
    sourceDirty: (id: string) => boolean;
    /** The instance ids of the drafts that hold a file on disk, read in this page's lifetime. */
    openDrafts: () => string[];
    /**
     * Whether any source tab of this page, on any workbench page, holds unsaved text of the file on
     * disk at that root and path.
     */
    unsavedFile: (root: string, path: string) => boolean;
    loadSourceDraft: (id: string, root: string, path: string, head?: HeadStage) => Promise<void>;
    /**
     * Read the text of a tab over a library file with the read the caller makes of the language
     * server's channel; the draft is read-only.
     */
    loadLibraryDraft: (
        id: string,
        address: string,
        read: () => Promise<LibraryAnswer>
    ) => Promise<void>;
    /**
     * Give a tab that shows no file yet an empty text to type into: an untitled text file, which
     * the first Save writes to a file of its own. A tab that already holds a text keeps it.
     */
    loadUntitledDraft: (id: string) => void;
    /** Read a tab's file again when the tab holds no unsaved text; a tab with some keeps it. */
    reloadSource: (id: string) => Promise<void>;
    /**
     * Read the version a HEAD or index tab holds from git again, for a repository whose HEAD or
     * index has moved, or when the reader asks to read it again. The repository's folder, the path
     * and the stage are the tab's own, never parsed back out of the draft's file key, since a
     * repository's folder is an absolute path. The tab's text is never edited, so the new version
     * replaces the old, and a version the stage no longer has says so in the tab's error line. A
     * tab whose first read failed is read as on opening.
     */
    reloadHead: (id: string, root: string, path: string, stage: HeadStage) => Promise<void>;
    /**
     * Replace a tab's text. `edits` are the text edits the new text was made by, from the text the
     * tab held: the editor makes them in its model as they are, which keeps its selections, its
     * decorations and its folds.
     */
    editSourceDraft: (id: string, text: string, edits?: TextEdit[]) => void;
    /** Hear every replacement of a tab's text, the reader's typing included. */
    onEdit: (listener: (id: string) => void) => () => void;
    /** The edits the tab's text was last replaced by and the text they were made in, or null. */
    sourceReach: (id: string) => { from: string; edits: TextEdit[] } | null;
    /**
     * Revert File: the tab takes the file as the disk holds it now, with its text, `saved` and
     * base, and drops its edits. For a file deleted on disk it takes `saved` and stays gone. A
     * read that fails keeps the tab as it is and says why on its line.
     */
    revertSourceDraft: (id: string) => Promise<void>;
    /**
     * Save the tab's text to its file. True when the file now holds it. The answer is the tab's
     * line: the file changed (the conflict), a refusal, or the saved words.
     */
    saveSourceDraft: (
        id: string,
        root: string,
        path: string,
        options?: SaveOptions
    ) => Promise<boolean>;
    /** Register how a mounted tab formats its document; the call it returns takes it off. */
    registerFormat: (id: string, format: () => Promise<void>) => () => void;
    /** The format a mounted tab registered, or undefined for a tab with no editor. */
    formatOf: (id: string) => (() => Promise<void>) | undefined;
    /** Whether an open tab over this file holds it as deleted on disk. */
    fileGone: (root: string, path: string) => boolean;
    /** The newest hash the file's channel carried; see `DiskStore.hash`. */
    diskHash: (root: string, path: string) => string | null | undefined;
    toggleSourceRendered: (id: string) => void;
    toggleSourceBlame: (id: string) => void;
    setSourceLanguage: (id: string, language: string) => void;
    setSourceIndent: (id: string, indent: Indent | null) => void;
    setSourceWrap: (id: string, wrap: WordWrap | null) => void;
    /** Keep the first line the tab's editor shows, so a copy of the tab opens at it. */
    setSourceFirst: (id: string, line: number) => void;
    /**
     * The number that stamps one open of a place in a file (`asked` of a tab's state): it starts at
     * the time the page loaded and grows by one with each open, so no two opens of one page share
     * it and a page loaded later starts above every one an earlier page gave.
     */
    nextAsked: () => number;
    saveSource: (root: string, path: string, content: string) => Promise<WriteAnswer>;
};

/** The words of a file's name, for a line that names the file. */
function nameOf(path: string): string {
    return path.split('/').filter(Boolean).at(-1) ?? path;
}

/**
 * The source tab's drafts and saves. `saved` is told of each file a save wrote, by its root and
 * path, so what follows a save (a LaTeX build) is decided where that belongs and runs for a save
 * from any tab or list.
 */
export function createSource(
    writes: WritesStore,
    ui: InstanceStates,
    saved: (root: string, path: string) => void = () => undefined,
    deps: SourceDeps
): SourceStore {
    const reading = new Map<string, { file: string; request: Promise<void> }>();
    /** The edits each tab's text was last replaced by, with the text they were made in. */
    const reached = new Map<string, { from: string; edits: TextEdit[] }>();
    /** The end of each tab's queue of saves. */
    const queued = new Map<string, Promise<boolean>>();
    const formats = new Map<string, () => Promise<void>>();
    const editListeners = new Set<(id: string) => void>();
    let asked = Date.now();

    /** Working and saved copies belong to the instance, not its currently mounted component. */
    function sourceDraft(id: string): SourceDraft {
        // State that is no map holds no draft, so every field is at its default.
        return draftOf(ui.instanceState(id));
    }

    /**
     * Whether the tab holds text the file on disk does not have, which is what closing it asks a
     * confirmation about. A draft that has not been read yet holds no text of the reader's, and an
     * instance of any other view has no draft at all, so both answer no.
     */
    function sourceDirty(id: string): boolean {
        const draft = sourceDraft(id);
        return draft.loaded && draft.text !== draft.saved;
    }

    function updateDraft(id: string, changes: Partial<SourceDraft>): void {
        // A message is a failure only where it says so, so a later word never keeps the cross.
        const failed = changes.message === undefined ? {} : { failed: changes.failed === true };
        ui.setInstanceState(id, { ...sourceDraft(id), ...changes, ...failed });
    }

    /** Tabs whose read found no file while the served roots were unknown, by tab. */
    const unsettled = new Map<string, { file: string; error: string }>();

    /** Whether the page has read its served roots and the root key is not among them. */
    function unserved(root: string): boolean {
        return deps.served()?.includes(root) === false;
    }

    /** What a file that cannot be read is, by whether its folder is served. */
    function missing(root: string): 'gone' | 'unserved' {
        return unserved(root) ? 'unserved' : 'gone';
    }

    const disk = createDisk(deps.socket, {
        draft: sourceDraft,
        update: updateDraft,
        reread: (id) => reloadSource(id),
        fileOf: (id) => {
            const state = ui.instanceState(id);
            return state === undefined ? null : sourceDraft(id).file;
        },
        unserved
    });

    // A tab over a file in a root that is not served is marked unserved, and when its root is
    // served again the tab reads the file again, a tab with unsaved text included. A read of a
    // restored tab that found no file while the served roots were being read waits here: the tab
    // is unserved when its root is not among them, and cannot be opened when it is. When the read
    // of the served roots failed, such a tab cannot be opened at once.
    $effect.root(() => {
        $effect(() => {
            const keys = deps.served();
            if (keys === null) return;
            for (const [id, waiting] of [...unsettled]) {
                unsettled.delete(id);
                untrack(() => {
                    const place = diskFileOf(waiting.file);
                    if (sourceDraft(id).file !== waiting.file || place === null) return;
                    if (keys.includes(place.root)) updateDraft(id, { error: waiting.error });
                });
            }
            for (const id of ui.instanceKeys('')) {
                untrack(() => {
                    const draft = sourceDraft(id);
                    const place = diskFileOf(draft.file);
                    if (!draft.loaded || place === null) return;
                    const out = !keys.includes(place.root);
                    if (out && draft.disk !== 'unserved') {
                        updateDraft(id, { disk: 'unserved', conflict: false, error: '' });
                    } else if (!out && draft.disk === 'unserved') {
                        void reloadSource(id);
                    }
                });
            }
        });
    });

    function openDrafts(): string[] {
        return ui.instanceKeys('').filter((id) => {
            const draft = sourceDraft(id);
            return draft.loaded && diskFileOf(draft.file) !== null;
        });
    }

    function unsavedFile(root: string, path: string): boolean {
        const roots = deps.roots();
        return openDrafts().some((id) => {
            const place = diskFileOf(sourceDraft(id).file);
            return place !== null && sameDiskFile({ root, path }, place, roots) && sourceDirty(id);
        });
    }

    /** What a read that landed makes of the draft it was for. */
    function taken(
        answer: Extract<SourceLoad, { ok: true }>,
        readonly: boolean
    ): Partial<SourceDraft> {
        return {
            text: answer.content,
            saved: answer.content,
            base: answer.base,
            disk: 'same',
            conflict: false,
            loaded: true,
            readIn: LIFETIME,
            error: '',
            readonly,
            truncated: answer.truncated,
            notText: answer.notText
        };
    }

    /**
     * What a read that landed makes of a draft that holds text the reader typed: the text, `saved`
     * and `base` are kept, and the tab is marked changed when the file is not the one the text was
     * typed against. A draft stored with no base cannot say, so it is marked changed.
     */
    function keptEdits(
        held: SourceDraft,
        answer: Extract<SourceLoad, { ok: true }>,
        readonly: boolean
    ): Partial<SourceDraft> {
        const same = held.base !== '' && held.base === answer.base;
        return {
            disk: same ? 'same' : 'changed',
            conflict: false,
            loaded: true,
            readIn: LIFETIME,
            error: '',
            readonly,
            truncated: answer.truncated,
            notText: answer.notText
        };
    }

    function loadSourceDraft(
        id: string,
        root: string,
        path: string,
        head?: HeadStage
    ): Promise<void> {
        const file = head === undefined ? `${root}/${path}` : `${head}:${root}/${path}`;
        return readOnce(id, file, async () => {
            // A version at HEAD or in the index is read from the git route and is never written.
            const [answer, readonly]: [SourceLoad, boolean] =
                head === undefined
                    ? await Promise.all([loadSource(root, path), loadSourceReadonly(root, path)])
                    : [await loadHeadFile(root, path, head), true];
            if (sourceDraft(id).file !== file) return;
            if (!answer.ok) {
                // A draft restored with the page whose root is not served keeps its text and says
                // the folder is not served, rather than that the file cannot be opened.
                if (answer.status === 404 && sourceDraft(id).loaded) {
                    if (deps.served() === null && !deps.rootsFailed()) {
                        unsettled.set(id, { file, error: t('source.cannot_open', answer.error) });
                        return;
                    }
                    if (unserved(root)) {
                        updateDraft(id, { disk: 'unserved', conflict: false });
                        return;
                    }
                }
                updateDraft(id, { error: t('source.cannot_open', answer.error) });
                return;
            }
            unsettled.delete(id);
            const held = sourceDraft(id);
            const edited = held.loaded && held.text !== held.saved && held.text !== answer.content;
            updateDraft(id, edited ? keptEdits(held, answer, readonly) : taken(answer, readonly));
            if (head === undefined) disk.track(id, root, path);
        });
    }

    /**
     * Read the text of a library file for a tab, through the read the caller made of the language
     * server's channel. The text is never written: the draft is read-only, and it takes the
     * language of the server that named the file unless the reader chose one.
     */
    function loadLibraryDraft(
        id: string,
        address: string,
        read: () => Promise<LibraryAnswer>
    ): Promise<void> {
        const file = `${LIBRARY_FILE}${address}`;
        return readOnce(id, file, async () => {
            const answer = await read();
            if (sourceDraft(id).file !== file) return;
            if (!answer.ok) {
                updateDraft(id, { error: answer.error });
                return;
            }
            const { language } = sourceDraft(id);
            updateDraft(id, {
                text: answer.text,
                saved: answer.text,
                base: '',
                disk: 'same',
                conflict: false,
                loaded: true,
                readIn: LIFETIME,
                error: '',
                readonly: true,
                truncated: false,
                notText: false,
                language: language === '' ? answer.language : language
            });
        });
    }

    /**
     * Read once per instance per page lifetime, sharing an unfinished read across tab switches. A
     * draft restored from the browser's storage after a reload is read again: an unsaved edit is
     * kept as the working text over the disk's copy, a draft with no edit takes the disk's text.
     *
     * The read belongs to the file it was started for. A preview tab pointed at a second file while
     * the first file's read is still in flight has its draft cleared and asks for the second file:
     * that ask starts its own read rather than waiting on the first, and the first, when it lands,
     * finds the draft is another file's and writes nothing.
     */
    async function readOnce(id: string, file: string, read: () => Promise<void>): Promise<void> {
        const held = sourceDraft(id);
        if (held.readIn === LIFETIME && held.file === file) return;
        const pending = reading.get(id);
        if (pending?.file === file) return pending.request;
        // A tab pointed at another file drops the language, the indentation, the word wrap and
        // the scroll chosen for the last, since the choice was about that file's text.
        updateDraft(
            id,
            held.file === file
                ? { file }
                : { file, language: '', indent: null, wrap: null, first: 1 }
        );
        const request = read();
        const entry = { file, request };
        reading.set(id, entry);
        try {
            await request;
        } finally {
            if (reading.get(id) === entry) reading.delete(id);
        }
    }

    function loadUntitledDraft(id: string): void {
        const file = `untitled:${id}`;
        if (sourceDraft(id).loaded && sourceDraft(id).file === file) return;
        updateDraft(id, {
            file,
            text: '',
            saved: '',
            base: '',
            disk: 'same',
            conflict: false,
            loaded: true,
            readIn: LIFETIME,
            error: '',
            readonly: false,
            truncated: false,
            notText: false
        });
    }

    /**
     * Name the edits a text is replaced by before the text is set, so the editor makes them in its
     * model, which keeps its caret and its scroll and undoes them in one step.
     */
    function reachTo(id: string, from: string, to: string): void {
        if (from !== to) reached.set(id, { from, edits: editsBetween(from, to) });
    }

    /**
     * Show the file as the disk holds it now, for a tab that holds nothing the reader typed. The
     * answer belongs to the file the draft is of. Text typed while the read was out is kept, and
     * the tab is marked changed, since it was typed against the text before this read. A tab over
     * a library file is not read again: the relay's address for it lives with the page's
     * connection.
     */
    async function reloadSource(id: string): Promise<void> {
        const draft = sourceDraft(id);
        const place = diskFileOf(draft.file);
        if (!draft.loaded || place === null) return;
        if (draft.text !== draft.saved && draft.disk !== 'unserved') return;
        const answer = await loadSource(place.root, place.path);
        if (ui.instanceState(id) === undefined) return;
        const held = sourceDraft(id);
        if (held.file !== draft.file) return;
        if (!answer.ok) {
            if (answer.status === 404) {
                updateDraft(id, { disk: missing(place.root), conflict: false });
            }
            return;
        }
        if (held.text !== held.saved) {
            if (answer.base !== held.base) updateDraft(id, { disk: 'changed' });
            else if (held.disk === 'unserved') updateDraft(id, { disk: 'same' });
            return;
        }
        reachTo(id, held.text, answer.content);
        updateDraft(id, {
            text: answer.content,
            saved: answer.content,
            base: answer.base,
            disk: 'same',
            conflict: false,
            truncated: answer.truncated,
            notText: answer.notText
        });
    }

    async function reloadHead(
        id: string,
        root: string,
        path: string,
        stage: HeadStage
    ): Promise<void> {
        const file = `${stage}:${root}/${path}`;
        const draft = sourceDraft(id);
        if (!draft.loaded || draft.file !== file) return loadSourceDraft(id, root, path, stage);
        const answer = await loadHeadFile(root, path, stage);
        if (ui.instanceState(id) === undefined || sourceDraft(id).file !== file) return;
        if (answer.ok) {
            updateDraft(id, { text: answer.content, saved: answer.content, error: '' });
        } else {
            updateDraft(id, { error: t('source.cannot_open', answer.error) });
        }
    }

    /** Keep typing local to this instance until the user saves. */
    function editSourceDraft(id: string, text: string, edits?: TextEdit[]): void {
        // Set before the text, which the editor reads the edits at when the text reaches it.
        if (edits === undefined) reached.delete(id);
        else reached.set(id, { from: sourceDraft(id).text, edits });
        updateDraft(id, { text, message: '' });
        for (const listener of [...editListeners]) listener(id);
    }

    function onEdit(listener: (id: string) => void): () => void {
        editListeners.add(listener);
        return () => editListeners.delete(listener);
    }

    function sourceReach(id: string): { from: string; edits: TextEdit[] } | null {
        return reached.get(id) ?? null;
    }

    async function revertSourceDraft(id: string): Promise<void> {
        const draft = sourceDraft(id);
        const place = diskFileOf(draft.file);
        if (place === null) {
            reachTo(id, draft.text, draft.saved);
            updateDraft(id, { text: draft.saved, message: '' });
            return;
        }
        const answer = await loadSource(place.root, place.path);
        if (ui.instanceState(id) === undefined || sourceDraft(id).file !== draft.file) return;
        const held = sourceDraft(id);
        if (answer.ok) {
            reachTo(id, held.text, answer.content);
            updateDraft(id, {
                text: answer.content,
                saved: answer.content,
                base: answer.base,
                disk: 'same',
                conflict: false,
                truncated: answer.truncated,
                notText: answer.notText,
                message: ''
            });
        } else if (answer.status === 404) {
            reachTo(id, held.text, held.saved);
            updateDraft(id, {
                text: held.saved,
                disk: missing(place.root),
                conflict: false,
                message: ''
            });
        } else {
            updateDraft(id, { message: t('source.cannot_open', answer.error), failed: true });
        }
    }

    /** Show or hide the rendered half. It belongs to the instance, as the working copy does. */
    function toggleSourceRendered(id: string): void {
        updateDraft(id, { rendered: !sourceDraft(id).rendered });
    }

    /** Show or hide the blame in the gutter, the instance's own as the rendered half is. */
    function toggleSourceBlame(id: string): void {
        updateDraft(id, { blame: !sourceDraft(id).blame });
    }

    /**
     * The language the tab paints in, chosen from the status bar and kept with the draft, so the
     * choice comes back after a tab switch and a reload. The empty string goes back to the name's.
     */
    function setSourceLanguage(id: string, language: string): void {
        updateDraft(id, { language });
    }

    /** The indentation Tab inserts, chosen from the status bar and kept with the draft. */
    function setSourceIndent(id: string, indent: Indent | null): void {
        updateDraft(id, { indent });
    }

    /** The word wrap Alt+Z set for the tab, kept with the draft; null is the configured one. */
    function setSourceWrap(id: string, wrap: WordWrap | null): void {
        updateDraft(id, { wrap });
    }

    function setSourceFirst(id: string, line: number): void {
        if (line !== sourceDraft(id).first) updateDraft(id, { first: line });
    }

    function registerFormat(id: string, format: () => Promise<void>): () => void {
        formats.set(id, format);
        return () => {
            if (formats.get(id) === format) formats.delete(id);
        };
    }

    /** Replace the tab's text by another, as the smallest edits between the two. */
    function rewrite(id: string, to: string): void {
        const from = sourceDraft(id).text;
        if (from !== to) editSourceDraft(id, to, editsBetween(from, to));
    }

    /** Say a save failed, on the tab's line, with the cross. */
    function failedOnLine(id: string, message: string): false {
        updateDraft(id, { message, failed: true });
        return false;
    }

    /**
     * A save acknowledges the exact sent copy, even if more typing follows while it is pending. A
     * draft the tab holds no complete file for is never sent: the file on disk would lose whatever
     * the read left out. Saves of one tab run one at a time, so each sends the hash the one before
     * answered. A save that throws is a failed save on the tab's line, and the saves queued behind
     * it still run.
     */
    function saveSourceDraft(
        id: string,
        root: string,
        path: string,
        options: SaveOptions = {}
    ): Promise<boolean> {
        const run = (queued.get(id) ?? Promise.resolve(true)).then(() =>
            performSave(id, root, path, options).catch((): boolean => {
                failedOnLine(id, t('source.save_failed'));
                return false;
            })
        );
        queued.set(id, run);
        void run.then(() => {
            if (queued.get(id) === run) queued.delete(id);
        });
        return run;
    }

    async function performSave(
        id: string,
        root: string,
        path: string,
        options: SaveOptions
    ): Promise<boolean> {
        const draft = sourceDraft(id);
        if (draft.readonly) return saidOnLine(id, t('source.readonly'));
        if (draft.disk === 'unserved') return saidOnLine(id, t('source.disk_unserved'));
        if (draft.truncated) return saidOnLine(id, t('source.truncated'));
        if (draft.notText) return saidOnLine(id, t('source.not_text'));
        const base = options.overwrite === true ? '' : draft.base;
        // A tab restored with no base cannot say what it was typed against; its Save is the
        // conflict.
        if (draft.disk === 'changed' && base === '' && options.overwrite !== true) {
            return conflictOf(id, path);
        }
        const rules = deps.rules(id, draft, root, path);
        const keep = options.automatic === true ? deps.kept(id) : [];
        disk.begin(id);
        try {
            if (rules.trim) rewrite(id, trimText(sourceDraft(id).text, keep));
            if (options.format !== undefined) {
                await tick();
                await options.format();
            }
            if (rules.finalNewline) rewrite(id, endText(sourceDraft(id).text, keep));
            if (ui.instanceState(id) === undefined) return false;
            const content = sourceDraft(id).text;
            updateDraft(id, { message: t('source.saving') });
            const gone = draft.disk === 'gone';
            const answer = await postSave({
                root,
                path,
                content,
                ...(base === '' ? {} : { base }),
                ...(gone ? { create: true } : {})
            });
            // The answer belongs to the draft it was sent from. A tab closed while the save was out
            // has no record left to write into, and a preview tab pointed at another file while it
            // was out holds that file's draft, so either way the answer writes nothing.
            if (ui.instanceState(id) === undefined || sourceDraft(id).file !== draft.file) {
                return false;
            }
            const landed = answered(id, path, content, answer);
            if (landed && options.unformatted !== undefined) {
                updateDraft(id, { message: t('source.format_failed', options.unformatted) });
            }
            return landed;
        } finally {
            disk.end(id);
        }
    }

    /** The words of a save that was not sent, on the tab's line. */
    function saidOnLine(id: string, message: string): false {
        updateDraft(id, { message });
        return false;
    }

    /** The tab's line for a save the file's change refused. */
    function conflictOf(id: string, path: string): false {
        updateDraft(id, {
            disk: 'changed',
            conflict: true,
            message: t('source.save_conflict', nameOf(path)),
            failed: true
        });
        return false;
    }

    /** What the tab does with the server's answer to a save. */
    function answered(id: string, path: string, content: string, answer: WriteAnswer): boolean {
        if (answer.ok) {
            const unkept = answer.refused.find((one) => one.field === 'history');
            const message =
                unkept === undefined
                    ? t('source.saved')
                    : t('source.saved_without_copy', unkept.reason);
            updateDraft(id, {
                saved: content,
                base: answer.hash ?? '',
                disk: 'same',
                conflict: false,
                message
            });
            return true;
        }
        // A request that never reached the server (offline, a dropped socket) is the catalog's
        // save_failed; a refusal the server named carries the tab's own sentence for it. A file
        // whose mode changed under the tab becomes the tab a locked file gets.
        if (answer.network === true) {
            updateDraft(id, { message: t('source.save_failed') });
            return false;
        }
        if (answer.code === 'changed') {
            if (!answer.refused.some((one) => one.reason === 'folder')) return conflictOf(id, path);
            updateDraft(id, {
                disk: 'gone',
                conflict: false,
                message: t('source.save_folder', nameOf(path)),
                failed: true
            });
            return false;
        }
        if (answer.error === 'readonly') {
            updateDraft(id, { readonly: true, message: t('source.readonly') });
            return false;
        }
        if (answer.error === 'binary') {
            updateDraft(id, { message: t('source.binary') });
            return false;
        }
        return failedOnLine(
            id,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
            answer.error || t('source.failed')
        );
    }

    /** Send one whole-file save through POST /api/source, told to the page when it landed. */
    async function postSave(body: {
        root: string;
        path: string;
        content: string;
        base?: string;
        create?: boolean;
    }): Promise<WriteAnswer> {
        const answer = await writes.send(body, '/api/source', { asked: ['changed'] });
        if (answer.ok) saved(body.root, body.path);
        return answer;
    }

    /** Save one file's complete current text through POST /api/source. */
    async function saveSource(root: string, path: string, content: string): Promise<WriteAnswer> {
        return postSave({ root, path, content });
    }

    return {
        sourceDraft,
        sourceDirty,
        openDrafts,
        unsavedFile,
        loadSourceDraft,
        loadLibraryDraft,
        loadUntitledDraft,
        reloadSource,
        reloadHead,
        editSourceDraft,
        onEdit,
        sourceReach,
        revertSourceDraft,
        saveSourceDraft,
        registerFormat,
        formatOf: (id) => formats.get(id),
        fileGone: disk.gone,
        diskHash: disk.hash,
        toggleSourceRendered,
        toggleSourceBlame,
        setSourceLanguage,
        setSourceIndent,
        setSourceWrap,
        setSourceFirst,
        nextAsked: () => ++asked,
        saveSource
    };
}
