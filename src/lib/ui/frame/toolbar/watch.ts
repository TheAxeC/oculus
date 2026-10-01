// Layer 3, primitive helper. Calls back whenever the room of a toolbar or the width of one of its
// controls may have changed: the toolbar's own box resizing, a control resizing, or a control
// arriving or leaving. The toolbar measures in the callback, so what it measures is always the
// layout as it is now.

/** Watch `root` and the elements of `line`; returns what stops the watching. */
export function watchToolbar(
    root: HTMLElement,
    line: HTMLElement,
    changed: () => void
): () => void {
    const sizes = new ResizeObserver(changed);
    const observe = (): void => {
        sizes.disconnect();
        sizes.observe(root);
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
