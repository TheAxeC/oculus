// Layer 2, client-state tests. The Lit Watch grouping, ordering, searching, joining, seeding, tones
// and saved state.

import { describe, expect, it } from 'vitest';
import {
    bucketsOf,
    crossLinksOf,
    ideaSeed,
    isNew,
    parseRadarState,
    radarBuckets,
    radarSearch,
    relevanceTone,
    sortBucket,
    type RadarEntry,
    dismissedSplit,
    filledBuckets
} from '../../../src/lib/state/feeds/radar.ts';
import type { Project } from '../../../src/lib/data/model/index.ts';

const ENTRIES: RadarEntry[] = [
    { title: 'Old high', bucket: 'preemption', found: '2026-09-01', relevance: 'high' },
    { title: 'New low', bucket: 'preemption', found: '2026-09-02', relevance: 'low' },
    { title: 'New high', bucket: 'preemption', found: '2026-09-02', relevance: 'high' },
    { title: 'Unknown', bucket: 'other', found: '2026-09-03' }
];

describe('radar selectors', () => {
    it('sorts by found then relevance and marks the entries found on the last run', () => {
        expect(sortBucket(ENTRIES.slice(0, 3)).map((entry) => entry.title)).toEqual([
            'New high',
            'New low',
            'Old high'
        ]);
        expect(isNew(ENTRIES[1], '2026-09-02')).toBe(true);
        expect(isNew(ENTRIES[0], '2026-09-02')).toBe(false);
    });

    it('requires every search word across the eight fields', () => {
        const entries = [
            {
                title: 'Tensor paper',
                authors: 'Ada',
                venue: 'Nature',
                year: 2026,
                project: 'alpha',
                motif: 'coupling',
                why: 'useful baseline',
                threatens: 'claim'
            }
        ];
        expect(radarSearch(entries, 'tensor ada nature 2026 alpha coupling useful claim')).toEqual(
            entries
        );
        expect(radarSearch(entries, 'tensor missing')).toEqual([]);
    });

    it('makes a bounded seed, project links, and parsed instance state', () => {
        const seed = ideaSeed({
            motif: 'A Very Long Motif! With Symbols and More Than Forty Characters',
            idea_spark: 'Explain it'
        });
        expect(seed.id).toMatch(/^[a-z0-9-]{1,40}$/);
        expect(seed.eli5).toBe('Explain it');
        expect(ideaSeed({ title: 'Valid title', motif: '---', why: 'w' }).id).toBe('valid-title');
        expect(ideaSeed({ title: 'Fallback Title', why: 'Fallback reason' })).toEqual({
            id: 'fallback-title',
            eli5: 'Fallback reason'
        });
        const projects = { alpha: { id: 'alpha' }, beta: { id: 'beta' } } as unknown as Record<
            string,
            Project
        >;
        expect(
            crossLinksOf({ project: 'alpha', maps_to: 'beta' }, projects).map(
                (project) => project.id
            )
        ).toEqual(['alpha', 'beta']);
        expect(parseRadarState({ search: 'paper', dismissedOpen: true })).toEqual({
            search: 'paper',
            dismissedOpen: true
        });
        expect(parseRadarState(null)).toEqual({ search: '', dismissedOpen: false });
    });
});

describe('the radar buckets that hold entries', () => {
    it('are the buckets that hold any, an empty bucket left out', () => {
        const buckets = [
            { key: 'read', glyph: '', label: 'Read', color: '' },
            { key: 'idea', glyph: '', label: 'Idea', color: '' }
        ];
        const groups = filledBuckets([{ title: 'a', bucket: 'read' }], buckets);
        expect(groups.map((group) => group.bucket.key)).toEqual(['read']);
    });
});

describe('the radar readers over fields of the wrong type', () => {
    const row = { key: 'k', glyph: 'g', label: 'l', color: 'c' };

    it.each([undefined, null, 'x', {}, []])('reads the vocabulary rows %j as no bucket', (rows) => {
        expect(radarBuckets(rows)).toEqual([]);
    });

    it('keeps the rows whose four fields are all text, as new objects with those four keys', () => {
        const rows = [
            row,
            null,
            3,
            'x',
            [],
            { ...row, key: 3 },
            { ...row, glyph: null },
            { ...row, label: [] },
            { ...row, color: 1 },
            { key: 'a' },
            { ...row, extra: 1 },
            { color: 'c', label: 'l', glyph: 'g', key: 'order' }
        ];
        const read = radarBuckets(rows);
        expect(read).toStrictEqual([row, row, { ...row, key: 'order' }]);
        expect(read[0]).not.toBe(rows[0]);
        expect(Object.keys(read[2])).toEqual(['key', 'glyph', 'label', 'color']);
    });

    it('groups an entry by the text of its bucket, a number as its digits, any other type as adjacent', () => {
        const buckets = ['preemption', 'adjacent', '5'].map((key) => ({ ...row, key }));
        const entries = [
            { bucket: 5 },
            { bucket: 'preemption' },
            { bucket: null },
            { bucket: ['preemption'] },
            { bucket: true },
            {}
        ];
        const groups = bucketsOf(entries, buckets).map((group) => [
            group.bucket.key,
            group.entries
        ]);
        expect(groups).toStrictEqual([
            ['preemption', [entries[1]]],
            ['adjacent', [entries[2], entries[3], entries[4], entries[5]]],
            ['5', [entries[0]]]
        ]);
    });

    it('orders by the text of found, then by a relevance that is one of the three words', () => {
        const entries = [
            { t: 1, found: 20260101 },
            { t: 2, found: '2026-09-01' },
            { t: 3, found: true },
            { t: 4, found: NaN },
            { t: 5, found: ['z'] }
        ];
        expect(sortBucket(entries).map((one) => one.t)).toEqual([4, 1, 2, 3, 5]);
        const ranked = [
            { t: 1, found: 'a', relevance: 3 },
            { t: 2, found: 'a', relevance: ['high'] },
            { t: 3, found: 'a', relevance: 'med' },
            { t: 4, found: 'a', relevance: 'high' }
        ];
        expect(sortBucket(ranked).map((one) => one.t)).toEqual([4, 3, 1, 2]);
        expect(sortBucket(ranked)).not.toBe(ranked);
    });

    it('leaves a null entry out of the order', () => {
        const entry = { t: 1, found: 'a' };
        expect(sortBucket([null, entry])).toStrictEqual([entry]);
    });

    it('ranks a relevance named like a property of every object as no rank at all', () => {
        const entries = ['constructor', 'high', 'toString', 'low', '__proto__'].map(
            (relevance, t) => ({
                t,
                found: 'a',
                relevance
            })
        );
        expect(sortBucket(entries).map((one) => one.t)).toEqual([1, 3, 0, 2, 4]);
    });

    it.each([
        [{ found: 20260902 }, 20260902, true],
        [{ found: '20260902' }, 20260902, true],
        [{ found: '2026-09-02' }, true, false],
        [{ found: '2026-09-02' }, ['2026-09-02'], false],
        [{ found: '2026-09-02' }, null, false],
        [{ found: '' }, '', false],
        [{ found: NaN }, NaN, true],
        [{ found: 'Infinity' }, Infinity, true],
        [{ found: 'true' }, true, false]
    ])('marks the entry %j new against the last run %j as %j', (entry, lastRun, marked) => {
        expect(isNew(entry, lastRun)).toBe(marked);
    });

    it('puts an entry in the dismissed section only for the boolean true or the exact text true', () => {
        const entries = [
            { dismissed: 'true' },
            { dismissed: 'TRUE' },
            { dismissed: 'True' },
            { dismissed: ' true' },
            { dismissed: ['true'] },
            { dismissed: 1 },
            { dismissed: true },
            { dismissed: null },
            {}
        ];
        expect(dismissedSplit(entries)).toStrictEqual({
            live: [
                entries[1],
                entries[2],
                entries[3],
                entries[4],
                entries[5],
                entries[7],
                entries[8]
            ],
            dismissed: [entries[0], entries[6]]
        });
    });

    it.each([
        ['high', 'red'],
        ['med', 'amber'],
        ['low', 'grey'],
        ['HIGH', 'grey'],
        [3, 'grey'],
        [null, 'grey'],
        [['high'], 'grey'],
        [undefined, 'grey']
    ])('draws the relevance %j in %j', (relevance, tone) => {
        expect(relevanceTone(relevance)).toBe(tone);
    });

    it('searches a number or a NaN field as its text and never a boolean, a list or a map', () => {
        const entries = [
            {
                title: 3,
                authors: true,
                venue: ['v'],
                year: NaN,
                project: null,
                motif: 'm',
                why: 7,
                threatens: {}
            }
        ];
        for (const found of ['3', 'nan', '7', 'm'])
            expect(radarSearch(entries, found)).toEqual(entries);
        for (const missed of ['true', 'v', 'null', 'object']) {
            expect(radarSearch(entries, missed)).toEqual([]);
        }
    });

    it.each([
        [
            { motif: 5, title: 'T' },
            { id: '5', eli5: '' }
        ],
        [
            { motif: 'A!', title: 'T', idea_spark: 3, why: 'w' },
            { id: 'a', eli5: '3' }
        ],
        [
            { motif: ['x'], title: ['y'] },
            { id: '', eli5: '' }
        ],
        [
            { motif: '', title: 'T Title', idea_spark: '', why: 8 },
            { id: 't-title', eli5: '8' }
        ],
        [{ motif: NaN }, { id: 'nan', eli5: '' }],
        [
            { motif: true, title: true, idea_spark: true, why: false },
            { id: '', eli5: '' }
        ],
        [{}, { id: '', eli5: '' }]
    ])('seeds the idea from the entry %j as %j', (entry, seed) => {
        expect(ideaSeed(entry)).toStrictEqual(seed);
    });

    it('links the projects named by project and maps_to, a number as its digits, once each', () => {
        const projects = {
            '5': { id: '5' },
            alpha: { id: 'alpha' },
            toString: { id: 'ts' }
        } as unknown as Record<string, Project>;
        const linked = (entry: RadarEntry): string[] =>
            crossLinksOf(entry, projects).map((project) => project.id);
        expect(linked({ project: 5 })).toEqual(['5']);
        expect(linked({ project: 'alpha', maps_to: 'alpha' })).toEqual(['alpha']);
        expect(linked({ project: 'toString' })).toEqual(['ts']);
        expect(linked({ project: 'constructor', maps_to: '__proto__' })).toEqual([]);
        expect(linked({ project: ['alpha'], maps_to: true })).toEqual([]);
        expect(linked({ project: NaN, maps_to: 'alpha' })).toEqual(['alpha']);
        expect(linked({ project: null, maps_to: 5 })).toEqual(['5']);
        expect(linked({})).toEqual([]);
    });
});
