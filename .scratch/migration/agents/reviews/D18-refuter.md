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
