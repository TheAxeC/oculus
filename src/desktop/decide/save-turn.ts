// Layer 2, server (the desktop host). The turn that lets one window at a time save the arrangement.
// Every window of the app keeps the arrangement in the same page storage, and two windows that
// save from the arrangement each last read can lose the other's change. A page therefore sends
// its new envelope to the host together with the envelope it was made from; the host admits the
// save when that is the envelope it admitted last (or when it holds none), and otherwise answers
// with the envelope it holds, which the page takes and then makes its change on again. Pure: the
// held envelope is the closure's.

import type { SaveAnswer } from '../../lib/state/shared/stores/desktop.ts';

/** The turn: answers a save made as `next` from the envelope `from`. */
export type SaveTurn = (next: string, from: string | null) => SaveAnswer;

/** A turn that holds no envelope yet. */
export function createSaveTurn(): SaveTurn {
    let held: string | null = null;
    return (next, from) => {
        if (held !== null && from !== held) return { admitted: false, held };
        held = next;
        return { admitted: true };
    };
}
