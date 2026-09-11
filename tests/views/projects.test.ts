// The project board rendered to HTML on the server: one card per project of the board, what a card
// carries, what an open card adds, and the list mode's table.
//
// The catalog, the glyphs and the vocabulary are the real config, and so is the merged config the
// board reads its preset out of, so the words checked here are the words config/text.yml and
// config/layout.yml hold. The projects are synthetic: what is checked is the view, not the hub.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no
// menu opens, no card is clicked and no $effect runs; the state a click would write is written
// here through setInstanceState instead, and the interactions are checked in a browser.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Projects from '../../src/lib/views/Projects.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setInstanceState } from '../../src/lib/state/ui.svelte.ts';
import { emptyBoardState, type BoardState } from '../../src/lib/state/board.ts';
import { area, payload, record, workspace } from '../sessions-fixture.ts';
import type {
    Id,
    Project,
    Relations,
    SessionsPayload,
    Snapshot,
    Tier
} from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const INSTANCE = 'board-one';

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

/** Two projects on the projects board and one on the archive board. */
function snapshot(): Snapshot {
    const projects = [
        project('alpha', 'active', {
            type: 'active',
            title: 'Alpha, the whole title',
            short: 'Alpha',
            authors: ['Faes', 'Someone'],
            year: 2026,
            chips: ['lead'],
            statusLine: 'submit-ready, 16 pp',
            focus: 'run',
            eli5: 'what it is, in one line',
            next: 'Run the sweep. Then write it up.',
            latest: 'the latest thing',
            results: ['the first result'],
            ideas: ['an avenue'],
            outcome: 'in review',
            deadline: '2099-01-01',
            compute: 'hpc',
            codeAvailability: { status: 'deposited' },
            reproduced: { date: '2026-08-02', note: 'needs a cluster' },
            venueId: 'bspc',
            fundingIds: ['ZonMw-AI-HCC'],
            datasetIds: ['mimic'],
            programIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', present: true },
                { name: 'manuscript/main.tex', present: false }
            ]
        }),
        project('bravo', 'manuscripts', {
            type: 'manuscript',
            title: 'Bravo',
            chips: ['revision'],
            deadline: '2000-01-01',
            compute: 'local',
            lead: 'Faes'
        }),
        project('zulu', 'archive', { type: 'nogo', title: 'Zulu' }),
        // A deadline that has passed on a project that has been submitted: the badge is a record of
        // the date rather than a countdown, which is the one case the days are not shown for.
        project('yankee', 'coauthor', {
            type: 'submitted',
            title: 'Yankee',
            chips: ['submitted'],
            deadline: '2000-01-01'
        })
    ];
    const byId: Record<Id, Project> = {};
    for (const one of projects) byId[one.id] = one;
    return {
        version: 1,
        entities: {
            projects: byId,
            venues: {
                bspc: {
                    id: 'bspc',
                    name: 'BSPC',
                    short: 'BSPC',
                    quartile: 'Q1',
                    jif: '4.9',
                    free: 'free',
                    themes: []
                }
            },
            datasets: {},
            programs: {
                federated: {
                    id: 'federated',
                    title: 'Federated learning',
                    fundingIds: [],
                    projectIds: []
                }
            },
            domains: {},
            funding: {},
            collections: {
                collaborations: {
                    id: 'collaborations',
                    title: 'Collaborations',
                    file: '/hub/network/collaborations.yml',
                    entries: [
                        {
                            id: 'someone',
                            title: 'Someone Else',
                            fields: {},
                            file: '/hub/network/collaborations.yml',
                            index: 0
                        }
                    ]
                }
            }
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** Alpha's absolute folder, which is what the session join matches: the manifest's own directory. */
const ALPHA = '/hub/projects/active/alpha';

/** Two sessions in alpha's folder, one of them running, and none anywhere else. */
function sessions(): SessionsPayload {
    const rows = [
        record('live-one', {
            title: 'The live one',
            live: true,
            liveStatus: 'busy',
            state: 'working',
            workspace: '/hub',
            area: ALPHA,
            cwd: ALPHA
        }),
        record('ended-one', {
            title: 'The ended one',
            tool: 'codex',
            workspace: '/hub',
            area: ALPHA,
            cwd: ALPHA
        })
    ];
    return payload([workspace('/hub', [area(ALPHA, rows)])]);
}

receive({ channel: 'portfolio', version: 1, payload: snapshot() });
receive({ channel: 'sessions', version: 1, payload: sessions() });
receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });

/** The board rendered with one state, as the instance of one view id. */
function html(view = 'projects', state: Partial<BoardState> = {}): string {
    setInstanceState(INSTANCE, { ...emptyBoardState(), ...state });
    const instance: Instance = { id: INSTANCE, view, state: {} };
    return render(Projects, { props: { instance } }).body;
}

/** How many cards a rendering drew. */
function cards(body: string): number {
    return body.split('<article class="card').length - 1;
}

describe('the board', () => {
    it('draws one card per project of its own tiers', () => {
        expect(cards(html('projects'))).toBe(2);
        expect(cards(html('archive'))).toBe(1);
        expect(cards(html('coauthor'))).toBe(1);
    });

    it('carries its own name from the catalog', () => {
        expect(html('projects')).toContain(catalog['views.projects']);
        expect(html('archive')).toContain(catalog['views.archive']);
    });

    it('shows the empty state when a search leaves nothing', () => {
        const body = html('projects', { search: 'nothing-matches-this' });
        expect(cards(body)).toBe(0);
        expect(body).toContain(catalog['board.empty']);
    });

    it('shows the placeholder its own board names in the config', () => {
        const board = config.board as Record<string, Record<string, string>>;
        expect(html('projects')).toContain(board.search.projects);
    });
});

describe('a card', () => {
    const body = html('projects');

    it('draws the type as a filled chip in the type colour', () => {
        expect(body).toContain('toned filled');
        expect(body).toContain('--tone: var(--c-orange)');
        expect(body).toContain('>active</span>');
    });

    it('draws the domain label of the vocabulary, not the domain key', () => {
        const domains = config.domains as Record<string, { label: string }>;
        expect(body).toContain(domains.heart.label);
    });

    it('draws the venue as name, quartile, JIF and cost', () => {
        expect(body).toContain('BSPC | Q1 | JIF 4.9 | free');
    });

    it('draws the folder, the authors, the focus lane and the status chip', () => {
        expect(body).toContain('projects/active/alpha');
        expect(body).toContain('Faes, Someone');
        expect(body).toContain('>run</span>');
        expect(body).toContain('first author');
    });

    it('draws the sessions working in the project folder, and the live count', () => {
        expect(body).toContain(catalog['js.sessions.card_n'].replace('{0}', '2'));
        expect(body).toContain(catalog['js.sessions.card_live'].replace('{0}', '1'));
        expect(body).toContain('The live one');
        expect(body).toContain('The ended one');
        // The tool mark of each row, and the state dot in the hue the session list gives it.
        expect(body).toContain('>codex</span>');
        expect(body).toContain('--tone: var(--c-green)');
        // Bravo's folder holds no session, so its card draws no sessions row at all.
        expect(body.split('class="sessions').length - 1).toBe(1);
    });

    it('draws the code, reproduced and compute badges', () => {
        expect(body).toContain(catalog['board.code_deposited']);
        expect(body).toContain(catalog['board.repro_yes']);
        expect(body).toContain(catalog['cards.hpc_label']);
        expect(body).toContain(catalog['cards.local_label']);
    });

    it('draws the funding, research line, dataset and collaborator tags', () => {
        expect(body).toContain('ZonMw-AI-HCC');
        expect(body).toContain('Federated learning');
        expect(body).toContain('>mimic</span>');
        expect(body).toContain('Someone Else');
    });

    it('draws the eli5 and the first sentence of next, and no more of it', () => {
        expect(body).toContain(catalog['cards.eli5']);
        expect(body).toContain('what it is, in one line');
        expect(body).toContain('Run the sweep.');
        expect(body).not.toContain('Then write it up.');
    });

    it('draws a deadline that has passed as overdue and one far off as its date', () => {
        expect(body).toContain('overdue');
        expect(body).toContain('2099-01-01');
    });

    it('draws the date rather than a countdown once the work has been submitted', () => {
        const submitted = html('coauthor');
        expect(submitted).toContain('2000-01-01');
        expect(submitted).not.toContain('overdue');
    });

    // The title is a button since O14b: it opens the project as its own tab.
    it('shows the short handle in short mode and the full title in full mode', () => {
        expect(html('projects', { labels: 'short' })).toMatch(/class="open[^"]*">Alpha</);
        expect(html('projects', { labels: 'full' })).toMatch(
            /class="open[^"]*">Alpha, the whole title</
        );
    });

    it('draws the title as the control that opens the project as its own tab', () => {
        expect([...html('projects').matchAll(/class="open svelte-/g)]).toHaveLength(2);
    });

    it('keeps the full title as the tooltip when the head shows the short handle', () => {
        expect(html('projects', { labels: 'short' })).toContain('title="Alpha, the whole title"');
    });
});

describe('an open card', () => {
    const closed = html('projects');
    const open = html('projects', { expanded: ['alpha'] });

    it('adds the status line and the labelled fields', () => {
        expect(open).toContain('submit-ready, 16 pp');
        for (const key of [
            'cards.latest',
            'cards.results',
            'cards.outcome',
            'cards.next',
            'cards.ideas',
            'cards.reproduced'
        ]) {
            expect(open).toContain(catalog[key]);
        }
        expect(open).toContain('the latest thing');
        expect(open).toContain('the first result');
        expect(open).toContain('an avenue');
        expect(open).toContain('2026-08-02 | needs a cluster');
    });

    it('adds the project documents, present and absent', () => {
        expect(open).toContain(catalog['cards.documents']);
        expect(open).toContain('README.md');
        expect(open).toContain('manuscript/main.tex');
    });

    it('adds none of it to a card that is not open', () => {
        expect(closed).not.toContain('the latest thing');
        expect(closed).not.toContain('submit-ready, 16 pp');
    });
});

describe('the list mode', () => {
    it('draws a table with the columns the config names for this board', () => {
        const board = config.board as Record<string, string[]>;
        const body = html('projects', { mode: 'list' });
        expect(body).toContain('<table');
        expect(cards(body)).toBe(0);
        for (const word of board.cols_project) expect(body).toContain(`>${word}`);
    });

    it('draws the archive columns on the archive board', () => {
        const board = config.board as Record<string, string[]>;
        const body = html('archive', { mode: 'list' });
        for (const word of board.cols_archive) expect(body).toContain(`>${word}`);
    });

    it('fills the row from the same joins the card reads', () => {
        const body = html('projects', { mode: 'list' });
        expect(body).toContain('Faes, Someone');
        expect(body).toContain('>BSPC<');
        expect(body).toContain('Run the sweep.');
    });
});

describe('the facets', () => {
    const body = html('projects');

    it('offers a menu per facet the board can be split on', () => {
        expect(body).toContain(`Filter by ${catalog['board.facet_status']}`);
        expect(body).toContain(`Filter by ${catalog['board.facet_compute']}`);
    });

    it('offers no menu for a facet with fewer than two values', () => {
        expect(body).not.toContain(`Filter by ${catalog['board.facet_dataset']}`);
    });

    it('offers the sessions facet, and narrows the board to the project being worked on', () => {
        // A menu's values are drawn when it opens, which needs a DOM; what is checked here is that
        // the facet is offered at all, and that filtering on each of its values leaves the right
        // cards. Alpha has a live session, bravo has none, and no project is `recent`.
        expect(body).toContain(`Filter by ${catalog['board.facet_sessions']}`);
        expect(cards(html('projects', { filters: { sessions: ['live'] } }))).toBe(1);
        expect(cards(html('projects', { filters: { sessions: ['none'] } }))).toBe(1);
        expect(cards(html('projects', { filters: { sessions: ['recent'] } }))).toBe(0);
    });

    it('shows only what a filter leaves', () => {
        expect(cards(html('projects', { filters: { compute: ['hpc'] } }))).toBe(1);
        expect(cards(html('projects', { filters: { compute: ['hpc', 'local'] } }))).toBe(2);
        expect(
            cards(html('projects', { filters: { compute: ['hpc'], status: ['submitted'] } }))
        ).toBe(0);
    });
});
