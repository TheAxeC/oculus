# Diagnosis: a repository unreadable after a server start stays unreadable

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part. Vitest's pass, fail and pointer glyphs are written `PASS`, `FAIL` and `>` in the quoted outputs, so the record stays ASCII.

Diagnosis agent: a9c92f106b8cabbf3, claude-opus-5-5, 336,362 tokens, 139 tool uses, 76.0 min.

## Symptom

oculus/migration X3e look: after a start of the scratch oculus (gate code, server pid 44293 on 127.0.0.1:8796, roots hub clone, site, gamma, alpha, beta, w2), the Repositories row of w2 (a 9047-file worktree of the hub clone) reads "unreadable" with the tooltip "Git did not finish within 5 seconds, so it was stopped", and stays so for more than 20 s, while `git -C w2 --no-optional-locks status --porcelain=v2 --branch -z` takes 1.03 s cold and 0.29 s warm in a shell. At depth 3, w1 showed the same.

Two parts: (1) a read of a large repository times out after a server start, though git alone answers in about a second; (2) the root then stays unreadable with no later read, until something else moves it.

## Where the probes run

The scratch copy `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.imTDaR/tree` (below, `$T` is `diagnose.imTDaR`), a detached worktree at main's head d098915b5 with X3e's whole uncommitted change applied (209 paths; `git -C tree status --short --untracked-files=all | wc -l` printed 210 at the end: the 209 and the new test). Dependencies installed with `npm ci` in its `tools/oculus` (node v24.21.0). The paths redirected under `$TMPDIR`: HOME (`$T/home`) for every vitest run; ORDO_STABLE and ORDO_SKILL_DIRS not used, since no skill or pinned checkout is touched.

The repositories probed are this diagnosis's own, under `$T`: `real/`, a `git clone --shared` of the x3elook hub clone (9047 tracked files, 1.8 GB per checkout) with worktrees `w1` (detached), `w2` and `w3` under `.agents/worktrees`, a one-file repository `site` inside it, and the small roots `alpha`, `beta` (one-commit repositories) and `gamma/sub` (a plain folder); `tiny/`, a one-file repository at `hub/.agents/worktrees/w2`. The x3elook folder was read only (`ls`, `git status --porcelain`, `git worktree list`, `git count-objects`).

Not applicable for this form: no reviewer's finding, so no `git status --short` or `git diff --binary <base> | shasum` of a step's worktree.

## Red command

The harness `tests/server/root/watch/diag-red.test.ts` (kept as `$T/diag-red.test.ts`, out of the tree) starts `watchGit` as `startGit` does (`always` the hub clone, `roots` the six roots of the look, `text` the real catalog, `depth` 1, a workspaces file under the scratch folder, the default 5 s limit), subscribes a sink to `git`, waits up to 30 s for the first payload that holds w2, then holds 25 s. It prints every `git` message and asserts both parts with `expect.soft`, so each part's result is printed whatever the other does: PART1 is w2's error in its first state, PART2 is w2's error at the end of the hold. Red is PART1 and PART2 both carrying "Git did not finish within 5 seconds, so it was stopped".

```
$T/red.sh   # HOME=$T/home DIAG_REPOS=$T/real DIAG_HOLD=25000 npx vitest run tests/server/root/watch/diag-red.test.ts --silent=false --reporter=verbose
```

Runs, 00:19 to 00:22 (a landing tier of the orchestrator started at about 00:21:38 by `ps` etime):

```
== run 1
at 10672 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 10672 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 10672 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
== run 2
at 12429 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 12429 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 12429 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
== run 3
at 11301 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 11301 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 11301 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
```

The same command over a synthetic 9001-file repository of small files (`$T/repos`, removed) was green: every root answered at 1114 ms.

Part 1 is a symptom seen only sometimes, and follows the machine's load, which varied through the run (the orchestrator's landing tier from about 00:21:38 and again from about 00:39:29, a vite dev server at 111 % CPU, an antivirus daemon at 38 %; `uptime` at 00:50 gave load averages 9.78 19.01 17.34). Measured red rate of the untouched case: red 7 of 7 runs from 00:19 to 00:26 (a landing run present in 5 of them), green 2 of 2 at 00:28:08 and 00:28:40 with no landing run (w2 answered at 3972 ms and 3540 ms). A pinned CPU load of `yes` loops (`$T/load.sh`) made it red again but not dependably: 11 loops red 4 of 4 from 00:29:45 to 00:33:06 (one run's first w2 state came after the then 15 s wait, at 17802 ms); 6 loops green 2 of 2 (00:36:56, 00:37:33); 8 loops green (00:38:25); 9 loops red at 00:39:09 and 00:40:48 and green 2 of 2 at 00:50:35; 11 and 33 loops for the first 20 s, and 11 loops with 4 disk writers, green at 01:08:26, 01:09:22 and 01:10:26. Git alone slowed with the same load (Probes, rank 5).

Runs after the tightening. To make the timeout itself dependable, the tightened red command puts a `git` of its own first on PATH (`$T/fakebin/git`) whose first `status` of w2 sleeps 6 s and that hands everything else to `/opt/homebrew/bin/git`: a git slow once on w2's status, as git was under the start's load. The watcher, its 5 s limit and the repositories are the real ones.

```
$T/red2.sh   # touch $T/slow.mark; DIAG_SLOW_ROOT=<w2> DIAG_SLOW_MARK=$T/slow.mark PATH=$T/fakebin:$PATH $T/red.sh
== run 1 (start 00:53:35, no landing run)
at 7363 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 7363 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 7363 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
== run 2 (start 00:54:11)
at 7143 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 7143 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 7143 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
== run 3 (start 00:54:47)
at 11058 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
PART1 first w2 state at 11058 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 11058 ms): error="Git did not finish within 5 seconds, so it was stopped"
      Tests  1 failed (1)
```

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| root alpha (untightened, 00:23:40, landing running) | red, `PART2 ... (at 10629 ms): error="Git did not finish..."` | cut |
| root beta (00:24:30) | red, PART2 at 10589 ms timed out | cut |
| root gamma (00:25:10) | red, PART2 at 11130 ms timed out | cut |
| root site (00:26:06; the hub's depth-1 scan still finds `site`, 6 keys) | red, PART2 at 10572 ms timed out | cut |
| the four together (untightened, 00:26:54) | green, w2 answered at 9264 ms; with no load the four cut were green at 00:28:40 (3540 ms) and the whole case green at 00:28:08 (3972 ms): part 1 follows the load, not the roots | carried to the tightened command |
| the four small roots (tightened, 00:55:47) | red, `PART2 w2 state 25000 ms later (at 10413 ms): error="Git did not finish..."` | cut |
| the hub root and `always` (tightened, 00:56:26), w2 alone | red, PART2 at 5205 ms timed out | cut |
| the hold, 25 s to 5 s (00:56:59) | red, PART2 at 5213 ms timed out | put back to 10 s: probe 2 below showed 5 s is shorter than one throttle window plus one read of w2, so a 5 s hold cannot tell the causes apart |
| the 9047-file repository, for a one-file one (`tiny`, 00:57:20) | red, PART2 at 5194 ms timed out | cut |

The shrunk case, as it stands: one watched root that is a repository; one git command of its first read that outlasts the watcher's time limit; nothing written in the root afterwards; a hold longer than one throttle window (2 s) plus one read. For part 1 alone, the shrunk case is a busy machine: the cut of every load made it green.

## Hypotheses

1. If a read in which git timed out leaves nothing that asks for the root again (no timer is set, and a root nobody writes in sends no event), then asking for a read of the root through its throttle after such a read turns PART2 green. Falsified by: w2 still unreadable at the end of the hold with that change.
2. If a later read of w2 is asked for (by a watch event) but its answer is dropped before it is published (`stillOpen`, `byKey` or the unchanged comparison in `readOnce`), then removing that drop turns PART2 green. Falsified by: no git command for w2 after its timed-out status during the hold.
3. If the watcher runs several git processes at once at start (the first-read chain beside reads asked by events), so w2's status shares the machine with them, then running one git at a time turns PART1 green. Falsified by: every command of the start running with no other watcher git running.
4. If something in the watcher's process (the recursive watch just opened over the root, `execFile`'s pipes) makes its `status` slower than the same command in a shell, then the watcher's status is markedly slower than the shell's under the same load. Falsified by: the two equal under one load.
5. If the machine's load alone makes w2's `status` exceed 5 s whoever runs it, then removing the load turns PART1 green, and under the load the same command in a shell also exceeds 5 s. Falsified by: a shell `status` under 5 s under the load that made the watcher's time out.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 3 (its log also answers 2) | `run.ts`: a module counter of running gits and, in `execFile`'s callback, `console.log` tagged `DIAG-7c3e` with the start, the duration, the count running, the root, the command and ok/TIMEOUT/fail (`$T/probe1.diff`) | red command under 9 loops, 00:40:48, a landing run present: every line `with 1 running`; `hub status +5057 ms TIMEOUT`; `w2 log +1907 ms ok`; `w2 status +5043 ms TIMEOUT`; no git command for w2 in the 25 s after it | 3 falsified (one git at a time); 2 falsified (no later read was asked for) |
| 4 | none, a measurement on probe 1's tree: `$T/gitsame.sh` (the watcher's own `status --porcelain=v1 -z --untracked-files=normal --renames` in a shell) interleaved with the red command under one 9-loop load, 00:50:35, no landing run | shell 2.54, 1.31, 1.24 s; watcher `w2 status +1648 ms`, `hub status +2184 ms`; shell 1.40, 1.95, 1.70 s; watcher `w2 status +1432 ms`, `hub status +1454 ms` | falsified: the watcher's status is as fast as the shell's |
| 5 | none, measurements: `$T/gitalone.sh` (the symptom's command) and `$T/gitsame.sh` in a shell | 00:35:28: no load 1.31, 0.62, 0.62 s; 11 loops 17.20, 21.13, 25.01 s. 00:36:40: 2 loops 0.74 to 0.68 s, 4 loops 1.24 to 1.27 s, 6 loops 1.28 to 1.53 s; then 8 loops 4.93, 1.78, 2.40 s; 9 loops 3.26, 2.44, 1.16 s. 00:43:31, a landing run plus 9 loops: watcher's args 77.82, 51.02, 25.76 s; symptom's args 32.86, 39.00, 64.21 s. The untouched red command with no load green at 00:28:08 (w2 at 3972 ms) | standing: under the load that times the watcher out, git alone takes 17 to 78 s; without the load the read answers. The symptom's 1.03 s was measured at another moment than the start's read |
| 1 | `git.ts` `readOnce`, after `if (first) last.set(...)`: `if (next.error !== null && next.repository) { wants.add(root); touch(root); }` (`$T/probe2.diff`) | shrunk red, hold 5 s, 00:57:47: `at 5241 ms ... timed out`, no second message | not separated: the hold ended before the asked read published (next row) |
| 1 (logging over probe 2's change) | `git.ts`: `console.log` tagged `DIAG-7c3e` at the read's start and end and at the throttle timer | 00:58:20: `read begins first=true`, `read ends error="Git did not finish..." repository=true`, `timer fires wants=true`, `read begins first=false announce=true`, `read ends error=null`, `at 9028 ms keys 1 w2 "w2"`, `PART2 ... error=null` | standing: the asked read runs and publishes 3.8 s after the timed-out one |
| 1 | probe 2's change alone, hold 10 s | 00:58:42: `at 8689 ms keys 1 w2 "w2"`, `PART2 w2 state 10000 ms later (at 8689 ms): error=null`; 00:59:00: the same at 8806 ms. Without the change, hold 10 s, 00:59:28: `PART2 w2 state 10000 ms later (at 5230 ms): error="Git did not finish within 5 seconds, so it was stopped"` | standing: PART2 green with the change, red without it |

Each probe's change was undone after its run: `cmp $T/git.ts.orig src/lib/server/root/watch/git.ts` and `cmp $T/run.ts.orig src/lib/server/core/git/run.ts` printed nothing before the test's red run.

## Cause

Part 2, the defect: `readOnce` in `src/lib/server/root/watch/git.ts` publishes the state of a read in which a git command timed out and then asks for nothing more. The only things that ask for a root's read are a relevant watch event, `refresh` and a new root's first read, and a root nobody writes in sends no event. So a read that ran out of time once is the root's state until a write or a refresh happens to come. Probe 1 shows no read of w2 after its timed-out status in a 25 s hold; with probe 2's change (a read asked for through the root's throttle after such a read) the shrunk red command's PART2 is green (w2 readable at 8689 and 8806 ms), and red without it (00:59:28).

Part 1 is the machine's load: under the load that made the watcher's `status` of w2 time out, the same command alone in a shell took 17 to 78 s, the watcher ran one git at a time (probe 1), and its status was as fast as a shell's under one load (paired measurement). Without the load the whole case answers in 3.5 to 4 s. The 5 s limit is not the cause of the symptom's permanence, and widening it would only move the load at which a read runs out, so it is left as it is.

The state read also gave the watcher no way to tell a read that ran out of time from one git refused: `statusFor` answered only `GitState`, where a timed-out `status` and a config git cannot parse both read `error` set with `repository` true, and a timed-out `log`, `for-each-ref`, `rev-list @{upstream}`, `worktree list` or `diff --numstat` was folded into an empty list or "no upstream" with no error at all. Probe 2's condition (`error !== null && repository`) would therefore re-read a repository with a permanent error every 2 s for good and miss the timeouts of those commands. The fix carries the fact from the runner, where `Outcome.answered` is false exactly for a command whose time limit ran out (`outcomeOf` in `run.ts`).

## Fix and test

Test, run on the tree without the fix (`state.ts` and `git.ts` as X3e left them), 01:12:41:

```
$ HOME=$T/home npx vitest run tests/server/root/watch/git-timeout.test.ts
 FAIL  |unit| tests/server/root/watch/git-timeout.test.ts > the git watcher after a read that timed out > reads the root again and shows it readable
AssertionError: reads the watcher has asked for after the timeout: expected 0 to be greater than 0
 > tests/server/root/watch/git-timeout.test.ts:154:15
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

The assertion before it, that the first state carries the catalog's timed-out sentence for the case's 2 s limit, passed in that run, so the failure is the symptom: the root shown unreadable after a timed-out read, and nothing asked to read it again. The same fixture was red 5 of 5 and 1 of 1 between 01:03 and 01:05. A tagged log of the watch's events (`DIAG-7c3e heard ...`) showed that a repository moved into the watched path is itself heard as `rename "repo"`, which asks for a read and let the test pass without the fix; the folder above the repository moved into place is not heard by the root's watch (no `heard` line in 5 runs), which is why the test builds the repository in `build/repo` and moves `build` to `read`.

Fix (the whole diff is in "Fix as a diff"):

- `src/lib/server/core/git/state.ts`: `statusFor(roots[])` is replaced by `readState(root, text, timeout): Promise<StateRead>`, `StateRead = { state: GitState; finished: boolean }`. One read runs every command through a per-read `git(args)` that calls `run(root, args, ms)` and sets `finished = false` when an outcome is not `answered`; `checkedOut`, `upstream`, `log`, `refs`, `stashes` and `remotes` take that `git`, and `worktrees(root, timeout)` (called by `compare.ts:419`) keeps its signature over a new `worktreesOf(root, git)`. `readState`'s doc keeps `statusFor`'s description; the head comment says what `finished` is for.
- `src/lib/server/root/watch/git.ts`: `readOnce` reads with `readState`; when the read did not finish it adds the root to `wants` and calls `touch(root)`, so the throttle's timer asks for the next read at the end of the root's window, and again after every read that does not finish. `answered` moves no `readFrom` stamp for a read that did not finish. The head comment gains a paragraph on the read asked for again, and "a read of the state is asked for when a relevant event came in the window, or when the root's last read ran out of time"; the two comments naming `statusFor` name `readState`.
- `statusFor` had no caller left outside tests, so it is folded into `readState` (`sh utils/unused-exports.sh` lists `state.ts: LOG_ENTRIES, empty, capped`, without `statusFor` or `readState`), and its two callers are carried: `tests/server/git/refs/cherry-pick.test.ts:39` (with its head comment) and `tests/data/real-hub.probe.ts:129`, each `(await readState(root, TEXT)).state`.
- `docs/source-control.md`, the Repositories paragraph: "A read in which git ran out of time is made again two seconds later, and again until one finishes, so a repository git was slow over while the machine was busy comes back on its own."
- The test, `tests/server/root/watch/git-timeout.test.ts`, tagged slow, one case: a one-commit repository moved under the watched path, a `git` first on PATH (`vi.stubEnv`) whose first `status` sleeps three times the 2 s limit, and a clock the case runs. It waits for the `git` message with the timed-out sentence, runs the clock's timers (at least one must be there), and waits for the message with the root readable on `main`. It waits on messages and the held clock, never on a sleep.

Runs after the fix:

```
$ HOME=$T/home npx vitest run tests/server/root/watch/git-timeout.test.ts --reporter=verbose      (01:21:06; also 3 of 3 at 01:07:02 and 1 at 01:12:51)
 PASS |unit| tests/server/root/watch/git-timeout.test.ts > the git watcher after a read that timed out > reads the root again and shows it readable 2657ms
      Tests  1 passed (1)

$ DIAG_HOLD=10000 DIAG_CUT=alpha,beta,gamma,site,hub DIAG_NOALWAYS=1 $T/red2.sh      (the shrunk red command, 01:21:55)
at 5239 ms keys 1 w2 "Git did not finish within 5 seconds, so it was stopped"
at 9866 ms keys 1 w2 "w2"
PART1 first w2 state at 5239 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 10000 ms later (at 9866 ms): error=null

$ $T/red2.sh      (the tightened red command: the six roots of the look over the 9047-file clone and worktrees, 01:22:14)
at 7272 ms keys 6 w2 "Git did not finish within 5 seconds, so it was stopped"
at 10506 ms keys 6 w2 "w2"
PART1 first w2 state at 7272 ms: error="Git did not finish within 5 seconds, so it was stopped"
PART2 w2 state 25000 ms later (at 10506 ms): error=null

$ $T/red.sh      (the original case with real git and no injected slowness, 01:22:50, no landing run)
at 3635 ms keys 6 w2 "w2"
PART1 first w2 state at 3635 ms: error=null
PART2 w2 state 25000 ms later (at 3635 ms): error=null
      Tests  1 passed (1)
```

PART1 stays red in the two tightened commands by construction: their git is made slow once on purpose, and the first state after a read that ran out of time is shown with the timed-out sentence for one throttle window plus one read (3.2 and 4.6 s above). PART2, the defect, is green in both. The original case under the machine's own load could not be re-triggered after the fix: three loaded runs at 01:08:26, 01:09:22 and 01:10:26 (11 and 33 `yes` loops for 20 s; 11 loops and 4 disk writers) all answered on the first read (3518, 3428 and 10446 ms), so PART2 with the fix is shown under injected slowness only. The repositories `real/` and `repos/` were removed at the end to free 7.4 GB, so `red.sh` and `red2.sh` over the six roots need the clone made again as "Where the probes run" says; the shrunk red command runs over `tiny/` with `DIAG_REPOS=$T/tiny` once the harness is put back into `tests/server/root/watch/`.

Verification on the copy's `tools/oculus` after the last change:

```
$ HOME=$T/home npx vitest run tests/server/root/watch tests/server/core/git      (01:21:06; the filter tests/server/core/git matches tests/server/core/git-failure.test.ts, there is no such folder)
 Test Files  2 passed (2)
      Tests  24 passed (24)
$ HOME=$T/home npx vitest run tests/server/git tests/server/root tests/server/files tests/server/machine      (slow tests included, cherry-pick.test.ts among them)
 Test Files  41 passed (41)
      Tests  310 passed (310)
$ HOME=$T/home npm run check -- --threshold error
1791415309702 COMPLETED 3379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npx eslint <the six changed files> && echo lint clean
lint clean
$ npx prettier --check docs/source-control.md src/lib/server/core/git/state.ts src/lib/server/root/watch/git.ts tests/server/root/watch/git-timeout.test.ts
All matched files use Prettier code style!
$ LC_ALL=C grep -n '[^ -~]' <the six changed files>
(nothing, exit 1)
$ HOME=$T/home npx vitest run tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/diagrams
 Test Files  1 failed | 2 passed (3)      (git.ts 737 lines, state.ts 385)
AssertionError: run npm run diagrams: expected [ 'docs/diagrams/layers.dot', ...(3) ] to deeply equal []      (layers.dot/.svg, layer-views.dot/.svg)
```

The diagram check is red with the same four stale files on the tree without the fix (run between 01:13 and 01:21 with `state.ts`, `git.ts` and `docs/source-control.md` as X3e left them and the new test moved out: `Tests  2 failed | 44 passed (46)`), so it is X3e's, which `npm run diagrams` before the verify list settles; the fix changes no import between modules.

No test reaches it: not applicable. No test is written: not applicable.

Decisions the orchestrator or Axel may reverse, and what the fix leaves:

- Rule clash on the test: `agents/spec.md` says a test exists only as the test of an entry of `agents/guarded.md`, and brief X3e H3 records Z524 ruled (b), no test for H1, with no entry naming the git watcher (the brief's `grep -n "watch/git\|core/git/state\|core/git/run\|statusFor" agents/guarded.md`, not rerun here). This run's prompt asked for the test. Landing `git-timeout.test.ts` needs an entry, which is Axel's ruling; without one the test is this diagnosis's evidence only.
- A root whose git hangs every time (a dead network mount) is read again after every throttle window: about one git process every 7 s for that root (a command killed at 5 s, then 2 s), for as long as it hangs. Not measured. A doubling wait up to a cap would bound it; the fix keeps the one throttle every event uses.
- Under heavy load a root is still shown unreadable, with the timed-out sentence, for the length of the slowness plus up to one throttle window and one read.
- `tests/data/real-hub.probe.ts` was edited at its call only and not run, since it reads the real hub; the type check covers the call.
- The test's 2 s limit: under a load that keeps a one-file repository's command over 2 s on the second read too, that read does not finish, nothing runs the held clock again, and the case times out at 20 s.

## Cleanup

```
$ grep -rn "DIAG-" tools/oculus/src tools/oculus/tests tools/oculus/docs tools/oculus/config      (from the copy's root)
(nothing; exit 1)
```

The probe logging and the harness `tests/server/root/watch/diag-red.test.ts` are out of the tree (`git -C tree status --short --untracked-files=all` lists 210 paths: X3e's 209 and `tools/oculus/tests/server/root/watch/git-timeout.test.ts`). Removed: the clone `real/` with its worktrees (7.2 GB), the synthetic `repos/`, the marker file and the probe copies. Kept beside the copy for the round's check, to go with the scratch copy when the orchestrator removes it: `diag-red.test.ts`, `red.sh`, `red2.sh`, `load.sh`, `red-transient.sh`, `io-load.sh`, `gitalone.sh`, `gitsame.sh`, `paired.sh`, `fakebin/git`, `tiny/`, `home/`, the saved outputs (`*.txt`), `fix.diff`, `probe1.diff`, `probe2.diff` and the `*.orig` and `*.fixed` copies. No `yes` or `dd` process of this run is left (`ps -axo pid,command | grep -cE "^ *[0-9]+ (yes|dd if)"` printed 0). The red command run again on the original case: green at 01:22:50 (above); carried by the round as its check, in its tightened form.

# Fix as a diff

This diff is taken against X3e's version of each file, rebuilt as `git show HEAD:<path>` with `step.diff` applied. For `state.ts` and `git.ts` that rebuilt version is identical to the originals saved before the probes (`cmp` printed nothing). It applies on top of X3e's change. A plain `git diff -- <paths>` in the copy would also hold X3e's own changes, because these files are already modified by X3e. The same text is in `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.imTDaR/fix.diff`.

```diff
--- a/tools/oculus/src/lib/server/core/git/state.ts
+++ b/tools/oculus/src/lib/server/core/git/state.ts
@@ -6,7 +6,9 @@
 // A state read asks git for about a dozen commands one after another, each awaited, so the event
 // loop serves requests between them and one read runs one git process at a time. A repository on a
 // slow mount must not stall a watcher: a read that fails is collapsed into the empty shape with a
-// short reason, and nothing here rejects.
+// short reason, and nothing here rejects. `readState` also says whether every command of the read
+// finished within its time limit, since a state read from a git that ran out of time is a state
+// nobody saw, which the git watcher reads again.
 
 import { existsSync, readFileSync, realpathSync } from 'node:fs';
 import { isAbsolute, join, sep } from 'node:path';
@@ -41,7 +43,8 @@
     run,
     seen,
     short,
-    whole
+    whole,
+    type Outcome
 } from './run.ts';
 import { words } from '../words.ts';
 
@@ -52,6 +55,12 @@
  */
 export const LOG_ENTRIES = 20;
 
+/** One root's state, and whether every git command of its read finished within its time limit. */
+export type StateRead = { state: GitState; finished: boolean };
+
+/** One read's git: a command run in the read's root under the read's time limit. */
+type Git = (args: string[]) => Promise<Outcome>;
+
 /** The shape every caller can count on, with nothing in it. */
 export function empty(error: string | null = null): GitState {
     return {
@@ -86,43 +95,41 @@
 }
 
 /**
- * Read-only git state for each root, keyed by root, the roots read one after another. Never
- * rejects, and `text` is the catalog a failure with no reason of git's own is worded from. A root
- * with nothing at its path, or that git answered is not a repository, comes back as the empty
- * shape with `error` set and `repository` false; `present` is false for the first of those two
- * alone, read at the path each time the answer is made, so a caller can say the folder is not
- * there rather than that it is no repository. A root whose check did not answer (a timeout, a git
- * that would not start), a root git refused for a reason other than holding no repository, and a
- * repository where a later read fails all keep `repository` true and say why in `error`, so neither
- * a slow mount nor an unreadable config makes a repository disappear. A caller renders every
- * workspace without a special case. A repeated root is read once.
+ * Read-only git state for one root, and whether every git command of the read finished within its
+ * time limit. A command whose limit ran out is the one that did not: its answer was never seen, so
+ * the state stands only until a read that finishes. Never rejects, and `text` is the catalog a
+ * failure with no reason of git's own is worded from. A root with nothing at its path, or that git
+ * answered is not a repository, comes back as the empty shape with `error` set and `repository`
+ * false; `present` is false for the first of those two alone, read at the path each time the
+ * answer is made, so a caller can say the folder is not there rather than that it is no
+ * repository. A root whose check did not answer (a timeout, a git that would not start), a root git
+ * refused for a reason other than holding no repository, and a repository where a later read fails
+ * all keep `repository` true and say why in `error`, so neither a slow mount nor an unreadable
+ * config makes a repository disappear. A caller renders every workspace without a special case.
  */
-export async function statusFor(
-    roots: string[],
+export async function readState(
+    root: string,
     text: Record<string, string>,
     timeout: number = TIMEOUT_MS
-): Promise<Record<string, GitState>> {
-    const out: Record<string, GitState> = {};
-    if (!Array.isArray(roots)) return out;
+): Promise<StateRead> {
     const ms = milliseconds(timeout);
-    for (const root of roots) {
-        if (typeof root !== 'string' || root === '' || root in out) continue;
-        try {
-            out[root] = await state(root, text, ms);
-        } catch (error) {
-            out[root] = empty(short(error));
-        }
+    let finished = true;
+    const git: Git = async (args) => {
+        const done = await run(root, args, ms);
+        if (!done.answered) finished = false;
+        return done;
+    };
+    try {
+        const found = await state(root, text, git);
+        return { state: found, finished };
+    } catch (error) {
+        return { state: empty(short(error)), finished };
     }
-    return out;
 }
 
 // ---------------------------------------------------------------- one root
 
-async function state(
-    root: string,
-    text: Record<string, string>,
-    timeout: number
-): Promise<GitState> {
+async function state(root: string, text: Record<string, string>, git: Git): Promise<GitState> {
     // A path with nothing at it is the one root git is never asked about. A path that is there and
     // is no directory, and one nothing may enter, are handed to git like any other, so the reader
     // gets git's own reason for them instead of being told the folder is gone.
@@ -135,7 +142,7 @@
     // none yet answers it like any other. Only a check that timed out says nothing about the root,
     // which is then kept as the repository it was taken for; a git that cannot start or is killed
     // is taken at its word, so a plain folder never becomes a repository because git is missing.
-    const gitDir = await run(root, ['rev-parse', '--git-dir'], timeout);
+    const gitDir = await git(['rev-parse', '--git-dir']);
     if (!gitDir.ok && gitDir.answered) {
         const reason = reasonOf(gitDir, text);
         const refused = empty(reason);
@@ -159,30 +166,32 @@
         found.error = reasonOf(gitDir, text);
         return found;
     }
-    if (!(await checkedOut(root, found, text, timeout))) return found;
-    await upstream(root, found, timeout);
-    found.log = await log(root, timeout);
-    const listed = await refs(root, timeout);
+    if (!(await checkedOut(found, text, git))) return found;
+    await upstream(found, git);
+    found.log = await log(git);
+    const listed = await refs(git);
     found.branches = listed.branches;
     found.tags = listed.tags;
     // The reflog is walked only where a stash is kept, and the remotes are read only where Publish
     // Branch can be offered, a branch that tracks nothing; either read is a process per root on
     // every event, which the repositories that have no use for it do not pay.
-    found.stashes = listed.stash ? await stashes(root, timeout) : [];
-    found.remotes = found.upstream || found.detached ? [] : await remotes(root, timeout);
-    found.worktrees = await worktrees(root, timeout);
+    found.stashes = listed.stash ? await stashes(git) : [];
+    found.remotes = found.upstream || found.detached ? [] : await remotes(git);
+    found.worktrees = await worktreesOf(root, git);
     found.ignoresWorktrees = ignored(root);
     sequenceOf(root, gitDir.text.trim(), found);
-    const listing = await run(
-        root,
-        ['status', '--porcelain=v1', '-z', '--untracked-files=normal', '--renames'],
-        timeout
-    );
+    const listing = await git([
+        'status',
+        '--porcelain=v1',
+        '-z',
+        '--untracked-files=normal',
+        '--renames'
+    ]);
     if (!listing.ok) {
         found.error = reasonOf(listing, text);
         return found;
     }
-    const counts = await run(root, ['diff', '--numstat', '-z'], timeout);
+    const counts = await git(['diff', '--numstat', '-z']);
     const lines = parseNumstat(counts.ok ? counts.text : '');
     Object.assign(found, statusLists(statusRecords(listing.text), lines, MAX_ENTRIES));
     return found;
@@ -194,18 +203,17 @@
  * so the branch it will make is read from HEAD itself: that repository is ordinary, not an error.
  */
 async function checkedOut(
-    root: string,
     found: GitState,
     text: Record<string, string>,
-    timeout: number
+    git: Git
 ): Promise<boolean> {
-    const head = await run(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
+    const head = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
     if (head.ok) {
         found.branch = head.text.trim();
         found.detached = found.branch === 'HEAD';
         return true;
     }
-    const unborn = await run(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
+    const unborn = await git(['symbolic-ref', '--short', 'HEAD']);
     if (unborn.ok) {
         found.branch = unborn.text.trim();
         return true;
@@ -219,8 +227,8 @@
  * failure rather than an empty log, which is an empty list here like every other unreadable list:
  * the branch line above it is what says the repository is there.
  */
-async function log(root: string, timeout: number): Promise<GitCommit[]> {
-    const done = await run(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
+async function log(git: Git): Promise<GitCommit[]> {
+    const done = await git(['log', `-${LOG_ENTRIES}`, LOG_FORMAT]);
     return done.ok ? parseLog(done.text) : [];
 }
 
@@ -235,12 +243,8 @@
  * list capped like the change lists. One process reads all three, where a listing each would be
  * three processes per root on every event.
  */
-async function refs(root: string, timeout: number): Promise<RefRows> {
-    const done = await run(
-        root,
-        ['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash'],
-        timeout
-    );
+async function refs(git: Git): Promise<RefRows> {
+    const done = await git(['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']);
     if (!done.ok) return { branches: [], tags: [], stash: false };
     const read = parseRefs(done.text);
     return { branches: capped(read.branches), tags: capped(read.tags), stash: read.stash };
@@ -250,18 +254,14 @@
  * Every stash, newest first, read from the stash's reflog as `stash list` reads it. A repository
  * with no stash has no such reflog and answers with a failure, which is the empty list.
  */
-async function stashes(root: string, timeout: number): Promise<GitStash[]> {
-    const done = await run(
-        root,
-        ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'],
-        timeout
-    );
+async function stashes(git: Git): Promise<GitStash[]> {
+    const done = await git(['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--']);
     return done.ok ? capped(parseStashes(done.text)) : [];
 }
 
 /** The repository's remotes by name. */
-async function remotes(root: string, timeout: number): Promise<string[]> {
-    const done = await run(root, ['remote'], timeout);
+async function remotes(git: Git): Promise<string[]> {
+    const done = await git(['remote']);
     return done.ok ? capped(done.text.split('\n').filter((one) => one.trim() !== '')) : [];
 }
 
@@ -306,7 +306,12 @@
     root: string,
     timeout: number = TIMEOUT_MS
 ): Promise<GitWorktree[]> {
-    const done = await run(root, ['worktree', 'list', '--porcelain'], timeout);
+    return worktreesOf(root, (args) => run(root, args, timeout));
+}
+
+/** The worktrees of the repository at `root`, listed through the git of one read. */
+async function worktreesOf(root: string, git: Git): Promise<GitWorktree[]> {
+    const done = await git(['worktree', 'list', '--porcelain']);
     if (!done.ok) return [];
     const real = realpath(root);
     return capped(parseWorktrees(done.text)).map((one) => ({
@@ -347,12 +352,8 @@
  * Distance from the tracking branch. `--left-right --count` prints behind, then ahead. A branch
  * with no upstream is ordinary, not an error, and leaves both counts at zero.
  */
-async function upstream(root: string, found: GitState, timeout: number): Promise<void> {
-    const done = await run(
-        root,
-        ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
-        timeout
-    );
+async function upstream(found: GitState, git: Git): Promise<void> {
+    const done = await git(['rev-list', '--left-right', '--count', '@{upstream}...HEAD']);
     // The command git answers here is the one that knows: it resolves @{upstream}, so a failure is
     // the branch having none. That fact travels with the state, which is on the page before the
     // branch listing is, so the push control never has to read a listing that has not answered as
--- a/tools/oculus/src/lib/server/root/watch/git.ts
+++ b/tools/oculus/src/lib/server/root/watch/git.ts
@@ -45,10 +45,11 @@
 // folders of which root a write just landed in. Every event adds the folder that holds the path it
 // names, relevant to git or not, to the root's window; the root's throttle timer publishes the
 // window as `{ root, folders }` (or `{ root }` when more than 64 folders came in it) when it fires,
-// and a read of the state is asked for only when a relevant event came in the window. The message
-// is published by the timer and not by the read, so a file listing is never held behind git. It is
-// this watcher's because it already watches every root recursively and already throttles the burst
-// a save makes, so no second watcher and no second throttle are needed.
+// and a read of the state is asked for when a relevant event came in the window, or when the root's
+// last read ran out of time. The message is published by the timer and not by the read, so a file
+// listing is never held behind git. It is this watcher's because it already watches every root
+// recursively and already throttles the burst a save makes, so no second watcher and no second
+// throttle are needed.
 //
 // The reads run git as child processes (server/core/git/run.ts), so the event loop serves requests
 // while they work. Each root has at most one read running and at most one waiting: a read asked for
@@ -63,6 +64,11 @@
 // opened reach the new stream as events, seconds after the first read already saw them. Each of
 // those would schedule a read that finds nothing new and name the root on the files channel for a
 // write that is not news.
+//
+// A read in which a git command ran out of time is asked for again when the root's throttle window
+// ends, as an event would ask for it, and so on until a read finishes: a root git is slow over for
+// a while (a large worktree while the machine is busy) is shown unreadable only for that while, and
+// nothing else would read it again, since a root nobody writes in sends no event.
 
 import { existsSync, lstatSync, readdirSync, watch } from 'node:fs';
 import type { FSWatcher, Stats } from 'node:fs';
@@ -71,7 +77,6 @@
 import type {
     FilesPayload,
     GitPayload,
-    GitState,
     Message,
     SessionsPayload
 } from '../../../data/model/index.ts';
@@ -84,7 +89,7 @@
     type FilePoll,
     type Timer
 } from '../../core/file-poll.ts';
-import { statusFor } from '../../core/git/state.ts';
+import { readState, type StateRead } from '../../core/git/state.ts';
 import { TIMEOUT_MS } from '../../core/git/run.ts';
 import { APP_FOLDERS, PLAIN_FOLDERS } from '../process/build-folders.ts';
 import type { Watcher } from './portfolio.ts';
@@ -325,11 +330,11 @@
 
     /**
      * When the newest read of a root that answered began. A read that came back with `error` set
-     * (a git that timed out under load, a root that is no repository) saw nothing, so the events
+     * (a root that is no repository) or with a git that ran out of time saw nothing, so the events
      * it would otherwise hide are still read for.
      */
-    const answered = (root: string, began: number, read: GitState): void => {
-        if (read.error !== null) return;
+    const answered = (root: string, began: number, read: StateRead): void => {
+        if (read.state.error !== null || !read.finished) return;
         readFrom.set(root, Math.max(began, readFrom.get(root) ?? 0));
     };
 
@@ -360,18 +365,16 @@
         if (closed || born === undefined) return;
         if (rescan.delete(root) && scan(root)) follow();
         const began = first ? born.at : Date.now();
-        let found: GitPayload;
-        try {
-            found = await statusFor([root], text, timeout);
-        } catch (error) {
-            console.error(`git watch: reading ${root} failed: ${reason(error)}`);
-            return;
-        }
+        const read = await readState(root, text, timeout);
         if (!stillOpen(root, born)) return;
-        const next = byKey(found, root);
-        if (next === undefined) return;
-        answered(root, began, next);
+        const next = read.state;
+        answered(root, began, read);
         if (first) last.set(root, Date.now());
+        // No event comes for a root nobody writes in, so the watcher asks for the next read itself.
+        if (!read.finished) {
+            wants.add(root);
+            touch(root);
+        }
         const held = byKey(state, root);
         if (held === undefined || JSON.stringify(held) !== JSON.stringify(next)) {
             state[root] = next;
@@ -507,7 +510,7 @@
         // A root nothing can be opened at is still a root the payload names: a workspace the reader
         // deleted, a link whose target was never made, a folder under a parent nothing may enter.
         // There is nothing to watch at any of them, so no watcher is made and no error is logged;
-        // what each one is, statusFor says on its own, read once below, and the views draw that.
+        // what each one is, readState says on its own, read once below, and the views draw that.
         // The watch is tried again at the next poll and config push.
         if (!existsSync(root)) {
             handles.set(root, watching);
@@ -522,7 +525,7 @@
         ];
         for (const [target, recursive, prefix] of targets) {
             // A workspace directory that holds no `.git` is an ordinary folder, not a failure: its
-            // state is the empty shape statusFor gives a directory that is not a repository, and a
+            // state is the empty shape readState gives a directory that is not a repository, and a
             // line per start saying so is noise. Only a target that is there and still refuses the
             // watch is worth saying, once.
             if (!existsSync(target)) continue;
--- a/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
+++ b/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
@@ -1,5 +1,5 @@
 // What server/git/git-index.ts's cherryPick does with a commit of another branch: a new commit on
-// the checked-out branch. The state is read by server/core/git/state.ts's statusFor.
+// the checked-out branch. The state is read by server/core/git/state.ts's readState.
 //
 // What this does NOT cover: the banner and the commit box the page draws over a cherry-pick in
 // progress.
@@ -7,7 +7,7 @@
 
 import { describe, expect } from 'vitest';
 import { cherryPick } from '../../../../src/lib/server/git/git-index.ts';
-import { statusFor } from '../../../../src/lib/server/core/git/state.ts';
+import { readState } from '../../../../src/lib/server/core/git/state.ts';
 import { it } from '../../../fixtures/scratch.ts';
 import { commitFile, git, isolateGit, scratchRepo } from './repo.ts';
 import { TEXT } from '../../text.ts';
@@ -36,6 +36,6 @@
         expect(git(root, 'log', '-1', '--format=%s').trim()).toBe('Other file');
         expect(git(root, 'rev-parse', 'HEAD').trim()).not.toBe(pick);
         expect(git(root, 'show', '--name-only', '--format=', 'HEAD').trim()).toBe('o.txt');
-        expect((await statusFor([root], TEXT))[root].sequence).toBe('');
+        expect((await readState(root, TEXT)).state.sequence).toBe('');
     });
 });
--- a/tools/oculus/tests/data/real-hub.probe.ts
+++ b/tools/oculus/tests/data/real-hub.probe.ts
@@ -13,7 +13,7 @@
 import { ENTITY_KINDS } from '../../src/lib/data/snapshot/normalise.ts';
 import { sessions } from '../../src/lib/server/sessions/index.ts';
 import { sessionFolders } from '../../src/lib/server/sessions/folders.ts';
-import { statusFor } from '../../src/lib/server/core/git/state.ts';
+import { readState } from '../../src/lib/server/core/git/state.ts';
 import type { Finding, RegistryName } from '../../src/lib/data/model/index.ts';
 import { join } from 'node:path';
 import { scratchDir, sweepScratch } from '../fixtures/scratch.ts';
@@ -126,7 +126,7 @@
 
 // The hub's own git state, through server/core/git/state.ts's four read-only commands and nothing
 // else. It reads the repository and changes nothing in it, like everything else in this file.
-const state = (await statusFor([hub], TEXT))[hub];
+const state = (await readState(hub, TEXT)).state;
 console.log(
     `git ${hub}: branch ${state.branch || '(none)'}, ahead ${state.ahead}, behind ${state.behind}, ` +
         `staged ${state.staged.length}, unstaged ${state.unstaged.length}, ` +
--- a/tools/oculus/docs/source-control.md
+++ b/tools/oculus/docs/source-control.md
@@ -8,1 +8,1 @@
-... one line in the error colour in place of the sections. What it shows is the pushed state of that repository: ...
+... one line in the error colour in place of the sections. A read in which git ran out of time is made again two seconds later, and again until one finishes, so a repository git was slow over while the machine was busy comes back on its own. What it shows is the pushed state of that repository: ...
```

The docs hunk above is shortened to the changed sentence, because the paragraph is one line. `fix.diff` holds the whole line exactly, and only that one sentence is inserted, between "in place of the sections." and "What it shows".

New file `tools/oculus/tests/server/root/watch/git-timeout.test.ts`:

```ts
// Layer 4, server test. The git watcher (server/root/watch/git.ts) over one repository whose first
// `status` outlasts the watcher's time limit, as git does on a large worktree while the machine is
// busy, and answers at once after that: the root is shown unreadable after the read that timed
// out, and readable after the read the watcher asks for next. The repository is built in a folder
// of its own and moved under the watched path before the watch opens, so no event of its making
// reaches the watch and the only read after the first is the one the watcher asks for itself. A
// `git` of the case's own, first on PATH, is the slow one; it hands every other command to the real
// git. The throttle runs on a clock the case moves.
//
// What this does not cover: a root that stays slow for several reads, and the page's drawing of
// the unreadable row.
// @module-tag slow: its case starts real git processes, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { GitPayload, GitState } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { Clock, Timer } from '../../../../src/lib/server/core/file-poll.ts';
import { watchGit } from '../../../../src/lib/server/root/watch/git.ts';
import { scratchDir, it } from '../../../fixtures/scratch.ts';
import { git, isolateGit, put } from '../../git/refs/repo.ts';
import { TEXT } from '../../text.ts';

isolateGit();

/** Milliseconds the watcher gives one git command in this case. */
const LIMIT = 2000;

/** Seconds the slow `status` waits, three times the limit. */
const SLOW = (LIMIT / 1000) * 3;

/** A clock whose timers run only when the case runs them. */
function heldClock(): Clock & { runAll(): number } {
    const due = new Map<number, () => void>();
    let next = 0;
    return {
        setTimeout(run: () => void): Timer {
            next += 1;
            due.set(next, run);
            return next;
        },
        clearTimeout(timer: Timer): void {
            due.delete(Number(timer));
        },
        runAll(): number {
            const now = [...due.values()];
            due.clear();
            for (const run of now) run();
            return now.length;
        }
    };
}

/** The `git` messages a hub publishes, with a wait for the first one a test accepts. */
function gitMessages(hub: Hub): {
    until(accept: (payload: GitPayload) => boolean): Promise<GitPayload>;
} {
    const seen: GitPayload[] = [];
    const waiting: {
        accept: (payload: GitPayload) => boolean;
        answer: (payload: GitPayload) => void;
    }[] = [];
    hub.subscribe(
        {
            send: (text: string) => {
                const message = JSON.parse(text) as { channel: string; payload: GitPayload };
                if (message.channel === 'git') {
                    seen.push(message.payload);
                    for (const one of waiting.splice(0)) {
                        if (one.accept(message.payload)) one.answer(message.payload);
                        else waiting.push(one);
                    }
                }
                return Promise.resolve();
            },
            close: () => undefined
        },
        ['git']
    );
    return {
        until(accept) {
            const found = seen.find(accept);
            if (found !== undefined) return Promise.resolve(found);
            return new Promise((answer) => waiting.push({ accept, answer }));
        }
    };
}

/** A git whose first `status` waits past the limit while the marker file is there. */
function slowOnce(dir: string, marker: string): string {
    const real = execFileSync('/bin/sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
    const bin = join(dir, 'bin');
    const script = join(bin, 'git');
    mkdirSync(bin);
    writeFileSync(
        script,
        [
            '#!/bin/sh',
            'case " $* " in',
            `*" status "*) if rm "${marker}" 2>/dev/null; then exec sleep ${SLOW}; fi ;;`,
            'esac',
            `exec "${real}" "$@"`,
            ''
        ].join('\n')
    );
    chmodSync(script, 0o755);
    return bin;
}

/**
 * A folder holding `repo`, a repository on `main` with one commit. The folder is what is moved
 * under the watched path, so the move is an event of the folder above the root, which the root's
 * watch does not hear.
 */
function repositoryIn(folder: string): string {
    const repo = join(folder, 'repo');
    mkdirSync(repo, { recursive: true });
    git(repo, 'init', '-q', '-b', 'main');
    git(repo, 'config', 'user.email', 'nobody@example.invalid');
    git(repo, 'config', 'user.name', 'Nobody');
    git(repo, 'config', 'commit.gpgsign', 'false');
    put(repo, 'kept.txt', 'one\n');
    git(repo, 'add', 'kept.txt');
    git(repo, 'commit', '-q', '-m', 'First');
    return folder;
}

describe('the git watcher after a read that timed out', () => {
    it('reads the root again and shows it readable', { timeout: 20000 }, async () => {
        const dir = scratchDir('oculus-git-timeout-');
        // The watcher keys the payload by the path it is given, and git names the real one.
        const root = join(realpathSync(dir), 'read', 'repo');
        renameSync(repositoryIn(join(dir, 'build')), dirname(root));
        const marker = join(dir, 'slow');
        writeFileSync(marker, '');
        vi.stubEnv('PATH', `${slowOnce(dir, marker)}:${process.env.PATH ?? ''}`);
        const hub = new Hub();
        const messages = gitMessages(hub);
        const clock = heldClock();
        const watcher = watchGit(hub, { always: root, clock, timeout: LIMIT, text: () => TEXT });
        try {
            const state = (payload: GitPayload): GitState | undefined => payload[root];
            const failed = await messages.until((payload) => state(payload)?.error != null);
            expect(state(failed)?.error).toBe(
                TEXT['server.git.timed_out']
                    .replace('{0}', TEXT['server.git.program_git'])
                    .replace('{1}', String(LIMIT / 1000))
            );
            expect(
                clock.runAll(),
                'reads the watcher has asked for after the timeout'
            ).toBeGreaterThan(0);
            const read = await messages.until((payload) => state(payload)?.error === null);
            expect(state(read)?.branch).toBe('main');
        } finally {
            watcher.close();
            vi.unstubAllEnvs();
        }
    });
});
```