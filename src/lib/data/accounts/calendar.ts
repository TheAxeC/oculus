// Layer 1, data. How a calendar account is named, once, for every reader of that name.
//
// The rule has readers on both sides: the server builds the credential file's name from it
// (server/accounts/connect/store.ts) and matches the account a connect request names
// (server/accounts/calendar/ routes.ts), and the page sends that same name from the Calendar view's
// Connect control. A copy on each side would let them disagree about what an account is called.
//
// The rule itself is the connector's shared one in data/accounts/connect.ts, since the mail
// connector names its accounts the same way; this module is the calendar's name for it.
//
// The calendar's own rule is here too: what a published link must look like before it is written,
// which the page checks before it sends and the server checks when it receives, so a link the
// server keeps is one the poller can fetch. A plain `http://` link is refused, since the file it
// names travels in the clear; `webcal://` is the same address read over https.

import { connectKey } from './connect.ts';
import type { CalendarAccountConfig } from '../model/model-calendar.ts';

/** How an account is named in its credential file, on the wire and in a payload's event rows. */
export function calendarKey(account: CalendarAccountConfig): string {
    return connectKey(account);
}

/** A published link as a reader pastes it: the scheme, then an address with no space in it. */
const PUBLISHED_LINK = /^(?:https|webcal):\/\/\S+$/i;

/**
 * The published link a field holds, with its surrounding space taken off, or null when it is
 * missing or does not start `https://` or `webcal://` and name a host.
 */
export function publishedLink(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const link = value.trim();
    if (!PUBLISHED_LINK.test(link)) return null;
    try {
        return new URL(link.replace(/^webcal:/i, 'https:')).hostname === '' ? null : link;
    } catch {
        return null;
    }
}
