// Layer 2, server. The calendar endpoints: the one POST the page presses, and the callback the
// provider sends the reader's browser to.
//
// The POST carries the origin and token gates every other action carries. The callback carries
// neither: the browser arrives there from the provider and not from the page, so it has no oculus
// token and its `Sec-Fetch-Site` is cross-site. What guards it is the `state` this process minted
// ten minutes earlier and holds in memory, which is taken once and never again.
//
// The page never hands this module a URL. Connect names an account and the consent URL is built
// here; the link control names an event and the URL is read from the state the poller published, so
// the only addresses the operating system is ever given are the two providers' own.
//
// No answer of this module carries a token, a secret, an authorization code or an event's contents.

import { calendarKey } from '../../data/calendar.ts';
import type { CalendarAccountConfig } from '../../data/model.ts';
import { hasToken, sameOrigin } from '../auth.ts';
import type { Opener } from '../open.ts';
import { httpsLink } from './api.ts';
import { consentUrl, exchangeCode, type ConnectStates, type Fetcher } from './oauth.ts';
import { readCredentials, writeRefreshToken } from './store.ts';

export type CalendarTarget = {
    token: string;
    accounts: CalendarAccountConfig[];
    /** The folder the credential files live in, already resolved. */
    dir: string;
    /** The loopback address the provider sends the browser back to. */
    redirect: string;
    states: ConnectStates;
    refresh: () => Promise<void>;
    /** Hands one address to the operating system; injected so no test opens anything. */
    open: Opener;
    /** The provider's page for one event of the state last published, or null when there is none. */
    linkFor: (id: string) => string | null;
};

/** The two sentences the callback page is drawn from, read from the catalog by the route. */
export type CallbackWords = { ok: string; bad: string };

export type CalendarCallbackTarget = {
    accounts: CalendarAccountConfig[];
    dir: string;
    states: ConnectStates;
    fetcher: Fetcher;
    refresh: () => Promise<void>;
    words: CallbackWords;
};

const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** The five characters a browser reads as markup, so a configured sentence is drawn as words. */
function escaped(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** The page the provider's redirect lands on: one sentence, and nothing the reader must press. */
function page(status: number, sentence: string): Response {
    const body = [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>oculus</title></head>',
        `<body><p>${escaped(sentence)}</p></body>`,
        '</html>',
        ''
    ].join('\n');
    return new Response(body, {
        status,
        headers: { 'content-type': 'text/html; charset=utf-8' }
    });
}

/** The configured account a key names, or undefined when the machine names no such account. */
function accountFor(
    accounts: CalendarAccountConfig[],
    key: unknown
): CalendarAccountConfig | undefined {
    return typeof key !== 'string'
        ? undefined
        : accounts.find((account) => calendarKey(account) === key);
}

/** Start one consent: build the provider's page from the account's own client half, and open it. */
async function connect(target: CalendarTarget, account: CalendarAccountConfig): Promise<Response> {
    let credentials;
    try {
        credentials = readCredentials(target.dir, account);
    } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : String(error) });
    }
    if (credentials === null) return json(400, { error: 'no credential file' });
    const { state, verifier } = target.states.mint(calendarKey(account), target.redirect);
    await target.open(consentUrl(credentials, { state, verifier, redirect: target.redirect }));
    return json(200, { ok: true });
}

export async function handleCalendar(request: Request, target: CalendarTarget): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '') || !hasToken(request, target.token))
        return json(403, { error: 'forbidden' });
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'bad body' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body))
        return json(400, { error: 'bad body' });
    const record = body as Record<string, unknown>;
    if (record.action === 'refresh') {
        await target.refresh();
        return json(200, { status: 'ok' });
    }
    if (record.action === 'connect') {
        const account = accountFor(target.accounts, record.account);
        if (account === undefined) return json(400, { error: 'no such account' });
        return connect(target, account);
    }
    if (record.action === 'open') {
        const held = typeof record.event === 'string' ? target.linkFor(record.event) : null;
        // The scheme is checked again here, where the operating system is about to be called, and
        // not only where the provider's answer was read.
        const link = httpsLink(held ?? undefined);
        if (link === undefined) return json(400, { error: 'no such event' });
        await target.open(link);
        return json(200, { ok: true });
    }
    return json(400, { error: 'bad action' });
}

/**
 * The provider's redirect. A state this process minted is taken once and the code behind it is
 * exchanged for the refresh token the account's file keeps; a state it did not mint, or one whose
 * ten minutes are up, writes nothing and answers 400.
 */
export async function handleCalendarCallback(
    request: Request,
    target: CalendarCallbackTarget
): Promise<Response> {
    const query = new URL(request.url).searchParams;
    const state = query.get('state');
    const code = query.get('code');
    const pending = state === null ? null : target.states.take(state);
    if (pending === null || code === null || code === '') return page(400, target.words.bad);
    const account = accountFor(target.accounts, pending.key);
    if (account === undefined) return page(400, target.words.bad);
    let credentials;
    try {
        credentials = readCredentials(target.dir, account);
    } catch {
        credentials = null;
    }
    if (credentials === null) return page(400, target.words.bad);
    let refreshToken: string;
    try {
        refreshToken = await exchangeCode(
            credentials,
            { code, verifier: pending.verifier, redirect: pending.redirect },
            target.fetcher
        );
    } catch {
        return page(400, target.words.bad);
    }
    writeRefreshToken(target.dir, account, refreshToken);
    await target.refresh();
    return page(200, target.words.ok);
}
