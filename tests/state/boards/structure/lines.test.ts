// Layer 2, client-state tests. The Pillars and Domains joins over a compact portfolio fixture.

import { describe, expect, it } from 'vitest';
import {
    archival,
    domainMembers,
    inFlight,
    isDormant,
    lineMembers,
    orphans,
    tierStrip,
    archivedCount,
    domainsWithMembers,
    inEntryOrder,
    lineKinds,
    registryLines,
    venueTiers
} from '../../../../src/lib/state/boards/structure/lines.ts';
import type { Domain, Pillar, Project, Venue } from '../../../../src/lib/data/model/index.ts';
import { fixtureProject } from '../../../fixtures/entities-fixture.ts';

function project(
    id: string,
    type: string,
    tier: Project['tier'],
    pillars: string[],
    domains: string[] = []
): Project {
    return fixtureProject({
        id,
        tier,
        type,
        title: id,
        venueId: id === 'active' ? 'journal' : undefined,
        pillarIds: pillars,
        domainIds: domains,
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`
    });
}

const line: Pillar = {
    id: 'line',
    title: 'Line',
    fundingIds: [],
    projectIds: []
};
const domain: Domain = { id: 'heart', title: 'Heart', projectIds: [] };
const projects = [
    project('active', 'active', 'active', ['line', 'second'], ['heart']),
    project('idea', 'idea', 'ideas', ['line']),
    project('published', 'published', 'archive', ['line'], ['heart']),
    project('orphan', 'manuscript', 'manuscripts', ['missing']),
    project('dead', 'dropped', 'archive', ['line'], ['heart'])
];
const dead = ['nogo', 'dropped', 'disproved'];
const venues: Venue[] = [{ id: 'journal', name: 'Journal', tier: 'strong', themes: [] }];

describe('pillar joins', () => {
    it('keeps real membership and defines in-flight and dormant consistently', () => {
        expect(lineMembers(line, projects, dead).map((item) => item.id)).toEqual([
            'active',
            'idea',
            'published'
        ]);
        expect(inFlight(projects).map((item) => item.id)).toEqual(['active', 'orphan']);
        expect(isDormant([projects[2]])).toBe(true);
        expect(isDormant([projects[1]])).toBe(false);
    });

    it('counts the in-flight venue tier with unrated fallback in configured order', () => {
        const rows = tierStrip([projects[0], projects[3]], venues, [
            { key: 'flagship', label: 'flagship' },
            { key: 'strong', label: 'strong' },
            { key: 'unrated', label: 'unrated' }
        ]);
        expect(rows.map((row) => [row.key, row.count])).toEqual([
            ['strong', 1],
            ['unrated', 1]
        ]);
    });

    it('finds unknown line tags and groups non-real work in archive_dead order', () => {
        expect(orphans([line], projects, dead).map((item) => item.id)).toEqual(['orphan']);
        expect(archival(projects, dead).map((group) => [group.type, group.count])).toEqual([
            ['dropped', 1]
        ]);
    });

    it('joins a domain through the real-project rule', () => {
        expect(domainMembers(domain, projects, dead).map((item) => item.id)).toEqual([
            'active',
            'published'
        ]);
    });
});

describe('the lines in the order their file lists them', () => {
    it('are the listed ones in the file order, then every unlisted one in registry order', () => {
        const lines = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        expect(
            inEntryOrder(lines, [{ id: 'c' }, { id: 'gone' }, { id: 'a' }]).map((one) => one.id)
        ).toEqual(['c', 'a', 'b']);
        expect(inEntryOrder(lines, []).map((one) => one.id)).toEqual(['a', 'b', 'c']);
    });

    it("are the portfolio's domains or pillars in their file's order, and none before it", () => {
        const snapshot = {
            entities: { domains: { a: { id: 'a' }, b: { id: 'b' } }, pillars: { p: { id: 'p' } } }
        } as unknown as Parameters<typeof registryLines>[0];
        const listed = registryLines(snapshot, 'domains', [{ id: 'b' }]);
        expect(listed.map((one) => one.id)).toEqual(['b', 'a']);
        expect(registryLines(snapshot, 'pillars', []).map((one) => one.id)).toEqual(['p']);
        expect(registryLines(null, 'domains', [])).toEqual([]);
    });

    it('leave out a domain no real project names', () => {
        const domains = [{ id: 'eeg' }, { id: 'ecg' }] as Domain[];
        const projects = [
            { id: 'p', type: 'active', tier: 'active', domainIds: ['eeg'] }
        ] as unknown as Parameters<typeof domainsWithMembers>[1];
        const shown = domainsWithMembers(domains, projects, []);
        expect(shown.map((one) => one.domain.id)).toEqual(['eeg']);
        expect(shown[0].projects.map((one) => one.id)).toEqual(['p']);
    });

    it('split into the pillars, the provisional lines and the off-pillar ones', () => {
        const lines = [
            { id: 'a' },
            { id: 'b', kind: 'provisional' },
            { id: 'c', kind: 'offpillar' },
            { id: 'd', kind: 'core' }
        ] as Pillar[];
        const kinds = lineKinds(lines);
        expect(kinds.pillars.map((one) => one.id)).toEqual(['a', 'd']);
        expect(kinds.provisional.map((one) => one.id)).toEqual(['b']);
        expect(kinds.offpillar.map((one) => one.id)).toEqual(['c']);
    });
});

describe('the venue tiers the config names', () => {
    it('count the archived projects of every group together', () => {
        expect(
            archivedCount([
                { type: 'dropped', count: 2, projects: [] },
                { type: 'merged', count: 3, projects: [] }
            ])
        ).toBe(5);
    });
});

describe('the venue tiers, rows and lists of another type', () => {
    it('drops a row whose key is not a string and keeps a colour only when it is a string', () => {
        expect(venueTiers([{ key: 3 }, { key: 'a', color: 1 }])).toStrictEqual([
            { key: 'a', label: 'a' }
        ]);
        const rows = [
            [],
            { key: ['a'] },
            { key: 'b', label: 3 },
            { key: 'c', label: '' },
            { key: 'd', label: ['x'], color: '' },
            { key: 'e', label: 'E', color: null },
            { key: '' },
            { key: '', label: 'x' },
            undefined,
            4,
            'x',
            { key: 'f', label: 'F', color: '#fff', extra: 1 }
        ];
        expect(venueTiers(rows)).toStrictEqual([
            { key: 'b', label: 'b' },
            { key: 'c', label: '' },
            { key: 'd', label: 'd', color: '' },
            { key: 'e', label: 'E' },
            { key: 'f', label: 'F', color: '#fff' }
        ]);
    });

    it('is empty for anything that is not a list', () => {
        for (const held of [{}, 'x', null, 3, { 0: { key: 'a' } }]) {
            expect(venueTiers(held)).toStrictEqual([]);
        }
    });
});
