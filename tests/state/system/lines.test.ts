// Layer 4, state test. The line count store: it asks GET /api/lines on the first read and not
// before, asks again on a recount, and holds an answer whose shape is wrong as a failed read.
//
// The fetch is doubled, so nothing here opens a socket or counts a file: a case states what the
// endpoint answers and asserts what the store holds after it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLines, type LinesStore } from '../../../src/lib/state/system/lines.svelte.ts';
import { createQueries } from '../../../src/lib/state/client/queries.svelte.ts';
import { stubHeld } from '../../fixtures/client.ts';
import { COUNT } from '../../server/machine/line-counts.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

/** The URLs the doubled fetch was asked for, in order. */
let asked: string[] = [];

/**
 * What the doubled fetch answers next, one answer per call: a JSON body, a body sent as it is
 * (`text`), or a fetch that fails before any answer (`fails`).
 */
let answers: { status: number; body?: unknown; text?: string; fails?: string }[] = [];

let store: LinesStore;

/** The doubled fetch: it notes what it was asked for and answers the next answer queued. */
function respond(url: string): Promise<Response> {
    asked.push(url);
    const next = answers.shift() ?? { status: 200, body: COUNT };
    if (next.fails !== undefined) return Promise.reject(new TypeError(next.fails));
    if (next.text !== undefined) {
        return Promise.resolve(new Response(next.text, { status: next.status }));
    }
    return Promise.resolve(Response.json(next.body, { status: next.status }));
}

/** Let the scheduled microtask and the answer it awaits run: one turn of the timer queue. */
const settle = (): Promise<void> => new Promise((wake) => setTimeout(wake, 0));

beforeEach(() => {
    asked = [];
    answers = [];
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', respond);
    store = createLines(createQueries());
});

afterEach(() => vi.unstubAllGlobals());

describe('the line count store', () => {
    it('starts one fetch on the first read and reads as loading until it answers', async () => {
        expect(asked).toEqual([]);
        expect(store.lines()).toEqual({ count: null, error: '', loading: true });
        store.lines();
        // The fetch waits for a microtask, so a read inside a derived writes nothing.
        expect(asked).toEqual([]);
        await settle();
        expect(asked).toEqual(['/api/lines']);
    });

    it('holds the answer as the count', async () => {
        store.lines();
        await settle();
        expect(store.lines()).toEqual({ count: COUNT, error: '', loading: false });
        expect(asked).toEqual(['/api/lines']);
    });

    it('asks again on a recount, and reads as loading while it does', async () => {
        store.lines();
        await settle();
        const later = { ...COUNT, counted: '2026-09-28T11:00:00.000Z' };
        answers = [{ status: 200, body: later }];
        store.recount();
        expect(store.lines().loading).toBe(true);
        await settle();
        expect(asked).toEqual(['/api/lines', '/api/lines']);
        expect(store.lines()).toEqual({ count: later, error: '', loading: false });
    });

    // Revert: in recount of state/system/lines.svelte.ts, refetch with 'replace' instead of 'drop'.
    it('sends nothing for a recount pressed while one is out, and keeps the old count showing', async () => {
        store.lines();
        await settle();
        const { land } = stubHeld(asked);
        store.recount();
        await settle();
        expect(asked).toHaveLength(2);
        const during = store.lines();
        expect(during).toEqual({ count: COUNT, error: '', loading: true });

        store.recount();
        await settle();
        expect(asked).toHaveLength(2);
        expect(store.lines()).toEqual(during);

        const later = { ...COUNT, counted: '2026-09-28T12:00:00.000Z' };
        land(Response.json(later));
        await settle();
        expect(store.lines()).toEqual({ count: later, error: '', loading: false });
    });

    it('asks once for a recount pressed while a count is on its way', async () => {
        store.lines();
        store.recount();
        store.recount();
        await settle();
        expect(asked).toEqual(['/api/lines']);
    });

    it('holds an answer with no rows list as an error, not as a shorter table', async () => {
        answers = [{ status: 200, body: { total: COUNT.total, counted: COUNT.counted } }];
        store.lines();
        await settle();
        expect(store.lines()).toEqual({
            count: null,
            error: catalog['status.lines_bad_rows'],
            loading: false
        });
    });

    it('holds a row that is not a folder count as an error naming the row', async () => {
        answers = [
            {
                status: 200,
                body: { ...COUNT, rows: [{ ...COUNT.rows[0], code: 'many' }] }
            }
        ];
        store.lines();
        await settle();
        expect(store.lines().error).toBe(catalog['status.lines_bad_row'].replace('{0}', '1'));
        expect(store.lines().count).toBeNull();
    });

    it("holds the server's sentence when the count failed there", async () => {
        answers = [{ status: 500, body: { error: 'cloc exited with code 1.' } }];
        store.lines();
        await settle();
        expect(store.lines()).toEqual({
            count: null,
            error: 'cloc exited with code 1.',
            loading: false
        });
    });

    it('says the status when a failed answer carries no sentence', async () => {
        answers = [{ status: 502, body: {} }];
        store.lines();
        await settle();
        expect(store.lines()).toEqual({
            count: null,
            error: catalog['status.lines_bad_status'].replace('{0}', '502'),
            loading: false
        });
    });

    it('says the answer is not a count, and no parser message, when it is not JSON', async () => {
        answers = [{ status: 500, text: '<html><body>Internal Server Error</body></html>' }];
        store.lines();
        await settle();
        expect(store.lines()).toEqual({
            count: null,
            error: catalog['status.lines_bad_body'].replace('{0}', '500'),
            loading: false
        });
    });

    it('says the answer is not a count when a 200 carries a page', async () => {
        answers = [{ status: 200, text: '<html><body>Proxy</body></html>' }];
        store.lines();
        await settle();
        expect(store.lines().error).toBe(catalog['status.lines_bad_body'].replace('{0}', '200'));
    });

    it('holds an answer with no total, or no time, as that error', async () => {
        answers = [{ status: 200, body: { rows: COUNT.rows, counted: COUNT.counted } }];
        store.lines();
        await settle();
        expect(store.lines().error).toBe(catalog['status.lines_bad_total']);
        answers = [{ status: 200, body: { rows: COUNT.rows, total: COUNT.total } }];
        store.recount();
        await settle();
        expect(store.lines().error).toBe(catalog['status.lines_bad_counted']);
    });

    it('holds the sentence of a fetch that failed before any answer', async () => {
        answers = [{ status: 0, fails: 'Failed to fetch' }];
        store.lines();
        await settle();
        expect(store.lines()).toEqual({
            count: null,
            error: catalog['status.lines_unreachable'],
            loading: false
        });
    });

    it('keeps the last table when a later count fails, with the sentence beside it', async () => {
        store.lines();
        await settle();
        answers = [{ status: 500, body: { error: 'cloc exited with code 1.' } }];
        store.recount();
        await settle();
        expect(store.lines()).toEqual({
            count: COUNT,
            error: 'cloc exited with code 1.',
            loading: false
        });
    });

    it('asks nothing where there is no window, as on a server render', async () => {
        vi.stubGlobal('window', undefined);
        store.lines();
        await settle();
        expect(asked).toEqual([]);
    });
});
