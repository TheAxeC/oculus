// The board's facets and filters over a hand-built snapshot: what the facets count, what a filter
// and a search leave, which bucket an item falls in, and what a saved state parses to. Everything
// here is pure, so nothing reads a file and nothing renders.

import { describe, expect, it } from 'vitest';
import {
    NONE,
    applyFilters,
    bucketOf,
    emptyBoardState,
    facetValues,
    facets,
    parseBoardState,
    presetFor
} from '../../../../src/lib/state/boards/board/index.ts';
import { CONFIG, project, PROJECTS, ITEMS, ids, item, facet, over } from './board-fixture.ts';

describe('facets', () => {
    it('counts the lifecycle buckets in the rollup order', () => {
        expect(facet(PROJECTS, ITEMS, 'category')).toEqual(['in-progress:2', 'idea:3']);
    });

    it('counts the years newest first and puts the undated last', () => {
        expect(facet(PROJECTS, ITEMS, 'year')).toEqual(['2026:1', '2025:1', `${NONE}:4`]);
    });

    it('counts the domains, the pillars and the status chips', () => {
        expect(facet(PROJECTS, ITEMS, 'domain')).toEqual(['brain:1', 'heart:1']);
        expect(facet(PROJECTS, ITEMS, 'pillar')).toEqual(['federated:1', 'tensor:1']);
        expect(facet(PROJECTS, ITEMS, 'status')).toEqual(['lead:2', 'submitted:1']);
    });

    it('counts the projects that name no funding as a value of their own', () => {
        expect(facet(PROJECTS, ITEMS, 'funding')).toEqual(['FAIR:1', `${NONE}:5`]);
    });

    it('counts compute, reproduced and the code deposit in their fixed order', () => {
        expect(facet(PROJECTS, ITEMS, 'compute')).toEqual(['hpc:1', 'local:1', `${NONE}:4`]);
        expect(facet(PROJECTS, ITEMS, 'reproduced')).toEqual(['1:1', '0:5']);
        expect(facet(PROJECTS, ITEMS, 'code')).toEqual([
            'deposited:1',
            'review-anon:1',
            `${NONE}:4`
        ]);
    });

    it('offers a facet that holds one value, as that one value', () => {
        expect(facet(PROJECTS, ITEMS, 'dataset')).toEqual(['mimic:1']);
        expect(facets(ITEMS, PROJECTS).map((one) => one.key)).toEqual([
            'category',
            'year',
            'domain',
            'pillar',
            'funding',
            'dataset',
            'status',
            'compute',
            'reproduced',
            'code',
            'sessions'
        ]);
    });

    it('gives a facet value the words of its own vocabulary', () => {
        const domain = facets(ITEMS, PROJECTS).find((one) => one.key === 'domain');
        expect(domain?.values.map((value) => value.label)).toEqual([
            'Neuroscience | EEG',
            'Cardiology | ECG'
        ]);
        const status = facets(ITEMS, PROJECTS).find((one) => one.key === 'status');
        expect(status?.values.map((value) => value.label)).toEqual([
            'first author',
            'submitted / under review'
        ]);
    });
});

describe('applyFilters', () => {
    it('leaves everything alone with no filter and no search', () => {
        expect(applyFilters(ITEMS, {}, '')).toHaveLength(ITEMS.length);
    });

    it('takes every selected value of one facet, which is an alternative within it', () => {
        expect(ids(applyFilters(ITEMS, { status: ['lead', 'submitted'] }, ''))).toEqual([
            'alpha',
            'bravo',
            'echo'
        ]);
    });

    it('requires every facet that has a selection at once', () => {
        expect(ids(applyFilters(ITEMS, { status: ['lead'], compute: ['hpc'] }, ''))).toEqual([
            'alpha'
        ]);
        expect(applyFilters(ITEMS, { status: ['submitted'], compute: ['hpc'] }, '')).toEqual([]);
    });

    it('ignores a facet whose selection is empty', () => {
        expect(applyFilters(ITEMS, { status: [] }, '')).toHaveLength(ITEMS.length);
    });

    it('filters on the values that stand for having none', () => {
        expect(ids(applyFilters(ITEMS, { funding: [NONE] }, ''))).toEqual([
            'charlie',
            'bravo',
            'foxtrot',
            'delta',
            'echo'
        ]);
    });

    it('searches every field a card and its tags carry', () => {
        const words = [
            'Alpha',
            'shorthandle',
            'eli5token',
            'latesttoken',
            'nexttoken',
            'outcometoken',
            'BSPC',
            'resulttoken',
            'ideatoken',
            'FAIR',
            'Federated learning',
            'mimic',
            'Someone Else'
        ];
        for (const word of words) {
            expect({ word, found: ids(applyFilters(ITEMS, {}, word)) }).toEqual({
                word,
                found: ['alpha']
            });
        }
    });

    it('searches without regard to case and with the ends trimmed', () => {
        expect(ids(applyFilters(ITEMS, {}, '  ELI5TOKEN '))).toEqual(['alpha']);
    });

    it('applies the filters and the search at once', () => {
        expect(applyFilters(ITEMS, { status: ['submitted'] }, 'eli5token')).toEqual([]);
    });
});

describe('facetValues', () => {
    it('gives nothing for a facet key nobody offers', () => {
        expect(facetValues(item('alpha'), 'nonesuch')).toEqual([]);
    });
});

describe('bucketOf', () => {
    it('takes the first bucket whose keys name the type or one of the chips', () => {
        const rollup = presetFor('coauthor', CONFIG).rollup;
        expect(bucketOf(project('one', 'coauthor', { chips: ['submitted'] }), rollup)).toBe(
            'in-progress'
        );
        expect(bucketOf(project('two', 'coauthor', { type: 'submitted' }), rollup)).toBe(
            'in-progress'
        );
        expect(bucketOf(project('three', 'coauthor', { type: 'nogo' }), rollup)).toBe('');
    });

    it('stops at the first bucket, in the config order', () => {
        const rollup = [
            { id: 'first', label: 'first', keys: ['idea'], color: '' },
            { id: 'second', label: 'second', keys: ['lead'], color: '' }
        ];
        expect(bucketOf(project('x', 'ideas', { type: 'idea', chips: ['lead'] }), rollup)).toBe(
            'first'
        );
    });
});

describe('parseBoardState', () => {
    it('gives the empty state for anything that is not a map', () => {
        for (const value of [undefined, null, 7, 'state', [1, 2]]) {
            expect(parseBoardState(value)).toEqual(emptyBoardState());
        }
    });

    it('takes the label mode it was given as the default', () => {
        expect(parseBoardState(undefined, 'full').labels).toBe('full');
        expect(parseBoardState({ labels: 'short' }, 'full').labels).toBe('short');
    });

    it('keeps a state it wrote itself', () => {
        const state = {
            mode: 'list' as const,
            search: 'ecg',
            filters: { status: ['lead'] },
            expanded: ['alpha'],
            more: ['bravo'],
            labels: 'full' as const,
            stale: true,
            dated: true,
            hiddenTypes: ['idea']
        };
        expect(parseBoardState(state)).toEqual(state);
    });

    it('reads the quick filters as off and the type toggles as empty when they are not there', () => {
        const state = parseBoardState({ mode: 'list' });
        expect(state.stale).toBe(false);
        expect(state.dated).toBe(false);
        expect(state.hiddenTypes).toEqual([]);
    });

    it('drops a hidden type that is not a string', () => {
        expect(parseBoardState({ hiddenTypes: ['idea', 7] }).hiddenTypes).toEqual(['idea']);
    });

    it('drops a mode, a label mode and a search that are not what they should be', () => {
        expect(parseBoardState({ mode: 'grid', labels: 'medium', search: 7 })).toEqual(
            emptyBoardState()
        );
    });

    it('drops a filter on a facet nobody offers, and a value that is not a string', () => {
        expect(
            parseBoardState({ filters: { nonesuch: ['x'], status: ['lead', 3], year: [] } }).filters
        ).toEqual({ status: ['lead'] });
    });

    it('drops an expanded list that is not a list of ids', () => {
        expect(parseBoardState({ expanded: 'alpha' }).expanded).toEqual([]);
        expect(parseBoardState({ expanded: ['alpha', 7] }).expanded).toEqual(['alpha']);
    });
});

describe('applyFilters, the quick filters and the type toggles', () => {
    const { items } = over({ alpha: { staleDays: 3 }, charlie: { staleDays: 1 } });

    it('leaves only what is behind by at least the lag it is given', () => {
        expect(ids(applyFilters(items, {}, '', { stale: true, staleLag: 1 })).sort()).toEqual([
            'alpha',
            'charlie'
        ]);
        expect(ids(applyFilters(items, {}, '', { stale: true, staleLag: 3 }))).toEqual(['alpha']);
    });

    it('leaves only what carries a deadline', () => {
        expect(ids(applyFilters(items, {}, '', { dated: true }))).toEqual(['alpha']);
    });

    it('drops the types that are switched off and keeps every other', () => {
        expect(ids(applyFilters(items, {}, '', { hiddenTypes: ['idea', 'exploring'] }))).toEqual([
            'alpha',
            'bravo'
        ]);
    });

    it('changes nothing when it is given no quick filter at all', () => {
        expect(ids(applyFilters(items, {}, ''))).toEqual(ids(items));
    });
});
