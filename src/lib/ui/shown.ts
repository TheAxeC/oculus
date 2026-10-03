// Layer 3, primitive, and one of the three that are not components. A pane keeps the view of a
// tab it hides mounted at no size, so a view that measures itself, or that holds the keyboard, has
// to know when it shows again: the Map measures its labels again, and a dialog drawn in a tab
// turns its focus trap off while its tab is hidden and takes the keyboard back when it shows.
// `portal` is the other half of a dialog drawn over the page: it moves the dialog's box to the
// body, out of the stacking contexts of the panes and the page, so the box stands over the floats.

/**
 * Call `shown` each time the element comes back from no size to a size, and at no other resize: a
 * pane keeps the view of a tab it hides mounted at no size, where nothing measures and nothing
 * holds focus, and what depends on either is done again once its tab shows. Answers the teardown.
 */
export function onShown(element: Element, shown: () => void): () => void {
    let hidden = element.clientWidth === 0;
    const watcher = new ResizeObserver(() => {
        if (hidden && element.clientWidth > 0) shown();
        hidden = element.clientWidth === 0;
    });
    watcher.observe(element);
    return () => watcher.disconnect();
}

/**
 * Call `changed` with whether the element has a size, once at the start and then each time it goes
 * from no size to a size or back, for what is on only while its tab shows. Answers the teardown,
 * or nothing for an element that is not there: `bind:this` sets an element to null when it goes.
 */
export function watchShown(
    element: Element | null | undefined,
    changed: (shown: boolean) => void
): (() => void) | undefined {
    if (element === null || element === undefined) return undefined;
    let hidden = element.clientWidth === 0;
    let started = false;
    const watcher = new ResizeObserver(() => {
        const now = element.clientWidth === 0;
        if (started && now === hidden) return;
        started = true;
        hidden = now;
        changed(!hidden);
    });
    watcher.observe(element);
    return () => watcher.disconnect();
}

/**
 * A Svelte action that moves its element to the end of the body, where it stands over every pane
 * and float, and takes it out of the page again when the element goes. The element is drawn in
 * place on the server and in a test that has no body to move it to.
 */
export function portal(node: HTMLElement): { destroy: () => void } {
    if (typeof document !== 'undefined') document.body.appendChild(node);
    return { destroy: () => node.remove() };
}
