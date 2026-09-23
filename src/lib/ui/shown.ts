// Layer 3, primitive, and one of the three that are not components. A pane keeps the view of a
// tab it hides mounted at no size, so a view that measures itself, or that holds the keyboard, has
// to know when it shows again: the Map measures its labels again, and a confirm takes the keyboard
// back.

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
