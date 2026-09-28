// Layer 2, server. What the two calendar readers share: the window they are asked for and the shape
// they answer with.
//
// The calls themselves are the connector's, in server/accounts/connect/api.ts, since the mail
// readers make the same authenticated GET and answer a refusal with the same line; what is here is
// the calendar's own half of that pairing.

import type { CalendarEvent, CalendarListEntry } from '../../../data/model/index.ts';
import type { Fetcher } from '../connect/oauth.ts';

export { getJson, httpsLink, PAGE_MAX, rowsOf } from '../connect/api.ts';

/** The span a calendar is read over, from `days_back` before now to `days_ahead` after it. */
export type Window = { start: Date; end: Date };

/** What one account's read answers with. */
export type Reading = { calendars: CalendarListEntry[]; events: CalendarEvent[] };

/** Everything a provider reader is given: one access token, one account label, one window. */
export type ReadArgs = {
    token: string;
    /** The account's key, which prefixes every event id so two accounts cannot collide. */
    key: string;
    /** The account's label, which names the account an event was read from. */
    label: string;
    window: Window;
    fetcher: Fetcher;
};
