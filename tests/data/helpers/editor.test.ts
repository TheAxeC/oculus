// The `editor:` block of config/behavior.yml: the cap the source editor paints under, read
// leniently for a page that may not have been sent a configuration yet and required at the server's
// start.

import { describe, expect, it } from 'vitest';
import { paintLimit, requirePaintLimit } from '../../../src/lib/data/helpers/editor.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';

const { config } = loadConfig(engineDir());

describe('the source editor cap', () => {
    it("is the checked-in configuration's own kilobytes, in bytes", () => {
        expect((config as { editor?: Record<string, unknown> }).editor?.paint_limit_kb).toBe(64);
        expect(paintLimit(config)).toBe(64 * 1024);
        expect(requirePaintLimit(config)).toBe(64 * 1024);
    });

    it('is null for a block that is missing, of the wrong shape, or not a size', () => {
        for (const held of [
            {},
            { editor: 'on' },
            { editor: [] },
            { editor: {} },
            { editor: { paint_limit_kb: '64' } },
            { editor: { paint_limit_kb: 0 } },
            { editor: { paint_limit_kb: -1 } },
            { editor: { paint_limit_kb: Number.NaN } }
        ]) {
            expect(paintLimit(held as Record<string, unknown>)).toBeNull();
        }
    });

    it('throws naming the key when it is required and the configuration has no usable one', () => {
        expect(() => requirePaintLimit({})).toThrow(
            'config/behavior.yml: editor.paint_limit_kb must be a number above zero'
        );
        expect(() => requirePaintLimit({ editor: { paint_limit_kb: 0 } })).toThrow(
            'editor.paint_limit_kb'
        );
    });
});
