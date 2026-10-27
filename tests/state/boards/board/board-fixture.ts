// Layer 2, client-state test fixture. The shipped config and the synthetic projects the board rule
// tables run over: the merged config and its text catalog, the user (the person marked `self:
// true`), the projects of the cases, a snapshot holding projects with or without that person, and
// the shipped config with other boards in `boards:`. One copy, so board-rules.test.ts says only its
// rows.

import type { Id, Project, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { NO_FEEDS, fixtureProject } from '../../../fixtures/entities-fixture.ts';

export const { config: CONFIG } = loadConfig(engineDir());
export const CATALOG = textCatalog(CONFIG);

/** The user, the person marked `self: true`. */
export const SELF = 'axel-faes';
export const MINE: ReadonlySet<Id> = new Set([SELF]);
export const NOBODY: ReadonlySet<Id> = new Set();

/** The projects of the cases, by case number, each with only the fields the case names. */
export const CASES: Record<string, Partial<Project>> = {
    c1: { tier: 'research', lead: [SELF], stage: 'revision' },
    c2: { tier: 'research', lead: ['pirmani'], collaborators: ['peeters'], stage: 'submitted' },
    c3: { tier: 'research', lead: [SELF], stage: 'published', form: 'thesis' },
    c4: { tier: 'research', lead: [SELF], stage: 'stopped' },
    c5: { tier: 'software', lead: [SELF], stage: 'nascent' },
    c6: { tier: 'personal', lead: [SELF], stage: 'nascent' },
    c7: {
        tier: 'software',
        lead: ['pirmani'],
        collaborators: ['peeters', SELF],
        stage: 'released'
    },
    c8: { tier: 'research', lead: ['student'], supervisors: [SELF], stage: 'exploring' },
    c9: { tier: 'research', lead: [SELF], supervisors: [SELF], stage: 'exploring' },
    // A tier word `tiers:` does not hold is read as no tier (G32 has the finding naming the word).
    c10: { tier: undefined, lead: [SELF], stage: 'exploring' },
    c11: { tier: undefined, lead: [SELF], stage: 'exploring' },
    c12: { tier: 'research', stage: 'exploring' },
    c13: { tier: 'research', lead: [SELF], stage: 'stopped', chips: ['parked'] },
    c14: { tier: 'research', lead: [SELF], stage: 'published' }
};

/** One project of the cases, or a project made of the fields given. */
export function project(id: string, over: Partial<Project> = CASES[id]): Project {
    return fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, ...over });
}

/** A snapshot holding the projects and, when `self` is set, the person `self` names. */
export function snapshotOf(projects: Project[], self = true, related: [Id, Id][] = []): Snapshot {
    const people = self ? { [SELF]: { id: SELF, name: 'Axel', self: true } } : {};
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one) => [one.id, one])),
            venues: {},
            pillars: {},
            domains: {},
            funding: {},
            people,
            organisations: {},
            resources: {},
            collections: {},
            datasets: {},
            feeds: NO_FEEDS,
            career: null
        },
        relations: { projectRelated: related, projectVenue: [] },
        findings: []
    } as unknown as Snapshot;
}

/** The merged config with other boards in `boards:` after the shipped ones. */
export function withBoards(boards: Record<string, unknown>): Record<string, unknown> {
    return { ...CONFIG, boards: { ...(CONFIG.boards as Record<string, unknown>), ...boards } };
}
