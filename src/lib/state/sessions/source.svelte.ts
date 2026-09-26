// Layer 2, client state. The source tab's file address, its initial whole-text read, whether this
// machine's mode lets it be written, and the whole-text save through the shared authenticated write
// sender.
//
// Whether a file may be saved is the file's own mode, asked of the source route when the tab opens
// and held with the draft: no list of extensions decides it, so a tab over a file this machine
// locks shows it and says so, and a tab over anything else is an editor. The read is cut at the
// same limit the file route's readers use, and a draft that was cut saves nothing: writing back a
// copy that stops at two megabytes would take the rest of the file off the disk.

import { TEXT_LIMIT } from '../sources/fs.ts';
import { readCapped } from '../sources/fs.svelte.ts';
import type { WriteAnswer, WritesStore, InstanceStates } from '../shared/stores/shapes.ts';
import { t } from '../shared/words/text.ts';

/**
 * How a file indents: with tabs or with spaces, and how wide one step is. It is declared here, with
 * the draft that holds it, and the editor's text rules in state/workbench/navigation read it from
 * here.
 */
export type Indent = { tabs: boolean; size: number };

export type SourceLoad =
    { ok: true; content: string; truncated: boolean } | { ok: false; error: string };
export type SourceTabState = {
    root: string;
    path: string;
    label: string;
    /** The line the tab scrolls to once the draft has loaded, for a tab opened at one. */
    line?: number;
};

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
};

/** An indentation kept in storage, or null for anything that is not one. */
function indentOf(value: unknown): Indent | null {
    if (typeof value !== 'object' || value === null) return null;
    const held = value as Record<string, unknown>;
    const size = held.size;
    if (typeof held.tabs !== 'boolean' || typeof size !== 'number') return null;
    return Number.isInteger(size) && size >= 1 && size <= 8 ? { tabs: held.tabs, size } : null;
}

/** One token per page lifetime: a draft carrying it was read from disk since the page loaded. */
const LIFETIME = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * The state that identifies one source tab and labels it with the file name. A caller that knows
 * which line the reader was sent to names it, and the tab scrolls there once its draft has loaded.
 */
export function sourceTabState(root: string, path: string, line?: number): SourceTabState {
    const state: SourceTabState = {
        root,
        path,
        label: path.split('/').filter(Boolean).at(-1) ?? path
    };
    return line === undefined ? state : { ...state, line };
}

/**
 * Where one line of a text begins, counting the line from one. A line past the end is the last
 * line's own beginning, so a stale line number lands at the end of the file rather than nowhere.
 */
export function lineStart(text: string, line: number): number {
    const lines = text.split('\n');
    const at = Math.min(Math.max(Math.floor(line), 1), lines.length);
    let offset = 0;
    for (let index = 0; index < at - 1; index += 1) offset += lines[index].length + 1;
    return offset;
}

/** The api/file URL, escaping each path segment without escaping its separators. */
export function sourceFileUrl(root: string, path: string): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '')
        .map((part) => encodeURIComponent(part));
    return `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
}

/** The api/source address the file's own facts are read at. */
export function sourceInfoUrl(root: string, path: string): string {
    return `/api/source?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
}

/** Read one file's text from the existing file route, cut at the limit every reader of it uses. */
export async function loadSource(root: string, path: string): Promise<SourceLoad> {
    try {
        const response = await fetch(sourceFileUrl(root, path));
        if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
        const held = await readCapped(response, TEXT_LIMIT);
        return { ok: true, content: held.text, truncated: held.truncated };
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
        const held: unknown = await response.json();
        return (
            typeof held === 'object' &&
            held !== null &&
            (held as Record<string, unknown>).readonly === true
        );
    } catch {
        return false;
    }
}

/** The source tab's drafts and saves, for one client. */
export type SourceStore = {
    sourceDraft: (id: string) => SourceDraft;
    sourceDirty: (id: string) => boolean;
    loadSourceDraft: (id: string, root: string, path: string) => Promise<void>;
    editSourceDraft: (id: string, text: string) => void;
    revertSourceDraft: (id: string) => void;
    saveSourceDraft: (id: string, root: string, path: string) => Promise<void>;
    toggleSourceRendered: (id: string) => void;
    toggleSourceBlame: (id: string) => void;
    setSourceLanguage: (id: string, language: string) => void;
    setSourceIndent: (id: string, indent: Indent | null) => void;
    saveSource: (root: string, path: string, content: string) => Promise<WriteAnswer>;
};

export function createSource(writes: WritesStore, ui: InstanceStates): SourceStore {
    const reading = new Map<string, { file: string; request: Promise<void> }>();

    /** Working and saved copies belong to the instance, not its currently mounted component. */
    function sourceDraft(id: string): SourceDraft {
        const value = ui.instanceState(id);
        const held = (
            typeof value === 'object' && value !== null ? value : {}
        ) as Partial<SourceDraft>;
        return {
            text: typeof held.text === 'string' ? held.text : '',
            saved: typeof held.saved === 'string' ? held.saved : '',
            loaded: held.loaded === true,
            readIn: typeof held.readIn === 'string' ? held.readIn : undefined,
            error: typeof held.error === 'string' ? held.error : '',
            message: typeof held.message === 'string' ? held.message : '',
            failed: held.failed === true,
            // A tab that has never been told otherwise shows the rendered half, so opening a
            // Markdown file reads as the document it is without a control being found first.
            rendered: held.rendered !== false,
            blame: held.blame === true,
            readonly: held.readonly === true,
            truncated: held.truncated === true,
            file: typeof held.file === 'string' ? held.file : '',
            language: typeof held.language === 'string' ? held.language : '',
            indent: indentOf(held.indent)
        };
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

    /**
     * Read once per instance per page lifetime, sharing an unfinished read across tab switches. A
     * draft restored from the browser's storage after a reload is read again from disk: an unsaved
     * edit is kept as the working text over the disk's copy, a draft with no edit takes the disk's
     * text.
     *
     * The read belongs to the file it was started for. A preview tab pointed at a second file while
     * the first file's read is still in flight has its draft cleared and asks for the second file:
     * that ask starts its own read rather than waiting on the first, and the first, when it lands,
     * finds the draft is another file's and writes nothing.
     */
    async function loadSourceDraft(id: string, root: string, path: string): Promise<void> {
        const file = `${root}/${path}`;
        const held = sourceDraft(id);
        if (held.readIn === LIFETIME && held.file === file) return;
        const pending = reading.get(id);
        if (pending?.file === file) return pending.request;
        // A tab pointed at another file drops the language and the indentation chosen for the
        // last, since the choice was about that file's text.
        updateDraft(id, held.file === file ? { file } : { file, language: '', indent: null });
        const request = Promise.all([loadSource(root, path), loadSourceReadonly(root, path)]).then(
            ([answer, readonly]) => {
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
            }
        );
        const entry = { file, request };
        reading.set(id, entry);
        try {
            await request;
        } finally {
            if (reading.get(id) === entry) reading.delete(id);
        }
    }

    /** Keep typing local to this instance until the user saves. */
    function editSourceDraft(id: string, text: string): void {
        updateDraft(id, { text, message: '' });
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
            updateDraft(id, { saved: content, message: t('source.saved') });
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
        return writes.send({ root, path, content }, '/api/source');
    }

    return {
        sourceDraft,
        sourceDirty,
        loadSourceDraft,
        editSourceDraft,
        revertSourceDraft,
        saveSourceDraft,
        toggleSourceRendered,
        toggleSourceBlame,
        setSourceLanguage,
        setSourceIndent,
        saveSource
    };
}
