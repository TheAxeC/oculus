// What writeManifest does over a hub of its own: the subtask, career host, entry and idea writes
// beside it. The collection entry writes are writes-collection.test.ts, beside this.
//
// The hub here is a synthetic one under the system temporary directory, and every path this file
// writes is asserted to be inside it before it is written; nothing in this file opens the real hub
// for writing, and the schema it checks against is the real config/catalogs/manifest-schema.yml,
// so what the form offers and what the write accepts are the same list.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    createEntry,
    createIdea,
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
    CAREER,
    wider,
    tasksOf
} from './writes-fixture.ts';

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
});

describe('writing one subtask line', () => {
    it('ticks and reopens a line of a manifest', { tags: ['slow'] }, () => {
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
                '  chips: [nascent]',
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
});
