// Layer 2, client-state tests. The values of an entry form: what a saved value of a schema field
// becomes while it is edited, what an edit becomes when it is saved, and whether the two differ.
// Each table row is one distinct outcome of the rule it names; the fields are written out as a
// schema file would declare them.

import { describe, expect, it } from 'vitest';
import {
    fieldDiffers,
    hasWords,
    payloadOf,
    type RecordsEdit,
    toEdit
} from '../../../src/lib/state/forms/record-values.ts';
import type { FormField } from '../../../src/lib/state/forms/schema.ts';

/** A schema field as a schema file declares it, with a label and section nothing here reads. */
function form(field: Pick<FormField, 'field' | 'type'> & Partial<FormField>): FormField {
    return { label: field.field, section: 'main', ...field };
}

const text: FormField = form({ field: 'method', type: 'text' });
const tags: FormField = form({ field: 'themes', type: 'tags' });
const metalist: FormField = form({ field: 'meta', type: 'metalist' });
const checkbox: FormField = form({ field: 'open', type: 'checkbox' });
const retrieval: FormField = form({
    field: 'retrieval',
    type: 'records',
    fields: [form({ field: 'method', type: 'text' }), form({ field: 'notes', type: 'textarea' })]
});
const situation: FormField = form({ field: 'situation', type: 'records', map: true, fields: [] });
const eligibility: FormField = form({
    field: 'eligibility',
    type: 'records',
    open: true,
    fields: [form({ field: 'caveat', type: 'text' })]
});
const hosts: FormField = form({
    field: 'hosts',
    type: 'records',
    open: true,
    fields: [form({ field: 'name', type: 'text' })]
});
const facts: FormField = form({ field: 'facts', type: 'records', open: true, fields: [] });

describe('the shape toEdit gives a records field', () => {
    it.each([
        ['a saved list', hosts, [{ name: 'a' }], undefined, 'list'],
        ['a saved map with fields declared', retrieval, { method: 'x' }, undefined, 'one'],
        ['a saved map with none declared', facts, { a: 'b' }, undefined, 'labels'],
        ['a saved map of a field marked map', situation, { a: 'b' }, undefined, 'named'],
        ['no value, a peer holding a map', retrieval, undefined, { method: 'x' }, 'one'],
        ['no value, a field marked map', situation, undefined, undefined, 'named'],
        ['no value, open with no fields', facts, undefined, undefined, 'labels'],
        ['no value and nothing to go by', hosts, undefined, undefined, 'list']
    ])('%s is %s', (_name, field, saved, sample, shape) => {
        expect((toEdit(field, saved, sample) as RecordsEdit).shape).toBe(shape);
    });
});

describe('toEdit', () => {
    it.each([
        ['a number as text', text, 12, '12'],
        ['no value as empty text', text, undefined, ''],
        ['a tick', checkbox, true, true],
        ['an unticked box', checkbox, undefined, false],
        ['a string as one tag', tags, 'a', ['a']],
        [
            'a metalist as rows',
            metalist,
            [{ label: 'n', value: 'v' }],
            [{ label: 'n', value: 'v' }]
        ],
        ['a bare word as an unlabelled row', metalist, 'x', [{ label: '', value: 'x' }]]
    ])('%s', (_name, field, saved, edit) => {
        expect(toEdit(field, saved)).toEqual(edit);
    });

    it('keeps a map of one record with its unnamed text keys as rows and the rest as kept', () => {
        const saved = { method: 'api', notes: 'one\ntwo\n', files: 33, deep: { a: 1 } };
        expect(toEdit(retrieval, saved)).toEqual({
            shape: 'one',
            item: {
                fields: { method: 'api', notes: 'one\ntwo\n' },
                rows: [{ label: 'files', value: '33' }],
                kept: { deep: { a: 1 } }
            }
        });
    });

    it('names the records of a field marked map by the key they sit under', () => {
        expect(toEdit(situation, { Visa: 'ok' })).toEqual({
            shape: 'named',
            items: [
                {
                    label: 'Visa',
                    record: { fields: {}, rows: [], kept: {}, src: 'Visa' },
                    src: 'Visa'
                }
            ]
        });
    });
});

describe('payloadOf', () => {
    it.each([
        ['text trimmed', text, '  api ', undefined, 'api'],
        ['empty text as a clear', text, '   ', 'api', null],
        ['the same words keep a number a number', text, '12', 12, 12],
        ['a tick', checkbox, true, undefined, true],
        ['an unticked box that was true as false', checkbox, false, true, false],
        ['an unticked box that was absent as a clear', checkbox, false, undefined, null],
        ['tags without the empty ones', tags, ['a', ' ', ' b '], undefined, ['a', 'b']],
        ['no tags as a clear', tags, [' '], ['a'], null],
        [
            'metalist rows with a label or a value',
            metalist,
            [
                { label: ' n ', value: ' v ' },
                { label: '', value: '' }
            ],
            undefined,
            [{ label: 'n', value: 'v' }]
        ]
    ])('%s', (_name, field, edit, saved, payload) => {
        expect(payloadOf(field, edit, saved)).toEqual(payload);
    });

    it('writes a record with its declared fields, its unnamed rows and the keys kept', () => {
        const edit = toEdit(retrieval, { method: 'api', files: 33, deep: { a: 1 } });
        expect(payloadOf(retrieval, edit, { method: 'api', files: 33, deep: { a: 1 } })).toEqual({
            method: 'api',
            files: 33,
            deep: { a: 1 }
        });
    });

    it('leaves out an empty record and an empty row', () => {
        const edit = {
            shape: 'list',
            items: [
                { fields: { name: '' }, rows: [], kept: {} },
                { fields: { name: 'Leuven' }, rows: [{ label: ' ', value: 'x' }], kept: {} }
            ]
        };
        expect(payloadOf(hosts, edit, undefined)).toEqual([{ name: 'Leuven' }]);
    });

    it('writes a record read from a list at its place, keeping the type of a number', () => {
        const saved = [{ name: 'a', score: 3 }];
        const edit = toEdit(hosts, saved);
        expect(payloadOf(hosts, edit, saved)).toEqual(saved);
    });
});

describe('fieldDiffers', () => {
    const saved = { caveat: 'only once', rule: 'x' };

    it.each([
        ['an untouched field', 'only once', false],
        ['a trailing space', 'only once ', false],
        ['other words', 'twice', true],
        ['words cleared', '', true]
    ])('%s', (_name, caveat, differs) => {
        const edit = toEdit(eligibility, saved) as { item: { fields: Record<string, string> } };
        edit.item.fields.caveat = caveat;
        expect(fieldDiffers(eligibility, edit, saved)).toBe(differs);
    });

    it('is changed by a renamed row', () => {
        const edit = toEdit(eligibility, saved) as { item: { rows: { label: string }[] } };
        edit.item.rows[0].label = 'principle';
        expect(fieldDiffers(eligibility, edit, saved)).toBe(true);
    });
});

describe('hasWords', () => {
    it.each([
        ['empty text', '', false],
        ['text', 'a', true],
        ['an unticked box', false, false],
        ['a tick', true, true],
        ['rows of empty words', { shape: 'labels', rows: [{ label: '', value: ' ' }] }, false],
        ['rows with a word', { shape: 'labels', rows: [{ label: 'a', value: '' }] }, true],
        ['a place alone', { src: 'Visa', fields: {} }, false]
    ])('%s', (_name, edit, words) => {
        expect(hasWords(edit)).toBe(words);
    });
});
