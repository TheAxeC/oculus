// The change log: what each writer records of its own write, and the file the records land in.
//
// The hub is synthetic, under the system temporary directory, and so is the log: the target's
// `changes` path is inside that directory and is asserted to be before anything is written, so
// nothing here reaches ~/.oculus/changes.jsonl.
//
// The writes go through handleWrite rather than through each writer, because the record is only
// complete once the route has stamped the time and the body kind on it: what a case asserts is the
// line the log holds, which is what the History view reads.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { PAGE, logChanges, readChanges } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { parse } from 'yaml';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Project, Tier } from '../../../src/lib/data/model/index.ts';
import type { Change, ChangeLog, ChangeRecord } from '../../../src/lib/server/core/changes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { targetOver } from '../../routes/edit/write-fixture.ts';

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

/** A deck file of the same shape as config/present.yml, for the deck write's own record. */
const DECK = `deck:
    order:
        - { slide: title }
        - { slide: framing, ref: engine }
        - { slide: project, ref: alpha }
        - { slide: closing }
    framing:
        engine: { title: 'The common engine' }
`;

/** One project with one slide, at the tier whose slides join the deck on their own. */
function slideProject(id: string, tier: Tier): Project {
    return {
        id,
        tier,
        ghost: false,
        type: tier === 'active' ? 'active' : 'archive',
        title: id,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        present: [{ id, projectId: id, specs: [], panels: [], method: [], results: [] }],
        folder: `projects/${tier}/${id}`,
        file: `projects/${tier}/${id}/project.yml`
    };
}

/** A target whose deck file and log are both under the system temporary directory. */
function deckTarget(): WriteTarget {
    const dir = scratchDir('oculus-changes-deck-');
    const file = join(dir, 'present.yml');
    const log = join(dir, 'changes.jsonl');
    for (const path of [file, log]) {
        expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    }
    writeFileSync(file, DECK);
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    return {
        hub: dir,
        config: { ...real, deck: (parse(DECK) as { deck: unknown }).deck, deckFile: file },
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
        projects: () => [slideProject('alpha', 'active'), slideProject('gamma', 'archive')],
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: [],
        changes: { file: log, keep: 500, writes: fsWrites() }
    };
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

/** Every line of the log as text, for the cases that assert the file's own shape. */
function lines(into: WriteTarget): string[] {
    const file = logOf(into).file;
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((one) => one !== '');
}

describe('what each writer records', () => {
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

    it('writes nothing at all for a write that changed nothing', async () => {
        const into = target();
        await written(into, { kind: 'manifest', id: 'alpha', fields: { title: 'A title' } });
        expect(lines(into)).toEqual([]);
    });

    it('writes nothing for a refused field', async () => {
        const into = target();
        await written(into, {
            kind: 'manifest',
            id: 'alpha',
            fields: { nonesuch: 'a value the schema does not name' }
        });
        expect(lines(into)).toEqual([]);
    });
});

describe('the log file', () => {
    it('holds one JSON line per change, oldest first, each with its own moment', async () => {
        const into = target();
        await written(into, {
            kind: 'manifest',
            id: 'alpha',
            fields: { 'status.line': 'one', title: 'two' }
        });
        const held = lines(into);
        expect(held).toHaveLength(2);
        const parsed = held.map((line) => JSON.parse(line) as Change);
        expect(parsed.map((one) => one.field)).toEqual(['status.line', 'title']);
        expect(parsed[0].at < parsed[1].at).toBe(true);
        // The read turns the file round, so the page the view draws opens with the newest.
        expect(readChanges(logOf(into)).map((one) => one.field)).toEqual(['title', 'status.line']);
    });

    it('rewrites the file to the cap once it has grown past twice it', async () => {
        const into = target(3);
        const log = logOf(into);
        for (let at = 0; at < 6; at += 1) {
            await logChanges(log, 'manifest', [
                {
                    file: 'a.yml',
                    key: 'alpha',
                    field: `f${at}`,
                    before: null,
                    after: at,
                    undo: 'field'
                }
            ]);
        }
        // Six lines is twice the cap and is kept; the seventh passes it and the file comes back
        // holding the newest three.
        expect(lines(into)).toHaveLength(6);
        await logChanges(log, 'manifest', [
            { file: 'a.yml', key: 'alpha', field: 'f6', before: null, after: 6, undo: 'field' }
        ]);
        expect(lines(into)).toHaveLength(3);
        expect(readChanges(log).map((one) => one.field)).toEqual(['f6', 'f5', 'f4']);
    });

    it('answers one page at a time and walks back through `before`', async () => {
        const into = target();
        const log = logOf(into);
        for (let at = 0; at < PAGE + 2; at += 1) {
            await logChanges(log, 'manifest', [
                {
                    file: 'a.yml',
                    key: 'alpha',
                    field: `f${at}`,
                    before: null,
                    after: at,
                    undo: 'field'
                }
            ]);
        }
        const first = readChanges(log);
        expect(first).toHaveLength(PAGE);
        expect(first[0].field).toBe(`f${PAGE + 1}`);
        const older = readChanges(log, first[first.length - 1].at);
        expect(older.map((one) => one.field)).toEqual(['f1', 'f0']);
    });

    it('reaches every row the file holds when the cap is below the page', async () => {
        const into = target(10);
        const log = logOf(into);
        for (let at = 0; at < 18; at += 1) {
            await logChanges(log, 'manifest', [
                {
                    file: 'a.yml',
                    key: 'alpha',
                    field: `f${at}`,
                    before: null,
                    after: at,
                    undo: 'field'
                }
            ]);
        }
        // Eighteen lines is under twice the cap, so the file still holds every one of them; the
        // page is the page size and not the cap, so no row is out of the view's reach.
        expect(lines(into)).toHaveLength(18);
        const page = readChanges(log);
        expect(page).toHaveLength(18);
        expect(page[0].field).toBe('f17');
        expect(page[page.length - 1].field).toBe('f0');
    });

    it('writes two concurrent appends as whole lines, in order, with rising stamps', async () => {
        const into = target();
        const log = logOf(into);
        const record = (field: string): ChangeRecord => ({
            file: 'a.yml',
            key: 'alpha',
            field,
            before: null,
            after: field,
            undo: 'field'
        });
        // Both calls are started before either is awaited, so the chain is what keeps their lines
        // apart: without it the second read would start before the first append landed.
        await Promise.all([
            logChanges(log, 'manifest', [record('a1'), record('a2')]),
            logChanges(log, 'entry', [record('b1'), record('b2')])
        ]);
        const held = lines(into).map((line) => JSON.parse(line) as Change);
        expect(held.map((one) => one.field)).toEqual(['a1', 'a2', 'b1', 'b2']);
        expect(held.map((one) => one.kind)).toEqual(['manifest', 'manifest', 'entry', 'entry']);
        for (let at = 1; at < held.length; at += 1) {
            expect(held[at - 1].at < held[at].at).toBe(true);
        }
    });

    it('makes the folder of a log whose path does not exist yet', async () => {
        const into = target();
        const dir = join(logOf(into).file, '..', 'deeper', 'still');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        expect(existsSync(dir)).toBe(false);
        const log: ChangeLog = { file: join(dir, 'changes.jsonl'), keep: 500, writes: fsWrites() };
        await logChanges(log, 'manifest', [
            { file: 'a.yml', key: 'alpha', field: 'f0', before: null, after: 0, undo: 'field' }
        ]);
        expect(readChanges(log).map((one) => one.field)).toEqual(['f0']);
    });

    it('records nothing when the target names no log', async () => {
        const into = target();
        const bare: WriteTarget = { ...into, changes: undefined };
        const response = await handleWrite(
            request({ kind: 'manifest', id: 'alpha', fields: { 'status.line': 'a new line' } }),
            TOKEN,
            bare
        );
        expect(response.status).toBe(200);
        expect(lines(into)).toEqual([]);
    });
});
