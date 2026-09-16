// The two provider readers over fixture answers in the providers' own JSON shapes: a timed event,
// an all-day event, a cancelled one and a second page, per provider.
//
// The fetcher is injected in every case, so no network call is made and no credential file is read.

import { describe, expect, it, vi } from 'vitest';
import type { ReadArgs } from '../../../src/lib/server/calendar/api.ts';
import { readGoogle } from '../../../src/lib/server/calendar/google.ts';
import { hostZone, readMicrosoft } from '../../../src/lib/server/calendar/microsoft.ts';
import type { Fetcher } from '../../../src/lib/server/connect/oauth.ts';

const TOKEN = 'the-access-token-of-this-case';

/** The window every case reads over. */
const WINDOW = {
    start: new Date('2031-03-01T00:00:00Z'),
    end: new Date('2031-03-15T00:00:00Z')
};

/** The address one fetch call was made to, whichever of the three forms it was given in. */
function urlOf(input: RequestInfo | URL): string {
    return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

/** A fetcher answering one body per address the reader asks for, and recording the addresses. */
function answering(pages: Record<string, unknown>): { fetcher: Fetcher; asked: string[] } {
    const asked: string[] = [];
    const fetcher = vi.fn<Fetcher>((input) => {
        const url = urlOf(input);
        asked.push(url);
        const key = Object.keys(pages).find((part) => url.includes(part));
        if (key === undefined) return Promise.reject(new Error(`no fixture for ${url}`));
        return Promise.resolve(
            new Response(JSON.stringify(pages[key]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
    return { fetcher, asked };
}

function args(fetcher: Fetcher): ReadArgs {
    return { token: TOKEN, key: 'google-work', label: 'work', window: WINDOW, fetcher };
}

describe('the Google reader', () => {
    const CALENDARS = {
        items: [
            { id: 'primary', summary: 'Work', selected: true },
            { id: 'holidays@group.v.calendar.google.com', summary: 'Holidays', selected: false }
        ]
    };

    it('reads the selected calendars, both time forms, the states and a second page', async () => {
        const { fetcher, asked } = answering({
            calendarList: CALENDARS,
            'pageToken=more': {
                items: [
                    {
                        id: 'three',
                        summary: 'On the second page',
                        status: 'tentative',
                        start: { dateTime: '2031-03-04T09:00:00+01:00' },
                        end: { dateTime: '2031-03-04T10:00:00+01:00' }
                    }
                ]
            },
            '/events': {
                nextPageToken: 'more',
                items: [
                    {
                        id: 'one',
                        summary: 'Standup',
                        status: 'confirmed',
                        location: 'Room 1',
                        htmlLink: 'https://www.google.com/calendar/event?eid=one',
                        start: { dateTime: '2031-03-02T09:00:00+01:00' },
                        end: { dateTime: '2031-03-02T09:15:00+01:00' }
                    },
                    {
                        id: 'two',
                        summary: 'Away',
                        status: 'cancelled',
                        start: { date: '2031-03-03' },
                        end: { date: '2031-03-04' }
                    }
                ]
            }
        });

        const reading = await readGoogle(args(fetcher));

        expect(reading.calendars).toEqual([{ id: 'primary', name: 'Work' }]);
        expect(reading.events).toEqual([
            {
                id: 'google-work-primary-one',
                account: 'work',
                calendar: 'Work',
                title: 'Standup',
                start: '2031-03-02T09:00:00+01:00',
                end: '2031-03-02T09:15:00+01:00',
                allDay: false,
                location: 'Room 1',
                link: 'https://www.google.com/calendar/event?eid=one',
                status: 'confirmed'
            },
            {
                id: 'google-work-primary-two',
                account: 'work',
                calendar: 'Work',
                title: 'Away',
                start: '2031-03-03',
                end: '2031-03-04',
                allDay: true,
                status: 'cancelled'
            },
            {
                id: 'google-work-primary-three',
                account: 'work',
                calendar: 'Work',
                title: 'On the second page',
                start: '2031-03-04T09:00:00+01:00',
                end: '2031-03-04T10:00:00+01:00',
                allDay: false,
                status: 'tentative'
            }
        ]);
        // The window and the instance expansion are what the events call asks for.
        const events = asked.find((url) => url.includes('/events')) ?? '';
        expect(events).toContain('singleEvents=true');
        expect(events).toContain(`timeMin=${encodeURIComponent(WINDOW.start.toISOString())}`);
        expect(events).toContain(`timeMax=${encodeURIComponent(WINDOW.end.toISOString())}`);
    });

    it('drops a link whose scheme is not https, and keeps the event itself', async () => {
        const { fetcher } = answering({
            calendarList: CALENDARS,
            '/events': {
                items: [
                    {
                        id: 'one',
                        summary: 'Standup',
                        htmlLink: 'javascript:alert(1)',
                        start: { dateTime: '2031-03-02T09:00:00+01:00' },
                        end: { dateTime: '2031-03-02T09:15:00+01:00' }
                    }
                ]
            }
        });

        const reading = await readGoogle(args(fetcher));

        expect(reading.events).toHaveLength(1);
        expect(reading.events[0].link).toBe(undefined);
    });

    it('throws the status and the provider own code, and nothing of the body', async () => {
        const fetcher = vi.fn<Fetcher>(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        error: { code: 403, status: 'PERMISSION_DENIED', message: 'axel@example' }
                    }),
                    { status: 403, headers: { 'content-type': 'application/json' } }
                )
            )
        );
        await expect(readGoogle(args(fetcher))).rejects.toThrow('google: 403 PERMISSION_DENIED');
        await expect(readGoogle(args(fetcher))).rejects.not.toThrow(/axel@example/);
    });
});

describe('the Microsoft reader', () => {
    function microsoftArgs(fetcher: Fetcher): ReadArgs {
        return { ...args(fetcher), key: 'microsoft-uni', label: 'uni' };
    }

    it('reads every calendar, both time forms, the states and a second page', async () => {
        const { fetcher, asked } = answering({
            '/me/calendars?': { value: [{ id: 'cal', name: 'Uni' }] },
            'skip=1': {
                value: [
                    {
                        id: 'three',
                        subject: 'On the second page',
                        isAllDay: false,
                        showAs: 'busy',
                        start: { dateTime: '2031-03-04T09:00:00.0000000' },
                        end: { dateTime: '2031-03-04T10:00:00.0000000' }
                    }
                ]
            },
            calendarView: {
                '@odata.nextLink': 'https://graph.microsoft.com/v1.0/next?skip=1',
                value: [
                    {
                        id: 'one',
                        subject: 'Lecture',
                        isAllDay: false,
                        showAs: 'tentative',
                        location: { displayName: 'Hall A' },
                        webLink: 'https://outlook.office365.com/owa/?itemid=one',
                        start: { dateTime: '2031-03-02T09:00:00.0000000' },
                        end: { dateTime: '2031-03-02T11:00:00.0000000' }
                    },
                    {
                        id: 'two',
                        subject: 'Conference',
                        isAllDay: true,
                        isCancelled: true,
                        start: { dateTime: '2031-03-03T00:00:00.0000000' },
                        end: { dateTime: '2031-03-04T00:00:00.0000000' }
                    }
                ]
            }
        });

        const reading = await readMicrosoft(microsoftArgs(fetcher));

        expect(reading.calendars).toEqual([{ id: 'cal', name: 'Uni' }]);
        expect(reading.events).toEqual([
            {
                id: 'microsoft-uni-cal-one',
                account: 'uni',
                calendar: 'Uni',
                title: 'Lecture',
                start: '2031-03-02T09:00:00',
                end: '2031-03-02T11:00:00',
                allDay: false,
                location: 'Hall A',
                link: 'https://outlook.office365.com/owa/?itemid=one',
                status: 'tentative'
            },
            {
                id: 'microsoft-uni-cal-two',
                account: 'uni',
                calendar: 'Uni',
                title: 'Conference',
                start: '2031-03-03',
                end: '2031-03-04',
                allDay: true,
                status: 'cancelled'
            },
            {
                id: 'microsoft-uni-cal-three',
                account: 'uni',
                calendar: 'Uni',
                title: 'On the second page',
                start: '2031-03-04T09:00:00',
                end: '2031-03-04T10:00:00',
                allDay: false,
                status: 'confirmed'
            }
        ]);
        const view = asked.find((url) => url.includes('calendarView')) ?? '';
        expect(view).toContain(`startDateTime=${encodeURIComponent(WINDOW.start.toISOString())}`);
        expect(view).toContain(`endDateTime=${encodeURIComponent(WINDOW.end.toISOString())}`);
    });

    it('asks for the times in this machine own zone', async () => {
        const { fetcher } = answering({
            '/me/calendars?': { value: [{ id: 'cal', name: 'Uni' }] },
            calendarView: { value: [] }
        });
        await readMicrosoft(microsoftArgs(fetcher));
        const headers = (fetcher as unknown as { mock: { calls: [string, RequestInit][] } }).mock
            .calls[0][1].headers as Record<string, string>;
        expect(headers.prefer).toBe(`outlook.timezone="${hostZone()}"`);
    });

    it('throws the status and the provider own code, and nothing of the body', async () => {
        const fetcher = vi.fn<Fetcher>(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        error: { code: 'ErrorAccessDenied', message: 'axel@example' }
                    }),
                    { status: 401, headers: { 'content-type': 'application/json' } }
                )
            )
        );
        await expect(readMicrosoft(microsoftArgs(fetcher))).rejects.toThrow(
            'microsoft: 401 ErrorAccessDenied'
        );
        await expect(readMicrosoft(microsoftArgs(fetcher))).rejects.not.toThrow(/axel@example/);
    });
});
