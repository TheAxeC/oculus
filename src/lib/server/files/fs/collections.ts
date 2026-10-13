// Layer 2, server. A collection file read for a lookup: which file a collection key names, how an
// entry is addressed inside it, and the entry an identity value names. The write path in
// server/edit/writes/entries.ts and the seed of a task in server/machine/runs/seeds/task-seed.ts
// read a collection through this module, so neither imports the other.
//
// An entry is addressed by its identity value, not by its id. venues.yml's schema opens with `name`
// while its entries carry an `id`, so identityOf resolves the two rather than assuming they agree.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMap as isYamlMap, parseDocument } from 'yaml';
import { z } from 'zod';
import { LIST, listOf } from '../../../data/helpers/files/yaml/collection-text.ts';
import { pairOf } from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import { fieldNames } from '../../../data/snapshot/validate.ts';
import { below } from '../../core/paths.ts';
import { BOOKMARKS, ensureBookmarksFile } from './bookmarks.ts';

/**
 * The file one collection key names, or null when sources.yml does not name it inside the hub.
 *
 * `own` is the reader's own bookmarks file, which is a collection edited by the same writers while
 * living in the hub's `.oculus` folder (or where local.yml puts it). It is resolved before the
 * hub's own list so that a hub file keyed `bookmarks` could never take the reader's own one over.
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
    const doc = parseDocument(source);
    if (doc.errors.length > 0 || !isYamlMap(doc.contents)) return null;
    let data: unknown;
    try {
        data = doc.toJS();
    } catch {
        return null;
    }
    if (!isMap(data)) return null;
    const found = listOf(doc.contents);
    // A file the reader's own writes made carries no list key until the first entry, since YAML
    // writes no empty block list, and a hub file whose `entries:` key holds nothing but comments
    // (or whose last entry was deleted) has the key with a null under it. A hub file with neither
    // is malformed and is refused.
    const emptied = pairOf(doc.contents, LIST) !== undefined && data[LIST] == null;
    if (found === null && file !== own && !emptied) return null;
    const held = found === null ? undefined : data[found.key];
    return {
        file,
        source,
        schema: data.schema,
        list: found?.key ?? '',
        items: Array.isArray(held) ? held.filter(isMap) : [],
        ident: identityField(data.schema)
    };
}

/**
 * The value the entry's identity field holds, which is what the text is addressed by. It is not
 * always the id: venues.yml's schema opens with `name` while its entries carry an `id`, and the id
 * the reader made is that `id`, so the two are resolved here rather than assumed to agree.
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
