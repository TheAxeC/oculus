// Layer 2, client state. The layout tree of DESIGN.md, "Layout as data": the types, every operation
// on the tree as a pure function, the invariants, and the saved form. Nothing here is reactive and
// nothing here reads storage; the store that holds the current tree is state/layout.svelte.ts.
//
// A node is addressed by its path, the list of child indices from the root: [] is the root, [1, 0]
// the first child of the second child. Nothing in the data carries a node id, and an instance is
// addressed by its own id. A path is therefore only meaningful against the tree it was read from, so
// an operation handed a path that names no node, or an id no pane holds, returns its argument
// unchanged: a stale path is a race with a rebuild, not a defect to throw on.
//
// Every operation returns a new tree and never mutates its argument. It returns the argument itself
// when there is nothing to change, which is still a tree the caller may not mutate.
//
// What is saved is not one tree but the Workbench: the main tree, the panel tree, where the panel is
// docked and how much of the window it takes. Every operation still works on one tree, and the store
// is told which of the two it is editing.

/**
 * The view a pane's tab mounts. The view registry (O8) is its vocabulary. A saved layout may name a
 * view the registry does not hold, from an older or a newer version of the app, and the shell shows
 * an empty pane for it rather than refusing the whole arrangement.
 */
export type ViewId = string;

import { findInstance, newInstance, panes } from './instance.ts';
export {
    activePath,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    stateId
} from './instance.ts';

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
 * One page: a whole workbench with a name of its own. DESIGN.md's decision of 2026-09-11 puts a
 * level above the layout tree rather than inside it, so every operation below still works on one
 * tree and one workbench and knows nothing about pages.
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

/** The view the main area starts on, and the one the panel starts on. */
export const MAIN_VIEW = 'status';
export const PANEL_VIEW = 'findings';

/** The envelope version serialiseLayout writes and parseLayout demands: the list of pages. */
export const LAYOUT_VERSION = 3;

/**
 * The envelope version that held one workbench, before a page was a thing. It is still read, so a
 * browser that holds one opens it as a page instead of falling back to the default.
 */
export const WORKBENCH_VERSION = 2;

/** Sizes must sum to 1 within this; a float sum of ten tenths is not exactly 1. */
const SUM_EPS = 1e-6;

/** The slack a size is allowed below MIN_SIZE, for the same reason. */
const EPS = 1e-9;

/** Whether a value is an object with keys, which every saved shape is read through. */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function show(path: number[]): string {
    return `[${path.join(', ')}]`;
}

function samePath(left: number[], right: number[]): boolean {
    return left.length === right.length && left.every((index, at) => index === right[at]);
}

function emptyPane(): Pane {
    return { kind: 'pane', tabs: [], active: '' };
}

function clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(high, value));
}

/** The layout O7 starts from: one root pane holding no tabs. */
export function defaultLayout(): Layout {
    return emptyPane();
}

/** One pane holding one new instance of a view, which is what each tree of the default holds. */
function paneOf(view: ViewId): Pane {
    const instance = newInstance(view);
    return { kind: 'pane', tabs: [instance], active: instance.id };
}

/** The arrangement a browser that has never held one starts from. */
export function defaultWorkbench(): Workbench {
    return {
        main: paneOf(MAIN_VIEW),
        panel: paneOf(PANEL_VIEW),
        dock: 'right',
        panelSize: PANEL_DEFAULT
    };
}

/**
 * A fresh page around a workbench, with the id every page operation addresses it by. The words are
 * the caller's: they come from the catalog, which state/layout.ts does not read.
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

// ---------------------------------------------------------------------------------------------
// Reading the tree

/** The node a path names, or null when the path runs off the tree. */
function nodeAt(layout: Layout, path: number[]): Layout | null {
    let node: Layout = layout;
    for (const index of path) {
        if (node.kind !== 'split') return null;
        const child = node.children[index];
        if (child === undefined) return null;
        node = child;
    }
    return node;
}

/** The pane a path names, or null when the path names a split or nothing. */
export function paneAt(layout: Layout, path: number[]): Pane | null {
    const node = nodeAt(layout, path);
    return node !== null && node.kind === 'pane' ? node : null;
}

// ---------------------------------------------------------------------------------------------
// Rewriting the tree

/**
 * A new tree with the node at `path` replaced by what `edit` returns. `edit` returning null removes
 * the node from its parent split, which collapses a split left holding one child into that child;
 * null from the root is the caller's to handle, and it is the only case this returns null.
 */
function rewrite(
    node: Layout,
    path: number[],
    edit: (node: Layout) => Layout | null
): Layout | null {
    if (path.length === 0) return edit(node);
    if (node.kind !== 'split') return node;
    const head = path[0];
    const child = node.children[head];
    if (child === undefined) return node;
    const next = rewrite(child, path.slice(1), edit);
    if (next === child) return node;
    if (next === null) return withoutChild(node, head);
    return {
        kind: 'split',
        dir: node.dir,
        sizes: node.sizes,
        children: replaceItem(node.children, head, next)
    };
}

function replaceItem<T>(items: T[], at: number, item: T): T[] {
    return items.map((current, index) => (index === at ? item : current));
}

/** The split without one child, its sizes renormalised; one child left is the child itself. */
function withoutChild(split: Split, at: number): Layout {
    const children = split.children.filter((_, index) => index !== at);
    const sizes = split.sizes.filter((_, index) => index !== at);
    const only = children[0];
    if (only === undefined) return emptyPane();
    if (children.length === 1) return only;
    return { kind: 'split', dir: split.dir, sizes: normaliseSizes(sizes), children };
}

/** The tree without the pane at `path`. The root pane is never removed; it is emptied instead. */
function removePane(layout: Layout, path: number[]): Layout {
    if (path.length === 0) return emptyPane();
    return rewrite(layout, path, () => null) ?? emptyPane();
}

/** The tree with one tab gone from the pane at `path`, the pane cleaned away if it held only that. */
function removeTab(layout: Layout, path: number[], index: number): Layout {
    const pane = paneAt(layout, path);
    if (pane === null) return layout;
    const removed = pane.tabs[index];
    if (removed === undefined) return layout;
    const tabs = pane.tabs.filter((_, at) => at !== index);
    if (tabs.length === 0) return removePane(layout, path);
    // The neighbour is the tab that took the closed one's place, or the last one when it was last.
    const neighbour = tabs[Math.min(index, tabs.length - 1)];
    const active = pane.active === removed.id ? neighbour.id : pane.active;
    return rewrite(layout, path, () => ({ kind: 'pane', tabs, active })) ?? layout;
}

/** Append an instance to a pane's tabs and make it the active one. */
export function openInstance(layout: Layout, path: number[], instance: Instance): Layout {
    if (paneAt(layout, path) === null) return layout;
    const edit = (node: Layout): Layout =>
        node.kind === 'pane'
            ? { kind: 'pane', tabs: [...node.tabs, instance], active: instance.id }
            : node;
    return rewrite(layout, path, edit) ?? layout;
}

/** Remove an instance wherever it sits, cleaning away a pane and a split left with nothing to hold. */
export function closeInstance(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    return removeTab(layout, found.path, found.index);
}

/**
 * Remove a whole pane and every tab it holds. The split it leaves with one child collapses into
 * that child, exactly as closing its last tab one at a time would leave it, and the root pane is
 * emptied rather than removed, since a tree is always at least one pane.
 */
export function closePane(layout: Layout, path: number[]): Layout {
    if (paneAt(layout, path) === null) return layout;
    return removePane(layout, path);
}

/** The tree with one instance under a different id, which is how a move keeps a path valid. */
function renameInstance(layout: Layout, from: string, to: string): Layout {
    const found = findInstance(layout, from);
    if (found === null) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const tabs = node.tabs.map((tab) => (tab.id === from ? { ...tab, id: to } : tab));
        return { kind: 'pane', tabs, active: node.active === from ? to : node.active };
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/**
 * The tree with one instance's state replaced. It is what an already-open view is retargeted by:
 * a second click on another card's edit control opens no second editor, it points the one that is
 * open at the other project.
 */
export function restate(layout: Layout, id: string, state: unknown): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const tabs = node.tabs.map((tab) => (tab.id === id ? { ...tab, state } : tab));
        return { kind: 'pane', tabs, active: node.active };
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/** Make an instance the active tab of the pane holding it. */
export function activate(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    const edit = (node: Layout): Layout =>
        node.kind === 'pane' ? { kind: 'pane', tabs: node.tabs, active: id } : node;
    return rewrite(layout, found.path, edit) ?? layout;
}

/**
 * Move an instance to `index` of the pane at `path`, from wherever it is now. The instance becomes
 * that pane's active tab, and the pane it left is cleaned as closeInstance cleans it. Inserting
 * first and removing second is what keeps the source path valid: adding a tab changes no path.
 */
export function moveInstance(layout: Layout, id: string, path: number[], index: number): Layout {
    const found = findInstance(layout, id);
    const target = paneAt(layout, path);
    if (found === null || target === null) return layout;
    const instance = found.instance;

    if (samePath(found.path, path)) {
        const rest = target.tabs.filter((_, at) => at !== found.index);
        const at = clamp(index, 0, rest.length);
        const tabs = [...rest.slice(0, at), instance, ...rest.slice(at)];
        return rewrite(layout, path, () => ({ kind: 'pane', tabs, active: id })) ?? layout;
    }

    const at = clamp(index, 0, target.tabs.length);
    const tabs = [...target.tabs.slice(0, at), instance, ...target.tabs.slice(at)];
    const inserted = rewrite(layout, path, () => ({ kind: 'pane', tabs, active: id }));
    if (inserted === null) return layout;
    return removeTab(inserted, found.path, found.index);
}

/**
 * Put a new pane holding `instance` beside the pane at `path`. A pane already inside a split of the
 * same direction gains a sibling there, taking half the pane's share, so a row of panes stays one
 * row; anything else is replaced by a split of itself and the new pane, half each. A split already
 * holding MAX_CHILDREN cannot give a further child MIN_SIZE, so that one nests instead.
 *
 * The new pane comes after the one it was split from, and `before` puts it in front of it instead,
 * which is what a drop on the left or the top edge of a pane asks for.
 */
export function splitPane(
    layout: Layout,
    path: number[],
    dir: 'row' | 'col',
    instance: Instance,
    before = false
): Layout {
    if (paneAt(layout, path) === null) return layout;
    const fresh: Pane = { kind: 'pane', tabs: [instance], active: instance.id };
    const parentPath = path.slice(0, -1);
    const parent = path.length === 0 ? null : nodeAt(layout, parentPath);
    const at = path[path.length - 1];

    if (
        parent !== null &&
        parent.kind === 'split' &&
        parent.dir === dir &&
        parent.children.length < MAX_CHILDREN
    ) {
        const share = parent.sizes[at] ?? 1 / parent.children.length;
        const insert = before ? at : at + 1;
        const children = [
            ...parent.children.slice(0, insert),
            fresh,
            ...parent.children.slice(insert)
        ];
        const sizes = [
            ...parent.sizes.slice(0, at),
            share / 2,
            share / 2,
            ...parent.sizes.slice(at + 1)
        ];
        const split: Split = { kind: 'split', dir, sizes: normaliseSizes(sizes), children };
        return rewrite(layout, parentPath, () => split) ?? layout;
    }

    const edit = (node: Layout): Layout => ({
        kind: 'split',
        dir,
        sizes: [0.5, 0.5],
        children: before ? [fresh, node] : [node, fresh]
    });
    return rewrite(layout, path, edit) ?? layout;
}

/** Give the split at `path` these sizes, normalised to sum to 1 with none below MIN_SIZE. */
export function resize(layout: Layout, path: number[], sizes: number[]): Layout {
    const node = nodeAt(layout, path);
    if (node === null || node.kind !== 'split') return layout;
    if (sizes.length !== node.children.length) return layout;
    const next = normaliseSizes(sizes);
    const edit = (current: Layout): Layout =>
        current.kind === 'split'
            ? { kind: 'split', dir: current.dir, sizes: next, children: current.children }
            : current;
    return rewrite(layout, path, edit) ?? layout;
}

/** Equal shares, which satisfy MIN_SIZE for any split a valid tree can hold. */
export function equalSizes(count: number): number[] {
    return Array.from({ length: count }, () => 1 / count);
}

/**
 * Sizes that sum to 1 with none below MIN_SIZE. Anything that is not a positive number counts as
 * zero, the rest are scaled to sum to 1, and then each child below the floor is raised to it and the
 * difference taken from the others in proportion. Raising one child can push another below the
 * floor, so that repeats; a set of sizes too crowded to satisfy at all falls back to equal shares.
 */
function normaliseSizes(raw: number[]): number[] {
    const count = raw.length;
    if (count === 0) return [];
    if (MIN_SIZE * count > 1 + SUM_EPS) return equalSizes(count);

    const clean = raw.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
    const total = clean.reduce((sum, value) => sum + value, 0);
    let sizes = total > 0 ? clean.map((value) => value / total) : equalSizes(count);

    for (let pass = 0; pass < count; pass++) {
        const low = sizes.filter((value) => value < MIN_SIZE - EPS).length;
        if (low === 0) return sizes;
        const free = 1 - MIN_SIZE * low;
        const rest = sizes.reduce((sum, value) => sum + (value < MIN_SIZE - EPS ? 0 : value), 0);
        sizes = sizes.map((value) => {
            if (value < MIN_SIZE - EPS) return MIN_SIZE;
            return rest > 0 ? (value / rest) * free : free / (count - low);
        });
    }
    return sizes.some((value) => value < MIN_SIZE - EPS) ? equalSizes(count) : sizes;
}

// ---------------------------------------------------------------------------------------------
// Operations on the whole workbench
//
// A tab crosses from one tree to the other, so these take the arrangement rather than one tree.
// Each of them returns its argument unchanged when it names no pane or no instance, which is the
// same rule the one-tree operations follow for a stale path.

/** One of the two trees. */
function treeOf(workbench: Workbench, target: Target): Layout {
    return target === 'main' ? workbench.main : workbench.panel;
}

/** The arrangement with one of its trees replaced. */
function withTree(workbench: Workbench, target: Target, tree: Layout): Workbench {
    return target === 'main' ? { ...workbench, main: tree } : { ...workbench, panel: tree };
}

/** Which tree holds an instance, or null when neither does. */
export function holderOf(workbench: Workbench, id: string): Target | null {
    if (findInstance(workbench.main, id) !== null) return 'main';
    if (findInstance(workbench.panel, id) !== null) return 'panel';
    return null;
}

/** The maximised pane, or null when none is or the one that was is gone. */
export function focusedPane(workbench: Workbench): Focus | null {
    const focus = workbench.focus;
    if (focus === undefined) return null;
    return paneAt(treeOf(workbench, focus.target), focus.path) === null ? null : focus;
}

/**
 * The arrangement without a focus that names no pane. Every operation that can remove a pane ends
 * here, so a maximised pane that was closed or collapsed leaves the workbench shown whole rather
 * than showing nothing.
 */
export function settleFocus(workbench: Workbench): Workbench {
    if (workbench.focus === undefined) return workbench;
    if (focusedPane(workbench) !== null) return workbench;
    return restore(workbench);
}

/**
 * Move an instance to `index` of the pane at `path` in `target`, from whichever tree holds it. It
 * becomes that pane's active tab and the pane it left is cleaned as closeInstance cleans it. Within
 * one tree this is moveInstance; across the two, the insertion and the removal touch different
 * trees, so neither can invalidate the other's path.
 */
export function transfer(
    workbench: Workbench,
    id: string,
    target: Target,
    path: number[],
    index: number
): Workbench {
    const source = holderOf(workbench, id);
    if (source === null) return workbench;
    const destination = paneAt(treeOf(workbench, target), path);
    if (destination === null) return workbench;

    if (source === target) {
        const moved = moveInstance(treeOf(workbench, target), id, path, index);
        return settleFocus(withTree(workbench, target, moved));
    }

    const from = treeOf(workbench, source);
    const found = findInstance(from, id);
    if (found === null) return workbench;
    const at = clamp(index, 0, destination.tabs.length);
    const tabs = [...destination.tabs.slice(0, at), found.instance, ...destination.tabs.slice(at)];
    const inserted = rewrite(treeOf(workbench, target), path, () => ({
        kind: 'pane',
        tabs,
        active: id
    }));
    if (inserted === null) return workbench;
    const cleaned = removeTab(from, found.path, found.index);
    const next = withTree(withTree(workbench, target, inserted), source, cleaned);
    return settleFocus(next);
}

/**
 * Split the pane at `path` in `target` and put an instance alone in the new pane, taking it out of
 * whichever tree holds it. A drop on the left or the right edge makes a row and one on the top or
 * the bottom edge a column, with the new pane before the split one for `left` and `top`.
 *
 * Within one tree the split has to happen first: removing the instance can empty its pane and
 * collapse a split, which would leave `path` naming another node. The new pane therefore holds the
 * instance under a temporary id until the original is gone, so no tree ever holds the id twice.
 */
export function splitWith(
    workbench: Workbench,
    id: string,
    target: Target,
    path: number[],
    edge: Edge
): Workbench {
    const source = holderOf(workbench, id);
    if (source === null) return workbench;
    if (paneAt(treeOf(workbench, target), path) === null) return workbench;
    const found = findInstance(treeOf(workbench, source), id);
    if (found === null) return workbench;
    const dir: 'row' | 'col' = edge === 'left' || edge === 'right' ? 'row' : 'col';
    const before = edge === 'left' || edge === 'top';

    const holder = paneAt(treeOf(workbench, source), found.path);
    const alone = holder !== null && holder.tabs.length === 1;
    // Splitting a pane away from its own only tab would put the pane back where it already is.
    if (source === target && alone && samePath(found.path, path)) return workbench;

    if (source !== target) {
        const split = splitPane(treeOf(workbench, target), path, dir, found.instance, before);
        const cleaned = removeTab(treeOf(workbench, source), found.path, found.index);
        const next = withTree(withTree(workbench, target, split), source, cleaned);
        return settleFocus(next);
    }

    const temporary: Instance = { ...found.instance, id: `${id}#moving` };
    let tree = splitPane(treeOf(workbench, target), path, dir, temporary, before);
    tree = closeInstance(tree, id);
    tree = renameInstance(tree, temporary.id, id);
    return settleFocus(withTree(workbench, target, tree));
}

/** Show one pane alone. A path naming no pane leaves the arrangement as it was. */
export function maximise(workbench: Workbench, target: Target, path: number[]): Workbench {
    if (paneAt(treeOf(workbench, target), path) === null) return workbench;
    return { ...workbench, focus: { target, path: [...path] } };
}

/** Show every pane again. */
export function restore(workbench: Workbench): Workbench {
    if (workbench.focus === undefined) return workbench;
    const { main, panel, dock, panelSize } = workbench;
    return { main, panel, dock, panelSize };
}

// ---------------------------------------------------------------------------------------------
// Invariants, reading and writing

/**
 * Everything that must hold of a tree, as one message per violation and an empty array for a tree
 * the shell can render. The tests and parseLayout are its callers.
 */
export function checkLayout(layout: Layout): string[] {
    const problems: string[] = [];
    readNode(layout, [], problems, new Set());
    return problems;
}

/**
 * The tree in `value`, cloned field by field, or null when it is too broken to build. Every
 * violation found on the way is appended to `problems`, so a tree that builds may still be invalid.
 */
function readNode(
    value: unknown,
    path: number[],
    problems: string[],
    ids: Set<string>
): Layout | null {
    const where = `node at ${show(path)}`;
    if (!isRecord(value)) {
        problems.push(`${where}: not an object`);
        return null;
    }
    if (value.kind === 'split') return readSplit(value, path, problems, ids, where);
    if (value.kind === 'pane') return readPane(value, problems, ids, where);
    problems.push(`${where}: kind is ${JSON.stringify(value.kind)}, not split or pane`);
    return null;
}

function readSplit(
    value: Record<string, unknown>,
    path: number[],
    problems: string[],
    ids: Set<string>,
    where: string
): Layout | null {
    const dir = value.dir;
    if (dir !== 'row' && dir !== 'col') {
        problems.push(`${where}: dir is ${JSON.stringify(dir)}, not row or col`);
        return null;
    }
    const rawChildren = value.children;
    if (!Array.isArray(rawChildren)) {
        problems.push(`${where}: children is not an array`);
        return null;
    }
    if (rawChildren.length < 2) {
        problems.push(`${where}: a split holds ${rawChildren.length} children, two is the least`);
    }
    const children: Layout[] = [];
    for (const [index, raw] of rawChildren.entries()) {
        const child = readNode(raw, [...path, index], problems, ids);
        if (child === null) return null;
        children.push(child);
    }
    const rawSizes = value.sizes;
    const numbers =
        Array.isArray(rawSizes) &&
        rawSizes.every((size) => typeof size === 'number' && Number.isFinite(size));
    if (!numbers) {
        problems.push(`${where}: sizes is not an array of numbers`);
        return null;
    }
    const sizes = rawSizes as number[];
    if (sizes.length !== children.length) {
        problems.push(`${where}: ${sizes.length} sizes for ${children.length} children`);
    } else {
        const total = sizes.reduce((sum, size) => sum + size, 0);
        if (Math.abs(total - 1) > SUM_EPS) problems.push(`${where}: sizes sum to ${total}, not 1`);
    }
    for (const [index, size] of sizes.entries()) {
        if (size < MIN_SIZE - EPS) {
            problems.push(`${where}: child ${index} holds ${size}, under the minimum ${MIN_SIZE}`);
        }
    }
    return { kind: 'split', dir, sizes, children };
}

function readPane(
    value: Record<string, unknown>,
    problems: string[],
    ids: Set<string>,
    where: string
): Layout | null {
    const rawTabs = value.tabs;
    if (!Array.isArray(rawTabs)) {
        problems.push(`${where}: tabs is not an array`);
        return null;
    }
    const tabs: Instance[] = [];
    for (const [index, raw] of rawTabs.entries()) {
        if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '') {
            problems.push(`${where}: tab ${index} has no id`);
            return null;
        }
        if (typeof raw.view !== 'string') {
            problems.push(`${where}: tab ${index} has no view`);
            return null;
        }
        if (ids.has(raw.id)) {
            problems.push(`${where}: tab ${index} repeats the instance id ${raw.id}`);
        }
        ids.add(raw.id);
        tabs.push({ id: raw.id, view: raw.view, state: raw.state });
    }
    const active = value.active;
    if (typeof active !== 'string') {
        problems.push(`${where}: active is not a string`);
        return null;
    }
    if (tabs.length === 0) {
        if (active !== '') problems.push(`${where}: an empty pane calls ${active} active`);
    } else if (!tabs.some((tab) => tab.id === active)) {
        problems.push(
            `${where}: active is ${JSON.stringify(active)}, which is not one of its tabs`
        );
    }
    return { kind: 'pane', tabs, active };
}

/** Where the panel may sit, which is what a saved value and an arrangement are read against. */
export const DOCKS: Dock[] = ['right', 'bottom', 'hidden'];

/**
 * Everything that must hold of a whole arrangement: both trees, the dock, and the panel's share.
 * An instance id is unique across the workbench and not only within one tree, since a view's own
 * state is kept by instance id and the two trees are shown at once.
 */
export function checkWorkbench(workbench: Workbench): string[] {
    const problems: string[] = [];
    const ids = new Set<string>();
    readTree(workbench.main, 'main', problems, ids);
    readTree(workbench.panel, 'panel', problems, ids);
    if (!DOCKS.includes(workbench.dock)) {
        problems.push(`dock is ${JSON.stringify(workbench.dock)}, not right, bottom or hidden`);
    }
    if (workbench.panelSize < PANEL_MIN || workbench.panelSize > PANEL_MAX) {
        problems.push(`panelSize is ${workbench.panelSize}, outside ${PANEL_MIN} to ${PANEL_MAX}`);
    }
    const focus = workbench.focus;
    if (focus !== undefined && focusedPane(workbench) === null) {
        problems.push(`focus names ${focus.target} ${show(focus.path)}, which is not a pane`);
    }
    return problems;
}

/**
 * Everything that must hold of the whole set of pages: at least one page, a page id used once, a
 * current that names one of them, a workbench that checks out on every page, and an instance id
 * used once across every page, since openView finds an open view by instance id alone.
 */
export function checkPages(pages: Pages): string[] {
    const problems: string[] = [];
    if (pages.pages.length === 0) problems.push('no page');
    const ids = new Set<string>();
    const instances = new Set<string>();
    for (const page of pages.pages) {
        if (ids.has(page.id)) problems.push(`page id ${JSON.stringify(page.id)} is used twice`);
        ids.add(page.id);
        for (const problem of checkWorkbench(page.workbench)) {
            problems.push(`page ${JSON.stringify(page.label)} ${problem}`);
        }
        for (const { pane } of [...panes(page.workbench.main), ...panes(page.workbench.panel)]) {
            for (const tab of pane.tabs) {
                if (instances.has(tab.id)) {
                    problems.push(`instance ${JSON.stringify(tab.id)} is on two pages`);
                }
                instances.add(tab.id);
            }
        }
    }
    if (!ids.has(pages.current)) {
        problems.push(`current is ${JSON.stringify(pages.current)}, which is not a page`);
    }
    return problems;
}

/** The saved form: the envelope, so a later version can be told apart from this one. */
export function serialiseLayout(pages: Pages): string {
    return JSON.stringify({ version: LAYOUT_VERSION, pages: pages.pages, current: pages.current });
}

/**
 * The pages in a saved envelope, or null when anything about them is wrong: another version, a
 * broken shape, or an invariant a hand edit or an older release left violated. A version 2 envelope
 * held one workbench and is read as one page, carrying `label`, so nothing a browser holds today is
 * lost; a version 1 envelope held one tree and no panel, so it is another version and the browser
 * falls back to the default. Anything that fails here never reaches the shell, which is why the
 * shell never checks the shape of what it renders. A string is read as JSON first, so the caller can
 * hand over what storage returned.
 */
export function parseLayout(value: unknown, label: string): Pages | null {
    const envelope = asEnvelope(value);
    if (envelope === null) return null;
    if (envelope.version === WORKBENCH_VERSION) {
        const only = readWorkbench(envelope.workbench);
        return only === null ? null : defaultPagesOf(newPage(label, only));
    }
    if (envelope.version !== LAYOUT_VERSION) return null;
    const saved = envelope.pages;
    const current = envelope.current;
    if (!Array.isArray(saved) || typeof current !== 'string') return null;
    const pages: Page[] = [];
    for (const entry of saved) {
        if (!isRecord(entry)) return null;
        if (typeof entry.id !== 'string' || typeof entry.label !== 'string') return null;
        const workbench = readWorkbench(entry.workbench);
        if (workbench === null) return null;
        pages.push({ id: entry.id, label: entry.label, workbench });
    }
    const read: Pages = { pages, current };
    return checkPages(read).length === 0 ? read : null;
}

/** The one set of pages a single page makes, which is what a version 2 envelope reads as. */
function defaultPagesOf(page: Page): Pages {
    return { pages: [page], current: page.id };
}

/** A saved envelope as an object, reading a string as JSON first, or null when it is neither. */
function asEnvelope(value: unknown): Record<string, unknown> | null {
    let envelope: unknown = value;
    if (typeof envelope === 'string') {
        try {
            envelope = JSON.parse(envelope);
        } catch {
            return null;
        }
    }
    return isRecord(envelope) ? envelope : null;
}

/**
 * The one workbench of a version 2 envelope, or null when it is another version or does not check
 * out. It is what a browser that last ran before pages holds, and the migration in the store reads
 * the workbench a named arrangement replaced with it.
 */
export function parseWorkbench(value: unknown): Workbench | null {
    const envelope = asEnvelope(value);
    if (envelope === null || envelope.version !== WORKBENCH_VERSION) return null;
    return readWorkbench(envelope.workbench);
}

/** One saved workbench, the envelope around it already taken off. */
function readWorkbench(value: unknown): Workbench | null {
    const saved = value;
    if (!isRecord(saved)) return null;

    const problems: string[] = [];
    const ids = new Set<string>();
    const main = readTree(saved.main, 'main', problems, ids);
    const panel = readTree(saved.panel, 'panel', problems, ids);
    const dock = saved.dock;
    if (typeof dock !== 'string' || !DOCKS.includes(dock as Dock)) return null;
    const panelSize = saved.panelSize;
    if (typeof panelSize !== 'number' || !Number.isFinite(panelSize)) return null;
    if (panelSize < PANEL_MIN || panelSize > PANEL_MAX) return null;
    if (main === null || panel === null || problems.length > 0) return null;
    const workbench: Workbench = { main, panel, dock: dock as Dock, panelSize };
    const focus = readFocus(saved.focus);
    if (focus === null) return workbench;
    return settleFocus({ ...workbench, focus });
}

/**
 * The maximised pane of a saved envelope, or null when the value does not name one. A focus that no
 * longer names a pane is dropped rather than refused: the arrangement around it is still the one the
 * browser had, and a pane closed in an older release is not a reason to lose it.
 */
function readFocus(value: unknown): Focus | null {
    if (!isRecord(value)) return null;
    const target = value.target;
    if (target !== 'main' && target !== 'panel') return null;
    const path = value.path;
    if (!Array.isArray(path)) return null;
    if (!path.every((step) => typeof step === 'number' && Number.isInteger(step) && step >= 0)) {
        return null;
    }
    return { target, path: path as number[] };
}

/** One of the two trees of a saved envelope, its problems named by which tree they are in. */
function readTree(
    value: unknown,
    which: string,
    problems: string[],
    ids: Set<string>
): Layout | null {
    const found: string[] = [];
    const tree = readNode(value, [], found, ids);
    for (const problem of found) problems.push(`${which} ${problem}`);
    return tree;
}
