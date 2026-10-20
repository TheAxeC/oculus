// Hand-built layout trees, and a page whose page state holds a saved arrangement, shared by the
// suites over state/workbench/layout and the shell suites that start from a saved arrangement.
// Nothing here touches the DOM.

import type { PageStateAnswer } from '../../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../../../src/lib/state/client/context.ts';
import type { StateTransport } from '../../../../src/lib/state/shared/stores/page-state.svelte.ts';
import { panes, serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import type { LayoutStore } from '../../../../src/lib/state/workbench/layout.svelte.ts';
import type {
    Float,
    FloatPlace,
    Focus,
    Instance,
    Layout,
    Page,
    Pages,
    Pane,
    Workbench
} from '../../../../src/lib/state/workbench/layout/index.ts';

/** The identity of the workspace that has no file, as the page state names it. */
export const UNSAVED = 'unsaved';

export function instance(id: string, view = 'projects'): Instance {
    return { id, view, state: null };
}

export function pane(ids: string[], active?: string): Layout {
    const tabs = ids.map((id) => instance(id));
    return { kind: 'pane', tabs, active: active ?? tabs.at(0)?.id ?? '' };
}

/** One pane of tabs, typed as the pane it is. */
function paneOf(ids: string[], active?: string): Pane {
    const tabs = ids.map((id) => instance(id));
    return { kind: 'pane', tabs, active: active ?? tabs.at(0)?.id ?? '' };
}

/** The place the float cases start a free float at. */
const FREE_PLACE: FloatPlace = { kind: 'free', x: 0.1, y: 0.1, w: 0.3, h: 0.4 };

/** A float holding these tabs at a place. */
export function floating(id: string, ids: string[], place: FloatPlace = FREE_PLACE): Float {
    return { id, pane: paneOf(ids), place };
}

/** A page with the id as its name around one tree. */
export function pageAround(id: string, root: Layout): Page {
    return { id, label: id, workbench: { root } };
}

/** The pages, the floats beside them and the page on screen, which is the unit that is saved. */
export function heldPages(pages: Page[], floats: Float[] = [], current?: string): Pages {
    return { pages, current: current ?? pages[0].id, floats };
}

export function split(dir: 'row' | 'col', sizes: number[], children: Layout[]): Layout {
    return { kind: 'split', dir, sizes, children };
}

/** A whole arrangement around one tree, which is the unit that is saved. */
export function bench(root: Layout, focus?: Focus): Workbench {
    return focus === undefined ? { root } : { root, focus };
}

/** The two-tree workbench of a version 2 or 3 envelope, as a browser holding one wrote it. */
export function docked(
    main: Layout,
    panel: Layout,
    dock: 'right' | 'bottom' | 'hidden' = 'right',
    panelSize = 0.3
): Record<string, unknown> {
    return { main, panel, dock, panelSize };
}

/** The view of every tab in a tree, depth first, which is what a store test is about. */
export function viewsOf(tree: Layout): string[] {
    return panes(tree).flatMap(({ pane: node }) => node.tabs.map((tab) => tab.view));
}

/**
 * Load a layout store and open the workspace with this identity in it, which is what a page does
 * once the workspace answer has come. Answers whether a saved arrangement was read.
 */
export function openLayout(
    layout: Pick<LayoutStore, 'loadLayout' | 'workspaceOpened'>,
    identity: string = UNSAVED
): boolean {
    layout.loadLayout();
    return layout.workspaceOpened(identity);
}

/** A way to a server that admits every write and keeps none, for a case that reads no save. */
const ADMITTING: StateTransport = {
    read: () => Promise.resolve(null),
    send: () => Promise.resolve<PageStateAnswer>({ ok: true })
};

/** A page over a server that admits every save and keeps none. */
export function admittedPage(): ClientState {
    return createClientState(undefined, null, 'main', null, ADMITTING);
}

/**
 * Hand a page's page state `pages` as the saved arrangement of the unsaved workspace, as the
 * server's read hands it, and open that workspace.
 */
export function openSaved(client: ClientState, pages: Pages): void {
    const envelope: unknown = JSON.parse(serialiseLayout(pages));
    client.pageState.install({
        layouts: { [UNSAVED]: { envelope } },
        views: {},
        debug: null,
        version: 0,
        findings: []
    });
    openLayout(client.layout);
}
