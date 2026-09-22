// The calendar client store: the pending-Connect set, and the body each of its three commands sends
// to the endpoint.
//
// Nothing opens a socket: `fetch` is a stub that records the request and hands back the answer the
// case wants, and nothing reads or writes outside it. The pure rules the store reads are
// tests/state/life/calendar.test.ts's.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarAccount, CalendarPayload } from '../../../src/lib/data/model.ts';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

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

    it('posts a connect naming the account by its key and nothing else', async () => {
        answering();
        await client.calendar.connect(GOOGLE);
        expect(sent()).toEqual({ action: 'connect', account: 'google-work' });
    });

    it('posts an open naming the event by its id, and never an address', async () => {
        answering();
        await client.calendar.openEvent('google-work-primary-one');
        const body = sent();
        expect(body).toEqual({ action: 'open', event: 'google-work-primary-one' });
        expect(JSON.stringify(body)).not.toContain('http');
    });
});

describe('the pending Connect press', () => {
    it('is not pending before a press', () => {
        expect(client.calendar.connecting(GOOGLE)).toBe(false);
    });

    it('is pending while the press is open and is not once it is answered', async () => {
        let answer: (response: Response) => void = () => undefined;
        const held = new Promise<Response>((resolve) => (answer = resolve));
        vi.stubGlobal('fetch', () => held);

        const press = client.calendar.connect(GOOGLE);
        await Promise.resolve();
        expect(client.calendar.connecting(GOOGLE)).toBe(true);

        answer(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
        await press;
        expect(client.calendar.connecting(GOOGLE)).toBe(false);
    });

    it('stops being pending when the press is refused', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new Error('the endpoint refused')));
        await expect(client.calendar.connect(GOOGLE)).rejects.toThrow('the endpoint refused');
        expect(client.calendar.connecting(GOOGLE)).toBe(false);
    });

    it('holds the press of one account and not of another', async () => {
        const other: CalendarAccount = { ...GOOGLE, provider: 'microsoft', label: 'uni' };
        vi.stubGlobal('fetch', () => new Promise<Response>(() => undefined));
        void client.calendar.connect(GOOGLE);
        await Promise.resolve();
        expect(client.calendar.connecting(GOOGLE)).toBe(true);
        expect(client.calendar.connecting(other)).toBe(false);
    });
});

describe('the calendar store readers', () => {
    it('reads the payload, its day groups and the rail badge count off the socket entity', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(Date.parse('2031-03-02T08:30:00'));
            const fresh = createClientState();
            expect(fresh.calendar.state()).toBe(null);
            expect(fresh.calendar.days()).toEqual([]);
            expect(fresh.calendar.badgeText()).toBe('');

            fresh.entities.receive({ channel: 'calendar', version: 1, payload: PAYLOAD });
            expect(fresh.calendar.state()).toEqual(PAYLOAD);
            expect(fresh.calendar.days().map((day) => day.day)).toEqual(['2031-03-02']);
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
