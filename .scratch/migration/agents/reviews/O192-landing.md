# O192 landing

Position: the migration plan, step O192, exclude in the board filters, landed; no step is queued after it. Next: the app rebuilt from main and copied over `~/Applications/oculus.app`.

## Open items

None.

## Landed

- Check of Steps 1: the runner's agent listing shows no subagent of this session left, only the peer sessions; the builder, the brief check and the two reviewers had all completed.
- NOT DONE: nothing of the brief.
- With the landing commit: 36 paths, 1504 insertions and 380 deletions, from base 7b57cb7f5 (wip commit f66344752, the build and repair round 1), with the fixes at landing.
- What is built: a saved `excluded` map beside `filters` in the board, collection, Map and Present states; an excluded value hides every project that carries it, exclude winning over include within a facet, and a record with no value for the facet is kept by its exclude (`facetKeeps`, `applyFilters`, `src/lib/state/boards/board/state.ts`). Each menu row carries a minus "not" button at its end with the tips Exclude <value> and Stop excluding <value>, Shift+Enter excludes the keyboard's row, and the Map's Show menu has no not button and keeps Shift+Enter as the row press (`PickMenu.svelte`). Alt-click, Alt+Enter and Alt+Space exclude a slice chip, and Alt-click on a category head excludes every slice of it (`SliceLine.svelte`). An excluded value is struck through on a red chip with a minus in place of the tick, and a group button reads `not <value>`. Exclude reaches the project boards, Present, the Map (an excluded pillar drops its node) and a collection's own groups and Projects section. A record page's count buttons clear every exclude (`pressedState`). The guarded entry G153 with `tests/state/boards/board/exclude.test.ts`; the two HELP bullets, HELP lines 372 and 417 rewritten; one hidden-text primitive `src/lib/ui/display/text/Unseen.svelte`.
- Fixes at landing, from the review over round 1: the No funding count under excludes alone is `noFunding` less the read unfunded projects the excludes drop, and the strip keeps a project the section does not read under excludes alone (`collection/bar.ts`), with two test rows; the head comments of `collection/bar.ts`, `NoFundingCard.svelte` and `Unseen.svelte`; the Hub fixture `{ ...CASES.c1, root: 'lab' }`; G153's Code line names `boardFilter`, `mapBar` and `pressedState`; prettier on `exclude.test.ts`.
- Found: the first build's inline `python3` edit of its scratch case program and its printing `python3 -c` calls, and round 1's shell heredoc into `exclude.test.ts`, closed under the ruling Unapproved builder scripts, the breach recorded; the heredoc's block was read whole and kept. The brief missed `pressedState` as a writer of the filter state, a premise corrected at round 1.
- Seen at the look, inside the brief: the folded-slices button of line 2 reads "+2, 1 picked" when the value behind it is excluded, since `foldedPicks` counts both lists as brief item 7 says, as More's count does.

## Verification

In the gate at main's head 1fbef3f58 with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` at normal priority: `36 changed file(s)`, `39 test file(s)`; the ASCII gate, prettier, svelte-kit sync, svelte-check (594 files, 0 errors, 0 warnings), eslint, vitest slow, vitest and vitest checks ok; `test:quick: 54.0 s; every command passed`. The YAML check exits 0; the diagrams are unchanged by the rerun. Main's staged diff equals the gate's (`cmp`: SAME). Not covered: tests that reach no changed file within the import depth. A/B: none, `bench: []`.

## Look

A scratch server on port 8797 with a scratch HOME and a scratch hub, as for O191; Oculus Light, then Oculus Dark.

- Research board: the minus shows at the row's end on hover and on the keyboard's row; the rows read "Exclude <value>", an excluded one "excluded" and "Stop excluding <value>". The minus on blocked (external) struck the row on red with a minus for the tick, the button read `Situation: not blocked (external)`, 42 of 45 shown, the list stayed open. Active included with Shift+Enter on private repository read `Situation: active (working on it now), not blocked (external) +1`, 3 of 45. Alt-click on de-risking, Alt+Enter on exploring and Alt+Space on in preparation struck each chip (39, 36, 35 of 45); Alt-click on the UMBRELLAS head struck umbrella. Clear all cleared both lists. In Oculus Dark the excluded row and chips read the same.
- Present: Shift+Enter on No form read `Form: not No form`, 12 of 57, the deck at 15 slides.
- Map: excluding the pillar Real-World Clinical AI removed its node and projects (47 of 92); excluding nascent removed the nascent nodes and their legend chip (38 of 92); the Show menu has no minus, and Shift+Enter toggles the Team row on and off.
- Funding view: Alt-click on rejected struck it (9 of 13); in the Projects section the minus on in flight read More 1, kept every card with no project, dropped in flight from each strip, and read No funding 4 on the slice and the card.
- A person's page: its count button, pressed on a tab holding an exclude (3 of 4 shown), gave 4 projects with no excluded chip.
- The scratch theme was put back to Light, the server stopped and its tab closed; the hub and oculus checkouts hold no change of the look.

## Agents

- Builder a23b27e0e9aa274b9 (claude-opus-5-5): 280721 tokens, 306 tool uses, 3523 s; round 1 173962 tokens, 133 tool uses, 1750 s. Its first report did not pass its bar: the review's findings went to repair round 1.
- Brief check acfbfad14ab71fdbb (claude-opus-5-5): 232771 tokens, 71 tool uses, 742 s.
- Reviewer a383043f4b1ec814a (claude-opus-5-5): 276208 tokens, 76 tool uses, 1119 s.
- Reviewer over round 1 a506384da442b8238 (claude-opus-5-5): 221555 tokens, 54 tool uses, 984 s.
