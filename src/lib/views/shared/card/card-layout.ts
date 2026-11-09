// Layer 3, view helpers. The measured rules of a card's layout, as arithmetic over numbers the
// components read from the page: where a card's actions go and how many fit on their one line
// before the rest go behind the More menu, whether a description is longer than its clamp, at what
// height its cut ends, and which measurement is still wanted once a newer one has started or the
// component has gone.
//
// They are apart from the components so the rules can be read without a DOM; the components only
// measure and hand the numbers in.

/** How many lines a card's description shows before its Show more control. */
export const CLAMP_LINES = 4;

/** The pixel of rounding a clamp allows, since lines stack at fractions of a pixel. */
const ROUNDING = 1;

/** What a clamp offers: the control that opens it, the one that closes it, or none. */
export type ClampControl = 'more' | 'less' | null;

/**
 * Whether a description is taller than its clamp. The height is the text's whole height, which a
 * clipped box still reports as its scroll height, and a pixel of rounding is allowed.
 */
export function overflowsClamp(
    height: number,
    lineHeight: number,
    lines: number = CLAMP_LINES
): boolean {
    if (!(lineHeight > 0)) return false;
    return height > lineHeight * lines + ROUNDING;
}

/** One box a description draws: its top and its bottom in px from the top of the text. */
export type ClampBox = { top: number; bottom: number };

/**
 * The height a description's cut ends at, so that it slices no line or block. `boxes` are what the
 * text draws, in any order and overlapping where an inline formula sits on a line of words, and
 * `clamp` is the line height times CLAMP_LINES. The answer is the bottom of the last box that fits:
 * the largest bottom no more than a pixel past the clamp and more than a pixel inside no box. One
 * within a pixel of the clamp is the clamp, so a plain text is cut at exactly its lines. Where no
 * box fits whole, or there are no boxes, the answer is the clamp.
 */
export function clampCutHeight(boxes: readonly ClampBox[], clamp: number): number {
    const inside = (edge: number): boolean =>
        boxes.some((box) => edge > box.top + ROUNDING && edge < box.bottom - ROUNDING);
    const ends = boxes
        .map((box) => box.bottom)
        .filter((bottom) => bottom <= clamp + ROUNDING && !inside(bottom));
    if (ends.length === 0) return clamp;
    const last = Math.max(...ends);
    return Math.abs(last - clamp) <= ROUNDING ? clamp : last;
}

/** The control a clamp draws: none for a text that fits, else the one that changes its state. */
export function clampControl(open: boolean, overflowing: boolean): ClampControl {
    if (!overflowing) return null;
    return open ? 'less' : 'more';
}

/**
 * How much narrower than the measured room the actions are kept: widths are fractional, and a strip
 * that filled its room to the last fraction could still wrap off the line it shares with the chips.
 */
export const SLACK = 1;

/** Where a card's actions sit: the width they have, and whether the others leave them no room. */
export type ActionPlace = { room: number; alone: boolean };

/**
 * The room the actions have. `line` is the width of the line they sit in that can be seen, `others`
 * what the line's other contents (a card's chips) take of it with their gaps, and `least` the width
 * the actions must have to stay there, which CardActions.svelte takes as every action and the
 * opener after them. The actions stay beside the others when that much fits there, less the slack;
 * otherwise they have the whole visible line, lying over the card on a screen that hovers and on a
 * line of their own on one that does not. A line not measured yet (zero) has no room.
 */
export function actionPlace(line: number, others: number, least: number): ActionPlace {
    if (line <= 0) return { room: 0, alone: false };
    const beside = line - others;
    if (beside >= least + SLACK) return { room: beside - SLACK, alone: false };
    return { room: Math.max(0, line - SLACK), alone: true };
}

/** The width a run of actions takes: their widths and the gaps between them. */
export function stripWidth(widths: number[], gap: number): number {
    return widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
}

/**
 * A guard over measurements that land later than they were asked for (after a tick, from an
 * observer): only the latest one begun is still wanted, and none once the component has closed it.
 * Beginning again opens it, which is what a component's effect does when it runs again.
 */
export type MeasureGate = {
    begin: () => number;
    current: (token: number) => boolean;
    close: () => void;
};

export function measureGate(): MeasureGate {
    let latest = 0;
    let closed = false;
    return {
        begin() {
            closed = false;
            latest += 1;
            return latest;
        },
        current: (token) => !closed && token === latest,
        close() {
            closed = true;
        }
    };
}

/**
 * How many actions, in order, stay on the line. Every action fits when their widths and the gaps
 * between them fit in the room; otherwise the More control takes its own width and a gap from the
 * room, and the actions fill what is left, so the line never holds more than it has room for. A
 * room that has not been measured yet (zero) keeps every action on the line.
 */
export function fitActions(widths: number[], room: number, more: number, gap: number): number {
    if (room <= 0) return widths.length;
    const span = (count: number): number => stripWidth(widths.slice(0, count), gap);
    if (span(widths.length) <= room) return widths.length;
    const left = room - more - gap;
    let count = 0;
    while (count < widths.length && span(count + 1) <= left) count += 1;
    return count;
}
