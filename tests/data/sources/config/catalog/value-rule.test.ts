// Layer 1, data tests. The one rule a value of an option is wrong by, over synthetic entries: a
// number against its bounds and whole, a toggle, choices with and without a list, paths and
// folders, slots, forms and the items of a list. Each row answers the kind of problem and its
// arguments, or none.

import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../../../../../src/lib/data/sources/config/catalog/options.ts';
import {
    hasForm,
    itemProblem,
    valueProblem,
    type RuleLists,
    type ValueProblem
} from '../../../../../src/lib/data/sources/config/catalog/value-rule.ts';

/** An entry of the given control and keys, with the description every entry carries. */
function entry(control: CatalogEntry['control'], rest: Partial<CatalogEntry> = {}): CatalogEntry {
    return { description: 'A synthetic entry.', control, ...rest };
}

const NONE = null;
const NOT_NUMBER: ValueProblem = { kind: 'number' };

describe('valueProblem', () => {
    const rows: [string, CatalogEntry, unknown, ValueProblem | null, RuleLists?][] = [
        ['a number at its minimum', entry('number', { min: 1 }), 1, NONE],
        [
            'a number under its minimum',
            entry('number', { min: 1 }),
            0,
            { kind: 'range', min: 1, max: undefined }
        ],
        [
            'a number over its maximum',
            entry('number', { max: 9 }),
            10,
            { kind: 'range', min: undefined, max: 9 }
        ],
        ['a number at its maximum', entry('number', { max: 9 }), 9, NONE],
        [
            'a number past both bounds',
            entry('number', { min: 1, max: 9 }),
            12,
            { kind: 'range', min: 1, max: 9 }
        ],
        ['a number inside both bounds', entry('number', { min: 1, max: 9 }), 5, NONE],
        ['NaN', entry('number', { min: 1 }), Number.NaN, NOT_NUMBER],
        ['Infinity', entry('number'), Number.POSITIVE_INFINITY, NOT_NUMBER],
        ['a text for a number', entry('number'), '5', NOT_NUMBER],
        ['null for a number', entry('number'), null, NOT_NUMBER],
        ['a whole number', entry('number', { whole: true }), 3, NONE],
        [
            'a fraction for a whole number',
            entry('number', { whole: true }),
            1.5,
            { kind: 'whole', min: undefined, max: undefined }
        ],
        [
            'a fraction under the minimum of a whole number',
            entry('number', { whole: true, min: 1 }),
            0.5,
            { kind: 'whole', min: 1, max: undefined }
        ],
        ['a word for a toggle', entry('toggle'), 'yes', { kind: 'boolean' }],
        ['a boolean for a toggle', entry('toggle'), false, NONE],
        ['a word of the values', entry('choice', { values: ['a', 'b'] }), 'a', NONE],
        [
            'a word outside the values',
            entry('choice', { values: ['a', 'b'] }),
            'c',
            { kind: 'choice', values: ['a', 'b'] }
        ],
        ['the empty word without empty', entry('choice', { values: ['a'] }), '', { kind: 'empty' }],
        ['the empty word with empty', entry('choice', { values: ['a'], empty: true }), '', NONE],
        ['a number for a choice', entry('choice', { values: ['a'] }), 1, { kind: 'text' }],
        [
            'an item of the handed list',
            entry('choice', { values_from: ['models'] }),
            'm1',
            NONE,
            { sourced: ['m1', 'm2'] }
        ],
        [
            'a text outside the handed list',
            entry('choice', { values_from: ['models'] }),
            'gpt',
            { kind: 'source', sources: ['models'] },
            { sourced: ['m1', 'm2'] }
        ],
        ['any text with no list handed', entry('choice', { values_from: ['models'] }), 'gpt', NONE],
        [
            'any text with the list not held',
            entry('choice', { values_from: ['models'] }),
            'gpt',
            NONE,
            { sourced: null }
        ],
        [
            'the empty word with a source and without empty',
            entry('choice', { values_from: ['models'] }),
            '',
            { kind: 'empty' }
        ],
        [
            'the empty word with a source and with empty',
            entry('choice', { values_from: ['models'], empty: true }),
            '',
            NONE
        ],
        ['an absolute path', entry('path'), '/a', NONE],
        ['a home path', entry('path'), '~/a', NONE],
        ['a relative path', entry('path'), 'a', { kind: 'path' }],
        ['the empty path without empty', entry('path'), '', { kind: 'path' }],
        ['the empty path with empty', entry('path', { empty: true }), '', NONE],
        ['a path inside the hub', entry('folder'), 'a/b', NONE],
        ['a folder that climbs out', entry('folder'), '../a', { kind: 'hub_path' }],
        ['a folder with a backslash', entry('folder'), 'a\\b', { kind: 'hub_path' }],
        ['an absolute folder', entry('folder'), '/a', { kind: 'hub_path' }],
        [
            'a list one slot short',
            entry('list', { slots: ['x', 'y'] }),
            ['a'],
            { kind: 'slots', slots: ['x', 'y'] }
        ],
        ['a list with every slot', entry('list', { slots: ['x', 'y'] }), ['a', 'b'], NONE],
        ['a text for a list', entry('list'), 'a', { kind: 'strings' }],
        [
            'a text for a list of numbers',
            entry('list', { items: 'number' }),
            ['a'],
            { kind: 'numbers' }
        ],
        ['a text with the form program', entry('text', { form: 'program' }), 'python3', NONE],
        [
            'a path for the form program',
            entry('text', { form: 'program' }),
            'a/b',
            { kind: 'form', form: 'program' }
        ],
        [
            'a spaced name for the form program',
            entry('text', { form: 'program' }),
            'my tool',
            { kind: 'form', form: 'program' }
        ],
        ['an extension', entry('text', { form: 'extension' }), '.pdf', NONE],
        [
            'an extension without its dot',
            entry('text', { form: 'extension' }),
            'pdf',
            { kind: 'form', form: 'extension' }
        ],
        [
            'a double extension',
            entry('text', { form: 'extension' }),
            '.tar.gz',
            { kind: 'form', form: 'extension' }
        ],
        ['a bundle id', entry('text', { form: 'bundle_id' }), 'com.apple.Preview', NONE],
        [
            'a bundle id with a space',
            entry('text', { form: 'bundle_id' }),
            'com.apple TextEdit',
            { kind: 'form', form: 'bundle_id' }
        ],
        [
            'a bundle id of one part',
            entry('text', { form: 'bundle_id' }),
            'Preview',
            { kind: 'form', form: 'bundle_id' }
        ]
    ];

    it('answers the kind of problem each control, bound and list gives a value, and none for a value that fits', () => {
        for (const [name, spec, value, expected, lists] of rows) {
            expect(valueProblem(spec, value, lists), name).toStrictEqual(expected);
        }
    });
});

describe('valueProblem over a list', () => {
    const whole = entry('list', { items: 'number', whole: true, min: 1 });
    const programs = entry('list', { form: 'program' });

    it('checks each item by the entry bounds, whole and form', () => {
        expect(valueProblem(whole, [80, 120])).toBeNull();
        expect(valueProblem(whole, [80, 0])).toStrictEqual({
            kind: 'range',
            min: 1,
            max: undefined
        });
        expect(valueProblem(whole, [80, 1.5])).toStrictEqual({
            kind: 'whole',
            min: 1,
            max: undefined
        });
        expect(valueProblem(programs, ['python3', 'a/b'])).toStrictEqual({
            kind: 'form',
            form: 'program'
        });
        expect(valueProblem(programs, ['python3'])).toBeNull();
    });
});

describe('itemProblem and hasForm', () => {
    it('checks one item of a list by the same rule', () => {
        const whole = entry('list', { items: 'number', whole: true, min: 1 });
        expect(itemProblem(whole, 0)).toStrictEqual({ kind: 'range', min: 1, max: undefined });
        expect(itemProblem(whole, 2)).toBeNull();
        expect(itemProblem(entry('list', { form: 'program' }), 'a b')).toStrictEqual({
            kind: 'form',
            form: 'program'
        });
        expect(hasForm('extension', '.pdf')).toBe(true);
        expect(hasForm('extension', 'pdf')).toBe(false);
    });
});
