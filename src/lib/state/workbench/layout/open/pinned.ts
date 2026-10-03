// Layer 2, client state. The pinned tab: the two rewrites that pin a tab and take its pin off.
//
// A pinned tab sits at the start of its pane's strip, in the order it was pinned in, and stays open
// when the rest of the pane is closed. Pinning is the flag, as keeping a preview is, and `repane`
// holds the pinned tabs first, so these rewrites only decide where in the run a tab lands.

import { findInstance } from '../instance.ts';
import { rewrite } from '../tree.ts';
import { pinned, pinnedRun, repane, unpinned, type Instance, type Layout } from '../model.ts';

/** Whether a tab is pinned. */
function isPinnedTab(instance: Instance): boolean {
    return instance.pinned === true;
}

/**
 * The tree with one tab pinned: it joins the end of its pane's pinned run and stops being a
 * preview. A tab already pinned changes nothing.
 */
export function pinTab(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null || isPinnedTab(found.instance)) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const run = pinnedRun(node.tabs);
        const rest = node.tabs.filter((tab) => tab.id !== id);
        const tabs = [...rest.slice(0, run), pinned(found.instance), ...rest.slice(run)];
        return repane(node, tabs, node.active);
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/**
 * The tree with one tab's pin taken off: it becomes the first tab after the pinned run, which is
 * where it already is when it ended the run.
 */
export function unpinTab(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null || !isPinnedTab(found.instance)) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const rest = node.tabs.filter((tab) => tab.id !== id);
        const run = pinnedRun(rest);
        const tabs = [...rest.slice(0, run), unpinned(found.instance), ...rest.slice(run)];
        return repane(node, tabs, node.active);
    };
    return rewrite(layout, found.path, edit) ?? layout;
}
