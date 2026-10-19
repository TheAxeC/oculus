// Layer 1, data. The keys each `from:` source offers, as they are on disk: the identity field of
// each registry (`SHAPES` of sources/registries.ts), the resources `keptResources` keeps, the
// project folders' ids, and the keyed lists of config/catalogs/vocab.yml as `vocab.<key>`, or as
// `vocab.<key>.<field>` for the keys of a map whose row carries the field as `true`, a field no
// row carries as `true` naming no list. A funding entry with no `key` adds nothing. A key that
// stands twice in one registry file is reported with the file and the key, since a reference to
// it could mean either entry.

import { basename, join } from 'node:path';
import { LineCounter, isSeq, parseDocument } from 'yaml';
import type { Finding, RawPortfolio, RegistryName } from '../../model/index.ts';
import { itemWith } from '../../helpers/files/yaml/collection-text.ts';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { mapShape, readAs } from '../../shapes/shapes.ts';
import { vocabKeys } from '../../shapes/vocab-keys.ts';
import { MANIFEST, REGISTRY_SHAPES } from '../../helpers/hub-names.ts';
import { keptResources } from '../normalise.ts';
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

/** The prefix of a source that names a keyed list of config/catalogs/vocab.yml. */
export const VOCAB_PREFIX = 'vocab.';

/** The eight registries a `from:` may name. */
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

/** The sources of the hub's own files: the eight registries and the projects. */
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
 * One finding for each key a registry file holds twice, on the second place it stands. `textOf`
 * gives the text of a registry file, which the line is read from.
 */
export function duplicateKeys(
    raw: RawPortfolio,
    catalog: TextCatalog,
    textOf: (file: string) => string | undefined
): Finding[] {
    const findings: Finding[] = [];
    for (const name of REGISTRIES) {
        const shape = REGISTRY_SHAPES[name];
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
                    : lineOfItem(text, shape.list, shape.idField, entry.key, before);
            findings.push({
                file: entry.file,
                key: `${shape.list}[${index}].${shape.idField}`,
                message: findingText(catalog, 'findings.schema.duplicate_key', entry.key),
                ...(line === undefined ? {} : { line })
            });
        });
    }
    return findings;
}
