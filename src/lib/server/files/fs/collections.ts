// Layer 2, server. A collection file read for a lookup: which file a collection key names, how an
// entry is addressed inside it, and the entry an identity value names. The write path in
// server/edit/writes/entries.ts and the seed of a task in server/machine/seeds/task-seed.ts read a
// collection through this module, so neither imports the other.
//
// An entry is addressed by its identity value, not by its id. funding.yml's schema opens with
// `title` while three of its entries carry a `key`, and the id the reader made is that key, so
// identityOf resolves the two rather than assuming they agree.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { below } from '../../core/paths.ts';
import { BOOKMARKS, ensureBookmarksFile } from './bookmarks.ts';

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

/** The `id`, `key` and `title` an entry names itself by, each empty unless it is text. */
const entryNamesShape = z.looseObject({
    id: z.string().catch(''),
    key: z.string().catch(''),
    title: z.string().catch('')
});

/** An identity value as the file writes it: a string, or any number. */
const idPartShape = z.union([z.string(), anyNumberShape]);

/** The identity value an entry holds under its identity field as text, or null when it has none. */
export function identityText(entry: Record<string, unknown>, ident: string): string | null {
    const held = idPartShape.safeParse(entry[ident]);
    return held.success ? String(held.data) : null;
}

/**
 * The id the reader gives an entry, as normalise.ts's entry() builds it: its `id`, its `key`, its
 * `title`, and for a file whose records carry none of the three the value of its own identity
 * field.
 */
export function entryId(entry: Record<string, unknown>, ident: string): string {
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

/** The collection file one key names, read, or null when it is not there or does not parse. */
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
