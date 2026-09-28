// Pure Inbox kind, tone, grouping, search, age, sender, and saved-state rules.

import { describe, expect, it } from 'vitest';
import {
    accountOf,
    ageOf,
    inboxSearch,
    kindOf,
    kindTone,
    parseInboxState,
    senderParts,
    splitInbox,
    threadAge,
    untriagedActionable,
    type InboxKind,
    type InboxThread,
    type MailAccount
} from '../../../src/lib/state/feeds/inbox.ts';
import { plateCount } from '../../../src/lib/state/feeds/inbox.ts';

const NOW = Date.parse('2026-09-16T12:00:00.000Z');

function thread(
    id: string,
    sender: string,
    subject: string,
    triage: Partial<InboxThread['triage']> = {},
    received = '2026-09-16T11:00:00.000Z'
): InboxThread {
    return {
        id,
        account: 'google-work',
        provider: 'google',
        sender,
        replyTo: sender,
        subject,
        received,
        snippet: `the snippet of ${subject}`,
        messages: 1,
        triage: { triaged: false, ...triage }
    };
}

const threads = [
    thread('reply', 'Ada', 'Paper', { kind: 'reply', what: 'Needs review' }),
    thread('action', 'Bob', 'Grant', { kind: 'action', what: 'Upload form' }),
    thread('info', 'Cara', 'News', { kind: 'info', what: 'For awareness' }),
    thread('unsorted', 'Eve', 'Nothing said yet'),
    thread('done', 'Dan', 'Closed', { kind: 'reply', triaged: true })
];

describe('inbox selectors', () => {
    it('reads the kind off the note and assigns the semantic tones', () => {
        expect(threads.map(kindOf)).toEqual(['reply', 'action', 'info', null, 'reply']);
        expect((['reply', 'action', 'info'] as InboxKind[]).map(kindTone)).toEqual([
            'amber',
            'red',
            'teal'
        ]);
        expect(kindTone(null)).toBe('slate');
    });

    it('splits the plate into the unsorted section, the three kinds and the triaged list', () => {
        const split = splitInbox(threads);
        expect(split.unsorted.map((one) => one.id)).toEqual(['unsorted']);
        expect(split.replies.map((one) => one.id)).toEqual(['reply']);
        expect(split.actions.map((one) => one.id)).toEqual(['action']);
        expect(split.info.map((one) => one.id)).toEqual(['info']);
        expect(split.triaged.map((one) => one.id)).toEqual(['done']);
    });

    it('counts the untriaged threads that are not informational, an unsorted one included', () => {
        expect(untriagedActionable(threads)).toBe(3);
        expect(untriagedActionable([])).toBe(0);
    });

    it('searches the sender, the subject, the note and the provider snippet', () => {
        expect(inboxSearch(threads, 'ada paper review').map((one) => one.id)).toEqual(['reply']);
        expect(inboxSearch(threads, 'grant upload').map((one) => one.id)).toEqual(['action']);
        expect(inboxSearch(threads, 'snippet of news').map((one) => one.id)).toEqual(['info']);
        expect(inboxSearch(threads, 'missing')).toEqual([]);
    });

    it('measures an age in whole days, hours or minutes, and nothing for an unreadable time', () => {
        expect(ageOf('2026-09-14T12:00:00.000Z', NOW)).toEqual({ value: 2, unit: 'd' });
        expect(ageOf('2026-09-16T09:30:00.000Z', NOW)).toEqual({ value: 2, unit: 'h' });
        expect(ageOf('2026-09-16T11:45:00.000Z', NOW)).toEqual({ value: 15, unit: 'm' });
        expect(ageOf('not a time', NOW)).toBeNull();
        expect(ageOf('2026-09-17T12:00:00.000Z', NOW)).toBeNull();
        expect(threadAge(threads[0], NOW)).toEqual({ value: 1, unit: 'h' });
    });

    it('finds the account row a thread belongs to, and nothing when the payload has none', () => {
        const account: MailAccount = { provider: 'google', label: 'work', status: 'connected' };
        expect(accountOf([account], threads[0])).toBe(account);
        expect(accountOf([], threads[0])).toBeNull();
    });

    it('parses the instance state it keeps', () => {
        expect(parseInboxState({ search: 'paper', triagedOpen: true })).toEqual({
            search: 'paper',
            triagedOpen: true,
            drafts: []
        });
        expect(parseInboxState({ reveal: 'google-work-1', drafts: ['google-work-1', 7] })).toEqual({
            search: '',
            triagedOpen: false,
            drafts: ['google-work-1'],
            reveal: 'google-work-1'
        });
        expect(parseInboxState(null)).toEqual({ search: '', triagedOpen: false, drafts: [] });
    });
});

describe('the threads still on the plate', () => {
    it('are every section but the triaged one', () => {
        const one = [{}] as unknown as Parameters<typeof plateCount>[0]['unsorted'];
        expect(
            plateCount({ unsorted: one, replies: one, actions: [], info: one, triaged: one })
        ).toBe(3);
    });
});

describe('the sender of a thread, split for its card', () => {
    it('reads the display name and the address of a From line', () => {
        expect(senderParts('Sparcly.ai <noreply@sparcly.ai>')).toEqual({
            name: 'Sparcly.ai',
            address: 'noreply@sparcly.ai'
        });
    });

    it('reads a quoted display name without its quotes, a comma inside it included', () => {
        expect(senderParts('"Faes, Axel" <axel@x.be>')).toEqual({
            name: 'Faes, Axel',
            address: 'axel@x.be'
        });
    });

    it('reads a bare address as an address with no name', () => {
        expect(senderParts('axel@x.be')).toEqual({ name: '', address: 'axel@x.be' });
    });
});
