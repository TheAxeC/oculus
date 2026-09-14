// Layer 2, client state. Pure operations over one Layout tree live here because tree rewrites
// change independently of workbench focus, docks and persistence.

import { item } from '../../data/guards.ts';
import { findInstance } from '../instance.ts';
import {
    MAX_CHILDREN,
    MIN_SIZE,
    clamp,
    emptyPane,
    samePath,
    type Instance,
    type Layout,
    type Pane,
    type Split
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
    const only = children.at(0);
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
export function removeTab(layout: Layout, path: number[], index: number): Layout {
    const pane = paneAt(layout, path);
    if (pane === null) return layout;
    const removed = item(pane.tabs, index);
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
export function renameInstance(layout: Layout, from: string, to: string): Layout {
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
    if (node?.kind !== 'split') return layout;
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
export function normaliseSizes(raw: number[]): number[] {
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
