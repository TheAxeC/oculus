# Cases ruling: O154, round 0

The builder's first run handed back C13: the board lists every hub of `hubs` in the Hub group, a hub none of its projects is of at 0 (`src/lib/state/boards/board/facets.ts:270-272`, `:298-303`), so "listing the deck's hub alone" contradicts C2 and items 1, 2 and 6.

Ruling: option (a). C13 now reads, word for word:

- C13. Two hubs in the workspace: the Hub group is drawn by the board's rule, listing every hub of the workspace, the deck's hub with its count and the others at 0, as the board does; a project of the second hub with the same key as a member is never a member. Checked by reading.

The Present view passes `hubList(roots(), primary())` as the Projects board does (C2). Option (b), passing `[deck.hub]`, is not taken: it is a rule the Present view alone would have.

The planned build of the hand-back (the pane reads the deck's members from the store's whole-deck answer, which `asking` never drops and the query client never collects, so `keepFor` and the pane's `keep` are one function of the instance state and that answer) stands inside the brief; build it.
