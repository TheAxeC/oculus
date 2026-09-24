// Layer 3, primitive. The action that draws an element on the body rather than where it is written.
// A surface that filters or clips what it holds (the rail and the panes over a wallpaper, a strip
// that scrolls) is the containing block of a fixed element inside it, which then reads window
// coordinates from that surface's corner and is cut at its edge; on the body there is no such
// ancestor. A tooltip's bubble, a menu's list opened at a point, and the status bar's confirm,
// notification centre and toasts use it.

/**
 * Move the element onto the body, and take it away with its component. `wanted` false leaves the
 * element where it is written, for a caller that draws it on the body in one of its looks only.
 */
export function onBody(node: HTMLElement, wanted = true): { destroy: () => void } {
    if (!wanted) return { destroy: () => undefined };
    document.body.append(node);
    return { destroy: () => node.remove() };
}
