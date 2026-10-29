// Layer 2, server, pure. The edits of a YAML file over its bytes for the writers whose keys sit
// deeper than the manifest's two levels: one key at any depth set or taken out (a deck's
// `groups.<group>.find`, a key of the third entry of `launch.yml`'s `configurations`), and an entry
// added to a list or taken out of it. Every other byte of the file is kept.
//
// A path names a key of a map by its name and an entry of a list by its place. The node is found
// through parseDocument's byte ranges, as yaml-edit.ts finds a manifest field, and its parts are
// written by the same renderers: a value the file holds is replaced in its own bytes
// (replaceValue: a scalar in its quoting, a list in its flow or block style), a map the file holds
// is written key by key so its flow or block style and its comments stay, and a key the file does
// not hold is added after the last key of the map that should hold it, on one line in a flow map
// and as block lines in a block one. A map left with no key is taken out with its last key, up to
// the entry of a list or the top of the file, since `key:` with nothing under it reads as null
// rather than as a map. An entry is added after the last one of its list, in the list's own flow or
// block style, the list made when the file holds none; a list left with no entry is written `[]`.
//
// A file with no nested block map yet is written at the hub's four spaces. What is written is not
// checked here; the caller reads the result back against what it meant.

import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isNode, isScalar, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { fields } from '../../../../data/helpers/guards.ts';
import { renderScalar } from '../../../../data/helpers/files/yaml/collection-text.ts';
import {
    columnOf,
    lineEndAfter,
    lineStart,
    mapIndent,
    pairEnd,
    pairOf,
    rangeOf,
    valueEnd
} from '../../../../data/helpers/files/yaml/yaml-ranges.ts';
import { asFieldValue, removeFlowChild, removePair, replaceValue, splice } from './yaml-edit.ts';
import type { Written } from './yaml-edit.ts';
import { isBlockMap } from './yaml-values.ts';
import type { BlockMap, BlockValue } from './yaml-values.ts';

/** A path into a file: a key of a map by its name, an entry of a list by its place. */
export type KeyPath = readonly (string | number)[];

/** The indentation of a file that holds no nested block map to copy. */
const HUB_INDENT = 4;

/** The text a step wrote, or null when it wrote nothing. */
function textOf(written: Written): string | null {
    return 'why' in written ? null : written.text;
}

/** A value on one line, a map as a flow map and a list as a flow list. */
function oneLine(value: BlockValue): string | null {
    if (isBlockMap(value)) {
        const parts = Object.entries(value).map(([key, inner]) => {
            const rendered = oneLine(inner);
            return rendered === null ? null : `${renderScalar(key)}: ${rendered}`;
        });
        if (parts.includes(null)) return null;
        return parts.length === 0 ? '{}' : `{ ${parts.join(', ')} }`;
    }
    if (Array.isArray(value)) {
        const items = value.map(oneLine);
        return items.includes(null) ? null : `[${items.join(', ')}]`;
    }
    const rendered = renderScalar(value);
    return rendered.includes('\n') ? null : rendered;
}

/**
 * A map as block lines at a column, a map inside it a step further in and every other value on its
 * key's line, or null when a value cannot be written on one line. `first` is put before the first
 * line's key in place of its padding, the `- ` of a list entry.
 */
function blockLines(
    value: BlockMap,
    column: number,
    step: number,
    first?: string
): string[] | null {
    const pad = ' '.repeat(column);
    const lines: string[] = [];
    for (const [key, inner] of Object.entries(value)) {
        const lead = lines.length === 0 && first !== undefined ? first : pad;
        if (isBlockMap(inner) && Object.keys(inner).length > 0) {
            const below = blockLines(inner, column + step, step);
            if (below === null) return null;
            lines.push(`${lead}${renderScalar(key)}:`, ...below);
            continue;
        }
        const rendered = oneLine(inner);
        if (rendered === null) return null;
        lines.push(`${lead}${renderScalar(key)}: ${rendered}`);
    }
    return lines;
}

/** The step the file nests its block maps by. */
function stepOf(root: YAMLMap, text: string): number {
    const nests = root.items.some((item) => {
        const value = (item as Pair<Scalar, Node>).value;
        return isYamlMap(value) && value.flow !== true;
    });
    return nests ? mapIndent(root, text) : HUB_INDENT;
}

/**
 * The node each part of a path is found in, the top of the file first, and the depth of the first
 * key the file does not hold (the length of the path when it holds every part but the last). Null
 * when a part names a node of another kind than it is: a name in a list, a place in a map, a place
 * no entry stands at, or an entry that is no map.
 */
function holders(
    root: YAMLMap,
    path: KeyPath
): { nodes: (YAMLMap | YAMLSeq)[]; missing: number } | null {
    const nodes: (YAMLMap | YAMLSeq)[] = [root];
    for (const [depth, part] of path.slice(0, -1).entries()) {
        const node = nodes[depth];
        const next = path[depth + 1];
        let found: unknown;
        if (typeof part === 'number') {
            if (!isSeq(node)) return null;
            found = node.items[part];
            if (found === undefined) return null;
        } else {
            if (!isYamlMap(node)) return null;
            const pair = pairOf(node, part);
            if (pair === undefined) return { nodes, missing: depth };
            found = pair.value;
        }
        if (typeof next === 'number' ? !isSeq(found) : !isYamlMap(found)) return null;
        nodes.push(found as YAMLMap | YAMLSeq);
    }
    return { nodes, missing: path.length - 1 };
}

/** The value `{ a: { b: value } }` the keys of a path below a missing map put in its place. */
function nested(path: KeyPath, value: BlockValue): BlockValue | null {
    let out = value;
    for (const key of [...path].reverse()) {
        if (typeof key === 'number') return null;
        out = { [key]: out };
    }
    return out;
}

/** One key added to a map after its last key, in the map's flow or block style. */
function addKey(
    text: string,
    map: YAMLMap,
    step: number,
    name: string,
    value: BlockValue
): string | null {
    const range = rangeOf(map);
    if (range === null) return null;
    if (map.flow === true) {
        const rendered = oneLine(value);
        if (rendered === null) return null;
        if (map.items.length === 0) {
            return splice(text, range[0], range[1], `{ ${name}: ${rendered} }`);
        }
        const end = pairEnd(map.items[map.items.length - 1] as Pair<Scalar, Node>);
        return end === null ? null : splice(text, end, end, `, ${name}: ${rendered}`);
    }
    if (map.items.length === 0) return null;
    const last = pairEnd(map.items[map.items.length - 1] as Pair<Scalar, Node>);
    if (last === null) return null;
    const column = columnOf(text, rangeOf(map.items[0].key)?.[0] ?? range[0]);
    const lines = blockLines({ [name]: value }, column, step);
    if (lines === null) return null;
    const at = lineEndAfter(text, last);
    return splice(text, at, at, `\n${lines.join('\n')}`);
}

/** The key at `path` taken out, and each map above it that holds nothing else. */
function takeOut(text: string, nodes: (YAMLMap | YAMLSeq)[], path: KeyPath): string | null {
    let depth = path.length - 1;
    while (depth > 0 && typeof path[depth - 1] === 'string' && nodes[depth].items.length === 1) {
        depth -= 1;
    }
    const map = nodes[depth];
    const name = path[depth];
    if (!isYamlMap(map) || typeof name !== 'string') return null;
    const pair = pairOf(map, name);
    if (pair === undefined) return null;
    if (map.flow === true) {
        if (map.items.length === 1) {
            const range = rangeOf(map);
            return range === null ? null : splice(text, range[0], range[1], '{}');
        }
        return textOf(removeFlowChild(text, map, map.items.indexOf(pair)));
    }
    return textOf(removePair(text, pair));
}

/**
 * The parsed file and its top map; `empty` for a file that holds no node, nothing or only comments,
 * and null when it does not parse to a map.
 */
function readMap(text: string): { root: YAMLMap; plain: unknown } | 'empty' | null {
    const document = parseDocument(text);
    if (document.errors.length > 0) return null;
    if (document.contents === null) return 'empty';
    const root = document.contents;
    return isYamlMap(root) ? { root, plain: document.toJS() } : null;
}

/** A file that holds no node with lines added after whatever comments it holds. */
function appended(text: string, lines: string[]): string {
    const lead = text === '' || text.endsWith('\n') ? '' : '\n';
    return `${text}${lead}${lines.join('\n')}\n`;
}

/** The value a path holds in the parsed file. */
function valueAt(plain: unknown, path: KeyPath): unknown {
    let held = plain;
    for (const part of path) {
        held =
            typeof part === 'number'
                ? Array.isArray(held)
                    ? held[part]
                    : undefined
                : fields(held)[part];
    }
    return held;
}

/**
 * The text with the key at `path` set to `value`, or taken out when `value` is null; the text
 * itself when the key already holds the value or a key taken out is not there. Null when the file
 * does not parse to a map, a part of the path names a node of another kind, or the value is not
 * one the renderers can write.
 */
export function setKeyPath(text: string, path: KeyPath, value: unknown): string | null {
    const read = readMap(text);
    const name = path.at(-1);
    if (read === null || typeof name !== 'string') return null;
    if (read === 'empty') {
        if (value === null) return text;
        const written = asFieldValue(value);
        const inner = written === undefined || written === null ? null : nested(path, written);
        const lines = isBlockMap(inner) ? blockLines(inner, 0, HUB_INDENT) : null;
        return lines === null ? null : appended(text, lines);
    }
    const found = holders(read.root, path);
    if (found === null) return null;
    const { nodes, missing } = found;
    const step = stepOf(read.root, text);
    if (value === null) {
        if (missing < path.length - 1) return text;
        const map = nodes[missing];
        if (!isYamlMap(map) || pairOf(map, name) === undefined) return text;
        return takeOut(text, nodes, path);
    }
    const written = asFieldValue(value);
    if (written === undefined || written === null) return null;
    const holder = nodes[missing];
    const key = path[missing];
    if (!isYamlMap(holder) || typeof key !== 'string') return null;
    if (missing < path.length - 1) {
        const inner = nested(path.slice(missing + 1), written);
        return inner === null ? null : addKey(text, holder, step, key, inner);
    }
    const pair = pairOf(holder, name);
    if (pair === undefined) return addKey(text, holder, step, name, written);
    const held = pair.value;
    if (held === null) return null;
    if (isBlockMap(written) && Object.keys(written).length === 0) {
        const range = rangeOf(held);
        if (range === null) return null;
        const lead = range[0] === valueEnd(held) && text[range[0] - 1] === ':' ? ' ' : '';
        return splice(text, range[0], valueEnd(held), `${lead}{}`);
    }
    if (isYamlMap(held) && isBlockMap(written)) {
        return intoMap(text, path, fields(valueAt(read.plain, path)), written);
    }
    return textOf(replaceValue(text, held, written));
}

/**
 * A map the file holds given a new value key by key: each key whose value differs is set, then
 * each key the new value does not hold is taken out, so the map is never left empty on the way.
 */
function intoMap(
    text: string,
    path: KeyPath,
    now: Record<string, unknown>,
    value: BlockMap
): string | null {
    let out: string | null = text;
    for (const [key, inner] of Object.entries(value)) {
        if (out === null) return null;
        if (isDeepStrictEqual(now[key], inner)) continue;
        out = setKeyPath(out, [...path, key], inner);
    }
    for (const key of Object.keys(now)) {
        if (out === null) return null;
        if (!(key in value)) out = setKeyPath(out, [...path, key], null);
    }
    return out;
}

/** The list at the top-level key `list`, its pair, or null when the file holds none. */
function listOf(
    root: YAMLMap,
    list: string
): { pair: Pair<Scalar, Node>; seq: YAMLSeq | null } | null {
    const pair = pairOf(root, list);
    if (pair === undefined) return null;
    return { pair, seq: isSeq(pair.value) ? pair.value : null };
}

/**
 * The text with `entry` added as the last entry of the top-level list `list`, in the list's own
 * style: a block list takes it as block lines at its entries' column, a flow list on one line, an
 * empty one or a key with no value as the list's first block entry, and a file with no such key
 * gets the key added at its end. Null when the key holds something other than a list or the entry
 * cannot be written.
 */
export function addListEntry(text: string, list: string, entry: BlockMap): string | null {
    const read = readMap(text);
    if (read === null) return null;
    const step = read === 'empty' ? HUB_INDENT : stepOf(read.root, text);
    const held = read === 'empty' ? null : listOf(read.root, list);
    if (read === 'empty' || held === null) {
        const lines = blockLines(entry, step + 2, step, `${' '.repeat(step)}- `);
        if (lines === null) return null;
        if (read === 'empty') return appended(text, [`${list}:`, ...lines]);
        const body = `${list}:\n${lines.join('\n')}`;
        const end = pairEnd(read.root.items[read.root.items.length - 1] as Pair<Scalar, Node>);
        if (end === null) return null;
        const at = lineEndAfter(text, end);
        return splice(text, at, at, `\n${body}`);
    }
    const { pair, seq } = held;
    const value = pair.value;
    const keyColumn = columnOf(text, rangeOf(pair.key)?.[0] ?? 0);
    if (seq !== null && seq.flow !== true && seq.items.length > 0) {
        const first = rangeOf(seq.items[0]);
        if (first === null) return null;
        const dash = text.lastIndexOf('-', first[0]);
        const column = columnOf(text, dash);
        const lines = blockLines(entry, column + 2, step, `${' '.repeat(column)}- `);
        if (lines === null) return null;
        const at = lineEndAfter(text, valueEnd(seq));
        return splice(text, at, at, `\n${lines.join('\n')}`);
    }
    if (seq !== null && seq.flow === true && seq.items.length > 0) {
        const rendered = oneLine(entry);
        const last = rangeOf(seq.items[seq.items.length - 1]);
        if (rendered === null || last === null) return null;
        return splice(text, last[1], last[1], `, ${rendered}`);
    }
    if (seq === null && !(isScalar(value) && value.value === null)) return null;
    const range = rangeOf(value);
    const key = rangeOf(pair.key);
    if (key === null) return null;
    const column = keyColumn + step;
    const lines = blockLines(entry, column + 2, step, `${' '.repeat(column)}- `);
    if (lines === null) return null;
    const from = key[1] + 1;
    const to = range === null || !isNode(value) ? from : valueEnd(value);
    return splice(text, from, Math.max(from, to), `\n${lines.join('\n')}`);
}

/**
 * The text without the entry at `place` of the top-level list `list`: a block entry's lines taken
 * out, a flow entry with the comma that joined it, and the last entry leaving the list written
 * `[]`. Null when the file holds no such entry.
 */
export function removeListEntry(text: string, list: string, place: number): string | null {
    const read = readMap(text);
    if (read === null || read === 'empty') return null;
    const held = listOf(read.root, list);
    const seq = held?.seq ?? null;
    if (held === null || seq === null || place < 0 || place >= seq.items.length) return null;
    const item = seq.items[place] as Node;
    const range = rangeOf(item);
    if (range === null) return null;
    if (seq.items.length === 1) {
        const key = rangeOf(held.pair.key);
        const whole = rangeOf(seq);
        if (key === null || whole === null) return null;
        if (seq.flow === true) return splice(text, whole[0], whole[1], '[]');
        return splice(text, key[1], lineEndAfter(text, valueEnd(seq)), ': []');
    }
    if (seq.flow === true) {
        if (place > 0) {
            const before = rangeOf(seq.items[place - 1]);
            return before === null ? null : splice(text, before[1], range[1], '');
        }
        const after = rangeOf(seq.items[1]);
        return after === null ? null : splice(text, range[0], after[0], '');
    }
    const from = lineStart(text, range[0]);
    const to = Math.min(text.length, lineEndAfter(text, valueEnd(item)) + 1);
    return splice(text, from, to, '');
}
