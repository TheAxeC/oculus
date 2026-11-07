# O169 round 1: the review's findings and the two items left NOT DONE

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O169.md`, which stay in force except where this file says otherwise. The findings are those of `agents/reviews/O169-refuter.md`; each is numbered here with its ruling. Every ruling stays inside the step's part.

## Rulings

1. **The setting label breaks the folder order** (refuter, Standards, `src/lib/state/forms/referrers.ts:20`; your report's NOT DONE 1). Move `titleOf` and its helper `wordOf` out of `src/lib/state/system/config/rows.ts` into a new file `src/lib/data/helpers/key-titles.ts`, with `wordOf` exported there since `sectionOf` in `rows.ts` uses it too. `rows.ts`, `src/lib/state/system/config/other-rows/app-rows.ts` and `referrers.ts` import them from the new file; `rows.ts` keeps no copy and no re-export. Run `npm run diagrams` after the move so the upward edge `state/forms to state/system` leaves `docs/diagrams/layer-state.dot`. The `vitest checks` line of `npm run test:quick` passes.
2. **The comment of `TERMINAL_REFUSALS` is false** (refuter, Standards, `src/lib/data/model/machine/model-machine.ts:304-308`; your report's NOT DONE 2). Rewrite it so it says what holds now: the page says the catalog's sentence for each name, and for `terminal-not-started` that sentence carries tmux's first line as its cause.
3. **With one cluster, it is chosen** (refuter, Spec, `SubmitBox.svelte:47` with `submit-job.svelte.ts:198-206`; brief item 3, "with one cluster, it is chosen"). In `src/lib/views/sources/source/actions/submit-job.svelte.ts` `press()`, when the choices hold exactly one cluster and the server picked none, that cluster is picked and its plan asked for at once, as a server pick is. The box then opens with that cluster chosen, no blank choice and Submit on once the plan is read. The file's head comment says so.
4. **The select is a caller's snippet** (refuter, Spec, `Confirm.svelte:59-60, 101-105`). The snippet shape stands, because the folder order forbids `ui/controls` importing `ui/forms`. Confirm's head comment names the shape: an optional `pick` snippet drawn above the buttons, which a caller fills with `ui/forms/choice/Select.svelte`.
5. **The negation contrast in Confirm's comment** (refuter, Standards, `Confirm.svelte:17-19`). Rewrite the sentence to say what the select does, with no "and not as" clause.
6. **Focus and tab order in the Submit box** (refuter, Behaviour, `Confirm.svelte:85-89` with `SubmitBox.svelte:33-46`). When the box opens with no cluster picked, focus goes to the select; when a cluster is picked, focus stays where it goes today. The report's user-visible changes give the tab order before (Cancel, the cluster buttons, Submit) and after (the select, Cancel, Submit) and where focus lands at open in each state.
7. **A failure after a composed terminal started** (refuter, Declined to judge, `routes.ts:316`). In `src/lib/server/machine/pty/routes.ts`, when `startTerminal` succeeded and the `steerTerminal` of the composed keys fails, the refusal is the one a steer of that terminal gets (`terminal-failed` while the terminal is listed, `terminal-ended` when it is not), never `terminal-not-started`. `fork` stays among the start actions.
8. **Reuse `FsRoot`** (refuter, Standards, `cpp-form.ts:608`). `ServedFolder` is replaced by `Pick<FsRoot, 'key' | 'dir' | 'real'>` from `src/lib/state/sources/explorer/view/place.ts`, or by `FsRoot` itself where every caller passes one; the report quotes the grep for the type.
9. **The case-run programs are not quoted** (refuter, Standards, the report's "The cases' first run"). The report quotes the source of each case-run program (c1, c2, c3, c4, c4-server, c5) whole, with its full path, and its output after this round.

The extra verify run of the first build needs no change. One run of the verify list after this round's last change.

## Paths this round writes, beyond the brief's list

- `src/lib/data/helpers/key-titles.ts`
- `src/lib/state/system/config/rows.ts`
- `src/lib/state/system/config/other-rows/app-rows.ts`
- `src/lib/data/model/machine/model-machine.ts`
- `src/lib/views/sources/source/actions/submit-job.svelte.ts`
- `src/lib/state/sources/explorer/view/place.ts` (read only, unless the type has to be exported)

The brief's own list stays, `docs/diagrams/*.dot` and `*.svg` included.

## Cases after the round

- C1, C2, C4, C5 and C6 run again, each with the same expected result as the brief gives.
- C3 again, plus: a box whose choices hold one cluster and whose server picked none opens with that cluster chosen and its plan read; the setting label still reads "Slurm: Resource".
- C9 (new): compose of a terminal whose start succeeds and whose typed keys fail answers `terminal-failed` while the terminal is listed; checked by a run of c5 with that row added.

## Verify

As the brief's "Verify before you report", from the worktree root: `npm run diagrams`, then `npm run test:quick -- --base 32585f1f1` prints every line ok; the ASCII gate over every changed file; `sh utils/unused-exports.sh` against `.agents/worktrees/O169-base/unused-exports.txt` adds no line; `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O169.md .agents/worktrees/O169-base` prints only the brief's paths and this round's.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O169-report.md` in the worktree's copy of the ledger: the first line (anything NOT done, or "Everything in the round is done"), each ruling above by number with what changed (file:line) and the check that shows it, the cases' output, the verify lines as printed, and the files with line counts.
