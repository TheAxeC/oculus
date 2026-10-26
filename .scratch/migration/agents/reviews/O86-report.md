# O86 report: the update tasks of every hub of the workspace

Everything in the brief is done, with one departure from its rules: the cases' runs were made with two scratch vitest programs outside the tree (section "Departures"), which the prompt's "You write no script beyond what the brief builds" does not allow.

## Open items of the state file (verbatim)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry (`sed -n 184,190p .scratch/migration/orchestrator-state.md`).

## Departures

- The cases were run by two scratch programs, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases/first.case.ts` (the first run, on the unchanged tree) and `.../scratchpad/cases/final.case.ts` (the run after the change), each run with `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx vitest run --config <scratchpad>/cases/vitest.config.ts <name> --disableConsoleIntercept` from the worktree. They call the tree's own functions (`watchSchedules`, `handleTerminal`, `runEntry`, `readEntry`, `readSchedules`, `handleSchedules`, `createSchedule`, `mergeHubs`, `refresh`, `createNoticeSources`) over scratch folders and print what each returns. The prompt allows a case to be checked only by reading, by a test the test rule calls for, or by the project's own commands, so these two programs are outside it. Nothing in the tree depends on them. One edit of `first.case.ts` was made with `sed -i`; it is a scratch file, not a file of the tree. Their outputs are saved at `.../scratchpad/o86-first-run.txt` and `.../scratchpad/o86-final-run.txt`.
- Files written beyond the brief's path list: `src/lib/data/model/index.ts` (the state layer may import only `data/model/index.ts`, so `HubTask` is re-exported there at line 725), and the existing tests that build the changed shapes: `tests/routes/machine/schedules.test.ts`, `tests/server/machine/runs/schedules/file.test.ts`, `tests/state/system/schedule-lines.test.ts`.
- Paths of the brief left unchanged because they need no change: `src/lib/data/sources/documents/feeds.ts` and `src/lib/data/index.ts` already build `RawFeeds` (feeds.ts:163 `const feeds: RawFeeds`, index.ts:61 `feeds: RawFeeds` of `RawPortfolio`), and `npm run check` reports 0 errors over them after `RawFeeds` became its own type.

## The cases' first run

First run: the scratch program `first.case.ts` on the unchanged tree, plus the guarded tests run there (section "New tests"). After: `final.case.ts` on the changed tree. Each output line is as printed; a terminal object in a 200 answer is left out and only the status and the start folder kept. A case marked "page" is what a page shows and is also checked by reading the file named, the look being at landing.

1. First: `case 1: tasks with A primary (A: litwatch, scout; B: litwatch) = ["litwatch","scout"]`, `case 1: tray rows (offered + taskLabel): ["Lit Watch","Scout"]`. After: `case 1: tasks with A primary (A: litwatch, scout; B: litwatch) = [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"}]`, `case 1: tray rows: ["Lit Watch (A)","Lit Watch (B)","Scout"]`.
2. First: `case 2: tasks, only B holds linkedin, A primary = []`. After: `case 2: tasks, only B holds linkedin, A primary = [{"task":"linkedin","hub":"B"}]`, `case 2: rows with only B's linkedin: "LinkedIn"`, `case 2: press of linkedin, root 'other': 200 ... cwd=other`.
3. Page. First: read, `terminals.svelte.ts:468-474` posts `{ action: 'task', kind, cols, rows }` with no root. After: read, `UpdateTray.svelte` `start(task)` calls `startTask(task.kind, task.hub)` and `terminals.svelte.ts` `startTask` posts `{ action: 'task', kind, root, cols, rows }`; the route's start for `root: 'other'` is case 5, whose first message names `.oculus/tasks/litwatch.md` (`first message names litwatch.md: true`).
4. First: `case 4: no root: 200 ... cwd=task-hub (primary)`. After: `case 4: no root: 200 ... cwd=hub (primary) first message names litwatch.md: true`; G35's 'starts every accepted task as an interactive session, with no skip and no print-mode flags' passes before and after.
5. First: `case 5: root 'other': 200 ... cwd=task-hub (primary)`. After: `case 5: root 'other': 200 ... cwd=other first message names litwatch.md: true`; test (G35).
6. First: `case 6: root 'hub' (the primary): 200 ... cwd=task-hub (primary)`. After: `case 6: root 'hub' (the primary): 200 ... cwd=hub (primary) first message names litwatch.md: true`.
7. First: `case 7: root 'nope': 200 ... cwd=task-hub (primary); root '': 200 ... cwd=task-hub (primary)`. After: `case 7: root 'nope': 400 {"error":"hub-unknown","names":["nope"]} cwd=null; root '': 400 {"error":"hub-unknown","names":[""]} cwd=null`; test (G35 refusal table).
8. First: `case 8: root 3: 200 ... cwd=task-hub (primary)`. After: `case 8: root 3: 400 {"error":"bad-terminal"} cwd=null`; test (G35 refusal table, an audit: see "New tests").
9. First: `case 9: root 'other', kind scout: 200 ... cwd=task-hub (primary)`. After: `case 9: root 'other', kind scout: 400 {"error":"task-file-missing","names":[".oculus/tasks/scout.md","other"]} cwd=null`, `case 9: the page's sentence: "The hub other holds no .oculus/tasks/scout.md, so the update task has nothing to follow and nothing was started."`; test (G35 refusal table).
10. First: `case 10: tasks with no primary (B, C hold litwatch) = null`, `case 10: press with no primary, root 'B': 400 {"error":"no-primary"} cwd=null`. After: `case 10: tasks with no primary (B, C hold litwatch) = [{"task":"litwatch","hub":"B"},{"task":"litwatch","hub":"C"}]`, `case 10: rows with no primary: ["Lit Watch (B)","Lit Watch (C)"]`, `case 10: press with no primary, root 'B': 200 ... cwd=B`.
11. First: `case 11: no primary, no root: 400 {"error":"no-primary"} cwd=null`. After: the same line; 'refuses a task while the workspace has no primary hub, and starts nothing' passes unchanged before and after (section "New tests").
12. Page. First: `case 12: tasks with no hub = null`, `case 12: tray line with tasks null: "The open workspace has no primary hub, so no update task is offered."`. After: `case 12: tasks with no hub = null`, `case 12: tray line with tasks null: "The open workspace holds no hub, so no update task is offered."`.
13. Page. First: `case 13: tasks, hubs with no task file = []`, `case 13: tray line with tasks []: "The primary hub holds no task file, so no update task is offered; a task is the file .oculus/tasks/<task>.md of the hub, for litwatch, scout, inbox or linkedin, and the Templates tab of the Help page has a template of each."`. After: `case 13: tasks, hubs with no task file = []`, `case 13: tray line with tasks []: "No hub of the open workspace holds a task file, so no update task is offered; a task is the file .oculus/tasks/<task>.md of a hub, for litwatch, scout, inbox or linkedin, and the Templates tab of the Help page has a template of each."`.
14. First: `case 14: B/.oculus/tasks/scout.md created, A primary: before ["litwatch","scout"] after ["litwatch","scout"]`. After: `case 14: B/.oculus/tasks/scout.md created, no reload: before [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"}] after [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"},{"task":"scout","hub":"B"}]`, `case 14: then removed, no reload: [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"}]`.
15. First: `case 15: C/.oculus/tasks made with litwatch.md: before ["litwatch","scout"] after ["litwatch","scout"]`. After: `case 15: C with no tasks folder, then the folder made with litwatch.md, no reload: before [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"}] after [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"litwatch","hub":"C"},{"task":"scout","hub":"A"}]`.
16. First: `case 16: base SchedulesOptions has no hubs: the payload never holds B's pairs, so B leaving changes nothing: ["litwatch","scout"]`. After: `case 16: B taken out, reload as context.ts calls it: before [{"task":"litwatch","hub":"A"},{"task":"litwatch","hub":"B"},{"task":"scout","hub":"A"}] after [{"task":"litwatch","hub":"A"},{"task":"scout","hub":"A"}]`. That B's watches end is checked by reading: `followTasks` in `watch.ts` closes both handles of every folder no longer among the hubs and deletes its entry.
17. First: `case 17: runEntry { task: litwatch, hub: B }: started cwd=A (primary)`. After: `case 17: runEntry { task: litwatch, hub: B }: started cwd=B`; test (G46).
18. First: `case 18: runEntry { task: litwatch }: started cwd=A (primary)`. After: the same line; G46's existing row for the task passes before and after.
19. First: `case 19: runEntry { task: litwatch, hub: nope }: started cwd=A (primary)`, `case 19: row problem of hub: nope = {"word":"key-unknown","names":["hub"]}`. After: `case 19: runEntry { task: litwatch, hub: nope }: {"refused":"hub-unknown","names":["nope"]} cwd=null`, `case 19: row problem of hub: nope = {"word":"hub-unknown","names":["nope"]}`, `case 19: watcher row: problem {"word":"hub-unknown","names":["nope"]} next null`, `case 19: Run now: {"refused":"hub-unknown","names":["nope"]}; record file exists false; new-session calls 0`; the `runEntry` refusal is a test (G46).
20. First: `readEntry runs { task: litwatch, hub: 3 } -> {"word":"key-unknown","names":["hub"]}`, the same for `""` and `"  "`. After: `case 20: readEntry runs { task: litwatch, hub: 3 } -> {"word":"hub-wrong","names":["3"]}`, `case 20: readEntry runs { task: litwatch, hub: "" } -> {"word":"hub-wrong","names":[""]}`, `case 20: readEntry runs { task: litwatch, hub: "  " } -> {"word":"hub-wrong","names":["  "]}`.
21. First: `case 21: runEntry { task: litwatch, hub: B } while B lacks litwatch.md: started cwd=A (primary)`. After: `case 21: runEntry { task: litwatch, hub: B } while B lacks litwatch.md: {"refused":"task-file-missing","names":[".oculus/tasks/litwatch.md","B"]} cwd=null`; made a G46 row (see "Judgment calls").
22. First and after: `case 22: readEntry runs { command: build, folder: hub, hub: B } -> {"word":"key-unknown","names":["hub"]}`.
23. First: `case 23: row of hub: B (the base disk has no hub list) = {"word":"key-unknown","names":["hub"]}`. After: `case 23: with B: problem null next set`, `case 23: B taken out, reload: problem {"word":"hub-unknown","names":["B"]} next null`.
24. Page. First: `case 24: dialog Task box: ["Lit Watch","Scout","LinkedIn","Inbox"]`, `case 24: save of Lit Watch posts runs {"task":"litwatch"} (no hub can be chosen)`. After: `case 24: dialog Task box: ["Lit Watch (A)","Lit Watch (B)","Scout"]`, `case 24: save of Lit Watch (B) posts {"task":"litwatch","hub":"B"}; of Lit Watch (A) posts {"task":"litwatch"}`, and the route writes it as `case 25: route save of { task: litwatch, hub: B }: 200 {"ok":true}; file "- name: R\n  runs: { task: litwatch, hub: B }\n"`.
25. Page. First: `case 25: entry with hub: nope (base reads key-unknown, entry { task: litwatch }) opens with task "litwatch"; the box labels ["Lit Watch","Scout","LinkedIn","Inbox"]`, `case 46: save of { task: litwatch, hub: nope }: 400 {"error":"key-unknown","names":["hub"]}; file now ""`. After: `case 25: entry with hub: nope opens with {"task":"litwatch","hub":"nope"}; chosen label "Lit Watch (nope)"; box ["Lit Watch (A)","Lit Watch (B)","Scout","Lit Watch (nope)"]; check []`, `case 46: route save of { task: litwatch, hub: nope }: 400 {"error":"hub-unknown","names":["nope"]}; file ""`, `case 25: after choosing Lit Watch (B), save posts {"task":"litwatch","hub":"B"}`, `case 25: route save of { task: litwatch, hub: B }: 200 {"ok":true}; file "- name: R\n  runs: { task: litwatch, hub: B }\n"`.
26. Page. First: `case 26: Schedule on the row opens draft {"task":"litwatch","name":"Lit Watch"}`. After: `case 26: Schedule on the row Lit Watch (B) opens draft {"task":"litwatch","hub":"B","name":"Lit Watch (B)","choice":"[\"litwatch\",\"B\"]"}`; `UpdateTray.svelte` passes `{ task: task.kind, hub: task.hub, name: task.label }` (read).
27. Page. First: `case 27: nextOfTask(litwatch) = "Next: Mon 11-02 08:00 (S1)" (one row for the task; the hub: B entry has a problem on the base)`. After: `case 27: next of Lit Watch (B) = "Next: Tue 10-27 08:00 (S0)"; of Lit Watch (A) = "Next: Mon 11-02 08:00 (S1)"`.
28. Page. First: `case 28: schedule row whats: ["Lit Watch","Lit Watch"]`. After: `case 28: schedule row whats with A and B offering litwatch: ["Lit Watch (B)","Lit Watch (A)"]`, `case 28: whats with B holding no litwatch.md: ["Lit Watch (B)","Lit Watch"]`.
29. First: `case 29: merged feeds = {"leads":[],"radar":{"lastRun":"2026-10-20"},"scout":{"lastRun":"2026-10-20"},"linkedin":{"lastPost":"2026-10-01"}}`. After: `case 29: merged feeds radar {"lastRun":"2026-10-20"}, byHub [{"hub":"A","radar":{"lastRun":"2026-10-20"},"scout":{"lastRun":"2026-10-20"},"linkedin":{"lastPost":"2026-10-01"}},{"hub":"B","radar":{"lastRun":"2026-09-01"},"scout":{"lastRun":"2026-09-01"},"linkedin":{"lastPost":null}}]`, `case 29: tray rows read ["Last run: 2026-10-20","Last run: 2026-09-01"]` (the tray's `lastRun` reads the pair's hub's row of `byHub`, read in `UpdateTray.svelte`).
30. Page. First: read, `UpdateTray.svelte:66` read `current.notesRun` for the inbox. After: read, `lastRun` in `UpdateTray.svelte` returns `current.notesRun` for `inbox` whatever the hub; `case 30: refresh with both hubs offering inbox, notesRun 2026-09-01 = [{"feed":"inbox","hub":null,"days":55}]`.
31. First: `case 31: refresh over case 29 = []`, `case 31: refresh, only A, A radar 2026-09-01 = [{"feed":"litwatch","days":55}]`. After: `case 31: refresh over case 29 with A and B offering Lit Watch and Scout = [{"feed":"litwatch","hub":"B","days":55},{"feed":"scout","hub":"B","days":55}] lines ["Lit Watch (B): last refreshed 55d ago | run Lit Watch (B) from the Update tray","Scout (B): ran 55d ago | run Scout (B) from the Update tray"]`, `case 31: only A holds litwatch.md, A radar 2026-09-01 = [{"feed":"litwatch","hub":"A","days":55}] lines ["Lit Watch: last refreshed 55d ago | run Lit Watch from the Update tray"]`.
32. First: `case 32: B radar to 2026-10-26: notices ["Lit Watch ran and has new results."]`. After: `case 32: B radar to 2026-10-26: notices ["Lit Watch (B) ran and has new results."]`.
33. First: `case 33: folder part with no hub, feeds = {"leads":null,"radar":null,"scout":null,"linkedin":{"lastPost":null}}`. After: `case 33: folder part with no hub, byHub = []`.
34. First: `case 34: B primary (A, B hold litwatch) = ["litwatch"]`. After: `case 34: folders A, B with B primary (both hold litwatch) = [{"task":"litwatch","hub":"B"},{"task":"litwatch","hub":"A"},{"task":"scout","hub":"A"}]`.
35. First: `case 35: merged feeds (scout, linkedin) = {"scout":{"lastRun":"2026-10-20"},"linkedin":{"lastPost":"2026-10-01"}}`. After: `case 35: byHub scout and linkedin [{"hub":"A","scout":{"lastRun":"2026-10-20"},"linkedin":{"lastPost":"2026-10-01"}},{"hub":"B","scout":{"lastRun":"2026-09-01"},"linkedin":{"lastPost":null}}]` and the "Scout (B)" refresh line of case 31; `refresh_stale_days.scout` was set to 14 for the run, as the brief names no value for it.
36. First: `case 36: B LinkedIn post 2026-10-15: notices ["LinkedIn ran and has new results."]`. After: `case 36: B LinkedIn post 2026-10-15: notices ["LinkedIn (B) ran and has new results."]`, `case 36: B radar changes while B holds no litwatch.md: notices []`.
37. First: `readEntry runs { task: litwatch, hub: "b" } -> {"word":"key-unknown","names":["hub"]}`, the same for `" B "`. After: `case 37: readEntry runs { task: litwatch, hub: "b" } -> null` (the shape rule passes text), `case 37: row of hub: "b" with hubs A, B = {"word":"hub-unknown","names":["b"]}`, `case 37: row of hub: " B " with hubs A, B = {"word":"hub-unknown","names":[" B "]}`.
38. First: `readEntry runs { task: litwatch, hub: 2026 } -> {"word":"key-unknown","names":["hub"]}`. After: `case 38: readEntry runs { task: litwatch, hub: 2026 } -> {"word":"hub-wrong","names":["2026"]}`, `case 38: route save of hub '2026': 200 {"ok":true}; file "- name: R\n  runs: { task: litwatch, hub: \"2026\" }\n"; reads back {"task":"litwatch","hub":"2026"}`.
39. Page. First: `case 39: entry with hub: 3 opens with task "litwatch", unchosen []`. After: `case 39: entry with hub: 3 opens with {"task":"","hub":"","choice":""}, check ["Choose a task."]`, `case 39: after choosing, save posts {"task":"litwatch","hub":"B"}`.
40. Page. First: read, `UpdateTray.svelte:49` held `running: UpdateTask` and compared it by kind at 160-162, so two rows of one task would both turn. After: read, `running` holds the row's key `JSON.stringify([task, hub])`, and `glyph`, `turning` and `active` compare `running === task.key`.
41. First: `case 41: C holding scout.md (base has no hub list to add C to): before ["litwatch","scout"] after ["litwatch","scout"]`. After: `case 41: A alone; then C added with scout.md and reload: [{"task":"litwatch","hub":"A"},{"task":"scout","hub":"A"}]` (this line is the payload before C is added to the hubs), `case 41: C added: [{"task":"litwatch","hub":"A"},{"task":"scout","hub":"A"},{"task":"scout","hub":"C"}]`, `case 41: C/.oculus/tasks/linkedin.md written, no reload: [{"task":"litwatch","hub":"A"},{"task":"scout","hub":"A"},{"task":"scout","hub":"C"},{"task":"linkedin","hub":"C"}]`.
42. First: `case 42: same row with B back: no hub list on the base either, problem stays = {"word":"key-unknown","names":["hub"]}`. After: `case 42: B added back, reload: problem null next set`.
43. Page. First: `case 43: New with nothing offered: draft task "litwatch", box ["Lit Watch","Scout","LinkedIn","Inbox"], check ["The schedule has no name."]`, `case 43: New with scout alone offered: draft task "litwatch"`. After: `case 43: New with nothing offered: draft task "", box [], empty line "No hub of the open workspace holds a task file, so no update task is offered; a task is the file .oculus/tasks/<task>.md of a hub, for litwatch, scout, inbox or linkedin, and the Templates tab of the Help page has a template of each.", check ["Choose a task."]`, `case 43: New with scout of A alone offered: draft {"task":"scout","hub":"A"}`. `ScheduleDialog.svelte` gives the Task box's empty choice the words of `noTasks()`, else `app.schedules.refused_task`, while no task is chosen (read).
44. Page. First: `case 44: no primary: offered [], tray line "The open workspace has no primary hub, so no update task is offered."`. After: `case 44: no primary: Schedule on the row opens {}; save posts {"task":"litwatch","hub":"B"}` (the draft is put away by the store after the post the program answered with ok, so the open draft shows as `{}`), `case 44: route save with no primary (no schedules file, as +server.ts gives it): 400 {"error":"no-primary","names":[]}; file ""`.
45. Page. First: `case 45: what of { task: litwatch } with A and B holding litwatch: "Lit Watch"`. After: `case 45: what of { task: litwatch } with A and B holding litwatch: "Lit Watch (A)"`.
46. First: `case 46: save of { task: litwatch, hub: nope }: 400 {"error":"key-unknown","names":["hub"]}; file now ""`. After: `case 46: route save of { task: litwatch, hub: nope }: 400 {"error":"hub-unknown","names":["nope"]}; file ""`.

No case of the first run contradicted the brief's rules, so nothing was handed back for a ruling.

## DONE / NOT DONE

| Check | State | Command and output |
| --- | --- | --- |
| 1. diagrams and test:quick, once after the last change | DONE | `npm run diagrams && npm run test:quick -- --base bf27e33ff`, exit 0: `test:quick: 43 changed file(s), from git since bf27e33ff`, `test:quick: 295 test file(s)`, `ok      prettier (0.9 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.2 s)`, `ok      svelte-kit sync (2.6 s)`, `ok      eslint (11.6 s)`, `ok      svelte-check (32.6 s): 1793040043317 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest checks (133.2 s): Duration  120.53s (transform 93.24s, setup 0ms, import 244.34s, tests 203.50s, environment 3ms)`, `ok      vitest (188.7 s): Duration  177.70s (transform 236.65s, setup 0ms, import 353.30s, tests 299.93s, environment 38.45s)`, `ok      vitest slow (236.3 s): Duration  225.52s (transform 15.72s, setup 0ms, import 165.41s, tests 717.66s, environment 20ms)`, `test:quick: 239.1 s; every command passed`, `test:quick: not covered: tests that reach no changed file within the import depth,` |
| 2. related tests | DONE | `npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/ tests/shell/rail/ tests/state/system/schedule-lines.test.ts tests/routes/machine/schedules.test.ts tests/data/snapshot/normalise.test.ts`: `Test Files  12 passed (12)`, `Tests  66 passed (66)` |
| 3. line counts | DONE | `wc -l` below: largest source file `src/lib/server/machine/runs/schedules/watch.ts` 873, largest component `src/lib/shell/rail/ScheduleDialog.svelte` 323, `tests/routes/sessions/terminal-actions.test.ts` 878 |
| 4. new tests red on the unchanged tree, green after | DONE | section "New tests" |
| 5. unused exports | DONE | `sh utils/unused-exports.sh` diffed with `.agents/worktrees/O86-base/unused-exports.txt`: only removals, quoted below |
| 6. history-word grep | DONE | `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml` printed nothing, exit 1 |
| 7. ASCII gate over the changed files | DONE | `perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' $(git diff --name-only)` printed nothing, exit 0; the report is checked with `LC_ALL=C grep -n '[^ -~]'` after it is written |
| 8. the brief's grep 8 | DONE | hits listed below |
| 9. list items and sentences | DONE | read; see below |
| svelte-check | DONE | `npm run check`: `COMPLETED 4316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| prettier on the changed files | DONE | `npx prettier --write $(git diff --name-only)`, then the prettier line of check 1 |

Check 5, the difference as printed:

```
193c193
< src/lib/state/workbench/navigation/notice-sources.ts: waitOf, waitingOf, jobFinished, TASK_VIEW, feedRuns, notesRuns
---
> src/lib/state/workbench/navigation/notice-sources.ts: waitOf, waitingOf, jobFinished
324c324
< src/lib/state/workbench/navigation/notice-sources.ts: WaitKind, Waiting, Task, TaskRuns
---
> src/lib/state/workbench/navigation/notice-sources.ts: WaitKind, Waiting
```

`TASK_VIEW`, `feedRuns`, `notesRuns`, `Task` and `TaskRuns` are no longer exported; no export was added to the list.

Check 8, every remaining hit of `grep -rn "primary hub's \`.oculus/tasks\|file of the primary hub\|primary hub holds" src config docs --exclude=local.yml`:

- `src/lib/state/sessions/view-source.ts:1` and `:59`: the file a feed view draws, which is the primary's; not about tasks.
- `src/lib/state/sessions/source/write-files.ts:108`: a file the page writes into the primary; not about tasks.
- `src/lib/views/feeds/leads/Leads.svelte:20`: the leads file a new lead is written to; not about tasks.
- `docs/HELP.md:105`: the step does not write HELP.md; its replacement is in "Doc text".

Check 9: no page of the worktree states a rule on list items or sentence length (`grep -n -i "sentence length\|list item"` over `.scratch/migration/agents/spec.md` and `CLAUDE.md` finds none). Each new catalog sentence, comment and doc sentence was read against CLAUDE.md's prose rules (ASCII, no hard wrap in prose, comments wrapped at 100 columns). The "Update tasks" paragraph of `docs/templates.md` and the HELP.md replacement lines are long sentences, as the lines they replace are; each list item there is one paragraph as the file's other items are.

One run outside the brief's list: `npx vitest run tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/collections.test.ts tests/server/root/ tests/data/snapshot/` once printed `Tests  1 failed | 260 passed (261)` with the failure in `tests/data/snapshot/references.test.ts` ('scans $name'), a file and module the step does not change; the same command run again printed `Tests  261 passed (261)`, `npx vitest run tests/data/snapshot/references.test.ts` alone twice printed `Tests  38 passed (38)` each time, and test:quick passed it. Its cause is not verified.

## New tests

Each was run on the unchanged tree before the code changed and after the change.

| File | Title | Entry | Proof or audit |
| --- | --- | --- | --- |
| `tests/routes/sessions/terminal-actions.test.ts` | POST /api/terminal, the task action > starts the task in the folder of the hub its root names, the primary for its own name | G35 | proof |
| same | POST /api/terminal, a refusal > answers 'a task whose root names no hub of the workspace' as the word 'hub-unknown' | G35 | proof |
| same | POST /api/terminal, a refusal > answers 'a task whose root is empty' as the word 'hub-unknown' | G35 | proof |
| same | POST /api/terminal, a refusal > answers 'a task whose root is no text' as the word 'bad-terminal' | G35 | audit: it passed on the unchanged tree, where `bad-terminal` came from another cause |
| same | POST /api/terminal, a refusal > answers 'a task the hub its root names holds no file of' as the word 'task-file-missing' | G35 | proof |
| `tests/server/machine/runs/schedules/run.test.ts` | runEntry > starts what a schedule runs, or refuses it with its word, three new rows: 'an update task that names a hub starts in that hub', 'an update task that names no hub of the workspace is refused with hub-unknown', 'an update task whose hub holds no file of it is refused with task-file-missing' | G46 | proof for the first row; the other two rows were not reached on the unchanged tree, as the one `it` stops at its first failing row, and the first run's case 19 and case 21 (`started cwd=A (primary)`) show the unchanged tree starting both, which their rows refuse |

The unchanged tree's run (`npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/run.test.ts`), as printed with vitest's own ellipsis written `<ellipsis>`:

```
 FAIL  |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, the task action > starts the task in the folder of the hub its root names, the primary for its own name
AssertionError: other: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv<ellipsis>' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv<ellipsis>' // Object.is equality
Expected: "/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-task-route-qYiqRV/other-hub"
Received: "/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-task-route-qYiqRV/task-hub"
 <arrow> tests/routes/sessions/terminal-actions.test.ts:130:62
 FAIL  |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a task whose root names no hub of the<ellipsis>' as the word 'hub-unknown'
AssertionError: expected { error: 'bad-terminal' } to deeply equal { error: 'hub-unknown', <ellipsis>(1) }
 FAIL  |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a task whose root is empty' as the word 'hub-unknown'
AssertionError: expected { error: 'bad-terminal' } to deeply equal { error: 'hub-unknown', names: [ '' ] }
 FAIL  |unit| tests/routes/sessions/terminal-actions.test.ts > POST /api/terminal, a refusal > answers 'a task the hub its root names holds n<ellipsis>' as the word 'task-file-missing'
AssertionError: expected { error: 'bad-terminal' } to deeply equal { error: 'task-file-missing', <ellipsis>(1) }
 FAIL  |unit| tests/server/machine/runs/schedules/run.test.ts > runEntry > starts what a schedule runs, or refuses it with its word
AssertionError: an update task that names a hub starts in that hub: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv<ellipsis>' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv<ellipsis>' // Object.is equality
Expected: "/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-schedules-f659Az/other"
Received: "/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-schedules-f659Az/hub"
 Test Files  2 failed (2)
      Tests  5 failed | 34 passed (39)
```

`<ellipsis>` stands for vitest's one-character ellipsis and `<arrow>` for its arrow marker before a file position; the block keeps the failure lines of the run and leaves out its passing lines and code excerpts. The run on the changed tree, `npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/server/machine/runs/schedules/run.test.ts --reporter=verbose`, printed each title above with a pass mark, among them 'refuses a task while the workspace has no primary hub, and starts nothing' (case 11, unchanged) and 'starts every accepted task as an interactive session, with no skip and no print-mode flags' (case 4), and `Test Files  2 passed (2)`, `Tests  39 passed (39)`. After the last edit of the refusal table, `npx vitest run tests/routes/sessions/terminal-actions.test.ts` printed `Tests  38 passed (38)`.

The guarded tests named by G117 (`save`, `checkSave`) and G91 (`waiting`, `unread`) are in `tests/server/machine/runs/schedules/` and `tests/state/system/schedule-lines.test.ts`, inside check 2's run, which passed.

## Terms

The tree has no glossary (`ls docs` lists apps.md, data-map.md, diagrams, HELP.md, palette.md, templates.md).

## Files with line counts

`wc -l` after the last change: `config/text/app.yml` 325, `config/text/views/boards/focus.yml` 161, `config/text/views/sessions/terminal.yml` 119, `docs/apps.md` 847, `docs/templates.md` 1526, `src/lib/data/helpers/run/schedules.ts` 255, `src/lib/data/model/index.ts` 837, `src/lib/data/model/machine/model-machine.ts` 820, `src/lib/data/model/model-collections.ts` 513, `src/lib/data/snapshot/hubs/merge.ts` 394, `src/lib/data/snapshot/normalise.ts` 674, `src/lib/server/machine/pty/routes.ts` 516, `src/lib/server/machine/runs/schedules/file.ts` 592, `src/lib/server/machine/runs/schedules/routes.ts` 338, `src/lib/server/machine/runs/schedules/run.ts` 97, `src/lib/server/machine/runs/schedules/task.ts` 154, `src/lib/server/machine/runs/schedules/watch.ts` 873, `src/lib/server/root/context.ts` 844, `src/lib/shell/rail/ScheduleDialog.svelte` 323, `src/lib/shell/rail/UpdateTray.svelte` 295, `src/lib/state/client/shapes/payloads.ts` 307, `src/lib/state/feeds/feeds.ts` 156, `src/lib/state/sessions/terminals.svelte.ts` 870, `src/lib/state/shared/answers/terminal-words.ts` 97, `src/lib/state/system/machine/schedules/schedule-words.ts` 131, `src/lib/state/system/machine/schedules/schedule.svelte.ts` 737, `src/lib/state/workbench/navigation/notice-sources.ts` 342, `src/lib/views/boards/focus/CommandCenter.svelte` 271, `src/routes/api/(machine)/schedules/+server.ts` 32, `tests/fixtures/entities-fixture.ts` 81, `tests/routes/machine/schedules.test.ts` 99, `tests/routes/sessions/terminal-actions.test.ts` 878, `tests/routes/sessions/terminal-fixture.ts` 357, `tests/server/machine/runs/schedules/file.test.ts` 82, `tests/server/machine/runs/schedules/run.test.ts` 198, `tests/server/machine/runs/schedules/schedules-fixture.ts` 179, `tests/state/system/schedule-lines.test.ts` 49. `npm run diagrams` rewrote `docs/diagrams/channels.dot`, `channels.svg`, `layer-state.dot`, `layer-state.svg`, `layers.dot` and `layers.svg`. No new file; `watch.ts` stays under 880, so no file was split out of it.

## Judgment calls the brief left open

- The `schedule` payload carries `primary: string | null`, the primary's name, so the page can tell which pair an entry with no `hub` runs and write a save of the primary's pair with no `hub`; `payloads.ts` checks it as `z.string().nullable()`.
- The watcher watches each hub's `.oculus` folder at all times (not only while its tasks folder is missing), so a tasks folder that is removed and made again is followed; a hub whose `.oculus` folder cannot be watched is tried again at the next reload. `context.ts` calls `owned().schedules.reload()` whenever the hubs change, besides the rebuild a move of the primary makes.
- A part of the merge is from a hub when any of its registry file paths is not empty (`fromHub` in `merge.ts`); the parts `folderParts` makes have every path `''`.
- One hub's own snapshot has `byHub: []` (`normalise.ts`); only the merge fills it.
- `hub: null` written by hand reads as `hub-wrong` naming `null` (`readEntry` output `{"word":"hub-wrong","names":["null"]}`).
- Case 21 is a G46 row, since the rules file's test rule calls for a row per outcome of `runEntry`; the brief did not mark it a test.
- A press whose body has no `root` key is the primary's; a body whose `root` is present and not text (null included) is `bad-terminal`.
- `hub-unknown` is a word of both SCHEDULE_WORDS (beside `hub-wrong`) and TERMINAL_REFUSALS. A schedule's row, save or run refused with it is said by the schedule sentence, which `wordSentence` tries first; a press is said by the terminal sentence.
- The type of one `byHub` row is the unexported `HubRuns` in `model-collections.ts`, so no unused export is added and the name does not clash with `HubFeeds` of `data/snapshot/hubs/feeds.ts`.
- The refusal table of G35 sends a body that names a `root` over the task hub and the second hub, found from the body (`'root' in body`), and checks that such a refusal starts no tmux session.
- The dialog's Task box shows, while no task is chosen, the words of `noTasks()` when no pair is offered and `app.schedules.refused_task` otherwise.

## Host- and user-visible changes

- Tray rows. Before: one row per task the primary holds, labelled by the task (`["Lit Watch","Scout"]`). After: one row per hub's task, primary first, labelled `{0} ({1})` when two or more hubs hold that task (`["Lit Watch (A)","Lit Watch (B)","Scout"]`); a row's last run is its hub's; its press starts in its hub; its Schedule opens the dialog on its pair.
- Tray line. Before: `app.tasks.no_primary` "The open workspace has no primary hub, so no update task is offered." and `no_files` "The primary hub holds no task file, ...". After: `app.tasks.no_hub` "The open workspace holds no hub, so no update task is offered." and `no_files` "No hub of the open workspace holds a task file, so no update task is offered; a task is the file .oculus/tasks/<task>.md of a hub, for litwatch, scout, inbox or linkedin, and the Templates tab of the Help page has a template of each."
- Dialog Task box. Before: the four tasks always. After: the offered pairs as the tray labels them, plus an entry's own pair labelled with its hub when it is not offered; empty with its line when nothing is offered.
- Request body. Before: `{ action: 'task', kind, cols, rows }`, any other key ignored. After: an optional `root`, the hub's name; no `root` is the primary.
- Schedule key. Before: `hub:` in `runs` was `key-unknown`. After: `runs: { task, hub }`, the primary's task when `hub` is absent; the dialog writes `hub` only for a hub other than the primary, quoted where YAML would read another type (`hub: "2026"`).
- New refusal: `hub-unknown` of POST /api/terminal, `sessions.refused_hub_unknown` "The open workspace holds no hub named "{0}", so nothing was started." `task-file-missing` now names the file and the hub: "The hub {1} holds no {0}, so the update task has nothing to follow and nothing was started." (before: "The primary hub holds no {0}, ...").
- New schedule problems: `hub-wrong` (`app.schedules.problem_hub_wrong` "The hub {0} must be the name of a hub of the workspace, written as text.") and `hub-unknown` (`app.schedules.problem_hub_unknown` "The open workspace holds no hub named "{0}", so the task does not run; name a hub of the workspace, or leave hub out for the primary's task.").
- Feeds summary. Before: `leads`, `radar`, `scout`, `linkedin`. After: the same four plus `byHub: [{ hub, radar, scout, linkedin }]`, one row per hub of the merge.
- Refresh lines. Before: `refresh_litwatch_plain` "Lit Watch: {0} | run Lit Watch from the Update tray", `refresh_scout_plain` "Position scout: ran {0}d ago | run Scout from the Update tray", one line per feed over the merged dates. After: "{0}: {1} | run {0} from the Update tray" and "{0}: ran {1}d ago | run {0} from the Update tray", `{0}` the tray's label of the pair, one line per offered pair from its hub's dates, the inbox once.
- Notices. Before: one per task whose merged date is new, named by the task, whether or not any hub holds the task. After: one per offered pair whose hub's date is new, named as the tray names the row; none for a hub without the task's file.

## Changed lines of existing assertions, allow lists and predicates

| File:line (after) | Before (base line) | After |
| --- | --- | --- |
| `tests/routes/sessions/terminal-actions.test.ts:469` | `:443` `const REFUSALS: { title: string; body: unknown; word: string }[] = [` | `const REFUSALS: { title: string; body: unknown; word: string; names?: string[] }[] = [` |
| `tests/routes/sessions/terminal-actions.test.ts:545` | `:493` `...worldOf(),` | `...(hubs ? worldOf(task.taskHub, task.otherHub) : worldOf()),` |
| `tests/routes/sessions/terminal-actions.test.ts:547-550` | `:495` `run: gone,` | `run: (args) => {` / `calls.push(args);` / `return gone(args);` / `},` |
| `tests/routes/sessions/terminal-actions.test.ts:554` | `:499` `expect(await answer(response)).toEqual({ error: word });` | `expect(await answer(response)).toEqual({ error: word, ...(names && { names }) });` |
| `tests/routes/sessions/terminal-actions.test.ts:555` | none | `if (hubs) expect(calls.filter((args) => args[0] === 'new-session')).toEqual([]);` |
| `tests/routes/machine/schedules.test.ts:72` | `:72` `hubFor: () => null` | `hubsFor: () => ({ primary: null, primaryDir: null, hubs: [] })` |
| `tests/server/machine/runs/schedules/run.test.ts:175` | `:142` `hub: w.hub,` | `hubs: w.hubs,` |
| `tests/server/machine/runs/schedules/schedules-fixture.ts:67` | `:62` `hubFor: () => w.hub,` | `hubsFor: () => w.hubs,` |
| `tests/server/machine/runs/schedules/schedules-fixture.ts:164` | `:148` `hub: () => w.hub,` | `hubs: () => w.hubs,` |
| `tests/server/machine/runs/schedules/schedules-fixture.ts:168` | `:152` `hub: w.hub,` | `hubs: w.hubs,` |
| `tests/server/machine/runs/schedules/file.test.ts:42` | `:42` `const disk = { hub: dir, roots: [dir] };` | `const disk = { hub: dir, roots: [dir], hubs: [] };` |
| `tests/fixtures/entities-fixture.ts:15-16` | `:15` `linkedin: null` | `linkedin: null,` / `byHub: []` |
| `tests/state/system/schedule-lines.test.ts:27` | none | `primary: null,` |

Added rows and fixture parts (no existing line changed by them): the four refusal rows of `terminal-actions.test.ts`, its new task test, `otherHub` and the second hub of `worldOf` in `terminal-fixture.ts`, the three rows and the `tasks` planting of `run.test.ts`, and `other` and `hubs` of `world()` in `schedules-fixture.ts`.

## Sentences that describe the changed behaviour

- `docs/HELP.md:105` and `:106`: rewritten in "Doc text" (the step does not write HELP.md).
- `docs/templates.md`, the `schedules.yml` block: a commented example `runs: { task: litwatch, hub: lab }` with the comment that without `hub` it is the primary's, added. The "Update tasks" paragraph: rewritten (a task is a file of any hub, runs in that hub's folder, the tray offers every hub's, a schedule names its hub with `hub:`).
- `docs/templates.md:21` (`tasks/<task>.md` under `<hub>/.oculus/tasks/`): still true.
- `docs/data-map.md:20`: still true.
- `docs/apps.md`, the `feeds` row: rewritten to name `byHub` and its row shape.
- Head comments rewritten: `task.ts`, `run.ts`, `watch.ts` (lines 1-7 and the task-file watch comment), `file.ts`, `schedules.ts`, `merge.ts`, `UpdateTray.svelte`, `notice-sources.ts`, `schedule-words.ts`; doc comments rewritten: `SchedulePayload.tasks` and `primary`, `ScheduleTarget`, `offered`, `nextOfTask`, `taskLabel`, `noTasks`, `tasks` of the store type, `Feeds` and `RawFeeds`, `refresh` and `RefreshItem`, `RunEntryOptions.hubs`, `SchedulesOptions.hubs`, `SchedulesRouteOptions.hubsFor`, `startTask` in `pty/routes.ts` and in `terminals.svelte.ts`, `normalise.ts` `feeds`, and the comment in `context.ts`'s workspace subscription.
- Still true without change: the head of `pty/routes.ts` ("starts an update task"), the head of `schedules/routes.ts` (a save checked by the disk, `schedules/file.ts`), the head of `schedule.svelte.ts`, the head of `CommandCenter.svelte`.

## Anything in the brief that was wrong or impossible

Nothing was found wrong or impossible. The brief's statements about the unchanged code were checked against it in the first run: the payload held only the primary's tasks (case 1), a press ignored `root` (cases 5 to 9), `hub:` was `key-unknown` (cases 20, 22, 37, 38), and a notice ignored the task files (cases 32, 36).

## Doc text

Current, as `grep -n "" docs/HELP.md | sed -n 105,106p` prints it:

```
105:- Update, at the foot of the rail, opens the tray: the schedules of `.oculus/schedules.yml` and the update tasks (Lit Watch, Scout, LinkedIn, Inbox). A task is a file of the primary hub, `.oculus/tasks/litwatch.md`, `scout.md`, `linkedin.md` or `inbox.md`, and runs as a Claude session in a terminal that is asked to follow that file step by step. The tray offers only the tasks whose file the hub holds, and says so in one line when it holds none; [templates](templates.md) has a template of each file. A task's row gives its last run ("Last run:", or "Last post:" for LinkedIn) and, after a bar, the schedule that runs it next ("Next:"). A pressed task, and a schedule's Run now, turn a sync glyph until the terminal opens or the refusal is said. Chat starts a Claude session over the portfolio, whose index holds the projects of every hub of the workspace and the files of the collections each hub's `chat_context` names.
106:- A schedule or a request that names a task whose file the primary hub lacks is refused and starts nothing, and the Focus board's refresh lines name only the tasks that have a file.
```

Replacement for 105:

```
- Update, at the foot of the rail, opens the tray: the schedules of `.oculus/schedules.yml` and the update tasks (Lit Watch, Scout, LinkedIn, Inbox). A task is a file of a hub, `.oculus/tasks/litwatch.md`, `scout.md`, `linkedin.md` or `inbox.md`, and runs as a Claude session in a terminal, in that hub's folder, that is asked to follow that file step by step. The tray offers the task of every hub that holds its file, the primary's first, names a row by its hub when two hubs hold that task, offers them too in a workspace with no primary, and says so in one line when no hub holds a task file; [templates](templates.md) has a template of each file. A task's row gives its hub's last run ("Last run:", or "Last post:" for LinkedIn; the Inbox's is the machine's) and, after a bar, the schedule that runs that hub's task next ("Next:"). A pressed task, and a schedule's Run now, turn a sync glyph until the terminal opens or the refusal is said. Chat starts a Claude session over the portfolio, whose index holds the projects of every hub of the workspace and the files of the collections each hub's `chat_context` names.
```

Replacement for 106:

```
- A schedule names its task's hub with `hub:` in `runs` (the primary's task when it has none). A schedule or a request that names a hub the workspace does not hold, or a task whose file the named hub lacks, is refused and starts nothing. Each hub's task has its own refresh line on the Focus board, and the board's refresh lines name only the tasks that have a file.
```
