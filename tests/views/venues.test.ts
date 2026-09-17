// The Venues view rendered on the server over journals, timed and untimed conferences and projects.
// Pure click behaviour is covered in state/venues.test.ts; this checks every visible acceptance item.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import Venues from '../../src/lib/views/Venues.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import type {
    Collection,
    Entry,
    Project,
    Relations,
    Snapshot,
    Venue
} from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
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
/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 24, payload: { config, text: catalog, findings: [] } });
}

const FILE = '/hub/registries/venues.yml';
const INSTANCE = 'venues-one';
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

function project(id: string, venueId: string, type: string): Project {
    return {
        id,
        tier: type === 'manuscript' ? 'manuscripts' : 'active',
        ghost: false,
        type,
        title: id,
        short: id.toUpperCase(),
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        venueId,
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`
    };
}

const VENUES: Venue[] = [
    {
        id: 'journal',
        name: 'Journal of **Tests**',
        short: 'JT',
        category: 'journal',
        tier: 'strong',
        jif: '5.9',
        quartile: 'Q1',
        wos: 'SCIE',
        scopus: 'yes',
        format: 'elsarticle',
        free: 'free subscription',
        wants: 'Clinical **methods**.',
        link: 'https://example.org/journal',
        themes: ['clinical', 'ml']
    },
    {
        id: 'timed',
        name: 'IEEE Timed Conference',
        short: 'ITC',
        category: 'conference',
        quartile: 'CORE A',
        free: 'hybrid',
        timing: 'deadline Sep, held Jan',
        deadlineMonth: 'Sep',
        heldMonth: 'Jan',
        call: 'https://example.org/call',
        email: 'chair@example.org',
        themes: ['ml']
    },
    {
        id: 'untimed',
        name: 'Untimed Conference',
        short: 'UTC',
        category: 'conference',
        free: 'APC',
        themes: ['systems']
    },
    {
        id: 'biennial',
        name: 'Biennial Conference',
        short: 'BC',
        category: 'conference',
        quartile: 'A* biennial',
        deadlineMonth: 'Oct',
        heldMonth: 'May',
        timing: 'biennial meeting',
        themes: ['clinical']
    }
];

function entries(): Entry[] {
    return VENUES.map((venue, index) => ({
        id: venue.id,
        title: venue.name,
        fields: {
            name: venue.name,
            id: venue.id,
            category: venue.category,
            themes: venue.themes
        },
        file: FILE,
        index
    }));
}

function collection(items = entries()): Collection {
    return {
        id: 'venues',
        title: 'Venues',
        file: FILE,
        schema: [
            { field: 'name', type: 'text', required: true },
            { field: 'id', type: 'text' },
            { field: 'category', type: 'select', optionsFrom: 'venue_categories' },
            { field: 'tier', type: 'select', optionsFrom: 'venue_tiers' },
            { field: 'themes', type: 'tags' }
        ],
        entries: items
    };
}

function snapshot(items: Venue[] = VENUES): Snapshot {
    const projects = {
        alpha: project('alpha', 'journal', 'active'),
        beta: project('beta', 'journal', 'manuscript')
    };
    return {
        version: 24,
        entities: {
            feeds: NO_FEEDS,
            career: null,
            projects,
            venues: Object.fromEntries(items.map((venue) => [venue.id, venue])),
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {},
            organisations: {},
            collections: { venues: collection(items.length === 0 ? [] : entries()) }
        },
        relations: RELATIONS,
        findings: []
    };
}

function html(items: Venue[] = VENUES): string {
    receive({
        channel: 'portfolio',
        version: items.length === 0 ? 26 : 25,
        payload: snapshot(items)
    });
    setInstanceState(INSTANCE, {
        search: '',
        off: [],
        journalsOpen: true,
        conferencesOpen: true,
        reveal: 'journal'
    });
    const instance: Instance = { id: INSTANCE, view: 'venues', state: {} };
    return render(Venues, { context: clientContext(client), props: { instance } }).body;
}

function venueCard(body: string, id: string): string {
    const found = new RegExp(`<div[^>]*data-venue="${id}"[^>]*>[\\s\\S]*?</article>`).exec(body);
    expect(found).not.toBeNull();
    return found?.[0] ?? '';
}

describe('the Venues controls and facets', () => {
    it('closes its toolbar with the control that opens registries/venues.yml', () => {
        const body = html();
        expect(body).toContain('data-source-path="registries/venues.yml"');
        expect(body).toContain(catalog['views.open_source']);
        // Last in the toolbar: the way out of the view, after the view's own controls.
        expect(body.indexOf(catalog['collection.add'])).toBeLessThan(
            body.indexOf('data-source-path="registries/venues.yml"')
        );
    });

    it('draws add, search, and theme toggles most frequent first', () => {
        const body = html();
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain(catalog['venues.intro']);
        expect(body).toContain(catalog['collection.add']);
        expect(body).toContain('data-reveal="journal"');
        expect(body).toContain('Search Venues ...');
        expect(body).toContain(catalog['venues.themes_facet']);
        expect(body.indexOf('ml 2')).toBeLessThan(body.indexOf('Systems 1'));
        expect(body).toMatch(/class="tool [^"]*active"/);
    });
});

describe('the theme words under their venue_themes labels', () => {
    /** The label config/vocab.yml gives a word, read from the config the view is drawn with. */
    function label(word: string): string {
        const rows = config.venue_themes as { key: string; label: string }[];
        const row = rows.find((item) => item.key === word);
        expect(row).toBeDefined();
        return row?.label ?? '';
    }

    it('draws a facet under its label, and a word with no row as the word', () => {
        const body = html();
        const row = /<div class="facets[^"]*"[\s\S]*?<\/div>/.exec(body)?.[0] ?? '';
        expect(label('clinical')).not.toBe('clinical');
        expect(row).toContain(`${label('clinical')} 2`);
        expect(row).toContain(`${label('systems')} 1`);
        expect(row).not.toContain('clinical 2');
        expect(row).toContain('ml 2');
    });

    it('draws a venue card theme tag under its label', () => {
        const card = venueCard(html(), 'untimed');
        expect(card).toContain(`>${label('systems')}</span>`);
        expect(card).not.toContain('>systems</span>');
    });

    it('filters the cards by a held off word while the facet draws its label', () => {
        receive({ channel: 'portfolio', version: 25, payload: snapshot() });
        setInstanceState(INSTANCE, {
            search: '',
            off: ['systems'],
            journalsOpen: true,
            conferencesOpen: true
        });
        const instance: Instance = { id: INSTANCE, view: 'venues', state: {} };
        const body = render(Venues, { context: clientContext(client), props: { instance } }).body;
        expect(body).toContain(`${label('systems')} 1`);
        expect(body).not.toContain('data-card="untimed"');
        expect(body).toContain('data-card="timed"');
    });
});

describe('the journal section and venue card', () => {
    it('draws the open journal section, card fields, links, themes and concentrated project users', () => {
        const body = html();
        expect(body).toContain(catalog['venues.journals'].replace('{0}', '1'));
        expect(body).toContain('Journal of <strong>Tests</strong>');
        expect(body).toContain(catalog['venues.jif'].replace('{0}', '5.9'));
        expect(body).toContain('SCIE');
        expect(body).toContain('Scopus yes');
        expect(body).toContain('<strong>elsarticle</strong>');
        expect(body).toContain('href="https://example.org/journal"');
        expect(body).toContain('Clinical <strong>methods</strong>.');
        const journal = venueCard(body, 'journal');
        expect(journal).toMatch(/class="slot [^"]*concentrated"/);
        expect(journal).toMatch(/class="tag /);
        expect(journal).not.toContain('--tone: var(--c-');
        expect(journal).toContain(catalog['venues.conc']);
        expect(journal).toContain(catalog['venues.conc_tip']);
        expect(journal).toContain('class="label">active</span>');
        expect(journal).toContain('class="count">2</strong>');
        expect(journal).toContain('aria-expanded="false"');
        expect(journal).not.toContain('>ALPHA</span>');
        expect(journal).not.toContain('>BETA</span>');
        expect(journal).toContain('>Clinical</span>');
        expect(journal).toContain('>ml</span>');
        expect(journal).not.toContain('>clinical</span>');
    });

    // Revert: in views/venues/VenueCard.svelte, drop the Show in Files ToolButton, or send the site
    // link to the raw value instead of the hub file.
    it('offers Show in Files and a site link to the hub file, in a tab of its own, for a link that is a hub path', () => {
        const path = VENUES.map((one) =>
            one.id === 'journal' ? { ...one, link: 'network/../registries/venues.yml' } : one
        );
        const journal = venueCard(html(path), 'journal');
        expect(journal).toContain(`aria-label="${catalog['venues.show_in_files']}"`);
        expect(journal).toContain(
            catalog['venues.show_in_files_tip'].replace('{0}', 'registries/venues.yml')
        );
        expect(journal).toContain('href="/api/file/hub/registries/venues.yml"');
        // The site link leaves the application as the collection cards' links do, never replacing it.
        expect(journal).toContain('target="_blank"');
    });

    // Revert: in hubPathsOf of state/collection.ts, take every `link` value.
    it('offers no Show in Files for a link that is a web address, and opens it in a tab of its own', () => {
        const journal = venueCard(html(), 'journal');
        expect(journal).not.toContain(catalog['venues.show_in_files']);
        expect(journal).toMatch(/href="https:\/\/example.org\/journal"[^>]*target="_blank"/);
    });

    it('draws the concentration legend with its explanation', () => {
        const body = html();
        const firstCard = body.indexOf('<article');
        const legend = body.slice(0, firstCard);
        expect(legend).toContain(catalog['venues.conc']);
        expect(legend).toContain(catalog['venues.conc_tip']);
        expect(legend).toMatch(/class="tag /);
        expect(legend).toContain('tabindex="0"');
    });

    it('omits the project cross-link block from a venue with no users', () => {
        expect(venueCard(html(), 'untimed')).not.toContain('class="users"');
    });
});

describe('the conference section and ribbon', () => {
    it('draws next deadlines, legend, all months, timed chips and biennial caveats', () => {
        const body = html();
        expect(body).toContain(catalog['venues.conferences'].replace('{0}', '3'));
        expect(body).toContain(catalog['venues.next']);
        expect(body).toContain(catalog['venues.leg_deadline']);
        // A deadline's mark is violet and a held conference's green, painted on the tag's own
        // glyph so the biennial marker beside the tag keeps its ink.
        const source = readFileSync('src/lib/views/venues/Ribbon.svelte', 'utf8');
        expect(source).toMatch(
            /\.deadline :global\(\.tag \.glyph\) \{\s*color: var\(--c-violet-txt\);/
        );
        expect(source).toMatch(/\.held :global\(\.tag \.glyph\) \{\s*color: var\(--c-green-txt\);/);
        expect(body).toMatch(/class="timed deadline[ "]/);
        expect(body).toMatch(/class="timed held[ "]/);
        expect(body).toContain(catalog['venues.leg_held']);
        expect(body).toContain(catalog['venues.leg_biennial']);
        expect(body).toContain(catalog['venues.leg_approx']);
        expect(body).toContain(' Jan</div>');
        expect(body).toContain(' Dec</div>');
        expect(body).toContain('ITC');
        expect(body).toContain(catalog['venues.biennial_caveat']);
        expect(body).toContain('Untimed Conference');
        expect(body).toMatch(/class="month [^"]*current"/);
    });

    it('draws call and contact links only on the venue that carries them', () => {
        const body = html();
        expect(body).toContain('href="https://example.org/call"');
        expect(body).toContain('href="mailto:chair@example.org"');
        expect(body).toContain(catalog['venues.call']);
        expect(body).toContain(catalog['venues.contact']);
    });
});

describe('the venue card as a card primitive', () => {
    it('gives every card the venue id the keyboard cursor moves over', () => {
        const body = html();
        for (const id of ['journal', 'timed', 'untimed', 'biennial']) {
            expect(body).toContain(`data-card="${id}"`);
        }
        expect(body).not.toContain('data-cursor');
    });

    it('marks the card the instance cursor holds and no other', () => {
        html();
        const held: Instance = { id: INSTANCE, view: 'venues', state: { cursor: 'journal' } };
        const body = render(Venues, {
            context: clientContext(client),
            props: { instance: held }
        }).body;
        expect(body).toMatch(/data-card="journal"[^>]*data-cursor="true"/);
        expect(body.match(/data-cursor="true"/g)).toHaveLength(1);
    });
});

describe('the concentration legend chip', () => {
    it('sits inside the theme facet row, so it wraps with the toggles and never lands alone', () => {
        const body = html();
        const row = /<div class="facets[^"]*"[\s\S]*?<\/div>/.exec(body)?.[0] ?? '';
        expect(row).toContain(catalog['venues.themes_facet']);
        expect(row).toContain(catalog['venues.conc']);
        expect(body).not.toContain('class="facet-row"');
    });
});

describe('an empty venue file', () => {
    it('draws the catalogued empty state', () => {
        expect(html([])).toContain(catalog['venues.empty']);
    });
});
