// Layer 2, client state. A saved layout carried to the pages the rail has now: a saved `config`
// tab, whose view is gone, becomes a `settings` tab. fold.ts carries the saved info page into the
// System page.
//
// The step runs over a layout that has been read part by part and not yet settled (parseLayout
// calls it before settlePageLeaves), and answers a layout it has nothing to change unchanged, so
// reading a migrated layout again changes nothing.

import { pageLeaf, type Instance, type Layout, type Pages, type Pane } from '../model.ts';

const RETIRED_VIEW = 'config';
const SETTINGS_VIEW = 'settings';

/** The tree with each pane replaced by `edit`'s answer and each page leaf by `leaf`'s. */
export function mapTree(
    node: Layout,
    edit: (pane: Pane) => Pane,
    leaf: (page: string) => string
): Layout {
    if (node.kind === 'pane') return edit(node);
    if (node.kind === 'page') return pageLeaf(leaf(node.page));
    return { ...node, children: node.children.map((child) => mapTree(child, edit, leaf)) };
}

/**
 * The pane with its `config` tabs carried over: a tab keeps its id and becomes a `settings` tab
 * with no state, and one beside a `settings` tab of the same pane is dropped. The pane's active tab
 * becomes the `settings` tab when the one dropped was active.
 */
function paneWithoutConfig(pane: Pane): Pane {
    if (!pane.tabs.some((tab) => tab.view === RETIRED_VIEW)) return pane;
    const settings = pane.tabs.find((tab) => tab.view === SETTINGS_VIEW);
    const tabs: Instance[] = [];
    for (const tab of pane.tabs) {
        if (tab.view !== RETIRED_VIEW) tabs.push(tab);
        else if (settings === undefined) tabs.push({ ...tab, view: SETTINGS_VIEW, state: null });
    }
    const dropped = settings !== undefined && !tabs.some((tab) => tab.id === pane.active);
    return { ...pane, tabs, active: dropped ? settings.id : pane.active };
}

/** The tree with every `config` tab carried over (see paneWithoutConfig). */
export function treeWithoutConfig(root: Layout): Layout {
    return mapTree(root, paneWithoutConfig, (page) => page);
}

/** The pages and floats with every `config` tab carried over. */
export function withoutConfigTabs(held: Pages): Pages {
    return {
        ...held,
        pages: held.pages.map((page) => ({
            ...page,
            workbench: { ...page.workbench, root: treeWithoutConfig(page.workbench.root) }
        })),
        floats: held.floats.map((float) => ({ ...float, pane: paneWithoutConfig(float.pane) }))
    };
}
