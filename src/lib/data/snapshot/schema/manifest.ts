// Layer 1, data. The `manifest_schema` of config/schemas/manifest-schema.yml as the JSON Schema of
// a project.yml, and the `side_project_schema` of config/schemas/side-project-schema.yml as the
// JSON Schema of a side project's manifest. The schema is the project.yml edit form as data, so
// each widget is read as the type of value it writes: a `select` and a `chips` field are held to
// the keys of their `from` sources, `readonly` and `keymap` fields hold whatever the file has, and
// a dotted name (`status.chips`) is a key inside a map the file holds under its first part. A map
// such as `followup` may also be written as one line of text, and is then not looked into. The
// side project's rows use the widget words of the research rows for the keys the two manifests
// share, so both kinds go through one translation and a key means one thing in both.

import { z } from 'zod';
import type { SchemaField } from '../../model/index.ts';
import { filledTextShape, optionalItemsShape, readAs } from '../../shapes/shapes.ts';
import { fieldsOf } from './field.ts';
import type { JsonSchema } from './json.ts';
import { fieldSchema, type Context } from './record.ts';

/** One row of the schema's `fields:` map, each part absent unless it is the kind it should be. */
const rowShape = z.object({
    label: filledTextShape,
    type: filledTextShape,
    help: filledTextShape,
    from: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .catch(undefined),
    options: optionalItemsShape
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
            ...(from === undefined ? {} : { from })
        };
    });
}

/**
 * The fields of the side-project schema as schema fields, each read by the widget words of the
 * manifest schema, or undefined when the schema does not read as a list of fields.
 */
function sideFields(schema: unknown): SchemaField[] | undefined {
    return fieldsOf(schema)?.map((field) => ({ ...field, type: recordType(field.type) }));
}

/**
 * The JSON Schema of a manifest from its fields: one property for each top-level name, a map
 * property for each prefix of a dotted name, the fields marked `required` required, and no other
 * key allowed.
 */
function manifestOf(fields: SchemaField[], ctx: Context): JsonSchema {
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
            additionalProperties: false
        };
    }
    const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
    if (required.length > 0) schema.required = required;
    return schema;
}

/** The JSON Schema of a project.yml, from the manifest schema's `fields:` map. */
export function manifestSchema(schema: unknown, ctx: Context): JsonSchema {
    return manifestOf(manifestFields(schema), ctx);
}

/** The JSON Schema of a side project's manifest, or null when the schema reads as no fields. */
export function sideSchema(schema: unknown, ctx: Context): JsonSchema | null {
    const fields = sideFields(schema);
    return fields === undefined ? null : manifestOf(fields, ctx);
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
