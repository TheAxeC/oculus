// Layer 2, server. One published calendar link read over the window: the file fetched from the
// address its link names, parsed with ical.js, and every event inside the window given in the
// payload's own shape.
//
// The file is RFC 5545 as Outlook, Google and every other calendar publishes it. ical.js reads it
// whole: a TZID is looked up in the file's own VTIMEZONE blocks through the parsed tree, so a
// Windows zone name such as `W. Europe Standard Time` is read by the rules the file itself gives,
// and nothing is registered in ical.js's process-wide zone service; a repeating event is expanded
// by ical.js's own iterator, which honours EXDATE, and an occurrence moved by a RECURRENCE-ID is
// read from its exception. Only the fetch and the mapping to CalendarEvent are written here.
//
// A time keeps the zone it was written in: an all-day event is its date alone, a timed one the wall
// clock of its zone with that zone's offset at that moment, and a floating time, which names no
// zone, the wall clock alone, which the page reads in its own zone as it reads Microsoft's.
//
// The link is the reader's key to the calendar. Nothing here logs it, and no error thrown here
// carries it or any byte of the file, so a caller may drop the message and lose nothing.

import ICAL from 'ical.js';
import type { CalendarEvent, CalendarEventStatus } from '../../../data/model/index.ts';
import { httpsLink, type Reading, type Window } from './api.ts';
import type { Fetcher } from '../connect/oauth.ts';

/** What one read is given: the account's key and label, and the window. */
export type IcsArgs = {
    /** The account's key, which prefixes every event id so two accounts cannot collide. */
    key: string;
    /** The account's label, which names the calendar when the file names none. */
    label: string;
    window: Window;
};

/** The id the one calendar of a published link carries, since the file names no id of its own. */
const CALENDAR_ID = 'ics';

/**
 * How many occurrences of one repeating event are stepped through before the reader gives up on
 * reaching the window. A daily series begun a century before the window is well inside it.
 */
const MAX_STEPS = 40000;

/** The address a published link is fetched at: `webcal://` is the same address over https. */
export function icsAddress(link: string): string {
    return link.replace(/^webcal:/i, 'https:');
}

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

/**
 * One end of an event as the payload writes it: the date of an all-day event, the wall clock with
 * its zone's offset for a timed one, and the wall clock alone for a floating one.
 */
function stamp(time: ICAL.Time): string {
    const date = `${pad(time.year, 4)}-${pad(time.month)}-${pad(time.day)}`;
    if (time.isDate) return date;
    const clock = `${date}T${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}`;
    if (time.zone === ICAL.Timezone.localTimezone) return clock;
    const offset = time.utcOffset();
    const minutes = Math.abs(offset) / 60;
    const sign = offset < 0 ? '-' : '+';
    return `${clock}${sign}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** The three event states the file may name, and nothing when it named something else. */
function statusOf(value: unknown): CalendarEventStatus | undefined {
    const status = typeof value === 'string' ? value.toLowerCase() : '';
    return status === 'confirmed' || status === 'tentative' || status === 'cancelled'
        ? status
        : undefined;
}

/** A text property of a component, or undefined when it has none or it is empty. */
function text(component: ICAL.Component, name: string): string | undefined {
    const value = component.getFirstPropertyValue(name);
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Whether an occurrence from `start` to `end` falls inside the window at all: it starts before the
 * window ends and ends after it starts, or, taking no time, starts inside it.
 */
function inside(start: ICAL.Time, end: ICAL.Time, window: Window): boolean {
    const from = start.toJSDate().getTime();
    const to = Math.max(from, end.toJSDate().getTime());
    if (from >= window.end.getTime()) return false;
    return to === from ? from >= window.start.getTime() : to > window.start.getTime();
}

/** The name of the file's one calendar: the name the file gives it, or the account's label. */
function calendarName(root: ICAL.Component, label: string): string {
    return text(root, 'x-wr-calname') ?? label;
}

/** One occurrence in the payload's shape, read from the component that describes it. */
function eventOf(
    args: IcsArgs,
    calendar: string,
    id: string,
    item: ICAL.Event,
    start: ICAL.Time,
    end: ICAL.Time
): CalendarEvent {
    const component = item.component;
    const location = text(component, 'location');
    const link = httpsLink(text(component, 'url'));
    const status = statusOf(component.getFirstPropertyValue('status'));
    return {
        id,
        account: args.label,
        calendar,
        title: text(component, 'summary') ?? '',
        start: stamp(start),
        end: stamp(end),
        allDay: start.isDate,
        ...(location === undefined ? {} : { location }),
        ...(link === undefined ? {} : { link }),
        ...(status === undefined ? {} : { status })
    };
}

/**
 * The calendar of one published file and every event of it inside the window, in the file's order.
 * A text that is not a calendar throws, with a message that carries none of the text.
 */
export function readIcsText(body: string, args: IcsArgs): Reading {
    let root: ICAL.Component;
    try {
        root = new ICAL.Component(ICAL.parse(body) as unknown[]);
    } catch {
        throw new Error('ics: the answer is not a calendar');
    }
    if (root.name !== 'vcalendar') throw new Error('ics: the answer is not a calendar');
    const calendar = calendarName(root, args.label);
    const components = root.getAllSubcomponents('vevent');
    const moved = components.filter((one) => one.hasProperty('recurrence-id'));
    const masters = new Set(
        components.filter((one) => !one.hasProperty('recurrence-id')).map((one) => text(one, 'uid'))
    );
    const events: CalendarEvent[] = [];
    components.forEach((component, index) => {
        const uid = text(component, 'uid') ?? String(index);
        const exception = component.hasProperty('recurrence-id');
        // An occurrence moved from a series is read from the series; one whose series is not in
        // the file is an event of its own.
        if (exception && masters.has(text(component, 'uid'))) return;
        const event = new ICAL.Event(component, {
            strictExceptions: true,
            exceptions: exception
                ? []
                : moved.filter((one) => text(one, 'uid') === text(component, 'uid'))
        });
        const base = `${args.key}-${CALENDAR_ID}-${uid}`;
        if (!event.isRecurring()) {
            const id = exception ? `${base}-${event.recurrenceId.toString()}` : base;
            if (inside(event.startDate, event.endDate, args.window)) {
                events.push(eventOf(args, calendar, id, event, event.startDate, event.endDate));
            }
            return;
        }
        const steps = event.iterator();
        for (let step = 0; step < MAX_STEPS; step += 1) {
            // Once the series has ended, `next` gives nothing and the expansion says it is
            // complete.
            const next = steps.next();
            if (steps.complete) return;
            if (next.toJSDate().getTime() >= args.window.end.getTime()) return;
            const details = event.getOccurrenceDetails(next);
            if (!inside(details.startDate, details.endDate, args.window)) continue;
            events.push(
                eventOf(
                    args,
                    calendar,
                    `${base}-${next.toString()}`,
                    details.item,
                    details.startDate,
                    details.endDate
                )
            );
        }
    });
    return { calendars: [{ id: CALENDAR_ID, name: calendar }], events };
}

/**
 * One published link read over the window. A refused answer, a failed fetch or a text that is not a
 * calendar throws; the message of what this module throws names neither the link nor the file.
 */
export async function readIcs(
    link: string,
    args: IcsArgs & { fetcher: Fetcher }
): Promise<Reading> {
    const response = await args.fetcher(icsAddress(link), {
        headers: { accept: 'text/calendar' }
    });
    if (!response.ok) throw new Error(`ics: ${response.status}`);
    return readIcsText(await response.text(), args);
}
