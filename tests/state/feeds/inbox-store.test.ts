// The inbox client store's commands: the sentence each one answers when the endpoint refused it or
// no readable answer came back, which the Inbox view and its cards say as it came.
//
// Nothing opens a socket: `fetch` is a stub that hands back the answer the case wants.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxThread } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const THREAD: InboxThread = {
    id: 'thread-one',
    account: 'google-work',
    provider: 'google',
    sender: 'Ada',
    replyTo: 'Ada',
    subject: 'Paper',
    received: '2026-09-16T11:00:00.000Z',
    snippet: 'the snippet of Paper',
    messages: 1,
    triage: { triaged: false }
};

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.writes.setToken('the-write-token-of-this-case');
});

afterEach(() => vi.unstubAllGlobals());

describe('what the inbox store commands answer', () => {
    it('answers ok and no sentence when the endpoint took the command', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ ok: true }))));
        expect(await client.inbox.archive(THREAD)).toEqual({ ok: true });
    });

    it('answers a refusal in the catalog sentence carrying its code', async () => {
        vi.stubGlobal('fetch', () =>
            Promise.resolve(
                new Response(JSON.stringify({ error: 'no such thread' }), { status: 400 })
            )
        );
        expect(await client.inbox.reply(THREAD, 'Thanks')).toEqual({
            ok: false,
            error: t('inbox.refused', 'no such thread')
        });
    });

    it('answers a command no answer came back for, and one whose answer was not JSON, in words', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
        expect(await client.inbox.triage(THREAD, { triaged: true })).toEqual({
            ok: false,
            error: t('accounts.unreachable')
        });
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })));
        expect(await client.inbox.refresh()).toEqual({
            ok: false,
            error: t('accounts.unreadable')
        });
    });
});

describe('a refusal whose code is not text', () => {
    /** Answer every request with the JSON text given and the status given. */
    function answering(body: string, status: number): void {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(body, { status })));
    }

    it.each([
        ['{"error":3}'],
        ['{"error":null}'],
        ['{"error":["x"]}'],
        ['{"error":{"code":"x"}}'],
        ['{"error":""}'],
        ['{"error":true}'],
        ['[]'],
        ['null'],
        ['"x"'],
        ['3']
    ])('says the general refusal for the body %s of a refused command', async (body) => {
        answering(body, 400);
        expect(await client.inbox.archive(THREAD)).toStrictEqual({
            ok: false,
            error: t('inbox.refused', '')
        });
    });

    it('takes a command the endpoint answered with a status below 400 as taken, whatever the body', async () => {
        for (const body of ['{"error":3}', '[]', 'null', '"x"']) {
            answering(body, 200);
            expect(await client.inbox.archive(THREAD)).toStrictEqual({ ok: true });
        }
    });

    it('says the code of a refusal only when it is text', async () => {
        answering('{"error":"stale","reason":3}', 409);
        expect(await client.inbox.triage(THREAD, { triaged: true })).toStrictEqual({
            ok: false,
            error: t('inbox.refused', 'stale')
        });
    });
});
