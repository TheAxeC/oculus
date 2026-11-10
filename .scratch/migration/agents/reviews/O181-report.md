NOT DONE: no run of the whole verify list on the final tree. The list (`npm run diagrams`, then `env -u TMPDIR npm run test:quick`) ran once in round 2, on the tree before the last fixes, and was red: `test:quick: 574.2 s; failed: eslint, vitest checks, vitest, vitest slow`. By Axel's ruling (b) for this round, relayed by the coordinator, the list was not run again: the two red files were rerun alone, and the type check, prettier and eslint ran over the files the fixes touch (below). One of the two red rows of `vitest` in that run is not identified, because the run's output was kept to its last 150 lines (`| tail -150`); the other is `tests/server/edit/app-store.test.ts:301`, "Test timed out in 5000ms", green alone. The reds of `eslint` and `vitest checks` were found and fixed by the targeted runs below. Two calls of `src/lib/server/root/context.ts` that connect the TypeScript server to the settings file watch and to the apps read have no test. Everything else in the brief and in the round briefs `O181-round-1.md` and `O181-round-2.md` is done.

Open questions for the orchestrator (the guarded entries are the orchestrator's to write):

- `tests/checks/config/setting-findings.test.ts` (new) holds the describe 'settingFindings' moved whole out of `tests/checks/config/config.test.ts`, so that file stays under 880 lines; the entries of `agents/guarded.md` that name `config.test.ts` (G12 at :254 and the G12 and G13 lines at :435) need the new file beside it.
- `tests/server/root/watch/settings-watch.test.ts` gains the row "tells settingsWritten of a write in the root's settings file and of no other (G109)"; G109's Test line (guarded.md:374-376) needs it.
- Every row this step adds carries its entry in its title: `(G13)` setting readers, `(G125)` audit markers, `(G32)` feed and watcher, `(G8)` LinkedIn writes, `(G61)` config cache, `(G3)` the private folders, `(G109)` the settings file watch.
- The page-side check of an update task's view (`viewsAre`, `unviewed` in `state/system/machine/schedules/schedule.svelte.ts`) is tested by `tests/state/system/schedule-lines.test.ts` under `(G13)`; whether it belongs under G13 or an entry of its own is the orchestrator's question for Axel (spec.md:60).

## DONE / NOT DONE

| Deliverable | Status | Proof |
| --- | --- | --- |
| Brief item 1, the fallbacks beside a config key | DONE | grep 1 below; round 2 item 4 below |
| Brief item 2, the hub's words in the hub's config | DONE | `update_tasks`, `feed_registries`; `tests/data/sources/config/settings/hub-rows.test.ts`; the case runs below |
| Brief item 3, the file names and the default agent | DONE | `latex.main_file`, `project_docs`, `terminal.default_agent`; case run below |
| Brief item 4, the format request's `file` required | DONE | case "format no file": `{"status":400,"body":"{\"error\":\"not-an-action\"}"}` (round 0 run on the changed tree, below) |
| Brief item 5, the HPC poll's timeout a named constant | DONE | `src/lib/server/machine/hpc/poll.ts` `POLL_TIMEOUT_MS = 40000`; grep 2 prints nothing |
| Brief, the read of every file of `src` whole | DONE | "Read so far": files 1-1512 in round 1, 1513-2146 in round 2, each with Read; `.agents/scratch/round2-log.md` lines 72-700 hold one line per file of round 2 |
| Round 2 items 1-10 | DONE | "# Repair round 2" below, each with its check |
| Verify 1: `npm run diagrams`, then `env -u TMPDIR npm run test:quick` | NOT DONE on the final tree | ran once, red; the targeted runs below replaced the second run by Axel's ruling (b) |
| Verify 2: `sh utils/unused-exports.sh` against `../O181-base/unused-exports.txt` | DONE | no added line; the changed lines only shrink base entries (below) |
| Verify 3: the two greps | DONE, grep 1 prints two lines that name no task word | below |
| Verify 4: the ASCII gate over the changed files | DONE | prints nothing (below) |

### The verify list, its one run

`npm run diagrams` (exit 0), then `env -u TMPDIR npm run test:quick`, started 22:06, output kept to its last 150 lines. The kept lines:

```
 Test Files  2 failed | 303 passed | 85 skipped (390)
      Tests  2 failed | 4191 passed | 990 skipped (5183)
FAILED  vitest slow (571.0 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/server/edit/config-key.test.ts > a write that names a hub > (11 rows)
 FAIL  |unit| tests/routes/edit/undo/config-save.test.ts > the Save of a Settings scope, one write of its file and one record > writes 'two options of the workspace file' in one record, and the undo puts it back
Error: Test timed out in 20000ms.
 Test Files  3 failed | 102 passed (105)
      Tests  13 failed | 977 passed | 369 skipped (1359)
test:quick: 574.2 s; failed: eslint, vitest checks, vitest, vitest slow
```

and, of `vitest`, the second red row: `tests/server/edit/app-store.test.ts:301:18`, "Error: Test timed out in 5000ms.".

The targeted runs that replaced the second run, after every fix below:

- The red files alone, none changed by this step (`git diff --quiet -- tests/data/hubs/hub-portfolio.test.ts tests/routes/edit/undo/config-save.test.ts tests/server/edit/app-store.test.ts`, exit 0): `env -u TMPDIR npx vitest run tests/data/hubs/hub-portfolio.test.ts tests/routes/edit/undo/config-save.test.ts`: `Test Files  2 passed (2)`, `Tests  29 passed (29)`; the same with `--tagsFilter slow --testTimeout 20000`: `Test Files  2 passed (2)`, `Tests  29 passed (29)`; `env -u TMPDIR npx vitest run tests/server/edit/app-store.test.ts`: `Tests  15 passed (15)`.
- The 11 rows of `tests/server/edit/config-key.test.ts` 'a write that names a hub' fail at `config-key.test.ts:458 expect(existsSync(join(made.hub, '..', 'x'))).toBe(false)`: with `TMPDIR` unset the scratch hub lies directly under `/tmp`, and `/tmp/x` is a stray file this step does not touch. Named, not fixed.
- eslint over every changed and new file: four errors, each fixed (`src/lib/data/sources/config/local.ts:769`, `src/lib/views/sources/files/sections/notes-section.svelte.ts:144`, `tests/server/accounts/mail/signals.test.ts:15`, `tests/server/files/notes.test.ts:108`); rerun: no output.
- `vitest checks`: `env -u TMPDIR npx vitest run tests/checks/source tests/checks/tree tests/checks/imports tests/checks/config --testTimeout 0` found the comment width of `relay-life.ts:7` and "tests/checks/config/config.test.ts is 907 lines, over the line and not on the list"; after the fixes (the describe moved to `setting-findings.test.ts`, 203 lines; `config.test.ts` 717 lines): `Test Files  18 passed (18)`, `Tests  226 passed | 9 skipped (235)`.
- `npx svelte-check`, after the last change: `COMPLETED 4672 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npx prettier --check` and `npx eslint` over the five files of the last fix (`src/lib/server/machine/lsp/adapters/web/formatting.ts`, `tests/server/machine/lsp/lsp-fixture.ts`, `tests/server/root/context-fixture.ts`, `tests/server/machine/apps/world/language-app.ts`, `tests/server/machine/lsp/adapters/formatting.test.ts`): "All matched files use Prettier code style!", eslint exit 0.
- The tests of the last fixes: `env -u TMPDIR npx vitest run tests/server/machine/lsp tests/server/machine/apps/world tests/server/root/watch/settings-watch.test.ts`: `Test Files  15 passed (15)`, `Tests  208 passed (208)`; every test file importing the changed fixtures (25 files, `grep -rl "language-app\|context-fixture\|lsp-fixture" tests`): `Tests  304 passed (304)`, and with `--tagsFilter slow --testTimeout 20000`: `Tests  122 passed | 182 skipped (304)`.

What these runs do not cover: the test files the list would select that none of the fixes touch, on the final tree. The list's run covered them on the tree before the last fixes, apart from the one unidentified red row.

### Verify 2

`sh utils/unused-exports.sh | diff ../O181-base/unused-exports.txt -` prints no added name. Each changed line is a base entry losing names: `Unused exports (226)` to `(225)`; `helpers/worktrees.ts: WORKTREES_DIR, IGNORE_RULE` gone (both removed); `content/docs.ts` loses `MARKDOWN_DOCS` (removed); `content/latex.ts` loses `mains` (removed); `project-files.ts` loses `SKIP_DIRS, fileIndex` (removed); `hpc/prewarm.ts` loses `PREWARM_RUNGS` (removed); `sessions/group.ts` loses `defaultRoots` (removed); `agents.svelte.ts` loses `AgentId` (now imported by the views). The added names an earlier run found were fixed: `websiteSection` and `type RecoverSettings` dropped from the barrel `src/lib/data/sources/config.ts`, `SIGNALS` of `server/accounts/mail/plate.ts` no longer exported, `Formatting` dropped from the type re-export of `lsp/servers.ts`, and `formattingOptions` of `lsp/adapters/web/formatting.ts` no longer exported (its test callers use `heldIndent`, the function `context.ts` calls).

### Verify 3

grep 1 (`grep -rn -E "UPDATE_TASKS|FEED_REGISTRIES|TASK_LABELS|TASK_VIEW|PROJECT_DOCS|const NOTES|FIRST = 'main\.tex'|agent: 'claude'|\.catch\('(multiple|strip)'\)|\?\? *'(multiple|strip|never|claude|main\.tex)'" src`) prints:

```
src/lib/state/sources/fs.svelte.ts:138:const NOTES = ['fs', 'notes'];
src/lib/data/helpers/search/query.ts:51:export const NOTES_SCOPE = '#notes';
```

The first is in the base unchanged (`grep -rn -E "const NOTES" ../O181-base/src` prints `fs.svelte.ts:137:const NOTES = ['fs', 'notes'];` beside the base's `UpdateTray.svelte:66` `NOTES`, which is gone): the query key of the notes listing. The second is the search scope token of every hub's notes, made by this step for `notes_dir`; the pattern `const NOTES` matches both by name only, and neither is a task word. grep 2 (`grep -n -E "\?\? *40_?000" src/lib/server/machine/hpc/poll.ts`) prints nothing (exit 1).

### Verify 4

`LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)`, spec.md:103's gate (there is no `bin` folder), prints nothing, exit 0. `LC_ALL=C grep -n '[^ -~]' docs/templates.md vite.config.ts config/options/local.yml` prints nothing. This report is checked the same way after writing (last section).

## Open items of the state file, verbatim

The section "## Open items" of `orchestrator-state.md` holds no item. Its only text is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run, on the unchanged tree

Round 0's command: `S=$PWD/.agents/scratch; TMPDIR=$S GIT_CEILING_DIRECTORIES=$S npx vitest run --config .agents/scratch/vitest.config.ts --disable-console-intercept | grep '^CASE'`, a case program that called the readers, the stores and the routes directly.

```
CASE show_tabs none: {"findings":[],"showTabs":"none"}
CASE show_tabs 5: {"findings":["settings.show_tabs must be text; oculus's value stands"],"showTabs":"multiple"}
CASE auto_clean on_built loaded: ["build","clean","build","clean"]
CASE auto_clean not loaded: ["build"]
CASE auto_clean foo: {"findings":["settings.latex.auto_clean must be one of never, on_failed, on_succeeded, on_built; oculus's value stands"],"read":"never"}
CASE update_tasks scout key findings: ["key update_tasks is not one the hub's settings file takes; it is not applied"]
CASE update_tasks scout offered: {"offered":[{"task":"scout","hub":"a"}],"labels":["Scout"]}
CASE no key offered: [{"task":"scout","hub":"a"},{"task":"inbox","hub":"a"}]
CASE two hubs: [{"task":"litwatch","hub":"b"},{"task":"scout","hub":"a"}]
CASE update_tasks 5 findings: ["key update_tasks is not one the hub's settings file takes; it is not applied"]
CASE schedule foo: {"entry":{"name":"n","runs":{"task":"litwatch"},"when":"","paused":false,"unattended":false},"problem":{"word":"update-task-unknown","names":["foo","litwatch, scout, linkedin, inbox"]}}
CASE schedule ../x: {"entry":{"name":"n","runs":{"task":"litwatch"},"when":"","paused":false,"unattended":false},"problem":{"word":"update-task-unknown","names":["../x","litwatch, scout, linkedin, inbox"]}}
CASE isFeedEntry shipped: ["leads","radar"]
CASE feed_registries [] findings: ["key feed_registries is not one the hub's settings file takes; it is not applied"]
CASE feed_registries [] unnamed and feeds: {"unnamed":{"registries":["venues","datasets","pillars","domains","funding","people","organisations","resources"],"feeds":[],"collections":false,"literature":true,"deck":true},"feeds":{"leads":"a.yml","radar":"b.yml","linkedin":""},"collections":["literature"]}
CASE feed_registries [leads] / [foo] / [datasets] / 5 / [leads, leads] / [linkedin] findings: each ["key feed_registries is not one the hub's settings file takes; it is not applied"]
CASE sourcesIn paper a: ["a.tex","paper.tex"]
CASE sourcesIn with main: ["main.tex","a.tex","paper.tex"]
CASE main_file paper.tex / '' / a/b.tex findings: each ["latex.main_file is not an option; it is not applied"]
CASE project_docs key findings: ["key project_docs is not one the hub's settings file takes; it is not applied"]
CASE projectDocs: [["README.md","README"],["code/README.md","CODE"],["manuscript/main.pdf","PDF"],["manuscript/main.tex","TEX"]]
CASE project_docs ../other/README.md / /etc/x.md / '' / 5 findings: each ["key project_docs is not one the hub's settings file takes; it is not applied"]
CASE default_agent codex / foo / '' findings: each ["terminal.default_agent is not an option; it is not applied"]
CASE format with file: {"status":200,"body":"{\"text\":\"a\"}"}
CASE format no file: {"status":200,"body":"{\"text\":\"a\"}"}
CASE hpc timeouts: [25000,40000]
```

A premise of the brief this run does not reproduce: item 1 says the workspace layer's finding names the key and the value (`workspace-layer.ts:231`); the run's `show_tabs 5` finding names the key and not the value 5. The findings now name the value (below).

The cases of the round briefs that had no first run, on the unchanged tree. Program `.agents/scratch/base/cases/round1.test.ts` and `.agents/scratch/base/cases/round2-tests.test.ts` in a copy of `../O181-base` (`src`, `tests`, `config`, `utils`; `diff -rq` of the four against `../O181-base` printed nothing before the copy was removed), config `.agents/scratch/base-vitest.config.ts` (root the copy, `include: ['cases/**/*.test.ts', 'tests/**/*.test.ts']`, `maxWorkers: 1`). Command: `cd .agents/scratch/base && S=<worktree>/.agents/scratch; TMPDIR=$S GIT_CEILING_DIRECTORIES=$S npx vitest run --config ../base-vitest.config.ts --disable-console-intercept --testTimeout 60000 cases/round1.test.ts cases/round2-tests.test.ts 2>&1 | grep -E "^CASE|Test Files|      Tests |Error" | sed "s#$S/case-hub-[A-Za-z0-9]*#<hub>#g"`. Output (21:04, the case files unchanged since 20:57):

```
CASE update_tasks empty and repeated findings: ["key update_tasks is not one the hub's settings file takes; it is not applied"]
CASE update_tasks empty and repeated offered: [{"task":"scout","hub":"a"}]
CASE update_tasks view/last_run/label findings: ["key update_tasks is not one the hub's settings file takes; it is not applied"]
CASE update_tasks view/last_run/label offered: [{"task":"litwatch","hub":"a"},{"task":"scout","hub":"a"},{"task":"linkedin","hub":"a"},{"task":"inbox","hub":"a"}]
CASE last post words: "Last post: {0}"
CASE feed_registries [leads, leads]: {"findings":["key feed_registries is not one the hub's settings file takes; it is not applied"],"feeds":{"leads":"a.yml","radar":"b.yml","linkedin":""},"collections":["literature"]}
CASE tray follows an edit: {"before":["A:litwatch","B:scout"],"after":["A:litwatch","B:scout"]}
CASE kept lab (changed: status:closed): "status:done"
CASE kept home (changed: status:done): "status:done"
CASE kept twice (changed: undefined): "status:done"
CASE tickedStatus exported: "undefined"
CASE noJif exported: "undefined"
CASE venueText none (changed: Venue | Q1): "Venue | Q1"
CASE venueText 6.5 (changed: Venue | Q1 | JIF 6.5): "Venue | Q1 | JIF 6.5"
CASE venueText none under venue_no_jif [n/a] (changed: Venue | Q1 | JIF none): "Venue | Q1"
CASE hubRowFindings exported: "undefined"
CASE findings of update_tasks, cluster_folder rel/x, skip_folders ../x: []
 Test Files  2 passed (2)
      Tests  8 passed (8)
```

The base programs' sources. `round1.test.ts` writes a hub folder under `TMPDIR` holding `.oculus/config.yml` and `.oculus/tasks/<task>.md`, and prints: `loadConfig(engineDir(), { hub }).findings` and `offeredTasks({ primary: 'a', primaryDir: at, hubs: [{ name: 'a', dir: at }] })` for the update_tasks text `- { task: "", label: E, note: n, view: radar }`, `- { task: scout, label: S, note: n, view: leads }`, `- { task: scout, label: S2, note: n, view: leads }` with the file `scout`; the same for the rows `{ task: scout, label: A, note: n, view: nowhere }`, `{ task: litwatch, label: B, note: n, view: radar, last_run: foo }`, `{ task: inbox, note: n, view: inbox }`, `{ task: linkedin, label: D, note: n, view: linkedin, last_run: linkedin }` with the four files, and `TEXT['app.tasks.last_post']`; `portfolioConfigFrom(read.config, read.from)` for `feed_registries: [leads, leads]` with two collections `{ key: leads, file: a.yml, registry: leads }`, `{ key: radar, file: b.yml, registry: radar }`; and the `schedule` channel's tasks of `watcherOver(world(), new Hub(), tmux())` (`tests/server/machine/runs/schedules/schedules-fixture.ts`) before and 1500 ms after writing `update_tasks:\n  - { task: scout, label: Scout, note: n, view: leads, last_run: scout }\n` into the second hub's `config.yml` with its `tasks/scout.md`. `round2-tests.test.ts` prints `rowMaker('t').kept(...)` of a task line of the hubs `lab` (statuses `todo`, `closed` carrying `task_done`, `done`), `home` (none) and `twice` (two words carrying it), after `setVocab(hubVocabs(...))`; `typeof` of `tickedStatus` (`state/boards/focus.ts`), `noJif` (`state/sources/registries/venues.ts`) and `hubRowFindings` (`config/catalogs.ts`), looked up by name; `presets.venueText` of a venue with `jif` `none` and `6.5`, and `none` under the words `{ venue_no_jif: ['n/a'] }`; and `settingFindings` of the shipped map with `update_tasks: [{ task: '', label: 'S', note: 'n', view: 'leads' }]`, `slurm.cluster_folder: 'rel/x'`, `audit.skip_folders: ['../x']`. Each asserts nothing.

## The cases on the changed tree

Round 0's run on the changed tree (round 0's tree; the lines that read differently on the final tree are named after the block):

```
CASE show_tabs none: {"findings":[],"showTabs":"none"}
CASE show_tabs 5: {"findings":["settings.show_tabs must be text, not 5; oculus's value stands"],"showTabs":"multiple"}
CASE auto_clean on_built loaded: ["build","clean","build","clean"]
CASE auto_clean not loaded: ["build"]
CASE auto_clean foo: {"findings":["settings.latex.auto_clean must be one of never, on_failed, on_succeeded, on_built, not \"foo\"; oculus's value stands"],"read":"never"}
CASE update_tasks scout key findings: []
CASE update_tasks scout offered: {"offered":[{"task":"scout","hub":"a","label":"Scout","note":"n","view":"leads","lastRun":null,"file":".../.agents/scratch/case-hub-Okh8Cl/.oculus/config.yml","at":"update_tasks[0]"}],"labels":["Scout"]}
CASE no key offered: {"offered":[],"no_files":true}
CASE two hubs: [["a","scout","Scout"],["b","litwatch","Lit"]]
CASE update_tasks bad rows findings: ["update_tasks[0].task: update_tasks[0].task must be lowercase letters, digits and dashes starting with a letter, not \"\"; the field is not read","update_tasks: update_tasks holds the name scout more than once; the first is read and the others are not","update_tasks[3].task: update_tasks[3].task must be lowercase letters, digits and dashes starting with a letter, not \"../x\"; the field is not read"]
CASE update_tasks bad rows offered: [["scout","S"]]
CASE update_tasks 5 findings: ["update_tasks: update_tasks must be a list; none of its rows is read"]
CASE update_tasks view/last_run/label findings: ["update_tasks[1].last_run: update_tasks[1].last_run must be one of radar, scout, linkedin, inbox, not \"foo\"; the field is not read","update_tasks[2].label: update_tasks[2].label must be text and is not set; the field is not read"]
CASE update_tasks view/last_run/label offered: [["a","nowhere",null],["d","radar","linkedin"]]
CASE last post words: "Last post: {0}"
CASE schedule foo read: {"entry":{"name":"n","runs":{"task":"foo"},"when":"","paused":false,"unattended":false},"problem":null}
CASE schedule ../x read: {"entry":{"name":"n","runs":{"task":"../x"},"when":"","paused":false,"unattended":false},"problem":{"word":"update-task-unknown","names":["../x"]}}
CASE schedule foo listed [litwatch,scout]: {"problem":{"word":"update-task-unknown","names":["foo","a","litwatch, scout"]},"sentence":"foo is no update task of a: the update_tasks of a lists litwatch, scout."}
CASE schedule foo listed []: {"problem":{"word":"update-task-unknown","names":["foo","a",""]},"sentence":"foo is no update task of a: the update_tasks of a lists none."}
CASE feed_registries [leads]: {"findings":[],"registries":["leads"],"unnamedFeeds":[],"feeds":{"leads":"a.yml","radar":"","linkedin":""},"collections":["radar","literature"]}
CASE main_file paper.tex: {"findings":[],"order":["paper.tex","a.tex","main.tex"]}
CASE main_file unset: ["main.tex","a.tex","paper.tex"]
CASE main_file '': {"findings":["settings.latex.main_file must be the name of one file, with no folder, not \"\"; oculus's value stands"],"order":["main.tex","a.tex","paper.tex"]}
CASE main_file a/b.tex: {"findings":["settings.latex.main_file must be the name of one file, with no folder, not \"a/b.tex\"; oculus's value stands"],"order":["main.tex","a.tex","paper.tex"]}
CASE project_docs key findings: []
CASE projectDocs set: [["manuscript/paper.tex","TEX"]]
CASE projectDocs none: [["README.md","README"],["code/README.md","CODE"],["manuscript/main.pdf","PDF"],["manuscript/main.tex","TEX"]]
CASE project_docs [{ name: ../other/README.md, label: X }]: {"findings":["project_docs[0].name: project_docs[0].name must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"../other/README.md\"; the field is not read"],"rows":[],"route":{"name":"../other/README.md","status":404,"body":"{\"error\":\"not a document this route serves: ../other/README.md\"}"}}
CASE project_docs 5: {"findings":["project_docs: project_docs must be a list; none of its rows is read"],"rows":[],"route":{"name":"","status":404,"body":"{\"error\":\"not a document this route serves: \"}"}}
CASE default_agent codex: {"findings":[],"agent":"codex"}
CASE default_agent foo: {"findings":["settings.terminal.default_agent must be one of the items of the list agents, not \"foo\"; oculus's value stands"],"agent":"claude"}
CASE default_agent '': {"findings":["settings.terminal.default_agent must not be empty; oculus's value stands"],"agent":"claude"}
CASE format with file: {"status":200,"body":"{\"text\":\"a\"}","args":"format --stdin-filepath paper.tex -\n"}
CASE format no file: {"status":400,"body":"{\"error\":\"not-an-action\"}"}
CASE hpc timeouts: [25000,40000]
CASE before viewsAre: {"offered":[],"unviewed":[]}
CASE after viewsAre: {"offered":["b"],"unviewed":[{"file":"/h/.oculus/config.yml","key":"update_tasks[0].view","message":"update_tasks[0].view must name a view of oculus, not nowhere; the update task is not offered"}]}
```

Lines of that block that read differently on the final tree, each shown by the final run below or by a test: a refused field of a row of a list of records now says "its row is not read" (the row is dropped, `hub-rows.test.ts` row "words a refused field ... its row is not read (G13)"); `feed_registries` defaults to `[]`, and a word no feed has is a finding at its own place and is not read while the other words are (`hub-rows.test.ts` 'feedRegistries': `['foo']` reads `[]` with `feed_registries[0]: choice`, `['leads', 'foo']` reads `['leads']`); a value that is not a list of records names its value ("must be a list, not 5; none of its rows is read", `setting-findings.test.ts` row "names the value of a block, a family and a list of records that is not of its kind (G13)").

The final tree's run. Programs `.agents/scratch/cases/keys.test.ts` and `.agents/scratch/cases/round1.test.ts`, config `.agents/scratch/changed-vitest.config.ts` (root the worktree, `include: ['.agents/scratch/cases/**/*.test.ts']`, `maxWorkers: 1`). Command, from the worktree: `S=$PWD/.agents/scratch; TMPDIR=$S GIT_CEILING_DIRECTORIES=$S npx vitest run --config .agents/scratch/changed-vitest.config.ts --testTimeout 60000 --disable-console-intercept 2>&1 | grep -E "^CASE|Test Files|      Tests |Error" | sed "s#$S/case-hub-[A-Za-z0-9]*#<hub>#g; s#$S#<scratch>#g"`, run after the last change:

```
CASE workspace terminal: { default_agent: nosuch }: ["settings.terminal.default_agent: settings.terminal.default_agent must be one of the items of the list agents, not \"nosuch\"; oculus's value stands"]
CASE workspace terminal: { default_agent: codex }: []
CASE workspace latex: { main_file: a/b.tex }: ["settings.latex.main_file: settings.latex.main_file must be the name of one file, with no folder, not \"a/b.tex\"; oculus's value stands"]
CASE workspace git: { worktrees_dir: ../out }: ["settings.git.worktrees_dir: settings.git.worktrees_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"../out\"; oculus's value stands"]
CASE terminal.default_agent: ["terminal: key terminal is not one the hub's settings file takes; it is not applied"]
CASE audit.markers: ["audit.markers: audit.markers must be a list of texts, not [5]; the default is used"]
CASE audit.provisional_mark: ["audit.provisional_mark: audit.provisional_mark must be text, not 5; the default is used"]
CASE audit.skip_folders: ["audit.skip_folders: audit.skip_folders must be a list in which each item is a path inside the folder it is read in, written relative to it, with no .. and no backslash, not [\"../x\"]; the default is used"]
CASE website.schema_section: ["website.schema_section: website.schema_section must be text, not [1]; the default is used"]
CASE slurm.cluster_folder: []
CASE slurm.cluster_folder 5: ["slurm.cluster_folder: slurm.cluster_folder must be text, not 5; the default is used"]
CASE slurm.unsent: ["slurm.unsent: slurm.unsent must be a list of texts, not 5; the default is used"]
CASE slurm.log_dirs: ["slurm.log_dirs: slurm.log_dirs must be a list in which each item is a folder pattern inside the folder it is read in, of letters, digits, dots, dashes, underscores, stars and slashes, with no .., not [\"../up\"]; the default is used"]
CASE slurm.scratch_roots: ["slurm.scratch_roots.utwente: slurm.scratch_roots.utwente must be an absolute folder of letters, digits, dots, dashes, underscores and slashes, ending in no slash and with no . or .. part, not \"rel\"; the entry is not read"]
CASE recover.data_dir: ["recover.data_dir: recover.data_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"/abs\"; the default is used"]
CASE recover.partitions: ["recover.partitions.utwente: recover.partitions.utwente must be a Slurm partition name, or several joined by commas, of letters, digits, dots, dashes and underscores, not \"a b\"; the entry is not read"]
CASE mail.todo_label: ["mail: key mail is not one the hub's settings file takes; it is not applied"]
CASE search.skip_folders: ["search: key search is not one the hub's settings file takes; it is not applied"]
CASE file_index.skip_folders: ["file_index: key file_index is not one the hub's settings file takes; it is not applied"]
CASE latex.main_file: ["latex: key latex is not one the hub's settings file takes; it is not applied"]
CASE latex.texdoc_path: ["latex: key latex is not one the hub's settings file takes; it is not applied"]
CASE latex.literate_recipes: ["latex: key latex is not one the hub's settings file takes; it is not applied"]
CASE latex.program_recipes: ["latex: key latex is not one the hub's settings file takes; it is not applied"]
CASE files.hidden_folders: ["files: key files is not one the hub's settings file takes; it is not applied"]
CASE git.worktrees_dir: ["git: key git is not one the hub's settings file takes; it is not applied"]
CASE deposit.default_ignore: ["deposit.default_ignore: deposit.default_ignore must be a list of texts, not 5; the default is used"]
CASE leads_run_word: ["leads_run_word: leads_run_word must be text, not [1]; the default is used"]
CASE code_dir: ["code_dir: code_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"../up\"; the default is used"]
CASE deck_dir: ["deck_dir: deck_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"/abs\"; the default is used"]
CASE linkedin_idea_prefix: ["linkedin_idea_prefix: linkedin_idea_prefix must be text, not [1]; the default is used"]
CASE secrets_dir: ["secrets_dir: secrets_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"../up\"; the default is used"]
CASE notes_dir: ["notes_dir: notes_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"/abs\"; the default is used"]
CASE slurm.cluster_folder rel: ["slurm.cluster_folder: slurm.cluster_folder must be a folder on the cluster, ~/ or / followed by folder names of letters, digits, dots, dashes, underscores and {id}, ending in no slash and with no . or .. part, not \"rel/x\"; the default is used"]
CASE merged terminal.default_agent: []
CASE merged mail.todo_label: ["mail.todo_label: mail.todo_label must be text, not [1]; the default is used"]
CASE merged search.skip_folders: ["search.skip_folders: search.skip_folders must be a list of texts, not 5; the default is used"]
CASE merged file_index.skip_folders: ["file_index.skip_folders: file_index.skip_folders must be a list of texts, not 5; the default is used"]
CASE merged latex.main_file: ["latex.main_file: latex.main_file must be the name of one file, with no folder, not \"a/b.tex\"; the default is used"]
CASE merged latex.texdoc_path: ["latex.texdoc_path: latex.texdoc_path must be text, not 5; the default is used"]
CASE merged latex.texcount_path: ["latex.texcount_path: latex.texcount_path must be text, not 5; the default is used"]
CASE merged latex.checkcites_path: ["latex.checkcites_path: latex.checkcites_path must be text, not 5; the default is used"]
CASE merged latex.clean_path: ["latex.clean_path: latex.clean_path must be text, not 5; the default is used"]
CASE merged latex.literate_recipes: ["latex.literate_recipes: latex.literate_recipes must be a map, not 5; none of its entries is read"]
CASE merged latex.program_recipes: ["latex.program_recipes.xelatex: latex.program_recipes.xelatex must be text, not 5; the entry is not read"]
CASE merged files.hidden_folders: ["files.hidden_folders: files.hidden_folders must be a list of texts, not 5; the default is used"]
CASE merged git.worktrees_dir: ["git.worktrees_dir: git.worktrees_dir must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not \"../out\"; the default is used"]
CASE update_tasks empty and repeated findings: ["update_tasks[0].task: update_tasks[0].task must be lowercase letters, digits and dashes starting with a letter, not \"\"; its row is not read","update_tasks: update_tasks holds the name scout more than once; the first is read and the others are not"]
CASE update_tasks empty and repeated offered: [{"task":"scout","hub":"a","label":"S","note":"n","view":"leads","lastRun":null,"file":"<hub>/.oculus/config.yml","at":"update_tasks[1]"}]
CASE update_tasks view/last_run/label findings: ["update_tasks[1].last_run: update_tasks[1].last_run must be one of radar, scout, linkedin, inbox, not \"foo\"; its row is not read","update_tasks[2].label: update_tasks[2].label must be text and is not set; its row is not read"]
CASE update_tasks view/last_run/label offered: [{"task":"scout","hub":"a","label":"A","note":"n","view":"nowhere","lastRun":null,"file":"<hub>/.oculus/config.yml","at":"update_tasks[0]"},{"task":"linkedin","hub":"a","label":"D","note":"n","view":"linkedin","lastRun":"linkedin","file":"<hub>/.oculus/config.yml","at":"update_tasks[3]"}]
CASE last post words: "Last post: {0}"
CASE feed_registries [leads, leads]: {"findings":["feed_registries: feed_registries holds the name leads more than once; the first is read and the others are not"],"feeds":{"leads":"a.yml","radar":"","linkedin":""},"collections":["radar","literature"]}
CASE tray follows an edit: {"before":["A:litwatch"],"after":["A:litwatch","B:scout"]}
 Test Files  2 passed (2)
      Tests  6 passed (6)
```

The final programs' sources. `keys.test.ts` writes a primary hub under `TMPDIR` whose `.oculus/config.yml` holds one refused value of each key (the 28 texts the block names, `terminal: { default_agent: nosuch }` to `notes_dir: /abs`, plus `slurm: { cluster_folder: rel/x }`) and prints `loadConfig(engineDir(), { hub }).findings` with `settingFindings({ engine, hub, from }, read.config)`; it prints `settingFindings` of oculus's merged map with each machine-level key of the `merged` lines set to the refused value shown in its name's place (`'nosuch'`, `[1]`, `5`, `'a/b.tex'`, `{ xelatex: 5 }`, `'../out'`); and `loadConfig(engineDir(), { workspace: { file, text: 'settings:\n' + text } }).findings` for the four `workspace` texts. `round1.test.ts` is the base program above on the final tree, with `offeredTasks` given `settingsOf: (dir) => loadConfig(engineDir(), { hub: dir }).config`, its findings joined by `hubRowFindings(config, 'hub')`, and the tray case reading the second hub's settings from its file at each call. Each asserts nothing. The programs, their configs, the base copy and every folder they made under `.agents/scratch` are removed (`ls -la .agents/scratch` lists only `round1-log.md` and `round2-log.md`).

Each case against the final lines:

- `show_tabs: none`: no finding, `none`; `show_tabs: 5`: the finding names the key and the value, and the shipped `multiple` stands; `appearance.ts` holds no `.catch` and no `??` for it.
- `latex.auto_clean`: acts by the key when loaded, no clean when not loaded, `foo` a finding and the default.
- `update_tasks`: one row offers that task under its label; no key offers nothing; two hubs offer each hub's own rows; the empty task and the repeated scout are findings and scout is offered once (the first row read is `update_tasks[1]`); `last_run: foo` and a missing `label` drop their rows with a finding; `view: nowhere` is offered by the server and dropped by the page with "update_tasks[0].view must name a view of oculus, not nowhere; the update task is not offered" once the page knows its views; `last_run: linkedin` reads "Last post: {0}"; an edit of a hub's `update_tasks` while the server runs reaches the tray, `["A:litwatch"]` to `["A:litwatch","B:scout"]`. On the base every task file of every hub is offered and the key is refused.
- A schedule naming a task the list lacks: `update-task-unknown` with "foo is no update task of a: the update_tasks of a lists litwatch, scout.", and "... lists none." for an empty list; the entry keeps the word the file holds.
- `feed_registries`: default `[]`; `[leads]` reads radar as a collection; `[leads, leads]` one finding and leads once; a word no feed has, a finding at its place and not read.
- `latex.main_file: paper.tex` orders `paper.tex` first; unset `main.tex` first; `''` and `a/b.tex` a finding and `main.tex`.
- `project_docs`: a row naming `manuscript/paper.tex` lists that file; no key the four rows of today; `../other/README.md`, `/etc/x.md`, `''` a finding, the row dropped, the docs route answers 404; `5` one finding.
- `terminal.default_agent: codex` opens codex; `nosuch`, `foo` and `''` a finding and claude. In a hub's settings file the key is refused as a key of the machine's settings (`terminal: key terminal is not one the hub's settings file takes`), as every appearance and behavior block that is not a hub key is.
- Format: the formatter gets `--stdin-filepath paper.tex`; no `file` answers 400 `not-an-action`.
- The HPC poll with no `timeoutMs` uses 40000.
- Every key this step adds gives, for a value its options entry refuses, a finding naming the key and the value: the hub keys through the hub's settings file, the machine keys through the readers over the merged map and through a workspace file. `slurm.cluster_folder: /abs` is a folder on the cluster and gives none.

## Read so far

Every file `find src -type f | sort` lists was read whole with the Read tool: files 1 to 1512 in round 1 (`src/app.d.ts` to the end of `src/lib/ui/`), and files 1513 to 2146 in round 2 (`src/lib/views/academic/career/Career.svelte` to `src/server.ts`), each logged as one line of `.agents/scratch/round2-log.md` (lines 72 to 700; "every number 1513-2146 present" at :696). The list now holds 2147 files (`find src -type f | wc -l`): the files this step made are among them and were written by it.

| Folder of `src` | Files now (`find src -type f`) | Read in |
| --- | --- | --- |
| `app.d.ts`, `app.html`, `hooks.server.ts` | 3 | round 1 |
| `desktop/` | 31 | round 1 |
| `lib/assets/` | 1 | round 1 |
| `lib/data/` | 235 | round 1 |
| `lib/highlight-languages.d.ts` | 1 | round 1 |
| `lib/server/` | 537 | round 1 |
| `lib/shell/` | 104 | round 1 |
| `lib/state/` | 395 | round 1 |
| `lib/themes/` | 18 | round 1 |
| `lib/ui/` | 188 | round 1 (`keys/actions.ts` made in round 2) |
| `lib/views/` | 555 | round 2 |
| `lib/write-file-atomic.d.ts`, `monaco-modules.d.ts` | 2 | round 2 |
| `routes/` | 76 | round 2 |
| `server.ts` | 1 | round 2 |

The values the round-2 read left in code, each under the ruling's words ("it's really the project config that a user might reasonably want to change. Folder or file names, Any other important settings, that sort of stuff, not random constants"), by reason; the file and line of each is in the log:

- Waits, intervals and timings: `EXPORT_HOLD_MS`, `DRAFT_REST_MS`, `HOLD_MS` (arrange), `TICK_MS` (Presenter), `POINTER_REST_MS` (fullscreen, show page), `WAIT_MS` (GitSteps), `SETTLE` (TerminalGrid), `KILL_ARM_MS`, `BELL_MS`, `LATE_GRACE_MIN` (ConnectorHead, hpc Head), the copied mark 1300 ms (ProjectCard), the 900 ms flash (Reveal), `SECOND` (AgentRows), `FORMAT_TIMEOUT_MS` (prose lsp.ts), `SEND_AFTER_MS` (AppSource), `KEEP_AFTER_MS` (Diff), `OUTLINE_WAIT_MS` and its 150 ms poll (latex-editor), `REPORT_EVERY_MS` and `SCROLLING_MS` (pdf viewer), the completion wait (Console), `KEEP_WAIT_MS` (print page), the 90 s and 5400 s units of a wait's text (literature words.ts).
- Sizes, truncation lengths and counts: `DEEPEST` (Structure), `TURN_BUDGET`, `MAX_SIZE`/`MAX_EXPAND` and `MATH_OPTIONS` (KaTeX bounds), `ROWS` (Deposit, FieldControl), `NOTE` 110 (Band), `CARD_NEXT` 130 (LaneCard, CardBrief), `LOG_LINES` (Leads), `FIND_LIMIT`, `STRIP`, `NAMES_SHOWN`, `SHOWN` (commands.ts), `PAGE` (Cards), `GROUP_READS`, the 12-character checksum (RecoverPlan), the short hash of 7 (graph-picks, Graph, Tags) and the detached head of 8 (branch-words), the session id of 8 (Usage), the snooze 7 and 30 days (rows.ts, Subtasks), which pair with the catalog's words `snooze_1w` and `snooze_1mo`.
- Layout and drawing constants: slide-layout and Slide search constants, `MIN_TITLE`/`MIN_OTHER`/`CELL_PAD`, `CUT_WIDTH`, `MIN_WIDTH`, list-width sizes, `COMPOSER_REM`, `SUBPIXEL`, `SLACK`/`TRUE_FOOT`, turn-rows height estimates, card-layout constants, CardGrid sizes, `SEARCH_MIN`/`MORE_GUESS`, graph interaction constants (click threshold, zoom bounds, `LABEL_GAP`, `DRAG_PIXEL`, `LINK_REACH`), pdf page-points and side-panel sizes, `ROOM` (HunkBar), `DEADLINE_SOON` (the amber tone of a countdown), the meter thresholds `MID`/`HIGH` (detail-facts) and 90/75 (Quota, Usage), `EDITOR_LEAST`/`EDITOR_MOST`, `CARD_SHOWN` (ProjectTree).
- Tones of oculus's palette: `'red'`, `'green'`, `'amber'`, `'violet'` in Facts, rail-part, CommandCenter, Inbox, VenueCard, and the `TONES` maps of SessionWorkspace, AgentRows, TimelineTurns.
- oculus's own formats and ids: action ids `oculus.latex.*`, `oculus.lint.*`, `oculus.*`; menu ids; `DRAG_TYPE`, `ROW_DRAG`; view ids (`REFERENCES_VIEW`, `OUTPUT_VIEW`, `DOC_VIEW`, `SESSION_VIEWS`) and the registration group `APPS_GROUP`; `DECK_FILE` `present.yml` and `APP_FILE` `app.yml` (row-menu.ts); the leads feed's field names (LeadCard); the change log's record kinds (History, history rows); `statement` (EntryFields); `USER_FIELD` `lead`; the socket channel names (`+page.svelte`); `TEXT` `text`, the folder of oculus's text catalog (Settings.svelte); `editor.languages` (Item.svelte); `CONTRIBUTED_FROM` and `DOCKS` (`routes/views.ts`); `new-idea-candidate`, the radar format's word (`state/feeds/radar.ts` `isCandidate`); `attachments/`, oculus's layout inside the configured notes folder; `~/.oculus/...` state files named in comments (session-marks, RecoverLog), oculus's own state folder.
- Facts of a tool or format: `.bib`, `.sty`, `.cls`, `.slurm`, `.pdf`, `.md` file kinds; Slurm's state words `RUNNING`, `COMPLETED`, `CANCELLED` and sinfo columns; PDF.js mode numbers and names; KaTeX limits; LSP method names; linter comment syntaxes; the agent CLI's `mcp__` tool-name format; Monaco's `navigation` group; the picture types the wall's route takes (Memories); `git init -q`; `HEAD`.
- Key bindings, which live in code (`data/helpers/keys/oculus/bindings.ts` and the views): `GRID_KEYS`, Cmd+F, Alt+F5, Alt+Z, the chords `s7` and `s9`, F4, KeyB/KeyV, `LETTERS`.
- Program lists: `CardDocs.svelte:66 READABLE`, what oculus's document view renders; `LIST_SEPARATOR`; `BROWSER_KINDS`; the agent kinds `claude`, `codex`, `shell` of the composer, which `claude_bin` and `codex_bin` start.

Changed by the round-2 read beyond the moves: `forms/accounts/AddAccount.svelte` (the default provider is `PROVIDERS_OF[kind][0]`, the first the connector offers, the same value today); the comments of `document/Document.svelte:16-20` and `server/files/files.ts:5-8` (they named two of the user's projects; now "a project's manual, for one"); `files/Files.svelte:45-47`, `server/files/fs/bookmarks.ts:1-3` and `state/sources/explorer/view/bookmark-rows.ts:1-4` (they named `bookmarks.yml` in the hub's `.oculus` folder; now the key `bookmarks` and its default); `refs/Worktrees.svelte:18-23` and `Repositories.svelte:70-72` (rewrapped); `api/(files)/ops/+server.ts:8-13` and `api/(files)/search/+server.ts:7-10` (named the marks this step added). `grep -rn` of `src` for the user's project and host names prints `rite.ts:3` (the provenance of the shipped grammar), `workspace/open.ts:8,10` and `place-names.ts:5` (format examples), all kept.

## The new keys

| Key | Where | Default | Replaces |
| --- | --- | --- | --- |
| `feed_registries` | `config/defaults/sources.yml:58` | `[]` | `hub-names.ts FEED_REGISTRIES` |
| `update_tasks` | `sources.yml:64` | `[]` | `UPDATE_TASKS`, `TASK_LABELS`, `UpdateTray.svelte NOTES`, `TASK_VIEW`, the catalog keys `app.tasks.{lit,scout,linkedin,inbox}_{label,note}` |
| `project_docs` | `sources.yml:67` | the four rows of today | `PROJECT_DOCS`, `MARKDOWN_DOCS`, `MANUSCRIPT` |
| `leads_run_word` | `sources.yml:61` | `''` | `SCOUT_RUN` |
| `code_dir` | `sources.yml:74` | `code` | `CODE_FOLDER` |
| `deck_dir` | `sources.yml:77` | `present` | `PROJECT_DECK` |
| `linkedin_idea_prefix` | `sources.yml:88` | `''` | `xx-` in feeds.ts, edit/feeds/feeds.ts, post-card.ts |
| `secrets_dir` | `sources.yml:98` | `secrets` | `private-folders.ts SECRETS_FOLDER` |
| `notes_dir` | `sources.yml:101` | `.oculus/notes` | `note-names.ts NOTES_FOLDER` |
| `latex.main_file` | `config/defaults/behavior.yml:454` | `main.tex` | `latex.ts FIRST = 'main.tex'` |
| `latex.texdoc_path`, `texcount_path`, `checkcites_path`, `clean_path` | `behavior.yml:463-466` | `''` (the program on PATH) | the program names written in `texdoc.ts`, `endpoint.ts`, `pty/latex/latex.ts`, `recipes.ts` |
| `latex.literate_recipes`, `latex.program_recipes` | `behavior.yml:477`, `:481` | today's maps | `recipes.ts LITERATE_RECIPES`, `PROGRAM_RECIPES` |
| `terminal.default_agent` | `config/defaults/appearance.yml:87` | `claude` | `?? 'claude'`, `agent: 'claude'` |
| `deposit.default_ignore` | `behavior.yml:566` | `[]` | `attic/` in deposit-tree.ts |
| `slurm.cluster_folder` | `behavior.yml:147` | `''` | `~/projects/<id>` in submit.ts |
| `slurm.unsent` | `behavior.yml:148` | `[]` | `__pycache__`, `*.npy`, `results`, `logs` in submit.ts |
| `slurm.log_dirs` | `behavior.yml:149` | `[.]` | `prewarm.ts PREWARM_RUNGS` and the log search of `hpc/actions.ts` |
| `slurm.scratch_roots` | `behavior.yml:150` | `{}` | `/local` of `hpc/scratch.ts` and of the Recover job script |
| `recover.data_dir`, `recover.partitions` | `behavior.yml:203-204` | `''`, `{}` | the `data` folder part of `recover/plan.ts`, `cluster.ts PARTITION` |
| `audit.markers`, `audit.provisional_mark`, `audit.skip_folders` | `behavior.yml:33-35` | `[]`, `''`, `[]` | `MARKERS`, `PROVISIONAL`, `attic` of `NEVER` |
| `website.schema_section` | `behavior.yml:40` | `''` | `WEBSITE_SECTION` |
| `mail.todo_label` | `behavior.yml:417` | `todo` | `plate.ts TODO_LABEL` |
| `file_index.skip_folders` | `behavior.yml:135` | today's `SKIP_DIRS` list | `project-files.ts SKIP_DIRS` |
| `files.hidden_folders` | `behavior.yml:550` | `[node_modules, __pycache__, .git]` | `fs.ts SKIPPED`, `markdown/places.ts SKIPPED` (`['node_modules']`), `apps/host/triggers.ts SKIPPED` (`'node_modules'`), `workspace.ts:272` |
| `git.worktrees_dir` | `behavior.yml:560` | `.agents/worktrees` | `helpers/worktrees.ts WORKTREES_DIR`, `IGNORE_RULE` |
| `search.skip_folders` | `behavior.yml:584` | `[node_modules, .git, .svelte-kit, .svelte-kit-app]` | `query.ts SKIP_GLOBS` |
| `sessions_roots` (machine) | `config/options/local.yml` entry | `['~']` | `sessions/group.ts defaultRoots` |
| `codex_bin` (machine) | `config/options/local.yml` entry | `codex` | the literal `'codex'` of compose and the Codex terminal |
| the `default` of every entry of `config/options/local.yml` | that file | port 8790, self `''`, clusters `[]`, sessions_roots `['~']`, claude_bin `claude`, rite_dap_bin `rite_dap`, accounts, calendars `[]`, mail `[]`, downloads `[]` | `DEFAULT_PORT` and the defaults written in `local.ts`; `localDefaults()` reads them |
| `statuses` flag `task_done` | `config/catalogs/vocab.yml`, the `done` row | `done` carries it | `focus/rows.ts` `${STATUS}done` |
| `pillar_kinds` flag `archival` | `vocab.yml`, the `offpillar` row | `offpillar` | `OFFPILLAR` |
| `radar_buckets` flags `default` and `spark` | `vocab.yml` | `adjacent` default, `idea` spark | the `adjacent` fallback and `word('bucket') === 'idea'` of RadarCard |
| `radar_relevance` | `vocab.yml:343` | high red, med amber (default), low grey | `server/edit/feeds/radar.ts RELEVANCE`, `literature.yml relevance_high/med/low` |
| `venue_ranks`, `venue_costs` | `vocab.yml:316`, `:324` | today's fragments and colours | `venues.ts quartileTone`, `freeTone` |
| `venue_biennial` | `vocab.yml:330` | `[biennial]` | the word in `isBiennial` |
| `venue_no_jif` | `vocab.yml:333` | `[none, "-"]` | `presets.ts NO_JIF`, `VenueCard.svelte ['none', ' - ']` |

Collision check, `grep -rn --exclude=local.yml -E "^ *<key>:" config/defaults config/catalogs` per key: each prints the one line in the table; `skip_folders` prints three, one in each of `audit`, `file_index` and `search`, three keys of three blocks. Each hub key is in `HUB_LIST` (now `data/shapes/hub-keys.ts`) and those a non-primary hub may set in `OWN_HUB_KEYS`. Each machine key is in `LOCAL_KEYS`.

- Empty: a word that names one hub's content takes the empty default and reads as nothing (no task, no feed, no marker, no scout run, no idea prefix, no cluster folder, no scratch folder, no partition, no data folder, no website section); `mail.todo_label: ''` reads no todo signal; an empty `latex.*_path` runs the program on PATH; `latex.main_file: ''`, `terminal.default_agent: ''`, `code_dir`, `deck_dir`, `secrets_dir`, `notes_dir` and `git.worktrees_dir` refuse the empty text and keep the default.
- Duplicate: a repeated task, project_docs name or label, feed word or flag word (two statuses carrying `task_done`, two kinds carrying `archival`, two buckets carrying `default`) is a finding; a list keeps the first, a single-use flag reads none.
- A value that reaches a path: the folder keys are held to `inner_path` (relative, no `..`, no backslash); `slurm.cluster_folder` to the new form `cluster_folder` (`~/` or `/` then folder names and `{id}`); `slurm.log_dirs` to the new form `folder_glob`; `slurm.scratch_roots` values to the new form `absolute_folder`; `recover.partitions` values to the new form `partition`; `latex.main_file` to `file_name`; a task to `TASK_NAME`.
- A value that reaches a command: `terminal.default_agent` is held to the agents catalog's keys; `claude_bin` and `codex_bin` reach the shell as one word through `shellWord`; a Gmail label outside `[A-Za-z0-9_-]` is quoted and an Outlook category doubles `'`.

## The named constants made, by file

- `src/lib/server/machine/hpc/poll.ts`: `POLL_TIMEOUT_MS = 40000`.
- `src/lib/data/helpers/run/tasks.ts:11`: `TASK_NAME = /^[a-z][a-z0-9-]*$/`.
- `src/lib/data/model/machine/model-tasks.ts:16`: `LAST_RUNS = ['radar', 'scout', 'linkedin', 'inbox']`.
- `src/lib/data/model/model-agents.ts`: `AGENT_IDS = ['claude', 'codex']`.
- `src/lib/data/sources/config/settings/hub-rows.ts`: `SOURCES = 'sources.yml'`, `FEEDS = ['leads', 'radar']`.
- `src/lib/data/helpers/search/query.ts:51`: `NOTES_SCOPE = '#notes'`, the search scope of every hub's notes.
- `src/lib/data/sources/config/local.ts`: `REQUIRED_DEFAULTS`, the machine keys whose entry must hold a default.
- `src/lib/server/machine/lsp/adapters/web/formatting.ts:24`: `ROOT = 'root'`, the key the one root is named by when its settings file is resolved.

Removed, each `grep -rnw <name> src tests config docs README.md vite.config.ts` printing nothing: `SECRETS_FOLDER`, `TODO_LABEL`, `defaultRoots`, `SKIP_GLOBS`, `SKIP_DIRS`, `BOOKMARKS_FILE`, `WORKTREES_DIR`, `IGNORE_RULE`, `WEBSITE_SECTION`, `LITERATE_RECIPES`, `PROGRAM_RECIPES`, `PREWARM_RUNGS`, `PARTITION`, `NOTES_FOLDER`, `OFFPILLAR`, `RELEVANCE`, `NO_JIF`, `DEFAULT_PORT`, `IGNORE_HEADER`, `STALE_LAG`, `VENUE_WARN`, `MANUSCRIPT`, `CODE_FOLDER`, `PROJECT_DECK`, `AUDIT_PATHS`, `SCOUT_RUN`, `MEMORIES_DIR`, `AUTOSAVE_MS`, `FALLBACK_THEME`, `NO_LOOK`, `DEFAULT_EXT`, `DEFAULT_CAP`, `MARKDOWN_DOCS`, `focusSetting`, `quartileTone`, `freeTone`, `radarBucketKeys`. The same grep for `SKIPPED`, `MARKERS`, `NEVER`, `WALLPAPER_DIR` prints only other constants of the same name: `lsp/adapters/web/config-files.ts:26 SKIPPED` (the Svelte server's own crawl for its config files), `hpc/parse.ts:190 MARKERS` (Slurm output markers), `ui/controls/editor/options.ts:173 NEVER` and `normalise-parts/retrieval.ts:42 z.NEVER`, and test constants of `watch.test.ts`, `glob-drop.test.ts` and `wallpaper.test.ts` (the last read from `config.wallpaper_dir`).

## The hub's lines

In the hub's `.oculus/config.yml`, every key this step moves into the hub with the value that keeps today's behaviour. Its existing `audit:` block takes the three audit keys. `project_docs`, `code_dir`, `deck_dir`, `secrets_dir`, `notes_dir`, `mail.todo_label` and the vocabulary words need no line: their defaults are today's values.

```yaml
update_tasks:
  - { task: litwatch, label: Lit Watch, note: "new-paper radar (web | minutes)", view: radar, last_run: radar }
  - { task: scout, label: Scout, note: "academic openings (web | minutes)", view: leads, last_run: scout }
  - { task: linkedin, label: LinkedIn, note: draft a post from _linkedin/, view: linkedin, last_run: linkedin }
  - { task: inbox, label: Inbox, note: Gmail triage over the private mailbox, view: inbox, last_run: inbox }
feed_registries: [leads, radar]
leads_run_word: scout
linkedin_idea_prefix: xx-
deposit:
  default_ignore: [attic/]
slurm:
  cluster_folder: '~/projects/{id}'
  unsent: [__pycache__, '*.npy', 'results/**', 'logs/**']
  log_dirs: [hpc/logs, logs, ., '*/logs']
  scratch_roots: { utwente: /local }
recover:
  data_dir: data
  partitions: { utwente: main-cpu }
audit:
  markers: ['%TODO', '%VERIFY', '%FIXME', TODO, FIXME, TBD, XXX]
  provisional_mark: '[PROVISIONAL]'
  skip_folders: [attic]
website:
  schema_section: Website
```

The labels and notes are the base's catalog values, the views the base's `TASK_VIEW`. `log_dirs` gives the base's rungs `hpc/logs/*`, `logs/*`, `slurm-*.out` and `*.out` in the working folder, and `*/logs/*`. The cluster key `utwente` is the hub's `slurm.resource` word; `/local` and `main-cpu` are the base's literal scratch root and partition.

In the primary hub's `.oculus/local.yml`, the machine's settings file: `sessions_roots: [~/workspace, ~/data, ~]`, the base's `defaultRoots`.

In the hub's `.oculus/data/literature/radar.yml:22`, optional: `options: [high, med, low]` may become `foreign_key: vocab.radar_relevance`, so the schema reads the words the vocabulary names.

## File list

`diff -rq` of `config`, `src` and `tests` against `../O181-base` (with `--exclude=local.yml`): 425 files changed and 20 "Only in" lines (19 new files and the new folder `tests/views/boards`, holding `focus/rows.test.ts`). `git diff --stat HEAD -- src tests config docs vite.config.ts`: `442 files changed, 11983 insertions(+), 7732 deletions(-)`, besides the 19 new files. `config/options/local.yml` is changed (the entries' defaults; the base copy lacks it, so `diff -rq` lists it only without the exclusion); `config/local.yml` was never opened.

- `config/catalogs/`: vocab.yml
- `config/defaults/`: appearance.yml, behavior.yml, sources.yml
- `config/options/`: appearance.yml, behavior.yml, local.yml, sources.yml, catalogs/vocab.yml
- `config/text/`: app.yml, findings.yml, server.yml, views/academic/latex.yml, views/boards/deposit.yml, views/boards/focus.yml, views/feeds/literature.yml, views/sessions/terminal.yml, views/sources/data.yml, views/sources/repositories.yml, views/sources/source.yml, views/sources/venues.yml, views/system/workbench.yml
- `docs/`: templates.md; diagrams/ channels, layer-data, layer-server, layer-state, layer-views, layers, writes (each `.dot` and `.svg`)
- `vite.config.ts`
- `src/desktop/`: main.ts
- `src/lib/data/helpers/`: editor/editor.ts, editor/start-theme.ts, files/paths.ts, files/private-folders.ts, finding-text.ts, guards.ts, hub-names.ts, keys/oculus/resolve.ts, run/schedules.ts, run/tasks.ts, search/glob.ts, search/query.ts, worktrees.ts
- `src/lib/data/`: index.ts
- `src/lib/data/model/`: index.ts, machine/model-hpc.ts, machine/model-machine.ts, machine/model-tasks.ts (new), model-agents.ts, model-collections.ts, model-entities.ts, model-sessions.ts
- `src/lib/data/prose/`: latex.ts, markdown/note-names.ts
- `src/lib/data/shapes/`: catalog-files/options.ts, catalog-files/vocab.ts, catalog-words.ts, hub-keys.ts
- `src/lib/data/snapshot/`: hubs/feeds.ts, normalise-parts/folder.ts, normalise.ts, references/build.ts, schema/run.ts, schema/static.ts
- `src/lib/data/sources/`: config.ts, config/catalog/options.ts, config/catalog/schemas/engine.ts, config/catalog/value-rule.ts, config/catalog/value-words.ts, config/catalogs.ts, config/editor-options.ts, config/local.ts, config/merge/hub-layer.ts, config/merge/in-place.ts, config/merge/merge.ts, config/merge/workspace-layer.ts, config/sections/focus.ts, config/sections/vocab.ts, config/settings/connectors.ts, config/settings/files.ts, config/settings/hub-rows.ts (new), config/settings/hub-slice.ts, config/settings/problems.ts, config/settings/reader.ts, config/settings/scan.ts, config/settings/writing/latex.ts, deck/read.ts, documents/decks.ts, documents/docs.ts, documents/feeds.ts, documents/folder-globs.ts, manifests.ts
- `src/lib/server/accounts/mail/`: google.ts, microsoft.ts, plate.ts, poll.ts, routes.ts
- `src/lib/server/content/`: audit/projects.ts, audit/rules.ts, audit/scan.ts, audit/setting.ts, docs.ts, images.ts, latex.ts, latex/endpoint.ts, latex/recipes.ts, latex/root.ts, latex/synctex.ts, latex/texdoc.ts
- `src/lib/server/core/`: git/state.ts
- `src/lib/server/edit/`: feeds/feed-route.ts, feeds/feeds.ts, feeds/radar.ts, writes/config/config-fit.ts, writes/config/config-place.ts, writes/manifest.ts
- `src/lib/server/files/`: files.ts, fs.ts, fs/bookmarks.ts, fs/lsp-edit.ts, fs/notes.ts, fs/ops.ts, project/project-files.ts, search/search-routes.ts, search/search.ts, workspace/folders.ts, workspace/oculus-config.ts
- `src/lib/server/git/`: clone/exclude.ts, deposit/deposit-git.ts, deposit/deposit-routes.ts, deposit/deposit-scan.ts, deposit/deposit-tree.ts, deposit/deposit.ts, deposit/zenodo-copy.ts, deposit/zenodo.ts, git-diffs.ts, git-reads.ts, git-routes.ts, git-write.ts
- `src/lib/server/machine/`: apps/host/manager.ts, apps/host/triggers.ts, apps/reach/private.ts, apps/routes/routes.ts, apps/routes/theme.ts, apps/tools/scope.ts, apps/tools/workspace/workspace.ts, hpc/actions.ts, hpc/clusters/connections.ts, hpc/poll.ts, hpc/prewarm.ts, hpc/scratch.ts, hpc/submit.ts, lsp/adapters/entry.ts, lsp/adapters/markdown/own/backticks.ts, lsp/adapters/markdown/own/wiki.ts, lsp/adapters/markdown/places.ts, lsp/adapters/markdown/requests.ts, lsp/adapters/web/formatting.ts (new), lsp/adapters/yaml/private-file.ts, lsp/held/held.ts, lsp/held/requests/configuration.ts (new), lsp/held/requests/links.ts, lsp/held/watch.ts, lsp/library/rules.ts, lsp/relay/relay-life.ts, lsp/relay/relay-make.ts, lsp/relay/relay-options.ts, lsp/relay/relay-route.ts, lsp/servers.ts, lsp/uris.ts, pty/latex/latex.ts, pty/routes.ts, pty/sessions.ts, pty/start/chat.ts, pty/start/compose.ts, runs/lint/routes.ts, runs/lint/writing/folder.ts, runs/recover/cluster.ts, runs/recover/live/watch.ts, runs/recover/local.ts, runs/recover/plan.ts, runs/recover/routes.ts, runs/schedules/file.ts, runs/schedules/routes.ts, runs/schedules/run.ts, runs/schedules/task.ts, runs/schedules/watch.ts
- `src/lib/server/root/`: context.ts, process/apps-hosts.ts, process/config-cache.ts, process/context/machine-defaults.ts, process/context/machine-values.ts, process/server-context.ts, watch/apps.ts, watch/git.ts, watch/local.ts, watch/pollers.ts, watch/portfolio/audited.ts, watch/portfolio/glob-drop.ts, watch/portfolio/glob-watch.ts, watch/portfolio/portfolio.ts, watch/portfolio/reads.ts, watch/repos/git-start.ts, watch/sessions.ts
- `src/lib/server/sessions/`: group.ts, index.ts
- `src/lib/shell/`: panes/pane-view.ts, panes/strip/strip-shape.ts, rail/ScheduleList.svelte, rail/UpdateTray.svelte, status/notices/NoticeCentre.svelte, status/StatusBar.svelte, window/appearance.svelte.ts
- `src/lib/state/boards/`: board/filter-menu.ts, board/index.ts, board/items.ts, board/presets.ts, board/state.ts, board/stats.ts, collection/index.ts, focus.ts, focus/focus-lanes.ts, structure/lines.ts, ticker.ts
- `src/lib/state/client/`: context.ts, selectors.svelte.ts, writes.svelte.ts
- `src/lib/state/feeds/`: feeds.ts, radar.ts
- `src/lib/state/life/`: note-hooks.ts, notes.ts
- `src/lib/state/sessions/`: latex/builds.ts, latex/latex-state.ts, latex/latex.svelte.ts, source/write-files.ts, terminal/composer/composer.ts, terminal/composer/opening.svelte.ts, terminal/composer/worktree.ts, terminal/latex-target.ts, terminals.svelte.ts
- `src/lib/state/shared/`: answers/answers.ts, answers/terminal-words.ts, stores/shell.ts, words/appearance.ts
- `src/lib/state/sources/`: explorer/notes/note-attach.ts, explorer/notes/note-index.ts, explorer/notes/note-press.ts, explorer/notes/note-tree.ts, explorer/view/bookmark-rows.ts, explorer/view/files-view.ts, explorer/view/place.ts, fs-transport.ts, fs.svelte.ts, registries/venues.ts, repositories/repositories.svelte.ts, repositories/worktrees.ts
- `src/lib/state/system/`: config/config-files.ts, config/editors/fields.ts, config/editors/origins.ts, config/messages.ts, config/rows.ts, config/typed.ts, machine/hpc/submit.ts, machine/lsp/edits.ts, machine/recover-words.ts, machine/refactor/note-link-plan.ts, machine/schedules/schedule-words.ts, machine/schedules/schedule.svelte.ts
- `src/lib/state/workbench/`: layout/open/float/folder-opener.ts, navigation/editor-status.svelte.ts, navigation/editor-text.ts, navigation/notice-sources.ts, navigation/notices.svelte.ts, rail-badges/rail-badges.svelte.ts, ui.svelte.ts
- `src/lib/ui/`: controls/editor/diff/DiffEditor.svelte, controls/editor/Editor.svelte, controls/editor/keys/actions.ts (new), display/icon-theme/held.svelte.ts, tabs/tab-strip.ts, theme/app-theme.ts
- `src/lib/views/academic/`: present/acts/export.ts
- `src/lib/views/boards/`: deposit/Deposit.svelte, deposit/DepositPlan.svelte, deposit/DepositZenodo.svelte, focus/CommandCenter.svelte, focus/rows.ts, project/Latex.svelte, project/Project.svelte
- `src/lib/views/feeds/`: literature/AddForm.svelte, post/Post.svelte, radar/Bucket.svelte, radar/Radar.svelte
- `src/lib/views/sessions/`: session-list/Customizations.svelte, session-list/SessionList.svelte, terminal/start/Composer.svelte, terminal/start/TerminalStart.svelte, terminal/start/worktree/WorktreeName.svelte
- `src/lib/views/shared/`: card/card.ts, card/feed/post-card.ts, card/feed/RadarCard.svelte, card/project/ProjectCard.svelte, card/record/registry/RegistryPageCard.svelte, card/record/registry/VenueCard.svelte, explorer/tree/control/picks.svelte.ts, explorer/tree/NameInput.svelte, explorer/tree/Tree.svelte, forms/accounts/AddAccount.svelte, forms/entry/card/EntryFields.svelte, prose/editor/lsp.ts, prose/editor/source-options.ts, prose/RenderedMarkdown.svelte
- `src/lib/views/sources/`: document/Document.svelte, file/File.svelte, file/pdf/viewer.svelte.ts, files/Files.svelte, files/sections/Backlinks.svelte, files/sections/notes-section.svelte.ts, files/sections/Notes.svelte, notes-graph/NotesGraph.svelte, repositories/diff/Diff.svelte, repositories/diff/DiffSection.svelte, repositories/merge/MergeSide.svelte, repositories/refs/Worktrees.svelte, repositories/repo/Repo.svelte, repositories/Repositories.svelte, source/actions/submit-job.svelte.ts, source/Editor.svelte, venues/Ribbon.svelte
- `src/lib/views/structure/`: pillars/Pillars.svelte
- `src/routes/`: +page.svelte, api/(accounts)/mail/+server.ts, api/(docs)/oculus-config/[...path]/+server.ts, api/(files)/fs/+server.ts, api/(files)/ops/+server.ts, api/(files)/search/+server.ts, api/(machine)/hpc/+server.ts, api/(machine)/lint/+server.ts, api/(machine)/recover/+server.ts, api/(machine)/schedules/+server.ts, api/(sessions)/latex/+server.ts, present/print/+page.svelte, present/show/+page.svelte
- `tests/checks/`: config/config-folder.test.ts, config/config.test.ts, config/integrity.test.ts, config/setting-findings.test.ts (new), config/templates.test.ts, tree/layer-rows.ts
- `tests/data/`: helpers/worktrees.test.ts (new), hubs/connection-keys.test.ts, hubs/deck-globs.test.ts, prose/markdown/front-matter.test.ts, real-hub.probe.ts, shapes/catalog-files/vocab.test.ts, snapshot/schema-rules.test.ts, sources/config/boards.test.ts, sources/config/layers/catalogs.test.ts, sources/config/layers/hub-vocab.test.ts, sources/config/local/local.test.ts, sources/config/local/machine.test.ts, sources/config/settings/hub-rows.test.ts (new), sources/config/settings/settings.test.ts, sources/config/settings/synthetic.ts, sources/config/settings/writing.test.ts, sources/config/wrong-settings.ts, sources/docs.test.ts, sources/feeds.test.ts, sources/manifests/manifests.test.ts, sources/present.test.ts
- `tests/fixtures/`: hubs/demo/.oculus/config.yml, hubs/workspace.ts, sessions-fixture.ts
- `tests/routes/`: apps/app-fs.test.ts, apps/app-private.test.ts, docs/audit-fixture.ts (new), docs/audit-markers.test.ts (new), docs/audit.test.ts, docs/docs.test.ts, docs/wallpaper.test.ts, edit/write-fixture.ts, files/fs.test.ts, files/project-files.test.ts, files/search.test.ts, git/zenodo.test.ts, hubs/hub-secrets.test.ts, hubs/machine-answer.test.ts, hubs/make.test.ts, machine/hpc.test.ts, machine/recover.test.ts, machine/schedules.test.ts, replace/lsp-edit.test.ts, replace/ops-replace.test.ts, replace/replace-fixture.ts, replace/writing-fix.test.ts, sessions/compose.test.ts, sessions/latex.test.ts, sessions/terminal-actions.test.ts, sessions/terminal-fixture.ts, sessions/terminal.test.ts
- `tests/server/`: accounts/mail/routes.test.ts, accounts/mail/signals.test.ts (new), desktop/app-theme-start.test.ts, edit/feeds.test.ts, edit/writes.test.ts, files/fs.test.ts, files/nested-names.test.ts, files/notes.test.ts, files/search.test.ts, files/workspace/folder-settings.test.ts, git/deposit.test.ts, git/git-scan-depth.test.ts, git/git-write.test.ts, git/refs/cherry-pick.test.ts, machine/apps/host-manager.test.ts, machine/apps/tools/workspace.test.ts, machine/apps/watch-no-primary.test.ts, machine/apps/world/hosts-fixture.ts, machine/apps/world/hosts-world.ts, machine/apps/world/language-app.ts, machine/hpc/actions.test.ts, machine/hpc/prewarm.test.ts (new), machine/hpc/submit-world.ts, machine/hpc/submit.test.ts, machine/lsp/adapters/formatting.test.ts (new), machine/lsp/adapters/markdown-created.test.ts, machine/lsp/adapters/markdown-requests.test.ts, machine/lsp/lsp-fixture.ts, machine/lsp/servers.test.ts, machine/pty/latex-recipes.test.ts (new), machine/runs/lint/lint-fixture.ts, machine/runs/recover/harness.ts, machine/runs/recover/runs.test.ts, machine/runs/recover/safety.test.ts, machine/runs/schedules/file.test.ts, machine/runs/schedules/run.test.ts, machine/runs/schedules/schedules-fixture.ts, root/context-fixture.ts, root/no-workspace.test.ts, root/process/config-cache.test.ts, root/served-roots.test.ts, root/watch/audited.test.ts (new), root/watch/glob-drop.test.ts, root/watch/settings-watch.test.ts
- `tests/state/`: boards/board/board-rules.test.ts, boards/collection-fields.test.ts (new), feeds/radar-words.test.ts (new), sources/notes-folder.test.ts (new), sources/registries/venue-words.test.ts (new), sources/workspaces-real.test.ts, system/lsp/edits.test.ts, system/schedule-lines.test.ts
- `tests/views/`: boards/focus/rows.test.ts (new)
- `.scratch/migration/agents/reviews/O181-report.md` (this report). `.scratch/migration/agents/guarded.md` differs from HEAD by the orchestrator's text (the G13 Code and Test lines), not this agent's.

## Judgment calls (each reversible)

1. `feed_registries` defaults to `[]`, by round 2 item 3's rule for a word naming one hub's content; the hub's line `feed_registries: [leads, radar]` keeps today's two feed views. A word no feed has is a finding at its own place (`feed_registries[0]: choice`) and is not read; the other words are.
2. Defaults by Decision 2 as round 2 item 3 rules them: the hub words `leads_run_word`, `linkedin_idea_prefix`, `deposit.default_ignore`, `slurm.cluster_folder`, `slurm.unsent`, `slurm.scratch_roots`, `recover.data_dir`, `recover.partitions`, `audit.markers`, `audit.provisional_mark`, `audit.skip_folders`, `website.schema_section`, `update_tasks`, `feed_registries` keep `''`, `[]` or `{}`, each with its hub line above. `code_dir: code` and `deck_dir: present` take today's value, as the brief rules for a folder of the layout oculus ships. By the same reason, as this agent's call: `secrets_dir: secrets` and `notes_dir: .oculus/notes` (folders of oculus's own hub layout), `mail.todo_label: todo` (the label oculus's mail signal has always read), `slurm.log_dirs: [.]` (the working folder, the part of the base's rungs that names no folder of one hub), `latex.main_file: main.tex`, `terminal.default_agent: claude`, the tool paths `''` and today's recipe maps (oculus's own values).
3. `FeedRegistry` became `FeedKind`; the three feed kinds stay in code as the readers oculus has.
4. `last_run` of an update task is optional (`empty: true`); a row without it shows no last-run cell.
5. A row's `view` is checked on the page (`registry.refuse('update_tasks')`), where the views are known; the server offers the row.
6. The tray keys a task's row by its label (`pairLabel`), so two hubs' rows of one task show under their own labels.
7. The inbox's notices read the first row whose `last_run` is `inbox`.
8. A registry left out of `feed_registries` is read as a collection.
9. An update task started by the tray or a schedule stays a Claude session, whatever `terminal.default_agent` says: the task files are Claude Code instructions.
10. The forms `inner_path`, `folder_glob`, `absolute_folder`, `partition` and `cluster_folder` were added for the folder and partition keys.
11. A value of a block, a family or a list of records that is not of its kind names the value: "slurm must be a map, not 5; each of its keys takes its default", "recover.partitions must be a map, not 5; none of its entries is read", "latex.tools must be a list, not \"x\"; none of its rows is read" (`setting-findings.test.ts`). A refused field of a row says "its row is not read", since the row is dropped. A `local.yml` finding names no value (`localText`'s rule: the payload reaches every page).
12. The setting readers throw on a key with no rule; tests that read them are given the shipped rules.
13. The page draws nothing that depends on a setting before the settings arrive (the look, the tab bar, the status bar, the code theme, the icon theme, a note's autosave); see the table below.
14. The composer's agent is null until chosen and shows `terminal.default_agent`.
15. The catalog words' meanings became vocabulary flags and maps in `config/catalogs/vocab.yml` by round 2 item 2: `task_done`, `archival`, the `default` and `spark` flags of `radar_buckets`, and the maps `radar_relevance`, `venue_ranks`, `venue_costs` and the lists `venue_biennial`, `venue_no_jif`, named here as the coordinator asked.
16. Two English texts moved to the catalog, outside the ruling's scope and named as the coordinator asked: `server.deposit.ignore_header` (the first line of a deposit's `.gitignore`) and `server.manifest_write.idea_next_heading` (`Next`, the heading of a new idea's README).
17. `localDefaults()` reads the `default` of each entry of `config/options/local.yml`; a required entry with no default throws at start (`REQUIRED_DEFAULTS`). The paths under `~/.oculus` keep no default there: each is oculus's own state file, owned by its module.
18. A new idea's README is the first `.md` row of `project_docs` with no folder part; a hub naming none writes no README.
19. The deposit's README check follows `project_docs`: the `.md` rows inside the code folder.
20. `vite.config.ts` (outside the brief's write list) reads `worktreesDir(loadConfig(engineDir()).config)` for the dev server's watch ignore, so `WORKTREES_DIR` could go; `config/options/local.yml` was widened into by round 2 item 2.
21. `heldIndent` (`lsp/adapters/web/formatting.ts`) is the relay's `indent` option over the config cache and the held apps; `formattingOptions` is its module's own function.

## Host- or user-visible changes

| What | Before | After, with the hub lines | After, without them |
| --- | --- | --- | --- |
| A finding for a wrong setting value | names the key | names the key and the value, "settings.show_tabs must be text, not 5; oculus's value stands" | the same |
| A refused field of a row of a list of records | "... the field is not read" | "... its row is not read" | the same |
| A row of a list setting that is no map | "... must be a list of maps; the entry is not read" | "... must be one map of the fields of the record, not 5; the entry is not read" | the same |
| The Update tray | the four tasks of every hub holding their files, by task then hub | the hub's rows, by hub, the primary first | none |
| A schedule or press of a task the hub does not list | started | refused, `update-task-unlisted` | refused |
| A schedule naming an unknown task | "{0} is not an update task; the tasks are {1}." | "{0} is no update task of {1}: the update_tasks of {1} lists {2}." | "... lists none." |
| A tray row with no `last_run` | (no such row) | no last-run cell | no last-run cell |
| The feed views | leads and radar | the same | no feed; both files read as collections |
| `file_index.ext: []` | the built-in list of 16 extensions | no file listed | no file listed |
| `file_index.max_per_project` 0 or a fraction | 400, no finding | a finding, 400 | the same |
| The format request with no `file` | formatted as `main.tex` | 400 `not-an-action` (no caller sends one) | the same |
| Audit, open markers | the seven markers | the same; `%TODO2`, `%TODOS` still count | no marker finding |
| Audit, provisional results | `[PROVISIONAL]` | the same | no finding |
| Watcher, left-out folders | `code`, `attic` | the same | `code` only |
| LinkedIn view | `xx-` files are ideas | the same | no idea listed; a new idea refused with "The hub's linkedin_idea_prefix is empty, so no file can be an idea." |
| Scout last run | the newest log line holding `scout` | the same | none |
| LaTeX tab of a hub naming no `.tex` in `project_docs` | `manuscript/` | the TEX row's folder | refused, `latex.refused_no_manuscript` |
| HPC submit of a project with no `paths.cluster` | `~/projects/<id>` | the same | refused, `source.submit_no_cluster_folder` |
| HPC submit, `slurm.cluster_folder: 5` | (no key) | a finding naming key and value, and Submit's refusal | the same |
| Submit's scratch warning | for a script not working under `/local/$SLURM_JOB_ID` | the same | no warning |
| HPC log search and prewarm | `hpc/logs/*`, `logs/*`, `slurm-*.out`, `*.out`, `*/logs/*` | the same folders | the working folder only |
| Recover | datasets under `data/`, jobs under `/local`, partition `main-cpu` | the same | every dataset refused (place), every Verify and Unpack refused (`noscratch`), no partition line |
| Deposit's generated `.gitignore` | adds `attic/`; header with a spaced hyphen | adds `attic/`; header "# Generated, cached and dead-end files, which are not part of this deposit." | adds nothing; the same header |
| The deposit's README check | `code/README.md` | the `.md` rows of `project_docs` inside the code folder | a hub with no such row asks for no README |
| A new idea's README | `README.md` | the first `.md` row of `project_docs` with no folder, heading `Next` from the catalog | none when no row is |
| Website fields of a card | the `Website` section left out | the same | no section left out |
| Venue card, JIF | `none` and ` - ` read as no JIF | `none` and `-`, trimmed, case ignored, as the project card's venue line | the same (vocabulary default) |
| Venue card, concentration mark | at 2 live projects | at `focus.venue_conc_warn` (4 shipped) | the same |
| Focus row's kept status button | `done` | the status carrying `task_done` in the entry's own hub | `done` (vocabulary default) |
| Radar, relevance and buckets | `high`, `med`, `low` and `adjacent` in code | the vocabulary's words | the same (vocabulary defaults) |
| Session list, a session outside a repository | filed under `~/workspace`, `~/data` or `~` | the same with the local.yml line | filed one level below `~` |
| Claude and Codex terminals, resume, fork, composer | `claude` and `codex` on PATH | the machine's `claude_bin` and `codex_bin` | the same (defaults `claude`, `codex`) |
| Mail todo signal | the `todo` label | `mail.todo_label`; a Gmail label with other characters quoted, an Outlook `'` doubled | the same (default `todo`) |
| Markdown server's file list and apps' `workspaceContains` | skip `node_modules` | skip `files.hidden_folders`: `node_modules`, `__pycache__`, `.git` | the same |
| Files tree, search, file index, worktrees, notes, secrets | the literals | the keys, today's defaults | the same |
| TypeScript server's own edits (an added import, a code action) | 4 spaces | the indentation the editor's options give the file's language and root | the same |
| A change of `editor.*`, of a root's `.oculus/settings.yml` or of an app's defaults that changes that indentation | reached the TypeScript server never | the server starts again with its documents | the same |
| The status bar, the strip, the pane's top row, the look before the settings arrive | drawn by invented defaults | not drawn until the settings arrive | the same |
| An app icon theme before the settings arrive (`held.svelte.ts`) | drawn as the dark variant (`dark: true`) | no file icon until the theme is known (`dark: null`) | the same |
| A note's save before the settings arrive (`notes.ts`) | autosaved after 800 ms | no autosave until `notes.autosave_ms` is read | the same |
| The editors before the code theme arrives | painted with `tokens` | not painted until the code theme arrives | the same |
| A reverse SyncTeX click before the LaTeX settings load (`viewer.svelte.ts`) | answered with the built-in program | no reverse search until the settings load | the same |
| The Files tree's arrow slot (`Tree.svelte`) | drawn by the built-in default | drawn when `fileIconAtArrow` reads true | the same |
| The Diff view's published indent (`Diff.svelte`) | `DEFAULT_INDENT` | null until the editor's options are read | the same |
| `latex.main_file`, `project_docs`, `terminal.default_agent` and every new key | no keys | keys in Settings with their help | the same |

## What the brief got wrong

- Brief item 1's premise that the workspace layer's finding names the value (first run above).
- Grep 1's pattern `const NOTES` matches constants of the base and of this step that name no task word.
- Brief item 2 gives `feed_registries` the default `[]`, Decision 1 `[leads, radar]`; round 2 item 3's rule settles it as `[]`.
- The brief's case row for `update_tasks` has no `last_run`, which item 2 makes a required field.
- Round 2 item 1 names file 1513 as `src/lib/views/academic/latex/Commands.svelte`; in the list as the round read it, 1513 was `src/lib/views/academic/career/Career.svelte` and Commands.svelte was 1515. The read started at 1513 of that list and covers both.
- Round 2 item 4 names `src/lib/state/system/rail-badges.svelte.ts:269`; the file is `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts`.

## Doc text

Outside the write list; each line with its replacement.

- `docs/data-map.md:24`, the row of `.oculus/tasks/<task>.md`: "the steps of one update task, a row of the hub's `update_tasks` names it, which a Claude session follows".
- `docs/data-map.md`, "The update tray offers the task of every hub that holds its file.": "The update tray offers each row of a hub's `update_tasks` whose file the hub holds."
- `docs/HELP.md:35`: replace "the four update tasks" with "the update tasks each hub's `update_tasks` lists", and the last sentence with "The tray offers each row of a hub's `update_tasks` whose file the hub holds."
- `docs/HELP.md:124` "with a README": "with a README under the name of the first `.md` row of `project_docs` in the project folder itself (none when no row is)".
- `docs/HELP.md:158` "carries the `todo` label": "carries the label or category `mail.todo_label` names (`todo` unless you set another; empty reads no such signal)".
- `docs/HELP.md:195` "A notes folder is `.oculus/notes/` of each hub.": "A notes folder is the folder a hub's `notes_dir` names, `.oculus/notes/` unless its `config.yml` names another."
- `docs/HELP.md:200` "the `secrets` folder of every hub": "the folder of secrets of every hub (the hub's `secrets_dir`, `secrets` unless its `config.yml` names another)".
- `docs/HELP.md:228` "apart from each hub's `.oculus/notes/`;": "apart from each hub's notes folder (its `notes_dir`);".
- `docs/HELP.md:313` "in `secrets` or `~/.oculus`": "in a hub's folder of secrets or `~/.oculus`".
- `docs/HELP.md:478` and `docs/apps.md:833` "a hub's `secrets` folder": "a hub's folder of secrets (its `secrets_dir`)".
- `docs/data-map.md:29`, the row of `.oculus/notes/`: "| `.oculus/notes/`, or the folder `notes_dir` names | the notes, one Markdown file each, and `order.json`, their order in the Notes list | |".
- `docs/data-map.md:193`, after the `sessions_overrides` row: "| `sessions_roots` | the folders the Sessions view files a session outside a repository under, one level below the deepest that holds its working folder | `~` |".
- `docs/data-map.md:200`, the `claude_bin` row: "the Claude command line a Claude terminal, its resume and fork, the composer, the chat terminals, agents and update tasks start"; after it: "| `codex_bin` | the Codex command line a Codex terminal, its resume and fork and the composer start | `codex` on PATH |".
- `docs/HELP.md:132` ("The FILES block lists the files of the extensions in `file_index.ext`, newest first, at most `file_index.max_per_project`.") stays true; `file_index.skip_folders` could be named beside it.

# Repair round 1

Round 1 built, on the tree as it stands: `manuscriptFolder(docs)` (`data/prose/latex.ts`), the folder of the first `.tex` row of `project_docs`, refusing `'no-manuscript'` for a hub naming none; `code_dir` and `deck_dir` read by the deposit, the HPC submit, the manifests, the deck reader, the decks' schema, the watcher and the audit; `deposit.default_ignore`, the deposit's README from `project_docs`, `slurm.cluster_folder`, `slurm.unsent`; the three audit keys, read by `auditRules` and by the watcher's scope (`watchScope`, `audited.ts`); `linkedin_idea_prefix` and `leads_run_word`; `PortfolioConfig` carrying the hub's layout so no snapshot module imports `data/sources`; the `config.yml` template in `docs/templates.md` for each key. Every item round 1 handed back is built in round 2, below. The verify list ran three times in round 1 and five times in round 0, as the earlier reports said.

# Repair round 2

## Item 1, the read

Files 1513 to 2146 read whole with Read, one log line each (`.agents/scratch/round2-log.md:72-700`). Check: "Read so far" above; the log's numbers 1513-2146 are all present (:696). The values it moved are under item 2; the values it kept are listed above with their reasons.

## Item 2, the moves

Each key of the table above marked as replacing a round-2 name, with its readers: `secrets_dir` (`HubLayout.secretsDir`, `ServerContext.secretsDir`, the marks of the apps routes, the apps watch, the apps hosts, search, lint, ops, fs, the LSP library rules, the private YAML file rule); `mail.todo_label` (`plate.ts signalsOf`, the Gmail query, the Outlook filter, the poll); `sessions_roots` (`group.ts` `readRoots(roots)`, `context.ts startSessions`); `search.skip_folders`, `files.hidden_folders`, `file_index.skip_folders` (every listing, search, markdown file list, app trigger and lint walk); `bookmarksFile(merged)` (`schema/run.ts`) reading the `bookmarks` key; `claude_bin` and the new `codex_bin` for a plain terminal, a resume and a fork (`pty/sessions.ts agentPrograms`, `commandFor`, `resumeArgs`, `routes.ts`, `compose.ts`); `git.worktrees_dir` (every worktree rule, the git watch, git write, diffs and reads, the client's planned path and the composer); `slurm.log_dirs`, `slurm.scratch_roots`, `recover.data_dir`, `recover.partitions`; `website.schema_section`; the LaTeX recipe maps and tool paths; `notes_dir` (the notes folder of the server, the search, the markdown server, the LSP watch, the page's notes tree and index); the local defaults from `config/options/local.yml`; the vocabulary flags and maps. Checks: the related test files of each move, recorded in the log (for example "69 files 1211 passed" for the scratch and Recover keys, "116 files reached by the change: 113 passed, the 11 known config-key.test rows red" for `notes_dir`); svelte-check 0 errors after each; the final case run above; the base run of the step's tests below.

The TypeScript server's indentation (`formattingOptions` answered by `heldIndent`): the server keeps each document's answer for as long as it runs (read in `node_modules/typescript-language-server/lib/cli.mjs`, `FileConfigurationManager.formatOptionsCache`), so `held/requests/configuration.ts` keeps the answers by section and language and `settingsChange` asks for a start again when one would differ. The relay hears the change after a build of the merged configuration (`context.ts`), after a write in a served root's own `.oculus/settings.yml` (`watch/git.ts` `settingsWritten`, passed by `git-start.ts`) and after a read of the apps (`apps-hosts.ts` `appsRead`). Tests: `formatting.test.ts` (four rows, G13), `settings-watch.test.ts` row (G109): passes; on the base `expected +0 to be 1`. Not covered by a test: the two `context.ts` calls that pass `() => relay.settingsChanged()` to `startGit` and to `startHosts`.

## Item 3, every key a whole key

Findings: every new key's refused value is a finding naming the key and the value (the final case run); every reader of a new key is called with its problems list (`PROBLEM_READERS` for the primary, `hubRowFindings` for another hub); `slurm.cluster_folder: 5` gives a finding and Submit's refusal (`submit.test.ts` row (G13)). Defaults: as judgment call 2. Help: `code_dir`'s help in `config/options/sources.yml`, its comment in `config/defaults/sources.yml` and in `docs/templates.md` say the audit reads only the documents `project_docs` names inside the code folder and the files `audit:` requires there, and that a change inside the folder rebuilds nothing else. Check: `tests/checks/config/templates.test.ts` and `config-folder.test.ts` in the checks run above.

## Item 4, the fallbacks

Removed: `presets.ts setting()` and its callers, `feeds.ts setting()` (`linkedin_cadence_days`), `STALE_LAG` with `selectors.svelte.ts` (`focus.stale_lag_days`), `VENUE_WARN` with `ticker.ts` (`focus.venue_conc_warn`), `venues.ts` `live.length >= 2` (`focus.venue_conc_warn`), the `code_theme` literal of `appearance.ts` (the entry's default), `rail-badges.svelte.ts:269`. The reader is `focusNumber(config, key)` (`data/sources/config/sections/focus.ts`), null without the catalog. Checks: `theme-groups.test.ts` 24 passed, `boundaries.test.ts` 11 passed (log).

## Item 5, the marker pattern

`markerPattern` (`server/content/audit/rules.ts`) bounds a marker as a whole word only at an end that is a letter or digit; `%TODO2` and `%TODOS` count as on the base. Test: `tests/routes/docs/audit-markers.test.ts` row '%TODO2 and %TODOS (G125)'.

## Item 6, reads of a hub's settings

`configCache.hub(dir)` answers the primary hub's folder with the primary's held read; test row "answers the primary hub's folder ... (G61)" in `config-cache.test.ts`. The chat instruction reads "README.md, code/README.md, manuscript/ and code/" under the shipped defaults (`terminal-actions.test.ts:606`, `.replace('{3}', 'README.md, code/README.md, manuscript/ and code/')`).

## Item 7, comments

Rewrapped at 100 columns, widths after: `tests/checks/tree/layer-rows.ts:26-56` 96 98 98 98 96 96 99 96 98 96 92 94 99 96 97 84 92 95 95 94 94 94 94 88 92 90 94 53 95 100 93, then :53-79 refilled whole; `DepositZenodo.svelte:1-13` 18 98 98 92 96 86 97 97 90 99 68; `vite.config.ts` comment 97 98 99 98 25. Every comment line over 100 columns in the changed files was fixed, apart from eslint-disable directives (`git.ts:588`, `opening.svelte.ts:131,224`, `terminals.svelte.ts:666`, `editor-status.svelte.ts:308`), which cannot wrap; the checks run above (`tests/checks/source`) passes. The names grep: every removed name, `grep -rnw` over `src tests config docs README.md vite.config.ts`, prints nothing (list above). The history-word grep over added comment lines and test titles: every hit ("before", "no longer", "still") is in its run-time sense, none names an earlier state of the code. The head and doc comments of the touched functions, each marked "still true" or "rewritten", 39 batches in `.agents/scratch/round2-log.md:715-758`; those found false and rewritten include `servers.ts` and `formatting.ts` (the TypeScript server keeps its answer for its life, not until the document closes), `LocalConfig.claudeBin`, `microsoft.ts` and `plate.ts` (the todo label), `projectScope`, `addLinkedinIdea`, `theme.ts requestStart`, `poll.ts settingsOf`, `glob.ts` head, `pty/routes.ts` head, `latex-state.ts bodyShape`, `codeThemeDefault`, the heads of `api/oculus-config`, `api/hpc`, `api/recover`, `api/schedules`, `api/latex`, and `relay-life.ts` head and `settingsChanged` (the three triggers).

## Item 8, proofs and cases

Round 1 item 5: the rows of 'the update tasks the page offers' on the base: `TypeError: store.viewsAre is not a function` (two rows) and `TypeError: store.unviewed is not a function`; after: the three rows pass (`schedule-lines.test.ts`).

Round 1 item 6: both case programs and outputs above.

Round 1 item 7, the failing line on the unchanged tree of each added or changed row. The step's test files, as HEAD copies, run on the base copy (`tests-on-base.config.ts`, runs bh4822rlj and beem2jw14, identical): `Test Files  58 failed | 31 passed (89)`, `Tests  114 failed | 1083 passed | 9 skipped (1206)`. 21 suites did not load on the base, each importing `settings/hub-rows.ts` or `adapters/web/formatting.ts`, modules this step adds (`Error: Cannot find module .../hub-rows.ts`): deck-globs, docs, feeds, present, audit-markers, audit, routes fs, hub-secrets, hpc route, compose, terminal-actions, terminal, schedules run, latex route, servers, config-cache, audited, hub-rows, formatting, markdown-created, markdown-requests. The rows that failed on the base, each with its first failing line (`...` shortens a value the output shortens):

- config-folder: expected keys `[ 'agents', 'app_theme', ...(114) ] to deeply equal [ ...(128) ]`; flags `to have a length of 36 but got 35`; own keys `[ 'apps_dir', 'bookmarks', ...(12) ] to deeply equal [ ...(21) ]`.
- config.test (now setting-findings.test): `[ 'calendar.days_ahead', ...(75) ] to deeply equal [ ...(85) ]`; the row "names the value of a block, a family and a list of records ... (G13)": `expected [ ...(11) ] to deeply equal ArrayContaining{...}`.
- templates: `TypeError: hubKeys is not a function`.
- worktrees.test: `expected '/repo/.agents/worktrees/one' to be '/repo/kept/trees/one'`; `TypeError: ignoreRule is not a function`.
- connection-keys: two `failureRows` rows `to strictly equal` (the kind `list`/`record` and the value); scratch folders `expected undefined to strictly equal Map{ 'a' => '/local' }`; Recover places `TypeError: read is not a function`.
- schema-rules bookmarks row: `[ {...}, {...}, {...} ] to deeply equal [ {...}, {...}, undefined ]`.
- project-files walk, writing-fix, workspace findFiles: `[ 'a.md', 'vendor/v.md' ] to deeply equal [ 'a.md', 'node_modules/...' ]`.
- lsp-edit notes_dir row: `{ ok: false, error: 'outside', ... } to deeply equal { ok: true, ... }`.
- edit/feeds: `text key not in config: server.feeds.idea_needs_prefix`; `TypeError: radarWords is not a function`; `TypeError: buckets.includes is not a function`.
- writes.test README row: `[ [...], [...] ] to deeply equal [ [...], ...(1) ]`.
- server fs.test hidden folders: `[ 'node_modules', 'vendor', ...(2) ] to deeply equal [ 'node_modules', 'a.txt' ]`.
- notes.test: `to match object { Object (root, folder, ...) }`; `TypeError: The "path" argument must be of type string`.
- server search.test: skip folders `[ ...(2) ] to deeply equal [ ...(2) ]`; dot-folder notes `[ [ '.' ] ] to deeply equal [ [ '.', './.lab/notes' ] ]`; every root's notes `[] to deeply equal [ ...(2) ]`.
- deposit.test header: `'# Generated, cached, and dead-end fil...' to be 'undefined\nresults/...'`.
- git-write: `TypeError: roots.some is not a function` (two rows).
- collection-fields: `[ [ 'summary', 'site_blurb' ], ...(3) ] to deeply equal [ [ 'summary' ], ...(3) ]`.
- radar-words: `defaultBucket`, `sparks`, `relevanceWords` `is not a function`.
- notes-folder: `'.oculus/notes/[object Object]' to be 'journal'`; `{ into: '.oculus/notes', name: 'A.md' } to deeply equal {...}`; `TypeError: rootNotes is not a function`.
- schedule-lines: as round 1 item 5 above.
- vocab.test: archival and default `[] to deeply equal [ ...(2) ]`; `TypeError: tickedStatus is not a function`.
- boards.test: three finding rows `[ [ ...(3) ] ] to deeply equal [ [ ...(3) ] ]` (the value in the text); catalogs.test, hub-vocab.test (two): `[ Array(1) ] to deeply equal [ Array(1) ]` (the same).
- signals.test: Gmail `[ Array(1) ] to deeply equal [ Array(1) ]`; Outlook `to deeply equal [ StringContaining{...} ]`; empty label `[ false, true, false ] to deeply equal [ false, false ]`.
- host-manager: `[ 1, 1 ] to deeply equal [ +0, 1 ]`.
- hpc actions: `'' to be '/work/one/logs/run-9.out'`; `TypeError: logRungs is not a function`; prewarm: `TypeError: logRungs is not a function`.
- submit.test: cluster_folder 5 `{ status: 'ok', ... } to deeply equal { status: 'refused', ... }`; the scratch rule rows `{ named: ..., unread: [] } to deeply equal { root: '/local', ... }` (12 rows); scratch_roots `{ root: '/scratch.d/jobs', ... }`.
- latex-recipes: `[ 'my latexmk', ... ] to deeply equal [ 'my Compile Rnw files', ... ]`; `'latexmk' to be '/opt/tex/latexmk'`.
- venue-words: `venueTone`, `noJif`, `archivalKind` `is not a function`; biennial `[ [ 'odd', true ], [ 'every', false ] ] to deeply equal [ [ 'odd', true ], [ 'every', true ] ]`.
- rows.test: `'status:done' to be 'status:closed'`; `'status:done' to be undefined`.
- local.test: `expected 8790 to be undefined`; sessions_roots `undefined to deeply equal [ '~/work', ...(2) ]`.
- settings.test (23 rows): slurm, search and mail rows `{ value: {...(5)} } to strictly equal { value: {...(7)} }` (the new fields); `hiddenFolders`, `websiteSection`, `fileIndexSettings` rows `expected { Object (threw) }` (no reader on the base).
- writing.test (11 rows): `{ value: { recipes: [], ...(15) } } to strictly equal { ...(22) }` (the new fields), and the literate and program recipe row.
- safety.test: `undefined to be '<home>/sets/eeg/mitdb'`; the job script `to include 'WORK=/scratch/jobs/$SLURM_JOB_ID'`.
- settings-watch.test row (G109), run on the base copy alone: `expected +0 to be 1`.

The 17 changed files among the 21 that do not load on the base, run as their HEAD copies on the base: 205 rows pass (log :761), so the rows they keep held on the base.

The edits of existing assertions, one row per changed line (`git diff -U0 HEAD -- tests`, read whole):

| File:line | Before | After |
| --- | --- | --- |
| config-folder.test.ts:254 | `radar_buckets` | `venue_ranks`, `venue_costs`, `venue_biennial`, `venue_no_jif`, `radar_buckets`, `radar_relevance` |
| config-folder.test.ts:743 | comment, 7 status flags | 8 |
| config-folder.test.ts:746 | `35` | `36` |
| setting-findings.test.ts (12 lines, moved from config.test.ts) | "... ; the default is used" | "..., not <value>; the default is used" |
| connection-keys.test.ts:105-106 | `records`, `family` | `record`, `list` |
| boards.test.ts:330 | the finding text | "..., not 3" |
| boards.test.ts:387-388 | `NOT_A_LIST` | `notAList(value)` |
| catalogs.test.ts:92 | the finding text | `not ["a"]` |
| hub-vocab.test.ts:367, :429 | the finding texts | `not 3`, `not ["a","b"]` |
| local.test.ts:117, machine.test.ts:64, machine-answer.test.ts:61, no-workspace.test.ts:53 | `DEFAULT_PORT` | `localDefaults().port` |
| settings.test.ts:46-47 | `BLOCK`, `DEFAULT` without `log_dirs` | with `log_dirs` |
| settings.test.ts:133, :137 | `skipFolders` absent | `['vendor']` |
| settings.test.ts:192, :196, :200 | `todoLabel` absent | `'later'` |
| writing.test.ts:31 | no `mainFile` | `mainFile` |
| writing.test.ts:153, :184, :195, :198 | `rows`, `records`, `family`, a list | `row`, `record`, `list` (title gains `(G13)`) |
| docs.test.ts:43, :49 | title; `projectDocs()` | title; `projectDocList(CONFIG)` |
| schema-rules.test.ts `LOADED` | the engine config | with `feed_registries` |
| manifests.test.ts:703 | no `feed_registries` | `feed_registries: [leads, radar]` |
| hub-secrets.test.ts:105-107 | no secrets column | the `secrets` column |
| git-write.test.ts:230, :235 | title; `endsWith` | title `(G13)`; `toBe(`${repo}/kept/trees/${name}`)` |
| cherry-pick.test.ts:40 | the worktrees folder | `'trees'` |
| compose.test.ts:163, :173 | title; `'claude'` | title `(G13)`; `BIN` |
| run.test.ts:86 | title | title `(G46)` row of `update-task-unlisted` |
| submit.test.ts:381 | no root | `root: '/local'` |
| markdown-requests.test.ts:321 | `match(relative)` | `match(relative, '.oculus/notes')` |
| served-roots.test.ts:124 | the roots | with `notes` shown |
| glob-drop.test.ts:160, :268 | built-in left-out folders | `NEVER` passed in |
| terminal-actions.test.ts:86, :125 | `CHAT_CONFIG` | `TASK_CONFIG` |
| terminal-actions.test.ts:606 | the folder list | `.replace('{3}', 'README.md, code/README.md, manuscript/ and code/')` |
| server edit/feeds.test.ts:659, :682 | `BUCKETS` | `VOCAB` `RadarWords` |
| app-theme-start.test.ts:416-420 | `options` | the settings lines |
| schedules.test.ts:73 | no settings | `settingsOf` |

Round 1 item 8, named with before and after: `mains()` of `server/content/latex.ts` removed (its callers read `mainsIn`); a no-list value's kind, `family` to `list` and `records` to `record`; findings name the refused value; `last_run` optional (`empty: true`). Each is in the tables above.

Round 2 item 8, titles: each added row carries its entry (see the open questions at the top).

## Item 9, the visible changes

The table "Host- or user-visible changes" above, with the rows this item names: the icon theme, a note's save, the editors' paint, the reverse SyncTeX click, the Files tree's arrow slot, the Diff view's indent, the deposit's README check, and the rows of items 1 to 6.

## Item 10, the report

This report, every section stating the tree after round 2; ASCII (last section).

## Process notes

- Run counts: the verify list ran once in round 2, red; by Axel's ruling (b) the targeted runs above replaced a second run. No whole-suite command ran in round 2. The step's test files ran twice on the base copy (bh4822rlj, then beem2jw14 after linking `node_modules`), with identical results. The related test files of each move ran while building, as the log records; the checks folders ran together several times (`tests/checks/source tests/checks/tree tests/checks/imports tests/checks/config`).
- Reads against the read-with-Read rule: two `sed -n` reads (`schedules/task.ts:40-58`, and `node_modules/typescript-language-server/lib/cli.mjs:25530-25545`), one `sed -n '1,11p'` and one `grep -B` read in the comment pass, one `cat` of `utils/unused-exports.sh`, and one `awk` filter of `git diff -U0 HEAD -- tests` for the assertion table (its output read whole). The base cases' output above was recovered from this agent's session transcript with `sed` and `awk` after two reruns of the base program hung with no CPU use and were stopped; the run it quotes is the 21:04 run of the same command.
- Files written by a shell redirect: `diffrq.txt`, `unused-now.txt`, `filelist.md` and the removed-names list, in the session scratchpad, each removed after reading. No file of the diff was written by a redirect.
- One `sed -i '' ... /dev/null` was typed and failed on `/dev/null`; no file changed. `npx prettier --write` ran once, on `tests/server/accounts/mail/signals.test.ts`.
- Seven general-purpose subagents were started to read slices of item 1 and were stopped by the coordinator (`a802b41aa656664d4`, `a34061cfc38c11e85`, `a0388f7132edeb110`, `af39a53bfe9d95cf1`, `a8be75c1b8b2dd161`, `a92a04214eafa119b`, `a4239c771b5ffb05b`); nothing they returned is used, and item 1 was read by this agent with Read.
- The base copy linked the main checkout's `docs` and the worktree's `node_modules` by symlink, and held HEAD's `config/options/local.yml` written with Write; the copy is removed and the main checkout's `docs` is unchanged (`git status --porcelain -- docs` in the main checkout prints nothing).
- Widened beyond the brief's write list: `vite.config.ts` (judgment call 20), `config/options/local.yml` (round 2 item 2), `src/lib/server/root/watch/git.ts`, `watch/repos/git-start.ts`, `process/apps-hosts.ts` and `relay-life.ts` (the TypeScript server hearing a root's settings file and the apps read), `tests/server/root/watch/settings-watch.test.ts`, and `tests/checks/config/setting-findings.test.ts` (the size rule).
- Size rule (spec.md:48): `context.ts` 878 lines, `held.ts` 873, `git-write.ts` 879, `config.test.ts` 717 after the split; `Editor.svelte` 513 (the action effect moved to `keys/actions.ts`), `Tree.svelte` 515 (the naming row moved to `NameInput.svelte`); `hub-names.ts` split into `data/shapes/hub-keys.ts`; `audit.test.ts` split into `audit-fixture.ts` and `audit-markers.test.ts`.

## ASCII check of this report

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O181-report.md` prints nothing.
