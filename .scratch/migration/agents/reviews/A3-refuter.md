# Step A3 refuter report (on .agents/worktrees/A3, base 6044d753c)

Open items for the orchestrator before the verdicts, each argued under its heading below:
- A scheduled run on the spring daylight-saving day starts up to 59 minutes before its due time (Behaviour 4.1). Item 5 is violated and C17 is partial.
- Item 8 is violated in three places: the HELP.md:25 risk sentence, the DESIGN.md:157 Processes sentence and DESIGN.md:416 (Spec 1.1 to 1.3).
- `UPDATE_TASKS` lives in model-processes.ts, not tasks.ts. The order check forces this, so the brief's premise is wrong, and the placement needs a ruling (Spec 1.5).

## Verification (rerun by the reviewer)

All runs were made from the worktree's tools/oculus, or on the reviewer's scratch copy `scratchpad/a3-refute/oc` where the run writes files.

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh .../land/templates/checks.sh .../orchestrator-state.md
  -> "checks: 1 commands passed"
     prettier, ASCII gate, eslint and svelte-check: 0 errors; vitest passed
     test:quick took 55.5 s; the limit printed is 45 s
     config.test.ts and boundaries.test.ts: "changed, run by npm run test:checks or test:slow"

npx vitest run <the brief's six files>
  -> Test Files 6 passed (6) | Tests 105 passed (105)

npx vitest run tests/checks --testTimeout 120000
  -> 228 passed, 1 failed (diagrams, its own 60_000 timeout)
npx vitest run <diagrams test alone>
  -> Test Files 1 passed (1) | Tests 45 passed (45)

utils/unused-exports.sh, on the base copy and on the worktree
  -> 379 lines each, no difference

LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md A3-report.md
  -> exit 1, no match

Changed tests run on the base copy (the step's code absent)
  -> Tests 15 failed | 83 passed (98)
     every new taskSchedules row, P1, 'the shipped files',
     'the synthetic catalog', settingFindings and the value-rule table fail;
     terminal-actions.test.ts (G35) passes

npx vitest run tests/server/machine/tasks/schedule.test.ts
  -> Tests 6 passed (6)
     on the copy, verbose, stderr of the catch-up test:
     "schedule record: took over .../schedule.json.lock, which was 137273536.41137695 ms old" (three lines)

Builder probes s1, s2 and s5, repointed at the copy
  -> Test Files 3 passed (3) | Tests 20 passed (20)
     each C line matches the report's quote:
     C2, C3, C4/C5, C10, C11, C13 to C16, C18 to C21, C23, C28 to C31, C33 to C35

Tray render probe, rerun
  -> before any schedule message: the rows as on the base
     after one: "Next: 10-06 07:00", five run rows, the record_unread line

C36 probe on a scratch tmux socket (-S /private/tmp/claude-502/a3r/c36b.sock), stub claude
  -> busy:  runs = ["schedule/skipped/d52d3f-claude","hand/started/d52d3f-claude"]
     idle:  runs = ["schedule/started/e080dd-claude",...]
            terminals now = ["e080dd-claude"]
     tmux -S ... ls afterwards: "no server running"

C1 probe on a scratch socket
  -> "pane_pid 97927 listed pid 97927 printed $$ 97927" | "equal: true"

C6 probe, TZ=Europe/Brussels
  -> "0 0 29 2 *" next Tue Feb 29 2028 00:00
     "0 0 31 2 *" null
     the seven C6 patterns each construct

writeConfigKey probe, with inputs {hub, projects}
  -> refuses "61 * * * *", "*/0", "* * * * * *" and "nonsense" with not_cron
     refuses "0 0 31 2 *" with cron_never, and 5 with not_text
     writes "0 7 * * 1" and ""

Mutations, rerun on the copy (catch-up, working, idle, handled, clearInterval,
close-jobs, unread, cron_never, heldAt-walk)
  -> each fails its kept test

grep -rn "research-cockpit" tests
  -> feeds.test.ts:43-45 and terminal-actions.test.ts:82 only
grep -n "spawn\|execFile\|exec(\|tmux\|claude" tests/server/machine/tasks/*.ts
  -> only comments, the tmux() recorder import and the EARLIER id

grep for history words over the added comments and test titles
  (previously|used to|no longer|renamed|this step|A3|Z5nn|reverted|legacy|after X3f...)
  -> no match

npx vite build, on the copy and on the base copy
  -> croner is inlined in .svelte-kit/output/client/_app/immutable/nodes/2.*.js
     raw:  2,704,919 to 2,734,757 bytes (+29,838)
     gzip: 815,830 to 824,371 bytes (+8,541)
     the step's client code is included in both deltas

Look-at-a-second probe (edge.mjs), TZ=Europe/Brussels, an ordinary day, "0 7 * * *"
  -> 06:59:59.900 answers yesterday's 07:00; 07:00:00.000 answers today's 07:00

Spring probe (spring2.mjs), "30 2 * * *"
  -> "first instant the look answers the 03:30 due time: 2026-03-29 01:59:59 GMT+01:00"

Watcher probe on the copy, fake clock
  -> "30 2": "start called at 2026-03-29 03:00:00 GMT+02:00 for due 03:30"
     "59 2": start called at 03:00 for due 03:59

Autumn probe (dst.mjs)
  -> "0 * * * *", "30 2 * * *", "0 2 * * *", "*/30" and "0,30 2": no second run in the repeated hour
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. behavior.yml has the four empty entries and the comment, and options.yml has the four leaf entries; the 'shipped files' and settingFindings rows pass on the worktree and fail on the base copy.
- 2: holds. croner 10.0.1 is pinned in package-lock.json; value-rule.ts:69 constructs `new Cron(text, { paused: true, mode: '5-part' })`; the C4 and C5 refusals were rerun; the heldAt walk mutation fails P1; options.yml:11, options.ts:104 and DESIGN.md:85 name `cron` and the text under `empty`; `hasForm` taking `Exclude<Form,'cron'>` is reported in judgment call 11, and formProblem decides cron.
- 3: violated in placement only. The kinds are in model-processes.ts, and tasks.ts imports and re-exports them (Spec 1.5).
- 4: holds, except that context-fixture does not use `scratchDir` (Spec 1.7). G35 passes on both trees, and C15 and C33 were rerun.
- 5: violated. The 30 s look starts a spring-day run early (Behaviour 4.1). Everything else was rerun and holds: catch-up, the one-run rule, the wait for the sessions payload, close(), skip under the awaited start, and publish.
- 6: holds. G31, C20, C21, C28 and C34 were rerun; the mode is 600 as approvals.ts and saved.ts use.
- 7: holds. Render probe rerun; the store, the channel and the run rows open the terminal. The tray has no kept test (Proof 2.4).
- 8: violated (Spec 1.1, 1.2 and 1.3).
- 9: not applicable. The look is the orchestrator's at landing; the report carries the before and after section.

Cases:

- C1 met (pane pid equals printed `$$`). C2 met (probe s1). C3 met (G13 first row, probe C3). C4 met (G13 it.each rows, config.test.ts toContain lines, writeConfigKey probe). C5 met (G13 row; writeConfigKey refuses with cron_never; `0 0 29 2 *` next 2028-02-29 00:00). C6 met (c6 probe, G13 first row for `@weekly`, `MON` and the padded pattern).
- C7 met (G46 test 1, row 1). C8 met (G46 test 1, row 2). C9 met (G46 test 4). C10 met (probe). C11 met (probe: set, emptied, push with behavior.yml dropped). C12 met (G46 test 2, rows busy, waiting and no session matched). C13 to C15 met (probe).
- C16 met for the argv: equal with and without the flag (probe). The press's question was not rerun; it is look case 6.
- C17 partial. The autumn half is met (dst.mjs and the builder's s3). The spring half is unmet: the run starts at 03:00 +0200, not 03:30 (Behaviour 4.1, Proof 2.1).
- C18 met (probe). C19 met (probe: largest timer 30000 ms; fires once at 2027-01-01 local). C20 met (G31, probe). C21 met (probe). C22 met (G46 test 4, second watcher). C23 met (probe, route and watcher). C24 met (G46 test 5; clearInterval and close-jobs mutations fail it). C25 met (G13 row). C26 met (greps above). C27 met (render probe before any message). C28, C29 met (probe). C30 met (busy half by probe, idle half by G46 test 3). C31 met (G46 test 3; probe: six hourly due times, at most one open). C32 met for the findings (G13 row); that `taskSkipPermissions` is off for `tasks: []` was not rerun. C33 to C35 met (probe). C36 met (probe on a scratch socket with the stub).

## 1. Spec

- 1.1. HELP.md:25: "while it is on, a press asks for a confirmation first, and a scheduled run starts without one, so a scheduled task then lets an agent edit files and run commands with nobody asked." The brief requires the risk sentence "in these words": "With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer." HELP.md carries a variant without "on a timer", placed before the paragraph says tasks can run on a timer; options.yml:389 carries the brief's words. Failure: a HELP reader reads the risk before learning a timer exists, and a grep for the agreed sentence finds only options.yml. Item 8 violated.
- 1.2. DESIGN.md:157, Processes: the exception sentence for a scheduled run's idle terminal is there; the sentence that an update task's line is oculus's own text, so a scheduled run asks no approval, and runs in a listed terminal the reader can open, is missing, and the paragraph still says such processes run "in a pane the reader can see, never in the background". Failure: a reader has no statement of why a timer-started agent needs no approval or where it runs. Item 8 violated.
- 1.3. DESIGN.md:416: "`taskSkipPermissions` reads the `tasks:` block as it stands with no catalog rule for that key, so a value of any other shape reads as off". The brief asks the clause to say that the schedules are read through the options catalog's rule, and the paragraph to say where `UPDATE_TASKS` lives. Neither is there. Failure: a reader concludes the whole `tasks:` block is unchecked and does not find the four kinds. Item 8 violated.
- 1.4. tests/server/machine/tasks/schedule.test.ts, sixth test 'starts the run of a daily 02:30 on the day the clocks skip it, once, at 03:30': named in neither guarded.md nor the brief, and its title claims what it does not assert (Proof 2.1). C17 partial.
- 1.5. src/lib/data/model/model-processes.ts holds `UPDATE_TASKS`, `UpdateTask`; the brief places them in data/helpers/run/tasks.ts. tests/checks/imports/order.ts puts `data/model` at the foot of the data layer, so model-processes.ts, which needs `UpdateTask` for `SchedulePayload`, cannot import data/helpers. A brief premise found wrong; the builder reported it as judgment call 1 and did not stop. Item 3 violated in placement; the orchestrator rules.
- 1.6. tests/checks/tree/boundaries.test.ts:358 adds `'schedule'` to an allow-list; the file is not on the write list, and the report gives no before and after list as spec.md asks for an allow-list edit.
- 1.7. tests/server/root/context-fixture.ts: `join(tmpdir(), 'oculus-fixture-schedule', 'schedule.json')`, a fixed path shared by every test file and run; the brief says `scratchDir`. Failure: the first test that presses a task through contextFixture writes a record that outlives the run. Item 4 partial.
- 1.8. tests/data/sources/config/settings.test.ts, the taskSchedules describe: the first title reads "...for a missing or {} entry" (the brief: "missing, empty or {} entry"); the it.each rows `[bad, kind]` under 'answers the default and a %s problem for %j' print "answers the default and a 5 problem for "text""; the `[]` row prints "a  problem". Titles only.

## 2. Proof

- 2.1. schedule.test.ts, sixth test "once, at 03:30" asserts the run's `due`, not when the start happens. The watcher probe printed "start called at 2026-03-29 03:00:00 GMT+02:00 for due 03:30" (for "59 2": 03:00 for due 03:59); spring2.mjs printed that the look answers the 03:30 due time from 01:59:59 +0100. The report's judgment call 3 presents the look as the fix for the spring day. C17 partial.
- 2.2. schedule.test.ts:3-4: "The clock is set to the day before the real one, so a lock file's real modification time is never older than the fake `now`." Row 2 of the catch-up test sets `local(3, 9)`, two days after the real day; the rerun prints three "took over ... schedule.json.lock, which was 137273536 ms old" lines, so in that row a concurrent change takes over a live lock (record.ts:127 compares the fake `Date.now()` with the real mtime). The comment is false and the row needs a clock before the real one.
- 2.3. The report omits: the verify item 6 grep of changed names; the history-word grep spec.md requires; the croner chunk sizes "Libraries checked" requires; the verify item 8 reading of list items and sentence length. Its item 7 grep (report line 309) covers only `spawn|execFile|exec(` and leaves out tmux and claude, and the probes.
- 2.4. UpdateTray.svelte has no kept test; no guarded.md entry calls for one. The layout is look cases 1 and 2.

## 3. Standards

- 3.1. Hard-wrap defects in edited head comments (spec.md: an edited comment is rewrapped at 100 columns with no short line inside a sentence): src/lib/server/root/watch/pollers.ts:3 ("// changed key of local.yml" alone); src/lib/data/sources/config/settings.ts:5 ("// pattern of each update task. Each reads"); tests/data/sources/config/settings.test.ts:5 ("// patterns). Each reader is run over a").

## 4. Behaviour

- 4.1. src/lib/server/machine/tasks/schedule.ts:82: `return job.previousRuns(1, new Date(Math.floor(now.getTime() / 1000) * 1000 + 1000))[0];`, used by `consider` every 30 s. Under TZ=Europe/Brussels on 2026-03-29, croner's `previousRuns` answers the skipped-hour due time (moved to 03:30 +0200) from 01:59:59 +0100 onwards. `consider` checks only `due > seen`, never `due <= now`, so the first look after 02:00 +0100 (03:00 +0200) starts the run: "30 2 * * *" at 03:00 for due 03:30, "59 2 * * *" at 03:00 for due 03:59, with the record's `at` (01:00Z) before its `due` (01:30Z). On an ordinary day the look is exact. DESIGN.md:139 says "a daily 02:30 starts at 03:30 on that day", and the tray's Next line shows 03:30. Failure: every task with a pattern in the 02:00 hour starts up to 59 minutes early once a year. Fix: `consider` starts only a due time not later than now; a test asserting the time of the `new-session` call fails without it. Item 5 violated, C17 partial.

## Declined to judge

- That a scheduled run ends an idle terminal the reader started by hand: ruled Z545 (b).
- Look cases 1 to 11 and the tray's layout: the orchestrator's at landing.
- Look case 10 / C36 with the real `claude`: the stub run was reproduced; the real one is the look's.
- test:quick at 55.5 s against the 45 s limit: one run does not settle whether the step or machine load causes it.
- A host with no tmux: not run.

Usage from the completion notice: a8202593373720c47, claude-opus-5-5, 146,318 tokens, 117 tool uses, 28.9 min.

## Repair round 1, refuted

Reviewer aa2f8d687b0b0cfac, claude-opus-5-5, ordo-high: 337,571 tokens, 85 tool uses, 19.3 min (completion notice). Reruns from the worktree's `tools/oculus`, base `6044d753c`; the report read is byte-identical to the worktree copy.

### Verification

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm run test:quick
test:quick: 61 changed file(s), from git since HEAD
test:quick: 81 test file(s), 10 essential
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (2.4 s)
ok      svelte-check (13.1 s): 1791225076930 COMPLETED 372 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (27.6 s): Duration  24.02s (transform 34.48s, setup 0ms, import 61.46s, tests 28.33s, environment 147ms)
test:quick: 28.2 s (limit 45.0 s); every command passed
checks: 1 commands passed
$ npx vitest run <schedule, record, settings, value-rule, config, terminal-actions>: Test Files 6 passed (6) | Tests 105 passed (105)
$ npx vitest run tests/checks --testTimeout 120000 --reporter=dot: Test Files 16 passed (16) | Tests 229 passed (229)
$ npx vitest run tests/server/machine/tasks/schedule.test.ts --reporter=verbose: 6 passed; no stderr line; sixth test 1217 ms (alone 2728 ms, then 1959 ms)
ASCII gate over src tests config: nothing printed; HELP.md, DESIGN.md, A3-report.md: 0 non-ASCII lines
sh utils/unused-exports.sh | wc -l: 379, diff against the base empty
greps of TASKS|isTask|TaskKind|taskCommand|processesText: 24 lines, as the report; the risk sentence 1 in HELP.md and options.yml; "so a scheduled task then" 0
builder probes s1, s2, s5: 3 files, 20 tests passed; s3 (C17 autumn) and s4 (C36) and c1.mts and the tray probe as quoted
reviewer probes (real modules, nothing copied or edited):
TZ=Europe/Brussels node prev.mjs: "* 2 * * *" at 01:00:30Z: 59 of 61 due times later than now; previousRuns(2): 01:59Z, 01:58Z
TZ=Europe/Brussels node prev3.mjs: 0 0 29 2 *, 0 7 29 2 *, 0 0 30 1-2 *: previousRuns THROWS
TZ=Europe/Brussels node leap.mjs (real watchSchedules, litwatch "0 0 29 2 *"): process exit code 1, TypeError: Cannot read properties of undefined (reading '0') at E.previousRuns at dueAt (schedule.ts:89:16) at apply (schedule.ts:332:24)
race.probe.ts ("* * * * *", no sessions payload until 07:02:10): record 05:02Z skipped and 05:01Z skipped, terminal null; after the payload starts []
npx vitest run tests/routes/git/deposit.test.ts -t zzzz-no-such-case: oculus-fixture-schedule-* folders in the temp folder before 0, after 1
```

### Verdicts

Rulings of the round: 1 to 9 and 11 closed; 10 closed except the probe half of its item 7 (Proof 2.2). Ruling 1: `dueAt` (schedule.ts:87-90) passes over every due time later than now with `LOOKBACK = 61`, which `prev.mjs` shows is needed (croner gives 59 of 61 due times later than now for `* 2 * * *` at 01:00:30Z); the test is titled 'starts each run of a pattern inside the hour the clocks skip once, when it is due and not before', the title to name under G46. Ruling 7 closed with the fix reaching beyond the finding (Standards 3.2).

Items of A3.md over the whole diff: 1, 2, 3, 4, 6, 7, 8 hold; 5 violated (Behaviour 4.1 and 4.2), the spring early start fixed; 9 not applicable (the look at landing).

Cases: C1 to C4 met; C5 partial (Behaviour 4.1); C6 to C29, C31 to C36 met as the probes and tests above show; C30 met for one due time, two due times before the payload is Behaviour 4.2.

### Findings

#### 1. Spec

None.

#### 2. Proof

- 2.1. A3-report.md, ruling 1: the failing run is quoted under a title that is neither the first run's nor the final one, so no failure is quoted for the test in its final form. By reading, its first row `expect(times, pattern).toEqual([])` fails on the first run's `previousRuns(1, ask)[0]`, which answers 01:30Z at 01:00Z.
- 2.2. A3-report.md, ruling 10 item 7: the grep `spawn|execFile|exec(|tmux|claude` is quoted over the tests only. `probes/first-run-route.mts` also starts tmux (on the stub socket), besides s4.probe.ts and c1.mts; no real `claude` is reached.
- 2.3. A3-refuter.md, the first run's verdicts of item 2 and C24 cite mutation runs, which are breakage runs under Axel's standing rule and are not used. Those verdicts stand on reading and on the G46 and G13 runs. The builder's report quotes no such run.

#### 3. Standards

- 3.1. tests/server/machine/tasks/schedule.test.ts:328, the sixth test takes 1.2 to 2.7 s and is not tagged slow (agents/spec.md: a test runs well under a second, or is tagged slow). It steps the fake clock 60 s at a time over about 4 h for three patterns.
- 3.2. tests/server/root/context-fixture.ts:93-95, `scratchDir('oculus-fixture-schedule-')` runs when `contextFixture` is called, which three modules do while they load (terminal-fixture.ts:19, deposit.test.ts:18, git.test.ts:25), against tests/fixtures/scratch.ts:9-10; a fully skipped run of those files leaves one folder in the temp folder. The fix also reaches git.test.ts and hpc.test.ts, outside the write list.
- 3.3. DESIGN.md:139: "Croner skips a due time inside the hour the clocks skip, so a daily 02:30 starts at 03:30" credits croner with the 03:30 start, which the half-minute look gives (schedule.ts:12-15, :293-299). A maintainer could remove the half-minute check.
- 3.4. A3-report.md opening: two read-only git commands ran, against agents/spec.md "Where you work"; disclosed, nothing written.

#### 4. Behaviour

- 4.1. schedule.ts:87-90, `job.previousRuns(LOOKBACK, ask)`, called uncaught from `apply` (:332, inside `void apply(...)` at :365 and :372) and from `consider` (:303). Croner 10.0.1 throws for `0 0 29 2 *`, `0 7 29 2 *` and `0 0 30 1-2 *`, which the value rule accepts (C5 names `0 0 29 2 *` a job). With that pattern the server process exits with code 1, and again at every start until behavior.yml is edited by hand. Present since the first run. Item 5 violated, C5 partial.
- 4.2. schedule.ts:228-239 with :242 and :252-268: a due time arriving while `deciding` holds the task is claimed at once as `skipped`, moving `handled` past the waiting decision's due time; once the `sessions` payload arrives that decision's `claimDue` answers `handled` and nothing starts. The server started at 06:59:50 with yesterday's 07:00 missed and a first sessions payload later than 10 s: today's 07:00 is recorded skipped, the catch-up dropped, nothing runs that day. Item 5 violated.

### Declined to judge

- The croner chunk sizes (+29,838 raw, +8,545 gzip): not rebuilt; needs a second build of a base copy.
- The report's line counts of schedule.ts and schedule.test.ts (380 and 370 against 387 and 379): no decision rests on them.
- Look cases 1 to 11 and `npm run test:landing`: the orchestrator's at landing.
- Whether the half-minute look starts a spring-day run up to 30 s after its due time on a live server: not run.
- Probe side effects, outside the repository: one empty `oculus-fixture-schedule-*` folder and `a3race-*` in the temp folder, `scratchpad/probe/rec29`.
