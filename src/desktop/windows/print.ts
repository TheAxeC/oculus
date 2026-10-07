// Layer 2, server (the desktop host). The hidden window that prints a deck to a PDF. The page asks
// over the bridge (`oculus:print-pdf`) with the address of the server's print route; the host loads
// that address in a window of its own that is never shown, waits for the page to say it is ready
// with a `data-ready` attribute on its root (or that it failed, with `data-failed`), calls
// `printToPDF` with the page's own size and its backgrounds, closes the window and answers the
// bytes. A page that has not said it is ready after the wait is closed and answered as a timeout.
//
// The window is not one of the app's windows (windows.ts): it is never in its list, never recorded
// in the window file, and its page may call no channel of the bridge (decide/sender.ts). It is made
// with the preferences every window has, loads no address but the one it was asked for, and opens
// no other.

import { BrowserWindow } from 'electron';
import { READY_WAIT_MS } from '../../lib/data/file-ops.ts';
import type { PrintAnswer } from '../../lib/state/shared/stores/desktop.ts';
import { WINDOW_BACKGROUND, windowPreferences } from '../decide/window-options.ts';

/** How often the host looks for the ready attribute. */
const POLL_MS = 200;

/**
 * What the page's root says: `ready` once every slide, font and image has loaded, `failed` when the
 * deck could not be read, else `wait`.
 */
const STATE =
    "document.querySelector('[data-print-root][data-ready]') !== null ? 'ready' : " +
    "document.querySelector('[data-print-root][data-failed]') !== null ? 'failed' : 'wait'";

/** The frame the page lays its slides out in, in px: the window starts at the size of one. */
const FRAME = { width: 1280, height: 720 } as const;

/** What the printing needs of the app. */
export type PrintOptions = { preload: string; wait?: number };

function pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Print the page at `address` to a PDF in a hidden window, and close the window. */
export async function printPdf(address: string, options: PrintOptions): Promise<PrintAnswer> {
    const deadline = Date.now() + (options.wait ?? READY_WAIT_MS);
    const win = new BrowserWindow({
        show: false,
        ...FRAME,
        backgroundColor: WINDOW_BACKGROUND,
        webPreferences: windowPreferences(options.preload)
    });
    const contents = win.webContents;
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-frame-navigate', (event) => {
        if (event.url !== address) event.preventDefault();
    });
    try {
        const loaded = contents.loadURL(address);
        // A page that has not loaded when the wait ends is answered as a timeout.
        const loadedInTime = await Promise.race([
            loaded.then(() => true),
            pause(Math.max(0, deadline - Date.now())).then(() => false)
        ]);
        if (!loadedInTime) return { ok: false, error: 'timeout' };
        for (;;) {
            const state: unknown = await contents.executeJavaScript(STATE);
            if (state === 'ready') break;
            if (state === 'failed') return { ok: false, error: 'failed' };
            if (Date.now() >= deadline) return { ok: false, error: 'timeout' };
            await pause(POLL_MS);
        }
        const bytes = await contents.printToPDF({ preferCSSPageSize: true, printBackground: true });
        return { ok: true, bytes: new Uint8Array(bytes) };
    } catch {
        return { ok: false, error: 'failed' };
    } finally {
        if (!win.isDestroyed()) win.destroy();
    }
}
