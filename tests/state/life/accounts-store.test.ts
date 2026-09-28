// The accounts client store: the body each account command sends, the refusals it says in words
// before anything is sent, the Add that waits on its provider's setup and is made once the half is
// saved, and the scopes the setup page lists.
//
// Nothing opens a socket: `fetch` is a stub that records each request and answers it by its
// address, and the view the store opens is recorded by a stub opener.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    CalendarAccount,
    CalendarPayload,
    ConnectSetup
} from '../../../src/lib/data/model/index.ts';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import {
    ACCOUNT_SETUP_VIEW,
    createAccounts,
    type AccountsStore
} from '../../../src/lib/state/life/accounts.svelte.ts';
import { scopesOf } from '../../../src/lib/state/life/accounts.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const WRITE_TOKEN = 'the-write-token-of-this-case';
const GOOGLE_ID = '1234-abc.apps.googleusercontent.com';

const WORK: CalendarAccount = {
    provider: 'google',
    label: 'work',
    status: 'not-connected',
    calendars: []
};

const PAYLOAD: CalendarPayload = {
    status: 'ok',
    accounts: [WORK],
    events: [],
    updated: '2031-03-02T08:15:00',
    pollMin: 15,
    retryMin: 2,
    daysBack: 1,
    daysAhead: 14
};

/** A setup answer in which only the providers named are set up. */
function setupWith(ready: { google: boolean; microsoft: boolean }): ConnectSetup {
    return {
        ready,
        redirects: {
            calendar: 'http://127.0.0.1:8792/calendar/callback',
            mail: 'http://127.0.0.1:8792/mail/callback'
        },
        scopes: {
            calendar: { google: 'cal.readonly', microsoft: 'Calendars.Read offline_access' },
            mail: { google: 'gmail.modify', microsoft: 'Mail.ReadWrite offline_access' }
        }
    };
}

let client: ClientState;
let store: AccountsStore;
let opened: string[] = [];
/** The requests the stub fetch was given, oldest first. */
let asked: { url: string; method: string; body: Record<string, unknown>; token: string }[] = [];
/** The answer each address gets, by method and address; a POST not listed is taken. */
let answers = new Map<string, { status: number; body: unknown }>();
/** Held open until the case releases it, when a case reads a command while it is pending. */
let gate: Promise<void> | null = null;

beforeEach(() => {
    client = createClientState();
    client.writes.setToken(WRITE_TOKEN);
    client.entities.receive({ channel: 'calendar', version: 1, payload: PAYLOAD });
    opened = [];
    asked = [];
    answers = new Map();
    gate = null;
    store = createAccounts(client.entities, client.writes, (view) => opened.push(view));
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';
        const raw = init?.body;
        const headers = (init?.headers ?? {}) as Record<string, string>;
        asked.push({
            url,
            method,
            body: typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : {},
            token: headers[TOKEN_HEADER] ?? ''
        });
        if (gate !== null) await gate;
        const answer = answers.get(`${method} ${url}`) ?? { status: 200, body: { ok: true } };
        return new Response(JSON.stringify(answer.body), {
            status: answer.status,
            headers: { 'content-type': 'application/json' }
        });
    });
});

afterEach(() => vi.unstubAllGlobals());

/** Hold every answer until the returned release is called. */
function holding(): () => void {
    let release = (): void => undefined;
    gate = new Promise((done) => (release = done));
    return release;
}

describe('the accounts store commands', () => {
    it('posts a Connect naming the account by its key, and says it is opening until answered', async () => {
        const release = holding();
        const pending = store.connect('calendar', WORK);
        expect(store.connecting('calendar', WORK)).toBe(true);
        release();
        expect(await pending).toBe('');
        expect(store.connecting('calendar', WORK)).toBe(false);
        expect(asked).toEqual([
            {
                url: '/api/calendar',
                method: 'POST',
                body: { action: 'connect', account: 'google-work' },
                token: WRITE_TOKEN
            }
        ]);
    });

    it('opens the account setup page when a Connect is answered that the provider is not set up', async () => {
        answers.set('POST /api/calendar', { status: 409, body: { error: 'setup' } });
        expect(await store.connect('calendar', WORK)).toBe('');
        expect(opened).toEqual([ACCOUNT_SETUP_VIEW]);
    });

    it('refuses a label outside the rule in words, and sends nothing', async () => {
        expect(await store.add('calendar', 'google', 'Work Mail')).toBe(
            t('accounts.refused_label')
        );
        expect(asked).toEqual([]);
    });

    it('refuses a label the list already holds for that provider, and sends nothing', async () => {
        expect(await store.add('calendar', 'google', 'work')).toBe(
            t('accounts.refused_taken', 'work')
        );
        expect(asked).toEqual([]);
    });

    it('posts an Add to the endpoint of its own connector, with the label trimmed', async () => {
        expect(await store.add('mail', 'microsoft', '  home  ')).toBe('');
        expect(asked.map((one) => [one.url, one.body, one.token])).toEqual([
            ['/api/mail', { action: 'add', provider: 'microsoft', label: 'home' }, WRITE_TOKEN]
        ]);
    });

    it('says the connector is busy while its Add is not answered', async () => {
        const release = holding();
        const pending = store.add('mail', 'google', 'home');
        expect(store.busy('mail')).toBe(true);
        expect(store.busy('calendar')).toBe(false);
        release();
        await pending;
        expect(store.busy('mail')).toBe(false);
    });

    it('says a code the server refuses with in the same words the page uses', async () => {
        answers.set('POST /api/mail', { status: 400, body: { error: 'taken' } });
        expect(await store.add('mail', 'google', 'home')).toBe(t('accounts.refused_taken', 'home'));
    });

    it('posts a Remove naming the account by its key', async () => {
        expect(await store.remove('calendar', WORK)).toBe('');
        expect(asked.map((one) => one.body)).toEqual([
            { action: 'remove', account: 'google-work' }
        ]);
    });
});

describe('the Add of a published calendar link', () => {
    const LINK = 'https://outlook.example/cal.ics';

    it('posts the link with the label to the calendar endpoint, whatever the setup says', async () => {
        answers.set('GET /api/connect', {
            status: 200,
            body: setupWith({ google: false, microsoft: false })
        });
        await store.loadSetup();
        expect(await store.add('calendar', 'ics', ' rooster ', LINK)).toBe('');
        expect(opened).toEqual([]);
        expect(
            asked.filter((one) => one.method === 'POST').map((one) => [one.url, one.body])
        ).toEqual([
            ['/api/calendar', { action: 'add', provider: 'ics', label: 'rooster', url: LINK }]
        ]);
    });

    it('refuses a missing link and one of another scheme in words, and sends nothing', async () => {
        expect(await store.add('calendar', 'ics', 'rooster', '')).toBe(t('accounts.refused_link'));
        expect(await store.add('calendar', 'ics', 'rooster', 'ftp://x')).toBe(
            t('accounts.refused_link')
        );
        expect(asked).toEqual([]);
    });

    it("says the server's link refusal in the same words", async () => {
        answers.set('POST /api/calendar', { status: 400, body: { error: 'link' } });
        expect(await store.add('calendar', 'ics', 'rooster', LINK)).toBe(
            t('accounts.refused_link')
        );
    });

    it('refuses a published link on the mail in words, and sends nothing', async () => {
        expect(await store.add('mail', 'ics', 'rooster', LINK)).toBe(
            t('accounts.refused_provider')
        );
        expect(asked).toEqual([]);
    });

    it('sends no link with an Add of a provider that signs in', async () => {
        expect(await store.add('mail', 'microsoft', 'home', LINK)).toBe('');
        expect(asked.map((one) => one.body)).toEqual([
            { action: 'add', provider: 'microsoft', label: 'home' }
        ]);
    });
});

describe('the Add that waits on its provider', () => {
    it('reads the setup answer the page draws from', async () => {
        answers.set('GET /api/connect', {
            status: 200,
            body: setupWith({ google: true, microsoft: false })
        });
        expect(store.setup()).toBe(null);
        await store.loadSetup();
        expect(store.setup()?.ready).toEqual({ google: true, microsoft: false });
    });

    it('waits and opens the setup page, sending nothing, when the provider is known not set up', async () => {
        answers.set('GET /api/connect', {
            status: 200,
            body: setupWith({ google: false, microsoft: false })
        });
        await store.loadSetup();
        asked = [];
        expect(await store.add('calendar', 'google', 'home')).toBe('');
        expect(asked).toEqual([]);
        expect(opened).toEqual([ACCOUNT_SETUP_VIEW]);
        expect(store.waiting()).toEqual({ kind: 'calendar', provider: 'google', label: 'home' });
    });

    it('waits and opens the setup page when the server answers that the provider is not set up', async () => {
        answers.set('POST /api/mail', { status: 409, body: { error: 'setup' } });
        expect(await store.add('mail', 'google', 'home')).toBe('');
        expect(opened).toEqual([ACCOUNT_SETUP_VIEW]);
        expect(store.waiting()).toEqual({ kind: 'mail', provider: 'google', label: 'home' });
    });

    it('refuses a half whose client id is not Google shaped, and sends nothing', async () => {
        const said = await store.saveHalf('google', {
            clientId: 'not-an-id',
            clientSecret: 'shh',
            tenant: ''
        });
        expect(said).toBe(t('accounts.refused_google_id'));
        expect(asked).toEqual([]);
    });

    it('saves the half, reads the setup again and makes the Add that waited on it', async () => {
        answers.set('POST /api/mail', { status: 409, body: { error: 'setup' } });
        await store.add('mail', 'google', 'home');
        answers.set('POST /api/mail', { status: 200, body: { ok: true } });
        answers.set('GET /api/connect', {
            status: 200,
            body: setupWith({ google: true, microsoft: false })
        });
        asked = [];
        const said = await store.saveHalf('google', {
            clientId: GOOGLE_ID,
            clientSecret: 'the-secret',
            tenant: ''
        });
        expect(said).toBe('');
        expect(asked.map((one) => [one.method, one.url, one.body])).toEqual([
            [
                'POST',
                '/api/connect',
                {
                    action: 'save',
                    provider: 'google',
                    client_id: GOOGLE_ID,
                    client_secret: 'the-secret',
                    tenant: ''
                }
            ],
            ['GET', '/api/connect', {}],
            ['POST', '/api/mail', { action: 'add', provider: 'google', label: 'home' }]
        ]);
        expect(store.waiting()).toBe(null);
    });

    it('keeps an Add waiting on another provider when one provider is saved', async () => {
        answers.set('POST /api/mail', { status: 409, body: { error: 'setup' } });
        await store.add('mail', 'microsoft', 'home');
        answers.set('GET /api/connect', {
            status: 200,
            body: setupWith({ google: true, microsoft: false })
        });
        asked = [];
        await store.saveHalf('google', {
            clientId: GOOGLE_ID,
            clientSecret: 'the-secret',
            tenant: ''
        });
        expect(asked.map((one) => one.url)).toEqual(['/api/connect', '/api/connect']);
        expect(store.waiting()).toEqual({ kind: 'mail', provider: 'microsoft', label: 'home' });
        // The page was opened once, by the Add itself; the save opens nothing more.
        expect(opened).toEqual([ACCOUNT_SETUP_VIEW]);
    });
});

/** Make every request fail as a stopped server does, or answer a body that is not JSON. */
function failing(how: 'unreachable' | 'unreadable'): void {
    vi.stubGlobal('fetch', () =>
        how === 'unreachable'
            ? Promise.reject(new TypeError('Failed to fetch'))
            : Promise.resolve(new Response('<html>a proxy page</html>', { status: 502 }))
    );
}

describe('a press whose request fails', () => {
    it('says in words that an Add got no answer, and does not reject', async () => {
        failing('unreachable');
        await expect(store.add('calendar', 'google', 'home')).resolves.toBe(
            t('accounts.unreachable')
        );
        expect(store.busy('calendar')).toBe(false);
    });

    it('says in words that a Connect answer could not be read, and does not reject', async () => {
        failing('unreadable');
        await expect(store.connect('calendar', WORK)).resolves.toBe(t('accounts.unreadable'));
        expect(store.connecting('calendar', WORK)).toBe(false);
    });

    it('says in words that a Remove got no answer, and does not reject', async () => {
        failing('unreachable');
        await expect(store.remove('calendar', WORK)).resolves.toBe(t('accounts.unreachable'));
    });

    it('says in words that a Save answer could not be read, and does not reject', async () => {
        failing('unreadable');
        const said = store.saveHalf('google', {
            clientId: GOOGLE_ID,
            clientSecret: 'the-secret',
            tenant: ''
        });
        await expect(said).resolves.toBe(t('accounts.unreadable'));
    });

    it('says in words that the setup page could not be read, and keeps no setup', async () => {
        failing('unreachable');
        await store.loadSetup();
        expect(store.setup()).toBe(null);
        expect(store.setupFailed()).toBe(t('accounts.unreachable'));
    });
});

describe('the scopes the setup page lists', () => {
    it('lists each scope of one provider once, across both connectors, in first-seen order', () => {
        expect(scopesOf(setupWith({ google: true, microsoft: true }), 'microsoft')).toEqual([
            'Calendars.Read',
            'offline_access',
            'Mail.ReadWrite'
        ]);
    });
});
