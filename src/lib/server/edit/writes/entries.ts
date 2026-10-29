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
// `writeEntry` and `createEntry` by `entryIdOf`, carried in the endpoint's JSON and read into
// `WriteAnswer`), so the page is told where the entry now is after a rename rather than reading the
// file's id rule a second time. An entry is addressed by its value of the file's primary key, and
// every write to a file with no primary key is refused with a sentence that says so.
//
// An add and a delete of an entry record the text they replaced, whole lines and one line around it
// (`replaced`), so that their undo puts the file back byte for byte while it still holds what the
// write left there (`putBackEntry`); a file changed there since is put right by the writer the
// other way, which never writes over the change.

import { relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { z } from 'zod';
import { ISO_DATE } from '../../../data/helpers/dates.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { mapShape } from '../../../data/shapes/shapes.ts';
import { throughSchema } from '../../../data/snapshot/hubs/references.ts';
import type { KeyFault } from '../../../data/model/model-collections.ts';
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
import { plain, same } from '../../core/changes.ts';
import { writeTextAtomic } from '../../core/json.ts';
import { words } from '../../core/words.ts';
import {
    collectionText,
    entryOf,
    identityOf,
    identityText,
    readCollection,
    type Collection
} from '../../files/fs/collections.ts';
import { putBack, replacedLines, replacedShape } from './config/config-checks.ts';
import { asFieldValue } from '../../core/files/yaml/yaml-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult, Refusal } from '../../core/files/yaml/yaml-edit.ts';
import type { FieldValue } from '../../core/files/yaml/yaml-values.ts';
import {
    entryIdOf,
    optionKeys,
    type PortfolioConfig,
    type SchemaField
} from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';

/** One edit put on disk the way writeManifest does it: only when the edit changed something. */
export function saved(file: string, source: string, edit: EditResult): WriteOutcome {
    if (edit.changed.length > 0 && edit.text !== source) writeTextAtomic(file, edit.text);
    return { found: true, changed: edit.changed, refused: edit.refused };
}

/**
 * Why a value does not fit the type its schema field declares, or the empty string when it does.
 * The five types a control writes are checked, and a `tags` field with options of its own is held
 * to their keys; any other `tags`, a `metalist` or a `raw` field carries a shape rather than a
 * value and is left to yaml-edit's own vocabulary. An empty value clears a field, whatever its
 * type, so it is never refused here.
 */
function typeRefusal(field: SchemaField, value: unknown, catalog: Record<string, string>): string {
    if (value === null || value === undefined || value === '') return '';
    const name = field.field;
    if (field.type === 'text' || field.type === 'textarea') {
        const fits = typeof value === 'string' || typeof value === 'number';
        return fits ? '' : words(catalog, 'server.entries.type_text', name);
    }
    if (field.type === 'date') {
        if (typeof value !== 'string' || !ISO_DATE.test(value.trim())) {
            return words(catalog, 'server.entries.type_date', name);
        }
        return '';
    }
    if (field.type === 'checkbox') {
        return typeof value === 'boolean'
            ? ''
            : words(catalog, 'server.entries.type_checkbox', name);
    }
    if (field.type === 'records') return recordRefusal(field, value, catalog);
    // A field whose options come from a collection (`foreign_key`) alone has none of its own here,
    // and its value is then not held to a list: the collection is the page's data, not the file's.
    const options = optionKeys(field);
    if (field.type === 'tags') return tagsRefusal(name, options, value, catalog);
    if (field.type !== 'select') return '';
    if (typeof value !== 'string') return words(catalog, 'server.entries.type_option', name);
    if (options.length === 0) return '';
    return options.includes(value.trim())
        ? ''
        : words(catalog, 'server.entries.type_options', name, options.join(', '));
}

/**
 * Why the words of a `tags` field are not all keys of its own options, or the empty string. A
 * field with no options of its own, and a value that is no list of words, are left to yaml-edit.
 */
function tagsRefusal(
    name: string,
    options: string[],
    value: unknown,
    catalog: Record<string, string>
): string {
    if (options.length === 0 || !Array.isArray(value)) return '';
    const held: unknown[] = value;
    const stray = held.find((one) => typeof one === 'string' && !options.includes(one.trim()));
    return stray === undefined
        ? ''
        : words(catalog, 'server.entries.type_options', name, options.join(', '));
}

/**
 * Why the value of a `records` field does not fit the sub-fields its schema declares, the first
 * reason found, or the empty string. The value is a list of records, one record, or with `map` a
 * map from a name to one record; a key no sub-field names is not checked.
 */
function recordRefusal(
    field: SchemaField,
    value: unknown,
    catalog: Record<string, string>
): string {
    const declared = field.fields ?? [];
    const records: unknown[] = Array.isArray(value)
        ? value
        : field.map === true && isMap(value)
          ? Object.values(value)
          : [value];
    for (const record of records) {
        if (!isMap(record)) return words(catalog, 'server.entries.type_records', field.field);
        for (const sub of declared) {
            if (!(sub.field in record)) continue;
            const reason = typeRefusal(sub, record[sub.field], catalog);
            if (reason !== '') return reason;
        }
    }
    return '';
}

/** Every field of the given ones whose value does not fit the file's own schema. */
export function typeRefusals(
    schema: unknown,
    fields: Record<string, unknown>,
    catalog: Record<string, string>
): Refusal[] {
    const declared = collectionSchema(schema) ?? [];
    const refused: Refusal[] = [];
    for (const field of declared) {
        if (!(field.field in fields)) continue;
        const reason = typeRefusal(field, fields[field.field], catalog);
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
 * The id the reader gives the entry one value of the primary key names, which is what every write
 * addresses an entry by. It is identityOf read the other way round, and an undo needs it: what a
 * change records is the value of the primary key the file is keyed by.
 */
export function idOfIdentity(collection: Collection, value: string): string | null {
    const entry = entryOf(collection, value);
    return entry === undefined ? null : entryIdOf(entry, collection.ident);
}

/**
 * Every entry's value of the primary key, in the order the file lists them; none for a file with
 * no primary key.
 */
export function identityOrder(collection: Collection): string[] {
    const ident = collection.ident;
    if (ident === null) return [];
    return collection.items.flatMap((one) => {
        const value = identityText(one, ident);
        return value === null ? [] : [value];
    });
}

/**
 * The refusal of every write that addresses an entry of a collection file with no primary key, the
 * file named by its path inside the hub `hub`.
 */
function unkeyed(hub: string, held: Collection, catalog: Record<string, string>): WriteOutcome {
    const reason = noPrimaryKey(catalog, relative(hub, held.file), held.fault);
    return { found: true, changed: [], refused: [{ field: 'schema', reason }] };
}

/**
 * The sentence refusing a write to the file `file`, which has no primary key for the cause `fault`
 * (`keyFaultOf`), with what takes the cause away. A collection, a feed and the Literature file are
 * refused by it alike.
 */
export function noPrimaryKey(
    catalog: Record<string, string>,
    file: string,
    fault: KeyFault | null
): string {
    switch (fault?.cause) {
        case 'two':
            return words(
                catalog,
                'server.entries.no_primary_key_two',
                file,
                fault.fields.join(', ')
            );
        case 'unkeyed':
            return words(
                catalog,
                'server.entries.no_primary_key_unkeyed',
                file,
                fault.field,
                fault.type
            );
        case 'beside':
            return words(
                catalog,
                'server.entries.no_primary_key_beside',
                file,
                fault.named,
                fault.field
            );
        case 'missing':
            return words(catalog, 'server.entries.no_primary_key_missing', file);
        case 'unread':
            return words(catalog, 'server.entries.no_primary_key_unread', file);
        case 'none':
            if (fault.named !== undefined) {
                return words(catalog, 'server.entries.no_primary_key_named', file, fault.named);
            }
            return words(catalog, 'server.entries.no_primary_key_none', file);
        default:
            return words(catalog, 'server.entries.no_primary_key_none', file);
    }
}

/** A refusal of one field beside the type refusals `typed` the same request met. */
function refusedWith(typed: Refusal[], field: string, reason: string): WriteOutcome {
    return { found: true, changed: [], refused: [...typed, { field, reason }] };
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
    ident: string,
    catalog: Record<string, string>
): WriteOutcome | null {
    const value = sharedIdentity(items, ident);
    if (value === '') return null;
    return {
        found: true,
        changed: [],
        refused: [
            {
                field: ident,
                reason: words(catalog, 'server.entries.shared_identity', ident, value)
            }
        ]
    };
}

/**
 * The fields with the hub's name and a colon taken off every value that names an entry (a
 * `foreign_key:` of the file's schema that names no vocabulary list), since the portfolio names an
 * entry by its hub and its key (data/snapshot/hubs/merge.ts) and the file of the hub holds the key.
 * A value without the prefix, the key a form sends, is kept as it is.
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
 * Set fields of one collection entry, found by the key the hub's file gives it. `hubKey` is the
 * name of the hub the file belongs to: a value of a field that names an entry may come with that
 * name in front, and is written without it. A file with no primary key is refused.
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
    const ident = held.ident;
    if (ident === null) return unkeyed(hub, held, config.text);
    const shared = sharedRefusal(held.items, ident, config.text);
    if (shared !== null) return shared;
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    const fields = hubKey === undefined ? given : hubOwnValues(held.schema, given, hubKey);
    const typed = typeRefusals(held.schema, fields, config.text);
    // The value of the primary key is what addresses an entry in this file and what every
    // reference to it stores, so an edit may neither clear it nor move the entry onto another
    // entry's value: the file would then hold an entry no write can find, or two no write can tell
    // apart, and every later write to it is refused. A cleared value is refused as a field of the
    // wrong type is, and the other fields are written; a value another entry holds refuses the
    // whole write, since the reader meant to move the entry.
    const fitted = fitting(fields, typed);
    const keyText = (raw: unknown): string => (typeof raw === 'string' ? raw.trim() : scalar(raw));
    const cleared = ident in fitted && keyText(fitted[ident]) === '';
    const keyRefused: Refusal[] = cleared
        ? [{ field: ident, reason: words(config.text, 'server.entries.key_empty', ident) }]
        : [];
    const wanted = cleared
        ? Object.fromEntries(Object.entries(fitted).filter(([name]) => name !== ident))
        : fitted;
    if (ident in wanted) {
        const next = keyText(wanted[ident]);
        if (next !== value && held.items.some((one) => scalar(one[ident]) === next)) {
            return refusedWith(typed, ident, words(config.text, 'server.entries.name_taken', next));
        }
    }
    const entry = entryOf(held, value);
    const writing = normaliseMetalists(held.schema, wanted);
    const out = saved(
        held.file,
        held.source,
        setEntryFields(held.source, ident, value, writing, config.text)
    );
    // The entry the edit was computed against is the value before it, and `writing` is the value
    // the edit put there, so the record is made where both halves are in hand rather than by
    // reading the file again. A write that renamed the entry leaves it listed under the value it
    // wrote, so each of its records is keyed by that value and carries the one before it (`was`):
    // the reader may undo the write's records in any order, and each undo finds the entry under
    // one or the other.
    const renamed = out.changed.includes(ident) ? scalar(writing[ident]) : null;
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
        id: entryIdOf({ ...entry, ...writing }, ident),
        refused: [...typed, ...keyRefused, ...out.refused],
        records
    };
}

/**
 * Put one collection's entries in the order the reader dragged them into. The order is the values
 * of the primary key: it is what addresses an entry in the file, and it is what the card carries.
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
    const ident = held.ident;
    if (ident === null) return unkeyed(hub, held, config.text);
    const shared = sharedRefusal(held.items, ident, config.text);
    if (shared !== null) return shared;
    const before = identityOrder(held);
    const out = saved(
        held.file,
        held.source,
        reorderEntries(held.source, ident, order, config.text)
    );
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
    const ident = held.ident;
    if (ident === null) return unkeyed(hub, held, config.text);
    const shared = sharedRefusal(held.items, ident, config.text);
    if (shared !== null) return shared;
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
    const entry = entryOf(held, value);
    const edit = deleteEntry(held.source, ident, value, config.text);
    const out = saved(held.file, held.source, edit);
    if (out.changed.length === 0) return out;
    const replaced = replacedLines(held.source, edit.text);
    return {
        ...out,
        records: [
            {
                file: held.file,
                key: value,
                field: 'entries',
                before: plain(entry),
                after: null,
                undo: 'delete',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}

/**
 * Take back the add or the delete of one entry by the text its record replaced, which leaves the
 * file byte for byte as it was before the write: `key` is the entry's value of the primary key and
 * `entry` the entry the undo puts back, null for the undo of an add. The text goes back only while
 * the file holds what the write left at the record's place and the file with the text back lists
 * the entries the undo leaves, every other entry as it is now; otherwise nothing is written and the
 * answer is null, and the undo goes through removeEntry or createEntry. The record of the undo is
 * the one those writers make, with the text it replaced.
 */
export function putBackEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    taken: { key: string; entry: Record<string, unknown> | null; replaced: unknown },
    own?: string
): WriteOutcome | null {
    const held = readCollection(hub, config, collection, own);
    const put = replacedShape.safeParse(taken.replaced);
    if (held === null || !put.success) return null;
    const ident = held.ident;
    if (ident === null) return null;
    const text = putBack(held.source, put.data);
    const back = text === null ? null : collectionText(held.file, text, own, held.named);
    if (text === null || back === null) return null;
    const { key, entry } = taken;
    const others = (items: Record<string, unknown>[]) =>
        items.filter((one) => scalar(one[ident]) !== key);
    const now = entryOf(held, key);
    const restored = entryOf(back, key);
    const fits =
        isDeepStrictEqual(others(back.items), others(held.items)) &&
        (entry === null
            ? restored === undefined && now !== undefined
            : now === undefined && restored !== undefined && same(restored, entry));
    if (!fits) return null;
    const out = saved(held.file, held.source, { text, changed: ['entries'], refused: [] });
    const replaced = replacedLines(held.source, text);
    return {
        ...out,
        records: [
            {
                file: held.file,
                key,
                field: 'entries',
                before: entry === null ? plain(now) : null,
                after: entry,
                undo: entry === null ? 'delete' : 'create',
                ...(replaced === null ? {} : { replaced })
            }
        ]
    };
}

/**
 * Add one entry to a collection, rendered from the file's own schema. The entry needs a value of
 * the file's primary key that no entry of the file holds, and a file with no primary key is
 * refused.
 */
export function createEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    fields: Record<string, unknown>,
    own?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const ident = held.ident;
    if (ident === null) return unkeyed(hub, held, config.text);
    const shared = sharedRefusal(held.items, ident, config.text);
    if (shared !== null) return shared;
    const typed = typeRefusals(held.schema, fields, config.text);
    const wanted = fitting(fields, typed);
    const raw = wanted[ident];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') {
        const missing = words(config.text, 'server.entries.new_ident_missing', ident);
        return refusedWith(typed, ident, missing);
    }
    if (held.items.some((one) => scalar(one[ident]).trim() === value)) {
        return refusedWith(typed, ident, words(config.text, 'server.entries.key_taken', ident));
    }

    const values: Record<string, FieldValue> = {};
    const refused: Refusal[] = [...typed];
    for (const [field, given] of Object.entries(normaliseMetalists(held.schema, wanted))) {
        const one = asFieldValue(given);
        if (one === undefined) {
            refused.push({ field, reason: words(config.text, 'server.edit.not_a_field_value') });
            continue;
        }
        values[field] = one;
    }
    values[ident] = value;

    const block = renderEntry(fieldNames(held.schema), ident, values);
    if (block === '') {
        return {
            found: true,
            changed: [],
            refused: [
                ...refused,
                { field: ident, reason: words(config.text, 'server.entries.nothing_to_write') }
            ]
        };
    }
    // A file with no list yet is given one with this entry under it, under the key that holds
    // nothing when the file has one; every later add appends.
    const edit =
        held.list === ''
            ? startEntries(held.source, held.starts, block, config.text)
            : appendEntry(held.source, held.list, block, config.text);
    const out = saved(held.file, held.source, edit);
    // The record holds the entry as the file holds it after the write, read back from the block the
    // renderer made: a field it leaves out for its empty value is not in the record, so the undo
    // finds the entry as the record says it is.
    const [written] = renderedShape.parse(parse(block));
    const replaced = replacedLines(held.source, edit.text);
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
                      undo: 'create',
                      ...(replaced === null ? {} : { replaced })
                  }
              ];
    return {
        ...out,
        id: entryIdOf(values, ident),
        refused: [...refused, ...out.refused],
        records
    };
}
