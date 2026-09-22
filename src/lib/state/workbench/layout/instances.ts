// Layer 2, client state. The instances on a page: which tab is active, the state a tab holds, and
// every way a tab leaves the pane it is in, whether it is closed, carried to another pane or carried
// to another page.
//
// A tab moved between pages keeps its id, so the view it mounts keeps whatever state it holds, and
// the pane it left is cleaned as closing its tab would clean it. A tab landing anywhere is first
// made visible: another pane maximised hides the one it is landing in, and a folded ancestor hides
// it too, and a move that put a tab out of sight is the one thing a move must not look like.

import {
    activePath,
    findInstance,
    findView,
    isInstanceOf,
    panes as panesIn,
    tabsOf
} from '../../client/instance.ts';
import type { LayoutAccess } from './access.ts';
import type { Attention } from './open/attention.ts';
import {
    samePath,
    type Edge,
    type Instance,
    type Layout,
    type Page,
    type ViewId,
    type Workbench
} from './model.ts';
import { keepInstance } from './open/preview.ts';
import {
    activate,
    closeInstance as removeInstance,
    closePane as removePane,
    expandTo,
    insertInstance,
    moveInstance,
    openInstance,
    paneAt,
    restate,
    splitPane
} from './tree.ts';
import { focusedPane, restore, settleFocus, splitWith } from './workbench.ts';

export type Instances = {
    activeInstance: (page?: string) => Instance | null;
    instanceLayoutState: (id: string) => unknown;
    restateInstance: (id: string, state: unknown) => void;
    pinInstance: (id: string, session: string, label: string) => void;
    unpinInstance: (id: string) => void;
    keepPreview: (id: string) => void;
    activateInstance: (id: string, page?: string) => void;
    closeInstancesOfView: (view: ViewId) => void;
    closeRecord: (view: ViewId, id: string) => void;
    moveInstanceToPage: (id: string, page: string) => void;
    closeInstance: (id: string, page?: string) => void;
    closePane: (path: number[], page?: string) => void;
    transferInstance: (id: string, path: number[], index: number, page?: string) => void;
    splitInstance: (id: string, path: number[], edge: Edge, page?: string) => void;
    /** Forget what a set of closed tabs held, which closing a whole page needs too. */
    forgetTabs: (tabs: readonly Instance[]) => void;
};

export function createInstances(access: LayoutAccess, attention: Attention): Instances {
    /** The active tab of the pane most recently activated, or of the first pane by default. */
    function activeInstance(page?: string): Instance | null {
        const tree = access.layout(page);
        const pane = paneAt(tree, activePath(tree, attention.active(page)));
        return pane?.tabs.find((instance) => instance.id === pane.active) ?? null;
    }

    /**
     * One layout instance's own saved state, from whichever page's tree holds it: a tab inside a
     * page shown in another page is held by the page it belongs to and not by the one showing it.
     */
    function instanceLayoutState(id: string): unknown {
        const page = access.holding(id);
        return page === null ? undefined : findInstance(page.workbench.root, id)?.instance.state;
    }

    /** Replace one instance's layout state. A missing id changes nothing. */
    function restateInstance(id: string, state: unknown): void {
        const page = access.holding(id);
        if (page === null) return;
        access.change((tree) => restate(tree, id, state), page.id);
    }

    /** Pin one instance, or activate the same view's existing pin without changing the caller. */
    function pinInstance(id: string, session: string, label: string): void {
        const page = access.holding(id);
        if (page === null) return;
        const caller = findInstance(page.workbench.root, id);
        if (caller === null) return;
        const existing = findView(page.workbench.root, caller.instance.view, session);
        if (existing !== null) {
            activateInstance(existing.id, page.id);
            return;
        }
        restateInstance(id, { session, label });
    }

    /** Clear the pin and label in place; another unpinned instance of the view may already exist. */
    function unpinInstance(id: string): void {
        restateInstance(id, {});
    }

    /** Keep a preview tab. A tab that is not one, and an id no page holds, change nothing. */
    function keepPreview(id: string): void {
        const page = access.holding(id);
        if (page === null) return;
        access.change((tree) => keepInstance(tree, id), page.id);
    }

    /**
     * Make an instance the active tab of its pane, and its pane its page's active one. The page is
     * the one whose tree holds the instance, which is the page shown at the pane when that pane is
     * inside a page leaf.
     */
    function activateInstance(id: string, page?: string): void {
        const holder = access.holding(id) ?? access.at(page);
        if (holder === null) return;
        attention.touchPane(holder.id);
        attention.remembered(id, holder.id);
        access.change((tree) => activate(tree, id), holder.id);
    }

    /**
     * Close every open instance of a view, on every page. It is what a view leaving the registry
     * means for the arrangement: the tab goes with the key rather than staying as a tab whose body
     * the shell cannot draw.
     */
    function closeInstancesOfView(view: ViewId): void {
        for (const page of access.held().pages) {
            for (const tab of tabsOf(page.workbench.root)) {
                if (tab.view === view) closeInstanceAnywhere(tab.id);
            }
        }
    }

    /**
     * Close the instance a view was opened for one record with, wherever it is. It is what a record
     * going away means for the arrangement: a note deleted from the Files view leaves no tab drawing
     * a file that is not there.
     */
    function closeRecord(view: ViewId, id: string): void {
        for (const page of access.held().pages) {
            for (const tab of tabsOf(page.workbench.root)) {
                if (isInstanceOf(tab, view, id)) closeInstanceAnywhere(tab.id);
            }
        }
    }

    /** Close one instance wherever it is, on the current page or on another. */
    function closeInstanceAnywhere(id: string): void {
        const holder = access.holding(id);
        if (holder !== null && attention.active(holder.id) === id) {
            attention.remembered(null, holder.id);
        }
        const held = access.held();
        access.save({
            ...held,
            pages: held.pages.map((page) => ({
                ...page,
                workbench: settleFocus({
                    ...page.workbench,
                    root: removeInstance(page.workbench.root, id)
                })
            }))
        });
        access.ui.clearInstanceState(id);
    }

    /**
     * Move one instance to another page, taking it out of the page it is on and putting it at the end
     * of the first pane of that page's tree.
     */
    function moveInstanceToPage(id: string, page: string): void {
        const from = access.holding(id);
        const to = access.pageOf(page);
        if (from === null || to === null || from.id === to.id) return;
        const landing = panesIn(to.workbench.root)[0]?.path ?? [];
        carryToPage(id, from, to, landing, (tree, moved) => openInstance(tree, landing, moved));
    }

    /**
     * Take an instance out of the page holding it and put it in another page, by the landing `put`
     * makes for it. It keeps its id, so the view it mounts keeps whatever state it holds, and the
     * pane it left is cleaned as closing its tab would clean it.
     */
    function carryToPage(
        id: string,
        from: Page,
        to: Page,
        path: number[],
        put: (tree: Layout, moved: Instance) => Layout
    ): void {
        const found = findInstance(from.workbench.root, id);
        if (found === null) return;
        const shown = reveal(path, to.id);
        const root = put(shown.root, found.instance);
        if (root === shown.root) return;
        if (attention.active(from.id) === id) attention.remembered(null, from.id);
        attention.remembered(id, to.id);
        const held = access.held();
        access.save({
            ...held,
            pages: held.pages.map((one) => {
                if (one.id === from.id) {
                    return {
                        ...one,
                        workbench: settleFocus({
                            ...one.workbench,
                            root: removeInstance(one.workbench.root, id)
                        })
                    };
                }
                if (one.id !== to.id) return one;
                return { ...one, workbench: settleFocus({ ...shown, root }) };
            })
        });
    }

    /** Close an instance, and forget it if it was its page's active one. */
    function closeInstance(id: string, page?: string): void {
        const holder = access.holding(id) ?? access.at(page);
        if (holder === null) return;
        if (attention.active(holder.id) === id) attention.remembered(null, holder.id);
        const current = access.workbench(holder.id);
        access.apply(
            settleFocus({ ...current, root: removeInstance(current.root, id) }),
            holder.id
        );
        access.ui.clearInstanceState(id);
    }

    /** Close a whole pane, with every tab it holds, each forgotten as its own close would forget it. */
    function closePane(path: number[], page?: string): void {
        const id = access.at(page)?.id;
        if (id === undefined) return;
        const current = access.workbench(id);
        const pane = paneAt(current.root, path);
        if (pane === null) return;
        const held = attention.active(id);
        if (held !== null && pane.tabs.some((tab) => tab.id === held)) {
            attention.remembered(null, id);
        }
        access.apply(settleFocus({ ...current, root: removePane(current.root, path) }), id);
        forgetTabs(pane.tabs);
    }

    /**
     * Forget what closed tabs held: a source draft, manifest edits and entry form drafts all live
     * under the instance id, and the forget the store is handed takes every one of them.
     */
    function forgetTabs(tabs: readonly Instance[]): void {
        for (const tab of tabs) access.ui.clearInstanceState(tab.id);
    }

    /**
     * What a tab landing in a pane needs of the rest of the arrangement: another pane maximised hides
     * the one it is landing in, and a folded ancestor hides it too. Either way the tab would be moved
     * out of sight, which is the one thing a move must not look like.
     */
    function reveal(path: number[], page?: string): Workbench {
        const current = access.workbench(page);
        const focus = focusedPane(current);
        const shown = focus !== null && !samePath(focus.path, path) ? restore(current) : current;
        return { ...shown, root: expandTo(shown.root, path) };
    }

    /**
     * Move an instance to a pane's tab strip, from wherever it is now. The pane is named in the page
     * the argument names, and the instance is taken out of whichever page holds it, so a tab dragged
     * into a pane of a page shown nested moves between the two pages.
     */
    function transferInstance(id: string, path: number[], index: number, page?: string): void {
        const to = access.at(page);
        const from = access.holding(id);
        if (from === null || to === null) return;
        // A tab the reader has carried somewhere is a tab they mean to keep.
        keepPreview(id);
        if (from.id !== to.id) {
            carryToPage(id, from, to, path, (tree, moved) =>
                insertInstance(tree, path, index, moved)
            );
            return;
        }
        const shown = reveal(path, to.id);
        const next = { ...shown, root: moveInstance(shown.root, id, path, index) };
        if (next.root === shown.root) return;
        attention.remembered(id, to.id);
        access.apply(settleFocus(next), to.id);
    }

    /** Move an instance into a new pane on one edge of a pane, from wherever it is now. */
    function splitInstance(id: string, path: number[], edge: Edge, page?: string): void {
        const to = access.at(page);
        const from = access.holding(id);
        if (from === null || to === null) return;
        // A pane of its own is not somewhere a tab the next click replaces would sit.
        keepPreview(id);
        if (from.id !== to.id) {
            const dir: 'row' | 'col' = edge === 'left' || edge === 'right' ? 'row' : 'col';
            const before = edge === 'left' || edge === 'top';
            carryToPage(id, from, to, path, (tree, moved) =>
                splitPane(tree, path, dir, moved, before)
            );
            return;
        }
        const shown = reveal(path, to.id);
        const next = splitWith(shown, id, path, edge);
        if (next === shown) return;
        attention.remembered(id, to.id);
        access.apply(next, to.id);
    }

    return {
        activeInstance,
        instanceLayoutState,
        restateInstance,
        pinInstance,
        unpinInstance,
        keepPreview,
        activateInstance,
        closeInstancesOfView,
        closeRecord,
        moveInstanceToPage,
        closeInstance,
        closePane,
        transferInstance,
        splitInstance,
        forgetTabs
    };
}
