// The change-log store: what it asks the endpoint for, what it holds, and how "load older" walks
// back through the pages.
//
// The fetch is doubled, so nothing here opens a socket or reads a file: a case states what the
// endpoint answers and asserts what the store holds after it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChanges, matching } from '../../../src/lib/state/sessions/changes.svelte.ts';
import type { Change, ChangesStore } from '../../../src/lib/state/sessions/changes.svelte.ts';

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
    store = createChanges();
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

    it('holds what a refused request said and stops waiting', async () => {
        answers = [{ ok: false, body: { error: 'origin' } }];
        store.rows();
        await settle();
        expect(store.error()).toBe('origin');
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
    // revert: src/lib/state/sessions/changes.svelte.ts:52 => return `${row.file} ${row.key} ${row.field} ${String(row.after)}`.toLowerCase();
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
