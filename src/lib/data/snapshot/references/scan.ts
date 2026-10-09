// Layer 1, data. One file's text read for the places that name a key and the places that define
// one, by the spec of its kind (specs.ts) and what the file defines (model.ts `Defines`).
//
// The text is parsed with `yaml`; every scalar keeps its range, which is turned into the
// protocol's positions here: a line and a character in UTF-16 units over the file's own line ends,
// counted as `prose/text-edits.ts` counts them, with a leading byte order mark left out so line 0
// reads as Monaco and `lsp-edit` read it. A span is the scalar inside its quotes; a CRLF text, a
// non-ASCII or an astral character before a key all give exact columns.
//
// A scalar reached through an alias is one reference, at the scalar the anchor sits on. A scalar
// that is empty, is written as a block, or runs over more than one line is no key. A file of
// several YAML documents gives the places of every document; a file that does not parse as YAML
// gives none and is marked `unparsed`, so a rename can refuse to edit around it.

import { isAlias, isMap, isScalar, isSeq, parseAllDocuments } from 'yaml';
import type { Document, Node, Pair, Scalar, YAMLMap } from 'yaml';
import { scalar } from '../../helpers/guards.ts';
import { lineStarts, withoutMark } from '../../prose/text-edits.ts';
import type {
    Candidate,
    Definition,
    FieldNode,
    FileId,
    FileScan,
    KeyStyle,
    Mention,
    Place,
    Reading
} from './model.ts';
import { VOCAB_SOURCE } from './specs.ts';

/** What one scan collects while it walks a document. */
type Walk = {
    doc: Document;
    text: string;
    starts: number[];
    candidates: Candidate[];
    definitions: Definition[];
    /** The offsets of the scalars already taken, so one reached by an alias is taken once. */
    seen: Set<number>;
};

/** The position of an offset: the last line that starts at or before it, and the rest. */
function placeAt(starts: number[], offset: number): Place {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (starts[mid] <= offset) low = mid;
        else high = mid - 1;
    }
    return { line: low, character: offset - starts[low] };
}

/** How a scalar node is written, or null for a block scalar, which is no key. */
function styleOf(node: Scalar): KeyStyle | null {
    switch (node.type) {
        case 'PLAIN':
            return 'plain';
        case 'QUOTE_DOUBLE':
            return 'double';
        case 'QUOTE_SINGLE':
            return 'single';
        default:
            return null;
    }
}

/** The mention a scalar node is, or null when it is empty, a block or over more than one line. */
function mentionOf(walk: Walk, node: Scalar): Mention | null {
    const value = scalar(node.value);
    const style = styleOf(node);
    const range = node.range;
    if (value === '' || style === null || !range) return null;
    const [from, to] = range;
    if (walk.text.slice(from, to).includes('\n')) return null;
    const quote = style === 'plain' ? 0 : 1;
    const span = {
        start: placeAt(walk.starts, from + quote),
        end: placeAt(walk.starts, to - quote)
    };
    return { span, value, style };
}

/** The node a value is: an alias is followed to the node its anchor sits on. */
function followed(walk: Walk, node: unknown): Node | null {
    if (isAlias(node)) return node.resolve(walk.doc) ?? null;
    return (node as Node | null) ?? null;
}

/** The value of a key of a map, followed through an alias. */
function valueOf(walk: Walk, map: YAMLMap, name: string): Node | null {
    return followed(walk, map.get(name, true));
}

/** The pairs of a map that has a scalar key. */
function pairsOf(map: YAMLMap): Pair<Scalar>[] {
    return map.items.filter((pair): pair is Pair<Scalar> => isScalar(pair.key));
}

/** The sources of a leaf, the other field of its record picking among them when it is `picked`. */
function sourcesOfLeaf(
    walk: Walk,
    node: Extract<FieldNode, { kind: 'leaf' }>,
    parent: YAMLMap | null
): string[] {
    if (node.picked === undefined) return node.sources;
    if (parent === null) return [];
    const word = valueOf(walk, parent, node.picked.field);
    const source = isScalar(word) ? node.picked.sources[scalar(word.value)] : undefined;
    return source === undefined ? [] : [source];
}

/** A scalar taken as a place that names a key of these sources. */
function take(walk: Walk, node: unknown, sources: string[]): void {
    if (sources.length === 0 || !isScalar(node) || !node.range) return;
    if (walk.seen.has(node.range[0])) return;
    const mention = mentionOf(walk, node);
    if (mention === null) return;
    walk.seen.add(node.range[0]);
    walk.candidates.push({ ...mention, sources });
}

/** The places a value holds under a node of the spec; `parent` is the map the value is in. */
function visit(walk: Walk, value: unknown, spec: FieldNode, parent: YAMLMap | null): void {
    const node = followed(walk, value);
    if (node === null) return;
    switch (spec.kind) {
        case 'leaf': {
            const sources = sourcesOfLeaf(walk, spec, parent);
            if (isSeq(node)) {
                for (const item of node.items) take(walk, followed(walk, item), sources);
            } else {
                take(walk, node, sources);
            }
            return;
        }
        case 'record':
            if (isMap(node)) visitRecord(walk, node, spec.fields);
            return;
        case 'records':
            if (isSeq(node)) {
                for (const item of node.items) visit(walk, item, spec.record, null);
            } else {
                visit(walk, node, spec.record, null);
            }
            return;
        case 'named':
            if (!isMap(node)) return;
            for (const pair of pairsOf(node)) {
                if (spec.keys !== undefined) take(walk, pair.key, spec.keys);
                if (spec.record !== null) visit(walk, pair.value, spec.record, null);
            }
            return;
        case 'family':
            visitFamily(walk, node, spec);
            return;
    }
}

/** The fields of a record that the file holds, each visited by its own node. */
function visitRecord(walk: Walk, map: YAMLMap, fields: Record<string, FieldNode>): void {
    for (const [name, spec] of Object.entries(fields)) {
        visit(walk, map.get(name, true), spec, map);
    }
}

/** The fields a record of a family list has: its key field beside the fields of its value. */
function familyFields(spec: Extract<FieldNode, { kind: 'family' }>): Record<string, FieldNode> {
    const fields: Record<string, FieldNode> = {};
    if (spec.key !== undefined) fields.key = spec.key;
    if (spec.value !== undefined) fields.value = spec.value;
    if (spec.record?.kind === 'record') Object.assign(fields, spec.record.fields);
    return fields;
}

/** An options family: a list of records, or a map from the key to a record, list or value. */
function visitFamily(walk: Walk, node: Node, spec: Extract<FieldNode, { kind: 'family' }>): void {
    if (isSeq(node)) {
        const fields = familyFields(spec);
        for (const item of node.items) {
            const held = followed(walk, item);
            if (isMap(held)) visitRecord(walk, held, fields);
        }
        return;
    }
    if (!isMap(node)) return;
    for (const pair of pairsOf(node)) {
        if (spec.key?.kind === 'leaf') take(walk, pair.key, spec.key.sources);
        if (spec.value !== undefined) {
            visit(walk, pair.value, spec.value, node);
            continue;
        }
        if (spec.record === null) continue;
        const held = followed(walk, pair.value);
        if (spec.lists && isSeq(held)) {
            for (const item of held.items) visit(walk, item, spec.record, null);
        } else {
            visit(walk, held, spec.record, null);
        }
    }
}

/** A scalar taken as a definition of a key in these sources. */
function define(walk: Walk, node: unknown, sources: string[]): void {
    if (!isScalar(node)) return;
    const mention = mentionOf(walk, node);
    if (mention !== null) walk.definitions.push({ ...mention, sources });
}

/** The definitions of the entries a registry file lists under `list`, keyed by `field`. */
function defineRegistry(
    walk: Walk,
    root: YAMLMap,
    defines: Extract<Reading['defines'], { kind: 'registry' }>
): void {
    const list = valueOf(walk, root, defines.list);
    if (!isSeq(list)) return;
    for (const item of list.items) {
        const entry = followed(walk, item);
        if (!isMap(entry)) continue;
        const kind = valueOf(walk, entry, 'kind');
        const cluster =
            defines.source === 'resources' && isScalar(kind) && kind.value === 'cluster';
        const sources = cluster ? [defines.source, 'clusters'] : [defines.source];
        define(walk, entry.get(defines.field, true), sources);
    }
}

/** The definitions of one list of vocab.yml: the texts, the `key` of the maps, or the map keys. */
function defineVocab(walk: Walk, list: unknown, source: string): void {
    const node = followed(walk, list);
    if (isSeq(node)) {
        for (const item of node.items) {
            const held = followed(walk, item);
            define(walk, isMap(held) ? held.get('key', true) : held, [source]);
        }
    } else if (isMap(node)) {
        for (const pair of pairsOf(node)) define(walk, pair.key, [source]);
    }
}

/** The definitions a document gives by what its file defines. */
function defineDocument(walk: Walk, root: YAMLMap, defines: Reading['defines']): void {
    switch (defines.kind) {
        case 'none':
            return;
        case 'registry':
            defineRegistry(walk, root, defines);
            return;
        case 'manifest': {
            const id = root.get('id', true);
            if (isScalar(id) && scalar(id.value) === defines.id) define(walk, id, ['projects']);
            return;
        }
        case 'vocab':
            for (const name of defines.lists) {
                defineVocab(walk, root.get(name, true), `${VOCAB_SOURCE}${name}`);
            }
            return;
    }
}

/** The scan of one file's text by its reading. */
export function scanText(file: FileId, text: string, reading: Reading): FileScan {
    const body = withoutMark(text);
    const scan: FileScan = { file, reading, unparsed: false, references: [], definitions: [] };
    const documents = parseAllDocuments(body);
    if (documents.some((doc) => doc.errors.length > 0)) return { ...scan, unparsed: true };
    const starts = lineStarts(body);
    for (const doc of documents) {
        const root = doc.contents;
        if (!isMap(root)) continue;
        const walk: Walk = {
            doc,
            text: body,
            starts,
            candidates: scan.references,
            definitions: scan.definitions,
            seen: new Set()
        };
        defineDocument(walk, root, reading.defines);
        if (reading.spec !== null) visit(walk, root, reading.spec, null);
    }
    return scan;
}
