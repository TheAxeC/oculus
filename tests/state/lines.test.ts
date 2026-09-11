// Pure Programs and Domains joins over a compact portfolio fixture.

import { describe, expect, it } from 'vitest';
import {
    archival,
    domainMembers,
    inFlight,
    isDormant,
    lineMembers,
    orphans,
    tierStrip
} from '../../src/lib/state/lines.ts';
import type { Domain, Program, Project, Venue } from '../../src/lib/data/model.ts';

function project(
    id: string,
    type: string,
    tier: Project['tier'],
    programs: string[],
    domains: string[] = []
): Project {
    return {
        id,
        tier,
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
        programIds: programs,
        domainIds: domains,
        collaborators: [],
        docs: [],
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`
    };
}

const line: Program = {
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

describe('research line joins', () => {
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
