# O158 cases ruling, round 0

Axel's ruling 699 (a): the Project facts strip shows every fact, at the brief's sizes (strip type 18 px, labels about 0.72em, gaps about 1em, values cut at about 14em, the strip at the slide's inner width). The strip wraps to as many lines as its facts need; there is no line limit. The two-line limit was never Axel's, and it leaves the brief, `docs/decks.md` ("The strip is two lines at most") and every other place that states it.

1. Item 6. "Two lines at most" and "whole facts only" are replaced by: every fact drawn, whole, the strip wrapping as its facts need. No fact is hidden, so no fact moves to the tooltip for lack of room; a value cut at the value cap still ends in an ellipsis with its whole words in the tooltip.
2. C1 to C4. Expected: 0 facts hidden on every deck. C1 (`hccnet-revision`): compute, code and tier drawn. C2 (`btfno`) and C3 (`covert-applied`, `fed-multicellular-immune`): 0 hidden. C4: 0 of 25 decks hide a fact; the report gives each deck's line count from your estimate, and the look measures them.
3. C10. The counts at text size 1.5 and in a 400 px frame become line counts: every fact drawn, and the report gives how many lines the strip takes on the tallest deck in each.
4. The slide's room. The strip's height now varies by deck. The slide's layout (O157) lays out the content in the room the strip leaves, so a deck with a taller strip gets less content room and no overlap. Name in the report how the strip's height reaches that layout, and which decks lose room against today.
5. Docs. `docs/decks.md`'s strip section and `docs/HELP.md`'s Present paragraph say the strip shows every fact and wraps as they need; grep "two lines" across `src`, `tests`, `config` and `docs` (with `--exclude=local.yml`) and carry the change to each hit about the strip.

Build items 1 to 11 under this ruling. Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. After the round's last change, run the full verify list and quote its final lines in the report; a red line in a file you touched is fixed before hand-back.
