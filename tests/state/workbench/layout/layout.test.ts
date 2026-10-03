// The layout tree: every operation on hand-built trees, and every invariant shown violated once.
// The store is layout-store.test.ts beside this and the older envelopes and their migration are
// saved/layout-saved.test.ts. Nothing here touches localStorage or the DOM: the pure
// half is state/workbench/layout/.

import { describe, expect, it } from 'vitest';
import {
    MAX_CHILDREN,
    MIN_SIZE,
    activate,
    checkLayout,
    checkWorkbench,
    closeInstance,
    closePane,
    equalSizes,
    expand,
    focusedPane,
    fold,
    maximise,
    moveInstance,
    openInstance,
    paneAt,
    resize,
    restore,
    splitPane,
    splitWith,
    type Layout
} from '../../../../src/lib/state/workbench/layout/index.ts';
import { bench, folded, instance, pane, split, three, viewsOf } from './layout-fixture.ts';
import { foldedOf } from './layout-fixture.ts';

describe('reading the tree', () => {
    it('finds the pane a path names and nothing else', () => {
        const tree = three();
        expect(paneAt(tree, [0])).toEqual(pane(['a']));
        expect(paneAt(tree, [1, 1])).toEqual(pane(['c']));
        expect(paneAt(tree, [1])).toBe(null);
        expect(paneAt(tree, [4])).toBe(null);
        expect(paneAt(tree, [0, 0])).toBe(null);
    });
});

describe('openInstance', () => {
    it('appends the tab and makes it active without touching the tree it was given', () => {
        const tree = pane([]);
        const next = openInstance(tree, [], instance('a'));
        expect(next).toEqual(pane(['a'], 'a'));
        expect(tree).toEqual(pane([]));
        expect(checkLayout(next)).toEqual([]);
    });

    it('leaves the tree alone when the path names no pane', () => {
        const tree = three();
        expect(openInstance(tree, [1], instance('d'))).toBe(tree);
        expect(openInstance(tree, [9], instance('d'))).toBe(tree);
    });

    it('is undone by closing the same instance', () => {
        const tree = three();
        const opened = openInstance(tree, [1, 0], instance('d'));
        expect(closeInstance(opened, 'd')).toEqual(tree);
    });
});

describe('closeInstance', () => {
    it('moves active to the neighbour that took the closed tab place', () => {
        const tree: Layout = {
            kind: 'pane',
            tabs: [instance('a'), instance('b'), instance('c')],
            active: 'b'
        };
        expect(closeInstance(tree, 'b')).toEqual({
            kind: 'pane',
            tabs: [instance('a'), instance('c')],
            active: 'c'
        });
    });

    it('moves active to the last tab when the closed one was last', () => {
        const tree: Layout = { kind: 'pane', tabs: [instance('a'), instance('b')], active: 'b' };
        expect(closeInstance(tree, 'b')).toEqual({
            kind: 'pane',
            tabs: [instance('a')],
            active: 'a'
        });
    });

    it('leaves active alone when another tab was closed', () => {
        const tree: Layout = { kind: 'pane', tabs: [instance('a'), instance('b')], active: 'a' };
        expect(closeInstance(tree, 'b')).toEqual({
            kind: 'pane',
            tabs: [instance('a')],
            active: 'a'
        });
    });

    it('collapses a split left with one child into that child', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        expect(closeInstance(tree, 'b')).toEqual(pane(['a']));
    });

    it('cleans away an empty pane and renormalises what is left', () => {
        const tree = split('row', [0.2, 0.5, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        const next = closeInstance(tree, 'b');
        expect(next).toEqual(split('row', [0.4, 0.6], [pane(['a']), pane(['c'])]));
        expect(checkLayout(next)).toEqual([]);
    });

    it('empties the root pane rather than removing it', () => {
        expect(closeInstance(pane(['a']), 'a')).toEqual({ kind: 'pane', tabs: [], active: '' });
    });

    it('leaves the tree alone when no pane holds the id', () => {
        const tree = three();
        expect(closeInstance(tree, 'z')).toBe(tree);
    });
});

describe('closePane', () => {
    it('takes every tab of a leaf pane with it and renormalises what is left', () => {
        const tree = split('row', [0.2, 0.5, 0.3], [pane(['a']), pane(['b', 'c']), pane(['d'])]);
        const next = closePane(tree, [1]);
        expect(next).toEqual(split('row', [0.4, 0.6], [pane(['a']), pane(['d'])]));
        expect(checkLayout(next)).toEqual([]);
    });

    it('collapses a split left with one child into that child', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        expect(closePane(tree, [1])).toEqual(pane(['a']));
    });

    it('empties the root pane rather than removing it', () => {
        expect(closePane(pane(['a', 'b']), [])).toEqual({ kind: 'pane', tabs: [], active: '' });
    });

    it('leaves the tree alone when the path names a split or nothing', () => {
        const tree = three();
        expect(closePane(tree, [1])).toBe(tree);
        expect(closePane(tree, [9])).toBe(tree);
    });

    it('is the whole pane, where closing its tabs one at a time is the same tree', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        expect(closePane(tree, [1])).toEqual(closeInstance(closeInstance(tree, 'b'), 'c'));
    });
});

describe('activate', () => {
    it('names the instance active in the pane that holds it', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])]);
        const next = activate(tree, 'b');
        expect(paneAt(next, [0])?.active).toBe('b');
        expect(paneAt(tree, [0])?.active).toBe('a');
        expect(activate(tree, 'z')).toBe(tree);
    });
});

describe('moveInstance', () => {
    it('moves a tab between panes, keeps the ids unique and cleans the source', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        const next = moveInstance(tree, 'a', [1], 0);
        expect(next).toEqual({
            kind: 'pane',
            tabs: [instance('a'), instance('b'), instance('c')],
            active: 'a',
            recent: ['b']
        });
        expect(checkLayout(next)).toEqual([]);
    });

    it('keeps the source pane when it still holds a tab', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])]);
        const next = moveInstance(tree, 'b', [1], 1);
        expect(next).toEqual(
            split(
                'row',
                [0.5, 0.5],
                [
                    pane(['a']),
                    {
                        kind: 'pane',
                        tabs: [instance('c'), instance('b')],
                        active: 'b',
                        recent: ['c']
                    }
                ]
            )
        );
        expect(checkLayout(next)).toEqual([]);
    });

    it('reorders within one pane', () => {
        const tree: Layout = {
            kind: 'pane',
            tabs: [instance('a'), instance('b'), instance('c')],
            active: 'a'
        };
        expect(moveInstance(tree, 'a', [], 2)).toEqual({
            kind: 'pane',
            tabs: [instance('b'), instance('c'), instance('a')],
            active: 'a'
        });
    });

    it('clamps an index past the end and leaves an unknown id or path alone', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        expect(paneAt(moveInstance(tree, 'a', [1], 99), [])?.tabs.map((tab) => tab.id)).toEqual([
            'b',
            'a'
        ]);
        expect(moveInstance(tree, 'z', [1], 0)).toBe(tree);
        expect(moveInstance(tree, 'a', [5], 0)).toBe(tree);
    });
});

describe('splitPane', () => {
    it('replaces the pane by a split of it and a new pane, half each', () => {
        const next = splitPane(pane(['a']), [], 'row', instance('b'));
        expect(next).toEqual(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]));
        expect(checkLayout(next)).toEqual([]);
    });

    it('adds a sibling to a split of the same direction, taking half the pane share', () => {
        const tree = split('row', [0.6, 0.4], [pane(['a']), pane(['b'])]);
        const next = splitPane(tree, [0], 'row', instance('c'));
        expect(next).toEqual(
            split('row', [0.3, 0.3, 0.4], [pane(['a']), pane(['c']), pane(['b'])])
        );
        expect(checkLayout(next)).toEqual([]);
    });

    it('nests when the direction is the other one', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        const next = splitPane(tree, [0], 'col', instance('c'));
        expect(next).toEqual(
            split(
                'row',
                [0.5, 0.5],
                [split('col', [0.5, 0.5], [pane(['a']), pane(['c'])]), pane(['b'])]
            )
        );
    });

    it('nests rather than making a child too small for the minimum', () => {
        const ids = Array.from({ length: MAX_CHILDREN }, (_, index) => `p${index}`);
        const full = split(
            'row',
            equalSizes(MAX_CHILDREN),
            ids.map((id) => pane([id]))
        );
        expect(checkLayout(full)).toEqual([]);
        const next = splitPane(full, [0], 'row', instance('extra'));
        expect(checkLayout(next)).toEqual([]);
        expect(next.kind === 'split' && next.children.length).toBe(MAX_CHILDREN);
        expect(paneAt(next, [0])).toBe(null);
    });

    it('leaves the tree alone when the path names no pane', () => {
        const tree = three();
        expect(splitPane(tree, [1], 'row', instance('d'))).toBe(tree);
    });
});

describe('splitWith', () => {
    it('puts the new pane after the split one on the right edge and before it on the left', () => {
        const start = bench(pane(['a', 'b']));
        expect(splitWith(start, 'b', [], 'right').root).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pane(['b'])])
        );
        expect(splitWith(start, 'b', [], 'left').root).toEqual(
            split('row', [0.5, 0.5], [pane(['b']), pane(['a'])])
        );
    });

    it('makes a column on the bottom edge and on the top edge', () => {
        const start = bench(pane(['a', 'b']));
        expect(splitWith(start, 'b', [], 'bottom').root).toEqual(
            split('col', [0.5, 0.5], [pane(['a']), pane(['b'])])
        );
        expect(splitWith(start, 'b', [], 'top').root).toEqual(
            split('col', [0.5, 0.5], [pane(['b']), pane(['a'])])
        );
    });

    it('adds a sibling to a split of the same direction, taking half the pane share', () => {
        const root = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const next = splitWith(bench(root), 'c', [0], 'right');
        expect(next.root).toEqual(
            split('row', [0.3, 0.3, 0.4], [pane(['a']), pane(['c']), pane(['b'], 'b')])
        );
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('puts the sibling in front of the pane on the left edge', () => {
        const root = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const next = splitWith(bench(root), 'c', [0], 'left');
        expect(next.root).toEqual(
            split('row', [0.3, 0.3, 0.4], [pane(['c']), pane(['a']), pane(['b'], 'b')])
        );
    });

    it('collapses the pane the tab left, without losing the pane it made', () => {
        const root = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        const next = splitWith(bench(root), 'b', [0], 'bottom');
        expect(next.root).toEqual(split('col', [0.5, 0.5], [pane(['a']), pane(['b'])]));
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('leaves a pane alone when its own only tab is dropped on its edge', () => {
        const start = bench(pane(['a']));
        expect(splitWith(start, 'a', [], 'right')).toBe(start);
    });

    it('leaves the arrangement alone when it names no instance or no pane', () => {
        const start = bench(three());
        expect(splitWith(start, 'z', [0], 'right')).toBe(start);
        expect(splitWith(start, 'a', [1], 'right')).toBe(start);
    });
});

describe('fold and expand', () => {
    it('records the folded child on its split and gives it back with its share', () => {
        const tree = split('row', [0.7, 0.3], [pane(['a']), pane(['b'])]);
        const collapsed = fold(tree, [1]);
        expect(collapsed).toEqual(
            folded(split('row', [0.7, 0.3], [pane(['a']), pane(['b'])]), [1])
        );
        expect(checkLayout(collapsed)).toEqual([]);
        expect(expand(collapsed, [], 1)).toEqual(tree);
    });

    it('folds a child of a split below the root', () => {
        const collapsed = fold(three(), [1, 0]);
        const inner = collapsed.kind === 'split' ? collapsed.children[1] : null;
        expect(inner === null ? null : foldedOf(inner)).toEqual([0]);
        expect(checkLayout(collapsed)).toEqual([]);
    });

    it('refuses the root, which sits in no split, and a path naming nothing', () => {
        const tree = three();
        expect(fold(tree, [])).toBe(tree);
        expect(fold(tree, [9])).toBe(tree);
    });

    it('refuses the last open child of a split', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        const collapsed = fold(tree, [1]);
        expect(fold(collapsed, [0])).toBe(collapsed);
        expect(fold(collapsed, [1])).toBe(collapsed);
    });

    it('changes nothing when the child named is not folded', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        expect(expand(tree, [], 1)).toBe(tree);
        expect(expand(tree, [0], 0)).toBe(tree);
    });

    it('carries the fold to the child that took its place when a neighbour is closed', () => {
        const tree = split('row', [0.4, 0.3, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        const collapsed = fold(tree, [2]);
        const closed = closePane(collapsed, [0]);
        expect(foldedOf(closed)).toEqual([1]);
        expect(viewsOf(closed)).toEqual(['projects', 'projects']);
    });

    it('keeps one child open when the last open one is closed', () => {
        const tree = split('row', [0.4, 0.3, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        const collapsed = fold(fold(tree, [0]), [1]);
        const closed = closePane(collapsed, [2]);
        expect(foldedOf(closed)).toEqual([1]);
        expect(checkLayout(closed)).toEqual([]);
    });

    it('carries the fold past a pane put in before it', () => {
        const tree = fold(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]), [1]);
        const next = splitPane(tree, [0], 'row', instance('c'));
        expect(foldedOf(next)).toEqual([2]);
        expect(checkLayout(next)).toEqual([]);
    });

    it('keeps the fold across a resize of the split', () => {
        const tree = fold(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]), [1]);
        const next = resize(tree, [], [0.8, 0.2]);
        expect(foldedOf(next)).toEqual([1]);
        expect(next.kind === 'split' && next.sizes).toEqual([0.8, 0.2]);
    });
});

describe('maximise and restore', () => {
    it('names the pane that is shown alone, and gives it back', () => {
        const start = bench(three());
        const zoomed = maximise(start, [1, 0]);
        expect(zoomed.focus).toEqual({ path: [1, 0] });
        expect(focusedPane(zoomed)).toEqual({ path: [1, 0] });
        expect(checkWorkbench(zoomed)).toEqual([]);
        expect(restore(zoomed)).toEqual(start);
        expect(focusedPane(start)).toBe(null);
    });

    it('leaves the arrangement alone when the path names a split or nothing', () => {
        const start = bench(three());
        expect(maximise(start, [1])).toBe(start);
        expect(maximise(start, [4])).toBe(start);
        expect(restore(start)).toBe(start);
    });

    it('reports a focus that names no pane and drops it when the pane goes', () => {
        const start = maximise(bench(three()), [1, 1]);
        const gone = { ...start, root: closePane(start.root, [1, 1]) };
        expect(checkWorkbench(gone)).toEqual(['focus names [1, 1], which is not a pane']);
        expect(focusedPane(gone)).toBe(null);
    });
});

describe('resize', () => {
    it('normalises sizes that do not sum to 1', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        const next = resize(tree, [], [3, 1]);
        expect(next).toEqual(split('row', [0.75, 0.25], [pane(['a']), pane(['b'])]));
        expect(checkLayout(next)).toEqual([]);
    });

    it('clamps a child to the minimum and takes the difference from the rest', () => {
        const tree = split('row', [0.4, 0.3, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        const next = resize(tree, [], [0.98, 0.01, 0.01]);
        const sizes = next.kind === 'split' ? next.sizes : [];
        expect(sizes[0]).toBeCloseTo(0.8, 10);
        expect(sizes[1]).toBeCloseTo(MIN_SIZE, 10);
        expect(sizes[2]).toBeCloseTo(MIN_SIZE, 10);
        expect(checkLayout(next)).toEqual([]);
    });

    it('falls back to equal shares when nothing usable is given', () => {
        const tree = split('col', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        expect(resize(tree, [], [0, -1])).toEqual(
            split('col', [0.5, 0.5], [pane(['a']), pane(['b'])])
        );
    });

    it('refuses a length that does not match the children, and a path that is not a split', () => {
        const tree = three();
        expect(resize(tree, [], [0.5, 0.3, 0.2])).toBe(tree);
        expect(resize(tree, [0], [0.5, 0.5])).toBe(tree);
        expect(resize(tree, [7], [0.5, 0.5])).toBe(tree);
    });

    it('resizes a split below the root and leaves its neighbours alone', () => {
        const tree = three();
        const next = resize(tree, [1], [0.75, 0.25]);
        expect(next.kind === 'split' && next.sizes).toEqual([0.5, 0.5]);
        const inner = next.kind === 'split' ? next.children[1] : null;
        expect(inner !== null && inner.kind === 'split' && inner.sizes).toEqual([0.75, 0.25]);
    });
});

describe('checkLayout', () => {
    it('passes a tree the shell can render', () => {
        expect(checkLayout(three())).toEqual([]);
        expect(checkLayout(pane([]))).toEqual([]);
    });

    it('reports a split with one child', () => {
        const tree = { kind: 'split', dir: 'row', sizes: [1], children: [pane(['a'])] } as Layout;
        expect(checkLayout(tree)).toEqual([
            'node at []: a split holds 1 children, two is the least'
        ]);
    });

    it('reports sizes that do not match the children', () => {
        const tree = split('row', [0.5, 0.3, 0.2], [pane(['a']), pane(['b'])]);
        expect(checkLayout(tree)).toEqual(['node at []: 3 sizes for 2 children']);
    });

    it('reports sizes that do not sum to 1', () => {
        const tree = split('row', [0.5, 0.4], [pane(['a']), pane(['b'])]);
        expect(checkLayout(tree)).toEqual(['node at []: sizes sum to 0.9, not 1']);
    });

    it('reports a size under the minimum', () => {
        const tree = split('row', [0.95, 0.05], [pane(['a']), pane(['b'])]);
        expect(checkLayout(tree)).toEqual([
            `node at []: child 1 holds 0.05, under the minimum ${MIN_SIZE}`
        ]);
    });

    it('reports an active that names no tab, and an empty pane that names one', () => {
        expect(checkLayout({ kind: 'pane', tabs: [instance('a')], active: 'b' })).toEqual([
            'node at []: active is "b", which is not one of its tabs'
        ]);
        expect(checkLayout({ kind: 'pane', tabs: [], active: 'a' })).toEqual([
            'node at []: an empty pane calls a active'
        ]);
    });

    it('reports a repeated instance id across the tree', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a']), pane(['a'])]);
        expect(checkLayout(tree)).toEqual(['node at [1]: tab 0 repeats the instance id a']);
    });

    it('reports a kind and a dir that are not the allowed words', () => {
        expect(checkLayout({ kind: 'box' } as unknown as Layout)).toEqual([
            'node at []: kind is "box", not split, pane or page'
        ]);
        const sideways = { kind: 'split', dir: 'sideways', sizes: [0.5, 0.5], children: [] };
        expect(checkLayout(sideways as unknown as Layout)).toEqual([
            'node at []: dir is "sideways", not row or col'
        ]);
    });

    it('names the path of the node it is reporting', () => {
        const tree = split(
            'row',
            [0.5, 0.5],
            [pane(['a']), { kind: 'pane', tabs: [], active: 'x' }]
        );
        expect(checkLayout(tree)).toEqual(['node at [1]: an empty pane calls x active']);
    });
});
