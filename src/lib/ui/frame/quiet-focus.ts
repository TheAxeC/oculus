// Layer 3, primitive. The one way a primitive gives the focus to a control without its tooltip
// opening, since that focus is the page's and not a move of the reader's: a closing menu giving it
// back to its opener, and a dialog taking it when it opens and giving it back when it goes. Here
// under the menus and the dialogs, since both use it.

/** What takes focus inside a box, in document order. */
export const FOCUSABLE =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The attribute a control carries for the length of a focus the page gives it. */
export const QUIET_FOCUS = 'data-tip-quiet';

/**
 * Give the focus to a control, as a menu does to its opener when it closes, without the tooltip
 * that keyboard focus would open: the control is marked while the focus lands on it, and the
 * tooltip reads the mark.
 */
export function focusQuietly(control: HTMLElement): void {
    control.setAttribute(QUIET_FOCUS, '');
    control.focus();
    control.removeAttribute(QUIET_FOCUS);
}

/**
 * Whether no control holds the keyboard: the document has no focused element, the focus is on the
 * body, or it is on a control that has gone from the page. A button taken off the page keeps the
 * focus until the browser hands it to the document, so it counts as nothing.
 */
export function focusIsFree(): boolean {
    const held = document.activeElement;
    return held === null || held === document.body || !held.isConnected;
}

/**
 * Give the focus back to the control that held it before a box was drawn, as a dialog does when it
 * goes, once the teardown that asks for it has finished, and only while that control is still on
 * the page and no other control holds the focus. A focus runs the focus handlers of the control it
 * lands on at once, and inside a teardown Svelte answers every read of state changed in the same
 * flush with the value from before the change, so a handler run there that writes state writes
 * back what the change replaced. A control that took the focus in that flush, as a view opened by
 * the answer does, keeps it.
 */
export function giveBackQuietly(control: Element | null): void {
    queueMicrotask(() => {
        if (focusIsFree() && control instanceof HTMLElement && control.isConnected) {
            focusQuietly(control);
        }
    });
}

/** Whether Tab reaches the element: in the tab order, enabled, and not hidden or inert. */
function tabbable(found: Element): found is HTMLElement {
    if (!(found instanceof HTMLElement) || found.tabIndex < 0) return false;
    if (found.matches(':disabled, input[type="hidden"]')) return false;
    return found.closest('[hidden], [inert]') === null;
}

/**
 * Put the focus quietly on the first control in document order that Tab reaches inside a box, as a
 * dialog does when it opens; on the box itself when it holds none, as the key sheet does.
 */
export function focusFirstQuietly(box: HTMLElement): void {
    const first = [...box.querySelectorAll(FOCUSABLE)].find(tabbable);
    focusQuietly(first ?? box);
}

/**
 * A dialog's first-focus handler: bits-ui's own focus is kept off, and the keyboard goes where the
 * dialog asks once `settled` has resolved, since the bindings the box is found through are set in
 * the flush after the box is drawn and not yet when the handler runs. `onopen` puts the keyboard
 * where the box wants it; without one it goes to the first control Tab reaches in the box found by
 * `find`, or to the box itself when it holds none.
 */
export function focusOnOpen(
    event: Event,
    settled: Promise<void>,
    onopen: (() => void) | undefined,
    find: () => HTMLElement | null | undefined
): void {
    event.preventDefault();
    void settled.then(() => {
        if (onopen !== undefined) {
            onopen();
            return;
        }
        const box = find();
        if (box !== null && box !== undefined) focusFirstQuietly(box);
    });
}
