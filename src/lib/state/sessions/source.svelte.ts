// Layer 2, client state. The source tab's file address, its initial whole-text read, the read again
// of a tab with no unsaved text after its file was written, the read again of a HEAD or index tab
// after the version git holds moved, whether this machine's mode lets it be written, and the
// whole-text save through the shared authenticated write sender.
//
// Whether a file may be saved is the file's own mode, asked of the source route when the tab opens
// and held with the draft: no list of extensions decides it, so a tab over a file this machine
// locks shows it and says so, and a tab over anything else is an editor. The read is cut at the
// same limit the file route's readers use, and a draft that was cut saves nothing: writing back a
// copy that stops at two megabytes would take the rest of the file off the disk.

import { z } from 'zod';
import type { TextEdit } from '../../data/prose/text-edits.ts';
import { optionalTextShape, readAs, readJson } from '../../data/shapes/shapes.ts';
import type { WordWrap } from '../../data/helpers/editor.ts';
import { TEXT_LIMIT } from '../sources/fs.ts';
import { headUrl } from '../sources/repositories/repositories.ts';
import type { HeadStage } from '../sources/repositories/file-git.ts';
import { fileBytesUrl, readCapped } from '../sources/fs.svelte.ts';
import type { WriteAnswer, WritesStore, InstanceStates } from '../shared/stores/shapes.ts';
import { refusedAnswer } from '../shared/answers/answers.ts';
import { t } from '../shared/words/text.ts';

/**
 * How a file indents: with tabs or with spaces, and how wide one step is. It is declared here, with
 * the draft that holds it, and the editor's text rules in state/workbench/navigation read it from
 * here.
 */
export type Indent = { tabs: boolean; size: number };

export type SourceLoad =
    { ok: true; content: string; truncated: boolean } | { ok: false; error: string };
/** What the read of a library file answers: its text and language, or the sentence to say. */
export type LibraryAnswer =
    { ok: true; text: string; language: string } | { ok: false; error: string };
export type SourceTabState = {
    root: string;
    path: string;
    label: string;
    /** The line the tab scrolls to once the draft has loaded, for a tab opened at one. */
    line?: number;
    /**
     * The column of the place the tab was opened at, from one: the word there is selected once the
     * draft has loaded. A state without it, or with anything but a positive number, names none.
     */
    column?: number;
    /**
     * The library address of a tab over a library file a language server named, which has no root
     * and no path: `root` and `path` are empty and `id` is the address.
     */
    library?: string;
    /** The tab's identity, for a tab that is one of several over the same file. */
    id?: string;
    /** Which version of the file the tab holds, for a tab over the file at HEAD or in the index. */
    head?: HeadStage;
};

export type { HeadStage };

export type SourceDraft = {
    text: string;
    saved: string;
    loaded: boolean;
    /**
     * The page lifetime the disk was last read in; another value means the draft came from storage.
     */
    readIn?: string;
    error: string;
    message: string;
    /** Whether `message` says a save failed, which the bar draws with the cross glyph before it. */
    failed: boolean;
    /** Whether the rendered half is drawn beside the editor, for a file that has one. */
    rendered: boolean;
    /** Whether the blame of each line is drawn in the gutter, VS Code's Toggle Blame. */
    blame: boolean;
    /**
     * Whether this machine's mode on the file refuses a write, which the tab draws instead of an
     * editor.
     */
    readonly: boolean;
    /**
     * Whether the read stopped at the limit, which is the other way a tab holds no complete file.
     */
    truncated: boolean;
    /**
     * The file the draft was read for, as `root/path`, so a read that lands after the tab was
     * pointed at another file is thrown away.
     */
    file: string;
    /**
     * The language the reader chose for the tab from the status bar, by the highlighter's name,
     * or the empty string for the one the file's own name gives.
     */
    language: string;
    /**
     * The indentation the reader chose for the tab from the status bar, or null for the one the
     * file's own lines give.
     */
    indent: Indent | null;
    /**
     * The word wrap the reader set with Alt+Z for the tab, or null for the configured one. It is
     * kept as the reader set it and taken only when the options catalog's `editor.word_wrap` takes
     * it (`resolveEditor`).
     */
    wrap: string | null;
    /**
     * The first line the editor shows, from one: where a copy of the tab, or the tab in another
     * window, opens the text.
     */
    first: number;
};

/**
 * An indentation kept in storage: tabs or spaces and a whole width. Whether the width is one the
 * catalog's `editor.tab_size` takes is decided where it is used (`resolveEditor`).
 */
const indentShape = z.object({
    tabs: z.boolean(),
    size: z.int()
}) satisfies z.ZodType<Indent>;

/**
 * The fields of a draft kept in the instance's state, each as typed or at its default. A tab that
 * has never been told otherwise shows the source alone, as VS Code opens a Markdown file; the
 * rendered half is the Preview control's.
 */
const draftShape = z
    .object({
        text: z.string().catch(''),
        saved: z.string().catch(''),
        loaded: z.boolean().catch(false),
        readIn: optionalTextShape,
        error: z.string().catch(''),
        message: z.string().catch(''),
        failed: z.boolean().catch(false),
        rendered: z.boolean().catch(false),
        blame: z.boolean().catch(false),
        readonly: z.boolean().catch(false),
        truncated: z.boolean().catch(false),
        file: z.string().catch(''),
        language: z.string().catch(''),
        indent: indentShape.nullable().catch(null),
        wrap: z.string().nullable().catch(null),
        first: z.int().min(1).catch(1)
        // A draft always carries `readIn`, with undefined when the state names none.
    })
    .transform((draft) => ({ readIn: undefined, ...draft })) satisfies z.ZodType<SourceDraft>;

/** Whether the file's own facts say its mode refuses a write. */
const modeShape = z.object({ readonly: z.boolean().catch(false) });

/** The `head` of a tab's state: one of the two stages, or absent. */
const headShape = z.object({ head: z.enum(['head', 'index']).optional().catch(undefined) });

/** What the head read of the git route answers: the text, a file the stage lacks, or a blob. */
const headAnswerShape = z.object({
    ok: z.boolean().catch(false),
    text: z.string().optional().catch(undefined),
    missing: z.boolean().optional().catch(undefined),
    binary: z.boolean().optional().catch(undefined)
});

/** What the `file` of a draft over a library file starts with. */
const LIBRARY_FILE = 'library:';

/** One token per page lifetime: a draft carrying it was read from disk since the page loaded. */
const LIFETIME = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * The state that identifies one source tab and labels it with the file name. A caller that knows
 * which line the reader was sent to names it, and the tab scrolls there once its draft has loaded;
 * one that knows the column names it too, and the tab selects the word there.
 */
export function sourceTabState(
    root: string,
    path: string,
    line?: number,
    column?: number
): SourceTabState {
    const state: SourceTabState = {
        root,
        path,
        label: path.split('/').filter(Boolean).at(-1) ?? path
    };
    return placed(state, line, column);
}

/**
 * The state of a tab over a library file: the address names it, so a second go to definition into
 * the same file activates the tab that holds it, and the file's own name is the label.
 */
export function libraryTabState(
    address: string,
    name: string,
    line?: number,
    column?: number
): SourceTabState {
    return placed({ root: '', path: '', label: name, id: address, library: address }, line, column);
}

/** A state opened at a line and, when the line is named, at a column of it. */
function placed(state: SourceTabState, line?: number, column?: number): SourceTabState {
    if (line === undefined) return state;
    return column === undefined ? { ...state, line } : { ...state, line, column };
}

/** The version a tab's state names, or undefined for a tab over the file on disk. */
export function headOf(state: unknown): HeadStage | undefined {
    return readAs(headShape, state)?.head;
}

/** The api/source address the file's own facts are read at. */
export function sourceInfoUrl(root: string, path: string): string {
    return `/api/source?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
}

/**
 * Read one file's text from the existing file route, cut at the limit every reader of it uses. The
 * route lets a browser keep an answer for a minute, so the read asks the server each time: a text
 * a write is based on, or a tab shows after a change, is the file's text now.
 */
export async function loadSource(root: string, path: string): Promise<SourceLoad> {
    try {
        const response = await fetch(fileBytesUrl(root, path), { cache: 'no-cache' });
        if (!response.ok) return { ok: false, error: refusedAnswer(response.status) };
        const held = await readCapped(response, TEXT_LIMIT);
        return { ok: true, content: held.text, truncated: held.truncated };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/** Read a tracked file as HEAD or the index holds it, from the git route's head read. */
export async function loadHeadFile(
    root: string,
    path: string,
    stage: HeadStage
): Promise<SourceLoad> {
    try {
        const response = await fetch(headUrl(root, path, stage));
        const answer = readAs(headAnswerShape, await readJson(response));
        if (!response.ok || !answer?.ok) {
            return { ok: false, error: `HTTP ${String(response.status)}` };
        }
        if (answer.missing === true) return { ok: false, error: t('source.head_missing') };
        if (answer.binary === true) return { ok: false, error: t('source.head_binary') };
        return { ok: true, content: answer.text ?? '', truncated: false };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Whether the file is locked by its mode on this machine. A request that fails answers false: the
 * save is what refuses a file that cannot be written, and an editor nobody could open over a
 * hiccup in one request would be worse than one whose save says so.
 */
export async function loadSourceReadonly(root: string, path: string): Promise<boolean> {
    try {
        const response = await fetch(sourceInfoUrl(root, path));
        if (!response.ok) return false;
        return readAs(modeShape, await readJson(response))?.readonly ?? false;
    } catch {
        return false;
    }
}

/** The source tab's drafts and saves, for one client. */
export type SourceStore = {
    sourceDraft: (id: string) => SourceDraft;
    sourceDirty: (id: string) => boolean;
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
    /** The edits the tab's text was last replaced by and the text they were made in, or null. */
    sourceReach: (id: string) => { from: string; edits: TextEdit[] } | null;
    revertSourceDraft: (id: string) => void;
    saveSourceDraft: (id: string, root: string, path: string) => Promise<void>;
    toggleSourceRendered: (id: string) => void;
    toggleSourceBlame: (id: string) => void;
    setSourceLanguage: (id: string, language: string) => void;
    setSourceIndent: (id: string, indent: Indent | null) => void;
    setSourceWrap: (id: string, wrap: WordWrap | null) => void;
    /** Keep the first line the tab's editor shows, so a copy of the tab opens at it. */
    setSourceFirst: (id: string, line: number) => void;
    saveSource: (root: string, path: string, content: string) => Promise<WriteAnswer>;
};

/**
 * The source tab's drafts and saves. `saved` is told of each file a save wrote, by its root and
 * path, so what follows a save (a LaTeX build) is decided where that belongs and runs for a save
 * from any tab or list.
 */
export function createSource(
    writes: WritesStore,
    ui: InstanceStates,
    saved: (root: string, path: string) => void = () => undefined
): SourceStore {
    const reading = new Map<string, { file: string; request: Promise<void> }>();
    /** The edits each tab's text was last replaced by, with the text they were made in. */
    const reached = new Map<string, { from: string; edits: TextEdit[] }>();

    /** Working and saved copies belong to the instance, not its currently mounted component. */
    function sourceDraft(id: string): SourceDraft {
        // State that is no map holds no draft, so every field is at its default.
        return draftShape.safeParse(ui.instanceState(id)).data ?? draftShape.parse({});
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
            if (answer.ok) {
                const held = sourceDraft(id);
                const edited = held.loaded && held.text !== held.saved;
                updateDraft(id, {
                    text: edited ? held.text : answer.content,
                    saved: answer.content,
                    loaded: true,
                    readIn: LIFETIME,
                    error: '',
                    readonly,
                    truncated: answer.truncated
                });
            } else {
                updateDraft(id, { error: t('source.cannot_open', answer.error) });
            }
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
                loaded: true,
                readIn: LIFETIME,
                error: '',
                readonly: true,
                truncated: false,
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
            loaded: true,
            readIn: LIFETIME,
            error: '',
            readonly: false,
            truncated: false
        });
    }

    /**
     * Show the file as the disk holds it now, for a tab that holds nothing the reader typed. The
     * answer belongs to the file the draft is of, and text typed while the read was out is kept. A
     * tab over a library file is not read again: the relay's address for it lives with the page's
     * connection.
     */
    async function reloadSource(id: string): Promise<void> {
        const draft = sourceDraft(id);
        const at = draft.file.indexOf('/');
        if (!draft.loaded || draft.text !== draft.saved || at < 0) return;
        if (draft.file.startsWith(LIBRARY_FILE)) return;
        const answer = await loadSource(draft.file.slice(0, at), draft.file.slice(at + 1));
        if (!answer.ok || ui.instanceState(id) === undefined) return;
        const held = sourceDraft(id);
        if (held.file !== draft.file) return;
        const edited = held.text !== held.saved;
        updateDraft(id, {
            text: edited ? held.text : answer.content,
            saved: answer.content,
            truncated: answer.truncated
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
    }

    function sourceReach(id: string): { from: string; edits: TextEdit[] } | null {
        return reached.get(id) ?? null;
    }

    /** Revert restores the last saved copy without closing the tab. */
    function revertSourceDraft(id: string): void {
        updateDraft(id, { text: sourceDraft(id).saved, message: '' });
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

    /**
     * A save acknowledges the exact sent copy, even if more typing follows while it is pending. A
     * draft the tab holds no complete file for is never sent: the file on disk would lose whatever
     * the read left out.
     */
    async function saveSourceDraft(id: string, root: string, path: string): Promise<void> {
        const draft = sourceDraft(id);
        if (draft.readonly) {
            updateDraft(id, { message: t('source.readonly') });
            return;
        }
        if (draft.truncated) {
            updateDraft(id, { message: t('source.truncated') });
            return;
        }
        const content = draft.text;
        updateDraft(id, { message: t('source.saving') });
        const answer = await saveSource(root, path, content);
        // The answer belongs to the draft it was sent from. A tab closed while the save was out has
        // no record left to write into, and a preview tab pointed at another file while it was out
        // holds that file's draft, so either way the answer writes nothing.
        if (ui.instanceState(id) === undefined || sourceDraft(id).file !== draft.file) return;
        if (answer.ok) {
            const unkept = answer.refused.find((one) => one.field === 'history');
            const message =
                unkept === undefined
                    ? t('source.saved')
                    : t('source.saved_without_copy', unkept.reason);
            updateDraft(id, { saved: content, message });
            return;
        }
        // A request that never reached the server (offline, a dropped socket) is the catalog's
        // save_failed; a refusal the server named carries the tab's own sentence for it. A file
        // whose mode changed under the tab becomes the tab a locked file gets.
        if (answer.network) {
            updateDraft(id, { message: t('source.save_failed') });
            return;
        }
        if (answer.error === 'readonly') {
            updateDraft(id, { readonly: true, message: t('source.readonly') });
            return;
        }
        if (answer.error === 'binary') {
            updateDraft(id, { message: t('source.binary') });
            return;
        }
        updateDraft(id, {
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
            message: answer.error || t('source.failed'),
            failed: true
        });
    }

    /** Save one file's complete current text through POST /api/source. */
    async function saveSource(root: string, path: string, content: string): Promise<WriteAnswer> {
        const answer = await writes.send({ root, path, content }, '/api/source');
        if (answer.ok) saved(root, path);
        return answer;
    }

    return {
        sourceDraft,
        sourceDirty,
        loadSourceDraft,
        loadLibraryDraft,
        loadUntitledDraft,
        reloadSource,
        reloadHead,
        editSourceDraft,
        sourceReach,
        revertSourceDraft,
        saveSourceDraft,
        toggleSourceRendered,
        toggleSourceBlame,
        setSourceLanguage,
        setSourceIndent,
        setSourceWrap,
        setSourceFirst,
        saveSource
    };
}
