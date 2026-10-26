// Layer 1, data. The keys each `foreign_key:` target offers, as they are on disk: the primary key
// of each registry's file, the resources `keptResources` keeps, the project folders' ids, the
// primary keys of the entries of a collection that carries no registry, and the keyed lists of
// config/catalogs/vocab.yml as `vocab.<key>`, or as `vocab.<key>.<field>` for the keys of a map
// whose row carries the field as `true`, a field no row carries as `true` naming no list. An entry
// with no value of its primary key adds nothing. A registry offers the keys the other hubs of the
// workspace hold beside its own (`joinedLists`), since a reference resolves in any hub; a target
// names a collection by its key in the hub's own `collections:` list, which is read as the
// registry it carries (`targetLists`). A key that stands twice in one registry file is reported
// with the file and the key, since a reference to it could mean either entry.

import { basename, join } from 'node:path';
import { LineCounter, isSeq, parseDocument } from 'yaml';
import {
    primaryKeyOf,
    type CollectionEntry,
    type Finding,
    type RawPortfolio,
    type RegistryName
} from '../../model/index.ts';
import { itemWith } from '../../helpers/files/yaml/collection-text.ts';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { mapShape, readAs, textOrNumberOnlyShape } from '../../shapes/shapes.ts';
import { vocabKeys } from '../../shapes/vocab-keys.ts';
import {
    MANIFEST,
    PROJECTS_TARGET,
    REGISTRY_SHAPES,
    VOCAB_PREFIX
} from '../../helpers/hub-names.ts';
import { keptResources } from '../normalise.ts';
import { keyedSchema } from './field.ts';
import type { Lists } from './record.ts';

/**
 * The lists `vocab.<key>` reads, one for each of the vocabulary file's top-level keys, and the
 * lists `vocab.<key>.<field>` reads, one for each field a row of a map carries as `true`.
 */
export function vocabLists(
    merged: Record<string, unknown>,
    keys: readonly string[]
): Record<string, string[]> {
    const lists: Record<string, string[]> = {};
    for (const key of keys) {
        const value = merged[key];
        if (value === undefined) continue;
        lists[key] = vocabKeys(value);
        const rows = readAs(mapShape, value) ?? {};
        const fields = new Set(Object.values(rows).flatMap((row) => flagKeys(row)));
        for (const field of fields) lists[`${key}.${field}`] = vocabKeys(value, field);
    }
    return lists;
}

/** The keys a row that is a map carries as `true`, none for anything else. */
function flagKeys(row: unknown): string[] {
    const map = readAs(mapShape, row) ?? {};
    return Object.keys(map).filter((field) => map[field] === true);
}

/** The eight registries, whose keys the hubs of a workspace share. */
export const REGISTRIES: RegistryName[] = [
    'venues',
    'datasets',
    'pillars',
    'domains',
    'funding',
    'people',
    'organisations',
    'resources'
];

/**
 * The keys of the hub's own records the hubs of a workspace share, by registry name: the eight
 * registries and the projects.
 */
export function hubLists(raw: RawPortfolio): Record<string, string[]> {
    const lists: Record<string, string[]> = {};
    for (const name of REGISTRIES) {
        const entries =
            name === 'resources'
                ? keptResources(raw.registries.resources.entries)
                : raw.registries[name].entries;
        lists[name] = entries.map((entry) => entry.key).filter((key) => key !== '');
    }
    lists.projects = raw.manifests.map((manifest) => manifest.id);
    return lists;
}

/**
 * The sources whose file did not parse, was not a map or held no entry list, so the keys they
 * offer are not known: a registry whose file has a finding on the file or on its entry list, and
 * `projects` when a manifest has a finding on the file.
 */
export function unreadSources(
    raw: RawPortfolio,
    hub: string,
    files: Record<RegistryName, string>
): Set<string> {
    const unread = new Set<string>();
    for (const finding of raw.findings) {
        if (basename(finding.file) === MANIFEST && finding.key === '') unread.add('projects');
        for (const name of REGISTRIES) {
            if (finding.file !== join(hub, files[name])) continue;
            if (finding.key === '' || finding.key === REGISTRY_SHAPES[name].list) unread.add(name);
        }
    }
    return unread;
}

/**
 * The keys each source offers in a hub of a workspace: the hub's own, then the keys the other hubs
 * hold, each once. A reference resolves in its own hub, then in the others, so a key of any hub of
 * the workspace is one a value may name.
 */
export function joinedLists(
    own: Record<string, string[]>,
    others: Readonly<Record<string, readonly string[]>>
): Record<string, string[]> {
    const lists: Record<string, string[]> = { ...own };
    for (const [source, keys] of Object.entries(others)) {
        lists[source] = [...new Set([...(own[source] ?? []), ...keys])];
    }
    return lists;
}

/** The lists a conversion reads: the hub's own and the vocabulary's, by source name. */
export function listsOf(
    hub: Record<string, string[]>,
    vocab: Record<string, string[]>,
    unread: ReadonlySet<string> = new Set()
): Lists {
    return (source) => {
        if (unread.has(source)) return null;
        if (source.startsWith(VOCAB_PREFIX)) return vocab[source.slice(VOCAB_PREFIX.length)];
        return Object.hasOwn(hub, source) ? hub[source] : undefined;
    };
}

/** Whether a `foreign_key:` target names itself: `projects`, or a vocabulary list. */
function selfNamed(target: string): boolean {
    return target === PROJECTS_TARGET || target.startsWith(VOCAB_PREFIX);
}

/**
 * The registry the collection a `foreign_key:` target names carries, in a hub whose
 * `collections:` list is `collections`; undefined for `projects`, a vocabulary list, a key no
 * entry of the list has and a collection that carries no registry.
 */
export function targetRegistry(
    target: string,
    collections: readonly Pick<CollectionEntry, 'key' | 'registry'>[]
): RegistryName | undefined {
    if (selfNamed(target)) return undefined;
    const registry = collections.find((one) => one.key === target)?.registry;
    return REGISTRIES.find((name) => name === registry);
}

/**
 * What a `foreign_key:` target names in a hub whose `collections:` list is `collections`: the
 * registry a collection key's entry carries, or the key itself for a collection that carries none;
 * `projects` and a vocabulary list name themselves, whatever collection is keyed so, and a target
 * no entry of the list keys names nothing (undefined). The reference index names a target by it,
 * so a value of a field `foreign_key: people` and an option of `from: people` are one definition.
 */
export function targetName(
    target: string,
    collections: readonly Pick<CollectionEntry, 'key' | 'registry'>[]
): string | undefined {
    if (selfNamed(target)) return target;
    if (!collections.some((one) => one.key === target)) return undefined;
    return targetRegistry(target, collections) ?? target;
}

/**
 * The lists a hub's schemas read by `foreign_key:` target: `projects`, a vocabulary list and the
 * registry a collection carries from `lists` (`listsOf` over the joined registry lists and the
 * vocabulary), and for a collection that carries no registry the primary keys its own entries
 * hold, read from `raw`; a collection whose file has no primary key, or was not read, holds its
 * values to no list (null), the schema run's finding naming it. A target no entry of
 * `collections` keys names no list (undefined).
 */
export function targetLists(
    raw: RawPortfolio,
    collections: readonly CollectionEntry[],
    lists: Lists
): Lists {
    return (target) => {
        if (selfNamed(target)) return lists(target);
        if (!collections.some((one) => one.key === target)) return undefined;
        const registry = targetRegistry(target, collections);
        if (registry !== undefined) return lists(registry);
        if (!Object.hasOwn(raw.collections, target)) return null;
        const held = raw.collections[target];
        const key = primaryKeyOf(keyedSchema(held.meta.schema), held.primary_key);
        if (key === null) return null;
        return held.entries
            .map((entry) => readAs(textOrNumberOnlyShape, entry[key]) ?? '')
            .filter((value) => value !== '');
    };
}

/** The line of the n-th (from 0) item of a file's list whose `field` is `key`, or undefined. */
function lineOfItem(
    text: string,
    list: string,
    field: string,
    key: string,
    nth: number
): number | undefined {
    const lines = new LineCounter();
    const doc = parseDocument(text, { lineCounter: lines });
    const seq = doc.get(list, true);
    if (!isSeq(seq)) return undefined;
    const found = itemWith(seq, field, key, nth);
    return found?.held.range == null ? undefined : lines.linePos(found.held.range[0]).line;
}

/**
 * One finding for each key a registry file holds twice in its primary key, on the second place it
 * stands. `textOf` gives the text of a registry file, which the line is read from.
 */
export function duplicateKeys(
    raw: RawPortfolio,
    catalog: TextCatalog,
    textOf: (file: string) => string | undefined
): Finding[] {
    const findings: Finding[] = [];
    for (const name of REGISTRIES) {
        const shape = REGISTRY_SHAPES[name];
        const field = raw.registries[name].primaryKey;
        if (field === undefined) continue;
        const seen = new Map<string, number>();
        raw.registries[name].entries.forEach((entry, index) => {
            if (entry.key === '') return;
            const before = seen.get(entry.key) ?? 0;
            seen.set(entry.key, before + 1);
            if (before === 0) return;
            const text = textOf(entry.file);
            const line =
                text === undefined
                    ? undefined
                    : lineOfItem(text, shape.list, field, entry.key, before);
            findings.push({
                file: entry.file,
                key: `${shape.list}[${index}].${field}`,
                message: findingText(catalog, 'findings.schema.duplicate_key', entry.key),
                ...(line === undefined ? {} : { line })
            });
        });
    }
    return findings;
}
