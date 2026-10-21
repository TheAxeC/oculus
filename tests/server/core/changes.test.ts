// The change log: what each writer records of its own write.
//
// The hub is synthetic, under the system temporary directory, and so is the log: the target's
// `changes` path is inside that directory and is asserted to be before anything is written, so
// nothing here reaches ~/.oculus/changes.jsonl.
//
// The writes go through handleWrite rather than through each writer, because the record is only
// complete once the route has stamped the time and the body kind on it: what a case asserts is the
// line the log holds, which is what the History view reads.
//
// A describe whose cases take 100 ms or more in a run of its own is tagged slow, and so is a single
// case that does.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { undoChange } from '../../../src/lib/server/edit/writes/undo.ts';
import { logChanges, readChanges, writtenWith } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { Hub } from '../../../src/lib/server/core/channels.ts';
import type { Change, ChangeLog } from '../../../src/lib/server/core/changes.ts';
import type { PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    DECK_ORDER,
    DECK_PATH,
    deckTarget,
    personalTarget,
    targetOver
} from '../../routes/edit/write-fixture.ts';

const MANIFEST =
    'id: alpha\ntier: projects\ntype: active\ntitle: "A title"\nstatus:\n  line: "the line"\n';

const TASKS =
    'title: Tasks\nschema:\n  - { field: title, type: text }\nentries:\n  - title: "Review the draft"\n    status: open\n    subtasks:\n      - { do: read it }\n\n  - title: "Another task"\n    status: open\n';

const VENUES =
    'title: Venues\nschema:\n  - { field: name, type: text }\n  - { field: id, type: text }\nvenues:\n  - name: Existing Venue\n    id: existing\n';

const LITERATURE =
    'title: Literature\nschema:\n  - { field: key, type: text, required: true }\n  - { field: title, type: text, required: true }\n  - { field: authors, type: tags }\n  - { field: year, type: text }\n  - { field: doi, type: text }\n  - { field: url, type: text }\n  - { field: source, type: select, options: [search, lit-watch, hand] }\n  - { field: added, type: date }\nentries: []\n';

const CAREER = 'title: Career\nhosts:\n  - { name: "Naesens", status: "warm" }\n';
const RADAR = 'meta: {}\nentries:\n  - title: "Paper"\n';
const LEADS = `meta: {}
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, applied, declined] }
  - { field: date, type: date }
entries:
  - title: "Lead"
`;

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';

/**
 * A synthetic hub with a log beside it, every path asserted to be under the temporary directory.
 */
function target(keep = 500): PrimaryTarget {
    const dir = scratchDir('oculus-changes-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [path, body] of [
        ['.oculus/data/academic/tasks.yml', TASKS],
        ['.oculus/data/research/venues.yml', VENUES],
        ['.oculus/data/academic/career.yml', CAREER],
        ['.oculus/data/literature/radar.yml', RADAR],
        ['.oculus/data/academic/leads.yml', LEADS],
        ['.oculus/data/literature/literature.yml', LITERATURE]
    ]) {
        const file = join(dir, path);
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, body);
    }
    const changes = join(dir, 'changes.jsonl');
    const overrides = join(dir, 'sessions.json');
    const bookmarks = join(dir, 'bookmarks.yml');
    for (const path of [changes, overrides, bookmarks]) {
        expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    }
    return targetOver(dir, { overrides, bookmarks, changes }, keep);
}

/** The log of a target, which every case asserts is where the lines went. */
function logOf(into: PrimaryTarget): ChangeLog {
    const log = into.changes;
    if (log === undefined) throw new Error('the target carries no change log');
    return log;
}

/** One request as the page makes it. */
function request(body: unknown): Request {
    return new Request(`http://${HOST}/api/write`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(body)
    });
}

/** One write, and the lines it left in the log, newest first. */
async function written(into: PrimaryTarget, body: unknown, row = ''): Promise<Change[]> {
    const response = await handleWrite(request(body), TOKEN, into);
    expect(response.status, row).toBe(200);
    return readChanges(logOf(into));
}

type Files = ReturnType<typeof personalTarget>['files'];

/**
 * The manifest writes of the first table: the research project, then a personal project of the hub,
 * and a project of a served root; every file is recorded by its absolute path.
 */
const MANIFEST_ROWS = [
    {
        name: 'a research project',
        id: 'alpha',
        fields: { 'status.line': 'a new line' },
        file: (_: Files, hub: string): string =>
            join(hub, 'projects', 'manuscripts', 'alpha', 'project.yml'),
        field: 'status.line',
        before: 'the line',
        after: 'a new line'
    },
    {
        name: 'a personal project of the hub',
        id: 'idea',
        fields: { snooze: '2026-12-01' },
        file: (_: Files, hub: string): string => join(hub, 'side-projects', 'idea', 'project.yml'),
        field: 'snooze',
        before: '2026-11-01',
        after: '2026-12-01'
    },
    {
        name: 'a project of a served root',
        id: 'r',
        fields: { snooze: '2026-12-01' },
        file: (files: Files): string => files.r,
        field: 'snooze',
        before: '2026-11-01',
        after: '2026-12-01'
    }
];

/** The subtask writes of the third table, by the host the write names. */
const SUBTASK_ROWS = [
    {
        name: 'a collection entry',
        host: { collection: 'tasks', id: 'Review the draft' },
        key: 'Review the draft',
        file: (_: Files, hub: string): string =>
            join(hub, '.oculus', 'data', 'academic', 'tasks.yml')
    },
    {
        name: 'a personal project of the hub',
        host: { id: 'idea' },
        key: 'idea',
        file: (_: Files, hub: string): string => join(hub, 'side-projects', 'idea', 'project.yml')
    },
    {
        name: 'a project of a served root',
        host: { id: 'r' },
        key: 'r',
        file: (files: Files): string => files.r
    }
];

describe('what each writer records', { tags: ['slow'] }, () => {
    it.each(MANIFEST_ROWS)(
        'records one manifest field with the value it had and the value written',
        async (row) => {
            const { into, files } = personalTarget(target());
            const rows = await written(
                into,
                { kind: 'manifest', id: row.id, fields: row.fields },
                row.name
            );
            expect(rows, row.name).toHaveLength(1);
            expect(rows[0], row.name).toMatchObject({
                kind: 'manifest',
                file: row.file(files, into.hub),
                key: row.id,
                field: row.field,
                before: row.before,
                after: row.after,
                undo: 'field'
            });
            expect(Date.parse(rows[0].at)).not.toBeNaN();
        }
    );

    it('records a collection entry field, a new entry, a reorder and a deletion', async () => {
        const into = target();
        await written(into, {
            kind: 'entry',
            collection: 'tasks',
            id: 'Review the draft',
            fields: { status: 'done' }
        });
        await written(into, {
            kind: 'new-entry',
            collection: 'tasks',
            fields: { title: 'A third task' }
        });
        await written(into, {
            kind: 'reorder',
            collection: 'tasks',
            order: ['Another task', 'Review the draft', 'A third task']
        });
        const rows = await written(into, {
            kind: 'delete-entry',
            collection: 'tasks',
            id: 'A third task'
        });
        expect(rows.map((row) => [row.kind, row.field, row.undo])).toEqual([
            ['delete-entry', 'entries', 'delete'],
            ['reorder', 'entries', 'reorder'],
            ['new-entry', 'entries', 'create'],
            ['entry', 'status', 'field']
        ]);
        expect(rows[0].before).toMatchObject({ title: 'A third task' });
        expect(rows[0].after).toBe(null);
        expect(rows[1].before).toEqual(['Review the draft', 'Another task', 'A third task']);
        expect(rows[1].after).toEqual(['Another task', 'Review the draft', 'A third task']);
        expect(rows[2].before).toBe(null);
        expect(rows[3]).toMatchObject({ key: 'Review the draft', before: 'open', after: 'done' });

        // A field the renderer leaves out of the file is left out of the record of a new entry.
        const emptied = await written(into, {
            kind: 'new-entry',
            collection: 'tasks',
            fields: { title: 'A fourth task', status: '' }
        });
        expect.soft(emptied[0].after).toEqual({ title: 'A fourth task' });

        // Every record of a rename is keyed by the identity the file lists the entry under after
        // the write and carries the one before it, so the undo of any one of them finds the entry.
        const renamed = await written(into, {
            kind: 'entry',
            collection: 'tasks',
            id: 'Another task',
            fields: { status: 'done', title: 'A renamed task' }
        });
        expect
            .soft(
                renamed
                    .slice(0, 2)
                    .map((row) => [row.field, row.key, row.was, row.before, row.after])
            )
            .toEqual([
                ['title', 'A renamed task', 'Another task', 'Another task', 'A renamed task'],
                ['status', 'A renamed task', 'Another task', 'open', 'done']
            ]);
    });

    it.each(SUBTASK_ROWS)(
        'records a subtask ticked, a subtask added and a subtask taken out',
        async (row) => {
            const { into, files } = personalTarget(target());
            const ticked = await written(
                into,
                {
                    kind: 'subtask',
                    target: row.host,
                    key: '0',
                    action: 'done'
                },
                row.name
            );
            expect(ticked[0], row.name).toMatchObject({
                kind: 'subtask',
                file: row.file(files, into.hub),
                key: row.key,
                field: '0',
                before: { do: 'read it' },
                after: { do: 'read it', done: true },
                undo: 'field'
            });
            const added = await written(
                into,
                {
                    kind: 'subtask-add',
                    target: row.host,
                    fields: { do: 'write it up' }
                },
                row.name
            );
            expect(added[0], row.name).toMatchObject({
                kind: 'subtask-add',
                file: row.file(files, into.hub),
                field: '1',
                before: null,
                after: { do: 'write it up' },
                undo: 'create'
            });
            const gone = await written(
                into,
                {
                    kind: 'subtask',
                    target: row.host,
                    key: '1',
                    action: 'delete'
                },
                row.name
            );
            expect(gone[0], row.name).toMatchObject({ field: '1', after: null, undo: 'delete' });
        }
    );

    it.each(SUBTASK_ROWS)(
        'records a follow-up note added, changed and taken out once done',
        async (row) => {
            const { into, files } = personalTarget(target());
            const added = await written(
                into,
                { kind: 'followup-add', target: row.host, fields: { do: 'ask Ann' } },
                row.name
            );
            expect(added[0], row.name).toMatchObject({
                kind: 'followup-add',
                file: row.file(files, into.hub),
                key: row.key,
                field: '0',
                before: null,
                after: { do: 'ask Ann' },
                undo: 'create'
            });
            const dated = await written(
                into,
                {
                    kind: 'followup',
                    target: row.host,
                    key: '0',
                    action: 'after',
                    value: '2026-12-01'
                },
                row.name
            );
            expect(dated[0], row.name).toMatchObject({
                kind: 'followup',
                field: '0',
                before: { do: 'ask Ann' },
                after: { do: 'ask Ann', after: '2026-12-01' },
                undo: 'field'
            });
            const done = await written(
                into,
                { kind: 'followup', target: row.host, key: '0', action: 'done' },
                row.name
            );
            expect(done[0], row.name).toMatchObject({ field: '0', after: null, undo: 'delete' });
        }
    );

    it('records a career host, a session override and a feed field', async () => {
        const into = target();
        const host = await written(into, { kind: 'host', name: 'Naesens', status: 'candidate' });
        expect(host[0]).toMatchObject({
            kind: 'host',
            file: join(into.hub, '.oculus', 'data', 'academic', 'career.yml'),
            key: 'Naesens',
            field: 'status',
            before: 'warm',
            after: 'candidate'
        });
        const session = await written(into, { kind: 'session', id: 'sess-1', hidden: true });
        expect(session[0]).toMatchObject({
            kind: 'session',
            file: into.overrides,
            key: 'sess-1',
            field: 'hidden',
            before: null,
            after: true
        });
        const feed = await written(into, {
            kind: 'feed-field',
            feed: 'radar',
            id: 'Paper',
            field: 'dismissed',
            value: true
        });
        expect(feed[0]).toMatchObject({
            kind: 'feed-field',
            key: 'Paper',
            field: 'dismissed',
            before: null,
            after: true,
            undo: 'field'
        });
    });

    it('records a paper saved to Literature, and its undo leaves the file as it was', async () => {
        const into = target();
        const file = join(into.hub, '.oculus', 'data', 'literature', 'literature.yml');
        const before = readFileSync(file, 'utf8');
        const rows = await written(into, {
            kind: 'literature-save',
            source: 'search',
            paper: {
                title: 'Block-term tensor regression for ECoG',
                authors: ['John Smith', 'Marc M. Van Hulle'],
                year: 2024,
                doi: '10.1016/j.neucom.2024.127654'
            }
        });
        expect(rows[0]).toMatchObject({ kind: 'literature-save', file, key: 'smith2024blockterm' });
        expect(readFileSync(file, 'utf8')).toContain('key: smith2024blockterm');
        expect(undoChange(into, rows[0])).not.toHaveProperty('error');
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    it("records each list of a deck write as the file held it and as it holds it now, and the order's entries", async () => {
        const into = deckTarget();
        const rows = await written(into, {
            kind: 'deck-slides',
            root: 'hub',
            path: DECK_PATH,
            groups: [{ group: 'pillars', base: ['alpha'], slides: ['beta', 'alpha'] }],
            order: { base: DECK_ORDER, entries: ['slides:pillars', 'intro.md', 'slides:more'] }
        });
        expect(rows).toHaveLength(2);
        expect(rows[1]).toMatchObject({
            kind: 'deck-slides',
            key: 'slides:pillars',
            field: 'slides',
            before: ['alpha'],
            after: ['beta', 'alpha'],
            undo: 'field'
        });
        expect(rows[0]).toMatchObject({
            key: 'order',
            field: 'order',
            before: DECK_ORDER,
            after: ['slides:pillars', 'intro.md', 'slides:more'],
            undo: 'field'
        });
        expect(rows[0].file).toBe(join(into.hub, DECK_PATH));
    });

    it('records a scaffolded idea with no way back', async () => {
        const into = target();
        const rows = await written(into, { kind: 'new-idea', fields: { id: 'fresh-idea' } });
        expect(rows[0]).toMatchObject({
            kind: 'new-idea',
            file: join(into.hub, 'projects', 'ideas', 'fresh-idea', 'project.yml'),
            key: 'fresh-idea',
            before: null,
            undo: 'none'
        });
    });
});

describe('what a store write leaves in the undo folder', () => {
    it('keeps the values of a record outside its line and deletes them when the record leaves the window', async () => {
        const dir = scratchDir('oculus-changes-kept-');
        const log: ChangeLog = {
            file: join(dir, 'changes.jsonl'),
            keep: 2,
            writes: fsWrites(),
            undoDir: join(dir, '.undo')
        };
        expect(resolve(log.undoDir ?? '').startsWith(resolve(dir) + sep)).toBe(true);
        const record = (n: number) => ({
            file: join(dir, 'notes.json'),
            key: 'app:notes',
            field: 'store',
            before: n,
            after: n + 1,
            undo: 'field' as const,
            kept: { before: { n }, after: { n: n + 1 } }
        });
        await logChanges(log, 'app-store', [record(0)]);
        const [first] = readChanges(log);
        expect(first).toMatchObject({ key: 'app:notes', field: 'store', before: 0, after: 1 });
        expect('kept' in first).toBe(false);
        const keptFile = join(dir, '.undo', `${first.at}.json`);
        expect(JSON.parse(readFileSync(keptFile, 'utf8'))).toEqual({
            before: { n: 0 },
            after: { n: 1 }
        });
        for (const n of [1, 2, 3]) await logChanges(log, 'app-store', [record(n)]);
        expect(existsSync(keptFile)).toBe(true);
        await logChanges(log, 'app-store', [record(4)]);
        expect(existsSync(keptFile)).toBe(false);
        const left = readChanges(log);
        expect(left).toHaveLength(2);
        for (const change of left) {
            expect(existsSync(join(dir, '.undo', `${change.at}.json`))).toBe(true);
        }
    });
});

describe("the change log's prune", () => {
    it('keeps a whole act when the cut of the window falls inside it', async () => {
        const dir = scratchDir('oculus-changes-act-');
        const log: ChangeLog = { file: join(dir, 'changes.jsonl'), keep: 2, writes: fsWrites() };
        const record = (key: string, file: string) => ({
            file: join(dir, file),
            key,
            field: 'new',
            before: '',
            after: file,
            undo: 'field' as const
        });
        await logChanges(log, 'deck-edit', [record('act-x', 'x1.md'), record('act-x', 'x2.md')]);
        await logChanges(log, 'deck-edit', [record('act-y', 'y1.md'), record('act-y', 'y2.md')]);
        // Five lines pass the bound of four, and the cut at the last two falls between y1 and y2.
        await logChanges(log, 'deck-edit', [record('act-z', 'z1.md')]);
        const left = readChanges(log);
        expect(left.map((one) => one.key)).toEqual(['act-z', 'act-y', 'act-y']);
        expect(writtenWith(log, left[1]).map((one) => one.after)).toEqual(['y1.md', 'y2.md']);
    });
});

describe("the change log's announcement", () => {
    /**
     * A log whose hub records each publish with the number of lines the file held at that moment.
     */
    function announcing() {
        const dir = scratchDir('oculus-changes-announce-');
        const published: { channel: string; payload: unknown; lines: number }[] = [];
        const log: ChangeLog = {
            file: join(dir, 'changes.jsonl'),
            keep: 500,
            writes: fsWrites(),
            hub: {
                publish: (channel, payload) => {
                    published.push({ channel, payload, lines: readChanges(log).length });
                    return published.length;
                }
            } satisfies Pick<Hub, 'publish'>
        };
        return { dir, log, published };
    }

    const record = (field: string) => ({
        file: '/x/a.yml',
        key: 'a',
        field,
        before: 0,
        after: 1,
        undo: 'none' as const
    });

    it('publishes the changes channel once with the moment of the newest record, after the lines are on disk', async () => {
        const { log, published } = announcing();
        await logChanges(log, 'manifest', [record('one'), record('two')]);
        const newest = readChanges(log)[0];
        expect(published).toEqual([{ channel: 'changes', payload: { at: newest.at }, lines: 2 }]);
    });

    it('publishes nothing for a write that changed nothing, and the newest moment when an append cuts the log to its window', async () => {
        const { log, published } = announcing();
        await logChanges(log, 'manifest', []);
        expect(published).toEqual([]);
        const cut: ChangeLog = { ...log, keep: 2 };
        for (const field of ['a', 'b', 'c', 'd', 'e'])
            await logChanges(cut, 'manifest', [record(field)]);
        const newest = readChanges(cut)[0];
        expect(published.at(-1)?.payload).toEqual({ at: newest.at });
    });
});
