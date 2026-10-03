// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/workbench/layout, which has no runes in it; this module is the one place an arrangement is
// reactive and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (one tree and the maximised pane, if
// there is one) with a name and the rail button it came from, which page is on screen, and the
// floats beside the pages: each a pane drawn over every page, addressed by its id wherever a page
// id is taken and never listed as a page. Every operation that names a path names the page it
// addresses, and the page on screen is what it means when it names none, so a caller that knows
// nothing of pages reads and writes the one on screen. Every change reaches the store through
// apply() or savePages(), which are also what save, so neither an arrangement nor a page is changed
// without being written down.
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
    adoptFloats as adoptFloatsIn,
    clearPage,
    createAttention,
    createAway,
    createInstances,
    createOpening,
    createShowInFiles,
    createStorage,
    defaultPages,
    dockFloat as dockFloatIn,
    embedPage as embedIn,
    expand,
    findInstance,
    floatPane as floatPaneIn,
    floatsFrom,
    floatTab as floatTabIn,
    focusedPane,
    fold,
    freeFloat as freeFloatIn,
    hostsOf,
    isPage,
    LAYOUT_KEY,
    maximise,
    needsFloats,
    newPage,
    parseLayout,
    parseWorkbench,
    placeFloat as placeFloatIn,
    PREVIOUS_KEY,
    restore,
    returnFloat as returnFloatIn,
    settleFocus,
    showable,
    tabsOf,
    unembedPage as unembedIn,
    writeHost,
    floatHost,
    type DockEdge,
    type Edge,
    type Float,
    type FloatPlace,
    type FloatSpec,
    type Focus,
    type Host,
    type Instance,
    type Instances,
    type KeepRule,
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
import { TERMINAL_VIEW } from '../sessions/terminal/terminal-tabs.ts';
import { parseArrangement } from './navigation/arrangement.ts';
import { resetPlan, type RailSource } from './navigation/pages.ts';
import { t } from '../shared/words/text.ts';

export { LAYOUT_KEY, PREVIOUS_KEY };
export type { OpenOptions };

/** What a reader given the id of a page the list does not hold is answered with. */
const GONE: Workbench = { root: { kind: 'pane', tabs: [], active: '' } };

/** The pages one client is rendering, and their persistence. */
export type LayoutStore = Omit<Instances, 'forgetTabs'> & {
    currentPage: () => Page;
    /** Every page, never a float. */
    pages: () => Page[];
    /** The page with this id; a float's id names no page. */
    pageOf: (id: string) => Page | null;
    /** The floats, in the order they were made. */
    floats: () => Float[];
    /** Every page and every float as a host, pages first: what a walk over every tab needs. */
    hosts: () => Host[];
    /** The page or float with this id. */
    hostOf: (id: string) => Host | null;
    /** The page or float whose tree holds this instance, or null when none does. */
    holding: (id: string) => Host | null;
    touchPane: (page: string) => void;
    workbench: (page?: string) => Workbench;
    layout: (page?: string) => Layout;
    /** The instance the next view opened would join, which is the pane it would open into. */
    openingInstance: () => Instance | null;
    loadLayout: (storage?: Storable, source?: EventTarget) => boolean;
    /** Stop taking the arrangement another browser tab saves, which a load with a source began. */
    stopFollowing: () => void;
    /**
     * Show the page of one rail button, made from its arrangement the first time and switched to
     * after that. It answers whether a page is on screen for the button.
     */
    openRailPage: (key: string, label: string, raw: unknown) => boolean;
    /**
     * Put the first rail page on screen in place of the default page, on a browser that had no
     * saved layout and has changed nothing since. Anywhere else it changes nothing.
     */
    startOnRailPage: (key: string, label: string, raw: unknown, floats: FloatSpec[]) => void;
    /**
     * Whether a browser with no saved layout still waits for the rail list to choose its first
     * page, so the shell draws no page until it has; false once a page was chosen or saved.
     */
    startingFresh: () => boolean;
    /** The rail list came and names no page: the default page stays, and is drawn. */
    keepDefaultPage: (floats: FloatSpec[]) => void;
    /**
     * Take the shipped floats into a layout that was saved before there were floats, once: each
     * tab of a view a shipped float holds moves into it. A layout saved with floats is the
     * reader's own and changes nothing.
     */
    adoptFloats: (floats: FloatSpec[]) => void;
    /** Put a page's pane over every page as a free float. */
    floatPane: (path: number[], page?: string) => void;
    /**
     * Put one tab over every page as a free float whose corner is the point, in window fractions.
     */
    floatTab: (id: string, at: { x: number; y: number }) => void;
    /** Dock a float on an edge, merging its tabs into the float already docked there. */
    dockFloat: (id: string, edge: DockEdge) => void;
    /** Float a docked float again, in the middle of the window. */
    freeFloat: (id: string) => void;
    /** Put a float's tabs back into a page, which is the page on screen unless one is named. */
    returnFloat: (id: string, page?: string) => void;
    /** Move or resize a float; a place that does not fit the window changes nothing. */
    placeFloat: (id: string, place: FloatPlace) => void;
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
     * page with no rail key is left alone. The floats held are replaced by the shipped ones.
     * Answers whether anything changed.
     */
    resetPages: (rail: readonly RailSource[], floats: FloatSpec[]) => boolean;
    /**
     * Show one path in the file browser: the Files tab of the page the reader is in is activated
     * (the panes are restored first when it sits behind a maximised pane), or one is opened there
     * when the page has none, and it is asked to open the folders on the way, select the path and
     * scroll it into view; with `open` a folder is shown open too. A path given with no root is a
     * path of the hub. The returned id names the Files instance.
     */
    showInFiles: (path: string, root?: string, open?: boolean) => string;
    /** Show one folder as a Files tab rooted at it, found again by the folder. */
    showFolderInFiles: (path: string, root?: string) => string;
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

    /**
     * Whether the pages were read from an envelope written before floats and the shipped floats
     * are not taken in yet. Until they are, a save keeps that envelope's form while no float is
     * held, so a reload before they arrive still finds a layout that needs them.
     */
    let pendingFloats = false;

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

    /** The floats, in the order they were made. */
    function floats(): Float[] {
        return store.current.floats;
    }

    /** The page or float with this id: a float is a workbench of its one pane. */
    function hostOf(id: string): Host | null {
        const float = store.current.floats.find((one) => one.id === id);
        return pageOf(id) ?? (float === undefined ? null : floatHost(float));
    }

    /**
     * The page or float an operation addresses: the one its page argument names, the page on screen
     * when it names none, and nothing at all when it names one that is not held. An operation given
     * an id that is gone therefore changes nothing rather than acting on another page.
     */
    function at(page?: string): Host | null {
        return page === undefined ? currentPage() : hostOf(page);
    }

    /** The page or float whose tree holds an instance, or null when none does. */
    function holding(id: string): Host | null {
        return (
            hostsOf(store.current).find((host) => findInstance(host.workbench.root, id) !== null) ??
            null
        );
    }

    /** The whole arrangement of a page or float, and an empty one for an id naming neither. */
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
        pageOf: hostOf,
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

    /**
     * What a pane is left holding when its last tab goes: an empty terminals pane for a Terminal
     * tab and an empty documents pane for a view opened for something (layout/tree.ts keeps at most
     * one of each kind on a page).
     */
    const keepRule: KeepRule = (view) => {
        if (view === TERMINAL_VIEW) return 'terminals';
        return openedRule(view) ? 'documents' : null;
    };

    const attention = createAttention(access, where);
    const instances = createInstances(access, attention, keepRule);
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

    /** Ends the listening a load began for the arrangement other browser tabs save. */
    let unfollow: () => void = () => undefined;

    /**
     * Take the arrangement another browser tab saved under the same key. Its pages replace this
     * tab's; the page this tab shows stays the one shown while it is still a page, since which page
     * a browser tab is looking at is that tab's own. Nothing is written back, so the save that
     * reached this tab does not travel on to the tab it came from. A value that does not parse
     * changes nothing.
     */
    function takeSaved(): void {
        const raw = storage.read(LAYOUT_KEY);
        const saved = raw === null ? null : parseLayout(raw, t('ui.page_default', 1));
        if (saved === null) return;
        const shown = store.current.current;
        fresh = false;
        pendingFloats = needsFloats(raw);
        store.current = {
            pages: saved.pages,
            current: saved.pages.some((page) => page.id === shown) ? shown : saved.current,
            floats: saved.floats
        };
    }

    /**
     * Read the saved arrangement and make it current, falling back to the default when there is
     * none or the saved value fails parseLayout. Returns whether a saved arrangement was restored,
     * which is how a page knows whether it is looking at the default. The default argument is
     * evaluated at the call and not at the import, so a test that never calls this touches no
     * localStorage. A source of the browser's `storage` events (the window) makes this tab follow
     * the arrangement the other browser tabs of the server save; without one it follows none.
     */
    function loadLayout(held: Storable = localStorage, source?: EventTarget): boolean {
        storage.attach(held);
        unfollow();
        unfollow = source === undefined ? () => undefined : storage.follow(source, takeSaved);
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
            pendingFloats = true;
            savePages({ pages: [newPage(first, previous), shown], current: shown.id, floats: [] });
        } else {
            store.current = parsed ?? defaultPages(first);
            fresh = parsed === null;
            pendingFloats = parsed !== null && needsFloats(raw);
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
                ...store.current,
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
    function startOnRailPage(key: string, label: string, raw: unknown, shipped: FloatSpec[]): void {
        if (!fresh) return;
        const next = key === '' ? null : parseArrangement(raw);
        if (next === null) {
            // The first entry names nothing drawable: the default page stays the reader's first.
            keepDefaultPage(shipped);
            return;
        }
        const page = newPage(label, next, key);
        attention.forgetTouched();
        savePages({ pages: [page], current: page.id, floats: floatsFrom(shipped) });
    }

    /** The default page stays the reader's first, beside the shipped floats. */
    function keepDefaultPage(shipped: FloatSpec[]): void {
        if (!fresh) return;
        fresh = false;
        if (shipped.length > 0) savePages({ ...store.current, floats: floatsFrom(shipped) });
    }

    /**
     * Take the shipped floats into pages read from an envelope written before floats. It happens
     * once: the save that follows writes the current envelope, which a later load takes as the
     * reader's own.
     */
    function adoptFloats(shipped: FloatSpec[]): void {
        if (!pendingFloats) return;
        pendingFloats = false;
        savePages(adoptFloatsIn(store.current, shipped));
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
        savePages({ ...store.current, pages: [...store.current.pages, page], current: page.id });
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
            savePages({ ...defaultPages(t('ui.page_default', 1)), floats: store.current.floats });
        } else {
            const next =
                store.current.current === id
                    ? left[Math.min(at, left.length - 1)].id
                    : store.current.current;
            // A page that is gone is shown nowhere: every leaf naming it is taken out, so no tree
            // is left pointing at a page the list no longer holds.
            savePages(clearPage({ pages: left, current: next, floats: store.current.floats }, id));
        }
        instances.forgetTabs(tabsOf(closing.workbench.root));
    }

    /**
     * Make an arrangement a page's or float's and save every page. An id naming neither changes
     * nothing. A float takes one pane: a split is refused, and a pane left with no tab removes it.
     */
    function apply(next: Workbench, page?: string): void {
        const id = at(page)?.id;
        if (id === undefined) return;
        const held = store.current;
        const written = writeHost(held, id, next);
        if (written !== held) savePages(written);
    }

    /** Make a set of pages current and save it. */
    function savePages(next: Pages): void {
        fresh = false;
        if (next.current !== store.current.current) previous = store.current.current;
        store.current = next;
        // A reader who made a float on a layout still waiting for the shipped floats keeps their
        // own.
        if (next.floats.length > 0) pendingFloats = false;
        storage.write(next, pendingFloats);
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
    function resetPages(rail: readonly RailSource[], shipped: FloatSpec[]): boolean {
        const held = store.current;
        const plan = resetPlan(held.pages, rail);
        if (
            plan.rebuilt.length === 0 &&
            plan.removed.length === 0 &&
            held.floats.length === 0 &&
            shipped.length === 0
        ) {
            return false;
        }
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
        const floats = floatsFrom(shipped);
        let next: Pages =
            pages.length === 0
                ? { ...defaultPages(t('ui.page_default', 1)), floats }
                : {
                      pages,
                      current: gone.has(held.current) ? pages[0].id : held.current,
                      floats
                  };
        for (const id of gone) next = clearPage(next, id);
        for (const page of [...plan.rebuilt, ...plan.removed]) attention.forgetPage(page.id);
        for (const float of held.floats) attention.forgetPage(float.id);
        attention.forgetTouched();
        savePages(next);
        instances.forgetTabs([
            ...[...plan.rebuilt, ...plan.removed].flatMap((page) => tabsOf(page.workbench.root)),
            ...held.floats.flatMap((float) => float.pane.tabs)
        ]);
        return true;
    }

    /** Save the pages a float operation answered, when it changed any. */
    function floated(next: Pages): void {
        if (next !== store.current) savePages(next);
    }

    /** The id of the page an argument names, the page on screen for none; undefined for a float. */
    function pageIdOf(page?: string): string | undefined {
        const host = at(page);
        return host !== null && isPage(host) ? host.id : undefined;
    }

    /** Put a page's pane over every page as a free float. */
    function floatPane(path: number[], page?: string): void {
        const id = pageIdOf(page);
        if (id !== undefined) floated(floatPaneIn(store.current, id, path));
    }

    /** Put a float's tabs back into a page, the page on screen unless one is named. */
    function returnFloat(id: string, page?: string): void {
        const to = pageIdOf(page);
        if (to !== undefined) floated(returnFloatIn(store.current, id, to));
    }

    /** Move or resize a float. */
    function placeFloat(id: string, place: FloatPlace): void {
        floated(placeFloatIn(store.current, id, place));
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
        floats,
        hosts: () => hostsOf(store.current),
        hostOf,
        holding,
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
        pinTab: instances.pinTab,
        unpinTab: instances.unpinTab,
        loadLayout,
        stopFollowing: () => {
            unfollow();
            unfollow = () => undefined;
        },
        openRailPage,
        startOnRailPage,
        startingFresh: () => fresh,
        keepDefaultPage,
        adoptFloats,
        floatPane,
        floatTab: (id, point) => floated(floatTabIn(store.current, id, point, keepRule)),
        dockFloat: (id, edge) => floated(dockFloatIn(store.current, id, edge)),
        freeFloat: (id) => floated(freeFloatIn(store.current, id)),
        returnFloat,
        placeFloat,
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
        showFolderInFiles: files.showFolderInFiles,
        registerOpened: (rule) => {
            openedRule = rule;
        },
        resetPage,
        resetPages
    };
}
