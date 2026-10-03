// Layer 4, view test. The LaTeX view rendered over a fetch stub answering api/latex: one block per
// main file with its controls, the sentence for a folder with none, the cannot-read sentence with
// its retry for a folder that is gone, the tab named after the folder (the root when the path is
// empty), and the places the rows open.
//
// What this does NOT cover: pressing anything. The environment is node and the render is the
// server's, so the press handlers' choices (which file, which line) are the plain functions of
// views/shared/latex/places.ts, asserted here as calls, and the store calls behind the presses are
// tests/state/sessions/latex/'s.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Latex from '../../../src/lib/views/academic/latex/Latex.svelte';
import Outline from '../../../src/lib/views/shared/latex/Outline.svelte';
import {
    logFile,
    placeOf,
    problemFile,
    problemRows
} from '../../../src/lib/views/shared/latex/places.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, json, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

afterEach(() => vi.unstubAllGlobals());

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

/** One folder answer with two mains: one built with problems, one never built. */
const TWO_MAINS = {
    root: 'docs',
    path: 'proposal',
    mains: [
        {
            main: 'main.tex',
            program: 'xelatex',
            pdfPath: 'proposal/main.pdf',
            pdf: 1757500000000,
            log: 1757500000000,
            errors: [{ file: 'proposal/sec/b.tex', line: 12, message: 'Missing $ inserted.' }],
            warnings: [{ file: '', line: null, message: 'LaTeX: undefined references.' }]
        },
        {
            main: 'response.tex',
            program: 'pdflatex',
            pdfPath: 'proposal/response.pdf',
            pdf: null,
            log: null,
            errors: [],
            warnings: []
        }
    ]
};

/** The view rendered twice with the answer given for the folder: the first render asks. */
async function drawn(instanceState: Record<string, unknown>, answer: Response): Promise<string> {
    vi.stubGlobal('fetch', () => Promise.resolve(answer.clone()));
    const instance: Instance = { id: 'latex-one', view: 'latex', state: instanceState };
    const html = (): string =>
        render(Latex, { context: clientContext(client), props: { instance } }).body;
    html();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return html();
}

describe('the LaTeX view over a folder with two main files', () => {
    let body: string;
    beforeEach(async () => {
        body = await drawn({ root: 'docs', path: 'proposal' }, json(TWO_MAINS));
    });

    it('draws a block per main file with build, clean and the controls its state allows', () => {
        expect(body).toContain('data-main="main.tex"');
        expect(body).toContain('data-main="response.tex"');
        const built = body.slice(
            body.indexOf('data-main="main.tex"'),
            body.indexOf('data-main="response.tex"')
        );
        for (const key of ['build', 'clean', 'open_pdf', 'log', 'count', 'outline']) {
            expect(built).toContain(`>${catalog[`latex.${key}`]}<`);
        }
        const never = body.slice(body.indexOf('data-main="response.tex"'));
        expect(never).toContain(`>${catalog['latex.build']}<`);
        // A main file nothing has built has no PDF, so the control that opens one is not drawn.
        expect(never).not.toContain(`>${catalog['latex.open_pdf']}<`);
        // A main file nothing has built has no log file, so the control that opens it is not drawn.
        expect(never).not.toContain(`>${catalog['latex.log']}<`);
        expect(never).toContain(catalog['latex.no_pdf']);
    });

    it('says the problem count and the split of errors and warnings, and keeps the lists closed', () => {
        expect(body).toContain(
            catalog['latex.problem_counts'].replace('{0}', '1').replace('{1}', '1')
        );
        // The problem list stays closed until the disclosure is pressed, so no message is drawn.
        expect(body).not.toContain('Missing $ inserted.');
        expect(body).toContain('aria-expanded="false"');
    });

    it('names the program a main file builds with in its tooltip', () => {
        expect(body).toContain(catalog['latex.program'].replace('{0}', 'xelatex'));
    });

    it('draws no sentence for a folder that has main files', () => {
        // A folder that holds main files is not empty, so the empty-folder sentence is not drawn.
        expect(body).not.toContain(catalog['latex.none']);
        // The read succeeded, so the sentence that says the folder could not be read is not drawn.
        expect(body).not.toContain(catalog['latex.read_failed'].split('{0}')[0]);
    });
});

describe('the line a main file says while it is building', () => {
    /** The view over TWO_MAINS, with every terminal start left unanswered. */
    async function drawnWithBuild(start: boolean): Promise<string> {
        vi.stubGlobal('fetch', (url: string) =>
            url === '/api/terminal'
                ? new Promise<Response>(() => undefined)
                : Promise.resolve(json(TWO_MAINS))
        );
        const instance: Instance = {
            id: 'latex-one',
            view: 'latex',
            state: { root: 'docs', path: 'proposal' }
        };
        const html = (): string =>
            render(Latex, { context: clientContext(client), props: { instance } }).body;
        html();
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (start) {
            void client.latex.run({ root: 'docs', path: 'proposal' }, 'response.tex', 'build');
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        return html();
    }

    // Revert: leave the `{#if row.building}` line out of views/shared/latex/Main.svelte.
    it('draws the line beside the PDF time of the main file whose build is asked for, and of no other', async () => {
        const body = await drawnWithBuild(true);

        const never = body.slice(body.indexOf('data-main="response.tex"'));
        const built = body.slice(
            body.indexOf('data-main="main.tex"'),
            body.indexOf('data-main="response.tex"')
        );
        expect(never).toContain(`>${catalog['latex.building']}<`);
        // The other main file was never asked to build, so its row carries no such line.
        expect(built).not.toContain(`>${catalog['latex.building']}<`);
    });

    it('draws no line while nothing is building', async () => {
        const body = await drawnWithBuild(false);

        // No build was asked for, so no row says that one is under way.
        expect(body).not.toContain(`>${catalog['latex.building']}<`);
    });
});

describe('the outline of a main file with a file it did not read in full', () => {
    /** The shared outline drawn over the answer given, the first render asking for it. */
    async function outlined(
        target: { id: string } | { root: string; path: string },
        answer: unknown
    ) {
        vi.stubGlobal('fetch', () => Promise.resolve(json(answer)));
        const html = (): string =>
            render(Outline, {
                context: clientContext(client),
                props: { target, main: 'main.tex', root: 'hub' }
            }).body;
        html();
        await new Promise((resolve) => setTimeout(resolve, 0));
        return html();
    }

    // Revert: leave the `unread` line out of views/shared/latex/Outline.svelte.
    it('names a file past the size limit under the sections as not read, against the project folder', async () => {
        const body = await outlined(
            { id: 'alpha' },
            {
                sections: [{ level: 2, title: 'A', file: 'manuscript/main.tex', line: 2 }],
                unread: ['manuscript/huge.tex'],
                folder: 'projects/alpha'
            }
        );

        expect(body).toContain('>A<');
        expect(body).toContain(
            catalog['latex.outline_unread'].replace('{0}', 'projects/alpha/manuscript/huge.tex')
        );
        // A file too large to read was never parsed, so it is not one the parser refused.
        expect(body).not.toContain(catalog['latex.outline_partial'].replace('{0}', ''));
    });

    // Revert: draw `outline_empty` for any empty list in views/shared/latex/Outline.svelte.
    it('says a main file that was not read is not read, and not that it holds no sections', async () => {
        const body = await outlined(
            { root: 'docs', path: 'proposal' },
            { sections: [], unread: ['proposal/main.tex'] }
        );

        expect(body).toContain(catalog['latex.outline_unread'].replace('{0}', 'proposal/main.tex'));
        // Nothing of the main file was read, so whether it holds sections is not known.
        expect(body).not.toContain(catalog['latex.outline_empty']);
    });

    it('draws the sections of a file the parser refused and names that file', async () => {
        const body = await outlined(
            { root: 'docs', path: 'proposal' },
            {
                sections: [{ level: 2, title: 'Kept', file: 'proposal/bad.tex', line: 1 }],
                partial: ['proposal/bad.tex']
            }
        );

        expect(body).toContain('>Kept<');
        expect(body).toContain(catalog['latex.outline_partial'].replace('{0}', 'proposal/bad.tex'));
    });
});

describe('the LaTeX view over a folder with no main file', () => {
    it('says so', async () => {
        const empty = { root: 'docs', path: 'notes', mains: [] };

        const body = await drawn({ root: 'docs', path: 'notes' }, json(empty));

        expect(body).toContain(catalog['latex.none']);
    });

    it('says so for an instance that names no root, without asking the server', () => {
        const asked = vi.fn();
        vi.stubGlobal('fetch', asked);
        const instance: Instance = { id: 'latex-two', view: 'latex', state: {} };

        const body = render(Latex, { context: clientContext(client), props: { instance } }).body;

        expect(body).toContain(catalog['latex.none']);
        expect(asked).not.toHaveBeenCalled();
    });
});

describe('the LaTeX view over a folder that is gone', () => {
    it("draws the cannot-read sentence with the catalog's reason and a retry control", async () => {
        const body = await drawn(
            { root: 'docs', path: 'removed' },
            json({ error: 'missing' }, 404)
        );

        expect(body).toContain(
            catalog['latex.read_failed'].replace('{0}', catalog['files.refused_missing'])
        );
        expect(body).toContain('role="alert"');
        expect(body).toContain(`>${catalog['latex.retry']}<`);
        // The folder exists and failed to read, which is not the same as holding no main file.
        expect(body).not.toContain(catalog['latex.none']);
    });
});

describe('the tab of the LaTeX view', () => {
    it('is named by the label the opener wrote, else the folder, else the root', async () => {
        const answer = (): Response => json({ root: 'docs', path: '', mains: [] });
        const labelled = await drawn(
            { root: 'docs', path: 'proposal', label: 'Proposal LS' },
            answer()
        );
        const folder = await drawn({ root: 'docs', path: 'a/proposal' }, answer());
        const root = await drawn({ root: 'docs', path: '' }, answer());

        expect(labelled).toContain('Proposal LS');
        expect(folder).toContain('proposal');
        expect(root).toContain('docs');
    });
});

describe('the places the rows open', () => {
    const issue = (file: string, line: number | null) => ({ file, line, message: 'm' });

    it('audits that a problem opens at its file and line, the main for no file and the top for no line', () => {
        expect(problemFile(issue('proposal/sec/b.tex', 12), 'docs', 'proposal/main.tex')).toEqual({
            root: 'docs',
            path: 'proposal/sec/b.tex',
            line: 12
        });
        expect(problemFile(issue('', 4), 'docs', 'proposal/main.tex')).toEqual({
            root: 'docs',
            path: 'proposal/main.tex',
            line: 4
        });
        expect(problemFile(issue('proposal/sec/b.tex', null), 'docs', 'proposal/main.tex')).toEqual(
            {
                root: 'docs',
                path: 'proposal/sec/b.tex'
            }
        );
    });

    it('audits that every error is listed before any warning', () => {
        const rows = problemRows([issue('e1', 1), issue('e2', 2)], [issue('w1', 3)]);

        expect(rows.map((one) => [one.severity, one.issue.file])).toEqual([
            ['error', 'e1'],
            ['error', 'e2'],
            ['warning', 'w1']
        ]);
    });

    it('audits that the place reads as file and line, a file alone, a line alone or nothing', () => {
        expect(placeOf(issue('a.tex', 3))).toBe('a.tex:3');
        expect(placeOf(issue('a.tex', null))).toBe('a.tex');
        expect(placeOf(issue('', 3))).toBe(catalog['latex.at_line'].replace('{0}', '3'));
        expect(placeOf(issue('', null))).toBe('');
    });

    it('audits that the log opens beside the main file, in the root and in a folder', () => {
        expect(logFile('docs', 'proposal', 'main.tex')).toEqual({
            root: 'docs',
            path: 'proposal/main.log'
        });
        expect(logFile('docs', '', 'main.tex')).toEqual({ root: 'docs', path: 'main.log' });
    });
});
