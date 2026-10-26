# O83 landing

Position: roadmap entry migration (the cockpit-to-oculus migration); step O83, one Slurm table failing alone, landed. In flight: O79 (primary and foreign keys) and O81 (the grouping heading, the Venues view and the track record's board), each building under its cases ruling. Queued: none.

## Open items

- none.

## Check of the agents

The runner's agent listing after the stops showed only O79's builder (aed0feff241baf1c1) and O81's builder (a88ba93357e1b0941); none of O83's builder or reviewers was left.

## NOT DONE

- none.

## What landed

One commit on main with the 23 paths of the step and the fixes at landing. A poll whose `squeue` answered and whose `sacct` or `sinfo` did not publishes `slurm_down` with this poll's queue (`lastOk` equal to `updated`) and keeps the failed table's last rows; `stale` names each table older than the queue with its time or `null`, through later failed polls (ruling 432); the counts, the pill, the badge, the status bar and Recover read the queue as live while it is this poll's; each table `stale` names carries "stale, from HH:MM" or "stale, not read since the server started"; the status bar tooltip has one full stop in every state.

The Live HPC page while the queue is not this poll's, before and after:

| Section | Before | After |
| --- | --- | --- |
| Capacity | with `sinfo` or `quota` rows | with `sinfo` rows, or while `stale` names it |
| Quota | with `sinfo` or `quota` rows | with `quota` rows |
| Jobs | with `jobs` or `recent` rows | with `jobs` rows |
| Recent | with `jobs` or `recent` rows | with `recent` rows, or while `stale` names it |

A table at 0 rows under its mark draws its heading and mark alone. "No jobs in the queue for you right now." is shown only while the queue is this poll's.

## Found and fixed at landing

- The Capacity and Recent gates of `src/lib/views/system/machine/hpc/Hpc.svelte` follow ruling 432 (review over round 1, Spec R1 and Standards R2); the head comment says so (Standards R1).
- G115's test (`tests/server/machine/runs/recover/runs.test.ts`) gains the row of a good poll followed by a poll whose `squeue` exited 1, nothing sent and nothing taken, with the clock moved a minute before each refresh (Proof R1); its loop is a `for-of` after the gate's eslint line.
- `land.sh`'s worktree cherry-pick conflicted in the generated `docs/diagrams/layers.dot` and `layers.svg`; both were regenerated from the merged source.

Under the standing ruling "Unapproved builder scripts": the builder's case-run program, its `base.config.mts`, eight log files written by shell redirect and two whole-suite runs, and the round-1 reviewer's `scratchpad/delta.txt`, as the booking lists them.

## Verification

- Gate (`npm run diagrams && npm run test:quick`), second run: ok prettier, ASCII gate, svelte-kit sync, eslint, svelte-check ("544 FILES 0 ERRORS 0 WARNINGS"), vitest, vitest checks; FAILED vitest slow, a 40 s timeout in `tests/server/machine/apps/tools/languages.test.ts`, a file the step does not change, which passed alone ("Tests 15 passed (15)"). The first run's eslint line was fixed, and its `runs.test.ts` slow timeout passed alone twice.
- `npx vitest run tests/server/machine/runs/recover/runs.test.ts`: 16 passed, five runs.
- Every one of the 23 staged paths on main equal under `cmp` to the gate's file.
- The look on the TEST page of a scratch server on 8797: `unreachable` (the error box, no Jobs or Recent, the Login node, no rail badge, the tooltip "...on EduVPN? Open Live HPC.") and `ok` (live, queue empty, Capacity's 25 partitions, the tooltip "0 running | 0 pending | 0 total. Open Live HPC.").
- The look owed under ruling 435 (a), on the same scratch server with a stub `ssh` first on its PATH, kept in the scratchpad and deleted after the look (it ran the poll's script with stub `squeue`, `sacct` and `sinfo` answering from a state file): `ok` with jobs (head "live | 2 running | 1 pending | 3 total", the rail badge 2 and 1, the status bar "2 running, 1 pending", the Focus pill "2 HPC jobs running | 1 pending"); `sacct` failing alone (head "Slurm down | 2 running | 1 pending | 3 total | as of 14:00 | retrying every 2m", the partial sentence with `sacct`'s line, Recent "stale, from 13:59" with its kept rows, Capacity unmarked, Jobs' controls live, the badge, the pill and the status bar's counts kept, the tooltip "2 running | 1 pending | 3 total | The cluster answered for the queue, and Slurm did not answer for the tables marked stale. Open Live HPC."); `sinfo` stopped by its limit (Capacity "stale, from 14:00" with the hint "no answer within the time limit", Recent fresh and unmarked); `squeue` failing (head "Slurm down | last reached 14:01", the Slurm-down sentence with `squeue`'s line, no badge, no pill, the status bar "Slurm down", Jobs' controls disabled, the stale marks kept, the tooltip "The cluster was reached over ssh, and Slurm did not answer. Open Live HPC."); `unreachable` and `error` after those polls (the ssh box, or "The poll of the cluster failed." with ssh's "Permission denied (publickey).", Capacity's mark and the kept rows still drawn, the status bar "error" with the tooltip "The poll of the cluster failed. Open Live HPC."); after a restart with `sacct` failing from the first poll, Recent at 0 rows drawn as its heading and "stale, not read since the server started" alone, kept through a following `unreachable` poll. The Focus pill is in the Focus view, a unique view (`src/lib/views/boards/focus/Focus.svelte:5-10`) that lives on the scratch hub's own Focus page under the scratch home, so the pill was seen there; every other state on TEST. At the floating pane's width the Capacity heading's "stale, from 14:00" wraps to a second line, nothing cut off.

## Agents

- Builder aba67cb9db035ffee (claude-opus-5-5): 223645 tokens, 210 tool uses, 51 min 17 s; round 1: 360398 tokens, 87 tool uses, 23 min 41 s.
- Brief check af3b2b2dbfcd20aec: 200846 tokens, 49 tool uses, 8 min 15 s.
- Reviewer ab4bfee70ce043d23: 289742 tokens, 64 tool uses, 17 min 33 s.
- Reviewer over round 1 a6221f55f7830ecdd: 211425 tokens, 41 tool uses, 11 min 40 s.

The builder's first report did not pass its bar; round 1 closed seven findings, and four fixes were made at landing.

## Next

O79 and O81 report, are reviewed and land. No step is queued. The owed look was taken under ruling 435 (a).
