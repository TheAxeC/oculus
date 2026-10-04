// Layer 1, data tests. The rail list of config/layout.yml over values of the wrong type at every
// place the readers look. Findings are compared whole, in order.

import { describe, expect, it } from 'vitest';
import { railFindings } from '../../../../src/lib/data/sources/config/rail.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** Every kind of row the rule refuses, then two good ones, a repeat, and an unknown glyph. */
const ROWS = [
    3,
    null,
    [],
    { label: 3, glyph: 'g', page: 'p' },
    { label: ' ', glyph: 'g', page: 'p' },
    { label: 'L', glyph: 3, page: 'p' },
    { label: 'L', glyph: 'g', page: 3 },
    { label: 'L', glyph: 'g', page: 'zz' },
    { label: 'A', glyph: 'g', page: 'a' },
    { label: 'A2', glyph: 'g', page: 'a' },
    { label: 'B', glyph: 'nope', page: 'b' },
    { label: 'B', glyph: 'g', page: 'b' }
];

describe('railFindings', () => {
    const find = (config: Record<string, unknown>) => railFindings(config, 'layout.yml', CATALOG);
    const at = (key: string, message: string) => ({ file: 'layout.yml', key, message });

    it('words each problem of the list against the arrangements and glyphs it holds', () => {
        const found = find({ rail: ROWS, arrangements: { a: 1, b: 1 }, glyphs: { g: 'x' } });
        const shape = 'a rail button is not a map of label, glyph and page; it is not drawn';
        expect(found).toStrictEqual([
            at('rail[0]', shape),
            at('rail[1]', shape),
            at('rail[2]', shape),
            at('rail[3]', 'the rail button for p has no label; it is not drawn'),
            at('rail[4]', 'the rail button for p has no label; it is not drawn'),
            at('rail[5]', 'the rail button for p names no glyph; it is not drawn'),
            at('rail[6]', 'a rail button names no page; it is not drawn'),
            at(
                'rail[7]',
                'the rail button for zz names a page arrangements does not hold; it is not drawn'
            ),
            at('rail[9]', 'a second rail button names the page a; only the first is drawn'),
            at(
                'rail[10]',
                'the rail button for b names a glyph glyphs.yml does not hold; it is not drawn'
            )
        ]);
    });
});
