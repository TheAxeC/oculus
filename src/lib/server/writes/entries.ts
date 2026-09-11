// Layer 2, server. The collection half of the write path: which file a collection key names, how an
// entry is addressed inside it, and the four edits one entry takes.
//
// An entry is addressed by its identity value, not by its id. funding.yml's schema opens with
// `title` while three of its entries carry a `key`, and the id the reader made is that key, so
// identityOf resolves the two rather than assuming they agree.
//
// `saved()` lives here because both of the modules that put an edit on disk are here or import this
// one: writes/subtasks.ts reads a collection through readCollection, so it takes the writer with it.
//
// server/writes.ts is the route and re-exports the public half of this file.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../../data/guards.ts';
import { fieldNames } from '../../data/validate.ts';
import {
    appendEntry,
    deleteEntry,
    renderEntry,
    reorderEntries,
    setEntryFields
} from '../entry-edit.ts';
import { asFieldValue } from '../yaml-edit.ts';
import type { EditResult, FieldValue, Refusal } from '../yaml-edit.ts';
import type { PortfolioConfig } from '../../data/model.ts';
import type { WriteOutcome } from '../writes.ts';

/** Registries whose entry key is not the first field of their collection schema. */
const REGISTRY_IDENTITY_FIELDS: Record<string, string> = { venues: 'id' };

/** One edit put on disk the way writeManifest does it: only when the edit changed something. */
export function saved(file: string, source: string, edit: EditResult): WriteOutcome {
    if (edit.changed.length > 0 && edit.text !== source) writeFileSync(file, edit.text, 'utf8');
    return { found: true, changed: edit.changed, refused: edit.refused };
}

/** The file one collection key names, or null when sources.yml does not name it inside the hub. */
export function collectionFile(hub: string, config: PortfolioConfig, key: string): string | null {
    const named = config.collections.find((one) => one.key === key)?.file;
    if (named === undefined) return null;
    const path = resolve(join(hub, named));
    return path.startsWith(resolve(hub) + sep) ? path : null;
}

/** The field an entry is found by: the file's own schema's first field, `title` when it has none. */
export function identityField(schema: unknown): string {
    const names = fieldNames(schema);
    return names.length > 0 ? names[0] : 'title';
}

/** The fields the collection schema declares as metalists. */
function metalistFields(schema: unknown): Set<string> {
    const fields = new Set<string>();
    if (!Array.isArray(schema)) return fields;
    for (const item of schema) {
        if (!isMap(item) || item.type !== 'metalist' || typeof item.field !== 'string') continue;
        fields.add(item.field);
    }
    return fields;
}

/** Empty metalists mean removal, including when the current YAML value is already `[]`. */
function normaliseMetalists(
    schema: unknown,
    fields: Record<string, unknown>
): Record<string, unknown> {
    const metalists = metalistFields(schema);
    return Object.fromEntries(
        Object.entries(fields).map(([field, value]) => [
            field,
            metalists.has(field) && Array.isArray(value) && value.length === 0 ? null : value
        ])
    );
}

/** The id the reader gives an entry, normalise.ts line 323: its `key`, or its `title` without one. */
function entryId(entry: Record<string, unknown>): string {
    const id = entry.id;
    if (typeof id === 'string' && id !== '') return id;
    const key = entry.key;
    if (typeof key === 'string' && key !== '') return key;
    return typeof entry.title === 'string' ? entry.title : '';
}

/** The entry list of a parsed collection file: `entries:`, or the first list of maps beside it. */
function listOf(data: Record<string, unknown>): { key: string; items: unknown[] } | null {
    if (Array.isArray(data.entries)) return { key: 'entries', items: data.entries };
    for (const [key, value] of Object.entries(data)) {
        if (key === 'schema' || !Array.isArray(value)) continue;
        if (value.length === 0 || isMap(value[0])) return { key, items: value };
    }
    return null;
}

/** One collection file read for a write: its text, its entry list and its identity field. */
export type Collection = {
    file: string;
    source: string;
    schema: unknown;
    list: string;
    items: Record<string, unknown>[];
    ident: string;
};

export function readCollection(
    hub: string,
    config: PortfolioConfig,
    key: string
): Collection | null {
    const file = collectionFile(hub, config, key);
    if (file === null) return null;
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return null;
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return null;
    }
    if (!isMap(data)) return null;
    const list = listOf(data);
    if (list === null) return null;
    return {
        file,
        source,
        schema: data.schema,
        list: list.key,
        items: list.items.filter(isMap),
        ident: identityField(data.schema)
    };
}

/**
 * The value the entry's identity field holds, which is what the text is addressed by. It is not the
 * id: funding.yml's schema opens with `title` while three of its entries carry a `key`, and the id
 * the reader made is that key, so the two are resolved here rather than assumed to agree.
 */
export function identityOf(collection: Collection, id: string): string | null {
    for (const item of collection.items) {
        if (entryId(item) !== id) continue;
        const held = item[collection.ident];
        if (typeof held !== 'string' && typeof held !== 'number') return null;
        return String(held);
    }
    return null;
}

/** Set fields of one collection entry, found by the id the reader gave it. */
export function writeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    const registryField = REGISTRY_IDENTITY_FIELDS[collection];
    if (registryField !== undefined && registryField in fields) {
        // The registry keys its entities by this field, so an edit may neither clear it nor move
        // the entry onto another entry's value: normalise would then keep one of the two.
        const own = held.items.find((one) => String(one[held.ident] ?? '') === value);
        const raw = fields[registryField];
        const next = typeof raw === 'string' ? raw.trim() : '';
        const current = String(own?.[registryField] ?? '').trim();
        if (next === '') {
            return {
                found: true,
                changed: [],
                refused: [
                    { field: registryField, reason: `an entry needs a non-empty ${registryField}` }
                ]
            };
        }
        if (
            next !== current &&
            held.items.some((one) => String(one[registryField] ?? '').trim() === next)
        ) {
            return {
                found: true,
                changed: [],
                refused: [
                    {
                        field: registryField,
                        reason: `an entry with that ${registryField} is already in the file`
                    }
                ]
            };
        }
    }
    return saved(
        held.file,
        held.source,
        setEntryFields(held.source, held.ident, value, normaliseMetalists(held.schema, fields))
    );
}

/**
 * Put one collection's entries in the order the reader dragged them into. The order is the identity
 * values, not the ids: it is what addresses an entry in the file, and it is what the card carries.
 */
export function reorderCollection(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    order: string[]
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    return saved(held.file, held.source, reorderEntries(held.source, held.ident, order));
}

/** Take one entry out of its collection file, found by the id the reader gave it. */
export function removeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    return saved(held.file, held.source, deleteEntry(held.source, held.ident, value));
}

/** Add one entry to a collection, rendered from the file's own schema. */
export function createEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    fields: Record<string, unknown>
): WriteOutcome {
    const held = readCollection(hub, config, collection);
    if (held === null) return { found: false, changed: [], refused: [] };
    const registryField = REGISTRY_IDENTITY_FIELDS[collection];
    const registryRaw = registryField === undefined ? undefined : fields[registryField];
    const registryValue = typeof registryRaw === 'string' ? registryRaw.trim() : '';
    if (registryField !== undefined && registryValue === '') {
        return {
            found: true,
            changed: [],
            refused: [
                {
                    field: registryField,
                    reason: `a new entry needs a non-empty ${registryField}`
                }
            ]
        };
    }
    if (
        registryField !== undefined &&
        held.items.some((one) => String(one[registryField] ?? '').trim() === registryValue)
    ) {
        return {
            found: true,
            changed: [],
            refused: [
                {
                    field: registryField,
                    reason: `an entry with that ${registryField} is already in the file`
                }
            ]
        };
    }
    const ident = held.ident;
    const raw = fields[ident];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') {
        return {
            found: true,
            changed: [],
            refused: [{ field: ident, reason: `a new entry needs a ${ident}` }]
        };
    }
    if (held.items.some((one) => String(one[ident] ?? '') === value)) {
        return {
            found: true,
            changed: [],
            refused: [
                { field: ident, reason: `an entry with that ${ident} is already in the file` }
            ]
        };
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [];
    for (const [field, given] of Object.entries(normaliseMetalists(held.schema, fields))) {
        const one = asFieldValue(given);
        if (one === undefined) {
            refused.push({
                field,
                reason: 'not a string, number, boolean, list of strings, metalist, flat scalar map or null'
            });
            continue;
        }
        values[field] = one;
    }
    values[ident] = value;
    if (registryField !== undefined) values[registryField] = registryValue;

    const block = renderEntry(fieldNames(held.schema), ident, values);
    if (block === '') {
        return {
            found: true,
            changed: [],
            refused: [...refused, { field: ident, reason: 'nothing to write' }]
        };
    }
    const out = saved(held.file, held.source, appendEntry(held.source, held.list, block));
    return { ...out, refused: [...refused, ...out.refused] };
}
