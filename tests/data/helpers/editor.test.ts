// Layer 1, data tests. The `editor:` block of config/behavior.yml: the cap the source editor paints
// under, read leniently for a page that may not have been sent a configuration yet and required at
// the server's start.

import { describe, expect, it } from 'vitest';
import { paintLimit, requirePaintLimit } from '../../../src/lib/data/helpers/editor.ts';

describe('the source editor cap', () => {
    it.each([
        ['a missing block', {}, null],
        ['a block that is text', { editor: 'on' }, null],
        ['a block that is a list', { editor: [] }, null],
        ['an empty block', { editor: {} }, null],
        ['a size in text', { editor: { paint_limit_kb: '5' } }, null],
        ['a size of zero', { editor: { paint_limit_kb: 0 } }, null],
        ['a negative size', { editor: { paint_limit_kb: -1 } }, null],
        ['a size that is not a number', { editor: { paint_limit_kb: Number.NaN } }, null],
        ['an infinite size', { editor: { paint_limit_kb: Number.POSITIVE_INFINITY } }, null],
        ['a size with a fraction', { editor: { paint_limit_kb: 2.5 } }, 2560]
    ])('reads %s as %j bytes', (_row, held, bytes) => {
        expect(paintLimit(held)).toBe(bytes);
        if (bytes !== null) expect(requirePaintLimit(held)).toBe(bytes);
    });

    it.each([
        ['a missing block', {}],
        ['a size of zero', { editor: { paint_limit_kb: 0 } }]
    ])('throws naming the key when it is required and there is %s', (_row, held) => {
        expect(() => requirePaintLimit(held)).toThrow(
            'config/behavior.yml: editor.paint_limit_kb must be a number above zero'
        );
    });
});
