// Layer 3, view helper. What the keys of a slide on screen need: which elements of a slide act on a
// press themselves, how Tab wraps inside the full-screen box, and which move a key makes. The
// Present pane, its presenter screen and the audience window read the moves from here, so one key
// is one move in all three.

import type { Move } from '$lib/state/life/present';

/** What a press or a click inside the slide is left to: the control's own action. */
export const CONTROLS =
    'a[href], button, input, select, textarea, summary, [contenteditable], [role="button"], [role="link"]';

/** What Tab stops at inside the box in full screen. */
const FOCUSABLE = `${CONTROLS}, [tabindex]`;

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
