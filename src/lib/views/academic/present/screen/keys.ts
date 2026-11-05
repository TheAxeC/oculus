// Layer 3, view helper. What the keys of a slide on screen need: which elements of a slide act on a
// press themselves, which are fields that keep every key typed in them, how Tab wraps inside the
// full-screen box, which keys full screen holds back from the shell, and which move a key makes.
// The Present pane, its presenter screen and the audience window read the moves from here, so one
// key is one move in all three.

import type { Move } from '$lib/state/life/present';

/** What a press or a click inside the slide is left to: the control's own action. */
export const CONTROLS =
    'a[href], button, input, select, textarea, summary, [contenteditable], [role="button"], [role="link"]';

/** What Tab stops at inside the box in full screen. */
const FOCUSABLE = `${CONTROLS}, [tabindex]`;

/** The card cursor's keys, which act on the overview grid's tiles inside the box. */
const GRID_KEYS = new Set(['j', 'k', 'i', 'ArrowUp', 'ArrowDown']);

/**
 * The controls the reader types in, which keep every key typed in them. A select's trigger
 * (`aria-haspopup="listbox"`, as bits-ui's Select draws it) is one: its arrow keys and letters
 * pick a value.
 */
const FIELDS = 'input, textarea, select, [contenteditable], [aria-haspopup="listbox"]';

/** Whether a key was pressed in a field, which keeps every key typed in it. */
export function inField(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(FIELDS) !== null;
}

/**
 * Whether a key the deck does not own is held back from the shell in full screen: the shell's
 * keys open sheets, search and chords that are drawn outside the full-screen element, so the
 * keyboard would be lost with the slide in view. The card cursor's keys act on the grid's tiles
 * inside the box and pass while the grid is open, a control (`control`, a button or a link as
 * well as a field) keeps Enter and Space, which activate it, as Enter on the card under the
 * cursor does, and a field keeps what is typed in it.
 */
export function heldBack(
    event: Pick<KeyboardEvent, 'key' | 'target'>,
    at: { control: boolean; grid: boolean; cursor: boolean }
): boolean {
    if (inField(event.target)) return false;
    if (at.grid && GRID_KEYS.has(event.key)) return false;
    if (event.key === 'Enter' && (at.control || (at.grid && at.cursor))) return false;
    return !(at.control && event.key === ' ');
}

/** Tab and Shift+Tab move through the slide's controls and wrap inside the box. */
export function keepTab(event: KeyboardEvent, box: HTMLElement): void {
    const stops = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.tabIndex >= 0 && element.getClientRects().length > 0
    );
    const at = document.activeElement;
    const first = stops.at(0);
    const final = stops.at(-1);
    if (first === undefined || final === undefined) {
        event.preventDefault();
        return;
    }
    if (event.shiftKey && (at === first || at === box)) {
        event.preventDefault();
        final.focus();
    } else if (!event.shiftKey && at === final) {
        event.preventDefault();
        first.focus();
    }
}

/**
 * The move a key press makes through a deck: the arrows and Page Up and Page Down one slide, Home
 * and End the ends, Space one slide on and Shift+Space one back. Null for any other key.
 */
export function moveOf(event: Pick<KeyboardEvent, 'key' | 'shiftKey'>): Move | null {
    switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
            return { by: 1 };
        case 'ArrowLeft':
        case 'PageUp':
            return { by: -1 };
        case 'Home':
            return { to: 'first' };
        case 'End':
            return { to: 'last' };
        case ' ':
            return { by: event.shiftKey ? -1 : 1 };
        default:
            return null;
    }
}
