// Layer 1, data tests. The type guards of data/helpers/guards.ts, over the values a parsed YAML or
// JSON file actually hands them: a map, a list, null, a number, a boolean and the empty string.
//
// The contracts matter more than the code, because the readers of config files and payloads all go
// through them: `str` does not trim and does not accept a number, so a field written as `2026` is
// not a title and a title of spaces is a title of spaces; `text` is `str` with a fallback;
// `strings` keeps the string items of a list and has none of anything that is not a list; `fields`
// is a map or an empty one; `scalar` writes a number or a boolean out and refuses everything that
// is not a scalar; `byKey` and `item` answer with nothing for a key or a position the value does
// not hold.

import { describe, expect, it } from 'vitest';
import {
    byKey,
    fields,
    isMap,
    item,
    numericSetting,
    sameInOrder,
    scalar,
    str,
    strings,
    text
} from '../../../src/lib/data/helpers/guards.ts';

describe('isMap', () => {
    it.each([
        ['an empty map', {}, true],
        ['a map', { a: 1 }, true],
        ['null', null, false],
        ['an empty list', [], false],
        ['a list of maps', [{ a: 1 }], false],
        ['undefined', undefined, false],
        ['a number', 2026, false],
        ['a string', 'a', false],
        ['a boolean', true, false]
    ])('answers %s with %s', (_row, value, held) => {
        expect(isMap(value)).toBe(held);
    });
});

describe('str', () => {
    it.each([
        ['a string', 'a', 'a'],
        ['the empty string', '', ''],
        ['a string with spaces, untrimmed', '  a  ', '  a  '],
        ['a number', 2026, undefined],
        ['a boolean', true, undefined],
        ['null', null, undefined],
        ['undefined', undefined, undefined],
        ['a list', [], undefined],
        ['a map', {}, undefined]
    ])('reads %s as the string or nothing', (_row, value, read) => {
        expect(str(value)).toBe(read);
    });
});

describe('text', () => {
    it.each([
        ['a string', 'a', undefined, 'a'],
        ['the empty string, which is a string', '', 'none', ''],
        ['null', null, undefined, ''],
        ['a number', 2026, undefined, ''],
        ['a list', [], undefined, ''],
        ['null with a fallback named', null, 'none', 'none'],
        ['a number with a fallback named', 2026, 'none', 'none']
    ])('reads %s as the string or the fallback', (_row, value, fallback, read) => {
        expect(text(value, fallback)).toBe(read);
    });
});

describe('strings', () => {
    it.each([
        ['the string items in order', ['a', 'b'], ['a', 'b']],
        ['an empty list', [], []],
        ['an empty string item', ['a', ''], ['a', '']],
        ['items that are not strings', ['a', 2026, null, {}, ['b'], 'c'], ['a', 'c']],
        ['null', null, []],
        ['undefined', undefined, []],
        ['a string', 'a', []],
        ['a number', 2026, []],
        ['a map', { 0: 'a' }, []]
    ])('keeps %s', (_row, value, kept) => {
        expect(strings(value)).toEqual(kept);
    });
});

describe('fields', () => {
    it('is the map itself, so a write through it reaches the value the caller holds', () => {
        const held = { a: 1 };
        expect(fields(held)).toBe(held);
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
        ['a list', ['a']],
        ['a string', 'a'],
        ['a number', 2026]
    ])('is an empty map for %s', (_row, value) => {
        expect(fields(value)).toEqual({});
    });
});

describe('scalar', () => {
    it.each([
        ['a string', 'a', undefined, 'a'],
        ['the empty string', '', 'none', ''],
        ['a number', 2026, undefined, '2026'],
        ['zero, whatever the fallback', 0, 'none', '0'],
        ['true', true, undefined, 'true'],
        ['false', false, undefined, 'false'],
        ['null', null, undefined, ''],
        ['undefined', undefined, undefined, ''],
        ['a map', { a: 1 }, undefined, ''],
        ['a list', ['a', 'b'], undefined, ''],
        ['null with a fallback named', null, 'none', 'none'],
        ['a map with a fallback named', { a: 1 }, 'none', 'none'],
        ['a list with a fallback named', ['a', 'b'], 'none', 'none']
    ])('writes %s out as its text or the fallback', (_row, value, fallback, written) => {
        expect(scalar(value, fallback)).toBe(written);
    });
});

describe('byKey', () => {
    it('is the value under a key the record holds, an undefined one included', () => {
        expect(byKey({ a: 1, b: 2 }, 'a')).toBe(1);
        expect(byKey<number | undefined>({ a: undefined }, 'a')).toBeUndefined();
    });

    it('is undefined for a key the record does not hold, inherited names included', () => {
        expect(byKey<number>({ a: 1 }, 'b')).toBeUndefined();
        expect(byKey<number>({}, 'toString')).toBeUndefined();
    });
});

describe('item', () => {
    it.each([
        ['the first position', 0, 'a'],
        ['the last position', 1, 'b'],
        ['a position past the end', 2, undefined],
        ['a negative position, which counts from nowhere', -1, undefined]
    ])('reads %s of a list of two', (_row, index, read) => {
        expect(item(['a', 'b'], index)).toBe(read);
    });
});

describe('numericSetting', () => {
    it.each([
        ['a finite number', { leads_badge_days: 14 }, 14],
        ['a missing key', {}, null],
        ['a number written as text', { leads_badge_days: '14' }, null],
        ['a number that is not finite', { leads_badge_days: Number.NaN }, null]
    ])('reads %s as the number or null', (_row, config, read) => {
        expect(numericSetting(config, 'leads_badge_days')).toBe(read);
    });
});

describe('sameInOrder', () => {
    it.each([
        [
            'equal nested maps and lists',
            { a: [1, { b: 2, c: 3 }], d: null },
            { a: [1, { b: 2, c: 3 }], d: null },
            true
        ],
        ['two empty lists', [], [], true],
        ['a map with its keys in another order', { a: 1, b: 2 }, { b: 2, a: 1 }, false],
        [
            'a nested map with its keys in another order',
            { k: { a: 1, b: 2 } },
            { k: { b: 2, a: 1 } },
            false
        ],
        [
            'a map in a list with its keys in another order',
            [{ a: 1, b: 2 }],
            [{ b: 2, a: 1 }],
            false
        ],
        ['maps with a different value', { a: 1 }, { a: 2 }, false],
        ['lists in another order', [1, 2], [2, 1], false]
    ])('answers %s with %s', (_row, a, b, same) => {
        expect(sameInOrder(a, b)).toBe(same);
    });
});
