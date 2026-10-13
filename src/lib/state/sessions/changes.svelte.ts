// Layer 2, client state. What the History view knows about the change log, and which of its rows a
// filter keeps.
//
// The log is a machine-local file and is not in the snapshot, so it is fetched from GET
// /api/changes: one page on the first read, an older page each time the reader asks for one, and
// the whole list again after an undo. The wire shape is declared here rather than imported, since
// the boundary table of DESIGN.md lets `state/` import `data/model` and nothing of `server/`;
// server/core/changes.ts holds the same shape on its own side.
//
// The answer is held in the client state's query client, and the fetch is scheduled on a microtask
// by state/client/queries.svelte.ts rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running. It is only ever made in the browser: a
// server-rendered page holds nothing and asks for nothing. A page asked for while a request is out
// is dropped, and the older page is merged into the rows held inside the request.

import { z } from 'zod';
import { fileUnder, type RootFolder } from '../../data/helpers/hub-names.ts';
import {
    anyNumberShape,
    readAs,
    readJson,
    survivorsShape,
    unchangedAs
} from '../../data/shapes/shapes.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import type { Fetcher, Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';

/** One recorded write, as the endpoint answers it. */
export type Change = {
    at: string;
    kind: string;
    file: string;
    key: string;
    field: string;
    before: unknown;
    after: unknown;
    /** `field`, `create`, `delete`, `reorder`, or `none` for a write with no way back. */
    undo: string;
    /** The `at` of the change this one took back, absent on a change that took nothing back. */
    undoes?: string;
    /** The view id of the app that made the write, absent on a write of the reader's. */
    app?: string;
};

/** The change log of this machine, held for one client. */
export type ChangesStore = {
    rows: () => Change[];
    /** True while the first page is still to come. */
    loading: () => boolean;
    /** What the last request failed with, or the empty string. */
    error: () => string;
    /** Whether the last page came back full, so there may be older changes behind it. */
    more: () => boolean;
    /** Ask for the first page again, which is what a view does after a write of its own. */
    reload: () => void;
    /**
     * The first page read afresh, awaited: what a caller that acts on the newest row needs, since
     * the rows held may not yet include a write made a moment ago.
     */
    latest: () => Promise<Change[]>;
    /** Ask for the page before the oldest row now held. */
    older: () => void;
    /**
     * Put rows in by hand. The view does not call it.
     */
    hold: (rows: Change[], more?: boolean) => void;
};

/**
 * The file of a row as the History view names it. A record holds the absolute path; a file under
 * the primary's folder is shown by its path inside it, a file under another served folder by that
 * folder's name and the path inside it, and any other file by its absolute path.
 */
export function fileShown(
    file: string,
    roots: readonly RootFolder[],
    primary: string | null
): string {
    const under = fileUnder(file, roots, primary);
    if (under === null) return file;
    return under.root === primary ? under.path : `${under.root}/${under.path}`;
}

/** The words one row is matched against: the file it wrote, what it addressed, and the field. */
export function haystack(row: Change): string {
    return `${row.file} ${row.key} ${row.field}`.toLowerCase();
}

/** The rows a filter leaves, in the order they were given. An empty filter leaves every row. */
export function matching(rows: Change[], filter: string): Change[] {
    const wanted = filter.trim().toLowerCase();
    if (wanted === '') return rows;
    return rows.filter((row) => haystack(row).includes(wanted));
}

/**
 * One recorded write, handed on as the endpoint wrote it. A row needs the four fields the log's own
 * reader needs (server/core/changes.ts), and a line oculus did not write may lack the rest, so the
 * rest is not asked for.
 */
const changeShape = unchangedAs<Change>(
    z.looseObject({ at: z.string(), kind: z.string(), file: z.string(), field: z.string() })
);

/**
 * One answer of the endpoint, each field as typed or absent: the rows that read as changes, the
 * size of a full page.
 */
const answerShape = z.object({
    changes: survivorsShape(changeShape).catch([]),
    page: anyNumberShape.optional().catch(undefined)
});

/** What a body that is not a map says: no rows and no page size. */
const NO_ANSWER = { changes: [], page: undefined };

/** What is held: the rows, whether the first page is still to come, what failed, and more. */
type Held = { rows: Change[]; loading: boolean; error: string; more: boolean };

/** What the store reads as before its first answer arrives. */
const PENDING: Held = { rows: [], loading: true, error: '', more: false };

/** The query key of the log. */
const KEY = ['changes'];

/**
 * The page the endpoint answers for a moment, or the first page when there is none, merged into
 * what is held: the first page replaces the rows, an older page follows them, and a failure keeps
 * the rows with the sentence saying why.
 */
async function page(held: Held | undefined, before?: string): Promise<Held> {
    const rows = held?.rows ?? [];
    const more = held?.more ?? false;
    try {
        const query = before === undefined ? '' : `?before=${encodeURIComponent(before)}`;
        const response = await fetch(`/api/changes${query}`);
        const raw = await readJson(response);
        if (raw === undefined || !response.ok) {
            return { rows, more, error: failedAnswer(response, raw), loading: false };
        }
        const body = readAs(answerShape, raw) ?? NO_ANSWER;
        const next = body.changes;
        return {
            rows: before === undefined ? next : [...rows, ...next],
            more: body.page !== undefined && next.length >= body.page,
            error: '',
            loading: false
        };
    } catch (thrown) {
        const error = thrown instanceof Error ? thrown.message : String(thrown);
        return { rows, more, error, loading: false };
    }
}

export function createChanges(queries: Queries): ChangesStore {
    const first: Fetcher<Held> = (held) => page(held);

    /**
     * What is held, asking for the first page when nothing is. Every read a view can make first
     * goes through it, because a view draws the waiting line before it draws a row and a derived
     * is only evaluated when it is read: a store that asked on the rows alone would wait for a
     * read that the waiting line holds back.
     */
    function current(): Held {
        return queries.read(KEY, first, { enabled: inBrowser() }).data ?? PENDING;
    }

    function rows(): Change[] {
        return current().rows;
    }

    function loading(): boolean {
        return current().loading;
    }

    function error(): string {
        return (queries.peek<Held>(KEY).data ?? PENDING).error;
    }

    function more(): boolean {
        return current().more;
    }

    function hold(next: Change[], hasMore = false): void {
        const held: Held = { rows: next, loading: false, error: '', more: hasMore };
        queries.hold(KEY, held);
    }

    async function latest(): Promise<Change[]> {
        if (!inBrowser()) return rows();
        queries.mark(KEY, 'replace');
        return (await queries.fetch(KEY, first)).rows;
    }

    function reload(): void {
        if (inBrowser()) queries.refetch(KEY, first, 'drop');
    }

    /** The page before the oldest row held, addressed by that row's own moment. */
    function older(): void {
        const oldest = queries.peek<Held>(KEY).data?.rows.at(-1);
        if (oldest === undefined || !inBrowser()) return;
        queries.refetch<Held>(KEY, (held) => page(held, oldest.at), 'drop');
    }

    return { rows, loading, error, more, reload, latest, older, hold };
}
