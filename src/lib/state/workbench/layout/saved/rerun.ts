// Layer 2, client state. Running a store operation again on an arrangement another page or window
// saved. The layout factory runs every operation under its own name (`named`), so a save inside it
// is recorded as written by that operation, and keeps the last operation that saved. When the
// server refused this page's save, made from an envelope another page had moved on from, or
// another page's save replaced a change of this page not yet sent (`again` of saved/load.ts), the
// operation is run again on the arrangement now current, so both changes are kept.
//
// An operation is one save: the arrangement it makes current is written once, when the operation
// returns, however many steps of it changed the pages, so the server is asked one turn for it.
//
// A path argument names a node of the tree the operation first ran on, and in the arrangement the
// other page saved the same path can name another node. So the node a path names is described when
// the operation first runs, by what it held, and named again in the new arrangement by that
// description before the operation runs there: a pane by its tabs (the pane holding the most of
// them, the one holding the pane's active tab among equals), a page shown in the tree by the page,
// a split by the set of tabs and pages under it, and a pane with no tab by its place, while the
// same empty pane stands there. An operation whose node the other page removed finds none and is
// dropped, never applied to another node, and the arrangement taken is saved as it stands.

import { nodeAt } from '../tree.ts';
import type { Host, Layout } from '../model.ts';

/**
 * Where an operation's arguments name a node: the index of the path, of the page or float it
 * addresses, and, for an operation that names a child of a split by the split's path and the
 * child's index, the index of that child's index.
 */
type PathArgs = { path: number; page: number; child?: number };

/** The store operations that take a path, by name. */
const PATH_OPERATIONS: Readonly<Record<string, PathArgs>> = {
    closePane: { path: 0, page: 1 },
    transferInstance: { path: 1, page: 3 },
    splitInstance: { path: 1, page: 3 },
    embedPage: { path: 1, page: 3 },
    unembedPage: { path: 0, page: 1 },
    maximisePane: { path: 0, page: 1 },
    foldPane: { path: 0, page: 1 },
    expandChild: { path: 0, child: 1, page: 2 },
    resizeSplit: { path: 0, page: 2 },
    lockPane: { path: 0, page: 2 },
    openInPane: { path: 3, page: 2 },
    floatPane: { path: 0, page: 1 },
    windowPane: { path: 0, page: 2 }
};

/** What a node held when an operation named it by its path. */
type NodeName =
    | { kind: 'pane'; tabs: string[]; active: string }
    | { kind: 'empty'; path: number[]; node: Layout }
    | { kind: 'page'; page: string }
    | { kind: 'split'; leaves: string[] };

/** The tabs and the pages under a node, each as one key, in a fixed order. */
function leavesOf(node: Layout): string[] {
    if (node.kind === 'pane') return node.tabs.map((tab) => `tab:${tab.id}`);
    if (node.kind === 'page') return [`page:${node.page}`];
    return node.children.flatMap(leavesOf).sort();
}

/** What the node at a path holds, or null when the path names nothing. */
function nameNode(tree: Layout, path: number[]): NodeName | null {
    const node = nodeAt(tree, path);
    if (node === null) return null;
    if (node.kind === 'page') return { kind: 'page', page: node.page };
    if (node.kind === 'split') return { kind: 'split', leaves: leavesOf(node) };
    if (node.tabs.length === 0) return { kind: 'empty', path, node };
    return { kind: 'pane', tabs: node.tabs.map((tab) => tab.id), active: node.active };
}

/** Every node of a tree with its path, depth first, left to right. */
function nodesOf(tree: Layout): { path: number[]; node: Layout }[] {
    const found: { path: number[]; node: Layout }[] = [];
    const walk = (node: Layout, path: number[]): void => {
        found.push({ path, node });
        if (node.kind === 'split') node.children.forEach((child, at) => walk(child, [...path, at]));
    };
    walk(tree, []);
    return found;
}

/** The path of the node a name describes in a tree, or null when the tree holds none. */
function findNamed(tree: Layout, name: NodeName): number[] | null {
    if (name.kind === 'empty') {
        const there = nodeAt(tree, name.path);
        return there !== null && JSON.stringify(there) === JSON.stringify(name.node)
            ? name.path
            : null;
    }
    const nodes = nodesOf(tree);
    if (name.kind === 'page') {
        return (
            nodes.find(({ node }) => node.kind === 'page' && node.page === name.page)?.path ?? null
        );
    }
    if (name.kind === 'split') {
        const wanted = name.leaves.join('\n');
        const same = nodes.find(
            ({ node }) => node.kind === 'split' && leavesOf(node).join('\n') === wanted
        );
        return same?.path ?? null;
    }
    let best: { path: number[]; score: number } | null = null;
    for (const { path, node } of nodes) {
        if (node.kind !== 'pane') continue;
        const ids = node.tabs.map((tab) => tab.id);
        const shared = name.tabs.filter((id) => ids.includes(id)).length;
        // A pane holding the active tab of the pane named wins among panes holding as many.
        const score = shared * 2 + (ids.includes(name.active) ? 1 : 0);
        if (shared > 0 && (best === null || score > best.score)) best = { path, score };
    }
    return best?.path ?? null;
}

/**
 * The arguments an operation is run again with, named again in the arrangement now current, or null
 * when the node its path named is gone from it. It is made when the operation first runs, so the
 * names describe the tree that run was given.
 */
type Again = () => unknown[] | null;

/** How an operation is run again, from its name and its arguments when it first ran. */
function againWith(name: string, args: unknown[], at: (page?: string) => Host | null): Again {
    const where = Object.hasOwn(PATH_OPERATIONS, name) ? PATH_OPERATIONS[name] : undefined;
    if (where === undefined) return () => args;
    const page = args[where.page];
    const host = at(typeof page === 'string' ? page : undefined);
    const path = args[where.path];
    const child = where.child === undefined ? undefined : args[where.child];
    if (host === null || !Array.isArray(path)) return () => args;
    const target = typeof child === 'number' ? [...(path as number[]), child] : (path as number[]);
    const named = nameNode(host.workbench.root, target);
    return () => {
        const now = at(typeof page === 'string' ? page : undefined);
        if (named === null || now === null) return null;
        const found = findNamed(now.workbench.root, named);
        if (found === null) return null;
        const next = [...args];
        if (where.child === undefined) {
            next[where.path] = found;
        } else {
            if (found.length === 0) return null;
            next[where.path] = found.slice(0, -1);
            next[where.child] = found[found.length - 1];
        }
        return next;
    };
}

/** What the runs read of the factory: the host an operation addresses. */
export type RunsDeps = {
    at: (page?: string) => Host | null;
};

/** The store's operations run by name, and the last one that saved, run again on request. */
export type Runs = {
    /** The name of the operation being run, and the empty text between operations. */
    writing: () => string;
    /**
     * Save the pages: `write` writes the arrangement now current. Inside an operation the write is
     * held until the operation returns, and the last one held is the one made.
     */
    saved: (write: () => void) => void;
    /** Run the last operation that saved again, on the pages now current, its paths named again. */
    again: () => void;
    /**
     * Run every operation under its own name, so a save inside it is recorded as written by that
     * operation. An operation that calls another keeps the name of the one the caller invoked.
     */
    named: <T extends Record<string, unknown>>(operations: T) => T;
};

export function createRuns(deps: RunsDeps): Runs {
    let writing = '';
    let saves = 0;
    /** The write an operation being run holds until it returns. */
    let held: (() => void) | null = null;

    /** Make the write an operation held. */
    function flush(): void {
        const write = held;
        held = null;
        write?.();
    }
    /** The last operation that saved the pages, with how it is run again; false when dropped. */
    let lastSaving: { name: string; again: () => boolean } | null = null;

    /**
     * Run an operation again with its arguments named again, or not at all when its node is gone.
     */
    function rerun(
        run: (...args: unknown[]) => unknown,
        again: Again
    ): { ran: boolean; answer?: unknown } {
        const args = again();
        if (args === null) return { ran: false };
        const answer = run(...args);
        flush();
        return { ran: true, answer };
    }

    function named<T extends Record<string, unknown>>(operations: T): T {
        const wrapped = Object.entries(operations).map(([name, operation]) => {
            if (typeof operation !== 'function') return [name, operation];
            const run = operation as (...args: unknown[]) => unknown;
            return [
                name,
                (...args: unknown[]): unknown => {
                    if (writing !== '') return run(...args);
                    writing = name;
                    const before = saves;
                    try {
                        const again = againWith(name, args, deps.at);
                        const answer = run(...args);
                        flush();
                        if (saves !== before) {
                            lastSaving = { name, again: () => rerun(run, again).ran };
                        }
                        return answer;
                    } finally {
                        flush();
                        writing = '';
                    }
                }
            ];
        });
        return Object.fromEntries(wrapped) as T;
    }

    return {
        writing: () => writing,
        saved: (write) => {
            saves += 1;
            if (writing === '') write();
            else held = write;
        },
        again: () => {
            if (lastSaving === null || writing !== '') return;
            writing = lastSaving.name;
            try {
                // An operation whose node is gone is dropped, and the arrangement taken stands.
                lastSaving.again();
            } finally {
                flush();
                writing = '';
            }
        },
        named
    };
}
