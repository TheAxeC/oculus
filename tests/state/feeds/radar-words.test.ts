// Layer 2, client state test. The Lit Watch radar read by the words of config/catalogs/vocab.yml
// (state/feeds/radar.ts): the bucket an entry whose bucket no row names is drawn under is the one
// `radar_buckets` marks `default: true`, the Idea form is offered in the buckets it marks
// `spark: true` and to a paper whose `maps_to` is `new-idea-candidate`, the papers of one day are
// ordered by the words of `radar_relevance` in their order, and a relevance is toned by its word's
// colour. Oculus's words are read from its own configuration; a hub's are given as the words the
// views pass.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    bucketsOf,
    defaultBucket,
    defaultRelevance,
    radarBuckets,
    relevanceTone,
    relevanceWords,
    sortBucket,
    sparks,
    type RadarEntry
} from '../../../src/lib/state/feeds/radar.ts';
import { it } from '../../fixtures/scratch.ts';

/** Oculus's merged configuration, whose vocabulary the radar's helpers read. */
const OCULUS = loadConfig(engineDir()).config;

/** A paper of the bucket, found on the day, of the relevance given. */
function paper(title: string, bucket: string, found: string, relevance: string): RadarEntry {
    return { title, bucket, found, relevance };
}

describe("the radar's words", () => {
    it('draws an unknown bucket under the bucket radar_buckets marks default, and under none without one (G13)', () => {
        const buckets = radarBuckets(OCULUS.radar_buckets);
        const entries = [paper('A', 'idea', '', ''), paper('B', 'nosuch', '', '')];
        const held = (fallback: string | undefined) =>
            bucketsOf(entries, buckets, fallback).map((group) => [
                group.bucket.key,
                group.entries.map((entry) => entry.title)
            ]);
        expect(defaultBucket(OCULUS)).toBe('adjacent');
        expect(held(defaultBucket(OCULUS))).toEqual([
            ['preemption', []],
            ['idea', ['A']],
            ['cite_baseline', []],
            ['adjacent', ['B']]
        ]);
        const own = { radar_buckets: [{ key: 'near' }, { key: 'far', default: true }] };
        expect(defaultBucket(own)).toBe('far');
        expect(held(undefined).flatMap(([, titles]) => titles)).toEqual(['A']);
    });

    it('offers the Idea form in the buckets radar_buckets marks spark, and to a new-idea-candidate (G13)', () => {
        const offers = (words: Record<string, unknown>) =>
            [
                paper('A', 'idea', '', ''),
                paper('B', 'adjacent', '', ''),
                { ...paper('C', 'adjacent', '', ''), maps_to: 'new-idea-candidate' },
                { ...paper('D', 'adjacent', '', ''), maps_to: 'ward' }
            ].map((entry) => sparks(entry, words));
        expect(offers(OCULUS)).toEqual([true, false, true, false]);
        const own = { radar_buckets: [{ key: 'idea' }, { key: 'adjacent', spark: true }] };
        expect(offers(own)).toEqual([false, true, true, true]);
    });

    it('orders one day by the words of radar_relevance and tones each by its colour (G13)', () => {
        expect(relevanceWords(OCULUS)).toEqual(['high', 'med', 'low']);
        expect(defaultRelevance(OCULUS)).toBe('med');
        const day = [
            paper('Low', 'idea', '2026-11-01', 'low'),
            paper('None', 'idea', '2026-11-01', ''),
            paper('High', 'idea', '2026-11-01', 'high'),
            paper('Later', 'idea', '2026-11-02', 'low')
        ];
        const titles = (ranks: string[]) => sortBucket(day, ranks).map((entry) => entry.title);
        expect(titles(relevanceWords(OCULUS))).toEqual(['Later', 'High', 'Low', 'None']);
        expect(titles(['low', 'high'])).toEqual(['Later', 'Low', 'High', 'None']);
        expect(['high', 'med', 'low', 'nosuch'].map((one) => relevanceTone(one, OCULUS))).toEqual([
            'red',
            'amber',
            'grey',
            'grey'
        ]);
        const own = { ...OCULUS, radar_relevance: { close: { color: '#2563eb' } } };
        expect([relevanceTone('close', own), relevanceTone('high', own)]).toEqual(['blue', 'grey']);
    });
});
