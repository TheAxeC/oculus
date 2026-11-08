// Layer 2, client state. A project board's bar as data: a group per facet, headed by the facet's
// name and drawn in the facet's hue, a choice per value with its words, its count, its hue and
// whether it is picked; the words of the button that opens a group, which carry its picks; the
// slices folded off the bar's second line as groups headed by their category; and the words of the
// counts the controls carry (the deadline toggle, the waiting toggle, the Situation badge, the
// Venue mark, the end of the second line); and the cells of the list's Columns menu, with which of
// them are drawn. A collection view's bar (state/boards/collection/bar.ts) and the Map's
// (state/boards/structure/map-bar.ts) are made in the same shapes: the collection's reads the
// facets' hues from here (`facetToneIn`), the Map's its facet groups (`filterGroups`).
//
// The whole filter of a project board's bar is one function here (`boardFilter`): the saved state
// read against the board's facets and slices, the quick filters, the counted facets, the groups and
// the projects shown. The Projects board and the Present view, over the projects of a deck's groups
// of project decks, both read their bar through it, so the two cannot count or keep a project
// differently. It lives in this file because it calls `filterGroups`, which is defined here, and
// this file imports facets.ts and state.ts, so a home in either would import this file back and
// make an import cycle.
//
// It is apart from the views so the grouping, the counts and the words can be read without a DOM:
// a group's list is drawn only once it is opened, which a server rendering never does.

import { byKey } from '../../../data/helpers/guards.ts';
import type { ListedColumn } from '../../../data/shapes/boards/columns.ts';
import { mapOfShape, readAs, wordShape } from '../../../data/shapes/shapes.ts';
import { plural, t } from '../../shared/words/text.ts';
import { codeLabel, namedTone } from '../../shared/words/tones.ts';
import { facetLabel, facets, sliceGroups, type SliceGroup } from './facets.ts';
import {
    FACETS,
    LIST_CELLS,
    NONE,
    SESSIONS_LIVE,
    SESSIONS_RECENT,
    type BoardColumn,
    type BoardItem,
    type BoardPreset,
    type BoardState,
    type BoardStats,
    type Facet,
    type FacetValue,
    type QuickFilters
} from './presets.ts';
import { appliedFilters, applyFilters, offersMine, parseBoardState } from './state.ts';

/** One value of one facet as a choice of a group's list. */
export type FilterChoice = {
    id: string;
    /** The value's words, without its count. */
    label: string;
    /** The whole words where `label` is cut (a slice's), else nothing. */
    title?: string;
    count: number;
    /** Whether the value is picked. */
    active: boolean;
    /** The hue of its dot, and of its fill while picked: the value's own, else its facet's. */
    tone: string;
    /** The count against the largest count of the list, from 0 to 1, for the Venue list's bars. */
    share?: number;
};

/** One facet's run of choices under its heading, or one category's run of slices. */
export type FilterGroup = { id: string; heading: string; tone: string; items: FilterChoice[] };

/** The facets whose group buttons line 1 of the bar draws, in its order; More holds the rest. */
export const LINE_FACETS = ['form', 'status', 'role', 'year', 'domain', 'venue', 'waiting', 'hub'];

/**
 * A facet's heading. The keys are literal so tests/checks/source/keys.test.ts can see every one of
 * them.
 */
export function facetHeading(facet: string): string {
    if (facet === 'form') return t('board.facet_form');
    if (facet === 'status') return t('board.facet_status');
    if (facet === 'role') return t('roles.facet');
    if (facet === 'year') return t('board.facet_year');
    if (facet === 'domain') return t('board.facet_domain');
    if (facet === 'venue') return t('board.facet_venue');
    if (facet === 'waiting') return t('board.facet_waiting');
    if (facet === 'hub') return t('board.facet_hub');
    if (facet === 'tier') return t('board.facet_tier');
    if (facet === 'pillar') return t('board.facet_pillar');
    if (facet === 'funding') return t('board.facet_funding');
    if (facet === 'dataset') return t('board.facet_dataset');
    if (facet === 'compute') return t('board.facet_compute');
    if (facet === 'reproduced') return t('board.facet_reproduced');
    if (facet === 'sessions') return t('board.facet_sessions');
    return t('board.facet_code');
}

/** The `facet_tones` of config/catalogs/vocab.yml: a hue name for each filter group. */
const facetTonesShape = mapOfShape(wordShape);

/**
 * A facet's own hue, which a value with none of its own is drawn in: its row of `facet_tones` in
 * the words of the board's hub, the hub its rule names or, for a board over several hubs, the
 * union of every hub's words, as a palette hue (`namedTone`). A facet the map does not name, and a
 * name that is no palette hue, are the unknown tone.
 */
function facetTone(facet: string, preset: BoardPreset): string {
    const hub = preset.rule.hub ?? undefined;
    return facetToneIn(facet, preset.words(hub).config, hub);
}

/**
 * A filter group's hue in the words `words` (a hub's, or the merged config for every hub's): its
 * row of `facet_tones` as a palette hue of the hub `hub`, the unknown tone for a group the map does
 * not name. A collection's Role and Hub groups and the Map's groups read it as a board's do.
 */
export function facetToneIn(facet: string, words: Record<string, unknown>, hub?: string): string {
    const tones = readAs(facetTonesShape, words.facet_tones) ?? {};
    return namedTone(byKey(tones, facet) ?? '', hub);
}

function sessionsLabel(value: string): string {
    if (value === SESSIONS_LIVE) return t('board.sessions_live');
    if (value === SESSIONS_RECENT) return t('board.sessions_recent');
    return t('board.sessions_none');
}

/** The words of a facet value that is vocabulary rather than data. */
export function valueLabel(facet: string, value: FacetValue): string {
    if (facet === 'year' && value.value === NONE) return t('board.no_year');
    if (facet === 'funding' && value.value === NONE) return t('board.no_funding');
    if (facet === 'compute' && value.value === NONE) return t('board.compute_none');
    if (facet === 'code') return codeLabel(value.value);
    if (facet === 'reproduced') {
        return value.value === '1' ? t('board.repro_yes') : t('board.repro_no');
    }
    if (facet === 'sessions') return sessionsLabel(value.value);
    return value.label;
}

/** The choices of a list of values, each with its share of the list's largest count. */
function choicesOf(
    facet: string,
    values: FacetValue[],
    picked: string[],
    tone: string
): FilterChoice[] {
    const most = Math.max(1, ...values.map((one) => one.count));
    return values.map((value) => {
        const choice: FilterChoice = {
            id: value.value,
            label: valueLabel(facet, value),
            count: value.count,
            active: picked.includes(value.value),
            tone: value.tone ?? tone
        };
        if (facet === 'venue') choice.share = value.count / most;
        return choice;
    });
}

/**
 * Every facet of the bar's groups as a group of choices: the facets of `counted` in the order of
 * `FACETS`, the slices left to line 2, the role facet left out while no person is marked as the
 * user (`named`) and the hub facet while the workspace has one hub (`hubs`, the hubs the group
 * lists, empty then). A picked value the board's projects do not hold is listed at 0 after the
 * values they hold, by the words its facet gives it, which is the value itself where the config
 * names none, so every value that narrows the board can be taken out in its group's list; a facet
 * with such a value and no other draws its group with that value alone. A facet with no values
 * draws no group.
 */
export function filterGroups(
    counted: Facet[],
    filters: Record<string, string[]>,
    preset: BoardPreset,
    named: boolean,
    hubs: readonly string[] = []
): FilterGroup[] {
    const shown = (facet: string): boolean =>
        facet !== 'slice' && (named || facet !== 'role') && (hubs.length > 0 || facet !== 'hub');
    return FACETS.filter(shown).flatMap((facet) => {
        const offered = counted.find((one) => one.key === facet)?.values ?? [];
        const picked = byKey(filters, facet) ?? [];
        const gone = picked
            .filter((value) => !offered.some((one) => one.value === value))
            .map((value) => ({ value, label: facetLabel(facet, value, preset), count: 0 }));
        const values = [...offered, ...gone];
        if (values.length === 0) return [];
        const tone = facetTone(facet, preset);
        return [
            {
                id: facet,
                heading: facetHeading(facet),
                tone,
                items: choicesOf(facet, values, picked, tone)
            }
        ];
    });
}

/** What a project board's bar draws and the board shows, as `boardFilter` works it out. */
export type BoardFilter = {
    /** The saved state as the board reads it, a value the board would drop left out. */
    held: BoardState;
    /** Whether a person is marked as the user, which draws Mine only and the Role group. */
    named: boolean;
    /** Whether Mine only changes what is shown, which is where it is applied. */
    mine: boolean;
    /** The slices by category, read from the projects before any filter. */
    slices: SliceGroup[];
    /** The facets with each value counted over the projects the other filters leave. */
    counted: Facet[];
    /** The groups of line 1, a picked value no project holds listed at 0. */
    groups: FilterGroup[];
    /** The projects the search, the toggles, Mine only and every pick leave, in their order. */
    shown: BoardItem[];
};

/**
 * The filter of a project board's bar over the projects `items` of the preset `preset`, with
 * `named` whether a person is marked as the user, `hubs` the hubs the Hub group lists (none with
 * one hub), `saved` the raw state the bar's controls were saved in and `staleLag` the lag of the
 * stale toggle. The saved state is read against the facets and the slices of `items` before any
 * filter (`parseBoardState`), so a compute value no project offers and a slice no project holds are
 * dropped; Mine only is applied only where one of `items` is one it does not keep (`offersMine`);
 * the role and hub picks narrow only while their groups are drawn (`appliedFilters`); each facet is
 * counted over the projects the search, the toggles and the other facets leave (`facets`); and the
 * projects shown are those every control leaves (`applyFilters`).
 */
export function boardFilter(
    items: BoardItem[],
    preset: BoardPreset,
    named: boolean,
    hubs: readonly string[],
    saved: unknown,
    staleLag: number
): BoardFilter {
    const mine = offersMine(items, named);
    const offered = facets(items, preset, named);
    const slices = sliceGroups(items, preset);
    const held = parseBoardState(
        saved,
        preset.labels,
        offered,
        slices.flatMap((group) => group.slices.map((one) => one.value))
    );
    const quick: QuickFilters = {
        stale: held.stale,
        dated: held.dated,
        waiting: held.waiting,
        mine: mine && held.mine,
        staleLag
    };
    const filters = appliedFilters(held.filters, named, hubs);
    const counted = facets(items, preset, named, { filters, search: held.search, quick }, hubs);
    return {
        held,
        named,
        mine,
        slices,
        counted,
        groups: filterGroups(counted, held.filters, preset, named, hubs),
        shown: applyFilters(items, filters, held.search, quick)
    };
}

/** The search box's placeholder: the preset's search words, or the board's own with none. */
export function searchWords(preset: BoardPreset): string {
    return preset.search === '' ? t('board.search_default') : preset.search;
}

/** How many of a group's values are picked. */
function picksOf(group: FilterGroup): number {
    return group.items.filter((one) => one.active).length;
}

/**
 * The words of the button that opens a group: its heading, and while a value is picked the heading
 * with the first picked value's words and how many more are picked ("Form: journal article +1").
 */
export function groupWords(group: FilterGroup): string {
    const picked = group.items.filter((one) => one.active);
    const first = picked.at(0);
    if (first === undefined) return group.heading;
    const words = t('board.group_picked', group.heading, first.label);
    return picked.length === 1 ? words : t('board.group_picked_more', words, picked.length - 1);
}

/** The words of the More button: "More", and the count of the picks of the groups it holds. */
export function moreWords(groups: FilterGroup[]): string {
    const picks = groups.reduce((sum, group) => sum + picksOf(group), 0);
    return picks === 0 ? t('board.more') : t('board.more_count', picks);
}

/**
 * The slices folded off line 2 (`folded`, their values) as groups headed by their category, each
 * slice with its count from the facet `facet` of `counted`, the key the slices are stored under
 * (`slice` on a board and the Map, `status` on a collection), and drawn in its own hue.
 */
export function sliceChoices(
    groups: SliceGroup[],
    facet: string,
    counted: Facet[],
    filters: Record<string, string[]>,
    folded: ReadonlySet<string>
): FilterGroup[] {
    const counts = counted.find((one) => one.key === facet)?.values ?? [];
    const picked = byKey(filters, facet) ?? [];
    return groups.flatMap((group) => {
        const items = group.slices
            .filter((slice) => folded.has(slice.value))
            .map((slice) => ({
                id: slice.value,
                label: slice.label,
                title: slice.tip,
                count: counts.find((one) => one.value === slice.value)?.count ?? 0,
                active: picked.includes(slice.value),
                tone: slice.tone
            }));
        return items.length === 0
            ? []
            : [{ id: group.key, heading: group.label, tone: group.tone, items }];
    });
}

/** The words of the deadline toggle: "deadline" and how many of the board's projects are dated. */
export function deadlineWords(stats: BoardStats): string {
    return t('board.quick_deadline', stats.dated);
}

/**
 * The words of the waiting toggle: "waiting" and how many of the board's projects wait on someone
 * or something.
 */
export function waitingWords(stats: BoardStats): string {
    return t('board.quick_waiting', stats.waiting);
}

/** The Situation button's red badge, "2 blocked", and the empty string while none is blocked. */
export function blockedBadge(stats: BoardStats): string {
    return stats.blocked === 0 ? '' : t('board.blocked_badge', stats.blocked);
}

/**
 * The tip of the Venue button's amber mark, one clause per venue that reaches the warning ("BSPC: 5
 * live projects, the warning is 4"), joined by "; ", and the empty string while none does.
 */
export function venueWarning(stats: BoardStats): string {
    return stats.venues
        .map((venue) =>
            plural('board.venue_warn', venue.count, venue.short, venue.count, stats.warnAt)
        )
        .join(t('board.venue_warn_join'));
}

/**
 * The words line 2 ends with: how many projects the board holds ("16 projects", "1 project"), or,
 * while a filter, a toggle or the search hides cards, how many of them are shown ("5 of 16 shown").
 */
export function shownWords(shown: number, total: number): string {
    if (shown < total) return t('board.count_shown', shown, total);
    return plural('board.count', total, total);
}

/**
 * A cell's own heading, for a cell the board's `columns` do not name. The keys are literal for the
 * same reason as the headings'.
 */
function cellHeading(cell: string): string {
    if (cell === 'stage') return t('board.cell_stage');
    if (cell === 'venue') return t('board.cell_venue');
    if (cell === 'lane') return t('board.cell_lane');
    if (cell === 'next') return t('board.cell_next');
    if (cell === 'with') return t('board.cell_with');
    if (cell === 'domain') return t('board.cell_domain');
    if (cell === 'pillar') return t('board.cell_pillar');
    if (cell === 'funding') return t('board.cell_funding');
    return t('board.cell_title');
}

/**
 * Every cell a board's list can draw, in the order its Columns menu lists them: the cells of the
 * board's `columns` in their order and under their headings, then the other cells of `LIST_CELLS`
 * under their own. A cell is drawn when the saved choice (`saved`) names it, or, with none, when
 * the board's `columns` do; Project (`title`) is drawn always. A column of `columns` naming no cell
 * of `LIST_CELLS` is left out, as the config check reports it.
 */
export function listCells(columns: BoardColumn[], saved: string[] | undefined): ListedColumn[] {
    const own = columns.filter((one) => LIST_CELLS.includes(one.key));
    const named = new Set(own.map((one) => one.key));
    const cells = [
        ...own,
        ...LIST_CELLS.filter((cell) => !named.has(cell)).map((cell) => ({
            key: cell,
            label: cellHeading(cell)
        }))
    ];
    const drawn = new Set(saved ?? own.map((one) => one.key));
    return cells.map((cell) => ({
        ...cell,
        shown: cell.key === 'title' || drawn.has(cell.key)
    }));
}

/**
 * The saved choice of a board's columns after one cell is shown or hidden: the cells drawn, in the
 * Columns menu's order, or nothing when they are the board's own `columns`, so a board whose
 * `columns` change later draws the new ones.
 */
export function pickCell(
    columns: BoardColumn[],
    saved: string[] | undefined,
    key: string
): string[] | undefined {
    const cells = listCells(columns, saved);
    const next = cells
        .filter((cell) => (cell.key === key ? !cell.shown || key === 'title' : cell.shown))
        .map((cell) => cell.key);
    const own = listCells(columns, undefined)
        .filter((cell) => cell.shown)
        .map((cell) => cell.key);
    return next.join('\n') === own.join('\n') ? undefined : next;
}
