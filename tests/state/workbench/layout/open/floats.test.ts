// Layer 2, client-state tests. The pure operations over floats: a pane put over the page, a tab put
// over it, a float docked to an edge and freed again, put back into a page, moved and resized, and
// the shipped floats taken in by a layout saved before there were floats. Each runs over hand-built
// pages and answers the pages it was given when it names nothing.

import { describe, expect, it } from 'vitest';
import {
    FLOAT_MIN,
    adoptFloats,
    dockFloat,
    floatPane,
    floatTab,
    floatsFrom,
    freeFloat,
    placeFloat,
    returnFloat
} from '../../../../../src/lib/state/workbench/layout/open/floats.ts';
import {
    panes,
    tabsOf,
    type Float,
    type Pages,
    type Pane
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { floating, heldPages, pageAround, pane, paneOf, split } from '../layout-fixture.ts';

/** A pane of these tabs with Lock Group on. */
function lockedPane(ids: string[]): Pane {
    return { ...paneOf(ids), locked: true };
}

/** Two panes side by side, the left one 0.7 of the page. */
function twoPanes(): Pages {
    return heldPages([
        pageAround('main', split('row', [0.7, 0.3], [pane(['a', 'b'], 'b'), pane(['c', 'd'])]))
    ]);
}

/** The tab ids of a float's pane. */
function ids(float: Float | undefined): string[] {
    return float?.pane.tabs.map((tab) => tab.id) ?? [];
}

describe('floatPane', () => {
    it('takes the right pane of a two-pane page out of the tree and centres it as a free float', () => {
        const before = twoPanes();
        const after = floatPane(before, 'main', [1]);
        const root = after.pages[0].workbench.root;
        expect(panes(root).map(({ pane: one }) => one.tabs.map((tab) => tab.id))).toEqual([
            ['a', 'b']
        ]);
        expect(root.kind).toBe('pane');
        expect(after.floats).toHaveLength(1);
        expect(ids(after.floats[0])).toEqual(['c', 'd']);
        expect(after.floats[0].pane.active).toBe('c');
        expect(after.floats[0].place.kind).toBe('free');
        if (after.floats[0].place.kind !== 'free') return;
        expect(after.floats[0].place.w).toBeCloseTo(0.3);
        expect(after.floats[0].place.h).toBeCloseTo(0.4);
        expect(after.floats[0].place.x).toBeCloseTo(0.35);
        expect(after.floats[0].place.y).toBeCloseTo(0.3);
        expect(before.floats).toEqual([]);
    });

    it("keeps the pane's own active tab", () => {
        const after = floatPane(twoPanes(), 'main', [0]);
        expect(after.floats[0].pane.active).toBe('b');
    });

    it("leaves an empty documents pane in a page's only pane and holds the tabs in the float", () => {
        const only = heldPages([pageAround('main', pane(['a', 'b']))]);
        const after = floatPane(only, 'main', []);
        expect(after.pages[0].workbench.root).toEqual({ kind: 'pane', tabs: [], active: '' });
        expect(ids(after.floats[0])).toEqual(['a', 'b']);
    });

    it('gives the float an id of its own, apart from every page and every tab', () => {
        const after = floatPane(twoPanes(), 'main', [1]);
        const id = after.floats[0].id;
        expect(id).not.toBe('');
        expect(id).not.toBe('main');
        expect(tabsOf(after.pages[0].workbench.root).map((tab) => tab.id)).not.toContain(id);
    });

    it('settles a maximised pane that was the one floated', () => {
        const before = twoPanes();
        before.pages[0].workbench.focus = { path: [1] };
        const after = floatPane(before, 'main', [1]);
        expect(after.pages[0].workbench.focus).toBeUndefined();
    });

    it('answers its pages when the page, the path or the pane names nothing to float', () => {
        const before = twoPanes();
        expect(floatPane(before, 'gone', [1])).toBe(before);
        expect(floatPane(before, 'main', [7])).toBe(before);
        expect(floatPane(before, 'main', [])).toBe(before);
        const empty = heldPages([pageAround('main', paneOf([]))]);
        expect(floatPane(empty, 'main', [])).toBe(empty);
    });
});

describe('floatTab', () => {
    it('takes the tab out of its pane and floats it at the point, kept inside the window', () => {
        const after = floatTab(twoPanes(), 'c', { x: 0.5, y: 0.2 });
        expect(ids(after.floats[0])).toEqual(['c']);
        expect(after.floats[0].place).toEqual({ kind: 'free', x: 0.5, y: 0.2, w: 0.3, h: 0.4 });
        expect(tabsOf(after.pages[0].workbench.root).map((tab) => tab.id)).toEqual(['a', 'b', 'd']);
        const edge = floatTab(twoPanes(), 'c', { x: 0.95, y: 0.9 });
        expect(edge.floats[0].place).toEqual({ kind: 'free', x: 0.7, y: 0.6, w: 0.3, h: 0.4 });
    });

    it('cleans the pane it left as a move does: a pane left with nothing goes', () => {
        const one = heldPages([
            pageAround('main', split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]))
        ]);
        const after = floatTab(one, 'b', { x: 0.1, y: 0.1 });
        expect(after.pages[0].workbench.root).toEqual(pane(['a']));
    });

    it('lets the keep rule hold the emptied pane, as a close does', () => {
        const one = heldPages([
            pageAround('main', split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]))
        ]);
        const after = floatTab(one, 'b', { x: 0.1, y: 0.1 }, () => 'documents');
        const kept = panes(after.pages[0].workbench.root).map(({ pane: one }) => one.tabs.length);
        expect(kept).toEqual([1, 0]);
    });

    it("takes a float's tab to a new float and removes the float it left empty", () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x'])]);
        const after = floatTab(before, 'x', { x: 0.4, y: 0.4 });
        expect(after.floats).toHaveLength(1);
        expect(after.floats[0].id).not.toBe('f');
        expect(ids(after.floats[0])).toEqual(['x']);
    });

    it('answers its pages for an instance nothing holds', () => {
        const before = twoPanes();
        expect(floatTab(before, 'nothing', { x: 0.1, y: 0.1 })).toBe(before);
    });
});

describe('dockFloat', () => {
    it('docks a free float on an edge no float holds, at the starting size', () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x', 'y'])]);
        const after = dockFloat(before, 'f', 'right');
        expect(after.floats).toHaveLength(1);
        expect(after.floats[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
        expect(ids(after.floats[0])).toEqual(['x', 'y']);
    });

    it("takes the tabs into the float already docked on the edge, the moved one's active tab active", () => {
        const g = floating('g', ['g1', 'g2'], { kind: 'dock', edge: 'right', size: 0.4 });
        const f = {
            ...floating('f', ['f1', 'f2']),
            pane: { ...paneOf(['f1', 'f2']), active: 'f2' }
        };
        const after = dockFloat(heldPages([pageAround('main', pane(['a']))], [g, f]), 'f', 'right');
        expect(after.floats.map((one) => one.id)).toEqual(['g']);
        expect(ids(after.floats[0])).toEqual(['g1', 'g2', 'f1', 'f2']);
        expect(after.floats[0].pane.active).toBe('f2');
        expect(after.floats[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.4 });
    });

    it('moves a docked float to another edge and keeps its size', () => {
        const f = floating('f', ['x'], { kind: 'dock', edge: 'right', size: 0.4 });
        const after = dockFloat(heldPages([pageAround('main', pane(['a']))], [f]), 'f', 'bottom');
        expect(after.floats[0].place).toEqual({ kind: 'dock', edge: 'bottom', size: 0.4 });
    });

    it('answers its pages for a float already docked there and for an id nothing holds', () => {
        const f = floating('f', ['x'], { kind: 'dock', edge: 'left', size: 0.3 });
        const before = heldPages([pageAround('main', pane(['a']))], [f]);
        expect(dockFloat(before, 'f', 'left')).toBe(before);
        expect(dockFloat(before, 'gone', 'left')).toBe(before);
    });
});

describe('freeFloat', () => {
    it('floats a docked float again, centred at the starting size', () => {
        const f = floating('f', ['x'], { kind: 'dock', edge: 'bottom', size: 0.4 });
        const after = freeFloat(heldPages([pageAround('main', pane(['a']))], [f]), 'f');
        expect(after.floats[0].place.kind).toBe('free');
        if (after.floats[0].place.kind !== 'free') return;
        expect(after.floats[0].place.x).toBeCloseTo(0.35);
        expect(after.floats[0].place.y).toBeCloseTo(0.3);
    });

    it('answers its pages for a float that is free already', () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x'])]);
        expect(freeFloat(before, 'f')).toBe(before);
    });
});

describe('returnFloat', () => {
    it("puts the tabs back as a new pane split off the right of the page's largest pane", () => {
        const f = floating('f', ['x', 'y']);
        const before = heldPages(
            [pageAround('main', split('row', [0.7, 0.3], [pane(['a']), pane(['c'])]))],
            [f]
        );
        const after = returnFloat(before, 'f', 'main');
        const root = after.pages[0].workbench.root;
        expect(root.kind).toBe('split');
        if (root.kind !== 'split') return;
        expect(root.dir).toBe('row');
        expect(root.sizes[0]).toBeCloseTo(0.35);
        expect(root.sizes[1]).toBeCloseTo(0.35);
        expect(root.sizes[2]).toBeCloseTo(0.3);
        expect(panes(root).map(({ pane: one }) => one.tabs.map((tab) => tab.id))).toEqual([
            ['a'],
            ['x', 'y'],
            ['c']
        ]);
        expect(after.floats).toEqual([]);
    });

    it('measures a pane by the share of the whole page it holds, nested splits included', () => {
        const nested = split(
            'row',
            [0.5, 0.5],
            [pane(['a']), split('col', [0.8, 0.2], [pane(['b']), pane(['c'])])]
        );
        const before = heldPages([pageAround('main', nested)], [floating('f', ['x'])]);
        const after = returnFloat(before, 'f', 'main');
        const order = panes(after.pages[0].workbench.root).map(({ pane: one }) => one.tabs[0].id);
        // The left pane holds 0.5 of the page and the nested 0.8 of 0.5 holds 0.4, so the left
        // pane is the largest and the new pane is the one after it.
        expect(order).toEqual(['a', 'x', 'b', 'c']);
    });

    it("splits a page's only pane and shows the page whole again", () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x'])]);
        before.pages[0].workbench.focus = { path: [] };
        const after = returnFloat(before, 'f', 'main');
        expect(panes(after.pages[0].workbench.root)).toHaveLength(2);
        expect(after.pages[0].workbench.focus).toBeUndefined();
    });

    it('answers its pages for a page or a float that is not there', () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x'])]);
        expect(returnFloat(before, 'f', 'gone')).toBe(before);
        expect(returnFloat(before, 'gone', 'main')).toBe(before);
    });
});

describe('placeFloat', () => {
    const base = heldPages(
        [pageAround('main', pane(['a']))],
        [floating('f', ['x']), floating('d', ['y'], { kind: 'dock', edge: 'left', size: 0.3 })]
    );

    it('moves and resizes a free float, and resizes a docked one', () => {
        const moved = placeFloat(base, 'f', { kind: 'free', x: 0.5, y: 0.5, w: 0.4, h: 0.4 });
        expect(moved.floats[0].place).toEqual({ kind: 'free', x: 0.5, y: 0.5, w: 0.4, h: 0.4 });
        const sized = placeFloat(base, 'd', { kind: 'dock', edge: 'left', size: 0.45 });
        expect(sized.floats[1].place).toEqual({ kind: 'dock', edge: 'left', size: 0.45 });
    });

    it.each([
        ['a float past the right edge', { kind: 'free', x: 0.9, y: 0, w: 0.3, h: 0.4 }],
        ['a float past the bottom edge', { kind: 'free', x: 0, y: 0.7, w: 0.3, h: 0.4 }],
        ['a float under the least width', { kind: 'free', x: 0, y: 0, w: FLOAT_MIN / 2, h: 0.4 }],
        ['a float under the least height', { kind: 'free', x: 0, y: 0, w: 0.3, h: FLOAT_MIN / 2 }],
        ['a float at a negative place', { kind: 'free', x: -0.1, y: 0, w: 0.3, h: 0.4 }],
        [
            'a float with a place that is not a number',
            { kind: 'free', x: NaN, y: 0, w: 0.3, h: 0.4 }
        ]
    ] as const)('refuses %s', (_name, place) => {
        expect(placeFloat(base, 'f', place)).toBe(base);
    });

    it('refuses a dock past 0.6 or under the least, and a dock on an edge another float holds', () => {
        expect(placeFloat(base, 'd', { kind: 'dock', edge: 'left', size: 0.61 })).toBe(base);
        expect(placeFloat(base, 'd', { kind: 'dock', edge: 'left', size: FLOAT_MIN / 2 })).toBe(
            base
        );
        const crowded = heldPages(
            [pageAround('main', pane(['a']))],
            [
                floating('d', ['y'], { kind: 'dock', edge: 'left', size: 0.3 }),
                floating('e', ['z'], { kind: 'dock', edge: 'right', size: 0.3 })
            ]
        );
        expect(placeFloat(crowded, 'e', { kind: 'dock', edge: 'left', size: 0.3 })).toBe(crowded);
    });

    it('answers its pages for an id nothing holds', () => {
        expect(placeFloat(base, 'gone', { kind: 'free', x: 0, y: 0, w: 0.3, h: 0.4 })).toBe(base);
    });
});

describe('adoptFloats', () => {
    const spec = [
        {
            pane: paneOf(['hpc-new', 'usage-new']),
            place: { kind: 'dock', edge: 'right', size: 0.3 } as const
        }
    ];
    const view = (id: string, view: string) => ({ id, view, state: null });

    it('moves each tab of a view a shipped float holds out of its page into that float, ids kept', () => {
        const left = pane(['focus-1']);
        const right = {
            kind: 'pane' as const,
            tabs: [view('h', 'hpc'), view('u', 'usage')],
            active: 'h'
        };
        const specs = [
            {
                pane: {
                    kind: 'pane' as const,
                    tabs: [view('n1', 'hpc'), view('n2', 'usage')],
                    active: 'n1'
                },
                place: { kind: 'dock', edge: 'right', size: 0.3 } as const
            }
        ];
        const before = heldPages([pageAround('main', split('row', [0.7, 0.3], [left, right]))]);
        const after = adoptFloats(before, specs);
        expect(after.pages[0].workbench.root).toEqual(left);
        expect(after.floats).toHaveLength(1);
        expect(after.floats[0].pane.tabs.map((tab) => tab.id)).toEqual(['h', 'u']);
        expect(after.floats[0].place).toEqual({ kind: 'dock', edge: 'right', size: 0.3 });
    });

    it('moves a tab of a view found on another page, and makes new the ones that are not found', () => {
        const specs = [
            {
                pane: {
                    kind: 'pane' as const,
                    tabs: [view('n1', 'hpc'), view('n2', 'usage')],
                    active: 'n1'
                },
                place: { kind: 'dock', edge: 'right', size: 0.3 } as const
            }
        ];
        const before = heldPages(
            [
                pageAround('one', pane(['a'])),
                pageAround('two', {
                    kind: 'pane',
                    tabs: [view('u', 'usage'), view('k', 'files')],
                    active: 'u'
                })
            ],
            []
        );
        const after = adoptFloats(before, specs);
        const tabs = after.floats[0].pane.tabs;
        expect(tabs).toHaveLength(2);
        expect(tabs.map((tab) => tab.view)).toEqual(['hpc', 'usage']);
        expect(tabs[1].id).toBe('u');
        expect(tabs[0].id).not.toBe('n1');
        expect(tabsOf(after.pages[1].workbench.root).map((tab) => tab.id)).toEqual(['k']);
    });

    it('takes every tab of the view out of the pages, the first one into the float', () => {
        // Revert: adoptFloats moving only the first tab of a view a page holds.
        const specs = [
            {
                pane: { kind: 'pane' as const, tabs: [view('n1', 'hpc')], active: 'n1' },
                place: { kind: 'dock', edge: 'right', size: 0.3 } as const
            }
        ];
        const before = heldPages(
            [
                pageAround('one', {
                    kind: 'pane',
                    tabs: [view('h1', 'hpc'), view('a', 'files')],
                    active: 'h1'
                }),
                pageAround('two', {
                    kind: 'pane',
                    tabs: [view('h2', 'hpc'), view('k', 'files')],
                    active: 'h2'
                })
            ],
            []
        );
        const after = adoptFloats(before, specs);
        expect(ids(after.floats[0])).toEqual(['h1']);
        expect(tabsOf(after.pages[0].workbench.root).map((tab) => tab.id)).toEqual(['a']);
        expect(tabsOf(after.pages[1].workbench.root).map((tab) => tab.id)).toEqual(['k']);
    });

    it('docks one float to an edge once, the first of two shipped for it', () => {
        const dup = [spec[0], { ...spec[0], pane: paneOf(['other']) }];
        const after = adoptFloats(heldPages([pageAround('main', pane(['a']))]), dup);
        expect(after.floats).toHaveLength(1);
    });

    it('keeps the floats the pages already hold and the page on screen', () => {
        const before = heldPages([pageAround('main', pane(['a']))], [floating('f', ['x'])]);
        const after = adoptFloats(before, []);
        expect(after).toEqual(before);
    });
});

describe('floatsFrom', () => {
    it('mints an id for each float and each tab, so two makings share none', () => {
        const specs = [
            {
                pane: paneOf(['t1', 't2']),
                place: { kind: 'dock', edge: 'left', size: 0.3 } as const
            }
        ];
        const first = floatsFrom(specs);
        const second = floatsFrom(specs);
        const all = [first, second].flat();
        const everyId = all.flatMap((float) => [float.id, ...float.pane.tabs.map((tab) => tab.id)]);
        expect(new Set(everyId).size).toBe(everyId.length);
        expect(first[0].pane.tabs.map((tab) => tab.view)).toEqual(['projects', 'projects']);
        expect(first[0].pane.active).toBe(first[0].pane.tabs[0].id);
    });

    it('is empty for no floats, and drops a second float docked on one edge', () => {
        expect(floatsFrom([])).toEqual([]);
        const same = { kind: 'dock', edge: 'left', size: 0.3 } as const;
        expect(
            floatsFrom([
                { pane: paneOf(['a']), place: same },
                { pane: paneOf(['b']), place: same }
            ])
        ).toHaveLength(1);
    });
});

describe('a locked pane made a float', () => {
    const place = { kind: 'dock', edge: 'left', size: 0.3 } as const;

    it('stays locked when the pane of a page is floated', () => {
        const before = heldPages([
            pageAround('main', split('row', [0.7, 0.3], [pane(['a', 'b']), lockedPane(['c', 'd'])]))
        ]);
        const after = floatPane(before, 'main', [1]);
        expect(after.floats[0].pane.locked).toBe(true);
    });

    it('stays locked when a shipped float is made from a locked pane or takes tabs in', () => {
        const made = floatsFrom([{ pane: lockedPane(['t1', 't2']), place }]);
        expect(made[0].pane.locked).toBe(true);
        const adopted = adoptFloats(heldPages([pageAround('main', pane(['m']))]), [
            { pane: lockedPane(['n1']), place }
        ]);
        expect(adopted.floats[0].pane.locked).toBe(true);
    });

    it('stays locked through a dock, a free float, a move and a return to a page', () => {
        const held = heldPages(
            [pageAround('main', pane(['a']))],
            [{ id: 'fl', pane: lockedPane(['x']), place: floating('fl', ['x']).place }]
        );
        const docked = dockFloat(held, 'fl', 'right');
        expect(docked.floats[0].pane.locked).toBe(true);
        expect(freeFloat(docked, 'fl').floats[0].pane.locked).toBe(true);
        const moved = placeFloat(held, 'fl', { kind: 'free', x: 0.2, y: 0.2, w: 0.3, h: 0.3 });
        expect(moved.floats[0].pane.locked).toBe(true);
        const back = returnFloat(held, 'fl', 'main');
        expect(panes(back.pages[0].workbench.root).map(({ pane: one }) => one.locked)).toEqual([
            undefined,
            true
        ]);
    });
});
