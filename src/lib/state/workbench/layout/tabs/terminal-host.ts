// Layer 2, client state. The Terminal tabs of every page and float as the layout holds them, and
// the layout's calls that change them, as the terminals store reads them (`TerminalTabs`,
// state/sessions/terminal/session/workbench-shape.ts); state/client/context.ts hands them to the
// store with the rest of what it reads.
//
// A terminal belongs to exactly one Terminal tab, on whichever page or float it is, and a hidden
// page mounts no view, so the terminals store is handed the Terminal tabs of every page and float
// and the layout's ways to change them, and keeps the ownership itself: a terminal shown, moved or
// ended changes the tabs of any page. A tab it opens is opened on the page it names; its state
// carries an identity of its own, so the layout opens it rather than activating another Terminal
// tab. It opens in the pane of a Terminal tab the page holds, so a New, a resume or a terminal
// row while that tab reads a session lands beside it and not over the view that asked.

import { readTab, TERMINAL_VIEW } from '../../../sessions/terminal/terminal-tabs.ts';
import type { TerminalTabs } from '../../../sessions/terminal/session/workbench-shape.ts';
import type { LayoutStore } from '../../layout.svelte.ts';
import type { UiStore } from '../../ui.svelte.ts';
import { paneAt } from '../index.ts';
import { panes, tabsOf } from '../instance.ts';

/** What the layout and the ui store give of what the terminals store reads of the workbench. */
export type TerminalHost = Omit<
    TerminalTabs,
    'upkeep' | 'selected' | 'select' | 'hubRoot' | 'defaultFolder' | 'pageFolder'
>;

/**
 * The Terminal tabs of every page and float of `layout`, the layout's calls that change them, and a
 * tab's instance state, which `ui` holds.
 */
export function terminalHost(
    layout: LayoutStore,
    ui: Pick<UiStore, 'instanceState' | 'setInstanceState'>
): TerminalHost {
    return {
        tabs: () =>
            layout.hosts().flatMap((host) =>
                tabsOf(host.workbench.root)
                    .filter((tab) => tab.view === TERMINAL_VIEW)
                    .map((tab) => ({
                        id: tab.id,
                        page: host.id,
                        view: tab.view,
                        state: tab.state,
                        pinned: tab.pinned === true
                    }))
            ),
        restate: (id, _page, state) => layout.restateInstance(id, state),
        activate: (id, page) => layout.activateInstance(id, page),
        switchPage: (page) => layout.switchPage(page),
        currentPage: () => layout.currentPage().id,
        activeTab: (page) => {
            const active = layout.activeInstance(page);
            return active?.view === TERMINAL_VIEW ? active.id : null;
        },
        open: (page, state, document) => {
            const root = layout.workbench(page).root;
            const holder = panes(root).find(({ pane }) =>
                pane.tabs.some((one) => one.view === TERMINAL_VIEW)
            );
            return holder === undefined
                ? layout.openView(TERMINAL_VIEW, state, page, { document })
                : layout.openInPane(TERMINAL_VIEW, state, page, holder.path);
        },
        openBeside: (tab, page, state) => {
            const root = layout.workbench(page).root;
            const holder = panes(root).find(({ pane }) => pane.tabs.some((one) => one.id === tab));
            return holder === undefined
                ? layout.openView(TERMINAL_VIEW, state, page)
                : layout.openInPane(TERMINAL_VIEW, state, page, holder.path);
        },
        close: (id, page) => layout.closeInstance(id, page),
        instanceState: (id) => ui.instanceState(id),
        setInstanceState: (id, state) => ui.setInstanceState(id, state),
        paneTab: (page, path) => {
            const pane = paneAt(layout.workbench(page).root, path);
            if (pane === null) return null;
            const active = pane.tabs.find((tab) => tab.id === pane.active);
            if (active?.view !== TERMINAL_VIEW) return null;
            return readTab(active.state).transcript === null ? active.id : null;
        },
        openIn: (page, path, state) => layout.openInPane(TERMINAL_VIEW, state, page, path)
    };
}
