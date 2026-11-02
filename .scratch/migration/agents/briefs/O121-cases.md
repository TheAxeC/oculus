# O121, cases ruled before the build

The builder's first run handed back three cases.

1. **A clipped card with chips.** Item 2 and decision 5 stand. The case reads: a pane narrower than its card with chips: the controls lie at the top, at the visible right edge, where they can be pointed at; when they fit beside the chips in the visible part, they stay in the flow after the chips. Building the case's old words was the lazy option.

2. **Focus across the place the class changes.** Option (a): `measure` hands `leastStrip` the whole strip's width, with `more` given so that the sum of the actions wins, so beside the chips means every action fits, and `fit` is the same on both sides of the class change. `leastStrip` itself does not change. A row with room for More and "..." but not for every action goes to the corner. Decision 2 reads with that. Narrowing the case was the lazy option.

3. **A card narrower than More and "..." together.** Option (a): `justify-content: flex-end` in `Card.svelte`'s rule, and `.actions.start` uses `margin-right: auto`, so the span overflows left on both rows and a clipped row with no chip still starts at the left. Narrowing the case to rows with chips was the lazy option.

The builder's five decisions for the build stand as its report states them: the class starts true on every span and the first `measure` clears it; at rest with a width not yet known, `measure` sets the class from whether the row holds chips and goes no further; the row holds chips when `line.children.length > 1`; a line with `seen <= 0` leaves the class, `fit` and the clipped width as they stand; `margin-block` stays on the span.
