// The list and tree modes of the Changes section, rendered to HTML on the server: the toggle in the
// view's bar and what it writes into the instance state, the folder rows a group draws in tree
// mode, what a folder row's controls call, and which closed folders the instance keeps when it
// writes its closed sections. The controls, the heads and the confirm dialog are wrapped by a
// recorder that renders the real one and keeps the props the view gave it.
//
// What this does NOT cover: that the browser then puts the keyboard focus on the row it was given,
// which the look on TEST sees. The files of a graph commit are read by an effect, which a server
// rendering never runs, so its cases start the component with the files already read (`seed`).

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Changes from '../../../../src/lib/views/sources/repositories/changes/Changes.svelte';
import CommitFiles from '../../../../src/lib/views/sources/repositories/graph/CommitFiles.svelte';
import AskConfirm from '../../../../src/lib/views/shared/AskConfirm.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import TreeItem from '../../../../src/lib/ui/tree/TreeItem.svelte';
import { folderId } from '../../../../src/lib/state/sources/repositories/change-tree.ts';
import { pressWhenDrawn } from './press-on-render.ts';
import {
    catalog,
    clear,
    drawn,
    git,
    group,
    html as htmlOf,
    HUB,
    HUB_GIT,
    listItem,
    OTHER,
    press,
    fresh
} from './harness.ts';
import type { TreeNav } from '../../../../src/lib/ui/tree/tree-keys.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

vi.mock('../../../../src/lib/views/shared/AskConfirm.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/tree/TreeItem.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

let client: ClientState;

beforeEach(() => {
    client = fresh(AskConfirm, TreeItem, ToolButton);
});

function html(payload: Record<string, unknown>, state: unknown = {}): string {
    return htmlOf(client, payload, state);
}

/** The state the instance keeps now. */
function kept(): Record<string, unknown> {
    return client.ui.instanceState('repositories-one') as Record<string, unknown>;
}

const entry = (path: string, status = 'M') => ({ path, status, added: 1, deleted: 0 });

/** Two staged and two changed paths under `src`, two untracked ones, and files at the root. */
const NESTED = {
    ...HUB_GIT,
    staged: [entry('src/a.ts'), entry('src/b.ts'), entry('top.md')],
    unstaged: [entry('src/c.ts'), entry('src/d.ts'), entry('README.md'), entry('LICENSE')],
    untracked: [entry('new/x.txt', '?'), entry('new/y.txt', '?')]
};

const TOGGLE_TREE = catalog['repositories.view_tree'];
const TOGGLE_LIST = catalog['repositories.view_list'];

/** The toggle in the view's bar, whichever of its two forms is drawn. */
function toggle(): Record<string, unknown> | undefined {
    return drawn(ToolButton).find((one) => one.label === TOGGLE_TREE || one.label === TOGGLE_LIST);
}

describe('the toggle between the list and the tree', () => {
    it('is View as Tree with its icon in list mode, which is where the view starts', () => {
        html({ [HUB]: NESTED });

        expect(toggle()).toMatchObject({ label: TOGGLE_TREE, glyph: 'view_tree' });
    });

    it("is drawn for a state with no repository to draw as well, since the mode is the view's", () => {
        html({ [HUB]: git({ branch: '', repository: false, error: 'not a git repository' }) });

        expect(toggle()).toMatchObject({ label: TOGGLE_TREE });
    });

    it('is View as List with the list icon in tree mode', () => {
        html({ [HUB]: NESTED }, { mode: 'tree' });

        expect(toggle()).toMatchObject({ label: TOGGLE_LIST, glyph: 'list' });
    });

    it('writes tree into the instance state when pressed in list mode, and list when pressed again', () => {
        html({ [HUB]: NESTED });
        press(toggle());
        expect(kept().mode).toBe('tree');

        clear(ToolButton);
        html({ [HUB]: NESTED }, kept());
        press(toggle());
        expect(kept().mode).toBe('list');
    });

    it('is drawn before the menu of More Actions in the bar', () => {
        const body = html({ [HUB]: NESTED });

        expect(body.indexOf(`aria-label="${TOGGLE_TREE}"`)).toBeGreaterThan(-1);
        expect(body.indexOf(`aria-label="${TOGGLE_TREE}"`)).toBeLessThan(
            body.indexOf('data-repo-menu')
        );
    });
});

describe('the groups in tree mode', () => {
    it('draw no folder row in list mode', () => {
        const body = html({ [HUB]: NESTED });

        // the list mode draws files alone, with no folder rows in it
        expect(body).not.toContain('data-folder=');
        expect(body).toContain('data-entry="src/a.ts"');
    });

    it('draw a folder row for the folder of two paths, its files under it and the root files beside it', () => {
        const body = html({ [HUB]: NESTED }, { mode: 'tree' });
        const changes = group(body, 'changes');

        expect(changes).toContain('data-folder="src"');
        expect(changes.indexOf('data-folder="src"')).toBeLessThan(
            changes.indexOf('data-entry="src/a.ts"')
        );
        expect(changes.indexOf('data-entry="src/b.ts"')).toBeLessThan(
            changes.indexOf('data-entry="top.md"')
        );
        // a file at the root of the group has no folder row
        expect(changes).not.toContain('data-folder=""');
    });

    // Red when a change group's folder row is given a file icon.
    it('draw a file icon on each file row and none on a folder row', () => {
        const body = html({ [HUB]: NESTED }, { mode: 'tree' });

        // a folder row stands for a directory, for which the Seti theme draws no icon
        expect(listItem(body, 'data-folder="src"')).not.toContain('data-file-icon');
        expect(listItem(body, 'data-entry="src/a.ts"')).toContain('data-file-icon="typescript"');
    });

    it('draw a file row with no folder after its name', () => {
        const body = html({ [HUB]: NESTED }, { mode: 'tree' });
        const row = listItem(body, 'data-entry="src/a.ts"');

        // a file row in the tree carries no folder after its name, as the folder is the row above
        expect(row).not.toContain('class="folder');
    });

    it('draw the merge group as a list', () => {
        const merging = git({
            sequence: 'merging',
            conflicted: [entry('deep/er/both.txt', 'UU'), entry('deep/er/other.txt', 'UU')]
        });
        for (const mode of ['list', 'tree']) {
            const changes = group(html({ [HUB]: merging }, { mode }), 'changes');
            expect(changes).toContain('data-entry="deep/er/both.txt"');
            // the merge group is a list in both modes, so it holds no folder row
            expect(changes).not.toContain('data-folder=');
        }
    });

    it('draw no row inside a folder the instance keeps closed', () => {
        const closed = folderId(HUB, 'staged', 'src');
        const body = html({ [HUB]: NESTED }, { mode: 'tree', collapsed: [closed] });
        const changes = group(body, 'changes');

        expect(changes).toContain('data-folder="src"');
        // a file inside a closed folder is not drawn
        expect(changes).not.toContain('data-entry="src/a.ts"');
        // the same folder in the changed group is a folder of its own and is open
        expect(changes).toContain('data-entry="src/c.ts"');
    });

    it('keep the folder of another repository open when this repository closed the same folder', () => {
        const closedInHub = folderId(HUB, 'staged', 'src');
        const both = { [HUB]: NESTED, [OTHER]: NESTED };
        const body = html(both, { mode: 'tree', root: OTHER, collapsed: [closedInHub] });

        expect(group(body, 'changes')).toContain('data-entry="src/a.ts"');
    });
});

describe('an untracked folder that git lists as a whole', () => {
    const LISTED = { ...HUB_GIT, untracked: [entry('newdir/', '?'), entry('docs/new/', '?')] };

    /** The props of the row drawn for the path, from the recorder of the rows. */
    function rowOf(path: string): Record<string, unknown> | undefined {
        return drawn(TreeItem).find((one) => one.id === `change:untracked:${path}`);
    }

    // Revert: split the path `newdir/` into a folder row and a file row in changeTree.
    it('is one row named for the folder in the tree, with no row inside it', () => {
        const body = html({ [HUB]: LISTED }, { mode: 'tree' });
        const untracked = listItem(body, 'data-changes="untracked"');

        // git lists the directory whole, so the tree makes no folder row for it, only its file row
        expect(untracked).not.toContain('data-folder="newdir"');
        expect(body.split('data-entry="newdir/"')).toHaveLength(2);
        expect(rowOf('newdir/')).toMatchObject({ label: 'newdir', glyph: 'folder' });
        expect(rowOf('newdir/')?.file).toBeUndefined();
        expect(drawn(TreeItem).filter((one) => one.label === '')).toEqual([]);
    });

    // Revert: name the row `nameOf(entry.path)` in ChangeRow, which is empty for `newdir/`.
    it('is named for the folder in the list too, with its parent folder said after the name', () => {
        const body = html({ [HUB]: LISTED });

        expect(rowOf('newdir/')).toMatchObject({ label: 'newdir', glyph: 'folder' });
        expect(rowOf('docs/new/')).toMatchObject({ label: 'new', glyph: 'folder' });
        expect(listItem(body, 'data-entry="docs/new/"')).toContain('>docs<');
        // the row is the directory itself, so it holds no folder row of a directory inside it
        expect(listItem(body, 'data-entry="newdir/"')).not.toContain('class="folder');
    });
});

describe('the controls of a folder row', () => {
    /** The folder row's control with the hover words `key`, at `at` among those drawn. */
    function control(key: string, at = 0): Record<string, unknown> | undefined {
        return drawn(ToolButton).filter((one) => one.title === catalog[key])[at];
    }

    it('call stagePaths once with exactly the paths under a changed folder', () => {
        const calls: unknown[][] = [];
        client.repositories.stagePaths = (...args: unknown[]): Promise<void> => {
            calls.push(args);
            return Promise.resolve();
        };
        html({ [HUB]: NESTED }, { mode: 'tree' });
        press(control('repositories.folder_stage_title', 0));

        expect(calls).toEqual([[HUB, ['src/c.ts', 'src/d.ts']]]);
    });

    it('call unstagePaths once with exactly the paths under a staged folder', () => {
        const calls: unknown[][] = [];
        client.repositories.unstagePaths = (...args: unknown[]): Promise<void> => {
            calls.push(args);
            return Promise.resolve();
        };
        html({ [HUB]: NESTED }, { mode: 'tree' });
        press(control('repositories.folder_unstage_title'));

        expect(calls).toEqual([[HUB, ['src/a.ts', 'src/b.ts']]]);
    });

    it('ask first when a folder is discarded, naming how many paths, and call discardPaths once on a yes', () => {
        const calls: unknown[][] = [];
        client.repositories.discardPaths = (...args: unknown[]): Promise<void> => {
            calls.push(args);
            return Promise.resolve();
        };
        pressWhenDrawn(
            ToolButton,
            (props) => props.title === catalog['repositories.folder_discard_title']
        );
        html({ [HUB]: NESTED }, { mode: 'tree' });

        expect(calls).toEqual([]);
        const asking = drawn(AskConfirm).at(-1)?.asking as
            { message: string; act: () => void } | null | undefined;
        expect(asking?.message).toBe(
            catalog['repositories.folder_discard_confirm'].replace('{0}', '2').replace('{1}', 'src')
        );
        asking?.act();
        expect(calls).toEqual([[HUB, ['src/c.ts', 'src/d.ts']]]);
    });

    it('carry Stage and no Discard on an untracked folder', () => {
        html({ [HUB]: NESTED }, { mode: 'tree' });
        const stages = drawn(ToolButton).filter(
            (one) => one.title === catalog['repositories.folder_stage_title']
        );
        const discards = drawn(ToolButton).filter(
            (one) => one.title === catalog['repositories.folder_discard_title']
        );

        // the changed folder and the untracked folder each stage; only the changed one discards
        expect(stages).toHaveLength(2);
        expect(discards).toHaveLength(1);
    });

    it('are disabled with the busy words while a write runs on the repository', async () => {
        let release: () => void = () => undefined;
        const held = new Promise<Response>((settle) => {
            release = (): void => settle(new Response('{}', { status: 200 }));
        });
        vi.stubGlobal('fetch', () => held);
        const first = client.repositories.stage(HUB, 'README.md');
        html({ [HUB]: NESTED }, { mode: 'tree' });
        const folder = drawn(ToolButton).filter(
            (one) =>
                one.title === catalog['repositories.folder_stage_title'] ||
                one.title === catalog['repositories.folder_unstage_title'] ||
                one.title === catalog['repositories.folder_discard_title'] ||
                one.title === catalog['git.busy']
        );

        expect(folder.length).toBeGreaterThan(0);
        for (const one of folder) {
            expect(one).toMatchObject({ disabled: true, title: catalog['git.busy'] });
        }
        release();
        await first;
        vi.unstubAllGlobals();
    });
});

describe('the closed folders the instance keeps', () => {
    it('drop the id of a folder that is in none of the groups when the next closed section is written', () => {
        const gone = folderId(HUB, 'staged', 'vanished');
        const still = folderId(HUB, 'staged', 'src');
        html({ [HUB]: NESTED }, { mode: 'tree', collapsed: [gone, still, 'tags'] });
        const head = drawn(TreeItem).find((one) => one.id === 'graph');
        press(head);

        const collapsed = kept().collapsed as string[];
        expect(collapsed).toContain('graph');
        expect(collapsed).toContain(still);
        expect(collapsed).toContain('tags');
        // the id of a folder in no group is pruned when the next closed section is written
        expect(collapsed).not.toContain(gone);
    });
});

describe('a folder that closes over the row that holds the focus', () => {
    /** Changes drawn in tree mode, the focus on `held`; the ids the tree was told to focus. */
    function closing(held: string[], collapsed: string[] = []): string[] {
        const focused: string[] = [];
        const nav: TreeNav = {
            row: () => ({ role: 'treeitem' }),
            list: () => () => undefined,
            focus: (id: string) => focused.push(id),
            kept: () => held
        };
        const body = render(Changes, {
            context: clientContext(client),
            props: {
                root: HUB,
                git: NESTED,
                nav,
                collapsed,
                ontoggle: () => undefined,
                ask: () => undefined,
                mode: 'tree'
            }
        }).body;
        expect(body).toContain('data-folder="src"');
        press(drawn(TreeItem).find((one) => one.id === folderId(HUB, 'staged', 'src')));
        return focused;
    }

    it('takes the focus itself', () => {
        expect(closing(['change:staged:src/a.ts'])).toEqual([folderId(HUB, 'staged', 'src')]);
    });

    it('leaves the focus alone when the focused row is elsewhere', () => {
        expect(closing(['change:changed:src/c.ts'])).toEqual([]);
    });

    it('leaves the focus alone when the folder opens', () => {
        expect(closing(['change:staged:src/a.ts'], [folderId(HUB, 'staged', 'src')])).toEqual([]);
    });
});

describe('a folder of a graph commit that closes over the row that holds the focus', () => {
    const HASH = 'c'.repeat(40);
    const GROUP = `commit-log-${HASH}`;
    const FILES = [
        { status: 'M', path: 'src/a.ts', from: '' },
        { status: 'M', path: 'src/b.ts', from: '' },
        { status: 'A', path: 'top.md', from: '' }
    ];

    /** The commit's files in tree mode, the focus on `held`; the ids the tree was told to focus. */
    function closing(held: string[], collapsed: string[] = []): string[] {
        const focused: string[] = [];
        const nav: TreeNav = {
            row: () => ({ role: 'treeitem' }),
            list: () => () => undefined,
            focus: (id: string) => focused.push(id),
            kept: () => held
        };
        const body = render(CommitFiles, {
            context: clientContext(client),
            props: {
                root: HUB,
                hash: HASH,
                place: 'log',
                nav,
                onrows: () => undefined,
                passing: [],
                open: 0,
                mode: 'tree',
                collapsed,
                seed: FILES
            }
        }).body;
        expect(body).toContain('data-commit-file');
        const src = drawn(TreeItem).find((one) => one.id === folderId(HUB, GROUP, 'src'));
        expect(src).toBeDefined();
        press(src);
        return focused;
    }

    it('takes the focus itself', () => {
        expect(closing([`file:log:${HASH}:src/a.ts`])).toEqual([folderId(HUB, GROUP, 'src')]);
    });

    it('leaves the focus alone when the focused row is elsewhere', () => {
        expect(closing([`file:log:${HASH}:top.md`])).toEqual([]);
    });

    it('leaves the focus alone when the folder opens', () => {
        expect(closing([`file:log:${HASH}:src/a.ts`], [folderId(HUB, GROUP, 'src')])).toEqual([]);
    });
});

describe('the icon of a file of a graph commit', () => {
    const HASH = 'd'.repeat(40);
    const nav: TreeNav = {
        row: () => ({ role: 'treeitem' }),
        list: () => () => undefined,
        focus: () => undefined,
        kept: () => []
    };

    it('is drawn before the name of a file row and on no folder row', () => {
        const body = render(CommitFiles, {
            context: clientContext(client),
            props: {
                root: HUB,
                hash: HASH,
                place: 'log',
                nav,
                onrows: () => undefined,
                passing: [],
                open: 0,
                mode: 'tree',
                seed: [
                    { status: 'M', path: 'src/a.ts', from: '' },
                    { status: 'M', path: 'src/b.ts', from: '' }
                ]
            }
        }).body;
        const rows = body.split(/<li role="none" class="file/).slice(1);

        // the first row is the folder `src`, the next two are its files
        expect(rows).toHaveLength(3);
        // a folder row stands for a directory, for which the Seti theme draws no icon
        expect(rows[0]).not.toContain('data-file-icon');
        for (const row of rows.slice(1)) {
            expect(row).toContain('data-file-icon="typescript"');
            expect(row.indexOf('data-file-icon')).toBeLessThan(row.indexOf('class="name'));
        }
    });
});

describe('the folder of a file of a graph commit', () => {
    const HASH = 'e'.repeat(40);
    const nav: TreeNav = {
        row: () => ({ role: 'treeitem' }),
        list: () => () => undefined,
        focus: () => undefined,
        kept: () => []
    };

    function detailsIn(mode: 'list' | 'tree'): string[] {
        const body = render(CommitFiles, {
            context: clientContext(client),
            props: {
                root: HUB,
                hash: HASH,
                place: 'log',
                nav,
                onrows: () => undefined,
                passing: [],
                open: 0,
                mode,
                seed: [
                    { status: 'M', path: 'src/lib/a.ts', from: '' },
                    { status: 'A', path: 'top.md', from: '' }
                ]
            }
        }).body;
        return [...body.matchAll(/class="detail[^"]*">(.*?)<\/span>/g)].map((one) =>
            one[1].replace(/<!--.*?-->/g, '').trim()
        );
    }

    it('is said after the name in the list, and a file at the root says none', () => {
        expect(detailsIn('list')).toEqual(['src/lib', '']);
    });

    // The tree has the folder as a row above, so a file row carries its name alone.
    it('is not said after the name in the tree', () => {
        expect(detailsIn('tree').every((one) => one === '')).toBe(true);
    });
});

describe('a commit drawn in two lists', () => {
    const HASH = 'e'.repeat(40);
    const nav: TreeNav = {
        row: () => ({ role: 'treeitem' }),
        list: () => () => undefined,
        focus: () => undefined,
        kept: () => []
    };
    const FILES = [
        { status: 'M', path: 'src/a.ts', from: '' },
        { status: 'M', path: 'top.md', from: '' }
    ];

    /** The ids of the tree items one drawing of the commit's files hands the tree. */
    function idsIn(place: string): string[] {
        clear(TreeItem);
        const body = render(CommitFiles, {
            context: clientContext(client),
            props: {
                root: HUB,
                hash: HASH,
                place,
                nav,
                onrows: () => undefined,
                passing: [],
                open: 0,
                mode: 'tree',
                seed: FILES
            }
        }).body;
        expect(body).toContain('data-commit-file');
        return drawn(TreeItem).map((one) => String(one.id));
    }

    // Revert: leave the place out of the ids in CommitFiles.
    it('gives the rows and the folders of each list ids of their own', () => {
        const out = idsIn('out');
        const log = idsIn('log');

        expect(out).toHaveLength(3);
        expect(log).toHaveLength(3);
        expect(out.filter((id) => log.includes(id))).toEqual([]);
        expect(new Set(out).size).toBe(out.length);
    });
});
