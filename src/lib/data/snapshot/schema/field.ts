// Layer 1, data. A `schema:` field as a hub file writes it, read into the SchemaField the snapshot
// and the apps API carry: the name and the type, and beside them the keys a field may hold (its
// label, options, the collection its values name (`foreign_key:`), whether it is its file's primary
// key (`primary_key: true`) and its rank among the fields an entry is shown by (`display:`), the
// group of the editor it is drawn in (`section:`), the condition under which it is allowed, the
// condition under which it is required, whether it takes keys it does not declare, and the fields
// of a list of records, or of a map from a name to a record). The same reader reads the fields
// nested in a `records` field, so a schema is one vocabulary at every depth.
//
// A key of the wrong kind reads as absent: a `primary_key:` that is not `true` and a `display:`
// that is no whole number from 1 among them, each a finding of the schema run. A `section:` that
// is no text or is the empty text reads as no section. A field that names no `field` and `type`, or
// a nested `fields:` that is no list of such fields, costs the whole schema, because half a schema
// would draw half a record in a field order the file did not write. An option is a word or a
// `{ key, label }` row; a row that does not read is left out of the field, and a row holding a key
// besides `key` and `label` is read with its key and label; each is a finding of the schema run
// with its line.

import { z } from 'zod';
import type { SchemaField, SchemaOption } from '../../model/index.ts';
import { filledTextShape, optionalTextShape } from '../../shapes/shapes.ts';
import { compact } from '../compact.ts';

/** One field of a `schema:` as the check reads it: a map naming a field and a type. */
const namedFieldShape = z.object({ field: z.string(), type: z.string() });

/** A condition: each key a field of the record, each value a word or a list of words. */
const whenMapShape = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

/** `when:` as a file writes it, and absent for any other value. */
const whenShape = whenMapShape.optional().catch(undefined);

/** `foreign_key:` as a file writes it: one target, a list of targets, or `{ field, sources }`. */
const foreignKeyShape = z
    .union([
        z.string().transform((one): string[] => [one]),
        z.array(z.string()),
        z.object({ field: z.string(), sources: z.record(z.string(), z.string()) })
    ])
    .optional()
    .catch(undefined);

/** `required:` as a file writes it: a flag, or `{ when }`. */
const requiredShape = z
    .union([z.boolean(), z.object({ when: whenMapShape })])
    .optional()
    .catch(undefined);

/** A flag that is a boolean, and absent for any other value. */
const flagShape = z.boolean().optional().catch(undefined);

/** `primary_key:` as it is read: `true`, and absent for any other value. */
export const primaryKeyShape = z.literal(true).optional().catch(undefined);

/** `display:` as it is read: a whole number from 1, and absent for any other value. */
export const displayShape = z.number().int().min(1).optional().catch(undefined);

/** What an option key is held to: one word of letters, digits, `-` and `_`. */
const OPTION_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * What is wrong with one option of a field's `options:` list. A value that is neither a word nor a
 * map (`kind`), a row with no text `key` (`no_key`), a key that is not a word (`not_word`), a label
 * that is not text (`label`) and a key an earlier option holds (`taken`) leave the option out. A
 * row holding a key besides `key` and `label` (`extra`, `key` the row's key and `extra` the key it
 * holds) stays an option.
 */
export type OptionProblem = {
    index: number;
    word: 'kind' | 'no_key' | 'not_word' | 'label' | 'taken' | 'extra';
    key: string;
    extra?: string;
};

/** The keys an option row may hold. */
const ROW_KEYS = new Set(['key', 'label']);

/** One option read, or the reason it does not read. */
function optionOf(item: unknown): SchemaOption | Omit<OptionProblem, 'index' | 'extra'> {
    if (typeof item === 'string') return item;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return { word: 'kind', key: '' };
    }
    const row = item as Record<string, unknown>;
    if (typeof row.key !== 'string' || row.key === '') return { word: 'no_key', key: '' };
    if (!OPTION_KEY.test(row.key)) return { word: 'not_word', key: row.key };
    if (row.label !== undefined && typeof row.label !== 'string') {
        return { word: 'label', key: row.key };
    }
    return { key: row.key, label: typeof row.label === 'string' ? row.label : row.key };
}

/** The first key of an option row besides `key` and `label`, or undefined for a word or no row. */
function extraKey(item: unknown): string | undefined {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return undefined;
    return Object.keys(item).find((name) => !ROW_KEYS.has(name));
}

/**
 * A field's `options:` as the readers take it, the options that read in the file's order, and why
 * each other one does not. A value that is no list reads as absent.
 */
export function readOptions(value: unknown): {
    options: SchemaOption[] | undefined;
    problems: OptionProblem[];
} {
    if (!Array.isArray(value)) return { options: undefined, problems: [] };
    const options: SchemaOption[] = [];
    const problems: OptionProblem[] = [];
    const seen = new Set<string>();
    value.forEach((item: unknown, index) => {
        const read = optionOf(item);
        if (typeof read !== 'string' && 'word' in read) {
            problems.push({ index, ...read });
            return;
        }
        const key = typeof read === 'string' ? read : read.key;
        if (seen.has(key)) {
            problems.push({ index, word: 'taken', key });
            return;
        }
        seen.add(key);
        options.push(read);
        const extra = extraKey(item);
        if (extra !== undefined) problems.push({ index, word: 'extra', key, extra });
    });
    return { options, problems };
}

/** One field read, or null when it is not a map naming a field and a type, or its `fields` fail. */
function fieldOf(item: unknown): SchemaField | null {
    const named = namedFieldShape.safeParse(item);
    if (!named.success) return null;
    const held = item as Record<string, unknown>;
    let nested: SchemaField[] | undefined;
    if (held.fields !== undefined) {
        const fields = fieldsOf(held.fields);
        if (fields === undefined) return null;
        nested = fields;
    }
    return compact<SchemaField>({
        field: named.data.field,
        type: named.data.type,
        label: optionalTextShape.parse(held.label),
        options: readOptions(held.options).options,
        foreign_key: foreignKeyShape.parse(held.foreign_key),
        primary_key: primaryKeyShape.parse(held.primary_key),
        display: displayShape.parse(held.display),
        required: requiredShape.parse(held.required),
        help: optionalTextShape.parse(held.help),
        section: filledTextShape.parse(held.section),
        when: whenShape.parse(held.when),
        open: flagShape.parse(held.open),
        map: flagShape.parse(held.map),
        fields: nested,
        filter: flagShape.parse(held.filter)
    });
}

/** A list of fields read whole, or undefined when the value is no list or any one field fails. */
export function fieldsOf(value: unknown): SchemaField[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const fields: SchemaField[] = [];
    for (const item of value) {
        const field = fieldOf(item);
        if (field === null) return undefined;
        fields.push(field);
    }
    return fields;
}

/**
 * The schema a file's primary key is read by (`primaryKeyOf`, `keyFaultOf`): undefined when the
 * file carries no `schema:` key, the fields when it reads whole, and null when it carries one that
 * does not read, which gives the file no primary key. A file is keyed alike by every reader and
 * every writer.
 */
export function keyedSchema(value: unknown): SchemaField[] | null | undefined {
    return value === undefined ? undefined : (fieldsOf(value) ?? null);
}
