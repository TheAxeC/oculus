// The Calendar's pure rules: which day an event lands on, how many of today's are still to come
// (the number the view's badge draws), the view kept in the instance state, the payload's events in
// the calendar library's shape with each one's tooltip, the dates the calendar may page between,
// and the options the library is handed.

import { describe, expect, it } from 'vitest';
import type {
    CalendarAccount,
    CalendarEvent,
    CalendarPayload
} from '../../../src/lib/data/model/index.ts';
import {
    calendarEvents,
    calendarOptions,
    calendarRange,
    dayOf,
    eventTooltip,
    localDate,
    parseCalendarState,
    remainingToday
} from '../../../src/lib/state/life/calendar.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { HUES } from '../../../src/lib/ui/display/hues.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
/** The catalog's words, as the view reads them. */
const WORDS = {
    allDay: catalog['calendar.all_day'],
    noEvents: catalog['calendar.no_events'],
    tentative: catalog['calendar.tentative'],
    timeRange: catalog['calendar.time_range']
};

const NOW = new Date('2031-03-02T12:00:00');
const TODAY = localDate(NOW);

function event(over: Partial<CalendarEvent>): CalendarEvent {
    return {
        id: 'one',
        account: 'work',
        calendar: 'Work',
        title: 'One',
        start: `${TODAY}T09:00:00`,
        end: `${TODAY}T10:00:00`,
        allDay: false,
        ...over
    };
}

describe('the day an event lands on', () => {
    it('takes an all-day event date as it stands, whatever zone the page is in', () => {
        expect(dayOf(event({ allDay: true, start: '2031-03-03', end: '2031-03-04' }))).toBe(
            '2031-03-03'
        );
    });

    it('puts a timed event on the day the page is in when it happens', () => {
        expect(dayOf(event({ start: '2031-03-03T23:30:00', end: '2031-03-04T00:30:00' }))).toBe(
            '2031-03-03'
        );
    });

    it('keeps a start it cannot read out of the way rather than throwing', () => {
        expect(dayOf(event({ start: 'not a time', end: 'not a time' }))).toBe('not a time');
    });
});

describe("how many of today's events are still to come", () => {
    it('counts the ones that have not ended and leaves out the ones that have', () => {
        expect(
            remainingToday(
                [
                    event({ id: 'past', start: `${TODAY}T09:00:00`, end: `${TODAY}T10:00:00` }),
                    event({ id: 'now', start: `${TODAY}T11:30:00`, end: `${TODAY}T12:30:00` }),
                    event({ id: 'later', start: `${TODAY}T14:00:00`, end: `${TODAY}T15:00:00` })
                ],
                NOW
            )
        ).toBe(2);
    });

    it('counts an all-day event of today and leaves out one of another day', () => {
        expect(
            remainingToday(
                [
                    event({ id: 'today', allDay: true, start: TODAY, end: '2031-03-03' }),
                    event({ id: 'other', allDay: true, start: '2031-03-05', end: '2031-03-06' })
                ],
                NOW
            )
        ).toBe(1);
    });

    it('leaves a cancelled event out of the count', () => {
        expect(
            remainingToday(
                [
                    event({
                        start: `${TODAY}T14:00:00`,
                        end: `${TODAY}T15:00:00`,
                        status: 'cancelled'
                    })
                ],
                NOW
            )
        ).toBe(0);
    });
});

describe('the view the Calendar keeps in its instance state', () => {
    it('reads a missing state, an unknown view and a retired one as the week', () => {
        expect(parseCalendarState({})).toEqual({ view: 'timeGridWeek' });
        expect(parseCalendarState(null)).toEqual({ view: 'timeGridWeek' });
        expect(parseCalendarState({ view: 'agenda' })).toEqual({ view: 'timeGridWeek' });
        expect(parseCalendarState({ view: 7 })).toEqual({ view: 'timeGridWeek' });
    });

    it('keeps each of the four views it draws', () => {
        for (const view of ['timeGridDay', 'timeGridWeek', 'dayGridMonth', 'listWeek']) {
            expect(parseCalendarState({ view })).toEqual({ view });
        }
    });
});

/** One account row as the payload lists it. */
function account(provider: CalendarAccount['provider'], label: string): CalendarAccount {
    return { provider, label, status: 'connected', calendars: [] };
}

describe("the payload's events in the calendar's own shape", () => {
    const accounts = [account('google', 'work'), account('microsoft', 'uni')];
    const events: CalendarEvent[] = [
        event({
            id: 'google-work-primary-a',
            start: '2031-03-02T09:00:00+01:00',
            end: '2031-03-02T10:00:00+01:00',
            link: 'https://www.google.com/calendar/event?eid=a'
        }),
        event({
            id: 'microsoft-uni-cal-b',
            account: 'uni',
            allDay: true,
            start: '2031-03-03',
            end: '2031-03-04'
        }),
        event({ id: 'google-work-primary-c', status: 'cancelled' })
    ];

    it("gives each account its own hue in the accounts' order, text on it in its own colour", () => {
        const shaped = calendarEvents(events, accounts, HUES, WORDS);
        expect(shaped.map((one) => [one.id, one.backgroundColor, one.textColor])).toEqual([
            ['google-work-primary-a', 'var(--c-blue)', 'var(--on-c-blue)'],
            ['microsoft-uni-cal-b', 'var(--c-green)', 'var(--on-c-green)']
        ]);
    });

    it('keeps a date-only start all-day on its own date', () => {
        const [, allDay] = calendarEvents(events, accounts, HUES, WORDS);
        expect(allDay.allDay).toBe(true);
        expect(allDay.start).toBe('2031-03-03');
        expect(allDay.end).toBe('2031-03-04');
    });

    it('reads a timed start as the moment it names', () => {
        const [timed] = calendarEvents(events, accounts, HUES, WORDS);
        expect(timed.allDay).toBe(false);
        expect(new Date(timed.start).toISOString()).toBe('2031-03-02T08:00:00.000Z');
        expect(new Date(timed.end).toISOString()).toBe('2031-03-02T09:00:00.000Z');
    });

    it('leaves a cancelled event out', () => {
        expect(calendarEvents(events, accounts, HUES, WORDS).map((one) => one.id)).not.toContain(
            'google-work-primary-c'
        );
    });

    it("carries an event's link in its extended properties, and no link for one with none", () => {
        const [timed, allDay] = calendarEvents(events, accounts, HUES, WORDS);
        expect(timed.extendedProps.link).toBe('https://www.google.com/calendar/event?eid=a');
        expect(Object.keys(allDay.extendedProps)).toEqual(['tooltip']);
        expect(timed.title).toBe('One');
    });
});

/** A payload read at noon of the fixture's day over 31 days back and 62 ahead. */
const PAYLOAD: CalendarPayload = {
    status: 'ok',
    accounts: [],
    events: [],
    updated: '2031-03-02T12:00:00.000Z',
    pollMin: 15,
    retryMin: 2,
    daysBack: 31,
    daysAhead: 62
};

describe('the dates the calendar may page between', () => {
    it('run from the days back before the payload to the days ahead after it', () => {
        expect(calendarRange(PAYLOAD)).toEqual({ start: '2031-01-30', end: '2031-05-03' });
    });

    it('are unbounded for a payload that names no moment it was read at', () => {
        expect(calendarRange({ ...PAYLOAD, updated: '' })).toBeNull();
    });
});

describe("an event's tooltip", () => {
    it('says a timed event its title, its time range, its calendar and its location', () => {
        expect(
            eventTooltip(
                event({
                    start: `${TODAY}T09:00:00`,
                    end: `${TODAY}T09:15:00`,
                    calendar: 'Work',
                    location: 'Room 1'
                }),
                WORDS
            )
        ).toBe('One | 09:00 to 09:15 | Work | Room 1');
    });

    it('says an all-day event with no location its title, all day and its calendar', () => {
        expect(
            eventTooltip(
                event({ allDay: true, start: TODAY, end: '2031-03-03', calendar: 'Holidays' }),
                WORDS
            )
        ).toBe('One | all day | Holidays');
    });

    it('marks a tentative event tentative, last', () => {
        expect(
            eventTooltip(
                event({
                    start: `${TODAY}T14:00:00`,
                    end: `${TODAY}T15:00:00`,
                    status: 'tentative'
                }),
                WORDS
            )
        ).toBe('One | 14:00 to 15:00 | Work | tentative');
    });

    it('puts the date in front of both ends of an event that ends on another day', () => {
        expect(
            eventTooltip(event({ start: '2031-03-02T23:00:00', end: '2031-03-03T01:00:00' }), WORDS)
        ).toBe('One | 2031-03-02 23:00 to 2031-03-03 01:00 | Work');
    });

    it('is what calendarEvents carries in the extended properties the library mounts', () => {
        const one = event({ id: 'google-work-primary-t', location: 'Room 2' });
        const [shaped] = calendarEvents([one], [account('google', 'work')], HUES, WORDS);
        expect(shaped.extendedProps.tooltip).toBe(eventTooltip(one, WORDS));
    });
});

describe('the options the library is handed', () => {
    it('bound the dates to the window read from updated, daysBack and daysAhead', () => {
        expect(calendarOptions(PAYLOAD, 'timeGridWeek', WORDS, HUES).validRange).toEqual({
            start: '2031-01-30',
            end: '2031-05-03'
        });
        expect(
            calendarOptions({ ...PAYLOAD, daysBack: 1, daysAhead: 14 }, 'timeGridWeek', WORDS, HUES)
                .validRange
        ).toEqual({ start: '2031-03-01', end: '2031-03-16' });
    });

    it('carry the view the instance keeps', () => {
        for (const view of ['timeGridDay', 'timeGridWeek', 'dayGridMonth', 'listWeek'] as const) {
            expect(calendarOptions(PAYLOAD, view, WORDS, HUES).view).toBe(view);
        }
    });

    it('carry no dates to page between for a payload that names no moment it was read at', () => {
        const options = calendarOptions({ ...PAYLOAD, updated: '' }, 'timeGridWeek', WORDS, HUES);
        // With no moment there is no window, so the library pages without bound.
        expect('validRange' in options).toBe(false);
    });

    it("carry the payload's events, the catalog's words and the pane's height", () => {
        const one = event({ id: 'google-work-primary-o' });
        const options = calendarOptions(
            { ...PAYLOAD, events: [one], accounts: [account('google', 'work')] },
            'timeGridWeek',
            WORDS,
            HUES
        );
        expect(options.events.map((shaped) => shaped.id)).toEqual(['google-work-primary-o']);
        expect(options.allDayContent).toBe(WORDS.allDay);
        expect(options.noEventsContent).toBe(WORDS.noEvents);
        expect(options.height).toBe('100%');
        expect(calendarOptions(null, 'listWeek', WORDS, HUES).events).toEqual([]);
    });
});
