// Layer 2, client state. The viewport a terminal keeps while its grid is torn down and drawn again:
// Float and Return to Page draw the Terminal view in another host, so the grid mounts a new xterm
// and repaints it from the scrollback the server sends. The line the viewport sat at, counted from
// the top, and whether it sat at the end are kept per terminal when the grid goes, and the next
// grid scrolls to that line once the scrollback it is sent has been written, or stays at the end
// when the viewport sat there.

/** Where a terminal's viewport sat: its top line, and whether it was on the last line. */
export type Viewport = { line: number; atEnd: boolean };

/**
 * The viewport of a terminal whose top line is `line` of a buffer whose last viewport position is
 * `last` (xterm's `viewportY` and `baseY`). A terminal with no scrollback is at its end.
 */
export function viewportOf(line: number, last: number): Viewport {
    return { line, atEnd: line >= last };
}

/**
 * The line a grid scrolls to once the scrollback is written, `last` being its last viewport
 * position: the kept line, never past `last`, or `last` itself for a terminal that sat at its end
 * and for one with nothing kept.
 */
export function scrollTarget(kept: Viewport | undefined, last: number): number {
    if (kept === undefined || kept.atEnd) return last;
    return Math.min(kept.line, last);
}

/** The viewports kept, one per terminal, each handed over once. */
export function createViewports(): {
    keep: (id: string, viewport: Viewport) => void;
    take: (id: string) => Viewport | undefined;
    drop: (id: string) => void;
} {
    const kept = new Map<string, Viewport>();
    return {
        keep: (id, viewport) => void kept.set(id, viewport),
        take: (id) => {
            const found = kept.get(id);
            kept.delete(id);
            return found;
        },
        drop: (id) => void kept.delete(id)
    };
}
