// Layer 1, data, pure. The keys of one top-level key of config/catalogs/vocab.yml, read the one way
// the schema checks (data/snapshot/schema/lists.ts), the manifest form of the page
// (state/forms/schema.ts) and the code that decides by a word's flag all read them: a list gives
// one key for each entry that has one, and a map gives its own keys. A field narrows either to the
// rows that carry it as `true`, so `chips` with `blocked` is the chip words that carry
// `blocked: true`. A word a list does not hold is answered with the list's closest word when that
// word is within half the written word's length in single-letter changes, rounded down. The tiers
// the research audit skips are read here too, as the audit and the Orphans card read them.
//
// Every helper reads the config or the value its caller passes, with no state of its own: a caller
// drawing one record passes the words of that record's hub, and a caller drawing a list over the
// records of several hubs passes their union (`unionWords`), each word once with the row of the
// first hub that holds it. The fields a hub adds to the project form (`manifest_fields`) are among
// a hub's words, and the form of that hub's projects is oculus's with them laid in
// (`withManifestFields`), which the page's form, the schema of the hub's project.yml files and the
// manifest write all read.

import { z } from 'zod';
import { rootOf } from '../helpers/hub-names.ts';
import type { Rooted } from '../model/index.ts';
import { mapShape, readAs, readOr, rowsShape } from './shapes.ts';

/**
 * The words the records of the hub `hub` are read under, and the union of every hub's words for
 * none: what a caller drawing the records of several hubs passes a helper.
 */
export type WordsOf = (hub?: string) => Record<string, unknown>;

/**
 * The words a record is read under: those of its own hub (`rootOf`) as `wordsOf` gives them, and
 * `config` when no `wordsOf` is given.
 */
export function recordWords(
    config: Record<string, unknown>,
    wordsOf: WordsOf | undefined,
    record: Rooted
): Record<string, unknown> {
    return wordsOf?.(rootOf(record)) ?? config;
}

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
 * The one word of a vocabulary map of the merged config that carries a single-use flag (`new_idea`
 * of `stages`, `default_task` of `statuses`, `default` of `tiers`), or none: none when no word
 * carries it, and none when two or more do, which is a finding of the vocabulary
 * (data/sources/config/sections/vocab.ts), so no place in the map decides which word is written.
 */
export function oneWordWith(
    config: Record<string, unknown>,
    key: string,
    flag: string
): string | undefined {
    const words = wordsWith(config, key, flag);
    return words.length === 1 ? words[0] : undefined;
}

/**
 * Whether a word, compared as written, carries a flag of a vocabulary map: a project's stage of
 * `stages`. A record that holds no word carries none.
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
function wordNumber(
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
 * The tiers `research_audit.skip_tiers` of the merged config names: the kinds of project the
 * audit's research rules leave alone and the Pillars view's Orphans card leaves out. A list that
 * is not a list of texts names none.
 */
export function skippedTiers(config: Record<string, unknown>): string[] {
    const block = readAs(mapShape, config.research_audit);
    return readOr(z.array(z.string()), block?.skip_tiers, []);
}

/**
 * The field a row of each list of a hub's words is told apart by in a union of several hubs'
 * words. A list not named here is a list of texts, each told apart by its text.
 */
const UNION_FIELD: Readonly<Record<string, string>> = {
    focus_lanes: 'key',
    roles: 'key',
    categories: 'key',
    venue_tiers: 'key',
    venue_categories: 'key',
    pillar_kinds: 'key',
    radar_buckets: 'key',
    fund_stages: 'label',
    position_stages: 'label',
    teaching_stages: 'label',
    manifest_fields: 'field'
};

/** What a row of a list is told apart by in a union: its field's value, or the row as text. */
function rowName(row: unknown, field: string | undefined): string {
    const map = readAs(mapShape, row);
    const named = map !== null && field !== undefined ? map[field] : undefined;
    if (typeof named === 'string') return named;
    return typeof row === 'string' ? row : JSON.stringify(row);
}

/**
 * The words of several hubs as one, in the order given: each key's value is the union of the
 * hubs' values, a map holding each word once with the first hub's row, in the order the words
 * first occur, and a list holding each row once (told apart as `UNION_FIELD` says) with the first
 * hub's row. A key whose values are of other kinds takes the first hub's value.
 */
export function unionWords(
    hubs: readonly Readonly<Record<string, unknown>>[]
): Record<string, unknown> {
    const union: Record<string, unknown> = {};
    const keys = [...new Set(hubs.flatMap((words) => Object.keys(words)))];
    for (const key of keys.filter((one) => one !== '__proto__')) {
        const values = hubs.flatMap((words) => (Object.hasOwn(words, key) ? [words[key]] : []));
        const maps = values.flatMap((value) => {
            const map = readAs(mapShape, value);
            return map === null ? [] : [map];
        });
        if (maps.length === values.length) {
            const merged = new Map<string, unknown>();
            for (const map of maps) {
                for (const [word, row] of Object.entries(map)) {
                    if (!merged.has(word)) merged.set(word, row);
                }
            }
            union[key] = Object.fromEntries(merged);
        } else if (values.every((value) => Array.isArray(value))) {
            const field = Object.hasOwn(UNION_FIELD, key) ? UNION_FIELD[key] : undefined;
            const seen = new Set<string>();
            union[key] = (values as unknown[][]).flat().filter((row) => {
                const name = rowName(row, field);
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            });
        } else {
            union[key] = values[0];
        }
    }
    return union;
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
 * the list's order among those at one distance, when that distance is at most half the length of
 * `word`, rounded down; none when no word lies that near, and none for an empty list. It is what a
 * finding about a word the list does not hold names as the word meant. The bound is here, in the
 * one function every such finding calls, because a word further off is no likely misspelling of
 * the word written, and naming it would mislead the reader.
 */
export function closestWord(word: string, words: readonly string[]): string | undefined {
    const bound = Math.floor(word.length / 2);
    let best: { word: string; distance: number } | undefined;
    for (const one of words) {
        const far = distance(word, one);
        if (best === undefined || far < best.distance) best = { word: one, distance: far };
    }
    return best !== undefined && best.distance <= bound ? best.word : undefined;
}

/** The key of the fields a hub adds to the project form of its own projects. */
export const MANIFEST_FIELDS_KEY = 'manifest_fields';

/**
 * The `manifest_schema` value with the rows of a hub's `manifest_fields` laid into its `fields`
 * map: each row under its `field` key, as the row less `field`, after the last of the form's fields
 * of its section and after the rows before it of that section, in the hub's order. A row with no
 * text `field`, or naming a field the map or an earlier row holds, is left out, as the hub layer
 * leaves it out with its finding. A value that is no map, and rows that are no list, give the value
 * back.
 */
export function withManifestFields(schema: unknown, rows: unknown): unknown {
    const form = readAs(mapShape, schema);
    const fields = readAs(mapShape, form?.fields);
    if (form === null || fields === null || !Array.isArray(rows) || rows.length === 0) {
        return schema;
    }
    const placed = Object.entries(fields);
    const named = new Set(Object.keys(fields));
    for (const row of rows) {
        const own = readAs(mapShape, row);
        const name = own?.field;
        if (own === null || typeof name !== 'string' || named.has(name)) continue;
        named.add(name);
        const entry = Object.fromEntries(Object.entries(own).filter(([key]) => key !== 'field'));
        const section = own.section;
        const last = placed.findLastIndex(([, one]) => readAs(mapShape, one)?.section === section);
        placed.splice(last < 0 ? placed.length : last + 1, 0, [name, entry]);
    }
    return { ...form, fields: Object.fromEntries(placed) };
}
