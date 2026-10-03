// The two writes to a mailbox: the reply each provider sends on the thread, and the archive. Every
// provider call goes through an injected fetcher, so no network call is made.
//
// The assertion that matters most is that no draft is ever created at either provider: the drafts
// endpoints are never among the addresses either write called.

import { afterEach, describe, expect } from 'vitest';
import {
    archiveGoogle,
    rawMessage,
    replyGoogle
} from '../../../../src/lib/server/accounts/mail/google.ts';
import {
    archiveMicrosoft,
    replyMicrosoft
} from '../../../../src/lib/server/accounts/mail/microsoft.ts';
import { ACCESS, addresses, cleanup, fakeFetcher, type Fake } from './fixture.ts';
import { it } from '../../../fixtures/scratch.ts';

afterEach(cleanup);

/** The fetcher a case gets when it forgets to inject one: it reaches nothing and says so. */
const NO_FETCH: typeof fetch = () => Promise.reject(new Error('no fetcher was injected'));

const ARGS = { token: ACCESS, key: 'google-work', perSignal: 25, fetcher: NO_FETCH };

/** Gmail's profile answer for the account a write is made from: its own address. */
const PROFILE = { emailAddress: 'axel@example.nl', messagesTotal: 3, threadsTotal: 2 };

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
    it('carries the recipient, the threading headers and the body, each on one line', async () => {
        const raw = await rawMessage({
            sender: 'axel@example.nl',
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
        expect(decoded).toMatch(/\r\nMessage-ID: <[^>\r\n]+>\r\n/);
        expect(decoded).toMatch(/\r\nDate: [^\r\n]+\r\n/);
    });

    it('carries a Message-ID on the domain of the account it is sent from', async () => {
        const { headers } = await readRaw({ ...REPLY, sender: 'axel@mail.example.nl' });
        const id = headerOf(headers, 'Message-ID') ?? '';
        expect(id).toMatch(/^<[0-9a-f-]{36}@mail\.example\.nl>$/);
        expect(id).not.toContain('localhost');
    });
});

/** A raw message decoded to its text, its header lines unfolded and its body apart. */
async function readRaw(fields: Parameters<typeof rawMessage>[0]): Promise<{
    headers: string[];
    body: string;
}> {
    const decoded = Buffer.from(await rawMessage(fields), 'base64url').toString('utf8');
    const cut = decoded.indexOf('\r\n\r\n');
    const head = decoded.slice(0, cut).replace(/\r\n[ \t]+/g, ' ');
    return { headers: head.split('\r\n'), body: decoded.slice(cut + 4) };
}

/** The value of one header, by name, or undefined when the message carries none. */
function headerOf(headers: string[], name: string): string | undefined {
    const line = headers.find((one) => one.toLowerCase().startsWith(`${name.toLowerCase()}:`));
    return line?.slice(name.length + 1).trim();
}

/** A header value with its RFC 2047 encoded words decoded, B and Q alike. */
function decodeWords(value: string): string {
    return value
        .replace(/\?=\s+=\?/g, '?==?')
        .replace(
            /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
            (_whole, _set, kind: string, text: string) => {
                if (kind.toUpperCase() === 'B') return Buffer.from(text, 'base64').toString('utf8');
                const bytes = text
                    .replace(/_/g, ' ')
                    .replace(/=([0-9A-Fa-f]{2})/g, (_hex, code: string) => `%${code}`);
                return decodeURIComponent(bytes);
            }
        );
}

/** A quoted-printable body decoded to its text. */
function fromQuotedPrintable(body: string): string {
    const joined = body.replace(/=\r\n/g, '');
    return decodeURIComponent(joined.replace(/%/g, '%25').replace(/=([0-9A-Fa-f]{2})/g, '%$1'));
}

const REPLY = {
    sender: 'axel@example.nl',
    to: 'Jens <j@example.se>',
    subject: 'Re: Linkoping rapport',
    inReplyTo: '<m1@example.invalid>',
    references: '<m0@example.invalid> <m1@example.invalid>',
    body: 'Hej Jens,'
};

describe('the headers a Google reply is written with', () => {
    it('writes a subject and a name outside ASCII as encoded words that decode to them', async () => {
        const { headers } = await readRaw({
            ...REPLY,
            to: 'J\u00f6ns <j@example.se>',
            subject: 'Re: Link\u00f6ping rapport'
        });
        const subject = headerOf(headers, 'Subject') ?? '';
        const to = headerOf(headers, 'To') ?? '';
        expect(subject).toMatch(/^=\?UTF-8\?[BQ]\?/i);
        expect(to).toMatch(/^=\?UTF-8\?[BQ]\?/i);
        expect(decodeWords(subject)).toBe('Re: Link\u00f6ping rapport');
        expect(decodeWords(to)).toBe('J\u00f6ns <j@example.se>');
        expect(headers.join('\n')).toMatch(/^[\x20-\x7e\n]*$/);
    });

    it('carries a body outside ASCII in a transfer encoding that decodes back to it', async () => {
        const { headers, body } = await readRaw({ ...REPLY, body: 'Hej J\u00e5ns,\nTack.' });
        const encoding = headerOf(headers, 'Content-Transfer-Encoding');
        expect(encoding).toMatch(/^(quoted-printable|base64)$/);
        const text =
            encoding === 'base64'
                ? Buffer.from(body, 'base64').toString('utf8')
                : fromQuotedPrintable(body);
        expect(text.replace(/\r\n/g, '\n').trimEnd()).toBe('Hej J\u00e5ns,\nTack.');
    });

    it('carries the threading headers when given and leaves them out when empty', async () => {
        const given = await readRaw(REPLY);
        expect(headerOf(given.headers, 'In-Reply-To')).toBe('<m1@example.invalid>');
        expect(headerOf(given.headers, 'References')).toBe(
            '<m0@example.invalid> <m1@example.invalid>'
        );
        const empty = await readRaw({ ...REPLY, inReplyTo: '', references: '' });
        expect(headerOf(empty.headers, 'In-Reply-To')).toBeUndefined();
        expect(headerOf(empty.headers, 'References')).toBeUndefined();
    });

    it.each([
        {
            name: 'a newline inside the recipient',
            fields: { ...REPLY, to: 'Ada\r\nBcc: someone@example.invalid' },
            held: [['To', 'someone@example.invalid']]
        },
        {
            name: 'a line break inside the subject',
            fields: { ...REPLY, subject: 'hi\r\nBcc: x@y' },
            held: []
        }
    ])('starts no Bcc header from $name', async ({ fields, held }) => {
        const { headers } = await readRaw(fields);
        for (const [name, text] of held) expect(headerOf(headers, name)).toContain(text);
        expect(headers.filter((line) => /^bcc:/i.test(line))).toEqual([]);
    });
});

describe('a Google write', () => {
    it('sends the reply on the thread through messages/send and creates no draft', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: THREAD },
            { when: (url) => url.endsWith('/users/me/profile'), body: PROFILE },
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
        expect(decoded).toMatch(/\r\nMessage-ID: <[0-9a-f-]{36}@example\.nl>\r\n/);
        expect(decoded).not.toContain('@localhost');
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
            { when: (url) => url.endsWith('/users/me/profile'), body: PROFILE },
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

    it('answers a profile read that fails, and sends nothing', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: THREAD },
            {
                when: (url) => url.endsWith('/users/me/profile'),
                body: { error: { status: 'UNAVAILABLE', message: 'try later' } },
                status: 503
            },
            { when: (url) => url.includes('/messages/send'), body: { id: 'sent-1' } }
        ]);
        await expect(
            replyGoogle({ ...ARGS, fetcher: fake.fetcher }, 'one', 'Beste Ada,')
        ).rejects.toThrow('google: 503 UNAVAILABLE');
        expect(fake.calls.filter((call) => call.url.includes('/messages/send'))).toEqual([]);
    });

    it('answers a profile with no address, and sends nothing', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('/threads/one'), body: THREAD },
            { when: (url) => url.endsWith('/users/me/profile'), body: { messagesTotal: 3 } },
            { when: (url) => url.includes('/messages/send'), body: { id: 'sent-1' } }
        ]);
        await expect(
            replyGoogle({ ...ARGS, fetcher: fake.fetcher }, 'one', 'Beste Ada,')
        ).rejects.toThrow('google: the account has no address to send from');
        expect(fake.calls.filter((call) => call.url.includes('/messages/send'))).toEqual([]);
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
