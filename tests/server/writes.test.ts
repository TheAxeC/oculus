// What writeManifest does over a hub of its own: which requests it refuses, how a form value becomes
// a manifest value, and when the file is touched at all.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/manifest-schema.yml, so what the
// form offers and what the write accepts are the same list.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    coerce,
    createEntry,
    createIdea,
    insideHub,
    writeEntry,
    writeHost,
    writeManifest,
    writeSubtask,
    writeSubtaskAdd
} from '../../src/lib/server/writes.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { PortfolioConfig } from '../../src/lib/data/model.ts';

const MANIFEST = [
    'id: alpha',
    'type: manuscript',
    'title: "A title"',
    'pin: true',
    'year: 2026',
    'status:',
    '  chips: [submitted, lead]',
    '  line: "the line"',
    'program: [tensor]',
    ''
].join('\n');

/** The real schema and vocabulary over a scan that names one synthetic tier. */
function configFor(): PortfolioConfig {
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] };
}

/** A hub with one project in it, under the system temporary directory. */
function hub(manifest = MANIFEST): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-writes-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), manifest);
    return dir;
}

function manifestOf(root: string): string {
    return readFileSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
}

describe('what a write refuses', () => {
    it('says an id the hub does not hold was not found, and writes nothing', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'nobody', { title: 'x' });
        expect(out).toEqual({ found: false, changed: [], refused: [] });
        expect(manifestOf(root)).toBe(MANIFEST);
    });

    it('refuses a field the manifest schema does not name', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { nonesuch: 'x' });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            { field: 'nonesuch', reason: 'the manifest schema does not name the field' }
        ]);
    });

    it('refuses the read-only fields and the map field', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', {
            id: 'other',
            tier: 'archive',
            paths: 'x'
        });
        expect(out.changed).toEqual([]);
        expect(out.refused.map((one) => one.field).sort()).toEqual(['id', 'paths', 'tier']);
        expect(manifestOf(root)).toBe(MANIFEST);
    });

    it('writes only inside the hub scan directories', () => {
        const config = configFor();
        expect(insideHub('/hub', config, '/hub/projects/manuscripts/a/project.yml')).toBe(true);
        expect(insideHub('/hub', config, '/hub/projects/ideas/a/project.yml')).toBe(false);
        expect(insideHub('/hub', config, '/etc/project.yml')).toBe(false);
        expect(insideHub('/hub', config, '/hub/projects/manuscripts/a/notes.yml')).toBe(false);
    });
});

describe('what a form value becomes', () => {
    it('makes a checkbox true or takes the key away', () => {
        expect(coerce('checkbox', 'on', undefined)).toEqual({ value: true });
        expect(coerce('checkbox', true, undefined)).toEqual({ value: true });
        expect(coerce('checkbox', false, true)).toEqual({ value: null });
        expect(coerce('checkbox', '', true)).toEqual({ value: null });
    });

    it('makes an empty text clear the field', () => {
        expect(coerce('text', '  ', 'held')).toEqual({ value: null });
        expect(coerce('textarea', '', 'held')).toEqual({ value: null });
    });

    it('keeps a number a number where the manifest holds one', () => {
        expect(coerce('text', '2027', 2026)).toEqual({ value: 2027 });
        expect(coerce('text', '2027', 'held')).toEqual({ value: '2027' });
    });

    it('splits a list widget into its items, dropping the empty ones', () => {
        expect(coerce('lines', 'one\n\n two ', undefined)).toEqual({ value: ['one', 'two'] });
        expect(coerce('chips', ['a', 'b'], undefined)).toEqual({ value: ['a', 'b'] });
        expect(coerce('tags', '', undefined)).toEqual({ value: null });
    });

    it('refuses a type it does not know', () => {
        expect(coerce('nonesuch', 'x', undefined)).toEqual({
            reason: 'unknown field type nonesuch'
        });
    });
});

describe('the file itself', () => {
    it('writes the changed field and nothing else', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { 'status.line': 'a new line' });
        expect(out).toEqual({ found: true, changed: ['status.line'], refused: [] });
        expect(manifestOf(root)).toBe(MANIFEST.replace('"the line"', '"a new line"'));
    });

    it('takes a ticked box off the file when it is unticked', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { pin: false });
        expect(out.changed).toEqual(['pin']);
        expect(manifestOf(root)).toBe(MANIFEST.replace('pin: true\n', ''));
    });

    it('does not touch the file when nothing changed', async () => {
        const root = hub();
        const before = statSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'));
        await new Promise((wake) => setTimeout(wake, 20));
        const out = writeManifest(root, configFor(), 'alpha', {
            title: 'A title',
            pin: true,
            'status.chips': ['submitted', 'lead']
        });
        const after = statSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'));
        expect(out).toEqual({ found: true, changed: [], refused: [] });
        expect(after.mtimeMs).toBe(before.mtimeMs);
    });
});

/** A collection file at the hub path config/sources.yml gives the `tasks` key. */
const TASKS = [
    'title: Tasks',
    'schema:',
    '  - { field: title, type: text }',
    '  - { field: status, type: select }',
    'entries:',
    '  - title: "Review the draft"',
    '    status: open',
    '    subtasks:',
    '      - { do: read it }',
    ''
].join('\n');

const CAREER = [
    'title: Career',
    'hosts:',
    '  - { name: "Naesens", inst: "KU Leuven", status: "warm" }',
    ''
].join('\n');

/** The same hub with a collection file and a career file beside the one manifest. */
function wider(): string {
    const root = hub();
    for (const [path, body] of [
        ['tasks/tasks.yml', TASKS],
        ['CAREER.yml', CAREER]
    ]) {
        const file = join(root, path);
        expect(resolve(file).startsWith(resolve(root) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, body);
    }
    return root;
}

function tasksOf(root: string): string {
    return readFileSync(join(root, 'tasks', 'tasks.yml'), 'utf8');
}

describe('writing one collection entry', () => {
    it('sets a field of the entry the id names', () => {
        const root = wider();
        const out = writeEntry(root, configFor(), 'tasks', 'Review the draft', {
            status: 'done'
        });
        expect(out).toEqual({ found: true, changed: ['status'], refused: [] });
        expect(tasksOf(root)).toBe(TASKS.replace('status: open', 'status: done'));
    });

    it('says not found for a collection and for an entry the hub does not hold', () => {
        const root = wider();
        expect(writeEntry(root, configFor(), 'nonesuch', 'x', { status: 'done' })).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(writeEntry(root, configFor(), 'tasks', 'Nobody', { status: 'done' })).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(tasksOf(root)).toBe(TASKS);
    });
});

describe('writing one subtask line', () => {
    it('ticks and reopens a line of a manifest', () => {
        const root = wider();
        writeManifest(root, configFor(), 'alpha', {});
        const added = writeSubtaskAdd(root, configFor(), { id: 'alpha' }, { do: 'write it' });
        expect(added.changed).toEqual(['subtasks']);
        expect(manifestOf(root)).toBe(`${MANIFEST}subtasks:\n  - { do: write it }\n`);
        const done = writeSubtask(root, configFor(), { id: 'alpha' }, '0', 'done');
        expect(done.changed).toEqual(['done']);
        expect(manifestOf(root)).toContain('- { do: write it, done: true }');
        const open = writeSubtask(root, configFor(), { id: 'alpha' }, '0', 'reopen');
        expect(open.changed).toEqual(['done']);
        expect(manifestOf(root)).toContain('- { do: write it }');
    });

    it('snoozes and deletes a line of a collection entry', () => {
        const root = wider();
        const target = { id: 'Review the draft', collection: 'tasks' };
        const snoozed = writeSubtask(root, configFor(), target, '0', 'snooze', '2026-10-01');
        expect(snoozed.changed).toEqual(['snooze']);
        expect(tasksOf(root)).toContain('- { do: read it, snooze: 2026-10-01 }');
        const gone = writeSubtask(root, configFor(), target, '0', 'delete');
        expect(gone.changed).toEqual(['subtasks']);
        expect(tasksOf(root)).toBe(TASKS.replace('    subtasks:\n      - { do: read it }\n', ''));
    });

    it('says not found for a host that is not in the hub', () => {
        const root = wider();
        expect(writeSubtask(root, configFor(), { id: 'nobody' }, '0', 'done')).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(
            writeSubtaskAdd(root, configFor(), { id: 'x', collection: 'tasks' }, { do: 'a' })
        ).toEqual({ found: false, changed: [], refused: [] });
    });
});

describe('writing one career host', () => {
    it('sets a status of the vocabulary and refuses one outside it', () => {
        const root = wider();
        const out = writeHost(root, 'Naesens', 'candidate');
        expect(out).toEqual({ found: true, changed: ['status'], refused: [] });
        expect(readFileSync(join(root, 'CAREER.yml'), 'utf8')).toBe(
            CAREER.replace('status: "warm"', 'status: "candidate"')
        );
        const bad = writeHost(root, 'Naesens', 'promoted');
        expect(bad.changed).toEqual([]);
        expect(bad.refused).toEqual([
            { field: 'status', reason: 'promoted is not a career host status' }
        ]);
    });

    it('says not found for a host the file does not hold', () => {
        const root = wider();
        expect(writeHost(root, 'Nobody', 'warm')).toEqual({
            found: false,
            changed: [],
            refused: []
        });
    });
});

describe('adding an entry and an idea', () => {
    it('appends a new entry rendered from the file schema', () => {
        const root = wider();
        const out = createEntry(root, configFor(), 'tasks', {
            title: 'A new task',
            status: 'open'
        });
        expect(out).toEqual({ found: true, changed: ['entries'], refused: [] });
        expect(tasksOf(root)).toBe(`${TASKS}\n  - title: A new task\n    status: open\n`);
    });

    it('refuses an entry whose identity the file already holds, and an unknown collection', () => {
        const root = wider();
        const twice = createEntry(root, configFor(), 'tasks', { title: 'Review the draft' });
        expect(twice.changed).toEqual([]);
        expect(twice.refused).toEqual([
            { field: 'title', reason: 'an entry with that title is already in the file' }
        ]);
        expect(createEntry(root, configFor(), 'nonesuch', { title: 'x' })).toEqual({
            found: false,
            changed: [],
            refused: []
        });
        expect(tasksOf(root)).toBe(TASKS);
    });

    it('scaffolds an idea folder with a manifest and a README', () => {
        const root = wider();
        const out = createIdea(root, { id: 'new-idea', title: 'A new idea', eli5: 'what it is' });
        expect(out.changed).toEqual([
            'projects/ideas/new-idea/project.yml',
            'projects/ideas/new-idea/README.md'
        ]);
        const folder = join(root, 'projects', 'ideas', 'new-idea');
        expect(readFileSync(join(folder, 'project.yml'), 'utf8')).toBe(
            [
                'id: new-idea',
                'type: idea',
                'title: A new idea',
                'focus: holding',
                'status:',
                '  chips: [exploring]',
                '  line: New idea - scope + novelty check open.',
                'eli5: what it is',
                'next: Scope the idea; cited-novelty lit check; decide go/no-go.',
                ''
            ].join('\n')
        );
        expect(readFileSync(join(folder, 'README.md'), 'utf8')).toBe(
            '# A new idea\n\nwhat it is\n\n## Next\n\nScope the idea; cited-novelty lit check; decide go/no-go.\n'
        );
    });

    it('refuses a bad id and a folder that is already there', () => {
        const root = wider();
        expect(createIdea(root, { id: 'Not An Id' }).refused).toEqual([
            { field: 'id', reason: 'an id is lower case letters, digits and hyphens' }
        ]);
        expect(createIdea(root, { id: '../escape' }).refused).toEqual([
            { field: 'id', reason: 'an id is lower case letters, digits and hyphens' }
        ]);
        createIdea(root, { id: 'twice' });
        expect(createIdea(root, { id: 'twice' }).refused).toEqual([
            { field: 'id', reason: 'projects/ideas/twice is already there' }
        ]);
        expect(existsSync(join(root, 'projects', 'ideas', 'not-an-id'))).toBe(false);
    });
});
