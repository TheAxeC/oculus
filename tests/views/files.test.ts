// The file browser rendered to HTML on the server: the toolbar the roots are changed from, and the
// tree's rows for one root and its first level.
//
// The catalog and the glyphs are the real config; the rows are built by state/fs.ts from synthetic
// listings, so the tree is drawn without a server. What this does NOT cover: the fetches
// state/fs.svelte.ts makes, which need a server and are exercised by tests/browser/files.spec.ts;
// and pressing a control, which no server rendering runs.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Files from '../../src/lib/views/Files.svelte';
import RootForm from '../../src/lib/views/files/RootForm.svelte';
import Tree from '../../src/lib/views/files/Tree.svelte';
import Workspaces from '../../src/lib/views/files/Workspaces.svelte';
import { treeKey, treeRows, type FsEntry } from '../../src/lib/state/fs.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import type { Instance } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

function instance(state: unknown = {}): Instance {
    return { id: 'files-one', view: 'files', state };
}

const LISTINGS: Record<string, FsEntry[]> = {
    'hub:': [
        { name: 'code', kind: 'dir', size: 0, mtime: 1 },
        { name: 'README.md', kind: 'file', size: 2048, mtime: 1 }
    ]
};

const ROWS = treeRows(
    [
        { key: 'hub', dir: '/tmp/hub', fixed: true },
        { key: 'notes', dir: '/tmp/notes', fixed: false }
    ],
    (root, path) => LISTINGS[treeKey(root, path)] ?? [],
    ['hub:']
);

describe('the file browser as a tab', () => {
    it('offers the workspace picker, the add-root control and the save-as control', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });

        expect(body).toContain('aria-label="File browser controls"');
        expect(body).toContain('aria-label="Workspace"');
        expect(body).toContain('Configured roots');
        expect(body).toContain('+ root');
        expect(body).toContain('save as');
    });

    it('says it is reading while the workspaces have not arrived', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });

        expect(body).toContain('Reading...');
    });
});

describe('the tree', () => {
    it('draws one line per root and the first level of the one that is open', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows: ROWS, fixed: ['hub'], ontoggle: noop, onopen: noop, onremove: noop }
        });

        expect(body).toContain('data-fs-row="hub:"');
        expect(body).toContain('data-fs-row="hub:code"');
        expect(body).toContain('data-fs-row="hub:README.md"');
        expect(body).toContain('data-fs-row="notes:"');
        expect(body).toContain('aria-label="Roots and folders"');
    });

    it('reports an open folder as expanded and a closed one as not', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows: ROWS, fixed: ['hub'], ontoggle: noop, onopen: noop, onremove: noop }
        });
        const row = /data-fs-row="hub:"[\s\S]*?<\/li>/.exec(body)?.[0] ?? '';
        const closed = /data-fs-row="notes:"[\s\S]*?<\/li>/.exec(body)?.[0] ?? '';

        expect(row).toContain('aria-expanded="true"');
        expect(closed).toContain('aria-expanded="false"');
    });

    it('sets each level in one step further than the one above it', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows: ROWS, fixed: ['hub'], ontoggle: noop, onopen: noop, onremove: noop }
        });

        expect(body).toContain('padding-left: 0px');
        expect(body).toContain('padding-left: 14px');
    });

    it('offers a removal on a reader-added root and none on a configured one', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows: ROWS, fixed: ['hub'], ontoggle: noop, onopen: noop, onremove: noop }
        });
        const configured = /data-fs-row="hub:"[\s\S]*?<\/li>/.exec(body)?.[0] ?? '';
        const added = /data-fs-row="notes:"[\s\S]*?<\/li>/.exec(body)?.[0] ?? '';

        expect(configured).not.toContain('Take hub out of this workspace');
        expect(added).toContain('Take notes out of this workspace');
    });
});

describe('the workspace picker', () => {
    it('offers the default workspace as the empty choice and one choice per saved name', () => {
        const { body } = render(Workspaces, {
            context: clientContext(client),
            props: { current: 'thesis', names: ['', 'thesis', 'grant'], onselect: noop }
        });

        expect(body).toContain('Configured roots');
        expect(body).toContain('thesis');
        expect(body).toContain('grant');
        expect(body.match(/<option/g)?.length).toBe(3);
    });
});

describe('the form a root and a workspace are named in', () => {
    it('draws the box, its help, the refusal and the two controls', () => {
        const { body } = render(RootForm, {
            context: clientContext(client),
            props: {
                label: 'Folder path',
                help: 'An absolute path, or one starting with ~/',
                confirm: 'add',
                value: '/tmp/notes',
                note: 'There is no folder at that path.',
                oninput: noop,
                onconfirm: noop,
                oncancel: noop
            }
        });

        expect(body).toContain('aria-label="Folder path"');
        expect(body).toContain('An absolute path, or one starting with ~/');
        expect(body).toContain('There is no folder at that path.');
        expect(body).toContain('add');
        expect(body).toContain('cancel');
    });
});

describe('the marks the tree draws', () => {
    it('gives a folder row and the empty state different marks', () => {
        const rows = treeRows([{ key: 'hub', dir: '/tmp/hub', fixed: true }], () => [], []);
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows, fixed: ['hub'], ontoggle: noop, onopen: noop, onremove: noop }
        });
        const empty = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        const { config } = loadConfig(engineDir());
        const glyphs = glyphCatalog(config);
        const catalog = textCatalog(config);

        expect(catalog['files.folder_glyph']).not.toBe(catalog['files.none_glyph']);
        expect(body).toContain(glyphs[catalog['files.folder_glyph']]);
        expect(empty).toContain(glyphs[catalog['files.none_glyph']]);
    });

    it('reads every mark it draws out of its own catalog group', () => {
        const source = readFileSync(
            join(
                dirname(fileURLToPath(import.meta.url)),
                '..',
                '..',
                'src',
                'lib',
                'views',
                'files',
                'Tree.svelte'
            ),
            'utf8'
        );
        const keys = [...source.matchAll(/t\('([a-z_]+)\.([a-z_]+)'/g)].map((found) => found[1]);

        expect([...new Set(keys)]).toEqual(['files']);
    });
});

describe('a root nothing saved', () => {
    it('draws no removal control, since there is nothing saved to remove', () => {
        const rows = treeRows(
            [{ key: 'workspace', dir: '/tmp/workspace', fixed: true }],
            () => [],
            []
        );
        const { body } = render(Tree, {
            context: clientContext(client),
            props: { rows, fixed: ['workspace'], ontoggle: noop, onopen: noop, onremove: noop }
        });

        expect(body).toContain('data-fs-row="workspace:"');
        expect(body).not.toContain('Take workspace out of this workspace');
    });
});

// What the view draws when the server refuses a read. `fetch` and `window` are stubs; nothing here
// reaches a server. What this does NOT cover: the refusals themselves, which are
// tests/routes/fs.test.ts.
describe('a read the server refused', () => {
    /** Let the store's scheduled request run and its answer land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    function answering(answer: (url: string) => Response): ClientState {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => Promise.resolve(answer(url)));
        return createClientState();
    }

    function refused(error: string, status: number): Response {
        return new Response(JSON.stringify({ error }), {
            status,
            headers: { 'content-type': 'application/json' }
        });
    }

    const ROOTS = JSON.stringify({
        current: '',
        workspaces: [{ name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }],
        dropped: ['cathedra']
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('says why the roots could not be read, instead of saying there are none', async () => {
        const fresh = answering(() => refused('origin', 403));
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('The roots could not be read: origin');
        expect(body).not.toContain('No roots yet');
    });

    it('says why an open folder could not be listed, instead of drawing it empty', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('missing', 404)
        );
        // The open folders live in the instance's own ui state, which is where toggle() writes them.
        fresh.ui.setInstanceState('files-one', { expanded: ['hub:'] });
        fresh.fs.workspaces();
        fresh.fs.listing('hub', '');
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('hub could not be read: missing');
        expect(body).toContain('aria-expanded="true"');
    });

    it('says nothing about a folder remembered open under a root the workspace no longer has', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('outside', 404)
        );
        // The instance still remembers a folder of a root that was since taken out of the workspace.
        fresh.ui.setInstanceState('files-one', { expanded: ['gone:', 'gone:sub'] });
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).not.toContain('could not be read');
        expect(body).toContain('data-fs-row="hub:"');
    });

    it('names a saved root the configuration reserved', async () => {
        const fresh = answering((url) =>
            url === '/api/fs'
                ? new Response(ROOTS, {
                      status: 200,
                      headers: { 'content-type': 'application/json' }
                  })
                : refused('missing', 404)
        );
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('the configuration owns the name: cathedra');
    });
});
