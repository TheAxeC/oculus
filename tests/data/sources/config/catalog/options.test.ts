// Layer 1, data tests. The options catalog reader and the walk that says which key paths of a
// config file are options, over a catalog and a file of every wrong type. Compared whole, in the
// walk's order.

import { describe, expect, it } from 'vitest';
import {
    catalogOf,
    optionPaths,
    type CatalogEntry
} from '../../../../../src/lib/data/sources/config/catalog/options.ts';

/** A catalog whose entries are of the wrong type, as a hand edit of the file can leave them. */
function entriesOf(held: unknown): Record<string, CatalogEntry> {
    return held as Record<string, CatalogEntry>;
}

describe('catalogOf', () => {
    it.each([[{}], [{ options: [] }], [{ options: 'x' }], [{ options: null }]])(
        'answers an empty catalog for %j',
        (config) => {
            expect(catalogOf(config)).toStrictEqual({});
        }
    );
});

describe('optionPaths', () => {
    const ENTRIES = entriesOf({
        fam: { fields: { a: 'b' } },
        num: 3,
        lst: [],
        'f.g': { fields: 1 },
        plain: { description: 'd' }
    });

    it.each([['x'], [[]], [null], [3]])('finds no option in a file that is %j', (file) => {
        expect(optionPaths(file, ENTRIES)).toStrictEqual([]);
    });

    it('stops at a family, descends into maps, and takes anything else as a leaf', () => {
        const file = {
            fam: { z: 1 },
            num: 1,
            lst: [1],
            f: { g: { h: 1 } },
            plain: {},
            nested: { a: { b: null } }
        };
        expect(optionPaths(file, ENTRIES)).toStrictEqual([
            'fam',
            'num',
            'lst',
            'f.g',
            'plain',
            'nested.a.b'
        ]);
    });

    it('does not take an entry that is not a map as a family', () => {
        expect(optionPaths({ num: { inner: 1 } }, entriesOf({ num: 3 }))).toStrictEqual([
            'num.inner'
        ]);
    });

    it('returns a path once for each key that gives it', () => {
        expect(optionPaths({ 'a.b': 1, a: { b: 2 } }, {})).toEqual(['a.b', 'a.b']);
    });

    it('is not misled by a reserved name of objects as an entry or as a key', () => {
        expect(optionPaths({ constructor: 1, toString: { valueOf: 2 } }, {})).toEqual([
            'constructor',
            'toString.valueOf'
        ]);
    });
});
