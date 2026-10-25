// Layer 2, client state. Board facet labels, ordering and counts live here because facet vocabulary
// changes independently of item construction and board state. The values an item carries for a
// facet are state.ts's `facetValues`, which the filter reads too, so a facet counts a value under
// the same rule the filter keeps a project by.
//
// A value that names a record of a hub (a domain, a venue, a pillar, a funding scheme, a dataset, a
// resource) is that record's key, its internal id with the hub's name off: on a workspace of two
// hubs one key of both is one value of its group, its count the sum of both hubs' projects, and one
// filter picks the projects of both. The words are the ones a project card draws for the record,
// which items.ts gives by the key. The card view's sections, one per category, are cut here too,
// and so are the slices of the bar's second line, each the projects of one category at one stage
// or, for a category whose row has a `forms:` block, of one form: a slice is the slice facet's
// value laid out, and a project is in one slice at most.

import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf } from '../../../data/helpers/hub-names.ts';
import type { Category } from '../../../data/shapes/boards/categories.ts';
import { t } from '../../shared/words/text.ts';
import {
    UNKNOWN_TONE,
    chipKeys,
    chipLabel,
    domainLabel,
    legendLists,
    paletteTone,
    stageLabel,
    stageTone,
    toneOf
} from '../../shared/words/tones.ts';
import {
    CODE_VALUES,
    FACETS,
    NONE,
    REPRODUCED_VALUES,
    SESSIONS_VALUES,
    shortWords,
    stageRank,
    type BoardItem,
    type BoardPreset,
    type Facet,
    type QuickFilters
} from './presets.ts';
import { applyFilters, facetValues } from './state.ts';

/** The words, the hue and the place of each record value, from the first item that carries it. */
type Recorded = Map<string, { label: string; order: number; tone?: string }>;

/** What one facet's record values are read from, for the facets whose values name records. */
const RECORDS: Record<string, (item: BoardItem) => Recorded> = {
    compute: (item) =>
        new Map(item.compute.map((one) => [keyOf(one.id), { label: one.label, order: one.order }])),
    venue: (item) =>
        item.venue === null
            ? new Map()
            : new Map([[keyOf(item.venue.id), { label: item.venue.short, order: 0 }]]),
    domain: (item) =>
        item.domain === null || item.domain.tone === '' || item.domain.tone === UNKNOWN_TONE
            ? new Map()
            : new Map([[keyOf(item.domain.id), { label: '', order: 0, tone: item.domain.tone }]]),
    pillar: (item) =>
        new Map(
            item.pillars.map((tag) => [
                keyOf(tag.id),
                { label: tag.label, order: 0, tone: paletteTone(tag.color) }
            ])
        ),
    funding: (item) =>
        new Map(item.funding.map((tag) => [keyOf(tag.id), { label: tag.label, order: 0 }])),
    dataset: (item) =>
        new Map(item.datasets.map((tag) => [keyOf(tag.id), { label: tag.label, order: 0 }]))
};

/** The facets whose values read by the words of the record they name. */
const NAMED_RECORDS = ['compute', 'venue', 'pillar', 'funding', 'dataset'];

/** The record values of one facet over the items, each kept as the first item gives it. */
function recordValues(items: BoardItem[], facet: string): Recorded {
    const recorded: Recorded = new Map();
    const read = byKey(RECORDS, facet);
    if (read === undefined) return recorded;
    for (const item of items) {
        for (const [key, value] of read(item)) if (!recorded.has(key)) recorded.set(key, value);
    }
    return recorded;
}

/**
 * The words a facet value carries, for the values that are data rather than vocabulary. A compute
 * value reads by the resource's name `recorded` holds, a venue by its short name, and a pillar, a
 * funding scheme and a dataset by the words a card draws for them, each as itself without one.
 */
export function facetLabel(
    facet: string,
    value: string,
    preset: BoardPreset,
    recorded: Recorded = new Map()
): string {
    if (value === NONE) return value;
    if (NAMED_RECORDS.includes(facet)) return recorded.get(value)?.label ?? value;
    if (facet === 'role') return preset.roles.find((one) => one.key === value)?.label ?? value;
    if (facet === 'domain') return domainLabel(value);
    if (facet === 'status' || facet === 'form') return chipLabel(value);
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

/** The forms of `forms` of every hub's words, in their order. */
function formOrder(): string[] {
    return legendLists().find((one) => one.list === 'forms')?.keys ?? [];
}

/** The values of one facet, in the order its list gives them. */
function orderValues(
    facet: string,
    counts: Map<string, number>,
    preset: BoardPreset,
    recorded: Recorded
): string[] {
    const has = (value: string): boolean => (counts.get(value) ?? 0) > 0;
    // Every role is listed, with none at it too, so the facet names each role a project may hold.
    if (facet === 'role') return preset.roles.map((one) => one.key);
    if (facet === 'status') return chipKeys().filter(has);
    if (facet === 'form') return formOrder().filter(has);
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
    // where two weigh the same, a venue by its short name, so the order does not depend on the
    // order the projects were read in.
    if (facet === 'year') {
        const years = values.filter((value) => value !== NONE).sort((a, b) => b.localeCompare(a));
        return values.includes(NONE) ? [...years, NONE] : years;
    }
    const words = (value: string): string =>
        facet === 'venue' ? (recorded.get(value)?.label ?? value) : value;
    const named = values.filter((value) => value !== NONE);
    named.sort(
        (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || words(a).localeCompare(words(b))
    );
    return values.includes(NONE) ? [...named, NONE] : named;
}

/** One slice of the bar's second line: its value, its cut words, its whole label and its hue. */
export type Slice = { value: string; label: string; tip: string; tone: string };

/** One category of the bar's second line: its key, its words, its hue and its slices. */
export type SliceGroup = { key: string; label: string; tone: string; slices: Slice[] };

/**
 * The word a project's slice is named by in its category `row`: its form under a row whose
 * `forms:` block files it, else its stage; the empty string when it has neither.
 */
export function sliceWord(
    row: Pick<Category, 'forms'> | undefined,
    project: { stage?: string; form?: string }
): string {
    return (row?.forms === null || row === undefined ? project.stage : project.form) ?? '';
}

/** The value of a slice: `<category key>/<word>`, and the empty string for no word. */
export function sliceValue(category: string, word: string): string {
    return word === '' ? '' : `${category}/${word}`;
}

/**
 * The slices of a board, read from its projects before any filter, so a slice keeps its place
 * while a filter leaves it none: for each category the projects are in, in the order of
 * `categories`, with the projects in no category last as "other", one slice per stage of its
 * projects in the order of `stages`, or per form in the order of `forms` for a row with a `forms:`
 * block. A slice reads its stage's or form's words up to the first " (" and is drawn in its stage's
 * colour, a form slice in its category's.
 */
export function sliceGroups(items: BoardItem[], preset: BoardPreset): SliceGroup[] {
    const rows: (Category | undefined)[] = [...preset.categories, undefined];
    const known = new Set(preset.categories.map((one) => one.key));
    const groups: SliceGroup[] = [];
    for (const row of rows) {
        const key = row?.key ?? '';
        const held = items.filter((item) =>
            row === undefined ? !known.has(item.category) : item.category === key
        );
        const words = [...new Set(held.map((item) => sliceWord(row, item.project)))].filter(
            (word) => word !== ''
        );
        if (words.length === 0) continue;
        const forms = row !== undefined && row.forms !== null;
        const tone = row === undefined || row.color === '' ? '' : toneOf(row.color);
        const order = forms ? formOrder() : preset.stageOrder;
        words.sort((left, right) => stageRank(left, order) - stageRank(right, order));
        groups.push({
            key,
            label: row === undefined ? t('board.section_other') : row.label,
            tone,
            slices: words.map((word) => {
                const whole = forms ? chipLabel(word) : stageLabel(word);
                return {
                    value: sliceValue(key, word),
                    label: shortWords(whole),
                    tip: whole,
                    tone: forms && tone !== '' ? tone : stageTone(word)
                };
            })
        });
    }
    return groups;
}

/** The filters in force on a board: its facet values, its search and its quick filters. */
type InForce = { filters: Record<string, string[]>; search: string; quick?: QuickFilters };

/** The facet values in force without those of one facet. */
function without(filters: Record<string, string[]>, facet: string): Record<string, string[]> {
    return Object.fromEntries(Object.entries(filters).filter(([key]) => key !== facet));
}

/**
 * Every facet the board can be split on, with its counts. A facet lists the values the board's
 * projects hold, in an order read from all of them, so a list keeps its rows while the reader
 * picks; the slice facet lists the board's slices in `sliceGroups`' order. Given the filters in
 * force (`inForce`), a value's count is how many of the projects the search, the quick filters and
 * every other facet's values leave carry it, 0 where they leave none, so a facet's own pick does
 * not narrow its counts; given none, it is how many of the board's projects carry it. A facet with
 * one value is offered as that one value: a filter that selects everything is still the board
 * saying what its one value is, and the reader can read it. The role facet is offered only while
 * the workspace names a `self` (`named`), since without one no project has a role. The hub facet
 * is offered only while the workspace has more than one hub, and lists the hubs of `hubs` (their
 * names, in the workspace's order, empty with one hub) whether or not a project of the board is of
 * it, each named by itself. A value with a hue of its own carries it: a slice its slice's, a
 * domain its domain's and a pillar its pillar's.
 */
export function facets(
    items: BoardItem[],
    preset: BoardPreset,
    named = false,
    inForce?: InForce,
    hubs: readonly string[] = []
): Facet[] {
    const found: Facet[] = [];
    const kept =
        inForce === undefined
            ? items
            : applyFilters(items, inForce.filters, inForce.search, inForce.quick);
    // The projects one facet counts over: every filter in force but that facet's own values.
    const left = (facet: string): BoardItem[] =>
        inForce === undefined || (byKey(inForce.filters, facet) ?? []).length === 0
            ? kept
            : applyFilters(items, without(inForce.filters, facet), inForce.search, inForce.quick);
    const slices = sliceGroups(items, preset).flatMap((group) => group.slices);
    for (const facet of FACETS) {
        if (facet === 'role' && !named) continue;
        if (facet === 'hub' && hubs.length === 0) continue;
        const whole = countValues(items, facet);
        const counts = inForce === undefined ? whole : countValues(left(facet), facet);
        if (facet === 'hub') {
            const values = hubs.map((hub) => ({
                value: hub,
                label: hub,
                count: counts.get(hub) ?? 0
            }));
            found.push({ key: facet, values });
            continue;
        }
        if (facet === 'slice') {
            const values = slices.map((slice) => ({
                value: slice.value,
                label: slice.label,
                count: counts.get(slice.value) ?? 0,
                tone: slice.tone
            }));
            if (values.length > 0) found.push({ key: facet, values });
            continue;
        }
        const recorded = recordValues(items, facet);
        const values = orderValues(facet, whole, preset, recorded).map((value) => {
            const tone = recorded.get(value)?.tone;
            const one = {
                value,
                label: facetLabel(facet, value, preset, recorded),
                count: counts.get(value) ?? 0
            };
            return tone === undefined ? one : { ...one, tone };
        });
        if (values.length > 0) found.push({ key: facet, values });
    }
    return found;
}

/**
 * One section of the card view and of the list: a row of `categories` with the cards it holds,
 * or, with the empty key, the cards in no row.
 */
type CardSection = { key: string; label: string; color: string; items: BoardItem[] };

/**
 * The sections of the card view and of the list: one per row of `categories` holding a card, in
 * the list's order, then one with the empty key for the cards in no row, each section's cards in
 * the order given.
 */
export function cardSections(items: BoardItem[], preset: BoardPreset): CardSection[] {
    const sections = preset.categories.map((one) => ({
        key: one.key,
        label: one.label,
        color: one.color,
        items: items.filter((item) => item.category === one.key)
    }));
    const known = new Set(preset.categories.map((one) => one.key));
    const other = items.filter((item) => !known.has(item.category));
    return [...sections, { key: '', label: '', color: '', items: other }].filter(
        (section) => section.items.length > 0
    );
}
