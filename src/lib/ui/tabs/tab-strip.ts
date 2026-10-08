// Layer 3, primitive. The tab strip's contract and the arithmetic it is driven by: what one tab
// holds, where a dropped tab is inserted, what the strip's overflow state is, which axis of a wheel
// gesture moves it, and where a scroll control or a reveal brings an overflowing strip to rest: a
// tab's start at its left edge, or the strip's end. Apart from the component so all of it can be
// read without a pointer.

/** One tab: what it is called, what it is drawn with, and the id the callbacks name it by. */
export type Tab = {
    id: string;
    label: string;
    /** A glyph name, or nothing for a tab that is drawn with its label alone. */
    glyph?: string;
    /**
     * The path of the file the tab shows. The tab then draws that file's icon (display/FileIcon)
     * in place of its glyph, as the Files tree draws it for the same file.
     */
    file?: string;
    /** A theme token name (`--c-red`) the glyph is drawn in; absent keeps the tab's colour. */
    tint?: string;
    /** What the tooltip says, when it is not the label: a page tab names its shortcut. */
    hint?: string;
    /** Live text drawn after the label; an empty string draws no count pill. */
    badge?: string;
    /** A glyph name drawn in the badge before its text. */
    badgeGlyph?: string;
    /** A hue name from state/shared/words/tones.ts; absent uses the accent pair. */
    badgeTone?: string;
    /** Hover text shared by the count badge and its split strip. */
    badgeTitle?: string;
    /** Coloured counts after the badge, with each colour already resolved to a theme hue. */
    cells?: { count: number; color: string; label: string }[];
    /** The tab the next single click replaces: its label is drawn in italics. */
    preview?: boolean;
    /**
     * The tab holds text no save has taken: a dot stands in the close control's place and its name
     * says so.
     */
    dirty?: boolean;
    /** The tab is pinned: a pin stands in the close control's place and presses to unpin. */
    pinned?: boolean;
    /** The file the tab shows is off the disk: its label is struck through, in the error colour. */
    gone?: boolean;
    /**
     * The errors and warnings the file the tab shows holds: the count already worded (`9+` from
     * ten), the hover words that say it, and the hue of the worst. The count is drawn after the
     * label and the label takes the hue.
     */
    problem?: { count: string; title: string; tone: 'error' | 'warning' };
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

/** One tab's measured box in the viewport, which is how the rows of a wrapped strip are found. */
export type TabBox = { left: number; right: number; top: number; bottom: number };

/**
 * One row of a wrapped strip: the index of its first tab, its extent down the page, and the middle
 * of each of its tabs along the row.
 */
export type TabRow = { first: number; top: number; bottom: number; mids: number[] };

/** Where a row starts being a new one: a tab whose top is at or below the row's bottom edge. */
const ROW_SLACK = 1;

/** The tabs grouped by the line they sit on, in order; a strip that did not wrap is one row. */
export function tabRows(boxes: readonly TabBox[]): TabRow[] {
    const rows: TabRow[] = [];
    for (const [index, box] of boxes.entries()) {
        const row = rows.at(-1);
        if (row !== undefined && box.top < row.bottom - ROW_SLACK) {
            row.mids.push((box.left + box.right) / 2);
            continue;
        }
        rows.push({
            first: index,
            top: box.top,
            bottom: box.bottom,
            mids: [(box.left + box.right) / 2]
        });
    }
    return rows;
}

/**
 * Where a tab dropped at (`x`, `y`) would be inserted into a strip of several rows: the row under
 * the pointer (the first above the strip, the last below it, the nearer one in a gap between two)
 * gives the place by `insertionIndex` along the row, counted from the strip's first tab.
 */
export function wrappedInsertion(rows: readonly TabRow[], x: number, y: number): number {
    const first = rows.at(0);
    const last = rows.at(-1);
    if (first === undefined || last === undefined) return 0;
    const row =
        rows.find((one) => y >= one.top && y < one.bottom) ??
        (y < first.top ? first : y >= last.bottom ? last : nearest(rows, y));
    return row.first + insertionIndex(row.mids, x);
}

/** The row whose extent is nearest a vertical position, for a pointer in the gap between rows. */
function nearest(rows: readonly TabRow[], y: number): TabRow {
    const gap = (row: TabRow): number => Math.min(Math.abs(y - row.top), Math.abs(y - row.bottom));
    return rows.reduce((best, row) => (gap(row) < gap(best) ? row : best));
}

/**
 * What Delete on a focused tab comes to: an unpinned tab closes; a pinned tab stays open and the
 * first unpinned tab of the pane becomes the active one, as VS Code does with
 * `preventPinnedEditorClose`; a pane with no unpinned tab changes nothing.
 */
export function afterDelete(
    tabs: readonly { id: string; pinned?: boolean }[],
    id: string
): { kind: 'close' } | { kind: 'activate'; id: string } | { kind: 'none' } {
    if (tabs.find((tab) => tab.id === id)?.pinned !== true) return { kind: 'close' };
    const first = tabs.find((tab) => tab.pinned !== true);
    return first === undefined ? { kind: 'none' } : { kind: 'activate', id: first.id };
}

export type TabScrollState = {
    overflowing: boolean;
    atStart: boolean;
    atEnd: boolean;
};

/**
 * Whether the scroll controls stand beside the tabs: only when the strip holds the tabs' least
 * width and both controls on one line. A narrower strip draws no controls, so the tabs keep their
 * line and the shown tab its room; the wheel and the arrow keys still move along the tabs.
 */
export function controlsFit(strip: number, least: number, controls: number): boolean {
    return strip >= least + controls;
}

/**
 * Whether a strip wraps its tabs onto several rows: when the reader asked for it and the strip
 * draws every tab, which is `show_tabs: multiple`. Under any other value the setting is ignored.
 */
export function stripWraps(wrapTabs: boolean, bar: string): boolean {
    return wrapTabs && bar === 'multiple';
}

/**
 * Overflow uses the width without controls; edge state uses the current viewport, with one pixel of
 * rounding slack. A strip that wraps has no overflow and no scroll offset, however wide its tabs
 * are in all.
 */
export function tabScrollState(
    scrollWidth: number,
    clientWidth: number,
    scrollLeft: number,
    widthWithoutControls: number = clientWidth,
    wrapped = false
): TabScrollState {
    if (wrapped) return { overflowing: false, atStart: true, atEnd: true };
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
 * Where a press of a scroll control takes the strip: to the next resting offset past the current
 * one in the direction pressed, which is the next tab start, or the strip's end past the last
 * start.
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
 * a tab start except at the strip's end. A tab wider than the visible part is shown from the
 * resting offset at or before its own start.
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
