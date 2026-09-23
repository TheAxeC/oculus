// Layer 2, client state. The file browser's request addresses, the shapes its answers are held in
// and bounded response reads, kept apart from the store because they depend only on the wire and
// the response stream.

import type { Entry, SchemaField } from '../../data/model.ts';
import { SHOWN_DEFAULT, type FsEntry, type FsRoot, type ListingShown } from './fs.ts';

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

export const NO_LISTING: Listing = { entries: [], error: '', loading: true };

export const NO_WORKSPACES: WorkspacesState = {
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

/**
 * One directory's answer as the tree holds it: its entries, or the reason the request failed,
 * read off the endpoint's own error word or the status.
 */
export async function listingAnswer(url: string): Promise<Listing> {
    try {
        const response = await fetch(url);
        const body = (await response.json()) as { entries?: unknown; error?: unknown };
        if (response.ok) {
            const entries = Array.isArray(body.entries) ? (body.entries as FsEntry[]) : [];
            return { entries, error: '', loading: false };
        }
        const error = typeof body.error === 'string' ? body.error : String(response.status);
        return { entries: [], error, loading: false };
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
