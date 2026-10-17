// Layer 3, view partial of grid/TerminalGrid.svelte. The viewport a grid drawn again by Float or
// Return to Page takes back from the last grid of its terminal (state/sessions/terminal/
// viewport.ts). It is read when the scrollback has been written, so the grid the new one replaces
// has gone and kept it by then, and the grid goes to the kept line. The line is held after that
// until the reader moves the grid: the fit to the new host and the screen tmux sends again for the
// new size come after the scrollback and can leave the grid at the end of its output, so the grid
// goes back to the line after each fit and each write while it is held. A press, a key or the
// wheel on the grid lets the line go.

import { scrollTarget, type Viewport } from '$lib/state/sessions/terminal/viewport';

/** What the hold reads and moves of an xterm grid. */
export type HeldGrid = {
    scrollToLine: (line: number) => void;
    buffer: { active: { baseY: number } };
};

/** The reader's own moves of a grid, which let the kept line go. */
const MOVES = ['wheel', 'keydown', 'pointerdown'] as const;

/**
 * Hold `grid`, drawn in `host`, at the viewport `take` hands over once its scrollback is written.
 * `painted` is called when a scrollback write has finished, `settled` after every fit and every
 * other write, and `stop` when the grid goes.
 */
export function keptViewport(
    grid: HeldGrid,
    host: HTMLElement,
    take: () => Viewport | undefined
): { painted: () => void; settled: () => void; stop: () => void } {
    let held: Viewport | undefined;
    let taken = false;
    const release = (): void => {
        held = undefined;
    };
    for (const move of MOVES) host.addEventListener(move, release, true);

    function settled(): void {
        if (held !== undefined) grid.scrollToLine(scrollTarget(held, grid.buffer.active.baseY));
    }

    return {
        painted: () => {
            if (!taken) {
                taken = true;
                held = take();
            }
            settled();
        },
        settled,
        stop: () => {
            for (const move of MOVES) host.removeEventListener(move, release, true);
        }
    };
}
