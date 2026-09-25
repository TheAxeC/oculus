// Layer 2, client-state tests. The identity of a feed entry over the whole feed, which the feed
// views' cursors, the palette and the lead view all read from state/feeds/idents.ts.

import { describe, expect, it } from 'vitest';
import {
    feedIdentity,
    feedIdents,
    nestedStrings,
    uniqueIdents
} from '../../../src/lib/state/feeds/idents.ts';

describe('a feed entry identity over the whole feed', () => {
    // revert: src/lib/state/feeds/idents.ts:43 => ids.set(entry, `${own || fallback}#${at}`);
    it('keeps the entry own id where it is unique and not empty', () => {
        const entries = [{ title: 'One' }, { title: 'Two' }];
        const identOf = feedIdents('radar', entries);
        expect(identOf(entries[0])).toBe('One');
        expect(identOf(entries[1])).toBe('Two');
    });

    // revert: src/lib/state/feeds/idents.ts:43 => ids.set(entry, own === '' || own === fallback ? `${own || fallback}#${at}` : own);
    it('tells two entries with one title apart by their place in the feed', () => {
        const entries = [{ title: 'Same' }, { title: 'Same' }];
        const identOf = feedIdents('radar', entries);
        expect(feedIdentity('radar', entries[0])).toBe(feedIdentity('radar', entries[1]));
        expect(identOf(entries[0])).toBe('Same#0');
        expect(identOf(entries[1])).toBe('Same#1');
        expect(identOf(entries[0])).not.toBe(identOf(entries[1]));
    });

    // revert: src/lib/state/feeds/idents.ts:43 => ids.set(entry, shared ? `${own || fallback}#${at}` : own);
    it('gives an entry whose every field is empty an id the cursor can hold', () => {
        const entries = [{ title: '', inst: '', url: '' }, { title: 'Real' }];
        const identOf = feedIdents('radar', entries);
        expect(identOf(entries[0])).toBe('radar#0');
        expect(identOf(entries[0])).not.toBe('');
        expect(identOf(entries[1])).toBe('Real');
    });

    // revert: src/lib/state/feeds/idents.ts:43 => ids.set(entry, own);
    it('numbers by the list it was built over, whatever the base gives', () => {
        const entries = [{ id: 'a' }, { id: 'a' }, { id: 'b' }];
        const identOf = uniqueIdents(entries, (entry) => entry.id, 'lead');
        expect([identOf(entries[0]), identOf(entries[1]), identOf(entries[2])]).toEqual([
            'a#0',
            'a#1',
            'b'
        ]);
    });
});

describe('the strings nested in an entry', () => {
    // revert: src/lib/state/feeds/idents.ts:13 => return [];
    it('are every non-empty string, in property order, lists and maps followed', () => {
        expect(nestedStrings({ a: '', b: ['x', { c: 'y' }], d: 3, e: null })).toEqual(['x', 'y']);
    });
});
