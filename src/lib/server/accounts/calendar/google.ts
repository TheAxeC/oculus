// Layer 2, server. One account's Google calendars and their events over the window, read-only.
//
// Two calls per account plus one per calendar: `calendarList` for the calendars the reader has
// selected in Google's own interface, then `events` on each of them with `singleEvents=true`, so a
// recurring series arrives as the instances inside the window rather than as a rule this code would
// have to expand. `nextPageToken` is followed until it stops or PAGE_MAX pages have been read.
//
// A time comes back as Google wrote it: `start.dateTime` carries the event's own offset and
// `start.date` is an all-day event's date. Both go into the payload unchanged, and `allDay` says
// which one a reader is looking at.

import { z } from 'zod';
import type {
    CalendarEvent,
    CalendarEventStatus,
    CalendarListEntry
} from '../../../data/model/index.ts';
import { getJson, httpsLink, PAGE_MAX, rowsOf, type ReadArgs, type Reading } from './api.ts';

const BASE = 'https://www.googleapis.com/calendar/v3';

/** How many events one page asks for; a calendar with more is followed by its page token. */
const PER_PAGE = 250;

/** A field of Google's answer that is text where it is there, and read as absent otherwise. */
const optionalTextShape = z.string().optional().catch(undefined);

/** The token of the next page: text where the answer names one, and nothing otherwise. */
const pageTokenShape = z.string();

/** A calendar of the list the reader selected: Google's id for it, and its name when it has one. */
const calendarRowShape = z.object({
    selected: z.literal(true),
    id: z.string(),
    summary: optionalTextShape
});

/** Google's three event states, and nothing when it named something else. */
const statusShape = z
    .enum(['confirmed', 'tentative', 'cancelled'])
    .optional()
    .catch(undefined) satisfies z.ZodType<CalendarEventStatus | undefined>;

/**
 * One end of an event: the timed value with its own offset when there is one, else the date of an
 * all-day event, else null for an end that names neither or is no map.
 */
const edgeShape = z
    .object({ dateTime: optionalTextShape, date: optionalTextShape })
    .transform((held): { at: string; allDay: boolean } | null => {
        if (held.dateTime !== undefined) return { at: held.dateTime, allDay: false };
        return held.date === undefined ? null : { at: held.date, allDay: true };
    })
    .catch(null);

/** The fields of an event this reader carries; an event with no id has no key and is left out. */
const eventRowShape = z.object({
    id: z.string(),
    summary: optionalTextShape,
    location: optionalTextShape,
    htmlLink: optionalTextShape,
    status: statusShape,
    start: edgeShape,
    end: edgeShape
});

/** Read one listing to its end, following `nextPageToken`. */
async function paged(
    args: ReadArgs,
    url: (pageToken: string) => string
): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    let pageToken = '';
    for (let page = 0; page < PAGE_MAX; page += 1) {
        const body = await getJson('google', url(pageToken), args);
        rows.push(...rowsOf(body, 'items'));
        const next = pageTokenShape.safeParse(body.nextPageToken);
        if (!next.success) return rows;
        pageToken = next.data;
    }
    return rows;
}

/** The calendars the reader has selected, which is what Google draws in its own week view. */
async function calendars(args: ReadArgs): Promise<CalendarListEntry[]> {
    const rows = await paged(args, (pageToken) => {
        const url = new URL(`${BASE}/users/me/calendarList`);
        if (pageToken !== '') url.searchParams.set('pageToken', pageToken);
        return url.toString();
    });
    const found: CalendarListEntry[] = [];
    for (const row of rows) {
        const calendar = calendarRowShape.safeParse(row);
        if (!calendar.success) continue;
        const { id, summary } = calendar.data;
        found.push({ id, name: summary ?? id });
    }
    return found;
}

/** One calendar's events inside the window, in the order Google sorted them. */
async function events(args: ReadArgs, calendar: CalendarListEntry): Promise<CalendarEvent[]> {
    const rows = await paged(args, (pageToken) => {
        const url = new URL(`${BASE}/calendars/${encodeURIComponent(calendar.id)}/events`);
        url.searchParams.set('singleEvents', 'true');
        url.searchParams.set('orderBy', 'startTime');
        url.searchParams.set('timeMin', args.window.start.toISOString());
        url.searchParams.set('timeMax', args.window.end.toISOString());
        url.searchParams.set('maxResults', String(PER_PAGE));
        if (pageToken !== '') url.searchParams.set('pageToken', pageToken);
        return url.toString();
    });
    const found: CalendarEvent[] = [];
    for (const item of rows) {
        const row = eventRowShape.safeParse(item);
        if (!row.success) continue;
        const { id, start, end, location, status } = row.data;
        if (start === null || end === null) continue;
        const link = httpsLink(row.data.htmlLink);
        found.push({
            id: `${args.key}-${calendar.id}-${id}`,
            account: args.label,
            calendar: calendar.name,
            title: row.data.summary ?? '',
            start: start.at,
            end: end.at,
            allDay: start.allDay,
            ...(location === undefined ? {} : { location }),
            ...(link === undefined ? {} : { link }),
            ...(status === undefined ? {} : { status })
        });
    }
    return found;
}

/** One account's calendars and every event of theirs inside the window. */
export async function readGoogle(args: ReadArgs): Promise<Reading> {
    const found = await calendars(args);
    const all: CalendarEvent[] = [];
    for (const calendar of found) all.push(...(await events(args, calendar)));
    return { calendars: found, events: all };
}
