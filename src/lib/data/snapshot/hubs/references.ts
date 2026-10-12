// Layer 1, data. The values of a collection entry that name a record of the hub, found by the
// file's own `schema:`. A field whose `from:` names a registry or the projects holds the key of
// such a record, one key or a list of them, and so does a field of a `records` field at any depth.
// The merge of several hubs (hubs/merge.ts) puts the hub's key in front of those values, and a
// write to a hub other than the primary (server/edit/writes/entries.ts) takes it off again, so both
// walk the schema the same way and neither names a field of any collection.

import type { FromPicked, SchemaField } from '../../model/index.ts';
import { isMap } from '../../helpers/guards.ts';
import { REGISTRIES } from '../schema/lists.ts';

/** The `from:` sources whose keys are records of the hub: the eight registries and the projects. */
const RECORD_SOURCES: readonly string[] = [...REGISTRIES, 'projects'];

/**
 * What a walk does with one text value: the value, the record sources its field names and whether
 * the schema holds it to their keys. A `select` and an item of a `tags` list are held to them; a
 * `text` field is only completed from them, so its value may be any words.
 */
export type Reach = (value: string, sources: readonly string[], held: boolean) => string;

/** The record sources of a field's `from:`, for a record holding the values `record`. */
function sourcesOf(field: SchemaField, record: Record<string, unknown>): string[] {
    const from: string[] | FromPicked | undefined = field.from;
    if (from === undefined) return [];
    if (Array.isArray(from)) return from.filter((one) => RECORD_SOURCES.includes(one));
    const word = record[from.field];
    const source = typeof word === 'string' ? from.sources[word] : undefined;
    return source !== undefined && RECORD_SOURCES.includes(source) ? [source] : [];
}

/** One value of a field, or each string of a list value, passed through `reach`. */
function reached(value: unknown, sources: string[], field: SchemaField, reach: Reach): unknown {
    if (typeof value === 'string') return reach(value, sources, field.type === 'select');
    if (!Array.isArray(value)) return value;
    const held = field.type === 'select' || field.type === 'tags';
    const items: unknown[] = value;
    return items.map((one) => (typeof one === 'string' ? reach(one, sources, held) : one));
}

/** The record of a `records` field, each of its fields passed through the walk. */
function recordOf(value: unknown, fields: SchemaField[], reach: Reach): unknown {
    return isMap(value) ? throughSchema(fields, value, reach) : value;
}

/**
 * The fields of an entry with every value that names a record passed through `reach`, which answers
 * the value to keep. Fields the schema does not name, and values that are not text, are returned as
 * they are.
 */
export function throughSchema(
    schema: readonly SchemaField[],
    fields: Record<string, unknown>,
    reach: Reach
): Record<string, unknown> {
    const out = { ...fields };
    for (const field of schema) {
        if (!Object.hasOwn(fields, field.field)) continue;
        const value = fields[field.field];
        if (field.type === 'records' && field.fields !== undefined) {
            const inner = field.fields;
            if (field.map === true && isMap(value)) {
                out[field.field] = Object.fromEntries(
                    Object.entries(value).map(([name, one]) => [name, recordOf(one, inner, reach)])
                );
            } else if (Array.isArray(value)) {
                out[field.field] = value.map((one) => recordOf(one, inner, reach));
            }
            continue;
        }
        const sources = sourcesOf(field, fields);
        if (sources.length > 0) out[field.field] = reached(value, sources, field, reach);
    }
    return out;
}
