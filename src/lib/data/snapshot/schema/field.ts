// Layer 1, data. A `schema:` field as a hub file writes it, read into the SchemaField the snapshot
// and the apps API carry: the name and the type, and beside them the keys a field may hold (its
// label, options, the sources its values come from, the condition under which it is allowed, the
// condition under which it is required, whether it takes keys it does not declare, and the fields
// of a list of records). The same reader reads the fields nested in a `records` field, so a schema
// is one vocabulary at every depth.
//
// A key of the wrong kind reads as absent; a field that names no `field` and `type`, or a nested
// `fields:` that is no list of such fields, costs the whole schema, because half a schema would
// draw half a record in a field order the file did not write.

import { z } from 'zod';
import type { SchemaField } from '../../model/index.ts';
import { optionalItemsShape, optionalTextShape } from '../../shapes/shapes.ts';
import { compact } from '../compact.ts';

/** One field of a `schema:` as the check reads it: a map naming a field and a type. */
const namedFieldShape = z.object({ field: z.string(), type: z.string() });

/** A condition: each key a field of the record, each value a word or a list of words. */
const whenMapShape = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

/** `when:` as a file writes it, and absent for any other value. */
const whenShape = whenMapShape.optional().catch(undefined);

/** `from:` as a file writes it: one source, a list of sources, or `{ field, sources }`. */
const fromShape = z
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
        options: optionalItemsShape.parse(held.options),
        from: fromShape.parse(held.from),
        required: requiredShape.parse(held.required),
        help: optionalTextShape.parse(held.help),
        when: whenShape.parse(held.when),
        open: flagShape.parse(held.open),
        fields: nested
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
