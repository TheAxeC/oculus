// Layer 2, client state. What the account list and the account setup page read of the connector
// rules, and the one reading of the server's scopes the setup page lists.
//
// The Microsoft permissions the reader grants at Entra are the scopes the connect flow asks for,
// both connectors' together, so the page lists them from the server's own answer rather than from
// a copy that could fall behind it.

import type { ConnectKind, ConnectProvider, ConnectSetup } from '../../data/model/index.ts';
export { PROVIDERS, PROVIDERS_OF, connectKey, signsIn } from '../../data/accounts/connect.ts';
export type {
    AccountProvider,
    AccountRow,
    ConnectAccountConfig,
    ConnectAccountStatus,
    ConnectStatus,
    ConnectKind,
    ConnectProvider,
    ConnectSetup
} from '../../data/model/index.ts';

/** The words of one connector's head, each read from that view's own catalog. */
export type HeadWords = {
    polling: string;
    unconfigured: string;
    error: string;
    live: string;
    asOf: (at: string) => string;
    asOfLate: (at: string) => string;
    retrying: (minutes: number) => string;
    every: (minutes: number) => string;
    refresh: string;
};

/** The two connectors, in the order the setup page lists what each asks for. */
const KINDS: readonly ConnectKind[] = ['calendar', 'mail'];

/** Every scope one provider is asked for across both connectors, each once, in first-seen order. */
export function scopesOf(setup: ConnectSetup, provider: ConnectProvider): string[] {
    const found: string[] = [];
    for (const kind of KINDS) {
        for (const scope of setup.scopes[kind][provider].split(' ')) {
            if (scope !== '' && !found.includes(scope)) found.push(scope);
        }
    }
    return found;
}
