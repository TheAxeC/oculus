// Layer 2, client state. Workbench and focus operations live here because they change the active
// arrangement rather than its saved representation.

import { findInstance } from '../instance.ts';
import { samePath, type Edge, type Focus, type Instance, type Workbench } from './model.ts';
import { closeInstance, leafAt, paneAt, renameInstance, splitPane } from './tree.ts';

// ---------------------------------------------------------------------------------------------
// Operations on the whole workbench
//
// A page is one tree, so everything below the focus is a tree operation on `root`. What is left
// here takes the arrangement because it reads or writes the maximised pane beside the tree. Each of
// them returns its argument unchanged when it names no pane or no instance, which is the same rule
// the one-tree operations follow for a stale path.

/** The maximised pane, or null when none is or the one that was is gone. */
export function focusedPane(workbench: Workbench): Focus | null {
    const focus = workbench.focus;
    if (focus === undefined) return null;
    return paneAt(workbench.root, focus.path) === null ? null : focus;
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
 * Split the pane at `path` and put an instance alone in the new pane, taking it out of the pane
 * that holds it. A drop on the left or the right edge makes a row and one on the top or the bottom
 * edge a column, with the new pane before the split one for `left` and `top`.
 *
 * The split has to happen first: removing the instance can empty its pane and collapse a split,
 * which would leave `path` naming another node. The new pane therefore holds the instance under a
 * temporary id until the original is gone, so the tree never holds the id twice.
 */
export function splitWith(workbench: Workbench, id: string, path: number[], edge: Edge): Workbench {
    const found = findInstance(workbench.root, id);
    if (found === null) return workbench;
    // A page leaf takes a neighbour as a pane does, so a drop on its edge lands beside it.
    if (leafAt(workbench.root, path) === null) return workbench;
    const dir: 'row' | 'col' = edge === 'left' || edge === 'right' ? 'row' : 'col';
    const before = edge === 'left' || edge === 'top';

    const holder = paneAt(workbench.root, found.path);
    const alone = holder !== null && holder.tabs.length === 1;
    // Splitting a pane away from its own only tab would put the pane back where it already is.
    if (alone && samePath(found.path, path)) return workbench;

    const temporary: Instance = { ...found.instance, id: `${id}#moving` };
    let tree = splitPane(workbench.root, path, dir, temporary, before);
    tree = closeInstance(tree, id);
    tree = renameInstance(tree, temporary.id, id);
    return settleFocus({ ...workbench, root: tree });
}

/** Show one pane alone. A path naming no pane leaves the arrangement as it was. */
export function maximise(workbench: Workbench, path: number[]): Workbench {
    if (paneAt(workbench.root, path) === null) return workbench;
    return { ...workbench, focus: { path: [...path] } };
}

/** Show every pane again. */
export function restore(workbench: Workbench): Workbench {
    if (workbench.focus === undefined) return workbench;
    return { root: workbench.root };
}
