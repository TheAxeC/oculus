// Layer 2, server, pure. One of the deck's two saved lists rewritten inside config/present.yml.
//
// The edit is over the bytes, as every hub edit under entry-edit/ is, and never a YAML dump: the
// deck file is written by hand, its comments explain what each block is for, and a dump would come
// back with the comments gone and every quote and line break the author chose rewritten. Only the
// one list's own lines move; every other line of the file is as it was. A comment written on the
// list key's own line goes with the line, as the cockpit's edit dropped it too.
//
// A list the file does not hold yet is appended at the end of the `deck:` map rather than at the end
// of the file, so it lands under the key the deck reads it from whatever else the file grows.
//
// The edit is only safe for a file whose `deck:` map is written in blocks, which is how the file is
// written; a flow-style map has no line to replace and no line to append to. Rather than knowing
// every shape it cannot keep, setDeckLists reads its own result back and compares it with the
// original: the two lists must be what was asked and every other key must be what it was, or nothing
// is written. What the caller gets then is null, and the endpoint refuses.

import { isMap, isScalar, parse, parseDocument } from 'yaml';
import type { Node, Pair } from 'yaml';

/** The indentation a file with no nesting to read it from would be written at. */
const STEP = 4;

/** A key written as it is, rather than quoted: a word that no YAML reader would take for anything else. */
const PLAIN = /^[A-Za-z0-9][A-Za-z0-9_\-./:]*$/;

/** The map the two lists live under, and the two keys themselves. */
const DECK = 'deck';
export const SELECTION = 'selection';
export const ORDER = 'slide_order';

/** The two lists one write sets: which slides the deck shows, and where every slide of it sits. */
export type DeckLists = { selection: string[]; slideOrder: string[] };

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
 * The source with one list under `deck:` set to `keys`, replaced where the file holds that key and
 * appended to the end of the map where it does not. A source whose root is not a map, or which
 * holds no `deck:` map, is given back unchanged: there is nothing there to write into.
 */
export function setDeckList(source: string, field: string, keys: string[]): string {
    const root = parseDocument(source).contents;
    if (!isMap(root)) return source;
    const deck = root.items.find((pair) => nameOf(pair) === DECK);
    if (deck === undefined || !isMap(deck.value)) return source;

    const outer = rangeOf(deck.key);
    const map = rangeOf(deck.value);
    if (outer === null || map === null) return source;

    const firstKey = rangeOf(deck.value.items.at(0)?.key);
    const deckIndent = indentAt(source, outer[0]);
    const indent = firstKey === null ? deckIndent + STEP : indentAt(source, firstKey[0]);
    const inner = indent + Math.max(indent - deckIndent, 1);

    const newline = newlineOf(source);
    const held = deck.value.items.find((pair) => nameOf(pair) === field);
    const block = listText(field, keys, indent, inner, newline);
    if (held === undefined) {
        const at = trimmed(source, map[1], map[0]);
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

/** A map of a parsed document, or an empty one for anything that is not a map. */
function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/** Whether two parsed values are the same data, which over YAML scalars and lists is their JSON. */
function same(left: unknown, right: unknown): boolean {
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

/** Every key of a map but the named ones, as one comparable value. */
function others(map: Record<string, unknown>, skip: string[]): string {
    const held = Object.entries(map).filter(([key]) => !skip.includes(key));
    return JSON.stringify(held);
}

/**
 * Whether the edited source still says what the original said, with the two lists replaced. It is
 * the whole guard on the shapes the text edit cannot keep: the result must parse, the `deck:` map
 * must hold exactly the two lists asked for, every other key of that map must be unchanged, and
 * every other top-level key of the document must be unchanged.
 */
function kept(source: string, edited: string, lists: DeckLists): boolean {
    let before: unknown;
    let after: unknown;
    try {
        before = parse(source);
        after = parse(edited);
    } catch {
        return false;
    }
    const first = mapOf(before);
    const second = mapOf(after);
    if (others(first, [DECK]) !== others(second, [DECK])) return false;
    const deck = mapOf(second.deck);
    if (!same(deck[SELECTION], lists.selection)) return false;
    if (!same(deck[ORDER], lists.slideOrder)) return false;
    const written = [SELECTION, ORDER];
    return others(mapOf(first.deck), written) === others(deck, written);
}

/**
 * The source with both saved lists set, or null when the edit could not keep the file as it was.
 * Nothing but the two lists changes, and a source this cannot edit that way is refused whole rather
 * than written in a shape the deck would no longer read.
 */
export function setDeckLists(source: string, lists: DeckLists): string | null {
    const edited = setDeckList(
        setDeckList(source, SELECTION, lists.selection),
        ORDER,
        lists.slideOrder
    );
    return kept(source, edited, lists) ? edited : null;
}
