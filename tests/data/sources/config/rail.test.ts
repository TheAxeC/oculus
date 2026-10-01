// The rail list of config/layout.yml read as rows, as entries and as findings, over values of the
// wrong type at every place the readers look. Findings and problems are compared whole, in order.

import { describe, expect, it } from 'vitest';
import {
    arrangementKeys,
    glyphNames,
    railFindings,
    railRows,
    readRail
} from '../../../../src/lib/data/sources/config/rail.ts';
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

describe('railRows', () => {
    it.each([['x'], [{}], [null]])('answers null for %j', (raw) => {
        expect(railRows(raw)).toBeNull();
    });

    it('reads a field that is not text, and an item that is not a map, as empty text', () => {
        const blank = { label: '', glyph: '', page: '' };
        expect(
            railRows([
                3,
                { label: 3, glyph: 'g', page: 'p' },
                null,
                [],
                { label: 'L', glyph: 'g', page: 'p', extra: 1 }
            ])
        ).toStrictEqual([
            blank,
            { label: '', glyph: 'g', page: 'p' },
            blank,
            blank,
            { label: 'L', glyph: 'g', page: 'p' }
        ]);
    });
});

describe('arrangementKeys and glyphNames', () => {
    it.each([[[]], ['x'], [null]])('read %j as no keys', (raw) => {
        expect(arrangementKeys(raw)).toStrictEqual([]);
    });

    it('lists the keys of a map in the file order', () => {
        expect(arrangementKeys({ b: 1, a: 2 })).toStrictEqual(['b', 'a']);
        expect(glyphNames({ glyphs: { b: 1, a: 2 } })).toStrictEqual(['b', 'a']);
    });

    it.each([[undefined], [{}], [{ glyphs: [] }], [{ glyphs: 'x' }]])(
        'answers nothing for the config %j',
        (config) => {
            expect(glyphNames(config)).toBeUndefined();
        }
    );
});

describe('readRail', () => {
    it.each([['x'], [{}], [null]])('answers no entries and no problems for %j', (raw) => {
        expect(readRail(raw, [], [])).toStrictEqual({ entries: [], problems: [] });
    });

    it('keeps the buttons the rule accepts and names each it leaves out, in order', () => {
        expect(readRail(ROWS, ['a', 'b'], ['g'])).toStrictEqual({
            entries: [
                { label: 'A', glyph: 'g', page: 'a' },
                { label: 'B', glyph: 'g', page: 'b' }
            ],
            problems: [
                { index: 0, why: 'shape', page: '' },
                { index: 1, why: 'shape', page: '' },
                { index: 2, why: 'shape', page: '' },
                { index: 3, why: 'label', page: 'p' },
                { index: 4, why: 'label', page: 'p' },
                { index: 5, why: 'glyph', page: 'p' },
                { index: 6, why: 'page', page: '' },
                { index: 7, why: 'page_unknown', page: 'zz' },
                { index: 9, why: 'repeated', page: 'a' },
                { index: 10, why: 'glyph_unknown', page: 'b' }
            ]
        });
    });

    it('checks no glyph against a vocabulary when it is given none', () => {
        const read = readRail(ROWS, ['a', 'b']);
        expect(read.entries).toStrictEqual([
            { label: 'A', glyph: 'g', page: 'a' },
            { label: 'B', glyph: 'nope', page: 'b' }
        ]);
        expect(read.problems.at(-1)).toStrictEqual({ index: 11, why: 'repeated', page: 'b' });
    });
});

describe('railFindings', () => {
    const find = (config: Record<string, unknown>) => railFindings(config, 'layout.yml', CATALOG);
    const at = (key: string, message: string) => ({ file: 'layout.yml', key, message });

    it('reports nothing for a config with no rail', () => {
        expect(find({})).toStrictEqual([]);
    });

    it.each([['x'], [{}]])('reports a rail of %j as not a list', (rail) => {
        expect(find({ rail })).toStrictEqual([at('rail', 'rail is not a list of buttons')]);
    });

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

    it('names every page unknown when the arrangements are not a map', () => {
        const found = find({ rail: ROWS.slice(8), arrangements: [1], glyphs: 'x' });
        expect(found.map((one) => one.message)).toStrictEqual([
            'the rail button for a names a page arrangements does not hold; it is not drawn',
            'the rail button for a names a page arrangements does not hold; it is not drawn',
            'the rail button for b names a page arrangements does not hold; it is not drawn',
            'the rail button for b names a page arrangements does not hold; it is not drawn'
        ]);
    });
});
