// Layer 3, primitive. The actions of the active tab that the pane draws for it, at the right end of
// the breadcrumb bar under the strip. A view that holds such actions hands them up as a snippet
// keyed by its instance, while any of them applies, and the pane draws the snippet of the tab that
// is active. The view stays the owner of what an action does and of the state it reads; the pane
// only decides where it stands.
//
// A pane provides one of these to the views it holds. A view drawn where no pane provides one (a
// case that renders the view alone) hands its actions to nobody.
//
// A preview tab walked from one file to another keeps its instance id. When the walk changes its
// view, the view that takes the tab's place can hand up its actions before the view it replaces is
// torn down, so a view takes back only the snippet it handed up: `clear` leaves a newer one. When
// the walk keeps its view, and when the tab is kept, the view stays mounted and its instance is
// replaced by a copy under the same id, which runs `handUp`'s effect again: the effect hands the
// actions up again after its cleanup took them back.

import { getContext, setContext, untrack, type Snippet } from 'svelte';

/** The context key a pane provides its tab actions under. */
export const TAB_ACTIONS = Symbol('tab-actions');

/** The snippets of the tabs of one pane, by instance id. */
export class TabActions {
    // The latest snippets are kept in a plain map that writes read, and a copy of it is published
    // to the views. A cleanup that runs while a view is torn down reads reactive state as it was
    // before the flush it runs in, so a snippet another view handed up in that flush would read as
    // absent from reactive state and be lost with the older view's.
    #latest = new Map<string, Snippet>();
    #shown = $state.raw(new Map<string, Snippet>());

    /** Take the actions a tab hands up, in place of any it handed up before. */
    set(id: string, actions: Snippet): void {
        this.#latest.set(id, actions);
        this.#shown = new Map(this.#latest);
    }

    /** Forget the actions of a tab that is gone, when they are still the snippet being taken. */
    clear(id: string, actions: Snippet): void {
        if (this.#latest.get(id) !== actions) return;
        this.#latest.delete(id);
        this.#shown = new Map(this.#latest);
    }

    /** The actions a tab handed up, or undefined for a tab that handed none. */
    of(id: string): Snippet | undefined {
        return this.#shown.get(id);
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

/**
 * Hand a view's actions up to the pane while the view is mounted and `applies` says one of them
 * applies, so a tab with none draws no bar. They are handed over as the component starts, since a
 * render on the server runs no effect, and again by the effect each time it runs: `id` reads the
 * tab's instance, which keeping a preview tab or walking it to another file replaces with a copy
 * under the same id, so the effect runs again, and its cleanup has just taken the actions back.
 * Called while a component is initialised, with what `useTabActions()` answered.
 */
export function handUp(
    handed: TabActions | undefined,
    id: () => string,
    actions: Snippet,
    applies: () => boolean
): void {
    untrack(() => {
        if (applies()) handed?.set(id(), actions);
    });
    $effect(() => {
        const mine = id();
        if (!applies()) return;
        untrack(() => handed?.set(mine, actions));
        return () => handed?.clear(mine, actions);
    });
}
