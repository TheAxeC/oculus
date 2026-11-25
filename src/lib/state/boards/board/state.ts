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
import { waitingValue } from '../waiting.ts';
import { toggled } from '../../shared/lists/lists.ts';

/**
 * The values one item carries for one facet. Eleven facets give a project with nothing there the
 * value for none (`NONE`), so a pick of it finds such a project: Form (a project with no form),
 * Situation (`status`, no chip), Year (no year), Domain (no domain), Venue (no venue), Waiting on
 * (`waiting`, nothing waited on), Pillar (no pillar), Funding (no funding scheme), Datasets
 * (`dataset`, no dataset), Compute (no resource) and Code (no code deposit); a domain, a venue, a
 * pillar, a funding scheme, a dataset or a resource no registry holds is dropped before the board
 * reads it, so a project naming only such a key carries the value for none too. The other facets
 * leave a project with nothing there under no value: the slice facet a project with no stage, the
 * Role facet a project on which the user has no role, the Hub facet a project that carries no hub
 * name (`root`) and the Tier facet a project with no `tier`; the Reproduced and Sessions facets
 * give every project one value. The Situation facet reads the project's own chips and the Form
 * facet its form, apart; a venue is its key, so a venue two hubs catalogue is one value; and the
 * Waiting on facet holds each value of the item's `waiting` once, by state/boards/waiting.ts
 * `waitingValue`, a person or a project by its key and a value that names neither as it is written.
 */
export function facetValues(item: BoardItem, facet: string): string[] {
    const ids = (tags: { id: string }[]): string[] => tags.map((tag) => keyOf(tag.id));
    const orNone = (values: string[]): string[] => (values.length === 0 ? [NONE] : values);
    switch (facet) {
        case 'slice':
            return item.slice === '' ? [] : [item.slice];
        case 'form':
            return [item.project.form ?? NONE];
        case 'role':
            return item.role === '' ? [] : [item.role];
        case 'year':
            return [item.year === '' ? NONE : item.year];
        case 'domain':
            return [item.domain === null ? NONE : keyOf(item.domain.id)];
        case 'venue':
            return [item.venue === null ? NONE : keyOf(item.venue.id)];
        case 'waiting':
            return orNone([...new Set(item.waiting.map(waitingValue))]);
        case 'hub':
            return rootOf(item.project) === '' ? [] : [rootOf(item.project)];
        case 'tier':
            return (item.project.tier ?? '') === '' ? [] : [item.project.tier ?? ''];
        case 'pillar':
            return orNone(ids(item.pillars));
        case 'funding':
            return orNone(ids(item.funding));
        case 'dataset':
            return orNone(ids(item.datasets));
        case 'status':
            return orNone(item.project.chips);
        case 'compute':
            return orNone(ids(item.compute));
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

/**
 * Whether a project's manifest trails its documents by at least the configured lag, `focus`'s
 * `stale_lag_days`; with no lag, before the page holds the settings, no manifest is behind.
 */
export function isStale(item: BoardItem, lag: number | null): boolean {
    const days = item.project.staleDays;
    return lag !== null && days !== undefined && days >= lag;
}

/**
 * Whether one facet keeps a record that carries `values` for it: none of them is excluded and,
 * while any value is included, one of them is included, so an exclude wins over an include of the
 * same value. A record with no value for the facet is never hidden by its exclude. It is the rule
 * of every filter group: a board's facets (`applyFilters`), a collection's groups
 * (state/boards/collection/bar.ts `meets`) and the Map's Stage group
 * (state/boards/structure/map-bar.ts `stageKeeps`).
 */
export function facetKeeps(
    values: readonly string[],
    included: readonly string[],
    excluded: readonly string[]
): boolean {
    if (values.some((value) => excluded.includes(value))) return false;
    return included.length === 0 || values.some((value) => included.includes(value));
}

/**
 * Apply facet, text, stale, dated, waiting and Mine only controls to board items. Each facet with
 * an included value (`filters`) or an excluded one (`excluded`) keeps an item by `facetKeeps`, and
 * the facets combine, an item kept only when every facet keeps it. The waiting control keeps the
 * items whose `waiting` is not empty.
 */
export function applyFilters(
    items: BoardItem[],
    filters: Record<string, string[]>,
    search: string,
    quick: QuickFilters = {},
    excluded: Record<string, string[]> = {}
): BoardItem[] {
    const needle = search.trim().toLowerCase();
    const lag = quick.staleLag ?? null;
    return items.filter((item) => {
        if (quick.stale === true && !isStale(item, lag)) return false;
        if (quick.dated === true && (item.project.deadline ?? '') === '') return false;
        if (quick.waiting === true && item.waiting.length === 0) return false;
        if (quick.mine === true && !item.mine) return false;
        for (const facet of FACETS) {
            const included = byKey(filters, facet) ?? [];
            const out = byKey(excluded, facet) ?? [];
            if (included.length === 0 && out.length === 0) continue;
            if (!facetKeeps(facetValues(item, facet), included, out)) return false;
        }
        return needle === '' || item.haystack.includes(needle);
    });
}

/**
 * The facet values that narrow the board, of the included values or of the excluded ones: every
 * value in force, and the role values only while the user is marked (`named`), which is while the
 * bar offers the Role group. A role saved with no user marked is kept in the saved state and
 * narrows nothing, since without a `self` no project has a role and no control could take the
 * value out. The hub values narrow the board only while the bar draws the Hub group, which is while
 * the workspace has more than one hub (`hubs`, the hubs the group lists, empty while it is not
 * drawn), so a workspace that drops to one hub is not narrowed by a pick made while it had two.
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
 * Whether Mine only changes the board: a person is marked as the user (`named`) and one of the
 * board's projects, read before any filter, is one Mine only does not keep. The toggle is drawn
 * while the user is marked and applied only where this holds; elsewhere it is drawn disabled.
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
        excluded: {},
        more: [],
        labels,
        stale: false,
        dated: false,
        waiting: false,
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
    waiting: z.boolean().catch(false),
    mine: z.boolean().catch(true),
    more: recordItemsShape,
    folded: fieldItemsShape,
    columns: fieldItemsShape,
    filters: mapShape.optional().catch(undefined),
    excluded: mapShape.optional().catch(undefined)
});

/**
 * One saved map of values by facet as the board reads it: a key that is no facet of `FACETS` is
 * dropped, and so is a compute value no facet of `offered` offers and a slice value `slices` does
 * not hold, where they are given; a facet left with no value is left out.
 */
function readPicks(
    saved: Record<string, unknown>,
    offered?: Facet[],
    slices?: readonly string[]
): Record<string, string[]> {
    const picks: Record<string, string[]> = {};
    for (const [facet, selected] of Object.entries(saved)) {
        if (!FACETS.includes(facet)) continue;
        const read = readAs(stringItemsShape, selected) ?? [];
        const known = offered?.find((one) => one.key === facet)?.values.map((one) => one.value);
        const values =
            facet === 'compute' && offered !== undefined
                ? read.filter((one) => known?.includes(one) === true)
                : facet === 'slice' && slices !== undefined
                  ? read.filter((one) => slices.includes(one))
                  : read;
        if (values.length > 0) picks[facet] = values;
    }
    return picks;
}

/**
 * The included values of a saved state without the values its excluded list of the same facet
 * holds, a facet left with none taken out, so a value saved in both lists is read as excluded. The
 * board's, the collection's and the Map's saved states are read through it.
 */
export function withoutExcluded(
    filters: Record<string, string[]>,
    excluded: Record<string, readonly string[]>
): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(filters)
            .map(([facet, values]): [string, string[]] => {
                const out = byKey(excluded, facet) ?? [];
                return [facet, values.filter((value) => !out.includes(value))];
            })
            .filter(([, values]) => values.length > 0)
    );
}

/**
 * Read a saved board state, falling back one field at a time when a value is invalid. The included
 * values (`filters`) and the excluded values (`excluded`) are read by the same rules, and a value
 * saved in both lists of a facet is read as excluded. Given the facets the board offers, a compute
 * value that none of them offers is dropped: it names a resource the registry does not hold, such
 * as `hpc`. Given the values of the board's slices (`slices`), a slice value that names none of
 * them is dropped, so the board shows unfiltered on that facet. The folded sections are read as
 * words, the empty key of the "other" section kept; the columns are read as the cells of
 * `LIST_CELLS`, and a list that names none of them stands for the board's own.
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
    state.waiting = held.waiting;
    state.mine = held.mine;
    state.more = held.more;
    state.folded = held.folded;
    const columns = held.columns.filter((cell) => LIST_CELLS.includes(cell));
    if (columns.length > 0) state.columns = columns;
    state.excluded = readPicks(held.excluded ?? {}, offered, slices);
    state.filters = withoutExcluded(readPicks(held.filters ?? {}, offered, slices), state.excluded);
    return state;
}

/**
 * The values a bar includes (`filters`) and the values it excludes (`excluded`), each by facet. A
 * press writes both, and a value is in at most one of the two lists of its facet.
 */
export type FilterPicks = {
    filters: Record<string, string[]>;
    excluded: Record<string, string[]>;
};

/** One facet's included values and its excluded values. */
export type FacetLists = { included: readonly string[]; excluded: readonly string[] };

/** One facet's two lists out of a bar's picks, each empty where the facet has none. */
export function facetListsOf(picks: FilterPicks, facet: string): FacetLists {
    return {
        included: byKey(picks.filters, facet) ?? [],
        excluded: byKey(picks.excluded, facet) ?? []
    };
}

/** A map of values by facet with one facet's list set to `values`, taken out when it is empty. */
function withList(
    map: Record<string, string[]>,
    facet: string,
    values: string[]
): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries({ ...map, [facet]: values }).filter(
            ([key]) => key !== facet || values.length > 0
        )
    );
}

/** The values of a list that are not among `values`. */
function outside(list: readonly string[], values: readonly string[]): string[] {
    return list.filter((one) => !values.includes(one));
}

/**
 * The row press on one value of one facet, a click or Enter on its row: an off value is included,
 * an included value is turned off and an excluded value is included. The bars of a project board,
 * the Present view, a collection and the Map write their picks through it.
 */
export function withPick(picks: FilterPicks, facet: string, value: string): FilterPicks {
    const { included, excluded } = facetListsOf(picks, facet);
    return {
        filters: withList(picks.filters, facet, toggled(included, value)),
        excluded: withList(picks.excluded, facet, outside(excluded, [value]))
    };
}

/**
 * The "not" press on one value of one facet, the minus button at its row's end, Shift+Enter on its
 * row or an Alt-click on its slice: an off value is excluded, an excluded value is turned off and
 * an included value is excluded.
 */
export function withExclude(picks: FilterPicks, facet: string, value: string): FilterPicks {
    const { included, excluded } = facetListsOf(picks, facet);
    return {
        filters: withList(picks.filters, facet, outside(included, [value])),
        excluded: withList(picks.excluded, facet, toggled(excluded, value))
    };
}

/**
 * A press on the head of a category of slices, whose slices are `values` of the facet `facet`. A
 * plain click includes every slice of it, or takes them all out of the include list when all are
 * included, and takes them, and only them, out of the exclude list; an Alt-click (`exclude`)
 * excludes every slice of it and takes them out of the include list.
 */
export function withCategory(
    picks: FilterPicks,
    facet: string,
    values: readonly string[],
    exclude: boolean
): FilterPicks {
    const { included, excluded } = facetListsOf(picks, facet);
    const joined = (list: readonly string[]): string[] => [...list, ...outside(values, list)];
    if (exclude) {
        return {
            filters: withList(picks.filters, facet, outside(included, values)),
            excluded: withList(picks.excluded, facet, joined(excluded))
        };
    }
    const all = values.every((value) => included.includes(value));
    return {
        filters: withList(picks.filters, facet, all ? outside(included, values) : joined(included)),
        excluded: withList(picks.excluded, facet, outside(excluded, values))
    };
}

/** Clear all: no value included and none excluded, the search and the toggles left as they are. */
export function noPicks(): FilterPicks {
    return { filters: {}, excluded: {} };
}

/**
 * A bar's filters as read back from a saved state, the record and each list built for this call,
 * so a shape's fallback value read back is never one object two callers hold. The collection's and
 * the Map's saved states are read back through it.
 */
export function freshPicks(filters: Record<string, readonly string[]>): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(filters).map(([facet, values]) => [facet, [...values]])
    );
}
