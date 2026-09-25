// Layer 1, data. The type guards every reader of untyped YAML and JSON needs, in one place.
//
// A parsed config file, a manifest, a feed, a socket frame and an endpoint's answer all arrive as
// `unknown`, and every module that reads one narrows it the same few ways: is this a map, what map
// is it with an empty one for anything else, is this a string, what string is it with a fallback,
// what text is this scalar, which items of this list are strings, and what does a record or a list
// hold under a key or at a position it may not have. The contracts here are the ones their readers
// agreed on:
// nothing trims, nothing coerces a number to text, and a value of the wrong shape is dropped rather
// than repaired, so a bad line of a config file loses that line and nothing else.
//
// `state/` may import this beside `data/model`, which is the one row of DESIGN.md's boundary table
// this file widened; `ui/`, `shell/` and `themes/` may not.

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
