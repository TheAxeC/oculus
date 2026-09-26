// The file browser rendered to HTML on the server: the explorer's root heads with the controls the
// roots are changed from, the tree's rows for one root and its first level, the three sections
// under the trees, and the form the instance's state says is open.
//
// The catalog and the glyphs are the real config; the rows are built by state/sources/fs.ts from
// synthetic listings, so the tree is drawn without a server. What this does NOT cover: the fetches
// state/sources/fs.svelte.ts makes, which need a server and are exercised by
// tests/browser/sources/files.spec.ts; and pressing a control or a key, which no server rendering
// runs and tests/browser/sources/files.spec.ts and tests/browser/sources/files-forms.spec.ts do.
// Each case written for the explorer names the change that turns it red.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import Files from '../../../../src/lib/views/sources/files/Files.svelte';
import Bookmarks from '../../../../src/lib/views/sources/files/sections/Bookmarks.svelte';
import EntryForm from '../../../../src/lib/views/shared/forms/EntryForm.svelte';
import { BOOKMARK_COLLECTION } from '../../../../src/lib/state/sources/fs.svelte.ts';
import RootForm from '../../../../src/lib/views/sources/files/sections/RootForm.svelte';
import Tree from '../../../../src/lib/views/sources/files/tree/Tree.svelte';
import Workspaces from '../../../../src/lib/views/sources/files/sections/Workspaces.svelte';
import { treeKey, treeRows, type FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

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
    ],
    'hub:code': [{ name: 'run.py', kind: 'file', size: 10, mtime: 1 }]
};

const ROWS = treeRows(
    [
        { key: 'hub', dir: '/tmp/hub', fixed: true },
        { key: 'notes', dir: '/tmp/notes', fixed: false }
    ],
    (root, path) => LISTINGS[treeKey(root, path)] ?? [],
    ['hub:', 'hub:code']
);

/** The tree's props, every callback a no-op, with the fields a case sets laid over them. */
function treeProps(over: Record<string, unknown> = {}): ComponentProps<typeof Tree> {
    return {
        rows: ROWS,
        filtering: false,
        selected: null,
        fixed: ['hub'],
        marked: [],
        onselect: noop,
        ontoggle: noop,
        onopen: noop,
        onremove: noop,
        onbookmark: noop,
        onrefresh: noop,
        oncollapse: noop,
        ...over
    };
}

/** One row of a rendering, from its attribute to the end of its list item. */
function rowOf(body: string, key: string): string {
    const at = body.indexOf(`data-fs-row="${key}"`);
    return at < 0 ? '' : body.slice(at, body.indexOf('</li>', at));
}

describe('the file browser as a tab', () => {
    // Revert: drop the Search from Files.svelte.
    it('offers the filter over the trees and the workspaces section with its save-as control', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });

        expect(body).toContain('aria-label="Filter the folders already read by name"');
        expect(body).toContain('data-fs-workspaces');
        expect(body).toContain('Configured roots');
        expect(body).toContain('aria-label="save as"');
    });

    // Revert: draw the Controls partial only once the workspaces have arrived, in Files.svelte.
    it('offers the workspace menu and the add-root control on its header while the roots are read', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));

        expect(body).toContain('Reading...');
        expect(header).toContain('aria-label="Workspace"');
        expect(header).toContain('aria-haspopup="menu"');
        expect(header).toContain('aria-label="+ root"');
    });
});

// Pressing the control is a DOM event no server render fires, so what it does is read off the
// source.
describe('the control that opens a note', () => {
    const source = readFileSync('src/lib/views/sources/files/sections/Sections.svelte', 'utf8');

    it('audits that opening the tab writes no file, so an untouched note leaves nothing', () => {
        const from = source.slice(source.indexOf('function addNote('));
        const body = from.slice(0, from.indexOf('\n    }'));

        expect(body).toContain("openView('note', { id: noteId(new Date()), fresh: true })");
        // the control opens the tab and nothing else, so no save is reached from it
        expect(body).not.toContain('saveNote');
        // and the view holds no save of a note anywhere else either
        expect(source).not.toContain('saveNote');
    });
});

describe('the tree', () => {
    // Revert: draw only the rows of depth 0 in Tree.svelte's each.
    it('draws one line per root and the first level of the one that is open', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        expect(body).toContain('data-fs-row="hub:"');
        expect(body).toContain('data-fs-row="hub:code"');
        expect(body).toContain('data-fs-row="hub:README.md"');
        expect(body).toContain('data-fs-row="notes:"');
        expect(body).toContain('role="tree" aria-label="Roots and folders"');
    });

    // Revert: pass `expanded={row.open}` to the file rows as well in Tree.svelte.
    it('makes every row a treeitem at its level, and reports an open folder as expanded', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        expect(rowOf(body, 'hub:')).toContain('aria-expanded="true"');
        expect(rowOf(body, 'notes:')).toContain('aria-expanded="false"');
        // A file opens nothing under it, so it says nothing about being open.
        expect(rowOf(body, 'hub:README.md')).not.toContain('aria-expanded');
        expect(rowOf(body, 'hub:')).toContain('aria-level="1"');
        expect(rowOf(body, 'hub:code')).toContain('aria-level="2"');
        expect(rowOf(body, 'hub:code/run.py')).toContain('aria-level="3"');
        expect(rowOf(body, 'hub:code/run.py')).toContain('role="treeitem"');
    });

    // Revert: pass `depth={row.depth}` rather than `row.depth - 1` to the row in Tree.svelte.
    it('draws one indent guide per level under the root, and none on a root head', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });
        const guides = (key: string): number => rowOf(body, key).split('class="guide').length - 1;

        expect(guides('hub:')).toBe(0);
        expect(guides('hub:code')).toBe(0);
        expect(guides('hub:code/run.py')).toBe(1);
    });

    // Revert: drop `heading` from the root row's TreeItem in Tree.svelte.
    it('draws a root line as the head of its tree and every other line as a row', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        expect(rowOf(body, 'hub:')).toContain('heading');
        // a root line is the head of its tree and every other line is a row under it
        expect(rowOf(body, 'hub:code')).not.toContain('heading');
    });

    // Revert: drop the `!fixed.includes(row.root)` test around the removal in Tree.svelte.
    it('offers a removal on a reader-added root and none on a configured one', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        // the hub root is configured, and only a root the reader added is offered a removal
        expect(rowOf(body, 'hub:')).not.toContain('Take hub out of this workspace');
        expect(rowOf(body, 'notes:')).toContain('Take notes out of this workspace');
    });

    // Revert: draw a Workspaces menu or an add-root control in Tree.svelte's rootActions.
    it('draws icon controls alone on a root head: refresh, collapse all and the removal', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });
        const head = rowOf(body, 'notes:');
        const actions = head.slice(head.indexOf('class="actions'));

        // the workspace is chosen from the header menu, not from a control on a root head
        expect(body).not.toContain('aria-label="Workspace"');
        // and a root is added from the header too, not from a control here
        expect(body).not.toContain('aria-label="+ root"');
        expect(actions).toContain('aria-label="refresh"');
        expect(actions).toContain('aria-label="collapse all"');
        expect(actions).toContain('aria-label="remove"');
        expect(actions.split('class="tool').length - 1).toBe(actions.split('compact').length - 1);
    });

    // Revert: give folder rows the `fileActions` snippet as well in Tree.svelte.
    it('offers the bookmark and the new-tab controls on a file row and neither on a folder', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        expect(rowOf(body, 'hub:README.md')).toContain('aria-label="bookmark"');
        expect(rowOf(body, 'hub:README.md')).toContain('aria-label="open in a new tab"');
        // the bookmark is of a file, so a folder row is not offered it
        expect(rowOf(body, 'hub:code')).not.toContain('aria-label="bookmark"');
        // nor the new-tab control, which opens a file
        expect(rowOf(body, 'hub:code')).not.toContain('aria-label="open in a new tab"');
    });

    // Revert: set `pressed={false}` on the row's bookmark control.
    it("draws a file's bookmark control pressed while a bookmark names it", () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: treeProps({ marked: ['hub:README.md'] })
        });

        expect(rowOf(body, 'hub:README.md')).toContain('aria-pressed="true"');
        expect(rowOf(body, 'hub:code/run.py')).toContain('aria-pressed="false"');
    });

    // Revert: pass `current={''}` to the TreeView in Tree.svelte, whatever is selected.
    it('draws the selected row as selected and makes it the one stop of the focus order', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: treeProps({ selected: { root: 'hub', path: 'code' } })
        });

        expect(rowOf(body, 'hub:code')).toContain('aria-selected="true"');
        expect(rowOf(body, 'hub:code')).toContain('tabindex="0"');
        expect(rowOf(body, 'hub:')).toContain('tabindex="-1"');
        expect(body.split('aria-selected="true"').length - 1).toBe(1);
        expect(body.split('tabindex="0"').length - 1).toBe(1);
    });

    // Revert: leave the stop nowhere while no drawn row is selected.
    it('puts the stop on the first row while no drawn row is selected', () => {
        const { body } = render(Tree, {
            context: clientContext(client),
            props: treeProps({ selected: { root: 'gone', path: 'x' } })
        });

        expect(rowOf(body, 'hub:')).toContain('tabindex="0"');
        // the selected row is of a root the tree no longer draws, so no drawn row is selected
        expect(body).not.toContain('aria-selected="true"');
    });
});

describe('the workspaces section', () => {
    // Revert: drop the leading '' from `rows` in Workspaces.svelte, or draw `current` as
    // `selected`.
    it('lists the configured roots first and one row per saved name, the one in force current', () => {
        const { body } = render(Workspaces, {
            context: clientContext(client),
            props: {
                current: 'thesis',
                names: ['', 'thesis', 'grant'],
                error: '',
                open: true,
                saving: false,
                ontoggle: noop,
                onsave: noop,
                onselect: noop,
                onretry: noop
            }
        });

        expect(body).toContain('data-fs-workspace=""');
        expect(body.indexOf('Configured roots')).toBeLessThan(
            body.indexOf('data-fs-workspace="thesis"')
        );
        expect(body).toContain('data-fs-workspace="grant"');
        const thesis = body.slice(body.indexOf('data-fs-workspace="thesis"'));
        expect(thesis.slice(0, thesis.indexOf('</li>'))).toContain('aria-current="true"');
        expect(body.split('aria-current="true"').length - 1).toBe(1);
        // The workspace in force is drawn as in force, never as the reader's selection.
        expect(body).not.toContain('aria-selected="true"');
    });

    // revert: src/lib/views/sources/files/sections/Workspaces.svelte:71 => {#if false}
    it('says why the workspaces could not be read, with the control that reads them again', () => {
        const { body } = render(Workspaces, {
            context: clientContext(client),
            props: {
                current: '',
                names: [],
                error: 'origin',
                open: true,
                saving: false,
                ontoggle: noop,
                onsave: noop,
                onselect: noop,
                onretry: noop
            }
        });

        expect(body).toContain('The workspaces could not be read: origin');
        expect(body).toContain('aria-label="read again"');
        expect(body).toContain('Read the workspaces again');
        // the control that saves the roots in force is drawn in every state, as the other heads are
        expect(body).toContain('aria-label="save as"');
    });

    // revert: src/lib/views/sources/files/sections/Workspaces.svelte:46 => const rows = $derived(workspaceChoices(names));
    it('draws no workspace row at all over a read that failed, not even the configured roots', () => {
        const { body } = render(Workspaces, {
            context: clientContext(client),
            props: {
                current: '',
                names: [],
                error: 'origin',
                open: true,
                saving: false,
                ontoggle: noop,
                onsave: noop,
                onselect: noop,
                onretry: noop
            }
        });

        // the read never landed, so no workspace of this machine is offered as one it holds
        expect(body).not.toContain('data-fs-workspace=""');
        // the row for the roots the configuration names is a row about a read that answered
        expect(body).not.toContain('Configured roots');
        expect(body).toContain('>0</span>');
    });

    // Revert: render the list whether or not `open` is set, in ui/tree/TreeSection.svelte.
    it('draws the head alone while the section is closed', () => {
        const { body } = render(Workspaces, {
            context: clientContext(client),
            props: {
                current: '',
                names: ['', 'thesis'],
                error: '',
                open: false,
                saving: false,
                ontoggle: noop,
                onsave: noop,
                onselect: noop,
                onretry: noop
            }
        });

        expect(body).toContain('Workspaces');
        expect(body).toContain('aria-expanded="false"');
        // the menu is closed, so the workspaces it lists are not drawn
        expect(body).not.toContain('data-fs-workspace="thesis"');
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
    // Revert: draw a folder row with the file glyph in Tree.svelte's glyphOf.
    // revert: src/lib/views/sources/files/tree/Tree.svelte:84 => if (row.kind === 'dir') return t('files.file_glyph');
    it('gives a folder row and the empty state different marks', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });
        const empty = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        const { config } = loadConfig(engineDir());
        const catalog = textCatalog(config);

        expect(catalog['files.folder_glyph']).not.toBe(catalog['files.none_glyph']);
        expect(body).toContain(`data-glyph="${catalog['files.folder_glyph']}"`);
        expect(empty).toContain(`data-glyph="${catalog['files.none_glyph']}"`);
    });

    it('reads every mark it draws out of its own catalog group', () => {
        const source = readFileSync(
            join(
                dirname(fileURLToPath(import.meta.url)),
                '../../../../src/lib/views/sources/files/tree/Tree.svelte'
            ),
            'utf8'
        );
        const keys = [...source.matchAll(/t\('([a-z_]+)\.([a-z_]+)'/g)].map((found) => found[1]);

        expect([...new Set(keys)]).toEqual(['files']);
    });
});

describe('a root nothing saved', () => {
    // Revert: the removal case's, dropping the `fixed` test.
    it('draws no removal control, since there is nothing saved to remove', () => {
        const rows = treeRows(
            [{ key: 'workspace', dir: '/tmp/workspace', fixed: true }],
            () => [],
            []
        );
        const { body } = render(Tree, {
            context: clientContext(client),
            props: treeProps({ rows, fixed: ['workspace'] })
        });

        expect(body).toContain('data-fs-row="workspace:"');
        // a configured root is not offered a removal
        expect(body).not.toContain('Take workspace out of this workspace');
    });
});

// What the view draws when the server refuses a read. `fetch` and `window` are stubs; nothing here
// reaches a server. What this does NOT cover: the refusals themselves, which are
// tests/routes/files/fs.test.ts.
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
        // the roots could not be read, which is said in its own words rather than as an empty list
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
        // The open folders live in the instance's own ui state, which is where toggle() writes
        // them.
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
        // The instance still remembers a folder of a root that was since taken out of the
        // workspace.
        fresh.ui.setInstanceState('files-one', { expanded: ['gone:', 'gone:sub'] });
        fresh.fs.workspaces();
        await settle();

        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        // the roots read, and the folder the instance remembers of a root that is gone is dropped
        // without a word
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

// The two lists the reader keeps beside the tree, and the controls that add to them. The store is
// answered by a stub, as above; nothing here reaches a server.
describe("the reader's own bookmarks and notes", () => {
    /** Let the store's scheduled requests run and their answers land. */
    async function settle(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const ROOTS = JSON.stringify({
        current: '',
        workspaces: [{ name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }],
        dropped: []
    });

    const MARKS = JSON.stringify({
        entries: [
            {
                id: 'the manual',
                title: 'the manual',
                fields: { label: 'the manual', root: 'hub', path: 'docs/manual.md' },
                file: '',
                index: 0
            }
        ],
        schema: [
            { field: 'label', type: 'text', label: 'Label', required: true },
            { field: 'root', type: 'select', label: 'Root' },
            { field: 'path', type: 'text', label: 'Path' }
        ]
    });

    const NOTES = JSON.stringify({
        notes: [{ id: '20260915-120000-001', title: 'a note title', modified: 1_757_000_000_000 }]
    });

    function json(body: string): Response {
        return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }

    /** A client whose fs store is answered from the fixtures above. */
    async function loaded(): Promise<ClientState> {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            if (url.includes('bookmarks=1')) return Promise.resolve(json(MARKS));
            if (url.includes('notes=1')) return Promise.resolve(json(NOTES));
            return Promise.resolve(json(ROOTS));
        });
        const fresh = createClientState();
        fresh.fs.workspaces();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        return fresh;
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // Revert: label the head control of Notes.svelte with the section's name instead of its own.
    it('offers the bookmark and the note controls on the heads of their sections', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });
        const head = (attribute: string): string =>
            body.slice(body.indexOf(attribute), body.indexOf('</button>', body.indexOf(attribute)));

        expect(body).toContain('aria-label="+ bookmark"');
        expect(body).toContain('aria-label="+ note"');
        expect(head('data-fs-bookmarks')).toContain('aria-label="Bookmarks"');
        expect(head('data-fs-notes')).toContain('aria-label="Notes"');
    });

    it('lists the bookmarks under the tree, each with a control that changes it', async () => {
        const fresh = await loaded();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-bookmarks');
        expect(body).toContain('data-fs-bookmark="the manual"');
        expect(body).toContain('the manual');
        expect(body).toContain('Change the bookmark the manual');
    });

    it('lists the notes under them, each with its time and its removal', async () => {
        const fresh = await loaded();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-notes');
        expect(body).toContain('data-fs-note="20260915-120000-001"');
        expect(body).toContain('a note title');
        expect(body).toContain('Delete the note a note title');
    });

    // Revert: drop the empty row of views/sources/files/sections/Bookmarks.svelte.
    it('draws both heads with a count of none on a machine that has no bookmarks and no notes', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) => {
            if (url.includes('bookmarks=1')) {
                return Promise.resolve(json(JSON.stringify({ entries: [], schema: [] })));
            }
            if (url.includes('notes=1'))
                return Promise.resolve(json(JSON.stringify({ notes: [] })));
            return Promise.resolve(json(ROOTS));
        });
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-bookmarks');
        expect(body).toContain('data-fs-notes');
        // neither section holds an entry yet, so the heads are drawn and no row under them
        expect(body).not.toContain('data-fs-bookmark=');
        // and the notes section holds none either
        expect(body).not.toContain('data-fs-note=');
        expect(body.split('>0</span>').length - 1).toBe(2);
        expect(body).toContain('No bookmark yet.');
        expect(body).toContain('No note yet.');
    });

    // Revert: draw the bookmarks' error as a paragraph in place of Bookmarks in
    // views/sources/files/Files.svelte.
    it('says why the two lists could not be read, and keeps both heads and their add controls', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1') || url.includes('notes=1')
                    ? new Response(JSON.stringify({ error: 'origin' }), {
                          status: 403,
                          headers: { 'content-type': 'application/json' }
                      })
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('The bookmarks could not be read: origin');
        expect(body).toContain('The notes could not be read: origin');
        const marks = body.slice(body.indexOf('data-fs-bookmarks'), body.indexOf('data-fs-notes'));
        const held = body.slice(body.indexOf('data-fs-notes'), body.indexOf('data-fs-workspaces'));
        expect(marks).toContain('aria-label="+ bookmark"');
        expect(marks).toContain('The bookmarks could not be read: origin');
        expect(held).toContain('aria-label="+ note"');
        expect(held).toContain('The notes could not be read: origin');
    });

    // revert: src/lib/views/sources/files/tree/Failed.svelte:28 => label={t('files.bookmarks_empty')}
    it('carries the control that reads it again on the line that says a read failed', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1') || url.includes('notes=1')
                    ? new Response(JSON.stringify({ error: 'origin' }), {
                          status: 403,
                          headers: { 'content-type': 'application/json' }
                      })
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        fresh.fs.notes();
        await settle();
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        const marks = body.slice(body.indexOf('data-fs-bookmarks'), body.indexOf('data-fs-notes'));
        const held = body.slice(body.indexOf('data-fs-notes'), body.indexOf('data-fs-workspaces'));
        expect(marks).toContain('aria-label="read again"');
        expect(marks).toContain('Read the bookmarks again');
        expect(held).toContain('aria-label="read again"');
        expect(held).toContain('Read the notes again');
    });

    // Revert: give a bookmark row the bookmark's title rather than its place as its tooltip.
    it('says where each bookmark points, so two labels on one path are told apart', async () => {
        const fresh = await loaded();
        const { body } = render(Bookmarks, {
            context: clientContext(fresh),
            props: {
                rows: fresh.fs.bookmarks().entries,
                error: '',
                open: true,
                editing: '',
                adding: false,
                ontoggle: noop,
                onadd: noop,
                onopen: noop,
                onedit: noop,
                onretry: noop
            }
        });

        expect(body).toContain('aria-label="Bookmarks"');
        expect(body).toContain('Open hub/docs/manual.md');
    });

    // Revert: in `markForm` of views/sources/files/Files.svelte, test a component `$state('')` for
    // 'bookmark' instead of `view.form`, or draw the form whenever `view.form` is 'bookmark'.
    it('draws the bookmark form open when the instance state says it is, over the bookmark it names', async () => {
        const fresh = await loaded();
        const drawn = (state: unknown): string => {
            fresh.ui.setInstanceState('files-one', state);
            return render(Files, {
                context: clientContext(fresh),
                props: { instance: instance() }
            }).body;
        };

        // the instance holds no form, so no form is drawn
        expect(drawn({})).not.toContain('data-form=');
        const adding = drawn({ form: 'bookmark' });
        expect(adding).toContain('data-form="add"');
        expect(adding).toContain('aria-label="Label"');
        const editing = drawn({ form: 'bookmark', editing: 'the manual' });
        expect(editing).toContain('data-form="edit"');
        expect(editing).toContain('value="the manual"');
        // An edit form whose bookmark is not in the list, as before the bookmarks are read after a
        // reload, draws no form: drawn, it would be an add form where the edit form belongs, whose
        // Save adds a new bookmark and under which what was typed into the edit form is hidden.
        client.ui.setInstanceState('files-one', { form: 'bookmark', editing: 'the manual' });
        const unread = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
        // the bookmarks have not been read, so the bookmark the form names is not there to edit
        expect(unread).not.toContain('data-form=');
        // and a form naming an entry the read list does not hold draws none either
        expect(drawn({ form: 'bookmark', editing: 'no such bookmark' })).not.toContain(
            'data-form='
        );
    });

    // Revert: in views/sources/files/Files.svelte, give RootForm a component `typed` instead of
    // `view.typed`.
    it('draws the root form open with the line the instance state holds', async () => {
        const fresh = await loaded();
        fresh.ui.setInstanceState('files-one', { form: 'root', typed: '/tmp/typed-root' });
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).toContain('data-fs-form="Folder path"');
        expect(body).toContain('value="/tmp/typed-root"');
    });

    it("draws the add form over the bookmarks file's own schema, with the roots in force", async () => {
        const fresh = await loaded();
        const schema = fresh.fs
            .bookmarks()
            .schema.map((field) =>
                field.field === 'root' ? { ...field, options: ['hub', 'notes'] } : field
            );
        const { body } = render(EntryForm, {
            context: clientContext(fresh),
            props: {
                collection: BOOKMARK_COLLECTION,
                schema,
                entry: null,
                initial: { root: 'hub' },
                onadd: () => Promise.resolve({ ok: true, changed: [], refused: [] }),
                onclose: noop,
                onsaid: noop
            }
        });

        // The file's three fields, in the file's own order, each as the control its type names.
        expect(body).toContain('data-form="add"');
        expect(body).toContain('aria-label="Label"');
        expect(body).toContain('aria-label="Root"');
        expect(body).toContain('aria-label="Path"');
        expect(body).toContain('<select');
        // The roots of the workspace in force are the choices, and the open one is selected.
        expect(body).toContain('>hub<');
        expect(body).toContain('>notes<');
        expect(/<option[^>]*selected[^>]*>\s*hub/.test(body)).toBe(true);
    });

    it('offers the same three controls before any bookmark has been written', async () => {
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', (url: string) =>
            Promise.resolve(
                url.includes('bookmarks=1')
                    ? json(
                          JSON.stringify({
                              entries: [],
                              schema: [
                                  { field: 'label', type: 'text', label: 'Label', required: true },
                                  { field: 'root', type: 'select', label: 'Root' },
                                  { field: 'path', type: 'text', label: 'Path' }
                              ]
                          })
                      )
                    : json(ROOTS)
            )
        );
        const fresh = createClientState();
        fresh.fs.bookmarks();
        await settle();
        const { body } = render(EntryForm, {
            context: clientContext(fresh),
            props: {
                collection: BOOKMARK_COLLECTION,
                schema: fresh.fs.bookmarks().schema,
                entry: null,
                onadd: () => Promise.resolve({ ok: true, changed: [], refused: [] }),
                onclose: noop,
                onsaid: noop
            }
        });

        expect(fresh.fs.bookmarks().entries).toEqual([]);
        expect(body).toContain('aria-label="Label"');
        expect(body).toContain('aria-label="Root"');
        expect(body).toContain('aria-label="Path"');
    });
});
