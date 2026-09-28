// Layer 2, server. Shared YAML line ranges and verified byte edits live here because every entry
// writer must use the same source-position rules.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.
import { isDeepStrictEqual } from 'node:util';
import { isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import {
    isBlockMap,
    isMetalist,
    renderBlockMap,
    renderMetalist,
    renderScalar
} from '../yaml-edit.ts';
import type { EditResult, FieldValue } from '../yaml-edit.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';

/** The collection list key whose entries the writers locate and edit. */
export const LIST = 'entries';

/** The key of a checklist, on a manifest and on a collection entry alike. */
export const SUBTASKS = 'subtasks';

/** The one field of a subtask line that is never cleared: without it there is no line. */
export const LABEL = 'do';

/** A half-open range of line numbers, zero based: the lines one entry occupies. */
export type LineRange = { start: number; end: number };

/** One line of a `subtasks:` block: the key it is addressed by, and where it is. */
export type SubtaskLine = { key: string; line: number };

/**
 * A `subtasks:` block as a write sees it. `key` is the line of the `subtasks:` key itself and is
 * null when the host has no block at all; `map` says the block is a map of keys rather than a list,
 * which is the shape normalise.ts addresses by the key rather than by the position.
 */
export type SubtaskBlock = {
    key: number | null;
    /** The column the item lines start at, which a new line is written at. */
    indent: number;
    map: boolean;
    items: SubtaskLine[];
};

/** Either the new text or the reason there is none, the shape every edit step answers with. */
export type Written = { text: string } | { reason: string };

/**
 * One change the verification applies to the parsed source; `remove` deletes instead of setting.
 */
export type Change = { path: (string | number)[]; value?: unknown; remove?: boolean };

/** A host of subtasks: the map node they hang under, and its path in the parsed document. */
export type Host = { node: YAMLMap; path: (string | number)[] };

/**
 * One entry of a collection file: where it is in the file and where it is in the parsed document.
 */
export type Located = { list: string; index: number; node: YAMLMap; range: LineRange };

export function fail(reason: string): Written {
    return { reason };
}

/** Every named field refused for the same reason, with the source unchanged. */
export function refuseAll(source: string, fields: string[], reason: string): EditResult {
    const named = fields.length === 0 ? [''] : fields;
    return { text: source, changed: [], refused: named.map((field) => ({ field, reason })) };
}

/** The document, or null when it does not parse or is not a map of keys. */
export function document(source: string): Document | null {
    let doc: Document;
    try {
        doc = parseDocument(source);
    } catch {
        return null;
    }
    if (doc.errors.length > 0) return null;
    return doc.contents !== null && isYamlMap(doc.contents) ? doc : null;
}

/** The document as plain values, or undefined when it does not parse. */
export function asJs(source: string): unknown {
    const doc = document(source);
    if (doc === null) return undefined;
    try {
        return doc.toJS();
    } catch {
        return undefined;
    }
}

export function rangeOf(node: unknown): [number, number, number] | null {
    const range = (node as Node | null)?.range;
    return Array.isArray(range) ? range : null;
}

export function pairOf(map: YAMLMap, name: string): Pair<Scalar, Node> | undefined {
    return map.items.find((item) => (item.key as Scalar | undefined)?.value === name) as
        Pair<Scalar, Node> | undefined;
}

/** Where a node's value ends, before the comment or the newline its own range swallows. */
export function endOffset(node: Node): number {
    const range = rangeOf(node);
    if (range === null) return 0;
    if (isSeq(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf(node.items[node.items.length - 1]);
        if (last !== null) return last[1];
    }
    if (isYamlMap(node) && node.flow !== true && node.items.length > 0) {
        const last = (node.items[node.items.length - 1] as Pair<Scalar, Node>).value;
        const end = last === null ? null : rangeOf(last);
        if (end !== null) return end[1];
    }
    return range[1];
}

/** Where a pair's own text ends: its value's end, or its key's when it has no value. */
export function pairEnd(pair: Pair<Scalar, Node>): number | null {
    const value = pair.value;
    if (value !== null) return endOffset(value);
    return rangeOf(pair.key)?.[1] ?? null;
}

/** The line a byte offset sits on, counting from zero. */
export function lineAt(text: string, at: number): number {
    let count = 0;
    const to = Math.min(at, text.length);
    for (let index = 0; index < to; index += 1) if (text[index] === '\n') count += 1;
    return count;
}

/** The column a byte offset sits at, which is the indentation of the line it opens. */
export function columnAt(text: string, at: number): number {
    return at - (text.lastIndexOf('\n', at - 1) + 1);
}

/** The indentation of one line of the text. */
export function indentOf(line: string): number {
    return line.length - line.trimStart().length;
}

export function splice(text: string, from: number, to: number, insert: string): string {
    return text.slice(0, from) + insert + text.slice(to);
}

/**
 * One scalar as it is written inside a flow map. A plain scalar is not safe there, since a comma or
 * a brace ends the value, so anything holding one is written double quoted; everything else keeps
 * the rendering the rest of the tree uses.
 */
export function flowScalar(value: FieldValue): string {
    if (value === null) return 'null';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    // A list or a map inside a flow map is written as JSON, which is YAML flow with every
    // separator quoted, so a comma or a brace inside it cannot end the value.
    if (typeof value !== 'string') return JSON.stringify(value);
    if (value === '' || /[,{}[\]:#]|^\s|\s$/.test(value)) return JSON.stringify(value);
    return renderScalar(value);
}

/** A list as the tree writes it inline: `[one, two]`, each item quoted as the old one was. */
export function renderFlowList(values: string[], styles: (string | undefined)[]): string {
    const items = values.map((item, at) =>
        renderScalar(item, at < styles.length ? styles[at] : styles[styles.length - 1])
    );
    return `[${items.join(', ')}]`;
}

function itemStyles(node: Node): (string | undefined)[] {
    if (!isSeq(node)) return [];
    return node.items.map((item) => (isScalar(item) ? item.type : undefined));
}

/**
 * The list of records a collection file holds: `entries:` when it has one, else the first list of
 * maps that is not the file's own `schema:`. A file with neither has no entries to write.
 */
export function listOf(root: YAMLMap): { key: string; seq: YAMLSeq } | null {
    const direct = pairOf(root, LIST);
    if (direct?.value != null && isSeq(direct.value)) {
        return { key: LIST, seq: direct.value };
    }
    for (const item of root.items as Pair<Scalar, Node>[]) {
        const name = (item.key as Scalar | undefined)?.value;
        if (typeof name !== 'string' || name === 'schema') continue;
        const value = item.value;
        if (value === null || !isSeq(value)) continue;
        if (value.items.length === 0 || isYamlMap(value.items[0])) return { key: name, seq: value };
    }
    return null;
}

/** The lines a block map occupies: its first key's line to its last value's, blanks excluded. */
export function linesOf(source: string, node: YAMLMap): LineRange | null {
    const own = rangeOf(node);
    if (own === null) return null;
    const end = endOffset(node);
    return {
        start: lineAt(source, own[0]),
        end: lineAt(source, Math.max(end - 1, own[0])) + 1
    };
}

/** The entry whose `ident` field holds `value`, or null when the file has no such entry. */
export function locate(source: string, ident: string, value: unknown): Located | null {
    const doc = document(source);
    if (doc === null) return null;
    const list = listOf(doc.contents as YAMLMap);
    if (list === null) return null;
    for (let at = 0; at < list.seq.items.length; at += 1) {
        const node = list.seq.items[at] as Node;
        if (!isYamlMap(node)) continue;
        const pair = pairOf(node, ident);
        if (pair?.value == null || !isScalar(pair.value)) continue;
        if (scalar(pair.value.value) !== scalar(value)) continue;
        const range = linesOf(source, node);
        if (range === null) continue;
        return { list: list.key, index: at, node, range };
    }
    return null;
}

/**
 * The line range of the entry whose `- <ident>: <value>` line opens it, or null when there is none.
 * The range runs to the entry's last field line; a blank line or a comment after it belongs to the
 * file, not to the entry, and nothing here writes into it.
 */
export function entryRange(source: string, ident: string, value: string): LineRange | null {
    return locate(source, ident, value)?.range ?? null;
}

/** The parsed source with the changes applied, compared against the parsed result. */
export function verified(source: string, text: string, changes: Change[]): boolean {
    const after = asJs(text);
    const wanted = asJs(source);
    if (after === undefined || wanted === undefined) return false;
    for (const change of changes) if (!applyChange(wanted, change)) return false;
    return isDeepStrictEqual(after, wanted);
}

/** One expected change applied to the parsed source, or false when the path is not there. */
function applyChange(root: unknown, change: Change): boolean {
    let holder: unknown = root;
    for (const step of change.path.slice(0, -1)) {
        if (Array.isArray(holder) && typeof step === 'number') holder = holder[step];
        else if (isMap(holder) && typeof step === 'string') holder = holder[step];
        else return false;
    }
    const last = change.path[change.path.length - 1];
    if (Array.isArray(holder) && typeof last === 'number') {
        if (change.remove === true) holder.splice(last, 1);
        else holder[last] = change.value;
        return true;
    }
    if (!isMap(holder) || typeof last !== 'string') return false;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    if (change.remove === true) delete holder[last];
    else holder[last] = change.value;
    return true;
}

/** Write a value over the bytes of an existing one, the quoting the file had kept. */
export function replaceIn(text: string, node: Node, value: Exclude<FieldValue, null>): Written {
    const range = rangeOf(node);
    if (range === null) return fail('the value has no place in the file');
    const start = range[0];
    const end = endOffset(node);
    let rendered: string;
    if (isBlockMap(value)) {
        const block = isYamlMap(node) && node.flow !== true;
        const indent = block
            ? columnAt(text, start)
            : indentOf(text.split('\n')[lineAt(text, start)]) + 2;
        rendered = `${block ? '' : `\n${' '.repeat(indent)}`}${renderBlockMap(value, indent)}`;
    } else if (isMetalist(value)) {
        rendered = renderMetalist(value, columnAt(text, start));
    } else if (Array.isArray(value)) {
        if (isSeq(node) && node.flow !== true && node.items.length > 0) {
            return fail('the field is a block list; this writes one line');
        }
        rendered = renderFlowList(value, itemStyles(node));
    } else {
        if (isYamlMap(node) || isSeq(node)) return fail('the field is a block of its own');
        rendered = renderScalar(value, isScalar(node) ? node.type : undefined);
        if (rendered.includes('\n')) return fail('the value does not fit on one line');
    }
    if (start === end && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
        rendered = ` ${rendered}`;
    }
    return { text: splice(text, start, end, rendered) };
}

/** A field the entry has not got, written on its own line at the entry's own indentation. */
function appendField(
    text: string,
    found: Located,
    field: string,
    value: Exclude<FieldValue, null>
): Written {
    const own = rangeOf(found.node);
    if (own === null) return fail('the entry has no place in the file');
    const pad = ' '.repeat(columnAt(text, own[0]));
    const lines = text.split('\n');
    if (isBlockMap(value)) {
        lines.splice(
            found.range.end,
            0,
            `${pad}${field}:`,
            `${pad}  ${renderBlockMap(value, pad.length + 2)}`
        );
        return { text: lines.join('\n') };
    }
    if (isMetalist(value)) {
        lines.splice(
            found.range.end,
            0,
            `${pad}${field}:`,
            `${pad}  ${renderMetalist(value, pad.length + 2)}`
        );
        return { text: lines.join('\n') };
    }
    const rendered = Array.isArray(value) ? renderFlowList(value, []) : renderScalar(value);
    if (rendered.includes('\n')) return fail('the value does not fit on one line');
    lines.splice(found.range.end, 0, `${pad}${field}: ${rendered}`);
    return { text: lines.join('\n') };
}

/** The whole lines a field occupies, removed. */
function removeField(text: string, pair: Pair<Scalar, Node>): Written {
    const key = rangeOf(pair.key);
    const end = pairEnd(pair);
    if (key === null || end === null) return fail('the field has no place in the file');
    const from = lineAt(text, key[0]);
    const to = lineAt(text, Math.max(end - 1, key[0]));
    const lines = text.split('\n');
    lines.splice(from, to - from + 1);
    return { text: lines.join('\n') };
}

/** One field of one entry written into the text, or the reason it was not. */
export function applyEntryField(
    text: string,
    ident: string,
    value: string,
    field: string,
    wanted: FieldValue
): Written {
    const found = locate(text, ident, value);
    if (found === null) return fail('the entry is not in the file');
    const pair = pairOf(found.node, field);
    if (wanted === null) {
        if (pair === undefined) return fail('the field is not there');
        return removeField(text, pair);
    }
    if (pair === undefined) return appendField(text, found, field, wanted);
    if (pair.value === null) return fail('the field has no value node');
    return replaceIn(text, pair.value, wanted);
}

/** The line a new key is written on in a map: after its last key's last line. */
export function lastKeyLine(source: string, node: YAMLMap): number | null {
    if (node.items.length === 0) return null;
    const end = pairEnd(node.items[node.items.length - 1] as Pair<Scalar, Node>);
    return end === null ? null : lineAt(source, Math.max(end - 1, 0)) + 1;
}

/** The line after the last one a block map occupies. */
export function lastLineOf(source: string, node: YAMLMap): number | null {
    const range = linesOf(source, node);
    return range === null ? null : range.end;
}
