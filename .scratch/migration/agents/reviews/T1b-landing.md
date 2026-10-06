# T1b landing

Position: plan oculus/migration, step T1b (the test sweep of `tests/state/`) landed. In flight: T1e (`tests/routes/`, `data/`, `checks/`, `fixtures/`), repair round 1. Next: T1d prepared again from main's head under Z376 (b); T1e's round review and landing; T1a after the four sweeps.

## Open items

None.

## NOT DONE

Nothing of T1b's brief.

## Check of the agents

T1b's builder `abd43d8d8cfbcff37` and its reviewers `a7468f675784a9dfd` and `a7cc996d36a42bc9e` are not running: `ListAgents` listed only T1e's builder as running and the round reviewer as completed; the builder was no longer listed.

## What landed

T1b, one commit on main (the commit that carries this file), from base db5132b4a: the sweep of `tests/state/` as `agents/briefs/T1b.md`, its round (`agents/briefs/T1b-round1.md`) and Z381 to Z388 say. The folder holds 206 test files and 58,446 lines after the sweep, against 205 and 66,497 before (`find tests/state -name '*.test.ts' | wc -l`, and the `.ts` lines through `cat | wc -l`). The deletions, folds, assertion cuts and slow tags are listed file by file in `agents/reviews/T1b-report.md`. `allow-duplication.txt` merged with T1c's change without a conflict.

## Fixes at landing

1. Z386: `shared/answers.test.ts` gains 'is one sentence of its own for each word the file operations refuse with', over `refusalSentence` with the catalog stubbed. With `exists` mapped to `denied`'s key in `src/lib/state/shared/answers/answers.ts:38` it failed (`AssertionError: expected 18 to be 19`); the source was then restored and `git diff --quiet` on it passed.
2. Z387 and the round review: seven same-branch rows of that file deleted ('empty', 'null', 'no error', the list, string and number bodies, and the LaTeX word row); the ops-word row became one test.
3. Round Spec 1: 'asks nothing of an instance of another view' moved out of `explorer.test.ts`'s slow describe into a describe of its own, so `npm test` runs it (`--tagsFilter '!slow'`: 20 passed, 1 skipped).
4. A red line: `npm run check` failed on main at `commands-pane.test.ts:57`, since T1c's landing added `available` to `PrivateTmux`; the file's server object now carries it, set when the hook starts the server. The slow run passed alone with no `oculus-pane-*` left in `$TMPDIR`.
5. Doc text: `src/lib/state/life/memories.ts:11` no longer names the deleted test.
6. `export` removed from `FORMS_SUFFIX`, `ADDED_SUFFIX` (`form-drafts.svelte.ts`), `CONFIG_SUFFIX` (`config-files.ts`) and `NARROW` (`contents.ts`); `grep -rn -w` showed no importer outside each file.

## What was found

- Every finding of both runs is closed under "Closed" in `agents/reviews/T1b-refuter.md`.
- Round Proof 1: the `headLine` table of `tests/state/system/machine/processes.test.ts:225-235` is a rewrite of two kept rows from literal sentences to `t()` that the assertion-edit list missed; the rows still fail on a wrong plural key.
- Z388: `tests/state/shared/arrival.ts` arms a 1000 ms bound that is cleared when the awaited signal comes; it is no slow cause.
- `commands-pane.test.ts:61-65` keeps a second copy of `privateTmux`'s cleanup until T1a moves `tmux-fixture.ts`'s probe out of module load (Z383).
- Named for T1d: `tests/shell/rail/rail-fixture.ts` `COLLECTIONS` and `tests/shell/rail/shipped-rail.ts` `SHIPPED_RAIL_LABELS` have no importer, booked for the last sweep landing.
- The builder ran six read-only git commands before its first report, against the no-git rule.

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after every fix, with `npm run diagrams` before it: `checks: 7 commands passed`.

- npm test: 589 files passed, 37 skipped; 12067 tests passed, 834 skipped.
- test:checks: 31 files, 471 passed, 9 skipped.
- check: 3378 files, 0 errors, 0 warnings.
- build, format:check, lint and the ASCII gate passed.
- Load average 8.91 9.65 8.72 after the run.

`land.sh` itself ran the list from the repository root, where `npm test` finds no `package.json`; the list was run from `tools/oculus` instead. There is no look, since the step changes tests and comments only, and no A/B, since the block names no `bench:`.

## Usage

| Agent | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|
| Builder `abd43d8d8cfbcff37` | claude-sonnet-5-5 | 331,587 | 1122 | 226.4 min |
| Builder, round 1 | claude-sonnet-5-5 | 304,335 | 270 | 66.4 min |
| Reviewer `a7468f675784a9dfd` | claude-opus-5-5 | 375,118 | 129 | 28.4 min |
| Reviewer over round 1, `a7cc996d36a42bc9e` | claude-opus-5-5 | 278,174 | 88 | 23.0 min |
| Brief check | claude-opus-5-5 | 249,285 | 92 | 10.6 min |

The first report did not pass its bar, and there were six fixes at landing. Review branch: `review: every`.

## Next

T1d prepared again under Z376 (b) and dispatched; T1e's round review and landing; T1a after the four sweeps.
