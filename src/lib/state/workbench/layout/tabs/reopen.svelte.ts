// Layer 2, client state. Reopen Closed Tab: the list of the tabs closed last (tabs/closed.ts) held
// for one browser window, and the reopen that takes its last batch. Each tab of the batch opens in
// the focused pane of the page on screen, at its index where that keeps the pinned tabs first, and
// pinned as it was; a tab the pane already holds (the same view and the same state) is not opened
// twice, and a source tab whose file is gone is skipped, so it is dropped with its batch. A batch
// none of whose tabs opens gives way to the batch before it.
//
// What the close ended stays ended. A Terminal tab is kept with the folder its shell ran in and
// reopens with a state of its own and a new shell in that folder; a source tab reopens over the
// file as it is on disk. The terminals and the folders are outside the layout, so the client hands
// in through `hookClosed` the folder a terminal runs in, a fresh read of a folder and the start of
// a shell in a tab.

import type { Listing } from '../../../sources/fs-transport.ts';
import {
    emptyTab,
    readTab,
    tabFolder,
    TERMINAL_VIEW
} from '../../../sessions/terminal/terminal-tabs.ts';
import { activePath, instanceText, newInstance } from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from '../open/attention.ts';
import { pinned, type Instance } from '../model.ts';
import { insertInstance, paneAt } from '../tree.ts';
import {
    closedTabsOf,
    holdsTab,
    reopenIndex,
    withClosed,
    type ClosedBatch,
    type ClosedTab
} from './closed.ts';

/** What the client hands the list: the terminals, the folders and the shells it cannot reach. */
type ClosedHooks = {
    /** The folder a terminal runs in, or null when it is not known. */
    cwdOf: (terminal: string) => string | null;
    /** One folder of a root as the server lists it now, the hidden and the ignored entries too. */
    readFolder: (root: string, folder: string) => Promise<Listing>;
    /** Start a shell in the Terminal tab `tab`, in `folder`, or in its own for the empty text. */
    startShell: (tab: string, folder: string) => void;
};

export type Reopen = {
    /** Put the tabs `ids` on the list as one batch, as they stand before the close. */
    rememberClosed: (ids: readonly string[]) => void;
    /** How many tabs the list holds. */
    closedCount: () => number;
    /** Open the last batch again; answers whether a tab opened. */
    reopenClosed: () => Promise<boolean>;
    /** Hand in what the list cannot reach itself; state/client/context.ts does it once. */
    hookClosed: (hooks: Partial<ClosedHooks>) => void;
};

/** The list of one window over the layout's pages, activating a reopened tab with `activate`. */
export function createReopen(
    access: LayoutAccess,
    attention: Attention,
    activate: (id: string, page?: string) => void
): Reopen {
    let list = $state<ClosedBatch[]>([]);
    const hooks: ClosedHooks = {
        cwdOf: () => null,
        readFolder: () => Promise.resolve({ entries: [], error: '', loading: false }),
        startShell: () => undefined
    };

    /** The folder a Terminal tab's shell runs in, the empty text for any other tab. */
    function folderOf(tab: Instance): string {
        if (tab.view !== TERMINAL_VIEW) return '';
        return tabFolder(readTab(tab.state), hooks.cwdOf) ?? '';
    }

    function rememberClosed(ids: readonly string[]): void {
        const batch = closedTabsOf(access.held(), ids, folderOf);
        if (batch.length > 0) list = withClosed(list, batch);
    }

    /**
     * Whether the file a closed source tab shows is deleted or moved, by a fresh read of its
     * folder: the server refused the folder with the word `missing`, or listed it without the file.
     */
    async function gone(tab: ClosedTab): Promise<boolean> {
        const root = instanceText(tab.state, 'root');
        const path = instanceText(tab.state, 'path');
        if (tab.view !== 'source' || root === '' || path === '') return false;
        const at = path.lastIndexOf('/');
        const listing = await hooks.readFolder(root, at < 0 ? '' : path.slice(0, at));
        if (listing.refused === 'missing') return true;
        const name = path.slice(at + 1);
        return listing.error === '' && !listing.entries.some((one) => one.name === name);
    }

    /** Open one closed tab in the focused pane of the page on screen; false when it is not. */
    function reopenOne(tab: ClosedTab): boolean {
        const page = access.currentPage().id;
        const tree = access.layout(page);
        const path = activePath(tree, attention.active(page));
        const pane = paneAt(tree, path);
        if (pane === null || holdsTab(pane.tabs, tab)) return false;
        const terminal = tab.view === TERMINAL_VIEW;
        const made = newInstance(tab.view, terminal ? emptyTab(crypto.randomUUID()) : tab.state);
        const instance = tab.pinned ? pinned(made) : made;
        access.change(
            (held) => insertInstance(held, path, reopenIndex(pane.tabs, tab), instance),
            page
        );
        activate(instance.id, page);
        if (terminal) hooks.startShell(instance.id, tab.folder);
        return true;
    }

    async function reopenClosed(): Promise<boolean> {
        while (list.length > 0) {
            const batch = list[list.length - 1];
            list = list.slice(0, -1);
            let opened = false;
            for (const tab of batch) {
                if (await gone(tab)) continue;
                if (reopenOne(tab)) opened = true;
            }
            if (opened) return true;
        }
        return false;
    }

    return {
        rememberClosed,
        closedCount: () => list.reduce((sum, batch) => sum + batch.length, 0),
        reopenClosed,
        hookClosed: (given) => Object.assign(hooks, given)
    };
}
