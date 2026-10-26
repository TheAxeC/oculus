// Layer 1, data. Where the values that name hub keys stand in each kind of file, read from the
// schemas themselves and from nothing else: a field whose `foreign_key:` names a target is a place
// a key is written, and the target says which keys are valid there.
//
// The hub's data files, the manifests and the decks come from the
// `SchemaField`s of their schemas (`records` fields nested at any depth, a `map` field as a map
// from a name to a record, a dotted manifest name such as `status.chips` as a key inside a map).
// The files of oculus's own configuration come from the options catalog, read by
// data/sources/config/catalog/schemas/references.ts into the same nodes.
//
// A source is the name the index gives a target: a registry (`venues`), the key of a collection
// that carries no registry (`events`), `projects`, `clusters` (the resources of kind cluster) or
// `vocab.<key>`, a list of vocab.yml. A `foreign_key:` names a collection by its key in the hub's
// `collections:` list, which a `TargetNames` turns into the registry the collection carries, so
// the options catalog's `from: people` and a field's `foreign_key: people` name one source. A field
// of a hub file's own schema whose `options:` hold a `{ key, label }` row (the `themes` field of
// the venues and data registries) takes its keys from those options: its source is `optionSource`
// of the file and the field, and the rows' keys in the schema are the definitions (scan.ts).

import { optionKey, type SchemaField } from '../../model/index.ts';
import type { FieldNode } from './model.ts';

/** The source a `foreign_key:` target is named by in the index. */
export type TargetNames = (target: string) => string;

/** The names of a schema whose targets are named by themselves, the deck's `projects`. */
const ownNames: TargetNames = (target) => target;

/** The prefix of a source that names a list of config/catalogs/vocab.yml. */
export const VOCAB_SOURCE = 'vocab.';

/** A map of fields as a record node, or null when none of its fields names a key. */
export function recordOf(fields: Record<string, FieldNode>): FieldNode | null {
    return Object.keys(fields).length === 0 ? null : { kind: 'record', fields };
}

/** The prefix of the source a field's own option rows define. */
const OPTION_SOURCE = 'options:';

/** The source of the option rows of `field` in the schema of the hub file at `path`. */
export function optionSource(path: string, field: string): string {
    return `${OPTION_SOURCE}${path}#${field}`;
}

/** Whether a field's options hold a `{ key, label }` row, which makes its options a source. */
export function hasOptionRows(field: SchemaField): boolean {
    return (field.options ?? []).some((one) => typeof one !== 'string' && optionKey(one) !== '');
}

/**
 * The node of one schema field, or null when nothing in it names a key. `owner` is the hub file
 * whose own schema the field is in, whose option rows are then a source of the field; `names` gives
 * the source of each `foreign_key:` target.
 */
function nodeOf(field: SchemaField, names: TargetNames, owner?: string): FieldNode | null {
    if (field.type === 'records' && field.fields !== undefined) {
        const record = schemaRecord(field.fields, names);
        if (record === null) return null;
        return field.map === true ? { kind: 'named', record } : { kind: 'records', record };
    }
    const own =
        owner !== undefined && hasOptionRows(field) ? [optionSource(owner, field.field)] : [];
    const keys = field.foreign_key;
    if (keys === undefined) return own.length === 0 ? null : { kind: 'leaf', sources: own };
    if (Array.isArray(keys)) {
        const sources = [...own, ...keys.map(names)];
        return sources.length === 0 ? null : { kind: 'leaf', sources };
    }
    const picked = Object.entries(keys.sources).map(
        ([word, target]) => [word, names(target)] as const
    );
    return {
        kind: 'leaf',
        sources: own,
        picked: { field: keys.field, sources: Object.fromEntries(picked) }
    };
}

/**
 * The record node of a list of schema fields, the top-level fields of the file `owner`, each
 * target named by `names` (by itself when none is given).
 */
export function schemaRecord(
    fields: SchemaField[],
    names: TargetNames = ownNames,
    owner?: string
): FieldNode | null {
    const held: Record<string, FieldNode> = {};
    for (const field of fields) {
        const node = nodeOf(field, names, owner);
        if (node !== null) held[field.field] = node;
    }
    return recordOf(held);
}

/**
 * The node of a hub data file from the fields of its `schema:` block: a list of records under
 * `list` for a file that lists entries, the fields themselves for one that holds sections. `owner`
 * is the file's path from the hub, which names the sources of its fields' option rows, and `names`
 * gives the source of each `foreign_key:` target.
 */
export function fileRecord(
    fields: SchemaField[],
    kind: 'entries' | 'sections',
    list: string,
    names: TargetNames,
    owner?: string
): FieldNode | null {
    const record = schemaRecord(fields, names, owner);
    if (record === null || kind === 'sections') return record;
    return { kind: 'record', fields: { [list]: { kind: 'records', record } } };
}

/**
 * The node of the manifest schema's fields, each target named by `names`. A dotted name is a key
 * inside the map the file holds under its first part, as the generated JSON Schema reads it.
 */
export function manifestRecord(fields: SchemaField[], names: TargetNames): FieldNode | null {
    const top: Record<string, FieldNode> = {};
    const inner = new Map<string, Record<string, FieldNode>>();
    for (const field of fields) {
        const node = nodeOf(field, names);
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
