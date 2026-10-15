// Layer 3, shell. The navigation history as the shell walks it: the title bar strip's Back and
// Forward, their chords and their palette commands. The history itself is client state
// (state/workbench/history/), which is not among the stores the shell's row of the layer
// boundaries names, so the page hands it to the workbench, as it hands the F8 walk, and the
// workbench provides it here to the strip and the palette under it.

import { getContext, setContext } from 'svelte';

/** What the shell does with the history: ask whether a walk has a step, and take it. */
export type HistoryWalk = {
    /** Whether Back has a step to go to, which draws Back enabled. */
    canBack: () => boolean;
    /** Whether Forward has a step to go to. */
    canForward: () => boolean;
    /** Go to the step before; answers whether a step was shown. */
    back: () => Promise<boolean>;
    /** Go to the step after; answers whether a step was shown. */
    forward: () => Promise<boolean>;
};

/** The walk where no page hands one in, as a case that draws a part of the workbench alone. */
export const NO_WALK: HistoryWalk = {
    canBack: () => false,
    canForward: () => false,
    back: () => Promise.resolve(false),
    forward: () => Promise.resolve(false)
};

/** The context key the workbench provides the walk under. */
const HISTORY_WALK = Symbol('history-walk');

/** The walk that reads `held` at each call, so a walk handed in anew is the one walked. */
function through(held: () => HistoryWalk): HistoryWalk {
    return {
        canBack: () => held().canBack(),
        canForward: () => held().canForward(),
        back: () => held().back(),
        forward: () => held().forward()
    };
}

/** Provide the walk `held` reads to everything the workbench draws; answers that walk. */
export function provideWalk(held: () => HistoryWalk): HistoryWalk {
    const walk = through(held);
    setContext(HISTORY_WALK, walk);
    return walk;
}

/** The walk the workbench provides, or one that walks nothing where none does. */
export function useWalk(): HistoryWalk {
    return getContext<HistoryWalk | undefined>(HISTORY_WALK) ?? NO_WALK;
}
