// Layer 2, client state. A tab in a window of its own, in a browser: the float the tab becomes and
// the page that draws it. In the desktop app the main window's page asks the host for a window per
// float placed in one (shell/window/desktop-windows.svelte.ts); in a browser the same float is
// drawn by a second page of the server at `/?float=<id>`, which is a browser tab the reader's press
// opens. That has to happen inside the press, since a browser opens a window a script asks for
// outside a user's gesture only when its pop-up blocker allows it, so the opening is here, with the
// layout change, rather than in an effect that reacts to it.
//
// The two pages find each other through the saved arrangement they share: the float is in the saved
// floats with a window place, the page at its address draws it, and
// shell/window/browser-windows.svelte.ts keeps both ends honest (the page closes itself when the
// float leaves its window place, and the main page takes the float's tabs back when no page draws
// it). Several main pages may share one arrangement, so the address also names the main page that
// opened the window (`owner`), which is what a message from the float to its main page is addressed
// to. A main page's id is the browser tab's (`browserTabId` of layout/saved/storage.ts), which a
// reload keeps; a page whose session storage cannot be used makes an id for itself, which a reload
// loses.

import type { Float } from '../../model.ts';
import type { FloatOps, WindowBounds } from './store.ts';

/** The address of the page that draws one float, which the main page `owner` opened. */
function floatAddress(id: string, owner: string): string {
    return `/?float=${encodeURIComponent(id)}&owner=${encodeURIComponent(owner)}`;
}

/** The id of the main page a float page's search names with `owner=<id>`, or null. */
export function ownerOf(search: string): string | null {
    const named = new URLSearchParams(search).get('owner');
    return named === null || named === '' ? null : named;
}

/** The float id a page's search names with `?float=<id>`, or null for a main page. */
export function floatOf(search: string): string | null {
    const named = new URLSearchParams(search).get('float');
    return named === null || named === '' ? null : named;
}

/** What the layout store gives the browser's windows. */
export type WindowsLayout = Pick<FloatOps, 'windowTab'> & { floats: () => Float[] };

/** What a page does to put a tab in a window of its own. */
export type Windows = {
    /**
     * Put a tab in a window of its own: a window of the app, or a browser tab at the float's
     * address. `at` is where the window opens; the size is the default one when it is left out.
     */
    openInWindow: (id: string, at?: WindowBounds) => void;
};

export function createWindows(
    layout: WindowsLayout,
    inApp: boolean,
    open: (address: string) => void,
    pageId: string
): Windows {
    return {
        openInWindow(id, at) {
            layout.windowTab(id, at ?? { x: 80, y: 80, w: 900, h: 700 });
            if (inApp) return;
            const float = layout.floats().find((one) => one.pane.tabs.some((tab) => tab.id === id));
            if (float !== undefined) open(floatAddress(float.id, pageId));
        }
    };
}
