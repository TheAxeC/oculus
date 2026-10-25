// Layer 2, client state. Board filters and saved state live here because they change which items a
// board shows and what its controls remember. The values an item carries for each facet are read
// here too, since the filter is their first reader and facets.ts counts them through the filter.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf, rootOf } from '../../../data/helpers/hub-names.ts';
import {
    fieldItemsShape,
    mapShape,
    optionalTextShape,
    readAs,
    recordItemsShape,
    stringItemsShape
} from '../../../data/shapes/shapes.ts';
import {
    FACETS,
    LIST_CELLS,
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
 * The values one item carries for one facet. A project with no stage is in no slice, so it is under
 * no value of the slice facet; the Situation facet (`status`) reads the project's own chips and the
 * Form facet its form, apart; a venue is its key, so a venue two hubs catalogue is one value.
 */
export function facetValues(item: BoardItem, facet: string): string[] {
    const ids = (tags: { id: string }[]): string[] => tags.map((tag) => keyOf(tag.id));
    switch (facet) {
        case 'slice':
            return item.slice === '' ? [] : [item.slice];
        case 'form':
            return item.project.form === undefined ? [] : [item.project.form];
        case 'role':
            return item.role === '' ? [] : [item.role];
        case 'year':
            return [item.year === '' ? NONE : item.year];
        case 'domain':
            return item.domain === null ? [] : [keyOf(item.domain.id)];
        case 'venue':
            return item.venue === null ? [] : [keyOf(item.venue.id)];
        case 'hub':
            return rootOf(item.project) === '' ? [] : [rootOf(item.project)];
        case 'pillar':
            return ids(item.pillars);
        case 'funding':
            return item.funding.length === 0 ? [NONE] : ids(item.funding);
        case 'dataset':
            return ids(item.datasets);
        case 'status':
            return item.project.chips;
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
 * The facet values that narrow the board: every value in force, and the role values only while the
 * workspace names a `self` (`named`), which is while the bar offers the Role group. A role saved
 * with no `self` named is kept in the saved state and narrows nothing, since without a `self` no
 * project has a role and no control could take the value out. The hub values narrow the board only
 * while the bar draws the Hub group, which is while the workspace has more than one hub (`hubs`,
 * the hubs the group lists, empty while it is not drawn), so a workspace that drops to one hub is
 * not narrowed by a pick made while it had two.
 */
export function appliedFilters(
    filters: Record<string, string[]>,
    named: boolean,
    hubs: readonly string[] = []
): Record<string, string[]> {
    const dropped = [...(named ? [] : ['role']), ...(hubs.length > 0 ? [] : ['hub'])];
    if (!dropped.some((facet) => Object.hasOwn(filters, facet))) return filters;
    return Object.fromEntries(
        Object.entries(filters).filter(([facet]) => !dropped.includes(facet))
    );
}

/**
 * Whether Mine only changes the board: the workspace names a `self` (`named`) and one of the
 * board's projects, read before any filter, is one Mine only does not keep. The toggle is drawn
 * while a `self` is named and applied only where this holds; elsewhere it is drawn disabled.
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
        more: [],
        labels,
        stale: false,
        dated: false,
        mine: true,
        folded: []
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
    more: recordItemsShape,
    folded: fieldItemsShape,
    columns: fieldItemsShape,
    filters: mapShape.optional().catch(undefined)
});

/**
 * Read a saved board state, falling back one field at a time when a value is invalid. Given the
 * facets the board offers, a compute value that none of them offers is dropped: it names a resource
 * the registry does not hold, such as `hpc`. Given the values of the board's slices (`slices`), a
 * slice value that names none of them is dropped, so the board shows unfiltered on that facet. The
 * folded sections are read as words, the empty key of the "other" section kept; the columns are
 * read as the cells of `LIST_CELLS`, and a list that names none of them stands for the board's own.
 */
export function parseBoardState(
    value: unknown,
    labels: LabelMode = 'short',
    offered?: Facet[],
    slices?: readonly string[]
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
    state.more = held.more;
    state.folded = held.folded;
    const columns = held.columns.filter((cell) => LIST_CELLS.includes(cell));
    if (columns.length > 0) state.columns = columns;
    for (const [facet, selected] of Object.entries(held.filters ?? {})) {
        if (!FACETS.includes(facet)) continue;
        const read = readAs(stringItemsShape, selected) ?? [];
        const known = offered?.find((one) => one.key === facet)?.values.map((one) => one.value);
        const values =
            facet === 'compute' && offered !== undefined
                ? read.filter((one) => known?.includes(one) === true)
                : facet === 'slice' && slices !== undefined
                  ? read.filter((one) => slices.includes(one))
                  : read;
        if (values.length > 0) state.filters[facet] = values;
    }
    return state;
}
