# Diagnosis: A3 Proof 3, one red run of verify item 2 in 46

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: acb1bb1231865e0e6, claude-opus-5-5, 206,946 tokens, 91 tool uses, 96.4 min

## Symptom

From `tools/oculus/.scratch/migration/agents/reviews/A3-refuter.md`, section "2. Proof", item 3:

> Verify item 2, the step's seven paths. What is wrong: one of my 46 runs printed `Tests  1 failed | 86 passed (87)`. My command kept only the summary line, so the failing test is not known. The 45 later runs passed, including 15 sequential runs that kept the full output and 9 runs three at a time. The O30 builder was running in another worktree at the time. Failure scenario: an intermittent red in watch.test.ts or another of the seven at landing, with no known cause.

## Where the probes run

A scratch copy at `$TMPDIR/diagnose.M9CEDn/tree` (TMPDIR `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/`), made by `git worktree add --detach "$tmp/tree" 995e6dfad` from the main checkout, with `git diff --binary 995e6dfad` from the step's worktree applied by `git apply --allow-empty` (exit 0; four whitespace warnings), and the 19 files `git status --porcelain --untracked-files=all` lists with `??` copied to the same paths. `node_modules` and `.svelte-kit` are `cp -c` clones of the step worktree's (the step's `tools/oculus` has no other ignored file: `git status --ignored --porcelain .` lists only those two). `diff -rq --exclude=node_modules --exclude=.svelte-kit --exclude=local.yml` between the step's `tools/oculus` and the copy's printed nothing. For probe 2 a second detached worktree at 995e6dfad with nothing applied (`$tmp/base`), same `node_modules` clone. The paths redirected under `$TMPDIR`: HOME (`$tmp/home`) and TMUX_TMPDIR (`$tmp/tmux`) for every test run; ORDO_STABLE and ORDO_SKILL_DIRS not needed (no skill or pinned checkout is touched).

Taken before the copy was made, from inside `.agents/worktrees/A3`:

```
$ git status --short
 M tools/oculus/.scratch/migration/agents/reviews/A3-report.md
MM tools/oculus/DESIGN.md
MM tools/oculus/HELP.md
 M tools/oculus/README.md
MM tools/oculus/config/behavior.yml
MM tools/oculus/config/catalogs/options.yml
MM tools/oculus/config/text/app.yml
MM tools/oculus/config/text/findings.yml
MM tools/oculus/config/text/server.yml
MM tools/oculus/config/text/views/system/workbench.yml
MM tools/oculus/docs/diagrams/channels.dot
MM tools/oculus/docs/diagrams/channels.svg
MM tools/oculus/docs/diagrams/layer-data.dot
MM tools/oculus/docs/diagrams/layer-data.svg
MM tools/oculus/docs/diagrams/layer-server.dot
MM tools/oculus/docs/diagrams/layer-server.svg
MM tools/oculus/docs/diagrams/layer-shell.dot
MM tools/oculus/docs/diagrams/layer-shell.svg
MM tools/oculus/docs/diagrams/layer-state.dot
MM tools/oculus/docs/diagrams/layer-state.svg
MM tools/oculus/docs/diagrams/layers.dot
MM tools/oculus/docs/diagrams/layers.svg
M  tools/oculus/package-lock.json
M  tools/oculus/package.json
MM tools/oculus/src/lib/data/helpers/run/tasks.ts
MM tools/oculus/src/lib/data/model/index.ts
MM tools/oculus/src/lib/data/model/model-processes.ts
MM tools/oculus/src/lib/data/sources/config/catalog/options.ts
MM tools/oculus/src/lib/data/sources/config/catalog/value-rule.ts
MM tools/oculus/src/lib/data/sources/config/catalog/value-words.ts
 M tools/oculus/src/lib/data/sources/config/catalogs.ts
 M tools/oculus/src/lib/data/sources/config/local.ts
MM tools/oculus/src/lib/data/sources/config/settings.ts
MM tools/oculus/src/lib/server/edit/writes/config/config-fit.ts
 M tools/oculus/src/lib/server/machine/commands/list.ts
 M tools/oculus/src/lib/server/machine/commands/run.ts
 M tools/oculus/src/lib/server/machine/commands/saved.ts
 M tools/oculus/src/lib/server/machine/pty/compose.ts
MM tools/oculus/src/lib/server/machine/pty/routes.ts
 M tools/oculus/src/lib/server/machine/seeds/task-seed.ts
 M tools/oculus/src/lib/server/machine/seeds/task-start.ts
AD tools/oculus/src/lib/server/machine/tasks/record.ts
AD tools/oculus/src/lib/server/machine/tasks/schedule.ts
AD tools/oculus/src/lib/server/machine/tasks/start.ts
MM tools/oculus/src/lib/server/root/context.ts
MM tools/oculus/src/lib/server/root/live-settings.ts
 M tools/oculus/src/lib/server/root/watch/local.ts
MM tools/oculus/src/lib/server/root/watch/pollers.ts
MM tools/oculus/src/lib/shell/rail/UpdateTray.svelte
MM tools/oculus/src/lib/state/client/context.ts
MM tools/oculus/src/lib/state/client/entities.svelte.ts
MM tools/oculus/src/lib/state/client/payloads.ts
MM tools/oculus/src/lib/state/sessions/terminals.svelte.ts
M  tools/oculus/src/lib/state/shared/stores/shapes.ts
 M tools/oculus/src/lib/state/shared/words/format.ts
MM tools/oculus/src/lib/state/system/config/editors/fields.ts
MM tools/oculus/src/lib/state/system/config/messages.ts
AM tools/oculus/src/lib/state/system/machine/schedule.svelte.ts
 M tools/oculus/src/lib/ui/controls/Confirm.svelte
 M tools/oculus/src/lib/views/shared/sessions/CommandBar.svelte
 M tools/oculus/src/lib/views/shared/sessions/commands.ts
M  tools/oculus/src/routes/+page.svelte
MM tools/oculus/src/routes/api/(sessions)/terminal/+server.ts
 M tools/oculus/tests/checks/config/config-folder.test.ts
MM tools/oculus/tests/checks/config/config.test.ts
MM tools/oculus/tests/checks/tree/boundaries.test.ts
 M tools/oculus/tests/data/sources/config/local.test.ts
MM tools/oculus/tests/data/sources/config/wrong-settings.ts
MM tools/oculus/tests/routes/sessions/terminal-actions.test.ts
MM tools/oculus/tests/routes/sessions/terminal-fixture.ts
AD tools/oculus/tests/server/machine/tasks/record.test.ts
AD tools/oculus/tests/server/machine/tasks/schedule.test.ts
MM tools/oculus/tests/server/root/context-fixture.ts
?? tools/oculus/src/lib/data/helpers/run/cron.ts
?? tools/oculus/src/lib/data/helpers/run/schedules.ts
?? tools/oculus/src/lib/server/machine/schedules/
?? tools/oculus/src/lib/shell/rail/ScheduleDialog.svelte
?? tools/oculus/src/lib/shell/rail/ScheduleList.svelte
?? tools/oculus/src/lib/state/system/machine/schedule-when.ts
?? tools/oculus/src/lib/state/system/machine/schedule-words.ts
?? tools/oculus/src/routes/api/(machine)/schedules/
?? tools/oculus/tests/routes/machine/schedules.test.ts
?? tools/oculus/tests/server/machine/schedules/
$ git diff --binary 995e6dfad | shasum
8fa1673a6c70f3ae43952669eddca5d416afcd01  -
```

Run again at the end of the diagnosis from the same worktree: `git diff --binary 995e6dfad | shasum` printed `8fa1673a6c70f3ae43952669eddca5d416afcd01  -` and `git status --short | wc -l` printed 83, the same 83 lines. The step's worktree was not changed.

## Red command

The refuter's command, run with the full verbose output kept per run, four loops of it at once (a scratch script, `red.sh`, removed at cleanup):

```
# red.sh <parallel> <runs-per-loop> <logdir> <paths>: <parallel> loops at once, each running
#   ./node_modules/.bin/vitest run --reporter=verbose <paths> > <logdir>/l<k>-r<i>.log 2>&1
# from the copy's tools/oculus with HOME and TMUX_TMPDIR under $TMPDIR; it counts the runs whose
# log holds "FAIL .*boundaries.test.ts > layer boundaries > holds across src/lib".
sh red.sh 4 5 <logdir> tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/config/local.test.ts
```

The first loop that kept the full output (four loops of 15 runs at once) named the failing test. Its output, from `run-4.log` of the first loop (vitest's cross mark written as `[x]`, its rule characters left out):

```
 [x] |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib 5484ms
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 > tests/checks/tree/boundaries.test.ts:470:5
    469| describe('layer boundaries', () => {
    470|     it('holds across src/lib', () => {
    471|         expect(findViolations(LIB)).toEqual([]);
    472|     });
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 86 passed (87)
   Duration  13.32s (transform 6.07s, setup 0ms, import 35.16s, tests 12.21s, environment 3ms)
```

The summary line is the refuter's line exactly. In that loop 14 of 60 runs failed, every one on this test and this error, none on another test.

Three runs of the red command in a row:

```
== red run 1
runs=20 failed=16 red(boundaries src/lib failed)=16 timed-out=16
src/lib test ms: n=20 min=3913 median=5795 max=10068 mean=6476
  16  FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
== red run 2
runs=20 failed=12 red(boundaries src/lib failed)=12 timed-out=12
src/lib test ms: n=20 min=3668 median=5321 max=14675 mean=6923
  12  FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
== red run 3
runs=20 failed=12 red(boundaries src/lib failed)=12 timed-out=12
src/lib test ms: n=20 min=3656 median=5140 max=7076 mean=5115
  12  FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
```

Failure rate: 40 of 60 runs four at a time (load average 20 to 23 during the runs, other worktrees' agents running too), and 14 of 60 in the earlier four-at-once loop. Run one at a time, 0 of 30 failed (`sh loop.sh 30`, load average about 8), with the test at min 1480, median 1620, max 2955 ms. Every failed run in every log is the same test with `Test timed out in 5000ms`; no other test of the seven failed in any run.

Runs after the tightening (the shrunk case below, `red2.sh`: the one test alone, `-t 'holds across src/lib'`, run in sequence beside a number of `awk 'BEGIN { while (1) {} }'` busy loops it starts and kills):

```
sh red2.sh 12 4   load=12 runs=4 failed=4 timed-out=4
                  src/lib test ms: n=4 min=12847 median=16179 max=21554 mean=16307
                  4  FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
sh red2.sh 0 5    load=0 runs=5 failed=0 timed-out=0
                  src/lib test ms: n=5 min=1363 median=1558 max=2202 mean=1662
sh red2.sh 8 6    load=8 runs=6 failed=0 timed-out=0
                  src/lib test ms: n=6 min=2040 median=2641 max=2897 mean=2458
```

The run takes about 75 s a run under 12 loops; it cannot be made to run in seconds, since the symptom is the load.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The five files of `tests/server/machine/schedules` (four loops of 5) | green: `runs=20 failed=0`, test min 2088, median 3183, max 4155 ms | put back: their work is part of the load; see the next rows |
| Only `watch.test.ts` | red: `runs=20 failed=2 ... timed-out=2`, median 3126, max 6083 ms | cut: watch.test.ts is not needed |
| All six other paths and the four parallel loops, replaced by CPU load from busy loops; the ten other tests of `boundaries.test.ts` left out with `-t` | red: 12 loops `failed=4` of 4 (12847 to 21554 ms); 20 loops, the two runs started under load `41143ms` and `56517ms`, both timed out | cut: none of the six other paths is needed, only load |
| The load (the same single test with no busy loops) | green: `load=0 runs=5 failed=0` (1363 to 2202 ms); the four runs of the 20-loop script after its loops were stopped passed at 1527 to 1613 ms; 0 of 30 sequential runs of the seven paths | put back: the load is needed |

The shrunk case, as it stands: the one test `layer boundaries > holds across src/lib` of `tests/checks/tree/boundaries.test.ts`, run by a direct `vitest run` (so vitest's default 5000 ms per-test limit applies), with the machine's cores oversubscribed (12 busy loops on 11 cores, or the four parallel suites beside the other worktrees' agents). Eight busy loops do not make it red (2040 to 2897 ms); twelve make every run red.

## Hypotheses

1. If the red is vitest's default 5000 ms per-test limit, which verify item 2's direct `npx vitest run` applies to the tree check, while the project runs tree checks only through `npm run test:checks` with `--testTimeout 0 --hookTimeout 0` (`package.json:13`; `vite.config.ts:30-36` says tree checks run "with no time limit"; `agents/spec.md:56` names `npm run test:checks` as how they run), then the same red command with no per-test limit turns it green while the test still takes over 5 s. Falsified by: a failure with no limit (the assertion naming a violation, or any other error), or no run above 5000 ms.
2. If the step's diff made the scan slower (the scan covers 998 files under `src/lib` on the step's tree against 985 on the base, by `find src/lib -type f \( -name '*.ts' -o -name '*.svelte' \) | wc -l`, and the step changes the allow lists), then the base tree runs the test markedly faster and does not go red under the same load. Falsified by: base times within the step's spread, and the base red under the same load.
3. If the time the test gains under load goes to the CPU-bound parse of each module (`runtimeImports`, through `utils/diagrams/imports.mjs` `importsOf()`), then tagged timing inside `findViolations` shows the parse time growing with the load. Falsified by: the parse time about the same under load while the file reads carry the growth.

Not in the list, since the shrink falsified it: another of the seven files (watch.test.ts's timers, or run.test.ts) holding the CPU while boundaries runs. The red holds without watch.test.ts and with the test alone beside busy loops. Fewer than four causes are left after the shrink; the code read (a synchronous scan with one `expect` over its result) leaves no other cause than the time against the limit.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | Command change only: `--testTimeout 0` passed to the shrunk red command (`sh red2.sh 12 4 <dir> --testTimeout 0`) | `load=12 runs=4 failed=0 timed-out=0`; `src/lib test ms: n=4 min=10163 median=21648 max=36218 mean=19848`; each log `Tests  1 passed \| 10 skipped (11)` | still standing: every run above 5000 ms (10 to 36 s), and the assertion holds in all four |
| 2 | A measurement, no change: the test alone on the base tree and on the step's tree, alternated, 10 pairs, no added load (`ab.sh 10`); then the shrunk red on the base tree (`red2-base.sh 12 3`) | `base: 4129 1529 1584 1525 1589 1538 1540 1519 1574 1555` (median 1555, sd 773); `tree: 1609 1600 1540 1539 1636 1846 1526 1612 1677 1630` (median 1612, sd 87). Base under 12 loops: `load=12 runs=3 failed=3 timed-out=3`, `min=12834 median=13875 max=15279` | falsified: the step adds about 57 ms (3.7 percent) at the median, inside the base's spread, and the base goes red under the same load. The red predates the step |
| 3 | Tagged timing in `tests/checks/tree/boundaries.test.ts` `findViolations` (copy only), every added or changed line ending `// DIAG-3a7f`: `const diagStart = performance.now();`, `let diagRead = 0;`, `let diagParse = 0;`, `const diagFiles = sourceFiles(libRoot);`, `const diagList = performance.now() - diagStart;`, the loop over `diagFiles`; around `readFileSync(...)` `const diagR = performance.now();` and `diagRead += performance.now() - diagR;`; `const diagP = performance.now(); const diagImports = runtimeImports(fileRel, text, '', true); diagParse += performance.now() - diagP;`, the inner loop over `diagImports`; before `return violations.sort();` a `console.log` of `DIAG-3a7f files= list= read= parse= total=` | Quiet (`red2.sh 0 2`): `DIAG-3a7f files=998 list=48ms read=283ms parse=1141ms total=1475ms` and `files=998 list=55ms read=250ms parse=1201ms total=1509ms`, both passed. Under 12 loops (`red2.sh 12 2`): `DIAG-3a7f files=998 list=2045ms read=15888ms parse=1405ms total=19341ms` and `files=998 list=792ms read=8823ms parse=1318ms total=10936ms`, both timed out | falsified: the parse grows from about 1.2 s to 1.3 to 1.4 s, while the 998 `readFileSync` calls grow from 0.25 to 0.28 s to 8.8 to 15.9 s and the directory walk from 50 ms to 0.8 to 2.0 s. The time under load is file-system calls, not the parse |
| 1 | The change hypothesis 1 names, in the config instead of the command: a `checks` project in `vite.config.ts` with `testTimeout: 0` and `hookTimeout: 0` for `tests/checks/**/*.test.ts`, and `'!tests/checks/**'` in the `unit` project's include (the diff under "Fix and test") | The shrunk red with no flag, `sh red2.sh 12 4`: `load=12 runs=4 failed=0 timed-out=0`, `min=12047 median=22408 max=51674`; each log `[ok] \|checks\| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib` and `Tests  1 passed \| 10 skipped (11)` | still standing |

Each probe was undone after its run: probe 3 by copying back the saved original (`diff` against the step worktree's `boundaries.test.ts` printed nothing), probe 4 by copying back the saved `vite.config.ts` (`diff -q` against the step's printed nothing).

What slows the file reads under load was not probed. `systemextensionsctl list` shows `com.microsoft.wdav.epsext ... Microsoft Defender Endpoint Security Extension [activated enabled]`, and an endpoint-security client that authorizes each file open would stall the opens when the cores are taken. That explains why the reads, and not the parse, slow down, and why the slowdown grows much faster than the load (8 loops: 2.6 s at the median; 12 loops: 16 s). It is not verified, and the fix does not depend on it.

## Cause

Hypothesis 1. Verify item 2 of `agents/briefs/A3.md:665` runs two tree checks, `tests/checks/config/config.test.ts` and `tests/checks/tree/boundaries.test.ts`, through a direct `npx vitest run`. That puts them under vitest's default 5000 ms per-test limit. The project runs tree checks only through `npm run test:checks`, which passes `--testTimeout 0 --hookTimeout 0` (`package.json:13`), and `vite.config.ts:30-36` says they run "with no time limit". The limit lives only in the npm script's flags, so any other way of starting a tree check gets the unit default. `layer boundaries > holds across src/lib` reads and parses 998 modules: 1.4 to 3.0 s on the machine as it usually is. When the cores are oversubscribed, its 998 file reads slow from about 0.25 s to 9 to 16 s (probe 3), the test passes 5 s, and vitest fails it with `Test timed out in 5000ms`, although its assertion holds.

The probe that shows it: the shrunk red with the default limit is red 4 of 4 (12847 to 21554 ms). With no per-test limit it is green 4 of 4 by the command flag (probe 1, 10163 to 36218 ms) and 4 of 4 by the config change (probe 4, 12047 to 51674 ms).

Facts that change the refuter's failure scenario:
- The red is not the step's. The base tree goes red the same way (probe 2, 3 of 3 under 12 loops). The step adds about 57 ms at the median.
- It cannot happen at landing. `tests/tiers/landing.mjs:20` runs the tree checks as `npm run test:checks`, which has no time limit. `npm test` excludes `tests/checks/**` (`package.json:12`), and `tests/tiers/quick.mjs:124` leaves tree checks out. Only direct `vitest run` commands on a tree check, such as verify item 2 and a reviewer's rerun of it, can go red this way.
- The same shape recurs. `grep -ln "npx vitest run[^\`]*tests/checks" agents/briefs/*.md | wc -l` printed 30 (of 424 briefs).
- watch.test.ts and the step's other tests never failed in any of the runs, about 250 in total.

## Fix and test

Test, run on the tree without the fix: none is written. The failure costs nothing in the rule's sense: it is a timeout reported in a verification run, with no lost work, no broken installation and no wrong configuration accepted. A vitest config is not a script. The shrunk red command above, red 4 of 4 without the fix, is the check.

Fix, on the scratch copy only (`tools/oculus/vite.config.ts`):

```
@@ -43,22 +43,39 @@
         // machine's own sessions, and a suite that takes every core makes the timed cases of the
         // others miss their limits under the load.
         maxWorkers: 4,
-        // Two projects, each with its own files, so neither list is merged into the other's. A file
+        // Three projects, each with its own files, so no list is merged into another's. A file
         // named *.client.test.ts runs in Svelte's client runtime, where effects and their teardowns
         // run (tests/ui/frame/client-runtime.ts), with Svelte inlined so it is resolved with the
-        // browser's conditions rather than loaded as Node loads its server build. Every other file
-        // runs in node against the server build, which renders a component to a string.
+        // browser's conditions rather than loaded as Node loads its server build. A tree check under
+        // tests/checks runs in node with no time limit, however it is started (npm run test:checks
+        // or vitest run on one of its files), since it reads the whole tree and a file read waits
+        // on the machine's load. Every other file runs in node against the server build, which
+        // renders a component to a string.
         projects: [
             {
                 extends: true,
                 test: {
                     name: 'unit',
                     environment: 'node',
-                    include: ['tests/**/*.test.ts', '!tests/**/*.client.test.ts']
+                    include: [
+                        'tests/**/*.test.ts',
+                        '!tests/**/*.client.test.ts',
+                        '!tests/checks/**'
+                    ]
                 }
             },
             {
                 extends: true,
+                test: {
+                    name: 'checks',
+                    environment: 'node',
+                    include: ['tests/checks/**/*.test.ts'],
+                    testTimeout: 0,
+                    hookTimeout: 0
+                }
+            },
+            {
+                extends: true,
                 resolve: { conditions: ['browser'] },
                 test: {
                     name: 'client',
```

The unit tests keep their 5000 ms limit; only the files under `tests/checks` lose it, as `package.json:13` already removes it for them. `package.json:13`'s two flags become redundant with the fix and are left as they are.

The fix in the brief's text, the other place the cause can be ended, for verify item 2 only. Before (`agents/briefs/A3.md:665`): "`npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/config/local.test.ts` passes." After: "`npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/data/sources/config/local.test.ts` and `npx vitest run --testTimeout 0 --hookTimeout 0 tests/checks/config/config.test.ts tests/checks/tree/boundaries.test.ts` pass."

Recommendation: the config fix. It ends the cause for every direct run of a tree check, including the 30 briefs that run one. The brief-text fix ends it for this one command, and the next brief that names a tree check in a direct run goes red the same way. The lazy option is to rerun item 2 until it is green, or to edit only this brief. The config fix touches `vite.config.ts`, which is outside A3's paths. `agents/spec.md:74` forbids changing a timeout or configuration because of a timeout only in a file the step does not change, and A3 changes `boundaries.test.ts` (`MM` in `git status --short`), so that rule does not decide this case. Whether `vite.config.ts` enters A3's round or goes in as a fix at landing is the orchestrator's call.

Runs after the fix (scratch copy, fix applied, HOME and TMUX_TMPDIR under `$TMPDIR`):

```
$ prettier --check vite.config.ts
All matched files use Prettier code style!
$ eslint vite.config.ts
  0:0  warning  File ignored because of a matching ignore pattern.   (0 errors)
$ LC_ALL=C grep -n '[^ -~]' vite.config.ts
(no output, exit 1)

The red command (four loops of 5, the seven paths, no flag):
runs=20 failed=0 red(boundaries src/lib failed)=0 timed-out=0
src/lib test ms: n=20 min=3740 median=4515 max=5388 mean=4549
  20       Tests  87 passed (87)
  20 |checks|           (the test now runs in the checks project)

The red command beside six busy loops (four loops of 3), so most runs pass 5 s:
runs=12 failed=0 red(boundaries src/lib failed)=0 timed-out=0
src/lib test ms: n=12 min=4969 median=7974 max=9661 mean=7931
  12       Tests  87 passed (87)
  per run: 9661ms 7579ms 7586ms 7967ms 7974ms 9659ms 7587ms 9635ms 8734ms 5598ms 4969ms 8223ms

The shrunk red (12 busy loops, 2 runs):
load=12 runs=2 failed=0 timed-out=0
 [ok] |checks| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib 11880ms
 [ok] |checks| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib 27062ms

The original, unshrunk case (the refuter's command, once):
$ npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/config/local.test.ts
 Test Files  10 passed (10)
      Tests  87 passed (87)

$ npm run test:checks
exit 0
 Test Files  15 passed | 1 skipped (16)
      Tests  226 passed | 4 skipped (230)
$ vitest list --filesOnly tests/checks    16 [checks]
$ vitest list --filesOnly --exclude 'tests/checks/**'    104 [unit], 4 [client]
$ find tests -name '*.test.ts' -not -path 'tests/checks/*' | wc -l    108
```

The refuter's `test:checks` run on the step's tree printed `227 passed | 3 skipped`. The fourth skip here is `config-folder.test.ts`'s "reads the roots of sources.yml without a finding". It is skipped by `it.skipIf(MISSING.length > 0)` (`tests/checks/config/config-folder.test.ts:314-321`) because the two roots of sources.yml "sit under the home directory of whoever runs this" (`:310-312`), and the scratch HOME has neither. The fix does not cause it. `npm test`'s selection is unchanged: 104 unit and 4 client files, the 108 test files outside `tests/checks` that `find` lists.

No test reaches it: not applicable. No test is written: the failure costs nothing.

## Cleanup

```
$ grep -rn --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.svelte-kit "DIAG-3a7f" $tmp/tree $tmp/base
(no output, exit 1)
$ git worktree remove --force "$tmp/tree" && git worktree remove --force "$tmp/base"   (from the main checkout)
$ rm -rf "$tmp"; ls -d $tmp
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.M9CEDn: No such file or directory
$ ps -axo comm,args | awk '$1=="awk" && /while \(1\)/' | wc -l
0
```

The `DIAG-` hits a wider grep finds in the copy are earlier diagnosis records under `.scratch/migration/agents/reviews/` (D20, X3e, X3f, Q109), not this diagnosis's tag. The scratch scripts (`loop.sh`, `red.sh`, `red2.sh`, `red2-base.sh`, `ab.sh`) and their logs were removed from the scratchpad. `git worktree list | grep -i diagnose` still lists `/private/var/folders/.../diagnose.yilYbS/tree` at b5299f4e5. That worktree belongs to another diagnosis, at O30's base, and was left alone. No credential or `.env` file was copied. `tools/oculus/config/local.yml` was never opened, printed, grepped, hashed or copied: the step's worktree has none, and every grep over config carried `--exclude=local.yml`. Two loads were heavier than needed and slowed the machine for a few minutes each: 22 `yes` processes for about 10 minutes, and 20 awk loops for about 10 minutes. Both were stopped with `pkill -P <script pid>`, and none is left.

Red command run again on the original case: carried by the round as its check.
