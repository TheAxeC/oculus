// Layer 3, shell. Keyboard actions over the focused pane's DOM. Each reports whether a target
// exists and was acted on, so an unavailable action leaves the browser's default key handling intact.

/** Focus and select the pane's search text only when a search input exists. */
export function focusSearch(pane: ParentNode | null): boolean {
    const search = pane?.querySelector<HTMLInputElement>('input[data-search]');
    if (!search) return false;
    search.focus();
    search.select();
    return true;
}

/** Activate the selected card's title, or its marked toggle when the title is plain. */
export function activateCursor(pane: ParentNode | null): boolean {
    const card = pane?.querySelector<HTMLElement>('[data-card][data-cursor]');
    const control = card?.querySelector<HTMLElement>('.title button, [data-card-toggle]');
    if (!control) return false;
    control.click();
    return true;
}

/**
 * Prefer the view's marked body, and inside it a nested mark when the view scrolls its own column
 * (Transcript); otherwise use the first scrolling descendant in document order.
 */
export function scrollContainer(
    pane: ParentNode | null,
    overflowY: (element: HTMLElement) => string = (element) => getComputedStyle(element).overflowY
): HTMLElement | null {
    const body = pane?.querySelector<HTMLElement>('[data-pane-body]');
    if (!body) return null;
    const marked = body.querySelector<HTMLElement>('[data-scroll]');
    if (marked) return marked.querySelector<HTMLElement>('[data-scroll]') ?? marked;
    return (
        [...body.querySelectorAll<HTMLElement>('*')].find((element) => {
            const overflow = overflowY(element);
            return overflow === 'auto' || overflow === 'scroll';
        }) ?? null
    );
}

/** Scroll an existing region smoothly; a pane with none leaves the key unclaimed. */
export function scrollRegion(
    scroller: Pick<HTMLElement, 'scrollHeight' | 'scrollTo'> | null,
    edge: 'top' | 'bottom'
): boolean {
    if (scroller === null) return false;
    scroller.scrollTo({ top: edge === 'top' ? 0 : scroller.scrollHeight, behavior: 'smooth' });
    return true;
}
