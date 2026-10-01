// One file as its own tab, rendered to HTML on the server: what the view draws for each of the
// files an editor cannot show, and the star over the open file.
//
// The catalog and the glyphs are the real config; the instance state is synthetic. What this does
// NOT cover: the handing-on of a text file to the source tab. It runs in an effect over the file's
// own first bytes, which a server rendering runs neither of.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import File from '../../../src/lib/views/sources/file/File.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { between } from '../shared/pane-parts.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);
setCatalog(catalog);
setGlyphs(glyphs);

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
        // the instance names no file, so there is nothing to draw
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
        // a sandboxed frame is one Chrome's own PDF viewer does not draw in
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
        // the first bytes have not been read, so what the file is is still unknown and no download
        // is offered over it
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

        // every text file opens in an editor already, so there is no control that opens another
        expect(body).not.toContain('source tab');
        expect(
            Object.keys(textCatalog(config)).filter((key) => key.startsWith('file.edit'))
        ).toEqual([]);
    });

    it('audits that is one instance per root and path, so opening the same file twice is one tab', () => {
        const { openView } = client.layout;
        const first = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const again = openView('file', { root: 'hub', path: 'code/run.py', label: 'run.py' });
        const other = openView('file', { root: 'hub', path: 'README.md', label: 'README.md' });

        expect(first).not.toBe('');
        expect(again).toBe(first);
        expect(other).not.toBe(first);
    });
});

// Where the file view puts its controls: the one icon action in the header, the text buttons in
// the bar under it.
describe('where the file view puts its controls', () => {
    it('keeps the star and Open in a browser tab in the header as bare icons', () => {
        const body = drawn({ root: 'hub', path: 'paper.pdf', label: 'paper.pdf' });
        const header = between(body, '<header', '</header>');
        const bar = between(body, '<div class="viewbar', '<div class="body');

        const tools = header.match(/<button[^>]*class="tool[^"]*"[^>]*>/g) ?? [];
        expect(tools.length).toBe(2);
        for (const tool of tools) expect(tool).toMatch(/\bbare\b/);
        expect(header).toContain('aria-label="Bookmark this file"');
        expect(header).toContain('aria-label="Open in a browser tab"');
        expect(header).toContain('data-glyph="launch"');
        // the star is an action with a glyph, so it is not a control of the bar
        expect(bar).not.toContain('Bookmark this file');
        // the bar holds only the failure words, so it draws no strip of controls
        expect(bar).not.toContain('role="toolbar"');
    });
});

// The control that hands the file to its program on this machine. What pressing it posts, and the
// sentence a refusal leaves, need a DOM and a server, and no case here presses it.
describe('the control that opens a file in its program', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    /**
     * The view over one file whose first bytes the store has already read, as a zip or as text, on
     * a client holding the given configuration, the checked-in one by default.
     */
    async function held(
        path: string,
        text: boolean,
        settings: Record<string, unknown> | null = config
    ): Promise<string> {
        vi.stubGlobal('window', {});
        const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]);
        vi.stubGlobal('fetch', () =>
            Promise.resolve(new Response(text ? new TextEncoder().encode('# notes\n') : zip))
        );
        const fresh = createClientState();
        if (settings !== null) {
            fresh.entities.receive({
                channel: 'config',
                version: 1,
                payload: { config: settings, text: catalog, findings: [] }
            });
        }
        const kind = await fresh.fs.readFileKind('hub', path);
        expect(kind.kind).toBe(text ? 'text' : 'other');
        return render(File, {
            context: clientContext(fresh),
            props: { instance: instance({ root: 'hub', path, label: path, size: 2048 }) }
        }).body;
    }

    /** How many times a rendering draws the control, counted by its words on a button. */
    function controls(body: string): number {
        return body.split(`<span class="label">${catalog['file.open_program']}</span>`).length - 1;
    }

    it('draws it in the header and beside the download for a .docx, as ui/controls/ToolButton', async () => {
        const body = await held('drafts/report.docx', false);

        // one text button beside the download, and one bare icon in the header
        expect(controls(body)).toBe(1);
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        expect(header).toContain(`aria-label="${catalog['file.open_program']}"`);
        const other = body.slice(body.indexOf('class="other'));
        expect(other).toContain('download="report.docx"');
        expect(other).toContain(catalog['file.open_program']);
        for (const at of other.split(catalog['file.open_program']).slice(0, -1)) {
            expect(at.lastIndexOf('<button type="button" class="tool')).toBeGreaterThan(-1);
        }
        expect(body).toContain(`data-glyph="${catalog['file.open_program_glyph']}"`);
    });

    it('draws none for a picture and a PDF, whose extensions the checked-in list does not name', () => {
        expect(controls(drawn({ root: 'hub', path: 'docs/plot.png' }))).toBe(0);
        expect(controls(drawn({ root: 'hub', path: 'paper.pdf' }))).toBe(0);
    });

    it('reads the list from the configuration the page holds: one naming .zip offers a .zip', async () => {
        const zipped = { ...config, open: { program_ext: { '.zip': 'com.apple.archiveutility' } } };
        expect(controls(await held('bundle.zip', false))).toBe(0);
        expect(controls(await held('bundle.zip', false, zipped))).toBe(1);
        expect(controls(await held('drafts/report.docx', false, zipped))).toBe(0);
    });

    it('draws none for a listed file still being read, nor for a .md handed to the source tab', async () => {
        expect(controls(drawn({ root: 'hub', path: 'drafts/report.docx' }))).toBe(0);
        expect(controls(await held('notes.md', true))).toBe(0);
        expect(controls(drawn({ root: 'hub', path: 'notes.md', label: 'notes.md' }))).toBe(0);
    });

    it('draws none before the configuration has arrived, and keeps the download', async () => {
        const body = await held('drafts/report.docx', false, null);

        expect(controls(body)).toBe(0);
        expect(body).toContain('download="report.docx"');
    });

    it('draws none for a file off the list, and keeps its download', async () => {
        const body = await held('dist/installer.dmg', false);

        expect(controls(body)).toBe(0);
        expect(body).toContain('download="installer.dmg"');
    });

    it('draws none while no file is chosen', () => {
        expect(controls(drawn({}))).toBe(0);
    });

    it('puts the program control in the header for a file whose extension names a program', async () => {
        const body = await held('drafts/report.docx', false);
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        const bar = body.slice(
            body.indexOf('<div class="viewbar'),
            body.indexOf('<div class="body')
        );

        expect(header).toMatch(
            new RegExp(
                `<button[^>]*class="tool[^"]*\\bbare\\b[^"]*"[^>]*aria-label="${catalog['file.open_program']}"`
            )
        );
        // the program control is a header icon, so the bar does not repeat it
        expect(bar).not.toContain(catalog['file.open_program']);
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
        // no bookmark names this file, so there is none to take out
        expect(body).not.toContain('Take this bookmark out');
    });

    it('offers to take it out again, and says it is set, for a file one names', async () => {
        const fresh = await holding([mark('hub', 'code/run.py')]);
        const body = shown(fresh, { root: 'hub', path: 'code/run.py', label: 'run.py' });

        expect(body).toContain('Take this bookmark out');
        // a bookmark names this file already, so it is not offered a second one
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

    it('audits that carries the reason through the store answer rather than dropping it', async () => {
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
