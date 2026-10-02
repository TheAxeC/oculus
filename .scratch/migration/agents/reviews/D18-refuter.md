# Step D18 refuter report (on .agents/worktrees/D18, base 47a41fa4)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`. The rules file judged is the base copy (`spec-at-47a41fa4.md`); the sentences the ledger's `agents/spec.md` gained since are listed separately at the end.

## Verification (rerun by the reviewer)

```
$ npm test
 Test Files  458 passed | 23 skipped (481)
      Tests  11926 passed | 627 skipped (12553)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790931453199 COMPLETED 3025 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(vite build, no error)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
(`sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` from `tools/oculus` of the worktree, exit 0. The worktree now holds `side-projects/` (`ls` printed gpu-game-boy, residual, scripted-os), so the builder's one red line, `integrity.test.ts` side projects, is gone. The run passed the tool's 600 s limit and the harness moved it to the background; I waited for its completion notice and did not poll.)

Commands the report quotes, rerun:
```
sh utils/folder-check.sh                                             -> exit 0, no output
grep -rnE "system/(hpc|usage)" src tests | grep -v 'system/machine/' -> no output (exit 1)
grep -rnE "\.\./system/(hpc|usage)|\.\./\.\./system/hpc" src tests   -> no output (exit 1)
grep -rnE "system/(hpc|usage)" src tests | wc -l                     -> 0
grep -n '^processes' -A1 config/behavior.yml                         -> 82:processes: / 83-  patterns: [python3, codex, claude, node, latexmk]
npx vitest run tests/state/system/machine tests/views/system/machine tests/server/machine/processes tests/server/root/context-reload.test.ts
                                                                     -> Test Files 14 passed (14), Tests 361 passed (361)   (matches the report)
npx vitest run tests/server/machine/pty/sessions.test.ts (slow-tagged, private tmux socket) channels/settings/context tests --reporter=verbose
                                                                     -> Test Files 4 passed (4), Tests 134 passed (134); "lists the pane process of a terminal and of a hidden usage session" passes
wc -l tests/fixtures/client.ts context.ts ...                        -> 100, 896, matching the report's table
```
Unchanged-tree run, reproduced on a sample: a scratch copy of the worktree's `tools/oculus` (no `config/local.yml`, node_modules linked) with `git diff 47a41fa4 -- src config package.json` reversed and the deleted base files restored, the final tests laid over it; `npx vitest run` on channels, settings, context, context-reload, `tests/server/machine/processes`, the state and view processes tests, config-folder and page tests printed `Tests 51 failed | 153 passed (204)`, every new `processesSettings`, `Hub.hasSubscriber`, `Hub.onFirstSubscriber`, `parsePanes`/`listPanes`, page-channel, config-folder and context-push case failing, as the report's table says. Moved files compared with their base text from the diff: only import paths, the three `readFileSync` path strings in `hpc.test.ts` and one comment path changed (`Jobs.svelte` and `usage.test.ts` imports re-wrapped by Prettier).

## Verdicts

Items of the brief's "What to build":

- 1: holds. `behavior.yml:82-83`, the `options.yml:238-241` entry with `default` and `control: list`, `processesSettings` in `settings.ts:251-262` with its head-comment line, `LiveStart`/`LiveTargets` and the `attempt('processes')` block in `live-settings.ts`; settings and context tests pass. Behaviour finding 1 is a case the item's text does not settle.
- 2: violated, Spec 1 (the command line loses its arguments for a whole class of lines) and Behaviour 2 (`started` an hour off across a clock change).
- 3: violated, Behaviour 3 (the library's `ps` child is neither bounded by the 10 s timeout nor ended by `close()`). The rest holds: hub calls, cadence, replay, supersede and close are tested in `watch.test.ts` and `channels.test.ts`.
- 4: holds. `model-processes.ts`, `payloads.ts` schema, `shapes.ts`, `entities.svelte.ts`, `+page.svelte` list, `readRows` drops bad rows (state test).
- 5: holds. Registration `{ id: 'processes', ..., group: 'info', order: 6 }`, the head line with singular forms, the columns, groups then matched rows, column sort within groups, `layout.yml:93`, y1-y7 in `HELP.md:70` and `app.yml:12`, glyph and icon.
- 6: holds. Stop only on a group row whose terminal the page holds, the question in `processes.yml:25`, `act` calls `endTerminals([group.terminal])` (state test sees `POST /api/terminal {action: 'stop', id}`), group drawn from the record keeps Stop; the report states the Terminal tab's after-state.
- 7: holds. The three full folders split into `machine/`, folder-check exit 0, the greps empty, moved files changed only in paths.
- 8: holds as written; the `DESIGN.md:134` and `HELP.md` matching sentences are made false for some lines by Spec 1.

Cases of the brief's "Cases":

- 1: met, `read.test.ts` "lists the pane process ... each with the terminal id" and "lists the trees of every pane of one session".
- 2: met, `read.test.ts` "lists a process outside every pane ..." and "... still counts the agent".
- 2a: met, "counts an interpreter run agent and the program it starts once".
- 2b: met, "leaves a hidden usage session out of the agents ..." (built through `parsePanes`).
- 2c: met, "ends the walk at a process listed as its own parent ...", "ends the walk at a cycle of parents".
- 3: met for the lines the case names (`match.test.ts`, `read.test.ts`); Spec 1 shows the same line with a colon argument fails in production.
- 4, 5, 6: met, `match.test.ts` and `read.test.ts` "lists none of the command lines the rule leaves out".
- 7: met, "counts an agent under an oculus pane, which is also a row with its terminal".
- 8: met, `folders.test.ts` (exit 1 with output, failure, timeout) and `read.test.ts` "lists the rows with empty folders when lsof answers none".
- 9: met, "counts a project once for an agent and an oculus terminal in it ..." and "counts a row in a project inside another for the deeper project", projects given through a link.
- 10: met, "matches a folder to a project by whole path segments".
- 11: met, `watch.test.ts` "the cadence" block.
- 12: met at the payload level (`watch.test.ts` throw, never answers, empty table, next tick); Behaviour 3 is the child left behind.
- 13: met, "one read at a time" and "drops the result of a read in flight ...".
- 14: met, `watch.test.ts` "lists the rows of the new patterns", `context.test.ts` refusals, settings tests for `[]`, duplicates and the absent block; Behaviour 1 for a block absent because the file failed to parse.
- 15: met, `tests/views/system/machine/processes.test.ts` (the press itself is the look's).
- 16: met, the store tests for the question, no request on asking, one stop request on yes; Cancel is AskConfirm's own path, read.
- 17: met, the moved tests pass (14 files, 361 tests), folder-check exit 0.
- 18: met, state test "drops a frame with rows that is not a list" and `readRows`.
- 19: met as stated, `table.test.ts`; Behaviour 2 is the library's real encoding the sample does not carry.
- 20: met, `channels.test.ts` `Hub.hasSubscriber` and `Hub.onFirstSubscriber`.
- 21: met, `catalogue.test.ts` `keyOf(order, 'processes')` is `y7`, `arrangement.test.ts` info row.

## 1. Spec

- `src/lib/server/machine/processes/table.ts:47-52`: "const program = entry.path === '' ? entry.command : `${entry.path}/${entry.command}`; const line = entry.params === '' ? program : `${program} ${entry.params}`;"; what is wrong: the row's `command` is rebuilt from the library's split, and `systeminformation` 5.33.15 drops every argument when the line holds a `:` after its first character and its first `/` is absent or past index 3 (`node_modules/systeminformation/lib/processes.js:673-680`: "if (p4 > 0 && (p3 === -1 || p3 > 3)) { command = fullcommand.split(' ')[0]; command = command.replace(/:/g, ''); }", `params` left empty). Replaying that branch: `node /usr/local/bin/codex --model gpt:5` -> `node`; `codex exec "fix: the bug"` -> `codex`; `claude --resume x --add-dir http://a` -> `claude`; `python3 -m http.server --bind 127.0.0.1:8000` -> `python3`. On this machine `ps -axo command=` holds 1 such line now (a `node` line). The brief asks for "the command line (the program path and its arguments)" and Decision 2 matches on the second word; failure scenario: an agent run as `node /usr/local/bin/codex --config a:b` is not counted in `agents`, is no row under `[codex]`, and the Command cell and the Stop question show `node` alone, while `DESIGN.md:134` and the `HELP.md` row say the second word matches. The report's library facts quote only a line the split keeps. A fix that reads the command line outside `systeminformation` touches ruling LA18 (rows through `systeminformation`), so the choice may be Axel's; verdict: item 2 violated.
- Paths outside the brief's list not named: `tests/state/workbench/navigation/arrangement.test.ts` (`toHaveLength(51)` to `52`, the info row) and `tests/state/workbench/navigation/catalogue.test.ts` (System list, `y7`) are written; the brief lists `tests/views/system/workbench/catalogue.test.ts` and `registry.test.ts` only, and the report's "Paths written outside the brief's list" names `table/match/folders/live.ts`, `tests/fixtures/client.ts` and `allow-duplication.txt` but not these two; `src/lib/state/system/machine/processes.ts` sits in a listed folder but is not one of the files the brief names for it. What is wrong: the rules file's "A path outside them ... is reported before it is written"; failure scenario: the orchestrator checks the diff against the list and the report and finds two unexplained test edits whose assertions changed. No verdict.

## 2. Proof

- `tests/server/root/context.test.ts` "keeps the six groups, each logged once, when behavior.yml was saved unparseable": "const unreadable = { text: inertConfig().text }; ... `config: ${FILE}: processes must be a map; ${KEPT}`"; what is wrong: the fixture carries no options catalog, so `processesSettings` throws and the group is "kept". With the shipped configuration the catalog is merged (`merge.ts`: "Invalid files are findings and contribute nothing"), and `processesSettings` of a map without `processes` returns the catalog default, which the step's own test shows (`settings.test.ts` "reads the shipped list ...": `const { processes: _removed, ...without } = config; expect(processesSettings(without)).toStrictEqual({ patterns: shipped })`). The title states a behaviour the real server does not have; failure scenario: a reader trusts the test that a broken save of `behavior.yml` keeps the pattern list in force, while Behaviour 1 is what happens. Verdict: case 14 met as tested; Behaviour 1.
- Report, "Library facts", `started`: "the machine's local wall-clock time, `YYYY-MM-DD HH:MM:SS`"; what is wrong: the library's source (`processes.js:81-100`, `parseElapsedTime`) builds it from `etime` as now minus elapsed shifted by the current UTC offset, which is local wall-clock time only when no clock change lies between the start and now. The adapter's conversion rests on this claim; failure scenario in Behaviour 2. Verdict: item 2 violated.

## 3. Standards

- `src/lib/server/root/context.ts` at 896 lines (`wc -l`), the size check's limit 900 (`tests/checks/tree/size.test.ts:28`, `const LINES = 900`); what is wrong: the rules file's "A file approaching it is split by concern"; the brief's own escape (move the pollers' wiring under `server/root/`) was not taken because D18 alone stays under. Failure scenario: `orchestrator-state.md` M3 dispatch block, shared_paths, says "M3 adds at most six lines, so the second landing keeps it under 900"; with D18 at 896, whichever of D18 and M3 lands second makes `context.ts` 902 lines (896 + 6, or 884 + 18) and `test:checks` goes red at that landing. No verdict.
- `src/lib/server/root/live-settings.ts:7-8`: "Each group is read on its own, so one a hand edit made unreadable keeps the settings in force while the others take theirs."; what is wrong: the step adds a group for which this sentence is false (Behaviour 1); the rules file's "A sentence in a document or a head comment that the change makes false is a defect of the change". Failure scenario: a maintainer relies on the comment and does not look for the reset. No verdict.
- `src/lib/server/machine/processes/read.ts:35`, `:43`, `:105`: "new Error('the read was cancelled')", "`the process table did not answer within ${TABLE_TIMEOUT_MS / 1000} seconds`", "new Error('the process table is empty')"; what is wrong: oculus's own English sentences reach the reader through `processes.failed` ("The last read failed: {0}", `Processes.svelte:60`); the rules file's "every user-facing string from a catalog file under `config/text/` through `t(...)` ... A literal string ... anywhere a reader sees it is a defect". Failure scenario: a catalog edit of the failure words leaves these three sentences as they are, and a test of the catalog never sees them. No verdict.
- `src/lib/state/system/machine/processes.ts:98`: "name: record === null ? terminal : record.title !== '' ? record.title : record.name"; what is wrong: the rule already exists as `terminalLabel` (`state/sessions/terminal/terminal-lists.ts:45`); the rules file's "a parser, a fold or a rule exists once and is reused". The import order blocks a direct import, but `client/context.ts` builds both stores and could hand the label through `TerminalEnding`. Failure scenario: the terminals store changes how it names a terminal, and the Processes group and its Stop question name the terminal differently from its tab. No verdict.
- `src/lib/server/machine/processes/table.ts:2-6` head comment: "`started` (the start as the machine's local wall-clock time ...)" and "the command line split into `path` ..., `command` (the program's file name) and `params` (the arguments)"; what is wrong: both are false for the cases in Spec 1 and Behaviour 2, and `tests/server/machine/processes/table.test.ts:1-7` repeats them. Failure scenario: a maintainer takes the comment as the library's contract and does not look for the lost arguments or the hour. Verdict: item 2 violated (with Spec 1, Behaviour 2).

## 4. Behaviour

- `src/lib/data/sources/config/settings.ts:252-253`: "const fallback = config.processes === undefined ? defaultPatterns(config) : undefined;"; what is wrong: when `behavior.yml` is saved unparseable, the merge drops the whole file, so at the next push every other behaviour group is refused and kept with a log line, while `processes` reads the catalog default `[python3, codex, claude, node, latexmk]` and `live-settings.ts` hands it to the watcher with no log line. The report does not state this; failure scenario: a reader with `processes: { patterns: [latexmk] }` saves a typo elsewhere in `behavior.yml` and the view starts listing every python3, codex, claude and node process without saying why. Missing-block-gives-default is the brief's rule; how it should behave when the file is unreadable may need the orchestrator's ruling. Verdict: none (item 1 holds as written).
- `src/lib/server/machine/processes/table.ts:27-39` (`startedOf` decodes with the start date's own UTC offset); what is wrong: the library encodes with the current offset. Simulated with the library's arithmetic under `TZ=Europe/Amsterdam`, now 2026-10-26T10:00Z, a process started 2026-10-24T10:00Z: "library started: 2026-10-24 11:00:00 | row started: 2026-10-24T09:00:00.000Z | true start: 2026-10-24T10:00:00.000Z". The report does not state it; failure scenario: after the clock change on 2026-10-25 every process started before it shows a start an hour early, so a reader matching a row against Activity Monitor by start time sees a mismatch. Decoding the fields as UTC plus the current offset gives the true instant. Verdict: item 2 violated.
- `src/lib/server/machine/processes/read.ts:32-62` and `live.ts:13-16`; what is wrong: `within` rejects after 10 s and on abort, but the library's `exec('ps ...')` (`processes.js`, no timeout) keeps running; the watcher's next tick starts another `processes()` call. The brief: "After `close()` nothing is published and no timer or child process outlives it", and the 10 s limit is meant to bound a read. Failure scenario: a `ps` that blocks (a process in uninterruptible wait) leaves one more `ps` child every ten seconds while a page is open, and `close()` during a read leaves that read's `ps` running. Not stated in the report. Holding the pending table promise and starting no new table read while it is unsettled would bound it to one. Verdict: item 3 violated.

## Declined to judge

- The look on TEST (sticky head over the wallpaper, the press on a column head and on Stop, the dialog, focus): the orchestrator's at landing; no browser opened, no dev server started.
- A real Stop against a live oculus tmux session and a real `lsof` read through the watcher: the security rules forbid signalling or attaching to real processes; only the private-socket test was run.
- Whether Spec 1's fix may read the command line outside `systeminformation` against LA18: Axel's ruling.
- The first-run table was reproduced on 9 of the 26 files it names; the other 17 were not rerun on the unchanged tree.
- `npm run diagrams` was not rerun (it writes files); the committed-diagrams test passed in the full list.
- Whether the builder ran a git command: not checkable from the diff.

## Sentences added to the ledger's `agents/spec.md` after the base that would also apply

- "A file within 20 lines of its cap is split": `context.ts` at 896 of 900.
- "An error from the engine or a library is mapped to a catalog line before it is shown": the raw `error.message` in `processes.failed` (`watch.ts:55`).
- "A test waits on a signal ..., never on a fixed sleep": `folders.test.ts:135` and `:147`, `await new Promise((resolve) => setTimeout(resolve, 1600))`.
- Test titles with "still": `channels.test.ts` "still sends the first subscriber ...", `read.test.ts` "... and still counts the agent".
- "The report lists every edit to an existing assertion, allow list or predicate with its before and after": `arrangement.test.ts` 51 to 52, `context.test.ts` `length: 12` to `13` and "five groups" to "six groups", the `config-folder.test.ts` catalog-file predicate made recursive, the `allow-duplication.txt` row removed; the report names only the last.
- "a shared fallback object handed to callers is frozen or built per call": `watch.ts:32` `NOTHING` (its `rows: []` goes into published payloads) and `processes.ts:136` `DEFAULT_SORT`.
- The per-test failing line on the unchanged tree, the run with each behaviour removed, the list of head and doc comments marked "still true" or "rewritten", and the list of asynchronous paths with their in-flight, after-close and superseded tests: the report gives a per-file table only.
- "every export the step adds ... with no importer outside its own file and its tests is removed or made local": `AGENTS` (`match.ts:8`), `COMMAND_LIMIT`, `SORT_KEYS`, `paneArgs` are candidates; not grepped one by one.

Reviewer usage: about 300,000 tokens (from the context counter, approximate), about 50 tool uses, about 35 minutes.


## Repair round 1, refuted

Reviewer: a fresh session at ordo-high, reviewing `.agents/worktrees/D18` against base 47a41fa4. The only git commands run were `git diff 47a41fa4` and `git status --short`, both from inside the worktree. No file in the worktree or the ledger was changed. Mutation runs were made on a scratch copy at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d18mut`, which has no `config/local.yml`, and that copy was restored after each run (`cmp` against the backups printed "same"). `config/local.yml` was not opened, printed, grepped or hashed.

Overall: the verify list is green, and all seven rulings are closed except for four small points. One is a behaviour gap left in ruling 1; the other three are text and export fixes. All four can be fixed at landing.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from tools/oculus of the worktree)
$ npm test
 Test Files  460 passed | 23 skipped (483)
      Tests  11966 passed | 627 skipped (12593)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790946400197 COMPLETED 3029 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 45.05s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```
(The run went to the background, and I waited for its completion notice. It finished green on its first run, with no 5000 ms timeout anywhere.)

Commands the report quotes, rerun:
```
npx vitest run tests/server/machine/processes tests/state/system/machine/processes.test.ts tests/views/system/machine/processes.test.ts tests/server/root/context tests/data/sources/config/settings.test.ts tests/server/core/channels.test.ts tests/server/machine/pty/sessions.test.ts
  -> Test Files  15 passed (15) / Tests  382 passed (382)          (matches the report)
npx vitest run tests/server/git/autofetch.test.ts                 -> Test Files 1 passed (1) / Tests 44 passed (44)   (matches)
sh utils/folder-check.sh                                          -> exit 0, no output
grep -rn systeminformation src tests package.json package-lock.json | wc -l   -> 0 ; same over DESIGN.md HELP.md README.md config (--exclude=local.yml) -> 0 ; ls node_modules/systeminformation -> No such file or directory
grep -rnE "system/(hpc|usage)" src tests | grep -v 'system/machine/' | wc -l  -> 0
grep -rnE "\.\./system/(hpc|usage)|\.\./\.\./system/hpc" src tests | wc -l     -> 0
wc -l src/lib/server/root/context.ts                              -> 846
git status --short: package.json and package-lock.json not listed (identical to base)
Real ps through entryOf: LC_ALL=C ps -axww -o pid=,ppid=,user=,pcpu=,rss=,lstart=,command= > scratchpad/ps-real.txt, then a node script that counts only (no command line printed):
  {"lines":403,"read":403,"unread":0,"withColonArg":18,"startedInFuture":0}
  (the report's 506 of 506 came from another moment's table; no decision rests on the count. All lines read, and the 18 lines with a colon argument keep their arguments.)
Mutations on the scratch copy, one at a time:
  M1 library's colon rule put into entryOf's command   -> table.test.ts:108:80 "expected [ Array(4) ] to deeply equal [ …(4) ]"; read.test.ts:314:29 "expected 2 to be 3"
  M2 today's offset in instantOf                       -> table.test.ts:74:64 "expected [ '2026-03-07T16:00:00.000Z', …(1) ] to deeply equal [ '2026-03-07T17:00:00.000Z', …(1) ]"
  M3 close() without controller.abort()                -> watch.test.ts:395:41 "expected [] to deeply equal [ 'SIGKILL' ]", :451:33
  M4 watcher without the `reading` guard               -> watch.test.ts:361:32 "to have a length of 1 but got 2", :376:32 (got 6), :429:29, and the superseded case
  M5 behaviorDropped ignored                           -> settings.test.ts:331:31, :355:68, context-push.test.ts:294:81 (3 failed)
  M6 LC_ALL not set                                    -> ps.test.ts:53:29 (1 failed)
These reproduce the report's F1, F2, F4, F5, F6 and G1 at the same lines.
```
Not rerun:
- The report's `find ... -newer checks-run3.log` was not rerun, because the builder's scratchpad path is not given.
- F3, F7, F8, G2 to G11 were not rerun.

### The rulings of the round

1. **The process table without `systeminformation`: closed, with one residual point.** What holds:
   - `ps.ts:18` runs `-axww -o pid=,ppid=,user=,pcpu=,rss=,lstart=,command=` through `spawn`, with an argument list and no shell.
   - `LC_ALL: 'C'` is set (`:65`).
   - The output is folded as it arrives, with a 32 MB bound (`:24`, `:101-110`). Its own `MAX_OUTPUT` constant has the same value as `search.ts:42` and `git.ts:120`.
   - At 10 s, on abort and past the bound, the child gets `SIGKILL` (`:84-91`).
   - `close()` aborts the read (`watch.ts:105`).
   - The start is decoded with the offset in force on its own date (`table.ts:34-45`).
   - The whole command line is kept, arguments included (`table.ts:76`).
   - The dependency is gone (the greps above).

   The tests fail with each behaviour taken out (M1, M2, M3, M4, M6). The residual point is finding R1.
2. **Paths outside the list: closed.** Report lines 56-65 name `arrangement.test.ts`, `catalogue.test.ts` and `state/system/machine/processes.ts`, each with the reason it is needed.
3. **An unparseable `behavior.yml` keeps the pattern list: closed.**
   - `settings.ts:214-231` refuses the default when a whole-file finding (`key === ''`) names `behavior.yml`.
   - Only the merge emits such a finding for that file (`merge.ts:163`, `:172`; `behaviorFindings` emits keyed findings only, `catalogs.ts:157-176`).
   - The findings travel with the config push (`portfolio.ts:503-513`, `live-settings.ts` schema).
   - The rebuilt test runs over the shipped catalog and over a real `loadConfig` with an unparseable substitute (`settings.test.ts:350-362`), and it fails without the refusal (M5).
   - `live-settings.ts:7-8` is now true.
   - At start, `slurmSettings` throws first for a dropped file, so the start behaviour is unchanged.
4. **`context.ts` at most 860 lines: closed.**
   - `context.ts` is at 846 lines, and `pollers.ts` holds the HPC, Processes, calendar and mail starts and the usage starters.
   - The calendar and mail wiring moved as well. That goes beyond the ruling's parenthesis, but it was needed: they are about 36 lines, and 846 plus 36 is above 860. It is still the "pollers' wiring" concern.
   - The merge consequence for M3 is under "Declined to judge".
5. **English sentences mapped to catalog keys: closed.**
   - `failure.ts` maps the six reasons, plus `failed_other`, to keys of `processes.yml:16-23`, worded through `words`.
   - `watch.ts:67` publishes `failureLine(error, text)`.
   - The only `new Error` left in the folder is `folders.ts:35`, which is caught at `:84` and never published.
6. **The terminal's name: closed.**
   - `client/context.ts:322-326` hands `terminalLabel`, and `processes.ts:99` calls it.
   - The copy of the rule is gone.
   - Tests cover a titled and an untitled terminal (state test `:341`, `:354`) and a handed-in label function (`:226`).
7. **The newer rule sentences: closed except two points.** What holds:
   - No `setTimeout(resolve` in `folders.test.ts`.
   - No "still" in a title of the step's new tests (the only hit, `hpc.test.ts:350`, is moved text from before the step).
   - `nothing()` and `defaultSort()` are built per call.
   - The assertion-edit table matches the diff (`config-folder.test.ts`, `allow-duplication.txt`, `allow-audits.txt` read).
   - The head-comment and asynchronous-path tables are present.

   What remains is findings R3 (one export left with no importer) and R4 (one edited head comment not rewrapped).

### The four points asked about

1. **`user=` in the `ps` column list: holds, and is not a finding.**
   - The brief's item 2 row is `{ pid, ppid, user, ... }`, item 5 draws a User column, and Axel's ruling at `plan.md:561` lists user among the columns.
   - The ruling that put `ps` in place (`plan.md:884`) decided where the table comes from. Without `user=`, the User column would be empty and item 5 would be violated.
   - Satisfying both rulings needs `user=`, so there is no clash to put to Axel.
   - On this machine's real table, all 403 lines read with the column present.
2. **The builder's read-only git command: nothing in the tree depends on it.**
   - The only hash-shaped strings on added lines of the diff are the clone ids `8ead1c0cdafe` and `f86fb737d860`. These are existing `allow-duplication.txt` rows, re-keyed to the moved paths.
   - The command's only effect is on the report: its "unchanged tree" runs were made against the main checkout's current `tools/oculus`, not the base 47a41fa4. The report says so (lines 8, 139).
   - The breach of `agents/spec.md`'s no-git rule is for the orchestrator's record. It is not a defect of the diff.
3. **`lsofFolders` bounds time and abort but not output size: not a defect the brief covers.**
   - Item 2 asks for "a 5 s timeout that kills the child", and ruling 1 asks for an output bound on `ps` only.
   - The output of `lsof -a -d cwd -Fn -p <pids>` is at most a `p`, an `f` and an `n` line per asked pid, with the path bounded by the system path limit.
   - The pids come from a table that is itself bounded at 32 MB, and the 5 s kill ends any child that keeps printing.
4. **Would the four colon lines' tests fail with the behaviour taken out: yes.**
   - With the library's colon rule (`processes.js:673-680` of the removed package) put back into `entryOf`, `table.test.ts:108:80` fails.
   - With the same mutation, `read.test.ts:314:29` fails with "expected 2 to be 3": `node /usr/local/bin/codex --model gpt:5` loses its codex agent.
   - Testing against the removed adapter is impossible since the module no longer exists. The mutation run is the right proof.

### Verdicts (whole diff since the base)

Items:
- 1: holds. Ruling 3 closed; `behavior.yml:82-83`, `options.yml` entry, `processesSettings(config, findings)`, `live-settings.ts:165-170`.
- 2: holds, as widened by the user's ruling that the table is read from one `ps` run.
  - Rows come from one `ps` run (`ps.ts`, `table.ts`); own trees, matching and `lsof` are as in the first run.
  - Arguments are kept (M1), and starts are decoded with the date's offset (M2).
  - Real table: 403 of 403 lines read.
- 3: holds. The cadence, replay, one read at a time, supersede and close are tested; `close()` kills the `ps` child (M3).
  - Finding R1 is a residual of the round's "at most one ps child" sentence, not of the item's text.
- 4: holds.
- 5: holds.
- 6: holds. The terminal label is the terminals store's own.
- 7: holds. Folder check exit 0, both greps empty.
- 8: holds, with finding R2 (a dropped word in `README.md:13`) and finding R5 (`DESIGN.md:134`'s failure list).

Cases:
- 1, 2, 2a, 2b, 2c: met (`read.test.ts`, as in the first review).
- 3: met, now also for colon arguments (`table.test.ts:101-109`, `read.test.ts:304-318`).
- 4, 5, 6, 7: met.
- 8: met (`folders.test.ts`).
- 9, 10: met.
- 11: met (`watch.test.ts` "the cadence").
- 12: met. A `ps` that never answers is killed at 10 s and the read fails (`watch.test.ts:338`). Throw and empty table are covered.
- 13: met (M4, M3).
- 14: met, including the unparseable `behavior.yml` (M5).
- 15, 16: met.
- 17: met.
- 18: met.
- 19: met as amended by ruling 1.
  - UTC ISO whatever the zone (`table.test.ts:63-84`), memory in bytes (`:44-55`), command cut at 1,000 (`:111`).
  - A line whose start does not read is left out, as the ruling says (`:121-134`).
- 20, 21: met.

### Findings

- **R1. Behaviour, with a proof point. Place: `src/lib/server/machine/processes/ps.ts:84-91`, `watch.ts:54,70`, `tests/server/machine/processes/watch.test.ts:355-367`.**
  - The code:
    ```
    const fail = (failure: ReadFailure): void =>
        finish(() => {
            child.kill('SIGKILL');
            reject(failure);
        });
    ```
  - What is wrong: the read settles when the kill is sent, not when the child has gone. The watcher then starts the next `ps` at the next tick even when the killed one never emitted `close`.
  - The test "starts no second child while one has not ended, and one at the next tick after it was killed" drives exactly that case: child 0 is killed and never closed, and `expect(probe.children).toHaveLength(2)` at 20 s. Its title says the opposite of what the case asserts.
  - Ruling 1 says "so at most one ps child exists at any time".
  - Failure scenario: the first review's own scenario, a `ps` stuck in uninterruptible wait. SIGKILL is not delivered until the wait ends, so with a page open a new `ps` starts and is killed every 20 s, and the stuck children pile up. Ordinary runs, where SIGKILL ends `ps` at once, are not affected.
  - Fix, small and inside ruling 1: per watcher (no global), start no `ps` while the previous child has not emitted `close`, and change the test to assert one child while child 0 is unclosed.
  - Verdict: ruling 1 not fully closed. No item verdict.
- **R2. Standards. Place: `tools/oculus/README.md:13`.**
  - The word diff against the base shows only `[-and-]`: "`d3-force` (ISC) runs the Map's forces, `cloc` (GPL-2.0) is run ...".
  - What is wrong: with `systeminformation` removed, the README should equal the base. The step leaves a grammar regression in a line no item now asks it to change.
  - Failure scenario: a reader of the dependency list gets a run-on list. The next diff of this line shows an unexplained edit.
  - Fix at landing: restore the base line.
- **R3. Standards. Place: `src/lib/state/system/machine/processes.ts:11`.**
  - The code: `export type { ProcessRow, ProcessesPayload } from '../../../data/model/index.ts';`
  - What is wrong: `grep -rn ProcessesPayload src tests` shows no importer of it through this module (`ProcessRow` is imported by `ProcessTable.svelte`).
  - The rules file says an export with no importer outside its own file and its tests is removed. The report's ruling-7 list says every other export has an importer.
  - Failure scenario: a dead re-export stays, and the unused-exports script approved for D32 will report it.
  - Fix at landing: drop `ProcessesPayload` from the line.
- **R4. Standards. Place: `src/lib/server/machine/pty/sessions.ts:4-5`.**
  - The comment line is "// session inside tmux so it outlives the server; the `oculus-` prefix is all that tells a". It is 90 columns, and the next word "session" would end at 98. Line 5 is 96 columns, and "of" would end at 99.
  - What is wrong: the rules file says a comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line ends short. The report claims "wrapped to 100 columns".
  - Failure scenario: none at runtime. The next edit of the paragraph inherits ragged lines.
  - Fix at landing: rewrap the paragraph.
- **R5. Standards. Place: `DESIGN.md:134`.**
  - The sentence: "a read fails when `ps` cannot start, ends with a status, prints no line that reads, does not answer within ten seconds, or gives an empty table".
  - What is wrong: the list reads as exhaustive. `ps.ts:109` also fails the read, and kills the child, when the output passes 32 MB, and `:111` fails it on a stream error.
  - Failure scenario: a maintainer reading DESIGN.md does not know about the bound.
  - Fix at landing: add the output bound to the list.

Over the delta, nothing else was found:
- No check was removed or loosened. The ruling-3 test was made stricter, and the `config-folder.test.ts` predicate reads more files against an exact list.
- No fix reaches beyond its finding apart from the calendar and mail move under ruling 4, which the 860 target required.
- Every other claim of closure reproduced.

### Declined to judge

- **How the delta was taken.** No tree state was recorded when the round was sent at 12:15, so the delta is the 59 files modified after the round's rulings file, listed in `d18-round1-files.txt`. Each was read through `git diff 47a41fa4 -- <file>` against the whole diff since the base. A change made in the round to a file not in that list would not have been read as delta.
- **The merge with M3.** The HPC `watchHpc` call, including `host: local.hpcHost ?? slurm.host`, now lives in `src/lib/server/root/pollers.ts:79-86`, not in `context.ts`. M3's ruled change to the HPC host resolution has to be carried into `pollers.ts` at the second landing, while M3's `shared_paths` names `context.ts` only. This is the orchestrator's merge judgement.
- **Unchanged-tree runs.** The report's runs on the unchanged tree were taken on main's current `tools/oculus`, not on base 47a41fa4. I did not rerun them on the base. The mutation runs above stand in for the round's behaviours.
- **Real `Stop` and `lsof`.** A real `Stop` against a live oculus session and a real `lsof` read were not run: the rules forbid signalling or attaching to real processes. Only a read of `ps` was run.
- **The look on TEST.** It is the orchestrator's at landing.
- **Remaining mutation runs.** F3, F7, F8 and G2 to G11 were not rerun. F1, F2, F4, F5, F6 and G1 were reproduced.
- **Remaining finding of the first review.** Spec 2's "no verdict" path finding was closed by the report text alone. I did not judge it further.

Reviewer usage: about 285,000 tokens (from the remaining-token counter), about 55 tool uses, about 17 minutes.

### Closed

Every finding of the run over repair round 1 is fixed at landing on main, each small and inside the brief:

- R1: fixed. `ReadFailure` carries `ended`, a promise `ps.ts` resolves on the child's `close` or `error`; `watch.ts` awaits it in the read's `finally`, so no `ps` starts while a killed one has not closed. `tests/server/machine/processes/watch.test.ts` now asserts one child while child 0 is unclosed and a second after it ends; with `await ended;` taken out of `watch.ts` the case "starts no second child while a killed one has not closed, and one at the tick after it closed" fails (`Tests 1 failed | 31 passed (32)`), with it `32 passed`.
- R2: fixed. `README.md:13` restored to the base line ("and `cloc`").
- R3: fixed. `state/system/machine/processes.ts` re-exports only `ProcessRow`.
- R4: fixed. The `sessions.ts:3-6` comment rewrapped as one paragraph at 100 columns.
- R5: fixed. `DESIGN.md`'s failure list adds "prints more than 32 MB, fails while its output is read".
- The look at landing, on TEST in the dark theme (the light theme was looked at on 2026-10-02, `owed-looks.md`): the Processes view's header line, the group rows and their rows with PID, Parent, User and Start, the "Read at" time, sorting by a column, the failure line when `ps` cannot be read (not provoked on the real machine; read from the view's state if no failure occurs), and the view inside the System page. The Stop control is never clicked.

The first run's findings were closed by the builder in repair round 1, as "The rulings of the round" above records.
