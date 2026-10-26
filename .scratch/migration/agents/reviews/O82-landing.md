# O82 landing: the HPC poll's three failures

Position: the cockpit-to-oculus migration, O82 the HPC poll's three failures; next: O80, Focus and the boards from config (review running), then O79, primary and foreign keys, and O81, the grouping heading and the Venues view.

## Open items

- 430 (2026-10-26, O82's review over round 1, Behaviour 1): what the HPC view does when `squeue` answers and only `sacct` (the Recent table) or `sinfo` (the Capacity table) fails, for example when Slurm's accounting database is down while the controller answers. As built under ruling 428's words ("a timeout after the connection is made while a Slurm command runs" is Slurm not answering, "the last good poll kept on screen"), any of the three commands failing makes the whole poll `slurm_down`: the queue, Recent and Capacity all stay as the last good poll left them, Recover's reading of the cluster stops (a download's bytes, rate and end freeze), the log prewarm stops, and a server started during such an outage shows no queue at all. This is not a reversal of 428 either way; changing it needs a new step, which only Axel schedules.
  - (a) A new step: when `squeue` answers, the queue and Recover's reading stay live from that poll; only the table whose command failed is kept from the last good poll, marked as stale with its own time; the status is `slurm_down` with the failing command's message. Pros: the view never shows a frozen queue while jobs run, and a Recover download keeps being followed during an accounting outage. Cons: one more step; a mixed state (live queue, stale Recent or Capacity) needs its own words and a time per table.
  - (b) Keep it as built: one failed Slurm command freezes the whole view. Pros: one simple state, matching 428's words exactly; nothing more to build. Cons: during an accounting-only outage the queue looks frozen while jobs start and end, and Recover silently stops following a download. This is the lazy option.
  - Recommendation: (a). O82 lands as built meanwhile, since it is correct under ruling 428 and better than main, which says "The cluster did not answer over ssh" for every one of these failures.

## The check of Steps 1

The runner's agent listing showed one subagent, O80's reviewer af6579c090daa182a; O82's builder aef746e492419e883, its brief check ae57906ed63a7f9f2 and its reviewers a2050ca41ab3495b9 and a86da77a63ab63f1e were not listed.

## NOT DONE

- Not looked at on screen: the `unreachable`, `slurm_down` and `error` states of the Live HPC view, its head bar and the status bar. The cluster host comes from `config/local.yml`, which is not opened, so no scratch server can be pointed at a failing host; the words of each state rest on case 12 of the first review (the `words-vite.mjs` run and the reading of `Head.svelte`, `Hpc.svelte` and `Login.svelte`).

## What landed

O82 landed on main from base 4959cb90, the whole range (one wip commit f063b94f), 21 paths with the fixes at landing, on top of 2ccde126. The staged diff and the fixes were applied in the gate worktree at 2ccde126, the diagrams regenerated there (unchanged); every one of the 21 paths on main equals the gate's file under `cmp`.

- The poll's remote command prints a connected marker first and runs `squeue`, `sacct` and `sinfo` under the cluster's `timeout` (12, 8 and 5 s), each with its own return code line and its own stderr section.
- The HPC view tells three failures apart, each with its own word and sentence: `unreachable` (ssh did not connect; "The cluster did not answer over ssh"), `slurm_down` (ssh connected and a Slurm command failed or ran out of time, hinted by Slurm's own message or the time-limit sentence) and `error`. The last good queue, Recent and Capacity tables stay on screen, and the next attempt comes after 2 minutes.
- The status bar and the head bar say which failure it is; the Login node section names the reason.

## What was found

- The first review found every item holding and every case met, with two findings carried in repair round 1: a `sacct` or `sinfo` stopped by its limit published `ok` with an empty table, and the poll's words optional only for a test.
- The review over round 1 found five points, each closed in the refuter report's Closed section: two fixed at landing in the code (the time-limit hint when no stderr explains a failure; a return code line glued to a partial row), one comment corrected, one report omission recorded, and one raised as open item 430.

## Fixes at landing

`slurmHint` (`src/lib/server/machine/hpc/poll.ts`) gives the time-limit sentence when no failing command wrote a stderr line and any was stopped by `timeout`; `splitSections` (`src/lib/server/machine/hpc/parse.ts`) reads a marker wherever it starts on a line, the text before it kept in its section; the `SQUEUE_SECS` comment names the reason that holds. The landing case program before the fixes, on the step's worktree: L1 (`squeue` 1 with no stderr, `sacct` 124) "status=slurm_down hint=undefined", L2 (the glued line) "status=ok"; after, on main: L1 and L2 "status=slurm_down hint=\"no answer within the time limit\"", the last good rows kept; L3, a good answer, `ok` in both.

## Verification

`land.sh` on main (`npm run test:quick`): "25 changed file(s)", "94 test file(s)"; every command ok; "test:quick: 188.5 s; every command passed"; "checks: 1 commands passed".

`npm run diagrams && npm run test:quick` in the gate after the fixes at landing: the first run failed only `vitest slow`, a 20 s timeout in `tests/data/hubs/hub-portfolio.test.ts` (a file the step does not change) at a load average of 15.7; that file alone passed 16 of 16; the repeated run: "21 changed file(s)", "94 test file(s)"; ok ASCII gate, prettier, svelte-kit sync, svelte-check ("544 FILES 0 ERRORS 0 WARNINGS"), eslint, vitest, vitest slow, vitest checks; "test:quick: 140.7 s; every command passed". Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

## Look

On TEST (8790), the Live HPC view: "live | queue empty | as of 10:15 | every 20m", Cluster capacity (25 partitions), the disk bar at 60%, Login node, no failure box.

## Usage

Builder aef746e492419e883: 326906 tokens, 135 tool uses, 28 min 57 s; round 1 137418 tokens, 45 tool uses, 11 min 22 s. Reviewer a2050ca41ab3495b9: 289965 tokens, 81 tool uses, 23 min 25 s. Reviewer over round 1 a86da77a63ab63f1e: 274829 tokens, 65 tool uses, 14 min 27 s. Brief check ae57906ed63a7f9f2: 171305 tokens, 41 tool uses, 6 min 43 s. The builder's first report did not pass its bar (one repair round); the fixes at landing are listed above. No A/B (no `bench:`).

## Next

O80's review, its repair round if any, and its landing; then /spec O79 and O81.
