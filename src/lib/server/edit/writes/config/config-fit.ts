// Layer 2, server. Whether a value fits the control the options catalog gives it, for both config
// writes: config-key.ts sets one value, config-value.ts a list, a multi, a parked list or a family
// of records, and each asks this module the one question, with the same sentences.
//
// What is wrong with a value by the entry alone is the rule's (catalog/value-rule.ts), the rule the
// Settings view refuses a value by before the write and the setting readers read a key by; this
// module words what the rule found from the text catalog and adds what needs the disk, the hub or
// the value the file held: a folder or file that is there, a parked list's items, a family's shape.
// The lists come from config-sources.ts. A write without lists (the undo, and a caller with no
// server) checks no value against the catalog, so an undo puts back what the file held.
//
// A value the file already holds is never refused for it. A leaf value, or a record of a family,
// equal at every depth to one the file holds for the option passes as it stands, wherever it
// stands, so a record moved by a reorder and a record the reader did not touch pass whole. In a
// record that equals none of them each field is checked in full, except a field whose value the
// file held at that same field (of the record at the same key in a map, of any record in a list)
// and whose check reads no other field of its record. A field that does read another
// (`allow_missing` naming a toggle, `from` picking by a field) is always checked in full in a
// changed record.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { byKey, isMap } from '../../../../data/helpers/guards.ts';
import {
    listedSources,
    pickedSources,
    readsOther,
    type CatalogEntry,
    type FieldSpec
} from '../../../../data/sources/config/catalog/options.ts';
import {
    valueProblem as ruleProblem,
    type RuleLists,
    type ValueProblem
} from '../../../../data/sources/config/catalog/value-rule.ts';
import { glyphNames } from '../../../../data/sources/config/rail.ts';
import { below, realPath } from '../../../core/paths.ts';
import { words } from '../../../core/words.ts';
import type { Sources } from './config-sources.ts';

type Plain = Record<string, unknown>;

/**
 * The text catalog the sentences are read from, and the lists, none for a put-back that checks no
 * value.
 */
export type Fit = { text: Record<string, string>; sources: Sources | null };

/** What one field's check reads besides its value: its record, and the values the file held. */
type Context = { fit: Fit; record: Plain | undefined; held: unknown[] };

/** One record of a family as the checks read it, with the map key it sits under. */
type Item = { key: string | undefined; record: Plain; label: string };

/** The controls whose value is a list, which config-value.ts sets as a whole. */
const COLLECTIONS = ['list', 'multi', 'parked'];

/**
 * Whether an option is a family or a list-valued leaf, which config-value.ts sets, and not one
 * value.
 */
export function isCollection(entry: CatalogEntry): boolean {
    return entry.fields !== undefined || COLLECTIONS.includes(entry.control ?? '');
}

/** Whether a value is a list of strings. */
function stringList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((one) => typeof one === 'string');
}

/** The sentence for a word that is not in a field's list. */
function notListed(spec: CatalogEntry, text: Record<string, string>): string {
    const named = [...listedSources(spec), ...Object.values(pickedSources(spec)?.sources ?? {})];
    return named.length === 0
        ? words(text, 'server.config_key.not_choice', (spec.options ?? []).join(', '))
        : words(text, 'server.config_key.not_in_source', named.join(', '));
}

/** The sentence for what the rule found wrong with a value of this entry. */
function sentenceOf(
    spec: CatalogEntry,
    problem: ValueProblem,
    text: Record<string, string>
): string {
    switch (problem.kind) {
        case 'boolean':
            return words(text, 'server.config_key.not_boolean');
        case 'number':
            return words(text, 'server.config_key.not_number');
        case 'whole':
            return words(text, 'server.config_key.not_whole');
        case 'range':
            return rangeSentence(problem.min, problem.max, text);
        case 'text':
            return words(text, 'server.config_key.not_text');
        case 'empty':
        case 'choice':
        case 'source':
            return notListed(spec, text);
        case 'form':
            if (problem.form === 'program') return words(text, 'server.config_key.not_program');
            if (problem.form === 'extension') return words(text, 'server.config_key.not_extension');
            return words(text, 'server.config_key.not_bundle_id');
        case 'words':
            return words(text, 'server.config_key.not_words');
        case 'numbers':
            return words(text, 'server.config_key.not_numbers');
        case 'strings':
            return words(text, 'server.config_value.not_strings');
        case 'records':
            return words(text, 'server.config_value.wants_records');
        case 'glyph':
            return words(text, 'server.config_key.not_glyph');
        case 'hue':
            return words(text, 'server.config_key.not_hue');
        case 'colour':
            return words(text, 'server.config_key.not_colour');
        case 'path':
            return words(text, 'server.config_key.not_a_path');
        case 'hub_path':
            return words(text, 'server.config_key.not_hub_path');
        case 'slots':
            return words(
                text,
                'server.config_key.wrong_slots',
                problem.slots.length,
                problem.slots.join(', ')
            );
    }
}

/** The sentence for a number outside its range. */
function rangeSentence(
    min: number | undefined,
    max: number | undefined,
    text: Record<string, string>
): string {
    if (min !== undefined && max !== undefined) {
        return words(text, 'server.config_key.number_range', min, max);
    }
    return min === undefined
        ? words(text, 'server.config_key.number_max', max ?? 0)
        : words(text, 'server.config_key.number_min', min);
}

/** The words a held value stands for: its items, or its text split at the spaces when joined. */
function heldWords(spec: CatalogEntry, held: unknown[]): string[] {
    return held.flatMap((one) => {
        if (Array.isArray(one))
            return one.filter((item): item is string => typeof item === 'string');
        if (typeof one !== 'string') return [];
        return spec.joined === true ? one.split(' ').filter((word) => word !== '') : [one];
    });
}

/**
 * The lists the rule reads for one entry, or the sentence that the record names no list for this
 * field. The items of the sources the entry names are together, null while the server does not
 * hold one of them.
 */
function listsFor(spec: CatalogEntry, ctx: Context, sources: Sources): RuleLists | string {
    let sourced: string[] | null = [];
    const add = (listed: string[] | null): void => {
        sourced = listed === null || sourced === null ? null : [...sourced, ...listed];
    };
    for (const source of listedSources(spec)) add(sources.items(source));
    const picked = pickedSources(spec);
    if (picked !== undefined) {
        const word = ctx.record?.[picked.field];
        const source = typeof word === 'string' ? byKey(picked.sources, word) : undefined;
        if (source === undefined) {
            return words(
                ctx.fit.text,
                'server.config_key.no_list_for',
                picked.field,
                typeof word === 'string' ? word : ''
            );
        }
        add(sources.items(source));
    }
    return {
        sourced,
        held: heldWords(spec, ctx.held),
        glyphs: glyphNames(sources.config) ?? [],
        config: sources.config
    };
}

/**
 * The reason a path of the hub does not fit, or null: inside the hub, there unless allowed absent.
 */
function hubPathProblem(
    spec: CatalogEntry,
    value: string,
    ctx: Context,
    hub: string
): string | null {
    const text = ctx.fit.text;
    const folder = spec.control === 'folder';
    const unfit = words(text, 'server.config_key.not_hub_path');
    const full = join(hub, value);
    if (!below(full, hub)) return unfit;
    const allowed =
        spec.allow_missing === true ||
        (typeof spec.allow_missing === 'string' && ctx.record?.[spec.allow_missing] === true);
    let there: { isDirectory: () => boolean; isFile: () => boolean };
    try {
        there = statSync(full);
    } catch {
        return allowed ? null : missing(text, folder, value);
    }
    const real = realPath(full);
    const root = realPath(hub);
    if (real === null || root === null || !below(real, root)) return unfit;
    if (folder ? there.isDirectory() : there.isFile()) return null;
    return missing(text, folder, value);
}

/** The sentence that a folder or a file the value names is not in the hub. */
function missing(text: Record<string, string>, folder: boolean, value: string): string {
    if (folder) return words(text, 'server.config_key.no_folder', value);
    return words(text, 'server.config_key.no_file', value);
}

/** The reason a parked list does not fit: it holds only items the file held, in their order. */
function parkedProblem(value: string[], ctx: Context): string | null {
    const [base] = ctx.held;
    const held = stringList(base) ? base : [];
    let at = 0;
    for (const item of value) {
        at = held.indexOf(item, at) + 1;
        if (at === 0) return words(ctx.fit.text, 'server.config_key.parked_added');
    }
    return null;
}

/** The reason a list of records does not fit the fields that describe them, or null. */
function recordsProblem(spec: CatalogEntry, value: unknown[], ctx: Context): string | null {
    const held = ctx.held.flatMap((one) => (Array.isArray(one) ? one.filter(isMap) : []));
    for (const [at, record] of value.entries()) {
        if (!isMap(record))
            return words(ctx.fit.text, 'server.config_value.bad_record', String(at + 1));
        if (held.some((one) => isDeepStrictEqual(one, record))) continue;
        const problem = recordProblem(spec.fields ?? {}, record, held, String(at + 1), ctx.fit);
        if (problem !== null) return problem;
    }
    return null;
}

/**
 * The reason a value does not fit its control, or null: the rule first, then what needs the disk,
 * the hub or the value the file held. Only called for a write that holds the server's lists.
 */
function fullProblem(
    spec: CatalogEntry,
    value: unknown,
    ctx: Context,
    sources: Sources
): string | null {
    if (value === '' && spec.empty !== undefined) return null;
    const lists = listsFor(spec, ctx, sources);
    if (typeof lists === 'string') return lists;
    const problem = ruleProblem(spec, value, lists);
    if (problem !== null) return sentenceOf(spec, problem, ctx.fit.text);
    switch (spec.control) {
        case 'parked':
            return parkedProblem(value as string[], ctx);
        case 'folder':
        case 'file':
            if (sources.hub === null) return words(ctx.fit.text, 'server.workspace.no_primary');
            return hubPathProblem(spec, value as string, ctx, sources.hub);
        case 'records':
            return recordsProblem(spec, value as unknown[], ctx);
        default:
            return null;
    }
}

/**
 * The reason a value does not fit one field or one option, or null. `held` is what the file held
 * at the field; a value equal to one of them passes unless the check reads another field.
 */
function fieldProblem(spec: CatalogEntry, value: unknown, ctx: Context): string | null {
    const sources = ctx.fit.sources;
    if (sources === null) return null;
    if (!readsOther(spec) && ctx.held.some((one) => isDeepStrictEqual(one, value))) return null;
    return fullProblem(spec, value, ctx, sources);
}

/** The reason one record of a family does not fit its fields, or null. */
function recordProblem(
    fields: Record<string, FieldSpec>,
    record: Plain,
    heldRecords: Plain[],
    label: string,
    fit: Fit
): string | null {
    for (const [name, value] of Object.entries(record)) {
        const spec = byKey(fields, name);
        if (spec === undefined) continue;
        const held = heldRecords.map((one) => one[name]).filter((one) => one !== undefined);
        const problem = fieldProblem(spec, value, { fit, record, held });
        if (problem !== null) {
            return words(fit.text, 'server.config_value.field_problem', label, name, problem);
        }
    }
    return null;
}

/** Whether a family's fields are exactly `key` and `value`, which is a table of one value a key. */
function isTable(entry: CatalogEntry): boolean {
    const names = Object.keys(entry.fields ?? {});
    return names.length === 2 && names.includes('key') && names.includes('value');
}

/** Whether a table value is a scalar, or a list of scalars where the table holds lists. */
function isTableValue(value: unknown, lists: boolean): boolean {
    const scalar = (one: unknown): boolean =>
        one === null || ['string', 'number', 'boolean'].includes(typeof one);
    return scalar(value) || (lists && Array.isArray(value) && value.every(scalar));
}

/**
 * The records of a family value, each with the map key it sits under; a value of another shape has
 * none.
 */
function itemsOf(entry: CatalogEntry, value: unknown): Item[] {
    if (Array.isArray(value)) {
        return value.flatMap((record, at) =>
            isMap(record) ? [{ key: undefined, record, label: String(at + 1) }] : []
        );
    }
    if (!isMap(value)) return [];
    const table = isTable(entry);
    return Object.entries(value).flatMap(([name, held]) => {
        if (table) return [{ key: name, record: { key: name, value: held }, label: name }];
        if (entry.holds === 'lists') {
            return Array.isArray(held)
                ? held.flatMap((record, at) =>
                      isMap(record)
                          ? [
                                {
                                    key: name,
                                    record: { key: name, ...record },
                                    label: `${name} ${at + 1}`
                                }
                            ]
                          : []
                  )
                : [];
        }
        return isMap(held) ? [{ key: name, record: { key: name, ...held }, label: name }] : [];
    });
}

/** The names of the fields a record of a family may hold: the catalog's, and those already held. */
function allowedFields(
    entry: CatalogEntry,
    held: unknown
): { listed: Set<string>; keyed: Set<string> } {
    const names = Object.keys(entry.fields ?? {});
    const extra = new Set<string>();
    const records: unknown[] = [];
    const collect = (value: unknown): void => {
        if (Array.isArray(value)) value.forEach(collect);
        else if (isMap(value)) records.push(value);
    };
    if (Array.isArray(held)) collect(held);
    else if (isMap(held)) Object.values(held).forEach(collect);
    for (const record of records) {
        for (const name of Object.keys(record as Plain)) extra.add(name);
    }
    return {
        listed: new Set([...names, ...extra]),
        keyed: new Set([...names.filter((name) => name !== 'key'), ...extra])
    };
}

/**
 * The sentence for a record that is not a map of named fields, or that names a field not described.
 */
function shapeOfRecord(
    record: unknown,
    label: string,
    allowed: Set<string>,
    text: Record<string, string>
): string | null {
    if (!isMap(record)) return words(text, 'server.config_value.bad_record', label);
    for (const name of Object.keys(record)) {
        if (!allowed.has(name)) return words(text, 'server.config_value.bad_field', label, name);
    }
    return null;
}

/**
 * The sentence for a family value that is not the collection kind the file holds: a list of
 * records, a map of entries (a key/value table when its fields are `key` and `value`, which takes
 * a list of values only where the catalog entry says `holds: lists`, whatever the file holds now,
 * so an emptied table keeps its kind), a map of records, or a map of lists of records.
 */
function shapeProblem(
    entry: CatalogEntry,
    held: unknown,
    value: unknown,
    text: Record<string, string>
): string | null {
    const allowed = allowedFields(entry, held);
    if (Array.isArray(held)) {
        if (!Array.isArray(value)) return words(text, 'server.config_value.wrong_list');
        for (const [at, record] of value.entries()) {
            const problem = shapeOfRecord(record, String(at + 1), allowed.listed, text);
            if (problem !== null) return problem;
        }
        return null;
    }
    if (!isMap(value)) return words(text, 'server.config_value.wrong_map');
    const table = isTable(entry);
    const lists = entry.holds === 'lists';
    for (const [name, item] of Object.entries(value)) {
        if (table) {
            if (!isTableValue(item, lists)) {
                return lists
                    ? words(text, 'server.config_value.wants_scalar', name)
                    : words(text, 'server.config_value.wants_value', name);
            }
        } else if (lists) {
            if (!Array.isArray(item)) return words(text, 'server.config_value.wants_list', name);
            for (const [at, record] of item.entries()) {
                const problem = shapeOfRecord(record, `${name} ${at + 1}`, allowed.keyed, text);
                if (problem !== null) return problem;
            }
        } else {
            if (Array.isArray(item)) return words(text, 'server.config_value.wants_record', name);
            const problem = shapeOfRecord(item, name, allowed.keyed, text);
            if (problem !== null) return problem;
        }
    }
    return null;
}

/**
 * The reason a family value does not fit: its shape, then each record that equals none the file
 * holds, field by field.
 */
function familyProblem(
    entry: CatalogEntry,
    held: unknown,
    value: unknown,
    fit: Fit
): string | null {
    const shaped = shapeProblem(entry, held, value, fit.text);
    if (shaped !== null) return shaped;
    const base = itemsOf(entry, held);
    for (const item of itemsOf(entry, value)) {
        if (
            fit.sources !== null &&
            base.some((one) => isDeepStrictEqual(one.record, item.record))
        ) {
            continue;
        }
        const same = base.filter((one) => one.key === item.key).map((one) => one.record);
        const problem = recordProblem(entry.fields ?? {}, item.record, same, item.label, fit);
        if (problem !== null) return problem;
    }
    return null;
}

/**
 * The reason a value does not fit an option set one key at a time, or null. `held` is the value the
 * file holds at the key now.
 */
export function leafProblem(
    entry: CatalogEntry,
    held: unknown,
    value: unknown,
    fit: Fit
): string | null {
    return fieldProblem(entry, value, { fit, record: undefined, held: [held] });
}

/**
 * The reason a value does not fit a list option or a family, or null. `held` is the collection the
 * file holds at the key now.
 */
export function valueProblem(
    entry: CatalogEntry,
    held: unknown,
    value: unknown,
    fit: Fit
): string | null {
    if (entry.fields !== undefined) return familyProblem(entry, held, value, fit);
    return fieldProblem(entry, value, { fit, record: undefined, held: [held] });
}
