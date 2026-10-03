// Layer 2, server tests. The calendar poller over a provider and a link that never answer: a
// request that hangs and a body that never arrives each end at the read timeout the case shortens
// the poller's to, the row says so in the sentence the catalog holds and never in the link, and one
// account that hangs does not stop the next one being read.
//
// Every credential file is in a directory the case made under the temporary directory.
// @module-tag slow: its cases wait on a real read timeout, so npm test leaves it out.

import { describe, expect, vi } from 'vitest';
import type { CalendarAccountConfig } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchCalendar } from '../../../../src/lib/server/accounts/calendar/poll.ts';
import type { Fetcher } from '../../../../src/lib/server/accounts/connect/oauth.ts';
import { fillPlaceholders } from '../../../../src/lib/data/helpers/finding-text.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    ACCESS,
    GOOGLE,
    ICS,
    WORDS,
    answer,
    held,
    options,
    scratch,
    urlOf,
    writeAccount,
    writeLink
} from './poll-fixture.ts';

/** The read timeout a case shortens the poller's to, so a request that hangs ends at once. */
const SHORT_TIMEOUT_MS = 50;

/**
 * A request that is never answered: it settles only when its signal aborts, rejecting with the
 * signal's reason as fetch does.
 */
function hanging(init: RequestInit | undefined): Promise<Response> {
    return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) return;
        signal.addEventListener('abort', () => {
            reject(signal.reason as Error);
        });
    });
}

/**
 * An answer whose head arrives and whose body never does: the body ends only when the request's
 * signal aborts, with the signal's reason, as fetch's own body does.
 */
function stalledBody(init: RequestInit | undefined): Promise<Response> {
    const signal = init?.signal;
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            signal?.addEventListener('abort', () => {
                controller.error(signal.reason);
            });
        }
    });
    return Promise.resolve(
        new Response(body, { status: 200, headers: { 'content-type': 'application/json' } })
    );
}

describe('the calendar poller', () => {
    it('gives an account whose provider never answers the timeout sentence and reads the next', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const microsoft: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
        writeAccount(dir, microsoft);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((input, init) => {
            const url = urlOf(input);
            if (url.includes('oauth2.googleapis.com') || url.includes('login.microsoftonline.com'))
                return answer({ access_token: ACCESS });
            if (url.includes('googleapis.com')) return hanging(init);
            return answer(
                url.includes('calendarView')
                    ? {
                          value: [
                              {
                                  id: 'read',
                                  subject: 'Read',
                                  isAllDay: false,
                                  start: { dateTime: '2031-03-02T08:00:00.0000000' },
                                  end: { dateTime: '2031-03-02T09:00:00.0000000' }
                              }
                          ]
                      }
                    : { value: [{ id: 'cal', name: 'Uni' }] }
            );
        });
        const watcher = watchCalendar(hub, {
            ...options(dir, fetcher, [GOOGLE, microsoft]),
            readTimeoutMs: SHORT_TIMEOUT_MS
        });
        await watcher.refresh();

        const [google, uni] = held(hub).accounts;
        expect(google.status).toBe('error');
        expect(google.hint).toBe(
            fillPlaceholders(WORDS.timedOut, [String(SHORT_TIMEOUT_MS / 1000)])
        );
        expect(uni.status).toBe('connected');
        expect(held(hub).events.map((one) => one.title)).toEqual(['Read']);

        watcher.close();
    });

    it('gives the timeout sentence to an account whose answer arrives with no body', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((input, init) =>
            urlOf(input).includes('oauth2.googleapis.com')
                ? answer({ access_token: ACCESS })
                : stalledBody(init)
        );
        const watcher = watchCalendar(hub, {
            ...options(dir, fetcher),
            readTimeoutMs: SHORT_TIMEOUT_MS
        });
        await watcher.refresh();

        const [row] = held(hub).accounts;
        expect(row.status).toBe('error');
        expect(row.hint).toBe(fillPlaceholders(WORDS.timedOut, [String(SHORT_TIMEOUT_MS / 1000)]));

        watcher.close();
    });
});

describe('a published calendar link', () => {
    it('gives a link that never answers the timeout sentence, never the link', async () => {
        const dir = scratch();
        writeLink(dir);
        const hub = new Hub();
        const fetcher = vi.fn<Fetcher>((_input, init) => hanging(init));
        const watcher = watchCalendar(hub, {
            ...options(dir, fetcher, [ICS]),
            readTimeoutMs: SHORT_TIMEOUT_MS
        });
        await watcher.refresh();

        const [row] = held(hub).accounts;
        expect(row.status).toBe('error');
        expect(row.hint).toBe(fillPlaceholders(WORDS.timedOut, [String(SHORT_TIMEOUT_MS / 1000)]));

        watcher.close();
    });
});
