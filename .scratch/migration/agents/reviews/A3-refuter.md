# Step A3 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/A3, base 81daf48b1)

Not met: verify item 8 (unmet, as instructed). Findings that need a repair round: Spec 1 (Pause and Resume rewrite an entry from its normalised form, so `task: radar` becomes `task: litwatch`), Proof 2 (the G31 test of the schedules file cannot see a write) and Proof 3 (one unexplained red run of verify item 2 in 46). The DOM cases are declined to judge.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md   (from the worktree's tools/oculus)
test:quick: 74 changed file(s), from git since HEAD
test:quick: 83 test file(s), 10 essential
ok prettier (0.4 s) | ok ASCII gate (0.4 s) | ok svelte-kit sync | ok eslint (2.3 s)
ok svelte-check (7.3 s): ... 376 FILES 0 ERRORS 0 WARNINGS
ok vitest (16.8 s)
test:quick: 17.3 s (limit 45.0 s); every command passed
checks: 1 commands passed            (exit 0)

$ npm run test:checks
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)            (exit 0; the report's line 790 says the same)

$ npx vitest run <verify item 2's seven paths>      46 runs in total:
  run 1 of this turn:   Tests  1 failed | 86 passed (87)     (the failing test was not captured)
  45 later runs (6 + 12 sequential, 9 three-at-a-time, 15 sequential, plus 1 verbose earlier): Tests  87 passed (87)

ASCII gate of spec.md (perl over src tests config): prints nothing; LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md README.md A3-report.md: exit 1, no hits
$ sh utils/unused-exports.sh | wc -l      378   (base 378; none of the step's names in it)
wc -l: every written file under its limit (largest: watch.ts 709, terminals.svelte.ts 830, context.ts 813; components 245/221/262)
ls | wc -l: state/system/machine 10, tests/server/machine/schedules 5, server/machine/schedules 6, the others at or under 10
$ ls src/lib/server/machine/tasks tests/server/machine/tasks    fails (both gone)
$ ls -d .agents/worktrees/A3-base     No such file or directory

The builder's final probes, copied to $SP/a3-rv0/final with only their output paths moved, rerun on the final tree:
$ TZ=Europe/Brussels npx vitest run -c $SP/a3-rv0/final/vitest.config.ts engine engine2 entries     exit 0
  engine.out and engine2.out: identical to the report's after masking terminal ids
  entries.out: identical except scratch paths and the time stamps of S19 and S16
$ npx vitest run -c $SP/a3-rv0/final/vitest.svelte.config.mjs store     8 passed; store.out identical to the report's
$ npx tsx $SP/a3-rv0/final/misc.mts      (over my own rsync of config/ with --exclude=local.yml)   identical to the report's misc.out
$ npx tsx $SP/a3-rv0/final/tmux.mts      (scratch socket under /private/tmp/claude-502/a3rv, the builder's stub copied, server killed at the end)
  C1 pane pid equals the printed pid: true; C20, C35 and C36 lines identical to the report's apart from pids, ids and times

My own probe ($SP/a3-rv0/final/pause.probe.ts; scratch files only), planEdit then commitText:
task radar   | pause: file after="- name: A\n  runs: { task: litwatch }\n  when: \"0 7 * * *\"\n  paused: true\n" | problem before=update-task-unknown | problem after=null
unknown key at | pause: file after="...  when: \"0 7 * * *\"\n  paused: true\n" (the `at: 7` line gone) | problem after=null
when 5       | pause: file after="...  when: \"5\"\n  paused: true\n"
unattended 1 | pause: (the `unattended: 1` line gone) | problem after=null
key order    | pause: "- when: \"0 7 * * *\"  # daily\n  name: A\n ..." becomes "- name: A\n  runs: { task: scout }\n  when: \"0 7 * * *\"\n  paused: true\n"

Greps:
- diff plus untracked files for mutation, mutant, revert, breakage, inject, stryker: no harness. The only hits are the report's NOT DONE line, its C26 wording "injects `run`" (a test double) and plan text.
- added src, tests and config lines for history words: four hits, each describing behaviour at run time, not history (watch.ts "replaced by a rename", record.ts "is replaced", file.ts "replaced by `node`", run.test title "no longer a served root").
- grep -rn "research-cockpit" tests: only argv assertions (run.test.ts:46, :55; terminal-actions.test.ts:79) and feeds.test.ts fixture text.
- step tests for spawn, execFile, homedir(), local.yml, ~/.oculus, claude: comments and the CLAUDE stub path only (schedules-fixture.ts:23 '/stub/claude', run.test.ts:142, schedules-fixture.ts:105).
- the top level of the new modules for module-level `let` or a mutable Map, Set, array or object: none (grep exit 1).
- git's changed-file list compared with the report's file table: equal (diff lists only the report itself and schedule.svelte.ts, which the report lists as "Only in").
```

## Verdicts

Items of the brief's "What to build":

- 0: holds. The two `tasks` folders are gone, and the file table agrees with `git diff 81daf48b1 --name-only`. `.agents/worktrees/A3-base` does not exist (it is the orchestrator's to make), so the builder diffed against its own copy `$SP/a3/base`.
- 1: violated, Spec 1.
- 2: holds (entries.out S5 to S14, S36 to S40, S48; engine.out C4 to C6, all rerun).
- 3: holds (C7 to C10, C20 to C22, C28, C34 rerun; record.test.ts read). See Behaviour 1 for the order of the record move and the commit.
- 4: holds (C2 to C31 and C35 rerun; no module-level state). See Behaviour 2.
- 5: holds (C16 and run.test.ts; run.ts read: argv `[claudeBin, ...flags, '--', prompt]`, no shell).
- 6: holds (svelte-check 0 errors).
- 7: holds (S24, S25, S43 to S47 rerun; schedules.test.ts; `claude_bin` is read at the call in `context.ts:416-419`). See Standards 3 for the 500 answer.
- 8: holds; see Standards 3 for the extra keys.
- 9: holds (misc.out S34; config.test.ts rows pass).
- 10: holds (store.out S10, S27 to S32).
- 11: holds by server render. The DOM parts are declined to judge.
- 12: holds. The allow-list rows are needed: `schedule.svelte.ts:14-15` imports `cron` and `schedules`.
- 13: violated, Standards 2.
- 14: not applicable. E4 is not on main; the brief gives the item to the landing.

Cases:

- C1: met (tmux.mts rerun: the pane pid equals the printed pid).
- C2: met.
- C3: met, and the S16 render shows "Off: it runs only from Run now".
- C4: met.
- C5: met.
- C6: met.
- C7: met.
- C8: met.
- C9: met.
- C10: met.
- C11: met.
- C12: met.
- C13: met.
- C14: met.
- C15: met.
- C16: met.
- C17: met (03:30 +0200 on 03-29; 02:30 +0200 once on 10-25; 01:00, 02:00, 03:00 with no second 02:00).
- C18: met.
- C19: met (longest timer asked 30000 ms; one start at 2027-01-01).
- C20: met (tmux.mts gives the press).
- C21: met.
- C22: met.
- C23: met.
- C24: met.
- C26: met, by reading. run.test.ts:140-145 injects `run`, `claudeBin`, `commands` and `approvalsFor`, and the fixture does the same (schedules-fixture.ts:23, :105). No `homedir()` and no `local.yml` in the step's tests.
- C27: met (store.out C27).
- C28: met.
- C29: met.
- C30: met.
- C31: met.
- C34: met for the value (equal before and after). The file bytes were not compared.
- C35: met.
- C36: met.
- S1, S2, S3, S4: met.
- S5: met for the reading. Pause on that row changes what it runs; see Spec 1.
- S6 to S15: met.
- S16: server part met. The tray's said line and closing are declined to judge.
- S17 to S22: met.
- S23: met by reading (`file.ts:418` refuses with `entry-changed`). For pause and resume, though, the check compares against the normalised entry; see Spec 1.
- S24 to S29: met.
- S30, S31: met by server render.
- S32: met for the store and render. The menu and Save in a browser are declined.
- S33: declined to judge.
- S34, S35: met.
- S36 to S41: met.
- S42: met. The unquoted-`when` file is unread at line 3, which is the parser's line for the builder's text, where `when` sits on line 3.
- S43 to S50: met.
- S51: partial, Proof 4.
- S52: met.
- Verify item 8: unmet, Proof 1.

## 1. Spec

- `src/lib/server/machine/schedules/file.ts:408-414` and `:365`: `const held = readEntry(raw); ... entry = { ...held.entry, paused }; text = withEntry(parsed, edit.at, entry);` and `next[edit.at] = entryObject(entry)`.
  - What is wrong: Pause and Resume render the whole entry again from `readEntry`'s normalised entry. `readEntry` replaces an unknown task with `UPDATE_TASKS[0]` (`data/helpers/run/schedules.ts:128`), drops unknown keys and a flag of the wrong type, and turns `when: 5` into `"5"`. The re-parse check compares against that same normalised entry, so it passes.
  - The brief, item 1, "Writing": "a pause sets `paused: true` and a resume drops it", and the re-parse is "compared with the list as asked (the old list with the one change)". The rows that carry these problems still offer Pause (`ScheduleList.svelte:104`, `readable` is `entry !== null`).
  - Failure scenario: the reader typed `runs: { task: radar }`. The row shows the `update-task-unknown` sentence beside the label "Lit Watch". The reader presses Pause, then Resume. The file now holds `task: litwatch` with no problem, and Lit Watch starts at every due time. The reader never chose it, and that may be unattended. My probe: problem before `update-task-unknown`, problem after null. On a readable hand-written entry, Pause also drops its inline comment and reorders its keys (the "key order" probe line).
  - Verdict: item 1 violated; S5 and S23 carry the note.

## 2. Proof

1. Verify item 8, for the five new test files.
   - What is wrong: no run of any new test is quoted with its module present and the behaviour missing. The report says so in its first line, and its handed-tree run stops at import, which item 8 says does not count. Running such a test now with code removed is banned, so I judged each new test by reading. These would fail if the behaviour were absent:
     - watch.test.ts: the start counts, `skipped` records, kill-before-new-session order, one start from two watchers, no timer after close.
     - run.test.ts: the exact argv, cwd, terminal name, refusal word and zero `new-session`.
     - record.test.ts: `ok:false why:unread`, the file byte-equal and no lock left, against functions that do write.
     - schedules.test.ts: 403, the file unchanged, `reload` and `runNow` not called.
     - file.test.ts: only partly; see Proof 2.
   - Failure scenario: the orchestrator lands tests whose red run on the behaviour was never seen.
   - Verdict: verify item 8 unmet.
2. `tests/server/machine/schedules/file.test.ts:54`: `expect(readFileSync(file, 'utf8'), name).toBe(held);`
   - What is wrong: the test calls only `planEdit`, which writes nothing (`file.ts:388-430`; the write is `commitText`, which the route calls at `routes.ts:176`). The "leaving it" half of the G31 title holds by construction. Only the 409 `schedules-unread` assertion can fail.
   - The route's path over an unread file, which is what G31 guards, is shown only by the scratch probe S3, not by a test.
   - Failure scenario: a later change makes the route commit before it checks `planned.ok`, or commit a rebuilt text over an unread file. file.test.ts stays green, and the G31 entry names it as the guard.
   - Verdict: G31's added test does not cover the overwrite it is named for. A route-level row (save, delete, pause and resume through `handleSchedules` over the three unread texts, with the file byte-equal after) would.
3. Verify item 2, the step's seven paths.
   - What is wrong: one of my 46 runs printed `Tests  1 failed | 86 passed (87)`. My command kept only the summary line, so the failing test is not known. The 45 later runs passed, including 15 sequential runs that kept the full output and 9 runs three at a time. The O30 builder was running in another worktree at the time.
   - Failure scenario: an intermittent red in watch.test.ts or another of the seven at landing, with no known cause.
   - Not settled. It is settled by running the set in a loop with the full output kept until it fails, then reading the named test.
4. Report, "Engine cases, second part", S51.
   - What is wrong: the line printed is `runs=; row now: problem={"word":"folder-not-served",...}`. The brief's S51 expects "the run recorded `failed` with `why: { word: 'folder-not-served' }`". In the probe, a delayed `fs.watch` event on `schedules.yml` reloaded the file after `rootsFor()` emptied, so the job stopped before 07:00 (`watch.ts:613-621`). The due-time refusal path was never reached. The report counts S51 under item 1 DONE without naming the difference.
   - The refusal path itself (`runEntry` refusing, then `settleRun` recording `failed` with `why`) is the one C23, S6 and S26 show.
   - Failure scenario: the orchestrator reads S51 as met.
   - Verdict: S51 partial.
5. Report, "Host- or user-visible changes": "`schedules.yml` and `schedule.json` are new files under `~/.oculus`; both are written with mode 0600".
   - What is wrong: `writeAtomic` (`core/json.ts:112-113`) applies the mode only to a file that does not exist yet. A `schedules.yml` the reader makes by hand, which HELP invites, keeps its mode, for example 0644. `~/.oculus` itself is created with the default mode.
   - This matches the brief's `writeTextAtomic(path, text, 0o600)`. The report's sentence overstates it.
   - Failure scenario: the look or the orchestrator takes every schedules file to be private when a hand-made one is not.

## 3. Standards

1. `tests/checks/config/config.test.ts:378`: `'names the key that replaced a retired one, against behavior.yml: %s'`
   - What is wrong: no key replaces the two retired keys any more. The sentence now names the Run unattended choice. The title says something the test no longer checks. The brief (item 9) kept this title, so the wording traces to the brief.
   - Failure scenario: a reader of the G12/G13 test list looks for a replacing key that does not exist.
2. Sentences the diff makes false.
   - DESIGN.md:138 says the route "edits the file as text with the library's document so comments and the order of keys stay". For the entry being edited, both are lost (my "key order" probe).
   - DESIGN.md:138 also says "the route refuses a save, delete, pause or resume with `schedules-unread` or `record-unread` (409) before it touches either file". A pause or resume while the record does not read answers 200 and writes `schedules.yml` (entries.out S43: "pause (not a record write)=200").
   - HELP.md:25: "The file is YAML that the dialog writes with its comments kept". A comment inside an edited entry is dropped.
   - Failure scenario: a reader keeps notes as comments inside an entry, presses Pause, and the note is gone.
   - Verdict: item 13 violated.
3. `src/lib/state/system/machine/schedule.svelte.ts:246`, `:490`, `:493`, `:501`, and `routes.ts:177`: `t('app.schedules.unreachable')`, `t('app.schedules.unreadable')`, `t('app.schedules.refused')`, `refuse(done.reason, [], 500)`.
   - What is wrong: DESIGN.md "Untyped input" says a failed read is worded by `failedAnswer` of `state/shared/answers/answers.ts`, and otherwise by `ui.answer_refused` or `ui.answer_unreadable` with the status in parentheses. The store adds three keys of its own that repeat these sentences and drop the status.
   - The route's commit failure answers the operating system's English message as `error`, which the page then cannot word. Item 12 gives `{ error: word, names }`.
   - Failure scenario: a save into a read-only `~/.oculus` shows "The server refused the request." with no status and no reason.

No history in comments, no non-ASCII, no file over its limit, no secret in a quoted line.

## 4. Behaviour

1. `src/lib/server/machine/schedules/routes.ts:163-177`: the record rename or drop (`renameRecord` :169, `dropRecord` :167 and :173) runs before `commitText` (:176).
   - What is wrong: when the commit fails (disk full, a read-only file, a failed read-back), the record has already moved or dropped while `schedules.yml` still holds the old name. The schedule loses its 20 runs and its `handled` time. The report does not state it.
   - It does not double-start: a fresh record entry starts with `since` set to now.
   - Failure scenario: a rename that returns 500 leaves the old-named row with an empty run history.
2. `src/lib/server/machine/schedules/watch.ts:487-491`: `const claimed = await claimDue(...); ... if (claimed.value === 'handled' || working !== null) return; if (stopped()) return;`
   - What is wrong: a `close()` (a server stop, or a rebuild after a `local.yml` change) between the claim and the launch leaves a run recorded `started` with `terminal: null`. Nothing started, and that due time is handled, so it never catches up. The report does not state it.
   - Failure scenario: the server stops in the milliseconds after a 07:00 claim. The row lists "07:00 scheduled started", and no run happened that day.
3. Security, reported as found, no defect against the brief (Z586, Z590):
   - `schedules.yml` and `schedule.json` can be written by any process of the user. A new file is 0600 and a hand-made one keeps its mode (Proof 5).
   - The route needs the write token (`tokenedBody`; schedules.test.ts), and every `/api/` request passes `sameOrigin` in `hooks.server.ts`.
   - A prompt runs only when its folder's real path lies in or under the hub or a served root. This is checked at read (`file.ts` `promptFolder`) and again at start (`run.ts`), with no shell (`argv` to tmux; run.test.ts row "shell text ... stays one argument").
   - Run unattended adds `--dangerously-skip-permissions` to a task or a prompt only.
   - No privilege beyond what the terminal route already gives a token holder.

The six paths outside the write list:
- `Confirm.svelte` (`level` prop, default `dialog`): inside the step's part. The tray's ground is 65 and a Confirm at 60 would sit under it. Sound.
- `config-folder.test.ts` (drops `tasks`): inside, since `behavior.yml` loses the block. Held whole under G12/G13 (guarded.md:143). Sound.
- `commands/list.ts` (`savedFile = savedPath()`): inside, so the route's chain check reads the watcher's file. The default is unchanged. Sound.
- `schedule-words.ts`: inside (the store's wording). Sound.
- `schedules-fixture.ts`: a test helper. Sound.
- `README.md:11` (`claude_bin` sentence): inside, and true. `context.ts:416-419` hands `local.claudeBin` to `runEntry`, whose prompt argv starts with it (`run.ts`).

The tray, the rows and the dialog against the mock-up and Z569 to Z588 match by server render (store.out S16, S1, S3, C27, S28 to S32). The dialog opening with When Off is what the brief's look step 2 asks.

## Declined to judge

- What needs a DOM: S16's run line and Run now closing the tray, S30 to S33 in a browser, the delete Confirm's z-order over the tray, the Escape order, and the tray's scrolling. I ran no scratch oculus with headless Chrome. They belong to the look.
- The builder's base copy `$SP/a3/base` against main at 81daf48b1: not compared byte for byte, since the git commands that would show it are outside what this review may run. The changed-file lists agree.
- The cause of the one red run (Proof 3): not found.

Reviewer usage: agent id not visible to the reviewer, served model claude-opus-5-5, tokens, tool uses and minutes not measured by the reviewer.

## Repair round 1, refuted

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from the worktree's tools/oculus)
$ npm run test:quick
test:quick: 77 changed file(s), from git since HEAD
test:quick: 83 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      eslint (1.9 s)
ok      svelte-check (9.3 s): 1791252963547 COMPLETED 376 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.5 s): Duration  14.99s (transform 21.39s, setup 0ms, import 38.48s, tests 19.12s, environment 205ms)
test:quick: 19.1 s (limit 45.0 s); every command passed
checks: 1 commands passed
exit 0

$ npm run test:checks
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)
exit 0

$ npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/data/sources/config/local.test.ts --reporter=verbose
 Test Files  8 passed (8)
      Tests  45 passed (45)
 (pass) |unit| tests/server/machine/schedules/run.test.ts > runEntry > starts what a schedule runs, or refuses it with its word 130ms
 (pass) |unit| tests/server/machine/schedules/watch.test.ts > watchSchedules > starts a schedule once per due time 448ms
 (pass) |unit| tests/server/machine/schedules/record.test.ts > the run record > refuses a write over a schedule record it cannot read, leaving it 21ms
 (pass) |unit| tests/server/machine/schedules/file.test.ts > the schedules file > refuses an edit over a schedules file it cannot read, leaving it 55ms
 (pass) |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "schedules: 3" with the sentence it would throw 0ms
 (pass) |unit| tests/routes/machine/schedules.test.ts > POST /api/schedules > refuses a request without the write token 13ms

The builder's round probes (pair, save, commit, stop, s51), copied from its scratchpad to $SP/rv1/rerun with only their output paths moved, run with its vitest config under a scratch HOME:
  pair.out: identical to the report's five blocks, "byte-equal after the pair: true" on all five
  save.out: identical to the report's five saves
  commit.out: status=500 body={"error":"schedules-unwritten","names":[]} / schedules.yml unchanged=true / record unchanged=true
  stop: "the server closed right after the 07:00 claim was written: starts asked=0 new-session calls=0 runs={schedule due=07:00 failed terminal=null why={"word":"server-stopped","names":[]}}"
  S51: "at 07:00:10: new-session calls=0; starts asked of runEntry=1; runs={schedule due=07:00 failed terminal=null why={"word":"folder-not-served","names":["<repo>"]}}"
  (the stop and S51 tests show as failed only because their final flush writes to the builder's own a3r1 path, which I redirected; the lines above are what they printed)

My probes ($SP/rv1/edge.probe.ts, alias2.probe.ts, closestop.probe.ts; scratch files and a scratch HOME only):
  anchor on A, pause B (runs: *r)             pause THREW Unresolved alias (the anchor must be set before the alias): r
  alias runs, save changing when              save THREW Unresolved alias (the anchor must be set before the alias): r
  alias, delete A (the anchor holder)         refused 409 entry-changed
  flow-map entry {name: A, runs: {task: litwatch}, ...}   pause then resume: byte-equal false ("{name: A," comes back as "{ name: A,")
  CRLF file                                   pause writes "  paused: true\n" (LF) into a CRLF file; resume restores byte-equal
  comment on the last key line, no final newline, comment line after the last key, block-scalar prompt, folded when, empty `when:`, indented list, merge anchor on the item, tab after a value: pause then resume byte-equal true
  duplicate key                               pause refused 409 schedules-unread
  plain `when: 0 7 * * 1`, save `*/5 * * * *`  ok, written "when: \"*/5 * * * *\""
  plain name renamed to 2026 / "a: b # c"      ok, written quoted
  task: radar, dialog's Lit Watch, nothing else changed   plan ok, text null (nothing written)
  unattended: 1, dialog's off, nothing else    plan ok, text null (nothing written)
  closestop: stop asked of the earlier idle terminal: 1 / close() called while the earlier terminal is being ended / run asked after close(): 1 / record: {"trigger":"catch-up",...,"outcome":"started","terminal":"new-one"}

Other checks:
  LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md README.md .scratch/migration/agents/reviews/A3-report.md   exit 1, no hits
  sh utils/unused-exports.sh | wc -l    378 (base 378); none of the step's names in it
  breakage grep over every added line of the diff and every untracked file (mutat, mutant, stryker, revert, breakage, inject, sabotage): no hit
  history-word grep over added comment lines and test titles: every "before", "still" hit describes run-time order, none compares with an earlier state of the code
  wc -l: largest source watch.ts 724, file.ts 659, context.ts 813, terminals.svelte.ts 830; components 245, 221, 262
  folder items: schedules 6, state/system/machine 10, shell/rail 8, tests/server/machine/schedules 5, tests/server/machine 7, api/(machine) 4
  ls src/lib/server/machine/tasks tests/server/machine/tasks   both "No such file or directory"
```

### Verdicts

Round items (`A3-rebuild-round1.md`):

- 1: violated, Spec 1. The five probe lines and the save probe reproduce byte for byte, and the re-parse compares raw lists (`file.ts:628-630`, `isDeepStrictEqual(holds, plan.asked)` against `changedRaw`). An entry whose value is an alias throws instead.
- 2: holds. `file.test.ts:66-85` runs 5 edits over 3 unread texts through `handleSchedules`, asserting 409, the exact body, the file byte-equal and `reload` not called. Read, not broken: if the route wrote over an unread file, the bytes would change and `toBe(held)` at :84 would fail, and the 409 at :79 would fail too. The title differs from the ruled one; see Standards 1.
- 3: holds for what it says. Behaviour 1 makes one clause of DESIGN.md:138 false ("a run claimed while the server closes is recorded as failed with `server-stopped`").
- 4: holds. `schedule.svelte.ts:485-495` uses `unreadableAnswer`, `failedAnswer` and `wordSentence`. The three `app.schedules` keys are gone. The commit failure answers `schedules-unwritten` (`routes.ts:165-169`). See Standards 2 for the new `ui` key.
- 5: holds (`config.test.ts:379`, run in test:checks).
- 6: holds (`routes.ts:165-181`; commit probe rerun).
- 7: holds for the window it names (`watch.ts:491-505`; stop probe rerun). The neighbouring window inside `launch` is Behaviour 1.
- 8: holds (S51 probe rerun: `failed` with `folder-not-served`, `runEntry` asked once).
- 9: holds (report :1436).
- 10: holds (run above; tree checks only inside test:checks).

A3.md items, for the whole diff:

- 0: holds (the `tasks` folders are gone).
- 1: violated, Spec 1; see also Behaviour 2.
- 2: holds.
- 3: holds; see Behaviour 3 for the record change after the commit.
- 4: violated, Behaviour 1.
- 5, 6: hold.
- 7: holds; Behaviour 3.
- 8: holds.
- 9: holds.
- 10: holds; Behaviour 2.
- 11: holds by server render; the DOM is declined.
- 12: holds.
- 13: violated in one clause (DESIGN.md:138, Behaviour 1).
- 14: not applicable (E4 not on main).

Cases, for the whole diff: as the first refuter report gives them, with these changes:

- C24: partial, Behaviour 1.
- S5: met. A pause no longer changes `task: radar`, but a dialog Save cannot correct it (Behaviour 2).
- S19: met by the run; Behaviour 3 names the path where it fails.
- S20: met (probes above).
- S23: met (raw-list compare).
- S43: met. A pause or resume while the record does not read writes, as Z609 rules.
- S47: met.
- S51: met. The due-time refusal comes from the rerun; the reread part comes from the first review's run.
- Verify item 8: unmet, as in the first review (no new test of new behaviour this round).

### Findings

**Spec**

1. `src/lib/server/machine/schedules/file.ts:566-571` (`changedEntry`):
   ```
   const patched = patchedText(parsed, map, changes);
   if (patched !== null) texts.push(patched);
   ...
   texts.push(withEntry(parsed, at, changedNode(parsed.doc, map, changes)));
   ```
   - What is wrong: the rendered fallback is always built, even when the byte patch is good. `withEntry` renders the node alone in a new `Document`, and an alias whose anchor sits in another entry throws "Unresolved alias". `planEdit` has no catch, so the throw leaves `chained` and the POST ends as SvelteKit's 500. My probe threw on Pause of `runs: *r` and on a Save changing `when` of that entry. Deleting the anchor-holding entry is refused `entry-changed`, whose sentence ("try again") cannot help.
   - Failure scenario: a reader shares a `runs` map between two entries with `&r` and `*r` (ordinary hand-written YAML). Pause on the second shows "The server refused the request (HTTP 500)." The schedule keeps running.
   - Verdict: round item 1 and A3.md item 1 violated.
   - Landing fix, small: in `file.ts:558-573`, build the rendered text only inside a `try` and push it only when it renders, so the byte patch carries a block entry. `planEdit:628-639` then refuses when no text holds.

**Proof**

1. Report, "Decisions the round made", fifth bullet: "The record was checked readable before the write, so this is reached only by a record that went unreadable in between."
   - What is wrong: `renameRecord` and `dropRecord` (`record.ts:313-329`) go through `change` (`record.ts:173-200`). It also fails with `why: 'locked'` (a lock held past `LOCK_WAIT_MS`, `record.ts:145`) and `why: 'unwritable'` (`:125`, `:181`, `:196`). The route answers all of them `record-unread` (`routes.ts:226`).
   - The orchestrator's ruling on the 409 answer rests on this sentence.
   - Failure scenario: see Behaviour 3.
   - No landing fix; it goes with Behaviour 3.

**Standards**

1. `tests/server/machine/schedules/file.test.ts:41`: `it('refuses an edit over a schedules file it cannot read, leaving it'`
   - What is wrong: G31 as ruled (Z575; A3.md "Guarded entries as ruled", :572) names 'refuses a write over a schedules file it cannot read, leaving it'. The round brief item 2 used "an edit", and the builder renamed the test to match. At landing the G31 Test line and the test title must agree.
   - Failure scenario: the orchestrator copies G31 as ruled into `agents/guarded.md`, and the entry names a test that does not exist.
   - Landing fix, tiny: write G31's Test line in `agents/guarded.md` with the test's title (or rename `file.test.ts:41` back).
   - Every other added or changed test sits in a named entry: watch.test.ts and run.test.ts under G46 as ruled; record.test.ts under G31; schedules.test.ts under G1; config.test.ts and config-folder.test.ts held whole under G12 and G13; the local.test.ts row under G13; boundaries.test.ts under G16.
2. `config/text/ui.yml:5`: `answer_unreachable: The server did not answer.`
   - What is wrong: `config/text/views/shared/commands.yml:49` already holds `unreachable: The server did not answer.`, read by `commands.svelte.ts:388`. That is one sentence under two keys (spec.md, "a parser, a fold or a rule exists once and is reused"). DESIGN.md "Untyped input" names `ui.answer_refused` and `ui.answer_unreadable` but not the new key.
   - Failure scenario: a later rewording changes one of the two, and the tray and the command bar say different things for the same event.
   - Landing fix, small but outside A3's paths: `commands.svelte.ts:388` reads `unreachableAnswer()` and `commands.yml:49` goes. Otherwise leave it.
3. Paths outside the write list: `state/client/writes.svelte.ts:164-175`, `state/shared/answers/answers.ts:109-112`, `config/text/ui.yml:5` and `state/shared/stores/shapes.ts:151-163` (the `Posted.status` field).
   - What is wrong: item 4 needs them (`failedAnswer` takes `{ status }`, and `Posted` had none), and the change is minimal. The report names them only inside the item 4 row, with no file-table line giving the reason, as spec.md's "Where you work" asks.
   - Failure scenario: the landing reads the file list against the write list and finds four unexplained paths.
   - No code fix; one line in the landing booking.

No history in comments, no non-ASCII, no file over its limit, and no breakage code.

**Behaviour**

1. `src/lib/server/machine/schedules/watch.ts:394-406` (`launch`):
   ```
   if (earlier.state === 'idle') { await options.stop(earlier.terminal)...; options.refresh(); }
   ...
   answer = await options.run(entry, SCHEDULED_SIZE)
   ```
   - What is wrong: there is no `stopped()` check after the await on the earlier terminal's stop. A `close()` during it (a server stop, or a rebuild after a `local.yml` change) still starts the run. My closestop probe printed "run asked after close(): 1", with the record settled `started` with the new terminal.
   - This breaks G46's "close() leaves no timer and starts nothing" and C24, and makes DESIGN.md:138's `server-stopped` clause false for this window.
   - Failure scenario: Axel stops the server at the moment a due time ends an idle earlier terminal. A Claude session starts after the server has gone, unattended when the schedule says so.
   - Verdict: A3.md item 4 violated, C24 partial.
   - Landing fix, small: after the stop at `watch.ts:399-400`, add `if (stopped())`, settle the run `failed` with `server-stopped` as `watch.ts:493-503` does, and return.
2. `src/lib/server/machine/schedules/file.ts:376-392` (`changesOf` compares with `readEntry`'s normalised entry) together with `schedule.svelte.ts:381-405` (`openDialog` fills the dialog from that normalised entry):
   - What is wrong: a row with `runs: { task: radar }` opens with Task Lit Watch, and one with `unattended: 1` opens with Run unattended off. A Save that keeps those values is "no change". The route answers `{ ok: true }` with nothing written (probe: "plan ok, text null"), the dialog closes (`schedule.svelte.ts:505`), and the problem stays.
   - The report states that a no-change save writes nothing, but not this consequence.
   - Failure scenario: the reader typed `task: litwach`, sees the problem sentence, opens Edit, sees Lit Watch chosen and presses Save. The dialog closes and the row still says the task is unknown and does not run. The only way through the dialog is to pick another task, save, pick Lit Watch and save again.
   - Not a landing fix; a decision (automode).
     - (a) The dialog opens a field that carries a problem (the task of `update-task-unknown`, a `flag-wrong` flag) with no value chosen, and `check(draft)` asks for one. The server treats a value sent for such a key as a change, comparing it with the raw value. The fault is ended at both ends, and an untouched key keeps its bytes, as Z609 wants.
     - (b) The server compares every key with the raw value. Simpler, but a save that changes only `when` would rewrite `task: radar` to `litwatch`, which Z609 forbids.
     - (c) Keep it. This is the lazy option.
     - Recommendation: (a).
3. `src/lib/server/machine/schedules/routes.ts:170-181` and `:226`: `return wrote.recorded ? OK() : refuse('record-unread');`
   - What is wrong: after the schedules file is committed, a failed rename or drop answers 409 `record-unread` ("The run record does not read, so nothing starts.") for a lock that stays taken or a record that cannot be written as well (Proof 1), and logs no reason. The dialog stays open over a save that landed.
   - For a new entry under a reused name whose drop failed, the record keeps the old `pattern`, `since` and `handled`. When the pattern is the same, the reused name inherits the handled time and can catch up at once, which item 3 and S19 exclude.
   - Failure scenario: the reader saves a new "Weekly radar" with `0 7 * * *` while another server's claim holds the lock past 2 s. The dialog says the record does not read, the file holds the entry, and the old entry's 07:00 of today starts as a catch-up.
   - Not a landing fix; a decision (automode).
     - (a) Hold the record's lock across the commit: take the lock, check the record reads, commit `schedules.yml`, change the record, release. This ends the window, and a lock that stays taken refuses before anything is written.
     - (b) Keep commit-first and answer the true failure with new words (`record-locked`, `record-unwritten`) and a stderr line. The S19 window stays.
     - (c) Keep it. This is the lazy option.
     - Recommendation: (a).
4. Minor, found while probing the inputs the brief named:
   - A pause or a save that adds a key to a CRLF file writes that one line with LF (`file.ts:463`, `:493`). The file then mixes line ends. It still parses, and a resume restores it byte for byte.
   - A flow-map entry is rendered by the library, so a pause then a resume gives `{ name: A, ... }` for `{name: A, ...}`. Keys, order and values stay; the head comment of `file.ts:18-20` says so, and the report does not.
   - Landing fix for CRLF, small: use `\r\n` at `file.ts:463` and `:493` when the text holds it. The flow-map spacing is as designed.

The decisions the builder took that the brief did not name, each judged on whether it is a user-visible shape:

- `schedules-unwritten`: user-visible. It is a word on the wire of `/api/schedules` and a sentence in the dialog ("The schedules file could not be written, so nothing was saved."). Item 4 asked for a word and did not name it. Needs a ruling (automode); the recommendation is to keep it.
- `server-stopped`: user-visible. It is stored in `~/.oculus/schedule.json` as `why.word` and shown on the run line ("failed: The server stopped before the run started."). The word is ruled by Z610 and round item 7; only the sentence is the builder's.
- `ui.answer_unreachable` and `unreachableAnswer`: the key's sentence is user-visible, and the function is internal. See Standards 2.
- `outcome_failed_bare`: user-visible ("failed" with no reason). Every failed run this code writes carries `why`, so only a hand-edited record reaches it. The same goes for the fallback `wordSentence(word, names) ?? word` (`schedule.svelte.ts:247`), which shows a raw machine word to the reader against spec.md's "every user-facing string from a catalog file". It is small, but naming an unknown word needs a catalog sentence, so it needs a ruling.
- A record change failing after the commit, answered 409 `record-unread` with the file kept: user-visible (the answer and the dialog's sentence). See Behaviour 3 and Proof 1.
- A no-change save writing nothing: the no-write itself is internal (no change-log line, no reload), but its effect through the dialog is user-visible. See Behaviour 2.

Closures, checked:

- No check was removed in place of a fix.
- Item 2 added assertions.
- Item 5 renamed a title only.
- Item 4 widened `Posted` by one field, needed by `failedAnswer`.
- No fix reaches beyond its finding, except the new shared `ui` key (Standards 2).

### Declined to judge

- What needs a DOM: the dialog's behaviour after a no-change save, the 409 sentence shown in the open dialog, the tray's Escape order and z-order. They belong to the look; I started no app.
- Whether the base copy the builder diffed against equals 81daf48b1 byte for byte. The git commands that would show it are outside what this review may run.
- The `npx tsc --noEmit -p .` claim (only two `CardAction` lines): not rerun, since it is not in the verify list and no decision rests on it.

Reviewer usage: a1226d68c43be5990, claude-opus-5-5, 328,871 tokens, 61 tool uses, 11.7 min.

## Repair round 2, refuted

```
$ bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (worktree tools/oculus, node v24.21.0 on PATH)
$ npm run test:quick
ok      prettier (4.7 s): All matched files use Prettier code style!
ok      ASCII gate (5.0 s)
ok      svelte-kit sync (12.4 s)
ok      eslint (28.2 s)
ok      svelte-check (26.5 s): 1791255268889 COMPLETED 376 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (35.6 s): Duration  26.70s (transform 67.08s, setup 0ms, import 86.91s, tests 12.58s, environment 173ms)
test:quick: 40.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
exit 0

$ npm run test:checks
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)
exit 0

$ npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts --reporter=verbose
 ok |unit| tests/server/machine/schedules/record.test.ts > the run record > refuses a write over a schedule record it cannot read, leaving it 23ms
 ok |unit| tests/server/machine/schedules/file.test.ts > the schedules file > refuses a write over a schedules file it cannot read, leaving it 46ms
 ok |unit| tests/routes/machine/schedules.test.ts > POST /api/schedules > refuses a request without the write token 17ms
 ok |unit| tests/server/machine/schedules/run.test.ts > runEntry > starts what a schedule runs, or refuses it with its word 297ms
 ok |unit| tests/server/machine/schedules/watch.test.ts > watchSchedules > starts a schedule once per due time 655ms
 ok |unit| tests/server/machine/schedules/record.test.ts > the run record > refuses a rename or a drop while the lock is held, committing nothing 4228ms
 Test Files  5 passed (5)
      Tests  6 passed (6)
exit 0

The builder's probes (records.probe.ts, unchosen.svelte-probe.ts with lib.ts and both configs), copied to
$SP/a3-rv2-refute with only their output paths moved, run with HOME=$SP/a3-rv2-refute/home TZ=Europe/Brussels:
  records.out: identical to the report's after masking `since` (S19, the held lock, alias, CRLF lines)
  unchosen.out: identical to the report's (diff exit 0)

My probe $SP/a3-rv2-refute/mine.probe.ts (scratch files, scratch HOME, input states only, no code changed):
  runnow  close() called while Run now waits for the record lock; starts asked so far=0
  runnow  answer={"terminal":"0136e5-claude"}; starts asked after close()=1; new-session calls=1; runs={hand due=null started terminal=0136e5-claude}
  stale   (lock file held; rename-save posted; reader appends "- name: Hand added ..." during the wait; lock released)
          save answered 200 {"ok":true}; file after: only "- name: Daily radar ..." (the hand-added entry is gone)
  late    new entry under a reused name, record mode 0400: 500 {"error":"record-unwritten","names":[]}; schedules.yml holds it=true; record unchanged=true; starts=0
  late    the reader does what the sentence says and saves again: 400 {"error":"name-twice","names":["Stale name"]}
  late    the record's mode put back, the server started again at 07:31: starts=1; runs of Stale name={catch-up due=07:00 started terminal=cfd497-claude}
  anchor  Pause of A (holds &r): writes, &r kept | Save of A changing when: writes | Save of A renaming it: writes | Save of A changing runs to scout: refused 409 entry-unwritable ["A"]
  merge   rows: A readable; B (`<<: *base`) key-unknown ["<<"], not readable
          Pause of A: refused 409 entry-unwritable | Pause of B: refused 400 key-unknown | Delete of B: writes | Delete of A: refused 409 entry-unwritable
  two     rows: Two {update-task-unknown, unchosen [task, unattended]}; Cmd {flag-wrong, unchosen [unattended]}
  two     a save of Cmd changing only when: 200; the `unattended: 1` line of Cmd is gone; lock left=false

Other checks:
  sh utils/unused-exports.sh | wc -l      378 (base 378); no schedule module in it
  grep -rn "renameRecord\|dropRecord" src tests DESIGN.md HELP.md README.md     nothing
  grep -rn --exclude=local.yml outcome_failed_unknown src config      schedule.svelte.ts:251, :270, app.yml:62
  grep -n "it('refuses" tests/server/machine/schedules/*.test.ts      record.test.ts:29, file.test.ts:41 (G31's ruled title)
  grep -n "'record-unread'" routes.ts      :75 (CONFLICTS), :161 (RECORD_WORDS), :195 (before the plan)
  ASCII: perl gate of spec.md over src tests config prints nothing; LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md README.md A3-report.md exit 1
  Breakage grep (mutat, mutant, stryker, revert, breakage, inject, sabotage) over every added diff line, every untracked file and the builder's a3r2 probes: no hit
  History grep over added comment lines and new test titles: every "before"/"still" hit describes run-time order
  wc -l: terminals.svelte.ts 830, context.ts 813, watch.ts 734, file.ts 682, schedule.svelte.ts 562; components 252/221/262
  ls | wc -l: state/system/machine 10, server/machine/schedules 6, shell/rail 8, tests/server/machine/schedules 5, tests/server/machine 7, api/(machine) 4, data/helpers/run 4
  restored files (settings.ts, catalog/*, config-fit.ts, live-settings.ts, pollers.ts, state/system/config, server.yml, terminal-actions.test.ts, terminal-fixture.ts, wrong-settings.ts): git diff 81daf48b1 --stat prints nothing for them
```

### Verdicts

Round 2 items (`A3-round2.md`):

- 1: holds for the window it names. `watch.ts:412-421` checks `stopped()` after the stop of the idle earlier terminal. The new row of watch.test.ts closes during a pending stop, and its red run on the round 1 tree is quoted. The Run now window next to it is still open: Behaviour 1.
- 2: holds.
  - Probe rerun: Pause and Save of B write, and the anchor stays.
  - My anchor probes: a Save of the anchor holder that would change B through the alias is refused 409 `entry-unwritable`, and no other entry is changed.
  - With a merge key, the `&base` holder cannot be paused or deleted until B is gone (refused `entry-unwritable`). This is safe.
- 3: holds.
  - Probe rerun identical. An entry with two problems carries both keys in `unchosen`, while `problem` names only the first.
  - On a command entry, an untouched `unattended: 1` is rewritten: Spec 1.
- 4: violated.
  - What holds: the lock is held across the commit, and `record-locked` and `record-unread` refuse before any write (probe rerun).
  - What does not: Behaviour 2, Behaviour 3 and Proof 1.
- 5: holds.
- 6: holds (probe rerun; no bare `\n`).
- 7: holds.
- 8: holds. `commands.svelte.ts:317`, `:389` read `unreachableAnswer()`, and the `unreachable` key is gone from `commands.yml`.
- 9: holds. Report :1280-1372 gives a reason for each path outside the list.
- 10: violated in one clause: Standards 2.

A3.md items, for the whole diff:

- 0: holds.
- 1: violated, Behaviour 3: a write can drop lines the reader added while the route waits. See also Spec 1.
- 2: holds.
- 3: violated on one path, Behaviour 2: a reused name inherits `handled` when the record write fails after the commit.
- 4: violated, Behaviour 1.
- 5: holds.
- 6: holds.
- 7: holds. Behaviour 2 is the 500 path.
- 8: holds.
- 9: holds.
- 10: holds. See Standards 3.
- 11: holds by store and server render. The DOM is declined.
- 12: holds.
- 13: violated, Standards 2.
- 14: not applicable (E4 is not in this worktree).

Cases, for the whole diff: as the first refuter report and the run over round 1 give them, with these changes:

- C24: partial, Behaviour 1 (Run now).
- S19: partial, Behaviour 2 (a record write that fails after the commit).
- S25: partial, Behaviour 3 (a file edited between the route's read and its write is overwritten with 200).
- S43: met (record-unread before anything is written).
- S5 and S23: met.
- Verify item 8: unmet for record.test.ts's new test (Proof 1).

### Findings

**Spec**

1. `src/lib/server/machine/schedules/file.ts:396`: `if (unchosen.includes('unattended') || held.unattended !== entry.unattended) {`
   - What is wrong: for a `command` entry, the dialog draws no Run unattended box (`ScheduleDialog.svelte:167`, and `check` skips commands at `schedule.svelte.ts:485`). The page still sends `unattended: false` (`schedule.svelte.ts:458`), so the server writes a key the reader never saw. Z609 keeps an untouched key's bytes, and Z613 writes only a value the dialog asked for.
   - Failure scenario: a command entry with `unattended: 1` is held with `flag-wrong`. The reader edits only `when` and saves. The `unattended: 1` line is removed (probe "two"), and the command starts running at its due times. No dialog line said this would happen.
   - Fix at landing, a decision under automode:
     - (a) Keep the behaviour (off is the only value a command takes) and state it in one clause each of HELP.md:25 and DESIGN.md:138. Recommended.
     - (b) Skip the key for a command at file.ts:396, leaving the row held with its sentence. This brings back round 1's "Save closes and the problem stays".
     - The lazy option: leave it unstated.
2. Builder decisions on shapes the brief did not name, judged for automode:
   - `record-unwritten`: user-visible (a word on the wire of `/api/schedules` and a dialog sentence). Keep the word. Its sentence is wrong on the late path: see Behaviour 2.
   - `ScheduleRow.unchosen` (`model-processes.ts`): a field of the `schedule` channel's payload, which brief item 6 named. It is needed: the "two" probe shows `problem` holds only the first problem while `unchosen` holds both. Recommend keep.
   - The empty task choice ("Choose a task.") and the Run unattended box's third state ("not chosen"): user-visible words (`refused_task`, `refused_unattended`, `unattended_unset`). They use props that `Select.svelte` (`empty`) and `Checkbox.svelte` (`unset`, `onunset`) already have on main (git diff 81daf48b1 shows neither file changed). Recommend keep.
   - `moveRecord` replacing `renameRecord` and `dropRecord`: internal, and required by Z614's commit-inside-the-lock. No other caller (grep finds none). It is not a user-visible shape and needs no ruling.

**Proof**

1. `tests/server/machine/schedules/record.test.ts:55-81`, 'refuses a rename or a drop while the lock is held, committing nothing':
   - What is wrong:
     - It calls `moveRecord` directly. By reading, it stays green if `routes.ts` commits `schedules.yml` outside the lock or before it (for example `commit()` at `routes.ts:207` for every move). It never involves `schedules.yml`, while round item 4 asked for "a held lock leaves `schedules.yml` and the record byte-equal". The route-level claim rests only on the probe's "lock" line.
     - It is a second test for `record.ts` beside G31's table. G31's sentence covers "a record file that does not read", not a lock that stays taken. No Test line names this title.
     - No failing run is quoted (verify item 8).
   - Failure scenario: a later change moves the commit out of the lock. Both record tests stay green, and S19's window comes back unseen.
   - Fix at landing, small (record.test.ts:29-81 and the G31 Test line in agents/guarded.md):
     - Fold the case into the G31 table at :29-53 as rows under `vi.useFakeTimers()`. `takeLock` waits on `setTimeout` and `Date.now`, both faked.
     - Add one row through `handleSchedules` with the lock file held, asserting 409 `record-locked` and `schedules.yml` and the record byte-equal.
     - Drop the `slow` tag.
     - G31's sentence gains "or whose lock stays taken": a guarded-entry wording, so automode.

**Standards**

1. `record.test.ts:55-81`, `{ tags: ['slow'] }` with two real `LOCK_WAIT_MS` waits (4228 ms in my run).
   - What is wrong: spec.md, "What every package obeys": "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin; a check that something did not happen advances a fake clock past the deadline."
   - Failure scenario: the case leaves `npm test` and `test:checks`, so the G31 guard of the lock never runs in the suite builders and landings run.
   - Fix: the same as Proof 1.
2. `HELP.md:25`: "A save, Delete, Pause or Resume the tray cannot make is refused with its sentence, and nothing is written: ... "The run record could not be written; check ~/.oculus/schedule.json and try again." ..."
   - What is wrong: when `record-unwritten` comes after the commit, `schedules.yml` is written (probe "late": `schedules.yml holds it=true`).
   - What is also wrong: `DESIGN.md:138` names `record-unwritten` only "after the commit". `record.ts:121-126` and `:178-182` answer the same word before the commit too, so the word does not tell a reader whether the save landed.
   - Failure scenario: the reader believes nothing was saved, saves again and gets "Two schedules are named Stale name".
   - Fix at landing: with Behaviour 2. If option (a) there is taken, both sentences become true as written, with DESIGN.md:138's "after the commit" widened to "before or after the commit".
3. Smaller sentence issues:
   - `src/lib/state/system/machine/schedule-words.ts:4-6`: "a word of neither is said as a refusal without a reason". The store's `wordOf` (`schedule.svelte.ts:250-252`) now says `outcome_failed_unknown` for a row's problem and for `check`. A row problem of an unknown word would read "failed for a reason this version of oculus does not name.", which is a run line. Round item 5 named this line.
   - `DESIGN.md:138` quotes the `entry-unwritable` sentence with `{name}`, where the catalog (`app.yml:71`) has `{0}`.
   - Failure scenario: a reader of the comment or of DESIGN expects a different sentence than the page shows.
   - Fix at landing, tiny: reword schedule-words.ts:5-6, and write the DESIGN.md:138 sentence with the placeholder in words.

No history in comments, no non-ASCII, no file over its limit, no breakage code in the diff, the untracked files or the probes. No check was removed in place of a fix: the round's test edits add assertions (`commit` spy at record.test.ts:52) or rename a title (file.test.ts:41).

**Behaviour**

1. `src/lib/server/machine/schedules/watch.ts:705-708` (`runNow`): `if (!(await keep(run))) return { refused: 'record-unread', names: [] }; const answer = await launch(name, entry, earlier, run);`. `launch` checks `stopped()` only inside `if (earlier.state === 'idle')` (`:412-421`).
   - What is wrong: a `close()` while `appendRun` waits on the record's lock is followed by a start when the earlier run is gone. My probe: "starts asked after close()=1; new-session calls=1". The `await` in `decide` is guarded at `:513`, and `apply` and `decide` check after each await. This is the one remaining await that leads to a start.
   - Failure scenario: Axel presses Run now while a second oculus holds the record lock, and the server stops or is rebuilt after a `local.yml` change. A Claude session starts after the watcher has closed, unattended when the schedule says so. This breaks G46 ("close() ... starts nothing"), A3.md item 4 and C24.
   - Fix at landing, small (watch.ts:412-421):
     - Move `if (stopped()) { await settleStopped(name, run); return { refused: 'server-stopped', names: [] }; }` after the idle block, so it runs on every path into `options.run`. The run that `keep` appended is then settled `failed` with `server-stopped`.
     - Optionally add a Run now row to G46's table in watch.test.ts.
2. `src/lib/server/machine/schedules/routes.ts:209-216` with `record.ts:185-200`: `const moved = await moveRecord(files.record, move, commit); if (!moved.ok) { ... if (result.commit === null) return answer; late = answer; }`.
   - What is wrong: when the record write fails after the commit (ENOSPC, or a record made read-only, which `refuseReadonly` refuses), `schedules.yml` stays committed and the record unchanged. The route reloads, logs the change and answers 500 `record-unwritten`. For a new entry under a reused name, the old record entry stays, so the name inherits `handled` and `since`.
   - Probe "late": the 500, then "try again" answers 400 `name-twice`. After the record's mode is put back and the server restarts, a catch-up runs the 07:00 due time for an entry saved at 07:30. S19 and C10 are violated on this path. The report names the path ("no run") but not this consequence.
   - Failure scenario: as above. The reader sees "could not be written; try again", the row is there, and the retry says the name is taken. Later an unexpected catch-up run starts.
   - Fix at landing or raised:
     - (a) When the record change fails after the commit, write back the text `planEdit` read (routes.ts:209-216, with `Planned` carrying that text: file.ts:268-280, :653-659), so the 500 means nothing was saved and HELP.md:25 holds. Recommended. About 15 lines, and it shares `Planned.from` with Behaviour 3.
     - (b) For a `drop` (a new entry), drop the record key before the commit. That key belongs to no readable entry, by the name-twice check in `checkSave`.
     - The lazy option: keep it and state the window.
3. `src/lib/server/machine/schedules/routes.ts:196-209`: `const planned = planEdit(files.schedules, edit); ... const moved = await moveRecord(files.record, move, commit);` where `commit` writes `planned.text`.
   - What is wrong: Z614 put an await of up to `LOCK_WAIT_MS` (2 s) between the read of `schedules.yml` and the commit. Round 1 committed synchronously after planning. A change to the file during the wait (the reader's editor, or a second oculus's route) is overwritten, and the answer is 200.
   - Probe "stale": the hand-added entry "Hand added" is gone and the answer is `200 {"ok":true}`. This breaks item 1 ("every other line of the file, a hand-written one included, keeps its bytes").
   - Failure scenario: Axel adds an entry in his editor while the tray's rename waits on another server's claim. His entry disappears with no message.
   - Fix at landing, small (routes.ts:202-205, file.ts:268-280 and :653-659):
     - Inside the `commit` callback, read the file again and refuse 409 `entry-changed` when its text differs from the text `planEdit` read.
     - Or call `planEdit` inside the callback, under the lock.

Points asked about, checked and holding:
- **Deadlock or ordering against the watcher's claims.** None found.
  - `change` holds the lock only across synchronous code: `record.ts:183-203` has no await between `takeLock` succeeding and `dropLock`, and `work` and `commitText` are synchronous.
  - The watcher does not use the write chain (`grep -n "chained\|writes" watch.ts record.ts` finds no use).
  - A route waiting on another process's lock gives up after 2 s with `record-locked`.
- **A lock that goes stale during a save.** It cannot happen within one process, since the lock lives for a synchronous span. A lock left by a crashed process and younger than 60 s answers `record-locked` until it ages out, which is the ruled design (Z614).

### Declined to judge

- What needs a DOM: the empty task option and the three-state box as drawn, the 409 and 500 sentences in the open dialog, the Escape order and z-order. These belong to the look; I started no app.
- A record write that fails after the commit through ENOSPC or a failed read-back. I reached the path through a read-only record file, which `refuseReadonly` refuses. The disk-full case was judged by reading only.
- Whether a merge-keyed or anchored entry that cannot be edited from the tray is acceptable. My probes show only safe refusals with the `entry-unwritable` sentence. Whether that limit is wanted is the user's call.
- The round's own delta, isolated. No snapshot of the tree as round 1 left it exists (the scratchpad's a3r1 holds probes only), so I read the whole diff since 81daf48b1 with the round's items as the focus.

My probe and logs are in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3-rv2-refute/ (mine.probe.ts, mine.out, records.out, unchosen.out, the three verification logs). I first copied the builder's probes into an existing folder `scratchpad/rv2` that another review owns, then moved my five files out of it to `a3-rv2-refute`. I could not tell whether that folder held files of those names before. Its other files are older (01:37 to 01:48) than mine and were not touched.

Reviewer usage: ac84998d95f8fb970, claude-opus-5-5, 358,200 tokens, 80 tool uses, 15.1 min.
