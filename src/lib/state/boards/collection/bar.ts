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
import { namedTone, statusTone } from '../../shared/words/tones.ts';
import { facetToneIn, type FilterChoice, type FilterGroup } from '../board/filter-menu.ts';
import type { Slice, SliceGroup } from '../board/facets.ts';
import type { Facet, FacetValue } from '../board/presets.ts';
import { NO_FUNDING, STATUS_FIELD, fieldWords } from './index.ts';

/** The facet key the status slices are stored under. */
export const STATUS_FACET = STATUS_FIELD;

/** The id of the Role group, and of the Hub group. */
const ROLE_GROUP = 'role';
const HUB_GROUP = 'hub';

/** The prefix of the id of a field's group: `field:<field>`. */
const FIELD_GROUP = 'field:';

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
};

/** The bar of a collection view, and what it keeps. */
export type CollectionBar = {
    /** Line 1's groups: Role, Hub, then the fields'. */
    groups: FilterGroup[];
    /** The ids of the groups line 1 draws, in their order: every group's. */
    line: string[];
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

/** One group's rule: the values an entry carries for it. */
type Rule = { id: string; values: (entry: Entry) => string[] };

/** How many entries carry each value of a rule. */
function countsOf(entries: readonly Entry[], rule: Rule): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of entries) {
        for (const value of new Set(rule.values(entry))) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return counts;
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
    /** Whether an entry passes the search, Mine only and every rule but `but`'s. */
    const passes = (entry: Entry, but: string): boolean => {
        if (needle !== '' && !haystack(entry.fields).toLowerCase().includes(needle)) return false;
        if (!mineKeeps(entry)) return false;
        return rules.every((rule) => {
            const want = picked(rule.id);
            if (rule.id === but || want.length === 0) return true;
            return rule.values(entry).some((value) => want.includes(value));
        });
    };
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
    if (input.noFunding > 0) {
        const label = t('collection.no_funding');
        slices.push({ value: NO_FUNDING, label, tip: label, tone: '' });
        statusValues.push({ value: NO_FUNDING, label, count: input.noFunding });
    }
    const slicePicks = picked(STATUS_FACET);
    const keeps = (entry: Entry): boolean => passes(entry, '');
    const heading = status?.label ?? t('collection.status_facet');
    return {
        groups,
        line: groups.map((group) => group.id),
        slices:
            slices.length === 0 ? [] : [{ key: STATUS_FACET, label: heading, tone: '', slices }],
        counted: [{ key: STATUS_FACET, values: statusValues }],
        named: roles.drawn,
        lead: (entry) => roles.lead(entry),
        keeps,
        card: input.noFunding > 0 && (slicePicks.length === 0 || slicePicks.includes(NO_FUNDING)),
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
