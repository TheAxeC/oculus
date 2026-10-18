// Layer 2, client-state tests. The viewport a terminal keeps while its grid is drawn again
// (state/sessions/terminal/viewport.ts): the line the next grid scrolls to, after Float, Return to
// Page or a move, which keep it in the page, and after a reload, which keeps it in the browser
// tab's storage. A buffer is a list of lines with a viewport three lines high, and the storage is a
// fake that holds what it is written.
//
// It does not cover the xterm grid that reads and moves the viewport (kept-viewport.ts), which the
// look does.

import { describe, expect, it } from 'vitest';
import {
    createViewports,
    scrollTarget,
    viewportOf,
    type Viewport,
    type ViewportKeeper
} from '../../../../src/lib/state/sessions/terminal/viewport.ts';

/** How many lines the viewport shows. */
const ROWS = 3;

/** The lines `line 0` to `line <count - 1>`, from `first` on. */
const lines = (first: number, count: number): string[] =>
    Array.from({ length: count }, (_, at) => `line ${String(first + at)}`);

/** The viewport of a buffer whose top line is `top`, as a grid reads it when it goes. */
function sat(buffer: string[], top: number): Viewport {
    return viewportOf(top, buffer.length - ROWS, buffer.slice(top, top + ROWS + 2));
}

/** A storage that holds what it is written, as the browser tab's does across a reload. */
function storage(): ViewportKeeper {
    let held: Record<string, Viewport> = {};
    return {
        read: () => structuredClone(held),
        write: (kept) => {
            held = structuredClone(kept);
        }
    };
}

const CASES = [
    {
        row: 'Float over the same scrollback goes back to the line it sat at',
        before: lines(0, 40),
        top: 12,
        reload: false,
        after: lines(0, 40),
        line: 12
    },
    {
        row: 'a move over a scrollback that starts 10 lines later finds the line by its text',
        before: lines(0, 40),
        top: 12,
        reload: false,
        after: lines(10, 34),
        line: 2
    },
    {
        row: 'a reload goes back to the line it sat at',
        before: lines(0, 40),
        top: 12,
        reload: true,
        after: lines(0, 40),
        line: 12
    },
    {
        row: 'a reload over a scrollback that grew finds the line by its text',
        before: lines(0, 40),
        top: 12,
        reload: true,
        after: lines(0, 60),
        line: 12
    },
    {
        row: 'Return to Page of a grid that sat at its end stays at the end',
        before: lines(0, 40),
        top: 37,
        reload: false,
        after: lines(0, 45),
        line: 42
    },
    {
        row: 'a line whose text the scrollback no longer holds is taken by its count, never past the end',
        before: lines(0, 40),
        top: 30,
        reload: false,
        after: lines(100, 20),
        line: 17
    }
];

describe('a terminal grid drawn again', () => {
    it.each(CASES)('$row', ({ before, top, reload, after, line }) => {
        const kept = storage();
        const first = createViewports(kept);
        first.keep('t1', sat(before, top));
        const next = reload ? createViewports(kept) : first;
        const taken = next.take('t1');
        const target = scrollTarget(taken, after.length - ROWS, (at) => after[at] ?? null);
        expect(target).toBe(line);
    });
});
