// Layer 2, client state. A saved layout carried to the views and pages the rail has now: a saved
// `config` tab, whose view is gone, becomes a `settings` tab, and a saved `changes` or `agents`
// tab, whose views became sections of the Session view, becomes a `session-detail` tab. fold.ts
// carries the saved info page into the System page.
//
// The step runs over a layout that has been read part by part and not yet settled (parseLayout
// calls it before settlePageLeaves), and answers a layout it has nothing to change unchanged, so
// reading a migrated layout again changes nothing.

import { stateId } from '../instance.ts';
import { pageLeaf, type Instance, type Layout, type Pages, type Pane } from '../model.ts';

/** What a retired view becomes: the view that holds its content now, and how its tab is carried. */
type Successor = {
    view: string;
    /** The tab as the successor view's tab. */
    carry: (tab: Instance) => Instance;
    /** Whether a tab of the successor view already shows what the retired tab showed. */
    shows: (held: Instance, retired: Instance) => boolean;
};

/** A retired view's tab as a Session tab: its id and its pin stay. */
const SESSION: Successor = {
    view: 'session-detail',
    carry: (tab) => ({ ...tab, view: 'session-detail' }),
    shows: (held, retired) => stateId(held.state) === stateId(retired.state)
};

/** The retired views by id. */
const RETIRED: Record<string, Successor> = {
    config: {
        view: 'settings',
        carry: (tab) => ({ ...tab, view: 'settings', state: null }),
        shows: () => true
    },
    changes: SESSION,
    agents: SESSION
};

/** The successor of a retired view, or undefined for any other name (an inherited one included). */
function successorOf(view: string): Successor | undefined {
    return Object.hasOwn(RETIRED, view) ? RETIRED[view] : undefined;
}

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
 * The pane with its retired tabs carried over: a tab keeps its id and becomes a tab of the view
 * that took its place (RETIRED), and one beside a tab of that view showing the same thing, a tab
 * carried before it included, is dropped. The pane's active tab becomes the tab that shows what
 * the dropped one did when the one dropped was active.
 */
function paneWithoutRetired(pane: Pane): Pane {
    if (!pane.tabs.some((tab) => successorOf(tab.view) !== undefined)) return pane;
    const tabs: Instance[] = [];
    const successors = new Map<string, string>();
    for (const tab of pane.tabs) {
        const successor = successorOf(tab.view);
        if (successor === undefined) {
            tabs.push(tab);
            continue;
        }
        const held = [...tabs, ...pane.tabs].find(
            (one) => one.view === successor.view && successor.shows(one, tab)
        );
        if (held === undefined) tabs.push(successor.carry(tab));
        else successors.set(tab.id, held.id);
    }
    return { ...pane, tabs, active: successors.get(pane.active) ?? pane.active };
}

/** The tree with every retired tab carried over (see paneWithoutRetired). */
export function treeWithoutRetired(root: Layout): Layout {
    return mapTree(root, paneWithoutRetired, (page) => page);
}

/** The pages and floats with every retired tab carried over. */
export function withoutRetiredTabs(held: Pages): Pages {
    return {
        ...held,
        pages: held.pages.map((page) => ({
            ...page,
            workbench: { ...page.workbench, root: treeWithoutRetired(page.workbench.root) }
        })),
        floats: held.floats.map((float) => ({ ...float, pane: paneWithoutRetired(float.pane) }))
    };
}
