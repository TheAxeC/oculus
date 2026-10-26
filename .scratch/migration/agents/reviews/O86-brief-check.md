# Step O86 brief check (on main at 153f4f0b)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O86.md`. A page this report cites is named with its section. A line of code or a grep hit keeps its `file:line`.

`plan.md` has no Goal section: `grep -n -i '^#* *goal' .scratch/migration/plan.md` prints nothing, and its headings (`grep -n '^## ' .scratch/migration/plan.md`) are Steps, Could run in parallel, Rulings, Agents and Blocked. Under "the goal" below I use O86's step line (plan.md:839) with rulings 441, 443, 458, 459 and 460 (plan.md:2827-2828, 2845-2847).

## 1. Names

Command, run once per name: `grep -rn "<name>" src config docs tests utils --exclude=local.yml`, with the brief's write list filtered out.

- `tasksWithFile`, `startUpdateTask`, `TaskStartOptions`, `RunEntryOptions`, `RUNS_KEYS`, `feedsOf`, `nextOfTask`, `taskLabel`, `noTasks`, `app.tasks.no_primary`, `app.tasks.no_files`, `DialogFill`, `feedRuns`/`notesRuns`/`TaskRuns`, `ScheduleTarget`: no hit outside the paths. The one exception is `src/lib/data/model/index.ts:745` (`UnchosenKey`), a re-export, which the change does not make false.
- `runEntry`: `tests/server/machine/runs/schedules/schedules-fixture.ts:19,150` passes `hub: w.hub` to `runEntry`'s options. Changing the options breaks this fixture. It is not a test file, so the write list's "existing tests that build the changed shapes" does not plainly cover it. The other hits are the client `appShell.runEntry`, a different function.
- `startTask` (page and route): the only caller is `src/lib/shell/rail/UpdateTray.svelte:87`. `restartTask` at `src/lib/server/machine/runs/commands/run.ts:241` is a different function.
- `task-file-missing` / `refused_task_file_missing`, and the new `hub-unknown` terminal refusal: `src/lib/state/shared/answers/terminal-words.ts:68-69` returns `catalogText('sessions.refused_task_file_missing', first)` and passes only `first`. `terminalSentence` (`terminal-words.ts:15`) is an exhaustive switch over `TerminalRefusal` with no default and a `string` return. Adding `hub-unknown` to `TERMINAL_REFUSALS` therefore needs a case there, and item 9 ("A sentence the page shows for a refusal names the hub by its name") needs the second name passed. The file is not in the write list. **False after the change.**
- `Disk` / the disk checks (item 3 puts `hub-unknown` into `file.ts`'s disk checks): `src/lib/server/machine/runs/schedules/routes.ts:154` builds `const disk: Disk = { hub: options.hubFor(), roots: options.rootsFor() }`. `routes.ts:160` then runs `diskChecker(disk).problem(entry)` in `checkSave` and refuses the save on any problem. `src/routes/api/(machine)/schedules/+server.ts:25` passes `hubFor: () => server.workspace.open().primaryDir`. Neither file is in the write list. Two consequences follow: the save route has no hubs to check a name against, and if it gets them, a save of `hub: nope` is refused, which contradicts case 25 ("a save keeps `hub: nope`"). `tests/server/machine/runs/schedules/schedules-fixture.ts:58-63` (`routeOptions`, `hubFor`) is in the same chain. **Made false or contradicted.**
- `Feeds` (item 6 adds `byHub`): `src/lib/data/model/model-collections.ts:442` declares `export type RawFeeds = Feeds;`. Every reader of a hub's own feeds is therefore typed by `Feeds`: `src/lib/data/snapshot/normalise.ts:589-596` (`function feeds(raw: Feeds): Feeds`, which copies four keys), `src/lib/data/index.ts:537` (`feeds: { leads: null, radar: null, scout: null, linkedin: null }`), `src/lib/data/sources/documents/feeds.ts:167` (`const feeds: RawFeeds = {`) and `tests/fixtures/entities-fixture.ts:11` (`export const NO_FEEDS: Feeds = {`). A required `byHub` makes each a type error. An optional one lets `normalise.ts` drop it. None is in the write list, and the brief does not say which form it means. **Affected.**
- The refresh line's words (item 7: "A line names its task as the tray row names it"; case 31: "Lit Watch (B)"): `config/text/views/boards/focus.yml:87-89` hard-codes the task names: `refresh_inbox_plain: 'Inbox: triaged {0}d ago | run Inbox from the Update tray'`, `refresh_litwatch_plain: 'Lit Watch: {0} | run Lit Watch from the Update tray'`, `refresh_scout_plain: 'Position scout: ran {0}d ago | run Scout from the Update tray'`. The file is in neither the write list nor item 9's key list. **False after the change.**
- `SchedulePayload`: `src/lib/state/shared/stores/shapes.ts:32,50,90` only imports the type and is unaffected. `tests/state/system/schedule-lines.test.ts:22-26` builds `tasks: null`; it is a test the write list's catch-all covers.
- `offered` (doc of the store type): `src/lib/state/system/machine/schedules/schedule.svelte.ts:144` says "The update tasks whose file the primary hub holds". The file is in the paths, but item 11's list of comments does not name this doc. The stale-sentence grep in verify item 8 would catch it.
- Sentences outside the tree: `docs/data-map.md:273` ("the update tasks under `.oculus/tasks/`" listed among the primary's files) and `:280` ("an update task ... refused" with no primary) are false after the change. They are in the main checkout and uncommitted (`git status --short` shows ` M docs/data-map.md`), and the brief already gives them to the orchestrator at landing.
- `src/lib/data/helpers/run/tasks.ts:1-5` (head comment) and the palette's `:update` (`src/lib/state/workbench/palette.ts:613`, `CommandRows.svelte:197-198`, `src/lib/data/helpers/files/apps/commands.ts:26`) stay true. `:update` only opens the tray.

Findings: `terminal-words.ts:15-69`, `schedules/routes.ts:150-161` with `src/routes/api/(machine)/schedules/+server.ts:25`, the `Feeds`/`RawFeeds` readers (`normalise.ts:589-596`, `data/index.ts:537`, `sources/documents/feeds.ts:167`, `tests/fixtures/entities-fixture.ts:11`) and `config/text/views/boards/focus.yml:87-89` are each changed or contradicted by the step and are outside "Paths this step writes". `schedule.svelte.ts:144` is missing from item 11. The two test fixtures (`schedules-fixture.ts`, and `terminal-fixture.ts`, see check 6) are not named.

## 2. The step line

- "the tray offers each update task (Lit Watch, Scout, LinkedIn, Inbox) of every hub that holds its file under `.oculus/tasks/`": items 1 and 4.
- "named by its hub when two hubs hold one": item 4, and item 5 for the dialog.
- "the primary first": item 1 (order within a task).
- "a schedule ... runs the task of the hub it names": items 3 and 5.
- "a request runs the task of the hub it names": item 2.
- (ruling 459): items 6, 7 and 8. (ruling 460): item 1, item 4's line and case 10. (ruling 458): item 3. (rulings 441 and 443): the whole.

Findings: none.

## 3. Premises

Commands: `sed -n`/`grep -n` over each file and `wc -l` over all of them (outputs below).

- `UPDATE_TASKS` at `model-machine.ts:11`: matches. `task.ts` 45-63: `TASKS_FOLDER` at 46 (its doc at 45), `taskFile` 49, `hasTaskFile` 54, `tasksWithFile` 63. Matches.
- `startUpdateTask` 87-116, head comment line 5: function at 88 with its doc above, head comment at line 5. Matches. `task.ts` imports `UPDATE_TASKS` from `data/helpers/run/tasks.ts`, which re-exports it; not stated, no consequence.
- `terminals.svelte.ts:468-473`, 863 lines: 468-474, 863. Matches. `routes.ts:348-370`, 510 lines: matches. `open.ts:64-65` hubs: matches.
- `runEntry` `run.ts:46-91`: matches. `startSchedules` `context.ts:383-397`, 840 lines: the function runs 377-401 and the call 383-400; 840 matches.
- `readEntry` `schedules.ts:208-233`: the function is at 204-233. **`RUNS_KEYS` "(line 33)": it is at `schedules.ts:37`** (`grep -n` and the Read of the file). Line 33 is the `ENTRY_KEYS` doc comment.
- `Disk = { hub, roots }` at `watch.ts:266`: matches.
- `SCHEDULE_WORDS` `model-machine.ts:102-135`: matches. **`TERMINAL_REFUSALS` "305-338": it starts at `model-machine.ts:300`** (`] as const` at 337, the type at 338). `terminal.yml` 58 and 67: match.
- `watch.ts` 849 lines; `tasks` at 326; watches at 742-770 (742-767); `hub` option at 96: all match. `SchedulePayload` `tasks` at 209-213, `payloads.ts:98`: match.
- `schedule.svelte.ts`, 660 lines: `offered` 395, `nextOfTask` 400, `TASK_LABELS` 250-255, `whatOf` 308-317, `commands()` 415-428, `blank` 434, `openDialog` 454-482 (brief: 434-470), `noTasks` 631-635, `tasks()` 637, `app.yml:298-299`. These match within a line or two, except `openDialog`, which ends at 482.
- `UpdateTray.svelte`, 281 lines: lastRuns 54-76 and `start` 84-94 match. **`schedule.openDialog({ task, name })` "176-177": it is at `UpdateTray.svelte:172-173`.** `ScheduleDialog.svelte:94-104`, 323 lines: matches.
- `latest`/`feedsOf` `merge.ts:235-264` (functions at 236 and 242), 382 lines; `Feeds` `model-collections.ts:415-420`; `build.ts:179-193`; `folderParts` 106-117: all match.
- `refresh` `feeds.ts:100-138` (doc from ~100, function 114); `CommandCenter.svelte:64`, 269 lines; refresh rows at 191-212: match.
- `notice-sources.ts` 120-175 and 270-293, 317 lines: match.
- `docs/apps.md:411`, `docs/HELP.md:105-106`: match. `docs/templates.md:524-545`: the heading is at 522, the example line at 528, the paragraph at 544. Matches. `docs/data-map.md` "The primary hub": it is at 267 in the main checkout, uncommitted. Matches.
- G35 title and G46 describe: `grep -n` in `guarded.md:89-91,128-130` and `terminal-actions.test.ts:58,101`, `run.test.ts:133`. Match.
- "No guarded entry names readEntry, feedsOf, refresh, the notices or the tray": true. But `guarded.md:369` (G117) names `chainOf` and `save` in `schedule.svelte.ts` and `checkSave` in `schedules/routes.ts`, and `guarded.md:291` (G91) names `unread` in `schedule.svelte.ts` and `waiting` in `watch.ts`. The step changes `save`'s `rawOf` and writes `watch.ts`, and the brief does not name either entry.

Premises the brief leaves out that its work depends on:

- The schedules watcher is built again only when the primary moves. `context.ts:743` runs `apply(next, switched ? ['workspace'] : [])`; `src/lib/server/root/watch/local.ts:161` maps `workspace` to `schedules`; `context.ts:805-813` reacts to a change of `hubs` by calling `reloadLocal(moved)`. The task watch is taken once at construction (`watch.ts:745`, `const taskHub = options.hub();`). Cases 14-16 and 23 need a new hub-change signal into the watcher. `followWorkspace` (`context.ts:166`) can be passed within lines 380-400; the brief does not say so.
- A row with a problem gets no job (`watch.ts:670`), and Run now refuses it before writing the record (`watch.ts:784-786`). Item 3's "a Run now or a due time with it refuses `hub-unknown` and records the failure" is therefore new behaviour for one problem word, not how the tree treats problems.
- The dialog's Task box offers all four tasks today, whether or not a file exists (`schedule.svelte.ts:637`), and a new draft defaults to `UPDATE_TASKS[0]` (`schedule.svelte.ts:440`). Item 5 narrows this.
- The schedule save route's disk check, the `RawFeeds` alias, `terminal-words.ts` and `focus.yml`, all as in check 1.

Findings: the `RUNS_KEYS` line (33, actually 37), the `TERMINAL_REFUSALS` start (305, actually 300) and the tray's `openDialog` lines (176-177, actually 172-173) differ from the tree. G117 and G91 cover code the step writes and are not named. The premises listed above are missing.

## 4. Cases and checks

- Cases 1, 2, 10, 12, 13, 29 and 33 (payload and summary shapes): consistent.
- Cases 3, 24, 25, 26, 27, 28 and 30 are tray and dialog behaviour that only a page shows. `spec.md` "What every package obeys" says a builder runs no page, and such a case "is checked by reading and by the unit-level runs that reach it, and its row in the report names the look on landing". The brief's rule "Every other case of a code step is checked by a run the report quotes" does not say this for these cases. Inconsistent in wording.
- Cases 4, 5 and 7 as rows of G35, and 17, 18 and 19 as rows of G46: consistent with `spec.md` "What every package obeys" (a test exists only under a guarded entry). Two problems remain:
  - **Case 19** puts three outcomes on one `runEntry` row: the row's problem, no next time, and the record holding the failure. `run.test.ts` calls `runEntry` and reads its answer only (`run.test.ts:133-163`). The row problem and the record belong to `file.ts`/`watch.ts`, not `runEntry`. The test can hold only the refusal; the rest must be a quoted run. As written, the case asks the test for what its unit does not do.
  - The same rule asks for "one row per input that gives a different outcome". Case 8 (`bad-terminal`), case 9 (`task-file-missing` with the hub's name) and case 21 (`task-file-missing` in B, through `runEntry`) each give an outcome of the same unit that no other row gives, yet the brief makes them quoted runs. The brief should either make them rows or say why not.
- Case 11 matches an existing test that no guarded entry names: `terminal-actions.test.ts:112`, 'refuses a task while the workspace has no primary hub, and starts nothing' (`grep -n` in `guarded.md` finds no hit). The brief neither mentions it nor says where the no-`root` refusal row goes.
- Case 22 passes on the unchanged tree (`schedules.ts:128-129`: any key outside `RUNS_KEYS` is `key-unknown`). It is a preservation case, consistent.
- Case 25 contradicts the save route (check 1): `checkSave` refuses a save whose entry has a disk problem.
- Case 31's arithmetic holds (2026-09-01 to 2026-10-26 is 55 days; 2026-10-20 is 6 days, under 14).
- Verify item 2 runs `terminal-actions.test.ts`, which is tagged slow (`terminal-actions.test.ts:10`). That is allowed by name (`package.json:15` filters tags only in `npm test`).
- Verify item 6's history grep prints nothing on main today (`grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml`: no output).
- No case asks the builder to check a place the step does not change, except case 25's save path through `schedules/routes.ts`, which is outside the paths.

Findings: case 19 asks one `runEntry` row for outcomes that are not `runEntry`'s. Cases 8, 9 and 21 are distinct outcomes of guarded units, kept as runs with no reason given. Cases 3, 24-28 and 30 lack the page-only wording `spec.md` requires. Case 25 contradicts the save route's disk check. The unnamed existing test at `terminal-actions.test.ts:112` is not addressed.

## 5. The question

- **Order, cases 1, 10 and 24-27:** yes, this can pass without the goal. In every multi-hub case the primary A is also the first folder ("A, the primary, then B, then C, in the folders' order"). Item 1's "the primary first, then the others in the folders' order" (ruling 441, "the primary first") can therefore be built as plain folder order, and every case passes. No case puts the primary after another hub.
- Case 19 as a test: yes, for its row-problem and record parts (check 4). A `runEntry` row passes while the watcher's row says nothing or the record holds nothing.
- Case 31 and item 7: yes, for Scout. Only Lit Watch is exercised; `refresh`'s scout branch (`feeds.ts:131-134`) can keep reading the merged `feeds.scout` and still pass.
- Case 32 and item 8: yes, for Scout and LinkedIn. Only the radar date is exercised; `feedRuns` (`notice-sources.ts:158-166`) can stay merged for `scout` and `linkedin`.
- Case 29 and item 6: partly. Only `radar` is given per hub. A `byHub` row whose `scout` or `linkedin` is wrong passes.
- Cases 3, 24-28 and 30: no, as long as the look on landing is named as their proof. A reading alone could pass them.
- The other cases (2, 4-18, 20-23, 33): no. Each names the hub-specific outcome.
- The check on the step's line (`npm run diagrams && npm run test:quick`): yes, by itself. No test row covers the tray's per-hub rows, the dialog, `byHub`, the refresh lines or the notices; those rest on quoted runs and the look. This is by design, and the cases carry that load.
- Items 1-12: each could pass without the goal only through the gaps above (the order in item 1, Scout and LinkedIn in items 6-8). Item 9 cannot be met without `terminal-words.ts` and `focus.yml` (check 1).

Findings: no case distinguishes "the primary first" from folder order. Case 19's test cannot hold its row and record outcomes. Items 6-8 are exercised for the radar only.

## 6. Implied inputs

Missing from "Cases", each with the result it should have:

1. **Saving an entry whose `hub:` names no hub, a new entry and an edited one** (`schedules/routes.ts:150-161`). Expected: a stated choice between refusing with `hub-unknown` and keeping as case 25 says. Today's disk check refuses.
2. **The dialog opened on `hub: 3` or `hub: ''` (hub-wrong).** `unchosenKeys` (`schedules.ts:186-196`) and `UnchosenKey = 'task' | 'unattended'` (`model-machine.ts:178`) have no `hub`. `changesOf` (`file.ts`, near 366-372) rewrites `runs` only when the read entry differs. Expected: the hub opens unchosen and a save writes the hub chosen. Otherwise a save that changes only the name leaves `hub: 3` in the file.
3. **A hub name in a different case or with spaces** (`hub: b`, `hub: ' B '`). Expected: either `hub-unknown` naming the value as written, or a trimmed match; the brief says neither. Whitespace-only text is also unstated (`hub-wrong` or `hub-unknown`).
4. **A hub whose name YAML reads as another type, or holds `: ` or `#`** (`2026`, `yes`, `lab: x`). Folder names are text (`workspace-file.ts:21`, `z.string().min(1)`). Expected: the dialog writes a quoted scalar that reparses to the same name, which the write's reparse check (`file.ts` head comment) verifies. A hand-written `hub: 2026` reads as a number and gives `hub-wrong` naming `2026`, though hub "2026" exists; that result should be stated. A `{1}` inside a name is safe, because `fillPlaceholders` replaces in one pass (`finding-text.ts:24-29`).
5. **Two rows of one task in the tray.** `{#each tasks as task (task.kind)}` (`UpdateTray.svelte:155`) keys rows by kind, which gives duplicate keys. `running: UpdateTask | null` (`:49`), compared by kind at 160-163, turns the sync glyph on both Lit Watch rows when one is pressed. Expected: unique keys, and only the pressed row turns.
6. **A hub added to the workspace while the primary stays.** Expected: its pairs join the payload and its watches start, which needs the hub-change signal of check 3. Case 16 has only the removal.
7. **B added back after case 23.** Expected: the row's `hub-unknown` clears and its job and next time return (`watch.ts:670`).
8. **A new schedule from "New" (`ScheduleList.svelte:66`, `openDialog({})`), or from a command (`CommandBar.svelte:91`) switched to Task, when no pair is offered or `litwatch` is not offered** (`blank` default at `schedule.svelte.ts:440`). Expected: the default pair, or an empty Task box with its refusal line.
9. **"Schedule" on a tray row with no primary** (ruling 460). Expected: the dialog opens and the save is refused `no-primary`.
10. **`whatOf` for `runs: { task: litwatch }` while A and B both hold `litwatch.md`.** Expected: "Lit Watch (A)", since the row's label is the pair's label. Case 28 tests only the case where B lacks the file.
11. **A hub's radar date changing while that hub holds no `litwatch.md`.** Item 8 posts per offered pair, so: no notice. Today a notice posts whatever the files are. `notice-sources.ts` hears channels through `entities.afterReceive` (`state/client/context.ts:686-691`), so it can read the `schedule` channel's pairs; the brief does not say where the pairs come from.
12. **The press of a pair whose hub left the workspace after the payload was read.** Covered by case 7's value rule, so not missing.
13. **Callers checked.** `startUpdateTask` is called from `pty/routes.ts:358` and `schedules/run.ts:56`; `refresh` only from `CommandCenter.svelte:64`; `offered` from `UpdateTray.svelte:69` and `CommandCenter.svelte:44,64`; `DialogFill` from `UpdateTray.svelte:173`, `ScheduleList.svelte:66,123` and `CommandBar.svelte:91`. The apps payload exposes `entities.feeds` (`docs/apps.md:398,411`) and so gets `byHub`, which item 6 documents. No app reads the `schedule` channel (`grep -rn "'schedule'" src/lib/server/machine/apps` prints nothing). The palette's `:update` only opens the tray. None of these is a missing case.
14. **Multi-hub fixtures.** `worldOf` (`tests/routes/sessions/terminal-fixture.ts:201-213`) and `world()` (`schedules-fixture.ts:80-97`) build one hub. Cases 5, 7 and 17 need a second hub, so a fixture outside the named paths changes.

Findings: inputs 1-11 and 14 are missing from "Cases" or the paths.

## 7. ADRs

- `ls -d docs/adr`: "ls: docs/adr: No such file or directory".
- `grep -n -i -w 'adr' .scratch/migration/orchestrator-state.md`: no output. The configuration block (`orchestrator-state.md:4-21`) names no `adr` key.

Findings: none.

## 8. Dictated text

- "`{0} ({1})`" for `app.tasks.in_hub`: `grep -n '{0} ({1})' .scratch/migration/agents/briefs/O86.md` prints line 40. Holds: ASCII, positional placeholders, a catalog key under `config/text/` (`spec.md` "What every package obeys").
- "`runs: { task: litwatch, hub: lab }`" for `docs/templates.md`: `grep -n 'runs: { task: litwatch, hub: lab }'` prints line 51. Holds: ASCII, a commented YAML example in the block's own style (`docs/templates.md:528`). The comment's words are described, not dictated.
- "`runs: { task: <task> }`" and "`runs: { task: <task>, hub: <name> }`" (line 41) are the shapes a save writes, not text for a file.
- The `docs/HELP.md:105` and `:106` lines (49-50) are content specifications the builder words, applied at landing. Line 105's content, four facts, keeps that bullet long. `spec.md` "What every package obeys" asks for short bullets in `docs/HELP.md`. The present line is already long, so this is a judgment for the reviewer, not a break.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O86.md`: no output.

Findings: none.

## Declined to judge

- Whether a save of an entry naming an unknown hub should be refused or kept (case 25 against the save route's disk check). That is the orchestrator's or Axel's ruling; the report only shows that the two conflict.
- Whether `Feeds.byHub` should be required or optional, and whether a hub with no task file should still post its "updated" notice. Both are design choices the brief leaves open.
- Whether cases 8, 9 and 21 must be test rows, given that G35's text is about acting on the named terminal and G46's about once per due time. This report names the rule's wording; the call is the orchestrator's.

Agent usage: a3bd147e859e9ce7f, claude-opus-5-5, 259309 tokens, 95 tool uses, 10 min 43 s.

## Closed

- Names: `terminal-words.ts` is in the paths and item 2 adds the `hub-unknown` case and the hub's name for `task-file-missing`; the save route `schedules/routes.ts` and `+server.ts` are in the paths and item 3 gives `checkSave` the hub names; `RawFeeds` becomes the four keys without `byHub` and its readers (`normalise.ts`, `data/index.ts`, `sources/documents/feeds.ts`) and `NO_FEEDS` are in the paths (item 6, decision 8); `focus.yml` 85-90 is in the paths and items 7 and 9 put the label in the refresh words; `schedule.svelte.ts:144` is named in item 11; the fixtures `schedules-fixture.ts` and `terminal-fixture.ts` are in the paths and item 10 gives them a second hub.
- Premises: `RUNS_KEYS` at 37, `TERMINAL_REFUSALS` at 300-338, the tray's `openDialog` at 172-173, `openDialog` at 454-482 and `whatOf` at 308-317 corrected; G117 and G91 named with their tests passing unchanged; the watcher's one-time read of the primary and the missing hub signal stated, and item 1 has the context's workspace subscription (lines 800-813, in the paths) tell the watcher of a change of hubs; a row with a problem having no job and Run now refusing it stated, and item 3 now follows that rule; the dialog's four-task box and its default stated, and item 5 sets the default.
- Cases and checks: case 19's test holds `runEntry`'s refusal alone, the row's problem and Run now a quoted run; cases 7, 8 and 9 are rows of G35's refusal table; the page-only cases are named with the look on landing; case 25 follows the save route (decision 7, Z1043); case 11 names the existing test at `terminal-actions.test.ts:112`.
- The question: case 34 puts the primary after another folder; case 35 covers Scout and LinkedIn in `byHub`, the rows and the refresh line; case 36 a LinkedIn notice.
- Implied inputs 1 to 11 and 14: cases 46, 39, 37 and 20, 38, 40, 41, 42, 43, 44, 45, 36, and the fixtures in the paths, in that order.
