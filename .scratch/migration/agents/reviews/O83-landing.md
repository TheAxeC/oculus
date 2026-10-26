# O83 landing

Position: roadmap entry migration (the cockpit-to-oculus migration); step O83, one Slurm table failing alone, landed. In flight: O79 (primary and foreign keys) and O81 (the grouping heading, the Venues view and the track record's board), each building under its cases ruling. Queued: none.

## Open items

- none.

## Check of the agents

The runner's agent listing after the stops showed only O79's builder (aed0feff241baf1c1) and O81's builder (a88ba93357e1b0941); none of O83's builder or reviewers was left.

## NOT DONE

- The look at the `unreachable`, `slurm_down`, partial and `error` states of Live HPC, its head bar, the Focus pill and the rail badge: the cluster host comes from `config/local.yml`, which is not opened, so no server can be pointed at a failing host. The words of each state rest on the case runs of the build and on reading `Hpc.svelte`, `Recent.svelte`, `Capacity.svelte`, `Head.svelte` and `status.ts`.

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
- The look on main's server: Live HPC `ok` ("live | queue empty | as of 13:14 | every 20m") and the tooltip "0 running | 0 pending | 0 total. Open Live HPC.".

## Agents

- Builder aba67cb9db035ffee (claude-opus-5-5): 223645 tokens, 210 tool uses, 51 min 17 s; round 1: 360398 tokens, 87 tool uses, 23 min 41 s.
- Brief check af3b2b2dbfcd20aec: 200846 tokens, 49 tool uses, 8 min 15 s.
- Reviewer ab4bfee70ce043d23: 289742 tokens, 64 tool uses, 17 min 33 s.
- Reviewer over round 1 a6221f55f7830ecdd: 211425 tokens, 41 tool uses, 11 min 40 s.

The builder's first report did not pass its bar; round 1 closed seven findings, and four fixes were made at landing.

## Next

O79 and O81 report, are reviewed and land. No step is queued.
