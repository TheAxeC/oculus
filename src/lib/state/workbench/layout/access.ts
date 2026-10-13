// Layer 2, client state. What the parts of the layout store built beside its factory are given: the
// page list read and written through functions, and the UI store a tab's own state lives in.
//
// The pages are the one reactive arrangement the store holds, so the factory declaring them is the
// only module that holds pages in a rune; a part that keeps a small list of its own (the armed
// keep, the tabs closed last) holds that list alone. Every part is handed this object, which is
// why none of them reaches a page list of its own.

import type { UiStore } from '../ui.svelte.ts';
import type { Host, Layout, Page, Pages, Workbench } from './model.ts';

/**
 * The store's own core, handed to every part built beside the factory. An id names a page or a
 * float wherever one is taken: a float is a workbench of one pane, so a part reads and writes it
 * as it reads and writes a page, and narrows with `isPage` where it needs a page's label.
 */
export type LayoutAccess = {
    /** Every page, the floats beside them, and which page is on screen. */
    held: () => Pages;
    /** Make a set of pages current and save it. */
    save: (next: Pages) => void;
    /** The page on screen, or the first one when the current id names none. */
    currentPage: () => Page;
    /** The page or float with this id, or null when neither is held. */
    pageOf: (id: string) => Host | null;
    /**
     * The host an operation addresses: the page or float its argument names, the page on screen
     * when it names none, and nothing at all when it names one that is not held.
     */
    at: (page?: string) => Host | null;
    /** The page or float whose tree holds an instance, or null when none does. */
    holding: (id: string) => Host | null;
    /** The whole arrangement of a page or float, and an empty one for an id naming neither. */
    workbench: (page?: string) => Workbench;
    /** The tree of a page. */
    layout: (page?: string) => Layout;
    /**
     * Make an arrangement a page's or float's and save every page. A float takes only one pane of
     * at least one tab: a split is refused, and a pane left with no tab removes the float.
     */
    apply: (next: Workbench, page?: string) => void;
    /** Apply an operation to a page's tree, which is how every tree edit reaches the store. */
    change: (edit: (tree: Layout) => Layout, page?: string) => void;
    /** Show every pane of a page again. */
    restorePanes: (page?: string) => void;
    /** Where a tab's own state is kept, which closing the tab forgets. */
    ui: UiStore;
};
