// Layer 2, server. What the two provider readers share: the window they are asked for, the shape
// they answer with, and the one authenticated GET both of them page through.
//
// It exists so the refusal sentence is written once. Both providers answer a refusal as JSON with a
// code in it, and the line the view shows is the status and that code alone: a provider's body can
// carry the account's own address and the calendar's name, and none of that belongs on a page or in
// a log.

import { isMap, str } from '../../data/guards.ts';
import type { CalendarEvent, CalendarListEntry, CalendarProvider } from '../../data/model.ts';
import type { Fetcher } from './oauth.ts';

/** The span an agenda is read over, from `days_back` before now to `days_ahead` after it. */
export type Window = { start: Date; end: Date };

/** What one account's read answers with. */
export type Reading = { calendars: CalendarListEntry[]; events: CalendarEvent[] };

/** Everything a provider reader is given: one access token, one account label, one window. */
export type ReadArgs = {
    token: string;
    /** The account's key, which prefixes every event id so two accounts cannot collide. */
    key: string;
    /** The account's label, which is the tag the agenda draws on each line. */
    label: string;
    window: Window;
    fetcher: Fetcher;
};

/**
 * The error code a provider put in its refusal, or nothing when it put none there. Google names it
 * `status` and repeats the HTTP status under `code`; Microsoft names it `code`. A numeric code is
 * left out, since it says no more than the status the line already carries.
 */
function codeOf(body: unknown): string {
    if (!isMap(body)) return '';
    const error = body.error;
    if (typeof error === 'string') return error;
    if (isMap(error)) return str(error.status) ?? str(error.code) ?? '';
    return '';
}

/**
 * One authenticated GET, answered as a parsed object. A refused call throws the one line the view
 * shows: the provider, the status and the provider's own code.
 *
 * An answer this cannot read is a refusal too, whatever its status: a 2xx whose body is not JSON, or
 * is JSON that is not an object, tells nothing about the account's calendars, and reading it as an
 * empty answer would mark the account connected and replace its last good rows with nothing.
 */
export async function getJson(
    provider: CalendarProvider,
    url: string,
    args: { token: string; fetcher: Fetcher; headers?: Record<string, string> }
): Promise<Record<string, unknown>> {
    const response = await args.fetcher(url, {
        headers: { authorization: `Bearer ${args.token}`, ...(args.headers ?? {}) }
    });
    let body: unknown = null;
    let read = true;
    try {
        body = await response.json();
    } catch {
        read = false;
    }
    if (!response.ok) {
        const code = codeOf(body);
        throw new Error(`${provider}: ${response.status}${code === '' ? '' : ` ${code}`}`);
    }
    if (!read || !isMap(body)) {
        throw new Error(`${provider}: ${response.status} unreadable answer`);
    }
    return body;
}

/** The rows of a paged answer, under the key the provider lists them at. */
export function rowsOf(body: Record<string, unknown>, key: string): Record<string, unknown>[] {
    const held = body[key];
    return Array.isArray(held) ? held.filter(isMap) : [];
}

/** How many pages one listing is followed over, so a wrong answer cannot loop for ever. */
export const PAGE_MAX = 20;

/**
 * A provider's page for an event, and nothing when what it gave is not an `https` address. The link
 * is the one field of a provider's answer that the operating system is later asked to open, so a
 * scheme that is not `https` is dropped here rather than carried into a payload.
 */
export function httpsLink(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    try {
        return new URL(value).protocol === 'https:' ? value : undefined;
    } catch {
        return undefined;
    }
}
