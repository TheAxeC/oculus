// Pure Lit Watch grouping, ordering, searching, joining, seeding, tones, and saved state.

import { describe, expect, it } from 'vitest';
import {
    bucketsOf,
    crossLinksOf,
    ideaSeed,
    isNew,
    parseRadarState,
    radarSearch,
    relevanceTone,
    sortBucket,
    type RadarBucket,
    type RadarEntry,
    dismissedSplit,
    filledBuckets
} from '../../../src/lib/state/feeds/radar.ts';
import type { Project } from '../../../src/lib/data/model/index.ts';

const BUCKETS: RadarBucket[] = ['preemption', 'idea', 'cite_baseline', 'adjacent'].map((key) => ({
    key,
    glyph: key,
    label: key,
    color: '#000000'
}));
const ENTRIES: RadarEntry[] = [
    { title: 'Old high', bucket: 'preemption', found: '2026-09-01', relevance: 'high' },
    { title: 'New low', bucket: 'preemption', found: '2026-09-02', relevance: 'low' },
    { title: 'New high', bucket: 'preemption', found: '2026-09-02', relevance: 'high' },
    { title: 'Unknown', bucket: 'other', found: '2026-09-03' }
];

describe('radar selectors', () => {
    it('groups in vocabulary order and sends unknown buckets to adjacent', () => {
        const groups = bucketsOf(ENTRIES, BUCKETS);
        expect(groups.map((group) => group.bucket.key)).toEqual(
            BUCKETS.map((bucket) => bucket.key)
        );
        expect(groups.at(-1)?.entries.map((entry) => entry.title)).toEqual(['Unknown']);
    });

    it('sorts by found then relevance and marks the last run', () => {
        expect(sortBucket(ENTRIES.slice(0, 3)).map((entry) => entry.title)).toEqual([
            'New high',
            'New low',
            'Old high'
        ]);
        expect(isNew(ENTRIES[1], '2026-09-02')).toBe(true);
        expect(isNew(ENTRIES[0], '2026-09-02')).toBe(false);
        expect(
            ['red', 'amber', 'grey'].map((tone, at) => relevanceTone(['high', 'med', 'low'][at]))
        ).toEqual(['red', 'amber', 'grey']);
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

describe('the radar entries split and bucketed', () => {
    // revert: src/lib/state/feeds/radar.ts "live: entries.filter((entry) => !isDismissed(entry))," => live: entries,
    it('split into the live and the dismissed, each in the order given', () => {
        const entries = [{ title: 'a' }, { title: 'b', dismissed: true }, { title: 'c' }];
        const split = dismissedSplit(entries);
        expect(split.live.map((one) => one.title)).toEqual(['a', 'c']);
        expect(split.dismissed.map((one) => one.title)).toEqual(['b']);
    });

    // revert: src/lib/state/feeds/radar.ts "return bucketsOf(entries, buckets).filter((group) => group.entries.length > 0);" => return bucketsOf(entries, buckets);
    it('fall into the buckets that hold any, an empty bucket left out', () => {
        const buckets = [
            { key: 'read', glyph: '', label: 'Read', color: '' },
            { key: 'idea', glyph: '', label: 'Idea', color: '' }
        ];
        const groups = filledBuckets([{ title: 'a', bucket: 'read' }], buckets);
        expect(groups.map((group) => group.bucket.key)).toEqual(['read']);
    });
});
