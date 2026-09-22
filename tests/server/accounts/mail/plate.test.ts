// The plate rule over fixture answers for both providers: each of the three signals, the two drops
// the unlabeled signal carries, the two drops every signal carries, the cap, and the union without
// duplicates.
//
// Every provider call goes through an injected fetcher. No network call is made here.

import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { isChainSubject } from '../../../../src/lib/data/accounts/mail.ts';
import { readGoogleMail } from '../../../../src/lib/server/accounts/mail/google.ts';
import { readMicrosoftMail } from '../../../../src/lib/server/accounts/mail/microsoft.ts';
import { kept, plate, type Candidate } from '../../../../src/lib/server/accounts/mail/plate.ts';
import { ACCESS, addresses, cleanup, fakeFetcher, urlOf } from './fixture.ts';
import { sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

afterEach(cleanup);

const ARGS = { token: ACCESS, key: 'google-work', perSignal: 25, fetcher: fetch };

function candidate(
    signal: Candidate['signal'],
    over: Partial<Candidate['thread']> = {}
): Candidate {
    return {
        signal,
        thread: {
            id: 'one',
            sender: 'Ada',
            replyTo: 'Ada',
            subject: 'A new thing',
            received: '2026-09-16T10:00:00.000Z',
            snippet: 'a line',
            messages: 1,
            ownNewest: false,
            trashed: false,
            ...over
        }
    };
}

describe('the subject test', () => {
    it('reads every casing of the two chain words and nothing else', () => {
        for (const subject of ['Re: a', 'RE: a', 'Fwd: a', 'FW: a', 're : a', 'fwd: a']) {
            expect(isChainSubject(subject)).toBe(true);
        }
        for (const subject of ['Reply about a', 'Fwdward planning', 'A new thing', '']) {
            expect(isChainSubject(subject)).toBe(false);
        }
    });
});

describe('the drops', () => {
    it('drops a chain and a multi-message thread from the unlabeled signal alone', () => {
        expect(kept(candidate('unlabeled', { subject: 'Re: a' }))).toBe(false);
        expect(kept(candidate('unlabeled', { messages: 2 }))).toBe(false);
        expect(kept(candidate('unread', { subject: 'Re: a', messages: 5 }))).toBe(true);
        expect(kept(candidate('todo', { subject: 'Fwd: a', messages: 5 }))).toBe(true);
    });

    it('drops a thread whose newest message is the reader own, or is in the trash, always', () => {
        for (const signal of ['unread', 'todo', 'unlabeled'] as const) {
            expect(kept(candidate(signal, { ownNewest: true }))).toBe(false);
            expect(kept(candidate(signal, { trashed: true }))).toBe(false);
        }
    });

    it('unions the signals without duplicates and answers newest first', () => {
        const rows = plate([
            candidate('unread', { id: 'old', received: '2026-09-10T10:00:00.000Z' }),
            candidate('todo', { id: 'new', received: '2026-09-16T10:00:00.000Z' }),
            candidate('unlabeled', { id: 'old', received: '2026-09-10T10:00:00.000Z' }),
            candidate('unread', { id: 'gone', ownNewest: true })
        ]);
        expect(rows.map((one) => one.id)).toEqual(['new', 'old']);
    });
});

/** Gmail's answer for one thread listing. */
function googleList(ids: string[]): unknown {
    return { threads: ids.map((id) => ({ id })) };
}

/** Gmail's metadata answer for one thread. */
function googleThread(
    id: string,
    over: { subject?: string; labels?: string[]; messages?: number; replyTo?: string } = {}
): unknown {
    const headers = [
        { name: 'From', value: 'Ada <ada@example.invalid>' },
        ...(over.replyTo === undefined ? [] : [{ name: 'Reply-To', value: over.replyTo }]),
        { name: 'Subject', value: over.subject ?? `Subject of ${id}` },
        { name: 'Message-Id', value: `<${id}@example.invalid>` }
    ];
    const count = over.messages ?? 1;
    const messages = Array.from({ length: count }, (_value, at) => ({
        id: `${id}-${at}`,
        internalDate: String(Date.parse('2026-09-16T10:00:00.000Z')),
        snippet: `the snippet of ${id}`,
        labelIds: at === count - 1 ? (over.labels ?? ['INBOX', 'UNREAD']) : ['INBOX'],
        payload: { headers }
    }));
    return { id, messages };
}

describe('the Google plate', () => {
    it('reads the three signals, caps each, and drops what the rule drops', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('is%3Aunread'), body: googleList(['unread-one']) },
            { when: (url) => url.includes('label%3Atodo'), body: googleList(['todo-one']) },
            {
                when: (url) => url.includes('has%3Anouserlabels'),
                body: googleList(['plain', 'chain', 'long', 'sent', 'binned'])
            },
            {
                when: (url) =>
                    url.endsWith('unread-one?format=metadata') ||
                    url.includes('/threads/unread-one'),
                body: googleThread('unread-one')
            },
            { when: (url) => url.includes('/threads/todo-one'), body: googleThread('todo-one') },
            { when: (url) => url.includes('/threads/plain'), body: googleThread('plain') },
            {
                when: (url) => url.includes('/threads/chain'),
                body: googleThread('chain', { subject: 'Re: an answer' })
            },
            {
                when: (url) => url.includes('/threads/long'),
                body: googleThread('long', { messages: 3 })
            },
            {
                when: (url) => url.includes('/threads/sent'),
                body: googleThread('sent', { labels: ['INBOX', 'SENT'] })
            },
            {
                when: (url) => url.includes('/threads/binned'),
                body: googleThread('binned', { labels: ['TRASH'] })
            }
        ]);
        const candidates = await readGoogleMail({ ...ARGS, fetcher: fake.fetcher });
        expect(
            plate(candidates)
                .map((one) => one.id)
                .sort()
        ).toEqual(['plain', 'todo-one', 'unread-one']);
        // Each listing asks for the configured cap, and each thread is read as metadata alone.
        const asked = addresses(fake).filter((url) => url.includes('/threads?'));
        expect(asked).toHaveLength(3);
        for (const url of asked) expect(url).toContain('maxResults=25');
        for (const url of addresses(fake).filter((url) => url.includes('/threads/'))) {
            expect(url).toContain('format=metadata');
        }
    });

    it('carries the sender, the subject, the snippet and the count of one kept thread', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('is%3Aunread'), body: googleList(['one']) },
            { when: (url) => url.includes('label%3Atodo'), body: googleList([]) },
            { when: (url) => url.includes('has%3Anouserlabels'), body: googleList([]) },
            {
                when: (url) => url.includes('/threads/one'),
                body: googleThread('one', { messages: 2 })
            }
        ]);
        const rows = plate(await readGoogleMail({ ...ARGS, fetcher: fake.fetcher }));
        expect(rows).toEqual([
            {
                id: 'one',
                sender: 'Ada <ada@example.invalid>',
                replyTo: 'Ada <ada@example.invalid>',
                subject: 'Subject of one',
                received: '2026-09-16T10:00:00.000Z',
                snippet: 'the snippet of one',
                messages: 2,
                url: 'https://mail.google.com/mail/u/0/#inbox/one',
                ownNewest: false,
                trashed: false
            }
        ]);
    });
});

describe('the Google reply-to address', () => {
    it('names the Reply-To header when the newest message carries one, and the From otherwise', async () => {
        const fake = fakeFetcher([
            { when: (url) => url.includes('is%3Aunread'), body: googleList(['desk', 'plain']) },
            { when: (url) => url.includes('label%3Atodo'), body: googleList([]) },
            { when: (url) => url.includes('has%3Anouserlabels'), body: googleList([]) },
            {
                when: (url) => url.includes('/threads/desk'),
                body: googleThread('desk', { replyTo: 'Desk <desk@example.invalid>' })
            },
            { when: (url) => url.includes('/threads/plain'), body: googleThread('plain') }
        ]);
        const rows = plate(await readGoogleMail({ ...ARGS, fetcher: fake.fetcher }));
        const by = Object.fromEntries(rows.map((one) => [one.id, one]));
        expect(by.desk.replyTo).toBe('Desk <desk@example.invalid>');
        expect(by.desk.sender).toBe('Ada <ada@example.invalid>');
        expect(by.plain.replyTo).toBe('Ada <ada@example.invalid>');
    });
});

/** Graph's answer for one message row of a listing. */
function graphMessage(
    id: string,
    over: {
        conversationId?: string;
        subject?: string;
        categories?: string[];
        folder?: string;
        replyTo?: string;
    } = {}
): Record<string, unknown> {
    return {
        id,
        conversationId: over.conversationId ?? id,
        subject: over.subject ?? `Subject of ${id}`,
        from: { emailAddress: { name: 'Ada', address: 'ada@example.invalid' } },
        ...(over.replyTo === undefined
            ? {}
            : { replyTo: [{ emailAddress: { name: 'Desk', address: over.replyTo } }] }),
        receivedDateTime: '2026-09-16T10:00:00Z',
        bodyPreview: `the snippet of ${id}`,
        categories: over.categories ?? [],
        parentFolderId: over.folder ?? 'inbox-folder',
        webLink: `https://outlook.office.com/mail/${id}`
    };
}

/** The two well-known folders every Microsoft round reads, answered before any listing. */
const FOLDERS = [
    { when: (url: string) => url.includes('/mailFolders/sentitems'), body: { id: 'sent-folder' } },
    {
        when: (url: string) => url.includes('/mailFolders/deleteditems'),
        body: { id: 'trash-folder' }
    }
];

/**
 * A fetcher over the three signal listings and the per-conversation read. The conversation read is
 * answered from the table by the id inside its own filter, which the route list cannot express.
 */
function graphFetcher(
    conversations: Record<string, Record<string, unknown>[]>,
    listings: { when: (url: string) => boolean; body: unknown }[]
): { fetcher: typeof fetch; seen: string[] } {
    const seen: string[] = [];
    const fake = fakeFetcher([...FOLDERS, ...listings]);
    const fetcher: typeof fetch = (input, init) => {
        const raw = urlOf(input);
        seen.push(raw);
        const url = decodeURIComponent(raw.replace(/\+/g, ' '));
        const matched = /conversationId eq '([^']+)'/.exec(url);
        if (matched !== null) {
            return Promise.resolve(
                new Response(JSON.stringify({ value: conversations[matched[1]] ?? [] }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
            );
        }
        return fake.fetcher(input, init);
    };
    return { fetcher, seen };
}

/** One conversation per id, each holding the messages the case gives it. */
const CONVERSATIONS: Record<string, Record<string, unknown>[]> = {
    'unread-one': [graphMessage('unread-one')],
    'todo-one': [graphMessage('todo-one', { categories: ['todo'] })],
    plain: [graphMessage('plain')],
    chain: [graphMessage('chain', { subject: 'Re: an answer' })],
    long: [graphMessage('long'), graphMessage('long-older', { conversationId: 'long' })],
    sent: [graphMessage('sent', { folder: 'sent-folder' })],
    binned: [graphMessage('binned', { folder: 'trash-folder' })]
};

/**
 * The three listings a whole-plate case answers: unread, the todo category, and everything else.
 */
function listingsFor(unlabeled: Record<string, unknown>[]) {
    return [
        {
            when: (url: string) => /isRead(\+|%20)eq/.test(url),
            body: { value: [graphMessage('unread-one')] }
        },
        {
            when: (url: string) => url.includes('any%28') || url.includes('any('),
            body: { value: [graphMessage('todo-one', { categories: ['todo'] })] }
        },
        {
            when: (url: string) => url.includes('/mailFolders/inbox/messages'),
            body: { value: unlabeled }
        },
        { when: (url: string) => url.includes('/me/messages'), body: { value: [] } }
    ];
}

describe('the Microsoft plate', () => {
    it('reads the three signals over the inbox folder and drops what the rule drops', async () => {
        const { fetcher, seen } = graphFetcher(
            CONVERSATIONS,
            listingsFor([
                graphMessage('plain'),
                graphMessage('chain', { subject: 'Re: an answer' }),
                graphMessage('long'),
                graphMessage('sent', { folder: 'sent-folder' }),
                graphMessage('binned', { folder: 'trash-folder' }),
                graphMessage('labelled', { categories: ['reading'] })
            ])
        );
        const candidates = await readMicrosoftMail({ ...ARGS, key: 'microsoft-uni', fetcher });
        expect(
            plate(candidates)
                .map((one) => one.id)
                .sort()
        ).toEqual(['plain', 'todo-one', 'unread-one']);

        // Every call is inside the mail scopes: the user resource is never asked for, and which
        // messages are the reader's own comes from the sent-items folder.
        for (const url of seen) expect(new URL(url).pathname).not.toBe('/v1.0/me');
        expect(seen.some((url) => url.includes('/mailFolders/sentitems'))).toBe(true);
    });

    it('asks each signal for the configured cap, newest first, with the order field first in a filter', async () => {
        const { fetcher, seen } = graphFetcher(CONVERSATIONS, listingsFor([graphMessage('plain')]));
        await readMicrosoftMail({ ...ARGS, key: 'microsoft-uni', perSignal: 25, fetcher });
        const listings = seen.filter((url) => url.includes('/mailFolders/inbox/messages'));
        expect(listings).toHaveLength(3);
        for (const url of listings) {
            const query = new URL(url).searchParams;
            expect(query.get('$top')).toBe('25');
            expect(query.get('$orderby')).toBe('receivedDateTime desc');
            // Graph refuses a sort whose property is not first in the filter, so a filtered listing
            // opens its filter with the order field over the whole of time.
            const filter = query.get('$filter');
            if (filter !== null) expect(filter.startsWith('receivedDateTime ge ')).toBe(true);
        }
        expect(listings.filter((url) => new URL(url).searchParams.has('$filter'))).toHaveLength(2);
    });

    it('follows the unlabeled listing past a page whose messages all carry a category', async () => {
        const conversations = { ...CONVERSATIONS, 'second-page': [graphMessage('second-page')] };
        const first = {
            value: [graphMessage('filed-one', { categories: ['reading'] })],
            '@odata.nextLink':
                'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?page=2'
        };
        const { fetcher } = graphFetcher(conversations, [
            { when: (url: string) => /isRead(\+|%20)eq/.test(url), body: { value: [] } },
            {
                when: (url: string) => url.includes('any%28') || url.includes('any('),
                body: { value: [] }
            },
            {
                when: (url: string) => url.includes('page=2'),
                body: { value: [graphMessage('second-page')] }
            },
            { when: (url: string) => url.includes('/mailFolders/inbox/messages'), body: first },
            { when: (url: string) => url.includes('/me/messages'), body: { value: [] } }
        ]);
        const candidates = await readMicrosoftMail({ ...ARGS, key: 'microsoft-uni', fetcher });
        expect(plate(candidates).map((one) => one.id)).toEqual(['second-page']);
    });

    it('names the reply-to address of the newest message, and its sender when it has none', async () => {
        const conversations = {
            desk: [graphMessage('desk', { replyTo: 'desk@example.invalid' })],
            plain: [graphMessage('plain')]
        };
        const { fetcher } = graphFetcher(conversations, [
            {
                when: (url: string) => /isRead(\+|%20)eq/.test(url),
                body: {
                    value: [
                        graphMessage('desk', { replyTo: 'desk@example.invalid' }),
                        graphMessage('plain')
                    ]
                }
            },
            {
                when: (url: string) => url.includes('any%28') || url.includes('any('),
                body: { value: [] }
            },
            {
                when: (url: string) => url.includes('/mailFolders/inbox/messages'),
                body: { value: [] }
            },
            { when: (url: string) => url.includes('/me/messages'), body: { value: [] } }
        ]);
        const rows = plate(await readMicrosoftMail({ ...ARGS, key: 'microsoft-uni', fetcher }));
        const by = Object.fromEntries(rows.map((one) => [one.id, one]));
        expect(by.desk.replyTo).toBe('Desk <desk@example.invalid>');
        expect(by.desk.sender).toBe('Ada <ada@example.invalid>');
        expect(by.plain.replyTo).toBe('Ada <ada@example.invalid>');
    });
});
