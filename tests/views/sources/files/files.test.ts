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
import RootForm from '../../../../src/lib/views/sources/files/sections/RootForm.svelte';
import Tree from '../../../../src/lib/views/sources/files/tree/Tree.svelte';
import Workspaces from '../../../../src/lib/views/sources/files/sections/Workspaces.svelte';
import { treeKey, treeRows, type FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { installRealText } from '../../shared/real-text.ts';
import { instance } from './files-instance.ts';
import { noop } from '../../../fixtures/doubles.ts';
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

        expect(openers.length).toBeGreaterThanOrEqual(3);
        for (const opener of openers) expect(opener).toMatch(/\bbare\b/);
        // a filter box and a toggle with words are controls of the bar
        expect(header).not.toContain('class="search');
        // the dotfile toggle is a bar control with words, so the header lacks it
        expect(header).not.toContain('hidden files');
        // an icon action draws no words beside the icon, only its tooltip
        expect(header).not.toContain('<span class="label">');
    });

    it('puts the filter box and the two listing toggles as pressable chips in the bar', () => {
        const bar = between(drawn({ hidden: true }), '<div class="viewbar', '<div class="body');
        const chips = bar.match(/<button[^>]*class="chip[^"]*pressable[^"]*"[^>]*>/g) ?? [];

        expect(bar).toMatch(/class="search[^"]*\bfill\b/);
        expect(bar).toContain('aria-label="Filter the folders already read by name"');
        expect(chips.length).toBe(2);
        expect(bar).toContain('hidden files');
        expect(bar).toContain('ignored files');
        expect(chips.every((chip) => /aria-pressed="(true|false)"/.test(chip))).toBe(true);
        // the toggles are chips, so the bar draws no bordered text button
        expect(bar).not.toMatch(/<button[^>]*class="tool[ "]/);
    });

    it('draws the add-root control pressed while its form is open', () => {
        const addRoot = (state: Record<string, unknown>): string =>
            /<button[^>]*aria-label="\+ root"[^>]*>/.exec(
                between(drawn(state), '<header', '</header>')
            )?.[0] ?? '';

        expect(addRoot({ form: 'root' })).toContain('aria-pressed="true"');
        expect(addRoot({})).toContain('aria-pressed="false"');
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
