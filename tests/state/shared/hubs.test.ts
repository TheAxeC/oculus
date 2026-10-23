// Layer 2, state tests. Which hubs could take a new record (G8), the list every path that makes
// one asks from: a new entry of a collection, a paper saved to Literature, a task, an application
// and a new project. The holders are given as the selectors give them, in the workspace's folder
// order: the collections of one key, each carrying its hub's name in `root`, or, for a new
// project, the names of the workspace's hubs. The primary is `hub`.

import { describe, expect, it } from 'vitest';
import { hubsTaking } from '../../../src/lib/state/shared/page/hubs.ts';

describe('the hubs that could take a new record', () => {
    it.each([
        {
            name: 'the primary first, when it is second in the workspace',
            holders: [{ root: 'lab' }, { root: 'hub' }],
            primary: 'hub',
            hubs: ['hub', 'lab']
        },
        {
            name: 'the one hub that holds the collection',
            holders: [{ root: 'lab' }],
            primary: 'hub',
            hubs: ['lab']
        },
        {
            name: "the workspace's order, in a workspace with no primary",
            holders: [{ root: 'lab' }, { root: 'other' }],
            primary: null,
            hubs: ['lab', 'other']
        },
        {
            name: 'the others, when the primary does not hold the collection',
            holders: [{ root: 'lab' }, { root: 'other' }],
            primary: 'hub',
            hubs: ['lab', 'other']
        },
        {
            name: 'none, when no hub holds the collection',
            holders: [],
            primary: 'hub',
            hubs: []
        },
        {
            name: 'each hub once, and no holder of no hub',
            holders: [{ root: 'lab' }, {}, { root: 'lab' }, { root: '' }],
            primary: 'hub',
            hubs: ['lab']
        },
        {
            name: 'every hub of the workspace for a new project, the primary first',
            holders: ['lab', 'other', 'hub'],
            primary: 'hub',
            hubs: ['hub', 'lab', 'other']
        }
    ])('are $name (G8)', (row) => {
        expect(hubsTaking(row.holders, row.primary)).toEqual(row.hubs);
    });
});
