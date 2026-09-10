// The layout tree: every operation on hand-built trees, every invariant shown violated once, the
// saved form read and refused, and the store's load and save through a fake storage. Nothing here
// touches localStorage or the DOM: the pure half is state/layout.ts and the store takes the storage
// it is given.

import { describe, expect, it } from 'vitest';
import {
    MAX_CHILDREN,
    MIN_SIZE,
    activate,
    checkLayout,
    closeInstance,
    equalSizes,
    findInstance,
    moveInstance,
    openInstance,
    paneAt,
    panes,
    parseLayout,
    resize,
    serialiseLayout,
    splitPane,
    type Instance,
    type Layout
} from '../../src/lib/state/layout.ts';
import { LAYOUT_KEY, apply, layout, loadLayout } from '../../src/lib/state/layout.svelte.ts';

function instance(id: string, view = 'projects'): Instance {
    return { id, view, state: null };
}

function pane(ids: string[], active?: string): Layout {
    const tabs = ids.map((id) => instance(id));
    return { kind: 'pane', tabs, active: active ?? tabs[0]?.id ?? '' };
}

function split(dir: 'row' | 'col', sizes: number[], children: Layout[]): Layout {
    return { kind: 'split', dir, sizes, children };
}

/** A row of a pane and a column of two panes: three panes at [0], [1, 0] and [1, 1]. */
function three(): Layout {
    return split(
        'row',
        [0.5, 0.5],
        [pane(['a']), split('col', [0.5, 0.5], [pane(['b']), pane(['c'])])]
    );
}

/** A fake Storage: what the store needs of one, and a window on what it wrote. */
function fakeStorage(seed?: string) {
    const held: Record<string, string> = seed === undefined ? {} : { [LAYOUT_KEY]: seed };
    return {
        held,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            held[key] = value;
        }
    };
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

    it('lists every pane with its path, depth first', () => {
        expect(panes(three()).map((found) => found.path)).toEqual([[0], [1, 0], [1, 1]]);
        expect(panes(pane([])).map((found) => found.path)).toEqual([[]]);
    });

    it('finds an instance, its pane and its index', () => {
        const tree = split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])]);
        expect(findInstance(tree, 'b')).toEqual({ instance: instance('b'), path: [0], index: 1 });
        expect(findInstance(tree, 'c')).toEqual({ instance: instance('c'), path: [1], index: 0 });
        expect(findInstance(tree, 'z')).toBe(null);
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
    it('reads back what it wrote', () => {
        const tree = three();
        expect(parseLayout(serialiseLayout(tree))).toEqual(tree);
        expect(parseLayout(JSON.parse(serialiseLayout(tree)))).toEqual(tree);
    });

    it('keeps a view the registry may not know and the instance state', () => {
        const tree: Layout = {
            kind: 'pane',
            tabs: [{ id: 'a', view: 'from-2027', state: { at: 3 } }],
            active: 'a'
        };
        expect(parseLayout(serialiseLayout(tree))).toEqual(tree);
    });

    it('refuses another version', () => {
        const tree = three();
        expect(parseLayout({ version: 2, layout: tree })).toBe(null);
        expect(parseLayout({ layout: tree })).toBe(null);
    });

    it('refuses a wrong kind, a split with one child, and sizes that do not sum to 1', () => {
        expect(parseLayout({ version: 1, layout: { kind: 'box' } })).toBe(null);
        expect(
            parseLayout({
                version: 1,
                layout: { kind: 'split', dir: 'row', sizes: [1], children: [pane(['a'])] }
            })
        ).toBe(null);
        expect(
            parseLayout({
                version: 1,
                layout: split('row', [0.5, 0.4], [pane(['a']), pane(['b'])])
            })
        ).toBe(null);
    });

    it('refuses a duplicate instance id and a size under the minimum', () => {
        expect(
            parseLayout({
                version: 1,
                layout: split('row', [0.5, 0.5], [pane(['a']), pane(['a'])])
            })
        ).toBe(null);
        expect(
            parseLayout({
                version: 1,
                layout: split('row', [0.95, 0.05], [pane(['a']), pane(['b'])])
            })
        ).toBe(null);
    });

    it('refuses what is not an envelope at all', () => {
        expect(parseLayout('not json')).toBe(null);
        expect(parseLayout(null)).toBe(null);
        expect(parseLayout([1, 2])).toBe(null);
        expect(parseLayout('{"version":1}')).toBe(null);
    });
});

describe('the store', () => {
    it('starts from the default when storage holds nothing, and says so', () => {
        const storage = fakeStorage();
        expect(loadLayout(storage)).toBe(false);
        expect(layout()).toEqual({ kind: 'pane', tabs: [], active: '' });
    });

    it('restores a saved arrangement', () => {
        const tree = three();
        const storage = fakeStorage(serialiseLayout(tree));
        expect(loadLayout(storage)).toBe(true);
        expect(layout()).toEqual(tree);
    });

    it('falls back to the default on a saved value that fails parseLayout, and overwrites it on the next apply', () => {
        const storage = fakeStorage(JSON.stringify({ version: 1, layout: { kind: 'box' } }));
        expect(loadLayout(storage)).toBe(false);
        expect(layout()).toEqual({ kind: 'pane', tabs: [], active: '' });

        const tree = three();
        apply(tree);
        expect(layout()).toEqual(tree);
        expect(storage.held[LAYOUT_KEY]).toBe(serialiseLayout(tree));
        expect(parseLayout(storage.held[LAYOUT_KEY])).toEqual(tree);
    });

    it('saves every applied tree under the one key', () => {
        const storage = fakeStorage();
        loadLayout(storage);
        apply(openInstance(layout(), [], instance('a')));
        expect(Object.keys(storage.held)).toEqual([LAYOUT_KEY]);
        expect(parseLayout(storage.held[LAYOUT_KEY])).toEqual(pane(['a'], 'a'));
    });
});
