# Cases ruling of O137 (round 0)

The builder's first run on the unchanged tree handed back case C13. Each item below is a ruling: the case is read as written here, and the rest of the brief is unchanged.

1. C13's second sentence reads: "A hub whose own list names no literature entry reads oculus's literature entry (`src/lib/data/index.ts:199-202`), and so its `sort: [title]`. A hub whose own list names no people or funding entry has no card list of either, so there is nothing of it to sort." The first sentence is unchanged. A card list for a hub that names no people or funding entry is no part of this step, whose goal is the order of the cards a collection draws.
2. C17's Add reads: "an Add on such a collection: the new entry is drawn in its sorted place, and the card cursor stays on the card it was on." The status change and the pin are unchanged.
3. The paths this step writes gain `src/lib/server/files/project/make.ts` lines 17-18: its head comment lists what each template line sets for an entry, and item 3 adds `sort:` to those lines, so the list names its sort.
4. C18's slices are taken at `src/lib/state/boards/board/bar.ts:467`, not :466; the expected result is unchanged.
