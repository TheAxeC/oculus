# O96 repair round 1

The review is `agents/reviews/O96-refuter.md`. Each item below is a ruling; do it, run the checks of your brief's "Verify before you report" again for the files you change, and append "## Repair round 1" to your report with each item's change, the quoted check lines and, for item 3, the case run before and after.

1. T1. Rewrap as whole paragraphs at 100 columns the two comment paragraphs the step edited: `src/lib/views/shared/card/record/RecordCard.svelte` lines 24-26 and the head comment of `src/lib/state/boards/structure/cross-links.ts` from line 3. No other comment changes.
2. T2. In `groupProjects` (`cross-links.ts`), replace `...[''].flatMap((key) => held.get(key) ?? [])` with a named constant for the "other" group appended when it exists, so the line says it is the "other" group.
3. B1. A project with no stage, drawn under "other" by case 17, must draw no stage tag: in `src/lib/views/shared/links/CrossLinks.svelte`, the `<Tag label={kind.stage} />` of `membersByStage` is drawn only when the stage is not empty. Extend case 17 so it states the tag is absent; run it on your current tree before the change (the empty tag present) and after.
4. B2. In your report's "Visible changes", add with a before and an after: the warning mark on any group holding a blocked project (no longer only in flight; a blocked `nascent` project now marks the idea group, a blocked `submitted` one the in-review group); the entry groups' counts, line 2's status slice counts and the No funding slice's count under a Projects pick.
5. S1 needs no change: no whole-suite command is run in this round.
