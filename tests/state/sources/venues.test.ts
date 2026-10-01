// The pure rules of the Venues view: real project membership, facets, tones, timing and search.
// Fixtures keep each rule independent of Svelte and the live hub.

import { describe, expect, it } from 'vitest';
import { describeOffFacets } from './off-facets.ts';
import {
    freeTone,
    isBiennial,
    monthIndex,
    parseVenuesState,
    quartileTone,
    realProjects,
    sparkBars,
    timeline,
    venueSearch,
    venueUsers,
    type Project,
    type Venue,
    venuesByCategory
} from '../../../src/lib/state/sources/venues.ts';
import {
    applyThemeFacets,
    themeFacets,
    themeWordLabels
} from '../../../src/lib/state/shared/words/themes.ts';

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
        pillarIds: [],
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

    it('counts themes most frequent first, each under its venue_themes label or its word', () => {
        const labels = themeWordLabels([
            { key: 'clinical', label: 'Clinical' },
            { key: 'imaging', label: 'Imaging' }
        ]);
        expect(themeFacets(venues, labels)).toEqual([
            { theme: 'ml', label: 'ml', count: 2 },
            { theme: 'clinical', label: 'Clinical', count: 1 },
            { theme: 'imaging', label: 'Imaging', count: 1 }
        ]);
        expect(themeFacets(venues).map((facet) => facet.label)).toEqual([
            'ml',
            'clinical',
            'imaging'
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

    it('finds a venue by a theme label typed as the facet draws it', () => {
        const themed = [
            venue('learning', { themes: ['core-ml', 'high-end'] }),
            venue('systems', { themes: ['cs', 'systems'] })
        ];
        expect(venueSearch(themed, 'Core ML').map((item) => item.id)).toEqual(['learning']);
        expect(venueSearch(themed, 'High-end').map((item) => item.id)).toEqual(['learning']);
        expect(venueSearch(themed, 'CS').map((item) => item.id)).toEqual(['systems']);
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

    it('gives each count the height in eighths the block ramp drew it at', () => {
        expect(sparkBars([0, 1, 2, 3, 4, 5, 6])).toEqual([0, 1, 2, 3, 5, 6, 7]);
        expect(sparkBars([0, 2, 1])).toEqual([0, 7, 3]);
        expect(sparkBars([0, 0])).toEqual([0, 0]);
        expect(sparkBars([])).toEqual([]);
    });
});

describe('saved venue state', () => {
    it('defaults both sections open and keeps valid saved fields only', () => {
        expect(parseVenuesState(undefined)).toEqual({
            search: '',
            off: [],
            journalsOpen: true,
            conferencesOpen: true,
            adding: false,
            editing: ''
        });
        expect(
            parseVenuesState({
                search: 'clinical',
                off: ['ml', 3],
                journalsOpen: false,
                conferencesOpen: 'no',
                adding: true,
                editing: 'bspc'
            })
        ).toEqual({
            search: 'clinical',
            off: ['ml'],
            journalsOpen: false,
            conferencesOpen: true,
            adding: true,
            editing: 'bspc'
        });
    });
});

describe('the venues by category', () => {
    it('are the journals and the conferences, each in the order given, anything else left out', () => {
        const venues = [
            { id: 'j1', category: 'journal' },
            { id: 'c1', category: 'conference' },
            { id: 'w1', category: 'workshop' },
            { id: 'j2', category: 'journal' }
        ] as unknown as Parameters<typeof venuesByCategory>[0];
        const split = venuesByCategory(venues);
        expect(split.journals.map((one) => one.id)).toEqual(['j1', 'j2']);
        expect(split.conferences.map((one) => one.id)).toEqual(['c1']);
    });
});

describe('the month a timeline is read at', () => {
    const venues = [
        venue('a', { deadlineMonth: 'Mar', heldMonth: 'Sep' }),
        venue('b', { deadlineMonth: 'Dec' }),
        venue('c', { deadlineMonth: 'jan' }),
        venue('d', { deadlineMonth: 'Mar' })
    ];
    const fromDecember = [
        ['b', 12, 0],
        ['c', 1, 1],
        ['a', 3, 3],
        ['d', 3, 3]
    ];
    const fromJanuary = [
        ['c', 1, 0],
        ['a', 3, 2],
        ['d', 3, 2],
        ['b', 12, 11]
    ];

    it.each([
        ['text of a number', '5', [], fromDecember],
        ['text of a number above the months', '12', [], fromDecember],
        ['an empty word', '', [], fromDecember],
        ['a word that is no month', 'xyz', [], fromDecember],
        [
            'a month word',
            'May',
            [5],
            [
                ['b', 12, 7],
                ['c', 1, 8],
                ['a', 3, 10],
                ['d', 3, 10]
            ]
        ],
        [
            'a month word with spaces and case',
            ' may ',
            [5],
            [
                ['b', 12, 7],
                ['c', 1, 8],
                ['a', 3, 10],
                ['d', 3, 10]
            ]
        ],
        [
            'a longer month word',
            'Sept',
            [9],
            [
                ['b', 12, 3],
                ['c', 1, 4],
                ['a', 3, 6],
                ['d', 3, 6]
            ]
        ],
        ['December', 12, [12], fromDecember],
        ['January', 1, [1], fromJanuary],
        ['zero', 0, [1], fromJanuary],
        ['below the months', -3, [1], fromJanuary],
        ['minus infinity', -Infinity, [1], fromJanuary],
        ['above the months', 13, [12], fromDecember],
        ['infinity', Infinity, [12], fromDecember],
        [
            'between two months',
            5.5,
            [],
            [
                ['b', 12, 6.5],
                ['c', 1, 7.5],
                ['a', 3, 9.5],
                ['d', 3, 9.5]
            ]
        ],
        [
            'NaN',
            NaN,
            [],
            [
                ['a', 3, NaN],
                ['b', 12, NaN],
                ['c', 1, NaN],
                ['d', 3, NaN]
            ]
        ]
    ])('reads %s', (_label, today, current, next) => {
        const read = timeline(venues, today);
        expect(read.months.filter((month) => month.current).map((month) => month.index)).toEqual(
            current
        );
        expect(read.next.map((one) => [one.venue.id, one.month, one.distance])).toEqual(next);
    });
});

describeOffFacets('venues', (off) => parseVenuesState({ off }).off);
