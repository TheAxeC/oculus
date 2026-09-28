// Layer 2, client state. The Calendar view's pure rules, so what the calendar draws is decided in
// one place rather than in the markup: the view an instance keeps, the payload's events in the
// shape the calendar library reads with each one's tooltip, the dates it may page between, the
// options the library is handed, and the count of today's events still to come that the view's
// badge draws.
//
// A start is an ISO string in one of two forms (data/model/model-calendar.ts says which): a date
// for an all-day event, and a timed value the page reads in its own zone. A date is taken as it
// stands, so an all-day event is never moved a day by a zone; a timed value is handed on as the
// moment it names, since the library reads an offset of `Z` as a wall clock and would move it.

import { calendarKey } from '../../data/accounts/calendar.ts';
import { fillPlaceholders } from '../../data/helpers/finding-text.ts';
import { isMap } from '../../data/helpers/guards.ts';
import type { CalendarAccount, CalendarEvent, CalendarPayload } from '../../data/model/index.ts';
export { calendarKey } from '../../data/accounts/calendar.ts';
export type {
    CalendarAccount,
    CalendarEvent,
    CalendarEventStatus,
    CalendarPayload
} from '../../data/model/index.ts';

/** The four views the Calendar draws, in the order its toolbar offers them. */
export const CALENDAR_VIEWS = ['timeGridDay', 'timeGridWeek', 'dayGridMonth', 'listWeek'] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** What one Calendar instance keeps: the view it was left in. */
export type CalendarState = { view: CalendarView };

/** The view an instance opens in until the reader picks another. */
const DEFAULT_VIEW: CalendarView = 'timeGridWeek';

/**
 * One event as the calendar library reads it: the payload's own fields, the account's colours, and
 * the event's link and tooltip carried where the library hands them back on a click and on a mount.
 */
export type CalendarEntry = {
    id: string;
    title: string;
    /** An all-day event's date as it stands, or the moment a timed one starts. */
    start: string | Date;
    end: string | Date;
    allDay: boolean;
    backgroundColor?: string;
    textColor?: string;
    extendedProps: { link?: string; tooltip: string };
};

/**
 * The catalog's words the library's options and an event's tooltip are drawn with: the all-day
 * label, the empty list's sentence, the tentative mark, and a time range with `{0}` for its start
 * and `{1}` for its end.
 */
export type CalendarViewWords = {
    allDay: string;
    noEvents: string;
    tentative: string;
    timeRange: string;
};

/**
 * The options the Calendar hands the calendar library, apart from the callbacks, which are the
 * view's own. The library's toolbar is emptied, since the view draws its own above it, and the
 * dates it may page between are the payload's window, left unbounded while the payload says no
 * moment it was read at.
 */
export type CalendarLibraryOptions = {
    view: CalendarView;
    events: CalendarEntry[];
    headerToolbar: { start: string; center: string; end: string };
    validRange?: { start: string; end: string };
    height: string;
    /** The day a week starts on, 0 for Sunday. */
    firstDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    scrollTime: string;
    nowIndicator: boolean;
    eventTimeFormat: Intl.DateTimeFormatOptions;
    slotLabelFormat: Intl.DateTimeFormatOptions;
    allDayContent: string;
    noEventsContent: string;
};

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

/** The instance state a Calendar keeps, a missing or unknown view read as the week. */
export function parseCalendarState(raw: unknown): CalendarState {
    const view = isMap(raw) ? raw.view : undefined;
    const known = CALENDAR_VIEWS.find((one) => one === view);
    return { view: known ?? DEFAULT_VIEW };
}

/**
 * The account an event was read from, by the account key its id starts with, or -1. The longest key
 * wins, so an account whose key begins another's is never matched for it.
 */
function accountIndex(event: CalendarEvent, accounts: CalendarAccount[]): number {
    let found = -1;
    accounts.forEach((account, at) => {
        const key = calendarKey(account);
        if (!event.id.startsWith(`${key}-`)) return;
        if (found === -1 || key.length > calendarKey(accounts[found]).length) found = at;
    });
    return found;
}

/**
 * The payload's events in the calendar library's shape, a cancelled one left out. Each account is
 * painted in one of `hues`, by its place in the payload's account list, so an account keeps its
 * colour for as long as the list does not change; the event's text is the colour drawn on that hue.
 */
export function calendarEvents(
    events: CalendarEvent[],
    accounts: CalendarAccount[],
    hues: readonly string[],
    words: CalendarViewWords
): CalendarEntry[] {
    const shaped: CalendarEntry[] = [];
    for (const event of events) {
        if (event.status === 'cancelled') continue;
        const at = accountIndex(event, accounts);
        const hue = at === -1 || hues.length === 0 ? undefined : hues[at % hues.length];
        shaped.push({
            id: event.id,
            title: event.title,
            start: event.allDay ? event.start : moment(event.start),
            end: event.allDay ? event.end : moment(event.end),
            allDay: event.allDay,
            ...(hue === undefined
                ? {}
                : { backgroundColor: `var(--c-${hue})`, textColor: `var(--on-c-${hue})` }),
            extendedProps: {
                ...(event.link === undefined ? {} : { link: event.link }),
                tooltip: eventTooltip(event, words)
            }
        });
    }
    return shaped;
}

/**
 * What an event's tooltip says, which is what the grid has no room for: its title, which a narrow
 * column cuts, its time range or the all-day label, its calendar's name, its location when it has
 * one, and the tentative mark when it is tentative, joined by ` | `. A time is the page's own hour
 * and minute, with the date in front of both ends when the event ends on another day.
 */
export function eventTooltip(event: CalendarEvent, words: CalendarViewWords): string {
    const parts = [
        event.title,
        event.allDay ? words.allDay : timeRange(event, words),
        event.calendar
    ];
    if (event.location !== undefined && event.location !== '') parts.push(event.location);
    if (event.status === 'tentative') parts.push(words.tentative);
    return parts.join(' | ');
}

/** A timed event's start and end in the catalog's range, or the values as they stand. */
function timeRange(event: CalendarEvent, words: CalendarViewWords): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return fillPlaceholders(words.timeRange, [event.start, event.end]);
    }
    const pad = (value: number): string => String(value).padStart(2, '0');
    const clock = (at: Date): string => `${pad(at.getHours())}:${pad(at.getMinutes())}`;
    const sameDay = localDay(start) === localDay(end);
    const shown = (at: Date): string => (sameDay ? clock(at) : `${localDay(at)} ${clock(at)}`);
    return fillPlaceholders(words.timeRange, [shown(start), shown(end)]);
}

/** A timed value as the moment it names, or the value as it stands when it cannot be read. */
function moment(value: string): string | Date {
    const at = new Date(value);
    return Number.isNaN(at.getTime()) ? value : at;
}

/**
 * The dates the calendar may page between: the window the payload was read over, from `daysBack`
 * days before the moment it was published to `daysAhead` days after it, each as the page's own day.
 * A payload that names no moment it was read at, or one that cannot be read, has no window.
 */
export function calendarRange(payload: CalendarPayload): { start: string; end: string } | null {
    const day = 86400000;
    const at = new Date(payload.updated).getTime();
    if (Number.isNaN(at)) return null;
    return {
        start: localDay(new Date(at - payload.daysBack * day)),
        end: localDay(new Date(at + payload.daysAhead * day))
    };
}

/**
 * The options the calendar library draws one payload with in one view: the payload's events in the
 * library's shape, the view, and the payload's window as the dates it may page between. Hours are
 * drawn on the 24-hour clock, the week starts on Monday, and the day opens scrolled to 07:00. The
 * height is the box the view gives the library, so its time grid scrolls inside itself.
 */
export function calendarOptions(
    payload: CalendarPayload | null,
    view: CalendarView,
    words: CalendarViewWords,
    hues: readonly string[]
): CalendarLibraryOptions {
    const range = payload === null ? null : calendarRange(payload);
    const hourMinute: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return {
        view,
        events:
            payload === null ? [] : calendarEvents(payload.events, payload.accounts, hues, words),
        headerToolbar: { start: '', center: '', end: '' },
        ...(range === null ? {} : { validRange: range }),
        height: '100%',
        firstDay: 1,
        scrollTime: '07:00:00',
        nowIndicator: true,
        eventTimeFormat: hourMinute,
        slotLabelFormat: hourMinute,
        allDayContent: words.allDay,
        noEventsContent: words.noEvents
    };
}

/** How many of today's events have not ended yet, which is what the view's badge counts. */
export function remainingToday(events: CalendarEvent[], now: Date): number {
    const today = localDay(now);
    return events.filter(
        (event) => dayOf(event) === today && event.status !== 'cancelled' && ahead(event, now)
    ).length;
}
