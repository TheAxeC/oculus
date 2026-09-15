// Layer 2, client state. What the file browser fetched: one directory's entries, the workspaces, one
// file's text, the reader's own bookmarks and their scratch notes.
//
// It is state/docs.svelte.ts's shape over the reads this endpoint offers, and for the same reason:
// none of them is in the snapshot, so the first call asks the server and every later call reads what
// is held. The request is scheduled on a microtask rather than run inside the call, so reading this
// from a $derived never writes state while a derived is running.
//
// Nothing re-fetches on its own. A write moves the round on, which is what makes the next render ask
// again for everything held; a bookmark is written through /api/write rather than here, since it is
// a collection entry, so that write moves the round on too; what is held stays drawn until the fresh
// answer lands, so a tree does not blink out on every add or removal, and an answer from an earlier
// round is dropped rather than written in over the newer request's. A folder whose contents changed
// on disk is re-read by closing it and opening it, since a poller over an open tree would read the
// disk for a reader who is looking at one line of it.
//
// One root alone is re-read by refresh(root, version): the round a key belongs to is the shared
// round plus the version that root was last refreshed at, so a view watching a channel (the Config
// view watching the config one) asks again for that root's listings and texts and for nothing under
// any other root. A refresh at a version already seen writes the same value and moves nothing.
//
// The file text is read through the file route and stopped at the window's limit: the reader is
// cancelled once the limit is in, so a forty-megabyte file costs two megabytes of transfer and not
// forty.

import type { Entry, SchemaField } from '../data/model.ts';
import { TEXT_LIMIT, treeKey, type FsEntry, type FsRoot } from './fs.ts';
import type { WriteAnswer, WritesStore } from './writes.svelte.ts';

/** The endpoint the tree reads and the workspace actions write. */
export const FS_PATH = '/api/fs';

/**
 * The collection key the write path resolves to the reader's own bookmarks file. A bookmark is
 * written through /api/write like any other collection entry, so the shared entry form edits one
 * without knowing where it lives.
 */
export const BOOKMARK_COLLECTION = 'bookmarks';

/** What a save of a note this page deleted is refused with, in the endpoint's own vocabulary. */
export const NOTE_GONE = 'no-such-note';

/** One directory as the tree reads it. */
export type Listing = {
    entries: FsEntry[];
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the folder is still to come. */
    loading: boolean;
};

/** The workspaces as the toolbar reads them. */
export type WorkspacesState = {
    current: string;
    workspaces: { name: string; roots: FsRoot[] }[];
    /** The keys the server dropped because the configuration reserves them. */
    dropped: string[];
    error: string;
    loading: boolean;
};

/** The reader's own bookmarks as the rail and the Files view read them. */
export type BookmarksState = {
    entries: Entry[];
    /** The file's own schema, which is what the entry form draws its controls from. */
    schema: SchemaField[];
    error: string;
    loading: boolean;
};

/** One scratch note as the Files view lists it. */
export type NoteRow = { id: string; title: string; modified: number };

/** The scratch notes as the Files view reads them. */
export type NotesState = { notes: NoteRow[]; error: string; loading: boolean };

/** One note as its own view reads it. */
export type NoteState = NoteRow & { body: string; error: string; loading: boolean };

/** One file's text as the code window reads it. */
export type FileText = {
    text: string;
    /** True when the file is longer than the window draws and the text is its first part. */
    truncated: boolean;
    error: string;
    loading: boolean;
};

const NO_LISTING: Listing = { entries: [], error: '', loading: true };

const NO_WORKSPACES: WorkspacesState = {
    current: '',
    workspaces: [],
    dropped: [],
    error: '',
    loading: true
};

const NO_TEXT: FileText = { text: '', truncated: false, error: '', loading: true };

const NO_BOOKMARKS: BookmarksState = { entries: [], schema: [], error: '', loading: true };

const NO_NOTES: NotesState = { notes: [], error: '', loading: true };

const NO_NOTE: NoteState = { id: '', title: '', body: '', modified: 0, error: '', loading: true };

/** The keys the three whole-file answers are held and rounded under; a root key is never one. */
const WORKSPACES = ':workspaces';

const BOOKMARKS = ':bookmarks';

const NOTES = ':notes';

/** The file browser's fetched state, one per client. */
export type FsStore = {
    listing: (root: string, path: string) => Listing;
    entries: (root: string, path: string) => FsEntry[];
    workspaces: () => WorkspacesState;
    fileText: (root: string, path: string) => FileText;
    /** Ask again for what is held under one root, at the version of whatever said it had changed. */
    refresh: (root: string, version: number) => void;
    /** The reader's own bookmarks, asked for once a round like the workspaces. */
    bookmarks: () => BookmarksState;
    /** Every scratch note, newest first. */
    notes: () => NotesState;
    /** One note's own text. */
    note: (id: string) => NoteState;
    addRoot: (dir: string) => Promise<WriteAnswer>;
    removeRoot: (key: string) => Promise<WriteAnswer>;
    saveWorkspace: (name: string) => Promise<WriteAnswer>;
    selectWorkspace: (name: string) => Promise<WriteAnswer>;
    /** Add one bookmark through the collection write path, and ask for them again. */
    addBookmark: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /** Take one bookmark out, by the label it is found by. */
    removeBookmark: (label: string) => Promise<WriteAnswer>;
    /** Say that the bookmarks were written by something else, such as the shared entry form. */
    bookmarksChanged: () => void;
    saveNote: (id: string, title: string, body: string) => Promise<WriteAnswer>;
    deleteNote: (id: string) => Promise<WriteAnswer>;
    /** Whether this page deleted that note, so nothing tries to write it back. */
    noteDeleted: (id: string) => boolean;
    /** Ask for every held answer again, keeping what is held drawn until the new one lands. */
    invalidate: () => void;
};

/** The address one file's bytes are read at, each segment escaped without escaping the separators. */
export function fileBytesUrl(root: string, path: string): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '')
        .map((part) => encodeURIComponent(part));
    return `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
}

/** The address one directory's entries are read at. */
export function listingUrl(root: string, path: string): string {
    return `${FS_PATH}?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
}

/** The address one note's own text is read at. */
export function noteUrl(id: string): string {
    return `${FS_PATH}?note=${encodeURIComponent(id)}`;
}

/**
 * At most `limit` bytes of a response, with the transfer stopped once the limit is in: the reader is
 * cancelled, so the rest of the file never crosses the socket. The limit is bytes, which is what the
 * window's note claims; a multi-byte character split by the cut decodes as the replacement character,
 * which is what any reader of a truncated file sees.
 */
export async function readCapped(
    response: Response,
    limit: number
): Promise<{ text: string; truncated: boolean }> {
    const body = response.body;
    if (body === null) return { text: await response.text(), truncated: false };
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let taken = 0;
    try {
        while (taken <= limit) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            taken += value.byteLength;
        }
    } finally {
        if (taken > limit) await reader.cancel();
    }
    const kept = new Uint8Array(Math.min(taken, limit));
    let at = 0;
    for (const chunk of chunks) {
        if (at >= kept.length) break;
        const part = chunk.subarray(0, kept.length - at);
        kept.set(part, at);
        at += part.byteLength;
    }
    return { text: new TextDecoder().decode(kept), truncated: taken > limit };
}

export function createFs(writes: WritesStore): FsStore {
    const listings: Record<string, Listing | undefined> = $state({});
    const texts: Record<string, FileText | undefined> = $state({});
    const notes: Record<string, NoteState | undefined> = $state({});

    /**
     * The notes this page deleted. A deleted note is never asked for again and never written again,
     * which is what keeps a wait that was still running from putting one back on the disk.
     */
    const gone = new Set<string>();
    const held: {
        workspaces: WorkspacesState | null;
        bookmarks: BookmarksState | null;
        notes: NotesState | null;
    } = $state({ workspaces: null, bookmarks: null, notes: null });

    /** The round each held answer was fetched in. Not reactive: only requests read it. */
    const rounds: Record<string, number> = {};

    /** The requests in flight, by round and key, so one render does not send two. */
    const inflight = new Set<string>();

    /**
     * Which round of answers is current, and which round of notes. A write moves one of them on and
     * what that round holds is asked again; they are runes because every read of them happens inside
     * a derived, which has to run again when one moves.
     *
     * The notes have a round of their own because a note is saved while it is typed: on the one
     * round a save would ask for every open listing and every open file's text again, which is
     * megabytes of transfer per paragraph. A note action moves `notes` alone; anything else moves
     * `round`, and moves `notes` with it.
     */
    const clock: { round: number; notes: number } = $state({ round: 0, notes: 0 });

    /**
     * The version one root was last refreshed at, by root key. A rune for the same reason the clock
     * is one: a read of it happens inside the derived that asks for a listing or a text.
     */
    const refreshed: Record<string, number | undefined> = $state({});

    /** The round one root's answers belong to: the shared round, and what refresh() added to it. */
    function roundOf(root: string): number {
        return clock.round + (refreshed[root] ?? 0);
    }

    /**
     * Whether this runs where a fetch is the page's own. A server rendering has a global fetch in
     * Node but no page to resolve a relative address against, so it asks for nothing and every
     * answer stays pending until the browser's first render.
     */
    function online(): boolean {
        return typeof window !== 'undefined' && typeof fetch === 'function';
    }

    /** Schedule one request, off the caller's stack so no state is written inside a derived. */
    function schedule(key: string, at: number, load: () => Promise<void>): void {
        const ticket = `${at}:${key}`;
        if (inflight.has(ticket) || !online()) return;
        inflight.add(ticket);
        queueMicrotask(() => {
            void load().finally(() => inflight.delete(ticket));
        });
    }

    /** Whether an answer from round `at` of the given clock may still be written in. */
    function fresh(at: number, kind: 'round' | 'notes'): boolean {
        return at === clock[kind];
    }

    /** Whether an answer from round `at` may still be written in, for the root it was asked of. */
    function current(at: number, root: string): boolean {
        return at === roundOf(root);
    }

    /** The same for the workspaces, which belong to no root and ride the shared round alone. */
    function currentShared(at: number): boolean {
        return at === clock.round;
    }

    /** One directory. The first call for a folder asks the server; later calls read what is held. */
    function listing(root: string, path: string): Listing {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = treeKey(root, path);
        const found = listings[key];
        const at = roundOf(root);
        if (found === undefined || rounds[key] !== at) {
            schedule(key, at, () => loadListing(root, path, at));
        }
        return found ?? NO_LISTING;
    }

    /** The entries of one folder, which is what the tree walks. */
    function entries(root: string, path: string): FsEntry[] {
        return listing(root, path).entries;
    }

    async function loadListing(root: string, path: string, at: number): Promise<void> {
        const key = treeKey(root, path);
        try {
            const response = await fetch(listingUrl(root, path));
            const body = (await response.json()) as { entries?: unknown; error?: unknown };
            if (!current(at, root)) return;
            rounds[key] = at;
            if (!response.ok) {
                listings[key] = {
                    entries: [],
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            listings[key] = {
                entries: Array.isArray(body.entries) ? (body.entries as FsEntry[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (!current(at, root)) return;
            rounds[key] = at;
            listings[key] = { entries: [], error: reasonOf(error), loading: false };
        }
    }

    /** The workspaces, asked for once a round and held until the next one. */
    function workspaces(): WorkspacesState {
        const at = clock.round;
        if (held.workspaces === null || rounds[WORKSPACES] !== at) {
            schedule(WORKSPACES, at, () => loadWorkspaces(at));
        }
        return held.workspaces ?? NO_WORKSPACES;
    }

    async function loadWorkspaces(at: number): Promise<void> {
        try {
            const response = await fetch(FS_PATH);
            const body = (await response.json()) as {
                current?: unknown;
                workspaces?: unknown;
                dropped?: unknown;
                error?: unknown;
            };
            if (!currentShared(at)) return;
            rounds[WORKSPACES] = at;
            if (!response.ok) {
                held.workspaces = {
                    ...NO_WORKSPACES,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            held.workspaces = {
                current: typeof body.current === 'string' ? body.current : '',
                workspaces: Array.isArray(body.workspaces)
                    ? (body.workspaces as { name: string; roots: FsRoot[] }[])
                    : [],
                dropped: Array.isArray(body.dropped) ? (body.dropped as string[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (!currentShared(at)) return;
            rounds[WORKSPACES] = at;
            held.workspaces = { ...NO_WORKSPACES, error: reasonOf(error), loading: false };
        }
    }

    /** One file's text, read through the file route and stopped at the window's limit. */
    function fileText(root: string, path: string): FileText {
        if (root === '' || path === '') return { ...NO_TEXT, loading: false };
        const key = treeKey(root, path);
        const found = texts[key];
        const at = roundOf(root);
        if (found === undefined || rounds[`text:${key}`] !== at) {
            schedule(`text:${key}`, at, () => loadText(root, path, at));
        }
        return found ?? NO_TEXT;
    }

    async function loadText(root: string, path: string, at: number): Promise<void> {
        const key = treeKey(root, path);
        try {
            const response = await fetch(fileBytesUrl(root, path));
            if (!response.ok) {
                if (!current(at, root)) return;
                rounds[`text:${key}`] = at;
                texts[key] = { ...NO_TEXT, error: String(response.status), loading: false };
                return;
            }
            const body = await readCapped(response, TEXT_LIMIT);
            if (!current(at, root)) return;
            rounds[`text:${key}`] = at;
            texts[key] = { ...body, error: '', loading: false };
        } catch (error) {
            if (!current(at, root)) return;
            rounds[`text:${key}`] = at;
            texts[key] = { ...NO_TEXT, error: reasonOf(error), loading: false };
        }
    }

    /** The reader's own bookmarks, asked for once a round and held until the next one. */
    function bookmarks(): BookmarksState {
        const at = clock.round;
        if (held.bookmarks === null || rounds[BOOKMARKS] !== at) {
            schedule(BOOKMARKS, at, () => loadBookmarks(at));
        }
        return held.bookmarks ?? NO_BOOKMARKS;
    }

    async function loadBookmarks(at: number): Promise<void> {
        try {
            const response = await fetch(`${FS_PATH}?bookmarks=1`);
            const body = (await response.json()) as {
                entries?: unknown;
                schema?: unknown;
                error?: unknown;
            };
            if (!currentShared(at)) return;
            rounds[BOOKMARKS] = at;
            if (!response.ok) {
                held.bookmarks = {
                    ...NO_BOOKMARKS,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            held.bookmarks = {
                entries: Array.isArray(body.entries) ? (body.entries as Entry[]) : [],
                schema: Array.isArray(body.schema) ? (body.schema as SchemaField[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (!currentShared(at)) return;
            rounds[BOOKMARKS] = at;
            held.bookmarks = { ...NO_BOOKMARKS, error: reasonOf(error), loading: false };
        }
    }

    /** Every scratch note, asked for once a notes round and held until the next one. */
    function noteList(): NotesState {
        const at = clock.notes;
        if (held.notes === null || rounds[NOTES] !== at) schedule(NOTES, at, () => loadNotes(at));
        return held.notes ?? NO_NOTES;
    }

    async function loadNotes(at: number): Promise<void> {
        try {
            const response = await fetch(`${FS_PATH}?notes=1`);
            const body = (await response.json()) as { notes?: unknown; error?: unknown };
            if (!fresh(at, 'notes')) return;
            rounds[NOTES] = at;
            if (!response.ok) {
                held.notes = {
                    ...NO_NOTES,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            held.notes = {
                notes: Array.isArray(body.notes) ? (body.notes as NoteRow[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (!fresh(at, 'notes')) return;
            rounds[NOTES] = at;
            held.notes = { ...NO_NOTES, error: reasonOf(error), loading: false };
        }
    }

    /** One note's own text, asked for once a notes round. A note that was deleted is not asked for. */
    function note(id: string): NoteState {
        if (id === '') return { ...NO_NOTE, loading: false };
        const found = notes[id];
        const at = clock.notes;
        if (!gone.has(id) && (found === undefined || rounds[`note:${id}`] !== at)) {
            schedule(`note:${id}`, at, () => loadNote(id, at));
        }
        return found ?? NO_NOTE;
    }

    async function loadNote(id: string, at: number): Promise<void> {
        try {
            const response = await fetch(noteUrl(id));
            const body = (await response.json()) as {
                title?: unknown;
                body?: unknown;
                modified?: unknown;
                error?: unknown;
            };
            if (!fresh(at, 'notes')) return;
            rounds[`note:${id}`] = at;
            if (!response.ok) {
                notes[id] = {
                    ...NO_NOTE,
                    id,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            notes[id] = {
                id,
                title: typeof body.title === 'string' ? body.title : '',
                body: typeof body.body === 'string' ? body.body : '',
                modified: typeof body.modified === 'number' ? body.modified : 0,
                error: '',
                loading: false
            };
        } catch (error) {
            if (!fresh(at, 'notes')) return;
            rounds[`note:${id}`] = at;
            notes[id] = { ...NO_NOTE, id, error: reasonOf(error), loading: false };
        }
    }

    function reasonOf(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    /**
     * Ask the server again for everything held: the workspaces, the bookmarks, every listing, every
     * file text and the notes. What is held keeps being drawn until each new answer lands, and an
     * answer from the round before this one is dropped, so a listing fetched before a removal cannot
     * reappear after it.
     */
    function invalidate(): void {
        clock.round += 1;
        clock.notes += 1;
    }

    /** Ask the server again for the notes and for each note, and for nothing else. */
    function notesChanged(): void {
        clock.notes += 1;
    }

    /**
     * Ask again for the listings and the texts held under one root, and for nothing under any other.
     * The version is whatever said the root had changed, the config channel's for the engine's own
     * folder; a version already refreshed at writes the same value and asks for nothing again. The
     * version never moves backwards: the round is the shared round plus this one, and a lower value
     * would let an older answer in over a newer one.
     */
    function refresh(root: string, version: number): void {
        if (root === '' || refreshed[root] === version) return;
        refreshed[root] = version;
    }

    /** One workspace action, behind the same token every other write carries. */
    async function act(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields, FS_PATH);
        if (answer.ok) invalidate();
        return answer;
    }

    /** One note action. It moves the notes on and leaves every other held answer where it is. */
    async function noteAct(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields, FS_PATH);
        if (answer.ok) notesChanged();
        return answer;
    }

    /**
     * Write one note, unless it is one this page deleted. A save is scheduled behind a wait, so a
     * note deleted while that wait was running would otherwise be written back to the disk by it;
     * the refusal is answered here rather than sent, since the endpoint would write the file again.
     */
    async function saveNote(id: string, title: string, body: string): Promise<WriteAnswer> {
        if (gone.has(id)) {
            return { ok: false, changed: [], refused: [], error: NOTE_GONE };
        }
        const answer = await noteAct({ action: 'note-save', id, title, body });
        // What was just written is what is held, so a tab opened on this note before the re-read
        // lands is seeded from the text on the disk and not from the text before the save.
        if (answer.ok) {
            notes[id] = { id, title, body, modified: Date.now(), error: '', loading: false };
        }
        return answer;
    }

    /** Take one note off the disk, and remember that this page did so. */
    async function deleteNote(id: string): Promise<WriteAnswer> {
        const answer = await noteAct({ action: 'note-delete', id });
        if (answer.ok) gone.add(id);
        return answer;
    }

    /** One collection write on the bookmarks file, which is /api/write rather than this endpoint. */
    async function bookmarkWrite(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields);
        if (answer.ok) invalidate();
        return answer;
    }

    return {
        listing,
        entries,
        workspaces,
        fileText,
        refresh,
        bookmarks,
        notes: noteList,
        note,
        addRoot: (dir: string) => act({ action: 'add-root', dir }),
        removeRoot: (key: string) => act({ action: 'remove-root', key }),
        saveWorkspace: (name: string) => act({ action: 'save-workspace', name }),
        selectWorkspace: (name: string) => act({ action: 'select-workspace', name }),
        addBookmark: (fields: Record<string, unknown>) =>
            bookmarkWrite({ kind: 'new-entry', collection: BOOKMARK_COLLECTION, fields }),
        removeBookmark: (label: string) =>
            bookmarkWrite({ kind: 'delete-entry', collection: BOOKMARK_COLLECTION, id: label }),
        bookmarksChanged: invalidate,
        saveNote,
        deleteNote,
        noteDeleted: (id: string) => gone.has(id),
        invalidate
    };
}
