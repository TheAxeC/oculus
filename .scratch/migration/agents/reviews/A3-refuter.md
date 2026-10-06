# Step A3 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/A3, base 995e6dfad)

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

- 0: holds. The two `tasks` folders are gone, and the file table agrees with `git diff 995e6dfad --name-only`. `.agents/worktrees/A3-base` does not exist (it is the orchestrator's to make), so the builder diffed against its own copy `$SP/a3/base`.
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
- The builder's base copy `$SP/a3/base` against main at 995e6dfad: not compared byte for byte, since the git commands that would show it are outside what this review may run. The changed-file lists agree.
- The cause of the one red run (Proof 3): not found.

Reviewer usage: agent id not visible to the reviewer, served model claude-opus-5-5, tokens, tool uses and minutes not measured by the reviewer.
