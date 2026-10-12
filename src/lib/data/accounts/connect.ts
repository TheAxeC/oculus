// Layer 1, data. How a connector account is named, which label a new one may take, and what the
// client half of a provider must look like, once, for every reader of those rules.
//
// The rules have readers on both sides: the server builds the credential file's name from the key,
// refuses an account row or a client half it would not read back, and matches the account a
// connect request names; the page sends that same key from the Connect control of the Calendar and
// the Inbox, and refuses a label or a client id in words before anything is sent. A copy on each
// side would let them disagree about what an account is called or what the server accepts.
//
// Which providers a connector takes is the kind's: the two that sign in for either, and the
// published link for a calendar alone, so a mail row naming `ics` is refused by the same rule that
// refuses a provider nobody offers.
//
// Pure: no I/O and no path module. The label's allowed characters are checked here, before a row is
// written, and again where the machine's own configuration is read, so a key is always a safe file
// name by the time it reaches a join.

import type { CalendarProvider } from '../model/accounts/model-calendar.ts';
import type {
    AccountProvider,
    AccountRow,
    ConnectAccountConfig,
    ConnectKind,
    ConnectProvider
} from '../model/accounts/model-connect.ts';

/** How an account is named in its credential file, on the wire and in a payload's rows. */
export function connectKey(account: AccountRow): string {
    return `${account.provider}-${account.label}`;
}

/** The `hub` field of an account row, absent for a row no hub's file holds. */
export function hubMark(account: { hub?: string }): { hub?: string } {
    return account.hub === undefined ? {} : { hub: account.hub };
}

/** The two providers that sign in, in the order the page offers them. */
export const PROVIDERS: readonly ConnectProvider[] = ['google', 'microsoft'];

/** The providers a calendar account is read from: the two that sign in, then a published link. */
export const CALENDAR_PROVIDERS: readonly CalendarProvider[] = [...PROVIDERS, 'ics'];

/** The providers each connector offers, in the order its Add form lists them. */
export const PROVIDERS_OF: Record<ConnectKind, readonly AccountProvider[]> = {
    calendar: CALENDAR_PROVIDERS,
    mail: PROVIDERS
};

/** Whether a value the page or a file sent is one of the two providers that sign in. */
export function isProvider(value: unknown): value is ConnectProvider {
    return value === 'google' || value === 'microsoft';
}

/** Whether a value the page or a file sent is one of the three calendar providers. */
export function isCalendarProvider(value: unknown): value is CalendarProvider {
    return isProvider(value) || value === 'ics';
}

/**
 * Whether an account row is of a provider that signs in, which is every row but a published link.
 */
export function signsIn(account: AccountRow): account is ConnectAccountConfig {
    return isProvider(account.provider);
}

/**
 * What a connector account's label may hold. The label becomes part of the credential file's name,
 * so a label that could leave the connector's directory, or name a hidden file, is refused rather
 * than joined into a path later.
 */
const ACCOUNT_LABEL = /^[a-z0-9][a-z0-9-]*$/;

/** Whether a label follows the rule above. */
export function isAccountLabel(label: unknown): label is string {
    return typeof label === 'string' && ACCOUNT_LABEL.test(label);
}

/** Why a new account cannot be added: its provider, its label's shape, or a label already taken. */
export type AccountRefusal = 'provider' | 'label' | 'taken';

/**
 * Why an account of this provider and label cannot join a connector's list that already holds
 * `rows`, or null when it can. The provider is one the connector offers, and the label is unique
 * per provider inside its own list, which is the rule the reader of the hubs' `.oculus/local.yml`
 * files applies, so a row this accepts is a row the next read accepts.
 */
export function accountRefusal(
    kind: ConnectKind,
    rows: readonly AccountRow[],
    provider: unknown,
    label: unknown
): AccountRefusal | null {
    if (!PROVIDERS_OF[kind].some((one) => one === provider)) return 'provider';
    if (!isAccountLabel(label)) return 'label';
    if (rows.some((row) => row.provider === provider && row.label === label)) return 'taken';
    return null;
}

/**
 * One provider's client half: the Google Desktop client's id and secret, or the Microsoft public
 * client's id and, when the organisation requires its own directory, the tenant.
 */
export type ProviderHalf =
    | { provider: 'google'; clientId: string; clientSecret: string }
    | { provider: 'microsoft'; clientId: string; tenant?: string };

/** Why a client half is refused, one word per field the setup page draws. */
export type HalfRefusal = 'provider' | 'google_id' | 'google_secret' | 'microsoft_id' | 'tenant';

/** A Google client id: the project number and a hash, then Google's own domain. */
const GOOGLE_ID = /^[0-9A-Za-z][0-9A-Za-z-]*\.apps\.googleusercontent\.com$/;

/** A Microsoft application or directory id: a GUID. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A field the page sent, with its surrounding space taken off, or the empty string. */
function typed(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

/**
 * The client half the fields name, or why it is refused. The page runs this before it sends and
 * the server runs it when it receives, so a refusal is said in words before anything is written
 * and a half the server writes is one it can read back.
 */
export function providerHalf(
    provider: unknown,
    fields: { clientId?: unknown; clientSecret?: unknown; tenant?: unknown }
): { half: ProviderHalf } | { refused: HalfRefusal } {
    const clientId = typed(fields.clientId);
    if (provider === 'google') {
        if (!GOOGLE_ID.test(clientId)) return { refused: 'google_id' };
        const clientSecret = typed(fields.clientSecret);
        if (clientSecret === '' || /\s/.test(clientSecret)) return { refused: 'google_secret' };
        return { half: { provider, clientId, clientSecret } };
    }
    if (provider === 'microsoft') {
        if (!GUID.test(clientId)) return { refused: 'microsoft_id' };
        const tenant = typed(fields.tenant);
        if (tenant !== '' && !GUID.test(tenant)) return { refused: 'tenant' };
        return { half: { provider, clientId, ...(tenant === '' ? {} : { tenant }) } };
    }
    return { refused: 'provider' };
}
