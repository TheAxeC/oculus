// Layer 1, data, pure. A word block: the lists `words`, `not_words`, `flags` and `not_flags` that a
// board's or a category's `stages:`, `chips:` and `forms:` name, held against a project's words of
// one vocabulary map (its stage, its chips or its form). A project meets a block when every list
// the block names holds: `words` when one of its words is in the list, `not_words` when none is,
// `flags` when one of its words carries one of the flags in the vocabulary map, `not_flags` when
// none does. A list left out places no condition. The boards, the categories, the audit and the
// config check read blocks the one way through this module, so a board and a category cannot read
// a block differently; the `words` control of an option (data/sources/config/catalog/value-rule.ts
// and the Settings view's editor) takes its four lists from here.

import { z } from 'zod';
import { mapShape, readAs, stringItemsShape } from '../shapes.ts';

/** The four lists of a block, in the order the options catalog describes them. */
export const BLOCK_LISTS = ['words', 'not_words', 'flags', 'not_flags'] as const;

/** One list of a block: its name. */
export type BlockList = (typeof BLOCK_LISTS)[number];

/** A word block as read: each list the block names, the words as written. */
export type WordBlock = Partial<Record<BlockList, string[]>>;

/** A text or a list of texts, read as the list of its texts. */
export const wordsShape = z.union([
    z.string().transform((one) => [one]),
    z.array(z.unknown()).transform((list) => stringItemsShape.parse(list))
]);

/**
 * A block as written in a config file: a map whose lists are read as texts. A value that is not a
 * map is no block, and a key that is not one of the four lists is left for the config check.
 */
export function blockOf(value: unknown): WordBlock | null {
    const map = readAs(mapShape, value);
    if (map === null) return null;
    const block: WordBlock = {};
    for (const list of BLOCK_LISTS) {
        if (!Object.hasOwn(map, list)) continue;
        const words = readAs(wordsShape, map[list]);
        if (words !== null) block[list] = words;
    }
    return block;
}

/**
 * The words of a vocabulary map whose row carries a flag: the field is `true`, or a whole number,
 * as `dead` of `stages` writes the place of a dead stage in the Archival band.
 */
function flagWords(vocabulary: unknown, flag: string): string[] {
    const map = readAs(mapShape, vocabulary) ?? {};
    return Object.keys(map).filter((word) => {
        const row = readAs(mapShape, map[word]);
        const value = row !== null && Object.hasOwn(row, flag) ? row[flag] : undefined;
        return value === true || (typeof value === 'number' && Number.isInteger(value));
    });
}

/**
 * Every flag the rows of a vocabulary map carry, each once in the order first met: the fields a
 * row holds as `true` or as a whole number.
 */
export function flagsOf(vocabulary: unknown): string[] {
    const map = readAs(mapShape, vocabulary) ?? {};
    const flags = new Set<string>();
    for (const word of Object.keys(map)) {
        const row = readAs(mapShape, map[word]) ?? {};
        for (const [field, value] of Object.entries(row)) {
            if (value === true || (typeof value === 'number' && Number.isInteger(value))) {
                flags.add(field);
            }
        }
    }
    return [...flags];
}

/**
 * Whether a project's words of one vocabulary map meet a block, `vocabulary` being that map of the
 * merged config (`stages`, `chips` or `forms`). No block places no condition.
 */
export function blockHolds(
    block: WordBlock | null,
    words: readonly string[],
    vocabulary: unknown
): boolean {
    if (block === null) return true;
    const any = (list: readonly string[]): boolean => words.some((word) => list.includes(word));
    const flagged = (flags: readonly string[]): boolean =>
        flags.some((flag) => any(flagWords(vocabulary, flag)));
    if (block.words !== undefined && !any(block.words)) return false;
    if (block.not_words !== undefined && any(block.not_words)) return false;
    if (block.flags !== undefined && !flagged(block.flags)) return false;
    if (block.not_flags !== undefined && flagged(block.not_flags)) return false;
    return true;
}

/** The one word a project writes for a field, as the list a block is held against. */
export function wordList(word: string | undefined): string[] {
    return word === undefined || word === '' ? [] : [word];
}
