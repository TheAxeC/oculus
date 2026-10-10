// Layer 2, client-state tests. The saved form of a layout: the older envelope read by migration. A
// workbench of two trees and a docked panel opens as the one tree a page now is; a tab of a retired
// view (`changes`, `agents`) is carried to its successor, or dropped where a tab of the successor
// already holds the pane; and every other tab is kept.
//
// Nothing here touches localStorage or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import {
    LAYOUT_VERSION,
    PAGES_VERSION,
    serialiseLayout,
    type Layout
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { parseLayout } from '../../../../../src/lib/state/workbench/layout/saved/saved.ts';
import { bench, docked, pane, split } from '../layout-fixture.ts';

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

    /** The empty pane a workbench keeps for the documents its views open, as a layout saved it. */
    const documents: Layout = { kind: 'pane', tabs: [], active: '', documents: true };

    const rows = [
        {
            version: PAGES_VERSION,
            envelope: saved(
                PAGES_VERSION,
                docked(pane(['a']), pane([]), 'hidden'),
                docked(pane(['b']), pane(['p']))
            ),
            trees: [bench(pane(['a'])), bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))]
        },
        {
            version: 6,
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
            version: LAYOUT_VERSION,
            envelope: {
                ...(saved(
                    LAYOUT_VERSION,
                    bench(split('row', [0.5, 0.5], [pane(['a']), documents]))
                ) as object),
                floats: []
            },
            trees: [bench(split('row', [0.5, 0.5], [pane(['a']), documents]))]
        }
    ];

    it.each(rows)('migrates every page, and reads which one was current', ({ envelope, trees }) => {
        const read = parseLayout(envelope, 'Page 1');
        if (read === null) throw new Error('the envelope was not read');
        expect(read.pages.map((page) => page.workbench)).toEqual(trees);
        expect(read.current).toBe('page-0');
        expect(read.kept ?? []).toEqual([]);
        const written = JSON.parse(serialiseLayout(read)) as { version: number };
        expect(written.version).toBe(LAYOUT_VERSION);
    });
});

describe('a saved tab of a retired view (changes, agents)', () => {
    type Tab = { id: string; view: string; state: unknown };

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
