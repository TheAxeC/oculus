// Layer 2, client state. Layout types, constants, defaults and page operations live here because
// changes to the model should not involve tree or workbench algorithms.

import { newInstance } from './instance.ts';

/**
 * The view a pane's tab mounts. The view registry is its vocabulary. A saved layout may name a
 * view the registry does not hold, from an older or a newer version of the app, and the shell shows
 * an empty pane for it rather than refusing the whole arrangement.
 */
export type ViewId = string;

/**
 * One tab: the view it mounts and the state that view was opened with. `preview` marks the tab a
 * single click opened, which the next single click in the same pane replaces; a double click, a
 * keystroke in its editor, a drag or a split keeps it, which is the flag going away.
 */
export type Instance = { id: string; view: ViewId; state: unknown; preview?: true };

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
export type Pane = { kind: 'pane'; tabs: Instance[]; active: string };

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
 * One page: a whole workbench with a name of its own. Pages sit above the layout tree so tree and
 * workbench operations remain independent of page selection. `rail` is the `arrangements:` key of
 * config/layout.yml the page was made from by a rail button, which is what ties the page to that
 * button: renaming the button keeps the page, and a page no button made carries none.
 */
export type Page = {
    id: string;
    label: string;
    workbench: Workbench;
    rail?: string;
};

/** Every page, and which of them is on screen. This is the unit that is saved. */
export type Pages = { pages: Page[]; current: string };

/** The side of a pane a dropped tab takes, which is what says where the new pane goes. */
export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** The smallest share of a split one child may hold, so a drag can never take a pane to nothing. */
export const MIN_SIZE = 0.1;

/** The most children a split can hold and still give each of them MIN_SIZE. */
export const MAX_CHILDREN = Math.floor(1 / MIN_SIZE);

/** The view a fresh page starts on. */
export const MAIN_VIEW = 'status';

/**
 * The envelope version serialiseLayout writes and parseLayout demands: the list of pages, one tree
 * each.
 */
export const LAYOUT_VERSION = 4;

/**
 * The envelope version whose page held two trees and a docked panel. It is still read, and its
 * pages are migrated to one tree each, so a browser holding one loses no tab.
 */
export const PAGES_VERSION = 3;

/**
 * The envelope version that held one two-tree workbench, before a page was a thing. It is still
 * read and migrated the same way, so a browser that holds one opens it as a page.
 */
export const WORKBENCH_VERSION = 2;

export function show(path: number[]): string {
    return `[${path.join(', ')}]`;
}

export function samePath(left: number[], right: number[]): boolean {
    return left.length === right.length && left.every((index, at) => index === right[at]);
}

export function emptyPane(): Pane {
    return { kind: 'pane', tabs: [], active: '' };
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
 * the caller's: they come from the catalog, which the layout modules do not read.
 */
export function newPage(
    label: string,
    workbench: Workbench = defaultWorkbench(),
    rail?: string
): Page {
    const page: Page = { id: crypto.randomUUID(), label, workbench };
    if (rail !== undefined) page.rail = rail;
    return page;
}

/** The pages a browser that has never held any starts from: one, on the default workbench. */
export function defaultPages(label: string): Pages {
    const page = newPage(label);
    return { pages: [page], current: page.id };
}
