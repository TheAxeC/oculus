# O74 landing: the Focus career banner built from the command center's parts

Position: the cockpit-to-oculus migration, step 397 of 399, O74 the Focus career banner built from the command center's parts; next: O75's review over its repair round (running), then /land O75 with O74's versions of `CareerPanel.svelte` and `CommandCenterView.svelte`, then O77.

## Open items

- 379 (2026-10-25, a Tier and Role filter on the Focus board, carried by O77): the full text with its options (a), (b) and (c) is in `orchestrator-state.md`'s open items. Recommended (a), the filter on the whole page with a hidden count per section; (c) is the lazy option.

## The check of Steps 1

The runner's agent listing showed only O75's builder a6cd05066857dc9c8 running; O74's builder a3f212aba186ea413 and its reviewers addf65e05d5a93f7d and a74e72616216affa3 were not listed.

## NOT DONE

- Find-in-page unfolding the folded banner (case 24) was not looked at: Chrome's find bar cannot be driven from the browser extension. It rests on reading (`hidden="until-found"`, `onbeforematch` calling `ontoggle`) and on both reviews.

## What landed

O74 landed on main from base a5387bdc, the whole range (one wip commit 24e1346b), 21 paths, and two paths outside the step's list fixed at landing (`src/lib/ui/controls/ToolButton.svelte`, `src/lib/views/boards/focus/FoldHead.svelte`), with `CareerPanel.svelte` fixed as well. `git diff --cached` of main equal under `cmp` to the gate's: SAME (21 files) before the fixes, each fixed file equal in both after.

- The career banner folds like the command center and the tasks, its fold kept in the Focus tab's state, starting open.
- Its groups are command-center rows drawn by the new `TickerGroup.svelte`, which the command center draws its own groups with.
- A press on NEXT, GOAL, a Situation fact or an Order of work task opens `career.yml` at that entry's line; Edit under the pointer opens the editor on that field; Lead, Supervisor and Collaborator open their boards, Funding obtained the Funding view; Edit sits in the heading row.

## What was found

- The builder's first build used 20 inline `python3` edits, 4 `sed -i` and `rewrap.py` over 11 files without saying so. Closed under ruling 377 (a) and the standing ruling: listed in round 1 (P1 to P38), every hunk read against the brief and kept.
- Case 22 of the brief said "Done"; today's label is "Close editor", kept.
- At the look: on a folded banner with its editor open the heading button read "Close editor" while a press unfolds the banner; and the folded banner stood 2 px taller than the folded command center, because a small `ToolButton` with a glyph was 24.125 px where its rule says 22, and `FoldHead`'s end of the row added a line box. All three fixed at landing (see Verification).

## Verification

In the gate worktree after the fixes at landing: `npm run diagrams && npm run test:quick` (23 changed files, 7 test files): `ok svelte-kit sync (64.0 s)`, `ok prettier (64.0 s): All matched files use Prettier code style!`, `ok ASCII gate (66.5 s)`, `ok vitest checks (103.7 s)`, `ok eslint (119.7 s)`, `ok svelte-check (125.4 s): 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (134.2 s)`, `test:quick: 201.7 s; every command passed`; before the fixes, the same list over 21 files passed in 83.1 s. Main against the gate after the fixes: `git diff HEAD -- . ':!.scratch'` equal under `cmp` (SAME, 23 files). It does not cover the tests that reach no changed file within the import depth.

## Look

On 8790, read only: the Focus page's command center before and after the cherry-pick, the same rows, groups and columns; the banner open in two columns, folded, kept folded after a reload; Edit on the folded banner unfolds it onto the editor.

On a scratch server on 8797 (scratch HOME, a hub copy with today's `.oculus/data`): a fresh Focus tab shows the banner open; NEXT, GOAL, the Now fact and ERC Starting Grant open `career.yml` at Ln 25 Col 12, Ln 24 Col 7, Ln 32 Col 8 and Ln 39 Col 13; Edit on GOAL focuses the goal field; Lead opens Projects; Funding obtained opens the Funding view; after the fixes the folded banner measures 32.125 px against the command center's 32, with or without its editor open, and its heading button reads Edit while folded.

## Usage

Builder a3f212aba186ea413: 111047 tokens, 139 tool uses, 38 min 40 s; round 1 266486 tokens, 47 tool uses, 10 min 36 s. Reviewer addf65e05d5a93f7d: 283500 tokens, 78 tool uses, 15 min 34 s. Reviewer over round 1 a74e72616216affa3: 260455 tokens, 50 tool uses, 8 min 9 s. Brief check a12d854c070c867cd: 237654 tokens, 83 tool uses, 9 min 31 s. The builder's first report did not pass its bar (one repair round); three fixes at landing.

## Next

O75: its review over repair round 1 runs; then /land O75, taking O74's `CareerPanel.svelte` and `CommandCenterView.svelte` and moving their FoldHead import lines; then O77 with ruling 378 and, once ruled, 379.
