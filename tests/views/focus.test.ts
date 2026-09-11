// The Focus board rendered to HTML on the server: the clusters, the lanes with their counts, a card
// with its flames and its next sentence, the ticker's groups, the awaiting strip, the band, and the
// empty state of a portfolio with nothing in it.
//
// The catalog, the glyphs and the vocabulary are the real config, so the words checked here are the
// words config/text.yml and config/vocab.yml hold. The projects are synthetic: what is checked is
// the view, not the hub.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no menu
// opens, no card is clicked and no write is made; the menu's two writes are checked in a browser.
// The countdowns are the real clock's, so the dates below are far enough from any run date that
// which side of today they fall on is not in question.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Focus from '../../src/lib/views/Focus.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { chipLabel, setVocab } from '../../src/lib/state/tones.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import type {
    Collection,
    Funding,
    Id,
    Project,
    Relations,
    Snapshot,
    Tier,
    Venue
} from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const INSTANCE = 'focus-one';

const EMPTY_RELATIONS: Relations = {
    projectVenue: [],
    projectFunding: [],
    projectDataset: [],
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
};

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
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
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/${tier}/${id}`,
        file: `/hub/projects/${tier}/${id}/project.yml`,
        ...over
    };
}

function scheme(id: Id, over: Partial<Funding> = {}): Funding {
    return {
        id,
        title: id,
        followups: [],
        subtasks: [],
        tags: [],
        projectIds: [],
        programIds: [],
        ...over
    };
}

function collection(id: string, rows: Record<string, unknown>[]): Collection {
    const file = `/hub/${id}.yml`;
    return {
        id,
        title: id,
        file,
        entries: rows.map((fields, index) => ({
            id: String(fields.key ?? fields.title ?? index),
            title: String(fields.title ?? ''),
            fields,
            file,
            index
        }))
    };
}

function venue(id: Id, over: Partial<Venue> = {}): Venue {
    return { id, name: id, themes: [], ...over };
}

/** Two cards on the Run lane, a parked idea, a paper out for review, and a deadline long gone. */
function snapshot(): Snapshot {
    const projects = [
        project('alpha', 'active', {
            type: 'active',
            title: 'Alpha, the whole title',
            short: 'Alpha',
            focus: 'run',
            priority: 'high',
            chips: ['lead'],
            next: 'Run the sweep. Then write it up.',
            waitingOn: ['someone']
        }),
        project('bravo', 'manuscripts', {
            type: 'manuscript',
            title: 'Bravo',
            focus: 'run',
            deadline: '2000-01-01'
        }),
        project('charlie', 'manuscripts', {
            type: 'manuscript',
            title: 'Charlie',
            focus: 'review',
            chips: ['submitted'],
            venueId: 'jbi'
        }),
        project('delta', 'ideas', { type: 'idea', title: 'Delta', focus: 'holding' }),
        project('echo', 'manuscripts', { type: 'manuscript', title: 'Echo' })
    ];
    const byId: Record<Id, Project> = {};
    for (const one of projects) byId[one.id] = one;
    return {
        version: 1,
        entities: {
            projects: byId,
            venues: {
                jbi: venue('jbi', { name: 'Journal of Biomedical Informatics', short: 'JBI' })
            },
            datasets: {},
            programs: {},
            domains: {},
            funding: {
                prep: scheme('prep', {
                    title: 'A grant in prep',
                    status: 'in-prep',
                    deadline: daysOff(10)
                })
            },
            collections: {
                collaborations: collection('collaborations', [
                    { key: 'someone', title: 'Some One', status: 'active' }
                ]),
                education: collection('education', [{ title: 'A course', status: 'ongoing' }])
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/**
 * A date the given number of days from the run date. The deadline window is counted from the real
 * clock here, so a date meant to be inside it is written relative to today rather than pinned.
 */
function daysOff(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Nothing at all: the portfolio a fresh hub would publish. */
function bare(): Snapshot {
    return {
        version: 2,
        entities: {
            projects: {},
            venues: {},
            datasets: {},
            programs: {},
            domains: {},
            funding: {},
            collections: {}
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** A catalog string as the rendered page carries it: Svelte escapes the ampersand and nothing else here. */
function escaped(key: string): string {
    return catalog[key].replace(/&/g, '&amp;');
}

function html(): string {
    const instance: Instance = { id: INSTANCE, view: 'focus', state: {} };
    return render(Focus, { props: { instance } }).body;
}

receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
receive({ channel: 'portfolio', version: 1, payload: snapshot() });

const body = html();

describe('the board', () => {
    it('carries its own words and the three cluster headers', () => {
        expect(body).toContain(catalog['focus.working_now']);
        expect(body).toContain(catalog['focus.cluster_now']);
        expect(body).toContain(catalog['focus.cluster_parked']);
        expect(body).toContain(catalog['focus.cluster_incubate']);
    });

    it('draws every lane of vocab.yml with its words and its sub-line', () => {
        const rows = (config.focus_lanes ?? []) as { label: string; sub: string }[];
        for (const lane of rows) {
            expect(body).toContain(lane.label);
            expect(body).toContain(lane.sub.replace(/&/g, '&amp;'));
        }
    });

    it('counts what sits on a lane', () => {
        const run = body.slice(body.indexOf('>Run<'));
        expect(run.slice(0, 200)).toContain('>2<');
    });

    it('names the manuscript that belongs on a lane and has none', () => {
        expect(body).toContain(catalog['focus.hint_plain']);
        expect(body).toContain('1 active/manuscript');
    });

    it('holds the parked idea in the backlog rather than on a lane', () => {
        expect(body).toContain(catalog['focus.idea_backlog']);
        expect(body).toContain('Delta');
    });
});

describe('a card', () => {
    it('draws the short handle, the priority flames and the first sentence of next', () => {
        expect(body).toContain('Alpha');
        expect(body).toContain('Run the sweep.');
        expect(body).not.toContain('Then write it up.');
        const flames = body.split((config.glyphs as Record<string, string>).fire).length - 1;
        expect(flames).toBeGreaterThanOrEqual(3);
    });

    // The menu's own list is drawn only once it is open, which needs a DOM; what the server renders
    // is the button that opens it, so that is what is checked here.
    it('draws the status chips and the button that opens the move menu', () => {
        expect(body).toContain(chipLabel('lead'));
        expect(body).toContain(catalog['focus.move_to']);
    });

    it('says what a card is waiting on', () => {
        expect(body).toContain('Some One');
    });
});

describe('the ticker', () => {
    it('draws the overdue group for a deadline that has gone by', () => {
        expect(body).toContain(catalog['cc.grp_overdue_label']);
        expect(body).toContain('Bravo');
    });

    it('draws the deadlines group with its category sub-header', () => {
        expect(body).toContain(escaped('cc.grp_deadlines_label'));
    });
});

describe('the strip and the band', () => {
    it('counts a paper under review by the venue holding it', () => {
        expect(body).toContain(catalog['focus.awaiting_response']);
        expect(body).toContain(catalog['focus.wait_review']);
        expect(body).toContain('JBI');
    });

    it('stacks the grants by stage and names the teaching column', () => {
        expect(body).toContain(catalog['focus.cards_group']);
        expect(body).toContain('A grant in prep');
        expect(body).toContain(escaped('focus.teaching_label'));
        expect(body).toContain('A course');
    });
});

describe('an empty portfolio', () => {
    it('says there is nothing rather than drawing an empty board', () => {
        receive({ channel: 'portfolio', version: 2, payload: bare() });
        const empty = html();
        expect(empty).toContain(catalog['focus.none']);
        expect(empty).not.toContain('Alpha');
        expect(empty).not.toContain(catalog['focus.awaiting_response']);
    });
});
