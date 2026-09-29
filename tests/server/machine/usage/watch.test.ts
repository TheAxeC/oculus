// Layer 2, server test. The Usage watcher's debounce over its async rebuild: a burst of changes is
// one rebuild after the quiet, a change while a rebuild is still folding waits the whole quiet
// rather than following the fold at once, and a close with a rebuild pending runs none.
//
// The folders are watched through the watcher's own override and the sessions signal is a callback
// the case holds, so no file event reaches it; the fold is a double whose answer the case releases.
// The usage folder is a scratch directory.

import { afterEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchUsage } from '../../../../src/lib/server/machine/usage/watch.ts';
import type { UsageTranscriptFold } from '../../../../src/lib/server/machine/usage/transcripts.ts';
import { holdsDebounce, recording } from '../../root/watch/probe.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** The quiet the cases run the watcher with. */
const WAIT = 100;

afterEach(() => {
    vi.useRealTimers();
});

/** A fold whose every call waits until the case releases it, and how many calls were made. */
function heldFold(): { fold: UsageTranscriptFold; calls: () => number; release: () => void } {
    const waiting: (() => void)[] = [];
    let calls = 0;
    const fold = {
        fold: () => {
            calls += 1;
            return new Promise<{ rows: [] }>((done) => waiting.push(() => done({ rows: [] })));
        }
    } as unknown as UsageTranscriptFold;
    return {
        fold,
        calls: () => calls,
        release: () => {
            for (const done of waiting.splice(0)) done();
        }
    };
}

/** Let the fold that is due be called, release it, and let its payload be published. */
async function settled(held: { release: () => void }): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
    held.release();
    await vi.advanceTimersByTimeAsync(0);
}

/** A started watcher over no account, its sessions signal held by the case. */
function start(fold: UsageTranscriptFold): {
    changed: () => void;
    close: () => void;
    published: () => number;
} {
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['usage']);
    let changed = noop;
    const watcher = watchUsage(hub, {
        accounts: [],
        tiers: {},
        usageRoot: scratchDir('oculus-usage-watch-'),
        debounce: WAIT,
        interval: 3_600_000,
        fold,
        watchFolder: () => ({ close: noop }),
        onSessionsChange: (listener) => {
            changed = listener;
            return noop;
        }
    });
    return {
        changed: () => changed(),
        close: () => watcher.close(),
        published: () => client.got.length
    };
}

describe('the usage watcher', () => {
    it('debounces a burst into one rebuild, waits the whole quiet again, and runs none after close', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const held = heldFold();
        const watcher = start(held.fold);
        await settled(held);
        await holdsDebounce(
            () => {
                watcher.changed();
                held.release();
            },
            WAIT,
            () => held.calls(),
            watcher.close
        );
    });

    it('waits the whole quiet for a change that comes while a rebuild is folding', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const held = heldFold();
        const watcher = start(held.fold);
        await settled(held);
        expect(watcher.published()).toBe(1);
        watcher.changed();
        await vi.advanceTimersByTimeAsync(WAIT);
        expect(held.calls()).toBe(2);
        watcher.changed();
        await vi.advanceTimersByTimeAsync(WAIT / 2);
        held.release();
        await vi.advanceTimersByTimeAsync(WAIT / 2 - 1);
        expect(held.calls()).toBe(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(held.calls()).toBe(3);
        await settled(held);
        expect(watcher.published()).toBe(3);
        watcher.close();
    });
});
