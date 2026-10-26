// Layer 1, data. Reads the eight registry files into raw entries with provenance. Server side only:
// it reads the filesystem and no client module may import it. It validates nothing and resolves
// nothing. Every failure is a Finding; nothing here throws, so a missing or broken registry costs
// its own entries and no more.

import { join } from 'node:path';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { REGISTRY_SHAPES } from '../helpers/hub-names.ts';
import { itemsShape, mapShape, readAs } from '../shapes/shapes.ts';
import { keyedSchema } from '../snapshot/schema/field.ts';
import { isAbsent, readYamlMap } from './yaml-file.ts';
import { entryIdOf, primaryKeyOf } from '../model/index.ts';
import type {
    CollectionEntry,
    Finding,
    RawRegistry,
    RawRegistryEntry,
    RegistryFiles,
    RegistryMeta,
    RegistryName
} from '../model/index.ts';

/** The eight hub-relative paths, one per registry; declared with the other types in data/model/. */
export type { RegistryFiles } from '../model/index.ts';

/** The eight registries, in the order they are read. */
export const REGISTRY_NAMES = Object.keys(REGISTRY_SHAPES) as RegistryName[];

/**
 * The path of each registry: the file of the entry of `listed` whose `registry:` names it, else
 * the file of oculus's own entry of it in `defaults` (config/defaults/sources.yml, asked only when
 * `listed` names no entry of a registry), else the empty text.
 */
export function registryFiles(
    listed: readonly CollectionEntry[],
    defaults: () => readonly CollectionEntry[]
): RegistryFiles {
    const fileOf = (list: readonly CollectionEntry[], name: RegistryName): string | undefined =>
        list.find((one) => one.registry === name)?.file;
    const entries = REGISTRY_NAMES.map((name) => [
        name,
        fileOf(listed, name) ?? fileOf(defaults(), name) ?? ''
    ]);
    return Object.fromEntries(entries) as RegistryFiles;
}

function empty(): RawRegistry {
    return { entries: [], meta: {} };
}

/**
 * The field each registry's `collections:` entry of `listed` names as its primary key, which a
 * registry file with no schema is keyed by.
 */
export function registryKeys(
    listed: readonly CollectionEntry[]
): Partial<Record<RegistryName, string>> {
    const keys: Partial<Record<RegistryName, string>> = {};
    for (const name of REGISTRY_NAMES) {
        const named = listed.find((one) => one.registry === name)?.primary_key;
        if (named !== undefined) keys[name] = named;
    }
    return keys;
}

/**
 * One registry: its entries in file order with provenance, and every other top-level key as meta.
 * An entry's `key` is the value of the file's primary key (`primaryKeyOf`, over its schema and
 * `named`, the key its `collections:` entry names); a file with no primary key keys no entry, and
 * the schema run's finding names it once rather than each entry.
 */
function readRegistry(
    hub: string,
    name: RegistryName,
    relPath: string,
    catalog: TextCatalog,
    findings: Finding[],
    unnamed: boolean,
    named: string | undefined
): RawRegistry {
    const shape = REGISTRY_SHAPES[name];
    const file = join(hub, relPath);
    const data = readYamlMap(file, catalog, findings, (error) =>
        unnamed && isAbsent(error) ? null : findingText(catalog, 'findings.registries.file_missing')
    );
    if (data === null) return empty();

    // An own `__proto__` key is skipped: assigning to it would replace the new map's prototype.
    const meta: RegistryMeta = {};
    for (const [key, value] of Object.entries(data)) {
        if (key !== shape.list && key !== '__proto__') meta[key] = value;
    }

    // A list key with nothing under it is an empty list: it is what a file holds after its last
    // entry is deleted, and what one holds that has only comments there.
    const list = data[shape.list] === null ? [] : readAs(itemsShape, data[shape.list]);
    if (list === null) {
        const message =
            shape.list in data
                ? findingText(catalog, 'findings.file.list_not_a_list', shape.list)
                : findingText(catalog, 'findings.file.list_missing', shape.list);
        findings.push({ file, key: shape.list, message });
        return { entries: [], meta };
    }

    const primaryKey = primaryKeyOf(keyedSchema(data.schema), named);
    const entries: RawRegistryEntry[] = [];
    list.forEach((item, index) => {
        const where = `${shape.list}[${index}]`;
        const raw = readAs(mapShape, item);
        if (raw === null) {
            findings.push({
                file,
                key: where,
                message: findingText(catalog, 'findings.file.entry_not_a_map')
            });
            return;
        }
        const key = entryIdOf(raw, primaryKey);
        if (primaryKey !== null && key === '' && shape.idRequired) {
            findings.push({
                file,
                key: where,
                message: findingText(catalog, 'findings.registries.entry_no_id', primaryKey)
            });
        }
        entries.push({ ...raw, registry: name, key, file });
    });

    return primaryKey === null ? { entries, meta } : { entries, meta, primaryKey };
}

/**
 * Read the eight registries. Each returns its entries and the file's other top-level keys as
 * `meta`, both untouched apart from the `registry`, `key` and `file` provenance added to every
 * entry. A file that is missing, does not parse, is not a map, or has no entry list gives an empty
 * list and one finding; nothing here throws and no entry is repaired. A registry in `unnamed`, one
 * the hub's own config does not name, raises no finding when its file is absent. `keys` holds the
 * primary key each registry's `collections:` entry names (`registryKeys`).
 */
export function readRegistries(
    hub: string,
    files: RegistryFiles,
    catalog: TextCatalog,
    unnamed: readonly RegistryName[] = [],
    keys: Partial<Record<RegistryName, string>> = {}
): Record<RegistryName, RawRegistry> & { findings: Finding[] } {
    const findings: Finding[] = [];
    const out = {} as Record<RegistryName, RawRegistry>;
    for (const name of REGISTRY_NAMES) {
        const unread = unnamed.includes(name);
        out[name] = readRegistry(hub, name, files[name], catalog, findings, unread, keys[name]);
    }
    return { ...out, findings };
}
