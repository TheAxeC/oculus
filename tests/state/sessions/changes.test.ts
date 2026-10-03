// The change-log store: what it asks the endpoint for, what it holds, and how "load older" walks
// back through the pages.
//
// The fetch is doubled, so nothing here opens a socket or reads a file: a case states what the
// endpoint answers and asserts what the store holds after it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChanges, matching } from '../../../src/lib/state/sessions/changes.svelte.ts';
import type { Change, ChangesStore } from '../../../src/lib/state/sessions/changes.svelte.ts';
import { createQueries } from '../../../src/lib/state/client/queries.svelte.ts';
import { stubHeld, refused, unreadable } from '../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** One change, with whatever the case cares about over the rest. */
function change(at: string, over: Partial<Change> = {}): Change {
    return {
        at,
        kind: 'manifest',
        file: 'projects/manuscripts/alpha/project.yml',
        key: 'alpha',
        field: 'status.line',
        before: 'one',
        after: 'two',
        undo: 'field',
        ...over
    };
}

/** The URLs the doubled fetch was asked for, in order. */
let asked: string[] = [];

/** What the doubled fetch answers next, one answer per call. */
let answers: { ok: boolean; body: unknown }[] = [];

let store: ChangesStore;

beforeEach(() => {
    asked = [];
    answers = [];
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        const next = answers.shift() ?? { ok: true, body: { changes: [], page: 50 } };
        return Promise.resolve({
            ok: next.ok,
            status: next.ok ? 200 : 500,
            json: () => Promise.resolve(next.body)
        } as Response);
    });
    store = createChanges(createQueries());
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/** Let the scheduled microtask and the answer it awaits run. */
async function settle(): Promise<void> {
    await new Promise((wake) => setTimeout(wake, 0));
}

describe('the change store', () => {
    it('asks for the first page on the first read and holds what came back', async () => {
        answers = [{ ok: true, body: { changes: [change('2026-09-15T10:00:00.000Z')], page: 50 } }];
        expect(store.rows()).toEqual([]);
        expect(store.loading()).toBe(true);
        await settle();
        expect(asked).toEqual(['/api/changes']);
        expect(store.rows().map((one) => one.at)).toEqual(['2026-09-15T10:00:00.000Z']);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBe('');
    });

    it('asks on whichever read a view makes first, since it draws the waiting line first', async () => {
        expect(store.loading()).toBe(true);
        await settle();
        expect(asked).toEqual(['/api/changes']);
        expect(store.loading()).toBe(false);
    });

    it('asks once however many times the rows are read', async () => {
        store.rows();
        store.rows();
        await settle();
        store.rows();
        await settle();
        expect(asked).toEqual(['/api/changes']);
    });

    it('says there may be older changes only when the page came back full', async () => {
        answers = [{ ok: true, body: { changes: [change('a'), change('b')], page: 2 } }];
        store.rows();
        await settle();
        expect(store.more()).toBe(true);

        answers = [{ ok: true, body: { changes: [change('c')], page: 2 } }];
        store.reload();
        await settle();
        expect(store.more()).toBe(false);
    });

    it('asks for the page before the oldest row and adds it below the rows held', async () => {
        answers = [
            { ok: true, body: { changes: [change('2026-09-15T12:00:00.000Z')], page: 1 } },
            { ok: true, body: { changes: [change('2026-09-15T11:00:00.000Z')], page: 1 } }
        ];
        store.rows();
        await settle();
        store.older();
        await settle();
        expect(asked).toEqual(['/api/changes', '/api/changes?before=2026-09-15T12%3A00%3A00.000Z']);
        expect(store.rows().map((one) => one.at)).toEqual([
            '2026-09-15T12:00:00.000Z',
            '2026-09-15T11:00:00.000Z'
        ]);
    });

    // Revert: in older of state/sessions/changes.svelte.ts, refetch with 'replace' instead of
    // 'drop'.
    it('sends nothing for an older page while a request is out, and adds the page once it can', async () => {
        answers = [
            { ok: true, body: { changes: [change('2026-09-15T12:00:00.000Z')], page: 1 } },
            { ok: true, body: { changes: [change('2026-09-15T11:00:00.000Z')], page: 1 } }
        ];
        store.rows();
        await settle();
        expect(store.more()).toBe(true);

        const { land } = stubHeld(asked);
        store.reload();
        await settle();
        store.older();
        store.older();
        await settle();
        expect(asked).toEqual(['/api/changes', '/api/changes']);

        land(
            Response.json(
                { changes: [change('2026-09-15T12:00:00.000Z')], page: 1 },
                { status: 200 }
            )
        );
        await settle();
        store.older();
        await settle();
        expect(asked).toHaveLength(3);
    });

    it('asks for nothing when there is no oldest row to walk back from', async () => {
        store.older();
        await settle();
        expect(asked).toEqual([]);
    });

    it('reads the first page again on a reload, replacing what it held', async () => {
        answers = [
            { ok: true, body: { changes: [change('a')], page: 50 } },
            { ok: true, body: { changes: [change('b'), change('c')], page: 50 } }
        ];
        store.rows();
        await settle();
        store.reload();
        await settle();
        expect(asked).toEqual(['/api/changes', '/api/changes']);
        expect(store.rows().map((one) => one.at)).toEqual(['b', 'c']);
    });

    it('holds the refusal sentence for a refused request and stops waiting', async () => {
        answers = [{ ok: false, body: { error: 'origin' } }];
        store.rows();
        await settle();
        expect(store.error()).toBe(refused(500));
        expect(store.loading()).toBe(false);
        expect(store.rows()).toEqual([]);
    });

    it('takes rows put in by hand, for a page that is rendered without a fetch', () => {
        store.hold([change('a')], true);
        expect(store.rows().map((one) => one.at)).toEqual(['a']);
        expect(store.loading()).toBe(false);
        expect(store.more()).toBe(true);
        expect(asked).toEqual([]);
    });
});

describe('the rows a filter keeps', () => {
    it('are matched against the file, the key and the field, and nothing else', () => {
        const rows = [
            change('a', { after: 'a new line' }),
            change('b', { file: 'tasks/tasks.yml', key: 'Review the draft', field: 'status' })
        ];
        expect(matching(rows, '').map((one) => one.at)).toEqual(['a', 'b']);
        expect(matching(rows, 'TASKS').map((one) => one.at)).toEqual(['b']);
        expect(matching(rows, 'status.line').map((one) => one.at)).toEqual(['a']);
        // The values are not matched: a filter over them would hide a row for a word it never shows
        // in the column the reader typed into.
        expect(matching(rows, 'a new line')).toEqual([]);
    });
});

describe('an answer whose fields are of the wrong type', () => {
    const row = change('2026-09-15T10:00:00.000Z');
    const NOTHING = { rows: [], more: false, error: '', loading: false };

    /** What a fresh store holds once the endpoint answered `text` with `status`. */
    async function heldAfter(text: string, status = 200) {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        const fresh = createChanges(createQueries());
        fresh.rows();
        await settle();
        return {
            rows: fresh.rows(),
            more: fresh.more(),
            error: fresh.error(),
            loading: fresh.loading()
        };
    }

    it.each([
        ['changes that are null', { changes: null, page: 2 }, NOTHING],
        ['a page of 0 over no rows', { changes: [], page: 0 }, { ...NOTHING, more: true }],
        ['a list as the body', [], NOTHING],
        ['an empty map as the body', {}, NOTHING]
    ])('answers %s as the rows it names', async (_name, body, expected) => {
        expect(await heldAfter(JSON.stringify(body))).toStrictEqual(expected);
    });

    it('is not full when the page is infinite, and not asked for when the page is absent', async () => {
        const infinite = `{"changes":${JSON.stringify([row])},"page":1e999}`;
        expect(await heldAfter(infinite)).toStrictEqual({ ...NOTHING, rows: [row] });
        const absent = `{"changes":${JSON.stringify([row])}}`;
        expect(await heldAfter(absent)).toStrictEqual({ ...NOTHING, rows: [row] });
    });

    it('answers a refusal as the refusal sentence, whatever text it carries', async () => {
        const said = { ...NOTHING, error: refused(500) };
        expect(await heldAfter('{"error":"x"}', 500)).toStrictEqual(said);
        expect(await heldAfter('[]', 500)).toStrictEqual(said);
    });

    it('answers a refusal that is a word of the catalog as that word sentence', async () => {
        expect(await heldAfter('{"error":"outside"}', 400)).toStrictEqual({
            ...NOTHING,
            error: t('files.refused_outside')
        });
    });

    it.each([
        ['changes that are a string', { changes: 'x', page: 2 }, NOTHING],
        ['changes that are a map', { changes: {}, page: 2 }, NOTHING],
        [
            'changes holding a null, a number and a row',
            { changes: [null, 3, row], page: 1 },
            { ...NOTHING, rows: [row], more: true }
        ],
        ['a page that is a string', { changes: [row], page: '1' }, { ...NOTHING, rows: [row] }]
    ])(
        'answers %s as the rows that are well-formed, and the page as a number',
        async (_name, body, expected) => {
            expect(await heldAfter(JSON.stringify(body))).toStrictEqual(expected);
        }
    );

    it('answers a refusal whose error is a number as the refusal sentence', async () => {
        const held = await heldAfter('{"error":3}', 500);
        expect(held).toStrictEqual({ ...NOTHING, error: refused(500) });
    });

    it('answers a body that is null or not JSON as the unreadable sentence with its status', async () => {
        for (const text of ['null', 'nope']) {
            const [fine, failed] = [await heldAfter(text), await heldAfter(text, 500)];
            expect(fine).toStrictEqual({ ...NOTHING, error: unreadable(200) });
            expect(failed).toStrictEqual({ ...NOTHING, error: unreadable(500) });
        }
    });

    it('answers a row missing one of the four fields of a change as left out', async () => {
        const body = { changes: [{ ...row, at: 3 }, { ...row, kind: null }, { at: 'x' }, row] };
        expect(await heldAfter(JSON.stringify(body))).toStrictEqual({ ...NOTHING, rows: [row] });
    });

    it('keeps a row of a line oculus did not write, which lacks the key and the values', async () => {
        const bare = { at: 'a', kind: 'k', file: 'f', field: 'x' };
        const held = await heldAfter(JSON.stringify({ changes: [bare], page: 5 }));
        expect(held).toStrictEqual({ ...NOTHING, rows: [bare] });
    });
});
