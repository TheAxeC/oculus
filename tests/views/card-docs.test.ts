// Layer 4, view test. The file list of an opened project card, rendered to HTML on the server: which
// row opens in the document view, which is a link the browser opens, and which is handed to its
// program on this machine.
//
// The catalog and the glyphs are the real config; the listing is a stubbed api/project-files answer.
// What this does NOT cover: the press itself and the sentence a refused open leaves on the board,
// which need a DOM; tests/routes/open.test.ts holds what the client posts and the server answers.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardDocs from '../../src/lib/views/shared/CardDocs.svelte';
import type { BoardItem } from '../../src/lib/state/board/index.ts';
import type { Project } from '../../src/lib/data/model.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);

const FOLDER = 'projects/active/one';

/** The files the stubbed listing answers with, one of each way a row opens. */
const ROWS = [
    'drafts/report.docx',
    'budget.xlsx',
    'notes.md',
    'figures/plot.png',
    'paper.pdf',
    'dist/setup.pkg',
    'logs/run.log'
];

function project(): Project {
    return {
        id: 'one',
        title: 'One',
        tier: 'active',
        ghost: false,
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
        folder: FOLDER,
        file: `${FOLDER}/project.yml`
    };
}

function item(): BoardItem {
    return {
        id: 'one',
        project: project(),
        tone: 'teal',
        domain: null,
        venue: null,
        pillars: [],
        funding: [],
        datasets: [],
        collaborators: [],
        software: [],
        authors: '',
        bucket: '',
        code: 'public',
        compute: 'hpc',
        reproduced: true,
        year: '',
        sessions: 'none',
        chips: [],
        haystack: ''
    };
}

let client: ClientState;

beforeEach(async () => {
    vi.stubGlobal('fetch', () =>
        Promise.resolve(
            new Response(
                JSON.stringify({
                    rows: ROWS.map((path) => ({ path, size: 1024, mtime: 1 })),
                    truncated: false,
                    folder: FOLDER
                }),
                { status: 200, headers: { 'content-type': 'application/json' } }
            )
        )
    );
    client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    client.files.files('one');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(client.files.files('one').rows.length).toBe(ROWS.length);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/** The rows of the rendered list, keyed by the file's name, on the case's client or another. */
function rows(holder: ClientState = client): Record<string, string> {
    const body = render(CardDocs, {
        context: clientContext(holder),
        props: { item: item(), onsaid: noop }
    }).body;
    const found: Record<string, string> = {};
    for (const one of body.split('<div class="frow').slice(1)) {
        const name = ROWS.map((path) => path.split('/').at(-1) ?? path).find((each) =>
            one.includes(`>${each}<`)
        );
        if (name !== undefined) found[name] = one;
    }
    expect(Object.keys(found).sort()).toEqual(
        [
            'budget.xlsx',
            'notes.md',
            'paper.pdf',
            'plot.png',
            'report.docx',
            'setup.pkg',
            'run.log'
        ].sort()
    );
    return found;
}

describe('the file list of a project card', () => {
    it('draws a .docx and an .xlsx as the ui/ToolButton that opens them in their program', () => {
        const found = rows();
        for (const name of ['report.docx', 'budget.xlsx']) {
            expect(found[name]).toContain('<button type="button" class="tool');
            expect(found[name]).toContain(catalog['file.open_program']);
            expect(found[name]).toContain(glyphs[catalog['file.open_program_glyph']]);
            expect(found[name]).not.toContain('<a ');
        }
    });

    it('draws a .md as the ui/ToolButton that opens the document view, and not the program control', () => {
        const row = rows()['notes.md'];
        expect(row).toContain('<button type="button" class="tool');
        expect(row).not.toContain(catalog['file.open_program']);
        expect(row).not.toContain('<a ');
    });

    it('keeps a picture and a PDF a link to the file route, as before', () => {
        const found = rows();
        expect(found['plot.png']).toContain(`href="/api/file/hub/${FOLDER}/figures/plot.png"`);
        expect(found['paper.pdf']).toContain(`href="/api/file/hub/${FOLDER}/paper.pdf"`);
        for (const name of ['plot.png', 'paper.pdf']) {
            expect(found[name]).not.toContain('<button');
            expect(found[name]).not.toContain(catalog['file.open_program']);
        }
    });

    it('keeps a file off the list, an installer and a log, a link with no program control', () => {
        const found = rows();
        expect(found['setup.pkg']).toContain(`href="/api/file/hub/${FOLDER}/dist/setup.pkg"`);
        expect(found['run.log']).toContain(`href="/api/file/hub/${FOLDER}/logs/run.log"`);
        for (const name of ['setup.pkg', 'run.log']) {
            expect(found[name]).not.toContain('<button');
            expect(found[name]).not.toContain(catalog['file.open_program']);
        }
    });

    it('reads the list from the configuration the page holds: one naming .log offers the log', () => {
        client.entities.receive({
            channel: 'config',
            version: 2,
            payload: {
                config: { ...config, open: { program_ext: { '.log': 'com.apple.Console' } } },
                text: catalog,
                findings: []
            }
        });
        const found = rows();
        expect(found['run.log']).toContain(catalog['file.open_program']);
        expect(found['report.docx']).not.toContain(catalog['file.open_program']);
        expect(found['report.docx']).toContain(`href="/api/file/hub/${FOLDER}/drafts/report.docx"`);
    });

    it('draws no program control before the configuration has arrived', async () => {
        const early = createClientState();
        early.files.files('one');
        await new Promise((resolve) => setTimeout(resolve, 0));
        const found = rows(early);
        expect(found['report.docx']).not.toContain(catalog['file.open_program']);
        expect(found['report.docx']).toContain(`href="/api/file/hub/${FOLDER}/drafts/report.docx"`);
    });

    it('draws no raw button: every control of the list is ui/ToolButton', () => {
        for (const row of Object.values(rows())) {
            expect(row.split('<button').length).toBe(
                row.split('<button type="button" class="tool').length
            );
        }
    });
});
