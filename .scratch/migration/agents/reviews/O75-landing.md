# O75 landing: the bar of a project board in two lines, its slices and its section headings

Position: the cockpit-to-oculus migration, step 398 of 399, O75 the bar of a project board in two lines; next: O77, the project card and the project page, with rulings 378 and 379, once open item 380 is ruled.

## Open items

- 380 (2026-10-25, a hub filter, after Axel asked whether 379 (a) is the whole thing): the full text with its options (a), (b) and (c) is in `orchestrator-state.md`'s open items. Recommended (b), a Hub list on Focus, on the project boards' bar and on the collection views, drawn only on a workspace of more than one hub; (c), no hub filter, is the lazy option.

## The check of Steps 1

The runner's agent listing showed no subagent: O75's builder a6cd05066857dc9c8 and its reviewers a77378f8667072b40 and afe8c52befef9e67a were not listed.

## NOT DONE

- Not looked at: the group lists' searches and the Situation badge (cases 10, 12), the publications label picking every slice (case 5), a reload keeping a fold (case 13). They rest on reading and both reviews.

## What landed

O75 landed on main from base e0687c50, the whole range (one wip commit 9399793f), 48 paths with the fixes at landing, on top of O74 (a6d8e34e). The conflicts with O74 were resolved the same way in the gate and on main: `CareerPanel.svelte` keeps O74's text with its FoldHead import and comment path moved to `views/shared/card/FoldHead.svelte`, and O74's `.end` flex rule is carried into the moved `FoldHead.svelte`. `git diff --cached` of main equal under `cmp` to the gate's: SAME.

- A project board's bar is two lines: line 1 the search, stale, "deadline <n>", Mine only and one button per group with its picks in its words, folding into More; line 2 each category's label and its slices, outlined in their hue and filled while picked, folding into "+<n>", which reads how many of its slices are picked.
- The group lists carry colour dots, counts and a search; their colours are `facet_tones` in `config/catalogs/vocab.yml`.
- Each category's section has a heading in its hue with a count, folding in cards and in the list; the list is one table per section with the With column.

## What was found

- The builder's unapproved inline `python3`, `perl` and `sed` commands: closed under ruling 375 (a) and the standing ruling, listed in round 1, every hunk read and kept; four scratchpad redirects the review over the round found unlisted were appended to the report at landing.
- The brief's premise that `stays` makes a table's header sticky was wrong; every header row is sticky, and the `stays` comment now says what it does.
- At the look: a picked slice folded into "+<n>" when Clear all took its room, so the pick did not show on the line. Fixed at landing: the button reads "+5, 1 picked".

## Verification

`npm run diagrams && npm run test:quick` in the gate after the last fix at landing: "test:quick: 48 changed file(s)", "134 test file(s)"; ok ASCII gate, prettier, svelte-kit sync, svelte-check ("541 FILES 0 ERRORS 0 WARNINGS"), eslint, vitest, vitest checks, vitest slow; "test:quick: 198.2 s; every command passed". Two earlier runs over the same tree before the "+<n>" fix failed only on timeouts (5 s and 20 s, load average 13 to 16) in `tests/data/hubs/hub-portfolio.test.ts`, `tests/server/edit/app-store.test.ts` and `tests/data/sources/config/layers/hub-vocab.test.ts`, files the step does not change; `hub-portfolio` alone passed 16 of 16 and `hub-vocab` alone 14 of 14. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

## Look

On 8790, the TEST page's Projects board: at the pane's default width (about 560 px) line 1 reads the search, stale, deadline 1, mine only, Form, Situation, More, and line 2 IN REVIEW with its slice, IN FLIGHT with de-risking, then "+4", which opens the folded slices headed IN FLIGHT and IDEA with dots and counts; a press on de-risking gives "5 of 47 shown" and Clear all, and after the fix "+5, 1 picked"; maximised (about 1130 px) line 1 shows Form, Situation, Role, Year, Domain, Venue and More and line 2 every slice, the picked one filled; Clear all gives "47 projects"; the list mode draws one table per section under the same headings, and the in review heading folds its table.

## Usage

Builder a6cd05066857dc9c8: 112916 tokens, 312 tool uses, 55 min 30 s; round 1 197186 tokens, 202 tool uses, 34 min 5 s. Reviewer a77378f8667072b40: 305807 tokens, 70 tool uses, 14 min 40 s. Reviewer over round 1 afe8c52befef9e67a: 307494 tokens, 94 tool uses, 26 min 26 s. Brief check a695ad7391dc25a0a: 263818 tokens, 80 tool uses, 11 min 11 s. The builder's first report did not pass its bar (one repair round); three fixes at landing.

## Next

O77, the project card and the project page, with rulings 378 and 379 and, once ruled, 380.
