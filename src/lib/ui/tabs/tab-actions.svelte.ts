// Layer 3, primitive. The actions of the active file tab that the pane draws at the end of its tab
// strip. A view that holds such actions (Save, Revert, the star, Preview and the rest of a source
// tab) hands them up as a snippet keyed by its instance, and the strip draws the snippet of the
// tab that is active. The view stays the owner of what the actions do and of the state they read;
// the strip only decides where they stand.
//
// A pane provides one of these to the views it holds. A view drawn where no pane provides one (a
// case that renders the view alone) hands its actions to nobody.

import { getContext, setContext, type Snippet } from 'svelte';

/** The context key a pane provides its tab actions under. */
export const TAB_ACTIONS = Symbol('tab-actions');

/** The snippets of the tabs of one pane, by instance id. */
export class TabActions {
    #held = $state.raw<ReadonlyMap<string, Snippet>>(new Map());

    /** Take the actions a tab hands up, in place of any it handed up before. */
    set(id: string, actions: Snippet): void {
        this.#held = new Map(this.#held).set(id, actions);
    }

    /** Forget the actions of a tab that is gone. */
    clear(id: string): void {
        if (!this.#held.has(id)) return;
        const next = new Map(this.#held);
        next.delete(id);
        this.#held = next;
    }

    /** The actions a tab handed up, or undefined for a tab that handed none. */
    of(id: string): Snippet | undefined {
        return this.#held.get(id);
    }
}

/**
 * A pane's tab actions, put in the context of the views it holds. A pane under a provider takes
 * that provider's store, since an instance id is unique across the workbench and one store serves
 * every pane under it.
 */
export function provideTabActions(): TabActions {
    const held = getContext<TabActions | undefined>(TAB_ACTIONS) ?? new TabActions();
    setContext(TAB_ACTIONS, held);
    return held;
}

/** The tab actions of the pane this view is in, or undefined where no pane provides them. */
export function useTabActions(): TabActions | undefined {
    return getContext<TabActions | undefined>(TAB_ACTIONS);
}
