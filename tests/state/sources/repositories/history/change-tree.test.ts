// The tree mode of a change group: how a list of paths falls into folders, how a folder is named
// and told apart from a section and from the same folder in another group or repository, which rows
// the keyboard reads, and which closed folders the instance keeps. Pure, so each case is a list of
// paths written out here.

import { describe, expect, it } from 'vitest';
import {
    changeTree,
    dirOf,
    folderId,
    folderPathsOf,
    insideFolder,
    leafOf,
    prunedCollapsed,
    withoutClosedCommits,
    repositoryKeyRows,
    visibleRows,
    type KeyRow
} from '../../../../../src/lib/state/sources/repositories/change-tree.ts';
import { git } from '../../../../fixtures/sessions-fixture.ts';

/** The paths as entries, which is all the tree reads of one. */
function entries(...paths: string[]): { path: string; status: string }[] {
    return paths.map((path) => ({ path, status: 'M' }));
}

/** Each row as `kind name@depth`, in the order they are drawn. */
function shape(paths: string[]): string[] {
    return changeTree(entries(...paths)).map((row) => `${row.kind} ${row.name}@${row.depth}`);
}

describe('the tree of a change group', () => {
    it('puts two files of one folder under it and the file at the root beside it', () => {
        expect(shape(['src/a/x.ts', 'src/a/y.ts', 'readme.md'])).toEqual([
            'folder src/a@0',
            'file x.ts@1',
            'file y.ts@1',
            'file readme.md@0'
        ]);
    });

    it('joins a chain of folders with one child each into one row and puts the file under it', () => {
        expect(shape(['a/b/c/one.ts'])).toEqual(['folder a/b/c@0', 'file one.ts@1']);
    });

    it('keeps a folder that holds a folder and a file as its own row', () => {
        expect(shape(['a/one.ts', 'a/b/two.ts'])).toEqual([
            'folder a@0',
            'folder b@1',
            'file two.ts@2',
            'file one.ts@1'
        ]);
    });

    it('keeps spaces in a folder name and a file name', () => {
        expect(shape(['docs/my notes/a b.md', 'docs/z.md'])).toEqual([
            'folder docs@0',
            'folder my notes@1',
            'file a b.md@2',
            'file z.md@1'
        ]);
    });

    it('gives no rows for no paths, and sorts by base letter with ties in code unit order', () => {
        expect(changeTree([])).toEqual([]);
        expect(shape(['B.ts', 'a.ts', 'A.ts'])).toEqual([
            'file A.ts@0',
            'file a.ts@0',
            'file B.ts@0'
        ]);
        // an accented e sorts beside e, not after z, and e comes before it as a tie by code unit
        expect(shape(['f.ts', '\u00e9.ts', 'e.ts'])).toEqual([
            'file e.ts@0',
            'file \u00e9.ts@0',
            'file f.ts@0'
        ]);
    });

    it('sorts the folders before the files, each by name', () => {
        expect(shape(['z.md', 'b/x.ts', 'a/y.ts', 'a.md'])).toEqual([
            'folder a@0',
            'file y.ts@1',
            'folder b@0',
            'file x.ts@1',
            'file a.md@0',
            'file z.md@0'
        ]);
    });

    it('carries the whole folder path and every path under a folder on its row', () => {
        const rows = changeTree(entries('a/b/c/one.ts', 'a/b/c/two.ts'));
        expect(rows[0]).toMatchObject({
            kind: 'folder',
            path: 'a/b/c',
            paths: ['a/b/c/one.ts', 'a/b/c/two.ts']
        });
        expect(rows[1]).toMatchObject({ kind: 'file', path: 'a/b/c/one.ts', name: 'one.ts' });
    });

    it('draws the paths of this repository as the brief names them', () => {
        expect(shape(['tools/oculus/DESIGN.md', 'tools/oculus/HELP.md'])).toEqual([
            'folder tools/oculus@0',
            'file DESIGN.md@1',
            'file HELP.md@1'
        ]);
        expect(shape(['tools/oculus/src/lib/themes/tokens.css'])).toEqual([
            'folder tools/oculus/src/lib/themes@0',
            'file tokens.css@1'
        ]);
        expect(shape(['CLAUDE.md', 'tools/oculus/README.md'])).toEqual([
            'folder tools/oculus@0',
            'file README.md@1',
            'file CLAUDE.md@0'
        ]);
        expect(shape(['tools/oculus/src/a.ts', 'tools/oculus/tests/b.ts'])).toEqual([
            'folder tools/oculus@0',
            'folder src@1',
            'file a.ts@2',
            'folder tests@1',
            'file b.ts@2'
        ]);
        expect(
            shape([
                'docs/AGENT-APPROACH.md',
                'docs/HPC-UTwente-howto.md',
                'tools/figures/gen_figures.py'
            ])
        ).toEqual([
            'folder docs@0',
            'file AGENT-APPROACH.md@1',
            'file HPC-UTwente-howto.md@1',
            'folder tools/figures@0',
            'file gen_figures.py@1'
        ]);
    });
});

describe('the folder a path sits in', () => {
    it('is the path without its last part, and empty for a path at the root', () => {
        expect(dirOf('src/lib/a.ts')).toBe('src/lib');
        expect(dirOf('a/b.md')).toBe('a');
        expect(dirOf('top.md')).toBe('');
        expect(dirOf('')).toBe('');
    });
});

describe('the ids of the folders of a change group', () => {
    it('tells one folder apart in two groups and in two repositories', () => {
        expect(folderId('/hub', 'staged', 'src')).not.toBe(folderId('/hub', 'changed', 'src'));
        expect(folderId('/hub', 'staged', 'src')).not.toBe(folderId('/other', 'staged', 'src'));
        expect(folderId('/hub', 'staged', 'src')).toBe(folderId('/hub', 'staged', 'src'));
    });

    it('never equals the id of a section, a group or the repositories head', () => {
        const taken = ['changes', 'graph', 'staged', 'changed', 'untracked', 'merge', 'repos'];
        for (const path of ['changes', 'graph', 'staged', 'repos', '', 'src']) {
            expect(taken).not.toContain(folderId('', 'staged', path));
            expect(taken).not.toContain(folderId('/hub', 'changed', path));
        }
    });

    it('gives a file at the root of the group no folder row and so no folder id', () => {
        const rows = changeTree(entries('README.md', 'LICENSE'));
        expect(rows.filter((row) => row.kind === 'folder')).toEqual([]);
        expect(folderPathsOf(rows)).toEqual([]);
    });
});

describe('the rows the keyboard reads in tree mode', () => {
    const state = git({
        staged: [
            { path: 'src/a.ts', status: 'M', added: 1, deleted: 0 },
            { path: 'src/b.ts', status: 'M', added: 1, deleted: 0 },
            { path: 'top.md', status: 'M', added: 1, deleted: 0 }
        ]
    });
    const ids = (rows: KeyRow[]): string[] => rows.map((row) => row.id);

    it('lists the folder row and the files under it, in the order they are drawn', () => {
        const rows = repositoryKeyRows(state, [], [], { root: '/hub', mode: 'tree' });
        expect(ids(rows).filter((id) => id.startsWith('dir:') || id.startsWith('change:'))).toEqual(
            [
                folderId('/hub', 'staged', 'src'),
                'change:staged:src/a.ts',
                'change:staged:src/b.ts',
                'change:staged:top.md'
            ]
        );
        const folder = rows.find((row) => row.id === folderId('/hub', 'staged', 'src'));
        expect(folder).toMatchObject({ parent: 'group:staged', open: true });
        expect(rows.find((row) => row.id === 'change:staged:src/a.ts')?.parent).toBe(folder?.id);
    });

    it('leaves a row inside a closed folder out', () => {
        const closed = folderId('/hub', 'staged', 'src');
        const rows = repositoryKeyRows(state, [closed], [], { root: '/hub', mode: 'tree' });
        expect(ids(rows)).toContain(closed);
        expect(ids(rows)).not.toContain('change:staged:src/a.ts');
        expect(ids(rows)).toContain('change:staged:top.md');
        expect(rows.find((row) => row.id === closed)?.open).toBe(false);
    });

    it('lists no folder row in list mode, whatever the instance kept closed', () => {
        const kept = [folderId('/hub', 'staged', 'src')];
        const rows = repositoryKeyRows(state, kept, [], { root: '/hub', mode: 'list' });
        expect(ids(rows).some((id) => id.startsWith('dir:'))).toBe(false);
        expect(ids(rows)).toContain('change:staged:src/a.ts');
    });

    it('keeps the merge group a list in tree mode', () => {
        const merging = git({
            conflicted: [{ path: 'x/y/both.txt', status: 'UU', added: 0, deleted: 0 }]
        });
        const rows = repositoryKeyRows(merging, [], [], { root: '/hub', mode: 'tree' });
        expect(ids(rows).some((id) => id.startsWith('dir:'))).toBe(false);
        expect(ids(rows)).toContain('change:merge:x/y/both.txt');
    });
});

describe('an untracked folder git lists as a whole', () => {
    // Revert: split `newdir/` at its slash in changeTree, which makes a file row named ''.
    it('is one file row named for the folder, and no row has an empty name', () => {
        expect(changeTree([{ path: 'newdir/' }])).toEqual([
            { kind: 'file', name: 'newdir', path: 'newdir/', depth: 0, entry: { path: 'newdir/' } }
        ]);
        const nested = changeTree(entries('a/b/newdir/', 'a/b/x.ts'));
        expect(nested.map((row) => `${row.kind} ${row.name}@${row.depth}`)).toEqual([
            'folder a/b@0',
            'file newdir@1',
            'file x.ts@1'
        ]);
        expect(nested.every((row) => row.name !== '')).toBe(true);
        expect(nested[1].path).toBe('a/b/newdir/');
    });

    it('is named by its last part, and sits in the folder above it', () => {
        expect(leafOf('newdir/')).toBe('newdir');
        expect(leafOf('a/newdir/')).toBe('newdir');
        expect(leafOf('a/file.ts')).toBe('file.ts');
        expect(dirOf('newdir/')).toBe('');
        expect(dirOf('a/b/newdir/')).toBe('a/b');
        expect(dirOf('a/file.ts')).toBe('a');
    });
});

describe('the closed folders the instance keeps', () => {
    it('drops a folder id of the shown repository whose folder is in no group', () => {
        const state = git({
            staged: [
                { path: 'src/a.ts', status: 'M', added: 1, deleted: 0 },
                { path: 'src/b.ts', status: 'M', added: 1, deleted: 0 }
            ]
        });
        const kept = [
            'graph',
            folderId('/hub', 'staged', 'src'),
            folderId('/hub', 'staged', 'gone'),
            folderId('/hub', 'changed', 'src'),
            folderId('/other', 'staged', 'gone')
        ];
        expect(prunedCollapsed(kept, '/hub', state, '')).toEqual([
            'graph',
            folderId('/hub', 'staged', 'src'),
            folderId('/other', 'staged', 'gone')
        ]);
    });

    // Revert: keep every commit folder id in prunedCollapsed and withoutClosedCommits.
    it('drops the folder ids of the commits of the repository other than the open one', () => {
        const kept = [
            'graph',
            folderId('/hub', 'commit-log-abc123', 'src'),
            folderId('/hub', 'commit-in-abc123', 'src'),
            folderId('/hub', 'commit-log-def456', 'src'),
            folderId('/other', 'commit-log-def456', 'src')
        ];
        const open = [
            'graph',
            folderId('/hub', 'commit-log-abc123', 'src'),
            folderId('/hub', 'commit-in-abc123', 'src'),
            folderId('/other', 'commit-log-def456', 'src')
        ];
        expect(withoutClosedCommits(kept, '/hub', 'abc123')).toEqual(open);
        expect(prunedCollapsed(kept, '/hub', git({}), 'abc123')).toEqual(open);
        expect(withoutClosedCommits(kept, '/hub', '')).toEqual(['graph', open[3]]);
    });

    it('answers whether a focused row is inside a folder that closes', () => {
        const id = folderId('/hub', 'staged', 'src');
        expect(insideFolder('change:staged:src/a.ts', '/hub', 'staged', 'src')).toBe(true);
        expect(insideFolder('change:changed:src/a.ts', '/hub', 'staged', 'src')).toBe(false);
        expect(insideFolder('change:staged:srcx/a.ts', '/hub', 'staged', 'src')).toBe(false);
        expect(insideFolder(folderId('/hub', 'staged', 'src/deep'), '/hub', 'staged', 'src')).toBe(
            true
        );
        expect(insideFolder(id, '/hub', 'staged', 'src')).toBe(false);
    });

    it('answers it for the files of a graph commit by the prefix their ids begin with', () => {
        const group = 'commit-abc';
        const prefix = 'file:abc:';
        expect(insideFolder('file:abc:src/a.ts', '/hub', group, 'src', prefix)).toBe(true);
        expect(insideFolder('file:abd:src/a.ts', '/hub', group, 'src', prefix)).toBe(false);
        expect(insideFolder('file:abc:srcx/a.ts', '/hub', group, 'src', prefix)).toBe(false);
        expect(
            insideFolder(folderId('/hub', group, 'src/deep'), '/hub', group, 'src', prefix)
        ).toBe(true);
    });

    it('hides the rows under a folder the reader closed, and only those', () => {
        const rows = changeTree(entries('a/x.ts', 'a/y.ts', 'b/z.ts'));
        const shown = visibleRows(rows, (path) => path === 'a').map((row) => row.name);
        expect(shown).toEqual(['a', 'b', 'z.ts']);
    });
});
