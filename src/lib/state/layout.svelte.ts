// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/layout, which has no runes in it; this module is the one place an arrangement is reactive
// and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (one tree and the maximised pane, if
// there is one) with a name, and which page is on screen. Every operation that names a path names
// the page it addresses, and the page on screen is what it means when it names none, so a caller
// that knows nothing of pages reads and writes the one the strip is on.
// Every change reaches the store through apply() or savePages(), which are also what save, so
// neither an arrangement nor a page is changed without being written down.
// Unpinning keeps the instance in place, so two unpinned instances of one view may coexist.

import { item } from '../data/guards.ts';
import type { UiStore } from './ui.svelte.ts';
import {
    activePath,
    activate,
    clearPage,
    closeInstance as removeInstance,
    closePane as removePane,
    defaultPages,
    embedPage as embedIn,
    expand,
    expandTo,
    findInstance,
    findView,
    focusedPane,
    fold,
    insertInstance,
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
    showable,
    showsPage,
    unembedPage as unembedIn,
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

/** What a reader given the id of a page the list does not hold is answered with. */
const GONE: Workbench = { root: { kind: 'pane', tabs: [], active: '' } };

/** The pages one client is rendering, and their persistence. */
export type LayoutStore = {
    currentPage: () => Page;
    pages: () => Page[];
    pageOf: (id: string) => Page | null;
    touchPane: (page: string) => void;
    workbench: (page?: string) => Workbench;
    layout: (page?: string) => Layout;
    activeInstance: (page?: string) => Instance | null;
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
    apply: (next: Workbench, page?: string) => void;
    change: (edit: (tree: Layout) => Layout, page?: string) => void;
    activateInstance: (id: string, page?: string) => void;
    closeInstancesOfView: (view: ViewId) => void;
    moveInstanceToPage: (id: string, page: string) => void;
    closeInstance: (id: string, page?: string) => void;
    closePane: (path: number[], page?: string) => void;
    transferInstance: (id: string, path: number[], index: number, page?: string) => void;
    splitInstance: (id: string, path: number[], edge: Edge, page?: string) => void;
    embedPage: (nested: string, path: number[], edge: Edge, page?: string) => void;
    unembedPage: (path: number[], page?: string) => void;
    maximisePane: (path: number[], page?: string) => void;
    restorePanes: (page?: string) => void;
    foldPane: (path: number[], page?: string) => void;
    expandChild: (path: number[], index: number, page?: string) => void;
    focused: (page?: string) => Focus | null;
    openView: (view: ViewId, state?: unknown, page?: string) => string;
    openBeside: (view: ViewId, state?: unknown, page?: string) => string;
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

    /** The page of the pane the reader last acted in, or null when none has been acted in yet. */
    let lastTouched: string | null = null;

    /** The page on screen, or the first one when the current id names none. */
    function currentPage(): Page {
        const held = store.current;
        return held.pages.find((page) => page.id === held.current) ?? held.pages[0];
    }

    /** Every page, in the order the strip draws them. */
    function pages(): Page[] {
        return store.current.pages;
    }

    /** The page with this id, or null when the list holds none. */
    function pageOf(id: string): Page | null {
        return store.current.pages.find((page) => page.id === id) ?? null;
    }

    /**
     * The page an operation addresses: the one its page argument names, the page on screen when it
     * names none, and nothing at all when it names a page the list does not hold. An operation given
     * an id of a page that is gone therefore changes nothing rather than acting on another page.
     */
    function at(page?: string): Page | null {
        return page === undefined ? currentPage() : pageOf(page);
    }

    /**
     * The page the reader is in: the one shown at the pane last pressed or focused, and the page on
     * screen before any pane has been, when that pane's page is gone, or when the strip has been
     * switched since. It is what a view opened by anything that names no page lands in, so a card
     * pressed inside a shown page opens its tab on that page.
     */
    function touched(): Page {
        const current = currentPage();
        const held = lastTouched === null ? null : pageOf(lastTouched);
        if (held === null) return current;
        // A page the screen no longer draws is not where the reader is, whatever was pressed last.
        return showsPage(store.current.pages, current.id, held.id) || held.id === current.id
            ? held
            : current;
    }

    /** Forget the pane last acted in unless it is on this page: what hid the rest hid it too. */
    function forgetTouchedOutside(page: string | undefined): void {
        const id = at(page)?.id;
        if (lastTouched !== null && lastTouched !== id) lastTouched = null;
    }

    /** The reader acted in a pane of this page. It is not saved: a load starts from the strip. */
    function touchPane(page: string): void {
        if (pageOf(page) !== null) lastTouched = page;
    }

    /** The page whose tree holds an instance, or null when no page does. */
    function holding(id: string): Page | null {
        return (
            store.current.pages.find((page) => findInstance(page.workbench.root, id) !== null) ??
            null
        );
    }

    /**
     * The instance the last openBeside made on each page, and the one that was being read when the
     * pane was split off, so a second view asked for beside the one being read joins the pane the
     * first one made rather than splitting again. It is not saved and is forgotten with lastActive on
     * a load, so a reload opens the next one in a pane of its own.
     */
    const lastBeside = new Map<string, { made: string; from: string | null }>();

    /** The instance activated last on a page. */
    function active(page?: string): string | null {
        const held = at(page);
        return held === null ? null : (lastActive[held.id] ?? null);
    }

    /** Remember which instance a page was last left on. */
    function remembered(id: string | null, page?: string): void {
        const held = at(page);
        if (held !== null) lastActive[held.id] = id;
    }

    /** The whole arrangement of a page, and an empty one for an id naming no page. */
    function workbench(page?: string): Workbench {
        return at(page)?.workbench ?? GONE;
    }

    /** The tree of a page. */
    function layout(page?: string): Layout {
        return workbench(page).root;
    }

    /** The active tab of the pane most recently activated, or of the first pane by default. */
    function activeInstance(page?: string): Instance | null {
        const tree = layout(page);
        const pane = paneAt(tree, activePath(tree, active(page)));
        return pane?.tabs.find((instance) => instance.id === pane.active) ?? null;
    }

    /**
     * One layout instance's own saved state, from whichever page's tree holds it: a tab inside a
     * page shown in another page is held by the page it belongs to and not by the one showing it.
     */
    function instanceLayoutState(id: string): unknown {
        const page = holding(id);
        return page === null ? undefined : findInstance(page.workbench.root, id)?.instance.state;
    }

    /** Replace one instance's layout state. A missing id changes nothing. */
    function restateInstance(id: string, state: unknown): void {
        const page = holding(id);
        if (page === null) return;
        change((tree) => restate(tree, id, state), page.id);
    }

    /** Pin one instance, or activate the same view's existing pin without changing the caller. */
    function pinInstance(id: string, session: string, label: string): void {
        const page = holding(id);
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
        // The pane the reader was in belonged to the page that was on screen, so a view opened next
        // lands in the page switched to until a pane of this one is pressed.
        lastTouched = null;
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
        // A page that is gone is shown nowhere: every leaf naming it becomes an empty pane, so no
        // tree is left pointing at a page the strip no longer holds.
        savePages(clearPage({ pages: left, current: next }, id));
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

    /** Make an arrangement a page's and save every page. An id naming no page changes nothing. */
    function apply(next: Workbench, page?: string): void {
        const held = store.current;
        const id = at(page)?.id;
        if (id === undefined) return;
        savePages({
            ...held,
            pages: held.pages.map((one) => (one.id === id ? { ...one, workbench: next } : one))
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

    /** Apply an operation to a page's tree, which is how every tree edit reaches the store. */
    function change(edit: (tree: Layout) => Layout, page?: string): void {
        const current = workbench(page);
        apply({ ...current, root: edit(current.root) }, page);
    }

    /**
     * Make an instance the active tab of its pane, and its pane its page's active one. The page is
     * the one whose tree holds the instance, which is the page shown at the pane when that pane is
     * inside a page leaf.
     */
    function activateInstance(id: string, page?: string): void {
        const holder = holding(id) ?? at(page);
        if (holder === null) return;
        touchPane(holder.id);
        remembered(id, holder.id);
        change((tree) => activate(tree, id), holder.id);
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
        const holder = holding(id);
        if (holder !== null && active(holder.id) === id) remembered(null, holder.id);
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
        const from = holding(id);
        const to = pageOf(page);
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
        if (active(from.id) === id) remembered(null, from.id);
        remembered(id, to.id);
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
                return { ...one, workbench: settleFocus({ ...shown, root }) };
            })
        });
    }

    /** Close an instance, and forget it if it was its page's active one. */
    function closeInstance(id: string, page?: string): void {
        const holder = holding(id) ?? at(page);
        if (holder === null) return;
        if (active(holder.id) === id) remembered(null, holder.id);
        const current = workbench(holder.id);
        apply(settleFocus({ ...current, root: removeInstance(current.root, id) }), holder.id);
        ui.clearInstanceState(id);
    }

    /** Close a whole pane, with every tab it holds. */
    function closePane(path: number[], page?: string): void {
        const id = at(page)?.id;
        if (id === undefined) return;
        const current = workbench(id);
        const pane = paneAt(current.root, path);
        if (pane === null) return;
        const held = active(id);
        if (held !== null && pane.tabs.some((tab) => tab.id === held)) remembered(null, id);
        apply(settleFocus({ ...current, root: removePane(current.root, path) }), id);
    }

    /**
     * What a tab landing in a pane needs of the rest of the arrangement: another pane maximised hides
     * the one it is landing in, and a folded ancestor hides it too. Either way the tab would be moved
     * out of sight, which is the one thing a move must not look like.
     */
    function reveal(path: number[], page?: string): Workbench {
        const current = workbench(page);
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
        const to = at(page);
        const from = holding(id);
        if (from === null || to === null) return;
        if (from.id !== to.id) {
            carryToPage(id, from, to, path, (tree, moved) =>
                insertInstance(tree, path, index, moved)
            );
            return;
        }
        const shown = reveal(path, to.id);
        const next = { ...shown, root: moveInstance(shown.root, id, path, index) };
        if (next.root === shown.root) return;
        remembered(id, to.id);
        apply(settleFocus(next), to.id);
    }

    /** Move an instance into a new pane on one edge of a pane, from wherever it is now. */
    function splitInstance(id: string, path: number[], edge: Edge, page?: string): void {
        const to = at(page);
        const from = holding(id);
        if (from === null || to === null) return;
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
        remembered(id, to.id);
        apply(next, to.id);
    }

    /**
     * Show another page at the pane or page leaf at `path`, splitting it to the named edge. Nothing
     * changes when the page may not be shown there: the host itself, a page that shows the host, or
     * a page already drawn somewhere on the screen the strip is on.
     */
    function embedPage(nested: string, path: number[], edge: Edge, page?: string): void {
        const host = at(page);
        if (host === null) return;
        if (!showable(store.current.pages, currentPage().id, host.id, nested)) return;
        const next = embedIn(store.current, host.id, path, edge, nested);
        if (next === store.current) return;
        savePages(next);
    }

    /** Take the page leaf at `path` out of a page's tree, its space going back to its neighbour. */
    function unembedPage(path: number[], page?: string): void {
        const id = at(page)?.id;
        if (id === undefined) return;
        const current = workbench(id);
        const root = unembedIn(current.root, path);
        if (root === current.root) return;
        apply(settleFocus({ ...current, root }), id);
    }

    /** Show one pane alone, with the rest of the workbench put away. */
    function maximisePane(path: number[], page?: string): void {
        forgetTouchedOutside(page);
        apply(maximise(workbench(page), path), page);
    }

    /** Show every pane again. */
    function restorePanes(page?: string): void {
        apply(restore(workbench(page)), page);
    }

    /**
     * Collapse a child of a split to its edge. The maximised pane is given back first when it is the
     * one being folded or sits inside it, since a pane shown alone and collapsed at once is neither.
     */
    function foldPane(path: number[], page?: string): void {
        if (path.length === 0) return;
        const current = workbench(page);
        const folded = fold(current.root, path);
        if (folded === current.root) return;
        const focus = focusedPane(current);
        const inside = focus !== null && path.every((step, index) => focus.path[index] === step);
        forgetTouchedOutside(page);
        apply({ ...(inside ? restore(current) : current), root: folded }, page);
    }

    /** Give a folded child of the split at `path` its share back. */
    function expandChild(path: number[], index: number, page?: string): void {
        change((tree) => expand(tree, path, index), page);
    }

    /** The maximised pane of a page, or null when every pane of it is shown. */
    function focused(page?: string): Focus | null {
        return focusedPane(workbench(page));
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
    function openView(view: ViewId, state?: unknown, page?: string): string {
        return openInto(view, state, false, page);
    }

    /**
     * Show a view in a new pane to the right of the pane holding the instance activated last, which
     * is what a view asked for beside the one being read means. The pane the last one made takes the
     * next one as a tab while it is still open, so opening the editor from five cards is one pane of
     * five tabs. A view already open is activated where it is, exactly as openView activates it, and
     * a maximised pane takes the view itself, since a new pane beside it would be one nobody can see.
     */
    function openBeside(view: ViewId, state?: unknown, page?: string): string {
        return openInto(view, state, true, page);
    }

    /**
     * Open or activate a view, in the pane a view lands in or in a new pane beside that one. The
     * page is the one the reader is in, which is the page shown at the pane holding the keyboard
     * focus and the page on screen when no pane holds it.
     */
    function openInto(view: ViewId, state: unknown, beside: boolean, page?: string): string {
        const held = page === undefined ? touched() : at(page);
        if (held === null) return '';
        const host = held.id;
        const focus = focusedPane(workbench(host));
        const tree = layout(host);
        const into = focus === null ? null : focus.path;
        const inside = into === null ? null : paneAt(tree, into);
        const wanted = stateId(state);
        const existing =
            inside === null ? findView(tree, view, wanted) : findIn(inside, view, wanted);
        if (existing !== null) {
            remembered(existing.id, host);
            change((current) => {
                const stated = state === undefined ? current : restate(current, existing.id, state);
                return activate(expandTo(stated, activePath(stated, existing.id)), existing.id);
            }, host);
            return existing.id;
        }
        const instance = newInstance(view, state ?? {});
        const path = into !== null && inside !== null ? into : activePath(tree, active(host));
        const aside = beside && inside === null;
        const stack = aside ? besidePath(tree, host) : null;
        if (aside) {
            // The pane split off keeps the tab that was being read as the one it sits beside; a tab
            // stacked into that pane keeps the memory the pane was made with.
            const held = lastBeside.get(host);
            const from =
                stack !== null && held !== undefined
                    ? held.from
                    : (paneAt(tree, path)?.active ?? null);
            lastBeside.set(host, { made: instance.id, from });
        }
        remembered(instance.id, host);
        change((current) => {
            const shown = expandTo(current, stack ?? path);
            if (!aside) return openInstance(shown, path, instance);
            return stack === null
                ? splitPane(shown, path, 'row', instance)
                : openInstance(shown, stack, instance);
        }, host);
        return instance.id;
    }

    /**
     * The pane the last openBeside made, while the instance it made is still on the page and not in
     * the pane of the instance it was opened beside: a tab dragged back into the pane being read is
     * beside nothing, so the next view asked for beside it splits again.
     */
    function besidePath(tree: Layout, page: string): number[] | null {
        const held = lastBeside.get(page);
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
        pageOf,
        touchPane,
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
        embedPage,
        unembedPage,
        maximisePane,
        restorePanes,
        foldPane,
        expandChild,
        focused,
        openView,
        openBeside
    };
}
