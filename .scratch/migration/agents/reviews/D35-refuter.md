# Step D35 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D35, base c44def15)

I changed nothing. The only git I ran was `git diff c44def15` and `git status --short`. `npm run diagrams` rewrote files in the worktree as the brief told me to; `git status --short | wc -l` printed 66 before and after, and the file set is unchanged.

## Verification (rerun by the reviewer)

```
$ cd .../D35/tools/oculus && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
docs/diagrams/layer-data.svg ... docs/diagrams/layer-views.svg, docs/diagrams/channels.dot, channels.svg, writes.dot, writes.svg   (exit 0)

$ PATH=... sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
(I piped through tail, so the summaries of npm test, test:checks and check were cut off; the build, format, lint and ASCII lines are shown)
> Using @sveltejs/adapter-node  ... done
$ npm run format:check   -> Checking formatting...  All matched files use Prettier code style!
$ npm run lint           -> > eslint .   (no finding)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   (prints nothing)
checks: 7 commands passed

$ npx vitest run tests/server/root tests/server/machine/hpc tests/server/accounts tests/server/machine/usage tests/server/edit/config-key.test.ts --reporter=dot   (brief verify 2)
 Test Files  41 passed (41)
      Tests  632 passed (632)

Brief verify 3 to 6:
grep -c "built from it once" src/lib/server/root/context.ts      -> 0
grep -n "every config push" src/lib/server/root/context.ts       -> 217:    // arrives, and every config push hands the pollers ...
grep -rn "loadLocalOrDefaults" src/lib/server src/routes | wc -l -> 0   (no hit in src or tests either; the hits that remain are in .scratch)
grep -c "A change takes effect when the server is started again." config/catalogs/options.yml -> 12   (the file's local.yml block has 16 keys, less the 4 account keys = 12)
grep -c "A change is read again at once." -> 4 ; grep -c "keeps the value in force and is logged" -> 4 ; grep -c "is refused\." -> 11
grep -n "live-settings" DESIGN.md -> lines 234 and 236 ; sed -n 216p HELP.md | grep -c "takes effect at once" -> 1
sed -n 236p HELP.md | grep -c "holds from the next start" -> 1 ; ... "read again on every write" -> 0
ASCII gate (the perl form of spec.md over src tests config): prints nothing.
```

Commands from the builder's report that I did not rerun: its first run on "the unchanged tree" (a scratch copy I cannot build under the git restriction); see Proof 1.

## Verdicts

Items of the brief's "What to build":

- 1 (live-settings.ts): holds. I read the file whole. One sink on `config` with replay false, payload narrowed through `configMessageShape` and `readAs(mapShape, ...)`, each group read in its own `attempt`, `said` map gives once-per-message logging and clears on a read that does not throw, a non-map refuses with the one line, equal values hand nothing on (`isDeepStrictEqual`), `close()` removes the sink. Evidence: `tests/server/root/context.test.ts` "ServerContext on a configuration push" (12 cases). See Behaviour 3 for one hazard.
- 2 (context.ts): holds, with one deviation of the brief's own text (Spec 1). The start read stays, `liveSettings` starts after the pollers, `live.close()` runs first in `close()`, the comment at :215-218 is as asked, the host stays `local.hpcHost ?? slurm.host`, `config` and `stopMessage` left the hook target, `HookRequestTarget` split in hooks.ts.
- 3 (cadence rule): holds. HPC `set` (poll.ts:303-312, `arm(Math.min(queueAt, now + m))`), quota (`armQuota(Math.min(quotaAt, ...))`), loop `setPollMin` (`due.set(key, Math.min(at, soonest))`), usage refresh `set`. Tests cover lower, raise, retry-moves-earlier and retry-stands in HPC, loop, calendar, mail; usage refresh covers lower and raise.
- 4 (watchHpc.set): holds. Host change clears rows, `lastOk`, quota, `prewarmDue`, `asked`, `logPaths`, publishes `starting`, starts the quota read and one poll through the existing gate; days change polls; `asking` counter drops the old poll's rows. Tests in `poll.test.ts` "settings changed while the watcher runs" (11).
- 5 (accountLoop, calendar, mail): holds. `setPollMin`, `takeLoopSettings` shared by both pollers, `setSettings` and `setWords` on both. See Behaviour 1 for the empty-list edge.
- 6 (usage refresh and tiers): holds. `set({refreshMin, model})` and `setTiers`. Tests: `refresh.test.ts` "refresh settings changed while the watcher runs", `watch.test.ts` "on tiers that change".
- 7 (every setter after close does nothing): violated in one narrow respect, Spec 2. All six setters are no-ops after close for settings their readers accept (tests: poll.test.ts, calendar and mail live.test.ts, loop.test.ts, refresh.test.ts, watch.test.ts). `watchUsageRefresh.set` calls `requireRefreshSettings` before its `closed` check, so it throws after close for a value its reader refuses.
- 8 (Z174 readers): holds. `cadenceShape` 1 to 35791, `dayWindowShape` integer 0 to 3650, `perSignalShape` integer 1 to 500, sentences through `settingOf`, `requireRefreshSettings` uses the cadence shape with the file-prefixed sentence, `READERS` untouched in config-key.ts. 35791 min x 60000 = 2,147,460,000 ms, under 2^31-1, so no timer in the diff can exceed the limit. Tests: settings.test.ts, calendar-config.test.ts, mail-config.test.ts, `tests/server/edit/config-key.test.ts` "the bounds ..." (12 refusals, 4 acceptances), context.test.ts start-up case.
- 9 (Z177): holds. I grepped every reader of the local file in `src`, `bin`, `utils` and `vite.config.ts` (`loadLocal`, `loadLocalOrDefaults`, `localDefaults`, `localFile`, `LOCAL_NAME`, `checkLocal`). The remaining value readers are `context.ts:215` (start), `context.ts:437` (`reloadAccounts`, which copies only `calendars`, `calendarDir`, `mail`, `mailDir`) and `vite.config.ts:27` (dev port). `rows.ts` edits the account rows' text, `source.ts` and `rows.ts` call `checkLocal` for validation only, `ops.ts` and `ops/+server.ts` use the file's path. `target()`, `folderOf`, `writeConfigKey`, `filesTarget`, `startChat`, `handleAgents`, `routes.ts`, `knownIds`/`DepositOptions` take the start value; all route call lines read `locals.server.local` (diff read); `localFor` and `hubFor` are required. `loadLocalOrDefaults` and its module-level `reportedLocal` Set are removed. One part is not as asked: Spec 3.
- 10 (options.yml): holds. The counts above match the brief's verify 5. `usage_refresh_min` states its bound twice (the "refuses to start unless" clause and "A value outside 1 to 35791 is refused."), which the brief's wording produces.
- 11 (DESIGN.md): holds as written (:234 and :236). See Standards 2 for text elsewhere in the file that now contradicts :236.
- 12 (HELP.md): holds (:216, :236; `help.test.ts` updated to the new wording).
- 13 (tests): holds in content; the Proof findings stand.

Cases of the brief's "Cases":

- 1: met, poll.test.ts "moves the next poll to the new period from the push when that is sooner, and publishes it" (advances 5 of 20 minutes, set 5, runs at +5, publishes pollMin 5).
- 2: met, "leaves the next poll where it is for a longer period ...".
- 3: met, "clears what the old host answered and polls the new one at once"; with `hpc_host` set, context.test.ts "keeps the host the machine names" (no `hpc.set` call, so no poll).
- 4: met, "drops the rows of a poll begun under the old host and answers with one follow-up poll".
- 5: met, "starts one poll for a push that changes the host and the day count together".
- 6: met, "polls at once with the new window" (checks `batchCommand(14)`).
- 7: met, "reads the quota by the same rule as the poll".
- 8: met, "stops prewarming from the next good poll when the prewarm is turned off".
- 9: met, "treats the retry wait as the next poll" (1 moves, 5 stands).
- 10: met, calendar/live.test.ts "reads every account at once through the new window, and publishes it" (the Google request's timeMin/timeMax, payload `daysBack: 7, daysAhead: 30`).
- 11: met, four calendar/live.test.ts cases (5 with 15 left, retry moves to 1, retry stands at 5, raise to 60 with 3 left).
- 12: met, mail/live.test.ts "reads every account at once asking each listing for the new count" (maxResults 25 then 10) and the period cases.
- 13: met, refresh.test.ts (period, raise, model for the next start only, no Claude account replaces the timer and starts nothing).
- 14: met, watch.test.ts "publishes again with the new label".
- 15: met, calendar and mail live.test.ts (`setWords`) and context.test.ts "hands the three sentences, each kept when the push lacks it, and says the lack once".
- 16: met, context.test.ts "keeps a refused group and logs it once, again after a read that took, and clears on a push back" (exact line `config: config/behavior.yml: slurm.poll_min must be a number from 1 to 35791; the settings in force are kept`).
- 17: met, "refuses each group on its own ..." (calendar 0, mail per_signal 0, usage_refresh_min 0, `usage_tiers: { a: 5 }`, and slurm refused while calendar takes its change).
- 18: met as an audit; the test and the report say so ("nothing re-reads on the old code").
- 19: met, "keeps every group and says so once for a push whose configuration is not a map".
- 20: partial in what a test proves: the five groups log once each and keep their settings (test pushes `{ text }` only, twice); "the parse error is a finding on the config channel (existing)" is not tested here. Not verified, see Declined.
- 21: met, "holds the settings of the last of two pushes made in quick succession".
- 22: met. Start refusal (slurm.poll_min 0, slurm.days -1, mail.per_signal 501) in context.test.ts; each Settings refusal and acceptance of the brief's list in config-key.test.ts (`usage_refresh_min: 0` in the existing "readers of the merged configuration" case; `-0` in "writes minus zero as zero").
- 23: met for every setter (HPC, calendar, mail, loop, refresh, tiers), with accepted values.
- 24: met, "takes the sink off the hub on close ..." (`hub.size` falls by one, later publish changes nothing and logs nothing).
- 25: met (existing behaviour, kept): hook.test.ts and hooks.test.ts over `HookRequestTarget`; context.test.ts asserts the context hook target's keys.
- 26: met for `target()` (routes/edit/config-key.test.ts), wallpaper, memories, project-files, agents and the portfolio chat start. The terminal and agents cases pass on the unchanged tree by the report's own statement (audits). The route lines that pass `locals.server.local` are covered by reading only; project-files.test.ts says so.

## 1. Spec

- Spec 1. `src/lib/server/root/hooks.ts` `HookTarget` and `src/lib/server/root/context.ts:236-241`: "store, hub, limiter, logged, recordFor"; what is wrong: item 2 says the hook target "keeps `store`, `hub`, `limiter` and `logged` only"; the code (rightly) keeps `recordFor` too, and the test asserts `['hub','limiter','logged','recordFor','store']`. The report's "Anything in the brief that was wrong: Nothing found wrong" does not name this; failure scenario: none at runtime; the orchestrator reads the report as "exactly the brief's four fields". Verdict: item 2 holds in substance.
- Spec 2. `src/lib/server/machine/usage/refresh.ts:362`: "const checked = requireRefreshSettings(next); if (closed) return;"; what is wrong: item 7 says every setter does nothing after close; this one throws first for settings its reader refuses. Failure scenario: a caller handing `set({ refreshMin: 0, ... })` to a closed watcher gets a throw instead of nothing. `liveSettings` never does this (it validates before calling), so there is no live path today. Verdict: item 7 violated (narrowly).
- Spec 3. `src/lib/server/git/deposit-routes.ts:139` `local?: LocalConfig` and `src/lib/server/git/deposit.ts:147` `local?: LocalConfig`: item 9 says the Z177 modules take the start `LocalConfig` "as a required argument". Here it is optional, and `knownIds` swallows the resulting fault (`catch {}` at deposit-routes.ts:144) so a caller that names `engine` and `config` but not `local` silently gets only the published ids. Failure scenario: a project not yet in the last portfolio payload is answered 404 by `GET /api/deposit` with nothing logged. The one route caller passes `server.local`, so no live path today. Verdict: item 9 holds for the other modules; this is the exception.

## 2. Proof

- Proof 1. Report, "First run on the unchanged tree": "17 files failed ... (output in `scratchpad/firstrun3.txt`)", per-file counts only, one failure line quoted ("Expected: 'read once when the server starts and used from that value'"). What is wrong: the ruling (D35-cases.md 1) and brief verify 7 say each changed or new test's failure on the unchanged tree is quoted in the report; the report points to scratchpad files instead, and builds the "unchanged tree" from the main checkout (not at the base c44def15: main's head is later). I could not rebuild an unchanged tree under the git restriction, so I did not reproduce the 132 failures. Decision resting on it: whether each new test fails without the change. Failure scenario: a new test that passes on the unchanged tree sits among the 132 counted without anyone being told which. Verdict: cases 1-17, 21-24 met only on the strength of reading the tests; not reproduced.
- Proof 2. `src/lib/server/machine/hpc/poll.ts:121` (`publishQuota`), `:229` (`prewarmStep`), `:326` (days branch of `set`): `const began = asking;` and the `began !== asking` guards. What is wrong: spec.md says every asynchronous path is exercised in flight, after close and superseded. By reading `tests/server/machine/hpc/poll.test.ts`, no test changes the host or the window while a quota read or a prewarm is in flight, and none changes `days` while a poll is in flight. The only in-flight test ("drops the rows of a poll begun under the old host ...") gates the queue read; quota answers `NOTHING` and prewarm is unused. Taking the guard out of `publishQuota` or `prewarmStep` leaves every test green. Failure scenario: the old host's quota meters or its log paths land under the new host's name. Verdict: item 4 holds (code reads correct); case 4 met for the queue read only.
- Proof 3. `tests/server/accounts/calendar/live.test.ts`, `mail/live.test.ts`, `connect/loop.test.ts`: no test changes the period or the window while a round is in flight. The two paths that matter are `loop.ts` `setPollMin` (`if (running === null) schedule()`) and the queued follow-up of `takeLoopSettings` (`void loop.run(true)` over a running round). Same spec.md rule. Failure scenario: a window change that arrives mid-round could leave a stale window until the next period with nothing failing. The code reads correct. Verdict: items 5 and 13 hold.

## 3. Standards

- Standards 1. Stale comments the change makes false, found by grepping `local.yml`, "engine directory" and "the hub is" over the files the step changed:
  - `src/lib/server/git/deposit.ts:141`: "Which hub the project is read and written in; the engine's local.yml says when absent." The `local` option says now.
  - `src/lib/server/git/deposit.ts:143`: "The engine directory the hub is read from when the caller names no target of its own." The hub comes from `local`.
  - `src/lib/server/git/deposit.ts:181-182`: "the target the caller named, or the one the engine directory it named says."
  - `src/lib/server/git/deposit-routes.ts:132`: "The hub is the one the engine directory says".
  - `src/lib/server/machine/pty/chat.ts:20`: "The engine directory the configuration and the machine's own file are read from." The machine file is not read from `engine` any more (`localFor`).
  Failure scenario: a maintainer reads that the deposit reads the hub from `local.yml` per call, and edits the engine's `local.yml` expecting a running server to follow it.
- Standards 2. `DESIGN.md:244` ("`apps_dir` in `config/local.yml` ... resolved at the call as `calendar_dir` and `mail_dir` are and read through `loadLocal` as `appsDir`") and `DESIGN.md:266` ("It reads `local.yml` again when that changes, as accounts are, and follows a new `apps_dir`") against the new paragraph at `DESIGN.md:236` ("`local.yml` is read when the server starts and used from that value, except the account lists and folders of the calendar and the mail"). Apps are not in `src` yet (grep `appsDir|apps_dir` over `src` and `options.yml`: no hit), so this is planned text, but the file now says two things about when `local.yml` is read. The diff did not touch :244 and :266 and the brief did not name them. It is a clash between Z177 and the apps design, which only Axel or the orchestrator rules; I do not close it. Failure scenario: the apps step builds `apps_dir` to follow the file because DESIGN.md says so, and breaks Z177.
- Standards 3. `tests/routes/sessions/hook.test.ts:1-5`: the head comment is left with a short third line ("// and a target the test owns, so nothing") before "// posts to a real server ...". A ragged hand-wrap in the sentence the step edited; the rule is one line per paragraph (hub CLAUDE.md "Writing docs"). No behavioural consequence.

## 4. Behaviour

- Behaviour 1. `src/lib/server/accounts/connect/loop.ts:160` (`run` returns at once when `accounts.length === 0`) with `loop.ts:239` (`if (askedChanged) void loop.run(true); else if (period changed) publish()`): with no account configured, a changed window (or a window and a period changed together) neither reads nor publishes. The payload keeps the old `daysBack`/`daysAhead`/`pollMin`; `Calendar.svelte:249` draws the window from the payload (`calendar.footer`). Failure scenario: no calendars yet, the reader sets `calendar.days_back: 7` in Settings, and the Calendar footer shows the old window until an account is added. Not stated in the report. Verdict: item 5 holds; case 10 met (accounts present).
- Behaviour 2. `poll.ts:326` (a days change does `asking += 1`) with `poll.ts:121` (`publishQuota` drops its result when `began !== asking`): a changed day window also drops a quota read in flight, though the quota does not depend on the window. The meters keep their last value until the next quota read (default 60 minutes). Low.
- Behaviour 3. `src/lib/server/root/live-settings.ts:171` (`send(text) { onMessage(text); ... }`): the hand-off runs synchronously inside `Hub.#drain`'s `try` (`channels.ts`, `await sink.send(...)`). An exception from any setter is caught there, logged as `socket: send on channel config failed`, and `this.remove(sink)` unsubscribes live-settings for good, so every later push is ignored. No setter throws today (I read all six); this is a hazard of the shape, not a reproduced defect. Failure scenario: a future setter that throws silently ends live settings after one cryptic socket line.

## Declined to judge

- The look on TEST and the interleaved A/B: the orchestrator's, not a read or a rerun.
- Proof 1's first run: I cannot build an unchanged tree under the read-only git rule, and whether the main checkout's drift since c44def15 touched the restored files is not verified.
- Case 20's "the parse error is a finding on the config channel (existing)": not exercised by any test of this step and not checked.
- Whether `payload: z.object({ config: z.unknown() })` accepts a message with no `config` key (the `undefined` case of case 19): not checked; the test passes either way, since every other non-map logs the same single line.
- The `ordo-medium` builder experiment's evaluation (tokens, first-report bar): the orchestrator's.
- Gaps in `npm test`, `test:checks` and `check` summary lines: my `tail` cut them off in the single full-list run; the final line `checks: 7 commands passed` covers them.

Reviewer usage: left to the orchestrator.

## Repair round 1, refuted

Everything below was produced by my own runs in this session. I changed nothing in the worktree. The only git I ran was `git diff c44def15` (with `--stat`, `--numstat`, `--name-only` and path arguments) and `git status --short`. `npm run diagrams` and `checks.sh` rewrote generated files in the worktree as the brief told me to; `git status --short | wc -l` printed 68 before and after (66 files at the first review plus `poll-fixture.ts` and `poll-live.test.ts`). `config/local.yml` was never opened, grepped or copied; every `find` and `rsync` excluded it. My scratch copies of the step's tree are removed.

### Open at the top

One test of this round is red and the verify list cannot see it. `tests/server/git/deposit.test.ts` carries `// @module-tag slow`, so `npm test` and `npm run test:checks` leave it out. The case the round wrote for ruling 3 fails on the final tree (Proof 1). Everything else of the 12 rulings reproduces. Minor findings are listed under the four headings.

### Verification (rerun by the reviewer, from tools/oculus in the worktree)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
docs/diagrams/layer-views.svg ... channels.dot, channels.svg, writes.dot, writes.svg   (exit 0)

$ PATH=... sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (exit 0)
$ npm test
 Test Files  417 passed | 22 skipped (439)
      Tests  10926 passed | 618 skipped (11544)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790887992241 COMPLETED 2935 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            (adapter-node, "built in 13.09s", done)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     (prints nothing)
checks: 7 commands passed
```

Commands from the builder's report, rerun:

```
ASCII gate of spec.md (perl form over src tests bin config, ! -name local.yml): prints nothing.
LC_ALL=C grep -n '[^ -~]' over the added lines of DESIGN.md and HELP.md: prints nothing.
grep -rn "loadLocalOrDefaults|reportedLocal" src tests DESIGN.md HELP.md README.md config --exclude=local.yml: prints nothing.

Proof 1 (first runs), a scratch copy of the step's tree with the 31 base files from scratchpad/D35-base copied over it,
live-settings.ts deleted (ls | grep -c live-settings: 0), the step's tests kept, each test file run alone:
  30 of the 31 base files: line counts of "diff base worktree" equal "git diff c44def15 --numstat" (added, removed).
  config/catalogs/options.yml (30/30 vs git 28/28, a different diff algorithm): `patch -R` of git's diff over the
  worktree file gives the base file byte for byte (cmp: identical).
  Result lines, failed/passed: calendar-config 3/15, mail-config 2/15, settings 6/46, memories 2/25, wallpaper 3/15,
  routes config-key 1/14, file.test 0/24, project-files 1/4, routes compose 0/11, hook 0/4, terminal-actions 0/21,
  terminal-edit 0/21, terminal 0/17, loop 6/6, images 1/31, server config-key 52/0, deposit 3/29, hpc poll 0/20,
  pty compose 0/20, refresh 10/29, watch 2/14, context 14/10, hooks 0/38, help 0/20, calendar live 11/0,
  mail live 10/0, poll-live 15/0, usage-readers 0/10.   Total 601 cases, 142 failed.
  The builder's table and its list of 142 failing cases agree: same per-file counts, 142 names against 142 names
  (the two lists differ only in the " > " separator).
```

Mutation reruns of rulings 2 and 5 to 9, on a scratch copy (each mutation applied to the copy only, the copy's file restored from the worktree and compared after, the test run named):

```
baseline tests/server/machine/hpc: 70 passed. baseline tests/server/accounts: 195 passed.
5  poll.ts publishQuota guard (began !== hosts) removed  -> poll-live "drops the meters of a quota read begun under the old host..."  expected [ 75, 75, 25 ] to not include 25   (1 failed)
5  poll.ts prewarmStep guard removed                     -> poll-live "drops the log paths of a prewarm begun under the old host"   expected [ [ '9', ...], [ '10', ...] ] to deeply equal []   (1 failed)
5  poll.ts poll guard (try branch) removed               -> 2 failed: "...old host and answers with one follow-up poll", "...old window and answers with one poll at the new one"   expected [ 'old', 'x' ] to not include 'old'
5  poll.ts poll guard in the catch branch (line 202) removed -> 70 passed, nothing fails (Proof 2 below)
6  quota guard compares asking, not hosts                -> "lets a quota read in flight land when only the day count changes"   expected [] to deeply equal [ 25 ]
7  loop.ts setPollMin without `pollMin = minutes;`       -> 7 failed over loop, calendar live and mail live (loop.test.ts 3 of them)
7  loop.ts takeLoopSettings without the follow-up run    -> 3 failed (loop "runs one follow-up round...", calendar live, mail live)
7  loop.ts `if (running === null)` removed from setPollMin -> 195 passed (as the builder says; behaviour-neutral, see Judged below)
7  loop.ts `queued ??=` changed to `queued =`             -> 1 FAILED: calendar/poll.test.ts "runs one round at a time and gives every refresh meanwhile the one follow-up round"   expected Promise to be Promise   (not green, see Proof 3)
8  takeLoopSettings with the old condition               -> calendar live "publishes the new window and period when no account is configured" and mail live "publishes the new period and reads nothing when no account is configured" fail
9  live-settings.ts slurm hand-off moved out of its attempt -> context.test.ts "logs a setter that throws once as its group failing, and the next push still reaches the others"   expected [] to deeply equal [ Array(1) ]   (1 failed)
2  refresh.ts `closed` test after requireRefreshSettings -> "returns for a setting its reader refuses once it is closed" fails (the reader's message is thrown)
3  knownIds second overload `local?` (optional)          -> npm run check: 0 ERRORS (nothing guards it)
3  DepositStart member `local?` (optional)               -> npm run check: 1 ERROR, in src deposit.ts:199, none in the test file
```

Slow-tagged files that exercise changed modules (not in the verify list), run on the scratch copy: `tests/server/core/changes.test.ts`, `tests/server/machine/lines.test.ts`, `tests/server/machine/hpc/ssh.test.ts`, `tests/routes/docs/docs.test.ts`, `tests/routes/edit/write.test.ts` and `tests/server/git/deposit.test.ts`:

```
 Test Files  1 failed | 5 passed (6)
      Tests  1 failed | 206 passed (207)
 FAIL  tests/server/git/deposit.test.ts > the hub the machine values name > is a fault said plainly when the caller names neither a target nor an engine
 AssertionError: expected [Function] to throw error including 'the engine directory, its configurati…' but got 'Cannot read properties of undefined (…'
```
The same file run in the worktree: `Tests 1 failed | 31 passed (32)`, `Received: "Cannot read properties of undefined (reading 'hub')"`, at `tests/server/git/deposit.test.ts:285`. Source and test were byte-identical between worktree and copy (`cmp`).

### Verdicts, for the whole diff since c44def15

Items of the brief's "What to build":

- 1 (live-settings.ts): holds. Read whole; one sink on `config`, replay false, each group inside its own `attempt`, once-per-message logging, non-map refused with the one line, equal values hand nothing on, `close()` removes the sink. Mutation 9 and the context.test.ts push describe (12 cases).
- 2 (context.ts): holds. `liveSettings` starts after the pollers, `live.close()` first in `close()`, host stays `local.hpcHost ?? slurm.host`, `config` and `stopMessage` left the hook target. The `recordFor` difference is now stated in the report's "Anything in the brief that was wrong" (report line 108), and `hooks.ts:273` reads it.
- 3 (cadence rule): holds. HPC `set` (poll.ts:304-333), quota (`armQuota(Math.min(quotaAt, ...))`), `setPollMin`, usage refresh `set`; tests cover lower, raise, retry-moves, retry-stands.
- 4 (watchHpc.set): holds. The three in-flight cases of ruling 5 are tested and fail with their guard out (mutations above). Proof 2 and Behaviour 1 below touch the same function.
- 5 (accountLoop, calendar, mail): holds. The no-account publish (Behaviour 1 of the first run) is built in `takeLoopSettings`, loop.ts:240-241, and tested.
- 6 (usage refresh and tiers): holds.
- 7 (every setter after close does nothing): holds. `refresh.ts` `set` now returns before it reads its argument; the new test fails with the two lines in the old order.
- 8 (Z174 readers): holds. Unchanged by the round; tests green.
- 9 (Z177): holds in the modules; `local` is required in `DepositStart` by the type (mutation: making it optional fails `npm run check` in `deposit.ts:199`). The guard on `knownIds` and the test of it are findings (Proof 1).
- 10 (options.yml): holds (counts from the first review stand; the round did not touch the file).
- 11 (DESIGN.md): holds, and the round's edit (:236 names `apps_dir`) matches ruling 11; :244 and :266 are untouched.
- 12 (HELP.md): holds.
- 13 (tests): violated in one respect: a test the round wrote for ruling 3 is red (Proof 1). Every other test of the step is green on the verify list.

Cases of the brief's "Cases":

- 1 to 3, 5 to 17, 19, 21 to 25: met, by the tests the first review named; those tests still exist under the same names (poll-live.test.ts holds the HPC ones) and pass.
- 4: met for the queue read, and now for a quota read and a prewarm in flight (poll-live.test.ts, mutations above).
- 18: met as an audit; the test title and the report say so.
- 20: met for what a test proves here (the five groups log one line each and keep their settings); the clause "the parse error is a finding on the config channel (existing)" is not exercised by this step's tests, see Declined.
- 26: met for `target()`, wallpaper, memories, project-files and the portfolio chat start; the terminal and agents cases pass on the unchanged tree and are named as audits by the report; the route lines that pass `locals.server.local` are covered by reading only.

### Closure of the 12 rulings

1. Spec 1, hook target: closed (report line 108 names `recordFor` and `hooks.ts:273`; grep confirms line 273).
2. Spec 2, set after close: closed; mutation fails the new test.
3. Spec 3, deposit `local`: types closed; the test written for it is red and its `@ts-expect-error` does not guard `local` (Proof 1).
4. Proof 1, first runs: closed; reproduced above (601 cases, 142 failed, same per file). Cases that pass on the unchanged tree are named by the report (equal-values audit, hook target split, terminal and agents audits, file.test deletion, usage-readers moved unchanged, help.test passing because the copy holds the new docs).
5. Proof 2, HPC in flight: closed for the three named cases, all three fail with their guard out. One sibling guard is untested (Proof 2).
6. Behaviour 2, quota and window: closed; the second counter `hosts` is used only by `publishQuota`; the test fails with the quota guard on `asking`.
7. Proof 3, loops in flight: closed; both tests fail with the line out. The builder's sentence on two mutations that stay green is half wrong (Proof 3).
8. Behaviour 1, no account: closed; both tests fail with the old condition.
9. Behaviour 3, throwing setter: closed for the Live HPC setter, with a test; the other six hand-offs read correctly (all inside their `attempt`) but only the HPC one has a test.
10. Standards 1, stale comments: closed; `deposit.ts` (`into`, start-values paragraph, `hubTarget` paragraph), `deposit-routes.ts` (`knownIds` paragraph) and `chat.ts` (`engine` field) now say the start `LocalConfig`, with no history.
11. Standards 2, `apps_dir`: closed; DESIGN.md:236 names it.
12. Standards 3, hook.test.ts head comment: closed as far as the check lets it: the lines are 83, 97, 97, 95 and 38 columns, and `tests/checks/source/comment-width.test.ts` caps a comment line at 100, so one line per paragraph cannot hold. No check was loosened (`git diff` shows no change under `tests/checks`, `utils`, `eslint.config.js` or any allow list).

No closure removed a check in place of a fix. No fix reached past its finding, with the three moves below judged separately.

### Judged: the files moved beyond the round's path list

- `tests/server/machine/hpc/poll-fixture.ts` and `poll-live.test.ts`: the three new tests would have put `poll.test.ts` past the 900-line cap of `tests/checks/tree/size.test.ts` (453 + 441 + 116 lines now). The helpers removed from `poll.test.ts` appear in `poll-fixture.ts` line for line (compared; the only difference is the `export` keyword), the 20 pre-existing cases still pass (20 passed), the `it` import from `fixtures/scratch.ts` is what `tests/checks/tree/scratch.test.ts` requires of a file reaching `recording`. The folder holds 7 items. This is the widened path list the lazy-option rule asks for, not a loosened check. Accepted.
- `tests/server/root/context-fixture.ts` (`driver`, `inertConfig`, `inertDependencies` moved out of `context.test.ts`, now 813 lines): the removed lines are the ones added to the fixture, and `inertConfig` gained a `text` block for the three sentences. Accepted; its head comment is now incomplete (Standards 1).
- `usage-readers.test.ts` (round 0): the removed lines of `refresh.test.ts` are the added lines of the new file apart from imports and closing braces. Accepted.

### Judged: the two mutations the builder says its tests cannot catch

- Dropping `if (running === null)` from `setPollMin`: reproduced green (195 passed). With the guard out the timer armed during a round fires at once and queues a round that finds no account due, publishes nothing and reads nothing, so no result differs. It is an efficiency guard; accepted without a test.
- `queued ??=` to `queued =`: not reproduced; see Proof 3.

### 1. Spec

none.

### 2. Proof

- Proof 1. `tests/server/git/deposit.test.ts:281-288` with `src/lib/server/git/deposit.ts:193-199`: `if (options.engine === undefined) { throw new Error('a deposit needs either a write target or the engine directory, its configuration and the machine values'); } return target(options.engine, options.config, options.local);`. What is wrong: the test the round added for ruling 3 calls `state('alpha', { engine, mirrors })` and `{ engine, config, mirrors }` and expects the fault message `the engine directory, its configuration and the machine values`; `hubTarget` now refuses only a missing `engine` (the round dropped `|| options.config === undefined`), so both calls reach `target(engine, undefined, undefined)` and throw `Cannot read properties of undefined (reading 'hub')`. The file is slow-tagged and is not in `npm test` or `test:checks`, so `checks: 7 commands passed` does not cover it, and the round's report quotes no run of it on the final tree. The test's single `// @ts-expect-error` is satisfied by the first union member alone (the missing `config`), so it does not show that `local` is required; making `local` optional in `knownIds`' second overload (`deposit-routes.ts`, the `local: LocalConfig` parameter) leaves `npm run check` at 0 errors, so the required `local` of `knownIds`, which ruling 3 names (`deposit-routes.ts:139`), has no guard. Failure scenario: a caller of `state`/`deposit` that names `engine` without `config` or `local` (a cast, or JS) gets a TypeError from `target`, where the plain fault was said before the round and the test says it should be; and the next edit that makes `knownIds`' `local` optional passes every check. Verdict: item 13 violated in this respect; item 9 holds in the types.
- Proof 2. `src/lib/server/machine/hpc/poll.ts:202`: `if (stopped() || began !== asking) return;` in the `catch` of `poll`. What is wrong: removing the guard leaves all 70 tests of `tests/server/machine/hpc` green, so no test exercises a poll that fails after the host or window changed. Failure scenario: the old host is unreachable (a poll waits out its 40 s timeout), the reader corrects `slurm.host`, and when the old poll rejects it publishes `unreachable` with the old host's error hint under the new host's name before the queued follow-up poll answers. Verdict: item 4 holds; spec.md "Every asynchronous path is exercised in flight" is short for this branch.
- Proof 3. Report "Repair round 1" item 7: "Two other changes to the loop leave every test green ... `queued ??=` to `queued =`". What is wrong: `queued ??= running` changed to `queued = running` in `loop.ts` fails `tests/server/accounts/calendar/poll.test.ts` "runs one round at a time and gives every refresh meanwhile the one follow-up round" (`expected Promise{…} to be Promise{…}`); the builder ran `loop.test.ts` only. The other half (the `running === null` guard) reproduces. Failure scenario: the orchestrator reads the report as two uncovered lines and books a gap that does not exist. Verdict: none (a claim, no decision rests on it beyond the Not verified line).
- Proof 4. `tests/server/root/context.test.ts:769-793`: only the Live HPC setter throws. What is wrong: the hand-offs of the calendar, mail, refresh, tiers and the two sentence groups are inside their `attempt` by reading (`live-settings.ts:107-158`), but moving any of them out of its `attempt` leaves every test green (I ran the slurm one; the other five were not mutated). Failure scenario: a later edit moves one hand-off out of its `attempt` and a throwing calendar setter unsubscribes live settings again. Verdict: item 13 holds for the ruling's text ("a test with a setter that throws"); reported because ruling 9 says "each group".

### 3. Standards

- Standards 1. `tests/server/root/context-fixture.ts:1-2`: "Builds a complete inert ServerContext for route tests without opening a watcher, running tmux, reading the real hub, or writing outside a test's own fixture." What is wrong: the file now also exports `driver`, `inertConfig` and `inertDependencies`, which build the dependencies of `createServerContext` for `context.test.ts`; the head comment does not say so (spec.md: a sentence the change makes false is a defect of the change). Failure scenario: a maintainer looking for the inert dependencies of `createServerContext` reads the head and does not look in this file, and writes a second copy.
- Standards 2. `tests/server/root/context.test.ts:707`: "hands nothing on for a push whose values equal the ones in force (an audit: nothing re-reads on the old code)". What is wrong: "the old code" is a reference to an earlier state of the tree, which spec.md's "No history in code or comments" bars. Failure scenario: in a year no reader knows which code was old; the word "audit" alone says what the brief asked for.

### 4. Behaviour

- Behaviour 1. `src/lib/server/machine/hpc/poll.ts:237-239` with `:329-331`: `for (const id of todo) asked.add(id); const found = await prewarmLogs(...); if (stopped() || began !== asking) return;` and the days branch of `set` (`asking += 1`). What is wrong: a days change drops a prewarm in flight but leaves its ids in `asked`, so the next prewarm filters them out (`!asked.has(job.id)`) and never asks about them again. A host change clears `asked`; a days change does not. I ran a probe on the scratch copy: prewarm gated, `watcher.set({ ...options, days: 14 })`, listing settled, one minute advanced: `PROBE before 2 after 2 paths []` (no further prewarm call, no path). Failure scenario: the reader changes `slurm.days` while the first prewarm after start is running; the finished jobs of that prewarm keep no pre-resolved log path, and the first press on each job's log pays the full resolution cost. Not stated in the report. Verdict: item 4 holds; case 8 and the days cases are met.

### Declined to judge

- The look on TEST and the interleaved A/B against the staged base binaries: the orchestrator's.
- Case 20's clause "the parse error is a finding on the config channel (existing)": no test of this step exercises it and I did not run it.
- The full-list run counts the report gives (5 for the step, 2 for the round) and the contents of the failing run 4: they are the builder's account of earlier runs; I reran the list once and it passed.
- Slow-tagged files other than the six I ran (`git.test.ts`, `git-reads.test.ts`, `paths.test.ts`, `writes.test.ts`, `yaml-edit.test.ts`, `sessions.test.ts`, `portfolio.test.ts`, `git-write.test.ts`, `git-ops.test.ts`, and the view and timing files): they do not call a signature the step changed, apart from the six; svelte-check passes over all 2935 files, so compile-level breakage is excluded and runtime breakage in them is not checked.
- Whether the three moved test files, taken as a set, leave the folder counts of `utils/folder-check.sh` satisfied beyond what `test:checks` reports: `test:checks` passed, which includes that check.
- The `ordo-medium` experiment's evaluation (tokens, first-report bar): the orchestrator's.

Reviewer usage: not measured inside the session (no counter is available to me); the completion notice carries tokens, tool uses and minutes.