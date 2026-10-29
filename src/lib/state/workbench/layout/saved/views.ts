// Layer 2, client state. The views a saved rail page is given when it is restored. A page made from
// the config has the views of its arrangement (config/defaults/layout.yml `arrangements:`); a saved
// page that lacks a view its arrangement shows gains a tab of that view here, once, pinned with the
// pinned tabs of its pane, and the page records the views it has been given (`Page.views`), so a
// view added to the arrangement later is given once and a tab of it the reader closes stays
// closed. A page saved with no record is given every view of its arrangement it lacks, once, as a
// page with no document record is given every document (saved/docs.ts).

import { parseArrangement } from '../../navigation/arrangement.ts';
import { newInstance, panes, tabsOf, viewIds } from '../instance.ts';
import { pinned, pinnedRun, type Layout, type Page, type Pages } from '../model.ts';
import { activate, insertInstance } from '../tree.ts';

/** The views a rail button's page shows: its arrangement key and its arrangement as read. */
export type ViewSource = { page: string; node: unknown };

/**
 * The tree with a pinned tab of `view` added: in the pane that holds a tab of `before`, the view
 * the arrangement shows before it, right after that tab and no later than the pane's pinned tabs,
 * or at the end of the pinned tabs of the first pane when no pane holds `before`. Each pane's
 * active tab stays active.
 */
function withView(root: Layout, view: string, before: string | undefined): Layout {
    const all = panes(root);
    const holder = all.find(({ pane }) => pane.tabs.some((tab) => tab.view === before));
    const target = holder ?? all.at(0);
    if (target === undefined) return root;
    const run = pinnedRun(target.pane.tabs);
    const after = target.pane.tabs.findLastIndex((tab) => tab.view === before);
    const at = holder === undefined ? run : Math.min(after + 1, run);
    const added = insertInstance(root, target.path, at, pinned(newInstance(view)));
    return activate(added, target.pane.active);
}

/**
 * The page with the views of `arranged` it has not been given added (withView), in the
 * arrangement's order, and recorded as given. A view the page already shows adds no tab. The page
 * itself when it has been given every view.
 */
function viewed(page: Page, arranged: readonly string[]): Page {
    const given = new Set(page.views ?? []);
    const fresh = arranged.filter((view) => !given.has(view));
    if (fresh.length === 0) return page;
    let root = page.workbench.root;
    for (const view of fresh) {
        if (tabsOf(root).some((tab) => tab.view === view)) continue;
        root = withView(root, view, arranged[arranged.indexOf(view) - 1]);
    }
    const views = [...given, ...fresh];
    return { ...page, workbench: { ...page.workbench, root }, views };
}

/**
 * The pages with every rail page given the views of its arrangement it has not been given. A page
 * no source names, a source whose arrangement does not read, and a page with nothing new stay as
 * they are; the pages themselves when none changed.
 */
export function giveViews(held: Pages, sources: readonly ViewSource[]): Pages {
    const pages = held.pages.map((page) => {
        const source = sources.find((one) => one.page === page.rail);
        const built = source === undefined ? null : parseArrangement(source.node);
        return built === null ? page : viewed(page, viewIds(built.root));
    });
    return pages.some((page, at) => page !== held.pages[at]) ? { ...held, pages } : held;
}
