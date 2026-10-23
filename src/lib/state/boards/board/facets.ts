// Layer 2, client state. Board facet values, labels, ordering and counts live here because facet
// vocabulary changes independently of item construction and board state.
//
// A value that names a record of a hub (a domain, a pillar, a funding scheme, a dataset, a
// resource) is that record's key, its internal id with the hub's name off: on a workspace of two
// hubs one key of both is one row of the filter menu, its count the sum of both hubs' projects,
// and one filter picks the projects of both. The words are the ones a project card draws for the
// record, which items.ts gives by the key.

import { keyOf } from '../../../data/helpers/hub-names.ts';
import { chipKeys, chipLabel, domainLabel } from '../../shared/words/tones.ts';
import {
    CODE_VALUES,
    FACETS,
    NONE,
    REPRODUCED_VALUES,
    SESSIONS_VALUES,
    type BoardItem,
    type BoardPreset,
    type Facet
} from './presets.ts';

export function facetValues(item: BoardItem, facet: string): string[] {
    const ids = (tags: { id: string }[]): string[] => tags.map((tag) => keyOf(tag.id));
    switch (facet) {
        case 'category':
            return item.bucket === '' ? [] : [item.bucket];
        case 'year':
            return [item.year === '' ? NONE : item.year];
        case 'domain':
            return item.domain === null ? [] : [keyOf(item.domain.id)];
        case 'pillar':
            return ids(item.pillars);
        case 'funding':
            return item.funding.length === 0 ? [NONE] : ids(item.funding);
        case 'dataset':
            return ids(item.datasets);
        case 'status':
            return item.chips;
        case 'compute':
            return item.compute.length === 0 ? [NONE] : ids(item.compute);
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

/** The name and registry position of each resource, from the first item that carries it. */
type Recorded = Map<string, { label: string; order: number }>;

function recordResources(items: BoardItem[]): Recorded {
    const recorded: Recorded = new Map();
    for (const item of items) {
        for (const one of item.compute) {
            const id = keyOf(one.id);
            if (!recorded.has(id)) recorded.set(id, { label: one.label, order: one.order });
        }
    }
    return recorded;
}

/** The words a facet value carries, for the values that are data rather than vocabulary. */
function facetLabel(facet: string, value: string, preset: BoardPreset, recorded: Recorded): string {
    if (value === NONE) return value;
    if (facet === 'compute') return recorded.get(value)?.label ?? value;
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
function orderValues(
    facet: string,
    counts: Map<string, number>,
    preset: BoardPreset,
    recorded: Recorded
): string[] {
    const has = (value: string): boolean => (counts.get(value) ?? 0) > 0;
    if (facet === 'category') return preset.rollup.map((bucket) => bucket.id).filter(has);
    if (facet === 'status') return chipKeys().filter(has);
    if (facet === 'compute') {
        // The resources by name, then by registry position, and the value for none last.
        const named = [...recorded.keys()].filter(has);
        const at = (id: string): { label: string; order: number } =>
            recorded.get(id) ?? { label: id, order: 0 };
        named.sort((a, b) => at(a).label.localeCompare(at(b).label) || at(a).order - at(b).order);
        return has(NONE) ? [...named, NONE] : named;
    }
    if (facet === 'code') return CODE_VALUES.filter(has);
    if (facet === 'reproduced') return REPRODUCED_VALUES.filter(has);
    if (facet === 'sessions') return SESSIONS_VALUES.filter(has);
    const values = [...counts.keys()].filter(has);
    // A year axis reads newest first; every other free facet reads by weight, and by its own value
    // where two weigh the same, so the order does not depend on the order the projects were read
    // in.
    if (facet === 'year') {
        const years = values.filter((value) => value !== NONE).sort((a, b) => b.localeCompare(a));
        return values.includes(NONE) ? [...years, NONE] : years;
    }
    const named = values.filter((value) => value !== NONE);
    named.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b));
    return values.includes(NONE) ? [...named, NONE] : named;
}

/**
 * Every facet the board can be split on, with its counts. A facet with one value is offered as
 * that one value: a filter that selects everything is still the board saying what its one value
 * is, and the reader can read it.
 */
export function facets(items: BoardItem[], preset: BoardPreset): Facet[] {
    const found: Facet[] = [];
    const recorded = recordResources(items);
    for (const facet of FACETS) {
        const counts = countValues(items, facet);
        const values = orderValues(facet, counts, preset, recorded).map((value) => ({
            value,
            label: facetLabel(facet, value, preset, recorded),
            count: counts.get(value) ?? 0
        }));
        if (values.length > 0) found.push({ key: facet, values });
    }
    return found;
}
