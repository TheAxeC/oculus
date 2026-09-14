// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/layout, which has no runes in it; this module is the one place an arrangement is reactive
// and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (two trees, the dock and the panel's
// share) with a name, and which page is on screen. Every operation below the page operations acts on
// the current page, so an operation names the tree it applies to and nothing else knows about pages.
// Every change reaches the store through apply() or savePages(), which are also what save, so
// neither an arrangement nor a page is changed without being written down.
// Unpinning keeps the instance in place, so two unpinned instances of one view may coexist.

import { item } from '../data/guards.ts';
import type { UiStore } from './ui.svelte.ts';
import {
    activePath,
    activate,
    clampPanel,
    closeInstance,
    closePane,
    defaultPages,
    findInstance,
    findView,
    focusedPane,
    panes as panesIn,
    isInstanceOf,
    maximise,
    movePage as movePageIn,
    newInstance,
    newPage,
    openInstance,
    paneAt,
    parseLayout,
    parseWorkbench,
    restate,
    restore,
    serialiseLayout,
    settleFocus,
    splitWith,
    stateId,
    transfer,
    type Dock,
    type Edge,
    type Focus,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Pane,
    type Target,
    type ViewId,
    type Workbench
} from './layout/index.ts';
import { parseArrangement } from './arrangement.ts';
import { t } from './text.ts';

/** The key the arrangement is saved under. The envelope inside it carries the version. */
export const LAYOUT_KEY = 'oculus.layout.v1';

/**
 * The key the workbench a named arrangement replaced was kept under, by the rail control pages
 * retired. Nothing writes it any more: loadLayout reads it once, so the arrangement that control
 * replaced becomes a page of its own, and then writes it empty. It holds a whole serialised
 * workbench, or the empty string: the store never removes a key, so a Storage it is handed needs
 * only get and set.
 */
export const PREVIOUS_KEY = 'oculus.layout.previous';

/** What the store needs of a Storage, so a test can hand it a plain object. */
type Storable = Pick<Storage, 'getItem' | 'setItem'>;

/** The pages one client is rendering, and their persistence. */
export type LayoutStore = {
    currentPage: () => Page;
    pages: () => Page[];
    workbench: () => Workbench;
    layout: (target?: Target) => Layout;
    activeInstance: (target?: Target) => Instance | null;
    instanceLayoutState: (id: string) => unknown;
    restateInstance: (id: string, state: unknown) => void;
    pinInstance: (id: string, session: string, label: string) => void;
    unpinInstance: (id: string) => void;
    openPinnedView: (view: ViewId, session: string, label: string) => string;
    dockedAt: () => Dock;
    panelSize: () => number;
    loadLayout: (storage?: Storable) => boolean;
    openArrangement: (raw: unknown, label: string) => boolean;
    openPage: (label: string) => void;
    switchPage: (id: string) => void;
    renamePage: (id: string, label: string) => void;
    movePage: (id: string, index: number) => void;
    closePage: (id: string) => void;
    pageShortcut: (index: number) => boolean;
    apply: (next: Workbench) => void;
    change: (target: Target, edit: (tree: Layout) => Layout) => void;
    dock: (where: Dock) => void;
    resizePanel: (fraction: number) => void;
    activateInstance: (target: Target, id: string) => void;
    closeInstancesOfView: (view: ViewId) => void;
    moveInstanceToPage: (id: string, page: string) => void;
    closeInstanceIn: (target: Target, id: string) => void;
    closePaneIn: (target: Target, path: number[]) => void;
    transferInstance: (id: string, target: Target, path: number[], index: number) => void;
    splitInstance: (id: string, target: Target, path: number[], edge: Edge) => void;
    maximisePane: (target: Target, path: number[]) => void;
    restorePanes: () => void;
    focused: () => Focus | null;
    openView: (view: ViewId, where: Target, state?: unknown) => string;
};

export function createLayout(ui: UiStore): LayoutStore {
    /**
     * The pages, and which of them is on screen. The label of the page this starts on is empty because
     * the catalog is not installed when this module is evaluated; loadLayout names it, and the strip
     * draws a page carrying no name by its position, which is the one moment such a page is on screen.
     */
    const store: { current: Pages } = $state({ current: defaultPages('') });

    /** Where apply() saves, once loadLayout has named it. Nothing is saved before that. */
    let backing: Storable | null = null;

    /**
     * The instance activated last in each tree of each page, which is what makes one of its panes the
     * active one, keyed by page id so returning to a page finds the pane it was left on. It is not
     * saved: a reload opens a view in the first pane, which is where an arrangement with one pane puts
     * it anyway, and nothing about the arrangement itself is lost.
     */
    const lastActive: Record<string, Record<Target, string | null>> = {};

    /** The page on screen, or the first one when the current id names none. */
    function currentPage(): Page {
        const held = store.current;
        return held.pages.find((page) => page.id === held.current) ?? held.pages[0];
    }

    /** Every page, in the order the strip draws them. */
    function pages(): Page[] {
        return store.current.pages;
    }

    /** The instance activated last in each tree of the page on screen. */
    function active(): Record<Target, string | null> {
        const id = currentPage().id;
        const held = lastActive[id] ?? { main: null, panel: null };
        lastActive[id] = held;
        return held;
    }

    /** The whole arrangement of the page on screen. */
    function workbench(): Workbench {
        return currentPage().workbench;
    }

    /** One of the two trees. */
    function layout(target: Target = 'main'): Layout {
        const current = workbench();
        return target === 'main' ? current.main : current.panel;
    }

    /** The active tab of the pane most recently activated in one tree, or the first pane by default. */
    function activeInstance(target: Target = 'main'): Instance | null {
        const tree = layout(target);
        const pane = paneAt(tree, activePath(tree, active()[target]));
        return pane?.tabs.find((instance) => instance.id === pane.active) ?? null;
    }

    /** One layout instance's own saved state, from whichever tree of the current page holds it. */
    function instanceLayoutState(id: string): unknown {
        const current = workbench();
        const main = findInstance(current.main, id);
        if (main !== null) return main.instance.state;
        return findInstance(current.panel, id)?.instance.state;
    }

    /** Replace one instance's layout state in the tree that holds it. A missing id changes nothing. */
    function restateInstance(id: string, state: unknown): void {
        for (const target of ['main', 'panel'] as const) {
            if (findInstance(layout(target), id) === null) continue;
            change(target, (tree) => restate(tree, id, state));
            return;
        }
    }

    /** Pin one instance, or activate the same view's existing pin in either tree without changing the caller. */
    function pinInstance(id: string, session: string, label: string): void {
        const current = workbench();
        const caller = findInstance(current.main, id) ?? findInstance(current.panel, id);
        if (caller === null) return;
        for (const target of ['main', 'panel'] as const) {
            const existing = findView(layout(target), caller.instance.view, session);
            if (existing === null) continue;
            activateInstance(target, existing.id);
            return;
        }
        restateInstance(id, { session, label });
    }

    /** Clear the pin and label in place; another unpinned instance of the view may already exist. */
    function unpinInstance(id: string): void {
        restateInstance(id, {});
    }

    /**
     * Open another session view pinned to the session a detail shows, in the main area. A view already
     * pinned to that session in either tree is activated where it is, so one session never gets two
     * pinned tabs of one view.
     */
    function openPinnedView(view: ViewId, session: string, label: string): string {
        for (const target of ['main', 'panel'] as const) {
            const existing = findView(layout(target), view, session);
            if (existing === null) continue;
            activateInstance(target, existing.id);
            return existing.id;
        }
        return openView(view, 'main', { session, label });
    }

    /** Where the panel sits. */
    function dockedAt(): Dock {
        return workbench().dock;
    }

    /** The panel's share of the window. */
    function panelSize(): number {
        return workbench().panelSize;
    }

    /**
     * Read the saved arrangement and make it current, falling back to the default when there is none or
     * the saved value fails parseLayout. Returns whether a saved arrangement was restored, which is how
     * a page knows whether it is looking at the default. The default argument is evaluated at the call
     * and not at the import, so a test that never calls this touches no localStorage.
     */
    function loadLayout(storage: Storable = localStorage): boolean {
        backing = storage;
        const first = t('ui.page_default', 1);
        const raw = read(storage, LAYOUT_KEY);
        const parsed = raw === null ? null : parseLayout(raw, first);
        const held = parseWorkbench(read(storage, PREVIOUS_KEY));
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        for (const id of Object.keys(lastActive)) delete lastActive[id];
        // A browser that ran before pages holds one workbench, and holds the user's own arrangement
        // beside it when the rail control pages retired had put the sessions arrangement on screen.
        // Both are kept: the user's own becomes page 1 and what was on screen becomes page 2, so the
        // control's restore is not needed to reach either of them.
        if (parsed !== null && held !== null && parseWorkbench(raw) !== null) {
            const shown = newPage(t('ui.page_sessions'), parsed.pages[0].workbench);
            // Written at once: the version 2 envelope under LAYOUT_KEY still holds only what was on
            // screen, so a reload before the next change would lose the page the held one became.
            savePages({ pages: [newPage(first, held), shown], current: shown.id });
        } else {
            store.current = parsed ?? defaultPages(first);
        }
        if (held !== null) remember(PREVIOUS_KEY, '');
        return parsed !== null;
    }

    /** One key of a storage, or null when there is none or the browser refused to be read. */
    function read(storage: Storable, key: string): string | null {
        try {
            return storage.getItem(key);
        } catch {
            // A browser with storage refused still runs; it just forgets the arrangement.
            return null;
        }
    }

    /** Write one string under a key, or do nothing when there is nowhere to write yet. */
    function remember(key: string, value: string): void {
        if (backing === null) return;
        try {
            backing.setItem(key, value);
        } catch {
            // A full or refused storage forgets the arrangement at the next load and nothing else.
        }
    }

    /**
     * A named arrangement of config/layout.yml as a page of its own, made current. A page already
     * carrying that name is switched to instead, so the control that opens one is idempotent and a
     * second press does not fill the strip with copies. An arrangement that does not parse changes
     * nothing and says so.
     */
    function openArrangement(raw: unknown, label: string): boolean {
        const found = store.current.pages.find((page) => page.label === label);
        if (found !== undefined) {
            switchPage(found.id);
            return true;
        }
        const next = parseArrangement(raw);
        if (next === null) return false;
        addPage(newPage(label, next));
        return true;
    }

    /** A new page, on the default workbench, made current. */
    function openPage(label: string): void {
        addPage(newPage(label));
    }

    /** Put a page at the end of the strip and show it. */
    function addPage(page: Page): void {
        savePages({ pages: [...store.current.pages, page], current: page.id });
    }

    /** Show a page. A page id naming none changes nothing. */
    function switchPage(id: string): void {
        if (!store.current.pages.some((page) => page.id === id)) return;
        savePages({ ...store.current, current: id });
    }

    /** Give a page another name. */
    function renamePage(id: string, label: string): void {
        savePages({
            ...store.current,
            pages: store.current.pages.map((page) => (page.id === id ? { ...page, label } : page))
        });
    }

    /** Move a page to a clamped position in the strip and save the new order. */
    function movePage(id: string, index: number): void {
        savePages(movePageIn(store.current, id, index));
    }

    /**
     * Close a page, with every tab on it. The page after it becomes current, or the one before it when
     * it was the last in the strip; closing the only page leaves one fresh default page, since a
     * workbench with no page to render is nothing at all.
     */
    function closePage(id: string): void {
        const held = store.current.pages;
        const at = held.findIndex((page) => page.id === id);
        if (at < 0) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        delete lastActive[id];
        const left = held.filter((page) => page.id !== id);
        if (left.length === 0) {
            savePages(defaultPages(t('ui.page_default', 1)));
            return;
        }
        const next =
            store.current.current === id
                ? left[Math.min(at, left.length - 1)].id
                : store.current.current;
        savePages({ pages: left, current: next });
    }

    /**
     * Show the page at `index`, counting from 1, which is what the digits 1 to 9 do. It answers whether
     * there was one, so the handler swallows the key only when the shortcut did something.
     */
    function pageShortcut(index: number): boolean {
        const page = item(store.current.pages, index - 1);
        if (index < 1 || page === undefined) return false;
        switchPage(page.id);
        return true;
    }

    /** Make an arrangement the current page's and save every page. */
    function apply(next: Workbench): void {
        const held = store.current;
        savePages({
            ...held,
            pages: held.pages.map((page) =>
                page.id === currentPage().id ? { ...page, workbench: next } : page
            )
        });
    }

    /** Make a set of pages current and save it. */
    function savePages(next: Pages): void {
        store.current = next;
        if (backing === null) return;
        try {
            backing.setItem(LAYOUT_KEY, serialiseLayout(next));
        } catch {
            // A full or refused storage loses the arrangement at the next load and nothing else: the
            // arrangement in memory is what the shell renders and it is already current.
        }
    }

    /** Apply an operation to one of the two trees, which is how every tree edit reaches the store. */
    function change(target: Target, edit: (tree: Layout) => Layout): void {
        const current = workbench();
        const next = edit(target === 'main' ? current.main : current.panel);
        apply(target === 'main' ? { ...current, main: next } : { ...current, panel: next });
    }

    /** Where the panel sits, or that it is not shown. */
    function dock(where: Dock): void {
        apply({ ...workbench(), dock: where });
    }

    /** How much of the window the panel takes, held inside the allowed range. */
    function resizePanel(fraction: number): void {
        apply({ ...workbench(), panelSize: clampPanel(fraction) });
    }

    /** Make an instance the active tab of its pane, and its pane the tree's active one. */
    function activateInstance(target: Target, id: string): void {
        active()[target] = id;
        change(target, (tree) => activate(tree, id));
    }

    /**
     * Close every open instance of a view, in both trees of every page. It is what a view leaving the
     * registry means for the arrangement: the tab goes with the key rather than staying as a tab whose
     * body the shell cannot draw.
     */
    function closeInstancesOfView(view: ViewId): void {
        for (const page of store.current.pages) {
            for (const target of ['main', 'panel'] as const) {
                const tree = page.workbench[target];
                for (const { pane } of panesIn(tree)) {
                    for (const tab of pane.tabs) {
                        if (tab.view !== view) continue;
                        closeInstanceAnywhere(tab.id);
                    }
                }
            }
        }
    }

    /** Close one instance wherever it is, on the current page or on another. */
    function closeInstanceAnywhere(id: string): void {
        const held = active();
        for (const target of ['main', 'panel'] as const) {
            if (held[target] === id) held[target] = null;
        }
        savePages({
            ...store.current,
            pages: store.current.pages.map((page) => ({
                ...page,
                workbench: settleFocus({
                    ...page.workbench,
                    main: closeInstance(page.workbench.main, id),
                    panel: closeInstance(page.workbench.panel, id)
                })
            }))
        });
        ui.clearInstanceState(id);
    }

    /**
     * Move one instance to another page, taking it out of the page it is on and putting it at the end
     * of the first pane of that page's main tree.
     */
    function moveInstanceToPage(id: string, page: string): void {
        const from = store.current.pages.find((one) => one.id === currentPage().id);
        const to = store.current.pages.find((one) => one.id === page);
        if (from === undefined || to === undefined || from.id === to.id) return;
        const found =
            findInstance(from.workbench.main, id) ?? findInstance(from.workbench.panel, id);
        if (found === null) return;
        const moved = found.instance;
        const held = active();
        for (const target of ['main', 'panel'] as const) {
            if (held[target] === id) held[target] = null;
        }
        const landing = panesIn(to.workbench.main)[0]?.path ?? [];
        savePages({
            ...store.current,
            pages: store.current.pages.map((one) => {
                if (one.id === from.id) {
                    return {
                        ...one,
                        workbench: settleFocus({
                            ...one.workbench,
                            main: closeInstance(one.workbench.main, id),
                            panel: closeInstance(one.workbench.panel, id)
                        })
                    };
                }
                if (one.id !== to.id) return one;
                return {
                    ...one,
                    workbench: {
                        ...one.workbench,
                        main: openInstance(one.workbench.main, landing, moved)
                    }
                };
            })
        });
    }

    /** Close an instance, and forget it if it was the tree's active one. */
    function closeInstanceIn(target: Target, id: string): void {
        const held = active();
        if (held[target] === id) held[target] = null;
        apply(settleFocus(withTree(target, closeInstance(layout(target), id))));
        ui.clearInstanceState(id);
    }

    /** The arrangement with one of its trees replaced, which is what an operation on a tree returns. */
    function withTree(target: Target, tree: Layout): Workbench {
        const current = workbench();
        return target === 'main' ? { ...current, main: tree } : { ...current, panel: tree };
    }

    /** Close a whole pane, with every tab it holds. */
    function closePaneIn(target: Target, path: number[]): void {
        const pane = paneAt(layout(target), path);
        if (pane === null) return;
        const seen = active();
        const held = seen[target];
        if (held !== null && pane.tabs.some((tab) => tab.id === held)) seen[target] = null;
        apply(settleFocus(withTree(target, closePane(layout(target), path))));
    }

    /**
     * What a tab landing in a tree needs of the rest of the arrangement: a maximised pane in the other
     * tree hides the one it is landing in, and a hidden panel hides it altogether. Either way the tab
     * would be moved out of sight, which is the one thing a move must not look like.
     */
    function reveal(target: Target): Workbench {
        const current = workbench();
        const focus = focusedPane(current);
        const shown = focus !== null && focus.target !== target ? restore(current) : current;
        return target === 'panel' && shown.dock === 'hidden' ? { ...shown, dock: 'right' } : shown;
    }

    /** Move an instance to a pane's tab strip, from whichever of the two trees holds it now. */
    function transferInstance(id: string, target: Target, path: number[], index: number): void {
        const from = reveal(target);
        const next = transfer(from, id, target, path, index);
        if (next === from) return;
        active()[target] = id;
        apply(next);
    }

    /** Move an instance into a new pane on one edge of a pane, from whichever tree holds it now. */
    function splitInstance(id: string, target: Target, path: number[], edge: Edge): void {
        const from = reveal(target);
        const next = splitWith(from, id, target, path, edge);
        if (next === from) return;
        active()[target] = id;
        apply(next);
    }

    /** Show one pane alone, with the rest of the workbench put away. */
    function maximisePane(target: Target, path: number[]): void {
        apply(maximise(workbench(), target, path));
    }

    /** Show every pane again. */
    function restorePanes(): void {
        apply(restore(workbench()));
    }

    /** The maximised pane, or null when every pane is shown. */
    function focused(): Focus | null {
        return focusedPane(workbench());
    }

    /**
     * Show a view in one of the two trees: the instance already there is activated, so the rail never
     * opens a second copy of the same view, and otherwise a new instance opens in that tree's active
     * pane. The panel is shown when a view is opened into it and it was hidden, since opening a view
     * into something invisible would look like nothing happening.
     *
     * `state` is what the opener has to say to the view: the project a card wants opened or the session
     * a pane pins. A state carrying an `id` or `session` names which instance is wanted, so opening one
     * record twice activates its existing tab and opening a second record creates another. A state
     * carrying neither retargets the unpinned instance, while pinned instances stay fixed. The returned
     * id names the instance activated or created, so its separate UI state can be updated by the caller.
     */
    function openView(view: ViewId, where: Target, state?: unknown): string {
        // A maximised pane hides everything else, so a view opened into the other tree would land out
        // of sight; opening it is what the rail was clicked for, so the arrangement comes back instead.
        const focus = focusedPane(workbench());
        if (focus !== null && focus.target !== where) restorePanes();

        const tree = layout(where);
        const into = focus !== null && focus.target === where ? focus.path : null;
        const inside = into === null ? null : paneAt(tree, into);
        const wanted = stateId(state);
        const existing =
            inside === null ? findView(tree, view, wanted) : findIn(inside, view, wanted);
        if (existing !== null) {
            if (state !== undefined)
                change(where, (current) => restate(current, existing.id, state));
            activateInstance(where, existing.id);
            if (where === 'panel' && dockedAt() === 'hidden') dock('right');
            return existing.id;
        }
        const instance = newInstance(view, state ?? {});
        const path = into !== null && inside !== null ? into : activePath(tree, active()[where]);
        active()[where] = instance.id;
        change(where, (current) => openInstance(current, path, instance));
        if (where === 'panel' && dockedAt() === 'hidden') dock('right');
        return instance.id;
    }

    /**
     * The instance of a view in one pane, or null when it holds none. While a pane is maximised it is
     * the only pane a view can be opened into, so it is the only one an already-open instance may be
     * found in: activating a tab of a pane nobody can see would look like nothing happening. A state
     * identity narrows it the same way findView does.
     */
    function findIn(pane: Pane, view: ViewId, id: string | null): Instance | null {
        return pane.tabs.find((tab) => isInstanceOf(tab, view, id)) ?? null;
    }

    return {
        currentPage,
        pages,
        workbench,
        layout,
        activeInstance,
        instanceLayoutState,
        restateInstance,
        pinInstance,
        unpinInstance,
        openPinnedView,
        dockedAt,
        panelSize,
        loadLayout,
        openArrangement,
        openPage,
        switchPage,
        renamePage,
        movePage,
        closePage,
        pageShortcut,
        apply,
        change,
        dock,
        resizePanel,
        activateInstance,
        closeInstancesOfView,
        moveInstanceToPage,
        closeInstanceIn,
        closePaneIn,
        transferInstance,
        splitInstance,
        maximisePane,
        restorePanes,
        focused,
        openView
    };
}
