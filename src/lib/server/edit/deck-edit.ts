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

import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { fields, strings } from '../../data/helpers/guards.ts';
import { orderText, orderTokensIn } from '../../data/sources/deck/order-text.ts';
import { entryText, readBack, setItems, setList } from './list-edit.ts';

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
