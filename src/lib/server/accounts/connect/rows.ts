// Layer 2, server. The edit of the rows of the lists of the machine's own `.oculus/local.yml` of a
// hub: one account row added to, or taken from, its `calendars:` or `mail:` list, and one row of
// `clusters:` set or taken out, which the cluster row writer (`writeClusterRow`,
// edit/writes/config/config-key.ts) holds to its own checks. The file is written besides by a
// Settings write of the user's key `self` in the primary's file (`writeSelf`, the same file), by
// the `lsp-edit` operation (files/fs/lsp-edit.ts) and by a save of the source tab, each checked by
// the same reader.
//
// The file is the reader's own, hand-written, with comments and a layout of its own, so it is never
// serialised whole. parseDocument gives every node its byte range in the source, and the edit
// inserts the bytes of one row, replaces the bytes of one row, removes the bytes of one row, or
// writes the list's key when the file has none; everything else is copied through untouched. A row
// is written as one flow map on one line.
//
// An account row's edit is verified before a caller writes it: the new text must parse, parsed it
// must equal the old document with exactly that row added or taken away, and it must read as a
// machine file with no key taking its default (checkLocal, the rule every reader of the file reads
// it by, which the source tab's save applies too). A text that fails any of the three is a refusal
// with the reason, never a damaged file.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.

import { isMap as isYamlMap, isScalar, isSeq, parse, parseDocument } from 'yaml';
import type { Node, Pair, YAMLSeq } from 'yaml';
import { checkLocal } from '../../../data/sources/config.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import type { AccountRow } from '../../../data/model/index.ts';

/** The two lists of a hub's `.oculus/local.yml` an account row lives in. */
export type AccountList = 'calendars' | 'mail';

/** The new text, or the reason there is none. */
export type RowEdit = { text: string } | { reason: string };

/**
 * One row as one flow map on one line, its fields in the order given and each value quoted when
 * YAML would read it as anything but that text.
 */
export function flowRow(fields: readonly (readonly [string, string])[]): string {
    const values = fields.map(([key, value]) => {
        const plain = parse(value) === value && !value.includes(',') && !value.includes('}');
        return `${key}: ${plain ? value : JSON.stringify(value)}`;
    });
    return `{ ${values.join(', ')} }`;
}

/** How an account row is written. */
function accountText(row: AccountRow): string {
    return flowRow([
        ['provider', row.provider],
        ['label', row.label]
    ]);
}

/** The start of the line a position is on. */
function lineStart(text: string, at: number): number {
    return text.lastIndexOf('\n', at - 1) + 1;
}

/** The position of the line break that ends the line a position is on, or the text's end. */
function lineEnd(text: string, at: number): number {
    const found = text.indexOf('\n', at);
    return found === -1 ? text.length : found;
}

/** The list's pair in the document's top map, or null when the file names no such key. */
function listPair(root: unknown, list: string): Pair | null {
    if (!isYamlMap(root)) return null;
    return root.items.find((pair) => isScalar(pair.key) && pair.key.value === list) ?? null;
}

/** The byte range of a node that came from the source, which every parsed node has. */
function rangeOf(node: Node): [number, number] {
    const range = node.range;
    if (range === undefined || range === null) throw new Error('a node without a source range');
    return [range[0], range[1]];
}

/**
 * Where a node's own text ends: its range's end taken back over the line breaks and spaces a block
 * node's range runs on into, so the line it ends on is the line of its last character.
 */
function textEnd(text: string, node: Node): number {
    const [start, end] = rangeOf(node);
    let stop = end;
    while (stop > start && /\s/.test(text[stop - 1])) stop -= 1;
    return stop;
}

/** Whether a row names this account. */
function same(item: unknown, account: AccountRow): boolean {
    return isMap(item) && item.provider === account.provider && item.label === account.label;
}

/**
 * The indentation the block list's rows are written at: what stands before the dash of its first
 * row, which must be spaces alone.
 */
function blockIndent(text: string, seq: YAMLSeq): string | null {
    const first = rangeOf(seq.items[0] as Node)[0];
    const dash = text.lastIndexOf('-', first - 1);
    const start = lineStart(text, dash);
    const indent = text.slice(start, dash);
    return dash < 0 || /[^ ]/.test(indent) ? null : indent;
}

/** The text with one row, written as `row`, added at the end of the list, before any check. */
export function rowAdded(text: string, list: string, row: string): RowEdit {
    const doc = parseDocument(text);
    const root = doc.contents;
    const empty = root === null || (isScalar(root) && root.value === null);
    if (!empty && !isYamlMap(root)) return { reason: 'local.yml is not a map of keys' };
    const pair = empty ? null : listPair(root, list);
    if (pair === null) {
        const lead = text === '' || text.endsWith('\n') ? '' : '\n';
        return { text: `${text}${lead}${list}:\n  - ${row}\n` };
    }
    const value = pair.value;
    if (value === null || (isScalar(value) && value.value === null)) {
        const keyEnd = rangeOf(pair.key as Node)[1];
        if (isScalar(value) && rangeOf(value)[1] > rangeOf(value)[0]) {
            // A list written `~` or `null` is given the flow list's empty brackets, which the
            // flow case below then fills.
            const [start, end] = rangeOf(value);
            return rowAdded(`${text.slice(0, start)}[]${text.slice(end)}`, list, row);
        }
        const end = lineEnd(text, keyEnd);
        return { text: `${text.slice(0, end)}\n  - ${row}${text.slice(end)}` };
    }
    if (!isSeq(value)) return { reason: `${list} is not a list` };
    if (value.flow === true) {
        const [, end] = rangeOf(value);
        if (value.items.length === 0) {
            return { text: `${text.slice(0, end - 1)}${row}]${text.slice(end)}` };
        }
        const last = rangeOf(value.items[value.items.length - 1] as Node)[1];
        return { text: `${text.slice(0, last)}, ${row}${text.slice(last)}` };
    }
    const indent = blockIndent(text, value);
    if (indent === null) return { reason: `${list} is written in a shape this edit cannot extend` };
    const end = lineEnd(text, textEnd(text, value.items[value.items.length - 1] as Node));
    return { text: `${text.slice(0, end)}\n${indent}- ${row}${text.slice(end)}` };
}

/** The list's rows as nodes, or null when the file names no such list. */
function listItems(text: string, list: string): { pair: Pair; seq: YAMLSeq } | null {
    const doc = parseDocument(text);
    const pair = listPair(doc.contents, list);
    const value = pair?.value;
    if (pair === null || !isSeq(value)) return null;
    return { pair, seq: value };
}

/** The index of the first row of the list `match` holds for, or -1 when none does. */
export function rowIndex(text: string, list: string, match: (row: unknown) => boolean): number {
    const held = listItems(text, list);
    if (held === null) return -1;
    return held.seq.items.findIndex((item) => match((item as Node).toJSON()));
}

/** The text with the row at `at` of the list written as `row` in its place, before any check. */
export function rowReplaced(text: string, list: string, at: number, row: string): RowEdit {
    const held = listItems(text, list);
    const item = held?.seq.items[at] as Node | undefined;
    if (held === null || item === undefined) return { reason: `${list} holds no such row` };
    const start = rangeOf(item)[0];
    const end = held.seq.flow === true ? rangeOf(item)[1] : textEnd(text, item);
    return { text: `${text.slice(0, start)}${row}${text.slice(end)}` };
}

/** The text with the row at `at` of the list taken out, before any check. */
export function rowRemoved(text: string, list: string, at: number): RowEdit {
    const held = listItems(text, list);
    if (held === null || at < 0 || at >= held.seq.items.length) {
        return { reason: `${list} holds no such row` };
    }
    const { pair, seq: value } = held;
    const items = value.items as Node[];
    if (value.flow === true && items.length === 1) {
        // The flow list's one row goes and its brackets stay, with whatever else they hold.
        const [start, end] = rangeOf(items[0]);
        return { text: `${text.slice(0, start)}${text.slice(end)}` };
    }
    if (value.flow === true) {
        const [from, to] =
            at === 0
                ? [rangeOf(items[0])[0], rangeOf(items[1])[0]]
                : [rangeOf(items[at - 1])[1], rangeOf(items[at])[1]];
        return { text: `${text.slice(0, from)}${text.slice(to)}` };
    }
    const start = rangeOf(items[at])[0];
    const end = textEnd(text, items[at]);
    const from = lineStart(text, text.lastIndexOf('-', start - 1));
    const to = Math.min(lineEnd(text, end) + 1, text.length);
    if (items.length > 1) return { text: `${text.slice(0, from)}${text.slice(to)}` };
    // The last row goes and the list stays, written empty on its key's line: a key with nothing
    // under it would read as no list at all, which the machine file refuses. What stands after the
    // key's colon, a comment, and the comment lines inside the list are kept.
    const colon = text.indexOf(':', rangeOf(pair.key as Node)[1]) + 1;
    return { text: `${text.slice(0, colon)} []${text.slice(colon, from)}${text.slice(to)}` };
}

/** The document's values, or null when the text does not parse. */
export function valuesOf(text: string): Record<string, unknown> | null {
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return null;
    const values: unknown = doc.toJS() ?? {};
    return isMap(values) ? values : null;
}

/**
 * Whether the edited text is the old document with only `list` changed to `wanted`. Compared as
 * JSON text: a wanted row's optional field may be set to undefined, which the file cannot hold and
 * JSON drops, so a deep comparison would call the two different.
 */
export function onlyListChanged(
    before: Record<string, unknown>,
    edited: string,
    list: string,
    wanted: unknown[]
): string | null {
    const after = valuesOf(edited);
    if (after === null) return `the edit of ${list} would not parse`;
    const expected = { ...before, [list]: wanted };
    return JSON.stringify(after) === JSON.stringify(expected)
        ? null
        : `the edit of ${list} would change more than the one row`;
}

/**
 * The edit held to the three checks: it parses, it is the old document with only `list` changed to
 * `wanted`, and the machine file reads it. `file` is the name the reader's sentence carries.
 */
function verified(
    before: Record<string, unknown>,
    edit: RowEdit,
    list: AccountList,
    wanted: AccountRow[],
    file: string
): RowEdit {
    if ('reason' in edit) return edit;
    const changed = onlyListChanged(before, edit.text, list, wanted);
    if (changed !== null) return { reason: changed };
    const refusal = checkLocal(edit.text, file);
    return refusal === null ? edit : { reason: refusal };
}

/** The rows the list holds now, or the empty list when the file names none. */
export function listRows(before: Record<string, unknown>, list: string): unknown[] {
    const held = before[list];
    return Array.isArray(held) ? (held as unknown[]) : [];
}

/** Add one account row to a machine file's text, verified; the empty text is a file not made. */
export function addAccountRow(
    text: string,
    list: AccountList,
    row: AccountRow,
    file: string
): RowEdit {
    const before = valuesOf(text);
    if (before === null) return { reason: 'local.yml does not parse' };
    const wanted = [
        ...(listRows(before, list) as AccountRow[]),
        { provider: row.provider, label: row.label }
    ];
    return verified(before, rowAdded(text, list, accountText(row)), list, wanted, file);
}

/** Take one account row from a machine file's text, verified. */
export function removeAccountRow(
    text: string,
    list: AccountList,
    account: AccountRow,
    file: string
): RowEdit {
    const before = valuesOf(text);
    if (before === null) return { reason: 'local.yml does not parse' };
    const wanted = (listRows(before, list) as AccountRow[]).filter((row) => !same(row, account));
    const at = rowIndex(text, list, (row) => same(row, account));
    if (at < 0) return { reason: `${list} holds no such account` };
    return verified(before, rowRemoved(text, list, at), list, wanted, file);
}
