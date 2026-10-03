// Layer 2, client state, pure. The Open Editors section's rows: the tabs of the page that name a
// file, grouped by the pane that holds them. A tab names a file when its state carries a root key
// and a path, which is what every view that shows one file (source, file, document, diff of a
// file) keeps, so no list of views is needed here.
//
// A page with one pane shows its rows with no group line; a page with several panes gives each its
// own, in the order the layout walks them, so the section reads as the panes do. Which file a tab
// shows is the workbench navigation's rule, handed in by the caller since the workbench is above
// this folder.

import { nameOf } from '../file-type.ts';
import type { RowRef } from '../view/place.ts';

/** A tab as this reads it: its id, its view and its saved state. The layout's tab fits. */
export type OpenTab = { id: string; view: string; state: unknown; pinned?: true };

/** A pane as this reads it: its tabs and the id of the one shown. The layout's pane fits. */
export type OpenPane = { tabs: readonly OpenTab[]; active: string };

/** One open tab as the section draws it. */
export type OpenEditor = {
    id: string;
    view: string;
    /** The tab's name, as its strip calls it. */
    name: string;
    /** The file the tab shows, which the close control, Save and the reveal act on. */
    file: RowRef;
    /** The folder the file sits in, drawn after the name. Empty at a root's top. */
    where: string;
    dirty: boolean;
    /** Whether the tab is its pane's shown one. */
    active: boolean;
    /** Whether the tab is pinned, which Close All leaves open. */
    pinned: boolean;
};

/** The tabs of one pane. */
export type OpenGroup = { index: number; path: number[]; rows: OpenEditor[] };

/** What the folder part of a path is, without the name. */
function folderOf(path: string): string {
    const parts = path.split('/').filter((part) => part !== '');
    return parts.slice(0, -1).join('/');
}

/**
 * The groups of the page: one per pane that holds at least one tab naming a file, in layout order.
 * A pane with none is left out, so a pane holding only a terminal adds no empty group.
 */
export function openGroups(
    panes: { path: number[]; pane: OpenPane }[],
    nameFor: (tab: OpenTab) => string,
    dirty: (id: string) => boolean,
    fileOf: (tab: OpenTab) => RowRef | null
): OpenGroup[] {
    return panes.flatMap(({ path, pane }, index) => {
        const rows = pane.tabs.flatMap((tab) => {
            const file = fileOf(tab);
            if (file === null) return [];
            const row: OpenEditor = {
                id: tab.id,
                view: tab.view,
                name: nameFor(tab) || nameOf(file.path),
                file,
                where: folderOf(file.path),
                dirty: dirty(tab.id),
                active: pane.active === tab.id,
                pinned: tab.pinned === true
            };
            return [row];
        });
        return rows.length === 0 ? [] : [{ index, path, rows }];
    });
}

/** The ids of every dirty tab in the groups: what Save All saves. */
export function dirtyIds(groups: OpenGroup[]): string[] {
    return groups.flatMap((group) => group.rows.filter((one) => one.dirty).map((one) => one.id));
}

/** The ids of every tab in the groups that is not pinned: what Close All closes. */
export function openIds(groups: OpenGroup[]): string[] {
    return groups.flatMap((group) => group.rows.filter((one) => !one.pinned).map((one) => one.id));
}

/**
 * Where a row dragged onto another row moves its tab: the pane of the target row and the place of
 * the target tab in that pane's own tab list, which also holds the tabs naming no file. Nothing
 * moves for a drop on the tab's own row, on a group line or on a tab no pane holds.
 */
export function editorDrop(
    panes: { path: number[]; pane: OpenPane }[],
    dragged: string,
    target: string
): { path: number[]; index: number } | null {
    if (dragged === target) return null;
    const held = panes.some(({ pane }) => pane.tabs.some((tab) => tab.id === dragged));
    if (!held) return null;
    for (const { path, pane } of panes) {
        const index = pane.tabs.findIndex((tab) => tab.id === target);
        if (index >= 0) return { path, index };
    }
    return null;
}
