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

/**
 * The view a pane's tab mounts. The view registry (O8) is its vocabulary. A saved layout may name a
 * view the registry does not hold, from an older or a newer version of the app, and the shell shows
 * an empty pane for it rather than refusing the whole arrangement.
 */
export type ViewId = string;

export type Instance = { id: string; view: ViewId; state: unknown };

export type Split = { kind: 'split'; dir: 'row' | 'col'; sizes: number[]; children: Layout[] };
export type Pane = { kind: 'pane'; tabs: Instance[]; active: string };
export type Layout = Split | Pane;

/** The smallest share of a split one child may hold, so a drag can never take a pane to nothing. */
export const MIN_SIZE = 0.1;

/** The most children a split can hold and still give each of them MIN_SIZE. */
export const MAX_CHILDREN = Math.floor(1 / MIN_SIZE);

/** The envelope version serialiseLayout writes and parseLayout demands. */
export const LAYOUT_VERSION = 1;

/** Sizes must sum to 1 within this; a float sum of ten tenths is not exactly 1. */
const SUM_EPS = 1e-6;

/** The slack a size is allowed below MIN_SIZE, for the same reason. */
const EPS = 1e-9;

function isRecord(value: unknown): value is Record<string, unknown> {
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

/** Every pane with its path, depth first, left to right. */
export function panes(layout: Layout): { path: number[]; pane: Pane }[] {
    const found: { path: number[]; pane: Pane }[] = [];
    const walk = (node: Layout, path: number[]): void => {
        if (node.kind === 'pane') {
            found.push({ path, pane: node });
            return;
        }
        node.children.forEach((child, index) => walk(child, [...path, index]));
    };
    walk(layout, []);
    return found;
}

/** The instance with this id, the path of the pane holding it and its index in that pane's tabs. */
export function findInstance(
    layout: Layout,
    id: string
): { instance: Instance; path: number[]; index: number } | null {
    for (const { path, pane } of panes(layout)) {
        const index = pane.tabs.findIndex((tab) => tab.id === id);
        const instance = pane.tabs[index];
        if (instance !== undefined) return { instance, path, index };
    }
    return null;
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
 */
export function splitPane(
    layout: Layout,
    path: number[],
    dir: 'row' | 'col',
    instance: Instance
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
        const children = [
            ...parent.children.slice(0, at + 1),
            fresh,
            ...parent.children.slice(at + 1)
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
        children: [node, fresh]
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

/** The saved form: the envelope, so a later version can be told apart from this one. */
export function serialiseLayout(layout: Layout): string {
    return JSON.stringify({ version: LAYOUT_VERSION, layout });
}

/**
 * The tree in a saved envelope, or null when anything about it is wrong: another version, a broken
 * shape, or an invariant a hand edit or an older release left violated. A tree that fails here never
 * reaches the shell, which is why the shell never checks the shape of what it renders. A string is
 * read as JSON first, so the caller can hand over what storage returned.
 */
export function parseLayout(value: unknown): Layout | null {
    let envelope: unknown = value;
    if (typeof envelope === 'string') {
        try {
            envelope = JSON.parse(envelope);
        } catch {
            return null;
        }
    }
    if (!isRecord(envelope) || envelope.version !== LAYOUT_VERSION) return null;
    const problems: string[] = [];
    const tree = readNode(envelope.layout, [], problems, new Set());
    return problems.length === 0 ? tree : null;
}
