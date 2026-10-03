// What a LaTeX source tab hands its editor: the problems of the latest build that name this file,
// the folder a picture path is resolved from, whether a picture file exists, the address it is
// read at and the formatter. The editor kit's extension is replaced by a recorder of what it was
// given, so what is asserted is the page's side of the hand-over; the kit's own behaviour is
// tests/ui/controls/editor/kit/latex/latex-widget.test.ts's.
//
// What this does NOT cover: the editor drawing any of it, which needs a browser.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { latexEditor } from '../../../src/lib/views/sources/source/latex-editor.ts';
import type { LatexEditorDeps } from '../../../src/lib/ui/controls/editor/kit/latex/latex-widget.ts';
import { createClientState, json, settle, type ClientState } from '../../fixtures/client.ts';

const given: LatexEditorDeps[] = [];

vi.mock('../../../src/lib/ui/controls/editor/kit/latex/latex-widget.ts', () => ({
    REST_MS: 300,
    latexExtension: (deps: LatexEditorDeps) => {
        given.push(deps);
        return () => () => undefined;
    }
}));

let client: ClientState;
let asked: string[];

beforeEach(() => {
    given.length = 0;
    asked = [];
    client = createClientState();
});

afterEach(() => vi.unstubAllGlobals());

/** Answer the folder `docs/proposal` with one main whose build left the given problems. */
async function built(
    errors: { file: string; line: number | null; message: string }[],
    warnings: { file: string; line: number | null; message: string }[] = []
): Promise<void> {
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        const main = {
            main: 'main.tex',
            program: 'pdflatex',
            pdfPath: 'proposal/main.pdf',
            pdf: 5,
            log: 5,
            errors,
            warnings
        };
        return Promise.resolve(json({ root: 'docs', path: 'proposal', mains: [main] }));
    });
    client.latex.state({ root: 'docs', path: 'proposal' });
    await settle();
}

/** The dependencies the editor extension was made with for a file. */
function depsFor(path: string, say: (words: string) => void = () => undefined): LatexEditorDeps {
    latexEditor(client, { root: 'docs', path }, say);
    return given[0];
}

describe('the problems a LaTeX tab hands its editor', () => {
    it('audits that the problems are those of the latest build that name this file, a missing line as the first', async () => {
        await built(
            [
                { file: 'proposal/sec/b.tex', line: 12, message: 'Missing $ inserted.' },
                { file: 'proposal/main.tex', line: 3, message: 'elsewhere' }
            ],
            [{ file: 'proposal/sec/b.tex', line: null, message: 'LaTeX: floats.' }]
        );

        expect(depsFor('proposal/sec/b.tex').problems).toEqual([
            { line: 12, severity: 'error', message: 'Missing $ inserted.' },
            { line: 1, severity: 'warning', message: 'LaTeX: floats.' }
        ]);
    });

    it('audits that there are no problems for a file the build did not name, nor before any build was read', async () => {
        expect(depsFor('proposal/main.tex').problems).toEqual([]);
        await built([{ file: 'proposal/sec/b.tex', line: 2, message: 'x' }]);
        given.length = 0;

        expect(depsFor('proposal/other.tex').problems).toEqual([]);
    });
});

describe('the folder a picture path is resolved from', () => {
    const ROOT_OF = '/api/latex?root=docs&file=proposal%2Fsec%2Fb.tex';

    it('audits that the folder is the one of the main file the tab builds through, asked once', async () => {
        vi.stubGlobal('fetch', (url: string) => {
            asked.push(url);
            return Promise.resolve(json({ root: 'docs', path: 'proposal', main: 'main.tex' }));
        });
        const deps = depsFor('proposal/sec/b.tex');

        expect(await deps.folder()).toBe('proposal');
        expect(await deps.folder()).toBe('proposal');
        expect(asked).toEqual([ROOT_OF]);
    });

    it("audits that the folder is the file's own when it builds through no main file", async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(json({ main: null })));

        expect(await depsFor('proposal/sec/b.tex').folder()).toBe('proposal/sec');
    });
});

describe('what else a LaTeX tab hands its editor', () => {
    it('audits that a picture exists when the folder listing names it as a file', async () => {
        const listing = {
            entries: [
                { kind: 'file', name: 'a.png' },
                { kind: 'dir', name: 'a.jpg' }
            ]
        };
        const read = vi.spyOn(client.fs, 'readListing').mockResolvedValue(listing as never);
        const deps = depsFor('proposal/main.tex');

        expect(await deps.exists('proposal/fig/a.png')).toBe(true);
        expect(await deps.exists('proposal/fig/a.jpg')).toBe(false);
        expect(await deps.exists('proposal/fig/b.png')).toBe(false);
        expect(read).toHaveBeenCalledWith('docs', 'proposal/fig');
    });

    it('audits that a picture is read through the file route, each segment of the path escaped', () => {
        const deps = depsFor('proposal/main.tex');

        expect(deps.address('proposal/my fig/a#1.png')).toBe(
            '/api/file/docs/proposal/my%20fig/a%231.png'
        );
    });

    it("audits that formatting goes through the store's formatter with the file and the editor's words reach the tab", async () => {
        const say = vi.fn();
        const deps = depsFor('proposal/main.tex', say);
        const format = vi.spyOn(client.latex, 'format').mockResolvedValue({ text: 'b', error: '' });

        expect(await deps.format('a')).toEqual({ text: 'b', error: '' });
        expect(format).toHaveBeenCalledExactlyOnceWith('a', 'proposal/main.tex');
        deps.say('error: x');
        expect(say).toHaveBeenCalledExactlyOnceWith('error: x');
    });
});
