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
