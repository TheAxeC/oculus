// Layer 2, client-state tests. The saved form of a layout: the envelope of the current version is
// read with every page and tab kept. A rail page records the paths of the documents it was given,
// and a Files or LaTeX tab keeps the state it was saved with, in a workbench page and in a kept
// layout.
//
// Nothing here touches the page state or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    serialiseLayout,
    type Layout,
    type Workbench
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { parseLayout } from '../../../../../src/lib/state/workbench/layout/saved/saved.ts';
import { bench, pane, split } from '../layout-fixture.ts';

type Tab = { id: string; view: string; state: unknown };

/** A pane of tabs whose first is the one shown. */
function paneOf(...tabs: Tab[]): Layout {
    return { kind: 'pane', tabs, active: tabs[0].id };
}

describe('a saved envelope of the current version', () => {
    /** An envelope of the current version over pages whose workbenches are as it saved them. */
    function saved(...held: Record<string, unknown>[]): unknown {
        const pages = held.map((workbench, at) => ({
            id: `page-${at}`,
            label: `Page ${at + 1}`,
            workbench
        }));
        return { version: LAYOUT_VERSION, pages, current: 'page-0', floats: [] };
    }

    /** An envelope of the current version over pages and kept layouts as it saved them. */
    function latest(pages: Record<string, unknown>[], kept?: unknown): unknown {
        return { version: LAYOUT_VERSION, pages, current: pages[0].id, floats: [], kept };
    }

    /** The empty pane a workbench keeps for the documents its views open, as a layout saved it. */
    const documents: Layout = { kind: 'pane', tabs: [], active: '', documents: true };

    /** The tabs of a workbench of one folder, the Files and LaTeX tabs labelled by its name. */
    function folderTabs(path: string, name: string, id: string): Tab[] {
        const own = { root: 'hub', path };
        return [
            { id: `${id}1`, view: 'files', state: { ...own, label: name } },
            { id: `${id}2`, view: 'latex', state: { ...own, label: name } },
            { id: `${id}3`, view: 'search', state: { label: name } },
            { id: `${id}4`, view: 'files', state: { root: 'hub', path: 'other', label: 'By hand' } }
        ];
    }

    const help = (id: string): Layout => paneOf({ id, view: 'help', state: null });
    const page = folderTabs('projects/alpha', 'alpha', 'p');
    const held = folderTabs('projects/beta', 'beta', 'k');
    const workbenchOf = (root: Layout): Record<string, unknown> => ({ root });

    /** The shares of a row of four panes. */
    const QUARTERS = [0.25, 0.25, 0.25, 0.25];

    /** A pane of one tab whose tab row is hidden, as the layout holds it. */
    function hiddenPane(id: string): Layout {
        const shown = pane([id]);
        return shown.kind === 'pane' ? { ...shown, rowHidden: true } : shown;
    }

    const rows: {
        name: string;
        envelope: unknown;
        trees: Workbench[];
        /** The paths each page records as the documents it was given. */
        docs?: unknown[];
        /** The tree of each kept layout. */
        kept?: Layout[];
    }[] = [
        {
            name: 'the current version with every page and tab',
            envelope: saved(
                bench(pane(['a'])),
                bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))
            ),
            trees: [bench(pane(['a'])), bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))]
        },
        {
            name: 'the current version with a documents pane',
            envelope: saved(bench(split('row', [0.5, 0.5], [pane(['a']), documents]))),
            trees: [bench(split('row', [0.5, 0.5], [pane(['a']), documents]))]
        },
        {
            name: 'rail pages: the paths read for a rail page with documents, none for the rest',
            envelope: latest([
                {
                    id: 'page-0',
                    label: 'Help',
                    workbench: workbenchOf(help('t0')),
                    rail: 'help',
                    docs: ['x.md', 'y.md']
                },
                {
                    id: 'page-1',
                    label: 'Old',
                    workbench: workbenchOf(help('t1')),
                    rail: 'sessions'
                },
                {
                    id: 'page-2',
                    label: 'Bad',
                    workbench: workbenchOf(help('t2')),
                    rail: 'focus',
                    docs: 'x.md'
                },
                { id: 'page-3', label: 'Page', workbench: workbenchOf(help('t3')), docs: ['x.md'] }
            ]),
            trees: [bench(help('t0')), bench(help('t1')), bench(help('t2')), bench(help('t3'))],
            docs: [['x.md', 'y.md'], undefined, undefined, undefined]
        },
        {
            name: 'Files and LaTeX tabs: the state is kept on a workbench page',
            envelope: latest([
                {
                    id: 'page-0',
                    label: 'alpha',
                    workbench: workbenchOf(paneOf(...page)),
                    folder: { root: 'hub', path: 'projects/alpha' }
                }
            ]),
            trees: [bench(paneOf(...page))]
        },
        {
            name: 'Files and LaTeX tabs: the state is kept in a kept layout',
            envelope: latest(
                [{ id: 'page-0', label: 'Help', workbench: workbenchOf(help('t4')) }],
                [
                    {
                        folder: { root: 'hub', path: 'projects/beta' },
                        workbench: workbenchOf(paneOf(...held)),
                        states: {}
                    }
                ]
            ),
            trees: [bench(help('t4'))],
            kept: [paneOf(...held)]
        },
        {
            name: 'the current version with a pane whose tab row is hidden',
            envelope: saved({
                root: {
                    kind: 'split',
                    dir: 'row',
                    sizes: QUARTERS,
                    children: [
                        { ...pane(['a']), rowHidden: true },
                        { ...pane(['b']), rowHidden: false },
                        { ...pane(['c']), rowHidden: 'yes' },
                        pane(['d'])
                    ]
                }
            }),
            trees: [
                bench(
                    split('row', QUARTERS, [hiddenPane('a'), pane(['b']), pane(['c']), pane(['d'])])
                )
            ]
        }
    ];

    it.each(rows)('reads $name', ({ envelope, trees, docs, kept }) => {
        const read = parseLayout(envelope);
        if (read === null) throw new Error('the envelope was not read');
        expect(read.pages.map((page) => page.workbench)).toEqual(trees);
        expect(read.pages.map((page) => page.docs)).toEqual(docs ?? trees.map(() => undefined));
        expect(read.current).toBe('page-0');
        expect((read.kept ?? []).map((one) => one.workbench.root)).toEqual(kept ?? []);
        const written = JSON.parse(serialiseLayout(read)) as { version: number };
        expect(written.version).toBe(LAYOUT_VERSION);
    });
});
