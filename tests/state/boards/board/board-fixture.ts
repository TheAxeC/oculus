// Layer 4, test fixture. The hand-built snapshot, config and vocabulary the board suites read, and
// the helpers that build a project, a venue and a board item. The vocabulary is synthetic rather
// than the real config/catalogs/vocab.yml: what is checked is that the board reads the vocabulary
// it is given; that the real one holds the keys these lookups need is
// tests/state/words/tones.test.ts's half of the gate.

import { NO_FEEDS } from '../../../fixtures/entities-fixture.ts';
import {
    boardItems,
    facets,
    presetFor,
    type BoardItem,
    type BoardPreset
} from '../../../../src/lib/state/boards/board/index.ts';
import { setVocab } from '../../../../src/lib/state/words/tones.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/words/text.ts';
import type {
    Collection,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../../../src/lib/data/model.ts';

export const ENGINE_CONFIG = loadConfig(engineDir()).config;

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
export const CONFIG: Record<string, unknown> = {
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

export const EMPTY_RELATIONS: Relations = {
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

export function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
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

export function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id.toUpperCase(), themes: [], ...over };
}

export function jointWork(): Collection {
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

/**
 * Six projects on the projects board, one on the archive board and one on the coauthor board.
 * `alpha` carries one distinctive word in every field the search reads, which is what the search
 * cases below look for.
 */
export function snapshot(): Snapshot {
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

export const SNAPSHOT = snapshot();

export const PROJECTS = presetFor('projects', CONFIG);

export const ITEMS = boardItems(SNAPSHOT, PROJECTS);

export function ids(items: BoardItem[]): Id[] {
    return items.map((item) => item.id);
}

export function item(id: Id): BoardItem {
    const found = ITEMS.find((one) => one.id === id);
    if (found === undefined) throw new Error(`no item ${id} on the board`);
    return found;
}

/** One facet's values as `value:count`, or nothing when the board does not offer that facet. */
export function facet(preset: BoardPreset, items: BoardItem[], key: string): string[] | null {
    const found = facets(items, preset).find((one) => one.key === key);
    return found === undefined
        ? null
        : found.values.map((value) => `${value.value}:${value.count}`);
}

/** The board's items with some projects overwritten, for the counting cases. */
export function over(fields: Record<Id, Partial<Project>>): {
    items: BoardItem[];
    snapshot: Snapshot;
} {
    const snap = snapshot();
    for (const [id, held] of Object.entries(fields)) {
        snap.entities.projects[id] = { ...snap.entities.projects[id], ...held };
    }
    return { items: boardItems(snap, PROJECTS), snapshot: snap };
}
