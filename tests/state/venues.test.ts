// The pure rules of the Venues view: real project membership, facets, tones, timing and search.
// Fixtures keep each rule independent of Svelte and the live hub.

import { describe, expect, it } from 'vitest';
import {
    applyThemeFacets,
    freeTone,
    isBiennial,
    monthIndex,
    parseVenuesState,
    quartileTone,
    realProjects,
    sparkline,
    themeFacets,
    timeline,
    venueSearch,
    venueUsers,
    type Project,
    type Venue
} from '../../src/lib/state/venues.ts';

function project(id: string, over: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        title: id,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...over
    };
}

function venue(id: string, over: Partial<Venue> = {}): Venue {
    return { id, name: id, themes: [], ...over };
}

describe('venue project joins', () => {
    const projects = [
        project('active', { type: 'active', venueId: 'one' }),
        project('paper', { tier: 'manuscripts', type: 'manuscript', venueId: 'one' }),
        project('published', { tier: 'archive', type: 'published', venueId: 'one' }),
        project('dead', { tier: 'archive', type: 'dropped', venueId: 'one' }),
        project('coauthor', { tier: 'coauthor', type: 'submitted', venueId: 'two' })
    ];

    it('keeps project-tier work and non-dead archive or coauthor work', () => {
        expect(realProjects(projects, ['dropped']).map((item) => item.id)).toEqual([
            'active',
            'paper',
            'published',
            'coauthor'
        ]);
    });

    it('returns a venue users list and marks two live users as concentrated', () => {
        expect(venueUsers(venue('one'), realProjects(projects, ['dropped']))).toEqual({
            projects: [projects[0], projects[1], projects[2]],
            concentrated: true
        });
        expect(venueUsers(venue('two'), projects).concentrated).toBe(false);
    });
});

describe('theme facets and search', () => {
    const venues = [
        venue('one', {
            name: 'Clinical Journal',
            short: 'CJ',
            wants: 'care data',
            themes: ['clinical', 'ml']
        }),
        venue('two', { name: 'ML Conference', short: 'MLC', wants: 'methods', themes: ['ml'] }),
        venue('three', { name: 'Imaging Venue', themes: ['imaging'] })
    ];

    it('counts themes most frequent first', () => {
        expect(themeFacets(venues)).toEqual([
            { theme: 'ml', count: 2 },
            { theme: 'clinical', count: 1 },
            { theme: 'imaging', count: 1 }
        ]);
    });

    it('keeps a venue when any of its themes remains on', () => {
        expect(applyThemeFacets(venues, ['clinical', 'imaging']).map((item) => item.id)).toEqual([
            'one',
            'two'
        ]);
        expect(applyThemeFacets(venues, []).length).toBe(3);
    });

    it('searches names, short names, scope and themes with every word', () => {
        expect(venueSearch(venues, 'clinical care').map((item) => item.id)).toEqual(['one']);
        expect(venueSearch(venues, ['ml', 'methods']).map((item) => item.id)).toEqual(['two']);
    });
});

describe('venue tones', () => {
    it('maps quartiles and conference ranks to their tones', () => {
        expect(['Q1', 'A*', 'prestige'].map(quartileTone)).toEqual(['violet', 'violet', 'violet']);
        expect(['Q2', 'CORE A', 'other'].map(quartileTone)).toEqual(['blue', 'blue', 'grey']);
    });

    it('maps publication cost words to their tones', () => {
        expect(['free route', 'hybrid', 'APC', 'unknown'].map(freeTone)).toEqual([
            'green',
            'amber',
            'red',
            'grey'
        ]);
    });
});

describe('conference timing', () => {
    const venues = [
        venue('one', { deadlineMonth: 'Sep', heldMonth: 'Jan' }),
        venue('two', { deadlineMonth: 'Oct', timing: 'biennial meeting' }),
        venue('three', { deadlineMonth: 'Aug', quartile: 'A* biennial' }),
        venue('four', { heldMonth: 'May' })
    ];

    it('parses month words and detects biennial venues', () => {
        expect(monthIndex('September')).toBe(9);
        expect(monthIndex('bad')).toBe(0);
        expect(isBiennial(venues[1])).toBe(true);
        expect(isBiennial(venues[2])).toBe(true);
        expect(isBiennial(venues[0])).toBe(false);
    });

    it('builds twelve columns and the nearest deadlines across year end', () => {
        const result = timeline(venues, 'Sep');
        expect(result.months).toHaveLength(12);
        expect(result.months[8].current).toBe(true);
        expect(result.months[8].deadlines[0].venue.id).toBe('one');
        expect(result.months[0].held[0].venue.id).toBe('one');
        expect(result.next.map((item) => [item.venue.id, item.distance])).toEqual([
            ['one', 0],
            ['two', 1],
            ['three', 11]
        ]);
        expect(result.counts[8]).toBe(1);
    });

    it('returns only the seven nearest deadlines in month-distance order', () => {
        const crowded = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map(
            (deadlineMonth, at) => venue(`deadline-${at}`, { deadlineMonth })
        );
        expect(timeline(crowded, 'Sep').next.map((item) => item.venue.id)).toEqual([
            'deadline-0',
            'deadline-1',
            'deadline-2',
            'deadline-3',
            'deadline-4',
            'deadline-5',
            'deadline-6'
        ]);
    });

    it('renders the count density over the configured ramp', () => {
        expect(sparkline([0, 1, 2], ' .#')).toBe(' .#');
        expect(sparkline([1], '')).toBe('');
    });
});

describe('saved venue state', () => {
    it('defaults both sections open and keeps valid saved fields only', () => {
        expect(parseVenuesState(undefined)).toEqual({
            search: '',
            off: [],
            journalsOpen: true,
            conferencesOpen: true
        });
        expect(
            parseVenuesState({
                search: 'clinical',
                off: ['ml', 3],
                journalsOpen: false,
                conferencesOpen: 'no'
            })
        ).toEqual({
            search: 'clinical',
            off: ['ml'],
            journalsOpen: false,
            conferencesOpen: true
        });
    });
});
