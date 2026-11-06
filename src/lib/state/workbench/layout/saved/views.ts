// Layer 2, client state. The tabs of its arrangement a saved rail page is given when it is
// restored: the views, and the documents of oculus's own folder the arrangement shows (the `doc`
// tabs with `engine: true`, such as the guides of the Help page). A page made from the config has
// every tab of its arrangement (config/defaults/layout.yml `arrangements:`); a saved page that
// lacks one gains a pinned tab of it here, once: a view after the view the arrangement shows just
// before it, a document after the nearest tab before it in the arrangement that the page holds, and
// either at the end of the first pane's pinned tabs when the page holds no such tab. The page
// records what it has been given, the views in `Page.views` and the documents by id in
// `Page.docs`, so a tab added to the arrangement later is given once and a tab of it the reader
// closes stays closed. A page saved with no record is given every view and every such document of
// its arrangement it lacks, once, as a page with no document record is given every hub document of
// its group (saved/docs.ts), which alone gives the hub's `docs:` entries.

import { parseArrangement } from '../../navigation/arrangement.ts';
import {
    DOC_VIEW,
    engineDocTabs,
    instanceMap,
    instanceText,
    newInstance,
    panes,
    tabsOf,
    viewIds
} from '../instance.ts';
import { pinned, pinnedRun, type Instance, type Layout, type Page, type Pages } from '../model.ts';
import { activate, insertInstance } from '../tree.ts';

/** The tabs a rail button's page shows: its arrangement key and its arrangement as read. */
export type ViewSource = { page: string; node: unknown };

/** A test a tab of a page passes when it is the arrangement's tab a new tab is placed after. */
type Holds = (tab: Instance) => boolean;

/**
 * The tree with `tab` added, pinned: in the pane that holds a tab `holds` passes, right after the
 * last such tab and no later than the pane's pinned tabs, or at the end of the pinned tabs of the
 * first pane when no pane holds one. Each pane's active tab stays active.
 */
function withTab(root: Layout, tab: Instance, holds: Holds): Layout {
    const all = panes(root);
    const holder = all.find(({ pane }) => pane.tabs.some(holds));
    const target = holder ?? all.at(0);
    if (target === undefined) return root;
    const run = pinnedRun(target.pane.tabs);
    const after = target.pane.tabs.findLastIndex(holds);
    const at = holder === undefined ? run : Math.min(after + 1, run);
    const added = insertInstance(root, target.path, at, pinned(tab));
    return activate(added, target.pane.active);
}

/**
 * The page with the views of `arranged` it has not been given added, each after the view the
 * arrangement shows before it (withTab), in the arrangement's order, and recorded as given. A view
 * the page already shows adds no tab. The page itself when it has been given every view.
 */
function viewed(page: Page, arranged: readonly string[]): Page {
    const given = new Set(page.views ?? []);
    const fresh = arranged.filter((view) => !given.has(view));
    if (fresh.length === 0) return page;
    let root = page.workbench.root;
    for (const view of fresh) {
        if (tabsOf(root).some((tab) => tab.view === view)) continue;
        const before = arranged[arranged.indexOf(view) - 1];
        root = withTab(root, newInstance(view), (tab) => tab.view === before);
    }
    const views = [...given, ...fresh];
    return { ...page, workbench: { ...page.workbench, root }, views };
}

/** The id of a document tab, the empty text for a tab of a view. */
function docId(tab: Instance): string {
    return tab.view === DOC_VIEW ? instanceText(tab.state, 'id') : '';
}

/**
 * The test a page's tab passes when it shows what the arrangement's tab `arranged` shows: a
 * document tab of the same id for a document tab, a tab of the same view for any other.
 */
function showing(arranged: Instance): Holds {
    if (arranged.view !== DOC_VIEW) return (tab) => tab.view === arranged.view;
    const id = docId(arranged);
    return (tab) => tab.view === DOC_VIEW && docId(tab) === id;
}

/**
 * The page with the documents of oculus's own folder that `arranged` shows (`engineDocTabs`) and
 * its record (`Page.docs`) does not hold added, in the arrangement's order. Each goes after the
 * nearest tab before it in the arrangement that the page holds, matched by its id for a document
 * tab and by its view for any other, in the pane that holds that tab (withTab); when the page holds
 * none of the tabs before it, at the end of the first pane's pinned tabs. A document tab with no id
 * names no place. A document the page already shows adds no tab. Each is recorded by its id. The
 * page itself when its record holds every one. The views run first (`viewed`), so a document never
 * moves the place a view is given.
 */
function documented(page: Page, arranged: Layout): Page {
    const given = new Set(page.docs ?? []);
    const fresh = engineDocTabs(arranged).filter((tab) => !given.has(docId(tab)));
    if (fresh.length === 0) return page;
    const order = tabsOf(arranged).filter((tab) => tab.view !== DOC_VIEW || docId(tab) !== '');
    let root = page.workbench.root;
    for (const tab of fresh) {
        const held = tabsOf(root);
        if (held.some(showing(tab))) continue;
        const earlier = order.slice(0, order.indexOf(tab)).reverse();
        const before = earlier.find((one) => held.some(showing(one)));
        const holds: Holds = before === undefined ? () => false : showing(before);
        root = withTab(root, newInstance(DOC_VIEW, { ...instanceMap(tab.state) }), holds);
    }
    const docs = [...given, ...fresh.map(docId)];
    return { ...page, workbench: { ...page.workbench, root }, docs };
}

/**
 * The pages with every rail page given the views of its arrangement, and the documents of oculus's
 * own folder its arrangement shows, that it has not been given. A page no source names, a source
 * whose arrangement does not read, and a page with nothing new stay as they are; the pages
 * themselves when none changed.
 */
export function giveViews(held: Pages, sources: readonly ViewSource[]): Pages {
    const pages = held.pages.map((page) => {
        const source = sources.find((one) => one.page === page.rail);
        const built = source === undefined ? null : parseArrangement(source.node);
        if (built === null) return page;
        return documented(viewed(page, viewIds(built.root)), built.root);
    });
    return pages.some((page, at) => page !== held.pages[at]) ? { ...held, pages } : held;
}
