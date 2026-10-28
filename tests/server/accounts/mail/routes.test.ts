// The mail endpoint: the gates.
//
// The page never sends a provider's id or an address: every action names a configured account or a
// thread of the state the poller published.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type { InboxThread } from '../../../../src/lib/data/model/index.ts';
import {
    ConnectStates,
    callbackPath,
    callbackUrl
} from '../../../../src/lib/server/accounts/connect/oauth.ts';
import { credentialFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import {
    handleMail,
    handleMailCallback as handleCallback,
    type MailCallbackTarget
} from '../../../../src/lib/server/accounts/mail/routes.ts';
import { GOOGLE, cleanup, scratch, writeAccount } from './fixture.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { bookIn } from '../book.ts';
import { PROVIDERS } from '../providers.ts';
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
        providers: PROVIDERS,
        book: bookIn(dir),
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
});

describe('the mail callback', () => {
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
                providers: PROVIDERS,
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
