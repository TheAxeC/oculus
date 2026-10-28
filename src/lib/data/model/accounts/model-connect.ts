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
 * `missing` is, for each provider, the sentence naming the hub's `sign_in` row of it and the field
 * that row lacks, or the empty string when the row has every field the connect flow needs; a
 * provider with a sentence is shown with it and nothing to press. The client half itself is never
 * in it.
 */
export type ConnectSetup = {
    ready: Record<ConnectProvider, boolean>;
    redirects: Record<ConnectKind, string>;
    scopes: Record<ConnectKind, Record<ConnectProvider, string>>;
    missing: Record<ConnectProvider, string>;
    git: GitHosts;
};

/**
 * One git host of the hub's `sign_in` (a row with `credential_address`) as Account setup's git
 * section draws it: the row's key and name, the page its OAuth App is registered at, the origin
 * git is given the token for, the sentence naming the field the row lacks for Sign in (empty when
 * it has every one), whether this machine holds the client id, the login a Sign in read (empty
 * when no token is held), and the device flow of a Sign in that runs. The client id and the token
 * are never in it.
 */
export type GitHostSetup = {
    key: string;
    name: string;
    register: string;
    address: string;
    missing: string;
    clientSaved: boolean;
    login: string;
    flow: GitFlow | null;
};

/**
 * A Sign in by the device flow as the page draws it: the code the reader types at the address,
 * the address, and where it stands: `waiting` on the reader, `granted`, `denied` (`access_denied`),
 * `expired` (`expired_token`), `cancelled`, or `failed` with the sentence of what went wrong.
 */
export type GitFlow = {
    code: string;
    address: string;
    state: 'waiting' | 'granted' | 'denied' | 'expired' | 'cancelled' | 'failed';
    said: string;
};

/**
 * A key whose file in `~/.oculus/connect/` holds a token that no git host row of `sign_in` names
 * with the file's address, as Account setup lists it with its Sign out: the key, the login the
 * token belongs to, and the sentence saying the row is missing or names another address, so the
 * token is given to no git. The token is never in it.
 */
export type GitUnlisted = { key: string; login: string; missing: string };

/**
 * Account setup's git section: one part per git host row, the keys holding a token no row names
 * (`unlisted`), the sentence saying none is set and where it is set (`none`, empty when a row
 * is), and the sentence saying git is given no sign-in because a path of the credential helper's
 * command holds a single quote (`helperRefused`, empty otherwise).
 */
export type GitHosts = {
    hosts: GitHostSetup[];
    unlisted: GitUnlisted[];
    none: string;
    helperRefused: string;
};
