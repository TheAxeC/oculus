// Layer 2, client state. How a component reaches the client's stores: the root provides the object
// state/client/context.ts built under one key, each tab view provides its own copy of it for its
// subtree under the same key, and everything below reads that key.
//
// It is a plain Svelte context rather than a prop threaded through the tree, so a view added later
// reaches the stores without every component between it and the root carrying one more prop. The
// key is exported so a test can render a component with its own client through render()'s
// `context` option.
//
// A tab view also provides whether its tab is shown, under a key of its own. The stores read it
// through the copy, and the few views that re-read on a push from the server without going through
// a store read it through `useShown` and `shownGate`.

import { getContext, setContext } from 'svelte';
import type { ClientState } from './context.ts';

/** The one key the client's stores are provided under. */
export const STATE_KEY = Symbol('client state');

/** The key a tab view provides whether its tab is shown under. */
export const SHOWN_KEY = Symbol('tab shown');

/** Provide one client's stores to everything the root renders. Called by the page alone. */
export function provideState(state: ClientState): void {
    setContext(STATE_KEY, state);
}

/**
 * Provide a tab's copy of the stores above it, and whether the tab is shown, to the tab's subtree.
 * Called by a tab view alone. With no stores above it, as in a test that draws a tab view by
 * itself, only the flag is provided.
 */
export function provideTabState(shown: () => boolean): void {
    const state = getContext<ClientState | undefined>(STATE_KEY);
    if (state !== undefined) setContext(STATE_KEY, state.tabScope.wrap(state, shown));
    setContext(SHOWN_KEY, shown);
}

/** The client's stores, read during a component's initialisation. */
export function useState(): ClientState {
    return getContext<ClientState>(STATE_KEY);
}

/**
 * Whether the tab the component is drawn in is shown, read at the moment it is called. A component
 * outside any tab view, such as the page root, is always shown.
 */
export function useShown(): () => boolean {
    return getContext<(() => boolean) | undefined>(SHOWN_KEY) ?? (() => true);
}

/** What a view asks before it re-reads on a push from the server. */
export type ShownGate = {
    /**
     * Whether to read now: the tab is shown and `values` differ, element by element, from the
     * values the last read was made for. A true answer records `values`.
     */
    due: (values: readonly unknown[]) => boolean;
    /** Record the values a read was just made for, without asking. */
    note: (values: readonly unknown[]) => void;
    /** Forget the recorded values, so the next `due` while shown is true. */
    clear: () => void;
};

/**
 * A gate for a view's effect that re-reads whenever a state it watches moves. While the tab is
 * hidden `due` answers false and records nothing, so the effect, which reads the flag through it,
 * runs again when the tab is shown and reads once if the values moved meanwhile.
 */
export function shownGate(shown: () => boolean): ShownGate {
    let last: readonly unknown[] | null = null;
    return {
        due(values) {
            if (!shown()) return false;
            const same =
                last !== null &&
                last.length === values.length &&
                values.every((value, at) => value === last?.[at]);
            if (same) return false;
            last = [...values];
            return true;
        },
        note(values) {
            last = [...values];
        },
        clear() {
            last = null;
        }
    };
}
