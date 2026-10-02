// Layer 4, test helper. The two reactive pieces a `*.client.test.ts` file cannot write itself,
// since a rune compiles only in a `.svelte.ts` file: a flag that is state, standing for a tab's
// `shown`, and a `$derived` read by an effect, counting how often its body ran.

/** A boolean held as state, read through `get` and moved through `set`. */
export function flag(initial: boolean): { get: () => boolean; set: (value: boolean) => void } {
    let value = $state(initial);
    return {
        get: () => value,
        set: (next) => {
            value = next;
        }
    };
}

/**
 * A `$derived` over `read`, kept alive by an effect. `runs` counts the runs of the derived's body,
 * `last` is the value it last answered, and `stop` ends the effect.
 */
export function derivedRuns<T>(read: () => T): {
    runs: () => number;
    last: () => T | undefined;
    stop: () => void;
} {
    let runs = 0;
    let last: T | undefined;
    const stop = $effect.root(() => {
        const value = $derived.by(() => {
            runs += 1;
            return read();
        });
        $effect(() => {
            last = value;
        });
    });
    return { runs: () => runs, last: () => last, stop };
}
