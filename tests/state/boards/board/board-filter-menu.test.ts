// Layer 2, client state test. The board's one filter control as data: a group per facet under the
// facet's heading, a choice per value with its count, the values in force ticked, the category's
// bucket hue, and the count of the values in force the control's words carry.
//
// The facets are handed in as data, since what is checked is the menu built over them; the facets
// themselves are tests/state/boards/board/board.test.ts. What this does NOT cover: the menu opening
// and a pick filtering the board, which need a page and are tests/browser/boards/cards.spec.ts.

import { describe, expect, it } from 'vitest';
import {
    NONE,
    filterGroups,
    filterLabel,
    filtersInForce,
    presetFor,
    type Facet
} from '../../../../src/lib/state/boards/board/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';

const ENGINE = loadConfig(engineDir()).config;
const catalog = textCatalog(ENGINE);
setCatalog(catalog);
setGlyphs(glyphCatalog(ENGINE));
setVocab({ palette: { '#0d9488': 'c-teal' } });

const PRESET = presetFor('projects', {
    tab_rollup: {
        projects: [
            { label: 'in progress', keys: ['active', 'manuscript'], color: '#0d9488' },
            { label: 'idea', keys: ['idea'] }
        ]
    }
});

/** Four facets, two of which hold a value of the same id, and one that holds nothing. */
const FACETS: Facet[] = [
    {
        key: 'category',
        values: [
            { value: 'in-progress', label: 'in progress', count: 3 },
            { value: 'idea', label: 'idea', count: 2 }
        ]
    },
    {
        key: 'status',
        values: [
            { value: 'lead', label: 'first author', count: 2 },
            { value: 'submitted', label: 'submitted', count: 1 }
        ]
    },
    {
        key: 'compute',
        values: [
            { value: 'hpc', label: 'hpc', count: 1 },
            { value: NONE, label: NONE, count: 4 }
        ]
    },
    { key: 'code', values: [{ value: NONE, label: NONE, count: 5 }] },
    { key: 'dataset', values: [] }
];

describe('the one filter control', () => {
    it('draws a group per facet that holds a value, headed by the facet, in the facets order', () => {
        const found = filterGroups(FACETS, {}, PRESET);
        expect(found.map((group) => group.id)).toEqual(['category', 'status', 'compute', 'code']);
        expect(found.map((group) => group.heading)).toEqual([
            catalog['board.facet_category'],
            catalog['board.facet_status'],
            catalog['board.facet_compute'],
            catalog['board.facet_code']
        ]);
        expect(found[1].items).toEqual([
            { id: 'lead', label: 'first author 2', active: false },
            { id: 'submitted', label: 'submitted 1', active: false }
        ]);
    });

    it('gives a value that is vocabulary its catalog words', () => {
        const compute = filterGroups(FACETS, {}, PRESET)[2].items;
        expect(compute.map((item) => item.label)).toEqual([
            `${catalog['board.compute_hpc']} 1`,
            `${catalog['board.compute_none']} 4`
        ]);
    });

    it('ticks the values in force and no other', () => {
        const found = filterGroups(FACETS, { status: ['lead'], compute: ['hpc', NONE] }, PRESET);
        const status = found[1].items;
        expect(status.filter((item) => item.active).map((item) => item.id)).toEqual(['lead']);
        expect(status[0].glyph).toBe('check');
        expect(status[1].glyph).toBeUndefined();
        expect(found[2].items.every((item) => item.active && item.glyph === 'check')).toBe(true);
    });

    it('keeps two facets whose values share an id apart, by the group they are in', () => {
        const found = filterGroups(FACETS, { code: [NONE] }, PRESET);
        expect(found[3].items[0].active).toBe(true);
        expect(found[2].items[1].active).toBe(false);
    });

    it('gives a category value its bucket hue and the values of no other facet a hue', () => {
        const found = filterGroups(FACETS, {}, PRESET);
        expect(found[0].items.map((item) => item.tone)).toEqual(['teal', undefined]);
        const rest = found.slice(1).flatMap((group) => group.items);
        expect(rest.some((item) => item.tone !== undefined)).toBe(false);
    });

    it('counts every value in force over every facet on the control', () => {
        expect(filtersInForce({})).toBe(0);
        expect(filtersInForce({ status: ['lead'], compute: ['hpc', 'local'] })).toBe(3);
        expect(filterLabel({})).toBe(catalog['board.filter']);
        expect(filterLabel({ status: ['lead'], compute: ['hpc', 'local'] })).toBe(
            catalog['board.filter_count'].replace('{0}', '3')
        );
    });
});
