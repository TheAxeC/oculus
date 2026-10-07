// Layer 2, client state. The file browser's request addresses, the shapes its answers are held in,
// the lookups the views make over what those shapes hold (the current workspace, a bookmark, the
// open folders that failed to list) and bounded response reads, kept apart from the store because
// they depend only on the wire and the response stream.

import { z } from 'zod';
import type { Entry, SchemaField } from '../../data/model/index.ts';
import type { BookmarkKind } from './explorer/view/bookmark-rows.ts';
import {
    anyNumberShape,
    readAs,
    readJson,
    survivorsShape,
    unchanged
} from '../../data/shapes/shapes.ts';
import { failedAnswer, refusedAnswer } from '../shared/answers/answers.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import {
    SHOWN_DEFAULT,
    TEXT_LIMIT,
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
    /** True while the first answer for the folder is still to come. */
    loading: boolean;
};

/** The workspaces as the toolbar reads them. */
export type WorkspacesState = {
    /** The server account's home folder, which a path under it is written `~` from; else empty. */
    home: string;
    current: string;
    workspaces: { name: string; roots: FsRoot[] }[];
    /** The keys the server dropped because the configuration reserves them. */
    dropped: string[];
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

export const NO_LISTING: Listing = { entries: [], error: '', loading: true };

/** The workspace the saved state names as current; an empty one when it names none it holds. */
export function currentWorkspace(saved: WorkspacesState): { name: string; roots: FsRoot[] } {
    return saved.workspaces.find((one) => one.name === saved.current) ?? { name: '', roots: [] };
}

/**
 * The roots the reader cannot take off. A tab that follows a session can take none off. In the
 * default workspace (`removable` is the keys of the roots config/sources.yml lists) the folders of
 * that list can be taken off and the hub, the engine's config folder and the fallback folder
 * cannot; in a named workspace the configured roots, which the server marks `fixed`, cannot.
 */
export function fixedRootKeys(
    roots: FsRoot[],
    following = false,
    removable: readonly string[] | null = null
): string[] {
    return roots
        .filter(
            (one) => following || (removable === null ? one.fixed : !removable.includes(one.key))
        )
        .map((one) => one.key);
}

/**
 * The keys of the roots a merged configuration lists under `roots:`, an entry with no key left out.
 */
export function configuredRootKeys(config: Record<string, unknown>): string[] {
    const held = config.roots;
    if (!Array.isArray(held)) return [];
    return held.flatMap((one) => {
        const key = readAs(z.object({ key: z.string().min(1) }), one)?.key;
        return key === undefined ? [] : [key];
    });
}

/**
 * The keys of the roots the workspace on screen cannot take off. The default workspace (the empty
 * name) takes the folders of `sources.yml`'s `roots:` off; a named workspace takes none of the
 * configured ones off, which the server marks `fixed`.
 */
export function fixedRootsOf(
    workspace: { name: string; roots: FsRoot[] },
    following: boolean,
    config: Record<string, unknown>
): string[] {
    return fixedRootKeys(
        workspace.roots,
        following,
        workspace.name === '' ? configuredRootKeys(config) : null
    );
}

/** The bookmark of the given id, or null when the reader has none of it. */
export function bookmarkById(entries: Entry[], id: string): Entry | null {
    return entries.find((one) => one.id === id) ?? null;
}

/** Why a bookmark write was refused, the refused fields' reasons joined, or the empty string. */
export function markRefusal(answer: WriteAnswer): string {
    return answer.ok ? answer.refused.map((one) => one.reason).join('; ') : (answer.error ?? '');
}

/** The bookmark over one file of one root, or null when the reader has not made one. */
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

export const NO_WORKSPACES: WorkspacesState = {
    home: '',
    current: '',
    workspaces: [],
    dropped: [],
    error: '',
    loading: true
};

export const NO_TEXT: FileText = { text: '', truncated: false, error: '', loading: true };

export const NO_BOOKMARKS: BookmarksState = { entries: [], schema: [], error: '', loading: true };

export const NO_NOTES: NotesState = { notes: [], error: '', loading: true };

export const NO_NOTE: NoteState = {
    id: '',
    title: '',
    body: '',
    modified: 0,
    error: '',
    loading: true
};

/** The endpoint the tree reads and the workspace actions write. */
export const FS_PATH = '/api/fs';

/**
 * The address one file's bytes are read at, each segment escaped without escaping the separators.
 * A version above zero rides on the query, which makes a rewritten file a new browser address.
 */
export function fileBytesUrl(root: string, path: string, version = 0): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '')
        .map((part) => encodeURIComponent(part));
    const at = `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
    return version > 0 ? `${at}?v=${version}` : at;
}

/**
 * The address one directory's entries are read at, with `hidden=1` and `ignored=1` for the two
 * toggles that ask for more than the default.
 */
export function listingUrl(root: string, path: string, shown = SHOWN_DEFAULT): string {
    const at = `${FS_PATH}?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;
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
export const LISTING_FORMS = [false, true].flatMap((hidden) =>
    [false, true].map((ignored) => listingForm({ hidden, ignored }))
);

/** What a read of an endpoint came to: the body of a successful answer, or why the read failed. */
export type Answered = { ok: true; body: unknown } | { ok: false; error: string };

/**
 * A response read as an endpoint's answer. A body that is JSON null or is not JSON is a failed
 * read whatever the status, and a refused answer is a failed read; both are told in the sentences
 * of state/shared/answers/answers.ts. Any other body of a successful answer is handed on to be read
 * for its fields.
 */
export async function readAnswer(response: Response): Promise<Answered> {
    const body = await readJson(response);
    if (body === undefined || !response.ok)
        return { ok: false, error: failedAnswer(response, body) };
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
        if (!answer.ok) return { entries: [], error: answer.error, loading: false };
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

/** The address one note's own text is read at. */
export function noteUrl(id: string): string {
    return `${FS_PATH}?note=${encodeURIComponent(id)}`;
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

/** The names of the saved workspaces, in the order the file keeps them. */
export function workspaceNames(saved: WorkspacesState): string[] {
    return saved.workspaces.map((one) => one.name);
}

/**
 * The keys of the current workspace's roots, and null while the workspaces are being read or could
 * not be read, so an ask to show a path waits for them rather than being answered against none.
 */
export function rootKeysOf(saved: WorkspacesState): string[] | null {
    if (saved.loading || saved.error !== '') return null;
    return currentWorkspace(saved).roots.map((one) => one.key);
}

/** The titles the reader's bookmarks carry, which a new bookmark's label is kept apart from. */
export function bookmarkTitles(entries: Entry[]): string[] {
    return entries.map((one) => one.title);
}

/**
 * The SHA-256 of one file's bytes as lower-case hex, read through the file route, or null when the
 * file cannot be read. The read asks the server to revalidate, as `readText` does.
 */
export async function readHash(root: string, path: string): Promise<string | null> {
    try {
        const response = await fetch(fileBytesUrl(root, path), { cache: 'no-cache' });
        if (!response.ok) return null;
        const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
        return [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    } catch {
        return null;
    }
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
