// The saved form of a layout: the invariants over a folded split, and the two older envelopes read
// by migration. A browser that holds a workbench of two trees and a docked panel opens it as the one
// tree a page now is, and no tab is lost on the way.
//
// Nothing here touches localStorage or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    PAGES_VERSION,
    WORKBENCH_VERSION,
    checkLayout,
    checkWorkbench,
    defaultWorkbench,
    parseLayout,
    parseWorkbench,
    type Layout,
    type Workbench
} from '../../src/lib/state/layout/index.ts';
import { normaliseSizes } from '../../src/lib/state/layout/tree.ts';
import { bench, docked, envelope, folded, pane, split, three, viewsOf } from './layout-fixture.ts';

describe('checkLayout over a folded split', () => {
    it('reports a folded index that is not a child', () => {
        const tree = folded(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]), [2]);
        expect(checkLayout(tree)).toEqual(['node at []: folded names 2, which is not a child']);
    });

    it('reports a split with every child folded', () => {
        const tree = folded(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]), [0, 1]);
        expect(checkLayout(tree)).toEqual([
            'node at []: every child is folded, which leaves the split nothing to show'
        ]);
    });

    it('reports a folded that is not an array', () => {
        const tree = {
            kind: 'split',
            dir: 'row',
            sizes: [0.5, 0.5],
            children: [pane(['a']), pane(['b'])],
            folded: 1
        } as unknown as Layout;
        expect(checkLayout(tree)).toEqual(['node at []: folded is not an array']);
    });
});

describe('the version 2 envelope, read as one tree', () => {
    /** The tree of the two-tree workbench a version 2 envelope holds, after its migration. */
    function read(over: Record<string, unknown>): Workbench | null {
        return parseWorkbench(envelope(over));
    }

    it('keeps the main tree as the root when the panel holds nothing', () => {
        const saved = read({ main: three(), panel: pane([]), dock: 'right' });
        expect(saved).toEqual(bench(three()));
    });

    it('keeps the main tree as the root when the panel is hidden and holds nothing', () => {
        expect(read({ main: pane(['a']), panel: pane([]), dock: 'hidden' })).toEqual(
            bench(pane(['a']))
        );
    });

    it('makes a row of the two trees for a panel on the right, at the share it had', () => {
        expect(
            read({ main: pane(['a']), panel: pane(['p']), dock: 'right', panelSize: 0.4 })
        ).toEqual(bench(split('row', [0.6, 0.4], [pane(['a']), pane(['p'])])));
    });

    it('makes a column of the two trees for a panel along the bottom', () => {
        expect(
            read({ main: pane(['a']), panel: pane(['p']), dock: 'bottom', panelSize: 0.3 })
        ).toEqual(bench(split('col', [0.7, 0.3], [pane(['a']), pane(['p'])])));
    });

    it('folds the panel child of a hidden panel that still holds tabs, losing none of them', () => {
        const saved = read({ main: pane(['a']), panel: pane(['p', 'q']), dock: 'hidden' });
        expect(saved).toEqual(
            bench(folded(split('row', [0.7, 0.3], [pane(['a']), pane(['p', 'q'])]), [1]))
        );
        expect(saved !== null && viewsOf(saved.root)).toEqual(['projects', 'projects', 'projects']);
    });

    it('carries the maximised pane of either tree into the tree it became part of', () => {
        const inMain = read({
            main: three(),
            panel: pane(['p']),
            focus: { target: 'main', path: [1, 0] }
        });
        expect(inMain?.focus).toEqual({ path: [0, 1, 0] });
        const inPanel = read({
            main: pane(['a']),
            panel: split('col', [0.5, 0.5], [pane(['p']), pane(['q'])]),
            focus: { target: 'panel', path: [1] }
        });
        expect(inPanel?.focus).toEqual({ path: [1, 1] });
    });

    it('carries the maximised pane of the main tree when the panel is dropped', () => {
        const saved = read({
            main: three(),
            panel: pane([]),
            focus: { target: 'main', path: [0] }
        });
        expect(saved?.focus).toEqual({ path: [0] });
    });

    it('drops a focus that names no pane and one that is not a tree and a path', () => {
        expect(read({ focus: { target: 'main', path: [7] } })?.focus).toBe(undefined);
        for (const focus of ['main', { target: 'left', path: [] }, { target: 'main' }, null]) {
            expect(read({ focus })?.focus).toBe(undefined);
        }
        expect(read({ focus: { target: 'main', path: ['x'] } })?.focus).toBe(undefined);
    });

    it('drops a pane maximised inside a hidden panel, which would be shown alone from inside a strip', () => {
        const saved = read({
            main: pane(['a']),
            panel: pane(['p']),
            dock: 'hidden',
            focus: { target: 'panel', path: [] }
        });
        expect(saved?.focus).toBe(undefined);
        expect(saved?.root.kind === 'split' ? saved.root.folded : 'missing').toEqual([1]);
    });

    it('drops a focus that named the panel when the panel held nothing', () => {
        const saved = read({
            main: three(),
            panel: pane([]),
            focus: { target: 'panel', path: [] }
        });
        expect(saved).toEqual(bench(three()));
    });

    it('keeps a view the registry may not know and the instance state', () => {
        const saved = read({
            main: {
                kind: 'pane',
                tabs: [{ id: 'a', view: 'from-2027', state: { at: 3, cursor: 'card-one' } }],
                active: 'a'
            },
            panel: pane([])
        });
        expect(saved).toEqual(
            bench({
                kind: 'pane',
                tabs: [{ id: 'a', view: 'from-2027', state: { at: 3, cursor: 'card-one' } }],
                active: 'a'
            })
        );
    });

    it('refuses version 1, an envelope with no version, and one with no workbench', () => {
        expect(parseWorkbench({ version: 1, layout: three() })).toBe(null);
        expect(parseWorkbench({ version: 1, workbench: docked(three(), pane(['p'])) })).toBe(null);
        expect(parseWorkbench({ workbench: docked(three(), pane(['p'])) })).toBe(null);
        expect(parseWorkbench({ version: WORKBENCH_VERSION, layout: three() })).toBe(null);
    });

    it('refuses a wrong kind, a split with one child, and sizes that do not sum to 1', () => {
        expect(read({ main: { kind: 'box' } })).toBe(null);
        expect(
            read({ main: { kind: 'split', dir: 'row', sizes: [1], children: [pane(['a'])] } })
        ).toBe(null);
        expect(read({ panel: split('row', [0.5, 0.4], [pane(['x']), pane(['y'])]) })).toBe(null);
    });

    it('refuses an instance id repeated across the two trees, and a size under the minimum', () => {
        expect(read({ main: pane(['a']), panel: pane(['a']) })).toBe(null);
        expect(read({ main: split('row', [0.95, 0.05], [pane(['a']), pane(['b'])]) })).toBe(null);
    });

    it('refuses a dock it does not know, and takes the default share for one it cannot read', () => {
        expect(read({ dock: 'left' })).toBe(null);
        expect(read({ dock: 1 })).toBe(null);
        expect(read({ panelSize: 'wide' })).toEqual(
            bench(split('row', [0.7, 0.3], [pane(['a']), pane(['b'])]))
        );
    });

    // A share outside the range a panel could take is normalised rather than refused, since refusing
    // the envelope would drop every tab of the page.
    it('normalises a numeric share the old range would have refused', () => {
        const saved = read({ panelSize: 0.95 });
        expect(saved).toEqual(
            bench(split('row', normaliseSizes([0.05, 0.95]), [pane(['a']), pane(['b'])]))
        );
        expect(saved === null ? [] : checkWorkbench(saved)).toEqual([]);
    });

    it('refuses what is not an envelope at all', () => {
        expect(parseWorkbench('not json')).toBe(null);
        expect(parseWorkbench(null)).toBe(null);
        expect(parseWorkbench([1, 2])).toBe(null);
        expect(parseWorkbench(`{"version":${WORKBENCH_VERSION}}`)).toBe(null);
    });
});

describe('the version 3 envelope, read as pages of one tree', () => {
    /** A version 3 envelope over pages whose workbenches hold two trees. */
    function saved(...held: Record<string, unknown>[]): unknown {
        const pages = held.map((workbench, at) => ({
            id: `page-${at}`,
            label: `Page ${at + 1}`,
            workbench
        }));
        return { version: PAGES_VERSION, pages, current: 'page-0' };
    }

    it('migrates every page, and reads which one was current', () => {
        const read = parseLayout(
            saved(docked(pane(['a']), pane([]), 'hidden'), docked(pane(['b']), pane(['p']))),
            'Page 1'
        );
        expect(read?.pages.map((page) => page.workbench)).toEqual([
            bench(pane(['a'])),
            bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))
        ]);
        expect(read?.current).toBe('page-0');
    });

    it('folds the panel child of a hidden panel that holds tabs, on a page too', () => {
        const read = parseLayout(saved(docked(pane(['a']), pane(['p']), 'hidden')), 'Page 1');
        expect(read?.pages[0].workbench).toEqual(
            bench(folded(split('row', [0.7, 0.3], [pane(['a']), pane(['p'])]), [1]))
        );
    });

    it('makes a column of the two trees for a page whose panel sat along the bottom', () => {
        const read = parseLayout(saved(docked(pane(['a']), pane(['p']), 'bottom', 0.25)), 'Page 1');
        expect(read?.pages[0].workbench).toEqual(
            bench(split('col', [0.75, 0.25], [pane(['a']), pane(['p'])]))
        );
    });

    it('reads a repeated folded index once, so the strip is counted once', () => {
        const root = folded(
            split('row', [0.5, 0.3, 0.2], [pane(['a']), pane(['b']), pane(['c'])]),
            [1, 1]
        );
        const read = parseLayout(
            {
                version: LAYOUT_VERSION,
                pages: [{ id: 'p', label: 'P', workbench: { root } }],
                current: 'p'
            },
            'P'
        );
        const held = read?.pages[0].workbench.root;
        expect(held?.kind === 'split' ? held.folded : 'missing').toEqual([1]);
    });

    it('refuses a page whose workbench does not read', () => {
        expect(
            parseLayout(saved({ main: { kind: 'box' }, panel: pane([]), dock: 'right' }), '')
        ).toBe(null);
    });
});

describe('checkWorkbench', () => {
    it('says nothing about the default, which is one pane on the first view', () => {
        expect(checkWorkbench(defaultWorkbench())).toEqual([]);
        expect(viewsOf(defaultWorkbench().root)).toEqual(['status']);
    });

    it('names the tree a problem is in, and reports a focus that names no pane', () => {
        const broken: Workbench = {
            root: { kind: 'pane', tabs: [], active: 'x' },
            focus: { path: [3] }
        };
        expect(checkWorkbench(broken)).toEqual([
            'root node at []: an empty pane calls x active',
            'focus names [3], which is not a pane'
        ]);
    });
});
