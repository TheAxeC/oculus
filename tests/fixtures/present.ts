// Layer 4, test helper. The value a case has established, read once. A case that has asserted a
// value exists still holds a `T | undefined`, and reading a field off it needs the narrowing spelled
// out; this does it in one word and refuses the case loudly when the value is missing, so a broken
// fixture fails on its own line rather than as a confusing failure further down.

/** The value when it is there, else a failure naming what the case expected to find. */
export function present<T>(value: T | null | undefined, what: string): T {
    if (value === null || value === undefined) throw new Error(`the case has no ${what}`);
    return value;
}
