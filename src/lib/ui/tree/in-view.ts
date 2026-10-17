// Layer 3, primitive. Bring a row into the view of the box that scrolls it, and scroll that box
// only: a tree drawn beside a list it follows, as the Settings view's table of contents follows its
// list, shows its current row after the list moved far from it, while the panes and the page
// around it stay where they are, which `Element.scrollIntoView` would scroll too.

/** The parts of a box the scroll reads and sets. */
type Scroller = Pick<HTMLElement, 'getBoundingClientRect' | 'clientHeight' | 'clientTop'> & {
    scrollTop: number;
};

/** Scroll `scroller` the least that shows the whole of `row`, or its top when it is taller. */
export function keepInView(scroller: Scroller, row: Pick<Element, 'getBoundingClientRect'>): void {
    const inside = scroller.getBoundingClientRect().top + scroller.clientTop;
    const at = row.getBoundingClientRect();
    const above = at.top - inside;
    const below = at.bottom - (inside + scroller.clientHeight);
    if (above < 0) scroller.scrollTop += above;
    else if (below > 0) scroller.scrollTop += Math.min(below, above);
}
