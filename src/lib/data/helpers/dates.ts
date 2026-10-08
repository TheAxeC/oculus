// Layer 1, data. Pure calendar-date formatting shared by client state and server writes: the shape
// of a calendar day as the hub's files write it, a moment's local calendar day, and how long ago a
// stamp was as a count of one unit.
// Local getters keep "today" on the machine's calendar around midnight in non-UTC timezones.
//
// The session list and the Repositories blame both say how long ago something happened, in words
// of their own, from the one count here, so the two never disagree about what "now" or "2 weeks"
// is: each asks for the largest unit its words go up to and words the count itself.

/** The one shape a `date` field is written in: four digits, two and two, joined by dashes. */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar date at one moment, as YYYY-MM-DD, from a Unix timestamp or a Date. */
export function localDate(now: number | Date): string {
    const date = new Date(now);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** The units a relative time is counted in, smallest first after `now`. */
export type AgoUnit = 'now' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

/** How long ago a stamp was: the unit and the whole count of it. */
export type Ago = { unit: AgoUnit; count: number };

/** Each unit above `now` and its length in seconds: a week is 7 days, a month 30, a year 365. */
const UNITS: readonly { unit: Exclude<AgoUnit, 'now'>; seconds: number }[] = [
    { unit: 'minute', seconds: 60 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'week', seconds: 7 * 86_400 },
    { unit: 'month', seconds: 30 * 86_400 },
    { unit: 'year', seconds: 365 * 86_400 }
];

/** How far ahead of the clock a stamp may be and still read as now, for a clock a little behind. */
const AHEAD_SECONDS = 60;

/**
 * How long ago a stamp was, in the largest unit that is at least one and not above `largest`:
 * `now` under a minute, a stamp up to a minute in the future included. Null for a stamp that
 * cannot be read or lies more than a minute in the future.
 */
export function ago(iso: string | null, now: number, largest: Exclude<AgoUnit, 'now'>): Ago | null {
    if (iso === null || iso === '') return null;
    const at = Date.parse(iso);
    if (Number.isNaN(at)) return null;
    const seconds = Math.round((now - at) / 1000);
    if (seconds < -AHEAD_SECONDS) return null;
    let found: Ago = { unit: 'now', count: 0 };
    for (const { unit, seconds: length } of UNITS) {
        if (seconds >= length) found = { unit, count: Math.floor(seconds / length) };
        if (unit === largest) break;
    }
    return found;
}
