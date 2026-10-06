// Layer 3, view helper. The two DOM facts the Present pane's keys need: which elements of a slide
// act on a press themselves, and how Tab wraps inside the full-screen box.

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
