// Layer 2, client-state tests. The Projects board's filter menu on a workspace of two hubs
// (state/boards/board/facets.ts, facets and facetValues): a domain and a resource that both hubs'
// projects name are one row each, counted over both hubs, and a filter on that row keeps both
// hubs' projects (state.ts, applyFilters). The items are synthetic and hold only what the facets
// read; the second hub's ids carry its prefix, as the merged portfolio gives them.
//
// It does not cover the menu drawing the rows, which the look does.

import { describe, expect, it } from 'vitest';
import type { BoardItem, BoardPreset } from '../../../../src/lib/state/boards/board/presets.ts';
import { facets } from '../../../../src/lib/state/boards/board/facets.ts';
import { applyFilters } from '../../../../src/lib/state/boards/board/state.ts';

/**
 * A project of the primary hub, or of `root`, in the domain `methods` on the resource `utwente`.
 */
function item(id: string, root?: string): BoardItem {
    const key = (one: string): string => (root === undefined ? one : `${root}:${one}`);
    return {
        id: key(id),
        project: root === undefined ? { id } : { id: key(id), root },
        category: '',
        year: '',
        domain: { id: key('methods'), label: 'Methods', tone: '' },
        pillars: [],
        funding: [],
        datasets: [],
        chips: [],
        compute: [{ id: key('utwente'), label: 'UTwente HPC', kind: 'hpc', order: 1 }],
        reproduced: false,
        code: '',
        sessions: 'none',
        haystack: ''
    } as unknown as BoardItem;
}

const ITEMS = [item('one'), item('two', 'look-hub2')];
const PRESET = { categories: [], roles: [] } as unknown as BoardPreset;

describe('the filter menu on a workspace of two hubs', () => {
    it('lists a value both hubs name once, counted over both', () => {
        const found = facets(ITEMS, PRESET);
        const rows = (key: string) => found.find((facet) => facet.key === key)?.values;
        expect(rows('domain')).toEqual([{ value: 'methods', label: 'methods', count: 2 }]);
        expect(rows('compute')).toEqual([{ value: 'utwente', label: 'UTwente HPC', count: 2 }]);
    });

    it("keeps both hubs' projects under a filter on that value", () => {
        const kept = applyFilters(ITEMS, { domain: ['methods'], compute: ['utwente'] }, '');
        expect(kept.map((one) => one.id)).toEqual(['one', 'look-hub2:two']);
    });
});
