// Layer 2, client state. How a component reaches the client's stores: the root provides the object
// state/client/context.ts built under one key, and everything below it reads that key.
//
// It is a plain Svelte context rather than a prop threaded through the tree, so a view added later
// reaches the stores without every component between it and the root carrying one more prop. The
// key is exported so a test can render a component with its own client through render()'s
// `context` option.

import { getContext, setContext } from 'svelte';
import type { ClientState } from './context.ts';

/** The one key the client's stores are provided under. */
export const STATE_KEY = Symbol('client state');

/** Provide one client's stores to everything the root renders. Called by the page and by nothing else. */
export function provideState(state: ClientState): void {
    setContext(STATE_KEY, state);
}

/** The client's stores, read during a component's initialisation. */
export function useState(): ClientState {
    return getContext<ClientState>(STATE_KEY);
}
