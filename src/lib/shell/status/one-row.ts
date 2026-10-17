// Layer 3, shell. Which items the status bar leaves out so the rest fit on its one row. The bar
// never wraps (StatusBar.svelte): every item of both groups is measured as it is drawn, and when
// they do not all fit the fewest are left out whole, taken in the order status-items.ts states
// (`leftOut`), so no item is cut through and none is drawn below the bar. An item left out is not
// drawn at all, which also takes it out of the tab order, and is listed in the right-click menu as
// any other is.
import { leftOut } from './status-items';

/** The items of the bar: the children of its two groups. */
function itemsOf(bar: HTMLElement): HTMLElement[] {
    return Array.from(bar.querySelectorAll<HTMLElement>(':scope > [data-status-group] > *'));
}

/**
 * Leave out the items that do not fit on the bar's one row. It measures again whenever the bar or
 * one of its items changes size and whenever an item arrives or leaves, and answers the call that
 * stops. It is a Svelte attachment of the bar.
 */
export function fitOneRow(bar: HTMLElement): () => void {
    const fit = (): void => {
        const items = itemsOf(bar);
        for (const item of items) item.removeAttribute('data-left-out');
        const sized = items.map((item) => ({
            id: item.dataset.status ?? '',
            width: item.getBoundingClientRect().width
        }));
        const out = leftOut(sized, bar.clientWidth);
        items.forEach((item, at) => item.toggleAttribute('data-left-out', out.has(at)));
    };
    const sizes = new ResizeObserver(fit);
    const observe = (): void => {
        sizes.disconnect();
        sizes.observe(bar);
        for (const item of itemsOf(bar)) sizes.observe(item);
    };
    const members = new MutationObserver(() => {
        observe();
        fit();
    });
    observe();
    for (const group of bar.querySelectorAll(':scope > [data-status-group]')) {
        members.observe(group, { childList: true });
    }
    fit();
    return () => {
        sizes.disconnect();
        members.disconnect();
    };
}
