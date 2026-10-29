// Layer 2, server. Reading and editing the blocks of one-line flow maps a card edits line by line
// lives here: the `subtasks:` checklist and the `followup:` notes, each a list of lines under a
// manifest or a collection entry. They change independently of collection entry fields, and the
// two blocks differ only in their key and in the text fields a new line may carry (`LINE_FIELDS`);
// a line of either may be done and may name people (`LINE_PEOPLE` of data/shapes/shapes.ts).
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`, and the yaml library's own
// node test is imported as `isYamlMap`.

import { isMap as isYamlMap, isSeq, parseDocument } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { asFieldValue, sameValue } from '../../core/files/yaml/yaml-edit.ts';
import { REFUSALS, said, why } from '../../core/files/yaml/why.ts';
import type { EditResult, Refusal } from '../../core/files/yaml/yaml-edit.ts';
import type { FieldValue } from '../../core/files/yaml/yaml-values.ts';
import { lineAt, listOf } from '../../../data/helpers/files/yaml/collection-text.ts';
import { pairOf, rangeOf } from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import { renderFlowMap } from './render.ts';
import {
    FOLLOWUP,
    LABEL,
    SUBTASKS,
    columnAt,
    document,
    indentOf,
    lastKeyLine,
    lastLineOf,
    refuseAll,
    verified,
    type Change,
    type Host,
    type LineBlock,
    type LineRange,
    type SubtaskBlock,
    type SubtaskLine
} from './lines.ts';
import { isMap, strings } from '../../../data/helpers/guards.ts';
import { LINE_PEOPLE } from '../../../data/shapes/shapes.ts';

/**
 * The text fields a new line of each block carries besides its `do`, its `done` and its people: a
 * subtask's deadline and snooze day, a follow-up note's date before which it stays hidden.
 */
const LINE_FIELDS: Record<LineBlock, string[]> = {
    [SUBTASKS]: ['deadline', 'snooze'],
    [FOLLOWUP]: ['after']
};

/** The refusals that name the block they are about, in the words of each block. */
const BLOCK_REFUSALS: Record<
    LineBlock,
    { none: string; notFlow: string; noDo: string; needsDo: string; isMap: string }
> = {
    [SUBTASKS]: {
        none: REFUSALS.noSubtask,
        notFlow: REFUSALS.subtaskNotFlow,
        noDo: REFUSALS.subtaskNoDo,
        needsDo: REFUSALS.subtaskNeedsDo,
        isMap: REFUSALS.subtaskBlockIsMap
    },
    [FOLLOWUP]: {
        none: REFUSALS.noFollowup,
        notFlow: REFUSALS.followupNotFlow,
        noDo: REFUSALS.followupNoDo,
        needsDo: REFUSALS.followupNeedsDo,
        isMap: REFUSALS.followupBlockIsMap
    }
};

function hostAt(source: string, range: LineRange | null): Host | null {
    const doc = document(source);
    if (doc === null) return null;
    const root = doc.contents as YAMLMap;
    if (range === null) return { node: root, path: [] };
    const list = listOf(root);
    if (list === null) return null;
    for (let at = 0; at < list.seq.items.length; at += 1) {
        const node = list.seq.items[at] as Node;
        if (!isYamlMap(node)) continue;
        const own = rangeOf(node);
        if (own !== null && lineAt(source, own[0]) === range.start) {
            return { node, path: [list.key, at] };
        }
    }
    return null;
}

/** One block of one host: its key line, its item lines, and what they are keyed by. */
function blockOf(source: string, node: YAMLMap, name: LineBlock): SubtaskBlock {
    const pair = pairOf(node, name);
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
    } else if (value !== null && isYamlMap(value)) {
        map = true;
        for (const item of value.items as Pair<Scalar, Node>[]) {
            const at = rangeOf(item.key);
            const word = (item.key as Scalar | undefined)?.value;
            if (at !== null && typeof word === 'string') {
                items.push({ key: word, line: lineAt(source, at[0]) });
            }
        }
    }
    const indent = items.length > 0 ? indentOf(lines[items[0].line]) : columnAt(source, key[0]) + 2;
    return { key: lineAt(source, key[0]), indent, map, items };
}

/**
 * One block of a manifest (a null range) or of one collection entry (its line range), or null when
 * the range names no entry of the file. An absent block answers with a null key line and no items,
 * which is what addSubtask reads to know it has to make one.
 */
export function subtaskLines(
    source: string,
    range: LineRange | null,
    name: LineBlock = SUBTASKS
): SubtaskBlock | null {
    const host = hostAt(source, range);
    return host === null ? null : blockOf(source, host.node, name);
}

/**
 * Every line of one block of one host as its own map, keyed the way the block keys it: the index
 * as text for a list, the name for a map. The change log reads the text before an edit and the text
 * the edit produced through this one reader, so the value it records as written and the value the
 * file will hold cannot disagree.
 */
export function subtaskValues(
    source: string,
    range: LineRange | null,
    name: LineBlock = SUBTASKS
): Record<string, Record<string, FieldValue>> {
    const host = hostAt(source, range);
    if (host === null) return {};
    const block = blockOf(source, host.node, name);
    const lines = source.split('\n');
    const values: Record<string, Record<string, FieldValue>> = {};
    for (const item of block.items) {
        const split = flowLine(lines[item.line]);
        if (split !== null) values[item.key] = split.held;
    }
    return values;
}

/** The path one line sits at in the parsed document. */
function subtaskPath(
    host: Host,
    block: SubtaskBlock,
    name: LineBlock,
    key: string
): (string | number)[] {
    return [...host.path, name, block.map ? key : Number(key)];
}

/** One line split into its lead (the `- ` or the key) and its flow map. */
function flowLine(line: string): { lead: string; held: Record<string, FieldValue> } | null {
    const match = /^(\s*-\s*|\s*[A-Za-z0-9_.-]+:\s*)(\{.*\})\s*$/.exec(line);
    if (match === null) return null;
    let parsed: unknown;
    try {
        parsed = parseDocument(match[2]).toJS();
    } catch {
        return null;
    }
    if (!isMap(parsed)) return null;
    const held: Record<string, FieldValue> = {};
    for (const [key, value] of Object.entries(parsed)) {
        const held_ = asFieldValue(value);
        if (held_ === undefined) return null;
        held[key] = held_;
    }
    return { lead: match[1], held };
}

/**
 * Set or clear fields of one line of a block, which is re-emitted whole: it is one line and there
 * is nothing else on it. An empty value, a null and a false all drop the field, so `done: false` is
 * written as no `done` at all, which is how the tree holds an open line.
 */
export function setSubtask(
    source: string,
    range: LineRange | null,
    key: string,
    fields: Record<string, unknown>,
    catalog: Record<string, string>,
    name: LineBlock = SUBTASKS
): EditResult {
    const names = Object.keys(fields);
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, names, why(REFUSALS.entryNotInFile), catalog);
    const block = blockOf(source, host.node, name);
    const item = block.items.find((one) => one.key === key);
    if (item === undefined) {
        return refuseAll(source, names, why(BLOCK_REFUSALS[name].none, key), catalog);
    }

    const lines = source.split('\n');
    const split = flowLine(lines[item.line]);
    if (split === null) {
        return refuseAll(source, names, why(BLOCK_REFUSALS[name].notFlow), catalog);
    }

    const next: Record<string, FieldValue> = { ...split.held };
    const changed: string[] = [];
    const refused: Refusal[] = [];
    for (const [field, raw] of Object.entries(fields)) {
        const wanted = asFieldValue(raw);
        if (wanted === undefined) {
            refused.push({ field, reason: said(catalog, why(REFUSALS.notScalar)) });
            continue;
        }
        const clears = wanted === null || wanted === '' || wanted === false;
        if (clears && field === LABEL) {
            refused.push({ field, reason: said(catalog, why(BLOCK_REFUSALS[name].noDo)) });
            continue;
        }
        if (clears) {
            if (!(field in next)) continue;
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
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
    const change: Change = { path: subtaskPath(host, block, name, key), value: next };
    if (!verified(source, text, [change])) {
        return refuseAll(source, names, why(REFUSALS.unverified), catalog);
    }
    return { text, changed, refused };
}

/** Remove one line of a block, and the block's key with it when it was the last line. */
export function deleteSubtask(
    source: string,
    range: LineRange | null,
    key: string,
    catalog: Record<string, string>,
    name: LineBlock = SUBTASKS
): EditResult {
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, [name], why(REFUSALS.entryNotInFile), catalog);
    const block = blockOf(source, host.node, name);
    const item = block.items.find((one) => one.key === key);
    if (item === undefined || block.key === null) {
        return refuseAll(source, [name], why(BLOCK_REFUSALS[name].none, key), catalog);
    }

    const lines = source.split('\n');
    const last = block.items.length === 1;
    lines.splice(item.line, 1);
    if (last) lines.splice(block.key, 1);
    const text = lines.join('\n');
    const change: Change = last
        ? { path: [...host.path, name], remove: true }
        : { path: subtaskPath(host, block, name, key), remove: true };
    if (!verified(source, text, [change])) {
        return refuseAll(source, [name], why(REFUSALS.unverified), catalog);
    }
    return { text, changed: [name], refused: [] };
}

/**
 * The person keys a people field of a line is written with: each trimmed, a blank one dropped and
 * a key given twice written once, in the order given; null when no key is left, which drops the
 * field.
 */
export function peopleKeys(keys: readonly string[]): string[] | null {
    const held = [...new Set(keys.map((one) => one.trim()).filter((one) => one !== ''))];
    return held.length === 0 ? null : held;
}

/**
 * Add one line to a block of a host, making the block when it has none: at its end, or before the
 * line at the index `at` when the block holds a line there. The line carries its `do`, the text
 * fields of its block (`LINE_FIELDS`), `done: true` when it is given so, and the people it names (a
 * person key, or a list of keys written `[a, b]`); any other field is dropped. A block written as a
 * map of keys is not added to: the key a new line would take is the file's own vocabulary and
 * nothing here may invent one.
 */
export function addSubtask(
    source: string,
    range: LineRange | null,
    fields: Record<string, unknown>,
    catalog: Record<string, string>,
    name: LineBlock = SUBTASKS,
    at?: number
): EditResult {
    const host = hostAt(source, range);
    if (host === null) return refuseAll(source, [name], why(REFUSALS.entryNotInFile), catalog);
    const label = fields[LABEL];
    if (typeof label !== 'string' || label.trim() === '') {
        return refuseAll(source, [LABEL], why(BLOCK_REFUSALS[name].needsDo), catalog);
    }
    const block = blockOf(source, host.node, name);
    if (block.map) {
        return refuseAll(source, [name], why(BLOCK_REFUSALS[name].isMap), catalog);
    }

    const record: Record<string, FieldValue> = { do: label.trim() };
    for (const field of LINE_FIELDS[name]) {
        const value = fields[field];
        if (typeof value === 'string' && value.trim() !== '') record[field] = value.trim();
    }
    if (fields.done === true) record.done = true;
    for (const field of LINE_PEOPLE) {
        const value = fields[field];
        const keys = Array.isArray(value) ? peopleKeys(strings(value)) : null;
        if (typeof value === 'string' && value.trim() !== '') record[field] = value.trim();
        else if (keys !== null) record[field] = keys;
    }

    const lines = source.split('\n');
    const line = `${' '.repeat(block.indent)}- ${renderFlowMap(record)}`;
    let list: unknown[] = [record];
    if (block.key === null) {
        const own = rangeOf(host.node);
        if (own === null) return refuseAll(source, [name], why(REFUSALS.entryNoPlace), catalog);
        const pad = ' '.repeat(columnAt(source, own[0]));
        const place =
            host.path.length === 0 ? lastKeyLine(source, host.node) : lastLineOf(source, host.node);
        if (place === null) return refuseAll(source, [name], why(REFUSALS.entryNoPlace), catalog);
        lines.splice(place, 0, `${pad}${name}:`, `${pad}  - ${renderFlowMap(record)}`);
    } else {
        const value = pairOf(host.node, name)?.value;
        const held: unknown[] =
            value !== undefined && value !== null && isSeq(value) ? value.toJSON() : [];
        // The line the new one goes before, when `at` names one; else it goes after the last.
        const next = at === undefined ? undefined : block.items[at];
        const last = block.items[block.items.length - 1] as SubtaskLine | undefined;
        const place = next?.line ?? (last === undefined ? block.key + 1 : last.line + 1);
        lines.splice(place, 0, line);
        list =
            next === undefined
                ? [...held, record]
                : [...held.slice(0, at), record, ...held.slice(at)];
    }
    const text = lines.join('\n');
    const change: Change = { path: [...host.path, name], value: list };
    if (!verified(source, text, [change])) {
        return refuseAll(source, [name], why(REFUSALS.unverified), catalog);
    }
    return { text, changed: [name], refused: [] };
}
