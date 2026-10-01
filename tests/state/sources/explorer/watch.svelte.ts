// Layer 4, test helper. What a view's markup does with a store's read: an effect that reads it
// runs again when the state it read changes, as a row's `data-cut` and a menu's Paste item are
// drawn again. The values it saw are kept, in order, until it is stopped.

/** Every value `read` gave, the first on creation and one more per change of what it read. */
export function watch<T>(read: () => T): { seen: T[]; stop: () => void } {
    const seen: T[] = [];
    const stop = $effect.root(() => {
        $effect(() => {
            seen.push(read());
        });
    });
    return { seen, stop };
}
