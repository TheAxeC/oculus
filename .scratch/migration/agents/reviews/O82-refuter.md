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
