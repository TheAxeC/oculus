// The connect flow against a fake provider: the consent URL a press builds, and callbacks that
// write nothing.
//
// No network call is made: the fetcher is injected in every case. No file outside a directory this
// file made under mkdtemp is read or written, and every path is asserted to be inside it first.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { CalendarAccountConfig } from '../../../../src/lib/data/model/index.ts';
import {
    ConnectStates,
    accessToken,
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
import { bookIn } from '../book.ts';
import { PROVIDERS } from '../providers.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const TOKEN = 'the-write-token-of-this-case';
const GOOGLE: CalendarAccountConfig = { provider: 'google', label: 'work' };
const MICROSOFT: CalendarAccountConfig = { provider: 'microsoft', label: 'uni' };
const ACCOUNTS = [GOOGLE, MICROSOFT];
const REFRESH = 'the-refresh-token-the-fake-provider-issued';
const WORDS = { ok: 'The account is connected.', bad: 'That link was not recognised.' };

/** A calendar directory of the case's own, which scratchDir makes in the temporary directory. */
function scratch(): string {
    return scratchDir('oculus-calendar-oauth-');
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

/**
 * A fetcher answering the token endpoint with one refresh token, and recording what it was sent.
 */
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
        // A provider folder this case never fills, so every half is the account file's own.
        providerDir: join(dir, 'connect'),
        providers: PROVIDERS,
        book: bookIn(dir),
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
        providerDir: join(dir, 'connect'),
        providers: PROVIDERS,
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
    it('refuses a request with no write token', async () => {
        const dir = scratch();
        writeClient(dir, GOOGLE, { client_id: 'an-id', client_secret: 'a-secret' });
        const opened: string[] = [];
        const where = target(dir, new ConnectStates(), opened);
        const body = { action: 'connect', account: 'google-work' };
        expect(
            (await handleCalendar(post(body, { 'x-oculus-token': 'stale' }), where)).status
        ).toBe(403);
        expect(opened).toEqual([]);
    });
});

describe('the callback the provider sends the browser to', () => {
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
});

describe('the refresh of a Google and a Microsoft account', () => {
    const REFRESH = 'the-refresh-token-of-this-case';
    const [google, microsoft] = PROVIDERS.rows;

    it.each([
        {
            name: 'Google',
            row: google,
            credentials: {
                provider: 'google',
                clientId: 'g-id',
                clientSecret: 'g-secret'
            } as const,
            address: 'https://oauth2.googleapis.com/token'
        },
        {
            name: 'Microsoft',
            row: microsoft,
            credentials: {
                provider: 'microsoft',
                clientId: 'm-id',
                tenant: 'uni.example'
            } as const,
            address: 'https://login.microsoftonline.com/uni.example/oauth2/v2.0/token'
        }
    ])(
        "sends the refresh token of $name only to its row's token address, in the body and never in the address or the error (G135)",
        async ({ row, credentials, address }) => {
            const answers = [
                Response.json({ access_token: 'access' }),
                Response.json(
                    { error: 'invalid_grant', error_description: REFRESH },
                    { status: 400 }
                )
            ];
            const calls: { address: string; body: string }[] = [];
            const fetcher = vi.fn<Fetcher>((input, init) => {
                calls.push({
                    address: input instanceof Request ? input.url : input.toString(),
                    body: typeof init?.body === 'string' ? init.body : ''
                });
                return Promise.resolve(answers[calls.length - 1]);
            });
            expect(await accessToken('calendar', credentials, row, REFRESH, fetcher)).toBe(
                'access'
            );
            const said = await accessToken('calendar', credentials, row, REFRESH, fetcher).then(
                () => '',
                (error: unknown) => String(error)
            );
            expect(said).toContain('400 invalid_grant');
            expect(said).not.toContain(REFRESH);
            expect(calls.map((one) => one.address)).toEqual([address, address]);
            for (const one of calls) {
                expect(one.address).not.toContain(REFRESH);
                expect(new URLSearchParams(one.body).get('refresh_token')).toBe(REFRESH);
            }
        }
    );
});
