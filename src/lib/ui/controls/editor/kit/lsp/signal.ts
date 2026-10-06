// Layer 3, primitive. A set of listeners called together, which is what Monaco's `onDidChange`
// events and the kit's own change notices are: `event` adds a listener and answers the call that
// takes it away, `fire` calls every listener there is.

/** A listener list. */
export class Signal {
    #listeners = new Set<() => void>();

    /** Add a listener; the call it answers takes it away. */
    event = (listener: () => void): { dispose(): void } => {
        this.#listeners.add(listener);
        return { dispose: () => this.#listeners.delete(listener) };
    };

    /** Call every listener, in the order they were added. */
    fire(): void {
        for (const listener of [...this.#listeners]) listener();
    }
}
