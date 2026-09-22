// Layer 2, client state. Board filters and saved state live here because they change which items a
// board shows and what its controls remember.

import { isMap, byKey, strings } from '../../../data/helpers/guards.ts';
import { facetValues } from './facets.ts';
import {
    FACETS,
    type BoardItem,
    type BoardState,
    type LabelMode,
    type QuickFilters
} from './presets.ts';

/** The `stale_lag_days` the config names when it names none. */
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

/** Read a saved board state, falling back one field at a time when a value is invalid. */
export function parseBoardState(value: unknown, labels: LabelMode = 'short'): BoardState {
    const state = emptyBoardState(labels);
    if (!isMap(value)) return state;
    if (value.mode === 'list' || value.mode === 'cards') state.mode = value.mode;
    if (value.labels === 'full' || value.labels === 'short') state.labels = value.labels;
    if (typeof value.search === 'string') state.search = value.search;
    state.stale = value.stale === true;
    state.dated = value.dated === true;
    state.hiddenTypes = strings(value.hiddenTypes);
    state.expanded = strings(value.expanded);
    state.more = strings(value.more);
    if (isMap(value.filters)) {
        for (const [facet, selected] of Object.entries(value.filters)) {
            if (!FACETS.includes(facet)) continue;
            const values = strings(selected);
            if (values.length > 0) state.filters[facet] = values;
        }
    }
    return state;
}
