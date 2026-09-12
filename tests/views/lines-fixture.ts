// Shared server-render fixture for the Programs, Domains and Map acceptance tests.

import { NO_FEEDS } from '../entities-fixture.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import type {
    Collection,
    Domain,
    Entry,
    Program,
    Project,
    Snapshot,
    Venue
} from '../../src/lib/data/model.ts';

const loaded = loadConfig(engineDir());
export const config = loaded.config;
export const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
receive({ channel: 'config', version: 2400, payload: { config, text: catalog, findings: [] } });

const PROGRAM_FILE = '/hub/registries/programs.yml';
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
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...fields
    };
}

function entry(id: string, fields: Record<string, unknown>, file: string, index: number): Entry {
    return { id, title: String(fields.title ?? id), fields: { key: id, ...fields }, file, index };
}

const programs: Program[] = [
    {
        id: 'pillar',
        title: 'Pillar **One**',
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
    alpha: project('alpha', { programIds: ['pillar'], domainIds: ['heart'], venueId: 'strong' }),
    old: project('old', {
        tier: 'archive',
        type: 'published',
        programIds: ['dormant'],
        domainIds: ['heart']
    }),
    candidate: project('candidate-project', {
        tier: 'ideas',
        type: 'idea',
        programIds: ['candidate']
    }),
    outside: project('outside-project', { programIds: ['outside'] }),
    orphan: project('orphan', { tier: 'manuscripts', type: 'manuscript' }),
    dead: project('dead', {
        tier: 'archive',
        type: 'dropped',
        programIds: ['pillar'],
        relatedIds: ['alpha']
    })
};
const venues: Venue[] = [{ id: 'strong', name: 'Strong', tier: 'strong', themes: [] }];

const programEntries = programs.map((line, index) =>
    entry(
        line.id,
        {
            title: line.title,
            kind: line.kind ?? 'pillar',
            goal: line.goal ?? '',
            funding: line.id === 'pillar' ? 'Funded by **Tests**.' : '',
            blurb: line.blurb ?? ''
        },
        PROGRAM_FILE,
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
            programs: Object.fromEntries(programs.map((line) => [line.id, line])),
            domains: Object.fromEntries(domains.map((domain) => [domain.id, domain])),
            funding: {},
            collections: {
                programs: collection('programs', PROGRAM_FILE, programEntries),
                domains: collection('domains', DOMAIN_FILE, domainEntries),
                collaborations: {
                    id: 'collaborations',
                    title: 'Collaborations',
                    file: '/hub/network/collaborations.yml',
                    entries: []
                }
            },
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectProgram: [],
            projectDomain: [],
            projectRelated: [],
            fundingProgram: []
        },
        findings: []
    });
}

export function install(snapshot = fixture(), version = 2401): void {
    receive({ channel: 'portfolio', version, payload: snapshot });
}
