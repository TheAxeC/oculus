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
import { NO_FEEDS } from '../entities-fixture.ts';
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
    Career,
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

function collection(
    id: string,
    rows: Record<string, unknown>[],
    statuses: string[] = []
): Collection {
    const file = `/hub/${id}.yml`;
    const held: Collection = {
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
    if (statuses.length > 0) {
        held.schema = [
            { field: 'title', type: 'text' },
            { field: 'status', type: 'select', options: statuses }
        ];
    }
    return held;
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
            waitingOn: ['someone'],
            followups: [{ do: 'chase the coauthor' }],
            subtasks: [{ key: 'fig', do: 'redraw figure 2', deadline: daysOff(6), done: false }]
        }),
        project('foxtrot', 'active', {
            type: 'active',
            title: 'Foxtrot',
            focus: 'run',
            deadline: daysOff(4),
            snooze: daysOff(40)
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
            feeds: {
                inbox: { run: '2020-01-01', actionable: 3 },
                leads: [{ title: 'A lead', deadline: daysOff(8), status: 'open', fit: 'strong' }],
                radar: { lastRun: '2020-01-01' },
                scout: { lastRun: '2020-01-01' },
                linkedin: { lastPost: '2020-01-01' }
            },
            career: CAREER,
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
                    deadline: daysOff(10),
                    note: 'The concept is written. The budget is not.'
                })
            },
            collections: {
                collaborations: collection('collaborations', [
                    { key: 'someone', title: 'Some One', status: 'active' }
                ]),
                events: collection(
                    'events',
                    [{ title: 'A coming talk', status: 'upcoming', date: daysOff(9) }],
                    ['upcoming', 'planned', 'not-attending', 'past']
                ),
                education: collection('education', [{ title: 'A course', status: 'ongoing' }])
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** One host in flight, one dropped candidate, and a milestone whose brackets the summary drops. */
const CAREER: Career = {
    title: 'Career strategy',
    milestone: 'FWO Senior - 2 shots left (Nov 2026 and Nov 2027).',
    situation: [{ label: 'PhD', value: 'May 2023, KU Leuven' }],
    order: [{ task: 'Veni pre-proposal', when: '1 Sep' }],
    hosts: [
        {
            name: 'Naesens',
            inst: 'KU Leuven',
            tag: 'transplant',
            status: 'awaiting',
            scores: { proposal: 'Strong', backing: 'High' },
            note: 'Federated outcome prediction across consortia.'
        }
    ],
    hostCriteria: ['Clinic-embedded'],
    notHosts: [{ who: 'Peeters', why: 'former advisor' }],
    eligibility: { rule: ['PhD 3-6 yr before the start'], shots: ['Nov 2026'], caveat: 'a caveat' },
    dropped: [{ what: 'MSCA-PF 2026' }]
};

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
            feeds: NO_FEEDS,
            career: null,
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

describe('the Live HPC pill', () => {
    it('is absent before a reachable non-empty queue arrives', () => {
        expect(body).not.toContain('HPC job');
    });

    it('is present with counts from the shared HPC state', () => {
        receive({
            channel: 'hpc',
            version: 1,
            payload: {
                status: 'ok',
                jobs: [{ id: '1' }],
                running: 1,
                pending: 2,
                total: 3,
                recent: [],
                sinfo: [],
                quota: [],
                updated: '2026-09-11T12:00:00.000Z',
                pollMin: 20,
                host: 'fixture'
            }
        });
        expect(html()).toContain('1 HPC job running');
        expect(html()).toContain('2 pending');
    });
});

describe('the board', () => {
    it('carries its own words and the three cluster headers', () => {
        expect(body).toContain(catalog['views.focus']);
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
        expect(run.slice(0, 200)).toContain('>3<');
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

    // The flame is always drawn, faint, so a card with no priority can be clicked to set one; the
    // cycle itself needs a DOM and is checked in a browser.
    it('draws the flame badge on a card with no priority at all', () => {
        expect(/class="[^"]*\bflames\b[^"]*\bunset\b/.test(body)).toBe(true);
        expect(body).toContain(catalog['focus.set_priority']);
    });
});

describe('the command center', () => {
    it('carries its heading', () => {
        expect(body).toContain(catalog['cc.command_center']);
    });

    it('draws the overdue group for a deadline that has gone by', () => {
        expect(body).toContain(catalog['cc.grp_overdue_label']);
        expect(body).toContain('Bravo');
    });

    it('draws every group that has a line', () => {
        for (const key of [
            'cc.grp_overdue_label',
            'cc.grp_attention_label',
            'cc.grp_deadlines_label',
            'cc.grp_subtask_dl_label',
            'cc.grp_followups_label',
            'cc.grp_refresh_label'
        ]) {
            expect(body).toContain(escaped(key));
        }
        expect(body).toContain(catalog['cc.emails'].replace(/&/g, '&amp;'));
        expect(body).toContain('/research-cockpit litwatch');
    });

    it('draws the snooze buttons on a project deadline line', () => {
        for (const key of ['actions.snooze_1w', 'actions.snooze_1mo', 'actions.snooze_hide']) {
            expect(body).toContain(catalog[key]);
        }
    });

    it('draws the lifecycle statuses of the events file on an events line', () => {
        expect(body).toContain('A coming talk');
        expect(body).toContain('>not-attending<');
        expect(body).toContain('>planned<');
    });

    it('draws done and del on a subtask line, and done on a follow-up', () => {
        expect(body).toContain('redraw figure 2');
        expect(body).toContain(catalog['actions.done']);
        expect(body).toContain(catalog['actions.del']);
        expect(body).toContain('chase the coauthor');
    });

    it('draws un-snooze on a snoozed line and nothing else', () => {
        expect(body).toContain(catalog['cc.snoozed'].replace('{0}', '1'));
        expect(body).toContain(catalog['actions.unsnooze']);
    });

    it('draws a position lead with its own countdown', () => {
        expect(body).toContain(escaped('cc.dlcat_position'));
        expect(body).toContain('A lead');
    });
});

describe('quick add', () => {
    it('draws its label and the two controls that open the form', () => {
        expect(body).toContain(catalog['focus.quick_add']);
        expect(body).toContain(catalog['focus.add_followup']);
        expect(body).toContain(catalog['focus.add_deadline']);
    });
});

describe('the strip and the band', () => {
    it('counts a paper under review by the venue holding it', () => {
        expect(body).toContain(catalog['focus.awaiting_response']);
        expect(body).toContain(catalog['focus.wait_review']);
        expect(body).toContain('JBI');
    });

    it('names the host emailed and still waiting', () => {
        expect(body).toContain(catalog['focus.wait_hosts']);
    });

    it('stacks the grants by stage and names the teaching column', () => {
        expect(body).toContain(catalog['focus.cards_group']);
        expect(body).toContain('A grant in prep');
        expect(body).toContain(escaped('focus.teaching_label'));
        expect(body).toContain('A course');
    });

    it('draws the first sentence of a band card note and not the rest of it', () => {
        expect(body).toContain('The concept is written.');
        expect(body).not.toContain('The budget is not.');
    });
});

describe('the career panel', () => {
    it('summarises itself with the milestone up to its first parenthesis', () => {
        expect(body).toContain('FWO Senior - 2 shots left');
        expect(body).toContain(catalog['focus.in_flight'].replace('{0}', '1'));
    });

    it('draws a host row with its score chips and the statuses it can be moved to', () => {
        expect(body).toContain('Naesens');
        expect(body).toContain('P Strong');
        expect(body).toContain('B High');
        expect(body).toContain(
            (config.career_host_status as Record<string, { label: string }>).awaiting.label
        );
        expect(body).toContain('>warm<');
        expect(body).toContain('>candidate<');
        expect(body).not.toContain('>awaiting<');
    });

    it('draws the situation strip, the criteria, the shots and the dropped chips', () => {
        expect(body).toContain(catalog['focus.career_situation']);
        expect(body).toContain('Clinic-embedded');
        expect(body).toContain('Nov 2026');
        expect(body).toContain(catalog['focus.dropped']);
        expect(body).toContain('MSCA-PF 2026');
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

    it('draws no command center and says the hub keeps no career file', () => {
        receive({ channel: 'portfolio', version: 3, payload: bare() });
        const empty = html();
        expect(empty).not.toContain(catalog['cc.command_center']);
        expect(empty).toContain(catalog['focus.career_empty']);
    });
});
