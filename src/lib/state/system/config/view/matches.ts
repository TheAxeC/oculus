// Layer 2, client state, pure. What a row's editor draws while a query with plain words stands: the
// row's draft is walked in order and the entries the query is found in are picked, at most
// SEARCH_DRAWN per row however deep they stand, since a cap per list would multiply through the
// nesting. A list holding a picked entry draws its picked entries and the entries above it, and the
// count of the matches drawn nowhere is a line under the row's list. A list whose matches all fall
// past the cap is filtered with no place to draw: a press on its line shows no entry, the line
// under the row counts them, and a narrower search draws them. An entry stays at its real index in
// the draft, which is what an edit of it addresses (editors/draft.ts).
//
// An entry matches when a plain word occurs in its own values or in the map keys the file wrote, a
// `kept` or `unread` field included; a nested list's entries are entries of their own and are
// walked. `Card`'s own keys and the draft's names for a value with no key of its own (`item`,
// `key`, `value`) are not words of the file and match nothing, so the map keys are read off
// `order`.
//
// An entry the reader edits under the filter (`Editor.svelte` holds the set, for the standing
// query) stays drawn whether or not it matches, so its input is not destroyed under the caret. One
// the query is found in takes its pick as any match does, so an edit changes no other list's picks;
// one the query is not found in is drawn beside the picks and takes none.

import type { Edit, Step } from '../editors/draft.ts';
import { cardsOf, type Card } from '../editors/fields.ts';
import { readQuery } from '../typed.ts';
import { entryTexts, stepsKey, wordFound } from './fold.ts';

/** The most entries a search picks in a row. */
const SEARCH_DRAWN = 25;

/** One entry of a draft: the list it is in, by its path, and its place there. */
export type Entry = { path: Step[]; index: number };

/**
 * What a search draws of a row: the places each list draws, by its path's text, an empty list of
 * places for a list whose matches all fall past the cap (a list it does not name is not filtered),
 * and how many matching entries are drawn nowhere.
 */
export type Drawn = { lists: Map<string, number[]>; more: number };

/** The words a card holds of its own: not those of the entries of its nested lists. */
function ownTexts(card: Card): string[] {
    const values = Object.values(card.fields).filter((held) => cardsOf(held).length === 0);
    return [
        ...card.order,
        ...entryTexts(values),
        ...entryTexts(card.kept),
        ...entryTexts(card.unread ?? {})
    ];
}

/** The nested lists of a card: each field holding cards, with those cards. */
function nestedLists(card: Card): [string, Card[]][] {
    return Object.entries(card.fields).flatMap(([field, held]) => {
        const cards = cardsOf(held);
        return cards.length === 0 ? [] : [[field, cards] as [string, Card[]]];
    });
}

/** The text an entry is told apart by. */
function entryKey(path: readonly Step[], index: number): string {
    return `${stepsKey(path)}#${index}`;
}

/** The walk over a draft: the words, the entries edited and what has been found so far. */
type Walk = {
    words: string[];
    edited: Set<string>;
    lists: Map<string, number[]>;
    picked: number;
    more: number;
};

/** Pick in one list and the lists under it; whether the list draws anything. */
function walkList(cards: Card[], path: Step[], walk: Walk): boolean {
    const places: number[] = [];
    let capped = false;
    for (const [index, card] of cards.entries()) {
        const edited = walk.edited.has(entryKey(path, index));
        const found = wordFound(walk.words, ownTexts(card));
        const picked = found && walk.picked < SEARCH_DRAWN;
        if (picked) walk.picked += 1;
        let drawn = edited || picked;
        for (const [field, nested] of nestedLists(card)) {
            const under = [...path, { index, field }];
            if (walkList(nested, under, walk)) drawn = true;
            else if (walk.lists.has(stepsKey(under))) capped = true;
        }
        if (found && !drawn) {
            walk.more += 1;
            capped = true;
        }
        if (drawn) places.push(index);
    }
    if (places.length > 0 || capped) walk.lists.set(stepsKey(path), places);
    return places.length > 0;
}

/**
 * What a search draws of a row's cards, or null when it filters nothing: a query with no plain
 * word, or one found in no entry.
 */
export function searchDrawn(
    cards: Card[],
    query: string,
    edited: readonly Entry[] = []
): Drawn | null {
    const { words } = readQuery(query);
    if (words.length === 0) return null;
    const keys = new Set(edited.map((one) => entryKey(one.path, one.index)));
    const walk: Walk = { words, edited: keys, lists: new Map(), picked: 0, more: 0 };
    walkList(cards, [], walk);
    return walk.lists.size === 0 ? null : { lists: walk.lists, more: walk.more };
}

/**
 * The `by` of a Move past the next drawn entry, up or down the places a list draws, or 0 when the
 * entry is the last drawn that way. `applyEdit` takes the entry out and sets it in at the place the
 * neighbour held, which lands it past that neighbour.
 */
export function moveBy(places: readonly number[], at: number, step: -1 | 1): number {
    const to = places.indexOf(at) + step;
    const next = to < 0 ? undefined : places.at(to);
    return next === undefined ? 0 : next - at;
}

/** The list of cards below a path. */
function listAt(cards: Card[], path: Step[]): Card[] {
    return path.reduce((list, step) => cardsOf(list.at(step.index)?.fields[step.field]), cards);
}

/** Whether an entry stands in the list at a path, or in a list under it. */
function inOrUnder(entry: Entry, path: Step[]): boolean {
    return (
        entry.path.length >= path.length &&
        path.every(
            (step, at) => step.index === entry.path[at].index && step.field === entry.path[at].field
        )
    );
}

/** A place of a list after a Move from one place to another. */
function placeAfter(at: number, from: number, to: number): number {
    if (at === from) return to;
    if (from < at && at <= to) return at - 1;
    return to <= at && at < from ? at + 1 : at;
}

/** An entry at the real place a Move in the list at `path` leaves it. */
function movedEntry(entry: Entry, path: Step[], from: number, to: number): Entry {
    const depth = path.length;
    if (!inOrUnder(entry, path)) return entry;
    if (entry.path.length === depth) {
        return { ...entry, index: placeAfter(entry.index, from, to) };
    }
    const steps = entry.path.map((step, at) =>
        at === depth ? { ...step, index: placeAfter(step.index, from, to) } : step
    );
    return { ...entry, path: steps };
}

/** The entries edited with one more, which is never held twice. */
function withEntry(edited: readonly Entry[], entry: Entry): Entry[] {
    const key = entryKey(entry.path, entry.index);
    return [...edited.filter((one) => entryKey(one.path, one.index) !== key), entry];
}

/**
 * The entries edited after one edit of a list drawn under a filter, on the cards it was made to: a
 * set or a Move holds its entry, an Add the new entry, each entry keeps following its real place
 * through a Move, and a Remove drops the entries of that list, whose places it shifts.
 */
export function editedAfter(edited: readonly Entry[], edit: Edit, cards: Card[]): Entry[] {
    const path = edit.path ?? [];
    switch (edit.do) {
        case 'add':
            return withEntry(edited, { path, index: listAt(cards, path).length });
        case 'set':
            return withEntry(edited, { path, index: edit.index });
        case 'remove':
            return edited.filter((one) => !inOrUnder(one, path));
        case 'move': {
            const to = edit.index + edit.by;
            const moved = edited.map((one) => movedEntry(one, path, edit.index, to));
            return withEntry(moved, { path, index: to });
        }
    }
}
