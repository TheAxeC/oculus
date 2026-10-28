// Layer 2, server. The account setup page's two requests: what it shows, and the Save that writes
// one provider's client half.
//
// What it shows is read from what the connect flow itself reads: the redirect addresses on the port
// this server listens on, and the scopes of the hub's `sign_in` row of each provider, so what the
// reader registers at a provider's console is what the connect flow sends there and the two cannot
// disagree. A provider whose row is missing, or lacks a field either connector's consent or round
// needs, is answered with the sentence naming the row's key and the field, which the page shows in
// place of the steps and the form. Whether a provider is set up is the one fact about the files it
// answers; the client id, the secret and the tenant are never in an answer, a log or an error.
// Beside the providers it answers the git section (git/routes.ts), with no Sign in's code in it,
// which the section's own gated `status` adds.
//
// The Save carries the token gate every write carries and runs behind the process's write chain.
// The half is checked by the rule the page checks it by (data/accounts/connect.ts), so a refusal is
// a code the page words, and the half written is one the connect flow reads back. Both connectors
// are then read again, so an account that was waiting on the provider says it can connect.

import { json } from '@sveltejs/kit';
import { PROVIDERS, providerHalf, isProvider } from '../../../data/accounts/connect.ts';
import type { ConnectKind, ConnectProvider, ConnectSetup } from '../../../data/model/index.ts';
import { gatedBody } from '../../core/auth.ts';
import { chained, type FsWrites } from '../../core/json.ts';
import { callbackUrl } from './oauth.ts';
import {
    missingSentence,
    providerFor,
    scopeOf,
    type Providers,
    type ProviderStep
} from './providers.ts';
import { providerReady, writeProviderHalf } from './store.ts';
import { gitHostsOf, type GitSection } from './git/routes.ts';

export type SetupTarget = {
    token: string;
    /** The folder the providers' client halves live in, already resolved. */
    providerDir: string;
    /** The port this server listens on, which the redirect addresses carry. */
    port: number;
    /** The hub's `sign_in` rows and the sentences a missing row or field is said in. */
    providers: Providers;
    /** What the git section is read from (git/routes.ts). */
    git: GitSection;
    writes: FsWrites;
    /** Read every account of both connectors again, after a half was written. */
    refresh: () => Promise<void>;
};

/** Every step of every connector, in the order a missing field of them is named. */
const CHECKED: readonly [ConnectKind, ProviderStep][] = [
    ['calendar', 'consent'],
    ['calendar', 'poll'],
    ['mail', 'consent'],
    ['mail', 'poll']
];

/** Whether a provider's half is on this machine; a file that cannot be read is no half. */
function ready(providerDir: string, provider: ConnectProvider): boolean {
    try {
        return providerReady(providerDir, provider);
    } catch {
        return false;
    }
}

/** The sentence for the first field a provider's row lacks for any step, or the empty string. */
function missingOf(providers: Providers, provider: ConnectProvider): string {
    for (const [kind, step] of CHECKED) {
        const found = providerFor(providers.rows, provider, kind, step);
        if ('missing' in found) return missingSentence(found.missing, providers.words);
    }
    return '';
}

/** The scope one connector asks one provider for, or the empty string with no row of it. */
function scopeFor(providers: Providers, provider: ConnectProvider, kind: ConnectKind): string {
    const row = providers.rows.find((one) => one.key === provider);
    return row === undefined ? '' : scopeOf(row, kind);
}

/** One value for each provider, in the order the providers are offered. */
function perProvider<T>(value: (provider: ConnectProvider) => T): Record<ConnectProvider, T> {
    return { google: value(PROVIDERS[0]), microsoft: value(PROVIDERS[1]) };
}

/** What the setup page draws from, for the request that asked. */
export function handleSetupRead(request: Request, target: SetupTarget): Response {
    const { providers } = target;
    const answer: ConnectSetup = {
        ready: perProvider((provider) => ready(target.providerDir, provider)),
        redirects: {
            calendar: callbackUrl(target.port, 'calendar'),
            mail: callbackUrl(target.port, 'mail')
        },
        scopes: {
            calendar: perProvider((provider) => scopeFor(providers, provider, 'calendar')),
            mail: perProvider((provider) => scopeFor(providers, provider, 'mail'))
        },
        missing: perProvider((provider) => missingOf(providers, provider)),
        git: gitHostsOf(target.git, null)
    };
    return json(answer);
}

/** Save one provider's client half, refused as a code when its shape is wrong. */
export async function handleSetupWrite(request: Request, target: SetupTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    if (body.action !== 'save') return json({ error: 'bad action' }, { status: 400 });
    if (!isProvider(body.provider)) return json({ error: 'provider' }, { status: 400 });
    const checked = providerHalf(body.provider, {
        clientId: body.client_id,
        clientSecret: body.client_secret,
        tenant: body.tenant
    });
    if ('refused' in checked) return json({ error: checked.refused }, { status: 400 });
    try {
        await chained(target.writes, () => writeProviderHalf(target.providerDir, checked.half));
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json({ error: 'file', reason }, { status: 500 });
    }
    await target.refresh();
    return json({ ok: true });
}
