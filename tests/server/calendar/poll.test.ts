// The calendar poller with an injected fetcher only, so the unconfigured machine, the not-connected
// account, a good poll, a failed one, the forced refresh, one poll at a time and timer closure are
// all reached without the network.
//
// Every credential file this file reads is in a directory it made under mkdtemp and asserted to be
// inside the temporary directory first; nothing under the reader's own home is touched.

import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { CalendarAccountConfig, CalendarPayload } from '../../../src/lib/data/model.ts';
import { Hub } from '../../../src/lib/server/channels.ts';
import { RETRY_MIN, watchCalendar } from '../../../src/lib/server/calendar/poll.ts';
import { credentialFile } from '../../../src/lib/server/connect/store.ts';
import type { Fetcher } from '../../../src/lib/server/connect/oauth.ts';
import { scratchDir, sweepScratch } from '../../scratch.ts';

afterAll(sweepScratch);

const MINUTE = 60000;
const POLL_MIN = 15;
const GOOGLE: CalendarAccountConfig = { provider: 'google', label: 'work' };
const ACCESS = 'the-access-token-no-payload-may-carry';
const REFRESH = 'the-refresh-token-no-payload-may-carry';

const made: string[] = [];

afterEach(() => {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
});

function scratch(): string {
    const dir = scratchDir('oculus-calendar-poll-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    return dir;
}

/** One account's file, with the refresh token unless the case asks for the client half alone. */
function writeAccount(dir: string, account: CalendarAccountConfig, connected = true): string {
    const file = credentialFile(dir, account);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(
        file,
        JSON.stringify({
            client_id: 'an-id',
            client_secret: 'a-secret',
            ...(connected ? { refresh_token: REFRESH } : {})
        })
    );
    return file;
}

/** The address one fetch call was made to, whichever of the three forms it was given in. */
function urlOf(input: RequestInfo | URL): string {
    return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

/**
 * Give the event loop a turn until the condition holds, or give up. A round reaches the calendar
 * listing only after the token call and its body have been read, which is several turns, so a case
 * that has to catch a round in flight waits for it rather than counting microtasks.
 */
async function until(held: () => boolean): Promise<void> {
    for (let turn = 0; turn < 50 && !held(); turn += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

/** One good answer, in the form a fetcher hands it back. */
function answer(body: unknown): Promise<Response> {
    return Promise.resolve(
        new Response(JSON.stringify(body), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        })
    );
}

/** The payload the hub currently holds on the calendar channel. */
function held(hub: Hub): CalendarPayload {
    return hub.latest('calendar')?.payload as CalendarPayload;
}

/** One Google event, in the shape the reader parses. */
function event(id: string, start: string, end: string): Record<string, unknown> {
    return {
        id,
        summary: id,
        status: 'confirmed',
        start: { dateTime: start },
        end: { dateTime: end }
    };
}

/**
 * A fetcher answering the token endpoint and Google's two reads from whatever `provider.up` says at
 * the moment it is called, so one watcher can be taken down and brought back inside a case.
 */
function swingingFetcher(provider: { up: boolean; events: Record<string, unknown>[] }) {
    return vi.fn<Fetcher>((input) => {
        const url = urlOf(input);
        if (url.includes('oauth2.googleapis.com')) return answer({ access_token: ACCESS });
        if (!provider.up) return Promise.reject(new Error('the provider did not answer'));
        return answer(
            url.includes('calendarList')
                ? { items: [{ id: 'primary', summary: 'Work', selected: true }] }
                : { items: provider.events }
        );
    });
}

/**
 * How many polls have reached the provider, counted at the calendar listing: it is the first call of
 * every attempt, so a poll that failed is counted as one and a poll that succeeded as one.
 */
function pollCalls(fetcher: ReturnType<typeof swingingFetcher>): number {
    return fetcher.mock.calls.filter((call) => urlOf(call[0]).includes('calendarList')).length;
}

/** The options one case runs its watcher under. */
function options(dir: string, fetcher: Fetcher, accounts = [GOOGLE]) {
    return { accounts, dir, pollMin: POLL_MIN, daysBack: 1, daysAhead: 14, fetcher };
}

describe('the calendar poller', () => {
    it('publishes unconfigured once and calls no provider when the machine names no account', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>(() => {
            throw new Error('the poller called a provider');
        });
        const watcher = watchCalendar(hub, options(scratch(), fetcher, []));

        expect(held(hub).status).toBe('unconfigured');
        expect(held(hub).accounts).toEqual([]);
        expect(held(hub).events).toEqual([]);
        await watcher.refresh();
        await vi.advanceTimersByTimeAsync(POLL_MIN * 2 * MINUTE);
        expect(fetcher).not.toHaveBeenCalled();
        expect(hub.version('calendar')).toBe(1);

        watcher.close();
        vi.useRealTimers();
    });

    it('marks an account with no refresh token not connected, naming the file to create', async () => {
        const dir = scratch();
        const file = writeAccount(dir, GOOGLE, false);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>(() => {
            throw new Error('the poller called a provider');
        });
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await watcher.refresh();

        expect(held(hub).status).toBe('ok');
        expect(held(hub).accounts).toEqual([
            {
                provider: 'google',
                label: 'work',
                status: 'not-connected',
                hint: file,
                calendars: []
            }
        ]);
        expect(fetcher).not.toHaveBeenCalled();

        watcher.close();
    });

    it('marks an account whose file is not there at all not connected, naming the same path', async () => {
        const dir = scratch();
        const hub = new Hub();
        const watcher = watchCalendar(
            hub,
            options(
                dir,
                vi.fn<Fetcher>(() => {
                    throw new Error('the poller called a provider');
                })
            )
        );
        await watcher.refresh();

        expect(held(hub).accounts[0].status).toBe('not-connected');
        expect(held(hub).accounts[0].hint).toBe(credentialFile(dir, GOOGLE));

        watcher.close();
    });

    it('publishes a good poll events sorted across accounts, and the window it read', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const microsoft: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
        writeAccount(dir, microsoft);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((input) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com') || url.includes('login.microsoftonline.com'))
                return answer({ access_token: ACCESS });
            if (url.includes('graph.microsoft.com')) {
                return answer(
                    url.includes('calendarView')
                        ? {
                              value: [
                                  {
                                      id: 'early',
                                      subject: 'Early',
                                      isAllDay: false,
                                      start: { dateTime: '2031-03-02T08:00:00.0000000' },
                                      end: { dateTime: '2031-03-02T09:00:00.0000000' }
                                  }
                              ]
                          }
                        : { value: [{ id: 'cal', name: 'Uni' }] }
                );
            }
            return answer(
                url.includes('calendarList')
                    ? { items: [{ id: 'primary', summary: 'Work', selected: true }] }
                    : { items: [event('later', '2031-03-02T10:00:00', '2031-03-02T11:00:00')] }
            );
        });
        const watcher = watchCalendar(hub, options(dir, fetcher, [GOOGLE, microsoft]));
        await watcher.refresh();

        const payload = held(hub);
        expect(payload.status).toBe('ok');
        expect(payload.accounts.map((account) => account.status)).toEqual([
            'connected',
            'connected'
        ]);
        expect(payload.events.map((one) => one.title)).toEqual(['Early', 'later']);
        expect(payload.pollMin).toBe(POLL_MIN);
        expect(payload.retryMin).toBe(RETRY_MIN);
        expect(payload.daysBack).toBe(1);
        expect(payload.daysAhead).toBe(14);

        watcher.close();
    });

    it('keeps the last good events of a failed account and shortens the cadence', async () => {
        vi.useFakeTimers();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const provider = {
            up: true,
            events: [event('one', '2031-03-02T10:00:00', '2031-03-02T11:00:00')]
        };
        const fetcher = swingingFetcher(provider);
        const hub = new Hub();
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await vi.advanceTimersByTimeAsync(0);
        expect(held(hub).events).toHaveLength(1);
        const good = pollCalls(fetcher);

        provider.up = false;
        await vi.advanceTimersByTimeAsync(POLL_MIN * MINUTE);
        // The account is in error, the rows under it are the ones the last good poll left, and the
        // time that poll landed at is still on the account.
        expect(held(hub).status).toBe('error');
        expect(held(hub).accounts[0].status).toBe('error');
        expect(held(hub).accounts[0].lastOk).not.toBe(undefined);
        expect(held(hub).accounts[0].calendars).toEqual([{ id: 'primary', name: 'Work' }]);
        expect(held(hub).events).toHaveLength(1);
        expect(pollCalls(fetcher)).toBe(good + 1);

        // The next attempt comes after the short cadence rather than the full period.
        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE);
        expect(pollCalls(fetcher)).toBe(good + 2);

        // An answer restores the regular cadence.
        provider.up = true;
        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE);
        expect(held(hub).status).toBe('ok');
        const after = pollCalls(fetcher);
        await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE);
        expect(pollCalls(fetcher)).toBe(after);
        await vi.advanceTimersByTimeAsync(POLL_MIN * MINUTE);
        expect(pollCalls(fetcher)).toBe(after + 1);

        watcher.close();
        vi.useRealTimers();
    });

    it('retries the refusing account every two minutes and leaves the healthy one on its period', async () => {
        vi.useFakeTimers();
        const dir = scratch();
        const microsoft: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
        writeAccount(dir, GOOGLE);
        writeAccount(dir, microsoft);
        const hub = new Hub();
        // Google refuses from the second round on; Microsoft answers throughout.
        let rounds = 0;
        const google = { listings: 0 };
        const graph = { listings: 0 };
        const fetcher = vi.fn<Fetcher>((input) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com') || url.includes('login.microsoftonline.com'))
                return answer({ access_token: ACCESS });
            if (url.includes('graph.microsoft.com')) {
                if (url.includes('/me/calendars?')) graph.listings += 1;
                return answer(url.includes('calendarView') ? { value: [] } : { value: [] });
            }
            if (url.includes('calendarList')) {
                google.listings += 1;
                rounds += 1;
                if (rounds > 1) return Promise.reject(new Error('the provider did not answer'));
            }
            return answer({ items: [] });
        });
        const watcher = watchCalendar(hub, options(dir, fetcher, [GOOGLE, microsoft]));
        await vi.advanceTimersByTimeAsync(0);
        expect(google.listings).toBe(1);
        expect(graph.listings).toBe(1);

        // One period later both are due; Google fails and is now on the short cadence.
        await vi.advanceTimersByTimeAsync(POLL_MIN * MINUTE);
        expect(held(hub).accounts[0].status).toBe('error');
        expect(held(hub).accounts[1].status).toBe('connected');
        expect(google.listings).toBe(2);
        expect(graph.listings).toBe(2);

        // Over the next period Google is retried every two minutes and Microsoft is not called at
        // all until its own period comes round again.
        for (let step = 1; step * RETRY_MIN < POLL_MIN; step += 1) {
            await vi.advanceTimersByTimeAsync(RETRY_MIN * MINUTE);
            expect(google.listings).toBe(2 + step);
            expect(graph.listings).toBe(2);
        }
        await vi.advanceTimersByTimeAsync(POLL_MIN * MINUTE);
        expect(graph.listings).toBe(3);

        watcher.close();
        vi.useRealTimers();
    });

    it('sorts the two providers events by the moment each happens, not by the string', async () => {
        // A Microsoft wall clock has no offset and is read in the host's zone, so the case pins that
        // zone: the two strings below are in one order and the moments they stand for in the other,
        // and which is which cannot be stated without saying what zone the server is in.
        const zone = process.env.TZ;
        process.env.TZ = 'UTC';
        try {
            const dir = scratch();
            const microsoft: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
            writeAccount(dir, GOOGLE);
            writeAccount(dir, microsoft);
            const hub = new Hub();
            const fetcher = vi.fn<Fetcher>((input) => {
                const url = urlOf(input);
                if (
                    url.includes('oauth2.googleapis.com') ||
                    url.includes('login.microsoftonline.com')
                )
                    return answer({ access_token: ACCESS });
                if (url.includes('graph.microsoft.com')) {
                    return answer(
                        url.includes('calendarView')
                            ? {
                                  value: [
                                      {
                                          id: 'wall',
                                          subject: 'Wall clock 09:00 UTC',
                                          isAllDay: false,
                                          start: { dateTime: '2031-03-02T09:00:00.0000000' },
                                          end: { dateTime: '2031-03-02T10:00:00.0000000' }
                                      }
                                  ]
                              }
                            : { value: [{ id: 'cal', name: 'Uni' }] }
                    );
                }
                return answer(
                    url.includes('calendarList')
                        ? { items: [{ id: 'primary', summary: 'Work', selected: true }] }
                        : {
                              items: [
                                  {
                                      id: 'allday',
                                      summary: 'All day',
                                      status: 'confirmed',
                                      start: { date: '2031-03-02' },
                                      end: { date: '2031-03-03' }
                                  },
                                  {
                                      id: 'offset',
                                      summary: 'Offset 07:00 UTC',
                                      status: 'confirmed',
                                      start: { dateTime: '2031-03-02T12:00:00+05:00' },
                                      end: { dateTime: '2031-03-02T13:00:00+05:00' }
                                  }
                              ]
                          }
                );
            });
            const watcher = watchCalendar(hub, options(dir, fetcher, [GOOGLE, microsoft]));
            await watcher.refresh();

            // By string the Google offset value ('...T12:00:00+05:00') sorts last of the three; by
            // the moment it stands for it is 07:00 UTC, which is before the 09:00 UTC wall clock.
            expect(held(hub).events.map((one) => one.title)).toEqual([
                'All day',
                'Offset 07:00 UTC',
                'Wall clock 09:00 UTC'
            ]);
            expect(
                [...held(hub).events].sort((one, two) => (one.start < two.start ? -1 : 1))[2].title
            ).toBe('Offset 07:00 UTC');

            watcher.close();
        } finally {
            if (zone === undefined) delete process.env.TZ;
            else process.env.TZ = zone;
        }
    });

    it('runs one round at a time and gives every refresh meanwhile the one follow-up round', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        // The first calendar listing is held open, so the round the watcher starts is still in
        // flight while the refreshes below are asked for.
        let settle: () => void = () => undefined;
        const first = new Promise<Response>((resolve) => {
            settle = () =>
                resolve(
                    new Response(
                        JSON.stringify({
                            items: [{ id: 'primary', summary: 'Work', selected: true }]
                        }),
                        { status: 200, headers: { 'content-type': 'application/json' } }
                    )
                );
        });
        let listings = 0;
        const fetcher = vi.fn<Fetcher>((input) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com')) return answer({ access_token: ACCESS });
            if (!url.includes('calendarList')) return answer({ items: [] });
            listings += 1;
            return listings === 1
                ? first
                : answer({ items: [{ id: 'primary', summary: 'Work', selected: true }] });
        });
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await until(() => listings === 1);

        const during = watcher.refresh();
        const same = watcher.refresh();
        const third = watcher.refresh();
        // All three asked for the same follow-up, and none of them started a round of its own while
        // the first was still in flight.
        expect(same).toBe(during);
        expect(third).toBe(during);
        expect(listings).toBe(1);

        settle();
        await during;
        // Exactly one round followed the one that was running, not three.
        expect(listings).toBe(2);

        watcher.close();
    });

    it('stops its timer on close and polls nothing after it', async () => {
        vi.useFakeTimers();
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const provider = { up: true, events: [] as Record<string, unknown>[] };
        const fetcher = swingingFetcher(provider);
        const hub = new Hub();
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await vi.advanceTimersByTimeAsync(0);
        const before = pollCalls(fetcher);

        watcher.close();
        await watcher.refresh();
        await vi.advanceTimersByTimeAsync(POLL_MIN * 4 * MINUTE);

        expect(pollCalls(fetcher)).toBe(before);
        expect(vi.getTimerCount()).toBe(0);
        vi.useRealTimers();
    });

    it('treats a 200 whose body it cannot read as a refusal and keeps the last good rows', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        const provider = {
            up: true,
            events: [event('one', '2031-03-02T10:00:00', '2031-03-02T11:00:00')]
        };
        // The first round answers properly; every round after it answers 200 with a body that is
        // not an object, which is what a proxy or a sign-in page in front of the provider returns.
        let good = true;
        const fetcher = vi.fn<Fetcher>((input) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com')) return answer({ access_token: ACCESS });
            if (good)
                return answer(
                    url.includes('calendarList')
                        ? { items: [{ id: 'primary', summary: 'Work', selected: true }] }
                        : { items: provider.events }
                );
            return Promise.resolve(
                new Response('<html>sign in</html>', {
                    status: 200,
                    headers: { 'content-type': 'text/html' }
                })
            );
        });
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await watcher.refresh();
        expect(held(hub).accounts[0].status).toBe('connected');
        expect(held(hub).events).toHaveLength(1);

        good = false;
        await watcher.refresh();

        expect(held(hub).status).toBe('error');
        expect(held(hub).accounts[0].status).toBe('error');
        expect(held(hub).accounts[0].hint).toBe('google: 200 unreadable answer');
        // The last good rows are still under the state word rather than replaced by an empty read.
        expect(held(hub).accounts[0].calendars).toEqual([{ id: 'primary', name: 'Work' }]);
        expect(held(hub).events).toHaveLength(1);

        watcher.close();
    });

    it('treats a 200 whose body is JSON but not an object as the same refusal', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((input) =>
            urlOf(input).includes('oauth2.googleapis.com')
                ? answer({ access_token: ACCESS })
                : answer(['not', 'an', 'object'])
        );
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await watcher.refresh();

        expect(held(hub).accounts[0].status).toBe('error');
        expect(held(hub).accounts[0].hint).toBe('google: 200 unreadable answer');
        expect(held(hub).events).toEqual([]);

        watcher.close();
    });

    it('carries no access token and no refresh token in the payload it publishes', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const provider = {
            up: true,
            events: [event('one', '2031-03-02T10:00:00', '2031-03-02T11:00:00')]
        };
        const hub = new Hub();
        const watcher = watchCalendar(hub, options(dir, swingingFetcher(provider)));
        await watcher.refresh();

        const wire = JSON.stringify(held(hub));
        expect(wire).not.toContain(ACCESS);
        expect(wire).not.toContain(REFRESH);
        expect(wire).not.toContain('a-secret');
        expect(wire).not.toContain('an-id');

        watcher.close();
    });

    it('follows a provider second page of events', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((input) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com')) return answer({ access_token: ACCESS });
            if (url.includes('calendarList'))
                return answer({ items: [{ id: 'primary', summary: 'Work', selected: true }] });
            const second = url.includes('pageToken=more');
            return answer({
                ...(second ? {} : { nextPageToken: 'more' }),
                items: [
                    event(
                        second ? 'two' : 'one',
                        second ? '2031-03-03T10:00:00' : '2031-03-02T10:00:00',
                        second ? '2031-03-03T11:00:00' : '2031-03-02T11:00:00'
                    )
                ]
            });
        });
        const watcher = watchCalendar(hub, options(dir, fetcher));
        await watcher.refresh();

        expect(held(hub).events.map((one) => one.title)).toEqual(['one', 'two']);

        watcher.close();
    });
});
