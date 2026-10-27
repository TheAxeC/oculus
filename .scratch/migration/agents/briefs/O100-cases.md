# O100, the round-0 ruling on the builder's hand-back

The hand-back is right: `span.tip` around the button is `inline-flex` (`src/lib/ui/menu/Tooltip.svelte:301-304`), an atomic inline box that an underline set on a `display: inline` span does not reach (`src/lib/views/sources/repositories/merge/MergeSide.svelte:199-200` says the same). Item 4's word "inline" was the brief's, not ruling 524's.

1. Option 1 of the hand-back. The name's span is `display: inline-flex; min-width: 0`, as `src/lib/views/boards/person/Person.svelte:408-417` gives its `.link`, and the rule stays on the span, so the button inherits the colour and the underline. Item 4 reads: the span is an inline-level box, so the names still wrap as one run of words with their joins between them, each name whole on its line, and the joins are never underlined.
2. Ruling 524 says "with keyboard focus". Decision 1 of the brief is replaced: the focus selector is `:has(:global(:focus-visible))`, as `src/lib/views/boards/focus/lanes/LaneCard.svelte:263-266` gives it, so the underline and the accent colour hold under the pointer and while the name holds keyboard focus, and not after a mouse click alone.
3. Option 2 (a `:global(button)` rule reaching into the primitive) is not taken; option 3 (items 2 and 4 to the letter, no underline) is the lazy option and is not taken.

Build items 1 to 5 under these rulings, run the checks of "Verify before you report", and append "## After the round-0 ruling" to your report with each item's change, the cases' reading after the change and the quoted check lines.
