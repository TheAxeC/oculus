// The file browser rendered to HTML on the server: the explorer's root heads with the controls the
// roots are changed from, the tree's rows for one root and its first level, the three sections
// under the trees, and the form the instance's state says is open.
//
// The catalog and the glyphs are the real config; the rows are built by state/sources/fs.ts from
// synthetic listings, so the tree is drawn without a server. What this does NOT cover: the fetches
// state/sources/fs.svelte.ts makes, which need a server; and pressing a control or a key, which no
// server rendering runs.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import Files from '../../../../src/lib/views/sources/files/Files.svelte';
import Tree from '../../../../src/lib/views/shared/explorer/tree/Tree.svelte';
import { rowKey, treeKey, treeRows, type FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import { rowFacts } from '../../../../src/lib/views/shared/explorer/tree/menu/row-menu.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { installRealText } from '../../shared/real-text.ts';
import { instance } from './files-instance.ts';
import { treePropsOver } from './files-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import { between } from '../../shared/pane-parts.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

installRealText();

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
    return treePropsOver(ROWS, over);
}

/** One row of a rendering, from its attribute to the end of its list item. */
function rowOf(body: string, key: string): string {
    const at = body.indexOf(`data-fs-row="${key}"`);
    return at < 0 ? '' : body.slice(at, body.indexOf('</li>', at));
}

describe('the file browser as a tab', () => {
    // Revert: drop the Search from Files.svelte.
    it('offers the filter over the trees and no Workspaces section', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });

        expect(body).toContain('aria-label="Filter the folders already read by name"');
        // the Workspaces section is not drawn in the body of a Files tab
        expect(body).not.toContain('data-fs-workspaces');
        // the workspace header belongs to the tree, which is still being read here
        expect(body).not.toContain('Configured roots');
        // saving a workspace under a name is asked through the palette, not by a control here
        expect(body).not.toContain('aria-label="save as"');
    });

    // Revert: draw the Controls partial with the workspace menu or the add-root control again.
    it('offers no workspace menu and no add-root control on its header', () => {
        const { body } = render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        });
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));

        expect(body).toContain('Reading...');
        // the view header holds only the follow toggle; the workspace menu is the tree's own header
        expect(header).not.toContain('aria-label="Workspace"');
        // no control of the view header opens a menu
        expect(header).not.toContain('aria-haspopup="menu"');
        // adding a folder is an item of the tree's workspace header, which is not drawn yet
        expect(header).not.toContain('aria-label="+ root"');
    });
});

describe('where the file browser puts its controls', () => {
    /** The view over the file browser state this case put into the instance's own ui state. */
    function drawn(state: Record<string, unknown> = {}): string {
        client.ui.setInstanceState('files-one', state);
        return render(Files, {
            context: clientContext(client),
            props: { instance: instance() }
        }).body;
    }

    it('keeps only bare icon actions in the header', () => {
        const header = between(drawn(), '<header', '</header>');
        const openers = header.match(/<button[^>]*class="(?:tool|opener)[^"]*"[^>]*>/g) ?? [];

        // the follow toggle is the one control left on the header of an unpinned tab
        expect(openers.length).toBe(1);
        for (const opener of openers) expect(opener).toMatch(/\bbare\b/);
        // a filter box and a toggle with words are controls of the bar
        expect(header).not.toContain('class="search');
        // the dotfile toggle is a bar control with words, so the header lacks it
        expect(header).not.toContain('hidden files');
        // an icon action draws no words beside the icon, only its tooltip
        expect(header).not.toContain('<span class="label">');
    });

    // Revert: draw the hidden and ignored toggles in Filters.svelte again.
    it('puts the filter box and the fuzzy toggle as a pressable chip in the bar, and no listing toggle', () => {
        const bar = between(drawn({ fuzzy: true }), '<div class="viewbar', '<div class="body');
        const chips = bar.match(/<button[^>]*class="chip[^"]*pressable[^"]*"[^>]*>/g) ?? [];

        expect(bar).toMatch(/class="search[^"]*\bfill\b/);
        expect(bar).toContain('aria-label="Filter the folders already read by name"');
        expect(chips.length).toBe(1);
        expect(chips[0]).toContain('aria-pressed="true"');
        expect(bar).toContain('Fuzzy Match');
        // the listing toggles moved to the workspace header's menu
        expect(bar).not.toContain('hidden files');
        // the ignored toggle moved with the other listing toggles to the workspace menu
        expect(bar).not.toContain('ignored files');
        // the toggle is a chip, so the bar draws no bordered text button
        expect(bar).not.toMatch(/<button[^>]*class="tool[ "]/);
    });

    it('says a refusal as the message box', () => {
        const body = drawn({ note: 'That root is not a folder.' });
        expect(body).toMatch(/<p class="empty[^"]*\berror\b[^"]*"[^>]*role="alert"/);
        expect(body).toContain('That root is not a folder.');
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

    // Revert: pass `depth={row.depth + 1}` to the row in FileRow.svelte.
    it('draws one indent guide per level under the root, and none on a root', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });
        const guides = (key: string): number => rowOf(body, key).split('class="guide').length - 1;

        expect(guides('hub:')).toBe(0);
        expect(guides('hub:code')).toBe(1);
        expect(guides('hub:code/run.py')).toBe(2);
    });

    // Revert: draw `heading` on the root row's TreeItem in FileRow.svelte.
    it('draws a root as a folder row at the first level, with no head in small capitals', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        // a root row is drawn as a folder row, not as a section head
        expect(rowOf(body, 'hub:')).not.toContain('heading');
        // a folder under a root never had the section head look either
        expect(rowOf(body, 'hub:code')).not.toContain('heading');
        expect(rowOf(body, 'hub:')).toContain('aria-level="1"');
        expect(rowOf(body, 'hub:')).toContain('data-glyph="folder"');
    });

    // Revert: take `fixed` out of the `removable` test in rowFacts, in tree/menu/row-menu.ts.
    it('audits that offers a removal on a reader-added root and none on a configured one', () => {
        const rows = new Map(ROWS.map((row) => [rowKey(row), row]));
        const explorer = { clipboard: () => null, compareFile: () => null };
        const facts = (key: string): boolean => {
            const row = rows.get(key);
            if (row === undefined) throw new Error(`no row ${key}`);
            return rowFacts(row, ['hub'], false, explorer, new Map()).removable;
        };

        // the hub root is configured, and only a root the reader added is offered a removal
        expect(facts('hub:')).toBe(false);
        expect(facts('notes:')).toBe(true);
        // a folder under a root is never removed from the workspace
        expect(facts('hub:code')).toBe(false);
    });

    // Revert: draw refresh, collapse all or a removal as a hover control on a root row.
    it('draws no hover control on a root row, since the header holds refresh and collapse', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });
        const head = rowOf(body, 'notes:');

        // the workspace menu sits in the tree's header, which this render leaves out
        expect(body).not.toContain('aria-label="Workspace"');
        // the control that adds a folder sits in that same header, not on a row
        expect(body).not.toContain('aria-label="+ root"');
        // refresh is a control of the workspace header, so a root row has none
        expect(head).not.toContain('aria-label="refresh"');
        // collapsing every folder is also a control of the workspace header, so a root row has none
        expect(head).not.toContain('aria-label="collapse all"');
        // removing a root is an item of the row's menu, not a hover control
        expect(head).not.toContain('aria-label="remove"');
        // a root is not bookmarked either: its path is empty
        expect(head).not.toContain('aria-label="bookmark"');
    });

    // Revert: draw the new-tab control on a folder row in FileRow.svelte, or the star on none.
    it('offers the bookmark to a file and a folder and the new-tab control to a file only', () => {
        const { body } = render(Tree, { context: clientContext(client), props: treeProps() });

        expect(rowOf(body, 'hub:README.md')).toContain('aria-label="bookmark"');
        expect(rowOf(body, 'hub:README.md')).toContain('aria-label="open in a new tab"');
        // a folder carries the star a file does
        expect(rowOf(body, 'hub:code')).toContain('aria-label="bookmark"');
        // but the new-tab control opens a file
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

describe('the marks the tree draws', () => {
    // Revert: draw a folder row with the file glyph in Tree.svelte's glyphOf.
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
                '../../../../src/lib/views/shared/explorer/tree/Tree.svelte'
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

describe('the Files view as it is written', () => {
    // An audit: the breadcrumb is the tab strip's over a file tab, not the Files tree's.
    // Revert: draw Breadcrumb in Files.svelte again.
    it('audits that draws no breadcrumb over its tree', () => {
        const written = readFileSync(
            join(
                dirname(fileURLToPath(import.meta.url)),
                '../../../../src/lib/views/sources/files/Files.svelte'
            ),
            'utf8'
        );
        // the tab strip draws the path over a file tab, so the tree holds no path row of its own
        expect(written).not.toContain('Breadcrumb');
        // the segments of a path are cut by the tab strip's own module and not by the tree
        expect(written).not.toContain('crumbsOf');
    });
});
