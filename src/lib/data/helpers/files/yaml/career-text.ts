// Layer 1, data. The career file as text: the line one of its sections stands on, which a press on
// a row of the Focus board's career banner opens the file at. A section is a top-level key (`goal`,
// `milestone`), a key of the map under a top-level key (a fact of `situation`, written as a block
// or a flow map, the key plain or quoted), or the n-th row of the list under a top-level key whose
// task is a given text (a row of `order`, written as a map with `task:` or as a plain string).
//
// The place is read from the text the caller holds, which may be a source tab's unsaved text, so a
// section that moved in it is found where it now stands. The career model carries no line numbers,
// and a row of `order` is told apart by its task and its rank among the rows with that task, since
// the model leaves out a row with no task. A task is matched only where the file writes it as a
// string, as the model reads it. The text rules of the collection files are collection-text.ts
// beside this file; a text that does not parse is refused with that file's `EntryRefusal`, so
// state/sessions/source/draft-entry.ts words the refusals of both alike.

import { isMap as isYamlMap, isScalar, isSeq, parseDocument } from 'yaml';
import type { Pair, YAMLMap } from 'yaml';
import { scalar } from '../../guards.ts';
import { lineAt, type EntryRefusal, type TextPlace } from './collection-text.ts';
import { columnOf, rangeOf } from './yaml-ranges.ts';

/**
 * Which section of the career file is asked for: a top-level key, a key (`fact`) of the map under
 * a top-level key, or the n-th (from 0) row whose task is `task` of the list under a top-level key.
 */
export type CareerAt =
    { key: string } | { key: string; fact: string } | { key: string; task: string; nth: number };

/** The key a row of the order of work writes its task under. */
const TASK = 'task';

/** The place a node starts at: its line and column from 1, the way the editor counts them. */
function startOf(source: string, node: unknown): TextPlace | null {
    const range = rangeOf(node);
    if (range === null) return null;
    return { line: lineAt(source, range[0]) + 1, column: columnOf(source, range[0]) + 1 };
}

/**
 * The place of a pair: the line of its key, with the caret where its value starts when the value
 * starts on that line, and at the key otherwise (a value on the lines under it, or none).
 */
function pairPlace(source: string, pair: Pair): TextPlace | null {
    const key = startOf(source, pair.key);
    const value = startOf(source, pair.value);
    return value !== null && key !== null && value.line === key.line ? value : key;
}

/** The pair of a map whose key reads as `name`, whatever its quoting and its scalar type. */
function pairNamed(map: YAMLMap, name: string): Pair | undefined {
    return map.items.find((item) => isScalar(item.key) && scalar(item.key.value) === name);
}

/**
 * The task a row of the list writes as a string, as a map's `task:` or as the row itself, with the
 * row's place: the `task:` pair's, or the plain row's start. Null for a row with no such task.
 */
function taskOf(source: string, row: unknown): { task: string; place: TextPlace | null } | null {
    if (isScalar(row)) {
        return typeof row.value === 'string'
            ? { task: row.value, place: startOf(source, row) }
            : null;
    }
    if (!isYamlMap(row)) return null;
    const pair = pairNamed(row, TASK);
    if (pair === undefined || !isScalar(pair.value) || typeof pair.value.value !== 'string') {
        return null;
    }
    return { task: pair.value.value, place: pairPlace(source, pair) };
}

/** The place of the n-th row of a list whose task is `task`, or null when it holds none. */
function rowPlace(source: string, value: unknown, task: string, nth: number): TextPlace | null {
    if (!isSeq(value)) return null;
    const rows = value.items.map((row) => taskOf(source, row)).filter((row) => row?.task === task);
    return rows.at(nth)?.place ?? null;
}

/**
 * Where a section of the career file stands in a text, or null when the text does not hold it (an
 * empty text among them). A text that does not parse, or whose top is no map, is refused with the
 * line to open at.
 */
export function careerAt(source: string, at: CareerAt): TextPlace | EntryRefusal | null {
    const doc = parseDocument(source);
    const error = doc.errors.at(0);
    if (error !== undefined) {
        return { code: 'file_unparsed', line: lineAt(source, error.pos[0]) + 1, key: '' };
    }
    const root = doc.contents;
    if (root === null) return null;
    if (!isYamlMap(root)) return { code: 'file_unparsed', line: 1, key: '' };
    const pair = pairNamed(root, at.key);
    if (pair === undefined) return null;
    if ('fact' in at) {
        const fact = isYamlMap(pair.value) ? pairNamed(pair.value, at.fact) : undefined;
        return fact === undefined ? null : pairPlace(source, fact);
    }
    if ('task' in at) return rowPlace(source, pair.value, at.task, at.nth);
    return pairPlace(source, pair);
}
