# Step O86 refuter report (on .agents/worktrees/migration-O86, base bf27e33ff)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Ruling 466 (a) (`plan.md` Rulings, "Axel: "466 (a)""; state file closed log) approves the builder's two scratch case programs as programs that compute facts. I reran `final.case.ts` and used it, and I used the saved first-run output of `first.case.ts` as the cases' first run. No finding is raised for the two programs.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base bf27e33ff     (worktree root, PATH with node v24.21.0)
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.2 s)
ok      svelte-check (8.6 s): 1793040807972 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (132.7 s): Duration  123.55s (transform 76.02s, setup 0ms, import 231.11s, tests 243.87s, environment 5ms)
ok      vitest (146.3 s): Duration  138.13s (transform 83.01s, setup 0ms, import 212.39s, tests 320.46s, environment 6.48s)
ok      vitest slow (209.1 s): Duration  201.23s (transform 14.66s, setup 0ms, import 125.42s, tests 670.25s, environment 19ms)
test:quick: 211.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0   (git status --short: 44 lines before and after the run)

$ npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/ tests/shell/rail/ tests/state/system/schedule-lines.test.ts
 Test Files  10 passed (10)
      Tests  58 passed (58)

$ wc -l (every changed file except docs/diagrams and the report)
largest source: src/lib/server/machine/runs/schedules/watch.ts 873, tests/routes/sessions/terminal-actions.test.ts 878, src/lib/state/sessions/terminals.svelte.ts 870; largest component: src/lib/shell/rail/ScheduleDialog.svelte 323, UpdateTray.svelte 295, CommandCenter.svelte 271

$ sh utils/unused-exports.sh, diffed with .agents/worktrees/O86-base/unused-exports.txt
193c193
< src/lib/state/workbench/navigation/notice-sources.ts: waitOf, waitingOf, jobFinished, TASK_VIEW, feedRuns, notesRuns
---
> src/lib/state/workbench/navigation/notice-sources.ts: waitOf, waitingOf, jobFinished
324c324
< src/lib/state/workbench/navigation/notice-sources.ts: WaitKind, Waiting, Task, TaskRuns
---
> src/lib/state/workbench/navigation/notice-sources.ts: WaitKind, Waiting
(removals only)

$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml
(nothing) exit 1

$ the spec.md perl ASCII gate over every path of git status --short (the report excluded)
(nothing) exit 0
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O86-report.md
(nothing) exit 1

$ grep -rn "primary hub's \`.oculus/tasks\|file of the primary hub\|primary hub holds" src config docs --exclude=local.yml
src/lib/state/sessions/view-source.ts:1, :59; src/lib/state/sessions/source/write-files.ts:108; src/lib/views/feeds/leads/Leads.svelte:20; docs/HELP.md:105
(the same four hits the report names, each with its reason)

Commands the builder's report quotes, rerun:
$ npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/ tests/shell/rail/ tests/state/system/schedule-lines.test.ts tests/routes/machine/schedules.test.ts tests/data/snapshot/normalise.test.ts
 Test Files  12 passed (12)
      Tests  66 passed (66)
$ npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/run.test.ts --reporter=verbose
 (pass mark) ... the task action > starts the task in the folder of the hub its root names, the primary for its own name
 (pass mark) ... the task action > refuses a task while the workspace has no primary hub, and starts nothing
 (pass mark) ... a refusal > answers 'a task whose root names no hub of the<ellipsis>' as the word 'hub-unknown'
 (pass mark) ... a refusal > answers 'a task whose root is empty' as the word 'hub-unknown'
 (pass mark) ... a refusal > answers 'a task whose root is no text' as the word 'bad-terminal'
 (pass mark) ... a refusal > answers 'a task the hub its root names holds n<ellipsis>' as the word 'task-file-missing'
 Test Files  2 passed (2)
      Tests  39 passed (39)
$ npm run check
COMPLETED 4316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npx vitest run tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/collections.test.ts tests/server/root/ tests/data/snapshot/
 Test Files  21 passed (21)
      Tests  261 passed (261)
$ npx vitest run tests/data/snapshot/references.test.ts
      Tests  38 passed (38)
$ ls docs
apps.md data-map.md diagrams HELP.md palette.md templates.md
$ grep -n "" docs/HELP.md | sed -n 105,106p
105:- Update, at the foot of the rail, opens the tray: ... A task is a file of the primary hub, ... (as the report quotes it)
106:- A schedule or a request that names a task whose file the primary hub lacks is refused and starts nothing, ... (as the report quotes it)
$ grep -n -i "sentence length\|list item" .scratch/migration/agents/spec.md CLAUDE.md
CLAUDE.md:48:- **No hard wrapping in prose.** A paragraph or a bullet is one line, soft-wrapped by the editor. Hard breaks go only between paragraphs and list items, ...
exit 0   (the report says this grep "finds none"; see Proof 3)
$ sed -n 184,190p .scratch/migration/orchestrator-state.md   (worktree copy)
## Open items (...) / (no entry)

$ VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx vitest run --config <scratchpad>/cases/vitest.config.ts final --disableConsoleIntercept   (approved by ruling 466 (a); read whole before the run; it writes only into scratch folders)
 Test Files  1 passed (1)
      Tests  1 passed (1)
79 "case" lines; diffed with the builder's saved o86-final-run.txt: the only differences are the random terminal ids in the 200 answers of cases 2, 4, 5, 6 and 10 ("id":"532f16-claude" against "a47882-claude" and so on); every other line is equal.
```

The generated diagrams were sampled: the whole diff of `docs/diagrams/layers.dot` (one count, "state to data" 495 to 496) and `docs/diagrams/layer-state.dot` (two counts), and the kinds of changed lines in `docs/diagrams/channels.dot` (layout positions and edge lines rewritten by the layout). All of them are what `npm run diagrams` writes for the new import of `schedule-words.ts` by `notice-sources.ts`.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `offeredTasks` (task.ts) orders the pairs by task, then the primary, then the folders' order. It returns null with no hub and [] with no file. `followTasks` (watch.ts) watches every hub's tasks folder and `.oculus` folder and drops the watches of a hub that leaves. `context.ts:816` reloads the watcher when the hubs change. The final run shows this for cases 1, 10, 12, 13, 14, 15, 16, 34 and 41.
- 2: holds. `namedHub` and `startTask` (pty/routes.ts) and `terminalSentence` gaining `hub-unknown` and the second name. The G35 rows pass, and the final run shows cases 4 to 9 and 11.
- 3: holds. Shown by `readHub` (schedules.ts), `diskChecker` (file.ts), `checkSave` through `hubsFor`, the `runEntry` refusal, the G46 rows, and the final run of cases 17 to 23, 37, 38, 42 and 46.
- 4: holds. UpdateTray.svelte rows keyed by task and hub, `pairLabel`, `lastRun` by hub, `nextOfTask(pair)`, `no_hub` and `no_files`. The final run shows cases 1, 2, 10, 12, 13, 26, 27 and 29. What is drawn goes to the landing look.
- 5: holds. `tasks()`, `blank`, `openDialog`, `rawOf` and `taskChoice` in schedule.svelte.ts, `changesOf` with `hub` unchosen, and the ScheduleDialog empty line. The final run shows cases 24, 25, 39, 43 and 44, and case 38 writes `hub: "2026"`. Behaviour 3 is a consequence of the brief's own save rule.
- 6: violated, in one clause only (Spec 1). `normalise.ts` `feeds` gives `Feeds` with `byHub: []` where the item says it reads and gives `RawFeeds`. The rest holds: `byHub` is built in `feedsOf`, `fromHub` gives a project folder that is no hub no row, docs/apps.md:411 is updated, and the final run shows cases 29, 33 and 35.
- 7: holds. `refresh(..., offered: HubTask[])` in feeds.ts, `CommandCenter.svelte` passing the label, and the two catalog lines. The final run shows cases 30, 31 and 35.
- 8: holds as written. The final run shows cases 32 and 36. Behaviour 1 and Behaviour 2 are defects the item's rule leaves open.
- 9: holds. The catalog keys are in app.yml, focus.yml and terminal.yml, and `app.tasks.no_primary` has no remaining reader (grep).
- 10: holds. The new rows are in G35's and G46's tests, `agents/guarded.md` is unchanged (`git status --short`), both fixtures gain a second hub, and the report's table lists the changed existing lines. One row is under Proof 1.
- 11: holds. The head and doc comments the item lists are rewritten (diff read).
- 12: holds. The report's "Doc text" gives HELP.md:105 and :106 as `grep -n` prints them with replacements that carry the item's content. docs/templates.md gains the commented `runs: { task: litwatch, hub: lab }` example and the rewritten "Update tasks" paragraph.

Cases of the brief's "Cases":

- 1: met. The final run gives the payload `[{litwatch,A},{litwatch,B},{scout,A}]` and the rows `["Lit Watch (A)","Lit Watch (B)","Scout"]`.
- 2: met. The final run gives `[{linkedin,B}]` and the row "LinkedIn", and the press starts with `cwd=other`.
- 3: met, by reading and by run. `UpdateTray.svelte` `start(task)` calls `startTask(task.kind, task.hub)`, which posts `root`. The run of case 5 gives `cwd=other first message names litwatch.md: true`. The press on screen goes to the landing look.
- 4: met. The G35 test 'starts every accepted task as an interactive session, with no skip and no print-mode flags' passes, and the final run gives `cwd=hub (primary)`.
- 5: met. The G35 test 'starts the task in the folder of the hub its root names, the primary for its own name' passes. It failed on the unchanged tree, as the report quotes.
- 6: met. The same test's row `['hub', task.taskHub]`, and the final run gives `cwd=hub (primary)`.
- 7: met. Both G35 refusal rows pass and assert that no `new-session` call was made. The final run gives `400 {"error":"hub-unknown","names":["nope"]}` and `names:[""]`.
- 8: met. The G35 row passes and the final run gives `400 {"error":"bad-terminal"}` (see Proof 1).
- 9: met. The G35 row passes. The final run gives `names:[".oculus/tasks/scout.md","other"]` and the sentence "The hub other holds no .oculus/tasks/scout.md, ...".
- 10: met. The final run gives `[{litwatch,B},{litwatch,C}]` and the rows `["Lit Watch (B)","Lit Watch (C)"]`, and the press with root 'B' starts with `cwd=B`.
- 11: met. The test at terminal-actions.test.ts passes unchanged (verbose run). The first and final runs both give `400 {"error":"no-primary"}`.
- 12: met. The final run gives `tasks with no hub = null` and the line "The open workspace holds no hub, so no update task is offered.". How it is drawn goes to the look.
- 13: met. The final run gives `[]` and the `no_files` sentence. How it is drawn goes to the look.
- 14: met. The final run shows `{scout,B}` gained and then lost with no reload.
- 15: met. The final run shows `{litwatch,C}` gained with no reload.
- 16: met. The final run shows B's pairs gone after a reload. That B's watches end is checked by reading `followTasks`, which closes both handles and deletes the entry.
- 17: met. G46 row 'an update task that names a hub starts in that hub', and the final run gives `started cwd=B`.
- 18: met. The existing G46 row passes, and the final run gives `started cwd=A (primary)`.
- 19: met. The final run gives the row problem `hub-unknown` with `next null`, and Run now gives `{"refused":"hub-unknown","names":["nope"]}` with `record file exists false; new-session calls 0`. The G46 row passes.
- 20: met. The final run gives `hub-wrong` naming `3`, `""` and `"  "`.
- 21: met. The G46 row passes, and the final run gives `task-file-missing` naming the file and `B`.
- 22: met. The final run gives `key-unknown` naming `hub`.
- 23: met. The final run gives `B taken out, reload: problem {"word":"hub-unknown","names":["B"]} next null`.
- 24: met, by run of the store and the route. The Task box lists the three labels, a save of B posts `{"task":"litwatch","hub":"B"}` and of A posts `{"task":"litwatch"}`, and the route writes `runs: { task: litwatch, hub: B }`. What is drawn goes to the look.
- 25: met, by run. The dialog opens with "Lit Watch (nope)" chosen, the route refuses `hub-unknown` and leaves the file "", and a save after choosing B posts `{task: litwatch, hub: B}`. What is drawn goes to the look.
- 26: met, by run. The draft opens with `{"task":"litwatch","hub":"B","name":"Lit Watch (B)"}`, and UpdateTray passes `hub` (read). What is drawn goes to the look.
- 27: met, by run. B's row gives "Next: Tue 10-27 08:00 (S0)" and A's gives "Next: Mon 11-02 08:00 (S1)".
- 28: met, by run. The final run gives `["Lit Watch (B)","Lit Watch (A)"]` and `["Lit Watch (B)","Lit Watch"]`.
- 29: met, by run. `byHub` holds A's and B's rows, and the rows read "Last run: 2026-10-20" and "Last run: 2026-09-01".
- 30: met, by reading. `lastRun` in UpdateTray.svelte returns `current.notesRun` for `inbox` whatever the hub. The rows on screen go to the look.
- 31: met, by run. The final run gives the lines "Lit Watch (B): last refreshed 55d ago | ..." and, with only A, "Lit Watch: last refreshed 55d ago | ...". Its Scout (B) line belongs to case 35.
- 32: met, by run. The final run gives `["Lit Watch (B) ran and has new results."]`.
- 33: met, by run. The final run gives `byHub = []` for a part whose registry paths are all `''`, as `folderParts` makes it.
- 34: met, by run. The final run gives `[{litwatch,B},{litwatch,A},...]`.
- 35: met, by run. `byHub` holds each hub's scout and linkedin, and the refresh line is "Scout (B)". The rows read by hub (`lastRun`, read).
- 36: met, by run. The final run gives `["LinkedIn (B) ran and has new results."]` and `[]` for B's radar while B holds no litwatch.md.
- 37: met, by run. `readEntry` gives null and the disk check gives `hub-unknown` naming `"b"` and `" B "`.
- 38: met, by run. The route writes `hub: "2026"` and it reads back as `"2026"`, and a hand-written `hub: 2026` gives `hub-wrong` naming `2026`.
- 39: met, by run. The dialog opens with task "", hub "" and the check "Choose a task.", and a save after choosing posts the pair.
- 40: met, by reading. `running` holds `JSON.stringify([task, hub])`, and `glyph`, `turning` and `active` compare it with `task.key`. The glyph on screen goes to the look.
- 41: met, by run. The final run shows `{scout,C}` after C is added, then `{linkedin,C}` with no reload.
- 42: met, by run. The final run gives `B added back, reload: problem null next set`.
- 43: met, by run. With nothing offered the draft task is "", the box is [] with the `no_files` line, and the check is "Choose a task.". With scout of A alone, the draft is `{scout, A}`.
- 44: met, by run. The save posts `{task: litwatch, hub: B}` and the route with no primary refuses `no-primary`, leaving the file "".
- 45: met, by run. The final run gives "Lit Watch (A)".
- 46: met, by run. The route gives `400 {"error":"hub-unknown","names":["nope"]}` and the file "".

## 1. Spec

- src/lib/data/snapshot/normalise.ts:590-596: `function feeds(raw: RawFeeds): Feeds { ... byHub: [] }`.
  - What is wrong: item 6 says "`sources/documents/feeds.ts`, `data/index.ts` and `normalise.ts`'s `feeds` read and give `RawFeeds`", and decision 8 says a reader of the summary never meets `byHub` absent. The diff gives every hub's own snapshot a `Feeds` whose `byHub` is an empty list, typed as if it held the hub's rows. The report lists this only as a judgment call ("One hub's own snapshot has `byHub: []`"). It does not say that it departs from the item's text.
  - Failure scenario: a reader of a hub's own snapshot (`HubPart.snapshot.entities.feeds`, as `feedsOf` reads it) that reaches for `byHub` type-checks and silently gets no rows, where a part typed with `RawFeeds` would fail to compile. Today no such reader exists: a grep of `byHub` finds only UpdateTray.svelte, state/feeds/feeds.ts and notice-sources.ts, all over the merged snapshot. The fix is a part type with `RawFeeds`, or a ruling that accepts the empty field.
  - Verdict: item 6 violated (this clause only).

## 2. Proof

- tests/routes/sessions/terminal-actions.test.ts:528: `title: 'a task whose root is no text', body: { action: 'task', kind: 'litwatch', root: 3, ... }, word: 'bad-terminal'`.
  - What is wrong: this row is new and tests behaviour the change adds (a non-text `root` refused), but no failure on the unchanged tree is quoted. On the base, this table's world answered every task body with `bad-terminal` for another cause (the report's quoted base failures show `expected { error: 'bad-terminal' }` for the other new rows), so the row passed there. The report calls it an audit.
  - By reading, it is a proof after the change: with the `typeof root !== 'string'` check of pty/routes.ts gone, `namedHub` would answer `hub-unknown` naming 3, and the row would fail.
  - Failure scenario: a reader of the report takes the row for an audit with no value and deletes it, losing the only test of that check.
  - No verdict.
- The report's DONE / NOT DONE row 7: `perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $(git diff --name-only)`.
  - What is wrong: the brief names the spec.md perl form of the ASCII gate. The quoted form lets control characters through (tab and the rest below 0x20).
  - My run of the spec.md form over the same files prints nothing, so the outcome holds, and no decision rests on the difference.
  - No verdict.
- The report's "Check 9": "`grep -n -i "sentence length\|list item"` over `.scratch/migration/agents/spec.md` and `CLAUDE.md` finds none".
  - What is wrong: my rerun prints `CLAUDE.md:48` (the no-hard-wrap rule, "Hard breaks go only between paragraphs and list items"). The claim of no hit is false. The conclusion it supports still stands: no standards page sets a sentence-length or list-item form rule, and the report applies the no-hard-wrap rule.
  - Failure scenario: a reader of the report trusts "finds none" and skips reading the rule at CLAUDE.md:48.
  - No verdict.

## 3. Standards

none

## 4. Behaviour

- src/lib/state/workbench/navigation/notice-sources.ts:297-299: `run.hub === null ? offered.find((one) => one.task === run.task) : ...`, then `pairLabel(pair, offered)`.
  - What is wrong: the inbox's date is the machine's one triage date (hub null). When two hubs hold `inbox.md`, the notice takes the first offered inbox pair and is labelled with that hub. The report's "Notices" line does not state this.
  - Failure scenario: hubs A (primary) and B both hold `inbox.md`, and the reader presses "Inbox (B)". When the triage date changes, the notice reads "Inbox (A) ran and has new results.", naming the wrong hub. The inbox notice should carry the task's label alone, as the refresh line `refresh_inbox_plain` does.
  - Verdict: none (item 8 names no label for the inbox's one key).
- src/lib/state/workbench/navigation/notice-sources.ts:291-305, with `memory()` at :222.
  - What is wrong: the keys are now `[task, hub, date]`. A hub added to the workspace, or a hub renamed, brings keys the channel has never shown. `memory()` answers every key not shown before, so a notice is posted for each of that hub's offered tasks that has a run date, although nothing ran. Whether it posts depends on whether the `schedule` payload naming the new hub's pairs arrives before the `portfolio` payload carrying its `byHub` row. Before the change a hub with an older date left the merged date unchanged and posted nothing. The report states no such change.
  - Failure scenario: hub C, holding `litwatch.md` with a radar last run of 2026-08-01, is added to the workspace while the page is open, and the schedule channel answers first. The status bar posts "Lit Watch (C) ran and has new results.", with no run having happened.
  - The fix is to treat the first reading of each hub's keys as remembered, as the first reading of the channel is.
  - Verdict: none (item 8's own rule allows it). The fix belongs to this step's notices.
- src/lib/state/system/machine/schedules/schedule.svelte.ts:613: `? one.hub === primary() ? { task: one.task } : { task: one.task, hub: one.hub }`.
  - What is wrong: an entry written by hand as `runs: { task: litwatch, hub: A }`, with A the primary, opens with hub A. Any save from the dialog, a rename or a new `when` among them, writes `runs: { task: litwatch }`, because `changesOf` sees `runs` differ. The report says the dialog writes `hub` only for a hub other than the primary. It does not say that an explicit `hub:` naming the primary is removed from the file on save.
  - Failure scenario: the reader pins a schedule to hub A by name, edits its time in the dialog, and later makes B the primary. The schedule then runs B's Lit Watch.
  - Verdict: none. The brief's item 5 asks for exactly this write (see Declined to judge).

## Declined to judge

- The first run of `first.case.ts` was not rerun: it ran on the worktree at the base, and reproducing it needs the unchanged tree, which only a change to files would give. Its saved output (`o86-first-run.txt`, 54 case lines) was read. The lines for cases 1, 7, 14, 19, 25, 29, 32 and 43 match the report's "First" entries.
- The run of the new tests on the unchanged tree (the report's quoted failures) was not rerun, for the same reason. The quoted failures were read. For the two G46 rows whose own failure is not quoted (the `it` stops at the first row), the approved first run gives `case 19: runEntry { task: litwatch, hub: nope }: started cwd=A (primary)` and `case 21: ... started cwd=A (primary)`. Both rows refuse on the changed tree, so both would have failed on the base.
- `npx prettier --write $(git diff --name-only)` was not run, because it writes files. The prettier line of my test:quick run passed.
- The report's `$(git diff --name-only)` file list was not used, because it is a git form outside the three the reviewer runs. The ASCII gate was run over the `git status --short` list instead.
- What a page draws for cases 3, 12, 13, 24 to 28, 30, 39, 40, 43, 44 and 45 (the rows, the dialog's Task box, the glyph of the pressed row, the lines in place of the rows) goes to the landing look on TEST. The store, route and payload values behind them are met by run above.
- Behaviour 3 follows the brief's own save rule for a primary's pair (item 5). Whether an explicit `hub: <primary>` should be kept on save is the user's call.
- Behaviour 2's dependence on which channel answers first was found by reading `memory()` and `runsHeard`. It was not run, because no case or test sends a hub added between two portfolio messages.

Reviewer usage: ad0866bc88d7625f3, claude-opus-5-5, 280671 tokens, 59 tool uses, 16 min 10 s.

## Repair round 1, refuted

Ruling 466 (a) approves the builder's two scratch case programs and ruling 469 (a) accepts the inline python3 edit of `src/lib/data/index.ts` and the `sed -i` edit of `tests/fixtures/hubs/hub-build.ts` as made; both were read as any other change, and no finding is raised for how they were made. The round's delta: the 8 paths of `files.txt` whose bytes differ from the snapshot (`docs/templates.md`, `src/lib/data/model/index.ts`, `model-collections.ts`, `snapshot/hubs/merge.ts`, `snapshot/normalise.ts`, `schedule-words.ts`, `schedule.svelte.ts`, `notice-sources.ts`) and the 12 paths changed now that `files.txt` does not list (`docs/diagrams/writes.dot` and `writes.svg`, `src/lib/data/index.ts`, `src/lib/data/sources/clones.ts`, `src/lib/server/root/watch/build.ts`, `tests/checks/config/integrity.test.ts`, `tests/data/real-hub.probe.ts`, `tests/data/snapshot/resources.test.ts`, `tests/data/sources/manifests/clones.test.ts`, `tests/fixtures/hubs/hub-build.ts`, `tests/state/boards/board/items.test.ts`, and the ledger files `O86-round1.md` and `O86-report.md`), all read in full.

```
$ ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep
(nothing)   uptime: load averages: 3.81 5.09 6.85

$ npm run diagrams && npm run test:quick -- --base bf27e33ff     (worktree root)
diagrams exit 0
test:quick: 56 changed file(s), from git since bf27e33ff
test:quick: 298 test file(s)
ok      prettier (4.6 s): All matched files use Prettier code style!
ok      ASCII gate (4.9 s)
ok      svelte-kit sync (13.5 s)
ok      eslint (83.4 s)
ok      svelte-check (104.2 s): 1793047477392 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (141.2 s)
ok      vitest (206.2 s)
ok      vitest slow (240.9 s)
test:quick: 254.5 s; every command passed

$ npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/ tests/shell/rail/ tests/state/system/schedule-lines.test.ts
 Test Files  10 passed (10)
      Tests  58 passed (58)

$ wc -l (every changed path but docs/diagrams and .scratch)
largest source: tests/routes/sessions/terminal-actions.test.ts 878, src/lib/server/machine/runs/schedules/watch.ts 873, src/lib/state/sessions/terminals.svelte.ts 870, src/lib/data/model/index.ts 846; components: ScheduleDialog.svelte 323, UpdateTray.svelte 295, CommandCenter.svelte 271

$ sh utils/unused-exports.sh, diffed with .agents/worktrees/O86-base/unused-exports.txt
removals only (notice-sources.ts: TASK_VIEW, feedRuns, notesRuns, Task, TaskRuns no longer unused)

$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml
(nothing) exit 1

$ the spec.md perl ASCII gate over every path of git status --short
(nothing) exit 0

$ npm run check
1793047756236 COMPLETED 4316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ grep -n "byHub" src/lib/data/snapshot/normalise.ts
(nothing) exit 1
$ npx vitest run tests/state/boards/board/items.test.ts tests/data/sources/manifests/clones.test.ts tests/data/snapshot/resources.test.ts tests/checks/config/integrity.test.ts tests/data/snapshot/ tests/data/hubs/ tests/shell/rail/ tests/state/system/schedule-lines.test.ts tests/routes/machine/schedules.test.ts tests/server/machine/runs/schedules/
 Test Files  25 passed (25)
      Tests  255 passed | 7 skipped (262)
$ npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/run.test.ts --reporter=verbose
 Test Files  2 passed (2)
      Tests  39 passed (39)    (the G35 rows hub-unknown, bad-terminal and task-file-missing among them)

$ final.case.ts (approved by ruling 466 (a)), vitest scratch config
 Test Files  1 passed (1)
      Tests  1 passed (1)
case R2: A and B hold inbox.md, the inbox date moves after the first reading: notices ["Inbox ran and has new results."]
case R2: only B holds inbox.md, the inbox date moves after the first reading: notices ["Inbox ran and has new results."]
case R2: no hub holds inbox.md, the inbox date moves after the first reading: notices []
case R3: C added (radar 2026-08-01), schedule first then portfolio: notices []
case R3: then C's radar to 2026-10-26: notices ["Lit Watch (C) ran and has new results."]
case R3: C added (radar 2026-08-01), portfolio first then schedule: notices []
case R3: then C's radar to 2026-10-26: notices ["Lit Watch (C) ran and has new results."]
case R3: C the only hub offering litwatch, added, then its radar to 2026-10-26: notices ["Lit Watch ran and has new results."]
case R4: B renamed to D, dates unchanged: notices []
case R5: runs { task: litwatch, hub: A } (A primary), new time: file "- name: R\n  runs: { task: litwatch, hub: A }\n"
case R5: runs { task: litwatch }, new time: file "- name: R\n  runs: { task: litwatch }\n"
case R5: runs { task: litwatch }, the pair of B: file "- name: R\n  runs: { task: litwatch, hub: B }\n"
case R5: runs { task: litwatch, hub: B }, the primary's pair A: file "- name: R\n  runs: { task: litwatch, hub: A }\n"
diff of the non-R case lines (terminal ids masked) with the round-0 run: exit 0 (equal)
```

### Verdicts

- Items 1, 2, 3, 4, 7, 9, 10, 12: hold; the round does not touch their code, and their case lines equal round 0's.
- 5: holds, with round 1's item 4 in place of the brief's save rule for an entry that names a hub: `named` is set in `openDialog` (`schedule.svelte.ts:548`) and `rawOf` (`:619-623`) writes `{ task, hub }` when `one.named || one.hub !== primary()`; R5 met by run.
- 6: holds. `HubSnapshot` (`model/index.ts:204-206`) types `entities.feeds` as `RawFeeds`; `normalise` returns `HubSnapshot` (`normalise.ts:613`); `feeds` returns `RawFeeds` with no `byHub`; `HubPart.snapshot` is `HubSnapshot` (`merge.ts:47`); `RawFeeds` has no `byHub`, so `part.snapshot.entities.feeds.byHub` does not type-check; `npm run check` 0 errors.
- 8: holds. `runMemory` (`notice-sources.ts:247-262`) and `runLabel` (`:322-329`): a hub's first sighting is silent, the inbox notice carries the task's label alone; R2 to R4 met by run. Behaviour 1 is a case the round brief's literal rule leaves open.
- 11: holds, with Standards 1.
- Cases 1 to 46: met (by run of `final.case.ts`, equal to round 0's lines, or by reading where noted in the first review); what is drawn for 3, 12, 13, 24 to 28 and R5 goes to the look.
- R1 to R6: met.

### Findings

- Proof: `O86-report.md:3` and `:17`, the "before" of R2 to R5 is given by reading the round-0 code, since the changes were made before any run of them; each "before" checks against the snapshot copies. Failure scenario: a wrongly stated "before" would go unseen; none was found. Verdict: none.
- Proof: the report's DONE / NOT DONE row 2, a first run with `Tests  2 failed` whose failing file was not kept. The reviewer's run of the same command passed 25 of 25 files. Failure scenario: two load-dependent failures in a changed file land unnamed. Verdict: none.
- Standards: `src/lib/data/snapshot/normalise.ts:599-606`, the doc comment of `normalise` edited by the round and not rewrapped as a whole paragraph at 100 columns (line 601 ends at 80 inside a sentence); likewise `src/lib/data/sources/clones.ts:43` (94 columns, "so a", the next word fits). Failure scenario: a ragged paragraph the rule exists to prevent. Verdict: none.
- Standards: `src/lib/state/workbench/navigation/notice-sources.ts:241-245`, the doc comment of `runMemory` names `seen`, which `runMemory` does not have, and "each of its first message among them" is not a readable sentence. Failure scenario: a reader cannot find `seen` and cannot parse the first-sighting rule. Verdict: none.
- Standards: the report's "Departures", the list ran twice in the round, both green, the second only because the first ran before the last change. Failure scenario: an extra 280 s run on a machine shared by up to six worktrees. Verdict: none.
- Behaviour: `notice-sources.ts:247-262`, the run memory is keyed by the hub's name and never forgets a hub that leaves the portfolio, so a hub added under a name another hub held earlier while the page was open is not a first sighting, and its dates post as new runs; the round brief's intent is that an added hub posts nothing until one of its dates moves. Failure scenario: hub `lab` at `~/a/lab` (radar 2026-10-20) taken out and a different folder `~/b/lab` named `lab` added with radar 2026-09-01: the status bar posts "Lit Watch ran and has new results." with no run. Found by reading. Verdict: none.

### Declined to judge

- R2 to R5 on the tree before this round's change: would need the round-0 code back in a tree; checked by reading the snapshot copies.
- The builder's two test:quick runs were not reproduced as such; the reviewer's one run passed every command.
- Whether `writes.dot` and `writes.svg` were rewritten to identical bytes by `npm run diagrams`: needs a copy taken before the run.
- What the dialog shows for R5 and every page case: the landing look on TEST.
- Whether a hub's name can repeat across two folders in one workspace session in practice: settled by reading `OpenWorkspace.hubs` naming in `src/lib/server/files/workspace/open.ts`, not read.

Reviewer usage: a30581466148faabc, claude-opus-5-5, 236475 tokens, 49 tool uses, 14 min 16 s.

### Closed

- The two Proof findings and the extra run of the list: closed at landing; the booking states them, and the landing's own verify run stands.
- The `normalise` doc comment and `clones.ts:43`: rewrapped at landing, words unchanged.
- The `runMemory` doc comment: rewritten at landing to name what the function does.
- The run memory keyed by name: fixed at landing, inside round item 3 (a hub added posts nothing until a date moves): `runMemory` forgets every task and hub pair a message no longer carries, so a hub that leaves and a hub that later takes its name is a first sighting.
