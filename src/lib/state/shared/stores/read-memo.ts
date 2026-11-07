// Layer 2, client state. One client's memo of what is read out of an object it is given whole and
// never changes in place: a feed's list of entries, the map of projects, the merged config, a hub's
// words. Every card of a view asks the same question over the same object, so the answer is read
// once per object and kept with it, and an object the client no longer holds is let go with what
// was read from it. The entities store holds one for its client (state/client/entities.svelte.ts),
// so two clients never share an answer. Its shape is `ReadMemo` of shapes.ts.

import type { ReadMemo } from './shapes.ts';

/** A memo of reads for one client, empty until its first question. */
export function createReadMemo(): ReadMemo {
    const reads = new WeakMap<object, Map<string, unknown>>();
    return {
        held: <T>(owner: object, name: string, read: () => T): T => {
            let named = reads.get(owner);
            if (named === undefined) {
                named = new Map<string, unknown>();
                reads.set(owner, named);
            }
            if (named.has(name)) return named.get(name) as T;
            const made = read();
            named.set(name, made);
            return made;
        }
    };
}
