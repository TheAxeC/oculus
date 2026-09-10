// The board's logic over a hand-built snapshot: which projects each preset shows, how they sort,
// what they are joined with, what the facets count, what a filter and a search leave, and what a
// saved state parses to. Everything here is pure, so nothing reads a file and nothing renders.
//
// The vocabulary is synthetic rather than the real config/vocab.yml. What is checked is that the
// board reads the vocabulary it is given; that the real one holds the keys these lookups need is
// tests/state/tones.test.ts's half of the gate, and it would fail there rather than here.

import { describe, expect, it } from 'vitest';
import {
    DEADLINE_SOON,
    NONE,
    applyFilters,
    authorLine,
    boardItems,
    bucketOf,
    daysUntil,
    emptyBoardState,
    facetValues,
    facets,
    firstSentence,
    parseBoardState,
    presetFor,
    slug,
    venueText,
    type BoardItem,
    type BoardPreset
} from '../../src/lib/state/board.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import type {
    Collection,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../src/lib/data/model.ts';

setVocab({
    palette: { '#7c5cff': 'c-violet', '#0d9488': 'c-teal', '#e2374d': 'c-crimson' },
    type_color: { active: '#0d9488', manuscript: '#7c5cff', idea: '#e2374d' },
    themes: {
        heart: { color: '#e2374d', label: 'Cardiology | ECG' },
        brain: { color: '#7c5cff', label: 'Neuroscience | EEG' }
    },
    status_legend: [
        { key: 'lead', icon: 'L', label: 'first author' },
        { key: 'submitted', icon: 'S', label: 'submitted / under review' }
    ]
});

/** The merged config the presets are read out of, holding one of everything they look for. */
const CONFIG: Record<string, unknown> = {
    board: {
        cols_project: ['Project', 'Authors', 'Venue', 'Status', 'Focus', 'Next'],
        cols_archive: ['Paper', 'Authors', 'Venue', 'Domain', 'Research line', 'Funding'],
        search: { projects: 'Search title | eli5 ...' }
    },
    tab_rollup: {
        projects: [
            { label: 'in progress', keys: ['active', 'manuscript'] },
            { label: 'idea', keys: ['idea'] }
        ],
        archive: [
            { label: 'papers', keys: ['journal'] },
            { label: 'dead-ends', keys: ['nogo'] }
        ],
        coauthor: [{ label: 'in progress', keys: ['submitted'] }]
    },
    type_order: ['active', 'manuscript', 'idea'],
    project_label_mode: 'short',
    archive_label_mode: 'full'
};

const EMPTY_RELATIONS: Relations = {
    projectVenue: [],
    projectFunding: [],
    projectDataset: [],
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
};

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
        title: id,
        chips: [],
        results: [],
        ideas: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`,
        ...over
    };
}

function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id.toUpperCase(), themes: [], ...over };
}

function collaborations(): Collection {
    return {
        id: 'collaborations',
        title: 'Collaborations',
        file: '/hub/network/collaborations.yml',
        entries: [
            {
                id: 'someone',
                title: 'Someone Else',
                fields: { key: 'someone' },
                file: '/hub/network/collaborations.yml',
                index: 0
            }
        ]
    };
}

/**
 * Six projects on the projects board, one on the archive board and one on the coauthor board.
 * `alpha` carries one distinctive word in every field the search reads, which is what the search
 * cases below look for.
 */
function snapshot(): Snapshot {
    const projects: Project[] = [
        project('alpha', 'active', {
            type: 'active',
            title: 'Alpha',
            short: 'shorthandle',
            authors: ['Faes', 'Someone'],
            year: 2026,
            chips: ['lead'],
            statusLine: 'submit-ready',
            focus: 'run',
            eli5: 'eli5token',
            next: 'nexttoken here. A second sentence.',
            latest: 'latesttoken',
            results: ['resulttoken'],
            ideas: ['ideatoken'],
            outcome: 'outcometoken',
            deadline: '2099-01-01',
            compute: 'hpc',
            codeAvailability: { status: 'deposited' },
            reproduced: { date: '2026-08-02', note: 'a note' },
            venueId: 'bspc',
            fundingIds: ['FAIR'],
            datasetIds: ['mimic'],
            programIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', present: true },
                { name: 'code/README.md', present: false }
            ]
        }),
        project('bravo', 'manuscripts', {
            type: 'manuscript',
            title: 'Bravo',
            year: 2025,
            chips: ['submitted'],
            compute: 'local',
            codeAvailability: { status: 'review-anon' },
            venueId: 'nowhere',
            programIds: ['tensor'],
            domainIds: ['brain'],
            lead: 'Faes'
        }),
        project('charlie', 'ideas', { type: 'idea', title: 'Charlie', pin: true }),
        project('delta', 'ideas', { type: 'idea', title: 'Delta' }),
        project('echo', 'ideas', { type: 'exploring', title: 'Echo', chips: ['lead'] }),
        project('foxtrot', 'ideas', { type: 'idea', title: 'Aardvark' }),
        project('zulu', 'archive', { type: 'nogo', title: 'Zulu' }),
        project('yankee', 'coauthor', { type: 'submitted', title: 'Yankee' })
    ];
    const byId: Record<Id, Project> = {};
    for (const one of projects) byId[one.id] = one;
    return {
        version: 1,
        entities: {
            projects: byId,
            venues: {
                bspc: venue('bspc', {
                    name: 'BSPC',
                    short: 'BSPC',
                    quartile: 'Q1',
                    jif: '4.9',
                    free: 'free'
                })
            },
            datasets: {},
            programs: {
                federated: {
                    id: 'federated',
                    title: 'Federated learning',
                    fundingIds: [],
                    projectIds: []
                },
                tensor: { id: 'tensor', title: 'Tensor methods', fundingIds: [], projectIds: [] }
            },
            domains: {},
            funding: {},
            collections: { collaborations: collaborations() }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

const SNAPSHOT = snapshot();
const PROJECTS = presetFor('projects', CONFIG);
const ITEMS = boardItems(SNAPSHOT, PROJECTS);

function ids(items: BoardItem[]): Id[] {
    return items.map((item) => item.id);
}

function item(id: Id): BoardItem {
    const found = ITEMS.find((one) => one.id === id);
    if (found === undefined) throw new Error(`no item ${id} on the board`);
    return found;
}

/** One facet's values as `value:count`, or nothing when the board does not offer that facet. */
function facet(preset: BoardPreset, items: BoardItem[], key: string): string[] | null {
    const found = facets(items, preset).find((one) => one.key === key);
    return found === null || found === undefined
        ? null
        : found.values.map((value) => `${value.value}:${value.count}`);
}

describe('presetFor', () => {
    it('gives each board its tiers', () => {
        expect(PROJECTS.tiers).toEqual(['ideas', 'active', 'manuscripts']);
        expect(presetFor('archive', CONFIG).tiers).toEqual(['archive']);
        expect(presetFor('coauthor', CONFIG).tiers).toEqual(['coauthor']);
    });

    it('gives the projects board its own columns and the other two the archive columns', () => {
        expect(PROJECTS.columns.map((column) => column.key)).toEqual([
            'title',
            'authors',
            'venue',
            'status',
            'focus',
            'next'
        ]);
        expect(PROJECTS.columns.map((column) => column.label)).toEqual(
            (CONFIG.board as Record<string, string[]>).cols_project
        );
        expect(presetFor('coauthor', CONFIG).columns.map((column) => column.label)).toEqual(
            (CONFIG.board as Record<string, string[]>).cols_archive
        );
    });

    it('takes the label mode of its own surface from the config', () => {
        expect(PROJECTS.labels).toBe('short');
        expect(presetFor('archive', CONFIG).labels).toBe('full');
        expect(presetFor('coauthor', CONFIG).labels).toBe('full');
    });

    it('takes the search placeholder of its own board, and none where there is none', () => {
        expect(PROJECTS.search).toBe('Search title | eli5 ...');
        expect(presetFor('archive', CONFIG).search).toBe('');
    });

    it('reads the rollup buckets of its own board, by the slug of their words', () => {
        expect(PROJECTS.rollup).toEqual([
            { id: 'in-progress', label: 'in progress', keys: ['active', 'manuscript'] },
            { id: 'idea', label: 'idea', keys: ['idea'] }
        ]);
    });

    it('falls back to the projects board for a view id it does not know', () => {
        expect(presetFor('nonesuch', CONFIG).id).toBe('projects');
    });

    it('survives a config that holds none of the keys it reads', () => {
        const bare = presetFor('projects');
        expect(bare.rollup).toEqual([]);
        expect(bare.typeOrder).toEqual([]);
        expect(bare.labels).toBe('short');
        expect(bare.columns.map((column) => column.label)).toEqual(
            bare.columns.map((column) => column.key)
        );
    });
});

describe('boardItems, the tier split', () => {
    it('shows the three project tiers on the projects board', () => {
        expect(new Set(ids(ITEMS))).toEqual(
            new Set(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'])
        );
    });

    it('shows one tier on each of the other two boards', () => {
        expect(ids(boardItems(SNAPSHOT, presetFor('archive', CONFIG)))).toEqual(['zulu']);
        expect(ids(boardItems(SNAPSHOT, presetFor('coauthor', CONFIG)))).toEqual(['yankee']);
    });
});

describe('boardItems, the sort', () => {
    it('puts the pinned first, then the config type order, then the title', () => {
        expect(ids(ITEMS)).toEqual(['charlie', 'alpha', 'bravo', 'foxtrot', 'delta', 'echo']);
    });

    it('sorts a type the order does not name after every type it does', () => {
        expect(ids(ITEMS).at(-1)).toBe('echo');
    });
});

describe('boardItems, the joins', () => {
    it('joins the venue and writes it as name, quartile, JIF and cost', () => {
        expect(item('alpha').venue).toEqual({
            id: 'bspc',
            text: 'BSPC | Q1 | JIF 4.9 | free',
            short: 'BSPC'
        });
    });

    it('joins no venue for an id the catalogue does not hold', () => {
        expect(item('bravo').venue).toBe(null);
    });

    it('joins the domain theme, its words and its hue', () => {
        expect(item('alpha').domain).toEqual({
            id: 'heart',
            label: 'Cardiology | ECG',
            tone: 'crimson'
        });
        expect(item('charlie').domain).toBe(null);
    });

    it('takes the card colour from the type', () => {
        expect(item('alpha').tone).toBe('teal');
        expect(item('bravo').tone).toBe('violet');
        expect(item('echo').tone).toBe('grey');
    });

    it('joins the research lines by title and the collaborators by name', () => {
        expect(item('alpha').programs).toEqual([{ id: 'federated', label: 'Federated learning' }]);
        expect(item('alpha').collaborators).toEqual([{ id: 'someone', label: 'Someone Else' }]);
    });

    it('leaves funding and datasets as the keys a manifest names them by', () => {
        expect(item('alpha').funding).toEqual([{ id: 'FAIR', label: 'FAIR' }]);
        expect(item('alpha').datasets).toEqual([{ id: 'mimic', label: 'mimic' }]);
    });

    it('writes the authors as one line, from the list or from the lead', () => {
        expect(item('alpha').authors).toBe('Faes, Someone');
        expect(item('bravo').authors).toBe('Faes');
        expect(item('charlie').authors).toBe('');
    });

    it('carries the lifecycle bucket of the board it is on', () => {
        expect(item('alpha').bucket).toBe('in-progress');
        expect(item('charlie').bucket).toBe('idea');
        expect(item('echo').bucket).toBe('');
    });
});

describe('facets', () => {
    it('counts the lifecycle buckets in the rollup order', () => {
        expect(facet(PROJECTS, ITEMS, 'category')).toEqual(['in-progress:2', 'idea:3']);
    });

    it('counts the years newest first and puts the undated last', () => {
        expect(facet(PROJECTS, ITEMS, 'year')).toEqual(['2026:1', '2025:1', `${NONE}:4`]);
    });

    it('counts the domains, the research lines and the status chips', () => {
        expect(facet(PROJECTS, ITEMS, 'domain')).toEqual(['brain:1', 'heart:1']);
        expect(facet(PROJECTS, ITEMS, 'program')).toEqual(['federated:1', 'tensor:1']);
        expect(facet(PROJECTS, ITEMS, 'status')).toEqual(['lead:2', 'submitted:1']);
    });

    it('counts the projects that name no funding as a value of their own', () => {
        expect(facet(PROJECTS, ITEMS, 'funding')).toEqual(['FAIR:1', `${NONE}:5`]);
    });

    it('counts compute, reproduced and the code deposit in their fixed order', () => {
        expect(facet(PROJECTS, ITEMS, 'compute')).toEqual(['hpc:1', 'local:1', `${NONE}:4`]);
        expect(facet(PROJECTS, ITEMS, 'reproduced')).toEqual(['1:1', '0:5']);
        expect(facet(PROJECTS, ITEMS, 'code')).toEqual([
            'deposited:1',
            'review-anon:1',
            `${NONE}:4`
        ]);
    });

    it('does not offer a facet with fewer than two values', () => {
        expect(facet(PROJECTS, ITEMS, 'dataset')).toBe(null);
        expect(facets(ITEMS, PROJECTS).map((one) => one.key)).toEqual([
            'category',
            'year',
            'domain',
            'program',
            'funding',
            'status',
            'compute',
            'reproduced',
            'code'
        ]);
    });

    it('gives a facet value the words of its own vocabulary', () => {
        const domain = facets(ITEMS, PROJECTS).find((one) => one.key === 'domain');
        expect(domain?.values.map((value) => value.label)).toEqual([
            'Neuroscience | EEG',
            'Cardiology | ECG'
        ]);
        const status = facets(ITEMS, PROJECTS).find((one) => one.key === 'status');
        expect(status?.values.map((value) => value.label)).toEqual([
            'first author',
            'submitted / under review'
        ]);
    });
});

describe('applyFilters', () => {
    it('leaves everything alone with no filter and no search', () => {
        expect(applyFilters(ITEMS, {}, '')).toHaveLength(ITEMS.length);
    });

    it('takes every selected value of one facet, which is an alternative within it', () => {
        expect(ids(applyFilters(ITEMS, { status: ['lead', 'submitted'] }, ''))).toEqual([
            'alpha',
            'bravo',
            'echo'
        ]);
    });

    it('requires every facet that has a selection at once', () => {
        expect(ids(applyFilters(ITEMS, { status: ['lead'], compute: ['hpc'] }, ''))).toEqual([
            'alpha'
        ]);
        expect(applyFilters(ITEMS, { status: ['submitted'], compute: ['hpc'] }, '')).toEqual([]);
    });

    it('ignores a facet whose selection is empty', () => {
        expect(applyFilters(ITEMS, { status: [] }, '')).toHaveLength(ITEMS.length);
    });

    it('filters on the values that stand for having none', () => {
        expect(ids(applyFilters(ITEMS, { funding: [NONE] }, ''))).toEqual([
            'charlie',
            'bravo',
            'foxtrot',
            'delta',
            'echo'
        ]);
    });

    it('searches every field a card and its tags carry', () => {
        const words = [
            'Alpha',
            'shorthandle',
            'eli5token',
            'latesttoken',
            'nexttoken',
            'outcometoken',
            'BSPC',
            'resulttoken',
            'ideatoken',
            'FAIR',
            'Federated learning',
            'mimic',
            'Someone Else'
        ];
        for (const word of words) {
            expect({ word, found: ids(applyFilters(ITEMS, {}, word)) }).toEqual({
                word,
                found: ['alpha']
            });
        }
    });

    it('searches without regard to case and with the ends trimmed', () => {
        expect(ids(applyFilters(ITEMS, {}, '  ELI5TOKEN '))).toEqual(['alpha']);
    });

    it('applies the filters and the search at once', () => {
        expect(applyFilters(ITEMS, { status: ['submitted'] }, 'eli5token')).toEqual([]);
    });
});

describe('facetValues', () => {
    it('gives nothing for a facet key nobody offers', () => {
        expect(facetValues(item('alpha'), 'nonesuch')).toEqual([]);
    });
});

describe('bucketOf', () => {
    it('takes the first bucket whose keys name the type or one of the chips', () => {
        const rollup = presetFor('coauthor', CONFIG).rollup;
        expect(bucketOf(project('one', 'coauthor', { chips: ['submitted'] }), rollup)).toBe(
            'in-progress'
        );
        expect(bucketOf(project('two', 'coauthor', { type: 'submitted' }), rollup)).toBe(
            'in-progress'
        );
        expect(bucketOf(project('three', 'coauthor', { type: 'nogo' }), rollup)).toBe('');
    });

    it('stops at the first bucket, in the config order', () => {
        const rollup = [
            { id: 'first', label: 'first', keys: ['idea'] },
            { id: 'second', label: 'second', keys: ['lead'] }
        ];
        expect(bucketOf(project('x', 'ideas', { type: 'idea', chips: ['lead'] }), rollup)).toBe(
            'first'
        );
    });
});

describe('venueText and authorLine', () => {
    it('leaves out a JIF the registry wrote as nothing', () => {
        expect(venueText(venue('x', { name: 'X', jif: 'none' }))).toBe('X');
        expect(venueText(venue('x', { name: 'X', jif: ' - ' }))).toBe('X');
        expect(venueText(venue('x', { name: 'X', jif: '2.1' }))).toBe('X | JIF 2.1');
    });

    it('keeps an authors line that was written as one string', () => {
        expect(authorLine(project('x', 'ideas', { authors: 'Faes and others' }))).toBe(
            'Faes and others'
        );
        expect(authorLine(project('x', 'ideas', { authors: [], lead: 'Faes' }))).toBe('Faes');
    });
});

describe('firstSentence', () => {
    it('takes the first sentence and no more', () => {
        expect(firstSentence('One thing. Then another.', 130)).toBe('One thing.');
        expect(firstSentence('Ask this? Then that.', 130)).toBe('Ask this?');
    });

    it('collapses the whitespace of a line broken across a manifest', () => {
        expect(firstSentence('One\n   thing here.', 130)).toBe('One thing here.');
    });

    it('keeps a paragraph with no full stop whole', () => {
        expect(firstSentence('no full stop at all', 130)).toBe('no full stop at all');
    });

    it('cuts on a word boundary and says that it cut', () => {
        expect(firstSentence('aaa bbb ccc ddd', 9)).toBe('aaa bbb...');
    });

    it('gives nothing back for nothing', () => {
        expect(firstSentence('   ', 130)).toBe('');
    });
});

describe('daysUntil', () => {
    const now = Date.UTC(2026, 8, 10, 15, 30);

    it('counts whole days from the reader own day, whatever the hour', () => {
        expect(daysUntil('2026-09-10', now)).toBe(0);
        expect(daysUntil('2026-09-24', now)).toBe(DEADLINE_SOON);
        expect(daysUntil('2026-09-01', now)).toBe(-9);
    });

    it('gives nothing for a string that names no day', () => {
        expect(daysUntil('when it is ready', now)).toBe(null);
    });
});

describe('slug', () => {
    it('turns the words of a bucket into an id', () => {
        expect(slug('in progress')).toBe('in-progress');
        expect(slug('dead-ends')).toBe('dead-ends');
        expect(slug(' Papers & Outputs ')).toBe('papers-outputs');
    });
});

describe('parseBoardState', () => {
    it('gives the empty state for anything that is not a map', () => {
        for (const value of [undefined, null, 7, 'state', [1, 2]]) {
            expect(parseBoardState(value)).toEqual(emptyBoardState());
        }
    });

    it('takes the label mode it was given as the default', () => {
        expect(parseBoardState(undefined, 'full').labels).toBe('full');
        expect(parseBoardState({ labels: 'short' }, 'full').labels).toBe('short');
    });

    it('keeps a state it wrote itself', () => {
        const state = {
            mode: 'list' as const,
            search: 'ecg',
            filters: { status: ['lead'] },
            expanded: ['alpha'],
            labels: 'full' as const
        };
        expect(parseBoardState(state)).toEqual(state);
    });

    it('drops a mode, a label mode and a search that are not what they should be', () => {
        expect(parseBoardState({ mode: 'grid', labels: 'medium', search: 7 })).toEqual(
            emptyBoardState()
        );
    });

    it('drops a filter on a facet nobody offers, and a value that is not a string', () => {
        expect(
            parseBoardState({ filters: { nonesuch: ['x'], status: ['lead', 3], year: [] } }).filters
        ).toEqual({ status: ['lead'] });
    });

    it('drops an expanded list that is not a list of ids', () => {
        expect(parseBoardState({ expanded: 'alpha' }).expanded).toEqual([]);
        expect(parseBoardState({ expanded: ['alpha', 7] }).expanded).toEqual(['alpha']);
    });
});
