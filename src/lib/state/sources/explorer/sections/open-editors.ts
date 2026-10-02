// Layer 2, client state, pure. The Open Editors section's rows: the tabs of the page that name a
// file, grouped by the pane that holds them. A tab names a file when its state carries a root key
// and a path, which is what every view that shows one file (source, file, document, diff of a
// file) keeps, so no list of views is needed here.
//
// A page with one pane shows its rows with no group line; a page with several panes gives each its
// own, in the order the layout walks them, so the section reads as the panes do.

import { z } from 'zod';
import { readAs } from '../../../../data/shapes/shapes.ts';
import { nameOf } from '../file-type.ts';
import type { RowRef } from '../view/place.ts';

/** A tab as this reads it: its id, its view and its saved state. The layout's tab fits. */
export type OpenTab = { id: string; view: string; state: unknown };

/** A pane as this reads it: its tabs and the id of the one shown. The layout's pane fits. */
export type OpenPane = { tabs: readonly OpenTab[]; active: string };

/** The root and path a tab's state names. */
const fileShape = z.object({ root: z.string().min(1), path: z.string().min(1) });

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
};

/** The tabs of one pane. */
export type OpenGroup = { index: number; path: number[]; rows: OpenEditor[] };

/** The file a tab shows, or null when its view shows no one file. */
export function fileOfTab(tab: OpenTab): RowRef | null {
    return readAs(fileShape, tab.state);
}

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
    dirty: (id: string) => boolean
): OpenGroup[] {
    return panes.flatMap(({ path, pane }, index) => {
        const rows = pane.tabs.flatMap((tab) => {
            const file = fileOfTab(tab);
            if (file === null) return [];
            const row: OpenEditor = {
                id: tab.id,
                view: tab.view,
                name: nameFor(tab) || nameOf(file.path),
                file,
                where: folderOf(file.path),
                dirty: dirty(tab.id),
                active: pane.active === tab.id
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

/** The ids of every tab in the groups: what Close All closes. */
export function openIds(groups: OpenGroup[]): string[] {
    return groups.flatMap((group) => group.rows.map((one) => one.id));
}
