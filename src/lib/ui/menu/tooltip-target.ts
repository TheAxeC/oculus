// Layer 3, primitive. Which element a tooltip's words describe and by which id. A screen reader
// reads a description off the control being used, so the wrapper hands it to the control it holds;
// apart from the component so both choices can be read without a DOM. And the one way a primitive
// gives the focus back to a control without its tooltip opening, since that focus is the page's and
// not a move of the reader's.

/** What the description is put on: the element's own attributes, and what it holds. */
type Described = {
    querySelector(selectors: string): Element | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
};

/** What takes focus inside a wrapper, in the order the browser reaches them. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The element the words describe: the control the wrapper holds, since a screen reader reads a
 * description off the control it is on and the wrapper is not the thing being used. A wrapper
 * around content that is no control is itself in the tab order, and then carries it instead.
 */
export function describedControl(box: Described, focusable: boolean): Described | null {
    const found = box.querySelector(FOCUSABLE);
    if (found !== null) return found;
    return focusable ? box : null;
}

/**
 * The id the control is described by, or the empty string for a wrapper that describes nothing:
 * one given no words, and a presentational one, whose tooltip only repeats the control's name.
 */
export function describedBy(id: string, text: string, presentational: boolean): string {
    return presentational || text === '' ? '' : id;
}

/** The attribute a control carries for the length of a focus the page gives it back. */
export const QUIET_FOCUS = 'data-tip-quiet';

/**
 * Give the focus back to a control, as a menu does to its opener when it closes, without the
 * tooltip that keyboard focus would open: the control is marked while the focus lands on it, and
 * the tooltip reads the mark.
 */
export function focusQuietly(control: HTMLElement): void {
    control.setAttribute(QUIET_FOCUS, '');
    control.focus();
    control.removeAttribute(QUIET_FOCUS);
}
