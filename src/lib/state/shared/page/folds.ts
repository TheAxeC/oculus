// Layer 2, client state, pure. Which groups of a view are folded, kept in the tab's saved state as
// `folded`, the keys of its folded groups. Every view whose groups fold
// (ui/controls/heads/GroupHead.svelte) reads and writes the list through these, and the parsers of
// the views' states read it here, so it sits with the page addresses every layer of state shares.

import { z } from 'zod';
import { fieldItemsShape, readAs } from '../../../data/shapes/shapes.ts';

/** The field of a pane's saved state that holds the keys of its folded groups. */
const foldedShape = z.object({ folded: fieldItemsShape });

/**
 * The keys of the folded groups a pane's saved state holds under `folded`, each once. A state
 * without the field, or one whose value is no list, folds nothing, and an item that is no text is
 * left out. A key no group has is kept and folds nothing; the empty key folds the group that has it
 * (Venues' Other, a bucket row with an empty key).
 */
export function instanceFolded(state: unknown): string[] {
    return [...new Set(readAs(foldedShape, state)?.folded ?? [])];
}

/** The folded keys with `key` folded or unfolded, every other key kept in its order. */
export function foldedWith(folded: readonly string[], key: string, fold: boolean): string[] {
    const rest = folded.filter((one) => one !== key);
    return fold ? [...rest, key] : rest;
}

/** The presses on the groups of a view that keeps its folds under `folded` in its own state. */
export type StateFolds = {
    /** Fold the group under `key` while it is open, unfold it while it is folded. */
    toggle: (key: string) => void;
    /** Unfold the group under `key` while it is folded; none, or an open group, writes nothing. */
    open: (key: string | undefined) => void;
};

/**
 * The presses on the folds a view reads from its saved state (`folded`, the folded keys as the
 * view's parser read them) and writes back through `write`, with the rest of its state kept.
 */
export function stateFolds(
    folded: () => readonly string[],
    write: (folded: string[]) => void
): StateFolds {
    return {
        toggle: (key) => write(foldedWith(folded(), key, !folded().includes(key))),
        open: (key) => {
            if (key === undefined || !folded().includes(key)) return;
            write(foldedWith(folded(), key, false));
        }
    };
}
