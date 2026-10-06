// Layer 2, server (the desktop host). Where a window opens. A saved place is kept when it is on an
// attached display and moved onto the primary display when it is on none, its size kept and
// clamped to the display's work area; with no saved place the window is the default size, centred
// on the primary display. The main window's place and the places of popped-out windows are placed
// by the one function. Pure: the displays are handed in.

/** A rectangle on the screen, in points. */
export type Rect = { x: number; y: number; w: number; h: number };

/** The rectangle of Electron's bounds, in the shape the decisions read. */
export function rectOf(bounds: { x: number; y: number; width: number; height: number }): Rect {
    return { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
}

/** The size of a window with no saved place. */
const DEFAULT_SIZE = { w: 1280, h: 800 } as const;

/** The least a window must show on a display for the display to count as holding it. */
const VISIBLE = 100;

/** The overlap of two rectangles along one axis. */
function overlap(from: number, size: number, otherFrom: number, otherSize: number): number {
    return Math.min(from + size, otherFrom + otherSize) - Math.max(from, otherFrom);
}

/** Whether `rect` shows at least VISIBLE points both ways on the work area `area`. */
function shownOn(rect: Rect, area: Rect): boolean {
    return (
        overlap(rect.x, rect.w, area.x, area.w) >= Math.min(VISIBLE, rect.w) &&
        overlap(rect.y, rect.h, area.y, area.h) >= Math.min(VISIBLE, rect.h)
    );
}

/** `rect` with its size cut to the work area and its position moved inside it. */
function inside(rect: Rect, area: Rect): Rect {
    const w = Math.min(rect.w, area.w);
    const h = Math.min(rect.h, area.h);
    return {
        w,
        h,
        x: Math.min(Math.max(rect.x, area.x), area.x + area.w - w),
        y: Math.min(Math.max(rect.y, area.y), area.y + area.h - h)
    };
}

/** `size` centred in the work area, cut to it. */
function centred(size: { w: number; h: number }, area: Rect): Rect {
    const w = Math.min(size.w, area.w);
    const h = Math.min(size.h, area.h);
    return {
        w,
        h,
        x: area.x + Math.round((area.w - w) / 2),
        y: area.y + Math.round((area.h - h) / 2)
    };
}

/**
 * The place a window opens at: `saved` when an attached display shows it, `saved` moved onto the
 * primary display when none does, and the default size centred on the primary display when there
 * is none. `areas` are the displays' work areas and `primary` is the primary display's.
 */
export function placeWindow(saved: Rect | null, areas: readonly Rect[], primary: Rect): Rect {
    if (saved === null) return centred(DEFAULT_SIZE, primary);
    const holder = areas.find((area) => shownOn(saved, area));
    return holder === undefined ? inside(saved, primary) : inside(saved, holder);
}
