// Layer 2, server tests. What the line writes do to a manifest over a hub of its own: a subtask
// line ticked, reopened, dated, renamed, given people and removed, and the follow-up notes added,
// changed, marked done and open again, given people and deleted, each as the reader of the notes
// reads it back. The other manifest writes are writes.test.ts, beside this.
//
// The hub here is a synthetic one under the system temporary directory (`personalWorld`), and
// every path this file writes is inside it; each row writes a research manifest, a hub's personal
// manifest or a repository's, and the other two files stay as they were.
// @module-tag slow: its cases write a hub of their own and time out under the load of a full npm
// test, so npm test leaves it out.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { followups } from '../../../src/lib/data/shapes/shapes.ts';
import {
    writeFollowup,
    writeManifest,
    writeSubtask,
    writeSubtaskAdd
} from '../../../src/lib/server/edit/writes.ts';
import { FOLLOWUP } from '../../../src/lib/server/edit/entry-edit/index.ts';
import { it } from '../../fixtures/scratch.ts';
import { MANIFEST, SUBJECTS, fileOf, personalWorld, type Subject } from './writes-fixture.ts';
import { PERSONAL_MANIFEST } from '../../routes/edit/write-fixture.ts';

/** A manifest as the YAML parser reads it, for its `followup:` value. */
type Manifest = { followup?: unknown };

/** A row of the subtask-line table: `added` is the text the add appends to the file. */
type LineRow = { name: string; subject: Subject; first: number; added: string };

const LINE_ROWS: LineRow[] = [
    {
        name: 'a research project',
        subject: 'alpha',
        first: 0,
        added: 'subtasks:\n  - { do: write it }\n'
    },
    { name: 'a hub project', subject: 'idea', first: 1, added: '  - { do: write it }\n' },
    { name: 'a repository project', subject: 'r', first: 1, added: '  - { do: write it }\n' }
];

describe('writing one subtask line', () => {
    it.each(LINE_ROWS)(
        'ticks, reopens, edits and removes a line of a manifest',
        { tags: ['slow'] },
        (row) => {
            const world = personalWorld();
            const file = fileOf(world, row.subject);
            const original = readFileSync(file, 'utf8');
            const into = [world.root, world.config] as const;
            const host = { id: row.subject };
            const key = String(row.first);
            expect(writeManifest(...into, row.subject, {}).changed, row.name).toEqual([]);
            const added = writeSubtaskAdd(...into, host, { do: 'write it' });
            expect(added.changed, row.name).toEqual(['subtasks']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(original + row.added);
            const done = writeSubtask(...into, host, key, 'done');
            expect(done.changed, row.name).toEqual(['done']);
            expect(readFileSync(file, 'utf8'), row.name).toContain(
                '- { do: write it, done: true }'
            );
            const open = writeSubtask(...into, host, key, 'reopen');
            expect(open.changed, row.name).toEqual(['done']);
            expect(readFileSync(file, 'utf8'), row.name).toContain('- { do: write it }');
            const dated = writeSubtask(...into, host, key, 'deadline', '2026-12-01');
            expect(dated.changed, row.name).toEqual(['deadline']);
            expect(readFileSync(file, 'utf8'), row.name).toContain(
                '- { do: write it, deadline: 2026-12-01 }'
            );
            const renamed = writeSubtask(...into, host, key, 'do', 'write it twice');
            expect(renamed.changed, row.name).toEqual(['do']);
            expect(readFileSync(file, 'utf8'), row.name).toContain(
                '- { do: write it twice, deadline: 2026-12-01 }'
            );
            const blank = writeSubtask(...into, host, key, 'do', ' ');
            expect([blank.changed, blank.refused.map((one) => one.field)], row.name).toEqual([
                [],
                ['do']
            ]);
            const undated = writeSubtask(...into, host, key, 'deadline', '');
            expect(undated.changed, row.name).toEqual(['deadline']);
            expect(readFileSync(file, 'utf8'), row.name).toContain('- { do: write it twice }');
            const removed = writeSubtask(...into, host, key, 'delete');
            expect(removed.changed, row.name).toEqual(['subtasks']);
            expect(readFileSync(file, 'utf8'), row.name).not.toContain('write it');
            for (const one of SUBJECTS.filter((other) => other !== row.subject))
                expect(readFileSync(fileOf(world, one), 'utf8'), `${row.name}: ${one}`).toBe(
                    one === 'alpha' ? MANIFEST : PERSONAL_MANIFEST
                );
            if (row.subject !== 'alpha')
                expect(readFileSync(file, 'utf8'), row.name).toBe(original);
        }
    );

    it('sets and drops the people of a subtask line', { tags: ['slow'] }, () => {
        const world = personalWorld();
        const file = fileOf(world, 'alpha');
        const original = readFileSync(file, 'utf8');
        const into = [world.root, world.config] as const;
        const host = { id: 'alpha' };
        writeSubtaskAdd(...into, host, { do: 'write it', deadline: '2026-12-01' });
        const lead = writeSubtask(...into, host, '0', 'lead', ['ann']);
        expect(lead.changed).toEqual(['lead']);
        expect(readFileSync(file, 'utf8')).toBe(
            `${original}subtasks:\n  - { do: write it, deadline: 2026-12-01, lead: [ann] }\n`
        );
        const dropped = writeSubtask(...into, host, '0', 'lead', []);
        expect(dropped.changed).toEqual(['lead']);
        expect(readFileSync(file, 'utf8')).toBe(
            `${original}subtasks:\n  - { do: write it, deadline: 2026-12-01 }\n`
        );
    });
});

describe('writing the follow-up notes of a manifest', () => {
    it.each(LINE_ROWS)(
        'adds notes to a list, changes one, marks one done and open, sets its people, and deletes one and the list with the last',
        { tags: ['slow'] },
        (row) => {
            const world = personalWorld();
            const file = fileOf(world, row.subject);
            const original = readFileSync(file, 'utf8');
            const into = [world.root, world.config] as const;
            const host = { id: row.subject };
            const first = writeSubtaskAdd(...into, host, { do: 'ask Ann' }, FOLLOWUP);
            expect(first.changed, row.name).toEqual(['followup']);
            const second = writeSubtaskAdd(
                ...into,
                host,
                { do: 'chase the call', after: '2026-12-01', deadline: '2026-12-09' },
                FOLLOWUP
            );
            expect(second.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: ask Ann }\n  - { do: chase the call, after: 2026-12-01 }\n`
            );
            const later = writeFollowup(...into, host, '0', 'after', '2026-11-30');
            expect(later.changed, row.name).toEqual(['after']);
            const renamed = writeFollowup(...into, host, '0', 'do', 'ask Ann again');
            expect(renamed.changed, row.name).toEqual(['do']);
            const blank = writeFollowup(...into, host, '0', 'do', ' ');
            expect([blank.changed, blank.refused.map((one) => one.field)], row.name).toEqual([
                [],
                ['do']
            ]);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: ask Ann again, after: 2026-11-30 }\n  - { do: chase the call, after: 2026-12-01 }\n`
            );
            const done = writeFollowup(...into, host, '0', 'done');
            expect(done.changed, row.name).toEqual(['done']);
            expect(readFileSync(file, 'utf8'), row.name).toContain(
                '- { do: ask Ann again, after: 2026-11-30, done: true }'
            );
            const open = writeFollowup(...into, host, '0', 'reopen');
            expect(open.changed, row.name).toEqual(['done']);
            const still = writeFollowup(...into, host, '0', 'reopen');
            expect(still.changed, row.name).toEqual([]);
            const team = writeFollowup(...into, host, '0', 'supervisors', ['ann', 'bob', 'ann']);
            expect(team.changed, row.name).toEqual(['supervisors']);
            const quoted = writeFollowup(...into, host, '1', 'lead', ['a,b']);
            expect(quoted.changed, row.name).toEqual(['lead']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: ask Ann again, after: 2026-11-30, supervisors: [ann, bob] }\n  - { do: chase the call, after: 2026-12-01, lead: ["a,b"] }\n`
            );
            const read = followups((parse(readFileSync(file, 'utf8')) as Manifest).followup);
            expect(read[1]?.lead, row.name).toEqual(['a,b']);
            const dropped = writeFollowup(...into, host, '0', 'supervisors', []);
            expect(dropped.changed, row.name).toEqual(['supervisors']);
            const removed = writeFollowup(...into, host, '0', 'delete');
            expect(removed.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: chase the call, after: 2026-12-01, lead: ["a,b"] }\n`
            );
            const last = writeFollowup(...into, host, '0', 'delete');
            expect(last.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(original);
            const kept = writeSubtaskAdd(
                ...into,
                host,
                { do: 'x', done: true, collaborators: ['ann'], snooze: '2026-12-01' },
                FOLLOWUP
            );
            expect(kept.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: x, done: true, collaborators: [ann] }\n`
            );
        }
    );
});
