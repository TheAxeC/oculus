// Layer 3, primitive. The rule a strip of controls carries its keyboard stop by. A strip of many
// buttons is one stop of the browser's own focus order: the control at the stop carries tabindex 0
// and the rest carry -1, so a reader tabs past the whole strip in one press and moves inside it
// with the arrow keys. The arithmetic is here rather than in each strip so the wrap is written once
// and asserted without a DOM.
//
// The rail's controls sit in a `role="toolbar"` inside the `<nav>`, so the landmark stays a
// landmark, and no container takes a tabindex or a focus of its own. The stop moves with the focus
// and passes to the control that took its place when its own control leaves the ring.

/**
 * Which pair of arrow keys a strip answers: the row keys for a tab strip, the column keys for the
 * rail.
 */
export type RovingAxis = 'row' | 'column';

/**
 * The stop one key asks for, or null for a key the strip does not answer. Home and End land on the
 * ends; a step past an end wraps, so a strip is a ring. A strip whose stop is nowhere yet starts at
 * the first control, whichever way the key goes.
 */
export function nextStop(
    key: string,
    current: number,
    count: number,
    axis: RovingAxis
): number | null {
    if (count <= 0) return null;
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    const back = axis === 'row' ? 'ArrowLeft' : 'ArrowUp';
    const on = axis === 'row' ? 'ArrowRight' : 'ArrowDown';
    if (key !== back && key !== on) return null;
    if (current < 0 || current >= count) return 0;
    return (current + (key === on ? 1 : -1) + count) % count;
}

/**
 * The stop to hold once the ring has changed, given the ring before and after. A control that is
 * still there keeps the stop; a control that has gone hands it to the one that now sits where it
 * sat, which is the nearest survivor after it, or the nearest before it when it was the last. An
 * empty ring holds no stop. A reader whose control was disabled by their own press therefore finds
 * the stop beside it rather than back at the top.
 */
export function heldStop(before: string[], after: string[], current: string): string {
    if (after.includes(current)) return current;
    if (after.length === 0) return '';
    const was = before.indexOf(current);
    if (was < 0) return after[0];
    const onward = before.slice(was + 1).find((id) => after.includes(id));
    if (onward !== undefined) return onward;
    const back = before.slice(0, was).findLast((id) => after.includes(id));
    return back ?? after[0];
}
