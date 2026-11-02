# O124, repair round 1

The review is `agents/reviews/O124-refuter.md`. Each item below is one of its findings with its ruling. All six are inside the step's part. The write list is the brief's, with `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts` and `src/lib/state/workbench/navigation/status.ts` included.

1. **S1, `src/lib/ui/controls/heads/GroupHead.svelte`.** The head comment says that a heading inside a group may be this component. Add to it that the Gallery group of Status starts folded and draws nothing while closed, so the paragraph at line 35, that a folded group's body stays in the page, does not hold for that group: the Gallery's body is mounted when it opens. Say it where a reader of line 35 meets it.

2. **ST1, `src/lib/server/content/audit/scan.ts:10-11`.** The second sentence's "Findings is what" names the view, which holds this scan's output too. Change it to "That section is what", so the comment says what is true of the Files section and of this scan.

3. **ST2, `src/lib/state/workbench/navigation/status.ts:455`.** Two exported functions named `findingsCount` give different numbers. Rename this one `fileFindingsCount`, update its doc comment and the mentions at lines 450 and 467 so each name means the function it names, and import it in `rail-badges.svelte.ts:22` by that name with no alias. `railBadges.findingsCount` keeps its name.

4. **B1, the report's "Host- or user-visible changes".** Add a row with its before and after for each of the four changes the review lists: the rail button's tooltip; the palette and the catalogue losing both entries; the key that focuses a view's search, on Findings and on Status with the Gallery open and closed; the inset of the Status facts over a wallpaper.

5. **P1, the report's "The number of full-list runs".** State why the first run was stopped and whether any change came after it.

6. **P2, the report's judgment 3.** Replace the quoted grep with `grep -rnE "\[data-section|dataset\.section|data-section\\\\?=" src tests` and say what it prints, run by you.

Run after the change, from the worktree's root: `npm run test:quick` once, `LC_ALL=C grep -n '[^ -~]'` over the files changed, `sh utils/unused-exports.sh` against the base copy's list, and `grep -rn "listedFindings" src tests`, which prints nothing. A failure in a file this step does not change that passes alone is a timing failure under load; quote it and its lone run. Update the report in place and add a part "Repair round 1" naming each item with what closed it.
