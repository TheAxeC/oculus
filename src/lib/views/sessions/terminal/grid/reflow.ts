// Layer 3, view support. Schedule a terminal option update and wait one more animation frame before
// fitting and reporting its measured rows and columns.

export type Frame = (run: () => void) => number;
export type CancelFrame = (frame: number) => void;

/** Update xterm now, then fit only after its following render frame has measured the new cells. */
export function scheduleReflow(
    frame: Frame,
    cancelFrame: CancelFrame,
    update: () => boolean,
    reflow: () => void
): () => void {
    let second: number | null = null;
    const first = frame(() => {
        if (update()) second = frame(reflow);
    });
    return () => {
        cancelFrame(first);
        if (second !== null) cancelFrame(second);
    };
}
