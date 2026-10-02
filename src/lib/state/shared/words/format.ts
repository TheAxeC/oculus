// Layer 2, client state. The small conversions the views share: a count in three digits, a count
// with its thousands grouped, a stamp a rail row has room for, a span in seconds, a model's short
// name, and a path relative to a workspace. No runes here, so every one of them is a pure function
// over its arguments and is tested directly.
//
// The words come from the catalog like every other word: a suffix and a separator are strings a
// reader sees, so they are keys rather than literals. What is left in a function is arithmetic and
// slicing.

import { scalar } from '../../../data/helpers/guards.ts';
import { t } from './text.ts';

/** Seconds a span is written in whole seconds up to; longer reads as minutes and seconds. */
const MINUTE = 60;

function pad(value: number): string {
    return value < 10 ? `0${value}` : String(value);
}

/** A date from an ISO stamp, or null when there is nothing to read. */
function dateOf(iso: string | null | undefined): Date | null {
    if (iso === null || iso === undefined || iso === '') return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A token count in three digits or so: `1.9M`, `84k`, `512`. Ten million and above loses the
 * decimal, since the digit says nothing at that size and the column is narrow.
 */
export function compactCount(value: number): string {
    const count = Number.isFinite(value) ? value : 0;
    if (count >= 1000000) {
        const millions = (count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(/\.0$/, '');
        return t('sessions.n_millions', millions);
    }
    if (count >= 1000) return t('sessions.n_thousands', String(Math.round(count / 1000)));
    return String(Math.round(count));
}

/**
 * A whole count with its thousands grouped, `1,234,567`, for a column of counts a reader compares
 * digit by digit. The separator is the catalog's, like every other character a reader sees. The
 * caller hands a whole number: the line store refuses any other before it reaches a view.
 */
export function grouped(value: number): string {
    const digits = String(Math.abs(value)).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        t('app.thousands_separator')
    );
    return value < 0 ? `-${digits}` : digits;
}

/**
 * When something happened, as a row shows it: the clock alone for today, and the date before it for
 * any earlier day. `now` is passed in rather than read, so a test states what day it is.
 */
export function stamp(iso: string | null | undefined, now: number = Date.now()): string {
    const date = dateOf(iso);
    if (date === null) return '';
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const today = new Date(now);
    if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    ) {
        return time;
    }
    const day = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return t('sessions.stamp_day', day, time);
}

/** The clock alone, whatever day the stamp is from: what a timeline row carries. */
export function clock(iso: string | null | undefined): string {
    const date = dateOf(iso);
    if (date === null) return '';
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Whole seconds between two stamps, with `now` standing in for an end that has not happened yet,
 * which is how a running agent reports what it is at. Null when either end cannot be read, and null
 * when the end is before the start: a negative span is a clock that was wound back, not a duration.
 */
export function seconds(
    start: string | null | undefined,
    end: string | null | undefined,
    now: number = Date.now()
): number | null {
    const from = dateOf(start);
    if (from === null) return null;
    const held = dateOf(end);
    const to = end === null || end === undefined || end === '' ? now : held?.getTime();
    if (to === undefined || to < from.getTime()) return null;
    return Math.round((to - from.getTime()) / 1000);
}

/** A span in the two forms a row has room for: `N s` under a minute, `Mm SSs` above it. */
export function span(total: number): string {
    const whole = Math.max(0, Math.round(total));
    if (whole < MINUTE) return t('sessions.ag_secs', String(whole));
    return t('sessions.ag_mins', String(Math.floor(whole / MINUTE)), pad(whole % MINUTE));
}

/** `claude-opus-5` reads as `opus-5`, which is what a narrow rail has room for. */
export function modelShort(name: unknown): string {
    return scalar(name).replace(/^claude-/, '');
}

/** A path inside a workspace, written relative to it; anything else is left as it is. */
export function relativeTo(path: unknown, workspace: unknown) {
    const text = scalar(path);
    const root = scalar(workspace);
    return root !== '' && text.startsWith(`${root}/`) ? text.slice(root.length + 1) : text;
}
