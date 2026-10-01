// The mail endpoint: the five actions, the gates, and the connect flow's two halves.
//
// The page never sends a provider's id or an address: every action names a configured account or a
// thread of the state the poller published. A case here asserts that a thread the page invents
// reaches no provider, and another that the mail consent asks for the mail scopes alone and writes
// its token into the mail folder.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type { InboxThread } from '../../../../src/lib/data/model/index.ts';
import {
    SCOPE,
    ConnectStates,
    callbackPath,
    callbackUrl
} from '../../../../src/lib/server/accounts/connect/oauth.ts';
import {
    credentialFile,
    defaultConnectDir
} from '../../../../src/lib/server/accounts/connect/store.ts';
import {
    handleMail,
    handleMailCallback as handleCallback,
    type MailCallbackTarget
} from '../../../../src/lib/server/accounts/mail/routes.ts';
import { fsWrites } from '../../../../src/lib/server/core/json.ts';
import { readTriage } from '../../../../src/lib/server/accounts/mail/triage.ts';
import { ACCESS, GOOGLE, REFRESH, cleanup, fakeFetcher, scratch, writeAccount } from './fixture.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it } from '../../../fixtures/scratch.ts';

afterEach(cleanup);

/** The callback over a provider folder no case fills, so every half is the account file's own. */
function handleMailCallback(
    request: Request,
    over: Omit<MailCallbackTarget, 'providerDir'>
): Promise<Response> {
    return handleCallback(request, { ...over, providerDir: join(over.dir, 'connect') });
}

const TOKEN = 'the-write-token-of-this-case';
const WORDS = { ok: 'The account is connected.', bad: 'That link was not recognised.' };

const THREAD: InboxThread = {
    id: 'google-work-one',
    account: 'google-work',
    provider: 'google',
    sender: 'Ada <ada@example.invalid>',
    replyTo: 'Ada <ada@example.invalid>',
    subject: 'A new thing',
    received: '2026-09-16T10:00:00.000Z',
    snippet: 'a line',
    messages: 1,
    triage: { triaged: false }
};

/** Gmail's profile answer for the account a reply is sent from: its Message-ID's domain. */
const GOOGLE_PROFILE = { emailAddress: 'axel@example.nl' };

const GOOGLE_THREAD = {
    id: 'one',
    messages: [
        {
            id: 'm1',
            internalDate: String(Date.parse('2026-09-16T10:00:00.000Z')),
            snippet: 'a line',
            labelIds: ['INBOX'],
            payload: {
                headers: [
                    { name: 'From', value: 'Ada <ada@example.invalid>' },
                    { name: 'Subject', value: 'A new thing' },
                    { name: 'Message-Id', value: '<m1@example.invalid>' }
                ]
            }
        }
    ]
};

function post(body: unknown): Request {
    return new Request('http://127.0.0.1:8791/api/mail', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(body)
    });
}

function target(
    dir: string,
    over: {
        opened?: string[];
        refresh?: () => Promise<void>;
        republish?: () => void;
        fetcher?: typeof fetch;
        thread?: InboxThread | null;
        states?: ConnectStates;
    } = {}
) {
    const opened = over.opened ?? [];
    return {
        token: TOKEN,
        accounts: [GOOGLE],
        dir,
        providerDir: join(dir, 'connect'),
        book: { file: join(dir, 'local.yml'), writes: fsWrites(), reload: noop },
        redirect: callbackUrl(8791, 'mail'),
        states: over.states ?? new ConnectStates(),
        perSignal: 25,
        fetcher: over.fetcher ?? (() => Promise.reject(new Error('no fetch'))),
        refresh: over.refresh ?? (() => Promise.resolve()),
        republish: over.republish ?? noop,
        open: (url: string) => void opened.push(url),
        threadFor: (id: string) =>
            id === THREAD.id ? (over.thread === undefined ? THREAD : over.thread) : null
    };
}

describe('the mail endpoint', () => {
    it('refuses a request with no write token', async () => {
        const dir = scratch();
        const untokened = new Request('http://127.0.0.1:8791/api/mail', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
            body: JSON.stringify({ action: 'refresh' })
        });
        expect((await handleMail(untokened, target(dir))).status).toBe(403);
    });

    it('runs one round on refresh', async () => {
        const refresh = vi.fn(() => Promise.resolve());
        const answer = await handleMail(
            post({ action: 'refresh' }),
            target(scratch(), { refresh })
        );
        expect(answer.status).toBe(200);
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('opens a mail consent for the mail scopes alone and for no other account', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE, false);
        const opened: string[] = [];
        const answer = await handleMail(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, { opened })
        );
        expect(answer.status).toBe(200);
        const url = new URL(opened[0]);
        expect(url.searchParams.get('scope')).toBe(SCOPE.mail.google);
        expect(url.searchParams.get('scope')).not.toContain('calendar');
        expect(url.searchParams.get('redirect_uri')).toBe(
            `http://127.0.0.1:8791${callbackPath('mail')}`
        );
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');

        const nobody = await handleMail(
            post({ action: 'connect', account: 'google-elsewhere' }),
            target(dir, { opened })
        );
        expect(nobody.status).toBe(400);
        expect(opened).toHaveLength(1);
    });

    it('writes one thread triage note and publishes again over it', async () => {
        const dir = scratch();
        const republish = vi.fn();
        const answer = await handleMail(
            post({
                action: 'triage',
                thread: THREAD.id,
                fields: { kind: 'reply', what: 'Needs an answer', bogus: 'ignored' }
            }),
            target(dir, { republish })
        );
        expect(answer.status).toBe(200);
        expect(republish).toHaveBeenCalledTimes(1);
        expect(readTriage(dir).notes[THREAD.id]).toMatchObject({
            kind: 'reply',
            what: 'Needs an answer'
        });
        expect(readTriage(dir).notes[THREAD.id]).not.toHaveProperty('bogus');
    });

    it('writes no note for a thread the published state does not hold, or for no field', async () => {
        const dir = scratch();
        expect(
            (
                await handleMail(
                    post({
                        action: 'triage',
                        thread: 'google-work-elsewhere',
                        fields: { triaged: true }
                    }),
                    target(dir)
                )
            ).status
        ).toBe(400);
        expect(
            (
                await handleMail(
                    post({ action: 'triage', thread: THREAD.id, fields: { kind: 'shout' } }),
                    target(dir)
                )
            ).status
        ).toBe(400);
        expect(readTriage(dir).notes).toEqual({});
    });

    it('sends a reply on the thread and runs a round after it', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: GOOGLE_THREAD },
            { when: (url) => url.endsWith('/users/me/profile'), body: GOOGLE_PROFILE },
            { when: (url) => url.includes('/messages/send'), body: { id: 'sent-1' } }
        ]);
        const refresh = vi.fn(() => Promise.resolve());
        const answer = await handleMail(
            post({ action: 'reply', thread: THREAD.id, body: 'Beste Ada,' }),
            target(dir, { fetcher: fake.fetcher, refresh })
        );
        expect(answer.status).toBe(200);
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(fake.calls.some((call) => call.url.includes('/messages/send'))).toBe(true);
        for (const call of fake.calls) expect(call.url).not.toContain('/drafts');
    });

    it('answers a refused send as one sentence with the status and the provider code', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: GOOGLE_THREAD },
            { when: (url) => url.endsWith('/users/me/profile'), body: GOOGLE_PROFILE },
            {
                when: (url) => url.includes('/messages/send'),
                body: { error: { status: 'PERMISSION_DENIED' } },
                status: 403
            }
        ]);
        const answer = await handleMail(
            post({ action: 'reply', thread: THREAD.id, body: 'Beste Ada,' }),
            target(dir, { fetcher: fake.fetcher })
        );
        expect(answer.status).toBe(400);
        expect(await answer.json()).toEqual({ error: 'google: 403 PERMISSION_DENIED' });
    });

    it('sends nothing with no words, and nothing for a thread the state does not hold', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher([{ when: () => true, body: {} }]);
        for (const body of [
            { action: 'reply', thread: THREAD.id, body: '   ' },
            { action: 'reply', thread: 'https://elsewhere.example/steal', body: 'text' },
            { action: 'archive', thread: 'google-work-elsewhere' }
        ]) {
            expect(
                (await handleMail(post(body), target(dir, { fetcher: fake.fetcher }))).status
            ).toBe(400);
        }
        expect(fake.calls).toEqual([]);
    });

    it('archives the thread at the provider and runs a round after it', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE);
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one/modify'), body: { id: 'one' } }
        ]);
        const refresh = vi.fn(() => Promise.resolve());
        const answer = await handleMail(
            post({ action: 'archive', thread: THREAD.id }),
            target(dir, { fetcher: fake.fetcher, refresh })
        );
        expect(answer.status).toBe(200);
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(fake.calls.some((call) => call.url.includes('/modify'))).toBe(true);
    });

    it('refuses an action it does not know and a body that is not JSON', async () => {
        const dir = scratch();
        expect((await handleMail(post({ action: 'delete' }), target(dir))).status).toBe(400);
        const bad = new Request('http://127.0.0.1:8791/api/mail', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'sec-fetch-site': 'same-origin',
                'x-oculus-token': TOKEN
            },
            body: 'not json'
        });
        expect((await handleMail(bad, target(dir))).status).toBe(400);
    });
});

describe('the mail callback', () => {
    it('takes the state once and writes the refresh token into the mail folder', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE, false);
        const states = new ConnectStates();
        const opened: string[] = [];
        const fake = fakeFetcher([]);
        await handleMail(
            post({ action: 'connect', account: 'google-work' }),
            target(dir, { opened, states })
        );
        const state = new URL(opened[0]).searchParams.get('state') ?? '';
        const refresh = vi.fn(() => Promise.resolve());
        const answer = await handleMailCallback(
            new Request(`http://127.0.0.1:8791${callbackPath('mail')}?state=${state}&code=a-code`),
            { accounts: [GOOGLE], dir, states, fetcher: fake.fetcher, refresh, words: WORDS }
        );
        expect(answer.status).toBe(200);
        expect(await answer.text()).toContain(WORDS.ok);
        const held: unknown = JSON.parse(readFileSync(credentialFile(dir, GOOGLE), 'utf8'));
        expect(held).toMatchObject({ refresh_token: REFRESH });
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(states.size).toBe(0);

        // The same state a second time writes nothing at all.
        const again = await handleMailCallback(
            new Request(`http://127.0.0.1:8791${callbackPath('mail')}?state=${state}&code=a-code`),
            { accounts: [GOOGLE], dir, states, fetcher: fake.fetcher, refresh, words: WORDS }
        );
        expect(again.status).toBe(400);
        expect(await again.text()).toContain(WORDS.bad);
    });

    it('writes nothing for a state this process never minted', async () => {
        const dir = scratch();
        writeAccount(dir, GOOGLE, false);
        const fetcher = vi.fn(() =>
            Promise.reject(new Error('no fetch'))
        ) as unknown as typeof fetch;
        const answer = await handleMailCallback(
            new Request(`http://127.0.0.1:8791${callbackPath('mail')}?state=invented&code=a-code`),
            {
                accounts: [GOOGLE],
                dir,
                states: new ConnectStates(),
                fetcher,
                refresh: () => Promise.resolve(),
                words: WORDS
            }
        );
        expect(answer.status).toBe(400);
        const held: unknown = JSON.parse(readFileSync(credentialFile(dir, GOOGLE), 'utf8'));
        expect(held).not.toHaveProperty('refresh_token');
    });
});

describe('the connector folders and scopes', () => {
    it('gives mail its own folder, its own callback and scopes that carry no calendar right', () => {
        expect(SCOPE.mail.google).toBe(
            'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send'
        );
        expect(SCOPE.mail.microsoft).toBe('Mail.ReadWrite Mail.Send offline_access');
        expect(SCOPE.calendar.google).not.toContain('gmail');
        expect(SCOPE.calendar.microsoft).not.toContain('Mail');
        expect(callbackPath('mail')).toBe('/api/mail/callback');
        expect(callbackPath('calendar')).toBe('/api/calendar/callback');
        expect(defaultConnectDir('mail').endsWith(join('.oculus', 'mail'))).toBe(true);
        expect(defaultConnectDir('calendar').endsWith(join('.oculus', 'calendar'))).toBe(true);
        expect(defaultConnectDir('mail')).not.toBe(defaultConnectDir('calendar'));
        expect(ACCESS).toBeTruthy();
    });
});

describe('a triage write of the wrong shape', () => {
    it('refuses an empty fields map and a triaged that is not a boolean', async () => {
        const dir = scratch();
        for (const fields of [{}, { triaged: 'yes' }]) {
            const answer = await handleMail(
                post({ action: 'triage', thread: THREAD.id, fields }),
                target(dir)
            );
            expect(answer.status).toBe(400);
            expect(await answer.json()).toEqual({ error: 'no field to write' });
        }
        expect(readTriage(dir).notes).toEqual({});
    });

    it('sets the text and clears the triaged flag of a note, and no other field', async () => {
        const dir = scratch();
        const wrote = async (fields: unknown): Promise<number> =>
            (await handleMail(post({ action: 'triage', thread: THREAD.id, fields }), target(dir)))
                .status;
        expect(await wrote({ triaged: true })).toBe(200);
        expect(readTriage(dir).notes[THREAD.id]).toHaveProperty('triaged', true);
        expect(await wrote({ what: 'w', triaged: false })).toBe(200);
        const note = readTriage(dir).notes[THREAD.id];
        expect(Object.keys(note).sort()).toEqual(['what', 'written']);
        expect(note.what).toBe('w');
    });

    it('answers a reply with a body that is not text as a reply with no words', async () => {
        const dir = scratch();
        const answer = await handleMail(
            post({ action: 'reply', thread: THREAD.id, body: 3 }),
            target(dir)
        );
        expect(answer.status).toBe(400);
        expect(await answer.json()).toEqual({ error: 'an answer needs words' });
    });
});
