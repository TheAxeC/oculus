// Layer 4, test. The pure rules behind a project card's file tree: the key of the record a card's
// tree keeps its state under (view/card-tree.ts), and the folder a tree is drawn from when the
// folder is given as an absolute path (view/tab-roots.ts `folderView`): the root holding it, the
// folder as the head of the tree, and no root at all for a folder outside the workspace.
//
// What this does NOT cover: the tree drawn, which is tests/views/shared/explorer/, and the record
// cleared with its tab, which is tests/state/workbench/layout/layout-close.test.ts.

import { describe, expect, it } from 'vitest';
import {
    cardTreeKey,
    cardTreePrefix
} from '../../../../../src/lib/state/sources/explorer/view/card-tree.ts';
import {
    followView,
    folderView
} from '../../../../../src/lib/state/sources/explorer/view/tab-roots.ts';
import type { FsRoot } from '../../../../../src/lib/state/sources/fs.ts';

const ROOTS: FsRoot[] = [
    { key: 'hub', dir: '/r/hub', fixed: true },
    { key: 'notes', dir: '/r/notes', fixed: false }
];

describe('the key of a card tree record', () => {
    // A project id is a folder name, which may hold any character a name may.
    it('keeps a project id holding : or # or / from reaching another key', () => {
        const ids = ['a', 'a:b', 'a#b', 'a#files:b', 'a/b', 'a%3Ab', 'a b', '', ':', '#'];
        const keys = ids.map((id) => cardTreeKey('t1', id));
        expect(new Set(keys).size).toBe(ids.length);
        for (const key of keys) expect(key.startsWith(cardTreePrefix('t1'))).toBe(true);
        // the part after the prefix holds none of the characters the key is split by
        for (const key of keys) {
            expect(key.slice(cardTreePrefix('t1').length)).not.toMatch(/[#:/]/);
        }
    });

    it('is not a prefix of the key of a tab whose id starts the same way', () => {
        expect(cardTreeKey('t10', 'alpha').startsWith(cardTreePrefix('t1'))).toBe(false);
        expect(cardTreeKey('t1#files:x', 'alpha').startsWith(cardTreePrefix('t1'))).toBe(true);
        expect(cardTreePrefix('t1')).not.toBe(cardTreePrefix('t10'));
    });

    it('is not the key the tab keeps its forms or its own state under', () => {
        expect(cardTreeKey('t1', 'alpha')).not.toBe('t1');
        expect(cardTreeKey('t1', 'alpha')).not.toBe('t1#forms');
        expect(cardTreeKey('t1', 'alpha')).not.toBe('t1#added');
    });
});

describe('the folder a tree is drawn from', () => {
    it('is the one root holding the folder, the folder as the head, named by its last segment', () => {
        const view = folderView(ROOTS, '/r/hub/projects/active/alpha');
        expect(view.found).toEqual({ root: ROOTS[0], path: 'projects/active/alpha' });
        expect(view.roots.map((one) => one.key)).toEqual(['hub']);
        expect(view.top).toEqual({ path: 'projects/active/alpha', name: 'alpha' });
    });

    it('is the root itself, with the path empty and the head named by the folder, for a root', () => {
        const view = folderView(ROOTS, '/r/notes');
        expect(view.found).toEqual({ root: ROOTS[1], path: '' });
        expect(view.roots.map((one) => one.key)).toEqual(['notes']);
        expect(view.top).toEqual({ path: '', name: 'notes' });
    });

    it('prefers the deepest root holding the folder', () => {
        const nested: FsRoot[] = [
            ...ROOTS,
            { key: 'alpha', dir: '/r/hub/projects/alpha', fixed: false }
        ];
        const view = folderView(nested, '/r/hub/projects/alpha/code');
        expect(view.found?.root.key).toBe('alpha');
        expect(view.top).toEqual({ path: 'code', name: 'code' });
    });

    it('is no root and no head for a folder no root holds', () => {
        const view = folderView(ROOTS, '/elsewhere/alpha');
        expect(view.found).toBeNull();
        expect(view.roots).toEqual([]);
        expect(view.top).toBeNull();
    });

    it('is the same view a following tab draws for that folder', () => {
        const folder = '/r/hub/projects/active/alpha';
        const follow = followView({ follow: true }, ROOTS, folder);
        const view = folderView(ROOTS, folder);
        expect(follow.found).toEqual(view.found);
        expect(follow.roots).toEqual(view.roots);
        expect(follow.top).toEqual(view.top);
    });
});
