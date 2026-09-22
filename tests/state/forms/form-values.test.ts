// The entry form's two value rules: how an entry's value is held by its control, and what a control's
// value is saved as. The form's save and the drafts' unsaved check both go through them, so a case
// here is the one rule both follow. Which open forms a host view's saved state names is at the end.

import { describe, expect, it } from 'vitest';
import { controlValue, sameSaved, savedValue } from '../../../src/lib/state/forms/form-values.ts';
import { parseOpenForms } from '../../../src/lib/state/forms/open-forms.ts';
import { parseDomainsState, parsePillarsState } from '../../../src/lib/state/words/lines.ts';

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
