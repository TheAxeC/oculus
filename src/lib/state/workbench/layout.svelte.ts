// Layer 2, client state. The store half of the layout: the pages the shell is rendering now, and
// their persistence. The trees themselves, their types and every operation on them are
// state/workbench/layout, which has no runes in it; this module is the one place an arrangement is
// reactive and the one place it is saved.
//
// The saved unit is every page: each one a whole workbench (one tree and the maximised pane, if
// there is one) with a name and the rail button it came from, which page is on screen, and the
// floats beside the pages: each a pane drawn over every page, addressed by its id wherever a page
// id is taken and never listed as a page. The window strip's dock toggles hide the float docked on
// an edge, which the saved unit records; a change that docks a float on a hidden edge, or shows
// another tab in the float there, shows the edge again (`settleHidden` of layout/model.ts).
//
// Every operation that names a path names the page it addresses, and the page on screen is what it
// means when it names none, so a caller that knows nothing of pages reads and writes the one on
// screen. Every change reaches the store through apply() or savePages(), which are also what save,
// so neither an arrangement nor a page is changed without being written down.
//
// What the factory keeps is the reactive page list and the write path over it. Everything a caller
// does to the instances in that list is built beside the factory, one module per concern under
// state/workbench/layout, and is handed the access object below: the tabs on a page, the tabs
// closed last, what the reader last acted in, where a view asked for lands, a view opened clear of
// one instance, the file browser's ask, and the storage. None of them holds an arrangement in a
// rune (the closed-tab list and the armed keep hold only their own lists), so none of them is a
// second place an arrangement can change.

import { item } from '../../data/helpers/guards.ts';
import {
    dockedAt,
    edgeHidden,
    settleHidden,
    shownFloats,
    withHidden,
    type DockEdge
} from './layout/model.ts';
import { createArmedKeeps, type ArmedKeep } from './layout/open/armed-keep.svelte.ts';
import { createRailPages } from './layout/open/float/rail-pages.ts';
import { createReopen, type Reopen } from './layout/tabs/reopen.svelte.ts';
import type { Load } from './layout/saved/load.ts';
import type { UiStore } from './ui.svelte.ts';
import type { HubVocabs } from '../../data/model/index.ts';
import {
    clearPage,
    createAttention,
    createAway,
    createInstances,
    createOpening,
    createShowDeck,
    createShowPlaced,
    createShowInFiles,
    createFloatOps,
    createFolderOps,
    createLoad,
    createStorage,
    defaultBeside,
    defaultPages,
    embedPage as embedIn,
    expand,
    findInstance,
    focusedPane,
    fold,
    hostsOf,
    maximise,
    newPage,
    rebuiltPage,
    resetAll,
    restore,
    settleFocus,
    showable,
    tabsOf,
    unembedPage as unembedIn,
    withoutHeld,
    writeHost,
    floatHost,
    type Away,
    type Builds,
    type DocSource,
    type Edge,
    type Float,
    type FloatOps,
    type FloatSpec,
    type Focus,
    type FolderOps,
    type Host,
    type Instance,
    type Instances,
    type KeepRule,
    type LayoutAccess,
    type Layout,
    type OpenOptions,
    type Opening,
    type ShowDeck,
    type ShowInFiles,
    type Page,
    type Pages,
    type SaveTurn,
    type Touched,
    type PlaceRule,
    type UniqueRule,
    type ViewId,
    type Workbench
} from './layout/index.ts';
import { TERMINAL_VIEW } from '../sessions/terminal/terminal-tabs.ts';
import { parseArrangement } from './navigation/arrangement.ts';
import { arrangedPages, resetPlan, type RailSource } from './navigation/pages.ts';
import { t } from '../shared/words/text.ts';

export type { OpenOptions };

/** How many times an operation is run again on the envelope the host refused its save with. */
const MAX_TURNS = 8;

/** What a reader given the id of a page the list does not hold is answered with. */
const GONE: Workbench = { root: { kind: 'pane', tabs: [], active: '' } };

/** The pages one client is rendering, and their persistence. */
export type LayoutStore = Omit<Instances, 'forgetTabs'> &
    Reopen &
    FloatOps &
    Omit<FolderOps, 'keepClosed'> &
    Pick<Load, 'loadLayout' | 'workspaceOpened' | 'workspaceAnswered' | 'workspaceCarried'> & {
        currentPage: () => Page;
        /** Every page, never a float. */
        pages: () => Page[];
        /** The page with this id; a float's id names no page. */
        pageOf: (id: string) => Page | null;
        /** The floats, in the order they were made. */
        floats: () => Float[];
        /** The floats the window draws: every one but a float docked on a hidden edge. */
        shownFloats: () => Float[];
        /** Whether the float docked on an edge is hidden by its toggle. */
        dockHidden: (edge: DockEdge) => boolean;
        /**
         * Hide the float docked on an edge, or show it again: VS Code's Toggle Primary Side Bar,
         * Panel and Secondary Side Bar. An edge no float is docked on changes nothing.
         */
        toggleDock: (edge: DockEdge) => void;
        /** Every page and every float as a host, pages first: what a walk over every tab needs. */
        hosts: () => Host[];
        /** The page or float with this id. */
        hostOf: (id: string) => Host | null;
        /** The page or float whose tree holds this instance, or null when none does. */
        holding: (id: string) => Host | null;
        touchPane: (page: string) => void;
        /**
         * Whether a copy of this tab can open in a window of its own: a Terminal tab cannot, and
         * neither can an instance of a unique view, which is held once.
         */
        copiesToWindow: (id: string) => boolean;
        workbench: (page?: string) => Workbench;
        layout: (page?: string) => Layout;
        /** The instance the next view opened would join, which is the pane it would open into. */
        openingInstance: () => Instance | null;
        /**
         * Whether the saved arrangement has been read, which a page of the app draws nothing
         * before.
         */
        loaded: () => boolean;
        /**
         * Stop taking the arrangement another browser tab saves, which a load with a source began.
         */
        stopFollowing: () => void;
        /**
         * Show the page of one rail button, made from its arrangement the first time and switched
         * to after that. A unique view the arrangement names is moved into the page from the page
         * or float holding it. It answers whether a page is on screen for the button.
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
         * Give every rail page the documents its source lists that it has not been given: a tab
         * after the page's first tab, recorded so a tab the reader closes is not given again.
         */
        giveDocuments: (sources: readonly DocSource[]) => void;
        /**
         * The id of the page that was on screen before the one on screen now, while that page is
         * still in the list; null on a fresh load and after it was closed. It is not saved.
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
        /** How the Views catalogue opens a view on its own page without covering itself. */
        openAway: Away['openAway'];
        openNextTo: Away['openNextTo'];
        moveAway: Away['moveAway'];
        /** The id of the instance of a view that a page or float holds (see Opening), else null. */
        heldInstance: Opening['heldInstance'];
        paneHolds: Away['paneHolds'];
        /**
         * Say which views are opened for something, which the registry knows and this store does
         * not: where such a view lands is layout/open/landing.ts's rule. Until a rule is registered
         * every view is a tool view.
         */
        registerOpened: (rule: (view: ViewId) => boolean) => void;
        /**
         * Say which views are held once, which the registry knows and this store does not
         * (registration.unique): opening one shows the instance a page or float holds, and a page
         * or float made from the config takes it in. Until a rule is registered no view is unique.
         */
        registerUnique: (rule: UniqueRule) => void;
        /**
         * Say where a view opens the first time, which the registry knows and this store does not
         * (registration.dock): on the left or the bottom edge as a docked float, or in the pane
         * holding Files. Until a rule is registered every view opens where views land.
         */
        registerPlaced: (rule: PlaceRule) => void;
        /**
         * Rebuild one page from a rail button's arrangement: its tabs made fresh, its id and rail
         * key kept, its name the button's words, a unique view it names moved in from the page or
         * float holding it. Answers whether it was rebuilt; an id naming no page or an
         * arrangement that does not parse changes nothing.
         */
        resetPage: (id: string, source: RailSource) => boolean;
        /**
         * Rebuild every saved page a rail button carries the key of from that button's arrangement
         * and remove every saved page carrying a key no button carries (navigation/pages.ts's
         * resetPlan). A page with no rail key keeps its tabs, except a unique view an arrangement
         * names, which moves to the page or float made from it; a workbench keeps every tab. The
         * floats held are replaced by the shipped ones. Answers whether anything changed.
         */
        resetPages: (rail: readonly RailSource[], floats: FloatSpec[]) => boolean;
        /**
         * Show one path in the file browser: the Files tab of the page the reader is in is
         * activated (the panes are restored first when it sits behind a maximised pane), or one is
         * opened there when the page has none, and it is asked to open the folders on the way,
         * select the path and scroll it into view; with `open` a folder is shown open too. The root
         * is the key of the workspace folder the path lies in. The returned id names the Files
         * instance.
         */
        showInFiles: (path: string, root: string, open?: boolean) => string;
        /**
         * Show one file in the file browser as showInFiles does, and open the Timeline section on
         * it, scrolled to the top of the pane. The root is the key of the workspace folder the path
         * lies in.
         */
        showTimeline: ShowInFiles['showTimeline'];
        /** Show one folder as a Files tab rooted at it, found again by the folder. */
        showFolderInFiles: (path: string, root: string) => string;
        /** Show the TeX view: its tab, or a new tab in the pane holding the Files tab. */
        showTexView: () => string;
        /** Show a deck in a Present tab, beside the tab being read when asked. */
        showDeck: ShowDeck['showDeck'];
        /**
         * The keep armed for the preview tab a press just opened, or null
         * (layout/open/armed-keep.svelte.ts): while it is armed the pane showing the tab takes the
         * next press as a keep.
         */
        armedKeep: () => ArmedKeep | null;
        /** Arm the keep for a preview tab a press made at `pressedAt` opened, for an owner. */
        armKeep: (id: string, owner: string, pressedAt: number) => void;
        /** End the armed keep, or only one an owner armed. */
        disarmKeep: (owner?: string) => void;
        /**
         * The kept tab that takes the keyboard once its pane draws it
         * (layout/open/armed-keep.svelte.ts).
         */
        focusAsked: () => string | null;
        /** Ask that a tab a double click kept take the keyboard. */
        askFocus: (id: string) => void;
        /** End the ask for one tab: its pane gave it the keyboard. */
        focusGiven: (id: string) => void;
    };

/**
 * What the app gives the layout: the host's turn for a save of the arrangement. A page in a browser
 * is given none, and then every save is written directly.
 */
export type LayoutDesktop = { turn: SaveTurn };

/**
 * The layout store. `hubs` answers the collections the hubs of the workspace list, which decide
 * the tabs a pane draws and so which tab is the active one (layout/tabs/left-out.ts).
 */
export function createLayout(
    ui: UiStore,
    desktop?: LayoutDesktop,
    hubs?: () => HubVocabs | null
): LayoutStore {
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

    /** Whether the saved arrangement has been read, so a page of the app knows what it draws. */
    let loaded = $state(false);

    /** Where apply() saves, once loadLayout has named it. Nothing is saved before that. */
    const storage = createStorage(desktop?.turn);

    /**
     * The name of the store operation being run, which the record of layout writes names as the
     * call that wrote. Every operation is synchronous, so this is the operation a caller invoked
     * for as long as a save inside it runs.
     */
    let writing = '';

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
     * The floats, in the order they were made. A float placed in a window is drawn by the window
     * that holds it: the host's in the app, a browser tab opened for it in a browser
     * (shell/window/browser-windows.svelte.ts takes a float back whose tab is gone).
     */
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

    /** Which views are held once, as the registry says once it is registered. */
    let uniqueRule: UniqueRule = () => false;

    /** Where a view opens the first time, as the registry says once it is registered. */
    let placeRule: PlaceRule = () => null;

    /**
     * What a page's pane that stays is left as when its last tab goes: an empty terminals pane for
     * a Terminal tab and an empty documents pane for any other view. Which panes stay is
     * layout/tree.ts's rule: a pane its page's arrangement defined and a locked pane stay, and a
     * pane added while the page was used goes.
     */
    const keepRule: KeepRule = (view) => (view === TERMINAL_VIEW ? 'terminals' : 'documents');

    /** What a page or float made from the config is built by: unique views and pane cleaning. */
    const builds: Builds = { unique: (view) => uniqueRule(view), keep: keepRule };

    const attention = createAttention(access, where);
    const instances = createInstances(access, attention, keepRule, hubs);
    const reopen = createReopen(access, attention, instances.activateInstance);
    const opening = createOpening(
        access,
        attention,
        instances.keepPreview,
        (view) => openedRule(view),
        (view) => uniqueRule(view)
    );
    const files = createShowInFiles(access, attention, opening.openView, opening.openInPane);
    const decks = createShowDeck(opening.openView, opening.openBeside);
    const keeps = createArmedKeeps((id) => {
        const host = holding(id);
        return host === null ? null : (findInstance(host.workbench.root, id)?.instance ?? null);
    });
    const away = createAway(
        access,
        attention,
        opening.openView,
        instances.transferInstance,
        instances.splitInstance,
        (view) => uniqueRule(view)
    );
    const floatOps = createFloatOps(access, keepRule);
    const placed = createShowPlaced(access, attention, opening, floatOps, () => placeRule);
    const folderOps = createFolderOps(access, builds, {
        forgetTouched: attention.forgetTouched,
        forgetTabs: instances.forgetTabs,
        forgetPage: attention.forgetPage
    });
    const load = createLoad(access, storage, {
        replace: (pages) => {
            store.current = pages;
        },
        fresh: () => fresh,
        setFresh: (value) => {
            fresh = value;
        },
        clearAttention: attention.clear,
        setLoaded: () => {
            loaded = true;
        }
    });

    const rail = createRailPages(access, {
        builds,
        keepRule,
        forgetTouched: attention.forgetTouched,
        switchPage,
        fresh: () => fresh,
        settleFresh: () => {
            fresh = false;
        }
    });

    /** The page on screen before the current one, while it is still one of the pages. */
    function previousPage(): string | null {
        const held = previous;
        if (held === null || held === store.current.current) return null;
        return store.current.pages.some((page) => page.id === held) ? held : null;
    }

    /**
     * A new page, on the default workbench, made current. A unique view a page or float holds is
     * left out of it, so the new page is one empty pane then.
     */
    function openPage(label: string): void {
        addPage(withoutHeld(store.current, newPage(label), builds));
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
     * a workbench with no page to render is nothing at all, its pane empty when a float holds the
     * unique view it starts on. Every tab of the page's own tree is forgotten as its own close
     * would forget it, after a folder page's layout and its tabs' states are kept by its folder; a
     * page one of its leaves shows is still in the list, so the tabs of that page are not the
     * closed page's and keep what they hold.
     */
    function closePage(id: string): void {
        const held = store.current.pages;
        const at = held.findIndex((page) => page.id === id);
        const closing = item(held, at);
        if (closing === undefined) return;
        attention.forgetPage(id);
        const left = held.filter((page) => page.id !== id);
        const kept = folderOps.keepClosed(store.current, closing);
        if (left.length === 0) {
            savePages({ ...kept, ...defaultBeside(t('ui.page_default', 1), kept.floats, builds) });
        } else {
            const next =
                store.current.current === id
                    ? left[Math.min(at, left.length - 1)].id
                    : store.current.current;
            // A page that is gone is shown nowhere: every leaf naming it is taken out, so no tree
            // is left pointing at a page the list no longer holds.
            savePages(clearPage({ ...kept, pages: left, current: next }, id));
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

    /**
     * Make a set of pages current and save it. A hidden edge whose docked float the change made new
     * or moved to another tab is shown again first.
     */
    function savePages(given: Pages): void {
        const next = settleHidden(store.current, given);
        fresh = false;
        if (next.current !== store.current.current) previous = store.current.current;
        store.current = next;
        storage.write(next, writing);
    }

    /**
     * Show the edge whose hidden docked float holds the tab `id`, which a view opened or a tab
     * activated there asks for even when the tab was already the float's active one. Answers `id`.
     */
    function revealed(id: string): string {
        const float = store.current.floats.find((one) =>
            one.pane.tabs.some((tab) => tab.id === id)
        );
        const place = float?.place;
        if (place?.kind === 'dock' && edgeHidden(store.current, place.edge)) {
            savePages(withHidden(store.current, place.edge, false));
        }
        return id;
    }

    function toggleDock(edge: DockEdge): void {
        if (dockedAt(store.current, edge) === undefined) return;
        savePages(withHidden(store.current, edge, !edgeHidden(store.current, edge)));
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
     * button's words as its name. What its old tabs held is forgotten as closing them would, and a
     * unique view the arrangement names is moved in from the page or float holding it.
     */
    function resetPage(id: string, source: RailSource): boolean {
        const found = pageOf(id);
        const next = parseArrangement(source.node);
        if (found === null || next === null) return false;
        attention.forgetPage(id);
        attention.forgetTouched();
        savePages(rebuiltPage(store.current, id, source.label, next, builds));
        instances.forgetTabs(tabsOf(found.workbench.root));
        return true;
    }

    /**
     * Every rail page made again from its button's arrangement, and every page of a button that is
     * gone removed, in one save. A removed page is shown nowhere afterwards, as closing it leaves
     * it, and the page on screen moves to the first page left when it was one of them. The pages
     * are made first, then the floats, and a unique view an arrangement or a float names is moved
     * in from a page that is kept; the first place to name it keeps it.
     */
    function resetPages(rail: readonly RailSource[], shipped: FloatSpec[]): boolean {
        const held = store.current;
        const plan = resetPlan(held.pages, rail);
        const changes = plan.rebuilt.length + plan.removed.length + held.floats.length;
        if (changes + shipped.length === 0) return false;
        const arranged = arrangedPages(plan.rebuilt, rail);
        const next = resetAll(held, plan, arranged, shipped, t('ui.page_default', 1), builds);
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

    /**
     * Whether a copy of this tab can open in a window of its own: not a Terminal tab, and not an
     * instance of a unique view, which no opener and no build makes a second instance of.
     */
    function copiesToWindow(id: string): boolean {
        const view = instances.instanceView(id);
        return view !== TERMINAL_VIEW && !(view !== undefined && uniqueRule(view));
    }

    /**
     * The instance the next view opened without a page named would join: the active instance of the
     * page the reader is in. It is the one pane in the window a view opens into, whether that
     * page is the one on screen or one drawn inside it.
     */
    function openingInstance(): Instance | null {
        return instances.activeInstance(attention.touched().id);
    }

    /**
     * Run every operation under its own name, so a save inside it is recorded as written by that
     * operation. An operation that calls another keeps the name of the one the caller invoked.
     */
    function named<T extends Record<string, unknown>>(operations: T): T {
        const wrapped = Object.entries(operations).map(([name, operation]) => {
            if (typeof operation !== 'function') return [name, operation];
            const run = operation as (...args: unknown[]) => unknown;
            return [
                name,
                (...args: unknown[]): unknown => {
                    if (writing !== '') return run(...args);
                    writing = name;
                    try {
                        let answer = run(...args);
                        // The app's host refused a save made from an envelope another window had
                        // moved on from; the load took the envelope it holds, and the operation
                        // runs again on it.
                        for (let turn = 0; turn < MAX_TURNS && load.retake(); turn++) {
                            answer = run(...args);
                        }
                        return answer;
                    } finally {
                        writing = '';
                    }
                }
            ];
        });
        return Object.fromEntries(wrapped) as T;
    }

    return named({
        currentPage,
        pages,
        pageOf,
        floats,
        shownFloats: () => shownFloats(store.current),
        dockHidden: (edge) => edgeHidden(store.current, edge),
        toggleDock,
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
        copiesToWindow,
        restateInstance: instances.restateInstance,
        pinInstance: instances.pinInstance,
        pointInstance: instances.pointInstance,
        unpinInstance: instances.unpinInstance,
        keepPreview: instances.keepPreview,
        pinTab: instances.pinTab,
        unpinTab: instances.unpinTab,
        ...reopen,
        loadLayout: load.loadLayout,
        workspaceOpened: load.workspaceOpened,
        workspaceAnswered: load.workspaceAnswered,
        workspaceCarried: load.workspaceCarried,
        stopFollowing: load.stopFollowing,
        loaded: () => loaded,
        openRailPage: rail.openRailPage,
        startOnRailPage: rail.startOnRailPage,
        startingFresh: () => fresh,
        keepDefaultPage: rail.keepDefaultPage,
        giveDocuments: rail.giveDocuments,
        ...floatOps,
        openFolderPage: folderOps.openFolderPage,
        resetFolderPage: folderOps.resetFolderPage,
        folderPage: folderOps.folderPage,
        keptWorkbenches: folderOps.keptWorkbenches,
        forgetKept: folderOps.forgetKept,
        copyTabToWindow: (id, bounds) =>
            copiesToWindow(id) ? floatOps.copyTabToWindow(id, bounds) : null,
        previousPage,
        openPage,
        switchPage,
        renamePage,
        closePage,
        apply,
        change,
        activateInstance: (id, page) => {
            instances.activateInstance(id, page);
            revealed(id);
        },
        closeInstancesOfView: instances.closeInstancesOfView,
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
        openView: (view, state, page, options) =>
            revealed(placed.openView(view, state, page, options)),
        openBeside: opening.openBeside,
        openInPane: opening.openInPane,
        openAway: away.openAway,
        openNextTo: away.openNextTo,
        moveAway: away.moveAway,
        heldInstance: opening.heldInstance,
        paneHolds: away.paneHolds,
        showInFiles: files.showInFiles,
        showTimeline: files.showTimeline,
        showFolderInFiles: files.showFolderInFiles,
        showTexView: files.showTexView,
        showDeck: decks.showDeck,
        armedKeep: keeps.armed,
        armKeep: keeps.arm,
        disarmKeep: keeps.disarm,
        focusAsked: keeps.focusAsked,
        askFocus: keeps.askFocus,
        focusGiven: keeps.focusGiven,
        registerOpened: (rule) => {
            openedRule = rule;
        },
        registerUnique: (rule) => {
            uniqueRule = rule;
        },
        registerPlaced: (rule) => {
            placeRule = rule;
        },
        resetPage,
        resetPages
    });
}
