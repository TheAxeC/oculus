// The Data view rendered on the server over every access tone, labelled facets, project links and
// an editable collection. Pure filtering and recovery-command rules are covered by state tests.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import Data from '../../src/lib/views/Data.svelte';
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
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type {
    Collection,
    Dataset,
    Entry,
    Project,
    Relations,
    Snapshot
} from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
receive({ channel: 'config', version: 25, payload: { config, text: catalog, findings: [] } });

const FILE = '/hub/registries/data.yml';
const INSTANCE = 'data-one';
const RELATIONS: Relations = {
    projectVenue: [],
    projectFunding: [],
    projectDataset: [],
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
};

function dataset(
    id: string,
    access: string,
    themes: string[],
    over: Partial<Dataset> = {}
): Dataset {
    return {
        id,
        name: id,
        access,
        themes,
        projectIds: [],
        ...over
    };
}

function entry(dataset: Dataset, index: number): Entry {
    return {
        id: dataset.id,
        title: dataset.name,
        fields: {
            key: dataset.id,
            name: dataset.name,
            access: dataset.access,
            themes: dataset.themes,
            retrieval: dataset.retrieval
        },
        file: FILE,
        index
    };
}

function project(id: string): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: 'Linked project',
        short: 'LP',
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: ['open'],
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`
    };
}

const DATASETS = [
    dataset('open', 'open', ['ecg'], {
        name: 'Open **ECG**',
        description: 'A **signal** dataset.',
        size: '2 GB',
        hpcPath: '~/data/open',
        modality: 'ECG signals',
        source: 'https://example.org/open',
        retrieval: { method: 'wget', notes: 'Recover   from\n the source.' },
        projectIds: ['linked']
    }),
    dataset('registered', 'registration', ['ecg']),
    dataset('private', 'private', ['scans']),
    dataset('credentialed', 'credentialed', ['ecg']),
    dataset('public', 'public', ['scans'])
];

function collection(datasets: Dataset[]): Collection {
    return {
        id: 'data',
        title: 'Data',
        intro: 'Registry **intro** from the file.',
        themeLabels: { ecg: 'ECG' },
        file: FILE,
        schema: [
            { field: 'key', type: 'text', required: true },
            { field: 'name', type: 'text' },
            { field: 'retrieval', type: 'raw' }
        ],
        entries: datasets.map(entry)
    };
}

function snapshot(datasets: Dataset[]): Snapshot {
    return {
        version: 25,
        entities: {
            projects: { linked: project('linked') },
            venues: {},
            datasets: Object.fromEntries(datasets.map((item) => [item.id, item])),
            programs: {},
            domains: {},
            funding: {},
            collections: { data: collection(datasets) },
            feeds: NO_FEEDS,
            career: null
        },
        relations: RELATIONS,
        findings: []
    };
}

function instance(): Instance {
    return { id: INSTANCE, view: 'data', state: {} };
}

describe('the Data view', () => {
    it('draws the intro, controls, facets and every dataset card in file order', () => {
        receive({ channel: 'portfolio', version: 25, payload: snapshot(DATASETS) });
        setInstanceState(INSTANCE, { search: '', off: [], reveal: 'open' });
        const html = render(Data, { props: { instance: instance() } }).body;

        expect(html).toMatch(/class="intro(?:\s|")/);
        expect(html).toContain(
            '5 datasets (1 credentialed | 1 open | 1 private | 1 public | 1 registration)'
        );
        expect(html).toContain('Registry <strong>intro</strong> from the file.');
        expect(html).toContain('Search datasets | name | modality | project ...');
        expect(html).toContain('+ add');
        expect(html).toContain('data-reveal="open"');
        expect(html).toContain('ECG 3');
        expect(html).toContain('scans 2');
        expect(html.match(/data-dataset=/g)).toHaveLength(5);
        expect(html.indexOf('data-dataset="open"')).toBeLessThan(
            html.indexOf('data-dataset="registered"')
        );
    });

    it('draws Markdown, access tones, metadata, notes, projects, source and recovery', () => {
        receive({ channel: 'portfolio', version: 26, payload: snapshot(DATASETS) });
        const html = render(Data, { props: { instance: instance() } }).body;

        expect(html).toContain('Open <strong>ECG</strong>');
        expect(html).toContain('A <strong>signal</strong> dataset.');
        expect(html).toContain('--tone: var(--c-green)');
        expect(html).toContain('--tone: var(--c-amber)');
        expect(html).toContain('--tone: var(--c-red)');
        expect(html).toContain('--tone: var(--c-slate)');
        expect(html).toContain('--tone: var(--c-grey)');
        expect(html).toContain('Size 2 GB');
        expect(html).toContain('HPC ~/data/open');
        expect(html).toContain('Fetch wget');
        expect(html).toContain('ECG signals');
        expect(html).toContain('Recover from the source.');
        expect(html).toContain('data-project-group="work"');
        expect(html).toContain('class="label">active</span>');
        expect(html).toContain('aria-expanded="false"');
        expect(html).not.toContain('>LP</span>');
        expect(html).toContain('href="https://example.org/open"');
        expect(html).toContain('target="_blank"');
        expect(html).toContain('Recover');
        expect(html).toContain('Open a terminal and recover this dataset');
    });

    it('does not invent project links for a dataset with no users', () => {
        receive({ channel: 'portfolio', version: 27, payload: snapshot(DATASETS) });
        const html = render(Data, { props: { instance: instance() } }).body;
        const start = html.indexOf('data-dataset="public"');
        const card = html.slice(start);
        expect(start).toBeGreaterThan(0);
        expect(card).not.toContain('data-project-group=');
    });

    it('draws the dataset empty message when the file has no entries', () => {
        receive({ channel: 'portfolio', version: 28, payload: snapshot([]) });
        const html = render(Data, { props: { instance: instance() } }).body;
        expect(html).toContain('No datasets yet - add some to registries/data.yml.');
        expect(html).not.toContain('data-dataset=');
    });
});
