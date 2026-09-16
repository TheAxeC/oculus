// The two writes to a mailbox: the reply each provider sends on the thread, and the archive. Every
// provider call goes through an injected fetcher, so no network call is made.
//
// The case that matters most is the last one: no draft is ever created at either provider, which is
// asserted by the drafts endpoints never being among the addresses either write called.

import { afterEach, describe, expect, it } from 'vitest';
import { archiveGoogle, rawMessage, replyGoogle } from '../../../src/lib/server/mail/google.ts';
import { archiveMicrosoft, replyMicrosoft } from '../../../src/lib/server/mail/microsoft.ts';
import { ACCESS, addresses, cleanup, fakeFetcher, type Fake } from './fixture.ts';

afterEach(cleanup);

/** The fetcher a case gets when it forgets to inject one: it reaches nothing and says so. */
const NO_FETCH: typeof fetch = () => Promise.reject(new Error('no fetcher was injected'));

const ARGS = { token: ACCESS, key: 'google-work', perSignal: 25, fetcher: NO_FETCH };

/** The whole address one call was made to, so a case fails on a path that is nearly right. */
function pathOf(url: string): string {
    return new URL(url).pathname;
}

/** Gmail's metadata answer for the thread a write is made on. */
const THREAD = {
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
                    { name: 'Message-Id', value: '<m1@example.invalid>' },
                    { name: 'References', value: '<m0@example.invalid>' }
                ]
            }
        }
    ]
};

/** Graph's answer for the conversation a write is made on. */
const CONVERSATION = {
    value: [
        {
            id: 'g1',
            conversationId: 'c1',
            subject: 'A new thing',
            from: { emailAddress: { name: 'Ada', address: 'ada@example.invalid' } },
            receivedDateTime: '2026-09-16T10:00:00Z',
            bodyPreview: 'a line',
            categories: [],
            parentFolderId: 'inbox-folder',
            webLink: 'https://outlook.office.com/mail/g1'
        }
    ]
};

/** The drafts endpoints of both providers, which nothing in the connector may ever call. */
const DRAFTS = ['/drafts', 'createReply', 'createReplyAll', 'createForward'];

function noDraftsCalled(fake: Fake): void {
    for (const url of addresses(fake)) {
        for (const endpoint of DRAFTS) expect(url).not.toContain(endpoint);
    }
}

describe('the raw message a Google reply is sent as', () => {
    it('carries the recipient, the threading headers and the body, each on one line', () => {
        const raw = rawMessage({
            to: 'Ada <ada@example.invalid>',
            subject: 'Re: A new thing',
            inReplyTo: '<m1@example.invalid>',
            references: '<m0@example.invalid> <m1@example.invalid>',
            body: 'Beste Ada,\n\nGraag.'
        });
        const decoded = Buffer.from(raw, 'base64url').toString('utf8');
        expect(decoded).toContain('To: Ada <ada@example.invalid>\r\n');
        expect(decoded).toContain('Subject: Re: A new thing\r\n');
        expect(decoded).toContain('In-Reply-To: <m1@example.invalid>\r\n');
        expect(decoded).toContain('References: <m0@example.invalid> <m1@example.invalid>\r\n');
        expect(decoded).toContain('\r\n\r\nBeste Ada,\n\nGraag.\r\n');
    });

    it('folds a newline inside a header value away rather than starting a header with it', () => {
        const decoded = Buffer.from(
            rawMessage({
                to: 'Ada\r\nBcc: someone@example.invalid',
                subject: 'One',
                inReplyTo: '',
                references: '',
                body: 'text'
            }),
            'base64url'
        ).toString('utf8');
        expect(decoded).toContain('To: Ada Bcc: someone@example.invalid\r\n');
        expect(decoded.split('\r\n').filter((line) => line.startsWith('Bcc:'))).toEqual([]);
    });
});

describe('a Google write', () => {
    it('sends the reply on the thread through messages/send and creates no draft', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: THREAD },
            { when: (url) => url.includes('/messages/send'), body: { id: 'sent-1' } }
        ]);
        await replyGoogle({ ...ARGS, fetcher: fake.fetcher }, 'one', 'Beste Ada,');
        const sent = fake.calls.find((call) => call.url.includes('/messages/send'));
        expect(sent?.method).toBe('POST');
        const body = sent?.body as { raw: string; threadId: string };
        expect(body.threadId).toBe('one');
        const decoded = Buffer.from(body.raw, 'base64url').toString('utf8');
        expect(decoded).toContain('To: Ada <ada@example.invalid>');
        expect(decoded).toContain('Subject: Re: A new thing');
        expect(decoded).toContain('In-Reply-To: <m1@example.invalid>');
        expect(decoded).toContain('References: <m0@example.invalid> <m1@example.invalid>');
        noDraftsCalled(fake);
    });

    it('takes the thread off the inbox by removing that one label', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one/modify'), body: { id: 'one' } }
        ]);
        await archiveGoogle({ ...ARGS, fetcher: fake.fetcher }, 'one');
        const call = fake.calls.find((one) => one.url.includes('/modify'));
        expect(call?.method).toBe('POST');
        expect(call?.body).toEqual({ removeLabelIds: ['INBOX'] });
        noDraftsCalled(fake);
    });

    it('answers the provider own refusal line and sends nothing further', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: THREAD },
            {
                when: (url) => url.includes('/messages/send'),
                body: { error: { status: 'PERMISSION_DENIED', message: 'ada@example.invalid' } },
                status: 403
            }
        ]);
        await expect(
            replyGoogle({ ...ARGS, fetcher: fake.fetcher }, 'one', 'Beste Ada,')
        ).rejects.toThrow('google: 403 PERMISSION_DENIED');
        // The provider's own body can name the correspondent; the line the view shows does not.
        noDraftsCalled(fake);
    });
});

describe('a Microsoft write', () => {
    it('replies on the conversation newest message with a comment, and creates no draft', async () => {
        const fake = fakeFetcher([
            {
                when: (url) => pathOf(url) === '/v1.0/me/messages/g1/reply',
                body: {}
            },
            { when: (url) => pathOf(url) === '/v1.0/me/messages', body: CONVERSATION }
        ]);
        await replyMicrosoft(
            { ...ARGS, key: 'microsoft-uni', fetcher: fake.fetcher },
            'c1',
            'Beste Ada,'
        );
        const call = fake.calls.find((one) => one.url.includes('/reply'));
        expect(call?.method).toBe('POST');
        // The whole path, so an address without the /me root is a failure rather than a match.
        expect(pathOf(call?.url ?? 'https://x/')).toBe('/v1.0/me/messages/g1/reply');
        expect(call?.body).toEqual({ comment: 'Beste Ada,' });
        noDraftsCalled(fake);
    });

    it('moves every inbox message of the conversation to the archive folder', async () => {
        const fake = fakeFetcher([
            {
                when: (url) => pathOf(url) === '/v1.0/me/messages/g1/move',
                body: { id: 'moved' }
            },
            { when: (url) => url.includes('/mailFolders/inbox'), body: { id: 'inbox-folder' } },
            { when: (url) => pathOf(url) === '/v1.0/me/messages', body: CONVERSATION }
        ]);
        await archiveMicrosoft({ ...ARGS, key: 'microsoft-uni', fetcher: fake.fetcher }, 'c1');
        const call = fake.calls.find((one) => one.url.includes('/move'));
        expect(call?.method).toBe('POST');
        expect(pathOf(call?.url ?? 'https://x/')).toBe('/v1.0/me/messages/g1/move');
        expect(call?.body).toEqual({ destinationId: 'archive' });
        noDraftsCalled(fake);
    });
});
