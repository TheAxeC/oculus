// The type guards of data/helpers/guards.ts, over the values a parsed YAML or JSON file actually
// hands them: a map, a list, null, a number, a boolean and the empty string.
//
// The contracts matter more than the code, because fifteen modules read their config through them:
// `str` does not trim and does not accept a number, so a field written as `2026` is not a title and
// a title of spaces is a title of spaces; `text` is `str` with a fallback; `strings` keeps the
// string items of a list and has none of anything that is not a list; `fields` is a map or an empty
// one; `scalar` writes a number or a boolean out and refuses everything that is not a scalar;
// `byKey` and `item` answer with nothing for a key or a position the value does not hold.

import { describe, expect, it } from 'vitest';
import {
    byKey,
    fields,
    isMap,
    item,
    numericSetting,
    scalar,
    str,
    strings,
    text
} from '../../../src/lib/data/helpers/guards.ts';

describe('isMap', () => {
    it('holds for a map, empty or not', () => {
        expect(isMap({})).toBe(true);
        expect(isMap({ a: 1 })).toBe(true);
    });

    it('does not hold for null, a list, or anything not an object', () => {
        expect(isMap(null)).toBe(false);
        expect(isMap([])).toBe(false);
        expect(isMap([{ a: 1 }])).toBe(false);
        expect(isMap(undefined)).toBe(false);
        expect(isMap(2026)).toBe(false);
        expect(isMap('a')).toBe(false);
        expect(isMap(true)).toBe(false);
    });
});

describe('str', () => {
    it('is the value when it is a string, the empty string included', () => {
        expect(str('a')).toBe('a');
        expect(str('')).toBe('');
        expect(str('  a  ')).toBe('  a  ');
    });

    it('is undefined for a number, a boolean, null, a list and a map', () => {
        expect(str(2026)).toBeUndefined();
        expect(str(true)).toBeUndefined();
        expect(str(null)).toBeUndefined();
        expect(str(undefined)).toBeUndefined();
        expect(str([])).toBeUndefined();
        expect(str({})).toBeUndefined();
    });
});

describe('text', () => {
    it('is the string, and the fallback for everything else', () => {
        expect(text('a')).toBe('a');
        expect(text('')).toBe('');
        expect(text(null)).toBe('');
        expect(text(2026)).toBe('');
        expect(text([])).toBe('');
    });

    it('takes the fallback the caller names', () => {
        expect(text(null, 'none')).toBe('none');
        expect(text(2026, 'none')).toBe('none');
        // The empty string is a string, so it is the value and not the fallback.
        expect(text('', 'none')).toBe('');
    });
});

describe('strings', () => {
    it('keeps the string items of a list, in order', () => {
        expect(strings(['a', 'b'])).toEqual(['a', 'b']);
        expect(strings([])).toEqual([]);
        expect(strings(['a', ''])).toEqual(['a', '']);
    });

    it('drops the items of a list that are not strings', () => {
        expect(strings(['a', 2026, null, {}, ['b'], 'c'])).toEqual(['a', 'c']);
    });

    it('has nothing for a value that is not a list', () => {
        expect(strings(null)).toEqual([]);
        expect(strings(undefined)).toEqual([]);
        expect(strings('a')).toEqual([]);
        expect(strings(2026)).toEqual([]);
        expect(strings({ 0: 'a' })).toEqual([]);
    });
});

describe('fields', () => {
    it('is the map itself, so a write through it reaches the value the caller holds', () => {
        const held = { a: 1 };
        expect(fields(held)).toBe(held);
        expect(fields({})).toEqual({});
    });

    it('is an empty map for null, a list, a string and everything else', () => {
        expect(fields(null)).toEqual({});
        expect(fields(undefined)).toEqual({});
        expect(fields(['a'])).toEqual({});
        expect(fields('a')).toEqual({});
        expect(fields(2026)).toEqual({});
    });
});

describe('scalar', () => {
    it('is the string, and writes a number or a boolean out', () => {
        expect(scalar('a')).toBe('a');
        expect(scalar('')).toBe('');
        expect(scalar(2026)).toBe('2026');
        expect(scalar(0)).toBe('0');
        expect(scalar(true)).toBe('true');
        expect(scalar(false)).toBe('false');
    });

    it('is the fallback for null, undefined, a map and a list', () => {
        expect(scalar(null)).toBe('');
        expect(scalar(undefined)).toBe('');
        expect(scalar({ a: 1 })).toBe('');
        expect(scalar(['a', 'b'])).toBe('');
        expect(scalar(null, 'none')).toBe('none');
        expect(scalar({ a: 1 }, 'none')).toBe('none');
        expect(scalar(['a', 'b'], 'none')).toBe('none');
        // A scalar is the value however a fallback was named for the rest.
        expect(scalar(0, 'none')).toBe('0');
        expect(scalar('', 'none')).toBe('');
    });
});

describe('byKey', () => {
    it('is the value under a key the record holds', () => {
        expect(byKey({ a: 1, b: 2 }, 'a')).toBe(1);
        expect(byKey<number | undefined>({ a: undefined }, 'a')).toBeUndefined();
    });

    it('is undefined for a key the record does not hold, inherited names included', () => {
        expect(byKey<number>({ a: 1 }, 'b')).toBeUndefined();
        expect(byKey<number>({}, 'toString')).toBeUndefined();
    });
});

describe('item', () => {
    it('is the item at a position the list holds', () => {
        expect(item(['a', 'b'], 0)).toBe('a');
        expect(item(['a', 'b'], 1)).toBe('b');
    });

    it('is undefined past the end and for a negative position, which is no item from the end', () => {
        expect(item(['a', 'b'], 2)).toBeUndefined();
        expect(item(['a', 'b'], -1)).toBeUndefined();
        expect(item<string>([], 0)).toBeUndefined();
    });
});

describe('numericSetting', () => {
    // revert: src/lib/data/helpers/guards.ts:78 => return typeof value === 'number' ? value : null;
    it('is a finite number the config holds, and null for one it lacks or one that is not finite', () => {
        expect(numericSetting({ leads_badge_days: 14 }, 'leads_badge_days')).toBe(14);
        expect(numericSetting({}, 'leads_badge_days')).toBe(null);
        expect(numericSetting({ leads_badge_days: '14' }, 'leads_badge_days')).toBe(null);
        expect(numericSetting({ leads_badge_days: Number.NaN }, 'leads_badge_days')).toBe(null);
    });
});
