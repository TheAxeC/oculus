// Layer 2, client state. The requests of one store that wait for their answer, counted per key: the
// store counts a request in when it sends it and out when it has answered, so a control drawn for
// that key reads whether one of them waits, and every view drawn for the key reads the same count
// because the count is the store's. A key whose count falls to nothing leaves the record, so the
// record holds only the keys that wait.

import { byKey } from '../../../data/helpers/guards.ts';

/** The requests of one store that wait for their answer, by key. */
type Waiting = {
    /** How many requests of `key` wait for their answer. */
    count: (key: string) => number;
    /** Count one request of `key` in, or one answered request out. */
    hold: (key: string, step: 1 | -1) => void;
};

export function createWaiting(): Waiting {
    let waiting = $state.raw<Record<string, number>>({});

    function count(key: string): number {
        return byKey(waiting, key) ?? 0;
    }

    function hold(key: string, step: 1 | -1): void {
        const next = count(key) + step;
        waiting = Object.fromEntries(
            Object.entries({ ...waiting, [key]: next }).filter(([, held]) => held > 0)
        );
    }

    return { count, hold };
}
