// Layer 3, primitive test. Where a scroll control or a reveal brings an overflowing tab strip to
// rest: a tab's start at its left edge, or the strip's end, which is the browser's largest offset
// and may fall short of a start. Plain numbers stand for the measured extents; the strip that
// measures them is the browser suite's.

import { describe, expect, it } from 'vitest';
import {
    revealOffset,
    tabEdgeStep,
    wholeAt,
    type TabSpan
} from '../../../src/lib/ui/tabs/tab-strip.ts';

/** Five tabs of unequal width with a 2 px gap, the last ending at 540. */
const spans: TabSpan[] = [
    { start: 0, end: 100 },
    { start: 102, end: 202 },
    { start: 204, end: 400 },
    { start: 402, end: 450 },
    { start: 452, end: 540 }
];
const WIDTH = 250;
/** The browser's largest offset for that strip, which is no tab's start. */
const MAX = 540 - WIDTH;

describe('a scroll control press', () => {
    it('moves to the next tab start in the direction pressed', () => {
        expect(tabEdgeStep(spans, 0, MAX, 1)).toBe(102);
        expect(tabEdgeStep(spans, 102, MAX, 1)).toBe(204);
        expect(tabEdgeStep(spans, 204, MAX, -1)).toBe(102);
    });

    it('goes to the strip end past the last start it can reach, and stays at either end', () => {
        expect(tabEdgeStep(spans, 204, MAX, 1)).toBe(MAX);
        expect(tabEdgeStep(spans, MAX, MAX, 1)).toBe(MAX);
        expect(tabEdgeStep(spans, 0, MAX, -1)).toBe(0);
    });

    it('goes back from the strip end to the last start before it', () => {
        expect(tabEdgeStep(spans, MAX, MAX, -1)).toBe(204);
    });

    it('moves from between two starts to the next one either way', () => {
        expect(tabEdgeStep(spans, 150, MAX, 1)).toBe(204);
        expect(tabEdgeStep(spans, 150, MAX, -1)).toBe(102);
    });

    it('stays at 0 on a strip that does not overflow', () => {
        expect(tabEdgeStep(spans, 0, 0, 1)).toBe(0);
        expect(tabEdgeStep([], 0, 0, -1)).toBe(0);
    });
});

describe('showing one tab whole', () => {
    it('stays on the start it rests on when the tab is whole there', () => {
        expect(revealOffset(spans, spans[1], 102, WIDTH, MAX)).toBe(102);
    });

    it('puts a tab to the left at the left edge', () => {
        expect(revealOffset(spans, spans[0], 204, WIDTH, MAX)).toBe(0);
    });

    it('brings a tab to the right in by the nearest start that shows it whole', () => {
        expect(revealOffset(spans, spans[2], 0, WIDTH, MAX)).toBe(204);
    });

    it('shows the last tab from the strip end when no start shows it whole', () => {
        expect(revealOffset(spans, spans[4], 0, WIDTH, MAX)).toBe(MAX);
    });

    it('moves an offset a free scroll left between two starts onto a start that keeps the tab whole', () => {
        expect(revealOffset(spans, spans[3], 240, WIDTH, MAX)).toBe(204);
    });

    it('shows a tab wider than the strip from the start at or before its own', () => {
        const wide: TabSpan[] = [
            { start: 0, end: 100 },
            { start: 102, end: 500 }
        ];
        expect(revealOffset(wide, wide[1], 0, WIDTH, 250)).toBe(102);
    });
});

describe('a tab whole at an offset', () => {
    it('is whole inside the visible part, a pixel of rounding allowed', () => {
        expect(wholeAt(spans[1], 102, WIDTH)).toBe(true);
        expect(wholeAt({ start: 0, end: 250.6 }, 0, WIDTH)).toBe(true);
    });

    it('is not whole across either edge or out of sight', () => {
        expect(wholeAt(spans[2], 102, WIDTH)).toBe(false);
        expect(wholeAt(spans[0], 102, WIDTH)).toBe(false);
        expect(wholeAt(spans[4], 0, WIDTH)).toBe(false);
    });
});
