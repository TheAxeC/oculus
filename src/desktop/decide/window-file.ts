// Layer 2, server (the desktop host). The main window's place as it is kept in
// ~/.oculus/window.json: the bounds, whether the window is maximised or full screen, and the zoom
// factor. A pure reader and writer of the file's text; the file is read before the window is made
// and written when the window moves, resizes, changes state or closes
// (src/desktop/windows/window-state.ts).
//
// A file that is missing, is not JSON, or holds a field of the wrong type is read as nothing, and
// the window then opens at the default place; the next change writes the file over.

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
