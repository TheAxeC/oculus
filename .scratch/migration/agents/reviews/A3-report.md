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
- `npx prettier --check src tests config HELP.md DESIGN.md`: all matched files use Prettier code style. `npx eslint src tests`: no output. svelte-check: 0 errors. `npx tsc --noEmit -p .`: 2 errors, both TS2614 in files the step does not change (`task-card.ts:10`, `card.ts:9`).
- Non-ASCII: the ASCII gate over src, tests and config printed 0 lines; `LC_ALL=C grep -c '[^ -~]'` over HELP.md and DESIGN.md printed 0 each.
- Comment width: `tests/checks/source/comment-width.test.ts` passes inside the 229. Module state: `tests/checks/tree/boundaries.test.ts` passes (the `unreadable` set lives inside `watchSchedules`).

# The first build and round 1, as reported then

Everything in the brief is done.

`npm run test:quick` ran 5 times and its last run is green (quoted below). Runs 1, 3 and 4 of the five ran past the list's 45 s limit while other agents were running on the machine; run 1 was red on eslint and runs 2 to 5 were green.

## Open items of the state file

The state file's "Open items" section (`sed -n 129,132p tools/oculus/.scratch/migration/orchestrator-state.md`) holds no entry, only its intro sentence:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

```

## The cases' first run

The first run on the unchanged tree was taken before any change (`first-run.log` in the scratchpad `a3-builder`, with the probes `probes/first-run-config.mts`, `probes/first-run-route.mts`, `probes/c1.mts`). Printed whole:

```
pane_pid 46305 listed pid 46305 printed $$ 46305 ppid(printed) 46304 ppid(pane) 46304
equal: true pane is parent of printed: false
taskSchedules exported by settings.ts: undefined
C3 absent entries | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false}
C3 schedule "" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":""}}
C3 litwatch: {} | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{}}
C4 "nonsense" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"nonsense"}}
C4 "61 * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"61 * * * *"}}
C4 "* * * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"* * * * * *"}}
C4 "*/0 * * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":"*/0 * * * *"}}
C4 5 | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":5}}
C4 null | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":null}}
C4 [] | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"inbox":{"schedule":[]}}
C5 0 0 31 2 * | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 0 31 2 *"}}
C5 0 0 29 2 * | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 0 29 2 *"}}
C6 @hourly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@hourly"}}
C6 @daily | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@daily"}}
C6 @weekly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@weekly"}}
C6 @monthly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@monthly"}}
C6 @yearly | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"@yearly"}}
C6 0 7 * * MON | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":"0 7 * * MON"}}
C6  0 7 * * *  | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"scout":{"schedule":" 0 7 * * * "}}
C25 tasks.foo.schedule | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"foo":{"schedule":"0 7 * * *"}}
C32 litwatch: "0 7 * * *" | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":"0 7 * * *"}
C32 tasks: [] | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false}
C32 tasks: [] | [] []
C32 litwatch {schedule, at: 7} | problems=[] settingFindings=[] optionFindings=[] tasksRead={"skip_permissions":false,"litwatch":{"schedule":"0 7 * * *","at":7}}
writeConfigKey tasks.scout.schedule="61 * * * *" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
writeConfigKey tasks.scout.schedule="0 0 31 2 *" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
writeConfigKey tasks.scout.schedule="0 7 * * 1" | {"changed":[],"refused":[{"field":"behavior.yml:tasks.scout.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]}
P1 write tasks.litwatch.schedule | {"changed":[],"refused":[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"The options catalog has no option of that name in a tracked config file"}]} | config.tasks = {"skip_permissions":false,"litwatch":{"schedule":""}}
croner in node_modules: import node_modules/croner/dist/croner.js -> ERR_MODULE_NOT_FOUND
C15/C16/C33 skip_permissions=false: status=200 argv=["'/opt/Claude CLI/claude' '/research-cockpit litwatch'"] folder listing before='' after=''
C15/C16/C33 skip_permissions=true: status=200 argv=["'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch'"] folder listing before='' after=''
C2 C7-C14 C17-C24 C28-C31 C34 C35 modules:
    import src/lib/server/machine/tasks/schedule.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/server/machine/tasks/record.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/server/machine/tasks/start.ts -> ERR_MODULE_NOT_FOUND
    import src/lib/state/system/machine/schedule.svelte.ts -> ERR_MODULE_NOT_FOUND
    data/helpers/run/tasks.ts exports: taskSkipPermissions
    live-settings targets mention schedules: false
C36 route status 200 terminal 6627b3-claude pane pid 47412
C36 pane shows: /Users/axelfaes/.zshenv:.:1: no such file or directory: /private/tmp/claude-502/-Users-axelfaes-work | space-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/c36/home/.cargo/env | STUB ARGS: [/research-cockpit scout]
C36 scan (busy): [{"id":"0000b934-0000-4000-8000-00006ac3b7f9","pid":47412,"liveStatus":"busy","live":true}]  pane pid 47412
C36 scan (after 9 s, idle): [{"id":"0000b934-0000-4000-8000-00006ac3b7f9","pid":47412,"liveStatus":"idle","live":true}]
C36 one-run rule on the unchanged tree: import src/lib/server/machine/tasks/schedule.ts -> ERR_MODULE_NOT_FOUND
```

Reading of that run: every schedule case shows no schedule behaviour on the unchanged tree (`taskSchedules` undefined, `writeConfigKey` refusing `tasks.<task>.schedule` with the no-option sentence, the new modules not found); C1, C26, C33 and C36 hold there as the brief says (C1 pane pid equals the printed pid, C26 and C33 below). The cases the brief's rules got wrong are listed under "Anything in the brief that was wrong or impossible".

## The cases, final run

Each case names its checker. `test` is a kept test (title, run on the changed tree in the DONE table, failing lines under "Kept tests"). `probe` is a vitest probe kept in the scratchpad `a3-builder/vp` (`s1.probe.ts`, `s2.probe.ts`, `s3.probe.ts`, `s4.probe.ts`, `s5.probe.ts`, `tray.svelte-probe.ts`, run with `npx vitest run --config <scratchpad>/a3-builder/vp/vitest.config.ts <name>`), `probes/c1.mts` or `probes/c6.mjs`. Output lines are as printed; the two characters outside ASCII that vitest prints (a horizontal rule and the ellipsis inside a long array) are written as `-` and `...`.

### C1. The pane pid and the registry pid

Checked by: probe `c1.mts`.

```
pane_pid 32821 listed pid 32821 printed $$ 32821 ppid(printed) 32820 ppid(pane) 32820
equal: true pane is parent of printed: false
```

### C2. A pattern at 06:59 fires at 07:00 and the payload's next is tomorrow

Checked by: probe s1.

```
C2 06:59:00 payload litwatch pattern=0 7 * * * next=2026-10-04T05:00:00.000Z starts=0
C2 07:00:10 starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T05:00:00.000Z"}] new-session calls=1 runs=[{"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"started","terminal":"2b9220-claude"}] next=2026-10-05T05:00:00.000Z (tomorrow 07:00 = 2026-10-05T05:00:00.000Z)
```

### C3. Absent entries, an empty schedule and an empty entry give no job

Checked by: test 'reads each pattern as written, and the default with no problem for a missing or {} entry' (settings.test.ts) and probe s1.

```
C3 no job: starts=0 record exists=false payload=[["litwatch","",null],["scout","",null],["linkedin","",null],["inbox","",null]]
```

### C4. Four unreadable patterns and three non-text values give no job and one finding each

Checked by: tests `answers the default and a %s problem for %j` (settings.test.ts), the value-rule rows, the config.test.ts `toContain` lines; probe s5 for the write refusal.

```
C4/C5 write "61 * * * *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern of five fields, such as 0 7 * * 1, or a nickname such as @daily"}] changed=[] file changed=false
C4/C5 write "0 0 31 2 *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern that matches a date, and this one matches none"}] changed=[] file changed=false
C4/C5 write "0 7 * * 1": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "@daily": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write 5: refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes text"}] changed=[] file changed=false
```

### C5. A pattern that matches no date gives no job; 29 February gives a job

Checked by: the same tests, probe s5 for the write refusal, probe `c6.mjs` for the next run.

```
C4/C5 write "61 * * * *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern of five fields, such as 0 7 * * 1, or a nickname such as @daily"}] changed=[] file changed=false
C4/C5 write "0 0 31 2 *": refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes a cron pattern that matches a date, and this one matches none"}] changed=[] file changed=false
C4/C5 write "0 7 * * 1": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "@daily": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write "": refused=[] changed=["behavior.yml:tasks.litwatch.schedule"] file changed=true
C4/C5 write 5: refused=[{"field":"behavior.yml:tasks.litwatch.schedule","reason":"This option takes text"}] changed=[] file changed=false
C6/C5 "0 0 29 2 *" constructs; next after 2026-10-05 12:00 local = Tue Feb 29 2028 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "0 0 31 2 *" constructs; next after 2026-10-05 12:00 local = null
```

### C6. Nicknames, a weekday name and a padded pattern each give a job

Checked by: test 'reads each pattern as written...' and probe `c6.mjs`.

```
C6/C5 "@hourly" constructs; next after 2026-10-05 12:00 local = Mon Oct 05 2026 13:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@daily" constructs; next after 2026-10-05 12:00 local = Tue Oct 06 2026 00:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@weekly" constructs; next after 2026-10-05 12:00 local = Sun Oct 11 2026 00:00:00 GMT+0200 (Central European Summer Time)
C6/C5 "@monthly" constructs; next after 2026-10-05 12:00 local = Sun Nov 01 2026 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "@yearly" constructs; next after 2026-10-05 12:00 local = Fri Jan 01 2027 00:00:00 GMT+0100 (Central European Standard Time)
C6/C5 "0 7 * * MON" constructs; next after 2026-10-05 12:00 local = Mon Oct 12 2026 07:00:00 GMT+0200 (Central European Summer Time)
C6/C5 " 0 7 * * * " constructs; next after 2026-10-05 12:00 local = Tue Oct 06 2026 07:00:00 GMT+0200 (Central European Summer Time)
```

### C7. Catch-up after a short downtime

Checked by: test 'starts one catch-up run at start for the due times missed while the server was down'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C8. Catch-up after three days is one run

Checked by: the same test, its second row.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C9. A restart after the due time was handled starts nothing

Checked by: test 'never starts a due time the record holds as handled, after a restart or from a second watcher'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C10. A pattern written after its time today never catches up

Checked by: probe s1.

```
C10 09:12 starts=0 since=2026-10-04T07:12:00.000Z (now 2026-10-04T07:12:00.000Z) handled=null next=2026-10-05T05:00:00.000Z
C10 next day 07:00 starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-05T05:00:00.000Z"}]
```

### C11. A pattern changed, emptied or dropped while the server runs

Checked by: probe s1 (the watcher) and probe s2 (the liveSettings path).

```
C11 set(same): schedule payload version 1 -> 1 next=2026-10-05T05:00:00.000Z
C11 set(0 9 * * *) at 08:00: pattern=0 9 * * * next=2026-10-04T07:00:00.000Z (want 2026-10-04T07:00:00.000Z) since=2026-10-04T06:00:00.600Z handled=null
C11 09:01: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T07:00:00.000Z"}]
C11 set(''): pattern='' next=null record pattern='' kills=[] timers=1
C11 a day later after emptying: starts=1
C11 push whose merge dropped behavior.yml: set calls still 1, pattern kept=0 9 * * *
```

### C12. A due time while the earlier run is busy, waiting or unmatched

Checked by: test 'starts nothing for a due time while the task's earlier run is working, and records it skipped' (rows busy, waiting, no session matched).

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C13. A due time after the earlier terminal left the list

Checked by: probe s1.

```
C13 earlier terminal absent from the list: new-session=1 kills=[] newest run={"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"started","terminal":"7cae3c-claude"}
```

### C14. Two tasks due in one minute

Checked by: probe s1.

```
C14 starts=["litwatch","scout"] new-session=2 litwatch=[["started","6a87a4-claude"]] scout=[["started","5149e6-claude"]]
```

### C15. A hand press is recorded; a press beside a working scheduled run starts a second terminal

Checked by: probe s2 (through `handleTerminal`).

```
C15 hand press: status=200 terminal=ed292c-claude record={"pattern":"","since":"2026-10-05T16:14:24.171Z","handled":null,"runs":[{"trigger":"hand","due":null,"at":"2026-10-05T16:14:24.170Z","outcome":"started","terminal":"ed292c-claude"}]}
C15 second press while the first terminal is busy: status=200 new terminal=529700-claude (differs=true) runs=hand,started,529700-claude | hand,started,ed292c-claude
```

### C16. The scheduled argv equals the press's, with the flag only under skip_permissions

Checked by: probe s1.

```
C16 skip_permissions=false: hand argv='/opt/Claude CLI/claude' '/research-cockpit litwatch' | scheduled argv='/opt/Claude CLI/claude' '/research-cockpit litwatch' | equal=true
C16 skip_permissions=true: hand argv='/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch' | scheduled argv='/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch' | equal=true
```

### C17. Daylight saving changes in Europe/Brussels

Checked by: probe s3 under `TZ=Europe/Brussels`, and test 'starts the run of a daily 02:30 on the day the clocks skip it, once, at 03:30'.

```
C17 TZ=Europe/Brussels offset now: Mon Oct 05 2026 18:14:30 GMT+0200 (Central European Summer Time)
C17 "30 2 * * *" from 2026-03-28 23:00 CET for 30 h: ["2026-03-29 03:30:00 GMT+02:00","2026-03-30 02:30:00 GMT+02:00"]
C17 "30 2 * * *" from 2026-10-24 23:00 CEST for 30 h: ["2026-10-25 02:30:00 GMT+02:00","2026-10-26 02:30:00 GMT+01:00"]
C17 "0 * * * *" from 2026-10-24 23:30 CEST for 6 h (the repeated hour at 02:00 CEST/CET is 00:00Z and 01:00Z): ["2026-10-25 00:00:00 GMT+02:00","2026-10-25 01:00:00 GMT+02:00","2026-10-25 02:00:00 GMT+02:00","2026-10-25 03:00:00 GMT+01:00","2026-10-25 04:00:00 GMT+01:00"]
```

### C18. A machine asleep over two due times

Checked by: probe s1.

```
C18 wake 09:00: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-10-04T05:00:00.000Z"},{"kind":"scout","trigger":"schedule","due":"2026-10-04T06:00:00.000Z"}] (07:00=2026-10-04T05:00:00.000Z 08:00=2026-10-04T06:00:00.000Z)
```

### C19. A yearly pattern waits in timers of at most 30 s

Checked by: probe s1.

```
C19 timer delays recorded while waiting (max ms) = 30000 over 14 timers; payload next=2026-12-31T23:00:00.000Z
C19 after 1 Jan 00:00:05: starts=[{"kind":"litwatch","trigger":"schedule","due":"2026-12-31T23:00:00.000Z"}] (want one, due 2026-12-31T23:00:00.000Z)
```

### C20. A missing, unreadable or wrong-shaped record file

Checked by: test 'refuses a write over a schedule record it cannot read, leaving it' (record.test.ts); probes s1 and s2.

```
C20 missing file: exists after the first write=true mode=600 lock left=false
C20 file="{": starts=0 new-session=0 sha 021fb596db81 -> 021fb596db81 payload.error="RECORD UNREAD SENTENCE" stderr lines=1: schedule record: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-HV7LlY/schedule.json is not JSON; no schedule
C20 file="{\"litwatch\": 5}": starts=0 new-session=0 sha 2b9f2f511ac7 -> 2b9f2f511ac7 payload.error="RECORD UNREAD SENTENCE" stderr lines=1: schedule record: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-nf9aQ1/schedule.json holds a litwatch entry o
C20 hand press with an unreadable record: status=200 new-session=1 sha 021fb596db81 -> 021fb596db81 stderr=["schedule record: a run was not recorded: is not JSON"]
```

### C21. A record write that fails

Checked by: probe s1.

```
C21 read-only folder: new-session=0 stderr=["schedule: litwatch 2026-10-04T05:00:00.000Z: Error: EACCES: permission denied, open '/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-pro"] file exists=false
C21 next due time after the folder is writable: new-session=1 runs=[{"trigger":"schedule","due":"2026-10-05T05:00:00.000Z","at":"2026-10-05T05:00:00.000Z","outcome":"started","terminal":"34eb48-claude"}]
```

### C22. Two watchers over one record start one run

Checked by: test 'never starts a due time the record holds as handled, after a restart or from a second watcher'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C23. A refused start is recorded failed

Checked by: probe s1 and probe s2.

```
C23 start refused (tmux lists no session): runs=[{"trigger":"schedule","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T05:00:00.000Z","outcome":"failed","terminal":null}] handled=2026-10-04T05:00:00.000Z
C23 next day: runs=[["started","85d8a0-claude"],["failed",null]] new-session calls=2
C23 route: refused start answers status=400 body={"error":"terminal-not-started"} record=[{"trigger":"hand","due":null,"at":"2026-10-05T16:14:24.228Z","outcome":"failed","terminal":null}]
```

### C24. close() with a job armed and with a start awaited

Checked by: test 'leaves no timer after close and starts nothing, a start already awaited included'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C25. A key the catalog holds no entry for gives no finding

Checked by: test 'gives no problem for a key the catalog holds no entry for'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C26. No test or probe runs a real update task

Checked by: `grep -rn "research-cockpit" tests` and the recording runner of the step's tests.

```
$ grep -rn "research-cockpit" tests
tests/data/sources/feeds.test.ts:43:    - "2026-09-02 (local /research-cockpit scout): an older pass"
tests/data/sources/feeds.test.ts:44:    - "2026-09-09 (local /research-cockpit scout): the newest pass"
tests/data/sources/feeds.test.ts:45:    - "2026-09-10 (local /research-cockpit litwatch): a different task, not a run of this feed"
tests/routes/sessions/terminal-actions.test.ts:82:                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
$ grep -n "spawn\|execFile\|exec(" tests/server/machine/tasks/*.ts
(no output)
```

### C27. The tray before the first schedule message

Checked by: probe `tray.svelte-probe.ts`.

```
C27 TRAY BEFORE ANY schedule MESSAGE:
    | Update tasks
    | Close
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable
    | Scout
    | academic openings (web | minutes) Unavailable
    | LinkedIn
    | draft a post from _linkedin/ Unavailable
    | Inbox
    | Gmail triage over the private mailbox Unavailable Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
C27 TRAY AFTER A schedule MESSAGE (a listed terminal, an unlisted one, an error):
    | Update tasks
    | Close
    | The run record ~/.oculus/schedule.json does not read, so no scheduled run starts; the file is left as it is.
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable Next: 10-06 07:00 07:00 scheduled started
    | 06:00 scheduled skipped, the earlier run was still going
    | 05:01 caught up started
    | 04:00 by hand failed
    | Scout
    | academic openings (web | minutes) Unavailable No schedule
    | LinkedIn
    | draft a post from _linkedin/ Unavailable No schedule
    | Inbox
    | Gmail triage over the private mailbox Unavailable Next: 10:00 Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

### C28. A stale lock is taken over; a young lock that outlasts the wait starts nothing

Checked by: probe s1.

```
C28 lock 120 s old: new-session=1 runs=1 lock left=false stderr=["schedule record: took over /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-ElqzlT/schedule.json.lock, which was 120000 m"]
C28 lock 7 s old at the due time, outlasting the wait: new-session=0 runs=0 lock still there=true stderr=["schedule: litwatch 2026-10-04T05:00:00.000Z: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/a3-probe-TUdvhN/schedule.json.lock stays taken"]
C28 next due time with the lock gone: new-session=1 runs=[["started","2026-10-05T05:00:00.000Z"]]
```

### C29. A due time while the task's own start is awaited

Checked by: probe s1.

```
C29 two minutes due, the first start still awaited: starts called=1 runs=[["skipped",null,"2026-10-04T07:01:00.000Z"],["started",null,"2026-10-04T07:00:00.000Z"]]
```

### C30. A catch-up before the first sessions payload waits for it

Checked by: probe s1 (busy half) and test 'ends the terminal of the task's idle earlier run, and then starts the new run' (idle half).

```
C30 session busy: before the payload starts=0 new-session=0 runs=1; after: new-session=0 kills=[] newest run={"trigger":"catch-up","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T07:00:05.000Z","outcome":"skipped","terminal":"aabbcc-claude"}
C30 session idle: before the payload starts=0 new-session=0 runs=1; after: new-session=1 kills=["oculus-aabbcc-claude"] newest run={"trigger":"catch-up","due":"2026-10-04T05:00:00.000Z","at":"2026-10-04T07:00:05.000Z","outcome":"started","terminal":"06a750-claude"}
```

### C31. An idle earlier run's terminal is ended, then the new run starts

Checked by: the same test, and probe s1.

```
C31 six hourly due times, each earlier run idle: new-session=6 kills=5 max open at once=1
```

### C32. A tasks entry or block that is not a map

Checked by: test 'names a task entry or a tasks block that is not a map, and reads the other tasks'.

(the test is the check; its passing line is in the verbose run under DONE / NOT DONE)

### C33. A hand press with no record path writes nothing

Checked by: probe s2.

```
C33 no record path: status=200 new-session=1 scratch folder listing before='' after=''
```

### C34. A foreign key is kept; the 21st run drops the oldest

Checked by: probe s1.

```
C34 foreign key after a write: file has foo=true payload tasks=litwatch,scout,linkedin,inbox (no foo)
C34 21 hand runs: kept=20 newest at=2026-01-21T00:00:00.000Z oldest at=2026-01-02T00:00:00.000Z (the first, 2026-01-01, dropped)
```

### C35. A changed pattern through liveSettings

Checked by: probe s2.

```
C35 before: pattern=0 7 * * * next=2026-10-06T05:00:00.000Z
C35 config push 0 7 -> 0 9: set calls=1 ["0 9 * * *"] pattern=0 9 * * * next local hour=9
C35 push with the same pattern: set calls still 1
```

### C36. The real argv on a scratch tmux server with the stub claude

Checked by: probe s4 (a real tmux server on its own socket, the stub claude, the real registry scan).

```
C36 first start answer: {"terminal":{"resumes":null,"task":false,"exit":null,"job":null,"foreign":false,"id":"f5bf13-claude","name":"task litwatch","title":"","icon":"","color":"","kind":"claude","cwd":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/c36b","command":"bash","pid":25906,"created":"2026-10-05T15:25:00.000Z","attached":false}}
C36 a press started terminal f5bf13-claude (pane pid 25906) through startUpdateTask with the real taskCommand argv
C36 pane shows: STUB ARGS: [/research-cockpit litwatch] | STUB PID=25906 | STUB STATUS=busy
C36 sessions payload inputs (busy): {"records":[[25906,"busy"]],"terminals":[["f5bf13-claude",25906]]}
C36 first minute boundary, session busy: runs (newest first) = ["schedule/skipped/f5bf13-claude","hand/started/f5bf13-claude"]; terminals now = ["f5bf13-claude"]
C36 sessions payload inputs (idle): {"records":[[25906,"idle"]],"terminals":[["f5bf13-claude",25906]]}
C36 second minute boundary, session idle: runs (newest first) = ["schedule/started/04414d-claude","schedule/skipped/f5bf13-claude","hand/started/f5bf13-claude"]; terminals now = ["04414d-claude"]
```

## DONE / NOT DONE

Run from `tools/oculus` in the worktree. NOT DONE: nothing. Not covered by any check, and not verified: the autumn overlap hour is checked by probe s3 only, not by a kept test; the page's drawing of the tray is checked by the render probe only (the look at landing is the orchestrator's).

| Item | Command | Result |
|---|---|---|
| Items 1 to 8 built | the files listed under "The files" | DONE |
| Quick list, last run | `sh <land>/templates/checks.sh .scratch/migration/orchestrator-state.md` (runs `npm run test:quick`) | green, quoted below |
| The six named test files | `npx vitest run tests/server/machine/tasks/schedule.test.ts tests/server/machine/tasks/record.test.ts tests/data/sources/config/settings.test.ts tests/data/sources/config/catalog/value-rule.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts` plus `tests/checks/tree tests/checks/imports tests/checks/diagrams` | 13 files, 218 tests passed |
| ASCII gate | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (the command of spec.md:97, with `bin` left out: `bin` does not exist in this tree) | prints nothing, exit status 0 |
| ASCII over HELP.md and DESIGN.md | `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` | prints nothing, exit status 1 (no match) |
| Unused exports | `sh utils/unused-exports.sh` counted with `wc -l`, and `diff` against the base's output | 379 lines, diff empty (base 379) |
| Sizes and folders | `wc -l` of each file and `ls <folder>` counted with `wc -l`, listed under "The files" | largest written source file 843 lines (terminals.svelte.ts, limit 880); UpdateTray.svelte 285 (520); machine/ 9 items, machine/tasks 3, state/system/machine 7, tests/server/machine 7, tests/server/machine/tasks 2 |
| Diagrams | `npm run diagrams` before each list run; `npx vitest run tests/checks/diagrams` | passed |
| Prettier | `npm run format:check` | All matched files use Prettier code style! |
| Full-list runs | `checks.sh` over `npm run test:quick` | 5 runs: run 1 red (eslint: an unused import in schedule.test.ts, fixed, that file rerun alone), runs 2 to 5 green |

The kept tests, verbose run on the changed tree (`npx vitest run tests/server/machine/tasks tests/data/sources/config/settings.test.ts tests/data/sources/config/catalog/value-rule.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts --reporter=verbose`, the check mark written as ok):

```
 ok |unit| tests/server/machine/tasks/record.test.ts > the run record > refuses a write over a schedule record it cannot read, leaving it
 ok |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem > answers the kind of problem each control, bound and list gives a value, and none for a value that fits
 ok |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem over a list > checks each item by the entry bounds, whole and form
 ok |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
 ok |unit| tests/checks/config/config.test.ts > settingFindings > says nothing for a merge that dropped behavior.yml, or for a map without the catalog
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads each pattern as written, and the default with no problem for a missing or {} entry
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a nonsense problem for "form"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a 61 * * * * problem for "form"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a * * * * * * problem for "form"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a */0 * * * * problem for "form"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a 5 problem for "text"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a null problem for "text"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a  problem for "text"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a 0 0 31 2 * problem for "cron_never"
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > names a task entry or a tasks block that is not a map, and reads the other tasks
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > gives no problem for a key the catalog holds no entry for
 ok |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads a pattern the Settings view wrote at its three-level key
 ok |unit| tests/data/sources/config/settings.test.ts > the shipped files > answers the shipped default for each setting the shipped file gets wrong, and reads every shipped default
 ok |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the task action > starts every accepted task as an interactive session, with no skip and no print-mode flags
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts one catch-up run at start for the due times missed while the server was down
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts nothing for a due time while the task's earlier run is working, and records it skipped
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > ends the terminal of the task's idle earlier run, and then starts the new run
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > never starts a due time the record holds as handled, after a restart or from a second watcher
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > leaves no timer after close and starts nothing, a start already awaited included
 ok |unit| tests/server/machine/tasks/schedule.test.ts > watchSchedules > starts the run of a daily 02:30 on the day the clocks skip it, once, at 03:30
 Test Files  6 passed (6)
      Tests  105 passed (105)
```

Final lines of the last list run (`quick-5.log`):

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (16.7 s)
ok      svelte-check (20.0 s): 1791216707079 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (30.5 s): Duration  23.80s (transform 23.70s, setup 0ms, import 53.08s, tests 37.78s, environment 412ms)
test:quick: 32.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Lines of every list run:

Run 1:

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.7 s)
FAILED  eslint (20.1 s)
ok      svelte-check (53.9 s): 1791214788951 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (64.9 s): Duration  57.36s (transform 66.82s, setup 0ms, import 157.19s, tests 67.79s, environment 536ms)
test:quick: 66.1 s (limit 45.0 s); failed: eslint
test:quick: over the time limit
checks: failed with exit 1: npm run test:quick
checks: 1 of 1 commands failed
```

Run 2:

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (17.6 s)
ok      svelte-check (19.2 s): 1791214890444 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (32.1 s): Duration  26.02s (transform 31.09s, setup 0ms, import 62.37s, tests 36.78s, environment 327ms)
test:quick: 33.7 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Run 3:

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (9.4 s)
ok      svelte-check (33.4 s): 1791215490169 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (63.2 s): Duration  56.06s (transform 93.26s, setup 0ms, import 182.54s, tests 27.63s, environment 222ms)
test:quick: 63.9 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed
```

Run 4:

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (2.5 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (5.1 s)
ok      eslint (34.4 s)
ok      svelte-check (36.5 s): 1791216220022 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (86.1 s): Duration  77.62s (transform 101.43s, setup 0ms, import 241.86s, tests 52.21s, environment 966ms)
test:quick: 88.9 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed
```

Run 5:

```
test:quick: 58 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (1.5 s): All matched files use Prettier code style!
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (16.7 s)
ok      svelte-check (20.0 s): 1791216707079 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (30.5 s): Duration  23.80s (transform 23.70s, setup 0ms, import 53.08s, tests 37.78s, environment 412ms)
test:quick: 32.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Tests outside the list that ran: `npx vitest run tests/checks --reporter=dot` ran once with 8 failures that were 5 s timeouts of the import-order tests under load (the machine was running other agents), stale diagrams after an import change, and `tests/checks/source/comment-width.test.ts` and `tests/checks/source/keys.test.ts` findings in this step's files (four comment lines over 100 columns and the unread key `app.tasks.record_unread` read through `text[...]`, now read through `words(text, 'app.tasks.record_unread')`); after the fixes `npx vitest run tests/checks/imports tests/checks/diagrams tests/checks/source/keys.test.ts --testTimeout 120000` printed `Test Files 5 passed (5) Tests 82 passed (82)`. `tests/checks/imports/order.test.ts` rejected an import of `data/helpers/run/tasks.ts` from `data/model/model-processes.ts`; `UPDATE_TASKS` and `UpdateTask` now live in `data/model/model-processes.ts` (judgment call 1).

## Kept tests: failing lines on the unchanged tree

On the unchanged tree (the dispatch base copied to the scratchpad, the step's test files copied in, `node_modules` linked; `base.out`):

```
== UNCHANGED TREE: tests/server/machine/tasks/schedule.test.ts
 FAIL  |unit| tests/server/machine/tasks/schedule.test.ts [ tests/server/machine/tasks/schedule.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/tasks/record.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/base/oculus/tests/server/machine/tasks/schedule.test.ts
 Test Files  1 failed (1)
      Tests  no tests
== UNCHANGED TREE: tests/server/machine/tasks/record.test.ts
 FAIL  |unit| tests/server/machine/tasks/record.test.ts [ tests/server/machine/tasks/record.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/tasks/record.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-builder/base/oculus/tests/server/machine/tasks/record.test.ts
 Test Files  1 failed (1)
      Tests  no tests
== UNCHANGED TREE: tests/data/sources/config/catalog/value-rule.test.ts
------- Failed Tests 1 -------
 FAIL  |unit| tests/data/sources/config/catalog/value-rule.test.ts > valueProblem > answers the kind of problem each control, bound and list gives a value, and none for a value that fits
TypeError: Cannot read properties of undefined (reading 'test')
 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
== UNCHANGED TREE: tests/checks/config/config.test.ts
------- Failed Tests 1 -------
 FAIL  |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
AssertionError: expected [ 'calendar.days_ahead', ...(35) ] to deeply equal [ 'calendar.days_ahead', ...(38) ]
 Test Files  1 failed (1)
      Tests  1 failed | 29 passed (30)
== UNCHANGED TREE: tests/data/sources/config/settings.test.ts
------ Failed Tests 13 -------
 FAIL  |unit| tests/data/sources/config/settings.test.ts > the synthetic catalog > gives every setting a default other than the shipped one
TypeError: Cannot read properties of undefined (reading 'default')
 FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > reads each pattern as written, and the default with no problem for a missing or {} entry
AssertionError: expected { Object (threw) } to strictly equal { value: { ...(4) }, problems: [] }
 FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a nonsense problem for "form"
 FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a 61 * * * * problem for "form"
 FAIL  |unit| tests/data/sources/config/settings.test.ts > taskSchedules > answers the default and a * * * * * * problem for "form"
== UNCHANGED TREE: tests/routes/sessions/terminal-actions.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)
== UNCHANGED TREE: tests/checks/tree/boundaries.test.ts
------- Failed Tests 1 -------
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
Error: Test timed out in 5000ms.
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
== UNCHANGED TREE boundaries (testTimeout 120000)
      Tests  11 passed (11)
```

## The stub of the look, quoted whole (`probes/stub-claude.sh`)

```
#!/bin/bash
# Stub for the real claude, used by the A3 probes and the look. It prints its arguments, writes the
# registry entry and the transcript a Claude session writes into its account folder, reports busy
# for STUB_BUSY_SECONDS (default 8) and then idle, and waits for input. The account folder is
# CLAUDE_CONFIG_DIR or $HOME/.claude. A file stub-status in the account folder holding busy or idle
# overrides the timer.
ACCOUNT="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
BUSY="${STUB_BUSY_SECONDS:-8}"
printf 'STUB ARGS:'
for arg in "$@"; do printf ' [%s]' "$arg"; done
printf '\nSTUB PID=%s\n' "$$"
ID="$(printf '%08x-0000-4000-8000-%012x' "$$" "$(date +%s)")"
SLUG="$(printf '%s' "$PWD" | tr '/' '-')"
mkdir -p "$ACCOUNT/sessions" "$ACCOUNT/projects/$SLUG"
START_MS=$(( $(date +%s) * 1000 ))
REGISTRY="$ACCOUNT/sessions/$$.json"
TRANSCRIPT="$ACCOUNT/projects/$SLUG/$ID.jsonl"
write_registry() {
    printf '{"pid":%s,"sessionId":"%s","cwd":"%s","startedAt":%s,"kind":"interactive","entrypoint":"cli","status":"%s","name":"stub"}\n' \
        "$$" "$ID" "$PWD" "$START_MS" "$1" > "$REGISTRY.tmp"
    mv "$REGISTRY.tmp" "$REGISTRY"
}
trap 'rm -f "$REGISTRY"' EXIT
NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
printf '{"type":"user","sessionId":"%s","cwd":"%s","timestamp":"%s","version":"stub","entrypoint":"cli","origin":{"kind":"human"},"message":{"role":"user","content":"%s"}}\n' \
    "$ID" "$PWD" "$NOW" "$*" > "$TRANSCRIPT"
LAST=""
BEGAN=$SECONDS
while :; do
    if [ -f "$ACCOUNT/stub-status" ]; then
        STATUS="$(cat "$ACCOUNT/stub-status")"
    elif [ $(( SECONDS - BEGAN )) -lt "$BUSY" ]; then
        STATUS=busy
    else
        STATUS=idle
    fi
    if [ "$STATUS" != "$LAST" ]; then
        write_registry "$STATUS"
        printf 'STUB STATUS=%s\n' "$STATUS"
        LAST="$STATUS"
    fi
    if read -r -t 1 LINE; then
        [ "$LINE" = "quit" ] && exit 0
    fi
done
```

## The files

```
config/behavior.yml       201 ->      206
config/catalogs/options.yml      1280 ->     1312
config/text/app.yml        72 ->       81
config/text/findings.yml       179 ->      181
config/text/server.yml       106 ->      108
config/text/views/system/workbench.yml       199 ->      201
DESIGN.md       438 ->      440
HELP.md       352 ->      352
package-lock.json      7442 ->     7462
package.json        96 ->       97
src/lib/data/helpers/run/tasks.ts        22 ->       30
src/lib/data/model/index.ts       546 ->      553
src/lib/data/model/model-processes.ts        40 ->       70
src/lib/data/sources/config/catalog/options.ts       558 ->      561
src/lib/data/sources/config/catalog/value-rule.ts       252 ->      285
src/lib/data/sources/config/catalog/value-words.ts       117 ->      121
src/lib/data/sources/config/settings.ts       482 ->      510
src/lib/server/edit/writes/config/config-fit.ts       489 ->      492
src/lib/server/machine/pty/routes.ts       685 ->      664
src/lib/server/machine/tasks/record.ts  new/changed ->      290
src/lib/server/machine/tasks/schedule.ts  new/changed ->      381
src/lib/server/machine/tasks/start.ts  new/changed ->      115
src/lib/server/root/context.ts       737 ->      756
src/lib/server/root/live-settings.ts       275 ->      289
src/lib/server/root/watch/pollers.ts       172 ->      222
src/lib/shell/rail/UpdateTray.svelte       248 ->      285
src/lib/state/client/context.ts       505 ->      509
src/lib/state/client/entities.svelte.ts       108 ->      110
src/lib/state/client/payloads.ts       129 ->      134
src/lib/state/sessions/terminals.svelte.ts       839 ->      843
src/lib/state/shared/stores/shapes.ts       322 ->      325
src/lib/state/system/config/editors/fields.ts       653 ->      664
src/lib/state/system/config/messages.ts        58 ->       60
src/lib/state/system/machine/schedule.svelte.ts  new/changed ->       94
src/routes/+page.svelte       221 ->      222
src/routes/api/(sessions)/terminal/+server.ts        43 ->       44
tests/checks/config/config.test.ts  new/changed ->      603
tests/checks/tree/boundaries.test.ts       657 ->      657
tests/data/sources/config/catalog/value-rule.test.ts  new/changed ->      237
tests/data/sources/config/settings.test.ts  new/changed ->      685
tests/data/sources/config/wrong-settings.ts  new/changed ->       40
tests/routes/sessions/terminal-actions.test.ts       342 ->      342
tests/routes/sessions/terminal-fixture.ts       213 ->      213
tests/server/machine/tasks/record.test.ts        42 ->       42
tests/server/machine/tasks/schedule.test.ts       341 ->      341
tests/server/root/context-fixture.ts       124 ->      130
```

`docs/diagrams/` holds 12 regenerated files (`npm run diagrams`); the brief's paths list names them.

## Every judgment call the brief left open

1. Where `UPDATE_TASKS` and `UpdateTask` live. The brief puts them in `data/helpers/run/tasks.ts`, and `SchedulePayload` in `data/model/model-processes.ts` names `UpdateTask`. `tests/checks/imports/order.test.ts` ('holds the data folders') refuses `data/model/model-processes.ts:5 imports data/helpers/run/tasks.ts (data/helpers, above data/model)`. They live in `model-processes.ts` and are exported by `data/model/index.ts`; `tasks.ts` imports them for `isUpdateTask`, and every other module imports them from `data/model`. The boundary table is unchanged: `data/helpers/run/tasks` stays in the state row for `taskSkipPermissions`.
2. The croner call that gives the fired due time. `dueAt(job, now)` in `server/machine/tasks/schedule.ts:82` is `job.previousRuns(1, <the start of the second after now>)[0]`, because `previousRuns` is exclusive and second-granular. Probe `probes/cron-boundary.mjs` (`final/cron-boundary.out`): `previousRuns(now)` at 0 ms after the due time answers the day before, `dueAt` answers the day of the due time from 0 ms on; and a machine asleep 06:00 to 09:00 over an hourly pattern gets the newest due time (09:00 local).
3. A look for a due time every 30 s (`CHECK_MS`, `consider` in `schedule.ts`) beside croner's timer. Evidence: raw croner callbacks over 30 h from 2026-03-28 22:00Z under `TZ=Europe/Brussels` fire only at 2026-03-30 02:30 (probe `vp/s3b.probe.ts`: `C17b raw croner callbacks (fake clock, 30 h): ["2026-03-30 02:30:00 GMT+02:00"]`), so a daily 02:30 never runs on the day the clocks skip it, while C17 expects 03:30. `consider` decides the newest due time that no decision has seen (`seen[kind]`), so the timer and the look never start one due time twice; `claimDue` stays the guard across servers. A test keeps it (the sixth test of `schedule.test.ts`).
4. The lock: `schedule.json.lock` opened `wx`, retry every 50 ms for up to 2 s, a lock older than 60 s taken over with one stderr line (`record.ts`, `LOCK_RETRY_MS`, `LOCK_WAIT_MS`, `STALE_LOCK_MS`). A folder the lock cannot be made in (permission) answers `unwritable`, not `locked`.
5. The store's name is `schedule` (`state/system/machine/schedule.svelte.ts`, `createSchedule`, `ScheduleStore { task(kind), error() }`, five runs shown). The shell reads it, so `'schedule'` is added to `SHELL_STORES` in `tests/checks/tree/boundaries.test.ts`, a file outside the paths list; the test fails without the entry (line quoted above).
6. The tray is not split: `UpdateTray.svelte` is 285 lines (limit 520), so no `TaskRow` component.
7. The stub of the look (`probes/stub-claude.sh`, quoted whole above): prints its arguments and pid, writes the registry entry `<account>/sessions/<pid>.json` and a transcript, is busy for `STUB_BUSY_SECONDS` (default 8) and then idle, or follows a file `<account>/stub-status` holding `busy` or `idle`, and ends on the input line `quit`.
8. The grid of a scheduled run is 80 x 24 (`SCHEDULED_SIZE` in `start.ts`): no page is sized for it.
9. The sentence for an unreadable record is read with `words(text, 'app.tasks.record_unread')` so the key check (`tests/checks/source/keys.test.ts`) sees its reader.
10. `taskSchedules` is read from `data/sources/config/settings.ts` by `context.ts`, `live-settings.ts` and the tests; `data/sources/config.ts` does not re-export it, since nothing reads it there and `utils/unused-exports.sh` would list it.
11. Exports kept to what is imported elsewhere: `RUNS_KEPT`, `STALE_LOCK_MS`, `change`, `TaskLogs`, `Refused`, `Change` of `record.ts`, `taskCommand` of `start.ts` and the two row types of `schedule.svelte.ts` are module-private, and `recordExists` is not written, so `utils/unused-exports.sh` prints the base's 379 lines. `hasForm` takes the forms a pattern decides (`Exclude<Form, 'cron'>`); the cron form is decided in `formProblem`.
12. An empty text is a value when the entry has `empty` (`textProblem`, `emptyIsValue`), the way an empty choice or path is, so `tasks.<task>.schedule: ""` is the off position and the Settings view can write it.
13. A run skipped because the task's own start is awaited is recorded with `terminal` null; one skipped for a working earlier run carries that terminal's id.
14. The earlier run's session is matched by the registry record whose pid equals the terminal's pane pid (C1 shows they are equal for a command tmux runs directly), and by a walk of the process table (`under`) only when no record has that pid.
15. The record folder is watched with `fs.watch` (non-persistent) so a press, a settled run and a second server reach the page.

## Every host- or user-visible change, before and after, for the look of item 9

The look is the orchestrator's, on the scratch server with the stub of `probes/stub-claude.sh` as `claude_bin` and one `tool: claude` account under the scratch `HOME`. What differs, view by view:

1. The update tray (Update, at the foot of the rail). Before, from the base tree (probe `vpb/tray.svelte-probe.ts`):

```
TRAY ON THE BASE TREE:
    | Update tasks
    | Close
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable
    | Scout
    | academic openings (web | minutes) Unavailable
    | LinkedIn
    | draft a post from _linkedin/ Unavailable
    | Inbox
    | Gmail triage over the private mailbox Unavailable Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

   After, with a `schedule` message that carries `litwatch` at `0 7 * * 1` with four runs (one listed terminal, one unlisted), `scout` and `linkedin` empty, `inbox` at `@hourly`, and the unread-record error (probe `vp/tray.svelte-probe.ts`):

```
C27 TRAY AFTER A schedule MESSAGE (a listed terminal, an unlisted one, an error):
    | Update tasks
    | Close
    | The run record ~/.oculus/schedule.json does not read, so no scheduled run starts; the file is left as it is.
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable Next: 10-06 07:00 07:00 scheduled started
    | 06:00 scheduled skipped, the earlier run was still going
    | 05:01 caught up started
    | 04:00 by hand failed
    | Scout
    | academic openings (web | minutes) Unavailable No schedule
    | LinkedIn
    | draft a post from _linkedin/ Unavailable No schedule
    | Inbox
    | Gmail triage over the private mailbox Unavailable Next: 10:00 Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
```

   Put the page in this state: a task with a pattern, its latest runs, and a run whose terminal is listed (the row is a button that opens that terminal) beside one whose terminal is not listed (plain text). What should differ: a `Next:` line under a scheduled task and `No schedule` under an unscheduled one; up to five run rows (time, how it was started, outcome); the error line under the heading while the record file does not read; the Chat row and the press behave as before, including the confirmation while `tasks.skip_permissions` is on.
2. The Settings view, Behavior, heading terminal, section "Update tasks": four new text controls, `tasks.litwatch.schedule`, `tasks.scout.schedule`, `tasks.linkedin.schedule` and `tasks.inbox.schedule`, empty by default. `61 * * * *` is refused before the write in the `settings_not_cron` words and `0 0 31 2 *` in the `settings_cron_never` words; `0 7 * * 1` is written (probe s5, C4/C5 lines above). Before: no such control.
3. `config/behavior.yml`: four entries `<task>: { schedule: "" }` under `tasks:`, so nothing runs until a pattern is written. A wrong pattern gives a finding on the Findings view naming `tasks.<task>.schedule` in the `findings.words.form_cron` words (a pattern that does not construct) or the `findings.words.cron_never` words (a pattern that matches no date), and the task has no schedule.
4. A new machine-local file `~/.oculus/schedule.json` (mode 600) and its lock `schedule.json.lock`, written at the first pattern read and at each run. Before: no such file. A file that does not read is never written over.
5. A scheduled run: a terminal `task <kind>` in the hub root that runs `<claude> '/research-cockpit <kind>'` (with `--dangerously-skip-permissions` while `tasks.skip_permissions` is true) and nothing shown on the page; its row appears in the tray's run list. Before: only a press started a task.
6. A new `schedule` channel on the socket; the page subscribes to it in `src/routes/+page.svelte`.

## Anything in the brief that was wrong or impossible

1. `writeConfigKey(engine, file, key, value)` without the fifth argument checks no value: `config-key.ts:113` builds `sources` as null and `config-fit.ts:284` returns null for a null `sources`. The refusals of C4 and C5 are shown by passing the inputs `config-write.ts` passes (`{ hub, projects: () => [] }`), as probe s5 does. The server's endpoint always passes them.
2. The folder order: the brief's placement of `UPDATE_TASKS` in `data/helpers/run/tasks.ts` conflicts with `tests/checks/imports/order.test.ts` once `model-processes.ts` names `UpdateTask` (judgment call 1).
3. C17: croner alone does not run a daily 02:30 on the day the clocks skip it (judgment call 3), so the expectation holds only with the half-minute look.
4. Item 9 case 1 expects the finding for `inbox: nonsense` "on the Findings view"; the render of that view is not part of this step's probes. The finding text is shown by `tests/checks/config/config.test.ts` (the three `toContain` lines) and not by a drawn view.
5. The quick list's 45 s limit: runs 1, 3 and 4 took 66.1 s, 63.9 s and 88.9 s with other agents running on the machine; runs 2 and 5 took 33.7 s and 32.4 s.

## Head comments and documents read against the change

Rewritten: `DESIGN.md` line 85 (forms, empty, the `tasks:` block), the channels list (adds `schedule`), the new **Schedules.** paragraph (line 139), the **Processes.** paragraph (the exception for a scheduled run's own idle terminal), the update-tasks paragraph (line 416); `HELP.md` lines 25 and 269; head comments of `tasks.ts`, `model-processes.ts`, `value-rule.ts`, `options.ts` (the forms), `settings.ts` (`heldAt`, `taskSchedules`), `routes.ts`, `pollers.ts`, `live-settings.ts`, `UpdateTray.svelte`, `terminal-fixture.ts`, `context-fixture.ts`, `terminals.svelte.ts` (the re-export note). Still true: the head comment of `data/accounts/chat.ts` (names `data/helpers/run/tasks.ts` for the `tasks:` block), `config/behavior.yml`'s `tasks:` comment (carries the scheduled-run sentence), `options.yml`'s `tasks.skip_permissions` description (same sentence).
