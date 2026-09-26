// Layer 2, client-state tests. A Files tab's follow mode (state/sources/fs.ts): the tab follows
// when its layout state says `follow: true`, the folder it follows is the session's workspace or a
// terminal's folder, the tree is rooted at that folder (its head is the folder, read through the
// root that holds it), and a pin keeps the tab on one session. A file row's drag carries its
// absolute path.
//
// Pure functions over plain values; nothing is read or written.

import { describe, expect, it } from 'vitest';
import {
    absoluteOf,
    filesViewOf,
    followRevealed,
    followView,
    followedDirOf,
    followsSession,
    filterRows,
    rootHolding,
    treeKeyRows,
    treeRows,
    withFollow,
    withFollowPin,
    type FsEntry,
    type FsRoot
} from '../../../src/lib/state/sources/fs.ts';

const HUB: FsRoot = { key: 'hub', dir: '/hub', fixed: true };
const TOOL: FsRoot = { key: 'r1', dir: '/hub/tools/', fixed: false };
const OTHER: FsRoot = { key: 'r2', dir: '/elsewhere', fixed: false };
const ROOTS = [HUB, TOOL, OTHER];

describe('the root a folder lies in', () => {
    // revert: src/lib/state/sources/fs.ts:784 => if (best === null) best = { root, path: inside };
    it('is the deepest root holding it, with the path inside that root', () => {
        expect(rootHolding(ROOTS, '/hub/tools/oculus')).toEqual({ root: TOOL, path: 'oculus' });
        expect(rootHolding(ROOTS, '/hub/projects/')).toEqual({ root: HUB, path: 'projects' });
        expect(rootHolding(ROOTS, '/hub')).toEqual({ root: HUB, path: '' });
        expect(rootHolding(ROOTS, '/hub/tools')).toEqual({ root: TOOL, path: '' });
    });

    // revert: src/lib/state/sources/fs.ts:780 => : wanted.startsWith(base)
    it('is none for a folder no root holds, or one that only shares a prefix', () => {
        expect(rootHolding(ROOTS, '/hubby/x')).toBe(null);
        expect(rootHolding(ROOTS, '/')).toBe(null);
        expect(rootHolding([], '/hub')).toBe(null);
        expect(rootHolding([{ key: 'e', dir: '', fixed: false }], '/hub')).toBe(null);
    });
});

describe("a Files tab's follow mode", () => {
    // revert: src/lib/state/sources/fs.ts:798 => (state as Record<string, unknown>).follow !== false
    it('is on only for layout state that says so', () => {
        expect(followsSession({ follow: true })).toBe(true);
        for (const state of [{}, { follow: 'yes' }, { follow: false }, null, [], 'follow']) {
            expect(followsSession(state)).toBe(false);
        }
    });

    // revert: src/lib/state/sources/fs.ts:844 => top: { path: '', name: folderName(dir) }
    it('is rooted at the followed folder inside the root holding it, at nothing when no root holds it, and every root when off', () => {
        expect(followView({ follow: true }, ROOTS, '/hub/tools/oculus')).toEqual({
            following: true,
            dir: '/hub/tools/oculus',
            found: { root: TOOL, path: 'oculus' },
            roots: [TOOL],
            top: { path: 'oculus', name: 'oculus' }
        });
        expect(followView({ follow: true }, ROOTS, '/hub/').top).toEqual({ path: '', name: 'hub' });
        expect(followView({ follow: true }, ROOTS, '/tmp')).toEqual({
            following: true,
            dir: '/tmp',
            found: null,
            roots: [],
            top: null
        });
        expect(followView({ follow: true }, ROOTS, null)).toEqual({
            following: true,
            dir: null,
            found: null,
            roots: [],
            top: null
        });
        expect(followView({}, ROOTS, '/hub')).toEqual({
            following: false,
            dir: null,
            found: null,
            roots: ROOTS,
            top: null
        });
    });

    // revert: src/lib/state/sources/fs.ts:859 => ? ''
    it("follows a session's workspace, else its folder, else the selected terminal's folder", () => {
        expect(followedDirOf({ workspace: '/w', cwd: '/w/sub' }, { cwd: '/t' })).toBe('/w');
        expect(followedDirOf({ workspace: '', cwd: '/w/sub' }, null)).toBe('/w/sub');
        expect(followedDirOf({ workspace: '', cwd: null }, { cwd: '/t' })).toBe(null);
        expect(followedDirOf(null, { cwd: '/t' })).toBe('/t');
        expect(followedDirOf(null, { cwd: '' })).toBe(null);
        expect(followedDirOf(null, null)).toBe(null);
    });

    // revert: src/lib/state/sources/fs.ts:868 => return { follow: on };
    it('is set on or off with the rest of the layout state kept', () => {
        expect(withFollow({ id: 'x', follow: true }, false)).toEqual({ id: 'x', follow: false });
        expect(withFollow(null, true)).toEqual({ follow: true });
        expect(withFollow(['x'], true)).toEqual({ follow: true });
    });

    // revert: src/lib/state/sources/fs.ts:883 => const key = treeKey(found.root.key, '');
    it('opens the followed folder, the head of its tree, and keeps the rest of the tab', () => {
        const opened = filesViewOf(
            followRevealed({ filter: 'x' }, { root: TOOL, path: 'oculus/src' })
        );
        expect(opened.expanded).toEqual(['r1:oculus/src']);
        expect(opened.filter).toBe('x');
        const atRoot = filesViewOf(followRevealed({}, { root: TOOL, path: '' }));
        expect(atRoot.expanded).toEqual(['r1:']);
    });

    // revert: src/lib/state/sources/fs.ts:878 => return kept;
    it('is pinned to one session and let go again, follow mode kept on both ways', () => {
        expect(withFollowPin({ follow: false, id: 'x' }, 'sess-1')).toEqual({
            follow: true,
            id: 'x',
            session: 'sess-1'
        });
        expect(withFollowPin({ follow: true, session: 'sess-1' }, null)).toEqual({ follow: true });
        expect(withFollowPin(null, 'sess-2')).toEqual({ follow: true, session: 'sess-2' });
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

    // revert: src/lib/state/sources/fs.ts:741 => const path = '';
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

    // revert: src/lib/state/sources/fs.ts:606 => const path = '';
    it('filters inside the folder only, under the folder as its head', () => {
        const held = (root: string, path: string): FsEntry[] | null =>
            listed[`${root}:${path}`] ?? null;
        const rows = filterRows([TOOL], held, 'b.ts', top);
        expect(rows.map((row) => row.path)).toEqual(['oculus', 'oculus/src', 'oculus/src/b.ts']);
    });

    // revert: src/lib/state/sources/fs.ts:640 => const parent = parentOf(row);
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
    // revert: src/lib/state/sources/fs.ts:895 => return `${base}/${path}`;
    it('carries the absolute path of the row, the root folder itself for its own line', () => {
        expect(absoluteOf('/hub/tools/', 'oculus/a.ts')).toBe('/hub/tools/oculus/a.ts');
        expect(absoluteOf('/hub', 'a.ts')).toBe('/hub/a.ts');
        expect(absoluteOf('/hub', '')).toBe('/hub');
    });
});
