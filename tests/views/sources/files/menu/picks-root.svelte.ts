// Layer 4, test helper. Runs a builder inside an effect root, as a component's script runs, so the
// effects it makes run in the client runtime and end with `stop`.

export function inRoot<T>(make: () => T): { value: T; stop: () => void } {
    let value: T | undefined;
    const stop = $effect.root(() => {
        value = make();
    });
    return { value: value as T, stop };
}

/** Runs `read` in an effect, as a view that reads a list does, until the returned `stop`. */
export function reading(read: () => void): () => void {
    return $effect.root(() => {
        $effect(() => {
            read();
        });
    });
}
