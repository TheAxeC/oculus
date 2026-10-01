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
    it('keeps the entry own id where it is unique and not empty', () => {
        const entries = [{ title: 'One' }, { title: 'Two' }];
        const identOf = feedIdents('radar', entries);
        expect(identOf(entries[0])).toBe('One');
        expect(identOf(entries[1])).toBe('Two');
    });

    it('tells two entries with one title apart by their place in the feed', () => {
        const entries = [{ title: 'Same' }, { title: 'Same' }];
        const identOf = feedIdents('radar', entries);
        expect(feedIdentity('radar', entries[0])).toBe(feedIdentity('radar', entries[1]));
        expect(identOf(entries[0])).toBe('Same#0');
        expect(identOf(entries[1])).toBe('Same#1');
        expect(identOf(entries[0])).not.toBe(identOf(entries[1]));
    });

    it('gives an entry whose every field is empty an id the cursor can hold', () => {
        const entries = [{ title: '', inst: '', url: '' }, { title: 'Real' }];
        const identOf = feedIdents('radar', entries);
        expect(identOf(entries[0])).toBe('radar#0');
        expect(identOf(entries[0])).not.toBe('');
        expect(identOf(entries[1])).toBe('Real');
    });

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
    it('are every non-empty string, in property order, lists and maps followed', () => {
        expect(nestedStrings({ a: '', b: ['x', { c: 'y' }], d: 3, e: null })).toEqual(['x', 'y']);
    });
});

describe('the identity of an entry whose fields are of the wrong type', () => {
    it.each([
        ['radar', { title: 3 }, 'radar'],
        ['radar', { title: null, x: 'first' }, 'first'],
        ['radar', { title: ['a', 'b'], z: { y: 'deep' } }, 'a'],
        ['radar', { title: '', other: '', n: 5 }, 'radar'],
        ['radar', {}, 'radar'],
        ['linkedin', { file: 3, title: 'T' }, 'T'],
        ['linkedin', { file: 'f.md', title: 'T' }, 'f.md'],
        ['linkedin', { title: 'T' }, 'T'],
        ['leads', { file: 'f' }, 'f']
    ] as const)('is the %s entry %j named %j', (kind, entry, identity) => {
        expect(feedIdentity(kind, entry)).toBe(identity);
    });

    it('gives a null entry the kind as its identity and a place in the list as its id', () => {
        expect(feedIdentity('radar', null as never)).toBe('radar');
        const entries = [null as never, { title: 'A' }];
        const identOf = feedIdents('radar', entries);
        expect([identOf(entries[0]), identOf(entries[1])]).toEqual(['radar#0', 'A']);
    });

    it('collects the strings of a parsed map including an own __proto__ key, and none of a number or a date', () => {
        const parsed: unknown = JSON.parse(
            '{"__proto__":"x","a":["b",{"c":"d","e":3}],"f":null,"g":true}'
        );
        expect(nestedStrings(parsed)).toEqual(['x', 'b', 'd']);
        expect(nestedStrings(['', 3, [[], ['q']], new Date(0), undefined])).toEqual(['q']);
    });
});
