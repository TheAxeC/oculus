// Layer 2, client state test. What the page holds of the apps' stores
// (lib/state/system/apps/frame/store-cache.ts): one fetch for any number of readers, an answer
// dropped when a later push contradicts it, and a reader told when a store changed under it.
//
// The fetch and the rows are plain functions the case drives by hand. What this does NOT cover:
// the store route's own answers (tests/routes/apps/app-store.test.ts) and a frame receiving the
// change (apps.svelte.ts).

import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import type { AppRow } from '../../../../src/lib/data/model/index.ts';
import {
    createStoreCache,
    type StoreAnswer
} from '../../../../src/lib/state/system/apps/frame/store-cache.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

const row = (version: string): AppRow =>
    fixtureApp({
        bytes: 1,
        hash: 'h',
        storeBytes: 2,
        storeVersion: version,
        storeFile: '/data/notes.json'
    });

/** A fetch whose answers the case settles by hand, in the order they were asked. */
function harness(version = 'v1') {
    let rows: AppRow[] = [row(version)];
    const pending: ((answer: StoreAnswer | null) => void)[] = [];
    const changed: [string, unknown][] = [];
    let mounted = true;
    const fetch = vi.fn(
        () =>
            new Promise<StoreAnswer | null>((resolve) => {
                pending.push(resolve);
            })
    );
    const cache = createStoreCache({
        rows: () => rows,
        mounted: () => mounted,
        fetch,
        changed: (id, value) => changed.push([id, value])
    });
    return {
        cache,
        fetch,
        changed,
        pending,
        setRows: (next: AppRow[]) => (rows = next),
        setMounted: (value: boolean) => (mounted = value)
    };
}

const answer = (version: string, value: unknown): StoreAnswer => ({
    status: 200,
    version,
    value
});

/** Let promise callbacks run. */
const flush = async (): Promise<void> => {
    for (let index = 0; index < 5; index += 1) await Promise.resolve();
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

type Row = [string, () => Promise<unknown>, unknown];

/** What a read settled with: its value, or the word it rejected with. */
async function settled(read: Promise<unknown>): Promise<unknown> {
    try {
        return { value: await read };
    } catch (word) {
        return { rejected: word };
    }
}

const ROWS: Row[] = [
    [
        'two readers asking at the same time, served by one fetch and then by the held answer',
        async () => {
            const h = harness();
            const first = h.cache.read('app:notes');
            const second = h.cache.read('app:notes');
            const started = h.fetch.mock.calls.length;
            h.pending[0](answer('v1', { n: 1 }));
            return [
                started,
                await first,
                await second,
                await h.cache.read('app:notes'),
                h.fetch.mock.calls.length
            ];
        },
        [1, { n: 1 }, { n: 1 }, { n: 1 }, 1]
    ],
    [
        'an answer a push contradicted while it was in flight, dropped and fetched once more',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            h.setRows([row('v2')]);
            h.cache.pushed();
            h.pending[0](answer('v1', { n: 1 }));
            await flush();
            const fetches = h.fetch.mock.calls.length;
            h.pending[1](answer('v2', { n: 2 }));
            return [fetches, await read];
        },
        [2, { n: 2 }]
    ],
    [
        'a store newer than the row, which waits for the next push and then asks again',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            h.pending[0](answer('v2', { n: 2 }));
            await flush();
            const waiting = h.fetch.mock.calls.length;
            h.setRows([row('v2')]);
            h.cache.pushed();
            await flush();
            const asked = h.fetch.mock.calls.length;
            h.pending[1](answer('v2', { n: 2 }));
            return [waiting, asked, await read];
        },
        [1, 2, { n: 2 }]
    ],
    [
        'a store newer than the row and no push, which stops waiting after the wait and tries again',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            h.pending[0](answer('v2', {}));
            await flush();
            await vi.advanceTimersByTimeAsync(5001);
            const fetches = h.fetch.mock.calls.length;
            h.pending[1](answer('v1', { n: 1 }));
            return [fetches, await read];
        },
        [2, { n: 1 }]
    ],
    [
        'a 404 while the row is gone, rejected missing',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            h.setRows([]);
            h.pending[0]({ status: 404, version: '', value: null });
            return settled(read);
        },
        { rejected: 'missing' }
    ],
    [
        'a 404 while a push brings the row back, dropped and fetched once more',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            h.pending[0]({ status: 404, version: '', value: null });
            await flush();
            const fetches = h.fetch.mock.calls.length;
            h.pending[1](answer('v1', { n: 3 }));
            return [fetches, await read];
        },
        [2, { n: 3 }]
    ],
    [
        'a 404 on every try while the row stays, rejected missing',
        async () => {
            const h = harness('v1');
            const read = h.cache.read('app:notes');
            for (let index = 0; index < 5; index += 1) {
                await flush();
                h.pending[index]({ status: 404, version: '', value: null });
            }
            return settled(read);
        },
        { rejected: 'missing' }
    ],
    [
        'a request with no answer, rejected failed:0',
        async () => {
            const h = harness();
            const read = h.cache.read('app:notes');
            h.pending[0](null);
            return settled(read);
        },
        { rejected: 'failed:0' }
    ],
    [
        'an error status, rejected failed with that status',
        async () => {
            const h = harness();
            const read = h.cache.read('app:notes');
            h.pending[0]({ status: 500, version: '', value: null });
            return settled(read);
        },
        { rejected: 'failed:500' }
    ],
    [
        'a store that changed under every try, rejected failed:0',
        async () => {
            const h = harness('v0');
            const read = h.cache.read('app:notes');
            for (let index = 0; index < 5; index += 1) {
                await flush();
                h.setRows([row(`v${index + 1}`)]);
                h.pending[index](answer(`v${index}`, {}));
            }
            return settled(read);
        },
        { rejected: 'failed:0' }
    ],
    [
        'an app the rows do not hold, rejected missing with nothing fetched',
        async () => {
            const h = harness();
            const read = await settled(h.cache.read('app:other'));
            return [read, h.fetch.mock.calls.length];
        },
        [{ rejected: 'missing' }, 0]
    ],
    [
        'a store version that moved, told to the tabs of a mounted app and to no other',
        async () => {
            const h = harness('v1');
            h.cache.pushed();
            const first = h.fetch.mock.calls.length;
            h.setRows([row('v2')]);
            h.setMounted(false);
            h.cache.pushed();
            const second = h.fetch.mock.calls.length;
            h.setRows([row('v3')]);
            h.setMounted(true);
            h.cache.pushed();
            const third = h.fetch.mock.calls.length;
            h.pending[0](answer('v3', { n: 3 }));
            await flush();
            return [first, second, third, h.changed];
        },
        [0, 0, 1, [['app:notes', { n: 3 }]]]
    ]
];

describe('drops an answer a later push contradicts and fetches once more', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
