// Layer 2, server, pure. One of the deck's two saved lists rewritten inside config/present.yml.
//
// The line edit itself is server/list-edit.ts's, shared with the audit's mute list: the list is
// found under its map and replaced, or appended to the end of that map when the file does not hold
// it yet, and every other line of the file stays as it was. What is here is the deck's own half:
// which two keys are written, and the guard that says whether the result still means what the file
// meant.
//
// Rather than knowing every shape it cannot keep, setDeckLists reads its own result back and
// compares it with the original: the two lists must be what was asked and every other key must be
// what it was, or nothing is written. What the caller gets then is null, and the endpoint refuses.

import { parse } from 'yaml';
import { setList } from './list-edit.ts';

/** The map the two lists live under, and the two keys themselves. */
const DECK = 'deck';
export const SELECTION = 'selection';
export const ORDER = 'slide_order';

/** The two lists one write sets: which slides the deck shows, and where every slide of it sits. */
export type DeckLists = { selection: string[]; slideOrder: string[] };

/**
 * The source with one list under `deck:` set to `keys`, replaced where the file holds that key and
 * appended to the end of the map where it does not. A source whose root is not a map, or which
 * holds no `deck:` map, is given back unchanged: there is nothing there to write into.
 */
export function setDeckList(source: string, field: string, keys: string[]): string {
    return setList(source, DECK, field, keys);
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
