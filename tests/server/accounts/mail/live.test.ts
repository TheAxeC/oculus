// The mail poller's settings changed while it runs: a new period moves each account's next read to
// the earlier of the old time and the new period from the push, a changed count reads every
// account at once asking for that many threads, a changed sentence is the one the next row carries,
// and a closed watcher ignores every change.
//
// Every provider call is answered by a fake fetcher and every credential file is in a directory the
// case made under the temporary directory.

import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type { InboxPayload } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    RETRY_MIN,
    watchMail,
    type MailWatcher
} from '../../../../src/lib/server/accounts/mail/poll.ts';
import { GOOGLE, answer, cleanup, fakeFetcher, scratch, writeAccount } from './fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

const MINUTE = 60000;
const START = { pollMin: 15, perSignal: 25 };
const WORDS = { timedOut: 'waited {0}' };

const watchers: MailWatcher[] = [];

afterEach(() => {
    for (const watcher of watchers.splice(0)) watcher.close();
    vi.useRealTimers();
    cleanup();
});

/** Gmail's three listings, each answering no thread, so a round is the three list requests. */
const EMPTY = [{ when: (url: string) => url.includes('/threads'), body: { threads: [] } }];

/** The rounds a fetcher has seen: one per read of the unread listing. */
function rounds(calls: { url: string }[]): number {
    return calls.filter((call) => call.url.includes('is%3Aunread')).length;
}

/** A watcher on fake timers over the Google account, its first round done. */
async function started(fetcher: typeof fetch, over: Partial<typeof START> = {}) {
    vi.useFakeTimers();
    const dir = scratch();
    writeAccount(dir, GOOGLE);
    const hub = new Hub();
    const watcher = watchMail(hub, {
        accounts: [GOOGLE],
        dir,
        providerDir: join(dir, 'connect'),
        ...START,
        ...over,
        fetcher,
        words: WORDS,
        pollNotes: false
    });
    watchers.push(watcher);
    await vi.advanceTimersByTimeAsync(0);
    return { hub, watcher };
}

/** Let every round that is waiting on a promise run to its end. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 20; turn += 1) await vi.advanceTimersByTimeAsync(0);
}

/** A fetcher that answers the token call and refuses every listing. */
function refusing() {
    const calls: { url: string }[] = [];
    const fetcher: typeof fetch = (input) => {
        const url =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        calls.push({ url });
        return url.includes('oauth2') || url.includes('/token')
            ? answer({ access_token: 'an-access-token' })
            : answer({ error: { status: 'UNAVAILABLE' } }, 503);
    };
    return { fetcher, calls };
}

function held(hub: Hub): InboxPayload {
    return hub.latest('inbox')?.payload as InboxPayload;
}

describe('a mail poller whose settings change', () => {
    it('reads an account that is due in 15 minutes 5 minutes after the period becomes 5', async () => {
        const fake = fakeFetcher(EMPTY);
        const { watcher } = await started(fake.fetcher);
        expect(rounds(fake.calls)).toBe(1);

        watcher.setSettings({ ...START, pollMin: 5 });

        await vi.advanceTimersByTimeAsync(5 * MINUTE - 1);
        expect(rounds(fake.calls)).toBe(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(rounds(fake.calls)).toBe(2);
        await vi.advanceTimersByTimeAsync(5 * MINUTE);
        expect(rounds(fake.calls)).toBe(3);
    });

    it('moves an account in retry to 1 minute after the push when the period becomes 1', async () => {
        const refused = refusing();
        const { watcher } = await started(refused.fetcher);
        expect(rounds(refused.calls)).toBe(1);

        watcher.setSettings({ ...START, pollMin: 1 });

        await vi.advanceTimersByTimeAsync(1 * MINUTE - 1);
        expect(rounds(refused.calls)).toBe(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(rounds(refused.calls)).toBe(2);
    });

    it('keeps the retry time of an account in retry when the period becomes 5', async () => {
        const refused = refusing();
        const { watcher } = await started(refused.fetcher);

        watcher.setSettings({ ...START, pollMin: 5 });

        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE - 1);
        expect(rounds(refused.calls)).toBe(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(rounds(refused.calls)).toBe(2);
    });

    it('leaves an account due in 3 minutes at 3 when the period is raised to 60', async () => {
        const fake = fakeFetcher(EMPTY);
        const { watcher } = await started(fake.fetcher, { pollMin: 5 });
        await vi.advanceTimersByTimeAsync(2 * MINUTE);

        watcher.setSettings({ ...START, pollMin: 60 });

        await vi.advanceTimersByTimeAsync(3 * MINUTE);
        expect(rounds(fake.calls)).toBe(2);
        await vi.advanceTimersByTimeAsync(59 * MINUTE);
        expect(rounds(fake.calls)).toBe(2);
        await vi.advanceTimersByTimeAsync(1 * MINUTE);
        expect(rounds(fake.calls)).toBe(3);
    });

    it('publishes again with the new period when only the period changed, reading nobody', async () => {
        const fake = fakeFetcher(EMPTY);
        const { hub, watcher } = await started(fake.fetcher);
        const version = hub.version('inbox');

        watcher.setSettings({ ...START, pollMin: 5 });

        expect(hub.version('inbox')).toBe(version + 1);
        expect(held(hub).pollMin).toBe(5);
        await settle();
        expect(rounds(fake.calls)).toBe(1);
    });

    it('reads every account at once asking each listing for the new count', async () => {
        const fake = fakeFetcher(EMPTY);
        const { watcher } = await started(fake.fetcher);
        const asked = (): (string | null)[] =>
            fake.calls
                .filter((call) => call.url.includes('is%3Aunread'))
                .map((call) => new URL(call.url).searchParams.get('maxResults'));
        expect(asked()).toEqual(['25']);

        watcher.setSettings({ ...START, perSignal: 10 });
        await settle();

        expect(asked()).toEqual(['25', '10']);
    });

    it('does nothing for settings equal to the ones in force', async () => {
        const fake = fakeFetcher(EMPTY);
        const { hub, watcher } = await started(fake.fetcher);
        const version = hub.version('inbox');

        watcher.setSettings({ ...START });
        await settle();

        expect(rounds(fake.calls)).toBe(1);
        expect(hub.version('inbox')).toBe(version);
    });

    it('writes the pushed sentence on the next row that a request without an answer leaves', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        const hangs: typeof fetch = (_input, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(init.signal?.reason as Error);
                });
            });
        const watcher = watchMail(hub, {
            accounts: [GOOGLE],
            dir,
            providerDir: join(dir, 'connect'),
            ...START,
            fetcher: hangs,
            readTimeoutMs: 50,
            words: WORDS,
            pollNotes: false
        });
        watchers.push(watcher);
        for (let turn = 0; turn < 200 && hub.latest('inbox') === undefined; turn += 1) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        expect(held(hub).accounts[0].hint).toBe('waited 0.05');

        watcher.setWords({ timedOut: 'another {0}' });
        await watcher.refresh();

        expect(held(hub).accounts[0].hint).toBe('another 0.05');
    });

    it('does nothing once it is closed: no timer, no read, no publish', async () => {
        const fake = fakeFetcher(EMPTY);
        const { hub, watcher } = await started(fake.fetcher);
        watcher.close();
        const version = hub.version('inbox');

        watcher.setSettings({ pollMin: 1, perSignal: 9 });
        watcher.setWords({ timedOut: 'a' });

        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(5 * MINUTE);
        expect(rounds(fake.calls)).toBe(1);
        expect(hub.version('inbox')).toBe(version);
    });

    it('publishes the new period and reads nothing when no account is configured', async () => {
        const fake = fakeFetcher(EMPTY);
        vi.useFakeTimers();
        const dir = scratch();
        const hub = new Hub();
        const watcher = watchMail(hub, {
            accounts: [],
            dir,
            providerDir: join(dir, 'connect'),
            ...START,
            fetcher: fake.fetcher,
            words: WORDS,
            pollNotes: false
        });
        watchers.push(watcher);
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).pollMin).toBe(15);
        const version = hub.version('inbox');

        watcher.setSettings({ pollMin: 5, perSignal: 25 });
        expect(held(hub).pollMin).toBe(5);
        watcher.setSettings({ pollMin: 5, perSignal: 10 });

        expect(hub.version('inbox')).toBe(version + 2);
        expect(fake.calls).toEqual([]);
    });
});
