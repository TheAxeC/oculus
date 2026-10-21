// Layer 1, data. A list of schema fields as a draft-07 JSON Schema: the `schema:` blocks of the
// hub's files, the `fields:` of a `records` field and the new schema files all go through here, so
// a type means one thing wherever it is written.
//
// Each type accepts what its reader accepts. A `text` field takes a text and the integer a year is
// written as, a `date` a day written YYYY-MM-DD, a `checkbox` a flag, `tags` a list, `metalist` a
// list of label and value maps, `raw` anything but a `followup` field, which takes the list of
// notes oculus writes there. Every field also accepts null, which is what a bare `key:` reads as. A
// `select` takes the keys of its `options` and of its `from` sources, and any word when it has
// neither, a `tags` field each of them as an item; a `text` takes its `from` keys as suggestions
// only. A record allows no key it does not declare unless it is `open`.
//
// A `records` field holds a list of records, one record, or with `map: true` a map from a name to
// one record (the groups of a deck). A condition (`when`, `required: { when }`) becomes an `if`
// with a `then` or an `else`; the schema carries the condition in `x-when` or `x-required-when` so
// a finding can name it.

import { ISO_DATE } from '../../helpers/dates.ts';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { withoutPath } from '../../helpers/files/yaml/collection-text.ts';
import {
    optionKeys,
    optionLabel,
    type FromPicked,
    type SchemaField,
    type When
} from '../../model/index.ts';
import { TEXT_TYPES, type JsonSchema } from './json.ts';

/**
 * The keys a source offers, undefined for a source no list answers, and null for a source whose
 * file did not parse, whose keys are not known: a value that names one is not held to a list.
 */
export type Lists = (source: string) => string[] | null | undefined;

/**
 * Something wrong with the schema itself: a `from` that names no list, a `when` on no field, a
 * `map` on a field that is no `records` field.
 */
export type SchemaProblem = {
    key: string;
    word: 'from' | 'when' | 'map' | 'group_missing' | 'group_unknown';
    args: string[];
};

/** The sentence of a schema problem, in the catalog's words. */
export function problemText(catalog: TextCatalog, problem: SchemaProblem): string {
    switch (problem.word) {
        case 'from':
            return findingText(catalog, 'findings.schema.bad_from', ...problem.args);
        case 'when':
            return findingText(catalog, 'findings.schema.bad_when', ...problem.args);
        case 'map':
            return findingText(catalog, 'findings.schema.bad_map', ...problem.args);
        case 'group_missing':
            return findingText(catalog, 'findings.schema.group_missing', ...problem.args);
        case 'group_unknown':
            return findingText(catalog, 'findings.schema.group_unknown', ...problem.args);
    }
}

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
    properties: {
        label: { type: TEXT_TYPES, description: 'The name of the fact the row holds.' },
        value: { type: TEXT_TYPES, description: 'The fact itself, as the card shows it.' }
    },
    additionalProperties: false
};

/**
 * An enum of the words a field takes, with the label of each word its options give it as the
 * editor's completion text when any option is a `{ key, label }` row.
 */
function wordsEnum(field: SchemaField, words: unknown[]): JsonSchema {
    const schema: JsonSchema = { enum: words };
    const rows = (field.options ?? []).some((one) => typeof one !== 'string');
    if (rows) {
        schema.enumDescriptions = words.map((word) =>
            typeof word === 'string' ? optionLabel(field, word) : ''
        );
    }
    return schema;
}

/** The words of a tags field's enum, each once, or null alone when it has none. */
function tagWords(words: string[]): (string | null)[] {
    return words.length > 0 ? [...new Set(words)] : [null];
}

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
        case 'tags': {
            // A list of keys is exactly a list; free words may be written as one text as well. A
            // source with no key yet leaves null alone, which no item equals, since ajv takes no
            // empty enum. A field with options and no source takes the options' keys alone.
            const own = optionKeys(field);
            if (from === undefined && own.length > 0) {
                return { type: ['array', 'null'], items: wordsEnum(field, own) };
            }
            return from === undefined || from.unread
                ? { type: ['array', 'string', 'null'], items: { type: ['string', 'number'] } }
                : {
                      type: ['array', 'null'],
                      items: {
                          ...wordsEnum(field, tagWords([...own, ...from.words])),
                          'x-from': from.sources.join(' ')
                      }
                  };
        }
        case 'select': {
            // A select with neither options nor a source names no words, so it takes any word, as
            // the write path does (server/edit/writes/entries.ts).
            const words = [...optionKeys(field), ...(from?.words ?? [])];
            const open = from === undefined && words.length === 0;
            if (open || isPicked(field.from) || from?.unread === true) {
                return { type: ['string', 'null'] };
            }
            const schema = wordsEnum(field, [...new Set(words), null]);
            if (from !== undefined) schema['x-from'] = from.sources.join(' ');
            return schema;
        }
        case 'records': {
            const record = recordSchema(field.fields ?? [], {
                ...ctx,
                at: `${ctx.at}${field.field}.`
            });
            if (field.open === true) record.additionalProperties = true;
            // A map holds a record under each name it has.
            if (field.map === true) {
                return { type: ['object', 'null'], additionalProperties: record };
            }
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

/**
 * The `followup:` field oculus writes into a manifest and into every collection entry: a list of
 * notes, each a map of what to do and the day before which it stays off the Focus board. Its
 * widget (`keymap` in the manifest schema) and its written field (schema/hub.ts) are of the type
 * `raw`, which takes anything, so the field is held to its list by its name.
 */
const FOLLOWUP = 'followup';

/** The value of a `followup:` field: a list of `{ do, after }` notes, each with its `do`. */
const FOLLOWUP_NOTES: JsonSchema = {
    type: ['array', 'null'],
    items: {
        type: 'object',
        properties: {
            do: { type: TEXT_TYPES },
            after: { type: ['string', 'null'], pattern: ISO_DATE.source }
        },
        required: ['do'],
        additionalProperties: false
    }
};

/** One field's schema: its value, the label as `title` and the help line as `description`. */
export function fieldSchema(field: SchemaField, ctx: Context): JsonSchema {
    const notes = field.field === FOLLOWUP && field.type === 'raw';
    const schema = notes ? structuredClone(FOLLOWUP_NOTES) : valueSchema(field, ctx);
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
        if (field.map === true && field.type !== 'records') {
            ctx.problems.push({ key: `${ctx.at}${field.field}`, word: 'map', args: [field.field] });
        }
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
            description:
                'The allowed values of a select or a tags field, each a word or a { key, label } row.'
        },
        from: {
            anyOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
                {
                    type: 'object',
                    properties: {
                        field: {
                            type: 'string',
                            description: 'The field of the record whose value picks the source.'
                        },
                        sources: {
                            type: 'object',
                            description: 'The source each value of that field picks.'
                        }
                    },
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
                    properties: {
                        when: {
                            type: 'object',
                            description: 'The condition under which the field is required.'
                        }
                    },
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
        map: {
            type: 'boolean',
            description: 'Whether a records field holds a map from a name to one record.'
        },
        fields: {
            type: 'array',
            items: { $ref: '#/definitions/field' },
            description: 'The fields of each record of a records field.'
        },
        filter: {
            type: 'boolean',
            description:
                'Whether the collection view draws a filter of the field beside its search.'
        }
    },
    required: ['field', 'type'],
    additionalProperties: false
};

/** The schema of a whole `schema:` block: a list of fields, defined at the root as `field`. */
export const SCHEMA_BLOCK: JsonSchema = {
    type: 'array',
    items: { $ref: '#/definitions/field' },
    description:
        "The fields the file's records may hold, each with its type, its words and the values it takes, which the form draws and the editor checks."
};

/** The definitions a file schema holding a `schema:` block carries at its root. */
export const SCHEMA_DEFINITIONS: Record<string, JsonSchema> = { field: SCHEMA_FIELD };
