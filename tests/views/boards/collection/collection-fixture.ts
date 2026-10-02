// Layer 4, test fixture. The synthetic collection, projects and snapshot the collection view suites
// render, and the helpers that render one collection tab to HTML and read its cards out of it.

import { NO_FEEDS, fixtureProject } from '../../../fixtures/entities-fixture.ts';
import { render } from 'svelte/server';
import Collection from '../../../../src/lib/views/boards/collection/Collection.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import type { CollectionState } from '../../../../src/lib/state/boards/collection.ts';
import type {
    Entry,
    Project,
    Relations,
    SchemaField,
    Snapshot
} from '../../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

export let client: ClientState;

export let receive: ClientState['entities']['receive'];

export let setInstanceState: ClientState['ui']['setInstanceState'];

/** A fresh client for each case, the fixture's collection installed in it. */
export function freshClient(): void {
    client = createClientState();
    ({ receive } = client.entities);
    ({ setInstanceState } = client.ui);
    installFixture();
}

const { config } = loadConfig(engineDir());

export const catalog = textCatalog(config);

setCatalog(catalog);

setGlyphs(glyphCatalog(config));

setVocab(vocabCatalog(config));

export const INSTANCE = 'collection-one';

export const FILE = '/hub/network/events.yml';

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

/** The shape the hub's seven files write, with one field of every kind the view draws. */
export const SCHEMA: SchemaField[] = [
    { field: 'title', type: 'text', required: true },
    { field: 'sub', type: 'text', label: 'Subtitle' },
    { field: 'status', type: 'select', options: ['upcoming', 'completed'] },
    { field: 'date', type: 'text' },
    { field: 'meta', type: 'metalist' },
    { field: 'tags', type: 'tags' },
    { field: 'note', type: 'textarea' },
    { field: 'link', type: 'text' },
    { field: 'deadline', type: 'date' }
];

export function entry(index: number, title: string, fields: Record<string, unknown>): Entry {
    return { id: title, title, fields: { title, ...fields }, file: FILE, index };
}

/**
 * Three entries in file order: one of everything, one with a field the schema does not name, one
 * bare.
 */
export const ENTRIES: Entry[] = [
    entry(0, 'A talk', {
        sub: 'the subtitle',
        status: 'upcoming',
        date: '2027-02-16',
        meta: [
            { label: 'When', value: '16 Feb 2027' },
            { label: 'Where', value: 'Enschede' }
        ],
        tags: ['core-ml', 'conference'],
        note: 'what it is, in one line',
        link: 'network/a-talk/slides.html'
    }),
    entry(1, 'A visit', { status: 'completed', role: 'attend' }),
    entry(2, 'A pitch', { status: 'upcoming', deadline: '2030-01-01' })
];

/** A project as the snapshot holds it, with the fields the joins on a card read. */
export function project(id: string, over: Partial<Project> = {}): Project {
    return fixtureProject({
        id,
        tier: 'active',
        title: id,
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...over
    });
}

export const PROJECTS: Record<string, Project> = {
    alpha: project('alpha', {
        type: 'active',
        short: 'Alpha',
        fundingIds: ['FAIR'],
        codeAvailability: { status: 'deposited' }
    }),
    beta: project('beta', { type: 'manuscript' })
};

/** The funding file: a schema, one scheme with a key and a statement, and a pinned entry. */
export const FUNDING_SCHEMA: SchemaField[] = [
    { field: 'title', type: 'text', required: true },
    { field: 'status', type: 'select', options: ['awarded', 'submitted'] },
    { field: 'note', type: 'textarea' },
    { field: 'statement', type: 'textarea' },
    { field: 'url', type: 'text' },
    { field: 'key', type: 'text' }
];

export const FUNDING_ENTRIES: Entry[] = [
    {
        id: 'later',
        title: 'A later scheme',
        fields: {
            title: 'A later scheme',
            status: 'submitted',
            url: 'https://example.org/call'
        },
        file: '/hub/funding/funding.yml',
        index: 0
    },
    {
        id: 'FAIR',
        title: 'A funded scheme',
        fields: {
            title: 'A funded scheme',
            status: 'awarded',
            pin: true,
            note: 'what it **is**',
            statement: 'This work was funded by FAIR.',
            key: 'FAIR',
            subtasks: [{ do: 'paste the statement' }]
        },
        file: '/hub/funding/funding.yml',
        index: 1
    }
];

/** A file with no schema: its cards carry the status buttons instead of the edit form. */
export const PLAIN_ENTRIES: Entry[] = [
    {
        id: 'One task',
        title: 'One task',
        fields: { title: 'One task', status: 'todo' },
        file: '/hub/tasks/tasks.yml',
        index: 0
    },
    {
        id: 'Another task',
        title: 'Another task',
        fields: { title: 'Another task', status: 'doing' },
        file: '/hub/tasks/tasks.yml',
        index: 1
    }
];

/** The code file, whose view adds what the portfolio says about its own code above the cards. */
export const CODE_ENTRIES: Entry[] = [
    {
        id: 'a repo',
        title: 'a repo',
        fields: { title: 'a repo', status: 'active', related: ['alpha'] },
        file: '/hub/registries/repos.yml',
        index: 0
    }
];

export function snapshot(projects: Record<string, Project> = PROJECTS): Snapshot {
    return {
        version: 1,
        entities: {
            personal: {},
            feeds: NO_FEEDS,
            career: null,
            projects,
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {
                naesens: {
                    id: 'naesens',
                    name: 'Maarten Naesens',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: ['ecg-paper']
                }
            },
            organisations: {},
            resources: {},
            collections: {
                'joint-work': {
                    id: 'joint-work',
                    title: 'Joint work',
                    file: '/hub/network/joint-work.yml',
                    schema: [
                        { field: 'key', type: 'text' },
                        { field: 'title', type: 'text' },
                        { field: 'person', type: 'select', optionsFrom: 'people' },
                        { field: 'status', type: 'select' }
                    ],
                    entries: [
                        {
                            id: 'ecg-paper',
                            title: 'The ECG paper',
                            fields: {
                                key: 'ecg-paper',
                                title: 'The ECG paper',
                                person: 'naesens',
                                status: 'active'
                            },
                            file: '/hub/network/joint-work.yml',
                            index: 0
                        }
                    ]
                },
                events: {
                    id: 'events',
                    title: 'Talks and Events',
                    intro: 'one **calendar** of appearances',
                    file: FILE,
                    schema: SCHEMA,
                    entries: ENTRIES
                },
                funding: {
                    id: 'funding',
                    title: 'Funding',
                    file: '/hub/funding/funding.yml',
                    schema: FUNDING_SCHEMA,
                    entries: FUNDING_ENTRIES
                },
                tasks: {
                    id: 'tasks',
                    title: 'Tasks',
                    file: '/hub/tasks/tasks.yml',
                    entries: PLAIN_ENTRIES
                },
                code: {
                    id: 'code',
                    title: 'Code',
                    file: '/hub/registries/repos.yml',
                    schema: SCHEMA,
                    entries: CODE_ENTRIES
                }
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** What every case here starts from, installed into the case's own client. */
export function installFixture(): void {
    receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

/** The view as the instance of one collection's view id, with one saved state and its projects. */
export function html(
    view = 'events',
    state: Partial<CollectionState> = {},
    projects?: Record<string, Project>
): string {
    if (projects !== undefined) {
        receive({ channel: 'portfolio', version: 2, payload: snapshot(projects) });
    }
    setInstanceState(INSTANCE, { search: '', statuses: [], hidden: [], ...state });
    const instance: Instance = { id: INSTANCE, view, state: {} };
    return render(Collection, { context: clientContext(client), props: { instance } }).body;
}

/** The cards of a rendering, in the order they were drawn. */
export function cards(body: string): string[] {
    return body.split('<article class="card').slice(1);
}
