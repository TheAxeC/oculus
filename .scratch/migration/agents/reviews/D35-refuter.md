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
