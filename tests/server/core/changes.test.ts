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

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { readChanges } from '../../../src/lib/server/core/changes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { Change, ChangeLog } from '../../../src/lib/server/core/changes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { deckTarget, targetOver } from '../../routes/edit/write-fixture.ts';

const MANIFEST = 'id: alpha\ntype: manuscript\ntitle: "A title"\nstatus:\n  line: "the line"\n';

const TASKS =
    'title: Tasks\nschema:\n  - { field: title, type: text }\nentries:\n  - title: "Review the draft"\n    status: open\n    subtasks:\n      - { do: read it }\n\n  - title: "Another task"\n    status: open\n';

const VENUES =
    'title: Venues\nschema:\n  - { field: name, type: text }\n  - { field: id, type: text }\nvenues:\n  - name: Existing Venue\n    id: existing\n';

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
function target(keep = 500): WriteTarget {
    const dir = scratchDir('oculus-changes-');
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [path, body] of [
        ['tasks/tasks.yml', TASKS],
        ['registries/venues.yml', VENUES],
        ['registries/career.yml', CAREER],
        ['feeds/literature-radar.yml', RADAR],
        ['feeds/position-leads.yml', LEADS]
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
function logOf(into: WriteTarget): ChangeLog {
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
async function written(into: WriteTarget, body: unknown): Promise<Change[]> {
    const response = await handleWrite(request(body), TOKEN, into);
    expect(response.status).toBe(200);
    return readChanges(logOf(into));
}

describe('what each writer records', { tags: ['slow'] }, () => {
    it('records one manifest field with the value it had and the value written', async () => {
        const into = target();
        const rows = await written(into, {
            kind: 'manifest',
            id: 'alpha',
            fields: { 'status.line': 'a new line' }
        });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            kind: 'manifest',
            file: join('projects', 'manuscripts', 'alpha', 'project.yml'),
            key: 'alpha',
            field: 'status.line',
            before: 'the line',
            after: 'a new line',
            undo: 'field'
        });
        expect(Date.parse(rows[0].at)).not.toBeNaN();
    });

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
    });

    it('records a subtask ticked, a subtask added and a subtask taken out', async () => {
        const into = target();
        const ticked = await written(into, {
            kind: 'subtask',
            target: { collection: 'tasks', id: 'Review the draft' },
            key: '0',
            action: 'done'
        });
        expect(ticked[0]).toMatchObject({
            kind: 'subtask',
            key: 'Review the draft',
            field: '0',
            before: { do: 'read it' },
            after: { do: 'read it', done: true },
            undo: 'field'
        });
        const added = await written(into, {
            kind: 'subtask-add',
            target: { collection: 'tasks', id: 'Review the draft' },
            fields: { do: 'write it up' }
        });
        expect(added[0]).toMatchObject({
            kind: 'subtask-add',
            field: '1',
            before: null,
            after: { do: 'write it up' },
            undo: 'create'
        });
        const gone = await written(into, {
            kind: 'subtask',
            target: { collection: 'tasks', id: 'Review the draft' },
            key: '1',
            action: 'delete'
        });
        expect(gone[0]).toMatchObject({ field: '1', after: null, undo: 'delete' });
    });

    it('records a career host, a session override and a feed field', async () => {
        const into = target();
        const host = await written(into, { kind: 'host', name: 'Naesens', status: 'candidate' });
        expect(host[0]).toMatchObject({
            kind: 'host',
            file: 'registries/career.yml',
            key: 'Naesens',
            field: 'status',
            before: 'warm',
            after: 'candidate'
        });
        const session = await written(into, { kind: 'session', id: 'sess-1', hidden: true });
        expect(session[0]).toMatchObject({
            kind: 'session',
            // The fixture keeps the overrides file inside the hub, so the record names it the way
            // it names every hub file; on a real machine it sits under ~/.oculus and stays
            // absolute.
            file: 'sessions.json',
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

    it("records the deck's two lists as the file held them and as it holds them now", async () => {
        const into = deckTarget();
        const order = ['title', 'alpha', 'framing:engine', 'gamma', 'closing'];
        const rows = await written(into, { kind: 'deck', selection: ['title', 'alpha'], order });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            kind: 'deck',
            key: 'deck',
            field: 'deck',
            before: { selection: [], order: [] },
            after: { selection: ['title', 'alpha'], order },
            undo: 'field'
        });
        // The fixture keeps the deck file inside the hub, so the record names it the way it names
        // every hub file; on a real machine it sits under the engine's config folder and stays
        // absolute.
        expect(rows[0].file).toBe('present.yml');
    });

    it('records a scaffolded idea with no way back', async () => {
        const into = target();
        const rows = await written(into, { kind: 'new-idea', fields: { id: 'fresh-idea' } });
        expect(rows[0]).toMatchObject({
            kind: 'new-idea',
            file: join('projects', 'ideas', 'fresh-idea', 'project.yml'),
            key: 'fresh-idea',
            before: null,
            undo: 'none'
        });
    });
});
