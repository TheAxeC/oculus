// Layer 2, server. Collection entry field edits, insertion, reordering and deletion live here
// because entry-list changes do not affect subtask or host-status edits.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.

import { isDeepStrictEqual } from 'node:util';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { isMap as isYamlMap, isScalar, isSeq } from 'yaml';
import type { Node, YAMLMap } from 'yaml';
import { NOT_A_FIELD_VALUE, asFieldValue, sameValue } from '../yaml/yaml-edit.ts';
import { isBlockMap } from '../yaml/yaml-values.ts';
import { pairOf, rangeOf } from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import type { EditResult, Refusal } from '../yaml/yaml-edit.ts';
import {
    LIST,
    entryPlace,
    lineAt,
    listOf
} from '../../../data/helpers/files/yaml/collection-text.ts';
import { applyEntryField } from './merge.ts';
import {
    asJs,
    document,
    linesOf,
    locate,
    refuseAll,
    settled,
    type Change,
    type LineRange,
    type Located
} from './lines.ts';

/**
 * Set fields of one collection entry, each in the bytes of its own value.
 *
 * A field the entry already holds that value for is not written. A field the entry has not got is
 * appended on its own line at the entry's indentation, and `null` removes the field's lines. The
 * identity field is writable, since renaming an entry is a write of that field, but it is never
 * cleared: the entry would then be addressed by nothing.
 */
export function setEntryFields(
    source: string,
    ident: string,
    value: string,
    fields: Record<string, unknown>
): EditResult {
    const names = Object.keys(fields);
    const base = locate(source, ident, value);
    if (base === null) return refuseAll(source, names, 'the entry is not in the file');
    const current = base.node.toJSON() as Record<string, unknown>;

    let text = source;
    const changed: string[] = [];
    const refused: Refusal[] = [];
    const applied: Change[] = [];
    let ident_value = value;

    for (const [field, raw] of Object.entries(fields)) {
        const parsed = asFieldValue(raw);
        if (parsed === undefined) {
            refused.push({ field, reason: NOT_A_FIELD_VALUE });
            continue;
        }
        const wanted =
            Array.isArray(parsed) &&
            parsed.length === 0 &&
            Array.isArray(current[field]) &&
            current[field].some(isMap)
                ? null
                : isBlockMap(parsed) && Object.keys(parsed).length === 0
                  ? null
                  : parsed;
        if (field === ident && (wanted === null || Array.isArray(wanted))) {
            refused.push({ field, reason: 'the identity field is what the entry is found by' });
            continue;
        }
        if (sameValue(wanted, current[field])) continue;
        const out = applyEntryField(text, ident, ident_value, field, wanted);
        if ('reason' in out) {
            refused.push({ field, reason: out.reason });
            continue;
        }
        text = out.text;
        changed.push(field);
        applied.push({
            path: [base.list, base.index, field],
            value: wanted,
            remove: wanted === null
        });
        if (field === ident) ident_value = scalar(wanted);
    }

    return settled(source, text, applied, names, changed, refused);
}

/** True for a list key holding nothing: absent, null (`entries:`), or an empty list. */
function isEmptyList(held: unknown): boolean {
    return held === undefined || held === null || (Array.isArray(held) && held.length === 0);
}

/**
 * Write a collection's entry list with one rendered entry under it, for a file whose list holds
 * nothing. Such a file is in one of three states: it carries no list key at all, which is a file
 * nothing has ever been written to, it carries the key with nothing under it, which is what
 * deleting the last entry leaves, or it carries the key with an empty flow list (`entries: []`).
 * The first gets the key at the end of the file, the second gets the block under the key it
 * already has, the third has its `[]` taken out of the key's line, a trailing comment kept, and
 * gets the block under it. A file whose list holds an entry is left alone, since appendEntry is
 * what grows one.
 *
 * The result is verified the way an append is: the file parses, the key is a list of exactly the
 * one entry, and every other key is what it was.
 */
export function startEntries(source: string, listKey: string, block: string): EditResult {
    const doc = document(source);
    if (doc === null) return refuseAll(source, [listKey], 'the file does not parse');
    const pair = pairOf(doc.contents as YAMLMap, listKey);
    // A key with nothing written under it parses as a scalar holding null rather than as no value,
    // which is what the file deleting its last entry left behind.
    const dangling =
        pair !== undefined &&
        (pair.value === null || (isScalar(pair.value) && pair.value.value === null));
    const emptyFlow =
        pair !== undefined &&
        isSeq(pair.value) &&
        pair.value.flow === true &&
        pair.value.items.length === 0;
    if (pair !== undefined && !dangling && !emptyFlow) {
        return refuseAll(source, [listKey], `the file already has a ${listKey} key`);
    }
    let text: string;
    if (pair === undefined) {
        text = `${source.replace(/\n*$/, '\n')}\n${listKey}:\n${block}\n`;
    } else {
        const key = rangeOf(pair.key);
        if (key === null) return refuseAll(source, [listKey], 'the key has no place in the file');
        const lines = source.split('\n');
        const at = lineAt(source, key[0]);
        if (emptyFlow) {
            const flow = rangeOf(pair.value);
            if (flow === null || lineAt(source, flow[1] - 1) !== at) {
                return refuseAll(source, [listKey], 'the key has no place in the file');
            }
            const from = flow[0];
            const to = flow[1];
            const lineStart = source.lastIndexOf('\n', key[0] - 1) + 1;
            lines[at] =
                `${source.slice(lineStart, from).trimEnd()}${source.slice(to, lineStart + lines[at].length)}`;
        }
        lines.splice(at + 1, 0, ...block.split('\n'));
        text = lines.join('\n');
    }

    const before = asJs(source);
    const after = asJs(text);
    if (!isMap(before) || !isMap(after)) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    const has = after[listKey];
    const without = (held: Record<string, unknown>): Record<string, unknown> =>
        Object.fromEntries(Object.entries(held).filter(([key]) => key !== listKey));
    if (
        !Array.isArray(has) ||
        has.length !== 1 ||
        !isEmptyList(before[listKey]) ||
        !isDeepStrictEqual(without(after), without(before))
    ) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [listKey], refused: [] };
}

/**
 * Append one rendered entry to a collection's list, at the end of the list and before whatever the
 * file holds after it. The block is the entry's own lines, the first of them opening with `- `.
 */
export function appendEntry(source: string, listKey: string, block: string): EditResult {
    const doc = document(source);
    if (doc === null) return refuseAll(source, [listKey], 'the file does not parse');
    const pair = pairOf(doc.contents as YAMLMap, listKey);
    if (pair === undefined) return refuseAll(source, [listKey], `the file has no ${listKey} key`);
    const seq = pair.value;
    // A list holding nothing is the first entry's to start, whether it is written as `entries:` or
    // as `entries: []`.
    const none =
        seq === null ||
        (isScalar(seq) && seq.value === null) ||
        (isSeq(seq) && seq.flow === true && seq.items.length === 0);
    if (none) return startEntries(source, listKey, block);
    if (!isSeq(seq) || seq.flow === true) {
        return refuseAll(source, [listKey], `${listKey} is not a block list`);
    }
    const place = entryPlace(source);
    if ('code' in place || place.list !== listKey) {
        return refuseAll(source, [listKey], 'the key has no place in the file');
    }
    const lines = source.split('\n');
    lines.splice(place.at, 0, ...place.lead, ...block.split('\n'));
    const text = lines.join('\n');

    const before = asJs(source);
    const after = asJs(text);
    if (!isMap(before) || !isMap(after)) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    const had = before[listKey];
    const has = after[listKey];
    const grew =
        Array.isArray(had) &&
        Array.isArray(has) &&
        has.length === had.length + 1 &&
        isDeepStrictEqual(has.slice(0, had.length), had);
    const rest = { ...before, [listKey]: null };
    const restAfter = { ...after, [listKey]: null };
    if (!grew || !isDeepStrictEqual(rest, restAfter)) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [listKey], refused: [] };
}

/**
 * One entry as a reorder sees it: the value its identity field holds, and the lines it occupies.
 */
type Placed = { value: string; range: LineRange };

/**
 * Every entry of a collection file in file order, or null when one of them has no identity value
 * or no place in the file. It is all or nothing: a reorder that could not address one entry would
 * move the others around it and leave that one where it happened to sit.
 */
function placedEntries(source: string, ident: string): { list: string; items: Placed[] } | null {
    const doc = document(source);
    if (doc === null) return null;
    const list = listOf(doc.contents as YAMLMap);
    if (list === null) return null;
    const items: Placed[] = [];
    for (const node of list.seq.items as Node[]) {
        if (!isYamlMap(node)) return null;
        const pair = pairOf(node, ident);
        if (pair?.value == null || !isScalar(pair.value)) return null;
        const range = linesOf(source, node);
        if (range === null) return null;
        items.push({ value: String(pair.value.value), range });
    }
    return items.length === 0 ? null : { list: list.key, items };
}

/**
 * Put the entries in the order the identity values name, moving whole blocks.
 *
 * Every byte inside an entry is carried across untouched, comments and quoting and indentation
 * alike: what moves is whole lines. What sits between two entries, a blank line or a comment that
 * heads a section, stays at its own place in the list rather than travelling with the entry above
 * it, since it is the file's own furniture and not part of any record.
 *
 * The order must name every entry exactly once. An order that is short, long, or names a value
 * twice is refused whole: the alternative is guessing where the entries it did not name should go.
 */
export function reorderEntries(source: string, ident: string, order: string[]): EditResult {
    const placed = placedEntries(source, ident);
    if (placed === null) return refuseAll(source, [LIST], 'the file has no entries to reorder');
    const values = placed.items.map((item) => item.value);
    const names = (value: string): boolean => order.filter((one) => one === value).length === 1;
    if (order.length !== values.length || !values.every(names)) {
        return refuseAll(source, [placed.list], 'the order does not name every entry exactly once');
    }

    const lines = source.split('\n');
    const first = placed.items[0].range.start;
    const last = placed.items[placed.items.length - 1].range.end;
    const blocks = placed.items.map((item) => lines.slice(item.range.start, item.range.end));
    const gaps = placed.items.map((item, at) =>
        at + 1 < placed.items.length
            ? lines.slice(item.range.end, placed.items[at + 1].range.start)
            : []
    );
    const region: string[] = [];
    order.forEach((value, at) => {
        region.push(...blocks[values.indexOf(value)], ...gaps[at]);
    });
    if (region.join('\n') === lines.slice(first, last).join('\n')) {
        return { text: source, changed: [], refused: [] };
    }
    const text = [...lines.slice(0, first), ...region, ...lines.slice(last)].join('\n');

    const before = asJs(source);
    const after = asJs(text);
    const had = isMap(before) ? before[placed.list] : undefined;
    const has = isMap(after) ? after[placed.list] : undefined;
    if (!isMap(before) || !isMap(after) || !Array.isArray(had) || !Array.isArray(has)) {
        return refuseAll(source, [placed.list], 'the edit did not verify; nothing was written');
    }
    const wanted = order.map((value): unknown => had[values.indexOf(value)]);
    const rest = { ...before, [placed.list]: null };
    const restAfter = { ...after, [placed.list]: null };
    if (!isDeepStrictEqual(has, wanted) || !isDeepStrictEqual(rest, restAfter)) {
        return refuseAll(source, [placed.list], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [placed.list], refused: [] };
}

/**
 * Take one entry's lines out of its file. The blank line a list written with a blank between its
 * records keeps under the entry goes with it, and the one over it when the entry is the last, so
 * removing a record leaves one blank between the two it sat between rather than two.
 */
export function deleteEntry(source: string, ident: string, value: string): EditResult {
    const found = locate(source, ident, value);
    if (found === null) return refuseAll(source, [LIST], 'the entry is not in the file');
    const lines = source.split('\n');
    let from = found.range.start;
    let to = found.range.end;
    if ((lines[to] ?? 'x').trim() === '') to += 1;
    else if (from > 0 && lines[from - 1].trim() === '') from -= 1;
    return withoutLines(source, found, from, to);
}

/**
 * Take out an entry that appendEntry wrote: its lines and the one blank line appendEntry put over
 * them, and nothing under it, so the text around it is what it was before the append.
 */
export function takeOutAppended(source: string, ident: string, value: string): EditResult {
    const found = locate(source, ident, value);
    if (found === null) return refuseAll(source, [LIST], 'the entry is not in the file');
    const lines = source.split('\n');
    const from =
        found.range.start > 0 && lines[found.range.start - 1].trim() === ''
            ? found.range.start - 1
            : found.range.start;
    return withoutLines(source, found, from, found.range.end);
}

/** The source without lines `from` to `to`, kept only when it parses as the list without them. */
function withoutLines(source: string, found: Located, from: number, to: number): EditResult {
    const text = [...source.split('\n').slice(0, from), ...source.split('\n').slice(to)].join('\n');

    const before = asJs(source);
    const after = asJs(text);
    const had = isMap(before) ? before[found.list] : undefined;
    // The last entry of a file leaves `entries:` with no items, which parses as null rather than as
    // an empty list; that is the one shape the list may take after a delete and not before it.
    const has = isMap(after) ? (after[found.list] ?? []) : undefined;
    if (!isMap(before) || !isMap(after) || !Array.isArray(had) || !Array.isArray(has)) {
        return refuseAll(source, [found.list], 'the edit did not verify; nothing was written');
    }
    const wanted = had.filter((_item, at) => at !== found.index);
    const rest = { ...before, [found.list]: null };
    const restAfter = { ...after, [found.list]: null };
    if (!isDeepStrictEqual(has, wanted) || !isDeepStrictEqual(rest, restAfter)) {
        return refuseAll(source, [found.list], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [found.list], refused: [] };
}
