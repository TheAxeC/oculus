// Layer 3, view partial of grid/TerminalGrid.svelte. The viewport a grid drawn again by Float,
// Return to Page, a pane move or a reload of the page takes back from the last grid of its terminal
// (state/sessions/terminal/viewport.ts). It is read when the scrollback has been written, so the
// grid the new one replaces has gone and kept it by then, and the grid goes to the kept line, found
// by its text. The line is held after that until the reader moves the grid: the fit to the new host
// and the screen tmux sends again for the new size come after the scrollback and can leave the grid
// at the end of its output, so the grid goes back to the line after each fit and each write while
// it is held. A press, a key or the wheel on the grid lets the line go.
//
// The grid keeps its viewport when it goes (`keep`) and when the page is put away (`pagehide`),
// which a reload does without tearing the grid down. A grid that goes before its first scrollback
// was written keeps nothing, so the viewport the grid before it kept stays for the next one. A
// screen the server sends the grid again (after a resize or a reconnect, pty-wire.ts) empties the
// grid before it is written (`reset`), so the line the reader sat at is taken first and held the
// same way, unless a line is held already, and a grid that goes before that screen is written keeps
// the held line.

import {
    KEPT_LINES,
    scrollTarget,
    viewportOf,
    type Viewport
} from '$lib/state/sessions/terminal/viewport';

/** What the hold reads and moves of an xterm grid. */
export type HeldGrid = {
    scrollToLine: (line: number) => void;
    reset: () => void;
    buffer: {
        active: {
            baseY: number;
            viewportY: number;
            getLine: (y: number) => { translateToString: (trim?: boolean) => string } | undefined;
        };
    };
};

/** The reader's own moves of a grid, which let the kept line go. */
const MOVES = ['wheel', 'keydown', 'pointerdown'] as const;

/** The text of one line of a grid's buffer, without its trailing blanks; null past its end. */
function lineOf(grid: HeldGrid, y: number): string | null {
    return grid.buffer.active.getLine(y)?.translateToString(true) ?? null;
}

/** Where a grid's viewport sits now, with the text of its first lines. */
function gridViewport(grid: HeldGrid): Viewport {
    const { viewportY, baseY } = grid.buffer.active;
    const text = Array.from({ length: KEPT_LINES }, (_, step) => step).flatMap((step) => {
        const line = lineOf(grid, viewportY + step);
        return line === null ? [] : [line];
    });
    return viewportOf(viewportY, baseY, text);
}

/**
 * Hold `grid`, drawn in `host`, at the viewport `take` hands over once its scrollback is written.
 * `reset` empties the grid for a scrollback, `painted` is called when a scrollback write has
 * finished, `settled` after every fit and every other write, `keep` when the grid goes, and `stop`
 * after it; `kept` is handed the viewport to keep, there and when the page is put away.
 */
export function keptViewport(
    grid: HeldGrid,
    host: HTMLElement,
    take: () => Viewport | undefined,
    kept: (viewport: Viewport) => void
): {
    reset: () => void;
    painted: () => void;
    settled: () => void;
    keep: () => void;
    stop: () => void;
} {
    let held: Viewport | undefined;
    let taken = false;
    const release = (): void => {
        held = undefined;
    };
    /** Whether the grid was emptied for a screen sent again that is not written yet. */
    let repainting = false;
    // A grid that goes before its first scrollback was written leaves the viewport the grid before
    // it kept, and one emptied for a screen not written yet keeps the line it held.
    const keep = (): void => {
        if (!taken) return;
        kept(repainting && held !== undefined ? held : gridViewport(grid));
    };
    for (const move of MOVES) host.addEventListener(move, release, true);
    window.addEventListener('pagehide', keep);

    function settled(): void {
        if (held === undefined) return;
        const last = grid.buffer.active.baseY;
        grid.scrollToLine(scrollTarget(held, last, (y) => lineOf(grid, y)));
    }

    return {
        reset: () => {
            if (taken && held === undefined) held = gridViewport(grid);
            repainting = taken;
            grid.reset();
        },
        painted: () => {
            if (!taken) {
                taken = true;
                held = take();
            }
            repainting = false;
            settled();
        },
        settled,
        keep,
        stop: () => {
            for (const move of MOVES) host.removeEventListener(move, release, true);
            window.removeEventListener('pagehide', keep);
        }
    };
}
