// Layer 4, test. The walk over a parsed config file (optionPaths) and the reader of the merged
// config's `options` key (catalogOf): which key paths of a file are options, where the walk stops
// at a family, and what an absent or malformed catalog gives.

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
    catalogOf,
    optionPaths,
    type CatalogEntry
} from '../../../src/lib/data/sources/config/catalog/options.ts';

describe('optionPaths', () => {
    const none: Record<string, CatalogEntry> = {};
    const families: Record<string, CatalogEntry> = {
        rail: { description: 'x', fields: { key: 'a' } },
        'deck.tag_tones': { description: 'x', fields: { key: 'a', value: 'b' } }
    };

    it('walks a flow map to its leaves', () => {
        expect(optionPaths(parse('stale_days: { litwatch: 14 }'), none)).toEqual([
            'stale_days.litwatch'
        ]);
    });

    it('returns a three-segment path whole', () => {
        expect(optionPaths(parse('deck:\n  meta:\n    kicker: a\n'), none)).toEqual([
            'deck.meta.kicker'
        ]);
    });

    it('stops at a family and returns its own path', () => {
        const file: unknown = parse(
            'rail:\n  - { label: a }\ndeck:\n  tag_tones: { green: x }\n  title: t\n'
        );
        expect(optionPaths(file, families)).toEqual(['rail', 'deck.tag_tones', 'deck.title']);
    });

    it('gives a list of scalars and a list of records their own path', () => {
        const file: unknown = parse('names: [a, b]\nrows:\n  - { a: 1 }\n  - { a: 2 }\n');
        expect(optionPaths(file, none)).toEqual(['names', 'rows']);
    });

    it('gives an empty map, an empty list and a bare key their own path', () => {
        expect(optionPaths(parse('stale_days: {}\nindexes: []\nbare:\n'), none)).toEqual([
            'stale_days',
            'indexes',
            'bare'
        ]);
    });

    it('gives a file that is empty, null or a list no paths', () => {
        expect(optionPaths(parse(''), none)).toEqual([]);
        expect(optionPaths(parse('- a\n- b\n'), none)).toEqual([]);
        expect(optionPaths(parse('42'), none)).toEqual([]);
    });

    it('returns a path once for each key that gives it', () => {
        expect(optionPaths({ 'a.b': 1, a: { b: 2 } }, none)).toEqual(['a.b', 'a.b']);
    });

    it('is not misled by a reserved name of objects as an entry or as a key', () => {
        expect(optionPaths({ constructor: 1, toString: { valueOf: 2 } }, none)).toEqual([
            'constructor',
            'toString.valueOf'
        ]);
    });
});

describe('catalogOf', () => {
    it('reads the `options` key of the merged config', () => {
        const held = { 'behavior.yml': { a: { description: 'x', default: 1, control: 'number' } } };
        expect(catalogOf({ options: held })).toBe(held);
    });

    it('gives an empty catalog where the key is missing or is not a map', () => {
        expect(catalogOf({})).toEqual({});
        expect(catalogOf({ options: 3 })).toEqual({});
        expect(catalogOf({ options: [1] })).toEqual({});
        expect(catalogOf({ options: null })).toEqual({});
    });
});
