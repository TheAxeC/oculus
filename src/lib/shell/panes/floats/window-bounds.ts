// Layer 3, shell. Where a new window of the desktop app opens: at the place on the screen of the
// pane or float it is made from, in screen points, which is what the host places a window's
// content area by. The page knows its element's position in the window and the window's position
// on the screen, and the title bar is the difference between the window's outer and inner height.

import { WINDOW_START, type FloatPlace, type WindowBounds } from '$lib/state/workbench/layout';

/** The least width and height a window opens at, as the arrangement holds a window place. */
const LEAST = 200;

/** What the placement reads of the page's window. */
type OnScreen = Pick<Window, 'screenX' | 'screenY' | 'outerHeight' | 'innerHeight'>;

/**
 * The bounds of a new window for an element at `rect` in the page: its place on the screen, and its
 * size unless `sized` is false, when the window opens at WINDOW_START (a docked float has no size
 * of the shape a window takes). With no element the window opens at the page's own corner.
 */
function windowBoundsOf(
    rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> | null,
    view: OnScreen,
    sized: boolean
): WindowBounds {
    const bar = Math.max(0, view.outerHeight - view.innerHeight);
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    const w = sized && rect !== null ? Math.max(LEAST, Math.round(rect.width)) : WINDOW_START.w;
    const h = sized && rect !== null ? Math.max(LEAST, Math.round(rect.height)) : WINDOW_START.h;
    return {
        x: Math.round(view.screenX + left),
        y: Math.round(view.screenY + bar + top),
        w,
        h
    };
}

/**
 * Where a new window made from a pane opens: the pane's place on the screen, or the place of the
 * float the pane is when `place` names one, at the starting size for a float docked to an edge.
 */
export function windowBoundsOfPane(
    element: HTMLElement | undefined,
    place: FloatPlace | undefined
): WindowBounds {
    const from = place === undefined ? element : element?.closest<HTMLElement>('[data-float]');
    return windowBoundsOf(from?.getBoundingClientRect() ?? null, window, place?.kind !== 'dock');
}
