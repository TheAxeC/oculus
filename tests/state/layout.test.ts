// The layout tree: every operation on hand-built trees, every invariant shown violated once, and
// the store's load and save through a fake storage. The older envelopes and their migration are
// layout-saved.test.ts beside this. Nothing here touches localStorage or the DOM: the pure half is
// state/layout/ and the store takes the storage it is given.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
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
    panes as panesOf,
    resize,
    restore,
    splitPane,
    splitWith,
    type Layout
} from '../../src/lib/state/layout/index.ts';
import { LAYOUT_KEY } from '../../src/lib/state/layout.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { fields } from '../../src/lib/data/guards.ts';
import {
    bench,
    docked,
    fakeStorage,
    folded,
    instance,
    pane,
    saveBench,
    savedBench,
    split,
    three,
    viewsOf
} from './layout-fixture.ts';
import { createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let activateInstance: ClientState['layout']['activateInstance'];
let activeInstance: ClientState['layout']['activeInstance'];
let apply: ClientState['layout']['apply'];
let change: ClientState['layout']['change'];
let closeInstanceOnPage: ClientState['layout']['closeInstance'];
let closePaneOnPage: ClientState['layout']['closePane'];
let expandChild: ClientState['layout']['expandChild'];
let focused: ClientState['layout']['focused'];
let foldPane: ClientState['layout']['foldPane'];
let layout: ClientState['layout']['layout'];
let loadLayout: ClientState['layout']['loadLayout'];
let maximisePane: ClientState['layout']['maximisePane'];
let openBeside: ClientState['layout']['openBeside'];
let openView: ClientState['layout']['openView'];
let restorePanes: ClientState['layout']['restorePanes'];
let splitInstance: ClientState['layout']['splitInstance'];
let transferInstance: ClientState['layout']['transferInstance'];
let workbench: ClientState['layout']['workbench'];

beforeEach(() => {
    client = createClientState();
    ({
        activateInstance,
        activeInstance,
        apply,
        change,
        closeInstance: closeInstanceOnPage,
        closePane: closePaneOnPage,
        expandChild,
        focused,
        foldPane,
        layout,
        loadLayout,
        maximisePane,
        openBeside,
        openView,
        restorePanes,
        splitInstance,
        transferInstance,
        workbench
    } = client.layout);
});

// The trees, the workbenches and the fake Storage are tests/state/layout-fixture.ts, shared with
// the pages suite beside this one. The catalog is installed because loadLayout names the page it
// makes, and a page is named from config/text.yml like everything else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The folded children of a split, and nothing for a pane, which cannot hold any. */
function foldedOf(tree: Layout): number[] | undefined {
    return tree.kind === 'split' ? tree.folded : undefined;
}

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
            active: 'a'
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
                [pane(['a']), { kind: 'pane', tabs: [instance('c'), instance('b')], active: 'b' }]
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
            'node at []: kind is "box", not split or pane'
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

describe('the store', () => {
    it('uses the first pane active tab by default', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b'], 'b'), pane(['c'])])));
        expect(activeInstance()).toEqual(instance('b'));
    });

    it('follows the pane whose tab was activated last', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c', 'd'])])));
        activateInstance('d');
        expect(activeInstance()).toEqual(instance('d'));
        activateInstance('b');
        expect(activeInstance()).toEqual(instance('b'));
    });

    it('starts from the default when storage holds nothing, and says so', () => {
        const storage = fakeStorage();
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout())).toEqual(['status']);
        expect(layout().kind).toBe('pane');
    });

    it('restores a saved arrangement, migrating the two trees it was written as', () => {
        const storage = fakeStorage(saveBench(docked(three(), pane(['p']), 'bottom', 0.4)));
        expect(loadLayout(storage)).toBe(true);
        expect(workbench()).toEqual(bench(split('col', [0.6, 0.4], [three(), pane(['p'])])));
    });

    it('falls back to the default on a saved value that fails parseLayout, and overwrites it on the next change', () => {
        const storage = fakeStorage(JSON.stringify({ version: 1, layout: { kind: 'box' } }));
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout())).toEqual(['status']);

        const saved = bench(three());
        apply(saved);
        expect(workbench()).toEqual(saved);
        expect(fields(JSON.parse(storage.held[LAYOUT_KEY])).version).toBe(LAYOUT_VERSION);
        expect(savedBench(storage)).toEqual(saved);
    });

    it('applies an operation to the page tree and saves the whole workbench under the one key', () => {
        const storage = fakeStorage(saveBench(docked(pane(['a']), pane([]), 'hidden')));
        loadLayout(storage);
        change((tree) => openInstance(tree, [], instance('q')));
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        expect(layout()).toEqual(pane(['a', 'q'], 'q'));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('activates the instance a view already has rather than opening a second', () => {
        loadLayout(fakeStorage());
        const before = layout();
        const held = before.kind === 'pane' ? before.tabs[0].id : '';
        openView('status');
        const after = layout();
        expect(viewsOf(after)).toEqual(['status']);
        expect(after.kind === 'pane' ? after.active : '').toBe(held);
    });

    // One view, one instance per project: the project view is registered once, so the state's `id`
    // is what tells two of its tabs apart.
    it('activates the instance opened for the same state rather than opening a second', () => {
        loadLayout(fakeStorage());
        openView('project', { id: 'alpha' });
        const opened = layout();
        const held = opened.kind === 'pane' ? opened.active : '';
        openView('project', { id: 'alpha' });
        const after = layout();
        expect(viewsOf(after)).toEqual(['status', 'project']);
        expect(after.kind === 'pane' ? after.active : '').toBe(held);
    });

    it('opens a second instance of one view for a second state', () => {
        loadLayout(fakeStorage());
        openView('project', { id: 'alpha' });
        openView('project', { id: 'bravo' });
        const after = layout();
        expect(viewsOf(after)).toEqual(['status', 'project', 'project']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { id: 'alpha' }, { id: 'bravo' }]);
    });

    it('still retargets the one instance when the state names no id', () => {
        loadLayout(fakeStorage());
        openView('editor', { field: 'title' });
        openView('editor', { field: 'venue' });
        const after = layout();
        expect(viewsOf(after)).toEqual(['status', 'editor']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { field: 'venue' }]);
    });

    it('opens a view the tree does not hold in the pane last activated', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        activateInstance('b');
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
    });

    it('opens into the first pane when nothing has been activated since the load', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
    });

    it('closes an instance and leaves the rest of the tree where it is', () => {
        loadLayout(fakeStorage(saveBench(docked(pane(['a', 'b']), pane([]), 'hidden'))));
        closeInstanceOnPage('a');
        expect(layout()).toEqual(pane(['b'], 'b'));
    });
});

describe('the store: opening a view beside the active pane', () => {
    it('puts a view the tree does not hold in a new pane to the right', () => {
        loadLayout(fakeStorage());
        openBeside('venues');
        expect(layout().kind).toBe('split');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['status']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('activates a view already open rather than opening a second pane', () => {
        loadLayout(fakeStorage());
        const first = openBeside('venues');
        const again = openBeside('venues');
        expect(again).toBe(first);
        expect(viewsOf(layout())).toEqual(['status', 'venues']);
    });

    it('opens beside the pane the last activated tab is in', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(docked(two, pane([]), 'hidden'))));
        activateInstance('b');
        openBeside('venues');
        expect(paneAt(layout(), [2])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
    });

    it('opens into the maximised pane, which is the only one anybody can see', () => {
        loadLayout(fakeStorage());
        maximisePane([]);
        openBeside('venues');
        expect(layout().kind).toBe('pane');
        expect(viewsOf(layout())).toEqual(['status', 'venues']);
    });

    it('puts the next one in the pane the last one made, as a second tab', () => {
        loadLayout(fakeStorage());
        openBeside('venues');
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(2);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['status']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['venues', 'funding']);
    });

    it('splits again once the pane the last one made is gone', () => {
        loadLayout(fakeStorage());
        const first = openBeside('venues');
        closeInstanceOnPage(first);
        expect(layout().kind).toBe('pane');
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(2);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['funding']);
    });

    it('splits again when the tab it made was dragged into the pane being read', () => {
        loadLayout(fakeStorage());
        const first = openBeside('venues');
        transferInstance(first, [0], 0);
        expect(layout().kind).toBe('pane');
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(2);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['funding']);
    });

    it('forgets the pane it made on a load, so the next one opens in a pane of its own', () => {
        const storage = fakeStorage();
        loadLayout(storage);
        openBeside('venues');
        loadLayout(storage);
        openBeside('funding');
        expect(panesOf(layout())).toHaveLength(3);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['funding']);
        expect(paneAt(layout(), [2])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
    });
});

describe('the store: the panes of one tree', () => {
    /** A two-pane tree, loaded and saved through a fake storage. */
    function load(root: Layout = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])])) {
        const storage = fakeStorage(saveBench(docked(root, pane([]), 'hidden')));
        loadLayout(storage);
        return storage;
    }

    it('closes a whole pane and saves what is left', () => {
        const storage = load();
        closePaneOnPage([1]);
        expect(layout()).toEqual(pane(['a']));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('moves a tab to another pane and saves it there', () => {
        const storage = load();
        transferInstance('c', [0], 0);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.id)).toEqual(['c', 'a']);
        expect(paneAt(layout(), [1])).toEqual(pane(['b'], 'b'));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('splits a pane with a tab and saves the new arrangement', () => {
        const storage = load();
        splitInstance('c', [0], 'bottom');
        expect(layout()).toEqual(
            split(
                'row',
                [0.5, 0.5],
                [split('col', [0.5, 0.5], [pane(['a']), pane(['c'])]), pane(['b'], 'b')]
            )
        );
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('leaves the tree alone when the move performs nothing', () => {
        load();
        const before = workbench();
        transferInstance('nobody', [0], 0);
        expect(workbench()).toBe(before);
    });

    it('maximises a pane, saves it, and restores', () => {
        const storage = load();
        maximisePane([1]);
        expect(focused()).toEqual({ path: [1] });
        expect(savedBench(storage)?.focus).toEqual({ path: [1] });
        restorePanes();
        expect(focused()).toBe(null);
        expect(savedBench(storage)?.focus).toBe(undefined);
    });

    it('drops the focus when the maximised pane is closed', () => {
        load();
        maximisePane([1]);
        closePaneOnPage([1]);
        expect(focused()).toBe(null);
        expect(layout()).toEqual(pane(['a']));
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('opens a view into the maximised pane rather than the pane last activated', () => {
        load();
        activateInstance('a');
        maximisePane([1]);
        openView('venues');
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'projects',
            'venues'
        ]);
        expect(focused()).toEqual({ path: [1] });
    });

    it('opens a second instance of a view that is open in a pane nobody can see', () => {
        load(
            split(
                'row',
                [0.5, 0.5],
                [{ kind: 'pane', tabs: [instance('a', 'venues')], active: 'a' }, pane(['b'])]
            )
        );
        maximisePane([1]);
        openView('venues');
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual(['projects', 'venues']);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
    });

    it('brings the arrangement back when a tab is moved into a pane nobody can see', () => {
        load();
        maximisePane([1]);
        transferInstance('c', [0], 0);
        expect(focused()).toBe(null);
        expect(paneAt(layout(), [0])?.tabs.map((tab) => tab.id)).toEqual(['c', 'a']);
    });
});

describe('the store: folding a child of a split', () => {
    /** A two-pane tree, loaded and saved through a fake storage. */
    function load() {
        const root = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const storage = fakeStorage(saveBench(docked(root, pane([]), 'hidden')));
        loadLayout(storage);
        return storage;
    }

    it('folds a pane in its parent split and saves the folded state', () => {
        const storage = load();
        foldPane([1]);
        expect(foldedOf(layout())).toEqual([1]);
        expect(savedBench(storage)).toEqual(workbench());
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('expands it again, at the share it kept', () => {
        load();
        foldPane([1]);
        expandChild([], 1);
        expect(layout()).toEqual(split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]));
    });

    it('leaves the root pane alone, which is in no split', () => {
        loadLayout(fakeStorage());
        const before = workbench();
        foldPane([]);
        expect(workbench()).toBe(before);
    });

    it('leaves a maximised pane maximised when the root path is folded', () => {
        load();
        maximisePane([1]);
        const before = workbench();
        foldPane([]);
        expect(focused()).toEqual({ path: [1] });
        expect(workbench()).toBe(before);
    });

    it('keeps the maximised pane when another child is folded', () => {
        const root = split('row', [0.4, 0.3, 0.3], [pane(['a']), pane(['b']), pane(['c'])]);
        loadLayout(fakeStorage(saveBench(docked(root, pane([]), 'hidden'))));
        maximisePane([2]);
        foldPane([0]);
        expect(focused()).toEqual({ path: [2] });
        expect(foldedOf(layout())).toEqual([0]);
    });

    it('gives the maximised pane back before folding the child that holds it', () => {
        load();
        maximisePane([1]);
        foldPane([1]);
        expect(focused()).toBe(null);
        expect(foldedOf(layout())).toEqual([1]);
    });

    it('expands the pane a view is opened into rather than opening it out of sight', () => {
        load();
        activateInstance('c');
        foldPane([1]);
        openView('venues');
        expect(foldedOf(layout())).toBe(undefined);
        expect(paneAt(layout(), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'projects',
            'venues'
        ]);
    });

    it('expands the pane a tab is dropped into', () => {
        load();
        foldPane([1]);
        transferInstance('a', [1], 0);
        expect(layout()).toEqual({
            kind: 'pane',
            tabs: [instance('a'), instance('b'), instance('c')],
            active: 'a'
        });
    });

    it('expands every folded ancestor of the pane a view is opened into', () => {
        const inner = folded(split('row', [0.5, 0.5], [pane(['b']), pane(['c'])]), [1]);
        const tree = folded(split('row', [0.5, 0.5], [pane(['a']), inner]), [1]);
        loadLayout(fakeStorage(saveBench(docked(tree, pane([]), 'hidden'))));
        activateInstance('c');
        openView('venues');
        expect(foldedOf(layout())).toBe(undefined);
        const root = layout();
        const child = root.kind === 'split' ? root.children[1] : null;
        expect(child !== null && child.kind === 'split' ? child.folded : 'missing').toBe(undefined);
        expect(paneAt(layout(), [1, 1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
    });
});
