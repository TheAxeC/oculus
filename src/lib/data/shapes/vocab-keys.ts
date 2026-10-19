// Layer 1, data, pure. The keys of one top-level key of config/catalogs/vocab.yml, read the one way
// the schema checks (data/snapshot/schema/lists.ts), the manifest form of the page
// (state/forms/schema.ts) and the code that decides by a word's flag all read them: a list gives
// one key for each entry that has one, and a map gives its own keys. A field narrows either to the
// rows that carry it as `true`, so `statuses` with `blocked` is the status words that carry
// `blocked: true`.

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
 * The vocabulary key and the field a `vocab.` source names after its prefix: `statuses.chip` is
 * the keys of `statuses` whose row carries `chip: true`, and `types` is every key of `types`.
 */
export function vocabSource(name: string): { key: string; field: string | undefined } {
    const dot = name.indexOf('.');
    return dot < 0
        ? { key: name, field: undefined }
        : { key: name.slice(0, dot), field: name.slice(dot + 1) };
}

/**
 * The words of a vocabulary map whose row holds a `color`, in the map's order: of `statuses`, the
 * statuses a collection entry's `status` takes.
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
 * Whether a word, compared as written, carries a flag of a vocabulary map: a project's type of
 * `types`, its tier of `tiers`. A record that holds no word carries none.
 */
export function hasWord(
    config: Record<string, unknown>,
    key: string,
    flag: string,
    word: string | undefined
): boolean {
    return word !== undefined && wordsWith(config, key, flag).includes(word);
}

/** Whether any of the words, compared as written, carries a flag: a project's status chips. */
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
 * when it carries none: a type's place in the Archival band (`dead` of `types`).
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
 * and words of one number in the map's order: the types of the Archival band.
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
