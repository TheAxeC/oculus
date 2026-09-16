// One collection file as its own tab, rendered to HTML on the server: the cards in file order, what
// a card draws for each kind of field, the search box, the status facet, and the empty state.
//
// The catalog, glyphs and tone vocabulary are the real config. The collection is synthetic: what is checked is the view
// over a file's own schema, not the hub's seven files.
//
// What this does NOT cover: anything needing a DOM. No menu opens and no key is typed here; the
// state a click would write is written through setInstanceState instead, and the pure rules behind
// it are tests/state/collection.test.ts.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import { render } from 'svelte/server';
import Collection from '../../src/lib/views/Collection.svelte';
import EntryForm from '../../src/lib/views/shared/EntryForm.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab, statusTone } from '../../src/lib/state/tones.ts';
import type { CollectionState } from '../../src/lib/state/collection.ts';
import type { Entry, Project, Relations, SchemaField, Snapshot } from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

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

const INSTANCE = 'collection-one';
const FILE = '/hub/network/events.yml';

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

/** The shape the hub's seven files write, with one field of every kind the view draws. */
const SCHEMA: SchemaField[] = [
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

function entry(index: number, title: string, fields: Record<string, unknown>): Entry {
    return { id: title, title, fields: { title, ...fields }, file: FILE, index };
}

/** Three entries in file order: one of everything, one with a field the schema does not name, one bare. */
const ENTRIES: Entry[] = [
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

const PROJECTS: Record<string, Project> = {
    alpha: project('alpha', {
        type: 'active',
        short: 'Alpha',
        fundingIds: ['FAIR'],
        codeAvailability: { status: 'deposited' }
    }),
    beta: project('beta', { type: 'manuscript' })
};

/** The funding file: a schema, one scheme with a key and a statement, and a pinned entry. */
const FUNDING_SCHEMA: SchemaField[] = [
    { field: 'title', type: 'text', required: true },
    { field: 'status', type: 'select', options: ['awarded', 'submitted'] },
    { field: 'note', type: 'textarea' },
    { field: 'statement', type: 'textarea' },
    { field: 'url', type: 'text' },
    { field: 'key', type: 'text' }
];

const FUNDING_ENTRIES: Entry[] = [
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
const PLAIN_ENTRIES: Entry[] = [
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
const CODE_ENTRIES: Entry[] = [
    {
        id: 'a repo',
        title: 'a repo',
        fields: { title: 'a repo', status: 'active', related: ['alpha'] },
        file: '/hub/registries/repos.yml',
        index: 0
    }
];

function snapshot(projects: Record<string, Project> = PROJECTS): Snapshot {
    return {
        version: 1,
        entities: {
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
                    links: [],
                    projectIds: [],
                    jointWorkIds: ['ecg-paper']
                }
            },
            organisations: {},
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
function installFixture(): void {
    receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

/** The view as the instance of one collection's view id, with one saved state and its projects. */
function html(
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
function cards(body: string): string[] {
    return body.split('<article class="card').slice(1);
}

describe('a collection as its own tab', () => {
    let body: string;
    beforeEach(() => {
        body = html();
    });

    it("draws the pane with the file's own title and its intro as rendered Markdown", () => {
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('Talks and Events');
        expect(body).toContain('one <strong>calendar</strong> of appearances');
    });

    it('draws one card per entry, in file order', () => {
        const found = cards(body);
        expect(found.length).toBe(3);
        expect(found[0]).toContain('A talk');
        expect(found[1]).toContain('A visit');
        expect(found[2]).toContain('A pitch');
    });

    it('offers the search box and the add control the catalog names', () => {
        expect(body).toContain('Search Talks and Events ...');
        expect(body).toContain(catalog['collection.add']);
    });

    it('says which collection it is drawing', () => {
        expect(body).toContain('data-collection="events"');
    });

    it('closes the toolbar, after the add control, with the control over its own file', () => {
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain('data-source-path="network/events.yml"');
        expect(body).toContain(catalog['views.open_source']);
        expect(body).toContain(
            catalog['views.open_source_tip'].replace('{0}', 'network/events.yml')
        );
        expect(body.indexOf('data-source-path')).toBeGreaterThan(
            body.indexOf(catalog['collection.add'])
        );
    });
});

describe('a card', () => {
    let card: string;
    beforeEach(() => {
        card = cards(html())[0];
    });

    it('draws the status as a chip in the tone of the status palette', () => {
        expect(card).toContain(`--tone: var(--c-${statusTone('upcoming')})`);
        expect(card).toContain('>upcoming</span>');
    });

    it('draws a metalist as one wrapping line per label-value pair', () => {
        expect(card).toContain('>When: 16 Feb 2027</span>');
        expect(card).toContain('>Where: Enschede</span>');
    });

    it('draws every tag as its own chip', () => {
        expect(card).toContain('>core-ml</span>');
        expect(card).toContain('>conference</span>');
    });

    it('draws a local HTML link as a control that opens it as a document tab', () => {
        expect(card).toContain('network/a-talk/slides.html');
        expect(card).not.toContain('href="/api/file/hub/network/a-talk/slides.html"');
    });

    it("draws every other link as an anchor into the hub, in a tab of the browser's own", () => {
        const body = html('funding');
        expect(body).toContain('href="https://example.org/call"');
        expect(body).toContain('target="_blank"');
    });

    it("draws the fields in the order the file's schema lists them", () => {
        // The status is drawn once, as the chip in the meta row over the fields, so it is not in
        // this list: what it checks is the order of the fields the card's body draws.
        const order = ['the subtitle', '2027-02-16', 'When: 16 Feb 2027', 'core-ml'];
        const places = order.map((words) => card.indexOf(words));
        expect(places.filter((at) => at < 0)).toEqual([]);
        expect([...places].sort((a, b) => a - b)).toEqual(places);
    });

    it('skips a field the schema names and the entry does not carry', () => {
        expect(card).not.toContain('deadline');
        expect(cards(html())[2]).toContain('2030-01-01');
    });
});

describe('a field the schema does not name', () => {
    let card: string;

    beforeEach(() => {
        card = cards(html())[1];
    });

    it('is drawn after every field the schema does name', () => {
        expect(card).toContain('>role</span>');
        expect(card.indexOf('>role</span>')).toBeGreaterThan(card.indexOf('>completed</span>'));
    });
});

describe('the status facet', () => {
    it('draws one toggle per status, with its count, all of them on', () => {
        const body = html();
        expect(body).toContain(catalog['collection.status_facet']);
        expect(body).toContain('upcoming 2');
        expect(body).toContain('completed 1');
        expect(body).toContain(`--accent: var(--c-${statusTone('upcoming')})`);
        expect(body).toContain(`--accent: var(--c-${statusTone('completed')})`);
    });

    it("hides a status's cards when its toggle is switched off", () => {
        const found = cards(html('events', { hidden: ['upcoming'] }));
        expect(found.length).toBe(1);
        expect(found[0]).toContain('A visit');
    });

    it('shows only the entries whose status is selected', () => {
        const found = cards(html('events', { statuses: ['completed'] }));
        expect(found.length).toBe(1);
        expect(found[0]).toContain('A visit');
    });

    it('shows the empty state when a search matches nothing', () => {
        const body = html('events', { search: 'nothing-matches-this' });
        expect(cards(body).length).toBe(0);
        expect(body).toContain(catalog['collection.empty']);
    });

    it('searches every field, not only the title', () => {
        expect(cards(html('events', { search: 'Enschede' })).length).toBe(1);
    });
});

describe('a collection the snapshot does not carry', () => {
    let body: string;

    beforeEach(() => {
        body = html('statements');
    });

    it('says there is nothing rather than drawing a card', () => {
        expect(cards(body).length).toBe(0);
        expect(body).toContain(catalog['collection.empty']);
    });

    it('falls back to the name the view is registered under', () => {
        expect(body).toContain(catalog['views.statements']);
    });

    it('offers no control over a file it has not read', () => {
        expect(body).not.toContain('data-source-path');
    });
});

describe('a palette reveal', () => {
    it('keeps the target id in instance state and marks the matching card for the mount effect', () => {
        const body = html('events', { reveal: 'A visit' });
        expect(body).toContain('data-reveal="A visit"');
        expect(body).toContain('data-reveal="A talk"');
    });
});

describe('the controls a card carries', () => {
    let card: string;

    beforeEach(() => {
        card = cards(html())[0];
    });

    it('carries the grip, the pin and the edit control the catalog names', () => {
        expect(card).toContain(catalog['collection.reorder_hint']);
        expect(card).toContain(catalog['collection.pin_to_top']);
        expect(card).toContain(catalog['collection.edit_delete']);
    });

    it('carries the subtasks block, over the entry rather than over a project', () => {
        expect(card).toContain(catalog['project.action.subtasks']);
        expect(card).toContain(catalog['project.action.add_subtask']);
    });
});

describe('a collection whose file has no schema', () => {
    let body: string;

    beforeEach(() => {
        body = html('tasks');
    });

    it('offers no add control, since there is no schema to draw a form from', () => {
        expect(body).not.toContain(catalog['collection.add']);
    });

    it("draws the file's other statuses as buttons, the current one left out", () => {
        const card = cards(body)[0];
        expect(card).toContain('>doing</span>');
        expect(card).not.toContain(catalog['collection.edit_delete']);
        expect(cards(body)[1]).toContain('>todo</span>');
    });
});

describe('the funding view', () => {
    let body: string;

    beforeEach(() => {
        body = html('funding');
    });

    it('combines active and manuscript funding users into one work disclosure', () => {
        const snap = snapshot();
        snap.entities.projects = {
            ...snap.entities.projects,
            beta: { ...snap.entities.projects.beta, fundingIds: ['FAIR'] }
        };
        receive({ channel: 'portfolio', version: 1, payload: snap });
        try {
            const mixed = html('funding');
            expect(mixed.match(/data-project-group="work"/g)).toHaveLength(1);
            expect(mixed).toMatch(/data-project-group="work"[\s\S]*?class="count">2<\/strong>/);
            expect(mixed).not.toContain('data-project-group="manuscript"');
        } finally {
            receive({ channel: 'portfolio', version: 1, payload: snapshot() });
        }
    });

    it('is drawn from the funding collection the snapshot now carries', () => {
        expect(body).toContain('data-collection="funding"');
        expect(cards(body).length).toBeGreaterThan(1);
    });

    it('draws the pinned scheme first, marked as pinned', () => {
        const found = cards(body);
        expect(found[0]).toContain('A funded scheme');
        expect(found[0]).toContain('pinned');
        expect(found[1]).toContain('A later scheme');
    });

    it('draws the statement as a blockquote with the tooltip the catalog names', () => {
        expect(body).toContain('<blockquote');
        expect(body).toContain(catalog['collection.fundstmt_tip']);
        expect(body).toContain('This work was funded by FAIR.');
    });

    it('draws the note as rendered Markdown', () => {
        expect(body).toContain('what it <strong>is</strong>');
    });

    it("groups the projects whose manifest names the scheme's key", () => {
        expect(body).toContain(catalog['collection.related']);
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>Alpha</span>');
    });

    it('draws the card of the projects no scheme covers, and its facet toggle', () => {
        expect(body).toContain(catalog['collection.no_funding']);
        expect(body).toContain(catalog['collection.no_funding_sub']);
        expect(body).toContain('>beta</span>');
    });

    it('drops that card when its toggle is switched off', () => {
        const off = html('funding', { hidden: ['no-funding'] });
        expect(off).not.toContain(catalog['collection.no_funding_sub']);
    });
});

describe('the code view', () => {
    let body: string;

    beforeEach(() => {
        body = html('code');
    });

    it('draws the coverage groups over the projects, with a count each', () => {
        expect(body).toContain(catalog['collection.coverage']);
        expect(body).toContain(catalog['collection.coverage_deposited']);
        expect(body).toContain(catalog['collection.coverage_anon']);
        expect(body).toContain(catalog['collection.coverage_none']);
        expect(body).toContain('data-group="deposited"');
    });

    it("draws the repo cards under it, with the projects the entry's related list names", () => {
        const card = cards(body)[0];
        expect(card).toContain('a repo');
        expect(card).toContain('class="label">active</span>');
        expect(card).toContain('aria-expanded="false"');
        expect(card).not.toContain('>Alpha</span>');
    });

    it('says the tier holds nothing while the portfolio has no software project', () => {
        expect(body).toContain(catalog['collection.software']);
        expect(body).toContain(catalog['collection.software_none']);
        expect(body).not.toContain('data-software-row=');
    });

    it('draws one row per software project, with its deposit state and the papers it names', () => {
        const withTool = html(
            'code',
            {},
            {
                ...PROJECTS,
                kit: project('kit', {
                    tier: 'software',
                    type: 'software',
                    title: 'A toolkit',
                    codeAvailability: { status: 'deposited' },
                    relatedIds: ['alpha']
                })
            }
        );
        expect(withTool).not.toContain(catalog['collection.software_none']);
        expect(withTool).toContain('data-software-row="kit"');
        expect(withTool).toContain('>A toolkit<');
        expect(withTool).toContain(catalog['board.code_deposited']);
        expect(withTool).toContain(catalog['collection.software_papers']);
        expect(withTool).toContain('>Alpha<');
    });
});

describe('the entry form', () => {
    /** The form as the card opens it: over one entry to edit, and over none to add. */
    function form(entry: Entry | null, props: Record<string, unknown> = {}): string {
        return render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'funding',
                schema: FUNDING_SCHEMA,
                entry,
                onclose: noop,
                onsaid: noop,
                ...props
            }
        }).body;
    }

    /** The classes on the form's own box, which is what carries its surface. */
    function box(body: string): string[] {
        return (/<div class="([^"]*)" data-form=/.exec(body)?.[1] ?? '').split(' ');
    }

    it("draws one control per schema field, in the file's order", () => {
        const body = form(null);
        expect(body).toContain(catalog['collection.form_add_title']);
        expect(body).toContain('<select');
        expect(body).toContain('<textarea');
        expect(body.indexOf('status')).toBeLessThan(body.indexOf('statement'));
    });

    it('fills the controls with what the entry holds, and offers the delete', () => {
        const body = form(FUNDING_ENTRIES[1]);
        expect(body).toContain(catalog['collection.form_edit_title']);
        expect(body).toContain('A funded scheme');
        expect(body).toContain(catalog['collection.form_delete']);
        expect(body).toContain(catalog['collection.form_save']);
    });

    it('offers no delete on the add form', () => {
        expect(form(null)).not.toContain(catalog['collection.form_delete']);
    });

    it('pre-fills metalist rows and offers the add-row control', () => {
        const body = render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'events',
                schema: SCHEMA,
                entry: ENTRIES[0],
                onclose: noop,
                onsaid: noop
            }
        }).body;
        expect(body).toContain('data-metalist="meta"');
        expect(body).toContain('value="When"');
        expect(body).toContain('value="16 Feb 2027"');
        expect(body).toContain('value="Where"');
        expect(body).toContain(catalog['collection.meta_add']);
        expect(body).toContain(catalog['collection.meta_remove']);
    });

    it('paints a box of its own, and none for a caller that asks for no surface', () => {
        // The border and the padding are the same either way; only the fill goes, so a caller whose
        // own box already carries the surface does not draw a second one inside it.
        expect(box(form(null))).toContain('surface');
        expect(box(form(null, { surface: false }))).not.toContain('surface');
        expect(form(null, { surface: false })).toContain('data-form="add"');
    });

    it("pre-fills a raw textarea with the entry map's JSON", () => {
        const body = render(EntryForm, {
            context: clientContext(client),
            props: {
                collection: 'data',
                schema: [{ field: 'retrieval', type: 'raw' }],
                entry: entry(0, 'A dataset', {
                    retrieval: { method: 'wget', verified: true }
                }),
                onclose: noop,
                onsaid: noop
            }
        }).body;
        expect(body).toContain('<textarea');
        expect(body).toContain('{"method":"wget","verified":true}');
    });
});

describe('a field whose value is a map', () => {
    it('draws one chip per key, the key and its line joined, rather than nothing', () => {
        const snap = snapshot();
        snap.version = 9;
        snap.entities.collections.events.entries = [
            entry(0, 'A nested talk', {
                retrieval: { method: 'wget', notes: 'from the source', empty: {} }
            })
        ];
        receive({ channel: 'portfolio', version: 9, payload: snap });
        const card = cards(html())[0];
        expect(card).toContain('>retrieval</span>');
        expect(card).toContain('method: wget');
        expect(card).toContain('notes: from the source');
        expect(card).not.toContain('empty:');
        receive({ channel: 'portfolio', version: 10, payload: snapshot() });
    });
});

describe('what a reorder and a cleared control send', () => {
    // The drop and the save are DOM events no server render fires, so the two rules are read off
    // the source: the order the drag writes, and the value an emptied control saves as. The pure
    // halves, movedOrder and clearedValue, are tested in tests/state/collection.test.ts.
    it('writes the file own order, never the pinned-first order the cards are drawn in', () => {
        const source = readFileSync('src/lib/views/Collection.svelte', 'utf8');
        const order = source.slice(source.indexOf('function fileOrder()'));
        const body = order.slice(0, order.indexOf('\n    }'));
        expect(body).toContain('(collection?.entries ?? [])');
        expect(body).not.toContain('pinnedFirst');
        expect(body).not.toContain('entries.map');
        expect(body).not.toContain('shown');
        // Both callers take their order from that one reader and from nothing else.
        expect(source).toContain('const order = fileOrder();');
        expect(source.match(/fileOrder\(\)/g)).toHaveLength(3);
    });

    it('sends the empty string for a control the reader cleared on an entry that exists', () => {
        const source = readFileSync('src/lib/views/shared/EntryForm.svelte', 'utf8');
        expect(source).toContain('return clearedValue(field in edits, entry !== null);');
        expect(source).toContain("if (text !== '') return text;");
    });
});

describe('a joint-work card', () => {
    it("draws its person as the control that opens them, by the registry's name", () => {
        const body = html('joint-work');
        expect(body).toContain(catalog['collection.open_person']);
        expect(body).toContain('Maarten Naesens');
        // The key itself is not what the card draws; the name the registry holds is.
        expect(body).not.toContain('>naesens<');
    });
});
