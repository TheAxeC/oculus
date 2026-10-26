# O82, repair round 1

The refutation of your build is `agents/reviews/O82-refuter.md`. Every item holds and every case is met; it raises the two findings below. Work in `.agents/worktrees/migration-O82` only, under `agents/briefs/O82.md`, this file and `agents/spec.md`. Run no git command but `git status`, `git diff` and `git show`, read only. Open no ssh connection to any host. Never open, print, grep or hash `config/local.yml`; every grep over `config/` uses `--exclude=local.yml`. Never touch ports 8787 or 8790. Write no script: every edit is made with the Edit and Write tools, and no `python3`, `perl`, `sed -i`, `awk`, heredoc redirect or other program changes a file. The only program allowed is a case-run program under the rules file ("What every package obeys"): it only prints the result of each case, it lives in the scratchpad or the base copy and never in the worktree, and its whole source and its output are quoted in the report. No breakage testing of any kind.

A shortcut is a finding: a narrower reading of an item, or work inside the round called outside it, is done or handed back with the reason before the report.

The path list of the brief widens for this round by `tests/server/machine/runs/recover/runs.test.ts` lines 485-495 (item 2).

## Items

1. **A `sacct` or `sinfo` stopped by its limit, or failing, is Slurm not answering (refutation Spec 1; item 1; the step's line, ruling 428: "a timeout after the connection is made while a Slurm command runs" and "the last good poll kept on screen").** Today `batchCommand` records `squeue`'s code alone, so a `sacct` stopped by `timeout 8` or a `sinfo` stopped by `timeout 5` gives `status: ok` with an empty Recent or Capacity table and a new `lastOk`. Record the code of `sacct` and of `sinfo` the way `squeue`'s is recorded: a return code line of its own directly after each timed command, no pipe or subshell around it, and its stderr in a section of its own through the same `mktemp` file handling as `squeue`'s (one file reused or one per command, your choice, every file removed before the command ends). `splitSections` reads each code, 0 when its line is absent, so G115's good fake (`runs.test.ts:479`, no such lines) still reads `ok`. In item 1's order, with the connected marker, a code other than 0 of `squeue`, `sacct` or `sinfo` is `slurm_down` over the last good rows (the last good Recent and Capacity tables kept, `lastOk` not stamped): the hint is `hint_slurm_late` for 124, and otherwise the first command's own stderr line that is not empty, in the order `squeue`, `sacct`, `sinfo`. Say in the report what a cluster whose `sacct` exits non-zero on every call (accounting off) would now show, in one sentence. `recoverCommand` is unchanged. Update the doc comments of `batchCommand`, `answerFailure` and `splitSections` and the poll's head comment where they name `squeue` alone.
2. **`words` is required (refutation Standards 1).** `HpcSettings.words` and the options' `words` are required, and the `undefined` branches of `answerFailure`, `rejectionFailure` and `watchHpc` go. The options of G115's test (`runs.test.ts`, the `watchHpc(hub, { ... })` at about 485-495) gain a `words` value; neither fake and no assertion changes. Quote that fixture's before and after lines, and the file's passing run after the change.

## Cases

Run each with your case-run program, on the unchanged tree of this round (the worktree as you left it) first and after the change, both outputs quoted.

- R1. A good poll, then an answer with the marker, `squeue` rc 0 and its rows, `sacct`'s code 124 and an empty sacct section, `sinfo` rc 0 and its rows: the second publish is `slurm_down`, hint "no answer within the time limit", the Recent rows of the first poll kept, `lastOk` kept.
- R2. The same with `sinfo`'s code 124: `slurm_down`, the Capacity rows of the first poll kept.
- R3. `sacct` exits 1 with `sacct: error: Problem talking to the database: Connection refused` on its stderr: `slurm_down` with that line as hint.
- R4. `squeue` and `sacct` both fail with their own lines: the hint is `squeue`'s.
- R5. G115's good fake (no `sacct` or `sinfo` code line): `ok`. `npx vitest run tests/server/machine/runs/recover/runs.test.ts` passes 16 of 16.
- R6. `shell-cases.ts` rerun with a `sacct` stopped by `timeout` in a local shell: `slurm_down`, no file left in its tmp folder.
- R7. Cases 1 to 13 of the brief rerun with `cases.ts`: every result as in your report, apart from those this round changes, each named.

## Not sent

- The red line of your `npm run test:quick` (the timeout in `tests/data/hubs/hub-portfolio.test.ts`): the review's rerun passed with that file in it, and nothing in the diff reaches it at run time.
- `tests/checks/tree/duplication.test.ts` run alone (the clone between `language.test.ts` and `config-cache.test.ts`): neither file changed since the base; it is not this step's.
- Case 7b's correction: accepted as the review confirms it.

## Verify before you report

From the worktree's root, after the last change, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`: `npm run diagrams && npm run test:quick -- --base 4959cb90`, every command passes; `npx vitest run tests/server/machine/runs/recover/runs.test.ts`, passing; the brief's other checks as the brief gives them (the unused-exports comparison against `.agents/worktrees/O82-base/unused-exports.txt`, verify 4 and 5, the history-word grep, the character-set check over every changed file and the report). Run no other whole-suite command. The report quotes the lines each prints.

## Report

Append to `.scratch/migration/agents/reviews/O82-report.md` in the worktree's copy of the ledger, in ASCII, a section "# Repair round 1" with: anything left undone, first; one row per item above, DONE or NOT DONE, with the command and output that proves it; the cases R1 to R7 with the program's whole source and both outputs; the fixture's before and after lines; and every file changed in this round with its line count.
