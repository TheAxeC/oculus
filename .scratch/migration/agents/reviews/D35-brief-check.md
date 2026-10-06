# D35 brief check

BRIEF CHECK REPORT, step D35 (brief `tools/oculus/.scratch/migration/agents/briefs/D35.md`, main at 04b39b45, `git log --oneline -1` printed `04b39b45 Book Z172 into Q88c and raise workers_at_once to five`). Nothing was changed. `config/local.yml` was never opened. For the one run that needed a config folder I used `rsync -a --exclude=local.yml` into the scratchpad.

Headline: three findings change what the builder must build, and the brief needs to be corrected before dispatch. (1) The 3 `notify.*` keys are already live in production, so item 6 and case 9 build dead code. (2) Case 18 and the premise behind it are false. (3) Q85c rewrites the same `settings.ts` lines that item 7 edits, so the merge is not simple.

## 1. Names

N1. A premise is wrong: the `notify.*` keys are not start-only, so item 6 is dead code.
- Command: `cat "src/routes/api/(sessions)/hook/+server.ts"`.
- Output, lines 11-16: `const config = locals.config().config; return handleHookRequest(request, { ...locals.server.hooks, config: notifyConfig(config), stopMessage: textCatalog(config)['notify.stop'] });`
- `locals.config()` reads `config/` from disk on each request (`src/hooks.server.ts:71-76`). The route spreads `server.hooks` and then overrides `config` and `stopMessage` itself. So `hooks.config` and `hooks.stopMessage` built at `context.ts:234-235` are never read in production, and `notify.enabled`, `notify.events`, `notify.quiet_seconds` and `notify.stop` already take effect on the next hook event. `grep -rn "\.hooks\b" src` shows `hooks` used only by this route and `sessions/index.ts`.
- Consequences:
  - Only 13 of the "16" keys are start-only (3 usage, 5 slurm, 3 calendar, 2 mail). The step line and Z166 say 16, so this is a premise found wrong, which goes to Axel.
  - Item 6 and the notification group of item 1 change nothing a reader sees.
  - Case 9 passes in production without the step.
- Second defect, if the notify group stays: a sink receives JSON text (`Hub.#drain` calls `sink.send(JSON.stringify(message))`, `channels.ts:134`). `node -e "console.log(JSON.stringify({notify:{quiet_seconds:Infinity}}))"` prints `{"notify":{"quiet_seconds":null}}`. `notify.quiet_seconds: .inf` is documented as valid (`hooks.ts:125-127`), but after the round trip `notifyConfig` returns the default 3.
- Change to the brief: drop item 6, the notification group of item 1 and case 9. State "13 keys are start-only; the 3 `notify.*` keys are read by the hook route at each request". Have the context reflect that. A route-level case for `notify.*` would be an audit, not a proof. This needs Axel's ruling because Z166 names 16.

N2. `tests/server/root/context-fixture.ts` is outside "Paths this step writes" and will stop type-checking.
- Command: `grep -rn "setAccounts\|hpc: *{\|usageRefresh" tests/server/root/context-fixture.ts`.
- Output, lines 58-62: `hpc: { refresh, close }`, `calendar: { refresh, setAccounts, close }`, `mail: { refresh, republish, setAccounts, close }`, `usageRefresh: {...}`. This is typed `ServerContext` (`context.ts:88-92`: `hpc: HpcWatcher`, `calendar: CalendarWatcher`, `mail: MailWatcher`, `usage: UsageWatcher`, `usageRefresh: UsageRefreshWatcher`).
- Once `set`, `setSettings`, `setWords` and `setTiers` join those types, `npm run check` fails here. `contextFixture` is used by 10 test files (`grep -rln contextFixture tests | wc -l` printed 10).
- Change: add `tests/server/root/context-fixture.ts` to the paths. The folder is full, but this edits an existing file.

N3. `HELP.md:236` is outside the paths and contradicts items 8 and 10 (details in P5 below).

N4. `DESIGN.md:234` is made partly false by the new module: "a server module takes it from its route as an argument rather than reading it itself". The new paragraph (item 9) should say how `live-settings.ts` differs. This line is inside the brief's DESIGN range 224-236, so no path change is needed.

N5. Hits that stay true and need no change:
- `src/routes/api/(machine)/hpc/+server.ts:12` reads `slurmSettings(locals.config().config).host` live. After D35 the poller agrees with it.
- `src/routes/api/(accounts)/mail/+server.ts:25` reads `perSignal` live per request.
- `edit/writes/config-key.ts:41,84-93` refuses the new bounds through the readers, as the brief says.
- `data/sources/config.ts:63-69` is re-exports.
- `tests/data/sources/calendar-config.test.ts:109-133` and `mail-config.test.ts:115-135` test no zero or negative case. `grep` for `poll_min: *0|days_back: *-|per_signal: *0|quota_min: *0` over `tests` printed nothing.
- `tests/server/edit/config-key.test.ts:272-283` writes `-0` into `days_back` and expects 0, which Z174's "zero or more" keeps passing.
- `tests/server/machine/hpc/ssh.test.ts:322,336` and `usage/usage.test.ts:648+` call the watchers directly with no setter, so they are unaffected.
- `tests/routes/sessions/hook.test.ts` is unaffected.
- `DESIGN.md:132,134,136,389,397,398` describe the pollers and say nothing about start-only reads.
- `README.md` has no hit.
- `config/` (excluding `local.yml`) has no hit apart from `catalogs/options.yml`.

N6. Possible duplication check failure, not verified. The calendar and mail pollers would each get a near-identical `setSettings` and `setWords`. `tests/checks/tree/duplication.test.ts:47-48` sets MIN_LINES 8 and MIN_TOKENS 50, and `tests/checks/tree/allow-duplication.txt` is not in the paths. Change: share the setter in `loop.ts`, or add `tests/checks/tree/allow-duplication.txt` to the paths.

## 2. The step line

Mapping of the plan line (`plan.md:426`) and the rulings to the items:
- Usage refresh re-read at each push: items 1, 2, 5.
- Live HPC re-read: items 1, 2, 3.
- Calendar and mail re-read: items 1, 2, 4.
- Notification re-read: items 1, 2, 6. These are already live (N1).
- A refused hand edit keeps the old settings and is logged once: item 1, cases 11, 12, 14.
- `port`, `hub` and the other `local.yml` keys say in their descriptions that they take a restart (Z166): item 8, but see P5, because only 8 of the 12 are start-only.
- "Every Settings control then doing what it shows" (Z166): items 1-6.
- Z174, readers refuse a cadence of zero or less, a negative day window and a `per_signal` that is not a whole number above zero: item 7, items 8-9 (descriptions), cases 11, 15, 16.
- Builder effort experiment: a dispatch matter, not a brief content matter.
- Part with no item: none.

S1. Z174's purpose is not met by "above zero".
- Z174 and brief decision 5 say the readers refuse values that "would make a poller spin".
- Command: `node -e "…setInterval(…, 2**31)"` fired 3 times in 5 ms and printed `TimeoutOverflowWarning: 2147483648 does not fit into a 32-bit signed integer. Timeout duration was set to 1.`
- A `slurm.poll_min`, `slurm.quota_min`, `calendar.poll_min`, `mail.poll_min` or `usage_refresh_min` above about 35791 minutes (2^31-1 ms) gives `setTimeout` or `setInterval` a duration of 1 ms.
  - `hpc/poll.ts:121` then re-arms in a loop.
  - `hpc/poll.ts:248` fires every 1 ms.
  - `loop.ts:114` and `refresh.ts:326-327` behave the same way.
  - A tiny positive value such as 0.00001 also spins.
- Windows with huge values (`days_back` 1e9) give an invalid `Date`; I did not run that.
- Change: item 7 and Z174 need an upper bound for the cadence keys (at most 35791 minutes) and a sensible minimum, with the same bounds in the descriptions and cases. `requireRefreshSettings` (`refresh.ts:139-142`, `minutes > 0` only) needs the same. This is a user-visible vocabulary, so it is Axel's call; the lazy option is "above zero" alone.

## 3. Premises

Verified correct (by `awk`/`sed` on the files named):
- `context.ts`: 205, 210, 211-213, 214-218, 222, 229-237, 271-274, 307, 322, 339, 402-421, 424.
- `portfolio.ts:316-345`.
- `channels.ts:25,77,113`.
- `settings.ts:17,55,125,155` and the check lines 24-26, 62-64, 133-135.
- `refresh.ts:149,164,228,326-327`.
- `hooks.ts:136`.
- `hpc/poll.ts:31,38,60,118-122,173,248`.
- `loop.ts:88,132`.
- `calendar/poll.ts:70,124`.
- `mail/poll.ts:82,118`.
- `watch.ts:68,90`.
- `google.ts:83` and `microsoft.ts:198`.
- Option lines 126, 132, 137, 219, 222-277, 581-613.
- `HELP.md:216`.
- `plan.md:426,747,757`.
- Folder counts: `src/lib/server/root` 9, `tests/server/root` 10, `root/watch` 10, `hpc` 5, `usage` 3, `calendar` 5, `mail` 6, `tests/data/sources` 10.
- Nine tracked items plus `live-settings.ts` is 10, which is allowed.
- The 16 keys: 3 usage + 5 slurm + 3 calendar + 2 mail + 3 notify.
- No `adr` folder (section 7).
- The verify list is 7 commands (`orchestrator-state.md`) and `checks.sh:116` prints "checks: N commands passed".

Wrong or drifted:

P1. Premise on unparseable YAML (brief line 12) is false.
- Command: a scratch engine copy with `behavior.yml` broken, then `loadConfig`.
- Output: `keys slurm/notify/calendar present: false false false`, `findings: [ 'behavior.yml does not parse: Implicit keys of flow sequence pairs need to be on a single line at line 1, column 9:' ]`, `slurmSettings throws: config/behavior.yml: slurm must be a map`.
- `loadConfig` (`merge.ts:150-158`) catches the parse error per file ("Invalid files are findings and contribute nothing"). It does not throw, so `rebuild` publishes `config` with the file's keys missing. A push does follow.
- Consequences: slurm, calendar, mail, tiers and the refresh group each throw, so up to 5 `config:` lines are logged once each (the refresh message is `usage_refresh_min must be a positive number`, with no file prefix). `notifyConfig` returns all defaults silently.
- Change: see C1.

P2. The 12 `local.yml` keys are not all start-only (brief line 16).
- Brief says `edit/writes.ts:213-227` reads "the `local` object made at start". It does not: `edit/writes.ts:211` is `const local = loadLocalOrDefaults(engine);` inside `target(...)`, called per request by `routes/api/write/+server.ts:18`, `(git)/changes`, `(docs)/docs`, `(connect)/+server.ts`.
- `loadLocalOrDefaults` calls `loadLocal`, which does `readFileSync` (`local.ts:310-317`).
- `hub` is also read per call at `images.ts:328`, `project-files.ts:207` and `config-key.ts:230`. `sessions_overrides` (`writes.ts:217`), `bookmarks` (`:219`) and `changes` (`:227`) are re-read per write.
- `HELP.md:236` already says so: "`hub`, `sessions_overrides`, `bookmarks` and `changes` are read again on every write, every wallpaper request and every file opened outside the browser, so an edit to one of those four holds from the next such call … an edit to `port`, `hpc_host`, `sessions_cache`, `workspaces`, `notes`, `claude_bin`, `open_bin` or `accounts` holds from the next start."
- So 8 keys are start-only, 4 are mixed (partly live, partly start), and 4 are the account lists. Item 8's "A change takes effect when the server is started again" on `hub`, `sessions_overrides`, `bookmarks`, `changes`, item 9's "the keys of `local.yml` are read at start" and item 10's "a change to `local.yml` takes a restart" contradict `HELP.md:236` and the code. A hand edit of `hub` today gives a split state until restart.
- Change: this is a user-visible wording. Raise to Axel with options: (a) an honest sentence for the 4 mixed keys ("read again by some requests at once and by the rest when the server is started again; restart after a change") and 8 keys with the restart sentence; (b) make the 4 keys fully start-only or fully live in code; (c) the brief's wording, which is false for 4 keys and was the cheaper option. Add `HELP.md:236` to the paths either way, and fix verify check 4 (it counts 12).

P3. Q85c claim is false (brief line 20: "in `settings.ts` only `usageTiers`'s loop, :154-158"). See section 8.

P4. D31's `loadConfig` stub claim (brief line 20) is not what D31's worktree does. See section 8.

P5. Off-by-one and range drifts:
- `LoopSource.pollMin` is at `loop.ts:32`, not `:31` (`:31` is `dir: string;`).
- The slurm keys are at `behavior.yml:74-79`, not `:72-77` (`slurm:` is :74, `host` :75, `prewarm` :79). The calendar block header is :89, its keys :90-92.
- The sentence on `locals.config()` is `DESIGN.md:234`, not `:235` (`:235` is blank).

P6. "The six catalog sentences" (item 1) is wrong. Four keys are listed and exist (`notify.stop` `server.yml:6`, `calendar.ics_failed` and `calendar.ics_no_link` `calendar.yml:15-16`, `accounts.timed_out` `account-setup.yml:91`), handed to five places: calendar words x3, mail `timedOut`, `stopMessage`. `ConfigPayload` (`model/index.ts:224`) already carries a flattened `text`. Change: "four sentences".

P7. "Every timer stays on the injected clock each poller already takes" (What it must do) is wrong for the HPC poller: `HpcOptions` (`hpc/poll.ts:20-30`) has no clock, and `calendar`/`mail` inject only `now()` while the timers are global `setTimeout`. Existing tests use `vi.useFakeTimers()` (`hpc/poll.test.ts:122`, `calendar/poll.test.ts:183`, `loop.test.ts:143`). Change: say "vitest fake timers".

## 4. Cases and checks

C1. Case 18 is wrong (P1). Expected result under the code: a push follows with the file's keys missing; each of slurm, calendar, mail, tiers and refresh logs its own `config:` line once; `notify` silently becomes defaults (if kept); the server's own reading of the file is a finding on the config channel. Rewrite case 18 to that. As written the builder's first run will show the rule wrong and stop, as the brief's own stop rule says.

C2. Item 4 contradicts itself, and case 5's retry half proves nothing.
- Item 4: "every account due later than `clock() + minutes*60000` is due at that time", and "an account in its retry wait keeps its retry time". `loop.ts` keeps only `due: Map<string, number>` (:96), with no retry marker.
- For a new `minutes` below `RETRY_MIN` (2), a retry-waiting account is "due later", so the cap overrides its retry time.
- Case 5 uses `poll_min: 5` against a 2-minute retry, which passes with or without a retry rule.
- Also inconsistent: HPC counts the new minutes from the change in both directions (decision 3), while accounts are only capped. Raising the cadence changes nothing for accounts.
- Change: state the rule (for example "cap to `min(due, clock()+m)`; a retry time is never moved later or earlier than the cap") and add a case with `m` = 1 and an account in retry wait, plus a raise case (due in 3 min, new 5: read in 3).

C3. Case 9 passes without the step (N1). Delete it with item 6.

C4. Case 14 gives no expected log text and no re-log rule. Give the line and say whether the "once until read again" rule applies.

C5. Case 13 passes on the unchanged tree (nothing re-reads), so by verify 5 it is a preservation test, not proof. Case 17 is likewise trivially true on the unchanged tree (no sink). Label them audits, or state what in them fails without the step (for example "the sink is added, then removed: `hub.size` back to its start value").

C6. Case 10 says "`calendar.ics_failed` or `accounts.timed_out`" without saying which watcher; `accounts.timed_out` feeds both calendar and mail, `calendar.ics_no_link` has no case. Name each.

C7. `agents/spec.md:60` ("every asynchronous path is exercised in flight, after close, and superseded by a later one") is not met by the cases. See section 6 for the missing ones.

C8. Verify 3 (`grep -n "once here\|built from it once" …`) searches the old wording but expects "the rewritten comment". A correct rewrite that drops those words prints nothing; an unchanged comment prints the old lines. Change: `grep -c "built from it once" src/lib/server/root/context.ts` prints 0 and `grep -n "every config push" src/lib/server/root/context.ts` prints the new comment line.

C9. Items 8-10 have almost no command. Verify 4 counts the 12-key sentence only. Give the exact sentence for the 4 refused-at-run descriptions, the 8 bounds and the 4 account keys, each with a `grep -c`; same for the `DESIGN.md` paragraph and `HELP.md:216`.

C10. Size headroom for tests: `wc -l` printed `calendar/poll.test.ts` 892 (108 lines of headroom under the 1000-line rule; `size.test.ts` covers `tests`), `usage/refresh.test.ts` 840, `config-key.test.ts` 562, `context.test.ts` 471. `tests/server/accounts/calendar` holds 5 items and `mail` 6, so a new test file fits there. Change: allow new test files in those two folders.

C11. Verified consistent with the code: cases 1, 2, 3, 4, 6, 7, 8, 11, 12, 15, 16 (their expected results follow from items 3-5 and 7 as designed). Message form in case 11 matches the reader style (`settings.ts:26`). Q85c's new `settingOf(positiveShape, …, 'a number above zero')` gives the same sentence.

## 5. The question

Could it pass without the goal (16 keys live without restart, a refused hand edit keeps the old settings and logs once, the 12 start-only keys say restart)?

Cases:
- 1, 3, 4, 6, 7, 8, 10, 12, 15: no, each fails on the unchanged tree and needs the behaviour.
- 2: first half no; second half (`hpc_host` set, no poll) passes on the unchanged tree.
- 5: the retry half passes either way (C2).
- 9: passes in production now (N1).
- 11: the keeps-the-old-settings half needs the step; "second push logs nothing" passes trivially.
- 13: passes unchanged.
- 14: log line unspecified.
- 16: passes only with item 7, but covers 3 of the 8 keys.
- 17: trivially true.
- 18: expected result is wrong.

Items:
- 1: no, but no case covers a different refused message logging its own line, or per-group refusal for calendar, mail, refresh and tiers (only slurm in case 11). A builder can skip the try/catch around four groups and pass.
- 3: `days`, `prewarm`, "poll in flight re-arms at its end" and the retry-wait state are uncovered.
- 4: `daysAhead` and `setWords` for mail are uncovered.
- 5: "a start already running finishes with the model it began with" is uncovered.
- 6: dead.
- 7: 5 of the 8 keys (`quota_min`, `calendar.poll_min`, `mail.poll_min`, `days`, `days_ahead`) have no bound case, and S1 shows the bound does not stop a spin.
- 8-10: no command (C9).

Keys with no case at all: `slurm.days`, `slurm.prewarm`, `calendar.days_ahead`, `notify.quiet_seconds`. A builder can leave any of these four unwired and pass every case.

Change: add one case per uncovered key and per-group refusal cases, and a bound case per key of item 7.

## 6. Implied inputs missing from "Cases"

Proposed expected results:
1. Push while an HPC poll is in flight, host or days change: the in-flight poll's rows are published with `host: options.host` read at publish time (`hpc/poll.ts:159`), so old-host rows are labelled with the new host. Expected: rows from the poll that began under the old host are dropped or labelled with the host they came from; the queued follow-up runs under the new one.
2. Host change then the new host unreachable: `degraded()` (`hpc/poll.ts:85-95`) republishes `rows`, `lastOk` and `quota` from the old host. Expected: rows, `lastOk`, quota, `asked` and `logPaths` are cleared on a host change, or the old rows are shown labelled with the old host. Say which.
3. Host and days both change in one push: one poll, not two (the gate).
4. HPC poller in retry wait (RETRY_MIN 2) when `poll_min` changes: expected the retry time kept (consistent with the account rule); item 3 re-arms "the waiting timer at the new minutes".
5. Raise `pollMin` and a raised cadence: the payload keeps the old `pollMin` "until the next publish". The head marks the answer late when `now - updated > (data.pollMin + LATE_GRACE_MIN) * 60000` (`hpc/Head.svelte:37`, `ConnectorHead.svelte:59`). A raise from 5 to 60 shows a false "late" for about 55 minutes. Expected: `set` republishes (HPC, calendar, mail) on a `pollMin` change.
6. Poll window change while a calendar round is in flight: the in-flight round publishes the new `daysBack`/`daysAhead` over events read with the old window (`calendar/poll.ts:165-166`). Expected: the follow-up `run(true)` corrects it; say so.
7. Setter after the watcher's own `close()` (each of `watchHpc.set`, `setPollMin`, `setSettings`, `setWords`, `watchUsageRefresh.set`, `setTiers`): "does nothing" is stated in prose only. Expected: no timer re-armed, no poll, no publish.
8. Two pushes in quick succession: `Hub.#deliver` coalesces while a send is in flight (`channels.ts:117-127`), so a middle push can be skipped. Expected: the last wins; the log-once state follows the last push.
9. A refused value repaired to the value already in force (20 to 0 refused to 20): the group is equal, nothing is handed on, but the logged state must reset so a later refusal logs again.
10. Usage refresher with no Claude account: `accounts` is empty (`refresh.ts:166`), the interval still exists. Expected: `set` replaces the interval, no start, no error.
11. A text fragment unparseable at push: `textCatalog(config)['calendar.ics_failed']` is `undefined` at run time though typed `string`, with no reader that refuses it. Expected: a missing sentence keeps the sentence in force and logs once, as a refused group.
12. Timer re-armed to a time already past (account overdue in a long round, then `setPollMin`): `schedule()` clamps with `Math.max(0, wait)` (`loop.ts:114`). Expected: fires once at once, not repeatedly.
13. A push before the first poll: the first poll starts at construction (`hpc/poll.ts:246-247`, `loop.start()`), so no state exists where a setter runs "before the first poll". Expected: a push with equal values is a no-op; say how the baseline is passed to `liveSettings` (the brief leaves "targets" and the start values unspecified).
14. `hpc_host` precedence: it is start-only (`local.hpcHost`), so adding or removing it while running changes nothing, and the Live HPC route reads the same start value, so both agree. Expected: case 2's second half covers set-at-start; no further case.

## 7. ADRs

- Command: `ls ../../docs/adr docs/adr` from `tools/oculus` printed `ls: ../../docs/adr: No such file or directory` and `ls: docs/adr: No such file or directory`.
- Command: `find . -maxdepth 4 -type d \( -iname adr -o -iname adrs -o -iname decisions \) …` printed nothing. `grep -n adr .agents/plan.yaml` printed nothing.
- No ADR touches the step. The brief is correct.

## 8. Merge claims

M1. Q85c overlaps D35's `settings.ts` range (the brief says it does not).
- Command: Q85c brief (`agents/briefs/Q85c.md`) line 20 names `config/settings.ts:17-165` with all seven readers (`slurmSettings`, `calendarSettings`, `searchSettings`, `openSettings`, `mailSettings`, `changesKeep`, `usageTiers`), and its item 4 rewrites them through schemas.
- Command: read-only `git diff -U0 HEAD -- tools/oculus/src/lib/data/sources/config/settings.ts` in `.agents/worktrees/Q85c`. Hunks include `@@ -18,18 +64,3 @@` (slurmSettings), `@@ -56,12 +87 @@` (calendarSettings), `@@ -126,11 +138,4 @@` (mailSettings) and `@@ -156,8 +153,4 @@` (usageTiers).
- The worktree file already has `positiveShape`, `wholePositiveShape` and `settingOf(shape, block, name, key, words)` producing `config/behavior.yml: <name>.<key> must be a number above zero`.
- D35 item 7 edits the `number` helper in lines 17-140 of the main file, and those lines are exactly Q85c's rewritten ones. A textual conflict on every reader. This is not a simple merge.
- Change: D35's reader changes land after Q85c (or are written against Q85c's `positiveShape`/`wholePositiveShape`, plus a new non-negative shape for `days`, `days_back`, `days_ahead`), and the path line for `settings.ts` says so. Q85c's main-side claim in the brief ("only `usageTiers`'s loop") is wrong.

M2. D31 and `context.ts`/`context.test.ts`.
- D31's real `context.ts` hunks (read-only `git diff -U2 HEAD -- …context.ts` in `.agents/worktrees/D31`): imports at 45-47 and 68-70, `ContextDependencies`/`dependencies`, `requireAutofetch(config)` after `requirePaintLimit` (base :222), `watchAutofetch` after `watchGit`, and `autofetch.close()` between `bookmarks.close()` and `git.close()`.
- D35's edits sit at the comment 211-213, the post-poller start, `close()` first line (:381-383) and the import block next to `./hooks.ts` (:48), so imports are within 3 lines of D31's (:46-47). A mechanical import conflict is possible. The two `close()` insertions are about 6 lines apart.
- `context.test.ts`: D31's worktree diff has `@@ -46,19 +72 @@` (it replaces the `loadConfig` stub in `inertDependencies` by `loadConfig: () => ({ config: inertConfig(), findings: [] })`), adds `watchAutofetch: () => ({ close: noop })` next to `watchGit` at line 80, and changes the `closes` array to length 12 in the first case. D35 edits the same function (watcher stubs, lines 69-89), the same first case's recorders (115-145) and appends a describe. Hunks collide.
- The brief says D31 "adds `git: { … }` to the `loadConfig` stub"; in D31's worktree the stub is restructured into `inertConfig()`. Change: the brief should tell the builder to expect that, and the orchestrator's `shared_paths` should say D35's `context.test.ts` is merged by hand after D31 lands (or D35 rebases onto D31).
- `docs/diagrams/layer-server.dot` and `.svg` are changed by D31's worktree and will also be regenerated by D35's new `server/root` module: regenerate at landing.

M3. D31 and `options.yml`, `DESIGN.md`, `HELP.md`, `config-key.ts`, `behavior.yml`: no overlap.
- D31 `options.yml` hunk is `@@ -297,0 +298,4 @@` against D35's 126-137, 219-277, 581-613 plus the 4 descriptions.
- D31 `DESIGN.md` is 116, 128, 344 against D35's 224-236.
- D31 `HELP.md` is 172, 186, 222 against D35's 216 (and 236 if added): five or more unchanged lines between.
- `config-key.ts` is D31 only (`@@ -54,0 +55`, `@@ -91,0 +93`).
- `behavior.yml` is D31 only.

M4. U3 and D35: no overlap.
- U3's `DESIGN.md` hunks are 158, 216, 220, 222, 374, 392, 405 and its `HELP.md` hunks 101, 111, 122, 127, 150, against D35's 224-236 and 216.
- U3 changes no file under `src/lib/server`, `src/lib/data` or `config/catalogs/options.yml`.
- U3 brief says "each other line the report names with its grep" (open-ended), so a final re-check at landing is needed.

M5. Q85c's other paths do not touch D35's server files (its brief says no `src/lib/server`, `config/`). `tests/data` is Q85c's and D35 writes nothing there.

## Declined to judge

- Runtime behaviour: I ran no tests and built no worktree. The statements about what the code does come from reading the files plus the `node -e` and `loadConfig` runs above. The timer-overflow run is Node's behaviour; I did not run the pollers.
- Whether the 8 `calendar`/`mail` setters stay under the duplication threshold (N6): I did not measure clones.
- Bounds on window and count values (huge `days_back`, `days_ahead`, `per_signal`): I did not run them; only the timer overflow was verified.
- Whether the log line's literal "the settings in force are kept" conflicts with the rules file's catalog-string rule (spec.md:45): `console.error` literals have precedent in `server/` (`portfolio.ts:303`, `git.ts` watcher) so I left it, but this is a reading, not a ruling.
- The "Builder effort experiment" (ordo-medium builder) and whether this brief's length suits that builder: not a brief-vs-tree question.
- Other queued briefs (Q88c, S4 and the like) overlapping D35's paths: only D31, Q85c and U3 were asked for and checked.
- Whether the `notify` and `local.yml` findings (N1, P2) change Z166 or Z174: those are Axel's rulings; I report the facts and options only.

Usage: claude-sonnet-5-5 (read from its transcript), 279,072 tokens, 70 tool uses, 13.0 min.

## Closed

How each finding is closed. The step waits for D31 and Q85c to land (M1, M2), so the brief is rewritten at the next `/spec` of D35 on main after both landings, with the closures below; the check is not run again.

- N1: premise corrected: the three `notify.*` keys and `notify.stop` are read by the hook route at every request (`src/routes/api/(sessions)/hook/+server.ts:11-16`), so 13 keys are start-only. Item 6, the notification group of item 1 and case 9 are removed; the unread `hooks.config` and `hooks.stopMessage` built at start are removed from the context, the route being their one reader. Booked as a premise correction beside Z166 in `plan.md`.
- N2: `tests/server/root/context-fixture.ts` added to the paths.
- N3, P2: Z177 (the orchestrator, automode): every `local.yml` key except the four account keys is read once at start and used from the start value everywhere; `HELP.md:236` added to the paths and rewritten.
- N4: the item 9 paragraph says how `live-settings.ts` takes the config push rather than a route's argument.
- N6: the calendar and mail setters share one function in `loop.ts`; `tests/checks/tree/allow-duplication.txt` is not added.
- S1: Z174 amended (the orchestrator, automode): bounds with an upper limit, below.
- P1, C1: case 18 rewritten to the code: a push follows with the file's keys missing, each refused group logs once, the parse error is a finding.
- P3, M1: D35's reader changes are written on Q85c's shapes after Q85c lands.
- P4, M2: D35 is prepared after D31 lands, so `context.ts` and `context.test.ts` carry D31's changes at its base.
- P5, P6, P7: line numbers corrected, "four sentences", and "vitest fake timers" in the brief.
- C2: the account rule stated: a new cadence sets each account's due time to `min(due, now + m)`, a retry time never later than that; a case with `m` = 1 and an account in retry, and a raise case.
- C4, C6, C8, C9: the log line of case 14 given, each sentence's watcher named, verify 3 and the description checks rewritten as stated.
- C5: cases 13 and 17 stated as audits, case 17 checking the sink count returns to its start value.
- C7, section 5, section 6: a case per uncovered key and per group's refusal, a bound case per key, and the implied inputs 1 to 13 as cases with the expected results the report proposes, input 2 decided as: a host change clears the rows, `lastOk`, the quota and the resolved log paths; input 5 decided as: a `pollMin` change republishes.
- C10: new test files allowed in `tests/server/accounts/calendar` and `mail`.
- Applied in `agents/briefs/D35.md` as written on main at 48e29272, the cases renumbered: the audits of C5 are cases 18 and 24, the log line of C4 is case 16, the parse-error case of P1/C1 is case 20, the account rule of C2 is item 3 and cases 9 and 11, the bounds of S1 are item 8 and case 22, the implied inputs of C7 are cases 1 to 15, 21, 23 and 26.
