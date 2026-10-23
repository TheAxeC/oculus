// Layer 1, data, pure. The keys of one top-level key of config/catalogs/vocab.yml, read the one way
// the schema checks (data/snapshot/schema/lists.ts), the manifest form of the page
// (state/forms/schema.ts) and the code that decides by a word's flag all read them: a list gives
// one key for each entry that has one, and a map gives its own keys. A field narrows either to the
// rows that carry it as `true`, so `chips` with `blocked` is the chip words that carry
// `blocked: true`. A word a list does not hold is answered with the list's closest word.

import { z } from 'zod';
import { mapShape, readAs, readOr, rowsShape } from './shapes.ts';

/** The name of one vocabulary list entry: its `key` when it is a map, else the entry itself. */
const vocabKeyShape = z.union([
    z.object({ key: z.string() }).transform((row) => row.key),
    z.string()
]);

/** The names of a keyed vocabulary list, one per entry that has one. */
const vocabKeysShape = rowsShape(vocabKeyShape);

/** Whether a row carries a field as a flag: a map whose field is `true`. */
function holds(row: unknown, field: string): boolean {
    const map = readAs(mapShape, row);
    return map !== null && Object.hasOwn(map, field) && map[field] === true;
}

/**
 * The keys of a vocabulary key of vocab.yml: the entries of a list (a text, or a map's `key`) or
 * the keys of a map. With a field, only the rows that hold it count, so a plain text entry is left
 * out. Anything else has no keys.
 */
export function vocabKeys(value: unknown, field?: string): string[] {
    const map = readAs(mapShape, value);
    if (map !== null) {
        const keys = Object.keys(map);
        return field === undefined ? keys : keys.filter((key) => holds(map[key], field));
    }
    if (field === undefined) return readOr(vocabKeysShape, value, []);
    const rows: unknown[] = Array.isArray(value) ? value : [];
    return readOr(
        vocabKeysShape,
        rows.filter((row) => holds(row, field)),
        []
    );
}

/**
 * The vocabulary key and the field a `vocab.` source names after its prefix: `stages.live` is the
 * keys of `stages` whose row carries `live: true`, and `stages` is every key of `stages`.
 */
export function vocabSource(name: string): { key: string; field: string | undefined } {
    const dot = name.indexOf('.');
    return dot < 0
        ? { key: name, field: undefined }
        : { key: name.slice(0, dot), field: name.slice(dot + 1) };
}

/**
 * The words of a vocabulary map whose row holds a `color`, in the map's order: of `statuses`, every
 * status a collection entry's `status` takes.
 */
export function coloredWords(value: unknown): string[] {
    const rows = readAs(mapShape, value) ?? {};
    return Object.keys(rows).filter((word) =>
        Object.hasOwn(readAs(mapShape, rows[word]) ?? {}, 'color')
    );
}

/** The words of a vocabulary map of the merged config whose row carries a flag, as written. */
export function wordsWith(config: Record<string, unknown>, key: string, flag: string): string[] {
    return vocabKeys(Object.hasOwn(config, key) ? config[key] : undefined, flag);
}

/**
 * Whether a word, compared as written, carries a flag of a vocabulary map: a project's stage of
 * `stages`, its tier of `tiers`. A record that holds no word carries none.
 */
export function hasWord(
    config: Record<string, unknown>,
    key: string,
    flag: string,
    word: string | undefined
): boolean {
    return word !== undefined && wordsWith(config, key, flag).includes(word);
}

/** Whether any of the words, compared as written, carries a flag: a project's chips of `chips`. */
export function anyWord(
    config: Record<string, unknown>,
    key: string,
    flag: string,
    words: readonly string[]
): boolean {
    const flagged = wordsWith(config, key, flag);
    return words.some((word) => flagged.includes(word));
}

/**
 * The whole number a word, compared as written, carries for a field of a vocabulary map, or null
 * when it carries none: a stage's place in the Archival band (`dead` of `stages`).
 */
export function wordNumber(
    config: Record<string, unknown>,
    key: string,
    field: string,
    word: string | undefined
): number | null {
    const map = readAs(mapShape, Object.hasOwn(config, key) ? config[key] : undefined);
    if (word === undefined || map === null || !Object.hasOwn(map, word)) return null;
    const row = readAs(mapShape, map[word]);
    const value = row !== null && Object.hasOwn(row, field) ? row[field] : undefined;
    return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

/**
 * The words of a vocabulary map that carry a whole number for a field, in the order of that number,
 * and words of one number in the map's order: the stages of the Archival band.
 */
export function wordsNumbered(
    config: Record<string, unknown>,
    key: string,
    field: string
): string[] {
    const map = readAs(mapShape, Object.hasOwn(config, key) ? config[key] : undefined) ?? {};
    return Object.keys(map)
        .flatMap((word) => {
            const place = wordNumber(config, key, field, word);
            return place === null ? [] : [{ word, place }];
        })
        .sort((a, b) => a.place - b.place)
        .map((one) => one.word);
}

/**
 * Whether a word carries a flag of a vocabulary map: the word, trimmed and in lower case as a
 * record's status is read, is a key of the map whose row carries the flag.
 */
export function wordFlag(
    config: Record<string, unknown>,
    key: string,
    word: string,
    flag: string
): boolean {
    return wordsWith(config, key, flag).includes(word.trim().toLowerCase());
}

/**
 * The Levenshtein distance between two words: the fewest single-character insertions, deletions and
 * substitutions that turn one into the other, compared character by character as written. It keeps
 * two rows of the table, the row above and the row being filled, so it holds two lists the length
 * of `to` whatever the length of `from`.
 */
function distance(from: string, to: string): number {
    let above = Array.from({ length: to.length + 1 }, (_, at) => at);
    for (let row = 1; row <= from.length; row += 1) {
        const filled = [row];
        for (let col = 1; col <= to.length; col += 1) {
            const swap = from[row - 1] === to[col - 1] ? 0 : 1;
            filled.push(Math.min(above[col] + 1, filled[col - 1] + 1, above[col - 1] + swap));
        }
        above = filled;
    }
    return above[to.length];
}

/**
 * The word of `words` closest to `word`, the one at the smallest Levenshtein distance, the first in
 * the list's order among those at one distance, and none for an empty list: what a finding about a
 * word the list does not hold names as the word meant.
 */
export function closestWord(word: string, words: readonly string[]): string | undefined {
    let best: { word: string; distance: number } | undefined;
    for (const one of words) {
        const far = distance(word, one);
        if (best === undefined || far < best.distance) best = { word: one, distance: far };
    }
    return best?.word;
}
