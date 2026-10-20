// Layer 3, shell. What a page does for the windows of the desktop app, called once from the
// page's script body. Every window of the app is a page of its own with its own client; they share
// the saved arrangement, and a float placed in a window of its own is drawn by that window's page
// alone. Nothing is done in a browser, whose client holds no bridge.
//
// The main window's page asks the host to open a window for each float placed in a window, which
// the host does once per float, so the windows come back with the main window and with the next
// start, and performs the drop of a tab another window handed it. A popped-out page writes its
// window's place when the host reports the window moved or resized, puts its tabs back in the main
// window when the reader closes the window, and has the host close the window when its float stops
// being one placed in a window. Every window, sent to the server's new origin after a restart, goes
// there and reads the same server's arrangement. The menu's commands are
// window/menu-commands.svelte.ts's.

import type { ClientState } from '../../state/client/context.ts';

/** The bar a window's title takes above its content, which a screen point is moved by. */
function titleBar(): number {
    return Math.max(0, window.outerHeight - window.innerHeight);
}

export function useDesktopWindows(client: ClientState): void {
    const { desktop, layout, drag, pageId } = client;
    if (desktop === undefined) return;
    const { bridge, float } = desktop;

    // A tab another window let go over this one lands where the pointer would have put it, and the
    // window says whether it took the tab, so the window that let go opens one of its own if not.
    $effect(() =>
        bridge.on('drop-here', ({ tab, at, request }) => {
            const point = { x: at.x - window.screenX, y: at.y - window.screenY - titleBar() };
            bridge.answerDrop(request, drag.receive(tab, point));
        })
    );

    // A restart onto another port: the page goes to its own address there, where the same server's
    // page state and configuration hold its arrangement and settings.
    $effect(() =>
        bridge.on('move-to', (origin) => {
            location.assign(`${origin}${location.pathname}${location.search}${location.hash}`);
        })
    );

    if (float === null) {
        $effect(() => {
            if (!layout.loaded()) return;
            for (const one of layout.floats()) {
                const { place } = one;
                // A plain object: the saved place is reactive state, which the bridge cannot clone.
                if (place.kind === 'window') {
                    bridge.openFloatWindow(
                        one.id,
                        { x: place.x, y: place.y, w: place.w, h: place.h },
                        pageId
                    );
                }
            }
        });
        return;
    }

    $effect(() =>
        bridge.on('bounds', (bounds) => layout.placeFloat(float, { kind: 'window', ...bounds }))
    );
    $effect(() =>
        bridge.on('restore', () => {
            layout.freeFloat(float);
            bridge.closeSelf();
        })
    );
}
