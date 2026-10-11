// Layer 2, client state. What the page holds of the apps' stores: the last answer of
// `GET /api/app-store?view=` per app, the one fetch that serves every tab asking at once, and the
// tabs told when a store changed under them.
//
// A row of the `apps` channel carries a store's size and version and never its value. The page
// compares the version with the one it holds, and fetches only when they differ and a frame of the
// app is mounted. Versions are compared for equality and never ordered. An answer is dropped and
// one more fetch follows at once when a push moved the row's version during the fetch. An answer
// newer than the row (the store was written and the push that carries its version has not arrived)
// waits for the next push, at most `WAIT_MS`, and then fetches again. A 404 says the server holds
// no row of that id: it is dropped while the page holds a row of the app and rejects
// `missing` otherwise. Any other failure (no answer, another status, a store that changed under
// every try) rejects `failed:<status>`, with status 0 for no answer and for the changing store,
// since the app's store is not gone.
//
// The fetch and the rows are arguments, so a test drives both.

import { appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import type { AppRow } from '../../../../data/model/index.ts';
import { REFUSED, failedWith, rejectWith } from './rules.ts';

/** What the store route answered: the status, and on 200 the version and the value. */
export type StoreAnswer = { status: number; version: string; value: unknown };

export type StoreCacheDeps = {
    /** The rows of the `apps` channel as the page holds them now. */
    rows: () => AppRow[];
    /** Whether a frame of this app is mounted in any tab of this page. */
    mounted: (id: string) => boolean;
    /** The store route's answer, or null when the request did not get one. */
    fetch: (id: string) => Promise<StoreAnswer | null>;
    /** Tell every tab of the app that its store holds this value now. */
    changed: (id: string, value: unknown) => void;
};

export type StoreCache = {
    /** The store's value, from the cache or one fetch; rejects `missing` for an app that is gone.
     * */
    read: (id: string) => Promise<unknown>;
    /** The rows changed: fetch the store of each mounted app whose version moved, and tell its
     * tabs. */
    pushed: () => void;
};

/** How many answers may be dropped before the read gives up. */
const ATTEMPTS = 5;
/** How long an answer newer than its row waits for the push that carries its version. */
const WAIT_MS = 5000;

export function createStoreCache(deps: StoreCacheDeps): StoreCache {
    const held = new Map<string, { version: string; value: unknown }>();
    const loading = new Map<string, Promise<unknown>>();
    const seen = new Map<string, string>();
    let waiting: (() => void)[] = [];

    /** Resolves at the next push of the `apps` channel, or after `WAIT_MS`. */
    function nextPush(): Promise<void> {
        return new Promise((resolve) => {
            const done = (): void => {
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(done, WAIT_MS);
            waiting.push(done);
        });
    }

    const rowOf = (id: string): AppRow | undefined =>
        deps.rows().find((one) => appViewId(one.root, one.name) === id);

    async function load(id: string): Promise<unknown> {
        let word: string = failedWith(0);
        for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
            const row = rowOf(id);
            if (row === undefined) return rejectWith(REFUSED.missing);
            const cached = held.get(id);
            if (cached?.version === row.storeVersion) return cached.value;
            const asked = row.storeVersion;
            const answer = await deps.fetch(id);
            if (answer === null) return rejectWith(failedWith(0));
            const now = rowOf(id);
            if (now === undefined) return rejectWith(REFUSED.missing);
            if (answer.status === 404) {
                word = REFUSED.missing;
                continue;
            }
            if (answer.status !== 200) return rejectWith(failedWith(answer.status));
            word = failedWith(0);
            if (now.storeVersion !== asked) continue;
            if (answer.version !== now.storeVersion) {
                await nextPush();
                continue;
            }
            held.set(id, { version: answer.version, value: answer.value });
            return answer.value;
        }
        return rejectWith(word);
    }

    function read(id: string): Promise<unknown> {
        const running = loading.get(id);
        if (running !== undefined) return running;
        const started = load(id).finally(() => {
            loading.delete(id);
        });
        loading.set(id, started);
        return started;
    }

    function pushed(): void {
        const woken = waiting;
        waiting = [];
        for (const wake of woken) wake();
        const rows = deps.rows();
        const live = new Set<string>();
        for (const row of rows) {
            const id = appViewId(row.root, row.name);
            live.add(id);
            const before = seen.get(id);
            seen.set(id, row.storeVersion);
            if (before === undefined || before === row.storeVersion || !deps.mounted(id)) continue;
            read(id).then(
                (value) => {
                    deps.changed(id, value);
                },
                () => undefined
            );
        }
        for (const id of [...seen.keys()]) {
            if (live.has(id)) continue;
            seen.delete(id);
            held.delete(id);
        }
    }

    return { read, pushed };
}
