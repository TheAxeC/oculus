// Layer 3, view helper tests. Project-card paths, labels and deadlines are checked without a DOM.

import { describe, expect, it } from 'vitest';
import {
    codeLabel,
    deadline,
    deckSlideOf,
    matching,
    nameOf,
    subOf,
    urlOf
} from '../../../../src/lib/views/shared/card/card.ts';
import type { Project } from '../../../../src/lib/data/model.ts';

const translate = (key: string, ...args: (string | number)[]): string => `${key}:${args.join(',')}`;

function project(deadlineValue?: string): Project {
    return {
        id: 'one',
        title: 'One',
        tier: 'active',
        ghost: false,
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
        folder: '',
        file: '',
        deadline: deadlineValue
    };
}

describe('card file helpers', () => {
    const rows = [
        { path: 'manuscript/Main.tex', size: 10, mtime: 1 },
        { path: 'code/run.py', size: 20, mtime: 2 }
    ];

    it('matches paths and splits their visible parts', () => {
        expect(matching(rows, ' MAIN ')).toEqual([rows[0]]);
        expect(matching(rows, '')).toBe(rows);
        expect(nameOf('code/run.py')).toBe('run.py');
        expect(subOf('code/run.py')).toBe('code');
        expect(nameOf('README.md')).toBe('README.md');
        expect(subOf('README.md')).toBe('');
    });

    it('encodes every path segment for api/file', () => {
        expect(urlOf('projects/one space', 'a#b/file.md')).toBe(
            '/api/file/hub/projects/one%20space/a%23b/file.md'
        );
    });
});

describe('card labels', () => {
    it('maps every code state through the catalog', () => {
        expect(codeLabel('deposited', translate)).toBe('board.code_deposited:');
        expect(codeLabel('review-anon', translate)).toBe('board.code_anon:');
        expect(codeLabel('none', translate)).toBe('board.code_pending:');
        expect(codeLabel('', translate)).toBe('board.code_none:');
    });

    it('derives overdue, near, submitted and absent deadlines', () => {
        const now = Date.UTC(2026, 8, 14);
        expect(deadline(project(), [], now, translate)).toBeNull();
        expect(deadline(project('2026-09-13'), [], now, translate)).toEqual({
            label: 'project.card.overdue:1',
            tone: 'red'
        });
        expect(deadline(project('2026-09-20'), [], now, translate)).toEqual({
            label: 'project.card.due_days:6',
            tone: 'amber'
        });
        expect(deadline(project('2026-10-20'), ['submitted'], now, translate)).toEqual({
            label: '2026-10-20'
        });
    });
});

describe('the deck a card opens', () => {
    it('opens at the project own first slide, whatever else its PRESENT.md declares', () => {
        const one = project();
        one.present = [
            { id: 'one', projectId: 'one', specs: [], panels: [], method: [], results: [] },
            { id: 'one/data', projectId: 'one', specs: [], panels: [], method: [], results: [] }
        ];
        expect(deckSlideOf(one)).toBe('one');
    });

    it('opens at nothing for a project with no slide, which is what hides the control', () => {
        expect(deckSlideOf(project())).toBeNull();
        const bare = project();
        bare.present = [];
        expect(deckSlideOf(bare)).toBeNull();
    });
});
