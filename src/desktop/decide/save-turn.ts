// Layer 2, server (the desktop host). The turn that lets one window at a time save the arrangement.
// Every window of the app keeps the arrangements in the same page storage, one key for each
// workspace, and two windows that save from the arrangement each last read can lose the other's
// change. A page therefore sends its new envelope to the host together with the key and the
// envelope it was made from; the host admits the save when that is the envelope it admitted last
// for the key (or when it holds none), and otherwise answers with the envelope it holds, which the
// page takes and then makes its change on again. Pure: the held envelopes are the closure's.

import type { SaveAnswer } from '../../lib/state/shared/stores/desktop.ts';

/** The turn: answers a save under `key` made as `next` from the envelope `from`. */
export type SaveTurn = (key: string, next: string, from: string | null) => SaveAnswer;

/** A turn that holds no envelope yet. */
export function createSaveTurn(): SaveTurn {
    const held = new Map<string, string>();
    return (key, next, from) => {
        const current = held.get(key);
        if (current !== undefined && from !== current) return { admitted: false, held: current };
        held.set(key, next);
        return { admitted: true };
    };
}
