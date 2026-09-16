// Layer 1, data. How a connector account is named, once, for every reader of that name.
//
// The rule has readers on both sides: the server builds the credential file's name from it and
// matches the account a connect request names, and the page sends that same name from the Connect
// control of the Calendar and the Inbox. A copy on each side would let them disagree about what an
// account is called.
//
// Pure: no I/O and no path module. The label's allowed characters are checked where the machine's
// own configuration is read, so a key is always a safe file name by the time it reaches a join.

import type { ConnectAccountConfig } from './model-connect.ts';

/** How an account is named in its credential file, on the wire and in a payload's rows. */
export function connectKey(account: ConnectAccountConfig): string {
    return `${account.provider}-${account.label}`;
}
