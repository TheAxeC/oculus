// The two provider readers over fixture answers in the providers' own JSON shapes: a timed event,
// an all-day event, a cancelled one and a second page, per provider.
//
// The fetcher is injected in every case, so no network call is made and no credential file is read.

import { describe, expect, it, vi } from 'vitest';
import type { ReadArgs } from '../../../../src/lib/server/accounts/calendar/api.ts';
import { readGoogle } from '../../../../src/lib/server/accounts/calendar/google.ts';
import { hostZone, readMicrosoft } from '../../../../src/lib/server/accounts/calendar/microsoft.ts';
import { refusalLine } from '../../../../src/lib/server/accounts/connect/api.ts';
import type { Fetcher } from '../../../../src/lib/server/accounts/connect/oauth.ts';

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
});

describe('the refusal line over a body of the wrong shape', () => {
    it('names the error text, the status or the code of the provider, in that order', () => {
        expect(refusalLine('google', 403, { error: 'x' })).toBe('google: 403 x');
        expect(refusalLine('google', 403, { error: { status: 'S' } })).toBe('google: 403 S');
        expect(refusalLine('google', 403, { error: { status: 3, code: 'C' } })).toBe(
            'google: 403 C'
        );
        expect(refusalLine('microsoft', 401, { error: { code: 5 } })).toBe('microsoft: 401');
        expect(refusalLine('microsoft', 401, [])).toBe('microsoft: 401');
        expect(refusalLine('microsoft', 401, null)).toBe('microsoft: 401');
        expect(refusalLine('microsoft', 401, { error: [] })).toBe('microsoft: 401');
    });
});

describe('the Google reader over events of the wrong shape', () => {
    it('reads a date when the timed value is not text, and drops an event whose ends are not text', async () => {
        const { fetcher } = answering({
            calendarList: { items: [{ id: 'primary', summary: 'Work', selected: true }] },
            '/events': {
                items: [
                    { id: 'a', start: { date: 3 }, end: { date: '2031-03-04' } },
                    {
                        id: 'b',
                        start: { dateTime: 3, date: '2031-03-03' },
                        end: { date: '2031-03-04' }
                    },
                    {
                        id: 'c',
                        summary: 3,
                        status: 3,
                        location: 3,
                        htmlLink: 3,
                        start: { dateTime: '2031-03-02T09:00:00+01:00' },
                        end: { dateTime: '2031-03-02T10:00:00+01:00' }
                    },
                    { id: 3, start: { date: '2031-03-03' }, end: { date: '2031-03-04' } }
                ]
            }
        });
        const reading = await readGoogle(args(fetcher));
        const event = (id: string, start: string, end: string, title: string, allDay: boolean) => ({
            id: `google-work-primary-${id}`,
            account: 'work',
            calendar: 'Work',
            title,
            start,
            end,
            allDay
        });
        expect(reading.events).toStrictEqual([
            event('b', '2031-03-03', '2031-03-04', '', true),
            event('c', '2031-03-02T09:00:00+01:00', '2031-03-02T10:00:00+01:00', '', false)
        ]);
    });
});

describe('the Microsoft reader over events of the wrong shape', () => {
    it('leaves out a location, a link and a state that are not what they should be', async () => {
        const { fetcher } = answering({
            '/me/calendars?': { value: [{ id: 'cal', name: 'Uni' }] },
            calendarView: {
                value: [
                    {
                        id: 'one',
                        subject: 3,
                        isAllDay: 'true',
                        isCancelled: 'true',
                        showAs: 3,
                        location: [],
                        webLink: 3,
                        start: { dateTime: '2031-03-02T09:00:00.0000000' },
                        end: { dateTime: '2031-03-02T11:00:00.0000000' }
                    },
                    {
                        id: 'two',
                        subject: 'Two',
                        location: { displayName: 3 },
                        start: { dateTime: '2031-03-02T09:00:00' },
                        end: { dateTime: '2031-03-02T10:00:00' }
                    },
                    {
                        id: 'three',
                        subject: 'Three',
                        location: { displayName: '' },
                        start: { dateTime: 3 },
                        end: { dateTime: '2031-03-02T10:00:00' }
                    }
                ]
            }
        });
        const reading = await readMicrosoft({
            ...args(fetcher),
            key: 'microsoft-uni',
            label: 'uni'
        });
        const event = (id: string, title: string, start: string, end: string) => ({
            id: `microsoft-uni-cal-${id}`,
            account: 'uni',
            calendar: 'Uni',
            title,
            start,
            end,
            allDay: false,
            status: 'confirmed'
        });
        expect(reading.events).toStrictEqual([
            event('one', '', '2031-03-02T09:00:00', '2031-03-02T11:00:00'),
            event('two', 'Two', '2031-03-02T09:00:00', '2031-03-02T10:00:00')
        ]);
    });
});
