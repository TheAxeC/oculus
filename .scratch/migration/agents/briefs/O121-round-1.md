# O121, repair round 1

The review is `.scratch/migration/agents/reviews/O121-refuter.md`. Change these and nothing else. The paths of the brief stand, with `card-layout.ts` now open to code as item 2 says.

1. **Behaviour B1, an action with no remembered width.** In `measure`'s drawn branch, an action with no remembered width sets `fit` to infinity and `over` to whether the row holds chips, and returns, so every action is drawn and measured before the flow is tried. The report's row on the first hover says what is true after this.

2. **Standards T1, the unreachable branch of `leastStrip`.** This replaces the words of the cases ruling, item 2, "`leastStrip` itself does not change". `leastStrip` goes. `card-layout.ts` exports one plain sum of the actions' widths and their gaps, which `fitActions` also uses where it sums the same thing, and `measure` calls it. `fitActions` keeps its behaviour. The doc comments of `card-layout.ts` say what is true after the change. Leaving a dead branch was the lazy option.

3. **Behaviour B2, a clipped row with no chip.** This replaces the words of the cases ruling, item 3, "a clipped row with no chip still starts at the left". A row with no chip keeps its span at the visible right edge, as a clipped row with chips does: on a row with no chip the span takes `margin-right: var(--clipped)`, `start` never stands, and `Card.svelte`'s `flex-end` does the rest. So "..." stays in reach at any sliver. The head comment of `CardActions.svelte` and the comment on `.actions.start` say what is true after the change.

4. **Proof P1.** The report quotes the whole case-run program: the driver lines, the constants and the inputs of every output line. Rerun it after the changes above and quote its new output.

Rerun the brief's "Verify before you report" and update the report, adding a section "Repair round 1" that states each item's closure.
