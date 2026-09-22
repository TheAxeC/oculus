// Layer 2, client state. What the parts of the layout store built beside its factory are given: the
// page list read and written through functions, and the UI store a tab's own state lives in.
//
// The pages are the one reactive value the store holds, so the factory declaring them is the only
// module of this folder that carries a rune. A part that holds no rune is a plain module here and is
// handed this object, which is why none of them reaches a page list of its own.

import type { UiStore } from '../ui.svelte.ts';
import type { Layout, Page, Pages, Workbench } from './model.ts';

/** The store's own core, handed to every part built beside the factory. */
export type LayoutAccess = {
    /** Every page, and which of them is on screen. */
    held: () => Pages;
    /** Make a set of pages current and save it. */
    save: (next: Pages) => void;
    /** The page on screen, or the first one when the current id names none. */
    currentPage: () => Page;
    /** The page with this id, or null when the list holds none. */
    pageOf: (id: string) => Page | null;
    /**
     * The page an operation addresses: the one its page argument names, the page on screen when it
     * names none, and nothing at all when it names a page the list does not hold.
     */
    at: (page?: string) => Page | null;
    /** The page whose tree holds an instance, or null when no page does. */
    holding: (id: string) => Page | null;
    /** The whole arrangement of a page, and an empty one for an id naming no page. */
    workbench: (page?: string) => Workbench;
    /** The tree of a page. */
    layout: (page?: string) => Layout;
    /** Make an arrangement a page's and save every page. */
    apply: (next: Workbench, page?: string) => void;
    /** Apply an operation to a page's tree, which is how every tree edit reaches the store. */
    change: (edit: (tree: Layout) => Layout, page?: string) => void;
    /** Show every pane of a page again. */
    restorePanes: (page?: string) => void;
    /** Where a tab's own state is kept, which closing the tab forgets. */
    ui: UiStore;
};
