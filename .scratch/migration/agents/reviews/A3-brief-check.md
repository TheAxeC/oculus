# Step A3 brief check (on main at 17f581151)

The brief is the working-tree copy of `agents/briefs/A3.md` (621 lines, modified and uncommitted). The brief was written against 57c6ba7e6. `git diff --stat 57c6ba7e6 HEAD` lists only files under `tools/oculus/.scratch/`, so every fact about the tree outside the ledger is the same at 17f581151.

## 1. Names

- `skip_permissions`, `taskSkipPermissions`, `taskSkipsPermissions`, `skip_confirm`: `git grep -n -e skip_permissions -e taskSkipPermissions -e taskSkipsPermissions -e skip_confirm -- ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'`. Every hit is in `tools/oculus` (src, tests, config, `DESIGN.md:414`, `HELP.md:25`, `HELP.md:269`), and each one falls inside a range in "Paths this step writes". There are no hits outside `tools/oculus`.
- `TASKS`, `TaskKind`, `isTask`, `taskCommand`, `startTask`, `PROMPT_MAX`, `commandMenu`, `startCommand`: `git grep -n -w ...` (same exclusions). The hits outside the write list are these:
  - `projects/manuscripts/ward-bttr-crosssubject/code/core/miller_track.py:33` and `run_miller_track.py:30-63` (`TASKS`); `tools/cockpit/assets/js/cockpit/06-tasks.js:7,43` (`TASKS`); `src/lib/views/boards/collection/task-card.ts:13`, `views/boards/focus/rows.ts:50` and `tests/server/edit/writes-fixture.ts:70` with its importers (`TASKS = 'tasks'`, the hub-task collection). These are unrelated names, and the change does not make them false.
  - `views/sessions/terminal/grid/TerminalGrid.svelte:342` and `grid-links.ts:12,25` (`isTask`): this is a different function (a terminal's task flag). Not made false.
  - `pty/routes.ts:33,609` (`startCommand`): the brief keeps `startCommand` as the request entry. Not made false.
- Doc sentences about the tray, the tasks and the claude command: `python3` regex over `HELP.md` and `DESIGN.md` for "update tray|update task|unattended|dangerously-skip|Edit and Delete|schedule|cron". Hits outside the write list:
  - `HELP.md:284`: "`claude_bin`, the Claude command the update tasks and the chat terminal run". After the change a prompt schedule runs it too. The sentence becomes incomplete but is not made false.
  - `HELP.md:138` and `DESIGN.md:382`: the lists of places that start a terminal ("an update task, a resume or fork, ..."). They do not name a scheduled run. Incomplete, not false.
  - `HELP.md:103` and `DESIGN.md:433` (notifications for "an update task whose run date moved") and `DESIGN.md:416` ("the update tray's last-run line"): still true.
- `HELP.md:294` (in the write list): the sentence ends "read and written under `~/.oculus`, or wherever `local.yml` puts each of them". Item 13 adds the schedules file and its record to that list, but the brief gives neither a `local.yml` key (item 1: the path is "resolved at the call"). Added as written, the clause becomes false for those two files.
- The word "schedule" on main: `grep -rn -i schedule src tests config --exclude=local.yml | wc -l` prints 49. Every hit is the verb in comments ("the fetch is scheduled on a microtask") or local functions named `schedule` in `connect/loop.ts:116` and `hpc/poll.ts:166`. Nothing collides with the store, the channel, the route or the folder.

Findings: `HELP.md:294`. Its clause "or wherever `local.yml` puts each of them" becomes false once the schedules file and the schedule record join the list, because neither has a `local.yml` key. Item 13 should dictate wording that excludes them.

## 2. The step line

- "an Update tray task that re-runs on a schedule, as VS Code's Automations re-run a saved prompt": the VS Code table, items 4, 5 and 11.
- "schedules through `croner` (LA18)": item 4 and "Libraries checked".
- "a schedule is an entry of `~/.oculus/schedules.yml` that runs an Update task, a saved command or a prompt, set from the Update tray": items 1, 5 and 11.
- Step 0, "each a name, what it runs (...), a cron pattern, paused or not, and its own Run unattended choice (off by default)": item 1 and S30.
- Step 0, "Schedules section (... what it runs, its pattern, its next run, its last runs, and Edit, Pause or Resume, Run now and Delete; Add schedule) above the task rows": item 11, `ScheduleList.svelte`.
- Step 0, "each task row showing its next run named after its schedule and a Schedule... action that opens the same dialog with the task filled in": items 10 (`nextOfTask`) and 11, S27 and S31.
- Step 0, "a saved command's row carries Schedule... too": item 11, third bullet, and S32.
- Step 0, "the dialog offers off, every hour, every day at a time, weekly ..., or a custom cron pattern, and shows the next three run times": items 10 (`schedule-when.ts`) and 11, S28 and S29.
- Step 0, "the `tasks.<task>.schedule` keys and `tasks.skip_permissions` ... leave config, the catalog and the Settings view": item 0 (settings.ts, options.ts and options.yml back to main's text) and item 9.
- Step 0, "the engine of round 2 stays (the croner timer, the run record, one catch-up run, the lock, a due time skipped while the earlier run works)": items 3 and 4.
- Step 0, "`agents/reviews/A3-backed-out.patch`, applied to the new worktree by `git apply --3way`": item 0.
- Z569: items 1 and 11. Z570: item 1. Z571: items 1 and 5 (saved commands only, source `saved`). Z572: item 0. Z573: item 0 and "Read" item 2 (fixes 4.1 to 4.3).
- Z574: "Guarded entries as ruled", G46, plus the command rows of the tests. Z575: G31 and `file.test.ts`. Z576: G1 and `schedules.test.ts`. Z577: item 4 `runNow`, Decision 7 and S15. Z578: item 11 and S16. Z579: items 1 and 2 and S10. Z581: item 9. Z582: item 1.
- Z580 (a fresh brief check) is not an item of "What to build". It is this check, which is correct for a process ruling.

Findings: none.

## 3. Premises

- The patch: `git apply --stat` prints "57 files changed, 2895 insertions(+), 1028 deletions(-)". `git apply --check` prints "error: patch failed: tools/oculus/tests/data/sources/config/settings.test.ts:1 ... patch does not apply". With `--exclude=` that file, the check passes (exit 0). `git diff --stat cda24e76b 57c6ba7e6` lists `settings.test.ts | 190 +---` and `value-rule.test.ts | 217 ----` among 10 files. Matches.
- `pty/routes.ts` (`sed -n '85,100p;392,436p;598,606p'`): `TASKS` :89, `TaskKind` :90, `isTask` :93, `taskCommand` :402, `startTask` :410-434, the dispatch at :602-604. Matches. The patch's `start.ts` exports `SCHEDULED_SIZE = { cols: 80, rows: 24 }`.
- The users of `skip_permissions`: the grep printed exactly the brief's list (README.md has no hit). `config/behavior.yml:89-92` is `tasks:`, the comment, `skip_permissions: false` and the blank line. `options.yml:386-391` is the entry. Matches.
- `behaviorFindings` is `catalogs.ts:163-175`, and its two tests are `config.test.ts:369-395`. guarded.md:143 holds `config.test.ts` under G12 and G13. Matches.
- The saved commands: `savedPath` is `saved.ts:21`, `readSavedCommands` is :43, `startCommand` is `run.ts:71`, and `commands/` holds 10 items. Matches. The commands route uses `logChanges(options.changes, KIND, ...)` with `const KIND = 'commands'` (`routes.ts:44`). This is equivalent to the brief's wording.
- `commandMenu` is `commands.ts:68-76`, `picked` is `CommandBar.svelte:80-85`, `grep -rln commandMenu src/lib` lists the two files, and `HELP.md:191` holds the quoted text. Matches.
- `requestUpdateTray` is `ui.svelte.ts:372`, `updateTrayRequested` is `Workbench.svelte:144,234`, and `CommandCenter.svelte:241` is the existing caller. Matches.
- The tray: `Modal level="tray"` at :118, the `over` snippet with `Confirm` at :169-187, 248 lines. In `Modal.svelte` the `.ground` default is z-index 60 (:159) and `.ground.tray` is 65 (:173). Matches.
- `compose.ts`: `PROMPT_MAX` at :71, the control-character rule at :172 (`/[\u0000-\u0008\u000b-\u001f\u007f]/`), and `argv.push('--', prompt)` at :199. In `sessions.ts`: `argv` at :173-177, `directory` at :318-330, `stopTerminal` at :694. The `PROMPT_MAX` readers are `task-seed.ts:28` and `task-start.ts:20`. Matches.
- `model-sessions.ts`: `pid` :350, `task` :362, `exit` :367, `TERMINAL_REFUSALS` :288-313, 876 lines. `terminal-words.ts` is 67 lines. Matches.
- `context.ts`: `ServerContext` :107, `close()` in its type at :188, `ContextDependencies` :201, `dependencies` :221, `startBookmarks` :377, the context object at :442, `close()` at :482-497, 743 lines. The fixture is 126 lines. Matches.
- The client: `connect([` :177-190 with `'processes'` at :189. `Payloads` is `shapes.ts:29`, with `processes` at :36 and :64. `payloads.ts` :63 and :123, `entities` :94, `context.ts` :64, :154, :345 and :484, `postCommand` at `writes.svelte.ts:158`. Matches.
- Routes: `(machine)` holds `hpc`, `lines`, `usage`. `tests/routes/machine` holds two files. The G1 commands test is at :66. Matches.
- Folder counts (`ls | wc -l`): 8, 6, 7, 6, 7, 10, 2, 10, 6. Matches.
- Sizes (`wc -l`): every figure matches (440, 248, 685, 743, 172, 275, 505, 839, 876, 547, 170, 137, 169, 591, 126, 655, 295, 72, 116).
- `SHELL_STORES` is at :342-358 without `schedule`. The state row is :150-182, and the `data/helpers/run/tasks` reason is in the comment. Matches.
- `stamp` is `format.ts:58`. The weekday grep printed nothing (exit 1). Matches.
- `sh utils/unused-exports.sh | wc -l` printed 378. Matches.
- croner: my own `presets.mjs` in my scratchpad (`TZ=Europe/Brussels`) and a rerun of `$TMPDIR/a3brief/probe.mjs` printed every value the brief quotes:
  - `0 * * * *` gives 13:00, 14:00 and 15:00. `@daily` gives 10-06, 10-07 and 10-08 at 00:00.
  - `0 0 31 2 *` gives no run. `0 0 31 4,6,9,11 *` throws `RangeError Maximum call stack size exceeded` while walking.
  - The three bad patterns throw at construction.
  - The daylight-saving runs match, and 27551 / 8059 bytes match.
  - I also found that `''` throws at construction and that `' 0 7 * * * '` and `00 7 * * *` are accepted.
- `yaml` is version 2.9.1. Matches.
- The `yaml` probe (my `yprobe.mjs` and `yprobe2.mjs`): `*/5 * * * *` written as a plain scalar fails to parse, and a double-quoted node and a flow `runs` map read back equal. Matches, with two differences:
  - **(a)** `- name: [` gives one `BAD_INDENT`, but the line depends on the file's last byte. The text without a newline reports line 1. `'- name: [\n'`, which is what an editor or `echo` writes, reports line 2. S3 expects `{ file: 'schedules', line: 1 }`, and look step 12 overwrites the file with `- name: [` (with a newline, so line 2).
  - **(b)** "keep every comment and the other entries byte for byte" holds only for a file already in the library's own style. After `deleteIn([0])`, a hand-written `- name: Weekly radar    # mine` became `- name: Weekly radar # mine`, `runs: {task: litwatch}` became `runs: { task: litwatch }`, and a 4-space indented entry was reindented to 2 spaces. The comments were kept.
- "Where this step sits", first bullet: it says plan.md:590 "still reads 'the schedule is a cron-style `schedule:` field on each Update task entry'". `grep -n "^- A3 " plan.md` now shows line 590 rewritten to "...a schedule is an entry of `~/.oculus/schedules.yml` that runs an Update task, a saved command or a prompt ... (ruling Z569)". `grep -n cron-style plan.md` finds only :800, the old ruling. At 57c6ba7e6 the line held the cron-style text and no "(ruling Z569)", so the bullet mixes the two states.
- The ADR premise: the brief checks `ls tools/oculus/docs`. Neither `docs/adr` nor `tools/oculus/docs/adr` exists (`ls` errors on both), and `.agents/plan.yaml` has no `adr` key. The conclusion holds; the path checked is not the default one.

Findings:
- The plan line premise is stale. :590 no longer reads "cron-style"; it was rewritten in 17f581151.
- S3 and look step 12 expect line 1. A file ending in a newline gives line 2.
- The `yaml` premise "byte for byte" holds only for files in the serializer's style, so S20 cannot hold for hand-written files (see check 5).
- The brief names its base as 57c6ba7e6. The head is 17f581151, with only ledger files changed.

## 4. Cases and checks

- C1 to C24, C26 to C31, C34 to C36: consistent with the rules file. They use scratch paths, a recording runner or a scratch tmux server, a stub `claude` and a fake clock, with no real `~/.oculus` and no real tasks. C1 uses `tmux -L a3probe`, a separate socket name, where line 9 says "under its own `TMUX_TMPDIR`". It is harmless but inconsistent with line 9.
- C21 (a read-only scratch folder) and C23 (a recorder answering `terminal-failed`) are input conditions given through stubs and folders. No code under test is altered, so neither is breakage testing (spec.md "What every package obeys", the no-breakage rule).
- S1 to S34: consistent, except S3's line (check 3) and S20 (check 5).
- spec.md "What every package obeys", the key rule ("Every id or key a step introduces is checked empty, duplicated, and colliding with a configured or reserved key"): the schedule name becomes a key of the JSON record `schedule.json` (item 3) and of the watcher's maps. The cases check empty (S11) and duplicated (S10) but no reserved key. The patch's `record.ts` indexes a plain object (`logs[task] ?? {...}`, `logs[task] = ...`), which is safe for four fixed kinds and unsafe for any name:
  - `constructor` or `toString` returns a function from the prototype.
  - `__proto__` assignment sets the prototype, so the entry is lost on write.
- The tests named, against spec.md's test rule ("one test per unit it covers ... written as a table where a unit has several outcomes", ruled Z409):
  - **G46**: five tests in `watch.test.ts`, one per clause of the sentence, all over the watcher. G46's Code line, as Z574 rules, names two units, `schedules/watch.ts` and `schedules/run.ts`. The rule gives one test (a table) per unit. The brief gives five tests to `watch.ts` and none to `run.ts`, whose outcomes (C16's argv rows, the command and prompt starts, `needs-approval`, `folder-missing`) are left to quoted probes. E4's brief (`E4.md` "The tests of this step, one per unit of an entry's Code line, each a table") applies the rule strictly.
  - G31 `record.test.ts` (one test for `record.ts`) and G31 `file.test.ts` (one table for `file.ts` over save, delete, pause and resume times two bad files): consistent.
  - G1 `schedules.test.ts`: one test. The missing and wrong token give the same outcome. Consistent.
  - G12 and G13: two `behaviorFindings` tests in `config.test.ts` for one reader. This is consistent only because guarded.md:143 holds that file whole.
  - G35: the rows are run, not written. Consistent.
  - G49 C85: E4's table, written at the second landing. Consistent.
- Breakage testing: none is asked. Brief :407 forbids it, and S23 says "no probe makes the serializer misbehave". Verify item 8 runs new tests on the handed tree, which is spec.md's "failing line on the unchanged tree" and not a removal of code.
- Tests beyond the named ones: none. ":389 The builder writes these and no other test", and the patch's other test changes are dropped (:403).

Findings:
- G46's tests break the one-test-per-unit rule: five tests for `watch.ts` and none for `run.ts`, a unit on its Code line under Z574.
- No case covers a schedule name that collides with an object prototype key (`__proto__`, `constructor`, `toString`). spec.md's key rule asks for it, and the record and watcher maps are keyed by name.
- C1's `-L a3probe` differs from line 9's "own `TMUX_TMPDIR`". This is minor.

## 5. The question

- C1: no. Both outcomes are accepted and a third stops the build, so it reads a fact.
- C2 to C24, C27 to C31, C34, C35: no. Each names the observable start, record or payload.
- C26: yes. A grep for "research-cockpit" passes for a test that starts the real `claude` some other way, for example a prompt run whose `claudeBin` resolves through the real `local.yml`. Verify item 7's greps for `spawn`, `execFile`, `tmux`, `claude`, `homedir()` and `~/.oculus` narrow this but read source text only.
- C36: no.
- S1 to S19, S21, S22, S24 to S34: no. S27, S29 to S33 are checked at the look. S29 (`whenOf`) and S27 (`nextOfTask`) are pure or store functions that a probe could check before the look.
- S20 ("every other line of the file byte-identical"): yes. It passes on a fixture written in `yaml`'s own style and says nothing about a hand-written file, which the step's goal names ("writes them through the update tray's dialog or by hand"). With `parseDocument(...).toString()` my probe shows a hand-written entry respaced and reindented. Either the case names a file in the serializer's style, or item 1 has to splice the changed node's byte range (`node.range`) into the original text so other lines keep their bytes.
- S23: no. The check reads the comparison in `file.ts`, which is the right check.
- The check on the step's line (verify list plus the look): the verify list (`npm run test:quick`) could pass without the goal. Look steps 3 to 6, 8, 10 and 11 exercise the real file, timer and tray, and could not pass without the goal.
- Verify item 8, "each test of a behaviour the step adds or changes fails on the handed tree": yes, for G46, both G31 tests and G1. On the handed tree they fail at import, because `schedules/watch.ts`, `schedules/record.ts`, `schedules/file.ts` and the route do not exist there. That failure says nothing about the behaviour each row asserts.
- Items 0, 2, 3, 6 and 12: no. They use the `diff -rq` table, cases S5 to S14 and C4 to C6, C20, C28, C34, S18 and S19, the type check, and the boundary test.
- Item 1: yes, through S20 as above.
- Items 4 and 5: no, through the C cases, C16, S8, S9 and S26.
- Item 7: no for S24, S25 and S10. The G1 test alone passes for a route that only checks the token.
- Item 8: the words are judged by reading, and G24 proves only that each key has a reader.
- Items 9, 10, 11 and 13: no, through S34, the grep of verify item 6, S28 and the look, and `grep -n` with a reading.
- Item 14: E4's C85 row.

Findings:
- S20 can pass without the goal, as described above.
- C26's grep can pass while a test starts a real `claude`.
- Verify item 8's handed-tree failure of every new test is an import failure, not a failure of the behaviour asserted.

## 6. Implied inputs

Missing from "Cases", each with the result it should have:

- A schedule name that is an object prototype key (`__proto__`, `constructor`, `toString`): it runs and keeps its own record entry, or is refused as `name-wrong`. The brief must say which. See check 4.
- `when: ""`, `when:` (YAML null) and `when: 5` (a number): item 1 says only "absent means Off", and croner throws on `''`. Each should be either Off or `when-unreadable` naming the value, decided in the brief.
- `name: 2026` (a YAML number) or `name: [a]`: `name-wrong`, or the number read as text. Unstated.
- An entry that is not a map (`- just text`, `- null`): presumably `entry: null`, with a problem word and Delete only. No word is named for it.
- A `command` entry with no `folder` or `folder: ""`: S8 covers prompts only. Expected `folder-empty`.
- `folder: ~`, which YAML reads as null: `folder-empty`.
- `unattended: false` on a command: allowed, or `unattended-command`? S14 covers only `true`.
- `commands.json` missing (S7 covers "not JSON"): expected `command-missing` on every command entry, with task and prompt entries still running.
- A YAML entry with a duplicate key (`name:` twice): `parseDocument` reports `DUPLICATE_KEY`, so the whole file is unread (S3 behaviour). Unstated.
- A hand-written unquoted `when: */5 * * * *`: the whole file is unread at its line (S3 behaviour). This is the likeliest hand-edit error and has no case.
- Save, rename or delete while the record does not read: item 7 lists `record-unread` as a 409. No case says whether `schedules.yml` is left unwritten when the record rename or drop cannot run, so a partial write (file renamed, record not) is possible.
- A Run now naming a schedule that no longer exists (deleted between the page's read and the press). The `run` action carries a name and no `at`, and `SCHEDULE_WORDS` has no word for "no such schedule". Expected result unstated.
- A Run now while a decision of the same schedule is in progress, including a double press. Item 4 states `{ trigger: hand, outcome: skipped, terminal: null }`, but no case covers it.
- A request with an unknown `action` or a body that is no object: 400 with a word. Unstated.
- Pause of a paused entry, and Resume of a running one: a no-op, with no change record. Implied by "a write that changed something".
- The `said` line words for a skipped Run now (S16): no catalog key is named.
- A name of exactly 80 characters: accepted. S11 covers only 81.

Findings: each item above is an implied input missing from "Cases". The ones whose result the brief leaves undecided are the reserved-key name, `when` empty, null or numeric, the non-map entry, a Run now on a missing name, and a save while the record does not read.

## 7. ADRs

- `ls docs/adr` and `ls tools/oculus/docs/adr` both print "No such file or directory". `.agents/plan.yaml` (`sed -n '1,30p'`) has no `adr` key and `standards: []`. There is no record.

Findings: none. The brief names `tools/oculus/docs` where the default folder is `docs/adr`; the conclusion is the same.

## 8. Dictated text

- `findings.config.skip_permissions_retired`: "'{0} is not read; a schedule in the update tray runs unattended through its Run unattended choice'" (`grep -n` :263): holds.
- The `app.tasks` and `app.schedules` words, item 8 (:252): hold. They are ASCII, use plain prose and have no history words. `outcome_skipped`'s "still going" describes the present state, and spec.md's history-word rule binds comments and test titles.
- HELP.md "With it on, a scheduled run lets an agent edit files and run commands with nobody asked, on a timer." (:291): holds.
- Decision 5's problem sentences (:521): hold, with one weakness. `update_task_unknown` writes the four kinds literally ("the tasks are litwatch, scout, linkedin and inbox"), a second copy of `UPDATE_TASKS` that goes stale if the list changes (spec.md "The principles", one rule exists once). A `{1}` filled from `UPDATE_TASKS` would avoid it.
- Item 14's `findings.apps.carries.schedule` wording (:305): holds.
- G46 (:503), G31 (:506) and G1's Code line (:510): hold.
- Item 6's doc comments: `/** The cron pattern; '' is Off. */` (:206), "The name as written, '' when there is none." (:223), "The entry, or null when its shape does not read." (:225), "Every saved command, for the dialog's command list." (:233), "The hub folder first, then each root the file browser serves, for the dialog's folder box." (:235) and "The files that do not read, with the parser's line when it gave one." (:237): hold.
- `/** Where the entry stands in the file, which a write names it by with its name. */` (:221): breaks spec.md "The working rules", Prose ("plain"). The relative clause "which a write names it by with its name" does not parse. A plain version: "The entry's position in the file; a write names the entry by this position and its name."
- The `model-processes.ts` head "what the machine views read: the Processes view's rows and the update tray's schedules" (:188): holds.
- The boundary reasons (:284): hold.
- The `commands.ts` head clause "a saved command has Edit, Schedule... and Delete" (:279): holds.
- The test titles (:392 to :402): hold. None of spec.md's history words appear (`grep -n -E "\b(before|used to|no longer|still|...)\b"` finds none in the titles).
- The brief file itself: `LC_ALL=C grep -n '[^ -~]' agents/briefs/A3.md` prints nothing.
- The write list line `tools/oculus/src/lib/data/helpers/files/apps.ts`, ... "as item 14 says These are written at the landing" (:465) is missing a full stop. A typo, not dictated text.

Findings:
- :221's doc comment breaks the plain-prose rule.
- :521's `update_task_unknown` hard-codes the four kinds in a catalog sentence.

## Also checked, as findings

- **Breakage testing**: the brief asks for none; :407 forbids it.
- **Tests beyond the named ones**: none.
- **The shell boundary**, a gap the builder will hit. `ScheduleList.svelte` and `ScheduleDialog.svelte` sit in `shell/rail/`. The shell row of `boundaries.test.ts:131-148` lets a shell file import only `shell/**`, `ui/**`, the client context and use, and a fixed list of state modules. It does not include:
  - `state/shared/words/format` (`ahead`, `stamp`),
  - `state/system/machine/schedule-when`,
  - `data/helpers/run/cron`,
  - `data/helpers/run/schedules`.

  The patch's own comment at `terminals.svelte.ts` says the same ("The boundary table lets a shell file import this module and not `data/helpers/run/tasks`"). Item 12 widens only the state row. Item 11 says the dialog shows "the next three runs through `cronRuns` and `ahead`" and refuses a save "for every problem `readEntry` gives ... by `patternOf`". Item 10's store list has no preview, check or `ahead` function. The brief must say these reach the shell through the `schedule` store (for example `preview(pattern)`, `check(draft)`, the rows' words already formatted), or name a shell-row change. Otherwise the builder either fails the boundary test or widens the row, a boundary change no ruling covers.
- **The `UpdateTask` import is the wrong way round.** Item 6 says "`UpdateTask` is imported from `data/helpers/run/tasks.ts` as the patch does". The patch does the opposite. `model-processes.ts` defines `UPDATE_TASKS` and `UpdateTask` (patch :3531-3576), and `tasks.ts` imports them from `../../model/index.ts` and re-exports them (patch :3471-3510, whose comment says "the model layer may not import data/helpers"). Followed literally, item 6 makes `model-processes.ts` import from `tasks.ts` while `tasks.ts` imports from `model/index.ts`, a circular import. `data/model` imports nothing outside itself on main (`grep "^import" src/lib/data/model/*.ts`).
- **Item 4 lacks the `refresh` input.** Its input list (files, `rootsFor`, `local`, `run`, `stop`, `table`) has no `refresh`, but item 7 wires "`refresh` through `terminals.refresh()`". One of the two needs correcting.
- **The approved mock-up is not in the ledger.** `grep -rln -i "mock-up|mockup"` over the ledger finds no stored mock-up for A3. Only the Z569 text and the brief refer to it. The opening ("as the approved mock-up draws them") and item 11's heading point the builder and the look at something neither can open. Item 11's text is the only description they have.
- **User-visible choices no ruling covers**, which the brief takes as decisions:
  - the record keyed by name, with rename-moves and reuse-drops (Decision 4, a key shape in a saved record under `~/.oculus`, per spec.md's no-silent-decisions rule);
  - the route `/api/schedules`, its body shape and its 400/409/403 answers (item 7, a wire format not listed under "Decisions");
  - the 1 to 80 character name and the case-insensitive clash (item 1, not under "Decisions");
  - the terminal names (Decision 8);
  - the prompt folder not limited to the served roots (Decision 10, which lets a schedule start Claude in any existing folder);
  - the next-run format "Mon 10-12 07:00" (item 10);
  - no `local.yml` key for the two files, unlike `approvals`;
  - the change-log kind `schedules`.
- **Item 14 against E4.**
  - The ownership agrees: "whichever of A3 and E4 lands second", the closed channel in `apps.ts`, the `carries` list, and C85's row in `manifest.test.ts`, 'reads each apps folder to its rows and its findings', all match `E4.md:211`, `:243` and `:373`.
  - The wording does not agree. `E4.md:373` (Decision 20) words `findings.apps.carries.schedule` as "(it carries each update task's pattern, next run and recent runs with their terminals)". A3's item 14 words it "each schedule's name, what it runs with a prompt's text and folder, its pattern, its next run and its recent runs with their terminals". If A3 lands first, E4 does item 14 from its own brief and writes the old wording.
  - `E4.md:348` and the state file's E4 `shared_paths` (`orchestrator-state.md:54`) still list shared lines from A3's old design: `DESIGN.md:85` (A3's `tasks:` block and cron form), `settings.ts`'s `PROBLEM_READERS` and `catalog/options.ts`. The new A3 restores those files to main's bytes and writes no `DESIGN.md:85`.
- **The "Shared with the steps in flight" list leaves out `src/lib/data/sources/config/catalogs.ts`.** `comm -12` of A3's write list against `E4.md`'s finds it. E4 writes it (`E4.md:307`, the `closed_paths_shape` finding of `behavior.yml`, beside `behaviorFindings` at `catalogs.ts:163` per `E4.md:57`), and A3 rewrites `behaviorFindings` at :155-175. `settings.ts`, `settings.test.ts` and `server.yml` are also shared with E4 or O30, but A3's net change to each is none (main's bytes).

## Declined to judge

- Whether the VS Code Automations table is complete. The rule forbids curl, and the brief quotes the page through an earlier brief; reading the live page is outside a read of the tree.
- Whether the five G46 tests should be folded into one table per unit or the Code line narrowed. Both the rule and Z574 are Axel's; I report only that the brief as written breaks the one-test-per-unit rule.
- Whether a schedule's prompt folder should be limited to the served roots (Decision 10). This is a security and design call for Axel.

Agent usage: brief-check agent (id not visible to me), claude-opus-5-5, about 255,000 tokens (from the token counter before and after), about 60 tool uses, minutes not measured.

Usage: a48d9494f333f3e40, claude-opus-5-5, 268,096 tokens, 87 tool uses, 13.9 min.

## Closed

Each finding is closed by a change to `agents/briefs/A3.md`, made by the brief writer (a42ad450094192df4) on the orchestrator's numbered list, and the three choices it raised closed by rulings:

- Names, HELP.md:294: item 13 dictates the sentence, and the two files take `local.yml` keys (Z587), so "or wherever `local.yml` puts each of them" holds for them.
- Premises: the base is 17f581151; the plan-line sentence is removed; S3 and look step 12 expect line 2 for a file ending in a newline; the ADR premise checks `docs/adr` and `tools/oculus/docs/adr`.
- Cases: G46 is one table for `schedules/watch.ts` and one for `schedules/run.ts`; a name that is a prototype key keeps its record entry in a `Map` (S35, Z591 rewords DESIGN.md:153); C1 uses its own `TMUX_TMPDIR`.
- The question: S20 and item 1 splice only the changed entry's bytes, over a hand-written fixture; C26 is checked by reading each test; verify item 8 asks for the behaviour's own failing row.
- Implied inputs: S36 to S48 and S52, with `entry-wrong` for an entry that is not a map (Z589).
- Dictated text: :221's comment rewritten; `update_task_unknown` takes `{1}` from `UPDATE_TASKS`.
- Also checked: the dialog reaches the shell through the `schedule` store's `preview` and `check`, so no boundary row widens; `UpdateTask` is defined in `model-processes.ts`; item 4 takes `refresh`; the tray mock-up is in item 11 verbatim; Decisions 12 to 16 name the route, the name rule, the next-run format, the change-log kind and the `local.yml` keys; item 14's wording governs whichever of A3 and E4 lands second, recorded on E4's dispatch entry; `catalogs.ts` is in the shared list.
- Declined points ruled: the prompt folder (Z586, read as in or under by Z590); the terminal names (Z588).
