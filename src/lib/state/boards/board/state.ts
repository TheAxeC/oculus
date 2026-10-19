// Layer 2, client state. Board filters and saved state live here because they change which items a
// board shows and what its controls remember.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import {
    fieldItemsShape,
    mapShape,
    optionalTextShape,
    readAs,
    stringItemsShape
} from '../../../data/shapes/shapes.ts';
import { facetValues } from './facets.ts';
import {
    FACETS,
    type BoardItem,
    type BoardState,
    type Facet,
    type LabelMode,
    type QuickFilters
} from './presets.ts';

/** The `stale_lag_days` of `focus:` when the config names none. */
export const STALE_LAG = 1;

/** Whether a project's manifest trails its documents by at least the configured lag. */
export function isStale(item: BoardItem, lag: number = STALE_LAG): boolean {
    const days = item.project.staleDays;
    return days !== undefined && days >= lag;
}

/** Apply facet, text, stale, dated and hidden-type controls to board items. */
export function applyFilters(
    items: BoardItem[],
    filters: Record<string, string[]>,
    search: string,
    quick: QuickFilters = {}
): BoardItem[] {
    const needle = search.trim().toLowerCase();
    const hidden = quick.hiddenTypes ?? [];
    const lag = quick.staleLag ?? STALE_LAG;
    return items.filter((item) => {
        const type = item.project.type;
        if (type !== undefined && hidden.includes(type)) return false;
        if (quick.stale === true && !isStale(item, lag)) return false;
        if (quick.dated === true && (item.project.deadline ?? '') === '') return false;
        for (const facet of FACETS) {
            const selected = byKey(filters, facet);
            if (selected === undefined || selected.length === 0) continue;
            const values = facetValues(item, facet);
            if (!selected.some((value) => values.includes(value))) return false;
        }
        return needle === '' || item.haystack.includes(needle);
    });
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
        hiddenTypes: []
    };
}

/** The fields of a saved board state, each read apart, so a wrong one costs that field alone. */
const boardStateShape = z.object({
    mode: z.enum(['list', 'cards']).optional().catch(undefined),
    labels: z.enum(['full', 'short']).optional().catch(undefined),
    search: optionalTextShape,
    stale: z.boolean().catch(false),
    dated: z.boolean().catch(false),
    hiddenTypes: fieldItemsShape,
    expanded: fieldItemsShape,
    more: fieldItemsShape,
    filters: mapShape.optional().catch(undefined)
});

/**
 * Read a saved board state, falling back one field at a time when a value is invalid. Given the
 * facets the board offers, a compute value that none of them offers is dropped: it names a resource
 * the registry does not hold, such as `hpc`.
 */
export function parseBoardState(
    value: unknown,
    labels: LabelMode = 'short',
    offered?: Facet[]
): BoardState {
    const state = emptyBoardState(labels);
    const held = readAs(boardStateShape, value);
    if (held === null) return state;
    if (held.mode !== undefined) state.mode = held.mode;
    if (held.labels !== undefined) state.labels = held.labels;
    if (held.search !== undefined) state.search = held.search;
    state.stale = held.stale;
    state.dated = held.dated;
    state.hiddenTypes = held.hiddenTypes;
    state.expanded = held.expanded;
    state.more = held.more;
    for (const [facet, selected] of Object.entries(held.filters ?? {})) {
        if (!FACETS.includes(facet)) continue;
        const read = readAs(stringItemsShape, selected) ?? [];
        const known = offered?.find((one) => one.key === facet)?.values.map((one) => one.value);
        const values =
            facet === 'compute' && offered !== undefined
                ? read.filter((one) => known?.includes(one) === true)
                : read;
        if (values.length > 0) state.filters[facet] = values;
    }
    return state;
}
