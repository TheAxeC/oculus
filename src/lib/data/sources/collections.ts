// Layer 1, data. Reads the hub's collection files into raw entries with provenance.
// Server side only: it reads the filesystem and no client module may import it.
// It validates nothing and resolves nothing. Every failure is a Finding; nothing here throws, so a
// missing or broken collection costs its own entries and no more.
//
// A collection is a hub file of like records: datasets, statements, funding schemes, talks,
// teaching, applications, collaborations, tasks or repositories. Five are also registries and are
// carried as entities; this reader knows that the data registry lists records under `datasets:` and
// every other collection lists them under `entries:`.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { byKey } from '../guards.ts';
import { parse } from 'yaml';
import type { CollectionFile, Finding, RawCollection, RawEntry } from '../model.ts';

/** A key and a hub-relative path from the `collections:` list; declared with the other types. */
export type { CollectionFile } from '../model.ts';

/** The record-list key, including the dataset registry's established exception. */
function listKey(key: string): string {
    return key === 'data' ? 'datasets' : 'entries';
}

function empty(key: string, file: string): RawCollection {
    return { key, file, meta: {}, entries: [] };
}

/** Read and parse one collection file. A map is returned; anything else is a finding and null. */
function readFile(file: string, findings: Finding[]): Record<string, unknown> | null {
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        findings.push({ file, key: '', message: 'collection file does not exist' });
        return null;
    }
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        findings.push({ file, key: '', message: `does not parse: ${message}` });
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        findings.push({ file, key: '', message: 'is not a map of keys' });
        return null;
    }
    return parsed as Record<string, unknown>;
}

/** One collection: its entries in file order with provenance, and every other top-level key as meta. */
function readCollection(hub: string, asked: CollectionFile, findings: Finding[]): RawCollection {
    const file = join(hub, asked.file);
    const data = readFile(file, findings);
    if (data === null) return empty(asked.key, file);
    const listName = listKey(asked.key);

    const meta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (key !== listName) meta[key] = value;
    }

    const list = data[listName];
    if (!Array.isArray(list)) {
        const had = listName in data ? 'is not a list' : 'is missing';
        findings.push({ file, key: listName, message: `entry list ${listName} ${had}` });
        return { key: asked.key, file, meta, entries: [] };
    }

    const entries: RawEntry[] = [];
    list.forEach((item: unknown, index: number) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            findings.push({
                file,
                key: `${listName}[${index}]`,
                message: 'entry is not a map of keys'
            });
            return;
        }
        entries.push({ ...(item as Record<string, unknown>), provenance: { file, index } });
    });

    return { key: asked.key, file, meta, entries };
}

/**
 * Read the collection files named, keyed by the key each was named under. An entry keeps every
 * field the YAML gave it plus `provenance`, and its identity is left as read: nothing here decides
 * whether a record is known by its `key` or its `title`. A file that is missing, does not parse,
 * is not a map, or has no entry list gives an empty collection and one finding; an entry that is
 * not a map is one finding and no record. Two callers' entries for the same key is a finding and
 * the later file wins, so the returned map has one collection per key.
 */
export function readCollections(
    hub: string,
    files: CollectionFile[]
): { collections: Record<string, RawCollection>; findings: Finding[] } {
    const findings: Finding[] = [];
    const collections: Record<string, RawCollection> = {};
    for (const asked of files) {
        const seen = byKey(collections, asked.key);
        if (seen !== undefined) {
            findings.push({
                file: join(hub, asked.file),
                key: asked.key,
                message: `collection key ${asked.key} is already read from ${seen.file}`
            });
        }
        collections[asked.key] = readCollection(hub, asked, findings);
    }
    return { collections, findings };
}
