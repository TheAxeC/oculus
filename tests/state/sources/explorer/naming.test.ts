// Layer 2, client-state tests. The name being typed in the Files view and the paths that follow a
// move: the pending row treeRows draws for a new file or folder and the row it marks for a rename,
// what the view's record keeps of it, what starting a name opens, and where a path, a tab's state,
// a diff pane and a Files view's open folders go when a file or folder moves (explorer/follow.ts).
//
// What this does NOT cover: the input drawn, its keys and its message, which need a DOM
// (tests/views/sources/files/menu/files-naming.test.ts covers the message rules and the markup that
// a server renders); the store that applies a move to the open tabs, which is ops.test.ts.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import {
    filesViewOf,
    rowKey,
    treeKeyRows,
    treeRows,
    type FsEntry,
    type FsRoot
} from '../../../../src/lib/state/sources/fs.ts';
import { namingStarted, pendingPath } from '../../../../src/lib/state/sources/explorer/naming.ts';
import {
    followed,
    followedAny,
    followedDiffTab,
    followedFileTab,
    followedFilesView
} from '../../../../src/lib/state/sources/explorer/follow.ts';
import { diffState } from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const ROOT: FsRoot = { key: 'hub', dir: '/tmp/hub', fixed: true };

const LISTINGS: Record<string, FsEntry[]> = {
    'hub:': [{ name: 'dir', kind: 'dir', size: 0, mtime: 1 }],
    'hub:dir': [
        { name: 'a.md', kind: 'file', size: 1, mtime: 1 },
        { name: 'sub', kind: 'dir', size: 0, mtime: 1 }
    ]
};

const entriesOf = (root: string, path: string): FsEntry[] => LISTINGS[`${root}:${path}`] ?? [];

describe('the row of a name being typed', () => {
    const expanded = ['hub:', 'hub:dir'];

    // Revert: draw the pending row after the folder's entries instead of before them.
    it('draws a new file as the first row under its folder, one level in, with no name yet', () => {
        const rows = treeRows([ROOT], entriesOf, expanded, null, {
            mode: 'file',
            root: 'hub',
            path: 'dir'
        });
        expect(rows.map(rowKey)).toEqual([
            'hub:',
            'hub:dir',
            'hub:dir/',
            'hub:dir/a.md',
            'hub:dir/sub'
        ]);
        expect(rows[2]).toEqual({
            root: 'hub',
            path: pendingPath('dir'),
            name: '',
            kind: 'file',
            size: 0,
            depth: 2,
            open: false,
            editing: 'new'
        });
    });

    it("draws a new folder as a folder row, and one in a root as the root's first row", () => {
        const rows = treeRows([ROOT], entriesOf, expanded, null, {
            mode: 'folder',
            root: 'hub',
            path: ''
        });
        expect(rows[1]).toMatchObject({ path: '/', kind: 'dir', depth: 1, editing: 'new' });
    });

    it('draws no pending row while its folder is closed', () => {
        const rows = treeRows([ROOT], entriesOf, ['hub:'], null, {
            mode: 'file',
            root: 'hub',
            path: 'dir'
        });
        expect(rows.some((row) => row.editing !== undefined)).toBe(false);
    });

    // Revert: mark every row of the folder as being renamed, or none.
    it('marks the row being renamed and no other, and leaves every other row without the field', () => {
        const rows = treeRows([ROOT], entriesOf, expanded, null, {
            mode: 'rename',
            root: 'hub',
            path: 'dir/a.md'
        });
        expect(rows.filter((row) => row.editing !== undefined).map(rowKey)).toEqual([
            'hub:dir/a.md'
        ]);
        expect(rows.find((row) => row.path === 'dir/a.md')?.editing).toBe('rename');
        for (const row of rows.filter((one) => one.path !== 'dir/a.md')) {
            expect('editing' in row).toBe(false);
        }
    });

    it('is a row of the keyboard under its folder', () => {
        const rows = treeRows([ROOT], entriesOf, expanded, null, {
            mode: 'file',
            root: 'hub',
            path: 'dir'
        });
        expect(treeKeyRows(rows, false).find((row) => row.id === 'hub:dir/')?.parent).toBe(
            'hub:dir'
        );
        const top = treeRows([ROOT], entriesOf, expanded, null, {
            mode: 'file',
            root: 'hub',
            path: ''
        });
        expect(treeKeyRows(top, false).find((row) => row.id === 'hub:/')?.parent).toBe('hub:');
    });
});

describe('what the view keeps of the name', () => {
    it('reads a name it kept, and none for anything else', () => {
        expect(
            filesViewOf({ naming: { mode: 'rename', root: 'hub', path: 'a.md' } }).naming
        ).toEqual({
            mode: 'rename',
            root: 'hub',
            path: 'a.md'
        });
        for (const bad of [
            { mode: 'copy', root: 'hub', path: 'a' },
            { mode: 'file', root: '', path: 'a' },
            { mode: 'file', root: 'hub' },
            { mode: 'rename', root: 'hub', path: '' }
        ]) {
            expect(filesViewOf({ naming: bad }).naming, JSON.stringify(bad)).toBeNull();
        }
    });

    // Revert: leave the folders above the row closed when a name starts.
    it('opens the folders a new item sits in, and those above a renamed row', () => {
        const fresh = namingStarted(['other:'], 'file', { root: 'hub', path: 'dir/sub' });
        expect(fresh.naming).toEqual({ mode: 'file', root: 'hub', path: 'dir/sub' });
        expect(fresh.expanded.toSorted()).toEqual(['hub:', 'hub:dir', 'hub:dir/sub', 'other:']);
        const rename = namingStarted([], 'rename', { root: 'hub', path: 'dir/a.md' });
        expect(rename.expanded.toSorted()).toEqual(['hub:', 'hub:dir']);
        expect(namingStarted([], 'folder', { root: 'hub', path: '' }).expanded).toEqual(['hub:']);
    });

    it('clears the filter when a name starts', () => {
        expect(namingStarted([], 'file', { root: 'hub', path: 'dir' }).filter).toBe('');
    });
});

describe('where a path goes when something moves', () => {
    const move = { from: { root: 'hub', path: 'dir' }, to: { root: 'hub', path: 'dir2' } };

    // Revert: match on the string prefix without the separator.
    it('follows the moved path and what lies under it, and not a sibling with the same prefix', () => {
        expect(followed({ root: 'hub', path: 'dir' }, move)).toEqual(move.to);
        expect(followed({ root: 'hub', path: 'dir/sub/x.md' }, move)).toEqual({
            root: 'hub',
            path: 'dir2/sub/x.md'
        });
        expect(followed({ root: 'hub', path: 'dirx/x.md' }, move)).toBeNull();
        expect(followed({ root: 'other', path: 'dir/x.md' }, move)).toBeNull();
        expect(followed({ root: 'hub', path: '' }, move)).toBeNull();
    });

    it('follows a move into another root, and a move out of the top of a root', () => {
        const across = {
            from: { root: 'hub', path: 'a.md' },
            to: { root: 'work', path: 'b/a.md' }
        };
        expect(followed({ root: 'hub', path: 'a.md' }, across)).toEqual(across.to);
        const top = { from: { root: 'hub', path: 'a' }, to: { root: 'hub', path: '' } };
        expect(followed({ root: 'hub', path: 'a/b.md' }, top)).toEqual({
            root: 'hub',
            path: 'b.md'
        });
    });

    it('takes the first of several moves that touches a path', () => {
        const first = { from: { root: 'hub', path: 'a' }, to: { root: 'hub', path: 'b' } };
        const second = { from: { root: 'hub', path: 'a' }, to: { root: 'hub', path: 'c' } };
        expect(followedAny({ root: 'hub', path: 'a/x' }, [first, second])).toEqual({
            root: 'hub',
            path: 'b/x'
        });
        expect(followedAny({ root: 'hub', path: 'z' }, [first, second])).toBeNull();
    });
});

describe('what a move does to a tab', () => {
    const moves = [
        { from: { root: 'hub', path: 'dir/a.md' }, to: { root: 'hub', path: 'dir/b.md' } }
    ];

    it('restates a source, file and document tab, and relabels only where the label was the name', () => {
        expect(
            followedFileTab(
                'source',
                { root: 'hub', path: 'dir/a.md', label: 'a.md', line: 4 },
                moves
            )
        ).toEqual({ root: 'hub', path: 'dir/b.md', label: 'b.md', line: 4 });
        expect(
            followedFileTab('file', { root: 'hub', path: 'dir/a.md', label: 'Mine' }, moves)
        ).toEqual({ root: 'hub', path: 'dir/b.md', label: 'Mine' });
        expect(
            followedFileTab(
                'document',
                { id: 'hub/dir/a.md', root: 'hub', path: 'dir/a.md', label: 'a.md' },
                moves
            )
        ).toEqual({ id: 'hub/dir/b.md', root: 'hub', path: 'dir/b.md', label: 'b.md' });
    });

    it('leaves a tab of another view, a tab elsewhere and a state that is no tab state alone', () => {
        expect(followedFileTab('terminal', { root: 'hub', path: 'dir/a.md' }, moves)).toBeNull();
        expect(followedFileTab('source', { root: 'hub', path: 'dir/z.md' }, moves)).toBeNull();
        expect(followedFileTab('source', 'text', moves)).toBeNull();
        expect(followedFileTab('source', { root: 'hub', path: '' }, moves)).toBeNull();
    });

    // Revert: follow the path of a commit's diff pane as a file's.
    it('follows a diff pane over a file but not one over a commit, a stash, a worktree or a group', () => {
        const base = { root: 'hub', path: 'dir/a.md', staged: false, worktree: false };
        expect(followedDiffTab(diffState(base, 'a.md'), moves)).toMatchObject({ path: 'dir/b.md' });
        for (const history of [{ commit: 'abc' }, { stash: 'stash@{0}' }, { worktree: true }]) {
            expect(followedDiffTab(diffState({ ...base, ...history }, 'x'), moves)).toBeNull();
        }
        expect(
            followedDiffTab(diffState({ ...base, path: '', group: 'staged' }, 'x'), moves)
        ).toBeNull();
    });

    // Revert: leave `session` out of the subject followedDiffTab rebuilds.
    it("keeps a session's diff pane that session when its file moves, and the id carries both", () => {
        const base = { root: 'hub', path: 'dir/a.md', staged: false, worktree: false };
        const followedTab = followedDiffTab(diffState({ ...base, session: 's-1' }, 'a.md'), moves);
        expect(followedTab).toMatchObject({ path: 'dir/b.md', session: 's-1' });
        expect(followedTab?.id).toBe('changed@s-1:hub:dir/b.md');
        // a pane opened from the Repositories view has no session
        const plain = followedDiffTab(diffState(base, 'a.md'), moves);
        expect(plain?.id).toBe('changed:hub:dir/b.md');
        expect(plain?.session ?? '').toBe('');
    });

    it('relabels a comparison titled by the names of its files, and keeps any other title', () => {
        const base = {
            root: 'hub',
            path: 'x.md',
            staged: false,
            worktree: false,
            against: { root: 'hub', path: 'dir/a.md' }
        };
        const titled = followedDiffTab(
            diffState(base, t('files.compare_title', 'a.md', 'x.md')),
            moves
        );
        expect(titled?.label).toBe(t('files.compare_title', 'b.md', 'x.md'));
        expect(followedDiffTab(diffState(base, 'My title'), moves)?.label).toBe('My title');
    });

    // Revert: leave the selected row at its old path.
    it('moves the open folders and the selected row of a Files view', () => {
        const dirs = [{ from: { root: 'hub', path: 'dir' }, to: { root: 'hub', path: 'dir2' } }];
        expect(
            followedFilesView(
                {
                    expanded: ['hub:', 'hub:dir', 'hub:dir/sub', 'hub:other'],
                    selected: { root: 'hub', path: 'dir/a.md' },
                    filter: 'x'
                },
                dirs
            )
        ).toMatchObject({
            expanded: ['hub:', 'hub:dir2', 'hub:dir2/sub', 'hub:other'],
            selected: { root: 'hub', path: 'dir2/a.md' },
            filter: 'x'
        });
        expect(followedFilesView({ expanded: ['hub:other'], selected: null }, dirs)).toBeNull();
    });
});
