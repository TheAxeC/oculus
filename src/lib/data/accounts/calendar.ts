// Layer 1, data. How a calendar account is named, once, for every reader of that name.
//
// The rule has readers on both sides: the server builds the credential file's name from it
// (server/accounts/connect/store.ts) and matches the account a connect request names
// (server/accounts/calendar/ routes.ts), and the page sends that same name from the Calendar view's
// Connect control. A copy on each side would let them disagree about what an account is called.
//
// The rule itself is the connector's shared one in data/accounts/connect.ts, since the mail
// connector names its accounts the same way; this module is the calendar's name for it.

import { connectKey } from './connect.ts';
import type { CalendarAccountConfig } from '../model/model-calendar.ts';

/** How an account is named in its credential file, on the wire and in a payload's event rows. */
export function calendarKey(account: CalendarAccountConfig): string {
    return connectKey(account);
}
