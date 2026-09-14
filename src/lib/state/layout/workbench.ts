// Layer 2, client state. Workbench, focus and dock operations live here because they change the
// active arrangement rather than its saved representation.

import { findInstance } from '../instance.ts';
import {
    clamp,
    samePath,
    type Edge,
    type Focus,
    type Instance,
    type Layout,
    type Target,
    type Workbench
} from './model.ts';
import {
    closeInstance,
    moveInstance,
    paneAt,
    removeTab,
    renameInstance,
    rewrite,
    splitPane
} from './tree.ts';

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
