// Layer 2, server. The surgical edit of the three things a manifest is not: a collection entry, one
// subtask line, and one host line of CAREER.yml.
//
// yaml-edit.ts writes a manifest's own top-level fields; everything the views write beyond that sits
// inside a list, which that module deliberately never enters. This one addresses a list item by the
// value of its identity field, finds the lines it occupies, and edits the bytes of one field inside
// them. The rule is the same one and is the reason both modules exist: the new text must parse, and
// parsed it must equal the source with exactly the asked-for change applied. Anything else comes
// back as the source unchanged with a refusal, so a bad edit costs nothing.
//
// A subtask is one line, always: a flow map on its own line inside a `subtasks:` block, which is a
// list on an entry and either a list or a map on a manifest. The line is re-emitted whole, because
// there is nothing else on it; the block, the entry and the file around it are untouched bytes.
//
// Nothing is thrown. Every writer answers `{ text, changed, refused }`, and the two readers answer
// null when what they were asked for is not in the file.

import { isMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document, Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { asFieldValue, deepEqual, renderScalar, sameValue } from './yaml-edit.ts';
import type { EditResult, FieldValue, Refusal } from './yaml-edit.ts';

/** The key a collection file holds its records under when it has one; collections.ts reads the same. */
const LIST = 'entries';

/** The key of a checklist, on a manifest and on a collection entry alike. */
const SUBTASKS = 'subtasks';

/** The one field of a subtask line that is never cleared: without it there is no line. */
const LABEL = 'do';

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
type Written = { text: string } | { reason: string };

/** One change the verification applies to the parsed source; `remove` deletes instead of setting. */
type Change = { path: (string | number)[]; value?: unknown; remove?: boolean };

/** A host of subtasks: the map node they hang under, and its path in the parsed document. */
type Host = { node: YAMLMap; path: (string | number)[] };

/** One entry of a collection file: where it is in the file and where it is in the parsed document. */
type Located = { list: string; index: number; node: YAMLMap; range: LineRange };

function fail(reason: string): Written {
    return { reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Every named field refused for the same reason, with the source unchanged. */
function refuseAll(source: string, fields: string[], reason: string): EditResult {
    const named = fields.length === 0 ? [''] : fields;
    return { text: source, changed: [], refused: named.map((field) => ({ field, reason })) };
}

/** The document, or null when it does not parse or is not a map of keys. */
function document(source: string): Document | null {
    let doc: Document;
    try {
        doc = parseDocument(source);
    } catch {
        return null;
    }
    if (doc.errors.length > 0) return null;
    return doc.contents !== null && isMap(doc.contents) ? doc : null;
}

/** The document as plain values, or undefined when it does not parse. */
function asJs(source: string): unknown {
    const doc = document(source);
    if (doc === null) return undefined;
    try {
        return doc.toJS();
    } catch {
        return undefined;
    }
}

function rangeOf(node: unknown): [number, number, number] | null {
    const range = (node as Node | null)?.range;
    return Array.isArray(range) ? (range as [number, number, number]) : null;
}

function pairOf(map: YAMLMap, name: string): Pair<Scalar, Node> | undefined {
    return map.items.find((item) => (item.key as Scalar | undefined)?.value === name) as
        Pair<Scalar, Node> | undefined;
}

/** Where a node's value ends, before the comment or the newline its own range swallows. */
function endOffset(node: Node): number {
    const range = rangeOf(node);
    if (range === null) return 0;
    if (isSeq(node) && node.flow !== true && node.items.length > 0) {
        const last = rangeOf(node.items[node.items.length - 1]);
        if (last !== null) return last[1];
    }
    if (isMap(node) && node.flow !== true && node.items.length > 0) {
        const last = (node.items[node.items.length - 1] as Pair<Scalar, Node>).value;
        const end = last === null ? null : rangeOf(last);
        if (end !== null) return end[1];
    }
    return range[1];
}

/** Where a pair's own text ends: its value's end, or its key's when it has no value. */
function pairEnd(pair: Pair<Scalar, Node>): number | null {
    const value = pair.value as Node | null;
    if (value !== null) return endOffset(value);
    return rangeOf(pair.key)?.[1] ?? null;
}

/** The line a byte offset sits on, counting from zero. */
function lineAt(text: string, at: number): number {
    let count = 0;
    const to = Math.min(at, text.length);
    for (let index = 0; index < to; index += 1) if (text[index] === '\n') count += 1;
    return count;
}

/** The column a byte offset sits at, which is the indentation of the line it opens. */
function columnAt(text: string, at: number): number {
    return at - (text.lastIndexOf('\n', at - 1) + 1);
}

/** The indentation of one line of the text. */
function indentOf(line: string): number {
    return line.length - line.trimStart().length;
}

function splice(text: string, from: number, to: number, insert: string): string {
    return text.slice(0, from) + insert + text.slice(to);
}

/**
 * One scalar as it is written inside a flow map. A plain scalar is not safe there, since a comma or
 * a brace ends the value, so anything holding one is written double quoted; everything else keeps
 * the rendering the rest of the tree uses.
 */
function flowScalar(value: FieldValue): string {
    if (value === null) return 'null';
    if (typeof value !== 'string') return String(value);
    if (value === '' || /[,{}[\]:#]|^\s|\s$/.test(value)) return JSON.stringify(value);
    return renderScalar(value);
}

/** A list as the tree writes it inline: `[one, two]`, each item quoted as the old one was. */
function renderFlowList(values: string[], styles: (string | undefined)[]): string {
    const items = values.map((item, at) =>
        renderScalar(item, at < styles.length ? styles[at] : styles[styles.length - 1])
    );
    return `[${items.join(', ')}]`;
}

/** One record as a one-line flow map, the shape every subtask line in the tree is written in. */
export function renderFlowMap(record: Record<string, FieldValue>): string {
    const parts = Object.entries(record).map(([key, value]) => `${key}: ${flowScalar(value)}`);
    return parts.length === 0 ? '{}' : `{ ${parts.join(', ')} }`;
}

/**
 * One new entry as the lines it is written on: the identity field on the `- ` line and every other
 * field under it, in the order the file's own schema names them. A field the caller did not give a
 * value for is not written at all, which is what an empty control on the add form means.
 */
export function renderEntry(
    order: string[],
    ident: string,
    fields: Record<string, FieldValue>
): string {
    const names = [ident, ...order.filter((one) => one !== ident)];
    for (const name of Object.keys(fields)) if (!names.includes(name)) names.push(name);
    const lines: string[] = [];
    for (const name of names) {
        const value = fields[name];
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        const rendered = Array.isArray(value) ? renderFlowList(value, []) : renderScalar(value);
        if (rendered.includes('\n')) continue;
        lines.push(lines.length === 0 ? `  - ${name}: ${rendered}` : `    ${name}: ${rendered}`);
    }
    return lines.join('\n');
}

/** The quoting each item of a rewritten list had, so a list of quoted strings stays one. */
function itemStyles(node: Node): (string | undefined)[] {
    if (!isSeq(node)) return [];
    return node.items.map((item) => (isScalar(item) ? item.type : undefined));
}

/**
 * The list of records a collection file holds: `entries:` when it has one, else the first list of
 * maps that is not the file's own `schema:`. A file with neither has no entries to write.
 */
function listOf(root: YAMLMap): { key: string; seq: YAMLSeq } | null {
    const direct = pairOf(root, LIST);
    if (direct !== undefined && direct.value !== null && isSeq(direct.value)) {
        return { key: LIST, seq: direct.value };
    }
    for (const item of root.items as Pair<Scalar, Node>[]) {
        const name = (item.key as Scalar | undefined)?.value;
        if (typeof name !== 'string' || name === 'schema') continue;
        const value = item.value;
        if (value === null || !isSeq(value)) continue;
        if (value.items.length === 0 || isMap(value.items[0])) return { key: name, seq: value };
    }
    return null;
}

/** The lines a block map occupies: its first key's line to its last value's, blanks excluded. */
function linesOf(source: string, node: YAMLMap): LineRange | null {
    const own = rangeOf(node);
    if (own === null) return null;
    const end = endOffset(node);
    return {
        start: lineAt(source, own[0]),
        end: lineAt(source, Math.max(end - 1, own[0])) + 1
    };
}

/** The entry whose `ident` field holds `value`, or null when the file has no such entry. */
function locate(source: string, ident: string, value: string): Located | null {
    const doc = document(source);
    if (doc === null) return null;
    const list = listOf(doc.contents as YAMLMap);
    if (list === null) return null;
    for (let at = 0; at < list.seq.items.length; at += 1) {
        const node = list.seq.items[at] as Node;
        if (!isMap(node)) continue;
        const pair = pairOf(node, ident);
        if (pair === undefined || pair.value === null || !isScalar(pair.value)) continue;
        if (String(pair.value.value) !== String(value)) continue;
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
function verified(source: string, text: string, changes: Change[]): boolean {
    const after = asJs(text);
    const wanted = asJs(source);
    if (after === undefined || wanted === undefined) return false;
    for (const change of changes) if (!applyChange(wanted, change)) return false;
    return deepEqual(after, wanted);
}

/** One expected change applied to the parsed source, or false when the path is not there. */
function applyChange(root: unknown, change: Change): boolean {
    let holder: unknown = root;
    for (const step of change.path.slice(0, -1)) {
        if (Array.isArray(holder) && typeof step === 'number') holder = holder[step];
        else if (isRecord(holder) && typeof step === 'string') holder = holder[step];
        else return false;
    }
    const last = change.path[change.path.length - 1];
    if (Array.isArray(holder) && typeof last === 'number') {
        if (change.remove === true) holder.splice(last, 1);
        else holder[last] = change.value;
        return true;
    }
    if (!isRecord(holder) || typeof last !== 'string') return false;
    if (change.remove === true) delete holder[last];
    else holder[last] = change.value;
    return true;
}

/** Write a value over the bytes of an existing one, the quoting the file had kept. */
function replaceIn(text: string, node: Node, value: Exclude<FieldValue, null>): Written {
    const range = rangeOf(node);
    if (range === null) return fail('the value has no place in the file');
    const start = range[0];
    const end = endOffset(node);
    let rendered: string;
    if (Array.isArray(value)) {
        if (isSeq(node) && node.flow !== true && node.items.length > 0) {
            return fail('the field is a block list; this writes one line');
        }
        rendered = renderFlowList(value, itemStyles(node));
    } else {
        if (isMap(node) || isSeq(node)) return fail('the field is a block of its own');
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
    const rendered = Array.isArray(value) ? renderFlowList(value, []) : renderScalar(value);
    if (rendered.includes('\n')) return fail('the value does not fit on one line');
    const pad = ' '.repeat(columnAt(text, own[0]));
    const lines = text.split('\n');
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
function applyEntryField(
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

/**
 * Set fields of one collection entry, each in the bytes of its own value.
 *
 * A field the entry already holds that value for is not written. A field the entry has not got is
 * appended on its own line at the entry's indentation, and `null` removes the field's lines. The
 * identity field is writable, since renaming an entry is what the edit form does, but it is never
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
        const wanted = asFieldValue(raw);
        if (wanted === undefined) {
            refused.push({
                field,
                reason: 'not a string, number, boolean, list of strings or null'
            });
            continue;
        }
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
        if (field === ident) ident_value = String(wanted);
    }

    if (changed.length === 0) return { text: source, changed, refused };
    if (!verified(source, text, applied)) {
        return refuseAll(source, names, 'the edit did not verify; nothing was written');
    }
    return { text, changed, refused };
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
    if (seq === null || !isSeq(seq) || seq.flow === true) {
        return refuseAll(source, [listKey], `${listKey} is not a block list`);
    }
    const key = rangeOf(pair.key);
    if (key === null) return refuseAll(source, [listKey], 'the key has no place in the file');

    let at: number;
    if (seq.items.length === 0) {
        at = lineAt(source, key[0]) + 1;
    } else {
        const last = seq.items[seq.items.length - 1] as Node;
        const end = endOffset(last);
        at = lineAt(source, Math.max(end - 1, 0)) + 1;
    }
    const lines = source.split('\n');
    lines.splice(at, 0, '', ...block.split('\n'));
    const text = lines.join('\n');

    const before = asJs(source);
    const after = asJs(text);
    if (!isRecord(before) || !isRecord(after)) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    const had = before[listKey];
    const has = after[listKey];
    const grew =
        Array.isArray(had) &&
        Array.isArray(has) &&
        has.length === had.length + 1 &&
        deepEqual(has.slice(0, had.length), had);
    const rest = { ...before, [listKey]: null };
    const restAfter = { ...after, [listKey]: null };
    if (!grew || !deepEqual(rest, restAfter)) {
        return refuseAll(source, [listKey], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [listKey], refused: [] };
}

/** The map a `subtasks:` block hangs under: the whole file, or the entry at the given lines. */
function hostAt(source: string, range: LineRange | null): Host | null {
    const doc = document(source);
    if (doc === null) return null;
    const root = doc.contents as YAMLMap;
    if (range === null) return { node: root, path: [] };
    const list = listOf(root);
    if (list === null) return null;
    for (let at = 0; at < list.seq.items.length; at += 1) {
        const node = list.seq.items[at] as Node;
        if (!isMap(node)) continue;
        const own = rangeOf(node);
        if (own !== null && lineAt(source, own[0]) === range.start) {
            return { node, path: [list.key, at] };
        }
    }
    return null;
}

/** The `subtasks:` block of one host: its key line, its item lines, and what they are keyed by. */
function blockOf(source: string, node: YAMLMap): SubtaskBlock {
    const pair = pairOf(node, SUBTASKS);
    const key = pair === undefined ? null : rangeOf(pair.key);
    const own = rangeOf(node);
    const fallback = own === null ? 0 : columnAt(source, own[0]) + 2;
    if (pair === undefined || key === null) {
        return { key: null, indent: fallback, map: false, items: [] };
    }
    const lines = source.split('\n');
    const items: SubtaskLine[] = [];
    const value = pair.value;
    let map = false;
    if (value !== null && isSeq(value)) {
        value.items.forEach((item, at) => {
            const own_ = rangeOf(item);
            if (own_ !== null) items.push({ key: String(at), line: lineAt(source, own_[0]) });
        });
    } else if (value !== null && isMap(value)) {
        map = true;
        for (const item of value.items as Pair<Scalar, Node>[]) {
            const at = rangeOf(item.key);
            const name = (item.key as Scalar | undefined)?.value;
            if (at !== null && typeof name === 'string') {
                items.push({ key: name, line: lineAt(source, at[0]) });
            }
        }
    }
    const indent = items.length > 0 ? indentOf(lines[items[0].line]) : columnAt(source, key[0]) + 2;
    return { key: lineAt(source, key[0]), indent, map, items };
}

/**
 * The `subtasks:` block of a manifest (a null range) or of one collection entry (its line range),
 * or null when the range names no entry of the file. An absent block answers with a null key line
 * and no items, which is what addSubtask reads to know it has to make one.
 */
export function subtaskLines(source: string, range: LineRange | null): SubtaskBlock | null {
    const host = hostAt(source, range);
    return host === null ? null : blockOf(source, host.node);
}

/** The path one subtask line sits at in the parsed document. */
function subtaskPath(host: Host, block: SubtaskBlock, key: string): (string | number)[] {
    return [...host.path, SUBTASKS, block.map ? key : Number(key)];
}

/** One subtask line split into its lead (the `- ` or the key) and its flow map. */
function flowLine(line: string): { lead: string; held: Record<string, FieldValue> } | null {
    const match = /^(\s*-\s*|\s*[A-Za-z0-9_.-]+:\s*)(\{.*\})\s*$/.exec(line);
    if (match === null) return null;
    let parsed: unknown;
    try {
        parsed = parseDocument(match[2]).toJS();
    } catch {
        return null;
    }
    if (!isRecord(parsed)) return null;
    const held: Record<string, FieldValue> = {};
    for (const [key, value] of Object.entries(parsed)) {
        const held_ = asFieldValue(value);
        if (held_ === undefined) return null;
        held[key] = held_;
    }
    return { lead: match[1], held };
}

/**
 * Set or clear fields of one subtask line, which is re-emitted whole: it is one line and there is
 * nothing else on it. An empty value, a null and a false all drop the field, so `done: false` is
 * written as no `done` at all, which is how the tree holds an open line.
 */
export function setSubtask(
    source: string,
    range: LineRange | null,
    key: string,
    fields: Record<string, unknown>
): EditResult {
    const names = Object.keys(fields);
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, names, 'the entry is not in the file');
    const block = blockOf(source, host.node);
    const item = block.items.find((one) => one.key === key);
    if (item === undefined) return refuseAll(source, names, `there is no subtask ${key}`);

    const lines = source.split('\n');
    const split = flowLine(lines[item.line]);
    if (split === null) {
        return refuseAll(source, names, 'the subtask is not a one-line flow map');
    }

    const next: Record<string, FieldValue> = { ...split.held };
    const changed: string[] = [];
    const refused: Refusal[] = [];
    for (const [field, raw] of Object.entries(fields)) {
        const wanted = asFieldValue(raw);
        if (wanted === undefined) {
            refused.push({ field, reason: 'not a string, number, boolean or null' });
            continue;
        }
        const clears = wanted === null || wanted === '' || wanted === false;
        if (clears && field === LABEL) {
            refused.push({ field, reason: 'a subtask with no do line is not a subtask' });
            continue;
        }
        if (clears) {
            if (!(field in next)) continue;
            delete next[field];
        } else {
            if (sameValue(wanted, next[field])) continue;
            next[field] = wanted;
        }
        changed.push(field);
    }
    if (changed.length === 0) return { text: source, changed, refused };

    lines[item.line] = `${split.lead}${renderFlowMap(next)}`;
    const text = lines.join('\n');
    const change: Change = { path: subtaskPath(host, block, key), value: next };
    if (!verified(source, text, [change])) {
        return refuseAll(source, names, 'the edit did not verify; nothing was written');
    }
    return { text, changed, refused };
}

/** Remove one subtask line, and the `subtasks:` key with it when it was the last line. */
export function deleteSubtask(source: string, range: LineRange | null, key: string): EditResult {
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, [SUBTASKS], 'the entry is not in the file');
    const block = blockOf(source, host.node);
    const item = block.items.find((one) => one.key === key);
    if (item === undefined || block.key === null) {
        return refuseAll(source, [SUBTASKS], `there is no subtask ${key}`);
    }

    const lines = source.split('\n');
    const last = block.items.length === 1;
    lines.splice(item.line, 1);
    if (last) lines.splice(block.key, 1);
    const text = lines.join('\n');
    const change: Change = last
        ? { path: [...host.path, SUBTASKS], remove: true }
        : { path: subtaskPath(host, block, key), remove: true };
    if (!verified(source, text, [change])) {
        return refuseAll(source, [SUBTASKS], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [SUBTASKS], refused: [] };
}

/**
 * Append one subtask line to a host's block, making the block when it has none. A block written as
 * a map of keys is not appended to: the key a new line would take is the file's own vocabulary and
 * nothing here may invent one.
 */
export function addSubtask(
    source: string,
    range: LineRange | null,
    fields: Record<string, unknown>
): EditResult {
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, [SUBTASKS], 'the entry is not in the file');
    const label = fields[LABEL];
    if (typeof label !== 'string' || label.trim() === '') {
        return refuseAll(source, [LABEL], 'a subtask needs a do line');
    }
    const block = blockOf(source, host.node);
    if (block.map) {
        return refuseAll(
            source,
            [SUBTASKS],
            'the block is a map of keys; add the line in the file'
        );
    }

    const record: Record<string, FieldValue> = { do: label.trim() };
    for (const field of ['deadline', 'snooze']) {
        const value = fields[field];
        if (typeof value === 'string' && value.trim() !== '') record[field] = value.trim();
    }
    if (fields.done === true) record.done = true;

    const lines = source.split('\n');
    const line = `${' '.repeat(block.indent)}- ${renderFlowMap(record)}`;
    let held: unknown[] = [];
    if (block.key === null) {
        const own = rangeOf(host.node);
        if (own === null)
            return refuseAll(source, [SUBTASKS], 'the entry has no place in the file');
        const pad = ' '.repeat(columnAt(source, own[0]));
        const at =
            host.path.length === 0 ? lastKeyLine(source, host.node) : lastLineOf(source, host.node);
        if (at === null) return refuseAll(source, [SUBTASKS], 'the entry has no place in the file');
        lines.splice(at, 0, `${pad}${SUBTASKS}:`, `${pad}  - ${renderFlowMap(record)}`);
    } else {
        const at =
            block.items.length === 0 ? block.key + 1 : block.items[block.items.length - 1].line + 1;
        const subtasks = pairOf(host.node, SUBTASKS)?.value;
        held =
            subtasks !== undefined && subtasks !== null && isSeq(subtasks)
                ? (subtasks.toJSON() as unknown[])
                : [];
        lines.splice(at, 0, line);
    }
    const text = lines.join('\n');
    const change: Change = { path: [...host.path, SUBTASKS], value: [...held, record] };
    if (!verified(source, text, [change])) {
        return refuseAll(source, [SUBTASKS], 'the edit did not verify; nothing was written');
    }
    return { text, changed: [SUBTASKS], refused: [] };
}

/** The line a new key is written on in a map: after its last key's last line. */
function lastKeyLine(source: string, node: YAMLMap): number | null {
    if (node.items.length === 0) return null;
    const end = pairEnd(node.items[node.items.length - 1] as Pair<Scalar, Node>);
    return end === null ? null : lineAt(source, Math.max(end - 1, 0)) + 1;
}

/** The line after the last one a block map occupies. */
function lastLineOf(source: string, node: YAMLMap): number | null {
    const range = linesOf(source, node);
    return range === null ? null : range.end;
}

/**
 * Set the `status` of one host of CAREER.yml, whose hosts are one-line flow maps under `hosts:`.
 * The status is written in the bytes of the old one, or added to the flow map when the line has no
 * status yet; the vocabulary it is checked against is the caller's, not this module's.
 */
export function setHostStatus(source: string, name: string, status: string): EditResult {
    const doc = document(source);
    if (doc === null) return refuseAll(source, ['status'], 'the file does not parse');
    const pair = pairOf(doc.contents as YAMLMap, 'hosts');
    const seq = pair?.value ?? null;
    if (pair === undefined || seq === null || !isSeq(seq)) {
        return refuseAll(source, ['status'], 'the file has no hosts list');
    }
    for (let at = 0; at < seq.items.length; at += 1) {
        const node = seq.items[at] as Node;
        if (!isMap(node)) continue;
        const named = pairOf(node, 'name');
        if (named === undefined || named.value === null || !isScalar(named.value)) continue;
        if (String(named.value.value) !== name) continue;

        const held = pairOf(node, 'status');
        let out: Written;
        if (held === undefined) {
            const end =
                node.items.length === 0
                    ? null
                    : pairEnd(node.items[node.items.length - 1] as Pair<Scalar, Node>);
            out =
                end === null
                    ? fail('the host line has no field to write after')
                    : { text: splice(source, end, end, `, status: ${flowScalar(status)}`) };
        } else if (held.value === null) {
            out = fail('the host has no status value');
        } else {
            if (sameValue(status, (held.value as Scalar).value)) {
                return { text: source, changed: [], refused: [] };
            }
            out = replaceIn(source, held.value, status);
        }
        if ('reason' in out) return refuseAll(source, ['status'], out.reason);
        const change: Change = { path: ['hosts', at, 'status'], value: status };
        if (!verified(source, out.text, [change])) {
            return refuseAll(source, ['status'], 'the edit did not verify; nothing was written');
        }
        return { text: out.text, changed: ['status'], refused: [] };
    }
    return refuseAll(source, ['status'], `no host named ${name}`);
}
