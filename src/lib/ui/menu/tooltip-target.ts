// Layer 3, primitive. Which element a tooltip's words describe and by which id. A screen reader
// reads a description off the control being used, so the wrapper hands it to the control it holds;
// apart from the component so both choices can be read without a DOM.

import { FOCUSABLE } from '../frame/quiet-focus';

/** What the description is put on: the element's own attributes, and what it holds. */
type Described = {
    querySelector(selectors: string): Element | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
};

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
