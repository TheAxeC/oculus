Everything in the brief is done. One premise of the brief is wrong and is corrected below; read that first, because it changes what the fix had to be.

## The premise that was wrong

The brief (and the case's own comment) diagnose the flake as the poll window being too tight for a late escalation. Measured, that is not the dominant cause. The dominant cause is the 250 ms budget against what this machine charges for a fork and an exec: the stub is killed before it ever writes its pid, so `gone(pidFile)` can never become true and the poll times out on a child that was never there.

Measured in a scratch script (`node /private/tmp/.../scratchpad/q36/lagmany.mjs`, 12 spawns of the same stub at load 10-16): `pid file seen after (ms): 179 158 164 148 145 236 141 358 230 173 178 188`. The 250 ms budget sits inside that distribution. Running the tree's case alone ten times during the parallel steps, 9 of 10 were red with `existsSync(pidFile) === false` after an 8 s watch, so the child had never recorded anything.

So the fix has two measured terms, not one: a budget read from a probe of the machine, and a kill bound that adds the machine's lateness. Both are measured in the run; no constant was widened.

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. The SIGTERM case holds under load without widening what it proves | DONE | `npx vitest run tests/server/hpc/ssh.test.ts --reporter=dot` x10, `Tests 9 passed (9)` every run (table below) |
| 2. The same for the sibling ("never returns") | DONE | same runs; both cases now go through `machineCost` + `killAfterBudget` + `killBound` |
| 3. No constant widened; a slower escalation is still red | DONE | `node bin/revert-check.mjs tests/server/hpc/ssh.test.ts` -> `red ... ends it within the grace (revert src/lib/server/hpc/ssh.ts:41)`; plus the old measurement, below |
| 4. The load the cases are proven at is stated | DONE | `uptime` before and after each block of five runs (table below) |
| Tests: 5 loaded and 5 idle runs of each case, counts quoted | DONE | table below, 9 of 9 cases green in each of the 10 runs |
| Tests: a case for every helper the cases share | DONE | four cases in the second describe, each proven red by its revert |
| `npx vitest run --reporter=dot` | DONE, 3 red for a worktree reason | `Test Files 3 failed | 256 passed (259)`, `Tests 3 failed | 4361 passed (4364)`; see "Three red in the full suite" |
| `npm run check` | DONE | `COMPLETED 1243 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `build exit: 0`, `✓ built in 9.44s` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .` printed nothing |
| ASCII gate | DONE | the spec's `perl` one-liner over `src tests bin config` printed nothing |

## The ten runs

`npx vitest run tests/server/hpc/ssh.test.ts --reporter=dot`, whole file (9 cases, the two kill cases among them).

| Block | uptime before | uptime after | Result |
| --- | --- | --- | --- |
| Five without a load of my own | `load averages: 13.17 15.68 16.70` | `load averages: 12.42 15.24 16.50` | `Tests 9 passed (9)` x5 |
| Five with 16 busy loops I started and stopped | `load averages: 25.21 18.11 17.48` | `load averages: 82.49 46.19 28.99` | `Tests 9 passed (9)` x5 |

The machine was never idle: two other steps of the plan were building beside me throughout, so the lower block is "no load of mine", at load 12 to 13, not an idle machine. My own load was 16 busy shell loops started in `/private/tmp/.../scratchpad/q36`, their pids written to `load.pids` and killed from that file afterwards (`load processes still alive: 0`). Loaded run durations were 7.7 s to 14.3 s against 5.4 s unloaded.

## How the measurement works

Three terms, each measured inside the case's own run, none a fixed multiplier:

- `machineCost(dir)` spawns a probe of the same stub and times two things: `execMs`, how long the machine takes to get it as far as recording its pid, and `reapMs`, how long a polite signal to it takes to show as gone. It throws when the probe outlives the signal, so a stuck probe cannot quietly widen a bound.
- `killAfterBudget` gives the run `max(250, 2 * execMs)`, and an attempt whose child never recorded its pid doubles the budget and tries again, up to 4. A short budget costs an attempt and proves nothing either way; what is measured comes from an attempt whose child was there.
- `slackMeter(STEP_MS)` runs a 20 ms timer across the wait and keeps the worst it was late by. `killBound = KILL_GRACE_MS + STEP_MS + reapMs + 2 * max(slack measured by the probe, slack measured over the wait)`: the grace, one look, what a signal and a reap cost, and the lateness charged twice, once to the runner's escalation and once to the look that saw it.

Real numbers, printed from a copy of the tree in the scratchpad (the tree itself prints nothing), one run at load 15.92 and one at load 24.27:

```
NUMBERS exec=174 reap=21 costSlack=5 attempts=1 after=22   killSlack=1  bound=2051
NUMBERS exec=167 reap=21 costSlack=1 attempts=1 after=2021 killSlack=4  bound=2048
NUMBERS exec=252 reap=98 costSlack=1 attempts=1 after=38   killSlack=1  bound=2121
NUMBERS exec=399 reap=21 costSlack=4 attempts=1 after=2085 killSlack=70 bound=2182
```

`KILL_GRACE_MS` is still 2000 (`src/lib/server/hpc/ssh.ts:27`, unchanged; the file is untouched). The bound moves with the load (2048 at rest, 2182 under load) and the observed kill moves with it (2021, 2085).

What the bound does not catch, said in the same breath: an escalation slower than the grace by less than those terms together, which was 27 ms of margin in the quietest run above and 97 ms under load. It catches anything slower than that; the revert below is 3x the grace.

## The revert of item 3, run

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
```

6 reverts, 0 unproven. The directive the brief's item 3 names is `// revert: src/lib/server/hpc/ssh.ts:41 => }, KILL_GRACE_MS * 3);`: the escalation at three times the grace, the constant untouched, and the case red under the new measurement.

Red under the old measurement too, so the new one is not weaker: in a scratch copy of the tree holding the main checkout's version of `tests/server/hpc/ssh.test.ts` with the same line 41 change applied,

```
 ❯ tests/server/hpc/ssh.test.ts:99:14
     98|             .poll(() => gone(pidFile), { timeout: KILL_GRACE_MS + 1000
Caused by: Error: Matcher did not succeed in time.
 Test Files  1 failed (1)
```

## Files changed

| File | Lines | What |
| --- | --- | --- |
| `tests/server/hpc/ssh.test.ts` | 332 (was 129) | the whole change |

No other file in the tree was written. `src/lib/server/hpc/ssh.ts` needed no hook and is byte-unchanged.

## Problems, decisions and sharp edges

- **Three red in the full suite, none of them mine.** `tests/integrity.test.ts` (`ENOENT ... /.agents/worktrees/q36/registries/venues.yml`), `tests/server/entry-edit.test.ts` (`expected 0 to be greater than 5`) and `tests/server/yaml-edit.test.ts` (`expected 0 to be greater than 50`). The worktree is a sparse checkout: `ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/q36/` lists `tools` and the root documents and no `projects/` or `registries/`, so every real-hub reader finds nothing. Reported, not repaired, per the spec. Note that three files read the real hub, where the spec names two (`tests/integrity.test.ts` and `tests/data/real-hub.probe.ts`).
- **Three cases in the file stay unchecked**, and the checker's exit status for the file is 1 because of them. They are the three I did not change, and they carried no directive before this step either: `grep -c '// revert:'` on the main checkout's copy of the file prints `0`. I left them alone because their rule lives in `src/lib/server/hpc/poll.ts`, which my brief does not list and another in-flight step may hold; a directive of mine naming a line there would go stale under their edit. Reversible: say the word and I add the three.
- **Decision, reversible: the four cases that spend budgets carry a 30000 ms case timeout** where the file's others carry 20000. The bound the case proves is the explicit `killBound` assertion, not the runner's timeout; the larger timeout only keeps a loaded machine from ending the case before it can measure. The two untouched kill-free cases keep 20000.
- **Decision, reversible: the look step is 20 ms** where the case used 100. It is the granularity term inside the bound, so a finer step is a tighter bound.
- **Decision, reversible: at most 4 attempts.** A machine that cannot get a child up in budgets of 250, 500, 1000 and 2000 ms makes the case red with `no child of 4 attempts recorded its pid before its budget ran out`, which is a true statement about the machine rather than about the runner.
- **Sharp edge: the probe costs a spawn.** Each kill case now spawns twice (probe and attempt), so the file takes 5.2 s to 5.4 s unloaded against the 12.6 s it took under the parallel load before, and 7.7 s to 14.3 s while I loaded the machine.
- **Sharp edge: a failed attempt leaves its stub running** until the runner's own escalation kills it, up to the grace. No orphan outlives that; `ps -Ao pid,ppid,etime,command | awk '$4 ~ /sleep/'` after the runs showed no `sleep 20` belonging to a test process of mine.
- The browser suite was not run; the orchestrator runs it. Nothing under `src/` changed, so nothing a reader sees changed, and there is no before-and-after to look at on screen.

