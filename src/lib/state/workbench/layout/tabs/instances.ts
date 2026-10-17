// Layer 2, client state. The instances on a page: which tab is active, the state a tab holds, and
// every way a tab leaves the pane it is in, whether it is closed, carried to another pane or
// carried to another page.
//
// A tab moved between pages keeps its id, so the view it mounts keeps whatever state it holds, and
// the pane it left is cleaned as closing its tab would clean it. A tab landing anywhere is first
// made visible: another pane maximised hides the one it is landing in, and a folded ancestor hides
// it too, and a move that put a tab out of sight is the one thing a move must not look like.

import {
    activePath,
    findInstance,
    findView,
    instanceMap,
    stateId,
    panes as panesIn,
    tabsOf
} from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from '../open/attention.ts';
import { dropInstance, writeHost } from '../open/float/pages.ts';
import {
    hostsOf,
    isPage,
    samePath,
    type Edge,
    type Host,
    type Instance,
    type Layout,
    type ViewId,
    type Workbench
} from '../model.ts';
import { pinTab as pinInTree, unpinTab as unpinInTree } from '../open/pinned.ts';
import { keepInstance } from '../open/preview.ts';
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
    splitPane,
    type KeepRule
} from '../tree.ts';
import { focusedPane, restore, settleFocus, splitWith } from '../workbench.ts';
import type { HubVocabs } from '../../../../data/model/index.ts';
import { leftOutTabs } from './left-out.ts';

export type Instances = {
    activeInstance: (page?: string) => Instance | null;
    instanceLayoutState: (id: string) => unknown;
    /** The view one instance shows, from whichever page's tree holds it, or undefined for none. */
    instanceView: (id: string) => ViewId | undefined;
    restateInstance: (id: string, state: unknown) => void;
    pinInstance: (id: string, session: string, label: string) => void;
    /**
     * Point one instance at the record a state names, or activate the instance of the same view on
     * its page that already holds it; true when the instance itself was pointed.
     */
    pointInstance: (id: string, state: unknown) => boolean;
    unpinInstance: (id: string) => void;
    /**
     * Keep a preview tab, which is what a double click, a keystroke, a drag and a split do to one.
     */
    keepPreview: (id: string) => void;
    /** Pin a tab to its pane's pinned run, or take the pin off; an unknown id changes nothing. */
    pinTab: (id: string) => void;
    unpinTab: (id: string) => void;
    activateInstance: (id: string, page?: string) => void;
    /** The tabs of a page that were activated and are still on it, the one activated last first. */
    usedInstances: (page?: string) => string[];
    closeInstancesOfView: (view: ViewId) => void;
    moveInstanceToPage: (id: string, page: string) => void;
    closeInstance: (id: string, page?: string) => void;
    closePane: (path: number[], page?: string) => void;
    transferInstance: (id: string, path: number[], index: number, page?: string) => void;
    splitInstance: (id: string, path: number[], edge: Edge, page?: string) => void;
    /** Forget what a set of closed tabs held, which closing a whole page needs too. */
    forgetTabs: (tabs: readonly Instance[]) => void;
};

/**
 * `keep` is the rule that says what an emptied pane of a page is left as (tree.ts keptPane). It
 * applies to a page's panes only: a float whose last tab goes is removed. `hubs` answers the
 * collections the hubs of the workspace list, which decide the tabs a pane draws (left-out.ts).
 */
export function createInstances(
    access: LayoutAccess,
    attention: Attention,
    keep?: KeepRule,
    hubs: () => HubVocabs | null = () => null
): Instances {
    /** The rule that applies to the panes of a host: a page's, and none for a float's. */
    function keepFor(host: Host): KeepRule | undefined {
        return isPage(host) ? keep : undefined;
    }

    /**
     * The active tab of the pane most recently activated, or of the first pane by default, read as
     * the pane draws it: a tab left out for a collection no hub lists is not on screen, so the
     * pane's first drawn tab stands for it, and a pane that draws no tab has none.
     */
    function activeInstance(page?: string): Instance | null {
        const tree = access.layout(page);
        const pane = paneAt(tree, activePath(tree, attention.active(page)));
        if (pane === null) return null;
        const drawn = leftOutTabs(pane.tabs, hubs()).drawn;
        return drawn.find((instance) => instance.id === pane.active) ?? drawn.at(0) ?? null;
    }

    /**
     * One instance as whichever page's tree holds it: a tab inside a page shown in another page is
     * held by the page it belongs to and not by the one showing it.
     */
    function held(id: string): Instance | undefined {
        const page = access.holding(id);
        return page === null ? undefined : findInstance(page.workbench.root, id)?.instance;
    }

    /** One layout instance's own saved state. */
    function instanceLayoutState(id: string): unknown {
        return held(id)?.state;
    }

    function instanceView(id: string): ViewId | undefined {
        return held(id)?.view;
    }

    /** Replace one instance's layout state. A missing id changes nothing. */
    function restateInstance(id: string, state: unknown): void {
        const page = access.holding(id);
        if (page === null) return;
        access.change((tree) => restate(tree, id, state), page.id);
    }

    /**
     * Pin one instance, or activate the same view's existing pin without changing the caller. The
     * pin is the `session` and `label` of the tab's state; the rest of the state (a view's closed
     * sections and their order) stays.
     */
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
        restateInstance(id, { ...instanceMap(instanceLayoutState(id)), session, label });
    }

    function pointInstance(id: string, state: unknown): boolean {
        const page = access.holding(id);
        if (page === null) return false;
        const caller = findInstance(page.workbench.root, id);
        if (caller === null) return false;
        const identity = stateId(state);
        const existing =
            identity === null
                ? null
                : findView(page.workbench.root, caller.instance.view, identity);
        if (existing !== null && existing.id !== id) {
            activateInstance(existing.id, page.id);
            return false;
        }
        restateInstance(id, state);
        return true;
    }

    /**
     * Clear the pin and label in place, keeping the rest of the tab's state; another unpinned
     * instance of the view may already exist.
     */
    function unpinInstance(id: string): void {
        const kept = Object.entries(instanceMap(instanceLayoutState(id))).filter(
            ([key]) => key !== 'session' && key !== 'label'
        );
        restateInstance(id, Object.fromEntries(kept));
    }

    /** Keep a preview tab. A tab that is not one, and an id no page holds, change nothing. */
    function keepPreview(id: string): void {
        const page = access.holding(id);
        if (page === null) return;
        access.change((tree) => keepInstance(tree, id), page.id);
    }

    /** Pin a tab: it joins its pane's pinned run, and a preview tab it was stops being one. */
    function pinTab(id: string): void {
        const host = access.holding(id);
        if (host === null) return;
        access.change((tree) => pinInTree(tree, id), host.id);
    }

    /** Take a tab's pin off: it becomes the first unpinned tab of its pane. */
    function unpinTab(id: string): void {
        const host = access.holding(id);
        if (host === null) return;
        access.change((tree) => unpinInTree(tree, id), host.id);
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
        for (const host of hostsOf(access.held())) {
            for (const tab of tabsOf(host.workbench.root)) {
                if (tab.view === view) closeInstanceAnywhere(tab.id);
            }
        }
    }

    /** Close one instance wherever it is: on the current page, on another or in a float. */
    function closeInstanceAnywhere(id: string): void {
        const holder = access.holding(id);
        const stays = holder === null ? null : stayingBeside(holder.workbench.root, id);
        access.save(dropInstance(access.held(), id, keep));
        if (holder !== null) settleAttention(holder.id, id, stays);
        access.ui.clearInstanceState(id);
    }

    /**
     * A tab of the pane holding `id` other than `id`, which stays in that pane when `id` closes.
     */
    function stayingBeside(tree: Layout, id: string): string | null {
        const found = findInstance(tree, id);
        const pane = found === null ? null : paneAt(tree, found.path);
        return pane?.tabs.find((tab) => tab.id !== id)?.id ?? null;
    }

    /**
     * After `id` closed on a host: when it was the tab the host was left on, the tab its pane shows
     * now takes its place (`stays` finds that pane), so the pane stays the host's active one and
     * the window title, the status bar and the keyboard follow the tab it shows; a pane the close
     * emptied leaves the host on no tab.
     */
    function settleAttention(host: string, id: string, stays: string | null): void {
        if (attention.active(host) !== id) return;
        const tree = access.workbench(host).root;
        const found = stays === null ? null : findInstance(tree, stays);
        const shown = found === null ? null : (paneAt(tree, found.path)?.active ?? null);
        attention.remembered(shown === '' ? null : shown, host);
    }

    /**
     * Move one instance to another page, taking it out of the page or float it is in and putting it
     * at the end of the first pane of that page's tree.
     */
    function moveInstanceToPage(id: string, page: string): void {
        const from = access.holding(id);
        const to = access.pageOf(page);
        if (from === null || to === null || !isPage(to) || from.id === to.id) return;
        const landing = panesIn(to.workbench.root)[0]?.path ?? [];
        carryToPage(id, from, to, landing, (tree, moved) => openInstance(tree, landing, moved));
    }

    /**
     * Take an instance out of the page or float holding it and put it in another page or float, by
     * the landing `put` makes for it. It keeps its id, so the view it mounts keeps whatever state
     * it holds, and the pane it left is cleaned as closing its tab would clean it.
     */
    function carryToPage(
        id: string,
        from: Host,
        to: Host,
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
        const landed = writeHost(access.held(), to.id, settleFocus({ ...shown, root }));
        access.save(
            writeHost(
                landed,
                from.id,
                settleFocus({
                    ...from.workbench,
                    root: removeInstance(from.workbench.root, id, keepFor(from))
                })
            )
        );
    }

    /**
     * Close an instance. When it was its page's active one, the tab its pane shows now becomes the
     * active one (`settleAttention`).
     */
    function closeInstance(id: string, page?: string): void {
        const holder = access.holding(id) ?? access.at(page);
        if (holder === null) return;
        const current = access.workbench(holder.id);
        const found = findInstance(current.root, id);
        const stays = stayingBeside(current.root, id);
        access.apply(
            settleFocus({ ...current, root: removeInstance(current.root, id, keepFor(holder)) }),
            holder.id
        );
        settleAttention(holder.id, id, stays);
        access.ui.clearInstanceState(id);
        // A closed tab ends the terminals it owns; a tab moved, split or reloaded ends none.
        if (found !== null) access.ui.endTerminals([found.instance]);
    }

    /**
     * Close a whole pane, with every tab it holds, each forgotten as its own close would forget it.
     */
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
     * Forget what closed tabs held: a source draft and the manifest edits live under the instance
     * id, and the forget the store is handed takes every one of them.
     */
    function forgetTabs(tabs: readonly Instance[]): void {
        for (const tab of tabs) access.ui.clearInstanceState(tab.id);
        access.ui.endTerminals(tabs);
    }

    /**
     * What a tab landing in a pane needs of the rest of the arrangement: another pane maximised
     * hides the one it is landing in, and a folded ancestor hides it too. Either way the tab would
     * be moved out of sight, which is the one thing a move must not look like.
     */
    function reveal(path: number[], page?: string): Workbench {
        const current = access.workbench(page);
        const focus = focusedPane(current);
        const shown = focus !== null && !samePath(focus.path, path) ? restore(current) : current;
        return { ...shown, root: expandTo(shown.root, path) };
    }

    /**
     * Move an instance to a pane's tab strip, from wherever it is now. The pane is named in the
     * page the argument names, and the instance is taken out of whichever page holds it, so a tab
     * dragged into a pane of a page shown nested moves between the two pages.
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
        const next = { ...shown, root: moveInstance(shown.root, id, path, index, keepFor(to)) };
        if (next.root === shown.root) return;
        attention.remembered(id, to.id);
        access.apply(settleFocus(next), to.id);
    }

    /** Move an instance into a new pane on one edge of a pane, from wherever it is now. */
    function splitInstance(id: string, path: number[], edge: Edge, page?: string): void {
        const to = access.at(page);
        const from = access.holding(id);
        // A float is one pane: a split beside it is refused.
        if (from === null || to === null || !isPage(to)) return;
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
        const next = splitWith(shown, id, path, edge, keepFor(to));
        if (next === shown) return;
        attention.remembered(id, to.id);
        access.apply(next, to.id);
    }

    return {
        activeInstance,
        instanceLayoutState,
        instanceView,
        restateInstance,
        pinInstance,
        pointInstance,
        unpinInstance,
        keepPreview,
        pinTab,
        unpinTab,
        activateInstance,
        usedInstances: attention.used,
        closeInstancesOfView,
        moveInstanceToPage,
        closeInstance,
        closePane,
        transferInstance,
        splitInstance,
        forgetTabs
    };
}
