// Layer 3, primitive. The drag handle's two numbers: its thickness, which SplitView subtracts from
// the container before it turns a drag into a fraction, and how far one arrow key moves it.

/**
 * The handle's thickness in pixels. SplitView subtracts it from the container before it turns a
 * drag into a fraction, so the two agree by importing one number rather than by matching two.
 */
export const SASH_PX = 6;

/** How far one arrow key moves the handle, in pixels. */
export const STEP = 16;
