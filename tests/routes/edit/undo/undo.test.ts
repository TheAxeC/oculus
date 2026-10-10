// Layer 2, route tests. Taking one recorded change back: what the writer it goes through puts in
// the file, what the log then holds.
//
// The hub, the deck file and the change log are the fixture beside this file, all under the system
// temporary directory, so no case here reaches ~/.oculus or the checkout.
//
// The cases tagged slow take 100 ms or more; every other case runs in npm test. A hook loads the
// configuration once, since the first load costs more than a later one, so no case pays for it.

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
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
    DECK_ORDER,
    DECK_PATH,
    deckOf,
    deckTarget,
    manifestOf,
    overridesOf,
    request,
    sideTarget,
    SIDE_MANIFEST,
    target,
    tasksOf,
    undoneBack,
    undone,
    warmConfig
} from '../write-fixture.ts';
import { it, test } from '../../../fixtures/scratch.ts';
import { present } from '../../../fixtures/present.ts';
import { MANIFEST as APP_MANIFEST, notesFiles, routeSetup } from '../../apps/apps-fixture.ts';

test.beforeAll(warmConfig);

type Files = ReturnType<typeof sideTarget>['files'];

/**
 * The manifest writes of the first table: the research project, then each side project's snooze
 * set and woken. `now` is the value the write left and `was` the value it took the field from.
 */
const FIELD_ROWS = [
    {
        name: 'a research project',
        body: GOOD,
        field: 'status.line',
        now: 'a new line',
        was: 'the line',
        original: MANIFEST,
        read: (into: WriteTarget): string => manifestOf(into)
    },
    ...(['side:idea', 'root:r'] as const).flatMap((id) => [
        {
            name: `${id}: a snooze set`,
            body: { kind: 'manifest', id, fields: { snooze: '2026-12-01' } },
            field: 'snooze',
            now: '2026-12-01',
            was: '2026-11-01',
            original: SIDE_MANIFEST,
            read: (_into: WriteTarget, files: Files): string => readFileSync(files[id], 'utf8')
        },
        {
            name: `${id}: a snooze woken`,
            body: { kind: 'manifest', id, fields: { snooze: '' } },
            field: 'snooze',
            now: null,
            was: '2026-11-01',
            original: SIDE_MANIFEST,
            read: (_into: WriteTarget, files: Files): string => readFileSync(files[id], 'utf8')
        }
    ])
];

/** The subtask writes of the second table: a collection entry's line, then each side project's. */
const LINE_ROWS = [
    {
        name: 'a collection entry: a tick',
        body: {
            kind: 'subtask',
            target: { collection: 'tasks', id: 'Review the draft' },
            key: '0',
            action: 'done'
        },
        read: (into: WriteTarget): string => tasksOf(into)
    },
    ...(['side:idea', 'root:r'] as const).flatMap((id) => [
        {
            name: `${id}: a tick`,
            body: { kind: 'subtask', target: { id }, key: '0', action: 'done' },
            read: (_into: WriteTarget, files: Files): string => readFileSync(files[id], 'utf8')
        },
        {
            name: `${id}: an added line`,
            body: { kind: 'subtask-add', target: { id }, fields: { do: 'write it up' } },
            read: (_into: WriteTarget, files: Files): string => readFileSync(files[id], 'utf8')
        }
    ])
];

describe('taking a change back', () => {
    /** One write, and the change it left at the head of the log. */
    async function made(into: WriteTarget, body: unknown, row = ''): Promise<Change> {
        expect((await handleWrite(request(body), TOKEN, into)).status, row).toBe(200);
        const [change] = changesOf(into);
        expect(change).toBeDefined();
        return change;
    }

    it.each(FIELD_ROWS)(
        'writes a manifest field back, logs the undo, and undoes the undo',
        async (row) => {
            const { into, files } = sideTarget();
            const read = (): string => row.read(into, files);
            const change = await made(into, row.body, row.name);
            const written = read();
            expect(written, row.name).not.toBe(row.original);

            const response = await undone(into, change);
            expect(response.status, row.name).toBe(200);
            expect(await response.json(), row.name).toEqual({
                ok: true,
                changed: [row.field],
                refused: []
            });
            expect(read(), row.name).toBe(row.original);

            const [taken] = changesOf(into);
            expect(taken, row.name).toMatchObject({
                kind: 'manifest',
                field: row.field,
                before: row.now,
                after: row.was,
                undo: 'field',
                undoes: change.at
            });

            expect((await undone(into, taken)).status, row.name).toBe(200);
            expect(read(), row.name).toBe(written);
        }
    );

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

    it('puts a deleted entry back with its subtasks, each as the file held it', async () => {
        const into = target();
        const file = join(into.hub, 'tasks', 'tasks.yml');
        writeFileSync(
            file,
            [
                'title: Tasks',
                'schema:',
                '  - { field: title, type: text }',
                'entries:',
                '  - title: "With subtasks"',
                '    status: open',
                '    subtasks:',
                '      - { do: a, done: true }',
                '      - { do: b, deadline: 2026-11-01 }',
                '  - title: "Another task"',
                '    status: open',
                ''
            ].join('\n')
        );
        const entries = (): Record<string, unknown>[] =>
            (parse(readFileSync(file, 'utf8')) as { entries: Record<string, unknown>[] }).entries;
        const before = entries();
        const removed = await made(into, {
            kind: 'delete-entry',
            collection: 'tasks',
            id: 'With subtasks'
        });
        expect(entries().map((one) => one.title)).toEqual(['Another task']);
        expect((await undone(into, removed)).status).toBe(200);
        const back = entries().find((one) => one.title === 'With subtasks');
        expect(back).toEqual(before[0]);
        expect(back?.subtasks).toEqual([
            { do: 'a', done: true },
            { do: 'b', deadline: '2026-11-01' }
        ]);
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

    it.each(LINE_ROWS)('puts a subtask line back as it was', async (row) => {
        const { into, files } = sideTarget();
        const read = (): string => row.read(into, files);
        const original = read();
        const change = await made(into, row.body, row.name);
        expect(read(), row.name).not.toBe(original);
        expect(
            (await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into)).status
        ).toBe(200);
        expect(read(), row.name).toBe(original);
    });

    it('puts the lists of a deck write back, each record on its own, and a record keyed by the bare group name', async () => {
        const into = deckTarget();
        const file = join(into.hub, DECK_PATH);
        const before = deckOf(into);
        const group = (name: string, base: string[], slides: string[]) => ({
            group: name,
            base,
            slides
        });
        await made(into, {
            kind: 'deck-slides',
            root: 'hub',
            path: DECK_PATH,
            groups: [group('pillars', ['alpha'], ['beta', 'alpha'])],
            order: { base: DECK_ORDER, entries: ['slides:pillars', 'intro.md', 'slides:more'] }
        });
        const [order, list] = changesOf(into);
        expect([list.key, order.key]).toEqual(['slides:pillars', 'order']);
        const written = deckOf(into);
        expect(written).not.toBe(before);

        const orderOf = (text: string): string => /\norder:[\s\S]*$/.exec(text)?.[0] ?? '';
        const middle = written.replace(orderOf(written), orderOf(before));
        const orderBack = await undoneBack(into, order, file, middle);
        expect(orderBack).toMatchObject({ kind: 'deck-slides', key: 'order', undoes: order.at });
        expect((await undone(into, list)).status).toBe(200);
        expect(deckOf(into)).toBe(before);
        const [listBack] = changesOf(into);
        expect(listBack).toMatchObject({ key: 'slides:pillars', undoes: list.at });

        // A record keyed by the group's bare name is undone as that group's list.
        const bare = { ...list, key: 'pillars', before: ['alpha'], after: ['beta', 'alpha'] };
        writeFileSync(file, written);
        writeFileSync(
            into.changes?.file ?? '',
            `${JSON.stringify({ ...bare, at: '2026-01-01T00:00:00.000Z' })}\n`
        );
        const [bareKeyed] = changesOf(into);
        const back = await undoneBack(
            into,
            bareKeyed,
            file,
            before.replace(orderOf(before), orderOf(written))
        );
        expect(back.undoes).toBe(bareKeyed.at);
    });

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

    it('takes an added Lit Watch entry out again', { tags: ['slow'] }, async () => {
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
    it('puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone', async () => {
        const setup = routeSetup({ machine: notesFiles(APP_MANIFEST) });
        const data = join(setup.fixture.base, 'data');
        const into = target();
        into.apps = { held: setup.held, data, maxKb: 256 };
        into.changes = { ...present(into.changes, 'the change log'), undoDir: join(data, '.undo') };
        const headers = { 'x-oculus-app': 'app:notes', 'x-oculus-write-kind': 'app-store' };
        const store = async (value: unknown): Promise<Change> => {
            const response = await handleWrite(request({ store: value }, headers), TOKEN, into);
            expect(response.status).toBe(200);
            return changesOf(into)[0];
        };
        const file = present(
            setup.held().apps.find((one) => one.id === 'app:notes'),
            'the app notes'
        ).row.storeFile;
        const held = (): unknown => JSON.parse(readFileSync(file, 'utf8'));
        expect(resolve(file).startsWith(resolve(data) + sep)).toBe(true);

        // The store written twice, and the second write taken back: the value before returns.
        await store({ n: 1 });
        const second = await store({ n: 2 });
        expect((await undone(into, second)).status).toBe(200);
        expect(held()).toEqual({ n: 1 });
        expect(changesOf(into)[0]).toMatchObject({ kind: 'app-store', undoes: second.at });

        // A store another write moved since is refused and left as it is.
        const third = await store({ n: 3 });
        await store({ n: 4 });
        const moved = await undone(into, third);
        expect(moved.status).toBe(409);
        expect(await moved.json()).toEqual({ error: 'moved' });
        expect(held()).toEqual({ n: 4 });

        // A record whose kept values are gone has nothing to put back.
        const fifth = await store({ n: 5 });
        rmSync(join(data, '.undo', `${fifth.at}.json`));
        const gone = await undone(into, fifth);
        expect(gone.status).toBe(404);
        expect(await gone.json()).toEqual({ error: 'nothing' });
        expect(held()).toEqual({ n: 5 });
    });
});
