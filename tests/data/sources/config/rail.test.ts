// Layer 1, data tests. The rail list of config/layout.yml over values of the wrong type at every
// place the readers look. Findings are compared whole, in order.

import { describe, expect, it } from 'vitest';
import { railFindings, readRail } from '../../../../src/lib/data/sources/config/rail.ts';
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

    it('words a chord or group glyph it does not use, and keeps the button with the rest', () => {
        const rows = [
            { label: 'A', glyph: 'g', page: 'a', chord: 'ab', group_glyph: 'nope' },
            { label: 'B', glyph: 'g', page: 'b', chord: 3, group_glyph: 3 },
            { label: 'C', glyph: 'g', page: 'c', chord: 'C', group_glyph: '' },
            { label: 'D', glyph: 'g', page: 'd', chord: 'd', group_glyph: 'g' },
            { label: 'E', glyph: 'g', page: 'e', chord: '' }
        ];
        const config = { rail: rows, arrangements: { a: 1, b: 1, c: 1, d: 1, e: 1 } };
        const chord = (page: string) =>
            `the rail button for ${page} names a chord that is not one lowercase letter; its group has no chord`;
        const glyph = (page: string) =>
            `the rail button for ${page} names a group glyph glyphs.yml does not hold; its group heading takes the glyph of its first view`;
        expect(find({ ...config, glyphs: { g: 'x' } })).toStrictEqual([
            at('rail[0]', chord('a')),
            at('rail[0]', glyph('a')),
            at('rail[1]', chord('b')),
            at('rail[1]', glyph('b')),
            at('rail[2]', chord('c'))
        ]);
        const read = readRail(rows, ['a', 'b', 'c', 'd', 'e'], ['g']);
        expect(read.entries.map((one) => [one.page, one.chord, one.group_glyph])).toEqual([
            ['a', '', ''],
            ['b', '', ''],
            ['c', '', ''],
            ['d', 'd', 'g'],
            ['e', '', '']
        ]);
    });
});
