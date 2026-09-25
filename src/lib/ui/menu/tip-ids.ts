// Layer 3, primitive support. The tooltip ids of one page: a counter, handed down rather than held
// at module level, so two pages in one process number their bubbles apart.
//
// It is the primitives' own context and names no store, which is what keeps `ui/` importing nothing
// of the state layer. The page root creates one counter beside the client and provides it.

import { getContext, setContext } from 'svelte';

/** The one key the tooltip counter is provided under. */
export const TIP_KEY = Symbol('tooltip ids');

/** One page's supply of tooltip ids. */
export type TipIds = {
    nextTipId: () => string;
};

export function createTipIds(): TipIds {
    let counter = 0;

    /** One id per tooltip on the page, so aria-describedby names this bubble and no other. */
    function nextTipId(): string {
        counter += 1;
        return `tip-${counter}`;
    }

    return { nextTipId };
}

/** Provide one page's counter to every tooltip it renders. */
export function provideTipIds(ids: TipIds): void {
    setContext(TIP_KEY, ids);
}

/** The page's counter, read while a tooltip initialises. */
export function useTipIds(): TipIds {
    return getContext<TipIds>(TIP_KEY);
}
