// Layer 3, primitive. The connection state the Monaco language server client reads of its
// transport, with the change event it listens on: open, connecting or closed, as the page's port
// reports it.

import type { PortState } from '../services';

/** What the client reads of the connection. */
type ConnectionValue =
    { state: 'open' } | { state: 'connecting' } | { state: 'closed'; error: undefined };

/** The connection state, with the listeners of its change. */
export class Connection {
    #value: ConnectionValue = { state: 'connecting' };
    #listeners = new Set<(value: ConnectionValue) => void>();

    get value(): ConnectionValue {
        return this.#value;
    }

    onChange = (listener: (value: ConnectionValue) => void): { dispose(): void } => {
        this.#listeners.add(listener);
        return { dispose: () => this.#listeners.delete(listener) };
    };

    set(state: PortState): void {
        const next: ConnectionValue =
            state === 'open'
                ? { state: 'open' }
                : state === 'connecting'
                  ? { state: 'connecting' }
                  : { state: 'closed', error: undefined };
        if (next.state === this.#value.state) return;
        this.#value = next;
        for (const listener of [...this.#listeners]) listener(next);
    }
}
