// Layer 1, data. The four type guards every reader of untyped YAML and JSON needs, in one place.
//
// A parsed config file, a manifest, a feed and a socket frame all arrive as `unknown`, and every
// module that reads one narrows it the same four ways: is this a map, is this a string, what string
// is it with a fallback, and which items of this list are strings. Fifteen modules declared those
// four for themselves before this file existed. The contracts here are the ones they agreed on:
// nothing trims, nothing coerces a number to text, and a value of the wrong shape is dropped rather
// than repaired, so a bad line of a config file loses that line and nothing else.
//
// `state/` may import this beside `data/model`, which is the one row of DESIGN.md's boundary table
// this file widened; `ui/`, `shell/` and `themes/` may not.

/** An object that is not null and not an array, which is what a YAML map parses to. */
export function isMap(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The value when it is a string, else undefined. It does not trim and does not accept numbers. */
export function str(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/** The value when it is a string, else the fallback, which is the empty string by default. */
export function text(value: unknown, fallback = ''): string {
    return str(value) ?? fallback;
}

/** The string items of an array; anything that is not an array has none. */
export function strings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}
