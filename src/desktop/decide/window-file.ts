// Layer 2, server (the desktop host). The main window's place as it is kept in
// ~/.oculus/window.json: the bounds, whether the window is maximised or full screen, and the zoom
// factor. A pure reader and writer of the file's text; the file is read before the window is made
// and written when the window moves, resizes, changes state or closes
// (src/desktop/windows/window-state.ts).
//
// A file that is missing, is not JSON, or holds a field of the wrong type is read as nothing, and
// the window then opens at the default place; the next change writes the file over.
//
// A page that goes full screen (the HTML Fullscreen API) makes Electron put the window in its own
// full screen, which the file must not keep: the next start would open the window full screen with
// no page asking for it. `recordWindow` holds the window's own state from the page's entry and
// gives it back in place of the window's live state until the window is out of the page's full
// screen.

import type { Rect } from './place.ts';

/** What is kept of the main window. */
export type WindowState = { bounds: Rect; maximised: boolean; fullScreen: boolean; zoom: number };

/** The zoom factor the page starts at. */
export const NO_ZOOM = 1;

/** The least and the most a zoom factor may be, as Chromium keeps it. */
export const ZOOM_LEAST = 0.25;
export const ZOOM_MOST = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/** The bounds one value is, or null when a field is missing or is not a number. */
function boundsOf(value: unknown): Rect | null {
    if (!isRecord(value)) return null;
    const { x, y, w, h } = value;
    if (!finite(x) || !finite(y) || !finite(w) || !finite(h) || w < 1 || h < 1) return null;
    return { x, y, w, h };
}

/** The state the text of window.json holds, or null for text that holds none. */
export function parseWindowFile(text: string): WindowState | null {
    let read: unknown;
    try {
        read = JSON.parse(text);
    } catch {
        return null;
    }
    if (!isRecord(read)) return null;
    const bounds = boundsOf(read.bounds);
    const { maximised, fullScreen, zoom } = read;
    if (bounds === null || typeof maximised !== 'boolean' || typeof fullScreen !== 'boolean') {
        return null;
    }
    if (!finite(zoom) || zoom < ZOOM_LEAST || zoom > ZOOM_MOST) return null;
    return { bounds, maximised, fullScreen, zoom };
}

/** The text of window.json for a state. */
export function windowFileText(state: WindowState): string {
    return `${JSON.stringify(state, null, 4)}\n`;
}

/**
 * The window's own state, held while the page it shows is in full screen. `leaving` marks the page
 * as out of full screen while the window is still on its way out of its own, which macOS does
 * after the page's event.
 */
export type PageFullScreen = { own: WindowState; leaving: boolean };

/**
 * What happened to a window: its page entered or left full screen, or anything else that changes
 * what the file holds (a move, a resize, a window state change, a close, a zoom).
 */
export type WindowChange = 'page-enter' | 'page-leave' | 'other';

/** The hold after a change, and the state the file is to keep, null for none. */
type Recorded = { hold: PageFullScreen | null; state: WindowState | null };

/**
 * The state to keep for a change, given the hold and the window's live state `now`.
 *
 * On the page's entry the window's own state is taken from `now`, which on macOS is read before the
 * window starts its own full screen, and held; a window the reader had in full screen is held in
 * full screen, so it is kept in full screen. While held, every change keeps the held state with the
 * live zoom. On the page's leaving a window that was in full screen already stays in it and takes
 * `now`; any other window is released by the first change that finds it out of full screen.
 */
export function recordWindow(
    hold: PageFullScreen | null,
    change: WindowChange,
    now: WindowState
): Recorded {
    if (change === 'page-enter') {
        return { hold: { own: hold?.own ?? now, leaving: false }, state: null };
    }
    if (hold === null) return { hold: null, state: now };
    if (change === 'page-leave') {
        if (hold.own.fullScreen) return { hold: null, state: now };
        return { hold: { ...hold, leaving: true }, state: null };
    }
    if (hold.leaving && !now.fullScreen) return { hold: null, state: now };
    return { hold, state: { ...hold.own, zoom: now.zoom } };
}
