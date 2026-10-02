// The Data view rendered on the server over every access word, labelled facets, project links and
// an editable collection. Pure filtering and recovery-command rules are covered by state tests.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { NO_FEEDS, fixtureProject } from '../../fixtures/entities-fixture.ts';
import Data from '../../../src/lib/views/sources/data/Data.svelte';
import DatasetCard from '../../../src/lib/views/sources/data/DatasetCard.svelte';
import { noop } from '../../fixtures/doubles.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import type {
    Collection,
    Dataset,
    Entry,
    Project,
    Relations,
    Snapshot
} from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { between } from '../shared/pane-parts.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let setInstanceState: ClientState['ui']['setInstanceState'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ setInstanceState } = client.ui);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 25, payload: { config, text: catalog, findings: [] } });
}

const FILE = '/hub/registries/data.yml';
const INSTANCE = 'data-one';
const RELATIONS: Relations = {
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
    return fixtureProject({
        id,
        tier: 'active',
        type: 'active',
        title: 'Linked project',
        short: 'LP',
        datasetIds: ['open'],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`
    });
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
            personal: {},
            projects: { linked: project('linked') },
            venues: {},
            datasets: Object.fromEntries(datasets.map((item) => [item.id, item])),
            pillars: {},
            domains: {},
            funding: {},
            people: {},
            organisations: {},
            resources: {},
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

/** The words of every tag in a rendering: one piece per tag, each read for its own label. */
function tagLabels(html: string): string[] {
    return html
        .split('class="tag')
        .slice(1)
        .map((piece) => /class="label[^"]*">([^<]*)</.exec(piece)?.[1] ?? '');
}

function drawn(): string {
    receive({ channel: 'portfolio', version: 25, payload: snapshot(DATASETS) });
    setInstanceState(INSTANCE, { search: '', off: [] });
    return render(Data, { context: clientContext(client), props: { instance: instance() } }).body;
}

describe('where the Data view puts its controls', () => {
    it('holds only bare icon actions in the header: add first, the control over the file last', () => {
        const header = between(drawn(), '<header', '</header>');
        const tools = header.match(/<button[^>]*class="tool[^"]*"/g) ?? [];
        expect(tools).toHaveLength(2);
        for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
        const add = between(header, `aria-label="${catalog['collection.add']}"`, '</button>');
        expect(add).toContain('data-glyph="add"');
        expect(header.indexOf('data-glyph="add"')).toBeLessThan(
            header.indexOf('data-source-path="registries/data.yml"')
        );
        // the search box and the facets are controls of the bar, and the header holds icon actions
        expect(header).not.toContain('class="search');
        // the facet toggles are bar controls, so the header draws no pressable capsule
        expect(header).not.toContain('class="chip');
    });

    it('puts the search box and the modality toggles in the bar, the toggles as pressable chips', () => {
        const bar = between(drawn(), '<div class="viewbar', '<div class="body');
        expect(bar).toContain('class="search');
        expect(bar).toContain(`aria-label="${catalog['data.filters']}"`);
        expect(bar).toContain(catalog['data.modality_facet']);
        const toggles = bar.match(
            /<button[^>]*class="chip pressable[^"]*"[^>]*aria-pressed="true"/g
        );
        expect(toggles).toHaveLength(2);
    });

    it('draws a modality the instance switched off as a toggle that is not pressed', () => {
        receive({ channel: 'portfolio', version: 25, payload: snapshot(DATASETS) });
        setInstanceState(INSTANCE, { search: '', off: ['scans'] });
        const body = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        const bar = between(body, '<div class="viewbar', '<div class="body');
        expect(bar).toMatch(/aria-pressed="false"[^>]*>(?:(?!<\/button>)[\s\S])*scans 2/);
    });

    it('keeps the add control out of the body, which holds the search box alone', () => {
        const body = drawn();
        const page = body.slice(body.indexOf('<div class="body'));
        // the add control is a header action, so the body does not hold it
        expect(page).not.toContain(`aria-label="${catalog['collection.add']}"`);
        // the body draws no row of controls, since the bar holds the search box
        expect(page).not.toContain('class="controls');
    });
});

describe('the controls of a dataset card', () => {
    // Revert: in views/sources/data/DatasetCard.svelte, put the Edit entry and Recover ToolButtons
    // back in the meta row in place of CardActions.
    it('draws Edit entry and Recover among the card controls, both as icons shown under the pointer', () => {
        const card = between(drawn(), 'data-dataset="open"', '</article>');
        const actions = between(card, 'data-card-actions', 'class="description');
        expect(actions).toContain(`aria-label="${catalog['collection.form_edit_title']}"`);
        expect(actions).toContain(`aria-label="${catalog['data.recover']}"`);
        expect(actions).toContain(catalog['data.recover_tip']);
        expect(actions.match(/class="tool[^"]*\bcompact\b/g)).toHaveLength(2);
    });
});

describe('the Data view', () => {
    it('closes its toolbar with the control that opens registries/data.yml', () => {
        receive({ channel: 'portfolio', version: 25, payload: snapshot(DATASETS) });
        const body = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(body).toContain('data-source-path="registries/data.yml"');
        expect(body).toContain(catalog['views.open_source']);
    });

    it('draws the intro, controls, facets and every dataset card in file order', () => {
        receive({ channel: 'portfolio', version: 25, payload: snapshot(DATASETS) });
        setInstanceState(INSTANCE, { search: '', off: [], reveal: 'open' });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;

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

    it('draws Markdown, access words, metadata, notes, projects, source and recovery', () => {
        receive({ channel: 'portfolio', version: 26, payload: snapshot(DATASETS) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;

        expect(html).toContain('Open <strong>ECG</strong>');
        expect(html).toContain('A <strong>signal</strong> dataset.');
        const tags = tagLabels(html);
        expect(tags).toContain('open');
        expect(tags).toContain('registration');
        expect(tags).toContain('private');
        expect(tags).toContain('credentialed');
        expect(tags).toContain('public');
        // an access word keeps the hue its chip had, which is set on the tag's own property rather
        // than as a tone
        expect(html).not.toContain('--tone: var(--c-');
        // Each access word keeps the hue its chip had, on the tag's own custom property.
        for (const hue of ['green', 'amber', 'red', 'slate', 'grey']) {
            expect(html).toContain(`--tone-txt: var(--c-${hue}-txt)`);
        }
        expect(html).toContain('Size 2 GB');
        expect(html).toContain('HPC ~/data/open');
        expect(html).toContain('Fetch wget');
        expect(html).toContain('ECG signals');
        expect(html).toContain('Recover from the source.');
        expect(html).toContain('data-project-group="work"');
        expect(html).toContain('class="label">active</span>');
        expect(html).toContain('aria-expanded="false"');
        // the project list is closed, so its members are named only once it is expanded
        expect(html).not.toContain('>LP</span>');
        expect(html).toContain('href="https://example.org/open"');
        expect(html).toContain('target="_blank"');
        expect(html).toContain('Recover');
        expect(html).toContain('Open a terminal and recover this dataset');
    });

    it('does not invent project links for a dataset with no users', () => {
        receive({ channel: 'portfolio', version: 27, payload: snapshot(DATASETS) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        const start = html.indexOf('data-dataset="public"');
        const card = html.slice(start);
        expect(start).toBeGreaterThan(0);
        // no project names this dataset, so there is no group to draw
        expect(card).not.toContain('data-project-group=');
    });

    it('draws the dataset empty message when the file has no entries', () => {
        receive({ channel: 'portfolio', version: 28, payload: snapshot([]) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(html).toMatch(
            /<p class="empty[^"]*"[^>]*>(?:(?!<\/p>)[\s\S])*<span class="message[^"]*">(?:(?!<\/p>)[\s\S])*No datasets yet/
        );
        expect(html).toContain('No datasets yet - add some to registries/data.yml.');
        // the file holds no entry, so there is no card to draw
        expect(html).not.toContain('data-dataset=');
    });
});

describe('the dataset facets under their data_themes labels', () => {
    it('draws a facet under its label, and a word with no row as the word', () => {
        const rows = config.data_themes as { key: string; label: string }[];
        const ecg = rows.find((row) => row.key === 'ecg')?.label ?? '';
        expect(ecg).not.toBe('');
        expect(ecg).not.toBe('ecg');
        receive({ channel: 'portfolio', version: 32, payload: snapshot(DATASETS) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        expect(html).toContain(`${ecg} 3`);
        // the theme is drawn under its label, so the bare key and its count are not the pair drawn
        expect(html).not.toContain('ecg 3');
        expect(html).toContain('scans 2');
    });
});

describe('the dataset card as a card primitive', () => {
    it('gives every card the dataset id the keyboard cursor moves over', () => {
        receive({ channel: 'portfolio', version: 29, payload: snapshot(DATASETS) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        for (const item of DATASETS) expect(html).toContain(`data-card="${item.id}"`);
        // the cursor is the workbench's, and no key has moved it onto a card yet
        expect(html).not.toContain('data-cursor');
    });

    it('marks the card the instance cursor holds and no other', () => {
        receive({ channel: 'portfolio', version: 30, payload: snapshot(DATASETS) });
        const held: Instance = { id: INSTANCE, view: 'data', state: { cursor: 'private' } };
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: held }
        }).body;
        expect(html).toMatch(/data-card="private"[^>]*data-cursor="true"/);
        expect(html.match(/data-cursor="true"/g)).toHaveLength(1);
    });

    it('carries the whole value of a size, HPC or fetch chip in a tooltip beside it', () => {
        receive({ channel: 'portfolio', version: 31, payload: snapshot(DATASETS) });
        const html = render(Data, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        for (const words of ['Size 2 GB', 'HPC ~/data/open', 'Fetch wget']) {
            const bubble = new RegExp(
                `class="words"[^>]*hidden[^>]*>${words.replace(/[.*+?^$()|[\]\\]/g, '\\$&')}<`
            );
            expect(html).toMatch(bubble);
        }
    });
});

describe('the retrieval a dataset card reads', () => {
    /** What the card drew of one dataset's retrieval: the fetch method and the note. */
    function drawnFor(retrieval: unknown): { method: boolean; note: string | undefined } {
        const body = render(DatasetCard, {
            context: clientContext(client),
            props: {
                dataset: {
                    id: 'd',
                    name: 'D',
                    themes: [],
                    projectIds: [],
                    retrieval: retrieval as Record<string, unknown> | undefined
                },
                cursor: false,
                projects: [],
                entry: null,
                schema: undefined,
                editing: false,
                onedit: noop,
                onsaid: noop
            }
        }).body.replace(/<!--[\s\S]*?-->/g, '');
        return {
            method: body.includes(`${catalog['data.fetch']} wget`),
            note: /<div class="note[^"]*">[\s\S]*?<span>([^<]*)<\/span>/.exec(body)?.[1]
        };
    }

    it('draws a method that is a text and a note that is a text with its blanks folded', () => {
        expect(drawnFor({ method: 'wget', notes: '  a\n b ' })).toEqual({
            method: true,
            note: 'a b'
        });
        expect(drawnFor({ method: 3, notes: '  a\n b ' })).toEqual({ method: false, note: 'a b' });
        expect(drawnFor({ method: 'wget', notes: 3 })).toEqual({ method: true, note: undefined });
    });

    it('draws neither for a retrieval that is no map or absent', () => {
        for (const retrieval of [[], 'x', undefined]) {
            expect(drawnFor(retrieval)).toEqual({ method: false, note: undefined });
        }
    });
});
