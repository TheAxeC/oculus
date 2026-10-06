// Layer 2, client state. The float operations of the layout store: what a reader does to a float
// or to a pane or tab that becomes one, built beside the factory and handed the access object as
// the other parts under open/ are. Each asks the pure operation of pages.ts for the new pages and
// saves them when they changed. Putting a float in a window of the app is the same operations with
// a window place; a copy of a tab is the one place a store beyond the pages is written, since the
// copy takes the state its original holds in the ui store.

import type { LayoutAccess } from '../../access.ts';
import { isPage, type DockEdge, type FloatPlace, type Pages } from '../../model.ts';
import type { KeepRule } from '../../tree.ts';
import {
    copyTab as copyTabIn,
    dockFloat as dockFloatIn,
    floatPane as floatPaneIn,
    floatTab as floatTabIn,
    freeFloat as freeFloatIn,
    placeFloat as placeFloatIn,
    returnFloat as returnFloatIn
} from './pages.ts';

/** The bounds of a window on the screen, in points. */
export type WindowBounds = { x: number; y: number; w: number; h: number };

/** The size a window opens at when what it is made from has no size of its own on screen. */
export const WINDOW_START = { w: 600, h: 400 } as const;

/** The float operations a layout store offers. */
export type FloatOps = {
    /** Put a page's pane over every page as a free float. */
    floatPane: (path: number[], page?: string) => void;
    /**
     * Put one tab over every page as a free float whose corner is the point, in window fractions.
     */
    floatTab: (id: string, at: { x: number; y: number }) => void;
    /** Dock a float on an edge, merging its tabs into the float already docked there. */
    dockFloat: (id: string, edge: DockEdge) => void;
    /** Float a docked float, or a float in a window, again in the middle of the window. */
    freeFloat: (id: string) => void;
    /** Put a float's tabs back into a page, which is the page on screen unless one is named. */
    returnFloat: (id: string, page?: string) => void;
    /** Move or resize a float; a place that does not fit changes nothing. */
    placeFloat: (id: string, place: FloatPlace) => void;
    /** Put a page's pane over every page as a float in a window of the app. */
    windowPane: (path: number[], bounds: WindowBounds, page?: string) => void;
    /** Put one tab over every page as a float in a window of the app. */
    windowTab: (id: string, bounds: WindowBounds) => void;
    /** Put a float in a window of the app, from a free place or a dock. */
    windowFloat: (id: string, bounds: WindowBounds) => void;
    /**
     * Put a copy of a tab, with the state it holds, in a new float in a window of the app, the tab
     * staying where it is; answers the id of the float, or null when no tab has this id.
     */
    copyTabToWindow: (id: string, bounds: WindowBounds) => string | null;
};

/** The place of a float in a window of the app. */
function windowed(bounds: WindowBounds): FloatPlace {
    return { kind: 'window', x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
}

export function createFloatOps(access: LayoutAccess, keep: KeepRule): FloatOps {
    /** Save the pages a float operation answered, when it changed any. */
    function floated(next: Pages): void {
        if (next !== access.held()) access.save(next);
    }

    /** The id of the page an argument names, the page on screen for none; undefined for a float. */
    function pageIdOf(page?: string): string | undefined {
        const host = access.at(page);
        return host !== null && isPage(host) ? host.id : undefined;
    }

    function floatPane(path: number[], page?: string): void {
        const id = pageIdOf(page);
        if (id !== undefined) floated(floatPaneIn(access.held(), id, path));
    }

    function returnFloat(id: string, page?: string): void {
        const to = pageIdOf(page);
        if (to !== undefined) floated(returnFloatIn(access.held(), id, to));
    }

    function placeFloat(id: string, place: FloatPlace): void {
        floated(placeFloatIn(access.held(), id, place));
    }

    return {
        floatPane,
        floatTab: (id, point) => floated(floatTabIn(access.held(), id, point, keep)),
        dockFloat: (id, edge) => floated(dockFloatIn(access.held(), id, edge)),
        freeFloat: (id) => floated(freeFloatIn(access.held(), id)),
        returnFloat,
        placeFloat,
        windowPane: (path, bounds, page) => {
            const id = pageIdOf(page);
            if (id !== undefined) {
                floated(floatPaneIn(access.held(), id, path, windowed(bounds)));
            }
        },
        windowTab: (id, bounds) =>
            floated(floatTabIn(access.held(), id, { x: 0, y: 0 }, keep, windowed(bounds))),
        windowFloat: (id, bounds) => placeFloat(id, windowed(bounds)),
        copyTabToWindow: (id, bounds) => {
            const ids = { tab: crypto.randomUUID(), float: crypto.randomUUID() };
            const held = access.held();
            const next = copyTabIn(held, id, windowed(bounds), ids);
            if (next === held) return null;
            const state = access.ui.instanceState(id);
            if (state !== undefined) {
                access.ui.setInstanceState(ids.tab, JSON.parse(JSON.stringify(state)));
            }
            access.save(next);
            return ids.float;
        }
    };
}
