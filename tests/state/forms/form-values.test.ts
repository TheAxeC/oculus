// The entry form's two value rules: how an entry's value is held by its control, and what a
// control's value is saved as. The form's save and the drafts' unsaved check both go through them,
// so a case here is the one rule both follow. Which open forms a host view's saved state names is
// at the end.

import { describe, expect, it } from 'vitest';
import {
    controlValue,
    parseRawField,
    rawFieldText,
    sameSaved,
    savedValue,
    type FormValue
} from '../../../src/lib/state/forms/form-values.ts';
import { parseOpenForms } from '../../../src/lib/state/forms/open-forms.ts';
import {
    parseDomainsState,
    parsePillarsState
} from '../../../src/lib/state/boards/structure/lines.ts';

describe('controlValue', () => {
    it('holds each kind the way its control draws it', () => {
        expect(controlValue(true, 'checkbox')).toBe(true);
        expect(controlValue('yes', 'checkbox')).toBe(false);
        expect(controlValue(['a', 7, 'b'], 'tags')).toBe('a, b');
        expect(controlValue(2026, 'text')).toBe('2026');
        expect(controlValue(undefined, 'text')).toBe('');
        expect(controlValue({ method: 'wget' }, 'raw')).toBe('{"method":"wget"}');
        expect(
            controlValue([{ label: 'When', value: 'May' }, 'stray', { label: 3 }], 'metalist')
        ).toEqual([
            { label: 'When', value: 'May' },
            { label: '', value: '' }
        ]);
    });
});

describe('savedValue', () => {
    it('trims text, splits tags into words and drops empty metalist rows', () => {
        expect(savedValue('  a line  ', 'text')).toBe('a line');
        expect(savedValue('a, ,b ,', 'tags')).toEqual(['a', 'b']);
        expect(savedValue('', 'tags')).toEqual([]);
        expect(savedValue(true, 'checkbox')).toBe(true);
        expect(savedValue('true', 'checkbox')).toBe(false);
        expect(
            savedValue(
                [
                    { label: ' k ', value: 'v' },
                    { label: ' ', value: '' }
                ],
                'metalist'
            )
        ).toEqual([{ label: 'k', value: 'v' }]);
    });

    it('calls two values the same when the save would write the same', () => {
        expect(sameSaved('a,b', 'a, b', 'tags')).toBe(true);
        expect(sameSaved('a,b', 'a, b', 'text')).toBe(false);
        expect(sameSaved(' x', 'x', 'text')).toBe(true);
        expect(sameSaved([{ label: '', value: '' }], [], 'metalist')).toBe(true);
        // Revert: sameSaved comparing a raw field's text makes the first of these false.
        expect(sameSaved('{"a": 1}', '{"a":1}', 'raw')).toBe(true);
        expect(sameSaved('{"a": 1}', '{"a":2}', 'raw')).toBe(false);
        expect(sameSaved('{"a": ', '{"a":1}', 'raw')).toBe(false);
    });
});

describe('the open forms of a host view', () => {
    it('reads the add form and the edited entry, and none for anything else', () => {
        expect(parseOpenForms({ adding: true, editing: 'tensor' })).toEqual({
            adding: true,
            editing: 'tensor'
        });
        expect(parseOpenForms({ adding: 1, editing: null })).toEqual({
            adding: false,
            editing: ''
        });
        expect(parseOpenForms(['adding'])).toEqual({ adding: false, editing: '' });
        expect(parsePillarsState({ adding: true, editing: 'tensor', reveal: 'x' })).toEqual({
            adding: true,
            editing: 'tensor',
            reveal: 'x'
        });
        expect(parseDomainsState(undefined)).toEqual({ adding: false, editing: '' });
    });
});

describe('controlValue over a value of the wrong type', () => {
    it.each([
        ['checkbox', true, true],
        ['checkbox', 'true', false],
        ['checkbox', 1, false],
        ['checkbox', {}, false],
        ['checkbox', null, false],
        ['checkbox', undefined, false],
        ['text', 'a', 'a'],
        ['text', '', ''],
        ['text', 3, '3'],
        ['text', 0, '0'],
        ['text', Number.NaN, 'NaN'],
        ['text', Number.POSITIVE_INFINITY, 'Infinity'],
        ['text', true, ''],
        ['text', null, ''],
        ['text', undefined, ''],
        ['text', {}, ''],
        ['text', { a: 'b' }, ''],
        ['text', [], ''],
        ['text', ['a', 1, null, 'b', {}, ['c']], 'a, b'],
        ['tags', ['a', 'b'], 'a, b'],
        ['tags', {}, ''],
        ['tags', 'a,b', 'a,b'],
        ['metalist', {}, ''],
        ['metalist', 'a', 'a'],
        ['metalist', 4, '4'],
        ['metalist', null, ''],
        ['raw', {}, '{}'],
        ['raw', { a: [1, { b: null }] }, '{"a":[1,{"b":null}]}'],
        ['raw', [], ''],
        ['raw', ['a'], ''],
        ['raw', 'a', ''],
        ['raw', 3, ''],
        ['raw', null, ''],
        ['raw', undefined, ''],
        ['raw', { a: undefined, b: 1 }, '{"b":1}']
    ])('holds a %s control over %j as %j', (kind, value, expected) => {
        expect(controlValue(value, kind)).toStrictEqual(expected);
    });

    it('holds a metalist as the rows that are maps, each with a label and a value', () => {
        const rows = [
            { label: 'a', value: 'b', extra: 1 },
            { label: 3 },
            { value: 4 },
            { label: 'c', value: 'd' },
            {},
            null,
            ['e', 'f'],
            'g',
            3
        ];
        const held = controlValue(rows, 'metalist');
        expect(held).toStrictEqual([
            { label: 'a', value: 'b' },
            { label: '', value: '' },
            { label: '', value: '' },
            { label: 'c', value: 'd' },
            { label: '', value: '' }
        ]);
        expect(Object.keys((held as { label: string }[])[0])).toStrictEqual(['label', 'value']);
        expect(controlValue([], 'metalist')).toStrictEqual([]);
    });

    it('holds a metalist row whose label is a number as an empty label', () => {
        expect(controlValue([{ label: 3, value: 'v' }], 'metalist')).toStrictEqual([
            { label: '', value: 'v' }
        ]);
    });
});

describe('the raw field text', () => {
    it.each([
        ['an empty map', {}, '{}'],
        ['a nested map', { a: { b: [1, 'c', null, true] } }, '{"a":{"b":[1,"c",null,true]}}'],
        ['a list', [], ''],
        ['a list holding a map', [{}], ''],
        ['a string', '{}', ''],
        ['a number', 1, ''],
        ['null', null, ''],
        ['undefined', undefined, '']
    ])('writes %s as %j', (_name, value, expected) => {
        expect(rawFieldText(value)).toStrictEqual(expected);
    });

    it.each([
        ['', { ok: true, value: null }],
        ['   ', { ok: true, value: null }],
        ['\n\t', { ok: true, value: null }],
        ['{}', { ok: true, value: {} }],
        [
            '{"a":1,"b":"c","d":null,"e":true}',
            { ok: true, value: { a: 1, b: 'c', d: null, e: true } }
        ],
        ['{"a":[1,{"b":[null,"c"]}]}', { ok: true, value: { a: [1, { b: [null, 'c'] }] } }],
        ['{"a":1e999}', { ok: true, value: { a: Number.POSITIVE_INFINITY } }],
        ['[]', { ok: false }],
        ['[{"a":1}]', { ok: false }],
        ['null', { ok: false }],
        ['3', { ok: false }],
        ['"a"', { ok: false }],
        ['true', { ok: false }],
        ['{"a":', { ok: false }],
        ["{'a':1}", { ok: false }],
        ['not json', { ok: false }]
    ])('parses %j as %j', (text, expected) => {
        expect(parseRawField(text)).toStrictEqual(expected);
    });

    it('keeps an own __proto__ key of a parsed map as it came', () => {
        const parsed = parseRawField('{"__proto__":{"x":1},"a":2}');
        expect(parsed.ok).toBe(true);
        const value = parsed.ok ? parsed.value : null;
        expect(Object.keys(value ?? {})).toStrictEqual(['__proto__', 'a']);
        expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    });

    it('answers the parsed map keys in the order the text holds them', () => {
        const parsed = parseRawField('{"b":1,"a":2,"1":3}');
        expect(Object.keys(parsed.ok ? (parsed.value ?? {}) : {})).toStrictEqual(['1', 'b', 'a']);
    });
});

describe('savedValue and sameSaved over a value of the wrong type', () => {
    it.each([
        ['checkbox', true, true],
        ['checkbox', 'true', false],
        ['checkbox', [], false],
        ['text', ' a ', 'a'],
        ['text', true, ''],
        ['text', [], ''],
        ['text', [{ label: 'a', value: 'b' }], ''],
        ['tags', true, []],
        ['tags', [], []],
        ['tags', ' a , b,, ', ['a', 'b']],
        ['metalist', 'a', []],
        ['metalist', true, []],
        ['metalist', [], []]
    ] as [string, FormValue, unknown][])(
        'saves a %s control holding %j as %j',
        (kind, value, expected) => {
            expect(savedValue(value, kind)).toStrictEqual(expected);
        }
    );

    it.each([
        ['raw', true, '{"a":1}', false],
        ['raw', '{"a":1}', true, false],
        ['raw', true, false, true],
        ['raw', '', '  ', true],
        ['raw', '[1]', '[2]', false],
        ['raw', '[1]', ' [1] ', true],
        ['raw', '{"a":1}', '[2]', false],
        ['text', 'a', true, false],
        ['text', true, false, true],
        ['checkbox', true, 'true', false],
        ['checkbox', false, '', true],
        ['metalist', [], 'a', true],
        ['tags', 'a', 'a,', true]
    ] as [string, FormValue, FormValue, boolean][])(
        'calls two %s values %j and %j the same: %s',
        (kind, one, other, expected) => {
            expect(sameSaved(one, other, kind)).toBe(expected);
        }
    );
});
