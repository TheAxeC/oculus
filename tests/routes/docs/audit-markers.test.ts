// Layer 2, route tests. The open markers the audit finds in a project's files are the words the
// hub's `audit.markers` names, and none when it names none: a marker of letters only is found as a
// whole word, and one that starts with a sign is found wherever it stands, inside a longer word
// too. Each row is a hub in a scratch folder holding the setting and the project's README
// (audit-fixture.ts).

import { describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import { findingsOf, hubOf, projectAt, said } from './audit-fixture.ts';

describe('the open markers of the audit', () => {
    const README = '# A\n\nNo TODOS here.\nCheck x%VERIFY this.\nA TODO left.\n';

    it("finds the hub's markers in a project's README, a word of letters only as a whole word (G125)", () => {
        const hub = hubOf("audit:\n  markers: [TODO, '%VERIFY']\n", {
            'projects/a/README.md': README
        });
        const found = findingsOf(hub, [projectAt('projects/a', { stage: 'exploring' })]);
        const todo = found.filter((one) => one.kind === 'todo');
        expect(todo.map((one) => one.where)).toEqual(['README.md']);
        expect(todo[0].message).toContain('Check x%VERIFY this.');
        expect(todo[0].message).toContain('2');
    });

    it('finds a marker that starts with a sign inside %TODO2 and %TODOS (G125)', () => {
        const hub = hubOf("audit:\n  markers: ['%TODO']\n", {
            'projects/a/README.md': '# A\n\nFix %TODO2 now.\nAnd %TODOS too.\nNo TODO here.\n'
        });
        const found = findingsOf(hub, [projectAt('projects/a', { stage: 'exploring' })]);
        const todo = found.filter((one) => one.kind === 'todo');
        expect(todo.map((one) => one.where)).toEqual(['README.md']);
        expect(todo[0].message).toBe(said('audit.msg_markers.other', '2', 'Fix %TODO2 now.'));
    });

    it('finds no marker in a hub whose settings name none (G125)', () => {
        const hub = hubOf('', { 'projects/a/README.md': README });
        const found = findingsOf(hub, [projectAt('projects/a', { stage: 'exploring' })]);
        expect(found.filter((one) => one.kind === 'todo')).toEqual([]);
    });
});
