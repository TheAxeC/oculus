// One file as its own tab, rendered to HTML on the server: what each type of file is drawn as, and
// the code window's numbered, highlighted lines.
//
// The catalog and the glyphs are the real config; the instance state is synthetic. What this does
// NOT cover: the fetch state/fs.svelte.ts makes for a text file, which needs a server and is
// exercised by tests/browser/files.spec.ts, so the text cases here render the code window directly.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import File from '../../src/lib/views/File.svelte';
import Code from '../../src/lib/views/file/Code.svelte';
import { codeHtml, lineNumbers } from '../../src/lib/views/file/languages.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

function instance(state: unknown): Instance {
    return { id: 'file-one', view: 'file', state };
}

function drawn(state: unknown): string {
    return render(File, { context: clientContext(client), props: { instance: instance(state) } })
        .body;
}

describe('one file as its own tab', () => {
    it('draws nothing and says so when the instance names no file', () => {
        const body = drawn({});

        expect(body).toContain('No file chosen.');
        expect(body).not.toContain('<img');
    });

    it('draws an image as a picture over the file route', () => {
        const body = drawn({ root: 'hub', path: 'docs/plot.png', label: 'plot.png' });

        expect(body).toContain('<img');
        expect(body).toContain('src="/api/file/hub/docs/plot.png"');
        expect(body).toContain('alt="plot.png"');
    });

    it("draws a PDF in a frame Chrome's own viewer can draw, which a sandboxed one is not", () => {
        const body = drawn({ root: 'hub', path: 'paper.pdf', label: 'paper.pdf' });

        const frame = /<iframe[^>]*>/.exec(body)?.[0] ?? '';
        expect(frame).not.toBe('');
        expect(frame).not.toContain('sandbox');
        expect(body).toContain('src="/api/file/hub/paper.pdf"');
    });

    it('draws an unknown type as its extension, its size and a link that saves it', () => {
        const body = drawn({ root: 'hub', path: 'data/set.npz', label: 'set.npz', size: 2097152 });

        expect(body).toContain('.npz');
        expect(body).toContain('2.0 MB');
        expect(body).toContain('download="set.npz"');
        expect(body).toContain('href="/api/file/hub/data/set.npz"');
    });

    it('says it is reading a text file while its bytes have not arrived', () => {
        const body = drawn({ root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Reading...');
    });

    it('offers the control that opens the same address in a browser tab', () => {
        expect(drawn({ root: 'hub', path: 'paper.pdf' })).toContain('Open in a browser tab');
    });

    it('is one instance per root and path, so opening the same file twice is one tab', () => {
        const { openView } = client.layout;
        const first = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const again = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const other = openView('file', { root: 'hub', path: 'README.md', label: 'README.md' });

        expect(first).not.toBe('');
        expect(again).toBe(first);
        expect(other).not.toBe(first);
    });
});

describe('the code window', () => {
    const PYTHON = 'import sys\n\n\ndef main():\n    return "one"\n';

    it('numbers every line of the file', () => {
        const { body } = render(Code, {
            props: { text: PYTHON, language: 'python', path: 'code/run.py' }
        });

        expect(lineNumbers(PYTHON)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(body).toContain('1\n2\n3\n4\n5\n6');
    });

    it('paints the highlighter classes the theme colours, and escapes the file text', () => {
        const painted = codeHtml('if (a < b) return "<b>";\n', 'javascript');

        expect(painted).toContain('hljs-keyword');
        expect(painted).toContain('hljs-string');
        expect(painted).not.toContain('<b>');
        expect(painted).toContain('&lt;b&gt;');
    });

    it('names the window by the file and says which language it painted', () => {
        const { body } = render(Code, {
            props: { text: PYTHON, language: 'python', path: 'code/run.py' }
        });

        expect(body).toContain('data-fs-code="code/run.py"');
        expect(body).toContain('data-language="python"');
        expect(body).toContain('aria-label="code/run.py, read only"');
    });

    it('draws a language it has none for as plain escaped text', () => {
        expect(codeHtml('a < b\n', 'klingon')).toBe('a &lt; b\n');
    });
});

// The star over the open file, which is the reader's own bookmarks read through the fs store.
// `fetch` and `window` are stubs; nothing here reaches a server.
describe('the star on the open file', () => {
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    /** A client whose bookmarks hold the entries named. */
    async function holding(entries: Record<string, unknown>[]): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ entries, schema: [] }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        await settle();
        return fresh;
    }

    function mark(root: string, path: string): Record<string, unknown> {
        return { id: path, title: path, fields: { label: path, root, path }, file: '', index: 0 };
    }

    function shown(fresh: ClientState, state: unknown): string {
        return render(File, {
            context: clientContext(fresh),
            props: { instance: instance(state) }
        }).body;
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('offers to bookmark a file no bookmark names', async () => {
        const fresh = await holding([mark('hub', 'other.md')]);
        const body = shown(fresh, { root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Bookmark this file');
        expect(body).not.toContain('Take this bookmark out');
    });

    it('offers to take it out again, and says it is set, for a file one names', async () => {
        const fresh = await holding([mark('hub', 'code/run.py')]);
        const body = shown(fresh, { root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Take this bookmark out');
        expect(body).not.toContain('Bookmark this file');
        expect(body).toContain('aria-pressed="true"');
    });

    it('reads the root as well as the path, so the same path under two roots is two files', async () => {
        const fresh = await holding([mark('notes', 'code/run.py')]);
        const body = shown(fresh, { root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Bookmark this file');
    });
});

// What a refused bookmark write says. The store answers, so the refusal is the one the endpoint
// gives a label the file already holds.
describe('a bookmark the endpoint refused', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('carries the reason through the store answer rather than dropping it', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                new Response(
                    JSON.stringify(
                        url.includes('bookmarks=1')
                            ? { entries: [], schema: [] }
                            : {
                                  ok: true,
                                  changed: [],
                                  refused: [
                                      {
                                          field: 'label',
                                          reason: 'an entry with that label is already in the file'
                                      }
                                  ]
                              }
                    ),
                    { status: 200, headers: { 'content-type': 'application/json' } }
                )
            )
        );
        const fresh = createClientState();
        const answer = await fresh.fs.addBookmark({ label: 'README.md', root: 'hub', path: 'a' });

        expect(answer.ok).toBe(true);
        expect(answer.refused.map((one) => one.reason)).toEqual([
            'an entry with that label is already in the file'
        ]);
    });
});
