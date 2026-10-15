// Layer 2, client state. The tabs closed last in this browser window, which Reopen Closed Tab
// brings back, as VS Code's Reopen Closed Editor brings back an editor. The list is memory only and
// holds the last twenty tabs; the tabs one close command closed together (Close All, Close Others,
// Close to the Right, Close Saved, Close pane) are one batch, and a reopen takes the last batch
// whole. Only a close the reader commands is put on the list, through the store's `rememberClosed`:
// a close the code makes (a file view closing itself, a document closing, an app going) is not.
//
// Each tab is kept with its view, the state its instance held in the layout, its pin, the page or
// float and the pane it was closed from and its index in that pane, the ids of the tabs that pane
// kept, and with the folder a Terminal tab's shell ran in, since what the close ended stays ended
// and a Terminal tab comes back with a new shell there. The pure functions here read and make the
// list; the layout store holds it and opens the tabs.

import { findInstance } from '../instance.ts';
import { hostsOf, pinnedRun, type Instance, type Pages, type ViewId } from '../model.ts';
import { paneAt } from '../tree.ts';

/** How many closed tabs the list keeps, VS Code's number. */
const CLOSED_KEPT = 20;

/** One closed tab as it stood when it closed. */
export type ClosedTab = {
    view: ViewId;
    state: unknown;
    pinned: boolean;
    /** The page or float it was closed from. */
    host: string;
    /** The path of the pane it was closed from in that page's or float's tree. */
    path: number[];
    /** Its index in the pane it was closed from. */
    index: number;
    /**
     * The ids of the tabs its pane held besides the tabs closed with it. A pane has no id of its
     * own and a pane left empty is removed, so the pane at `path` is the one it was closed from
     * only while it holds one of these.
     */
    siblings: string[];
    /** The folder a Terminal tab's shell ran in, else the empty text. */
    folder: string;
};

/** The tabs one close command closed together. */
export type ClosedBatch = ClosedTab[];

/**
 * The tabs `ids` name as they stand in the pages and floats now, in the order given; an id no tree
 * holds is left out. `folderOf` answers the folder a tab's shell runs in.
 */
export function closedTabsOf(
    held: Pages,
    ids: readonly string[],
    folderOf: (tab: Instance) => string
): ClosedBatch {
    const hosts = hostsOf(held);
    return ids.flatMap((id) => {
        for (const host of hosts) {
            const found = findInstance(host.workbench.root, id);
            if (found === null) continue;
            const tab = found.instance;
            return [
                {
                    view: tab.view,
                    state: tab.state,
                    pinned: tab.pinned === true,
                    host: host.id,
                    path: found.path,
                    index: found.index,
                    siblings: (paneAt(host.workbench.root, found.path)?.tabs ?? [])
                        .map((one) => one.id)
                        .filter((one) => !ids.includes(one)),
                    folder: folderOf(tab)
                }
            ];
        }
        return [];
    });
}

/** The list with a batch put last, the oldest tabs dropped past `CLOSED_KEPT`. */
export function withClosed(list: readonly ClosedBatch[], batch: ClosedBatch): ClosedBatch[] {
    if (batch.length === 0) return [...list];
    const kept = [...list, batch];
    let over = kept.reduce((sum, one) => sum + one.length, 0) - CLOSED_KEPT;
    while (over > 0 && kept.length > 0) {
        const first = kept[0];
        if (first.length <= over) {
            kept.shift();
            over -= first.length;
        } else {
            kept[0] = first.slice(over);
            over = 0;
        }
    }
    return kept;
}

/** Whether a pane already holds a tab of the same view with the same state. */
export function holdsTab(tabs: readonly Instance[], tab: ClosedTab): boolean {
    const state = JSON.stringify(tab.state);
    return tabs.some((one) => one.view === tab.view && JSON.stringify(one.state) === state);
}

/**
 * The index a reopened tab goes to among a pane's tabs: its own where that keeps the pinned tabs
 * first, else the end of the run it belongs to (the pinned run for a pinned tab, the end of the
 * pane for an unpinned one).
 */
export function reopenIndex(tabs: readonly Instance[], tab: ClosedTab): number {
    const run = pinnedRun(tabs);
    if (tab.pinned) return Math.min(tab.index, run);
    return tab.index >= run && tab.index <= tabs.length ? tab.index : tabs.length;
}
