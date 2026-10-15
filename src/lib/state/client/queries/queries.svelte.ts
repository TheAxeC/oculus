// Layer 2, client state. The one query client of a client state, and the helper every store that
// fetches an answer and holds it reads and writes it through.
//
// DESIGN.md's wire model keeps documents, listings and logs out of the snapshot, so the stores
// that hold them ask an endpoint the first time a key is read. They hold what came back in a
// `@tanstack/query-core` QueryClient built here, once per client state, and none of them keeps a
// record of answers, a set of requests in flight or a microtask of its own.
//
// The query client is built with `retry: false`, `gcTime: Infinity`, `staleTime: Infinity` and
// `networkMode: 'always'`: a store asks again only by its own rules, never drops a held answer, and
// reaches its own server whatever the browser says of the network. A query function never throws.
// It answers the store's own held shape, an error answer included, so query-core's error state
// (which marks a query invalidated) is never reached and each store's rule for an error decides.
//
// A read never builds, fetches or writes anything on the caller's stack, since it runs inside a
// `$derived`: it reads a `$state` tick for the key and the query's state, and when the key needs an
// answer it schedules the fetch on a microtask. The tick is bumped by one subscription to the query
// cache, whose events are synchronous and are all caused by calls made outside a derived: that
// microtask's fetch, a hold, a mark from a socket listener, a cancel, a removal.
//
// `scoped` runs a call for a tab: while the tab is hidden, a read that would schedule a fetch
// schedules none and answers what is held, and a refetch only marks the key, so the tab asks once,
// from the read the derived makes again when it is shown. A fetch already scheduled or out is left
// alone, and `peek`, `fetch`, `hold`, `mark`, `forget` and `entries` do not look at the scope.
//
// `scopedStore` makes the copy of a store a tab provides for its subtree: each function of the
// store runs inside `scoped` for the tab.
//
// `fetch` builds the query on the caller's stack, so it is for handlers and effects, never for a
// `$derived`; `read` is the one a derived calls.
//
// A mark says an answer may be out of date: the query is invalidated, and the next read asks again
// while what is held keeps being returned. What a mark does to a fetch already in flight is the
// store's rule: leave it, ask again once it lands, or cancel it so that its answer never lands.

import { QueryClient, hashKey, noop, partialMatchKey, type QueryKey } from '@tanstack/query-core';
import type {
    Entry,
    Fetcher,
    Peek,
    Queries,
    Read,
    WhileFetching
} from '../../shared/stores/shapes.ts';

export function createQueries(): Queries {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity, staleTime: Infinity, networkMode: 'always' }
        }
    });
    const cache = client.getQueryCache();

    /** How many times each query changed. State, so a reader runs again when its key does. */
    const ticks: Record<string, number | undefined> = $state({});

    /** The function that last asked for each query, which a mark that asks again uses. */
    const fetchers = new Map<string, Fetcher<unknown>>();

    /** The mark that came while each query was being fetched, applied when the fetch lands. */
    const waiting = new Map<string, 'wait' | 'again'>();

    /** The queries a fetch asked to leave stale once it lands. */
    const leaving = new Set<string>();

    /** The latest call of each query function still out, whose answer an awaited call returns. */
    const calls = new Map<string, Promise<unknown>>();

    /** The queries with a microtask waiting to fetch them, by hash, with their keys. */
    const scheduled = new Map<string, QueryKey>();

    /** Whether the cache subscription is to leave the tick alone: a stale mark no reader hears. */
    let quiet = false;

    /** Whether the tab the running call belongs to is shown, or null for a call made by no tab. */
    let scope: (() => boolean) | null = null;

    function bump(hash: string): void {
        ticks[hash] = (ticks[hash] ?? 0) + 1;
    }

    cache.subscribe((event) => {
        if (quiet) return;
        if (event.type === 'added' || event.type === 'removed' || event.type === 'updated') {
            bump(event.query.queryHash);
        }
    });

    /** Read the tick of a key, which is what makes a derived run again when the key changes. */
    function track(hash: string): number {
        return ticks[hash] ?? 0;
    }

    /** Whether a key has nothing held or has been marked, and is not being asked for already. */
    function wants(
        state: { fetchStatus: string; data: unknown; isInvalidated: boolean } | undefined
    ) {
        if (state === undefined) return true;
        return state.fetchStatus === 'idle' && (state.data === undefined || state.isInvalidated);
    }

    /**
     * Whether the running call belongs to a hidden tab. It reads the tab's flag, so a derived or an
     * effect that asks runs again when the tab is shown.
     */
    function hidden(): boolean {
        return scope !== null && !scope();
    }

    /** Run a call for a tab, so that its reads and refetches follow whether the tab is shown. */
    function scoped<T>(shown: () => boolean, run: () => T): T {
        const outer = scope;
        scope = shown;
        try {
            return run();
        } finally {
            scope = outer;
        }
    }

    /** Whether a fetch of a key is out. */
    function fetching(key: QueryKey): boolean {
        return client.getQueryState(key)?.fetchStatus === 'fetching';
    }

    /** Invalidate one key, and wake the readers of it unless the mark is one no reader hears. */
    function invalidate(key: QueryKey, hear: boolean): void {
        quiet = !hear;
        try {
            void client.invalidateQueries({ queryKey: key, exact: true, refetchType: 'none' });
        } finally {
            quiet = false;
        }
        if (hear) bump(hashKey(key));
    }

    /** Run a query function for a key, remembering its call for an awaited caller. */
    function call<T>(
        key: QueryKey,
        hash: string,
        fetcher: Fetcher<T>,
        signal: AbortSignal
    ): Promise<T> {
        const held = client.getQueryState<T>(key)?.data;
        const started = fetcher(held, {
            signal,
            leaveStale: () => {
                if (!signal.aborted) leaving.add(hash);
            }
        });
        calls.set(hash, started);
        const done = (): void => {
            if (calls.get(hash) === started) calls.delete(hash);
        };
        void started.then(done, done);
        return started;
    }

    /**
     * Fetch a key through the query client: the held answer when it is fresh and `force` is off,
     * else the request already out or a new one.
     */
    function launch<T>(key: QueryKey, fetcher: Fetcher<T>, force: boolean): Promise<T> {
        const hash = hashKey(key);
        const done = client.query<T>({
            queryKey: key,
            queryFn: ({ signal }) => call(key, hash, fetcher, signal),
            ...(force ? { staleTime: 0 } : {})
        });
        void done.then(noop, noop).finally(() => {
            settled(key, hash);
        });
        return done;
    }

    /** Apply what came while a fetch was out, once no fetch of the key is. */
    function settled(key: QueryKey, hash: string): void {
        const state = client.getQueryState(key);
        if (state?.fetchStatus === 'fetching') return;
        const mode = waiting.get(hash);
        waiting.delete(hash);
        const stale = leaving.delete(hash);
        if (state === undefined) return;
        if (mode !== undefined) {
            invalidate(key, true);
            const again = fetchers.get(hash);
            if (mode === 'again' && again !== undefined) schedule(key, hash, again);
        } else if (stale) {
            invalidate(key, false);
        }
    }

    /** Fetch a key on a microtask, off the caller's stack, once however many ask before it runs. */
    function schedule<T>(key: QueryKey, hash: string, fetcher: Fetcher<T>): void {
        if (scheduled.has(hash)) return;
        fetchers.set(hash, fetcher as Fetcher<unknown>);
        scheduled.set(hash, key);
        queueMicrotask(() => {
            if (!scheduled.delete(hash)) return;
            const next = fetchers.get(hash);
            if (next !== undefined) void launch(key, next, true);
        });
    }

    function read<T>(key: QueryKey, fetcher: Fetcher<T>, options: { enabled: boolean }): Read<T> {
        const hash = hashKey(key);
        track(hash);
        const state = client.getQueryState<T>(key);
        if (options.enabled && wants(state) && !hidden()) schedule(key, hash, fetcher);
        return {
            data: state?.data,
            refreshing: state !== undefined && (state.fetchStatus !== 'idle' || state.isInvalidated)
        };
    }

    function peek<T>(key: QueryKey): Peek<T> {
        track(hashKey(key));
        const state = client.getQueryState<T>(key);
        return { data: state?.data, stale: state?.isInvalidated ?? false };
    }

    async function fetch<T>(key: QueryKey, fetcher: Fetcher<T>): Promise<T> {
        const hash = hashKey(key);
        fetchers.set(hash, fetcher as Fetcher<unknown>);
        const done = launch(key, fetcher, false);
        const own = calls.get(hash) as Promise<T> | undefined;
        return own ?? done;
    }

    /** Cancel the fetch of a key, so that the answer it was after is never held. */
    function cancel(key: QueryKey): void {
        void client.cancelQueries({ queryKey: key, exact: true });
    }

    /**
     * A refetch made for a hidden tab: it asks nothing and cancels nothing. A request out is marked
     * to be answered by a mark when it lands, which keeps the `again` a shown caller recorded; with
     * none out the held answer is marked, and the readers are woken, so a shown tab of the key asks
     * on its next read and the hidden tab asks once when it is shown.
     */
    function deferRefetch(key: QueryKey, hash: string, out: boolean): void {
        if (out) {
            if (waiting.get(hash) !== 'again') waiting.set(hash, 'wait');
        } else if (client.getQueryState(key) !== undefined) {
            invalidate(key, true);
        }
    }

    function refetch<T>(key: QueryKey, fetcher: Fetcher<T>, whileFetching: WhileFetching): void {
        const hash = hashKey(key);
        const out = scheduled.has(hash) || fetching(key);
        if (out && whileFetching === 'drop') return;
        if (hidden()) {
            deferRefetch(key, hash, out);
            return;
        }
        fetchers.set(hash, fetcher as Fetcher<unknown>);
        if (out && (whileFetching === 'wait' || whileFetching === 'again')) {
            waiting.set(hash, whileFetching);
            return;
        }
        if (out) cancel(key);
        if (client.getQueryState(key) !== undefined) invalidate(key, true);
        schedule(key, hash, fetcher);
    }

    function hold(key: QueryKey, data: unknown): void {
        const stale = client.getQueryState(key)?.isInvalidated === true;
        client.setQueryData(key, data);
        if (stale) invalidate(key, true);
    }

    /** Mark one query, as `whileFetching` says. */
    function markOne(key: QueryKey, hash: string, whileFetching: WhileFetching): void {
        if (fetching(key)) {
            if (whileFetching === 'wait' || whileFetching === 'again') {
                if (waiting.get(hash) !== 'again') waiting.set(hash, whileFetching);
                return;
            }
            if (whileFetching === 'drop') return;
            cancel(key);
        }
        invalidate(key, true);
    }

    function mark(key: QueryKey, whileFetching: WhileFetching): void {
        for (const query of cache.findAll({ queryKey: key })) {
            markOne(query.queryKey, query.queryHash, whileFetching);
        }
    }

    function forget(key: QueryKey): void {
        for (const [hash, asked] of scheduled) {
            if (partialMatchKey(asked, key)) scheduled.delete(hash);
        }
        for (const query of cache.findAll({ queryKey: key })) {
            waiting.delete(query.queryHash);
            leaving.delete(query.queryHash);
            fetchers.delete(query.queryHash);
        }
        client.removeQueries({ queryKey: key });
    }

    function entries<T>(key: QueryKey): Entry<T>[] {
        return cache
            .findAll({ queryKey: key })
            .map((query) => ({ key: query.queryKey, data: query.state.data as T | undefined }));
    }

    return { client, scoped, read, peek, fetch, refetch, hold, mark, forget, entries };
}

/**
 * A store with each function member run in the scope of `shown` and every other member as it was.
 * The store is read when the copy is made, so a member that is replaced later is not followed.
 */
export function scopedStore(
    queries: Queries,
    store: Record<string, unknown>,
    shown: () => boolean
): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(store).map(([member, value]) => [
            member,
            typeof value === 'function'
                ? (...args: unknown[]): unknown =>
                      queries.scoped(shown, () => {
                          const answer: unknown = Reflect.apply(value, store, args);
                          return answer;
                      })
                : value
        ])
    );
}
