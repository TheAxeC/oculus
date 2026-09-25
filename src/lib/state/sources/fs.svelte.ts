// Layer 2, client state. What the file browser fetched: one directory's entries, the workspaces,
// one file's text, the reader's own bookmarks and their scratch notes.
//
// It is state/system/docs.svelte.ts's shape over the reads this endpoint offers, and for the same
// reason: none of them is in the snapshot, so the first call asks the server and every later call
// reads what is held. The request is scheduled on a microtask rather than run inside the call, so
// reading this from a $derived never writes state while a derived is running.
//
// Nothing polls. A write moves the round on, which is what makes the next render ask again for
// everything held; a bookmark is written through /api/write rather than here, since it is a
// collection entry, so that write moves the round on too; what is held stays drawn until the fresh
// answer lands, so a tree does not blink out on every add or removal, and an answer from an earlier
// round is dropped rather than written in over the newer request's. A folder whose contents changed
// on disk is re-read by closing it and opening it, since a poller over an open tree would read the
// disk for a reader who is looking at one line of it.
//
// A read of the workspaces, the bookmarks or the notes that ended in an error holds nothing: the
// round is written by the answer that arrived and not by the one that failed, so the next ask reads
// again and a sentence saying why goes as soon as one succeeds. What keeps that from being a
// request per frame while the endpoint is down is the failed round, remembered per key: the ask of
// the round that failed is made once, and asking again is what clears it. The view's own control
// clears it, and so does mounting the view, which is the reader coming back to it.
//
// The bookmarks file is also read again when it changes on the disk. The `files` channel carries a
// message for it, published by the watcher over ~/.oculus, and the round the bookmarks belong to is
// the shared round plus the version of that message: a bookmark added by hand or by another tool
// reaches an open page without a write from it.
//
// One root alone is re-read by refresh(root, version): the round a key belongs to is the shared
// round plus the version that root was last refreshed at, so a view watching a channel (the Config
// view watching the config one) asks again for that root's listings and texts and for nothing under
// any other root. A refresh at a version already seen writes the same value and moves nothing.
//
// A folder can also be read awaited (readListing), which is how the Files view reads the folders on
// the way to a path it was asked to show, one after the other; that read and a render's read of the
// same folder in the same round are one request.
//
// A folder is listed under a pair of toggles, whether hidden files and the files git ignores are
// asked for, and each pair is an answer of its own, held under its own key, since two file
// browsers may list one folder with two different pairs. A folder not yet answered under the pair
// asked for draws what another pair holds of it until its answer lands. relist() asks again for
// every folder held under one pair, which is what flipping a toggle does.
//
// The bookmark forms of every file browser the layout holds are read on each bookmarks answer, and
// the form over a bookmark the file no longer holds is closed there and then. It is read here
// rather than in the view because a file browser may be mounted nowhere: one on a page the reader
// is not looking at, or in a tab its pane has never shown, draws nothing, and its tab would go on
// asking about text over a bookmark that is gone. What a file browser's forms are and how one is
// moved come from the client's state, handed in as BookmarkForms, so this module knows the rule's
// occasion and not the layout.
//
// The file text is read through the file route and stopped at the window's limit: the reader is
// cancelled once the limit is in, so a forty-megabyte file costs two megabytes of transfer and not
// forty. What a file opens as is read the same way and stops after the rule's window and the one
// byte it tells a cut by, and the answer is held for the round, so the tree, the tab it opens and a
// second click on the same row ask the server once.

import type { Entry, FilesPayload, SchemaField } from '../../data/model/index.ts';
import { TEXT_SNIFF_READ } from '../../data/helpers/text-kind.ts';
import type { EntitiesStore, WriteAnswer, WritesStore } from '../shared/stores/shapes.ts';
import {
    LISTING_FORMS,
    NO_BOOKMARKS,
    NO_LISTING,
    NO_NOTE,
    NO_NOTES,
    NO_TEXT,
    NO_WORKSPACES,
    fileBytesUrl,
    FS_PATH,
    listingAnswer,
    listingForm,
    listingKey,
    listingUrl,
    noteUrl,
    readCapped,
    readCappedBytes,
    type BookmarksState,
    type FileText,
    type Listing,
    type NoteRow,
    type NoteState,
    type NotesState,
    type WorkspacesState
} from './fs-transport.ts';
import {
    SHOWN_DEFAULT,
    TEXT_LIMIT,
    editShown,
    editedGone,
    treeKey,
    typeOfFile,
    type FileType,
    type FilesForms,
    type FsEntry,
    type FsRoot,
    type ListingShown
} from './fs.ts';
import { t } from '../shared/words/text.ts';

export { fileBytesUrl, FS_PATH, listingUrl, readCapped } from './fs-transport.ts';
export type {
    BookmarksState,
    FileText,
    Listing,
    NoteRow,
    NoteState,
    NotesState,
    WorkspacesState
} from './fs-transport.ts';

/**
 * What the bookmark forms of the file browsers are read and moved through. The layout, the instance
 * records and the form drafts are all the client's, and this store is given the three reads it
 * needs rather than any of those stores.
 */
export type BookmarkForms = {
    /** Every file browser the layout holds, mounted or not, with the forms each one has open. */
    browsers: () => { id: string; forms: FilesForms }[];
    /** Whether a save from one browser's bookmark form over that bookmark is out. */
    saving: (owner: string, editing: string) => boolean;
    /**
     * Move one browser to other forms, forgetting the draft of the bookmark form the move closes.
     */
    shift: (owner: string, now: FilesForms, next: FilesForms) => void;
};

/**
 * The collection key the write path resolves to the reader's own bookmarks file. A bookmark is
 * written through /api/write like any other collection entry, so the shared entry form edits one
 * without knowing where it lives.
 */
export const BOOKMARK_COLLECTION = 'bookmarks';

/** What a save of a note this page deleted is refused with, in the endpoint's own vocabulary. */
export const NOTE_GONE = 'no-such-note';

/** The keys the three whole-file answers are held and rounded under; a root key is never one. */
const WORKSPACES = ':workspaces';

const BOOKMARKS = ':bookmarks';

const NOTES = ':notes';

/** The file browser's fetched state, one per client. */
export type FsStore = {
    listing: (root: string, path: string, shown?: ListingShown) => Listing;
    entries: (root: string, path: string, shown?: ListingShown) => FsEntry[];
    /**
     * The entries of one folder as far as they have been read, and null for a folder never read. It
     * asks the server for nothing, which is what lets a filter look through every folder already
     * read without reading the rest of the root.
     */
    heldEntries: (root: string, path: string, shown?: ListingShown) => FsEntry[] | null;
    /**
     * One directory once it is answered: what is held for the round without a request, or the
     * answer of the one request the round makes for it, shared with every other caller asking
     * meanwhile. It is what a caller that has to know what a folder holds before its next step
     * awaits.
     */
    readListing: (root: string, path: string, shown?: ListingShown) => Promise<Listing>;
    /** Ask again, on the next read of each, for every folder held under one pair of toggles. */
    relist: (shown: ListingShown) => void;
    workspaces: () => WorkspacesState;
    fileText: (root: string, path: string) => FileText;
    /**
     * What one file opens as. The three formats a browser draws are answered from the name at once;
     * for anything else the head of the file is read and the rule over its bytes decides, so the
     * caller awaits an answer before it opens a tab. The answer is held for the round.
     */
    readFileKind: (root: string, path: string) => Promise<FileType>;
    /** The same answer as far as it is known now, and null while the bytes are still being read. */
    heldFileKind: (root: string, path: string) => FileType | null;
    /**
     * Ask again for what is held under one root, at the version of whatever said it had changed.
     */
    refresh: (root: string, version: number) => void;
    /**
     * How many times one file has been said to have been written since the page opened. It rides on
     * the address the bytes are read at, so a viewer that draws the file itself, a PDF frame above
     * all, fetches the new bytes instead of the ones the browser has cached under the old address.
     */
    fileVersion: (root: string, path: string) => number;
    /** Say that one file was written, which moves its version and its address with it. */
    bump: (root: string, path: string) => void;
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
    /** Ask for the workspaces again after a read that failed, for the control that offers it. */
    retryWorkspaces: () => void;
    /** Ask for the bookmarks again after a read that failed. */
    retryBookmarks: () => void;
    /** Ask for the notes again after a read that failed. */
    retryNotes: () => void;
    /**
     * Move one file browser to other forms, forgetting the draft of the bookmark form the move
     * closes. A press on the view and this store's own close of a gone bookmark are the one move.
     */
    shiftForms: (owner: string, now: FilesForms, next: FilesForms) => void;
    saveNote: (id: string, title: string, body: string) => Promise<WriteAnswer>;
    deleteNote: (id: string) => Promise<WriteAnswer>;
    /** Whether this page deleted that note, so nothing tries to write it back. */
    noteDeleted: (id: string) => boolean;
    /** Ask for every held answer again, keeping what is held drawn until the new one lands. */
    invalidate: () => void;
};

export function createFs(
    writes: WritesStore,
    forms: BookmarkForms,
    entities: EntitiesStore
): FsStore {
    const listings: Record<string, Listing | undefined> = $state({});
    const texts: Record<string, FileText | undefined> = $state({});
    const notes: Record<string, NoteState | undefined> = $state({});

    /**
     * What each file was last answered to open as, for the round it was answered in. A double click
     * on a row asks three times and the tab it opens asks again, so without this one row would cost
     * four reads of the same eight kilobytes.
     */
    const kinds: Record<string, FileType | undefined> = $state({});

    /** The kind reads in flight, by key, so the asks a double click makes share one request. */
    const asking = new Map<string, Promise<FileType>>();

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

    /**
     * The round a read of one of the three whole-file keys failed in. A failure writes no round, so
     * the next round asks again on its own; this says that the ask of the round that failed has
     * been made, which is what keeps a page whose endpoint is down from sending a request per
     * frame.
     *
     * A rune because the getters read it: clearing a key is what makes the view ask again, and the
     * control that offers the reader a second read clears it.
     */
    const failed: Record<string, number | undefined> = $state({});

    /** The requests in flight, by round and key, so one render does not send two. */
    const inflight = new Set<string>();

    /** The listing reads in flight, by round and key, so a render and an awaited read send one. */
    const reading = new Map<string, Promise<Listing>>();

    /**
     * Which round of answers is current, and which round of notes. A write moves one of them on and
     * what that round holds is asked again; they are runes because every read of them happens
     * inside a derived, which has to run again when one moves.
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

    /**
     * How many times each file has been said to have been written, by root and path. A rune because
     * the address a view draws a file at is derived from it, so a bump has to redraw that view.
     */
    const written: Record<string, number | undefined> = $state({});

    /** The round one root's answers belong to: the shared round, and what refresh() added to it. */
    function roundOf(root: string): number {
        return clock.round + (refreshed[root] ?? 0);
    }

    /** How many times one file has been bumped, which is 0 for a file nothing has written. */
    function fileVersion(root: string, path: string): number {
        if (root === '' || path === '') return 0;
        return written[treeKey(root, path)] ?? 0;
    }

    /** Say that one file was written: its version moves, and every address built on it with it. */
    function bump(root: string, path: string): void {
        if (root === '' || path === '') return;
        const key = treeKey(root, path);
        written[key] = (written[key] ?? 0) + 1;
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

    /**
     * Schedule one of the three whole-file reads, unless the read this round already made ended in
     * an error. The failed round is cleared by a retry, and a later round is asked for on its own.
     */
    function askShared(key: string, at: number, load: () => Promise<void>): void {
        if (failed[key] === at) return;
        schedule(key, at, load);
    }

    /** Hold the round one answer arrived in, and forget that an earlier read of it failed. */
    function answered(key: string, at: number): void {
        rounds[key] = at;
        if (failed[key] !== undefined) failed[key] = undefined;
    }

    /** Say that a read failed, which holds no round: the next ask for the key reads again. */
    function refused(key: string, at: number): void {
        failed[key] = at;
    }

    /** Ask again for one of the three whole-file reads after a read of it failed. */
    function retry(key: string): void {
        if (failed[key] === undefined) return;
        failed[key] = undefined;
    }

    /**
     * How far the disk has moved the bookmarks on: the version of the newest `files` message that
     * named the bookmarks file. The channel holds one message, and on a busy hub the next write
     * under a root replaces that one before anything reads the bookmarks, so every message is heard
     * as it is kept rather than the channel read when the menu opens. It is state, so a message
     * about the file redraws whoever asked.
     */
    let onDisk = $state(0);
    entities.afterReceive((message) => {
        const named = message.channel === 'files' && (message.payload as FilesPayload).bookmarks;
        if (named === true && message.version > onDisk) onDisk = message.version;
    });

    /** The round the bookmarks belong to: the shared round, and what the disk has said since. */
    function bookmarksRound(): number {
        return clock.round + onDisk;
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

    /**
     * One directory. The first call for a folder asks the server; later calls read what is held.
     * A folder not yet answered under this pair of toggles draws another pair's answer meanwhile.
     */
    function listing(root: string, path: string, shown = SHOWN_DEFAULT): Listing {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = listingKey(treeKey(root, path), shown);
        const found = listings[key];
        const at = roundOf(root);
        if (found === undefined || rounds[key] !== at) {
            schedule(key, at, () => askListing(root, path, at, shown).then(() => undefined));
        }
        return found ?? otherForm(treeKey(root, path)) ?? NO_LISTING;
    }

    /** What any pair of toggles holds of one folder, for a pair whose answer has not landed. */
    function otherForm(folder: string): Listing | undefined {
        for (const form of LISTING_FORMS) {
            const held = listings[`${form}${folder}`];
            if (held !== undefined) return held;
        }
        return undefined;
    }

    function relist(shown: ListingShown): void {
        const form = listingForm(shown);
        // No round is ever negative, so the next read of each of them is a request.
        for (const key of Object.keys(listings)) if (key.startsWith(form)) rounds[key] = -1;
    }

    /** The one request of a round for one folder, started or joined. */
    function askListing(
        root: string,
        path: string,
        at: number,
        shown: ListingShown
    ): Promise<Listing> {
        const ticket = `${at}:${listingKey(treeKey(root, path), shown)}`;
        const pending = reading.get(ticket);
        if (pending !== undefined) return pending;
        const request = loadListing(root, path, at, shown).finally(() => reading.delete(ticket));
        reading.set(ticket, request);
        return request;
    }

    /**
     * One directory, awaited. A folder held for the round is answered as held; otherwise the
     * round's request is made or joined, and its answer is what comes back even when a newer round
     * has begun meanwhile and the store did not keep it. Where there is no page nothing is asked,
     * and the answer says so.
     */
    async function readListing(
        root: string,
        path: string,
        shown = SHOWN_DEFAULT
    ): Promise<Listing> {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = listingKey(treeKey(root, path), shown);
        const at = roundOf(root);
        const found = listings[key];
        if (found !== undefined && rounds[key] === at) return found;
        if (!online()) return { entries: [], error: t('files.read_offline'), loading: false };
        return askListing(root, path, at, shown);
    }

    /** The entries of one folder, which is what the tree walks. */
    function entries(root: string, path: string, shown = SHOWN_DEFAULT): FsEntry[] {
        return listing(root, path, shown).entries;
    }

    function heldEntries(root: string, path: string, shown = SHOWN_DEFAULT): FsEntry[] | null {
        return listings[listingKey(treeKey(root, path), shown)]?.entries ?? null;
    }

    /**
     * Ask for one directory and hold the answer when its round is still current; return it either
     * way.
     */
    async function loadListing(
        root: string,
        path: string,
        at: number,
        shown: ListingShown
    ): Promise<Listing> {
        const key = listingKey(treeKey(root, path), shown);
        const answer = await listingAnswer(listingUrl(root, path, shown));
        if (current(at, root)) {
            rounds[key] = at;
            listings[key] = answer;
        }
        return answer;
    }

    /** The workspaces, asked for once a round and held until the next one. */
    function workspaces(): WorkspacesState {
        const at = clock.round;
        if (held.workspaces === null || rounds[WORKSPACES] !== at) {
            askShared(WORKSPACES, at, () => loadWorkspaces(at));
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
            if (!response.ok) {
                refused(WORKSPACES, at);
                held.workspaces = {
                    ...NO_WORKSPACES,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            answered(WORKSPACES, at);
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
            refused(WORKSPACES, at);
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

    /**
     * What one file opens as, as far as it is already known: the name's answer for a format the
     * browser draws, the answer held from this round for anything else, and null for a file whose
     * bytes have not been read yet. It is what a view draws by while readFileKind is running.
     */
    function heldFileKind(root: string, path: string): FileType | null {
        const named = typeOfFile(path);
        if (named.kind !== 'other') return named;
        const key = treeKey(root, path);
        return rounds[`kind:${key}`] === roundOf(root) ? (kinds[key] ?? null) : null;
    }

    /**
     * What one file opens as. A name that names a format the browser draws is answered without a
     * request; anything else is decided by the head of the file, and a file that cannot be read at
     * all is a download, which is what the file view draws for it.
     *
     * The answer is held for the round, and the asks made while one read is in flight are that one
     * read: a double click opens a row three times and the tab it opens asks once more, which is
     * one request between them and none at all on the next click.
     */
    async function readFileKind(root: string, path: string): Promise<FileType> {
        const named = typeOfFile(path);
        if (named.kind !== 'other') return named;
        const key = treeKey(root, path);
        const at = roundOf(root);
        const remembered = heldFileKind(root, path);
        if (remembered !== null) return remembered;
        const pending = asking.get(key);
        if (pending !== undefined) return pending;
        const request = loadKind(root, path, key, at).finally(() => asking.delete(key));
        asking.set(key, request);
        return request;
    }

    /**
     * Read one file's head and hold what its bytes say, for the round the read belongs to. A head
     * the route refuses or a read that fails is held as what the name says, the download, so the
     * file view stops saying it is reading and draws the link.
     */
    async function loadKind(
        root: string,
        path: string,
        key: string,
        at: number
    ): Promise<FileType> {
        const named = typeOfFile(path);
        let found = named;
        try {
            const response = await fetch(fileBytesUrl(root, path));
            if (response.ok) {
                const held = await readCappedBytes(response, TEXT_SNIFF_READ);
                found = typeOfFile(path, held.bytes);
            }
        } catch {
            found = named;
        }
        if (current(at, root)) {
            rounds[`kind:${key}`] = at;
            kinds[key] = found;
        }
        return found;
    }

    /** The reader's own bookmarks, asked for once a round and held until the next one. */
    function bookmarks(): BookmarksState {
        const at = bookmarksRound();
        if (held.bookmarks === null || rounds[BOOKMARKS] !== at) {
            askShared(BOOKMARKS, at, () => loadBookmarks(at));
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
            if (at !== bookmarksRound()) return;
            if (!response.ok) {
                refused(BOOKMARKS, at);
                held.bookmarks = {
                    ...NO_BOOKMARKS,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            answered(BOOKMARKS, at);
            held.bookmarks = {
                entries: Array.isArray(body.entries) ? (body.entries as Entry[]) : [],
                schema: Array.isArray(body.schema) ? (body.schema as SchemaField[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (at !== bookmarksRound()) return;
            refused(BOOKMARKS, at);
            held.bookmarks = { ...NO_BOOKMARKS, error: reasonOf(error), loading: false };
            return;
        }
        closeGoneForms(held.bookmarks);
    }

    /**
     * Close the bookmark form of every file browser whose bookmark this answer no longer holds, and
     * forget what was typed into it, so no tab asks about text it has nothing to show for. A form
     * with a save of its own out is left until that answer lands.
     *
     * It is called for a read that answered and for no other: a read that failed knows of no
     * bookmark, and sweeping an empty list over a failed read would close every form on the page.
     */
    function closeGoneForms(marks: BookmarksState): void {
        for (const one of forms.browsers()) {
            const saving = forms.saving(one.id, one.forms.editing);
            if (!editedGone(one.forms, marks, saving)) continue;
            forms.shift(one.id, one.forms, editShown(one.forms, one.forms.editing));
        }
    }

    /** Every scratch note, asked for once a notes round and held until the next one. */
    function noteList(): NotesState {
        const at = clock.notes;
        if (held.notes === null || rounds[NOTES] !== at) askShared(NOTES, at, () => loadNotes(at));
        return held.notes ?? NO_NOTES;
    }

    async function loadNotes(at: number): Promise<void> {
        try {
            const response = await fetch(`${FS_PATH}?notes=1`);
            const body = (await response.json()) as { notes?: unknown; error?: unknown };
            if (!fresh(at, 'notes')) return;
            if (!response.ok) {
                refused(NOTES, at);
                held.notes = {
                    ...NO_NOTES,
                    error: typeof body.error === 'string' ? body.error : String(response.status),
                    loading: false
                };
                return;
            }
            answered(NOTES, at);
            held.notes = {
                notes: Array.isArray(body.notes) ? (body.notes as NoteRow[]) : [],
                error: '',
                loading: false
            };
        } catch (error) {
            if (!fresh(at, 'notes')) return;
            refused(NOTES, at);
            held.notes = { ...NO_NOTES, error: reasonOf(error), loading: false };
        }
    }

    /**
     * One note's own text, asked for once a notes round. A note that was deleted is not asked for.
     */
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
     * answer from the round before this one is dropped, so a listing fetched before a removal
     * cannot reappear after it.
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
     * Ask again for the listings and the texts held under one root, and for nothing under any
     * other. The version is whatever said the root had changed, the config channel's for the
     * engine's own folder; a version already refreshed at writes the same value and asks for
     * nothing again. The version never moves backwards: the round is the shared round plus this
     * one, and a lower value would let an older answer in over a newer one.
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

    /**
     * One collection write on the bookmarks file, which is /api/write rather than this endpoint.
     */
    async function bookmarkWrite(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields);
        if (answer.ok) invalidate();
        return answer;
    }

    return {
        listing,
        entries,
        heldEntries,
        readListing,
        relist,
        workspaces,
        fileText,
        readFileKind,
        heldFileKind,
        refresh,
        fileVersion,
        bump,
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
        retryWorkspaces: () => retry(WORKSPACES),
        retryBookmarks: () => retry(BOOKMARKS),
        retryNotes: () => retry(NOTES),
        shiftForms: forms.shift,
        saveNote,
        deleteNote,
        noteDeleted: (id: string) => gone.has(id),
        invalidate
    };
}
