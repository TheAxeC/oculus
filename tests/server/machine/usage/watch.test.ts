// Layer 2, server test. The Usage watcher's debounce over its async rebuild: a burst of changes is
// one rebuild after the quiet, a change while a rebuild is still folding waits the whole quiet
// rather than following the fold at once, a source written without a pause is rebuilt within the
// maximum wait, a fold slower than the maximum wait leaves at most one rebuild waiting behind it,
// and a close with a rebuild pending runs none.
//
// The folders are watched through the watcher's own override and the sessions signal is a callback
// the case holds, so no file event reaches it; the fold is a double whose answer the case releases.
// The usage folder is a scratch directory.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { claudeAccountFile } from '../../../../src/lib/server/machine/usage/accounts.ts';
import {
    USAGE_DEBOUNCE,
    USAGE_MAX_WAIT,
    watchUsage
} from '../../../../src/lib/server/machine/usage/watch.ts';
import type { UsagePayload } from '../../../../src/lib/data/model/index.ts';
import type { UsageTranscriptFold } from '../../../../src/lib/server/machine/usage/transcripts.ts';
import {
    fakeClock,
    holdsDebounce,
    holdsQuietAndMaxWait,
    recording
} from '../../root/watch/probe.ts';
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

/** A fold that answers at once, and how many calls were made. */
function quickFold(): { fold: UsageTranscriptFold; calls: () => number } {
    let calls = 0;
    const fold = {
        fold: () => {
            calls += 1;
            return Promise.resolve({ rows: [] });
        }
    } as unknown as UsageTranscriptFold;
    return { fold, calls: () => calls };
}

/**
 * A started watcher over no account, its sessions signal held by the case. The quiet is the case's
 * own unless the options say otherwise; `{}` leaves it to the module.
 */
function start(
    fold: UsageTranscriptFold,
    options: { debounce?: number } = { debounce: WAIT }
): {
    changed: () => void;
    close: () => void;
    published: () => number;
    builtAt: () => number[];
    refresh: () => Promise<void>;
} {
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['usage']);
    let changed = noop;
    const watcher = watchUsage(hub, {
        accounts: [],
        tiers: {},
        usageRoot: scratchDir('oculus-usage-watch-'),
        ...options,
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
        published: () => client.got.length,
        builtAt: () =>
            client.got.map((message) => Date.parse((message.payload as UsagePayload).builtAt)),
        refresh: () => watcher.refresh()
    };
}

describe('the usage watcher', () => {
    it('debounces a burst into one rebuild, waits the whole quiet again, and runs none after close', async () => {
        fakeClock();
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
        fakeClock();
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

describe('the usage watcher under a fold slower than the maximum wait', () => {
    /** How often the source is written, in ms. */
    const EVERY = 100;

    it("leaves at most one rebuild waiting behind the fold, and publishes the last change's data", async () => {
        fakeClock();
        const held = heldFold();
        const watcher = start(held.fold, {});
        await vi.advanceTimersByTimeAsync(0);
        // The rebuild made at start-up is folding and stays so for the rest of the writes.
        expect(held.calls()).toBe(1);

        let lastWrite = 0;
        for (let at = 0; at < 5 * USAGE_MAX_WAIT; at += EVERY) {
            watcher.changed();
            lastWrite = Date.now();
            await vi.advanceTimersByTimeAsync(EVERY);
        }
        await vi.advanceTimersByTimeAsync(USAGE_DEBOUNCE);
        expect(held.calls()).toBe(1);

        // Each release lets the fold that waits finish and the next one, if any, begin.
        for (let step = 0; step < 10; step += 1) {
            held.release();
            await vi.advanceTimersByTimeAsync(0);
        }
        expect(held.calls()).toBe(2);
        expect(watcher.published()).toBe(2);
        expect(watcher.builtAt()[1]).toBeGreaterThanOrEqual(lastWrite);
        watcher.close();
    });

    it('hands every refresh that arrives while a fold runs the one rebuild that waits', async () => {
        fakeClock();
        const held = heldFold();
        const watcher = start(held.fold, {});
        await vi.advanceTimersByTimeAsync(0);
        const first = watcher.refresh();
        expect(watcher.refresh()).toBe(first);
        held.release();
        await vi.advanceTimersByTimeAsync(0);
        expect(held.calls()).toBe(2);
        held.release();
        await first;
        expect(watcher.published()).toBe(2);
        watcher.close();
    });
});

describe('the usage watcher after the rebuild that waited has started', () => {
    it('makes a new rebuild wait for a refresh that comes while that one folds', async () => {
        fakeClock();
        const held = heldFold();
        const watcher = start(held.fold, {});
        await vi.advanceTimersByTimeAsync(0);
        const first = watcher.refresh();
        held.release();
        await vi.advanceTimersByTimeAsync(0);
        expect(held.calls()).toBe(2);
        const second = watcher.refresh();
        expect(second).not.toBe(first);
        held.release();
        await vi.advanceTimersByTimeAsync(0);
        expect(held.calls()).toBe(3);
        held.release();
        await second;
        expect(watcher.published()).toBe(3);
        watcher.close();
    });

    it('starts no rebuild that waited once the watcher is closed', async () => {
        fakeClock();
        const held = heldFold();
        const watcher = start(held.fold, {});
        await vi.advanceTimersByTimeAsync(0);
        const waiting = watcher.refresh();
        watcher.close();
        held.release();
        await waiting;
        await vi.advanceTimersByTimeAsync(0);
        expect(held.calls()).toBe(1);
    });

    it('logs a rebuild that fails, whether it ran at once or waited, and leaves no rejection', async () => {
        fakeClock();
        const said = vi.spyOn(console, 'error').mockImplementation(noop);
        let calls = 0;
        const failing = {
            fold: () => {
                calls += 1;
                return Promise.reject(new Error(`fold ${calls}`));
            }
        } as unknown as UsageTranscriptFold;
        const watcher = start(failing, {});
        // The rebuild made at start-up is running, so this one waits behind it.
        const waited = watcher.refresh();
        await vi.advanceTimersByTimeAsync(0);
        await expect(waited).resolves.toBeUndefined();
        await expect(watcher.refresh()).resolves.toBeUndefined();
        expect(said.mock.calls.map((call) => String(call[0]))).toEqual([
            'usage watch: cannot rebuild: fold 1',
            'usage watch: cannot rebuild: fold 2',
            'usage watch: cannot rebuild: fold 3'
        ]);
        said.mockRestore();
        watcher.close();
    });
});

describe('the usage watcher with its own quiet and maximum wait', () => {
    /** A started watcher on the module's own quiet, and the number of rebuilds it has begun. */
    async function started(options: { debounce?: number } = {}): Promise<{
        changed: () => void;
        close: () => void;
        count: () => number;
    }> {
        fakeClock();
        const quick = quickFold();
        const watcher = start(quick.fold, options);
        await vi.advanceTimersByTimeAsync(0);
        return { changed: watcher.changed, close: watcher.close, count: quick.calls };
    }

    holdsQuietAndMaxWait({
        quiet: USAGE_DEBOUNCE,
        maxWait: USAGE_MAX_WAIT,
        what: 'rebuild',
        held: async (debounce) => {
            const { changed, close, count } = await started(
                debounce === undefined ? {} : { debounce }
            );
            return { event: changed, count, close };
        }
    });
});

describe('the usage watcher on tiers that change', () => {
    /** A watcher over one Claude account whose plan id is `t`, its first rebuild done. */
    async function labelled(tiers: Record<string, string>) {
        const root = scratchDir('oculus-usage-tiers-');
        const dir = join(root, '.claude');
        const file = claudeAccountFile(dir);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify({ oauthAccount: { organizationRateLimitTier: 't' } }));
        const hub = new Hub();
        const watcher = watchUsage(hub, {
            accounts: [{ tool: 'claude', dir, label: 'a' }],
            tiers,
            usageRoot: join(root, 'status'),
            fold: quickFold().fold,
            watchFolder: () => ({ close: noop }),
            interval: 3_600_000
        });
        await watcher.refresh();
        const label = (): string =>
            (hub.latest('usage')?.payload as UsagePayload).accounts[0].tierLabel;
        const flush = (): Promise<void> => new Promise((done) => setTimeout(done, 0));
        return { hub, watcher, label, flush };
    }

    it('publishes again with the new label, and publishes nothing for equal tiers', async () => {
        const { hub, watcher, label, flush } = await labelled({ t: 'Old' });
        expect(label()).toBe('Old');
        const version = hub.version('usage');

        watcher.setTiers({ t: 'Old' });
        await flush();
        expect(hub.version('usage')).toBe(version);

        watcher.setTiers({ t: 'New' });
        await flush();
        expect(hub.version('usage')).toBe(version + 1);
        expect(label()).toBe('New');
        watcher.close();
    });

    it('publishes nothing once it is closed', async () => {
        const { hub, watcher, flush } = await labelled({ t: 'Old' });
        watcher.close();
        const version = hub.version('usage');

        watcher.setTiers({ t: 'New' });
        await flush();

        expect(hub.version('usage')).toBe(version);
    });
});
