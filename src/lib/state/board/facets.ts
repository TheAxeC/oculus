// Layer 2, client state. Board facet values, labels, ordering and counts live here because facet
// vocabulary changes independently of item construction and board state.

import { chipKeys, chipLabel, domainLabel } from '../tones.ts';
import {
    CODE_VALUES,
    COMPUTE_VALUES,
    FACETS,
    NONE,
    REPRODUCED_VALUES,
    SESSIONS_VALUES,
    type BoardItem,
    type BoardPreset,
    type Facet
} from './presets.ts';

export function facetValues(item: BoardItem, facet: string): string[] {
    switch (facet) {
        case 'category':
            return item.bucket === '' ? [] : [item.bucket];
        case 'year':
            return [item.year === '' ? NONE : item.year];
        case 'domain':
            return item.domain === null ? [] : [item.domain.id];
        case 'program':
            return item.programs.map((tag) => tag.id);
        case 'funding':
            return item.funding.length === 0 ? [NONE] : item.funding.map((tag) => tag.id);
        case 'dataset':
            return item.datasets.map((tag) => tag.id);
        case 'status':
            return item.chips;
        case 'compute':
            return [item.compute === '' ? NONE : item.compute];
        case 'reproduced':
            return [item.reproduced ? '1' : '0'];
        case 'code':
            return [item.code === '' ? NONE : item.code];
        case 'sessions':
            return [item.sessions];
        default:
            return [];
    }
}

/** The words a facet value carries, for the values that are data rather than vocabulary. */
function facetLabel(facet: string, value: string, preset: BoardPreset): string {
    if (value === NONE) return value;
    if (facet === 'category') {
        return preset.rollup.find((bucket) => bucket.id === value)?.label ?? value;
    }
    if (facet === 'domain') return domainLabel(value);
    if (facet === 'status') return chipLabel(value);
    return value;
}

/** How many items carry each value of one facet, by value. */
function countValues(items: BoardItem[], facet: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
        for (const value of facetValues(item, facet)) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return counts;
}

/** The values of one facet, in the order its menu lists them. */
function orderValues(facet: string, counts: Map<string, number>, preset: BoardPreset): string[] {
    const has = (value: string): boolean => (counts.get(value) ?? 0) > 0;
    if (facet === 'category') return preset.rollup.map((bucket) => bucket.id).filter(has);
    if (facet === 'status') return chipKeys().filter(has);
    if (facet === 'compute') return COMPUTE_VALUES.filter(has);
    if (facet === 'code') return CODE_VALUES.filter(has);
    if (facet === 'reproduced') return REPRODUCED_VALUES.filter(has);
    if (facet === 'sessions') return SESSIONS_VALUES.filter(has);
    const values = [...counts.keys()].filter(has);
    // A year axis reads newest first; every other free facet reads by weight, and by its own value
    // where two weigh the same, so the order does not depend on the order the projects were read in.
    if (facet === 'year') {
        const years = values.filter((value) => value !== NONE).sort((a, b) => b.localeCompare(a));
        return values.includes(NONE) ? [...years, NONE] : years;
    }
    const named = values.filter((value) => value !== NONE);
    named.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b));
    return values.includes(NONE) ? [...named, NONE] : named;
}

/**
 * Every facet the board can be split on, with its counts. A facet with fewer than two values is
 * not offered: one value splits nothing, and a menu that cannot change what is shown is noise.
 */
export function facets(items: BoardItem[], preset: BoardPreset): Facet[] {
    const found: Facet[] = [];
    for (const facet of FACETS) {
        const counts = countValues(items, facet);
        const values = orderValues(facet, counts, preset).map((value) => ({
            value,
            label: facetLabel(facet, value, preset),
            count: counts.get(value) ?? 0
        }));
        if (values.length >= 2) found.push({ key: facet, values });
    }
    return found;
}
