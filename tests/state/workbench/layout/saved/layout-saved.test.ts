// Layer 2, client-state tests. The saved form of a layout: the older envelope read by migration. A
// workbench of two trees and a docked panel opens as the one tree a page now is; a tab of a retired
// view (`changes`, `agents`) is carried to its successor, or dropped where a tab of the successor
// already holds the pane; and every other tab is kept. A rail page records the paths of the
// documents it was given, and a Files or LaTeX tab labelled by its folder's own name is read
// without the label, in a workbench page and in a kept layout.
//
// Nothing here touches localStorage or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    PAGES_VERSION,
    serialiseLayout,
    type Layout,
    type Workbench
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { parseLayout } from '../../../../../src/lib/state/workbench/layout/saved/saved.ts';
import { bench, docked, pane, split } from '../layout-fixture.ts';

type Tab = { id: string; view: string; state: unknown };

/** A pane of tabs whose first is the one shown. */
function paneOf(...tabs: Tab[]): Layout {
    return { kind: 'pane', tabs, active: tabs[0].id };
}

describe('a saved envelope, read as pages of one tree', () => {
    /** An envelope of this version over pages whose workbenches are as that version saved them. */
    function saved(version: number, ...held: Record<string, unknown>[]): unknown {
        const pages = held.map((workbench, at) => ({
            id: `page-${at}`,
            label: `Page ${at + 1}`,
            workbench
        }));
        return { version, pages, current: 'page-0' };
    }

    /** An envelope of the current version over pages and kept layouts as it saved them. */
    function latest(pages: Record<string, unknown>[], kept?: unknown): unknown {
        return { version: LAYOUT_VERSION, pages, current: pages[0].id, floats: [], kept };
    }

    /** The empty pane a workbench keeps for the documents its views open, as a layout saved it. */
    const documents: Layout = { kind: 'pane', tabs: [], active: '', documents: true };

    /**
     * The tabs of a workbench of one folder as saved, with the Files and LaTeX tabs labelled by the
     * folder's own name, and the tabs as they are read: those two without the label, a tab of
     * another view, a tab named by hand and a tab labelled by another name kept as they are.
     */
    function folderTabs(path: string, name: string, id: string): { saved: Tab[]; read: Tab[] } {
        const own = { root: 'hub', path };
        const saved: Tab[] = [
            { id: `${id}1`, view: 'files', state: { ...own, label: name } },
            { id: `${id}2`, view: 'latex', state: { ...own, label: name } },
            { id: `${id}3`, view: 'search', state: { label: name } },
            {
                id: `${id}4`,
                view: 'files',
                state: { root: 'hub', path: 'other', label: 'By hand' }
            },
            { id: `${id}5`, view: 'files', state: { ...own, label: 'Other name' } }
        ];
        const read = saved.map((tab, at) => (at < 2 ? { ...tab, state: own } : tab));
        return { saved, read };
    }

    const help = (id: string): Layout => paneOf({ id, view: 'help', state: null });
    const page = folderTabs('projects/alpha', 'alpha', 'p');
    const held = folderTabs('projects/beta', 'beta', 'k');
    const workbenchOf = (root: Layout): Record<string, unknown> => ({ root });

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
            name: 'version 3',
            envelope: saved(
                PAGES_VERSION,
                docked(pane(['a']), pane([]), 'hidden'),
                docked(pane(['b']), pane(['p']))
            ),
            trees: [bench(pane(['a'])), bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))]
        },
        {
            name: 'version 6',
            envelope: {
                ...(saved(
                    6,
                    bench(pane(['a'])),
                    bench(split('row', [0.5, 0.5], [pane(['b']), pane(['p'])]))
                ) as object),
                floats: []
            },
            trees: [bench(pane(['a'])), bench(split('row', [0.5, 0.5], [pane(['b']), pane(['p'])]))]
        },
        {
            name: 'the current version with a documents pane',
            envelope: {
                ...(saved(
                    LAYOUT_VERSION,
                    bench(split('row', [0.5, 0.5], [pane(['a']), documents]))
                ) as object),
                floats: []
            },
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
            name: 'Files and LaTeX tabs: the folder name is taken off a workbench page',
            envelope: latest([
                {
                    id: 'page-0',
                    label: 'alpha',
                    workbench: workbenchOf(paneOf(...page.saved)),
                    folder: { root: 'hub', path: 'projects/alpha' }
                }
            ]),
            trees: [bench(paneOf(...page.read))]
        },
        {
            name: 'Files and LaTeX tabs: the folder name is taken off a kept layout',
            envelope: latest(
                [{ id: 'page-0', label: 'Help', workbench: workbenchOf(help('t4')) }],
                [
                    {
                        folder: { root: 'hub', path: 'projects/beta' },
                        workbench: workbenchOf(paneOf(...held.saved)),
                        states: {}
                    }
                ]
            ),
            trees: [bench(help('t4'))],
            kept: [paneOf(...held.read)]
        }
    ];

    it.each(rows)('reads $name', ({ envelope, trees, docs, kept }) => {
        const read = parseLayout(envelope, 'Page 1');
        if (read === null) throw new Error('the envelope was not read');
        expect(read.pages.map((page) => page.workbench)).toEqual(trees);
        expect(read.pages.map((page) => page.docs)).toEqual(docs ?? trees.map(() => undefined));
        expect(read.current).toBe('page-0');
        expect((read.kept ?? []).map((one) => one.workbench.root)).toEqual(kept ?? []);
        const written = JSON.parse(serialiseLayout(read)) as { version: number };
        expect(written.version).toBe(LAYOUT_VERSION);
    });
});

describe('a saved tab of a retired view (changes, agents)', () => {
    /** One saved tab; a session makes it a tab pinned to that session. */
    function tab(id: string, view: string, session?: string): Tab {
        return { id, view, state: session === undefined ? null : { session, label: session } };
    }

    /** A pane of these tabs. */
    function paneOf(tabs: Tab[], active: string): { kind: 'pane'; tabs: Tab[]; active: string } {
        return { kind: 'pane', tabs, active };
    }

    /** The pane a page's tree holds, or a float holds, after the layout is read. */
    function read(where: 'pane' | 'float', held: ReturnType<typeof paneOf>): unknown {
        if (where === 'pane') {
            const page = {
                id: 'page-0',
                label: 'Page 1',
                workbench: docked(held, pane([]), 'hidden')
            };
            const pages = parseLayout(
                { version: PAGES_VERSION, pages: [page], current: 'page-0' },
                'Page 1'
            );
            return pages?.pages[0].workbench.root;
        }
        const place = { kind: 'free', x: 0.1, y: 0.1, w: 0.3, h: 0.4 };
        const page = { id: 'page-0', label: 'Page 1', workbench: { root: pane(['x']) } };
        const pages = parseLayout(
            {
                version: LAYOUT_VERSION,
                pages: [page],
                current: 'page-0',
                floats: [{ id: 'float-0', pane: held, place }]
            },
            'Page 1'
        );
        return pages?.floats[0].pane;
    }

    it.each([
        {
            name: 'a Changes and an Agents tab beside an unpinned Session tab are dropped',
            where: 'pane' as const,
            held: paneOf(
                [
                    tab('t1', 'session-detail'),
                    tab('t2', 'changes'),
                    tab('t3', 'agents'),
                    tab('t4', 'files')
                ],
                't3'
            ),
            tabs: [tab('t1', 'session-detail'), tab('t4', 'files')],
            active: 't1'
        },
        {
            name: 'a Changes tab pinned to another session than the Session tab beside it is kept',
            where: 'pane' as const,
            held: paneOf([tab('c1', 'changes', 'A'), tab('s1', 'session-detail', 'B')], 'c1'),
            tabs: [tab('c1', 'session-detail', 'A'), tab('s1', 'session-detail', 'B')],
            active: 'c1'
        },
        {
            name: 'an Agents tab alone in a pane becomes a Session tab with its id and pin',
            where: 'pane' as const,
            held: paneOf([tab('g1', 'agents', 'A')], 'g1'),
            tabs: [tab('g1', 'session-detail', 'A')],
            active: 'g1'
        },
        {
            name: 'an Agents tab alone in a float becomes a Session tab with its id and pin',
            where: 'float' as const,
            held: paneOf([tab('g1', 'agents', 'A')], 'g1'),
            tabs: [tab('g1', 'session-detail', 'A')],
            active: 'g1'
        },
        {
            name: 'a pane holding neither view is read as it was saved',
            where: 'pane' as const,
            held: paneOf([tab('a1', 'projects'), tab('a2', 'session-detail', 'A')], 'a2'),
            tabs: [tab('a1', 'projects'), tab('a2', 'session-detail', 'A')],
            active: 'a2'
        },
        {
            name: 'tabs named like inherited object properties are read as they were saved',
            where: 'pane' as const,
            held: paneOf([tab('k1', 'constructor'), tab('k2', 'hasOwnProperty')], 'k2'),
            tabs: [tab('k1', 'constructor'), tab('k2', 'hasOwnProperty')],
            active: 'k2'
        },
        {
            name: 'a Changes and an Agents tab of one pin with no Session tab leave one Session tab',
            where: 'pane' as const,
            held: paneOf([tab('c1', 'changes', 'A'), tab('g1', 'agents', 'A')], 'g1'),
            tabs: [tab('c1', 'session-detail', 'A')],
            active: 'c1'
        }
    ])(
        "carries a retired view's saved tab to its successor: $name",
        ({ where, held, tabs, active }) => {
            expect(read(where, held)).toEqual({ kind: 'pane', tabs, active });
        }
    );
});
