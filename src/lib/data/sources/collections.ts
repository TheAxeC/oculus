// Layer 1, data. Reads the collection files a hub's `collections:` list names into raw entries with
// provenance, and words the findings of the list itself. Server side only: it reads the filesystem
// and no client module may import it. It validates nothing and resolves nothing. Every failure is a
// Finding; nothing here throws, so a missing or broken collection costs its own entries and no more.
//
// A collection is a hub file of like records: datasets, statements, funding schemes, talks,
// teaching, applications, joint work, tasks or repositories. An entry of the list says what its
// file is beside its key and path (data/helpers/hub-names.ts reads the list): the registry it is,
// the features that read it, what Disseminated in leaves out of it and how the ticker reads it,
// which the collection read here carries. The registries are also carried as entities; the file of
// the `datasets` registry lists its records under `datasets:` and every other collection under
// `entries:`.

import { join } from 'node:path';
import { byKey, isMap } from '../helpers/guards.ts';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { catalogueGroupIds } from '../helpers/keys/oculus/rail-letters.ts';
import {
    COLLECTION_FLAGS,
    REGISTRY_SHAPES,
    collectionFiles,
    listProblems,
    type ListWords
} from '../helpers/hub-names.ts';
import { engineDir } from '../places/engine-dir.ts';
import { filledTextShape, itemsShape, mapShape, readAs } from '../shapes/shapes.ts';
import { engineFile } from './config/folder.ts';
import { textCatalog } from './config/merge/text.ts';
import { isAbsent, readYamlMap } from './yaml-file.ts';
import type {
    CollectionEntry,
    CollectionTraits,
    Finding,
    PortfolioConfig,
    RawCollection,
    ReadCollection,
    RawEntry
} from '../model/index.ts';

/** The reader of a `collections:` list, which the page reads lists with too. */
export { collectionFiles, type ListWords };

/**
 * The words the fields of a merged config's `collections:` list are checked against: its text
 * catalog, the words of its `ticker_categories` and the ids of its view catalogue's groups.
 */
export function listWords(merged: Record<string, unknown>): ListWords {
    return {
        text: textCatalog(merged),
        categories: isMap(merged.ticker_categories) ? Object.keys(merged.ticker_categories) : [],
        groups: catalogueGroupIds(merged)
    };
}

/**
 * The findings of a `collections:` list, each on `file` at the entry's field (`listProblems`),
 * worded from the catalog.
 */
export function collectionListFindings(
    value: unknown,
    words: ListWords,
    file: string,
    catalog: TextCatalog
): Finding[] {
    return listProblems(value, words).map((one) => ({
        file,
        key: `collections[${String(one.index)}].${one.field}`,
        message: findingText(catalog, one.word, ...one.values)
    }));
}

/** Oculus's own default paths: each collection's entry and the career file. */
export type EngineDefaults = { collections: CollectionEntry[]; career: string | null };

/**
 * Oculus's own default paths, from the `collections:` list and `career_file` of the engine's
 * config/defaults/sources.yml, the one table of those paths. A hub whose list names no entry of a
 * registry reads that registry's file from here. A sources file that cannot be read gives no path.
 */
export function engineDefaults(engine: string = engineDir()): EngineDefaults {
    const held = readYamlMap(engineFile(engine, 'sources.yml'), {}, [], () => null);
    return {
        collections: collectionFiles(held?.collections),
        career: readAs(filledTextShape, held?.career_file) ?? null
    };
}

/**
 * Whether the collection of an entry of a hub is one its own settings do not name (`unnamed` of
 * PortfolioConfig): every collection of a hub that names no list, and oculus's Literature entry of
 * a hub whose list names none. A file of it that is absent is no finding, and the hub lists it only
 * when it holds the file.
 */
export function unnamedCollection(
    unnamed: PortfolioConfig['unnamed'],
    entry: Pick<CollectionEntry, 'registry'>
): boolean {
    return (
        unnamed?.collections === true ||
        (unnamed?.literature === true && entry.registry === 'literature')
    );
}

/** The record-list key of an entry's file: its registry's list key, `entries` for any other. */
function listKey(entry: Pick<CollectionEntry, 'registry'>): string {
    const registry = entry.registry;
    return registry !== undefined && Object.hasOwn(REGISTRY_SHAPES, registry)
        ? REGISTRY_SHAPES[registry as keyof typeof REGISTRY_SHAPES].list
        : 'entries';
}

/**
 * What a read collection carries from its entry: its registry, its flags, what Disseminated in
 * leaves out, its ticker reading, and the entry's position in the list.
 */
function traitsOf(entry: CollectionEntry, index: number): CollectionTraits & { index: number } {
    const traits: CollectionTraits & { index: number } = { index };
    if (entry.registry !== undefined) traits.registry = entry.registry;
    for (const flag of COLLECTION_FLAGS) if (entry[flag] === true) traits[flag] = true;
    if (entry.dissemination_skip !== undefined)
        traits.dissemination_skip = entry.dissemination_skip;
    if (entry.ticker !== undefined) traits.ticker = entry.ticker;
    return traits;
}

/**
 * One collection: its entries in file order with provenance, and every other top-level key as meta.
 */
function readCollection(
    hub: string,
    asked: CollectionEntry,
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
    if (data === null) return { key: asked.key, file, meta: {}, entries: [] };
    const listName = listKey(asked);

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
 * Read the collection files named, keyed by the key each was named under, each with its entry's
 * traits and its position in `files`. An entry keeps every field the YAML gave it plus
 * `provenance`, and its identity is left as read: nothing here decides whether a record is known by
 * its `key` or its `title`. A file that is missing, does not parse, is not a map, or has no entry
 * list gives an empty collection and one finding; an entry that is not a map is one finding and no
 * record. Two entries for the same key is a finding on the second and the first file is the one
 * read, so the returned map has one collection per key. An entry `unnamed` answers true for is one
 * the hub's own config does not name, so its file being absent raises no finding.
 */
export function readCollections(
    hub: string,
    files: readonly CollectionEntry[],
    catalog: TextCatalog,
    unnamed: (entry: CollectionEntry) => boolean = () => false
): { collections: Record<string, ReadCollection>; findings: Finding[] } {
    const findings: Finding[] = [];
    const collections: Record<string, ReadCollection> = {};
    files.forEach((asked, index) => {
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
            return;
        }
        const read = readCollection(hub, asked, catalog, findings, unnamed(asked));
        collections[asked.key] = { ...read, ...traitsOf(asked, index) };
    });
    return { collections, findings };
}
