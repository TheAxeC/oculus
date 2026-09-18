// Taking one recorded change back: what the writer it goes through puts in the file, what the log
// then holds, and the refusal an address that has moved since gets.
//
// The hub, the deck file and the change log are the fixture beside this file, all under the system
// temporary directory, so no case here reaches ~/.oculus or the checkout.

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, expect, describe, it } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../src/lib/server/writes.ts';
import type { Change } from '../../src/lib/server/changes.ts';
import type { WriteTarget } from '../../src/lib/server/writes.ts';
import {
    AREA,
    GOOD,
    MANIFEST,
    TASKS,
    TOKEN,
    changesOf,
    deckOf,
    deckTarget,
    manifestOf,
    overridesOf,
    request,
    target,
    tasksOf
} from './write-fixture.ts';
import { sweepScratch } from '../scratch.ts';

afterAll(sweepScratch);

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

        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['status.line'],
            refused: []
        });
        expect(manifestOf(into)).toBe(MANIFEST);

        const [undone] = changesOf(into);
        expect(undone).toMatchObject({
            kind: 'manifest',
            field: 'status.line',
            before: 'a new line',
            after: 'the line',
            undo: 'field',
            undoes: change.at
        });

        expect(
            (await handleWrite(request({ kind: 'undo', at: undone.at }), TOKEN, into)).status
        ).toBe(200);
        expect(manifestOf(into)).toContain('a new line');
    });

    it('refuses with `moved` when the field has changed since, and leaves the file alone', async () => {
        const into = target();
        const change = await made(into, GOOD);
        await handleWrite(
            request({ kind: 'manifest', id: 'alpha', fields: { 'status.line': 'later still' } }),
            TOKEN,
            into
        );
        const held = manifestOf(into);

        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({ error: 'moved' });
        expect(manifestOf(into)).toBe(held);
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

    it('records a dismissed lead as a status write and reopens it on the undo', async () => {
        const into = target();
        const leads = (): string =>
            readFileSync(join(into.hub, 'feeds', 'position-leads.yml'), 'utf8');
        const change = await made(into, {
            kind: 'feed-field',
            feed: 'leads',
            id: 'Lead',
            field: 'status',
            value: 'dismissed'
        });
        expect(leads()).toContain('status: dismissed');
        expect(change).toMatchObject({
            kind: 'feed-field',
            key: 'Lead',
            field: 'status',
            before: 'open',
            after: 'dismissed',
            undo: 'field'
        });

        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['status'], refused: [] });
        expect(leads()).toContain('status: open');
        expect(leads()).not.toContain('status: dismissed');
        expect(changesOf(into)[0]).toMatchObject({ undoes: change.at, after: 'open' });
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

    it("puts the deck's two lists back to what the save before them left", async () => {
        const into = deckTarget();
        const order = ['title', 'alpha', 'framing:engine', 'gamma', 'closing'];
        // A deck of no slides is not a state the writer accepts, so the very first save has no
        // earlier lists to put back; the save after it has, and that is the one an undo addresses.
        const first = await made(into, { kind: 'deck', selection: ['title', 'alpha'], order });
        expect(first.kind).toBe('deck');
        const change = await made(into, { kind: 'deck', selection: ['closing'], order });
        expect(
            (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
        ).toBe(200);
        const deck = (parse(deckOf(into)) as { deck: Record<string, unknown> }).deck;
        expect(deck.selection).toEqual(['title', 'alpha']);
        expect(deck.slide_order).toEqual(order);
    });

    it('puts a dismissed session back, and takes a dismissal back', async () => {
        const into = target();
        const hid = await made(into, { kind: 'session', id: 'sess-1', hidden: true });
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { hidden: true } } });
        const shown = await made(into, { kind: 'session', id: 'sess-1', hidden: false });
        expect(shown).toMatchObject({ field: 'hidden', before: true, after: null });
        expect(overridesOf(into)).toEqual({ sessions: {} });

        // Undoing the restore dismisses the session again.
        expect(
            (await handleWrite(request({ kind: 'undo', at: shown.at }), TOKEN, into)).status
        ).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { hidden: true } } });

        // Undoing the dismissal itself brings the session back.
        expect((await handleWrite(request({ kind: 'undo', at: hid.at }), TOKEN, into)).status).toBe(
            200
        );
        expect(overridesOf(into)).toEqual({ sessions: {} });
    });

    it('puts a career host and a subtask line back', async () => {
        const into = target();
        const host = await made(into, { kind: 'host', name: 'Naesens', status: 'candidate' });
        const career = (): string => readFileSync(join(into.hub, 'CAREER.yml'), 'utf8');
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

        // Deleting the one lead leaves the `entries:` key with nothing under it, which is the file
        // an undo has to write the entry back into.
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

    it('puts a deleted collection entry back as it was recorded', async () => {
        const into = target();
        const gone = await made(into, {
            kind: 'delete-entry',
            collection: 'tasks',
            id: 'Another task'
        });
        expect(gone.before).toEqual({ title: 'Another task', status: 'open' });
        expect(
            (await handleWrite(request({ kind: 'undo', at: gone.at }), TOKEN, into)).status
        ).toBe(200);
        const held = parse(tasksOf(into)) as { entries: Record<string, unknown>[] };
        expect(held.entries.find((one) => one.title === 'Another task')).toEqual(gone.before);
    });

    it('answers `refused` for an undo whose writer wrote nothing, and says nothing happened', async () => {
        const into = target();
        // An empty metalist and an absent one are one thing in the file, so putting the empty list
        // back writes no byte; the endpoint says so rather than reporting a value that is not back.
        writeFileSync(
            join(into.hub, 'tasks', 'tasks.yml'),
            TASKS.replace(
                '    status: open\n    subtasks:',
                '    status: open\n    meta: []\n    subtasks:'
            )
        );
        const held = tasksOf(into);
        const change = await made(into, {
            kind: 'entry',
            collection: 'tasks',
            id: 'Review the draft',
            fields: { meta: [] }
        });
        expect(change).toMatchObject({ field: 'meta', before: [], after: null });
        expect(tasksOf(into)).not.toBe(held);

        const written = tasksOf(into);
        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'refused', refused: [] });
        expect(tasksOf(into)).toBe(written);
    });

    it('answers `gone` when what the write addressed is no longer in the hub', async () => {
        const into = target();
        const change = await made(into, GOOD);
        rmSync(join(into.hub, 'projects', 'manuscripts', 'alpha'), { recursive: true });
        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'gone' });
    });

    it('answers `unknown` for a moment the log does not hold', async () => {
        const into = target();
        const response = await handleWrite(
            request({ kind: 'undo', at: '2020-01-01T00:00:00.000Z' }),
            TOKEN,
            into
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'unknown' });
    });

    it('answers `nothing` for a write that cannot be taken back', async () => {
        const into = target();
        const change = await made(into, { kind: 'new-idea', fields: { id: 'fresh-idea' } });
        expect(change.undo).toBe('none');
        const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'nothing' });
    });

    it('writes no change log at all when the target names none', async () => {
        const into = target();
        const bare: WriteTarget = { ...into, changes: undefined };
        expect((await handleWrite(request(GOOD), TOKEN, bare)).status).toBe(200);
        expect(changesOf(into)).toEqual([]);
    });
});
