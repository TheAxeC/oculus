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
//
// The navigation history's Back and Forward (state/workbench/history/) reopen a closed tab they
// walk to through the same open, in another place: `closedTab` keeps a tab as it stands, and
// `reopenTab` opens one such tab again in the page or float and the pane it was closed from, at its
// index there, while that page or float holds a pane at that place, and otherwise in the focused
// pane of the page on screen, as VS Code's Go Back opens an editor in the active group. A pane that
// holds the same view with the same state already shows that tab in its place.

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
import { pinned, type Instance, type Pane } from '../model.ts';
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
    /** One open tab as a reopen would bring it back, or null when no tree holds the id. */
    closedTab: (id: string) => ClosedTab | null;
    /**
     * Open one closed tab again in the pane it was closed from, or in the focused pane of the page
     * on screen when that pane is gone, answering the id of the tab it opened, or of the tab that
     * pane already holds in its place, and null when its file is gone.
     */
    reopenTab: (tab: ClosedTab) => Promise<string | null>;
};

/** A pane a closed tab opens in: its page or float, its path there, and the pane itself. */
type Target = { host: string; path: number[]; pane: Pane };

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

    /** The focused pane of the page on screen, or null with no pane. */
    function focusedPane(): Target | null {
        const page = access.currentPage().id;
        const tree = access.layout(page);
        const path = activePath(tree, attention.active(page));
        const pane = paneAt(tree, path);
        return pane === null ? null : { host: page, path, pane };
    }

    /**
     * The pane a tab was closed from, while its page or float still holds it: the pane at the same
     * place that holds one of the tabs it kept, or that is still empty when it kept none, as the
     * last pane of a page stays. A pane another took the place of is no home.
     */
    function homeOf(tab: ClosedTab): Target | null {
        if (access.pageOf(tab.host) === null) return null;
        const pane = paneAt(access.layout(tab.host), tab.path);
        const same =
            pane !== null &&
            (tab.siblings.length === 0
                ? pane.tabs.length === 0
                : pane.tabs.some((one) => tab.siblings.includes(one.id)));
        if (!same) return null;
        return { host: tab.host, path: tab.path, pane };
    }

    /**
     * Open one closed tab in a pane: the id of the tab opened, the id of the pane's own tab of the
     * same view and state, and null with no pane.
     */
    function reopenOne(
        tab: ClosedTab,
        target: Target | null
    ): { id: string; page: string; opened: boolean } | null {
        if (target === null) return null;
        const { host: page, path, pane } = target;
        const own = pane.tabs.find((one) => holdsTab([one], tab));
        if (own !== undefined) return { id: own.id, page, opened: false };
        const terminal = tab.view === TERMINAL_VIEW;
        const made = newInstance(tab.view, terminal ? emptyTab(crypto.randomUUID()) : tab.state);
        const instance = tab.pinned ? pinned(made) : made;
        access.change(
            (held) => insertInstance(held, path, reopenIndex(pane.tabs, tab), instance),
            page
        );
        activate(instance.id, page);
        if (terminal) hooks.startShell(instance.id, tab.folder);
        return { id: instance.id, page, opened: true };
    }

    async function reopenClosed(): Promise<boolean> {
        while (list.length > 0) {
            const batch = list[list.length - 1];
            list = list.slice(0, -1);
            let opened = false;
            for (const tab of batch) {
                if (await gone(tab)) continue;
                if (reopenOne(tab, focusedPane())?.opened === true) opened = true;
            }
            if (opened) return true;
        }
        return false;
    }

    async function reopenTab(tab: ClosedTab): Promise<string | null> {
        if (await gone(tab)) return null;
        const answer = reopenOne(tab, homeOf(tab) ?? focusedPane());
        if (answer !== null && !answer.opened) activate(answer.id, answer.page);
        return answer?.id ?? null;
    }

    return {
        rememberClosed,
        closedCount: () => list.reduce((sum, batch) => sum + batch.length, 0),
        reopenClosed,
        hookClosed: (given) => Object.assign(hooks, given),
        closedTab: (id) => closedTabsOf(access.held(), [id], folderOf).at(0) ?? null,
        reopenTab
    };
}
