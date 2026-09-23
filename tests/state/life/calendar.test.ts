// The agenda's two pure rules: which day an event lands on, and how many of today's are still to
// come, which is the number the view's badge draws.

import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../../../src/lib/data/model.ts';
import {
    dayGroups,
    dayOf,
    localDay,
    remainingToday
} from '../../../src/lib/state/life/calendar.ts';

const NOW = new Date('2031-03-02T12:00:00');
const TODAY = localDay(NOW);

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

    it('orders the day headings by date whatever order the events arrived in', () => {
        const groups = dayGroups(
            [
                event({ id: 'c', start: '2031-03-04T09:00:00', end: '2031-03-04T10:00:00' }),
                event({ id: 'a' }),
                event({ id: 'b', allDay: true, start: '2031-03-03', end: '2031-03-04' })
            ],
            NOW
        );
        expect(groups.map((group) => group.day)).toEqual([TODAY, '2031-03-03', '2031-03-04']);
        expect(groups.map((group) => group.today)).toEqual([true, false, false]);
    });

    it('groups in the order the payload sorted them, one entry per day, today marked', () => {
        const groups = dayGroups(
            [
                event({ id: 'a' }),
                event({ id: 'b', start: `${TODAY}T14:00:00`, end: `${TODAY}T15:00:00` }),
                event({ id: 'c', start: '2031-03-04T09:00:00', end: '2031-03-04T10:00:00' })
            ],
            NOW
        );
        expect(groups.map((group) => group.day)).toEqual([TODAY, '2031-03-04']);
        expect(groups.map((group) => group.today)).toEqual([true, false]);
        expect(groups[0].events.map((one) => one.id)).toEqual(['a', 'b']);
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
