// One project as its own tab, rendered to HTML on the server: the card the board draws, the segment
// over the documents the project has, and the sessions working in its folder.
//
// The catalog, the glyphs and the vocabulary are the real config; the project and the sessions are
// synthetic. What this does NOT cover: the document itself. There is no fetch in this suite, so
// state/system/docs.svelte.ts leaves the pair pending and the tab renders its loading line; what
// api/docs answers is covered by tests/routes/docs/docs.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_FEEDS } from '../../fixtures/entities-fixture.ts';
import { render } from 'svelte/server';
import Project from '../../../src/lib/views/boards/project/Project.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { area, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import type {
    Id,
    PresentSlide,
    Project as Record_,
    Relations,
    Snapshot
} from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

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

const INSTANCE = 'project-one';
const FOLDER = '/hub/projects/manuscripts/alpha';

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

/** One project, with two of its Markdown documents present and two of them not. */
function project(): Record_ {
    return {
        id: 'alpha',
        tier: 'manuscripts',
        ghost: false,
        type: 'manuscript',
        title: 'Alpha, the whole title',
        chips: ['lead'],
        statusLine: 'submit-ready, 16 pp',
        focus: 'run',
        next: 'Run the sweep.',
        results: ['the first result'],
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
        docs: [
            { name: 'README.md', label: 'README', present: true, human: false },
            { name: 'code/README.md', label: 'CODE', present: true, human: false },
            { name: 'manuscript/main.pdf', label: 'PDF', present: true, human: false },
            { name: 'manuscript/main.tex', label: 'TEX', present: false, human: false }
        ],
        folder: 'projects/manuscripts/alpha',
        file: `${FOLDER}/project.yml`,
        // Nine days behind its documents, against the `stale_lag_days: 1` of config/behavior.yml,
        // so the card the tab draws carries the stale badge.
        staleDays: 9
    };
}

/** The one slide a project with a PRESENT.md carries, whatever else that file declares. */
const SLIDE: PresentSlide = {
    id: 'alpha',
    projectId: 'alpha',
    title: 'A headline for the slide',
    specs: [],
    panels: [],
    method: [],
    results: []
};

function snapshot(over: Partial<Record_> = {}): Snapshot {
    const byId: Record<Id, Record_> = { alpha: { ...project(), ...over } };
    return {
        version: 1,
        entities: {
            feeds: NO_FEEDS,
            career: null,
            projects: byId,
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            people: {},
            organisations: {},
            collections: {}
        },
        relations: EMPTY_RELATIONS,
        findings: []
    };
}

/** What every case here starts from, installed into the case's own client. */
function installFixture(over: Partial<Record_> = {}): void {
    receive({ channel: 'portfolio', version: 1, payload: snapshot(over) });
    receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });
    receive({
        channel: 'sessions',
        version: 1,
        payload: payload([
            workspace('/hub', [
                area(FOLDER, [record('in-alpha', { title: 'A session in alpha', area: FOLDER })]),
                area('/hub/other', [record('elsewhere', { area: '/hub/other', cwd: '/hub/other' })])
            ])
        ])
    });
}

/** The tab rendered for one project id, with whatever the instance remembers. */
function html(id: string, state: Record<string, unknown> = {}): string {
    setInstanceState(INSTANCE, state);
    const instance: Instance = { id: INSTANCE, view: 'project', state: { id } };
    return render(Project, { context: clientContext(client), props: { instance } }).body;
}

describe('a project as its own tab', () => {
    let body: string;
    beforeEach(() => {
        body = html('alpha');
    });

    it('draws the card of the board, opened out', () => {
        expect(body).toContain('<article class="card');
        expect(body).toContain('Alpha, the whole title');
        expect(body).toContain('projects/manuscripts/alpha');
        // The block an open card adds: the status line and the results the board hides when shut.
        expect(body).toContain('submit-ready, 16 pp');
        expect(body).toContain('the first result');
    });

    // Revert: drop the `files` control from the actions of views/shared/card/ProjectCard.svelte.
    it("offers Show in Files for the project's folder on the card", () => {
        expect(body).toContain('data-action="files"');
        expect(body).toContain(`aria-label="${catalog['project.helper.show_in_files']}"`);
        expect(body).toContain(catalog['project.helper.show_in_files_tip']);
    });

    it('offers the manifest editor and the deposit on the card', () => {
        expect(body).toContain(catalog['project.card.edit_manifest']);
        expect(body).toContain(catalog['project.card.deposit']);
    });

    // The shared card brings its pin, stale badge and subtasks block into the project tab.
    it('offers the pin control on the card', () => {
        expect(body).toContain(catalog['project.card.pin_to_top']);
    });

    it('marks the manifest as behind its documents', () => {
        expect(body).toContain(catalog['project.card.stale_behind'].replace('{0}', '9'));
    });

    it('draws no subtasks block for a project with none, and offers adding the first on the card', () => {
        // the project has no subtasks, so the block is not drawn
        expect(body).not.toContain('class="subtasks');
        // and with no block there is no subtasks heading to name it
        expect(body).not.toContain(catalog['project.action.subtasks']);
        expect(body).toContain(`aria-label="${catalog['project.action.add_subtask']}"`);
    });

    it('draws the subtasks block for a project that has subtasks', () => {
        receive({
            channel: 'portfolio',
            version: 2,
            payload: snapshot({ subtasks: [{ key: '0', do: 'redraw figure 2', done: false }] })
        });
        const held = html('alpha');
        expect(held).toContain(catalog['project.action.subtasks']);
        expect(held).toContain('redraw figure 2');
    });

    it('draws the documents once: the tab lists them and the card does not', () => {
        const headings = body.split(`>${catalog['project.documents']}</`).length - 1;
        expect(headings).toBe(1);
        expect(body).toContain(`<h3 class="heading`);
    });

    it('draws a known document the project has not got as the tag the card draws for it', () => {
        // revert: src/lib/views/boards/project/Project.svelte:129 => const absent = $derived([]);
        const section = body.slice(body.indexOf(`>${catalog['project.documents']}</`));
        expect(section).toContain('data-absent-docs');
        expect(body.split('>TEX</span>').length - 1).toBe(1);
    });

    it('offers the Markdown documents the project has, and no others', () => {
        const group = segment(body);
        expect(body).toContain(catalog['project.documents']);
        expect(group).toContain('>README.md</span>');
        expect(group).toContain('>code/README.md</span>');
        // The PDF is not a document this tab renders, and the LaTeX source is not there.
        expect(group).not.toContain('>manuscript/main.pdf</span>');
        // the LaTeX source is not a document this tab renders either
        expect(group).not.toContain('>manuscript/main.tex</span>');
    });

    it('offers no PRESENT.md and no deck control for a project that has no slide', () => {
        // the project has no slide, so there is no deck file to offer
        expect(segment(body)).not.toContain('>PRESENT.md</span>');
        // and no deck control on the card either
        expect(body).not.toContain(catalog['project.card.present']);
    });

    it('offers PRESENT.md after the four, and the deck control, for a project with a slide', () => {
        installFixture({ present: [SLIDE] });
        const drawn = html('alpha');
        const group = segment(drawn);
        expect(group).toContain('>PRESENT.md</span>');
        // It joins the documents rather than replacing them, and the tab still opens on the README.
        expect(group).toContain('>README.md</span>');
        expect(chosen(drawn)).toBe('README.md');
        expect(drawn).toContain(catalog['project.card.present']);
        expect(drawn).toContain(catalog['project.card.present_tip']);
    });

    it('draws the PRESENT.md the tab was left showing', () => {
        installFixture({ present: [SLIDE] });
        expect(chosen(html('alpha', { id: 'alpha', doc: 'PRESENT.md' }))).toBe('PRESENT.md');
    });

    it('waits for the chosen document rather than drawing an empty one', () => {
        expect(body).toContain(catalog['project.doc_loading']);
    });

    it('draws the sessions working in the project folder, and no others', () => {
        expect(body).toContain(catalog['project.sessions']);
        expect(body).toContain('A session in alpha');
        // the sessions drawn are the ones working in this project's folder, and that one works in
        // another
        expect(body).not.toContain('elsewhere');
    });

    it('starts on the first document the project has', () => {
        expect(chosen(body)).toBe('README.md');
    });

    it('keeps showing the document the tab was left on', () => {
        expect(chosen(html('alpha', { id: 'alpha', doc: 'code/README.md' }))).toBe(
            'code/README.md'
        );
    });

    it('falls back to the first document when the one it remembers is gone', () => {
        expect(chosen(html('alpha', { id: 'alpha', doc: 'NOTES.md' }))).toBe('README.md');
    });

    it('says so when it was opened for no project, and for one the snapshot does not hold', () => {
        expect(html('')).toContain(catalog['project.none']);
        expect(html('nobody')).toContain('nobody');
        expect(cards(html('nobody'))).toBe(0);
    });
});

/** How many cards a rendering drew. */
function cards(body: string): number {
    return body.split('<article class="card').length - 1;
}

/** The document chooser alone, which is the one radiogroup the tab draws. */
function segment(body: string): string {
    const at = body.indexOf('role="radiogroup"');
    expect(at).toBeGreaterThan(0);
    return body.slice(at, body.indexOf('</section>', at));
}

/** The name on the chosen radio of that group. */
function chosen(body: string): string {
    const found = /aria-checked="true"[\s\S]*?<span class="label">([^<]+)</.exec(segment(body));
    return found === null ? '' : found[1];
}

// The LaTeX panel. The rows come from api/latex, so this is the one block of the file with a fetch
// stub: the first render asks, and the second draws what came back.
describe('the LaTeX panel of a project tab', () => {
    /** One main file with a PDF and two errors, and one that has never been built. */
    const MAINS = [
        {
            main: 'main.tex',
            pdfPath: 'manuscript/main.pdf',
            pdf: 1757500000000,
            log: 1757500000000,
            errors: [
                { file: 'main.tex', line: 12, message: 'Undefined control sequence.' },
                { file: 'intro.tex', line: 4, message: 'Missing $ inserted.' }
            ],
            warnings: [{ file: '', line: 31, message: 'LaTeX: There were undefined references.' }]
        },
        {
            main: 'supplement.tex',
            pdfPath: 'manuscript/supplement.pdf',
            pdf: null,
            log: null,
            errors: [],
            warnings: []
        }
    ];

    /** Install a stub answering with the mains given, for the whole of one case. */
    function answering(mains: unknown[]): void {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ folder: 'projects/manuscripts/alpha', mains }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );
    }

    /** The tab once the answer has landed: the first render asks and the second draws. */
    async function settled(): Promise<string> {
        html('alpha');
        await new Promise((resolve) => setTimeout(resolve, 0));
        return html('alpha');
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('draws one row per main file, with its PDF time and its error count', async () => {
        answering(MAINS);
        const body = await settled();

        expect(body).toContain(catalog['project.latex.heading']);
        expect(body).toContain('data-main="main.tex"');
        expect(body).toContain('data-main="supplement.tex"');
        expect(row(body, 'main.tex')).toContain(catalog['project.latex.errors']);
        expect(row(body, 'main.tex')).toContain('>2</strong>');
        expect(row(body, 'main.tex')).toContain(
            catalog['project.latex.warnings'].replace('{0}', '1')
        );
        expect(row(body, 'supplement.tex')).toContain(catalog['project.latex.no_pdf']);
        // this main file has no log yet, so there is no error count on its row
        expect(row(body, 'supplement.tex')).not.toContain(catalog['project.latex.errors']);
    });

    it('offers a build and a clean on every row, and the PDF only where there is one', async () => {
        answering(MAINS);
        const body = await settled();

        expect(row(body, 'main.tex')).toContain(catalog['project.latex.build']);
        expect(row(body, 'main.tex')).toContain(catalog['project.latex.clean']);
        expect(row(body, 'main.tex')).toContain(catalog['project.latex.open_pdf_tip']);
        expect(row(body, 'supplement.tex')).toContain(catalog['project.latex.build']);
        // this main file has no PDF built, so there is nothing to open
        expect(row(body, 'supplement.tex')).not.toContain(catalog['project.latex.open_pdf_tip']);
    });

    it('keeps the errors behind their count until the disclosure is opened', async () => {
        answering(MAINS);
        const body = await settled();

        // the errors sit behind their count until the disclosure is opened
        expect(body).not.toContain('Undefined control sequence.');
    });

    it('draws no panel at all for a project whose folder holds no main file', async () => {
        answering([]);
        const body = await settled();

        // the folder holds no main file, so the panel is not drawn at all
        expect(body).not.toContain(catalog['project.latex.heading']);
        // and no row of it either
        expect(body).not.toContain('data-latex=');
    });
});

/** The markup of one main file's row alone. */
function row(body: string, main: string): string {
    const at = body.indexOf(`data-main="${main}"`);
    expect(at).toBeGreaterThan(0);
    const next = body.indexOf('data-main="', at + 1);
    return body.slice(at, next === -1 ? undefined : next);
}

describe('a software project and the paper it names', () => {
    /** A library on the software tier, its `related:` naming the paper of the fixture. */
    function kit(): Record_ {
        return {
            ...project(),
            id: 'kit',
            tier: 'software',
            type: 'software',
            title: 'Kit, the toolkit',
            short: 'Kit',
            docs: [],
            relatedIds: ['alpha'],
            folder: 'projects/software/kit',
            file: '/hub/projects/software/kit/project.yml'
        };
    }

    /** The two projects and the one related edge between them, as the portfolio carries them. */
    function installPair(): void {
        const both = snapshot();
        both.entities.projects.kit = kit();
        both.relations = { ...EMPTY_RELATIONS, projectRelated: [['kit', 'alpha']] };
        receive({ channel: 'portfolio', version: 2, payload: both });
    }

    beforeEach(() => {
        installPair();
    });

    it('draws the card of a project no board holds', () => {
        const body = html('kit');
        expect(body).toContain('<article class="card');
        expect(body).toContain('Kit, the toolkit');
        expect(body).toContain('projects/software/kit');
    });

    it("names the papers on the software's own tab", () => {
        const body = html('kit');
        expect(body).toContain(catalog['project.card.software_papers']);
        expect(body).toContain('Alpha, the whole title');
        // this is the software's own tab, so it names the papers rather than the software of a
        // paper
        expect(body).not.toContain(catalog['project.card.software']);
    });

    it("names the software on the paper's own tab", () => {
        const body = html('alpha');
        expect(body).toContain(catalog['project.card.software']);
        expect(body).toContain('>Kit<');
    });
});
