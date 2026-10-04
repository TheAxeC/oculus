// Layer 2, client-state tests. What the Open Editors section does with the strip's tabs
// (sections/open-editors.ts): a tab that is pinned is left open by Close All, a document tab is a
// file of the hub, and a row dragged onto another row names the pane and the place the tab moves
// to.

import { describe, expect, it } from 'vitest';
import {
    editorDrop,
    openGroups,
    openIds
} from '../../../../../src/lib/state/sources/explorer/sections/open-editors.ts';
import { fileOfTab } from '../../../../../src/lib/state/workbench/navigation/pages.ts';
import type { Instance, Pane } from '../../../../../src/lib/state/workbench/layout/model.ts';

const tab = (id: string, view: string, state: unknown, pinned = false): Instance =>
    pinned ? { id, view, state, pinned: true } : { id, view, state };
const pane = (active: string, ...tabs: Instance[]): Pane => ({ kind: 'pane', tabs, active });

const file = (path: string) => ({ root: 'hub', path });

describe('Close All of Open Editors', () => {
    // Revert: list every row in openIds.
    it('lists the tabs it closes without the pinned ones', () => {
        const groups = openGroups(
            [
                {
                    path: [0],
                    pane: pane(
                        'a',
                        tab('p', 'source', file('p.md'), true),
                        tab('a', 'source', file('a.md')),
                        tab('b', 'source', file('b.md'))
                    )
                }
            ],
            () => '',
            () => false,
            fileOfTab
        );

        expect(groups[0].rows.map((row) => row.pinned)).toEqual([true, false, false]);
        expect(openIds(groups)).toEqual(['a', 'b']);
    });
});

describe('a document tab', () => {
    // Revert: leave the doc view out of fileOfTab.
    it('names a file of the hub root by its path', () => {
        expect(
            fileOfTab(
                tab('d', 'doc', { id: 'hpc', path: 'docs/HPC-UTwente-howto.md', label: 'HPC' })
            )
        ).toEqual({ root: 'hub', path: 'docs/HPC-UTwente-howto.md' });
    });

    it('names no file when it holds no path, and reads a tab of another view by its root and path', () => {
        expect(fileOfTab(tab('d', 'doc', { id: 'x' }))).toBeNull();
        expect(fileOfTab(tab('t', 'terminal', { path: 'x' }))).toBeNull();
        expect(fileOfTab(tab('e', 'source', { root: '', path: 'x' }))).toBeNull();
        expect(fileOfTab(tab('s', 'source', file('a.md')))).toEqual(file('a.md'));
    });
});

describe('dragging one row of Open Editors onto another', () => {
    const panes = [
        {
            path: [0],
            pane: pane(
                'a',
                tab('t', 'terminal', { id: 'x' }),
                tab('a', 'source', file('a.md')),
                tab('b', 'source', file('b.md'))
            )
        },
        { path: [1, 0], pane: pane('c', tab('c', 'source', file('c.md'))) }
    ];

    // Revert: count the index among the rows instead of the pane's tabs.
    it('moves the tab to the target tab index of the pane, which counts the non-file tabs', () => {
        expect(editorDrop(panes, 'b', 'a')).toEqual({ path: [0], index: 1 });
        expect(editorDrop(panes, 'a', 'b')).toEqual({ path: [0], index: 2 });
    });

    it("moves a tab into the pane of the row it is dropped on, at that row's place", () => {
        expect(editorDrop(panes, 'a', 'c')).toEqual({ path: [1, 0], index: 0 });
    });

    it('moves nothing for a drop on its own row, on a group line or on a tab no pane holds', () => {
        expect(editorDrop(panes, 'a', 'a')).toBeNull();
        expect(editorDrop(panes, 'a', 'group:1')).toBeNull();
        expect(editorDrop(panes, 'gone', 'a')).toBeNull();
    });
});
