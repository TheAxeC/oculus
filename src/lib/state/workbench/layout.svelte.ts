// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/workbench/layout, which has no runes in it; this module is the one place an arrangement is
// reactive and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (one tree and the maximised pane, if
// there is one) with a name and the rail button it came from, and which page is on screen. Every
// operation that names a path names the page it addresses, and the page on screen is what it means
// when it names none, so a caller that knows nothing of pages reads and writes the one on screen.
// Every change reaches the store through apply() or savePages(), which are also what save, so
// neither an arrangement nor a page is changed without being written down.
//
// What the factory keeps is the reactive page list and the write path over it. Everything a caller
// does to the instances in that list is built beside the factory, one module per concern under
// state/workbench/layout, and is handed the access object below: the tabs on a page, what the
// reader last acted in, where a view asked for lands, a view opened clear of one instance, the file
// browser's ask, and the storage. None of them holds a rune, so none of them is a second place an
// arrangement can change.

import { item } from '../../data/helpers/guards.ts';
import type { UiStore } from './ui.svelte.ts';
import {
    clearPage,
    createAttention,
    createAway,
    createInstances,
    createOpening,
    createShowInFiles,
    createStorage,
    defaultPages,
    embedPage as embedIn,
    expand,
    findInstance,
    focusedPane,
    fold,
    LAYOUT_KEY,
    maximise,
    newPage,
    parseLayout,
    parseWorkbench,
    PREVIOUS_KEY,
    restore,
    settleFocus,
    showable,
    tabsOf,
    unembedPage as unembedIn,
    type Edge,
    type Focus,
    type Instance,
    type LayoutAccess,
    type Layout,
    type OpenOptions,
    type Opening,
    type Page,
    type Pages,
    type Storable,
    type Touched,
    type ViewId,
    type Workbench
} from './layout/index.ts';
import { parseArrangement } from './navigation/arrangement.ts';
import { resetPlan, type RailSource } from './navigation/pages.ts';
import { t } from '../shared/words/text.ts';

export { LAYOUT_KEY, PREVIOUS_KEY };
export type { OpenOptions };

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
    /** The instance the next view opened would join, which is the pane it would open into. */
    openingInstance: () => Instance | null;
    instanceLayoutState: (id: string) => unknown;
    /** The view one instance shows, from whichever page's tree holds it, or undefined for none. */
    instanceView: (id: string) => ViewId | undefined;
    restateInstance: (id: string, state: unknown) => void;
    pinInstance: (id: string, session: string, label: string) => void;
    unpinInstance: (id: string) => void;
    /**
     * Keep a preview tab, which is what a double click, a keystroke, a drag and a split do to one.
     */
    keepPreview: (id: string) => void;
    loadLayout: (storage?: Storable) => boolean;
    /**
     * Show the page of one rail button, made from its arrangement the first time and switched to
     * after that. It answers whether a page is on screen for the button.
     */
    openRailPage: (key: string, label: string, raw: unknown) => boolean;
    /**
     * Put the first rail page on screen in place of the default page, on a browser that had no
     * saved layout and has changed nothing since. Anywhere else it changes nothing.
     */
    startOnRailPage: (key: string, label: string, raw: unknown) => void;
    /**
     * Whether a browser with no saved layout still waits for the rail list to choose its first
     * page, so the shell draws no page until it has; false once a page was chosen or saved.
     */
    startingFresh: () => boolean;
    /** The rail list came and names no page: the default page stays, and is drawn. */
    keepDefaultPage: () => void;
    /**
     * The id of the page that was on screen before the one on screen now, while that page is still
     * in the list; null on a fresh load and after it was closed. It is not saved.
     */
    previousPage: () => string | null;
    openPage: (label: string) => void;
    switchPage: (id: string) => void;
    renamePage: (id: string, label: string) => void;
    closePage: (id: string) => void;
    apply: (next: Workbench, page?: string) => void;
    change: (edit: (tree: Layout) => Layout, page?: string) => void;
    activateInstance: (id: string, page?: string) => void;
    closeInstancesOfView: (view: ViewId) => void;
    closeRecord: (view: ViewId, id: string) => void;
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
    openView: Opening['openView'];
    openBeside: Opening['openBeside'];
    openInPane: Opening['openInPane'];
    /**
     * Open a view on a page in a pane that does not hold one instance, which is how the Views
     * catalogue opens a view on its own page without covering itself.
     */
    openAway: (view: ViewId, state: unknown, page: string, avoid: string) => string;
    /** Open a view on a page in a new pane beside the pane holding one instance. */
    openNextTo: (view: ViewId, state: unknown, page: string, beside: string) => string;
    /** Whether the pane at a path of a page holds one instance. */
    paneHolds: (path: number[], id: string, page: string) => boolean;
    /**
     * Say which views are opened for something, which the registry knows and this store does not:
     * where such a view lands is layout/open/landing.ts's rule. Until a rule is registered every
     * view is a tool view.
     */
    registerOpened: (rule: (view: ViewId) => boolean) => void;
    /**
     * Rebuild one page from a rail button's arrangement: its tabs made fresh, its id and rail key
     * kept, its name the button's words. Answers whether it was rebuilt; an id naming no page or an
     * arrangement that does not parse changes nothing.
     */
    resetPage: (id: string, source: RailSource) => boolean;
    /**
     * Rebuild every saved page a rail button carries the key of from that button's arrangement and
     * remove every saved page carrying a key no button carries (navigation/pages.ts's resetPlan). A
     * page with no rail key is left alone. Answers whether anything changed.
     */
    resetPages: (rail: readonly RailSource[]) => boolean;
    /**
     * Show one path in the file browser: the Files tab of the page the reader is in is activated
     * (the panes are restored first when it sits behind a maximised pane), or one is opened there
     * when the page has none, and it is asked to open the folders on the way, select the path and
     * scroll it into view. A path given with no root is a path of the hub. The returned id names
     * the Files instance.
     */
    showInFiles: (path: string, root?: string) => string;
};

export function createLayout(ui: UiStore): LayoutStore {
    /**
     * The pages, and which of them is on screen. The label of the page this starts on is empty
     * because the catalog is not installed when this module is evaluated; loadLayout names it, and
     * a page carrying no name is called by its position, which is the one moment such a page is on
     * screen.
     */
    const store: { current: Pages } = $state({ current: defaultPages('') });

    /**
     * Whether the pages are the default a browser with no saved layout was given and nothing has
     * changed them since. It is state, so a caller that asks while the rail list is still on its
     * way asks again once loadLayout has run.
     */
    let fresh = $state(false);

    /** The page on screen before the current one, which previousPage answers while it is there. */
    let previous: string | null = $state(null);

    /** Where apply() saves, once loadLayout has named it. Nothing is saved before that. */
    const storage = createStorage();

    // Everything below stays in the factory, which owns the arrangement as a whole: the page list
    // and what is on screen, the write path every change goes through, and the operations that
    // rearrange a page's panes. The rune is declared here, and these are the readers and writers of
    // it that a reader's action reaches directly. Per-instance work is in state/workbench/layout/,
    // whose modules ask the same write path through the access object rather than holding the
    // state.

    /** The page on screen, or the first one when the current id names none. */
    function currentPage(): Page {
        const held = store.current;
        return held.pages.find((page) => page.id === held.current) ?? held.pages[0];
    }

    /** Every page, in the order the Pages view lists them. */
    function pages(): Page[] {
        return store.current.pages;
    }

    /** The page with this id, or null when the list holds none. */
    function pageOf(id: string): Page | null {
        return store.current.pages.find((page) => page.id === id) ?? null;
    }

    /**
     * The page an operation addresses: the one its page argument names, the page on screen when it
     * names none, and nothing at all when it names a page the list does not hold. An operation
     * given an id of a page that is gone therefore changes nothing rather than acting on another
     * page.
     */
    function at(page?: string): Page | null {
        return page === undefined ? currentPage() : pageOf(page);
    }

    /** The page whose tree holds an instance, or null when no page does. */
    function holding(id: string): Page | null {
        return (
            store.current.pages.find((page) => findInstance(page.workbench.root, id) !== null) ??
            null
        );
    }

    /** The whole arrangement of a page, and an empty one for an id naming no page. */
    function workbench(page?: string): Workbench {
        return at(page)?.workbench ?? GONE;
    }

    /** The tree of a page. */
    function layout(page?: string): Layout {
        return workbench(page).root;
    }

    /** What every part built beside this factory reads and writes the pages through. */
    const access: LayoutAccess = {
        held: () => store.current,
        save: savePages,
        currentPage,
        pageOf,
        at,
        holding,
        workbench,
        layout,
        apply,
        change,
        restorePanes,
        ui
    };

    /**
     * Where the reader is, held as a rune so what is drawn from it redraws: a press that moves the
     * reader from one pane to another changes no tree, and the mark saying where a view opens has
     * nothing else to follow.
     */
    const where: Touched = $state({ page: null });

    /** Which views are opened for something, as the registry says once it is registered. */
    let openedRule: (view: ViewId) => boolean = () => false;

    const attention = createAttention(access, where);
    const instances = createInstances(access, attention);
    const opening = createOpening(access, attention, instances.keepPreview, (view) =>
        openedRule(view)
    );
    const files = createShowInFiles(access, attention, opening.openView);
    const away = createAway(
        access,
        attention,
        opening.openView,
        instances.transferInstance,
        instances.splitInstance
    );

    /**
     * Read the saved arrangement and make it current, falling back to the default when there is
     * none or the saved value fails parseLayout. Returns whether a saved arrangement was restored,
     * which is how a page knows whether it is looking at the default. The default argument is
     * evaluated at the call and not at the import, so a test that never calls this touches no
     * localStorage.
     */
    function loadLayout(held: Storable = localStorage): boolean {
        storage.attach(held);
        const first = t('ui.page_default', 1);
        const raw = storage.read(LAYOUT_KEY);
        const parsed = raw === null ? null : parseLayout(raw, first);
        const previous = parseWorkbench(storage.read(PREVIOUS_KEY));
        attention.clear();
        // A browser that ran before pages holds one workbench, and holds the user's own arrangement
        // beside it when the rail control pages retired had put the sessions arrangement on screen.
        // Both are kept: the user's own becomes page 1 and what was on screen becomes page 2, so
        // the control's restore is not needed to reach either of them.
        if (parsed !== null && previous !== null && parseWorkbench(raw) !== null) {
            const shown = newPage(t('ui.page_sessions'), parsed.pages[0].workbench);
            // Written at once: the version 2 envelope under LAYOUT_KEY still holds only what was on
            // screen, so a reload before the next change would lose the page the held one became.
            savePages({ pages: [newPage(first, previous), shown], current: shown.id });
        } else {
            store.current = parsed ?? defaultPages(first);
            fresh = parsed === null;
        }
        if (previous !== null) storage.remember(PREVIOUS_KEY, '');
        return parsed !== null;
    }

    /**
     * The page of the rail button whose arrangement key is `key`, made current. The page that
     * carries the key is the one the reader arranged and is switched to as it is; with none, a page
     * no button has taken yet whose name is the button's label becomes the button's page, which is
     * how a page opened by name before the rail had buttons is kept; with neither, the page is made
     * from the arrangement, named with the label. An empty key, or an arrangement that does not
     * parse when a page has to be made from it, changes nothing and says so.
     */
    function openRailPage(key: string, label: string, raw: unknown): boolean {
        if (key === '') return false;
        const held = store.current.pages;
        const found = held.find((page) => page.rail === key);
        if (found !== undefined) {
            switchPage(found.id);
            return true;
        }
        const named = held.find((page) => page.rail === undefined && page.label === label);
        if (named !== undefined) {
            attention.forgetTouched();
            savePages({
                pages: held.map((page) => (page.id === named.id ? { ...page, rail: key } : page)),
                current: named.id
            });
            return true;
        }
        const next = parseArrangement(raw);
        if (next === null) return false;
        attention.forgetTouched();
        addPage(newPage(label, next, key));
        return true;
    }

    /**
     * The first rail page as the one page of a browser that had no saved layout: made from its
     * arrangement in place of the default page, so the reader starts on a page a button owns and
     * digit 1 shows it again. Once any change was saved the pages are the reader's and stay.
     */
    function startOnRailPage(key: string, label: string, raw: unknown): void {
        if (!fresh) return;
        const next = key === '' ? null : parseArrangement(raw);
        if (next === null) {
            // The first entry names nothing drawable: the default page stays the reader's first.
            fresh = false;
            return;
        }
        const page = newPage(label, next, key);
        attention.forgetTouched();
        savePages({ pages: [page], current: page.id });
    }

    /** The page on screen before the current one, while it is still one of the pages. */
    function previousPage(): string | null {
        const held = previous;
        if (held === null || held === store.current.current) return null;
        return store.current.pages.some((page) => page.id === held) ? held : null;
    }

    /** A new page, on the default workbench, made current. */
    function openPage(label: string): void {
        addPage(newPage(label));
    }

    /** Put a page at the end of the page list and show it. */
    function addPage(page: Page): void {
        savePages({ pages: [...store.current.pages, page], current: page.id });
    }

    /** Show a page. A page id naming none changes nothing. */
    function switchPage(id: string): void {
        if (!store.current.pages.some((page) => page.id === id)) return;
        // The pane the reader was in belonged to the page that was on screen, so a view opened next
        // lands in the page switched to until a pane of this one is pressed.
        attention.forgetTouched();
        savePages({ ...store.current, current: id });
    }

    /** Give a page another name. */
    function renamePage(id: string, label: string): void {
        savePages({
            ...store.current,
            pages: store.current.pages.map((page) => (page.id === id ? { ...page, label } : page))
        });
    }

    /**
     * Close a page, with every tab on it. The page after it becomes current, or the one before it
     * when it was the last in the list; closing the only page leaves one fresh default page, since
     * a workbench with no page to render is nothing at all. Every tab of the page's own tree is
     * forgotten as its own close would forget it; a page one of its leaves shows is still in the
     * list, so the tabs of that page are not the closed page's and keep what they hold.
     */
    function closePage(id: string): void {
        const held = store.current.pages;
        const at = held.findIndex((page) => page.id === id);
        const closing = item(held, at);
        if (closing === undefined) return;
        attention.forgetPage(id);
        const left = held.filter((page) => page.id !== id);
        if (left.length === 0) {
            savePages(defaultPages(t('ui.page_default', 1)));
        } else {
            const next =
                store.current.current === id
                    ? left[Math.min(at, left.length - 1)].id
                    : store.current.current;
            // A page that is gone is shown nowhere: every leaf naming it is taken out, so no tree
            // is left pointing at a page the list no longer holds.
            savePages(clearPage({ pages: left, current: next }, id));
        }
        instances.forgetTabs(tabsOf(closing.workbench.root));
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
        fresh = false;
        if (next.current !== store.current.current) previous = store.current.current;
        store.current = next;
        storage.write(next);
    }

    /** Apply an operation to a page's tree, which is how every tree edit reaches the store. */
    function change(edit: (tree: Layout) => Layout, page?: string): void {
        const current = workbench(page);
        apply({ ...current, root: edit(current.root) }, page);
    }

    /**
     * Show another page at the pane or page leaf at `path`, splitting it to the named edge. Nothing
     * changes when the page may not be shown there: the host itself, a page that shows the host, or
     * a page already drawn somewhere on the screen.
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
        attention.forgetTouchedOutside(page);
        apply(maximise(workbench(page), path), page);
    }

    /** Show every pane again. */
    function restorePanes(page?: string): void {
        apply(restore(workbench(page)), page);
    }

    /**
     * Collapse a child of a split to its edge. The maximised pane is given back first when it is
     * the one being folded or sits inside it, since a pane shown alone and collapsed at once is
     * neither.
     */
    function foldPane(path: number[], page?: string): void {
        if (path.length === 0) return;
        const current = workbench(page);
        const folded = fold(current.root, path);
        if (folded === current.root) return;
        const focus = focusedPane(current);
        const inside = focus !== null && path.every((step, index) => focus.path[index] === step);
        attention.forgetTouchedOutside(page);
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
     * One page made again from a rail button's arrangement: fresh instances, the id kept so a page
     * showing it keeps showing it, the rail key kept so the button still reaches it, and the
     * button's words as its name. What its old tabs held is forgotten as closing them would.
     */
    function resetPage(id: string, source: RailSource): boolean {
        const found = pageOf(id);
        const next = parseArrangement(source.node);
        if (found === null || next === null) return false;
        attention.forgetPage(id);
        attention.forgetTouched();
        savePages({
            ...store.current,
            pages: store.current.pages.map((page) =>
                page.id === id ? { ...page, label: source.label, workbench: next } : page
            )
        });
        instances.forgetTabs(tabsOf(found.workbench.root));
        return true;
    }

    /**
     * Every rail page made again from its button's arrangement, and every page of a button that is
     * gone removed, in one save. A removed page is shown nowhere afterwards, as closing it leaves
     * it, and the page on screen moves to the first page left when it was one of them.
     */
    function resetPages(rail: readonly RailSource[]): boolean {
        const held = store.current;
        const plan = resetPlan(held.pages, rail);
        if (plan.rebuilt.length === 0 && plan.removed.length === 0) return false;
        const gone = new Set(plan.removed.map((page) => page.id));
        const pages = held.pages.flatMap((page): Page[] => {
            if (gone.has(page.id)) return [];
            const source = rail.find((entry) => entry.page === page.rail);
            const made = source === undefined ? null : parseArrangement(source.node);
            if (!plan.rebuilt.includes(page) || source === undefined || made === null) {
                return [page];
            }
            return [{ ...page, label: source.label, workbench: made }];
        });
        let next: Pages =
            pages.length === 0
                ? defaultPages(t('ui.page_default', 1))
                : {
                      pages,
                      current: gone.has(held.current) ? pages[0].id : held.current
                  };
        for (const id of gone) next = clearPage(next, id);
        for (const page of [...plan.rebuilt, ...plan.removed]) attention.forgetPage(page.id);
        attention.forgetTouched();
        savePages(next);
        instances.forgetTabs(
            [...plan.rebuilt, ...plan.removed].flatMap((page) => tabsOf(page.workbench.root))
        );
        return true;
    }

    /**
     * The instance the next view opened without a page named would join: the active instance of the
     * page the reader is in. It is the one pane in the window a view opens into, whether that
     * page is the one on screen or one drawn inside it.
     */
    function openingInstance(): Instance | null {
        return instances.activeInstance(attention.touched().id);
    }

    return {
        currentPage,
        pages,
        pageOf,
        touchPane: attention.touchPane,
        workbench,
        layout,
        activeInstance: instances.activeInstance,
        openingInstance,
        instanceLayoutState: instances.instanceLayoutState,
        instanceView: instances.instanceView,
        restateInstance: instances.restateInstance,
        pinInstance: instances.pinInstance,
        unpinInstance: instances.unpinInstance,
        keepPreview: instances.keepPreview,
        loadLayout,
        openRailPage,
        startOnRailPage,
        startingFresh: () => fresh,
        keepDefaultPage: () => {
            fresh = false;
        },
        previousPage,
        openPage,
        switchPage,
        renamePage,
        closePage,
        apply,
        change,
        activateInstance: instances.activateInstance,
        closeInstancesOfView: instances.closeInstancesOfView,
        closeRecord: instances.closeRecord,
        moveInstanceToPage: instances.moveInstanceToPage,
        closeInstance: instances.closeInstance,
        closePane: instances.closePane,
        transferInstance: instances.transferInstance,
        splitInstance: instances.splitInstance,
        embedPage,
        unembedPage,
        maximisePane,
        restorePanes,
        foldPane,
        expandChild,
        focused,
        openView: opening.openView,
        openBeside: opening.openBeside,
        openInPane: opening.openInPane,
        openAway: away.openAway,
        openNextTo: away.openNextTo,
        paneHolds: away.paneHolds,
        showInFiles: files.showInFiles,
        registerOpened: (rule) => {
            openedRule = rule;
        },
        resetPage,
        resetPages
    };
}
