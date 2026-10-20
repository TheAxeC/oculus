// Layer 3, primitive. The numbers a split is laid out by: the drag handle's thickness, which
// SplitView subtracts from the container before it turns a drag into a fraction, how far one arrow
// key moves it, and the thickness of a collapsed child's strip, which is subtracted the same way;
// and the share a drag of the handle leaves the first child, kept between two bounds.

/**
 * The handle's thickness in pixels. SplitView subtracts it from the container before it turns a
 * drag into a fraction, so the two agree by importing one number rather than by matching two.
 */
export const SASH_PX = 6;

/** How far one arrow key moves the handle, in pixels. */
export const STEP = 16;

/**
 * The thickness of the strip a collapsed child of a split is drawn as, in pixels. It is wide enough
 * for the one control that expands it again, and SplitView takes it out of the space the children
 * share for the same reason it takes out the handles.
 */
export const FOLD_PX = 28;

/**
 * The share the first child of a split holds after a drag of `delta` pixels in a row with `room`
 * pixels to share, kept between `least` and `most`. A row with no room holds the share it had.
 */
export function draggedShare(
    share: number,
    delta: number,
    room: number,
    least: number,
    most: number
): number {
    if (room <= 0) return share;
    return Math.min(most, Math.max(least, share + delta / room));
}

/** The class the body carries while a sash is dragged. */
export const SASHING_CLASS = 'sashing';
