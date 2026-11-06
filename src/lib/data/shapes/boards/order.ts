// Layer 1, data, pure. The one order rule of the boards and the decks: how two projects compare
// under the words of a category's `sort:` (`stage`, `year`, `title`) and the stage order, and the
// order a deck places the categories of `categories:` in, by `deck_order` in
// config/catalogs/vocab.yml. A board's section orders its cards by it after the pinned ones
// (state/boards/board/presets.ts `compareCards`), and a deck's discovering group orders the decks
// it adds by it (data/sources/deck/groups.ts), so the two read one comparison. It is here, below
// both, since the deck reader is layer 1 and the boards are layer 2.

import { strings } from '../../helpers/guards.ts';
import { vocabKeys } from '../vocab-keys.ts';
import { categoriesOf, type CardSort, type Category } from './categories.ts';

/** What a project is compared by: its stage, its year and its title. */
type Ordered = { stage?: string; year?: number; title: string };

/**
 * Where a value sorts in `order`: its place there, and after every value the order names for a
 * value it does not name or no value at all.
 */
export function stageRank(stage: string | undefined, order: readonly string[]): number {
    const at = stage === undefined ? -1 : order.indexOf(stage);
    return at < 0 ? order.length : at;
}

/** The board's own order of its cards after the pinned ones: by stage, then by title. */
export const BOARD_SORT: readonly CardSort[] = ['stage', 'title'];

/**
 * How two projects compare under one word of a category's `sort:`, below 0 when `left` goes first:
 * `stage` by its place in `order` (`stageRank`), `year` newest first with a project with no year
 * after every project with one, a year of 0 being a year, and `title` by its letters.
 */
function byWord(word: CardSort, left: Ordered, right: Ordered, order: readonly string[]): number {
    switch (word) {
        case 'stage':
            return stageRank(left.stage, order) - stageRank(right.stage, order);
        case 'year':
            if (left.year === undefined || right.year === undefined) {
                return Number(left.year === undefined) - Number(right.year === undefined);
            }
            return right.year - left.year;
        case 'title':
            return left.title.localeCompare(right.title);
    }
}

/**
 * How two projects compare, below 0 when `left` goes first: each word of `words` in turn, each
 * breaking the ties the words before it leave, under the stage order `order`; 0 when every word
 * ties. No pin is read here: a board puts its pinned cards first itself.
 */
export function compareProjects(
    left: Ordered,
    right: Ordered,
    words: readonly CardSort[],
    order: readonly string[]
): number {
    for (const word of words) {
        const by = byWord(word, left, right, order);
        if (by !== 0) return by;
    }
    return 0;
}

/**
 * What a deck orders the decks a group discovers by, read once from one hub's merged config: the
 * rows a project is filed under, the same rows in the order a deck places them, the stage order and
 * the config the rows' blocks are held against.
 */
export type DeckOrder = {
    /**
     * The rows of `categories:`, in the list's order; a project's category is the first row that
     * holds it.
     */
    categories: readonly Category[];
    /**
     * The same rows in the order a deck places them: those `deck_order` names, in its order, then
     * those it leaves out, in the order of `categories:`.
     */
    placed: readonly Category[];
    /** The stage order: the words of `stages:`. */
    stages: readonly string[];
    /** The merged config the rows' `stages:` and `forms:` blocks are held against. */
    vocab: Record<string, unknown>;
};

/**
 * The rows of `categories` in the order a deck places them: those the keys of `deck_order` name, in
 * its order, then those it leaves out, in the order of `categories:`. A key no row holds is passed
 * over; the merge reports one a hub's own list names (data/sources/config/merge/hub-layer.ts).
 */
function placedRows(categories: readonly Category[], keys: readonly string[]): Category[] {
    const listed = new Set(
        keys.flatMap((key) => categories.find((category) => category.key === key) ?? [])
    );
    return [...listed, ...categories.filter((category) => !listed.has(category))];
}

/** The deck order of a merged config: its categories, placed by its `deck_order`, its stages. */
export function deckOrderOf(config: Record<string, unknown>): DeckOrder {
    const categories = categoriesOf(config);
    return {
        categories,
        placed: placedRows(categories, strings(config.deck_order)),
        stages: vocabKeys(config.stages),
        vocab: config
    };
}
