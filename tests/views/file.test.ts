// One file as its own tab, rendered to HTML on the server: what the view draws for each of the files
// an editor cannot show, and the star over the open file.
//
// The catalog and the glyphs are the real config; the instance state is synthetic. What this does
// NOT cover: the handing-on of a text file to the source tab. It runs in an effect over the file's
// own first bytes, which a server rendering runs neither of; tests/browser/files.spec.ts opens a
// bookmark of a Markdown file in this view and waits for the source tab it becomes.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import File from '../../src/lib/views/File.svelte';
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

    it('draws a rebuilt PDF at a new address, so the frame fetches it again', () => {
        const state = { root: 'hub', path: 'paper.pdf', label: 'paper.pdf' };
        expect(drawn(state)).toContain('src="/api/file/hub/paper.pdf"');

        client.fs.bump('hub', 'paper.pdf');

        expect(drawn(state)).toContain('src="/api/file/hub/paper.pdf?v=1"');
    });

    it('says it is reading a file until its first bytes say what it is', () => {
        const body = drawn({ root: 'hub', path: 'data/set.npz', label: 'set.npz', size: 2097152 });

        // A download offered over a file that is about to open in an editor would say the wrong
        // thing for as long as the read takes.
        expect(body).toContain('Reading...');
        expect(body).not.toContain('download="set.npz"');
    });

    it('draws an unknown type as its extension, its size and a link that saves it', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01])))
        );
        const fresh = createClientState();
        // The bytes are what says it is no text file, so the view is rendered once they are in.
        expect(await fresh.fs.readFileKind('hub', 'data/set.npz')).toMatchObject({ kind: 'other' });
        const body = render(File, {
            context: clientContext(fresh),
            props: {
                instance: instance({
                    root: 'hub',
                    path: 'data/set.npz',
                    label: 'set.npz',
                    size: 2097152
                })
            }
        }).body;

        expect(body).toContain('.npz');
        expect(body).toContain('2.0 MB');
        expect(body).toContain('download="set.npz"');
        expect(body).toContain('href="/api/file/hub/data/set.npz"');
        vi.unstubAllGlobals();
    });

    it('offers the control that opens the same address in a browser tab', () => {
        expect(drawn({ root: 'hub', path: 'paper.pdf' })).toContain('Open in a browser tab');
    });

    it('offers no control that opens an editor: every text file opens in one already', () => {
        const body = drawn({ root: 'hub', path: 'README.md', label: 'README.md' });

        expect(body).not.toContain('source tab');
        expect(
            Object.keys(textCatalog(config)).filter((key) => key.startsWith('file.edit'))
        ).toEqual([]);
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
