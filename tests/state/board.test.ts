// The board's logic over a hand-built snapshot: which projects each preset shows, how they sort,
// what they are joined with, what the facets count, what a filter and a search leave, and what a
// saved state parses to. Everything here is pure, so nothing reads a file and nothing renders.
//
// The vocabulary is synthetic rather than the real config/vocab.yml. What is checked is that the
// board reads the vocabulary it is given; that the real one holds the keys these lookups need is
// tests/state/tones.test.ts's half of the gate, and it would fail there rather than here.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import {
    DEADLINE_SOON,
    NONE,
    applyFilters,
    authorLine,
    boardItems,
    bucketOf,
    daysUntil,
    disseminated,
    emptyBoardState,
    facetValues,
    facets,
    firstSentence,
    humanSize,
    isStale,
    parseBoardState,
    presetFor,
    slug,
    stats,
    typeCounts,
    venueText,
    waitingLine,
    type BoardItem,
    type BoardPreset
} from '../../src/lib/state/board/index.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type {
    Collection,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../src/lib/data/model.ts';
import { present } from '../present.ts';

const ENGINE_CONFIG = loadConfig(engineDir()).config;
setCatalog(textCatalog(ENGINE_CONFIG));
setGlyphs(glyphCatalog(ENGINE_CONFIG));
setVocab({
    palette: { '#7c5cff': 'c-violet', '#0d9488': 'c-teal', '#e2374d': 'c-crimson' },
    type_color: { active: '#0d9488', manuscript: '#7c5cff', idea: '#e2374d' },
    domains: {
        heart: { color: '#e2374d', label: 'Cardiology | ECG' },
        brain: { color: '#7c5cff', label: 'Neuroscience | EEG' }
    },
    status_legend: [
        { key: 'lead', icon: 'author', label: 'first author' },
        { key: 'submitted', icon: 'brown', label: 'submitted / under review' }
    ]
});

/** The merged config the presets are read out of, holding one of everything they look for. */
const CONFIG: Record<string, unknown> = {
    board: {
        cols_project: ['Project', 'Authors', 'Venue', 'Status', 'Focus', 'Next'],
        cols_archive: ['Paper', 'Authors', 'Venue', 'Domain', 'Pillar', 'Funding'],
        search: { projects: 'Search title | eli5 ...' }
    },
    tab_rollup: {
        projects: [
            { label: 'in progress', keys: ['active', 'manuscript'], color: '#0d9488' },
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
    projectPillar: [],
    projectDomain: [],
    projectRelated: [],
    fundingPillar: [],
    projectPerson: [],
    jointWorkPerson: [],
    personOrganisation: [],
    fundingOrganisation: []
};

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
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
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`,
        ...over
    };
}

function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id.toUpperCase(), themes: [], ...over };
}

function jointWork(): Collection {
    return {
        id: 'joint-work',
        title: 'Joint work',
        file: '/hub/network/joint-work.yml',
        entries: [
            {
                id: 'someone',
                title: 'A shared paper',
                fields: { key: 'someone', person: 'someone' },
                file: '/hub/network/joint-work.yml',
                index: 0
            }
        ]
    };
}

describe('waitingLine', () => {
    it('uses a held venue name when its short name is empty', () => {
        const held = project('review', 'manuscripts', { venueId: 'jbi', chips: ['submitted'] });
        expect(
            waitingLine(
                held,
                {
                    jbi: {
                        id: 'jbi',
                        name: 'Journal of Biomedical Informatics',
                        short: '',
                        themes: []
                    }
                },
                {}
            )
        ).toEqual({ kind: 'review', text: 'under review at Journal of Biomedical Informatics' });
        expect(waitingLine(held, {}, {})).toEqual({
            kind: 'review',
            text: 'under review (venue unset)'
        });
    });

    const venues = { jbi: venue('jbi', { name: 'Journal', short: 'JBI' }) };
    const people = { someone: 'Someone Else' };

    it('uses people before submission review and blocking, resolving known collaborator ids', () => {
        const held = project('held', 'active', {
            waitingOn: ['someone', 'Free Name'],
            chips: ['submitted', 'blocked'],
            venueId: 'jbi'
        });
        expect(waitingLine(held, venues, people)).toEqual({
            kind: 'people',
            text: 'waiting on Someone Else, Free Name'
        });
    });

    it('uses the venue for submission review, then the unset and blocked fallbacks', () => {
        expect(
            waitingLine(
                project('review', 'manuscripts', { chips: ['submitted'], venueId: 'jbi' }),
                venues,
                people
            )
        ).toEqual({ kind: 'review', text: 'under review at JBI' });
        expect(
            waitingLine(project('unset', 'manuscripts', { chips: ['submitted'] }), venues, people)
        ).toEqual({ kind: 'review', text: 'under review (venue unset)' });
        expect(
            waitingLine(project('blocked', 'active', { chips: ['blocked'] }), venues, people)
        ).toEqual({ kind: 'blocked', text: 'blocked (external)' });
        expect(waitingLine(project('free', 'active'), venues, people)).toBeNull();
    });

    it('names a project waited on by its short name, through the one rule the strip uses', () => {
        const other = project('other', 'active', { title: 'The Other One', short: 'Other' });
        const held = project('waits', 'active', { waitingOn: ['other', 'someone'] });
        expect(waitingLine(held, venues, people, { other })).toEqual({
            kind: 'people',
            text: 'waiting on Other, Someone Else'
        });
    });
});

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
            pillarIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', label: 'README', present: true, human: false },
                { name: 'code/README.md', label: 'CODE', present: false, human: false }
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
            pillarIds: ['tensor'],
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
            feeds: NO_FEEDS,
            career: null,
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
            pillars: {
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
            people: {
                someone: {
                    id: 'someone',
                    name: 'Someone Else',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {},
            collections: { 'joint-work': jointWork() }
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
    return found === undefined
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
            {
                id: 'in-progress',
                label: 'in progress',
                keys: ['active', 'manuscript'],
                color: '#0d9488'
            },
            { id: 'idea', label: 'idea', keys: ['idea'], color: '' }
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
    it('counts a flat-tier ghost in the board total and the type split', () => {
        const snap = snapshot();
        const preset = presetFor('projects', CONFIG);
        const before = boardItems(snap, preset);
        snap.entities.projects.ghost = project('ghost', 'ideas', { type: 'idea', ghost: true });
        const after = boardItems(snap, preset);
        expect(stats(after, snap.entities.venues, CONFIG).active).toBe(
            stats(before, snap.entities.venues, CONFIG).active + 1
        );
        expect(typeCounts(after).find((row) => row.type === 'idea')?.count).toBe(
            (typeCounts(before).find((row) => row.type === 'idea')?.count ?? 0) + 1
        );
    });

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

    it('joins the domain, its words and its hue', () => {
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

    it('joins the pillars by title and the collaborators by name', () => {
        expect(item('alpha').pillars).toEqual([{ id: 'federated', label: 'Federated learning' }]);
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

    it('counts the domains, the pillars and the status chips', () => {
        expect(facet(PROJECTS, ITEMS, 'domain')).toEqual(['brain:1', 'heart:1']);
        expect(facet(PROJECTS, ITEMS, 'pillar')).toEqual(['federated:1', 'tensor:1']);
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

    it('offers a facet that holds one value, as that one value', () => {
        expect(facet(PROJECTS, ITEMS, 'dataset')).toEqual(['mimic:1']);
        expect(facets(ITEMS, PROJECTS).map((one) => one.key)).toEqual([
            'category',
            'year',
            'domain',
            'pillar',
            'funding',
            'dataset',
            'status',
            'compute',
            'reproduced',
            'code',
            'sessions'
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
            { id: 'first', label: 'first', keys: ['idea'], color: '' },
            { id: 'second', label: 'second', keys: ['lead'], color: '' }
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
            more: ['bravo'],
            labels: 'full' as const,
            stale: true,
            dated: true,
            hiddenTypes: ['idea']
        };
        expect(parseBoardState(state)).toEqual(state);
    });

    it('reads the quick filters as off and the type toggles as empty when they are not there', () => {
        const state = parseBoardState({ mode: 'list' });
        expect(state.stale).toBe(false);
        expect(state.dated).toBe(false);
        expect(state.hiddenTypes).toEqual([]);
    });

    it('drops a hidden type that is not a string', () => {
        expect(parseBoardState({ hiddenTypes: ['idea', 7] }).hiddenTypes).toEqual(['idea']);
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

/** The board's items with some projects overwritten, for the counting cases. */
function over(fields: Record<Id, Partial<Project>>): {
    items: BoardItem[];
    snapshot: Snapshot;
} {
    const snap = snapshot();
    for (const [id, held] of Object.entries(fields)) {
        snap.entities.projects[id] = { ...snap.entities.projects[id], ...held };
    }
    return { items: boardItems(snap, PROJECTS), snapshot: snap };
}

describe('stats', () => {
    it('counts the board, the submit-ready chip, the blocked lane and the dated projects', () => {
        const { items, snapshot: snap } = over({
            alpha: { chips: ['submit-ready'] },
            bravo: { focus: 'blocked' },
            charlie: { deadline: '2030-01-01' }
        });
        const found = stats(items, snap.entities.venues, CONFIG);

        expect(found.active).toBe(6);
        expect(found.submitReady).toBe(1);
        expect(found.blocked).toBe(1);
        expect(found.dated).toBe(2);
    });

    it('counts the venues the board aims at, most aimed at first', () => {
        const { items, snapshot: snap } = over({
            bravo: { venueId: 'bspc' },
            charlie: { venueId: 'bspc' },
            delta: { venueId: 'other' }
        });
        snap.entities.venues.other = venue('other', { name: 'Other', short: 'OTH' });
        const found = stats(boardItems(snap, PROJECTS), snap.entities.venues, CONFIG);

        expect(found.venues.map((one) => `${one.short}:${one.count}`)).toEqual(['BSPC:3', 'OTH:1']);
        expect(items.length).toBe(6);
    });

    it('marks a venue at the config threshold and leaves one under it unmarked', () => {
        const { snapshot: snap } = over({ bravo: { venueId: 'bspc' } });
        const items = boardItems(snap, PROJECTS);

        const at = stats(items, snap.entities.venues, { ...CONFIG, venue_conc_warn: 2 });
        expect(at.venues[0]).toMatchObject({ count: 2, warn: true });
        const under = stats(items, snap.entities.venues, { ...CONFIG, venue_conc_warn: 3 });
        expect(under.venues[0].warn).toBe(false);
    });

    it('shows at most eight venues', () => {
        const snap = snapshot();
        for (let at = 0; at < 10; at += 1) {
            const id = `v${at}`;
            snap.entities.venues[id] = venue(id, { name: `Venue ${at}` });
            snap.entities.projects[`p${at}`] = project(`p${at}`, 'ideas', {
                type: 'idea',
                venueId: id
            });
        }

        expect(stats(boardItems(snap, PROJECTS), snap.entities.venues, CONFIG).venues).toHaveLength(
            8
        );
    });
});

describe('typeCounts', () => {
    it("counts each type in the config's type order, and an unnamed type after them", () => {
        expect(typeCounts(ITEMS, PROJECTS.typeOrder)).toEqual([
            { type: 'active', count: 1 },
            { type: 'manuscript', count: 1 },
            { type: 'idea', count: 3 },
            { type: 'exploring', count: 1 }
        ]);
    });

    it('counts no type for a project that has none', () => {
        const { items } = over({ charlie: { type: undefined } });
        const counts = typeCounts(items, PROJECTS.typeOrder);
        expect(counts.find((one) => one.type === 'idea')?.count).toBe(2);
        expect(counts.some((one) => one.type === '')).toBe(false);
    });
});

describe('isStale', () => {
    it('is the lag against the threshold it is given', () => {
        const { items } = over({ alpha: { staleDays: 2 } });
        const one = present(
            items.find((held) => held.id === 'alpha'),
            'item alpha'
        );

        expect(isStale(one, 1)).toBe(true);
        expect(isStale(one, 2)).toBe(true);
        expect(isStale(one, 3)).toBe(false);
    });

    it('is false for a project normalise left without a lag', () => {
        expect(isStale(item('bravo'), 1)).toBe(false);
    });
});

describe('applyFilters, the quick filters and the type toggles', () => {
    const { items } = over({ alpha: { staleDays: 3 }, charlie: { staleDays: 1 } });

    it('leaves only what is behind by at least the lag it is given', () => {
        expect(ids(applyFilters(items, {}, '', { stale: true, staleLag: 1 })).sort()).toEqual([
            'alpha',
            'charlie'
        ]);
        expect(ids(applyFilters(items, {}, '', { stale: true, staleLag: 3 }))).toEqual(['alpha']);
    });

    it('leaves only what carries a deadline', () => {
        expect(ids(applyFilters(items, {}, '', { dated: true }))).toEqual(['alpha']);
    });

    it('drops the types that are switched off and keeps every other', () => {
        expect(ids(applyFilters(items, {}, '', { hiddenTypes: ['idea', 'exploring'] }))).toEqual([
            'alpha',
            'bravo'
        ]);
    });

    it('changes nothing when it is given no quick filter at all', () => {
        expect(ids(applyFilters(items, {}, ''))).toEqual(ids(items));
    });
});

describe('humanSize', () => {
    it('writes a megabyte and over to one decimal', () => {
        expect(humanSize(1048576)).toBe('1.0 MB');
        expect(humanSize(1258291)).toBe('1.2 MB');
    });

    it('writes anything under a megabyte as whole kilobytes, and never as nothing', () => {
        expect(humanSize(38400)).toBe('37 KB');
        expect(humanSize(12)).toBe('1 KB');
        expect(humanSize(0)).toBe('1 KB');
    });
});

describe('disseminated', () => {
    /** A hub whose events and education files each name one project. */
    function activity(): Snapshot {
        const snap = snapshot();
        const entry = (id: Id, title: string, fields: Record<string, unknown>, file: string) => ({
            id,
            title,
            fields,
            file,
            index: 0
        });
        snap.entities.collections.events = {
            id: 'events',
            title: 'Talks and events',
            file: '/hub/network/events.yml',
            entries: [
                entry('esann', 'ESANN 2026', { related: ['alpha'], role: 'present' }, '/hub/e.yml'),
                entry(
                    'other',
                    'A conference',
                    { related: ['alpha'], role: 'attend' },
                    '/hub/e.yml'
                ),
                entry('none', 'Nothing to do with it', { related: ['zulu'] }, '/hub/e.yml')
            ]
        };
        snap.entities.collections.education = {
            id: 'education',
            title: 'Education',
            file: '/hub/network/education.yml',
            entries: [entry('course', 'A course', { related: ['alpha'] }, '/hub/ed.yml')]
        };
        return snap;
    }

    it('finds the events and education entries that name the project', () => {
        expect(disseminated(activity(), 'alpha').map((one) => one.id)).toEqual(['esann', 'course']);
    });

    it('counts an application that names the project, which is the work going out as well', () => {
        const snap = activity();
        snap.entities.collections.applications = {
            id: 'applications',
            title: 'Applications',
            file: '/hub/career/applications.yml',
            entries: [
                {
                    id: 'fellowship',
                    title: 'A fellowship',
                    fields: { related: ['alpha'] },
                    file: '/hub/career/applications.yml',
                    index: 0
                }
            ]
        };
        expect(disseminated(snap, 'alpha').map((one) => one.id)).toEqual([
            'esann',
            'course',
            'fellowship'
        ]);
        expect(disseminated(snap, 'alpha').map((one) => one.collection)).toContain('applications');
    });

    it('leaves out an events entry the reader only attended', () => {
        expect(disseminated(activity(), 'alpha').some((one) => one.id === 'other')).toBe(false);
    });

    it('finds nothing for a project nothing names, and none at all without the files', () => {
        expect(disseminated(activity(), 'bravo')).toEqual([]);
        expect(disseminated(SNAPSHOT, 'alpha')).toEqual([]);
    });
});
