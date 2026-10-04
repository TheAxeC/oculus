// Layer 1, data tests. The canonical form of a search: the inputs that are refused before anything
// runs.
//
// Nothing here starts a process: this is the rule both sides share, so it is read on its own.

import { describe, expect, it } from 'vitest';
import {
    emptyQuery,
    searchQuery,
    type SearchQuery
} from '../../../src/lib/data/helpers/search/query.ts';

const ROOTS = ['hub', 'engine', 'cathedra'];

/** A query with everything at its default, and whatever a case wants instead. */
function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

describe('the folder a search is scoped to', () => {
    const held = (changes: Partial<SearchQuery> = {}): SearchQuery => ({
        ...query(),
        under: '',
        ...changes
    });

    it('answers a plan with the refusal for a folder that climbs out', () => {
        expect(searchQuery(held({ under: '../x', root: 'hub' }), ROOTS)).toEqual({
            ok: false,
            refused: 'outside'
        });
    });
});
