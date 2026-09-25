// Layer 2, client state. What the History view knows about the change log, and which of its rows a
// filter keeps.
//
// The log is a machine-local file and is not in the snapshot, so it is fetched from GET
// /api/changes: one page on the first read, an older page each time the reader asks for one, and
// the whole list again after an undo. The wire shape is declared here rather than imported, since
// the boundary table of DESIGN.md lets `state/` import `data/model` and nothing of `server/`;
// server/core/changes.ts holds the same shape on its own side.
//
// The fetch is scheduled on a microtask rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running, and it is only ever made in the browser:
// a server-rendered page holds nothing and asks for nothing.

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
    /** Ask for the page before the oldest row now held. */
    older: () => void;
    /**
     * Put rows in by hand. The view does not call it; tests/views/system/history.test.ts does,
     * because there is no fetch in a server-rendered test and a view with nothing held draws its
     * first line and stops.
     */
    hold: (rows: Change[], more?: boolean) => void;
};

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

/** One answer of the endpoint. */
type Answer = { changes?: Change[]; page?: number; error?: string };

export function createChanges(): ChangesStore {
    const state: { rows: Change[]; loading: boolean; error: string; more: boolean } = $state({
        rows: [],
        loading: true,
        error: '',
        more: false
    });

    /** True while a request is in flight, so a second render does not send a second request. */
    let inflight = false;

    /** True once a page has been asked for, so the first read asks and the rest do not. */
    let asked = false;

    /**
     * Ask for the first page, once. Every read a view can make first calls it, because a view draws
     * the waiting line before it draws a row and a derived is only evaluated when it is read: a
     * store that asked on the rows alone would wait for a read that the waiting line holds back.
     */
    function ask(): void {
        if (asked) return;
        asked = true;
        request();
    }

    function rows(): Change[] {
        ask();
        return state.rows;
    }

    function loading(): boolean {
        ask();
        return state.loading;
    }

    function error(): string {
        return state.error;
    }

    function more(): boolean {
        ask();
        return state.more;
    }

    function hold(next: Change[], hasMore = false): void {
        state.rows = next;
        state.loading = false;
        state.error = '';
        state.more = hasMore;
        asked = true;
    }

    function reload(): void {
        asked = true;
        request();
    }

    /** The page before the oldest row held, addressed by that row's own moment. */
    function older(): void {
        const oldest = state.rows.at(-1);
        if (oldest === undefined) return;
        request(oldest.at);
    }

    function request(before?: string): void {
        if (inflight) return;
        inflight = true;
        queueMicrotask(() => {
            void load(before);
        });
    }

    async function load(before?: string): Promise<void> {
        try {
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the view stays pending and the browser asks on the first client render.
            if (typeof window === 'undefined' || typeof fetch !== 'function') return;
            const query = before === undefined ? '' : `?before=${encodeURIComponent(before)}`;
            const response = await fetch(`/api/changes${query}`);
            const body = (await response.json()) as Answer;
            if (!response.ok) {
                state.error = body.error ?? String(response.status);
                state.loading = false;
                return;
            }
            const page = body.changes ?? [];
            state.rows = before === undefined ? page : [...state.rows, ...page];
            state.more = body.page !== undefined && page.length >= body.page;
            state.error = '';
            state.loading = false;
        } catch (thrown) {
            state.error = thrown instanceof Error ? thrown.message : String(thrown);
            state.loading = false;
        } finally {
            inflight = false;
        }
    }

    return { rows, loading, error, more, reload, older, hold };
}
