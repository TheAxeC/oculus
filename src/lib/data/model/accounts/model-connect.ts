// Layer 1, data. What the calendar connector and the mail connector share: the two providers that
// sign in, the calendar's published link beside them, the shape of a configured account, and the
// state words an account can be in.
//
// It exists so that one account rule is written once. Both connectors name an account by a provider
// and a label, keep one file per account in a folder of their own, and answer with the same three
// state words; the only things that differ are the scopes asked for and the folder the file sits
// in, which the kind selects. A published link is a calendar provider alone: it is read with no
// consent, so the rows, the files and the cadence are shared and the sign-in is not.

/** The two connectors an account belongs to, which select the scopes and the credential folder. */
export type ConnectKind = 'calendar' | 'mail';

/** The two providers an account signs in to, in the order they are offered. */
export type ConnectProvider = 'google' | 'microsoft';

/**
 * Every provider an account row may name: the two that sign in, and `ics`, a calendar's published
 * link, which is read with no consent and is offered for a calendar alone.
 */
export type AccountProvider = ConnectProvider | 'ics';

/**
 * One account row of `calendars:` or `mail:` as the rows, the files and the cadence handle it
 * alike, whatever its provider. `hub` is the name of the hub whose `.oculus/local.yml` holds it.
 */
export type AccountRow = { provider: AccountProvider; label: string; hub?: string };

/** One account row of a provider that signs in, which is every row of `mail:`. */
export type ConnectAccountConfig = { provider: ConnectProvider; label: string; hub?: string };

/** One account: `not-connected` until its credential file holds a refresh token. */
export type ConnectAccountStatus = 'connected' | 'not-connected' | 'error';

/** A connector as a whole: `unconfigured` when the machine names no account. */
export type ConnectStatus = 'ok' | 'error' | 'unconfigured';

/**
 * What the account setup page reads from `GET /api/connect`: which providers this machine holds
 * the client half of, and the redirect addresses and scopes the connect flow uses, which the page
 * shows as they are so what the reader registers at a provider is what the server sends there.
 * The client half itself is never in it.
 */
export type ConnectSetup = {
    ready: Record<ConnectProvider, boolean>;
    redirects: Record<ConnectKind, string>;
    scopes: Record<ConnectKind, Record<ConnectProvider, string>>;
};
