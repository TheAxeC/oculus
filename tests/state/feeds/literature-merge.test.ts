// Layer 4, state tests. How the Literature search merges the hits of its sources into papers (G45):
// hits that share an identifier are one paper, and hits that share none are never one. The merge
// is ordered by the fixture's rows (tests/server/core/reader/rows.yml): the sources in the order
// of `literature.sources`, the orders of `literature.prefer`, and the `links` rows a paper's
// address is built from. The merge is a function of the hits, so nothing here fetches or draws.

import { describe, expect, it } from 'vitest';
import type { LiteratureHit, LiteratureSource } from '../../../src/lib/data/model/index.ts';
import {
    mergeHits as mergeOrdered,
    orderOf,
    type MergedHit,
    type MergeOrder
} from '../../../src/lib/state/feeds/literature/merge.ts';
import { FIXTURE_CONFIG, fixtureRows } from '../../server/core/reader/rows.ts';

/** The fixture's order of the merge, read as the page reads it. */
const ORDER: MergeOrder = {
    sources: fixtureRows().literature.map((row) => row.key),
    ...orderOf(FIXTURE_CONFIG)
};

/** The hits merged in the fixture's order. */
function mergeHits(hits: LiteratureHit[]): MergedHit[] {
    return mergeOrdered(hits, ORDER);
}

/** A hit with the fields a case does not name filled in. */
function hit(
    source: LiteratureSource,
    over: Partial<LiteratureHit> & { id: string; rank?: number }
): LiteratureHit {
    return { source, title: `title of ${over.id}`, authors: [], type: 'article', rank: 1, ...over };
}

const DOI = '10.1186/1687-6180-2014-139';

describe('the literature merge', () => {
    it('merges hits by DOI, PubMed id or arXiv id and keeps hits that share none apart', () => {
        const rows: {
            name: string;
            hits: LiteratureHit[];
            papers: number;
            sources?: string[][];
        }[] = [
            {
                name: 'one DOI from two sources',
                hits: [
                    hit('crossref', { id: 'a', doi: DOI }),
                    hit('openalex', { id: 'b', doi: DOI })
                ],
                papers: 1,
                sources: [['openalex', 'crossref']]
            },
            {
                name: 'a DOI with its address, a DOI in capitals, a bare DOI',
                hits: [
                    hit('crossref', { id: 'a', doi: `https://doi.org/${DOI.toUpperCase()}` }),
                    hit('openalex', { id: 'b', doi: DOI }),
                    hit('pubmed', { id: 'c', doi: `doi:${DOI}` })
                ],
                papers: 1
            },
            {
                name: 'two different DOIs',
                hits: [
                    hit('crossref', { id: 'a', doi: '10.1000/one' }),
                    hit('openalex', { id: 'b', doi: '10.1000/two' })
                ],
                papers: 2
            },
            {
                name: 'a PubMed id only, from two sources',
                hits: [
                    hit('pubmed', { id: '25840362', pmid: '25840362' }),
                    hit('europe_pmc', { id: 'MED:25840362', pmid: '25840362' })
                ],
                papers: 1
            },
            {
                name: 'an arXiv id only, from two sources',
                hits: [
                    hit('arxiv', { id: '1403.4462', arxiv: '1403.4462', type: 'preprint' }),
                    hit('semantic_scholar', { id: 'f'.repeat(40), arxiv: '1403.4462' })
                ],
                papers: 1
            },
            {
                name: 'a preprint named with its DOI by one source, and the published hit',
                hits: [
                    hit('crossref', {
                        id: 'a',
                        doi: '10.1109/msp.2013.2297439',
                        title: 'Published'
                    }),
                    hit('arxiv', {
                        id: '1403.4462',
                        arxiv: '1403.4462',
                        type: 'preprint',
                        title: 'Preprint',
                        pdf: 'https://arxiv.org/pdf/1403.4462'
                    }),
                    hit('semantic_scholar', {
                        id: 'f'.repeat(40),
                        doi: '10.1109/msp.2013.2297439',
                        arxiv: '1403.4462'
                    })
                ],
                papers: 1
            },
            {
                name: 'two hits with no identifier and one title',
                hits: [
                    hit('openalex', { id: 'W1', title: 'EEG tensor decomposition' }),
                    hit('semantic_scholar', {
                        id: 'f'.repeat(40),
                        title: 'EEG tensor decomposition'
                    })
                ],
                papers: 2
            },
            {
                name: 'one DOI twice inside one source',
                hits: [
                    hit('openalex', { id: 'W1', doi: DOI, rank: 7 }),
                    hit('openalex', { id: 'W2', doi: DOI, rank: 2 })
                ],
                papers: 1
            }
        ];
        for (const row of rows) {
            const merged = mergeHits(row.hits);
            expect(merged.length, row.name).toBe(row.papers);
            if (row.sources !== undefined) {
                expect(
                    merged.map((paper) => [...paper.sources].sort()),
                    row.name
                ).toStrictEqual(row.sources.map((one) => [...one].sort()));
            }
        }

        const preprint = mergeHits(rows[5].hits)[0];
        expect(preprint.title).toBe('Published');
        expect(preprint.type).toBe('article');
        expect(preprint.doi).toBe('10.1109/msp.2013.2297439');
        expect(preprint.pdf).toBe('https://arxiv.org/pdf/1403.4462');
        expect(preprint.sources).toStrictEqual(['semantic_scholar', 'crossref', 'arxiv']);

        // The better of the two ranks counts once for the source.
        const twice = mergeHits(rows[7].hits)[0];
        const once = mergeHits([hit('openalex', { id: 'W2', doi: DOI, rank: 2 })])[0];
        expect(twice.relevance).toBeCloseTo(once.relevance, 12);
    });
});
