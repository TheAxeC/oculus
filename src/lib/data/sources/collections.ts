// Layer 1, data. Reads the hub's collection files into raw entries with provenance.
// Server side only: it reads the filesystem and no client module may import it.
// It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so a
// missing or broken collection costs its own entries and no more.
//
// A collection is a hub file of like records: datasets, statements, funding schemes, talks,
// teaching, applications, joint work, tasks or repositories. Five are also registries and are
// carried as entities; this reader knows that the data registry lists records under `datasets:` and
// every other collection lists them under `entries:`.

import { join } from 'node:path';
import { z } from 'zod';
import { byKey } from '../helpers/guards.ts';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { engineDir } from '../places/engine-dir.ts';
import {
    filledTextShape,
    itemsShape,
    mapShape,
    readAs,
    readOr,
    rowsShape
} from '../shapes/shapes.ts';
import { configDir } from './config/folder.ts';
import { isAbsent, readYamlMap } from './yaml-file.ts';
import type {
    CollectionFile,
    Finding,
    PortfolioConfig,
    RawCollection,
    RawEntry
} from '../model/index.ts';

/** A key and a hub-relative path from the `collections:` list; declared with the other types. */
export type { CollectionFile } from '../model/index.ts';

/**
 * The key of the Literature collection, which a hub whose own list names no Literature file reads
 * from oculus's default path when the hub holds the file there, since Save to Literature writes
 * there then (server/edit/feeds/literature.ts), so the collection the cards read is the file the
 * save wrote.
 */
export const LITERATURE_KEY = 'literature';

/** One entry of the `collections:` list: a key and a hub-relative file, both texts. */
const collectionFileShape = z.object({
    key: z.string(),
    file: z.string()
}) satisfies z.ZodType<CollectionFile>;

/** The `collections:` list, each entry a key and a hub-relative file. */
const collectionFilesShape = rowsShape(collectionFileShape);

/** A `collections:` list as the files it names; anything that is no such list names none. */
export function collectionFiles(value: unknown): CollectionFile[] {
    return readOr(collectionFilesShape, value, []);
}

/** Oculus's own default paths: each collection's file and the career file. */
export type EngineDefaults = { collections: CollectionFile[]; career: string | null };

/**
 * Oculus's own default paths, from the `collections:` list and `career_file` of the engine's
 * config/sources.yml, the one table of those paths. A hub whose list leaves a key out reads that
 * key's file from here. A sources file that cannot be read gives no path.
 */
export function engineDefaults(engine: string = engineDir()): EngineDefaults {
    const held = readYamlMap(join(configDir(engine), 'sources.yml'), {}, [], () => null);
    return {
        collections: collectionFiles(held?.collections),
        career: readAs(filledTextShape, held?.career_file) ?? null
    };
}

/**
 * Whether the collection `key` of a hub is one its own settings do not name (`unnamed` of
 * PortfolioConfig): every collection of a hub that names no list, and the engine's Literature of a
 * hub whose list names none. A file of it that is absent is no finding, and the hub lists it only
 * when it holds the file.
 */
export function unnamedCollection(unnamed: PortfolioConfig['unnamed'], key: string): boolean {
    return (
        unnamed?.collections === true || (unnamed?.literature === true && key === LITERATURE_KEY)
    );
}

/** The record-list key, including the dataset registry's established exception. */
function listKey(key: string): string {
    return key === 'data' ? 'datasets' : 'entries';
}

function empty(key: string, file: string): RawCollection {
    return { key, file, meta: {}, entries: [] };
}

/**
 * One collection: its entries in file order with provenance, and every other top-level key as meta.
 */
function readCollection(
    hub: string,
    asked: CollectionFile,
    catalog: TextCatalog,
    findings: Finding[],
    unnamed: boolean
): RawCollection {
    const file = join(hub, asked.file);
    const data = readYamlMap(file, catalog, findings, (error) =>
        unnamed && isAbsent(error)
            ? null
            : findingText(catalog, 'findings.collections.file_missing')
    );
    if (data === null) return empty(asked.key, file);
    const listName = listKey(asked.key);

    // An own `__proto__` key is skipped: assigning to it would replace the new map's prototype.
    const meta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (key !== listName && key !== '__proto__') meta[key] = value;
    }

    // A list key with nothing under it is an empty list: it is what a file holds after its last
    // entry is deleted, and what one holds that has only comments there.
    const list = data[listName] === null ? [] : readAs(itemsShape, data[listName]);
    if (list === null) {
        const message =
            listName in data
                ? findingText(catalog, 'findings.file.list_not_a_list', listName)
                : findingText(catalog, 'findings.file.list_missing', listName);
        findings.push({ file, key: listName, message });
        return { key: asked.key, file, meta, entries: [] };
    }

    const entries: RawEntry[] = [];
    list.forEach((item, index) => {
        const raw = readAs(mapShape, item);
        if (raw === null) {
            findings.push({
                file,
                key: `${listName}[${index}]`,
                message: findingText(catalog, 'findings.file.entry_not_a_map')
            });
            return;
        }
        entries.push({ ...raw, provenance: { file, index } });
    });

    return { key: asked.key, file, meta, entries };
}

/**
 * Read the collection files named, keyed by the key each was named under. An entry keeps every
 * field the YAML gave it plus `provenance`, and its identity is left as read: nothing here decides
 * whether a record is known by its `key` or its `title`. A file that is missing, does not parse, is
 * not a map, or has no entry list gives an empty collection and one finding; an entry that is not a
 * map is one finding and no record. Two entries for the same key is a finding on the second and the
 * first file is the one read, so the returned map has one collection per key. A key `unnamed`
 * answers true for is one the hub's own config does not name, so its file being absent raises no
 * finding.
 */
export function readCollections(
    hub: string,
    files: CollectionFile[],
    catalog: TextCatalog,
    unnamed: (key: string) => boolean = () => false
): { collections: Record<string, RawCollection>; findings: Finding[] } {
    const findings: Finding[] = [];
    const collections: Record<string, RawCollection> = {};
    for (const asked of files) {
        const seen = byKey(collections, asked.key);
        if (seen !== undefined) {
            findings.push({
                file: join(hub, asked.file),
                key: asked.key,
                message: findingText(
                    catalog,
                    'findings.collections.key_read_twice',
                    asked.key,
                    seen.file
                )
            });
        } else {
            collections[asked.key] = readCollection(
                hub,
                asked,
                catalog,
                findings,
                unnamed(asked.key)
            );
        }
    }
    return { collections, findings };
}
