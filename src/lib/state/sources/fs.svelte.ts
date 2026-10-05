// Layer 2, client state. What the file browser fetched: one directory's entries, the workspaces,
// one file's text, the reader's own bookmarks and their scratch notes, and the history of one file
// (fs-history.ts): the copies the server kept before its saves and the commits that touched it.
//
// It is state/system/docs.svelte.ts's shape over the reads this endpoint offers, and for the same
// reason: none of them is in the snapshot, so the first call asks the server and every later call
// reads what is held. Every answer is held in the client state's query client, under a key that
// opens with `fs` and the kind of the answer, and state/client/queries.svelte.ts schedules
// the request on a microtask rather than running it inside the call, so reading this from a
// $derived never writes state while a derived is running.
//
// Nothing polls. A write marks everything held, which is what makes the next render of a shown tab
// ask again, and a hidden tab ask once when it is shown; a bookmark is written through /api/write
// rather than here, since it is a collection entry, so that write marks everything too. What is
// held stays drawn until the fresh answer lands, so a tree does not blink out on every add or
// removal, and a request still out when its key is marked is cancelled, so an answer from before
// the mark is never held and a listing fetched before a removal cannot reappear after it. A folder
// whose contents changed on disk is re-read by closing it and opening it, since a poller over an
// open tree would read the disk for a reader who is looking at one line of it.
//
// A read of the workspaces, the bookmarks or the notes that ended in an error is held as the
// answer, with the sentence saying why, and a held answer is asked for once until it is marked:
// what keeps a page whose endpoint is down from sending a request per frame is that the error is
// the answer of the round. The view's own control marks it again, and so does mounting the view,
// which is the reader coming back to it.
//
// The bookmarks file is also read again when it changes on the disk. The `files` channel carries a
// message for it, published by the watcher over ~/.oculus, and that message marks the bookmarks: a
// bookmark added by hand or by another tool reaches an open page without a write from it.
//
// One root alone is re-read by refresh(root, version): it marks the listings, texts and file kinds
// held under that root, so a view watching a channel (the Settings view watching the config one)
// asks again for that root's listings and texts and for nothing under any other root. A refresh at
// a version already seen marks nothing.
//
// A folder can also be read awaited (readListing), which is how the Files view reads the folders on
// the way to a path it was asked to show, one after the other; that read and a render's read of the
// same folder are one request.
//
// A folder is listed under a pair of toggles, whether hidden files and the files git ignores are
// asked for, and each pair is an answer of its own, held under its own key, since two file
// browsers may list one folder with two different pairs. A folder not yet answered under the pair
// asked for draws what another pair holds of it until its answer lands. relist() marks every
// folder held under one pair, which is what flipping a toggle does.
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
// byte it tells a cut by, and the answer is held until it is marked, so the tree, the tab it opens
// and a second click on the same row ask the server once.

import { z } from 'zod';
import type { SchemaField } from '../../data/model/index.ts';
import { TEXT_SNIFF_READ } from '../../data/helpers/files/text-kind.ts';
import {
    anyNumberShape,
    mapShape,
    readAs,
    survivorsShape,
    unchanged
} from '../../data/shapes/shapes.ts';
import type { EntitiesStore, WriteAnswer, WritesStore } from '../shared/stores/shapes.ts';
import type { Fetcher, Fetching, Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';
import {
    LISTING_FORMS,
    NO_BOOKMARKS,
    NO_LISTING,
    NO_NOTE,
    NO_NOTES,
    NO_TEXT,
    NO_WORKSPACES,
    currentWorkspace,
    fileBytesUrl,
    FS_PATH,
    listingAnswer,
    listingForm,
    listingKey as keyOfListing,
    listingUrl,
    noteUrl,
    readAnswer,
    readCappedBytes,
    readText,
    type BookmarkEntry,
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
import {
    createFileHistory,
    reasonOf,
    type CommitPage,
    type FileCommits,
    type FileCopies
} from './fs-history.ts';

export { fileBytesUrl, FS_PATH, listingUrl, readCapped } from './fs-transport.ts';
export type {
    BookmarkEntry,
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

/** The query keys the three whole-file answers are held under. */
const WORKSPACES = ['fs', 'workspaces'];

const BOOKMARKS = ['fs', 'bookmarks'];

const NOTES = ['fs', 'notes'];

/** What every key of this store opens with, and the marks the kinds of answer are found by. */
const ALL = ['fs'];

const NOTE = ['fs', 'note'];

/** The status the file route answers for a file that is not there. */
const NOT_FOUND = 404;

/** One root of a workspace, and one workspace, answered as the endpoint sent them. */
const fsRootShape = z.object({ key: z.string(), dir: z.string(), fixed: z.boolean() });

const workspaceShape = unchanged(
    z.object({ name: z.string(), roots: z.array(fsRootShape) })
) satisfies z.ZodType<{ name: string; roots: FsRoot[] }>;

/** The workspaces answer: the current one's name, every workspace, the keys the server dropped. */
const workspacesShape = z.object({
    home: z.string().catch(''),
    current: z.string().catch(''),
    workspaces: survivorsShape(workspaceShape).catch([]),
    dropped: survivorsShape(z.string()).catch([])
});

/** One bookmark, answered as the endpoint sent it. */
const bookmarkShape = unchanged(
    z.object({
        id: z.string(),
        title: z.string(),
        fields: mapShape,
        file: z.string(),
        index: anyNumberShape,
        kind: z.enum(['file', 'folder', 'missing']).optional().catch(undefined)
    })
) satisfies z.ZodType<BookmarkEntry>;

/** One field of the bookmarks file's own schema, answered as the endpoint sent it. */
const schemaFieldShape = unchanged(
    z.object({
        field: z.string(),
        type: z.string(),
        label: z.string().optional(),
        options: z.array(z.string()).optional(),
        optionsFrom: z.string().optional(),
        required: z.boolean().optional(),
        help: z.string().optional()
    })
) satisfies z.ZodType<SchemaField>;

/** The bookmarks answer: the well-formed entries and the well-formed fields of the schema. */
const bookmarksShape = z.object({
    entries: survivorsShape(bookmarkShape).catch([]),
    schema: survivorsShape(schemaFieldShape).catch([])
});

/** One note of the list, answered as the endpoint sent it. */
const noteRowShape = unchanged(
    z.object({ id: z.string(), title: z.string(), modified: anyNumberShape })
) satisfies z.ZodType<NoteRow>;

/** The notes answer: the well-formed notes. */
const notesShape = z.object({ notes: survivorsShape(noteRowShape).catch([]) });

/** One note's own answer: its title, its text and when it was written. */
const noteShape = z.object({
    title: z.string().catch(''),
    body: z.string().catch(''),
    modified: anyNumberShape.catch(0)
});

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
    /**
     * Ask again, on the next read, for one folder under every pair of toggles, and with `below` for
     * every folder held under it too: the folders a file operation changed.
     */
    relistFolder: (root: string, path: string, below?: boolean) => void;
    workspaces: () => WorkspacesState;
    /** The roots of the workspace the saved state names as current. */
    roots: () => FsRoot[];
    fileText: (root: string, path: string) => FileText;
    markText: (root: string, path: string) => void;
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
    /**
     * The copies the local history holds of one file, newest first. They are read again when a
     * `files` message says something under the file's root was written, and a read for another
     * file never replaces this one's, so the Timeline draws the file it is on and an answer for
     * the one before is not shown.
     */
    copies: (root: string, path: string) => FileCopies;
    /**
     * The first page of the commits that touched one file of a repository, newest first. `head`
     * names the commit and branch the repository is at, so a commit, a checkout or a pull reads
     * the first page again.
     */
    commits: (repository: string, path: string, head: string) => FileCommits;
    /** One page of those commits: the rows that follow a commit in the history of `path`. */
    commitPage: (repository: string, path: string, before: string) => Promise<CommitPage>;
    /**
     * Read the copies and the first page of the commits of one file again; the file is named as
     * the file browser names it (`root`, `path`) and as its repository does (`repository`,
     * `shown`).
     */
    refreshFile: (root: string, path: string, repository: string, shown: string) => void;
    /** The text of one copy of a file, or null when the server does not hold it. */
    copyText: (root: string, path: string, id: string) => Promise<string | null>;
    /** The reader's own bookmarks, asked for once a round like the workspaces. */
    bookmarks: () => BookmarksState;
    /**
     * The same bookmarks once they are answered: what is held for the round, or the answer of the
     * one request made for them. A caller that has to rewrite the bookmarks awaits it.
     */
    bookmarksNow: () => Promise<BookmarksState>;
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
    entities: EntitiesStore,
    queries: Queries
): FsStore {
    /**
     * The notes this page deleted. A deleted note is never asked for again and never written again,
     * which is what keeps a wait that was still running from putting one back on the disk.
     */
    const gone = new Set<string>();

    /** The version one root was last refreshed at, by root key. */
    const refreshed = new Map<string, number>();

    /**
     * How many times each file has been said to have been written, by root and path. A rune because
     * the address a view draws a file at is derived from it, so a bump has to redraw that view.
     */
    const written: Record<string, number | undefined> = $state({});

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

    /** Ask again for one of the three whole-file reads after a read of it failed. */
    function retry(key: string[]): void {
        const found = queries.peek<{ error: string }>(key).data;
        if (found !== undefined && found.error !== '') queries.mark(key, 'drop');
    }

    /**
     * How far the disk has moved the bookmarks on: the version of the newest `files` message that
     * named the bookmarks file. The channel holds one message, and on a busy hub the next write
     * under a root replaces that one before anything reads the bookmarks, so every message is heard
     * as it is kept rather than the channel read when the menu opens. A newer one marks the
     * bookmarks, and a request still out for them is cancelled.
     */
    let onDisk = 0;
    entities.afterReceive((message) => {
        const named = entities.payloadOf(message, 'files')?.bookmarks;
        if (named !== true || message.version <= onDisk) return;
        onDisk = message.version;
        queries.mark(BOOKMARKS, 'replace');
    });

    /** The query key of one folder under one pair of toggles. */
    function listingQuery(root: string, path: string, shown: ListingShown): string[] {
        return ['fs', 'listing', root, keyOfListing(treeKey(root, path), shown)];
    }

    /**
     * One directory. The first call for a folder asks the server; later calls read what is held.
     * A folder not yet answered under this pair of toggles draws another pair's answer meanwhile.
     */
    function listing(root: string, path: string, shown = SHOWN_DEFAULT): Listing {
        if (root === '') return { entries: [], error: '', loading: false };
        const { data } = queries.read(
            listingQuery(root, path, shown),
            listingFetcher(root, path, shown),
            {
                enabled: inBrowser()
            }
        );
        return data ?? otherForm(root, path) ?? NO_LISTING;
    }

    /** What any pair of toggles holds of one folder, for a pair whose answer has not landed. */
    function otherForm(root: string, path: string): Listing | undefined {
        for (const form of LISTING_FORMS) {
            const key = ['fs', 'listing', root, `${form}${treeKey(root, path)}`];
            const held = queries.peek<Listing>(key).data;
            if (held !== undefined) return held;
        }
        return undefined;
    }

    function relist(shown: ListingShown): void {
        const form = listingForm(shown);
        // A folder still on its first answer has nothing to mark: its request is the fresh read.
        for (const one of queries.entries<Listing>(['fs', 'listing'])) {
            const at = one.key[3];
            if (one.data !== undefined && typeof at === 'string' && at.startsWith(form)) {
                queries.mark(one.key, 'drop');
            }
        }
    }

    function relistFolder(root: string, path: string, below = false): void {
        const own = treeKey(root, path);
        for (const one of queries.entries<Listing>(['fs', 'listing', root])) {
            const at = one.key[3];
            if (one.data === undefined || typeof at !== 'string') continue;
            const folder = at.slice(at.indexOf('|') + 1);
            if (folder === own || (below && folder.startsWith(`${own}/`))) {
                queries.mark(one.key, 'replace');
            }
        }
    }

    function listingFetcher(root: string, path: string, shown: ListingShown): Fetcher<Listing> {
        return () => listingAnswer(listingUrl(root, path, shown));
    }

    /**
     * One directory, awaited. A folder held and not marked is answered as held; otherwise the
     * request is made or joined, and its answer is what comes back even when the key is marked
     * meanwhile and the store did not keep it. Where there is no page nothing is asked, and the
     * answer says so.
     */
    async function readListing(
        root: string,
        path: string,
        shown = SHOWN_DEFAULT
    ): Promise<Listing> {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = listingQuery(root, path, shown);
        const found = queries.peek<Listing>(key);
        if (found.data !== undefined && !found.stale) return found.data;
        if (!inBrowser()) return { entries: [], error: t('files.read_offline'), loading: false };
        return queries.fetch(key, listingFetcher(root, path, shown));
    }

    /** The entries of one folder, which is what the tree walks. */
    function entries(root: string, path: string, shown = SHOWN_DEFAULT): FsEntry[] {
        return listing(root, path, shown).entries;
    }

    function heldEntries(root: string, path: string, shown = SHOWN_DEFAULT): FsEntry[] | null {
        return queries.peek<Listing>(listingQuery(root, path, shown)).data?.entries ?? null;
    }

    /** The workspaces, asked for once and held until they are marked. */
    function workspaces(): WorkspacesState {
        const { data } = queries.read(WORKSPACES, readWorkspaces, { enabled: inBrowser() });
        return data ?? NO_WORKSPACES;
    }

    /** The roots of the current workspace, which are none while the workspaces are being read. */
    function roots(): FsRoot[] {
        return currentWorkspace(workspaces()).roots;
    }

    async function readWorkspaces(): Promise<WorkspacesState> {
        try {
            const answer = await readAnswer(await fetch(FS_PATH));
            if (!answer.ok) return { ...NO_WORKSPACES, error: answer.error, loading: false };
            const body = readAs(workspacesShape, answer.body);
            return {
                home: body?.home ?? '',
                current: body?.current ?? '',
                workspaces: body?.workspaces ?? [],
                dropped: body?.dropped ?? [],
                error: '',
                loading: false
            };
        } catch (error) {
            return { ...NO_WORKSPACES, error: reasonOf(error), loading: false };
        }
    }

    /** One file's text, read through the file route and stopped at the window's limit. */
    function fileText(root: string, path: string): FileText {
        if (root === '' || path === '') return { ...NO_TEXT, loading: false };
        const { data } = queries.read(
            ['fs', 'text', root, treeKey(root, path)],
            () => readText(root, path),
            { enabled: inBrowser() }
        );
        return data ?? NO_TEXT;
    }

    /** Ask again, on the next read, for one file's text: a save in a source tab changed it. */
    function markText(root: string, path: string): void {
        queries.mark(['fs', 'text', root, treeKey(root, path)], 'replace');
    }

    /** The query key of what one file opens as. */
    function kindKey(root: string, path: string): string[] {
        return ['fs', 'kind', root, treeKey(root, path)];
    }

    /**
     * What one file opens as, as far as it is already known: the name's answer for a format the
     * browser draws, the answer held and not marked for anything else, and null for a file whose
     * bytes have not been read yet. It is what a view draws by while readFileKind is running.
     */
    function heldFileKind(root: string, path: string): FileType | null {
        const named = typeOfFile(path);
        if (named.kind !== 'other') return named;
        const found = queries.peek<FileType>(kindKey(root, path));
        return found.stale ? null : (found.data ?? null);
    }

    /**
     * What one file opens as. A name that names a format the browser draws is answered without a
     * request; anything else is decided by the head of the file, and a file that cannot be read at
     * all is a download, which is what the file view draws for it. A file the route says is not
     * there is `missing`, which the file browser opens in the source tab so the tab says it cannot
     * be opened.
     *
     * The answer is held until it is marked, and the asks made while one read is in flight are that
     * one read: a double click opens a row three times and the tab it opens asks once more, which
     * is one request between them and none at all on the next click. A `missing` answer is not
     * held, so the next ask reads the file again and finds what it is once it is back.
     */
    async function readFileKind(root: string, path: string): Promise<FileType> {
        const named = typeOfFile(path);
        if (named.kind !== 'other') return named;
        const remembered = heldFileKind(root, path);
        if (remembered !== null) return remembered;
        const key = kindKey(root, path);
        const found = await queries.fetch(key, () => readKind(root, path));
        if (found.kind === 'missing') queries.forget(key);
        return found;
    }

    /**
     * Read one file's head and answer what its bytes say. A 404 answers `missing`; any other head
     * the route refuses, and a read that fails, is answered as what the name says, the download, so
     * the file view stops saying it is reading and draws the link.
     */
    async function readKind(root: string, path: string): Promise<FileType> {
        const named = typeOfFile(path);
        try {
            const response = await fetch(fileBytesUrl(root, path));
            if (response.status === NOT_FOUND) return { kind: 'missing' };
            if (!response.ok) return named;
            const head = await readCappedBytes(response, TEXT_SNIFF_READ);
            return typeOfFile(path, head.bytes);
        } catch {
            return named;
        }
    }

    const history = createFileHistory(queries, entities, roots);

    /** The reader's own bookmarks, asked for once and held until they are marked. */
    function bookmarks(): BookmarksState {
        const { data } = queries.read(BOOKMARKS, readBookmarks, { enabled: inBrowser() });
        return data ?? NO_BOOKMARKS;
    }

    async function bookmarksNow(): Promise<BookmarksState> {
        const found = queries.peek<BookmarksState>(BOOKMARKS);
        if (found.data !== undefined && !found.stale && !found.data.loading) return found.data;
        if (!inBrowser()) return NO_BOOKMARKS;
        return queries.fetch(BOOKMARKS, readBookmarks);
    }

    async function readBookmarks(_held: unknown, fetching: Fetching): Promise<BookmarksState> {
        let answer: BookmarksState;
        try {
            const read = await readAnswer(await fetch(`${FS_PATH}?bookmarks=1`));
            if (!read.ok) return { ...NO_BOOKMARKS, error: read.error, loading: false };
            const body = readAs(bookmarksShape, read.body);
            answer = {
                entries: body?.entries ?? [],
                schema: body?.schema ?? [],
                error: '',
                loading: false
            };
        } catch (error) {
            return { ...NO_BOOKMARKS, error: reasonOf(error), loading: false };
        }
        if (!fetching.signal.aborted) closeGoneForms(answer);
        return answer;
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

    /** Every scratch note, asked for once and held until the notes are marked. */
    function noteList(): NotesState {
        const { data } = queries.read(NOTES, readNotes, { enabled: inBrowser() });
        return data ?? NO_NOTES;
    }

    async function readNotes(): Promise<NotesState> {
        try {
            const answer = await readAnswer(await fetch(`${FS_PATH}?notes=1`));
            if (!answer.ok) return { ...NO_NOTES, error: answer.error, loading: false };
            return {
                notes: readAs(notesShape, answer.body)?.notes ?? [],
                error: '',
                loading: false
            };
        } catch (error) {
            return { ...NO_NOTES, error: reasonOf(error), loading: false };
        }
    }

    /**
     * One note's own text, asked for once and held until the notes are marked. A note that was
     * deleted is not asked for.
     */
    function note(id: string): NoteState {
        if (id === '') return { ...NO_NOTE, loading: false };
        const { data } = queries.read([...NOTE, id], () => readNote(id), {
            enabled: inBrowser() && !gone.has(id)
        });
        return data ?? NO_NOTE;
    }

    async function readNote(id: string): Promise<NoteState> {
        try {
            const answer = await readAnswer(await fetch(noteUrl(id)));
            if (!answer.ok) return { ...NO_NOTE, id, error: answer.error, loading: false };
            const body = readAs(noteShape, answer.body);
            return {
                id,
                title: body?.title ?? '',
                body: body?.body ?? '',
                modified: body?.modified ?? 0,
                error: '',
                loading: false
            };
        } catch (error) {
            return { ...NO_NOTE, id, error: reasonOf(error), loading: false };
        }
    }

    /**
     * Ask the server again for everything held: the workspaces, the bookmarks, every listing, every
     * file text and the notes. What is held keeps being drawn until each new answer lands, and a
     * request still out is cancelled, so a listing fetched before a removal cannot reappear after
     * it.
     */
    function invalidate(): void {
        queries.mark(ALL, 'replace');
    }

    /** Ask the server again for the notes and for each note, and for nothing else. */
    function notesChanged(): void {
        queries.mark(NOTES, 'replace');
        queries.mark(NOTE, 'replace');
    }

    /**
     * Ask again for the listings, the texts and the file kinds held under one root, and for nothing
     * under any other. The version is whatever said the root had changed, the config channel's for
     * the engine's own folder; a version already refreshed at marks nothing.
     */
    function refresh(root: string, version: number): void {
        if (root === '' || refreshed.get(root) === version) return;
        refreshed.set(root, version);
        for (const kind of ['listing', 'text', 'kind']) queries.mark(['fs', kind, root], 'replace');
    }

    /** One workspace action, behind the same token every other write carries. */
    async function act(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields, FS_PATH);
        if (answer.ok) invalidate();
        return answer;
    }

    /** One note action. It marks the notes and leaves every other held answer where it is. */
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
            const saved: NoteState = {
                id,
                title,
                body,
                modified: Date.now(),
                error: '',
                loading: false
            };
            queries.hold([...NOTE, id], saved);
            queries.mark([...NOTE, id], 'drop');
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
     * Whether the workspace in force is the default one, whose folders are the `roots:` list of
     * config/sources.yml and are edited by the `roots` write rather than in the workspaces file.
     */
    function inDefault(): boolean {
        return (queries.peek<WorkspacesState>(WORKSPACES).data?.current ?? '') === '';
    }

    /** One write on the default workspace's folders, which marks everything held as a save does. */
    async function rootsWrite(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields);
        if (answer.ok) invalidate();
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
        relistFolder,
        workspaces,
        roots,
        fileText,
        markText,
        readFileKind,
        heldFileKind,
        refresh,
        fileVersion,
        bump,
        copies: history.copies,
        commits: history.commits,
        commitPage: history.commitPage,
        refreshFile: history.refreshFile,
        copyText: history.copyText,
        bookmarks,
        bookmarksNow,
        notes: noteList,
        note,
        addRoot: (dir: string) =>
            inDefault()
                ? rootsWrite({ kind: 'roots', action: 'add', dir })
                : act({ action: 'add-root', dir }),
        removeRoot: (key: string) =>
            inDefault()
                ? rootsWrite({ kind: 'roots', action: 'remove', key })
                : act({ action: 'remove-root', key }),
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
