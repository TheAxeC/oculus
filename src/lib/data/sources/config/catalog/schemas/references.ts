// Layer 1, data. The options catalog as the places that name a hub key, for the reference index
// (data/snapshot/references/): an option or a field of an options family whose `from` names a list
// of the hub (`domains`, `clusters`) or a vocabulary list the catalog reads from vocab.yml
// (`project_types`, `status_chips`, `entry_statuses`) is a place a key is written. A file of
// oculus's own configuration that has such an option is read as a record of those places; a file
// with none is not read.
//
// The fields of a family are walked as schemas/options.ts walks them (a list of records, or a map
// from its `key` to a record, a list or one value), so what the editor checks and what the index
// follows are the same places.

import { VOCAB_SOURCE, recordOf } from '../../../../snapshot/references/specs.ts';
import type { FieldNode, OptionFile } from '../../../../snapshot/references/model.ts';
import type { Catalog, CatalogEntry, FieldSpec } from '../options.ts';
import { isPairs, withoutKey } from './options.ts';

/**
 * The options catalog's words for a list, as the sources the index follows. A word outside this
 * table (`models`, `rail_pages`, `slide_tags`, which has no list of keys) names no source the index
 * holds, so the places that use it are no references.
 */
const OPTION_SOURCES: Record<string, string | undefined> = {
    domains: 'domains',
    clusters: 'clusters',
    project_types: `${VOCAB_SOURCE}type_color`,
    status_chips: `${VOCAB_SOURCE}status_legend`,
    entry_statuses: `${VOCAB_SOURCE}status_palette`
};

/** The leaf an options field or option makes, or null when its `from` names no source held. */
function optionLeaf(spec: Pick<FieldSpec, 'from'>): FieldNode | null {
    const from = spec.from;
    if (from === undefined) return null;
    if (Array.isArray(from)) {
        const sources = from.flatMap((word) => OPTION_SOURCES[word] ?? []);
        return sources.length === 0 ? null : { kind: 'leaf', sources };
    }
    const picked: Record<string, string> = {};
    for (const [word, source] of Object.entries(from.sources)) {
        const mapped = OPTION_SOURCES[source];
        if (mapped !== undefined) picked[word] = mapped;
    }
    return Object.keys(picked).length === 0
        ? null
        : { kind: 'leaf', sources: [], picked: { field: from.field, sources: picked } };
}

/** The record node of the fields of an options family, a nested family as a list of records. */
function optionRecord(fields: Record<string, FieldSpec>): FieldNode | null {
    const held: Record<string, FieldNode> = {};
    for (const [name, spec] of Object.entries(fields)) {
        if (spec.fields !== undefined) {
            const inner = optionRecord(spec.fields);
            if (inner !== null) held[name] = { kind: 'records', record: inner };
            continue;
        }
        const leaf = optionLeaf(spec);
        if (leaf !== null) held[name] = leaf;
    }
    return recordOf(held);
}

/** The node of an options family: a list of records, or a map from its `key` to a record. */
function familyNode(entry: CatalogEntry): FieldNode | null {
    const fields = entry.fields ?? {};
    if (!('key' in fields)) {
        const record = optionRecord(fields);
        return record === null ? null : { kind: 'records', record };
    }
    const key = optionLeaf(fields.key) ?? undefined;
    const rest = withoutKey(fields);
    const lists = entry.holds === 'lists';
    if (isPairs(fields)) {
        const value = optionLeaf(fields.value) ?? undefined;
        if (key === undefined && value === undefined) return null;
        return { kind: 'family', key, record: null, value, lists };
    }
    const record = optionRecord(rest);
    if (key === undefined && record === null) return null;
    return { kind: 'family', key, record, lists };
}

/** Put a node at a dotted option path inside a record's fields, the maps on the way made. */
function place(held: Record<string, FieldNode>, path: string[], node: FieldNode): void {
    const [first, ...rest] = path;
    if (rest.length === 0) {
        held[first] = node;
        return;
    }
    const inner = first in held ? held[first] : undefined;
    const into =
        inner?.kind === 'record' ? inner : ({ kind: 'record', fields: {} } satisfies FieldNode);
    held[first] = into;
    place(into.fields, rest, node);
}

/**
 * The node of one config file from its options-catalog entries, or null when no option or field
 * of it names a source the index holds. An option's key path is dotted: `slurm.resource` is the
 * key `resource` inside the map `slurm`.
 */
function optionsRecord(entries: Record<string, CatalogEntry>): FieldNode | null {
    const held: Record<string, FieldNode> = {};
    for (const [path, entry] of Object.entries(entries)) {
        const node = entry.fields === undefined ? optionLeaf(entry) : familyNode(entry);
        if (node !== null) place(held, path.split('.'), node);
    }
    return recordOf(held);
}

/** The file of the options catalog the machine's own keys are in, which the index never reads. */
const LOCAL_FILE = 'local.yml';

/** The files of the options catalog that name a hub key, each with the node that reads it. */
export function optionFiles(catalog: Catalog): OptionFile[] {
    const files: OptionFile[] = [];
    for (const [path, entries] of Object.entries(catalog)) {
        if (path === LOCAL_FILE) continue;
        const spec = optionsRecord(entries);
        if (spec !== null) files.push({ path, spec });
    }
    return files;
}
