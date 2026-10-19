// Layer 2, server. A value written into a YAML document so that only the bytes that differ change.
//
// A map is merged key by key: a key the new value does not carry is taken out, a key whose value
// differs is merged in turn, a new key is written after the last one. A list of maps or of scalars
// is merged item by item: the items both ends share at the front and at the back stay as they are,
// the ones between are merged where both have one and written or taken out where only one has. A
// scalar is written over the bytes of the old one in the quoting it had, which leaves a folded or
// literal block, a comment and a flow map's other pairs alone wherever the value is not theirs.
//
// An entry field and a section of the career file both reach their values through here, so a
// sub-field the reader did not touch keeps the text the file wrote it in.

import { isMap as isYamlMap, isScalar, isSeq } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { isEqual } from 'lodash-es';
import { lineAt, renderScalar } from '../../../data/helpers/files/yaml/collection-text.ts';
import {
    DEFAULT_INDENT,
    columnOf,
    lineStart,
    pairEnd,
    pairOf,
    rangeOf,
    valueEnd
} from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { asFieldValue, sameValue } from '../yaml/yaml-edit.ts';
import { REFUSALS, said, why } from '../yaml/why.ts';
import type { EditResult, Refusal } from '../yaml/yaml-edit.ts';
import { isBlockMap, isBlockValue, renderBlockMap, renderListItem } from '../yaml/yaml-values.ts';
import type { BlockMap, BlockValue, FieldValue } from '../yaml/yaml-values.ts';
import {
    appendField,
    asJs,
    document,
    fail,
    flowScalar,
    lastKeyLine,
    locate,
    removeField,
    refuseAll,
    replaceIn,
    settled,
    splice,
    type Change,
    type Written
} from './lines.ts';

/** Where a node stands in the document: the keys and the positions on the way to it. */
type Path = (string | number)[];

/** The node a path names, or null when the document does not parse or holds nothing there. */
function nodeAt(text: string, path: Path): Node | null {
    const doc = document(text);
    if (doc === null) return null;
    const node = doc.getIn(path, true);
    return node === undefined || node === null ? null : (node as Node);
}

/** Whether a value leaves nothing to write: null, an empty list or an empty map. */
function isEmptyValue(value: BlockValue): boolean {
    if (value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    return isMap(value) && Object.keys(value).length === 0;
}

/** The first and the last line a node occupies, as the half-open range of lines. */
function linesOfNode(text: string, node: Node): { start: number; end: number } | null {
    const own = rangeOf(node);
    if (own === null) return null;
    const end = valueEnd(node);
    return {
        start: lineAt(text, own[0]),
        end: lineAt(text, Math.max(end - 1, own[0])) + 1
    };
}

/** The lines from `start` up to `end` taken out of the text. */
function takeLines(text: string, start: number, end: number): string {
    const lines = text.split('\n');
    lines.splice(start, end - start);
    return lines.join('\n');
}

/** Lines put into the text so that the first of them becomes line `at`. */
function putLines(text: string, at: number, block: string): string {
    const lines = text.split('\n');
    lines.splice(at, 0, ...block.split('\n'));
    return lines.join('\n');
}

/** A scalar written over the bytes of the old one, plain scalars made safe inside a flow map. */
function replaceScalar(text: string, node: Node, value: BlockValue, inFlow: boolean): Written {
    const given = asFieldValue(value);
    if (given === undefined || given === null) return fail(REFUSALS.valueCannotHere);
    const range = rangeOf(node);
    const plain = isScalar(node) && (node.type === 'PLAIN' || node.type === undefined);
    if (inFlow && plain && !Array.isArray(given) && !isMap(given)) {
        if (range === null) return fail(REFUSALS.valueNoPlace);
        const rendered = flowScalar(given);
        return { text: splice(text, range[0], valueEnd(node), rendered) };
    }
    return replaceIn(text, node, given);
}

/**
 * A new scalar in the quoting its neighbours have: double quoted where the map or list it joins
 * writes its text values that way, else as a scalar is written anywhere.
 */
function styled(value: BlockValue, quoted: boolean): string {
    if (quoted && typeof value === 'string') return JSON.stringify(value);
    return flowScalar(value as FieldValue);
}

/** Whether the scalars of a map's values (or a list's items) are written double quoted. */
function writesQuoted(node: Node): boolean {
    const nodes: unknown[] = isYamlMap(node)
        ? (node.items as Pair<Scalar, Node>[]).map((pair) => pair.value)
        : isSeq(node)
          ? node.items
          : [];
    const texts = nodes.filter(
        (one): one is Scalar => isScalar(one) && typeof one.value === 'string'
    );
    return texts.length > 0 && texts.every((one) => one.type === 'QUOTE_DOUBLE');
}

/** The pairs of a map as [name, pair], the name read as text. */
function pairsOf(map: YAMLMap): [string, Pair<Scalar, Node>][] {
    return (map.items as Pair<Scalar, Node>[]).map((pair) => [String(pair.key.value), pair]);
}

/** A block map merged key by key. */
function mergeBlockMap(text: string, path: Path, wanted: BlockMap): Written {
    let out = text;
    const first = nodeAt(out, path);
    if (first === null || !isYamlMap(first)) return fail(REFUSALS.valueNoPlace);
    const names = pairsOf(first).map(([name]) => name);
    for (const name of names) {
        const value = Object.hasOwn(wanted, name) ? wanted[name] : undefined;
        const map = nodeAt(out, path);
        if (map === null || !isYamlMap(map)) return fail(REFUSALS.valueNoPlace);
        const pair = pairOf(map, name);
        if (pair === undefined) continue;
        const held = pair.value === null ? null : (pair.value.toJSON() as BlockValue);
        if (value === undefined || isEmptyValue(value)) {
            // A key the new value leaves out, or empties, goes; one that was empty stays as it is.
            if (value !== undefined && isEmptyValue(held)) continue;
            const gone = removeField(out, pair);
            if ('why' in gone) return gone;
            out = gone.text;
            continue;
        }
        const done = mergeValue(out, [...path, name], value);
        if ('why' in done) return done;
        out = done.text;
    }
    const added = Object.entries(wanted).filter(
        ([name, value]) => !names.includes(name) && !isEmptyValue(value)
    );
    if (added.length === 0) return { text: out };
    const map = nodeAt(out, path);
    if (map === null || !isYamlMap(map)) return fail(REFUSALS.valueNoPlace);
    const at = lastKeyLine(out, map);
    const own = rangeOf(map);
    if (at === null || own === null) return fail(REFUSALS.valueNoPlace);
    const pad = ' '.repeat(columnOf(out, own[0]));
    const quoted = writesQuoted(map);
    const block = added
        .map(([name, value]) =>
            isMap(value) || Array.isArray(value)
                ? `${pad}${renderBlockMap({ [name]: value }, pad.length)}`
                : `${pad}${renderScalar(name)}: ${styled(value, quoted)}`
        )
        .join('\n');
    return { text: putLines(out, at, block) };
}

/** A flow map merged key by key, each changed value written over its own bytes. */
function mergeFlowMap(text: string, path: Path, wanted: BlockMap): Written {
    let out = text;
    const first = nodeAt(out, path);
    if (first === null || !isYamlMap(first)) return fail(REFUSALS.valueNoPlace);
    const names = pairsOf(first).map(([name]) => name);
    for (const name of names) {
        const map = nodeAt(out, path);
        if (map === null || !isYamlMap(map)) return fail(REFUSALS.valueNoPlace);
        const pairs = pairsOf(map);
        const at = pairs.findIndex(([key]) => key === name);
        const pair = pairs[at][1];
        const held = pair.value;
        if (held === null) return fail(REFUSALS.valueNoPlace);
        const value = Object.hasOwn(wanted, name) ? wanted[name] : undefined;
        if (value === undefined || isEmptyValue(value)) {
            if (value !== undefined && isEmptyValue(held.toJSON() as BlockValue)) continue;
            if (pairs.length === 1) return fail(REFUSALS.rowNoKey);
            const key = rangeOf(pair.key);
            const end = pairEnd(pair);
            if (key === null || end === null) return fail(REFUSALS.valueNoPlace);
            if (at < pairs.length - 1) {
                const next = rangeOf(pairs[at + 1][1].key);
                if (next === null) return fail(REFUSALS.valueNoPlace);
                out = splice(out, key[0], next[0], '');
            } else {
                const before = pairEnd(pairs[at - 1][1]);
                if (before === null) return fail(REFUSALS.valueNoPlace);
                out = splice(out, before, end, '');
            }
            continue;
        }
        if (sameValue(value, held.toJSON())) continue;
        if (Array.isArray(value) || isMap(value)) {
            const range = rangeOf(held);
            if (range === null) return fail(REFUSALS.valueNoPlace);
            out = splice(out, range[0], valueEnd(held), flowScalar(value as FieldValue));
            continue;
        }
        const done = replaceScalar(out, held, value, true);
        if ('why' in done) return done;
        out = done.text;
    }
    const added = Object.entries(wanted).filter(
        ([name, value]) => !names.includes(name) && !isEmptyValue(value)
    );
    if (added.length === 0) return { text: out };
    const map = nodeAt(out, path);
    if (map === null || !isYamlMap(map) || map.items.length === 0) {
        return fail(REFUSALS.valueNoPlace);
    }
    const end = pairEnd(map.items[map.items.length - 1] as Pair<Scalar, Node>);
    if (end === null) return fail(REFUSALS.valueNoPlace);
    const quoted = writesQuoted(map);
    const extra = added
        .map(([name, value]) => `, ${flowScalar(name)}: ${styled(value, quoted)}`)
        .join('');
    return { text: splice(out, end, end, extra) };
}

/** Whether every item of a sequence node is a flow map: a list of one-line rows. */
function flowRows(seq: YAMLSeq): boolean {
    return seq.items.length > 0 && seq.items.every((item) => isYamlMap(item) && item.flow === true);
}

/** A new item of a block list as the line or lines it takes, in the style its neighbours have. */
function renderItem(seq: YAMLSeq, value: BlockValue, indent: number): string {
    if (flowRows(seq) && isBlockMap(value) && Object.values(value).every((one) => !isMap(one))) {
        const quoted = writesQuoted(seq.items[0] as Node);
        const parts = Object.entries(value).map(
            ([name, one]) => `${flowScalar(name)}: ${styled(one, quoted)}`
        );
        return `${' '.repeat(indent)}- { ${parts.join(', ')} }`;
    }
    const first = seq.items[0];
    const style = isScalar(first) ? first.type : undefined;
    if (!isMap(value) && !Array.isArray(value)) {
        return `${' '.repeat(indent)}- ${renderScalar(value, style)}`;
    }
    return renderListItem(value, indent);
}

/** A block list merged item by item. */
function mergeBlockList(text: string, path: Path, wanted: BlockValue[]): Written {
    let out = text;
    const seq = nodeAt(out, path);
    if (seq === null || !isSeq(seq)) return fail(REFUSALS.valueNoPlace);
    const have = seq.toJSON() as BlockValue[];
    const most = Math.min(have.length, wanted.length);
    let front = 0;
    while (front < most && isEqual(have[front], wanted[front])) front += 1;
    let back = 0;
    while (back < most - front && isEqual(have.at(-1 - back), wanted.at(-1 - back))) back += 1;
    const oldMiddle = have.length - front - back;
    const newMiddle = wanted.length - front - back;
    const shared = Math.min(oldMiddle, newMiddle);
    for (let at = front; at < front + shared; at += 1) {
        const done = mergeValue(out, [...path, at], wanted[at]);
        if ('why' in done) return done;
        out = done.text;
    }
    const held = nodeAt(out, path);
    if (held === null || !isSeq(held)) return fail(REFUSALS.valueNoPlace);
    if (oldMiddle > newMiddle) {
        for (let at = front + oldMiddle - 1; at >= front + shared; at -= 1) {
            const range = linesOfNode(out, held.items[at] as Node);
            if (range === null) return fail(REFUSALS.valueNoPlace);
            out = takeLines(out, range.start, range.end);
        }
        return { text: out };
    }
    if (newMiddle > oldMiddle) {
        const first = rangeOf(held.items[0]);
        if (first === null) return fail(REFUSALS.valueNoPlace);
        const dash = out.slice(lineStart(out, first[0]), first[0]).search(/\S/);
        const indent = dash < 0 ? 0 : dash;
        const after = front + shared;
        const block = wanted
            .slice(after, front + newMiddle)
            .map((one) => renderItem(held, one, indent))
            .join('\n');
        const previous = after === 0 ? null : linesOfNode(out, held.items[after - 1] as Node);
        const into = previous === null ? lineAt(out, first[0]) : previous.end;
        return { text: putLines(out, into, block) };
    }
    return { text: out };
}

/**
 * A value of another shape than the one in the file, written over the old one. A list over an
 * empty value (`key:` or `key: []`) is written as a block under the key.
 */
function replaceNode(text: string, node: Node, wanted: BlockValue): Written {
    if (wanted === null) return fail(REFUSALS.valueCannotHere);
    const empty =
        (isSeq(node) && node.items.length === 0) || (isScalar(node) && node.value === null);
    if (Array.isArray(wanted) && empty) {
        const range = rangeOf(node);
        if (range === null) return fail(REFUSALS.valueNoPlace);
        const line = text.slice(lineStart(text, range[0]), range[0]);
        const pad = line.length - line.trimStart().length + DEFAULT_INDENT;
        const items = wanted.map((one) => renderListItem(one, pad)).join('\n');
        return { text: splice(text, range[0], valueEnd(node), `\n${items}`) };
    }
    const given = asFieldValue(wanted);
    if (given === undefined || given === null) {
        return fail(REFUSALS.valueShape);
    }
    return replaceIn(text, node, given);
}

/**
 * The value at `path` made `wanted`, changing the bytes of what differs and none of the rest. The
 * answer is the new text or the reason there is none.
 */
function mergeValue(text: string, path: Path, wanted: BlockValue): Written {
    const node = nodeAt(text, path);
    if (node === null) return fail(REFUSALS.valueNoPlace);
    if (sameValue(wanted, node.toJSON())) return { text };
    if (isYamlMap(node) && isBlockMap(wanted) && node.items.length > 0) {
        return node.flow === true
            ? mergeFlowMap(text, path, wanted)
            : mergeBlockMap(text, path, wanted);
    }
    if (isSeq(node) && node.flow !== true && node.items.length > 0 && Array.isArray(wanted)) {
        return wanted.length === 0 ? fail(REFUSALS.listEmpty) : mergeBlockList(text, path, wanted);
    }
    const inFlow = path.length > 0 && isFlowParent(text, path);
    if (!Array.isArray(wanted) && !isMap(wanted)) return replaceScalar(text, node, wanted, inFlow);
    return replaceNode(text, node, wanted);
}

/** Whether the node a path names is held by a flow map or a flow list. */
function isFlowParent(text: string, path: Path): boolean {
    const parent = nodeAt(text, path.slice(0, -1));
    return parent !== null && (isYamlMap(parent) || isSeq(parent)) && parent.flow === true;
}

/**
 * One field of one collection entry written into the text, or the reason it was not. A field the
 * entry has not got is appended, `null` removes it, any other value is merged into the one there.
 */
export function applyEntryField(
    text: string,
    ident: string,
    value: string,
    field: string,
    wanted: FieldValue
): Written {
    const found = locate(text, ident, value);
    if (found === null) return fail(REFUSALS.entryNotInFile);
    const pair = pairOf(found.node, field);
    if (wanted === null) {
        if (pair === undefined) return fail(REFUSALS.fieldNotThere);
        return removeField(text, pair);
    }
    if (pair === undefined) return appendField(text, found, field, wanted);
    if (pair.value === null) return fail(REFUSALS.fieldNoValue);
    return mergeValue(text, [found.list, found.index, field], wanted);
}

/**
 * Top-level sections of a map document set to the given values, each merged into the section there
 * (a new one is written at the end of the file, an empty one takes the section out), and every
 * other line and comment of the file left as it is. A section the document already holds that
 * value for is not written. The result parses again to the document with exactly those sections
 * changed, or nothing is written.
 */
export function setSections(
    source: string,
    fields: Record<string, unknown>,
    catalog: Record<string, string>
): EditResult {
    const names = Object.keys(fields);
    const current = asJs(source);
    if (!isMap(current)) return refuseAll(source, names, why(REFUSALS.fileNoParse), catalog);
    let text = source;
    const changed: string[] = [];
    const refused: Refusal[] = [];
    const applied: Change[] = [];
    for (const [name, raw] of Object.entries(fields)) {
        if (!isBlockValue(raw)) {
            refused.push({ field: name, reason: said(catalog, why(REFUSALS.notAFieldValue)) });
            continue;
        }
        const empty = isEmptyValue(raw);
        if (
            sameValue(empty ? null : raw, current[name]) ||
            (empty && isEmptyValue((current[name] as BlockValue) ?? null))
        )
            continue;
        const root = document(text)?.contents;
        if (root === undefined || !isYamlMap(root))
            return refuseAll(source, names, why(REFUSALS.fileNoParse), catalog);
        const pair = pairOf(root, name);
        let out: Written;
        if (empty) {
            out = pair === undefined ? { text } : removeField(text, pair);
        } else if (pair === undefined) {
            out = { text: `${text.replace(/\n*$/, '\n')}${renderBlockMap({ [name]: raw }, 0)}\n` };
        } else {
            out = mergeValue(text, [name], raw);
        }
        if ('why' in out) {
            refused.push({ field: name, reason: said(catalog, out.why) });
            continue;
        }
        text = out.text;
        changed.push(name);
        applied.push(empty ? { path: [name], remove: true } : { path: [name], value: raw });
    }
    return settled(source, text, applied, names, changed, refused, catalog);
}
