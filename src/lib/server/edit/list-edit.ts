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
// anything is written, through readBack and othersThan below: server/edit/deck-edit.ts for the
// deck's two lists, server/edit/writes/audit-mute.ts for the audit's mute list and
// server/edit/writes/rail.ts for the rail's list of pages.
//
// `isMap` names data/helpers/guards.ts's test of a parsed value in every file, so the yaml
// library's own node test is imported as `isYamlMap`.

import { isMap as isYamlMap, isScalar, isSeq, parse, parseDocument } from 'yaml';
import type { Node, Pair } from 'yaml';

/** The indentation a file with no nesting to read it from would be written at. */
const STEP = 4;

/**
 * A key written as it is, rather than quoted: a word that no YAML reader would take for anything
 * else.
 */
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
export function entryText(key: string): string {
    return PLAIN.test(key) && !key.includes(': ') ? key : JSON.stringify(key);
}

/** The line ending the file is written with, which the inserted lines use too. */
function newlineOf(source: string): string {
    return source.includes('\r\n') ? '\r\n' : '\n';
}

/** The lines one list is written as, each item already text, with no trailing newline. */
function listText(
    field: string,
    items: string[],
    indent: number,
    inner: number,
    newline: string
): string {
    const pad = ' '.repeat(indent);
    if (items.length === 0) return `${pad}${field}: []`;
    const rows = items.map((item) => `${' '.repeat(inner)}- ${item}`);
    return [`${pad}${field}:`, ...rows].join(newline);
}

/** The offset with trailing whitespace walked back off it, never past `floor`. */
function trimmed(source: string, at: number, floor: number): number {
    let held = at;
    while (held > floor && /\s/.test(source[held - 1])) held -= 1;
    return held;
}

/**
 * The source with one list set to `keys`, replaced where the file holds that key and appended to
 * the end of its map where it does not. `owner` is the map the list lives under, and null puts it
 * at the top level of the document. A source whose root is not a map, or which holds no such map,
 * is given back unchanged: there is nothing there to write into.
 */
export function setList(
    source: string,
    owner: string | null,
    field: string,
    keys: string[]
): string {
    return setItems(source, owner, field, keys.map(entryText));
}

/**
 * The same edit over items the caller has already written as YAML text, one line each: a flow map
 * `{ label: "Focus", glyph: focus, page: focus }` for a list of maps. What makes each item read
 * back as what was asked is the caller's to check, which it does by reading its result back.
 */
export function setItems(
    source: string,
    owner: string | null,
    field: string,
    items: string[]
): string {
    const root = parseDocument(source).contents;
    if (!isYamlMap(root)) return source;

    let outerIndent = 0;
    let map = root;
    if (owner !== null) {
        const pair = root.items.find((one) => nameOf(one) === owner);
        if (pair === undefined || !isYamlMap(pair.value)) return source;
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
    const held = map.items.find((pair) => nameOf(pair) === field);
    // A list the file already writes keeps the indentation its first item has, so rewriting it with
    // the same items changes no byte; a new list takes the file's own step.
    const firstItem = isSeq(held?.value) ? rangeOf(held.value.items.at(0)) : null;
    const inner =
        firstItem !== null
            ? indentAt(source, firstItem[0])
            : owner === null
              ? STEP
              : indent + Math.max(indent - outerIndent, 1);

    const newline = newlineOf(source);
    const block = listText(field, items, indent, inner, newline);
    if (held === undefined) {
        const at = trimmed(source, span[1], span[0]);
        return `${source.slice(0, at)}${newline}${block}${source.slice(at)}`;
    }

    const key = rangeOf(held.key);
    if (key === null) return source;
    const value = rangeOf(held.value);
    // The edit starts at the beginning of the key's line, since the block carries its own
    // indentation. A key written with no value at all has no value node to end at, so it ends at
    // its colon; a block list ends after the newline of its last item, and a comment on the line
    // below belongs to the next key rather than to this list, so the whitespace between is walked
    // back off.
    const from = lineStart(source, key[0]);
    const stop = trimmed(source, value === null ? source.indexOf(':', key[1]) + 1 : value[1], from);
    if (stop <= from) return source;
    return source.slice(0, from) + block + source.slice(stop);
}

/** A parsed value as a map, or an empty one for anything that is not a map. */
function rootMap(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/**
 * The text before an edit and the text after it, each read as the map of its top-level keys, or
 * null when either does not parse. It is the first half of every caller's guard: the result must
 * read back before anything in it can be compared.
 */
export function readBack(
    source: string,
    edited: string
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
    try {
        return { before: rootMap(parse(source)), after: rootMap(parse(edited)) };
    } catch {
        return null;
    }
}

/** Every key of a map but the named ones, as one comparable value. */
export function othersThan(map: Record<string, unknown>, skip: string[]): string {
    return JSON.stringify(Object.entries(map).filter(([key]) => !skip.includes(key)));
}
