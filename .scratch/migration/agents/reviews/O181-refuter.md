# Step O181 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O181, base 1a5794ae8)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from the worktree root; regenerated the seven .dot/.svg pairs the step already changes)
$ env -u TMPDIR npm run test:quick -- --base 1a5794ae8
  (agents/spec.md names no output filter; the log was kept whole and these lines are quoted from it)
test:quick: 135 changed file(s), from git since 1a5794ae8
test:quick: 379 test file(s)
ok      ASCII gate (1.1 s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.9 s)
ok      eslint (3.3 s)
ok      svelte-check (12.8 s): 1794307789733 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (248.9 s): Duration  231.07s (transform 109.11s, setup 0ms, import 270.39s, tests 505.76s, environment 7ms)
FAILED  vitest (326.8 s)
      Tests  7 failed | 3960 passed | 953 skipped (4920)
FAILED  vitest slow (538.5 s)
      Tests  12 failed | 941 passed | 366 skipped (1319)
test:quick: 541.5 s; failed: vitest, vitest slow
  Red rows, every one in a file the step does not change (none is in `git diff 1a5794ae8 --name-only`):
  - "Test timed out in 5000ms": tests/server/edit/app-store.test.ts, tests/routes/git/zenodo.test.ts (2), tests/routes/hubs/make.test.ts, tests/data/sources/config/rail.test.ts, tests/server/machine/debug/session.test.ts, tests/server/machine/apps/manifest/manifest-tools.test.ts
  - "Test timed out in 20000ms": tests/data/hubs/hub-portfolio.test.ts
  - tests/server/edit/config-key.test.ts, the 11 rows of 'a write that names a hub', "AssertionError: expected true to be false": the known /tmp/x red (`ls -ld /tmp/x`: `-rw-r--r--@ 1 axelfaes  wheel  6282 Nov  9 20:14 /tmp/x`); the step does not change that file; /tmp/x was not touched.
$ env -u TMPDIR npx vitest run <the six timed-out unit files> --reporter=dot
      Tests  127 passed (127)
$ env -u TMPDIR npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --reporter=dot
      Tests  16 passed (16)
$ env -u TMPDIR npx vitest run tests/routes/sessions/latex.test.ts tests/data/sources/config/settings/hub-rows.test.ts tests/server/machine/runs/schedules/run.test.ts tests/data/sources/config/settings/settings.test.ts --reporter=dot
      Tests  100 passed (100)

$ sh utils/unused-exports.sh  > scratch; diff ../O181-base/unused-exports.txt scratch
33c33  docs.ts: MARKDOWN_DOCS dropped from the list
35c35  latex.ts: mains dropped
65c65  project-files.ts: fileIndex dropped
293c293 agents.svelte.ts: AgentId dropped
(no line added; 335 lines each)

$ grep -rn -E "UPDATE_TASKS|FEED_REGISTRIES|TASK_LABELS|TASK_VIEW|PROJECT_DOCS|const NOTES|FIRST = 'main\.tex'|agent: 'claude'|\.catch\('(multiple|strip)'\)|\?\? *'(multiple|strip|never|claude|main\.tex)'" src
src/lib/state/sources/fs.svelte.ts:137:const NOTES = ['fs', 'notes'];
src/lib/data/prose/markdown/note-names.ts:18:export const NOTES_FOLDER = '.oculus/notes';
  (both present unchanged in ../O181-base/src; neither is a task word)
$ grep -n -E "\?\? *40_?000" src/lib/server/machine/hpc/poll.ts
  (prints nothing)

$ ASCII gate of agents/spec.md (the perl form) over the 128 changed and new files, .svg left out
  (prints nothing)

Commands the builder's report quotes, rerun:
$ find src -type f | wc -l                                   -> 2144 (matches)
$ grep -rn -E "const NOTES" ../O181-base/src                 -> UpdateTray.svelte:66, fs.svelte.ts:137, note-names.ts:18 (matches)
$ grep -n -E '(lit|scout|linkedin|inbox)_(label|note)' ../O181-base/config/text/app.yml -> 304-309, 319-320, values equal the report's hub lines (matches)
$ grep -rn --exclude=local.yml -E "^ *<key>:" config/defaults, per key -> one line each: sources.yml:58, :61, :64, behavior.yml:435, appearance.yml:87 (matches)
$ ls /Users/axelfaes/workspace/oculus/.agents                 -> plan.yaml worktrees (matches)
$ ls .agents (worktree)                                       -> plan.yaml (the scratch folder is gone)
$ diff -rq ../O181-base/{config,src,tests} {config,src,tests} -> 12 (plus "Only in config/options: local.yml"), 84, 23; with the 15 docs paths, 134 (matches)
The case program `.agents/scratch/tests/cases.test.ts` and its config: removed and its source not quoted; not rerunnable (Proof 1).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- The read ("Read every file `find src -type f | sort` lists, whole"): violated, Spec 1. The report's first line says it was not done.
- 1: violated, Spec 2 and Spec 3. The named sites hold (`appearance.ts` has no `.catch('multiple'|'strip')` and no `??` for them, `pane-view.ts:419-420`, `builds.ts:422`, `file_index`), but a fallback beside a config key remains in `File.svelte:318` and a stored invented value in `appearance.ts:166,169`, and `project_docs: 5` does not keep the shipped default.
- 2: violated, Spec 4 and Spec 5. The keys, `HUB_LIST`/`OWN_HUB_KEYS`, the `last_run` keying (`UpdateTray.svelte:802-830`, `notice-sources.ts`), the removed catalog keys, the comment and doc updates and the live follow (`watch.ts:714`) hold.
- 3: violated, Spec 1. `latex.main_file`, `project_docs` and `terminal.default_agent` hold with their options, defaults, findings and help, but the folder and file names the read would have found stay in code (`MANUSCRIPT`, `CODE_FOLDER`, `AUDIT_PATHS`, the HPC submit's `results`/`logs`).
- 4: holds. `endpoint.ts:119` `file: z.string()`, `:503` `basename(asked.file)`; `tests/routes/sessions/latex.test.ts` passes (run above), so the 403 row stays.
- 5: holds. `poll.ts:125` `const POLL_TIMEOUT_MS = 40000;`, `:333` `options.timeoutMs ?? POLL_TIMEOUT_MS`; no key added.

Cases of the brief's "Cases":

- `show_tabs: none` in `settings:`: met, by reading (`appearance.ts` `tabBarShape`, `stripShape`) and the report's run.
- `show_tabs: 5`: met; the finding names the value (`findings.yml` `settings_value` with `{2}`, `in-place.ts:222-228`), the merge keeps `multiple`, and by reading `appearance.ts` holds no `.catch` or `??` for it.
- `latex.auto_clean` loaded / not loaded / `foo`: met, by reading `builds.ts:422-426` (`deps.settings()?.autoClean`, undefined matches no rule) and the report's run.
- `update_tasks` scout row / no key / two hubs: met, by reading `task.ts:125-146` (`offeredTasks` by hub then rows) and `schedule.svelte.ts` `noTasks`, and the report's run.
- A schedule naming a task `update_tasks` lacks: met, by reading `file.ts:171-178` and `schedule-words.ts` `taskUnknown`; the entry keeps its word (`run/schedules.ts:571-575`).
- Bad rows (task empty, repeated, `../x`, `update_tasks: 5`): met, `hub-rows.test.ts` rows 'an empty task', 'a task that climbs out', 'a task an earlier row took', 'a number' (run above, passing).
- `feed_registries: []`, `[leads]`, `[foo]`/`[datasets]`/`5`: met, `hub-rows.test.ts` 'feedRegistries' rows and `data/index.ts:688-715`; with the builder's rule (Spec 4) no collection disappears.
- `latex.main_file: paper.tex` / no key: met, by reading `latex.ts` `sourcesIn(dir, first)` and `writing.test.ts`'s `mainFile: 'paper.tex'` default row.
- `project_docs` with `manuscript/paper.tex` as TEX / no key: met, `hub-rows.test.ts` 'a document of the project', 'no key', and `data/index.ts` `documents(..., merged)`.
- A task start with no agent, key `codex` / `foo`: met, by reading `opening.svelte.ts:186-187` (`at.agent ?? defaultAgent()`) and `appearance.ts` `startAgentShape`; the report's run covers the store read only.
- Format request with and without `file`: met, by reading `endpoint.ts:119,503`.
- HPC poll with no `timeoutMs`: met, by reading `poll.ts:333`.
- `latex.main_file: ''` or `a/b.tex`: met, `writing.test.ts` row `['main_file', 'a/b.tex', 'form', ...]` and the `file_name` form `^(?!\.\.?$)[^/\\]+$`, which refuses the empty text.
- `project_docs` naming `../other/README.md`, `/etc/x.md` or empty: met, `hub-rows.test.ts` rows and `server/content/docs.ts:829` (the route serves only names `markdownDocs` returns).
- `feed_registries: [leads, leads]` / `[linkedin]`: met, `hub-rows.test.ts` rows.
- `update_tasks` row with `view: nowhere`, `last_run: foo`, no `label`; `last_run: linkedin` reads "Last post": partial; the `view: nowhere` row is dropped only by the page and still runs from a schedule or a press, Spec 5. The rest holds by `hub-rows.test.ts` rows and `UpdateTray.svelte` `lastLine`.
- `terminal.default_agent: ''`: met, by the options entry (`control: choice, from: agents`) and the report's run.
- A hub's `update_tasks` edited while the server runs: met, by reading `watch.ts:714` (`reload()` on `config.yml` in the hub's `.oculus`) and the config cache's per-mtime parse; the quoted run cannot be rerun (Proof 1).

## 1. Spec

- 1. `src/lib/data/prose/latex.ts:41`: "export const MANUSCRIPT = 'manuscript';"; also `src/lib/data/sources/manifests.ts:31` "export const CODE_FOLDER = 'code';", `src/lib/server/content/audit/projects.ts:59` "export const AUDIT_PATHS: readonly string[] = ['README.md', 'code/README.md'];", `src/lib/server/machine/hpc/submit.ts:215-216` "parts[0] !== 'results' && parts[0] !== 'logs'", `src/lib/server/git/deposit/deposit-scan.ts:25` "if (!files.includes('README.md'))". What is wrong: the brief's first instruction is to read every file of `src` whole; the report says "No folder of `src` was read file by file" and its first line marks it NOT DONE, and swaps the read for greps. The read is what item 3's "every other one the read finds" rests on, and these folder and file names of the user's projects, which Axel's words name ("Folder or file names"), are left in code. The report's own "Values the sweep found and this step did not move" ends with "Whether they are is a question the full read would settle", work inside the step handed back. Failure scenario: a hub whose projects keep their LaTeX in `paper/` sets `project_docs` to `paper/main.tex`; the project card marks TEX, but the LaTeX panel, the build terminal (`pty/latex/latex.ts:201`) and `latex-state.ts:403` still look in `manuscript/` and show nothing; a project whose code folder is `src/` gets no deposit and no audit marker read. Verdict: the read violated, item 3 violated.
- 2. `src/lib/views/sources/file/File.svelte:318`: "reverse: () => latex.settings()?.reverseSynctex ?? 'ctrl_click',"; and `src/lib/state/shared/words/appearance.ts:166,169`: "let codeTheme = CODE_TOKENS;" and "let wrapping = false;". What is wrong: item 1 says a fallback that repeats a config key's value is removed whatever its kind (`config/defaults/behavior.yml:444` holds `reverse_synctex: ctrl_click`), and "A store holds no invented value before its config is installed" (`code_theme: tokens` and `wrap_tabs: false` are the defaults the two initial values repeat, in the one file the step rewrote for this rule). Failure scenario: a reader who changes the shipped default of `latex.reverse_synctex` to `double_click` still gets Cmd-click while the page's LaTeX settings are not loaded; a later change of the `code_theme` default leaves the page drawing `tokens` until the config arrives. Verdict: item 1 violated.
- 3. `src/lib/data/sources/config/settings/hub-rows.ts:123-149` (`projectDocList` through `checkedRows`, `reader.ts:143-146`): a value that is no list pushes `{ where: 'list' }` and yields no row. What is wrong: item 1 says a value of such a key that fails its rule is a finding and the shipped default stands, "so a reader needs no fallback", and G13 ("its default is used"), the entry the report puts these readers under, says the same; the report's own run shows `CASE project_docs 5: ... "rows":[]`. Failure scenario: a hub sets `project_docs: 5` by mistake; every project card of that hub loses its README, CODE, PDF and TEX marks and the docs route refuses every document, where the shipped four rows should stand with the finding. Verdict: item 1 violated.
- 4. `src/lib/data/sources/config/settings/hub-rows.ts:64-78` with `config/options/sources.yml` `feed_registries` (`control: multi, options: [leads, radar]`): a list holding any word that is no feed makes `settingReader(...).strings` refuse the whole value and read the default. What is wrong: item 2 says "A word of it that is no YAML feed oculus reads ... is a finding and is ignored"; the builder replaced that with "the whole default is read" (report, judgment 2), a substitute rule taken by its own judgment and not handed back. Failure scenario: a hub writes `feed_registries: [leads, foo]` to read radar's file as a collection; the reader gives `[leads, radar]`, so radar becomes a feed again and its collection disappears, the opposite of what the hub asked. Verdict: item 2 violated.
- 5. `src/lib/server/machine/runs/schedules/task.ts:115` "return rowsOf(open, hub).map((row) => row.task);" with `run.ts:66` and `pty/routes.ts:391` (`listed: taskNames(...)`), against `schedule.svelte.ts:519` "rows.filter((pair) => known(pair.view))". What is wrong: item 2 says a row whose `view` names no view "is a finding and is dropped"; the server keeps the row in `update_tasks`, offers it in the payload and accepts it as listed, and only the page's tray leaves it out (report, judgment 5). Failure scenario: a hub writes `view: nowhere` on its scout row; the tray hides it with a finding, but a schedule naming `scout` still starts the session at its due time, and the notice sources never post for it. Verdict: item 2 violated; case "`view: nowhere` ... the row dropped" partial.
- 6. Report, "The cases' first run" and judgment 4: the first run found two cases the brief's rules get wrong (the `show_tabs: 5` finding does not name the value, and the case row `{ task: scout, label: Scout, note: n, view: leads }` has no `last_run`, which item 2 makes a field of every row). What is wrong: the brief says "When the first run finds a case the brief's rules get wrong, the builder stops before changing any code and hands back the run and that case"; the builder went on, made `last_run` optional (`config/options/sources.yml` `empty: true`) and rewrote every finding sentence of every setting to carry the value (`findings.yml` `settings_value`, `setting_default`, `setting_entry`, `setting_field`, and the callers in `in-place.ts`, `workspace-layer.ts`, `reader.ts`, `connectors.ts`, `editor-options.ts`, `latex.ts`, `hub-layer.ts`), a change across all config findings decided without the hand-back. Failure scenario: the orchestrator reads the step as built to the brief and lands a reshaped finding vocabulary and an optional field the brief did not settle. Verdict: none separately; the deviations are reported in the report's judgments.
- 7. `src/lib/data/sources/config/settings/reader.ts:143-146` and `:139-145` (`where: 'list'` and `problem: { kind: 'record' }`), `config/text/findings.yml` `setting_list`, `setting_field_unset`, `setting_field_empty`, `setting_entry_empty`, `local_value`, and the removal of `mains()` from `src/lib/server/content/latex.ts`: changes no item asks for (the problem kinds `family` to `list` and `records` to `record` with new sentences for every list of records in behavior.yml, and a dead export removed). Failure scenario: a reader of the latex tools list who wrote a scalar now sees "must be a list; none of its rows is read" where the step's brief named no such change; the landing has to judge an unasked rename across `connection-keys.test.ts`, `writing.test.ts` and `origins.ts`. Verdict: none.
- 8. Report, "The cases' first run, on the unchanged tree": no first-run line for the cases `update_tasks` with an empty task or a repeated row, the `view: nowhere` / `last_run: foo` / no `label` rows, `last_run: linkedin`, `feed_registries: [leads, leads]` as rows read, and the live edit of `update_tasks`. What is wrong: the brief's "Cases" paragraph requires the first run of every case on the unchanged tree with each result noted. Failure scenario: the orchestrator cannot tell from the report how those cases behaved before the step, so a regression or an already-holding case cannot be told apart. Verdict: none.
- 9. `tests/data/sources/config/settings/hub-rows.test.ts` (31 rows) and the 'fileIndexSettings' describe in `settings.test.ts`: neither is named by `agents/guarded.md` (G13's Test line names `settings.test.ts` "one case per setting reader" and not `hub-rows.test.ts`), and the page-side reader `unviewed()` (`schedule.svelte.ts:522-532`) falls under no entry. What is wrong: the rules file's test rule says a test exists only as the test of an entry that names it by file and title, and that a step needing a new entry stops and asks; the report asks the orchestrator to extend G13 and leaves `unviewed()` untested with the question unbooked by the builder. Failure scenario: the landing books a test file no entry names, or the page reader that drops tray rows lands with no test and no ruling. Verdict: none.

## 2. Proof

- 1. Report, "The cases' first run" and "The cases on the changed tree": "Command: `S=$PWD/.agents/scratch; ... npx vitest run --config .agents/scratch/vitest.config.ts ...`". What is wrong: the rules file allows a case-run program only when "its source and its output [are] quoted in the report, so the reviewer can run it again"; the source is not quoted and `.agents/scratch` is gone (`ls .agents` prints `plan.yaml`), so none of the 47 changed-tree case lines and none of the first-run lines can be rerun; the cases' met verdicts above rest on reading where the run cannot be checked. Failure scenario: a case line such as "CASE tray follows an edit: {"before":[],"after":["B:scout"]}" is taken as proof at landing although no one can reproduce the program that printed it. Verdict: none (the cases are met by reading).
- 2. Report, whole: no test's failing line on the unchanged tree is quoted. What is wrong: the rules file says "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree"; the step adds `hub-rows.test.ts` (31 rows), 'fileIndexSettings' (8 rows), the run.test.ts row 'an update task its hub holds a file of and does not list is refused with update-task-unlisted', and changes expected strings in `config.test.ts`, `boards.test.ts`, `catalogs.test.ts`, `hub-vocab.test.ts`, `connection-keys.test.ts` and `writing.test.ts`. Failure scenario: a new row that would pass on the unchanged tree (for example 'reads $input' 'no key' of `projectDocList`, whose four-row default the base also gave) is booked as a test of the change. Verdict: none.
- 3. Report, whole: no before/after table of edits to existing assertions. What is wrong: the rules file requires "every edit to an existing assertion, allow list or predicate with its before and after ... one row per changed line"; the changed lines include `config.test.ts:568-615` (eleven expected sentences), `boards.test.ts:330,349-396`, `catalogs.test.ts:92`, `hub-vocab.test.ts:367,429`, `connection-keys.test.ts:105-106` ("records" to "record", "family" to "list"), `writing.test.ts:187,198-201`, `docs.test.ts:47` (title), `run.test.ts:98` (title) and `app-theme-start.test.ts:415-420` (Proof 4). Failure scenario: the landing reader cannot see that the expected kind of a no-list value changed from `family` to `list` without diffing each test file by hand. Verdict: none.
- 4. `tests/server/desktop/app-theme-start.test.ts:417-420`: "row: 'rice.monospace written as a word, which reads as its default (C11)', options: {}, settings: '  theme: kanagawalotus\n  crt: { on: true }\n  rice: { brackets: false, monospace: x }\n',". What is wrong: the row's input moved from a raw config holding `monospace: 'x'` to a workspace file merged by `loadConfig`, because `requestStart` given such a config now returns the theme alone (`theme.ts:97` "if (looks === null) return { classes: theme, file };"); the assertion is kept, but the behaviour the row was written for (the server reading a wrong value as its default) is now the merge's, and the change of input is not reported. Failure scenario: a reader of the row believes `requestStart` still repairs a wrong rice value, while a config that reaches it unmerged now draws no rice, CRT or bracket classes. Verdict: none.

## 3. Standards

- 1. `src/lib/state/shared/words/appearance.ts:6`: "// editors, what a pane's top row draws" followed by "// (`show_tabs`, `editor_actions`), and the look ...". What is wrong: the rules file's "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". Failure scenario: the head comment reads with a broken line mid-sentence. Verdict: none.
- 2. `tests/checks/tree/layer-rows.ts:43`: "// pattern has: the schedule dialog checks an entry" followed by "// and previews a pattern before it sends, ...". Same rule, same defect. Verdict: none.
- 3. Report, "Deviations": "The list ran five times", "One run of the unit project over the scratch folder ... ran the whole unit suite", "One run over the folders tests/data tests/state tests/server tests/routes ... ran most of the suite". What is wrong: "Token discipline" allows one run of the list after the last change and a rerun only after a red in a changed file, and says a whole-suite command or a run of the list beyond that is a finding of the review. Failure scenario: several suites on this machine run long and time out together, which is what the step's own reds were. Verdict: none.
- 4. Report, "Deviations": "An `utils/unused-exports.sh` output was written once to the main checkout's `.agents/` folder", "Three outputs of this step were written to the session scratchpad", "One edit of the scratch case program ... was made with a shell here-document". What is wrong: "Where you work" says a builder writes nothing outside its worktree, the main checkout and the session scratchpad named; "What every package obeys" counts a shell redirect that changes a file as a script needing approval, and the brief says "No script is written for this step". Failure scenario: a write into the main checkout's `.agents/` while other steps are prepared there. Verdict: none.
- 5. Report, whole: the quotes the rules file requires are missing: the grep of every name the step changed or removed across `src`, `tests`, `config`, `docs` and `README.md` ("quote that grep in the report"), the grep of added comments and test titles for history words with each hit judged, and the list of head and doc comments of touched functions marked "still true" or "rewritten". The reviewer's grep of the removed names (`UPDATE_TASKS|FEED_REGISTRIES|PROJECT_DOCS|MARKDOWN_DOCS|fileIndex|mains(|TASK_VIEW|TASK_LABELS|NO_LOOK|FALLBACK_THEME|isFeedEntry|FeedRegistry|isUpdateTask|DEFAULT_EXT|DEFAULT_CAP|lit_label|scout_note|inbox_label`) over those folders finds only the unrelated `NO_LOOKUPS`, and the history-word grep of added comments finds only "before" in its temporal sense. Failure scenario: a stale name in a document goes unchecked by anyone who relies on the report. Verdict: none.

## 4. Behaviour

- 1. `src/lib/state/feeds/feeds.ts:134-158` and `src/lib/views/boards/focus/CommandCenter.svelte:202-205`, `config/text/views/boards/focus.yml` `refresh_inbox_plain: 'Inbox: triaged {0}d ago | run {1} from the Update tray'`: the Focus board's refresh lines are now made per offered row by `last_run` (one line per radar- or scout-reading row, the inbox line for the first inbox-reading row), named by the row's label, and none at all while a hub lists no `update_tasks`; before, by the task words `litwatch`, `scout`, `inbox`, with the literal "Inbox". The report's host-visible table has no row for Focus. Failure scenario: after landing without the hub's lines the Focus board silently loses every refresh nudge, and the look at landing is not told to check the board. Verdict: none.
- 2. `src/lib/state/workbench/navigation/notice-sources.ts:252-283`: run notices now post once per offered row reading that place, open the row's `view`, and the inbox notice carries a hub name when two offered rows share its label; with no `update_tasks` no run notice posts. Not in the report's table. Failure scenario: a reader no longer gets "Lit Watch updated" notices and the look does not know to expect it. Verdict: none.
- 3. `src/lib/views/sessions/session-list/SessionList.svelte:259-261` ("else if (startAgent !== null)"), `:463`, `src/lib/views/sessions/terminal/start/TerminalStart.svelte:42`, `src/lib/state/workbench/layout/open/float/folder-opener.ts:112`, `src/lib/shell/status/notices/NoticeCentre.svelte:82`, `src/lib/state/workbench/navigation/notices.svelte.ts:96`: before the page's settings are installed, New in a folder-limited Sessions list does nothing with no word, the Terminal tab draws no composer, the Customizations section is absent, a folder opened as a float gives its Terminal view an empty start, the Do Not Disturb button is disabled, and a notice posted then gets `toast: false` for good. The report's row "The status bar, the strip, the pane's top row and the look before settings arrive | drawn by invented defaults | not drawn" names none of these. Failure scenario: a press of New during a reconnect does nothing and the look at landing has no state to check it in. Verdict: none.
- 4. `src/lib/state/shared/words/appearance.ts:547` ("return list[0]?.name ?? '';") and `src/lib/server/content/docs.ts:829`: a `themes` list with no theme now draws no theme class where the base drew `light`, and the docs route decides its served names from the owning hub's `project_docs` after resolving the hub; the first is only in the judgments, the second nowhere in the table. Failure scenario: a hub that sets its own `project_docs` without a README row gets 404 on its project READMEs in the docs route, which the report does not tell the look to try. Verdict: none.
- 5. Report, "Host- or user-visible changes", row "The Update tray with no `update_tasks` in a hub": the same lack also turns every existing schedule of `schedules.yml` that runs `litwatch`, `scout`, `linkedin` or `inbox` into an `update-task-unknown` entry that does not run (`file.ts:175-178`) until the hub's lines are written. Not stated. Failure scenario: the step lands and the hub's `.oculus/config.yml` lines follow later; the weekly radar schedule misses its due times in between. Verdict: none.

## Declined to judge

- The builder's `git diff -U0 -- src` counts of removed fallback lines, its `git diff --quiet` over the three red files and over `config/options/local.yml`, and `git diff --name-only -- docs`: git commands outside the three allowed; the file list was checked with `diff -rq` instead.
- The case program's output lines: the program was removed and its source not quoted (Proof 1); judged by reading instead.
- Whether `project_docs: 5` should give the default rows or nothing (Spec 3): the brief's item 3 says such a value is a finding "and [is] dropped" while item 1 and G13 say the default stands; the reading above follows item 1 and G13, and the orchestrator may read item 3 the other way.
- Whether the `xx-` LinkedIn prefix, the `SCOUT_RUN` marker and `SKIP_DIRS` are user setup or oculus's own formats: they need the full read the step did not make.
- What the views draw (tray rows, Focus lines, notices, the before-settings states): a page look, which is the orchestrator's at landing.
- The timed-out files: each green alone (runs above); not counted, as the rules file says.

Reviewer usage: ad84e3a4fb08a1397, claude-opus-5-5, 370567 tokens, 82 tool uses, 1050 s.
