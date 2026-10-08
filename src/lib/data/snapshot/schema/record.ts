// Layer 1, data. A list of schema fields as a draft-07 JSON Schema: the `schema:` blocks of the
// hub's files, the `fields:` of a `records` field and the new schema files all go through here, so
// a type means one thing wherever it is written.
//
// Each type accepts what its reader accepts. A `text` field takes a text and the integer a year is
// written as, a `date` a day written YYYY-MM-DD, a `checkbox` a flag, `tags` a list, `metalist` a
// list of label and value maps, `raw` anything. Every field also accepts null, which is what a bare
// `key:` reads as. A `select` takes its `options` and the keys of its `from` sources; a `text`
// takes its `from` keys as suggestions only. A record allows no key it does not declare unless it
// is `open`.
//
// A condition (`when`, `required: { when }`) becomes an `if` with a `then` or an `else`; the schema
// carries the condition in `x-when` or `x-required-when` so a finding can name it.

import { ISO_DATE } from '../../helpers/dates.ts';
import type { FromPicked, SchemaField, When } from '../../model/index.ts';
import { TEXT_TYPES, type JsonSchema } from './json.ts';

/**
 * The keys a source offers, undefined for a source no list answers, and null for a source whose
 * file did not parse, whose keys are not known: a value that names one is not held to a list.
 */
export type Lists = (source: string) => string[] | null | undefined;

/** Something wrong with the schema itself: a `from` that names no list, a `when` on no field. */
export type SchemaProblem = { key: string; word: 'from' | 'when'; args: string[] };

/** What a conversion needs: the lists `from` reads, and where to report what is wrong. */
export type Context = { lists: Lists; problems: SchemaProblem[]; at: string };

/** The type words of the hub's schemas. A word outside them is read as `text`. */
const FIELD_TYPES = [
    'text',
    'textarea',
    'date',
    'checkbox',
    'select',
    'tags',
    'metalist',
    'raw',
    'records'
];

/** Whether `from` is the map form, the source another field of the record picks. */
function isPicked(from: SchemaField['from']): from is FromPicked {
    return from !== undefined && !Array.isArray(from);
}

/**
 * The keys of a field's listed sources, and the sources that no list answers. `unread` is true
 * when a source's file did not parse, so the field has no list to be held to.
 */
function listed(
    field: SchemaField,
    ctx: Context
): { words: string[]; sources: string[]; unread: boolean } | undefined {
    if (field.from === undefined || isPicked(field.from)) return undefined;
    const words: string[] = [];
    let unread = false;
    for (const source of field.from) {
        const keys = ctx.lists(source);
        if (keys === null) {
            unread = true;
            continue;
        }
        if (keys === undefined) {
            ctx.problems.push({
                key: `${ctx.at}${field.field}`,
                word: 'from',
                args: [field.field, source]
            });
            continue;
        }
        words.push(...keys);
    }
    return { words: [...new Set(words)], sources: field.from, unread };
}

/** The label and value of a `metalist` row. */
const METALIST_ROW: JsonSchema = {
    type: 'object',
    properties: { label: { type: TEXT_TYPES }, value: { type: TEXT_TYPES } },
    additionalProperties: false
};

/** The schema of one field's value, without its title and description. */
function valueSchema(field: SchemaField, ctx: Context): JsonSchema {
    const from = listed(field, ctx);
    switch (field.type) {
        case 'date':
            return { type: ['string', 'null'], pattern: ISO_DATE.source };
        case 'checkbox':
            return { type: ['boolean', 'null'] };
        case 'raw':
            return {};
        case 'metalist':
            return { type: ['array', 'null'], items: METALIST_ROW };
        case 'tags':
            // A list of keys is exactly a list; free words may be written as one text as well. A
            // source with no key yet leaves null alone, which no item equals, since ajv takes no
            // empty enum.
            return from === undefined || from.unread
                ? { type: ['array', 'string', 'null'], items: { type: ['string', 'number'] } }
                : {
                      type: ['array', 'null'],
                      items: {
                          enum: from.words.length > 0 ? from.words : [null],
                          'x-from': from.sources.join(' ')
                      }
                  };
        case 'select': {
            const words = [...(field.options ?? []), ...(from?.words ?? [])];
            if (isPicked(field.from) || from?.unread === true) return { type: ['string', 'null'] };
            const schema: JsonSchema = { enum: [...new Set(words), null] };
            if (from !== undefined) schema['x-from'] = from.sources.join(' ');
            return schema;
        }
        case 'records': {
            const record = recordSchema(field.fields ?? [], {
                ...ctx,
                at: `${ctx.at}${field.field}.`
            });
            if (field.open === true) record.additionalProperties = true;
            // The list form is checked by `items`, the one-record form by the record's keywords.
            return { ...record, type: ['array', 'object', 'null'], items: record };
        }
        default: {
            const schema: JsonSchema = { type: TEXT_TYPES };
            if (from !== undefined && from.words.length > 0) schema.examples = from.words;
            return schema;
        }
    }
}

/** One field's schema: its value, the label as `title` and the help line as `description`. */
export function fieldSchema(field: SchemaField, ctx: Context): JsonSchema {
    const schema = valueSchema(field, ctx);
    if (field.label !== undefined) schema.title = field.label;
    if (field.help !== undefined) schema.description = field.help;
    return schema;
}

/** The condition a `when` map states over the fields of one record. */
function condition(when: When, field: string, known: Set<string>, ctx: Context): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    for (const [name, value] of Object.entries(when)) {
        if (!known.has(name)) {
            ctx.problems.push({ key: `${ctx.at}${field}`, word: 'when', args: [field, name] });
        }
        properties[name] = { enum: Array.isArray(value) ? value : [value] };
    }
    return { properties, required: Object.keys(when) };
}

/** A condition without its `path` key, the part a record can state about its own fields. */
function withoutPath(when: When): When {
    return Object.fromEntries(Object.entries(when).filter(([name]) => name !== 'path'));
}

/**
 * The record schema of a list of fields. A field with a `when` is allowed only where it holds; a
 * field with `required: { when }` is required only where it holds; a field whose `from` is a
 * `{ field, sources }` map takes the keys of the source its picking field names.
 */
export function recordSchema(fields: SchemaField[], ctx: Context): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    const rules: JsonSchema[] = [];
    const known = new Set(fields.map((one) => one.field));
    for (const field of fields) {
        properties[field.field] = fieldSchema(field, ctx);
        if (field.required === true) required.push(field.field);
        if (typeof field.required === 'object') {
            rules.push({
                if: condition(withoutPath(field.required.when), field.field, known, ctx),
                then: { required: [field.field], 'x-required-when': field.required.when }
            });
        }
        if (field.when !== undefined) {
            const rest = withoutPath(field.when);
            if (Object.keys(rest).length > 0) {
                rules.push({
                    if: condition(rest, field.field, known, ctx),
                    else: {
                        properties: { [field.field]: { not: {}, 'x-when': rest } }
                    }
                });
            }
        }
        if (isPicked(field.from)) rules.push(...pickedRules(field, field.from, ctx));
    }
    const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
    if (required.length > 0) schema.required = required;
    if (rules.length > 0) schema.allOf = rules;
    return schema;
}

/** The rules that hold a field to the keys of the source its picking field names. */
function pickedRules(field: SchemaField, from: FromPicked, ctx: Context): JsonSchema[] {
    const rules: JsonSchema[] = [];
    for (const [word, source] of Object.entries(from.sources)) {
        const keys = ctx.lists(source);
        if (keys === null) continue;
        if (keys === undefined) {
            ctx.problems.push({
                key: `${ctx.at}${field.field}`,
                word: 'from',
                args: [field.field, source]
            });
            continue;
        }
        rules.push({
            if: { properties: { [from.field]: { const: word } }, required: [from.field] },
            then: {
                properties: { [field.field]: { enum: [...keys, null], 'x-from': source } }
            }
        });
    }
    return rules;
}

/** The schema of one field of a `schema:` block, which names every key a field may hold. */
const SCHEMA_FIELD: JsonSchema = {
    type: 'object',
    properties: {
        field: { type: 'string', description: 'The key the field is written under.' },
        type: {
            enum: FIELD_TYPES,
            description: 'What the field holds: how the form draws it and what the file may write.'
        },
        label: { type: 'string', description: 'The words the form draws over the field.' },
        options: {
            type: 'array',
            items: { type: 'string' },
            description: 'The allowed values of a select.'
        },
        from: {
            anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
                {
                    type: 'object',
                    properties: { field: { type: 'string' }, sources: { type: 'object' } },
                    required: ['field', 'sources'],
                    additionalProperties: false
                }
            ],
            description: 'Where the field takes its keys from: a registry, projects or vocab.<key>.'
        },
        required: {
            anyOf: [
                { type: 'boolean' },
                {
                    type: 'object',
                    properties: { when: { type: 'object' } },
                    required: ['when'],
                    additionalProperties: false
                }
            ],
            description: 'Whether the field must be present, always or while its condition holds.'
        },
        help: { type: 'string', description: 'The field in one plain sentence.' },
        when: {
            type: 'object',
            description: 'The condition under which the field is allowed in a record.'
        },
        open: { type: 'boolean', description: 'Whether the field takes keys it does not declare.' },
        fields: {
            type: 'array',
            items: { $ref: '#/definitions/field' },
            description: 'The fields of each record of a records field.'
        }
    },
    required: ['field', 'type'],
    additionalProperties: false
};

/** The schema of a whole `schema:` block: a list of fields, defined at the root as `field`. */
export const SCHEMA_BLOCK: JsonSchema = { type: 'array', items: { $ref: '#/definitions/field' } };

/** The definitions a file schema holding a `schema:` block carries at its root. */
export const SCHEMA_DEFINITIONS: Record<string, JsonSchema> = { field: SCHEMA_FIELD };
