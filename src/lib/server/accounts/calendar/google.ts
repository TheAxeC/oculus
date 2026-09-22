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

import { isMap, str } from '../../../data/helpers/guards.ts';
import type { CalendarEvent, CalendarEventStatus, CalendarListEntry } from '../../../data/model.ts';
import { getJson, httpsLink, PAGE_MAX, rowsOf, type ReadArgs, type Reading } from './api.ts';

const BASE = 'https://www.googleapis.com/calendar/v3';

/** How many events one page asks for; a calendar with more is followed by its page token. */
const PER_PAGE = 250;

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
        const next = str(body.nextPageToken);
        if (next === undefined) return rows;
        pageToken = next;
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
        if (row.selected !== true) continue;
        const id = str(row.id);
        if (id === undefined) continue;
        found.push({ id, name: str(row.summary) ?? id });
    }
    return found;
}

/** Google's three event states, and nothing when it named something else. */
function statusOf(value: unknown): CalendarEventStatus | undefined {
    return value === 'confirmed' || value === 'tentative' || value === 'cancelled'
        ? value
        : undefined;
}

/** One end of an event: the date of an all-day event, or the timed value with its own offset. */
function edge(value: unknown): { at: string; allDay: boolean } | null {
    if (!isMap(value)) return null;
    const timed = str(value.dateTime);
    if (timed !== undefined) return { at: timed, allDay: false };
    const date = str(value.date);
    return date === undefined ? null : { at: date, allDay: true };
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
    for (const row of rows) {
        const id = str(row.id);
        const start = edge(row.start);
        const end = edge(row.end);
        if (id === undefined || start === null || end === null) continue;
        const location = str(row.location);
        const link = httpsLink(str(row.htmlLink));
        const status = statusOf(row.status);
        found.push({
            id: `${args.key}-${calendar.id}-${id}`,
            account: args.label,
            calendar: calendar.name,
            title: str(row.summary) ?? '',
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
