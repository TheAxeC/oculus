// Layer 2, client state. What the file browser fetched: one directory's entries, the workspaces, and
// one file's text.
//
// It is state/docs.svelte.ts's shape over three endpoints, and for the same reason: a listing is not
// in the snapshot, so the first call for a folder asks the server and every later call reads what is
// held. The request is scheduled on a microtask rather than run inside the call, so reading this from
// a $derived never writes state while a derived is running.
//
// Nothing re-fetches on its own. A write to the workspaces file moves the round on, which is what
// makes the next render ask again for everything held; what is held stays drawn until the fresh
// answer lands, so a tree does not blink out on every add or removal, and an answer from an earlier
// round is dropped rather than written in over the newer request's. A folder whose contents changed
// on disk is re-read by closing it and opening it, since a poller over an open tree would read the
// disk for a reader who is looking at one line of it.
//
// The file text is read through the file route and stopped at the window's limit: the reader is
// cancelled once the limit is in, so a forty-megabyte file costs two megabytes of transfer and not
// forty.

import { TEXT_LIMIT, treeKey, type FsEntry, type FsRoot } from './fs.ts';
import type { WriteAnswer, WritesStore } from './writes.svelte.ts';

/** The endpoint the tree reads and the workspace actions write. */
export const FS_PATH = '/api/fs';

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

/** The key the workspaces answer is held and rounded under. A root key is never the empty string. */
const WORKSPACES = ':workspaces';

/** The file browser's fetched state, one per client. */
export type FsStore = {
    listing: (root: string, path: string) => Listing;
    entries: (root: string, path: string) => FsEntry[];
    workspaces: () => WorkspacesState;
    fileText: (root: string, path: string) => FileText;
    addRoot: (dir: string) => Promise<WriteAnswer>;
    removeRoot: (key: string) => Promise<WriteAnswer>;
    saveWorkspace: (name: string) => Promise<WriteAnswer>;
    selectWorkspace: (name: string) => Promise<WriteAnswer>;
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
    const held: { workspaces: WorkspacesState | null } = $state({ workspaces: null });

    /** The round each held answer was fetched in. Not reactive: only requests read it. */
    const rounds: Record<string, number> = {};

    /** The requests in flight, by round and key, so one render does not send two. */
    const inflight = new Set<string>();

    /**
     * Which round of answers is current. A write moves it on and everything held is asked again; it
     * is a rune because every read of it happens inside a derived, which has to run again when it
     * moves.
     */
    const clock: { round: number } = $state({ round: 0 });

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

    /** Whether an answer from round `at` may still be written in. */
    function current(at: number): boolean {
        return at === clock.round;
    }

    /** One directory. The first call for a folder asks the server; later calls read what is held. */
    function listing(root: string, path: string): Listing {
        if (root === '') return { entries: [], error: '', loading: false };
        const key = treeKey(root, path);
        const found = listings[key];
        const at = clock.round;
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
            if (!current(at)) return;
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
            if (!current(at)) return;
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
            if (!current(at)) return;
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
            if (!current(at)) return;
            rounds[WORKSPACES] = at;
            held.workspaces = { ...NO_WORKSPACES, error: reasonOf(error), loading: false };
        }
    }

    /** One file's text, read through the file route and stopped at the window's limit. */
    function fileText(root: string, path: string): FileText {
        if (root === '' || path === '') return { ...NO_TEXT, loading: false };
        const key = treeKey(root, path);
        const found = texts[key];
        const at = clock.round;
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
                if (!current(at)) return;
                rounds[`text:${key}`] = at;
                texts[key] = { ...NO_TEXT, error: String(response.status), loading: false };
                return;
            }
            const body = await readCapped(response, TEXT_LIMIT);
            if (!current(at)) return;
            rounds[`text:${key}`] = at;
            texts[key] = { ...body, error: '', loading: false };
        } catch (error) {
            if (!current(at)) return;
            rounds[`text:${key}`] = at;
            texts[key] = { ...NO_TEXT, error: reasonOf(error), loading: false };
        }
    }

    function reasonOf(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    /**
     * Ask the server again for everything held: the workspaces, every listing and every file text.
     * What is held keeps being drawn until each new answer lands, and an answer from the round
     * before this one is dropped, so a listing fetched before a removal cannot reappear after it.
     */
    function invalidate(): void {
        clock.round += 1;
    }

    /** One workspace action, behind the same token every other write carries. */
    async function act(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const answer = await writes.send(fields, FS_PATH);
        if (answer.ok) invalidate();
        return answer;
    }

    return {
        listing,
        entries,
        workspaces,
        fileText,
        addRoot: (dir: string) => act({ action: 'add-root', dir }),
        removeRoot: (key: string) => act({ action: 'remove-root', key }),
        saveWorkspace: (name: string) => act({ action: 'save-workspace', name }),
        selectWorkspace: (name: string) => act({ action: 'select-workspace', name }),
        invalidate
    };
}
