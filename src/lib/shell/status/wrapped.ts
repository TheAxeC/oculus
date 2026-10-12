// Layer 3, shell. Which items of a status bar group have left the bar's one row. A group wraps the
// items that do not fit onto a second row (StatusBar.svelte), which the bar clips, so an item there
// is whole and cannot be seen. This marks such an item inert, which takes it out of the tab order
// and hides it from assistive technology until it is back in the row, so the focus never goes to an
// item nobody can see. The row an item is on is a fact of the layout: an item whose top is at or
// below the group's clipped height is on a later row.
import { watchToolbar } from '$lib/ui/frame/toolbar/watch';

/**
 * Mark the items of a group inert while they are on a later row, and not inert while they are in
 * the first. It reads the layout again whenever the group, one of its items or the list of its
 * items changes size, and answers the call that stops. It is a Svelte attachment of the group.
 */
export function inertWhenWrapped(group: HTMLElement): () => void {
    const mark = (): void => {
        const edge = group.clientHeight;
        for (const item of group.children) {
            if (item instanceof HTMLElement) item.inert = item.offsetTop >= edge;
        }
    };
    const stop = watchToolbar(group, group, mark);
    mark();
    return stop;
}
