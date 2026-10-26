// Layer 2, server. A collection file read for a lookup: which file a collection key names, how an
// entry is addressed inside it, and the entry a value of its primary key names. The write path in
// server/edit/writes/entries.ts and the seed of a task in server/machine/runs/seeds/task-seed.ts
// read a collection through this module, so neither imports the other.
//
// An entry is addressed by its value of the file's primary key (`primaryKeyOf`): the field its
// schema flags `primary_key: true`, or for a file with no schema the field its `collections:`
// entry names. The reader's id of an entry is that same value (`entryIdOf`), so a write and the
// snapshot name an entry alike. A file with no primary key reads with `ident` null, and every
// write that addresses one of its entries is refused.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMap as isYamlMap, parseDocument } from 'yaml';
import { z } from 'zod';
import { LIST, emptyListKey, listOf } from '../../../data/helpers/files/yaml/collection-text.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { entryIdOf, primaryKeyOf } from '../../../data/model/index.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import { keyFaultOf, type KeyFault } from '../../../data/model/model-collections.ts';
import { anyNumberShape } from '../../../data/shapes/shapes.ts';
import { keyedSchema } from '../../../data/snapshot/schema/field.ts';
import { below } from '../../core/paths.ts';
import { BOOKMARKS, ensureBookmarksFile } from './bookmarks.ts';

/**
 * The file one collection key names, or null when sources.yml does not name it inside the hub.
 *
 * `own` is the reader's own bookmarks file, which is a collection edited by the same writers while
 * living in the hub's `.oculus` folder (or where `bookmarks` of the hub's config.yml puts it). It
 * is resolved before the hub's own list so that a hub file keyed `bookmarks` could never take the
 * reader's own one over.
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

/** A value of a primary key as the file writes it: a string, or any number. */
const idPartShape = z.union([z.string(), anyNumberShape]);

/** The value an entry holds under the primary key `ident` as text, or null when it has none. */
export function identityText(entry: Record<string, unknown>, ident: string): string | null {
    const held = idPartShape.safeParse(entry[ident]);
    return held.success ? String(held.data) : null;
}

/** One collection file read for a write: its text, its entry list and its primary key. */
export type Collection = {
    file: string;
    source: string;
    schema: unknown;
    /** The key the entries are listed under, and the empty string for a file with no list yet. */
    list: string;
    /**
     * The key a first entry is written under while `list` is empty: the one key that holds nothing
     * (`emptyListKey`), else `entries`.
     */
    starts: string;
    items: Record<string, unknown>[];
    /** The file's primary key (`primaryKeyOf`), null when it has none. */
    ident: string | null;
    /** Why the file has no primary key (`keyFaultOf`), null when it has one. */
    fault: KeyFault | null;
    /**
     * The primary key the file's `collections:` entry names, which a new text of the file is read
     * with again (`collectionText`).
     */
    named?: string;
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
    const named = config.collections.find((one) => one.key === key)?.primary_key;
    return collectionText(file, source, own, file === own ? undefined : named);
}

/**
 * One collection file's text read as readCollection reads the file, or null when it does not parse:
 * what an undo that puts text back reads its result through before it writes it. `named` is the
 * primary key the file's `collections:` entry names, which a file with no schema is addressed by.
 */
export function collectionText(
    file: string,
    source: string,
    own?: string,
    named?: string
): Collection | null {
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
    // writes no empty block list. A hub file whose `entries:` key holds nothing but comments (or
    // whose last entry was deleted) has the key with a null under it, and so has a hub file whose
    // one key beside `schema:` holds nothing (`emptyListKey`), which is read as an empty list under
    // that key. A hub file with none of these, or with two or more empty keys, is refused.
    const empty = found === null ? emptyListKey(doc.contents) : null;
    if (found === null && file !== own && empty === null) return null;
    const held = found === null ? undefined : data[found.key];
    const schema = keyedSchema(data.schema);
    return {
        file,
        source,
        schema: data.schema,
        list: found?.key ?? '',
        starts: empty ?? LIST,
        items: Array.isArray(held) ? held.filter(isMap) : [],
        ident: primaryKeyOf(schema, named),
        fault: keyFaultOf(schema, named),
        ...(named === undefined ? {} : { named })
    };
}

/**
 * The value of the primary key of the entry whose id is `id`, which is what the text is addressed
 * by, or null when the file holds no such entry or has no primary key. The reader's id of an entry
 * is its value of the primary key (`entryIdOf`), so this asks whether the file holds it still.
 */
export function identityOf(collection: Collection, id: string): string | null {
    const ident = collection.ident;
    if (ident === null) return null;
    for (const item of collection.items) {
        if (entryIdOf(item, ident) !== id) continue;
        return identityText(item, ident);
    }
    return null;
}

/** The entry one value of the primary key names, or undefined when the file holds none with it. */
export function entryOf(
    collection: Collection,
    value: string
): Record<string, unknown> | undefined {
    const ident = collection.ident;
    if (ident === null) return undefined;
    return collection.items.find((one) => scalar(one[ident]) === value);
}
