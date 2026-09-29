// Layer 2, client state. The files of one project folder, fetched when a card is opened and held,
// and the rows of it a filter keeps, matched fuzzily.
//
// It is state/system/docs.svelte.ts's shape over a different endpoint, and for the same reason: the
// wire model keeps a folder listing out of the snapshot, so a board of fifty projects carries none
// of them and an opened card asks api/project-files for its own. files(id) asks the first time an
// id is wanted and holds the answer; every later call reads what is held. The fetch is scheduled on
// a microtask rather than run inside the call, so reading this from a $derived never writes state
// while a derived is running.
//
// The `files` channel's version is what makes a listing stale. The git watcher publishes on it each
// time it re-reads a root, which is every write under a folder it watches, so a file written inside
// a project folder is a new version and the next call for that id fetches again. The portfolio's
// version cannot answer this: the snapshot is rebuilt only for a file the config names.

import type { EntitiesStore } from '../shared/stores/shapes.ts';
import { byScore, fuzzyMatches } from '../shared/words/fuzzy.ts';

/** One file of a project folder, as the finder draws it. */
export type FileRow = { path: string; size: number; mtime: number };

/**
 * The file rows whose folder-relative path the query matches fuzzily, every word of it, best score
 * first and ties in listing order; every row for no query.
 */
export function matchingFiles(all: FileRow[], needle: string): FileRow[] {
    if (needle.trim() === '') return all;
    return fuzzyMatches(needle, all, [(row) => row.path])
        .sort(byScore)
        .map((found) => found.row);
}

/** One project's files as the view reads them. */
export type FilesState = {
    rows: FileRow[];
    /** True when the config's cap cut the listing short. */
    truncated: boolean;
    /** The project's folder relative to the hub, which a row's link is built on. */
    folder: string;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the id is still to come. */
    loading: boolean;
};

/** What an id reads as before its answer arrives. */
const PENDING: FilesState = { rows: [], truncated: false, folder: '', error: '', loading: true };

/** What no id at all reads as: an empty id asks nothing and waits for nothing. */
const NOTHING: FilesState = { rows: [], truncated: false, folder: '', error: '', loading: false };

/** One project folder listing per id, held for one client. */
export type FilesStore = {
    files: (id: string) => FilesState;
    invalidate: (id: string) => void;
};

export function createFiles(entities: EntitiesStore): FilesStore {
    const held: Record<string, FilesState | undefined> = $state({});

    /** The `files` version each held id was fetched at. Not reactive: only requests read it. */
    const versions: Record<string, number | undefined> = {};

    /** The ids with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /**
     * The version of the `files` channel, or 0 before a write has been seen under any watched root.
     */
    function version(): number {
        return entities.message('files')?.version ?? 0;
    }

    /**
     * The files of one project. The first call for an id asks the server; a call made after the
     * `files` version moved asks again, and what is held keeps showing until the answer lands. A
     * project whose folder is under no watched root keeps what is held until the id is forgotten.
     */
    function files(id: string): FilesState {
        if (id === '') return NOTHING;
        const found = held[id];
        const at = version();
        if (found === undefined || versions[id] !== at) request(id, at);
        return found ?? PENDING;
    }

    /** Forget what is held for one project, so the next call for it fetches again. */
    function invalidate(id: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete held[id];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete versions[id];
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(id: string, at: number): void {
        if (inflight.has(id)) return;
        inflight.add(id);
        queueMicrotask(() => {
            void load(id, at);
        });
    }

    async function load(id: string, at: number): Promise<void> {
        try {
            versions[id] = at;
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the id stays pending and the browser asks for it on the first client render.
            if (typeof fetch !== 'function') return;
            const response = await fetch(`/api/project-files?id=${encodeURIComponent(id)}`);
            const body = (await response.json()) as {
                rows?: unknown;
                truncated?: unknown;
                folder?: unknown;
                error?: string;
            };
            if (!response.ok) {
                held[id] = {
                    ...PENDING,
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            held[id] = {
                rows: readRows(body.rows),
                truncated: body.truncated === true,
                folder: typeof body.folder === 'string' ? body.folder : '',
                error: '',
                loading: false
            };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held[id] = { ...PENDING, error: reason, loading: false };
        } finally {
            inflight.delete(id);
        }
    }

    /**
     * The rows of an answer, keeping only what carries a path: the page never draws a nameless row.
     */
    function readRows(value: unknown): FileRow[] {
        if (!Array.isArray(value)) return [];
        const rows: FileRow[] = [];
        for (const one of value) {
            if (typeof one !== 'object' || one === null) continue;
            const row = one as Record<string, unknown>;
            if (typeof row.path !== 'string' || row.path === '') continue;
            rows.push({
                path: row.path,
                size: typeof row.size === 'number' ? row.size : 0,
                mtime: typeof row.mtime === 'number' ? row.mtime : 0
            });
        }
        return rows;
    }

    return { files, invalidate };
}
