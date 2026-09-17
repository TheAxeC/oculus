// The project board rendered to HTML on the server: one card per project of the board, what a card
// carries, what an open card adds, and the list mode's table.
//
// The catalog, glyphs, vocabulary and board preset are the real config. The projects are synthetic: what is checked is the view, not the hub.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so no
// menu opens, no card is clicked and no $effect runs; the state a click would write is written
// here through setInstanceState instead, and the interactions are checked in a browser.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import { render } from 'svelte/server';
import Projects from '../../src/lib/views/Projects.svelte';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, setIcons } from '../../src/lib/state/text.ts';
import { chipGlyphName, chipLabel, setVocab, statusMarkTone } from '../../src/lib/state/tones.ts';
import { emptyBoardState, type BoardState } from '../../src/lib/state/board/index.ts';
import { area, payload, record, workspace } from '../sessions-fixture.ts';
import type {
    Id,
    Project,
    Relations,
    SessionsPayload,
    Snapshot,
    Tier
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

const INSTANCE = 'board-one';

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

function project(id: Id, tier: Tier, over: Partial<Project> = {}): Project {
    return {
        id,
        tier,
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
            pillarIds: ['federated'],
            domainIds: ['heart'],
            collaborators: ['someone'],
            docs: [
                { name: 'README.md', label: 'README', present: true, human: false },
                { name: 'manuscript/main.tex', label: 'TEX', present: false, human: false }
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
            feeds: NO_FEEDS,
            career: null,
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
            pillars: {
                federated: {
                    id: 'federated',
                    title: 'Federated learning',
                    fundingIds: [],
                    projectIds: []
                }
            },
            domains: {},
            funding: {},
            people: {
                someone: {
                    id: 'someone',
                    name: 'Someone Else',
                    affiliations: [],
                    links: [],
                    projectIds: [],
                    jointWorkIds: []
                }
            },
            organisations: {},
            collections: {}
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

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    receive({ channel: 'sessions', version: 1, payload: sessions() });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
}

/** The board rendered with one state, as the instance of one view id. */
function html(view = 'projects', state: Partial<BoardState> = {}): string {
    setInstanceState(INSTANCE, { ...emptyBoardState(), ...state });
    const instance: Instance = { id: INSTANCE, view, state: {} };
    return render(Projects, { context: clientContext(client), props: { instance } }).body;
}

/** How many cards a rendering drew. */
function cards(body: string): number {
    return body.split('<article class="card').length - 1;
}

/** The words of one catalog key with its argument filled in, which is what the markup carries. */
function words(key: string, ...args: string[]): string {
    return args.reduce((held, arg, at) => held.replace(`{${at}}`, arg), catalog[key]);
}

/**
 * The board over the fixture with some projects overwritten, and the fixture put back afterwards,
 * so a case that needs a stale project or a pinned one does not change what every other case sees.
 */
function withProjects(
    fields: Record<Id, Partial<Project>>,
    view = 'projects',
    state: Partial<BoardState> = {}
): string {
    const snap = snapshot();
    for (const [id, held] of Object.entries(fields)) {
        snap.entities.projects[id] = { ...snap.entities.projects[id], ...held };
    }
    receive({ channel: 'portfolio', version: 1, payload: snap });
    const body = html(view, state);
    receive({ channel: 'portfolio', version: 1, payload: snapshot() });
    return body;
}

describe('the board', () => {
    it('draws one card per project of its own tiers', () => {
        expect(cards(html('projects'))).toBe(2);
        expect(cards(html('archive'))).toBe(1);
        expect(cards(html('coauthor'))).toBe(1);
    });

    // Revert: drop the `files` control from the actions of views/shared/ProjectCard.svelte.
    it("offers Show in Files on every card, beside the folder's Finder control", () => {
        const body = html('projects');
        const shows = body.split('data-action="files"').length - 1;
        expect(shows).toBe(cards(body));
        expect(body).toContain(`aria-label="${catalog['project.helper.show_in_files']}"`);
        expect(body.indexOf('data-action="folder"')).toBeLessThan(
            body.indexOf('data-action="files"')
        );
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
    let body: string;
    beforeEach(() => {
        body = html('projects');
    });

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
        expect(body).toContain(catalog['sessions.card_n'].replace('{0}', '2'));
        expect(body).toContain(catalog['sessions.card_live'].replace('{0}', '1'));
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
        expect(body).toContain(catalog['project.card.hpc_label']);
        expect(body).toContain(catalog['project.card.local_label']);
    });

    it('draws the funding, pillar, dataset and collaborator tags', () => {
        expect(body).toContain('ZonMw-AI-HCC');
        expect(body).toContain('Federated learning');
        expect(body).toContain('>mimic</span>');
        expect(body).toContain('Someone Else');
    });

    it('draws the eli5 and the first sentence of next, and no more of it', () => {
        expect(body).toContain(catalog['project.card.eli5']);
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

    // The title button opens the project as its own tab.
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
    let closed: string;
    let open: string;

    beforeEach(() => {
        closed = html('projects');
        open = html('projects', { expanded: ['alpha'] });
    });

    it('adds the status line and the labelled fields', () => {
        expect(open).toContain('submit-ready, 16 pp');
        for (const key of [
            'project.card.latest',
            'project.card.results',
            'project.card.outcome',
            'project.card.next',
            'project.card.ideas',
            'project.card.reproduced'
        ]) {
            expect(open).toContain(catalog[key]);
        }
        expect(open).toContain('the latest thing');
        expect(open).toContain('the first result');
        expect(open).toContain('an avenue');
        expect(open).toContain('2026-08-02 | needs a cluster');
    });

    it('adds the project documents, present and absent', () => {
        expect(open).toContain(catalog['project.card.documents']);
        expect(open).toContain('>README</span>');
        expect(open).toContain('>TEX</span>');
        expect(open).not.toMatch(/class="label">README\.md<\/span>/);
    });

    it('adds none of it to a card that is not open', () => {
        expect(closed).not.toContain('the latest thing');
        expect(closed).not.toContain('submit-ready, 16 pp');
    });
});

describe('a long description', () => {
    it('is cut to its clamp until the instance holds the card open', () => {
        const cut = html('projects');
        expect(cut).toContain('data-clamp="cut"');
        expect(cut).not.toContain('data-clamp="open"');
        const open = html('projects', { more: ['alpha'] });
        expect(open).toContain('data-clamp="open"');
        expect(open).not.toContain('data-clamp="cut"');
    });

    it('draws no control on a server rendering, which measures no text', () => {
        // Whether the text is longer than the clamp is measured in the page, and the control is
        // drawn only then: tests/browser/cards.spec.ts. The rule itself is card-layout.test.ts.
        expect(html('projects')).not.toContain(catalog['project.card.show_more']);
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

    it('draws the status column as one icon per status, not as characters', () => {
        // The two projects of this board carry one status chip each, so each row's status cell
        // holds exactly one mark and no other cell holds a drawing at all.
        const marks = ['lead', 'revision'].map((chip) => chipGlyphName(chip));
        expect(marks.filter((name) => name === '')).toEqual([]);
        setIcons(iconSet(config));
        try {
            const body = html('projects', { mode: 'list' });
            const drawn = [...body.matchAll(/<td[^>]*>((?:(?!<\/td>)[\s\S])*)<\/td>/g)]
                .map((found) => found[1])
                .filter((cell) => cell.includes('<svg'));
            expect(drawn).toHaveLength(2);
            for (const cell of drawn) expect(cell.match(/<svg/g)).toHaveLength(1);
            for (const name of marks) {
                expect(body).not.toContain(glyphCatalog(config)[name]);
            }
            // Each mark is drawn in its own status's hue with its words as the title, so the
            // column reads as the coloured dots did.
            for (const chip of ['lead', 'revision']) {
                expect(body).toContain(`--mark: var(--c-${statusMarkTone(chip)}-txt)`);
                expect(body).toContain(`title="${chipLabel(chip)}"`);
            }
        } finally {
            setIcons({});
        }
    });
});

describe('the facets', () => {
    let body: string;
    beforeEach(() => {
        body = html('projects');
    });

    // A menu's groups are drawn when it opens, which needs a DOM: what the groups hold is
    // tests/state/board-filter-menu.test.ts over filterGroups, and the menu opening and filtering
    // is tests/browser/cards.spec.ts. What is checked here is the one control and its count.
    it('offers one filter control in the toolbar and no menu per facet', () => {
        const opener = /<button[^>]*aria-haspopup="menu"[^>]*aria-label="([^"]*)"/g;
        const labels = [...body.matchAll(opener)].map((one) => one[1]);
        expect(labels.filter((one) => one === catalog['board.filter'])).toHaveLength(1);
        for (const facet of ['status', 'compute', 'dataset', 'sessions']) {
            expect(labels).not.toContain(catalog[`board.facet_${facet}`]);
        }
        expect(body).not.toContain('class="filters');
    });

    it('counts the values in force on the control', () => {
        const held = html('projects', { filters: { compute: ['hpc', 'local'], status: ['lead'] } });
        expect(held).toContain(`aria-label="${words('board.filter_count', '3')}"`);
        expect(held).not.toContain(`aria-label="${catalog['board.filter']}"`);
    });

    it('narrows the board to the project being worked on', () => {
        // Alpha has a live session, bravo has none, and no project is `recent`.
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

describe('the stats strip', () => {
    it('counts the board, the submit-ready chip, the blocked lane and the dated projects', () => {
        const body = withProjects({
            alpha: { chips: ['submit-ready'] },
            bravo: { focus: 'blocked' }
        });

        expect(body).toContain(words('board.stat_active', '2'));
        expect(body).toContain(words('board.stat_submit_ready', '1'));
        expect(body).toContain(words('board.stat_blocked', '1'));
        expect(body).toContain(words('board.stat_dated', '2'));
    });

    it('shows the venue the board aims at, by its catalogued short name', () => {
        const body = html('projects');
        expect(body).toContain(catalog['board.stat_venues_tip']);
        expect(body).toContain('>BSPC</span>');
    });

    it('is not drawn on the archive board or the coauthor board', () => {
        expect(html('archive')).not.toContain(catalog['board.stat_venues_tip']);
        expect(html('coauthor')).not.toContain(catalog['board.stat_venues_tip']);
    });
});

describe('the controls beside the search', () => {
    it('offers the new idea control on every board', () => {
        for (const view of ['projects', 'archive', 'coauthor']) {
            expect(html(view)).toContain(catalog['board.new_idea']);
        }
        // The form itself opens on a click, which needs a DOM; it is a browser check.
    });

    it('offers the two quick filters on the projects board and on no other', () => {
        expect(html('projects')).toContain(catalog['board.quick_stale']);
        expect(html('projects')).toContain(catalog['board.quick_deadline']);
        expect(html('archive')).not.toContain(catalog['board.quick_stale']);
    });

    it('leaves only what is behind its documents when the stale filter is on', () => {
        expect(cards(withProjects({ alpha: { staleDays: 3 } }, 'projects', { stale: true }))).toBe(
            1
        );
        expect(cards(html('projects', { stale: true }))).toBe(0);
    });

    it('leaves only what carries a deadline when the deadline filter is on', () => {
        const body = withProjects({ bravo: { deadline: undefined } }, 'projects', { dated: true });
        expect(cards(body)).toBe(1);
        expect(cards(html('projects', { dated: true }))).toBe(2);
    });

    it('draws one toggle per type with its count, and hides the types switched off', () => {
        const body = html('projects');
        expect(body).toContain('active 1');
        expect(body).toContain('manuscript 1');
        expect(cards(html('projects', { hiddenTypes: ['manuscript'] }))).toBe(1);
        expect(cards(html('projects', { hiddenTypes: ['manuscript', 'active'] }))).toBe(0);
    });

    it('offers the two bulk controls', () => {
        expect(html('projects')).toContain(catalog['board.expand_all']);
        expect(html('projects')).toContain(catalog['board.collapse']);
    });
});

describe('the card controls', () => {
    it('offers the pin control, and marks a card that is pinned', () => {
        expect(html('projects')).toContain(catalog['project.card.pin_to_top']);
        const pinned = withProjects({ alpha: { pin: true } });
        expect(pinned).toContain(catalog['project.card.unpin']);
        expect(pinned).toMatch(/class="card[^"]*pinned"/);
    });

    it('draws the stale badge with the days the manifest is behind', () => {
        const body = withProjects({
            alpha: {
                staleDays: 3,
                docs: [
                    {
                        name: 'README.md',
                        label: 'README',
                        present: true,
                        human: false,
                        mtime: 1
                    }
                ]
            }
        });
        expect(body).toContain(words('project.card.stale_behind', '3'));
        expect(html('projects')).not.toContain(words('project.card.stale_behind', '3'));
    });

    it('draws the waiting line by precedence and offers copy-context and folder controls', () => {
        const body = withProjects({
            alpha: { waitingOn: ['someone'], chips: ['submitted', 'blocked'] }
        });
        expect(body).toMatch(/class="waiting [^"]*people/);
        expect(body).toContain('waiting on Someone Else');
        expect(body).toContain(catalog['project.helper.copy_context']);
        expect(body).toContain(catalog['project.helper.folder']);
    });

    it('offers Ask on a project with a manifest', () => {
        expect(html('projects')).toContain(`aria-label="${catalog['project.helper.ask']}"`);
        expect(html('projects')).toContain(catalog['project.helper.ask_tip']);
    });

    it('labels document controls and marks only a human document', () => {
        const body = withProjects(
            {
                alpha: {
                    docs: [
                        { name: 'README.md', label: 'README', present: true, human: false },
                        { name: 'code/README.md', label: 'CODE', present: true, human: false },
                        { name: 'NOTES.md', label: 'NOTES', present: true, human: true }
                    ]
                }
            },
            'projects',
            { expanded: ['alpha'] }
        );
        expect(body).toMatch(/class="doc [^"]*human/);
        expect(body).toContain(catalog['project.helper.doc_human_tip']);
        expect(body).toContain('>README</span>');
        expect(body).toContain('>CODE</span>');
    });

    it('draws a ghost badge and message without manifest or pin controls', () => {
        const snap = snapshot();
        snap.entities.projects = {
            ghost: project('ghost', 'ideas', {
                type: 'idea',
                ghost: true,
                docs: [{ name: 'README.md', label: 'README', present: true, human: false }]
            })
        };
        receive({ channel: 'portfolio', version: 1, payload: snap });
        const body = html('projects');
        receive({ channel: 'portfolio', version: 1, payload: snapshot() });
        expect(body).toContain(catalog['project.card.no_manifest']);
        expect(body).toContain('No manifest yet');
        expect(body).not.toContain(catalog['project.card.pin_to_top']);
        expect(body).not.toContain(catalog['project.card.edit_manifest']);
        expect(body).not.toContain(catalog['project.helper.ask_tip']);
        expect(body).not.toContain(`aria-label="${catalog['project.helper.ask']}"`);
        expect(body).toContain(catalog['project.helper.copy_context']);
        expect(body).toContain(catalog['project.helper.folder']);
    });
});

describe('the subtasks block', () => {
    let body: string;

    beforeEach(() => {
        body = withProjects(
            {
                alpha: {
                    subtasks: [
                        { key: '0', do: 'redraw figure 2', deadline: '2026-10-01', done: false },
                        { key: '1', do: 'add the funding line', done: true }
                    ]
                }
            },
            'projects',
            { expanded: ['alpha'] }
        );
    });

    it('draws the lines with the open count', () => {
        expect(body).toContain(catalog['project.action.subtasks']);
        expect(body).toContain(words('project.action.n_open', '1'));
        expect(body).toContain('redraw figure 2');
        expect(body).toContain('2026-10-01');
    });

    it('draws done, the snoozes and del on an open line, and reopen on a done one', () => {
        for (const key of [
            'project.action.done',
            'project.action.snooze_1w',
            'project.action.snooze_1mo',
            'project.action.snooze_hide',
            'project.action.del',
            'project.action.reopen',
            'project.action.add_subtask'
        ]) {
            expect(body).toContain(catalog[key]);
        }
    });

    it('offers reopen on the done line itself, and done only on the open one', () => {
        const lines = body.split('<div class="line').slice(1);
        const done = lines.filter((line) => line.slice(0, line.indexOf('>')).includes('done'));
        const open = lines.filter((line) => !line.slice(0, line.indexOf('>')).includes('done'));
        expect(done).not.toHaveLength(0);
        expect(open).not.toHaveLength(0);
        for (const line of done) {
            expect(line).toContain(catalog['project.action.reopen']);
            expect(line).not.toContain(catalog['project.action.mark_done']);
        }
        for (const line of open) {
            expect(line).toContain(catalog['project.action.mark_done']);
            expect(line).not.toContain(catalog['project.action.reopen']);
        }
    });

    it('offers no add-subtask control among the card controls of a card that has subtasks', () => {
        const actions = body.slice(
            body.indexOf('data-card-actions'),
            body.indexOf('class="folder')
        );
        expect(actions).not.toContain(catalog['project.action.add_subtask']);
    });
});

describe('a card with no subtasks', () => {
    it('draws no subtasks block, open or closed', () => {
        for (const state of [{}, { expanded: ['alpha', 'bravo'] }]) {
            const body = html('projects', state);
            expect(body).not.toContain('class="subtasks');
            expect(body).not.toContain(catalog['project.action.subtasks']);
            expect(body).not.toContain(words('project.action.n_open', '0'));
        }
    });

    it('offers adding the first subtask as one of the card controls', () => {
        const body = html('projects');
        const first = body.split('<article class="card')[1];
        const actions = first.slice(
            first.indexOf('data-card-actions'),
            first.indexOf('class="folder')
        );
        expect(actions).toContain(`aria-label="${catalog['project.action.add_subtask']}"`);
    });
});

describe('the file finder', () => {
    /** What the endpoint answers, with a row in megabytes, one in kilobytes, and a cap. */
    const answer = {
        rows: [
            { path: 'code/run.py', size: 38400, mtime: 2 },
            { path: 'manuscript/main.pdf', size: 2097152, mtime: 1 }
        ],
        truncated: true,
        folder: 'projects/active/alpha'
    };

    it('draws the heading, the filter box, the rows and the cap once they are held', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(
                    new Response(JSON.stringify(answer), {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    })
                )
            )
        );
        // A new version on the `files` channel is what makes the store ask again: an earlier case in
        // this file opened the same card with no stub in place, and what is held is held per version.
        receive({ channel: 'files', version: 2, payload: { root: '/hub' } });
        // The first rendering asks for the listing, the second draws what the answer left held.
        html('projects', { expanded: ['alpha'] });
        await new Promise((resolve) => setTimeout(resolve, 0));
        const body = html('projects', { expanded: ['alpha'] });
        vi.unstubAllGlobals();

        expect(body).toContain(words('project.card.files_hdr', '2'));
        expect(body).toContain(catalog['project.card.files_ph']);
        expect(body).toContain('run.py');
        expect(body).toContain('37 KB');
        expect(body).toContain('2.0 MB');
        expect(body).toContain(words('project.card.files_capped', '2'));
    });

    it('asks for nothing on a card that is not open', () => {
        const asked = vi.fn();
        vi.stubGlobal('fetch', asked);
        receive({ channel: 'portfolio', version: 3, payload: snapshot() });
        html('projects');
        vi.unstubAllGlobals();

        expect(asked).not.toHaveBeenCalled();
    });
});
