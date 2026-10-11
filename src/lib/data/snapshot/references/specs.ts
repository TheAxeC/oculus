// Layer 1, data. Where the values that name hub keys stand in each kind of file, read from the
// schemas themselves and from nothing else: a field whose `from` names a source is a place a key
// is written, and the source says which keys are valid there.
//
// The hub's data files, the manifests and the decks come from the
// `SchemaField`s of their schemas (`records` fields nested at any depth, a `map` field as a map
// from a name to a record, a dotted manifest name such as `status.chips` as a key inside a map).
// The files of oculus's own configuration come from the options catalog, read by
// data/sources/config/catalog/schemas/references.ts into the same nodes.
//
// One rule is stated here and in docs/DATA-MAP.md and applied by name: the keys of the `domains:`
// map of config/catalogs/vocab.yml are references to the domains registry entry of the same key,
// since the map colours and labels the domain the entry defines.
//
// A source is the name a `from` uses: a registry (`venues`), `projects`, `clusters` (the resources
// of kind cluster) or `vocab.<key>`, a list of vocab.yml.

import type { SchemaField } from '../../model/index.ts';
import type { FieldNode } from './model.ts';

/** The prefix of a source that names a list of config/catalogs/vocab.yml. */
export const VOCAB_SOURCE = 'vocab.';

/** A map of fields as a record node, or null when none of its fields names a key. */
export function recordOf(fields: Record<string, FieldNode>): FieldNode | null {
    return Object.keys(fields).length === 0 ? null : { kind: 'record', fields };
}

/** The node of one schema field, or null when nothing in it names a key. */
function nodeOf(field: SchemaField): FieldNode | null {
    if (field.type === 'records' && field.fields !== undefined) {
        const record = schemaRecord(field.fields);
        if (record === null) return null;
        return field.map === true ? { kind: 'named', record } : { kind: 'records', record };
    }
    const from = field.from;
    if (from === undefined) return null;
    if (Array.isArray(from)) return from.length === 0 ? null : { kind: 'leaf', sources: from };
    return { kind: 'leaf', sources: [], picked: from };
}

/** The record node of a list of schema fields. */
export function schemaRecord(fields: SchemaField[]): FieldNode | null {
    const held: Record<string, FieldNode> = {};
    for (const field of fields) {
        const node = nodeOf(field);
        if (node !== null) held[field.field] = node;
    }
    return recordOf(held);
}

/**
 * The node of a hub data file from the fields of its `schema:` block: a list of records under
 * `list` for a file that lists entries, the fields themselves for one that holds sections.
 */
export function fileRecord(
    fields: SchemaField[],
    kind: 'entries' | 'sections',
    list: string
): FieldNode | null {
    const record = schemaRecord(fields);
    if (record === null || kind === 'sections') return record;
    return { kind: 'record', fields: { [list]: { kind: 'records', record } } };
}

/**
 * The node of the manifest schema's fields. A dotted name is a key inside the map the file holds
 * under its first part, as the generated JSON Schema reads it.
 */
export function manifestRecord(fields: SchemaField[]): FieldNode | null {
    const top: Record<string, FieldNode> = {};
    const inner = new Map<string, Record<string, FieldNode>>();
    for (const field of fields) {
        const node = nodeOf(field);
        if (node === null) continue;
        const dot = field.field.indexOf('.');
        if (dot < 0) {
            top[field.field] = node;
            continue;
        }
        const prefix = field.field.slice(0, dot);
        const held = inner.get(prefix) ?? {};
        held[field.field.slice(dot + 1)] = node;
        inner.set(prefix, held);
    }
    for (const [prefix, held] of inner) top[prefix] = { kind: 'record', fields: held };
    return recordOf(top);
}

/** The node of the `domains:` map of vocab.yml: its keys are references to the domains registry. */
export function vocabRecord(): FieldNode {
    return {
        kind: 'record',
        fields: { domains: { kind: 'named', record: null, keys: ['domains'] } }
    };
}

/** Every source a node names, for the lists of vocab.yml the index must define. */
export function sourcesOf(node: FieldNode | null, into = new Set<string>()): Set<string> {
    if (node === null) return into;
    switch (node.kind) {
        case 'leaf':
            for (const source of node.sources) into.add(source);
            for (const source of Object.values(node.picked?.sources ?? {})) into.add(source);
            break;
        case 'record':
            for (const inner of Object.values(node.fields)) sourcesOf(inner, into);
            break;
        case 'records':
            sourcesOf(node.record, into);
            break;
        case 'family':
            sourcesOf(node.key ?? null, into);
            sourcesOf(node.record, into);
            sourcesOf(node.value ?? null, into);
            break;
        case 'named':
            for (const source of node.keys ?? []) into.add(source);
            sourcesOf(node.record, into);
            break;
    }
    return into;
}
