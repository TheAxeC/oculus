// How a form value becomes a manifest value: coerce, the one function the form write and the
// deposit pass every value through. It reads no file, so these cases need no hub and run in
// npm test; what writeManifest does with the value over a hub of its own is writes.test.ts beside
// this.

import { describe, expect, it } from 'vitest';
import { coerce } from '../../../src/lib/server/edit/writes.ts';

describe('what a form value becomes', () => {
    it('makes a checkbox true or takes the key away', () => {
        expect(coerce('checkbox', 'on', undefined)).toEqual({ value: true });
        expect(coerce('checkbox', true, undefined)).toEqual({ value: true });
        expect(coerce('checkbox', false, true)).toEqual({ value: null });
        expect(coerce('checkbox', '', true)).toEqual({ value: null });
    });

    it('makes an empty text clear the field', () => {
        expect(coerce('text', '  ', 'held')).toEqual({ value: null });
        expect(coerce('textarea', '', 'held')).toEqual({ value: null });
    });

    it('keeps a number a number where the manifest holds one', () => {
        expect(coerce('text', '2027', 2026)).toEqual({ value: 2027 });
        expect(coerce('text', '2027', 'held')).toEqual({ value: '2027' });
    });

    it('splits a list widget into its items, dropping the empty ones', () => {
        expect(coerce('lines', 'one\n\n two ', undefined)).toEqual({ value: ['one', 'two'] });
        expect(coerce('chips', ['a', 'b'], undefined)).toEqual({ value: ['a', 'b'] });
        expect(coerce('tags', '', undefined)).toEqual({ value: null });
    });

    it('refuses a type it does not know', () => {
        expect(coerce('nonesuch', 'x', undefined)).toEqual({
            reason: 'unknown field type nonesuch'
        });
    });
});
