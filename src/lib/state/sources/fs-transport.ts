// Layer 2, client state. The file browser's request addresses, the shapes its answers are held in,
// the lookups the views make over what those shapes hold (the current workspace, a bookmark, the
// open folders that failed to list) and bounded response reads, kept apart from the store because
// they depend only on the wire and the response stream.

import { z } from 'zod';
import type { OpsRefusal } from '../../data/file-ops.ts';
import type { Entry, HubNotes, NoteEntry } from '../../data/model/index.ts';
import { OCULUS_CONFIG_ROOT, fileBytesUrl } from '../../data/helpers/files/address.ts';
import type { BookmarkKind } from './explorer/view/bookmark-rows.ts';
import {
    anyNumberShape,
    mapShape,
    readAs,
    readJson,
    rowsShape,
    survivorsShape,
    unchanged
} from '../../data/shapes/shapes.ts';
import { answerRefusal, failedAnswer, refusedAnswer } from '../shared/answers/answers.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import {
    SHOWN_DEFAULT,
    TEXT_LIMIT,
    treeKey,
    type FsEntry,
    type FsRoot,
    type ListingShown,
    type TreeRow
} from './fs.ts';

/** One directory as the tree reads it. */
export type Listing = {
    entries: FsEntry[];
    /** What the request failed with, or the empty string. */
    error: string;
    /** The refusal word the server answered the request with, when it named one. */
    refused?: OpsRefusal;
    /** True while the first answer for the folder is still to come. */
    loading: boolean;
};

/** One workspace file the switcher offers, and where it lies. */
export type WorkspaceFile = { path: string; name: string; hub: string };

/**
 * The open workspace file, with `real`: its path with every link resolved, which is what names the
 * workspace to the arrangement saved for it.
 */
type OpenWorkspaceFile = WorkspaceFile & { real: string };

/** One recent workspace: the file, and whether it is gone from the disk. */
export type RecentWorkspace = WorkspaceFile & { missing: boolean };

/** What the server sent of the machine's `local.yml` files, for the Settings machine rows. */
export type WorkspaceMachine = {
    set: string[];
    defaults: Record<string, string>;
    values: Record<string, string>;
    hubs: Record<string, string[]>;
};

/** The machine's files before the server has answered, or when it sent nothing readable. */
export function noMachine(): WorkspaceMachine {
    return { set: [], defaults: {}, values: {}, hubs: {} };
}

/**
 * The open workspace as the toolbar reads it: the file it is held in (null while it is unsaved),
 * its folders under their names, the primary's name (null when the file names none), the recent
 * files and every file the open workspace's hubs hold.
 */
export type WorkspacesState = {
    /** The server account's home folder, which a path under it is written `~` from; else empty. */
    home: string;
    open: OpenWorkspaceFile | null;
    folders: FsRoot[];
    primary: string | null;
    /** Where oculus's own `config/` folder lies among the folders, or null when none holds it. */
    engine: { root: string; path: string } | null;
    recent: RecentWorkspace[];
    available: WorkspaceFile[];
    /**
     * The keys the primary's `local.yml` sets, by name, the default text of each key, the text of
     * the value in force of each key (a line for each row of a joined list), and the hubs whose
     * files set each joined list.
     */
    machine: WorkspaceMachine;
    error: string;
    loading: boolean;
};

/**
 * One bookmark as the Files view reads it: the entry, and what its path is under its root, which
 * the server answers from a stat of it.
 */
export type BookmarkEntry = Entry & { kind?: BookmarkKind };

/** The reader's own bookmarks as the rail and the Files view read them. */
export type BookmarksState = {
    entries: BookmarkEntry[];
    error: string;
    loading: boolean;
};

/** The notes of every hub as the Files view reads them, one answer per hub. */
export type NotesState = { hubs: HubNotes[]; error: string; loading: boolean };

/** One file's text as the code window reads it. */
export type FileText = {
    text: string;
    /** True when the file is longer than the window draws and the text is its first part. */
    truncated: boolean;
    error: string;
    loading: boolean;
};

export const NO_LISTING: Listing = { entries: [], error: '', loading: true };

/** The folders of the open workspace, which are the roots the file routes serve. */
export function allRoots(saved: WorkspacesState): FsRoot[] {
    return saved.folders;
}

/**
 * The open workspace's folders when the workspace was read, and null while it is being read, when
 * none was read yet and when the read failed: an empty list of served roots then says nothing about
 * what is served.
 */
export function readRoots(saved: WorkspacesState): FsRoot[] | null {
    return saved.loading || saved.error !== '' ? null : saved.folders;
}

/**
 * Whether the open workspace serves a root. A workspace being read, or one that failed to read,
 * answers yes: the empty list it holds says nothing about what is served, so a tab of a root is not
 * called gone before the workspace is known.
 */
export function servesRoot(saved: WorkspacesState, root: string): boolean {
    const roots = readRoots(saved);
    return roots === null || roots.some((one) => one.key === root);
}

/**
 * The roots the reader cannot take off. A tab that follows a session can take none off; no folder
 * of a workspace is fixed otherwise.
 */
export function fixedRootKeys(roots: FsRoot[], following = false): string[] {
    return following ? roots.map((one) => one.key) : [];
}

/** Why a bookmark write was refused, the refused fields' reasons joined, or the empty string. */
export function markRefusal(answer: WriteAnswer): string {
    return answer.ok ? answer.refused.map((one) => one.reason).join('; ') : (answer.error ?? '');
}

/**
 * The bookmark over one path of one root (the empty path is the root's top), or null when the
 * reader has not made one.
 */
export function bookmarkAt(entries: Entry[], root: string, path: string): Entry | null {
    return entries.find((one) => one.fields.root === root && one.fields.path === path) ?? null;
}

/** The files of a listing, a folder left out, which is what a tab can open. */
export function fileEntries(entries: FsEntry[]): FsEntry[] {
    return entries.filter((entry) => entry.kind === 'file');
}

/**
 * Every open folder on screen whose listing failed, with the error it failed with, in the order
 * the rows are drawn; `errorOf` answers the listing error of one folder.
 */
export function openFailures(
    rows: TreeRow[],
    errorOf: (root: string, path: string) => string
): { root: string; path: string; error: string }[] {
    return rows
        .filter((row) => row.open)
        .map((row) => ({ root: row.root, path: row.path, error: errorOf(row.root, row.path) }))
        .filter((one) => one.error !== '');
}

/** Whether a filtered tree matched nothing, which is when it holds its roots and nothing else. */
export function matchedNothing(rows: TreeRow[]): boolean {
    return rows.every((row) => row.depth === 0);
}

/** The workspaces before the server has answered, built per call so no caller shares its lists. */
export function noWorkspaces(): WorkspacesState {
    return {
        home: '',
        open: null,
        folders: [],
        primary: null,
        engine: null,
        recent: [],
        available: [],
        machine: noMachine(),
        error: '',
        loading: true
    };
}

export const NO_TEXT: FileText = { text: '', truncated: false, error: '', loading: true };

export const NO_BOOKMARKS: BookmarksState = { entries: [], error: '', loading: true };

export const NO_NOTES: NotesState = { hubs: [], error: '', loading: true };

export { fileBytesUrl };

/** One folder of a workspace, answered as the endpoint sent it, and the key it is held under. */
const folderShape = z
    .object({
        name: z.string(),
        dir: z.string(),
        real: z.string().optional().catch(undefined),
        hub: z.boolean().catch(false),
        folds: z.literal(true).optional().catch(undefined)
    })
    .transform((one): FsRoot => ({
        key: one.name,
        dir: one.dir,
        ...(one.real === undefined ? {} : { real: one.real }),
        ...(one.hub ? { hub: true as const } : {}),
        ...(one.folds === undefined ? {} : { folds: true as const })
    }));

const workspaceFileShape = unchanged(
    z.object({ path: z.string(), name: z.string(), hub: z.string() })
) satisfies z.ZodType<WorkspaceFile>;

const recentShape = unchanged(
    z.object({ path: z.string(), name: z.string(), hub: z.string(), missing: z.boolean() })
) satisfies z.ZodType<RecentWorkspace>;

/**
 * The workspaces answer: the open workspace, its folders, its primary and the files to switch to.
 */
export const workspacesShape = z.object({
    home: z.string().catch(''),
    open: unchanged(
        z.object({ path: z.string(), name: z.string(), hub: z.string(), real: z.string() })
    )
        .nullable()
        .catch(null),
    folders: rowsShape(folderShape).catch([]),
    primary: z.string().nullable().catch(null),
    engine: z.object({ root: z.string(), path: z.string() }).nullable().catch(null),
    recent: survivorsShape(recentShape).catch([]),
    available: survivorsShape(workspaceFileShape).catch([]),
    machine: z
        .object({
            set: z.array(z.string()).catch([]),
            defaults: z.record(z.string(), z.string()).catch({}),
            values: z.record(z.string(), z.string()).catch({}),
            hubs: z.record(z.string(), z.array(z.string())).catch({})
        })
        .catch(() => noMachine())
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

/** The bookmarks answer: the well-formed entries. */
export const bookmarksShape = z.object({ entries: survivorsShape(bookmarkShape).catch([]) });

/** One file or folder of a hub's notes folder, answered as the endpoint sent it. */
const noteEntryShape = unchanged(
    z.object({
        path: z.string(),
        kind: z.enum(['file', 'dir']),
        modified: anyNumberShape,
        links: z
            .array(z.object({ to: z.string(), line: anyNumberShape, text: z.string() }))
            .optional(),
        tags: z.array(z.object({ tag: z.string(), line: anyNumberShape })).optional()
    })
) satisfies z.ZodType<NoteEntry>;

/** One hub's notes, answered as the endpoint sent them: its well-formed entries. */
const hubNotesShape = z.object({
    root: z.string(),
    primary: z.boolean().catch(false),
    state: z.enum(['ok', 'none', 'refused', 'unreadable']),
    error: z.string().catch(''),
    entries: survivorsShape(noteEntryShape).catch([])
}) satisfies z.ZodType<HubNotes>;

/** The notes answer: the well-formed hubs. */
export const notesShape = z.object({ hubs: survivorsShape(hubNotesShape).catch([]) });

/** The endpoint the tree reads and the workspace actions write. */
export const FS_PATH = '/api/fs';

/**
 * The address one directory's entries are read at, with `hidden=1` and `ignored=1` for the two
 * toggles that ask for more than the default. The folder of oculus's own `config/` is listed by the
 * read-only route over it.
 */
export function listingUrl(root: string, path: string, shown = SHOWN_DEFAULT): string {
    const at =
        root === OCULUS_CONFIG_ROOT
            ? `${fileBytesUrl(root, path)}?list=1`
            : `${FS_PATH}?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
    return `${at}${shown.hidden ? '&hidden=1' : ''}${shown.ignored ? '&ignored=1' : ''}`;
}

/**
 * The key one folder's listing is held under for one pair of toggles: the folder's own key after a
 * mark of the pair, so the four listings a folder can be asked for are four answers.
 */
export function listingKey(key: string, shown: ListingShown): string {
    return `${listingForm(shown)}${key}`;
}

/** The mark every listing key of one pair of toggles opens with. */
export function listingForm(shown: ListingShown): string {
    return `${shown.hidden ? 'h' : '-'}${shown.ignored ? 'i' : '-'}|`;
}

/**
 * Every mark a listing key can open with, which is where a listing of another pair is looked for.
 */
const LISTING_FORMS = [false, true].flatMap((hidden) =>
    [false, true].map((ignored) => listingForm({ hidden, ignored }))
);

/** A listing held for one folder in one form, and whether it is marked to be read again. */
export type HeldListing = { data: Listing | undefined; stale: boolean };

/** What every form of one folder's listing holds now, read through the store's `peek`. */
export function heldListings(
    peek: (key: string[]) => HeldListing,
    root: string,
    path: string
): HeldListing[] {
    return LISTING_FORMS.map((form) =>
        peek(['fs', 'listing', root, `${form}${treeKey(root, path)}`])
    );
}

/** What a read of an endpoint came to: the body of a successful answer, or why the read failed. */
export type Answered =
    { ok: true; body: unknown } | { ok: false; error: string; refused?: OpsRefusal };

/**
 * A response read as an endpoint's answer. A body that is JSON null or is not JSON is a failed
 * read whatever the status, and a refused answer is a failed read; both are told in the sentences
 * of state/shared/answers/answers.ts. Any other body of a successful answer is handed on to be read
 * for its fields.
 */
export async function readAnswer(response: Response): Promise<Answered> {
    const body = await readJson(response);
    if (body === undefined || !response.ok) {
        const refused = body === undefined ? null : answerRefusal(body);
        return {
            ok: false,
            error: failedAnswer(response, body),
            ...(refused === null ? {} : { refused })
        };
    }
    return { ok: true, body };
}

/** One entry of a listing, answered as the endpoint sent it. */
const fsEntryShape = unchanged(
    z.object({
        name: z.string(),
        kind: z.enum(['file', 'dir']),
        size: anyNumberShape,
        mtime: anyNumberShape,
        link: z.literal(true).optional().catch(undefined),
        ignored: z.literal(true).optional().catch(undefined)
    })
) satisfies z.ZodType<FsEntry>;

/** The part of a successful listing this reads: its entries, the well-formed ones only. */
const listingShape = z.object({
    entries: survivorsShape(fsEntryShape).catch([])
}) satisfies z.ZodType<{ entries: FsEntry[] }>;

/**
 * One directory's answer as the tree holds it: its entries, or the reason the request failed,
 * read off the endpoint's own error word or the status.
 */
export async function listingAnswer(url: string): Promise<Listing> {
    try {
        const answer = await readAnswer(await fetch(url));
        if (!answer.ok) {
            const refused = answer.refused === undefined ? {} : { refused: answer.refused };
            return { entries: [], error: answer.error, ...refused, loading: false };
        }
        const entries = readAs(listingShape, answer.body)?.entries ?? [];
        return { entries, error: '', loading: false };
    } catch (error) {
        return {
            entries: [],
            error: error instanceof Error ? error.message : String(error),
            loading: false
        };
    }
}

/**
 * At most `limit` bytes of a response, with the transfer stopped once the limit is in. The limit is
 * bytes; a multi-byte character split by the cut decodes as the replacement character.
 */
export async function readCapped(
    response: Response,
    limit: number
): Promise<{ text: string; truncated: boolean }> {
    const held = await readCappedBytes(response, limit);
    return { text: new TextDecoder().decode(held.bytes), truncated: held.truncated };
}

/** The same cut, before it is decoded: what a rule over the file's own bytes is handed. */
export async function readCappedBytes(
    response: Response,
    limit: number
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
    const body = response.body;
    if (body === null) {
        return { bytes: new Uint8Array(await response.arrayBuffer()), truncated: false };
    }
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
    return { bytes: kept, truncated: taken > limit };
}

/**
 * The keys of the open workspace's folders, and null while the workspace is being read or could not
 * be read, so an ask to show a path waits for it rather than being answered against none.
 */
export function rootKeysOf(saved: WorkspacesState): string[] | null {
    if (saved.loading || saved.error !== '') return null;
    return saved.folders.map((one) => one.key);
}

/** The titles the reader's bookmarks carry, which a new bookmark's label is kept apart from. */
export function bookmarkTitles(entries: Entry[]): string[] {
    return entries.map((one) => one.title);
}

/** The SHA-256 of bytes as lower-case hex, the digest the server's `source:` channel carries. */
export async function digestOf(bytes: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * One file's text, read through the file route and stopped at the window's limit. The read asks
 * the server to revalidate, since the route lets a browser keep an address for a minute, and a
 * text read again after a save or a push must be the file as it is now.
 */
export async function readText(root: string, path: string): Promise<FileText> {
    try {
        const response = await fetch(fileBytesUrl(root, path), { cache: 'no-cache' });
        if (!response.ok) {
            return { ...NO_TEXT, error: refusedAnswer(response.status), loading: false };
        }
        const body = await readCapped(response, TEXT_LIMIT);
        return { ...body, error: '', loading: false };
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { ...NO_TEXT, error: reason, loading: false };
    }
}
