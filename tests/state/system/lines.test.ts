// Layer 4, state test. The line count store: it asks GET /api/lines on the first read and not
// before, asks again on a recount, and holds an answer whose shape is wrong as a failed read. The
// sum of the rows under src/ (underSource) is held to the rows it takes and the rows it leaves.
//
// The fetch is doubled, so nothing here opens a socket or counts a file: a case states what the
// endpoint answers and asserts what the store holds after it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createLines,
    readCount,
    underSource,
    type LinesStore
} from '../../../src/lib/state/system/lines.svelte.ts';
import { createQueries } from '../../../src/lib/state/client/queries.svelte.ts';
import { stubHeld } from '../../fixtures/client.ts';
import { COUNT, folder, tally, type Sums } from '../../server/machine/line-counts.ts';
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

describe('an answer that is not a count', () => {
    const SUMS = { files: 1, blank: 2, comment: 3, code: 4, todo: 5 };
    const COUNTED = '2026-09-28T10:00:00.000Z';
    const lang = (over: Record<string, unknown> = {}) => ({
        language: 'TypeScript',
        ...SUMS,
        ...over
    });
    const row = (over: Record<string, unknown> = {}) => ({
        folder: 'src',
        ...SUMS,
        languages: [lang()],
        ...over
    });
    const body = (over: Record<string, unknown> = {}) => ({
        rows: [row()],
        total: SUMS,
        counted: COUNTED,
        ...over
    });
    const said = (key: string, at?: number): { error: string } => ({
        error: at === undefined ? catalog[key] : catalog[key].replace('{0}', String(at))
    });

    it('holds a whole answer as the count, keys in the order the view reads them', () => {
        const read = readCount(body()) as { count: { rows: Record<string, unknown>[] } };
        expect(read).toStrictEqual({
            count: { rows: [row()], total: SUMS, counted: COUNTED }
        });
        expect(Object.keys(read.count)).toStrictEqual(['rows', 'total', 'counted']);
        expect(Object.keys(read.count.rows[0])).toStrictEqual([
            'folder',
            'files',
            'blank',
            'comment',
            'code',
            'todo',
            'languages'
        ]);
        expect(Object.keys((read.count.rows[0].languages as object[])[0])).toStrictEqual([
            'language',
            'files',
            'blank',
            'comment',
            'code',
            'todo'
        ]);
    });

    it('leaves out the keys a row, a language and the total carry beyond the ones read', () => {
        const read = readCount(
            body({
                rows: [row({ extra: 1, languages: [lang({ extra: 2 })] })],
                total: { ...SUMS, extra: 3 }
            })
        );
        expect(read).toStrictEqual({ count: { rows: [row()], total: SUMS, counted: COUNTED } });
    });

    it('holds a row with no language as a folder with an empty list', () => {
        const read = readCount(body({ rows: [row({ languages: [] })] }));
        expect(read).toStrictEqual({
            count: { rows: [row({ languages: [] })], total: SUMS, counted: COUNTED }
        });
    });

    it.each([
        ['a body that is a list', [body()]],
        ['a body that is null', null],
        ['a body that is a string', 'x'],
        ['a body that is a number', 3],
        ['no rows', body({ rows: undefined })],
        ['rows that are a map', body({ rows: { 0: row() } })],
        ['rows that are a string', body({ rows: 'x' })],
        ['rows that are null', body({ rows: null })]
    ])('says the rows are bad for %s', (_name, value) => {
        expect(readCount(value)).toStrictEqual(said('status.lines_bad_rows'));
    });

    it.each([
        ['a row that is a string', 'x'],
        ['a row that is null', null],
        ['a row that is a list', []],
        ['a folder that is a number', row({ folder: 3 })],
        ['no folder', row({ folder: undefined })],
        ['no languages', row({ languages: undefined })],
        ['languages that are a map', row({ languages: { 0: lang() } })],
        ['languages that are a string', row({ languages: 'x' })],
        ['a language that is null', row({ languages: [null] })],
        ['a language that is a string', row({ languages: ['x'] })],
        ['a language named by a number', row({ languages: [lang({ language: 3 })] })],
        ['a language with no name', row({ languages: [lang({ language: undefined })] })],
        ['a language with a negative sum', row({ languages: [lang({ code: -1 })] })],
        ['a good language beside a bad one', row({ languages: [lang(), lang({ blank: 1.5 })] })],
        ['a negative sum', row({ files: -1 })],
        ['a fractional sum', row({ code: 1.5 })],
        ['a sum that is NaN', row({ blank: Number.NaN })],
        ['a sum that is infinite', row({ comment: Number.POSITIVE_INFINITY })],
        ['a sum that is a string', row({ todo: '3' })],
        ['a sum that is null', row({ files: null })],
        ['a sum that is missing', row({ todo: undefined })]
    ])('names the place of a bad row: %s', (_name, bad) => {
        expect(readCount(body({ rows: [row(), bad] }))).toStrictEqual(
            said('status.lines_bad_row', 2)
        );
        expect(readCount(body({ rows: [bad, row()] }))).toStrictEqual(
            said('status.lines_bad_row', 1)
        );
    });

    it.each([
        ['no total', undefined],
        ['a total that is null', null],
        ['a total that is a list', []],
        ['a total that is a string', 'x'],
        ['a total with a negative sum', { ...SUMS, code: -1 }],
        ['a total with a fractional sum', { ...SUMS, files: 1.5 }],
        ['a total with a string sum', { ...SUMS, todo: '5' }],
        ['a total with a missing sum', { ...SUMS, blank: undefined }],
        ['a total with an infinite sum', { ...SUMS, comment: Number.POSITIVE_INFINITY }]
    ])('says the total is bad for %s', (_name, total) => {
        expect(readCount(body({ total }))).toStrictEqual(said('status.lines_bad_total'));
    });

    it.each([
        ['no time', undefined],
        ['a time that is null', null],
        ['a time that is a number', 1790000000000],
        ['a time that is empty', ''],
        ['a time that is not a date', 'not a date'],
        ['a time that is a list', [COUNTED]]
    ])('says the time is bad for %s', (_name, counted) => {
        expect(readCount(body({ counted }))).toStrictEqual(said('status.lines_bad_counted'));
    });

    it.each([['2026-09-28'], ['2026-09-28T10:00:00+02:00'], ['Sep 28 2026']])(
        'holds the time %j as written',
        (counted) => {
            expect(readCount(body({ counted }))).toStrictEqual({
                count: { rows: [row()], total: SUMS, counted }
            });
        }
    );

    it('holds a sum of zero, of negative zero and of an integer beyond the safe range', () => {
        const wide = { files: 0, blank: -0, comment: 2 ** 60, code: 1e21, todo: 0 };
        const read = readCount(body({ rows: [row({ ...wide, languages: [] })], total: wide }));
        expect(read).toStrictEqual({
            count: { rows: [row({ ...wide, languages: [] })], total: wide, counted: COUNTED }
        });
    });

    it('names the rows before the total and the total before the time', () => {
        const bad = body({ rows: [row({ files: -1 })], total: null, counted: 'x' });
        expect(readCount(bad)).toStrictEqual(said('status.lines_bad_row', 1));
        expect(readCount({ ...bad, rows: [row()] })).toStrictEqual(said('status.lines_bad_total'));
        expect(readCount({ ...bad, rows: [row()], total: SUMS })).toStrictEqual(
            said('status.lines_bad_counted')
        );
    });

    it.each([
        ['a JSON null', 200, 'null', 'status.lines_bad_body'],
        ['a JSON null', 500, 'null', 'status.lines_bad_body'],
        ['an error that is a number', 500, '{"error":3}', 'status.lines_bad_status'],
        ['an empty error', 500, '{"error":""}', 'status.lines_bad_status'],
        ['a list', 500, '[]', 'status.lines_bad_status'],
        ['a string', 500, '"x"', 'status.lines_bad_status'],
        ['a list', 200, '[]', 'status.lines_bad_rows'],
        ['a string', 200, '"x"', 'status.lines_bad_rows']
    ])('holds %s sent with status %i as that sentence', async (_name, status, text, key) => {
        answers = [{ status, text }];
        store.lines();
        await settle();
        expect(store.lines()).toStrictEqual({
            count: null,
            error: catalog[key].replace('{0}', String(status)),
            loading: false
        });
    });
});

describe('the sum of the rows under src/', () => {
    /** A row with no languages, as the sum reads only the five sums of a row. */
    const under = (name: string, sums: Sums) => folder(name, sums, []);

    /** The ten rows the real tree gives under src, each row's five sums nonzero and distinct. */
    const SOURCE_ROWS = [
        under('src', [6, 11, 22, 330, 4]),
        under('src/lib/assets', [1, 2, 3, 40, 5]),
        under('src/lib/data', [66, 101, 202, 3030, 7]),
        under('src/lib/server', [181, 303, 404, 9090, 9]),
        under('src/lib/shell', [38, 55, 66, 770, 8]),
        under('src/lib/state', [207, 313, 424, 5050, 6]),
        under('src/lib/themes', [5, 12, 23, 340, 2]),
        under('src/lib/ui', [101, 141, 252, 2020, 3]),
        under('src/lib/views', [289, 515, 626, 8080, 10]),
        under('src/routes', [38, 71, 82, 960, 11])
    ];

    it.each([
        [
            'sums every row under src and no row beside them',
            [
                [
                    under('', [3, 20, 5, 1234, 1]),
                    under('config', [14, 15, 16, 170, 12]),
                    ...SOURCE_ROWS,
                    under('srcx', [2, 4, 6, 80, 13]),
                    under('tests', [50, 60, 70, 800, 14])
                ]
            ],
            tally([932, 1524, 2104, 29710, 65])
        ],
        [
            'sums only a folder that is src or starts with src/',
            [
                [
                    under('src-old', [2, 4, 6, 80, 13]),
                    under('src/lib/ui', [101, 141, 252, 2020, 3]),
                    under('srcx', [5, 7, 9, 110, 15])
                ]
            ],
            tally([101, 141, 252, 2020, 3])
        ],
        [
            'gives null for rows with none under src',
            [
                [
                    under('', [3, 20, 5, 1234, 1]),
                    under('srcx', [2, 4, 6, 80, 13]),
                    under('tests', [1, 2, 3, 4, 5])
                ]
            ],
            null
        ]
    ])('%s', (_name, inputs, expected) => {
        for (const rows of inputs) expect(underSource(rows)).toStrictEqual(expected);
    });
});
