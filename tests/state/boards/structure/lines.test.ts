// Pure Pillars and Domains joins over a compact portfolio fixture.

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

function project(
    id: string,
    type: string,
    tier: Project['tier'],
    pillars: string[],
    domains: string[] = []
): Project {
    return {
        id,
        tier,
        ghost: false,
        type,
        title: id,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        venueId: id === 'active' ? 'journal' : undefined,
        fundingIds: [],
        datasetIds: [],
        pillarIds: pillars,
        domainIds: domains,
        collaborators: [],
        docs: [],
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`
    };
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
    // revert: src/lib/state/boards/structure/lines.ts:106 => return ordered;
    it('are the listed ones in the file order, then every unlisted one in registry order', () => {
        const lines = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        expect(
            inEntryOrder(lines, [{ id: 'c' }, { id: 'gone' }, { id: 'a' }]).map((one) => one.id)
        ).toEqual(['c', 'a', 'b']);
        expect(inEntryOrder(lines, []).map((one) => one.id)).toEqual(['a', 'b', 'c']);
    });

    // revert: src/lib/state/boards/structure/lines.ts:129 => return Object.values(held);
    it("are the portfolio's domains or pillars in their file's order, and none before it", () => {
        const snapshot = {
            entities: { domains: { a: { id: 'a' }, b: { id: 'b' } }, pillars: { p: { id: 'p' } } }
        } as unknown as Parameters<typeof registryLines>[0];
        const listed = registryLines(snapshot, 'domains', [{ id: 'b' }]);
        expect(listed.map((one) => one.id)).toEqual(['b', 'a']);
        expect(registryLines(snapshot, 'pillars', []).map((one) => one.id)).toEqual(['p']);
        expect(registryLines(null, 'domains', [])).toEqual([]);
    });

    // revert: src/lib/state/boards/structure/lines.ts:140 => ;
    it('leave out a domain no real project names', () => {
        const domains = [{ id: 'eeg' }, { id: 'ecg' }] as Domain[];
        const projects = [
            { id: 'p', type: 'active', tier: 'active', domainIds: ['eeg'] }
        ] as unknown as Parameters<typeof domainsWithMembers>[1];
        const shown = domainsWithMembers(domains, projects, []);
        expect(shown.map((one) => one.domain.id)).toEqual(['eeg']);
        expect(shown[0].projects.map((one) => one.id)).toEqual(['p']);
    });

    // revert: src/lib/state/boards/structure/lines.ts:151 => provisional: [],
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
    // revert: src/lib/state/boards/structure/lines.ts:169 => ;
    it('keep a keyed row with its label and colour, label a bare key by itself, and drop the rest', () => {
        expect(
            venueTiers([
                { key: 'q1', label: 'Q1', color: '#123456' },
                { key: 'unrated' },
                { label: 'no key' },
                'not a row',
                null
            ])
        ).toEqual([
            { key: 'q1', label: 'Q1', color: '#123456' },
            { key: 'unrated', label: 'unrated' }
        ]);
        expect(venueTiers(undefined)).toEqual([]);
    });

    // revert: src/lib/state/boards/structure/lines.ts:174 => return groups.length;
    it('count the archived projects of every group together', () => {
        expect(
            archivedCount([
                { type: 'dropped', count: 2, projects: [] },
                { type: 'merged', count: 3, projects: [] }
            ])
        ).toBe(5);
    });
});
