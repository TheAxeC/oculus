// Layer 2, client state. Layout types, constants, defaults and page operations live here because
// changes to the model should not involve tree or workbench algorithms.

import { nameOf } from '../../../data/helpers/files/paths.ts';
import { docPaths, newInstance } from './instance.ts';

/**
 * The view a pane's tab mounts. The view registry is its vocabulary. A saved layout may name a
 * view the registry does not hold, from an older or a newer version of the app, and the shell shows
 * an empty pane for it rather than refusing the whole arrangement.
 */
export type ViewId = string;

/**
 * One tab: the view it mounts and the state that view was opened with. `preview` marks the tab a
 * single click opened, which the next single click in the same pane replaces; a double click, a
 * keystroke in its editor, a drag or a split keeps it, which is the flag going away. `pinned` marks
 * a tab kept at the start of its pane's strip: Close Others and Close All leave it open, and a tab
 * is never both pinned and a preview.
 */
export type Instance = {
    id: string;
    view: ViewId;
    state: unknown;
    preview?: true;
    pinned?: true;
};

/**
 * A split and its children. `folded` holds the indexes of the children collapsed to the split's
 * edge: a folded child keeps its share in `sizes`, so expanding it gives back the width it had, and
 * one child of a split is always left open.
 */
export type Split = {
    kind: 'split';
    dir: 'row' | 'col';
    sizes: number[];
    children: Layout[];
    folded?: number[];
};

/**
 * The kind of view a kept empty pane stays for. An empty pane without `keeps` is the documents
 * pane, where a view opened for something lands; `terminals` marks the pane a Terminal tab left.
 */
export type Keeps = 'terminals';

/**
 * One pane of tabs. The pinned tabs come first, in their order, then the rest. `recent` holds the
 * ids of the other tabs the pane showed, the one shown last first, which is where closing the
 * active tab goes next; a tab never shown is not in it. `keeps` is only ever set on a pane with no
 * tab. `locked` marks a pane that a view opened for something does not land in; it stays when its
 * last tab goes, and a tab opened from its own strip or dragged onto it still goes in. `added`
 * marks a pane made while its page was used, which the page's arrangement did not define: it goes
 * with its last tab, where a pane the arrangement defined stays, empty. `documents` marks the pane
 * of a workbench, a page with a `folder`, that a view opened from the page lands in first, whatever
 * the pane holds. A pane in a float never carries `added` or `documents`.
 */
export type Pane = {
    kind: 'pane';
    tabs: Instance[];
    active: string;
    recent?: string[];
    keeps?: Keeps;
    locked?: true;
    added?: true;
    documents?: true;
};

/**
 * Another page shown at this spot in a page's tree. It names the page by id and holds nothing of
 * its own: the page is the same page wherever it is shown, so a tab opened in it is open in every
 * place it shows. A page never shows itself, directly or through another page.
 */
export type PageLeaf = { kind: 'page'; page: string };

export type Layout = Split | Pane | PageLeaf;

/** The one pane shown alone while the rest of the workbench is put away. */
export type Focus = { path: number[] };

/**
 * The whole arrangement, which is what is saved: one tree and the pane that is maximised if one is.
 * A page is one tree, so every operation names a path in it and nothing else.
 */
export type Workbench = {
    root: Layout;
    /** The maximised pane, or nothing when every pane is shown. */
    focus?: Focus;
};

/**
 * The folder a page belongs to: a root key of the served roots and a path inside that root, the
 * empty text for the root itself. Two folders are the same when both fields are equal, so one
 * folder reached through two roots is two folders.
 */
export type FolderRef = { root: string; path: string };

/** Whether two folders are the same one: the same root key and the same path. */
export function sameFolder(left: FolderRef, right: FolderRef): boolean {
    return left.root === right.root && left.path === right.path;
}

/** The words of a folder: the last name of its path, and the root's key for the root itself. */
export function folderName(folder: FolderRef): string {
    return folder.path === '' ? folder.root : nameOf(folder.path);
}

/** Where a folder is: the root's key and the path in it, and the key alone for a root's top. */
export function folderPlace(folder: FolderRef): string {
    return folder.path === '' ? folder.root : `${folder.root}/${folder.path}`;
}

/**
 * The view a folder page opens in its documents pane when it is made, with the state that view
 * opens with: the item the page was opened for, which Reset layout opens again.
 */
export type FolderItem = { view: ViewId; state: unknown };

/**
 * One page: a whole workbench with a name of its own. Pages sit above the layout tree so tree and
 * workbench operations remain independent of page selection. `rail` is the `arrangements:` key of
 * config/layout.yml the page was made from by a rail button, which is what ties the page to that
 * button: renaming the button keeps the page, and a page no button made carries none. `folder` ties
 * the page to one folder, which makes it a workbench in the reader's words; such a page has no
 * `rail` key. `item` is what the page was opened for. `docs` is the paths of the hub's documents
 * the page has been given as tabs, which a rail page records so that a document tab the reader
 * closed is not given again and a document added to the `docs:` list later is given once. A page
 * saved with no record has none, and is given every document of its group.
 */
export type Page = {
    id: string;
    label: string;
    workbench: Workbench;
    rail?: string;
    docs?: string[];
    folder?: FolderRef;
    item?: FolderItem;
};

/**
 * What a page and a float have in common, and what the access functions answer for an id: an id
 * and a workbench. A float is a workbench of one pane, with no maximised pane.
 */
export type Host = { id: string; workbench: Workbench };

/** The side of the window a docked float is drawn along. */
export type DockEdge = 'left' | 'right' | 'bottom';

/**
 * Where a float is drawn. A free float is a rectangle in fractions of the window; a docked one
 * runs along an edge and takes `size` of the window's width, or of its height along the bottom; a
 * float in a window of its own of the desktop app is that window's content bounds in screen
 * points, which no window of the page draws.
 */
export type FloatPlace =
    | { kind: 'free'; x: number; y: number; w: number; h: number }
    | { kind: 'dock'; edge: DockEdge; size: number }
    | { kind: 'window'; x: number; y: number; w: number; h: number };

/**
 * A pane drawn over every page, its tabs open wherever the page on screen is. It is a host of its
 * own, addressed by its id wherever a page id is taken, and it is never a page.
 */
export type Float = { id: string; pane: Pane; place: FloatPlace };

/**
 * A closed folder page's layout, held by its folder: the arrangement as it was closed, and the
 * state each of its tabs held in the ui store (`states`, by instance id), so the page comes back
 * with its tabs, their layout states and their view states.
 */
export type KeptWorkbench = {
    folder: FolderRef;
    workbench: Workbench;
    states: Record<string, unknown>;
};

/** How many closed folder pages' layouts are kept. Closing one more drops the oldest. */
export const KEPT_MAX = 20;

/**
 * Every page, the floats beside them, and which page is on screen, with the layouts of the folder
 * pages that were closed, oldest first. This is the unit that is saved.
 */
export type Pages = {
    pages: Page[];
    current: string;
    floats: Float[];
    kept?: KeptWorkbench[];
};

/** The side of a pane a dropped tab takes, which is what says where the new pane goes. */
export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** The smallest share of a split one child may hold, so a drag can never take a pane to nothing. */
export const MIN_SIZE = 0.1;

/** The most children a split can hold and still give each of them MIN_SIZE. */
export const MAX_CHILDREN = Math.floor(1 / MIN_SIZE);

/** The view a fresh page starts on, when no page or float holds it. */
export const MAIN_VIEW = 'status';

/**
 * The envelope version serialiseLayout writes and the only one parseLayout reads: the list of
 * pages, one tree each, with the folder a page belongs to, the floats beside them, with the tabs a
 * pane pins and the order it showed them in, and the layouts of the folder pages that were closed.
 * An envelope of any other version is not read.
 */
export const LAYOUT_VERSION = 7;

/** A float as a host: a workbench of its one pane, with no maximised pane. */
export function floatHost(float: Float): Host {
    return { id: float.id, workbench: { root: float.pane } };
}

/** Every page and every float as a host, pages first. */
export function hostsOf(held: Pages): Host[] {
    return [...held.pages, ...held.floats.map(floatHost)];
}

/** Whether a host is a page, which a float is not: only a page carries a label. */
export function isPage(host: Host): host is Page {
    return 'label' in host;
}

export function show(path: number[]): string {
    return `[${path.join(', ')}]`;
}

export function samePath(left: number[], right: number[]): boolean {
    return left.length === right.length && left.every((index, at) => index === right[at]);
}

export function emptyPane(): Pane {
    return { kind: 'pane', tabs: [], active: '' };
}

/** How many tabs lead a strip pinned: the pinned run, which is always the strip's first tabs. */
export function pinnedRun(tabs: readonly Instance[]): number {
    return tabs.filter((tab) => tab.pinned === true).length;
}

/** The tabs with the pinned ones first, each run in its order. */
export function pinnedTabsFirst(tabs: Instance[]): Instance[] {
    const run = pinnedRun(tabs);
    if (run === 0 || run === tabs.length) return tabs;
    return [
        ...tabs.filter((tab) => tab.pinned === true),
        ...tabs.filter((tab) => tab.pinned !== true)
    ];
}

/** A tab pinned: a pinned tab is never a preview. */
export function pinned(tab: Instance): Instance {
    return { id: tab.id, view: tab.view, state: tab.state, pinned: true };
}

/** A tab with its pin taken off. */
export function unpinned(tab: Instance): Instance {
    if (tab.pinned === undefined) return tab;
    return tab.preview === true
        ? { id: tab.id, view: tab.view, state: tab.state, preview: true }
        : { id: tab.id, view: tab.view, state: tab.state };
}

/**
 * The ids of the other tabs a pane showed, the one shown last first, after `active` became the
 * shown one: the tab shown before it joins the front, and an id no tab carries any longer is
 * dropped.
 */
function recentAfter(from: Pane, tabs: readonly Instance[], active: string): string[] {
    const held = new Set(tabs.map((tab) => tab.id));
    const before = [from.active, ...(from.recent ?? [])];
    return before.filter((id, at) => id !== active && held.has(id) && before.indexOf(id) === at);
}

/**
 * A pane rebuilt with other tabs: what belongs to the pane and not to its tabs goes with it, the
 * lock, the mark of an added pane and the mark of the documents pane always and the kind a pane
 * keeps only while it holds no tab. The pinned tabs are put first and the order the tabs were shown
 * in follows `active`. Every operation that rebuilds a pane builds it here, so a field added to a
 * pane is carried at one place.
 */
export function repane(from: Pane, tabs: Instance[], active: string): Pane {
    const pane: Pane = { kind: 'pane', tabs: pinnedTabsFirst(tabs), active };
    const recent = recentAfter(from, tabs, active);
    if (recent.length > 0) pane.recent = recent;
    if (tabs.length === 0 && from.keeps !== undefined) pane.keeps = from.keeps;
    if (from.locked === true) pane.locked = true;
    if (from.added === true) pane.added = true;
    if (from.documents === true) pane.documents = true;
    return pane;
}

/**
 * The pane marked as added, which is how a pane made while its page was used differs from one the
 * page's arrangement defined.
 */
export function addedPane(pane: Pane): Pane {
    return { ...pane, added: true };
}

/** A leaf showing the page with this id. */
export function pageLeaf(page: string): PageLeaf {
    return { kind: 'page', page };
}

export function clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(high, value));
}

/** The initial layout: one root pane holding no tabs. */
export function defaultLayout(): Layout {
    return emptyPane();
}

/** One pane holding one new instance of a view. */
function paneOf(view: ViewId): Pane {
    const instance = newInstance(view);
    return { kind: 'pane', tabs: [instance], active: instance.id };
}

/** The arrangement a browser that has never held one starts from: one pane on the first view. */
export function defaultWorkbench(): Workbench {
    return { root: paneOf(MAIN_VIEW) };
}

/**
 * A fresh page around a workbench, with the id every page operation addresses it by. The words are
 * the caller's: they come from the catalog, which the layout modules do not read. A page made for a
 * rail button records the paths of the documents its tabs hold (`Page.docs`).
 */
export function newPage(
    label: string,
    workbench: Workbench = defaultWorkbench(),
    rail?: string
): Page {
    const page: Page = { id: crypto.randomUUID(), label, workbench };
    if (rail !== undefined) {
        page.rail = rail;
        page.docs = docPaths(workbench.root);
    }
    return page;
}

/** The pages a browser that has never held any starts from: one, on the default workbench. */
export function defaultPages(label: string): Pages {
    const page = newPage(label);
    return { pages: [page], current: page.id, floats: [] };
}
