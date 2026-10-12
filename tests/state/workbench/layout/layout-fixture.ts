// Hand-built layout trees and a fake Storage, shared by the suites over state/workbench/layout: the
// saved form and its migrations in saved/layout-saved.test.ts. Nothing here touches localStorage or
// the DOM.

import { panes } from '../../../../src/lib/state/workbench/layout/index.ts';
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

/** The identity of the workspace that has no file, as the stored keys name it. */
export const UNSAVED = 'unsaved';

/** The key the arrangement of a workspace is stored under in the browser. */
export function layoutKey(identity: string): string {
    return `oculus.layout.workspace:${identity}`;
}

/** The key a copy of an arrangement that could not be read is kept under. */
export function unreadKey(identity: string): string {
    return `oculus.layout.unread:${identity}`;
}

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

/** A fake Storage: what the store needs of one, and a window on what it wrote. */
export function fakeStorage(seed?: string, identity: string = UNSAVED) {
    const held: Record<string, string> = seed === undefined ? {} : { [layoutKey(identity)]: seed };
    return {
        held,
        getItem: (key: string): string | null => held[key] ?? null,
        setItem: (key: string, value: string): void => {
            held[key] = value;
        }
    };
}

/**
 * Load a layout store over a storage and open the workspace with this identity in it, which is what
 * a page does once the workspace answer has come. Answers whether a saved arrangement was read.
 */
export function openLayout(
    layout: Pick<LayoutStore, 'loadLayout' | 'workspaceOpened'>,
    storage: ReturnType<typeof fakeStorage>,
    identity: string = UNSAVED
): boolean {
    layout.loadLayout(storage);
    return layout.workspaceOpened(identity);
}
