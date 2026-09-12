// Pure Inbox kind, tone, grouping, search, and saved-state rules.

import { describe, expect, it } from 'vitest';
import {
    inboxSearch,
    kindOf,
    kindTone,
    parseInboxState,
    splitInbox,
    type InboxKind
} from '../../src/lib/state/inbox.ts';

const entries = [
    { id: 'reply', sender: 'Ada', subject: 'Paper', kind: 'reply', what: 'Needs review' },
    { id: 'action', sender: 'Bob', subject: 'Grant', kind: 'action', what: 'Upload form' },
    { id: 'info', sender: 'Cara', subject: 'News', kind: 'other', what: 'For awareness' },
    { id: 'done', sender: 'Dan', subject: 'Closed', kind: 'reply', triaged: true }
];

describe('inbox selectors', () => {
    it('normalises kinds and assigns their semantic tones', () => {
        expect(entries.map(kindOf)).toEqual(['reply', 'action', 'info', 'reply']);
        expect((['reply', 'action', 'info'] as InboxKind[]).map(kindTone)).toEqual([
            'amber',
            'red',
            'teal'
        ]);
    });

    it('splits live entries in the three section lists and triaged entries separately', () => {
        const split = splitInbox(entries);
        expect(split.replies.map((entry) => entry.id)).toEqual(['reply']);
        expect(split.actions.map((entry) => entry.id)).toEqual(['action']);
        expect(split.info.map((entry) => entry.id)).toEqual(['info']);
        expect(split.triaged.map((entry) => entry.id)).toEqual(['done']);
    });

    it('searches sender, subject, and description and parses instance state', () => {
        expect(inboxSearch(entries, 'ada paper review')).toEqual([entries[0]]);
        expect(inboxSearch(entries, 'grant upload')).toEqual([entries[1]]);
        expect(inboxSearch(entries, 'missing')).toEqual([]);
        expect(parseInboxState({ search: 'paper', triagedOpen: true })).toEqual({
            search: 'paper',
            triagedOpen: true
        });
        expect(parseInboxState(null)).toEqual({ search: '', triagedOpen: false });
    });
});
