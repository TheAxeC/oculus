// What writeManifest does over a hub of its own: which requests it refuses, how a form value
// becomes a manifest value, and when the file is touched at all; and the subtask, career host,
// entry and idea writes beside it. The collection entry writes are writes-collection.test.ts beside
// this.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/catalogs/manifest-schema.yml,
// so what the form offers and what the write accepts are the same list.

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    coerce,
    createEntry,
    createIdea,
    feedDeleteWrite,
    feedFieldWrite,
    insideHub,
    writeEntry,
    writeHost,
    writeManifest,
    writeSubtask,
    writeSubtaskAdd
} from '../../../src/lib/server/edit/writes.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    MANIFEST,
    configFor,
    hub,
    manifestOf,
    record,
    manifestPath,
    tasksPath,
    TASKS,
    VENUES,
    CAREER,
    wider,
    tasksOf,
    venuesOf
} from './writes-fixture.ts';

describe('what a write refuses', () => {
    it('parses the two feed write bodies whole', () => {
        expect(
            feedFieldWrite({
                kind: 'feed-field',
                feed: 'radar',
                id: 'Paper',
                field: 'dismissed',
                value: true
            })
        ).toEqual({
            kind: 'feed-field',
            feed: 'radar',
            id: 'Paper',
            field: 'dismissed',
            value: true
        });
        expect(
            feedFieldWrite({
                kind: 'feed-field',
                feed: 'radar',
                id: 'Paper',
                field: 'dismissed',
                value: {}
            })
        ).toBe(null);
        expect(feedDeleteWrite({ kind: 'feed-delete', feed: 'leads', id: 'Lead' })).toEqual({
            kind: 'feed-delete',
            feed: 'leads',
            id: 'Lead'
        });
    });
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

    // `followup` is named by the schema through its children, `followup.do` and `followup.after`,
    // and the file may hold it as a bare note, a map or a list. Clearing it whole by the parent
    // name is the one write on the parent the editor takes; a value for the parent is refused.
    it('clears a grouped field whole by its parent name, whatever shape the file holds it in', () => {
        const noted = hub(
            MANIFEST.replace('title: "A title"', 'title: "A title"\nfollowup: "ask"')
        );
        const out = writeManifest(noted, configFor(), 'alpha', { followup: '' });
        expect(out.changed).toEqual(['followup']);
        expect(manifestOf(noted)).not.toContain('followup');

        const mapped = hub(
            MANIFEST.replace(
                'title: "A title"',
                'title: "A title"\nfollowup: { do: "ask", after: "2030-01-01" }'
            )
        );
        const gone = writeManifest(mapped, configFor(), 'alpha', { followup: null });
        expect(gone.changed).toEqual(['followup']);
        expect(manifestOf(mapped)).not.toContain('followup');
    });

    it('refuses a value for a grouped field by its parent name', () => {
        const root = hub();
        const out = writeManifest(root, configFor(), 'alpha', { followup: 'ask' });
        expect(out.changed).toEqual([]);
        expect(out.refused).toEqual([
            {
                field: 'followup',
                reason: 'the field is a group; set its children, or clear it whole'
            }
        ]);
    });

    it('writes a follow-up note through followup.do, expanding a bare note into the map', () => {
        const noted = hub(
            MANIFEST.replace('title: "A title"', 'title: "A title"\nfollowup: "old"')
        );
        const out = writeManifest(noted, configFor(), 'alpha', { 'followup.do': 'new' });
        expect(out.changed).toEqual(['followup.do']);
        expect(manifestOf(noted)).toContain('do: new');
        expect(manifestOf(noted)).not.toContain('old');
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
        expect(out).toEqual({
            found: true,
            changed: ['status.line'],
            refused: [],
            records: [record(manifestPath(root), 'alpha', 'status.line', 'the line', 'a new line')]
        });
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
        expect(out).toEqual({ found: true, changed: [], refused: [], records: [] });
        expect(after.mtimeMs).toBe(before.mtimeMs);
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
        const out = writeHost(
            root,
            'Naesens',
            'candidate',
            careerRules(loadConfig(engineDir()).config)
        );
        expect(out).toEqual({
            found: true,
            changed: ['status'],
            refused: [],
            records: [
                record(
                    join(root, 'registries/career.yml'),
                    'Naesens',
                    'status',
                    'warm',
                    'candidate'
                )
            ]
        });
        expect(readFileSync(join(root, 'registries/career.yml'), 'utf8')).toBe(
            CAREER.replace('status: "warm"', 'status: "candidate"')
        );
        const bad = writeHost(
            root,
            'Naesens',
            'promoted',
            careerRules(loadConfig(engineDir()).config)
        );
        expect(bad.changed).toEqual([]);
        expect(bad.refused).toEqual([
            { field: 'status', reason: 'promoted is not a career host status' }
        ]);
    });

    it('says not found for a host the file does not hold', () => {
        const root = wider();
        expect(
            writeHost(root, 'Nobody', 'warm', careerRules(loadConfig(engineDir()).config))
        ).toEqual({
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
        expect(out).toEqual({
            found: true,
            id: 'A new task',
            changed: ['entries'],
            refused: [],
            records: [
                record(
                    tasksPath(root),
                    'A new task',
                    'entries',
                    null,
                    {
                        title: 'A new task',
                        status: 'open'
                    },
                    'create'
                )
            ]
        });
        expect(tasksOf(root)).toBe(`${TASKS}\n  - title: A new task\n    status: open\n`);
    });

    it('appends a new entry carrying a metalist', () => {
        const root = wider();
        const out = createEntry(root, configFor(), 'tasks', {
            title: 'A metalist task',
            meta: [{ label: 'Owner', value: 'Axel' }]
        });
        expect(out).toEqual({
            found: true,
            id: 'A metalist task',
            changed: ['entries'],
            refused: [],
            records: [
                record(
                    tasksPath(root),
                    'A metalist task',
                    'entries',
                    null,
                    {
                        title: 'A metalist task',
                        meta: [{ label: 'Owner', value: 'Axel' }]
                    },
                    'create'
                )
            ]
        });
        expect(tasksOf(root)).toContain(
            '  - title: A metalist task\n    meta:\n      - { label: Owner, value: "Axel" }'
        );
    });

    it('refuses an edit that clears a venue id or moves it onto another venue', () => {
        const root = wider();
        const file = join(root, 'registries', 'venues.yml');
        writeFileSync(file, `${VENUES}  - name: Second Venue\n    id: second\n`);
        expect(writeEntry(root, configFor(), 'venues', 'second', { id: 'existing' })).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an entry with that id is already in the file' }]
        });
        expect(writeEntry(root, configFor(), 'venues', 'second', { id: '' })).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an entry needs a non-empty id' }]
        });
        expect(writeEntry(root, configFor(), 'venues', 'second', { id: 'second' })).toEqual({
            found: true,
            id: 'second',
            changed: [],
            refused: [],
            records: []
        });
        const moved = writeEntry(root, configFor(), 'venues', 'second', { id: 'renamed' });
        expect(moved.refused).toEqual([]);
        expect(venuesOf(root)).toContain('  - name: Second Venue\n    id: renamed');
    });

    it('requires a fresh non-empty registry id for a new venue', () => {
        const missingRoot = wider();
        expect(createEntry(missingRoot, configFor(), 'venues', { name: 'Missing ID' })).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'a new entry needs a non-empty id' }]
        });
        expect(venuesOf(missingRoot)).toBe(VENUES);

        const duplicateRoot = wider();
        expect(
            createEntry(duplicateRoot, configFor(), 'venues', {
                name: 'Another Venue',
                id: 'existing'
            })
        ).toEqual({
            found: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an entry with that id is already in the file' }]
        });
        expect(venuesOf(duplicateRoot)).toBe(VENUES);

        const freshRoot = wider();
        expect(
            createEntry(freshRoot, configFor(), 'venues', {
                name: 'Fresh Venue',
                id: 'fresh'
            })
        ).toEqual({
            found: true,
            id: 'fresh',
            changed: ['venues'],
            refused: [],
            records: [
                record(
                    join(freshRoot, 'registries', 'venues.yml'),
                    'Fresh Venue',
                    'entries',
                    null,
                    { name: 'Fresh Venue', id: 'fresh' },
                    'create'
                )
            ]
        });
        expect(venuesOf(freshRoot)).toContain('  - name: Fresh Venue\n    id: fresh');
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
