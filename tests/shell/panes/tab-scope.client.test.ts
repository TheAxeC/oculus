// Layer 3, shell test. A tab's reads run in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts), where a `$derived` tracks the query helper's ticks and the
// tab's `shown` flag: a derived that read a key through a hidden copy of the stores runs again
// when the tab is shown and asks once, a derived of a reader outside the scope runs again when a
// hidden refetch marks its key, and a derived over a key that needs nothing does not run again
// when the flag moves.
//
// What this does NOT cover: the five views' own effects and the DOM they draw, which are seen at
// the look on landing.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState } from '../../../src/lib/state/client/context.ts';
import { stubFetch } from '../../fixtures/client.ts';
import { derivedRuns, flag } from './scope-watch.svelte.ts';

let asked: string[] = [];

/** Let a scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushSync();
}

beforeEach(() => {
    vi.stubGlobal('window', {});
    asked = [];
    stubFetch(
        asked,
        () =>
            new Response(JSON.stringify({ images: [{ name: 'a.png', width: 1, height: 1 }] }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
    );
});

afterEach(() => vi.unstubAllGlobals());

describe('a derived over a hidden copy of the stores', () => {
    // Revert: in read of state/client/queries.svelte.ts, answer without calling the scope's shown,
    // so the derived has nothing to run again for, or schedule in a hidden scope.
    it('asks nothing while the flag is false, and runs again and asks once when it turns true', async () => {
        const client = createClientState();
        const shown = flag(false);
        const copy = client.tabScope.wrap(client, shown.get);
        const watched = derivedRuns(() => copy.memories.wall());
        flushSync();
        await settle();
        expect(asked).toEqual([]);
        const before = watched.runs();

        shown.set(true);
        flushSync();
        expect(watched.runs()).toBeGreaterThan(before);
        await settle();
        expect(asked).toEqual(['/api/memories']);
        expect(watched.last()?.images.map((one) => one.name)).toEqual(['a.png']);
        watched.stop();
    });

    // Revert: in invalidate of state/client/queries.svelte.ts, or in refetch of its hidden branch,
    // invalidate with hear false so no reader hears the mark.
    it('wakes a reader outside the scope when a hidden refetch marks its key, and that reader asks', async () => {
        const client = createClientState();
        const live = derivedRuns(() => client.memories.wall());
        flushSync();
        await settle();
        expect(asked).toEqual(['/api/memories']);
        const before = live.runs();

        const copy = client.tabScope.wrap(client, () => false);
        copy.memories.reload();
        flushSync();
        expect(live.runs()).toBeGreaterThan(before);
        await settle();
        expect(asked).toEqual(['/api/memories', '/api/memories']);
        live.stop();
    });

    // Revert: in read of state/client/queries.svelte.ts, call the scope's shown before the test of
    // whether the key wants an answer, so every read of the copy depends on the flag.
    it('does not run again when the flag moves over a key that is held and fresh', async () => {
        const client = createClientState();
        client.memories.hold([{ name: 'held.png', width: 1, height: 1 }]);
        const shown = flag(false);
        const copy = client.tabScope.wrap(client, shown.get);
        const watched = derivedRuns(() => copy.memories.wall());
        flushSync();
        expect(watched.runs()).toBe(1);

        shown.set(true);
        flushSync();
        shown.set(false);
        flushSync();
        await settle();
        expect(watched.runs()).toBe(1);
        expect(asked).toEqual([]);
        watched.stop();
    });
});
