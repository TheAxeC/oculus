// Layer 2, client state. The files of one project folder, fetched when a card is opened and held,
// and the rows of it a filter keeps, matched fuzzily.
//
// It is state/system/docs.svelte.ts's shape over a different endpoint, and for the same reason: the
// wire model keeps a folder listing out of the snapshot, so a board of fifty projects carries none
// of them and an opened card asks api/project-files for its own. files(id) asks the first time an
// id is wanted and holds the answer in the client state's query client; every later call reads what
// is held. The fetch is scheduled on a microtask by state/client/queries.svelte.ts rather
// than run inside the call, so reading this from a $derived never writes state while a derived is
// running.
//
// The `files` channel's version is what makes a listing stale. The git watcher publishes on it each
// time it re-reads a root, which is every write under a folder it watches, so a file written inside
// a project folder is a new version, every held listing is marked, and the next call for that id
// fetches again, from a tab that is shown or when a hidden one is shown. The portfolio's version
// cannot answer this: the snapshot is rebuilt only for a file the config names.

import { z } from 'zod';
import { anyNumberShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
import type { EntitiesStore } from '../shared/stores/shapes.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { byScore, fuzzyMatches } from '../shared/words/fuzzy.ts';
import { readAnswer } from './fs-transport.ts';

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

/** One row of an answer: a row with no path is not one, and the page never draws a nameless row. */
const fileRowShape = z.object({
    path: z.string().min(1),
    size: anyNumberShape.catch(0),
    mtime: anyNumberShape.catch(0)
}) satisfies z.ZodType<FileRow>;

/** What a successful answer carries: the rows it can read, whether it was cut, and the folder. */
const filesShape = z.object({
    rows: rowsShape(fileRowShape).catch([]),
    truncated: z.boolean().catch(false),
    folder: z.string().catch('')
});

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

/** What every project's query key opens with. */
const KIND = 'files';

export function createFiles(entities: EntitiesStore, queries: Queries): FilesStore {
    /** The version of the last `files` message heard, or null before the first. */
    let heard: number | null = null;

    entities.afterReceive((message) => {
        if (message.channel !== 'files' || message.version === heard) return;
        heard = message.version;
        queries.mark([KIND], 'wait');
    });

    /**
     * The files of one project. The first call for an id asks the server; a call made after the
     * `files` version moved asks again (when its tab is shown), and what is held keeps showing
     * until the answer lands. A project whose folder is under no watched root keeps what is held
     * until the id is forgotten.
     */
    function files(id: string): FilesState {
        if (id === '') return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the id stays pending and the browser asks for it on the first client render.
        const { data } = queries.read([KIND, id], () => load(id), {
            enabled: typeof fetch === 'function'
        });
        return data ?? PENDING;
    }

    /** Forget what is held for one project, so the next call for it fetches again. */
    function invalidate(id: string): void {
        queries.forget([KIND, id]);
    }

    async function load(id: string): Promise<FilesState> {
        try {
            const response = await fetch(`/api/project-files?id=${encodeURIComponent(id)}`);
            const answer = await readAnswer(response);
            if (!answer.ok) return { ...PENDING, error: answer.error, loading: false };
            const body = readAs(filesShape, answer.body);
            return {
                rows: body?.rows ?? [],
                truncated: body?.truncated ?? false,
                folder: body?.folder ?? '',
                error: '',
                loading: false
            };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { ...PENDING, error: reason, loading: false };
        }
    }

    return { files, invalidate };
}
