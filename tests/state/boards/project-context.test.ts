// The plain project context copied from a card, assembled from a synthetic project and snapshot.

import { describe, expect, it } from 'vitest';
import { contextText } from '../../../src/lib/state/boards/project-context.ts';
import type { Project, Snapshot } from '../../../src/lib/data/model.ts';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';

const project: Project = {
    id: 'alpha',
    tier: 'active',
    ghost: false,
    type: 'active',
    title: 'Alpha project',
    chips: ['lead', 'blocked'],
    eli5: 'A plain explanation.',
    results: ['One result', 'Another result'],
    ideas: [],
    next: 'Run the next experiment.',
    latest: 'The latest note.',
    deadline: '2026-10-01',
    waitingOn: [],
    followups: [],
    subtasks: [],
    relatedIds: [],
    venueId: 'jbi',
    fundingIds: [],
    datasetIds: [],
    pillarIds: [],
    domainIds: [],
    collaborators: [],
    docs: [],
    folder: 'projects/active/alpha',
    file: '/hub/projects/active/alpha/project.yml'
};

const snapshot: Snapshot = {
    version: 1,
    entities: {
        projects: { alpha: project },
        venues: {
            jbi: { id: 'jbi', name: 'Journal of Biomedical Informatics', short: 'JBI', themes: [] },
            plain: { id: 'plain', name: 'Plain Journal', short: '', themes: [] }
        },
        datasets: {},
        pillars: {},
        domains: {},
        funding: {},
        people: {},
        organisations: {},
        collections: {},
        feeds: NO_FEEDS,
        career: null
    },
    relations: {
        projectVenue: [],
        projectFunding: [],
        projectDataset: [],
        projectPillar: [],
        projectDomain: [],
        projectRelated: [],
        fundingPillar: [],
        projectPerson: [],
        jointWorkPerson: [],
        personOrganisation: [],
        fundingOrganisation: []
    },
    findings: []
};

describe('contextText', () => {
    it('assembles every named project field in a stable plain-text form', () => {
        expect(contextText(project, snapshot)).toBe(
            [
                '# Alpha project',
                'id: alpha',
                'type: active',
                'status: lead, blocked',
                'venue: JBI',
                'deadline: 2026-10-01',
                'eli5: A plain explanation.',
                '',
                'results:',
                '- One result',
                '- Another result',
                'next: Run the next experiment.',
                'latest: The latest note.',
                'folder: projects/active/alpha'
            ].join('\n')
        );
    });
});

it('falls back to the venue name when its short name is empty', () => {
    const text = contextText({ ...project, venueId: 'plain' }, snapshot);
    expect(text).toContain('venue: Plain Journal');
});
