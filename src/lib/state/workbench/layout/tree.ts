// Layer 2, client state. Pure operations over one Layout tree live here because tree rewrites
// change independently of workbench focus and persistence.

import { item } from '../../../data/helpers/guards.ts';
import { findInstance, panes } from './instance.ts';
import {
    MAX_CHILDREN,
    MIN_SIZE,
    addedPane,
    clamp,
    emptyPane,
    pinned,
    pinnedRun,
    repane,
    samePath,
    unpinned,
    type Instance,
    type Keeps,
    type Layout,
    type Pane,
    type PageLeaf,
    type Split,
    type ViewId
} from './model.ts';

const SUM_EPS = 1e-6;
const EPS = 1e-9;

// ---------------------------------------------------------------------------------------------
// Reading the tree

/** The node a path names, or null when the path runs off the tree. */
export function nodeAt(layout: Layout, path: number[]): Layout | null {
    let node: Layout = layout;
    for (const index of path) {
        if (node.kind !== 'split') return null;
        const child = item(node.children, index);
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

/**
 * The leaf a path names, a pane or a page, and null when it names a split or nothing. It is what
 * every operation that puts a node beside another asks, since a page leaf takes a neighbour exactly
 * as a pane does.
 */
export function leafAt(layout: Layout, path: number[]): Pane | PageLeaf | null {
    const node = nodeAt(layout, path);
    return node !== null && node.kind !== 'split' ? node : null;
}

/** Every page leaf with its path, depth first, left to right. */
export function pageLeaves(layout: Layout): { path: number[]; page: string }[] {
    const found: { path: number[]; page: string }[] = [];
    const walk = (node: Layout, path: number[]): void => {
        if (node.kind === 'page') {
            found.push({ path, page: node.page });
            return;
        }
        if (node.kind !== 'split') return;
        node.children.forEach((child, index) => walk(child, [...path, index]));
    };
    walk(layout, []);
    return found;
}

/** Whether the child at `index` of a split is collapsed to the split's edge. */
export function isFolded(split: Split, index: number): boolean {
    return split.folded?.includes(index) === true;
}

/** How many children of a split are drawn as a strip rather than at their share. */
export function foldedCount(split: Split): number {
    return split.folded?.length ?? 0;
}

// ---------------------------------------------------------------------------------------------
// Rewriting the tree

/**
 * A new tree with the node at `path` replaced by what `edit` returns. `edit` returning null removes
 * the node from its parent split, which collapses a split left holding one child into that child;
 * null from the root is the caller's to handle, and it is the only case this returns null.
 */
export function rewrite(
    node: Layout,
    path: number[],
    edit: (node: Layout) => Layout | null
): Layout | null {
    if (path.length === 0) return edit(node);
    if (node.kind !== 'split') return node;
    const head = path[0];
    const child = item(node.children, head);
    if (child === undefined) return node;
    const next = rewrite(child, path.slice(1), edit);
    if (next === child) return node;
    if (next === null) return withoutChild(node, head);
    return splitOf(node.dir, node.sizes, replaceItem(node.children, head, next), node.folded);
}

function replaceItem<T>(items: T[], at: number, item: T): T[] {
    return items.map((current, index) => (index === at ? item : current));
}

/**
 * A split carrying only the folded indexes that still name a child, and never every one of them:
 * a split whose children are all collapsed would take space and show nothing, so the first child
 * of such a set stays open.
 */
function splitOf(
    dir: 'row' | 'col',
    sizes: number[],
    children: Layout[],
    folded: number[] | undefined
): Split {
    const inside = [...new Set(folded ?? [])]
        .filter((index) => Number.isInteger(index) && index >= 0 && index < children.length)
        .sort((left, right) => left - right);
    const kept = inside.length >= children.length ? inside.slice(1) : inside;
    const split: Split = { kind: 'split', dir, sizes, children };
    if (kept.length > 0) split.folded = kept;
    return split;
}

/** The folded indexes after a child is taken out at `at`: the ones above it move down one. */
function foldedWithout(folded: number[] | undefined, at: number): number[] {
    return (folded ?? [])
        .filter((index) => index !== at)
        .map((index) => (index > at ? index - 1 : index));
}

/** The folded indexes after a child is put in at `at`: the ones from there up move up one. */
function foldedWith(folded: number[] | undefined, at: number): number[] {
    return (folded ?? []).map((index) => (index >= at ? index + 1 : index));
}

/** The split without one child, its sizes renormalised; one child left is the child itself. */
function withoutChild(split: Split, at: number): Layout {
    const children = split.children.filter((_, index) => index !== at);
    const sizes = split.sizes.filter((_, index) => index !== at);
    const only = children.at(0);
    if (only === undefined) return emptyPane();
    if (children.length === 1) return only;
    return splitOf(split.dir, normaliseSizes(sizes), children, foldedWithout(split.folded, at));
}

/**
 * The tree without the node at `path`, the split it leaves with one child collapsed into that
 * child. A tree is always at least one node, so the root is emptied rather than removed.
 */
export function removeNode(layout: Layout, path: number[]): Layout {
    if (path.length === 0) return emptyPane();
    return rewrite(layout, path, () => null) ?? emptyPane();
}

/**
 * What an emptied pane is left as: `documents` for the pane where a view opened for something
 * lands, `terminals` for the pane a Terminal tab left. The store hands it to every operation that
 * can take a pane's last tab out of a page; a float has none, and a float whose last tab goes is
 * removed.
 */
export type KeepRule = (view: ViewId) => 'documents' | Keeps;

/**
 * The empty pane to leave where a pane's last tab was, or null when the pane goes. A locked pane
 * stays whatever else is true of it. Any other pane of a page stays unless it is added, a pane made
 * while the page was used, which goes with its last tab. A pane that stays keeps its lock, its
 * added mark and its documents mark, and is a terminals pane when the rule names a terminals pane
 * for its last tab's view.
 */
function keptPane(pane: Pane, view: ViewId, keep?: KeepRule): Pane | null {
    const locked = pane.locked === true;
    if (!locked && (keep === undefined || pane.added === true)) return null;
    const left = keep?.(view) === 'terminals' ? emptiedTerminals() : emptyPane();
    if (pane.added === true) left.added = true;
    if (locked) left.locked = true;
    if (pane.documents === true) left.documents = true;
    return left;
}

/** The empty pane a Terminal tab leaves. */
function emptiedTerminals(): Pane {
    return { kind: 'pane', tabs: [], active: '', keeps: 'terminals' };
}

/**
 * The tree with one tab gone from the pane at `path`, the pane cleaned away if it held only that,
 * or left empty when `keptPane` keeps it.
 */
export function removeTab(layout: Layout, path: number[], index: number, keep?: KeepRule): Layout {
    const pane = paneAt(layout, path);
    if (pane === null) return layout;
    const removed = item(pane.tabs, index);
    if (removed === undefined) return layout;
    const tabs = pane.tabs.filter((_, at) => at !== index);
    if (tabs.length === 0) {
        const kept = keptPane(pane, removed.view, keep);
        if (kept === null) return removeNode(layout, path);
        return rewrite(layout, path, () => kept) ?? layout;
    }
    return (
        rewrite(layout, path, () => repane(pane, tabs, activeAfterClose(pane, tabs, index))) ??
        layout
    );
}

/**
 * The tab a pane shows once the tab at `index` is gone: the one it shows already when that was not
 * the closed one, else the tab shown most recently, else the tab that took the closed one's place
 * (or the last, when it was last), which is what a pane that never showed another tab holds.
 */
function activeAfterClose(pane: Pane, tabs: Instance[], index: number): string {
    const removed = item(pane.tabs, index);
    if (pane.active !== removed?.id) return pane.active;
    const held = new Set(tabs.map((tab) => tab.id));
    const last = (pane.recent ?? []).find((id) => held.has(id));
    return last ?? tabs[Math.min(index, tabs.length - 1)].id;
}

/** The position a new tab takes in a pane: right after the active tab, or at the end with none. */
function openedAt(pane: Pane): number {
    const at = pane.tabs.findIndex((tab) => tab.id === pane.active);
    return at < 0 ? pane.tabs.length : at + 1;
}

/**
 * Open an instance in a pane, to the right of the active tab, and make it the active one. A pane
 * with no active tab takes it at the end, and an unpinned tab never lands among the pinned ones.
 */
export function openInstance(layout: Layout, path: number[], instance: Instance): Layout {
    if (paneAt(layout, path) === null) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const at = openedAt(node);
        const tabs = [...node.tabs.slice(0, at), instance, ...node.tabs.slice(at)];
        return repane(node, tabs, instance.id);
    };
    return rewrite(layout, path, edit) ?? layout;
}

/**
 * Remove an instance wherever it sits, cleaning away a pane and a split left with nothing to hold.
 */
export function closeInstance(layout: Layout, id: string, keep?: KeepRule): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    return removeTab(layout, found.path, found.index, keep);
}

/**
 * Remove a whole pane and every tab it holds, whatever the rule would keep of it. The split it
 * leaves with one child collapses into that child, and the root pane is emptied rather than
 * removed, since a tree is always at least one pane.
 */
export function closePane(layout: Layout, path: number[]): Layout {
    if (paneAt(layout, path) === null) return layout;
    return removeNode(layout, path);
}

/** The tree with one instance under a different id, which is how a move keeps a path valid. */
export function renameInstance(layout: Layout, from: string, to: string): Layout {
    const found = findInstance(layout, from);
    if (found === null) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const tabs = node.tabs.map((tab) => (tab.id === from ? { ...tab, id: to } : tab));
        const recent = node.recent?.map((id) => (id === from ? to : id));
        const shown = node.active === from ? to : node.active;
        return repane({ ...node, active: shown, recent }, tabs, shown);
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
        return repane(node, tabs, node.active);
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/** Make an instance the active tab of the pane holding it. */
export function activate(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    const edit = (node: Layout): Layout =>
        node.kind === 'pane' ? repane(node, node.tabs, id) : node;
    return rewrite(layout, found.path, edit) ?? layout;
}

/**
 * Move an instance to `index` of the pane at `path`, from wherever it is now. The instance becomes
 * that pane's active tab, and the pane it left is cleaned as closeInstance cleans it. Inserting
 * first and removing second is what keeps the source path valid: adding a tab changes no path.
 */
export function moveInstance(
    layout: Layout,
    id: string,
    path: number[],
    index: number,
    keep?: KeepRule
): Layout {
    const found = findInstance(layout, id);
    const target = paneAt(layout, path);
    if (found === null || target === null) return layout;
    const instance = found.instance;

    if (samePath(found.path, path)) {
        const rest = target.tabs.filter((_, at) => at !== found.index);
        const at = clamp(index, 0, rest.length);
        const placed = pinnedAt(rest, at, instance);
        const tabs = [...rest.slice(0, at), placed, ...rest.slice(at)];
        return rewrite(layout, path, () => repane(target, tabs, id)) ?? layout;
    }

    const inserted = insertInstance(layout, path, index, instance);
    if (inserted === layout) return layout;
    return removeTab(inserted, found.path, found.index, keep);
}

/**
 * Put an instance at `index` of the pane at `path` and make it that pane's active tab. The index is
 * clamped to the tabs the pane holds, so the end of a strip is any index past them. It is the half
 * of a move that lands the instance, which a move from another page's tree performs on its own.
 */
export function insertInstance(
    layout: Layout,
    path: number[],
    index: number,
    instance: Instance
): Layout {
    const target = paneAt(layout, path);
    if (target === null) return layout;
    const at = clamp(index, 0, target.tabs.length);
    const placed = pinnedAt(target.tabs, at, instance);
    const tabs = [...target.tabs.slice(0, at), placed, ...target.tabs.slice(at)];
    return rewrite(layout, path, () => repane(target, tabs, instance.id)) ?? layout;
}

/**
 * The instance as it lands at `at` among `rest`: pinned when it lands inside the pinned run (a
 * pinned instance also at the run's end), unpinned anywhere else, so a drop decides the pin.
 */
function pinnedAt(rest: readonly Instance[], at: number, instance: Instance): Instance {
    const run = pinnedRun(rest);
    const inside = at < run || (instance.pinned === true && at <= run);
    return inside ? (instance.pinned === true ? instance : pinned(instance)) : unpinned(instance);
}

/**
 * The tree with the pane at `path` locked or unlocked. Unlocking takes the field away rather than
 * setting it false, so a pane that was never locked and one that no longer is read the same. A path
 * naming no pane changes nothing.
 */
export function setLocked(layout: Layout, path: number[], locked: boolean): Layout {
    const pane = paneAt(layout, path);
    if (pane === null) return layout;
    const next: Pane = { ...pane };
    if (locked) next.locked = true;
    else delete next.locked;
    return rewrite(layout, path, () => next) ?? layout;
}

/**
 * The tree with its documents pane marked: the first pane that holds no tab and keeps no kind,
 * which is where a view opened from a workbench lands in first. A tree with no such pane is as it
 * was.
 */
export function markDocuments(layout: Layout): Layout {
    const found = panes(layout).find(
        ({ pane }) => pane.tabs.length === 0 && pane.keeps === undefined
    );
    if (found === undefined) return layout;
    return rewrite(layout, found.path, () => ({ ...found.pane, documents: true })) ?? layout;
}

/**
 * Put a new pane holding `instance` beside the pane at `path`. A pane already inside a split of the
 * same direction gains a sibling there, taking half the pane's share, so a row of panes stays one
 * row; anything else is replaced by a split of itself and the new pane, half each. A split already
 * holding MAX_CHILDREN cannot give a further child MIN_SIZE, so that one nests instead.
 *
 * The new pane comes after the one it was split from, and `before` puts it in front of it instead,
 * which is what a drop on the left or the top edge of a pane asks for. The new pane is added: the
 * page's arrangement did not define it, so it goes with its last tab.
 */
export function splitPane(
    layout: Layout,
    path: number[],
    dir: 'row' | 'col',
    instance: Instance,
    before = false
): Layout {
    const fresh = addedPane({ kind: 'pane', tabs: [instance], active: instance.id });
    return splitLeaf(layout, path, dir, fresh, before);
}

/**
 * Put `fresh` beside the leaf at `path`, which is a pane or a page shown there. It is splitPane
 * over any node a leaf may be: the arithmetic of the share, the direction and the side is the same
 * one, and only what lands beside the leaf differs.
 */
export function splitLeaf(
    layout: Layout,
    path: number[],
    dir: 'row' | 'col',
    fresh: Layout,
    before = false
): Layout {
    if (leafAt(layout, path) === null) return layout;
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
        const split = splitOf(
            dir,
            normaliseSizes(sizes),
            children,
            foldedWith(parent.folded, insert)
        );
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
    if (node?.kind !== 'split') return layout;
    if (sizes.length !== node.children.length) return layout;
    const next = normaliseSizes(sizes);
    const edit = (current: Layout): Layout =>
        current.kind === 'split'
            ? splitOf(current.dir, next, current.children, current.folded)
            : current;
    return rewrite(layout, path, edit) ?? layout;
}

/**
 * Collapse the child at `path` to the edge of the split holding it. The root has no split to fold
 * in, and the last open child of a split stays open: a split showing nothing is not a fold.
 */
export function fold(layout: Layout, path: number[]): Layout {
    if (path.length === 0) return layout;
    const parentPath = path.slice(0, -1);
    const parent = nodeAt(layout, parentPath);
    if (parent?.kind !== 'split') return layout;
    const at = path[path.length - 1];
    if (item(parent.children, at) === undefined || isFolded(parent, at)) return layout;
    if (foldedCount(parent) + 1 >= parent.children.length) return layout;
    const folded = [...(parent.folded ?? []), at];
    const edit = (node: Layout): Layout =>
        node.kind === 'split' ? splitOf(node.dir, node.sizes, node.children, folded) : node;
    return rewrite(layout, parentPath, edit) ?? layout;
}

/** Give the folded child `index` of the split at `path` its share of the split back. */
export function expand(layout: Layout, path: number[], index: number): Layout {
    const split = nodeAt(layout, path);
    if (split?.kind !== 'split' || !isFolded(split, index)) return layout;
    const folded = (split.folded ?? []).filter((one) => one !== index);
    const edit = (node: Layout): Layout =>
        node.kind === 'split' ? splitOf(node.dir, node.sizes, node.children, folded) : node;
    return rewrite(layout, path, edit) ?? layout;
}

/**
 * Expand every folded ancestor of `path`, so the pane it names is on screen. A view opened into a
 * pane nobody can see would look like nothing happening, which is what this is for.
 */
export function expandTo(layout: Layout, path: number[]): Layout {
    let tree = layout;
    for (let depth = 0; depth < path.length; depth += 1) {
        tree = expand(tree, path.slice(0, depth), path[depth]);
    }
    return tree;
}

/** Equal shares, which satisfy MIN_SIZE for any split a valid tree can hold. */
export function equalSizes(count: number): number[] {
    return Array.from({ length: count }, () => 1 / count);
}

/**
 * Sizes that sum to 1 with none below MIN_SIZE. Anything that is not a positive number counts as
 * zero, the rest are scaled to sum to 1, and then each child below the floor is raised to it and
 * the difference taken from the others in proportion. Raising one child can push another below the
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
