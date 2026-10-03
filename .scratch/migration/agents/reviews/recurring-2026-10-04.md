Recurring-findings pass, plan oculus/migration, over the 14 refuter reports written since `recurring-2026-10-02.md` (`find agents/reviews -name '*-refuter.md' -newer agents/reviews/recurring-2026-10-02.md`): A1, D14, D17, D18, D25, D32, M3, Q116, Q88c, Q91, S4, T1c, X3a, X3c. Each step under a cause was confirmed by a `grep -n -i` over its refuter report (and, for builder git commands, over its builder report) in the session that wrote this file; the line given is the hit the grep printed. A step the grep did not confirm is left out, so the counts are lower bounds.

## What was found that the last pass did not

- The two scripts Z253 approved and D32 built, `utils/outside-paths.mjs` (the changed files minus the brief's path list) and `utils/unused-exports.sh` (exports with no importer outside their file and its tests), are required by nothing: `grep -c 'outside-paths\|unused-exports\|cited-lines'` over `agents/spec.md`, `orchestrator-state.md` and the briefs of the 14 steps printed nothing or 0. `outside-paths.mjs` runs git, so a builder may not run it.
- `agents/spec.md:32` sent the builder to "the base copy your brief names", and no brief named one: `grep -c -i 'base copy'` over the briefs of the 14 steps and of T1b, T1d and T1e printed 0 for each. A builder that needs a file as it was, or the list of what it changed, then reaches for git.
- `sh utils/unused-exports.sh` on main at 1e14d279 prints 258 unused exports, so a builder can use it only against the base's own output.

## Causes in three or more steps

### 1. The builder runs a git command (8 steps)

D17 (D17-report.md:706), D18 (D18-report.md:6), D25 (D25-refuter.md:199), D32 (D32-report.md:219), M3 (M3-report.md:83), T1c (T1c-report.md:200), X3a (X3a-report.md:179), X3c (X3c-report.md:157). Every one reads a base file or lists changes. Cause: no base copy (above). Change: `spec.md:32` now says the brief names a base copy and that `diff -rq` against it lists what changed; the state file's standing demands now require every brief to name `.agents/worktrees/<step>-base/tools/oculus/`, unpacked by the orchestrator at preparation. T1b and T1e carry it.

### 2. Paths outside the write list not marked (11 steps)

A1 (A1-refuter.md:168), D17 (:87), D18 (:82), D25 (:132), D32 (:105), M3 (:129), Q116 (:102), Q88c (:135), Q91 (:115), S4 (:79), X3a (:110), X3c (:252). Cause: the builder has no list of what it changed (cause 1). Change: `spec.md:34` now makes the file table from the `diff -rq`; the orchestrator runs `node utils/outside-paths.mjs <brief> <base>` at each review and landing.

### 3. An export left with no importer (9 steps)

A1 (:157), D14 (:352), D17 (:154), D18 (:121), D32 (:91), M3 (:148), Q88c (:384), T1c (:198), X3c (:230). Change: `spec.md:83` now has the builder run `sh utils/unused-exports.sh` after its last change and compare with the base's output, which the base copy carries as `unused-exports.txt`.

### 4. A file brought within 20 lines of the size line (9 steps)

A1 (:150), D17 (:152), D18 (:91), D25 (:178), D32 (:103), M3 (:140), Q88c (:380), Q91 (:129), X3c (:247). `spec.md:45` read "One source file under 1000 lines" while the check refuses 900 and 540 (`tests/checks/tree/size.test.ts:28-29`), and `:83` read "under 1000 lines and a component under about 600"; M3-refuter.md:160 names the mismatch. Change: `:45` now gives 880 and 520 with the reason, and `:83` points to it. A check is proposed for Axel (open item Z377): the size check refusing 880 and 520, which computes a line count.

### 5. A document or head comment made false (11 steps)

A1 (:120), D14 (:138), D17 (:138), D18 (:52), D32 (:111), M3 (:149), Q116 (:103), Q88c (:306), Q91 (:134), S4 (:119), X3a (:189). `spec.md:66` already asks for the grep and the 'still true' or 'rewritten' list. Change: the state file's standing demands now require every brief to list the `DESIGN.md`, `HELP.md` and `README.md` paragraphs and head comments that describe the changed behaviour, found at /spec, so the builder starts from the list.

### 6. Edits to existing assertions or allow lists not listed (6 steps)

A1 (:153), D17 (:358), D18 (:118), M3 (:151), S4 (:94), X3c (:255). Change: `spec.md:59` now makes the list from a `diff` of each changed test file and allow list against the base copy, one row per changed line.

### 7. The first run not given per test (5 steps)

D14 (:113), M3 (:136), Q88c (:46), Q91 (:198), X3c (:208). Change: `spec.md:63` now has one row per new or changed test by title, and a missing row makes the first line NOT DONE.

### 8. History wording in comments and test titles (4 steps)

A1 (:152, "as before", "always had"), D17 (:382, "no longer"), M3 (:141), X3c (:239). Change: `spec.md:42` adds "always had" and "previously" to its list and has the builder grep its added lines for the words and quote the grep.

### 9. The reviewer runs git beyond `git diff` and `git status --short` (7 steps)

D14 (:182), D17 (:203), M3 (:329), Q116 (:122), Q91 (:149), S4 (:3), X3a (:8). Each was a read of a base file. Change: every reviewer prompt names the base copy (standing demands).

## Under the threshold

Not verified: the greps above were run for the causes the last pass and this one named; a finding of another cause was not grouped by grep, so a cause in three steps outside these nine may be missed.

## What follows

The sentences of causes 1 to 9 are written into `agents/spec.md` and the state file's standing demands under Z251. One proposal is Axel's: Z377, the size check's numbers.
