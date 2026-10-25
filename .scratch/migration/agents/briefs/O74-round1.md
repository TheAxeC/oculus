# O74, repair round 1

The refutation of your build is `agents/reviews/O74-refuter.md`: every item of the brief holds, case 22 is partial only on the brief's word "Done" (see "Not sent"), and it raises the points below. Work in `.agents/worktrees/migration-O74` only, under `agents/briefs/O74.md`, this file and `agents/spec.md`. Run no git command but `git status`, `git diff` and `git show`, read only. Never open, print, grep or hash `config/local.yml`; every grep over `config/` uses `--exclude=local.yml`. Write no script: every edit is made with the Edit and Write tools, and no `python3`, `node`, `perl`, `sed -i`, `awk` or shell redirect changes a file (`agents/spec.md`, "What every package obeys"). The only program allowed is a case-run program under ruling 262: it only prints the result of each case, it lives in the scratchpad or the base copy and never in the worktree, and its whole source and its output are quoted in the report. Never run `npx vitest run` with no file named or with `--dir`.

A shortcut is a finding: a narrower reading of an item, or work inside the round called outside it, is done or handed back with the reason before the report.

## Items

1. **The programs of the first build, listed (open item 377, ruled (a)).** The report gains a section "Programs of the first build" that lists every program you ran in the first build that changed a file: each inline `python3` heredoc, each `sed -i`, and each run of `rewrap.py`, the command quoted whole, with each file it changed and the lines it changed in today's tree (`file:line` ranges). The orchestrator reads each of those hunks against the brief and keeps only what that read confirms; change none of them for this item.
2. **The case-run source is quoted (refutation Standards 1; ruling 262).** The report quotes the whole source of the case-run program (`cases.test.ts` in the scratchpad's `o74/` folder) and of any you run in this round, in a section of its own, so a reader without the scratchpad can run it again. It runs from the scratchpad or the base copy, never from the worktree's `tests/`.
3. **The quoted proofs print what the report says (refutation Proof 1).** DONE rows 2 and 9 quote greps whose `.` matches any character, so they print lines where the report says they print nothing. Replace each with a check that holds as quoted (for example the patterns with the dot escaped, or a grep over the `<style>` block alone), quote its real output, and correct the row's place for `toggle` to `CareerPanel.svelte:137-144` or wherever it then stands.
4. **A folded banner with its editor open is no taller than the command center (refutation Behaviour 1).** The 4px top padding of the open editor applies only while the body is shown (`.body.wide:not([hidden])`, `CareerPanel.svelte:239-244`), as the base drew `.body:not([hidden])`; `column-span: all` stays on `.body.wide`. The rule's comment says why.

## Not sent

- Case 22's word "Done": the brief's error; today's label is "Close editor" (`entry_form.edit_done`), which you kept. Corrected in the booking at landing.
- The `--dir` run and the second run of the verify list in the first build (refutation Standards 2 and 3): recorded in the booking.
- The two `eslint-disable-next-line @typescript-eslint/no-unsafe-call` lines: no finding.
- What is drawn (the banner open and folded, the columns, the carets, the command center against its screenshot): the orchestrator's look at landing.

## Verify before you report

From the worktree's root, after the last change, once: `npm run diagrams && npm run test:quick -- --base a5387bdc`, every command passes; `sh utils/folder-check.sh`; the unused-exports comparison against `.agents/worktrees/O74-base/unused-exports.txt`; the character-set check over the files you change. The report quotes the lines each prints.

## Report

Append to `.scratch/migration/agents/reviews/O74-report.md` in the worktree's copy of the ledger, in ASCII, a section "# Repair round 1" with: one row per item above, DONE or NOT DONE, with the command and output that proves it; the sections of items 1 and 2; every file changed in this round with its line count; and anything left undone, first.
