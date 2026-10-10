// Layer 3, shell. What a page does for the floats placed in windows of their own when the page is
// in a browser, called once from the page's script body. The window of a float is a browser tab at
// `/?float=<id>&owner=<page>` (state/workbench/layout/open/float/browser.ts opens it with the press
// that asked for it); every tab is a page of its own with its own client, and they share the saved
// arrangement.
//
// The tab that draws a float holds a Web Lock named for the float's id for as long as it lives. A
// main page waits to take that lock: it is granted when the tab is closed or gone, and the float's
// tabs then go back into the main page the way a closed window of the app puts them back
// (`freeFloat`). A lock is held whether or not the tab is on screen, so a tab the browser throttles
// or freezes while it is hidden is never mistaken for a closed one. A main page waits first for the
// time a tab needs to load and take its lock, since a float placed in a window that no tab draws
// is also a float whose tab was closed before this page loaded. A reload of the tab frees its lock
// for as long as the page takes to load, so a lock that comes free is looked at again after that
// same time, and the float is freed only when no tab has taken the lock again by then. A tab that
// draws a float closes itself when the float stops being one placed in a window
// (FloatWindow.svelte). The app's windows are the host's (desktop-windows.svelte.ts), and nothing
// is done there.

import type { ClientState } from '../../state/client/context.ts';

/**
 * How long a page takes to load and take its float's lock: a main page waits this long for a
 * float's tab to take its lock before it asks for it, and waits it again after the lock came free
 * before the float is freed, since the lock is free between the unload and the load of a reloaded
 * tab.
 */
const LOAD_WAIT = 10_000;

/** What the release of a lock is until the request for it has set the real one. */
const noRelease = (): void => undefined;

/** The name of the lock the tab that draws a float holds. */
function lockName(float: string): string {
    return `oculus-float:${float}`;
}

export function useBrowserWindows(client: ClientState): void {
    const { desktop, float, layout } = client;
    if (desktop !== undefined || typeof navigator === 'undefined' || !('locks' in navigator))
        return;

    if (float !== null) {
        $effect(() => {
            let end: () => void = noRelease;
            const held = new Promise<void>((resolve) => {
                end = resolve;
            });
            void navigator.locks.request(lockName(float), () => held);
            return end;
        });
        return;
    }

    /** What waits for each float placed in a window: its timer and its request for the lock. */
    const waiting = new Map<string, AbortController>();

    /** Whether a tab holds the lock of a float now. */
    async function drawn(id: string): Promise<boolean> {
        const { held } = await navigator.locks.query();
        return held?.some((one) => one.name === lockName(id)) ?? false;
    }

    function watch(id: string): void {
        const control = new AbortController();
        waiting.set(id, control);
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const later = (run: () => void): void => {
            timers.add(setTimeout(run, LOAD_WAIT));
        };
        // The lock came free: a tab that was reloaded takes it again within the load time, and one
        // that was closed does not.
        const freed = (): void =>
            later(() => {
                void drawn(id).then((still) => {
                    if (control.signal.aborted) return;
                    if (still) {
                        watch(id);
                        return;
                    }
                    layout.freeFloat(id);
                    waiting.delete(id);
                });
            });
        later(() => {
            navigator.locks
                .request(lockName(id), { signal: control.signal }, freed)
                .catch(() => waiting.delete(id));
        });
        control.signal.addEventListener('abort', () => timers.forEach(clearTimeout));
    }

    $effect(() => {
        if (!layout.loaded()) return;
        const placed = new Set(
            layout
                .floats()
                .filter((one) => one.place.kind === 'window')
                .map((one) => one.id)
        );
        for (const id of placed) if (!waiting.has(id)) watch(id);
        for (const [id, control] of waiting) {
            if (placed.has(id)) continue;
            control.abort();
            waiting.delete(id);
        }
    });

    $effect(() => () => {
        for (const control of waiting.values()) control.abort();
        waiting.clear();
    });
}
