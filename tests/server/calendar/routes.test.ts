// The two actions of the calendar endpoint that are not the connect flow: the refresh, and the
// control that opens one event at its provider.
//
// The page never sends an address: it names an event of the state the poller published, and the
// server reads that event's own link. A case here asserts that an address the page invents reaches
// no opener at all, and another that a link whose scheme is not `https` reaches none either.

import { describe, expect, it, vi } from 'vitest';
import type { CalendarEvent } from '../../../src/lib/data/model.ts';
import { ConnectStates, callbackUrl } from '../../../src/lib/server/calendar/oauth.ts';
import { handleCalendar } from '../../../src/lib/server/calendar/routes.ts';

const TOKEN = 'the-write-token-of-this-case';
const LINK = 'https://www.google.com/calendar/event?eid=one';

const EVENT: CalendarEvent = {
    id: 'google-work-primary-one',
    account: 'work',
    calendar: 'Work',
    title: 'Standup',
    start: '2031-03-02T09:00:00+01:00',
    end: '2031-03-02T09:15:00+01:00',
    allDay: false,
    link: LINK
};

function post(body: unknown): Request {
    return new Request('http://127.0.0.1:8791/api/calendar', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(body)
    });
}

function target(
    opened: string[],
    refresh = vi.fn(() => Promise.resolve()),
    link: string | null = LINK
) {
    return {
        token: TOKEN,
        accounts: [{ provider: 'google' as const, label: 'work' }],
        dir: '/fixture/calendar',
        redirect: callbackUrl(8791),
        states: new ConnectStates(),
        refresh,
        open: (url: string) => void opened.push(url),
        linkFor: (id: string) => (id === EVENT.id ? link : null)
    };
}

describe('the calendar endpoint', () => {
    it('runs one poll on refresh', async () => {
        const refresh = vi.fn(() => Promise.resolve());
        const answer = await handleCalendar(post({ action: 'refresh' }), target([], refresh));
        expect(answer.status).toBe(200);
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('opens the link the published state holds for the event the page named', async () => {
        const opened: string[] = [];
        const answer = await handleCalendar(
            post({ action: 'open', event: EVENT.id }),
            target(opened)
        );
        expect(answer.status).toBe(200);
        expect(opened).toEqual([LINK]);
    });

    it('opens nothing for an event the published state does not hold', async () => {
        const opened: string[] = [];
        const answer = await handleCalendar(
            post({ action: 'open', event: 'google-work-primary-elsewhere' }),
            target(opened)
        );
        expect(answer.status).toBe(400);
        expect(opened).toEqual([]);
    });

    it('opens nothing when the page sends an address instead of an event', async () => {
        const opened: string[] = [];
        const answer = await handleCalendar(
            post({ action: 'open', event: 'https://elsewhere.example/steal' }),
            target(opened)
        );
        expect(answer.status).toBe(400);
        expect(opened).toEqual([]);
    });

    it('opens nothing when the held link is not an https address', async () => {
        const opened: string[] = [];
        for (const link of ['javascript:alert(1)', 'file:///tmp/x', '-n', 'not an address']) {
            const answer = await handleCalendar(
                post({ action: 'open', event: EVENT.id }),
                target(
                    opened,
                    vi.fn(() => Promise.resolve()),
                    link
                )
            );
            expect(answer.status).toBe(400);
        }
        expect(opened).toEqual([]);
    });

    it('refuses an action it does not know and a body that is not JSON', async () => {
        const opened: string[] = [];
        expect((await handleCalendar(post({ action: 'delete' }), target(opened))).status).toBe(400);
        const bad = new Request('http://127.0.0.1:8791/api/calendar', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'sec-fetch-site': 'same-origin',
                'x-oculus-token': TOKEN
            },
            body: 'not json'
        });
        expect((await handleCalendar(bad, target(opened))).status).toBe(400);
        expect(opened).toEqual([]);
    });
});
