// Layer 2, server (the desktop host). Which window a tab released on the screen lands in. The
// window whose bounds hold the point takes it; where several do, the one the reader had
// focused last. Pure: the windows are handed in.

import type { Rect } from './place.ts';

/** A window as the decision reads it: its id, its bounds, and when it was last focused. */
export type DropWindow = { id: number; bounds: Rect; focusedAt: number };

/** The id of the window holding `point`, or null when none does. */
export function windowAt(
    point: { x: number; y: number },
    windows: readonly DropWindow[]
): number | null {
    let best: DropWindow | null = null;
    for (const one of windows) {
        const { x, y, w, h } = one.bounds;
        const holds = point.x >= x && point.x < x + w && point.y >= y && point.y < y + h;
        if (holds && (best === null || one.focusedAt > best.focusedAt)) best = one;
    }
    return best === null ? null : best.id;
}
