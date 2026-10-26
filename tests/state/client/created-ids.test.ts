// Layer 2, client-state tests. A write that makes a record answers with the record's internal id,
// the hub the server wrote and the key it gave the record, and the page takes that id as it is: it
// shows the new record under it until the snapshot or the feed holds it, and hands it back to the
// caller that opens the record's page. The page never guesses the hub from the primary, so a record
// the server wrote to another hub is shown under that hub. A refused create shows nothing.
//
// The write store is built over a stubbed `fetch` that answers every POST with the id of a record
// of the hub `lab`, while the page's primary is `hub`, and a settle stub that records what it is
// told.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWrites } from '../../../src/lib/state/client/writes.svelte.ts';
import { NO_LOOKUPS } from '../../../src/lib/state/sessions/source/write-files.ts';
import type { Settle } from '../../../src/lib/state/forms/page-entry.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

/** A fetch that answers every POST with `answer` and `status` and records each body sent. */
function answering(
    answer: Record<string, unknown>,
    posted: Record<string, unknown>[],
    status = 200
): void {
    vi.stubGlobal('fetch', (_url: string, init?: { body?: string }) => {
        posted.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        const ok = status === 200;
        return Promise.resolve({ ok, status, json: () => Promise.resolve(answer) });
    });
}

/** A settle stub that records each record it is told was added. */
function settleOf(added: [string, string, Record<string, unknown>][]): Settle {
    return {
        begin: () => 1,
        entry: () => undefined,
        added: (collection, id, saved) => {
            added.push([collection, id, saved]);
        },
        feed: () => undefined,
        career: () => undefined
    };
}

/**
 * The write store of a page whose primary hub is `hub`, and whose hub `lab` keys the Literature
 * collection, its entry of the `literature` registry, `papers`.
 */
function writesOf(settle: Settle) {
    return createWrites(
        () => ({}),
        () => false,
        {
            ...NO_LOOKUPS,
            primary: () => 'hub',
            registryKey: (hub, registry) =>
                hub === 'lab' && registry === 'literature' ? 'papers' : ''
        },
        settle
    );
}

describe('a write that makes a record', () => {
    it('shows a new entry that names no hub under the id the server answers, and hands that id back', async () => {
        const posted: Record<string, unknown>[] = [];
        answering({ ok: true, changed: ['entries'], refused: [], id: 'lab:review-it' }, posted);
        const added: [string, string, Record<string, unknown>][] = [];
        const answer = await writesOf(settleOf(added)).newEntry('tasks', { title: 'Review it' });
        expect(posted).toEqual([
            { kind: 'new-entry', collection: 'tasks', fields: { title: 'Review it' } }
        ]);
        expect(answer.id).toBe('lab:review-it');
        expect(added).toEqual([['tasks', 'lab:review-it', { title: 'Review it' }]]);
    });

    it.each([
        [
            'a lead',
            'leads',
            (writes: ReturnType<typeof writesOf>) => writes.addLead({ title: 'Postdoc' })
        ],
        [
            'a Lit Watch paper',
            'radar',
            (writes: ReturnType<typeof writesOf>) => writes.addRadarEntry({ title: 'Postdoc' })
        ]
    ])('shows %s under the id the server answers', async (_name, feed, add) => {
        answering({ ok: true, changed: ['entries'], refused: [], id: 'lab:Postdoc' }, []);
        const added: [string, string, Record<string, unknown>][] = [];
        await add(writesOf(settleOf(added)));
        expect(added).toEqual([[feed, 'lab:Postdoc', { title: 'Postdoc' }]]);
    });

    it('shows a paper saved with no hub under the id the server answers, its key the key of that id, in the collection the answered hub keys Literature by', async () => {
        answering({ ok: true, changed: ['entries'], refused: [], id: 'lab:smith2026' }, []);
        const added: [string, string, Record<string, unknown>][] = [];
        const paper = { doi: '10.1000/route.paper' };
        const answer = await writesOf(settleOf(added)).saveLiterature('hand', paper);
        expect(answer.id).toBe('lab:smith2026');
        expect(added).toEqual([['papers', 'lab:smith2026', { ...paper, key: 'smith2026' }]]);
    });

    it('shows nothing for a create the server refuses or answers with no id', async () => {
        const added: [string, string, Record<string, unknown>][] = [];
        answering({ error: 'The workspace lists no hub' }, [], 409);
        await writesOf(settleOf(added)).addLead({ title: 'Postdoc' });
        answering({ ok: true, changed: [], refused: [{ field: 'title', reason: 'taken' }] }, []);
        await writesOf(settleOf(added)).newEntry('tasks', { title: 'Review it' });
        expect(added).toEqual([]);
    });
});
