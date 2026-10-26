// Layer 1, data. The values of a collection entry that name a record, found by the file's own
// `schema:`. A field whose `foreign_key:` names a collection or the projects holds the primary key
// of such a record, one key or a list of them, and so does a field of a `records` field at any
// depth; a vocabulary list names no record. The merge of the hubs of a workspace (hubs/merge.ts)
// walks an entry here to resolve each such key in the entry's own hub, then in the others, naming
// each target by the registry its collection carries, and a write (server/edit/writes/entries.ts
// and manifest.ts) walks the fields it is given to take the hub's name off a value that names a
// record by its id, so both walk the schema the same way and neither names a field of any
// collection.

import type { KeyPicked, SchemaField } from '../../model/index.ts';
import { isMap } from '../../helpers/guards.ts';
import { VOCAB_PREFIX } from '../../helpers/hub-names.ts';

/**
 * What a walk does with one text value: the value, the record sources its field names, whether the
 * schema holds it to their keys, and the name of the field. A `select` and an item of a `tags` list
 * are held to them; a `text` field is only completed from them, so its value may be any words.
 */
export type Reach = (
    value: string,
    sources: readonly string[],
    held: boolean,
    field: string
) => string;

/** The name a walk gives a `foreign_key:` target as a record source. */
export type SourceNames = (target: string) => string;

/** A walk that names each target by itself. */
const ownNames: SourceNames = (target) => target;

/**
 * The record sources of a field's `foreign_key:`, for a record holding the values `record`, each
 * target that is no vocabulary list named by `names`.
 */
function sourcesOf(
    field: SchemaField,
    record: Record<string, unknown>,
    names: SourceNames
): string[] {
    const keys: string[] | KeyPicked | undefined = field.foreign_key;
    if (keys === undefined) return [];
    const word = Array.isArray(keys) ? undefined : record[keys.field];
    const targets = Array.isArray(keys)
        ? keys
        : [typeof word === 'string' ? keys.sources[word] : undefined];
    return targets
        .filter((one): one is string => one !== undefined && !one.startsWith(VOCAB_PREFIX))
        .map(names);
}

/** One value of a field, or each string of a list value, passed through `reach`. */
function reached(value: unknown, sources: string[], field: SchemaField, reach: Reach): unknown {
    if (typeof value === 'string') {
        return reach(value, sources, field.type === 'select', field.field);
    }
    if (!Array.isArray(value)) return value;
    const held = field.type === 'select' || field.type === 'tags';
    const items: unknown[] = value;
    return items.map((one) =>
        typeof one === 'string' ? reach(one, sources, held, field.field) : one
    );
}

/** The record of a `records` field, each of its fields passed through the walk. */
function recordOf(
    value: unknown,
    fields: SchemaField[],
    reach: Reach,
    names: SourceNames
): unknown {
    return isMap(value) ? throughSchema(fields, value, reach, names) : value;
}

/**
 * The fields of an entry with every value that names a record passed through `reach`, which answers
 * the value to keep, each target named by `names` (by itself when none is given). Fields the schema
 * does not name, and values that are not text, are returned as they are.
 */
export function throughSchema(
    schema: readonly SchemaField[],
    fields: Record<string, unknown>,
    reach: Reach,
    names: SourceNames = ownNames
): Record<string, unknown> {
    const out = { ...fields };
    for (const field of schema) {
        if (!Object.hasOwn(fields, field.field)) continue;
        const value = fields[field.field];
        if (field.type === 'records' && field.fields !== undefined) {
            const inner = field.fields;
            const walk = (one: unknown): unknown => recordOf(one, inner, reach, names);
            if (field.map === true && isMap(value)) {
                out[field.field] = Object.fromEntries(
                    Object.entries(value).map(([name, one]) => [name, walk(one)])
                );
            } else if (Array.isArray(value)) {
                out[field.field] = value.map(walk);
            }
            continue;
        }
        const sources = sourcesOf(field, fields, names);
        if (sources.length > 0) out[field.field] = reached(value, sources, field, reach);
    }
    return out;
}
