// Layer 3, primitive. The tab strip's contract and the arithmetic it is driven by: what one tab
// holds, where a dropped tab is inserted, what the strip's overflow state is, which axis of a wheel
// gesture moves it, and where a scroll control or a reveal brings an overflowing strip to rest: a
// tab's start at its left edge, or the strip's end. Apart from the component so all of it can be read
// without a pointer.

/** One tab: what it is called, what it is drawn with, and the id the callbacks name it by. */
export type Tab = {
    id: string;
    label: string;
    /** A glyph name, or nothing for a tab that is drawn with its label alone. */
    glyph?: string;
    /** What the tooltip says, when it is not the label: a page tab names its shortcut. */
    hint?: string;
    /** Live text drawn after the label; an empty string draws no count pill. */
    badge?: string;
    /** A glyph name drawn in the badge before its text. */
    badgeGlyph?: string;
    /** A hue name from state/tones.ts; absent uses the accent pair. */
    badgeTone?: string;
    /** Hover text shared by the count badge and its split strip. */
    badgeTitle?: string;
    /** Coloured counts after the badge, with each colour already resolved to a theme hue. */
    cells?: { count: number; color: string; label: string }[];
    /** The tab the next single click replaces: its label is drawn in italics. */
    preview?: boolean;
    /** The tab holds text no save has taken: a dot stands in the close control's place and its name says so. */
    dirty?: boolean;
};

/**
 * Where a tab dropped at `x` would be inserted, given the midpoint of every tab in the strip in
 * the same coordinates: before the first tab whose middle the pointer has not passed, and at the
 * end when it has passed them all. The midpoints are what a strip measures; the arithmetic is
 * here so it can be checked without a pointer.
 */
export function insertionIndex(midpoints: number[], x: number): number {
    const found = midpoints.findIndex((middle) => x < middle);
    return found < 0 ? midpoints.length : found;
}

export type TabScrollState = {
    overflowing: boolean;
    atStart: boolean;
    atEnd: boolean;
};

/** Overflow uses the width without controls; edge state uses the current viewport, with one pixel of rounding slack. */
export function tabScrollState(
    scrollWidth: number,
    clientWidth: number,
    scrollLeft: number,
    widthWithoutControls: number = clientWidth
): TabScrollState {
    const end = Math.max(0, scrollWidth - clientWidth);
    return {
        overflowing: scrollWidth - widthWithoutControls > 1,
        atStart: scrollLeft <= 1,
        atEnd: scrollLeft >= end - 1
    };
}

/** Turn either axis of a wheel gesture into horizontal movement, preserving trackpad intent. */
export function horizontalWheelDelta(deltaX: number, deltaY: number): number {
    return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
}

/** One tab's extent along the strip, in the strip's scroll coordinates. */
export type TabSpan = { start: number; end: number };

/** How far a measured edge may be off a tab's own edge and still be that edge: rounding. */
const EDGE_SLACK = 1;

/**
 * The offsets a strip comes to rest at from a scroll control or a reveal: every tab start the
 * strip can scroll to, 0, and the browser's largest offset, which is where the strip ends and may
 * fall short of a tab start.
 */
function rests(spans: readonly TabSpan[], max: number): number[] {
    const found = new Set<number>([0, max]);
    for (const span of spans) {
        if (span.start > 0 && span.start < max - EDGE_SLACK) found.add(span.start);
    }
    return [...found].sort((left, right) => left - right);
}

/**
 * Where a press of a scroll control takes the strip: to the next resting offset past the current one
 * in the direction pressed, which is the next tab start, or the strip's end past the last start.
 */
export function tabEdgeStep(
    spans: readonly TabSpan[],
    scrollLeft: number,
    max: number,
    direction: -1 | 1
): number {
    const all = rests(spans, max);
    if (direction > 0) return all.find((rest) => rest > scrollLeft + EDGE_SLACK) ?? max;
    return all.findLast((rest) => rest < scrollLeft - EDGE_SLACK) ?? 0;
}

/** Whether a tab lies whole inside the visible part at an offset, a pixel of rounding allowed. */
export function wholeAt(span: TabSpan, scrollLeft: number, width: number): boolean {
    return span.start >= scrollLeft - EDGE_SLACK && span.end <= scrollLeft + width + EDGE_SLACK;
}

/**
 * The resting offset that shows one tab whole: the current offset when it is one already, and
 * otherwise the one nearest the current offset among those from which the tab lies whole, which is
 * a tab start except at the strip's end. A tab wider than the visible part is shown from the resting
 * offset at or before its own start.
 */
export function revealOffset(
    spans: readonly TabSpan[],
    target: TabSpan,
    scrollLeft: number,
    width: number,
    max: number
): number {
    const all = rests(spans, max);
    const showing = all.filter((rest) => wholeAt(target, rest, width));
    if (showing.length === 0) {
        return all.findLast((rest) => rest <= target.start + EDGE_SLACK) ?? 0;
    }
    return showing.reduce((best, rest) =>
        Math.abs(rest - scrollLeft) < Math.abs(best - scrollLeft) ? rest : best
    );
}
