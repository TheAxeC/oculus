// Layer 1, data. The type guards every reader of untyped YAML and JSON needs, in one place.
//
// A value from outside the process (a parsed file, a request body, a socket frame, an answer of
// another program or service) is read through a zod schema at its reader, as DESIGN.md's "Untyped
// input" says. What is here is for the bare map test and for the values a reader already holds: is
// this a map, what map is it with an empty one for anything else, is this a string, what string is
// it with a fallback, what text is this scalar, which items of this list are strings, and what does
// a record or a list hold under a key or at a position it may not have, and are two values equal
// with the keys of every map in the same order, and what key does a title make. The contracts here
// are the ones their readers agreed on: nothing trims, nothing coerces a number to text, and a
// value of the wrong shape is dropped rather than repaired, so a bad line of a config file loses
// that line and nothing else.
//
// `state/` may import this beside `data/model`, which is the one row of DESIGN.md's boundary table
// this file widened; `ui/`, `shell/` and `themes/` may not.

import { isEqual } from 'lodash-es';

/** An object that is not null and not an array, which is what a YAML map parses to. */
export function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The value when it is a map, else an empty one, for reading a field off a parse of any shape. */
export function fields(value: unknown): Record<string, unknown> {
    return isMap(value) ? value : {};
}

/** The value when it is a string, else undefined. It does not trim and does not accept numbers. */
export function str(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/**
 * A scalar as the text of it: a string as it is, a number or a boolean written out, and anything
 * else the fallback, so a map never reaches a reader as `[object Object]` and a list never as its
 * items run together by commas.
 */
export function scalar(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
}

/** The value when it is a string, else the fallback, which is the empty string by default. */
export function text(value: unknown, fallback = ''): string {
    return str(value) ?? fallback;
}

/**
 * One value of a record by its key. An index signature promises the checker every key, so a read of
 * a record built from a file, a payload or a catalog is typed as present when it is not; this
 * reader hands back what is there, and nothing for a key the record does not hold. A name off the
 * object prototype is not a key the record holds, so `toString` reads as nothing rather than as a
 * method.
 */
export function byKey<T>(record: Record<string, T>, key: string): T | undefined {
    return Object.hasOwn(record, key) ? record[key] : undefined;
}

/**
 * One item of a list by its position, and nothing for a position the list does not hold. Unlike
 * `list.at()`, a negative position is no item rather than one counted from the end.
 */
export function item<T>(list: readonly T[], index: number): T | undefined {
    return index >= 0 && index < list.length ? list[index] : undefined;
}

/** The string items of an array; anything that is not an array has none. */
export function strings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

/**
 * A finite number from merged config, or null when that key is absent or invalid. The rail badges
 * and the Focus lanes both read a threshold this way, so the rule sits here, below every state
 * folder that reads one.
 */
export function numericSetting(config: Record<string, unknown>, key: string): number | null {
    const value = config[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * The map `focus:` of the merged config (config/behavior.yml): the Focus board's horizons,
 * thresholds, cadences and lists. A config whose `focus` is no map has an empty one.
 */
export function focusBlock(config: Record<string, unknown>): Record<string, unknown> {
    const block = config.focus;
    return isMap(block) ? block : {};
}

/** A finite number under `focus:` of the merged config, or null when absent or invalid. */
export function focusSetting(config: Record<string, unknown>, key: string): number | null {
    return numericSetting(focusBlock(config), key);
}

/**
 * Whether two values are equal with the keys of every map in the same order. A deep equality
 * alone calls `{ a, b }` and `{ b, a }` equal, and a write that only reorders a map is a change to
 * a file.
 */
export function sameInOrder(a: unknown, b: unknown): boolean {
    return isEqual(a, b) && JSON.stringify(a) === JSON.stringify(b);
}

/**
 * A text made into a key: the accents taken off, lower case, and every other run of characters a
 * hyphen, with none at either end. `max` cuts the key to at most that many characters, and the cut
 * never leaves a hyphen at its end. A text with no ASCII letter or digit gives the empty key.
 */
export function slugOf(source: string, max = Number.POSITIVE_INFINITY): string {
    return source
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '')
        .slice(0, max)
        .replace(/-+$/, '');
}
