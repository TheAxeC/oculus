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
// the mark is never held and a listing fetched before a removal cannot reappear after it.
//
// The disk is followed through the `files` channel, which is why no poller is needed:
// `afterReceive` below lists the folders a message names again (explorer/view/disk.ts maps the
// message onto the served roots), reads a whole root again for a message that names none, and
// everything again after a gap in the versions.
//
// A read of the workspaces, the bookmarks or the notes that ended in an error is held as the
// answer, with the sentence saying why, and a held answer is asked for once until it is marked:
// what keeps a page whose endpoint is down from sending a request per frame is that the error is
// the answer of the round. The view's own control marks it again, and so does mounting the view,
// which is the reader coming back to it.
//
// A bookmark added by hand or by another tool reaches an open page through the `files` message the
// watcher of the bookmarks file publishes, with no write from the page.
//
// One root alone is re-read by refresh(root, version), which the `files` channel's messages call:
// it marks the listings, texts and file kinds held under that root, so the page asks again for that
// root's listings and texts and for nothing under any other root. A refresh at a version already
// seen marks nothing.
//
// A folder can also be read awaited (readListing), which is how the Files view reads the folders on
// the way to a path it was asked to show; that read and a render's read of one folder are one.
//
// A folder is listed under a pair of toggles, whether hidden files and the files git ignores are
// asked for, and each pair is an answer of its own, held under its own key, since two file
// browsers may list one folder with two different pairs. A folder not yet answered under the pair
// asked for draws what another pair holds of it until its answer lands. relist() marks every
// folder held under one pair, which is what flipping a toggle does.
//
// The file text is read through the file route and stopped at the window's limit: the reader is
// cancelled once the limit is in, so a forty-megabyte file costs two megabytes of transfer and not
// forty. What a file opens as is read the same way and stops after the rule's window and the one
// byte it tells a cut by, and the answer is held until it is marked, so the tree, the tab it opens
// and a second click on the same row ask the server once.

import { TEXT_SNIFF_READ } from '../../data/helpers/files/text-kind.ts';
import { readAs } from '../../data/shapes/shapes.ts';
import type { EntitiesStore, WriteAnswer, WritesStore } from '../shared/stores/shapes.ts';
import type { Fetcher, Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';
import {
    heldListings,
    type HeldListing,
    NO_BOOKMARKS,
    NO_LISTING,
    NO_NOTE,
    NO_NOTES,
    NO_TEXT,
    noMachine,
    noWorkspaces,
    fileBytesUrl,
    FS_PATH,
    bookmarksShape,
    listingAnswer,
    listingForm,
    listingKey as keyOfListing,
    listingUrl,
    noteShape,
    notesShape,
    noteUrl,
    readAnswer,
    readCappedBytes,
    readText,
    type BookmarksState,
    type FileText,
    type Listing,
    type NoteState,
    type NotesState,
    type WorkspacesState,
    workspacesShape
} from './fs-transport.ts';
import { diskPlan } from './explorer/view/disk.ts';
import {
    SHOWN_DEFAULT,
    treeKey,
    typeOfFile,
    type FileType,
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
 * The collection key the write path resolves to the reader's own bookmarks file. A bookmark is
 * written through /api/write like any other collection entry, so the star, the row's rename and the
 * removal reach the file without knowing where it lives.
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

/** The pair of toggles that asks a folder for every entry it holds. */
const EVERYTHING: ListingShown = { hidden: true, ignored: true };

/** The status the file route answers for a file that is not there. */
const NOT_FOUND = 404;

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
     * awaits. With `fresh` a held answer is not taken: the folder is read from the server, which is
     * how a path is looked for before it is said to be missing.
     */
    readListing: (
        root: string,
        path: string,
        shown?: ListingShown,
        fresh?: boolean
    ) => Promise<Listing>;
    /**
     * Whether a file has been taken off the disk: its folder, listed with the hidden and the
     * ignored entries, answered without error and holds no entry of its name, or answered that the
     * folder is not there. A folder not yet answered says the file is still there.
     */
    gone: (root: string, path: string) => boolean;
    /** Ask again, on the next read of each, for every folder held under one pair of toggles. */
    relist: (shown: ListingShown) => void;
    /**
     * Ask again, on the next read, for one folder under every pair of toggles, and with `below` for
     * every folder held under it too: the folders a file operation changed.
     */
    relistFolder: (root: string, path: string, below?: boolean) => void;
    workspaces: () => WorkspacesState;
    /** The workspaces as the server holds them now: read again when they are stale. */
    workspacesNow: () => Promise<WorkspacesState>;
    /** The folders of the open workspace, which are the roots the file routes serve. */
    roots: () => FsRoot[];
    /** The name of the open workspace's primary hub, or null when it names none. */
    primary: () => string | null;
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
    /** Add a folder to the open workspace: its file's `folders:` list, or the unsaved state. */
    addRoot: (dir: string) => Promise<WriteAnswer>;
    /** Take the folder of that name out of the open workspace. */
    removeRoot: (key: string) => Promise<WriteAnswer>;
    /**
     * Put the folders in the order the names give. The workspace is read again after the answer,
     * whatever it was, so a refused order is drawn as the server holds it.
     */
    orderRoots: (keys: string[]) => Promise<WriteAnswer>;
    /** Put the notes in the order the ids name, newest first for any a list leaves out. */
    orderNotes: (ids: string[]) => Promise<WriteAnswer>;
    /**
     * Save the open workspace as `.oculus/workspaces/<name>.yml` of the primary hub (or the first).
     */
    saveWorkspace: (name: string) => Promise<WriteAnswer>;
    /**
     * Make `.oculus/workspaces/<name>.yml` with no folder in the primary hub (or the first) and
     * open it.
     */
    newWorkspace: (name: string) => Promise<WriteAnswer>;
    /** Open the workspace file at that path. */
    selectWorkspace: (path: string) => Promise<WriteAnswer>;
    /** Leave the open workspace file for the unsaved workspace with no folder. */
    closeWorkspace: () => Promise<WriteAnswer>;
    /** Add one bookmark through the collection write path, and ask for them again. */
    addBookmark: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    /** Take one bookmark out, by the label it is found by. */
    removeBookmark: (label: string) => Promise<WriteAnswer>;
    /** Give one bookmark another label, by the label it is found by, and ask for them again. */
    renameBookmark: (id: string, label: string) => Promise<WriteAnswer>;
    /**
     * Say that the bookmarks were written by something else, such as a move of the file they name.
     */
    bookmarksChanged: () => void;
    /** Ask for the workspaces again after a read that failed, for the control that offers it. */
    retryWorkspaces: () => void;
    /** Ask for the bookmarks again after a read that failed. */
    retryBookmarks: () => void;
    /** Ask for the notes again after a read that failed. */
    retryNotes: () => void;
    saveNote: (id: string, title: string, body: string) => Promise<WriteAnswer>;
    deleteNote: (id: string) => Promise<WriteAnswer>;
    /** Whether this page deleted that note, so nothing tries to write it back. */
    noteDeleted: (id: string) => boolean;
    /** Ask for every held answer again, keeping what is held drawn until the new one lands. */
    invalidate: () => void;
};

export function createFs(
    writes: WritesStore,
    entities: EntitiesStore,
    queries: Queries,
    carry: (identity: string) => void = () => undefined
): FsStore {
    /**
     * The notes this page deleted. A deleted note is never asked for again and never written again,
     * which is what keeps a wait that was still running from putting one back on the disk.
     */
    const deleted = new Set<string>();

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
     * What a `files` or a `config` message says about the disk. Each message is heard as it is
     * kept, since the next write replaces it before anything reads. `bookmarks` marks the
     * bookmarks; `workspaces` and every `config` message (a root added to or taken out of
     * sources.yml) mark the workspaces and the bookmarks. The folders a message names are listed
     * again with the texts and kinds of the files in them; a message naming none reads each served
     * root it concerns again, every root after a gap in the versions (messages merged or missed).
     */
    let heard: number | null = null;
    entities.afterReceive((message) => {
        if (message.channel === 'config') {
            queries.mark(WORKSPACES, 'replace');
            queries.mark(BOOKMARKS, 'replace');
            return;
        }
        if (message.channel !== 'files' || (heard !== null && message.version <= heard)) return;
        const gap = heard !== null && message.version !== heard + 1;
        heard = message.version;
        const payload = entities.payloadOf(message, 'files');
        if (gap) {
            queries.mark(WORKSPACES, 'replace');
            queries.mark(BOOKMARKS, 'replace');
            for (const one of heldRoots()) refresh(one.key, message.version);
        }
        if (payload === null) return;
        if (payload.workspaces === true) queries.mark(WORKSPACES, 'replace');
        if (payload.bookmarks === true || payload.workspaces === true) {
            queries.mark(BOOKMARKS, 'replace');
        }
        const plan = diskPlan(payload, heldRoots());
        for (const key of plan.roots) refresh(key, message.version);
        for (const folder of plan.folders) relistFiles(folder.root, folder.path);
    });

    /** The roots of the workspace as far as they have been read; asks the server for nothing. */
    function heldRoots(): FsRoot[] {
        const held = queries.peek<WorkspacesState>(WORKSPACES).data;
        return held === undefined ? [] : held.folders;
    }

    /**
     * List one folder again, and with it the text and the kind of each file held in it, since a
     * file written in a folder is what a message naming the folder says.
     */
    function relistFiles(root: string, path: string): void {
        relistFolder(root, path);
        for (const kind of ['text', 'kind']) {
            for (const one of queries.entries(['fs', kind, root])) {
                const at = one.key[3];
                if (typeof at !== 'string') continue;
                const file = at.slice(root.length + 1);
                const slash = file.lastIndexOf('/');
                if ((slash < 0 ? '' : file.slice(0, slash)) === path)
                    queries.mark(one.key, 'replace');
            }
        }
    }

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

    const peekListing = (key: string[]): HeldListing => queries.peek<Listing>(key);

    /** What any pair of toggles holds of one folder, for a pair whose answer has not landed. */
    function otherForm(root: string, path: string): Listing | undefined {
        return heldListings(peekListing, root, path).find((one) => one.data !== undefined)?.data;
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
     * One directory, awaited. A folder held and not marked is answered as held (unless `fresh` asks
     * for the server's); otherwise the request is made or joined, and its answer is what comes back
     * even when the key is marked meanwhile and the store did not keep it. Where there is no page
     * nothing is asked, and the answer says so.
     */
    async function readListing(
        root: string,
        path: string,
        shown = SHOWN_DEFAULT,
        fresh = false
    ): Promise<Listing> {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = listingQuery(root, path, shown);
        const found = queries.peek<Listing>(key);
        if (!fresh && found.data !== undefined && !found.stale) return found.data;
        if (!inBrowser()) return { entries: [], error: t('files.read_offline'), loading: false };
        return queries.fetch(key, listingFetcher(root, path, shown));
    }

    /**
     * Whether one file is off the disk. A listing of its folder that is held in any form, current,
     * and names the file answers no and asks nothing; any other folder is read with everything
     * shown, the one listing that holds a hidden or an ignored file.
     */
    function gone(root: string, path: string): boolean {
        if (root === '' || path === '') return false;
        const at = path.lastIndexOf('/');
        const folder = at < 0 ? '' : path.slice(0, at);
        const name = path.slice(at + 1);
        const named = (one: HeldListing): boolean =>
            !one.stale && one.data?.error === '' && one.data.entries.some((e) => e.name === name);
        if (heldListings(peekListing, root, folder).some(named)) return false;
        const found = listing(root, folder, EVERYTHING);
        if (found.loading) return false;
        if (found.error === t('files.refused_missing')) return true;
        return found.error === '' && !found.entries.some((one) => one.name === name);
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
        return data ?? noWorkspaces();
    }

    async function workspacesNow(): Promise<WorkspacesState> {
        const found = queries.peek<WorkspacesState>(WORKSPACES);
        if (found.data !== undefined && !found.stale && !found.data.loading) return found.data;
        return inBrowser() ? queries.fetch(WORKSPACES, readWorkspaces) : noWorkspaces();
    }

    /** The folders of the open workspace, which are none while the workspace is being read. */
    function roots(): FsRoot[] {
        return workspaces().folders;
    }

    function primary(): string | null {
        return workspaces().primary;
    }

    async function readWorkspaces(): Promise<WorkspacesState> {
        try {
            const answer = await readAnswer(await fetch(FS_PATH));
            if (!answer.ok) return { ...noWorkspaces(), error: answer.error, loading: false };
            const body = readAs(workspacesShape, answer.body);
            return {
                home: body?.home ?? '',
                open: body?.open ?? null,
                folders: body?.folders ?? [],
                primary: body?.primary ?? null,
                engine: body?.engine ?? null,
                recent: body?.recent ?? [],
                available: body?.available ?? [],
                machine: body?.machine ?? noMachine(),
                error: '',
                loading: false
            };
        } catch (error) {
            return { ...noWorkspaces(), error: reasonOf(error), loading: false };
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

    async function readBookmarks(): Promise<BookmarksState> {
        try {
            const read = await readAnswer(await fetch(`${FS_PATH}?bookmarks=1`));
            if (!read.ok) return { ...NO_BOOKMARKS, error: read.error, loading: false };
            const body = readAs(bookmarksShape, read.body);
            return { entries: body?.entries ?? [], error: '', loading: false };
        } catch (error) {
            return { ...NO_BOOKMARKS, error: reasonOf(error), loading: false };
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
            enabled: inBrowser() && !deleted.has(id)
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
     * under any other. The version is that of the `files` message that said the root had changed
     * (this store's own `afterReceive` is its caller); a version already refreshed at marks
     * nothing.
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

    /**
     * Save As. The file it made is handed to `carry` before the workspaces are asked for again, so
     * the arrangement shown is saved for the file before the workspace answer names it.
     */
    async function saveAs(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields, FS_PATH);
        if (answer.ok) {
            if (answer.file !== undefined) carry(answer.file);
            invalidate();
        }
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
        if (deleted.has(id)) {
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
        if (answer.ok) deleted.add(id);
        return answer;
    }

    /** One write on the open workspace's folders, which marks everything held as a save does. */
    async function rootsWrite(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send({ kind: 'roots', ...fields });
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
        gone,
        relist,
        relistFolder,
        workspaces,
        workspacesNow,
        roots,
        primary,
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
        addRoot: (dir: string) => rootsWrite({ action: 'add', dir }),
        removeRoot: (key: string) => rootsWrite({ action: 'remove', key }),
        orderRoots: async (keys: string[]) => {
            const answer = await rootsWrite({ action: 'order', keys });
            queries.mark(WORKSPACES, 'replace');
            return answer;
        },
        orderNotes: (ids: string[]) => noteAct({ action: 'order-notes', ids }),
        saveWorkspace: (name: string) => saveAs({ action: 'save-workspace', name }),
        newWorkspace: (name: string) => act({ action: 'new-workspace', name }),
        selectWorkspace: (path: string) => act({ action: 'select-workspace', path }),
        closeWorkspace: () => act({ action: 'close-workspace' }),
        addBookmark: (fields: Record<string, unknown>) =>
            bookmarkWrite({ kind: 'new-entry', collection: BOOKMARK_COLLECTION, fields }),
        removeBookmark: (label: string) =>
            bookmarkWrite({ kind: 'delete-entry', collection: BOOKMARK_COLLECTION, id: label }),
        renameBookmark: async (id: string, label: string) => {
            const answer = await writes.writeEntry(BOOKMARK_COLLECTION, id, { label });
            if (answer.ok) invalidate();
            return answer;
        },
        bookmarksChanged: invalidate,
        retryWorkspaces: () => retry(WORKSPACES),
        retryBookmarks: () => retry(BOOKMARKS),
        retryNotes: () => retry(NOTES),
        saveNote,
        deleteNote,
        noteDeleted: (id: string) => deleted.has(id),
        invalidate
    };
}
