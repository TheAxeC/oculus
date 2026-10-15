// Layer 2, client state. The query client of one client state, and the copy of the client state a
// tab provides for its subtree.
//
// Every store that fetches an answer holds it in the one query client made here. Such a store is
// recorded by its name in the client object as it is made (`withQueries`), and a tab's copy of the
// client state (`tabScope`) replaces each recorded store with one whose functions run in the scope
// of the tab (`scopedStore` of queries.svelte.ts), so a store read through a hidden tab asks
// nothing. Every other store of the copy is the original instance. The client object
// (state/client/context.ts) makes one scope and hands its query client to the stores it makes.

import type { ClientState, TabScopeStore } from '../shapes/client-state.ts';
import type { Queries } from '../../shared/stores/shapes.ts';
import { createQueries, scopedStore } from './queries.svelte.ts';

/** The query client, the recorder of the stores handed it, and the tab's copy over them. */
export type QueryScope = {
    queries: Queries;
    /** Record a store handed the query client under its name in the client object. */
    withQueries: <N extends keyof ClientState>(
        name: N,
        store: ClientState[N] & Record<string, unknown>
    ) => ClientState[N];
    tabScope: TabScopeStore;
};

/** One client state's query client, with the stores handed it recorded as they are made. */
export function createQueryScope(): QueryScope {
    const queries = createQueries();
    // The stores handed the query client, by their name in the client object, which is what a tab's
    // copy replaces.
    const queried = new Map<string, Record<string, unknown>>();
    function withQueries<N extends keyof ClientState>(
        name: N,
        store: ClientState[N] & Record<string, unknown>
    ): ClientState[N] {
        queried.set(name, store);
        return store;
    }
    const tabScope: TabScopeStore = {
        wrap: (state, shown) =>
            Object.assign(
                {},
                state,
                Object.fromEntries(
                    [...queried].map(([name, store]) => [name, scopedStore(queries, store, shown)])
                )
            )
    };
    return { queries, withQueries, tabScope };
}
