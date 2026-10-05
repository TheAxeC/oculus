// Layer 3, shared view helper. What a rendered tab (the Doc view, the Markdown preview) says to the
// Outline and hears back: the headings of the document it draws, published while the tab is
// mounted, and a press on an Outline row, performed by scrolling the tab's box to that heading
// (jump.ts, the lookup a press on a table-of-contents link uses). A press is performed once,
// however many times the tab is drawn again: a tab replaced by a copy under the same id, as a keep
// or a walk does, does not perform the last press a second time.

import { untrack } from 'svelte';
import type { RenderedHeading } from '$lib/state/system/docs.svelte';
import type { HeadingsStore } from '$lib/state/sources/explorer/sections/headings.svelte';
import { scrollToFragment } from './jump';

/** What the tab reads of itself. */
export type RenderedHeadingsDeps = {
    store: Pick<HeadingsStore, 'asked' | 'forget' | 'publish'>;
    id: () => string;
    /**
     * The headings of the document the tab draws now, or null while it has none drawn yet (being
     * read, or its read failed), so the Outline waits instead of saying the file has no headings.
     */
    headings: () => readonly RenderedHeading[] | null;
    /** The box carrying the tab's `data-instance`, or undefined before it is drawn. */
    box: () => Element | undefined;
};

/** Connect the tab to the headings store for as long as the tab is mounted. */
export function shareHeadings(deps: RenderedHeadingsDeps): void {
    const { store } = deps;
    let performed = untrack(() => store.asked(deps.id())?.seq ?? 0);

    $effect(() => {
        const id = deps.id();
        const list = deps.headings();
        if (list === null) return;
        store.publish(id, list);
        return () => store.forget(id, list);
    });

    $effect(() => {
        const ask = store.asked(deps.id());
        if (ask === null || ask.seq === performed) return;
        performed = ask.seq;
        const box = untrack(deps.box);
        if (box !== undefined) scrollToFragment(box, ask.id);
    });
}
