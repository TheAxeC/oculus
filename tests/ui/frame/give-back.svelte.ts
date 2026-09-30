// Layer 4, test helper. What a Modal does with the focus, without a DOM: while `drawn` holds, an
// effect stands whose cleanup gives the focus back to the control that held it, which is
// Modal.svelte's cleanup. Taking the dialog away is setting `drawn` false, which is what a caller's
// {#if} around its Modal does, and the cleanup runs in the flush that follows. A dialog may also
// take the focus when it opens, as a box does through focusFirstQuietly, from the same effect.

import { giveBackQuietly } from '../../../src/lib/ui/frame/quiet-focus.ts';

/** A dialog drawn over the page, opened while `came` held the focus. */
export function drawDialog(
    came: Element | null,
    onopen?: () => void
): { answer: (act: () => void) => void } {
    let drawn = $state(true);
    $effect.root(() => {
        $effect(() => {
            if (!drawn) return;
            onopen?.();
            return () => giveBackQuietly(came);
        });
    });
    return {
        /** A yes or a no: the dialog taken away, then what the answer does, in one handler. */
        answer(act) {
            drawn = false;
            act();
        }
    };
}
