// Layer 2, client-state tests. A Files tab's follow mode (state/sources/fs.ts): the folder it
// follows is the session's workspace or a terminal's folder, and the tree is rooted at that folder
// (its head is the folder, read through the root that holds it). A file row's drag carries its
// absolute path. The readers of the `follow` and `session` keys of the layout state are tried in
// tests/state/shared/instance-state-files.test.ts.
//
// Pure functions over plain values; nothing is read or written.

import { describe, expect, it } from 'vitest';
import { absoluteOf } from '../../../src/lib/state/workbench/navigation/pages.ts';
import {
    filesViewOf,
    followRevealed,
    followView,
    followedDirOf,
    filterRows,
    rootHolding,
    treeKeyRows,
    treeRows,
    type FsEntry,
    type FsRoot
} from '../../../src/lib/state/sources/fs.ts';

const HUB: FsRoot = { key: 'hub', dir: '/hub', fixed: true };
const TOOL: FsRoot = { key: 'r1', dir: '/hub/tools/', fixed: false };
const OTHER: FsRoot = { key: 'r2', dir: '/elsewhere', fixed: false };
const ROOTS = [HUB, TOOL, OTHER];

describe('the root a folder lies in', () => {
    it('is the deepest root holding it, with the path inside that root', () => {
        expect(rootHolding(ROOTS, '/hub/tools/oculus')).toEqual({ root: TOOL, path: 'oculus' });
        expect(rootHolding(ROOTS, '/hub/projects/')).toEqual({ root: HUB, path: 'projects' });
        expect(rootHolding(ROOTS, '/hub')).toEqual({ root: HUB, path: '' });
        expect(rootHolding(ROOTS, '/hub/tools')).toEqual({ root: TOOL, path: '' });
    });

    it('is none for a folder no root holds, or one that only shares a prefix', () => {
        expect(rootHolding(ROOTS, '/hubby/x')).toBe(null);
        expect(rootHolding(ROOTS, '/')).toBe(null);
        expect(rootHolding([], '/hub')).toBe(null);
        expect(rootHolding([{ key: 'e', dir: '', fixed: false }], '/hub')).toBe(null);
    });
});

describe("a Files tab's follow mode", () => {
    it('draws a followed folder that is a root as that root, and nothing for one no root holds', () => {
        expect(followView({ follow: true }, ROOTS, '/hub/').top).toEqual({ path: '', name: 'hub' });
        expect(followView({ follow: true }, ROOTS, '/tmp')).toEqual({
            following: true,
            dir: '/tmp',
            found: null,
            roots: [],
            top: null
        });
    });

    it("follows a session's workspace, else its folder, else the selected terminal's folder", () => {
        expect(followedDirOf({ workspace: '/w', cwd: '/w/sub' }, { cwd: '/t' })).toBe('/w');
        expect(followedDirOf({ workspace: '', cwd: '/w/sub' }, null)).toBe('/w/sub');
        expect(followedDirOf({ workspace: '', cwd: null }, { cwd: '/t' })).toBe(null);
        expect(followedDirOf(null, { cwd: '/t' })).toBe('/t');
        expect(followedDirOf(null, { cwd: '' })).toBe(null);
        expect(followedDirOf(null, null)).toBe(null);
    });

    it('opens the line of a root when the followed folder is that root', () => {
        const atRoot = filesViewOf(followRevealed({}, { root: TOOL, path: '' }));
        expect(atRoot.expanded).toEqual(['r1:']);
    });
});

describe('a tree rooted at a folder inside its root', () => {
    const listed: Record<string, FsEntry[]> = {
        'r1:': [{ name: 'oculus', kind: 'dir', size: 0, mtime: 0 }],
        'r1:oculus': [
            { name: 'src', kind: 'dir', size: 0, mtime: 0 },
            { name: 'a.ts', kind: 'file', size: 3, mtime: 0 }
        ],
        'r1:oculus/src': [{ name: 'b.ts', kind: 'file', size: 4, mtime: 0 }]
    };
    const entriesOf = (root: string, path: string): FsEntry[] => listed[`${root}:${path}`] ?? [];
    const top = { path: 'oculus', name: 'oculus' };

    it('draws the folder as its head and what is in it below, with the paths inside the root', () => {
        const rows = treeRows([TOOL], entriesOf, ['r1:oculus', 'r1:oculus/src'], top);
        expect(rows.map((row) => [row.path, row.name, row.depth])).toEqual([
            ['oculus', 'oculus', 0],
            ['oculus/src', 'src', 1],
            ['oculus/src/b.ts', 'b.ts', 2],
            ['oculus/a.ts', 'a.ts', 1]
        ]);
        // the head is drawn closed until the folder itself is open, whatever the root above says
        expect(treeRows([TOOL], entriesOf, ['r1:'], top)).toHaveLength(1);
    });

    it('filters inside the folder only, under the folder as its head', () => {
        const held = (root: string, path: string): FsEntry[] | null =>
            listed[`${root}:${path}`] ?? null;
        const rows = filterRows([TOOL], held, 'b.ts', top);
        expect(rows.map((row) => row.path)).toEqual(['oculus', 'oculus/src', 'oculus/src/b.ts']);
    });

    it('gives the head no parent for the keyboard, and its entries the head', () => {
        const rows = treeRows([TOOL], entriesOf, ['r1:oculus'], top);
        expect(treeKeyRows(rows, false).map((row) => row.parent)).toEqual([
            null,
            'r1:oculus',
            'r1:oculus'
        ]);
    });
});

describe("a file row's drag", () => {
    it('carries the absolute path of the row, the root folder itself for its own line', () => {
        expect(absoluteOf('/hub/tools/', 'oculus/a.ts')).toBe('/hub/tools/oculus/a.ts');
        expect(absoluteOf('/hub', 'a.ts')).toBe('/hub/a.ts');
        expect(absoluteOf('/hub', '')).toBe('/hub');
    });
});
