// Layer 3, primitive, and one of the three that are not components. A pane keeps the view of a
// tab it hides mounted at no size, so a view that measures itself, or that holds the keyboard, has
// to know when it shows again: the Map measures its labels again, and a dialog drawn in a tab
// turns its focus trap off while its tab is hidden and takes the keyboard back when it shows.

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
 * from no size to a size or back, for what is on only while its tab shows. Answers the teardown.
 */
export function watchShown(element: Element, changed: (shown: boolean) => void): () => void {
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
