// Layer 2, route tests. Taking one recorded change back: what the writer it goes through puts in
// the file, what the log then holds.
//
// The hub, the deck file and the change log are the fixture beside this file, all under the system
// temporary directory, so no case here reaches ~/.oculus or the checkout.
//
// The cases tagged slow take 100 ms or more; every other case runs in npm test. A hook loads the
// configuration once, since the first load costs more than a later one, so no case pays for it.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, describe } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import type { Change } from '../../../../src/lib/server/core/changes.ts';
import type { WriteTarget } from '../../../../src/lib/server/edit/writes.ts';
import {
    AREA,
    GOOD,
    MANIFEST,
    TOKEN,
    changesOf,
    deckOf,
    deckTarget,
    manifestOf,
    overridesOf,
    request,
    target,
    tasksOf,
    undone,
    warmConfig
} from '../write-fixture.ts';
import { it, test } from '../../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

describe('taking a change back', () => {
    /** One write, and the change it left at the head of the log. */
    async function made(into: WriteTarget, body: unknown): Promise<Change> {
        expect((await handleWrite(request(body), TOKEN, into)).status).toBe(200);
        const [change] = changesOf(into);
        expect(change).toBeDefined();
        return change;
    }

    it('writes a manifest field back, logs the undo, and undoes the undo', async () => {
        const into = target();
        const change = await made(into, GOOD);
        expect(manifestOf(into)).toContain('a new line');

        const response = await undone(into, change);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['status.line'],
            refused: []
        });
        expect(manifestOf(into)).toBe(MANIFEST);

        const [taken] = changesOf(into);
        expect(taken).toMatchObject({
            kind: 'manifest',
            field: 'status.line',
            before: 'a new line',
            after: 'the line',
            undo: 'field',
            undoes: change.at
        });

        expect((await undone(into, taken)).status).toBe(200);
        expect(manifestOf(into)).toContain('a new line');
    });

    it('takes a created entry out again and puts a deleted one back', async () => {
        const into = target();
        const created = await made(into, {
            kind: 'new-entry',
            collection: 'tasks',
            fields: { title: 'A third task' }
        });
        expect(created.undo).toBe('create');
        expect(
            (await handleWrite(request({ kind: 'undo', at: created.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).not.toContain('A third task');

        const removed = await made(into, {
            kind: 'delete-entry',
            collection: 'tasks',
            id: 'Another task'
        });
        expect(removed.undo).toBe('delete');
        expect(
            (await handleWrite(request({ kind: 'undo', at: removed.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).toContain('Another task');
    });

    it('puts a collection entry field and a feed field back', async () => {
        const into = target();
        const entry = await made(into, {
            kind: 'entry',
            collection: 'tasks',
            id: 'Review the draft',
            fields: { status: 'done' }
        });
        expect(tasksOf(into)).toContain('status: done');
        expect(
            (await handleWrite(request({ kind: 'undo', at: entry.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).not.toContain('status: done');

        const feed = await made(into, {
            kind: 'feed-field',
            feed: 'radar',
            id: 'Paper',
            field: 'dismissed',
            value: true
        });
        const radar = (): string =>
            readFileSync(join(into.hub, 'feeds', 'literature-radar.yml'), 'utf8');
        expect(radar()).toContain('dismissed: true');
        expect(
            (await handleWrite(request({ kind: 'undo', at: feed.at }), TOKEN, into)).status
        ).toBe(200);
        expect(radar()).not.toContain('dismissed: true');
    });

    it('puts a collection order back', async () => {
        const into = target();
        const before = tasksOf(into);
        const change = await made(into, {
            kind: 'reorder',
            collection: 'tasks',
            order: ['Another task', 'Review the draft']
        });
        expect(change.undo).toBe('reorder');
        expect(tasksOf(into)).not.toBe(before);
        expect(
            (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).toBe(before);
    });

    it('puts a session override back', async () => {
        const into = target();
        const change = await made(into, { kind: 'session', id: 'sess-1', area: AREA });
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { area: AREA } } });
        expect(
            (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
        ).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: {} });
    });

    it('puts a subtask line back as it was', async () => {
        const into = target();
        const change = await made(into, {
            kind: 'subtask',
            target: { collection: 'tasks', id: 'Review the draft' },
            key: '0',
            action: 'done'
        });
        expect(tasksOf(into)).toContain('done: true');
        expect(
            (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).not.toContain('done: true');
        expect(tasksOf(into)).toContain('- { do: read it }');
    });

    it(
        "puts the deck's two lists back to what the save before them left",
        { tags: ['slow'] },
        async () => {
            const into = deckTarget();
            const order = ['title', 'alpha', 'framing:engine', 'gamma', 'closing'];
            // A deck of no slides is not a state the writer accepts, so the very first save has no
            // earlier lists to put back; the save after it has, and that is the one an undo
            // addresses.
            const first = await made(into, { kind: 'deck', selection: ['title', 'alpha'], order });
            expect(first.kind).toBe('deck');
            const change = await made(into, { kind: 'deck', selection: ['closing'], order });
            expect(
                (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
            ).toBe(200);
            const deck = (parse(deckOf(into)) as { deck: Record<string, unknown> }).deck;
            expect(deck.selection).toEqual(['title', 'alpha']);
            expect(deck.slide_order).toEqual(order);
        }
    );

    it('puts a career host and a subtask line back', async () => {
        const into = target();
        const host = await made(into, { kind: 'host', name: 'Naesens', status: 'candidate' });
        const career = (): string => readFileSync(join(into.hub, 'registries/career.yml'), 'utf8');
        expect(career()).toContain('status: "candidate"');
        expect(
            (await handleWrite(request({ kind: 'undo', at: host.at }), TOKEN, into)).status
        ).toBe(200);
        expect(career()).toContain('status: "warm"');

        const added = await made(into, {
            kind: 'subtask-add',
            target: { collection: 'tasks', id: 'Review the draft' },
            fields: { do: 'write it up' }
        });
        expect(added.undo).toBe('create');
        expect(tasksOf(into)).toContain('write it up');
        expect(
            (await handleWrite(request({ kind: 'undo', at: added.at }), TOKEN, into)).status
        ).toBe(200);
        expect(tasksOf(into)).not.toContain('write it up');
    });

    it('takes an added lead out again, and puts a deleted one back as it was recorded', async () => {
        const into = target();
        const leads = (): string =>
            readFileSync(join(into.hub, 'feeds', 'position-leads.yml'), 'utf8');
        const added = await made(into, { kind: 'lead-add', fields: { title: 'A fresh lead' } });
        expect(added.undo).toBe('create');
        expect(leads()).toContain('A fresh lead');
        expect(
            (await handleWrite(request({ kind: 'undo', at: added.at }), TOKEN, into)).status
        ).toBe(200);
        expect(leads()).not.toContain('A fresh lead');

        // Deleting the one lead leaves the `entries:` key with nothing under it, which is the
        // file an undo has to write the entry back into.
        const gone = await made(into, { kind: 'feed-delete', feed: 'leads', id: 'Lead' });
        expect(gone.before).toEqual({ title: 'Lead', status: 'open' });
        expect(leads()).not.toContain('- title: "Lead"');
        expect(
            (await handleWrite(request({ kind: 'undo', at: gone.at }), TOKEN, into)).status
        ).toBe(200);
        // What comes back is what the record holds and nothing derived: no date, no fit.
        const back = parse(leads()) as { entries: Record<string, unknown>[] };
        expect(back.entries).toEqual([{ title: 'Lead', status: 'open' }]);
    });

    it('takes an added Lit Watch entry out again', async () => {
        const into = target();
        const radarFile = join(into.hub, 'feeds', 'literature-radar.yml');
        const radar = (): string => readFileSync(radarFile, 'utf8');
        const fields = {
            title: 'A paper found by the search',
            authors: 'Ada Lovelace',
            year: 2025,
            url: 'https://doi.org/10.1000/abc',
            bucket: 'adjacent',
            relevance: 'med'
        };
        const addRadar = (): Promise<Change> => made(into, { kind: 'radar-add', fields });
        const undo = async (change: Change): Promise<void> => {
            expect(
                (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
            ).toBe(200);
        };

        // The file as it is, then added to and taken back: the same bytes.
        const before = radar();
        const added = await addRadar();
        expect(added.undo).toBe('create');
        expect(radar()).toContain('A paper found by the search');
        await undo(added);
        expect(radar()).toBe(before);

        // The same through a file whose list is written `entries: []`, which the add rewrites.
        writeFileSync(radarFile, 'meta:\n  last_run: 2026-09-27\nentries: []\n');
        const empty = radar();
        const first = await addRadar();
        expect(radar()).not.toBe(empty);
        await undo(first);
        expect(radar()).toBe(empty);

        // A file changed after the add: a line the scout appended below the entry stays, and so
        // does a line put at the head, which moves the entry from where the record says it is.
        writeFileSync(radarFile, before);
        const appended = await addRadar();
        writeFileSync(radarFile, `${radar()}  - title: "Scout paper"\n    bucket: adjacent\n`);
        await undo(appended);
        expect(radar()).toBe(`${before}  - title: "Scout paper"\n    bucket: adjacent\n`);

        writeFileSync(radarFile, before);
        const moved = await addRadar();
        writeFileSync(radarFile, `# a new head line\n${radar()}`);
        await undo(moved);
        expect(radar()).toBe(`# a new head line\n${before}`);
    });
});
