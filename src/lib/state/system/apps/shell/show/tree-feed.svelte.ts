// Layer 2, client state. The rows of one tree view of an app, read from the app's host. The host
// keeps the elements of its tree and names each by a handle; this feed asks it for the children of
// a handle when a row opens (`oculus/provide`), keeps the rows it was told, and reads them again
// when the host reports that a handle changed (the `changes` counters of the `app-shell` channel).
// A row the host marks expanded opens the first time it is seen. The empty handle is the root.

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { untrack } from 'svelte';
import { z } from 'zod';
import type { AppTreeState } from '../../../../../data/model/index.ts';
import { readAs } from '../../../../../data/shapes/shapes.ts';
import type { ProvideResult } from '../shell.svelte.ts';

/** `collapsibleState` of VS Code's TreeItem: none, collapsed, expanded. */
const EXPANDED = 2;

const rowShape = z.object({
    handle: z.string(),
    label: z.string(),
    description: z.string().catch(''),
    tooltip: z.string().catch(''),
    iconPath: z.string().catch(''),
    collapsibleState: z.number().catch(0),
    command: z
        .object({ command: z.string(), arguments: z.array(z.unknown()).catch([]) })
        .nullable()
        .catch(null),
    contextValue: z.string().catch(''),
    resource: z.object({ root: z.string(), path: z.string() }).nullable().catch(null)
});

const rowsShape = z.array(rowShape);

/** A row of a tree view as the host described it. */
export type TreeNode = z.infer<typeof rowShape>;

/** A row as it is drawn: the node with its place in the tree. */
export type TreeRow = TreeNode & {
    parent: string | null;
    depth: number;
    /** Whether the row opens, and when it does whether it is open. */
    open: boolean | undefined;
};

/** What the feed needs: the host's registration of the tree, and its answers. */
export type TreeFeedDeps = {
    tree: () => AppTreeState | undefined;
    provide: (kind: 'children' | 'item', handle: string) => Promise<ProvideResult>;
};

export function createTreeFeed(deps: TreeFeedDeps) {
    const nodes = new SvelteMap<string, TreeNode>();
    const children = new SvelteMap<string, string[]>();
    const parents = new Map<string, string>();
    const open = new SvelteSet<string>();
    /** The rows the host marked expanded that were opened already, so a closed one stays closed. */
    const defaulted = new Set<string>();
    /** The newest request per handle, so an older answer arriving late is dropped. */
    const asked = new Map<string, number>();
    let counter = 0;
    let seen: Record<string, number> = {};
    let started = false;
    const state = $state({ failed: '', loaded: false });

    /** Forget a row that left the tree, with every row under it. */
    function drop(handle: string): void {
        for (const child of children.get(handle) ?? []) drop(child);
        children.delete(handle);
        nodes.delete(handle);
        parents.delete(handle);
        open.delete(handle);
        defaulted.delete(handle);
    }

    /** Read the children of a handle again, and those of the rows under it that are open. */
    async function load(handle: string): Promise<void> {
        counter += 1;
        const mine = counter;
        asked.set(handle, mine);
        const done = await deps.provide('children', handle);
        if (asked.get(handle) !== mine) return;
        if (!done.ok) {
            if (handle === '') state.failed = done.word;
            return;
        }
        const rows = readAs(rowsShape, done.value);
        if (rows === null) {
            if (handle === '') state.failed = 'refused:answer';
            return;
        }
        const kept = new Set(rows.map((row) => row.handle));
        for (const gone of children.get(handle) ?? []) {
            if (!kept.has(gone)) drop(gone);
        }
        for (const row of rows) {
            nodes.set(row.handle, row);
            parents.set(row.handle, handle);
        }
        children.set(
            handle,
            rows.map((row) => row.handle)
        );
        if (handle === '') {
            state.failed = '';
            state.loaded = true;
        }
        const below: Promise<void>[] = [];
        for (const row of rows) {
            if (row.collapsibleState === EXPANDED && !defaulted.has(row.handle)) {
                defaulted.add(row.handle);
                open.add(row.handle);
            }
            if (open.has(row.handle)) below.push(load(row.handle));
        }
        await Promise.all(below);
    }

    /** Read one row again, and its children while it is open. */
    async function refresh(handle: string): Promise<void> {
        if (handle === '') return load('');
        if (!nodes.has(handle)) return;
        const done = await deps.provide('item', handle);
        const row = done.ok ? readAs(rowShape, done.value) : null;
        if (row !== null && nodes.has(handle)) nodes.set(handle, row);
        if (open.has(handle)) await load(handle);
    }

    function clear(): void {
        asked.clear();
        children.clear();
        nodes.clear();
        parents.clear();
        open.clear();
        defaulted.clear();
        seen = {};
        started = false;
        state.failed = '';
        state.loaded = false;
    }

    /** Follow the host's registration: read the root when it appears, a handle when it changes. */
    $effect(() => {
        const tree = deps.tree();
        const changes = tree?.changes;
        untrack(() => {
            if (tree === undefined || changes === undefined) {
                clear();
                return;
            }
            if (!started) {
                started = true;
                seen = { ...changes };
                void load('');
                return;
            }
            for (const [handle, count] of Object.entries(changes)) {
                if (seen[handle] === count) continue;
                seen[handle] = count;
                void refresh(handle);
            }
        });
    });

    /** The rows now drawn, depth first, the children of a row that is open under it. */
    function rows(): TreeRow[] {
        const drawn: TreeRow[] = [];
        const walk = (handle: string, depth: number): void => {
            for (const child of children.get(handle) ?? []) {
                const node = nodes.get(child);
                if (node === undefined) continue;
                const opens = node.collapsibleState !== 0;
                drawn.push({
                    ...node,
                    parent: handle === '' ? null : handle,
                    depth,
                    open: opens ? open.has(child) : undefined
                });
                if (opens && open.has(child)) walk(child, depth + 1);
            }
        };
        walk('', 0);
        return drawn;
    }

    /** Open a row, reading its children when they are not held; whether it is open now. */
    function expand(handle: string): void {
        if (open.has(handle)) return;
        open.add(handle);
        defaulted.add(handle);
        if (!children.has(handle)) void load(handle);
    }

    /** Open a row or close it; whether it is open now. */
    function toggle(handle: string): boolean {
        if (open.has(handle)) {
            open.delete(handle);
            return false;
        }
        expand(handle);
        return true;
    }

    /** Open every row on the way to a handle the host asked to show; whether the feed holds it. */
    function reveal(handle: string): boolean {
        if (!nodes.has(handle)) return false;
        for (let up = parents.get(handle); up !== undefined && up !== ''; up = parents.get(up)) {
            expand(up);
        }
        return true;
    }

    return {
        rows,
        toggle,
        reveal,
        collapseAll: (): void => open.clear(),
        nodeOf: (handle: string): TreeNode | undefined => nodes.get(handle),
        /** The word the root was refused with, or the empty string. */
        failed: (): string => state.failed,
        /** Whether the root has been read. */
        loaded: (): boolean => state.loaded
    };
}
