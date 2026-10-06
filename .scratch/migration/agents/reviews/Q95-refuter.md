# Step Q95 refuter report (on .agents/worktrees/Q95, base 11c8e13a)

## Verification (rerun by the reviewer)

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from .agents/worktrees/Q95/tools/oculus)
RED: npm test
exit status: 1
 FAIL  tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and bin
Error: Test timed out in 5000ms.
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 FAIL  tests/server/git/git-ops.test.ts > the gate over what these writes ran > ran nothing but the writing half of git, in the temporary tree, never forced
Error: Test timed out in 5000ms.
 Test Files  2 failed | 339 passed (341)
      Tests  3 failed | 5355 passed (5358)
rc=1
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/imports/order.test.ts
 Test Files  2 passed (2)
      Tests  15 passed (15)
npm run check rc=0 :: COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build rc=0
npm run format:check rc=0 :: All matched files use Prettier code style!
npm run lint rc=0
! LC_ALL=C grep -rna '[^ -~]' src tests   rc=0
spec.md perl ASCII gate over src tests bin config: printed nothing
$ npx vitest run tests/views/system/workbench/settings.test.ts   (worktree)
 Tests  13 passed (13)
Scratch copy with RailEditor.svelte from 11c8e13a: 2 failed | 11 passed (13), both "glyph not in config/catalogs/glyphs.yml"
Scratch copy with the guard as {#if false}: 1 failed | 12 passed (13), the glyph-held case
```

`tests/server/git/git-ops.test.ts` is outside the step (spec.md, "Verify before you report").

## 1. Spec

- `tests/views/system/workbench/settings.test.ts:146-181`: the cases sit before `:183`, not at the end of the rail half. The Add case hardcodes the saved list's length at `:153` (`toHaveLength(12)`), `:154` and `:156` (`markOf(body, 11)`) and `:157` (`rail_why_label`, 12), so the Q97 merge moves three places, not one as Q97's `shared_paths` note says.
- Every premise of "What is on the tree" reproduces. No change beyond the brief, no dependency.

## 2. Proof

- The report cites `sed -n 116,120p` for the open items; the open-items "None." is at line 126 now. The quoted content is correct.
- The report's first run used main's RailEditor.svelte rather than the base's; the reviewer's rerun with the base's gives the same two failures.

## 3. Standards

- None.

## 4. Behaviour

- The report's claim that the line becomes "button 12 names no glyph" once a label is typed is not covered by a test; it follows from `rail.ts:96-97`. The look should confirm it.

## Not checked

- The press of "Add a button", a reload, and the empty mark's width: they need a DOM, and belong to the look.

Reviewer usage: 17 tool uses, about 9 minutes.

## Closed

- The Q97 merge note: Q97's `shared_paths` entry in the state file is corrected to name the three places of the Add case; Q95 lands first, so Q97's landing moves them from 12 and 11 to 13 and 12.
- The line range of the open items in the builder's report: a reference in the report, no code; closed with no change.
- The first run with main's file rather than the base's: reproduced with the base's by the reviewer, same result; closed.
- The untested "names no glyph" line: checked at the look of the landing, on the TEST page.
