# Step O82 refuter report (on .agents/worktrees/migration-O82, base 4959cb90)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands below ran from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O82`, in the foreground, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The reviewer's copies of the programs, its own programs (`words-vite.mjs`, `limits.ts`) and the outputs were kept in the scratch folder `o82-refute/`, deleted at the end of the review as the dispatch asked; the builder's programs stay in `o82-build/`. The worktree's `git status --short` lists the same 21 paths after the review as before it.

```
$ npm run test:quick -- --base 4959cb90        (exit 0)
test:quick: 21 changed file(s), from git since 4959cb90
test:quick: 94 test file(s)
        tests/server/machine/runs/recover/runs.test.ts: imports at depth 1
        ...
        tests/data/hubs/hub-portfolio.test.ts: imports at depth 2
        ...
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (14.2 s)
ok      eslint (85.3 s)
ok      svelte-check (104.6 s): 1793002978384 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (114.6 s): Duration  101.47s (transform 222.15s, setup 0ms, import 314.85s, tests 85.61s, environment 935ms)
ok      vitest slow (125.7 s): Duration  112.54s (transform 15.84s, setup 0ms, import 117.28s, tests 275.93s, environment 6ms)
ok      vitest checks (130.3 s): Duration  117.03s (transform 65.43s, setup 0ms, import 141.97s, tests 113.46s, environment 2ms)
test:quick: 144.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files

$ sh utils/unused-exports.sh > o82-refute/unused-after.txt; diff ../O82-base/unused-exports.txt o82-refute/unused-after.txt
236c236
< src/lib/data/model/index.ts: Chip, MailAccountStatus, MailStatus, CalendarAccountStatus, CalendarProvider, CalendarStatus, GitMergeDeleted, HpcStatus
---
> src/lib/data/model/index.ts: Chip, MailAccountStatus, MailStatus, CalendarAccountStatus, CalendarProvider, CalendarStatus, GitMergeDeleted
238c238
< src/lib/data/model/model-sessions.ts: GitMergeDeleted, HpcStatus
---
> src/lib/data/model/model-sessions.ts: GitMergeDeleted
(341 lines before and after; no line added)

$ grep -rn "unreachable_msg" src        (verify 4; grep in place of git grep, which is outside the reviewer's three git commands)
src/lib/state/system/machine/hpc/hpc.ts:41:        return { word: t('hpc.unreachable'), sentence: t('hpc.unreachable_msg') };

$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml        (verify 5)
(nothing, rc=1)

$ LC_ALL=C grep -n '[^ -~]' <every changed file but the svg, and the report>
(nothing, rc=1); LC_ALL=C grep -c '[^ -~]' on each of the four svg files: 0 0 0 0

$ git diff 4959cb90 -U0 -- src config docs/apps.md tests | grep '^+' | grep -v '^+++' | grep -n -i -w "before\|still\|no longer\|used to\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|now\|today"
147:+ * with its message. A timeout before the connected marker is ssh not connecting, with the word
148:+ * `timeout`; one after the marker and before the last Slurm section began is Slurm not answering;

$ node cases.ts <worktree>        (the builder's program, copied from o82-build; byte-identical to the source quoted in the report)
68 lines, identical to the report's "Output after the change" block (diff printed nothing). Among them:
case 2 (good, then marker, squeue rc 1, Slurm line in its own section)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 lastOk=kept retryMin=2
case 4b (runner timeout after SEC_SINFO, Recover section slow)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="Slurm answered, and the rest of the poll ran past its time limit" jobs=1 lastOk=kept retryMin=2
case 7 (code 255, marker, rc 0)
  status=ok hint=undefined jobs=1 lastOk=kept retryMin=2
  status=error hint="Connection to x closed by remote host." jobs=1 lastOk=kept retryMin=2
case 7b (cancel, log with a runner timeout)
  cancel="rejected with message \"timeout\"" log={"status":"timeout","log":"","path":""}
case 7c (slurm_down answer after the host changed)
  published: starting@cluster, starting@other batch calls=2

$ node cases.ts <scratch copy of O82-base src and hpc.yml, node_modules linked to the worktree's>
62 lines, identical to the report's "The cases' first run, on the unchanged tree" block (diff printed nothing).

$ node shell-cases.ts <worktree> o82-refute/shell
squeue answers: status=ok hint=undefined jobs=1 recent=1 tmp left=[]
squeue fails with Slurm message: status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=0 recent=0 tmp left=[]
timeout stops squeue (124): status=slurm_down hint="LATE" jobs=0 recent=0 tmp left=[]
(identical to the report)

$ node words-vite.mjs <worktree> o82-refute/vitecache        (the reviewer's stand-in for client-cases.mjs: Vite with the Svelte plugin alone, no config file, its cache in the scratch folder; see "Declined to judge")
failureWords(unreachable) = {"word":"unreachable","sentence":"The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?"}
failureWords(slurm_down) = {"word":"Slurm down","sentence":"The cluster was reached over ssh, and Slurm did not answer."}
failureWords(error) = {"word":"error","sentence":"The poll of the cluster failed."}
failureWords(ok) = null
failureWords(starting) = null
failureWords(unconfigured) = null
hpcWords(unreachable) = {"short":"unreachable","long":"The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN?"}
hpcWords(slurm_down) = {"short":"Slurm down","long":"The cluster was reached over ssh, and Slurm did not answer."}
hpcWords(error) = {"short":"error","long":"The poll of the cluster failed."}
(the three hpcWords lines equal the report's case 12 output after the change)

$ npx vitest run tests/server/machine/runs/recover/runs.test.ts --reporter=verbose
 <check mark> |unit| tests/server/machine/runs/recover/runs.test.ts > a Recover run on the cluster > runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise 2ms
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ npx vitest run tests/checks/tree/duplication.test.ts        (exit 1)
     <multiplication sign> is not held anywhere under tests 204ms
+   "tests/data/sources/config/layers/language.test.ts:160 and tests/server/root/process/config-cache.test.ts:269 hold the same 9 lines (e246b55c4e52)",
 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)

$ git diff 4959cb90 --stat -- tests/data/sources/config/layers/language.test.ts tests/server/root/process/config-cache.test.ts tests/data/hubs/hub-portfolio.test.ts tests/checks/tree/duplication.test.ts
(nothing)
$ diff -rq ../O82-base/tests tests
Files .../O82-base/tests/checks/tree/allow-duplication.txt and tests/checks/tree/allow-duplication.txt differ

$ npx vitest run tests/checks/imports/order.test.ts tests/checks/imports/cycles.test.ts tests/checks/tree/size.test.ts --testTimeout 0        (tree checks test:quick did not choose; the step adds imports across state folders)
 Test Files  3 passed (3)
      Tests  30 passed (30)

$ node limits.ts <worktree>; node limits.ts <scratch base copy>        (the reviewer's case-run program for Spec 1; same output on both trees)
sacct stopped by timeout 8 (section empty, exit of the last command 0)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1
  status=ok hint=undefined jobs=1 recent=0 sinfo=1
sinfo stopped by timeout 5 (section empty, the remote exits 124)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1
  status=ok hint=undefined jobs=1 recent=1 sinfo=0

$ TMPDIR=o82-refute/tmp /bin/sh -c '<batchCommand's mktemp, a missing command in timeout's place with 2>"$oculus_err", echo rc=$?, cat, rm>'
rc=127
@@err@@
/bin/sh: line 1: timeout_absent_zz: command not found
(the same under /bin/zsh: rc=127, "zsh:2: command not found: timeout_absent_zz"; the tmp folder empty after)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `answerFailure` (`poll.ts:156-175`) first returns null for an answer with `SEC_SACCT`, `squeueCode` 0 and a code other than 255 (the brief's "read as today, with or without the marker"), then `unreachable` for no marker with 255, then `slurm_down` for the marker with a `SEC_RC` other than 0 (whatever the exit code), then `error`. `rejectionFailure` (`poll.ts:183-190`) gives `error` to a rejection that is not a timeout (no definition of `unreachable` or `slurm_down` in item 1 can hold for it, so taking it first changes no outcome), then `unreachable` for a timeout without the marker, `slurm_down` before `SEC_SINFO`, `error` with the overrun hint after it. Every input item 1 names gives its status in the rerun of `cases.ts`, last good rows, `lastOk` and `retryMin=2` on each. Spec 1 is an input item 1 does not list.
- 2: holds. Case 11 after the change: the marker first, `timeout 12 squeue ... 2>"$oculus_err"` with `echo "@@oculus:squeue_rc=$?"` on the next line, no pipe or subshell around it, `timeout 8 sacct`, `timeout 5 sinfo`; `recoverCommand` with the marker and `timeout 12 squeue`. `RunTimeout` (`ssh.ts:44-53`) has the message `timeout` and the stdout held when the timer fired (`ssh.ts:85`); case 7b and `shell-cases.ts` reproduce. The consequence of the `sacct` and `sinfo` limits is Spec 1.
- 3: holds. `publishQuota` and `recover()` (`poll.ts:273-288`, `:465-480`) have no hunk in `git diff 4959cb90`; case 10 prints `recover() sent 0 commands`; G115's file passes 16 of 16.
- 4: holds. `model-sessions.ts:621` holds `'slurm_down'`; `docs/apps.md:421` lists it with a clause on each failure word.
- 5: holds. `hpc.yml` gains `slurm_down`, `slurm_down_msg`, `error_msg` and three hint sentences; verify 4 prints one hit, inside `status === 'unreachable'` (`hpc.ts:40-41`). The `unreachable_detail` form is reused for every failure's sentence and hint, as item 5 asks for `slurm_down`; its key name now formats three failures, and renaming a catalog key a hub's text may override is a change the brief did not ask for, so it is not a finding.
- 6: holds. `failureWords` (`hpc.ts:39-48`) is the one map from a failure to its word and sentence; `Head.svelte:32-33,37,52,84,88`, `Hpc.svelte:68-75,102-104,119` and `hpcWords` (`status.ts:192-193`) read it; the `words-vite.mjs` run gives each failure its own short word and long sentence. The views are proved by the look on landing.
- 7: holds. No test added or changed (`diff -rq ../O82-base/tests tests` lists only the allow list); the G115 fakes at `runs.test.ts:479` and `:503` are unchanged and the file passes; the authentication sentence is the report's judgment call 9.

Cases of the brief's "Cases":

- 1: met, `cases.ts` rerun: `status=unreachable hint="ssh: connect to host x port 22: Operation timed out" jobs=1 lastOk=kept`.
- 2: met, `slurm_down` with Slurm's line as hint.
- 3: met, `slurm_down hint="no answer within the time limit"`.
- 4: met, 4a `slurm_down` with the limit sentence; 4b `error hint="Slurm answered, and the rest of the poll ran past its time limit"`.
- 5: met, 5a and 5b `unreachable hint="timeout"`.
- 6: met, `error hint="spawn ssh ENOENT"`.
- 7: met, `error` for code 0 with `SEC_RC` 0 and no `SEC_SACCT`; `slurm_down` for 255 with the marker and `SEC_RC` 1; `error` for 255 with the marker and `SEC_RC` 0.
- 7a: met, the hint is Slurm's line with the ssh warning on the merged stderr left out.
- 7b: met, with the builder's correction, which holds: `cancel` (`actions.ts:33-43`) has no catch, so a runner timeout rejects it with the message `timeout`; `log` (`actions.ts:73-77`) answers `{"status":"timeout",...}`. Both are the same before and after (the two `cases.ts` runs), and the property item 2 guards, a timeout message that still contains `timeout`, holds.
- 7c: met, `published: starting@cluster, starting@other batch calls=2`.
- 8: met, `ok`, then `slurm_down ... jobs=1 lastOk=kept`, then `ok`.
- 9: met, `unreachable hint="the cluster x has no host" jobs=0 lastOk=none`.
- 10: met, `recover() sent 0 commands`.
- 11: met, the command text quoted under item 2.
- 12: met for the status bar by the `words-vite.mjs` run, for `Head.svelte`, `Hpc.svelte` and `Login.svelte:104-105` by reading; the look on landing is the proof for the view.
- 13: met, `runs.test.ts` 16 of 16, and green inside the reviewer's `npm run test:quick`.

## 1. Spec

- `src/lib/server/machine/hpc/poll.ts:117-120` with `:162`: "`timeout ${SACCT_SECS} sacct -u "$USER" ...`", "`timeout ${SINFO_SECS} sinfo -h -o '%P|%a|%D|%t|%G'`" and "`if (result.stdout.includes(SEC_SACCT) && parts.squeueCode === 0 && !broke) return null;`"; what is wrong: the step's line in `plan.md` (ruling 428) counts "a timeout after the connection is made while a Slurm command runs" as Slurm not answering and asks that the last good poll stay on screen. The build puts `sacct` and `sinfo` under remote limits (item 2), records neither command's code, and reads an answer whose `sacct` or `sinfo` was stopped by its limit as a good poll: the section is empty, `rows` is replaced and `lastOk` is stamped. The reviewer's `limits.ts` run gives `status=ok ... recent=0` after a good poll with `recent=1`, and `status=ok ... sinfo=0` after `sinfo=1`. Item 1 defines `slurm_down` by `squeue`'s code and runner timeouts only, so the brief does not cover this input either; the builder found it and wrote it under "Limitations and sharp edges" rather than handing it back as an input the brief's rules get wrong. Failure scenario: the accounting daemon answers `sacct` in 9 to 30 s (inside the old 40 s budget, which gave `ok` with the full Recent table); after the change every poll shows the head as live, "Recent (finished) - 0" and an empty Recent table, the last good recent jobs gone, and no failure word anywhere; with `sinfo` slower than 5 s the Capacity table empties the same way. What would end it is a decision on what a stopped `sacct` or `sinfo` means (record their codes and treat 124 as `slurm_down`, or keep that section's last good rows), which item 1 does not make; verdict: none of the items as written, it falls under the step line's "Slurm not answering" and "the last good poll kept on screen".

## 2. Proof

none. Every count, path and output the report quotes was reproduced (the two `cases.ts` runs, `shell-cases.ts`, the case 12 words, the unused-exports difference, verify 4 and 5, the history grep, the line counts of the changed files, the G115 run, the portfolio file alone). The builder's red line of `npm run test:quick` did not reproduce: the reviewer's run chose the same 94 test files, `tests/data/hubs/hub-portfolio.test.ts` among them, and passed. That file reaches the diff only through `src/lib/data/model/index.ts` re-exporting `model-sessions.ts` (`index.ts:663-664,827`), whose change is the `HpcStatus` type and its comment, erased at run time, so nothing in the diff reaches its behaviour; its 20000 ms timeout in the builder's run is a time-out of the slow tier and the file passes alone. The `duplication.test.ts` failure reproduces run alone: "is not held anywhere under tests" on `language.test.ts:160` and `config-cache.test.ts:269`, two files with no hunk since the base; the only test-tree change is the allow list's `src` entry (`parse.ts` with `hpc.ts`), which the failing case does not match, and the `src` case passes (17 of 18 pass). Neither red line is the step's, under the rules file's "Verify before you report".

## 3. Standards

- `src/lib/server/machine/hpc/poll.ts:50`, `:163-165`, `:171`, `:188-189` and `:217`: "`words?: PollWords;`", "`(words === undefined ? undefined : fillPlaceholders(words.sshExited, [result.code]))`", "`words?.slurmLate`", "`...(options.words === undefined ? {} : { words: options.words })`"; what is wrong: the rules file's principles ("nothing is built for a need the plan does not name") and the refute standard on code larger than its job: `words` is optional only so the G115 test (`runs.test.ts:487`) can build the options without it, as the report's judgment call 3 says. Every production caller passes it (`host.ts:83`, `words: words.poll`, through `pollers.ts:81` and `live-settings.ts:112`), so the `undefined` branches serve an input only a test produces. Adding `words` to the test's options changes neither G115 fake nor any row's meaning, which item 7 allows. Failure scenario: a later caller of `watchHpc` that omits `words` type-checks and publishes `slurm_down` for a `squeue` stopped by its limit, or `error` for an overrun, with no hint and no sign that the sentence was dropped; the reader sees "Slurm did not answer" with no "no answer within the time limit" under it. Low cost; verdict: none.

## 4. Behaviour

none. Each host- or user-visible change has its before and after in the report: the `Slurm down` pill, error box, Login node reason and status bar; the `error` sentence in the box and the tooltip; the 255-with-sections answer read as a failure (judgment call 6); the `mktemp` file created and removed on the login node at every poll (judgment call 2, reproduced with `tmp left=[]`); `squeue` slower than 12 s published `slurm_down` (judgment call 1); a login node without GNU `timeout` published `slurm_down` on every poll (reproduced: the shell's 127 and its "command not found" line land in `squeue`'s own section, so the hint names the cause while the sentence says Slurm did not answer; premise 6 shows the cluster has `timeout`); the empty `sacct` or `sinfo` section under `ok` (Spec 1).

Notes on the points the review was asked to judge, with no finding:

- The remote command: `oculus_err=$(mktemp 2>/dev/null) || oculus_err=/dev/null` falls back when `mktemp` fails; the redirect is part of the timed `squeue`'s simple command, so the `$?` on the next line is `squeue`'s or `timeout`'s code (shell run above: `rc=127` for a missing command, `shell-cases.ts`: 124 and 1 read as `slurm_down`); `[ "$oculus_err" = /dev/null ] || rm -f "$oculus_err"` never removes `/dev/null`. The limits are item 2's numbers (12, 8, 5, with `ConnectTimeout=8` 33 s of 40 s before Recover's section).
- The files outside the write list: `host.ts` carries the three hint sentences from the catalog to the poll through the existing `hostWordsOf` and `hpcSettingsOf`, which `live-settings.ts:197-202` already rereads on every config push, needed because a sentence a reader sees comes from a catalog (rules file, "What every package obeys"); `hpc.ts` with `failureWords` keeps the failure-to-words rule in one place for three readers; the `status.ts` import line (`:51`) is needed by `hpcWords`; the allow list edit changes only the reason's line numbers of an existing entry (the check reads the pair and the mark, `duplication.test.ts:105-112`), with its before and after in the report, and the lines named (`parse.ts:29`, `hpc.ts:21`) hold the clone; the diagrams change one edge count each, and `tests/checks/diagrams/diagrams.test.ts` passed in the reviewer's `npm run test:quick`. The import order, cycle and size checks, which `npm run test:quick` did not choose, pass.
- Tests: no entry of `agents/guarded.md` covers the poll's status (G115's Code line names `recover` of `poll.ts`, whose body has no hunk; `recoverCommand`'s new text gives `recover()` no outcome it lacked, since a stopped `squeue` is a non-zero code it already drops). G34 (`cancel` and `log`) names `actions.ts`, which has no hunk, and its tests ran in the reviewer's `npm run test:quick`. A wrong status word loses no work, breaks no installation and accepts no wrong configuration, so under the rules file's test rule no test is owed and none is present.

## Declined to judge

- `npm run diagrams`, not run: it writes into the worktree. The diagram files are judged by `tests/checks/diagrams/diagrams.test.ts`, green in the reviewer's `npm run test:quick`.
- `client-cases.mjs` in its own form, not run: it loads the worktree's `vite.config.ts`, whose `devPort()` calls `loadMachine` over the open workspace (`vite.config.ts:43-45,466`, `config/machine.ts:185-187`), which reads the hubs' machine-local files, the hub's `.oculus/local.yml` among them, a file the reviewer may not read. `words-vite.mjs` loads the same `hpcWords` through Vite with the Svelte plugin alone and no config file; its three `hpcWords` lines equal the report's.
- Case 12 on the unchanged tree, not run: read from `git diff 4959cb90` of `status.ts` (before, `slurm_down` fell to the live counts and `error`'s long text was the bare word), which agrees with the report's first run.
- The remote command on the cluster, not run: no ssh is opened. Checked by the local `sh` run of `shell-cases.ts` and the reviewer's `sh` and `zsh` probe.
- Whether 12, 8 and 5 s turn a slow but answering cluster into `slurm_down` or into Spec 1's empty tables: no healthy time of `squeue`, `sacct` or `sinfo` on the cluster is on file; a timed run of each on the cluster, through `sbatch` or a non-computing read the rules allow, would settle it.
- The views on screen (the pill's `bad` class, the error box, the Login node reason, the status bar tooltip): the look on landing on TEST.
- Whether `duplication.test.ts`'s `tests` case also fails at the base, not run: the base copy has no `node_modules`. By the reading above it does; a run of that file in a checkout at 4959cb90 would settle it.
- The number of the builder's verify-list runs (one): read from its `quick.log`, which holds one run; no command shows how many it started.

Reviewer usage: a2050ca41ab3495b9, claude-opus-5-5, 289965 tokens, 81 tool uses, 23 min 25 s.

## Repair round 1, refuted

All commands below ran from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O82`, in the foreground, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The round's delta was built by the reviewer as the skill's "Over a repair round" 3 says: `diff -u` of each path of `../migration-O82-round-1/files.txt` against the worktree (hunks only in `parse.ts`, `poll.ts` and `allow-duplication.txt`), plus `git diff 4959cb90 -- tests/server/machine/runs/recover/runs.test.ts` (one added line). The orchestrator's copy `o82r1-delta.diff` holds the same three file hunks and lacks the `runs.test.ts` part. The builder's programs were copied from `o82-build/` into the reviewer's scratch folder; `rcases.ts` and `shell-cases.ts` are byte-identical to the sources the report quotes (`diff` printed nothing). The "before" runs used a scratch tree: the worktree's `src` and `config` with the snapshot's copies laid over them and `node_modules` linked to the worktree's. The reviewer's own programs (`edges.ts`, `recover.ts`, `glued.ts`) print only. `git status --short` lists the same 23 paths after the review as before it.

```
$ npm run test:quick -- --base 4959cb90        (exit 0)
test:quick: 23 changed file(s), from git since 4959cb90
test:quick: 94 test file(s)
        tests/server/machine/runs/recover/runs.test.ts: changed
        ...
ok      ASCII gate (0.9 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.4 s)
ok      eslint (59.2 s)
ok      svelte-check (66.4 s): 1793005164905 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (70.8 s): Duration  63.14s (transform 137.67s, setup 0ms, import 197.75s, tests 51.07s, environment 955ms)
ok      vitest slow (78.5 s): Duration  71.02s (transform 7.56s, setup 0ms, import 67.20s, tests 159.61s, environment 5ms)
ok      vitest checks (82.7 s): Duration  75.13s (transform 37.95s, setup 0ms, import 87.97s, tests 78.22s, environment 2ms)
test:quick: 85.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files

$ npx vitest run tests/server/machine/runs/recover/runs.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ sh utils/unused-exports.sh > o82r1-refute/unused-after.txt; diff ../O82-base/unused-exports.txt o82r1-refute/unused-after.txt
236c236
< src/lib/data/model/index.ts: Chip, MailAccountStatus, MailStatus, CalendarAccountStatus, CalendarProvider, CalendarStatus, GitMergeDeleted, HpcStatus
---
> src/lib/data/model/index.ts: Chip, MailAccountStatus, MailStatus, CalendarAccountStatus, CalendarProvider, CalendarStatus, GitMergeDeleted
238c238
< src/lib/data/model/model-sessions.ts: GitMergeDeleted, HpcStatus
---
> src/lib/data/model/model-sessions.ts: GitMergeDeleted
(341 lines before and after; no line added; the four new markers of parse.ts are imported by poll.ts:22-26)

$ grep -rn "unreachable_msg" src        (verify 4; grep in place of git grep, which is outside the reviewer's three git commands)
src/lib/state/system/machine/hpc/hpc.ts:41:        return { word: t('hpc.unreachable'), sentence: t('hpc.unreachable_msg') };

$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml        (verify 5)
(nothing, rc=1)

$ git diff 4959cb90 -U0 -- src config docs/apps.md tests | grep '^+' | grep -v '^+++' | grep -n -i -w "before\|still\|no longer\|used to\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|now\|today"
208:+ * with its message. A timeout before the connected marker is ssh not connecting, with the word
209:+ * `timeout`; one after the marker and before the last Slurm section began is Slurm not answering;
(the two hits of the first build, in rejectionFailure's doc comment; both name a place in the command's output)

$ LC_ALL=C grep -c '[^ -~]' <each path of git status --short but the svg files, the report and the round brief included>
0 on every one of the 19 paths; LC_ALL=C grep -c '[^ -~]' docs/diagrams/*.svg: 0 on each

$ node rcases.ts <worktree>        (R1 to R5 after; console "hpc publish" lines filtered; identical to the report's "After the change" block)
R1 (sacct stopped by its limit, 124)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1 lastOk=set
  status=slurm_down hint="no answer within the time limit" jobs=1 recent=1 sinfo=1 lastOk=kept
R2 (sinfo stopped by its limit, 124)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1 lastOk=set
  status=slurm_down hint="no answer within the time limit" jobs=1 recent=1 sinfo=1 lastOk=kept
R3 (sacct exits 1 with its error)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1 lastOk=set
  status=slurm_down hint="sacct: error: Problem talking to the database: Connection refused" jobs=1 recent=1 sinfo=1 lastOk=kept
R4 (squeue and sacct both fail with their own lines)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1 lastOk=set
  status=slurm_down hint="slurm_load_jobs error: Unable to contact slurm controller (connect failure)" jobs=1 recent=1 sinfo=1 lastOk=kept
R5 (G115 good fake, no sacct or sinfo code line)
  status=ok hint=undefined jobs=1 recent=1 sinfo=1 lastOk=set
  status=ok hint=undefined jobs=0 recent=0 sinfo=0 lastOk=stamped anew

$ node rcases.ts <scratch tree of the round's snapshot>        (R1 to R5 before; one line differs from the report)
R3 second publish: status=ok hint=undefined jobs=1 recent=0 sinfo=1 lastOk=kept        (report: lastOk=stamped anew)
every other line identical to the report's "Before the change" block

$ node shell-cases.ts <scratch tree> o82r1-refute/shellb; node shell-cases.ts <worktree> o82r1-refute/shella        (R6; both identical to the report)
timeout stops sacct (124): status=ok hint=undefined jobs=1 recent=0 tmp left=[]        (before)
timeout stops sacct (124): status=slurm_down hint="LATE" jobs=0 recent=0 tmp left=[]   (after)
(the other three lines the same before and after; ls -A of each of the eight tmp folders: 0 files)

$ node cases.ts <scratch tree>; node cases.ts <worktree>        (R7; each identical to the builder's r7-before.txt and r7-after.txt, the after run identical to the report's lines 1028-1101)
diff of the two runs: only case 11's batchCommand text (the rm line moved after sinfo's section; 2>"$oculus_err", the rc echo, the err marker and the cat after sacct and after sinfo)

$ node edges.ts <worktree> o82r1-refute/edge        (the reviewer's program; 15 ms between the two polls)
L1 sacct 124, 15 ms between polls: first=ok second=slurm_down hint="LATE" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
L2 sacct exits 1, 15 ms between polls: first=ok second=slurm_down hint="sacct: error: X" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
E1 squeue 1 with empty stderr, sacct 124: first=ok second=slurm_down hint=undefined jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
E2 sacct 1, stderr with a blank first line: first=ok second=slurm_down hint="sacct: error: second line" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
E3 sinfo 1 with its message: first=ok second=slurm_down hint="sinfo: error: Y" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
E4 no marker, code 0, sacct rc 1: first=ok second=error hint="ssh exited 0" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
E5 G115 down fake (255, no marker): first=ok second=unreachable hint="ssh: down" jobs=1 recent=1 sinfo=1 lastOk equal to the first poll's
S1 squeue warns, sacct fails, sinfo silent: exit=0 codes=0/1/0 errs=["squeue: warning Q","sacct: error: X",""] sacctSection="" recover="recover-part\n" status=slurm_down hint="sacct: error: X" tmp left=[]
S2 squeue warns, sacct fails silent: exit=0 codes=0/1/0 errs=["squeue: warning Q","",""] sacctSection="" recover="recover-part\n" status=slurm_down hint=undefined tmp left=[]
S3 sinfo fails after sacct wrote stderr and exited 0: exit=0 codes=0/0/1 errs=["","sacct: note S",""] sacctSection="9|done-a|COMPLETED|0:0|00:01|2026-10-26T10:00:00|4G|1G|00:01|1|1|60" recover="recover-part\n" status=slurm_down hint=undefined tmp left=[]
S4 sacct stopped mid-line by timeout: exit=0 codes=0/0/0 errs=["","",""] sacctSection="9|done-a|COMPLE@@oculus:sacct_rc=124" recover="recover-part\n" status=ok hint=undefined tmp left=[]
S5 no mktemp file, sacct fails: exit=0 codes=0/1/0 errs=["","",""] sacctSection="" recover="recover-part\n" status=slurm_down hint=undefined tmp left=[]

$ node glued.ts <worktree>        (the reviewer's program: parseSacct over S4's section)
glued alone: []
one full row, then glued: 1 rows

$ node recover.ts <worktree>        (the reviewer's program: every poll's sacct exits 1, squeue answers one job, then watcher.recover())
every poll's sacct exits 1: status=slurm_down hint="sacct: error: accounting storage is disabled" jobs=0 take calls=0 commands sent=["poll"]

$ git show 4959cb90:tests/server/machine/runs/recover/runs.test.ts | sed -n 492,493p; sed -n 492,494p tests/server/machine/runs/recover/runs.test.ts
                prewarm: false,
                recover: { command: () => 'echo section', take },
                prewarm: false,
                words: { sshExited: 'ssh exited {0}', slurmLate: 'late', overrun: 'overrun' },
                recover: { command: () => 'echo section', take },
(the report's before and after lines; it read the before side with git show HEAD:, which the reviewer read at the base instead)

$ git diff 4959cb90 --stat -- tests/server/machine/runs/recover/runs.test.ts
 tests/server/machine/runs/recover/runs.test.ts | 1 +

$ wc -l src/lib/server/machine/hpc/poll.ts src/lib/server/machine/hpc/parse.ts tests/server/machine/runs/recover/runs.test.ts tests/checks/tree/allow-duplication.txt
564, 251, 537, 21        (the report's "after" counts)

$ npx vitest run tests/checks/tree/duplication.test.ts        (exit 1; the allow list changed in the round and test:quick does not choose this file)
     <multiplication sign> is not held anywhere under tests 171ms
+   "tests/data/sources/config/layers/language.test.ts:160 and tests/server/root/process/config-cache.test.ts:269 hold the same 9 lines (e246b55c4e52)",
      Tests  1 failed | 17 passed (18)
(the same failure the first refutation found on two files with no hunk since the base; the src case, which reads the parse.ts and hpc.ts entry, passes)

$ grep -rn "splitSections\|SEC_SACCT_RC\|SEC_SINFO_RC\|SEC_SACCT_ERR\|SEC_SINFO_ERR\|sacct_rc\|sinfo_rc" src tests docs config --exclude=local.yml | grep -v "hpc/parse.ts\|hpc/poll.ts"
(nothing)

$ grep -rn "codeOf\|slurmHint\|replace(/@+\$/" src tests
src/lib/server/content/literature/ask.ts:51:function codeOf(text: string, secrets: string[]): string | undefined {
src/lib/server/accounts/connect/api.ts:35:function codeOf(body: unknown): string {
(plus the new ones in parse.ts and poll.ts; neither earlier codeOf reads a return code line)
```

The R3 "before" line that did not reproduce is an artefact of the program: `show` in `rcases.ts` compares the two `lastOk` strings, which are ISO times to the millisecond, and two polls in the same millisecond read "kept". The "after" claims do not rest on it: `lastOk` is assigned only on the good path (`poll.ts:374`), and `edges.ts` L1 and L2, with 15 ms between the polls, give "lastOk equal to the first poll's". No decision rests on the before line, so it is not a finding.

### Verdicts

Items of `O82.md`'s "What to build", over the whole diff since the base:

- 1: holds. `answerFailure` (`poll.ts:187-205`) returns null only for an answer with `SEC_SACCT`, all three codes 0 and a code other than 255; then `unreachable` for no marker with 255; then `slurm_down` for the marker with any code not 0; then `error`. `rejectionFailure` (`poll.ts:213-220`) is unchanged in behaviour. Cases 1 to 10 rerun identical to the report; the last good rows, `lastOk` and `retryMin=2` on each failure (`degraded`, `poll.ts:280-290`, has no hunk in the round). See Spec 1 and Spec 2.
- 2: holds. Case 11: the marker first, `timeout 12 squeue`, `timeout 8 sacct`, `timeout 5 sinfo`, each followed directly by its return code line (`poll.ts:117-118`, `:122-123`, `:127-128`); `recoverCommand` (`poll.ts:140-148`) has no hunk in the round and its case 11 text is the same before and after. `RunTimeout` in `ssh.ts` has no hunk in the round.
- 3: holds. `publishQuota` and `recover()` (`poll.ts:303-318`, `:495-510`) have no hunk; case 10 prints `recover() sent 0 commands`; G115's file passes 16 of 16.
- 4: holds. No hunk in `model-sessions.ts` or `docs/apps.md` in the round; `docs/apps.md:421` ("`slurm_down` when ssh connected and Slurm did not answer") stays true for a `sacct` or `sinfo` that fails.
- 5: holds. No hunk in `hpc.yml` in the round; verify 4 prints one hit, inside `status === 'unreachable'`.
- 6: holds. No hunk in the readers in the round; case 12 as in the first refutation.
- 7: holds. The one change to `runs.test.ts` is the `words` line the round brief asks for (item 2 of the round); the fakes at `:479` and `:503` and every assertion are unchanged (`git diff 4959cb90 --stat`: `1 +`); the file passes 16 of 16.

Items of `O82-round1.md`:

- 1: holds. `batchCommand` records each code with a line of its own after its timed command, no pipe or subshell; `splitSections` (`parse.ts:201-251`) reads `sacctCode` and `sinfoCode`, 0 when the line is absent, and the three stderr sections; `answerFailure` gives `slurm_down` over the last good rows with `lastOk` not stamped (R1 to R4, L1, L2, E3). The shared file: S1 to S3 show each `2>` truncating it, each `cat` printing only its own command's text (S2's `sacct` section is empty although `squeue` wrote "squeue: warning Q" before it; S3's `sinfo` section is empty although `sacct` wrote "sacct: note S"), and the one `rm` (`poll.ts:131`) running on every path the shell reaches (every local run, the eight of `shell-cases.ts` and S1 to S5 of `edges.ts`, leaves its tmp folder empty; S5 is the `/dev/null` fallback). Each `$?` line is the line right after its timed command. The doc comments of `batchCommand`, `answerFailure`, `splitSections` and the head comment name the three commands. The accounting-off sentence is at report line 728. See Spec 1, Spec 2, Standards 1 and Behaviour 1.
- 2: holds. `HpcSettings.words: PollWords` (`poll.ts:54`); `HpcOptions` is `HpcSettings & {...}`; `watchHpc` copies `words: options.words` (`poll.ts:247`); `answerFailure`, `rejectionFailure` and `slurmHint` take `PollWords` and hold no `undefined` branch (`grep -n "words" poll.ts`: every use is `words.<key>`). Production sets it at `host.ts:83`; svelte-check reports 0 errors. The fixture line is the only test change, and the file passes. The first refutation's Standards 1 is closed by the fix it asked for, with no check removed.

Cases of `O82.md` (R7 rerun with `cases.ts`, before and after the round):

- 1: met, `status=unreachable hint="ssh: connect to host x port 22: Operation timed out" jobs=1 lastOk=kept`.
- 2: met, `slurm_down` with Slurm's line as hint.
- 3: met, `slurm_down hint="no answer within the time limit"`.
- 4: met, 4a `slurm_down` with the limit sentence, 4b `error` with the overrun sentence.
- 5: met, 5a and 5b `unreachable hint="timeout"`.
- 6: met, `error hint="spawn ssh ENOENT"`.
- 7: met, `error` for code 0 with no `SEC_SACCT`; `slurm_down` for 255 with the marker and `SEC_RC` 1; `error` for 255 with the marker and `SEC_RC` 0.
- 7a: met, Slurm's line as hint, the ssh warning left out.
- 7b: met, `cancel="rejected with message \"timeout\"" log={"status":"timeout",...}`, as the first refutation accepted.
- 7c: met, `published: starting@cluster, starting@other batch calls=2`.
- 8: met, `ok`, `slurm_down ... jobs=1 lastOk=kept`, `ok`.
- 9: met, `unreachable hint="the cluster x has no host" jobs=0 lastOk=none`.
- 10: met, `recover() sent 0 commands`.
- 11: met, the command text quoted under item 2; the round's change is the diff R7 prints.
- 12: met, by reading and by the first refutation's run: the round's delta has no hunk in `hpc.ts`, `status.ts`, `Head.svelte`, `Hpc.svelte`, `Login.svelte` or `hpc.yml`, so the words are those the first refutation read. The look on landing is the proof for the view.
- 13: met, `runs.test.ts` 16 of 16 alone and inside `npm run test:quick`.

Cases of `O82-round1.md`:

- R1: met, `slurm_down hint="no answer within the time limit" ... recent=1 ... lastOk=kept` after a good poll (and L1 with 15 ms between the polls).
- R2: met, `slurm_down` with the first poll's Capacity rows (`sinfo=1`).
- R3: met, `slurm_down hint="sacct: error: Problem talking to the database: Connection refused"`.
- R4: met, the hint is `squeue`'s line.
- R5: met, `ok` for G115's good fake; the file passes 16 of 16.
- R6: met, `timeout stops sacct (124): status=slurm_down hint="LATE" ... tmp left=[]`.
- R7: met, cases 1 to 13 as in the report, case 11's `batchCommand` text the one change, named.

### 1. Spec

- 1. `src/lib/server/machine/hpc/poll.ts:168`: "`if (failed[0]?.code === TIMED_OUT) return words.slurmLate;`"; what is wrong: the round brief's rule is "the hint is `hint_slurm_late` for 124, and otherwise the first command's own stderr line that is not empty, in the order `squeue`, `sacct`, `sinfo`". `slurmHint` reads 124 only on the first failing command and then searches the stderr lines of every failing command, so a 124 on a later command is never read, while a later command's stderr is. For every input R1 to R4 name, and for any answer whose first failing command decides, the result is the brief's. `edges.ts` E1 (`squeue` 1 with nothing on its stderr, `sacct` 124) gives `hint=undefined`, where a `timeout` stopped a command and the brief has a sentence for it. Under the spec; low weight: an `squeue` that exits non-zero with nothing on its stderr is rare. Failure scenario: `squeue` exits 1 silently while `sacct` is stopped by its 8 s limit; the error box shows "The cluster was reached over ssh, and Slurm did not answer." with no detail, where "no answer within the time limit" applies. A fix at landing: after the search for a stderr line finds none, return `words.slurmLate` when any failing code is 124. Verdict: none (round item 1 holds).
- 2. `src/lib/server/machine/hpc/poll.ts:122-123` (and `:117-118`, `:127-128`): "`... -Pn 2>"$oculus_err"`", "`echo "${SEC_SACCT_RC}$?"`"; what is wrong: the round brief asks for "a return code line of its own directly after each timed command". The echo follows the command directly, and the line is a line of its own only when the command's stdout ends in a newline. `edges.ts` S4 runs the poll's own `batchCommand` in `/bin/sh` with a `sacct` that printed a partial row and was stopped by `timeout`: the answer carries `sacctSection="9|done-a|COMPLE@@oculus:sacct_rc=124"`, `splitSections` reads `codes=0/0/0`, and the poll is published `ok`; `glued.ts` shows `parseSacct` drops the glued row and keeps the full rows before it. That is the first refutation's Spec 1 (a `sacct` stopped by its limit published `ok` with a short Recent table and `lastOk` stamped) on a narrower input; the same holds for `squeue` and `sinfo`. Low weight: it needs the command to be stopped after it flushed part of a row; `sacct` writes to a pipe through a block buffer, so this happens only for output of several kilobytes cut by the limit, which no run on file shows. Failure scenario: an accounting daemon that streams a large `sacct` answer and is cut at 8 s after the first 4096 bytes reached the pipe: the view shows `ok` with the Recent table cut short and a fresh "as of" time, and no failure word. A fix at landing: the line that reads `$?` starts with a newline (for example `printf '\n%s%s\n' "@@oculus:sacct_rc=" "$?"`, the `$?` still the timed command's, since it is expanded before `printf` runs), with the parsers' handling of an empty line checked. Verdict: none (round item 1 holds).

### 2. Proof

none. Every output the round report quotes was reproduced except the one R3 "before" line explained above, on which no decision rests: R1 to R5 after, R6 before and after, R7 before and after, the fixture lines, the line counts, the unused-exports difference, verify 4 and 5, the history grep and the character-set check. The changed test (the fixture line) has its passing run after the change quoted, and it guards a behaviour the round preserves.

### 3. Standards

- 1. `src/lib/server/machine/hpc/poll.ts:97-98`: "`squeue` gets the most, since the queue is what the view shows first."; what is wrong: the rules file ("What every package obeys": a sentence in a head comment that the change makes false is a defect) and the prose rule to name the actual thing. The old reason ("the poll's verdict rests on it") became false with the round, and replacing it was needed. The new reason holds for the head bar (`Head.svelte:64-69`, the queue summary first) and the status bar (`status.ts:195-196`), and not for the pane: `Hpc.svelte:111-112` draws Capacity and Quota before Jobs (`:115`). Failure scenario: a maintainer who reads the comment, opens the view and sees Capacity first concludes the limits were set from a layout that no longer holds, and may rebalance the 12, 8 and 5 s on that wrong ground. A wording at landing: "since the queue's counts lead the view's head bar and the status bar". Verdict: none.
- 2. `.scratch/migration/agents/reviews/O82-report.md`, section "# Repair round 1": what is wrong: the rules file asks of every report the reuse grep before a new helper ("What every package obeys") and the number of verify-list runs ("Token discipline"); the round adds two helpers (`codeOf`, `parse.ts:190`; `slurmHint`, `poll.ts:164`) and quotes no grep for either, and states no count of its `npm run test:quick` runs (the builder's `quick-r1.log` holds one). The reviewer's grep finds two other `codeOf` functions (`ask.ts:51`, `api.ts:35`) with other jobs and nothing to reuse, so no code changes. Failure scenario: the orchestrator's landing report, which states each step's run count, has no figure for the round from the builder. Verdict: none.

### 4. Behaviour

- 1. `src/lib/server/machine/hpc/poll.ts:193-202` with `:357-362` and `:499`: "`].filter((one) => one.code !== 0);`", "`if (parts.connected && failed.length > 0) {`", "`if (held?.status !== 'ok') return;`"; what is wrong: a host-visible change the report states only in part. The round makes a `sacct` or `sinfo` that fails while `squeue` answers a failed poll, and a failed poll hands Recover no section (`options.recover?.take` runs only on the good path, `poll.ts:373`), runs no prewarm (`prewarmDue = false`, `:358`) and makes `recover()` send nothing (`:499`). `recover.ts`: with every poll's `sacct` exiting 1 and `squeue` answering one job, the payload is `slurm_down` with `jobs=0` (no good poll since the start), `take calls=0` and `commands sent=["poll"]` after `watcher.recover()`. The report's sentence (line 728) says the tables of the last good poll are kept and "the view never shows a fresh queue"; it does not say that a Recover run on the cluster stops being followed (the Login node section's bytes, rate and end freeze), that the log prewarm stops, or that a server started while `sacct` fails shows no queue at all. "Host- and user-visible changes, for the look on landing" has no entry for a `sacct` or `sinfo` failure (before: `ok`, the live queue, an empty Recent or Capacity table; after: `Slurm down`, the frozen tables, Recover not followed), and "What this round changes in the first build's sections above" does not update that section. Failure scenario: the accounting daemon goes down while the controller answers (a state that differs from the one ruling 428 was found on); the reader sees `Slurm down` with `sacct`'s message, a queue frozen at the last good poll while the cluster runs and ends jobs, and a Recover download on the cluster whose progress stops moving, and nothing on screen tells them the queue itself answered; the look on landing has no before and after to read this against. Verdict: none (the code does what round item 1 asks; the report's statement is short).

### Declined to judge

- Whether a `sacct` or `sinfo` failure alone should hold back a queue `squeue` answered and Recover's reading (Behaviour 1): it is the round brief's rule ("a code other than 0 of `squeue`, `sacct` or `sinfo` is `slurm_down` over the last good rows"), joined to `O82.md`'s "Not changed" item that a failed poll hands Recover nothing, so the choice between it and keeping `squeue`'s rows and Recover's section while only the Recent or Capacity table is held is the orchestrator's, or Axel's under ruling 428, and outside what a read and a rerun settle.
- `npm run diagrams`, not run: it writes into the worktree. `tests/checks/diagrams/diagrams.test.ts` ran green inside `npm run test:quick`; the round's report says the diagrams were rewritten with the content of the first build, which the empty delta of the eight diagram files agrees with.
- `client-cases.mjs` (case 12) not run: it loads the worktree's `vite.config.ts`. Case 12 is judged by reading, since the round changed none of the files it reads.
- `npm run test:quick` and `npx vitest run` load `vite.config.ts` as vitest's configuration, whose `devPort()` (`vite.config.ts:43-45`, `:466`) calls `loadMachine`; they were run because the dispatch names them as the verification, and the reviewer opened, printed or grepped no `local.yml`.
- The remote command on the cluster, not run: no ssh is opened. The shell behaviour (the shared file, the `$?` lines, the `rm`, the `/dev/null` fallback, the glued line) is checked by local `/bin/sh` runs of the poll's own `batchCommand` (`shell-cases.ts`, `edges.ts` S1 to S5).
- Whether a real `sacct` or `squeue` stopped by its limit can leave a partial row on its stdout (Spec 2): it depends on how each flushes to a pipe on the login node; a run on the cluster through `sbatch` of a command stopped by `timeout` mid-output would settle it.
- Whether 12, 8 and 5 s turn a slow but answering cluster into `slurm_down`: no healthy time of the three commands on the cluster is on file, as the first refutation said.
- The number of the builder's verify-list runs in the round: `quick-r1.log` holds one run; no command shows how many it started.
- The views on screen (the pill, the error box, the Login node reason, the status bar tooltip for a `sacct` failure): the look on landing on TEST.

Reviewer usage: a86da77a63ab63f1e, claude-opus-5-5, 274829 tokens, 65 tool uses, 14 min 27 s.

## Closed (findings of the run over repair round 1, at landing on main)

- Spec 1: fixed at landing. `slurmHint` (`src/lib/server/machine/hpc/poll.ts`) returns the sentence for Slurm's limit when no failing command wrote a stderr line and any of them was stopped by `timeout` (124), so `squeue` exiting 1 silently while `sacct` hits its limit gets "no answer within the time limit".
- Spec 2: fixed at landing. `splitSections` (`src/lib/server/machine/hpc/parse.ts`) finds a marker anywhere on a line: the text before it stays in the section it was printed in, and the marker is read from where it starts, so a return code line glued to a partial row still gives the command's code and the partial row is dropped by the section's parser.
- Standards 1: fixed at landing. The `SQUEUE_SECS` comment gives the reason that holds: the queue's counts lead the view's head bar and the status bar.
- Standards 2: no code change. The reviewer's grep finds two other `codeOf` functions (`ask.ts:51`, `api.ts:35`) with other jobs and nothing to reuse; the round's verify-list runs are one, read from the builder's `quick-r1.log`. The booking states both.
- Behaviour 1: raised to Axel as open item 430 in `orchestrator-state.md` (whether a failure of `sacct` or `sinfo` alone should keep the queue and Recover's reading live); the built behaviour follows ruling 428's words. The booking states the before and after of a `sacct` or `sinfo` failure.
