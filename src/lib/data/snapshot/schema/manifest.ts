// Layer 1, data. The `manifest_schema` of config/schemas/manifest-schema.yml as the JSON Schema of
// a project.yml. The schema is the project.yml edit form as data, so each widget is read as the
// type of value it writes: a `select` and a `chips` field are held to the keys of their `from`
// sources and their `options`, `readonly` and `keymap` fields hold whatever the file has, and a
// dotted name (`status.chips`) is a key inside a map the file holds under its first part. A map
// such as `followup` may also be written as one line of text, and is then not looked into. Each
// such map is described by its help line in the file's top-level `groups:`.

import { z } from 'zod';
import type { SchemaField } from '../../model/index.ts';
import { filledTextShape, optionalItemsShape, readAs } from '../../shapes/shapes.ts';
import type { JsonSchema } from './json.ts';
import { fieldSchema, type Context, type SchemaProblem } from './record.ts';

/** One row of the schema's `fields:` map, each part absent unless it is the kind it should be. */
const rowShape = z.object({
    label: filledTextShape,
    type: filledTextShape,
    help: filledTextShape,
    from: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .catch(undefined),
    options: optionalItemsShape,
    required: z.literal(true).optional().catch(undefined)
});

/** The `fields:` map of the schema, a row for each name. */
const fieldsShape = z.object({ fields: z.record(z.string(), rowShape) });

/** The record type of the hub's schemas each widget of the form is read as. */
const WIDGET_TYPES: Record<string, string> = {
    text: 'text',
    textarea: 'textarea',
    lines: 'tags',
    select: 'select',
    chips: 'tags',
    tags: 'tags',
    date: 'date',
    checkbox: 'checkbox',
    readonly: 'raw',
    keymap: 'raw'
};

/** A map the file may also write as a single line, or leave empty. */
const CONTAINER_TYPES = ['object', 'string', 'array', 'null'];

/** The record type a widget word is read as, and `text` for a word the form does not know. */
function recordType(widget: string): string {
    return WIDGET_TYPES[widget] ?? 'text';
}

/** The fields of the manifest schema as schema fields, with a dotted name left whole. */
export function manifestFields(schema: unknown): SchemaField[] {
    const parsed = readAs(fieldsShape, schema);
    if (parsed === null) return [];
    return Object.entries(parsed.fields).map(([name, row]) => {
        const from = row.from === undefined ? undefined : [row.from].flat();
        return {
            field: name,
            type: recordType(row.type ?? 'text'),
            ...(row.label === undefined ? {} : { label: row.label }),
            ...(row.help === undefined ? {} : { help: row.help }),
            ...(row.options === undefined ? {} : { options: row.options }),
            ...(row.required === undefined ? {} : { required: true }),
            ...(from === undefined ? {} : { from })
        };
    });
}

/** The help lines of `groups`, the lines that are no text left out. */
function groupLines(groups: unknown): Record<string, string> {
    const read = readAs(z.record(z.string(), z.unknown()), groups) ?? {};
    return Object.fromEntries(
        Object.entries(read).filter(
            (entry): entry is [string, string] =>
                typeof entry[1] === 'string' && entry[1].trim() !== ''
        )
    );
}

/** The maps the dotted names of the fields lie in, each once, in the order met. */
function prefixesOf(fields: SchemaField[]): string[] {
    const found = fields
        .filter((field) => field.field.includes('.'))
        .map((field) => field.field.slice(0, field.field.indexOf('.')));
    return [...new Set(found)];
}

/**
 * The JSON Schema of a manifest from its fields: one property for each top-level name, a map
 * property for each prefix of a dotted name, described by its help line of `groups`, the fields
 * marked `required` required, and no other key allowed.
 */
function manifestOf(
    fields: SchemaField[],
    ctx: Context,
    lines: Record<string, string>
): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    const inner = new Map<string, Record<string, JsonSchema>>();
    for (const field of fields) {
        const dot = field.field.indexOf('.');
        if (dot < 0) {
            properties[field.field] = fieldSchema(field, ctx);
            if (field.required === true) required.push(field.field);
            continue;
        }
        const prefix = field.field.slice(0, dot);
        const held = inner.get(prefix) ?? {};
        held[field.field.slice(dot + 1)] = fieldSchema(field, ctx);
        inner.set(prefix, held);
    }
    for (const [prefix, held] of inner) {
        properties[prefix] = {
            type: CONTAINER_TYPES,
            properties: held,
            additionalProperties: false,
            ...(Object.hasOwn(lines, prefix) ? { description: lines[prefix] } : {})
        };
    }
    const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
    if (required.length > 0) schema.required = required;
    return schema;
}

/**
 * The JSON Schema of a project.yml, from the manifest schema's `fields:` map and the help lines of
 * the manifest schema file's `groups:`.
 */
export function manifestSchema(schema: unknown, ctx: Context, groups?: unknown): JsonSchema {
    return manifestOf(manifestFields(schema), ctx, groupLines(groups));
}

/**
 * What is wrong with the help lines of the maps the dotted fields lie in: a map with no line, an
 * empty one or one that is no text, and a line for a name no dotted field lies under.
 */
export function manifestGroupProblems(schema: unknown, groups: unknown): SchemaProblem[] {
    const prefixes = prefixesOf(manifestFields(schema));
    const lines = groupLines(groups);
    const written = Object.keys(readAs(z.record(z.string(), z.unknown()), groups) ?? {});
    const problems: SchemaProblem[] = prefixes
        .filter((prefix) => !Object.hasOwn(lines, prefix))
        .map((prefix) => ({ key: `groups.${prefix}`, word: 'group_missing', args: [prefix] }));
    for (const name of written) {
        if (!prefixes.includes(name)) {
            problems.push({ key: `groups.${name}`, word: 'group_unknown', args: [name] });
        }
    }
    return problems;
}

/**
 * The manifest fields whose values are held to the keys of their `from` sources, every one of
 * which was read: the generated schema reports a value of the wrong shape in them.
 */
export function listedFields(schema: unknown, unread: ReadonlySet<string>): Set<string> {
    const listed = manifestFields(schema).filter(
        (field) =>
            Array.isArray(field.from) &&
            field.from.length > 0 &&
            field.from.every((source) => !unread.has(source))
    );
    return new Set(listed.map((field) => field.field));
}
