// Layer 2, client state. A saved layout carried to the System page. The rail has one System button,
// the page tied to the rail key `views`, so a saved page tied to the rail key `info` is folded into
// it (its system views go in a pane below Pages) and the page takes the System label.
//
// The steps run over a layout that has been read part by part and not yet settled (parseLayout
// calls them before settlePageLeaves), and each answers a layout it has nothing to change
// unchanged, so reading a migrated layout again changes nothing.

import { panes, tabsOf } from '../instance.ts';
import {
    samePath,
    type Instance,
    type Layout,
    type Page,
    type Pages,
    type Pane,
    type Workbench
} from '../model.ts';
import { rewrite } from '../tree.ts';
import { mapTree } from './migrate.ts';

const INFO_RAIL = 'info';
const VIEWS_RAIL = 'views';

/** The views of a saved `info` page, which the shipped System page holds in a pane below Pages. */
const SYSTEM_VIEWS = ['status', 'findings', 'audit', 'history', 'gallery', 'processes'];

/** The label a saved `views` page made by the Views and Settings button carries, and System's. */
const VIEWS_LABEL = 'Views and Settings';
const SYSTEM_LABEL = 'System';

/** A pane of these tabs, with the tab of this id active when the pane holds it, else the first. */
function paneOf(tabs: Instance[], active?: string): Pane {
    const shown = tabs.find((tab) => tab.id === active) ?? tabs[0];
    return { kind: 'pane', tabs, active: shown.id };
}

/** A split of these children in halves, as the shipped arrangement has them. */
function halves(dir: 'row' | 'col', children: Layout[]): Layout {
    return { kind: 'split', dir, sizes: [0.5, 0.5], children };
}

/**
 * The views page with the tabs of the info page added. When the page holds no system view, those
 * tabs go in a new pane below the pane holding `pages`. The others go to the pane holding `status`,
 * or the last pane, and a page with no pane takes a pane of them beside its page leaf. The new
 * pane shows the first of `shown` (the tab each pane of the info page had active, in tree order)
 * that it holds. When the pane holding `pages` was the maximised pane, the new split wraps it, so
 * the focus path names it one step deeper and the page reads.
 */
function withAppended(views: Page, added: Instance[], shown: string[]): Page {
    const { root } = views.workbench;
    const held = panes(root);
    const holds = (names: string[]) => (found: { pane: Pane }) =>
        found.pane.tabs.some((tab) => names.includes(tab.view));
    const system = added.filter((tab) => SYSTEM_VIEWS.includes(tab.view));
    const under = held.find(holds(['pages']));
    const alone = system.length > 0 && under !== undefined && !held.some(holds(SYSTEM_VIEWS));
    const rest = alone ? added.filter((tab) => !system.includes(tab)) : added;
    const host = held.find(holds(['status'])) ?? held.at(-1);
    let next = root;
    if (host === undefined) next = halves('row', [root, paneOf(rest)]);
    else if (rest.length > 0) {
        next =
            rewrite(root, host.path, (node) =>
                node.kind === 'pane'
                    ? { ...node, tabs: [...node.tabs, ...rest], active: node.active || rest[0].id }
                    : node
            ) ?? root;
    }
    let { focus } = views.workbench;
    if (alone) {
        const active = shown.find((id) => system.some((tab) => tab.id === id));
        const below = (node: Layout): Layout => halves('col', [node, paneOf(system, active)]);
        next = rewrite(next, under.path, below) ?? next;
        if (focus !== undefined && samePath(focus.path, under.path)) {
            focus = { path: [...focus.path, 0] };
        }
    }
    const workbench: Workbench = { ...views.workbench, root: next };
    if (focus !== undefined) workbench.focus = focus;
    return { ...views, workbench };
}

/**
 * The pages with the info page folded into the views page. The info tabs whose view the views page
 * lacks are appended to it, the page leaves that name the info page name the views page, and the
 * current page is the views page when it was the info page. With no views page the info page takes
 * the rail key `views` and keeps its id and its place. Nothing to fold answers the pages as they
 * were.
 */
export function withInfoFolded(held: Pages): Pages {
    const info = held.pages.find((page) => page.rail === INFO_RAIL);
    if (info === undefined) return held;
    const views = held.pages.find((page) => page.rail === VIEWS_RAIL);
    if (views === undefined) {
        return {
            ...held,
            pages: held.pages.map((page) => (page === info ? { ...page, rail: VIEWS_RAIL } : page))
        };
    }
    const have = new Set(tabsOf(views.workbench.root).map((tab) => tab.view));
    const added = tabsOf(info.workbench.root).filter((tab) => !have.has(tab.view));
    const shown = panes(info.workbench.root).map(({ pane }) => pane.active);
    const renamed = (page: string): string => (page === info.id ? views.id : page);
    const pages: Page[] = [];
    for (const page of held.pages) {
        if (page === info) continue;
        const folded = page === views && added.length > 0 ? withAppended(page, added, shown) : page;
        pages.push({
            ...folded,
            workbench: {
                ...folded.workbench,
                root: mapTree(folded.workbench.root, (pane) => pane, renamed)
            }
        });
    }
    return { ...held, pages, current: renamed(held.current) };
}

/**
 * The pages with the views page named as the System button names its page: a page of the rail key
 * `views` still carrying the label the Views and Settings button gave it takes the new one. A
 * label the viewer changed is theirs and stays.
 */
export function withSystemLabel(held: Pages): Pages {
    const pages = held.pages.map((page) =>
        page.rail === VIEWS_RAIL && page.label === VIEWS_LABEL
            ? { ...page, label: SYSTEM_LABEL }
            : page
    );
    return { ...held, pages };
}
