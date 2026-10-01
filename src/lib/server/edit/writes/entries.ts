// Layer 2, server. The collection half of the write path: which file a collection key names, how an
// entry is addressed inside it, and the four edits one entry takes.
//
// An entry is addressed by its identity value, not by its id. funding.yml's schema opens with
// `title` while three of its entries carry a `key`, and the id the reader made is that key, so
// identityOf resolves the two rather than assuming they agree.
//
// `saved()` lives here because both of the modules that put an edit on disk are here or import this
// one: writes/subtasks.ts reads a collection through readCollection, so it takes the writer with
// it.
//
// A field's value is checked against the type its own schema declares before anything is written: a
// select takes one of its options, a date one ISO day, a checkbox a boolean, and a text field one
// line of text. A value that does not fit is refused with the reason, never coerced into something
// the file did not mean, and the other fields of the same request are written: the form sends every
// field of the entry in one call, so one bad value holds back itself and nothing else.
//
// server/edit/writes.ts is the route and re-exports the public half of this file.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap, byKey, scalar } from '../../../data/helpers/guards.ts';
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
import { anyNumberShape } from '../../core/shapes.ts';
import { BOOKMARKS, ensureBookmarksFile } from '../../files/fs/bookmarks.ts';
import { NOT_A_FIELD_VALUE, asFieldValue } from '../yaml-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult, FieldValue, Refusal } from '../yaml-edit.ts';
import type { PortfolioConfig, SchemaField } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';
import { below } from '../../core/paths.ts';

/** Registries whose entry key is not the first field of their collection schema. */
const REGISTRY_IDENTITY_FIELDS: Record<string, string> = { venues: 'id' };

/** One edit put on disk the way writeManifest does it: only when the edit changed something. */
export function saved(file: string, source: string, edit: EditResult): WriteOutcome {
    if (edit.changed.length > 0 && edit.text !== source) writeTextAtomic(file, edit.text);
    return { found: true, changed: edit.changed, refused: edit.refused };
}

/**
 * The file one collection key names, or null when sources.yml does not name it inside the hub.
 *
 * `own` is the reader's own bookmarks file, which is a collection edited by the same form and the
 * same writers while living outside the hub, under ~/.oculus. It is resolved before the hub's own
 * list so that a hub file keyed `bookmarks` could never take the reader's machine-local one over.
 */
export function collectionFile(
    hub: string,
    config: PortfolioConfig,
    key: string,
    own?: string
): string | null {
    if (own !== undefined && key === BOOKMARKS) {
        ensureBookmarksFile(own);
        return own;
    }
    const named = config.collections.find((one) => one.key === key)?.file;
    if (named === undefined) return null;
    const path = resolve(join(hub, named));
    return below(path, hub) ? path : null;
}

/**
 * The field an entry is found by: the file's own schema's first field, `title` when it has none.
 */
export function identityField(schema: unknown): string {
    const names = fieldNames(schema);
    return names.length > 0 ? names[0] : 'title';
}

/** The one shape a `date` field is written in. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Why a value does not fit the type its schema field declares, or the empty string when it does.
 * The five types a form control writes are checked; a `tags`, `metalist` or `raw` field carries a
 * shape rather than a value and is left to yaml-edit's own vocabulary. An empty value clears a
 * field, whatever its type, so it is never refused here.
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
    if (field.type !== 'select') return '';
    const options = field.options ?? [];
    if (typeof value !== 'string') return `${name} takes one of its own options`;
    // A select whose options are a vocabulary key (`options_from`) has none of its own here, and
    // the value is then checked as text: the vocabulary is the page's, not the file's.
    if (options.length === 0) return '';
    return options.includes(value.trim()) ? '' : `${name} takes one of ${options.join(', ')}`;
}

/** Every field of the given ones whose value does not fit the file's own schema. */
function typeRefusals(schema: unknown, fields: Record<string, unknown>): Refusal[] {
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

/** The `id`, `key` and `title` an entry names itself by, each empty unless it is text. */
const entryNamesShape = z.looseObject({
    id: z.string().catch(''),
    key: z.string().catch(''),
    title: z.string().catch('')
});

/** An identity value as the file writes it: a string, or any number. */
const idPartShape = z.union([z.string(), anyNumberShape]);

/** The identity value an entry holds under its identity field as text, or null when it has none. */
function identityText(entry: Record<string, unknown>, ident: string): string | null {
    const held = idPartShape.safeParse(entry[ident]);
    return held.success ? String(held.data) : null;
}

/**
 * The id the reader gives an entry, as normalise.ts's entry() builds it: its `id`, its `key`, its
 * `title`, and for a file whose records carry none of the three the value of its own identity
 * field.
 */
function entryId(entry: Record<string, unknown>, ident: string): string {
    const { id, key, title } = entryNamesShape.parse(entry);
    return id || key || title || (identityText(entry, ident) ?? '');
}

/** The maps of a list, which is all an entry can be. */
const entryMapsShape = z.array(z.unknown()).transform((all) => all.filter(isMap));

/** A list under another key than `entries`: entries when it is empty or opens with a map. */
const entryListShape = z
    .array(z.unknown())
    .refine((all) => all.length === 0 || isMap(all[0]))
    .transform((all) => all.filter(isMap));

/** The entry list of a parsed collection file: `entries:`, or the first list of maps beside it. */
function listOf(
    data: Record<string, unknown>
): { key: string; items: Record<string, unknown>[] } | null {
    const entries = entryMapsShape.safeParse(data.entries);
    if (entries.success) return { key: 'entries', items: entries.data };
    for (const [key, value] of Object.entries(data)) {
        if (key === 'schema') continue;
        const found = entryListShape.safeParse(value);
        if (found.success) return { key, items: found.data };
    }
    return null;
}

/** One collection file read for a write: its text, its entry list and its identity field. */
export type Collection = {
    file: string;
    source: string;
    schema: unknown;
    /** The key the entries are listed under, and the empty string for a file with no list yet. */
    list: string;
    items: Record<string, unknown>[];
    ident: string;
};

/** The key a collection file with no list yet is given its first entry under. */
const FIRST_LIST = 'entries';

export function readCollection(
    hub: string,
    config: PortfolioConfig,
    key: string,
    own?: string
): Collection | null {
    const file = collectionFile(hub, config, key, own);
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
    // A file the reader's own writes made carries no list key until the first entry, since YAML
    // writes no empty block list. A hub file without one is malformed and is still refused.
    if (list === null && file !== own) return null;
    return {
        file,
        source,
        schema: data.schema,
        list: list?.key ?? '',
        items: list?.items ?? [],
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
        if (entryId(item, collection.ident) !== id) continue;
        return identityText(item, collection.ident);
    }
    return null;
}

/** The entry one identity value names, or undefined when the file holds none with it. */
export function entryOf(
    collection: Collection,
    value: string
): Record<string, unknown> | undefined {
    return collection.items.find((one) => scalar(one[collection.ident]) === value);
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
 * The file's first identity value that two entries share, or the empty string when every entry has
 * its own. A write is refused while one exists: an edit addressed by that value reaches the first
 * entry alone, and the second could then be neither edited nor removed. validate reports the same
 * file, so the reader is told where it is.
 */
export function sharedIdentity(collection: Collection): string {
    const seen = new Set<string>();
    for (const item of collection.items) {
        const value = identityText(item, collection.ident);
        if (value === null) continue;
        if (seen.has(value)) return value;
        seen.add(value);
    }
    return '';
}

/** The refusal a file with two entries of one identity value answers every write with. */
function duplicate(collection: Collection): WriteOutcome | null {
    const value = sharedIdentity(collection);
    if (value === '') return null;
    return {
        found: true,
        changed: [],
        refused: [
            {
                field: collection.ident,
                reason: `two entries share the ${collection.ident} ${value}, so a write cannot address one of them`
            }
        ]
    };
}

/** Set fields of one collection entry, found by the id the reader gave it. */
export function writeEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    id: string,
    fields: Record<string, unknown>,
    own?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = duplicate(held);
    if (shared !== null) return shared;
    const value = identityOf(held, id);
    if (value === null) return { found: false, changed: [], refused: [] };
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
    const registryField = byKey(REGISTRY_IDENTITY_FIELDS, collection);
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
    // reading the file again.
    const records: ChangeRecord[] = out.changed.map((field) => ({
        file: held.file,
        key: value,
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
    const shared = duplicate(held);
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
    const shared = duplicate(held);
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

/** Add one entry to a collection, rendered from the file's own schema. */
export function createEntry(
    hub: string,
    config: PortfolioConfig,
    collection: string,
    fields: Record<string, unknown>,
    own?: string
): WriteOutcome {
    const held = readCollection(hub, config, collection, own);
    if (held === null) return { found: false, changed: [], refused: [] };
    const shared = duplicate(held);
    if (shared !== null) return shared;
    const typed = typeRefusals(held.schema, fields);
    const wanted = fitting(fields, typed);
    const registryField = byKey(REGISTRY_IDENTITY_FIELDS, collection);
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
            ? startEntries(held.source, FIRST_LIST, block)
            : appendEntry(held.source, held.list, block);
    const out = saved(held.file, held.source, edit);
    const records: ChangeRecord[] =
        out.changed.length === 0
            ? []
            : [
                  {
                      file: held.file,
                      key: value,
                      field: 'entries',
                      before: null,
                      after: values,
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
