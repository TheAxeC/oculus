// Layer 1, data. Pure calendar-date formatting shared by client state and server writes: the shape
// of a calendar day as the hub's files write it, the reader and the order of a period, a moment's
// local calendar day, and how long ago a stamp was as a count of one unit.
// Local getters keep "today" on the machine's calendar around midnight in non-UTC timezones.
//
// A period is the value of a `period` field: the Library of Congress's EDTF (ISO 8601-2:2019) at
// level 0, plus level 1's open end `..`. A date is `YYYY`, `YYYY-MM` or `YYYY-MM-DD`; a date-time
// is a day with `THH:MM:SS` and an optional `Z` or `+HH:MM` zone, and stands alone; a span is two
// dates joined by `/`, the second not before the first, or a date and `/..`. A whole number of four
// digits is the year YAML reads `when: 2025` as. The schema check, the editors, the card sort, the
// radar and the CV builder all read a period here, so no two of them disagree about one.
//
// The session list and the Repositories blame both say how long ago something happened, in words
// of their own, from the one count here, so the two never disagree about what "now" or "2 weeks"
// is: each asks for the largest unit its words go up to and words the count itself.

/** The one shape a `date` field is written in: four digits, two and two, joined by dashes. */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** How much of a date a period's end names. */
type PeriodPrecision = 'year' | 'month' | 'day' | 'time';

/** One end of a period: how precise it is, and the first and last day it covers, as YYYY-MM-DD. */
export type PeriodPoint = {
    precision: PeriodPrecision;
    year: number;
    /** The month, 1 to 12, at month precision or finer. */
    month?: number;
    first: string;
    last: string;
};

/** A period read: its start, and its end, which is the start for one date and null when open. */
export type Period = { start: PeriodPoint; end: PeriodPoint | null };

const YEAR = String.raw`\d{4}`;
const MONTH = String.raw`(?:0[1-9]|1[0-2])`;
const DAY = String.raw`(?:0[1-9]|[12]\d|3[01])`;
const HOUR = String.raw`(?:[01]\d|2[0-3])`;
const SIXTY = String.raw`[0-5]\d`;
const DATE = `${YEAR}(?:-${MONTH}(?:-${DAY})?)?`;
const TIME = `T${HOUR}:${SIXTY}:${SIXTY}(?:Z|[+-]${HOUR}:${SIXTY})?`;

/**
 * The form of a period's text, without the calendar or a span's order: the schema's mark for an
 * editor, which the reader then holds to the calendar.
 */
export const PERIOD_FORM = new RegExp(
    `^(?:${DATE}(?:/(?:${DATE}|\\.\\.))?|${YEAR}-${MONTH}-${DAY}${TIME})$`
);

const DATE_PARTS = new RegExp(`^(${YEAR})(?:-(${MONTH})(?:-(${DAY}))?)?$`);
const TIME_PARTS = new RegExp(`^(${YEAR})-(${MONTH})-(${DAY})${TIME}$`);

/** The number of days of a month, the month 1 to 12. */
function daysIn(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** A day as YYYY-MM-DD. */
function dayText(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** One date or date-time of a period, or null when it is no day of the calendar. */
function readPoint(text: string, timed: boolean): PeriodPoint | null {
    const parts = (timed ? TIME_PARTS : DATE_PARTS).exec(text);
    if (parts === null) return null;
    const year = Number(parts.at(1));
    const [monthText, dayPart] = [parts.at(2), parts.at(3)];
    if (monthText === undefined) {
        return { precision: 'year', year, first: `${year}-01-01`, last: `${year}-12-31` };
    }
    const month = Number(monthText);
    const days = daysIn(year, month);
    if (dayPart === undefined) {
        const [first, last] = [dayText(year, month, 1), dayText(year, month, days)];
        return { precision: 'month', year, month, first, last };
    }
    const day = Number(dayPart);
    if (day > days) return null;
    const precision = timed ? 'time' : 'day';
    const first = dayText(year, month, day);
    return { precision, year, month, first, last: first };
}

/**
 * A period read from a field's value, or null for a value that is no period: a text in the form
 * above, or a whole number from 1000 to 9999 as its year.
 */
export function readPeriod(value: unknown): Period | null {
    if (typeof value === 'number') {
        if (!Number.isInteger(value) || value < 1000 || value > 9999) return null;
        const start = readPoint(String(value), false);
        return start === null ? null : { start, end: start };
    }
    if (typeof value !== 'string' || !PERIOD_FORM.test(value)) return null;
    if (value.includes('T')) {
        const start = readPoint(value, true);
        return start === null ? null : { start, end: start };
    }
    const ends = value.split('/');
    const start = readPoint(ends[0], false);
    const to = ends.at(1);
    if (start === null) return null;
    if (to === undefined) return { start, end: start };
    if (to === '..') return { start, end: null };
    const end = readPoint(to, false);
    if (end === null || end.last < start.first) return null;
    return { start, end };
}

/** The last day an end covers, an open end later than every day. */
function lastDay(period: Period): string {
    return period.end === null ? '9999-99-99' : period.end.last;
}

/**
 * The order of two periods, newest first: the later first day of the start comes first, then the
 * later last day of the end, an open end latest. Negative when `a` comes before `b`.
 */
function periodOrder(a: Period, b: Period): number {
    if (a.start.first !== b.start.first) return a.start.first > b.start.first ? -1 : 1;
    const [endA, endB] = [lastDay(a), lastDay(b)];
    if (endA === endB) return 0;
    return endA > endB ? -1 : 1;
}

/** Whether a field's value counts as none: absent, null or an empty text. */
function noValue(value: unknown): boolean {
    return value === undefined || value === null || value === '';
}

/**
 * The order of two values of a `period` field: the periods newest first, then the values the
 * reader refuses, then no value. Negative when `a` comes before `b`; zero keeps the input order.
 */
export function periodValueOrder(a: unknown, b: unknown): number {
    const rank = (value: unknown, read: Period | null): number => {
        if (read !== null) return 0;
        return noValue(value) ? 2 : 1;
    };
    const [readA, readB] = [readPeriod(a), readPeriod(b)];
    const [rankA, rankB] = [rank(a, readA), rank(b, readB)];
    if (rankA !== rankB) return rankA - rankB;
    return readA !== null && readB !== null ? periodOrder(readA, readB) : 0;
}

/** The year a period starts in, or undefined for a value that is no period. */
export function periodYear(value: unknown): number | undefined {
    return readPeriod(value)?.start.year;
}

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
