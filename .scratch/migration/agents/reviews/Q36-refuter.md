# Q36 refutation

The worktree is untouched. Everything the report claims about the checks reproduces. Two defects in the delivered file (one comment carrying history, one head-comment sentence the measurements contradict), one wrong number in the report, and one material fact neither the comment nor the report states: the bound's blind spot is not a constant, it scales with the machine's measured slack, and at load 48 to 91 it accepted a 1.1x escalation regression in 3 runs of 5.

## Verification lines, verbatim

Worktree untouched, from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q36/tools/oculus`, identical at the start and at the end of this review:

```
=== git status --short ===
 M tests/server/hpc/ssh.test.ts
=== git diff --stat 49e052b9 ===
 tools/oculus/tests/server/hpc/ssh.test.ts | 249 +++++++++++++++++++++++++++---
 1 file changed, 226 insertions(+), 23 deletions(-)
=== ssh.ts still byte-unchanged ===  (git diff 49e052b9 -- src/lib/server/hpc/ssh.ts | wc -l)
       0
```

`npx vitest run tests/server/hpc/ssh.test.ts --reporter=dot`, ten runs, `uptime` before and after:

```
UPTIME BEFORE: 13:08  up 59 days, 14:07, 1 user, load averages: 19.57 21.39 23.11
run 1:       Tests  9 passed (9) |    Duration  6.44s | load averages: 19.23 21.26 23.04
run 2:       Tests  9 passed (9) |    Duration  5.61s | load averages: 19.79 21.30 23.04
run 3:       Tests  9 passed (9) |    Duration  5.77s | load averages: 19.17 21.15 22.97
run 4:       Tests  9 passed (9) |    Duration  5.41s | load averages: 18.72 20.99 22.90
run 5:       Tests  9 passed (9) |    Duration  5.76s | load averages: 18.18 20.84 22.83
run 6:       Tests  9 passed (9) |    Duration  5.55s | load averages: 17.16 20.53 22.70
run 7:       Tests  9 passed (9) |    Duration  5.31s | load averages: 16.42 20.32 22.61
run 8:       Tests  9 passed (9) |    Duration  5.68s | load averages: 15.84 20.07 22.49
run 9:       Tests  9 passed (9) |    Duration  5.74s | load averages: 15.21 19.87 22.41
run 10:      Tests  9 passed (9) |    Duration  5.33s | load averages: 14.17 19.49 22.25
UPTIME AFTER: 13:09  up 59 days, 14:08, 1 user, load averages: 14.17 19.49 22.25
```

Five more of my own, with 16 busy loops I started in `/private/tmp/.../scratchpad/q36-review` (pids in `load.pids`) and killed from that file (`load processes still alive: 0`, rechecked at the end):

```
UPTIME BEFORE (my load on): 13:27  up 59 days, 14:25, 1 user, load averages: 64.93 61.04 43.04
run 1:       Tests  9 passed (9) |    Duration  8.73s | load averages: 64.51 61.14 43.38
run 2:       Tests  9 passed (9) |    Duration  6.79s | load averages: 58.03 59.86 43.24
run 3:       Tests  9 passed (9) |    Duration  9.43s | load averages: 50.98 58.12 43.00
run 4:       Tests  9 passed (9) |    Duration  6.82s | load averages: 48.25 57.17 42.92
run 5:       Tests  9 passed (9) |    Duration  7.90s | load averages: 48.61 56.98 43.02
UPTIME AFTER: 13:28  up 59 days, 14:26, 1 user, load averages: 48.61 56.98 43.02
UPTIME AFTER STOPPING LOAD: 13:31 ... load averages: 63.81 67.09 50.84   (load processes still alive: 0)
```

`node bin/revert-check.mjs tests/server/hpc/ssh.test.ts`:

```
red       tests/server/hpc/ssh.test.ts :: rejects a command that never returns at the budget and leaves no child behind (revert src/lib/server/hpc/ssh.ts:38)
red       tests/server/hpc/ssh.test.ts :: rejects a command that ignores SIGTERM at the budget and ends it within the grace (revert src/lib/server/hpc/ssh.ts:41)
red       tests/server/hpc/ssh.test.ts :: sees how late a blocked event loop runs a timer that is already due (revert tests/server/hpc/ssh.test.ts:106)
red       tests/server/hpc/ssh.test.ts :: gives up looking for a kill that never comes at the ceiling it was given (revert tests/server/hpc/ssh.test.ts:137)
red       tests/server/hpc/ssh.test.ts :: measures what the machine charges and takes its own probe away again (revert tests/server/hpc/ssh.test.ts:170)
red       tests/server/hpc/ssh.test.ts :: takes the budget again when the machine got no child as far as its pid (revert tests/server/hpc/ssh.test.ts:197)
unchecked tests/server/hpc/ssh.test.ts :: connects without the user shared master
unchecked tests/server/hpc/ssh.test.ts :: publishes unreachable with a dead master line as the hint
unchecked tests/server/hpc/ssh.test.ts :: publishes unreachable with a timed out connect line as the hint
6 reverts, 0 unproven, 3 unchecked
[exit 1]
```

The rest:

```
npm run check       -> 1789729949119 COMPLETED 1243 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint        -> eslint . printed nothing
npm run format:check-> All matched files use Prettier code style!
npm run build       -> build exit: 0
ASCII gate (spec's perl one-liner over src tests bin config) -> printed nothing
bash bin/size-check.sh -> printed nothing, exit 0    (tests/server/hpc/ssh.test.ts, 332 lines, is not in bin/size-allow.txt)
npx vitest run --reporter=dot -> Test Files  3 failed | 256 passed (259) / Tests  3 failed | 4361 passed (4364)
   the three: tests/integrity.test.ts (ENOENT .../q36/registries/venues.yml),
              tests/server/entry-edit.test.ts (expected 0 to be greater than 5),
              tests/server/yaml-edit.test.ts (expected 0 to be greater than 50)
grep -c '// revert:' on the main checkout's tests/server/hpc/ssh.test.ts -> 0   (129 lines)
```

## Spec

The brief's four items are met and the paths held.

- Item 1 and 2: both kill cases now run `machineCost` then `killAfterBudget` then assert against `killBound` (`tests/server/hpc/ssh.test.ts:235-251`).
- Item 3: `KILL_GRACE_MS = 2000` at `src/lib/server/hpc/ssh.ts:27`; `git diff 49e052b9 -- src/lib/server/hpc/ssh.ts` is 0 lines, so the file is byte-unchanged as reported. The named revert is red.
- Item 4: load stated, and reproduced above.
- Brief decision 3 (paths): `git status --short` shows one modified file. Held.
- Spec's write ban: the new `spawn` writes only under `scratchDir('oculus-ssh-')` (`:51`, `:158-162`). Held.

One finding.

- **`tests/server/hpc/ssh.test.ts:57` and `:70`, two shared helpers with no case of their own.** The brief's Tests item 3 says "Any helper the cases share carries its own case". `slackMeter`, `killSeen`, `machineCost` and `killAfterBudget` each got one; `stubFile` and `recordsPid` did not. They are exercised through the others and through `stubSsh`, so this is small, but it is short of the brief as written.

## Proof

Everything the report quotes reproduces, with the outputs above. Two claims are wrong.

- **The report's blind-spot figure is wrong under load.** `agents/reviews/Q36-report.md:58`: "an escalation slower than the grace by less than those terms together, which was 27 ms of margin in the quietest run above and 97 ms under load." I instrumented a copy of the tree in `/private/tmp/.../scratchpad/q36-review/oculus` to print `bound - afterMs` for the SIGTERM case. At load 14 to 27 the margin was 29 to 99 ms (nine runs), consistent with the report. At load 48 to 91, with my own 16 busy loops, it was 129, 205, 213, 229, 232, 243, 248, 307 ms. The report's "97 ms under load" understates the loaded blind spot by about three times, because its own loaded sample was taken at load 24, not at the loads the plan's parallel steps produce.

- **The real-hub claim is arithmetically off, though its substance is right.** `agents/reviews/Q36-report.md:98` says "three files read the real hub, where the spec names two". `grep -rn "loadLocal(" tests/ --include='*.ts'` with the `engine = engineDir()` binding checked in each gives **four** things that read the machine's real hub: `tests/integrity.test.ts:35-36`, `tests/server/entry-edit.test.ts:689-690`, `tests/server/yaml-edit.test.ts:458-459`, `tests/data/real-hub.probe.ts:27-28`. The spec (`agents/spec.md:34`) names two, `tests/integrity.test.ts` and `tests/data/real-hub.probe.ts`. **The spec's list is wrong**: it omits `tests/server/entry-edit.test.ts` and `tests/server/yaml-edit.test.ts`, both of which say so in their own head comments (`entry-edit.test.ts:10`, `yaml-edit.test.ts:8`). That is a spec line to fix, outside this step's paths.

- **The per-file exit of 1 does affect the whole-tree run.** `bin/revert-check.mjs:425` is `process.exitCode = bad === 0 && unchecked === 0 ? 0 : 1;`, computed once, in `main()`, over the whole argument list (`:410-425`). One process serves every file given, so three unchecked cases anywhere in the list make the whole run exit 1. For this step the argument list from `git diff --name-only` is that one file, so the landing's run is the run I made: `6 reverts, 0 unproven, 3 unchecked`, exit 1. The three untouched cases carried no directive before this step either (`grep -c '// revert:'` on main's copy prints `0`), so the exit status is unchanged by Q36; it was already 1 for this file. The builder's account of both points is correct.

## Standards

Two defects in the delivered file.

- **History in a comment. `tests/server/hpc/ssh.test.ts:11-12`:**
  ```
  // charges for each of them. The fork and the exec that get a stub as far as recording its pid cost
  // more than the budget the case used to give them, and a child killed before it recorded anything
  ```
  "the budget the case used to give them" is the earlier version of this test. The spec's rule (`agents/spec.md:39`) is that a comment says what the code does and why, never an earlier attempt. `git diff 49e052b9 | grep '^+' | grep -E '\b(Q|R|D|O|M)[0-9]{1,3}\b|20[0-9]{2}-[0-9]|previously|used to|...'` returns this one line and nothing else. The sentence works without it: the fork and the exec cost more than a fixed 250 ms budget on a loaded machine.

- **A head-comment sentence the measurements make false. `tests/server/hpc/ssh.test.ts:18-19`:**
  ```
  // added twice. What the bound does not catch is an escalation slower than the grace by less than
  // those terms together, which on an idle machine is around a tenth of the grace.
  ```
  A tenth of the grace is 200 ms. Measured on the quiet machine (load 14 to 27), the terms together came to 29, 33, 37, 38, 38, 51, 59, 66, 70, 99 ms, between a fortieth and a twentieth of the grace, and a 200 ms regression (`KILL_GRACE_MS * 1.1`) was red in 5 runs of 5 there. The sentence understates the check by two to four times. It is also the only place the coverage is stated, and it states it as a property of the file rather than of the machine, which is the next finding.

Clean: the ASCII gate prints nothing; `npm run format:check` and `npm run lint` are clean; 332 lines is under the 1000 line limit and `bin/size-check.sh` exits 0 with the file unlisted in `bin/size-allow.txt`; `grep -rn 'KILL_GRACE\|ssh.test\|grace' DESIGN.md HELP.md README.md` returns nothing, so no document sentence is made false; the head comment's "Nine cases" matches `Tests 9 passed (9)` and `grep -c "    it("` = 9.

## Behaviour

**How falsifiable the bound is, measured.** I changed the escalation delay at `src/lib/server/hpc/ssh.ts:41` in my copy by small increments and ran the SIGTERM case, with `NUMBERS-TERM` printed each run:

| escalation | machine load | result |
| --- | --- | --- |
| `KILL_GRACE_MS * 1.03` (60 ms late) | 18-20 | 1 red of 3 (margins +82, -7, +11) |
| `KILL_GRACE_MS * 1.05` (100 ms late) | 18-20 | 2 red of 3 (margins -34, -85, +113) |
| `KILL_GRACE_MS * 1.1` (200 ms late) | 14-20 | **5 red of 5** (margins -144 to -175) |
| `KILL_GRACE_MS * 1.2` (400 ms late) | 14-20 | 5 red of 5 |
| `KILL_GRACE_MS * 1.1` (200 ms late) | **48-91** | **2 red of 5** (green runs had killSlack 130, 166, 131) |
| `KILL_GRACE_MS * 1.2` (400 ms late) | 76-85 | 5 red of 5 |
| `KILL_GRACE_MS * 1.3` (600 ms late) | 76-85 | 3 red of 3 |

So the bound is far stronger than the 3x revert the report used: on a quiet machine it catches 1.1x reliably and 1.05x most of the time. That is the finding in the builder's favour, and the report should have measured it rather than reverting to 3x.

**The finding against it: the blind spot scales with load, and it is stated nowhere.** The widening term is `2 * Math.max(cost.slackMs, kill.slackMs)` at `:208`. Measured `killSlack` was 0 to 36 ms at load 14 to 27 and 36 to 239 ms at load 48 to 91, which pushed `bound` from 2045-2114 up to 2520. At load 48 to 91 a 200 ms late escalation, exactly the regression class the brief's item 3 names, passed 3 runs of 5. Neither the head comment (`:18-19`, which says "on an idle machine") nor the report says the coverage degrades this way. The spec's rule that a green result states in the same breath what it does not cover is not met: what it does not cover is a function of the load, not a number.

**Can the case's own work inflate the slack it then uses?** No, measured three ways.
- `cost.slackMs`, the one whose meter spans `spawn(probe)` at `:160-174`, stayed at 1 to 37 ms across every run I made, at loads from 14 to 91. `kill.slackMs`, measured over a wait with no spawn in it, is what reached 239 ms. `killBound` takes the max of the two, so the spawn-spanning term never decided the bound in any run I observed.
- A standalone probe (`/private/tmp/.../scratchpad/q36-review/slack-probe.mjs`, the same meter over a 600 ms window, 8 pairs, at load 78) found no difference: `idle worst: 3.4 2.1 3.4 1.6 2.8 4.8 1.4 1.8 | max 4.8 mean 2.7` against `spawned worst: 2.0 1.5 5.9 2.2 1.6 5.9 1.7 1.3 | max 5.9 mean 2.7`.
- Structurally there is a self-widening channel that is real but not dominant: `killSeen` takes the **maximum** lateness over a window whose length is the very quantity being bounded, so a slower escalation gives the meter more chance to sample a spike. Measured, the mean `killSlack` was 124 ms over a 2.05 s window (unmodified) and 123 ms over a 2.65 s window (1.3x), so at these window lengths the effect did not show.

**The origin of the measurement is honest.** `from` at `:195` is taken after `await expect(run(...)).rejects.toThrow('timeout')`, which is later than the moment `child.kill('SIGTERM')` runs at `ssh.ts:38`. I exported the arm timestamp in my copy and printed the gap: `ORIGIN-SHIFT 5.9 ms`, `0.7 ms`, `1.4 ms`. Negligible, so the bound is not quietly relaxed by the await chain.

**The retry loop proves the same thing whatever the attempt count.** The budget does not enter `killBound` (`:207-209`), which is about the grace after the rejection and is budget-independent. I forced multi-attempt runs by starting the budget at 30 ms in my copy:
```
escalation unchanged:   attempts=3 after=2008 bound=2047 margin=+38   -> passed
                        attempts=3 after=2013 bound=2047 margin=+33   -> passed
                        attempts=3 after=2016 bound=2045 margin=+29   -> passed
escalation x1.1:        attempts=3 after=2213 bound=2068 margin=-145  -> failed
                        attempts=3 after=2226 bound=2057 margin=-169  -> failed
                        attempts=3 after=2213 bound=2103 margin=-110  -> failed
```
A 3-attempt run is exactly as green and exactly as red as a 1-attempt run. A half-succeeded attempt cannot make the next one pass wrongly: each attempt writes its own pid file, `pid-${attempt}` at `:192`, so a stale pid from attempt N is never read by attempt N+1, and each attempt's stub has its own file name baked into its body. An abandoned child is SIGKILLed by the runner's own `force` timer within the grace; `ps -Ao pid,ppid,etime,command | awk '$NF ~ /^20$/ && $(NF-1) ~ /sleep/'` after my runs showed one `sleep 20` belonging to another worktree's monitor loop (ppid 61080, a `q53` shell) and none of mine.

**`machineCost`'s throw cannot turn a real defect into a machine message.** `machineCost` spawns the probe with `spawn` imported from `node:child_process` at `:20` and used at `:162`; it never calls `run` from the code under test. The only thing it takes from `ssh.ts` is `KILL_GRACE_MS` through `WATCH_MS` at `:46`. It is also called before `killAfterBudget` in both kill cases, so no defect in `run` can reach it. When it does throw the case is red, not green, so nothing is masked.

**No case passes only because the timeout went to 30000.** I put all four back to 20000 in my copy (`grep -c '}, 30000);'` -> `0`, `grep -c '}, 20000);'` -> `9`) and ran the whole file five times under my own load:
```
UPTIME (loaded): 13:28 ... load averages: 55.11 57.89 43.67
Tests  9 passed (9)   Duration  8.11s
Tests  9 passed (9)   Duration  7.14s
Tests  9 passed (9)   Duration 13.77s
Tests  9 passed (9)   Duration 11.59s   (this run: NUMBERS-TERM after=2315 killSlack=239 bound=2520)
Tests  9 passed (9)   Duration 12.12s
final load averages: 87.54 70.61 51.21
```
Five of five green at 20000 up to load 91. The 30000 is headroom, not the reason anything passes.

**The "never returns" case's bound assertion is not load-bearing.** `:241` asserts `kill.afterMs <= killBound(cost, kill)`, and the measured values were `after=24 bound=2045`, `after=26 bound=2051`, `after=45 bound=2072`, `after=156 bound=2166`: a margin of about two seconds over an event that takes tens of milliseconds. That child honours SIGTERM, so the escalation is never exercised in that case and the assertion cannot see a late escalation. Only `expect(kill.seen).toBe(true)` is load-bearing there, and its revert (`ssh.ts:38-41 => force = null;`) removes the SIGTERM as well as the escalation, which is what makes it red. The report's DONE row 2, "both cases now go through `machineCost` + `killAfterBudget` + `killBound`", is true of the code and overstates what the second case proves.

**Residual flake risk, unchanged in kind, moved.** On a machine slow enough, `machineCost` can spend up to `WATCH_MS` (8 s) waiting for the probe's pid and another 8 s in `killSeen`, and `killAfterBudget` then starts at `2 * execMs`, which can be 16 s. Those add past the 30000 ms case timeout, so a very loaded machine still gives a red case for a machine reason. That is red rather than green, so it does not fit a measurement to the case; it is why the file will still go red occasionally under the plan's parallel runs, and the report does not name it.

## What I did not check, named

- The browser suite (`tests/browser/*.spec.ts`), by instruction.
- Escalation multipliers between 1.00 and 1.03, and above 1.3.
- Behaviour on a genuinely idle machine: the load average never went below 11.31 during this review, because other plan steps were building throughout.
- The full node suite was run once, not repeatedly; I did not survey flakiness in the other 258 files.
- Whether `tests/server/entry-edit.test.ts` and `tests/server/yaml-edit.test.ts` are red on the main checkout (where the hub is present); I only observed them red in the sparse worktree.
- Whether another in-flight step holds `src/lib/server/hpc/poll.ts` or the three untouched cases, which is the builder's stated reason for leaving them unchecked.
- `npm run build` beyond exit 0 and the served bundle.

## Usage

About 25 tool calls over roughly 32 minutes of wall clock, from 13:08 to 13:40. The expensive parts: 15 full runs of `tests/server/hpc/ssh.test.ts` in the worktree, one full `vitest run` (89 s, 4364 tests), one `npm run check`, two `npm run build`, one `node bin/revert-check.mjs` over six directives, and 34 single-case runs in the scratch copy across seven escalation settings and two load regimes. Scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q36-review` holds the rsync copy, `try.sh`, `slack-probe.mjs` and the instrumented test variants; `load.pids` is spent and every pid in it is dead.

