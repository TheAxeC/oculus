// Layer 2, server. Reading and editing subtask blocks lives here because checklist writes change
// independently of collection entry fields.

import { isMap, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { asFieldValue, sameValue } from '../yaml-edit.ts';
import type { EditResult, FieldValue, Refusal } from '../yaml-edit.ts';
import { renderFlowMap } from './render.ts';
import {
    LABEL,
    SUBTASKS,
    columnAt,
    document,
    indentOf,
    isRecord,
    lastKeyLine,
    lastLineOf,
    lineAt,
    listOf,
    pairOf,
    rangeOf,
    refuseAll,
    verified,
    type Change,
    type Host,
    type LineRange,
    type SubtaskBlock,
    type SubtaskLine
} from './lines.ts';

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
