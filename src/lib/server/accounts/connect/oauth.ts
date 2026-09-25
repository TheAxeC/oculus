// Layer 2, server. The authorization-code flow with PKCE for both providers and both connectors:
// the two endpoint sets as data, the consent URL, the pending states, and the two token calls.
//
// PKCE is what makes the flow safe on a machine-local redirect. The consent URL carries the SHA-256
// of a verifier this process minted and holds in memory; the token call carries the verifier
// itself, so a code intercepted on the loopback hop is worth nothing without the process that
// minted it. The Google client is a Desktop client, whose secret is not a secret and whose loopback
// redirect allows any port; the Microsoft application is a public client and has no secret at all.
//
// The kind is what a connector differs by: it picks the scopes asked for and the callback route the
// provider is sent to. A calendar consent therefore never carries mail rights and a mail consent
// never carries calendar rights, whichever mailbox they are for.
//
// The redirect is the server's own callback route, which is why the state map lives beside the
// pollers rather than inside the route: the route that mints a state and the route the provider
// sends the browser to are two requests of the same process.
//
// Nothing here logs, publishes or returns a secret, a code, a verifier or a token. An error carries
// the HTTP status and the provider's own error code and never its body.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isMap, str } from '../../../data/helpers/guards.ts';
import type { ConnectKind, ConnectProvider } from '../../../data/model/index.ts';
import type { Credentials } from './store.ts';

/** How the providers are called, injected so no test opens a connection. */
export type Fetcher = typeof fetch;

/**
 * How an `https` address reaches the operating system, for the calendar's and the mail's consent
 * and event links. It is injectable so route tests open nothing. It is declared here, with the
 * connect flow that opens a consent page, and server/files/open.ts's macOpenAddress satisfies it.
 */
export type Opener = (target: string) => Promise<void> | void;

/** The path each connector's provider sends the reader's browser back to. */
const CALLBACK_PATH: Record<ConnectKind, string> = {
    calendar: '/api/calendar/callback',
    mail: '/api/mail/callback'
};

/** The route one connector's consent comes back to. */
export function callbackPath(kind: ConnectKind): string {
    return CALLBACK_PATH[kind];
}

/** The loopback address the consent URL carries, on the port the machine's own file names. */
export function callbackUrl(port: number, kind: ConnectKind): string {
    return `http://127.0.0.1:${port}${CALLBACK_PATH[kind]}`;
}

/** How long a consent a reader started stays open, in milliseconds. */
export const CONNECT_MS = 10 * 60 * 1000;

/**
 * The scopes each connector asks each provider for, and nothing beside them. The calendar asks to
 * read and nothing else; mail asks to read, to change a label and to send, which is what a triage
 * that archives and answers needs and is the narrowest pair either provider offers for it.
 */
export const SCOPE: Record<ConnectKind, Record<ConnectProvider, string>> = {
    calendar: {
        google: 'https://www.googleapis.com/auth/calendar.readonly',
        microsoft: 'Calendars.Read offline_access'
    },
    mail: {
        google: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
        microsoft: 'Mail.ReadWrite Mail.Send offline_access'
    }
};

/** Where a provider's consent page is. Microsoft's is per directory, so it takes the tenant. */
function authorizeUrl(credentials: Credentials): string {
    return credentials.provider === 'google'
        ? 'https://accounts.google.com/o/oauth2/v2/auth'
        : `https://login.microsoftonline.com/${encodeURIComponent(credentials.tenant)}/oauth2/v2.0/authorize`;
}

/** Where a provider's token endpoint is. */
function tokenUrl(credentials: Credentials): string {
    return credentials.provider === 'google'
        ? 'https://oauth2.googleapis.com/token'
        : `https://login.microsoftonline.com/${encodeURIComponent(credentials.tenant)}/oauth2/v2.0/token`;
}

/** Random bytes as base64url, which is what both a verifier and a state are. */
function randomText(bytes: number): string {
    return randomBytes(bytes).toString('base64url');
}

/** The S256 challenge of a verifier, which is what the consent URL carries. */
function challengeOf(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
}

/** One consent a reader started: which account it is for, and what the token call will need. */
export type Pending = { key: string; verifier: string; redirect: string; expires: number };

/**
 * The consents in flight, one entry per press of Connect. A state is taken once: the entry is
 * removed as it is read, so a code replayed against the same state finds nothing, and an entry past
 * its ten minutes is gone whether or not anything came back for it.
 *
 * The map belongs to the process's context object rather than to this module, and each connector
 * has one of its own, so two servers in one test run share nothing and a mail state cannot be
 * presented at the calendar's callback.
 */
export class ConnectStates {
    #pending = new Map<string, Pending>();
    #now: () => number;

    constructor(now: () => number = Date.now) {
        this.#now = now;
    }

    /** Drop every consent whose ten minutes are up. */
    #prune(): void {
        const now = this.#now();
        for (const [state, held] of this.#pending)
            if (held.expires <= now) this.#pending.delete(state);
    }

    /** Mint a state and a verifier for one account, and remember them until they are taken. */
    mint(key: string, redirect: string): { state: string; verifier: string } {
        this.#prune();
        const state = randomText(32);
        const verifier = randomText(32);
        this.#pending.set(state, {
            key,
            verifier,
            redirect,
            expires: this.#now() + CONNECT_MS
        });
        return { state, verifier };
    }

    /**
     * The consent a state names, or null when there is none. Three things guard it: an entry is
     * taken once, since it is removed as it is read, so a code replayed against it finds nothing;
     * an entry past its ten minutes was already dropped by the prune above; and each candidate of
     * the same length is compared with timingSafeEqual rather than with ===, so the comparison of
     * one candidate does not end early on the first differing byte. The walk itself is over the map
     * in insertion order and its length is the number of consents open, which this does not hide.
     */
    take(state: string): Pending | null {
        this.#prune();
        const wanted = Buffer.from(state);
        for (const [held, pending] of this.#pending) {
            const candidate = Buffer.from(held);
            if (candidate.length !== wanted.length) continue;
            if (!timingSafeEqual(candidate, wanted)) continue;
            this.#pending.delete(held);
            return pending;
        }
        return null;
    }

    /** How many consents are open, which is what a test asserts a taken state left behind. */
    get size(): number {
        this.#prune();
        return this.#pending.size;
    }
}

/**
 * The consent page a reader is sent to: the kind's scopes, the state, the challenge, the loopback.
 */
export function consentUrl(
    kind: ConnectKind,
    credentials: Credentials,
    args: { state: string; verifier: string; redirect: string }
): string {
    const url = new URL(authorizeUrl(credentials));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', credentials.clientId);
    url.searchParams.set('redirect_uri', args.redirect);
    url.searchParams.set('scope', SCOPE[kind][credentials.provider]);
    url.searchParams.set('state', args.state);
    url.searchParams.set('code_challenge', challengeOf(args.verifier));
    url.searchParams.set('code_challenge_method', 'S256');
    if (credentials.provider === 'google') {
        // A Google refresh token is issued on the first consent only, so the consent is asked for
        // again: a reader who reconnects an account otherwise gets an access token and no refresh
        // token, and the next poll would have nothing to exchange.
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
    } else {
        url.searchParams.set('response_mode', 'query');
    }
    return url.toString();
}

/** One line saying what a provider refused, made of the status and its own error code. */
function refusal(provider: ConnectProvider, status: number, body: unknown): string {
    const code = isMap(body) ? (str(body.error) ?? '') : '';
    return `${provider} token endpoint: ${status}${code === '' ? '' : ` ${code}`}`;
}

/** Post a form to a provider's token endpoint and read the two fields the connector uses. */
async function post(
    credentials: Credentials,
    form: Record<string, string>,
    fetcher: Fetcher
): Promise<{ accessToken?: string; refreshToken?: string }> {
    const response = await fetcher(tokenUrl(credentials), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(form).toString()
    });
    let body: unknown;
    try {
        body = await response.json();
    } catch {
        body = null;
    }
    if (!response.ok) throw new Error(refusal(credentials.provider, response.status, body));
    if (!isMap(body)) throw new Error(refusal(credentials.provider, response.status, null));
    return { accessToken: str(body.access_token), refreshToken: str(body.refresh_token) };
}

/** The client fields every token call carries: the secret only where the provider has one. */
function client(kind: ConnectKind, credentials: Credentials): Record<string, string> {
    return credentials.provider === 'google'
        ? { client_id: credentials.clientId, client_secret: credentials.clientSecret }
        : { client_id: credentials.clientId, scope: SCOPE[kind].microsoft };
}

/** Exchange one authorization code for the refresh token the connector keeps. */
export async function exchangeCode(
    kind: ConnectKind,
    credentials: Credentials,
    args: { code: string; verifier: string; redirect: string },
    fetcher: Fetcher
): Promise<string> {
    const answer = await post(
        credentials,
        {
            ...client(kind, credentials),
            grant_type: 'authorization_code',
            code: args.code,
            redirect_uri: args.redirect,
            code_verifier: args.verifier
        },
        fetcher
    );
    if (answer.refreshToken === undefined) {
        throw new Error(`${credentials.provider} token endpoint: no refresh token`);
    }
    return answer.refreshToken;
}

/** One access token from the account's refresh token, held by the caller in memory only. */
export async function accessToken(
    kind: ConnectKind,
    credentials: Credentials,
    refreshToken: string,
    fetcher: Fetcher
): Promise<string> {
    const answer = await post(
        credentials,
        {
            ...client(kind, credentials),
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        },
        fetcher
    );
    if (answer.accessToken === undefined) {
        throw new Error(`${credentials.provider} token endpoint: no access token`);
    }
    return answer.accessToken;
}
