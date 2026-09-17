// Layer 3, view helpers. The measured rules of a card's layout, as arithmetic over numbers the
// components read from the page: where a card's actions go and how many fit on their one line
// before the rest go behind the More menu, whether a description is longer than its clamp, and
// which measurement is still wanted once a newer one has started or the component has gone.
//
// They are apart from the components so the rules can be read without a DOM; the components only
// measure and hand the numbers in.

/** How many lines a card's description shows before its Show more control. */
export const CLAMP_LINES = 4;

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
    return height > lineHeight * lines + 1;
}

/** The control a clamp draws: none for a text that fits, else the one that changes its state. */
export function clampControl(open: boolean, overflowing: boolean): ClampControl {
    if (!overflowing) return null;
    return open ? 'less' : 'more';
}

/**
 * How much narrower than the measured room the actions are kept: widths are fractional, and a strip
 * that filled its room to the last fraction could still be pushed onto a line of its own.
 */
export const SLACK = 1;

/** Where a card's actions sit: the width they have, and whether that is a line of their own. */
export type ActionPlace = { room: number; alone: boolean };

/**
 * The room the actions have. `line` is the width of the line they sit in that can be seen, `others`
 * what the line's other contents (a card's chips) take of it with their gaps, and `least` the
 * narrowest strip of use: every action, or More alone. The actions stay beside the
 * others when that much fits there, less the slack; otherwise they take a line of their own, the
 * whole visible line. A line not measured yet (zero) has no room.
 */
export function actionPlace(line: number, others: number, least: number): ActionPlace {
    if (line <= 0) return { room: 0, alone: false };
    const beside = line - others;
    if (beside >= least + SLACK) return { room: beside - SLACK, alone: false };
    return { room: Math.max(0, line - SLACK), alone: true };
}

/** The narrowest strip of use: every action when they take less than More, else More alone. */
export function leastStrip(widths: number[], more: number, gap: number): number {
    const all =
        widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
    if (widths.length === 0) return 0;
    return Math.min(all, more);
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
    const span = (count: number): number =>
        widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
        gap * Math.max(0, count - 1);
    if (span(widths.length) <= room) return widths.length;
    const left = room - more - gap;
    let count = 0;
    while (count < widths.length && span(count + 1) <= left) count += 1;
    return count;
}
