// Layer 2, server, pure. The edits of a deck's present.yml over its bytes: one group's `slides:`
// list rewritten, and the entries of `order:` moved, added after one, and removed.
//
// The line edit itself is server/edit/list-edit.ts's, shared with the audit's mute list: the list
// is found under its map, `groups:` then the group, and replaced, or appended to the end of the
// group when it holds none yet, and every other line of the file stays as it was, comments
// included. What is here is the deck's own half: which key is written, and the guard that says
// whether the result means what the file meant.
//
// Rather than knowing every shape it cannot keep, setGroupSlides reads its own result back and
// compares it with the original: the parsed file must be the original with that one list replaced,
// or nothing is written and the caller refuses. A list written as a flow (`[a, b]`) is rewritten as
// a block list that reads back to the same names.
//
// The entries of `order:` are edited by the slots they own (data/sources/deck/order-text.ts): the
// entries are permuted among the slots, so a block entry such as the grid's lines moves whole and
// the comment lines between entries stay where they are. The same read-back guard holds each edit
// to the original with only the order list changed.
//
// The keys the Slides view sets beside its lists (`deck.title`, `defaults.tag_tones` and a group's
// `find`, `sort` and `discover`) are set over the bytes too, a key at a time
// (server/core/files/yaml/key-path.ts), and the read-back guard holds the result to the original
// with only those keys changed.

import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { fields, isMap, strings } from '../../data/helpers/guards.ts';
import { orderText, orderTokensIn } from '../../data/sources/deck/order-text.ts';
import { entryText, readBack, setItems, setList } from './list-edit.ts';
import { setKeyPath } from '../core/files/yaml/key-path.ts';

/** The key of a deck's groups and the key of the list a group holds. */
const GROUPS = 'groups';
const SLIDES = 'slides';

/** The names a group's `slides:` holds in a deck file, or null when it holds no such group. */
export function groupSlides(source: string, group: string): string[] | null {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return null;
    }
    const held = fields(fields(parsed)[GROUPS])[group];
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return null;
    return strings(fields(held)[SLIDES]);
}

/**
 * Whether the edited source is the original with the one list replaced: it must parse, and every
 * other key of the document, of `groups:` and of the group must be as it was.
 */
function kept(source: string, edited: string, group: string, slides: string[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    const expected = structuredClone(read.before);
    const held = fields(fields(expected[GROUPS])[group]);
    held[SLIDES] = slides;
    return isDeepStrictEqual(read.after, expected);
}

/**
 * The source with one group's `slides:` set to `slides`, or null when the edit could not keep the
 * file as it was: the group is not a map of the file, or the way the file is written cannot be
 * edited in place. A list equal to the one held returns the source itself.
 */
export function setGroupSlides(source: string, group: string, slides: string[]): string | null {
    if (groupSlides(source, group) === null) return null;
    const edited = setList(source, [GROUPS, group], SLIDES, slides);
    return kept(source, edited, group, slides) ? edited : null;
}

/** The key of a deck's order list. */
const ORDER = 'order';

/**
 * Whether the edited source is the original with `order:` holding exactly `expected` and every
 * other key as it was.
 */
function orderKept(source: string, edited: string, expected: unknown[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    return isDeepStrictEqual(read.after, { ...read.before, [ORDER]: expected });
}

/** The entries `order:` holds as the file writes them, or null when it holds no list. */
function orderValues(source: string): unknown[] | null {
    const held = readBack(source, source)?.before[ORDER];
    return Array.isArray(held) ? held : null;
}

/**
 * The source with the entries of `order:` in the order of `tokens`, which must be the tokens the
 * file holds, each once. Null when the file cannot be edited that way or the result does not read
 * back as the same entries permuted.
 */
export function setOrder(source: string, tokens: string[]): string | null {
    const held = orderTokensIn(source);
    const text = orderText(source);
    const values = orderValues(source);
    if (held === null || text === null || values === null) return null;
    const perm = tokens.map((token) => held.indexOf(token));
    if (perm.length !== held.length || new Set(perm).size !== perm.length || perm.includes(-1)) {
        return null;
    }
    const piece = (at: number): string => source.slice(text.slots[at].from, text.slots[at].to);
    let edited: string;
    if (text.flow) {
        edited = setItems(source, null, ORDER, perm.map(piece));
    } else {
        let out = '';
        let from = 0;
        for (const [at, slot] of text.slots.entries()) {
            out += source.slice(from, slot.from) + piece(perm[at]);
            from = slot.to;
        }
        edited = out + source.slice(from);
    }
    return orderKept(
        source,
        edited,
        perm.map((at) => values[at])
    )
        ? edited
        : null;
}

/**
 * The source with a file entry added to `order:` right after the entry at place `after`, at the
 * end when `after` is null or names no entry, and as the whole list when the file holds none. Null
 * when the result does not read back as the original with that one entry added.
 */
export function addOrderEntry(source: string, after: number | null, file: string): string | null {
    const held = readBack(source, source);
    if (held === null) return null;
    const values = orderValues(source) ?? [];
    const text = orderText(source);
    const place = after !== null && after >= 0 && after < values.length ? after : values.length - 1;
    const expected = values.toSpliced(place + 1, 0, file);
    let edited: string;
    if (text === null || text.flow || text.slots.length === 0) {
        const items = (text?.slots ?? []).map((slot) => source.slice(slot.from, slot.to));
        edited = setItems(source, null, ORDER, items.toSpliced(place + 1, 0, entryText(file)));
    } else {
        const slot = text.slots[place];
        const newline = source.includes('\r\n') ? '\r\n' : '\n';
        const indent = /^ */.exec(source.slice(slot.from, slot.to))?.[0] ?? '';
        const line = `${newline}${indent}- ${entryText(file)}`;
        edited = source.slice(0, slot.to) + line + source.slice(slot.to);
    }
    return orderKept(source, edited, expected) ? edited : null;
}

/**
 * The source without the entries of `order:` at the given places. Null when a place names no
 * entry or the result does not read back as the original without them.
 */
export function removeOrderEntries(source: string, places: number[]): string | null {
    const values = orderValues(source);
    const text = orderText(source);
    if (values === null || text === null || places.some((at) => at < 0 || at >= values.length)) {
        return null;
    }
    const expected = values.filter((_, at) => !places.includes(at));
    let edited: string;
    if (text.flow || expected.length === 0) {
        const kept = text.slots.filter((_, at) => !places.includes(at));
        edited = setItems(
            source,
            null,
            ORDER,
            kept.map((slot) => source.slice(slot.from, slot.to))
        );
    } else {
        let out = '';
        let from = 0;
        for (const [at, slot] of text.slots.entries()) {
            if (!places.includes(at)) continue;
            const next = source.indexOf('\n', slot.to);
            // The last line of a file with no final newline takes the break before it instead.
            const start = next === -1 ? source.lastIndexOf('\n', slot.from - 1) : slot.from;
            const end = next === -1 ? source.length : next + 1;
            out += source.slice(from, Math.max(start, from));
            from = end;
        }
        edited = out + source.slice(from);
    }
    return orderKept(source, edited, expected) ? edited : null;
}

/**
 * One key of a deck the Slides view sets: its path from the top of the file and the value it is
 * given, null to take it out.
 */
export type DeckKey = { path: string[]; value: unknown };

/** The value the file holds at a path, or null when it holds none. */
export function deckKeyAt(source: string, path: readonly string[]): unknown {
    const read = readBack(source, source);
    if (read === null) return null;
    let held: unknown = read.before;
    for (const part of path) {
        held = fields(held)[part];
        if (held === undefined) return null;
    }
    return held ?? null;
}

/** The parsed document with each key set or taken out, which the written text must read back as. */
function keysApplied(before: Record<string, unknown>, keys: readonly DeckKey[]): unknown {
    const expected = structuredClone(before);
    for (const { path, value } of keys) {
        const maps: Record<string, unknown>[] = [expected];
        for (const part of path.slice(0, -1)) {
            const map = maps[maps.length - 1];
            if (!isMap(map[part])) map[part] = {};
            maps.push(map[part] as Record<string, unknown>);
        }
        const last = path[path.length - 1];
        if (value !== null) {
            maps[maps.length - 1][last] = value;
            continue;
        }
        Reflect.deleteProperty(maps[maps.length - 1], last);
        for (let depth = maps.length - 1; depth > 0; depth -= 1) {
            if (Object.keys(maps[depth]).length > 0) break;
            Reflect.deleteProperty(maps[depth - 1], path[depth - 1]);
        }
    }
    return expected;
}

/**
 * The source with each key set to its value, or taken out when the value is null, each over the
 * bytes of the file (server/core/files/yaml/key-path.ts), so every other line stays as the file
 * has it. Null when a key cannot be written that way or the result does not read back as the
 * original with exactly these keys changed.
 */
export function setDeckKeys(source: string, keys: readonly DeckKey[]): string | null {
    let edited: string | null = source;
    for (const { path, value } of keys) {
        if (edited === null) return null;
        edited = setKeyPath(edited, path, value);
    }
    if (edited === null) return null;
    const read = readBack(source, edited);
    if (read === null) return null;
    return isDeepStrictEqual(read.after, keysApplied(read.before, keys)) ? edited : null;
}
