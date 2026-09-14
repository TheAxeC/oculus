// The layout tree: every operation on hand-built trees, every invariant shown violated once, the
// saved form read and refused, and the store's load and save through a fake storage. Nothing here
// touches localStorage or the DOM: the pure half is state/layout/ and the store takes the storage
// it is given.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    MAX_CHILDREN,
    MIN_SIZE,
    PANEL_DEFAULT,
    PANEL_MAX,
    PANEL_MIN,
    WORKBENCH_VERSION,
    activate,
    checkLayout,
    checkWorkbench,
    closeInstance,
    closePane,
    defaultWorkbench,
    equalSizes,
    focusedPane,
    holderOf,
    maximise,
    moveInstance,
    openInstance,
    paneAt,
    parseWorkbench,
    resize,
    restore,
    splitPane,
    splitWith,
    transfer,
    type Dock,
    type Layout,
    type Workbench
} from '../../src/lib/state/layout/index.ts';
import {
    LAYOUT_KEY,
    activateInstance,
    activeInstance,
    apply,
    change,
    closeInstanceIn,
    closePaneIn,
    dock,
    dockedAt,
    focused,
    layout,
    loadLayout,
    maximisePane,
    openView,
    panelSize,
    resizePanel,
    restorePanes,
    splitInstance,
    transferInstance,
    workbench
} from '../../src/lib/state/layout.svelte.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { fields } from '../../src/lib/data/guards.ts';
import {
    bench,
    envelope,
    fakeStorage,
    instance,
    pane,
    saveBench,
    savedBench,
    split,
    three,
    viewsOf
} from './layout-fixture.ts';

// The trees, the workbenches and the fake Storage are tests/state/layout-fixture.ts, shared with
// the pages suite beside this one. The catalog is installed because loadLayout names the page it
// makes, and a page is named from config/text.yml like everything else on screen.
setCatalog(textCatalog(loadConfig(engineDir()).config));

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

describe('transfer', () => {
    it('moves a tab inside one tree, exactly as moveInstance does', () => {
        const main = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        const start = bench(main, pane(['p']));
        const next = transfer(start, 'a', 'main', [1], 1);
        expect(next.main).toEqual(moveInstance(main, 'a', [1], 1));
        expect(next.panel).toBe(start.panel);
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('moves a tab from the main area to the panel, at the index it names', () => {
        const start = bench(pane(['a', 'b']), pane(['p', 'q']));
        const next = transfer(start, 'a', 'panel', [], 1);
        expect(next.main).toEqual(pane(['b'], 'b'));
        expect(next.panel).toEqual({
            kind: 'pane',
            tabs: [instance('p'), instance('a'), instance('q')],
            active: 'a'
        });
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('cleans the pane a tab left, back to the panel', () => {
        const panel = split('col', [0.5, 0.5], [pane(['p']), pane(['q'])]);
        const start = bench(pane(['a']), panel);
        const next = transfer(start, 'q', 'main', [], 0);
        expect(next.panel).toEqual(pane(['p']));
        expect(next.main).toEqual({
            kind: 'pane',
            tabs: [instance('q'), instance('a')],
            active: 'q'
        });
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('clamps an index past the end of the strip', () => {
        const start = bench(pane(['a']), pane(['p', 'q']));
        const next = transfer(start, 'a', 'panel', [], 99);
        expect(paneAt(next.panel, [])?.tabs.map((tab) => tab.id)).toEqual(['p', 'q', 'a']);
    });

    it('leaves the arrangement alone when it names no instance or no pane', () => {
        const start = bench(pane(['a']), pane(['p']));
        expect(transfer(start, 'z', 'panel', [], 0)).toBe(start);
        expect(transfer(start, 'a', 'panel', [3], 0)).toBe(start);
    });

    it('says which tree holds an instance', () => {
        const start = bench(pane(['a']), pane(['p']));
        expect(holderOf(start, 'a')).toBe('main');
        expect(holderOf(start, 'p')).toBe('panel');
        expect(holderOf(start, 'z')).toBe(null);
    });
});

describe('splitWith', () => {
    it('puts the new pane after the split one on the right edge and before it on the left', () => {
        const start = bench(pane(['a', 'b']), pane(['p']));
        expect(splitWith(start, 'b', 'main', [], 'right').main).toEqual(
            split('row', [0.5, 0.5], [pane(['a']), pane(['b'])])
        );
        expect(splitWith(start, 'b', 'main', [], 'left').main).toEqual(
            split('row', [0.5, 0.5], [pane(['b']), pane(['a'])])
        );
    });

    it('makes a column on the bottom edge and on the top edge', () => {
        const start = bench(pane(['a', 'b']), pane(['p']));
        expect(splitWith(start, 'b', 'main', [], 'bottom').main).toEqual(
            split('col', [0.5, 0.5], [pane(['a']), pane(['b'])])
        );
        expect(splitWith(start, 'b', 'main', [], 'top').main).toEqual(
            split('col', [0.5, 0.5], [pane(['b']), pane(['a'])])
        );
    });

    it('adds a sibling to a split of the same direction, taking half the pane share', () => {
        const main = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const next = splitWith(bench(main, pane(['p'])), 'c', 'main', [0], 'right');
        expect(next.main).toEqual(
            split('row', [0.3, 0.3, 0.4], [pane(['a']), pane(['c']), pane(['b'], 'b')])
        );
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('puts the sibling in front of the pane on the left edge', () => {
        const main = split('row', [0.6, 0.4], [pane(['a']), pane(['b', 'c'])]);
        const next = splitWith(bench(main, pane(['p'])), 'c', 'main', [0], 'left');
        expect(next.main).toEqual(
            split('row', [0.3, 0.3, 0.4], [pane(['c']), pane(['a']), pane(['b'], 'b')])
        );
    });

    it('collapses the pane the tab left, without losing the pane it made', () => {
        const main = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        const next = splitWith(bench(main, pane(['p'])), 'b', 'main', [0], 'bottom');
        expect(next.main).toEqual(split('col', [0.5, 0.5], [pane(['a']), pane(['b'])]));
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('splits a pane of the panel with a tab of the main area', () => {
        const start = bench(pane(['a', 'b']), pane(['p']));
        const next = splitWith(start, 'a', 'panel', [], 'bottom');
        expect(next.panel).toEqual(split('col', [0.5, 0.5], [pane(['p']), pane(['a'])]));
        expect(next.main).toEqual(pane(['b'], 'b'));
        expect(checkWorkbench(next)).toEqual([]);
    });

    it('leaves a pane alone when its own only tab is dropped on its edge', () => {
        const start = bench(pane(['a']), pane(['p']));
        expect(splitWith(start, 'a', 'main', [], 'right')).toBe(start);
    });

    it('leaves the arrangement alone when it names no instance or no pane', () => {
        const start = bench(three(), pane(['p']));
        expect(splitWith(start, 'z', 'main', [0], 'right')).toBe(start);
        expect(splitWith(start, 'a', 'main', [1], 'right')).toBe(start);
    });
});

describe('maximise and restore', () => {
    it('names the pane that is shown alone, and gives it back', () => {
        const start = bench(three(), pane(['p']));
        const zoomed = maximise(start, 'main', [1, 0]);
        expect(zoomed.focus).toEqual({ target: 'main', path: [1, 0] });
        expect(focusedPane(zoomed)).toEqual({ target: 'main', path: [1, 0] });
        expect(checkWorkbench(zoomed)).toEqual([]);
        expect(restore(zoomed)).toEqual(start);
        expect(focusedPane(start)).toBe(null);
    });

    it('maximises a pane of the panel too', () => {
        const start = bench(pane(['a']), split('col', [0.5, 0.5], [pane(['p']), pane(['q'])]));
        expect(maximise(start, 'panel', [1]).focus).toEqual({ target: 'panel', path: [1] });
    });

    it('leaves the arrangement alone when the path names a split or nothing', () => {
        const start = bench(three(), pane(['p']));
        expect(maximise(start, 'main', [1])).toBe(start);
        expect(maximise(start, 'panel', [4])).toBe(start);
        expect(restore(start)).toBe(start);
    });

    it('reports a focus that names no pane and drops it when the pane goes', () => {
        const start = maximise(bench(three(), pane(['p'])), 'main', [1, 1]);
        const gone = { ...start, main: closePane(start.main, [1, 1]) };
        expect(checkWorkbench(gone)).toEqual(['focus names main [1, 1], which is not a pane']);
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

describe('serialiseLayout and parseLayout', () => {
    it('reads back the whole workbench', () => {
        const saved = bench(three(), pane(['p']), 'bottom', 0.42);
        expect(parseWorkbench(saveBench(saved))).toEqual(saved);
        expect(parseWorkbench(JSON.parse(saveBench(saved)))).toEqual(saved);
    });

    it('keeps a view the registry may not know and the instance state', () => {
        const saved = bench(
            {
                kind: 'pane',
                tabs: [{ id: 'a', view: 'from-2027', state: { at: 3, cursor: 'card-one' } }],
                active: 'a'
            },
            pane(['p'])
        );
        expect(parseWorkbench(saveBench(saved))).toEqual(saved);
    });

    it('refuses version 1, which held one tree and no panel, and an envelope with no version', () => {
        const saved = bench(three(), pane(['p']));
        expect(parseWorkbench({ version: 1, layout: three() })).toBe(null);
        expect(parseWorkbench({ version: 1, workbench: saved })).toBe(null);
        expect(parseWorkbench({ workbench: saved })).toBe(null);
        expect(parseWorkbench({ version: WORKBENCH_VERSION, layout: three() })).toBe(null);
    });

    it('refuses a wrong kind, a split with one child, and sizes that do not sum to 1', () => {
        expect(parseWorkbench(envelope({ main: { kind: 'box' } }))).toBe(null);
        expect(
            parseWorkbench(
                envelope({
                    main: { kind: 'split', dir: 'row', sizes: [1], children: [pane(['a'])] }
                })
            )
        ).toBe(null);
        expect(
            parseWorkbench(
                envelope({ panel: split('row', [0.5, 0.4], [pane(['x']), pane(['y'])]) })
            )
        ).toBe(null);
    });

    it('refuses an instance id repeated across the two trees, and a size under the minimum', () => {
        expect(parseWorkbench(envelope({ main: pane(['a']), panel: pane(['a']) }))).toBe(null);
        expect(
            parseWorkbench(
                envelope({ main: split('row', [0.95, 0.05], [pane(['a']), pane(['b'])]) })
            )
        ).toBe(null);
    });

    it('refuses a dock and a panel share it does not know', () => {
        expect(parseWorkbench(envelope({ dock: 'left' }))).toBe(null);
        expect(parseWorkbench(envelope({ dock: 1 }))).toBe(null);
        expect(parseWorkbench(envelope({ panelSize: PANEL_MAX + 0.1 }))).toBe(null);
        expect(parseWorkbench(envelope({ panelSize: PANEL_MIN - 0.01 }))).toBe(null);
        expect(parseWorkbench(envelope({ panelSize: 'wide' }))).toBe(null);
    });

    it('reads back the maximised pane, and a workbench with none', () => {
        const zoomed = maximise(bench(three(), pane(['p'])), 'main', [1, 1]);
        expect(parseWorkbench(saveBench(zoomed))).toEqual(zoomed);
        const plain = bench(three(), pane(['p']));
        const read = parseWorkbench(saveBench(plain));
        expect(read).toEqual(plain);
        expect(read !== null && 'focus' in read).toBe(false);
    });

    it('drops a focus that names no pane rather than refusing the arrangement', () => {
        const zoomed = maximise(bench(three(), pane(['p'])), 'main', [1, 1]);
        const saved = fields(JSON.parse(saveBench(zoomed)));
        // The pane it named is closed by a later release, or by a hand edit of the saved value.
        fields(saved.workbench).main = closePane(zoomed.main, [1, 1]);
        const read = parseWorkbench(saved);
        expect(read?.focus).toBe(undefined);
        expect(read?.main).toEqual(closePane(zoomed.main, [1, 1]));
    });

    it('drops a focus that is not a target and a path', () => {
        for (const focus of ['main', { target: 'left', path: [] }, { target: 'main' }, null]) {
            expect(parseWorkbench(envelope({ focus }))?.focus).toBe(undefined);
        }
        expect(parseWorkbench(envelope({ focus: { target: 'main', path: ['x'] } }))?.focus).toBe(
            undefined
        );
    });

    it('refuses what is not an envelope at all', () => {
        expect(parseWorkbench('not json')).toBe(null);
        expect(parseWorkbench(null)).toBe(null);
        expect(parseWorkbench([1, 2])).toBe(null);
        expect(parseWorkbench(`{"version":${WORKBENCH_VERSION}}`)).toBe(null);
    });
});

describe('checkWorkbench', () => {
    it('says nothing about the default', () => {
        expect(checkWorkbench(defaultWorkbench())).toEqual([]);
    });

    it('names the tree a problem is in, and reports the dock and the share', () => {
        const broken: Workbench = {
            main: { kind: 'pane', tabs: [], active: 'x' },
            panel: pane(['p']),
            dock: 'left' as Dock,
            panelSize: 0.9
        };
        expect(checkWorkbench(broken)).toEqual([
            'main node at []: an empty pane calls x active',
            'dock is "left", not right, bottom or hidden',
            `panelSize is 0.9, outside ${PANEL_MIN} to ${PANEL_MAX}`
        ]);
    });
});

describe('the store', () => {
    it('uses the first pane active tab by default', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b'], 'b'), pane(['c'])]), pane([])));
        expect(activeInstance()).toEqual(instance('b'));
        expect(activeInstance('panel')).toBeNull();
    });

    it('follows the most recently activated main pane independently of the panel', () => {
        loadLayout(fakeStorage());
        apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c', 'd'])]), pane(['p'])));
        activateInstance('main', 'd');
        expect(activeInstance()).toEqual(instance('d'));
        activateInstance('panel', 'p');
        expect(activeInstance()).toEqual(instance('d'));
        expect(activeInstance('panel')).toEqual(instance('p'));
        activateInstance('main', 'b');
        expect(activeInstance()).toEqual(instance('b'));
    });

    it('starts from the default when storage holds nothing, and says so', () => {
        const storage = fakeStorage();
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout('main'))).toEqual(['status']);
        expect(viewsOf(layout('panel'))).toEqual([]);
        expect(dockedAt()).toBe('hidden');
        expect(panelSize()).toBe(PANEL_DEFAULT);
    });

    it('restores a saved arrangement', () => {
        const saved = bench(three(), pane(['p']), 'bottom', 0.4);
        const storage = fakeStorage(saveBench(saved));
        expect(loadLayout(storage)).toBe(true);
        expect(workbench()).toEqual(saved);
    });

    it('falls back to the default on a saved value that fails parseLayout, and overwrites it on the next change', () => {
        const storage = fakeStorage(JSON.stringify({ version: 1, layout: { kind: 'box' } }));
        expect(loadLayout(storage)).toBe(false);
        expect(viewsOf(layout('main'))).toEqual(['status']);

        const saved = bench(three(), pane(['p']));
        apply(saved);
        expect(workbench()).toEqual(saved);
        expect(fields(JSON.parse(storage.held[LAYOUT_KEY])).version).toBe(LAYOUT_VERSION);
        expect(savedBench(storage)).toEqual(saved);
    });

    it('applies an operation to the tree it is told and saves the whole workbench under the one key', () => {
        const storage = fakeStorage(saveBench(bench(pane(['a']), pane(['p']))));
        loadLayout(storage);
        change('panel', (tree) => openInstance(tree, [], instance('q')));
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        expect(layout('main')).toEqual(pane(['a']));
        expect(layout('panel')).toEqual(pane(['p', 'q'], 'q'));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('docks the panel and saves where it went', () => {
        const storage = fakeStorage();
        loadLayout(storage);
        dock('bottom');
        expect(dockedAt()).toBe('bottom');
        expect(savedBench(storage)?.dock).toBe('bottom');
        dock('hidden');
        expect(dockedAt()).toBe('hidden');
    });

    it('holds the panel share inside its range', () => {
        loadLayout(fakeStorage());
        resizePanel(0.45);
        expect(panelSize()).toBe(0.45);
        resizePanel(0.9);
        expect(panelSize()).toBe(PANEL_MAX);
        resizePanel(0.01);
        expect(panelSize()).toBe(PANEL_MIN);
        resizePanel(Number.NaN);
        expect(panelSize()).toBe(PANEL_DEFAULT);
    });

    it('activates the instance a view already has rather than opening a second', () => {
        loadLayout(fakeStorage());
        const before = layout('main');
        const held = before.kind === 'pane' ? before.tabs[0].id : '';
        openView('status', 'main');
        const after = layout('main');
        expect(viewsOf(after)).toEqual(['status']);
        expect(after.kind === 'pane' ? after.active : '').toBe(held);
    });

    // One view, one instance per project: the project view is registered once, so the state's `id`
    // is what tells two of its tabs apart.
    it('activates the instance opened for the same state rather than opening a second', () => {
        loadLayout(fakeStorage());
        openView('project', 'main', { id: 'alpha' });
        const opened = layout('main');
        const held = opened.kind === 'pane' ? opened.active : '';
        openView('project', 'main', { id: 'alpha' });
        const after = layout('main');
        expect(viewsOf(after)).toEqual(['status', 'project']);
        expect(after.kind === 'pane' ? after.active : '').toBe(held);
    });

    it('opens a second instance of one view for a second state', () => {
        loadLayout(fakeStorage());
        openView('project', 'main', { id: 'alpha' });
        openView('project', 'main', { id: 'bravo' });
        const after = layout('main');
        expect(viewsOf(after)).toEqual(['status', 'project', 'project']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { id: 'alpha' }, { id: 'bravo' }]);
    });

    it('still retargets the one instance when the state names no id', () => {
        loadLayout(fakeStorage());
        openView('editor', 'main', { field: 'title' });
        openView('editor', 'main', { field: 'venue' });
        const after = layout('main');
        expect(viewsOf(after)).toEqual(['status', 'editor']);
        const states = after.kind === 'pane' ? after.tabs.map((tab) => tab.state) : [];
        expect(states).toEqual([{}, { field: 'venue' }]);
    });

    it('opens a view the tree does not hold in the pane last activated', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(bench(two, pane(['p'])))));
        activateInstance('main', 'b');
        openView('venues', 'main');
        expect(paneAt(layout('main'), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        expect(paneAt(layout('main'), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
    });

    it('opens into the first pane when nothing has been activated since the load', () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]);
        loadLayout(fakeStorage(saveBench(bench(two, pane(['p'])))));
        openView('venues', 'main');
        expect(paneAt(layout('main'), [0])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
    });

    it('shows a hidden panel when a view is opened into it', () => {
        loadLayout(fakeStorage());
        dock('hidden');
        openView('venues', 'panel');
        expect(dockedAt()).toBe('right');
        expect(viewsOf(layout('panel'))).toEqual(['venues']);
        expect(viewsOf(layout('main'))).toEqual(['status']);
    });

    it('closes an instance in the tree it names', () => {
        loadLayout(fakeStorage(saveBench(bench(pane(['a', 'b']), pane(['p'])))));
        closeInstanceIn('main', 'a');
        expect(layout('main')).toEqual(pane(['b'], 'b'));
        expect(layout('panel')).toEqual(pane(['p']));
    });
});

describe('the store: docking', () => {
    /** A two-pane main area and a one-pane panel, loaded and saved through a fake storage. */
    function load(main: Layout = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])])) {
        const storage = fakeStorage(saveBench(bench(main, pane(['p']))));
        loadLayout(storage);
        return storage;
    }

    it('closes a whole pane and saves what is left', () => {
        const storage = load();
        closePaneIn('main', [1]);
        expect(layout('main')).toEqual(pane(['a']));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('moves a tab to the panel and saves it there', () => {
        const storage = load();
        transferInstance('c', 'panel', [], 0);
        expect(layout('panel')).toEqual({
            kind: 'pane',
            tabs: [instance('c'), instance('p')],
            active: 'c'
        });
        expect(layout('main')).toEqual(split('row', [0.5, 0.5], [pane(['a']), pane(['b'], 'b')]));
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('splits a pane with a tab and saves the new arrangement', () => {
        const storage = load();
        splitInstance('c', 'main', [0], 'bottom');
        expect(layout('main')).toEqual(
            split(
                'row',
                [0.5, 0.5],
                [split('col', [0.5, 0.5], [pane(['a']), pane(['c'])]), pane(['b'], 'b')]
            )
        );
        expect(savedBench(storage)).toEqual(workbench());
    });

    it('shows a hidden panel when a tab is moved into it', () => {
        load();
        dock('hidden');
        transferInstance('c', 'panel', [], 0);
        expect(dockedAt()).toBe('right');
    });

    it('leaves the dock alone when the move performs nothing', () => {
        load();
        dock('hidden');
        transferInstance('nobody', 'panel', [], 0);
        expect(dockedAt()).toBe('hidden');
    });

    it('maximises a pane, saves it, and restores', () => {
        const storage = load();
        maximisePane('main', [1]);
        expect(focused()).toEqual({ target: 'main', path: [1] });
        expect(savedBench(storage)?.focus).toEqual({
            target: 'main',
            path: [1]
        });
        restorePanes();
        expect(focused()).toBe(null);
        expect(savedBench(storage)?.focus).toBe(undefined);
    });

    it('drops the focus when the maximised pane is closed', () => {
        load();
        maximisePane('main', [1]);
        closePaneIn('main', [1]);
        expect(focused()).toBe(null);
        expect(layout('main')).toEqual(pane(['a']));
        expect(checkWorkbench(workbench())).toEqual([]);
    });

    it('opens a view into the maximised pane rather than the pane last activated', () => {
        load();
        activateInstance('main', 'a');
        maximisePane('main', [1]);
        openView('venues', 'main');
        expect(paneAt(layout('main'), [0])?.tabs.map((tab) => tab.view)).toEqual(['projects']);
        expect(paneAt(layout('main'), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'projects',
            'venues'
        ]);
        expect(focused()).toEqual({ target: 'main', path: [1] });
    });

    it('opens a second instance of a view that is open in a pane nobody can see', () => {
        load(
            split(
                'row',
                [0.5, 0.5],
                [{ kind: 'pane', tabs: [instance('a', 'venues')], active: 'a' }, pane(['b'])]
            )
        );
        maximisePane('main', [1]);
        openView('venues', 'main');
        expect(paneAt(layout('main'), [1])?.tabs.map((tab) => tab.view)).toEqual([
            'projects',
            'venues'
        ]);
        expect(paneAt(layout('main'), [0])?.tabs.map((tab) => tab.view)).toEqual(['venues']);
    });

    it('restores rather than opening a view into a tree nobody can see', () => {
        load();
        maximisePane('main', [1]);
        openView('venues', 'panel');
        expect(focused()).toBe(null);
        expect(viewsOf(layout('panel'))).toEqual(['projects', 'venues']);
    });

    it('brings the arrangement back when a tab is moved out of the maximised tree', () => {
        load();
        maximisePane('main', [1]);
        transferInstance('c', 'panel', [], 0);
        expect(focused()).toBe(null);
        expect(viewsOf(layout('panel'))).toEqual(['projects', 'projects']);
    });
});
