// The connect flow against a fake provider: the consent URL a press builds, the callback that
// writes the refresh token, and the two callbacks that write nothing.
//
// No network call is made: the fetcher is injected in every case. No file outside a directory this
// file made under mkdtemp is read or written, and every path is asserted to be inside it first.

import { createHash } from 'node:crypto';
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { CalendarAccountConfig } from '../../../../src/lib/data/model.ts';
import {
    CONNECT_MS,
    ConnectStates,
    callbackPath,
    callbackUrl,
    type Fetcher
} from '../../../../src/lib/server/accounts/connect/oauth.ts';
import {
    handleCalendar,
    handleCalendarCallback
} from '../../../../src/lib/server/accounts/calendar/routes.ts';
import { credentialFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const TOKEN = 'the-write-token-of-this-case';
const GOOGLE: CalendarAccountConfig = { provider: 'google', label: 'work' };
const MICROSOFT: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
const ACCOUNTS = [GOOGLE, MICROSOFT];
const REFRESH = 'the-refresh-token-the-fake-provider-issued';
const WORDS = { ok: 'The account is connected.', bad: 'That link was not recognised.' };

const made: string[] = [];

afterEach(() => {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
});

/** A calendar directory of this case's own, asserted to be inside the temporary directory. */
function scratch(): string {
    const dir = scratchDir('oculus-calendar-oauth-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(dir);
    return dir;
}

/** One account's client half, written where the connector reads it. */
function writeClient(dir: string, account: CalendarAccountConfig, body: unknown): string {
    const file = credentialFile(dir, account);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, JSON.stringify(body));
    return file;
}

/** The refresh token one credential file holds, or undefined when it holds none. */
function tokenIn(file: string): unknown {
    return (JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>).refresh_token;
}

/** A POST as the page sends one, with the origin and token headers the gates read. */
function post(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request('http://127.0.0.1:8791/api/calendar', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: JSON.stringify(body)
    });
}

/** The provider's redirect back to this machine. */
function callback(query: string): Request {
    return new Request(`http://127.0.0.1:8791${callbackPath('calendar')}?${query}`);
}

/** A fetcher answering the token endpoint with one refresh token, and recording what it was sent. */
function tokenFetcher(): { fetcher: Fetcher; forms: URLSearchParams[] } {
    const forms: URLSearchParams[] = [];
    const fetcher = vi.fn<Fetcher>((_url, init) => {
        forms.push(new URLSearchParams(typeof init?.body === 'string' ? init.body : ''));
        return Promise.resolve(
            new Response(JSON.stringify({ refresh_token: REFRESH, access_token: 'an-access' }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
    return { fetcher, forms };
}

/** The target of one POST, with the consent page opened into a recorder instead of the system. */
function target(dir: string, states: ConnectStates, opened: string[]) {
    return {
        token: TOKEN,
        accounts: ACCOUNTS,
        dir,
        redirect: callbackUrl(8791, 'calendar'),
        states,
        refresh: () => Promise.resolve(),
        open: (url: string) => void opened.push(url),
        linkFor: () => null
    };
}

/** The target of one callback, over the injected fetcher. */
function callbackTarget(dir: string, states: ConnectStates, fetcher: Fetcher, refresh = noop) {
    return {
        accounts: ACCOUNTS,
        dir,
        states,
        fetcher,
        refresh: () => {
            refresh();
            return Promise.resolve();
        },
        words: WORDS
    };
}

describe('the consent URL a Connect press builds', () => {
    it('carries the read-only scope, the state, the S256 challenge and the loopback redirect', async () => {
        const dir = scratch();
        writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const states = new ConnectStates();
        const opened: string[] = [];

        const answer = await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, states, opened)
        );

        expect(answer.status).toBe(200);
        expect(opened).toHaveLength(1);
        const url = new URL(opened[0]);
        expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
        expect(url.searchParams.get('scope')).toBe(
            'https://www.googleapis.com/auth/calendar.readonly'
        );
        expect(url.searchParams.get('redirect_uri')).toBe(
            `http://127.0.0.1:8791${callbackPath('calendar')}`
        );
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('state')).not.toBe(null);
        expect(url.searchParams.get('code_challenge')).not.toBe(null);
        // The challenge the provider is given is the SHA-256 of the verifier held here, and the
        // verifier itself is never in the address the browser is sent to.
        expect(opened[0]).not.toContain('code_verifier');
        expect(states.size).toBe(1);
    });

    it('asks Microsoft for the two read-only scopes on the account tenant', async () => {
        const dir = scratch();
        writeClient(dir, MICROSOFT, { client_id: 'an-id', tenant: 'a-tenant' });
        const opened: string[] = [];

        await handleCalendar(
            post({ action: 'connect', account: 'microsoft-uni' }),
            target(dir, new ConnectStates(), opened)
        );

        const url = new URL(opened[0]);
        expect(url.host).toBe('login.microsoftonline.com');
        expect(url.pathname).toBe('/a-tenant/oauth2/v2.0/authorize');
        expect(url.searchParams.get('scope')).toBe('Calendars.Read offline_access');
        expect(url.searchParams.has('client_secret')).toBe(false);
    });

    it('refuses an account the machine does not name, and opens nothing', async () => {
        const dir = scratch();
        const opened: string[] = [];
        const answer = await handleCalendar(
            post({ action: 'connect', account: 'google-elsewhere' }),
            target(dir, new ConnectStates(), opened)
        );
        expect(answer.status).toBe(400);
        expect(opened).toEqual([]);
    });

    it('refuses a press on an account whose credential file is not there yet', async () => {
        const dir = scratch();
        const opened: string[] = [];
        const answer = await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, new ConnectStates(), opened)
        );
        expect(answer.status).toBe(400);
        expect(opened).toEqual([]);
    });

    it('refuses a request from another page, and one with no write token', async () => {
        const dir = scratch();
        writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const opened: string[] = [];
        const where = target(dir, new ConnectStates(), opened);
        const body = { action: 'connect', account: 'google-work' };
        const elsewhere = new Request('http://127.0.0.1:8791/api/calendar', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                origin: 'https://elsewhere.example',
                'x-oculus-token': TOKEN
            },
            body: JSON.stringify(body)
        });
        expect((await handleCalendar(elsewhere, where)).status).toBe(403);
        expect(
            (await handleCalendar(post(body, { 'x-oculus-token': 'stale' }), where)).status
        ).toBe(403);
        expect(opened).toEqual([]);
    });
});

describe('the callback the provider sends the browser to', () => {
    it('exchanges the code with the verifier, writes the file 0600 and holds no verifier after', async () => {
        const dir = scratch();
        const file = writeClient(dir, GOOGLE, {
            client_id: 'an-id',
            client_secret: 'a-secret'
        });
        const states = new ConnectStates();
        const opened: string[] = [];
        await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, states, opened)
        );
        const consent = new URL(opened[0]);
        const state = consent.searchParams.get('state') ?? '';
        const { fetcher, forms } = tokenFetcher();
        const refreshed = vi.fn();

        const answer = await handleCalendarCallback(
            callback(`code=a-code&state=${encodeURIComponent(state)}`),
            callbackTarget(dir, states, fetcher, refreshed)
        );

        expect(answer.status).toBe(200);
        expect(await answer.text()).toContain(WORDS.ok);
        // The code went up with the verifier whose challenge the consent page carried.
        expect(forms[0].get('code')).toBe('a-code');
        const verifier = forms[0].get('code_verifier') ?? '';
        expect(createHash('sha256').update(verifier).digest('base64url')).toBe(
            consent.searchParams.get('code_challenge')
        );
        expect(forms[0].get('redirect_uri')).toBe(
            `http://127.0.0.1:8791${callbackPath('calendar')}`
        );
        // The file gained the token, kept its client half, and is readable by its owner alone.
        const held = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
        expect(held).toEqual({
            client_id: 'an-id',
            client_secret: 'a-secret',
            refresh_token: REFRESH
        });
        expect(statSync(file).mode & 0o777).toBe(0o600);
        // The consent is spent: nothing is held, and the same state a second time writes nothing.
        expect(states.size).toBe(0);
        expect(refreshed).toHaveBeenCalledTimes(1);
        const again = await handleCalendarCallback(
            callback(`code=a-code&state=${encodeURIComponent(state)}`),
            callbackTarget(dir, states, fetcher)
        );
        expect(again.status).toBe(400);
    });

    it('answers 400 and writes nothing for a state this process did not mint', async () => {
        const dir = scratch();
        const file = writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const { fetcher } = tokenFetcher();

        const answer = await handleCalendarCallback(
            callback('code=a-code&state=a-state-of-nobody'),
            callbackTarget(dir, new ConnectStates(), fetcher)
        );

        expect(answer.status).toBe(400);
        expect(await answer.text()).toContain(WORDS.bad);
        expect(fetcher).not.toHaveBeenCalled();
        expect(tokenIn(file)).toBe(undefined);
    });

    it('answers 400 and writes nothing for a state whose ten minutes are up', async () => {
        const dir = scratch();
        const file = writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        let now = 1000;
        const states = new ConnectStates(() => now);
        const opened: string[] = [];
        await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, states, opened)
        );
        const state = new URL(opened[0]).searchParams.get('state') ?? '';
        now += CONNECT_MS + 1;
        const { fetcher } = tokenFetcher();

        const answer = await handleCalendarCallback(
            callback(`code=a-code&state=${encodeURIComponent(state)}`),
            callbackTarget(dir, states, fetcher)
        );

        expect(answer.status).toBe(400);
        expect(fetcher).not.toHaveBeenCalled();
        expect(tokenIn(file)).toBe(undefined);
    });

    it('answers 400 and writes nothing when the provider refuses the code', async () => {
        const dir = scratch();
        const file = writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const states = new ConnectStates();
        const opened: string[] = [];
        await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, states, opened)
        );
        const state = new URL(opened[0]).searchParams.get('state') ?? '';
        const fetcher = vi.fn<Fetcher>(() =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'invalid_grant' }), {
                    status: 400,
                    headers: { 'content-type': 'application/json' }
                })
            )
        );

        const answer = await handleCalendarCallback(
            callback(`code=a-code&state=${encodeURIComponent(state)}`),
            callbackTarget(dir, states, fetcher)
        );

        expect(answer.status).toBe(400);
        expect(tokenIn(file)).toBe(undefined);
    });

    it('answers no token, code or state in the page it draws', async () => {
        const dir = scratch();
        writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const states = new ConnectStates();
        const opened: string[] = [];
        await handleCalendar(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, states, opened)
        );
        const state = new URL(opened[0]).searchParams.get('state') ?? '';
        const { fetcher } = tokenFetcher();

        const answer = await handleCalendarCallback(
            callback(`code=a-code&state=${encodeURIComponent(state)}`),
            callbackTarget(dir, states, fetcher)
        );
        const drawn = await answer.text();

        for (const secret of [REFRESH, 'a-code', state, 'a-secret', 'an-access']) {
            expect(drawn).not.toContain(secret);
        }
    });
});
