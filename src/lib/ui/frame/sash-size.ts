// Layer 3, primitive. The numbers a split is laid out by: the drag handle's thickness, which
// SplitView subtracts from the container before it turns a drag into a fraction, how far one arrow
// key moves it, and the thickness of a collapsed child's strip, which is subtracted the same way.

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
