// Layer 4, test helper. A value made inside an effect root, as a component makes the state it owns:
// the effects it registers run on `flushSync` and its teardown runs on `stop`. A `cell` is a value
// the test changes from outside.

/** Run `make` in an effect root; `stop` tears every effect it registered down. */
export function rooted<T>(make: () => T): { value: T; stop: () => void } {
    let value: T | undefined;
    const stop = $effect.root(() => {
        value = make();
    });
    return { value: value as T, stop };
}

/** A reactive value a test sets from outside, read by the effects `rooted` registered. */
export function cell<T>(initial: T): { get: () => T; set: (next: T) => void } {
    let held = $state.raw(initial);
    return {
        get: () => held,
        set: (next: T) => {
            held = next;
        }
    };
}
