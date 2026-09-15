// One project as its own tab, rendered to HTML on the server: the card the board draws, the segment
// over the documents the project has, and the sessions working in its folder.
//
// The catalog, the glyphs and the vocabulary are the real config; the project and the sessions are
// synthetic. What this does NOT cover: the document itself. There is no fetch in this suite, so
// state/docs.svelte.ts leaves the pair pending and the tab renders its loading line; what api/docs
// answers is covered by tests/routes/docs.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import { render } from 'svelte/server';
import Project from '../../src/lib/views/Project.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { area, payload, record, workspace } from '../sessions-fixture.ts';
import type {
    Id,
    PresentSlide,
    Project as Record_,
    Relations,
    Snapshot
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

const INSTANCE = 'project-one';
const FOLDER = '/hub/projects/manuscripts/alpha';

const EMPTY_RELATIONS: Relations = {
    projectVenue: [],
    projectFunding: [],
    projectDataset: [],
    projectProgram: [],
    projectDomain: [],
    projectRelated: [],
    fundingProgram: []
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
        programIds: [],
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
            programs: {},
            domains: {},
            funding: {},
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

    it('draws the subtasks block', () => {
        expect(body).toContain(catalog['project.action.subtasks']);
        expect(body).toContain(catalog['project.action.add_subtask']);
    });

    it('offers the Markdown documents the project has, and no others', () => {
        const group = segment(body);
        expect(body).toContain(catalog['project.documents']);
        expect(group).toContain('>README.md</span>');
        expect(group).toContain('>code/README.md</span>');
        // The PDF is not a document this tab renders, and the LaTeX source is not there. Both are
        // still on the card's own row of four, which reports presence and offers nothing.
        expect(group).not.toContain('>manuscript/main.pdf</span>');
        expect(group).not.toContain('>manuscript/main.tex</span>');
    });

    it('offers no PRESENT.md and no deck control for a project that has no slide', () => {
        expect(segment(body)).not.toContain('>PRESENT.md</span>');
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
