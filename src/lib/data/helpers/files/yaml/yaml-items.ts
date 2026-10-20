// Layer 1, data. The pieces of an in-place edit of one item of a YAML list of maps, shared by the
// schedules file (server/machine/runs/schedules/file.ts) and a repository's `.oculus/commands.yml`
// (server/machine/runs/commands/write.ts): where an item of a block list opens and ends in the
// text, the text a new item is rendered as, and the patch of one item's keys over its bytes. The
// column and the line start of a position are yaml-ranges.ts's.
//
// A changed value is replaced in its own range, a key that goes takes its line, and a new key
// follows the item's last one, so every other key, its order, its comments and its quoting keep
// their bytes. What the edit can only write by rendering (a flow map, a key that opens the item's
// first line, a value that is a block) is answered as null, and the caller renders the item from
// its node instead. Each caller parses its result again and compares it with what was asked
// before anything is written.

import { Document, YAMLSeq, isMap as isYamlMap, isNode, isScalar, isSeq } from 'yaml';
import type { YAMLMap } from 'yaml';
import { columnOf, lineStart } from './yaml-ranges.ts';

/** The text of one item's node as a one-item block list, ending in a new line. */
export function itemText(node: YAMLMap): string {
    const doc = new Document();
    const seq = new YAMLSeq();
    seq.items.push(node);
    doc.contents = seq;
    return doc.toString({ lineWidth: 0 });
}

/** The lines after the first indented by `width` spaces, for an item of an indented list. */
export function indented(text: string, width: number): string {
    if (width === 0) return text;
    const pad = ' '.repeat(width);
    return text
        .split('\n')
        .map((line, at) => (at === 0 || line === '' ? line : pad + line))
        .join('\n');
}

/** The offset of the `-` that opens item `at` of a block list, or null when it cannot be found. */
export function dashOf(seq: YAMLSeq, at: number): number | null {
    const token = seq.srcToken;
    if (token?.type !== 'block-seq') return null;
    const mark = token.items[at]?.start.find((one) => one.type === 'seq-item-ind');
    return mark === undefined ? null : mark.offset;
}

/** The end of item `at`'s node, where the next line of the file begins or the file ends. */
export function endOf(seq: YAMLSeq, at: number): number | null {
    const item = seq.items[at];
    return isNode(item) && item.range ? item.range[2] : null;
}

/** The text of a value's node on one line, with no new line after it. */
export function valueText(node: unknown): string {
    const doc = new Document();
    doc.contents = node as Document['contents'];
    return doc.toString({ lineWidth: 0 }).replace(/\n$/, '');
}

/** The offset after the line that holds `offset`, or after the end of the text. */
function afterLine(text: string, offset: number): number {
    if (offset > 0 && text[offset - 1] === '\n') return offset;
    const end = text.indexOf('\n', offset);
    return end === -1 ? text.length : end + 1;
}

/** The text with every line it holds ended by `\r\n` when the file's lines all end that way. */
export function inLineEnds(file: string, text: string): string {
    const crlf = file.includes('\r\n') && !/(^|[^\r])\n/.test(file);
    return crlf ? text.replace(/\r?\n/g, '\r\n') : text;
}

/** The column the `-` of a block list's items stands at; 0 when it cannot be read. */
export function itemColumn(text: string, seq: YAMLSeq): number {
    const first = dashOf(seq, 0);
    return first === null ? 0 : columnOf(text, first);
}

/** The text with item `at` of a block list replaced by `node`; null when its span is not found. */
export function replacedItem(text: string, seq: YAMLSeq, at: number, node: YAMLMap): string | null {
    const body = indented(itemText(node), itemColumn(text, seq));
    const from = dashOf(seq, at);
    const to = endOf(seq, at);
    if (from === null || to === null) return null;
    const kept = text.slice(from, to);
    const closed = kept.endsWith('\n') ? body : body.replace(/\n$/, '');
    return text.slice(0, from) + closed + text.slice(to);
}

/** The text with the item at `at` of a block list removed, with the indent in front of its `-`. */
export function withoutItem(text: string, seq: YAMLSeq, at: number): string | null {
    const from = dashOf(seq, at);
    const to = endOf(seq, at);
    if (from === null || to === null) return null;
    // The indent in front of the `-` goes with the item, so the next item keeps its own.
    const start = lineStart(text, from);
    const begin = text.slice(start, from).trim() === '' ? start : from;
    return text.slice(0, begin) + text.slice(to);
}

/** One key of an item's map: set to `value`, or removed when `value` is undefined. */
export type KeyChange = { key: string; value: unknown };

/** The node a changed value is written as, given the node it replaces (null for a new key). */
export type NodeOf = (key: string, value: unknown, old: unknown) => unknown;

/** One replacement of a span of the file's text. */
type Patch = { start: number; end: number; text: string };

/**
 * The text with the changes written into the bytes of a block-style item: a value is replaced in
 * its own range, a key that goes takes its line, and a new key follows the item's last one. Null
 * when a change cannot be written that way (a key that opens the item's first line, a value that
 * is a block, an empty value), and the caller renders the node instead.
 */
export function patchedMap(
    text: string,
    map: YAMLMap,
    changes: KeyChange[],
    nodeOf: NodeOf
): string | null {
    if (map.flow === true || !map.range || map.items.length === 0) return null;
    const firstKey = map.items[0].key;
    if (!isNode(firstKey) || !firstKey.range) return null;
    const indent = ' '.repeat(columnOf(text, firstKey.range[0]));
    const patches: Patch[] = [];
    let added = '';
    for (const change of changes) {
        const pair = map.items.find((one) => isScalar(one.key) && one.key.value === change.key);
        if (pair === undefined) {
            if (change.value !== undefined) {
                added += `${indent}${change.key}: ${valueText(nodeOf(change.key, change.value, null))}\n`;
            }
            continue;
        }
        const { key, value } = pair;
        if (!isNode(key) || !key.range || !isNode(value) || !value.range) return null;
        if (change.value === undefined) {
            const start = lineStart(text, key.range[0]);
            if (pair === map.items[0] || text.slice(start, key.range[0]).trim() !== '') return null;
            const end = afterLine(text, value.range[1]);
            const noNewLine = end === text.length && !text.endsWith('\n');
            const before = noNewLine ? (text[start - 2] === '\r' ? 2 : 1) : 0;
            patches.push({ start: start - before, end, text: '' });
            continue;
        }
        const single =
            isScalar(value) || ((isYamlMap(value) || isSeq(value)) && value.flow === true);
        if (!single || value.range[0] === value.range[1]) return null;
        patches.push({
            start: value.range[0],
            end: value.range[1],
            text: valueText(nodeOf(change.key, change.value, value))
        });
    }
    if (added !== '') {
        const end = map.range[1];
        const open = end > 0 && text[end - 1] !== '\n';
        patches.push({
            start: end,
            end,
            text: open ? `\n${added.replace(/\n$/, '')}` : added
        });
    }
    let next = text;
    for (const patch of patches.sort((a, b) => b.start - a.start || b.end - a.end)) {
        next = next.slice(0, patch.start) + patch.text + next.slice(patch.end);
    }
    return next;
}

/** The changes made on an item's node, keeping each value's comment, for the node to render. */
export function changedNode(map: YAMLMap, changes: KeyChange[], nodeOf: NodeOf): YAMLMap {
    for (const change of changes) {
        if (change.value === undefined) {
            map.delete(change.key);
            continue;
        }
        const old = map.get(change.key, true);
        const node = nodeOf(change.key, change.value, old);
        if (isNode(old) && isNode(node)) node.comment = old.comment;
        map.set(change.key, node);
    }
    return map;
}
