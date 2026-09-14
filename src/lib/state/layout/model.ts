// Layer 2, client state. Layout types, constants, defaults and page operations live here because
// changes to the model should not involve tree or workbench algorithms.

import { newInstance } from '../instance.ts';

/**
 * The view a pane's tab mounts. The view registry is its vocabulary. A saved layout may name a
 * view the registry does not hold, from an older or a newer version of the app, and the shell shows
 * an empty pane for it rather than refusing the whole arrangement.
 */
export type ViewId = string;

export type Instance = { id: string; view: ViewId; state: unknown };

export type Split = { kind: 'split'; dir: 'row' | 'col'; sizes: number[]; children: Layout[] };
export type Pane = { kind: 'pane'; tabs: Instance[]; active: string };
export type Layout = Split | Pane;

/** Where the panel sits beside the main area, or that it is not shown. */
export type Dock = 'right' | 'bottom' | 'hidden';

/** Which of the workbench's two trees an operation applies to. */
export type Target = 'main' | 'panel';

/** The one pane shown alone while the rest of the workbench is put away. */
export type Focus = { target: Target; path: number[] };

/**
 * The whole arrangement, which is what is saved: two trees, where the second one sits, how much of
 * the window it takes, and the pane that is maximised if one is. The panel is a tree of its own
 * rather than a pane, so a panel can be split exactly as the main area can and every operation
 * applies to either of them.
 */
export type Workbench = {
    main: Layout;
    panel: Layout;
    dock: Dock;
    panelSize: number;
    /** The maximised pane, or nothing when every pane is shown. */
    focus?: Focus;
};

/**
 * One page: a whole workbench with a name of its own. Pages sit above the layout tree so tree and
 * workbench operations remain independent of page selection.
 */
export type Page = { id: string; label: string; workbench: Workbench };

/** Every page, and which of them is on screen. This is the unit that is saved. */
export type Pages = { pages: Page[]; current: string };

/** The side of a pane a dropped tab takes, which is what says where the new pane goes. */
export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** The smallest share of a split one child may hold, so a drag can never take a pane to nothing. */
export const MIN_SIZE = 0.1;

/** The most children a split can hold and still give each of them MIN_SIZE. */
export const MAX_CHILDREN = Math.floor(1 / MIN_SIZE);

/** The panel's share of the window: the least, the most, and what it starts at. */
export const PANEL_MIN = 0.1;
export const PANEL_MAX = 0.6;
export const PANEL_DEFAULT = 0.3;

/** The view the main area starts on. */
export const MAIN_VIEW = 'status';

/** The envelope version serialiseLayout writes and parseLayout demands: the list of pages. */
export const LAYOUT_VERSION = 3;

/**
 * The envelope version that held one workbench, before a page was a thing. It is still read, so a
 * browser that holds one opens it as a page instead of falling back to the default.
 */
export const WORKBENCH_VERSION = 2;

/** Whether a value is an object with keys, which every saved shape is read through. */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
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

/** The arrangement a browser that has never held one starts from. */
export function defaultWorkbench(): Workbench {
    return {
        main: paneOf(MAIN_VIEW),
        panel: emptyPane(),
        dock: 'hidden',
        panelSize: PANEL_DEFAULT
    };
}

/**
 * A fresh page around a workbench, with the id every page operation addresses it by. The words are
 * the caller's: they come from the catalog, which the layout modules do not read.
 */
export function newPage(label: string, workbench: Workbench = defaultWorkbench()): Page {
    return { id: crypto.randomUUID(), label, workbench };
}

/** The pages a browser that has never held any starts from: one, on the default workbench. */
export function defaultPages(label: string): Pages {
    const page = newPage(label);
    return { pages: [page], current: page.id };
}

/** Move one page to a clamped index while leaving the page on screen unchanged. */
export function movePage(held: Pages, id: string, index: number): Pages {
    const at = held.pages.findIndex((page) => page.id === id);
    if (at < 0) return held;
    const pages = held.pages.filter((page) => page.id !== id);
    const next = Math.max(0, Math.min(Math.trunc(index), pages.length));
    if (next === at) return held;
    pages.splice(next, 0, held.pages[at]);
    return { pages, current: held.current };
}

/** The panel's share, held between PANEL_MIN and PANEL_MAX; anything that is not a number is the default. */
export function clampPanel(fraction: number): number {
    if (!Number.isFinite(fraction)) return PANEL_DEFAULT;
    return clamp(fraction, PANEL_MIN, PANEL_MAX);
}
