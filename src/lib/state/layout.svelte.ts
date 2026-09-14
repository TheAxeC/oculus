// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/layout, which has no runes in it; this module is the one place an arrangement is reactive
// and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (one tree and the maximised pane, if
// there is one) with a name, and which page is on screen. Every operation below the page operations
// acts on the current page's tree, so nothing below them knows about pages.
// Every change reaches the store through apply() or savePages(), which are also what save, so
// neither an arrangement nor a page is changed without being written down.
// Unpinning keeps the instance in place, so two unpinned instances of one view may coexist.

import { item } from '../data/guards.ts';
import type { UiStore } from './ui.svelte.ts';
import {
    activePath,
    activate,
    closeInstance as removeInstance,
    closePane as removePane,
    defaultPages,
    expand,
    expandTo,
    findInstance,
    findView,
    focusedPane,
    fold,
    panes as panesIn,
    isInstanceOf,
    maximise,
    moveInstance,
    movePage as movePageIn,
    newInstance,
    newPage,
    openInstance,
    paneAt,
    parseLayout,
    parseWorkbench,
    restate,
    restore,
    samePath,
    serialiseLayout,
    settleFocus,
    splitPane,
    splitWith,
    stateId,
    type Edge,
    type Focus,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Pane,
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
    layout: () => Layout;
    activeInstance: () => Instance | null;
    instanceLayoutState: (id: string) => unknown;
    restateInstance: (id: string, state: unknown) => void;
    pinInstance: (id: string, session: string, label: string) => void;
    unpinInstance: (id: string) => void;
    loadLayout: (storage?: Storable) => boolean;
    openArrangement: (raw: unknown, label: string) => boolean;
    openPage: (label: string) => void;
    switchPage: (id: string) => void;
    renamePage: (id: string, label: string) => void;
    movePage: (id: string, index: number) => void;
    closePage: (id: string) => void;
    pageShortcut: (index: number) => boolean;
    apply: (next: Workbench) => void;
    change: (edit: (tree: Layout) => Layout) => void;
    activateInstance: (id: string) => void;
    closeInstancesOfView: (view: ViewId) => void;
    moveInstanceToPage: (id: string, page: string) => void;
    closeInstance: (id: string) => void;
    closePane: (path: number[]) => void;
    transferInstance: (id: string, path: number[], index: number) => void;
    splitInstance: (id: string, path: number[], edge: Edge) => void;
    maximisePane: (path: number[]) => void;
    restorePanes: () => void;
    foldPane: (path: number[]) => void;
    expandChild: (path: number[], index: number) => void;
    focused: () => Focus | null;
    openView: (view: ViewId, state?: unknown) => string;
    openBeside: (view: ViewId, state?: unknown) => string;
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
     * The instance activated last on each page, which is what makes one of its panes the active one,
     * keyed by page id so returning to a page finds the pane it was left on. It is not saved: a
     * reload opens a view in the first pane, which is where an arrangement with one pane puts it
     * anyway, and nothing about the arrangement itself is lost.
     */
    const lastActive: Record<string, string | null> = {};

    /** The page on screen, or the first one when the current id names none. */
    function currentPage(): Page {
        const held = store.current;
        return held.pages.find((page) => page.id === held.current) ?? held.pages[0];
    }

    /** Every page, in the order the strip draws them. */
    function pages(): Page[] {
        return store.current.pages;
    }

    /**
     * The instance the last openBeside made on each page, and the one that was being read when the
     * pane was split off, so a second view asked for beside the one being read joins the pane the
     * first one made rather than splitting again. It is not saved and is forgotten with lastActive on
     * a load, so a reload opens the next one in a pane of its own.
     */
    const lastBeside = new Map<string, { made: string; from: string | null }>();

    /** The instance activated last on the page on screen. */
    function active(): string | null {
        return lastActive[currentPage().id] ?? null;
    }

    /** Remember which instance the page on screen was last left on. */
    function remembered(id: string | null): void {
        lastActive[currentPage().id] = id;
    }

    /** The whole arrangement of the page on screen. */
    function workbench(): Workbench {
        return currentPage().workbench;
    }

    /** The tree of the page on screen. */
    function layout(): Layout {
        return workbench().root;
    }

    /** The active tab of the pane most recently activated, or of the first pane by default. */
    function activeInstance(): Instance | null {
        const tree = layout();
        const pane = paneAt(tree, activePath(tree, active()));
        return pane?.tabs.find((instance) => instance.id === pane.active) ?? null;
    }

    /** One layout instance's own saved state, from the current page's tree. */
    function instanceLayoutState(id: string): unknown {
        return findInstance(layout(), id)?.instance.state;
    }

    /** Replace one instance's layout state. A missing id changes nothing. */
    function restateInstance(id: string, state: unknown): void {
        if (findInstance(layout(), id) === null) return;
        change((tree) => restate(tree, id, state));
    }

    /** Pin one instance, or activate the same view's existing pin without changing the caller. */
    function pinInstance(id: string, session: string, label: string): void {
        const caller = findInstance(layout(), id);
        if (caller === null) return;
        const existing = findView(layout(), caller.instance.view, session);
        if (existing !== null) {
            activateInstance(existing.id);
            return;
        }
        restateInstance(id, { session, label });
    }

    /** Clear the pin and label in place; another unpinned instance of the view may already exist. */
    function unpinInstance(id: string): void {
        restateInstance(id, {});
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
        lastBeside.clear();
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
        lastBeside.delete(id);
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

    /** Apply an operation to the page's tree, which is how every tree edit reaches the store. */
    function change(edit: (tree: Layout) => Layout): void {
        const current = workbench();
        apply({ ...current, root: edit(current.root) });
    }

    /** Make an instance the active tab of its pane, and its pane the tree's active one. */
    function activateInstance(id: string): void {
        remembered(id);
        change((tree) => activate(tree, id));
    }

    /**
     * Close every open instance of a view, on every page. It is what a view leaving the registry
     * means for the arrangement: the tab goes with the key rather than staying as a tab whose body
     * the shell cannot draw.
     */
    function closeInstancesOfView(view: ViewId): void {
        for (const page of store.current.pages) {
            for (const { pane } of panesIn(page.workbench.root)) {
                for (const tab of pane.tabs) {
                    if (tab.view !== view) continue;
                    closeInstanceAnywhere(tab.id);
                }
            }
        }
    }

    /** Close one instance wherever it is, on the current page or on another. */
    function closeInstanceAnywhere(id: string): void {
        if (active() === id) remembered(null);
        savePages({
            ...store.current,
            pages: store.current.pages.map((page) => ({
                ...page,
                workbench: settleFocus({
                    ...page.workbench,
                    root: removeInstance(page.workbench.root, id)
                })
            }))
        });
        ui.clearInstanceState(id);
    }

    /**
     * Move one instance to another page, taking it out of the page it is on and putting it at the end
     * of the first pane of that page's tree.
     */
    function moveInstanceToPage(id: string, page: string): void {
        const from = store.current.pages.find((one) => one.id === currentPage().id);
        const to = store.current.pages.find((one) => one.id === page);
        if (from === undefined || to === undefined || from.id === to.id) return;
        const found = findInstance(from.workbench.root, id);
        if (found === null) return;
        const moved = found.instance;
        if (active() === id) remembered(null);
        const landing = panesIn(to.workbench.root)[0]?.path ?? [];
        savePages({
            ...store.current,
            pages: store.current.pages.map((one) => {
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
                return {
                    ...one,
                    workbench: {
                        ...one.workbench,
                        root: openInstance(one.workbench.root, landing, moved)
                    }
                };
            })
        });
    }

    /** Close an instance, and forget it if it was the tree's active one. */
    function closeInstance(id: string): void {
        if (active() === id) remembered(null);
        apply(settleFocus({ ...workbench(), root: removeInstance(layout(), id) }));
        ui.clearInstanceState(id);
    }

    /** Close a whole pane, with every tab it holds. */
    function closePane(path: number[]): void {
        const pane = paneAt(layout(), path);
        if (pane === null) return;
        const held = active();
        if (held !== null && pane.tabs.some((tab) => tab.id === held)) remembered(null);
        apply(settleFocus({ ...workbench(), root: removePane(layout(), path) }));
    }

    /**
     * What a tab landing in a pane needs of the rest of the arrangement: another pane maximised hides
     * the one it is landing in, and a folded ancestor hides it too. Either way the tab would be moved
     * out of sight, which is the one thing a move must not look like.
     */
    function reveal(path: number[]): Workbench {
        const current = workbench();
        const focus = focusedPane(current);
        const shown = focus !== null && !samePath(focus.path, path) ? restore(current) : current;
        return { ...shown, root: expandTo(shown.root, path) };
    }

    /** Move an instance to a pane's tab strip, from wherever in the tree it is now. */
    function transferInstance(id: string, path: number[], index: number): void {
        const from = reveal(path);
        const next = { ...from, root: moveInstance(from.root, id, path, index) };
        if (next.root === from.root) return;
        remembered(id);
        apply(settleFocus(next));
    }

    /** Move an instance into a new pane on one edge of a pane, from wherever it is now. */
    function splitInstance(id: string, path: number[], edge: Edge): void {
        const from = reveal(path);
        const next = splitWith(from, id, path, edge);
        if (next === from) return;
        remembered(id);
        apply(next);
    }

    /** Show one pane alone, with the rest of the workbench put away. */
    function maximisePane(path: number[]): void {
        apply(maximise(workbench(), path));
    }

    /** Show every pane again. */
    function restorePanes(): void {
        apply(restore(workbench()));
    }

    /**
     * Collapse a child of a split to its edge. The maximised pane is given back first when it is the
     * one being folded or sits inside it, since a pane shown alone and collapsed at once is neither.
     */
    function foldPane(path: number[]): void {
        if (path.length === 0) return;
        const current = workbench();
        const folded = fold(current.root, path);
        if (folded === current.root) return;
        const focus = focusedPane(current);
        const inside = focus !== null && path.every((step, at) => focus.path[at] === step);
        apply({ ...(inside ? restore(current) : current), root: folded });
    }

    /** Give a folded child of the split at `path` its share back. */
    function expandChild(path: number[], index: number): void {
        change((tree) => expand(tree, path, index));
    }

    /** The maximised pane, or null when every pane is shown. */
    function focused(): Focus | null {
        return focusedPane(workbench());
    }

    /**
     * Show a view: the instance already open is activated, so the rail never opens a second copy of
     * the same view, and otherwise a new instance opens in the pane holding the instance activated
     * last. A pane hidden inside a folded child is expanded first, since opening a view into
     * something invisible would look like nothing happening.
     *
     * `state` is what the opener has to say to the view: the project a card wants opened or the session
     * a pane pins. A state carrying an `id` or `session` names which instance is wanted, so opening one
     * record twice activates its existing tab and opening a second record creates another. A state
     * carrying neither retargets the unpinned instance, while pinned instances stay fixed. The returned
     * id names the instance activated or created, so its separate UI state can be updated by the caller.
     */
    function openView(view: ViewId, state?: unknown): string {
        return openInto(view, state, false);
    }

    /**
     * Show a view in a new pane to the right of the pane holding the instance activated last, which
     * is what a view asked for beside the one being read means. The pane the last one made takes the
     * next one as a tab while it is still open, so opening the editor from five cards is one pane of
     * five tabs. A view already open is activated where it is, exactly as openView activates it, and
     * a maximised pane takes the view itself, since a new pane beside it would be one nobody can see.
     */
    function openBeside(view: ViewId, state?: unknown): string {
        return openInto(view, state, true);
    }

    /** Open or activate a view, in the pane a view lands in or in a new pane beside that one. */
    function openInto(view: ViewId, state: unknown, beside: boolean): string {
        const focus = focusedPane(workbench());
        const tree = layout();
        const into = focus === null ? null : focus.path;
        const inside = into === null ? null : paneAt(tree, into);
        const wanted = stateId(state);
        const existing =
            inside === null ? findView(tree, view, wanted) : findIn(inside, view, wanted);
        if (existing !== null) {
            remembered(existing.id);
            change((current) => {
                const stated = state === undefined ? current : restate(current, existing.id, state);
                return activate(expandTo(stated, activePath(stated, existing.id)), existing.id);
            });
            return existing.id;
        }
        const instance = newInstance(view, state ?? {});
        const path = into !== null && inside !== null ? into : activePath(tree, active());
        const aside = beside && inside === null;
        const stack = aside ? besidePath(tree) : null;
        if (aside) {
            // The pane split off keeps the tab that was being read as the one it sits beside; a tab
            // stacked into that pane keeps the memory the pane was made with.
            const held = lastBeside.get(currentPage().id);
            const from =
                stack !== null && held !== undefined
                    ? held.from
                    : (paneAt(tree, path)?.active ?? null);
            lastBeside.set(currentPage().id, { made: instance.id, from });
        }
        remembered(instance.id);
        change((current) => {
            const shown = expandTo(current, stack ?? path);
            if (!aside) return openInstance(shown, path, instance);
            return stack === null
                ? splitPane(shown, path, 'row', instance)
                : openInstance(shown, stack, instance);
        });
        return instance.id;
    }

    /**
     * The pane the last openBeside made, while the instance it made is still on the page and not in
     * the pane of the instance it was opened beside: a tab dragged back into the pane being read is
     * beside nothing, so the next view asked for beside it splits again.
     */
    function besidePath(tree: Layout): number[] | null {
        const held = lastBeside.get(currentPage().id);
        if (held === undefined) return null;
        const made = findInstance(tree, held.made);
        if (made === null) return null;
        const from = held.from === null ? null : findInstance(tree, held.from);
        if (from !== null && samePath(made.path, from.path)) return null;
        return made.path;
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
        activateInstance,
        closeInstancesOfView,
        moveInstanceToPage,
        closeInstance,
        closePane,
        transferInstance,
        splitInstance,
        maximisePane,
        restorePanes,
        foldPane,
        expandChild,
        focused,
        openView,
        openBeside
    };
}
