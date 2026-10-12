// Layer 2, client state. The asks that open a named view for another part of the app, not for the
// reader: one path shown in the Files view of the page the reader is in, and one deck shown in a
// Present tab. The TeX view is one more such ask: it opens as a tab of the pane that holds the
// page's Files tab, so the two sit together as LaTeX Workshop's TeX view sits in the activity bar.
//
// A view an app contributes opens where its container says the first time (`createShowPlaced`).
//
// A file browser ask is written into the Files instance's own state rather than acted on here: the
// folders on the way are read by the view, which is what draws them, and an ask written into the
// state is still there for a tab that mounts after it. A deck is named in the layout state of its
// Present tab (state/life/present.ts), so the opener only names the tab.

import { nameOf, normalisePath, revealAsked, rootedState } from '../../../sources/fs.ts';
import { findView, panes } from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import { floatHost, type ViewId } from '../model.ts';
import { heldView } from './float/pages.ts';
import type { FloatOps } from './float/store.ts';
import type { OpenOptions, Opening } from './opening.ts';
import { paneAt } from '../tree.ts';
import { focusedPane } from '../workbench.ts';
import { deckState, type DeckRef } from '../../../life/present.ts';

export type ShowInFiles = {
    showInFiles: (path: string, root: string, open?: boolean) => string;
    /** The same ask, and the Files tab opens its Timeline section on the path too. */
    showTimeline: (path: string, root: string) => string;
    showFolderInFiles: (path: string, root: string) => string;
    /** Show the TeX view: its tab if one is open, else a new tab in the pane holding Files. */
    showTexView: () => string;
};

export function createShowInFiles(
    access: LayoutAccess,
    attention: Attention,
    openView: (view: ViewId, state?: unknown, page?: string) => string,
    openInPane: (view: ViewId, state: unknown, page: string, path: number[]) => string
): ShowInFiles {
    /**
     * Show one path in the file browser. The Files tab of the page the reader is in is activated,
     * or one is opened there when the page has none, and it is asked to open the folders on the
     * way, select the path and scroll it into view; with `open` a folder is shown open too, and
     * with `timeline` the Timeline section is opened and scrolled to in place of the row.
     */
    function show(path: string, root: string, open: boolean, timeline: boolean): string {
        const page = attention.touched().id;
        const tree = access.layout(page);
        const held = findView(tree, 'files', null);
        const focus = focusedPane(access.workbench(page));
        const shown = focus === null ? null : paneAt(tree, focus.path);
        // openView looks inside a maximised pane alone, which would open a second Files tab there
        // while the page's own one waits behind it; the panes are given back so that one is found.
        // A maximised pane that holds a Files tab of its own keeps the reader's layout and is used.
        if (held !== null && shown !== null && !shown.tabs.some((tab) => tab.view === 'files')) {
            access.restorePanes(page);
        }
        const id = openView('files', undefined, page);
        if (id === '') return '';
        access.ui.setInstanceState(
            id,
            revealAsked(access.ui.instanceState(id), path, root, open, timeline)
        );
        return id;
    }

    /**
     * Show one folder as a Files tab of its own: the tab rooted at the folder is activated, or
     * opened on the page the reader is in when there is none, and its top is put back on the folder
     * if it was moved up. The tab is named by the folder's root and path, so showing the same
     * folder again finds the same tab.
     */
    function showFolderInFiles(path: string, root: string): string {
        const page = attention.touched().id;
        const top = { root, path: normalisePath(path) };
        const label = top.path === '' ? root : nameOf(top.path);
        const id = openView('files', { ...top, label }, page);
        if (id === '') return '';
        access.ui.setInstanceState(id, rootedState(access.ui.instanceState(id), top));
        return id;
    }

    /**
     * The TeX view of the page the reader is in: the tab when the page holds one, else a new tab in
     * the pane that holds the Files tab, else a new tab where the page opens views.
     */
    function showTexView(): string {
        const page = attention.touched().id;
        const tree = access.layout(page);
        if (findView(tree, 'latex') === null) {
            const home = panes(tree).find(({ pane }) =>
                pane.tabs.some((tab) => tab.view === 'files')
            );
            const id = home === undefined ? '' : openInPane('latex', {}, page, home.path);
            if (id !== '') return id;
        }
        return openView('latex', {}, page);
    }

    return {
        showInFiles: (path, root, open = false) => show(path, root, open, false),
        showTimeline: (path, root) => show(path, root, false, true),
        showFolderInFiles,
        showTexView
    };
}

export type ShowDeck = {
    /** Open a Present tab on the deck, in the pane's place or beside the one read; its id. */
    showDeck: (ref: DeckRef, label: string, beside?: boolean) => string;
};

export function createShowDeck(
    openView: (view: ViewId, state?: unknown, page?: string) => string,
    openBeside: (view: ViewId, state?: unknown, page?: string) => string
): ShowDeck {
    /**
     * A Present tab is named by its deck, as a LaTeX tab is by its file: the deck's root and path
     * are in the tab's layout state, so a second ask for the same deck activates its tab and
     * another deck gets a tab of its own. The portfolio deck is the tab with neither.
     */
    function showDeck(ref: DeckRef, label: string, beside = false): string {
        const open = beside ? openBeside : openView;
        return open('present', deckState(label === '' ? {} : { label }, ref));
    }
    return { showDeck };
}

/** Where the first tab of a view opens: docked on an edge, or in the pane holding Files. */
export type Dock = 'left' | 'bottom' | 'files';

/** Where a view opens the first time, or null for a view that opens where views land. */
export type PlaceRule = (view: ViewId) => Dock | null;

export type ShowPlaced = { openView: Opening['openView'] };

/**
 * `openView` for the views that say where their first tab goes. While some page or float holds a
 * tab of the view, and for a view with no place, it opens as `opening.openView` does. Otherwise
 * the tab opens as the only tab of a float docked on the left or the bottom edge, or as a tab of
 * the pane that holds Files on the page, else beside the pane the reader was in.
 */
export function createShowPlaced(
    access: LayoutAccess,
    attention: Attention,
    opening: Pick<Opening, 'openView' | 'openBeside' | 'openInPane'>,
    floats: Pick<FloatOps, 'floatTab' | 'dockFloat'>,
    rule: () => PlaceRule
): ShowPlaced {
    /** Whether any page or float holds a tab of the view. */
    function held(view: ViewId): boolean {
        const { pages, floats: apart } = access.held();
        return heldView([...pages, ...apart.map(floatHost)], view) !== null;
    }

    function openView(view: ViewId, state?: unknown, page?: string, options?: OpenOptions): string {
        const dock = rule()(view);
        if (dock === null || held(view)) return opening.openView(view, state, page, options);
        if (dock === 'files') {
            const host = page ?? attention.touched().id;
            const home = panes(access.layout(host)).find(({ pane }) =>
                pane.tabs.some((tab) => tab.view === 'files')
            );
            const id =
                home === undefined ? '' : opening.openInPane(view, state ?? {}, host, home.path);
            return id === '' ? opening.openBeside(view, state, page) : id;
        }
        const id = opening.openView(view, state, page, options);
        if (id === '') return id;
        floats.floatTab(id, { x: 0.1, y: 0.1 });
        const float = access
            .held()
            .floats.find((one) => one.pane.tabs.some((tab) => tab.id === id));
        if (float !== undefined) floats.dockFloat(float.id, dock);
        return id;
    }

    return { openView };
}
