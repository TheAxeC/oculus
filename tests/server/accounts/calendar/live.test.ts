// The calendar poller's settings changed while it runs: a new period moves each account's next
// read to the earlier of the old time and the new period from the push, a changed window reads
// every account at once, a changed sentence is the one the next row carries, and a closed watcher
// ignores every change.
//
// A published link is read through a recording fetcher for the cadence and the sentences, and a
// Google account for the window, whose request names it. Every credential file is in a directory
// the case made under the temporary directory.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type {
    CalendarAccountConfig,
    CalendarPayload
} from '../../../../src/lib/data/model/index.ts';
import { fillPlaceholders } from '../../../../src/lib/data/helpers/finding-text.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    RETRY_MIN,
    watchCalendar,
    type CalendarWatcher
} from '../../../../src/lib/server/accounts/calendar/poll.ts';
import { credentialFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import type { Fetcher } from '../../../../src/lib/server/accounts/connect/oauth.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { ICS_TEXT } from './ics-fixture.ts';

const MINUTE = 60000;
const DAY = 86400000;
const LINK = 'https://example.invalid/cal.ics';
const ICS: CalendarAccountConfig = { provider: 'ics', label: 'rooster' };
const GOOGLE: CalendarAccountConfig = { provider: 'google', label: 'work' };
const WORDS = {
    icsNoLink: 'no link kept',
    icsFailed: 'could not read {0}',
    timedOut: 'waited {0}'
};
const START = { pollMin: 15, daysBack: 1, daysAhead: 14 };

const watchers: CalendarWatcher[] = [];

afterEach(() => {
    for (const watcher of watchers.splice(0)) watcher.close();
    vi.useRealTimers();
});

/** One account's credential file, holding the record the case gives it. */
function writeAccount(
    dir: string,
    account: CalendarAccountConfig,
    record: Record<string, unknown>
): void {
    const file = credentialFile(dir, account);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, JSON.stringify(record));
}

/** A watcher on fake timers over the accounts, its first round done. */
async function started(
    accounts: CalendarAccountConfig[],
    fetcher: Fetcher,
    over: { dir?: string; readTimeoutMs?: number } & Partial<typeof START> = {}
) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-02T12:00:00.000Z'));
    const dir = over.dir ?? scratchDir('oculus-calendar-live-');
    const hub = new Hub();
    const watcher = watchCalendar(hub, {
        accounts,
        dir,
        providerDir: join(dir, 'connect'),
        ...START,
        ...over,
        fetcher,
        words: WORDS
    });
    watchers.push(watcher);
    await vi.advanceTimersByTimeAsync(0);
    return { hub, watcher, dir };
}

/** Let every round that is waiting on a promise run to its end. */
async function settle(): Promise<void> {
    for (let turn = 0; turn < 20; turn += 1) await vi.advanceTimersByTimeAsync(0);
}

/** A fetcher that answers every address with an empty published calendar and counts its calls. */
function reading() {
    return vi.fn<Fetcher>(() => Promise.resolve(new Response(ICS_TEXT, { status: 200 })));
}

/** A fetcher that fails every call. */
function failing() {
    return vi.fn<Fetcher>(() => Promise.reject(new Error('the provider did not answer')));
}

function held(hub: Hub): CalendarPayload {
    return hub.latest('calendar')?.payload as CalendarPayload;
}

/** The directory of a case with the published link of the one account written. */
function linked(record: Record<string, unknown> = { url: LINK }): string {
    const dir = scratchDir('oculus-calendar-live-');
    mkdirSync(dir, { recursive: true });
    writeAccount(dir, ICS, record);
    return dir;
}

describe('a calendar poller whose settings change', () => {
    it('reads an account that is due in 15 minutes 5 minutes after the period becomes 5', async () => {
        const fetcher = reading();
        const { watcher } = await started([ICS], fetcher, { dir: linked() });
        expect(fetcher).toHaveBeenCalledTimes(1);

        watcher.setSettings({ ...START, pollMin: 5 });

        await vi.advanceTimersByTimeAsync(5 * MINUTE - 1);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(fetcher).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(5 * MINUTE);
        expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('moves an account in retry to 1 minute after the push when the period becomes 1', async () => {
        const fetcher = failing();
        const { watcher } = await started([ICS], fetcher, { dir: linked() });

        watcher.setSettings({ ...START, pollMin: 1 });

        await vi.advanceTimersByTimeAsync(1 * MINUTE - 1);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('keeps the retry time of an account in retry when the period becomes 5', async () => {
        const fetcher = failing();
        const { watcher } = await started([ICS], fetcher, { dir: linked() });

        watcher.setSettings({ ...START, pollMin: 5 });

        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE - 1);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('leaves an account due in 3 minutes at 3 when the period is raised to 60', async () => {
        const fetcher = reading();
        const { watcher } = await started([ICS], fetcher, { dir: linked(), pollMin: 5 });
        await vi.advanceTimersByTimeAsync(2 * MINUTE);

        watcher.setSettings({ ...START, pollMin: 60 });

        await vi.advanceTimersByTimeAsync(3 * MINUTE);
        expect(fetcher).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(59 * MINUTE);
        expect(fetcher).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1 * MINUTE);
        expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('publishes again with the new period when only the period changed, reading nobody', async () => {
        const fetcher = reading();
        const { hub, watcher } = await started([ICS], fetcher, { dir: linked() });
        const version = hub.version('calendar');

        watcher.setSettings({ ...START, pollMin: 5 });

        expect(hub.version('calendar')).toBe(version + 1);
        expect(held(hub).pollMin).toBe(5);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('reads every account at once through the new window, and publishes it', async () => {
        const dir = scratchDir('oculus-calendar-live-');
        writeAccount(dir, GOOGLE, {
            client_id: 'an-id',
            client_secret: 'a-secret',
            refresh_token: 'a-token'
        });
        const listed: string[] = [];
        const fetcher = vi.fn<Fetcher>((input) => {
            const url =
                typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            if (url.includes('calendarList')) {
                return Promise.resolve(
                    Response.json({ items: [{ id: 'primary', summary: 'Work', selected: true }] })
                );
            }
            if (url.includes('/events')) {
                listed.push(url);
                return Promise.resolve(Response.json({ items: [] }));
            }
            return Promise.resolve(Response.json({ access_token: 'an-access-token' }));
        });
        const { hub, watcher } = await started([GOOGLE], fetcher, { dir });
        await settle();
        expect(listed).toHaveLength(1);
        const now = Date.now();

        watcher.setSettings({ ...START, daysBack: 7 });
        await settle();
        watcher.setSettings({ ...START, daysBack: 7, daysAhead: 30 });
        await settle();

        expect(listed).toHaveLength(3);
        const window = (url: string) => new URL(url).searchParams;
        expect(window(listed[1]).get('timeMin')).toBe(new Date(now - 7 * DAY).toISOString());
        expect(window(listed[2]).get('timeMax')).toBe(new Date(now + 30 * DAY).toISOString());
        expect(held(hub)).toMatchObject({ daysBack: 7, daysAhead: 30 });
    });

    it('does nothing for settings equal to the ones in force', async () => {
        const fetcher = reading();
        const { hub, watcher } = await started([ICS], fetcher, { dir: linked() });
        const version = hub.version('calendar');

        watcher.setSettings({ ...START });
        await settle();

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(hub.version('calendar')).toBe(version);
    });

    it('writes the pushed sentence on the next row of the kind it is', async () => {
        const missing = await started([ICS], reading(), { dir: linked({}) });
        expect(held(missing.hub).accounts[0].hint).toBe(WORDS.icsNoLink);
        missing.watcher.setWords({ ...WORDS, icsNoLink: 'another no link' });
        await missing.watcher.refresh();
        expect(held(missing.hub).accounts[0].hint).toBe('another no link');

        const unread = await started([ICS], failing(), { dir: linked() });
        expect(held(unread.hub).accounts[0].hint).toBe(
            fillPlaceholders(WORDS.icsFailed, ['rooster'])
        );
        unread.watcher.setWords({ ...WORDS, icsFailed: 'another {0}' });
        await unread.watcher.refresh();
        expect(held(unread.hub).accounts[0].hint).toBe('another rooster');
    });

    it(
        'writes the pushed timeout sentence on the next row that a request without an answer leaves',
        { tags: ['slow'] },
        async () => {
            const dir = linked();
            const hub = new Hub();
            const watcher = watchCalendar(hub, {
                accounts: [ICS],
                dir,
                providerDir: join(dir, 'connect'),
                ...START,
                fetcher: (_input, init) => hangs(init),
                readTimeoutMs: 50,
                words: WORDS
            });
            watchers.push(watcher);
            for (let turn = 0; turn < 200 && hub.latest('calendar') === undefined; turn += 1) {
                await new Promise((resolve) => setTimeout(resolve, 10));
            }
            expect(held(hub).accounts[0].hint).toBe(fillPlaceholders(WORDS.timedOut, ['0.05']));

            watcher.setWords({ ...WORDS, timedOut: 'another {0}' });
            await watcher.refresh();

            expect(held(hub).accounts[0].hint).toBe('another 0.05');
        }
    );

    it('does nothing once it is closed: no timer, no read, no publish', async () => {
        const fetcher = reading();
        const { hub, watcher } = await started([ICS], fetcher, { dir: linked() });
        watcher.close();
        const version = hub.version('calendar');

        watcher.setSettings({ pollMin: 1, daysBack: 9, daysAhead: 9 });
        watcher.setWords({ icsNoLink: 'a', icsFailed: 'b', timedOut: 'c' });

        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(5 * MINUTE);
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(hub.version('calendar')).toBe(version);
    });

    it('publishes the new window and period when no account is configured', async () => {
        const fetcher = reading();
        const { hub, watcher } = await started([], fetcher);
        expect(held(hub)).toMatchObject(START);

        watcher.setSettings({ pollMin: 5, daysBack: 7, daysAhead: 30 });

        expect(held(hub)).toMatchObject({ pollMin: 5, daysBack: 7, daysAhead: 30 });
        expect(fetcher).not.toHaveBeenCalled();
        watcher.setSettings({ pollMin: 5, daysBack: 7, daysAhead: 60 });
        expect(held(hub)).toMatchObject({ daysAhead: 60 });
    });
});

/** A request that is never answered: it settles only when its signal aborts. */
function hangs(init: RequestInit | undefined): Promise<Response> {
    return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason as Error);
        });
    });
}
