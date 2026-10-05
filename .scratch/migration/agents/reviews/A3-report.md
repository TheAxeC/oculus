Round 2 (the plan's extra round, Z568): all six rulings are done. NOT DONE: nothing. Not verified: the autumn repeated hour (probe s3 only, no kept test) and the page's drawing of the tray (probe `tray` only). The full verify list ran 2 times in this round, both green.

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md` at the moment of writing (`sed -n '/## Open items/,/^## Booked/p'`). The section holds an intro sentence and no entry.

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## Ruling 1: a pattern croner cannot walk backwards never stops the server

- `src/lib/server/machine/tasks/schedule.ts` `dueAt` (with `walkedDueAt`, `WALK_FIRST_MS`, `WALK_GROWTH`, `WALK_LAST_MS`): croner's `previousRuns` is tried first; when it throws, the due time is found by croner's forward `nextRun` from a start before now, the span widening 90 s, 360 s, ... until a run falls inside it (up to 30 years). A pattern croner cannot walk either way has no due time and is worded once per watcher (`unreadable` set inside `watchSchedules`); nothing reaches `apply` or `consider` as a throw. C5 is unchanged: the pattern stays a job.
- Test row: `tests/server/machine/tasks/schedule.test.ts` "starts the run of a pattern croner cannot walk backwards when it is due, and catches up a missed one", rows `0 0 29 2 *`, `0 7 29 2 *`, `0 0 30 1-2 *`: the run starts when due, and a missed one is caught up as `catch-up`.
- Deviation from the brief: the clock is set in 2024 (the leap day 2024-02-29), not 2028. A fake clock after the real day would make a lock file's real modification time look stale to `record.ts` (60 s rule), and the afterEach asserts no lock was taken over.
- Failing on the tree as I left it before the change (`npx vitest run tests/server/machine/tasks/schedule.test.ts`, saved in `$A/r2/first-failing.txt`):
  `AssertionError: 0 0 29 2 *: expected [] to have a length of 1 but got +0` and `TypeError: Cannot read properties of undefined (reading '0')` at `E.previousRuns node_modules/croner/dist/croner.js:1:23525` (unhandled rejection).
- Passing after: 8 of 8 in that file at the time, then 9 of 9 in `tests/server/machine/tasks`.

## Ruling 2: a due time that arrives while an earlier decision waits is not cancelled

- `schedule.ts` `decide`: a due time that arrives while the task's decision has not written its claim (waiting for the first `sessions` payload, reading the earlier run) only replaces the newest held due time (`pending`). The decision takes the held due time as its own at the claim, so the payload's arrival starts one run for the latest due time. A due time that arrives after the claim is written and while the start is awaited (`starting`) is recorded as skipped with terminal null (I2). A decision that ends without a start decides a held due time anew in `finally`. The record never says skipped when no run was going.
- Judgment call: the older due times held behind the newest leave no row (the catch-up of several missed due times is one run, as I3 in A3.md item 5 says).
- Test row: "decides the latest due time once when the first sessions payload arrives after several, recording none as skipped": `* * * * *` with no payload until 07:02:10 starts one run for 07:02 and records one row; the daily pattern with a payload after its due time does the same.
- Failing before the change: `AssertionError: expected [] to have a length of 1 but got +0` (same run as above).
- Comments and DESIGN: `schedule.ts` head comment lines 17-26 and the **Schedules.** paragraph in `DESIGN.md` say what a due time arriving during the wait does.

## Ruling 3: the sixth test

The test "starts each run of a pattern inside the hour the clocks skip once, when it is due and not before" now sets the fake clock 90 s before the first due time of each pattern and advances it only to one second before the due time, then to 31 s after the last due time of the pattern, instead of 60 s steps over four hours. It runs in 254 to 276 ms (`npx vitest run tests/server/machine/tasks/schedule.test.ts --reporter=verbose`; file total 900 ms), so it is not tagged slow. It still asserts the start times equal the due times and the rows are `schedule` / `started` with `at >= due`.
The failure of this test in the form it has after its last change, from the tree before round 1's `dueAt` change, is not held: that tree is not kept, and nothing is quoted.

## Ruling 4: `contextFixture` makes no folder while a module loads

Files touched:
- `tests/server/root/context-fixture.ts`: `scheduleRecord` is a getter that makes the folder (`scratchDir('oculus-fixture-schedule-')`) on its first read; the property is no longer set from `overrides` first, so a caller passing `scheduleRecord` still wins through the final `...overrides`.
- `tests/routes/git/git.test.ts` and `tests/routes/machine/hpc.test.ts`: `it` is imported from `vitest` again, because the folder no longer leaks when a file calls `contextFixture` at load, so the scratch `it` those two took in round 1 is not needed.
Check: `ls $(node -p "require('os').tmpdir()") | grep -c oculus-fixture-schedule` printed 0 after `npx vitest run` of `tests/routes/git/deposit.test.ts`, `git.test.ts` and `terminal-actions.test.ts` with `-t zzzz-no-such-case` (every case skipped, modules loaded), and 0 after `npx vitest run tests/routes tests/server/root tests/server/machine/usage` (32 files, 99 tests passed).

## Ruling 5: DESIGN.md

`DESIGN.md` **Schedules.** paragraph: "Croner's timer skips a due time inside the hour the clocks skip. The watcher's look passes over a due time later than now and takes the moved one, so it starts a daily 02:30 at 03:30 on that day and never earlier." `schedule.ts` comments (head lines 12-15, `dueAt`, `consider`) agree: the half-minute look gives the 03:30 start.

## Ruling 6: proof

- The grep `spawn|execFile|exec(|tmux|claude` over the step's tests (`tests/server/machine/tasks/*.ts`, `context-fixture.ts`, `tests/fixtures/scratch.ts`): hits are the header comment lines 2-6 of `schedule.test.ts` (prose), the `tmux()` recording double and `claudeBin: 'claude'` (a string passed to the recording double, never run), `EARLIER = 'aabbcc-claude'` (a terminal id), and `context-fixture.ts:2,42` (comment, string). None starts a process.
- Over the probes (`$A/vp/*.ts`, `$A/probes/*`): `common.ts`, `s1`, `s2`, `tray`: the recording `tmux()` double and `claude` as ids or strings, no process. `s4.probe.ts`, `c1.mts` and `first-run-route.mts` (C36) run a real tmux on a private socket in the scratchpad with `stub-claude.sh` as the `claude` binary; `first-run-route.mts:2` imports `execFileSync` and `c1.mts:14` uses it for `ps -o ppid= -p <pid>`, a read of a stub's parent. `first-run-route.mts` also drives the route with a recording runner. No probe runs the real `claude`, the real tmux socket, or ports 8787 and 8790.
- Probes after the changes: s1 17, s2 2, s3 (`TZ=Europe/Brussels`) 1, s4 1, s5 1, tray 1 passed; c1 exit 0; c6 prints `0 0 29 2 *` constructs and next run 29 Feb 2028.

## Verify lines

- `sh $LAND/templates/checks.sh tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree's `tools/oculus`: 2 runs, both exit 0 (the second after the report was written). Final lines of the first: `ok vitest (27.9 s): Duration 24.74s ...`, `test:quick: 28.5 s (limit 45.0 s); every command passed`, `checks: 1 commands passed` (log `$A/r2/checks-run-a.log`).
- `npx vitest run tests/checks --testTimeout 120000 --reporter=dot`: 16 files, 229 tests passed (after `npm run diagrams`).
- `sh utils/unused-exports.sh`: 379 lines, diff against the base empty.
- `npx prettier --check src tests config HELP.md DESIGN.md`: all matched files use Prettier code style. `npx eslint src tests`: no output. `npx tsc --noEmit -p .` and svelte-check: 0 errors.
- Non-ASCII: the ASCII gate over src, tests and config printed 0 lines; `LC_ALL=C grep -c '[^ -~]'` over HELP.md and DESIGN.md printed 0 each.
- Comment width: `tests/checks/source/comment-width.test.ts` passes inside the 229. Module state: `tests/checks/tree/boundaries.test.ts` passes (the `unreadable` set lives inside `watchSchedules`).
