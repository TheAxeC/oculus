// Layer 2, client state. Instance identities and tree lookups, independent of tree mutations and
// storage.

import type { Instance, Layout, Pane, ViewId } from '../workbench/layout/index.ts';
import { item } from '../../data/helpers/guards.ts';

/** The card id held by an instance, or null when keyboard navigation has selected none. */
export function cardCursor(state: unknown): string | null {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
    const cursor = (state as Record<string, unknown>).cursor;
    return typeof cursor === 'string' && cursor !== '' ? cursor : null;
}

/** Preserve a view's own state while setting or removing its held card cursor. */
export function withCardCursor(state: unknown, cursor: string | null): unknown {
    if (cursor !== null) {
        const held =
            typeof state === 'object' && state !== null && !Array.isArray(state)
                ? (state as Record<string, unknown>)
                : {};
        return { ...held, cursor };
    }
    if (
        typeof state !== 'object' ||
        state === null ||
        Array.isArray(state) ||
        !Object.hasOwn(state, 'cursor')
    ) {
        return state;
    }
    const held = { ...(state as Record<string, unknown>) };
    delete held.cursor;
    return held;
}

/** Keep a cursor across a card-list render, clearing it only when its id is no longer present. */
export function reconcileCardCursor(state: unknown, cards: readonly string[]): unknown {
    const cursor = cardCursor(state);
    return cursor === null || cards.includes(cursor) ? state : withCardCursor(state, null);
}

/**
 * The state a bookmarked document is opened with. The `id` is what makes two bookmarks two tabs: a
 * state carrying one names which instance is wanted, so a second press on the same bookmark
 * activates the tab it already has and a press on another one opens a second tab beside it.
 *
 * It lives here rather than beside the rail because the rail and the file browser both open a
 * bookmark, and the same document opened from the two would otherwise be two tabs.
 */
export function documentState(mark: { label: string; root: string; path: string }): {
    id: string;
    root: string;
    path: string;
    label: string;
} {
    return {
        id: `${mark.root}/${mark.path}`,
        root: mark.root,
        path: mark.path,
        label: mark.label
    };
}

/**
 * A fresh instance of a view, with the id every operation addresses it by. The state is the view's
 * own and is empty unless the opener has something to say: the editor is opened for one project, so
 * the card that opens it hands over which.
 */
export function newInstance(view: ViewId, state: unknown = {}): Instance {
    return { id: crypto.randomUUID(), view, state };
}

/**
 * The path of the pane an opened view lands in: the pane holding the instance that was last
 * activated, and the first pane when that instance is gone or none has been activated yet.
 */
export function activePath(layout: Layout, id: string | null): number[] {
    if (id !== null && id !== '') {
        const found = findInstance(layout, id);
        if (found !== null) return found.path;
    }
    return panes(layout)[0]?.path ?? [];
}

/**
 * The identity an instance state carries, or null for a state that carries none. A project uses
 * `id`; a session or terminal pin uses `session`; a local file uses its root and path. Each makes
 * two records two instances of one registered view, while opening the same record again activates
 * its existing instance.
 */
export function stateId(state: unknown): string | null {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
    const held = state as Record<string, unknown>;
    if (typeof held.id === 'string' && held.id !== '') return held.id;
    if (typeof held.session === 'string' && held.session !== '') return held.session;
    if (
        typeof held.root === 'string' &&
        held.root !== '' &&
        typeof held.path === 'string' &&
        held.path !== ''
    ) {
        return JSON.stringify([held.root, held.path]);
    }
    return null;
}

/** Whether a tab has this view and identity. An omitted identity matches every instance. */
export function isInstanceOf(tab: Instance, view: ViewId, id?: string | null): boolean {
    if (tab.view !== view) return false;
    return id === undefined || stateId(tab.state) === id;
}

/**
 * The instance of this view in the tree, or null when the tree holds none. An omitted identity
 * finds any instance, an explicit null finds the unpinned one, and a string finds that record's
 * instance.
 */
export function findView(layout: Layout, view: ViewId, id?: string | null): Instance | null {
    for (const { pane } of panes(layout)) {
        const found = pane.tabs.find((tab) => isInstanceOf(tab, view, id));
        if (found !== undefined) return found;
    }
    return null;
}

/** Every pane with its path, depth first, left to right. */
export function panes(layout: Layout): { path: number[]; pane: Pane }[] {
    const found: { path: number[]; pane: Pane }[] = [];
    const walk = (node: Layout, path: number[]): void => {
        if (node.kind === 'pane') {
            found.push({ path, pane: node });
            return;
        }
        // A page leaf holds no pane of its own: the panes it shows are the named page's, and they
        // are found by walking that page's tree.
        if (node.kind !== 'split') return;
        node.children.forEach((child, index) => walk(child, [...path, index]));
    };
    walk(layout, []);
    return found;
}

/**
 * Every tab of one tree, pane by pane in the order panes walks them. A page leaf contributes none:
 * the tabs it shows belong to the page it names, and are that page's tree's tabs.
 */
export function tabsOf(layout: Layout): Instance[] {
    return panes(layout).flatMap(({ pane }) => pane.tabs);
}

/** The instance with this id, the path of the pane holding it and its index in that pane's tabs. */
export function findInstance(
    layout: Layout,
    id: string
): { instance: Instance; path: number[]; index: number } | null {
    for (const { path, pane } of panes(layout)) {
        const index = pane.tabs.findIndex((tab) => tab.id === id);
        const instance = item(pane.tabs, index);
        if (instance !== undefined) return { instance, path, index };
    }
    return null;
}
