// Layer 2, server. One account's Microsoft calendars and their events over the window, read-only.
//
// Two calls per account plus one per calendar: `/me/calendars`, then `calendarView` on each with
// the window as its two parameters, which is the call that expands a recurring series into the
// instances inside the window. `@odata.nextLink` is followed until it stops or PAGE_MAX pages have
// been read.
//
// Graph answers a time as a wall clock with no offset, in whatever zone the request asked for, so
// the request asks for this machine's own zone: the server and the page are the same machine, and a
// string with no offset is read by the page in that same zone. Asking for UTC instead would move an
// all-day event onto the wrong day for every reader who is not on UTC, since Graph returns an
// all-day event as midnight in the zone it was asked for. An all-day event therefore keeps its date
// alone, which is the form Google's all-day events arrive in as well.

import { isMap, str } from '../../../data/helpers/guards.ts';
import type {
    CalendarEvent,
    CalendarEventStatus,
    CalendarListEntry
} from '../../../data/model/index.ts';
import { getJson, httpsLink, PAGE_MAX, rowsOf, type ReadArgs, type Reading } from './api.ts';

const BASE = 'https://graph.microsoft.com/v1.0';

/** How many rows one page asks for; a calendar with more is followed by its next link. */
const PER_PAGE = 250;

/** The zone Graph is asked to answer in, which is the zone the page draws in. */
export function hostZone(): string {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone === '' ? 'UTC' : zone;
}

/** Read one listing to its end, following `@odata.nextLink`. */
async function paged(args: ReadArgs, first: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    let url = first;
    for (let page = 0; page < PAGE_MAX; page += 1) {
        const body = await getJson('microsoft', url, {
            ...args,
            headers: { prefer: `outlook.timezone="${hostZone()}"` }
        });
        rows.push(...rowsOf(body, 'value'));
        const next = str(body['@odata.nextLink']);
        if (next === undefined) return rows;
        url = next;
    }
    return rows;
}

/** Every calendar of the account. */
async function calendars(args: ReadArgs): Promise<CalendarListEntry[]> {
    const url = new URL(`${BASE}/me/calendars`);
    url.searchParams.set('$top', String(PER_PAGE));
    const found: CalendarListEntry[] = [];
    for (const row of await paged(args, url.toString())) {
        const id = str(row.id);
        if (id === undefined) continue;
        found.push({ id, name: str(row.name) ?? id });
    }
    return found;
}

/** Graph says cancelled with a flag and tentative with `showAs`, so the two are read separately. */
function statusOf(row: Record<string, unknown>): CalendarEventStatus | undefined {
    if (row.isCancelled === true) return 'cancelled';
    if (row.showAs === 'tentative') return 'tentative';
    return 'confirmed';
}

/**
 * One end of an event. Graph writes the clock with seven decimal places, so the fraction is cut to
 * nothing and the value stays a wall clock with no zone designator; an all-day event keeps the date
 * alone, since its clock is always midnight and the day is the whole of what it says.
 */
function edge(value: unknown, allDay: boolean): string | null {
    if (!isMap(value)) return null;
    const at = str(value.dateTime);
    if (at === undefined) return null;
    const plain = at.replace(/\.\d+$/, '');
    return allDay ? plain.slice(0, 10) : plain;
}

/** One calendar's events inside the window. */
async function events(args: ReadArgs, calendar: CalendarListEntry): Promise<CalendarEvent[]> {
    const url = new URL(`${BASE}/me/calendars/${encodeURIComponent(calendar.id)}/calendarView`);
    url.searchParams.set('startDateTime', args.window.start.toISOString());
    url.searchParams.set('endDateTime', args.window.end.toISOString());
    url.searchParams.set('$top', String(PER_PAGE));
    url.searchParams.set('$orderby', 'start/dateTime');
    const found: CalendarEvent[] = [];
    for (const row of await paged(args, url.toString())) {
        const id = str(row.id);
        const allDay = row.isAllDay === true;
        const start = edge(row.start, allDay);
        const end = edge(row.end, allDay);
        if (id === undefined || start === null || end === null) continue;
        const place = isMap(row.location) ? str(row.location.displayName) : undefined;
        const link = httpsLink(str(row.webLink));
        found.push({
            id: `${args.key}-${calendar.id}-${id}`,
            account: args.label,
            calendar: calendar.name,
            title: str(row.subject) ?? '',
            start,
            end,
            allDay,
            ...(place === undefined || place === '' ? {} : { location: place }),
            ...(link === undefined ? {} : { link }),
            status: statusOf(row)
        });
    }
    return found;
}

/** One account's calendars and every event of theirs inside the window. */
export async function readMicrosoft(args: ReadArgs): Promise<Reading> {
    const found = await calendars(args);
    const all: CalendarEvent[] = [];
    for (const calendar of found) all.push(...(await events(args, calendar)));
    return { calendars: found, events: all };
}
