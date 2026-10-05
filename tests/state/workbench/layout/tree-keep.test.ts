// Layer 2, client-state tests. The pane a closed last tab leaves (removeTab of
// state/workbench/layout/tree.ts): a page keeps never more than one empty unlocked pane, whatever
// its kind, and a locked pane is left empty whatever the rule says.
//
// Nothing here touches the DOM or a store: every case reads a tree built by hand.

import { describe, expect, it } from 'vitest';
import { panes, removeTab, type Layout } from '../../../../src/lib/state/workbench/layout/index.ts';
import { instance, pane, split } from './layout-fixture.ts';

/** The rule of the store: a Terminal tab and a document keep their pane, a tool view does not. */
const KEEP = (view: string): 'documents' | 'terminals' | null => {
    if (view === 'terminal') return 'terminals';
    return view === 'file' ? 'documents' : null;
};

/** A pane holding one tab of a view. */
function holding(id: string, view: string): Layout {
    return { kind: 'pane', tabs: [instance(id, view)], active: id };
}

/** The panes of a tree as `tabs/keeps` words, left to right. */
function shape(tree: Layout): string[] {
    return panes(tree).map(({ pane: one }) => `${one.tabs.length}/${one.keeps ?? '-'}`);
}

const ROWS: [string, Layout, number[], string[]][] = [
    [
        'an empty documents pane is on the page: the pane of the last Terminal tab goes',
        split('row', [0.5, 0.5], [pane([]), holding('t', 'terminal')]),
        [1],
        ['0/-']
    ],
    [
        'an empty terminals pane is on the page: the pane of the last document goes',
        split(
            'row',
            [0.5, 0.5],
            [{ kind: 'pane', tabs: [], active: '', keeps: 'terminals' }, holding('f', 'file')]
        ),
        [1],
        ['0/terminals']
    ],
    [
        'no other pane is empty: the pane of the last Terminal tab stays, empty',
        split('row', [0.5, 0.5], [holding('a', 'status'), holding('t', 'terminal')]),
        [1],
        ['1/-', '0/terminals']
    ],
    [
        'the only other empty pane is locked: the pane of the last Terminal tab stays',
        split(
            'row',
            [0.5, 0.5],
            [{ kind: 'pane', tabs: [], active: '', locked: true }, holding('t', 'terminal')]
        ),
        [1],
        ['0/-', '0/terminals']
    ],
    [
        'the last tab of a tool view: the pane goes whatever else is on the page',
        split('row', [0.5, 0.5], [holding('a', 'status'), holding('s', 'status')]),
        [1],
        ['1/-']
    ]
];

describe('the pane a closed last tab leaves', () => {
    it.each(ROWS)('%s', (_title, tree, path, expected) => {
        expect(shape(removeTab(tree, path, 0, KEEP))).toEqual(expected);
    });
});
