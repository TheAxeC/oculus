# O120, cases ruled before the build

The builder's first run handed back two cases.

1. **A card with no action and no chip, on a screen that does not hover.** Case 5 and decision 6 hold on every screen. `Card.svelte` adds one rule outside the media query that takes the margin of a `.meta` with no element child: `.meta:not(:has(> *))` has `margin-top: 0`. The comment on the rule says a bare-text row would lose its margin and that no snippet draws one. Leaving a blank 6px on such a screen was the lazy option.

2. **The keyboard cursor on a Career card.** `Career.svelte` reads `cardCursor(instance.state)` as the Inbox, Radar and Leads views do; `CareerCard.svelte` takes a `cursor` prop in place of `cursor={false}`; the strategy card and each row pass `cursor === id`. The Career page's cursor then draws its outline and the card's controls. Other kinds that pass `cursor={false}` (Person, Entry, Post) are outside this step. Taking the read on the dataset card alone was the lazy option.

Brief check 3 runs as `grep -rn "data-card-actions" src tests`. No `npm run build`: the compiled rule is seen at the look.
