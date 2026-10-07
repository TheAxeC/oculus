// Layer 3, shared view partial. The one request of the root a source file builds through that a
// view makes inside an effect: the answer is taken while the effect that asked is still the current
// one, and a later run of the effect makes an earlier answer change nothing.

import type { LatexRoot } from '$lib/state/sessions/latex/latex-state';

/**
 * Hand the answer of a root request to `set` unless the effect has run again or ended first.
 * Answers the cleanup the effect returns.
 */
export function takeRoot(asked: Promise<LatexRoot>, set: (found: LatexRoot) => void): () => void {
    let live = true;
    void asked.then((answer) => {
        if (live) set(answer);
    });
    return () => {
        live = false;
    };
}
