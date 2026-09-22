// Layer 2, server, pure. One list of a YAML file rewritten in place, over the bytes.
//
// The edit is over the bytes, as every hub edit under entry-edit/ is, and never a YAML dump: the
// engine's configuration files are written by hand, their comments explain what each block is for,
// and a dump would come back with the comments gone and every quote and line break the author chose
// rewritten. Only the one list's own lines move; every other line of the file is as it was. A
// comment written on the list key's own line goes with the line.
//
// The list is named by the map it lives under, or by nothing for a list at the top level of the
// document. A list the file does not hold yet is appended at the end of that map, or at the end of
// the document, so it lands where its reader looks for it whatever else the file grows.
//
// The edit is only safe for a file written in blocks, which is how these files are written; a
// flow-style map has no line to replace and no line to append to. Rather than knowing every shape
// it cannot keep, each caller reads its own result back and compares it with the original before
// anything is written: server/edit/deck-edit.ts for the deck's two lists and
// server/edit/writes/audit-mute.ts for the audit's mute list.

import { isMap, isScalar, parseDocument } from 'yaml';
import type { Node, Pair } from 'yaml';

/** The indentation a file with no nesting to read it from would be written at. */
const STEP = 4;

/** A key written as it is, rather than quoted: a word that no YAML reader would take for anything else. */
const PLAIN = /^[A-Za-z0-9][A-Za-z0-9_\-./:]*$/;

/** Where the line an offset sits on begins. */
function lineStart(source: string, at: number): number {
    return source.lastIndexOf('\n', at - 1) + 1;
}

/** The number of spaces before the first character of the line an offset sits on. */
function indentAt(source: string, at: number): number {
    const start = lineStart(source, at);
    let held = 0;
    while (source[start + held] === ' ') held += 1;
    return held;
}

/** The name of a pair whose key is a plain scalar, and the empty string for anything else. */
function nameOf(pair: Pair): string {
    const key = pair.key;
    return isScalar(key) && typeof key.value === 'string' ? key.value : '';
}

/** Where a node's own text starts and ends, the trailing comment and whitespace left outside. */
function rangeOf(node: unknown): [number, number] | null {
    const held = (node as Node | null)?.range;
    return held === undefined || held === null ? null : [held[0], held[1]];
}

/** One key written as the list's entry: plain where that reads back as itself, quoted otherwise. */
function entryText(key: string): string {
    return PLAIN.test(key) && !key.includes(': ') ? key : JSON.stringify(key);
}

/** The line ending the file is written with, which the inserted lines use too. */
function newlineOf(source: string): string {
    return source.includes('\r\n') ? '\r\n' : '\n';
}

/** The lines one list is written as, with no trailing newline. */
function listText(
    field: string,
    keys: string[],
    indent: number,
    inner: number,
    newline: string
): string {
    const pad = ' '.repeat(indent);
    if (keys.length === 0) return `${pad}${field}: []`;
    const rows = keys.map((key) => `${' '.repeat(inner)}- ${entryText(key)}`);
    return [`${pad}${field}:`, ...rows].join(newline);
}

/** The offset with trailing whitespace walked back off it, never past `floor`. */
function trimmed(source: string, at: number, floor: number): number {
    let held = at;
    while (held > floor && /\s/.test(source[held - 1])) held -= 1;
    return held;
}

/**
 * The source with one list set to `keys`, replaced where the file holds that key and appended to the
 * end of its map where it does not. `owner` is the map the list lives under, and null puts it at the
 * top level of the document. A source whose root is not a map, or which holds no such map, is given
 * back unchanged: there is nothing there to write into.
 */
export function setList(
    source: string,
    owner: string | null,
    field: string,
    keys: string[]
): string {
    const root = parseDocument(source).contents;
    if (!isMap(root)) return source;

    let outerIndent = 0;
    let map = root;
    if (owner !== null) {
        const pair = root.items.find((one) => nameOf(one) === owner);
        if (pair === undefined || !isMap(pair.value)) return source;
        const key = rangeOf(pair.key);
        if (key === null) return source;
        outerIndent = indentAt(source, key[0]);
        map = pair.value;
    }
    const span = rangeOf(map);
    if (span === null) return source;

    const firstKey = rangeOf(map.items.at(0)?.key);
    const indent =
        firstKey === null
            ? owner === null
                ? 0
                : outerIndent + STEP
            : indentAt(source, firstKey[0]);
    const inner = owner === null ? STEP : indent + Math.max(indent - outerIndent, 1);

    const newline = newlineOf(source);
    const held = map.items.find((pair) => nameOf(pair) === field);
    const block = listText(field, keys, indent, inner, newline);
    if (held === undefined) {
        const at = trimmed(source, span[1], span[0]);
        return `${source.slice(0, at)}${newline}${block}${source.slice(at)}`;
    }

    const key = rangeOf(held.key);
    if (key === null) return source;
    const value = rangeOf(held.value);
    // The edit starts at the beginning of the key's line, since the block carries its own
    // indentation. A key written with no value at all has no value node to end at, so it ends at its
    // colon; a block list ends after the newline of its last item, and a comment on the line below
    // belongs to the next key rather than to this list, so the whitespace between is walked back off.
    const from = lineStart(source, key[0]);
    const stop = trimmed(source, value === null ? source.indexOf(':', key[1]) + 1 : value[1], from);
    if (stop <= from) return source;
    return source.slice(0, from) + block + source.slice(stop);
}
