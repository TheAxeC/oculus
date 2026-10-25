// Layer 2, client state. Board filters and saved state live here because they change which items a
// board shows and what its controls remember. The values an item carries for each facet are read
// here too, since the filter is their first reader and facets.ts counts them through the filter.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf } from '../../../data/helpers/hub-names.ts';
import {
    mapShape,
    optionalTextShape,
    readAs,
    recordItemsShape,
    stringItemsShape
} from '../../../data/shapes/shapes.ts';
import {
    FACETS,
    NONE,
    type BoardItem,
    type BoardState,
    type Facet,
    type LabelMode,
    type QuickFilters
} from './presets.ts';

/** The `stale_lag_days` of `focus:` when the config names none. */
export const STALE_LAG = 1;

/**
 * The values one item carries for one facet. A project with no stage carries no stage value, so it
 * is under no value of the stage facet.
 */
export function facetValues(item: BoardItem, facet: string): string[] {
    const ids = (tags: { id: string }[]): string[] => tags.map((tag) => keyOf(tag.id));
    switch (facet) {
        case 'stage': {
            const stage = item.project.stage ?? '';
            return stage === '' ? [] : [stage];
        }
        case 'category':
            return item.category === '' ? [] : [item.category];
        case 'role':
            return item.role === '' ? [] : [item.role];
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

/** Whether a project's manifest trails its documents by at least the configured lag. */
export function isStale(item: BoardItem, lag: number = STALE_LAG): boolean {
    const days = item.project.staleDays;
    return days !== undefined && days >= lag;
}

/** Apply facet, text, stale, dated and Mine only controls to board items. */
export function applyFilters(
    items: BoardItem[],
    filters: Record<string, string[]>,
    search: string,
    quick: QuickFilters = {}
): BoardItem[] {
    const needle = search.trim().toLowerCase();
    const lag = quick.staleLag ?? STALE_LAG;
    return items.filter((item) => {
        if (quick.stale === true && !isStale(item, lag)) return false;
        if (quick.dated === true && (item.project.deadline ?? '') === '') return false;
        if (quick.mine === true && !item.mine) return false;
        for (const facet of FACETS) {
            const selected = byKey(filters, facet);
            if (selected === undefined || selected.length === 0) continue;
            const values = facetValues(item, facet);
            if (!selected.some((value) => values.includes(value))) return false;
        }
        return needle === '' || item.haystack.includes(needle);
    });
}

/**
 * Whether the board draws Mine only: the workspace names a `self` (`named`) and one of the board's
 * projects, read before any filter, is one Mine only does not keep. On any other board it would
 * change nothing, so the board neither draws it nor applies it.
 */
export function offersMine(items: BoardItem[], named: boolean): boolean {
    return named && items.some((item) => !item.mine);
}

/** The state a board starts in before it has remembered any controls. */
export function emptyBoardState(labels: LabelMode = 'short'): BoardState {
    return {
        mode: 'cards',
        search: '',
        filters: {},
        expanded: [],
        more: [],
        labels,
        stale: false,
        dated: false,
        mine: true
    };
}

/** The fields of a saved board state, each read apart, so a wrong one costs that field alone. */
const boardStateShape = z.object({
    mode: z.enum(['list', 'cards']).optional().catch(undefined),
    labels: z.enum(['full', 'short']).optional().catch(undefined),
    search: optionalTextShape,
    stale: z.boolean().catch(false),
    dated: z.boolean().catch(false),
    mine: z.boolean().catch(true),
    expanded: recordItemsShape,
    more: recordItemsShape,
    filters: mapShape.optional().catch(undefined)
});

/**
 * Read a saved board state, falling back one field at a time when a value is invalid. Given the
 * facets the board offers, a compute value that none of them offers is dropped: it names a resource
 * the registry does not hold, such as `hpc`. Given the keys of `categories` (`categories`), a
 * category value that names no row is dropped, so the board shows unfiltered on that facet.
 */
export function parseBoardState(
    value: unknown,
    labels: LabelMode = 'short',
    offered?: Facet[],
    categories?: readonly string[]
): BoardState {
    const state = emptyBoardState(labels);
    const held = readAs(boardStateShape, value);
    if (held === null) return state;
    if (held.mode !== undefined) state.mode = held.mode;
    if (held.labels !== undefined) state.labels = held.labels;
    if (held.search !== undefined) state.search = held.search;
    state.stale = held.stale;
    state.dated = held.dated;
    state.mine = held.mine;
    state.expanded = held.expanded;
    state.more = held.more;
    for (const [facet, selected] of Object.entries(held.filters ?? {})) {
        if (!FACETS.includes(facet)) continue;
        const read = readAs(stringItemsShape, selected) ?? [];
        const known = offered?.find((one) => one.key === facet)?.values.map((one) => one.value);
        const values =
            facet === 'compute' && offered !== undefined
                ? read.filter((one) => known?.includes(one) === true)
                : facet === 'category' && categories !== undefined
                  ? read.filter((one) => categories.includes(one))
                  : read;
        if (values.length > 0) state.filters[facet] = values;
    }
    return state;
}
