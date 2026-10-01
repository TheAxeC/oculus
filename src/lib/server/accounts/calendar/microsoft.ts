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

import { z } from 'zod';
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

/** A field of Graph's answer that is text where it is there, and read as absent otherwise. */
const optionalTextShape = z.string().optional().catch(undefined);

/** The link of the next page: text where the answer names one, and nothing otherwise. */
const nextLinkShape = z.string();

/** A calendar of the account: Graph's id for it, and its name when it has one. */
const calendarRowShape = z.object({ id: z.string(), name: optionalTextShape });

/** One end of an event: the wall clock Graph wrote, when the end is a map that holds one. */
const edgeShape = z
    .object({ dateTime: z.string() })
    .transform((held) => held.dateTime)
    .optional()
    .catch(undefined);

/**
 * The fields of an event this reader carries. A flag that is not a boolean reads as unset and a
 * `showAs` that is not text as empty; an event with no id has no key and is left out.
 */
const eventRowShape = z.object({
    id: z.string(),
    subject: optionalTextShape,
    webLink: optionalTextShape,
    isAllDay: z.boolean().catch(false),
    isCancelled: z.boolean().catch(false),
    showAs: z.string().catch(''),
    location: z.object({ displayName: optionalTextShape }).optional().catch(undefined),
    start: edgeShape,
    end: edgeShape
});

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
        const next = nextLinkShape.safeParse(body['@odata.nextLink']);
        if (!next.success) return rows;
        url = next.data;
    }
    return rows;
}

/** Every calendar of the account. */
async function calendars(args: ReadArgs): Promise<CalendarListEntry[]> {
    const url = new URL(`${BASE}/me/calendars`);
    url.searchParams.set('$top', String(PER_PAGE));
    const found: CalendarListEntry[] = [];
    for (const row of await paged(args, url.toString())) {
        const calendar = calendarRowShape.safeParse(row);
        if (!calendar.success) continue;
        const { id, name } = calendar.data;
        found.push({ id, name: name ?? id });
    }
    return found;
}

/** Graph says cancelled with a flag and tentative with `showAs`, so the two are read separately. */
function statusOf(cancelled: boolean, showAs: string): CalendarEventStatus {
    if (cancelled) return 'cancelled';
    if (showAs === 'tentative') return 'tentative';
    return 'confirmed';
}

/**
 * One end of an event. Graph writes the clock with seven decimal places, so the fraction is cut to
 * nothing and the value stays a wall clock with no zone designator; an all-day event keeps the date
 * alone, since its clock is always midnight and the day is the whole of what it says.
 */
function edge(at: string | undefined, allDay: boolean): string | null {
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
    for (const item of await paged(args, url.toString())) {
        const parsed = eventRowShape.safeParse(item);
        if (!parsed.success) continue;
        const row = parsed.data;
        const allDay = row.isAllDay;
        const start = edge(row.start, allDay);
        const end = edge(row.end, allDay);
        if (start === null || end === null) continue;
        const place = row.location?.displayName;
        const link = httpsLink(row.webLink);
        found.push({
            id: `${args.key}-${calendar.id}-${row.id}`,
            account: args.label,
            calendar: calendar.name,
            title: row.subject ?? '',
            start,
            end,
            allDay,
            ...(place === undefined || place === '' ? {} : { location: place }),
            ...(link === undefined ? {} : { link }),
            status: statusOf(row.isCancelled, row.showAs)
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
