// Layer 3, primitive helper. Calls back whenever the room of a toolbar or the width of one of its
// controls may have changed: the box that gives the room resizing (the container's room element,
// which follows the pane and the text size), a control resizing, or a control arriving or leaving.
// The toolbar's own box is not watched, since its width follows from the measure and cannot change
// the room. The toolbar measures in the callback, so what it measures is always the layout as it
// is now.

/** Watch `room` and the elements of `line`; returns what stops the watching. */
export function watchToolbar(
    room: HTMLElement,
    line: HTMLElement,
    changed: () => void
): () => void {
    const sizes = new ResizeObserver(changed);
    const observe = (): void => {
        sizes.disconnect();
        sizes.observe(room);
        for (const control of Array.from(line.children)) sizes.observe(control);
    };
    const members = new MutationObserver(() => {
        observe();
        changed();
    });
    observe();
    members.observe(line, { childList: true });
    return () => {
        sizes.disconnect();
        members.disconnect();
    };
}
