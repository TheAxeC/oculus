// Layer 1, data tests. The `counts` map of config/layout.yml as the config check reads it: the
// shipped map gives no finding, and each row the brief names as wrong gives one finding naming the
// row or the field. Findings are compared whole, in order.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { countsFindings } from '../../../../src/lib/data/sources/config/sections/counts.ts';

const SHIPPED = loadConfig(engineDir()).config;
const CATALOG = textCatalog(SHIPPED);

/** The findings over the shipped config with `counts` replaced, each as its key and sentence. */
function said(counts: unknown): string[] {
    return countsFindings({ ...SHIPPED, counts }, 'layout.yml', CATALOG).map(
        (one) => `${one.key}: ${one.message}`
    );
}

describe('countsFindings', () => {
    it('reads the shipped counts with no finding', () => {
        expect(countsFindings(SHIPPED, 'layout.yml', CATALOG)).toEqual([]);
    });

    it.each([
        [
            { linkedin: { tab: true, rail: true } },
            [
                'counts.linkedin: counts.linkedin names no view that draws a count; the row is not read'
            ]
        ],
        [
            { zzz: { tab: true, rail: true } },
            ['counts.zzz: counts.zzz names no view that draws a count; the row is not read']
        ],
        [
            { data: { tab: true, rail: true } },
            ['counts.data: counts.data names no view that draws a count; the row is not read']
        ],
        [
            { funding: { match: ['submitted'], days: 3, tab: true, rail: true } },
            [
                'counts.funding.days: counts.funding.days is not a field this row takes; it is not read'
            ]
        ],
        [
            { inbox: { tab: 'yes', rail: true } },
            ['counts.inbox.tab: counts.inbox.tab must be true or false; it is not read']
        ],
        [
            { inbox: { match: ['open'], tab: true, rail: true } },
            ['counts.inbox.match: counts.inbox.match is not a field this row takes; it is not read']
        ],
        [
            { leads: { days: 'soon', tab: true, rail: false } },
            ['counts.leads.days: counts.leads.days must be a number; it is not read']
        ],
        [3, ['counts: counts must be a map; no view draws a count']]
    ])('words the counts %j', (counts, expected) => {
        expect(said(counts)).toEqual(expected);
    });
});
