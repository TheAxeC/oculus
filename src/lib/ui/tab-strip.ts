// Layer 3, primitive. The tab strip's contract and the arithmetic it is driven by: what one tab
// holds, where a dropped tab is inserted, what the strip's overflow state is, and which axis of a
// wheel gesture moves it. Apart from the component so all four can be read without a pointer.

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
