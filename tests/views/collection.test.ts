// One collection file as its own tab, rendered to HTML on the server: the cards in file order, what
// a card draws for each kind of field, the search box, the status facet, and the empty state.
//
// The catalog, the glyphs and the tone vocabulary are the real config, so the words and the hues are
// config/text.yml's and config/vocab.yml's. The collection is synthetic: what is checked is the view
// over a file's own schema, not the hub's seven files.
//
// What this does NOT cover: anything needing a DOM. No menu opens and no key is typed here; the
// state a click would write is written through setInstanceState instead, and the pure rules behind
// it are tests/state/collection.test.ts.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Collection from '../../src/lib/views/Collection.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab, statusTone } from '../../src/lib/state/tones.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import type { CollectionState } from '../../src/lib/state/collection.ts';
import type { Entry, Relations, SchemaField, Snapshot } from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

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
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
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

function snapshot(): Snapshot {
    return {
        version: 1,
        entities: {
            projects: {},
            venues: {},
            datasets: {},
            programs: {},
            domains: {},
            funding: {},
            collections: {
                events: {
                    id: 'events',
                    title: 'Talks and Events',
                    intro: 'one calendar of appearances',
                    file: FILE,
                    schema: SCHEMA,
                    entries: ENTRIES
                }
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

receive({ channel: 'portfolio', version: 1, payload: snapshot() });

/** The view as the instance of one collection's view id, with one saved state. */
function html(view = 'events', state: Partial<CollectionState> = {}): string {
    setInstanceState(INSTANCE, { search: '', statuses: [], ...state });
    const instance: Instance = { id: INSTANCE, view, state: {} };
    return render(Collection, { props: { instance } }).body;
}

/** The cards of a rendering, in the order they were drawn. */
function cards(body: string): string[] {
    return body.split('<article class="card').slice(1);
}

describe('a collection as its own tab', () => {
    const body = html();

    it("draws the pane with the file's own title and intro", () => {
        expect(body).toContain('Talks and Events');
        expect(body).toContain('one calendar of appearances');
    });

    it('draws one card per entry, in file order', () => {
        const found = cards(body);
        expect(found.length).toBe(3);
        expect(found[0]).toContain('A talk');
        expect(found[1]).toContain('A visit');
        expect(found[2]).toContain('A pitch');
    });

    it('offers the search box the catalog names', () => {
        expect(body).toContain(catalog['collection.search']);
    });

    it('says which collection it is drawing', () => {
        expect(body).toContain('data-collection="events"');
    });
});

describe('a card', () => {
    const card = cards(html())[0];

    it('draws the status as a chip in the tone of the status palette', () => {
        expect(card).toContain(`--tone: var(--c-${statusTone('upcoming')})`);
        expect(card).toContain('>upcoming</span>');
    });

    it('draws a metalist as one chip per label-value pair', () => {
        expect(card).toContain('>When: 16 Feb 2027</span>');
        expect(card).toContain('>Where: Enschede</span>');
    });

    it('draws every tag as its own chip', () => {
        expect(card).toContain('>core-ml</span>');
        expect(card).toContain('>conference</span>');
    });

    it("draws a link as an anchor into the hub that opens a tab of the browser's own", () => {
        expect(card).toContain('href="/api/file/hub/network/a-talk/slides.html"');
        expect(card).toContain('target="_blank"');
    });

    it("draws the fields in the order the file's schema lists them", () => {
        const order = ['the subtitle', 'upcoming', '2027-02-16', 'When: 16 Feb 2027', 'core-ml'];
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
    const card = cards(html())[1];

    it('is drawn after every field the schema does name', () => {
        expect(card).toContain('>role</span>');
        expect(card.indexOf('>role</span>')).toBeGreaterThan(card.indexOf('>completed</span>'));
    });
});

describe('the status facet', () => {
    it('is offered, since the schema names a status and two values occur', () => {
        expect(html()).toContain(catalog['collection.status']);
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
    const body = html('statements');

    it('says there is nothing rather than drawing a card', () => {
        expect(cards(body).length).toBe(0);
        expect(body).toContain(catalog['collection.empty']);
    });

    it('falls back to the name the view is registered under', () => {
        expect(body).toContain(catalog['views.statements']);
    });
});
