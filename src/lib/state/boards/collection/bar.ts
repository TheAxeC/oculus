// Layer 2, client state. A collection view's bar as data, in the shapes of a project board's bar
// (state/boards/board/), so views/shared/forms/bar/FilterBar.svelte and SliceLine.svelte draw it
// as they draw a board's. Line 2 is one slice group, the collection's status field, a slice per
// status value the entries carry in the order they first occur and, for the files that name the
// `funding` registry while projects have no scheme, the No funding slice after them; the slices
// are stored under the facet key `status`. Line 1 is the Role group (while the roles are drawn),
// the Hub group (while the workspace has more than one hub), then one group per `filter: true`
// field of the schemas, in the schemas' order, its id `field:<field>`.
//
// A picked value keeps the entries that hold it and none picked keeps every entry, as on a board.
// Each value is counted over the entries the search, Mine only and every other group leave, so a
// group's own pick does not change its counts; a picked value no entry holds is listed at 0 after
// the values held, so it can be taken out. The roles and Mine only are data/shapes/boards/roles.ts
// `entryRoles`, the rule the project boards read.
//
// A view whose cards draw a project strip (`strips`, the projects each card draws at its foot as
// a board's items) holds a Projects section in More, never on line 1: the groups Category, Stage,
// Form, Tier, Role (while a person is marked as the user) and Pillar, their picks saved under
// `project_category`, `project_stage`, `project_form`, `project_tier`, `project_role` and
// `project_pillar`. Category lists the rows of `categories:` of every hub's words, the rows
// carrying `archival` left out, then "other" for the projects in no row; Stage lists the stages as
// the Map's Stage group does (state/boards/structure/map-bar.ts `stageGroup`); the other four are
// a board's facets over the Map's preset (`facets`, `filterGroups`). A project pick narrows every
// card's strip to the projects that carry a picked value of each project group with a pick
// (`strip`), and hides an entry, or the No funding card, whose strip it leaves empty; with no
// project pick an entry with no strip is shown. A project value is counted as how many distinct
// projects of the strips of the entries the other groups leave, and of the No funding card while
// its slice keeps it, carry it under the other project groups' picks; the entry groups and the
// status slices are counted over the entries the project picks leave.

import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import { entryRoles } from '../../../data/shapes/boards/roles.ts';
import {
    FILTERED_TYPES,
    optionKeys,
    optionLabel,
    type Entry,
    type SchemaField
} from '../../../data/model/index.ts';
import { t } from '../../shared/words/text.ts';
import { namedTone, statusTone, toneOf } from '../../shared/words/tones.ts';
import {
    facetToneIn,
    filterGroups,
    type FilterChoice,
    type FilterGroup
} from '../board/filter-menu.ts';
import { facets, type Slice, type SliceGroup } from '../board/facets.ts';
import {
    NONE,
    type BoardItem,
    type BoardPreset,
    type Facet,
    type FacetValue
} from '../board/presets.ts';
import { facetValues } from '../board/state.ts';
import type { Keeps } from '../structure/cross-links.ts';
import { stageGroup } from '../structure/map-bar.ts';
import { NO_FUNDING, STATUS_FIELD, fieldWords } from './index.ts';

/** The facet key the status slices are stored under. */
export const STATUS_FACET = STATUS_FIELD;

/** The id of the Role group, and of the Hub group. */
const ROLE_GROUP = 'role';
const HUB_GROUP = 'hub';

/** The prefix of the id of a field's group: `field:<field>`. */
const FIELD_GROUP = 'field:';

/** The ids of the Projects section's groups, in the order More lists them. */
const CATEGORY_GROUP = 'project_category';
const STAGE_GROUP = 'project_stage';

/** The board facets the Projects section offers after Category and Stage, in their order. */
const PROJECT_FACETS = ['form', 'tier', 'role', 'pillar'];

/** The id a board facet's group of the Projects section is saved under: `project_<facet>`. */
function facetGroup(facet: string): string {
    return `project_${facet}`;
}

/** The projects the cards of a view draw at their foot, which the Projects section filters. */
export type Strips = {
    /** The projects an entry's card draws, as a board's items. */
    of: (entry: Entry) => readonly BoardItem[];
    /** The projects the No funding card draws, as a board's items; none without the card. */
    unfunded: readonly BoardItem[];
    /** The preset the items were joined by: the Map's, which takes every project. */
    preset: BoardPreset;
};

/** The heading More draws over the Projects section's groups, and their ids. */
type MoreSection = { heading: string; ids: string[] };

/** What the bar is made of: the entries, their files' schemas, the state and the words. */
export type BarInput = {
    /** Every entry the view holds, of every hub's file. */
    entries: readonly Entry[];
    /** The schema of each file of the collection. */
    schemas: readonly (SchemaField[] | undefined)[];
    /** The picked values by group id, the slices under `status`. */
    filters: Record<string, string[]>;
    search: string;
    /** Whether Mine only is on. */
    mine: boolean;
    /** The merged config, whose `roles:` and `facet_tones` the bar reads. */
    config: Record<string, unknown>;
    /** The ids of the people marked as the user. */
    self: ReadonlySet<string>;
    /** The hubs the Hub group lists, none while the workspace has one hub. */
    hubs: readonly string[];
    /** How many projects no funding scheme covers, the No funding slice's count; 0 for none. */
    noFunding: number;
    /** The projects the cards draw at their foot; none for a view whose cards draw none. */
    strips?: Strips;
};

/** The bar of a collection view, and what it keeps. */
export type CollectionBar = {
    /** Line 1's groups: Role, Hub, then the fields'; then the Projects section's. */
    groups: FilterGroup[];
    /** The ids of the groups line 1 draws, in their order: every group's but the section's. */
    line: string[];
    /** The Projects section More draws, none while no card draws a project strip. */
    section: MoreSection | undefined;
    /** Whether a card's strip draws a project: every one while no project group has a pick. */
    strip: Keeps;
    /** Line 2's slice group, none for a collection with no status field or no status. */
    slices: SliceGroup[];
    /** The status facet with its counts, for line 2. */
    counted: Facet[];
    /** Whether Mine only is drawn, and whether an entry carries the Lead badge. */
    named: boolean;
    lead: (entry: Entry) => boolean;
    /** Whether the bar keeps an entry. */
    keeps: (entry: Entry) => boolean;
    /** Whether the No funding card is kept. */
    card: boolean;
    /** How many entries are kept, and how many the view holds. */
    shown: number;
    total: number;
};

/** Every word an entry holds, so the search box reaches a value wherever in the record it sits. */
function haystack(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(haystack).join(' ');
    if (isMap(value)) return Object.values(value).map(haystack).join(' ');
    return '';
}

/** Whether a text is a whole number written in digits. */
function isWhole(text: string): boolean {
    return /^\d{1,9}$/.test(text.trim());
}

/** The entry's status word, the empty text for none. */
function statusOf(entry: Entry): string {
    const status = entry.fields[STATUS_FIELD];
    return typeof status === 'string' ? status.trim() : '';
}

/** The field marked `filter: true` of the schemas, each once, in the order the files name them. */
function filteredFields(schemas: BarInput['schemas']): SchemaField[] {
    const fields = new Map<string, SchemaField>();
    for (const one of schemas.flatMap((schema) => schema ?? [])) {
        if (one.filter === true && FILTERED_TYPES.includes(one.type) && !fields.has(one.field)) {
            fields.set(one.field, one);
        }
    }
    return [...fields.values()];
}

/** The status field of the schemas, the first that names one. */
function statusField(schemas: BarInput['schemas']): SchemaField | undefined {
    return schemas.flatMap((schema) => schema ?? []).find((one) => one.field === STATUS_FIELD);
}

/** One group's rule: the values a record carries for it, an entry or a project of a strip. */
type Rule<T = Entry> = { id: string; values: (record: T) => string[] };

/** How many records carry each value of a rule. */
function countsOf<T>(records: readonly T[], rule: Rule<T>): Map<string, number> {
    const counts = new Map<string, number>();
    for (const record of records) {
        for (const value of new Set(rule.values(record))) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return counts;
}

/** Whether a record carries a picked value of every rule with a pick, the rules of `skip` aside. */
function meets<T>(
    record: T,
    rules: readonly Rule<T>[],
    picked: (id: string) => string[],
    skip: readonly string[]
): boolean {
    return rules.every((rule) => {
        const want = picked(rule.id);
        if (skip.includes(rule.id) || want.length === 0) return true;
        return rule.values(record).some((value) => want.includes(value));
    });
}

/** Each project of the items once, by its id, in the order they first come. */
function distinct(items: Iterable<BoardItem>): BoardItem[] {
    return [...new Map([...items].map((item) => [item.id, item])).values()];
}

/** The Category group's rule: a project's row of `categories:`, `NONE` for one in no row. */
function categoryRule(preset: BoardPreset): Rule<BoardItem> {
    const known = new Set(preset.categories.map((row) => row.key));
    return {
        id: CATEGORY_GROUP,
        values: (item) => [known.has(item.category) ? item.category : NONE]
    };
}

/**
 * The rules of the Projects section's groups, in their order: Category; Stage, a project's stage;
 * then the board facets, Role only while a person is marked as the user (`named`), since without
 * one no project has a role.
 */
function projectRules(preset: BoardPreset, named: boolean): Rule<BoardItem>[] {
    return [
        categoryRule(preset),
        {
            id: STAGE_GROUP,
            values: (item) => (item.project.stage === undefined ? [] : [item.project.stage])
        },
        ...shownFacets(named).map((facet) => ({
            id: facetGroup(facet),
            values: (item: BoardItem) => facetValues(item, facet)
        }))
    ];
}

/** The board facets the Projects section draws: Role only while a person is the user. */
function shownFacets(named: boolean): string[] {
    return PROJECT_FACETS.filter((facet) => named || facet !== 'role');
}

/**
 * The Category group: the rows of `categories:` of every hub's words (`preset.categories`) a
 * project of `whole` is in, in their order and drawn in their colour, the rows carrying `archival`
 * left out, then "other" for the projects in no row; each counted over `counted`, and a picked
 * value none of `whole` carries listed at 0 after them.
 */
function categoryGroup(
    whole: readonly BoardItem[],
    counted: readonly BoardItem[],
    preset: BoardPreset,
    picked: readonly string[]
): FilterGroup {
    const rule = categoryRule(preset);
    const held = countsOf(whole, rule);
    const counts = countsOf(counted, rule);
    const rows = preset.categories.filter((row) => !row.archival && held.has(row.key));
    const other = t('board.section_other');
    const values: FacetValue[] = rows.map((row) => ({
        value: row.key,
        label: row.label,
        count: counts.get(row.key) ?? 0,
        tone: toneOf(row.color)
    }));
    if (held.has(NONE)) values.push({ value: NONE, label: other, count: counts.get(NONE) ?? 0 });
    const label = (value: string): string =>
        value === NONE
            ? other
            : (preset.categories.find((row) => row.key === value)?.label ?? value);
    const listed = withGone(values, picked, label);
    return groupOf(CATEGORY_GROUP, t('collection.project_category'), namedTone(''), listed, picked);
}

/**
 * The groups of the Projects section, in their order: Category, Stage (the Map's listing, with no
 * stage rule of its own), then Form, Tier, Role and Pillar, a board's facets over the Map's
 * preset. `whole` is every project the cards draw, which the values are listed from; `left` the
 * projects of the kept cards that the picks of every project group but those of `skip` leave,
 * which the values are counted over. A group with no value is not drawn.
 */
function projectGroups(
    whole: readonly BoardItem[],
    left: (skip: readonly string[]) => BoardItem[],
    preset: BoardPreset,
    named: boolean,
    picked: (id: string) => string[]
): FilterGroup[] {
    const shown = shownFacets(named);
    const category = categoryGroup(whole, left([CATEGORY_GROUP]), preset, picked(CATEGORY_GROUP));
    const stage = stageGroup(
        [...whole],
        left([STAGE_GROUP]),
        preset.stageOrder,
        picked(STAGE_GROUP)
    );
    // The board facets are counted over the projects the Category and Stage picks leave, each
    // under the other facets' picks (`facets` with the picks in force), and listed from every
    // project the cards draw, so a value keeps its row while the reader picks.
    const filters = Object.fromEntries(shown.map((facet) => [facet, picked(facetGroup(facet))]));
    const staged = left(shown.map(facetGroup));
    const counted = facets(staged, preset, named, { filters, search: '' });
    const merged: Facet[] = facets([...whole], preset, named)
        .filter((facet) => shown.includes(facet.key))
        .map((facet) => {
            const counts = counted.find((one) => one.key === facet.key)?.values ?? [];
            return {
                key: facet.key,
                values: facet.values.map((value) => ({
                    ...value,
                    count: counts.find((one) => one.value === value.value)?.count ?? 0
                }))
            };
        });
    const board = filterGroups(merged, filters, preset, named);
    const own = shown.flatMap((facet) =>
        board
            .filter((group) => group.id === facet)
            .map((group) => ({
                ...group,
                id: facetGroup(facet)
            }))
    );
    return [category, { ...stage, id: STAGE_GROUP }, ...own].filter(
        (group) => group.items.length > 0
    );
}

/**
 * The values of a field's group in their order: a field with options in the options' order, a
 * text field whose values are all whole numbers newest first, any other by how many entries hold
 * each, then by its words.
 */
function fieldOrder(field: SchemaField, counts: Map<string, number>): string[] {
    const held = [...counts.keys()];
    const options = optionKeys(field);
    if (options.length > 0) {
        const other = held.filter((one) => !options.includes(one));
        return [...options.filter((one) => counts.has(one)), ...other];
    }
    if (field.type === 'text' && held.every(isWhole)) {
        return held.sort((a, b) => Number(b) - Number(a));
    }
    return held.sort(
        (a, b) =>
            (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
            optionLabel(field, a).localeCompare(optionLabel(field, b))
    );
}

/** A group of choices from its values, each picked while `picked` holds it. */
function groupOf(
    id: string,
    heading: string,
    tone: string,
    values: readonly FacetValue[],
    picked: readonly string[]
): FilterGroup {
    const items: FilterChoice[] = values.map((one) => ({
        id: one.value,
        label: one.label,
        count: one.count,
        active: picked.includes(one.value),
        tone: one.tone ?? tone
    }));
    return { id, heading, tone, items };
}

/** The picked values of `values` no entry holds, each at 0 by its words, after the ones held. */
function withGone(
    values: FacetValue[],
    picked: readonly string[],
    label: (value: string) => string
): FacetValue[] {
    const gone = picked
        .filter((value) => !values.some((one) => one.value === value))
        .map((value) => ({ value, label: label(value), count: 0 }));
    return [...values, ...gone];
}

/** The bar of a collection view for what it holds and its state. */
export function collectionBar(input: BarInput): CollectionBar {
    const { entries, schemas, filters, config, hubs } = input;
    const picked = (id: string): string[] => byKey(filters, id) ?? [];
    const roles = entryRoles(config, schemas, input.self, entries, {
        mine: input.mine,
        picked: []
    });
    const fields = filteredFields(schemas);
    const statusRule: Rule = { id: STATUS_FACET, values: (entry) => [statusOf(entry)] };
    const roleRule: Rule = { id: ROLE_GROUP, values: (entry) => [roles.role(entry) ?? ''] };
    const hubRule: Rule = { id: HUB_GROUP, values: (entry) => [rootOf(entry)] };
    const fieldRule = (field: SchemaField): Rule => ({
        id: `${FIELD_GROUP}${field.field}`,
        values: (entry) => fieldWords(entry.fields[field.field])
    });
    // A Role pick narrows only while the roles are drawn and a Hub pick only while the Hub group
    // is, so a pick saved earlier narrows nothing while its group is not drawn.
    const rules: Rule[] = [
        ...(roles.drawn ? [roleRule] : []),
        ...(hubs.length > 0 ? [hubRule] : []),
        ...fields.map(fieldRule),
        statusRule
    ];
    const needle = input.search.trim().toLowerCase();
    const mineKeeps = roles.keeps;
    /** Whether an entry passes the search, Mine only and every entry rule but `but`'s. */
    const entryPasses = (entry: Entry, but: string): boolean => {
        if (needle !== '' && !haystack(entry.fields).toLowerCase().includes(needle)) return false;
        if (!mineKeeps(entry)) return false;
        return meets(entry, rules, picked, [but]);
    };
    // The Projects section is drawn while a card draws a project; a project pick narrows nothing
    // while it is not, nor a Role pick while no person is marked as the user.
    const strips = input.strips;
    const stripOf = (entry: Entry): readonly BoardItem[] => strips?.of(entry) ?? [];
    const unfunded = strips?.unfunded ?? [];
    const whole = distinct([...entries.flatMap(stripOf), ...unfunded]);
    const preset = strips?.preset;
    const named = input.self.size > 0;
    const itemRules = preset === undefined || whole.length === 0 ? [] : projectRules(preset, named);
    const narrows = (item: BoardItem): boolean => meets(item, itemRules, picked, []);
    const picking = itemRules.some((rule) => picked(rule.id).length > 0);
    /** Whether an entry passes every entry rule but `but`'s and keeps a project of its strip. */
    const passes = (entry: Entry, but: string): boolean =>
        entryPasses(entry, but) && (!picking || stripOf(entry).some(narrows));
    const leftBy = (id: string): Entry[] => entries.filter((entry) => passes(entry, id));
    const groups: FilterGroup[] = [];
    if (roles.drawn) {
        const counts = countsOf(leftBy(ROLE_GROUP), roleRule);
        const values = roles.facet.map((row) => ({
            value: row.key,
            label: row.label,
            count: counts.get(row.key) ?? 0
        }));
        const listed = withGone(values, picked(ROLE_GROUP), (value) => value);
        const tone = facetToneIn(ROLE_GROUP, config);
        groups.push(groupOf(ROLE_GROUP, t('roles.facet'), tone, listed, picked(ROLE_GROUP)));
    }
    if (hubs.length > 0) {
        const counts = countsOf(leftBy(HUB_GROUP), hubRule);
        const values = hubs.map((hub) => ({ value: hub, label: hub, count: counts.get(hub) ?? 0 }));
        const tone = facetToneIn(HUB_GROUP, config);
        groups.push(groupOf(HUB_GROUP, t('board.facet_hub'), tone, values, picked(HUB_GROUP)));
    }
    for (const field of fields) {
        const rule = fieldRule(field);
        const id = rule.id;
        const whole = countsOf(entries, rule);
        const counts = countsOf(leftBy(id), rule);
        const values = fieldOrder(field, whole).map((value) => ({
            value,
            label: optionLabel(field, value),
            count: counts.get(value) ?? 0
        }));
        const listed = withGone(values, picked(id), (value) => optionLabel(field, value));
        if (listed.length === 0) continue;
        groups.push(groupOf(id, field.label ?? field.field, namedTone(''), listed, picked(id)));
    }
    const status = statusField(schemas);
    const statusCounts = countsOf(leftBy(STATUS_FACET), statusRule);
    const words = [...countsOf(entries, statusRule).keys()].filter((one) => one !== '');
    const slices: Slice[] = words.map((value) => {
        const label = status === undefined ? value : optionLabel(status, value);
        return { value, label, tip: label, tone: statusTone(value) };
    });
    const statusValues: FacetValue[] = words.map((value) => ({
        value,
        label: value,
        count: statusCounts.get(value) ?? 0
    }));
    // Under a project pick the No funding slice counts the projects of the card the pick leaves.
    const unfundedLeft = picking ? unfunded.filter(narrows).length : input.noFunding;
    if (input.noFunding > 0) {
        const label = t('collection.no_funding');
        slices.push({ value: NO_FUNDING, label, tip: label, tone: '' });
        statusValues.push({ value: NO_FUNDING, label, count: unfundedLeft });
    }
    const slicePicks = picked(STATUS_FACET);
    const sliceKeepsCard =
        input.noFunding > 0 && (slicePicks.length === 0 || slicePicks.includes(NO_FUNDING));
    const keeps = (entry: Entry): boolean => passes(entry, '');
    const line = groups.map((group) => group.id);
    if (preset !== undefined && itemRules.length > 0) {
        // The projects of the cards the entry rules keep, and of the No funding card while its
        // slice keeps it, each counted once however many strips draw it.
        const kept = distinct([
            ...entries.filter((entry) => entryPasses(entry, '')).flatMap(stripOf),
            ...(sliceKeepsCard ? unfunded : [])
        ]);
        const left = (skip: readonly string[]): BoardItem[] =>
            kept.filter((item) => meets(item, itemRules, picked, skip));
        groups.push(...projectGroups(whole, left, preset, named, picked));
    }
    const ids = groups.map((group) => group.id).filter((id) => !line.includes(id));
    const items = new Map(whole.map((item) => [item.id, item]));
    const heading = status?.label ?? t('collection.status_facet');
    return {
        groups,
        line,
        section: ids.length === 0 ? undefined : { heading: t('collection.projects'), ids },
        strip: (project) => {
            if (!picking) return true;
            const item = items.get(project.id);
            return item !== undefined && narrows(item);
        },
        slices:
            slices.length === 0 ? [] : [{ key: STATUS_FACET, label: heading, tone: '', slices }],
        counted: [{ key: STATUS_FACET, values: statusValues }],
        named: roles.drawn,
        lead: (entry) => roles.lead(entry),
        keeps,
        card: sliceKeepsCard && (!picking || unfundedLeft > 0),
        shown: entries.filter(keeps).length,
        total: entries.length
    };
}

/**
 * The words line 2 ends with on a collection: how many entries it holds ("12 entries", "1
 * entry"), or, while a filter or the search hides entries, how many of them are shown ("5 of 12
 * shown").
 */
export function entryCountWords(shown: number, total: number): string {
    if (shown < total) return t('collection.count_shown', shown, total);
    return total === 1 ? t('collection.count_one') : t('collection.count', total);
}
