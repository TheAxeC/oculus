// Layer 2, server. The collection half of the write path: the four edits one entry takes. Which
// file a collection key names and how an entry is addressed inside it are read through
// server/files/fs/collections.ts, which the seed of a task reads as well.
//
// `saved()` lives here because both of the modules that put an edit on disk are here or import this
// one: writes/subtasks.ts reads a collection through readCollection, so it takes the writer with
// it.
//
// A field's value is checked against the type its own schema declares before anything is written: a
// select takes one of its options, a date one ISO day, a checkbox a boolean, and a text field one
// line of text. A value that does not fit is refused with the reason, never coerced into something
// the file did not mean, and the other fields of the same request are written: a request may set
// several fields of the entry in one call, so one bad value holds back itself and nothing else.
//
// server/edit/writes.ts is the route and re-exports the public half of this file.
//
// A write answers with the id the file gives the entry after the write (`WriteOutcome.id`, set by
// `writeEntry` and `createEntry` from their own `entryId`, carried in the endpoint's JSON and read
// into `WriteAnswer`), so the page is told where the entry now is after a rename rather than
// reading the file's id rule a second time.

import { parse } from 'yaml';
import { z } from 'zod';
import { ISO_DATE } from '../../../data/helpers/dates.ts';
import { KEYED_FIELDS, LIST } from '../../../data/helpers/files/yaml/collection-text.ts';
import { byKey, isMap, scalar } from '../../../data/helpers/guards.ts';
import { mapShape } from '../../../data/shapes/shapes.ts';
import { throughSchema } from '../../../data/snapshot/hubs/references.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import {
    appendEntry,
    deleteEntry,
    renderEntry,
    reorderEntries,
    setEntryFields,
    startEntries
} from '../entry-edit/index.ts';
import { plain } from '../../core/changes.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import {
    entryId,
    entryOf,
    identityOf,
    identityText,
    readCollection,
    type Collection
} from '../../files/fs/collections.ts';
import { NOT_A_FIELD_VALUE, asFieldValue } from '../yaml/yaml-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult, Refusal } from '../yaml/yaml-edit.ts';
import type { FieldValue } from '../yaml/yaml-values.ts';
import type { PortfolioConfig, SchemaField } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';

/** One edit put on disk the way writeManifest does it: only when the edit changed something. */
export function saved(file: string, source: string, edit: EditResult): WriteOutcome {
    if (edit.changed.length > 0 && edit.text !== source) writeTextAtomic(file, edit.text);
    return { found: true, changed: edit.changed, refused: edit.refused };
}

/**
 * Why a value does not fit the type its schema field declares, or the empty string when it does.
 * The five types a control writes are checked; a `tags`, `metalist` or `raw` field carries a shape
 * rather than a value and is left to yaml-edit's own vocabulary. An empty value clears a field,
 * whatever its type, so it is never refused here.
 */
function typeRefusal(field: SchemaField, value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const name = field.field;
    if (field.type === 'text' || field.type === 'textarea') {
        const fits = typeof value === 'string' || typeof value === 'number';
        return fits ? '' : `${name} takes text`;
    }
    if (field.type === 'date') {
        if (typeof value !== 'string' || !ISO_DATE.test(value.trim())) {
            return `${name} takes a date written YYYY-MM-DD`;
        }
        return '';
    }
    if (field.type === 'checkbox') {
        return typeof value === 'boolean' ? '' : `${name} takes true or false`;
    }
    if (field.type === 'records') return recordRefusal(field, value);
    if (field.type !== 'select') return '';
    const options = field.options ?? [];
    if (typeof value !== 'string') return `${name} takes one of its own options`;
    // A select whose options come from a source (`from`) has none of its own here, and the value
    // is then checked as text: the sources are the page's data, not the file's.
    if (options.length === 0) return '';
    return options.includes(value.trim()) ? '' : `${name} takes one of ${options.join(', ')}`;
}

/**
 * Why the value of a `records` field does not fit the sub-fields its schema declares, the first
 * reason found, or the empty string. The value is a list of records, one record, or with `map` a
 * map from a name to one record; a key no sub-field names is not checked.
 */
function recordRefusal(field: SchemaField, value: unknown): string {
    const declared = field.fields ?? [];
    const records: unknown[] = Array.isArray(value)
        ? value
        : field.map === true && isMap(value)
          ? Object.values(value)
          : [value];
    for (const record of records) {
        if (!isMap(record)) return `${field.field} takes records of named values`;
        for (const sub of declared) {
            if (!(sub.field in record)) continue;
            const reason = typeRefusal(sub, record[sub.field]);
            if (reason !== '') return reason;
        }
    }
    return '';
}

/** Every field of the given ones whose value does not fit the file's own schema. */
export function typeRefusals(schema: unknown, fields: Record<string, unknown>): Refusal[] {
    const declared = collectionSchema(schema) ?? [];
    const refused: Refusal[] = [];
    for (const field of declared) {
        if (!(field.field in fields)) continue;
        const reason = typeRefusal(field, fields[field.field]);
        if (reason !== '') refused.push({ field: field.field, reason });
    }
    return refused;
}

/** The given fields without the ones that were refused, which are what a write goes on with. */
function fitting(fields: Record<string, unknown>, refused: Refusal[]): Record<string, unknown> {
    const names = new Set(refused.map((one) => one.field));
    return Object.fromEntries(Object.entries(fields).filter(([field]) => !names.has(field)));
}

/** One item of a collection schema that declares a metalist field. */
/** The block `renderEntry` makes for one new entry: a list of that one entry. */
const renderedShape = z.tuple([mapShape]);

const metalistItemShape = z.looseObject({ type: z.literal('metalist'), field: z.string() });

/**
 * The names of the schema's metalist fields. An item that is not a map, has another type or has no
 * text `field` declares none, and a schema that is no list declares none at all.
 */
const metalistFieldsShape = z
    .array(metalistItemShape.nullable().catch(null))
    .transform((all) => new Set(all.flatMap((item) => (item === null ? [] : [item.field]))))
    .catch(() => new Set<string>());

/** The fields the collection schema declares as metalists. */
function metalistFields(schema: unknown): Set<string> {
    return metalistFieldsShape.parse(schema);
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

/**
 * The id the reader gives the entry one identity value names, which is what every write addresses
 * an entry by. It is identityOf read the other way round, and an undo needs it: what a change
 * records is the identity value the file is keyed by.
 */
export function idOfIdentity(collection: Collection, value: string): string | null {
    const entry = entryOf(collection, value);
    return entry === undefined ? null : entryId(entry, collection.ident);
}

/** Every entry's identity value, in the order the file lists them. */
export function identityOrder(collection: Collection): string[] {
    return collection.items.flatMap((one) => {
        const value = identityText(one, collection.ident);
        return value === null ? [] : [value];
    });
}

/**
 * The first identity value that two of the entries share, or the empty string when every entry has
 * its own. A write is refused while one exists: an edit addressed by that value reaches the first
 * entry alone, and the second could then be neither edited nor removed. validate reports the same
 * file, so the reader is told where it is.
 */
function sharedIdentity(items: Record<string, unknown>[], ident: string): string {
    const seen = new Set<string>();
    for (const item of items) {
        const value = identityText(item, ident);
        if (value === null) continue;
        if (seen.has(value)) return value;
        seen.add(value);
    }
    return '';
}

/**
 * The refusal a file with two entries of one identity value answers every write with, or null
 * when the entries all have their own. A collection file and a feed file are refused the same way.
 */
export function sharedRefusal(
    items: Record<string, unknown>[],
    ident: string
): WriteOutcome | null {
    const value = sharedIdentity(items, ident);
    if (value === '') return null;
    return {
        found: true,
        changed: [],
        refused: [
            {
                field: ident,
                reason: `two entries share the ${ident} ${value}, so a write cannot address one of them`
            }
        ]
    };
}

/**
 * The fields with the hub's key and colon taken off every value that names a record of the hub (a
 * `from:` of the file's schema), since the portfolio gives those values the key
 * (data/snapshot/hubs/merge.ts) and the file of the hub holds the ids it gave them. A value without
 * the prefix is kept as it is.
 */
function hubOwnValues(
    schema: unknown,
    fields: Record<string, unknown>,
    key: string
): Record<string, unknown> {
    const lead = `${key}:`;
    return throughSchema(collectionSchema(schema) ?? [], fields, (value) =>
        value.startsWith(lead) ? value.slice(lead.length) : value
    );
}

/**
 * Set fields of one collection entry, found by the id the reader gave it. `hubKey` is the key of
 * the hub the file belongs to when it is not the primary hub: the values of the fields that name
 * records come with that key in front, and are written without it.
 */
export function writeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string,
    given: Record<string, unknown>,
    own?: string,
    hubKey?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(held.items, held.ident);
    if (shared !== null) return shared;
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    const fields = hubKey === undefined ? given : hubOwnValues(held.schema, given, hubKey);
    const typed = typeRefusals(held.schema, fields);
    const wanted = fitting(fields, typed);
    if (held.ident in wanted) {
        // The identity value is what addresses an entry in this file, so an edit may not move the
        // entry onto another entry's value: the file would then hold two entries no write can tell
        // apart, and every later write to it is refused.
        const raw = wanted[held.ident];
        const next = typeof raw === 'string' ? raw.trim() : scalar(raw);
        if (next !== value && held.items.some((one) => scalar(one[held.ident]) === next)) {
            return {
                found: true,
                changed: [],
                refused: [
                    ...typed,
                    {
                        field: held.ident,
                        reason: `another entry is already called ${next}`
                    }
                ]
            };
        }
    }
    const registryField = byKey(KEYED_FIELDS, collection);
    if (registryField !== undefined && registryField in wanted) {
        // The registry keys its entities by this field, so an edit may neither clear it nor move
        // the entry onto another entry's value: normalise would then keep one of the two.
        const own = held.items.find((one) => scalar(one[held.ident]) === value);
        const raw = wanted[registryField];
        const next = typeof raw === 'string' ? raw.trim() : '';
        const current = scalar(own?.[registryField]).trim();
        if (next === '') {
            return {
                found: true,
                changed: [],
                refused: [
                    ...typed,
                    { field: registryField, reason: `an entry needs a non-empty ${registryField}` }
                ]
            };
        }
        if (
            next !== current &&
            held.items.some((one) => scalar(one[registryField]).trim() === next)
        ) {
            return {
                found: true,
                changed: [],
                refused: [
                    ...typed,
                    {
                        field: registryField,
                        reason: `an entry with that ${registryField} is already in the file`
                    }
                ]
            };
        }
    }
    const entry = entryOf(held, value);
    const writing = normaliseMetalists(held.schema, wanted);
    const out = saved(
        held.file,
        held.source,
        setEntryFields(held.source, held.ident, value, writing)
    );
    // The entry the edit was computed against is the value before it, and `writing` is the value
    // the edit put there, so the record is made where both halves are in hand rather than by
    // reading the file again. A write that renamed the entry leaves it listed under the value it
    // wrote, so each of its records is keyed by that value and carries the one before it (`was`):
    // the reader may undo the write's records in any order, and each undo finds the entry under
    // one or the other.
    const renamed = out.changed.includes(held.ident) ? scalar(writing[held.ident]) : null;
    const records: ChangeRecord[] = out.changed.map((field) => ({
        file: held.file,
        key: renamed ?? value,
        ...(renamed === null ? {} : { was: value }),
        field,
        before: plain(entry?.[field]),
        after: plain(writing[field]),
        undo: 'field'
    }));
    return {
        ...out,
        id: entryId({ ...entry, ...writing }, held.ident),
        refused: [...typed, ...out.refused],
        records
    };
}

/**
 * Put one collection's entries in the order the reader dragged them into. The order is the identity
 * values, not the ids: it is what addresses an entry in the file, and it is what the card carries.
 */
export function reorderCollection(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    order: string[],
    own?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(held.items, held.ident);
    if (shared !== null) return shared;
    const before = identityOrder(held);
    const out = saved(held.file, held.source, reorderEntries(held.source, held.ident, order));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            {
                file: held.file,
                key: collection,
                field: 'entries',
                before,
                after: order,
                undo: 'reorder'
            }
        ]
    };
}

/** Take one entry out of its collection file, found by the id the reader gave it. */
export function removeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string,
    own?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(held.items, held.ident);
    if (shared !== null) return shared;
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    const entry = entryOf(held, value);
    const out = saved(held.file, held.source, deleteEntry(held.source, held.ident, value));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            {
                file: held.file,
                key: value,
                field: 'entries',
                before: plain(entry),
                after: null,
                undo: 'delete'
            }
        ]
    };
}

/**
 * The key of the hub a new entry's id begins with, followed by a colon, or undefined. The
 * portfolio reads such an id as an entry of that hub (server/edit/writes/hubs.ts), so a write
 * addressed by it would go to the other hub's file and find no entry there.
 */
function hubPrefix(id: string, hubKeys: readonly string[]): string | undefined {
    return hubKeys.find((key) => key !== '' && id.startsWith(`${key}:`));
}

/**
 * Add one entry to a collection, rendered from the file's own schema. `hubKeys` are the keys of
 * the workspace's hubs: an id that begins with one and a colon is refused.
 */
export function createEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    fields: Record<string, unknown>,
    own?: string,
    hubKeys: readonly string[] = []
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = sharedRefusal(held.items, held.ident);
    if (shared !== null) return shared;
    const typed = typeRefusals(held.schema, fields);
    const wanted = fitting(fields, typed);
    const registryField = byKey(KEYED_FIELDS, collection);
    const registryRaw = registryField === undefined ? undefined : wanted[registryField];
    const registryValue = typeof registryRaw === 'string' ? registryRaw.trim() : '';
    if (registryField !== undefined && registryValue === '') {
        return {
            found: true,
            changed: [],
            refused: [
                ...typed,
                {
                    field: registryField,
                    reason: `a new entry needs a non-empty ${registryField}`
                }
            ]
        };
    }
    if (
        registryField !== undefined &&
        held.items.some((one) => scalar(one[registryField]).trim() === registryValue)
    ) {
        return {
            found: true,
            changed: [],
            refused: [
                ...typed,
                {
                    field: registryField,
                    reason: `an entry with that ${registryField} is already in the file`
                }
            ]
        };
    }
    const ident = held.ident;
    const raw = wanted[ident];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') {
        return {
            found: true,
            changed: [],
            refused: [...typed, { field: ident, reason: `a new entry needs a ${ident}` }]
        };
    }
    if (held.items.some((one) => scalar(one[ident]) === value)) {
        return {
            found: true,
            changed: [],
            refused: [
                ...typed,
                { field: ident, reason: `an entry with that ${ident} is already in the file` }
            ]
        };
    }

    const prefixed = hubPrefix(value, hubKeys) ?? hubPrefix(registryValue, hubKeys);
    if (prefixed !== undefined) {
        return {
            found: true,
            changed: [],
            refused: [
                ...typed,
                { field: ident, reason: words(config.text, 'server.entries.hub_key', prefixed) }
            ]
        };
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [...typed];
    for (const [field, given] of Object.entries(normaliseMetalists(held.schema, wanted))) {
        const one = asFieldValue(given);
        if (one === undefined) {
            refused.push({ field, reason: NOT_A_FIELD_VALUE });
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
    // A file with no list yet is given one with this entry under it; every later add appends.
    const edit =
        held.list === ''
            ? startEntries(held.source, LIST, block)
            : appendEntry(held.source, held.list, block);
    const out = saved(held.file, held.source, edit);
    // The record holds the entry as the file holds it after the write, read back from the block the
    // renderer made: a field it leaves out for its empty value is not in the record, so the undo
    // finds the entry as the record says it is.
    const [written] = renderedShape.parse(parse(block));
    const records: ChangeRecord[] =
        out.changed.length === 0
            ? []
            : [
                  {
                      file: held.file,
                      key: value,
                      field: 'entries',
                      before: null,
                      after: written,
                      undo: 'create'
                  }
              ];
    return {
        ...out,
        id: entryId(values, ident),
        refused: [...refused, ...out.refused],
        records
    };
}
