// Shared server-render fixture for the Pillars, Domains and Map acceptance tests.

import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import type { ClientState } from '../../fixtures/client.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import type {
    Collection,
    Domain,
    Entry,
    Pillar,
    Project,
    Snapshot,
    Venue
} from '../../../src/lib/data/model/index.ts';

const loaded = loadConfig(engineDir());
export const config = loaded.config;
export const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
/** The config message every case here starts from. */
export function installConfig(client: ClientState): void {
    client.entities.receive({
        channel: 'config',
        version: 2400,
        payload: { config, text: catalog, findings: [] }
    });
}

const PILLAR_FILE = '/hub/registries/pillars.yml';
const DOMAIN_FILE = '/hub/registries/domains.yml';

function project(id: string, fields: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: id,
        short: id.toUpperCase(),
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        venueId: undefined,
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...fields
    };
}

function entry(id: string, fields: Record<string, unknown>, file: string, index: number): Entry {
    return { id, title: scalar(fields.title, id), fields: { key: id, ...fields }, file, index };
}

const pillars: Pillar[] = [
    {
        id: 'pillar',
        title: 'Pillar **One**',
        color: '#ea580c',
        goal: 'A **goal**.',
        blurb: 'Pillar blurb.',
        fundingIds: [],
        projectIds: []
    },
    { id: 'dormant', title: 'Dormant line', fundingIds: [], projectIds: [] },
    {
        id: 'candidate',
        title: 'Candidate line',
        kind: 'provisional',
        fundingIds: [],
        projectIds: []
    },
    { id: 'outside', title: 'Outside line', kind: 'offpillar', fundingIds: [], projectIds: [] }
];
const domains: Domain[] = [
    { id: 'heart', title: 'Heart **domain**', blurb: 'Heart blurb.', projectIds: [] },
    { id: 'empty', title: 'Empty domain', projectIds: [] }
];
const projects = {
    alpha: project('alpha', { pillarIds: ['pillar'], domainIds: ['heart'], venueId: 'strong' }),
    old: project('old', {
        tier: 'archive',
        type: 'published',
        pillarIds: ['dormant'],
        domainIds: ['heart']
    }),
    candidate: project('candidate-project', {
        tier: 'ideas',
        type: 'idea',
        pillarIds: ['candidate']
    }),
    outside: project('outside-project', { pillarIds: ['outside'] }),
    orphan: project('orphan', { tier: 'manuscripts', type: 'manuscript' }),
    dead: project('dead', {
        tier: 'archive',
        type: 'dropped',
        pillarIds: ['pillar'],
        relatedIds: ['alpha']
    })
};
const venues: Venue[] = [{ id: 'strong', name: 'Strong', tier: 'strong', themes: [] }];

const pillarEntries = pillars.map((line, index) =>
    entry(
        line.id,
        {
            title: line.title,
            color: line.color ?? '',
            kind: line.kind ?? 'pillar',
            goal: line.goal ?? '',
            funding: line.id === 'pillar' ? 'Funded by **Tests**.' : '',
            blurb: line.blurb ?? ''
        },
        PILLAR_FILE,
        index
    )
);
const domainEntries = domains.map((domain, index) =>
    entry(domain.id, { title: domain.title, blurb: domain.blurb ?? '' }, DOMAIN_FILE, index)
);

function collection(id: string, file: string, entries: Entry[]): Collection {
    return {
        id,
        title: id,
        file,
        schema: [
            { field: 'key', type: 'text', required: true },
            { field: 'title', type: 'text', required: true },
            ...(id === 'pillars'
                ? [
                      {
                          field: 'color',
                          type: 'text',
                          label: 'Colour',
                          help: "hex colour of the pillar's card"
                      }
                  ]
                : []),
            { field: 'blurb', type: 'textarea' }
        ],
        entries
    };
}

export function fixture(): Snapshot {
    return structuredClone({
        version: 2401,
        entities: {
            projects,
            venues: Object.fromEntries(venues.map((venue) => [venue.id, venue])),
            datasets: {},
            pillars: Object.fromEntries(pillars.map((line) => [line.id, line])),
            domains: Object.fromEntries(domains.map((domain) => [domain.id, domain])),
            funding: {},
            people: {},
            organisations: {},
            collections: {
                pillars: collection('pillars', PILLAR_FILE, pillarEntries),
                domains: collection('domains', DOMAIN_FILE, domainEntries)
            },
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
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
        },
        findings: []
    });
}

export function install(client: ClientState, snapshot = fixture(), version = 2401): void {
    installConfig(client);
    client.entities.receive({ channel: 'portfolio', version, payload: snapshot });
}
