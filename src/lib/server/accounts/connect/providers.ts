// Layer 2, server. The addresses and scopes a connector asks a provider at, read from the hub's
// `sign_in` rows (data/sources/config/settings/connectors.ts) rather than written into the code:
// the row whose `key` is the account's provider (`google`, `microsoft`) gives the consent page,
// the token endpoint, the scope of each connector and the address its reader asks. What one step of
// a connector needs is named here, so a row that lacks a field is refused at the step, with the
// sentence naming the row's key and the field, before any request is sent.
//
// `{tenant}` in an address stands for a Microsoft account's directory, put in encoded as one path
// part, so a tenant holding `/` or `?` cannot change the address it is put into.

import type { ConnectKind, ConnectProvider } from '../../../data/model/index.ts';
import { signInRows, textCatalog, type SignInRow } from '../../../data/sources/config.ts';
import { words } from '../../core/words.ts';

/** A step of a connector: the consent and its code exchange, or a round's token and read. */
export type ProviderStep = 'consent' | 'poll';

/** A field of SignInRow that holds an address or a scope. */
type RowField = Exclude<keyof SignInRow, 'key' | 'name'>;

/** The field of a `sign_in` row as the hub's file names it, for a field of SignInRow. */
const FILE_FIELD: Record<RowField, string> = {
    authorize: 'authorize',
    token: 'token',
    deviceCode: 'device_code',
    user: 'user',
    calendar: 'calendar',
    mail: 'mail',
    mailLink: 'mail_link',
    calendarScope: 'calendar_scope',
    mailScope: 'mail_scope',
    gitScope: 'git_scope',
    credentialAddress: 'credential_address',
    register: 'register'
};

/** The scope field of each connector. */
const SCOPE_FIELD: Record<ConnectKind, 'calendarScope' | 'mailScope'> = {
    calendar: 'calendarScope',
    mail: 'mailScope'
};

/**
 * The fields one step of one connector needs of a provider's row. The consent sends the reader to
 * `authorize` with the connector's scope and exchanges the code at `token`; a round asks `token`
 * for an access token, with the scope where the provider's token call carries it (Microsoft's),
 * and reads the connector's address. `mail_link` is not needed: a thread with no link has none.
 */
function needs(kind: ConnectKind, provider: ConnectProvider, step: ProviderStep): RowField[] {
    const scope = SCOPE_FIELD[kind];
    if (step === 'consent') return ['authorize', 'token', scope];
    const read: RowField = kind === 'calendar' ? 'calendar' : 'mail';
    return provider === 'microsoft' ? ['token', scope, read] : ['token', read];
}

/** A provider's row with every field the step needs, or what is missing: the row, or its field. */
export type ProviderFound = { row: SignInRow } | { missing: { key: string; field: string | null } };

/** The row of `provider` among `rows`, checked for what one step of one connector needs. */
export function providerFor(
    rows: readonly SignInRow[],
    provider: ConnectProvider,
    kind: ConnectKind,
    step: ProviderStep
): ProviderFound {
    const row = rows.find((one) => one.key === provider);
    if (row === undefined) return { missing: { key: provider, field: null } };
    const lacking = needs(kind, provider, step).find((one) => row[one] === undefined);
    return lacking === undefined
        ? { row }
        : { missing: { key: provider, field: FILE_FIELD[lacking] } };
}

/**
 * The sentences a missing row or field is said in, from the catalog: `noRow` takes the key as
 * `{0}`, `noField` the key and the field as `{0}` and `{1}`.
 */
export type SignInWords = { noRow: string; noField: string };

/** The hub's `sign_in` rows and the sentences a missing row or field is said in. */
export type Providers = { rows: readonly SignInRow[]; words: SignInWords };

/**
 * The two sentences of SignInWords, from the text catalog of the merged configuration, their
 * placeholders kept for the step that says one.
 */
export function signInWords(config: Record<string, unknown>): SignInWords {
    const text = textCatalog(config);
    return {
        noRow: words(text, 'accounts.sign_in_no_row'),
        noField: words(text, 'accounts.sign_in_no_field')
    };
}

/** The `sign_in` rows and their sentences, as the merged configuration holds them now. */
export function providersOf(config: Record<string, unknown>): Providers {
    return { rows: signInRows(config), words: signInWords(config) };
}

/** The sentence for what a step lacks: the row's key and, when the row is there, the field. */
export function missingSentence(
    missing: { key: string; field: string | null },
    words: SignInWords
): string {
    if (missing.field === null) return words.noRow.replace('{0}', () => missing.key);
    const field = missing.field;
    return words.noField.replace('{0}', () => missing.key).replace('{1}', () => field);
}

/** An address of a row with `{tenant}` put in as one encoded path part. */
export function withTenant(address: string, tenant: string): string {
    return address.replaceAll('{tenant}', () => encodeURIComponent(tenant));
}

/** The scope a connector asks a provider for, from the provider's row. */
export function scopeOf(row: SignInRow, kind: ConnectKind): string {
    return row[SCOPE_FIELD[kind]] ?? '';
}

/**
 * The address of a connector's reads at a provider, from the provider's row, with no `/` after it,
 * since every read adds its path after a `/`.
 */
export function readAddress(row: SignInRow, kind: ConnectKind): string {
    return ((kind === 'calendar' ? row.calendar : row.mail) ?? '').replace(/\/+$/, '');
}
