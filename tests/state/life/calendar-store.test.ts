// The calendar client store: the body each of its two commands sends to the endpoint, and what it
// reads off the socket entity. Its accounts' commands are tested in accounts-store.test.ts.
//
// Nothing opens a socket: `fetch` is a stub that records the request and hands back the answer the
// case wants, and nothing reads or writes outside it. The pure rules the store reads are
// tests/state/life/calendar.test.ts's.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarAccount, CalendarPayload } from '../../../src/lib/data/model/index.ts';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const WRITE_TOKEN = 'the-write-token-of-this-case';

const GOOGLE: CalendarAccount = {
    provider: 'google',
    label: 'work',
    status: 'not-connected',
    hint: '/fixture/calendar/google-work.json',
    calendars: []
};

const PAYLOAD: CalendarPayload = {
    status: 'ok',
    accounts: [GOOGLE],
    events: [
        {
            id: 'google-work-primary-one',
            account: 'work',
            calendar: 'Work',
            title: 'Standup',
            start: '2031-03-02T09:00:00',
            end: '2031-03-02T09:15:00',
            allDay: false
        }
    ],
    updated: '2031-03-02T08:15:00',
    pollMin: 15,
    retryMin: 2,
    daysBack: 1,
    daysAhead: 14
};

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.writes.setToken(WRITE_TOKEN);
});

afterEach(() => vi.unstubAllGlobals());

/** The requests the stub fetch was given, newest last. */
let asked: { url: string; init: RequestInit }[] = [];

/** Answer every request with one body, and record what was asked. */
function answering(body: unknown = { ok: true }): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        asked.push({ url, init });
        return Promise.resolve(
            new Response(JSON.stringify(body), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
}

/** The parsed body of the one request the case made. */
function sent(): Record<string, unknown> {
    expect(asked).toHaveLength(1);
    const body = asked[0].init.body;
    expect(typeof body).toBe('string');
    return JSON.parse(typeof body === 'string' ? body : '{}') as Record<string, unknown>;
}

describe('the calendar store commands', () => {
    it('posts a refresh to the calendar endpoint with the write token', async () => {
        answering();
        await client.calendar.refresh();
        expect(asked[0].url).toBe('/api/calendar');
        expect(asked[0].init.method).toBe('POST');
        expect((asked[0].init.headers as Record<string, string>)[TOKEN_HEADER]).toBe(WRITE_TOKEN);
        expect(sent()).toEqual({ action: 'refresh' });
    });

    it('posts an open naming the event by its id, and never an address', async () => {
        answering();
        await client.calendar.openEvent('google-work-primary-one');
        const body = sent();
        expect(body).toEqual({ action: 'open', event: 'google-work-primary-one' });
        expect(JSON.stringify(body)).not.toContain('http');
    });
});

describe('what the calendar store commands say', () => {
    it('says nothing when the endpoint took the command', async () => {
        answering();
        expect(await client.calendar.refresh()).toBe('');
        answering();
        expect(await client.calendar.openEvent('google-work-primary-one')).toBe('');
    });

    it('says a refusal in the catalog sentence carrying its code', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'no such event' }), { status: 400 })
            )
        );
        expect(await client.calendar.openEvent('gone')).toBe(
            t('calendar.refused', 'no such event')
        );
    });

    it('says a command no answer came back for, and one whose answer was not JSON', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        expect(await client.calendar.refresh()).toBe(t('accounts.unreachable'));
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })));
        expect(await client.calendar.refresh()).toBe(t('accounts.unreadable'));
    });
});

describe('the calendar store readers', () => {
    it('reads the payload and the badge count off the socket entity', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(Date.parse('2031-03-02T08:30:00'));
            const fresh = createClientState();
            expect(fresh.calendar.state()).toBe(null);
            expect(fresh.calendar.badgeText()).toBe('');

            fresh.entities.receive({ channel: 'calendar', version: 1, payload: PAYLOAD });
            expect(fresh.calendar.state()).toEqual(PAYLOAD);
            expect(fresh.calendar.remaining()).toBe(1);
            expect(fresh.calendar.badgeText()).toBe('1');
        } finally {
            vi.useRealTimers();
        }
    });

    it('draws no badge once today holds nothing that has not ended', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(Date.parse('2031-03-02T18:00:00'));
            const fresh = createClientState();
            fresh.entities.receive({ channel: 'calendar', version: 1, payload: PAYLOAD });
            expect(fresh.calendar.remaining()).toBe(0);
            expect(fresh.calendar.badgeText()).toBe('');
        } finally {
            vi.useRealTimers();
        }
    });
});
