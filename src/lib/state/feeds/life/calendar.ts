// Layer 2, client state. Pure grouping and counting for the Calendar view, so the day an event
// lands on is decided in one place rather than in the markup.
//
// A start is an ISO string in one of two forms (data/model/model-calendar.ts says which): a date
// for an all-day event, and a timed value the page reads in its own zone. A date is taken as it
// stands, so an all-day event is never moved a day by a zone; a timed value is put on the day the
// reader is in when it happens.

import type { CalendarEvent } from '../../../data/model/index.ts';
export { calendarKey } from '../../../data/accounts/calendar.ts';
export type {
    CalendarAccount,
    CalendarEvent,
    CalendarEventStatus,
    CalendarPayload
} from '../../../data/model/index.ts';

/** One heading of the agenda and the events under it. */
export type CalendarDay = { day: string; today: boolean; events: CalendarEvent[] };

/** A moment as `YYYY-MM-DD` in the page's own zone. */
export function localDay(at: Date): string {
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** The day an event belongs to: an all-day event's own date, or the local day of its start. */
export function dayOf(event: CalendarEvent): string {
    if (event.allDay) return event.start.slice(0, 10);
    const at = new Date(event.start);
    return Number.isNaN(at.getTime()) ? event.start.slice(0, 10) : localDay(at);
}

/**
 * Whether an event is still to come at this moment; an all-day event runs to the end of its day.
 */
function ahead(event: CalendarEvent, now: Date): boolean {
    if (event.allDay) return true;
    const end = new Date(event.end);
    return Number.isNaN(end.getTime()) || end.getTime() > now.getTime();
}

/**
 * The events grouped by day, one entry per day that has any, the headings in date order. The order
 * inside a day is the payload's, which the server sorted by the moment each event happens; the
 * headings are ordered here by their own date rather than by which event arrived first, so the
 * agenda reads downwards whatever order the groups were built in.
 */
export function dayGroups(events: CalendarEvent[], now: Date): CalendarDay[] {
    const today = localDay(now);
    const found = new Map<string, CalendarDay>();
    for (const event of events) {
        const day = dayOf(event);
        const group = found.get(day) ?? { day, today: day === today, events: [] };
        group.events.push(event);
        found.set(day, group);
    }
    return [...found.values()].sort((one, two) =>
        one.day < two.day ? -1 : one.day > two.day ? 1 : 0
    );
}

/** How many of today's events have not ended yet, which is what the view's badge counts. */
export function remainingToday(events: CalendarEvent[], now: Date): number {
    const today = localDay(now);
    return events.filter(
        (event) => dayOf(event) === today && event.status !== 'cancelled' && ahead(event, now)
    ).length;
}
