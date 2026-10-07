// Layer 2, client state, pure. The tree the References view draws for Show Call Hierarchy and Show
// Type Hierarchy: the symbols a language server named at the caret, each opened one level at a
// time into the calls into it or out of it (`callHierarchy/incomingCalls`, `outgoingCalls`) or the
// types above and below it (`typeHierarchy/supertypes`, `subtypes`).
//
// A node keeps the protocol's own item, which the server is handed back to name the node's
// children, and the place a press opens: a call into the node's symbol opens the first call in the
// caller, and any other node opens its own symbol. A node whose file is a library file a server
// named has no root, and its `path` is the library address, as in references.ts; an item with an
// address the page cannot open is left out.

import { z } from 'zod';
import { libraryOf, placeOf } from '../../../../data/prose/lsp-addresses.ts';
import { anyNumberShape, rowsShape } from '../../../../data/shapes/shapes.ts';

/**
 * Which way a hierarchy is read: the calls into a symbol or out of it, the types above or below.
 */
export type HierarchyDirection = 'incoming' | 'outgoing' | 'supertypes' | 'subtypes';

/** The two directions each kind of hierarchy has, the one it starts with first. */
export const DIRECTIONS = {
    calls: ['incoming', 'outgoing'],
    types: ['supertypes', 'subtypes']
} as const satisfies Record<'calls' | 'types', readonly HierarchyDirection[]>;

/** One node of the tree. */
export type RefNode = {
    /** The node's place in the tree: its parent's id and its own number among the parent's. */
    id: string;
    parent: string | null;
    name: string;
    /** What the server says about the symbol, such as its signature or its container. */
    detail: string;
    root: string;
    path: string;
    /** The file's own name, for a node in a library file. */
    library?: string;
    /** Where a press opens, lines and columns counted from one. */
    line: number;
    column: number;
    /** The protocol's item, handed back to the server to ask for the node's children. */
    item: unknown;
    open: boolean;
    /** Whether the node's children were asked for. */
    loaded: boolean;
};

/** The tree and the direction it is read in. */
export type Hierarchy = { direction: HierarchyDirection; nodes: RefNode[] };

/** What a server named: an item and, for a call, the ranges of the calls in the file named. */
export type HierarchyEntry = { item: unknown; ranges: unknown[] };

const nodeShape = z.object({
    id: z.string(),
    parent: z.string().nullable(),
    name: z.string(),
    detail: z.string().catch(''),
    root: z.string(),
    path: z.string(),
    library: z.string().optional().catch(undefined),
    line: anyNumberShape.catch(1),
    column: anyNumberShape.catch(1),
    item: z.unknown(),
    open: z.boolean().catch(false),
    loaded: z.boolean().catch(false)
}) satisfies z.ZodType<RefNode>;

export const hierarchyShape = z.object({
    direction: z.enum(['incoming', 'outgoing', 'supertypes', 'subtypes']),
    nodes: rowsShape(nodeShape)
}) satisfies z.ZodType<Hierarchy>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The line and character a range of the protocol starts at, from zero, or null. */
function startOf(range: unknown): { line: number; character: number } | null {
    if (!isRecord(range) || !isRecord(range.start)) return null;
    const { line, character } = range.start;
    return typeof line === 'number' && typeof character === 'number' ? { line, character } : null;
}

/**
 * The node an entry makes under a parent, or null for an item with no name or an address the page
 * cannot open. The place a press opens is the first of the entry's ranges when it has one, as the
 * calls of an incoming entry do, and the item's own name otherwise.
 */
function nodeOf(parent: RefNode | null, index: number, entry: HierarchyEntry): RefNode | null {
    const { item } = entry;
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.uri !== 'string') {
        return null;
    }
    const library = libraryOf(item.uri);
    const place = library === null ? placeOf(item.uri) : null;
    if (library === null && place === null) return null;
    const at = startOf(entry.ranges[0]) ?? startOf(item.selectionRange) ?? startOf(item.range);
    return {
        id: `${parent?.id ?? ''}/${index}`,
        parent: parent?.id ?? null,
        name: item.name,
        detail: typeof item.detail === 'string' ? item.detail : '',
        ...(library === null
            ? { root: place?.root ?? '', path: place?.path ?? '' }
            : { root: '', path: library.library, library: library.name }),
        line: (at?.line ?? 0) + 1,
        column: (at?.character ?? 0) + 1,
        item,
        open: false,
        loaded: false
    };
}

/** The nodes of the entries a server named under a parent, in the order given. */
export function nodesOf(parent: RefNode | null, entries: readonly HierarchyEntry[]): RefNode[] {
    return entries.flatMap((entry, index) => nodeOf(parent, index, entry) ?? []);
}

/** The tree with a node's children added and the node opened; an unknown node changes nothing. */
export function withChildren(
    nodes: readonly RefNode[],
    id: string,
    children: readonly RefNode[]
): RefNode[] {
    return nodes
        .filter((node) => node.parent !== id)
        .flatMap((node) =>
            node.id === id ? [{ ...node, open: true, loaded: true }, ...children] : [node]
        );
}

/** The tree with a node opened or closed. */
export function toggled(nodes: readonly RefNode[], id: string): RefNode[] {
    return nodes.map((node) => (node.id === id ? { ...node, open: !node.open } : node));
}

/** One row of the tree as drawn: the node and how deep it is. */
export type NodeRow = { node: RefNode; depth: number };

/**
 * The rows of the tree in the order drawn: a node's children follow it, none under a closed one.
 */
export function rowsOf(nodes: readonly RefNode[]): NodeRow[] {
    const rows: NodeRow[] = [];
    const walk = (parent: string | null, depth: number): void => {
        for (const node of nodes.filter((one) => one.parent === parent)) {
            rows.push({ node, depth });
            if (node.open) walk(node.id, depth + 1);
        }
    };
    walk(null, 0);
    return rows;
}

/** The place a node's press opens, as a reference's. */
export function pickOf(node: RefNode): {
    root: string;
    path: string;
    library?: string;
    line: number;
    column: number;
} {
    return {
        root: node.root,
        path: node.path,
        ...(node.library === undefined ? {} : { library: node.library }),
        line: node.line,
        column: node.column
    };
}
