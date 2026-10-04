Everything in the brief is done. Two places depart from the brief's letter and are set out under "Judgment calls": assertions of constants were removed from kept tests (item 4 says no assertion of a kept test changes except to fold it), and the timing was taken as five whole-folder runs rather than five verbose runs per file.

# T1b report: the test sweep of `tests/state/`

Worktree `.agents/worktrees/T1b`, project folder `tools/oculus`. The base copy is `.agents/worktrees/T1b-base/tools/oculus/`. No git command was run by the builder except five read-only status or rev-parse calls listed under "Judgment calls".

## Open items from orchestrator-state.md (verbatim, line 139)

- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. It shows only while `tasks.skip_permissions` is on in `config/behavior.yml`. Axel allowed the edit for the look (2026-10-03); the Claude Code auto-mode classifier refused it again with his permission given, so the session cannot make it. Options: (a) Axel sets `skip_permissions: true` himself, the look is taken, and Axel sets it back (the session checks `git diff --exit-code -- tools/oculus/config/behavior.yml` after); (b) the point is dropped from the look. Recommendation: (a), one line each way and (b) is the lazy option.

## The cases, first run on the unchanged tree

Each verdict was reached by reading the test and the code it reaches, in the base copy, before any change. No case of the brief's rules was found wrong, so there was no stop.

- `workbench/navigation/registry.test.ts:505` and `:522` (no two views share a glyph; no chorded group wears a glyph of its own views): delete confirmed. Both assert over the shipped configuration's glyph keys, and two views with one glyph stop no view, key or command. No other test holds the property. Deleted, with the `arrange`, `isChorded` and `NavGroup` imports they alone used.
- `registry.test.ts:547` (the Agents and Changes glyph pair): delete confirmed (two named pairs of catalog keys). Deleted.
- `boards/structure/forces.test.ts:257` (`settleForces(createForces([], []))` is `[]`): delete confirmed. `src/lib/state/boards/structure/forces.ts` has no branch for an empty list (`createForces`, `settleForces` and `clampToBox` loop over the list they are given), and `src/lib/state/boards/structure/layout.ts:240-241` passes the empty list straight to them, so the test exercises d3's simulation over `[]`. The first run found no oculus code on that path. Deleted.
- `sources/fs/fs.test.ts:108`: keep confirmed. A relist while a read of the same root and path is in flight sends no second request and the answer that lands is held; a lost answer draws an empty folder. Retitled 'sends no second request for a relist while a read of that pair is in flight, and holds the answer' (now at `:104`).
- `client/terminal/terminal-close.test.ts:281`: keep confirmed. Retitled 'closes the tab of its last terminal and sends no stop for it' (now at `:280`); the Revert comment rewritten to say what the test holds (it fails when the tab is left open or a stop is sent).
- `shared/words/generation.test.ts:156-175`: delete confirmed (assertions over source text, `spec.md:61`). The describe, `functions()`, `calls()`, `dependent()`, `STORES`, `STATE`, `Fn` and the `node:fs`, `node:path`, `node:url` imports are gone. The push cases at `:49-95` were judged under item 1 like any test and kept.
- `client/socket-timing.test.ts`: delete confirmed (prints the elapsed time, asserts only that something was heard). The file is deleted; `client/socket-stub.ts` stays (imported by `client/config-seed.test.ts` and `system/machine/processes.test.ts`).
- `system/settings/rows.test.ts:394-421`: kept, judged under item 1. A missing or mismatched row is a setting the user cannot change, and no other test reads the five shipped files named by `FILES` (`appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`; `local.yml` is not among them). The constant `terminal` assertion in it was removed.
- `registry.test.ts:468` and `:473` (every label and glyph key held to the catalog): kept, as the brief says (`catalogEntry` throws on a missing key, `text.ts:50-55`). They are now at `registry.test.ts:156` and `:161`.
- `system/config-files.test.ts:17` (`LOCAL_NAME` held equal on two sides): kept. `life/memories-message.test.ts:76` (one constant re-exported): deleted. `data/file-ops.ts:26` holds the constant, re-exported at `src/lib/state/life/memories.ts:29` and `src/lib/server/content/memories.ts:50`.
- `workbench/layout/layout-fixture.ts` (16 importers outside `tests/state`): every export kept. `fs-fixture.ts`, `instance-fixture.ts` and `terminal-tabs-fixture.ts` keep every export they had; `fs-fixture.ts` re-exports `settle`.
- A deletion that makes an `allow-duplication.txt` entry stale: two entries removed (the `writes.test.ts` / `notice-sources.test.ts` pair and the `terminals.test.ts` / `hpc.test.ts` pair), `tests/checks/tree/duplication.test.ts` passes (it is in the `test:checks` run quoted below).
- A fold into a table: each fold's old titles and its rows are under "Folds, old titles against rows".
- A test at 95 ms in one sample and 105 ms in another: decided by the minimum over five runs, as Decision 1 says; the times of every test left quick are in the per-file slowest table.

## DONE / NOT DONE

Every row names the command that proves it. All commands ran from `.agents/worktrees/T1b/tools/oculus` after the last change to any file under the worktree.

| Row | State | Command and result |
|---|---|---|
| Verify list, once after the last change | DONE | `npm run diagrams` exit 0, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0, last line `checks: 7 commands passed`. The worktree's `docs/diagrams` equals main's (`diff -rq` over it prints nothing). |
| Number of full-list runs | 1 | One complete run of `npm run diagrams` plus `checks.sh`. |
| Slow-tagged files pass alone | DONE | `npx vitest run tests/state/sessions/terminal/commands-pane.test.ts --tagsFilter slow` prints `Tests  1 passed (1)`; `npx vitest run tests/state/sources/repositories/diff/hunks-git.test.ts --tagsFilter slow` prints `Tests  5 passed (5)`. |
| No quick test with a minimum of 80 ms or more, none with a Decision 1 cause | DONE | Five runs of `npx vitest run tests/state --tagsFilter '!slow' --reporter=json`; the per-test minimum over the five runs is below 80 ms for every test (the slowest is 51.7 ms, `boards/structure/forces.test.ts`). `grep -rn "child_process\|spawn\|execFile\|execSync\|createServer\|listen(" tests/state` prints lines of the two tagged files only (`commands-pane.test.ts:14,76`, `hunks-git.test.ts:9,56`); `grep -rnE "setTimeout\([^)]*[1-9][0-9]*\)|setInterval|waitFor" tests/state` prints one line, `sources/repositories/view/view-state.test.ts:136`, a `setTimeout(settle, 2)` that runs under fake timers; no `waitFor` is left. |
| No hook of 100 ms or more | DONE | For each file of the five runs, the file's span from the JSON reporter minus the sum of its tests' durations is at most 3.1 ms (`sources/repositories/view/repositories.test.ts`, run 3), so no `beforeAll` or `beforeEach` costs 100 ms. |
| `grep -rn "it('audits\|it(\"audits" tests/state` | DONE | Prints nothing (exit 1). |
| Every fold's table run passes | DONE | `npx vitest run tests/state --tagsFilter '!slow'` prints `Test Files  204 passed \| 2 skipped (206)` and `Tests  5658 passed \| 6 skipped (5664)`; the rows are listed under "Folds, old titles against rows". |
| Deleted or renamed files named nowhere | DONE | `grep -rn "client/socket-timing.test.ts\|sessions/terminal/pty-io.test.ts\|sources/off-facets.ts" src tests` prints nothing; the greps for `socket-timing`, `pty-io.test`, `off-facets` over `src` and `tests` print nothing. The one remaining line that names the moved file's neighbours is `tests/state/sessions/terminal/pty/pty-io.test.ts:8`, which names `sessions/terminals.test.ts` and `pty-socket.test.ts`, both of which exist. |
| ASCII only in the changed files | DONE | `perl` gate of `spec.md:97` over `tests/state` and `tests/checks/tree` prints nothing; `LC_ALL=C grep -rna '[^ -~]' src tests` (the last command of `checks.sh`) prints nothing. |
| Prettier and eslint on every changed file | DONE | `npx prettier --check tests/state` is clean; `npx eslint tests/state` exits 0; `npm run format:check` and `npm run lint` are in the `checks.sh` output below. |
| Only the writable paths changed | DONE | `diff -rq` of the worktree's `src` and `tests` against the base copy lists only files under `tests/state` and `tests/checks/tree/allow-duplication.txt`; `find tests -name node_modules -o -name .svelte-kit` prints nothing. |
| Largest file under 900 lines, at most 10 items per folder | DONE | The largest `tests/state` file is `life/present.test.ts` at 807 lines; the folders at 10 items are `tests/state`, `workbench`, `workbench/layout`, `workbench/layout/open`, `workbench/navigation`, `sessions`, `sessions/terminal`, `client`, `system/settings` and `boards/board`; `tests/checks/tree/size.test.ts` and the item-count test pass in the `test:checks` run below. |
| Duplication allow list | DONE | Two entries removed (the `writes.test.ts` / `notice-sources.test.ts` pair and the `terminals.test.ts` / `hpc.test.ts` pair), none added; `tests/checks/tree/duplication.test.ts` passes inside `npm run test:checks`. |
| NOT DONE | none | Nothing in the brief is left undone. The two departures from the brief's letter are under "Judgment calls". |

### Output of `checks.sh`, verbatim for the lines that matter

```
$ npm test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'
 Test Files  598 passed | 27 skipped (625)
      Tests  12407 passed | 666 skipped (13073)
   Duration  240.10s (transform 48.11s, setup 0ms, import 551.28s, tests 343.01s, environment 225ms)

$ npm run test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
   Duration  47.08s (transform 19.98s, setup 0ms, import 74.77s, tests 101.52s, environment 7ms)

$ npm run check
1791080689222 COMPLETED 3374 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ npm run build
(the vite build log, left out here; the build exits 0)

$ npm run format:check
All matched files use Prettier code style!

$ npm run lint
(eslint prints nothing)

$ ! LC_ALL=C grep -rna '[^ -~]' src tests
(prints nothing)
checks: 7 commands passed
```

The `npm test` output of that run also holds one stderr line, `fatal: Needed a single revision`, from a test outside `tests/state` (`npx vitest run tests/state --tagsFilter '!slow'` alone prints no such line); which test prints it is not verified.

## Counts per folder, before and after

Lines are `find tests/state/<folder> -name '*.ts' -exec cat {} + | wc -l`; test files are `*.test.ts`; `.ts` files include helpers; tests are the vitest count, base `7563` (7562 passed, 1 skipped) and after `5664` (5658 passed, 6 skipped).

| Folder | Lines before | Lines after | Test files before | Test files after | `.ts` files before | `.ts` files after | Tests before | Tests after |
|---|---|---|---|---|---|---|---|---|
| boards | 7213 | 6866 | 23 | 23 | 26 | 26 | 533 | 495 |
| client | 3704 | 3485 | 11 | 10 | 13 | 13 | 251 | 246 |
| feeds | 1723 | 1628 | 8 | 8 | 8 | 8 | 214 | 211 |
| forms | 2021 | 1853 | 5 | 5 | 5 | 5 | 332 | 325 |
| life | 2482 | 2348 | 7 | 7 | 7 | 7 | 236 | 225 |
| sessions | 8266 | 7992 | 23 | 24 | 25 | 27 | 622 | 603 |
| shared | 4109 | 3076 | 11 | 12 | 12 | 13 | 1932 | 1039 |
| sources | 13662 | 12175 | 53 | 53 | 59 | 58 | 1144 | 903 |
| system | 5215 | 4569 | 19 | 19 | 20 | 20 | 536 | 375 |
| workbench | 18102 | 14375 | 45 | 45 | 48 | 48 | 1763 | 1242 |
| total | 66497 | 58367 | 205 | 206 | 223 | 225 | 7563 | 5664 |

The brief's "205 test files" counts `*.test.ts`; the `.ts` column is the one that counts helpers.

## Timings

The comparable pair is the command the brief names, `npx vitest run tests/state --tagsFilter '!slow'`, run with `--reporter=dot` inside `time`, on the unchanged tree and after the last change.

| Run | Vitest Duration | Wall (`time`) | Load average before | Load average after |
|---|---|---|---|---|
| Before any change (base copy) | 73.36 s | 99.62 s | 9.20 8.40 7.45 | 11.32 9.37 7.93 |
| After the last change | 43.53 s | 45.82 s | 8.57 10.51 11.02 | 9.24 10.39 10.94 |

After the last change, five runs of the same command with `--reporter=json` (the runs the per-test minima below come from), wall time as the script measured it around `npx vitest`, and the span from the run's start to the last file's end in the JSON:

| Run | Wall | JSON span | Load average before | Load average after |
|---|---|---|---|---|
| 1 | 62.66 s | 59.2 s | 7.22 10.12 10.80 | 11.44 10.76 10.99 |
| 2 | 65.09 s | 61.6 s | 11.44 10.76 10.99 | 11.81 10.98 11.05 |
| 3 | 80.06 s | 73.4 s | 11.81 10.98 11.05 | 11.91 11.13 11.09 |
| 4 | 76.56 s | 72.9 s | 11.91 11.13 11.09 | 14.73 12.10 11.45 |
| 5 | 64.61 s | 60.3 s | 14.73 12.10 11.45 | 13.31 12.21 11.54 |

Load only adds time. Run 3 overlapped two single-file runs of mine (the two `--tagsFilter slow` runs of the verify list), and the machine also ran another builder (T1e) throughout, so the five walls are upper bounds. The JSON reporter run of the base copy (load 10.56 rising to 17.96, 93.4 s span) is not comparable and is not used.

Where the quick suite spends its time now: `tests` 4.86 s of the 43.53 s Duration (12.18 s at the base); the rest is transform and import.

## Slow tags and the slowest quick tests

Two files carry the tag, both as `// @module-tag slow: <reason>` as the last line of the head comment, and both run alone with `npx vitest run <file> --tagsFilter slow`. The base's one tagged file, `client/socket-timing.test.ts`, is deleted. Times of every tagged test over five runs of both files with `--tagsFilter slow` (load averages per run: 12.07 12.19 10.41 then 11.33 12.04 10.38; 11.33 12.04 10.38 then 10.99 11.94 10.36; 10.99 11.94 10.36 then 11.61 12.04 10.41; 11.61 12.04 10.41 then 10.44 11.77 10.34; 10.44 11.77 10.34 then 9.75 11.58 10.29):

- `sessions/terminal/commands-pane.test.ts`, tag reason "starts a private tmux server and runs a shell task in a real pane". It starts a real tmux (through `tests/server/machine/pty/tmux-fixture.ts`, whose module load runs `tmux -V`, so the tag is on the whole file and the quick tests never load it) and runs a shell task. It is the only test of the capture action joined to the commands store; `tests/server/machine/pty/task.test.ts` covers the capture action alone (another sweep's folder, T1c's, so the orchestrator checks it is still there once both sweeps have landed).
- `sources/repositories/diff/hunks-git.test.ts`, tag reason "starts git in a child process for each case". Its cause is `spawnSync` of git in each case (the table is one `it.each` under a whole-file tag).

Times of each tagged test:

- `tests/state/sessions/terminal/commands-pane.test.ts`, "a task in a real pane, read by the commands store reads the diagnostics printed after the grid let go, each from the folder of its command": 176.1, 173.8, 180.8, 182.0, 176.0 ms (minimum 173.8)
- `tests/state/sources/repositories/diff/hunks-git.test.ts`, "the hunks against git finds git's changes and git's hunks for a one-line change": 29.3, 27.1, 29.1, 122.4, 26.6 ms (minimum 26.6)
- `tests/state/sources/repositories/diff/hunks-git.test.ts`, "the hunks against git finds git's changes and git's hunks for two changes six lines apart": 28.6, 21.5, 21.6, 19.5, 20.8 ms (minimum 19.5)
- `tests/state/sources/repositories/diff/hunks-git.test.ts`, "the hunks against git finds git's changes and git's hunks for two changes seven lines apart": 23.5, 22.5, 19.4, 34.6, 180.9 ms (minimum 19.4)
- `tests/state/sources/repositories/diff/hunks-git.test.ts`, "the hunks against git finds git's changes and git's hunks for a deletion at the top": 25.9, 28.1, 23.5, 16.0, 22.7 ms (minimum 16.0)
- `tests/state/sources/repositories/diff/hunks-git.test.ts`, "the hunks against git finds git's changes and git's hunks for an insertion at the end": 28.8, 30.1, 225.4, 28.2, 26.7 ms (minimum 26.7)

No quick test has a minimum of 80 ms or more over the five runs. The twelve slowest quick tests, with all five times (the other runs' maxima include scheduling noise: `sources/explorer/sections/sections.test.ts` 'Outline reads LaTeX sectioning commands outside comments: S > T' reached 443.6 ms once and has a minimum of 21.2 ms):

- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places pushes and pulls every node on a drag of a pillar into the ": 51.7, 55.3, 52.0, 65.9, 56.3 ms (minimum 51.7)
- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places answers the settled nodes and a cold simulation for a loade": 50.1, 49.4, 45.6, 52.8, 57.6 ms (minimum 45.6)
- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places keeps every circle off a node with no edge dragged across t": 39.3, 39.9, 37.0, 42.3, 45.9 ms (minimum 37.0)
- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places settles every node finite, inside the box and apart from ev": 34.4, 34.6, 33.0, 34.8, 35.6 ms (minimum 33.0)
- `tests/state/system/settings/editors-draft.test.ts`, "the shipped lists and families as drafts read into a draft, each field as flow text, and back to the value the": 35.9, 31.5, 29.2, 30.5, 30.6 ms (minimum 29.2)
- `tests/state/sources/search/replace.test.ts`, "replacing from a tab replaces every listed hit under the query the answer was found by and takes them out of t": 26.5, 32.6, 37.5, 31.4, 25.6 ms (minimum 25.6)
- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places moves no node and leaves alpha as it was on a press": 25.4, 27.1, 26.4, 31.0, 28.8 ms (minimum 25.4)
- `tests/state/sessions/latex/building.test.ts`, "a main file is building from the request to the end of its terminal is true while the request is out and while": 27.4, 26.6, 28.2, 24.4, 25.2 ms (minimum 24.4)
- `tests/state/system/docs.test.ts`, "the documents of a project asks the endpoint once for a pair and holds the answer": 26.1, 30.0, 33.3, 28.7, 24.2 ms (minimum 24.2)
- `tests/state/boards/structure/forces.test.ts`, "the Map's forces over the dense graph neato places frees a node on a release after a press that did not move": 23.8, 25.1, 26.2, 29.3, 29.6 ms (minimum 23.8)
- `tests/state/sources/fs-channel.test.ts`, "keeps a pending bookmark marker on the later root message and makes the page read again": 26.3, 42.9, 26.4, 30.3, 22.9 ms (minimum 22.9)
- `tests/state/sessions/terminal/commands.test.ts`, "the commands of a repository asks once however often it is read, and holds the answer": 24.6, 26.8, 32.1, 32.0, 22.4 ms (minimum 22.4)

The slowest test of each of the 204 files that ran quick, as its minimum and its maximum over the five runs above (the load averages are those of the five-run table; the two tagged files did not run in these runs):

```
file                                                           min ms max ms
boards/board/board-docs.test.ts                                   1.0    3.8
boards/board/board-filter-menu.test.ts                            1.3    1.4
boards/board/board-filters.test.ts                                1.3    3.1
boards/board/board-more.test.ts                                   2.2    3.3
boards/board/board-software.test.ts                               1.1    2.5
boards/board/board-words.test.ts                                  0.8    1.9
boards/board/board.test.ts                                        1.1    1.9
boards/board/personal.test.ts                                     6.3    9.2
boards/career.test.ts                                             1.1    1.7
boards/collection/collection-fields.test.ts                       6.3    9.9
boards/collection/collection.test.ts                              6.3    7.6
boards/collection/view-reads.test.ts                              1.4    1.7
boards/focus/focus-config.test.ts                                 0.7    1.8
boards/focus/focus-lanes.test.ts                                  8.9   11.9
boards/focus/focus-side-project.test.ts                          17.3   48.0
boards/focus/focus.test.ts                                        1.0    2.2
boards/person.test.ts                                             1.1    1.3
boards/pins.test.ts                                               7.6   12.5
boards/project-context.test.ts                                    0.8    0.8
boards/structure/forces.test.ts                                  51.7   65.9
boards/structure/graph.test.ts                                    2.0    2.5
boards/structure/layout.test.ts                                  15.7   43.9
boards/structure/lines.test.ts                                    1.5    2.9
client/client-state.test.ts                                      14.8   20.5
client/clock.test.ts                                              7.3   15.1
client/config-seed.test.ts                                       16.5   23.1
client/entities.test.ts                                           7.1    9.9
client/queries.test.ts                                           17.9   42.4
client/selectors.test.ts                                         10.9   21.9
client/terminal/terminal-close.test.ts                           10.8   19.4
client/terminal/terminal-start.test.ts                           12.5   15.2
client/terminal/terminal-tabs.test.ts                            12.2   15.9
client/writes.test.ts                                            12.6   14.9
feeds/feeds.test.ts                                               6.2    7.6
feeds/idents.test.ts                                              1.5    2.5
feeds/inbox-store.test.ts                                        18.4   25.3
feeds/inbox.test.ts                                               1.2    2.0
feeds/lead-application.test.ts                                    1.5    2.6
feeds/leads.test.ts                                               6.3    7.9
feeds/linkedin.test.ts                                            7.8    9.9
feeds/radar.test.ts                                               7.1   12.9
forms/form-drafts.test.ts                                         8.8   16.9
forms/form-values.test.ts                                         2.1    3.3
forms/manifest-draft.test.ts                                      8.4    9.0
forms/schema-modelled.test.ts                                    19.0   28.0
forms/schema.test.ts                                              0.9    1.7
life/accounts-store.test.ts                                      15.8   22.2
life/calendar-store.test.ts                                      16.0   24.4
life/calendar.test.ts                                             0.8    1.1
life/memories-message.test.ts                                    13.1   24.4
life/notes.test.ts                                                1.7    4.7
life/present.test.ts                                              7.0   14.7
life/slides.test.ts                                               1.1    2.1
sessions/agents.test.ts                                          15.8   18.0
sessions/changes.test.ts                                         19.8   22.7
sessions/folds.test.ts                                            6.2    7.4
sessions/hooks.test.ts                                            1.7    2.2
sessions/latex/building.test.ts                                  24.4   28.2
sessions/latex/folder.test.ts                                    20.6   26.0
sessions/latex/project.test.ts                                   20.1   27.2
sessions/source.test.ts                                          13.8   16.0
sessions/source/source-options.test.ts                            1.5    3.1
sessions/source/symbols.test.ts                                  14.6   44.3
sessions/source/view-source.test.ts                               1.0    2.4
sessions/source/wrap.test.ts                                     11.4   16.8
sessions/terminal/commands-output.test.ts                        16.6   20.1
sessions/terminal/commands.test.ts                               22.4   32.1
sessions/terminal/composer.test.ts                               18.1   23.3
sessions/terminal/pty/pty-io.test.ts                             12.8   23.9
sessions/terminal/pty/pty-socket.test.ts                         15.6   23.0
sessions/terminal/terminal-marks.test.ts                          1.1    1.5
sessions/terminal/terminal-row.test.ts                            3.3    6.9
sessions/terminal/terminal-tabs.test.ts                           4.1    8.3
sessions/terminal/viewport.test.ts                                5.6   11.7
sessions/terminals.test.ts                                       12.4   17.3
sessions/transcript.test.ts                                      14.6   20.9
shared/answers.test.ts                                            1.2    2.2
shared/instance-state-feeds.test.ts                               1.5    2.3
shared/instance-state-files.test.ts                               3.1    4.1
shared/instance-state-sources.test.ts                             2.1    2.4
shared/instance-state.test.ts                                     2.4    4.3
shared/stores/shell.test.ts                                       1.0    1.4
shared/words/appearance.test.ts                                   2.0    4.2
shared/words/format.test.ts                                       1.0    1.2
shared/words/generation.test.ts                                   9.2   11.7
shared/words/themes.test.ts                                       1.6    3.2
shared/words/tones.test.ts                                        1.7    3.1
shared/words/wrap-tabs.test.ts                                    1.6    2.8
sources/datasets.test.ts                                          6.9   11.8
sources/explorer/acts/confirm.test.ts                             1.4    3.4
sources/explorer/acts/drop.test.ts                                1.1    1.9
sources/explorer/acts/folders.test.ts                             1.3    3.2
sources/explorer/acts/keys.test.ts                                1.1    1.2
sources/explorer/acts/selection.test.ts                           1.1    2.9
sources/explorer/acts/store.test.ts                              19.6   25.5
sources/explorer/acts/undo.test.ts                                1.1    2.4
sources/explorer/clipboard.client.test.ts                        10.5   16.3
sources/explorer/explorer.test.ts                                 6.0    7.8
sources/explorer/naming.test.ts                                   1.8    3.7
sources/explorer/ops.test.ts                                     13.0   15.7
sources/explorer/rows/rows.test.ts                                1.1    2.8
sources/explorer/sections/open-editors-tabs.test.ts               1.8    3.8
sources/explorer/sections/sections.test.ts                       21.2  443.6
sources/explorer/view/card-tree.test.ts                           1.1    1.4
sources/explorer/view/view.test.ts                                2.4    3.5
sources/files.test.ts                                            21.1   27.7
sources/follow.test.ts                                            2.0    3.1
sources/fs-channel.test.ts                                       22.9   42.9
sources/fs/file-language.test.ts                                  7.4    9.9
sources/fs/fs-answers.test.ts                                    11.8   17.4
sources/fs/fs-files.test.ts                                      13.2   18.4
sources/fs/fs-notes.test.ts                                      16.3   17.1
sources/fs/fs-shape.test.ts                                       5.8    8.9
sources/fs/fs-text-fresh.test.ts                                 15.7   21.8
sources/fs/fs.test.ts                                            14.3   19.1
sources/fs/languages-selector.client.test.ts                     16.4   23.8
sources/repositories/capabilities/open-worktree.test.ts          11.9   20.2
sources/repositories/capabilities/repositories-badge.test.ts     14.8   20.7
sources/repositories/capabilities/store-actions.test.ts           1.6    1.7
sources/repositories/capabilities/store-wire.test.ts              3.7    7.2
sources/repositories/capabilities/view-state.test.ts              0.9    1.2
sources/repositories/diff/comment-draft.client.test.ts            3.4    5.3
sources/repositories/diff/diff-read.test.ts                       1.3    2.0
sources/repositories/diff/diff-view.test.ts                       2.1    4.7
sources/repositories/diff/diff.test.ts                            1.5    2.5
sources/repositories/diff/merge.test.ts                           1.4    3.0
sources/repositories/diff/review-comment.test.ts                  0.8    1.9
sources/repositories/history/change-tree.test.ts                  7.3    8.7
sources/repositories/history/file-git.test.ts                     1.2    2.3
sources/repositories/history/graph.test.ts                        1.1    1.3
sources/repositories/view/answers.test.ts                         1.1    2.3
sources/repositories/view/commit-action.test.ts                   0.7    1.7
sources/repositories/view/diff-session.test.ts                    1.6    3.5
sources/repositories/view/repositories.test.ts                   12.3   16.9
sources/repositories/view/view-state.test.ts                      2.0    2.9
sources/search/endpoint.test.ts                                   9.6   11.3
sources/search/hits.test.ts                                       0.8    1.9
sources/search/replace.test.ts                                   25.6   37.5
sources/search/search.test.ts                                     9.8   14.7
sources/venues.test.ts                                            7.2    9.3
system/audit-message.test.ts                                      0.7    1.6
system/audit.test.ts                                              7.3    9.0
system/config-files.test.ts                                       0.7    1.1
system/deposit.test.ts                                           19.0   23.4
system/docs.test.ts                                              24.2   33.3
system/lines.test.ts                                             14.8   18.8
system/machine/hpc.test.ts                                       19.0   23.0
system/machine/processes.test.ts                                 17.2   24.8
system/machine/usage-refresh.test.ts                             19.1   35.0
system/machine/usage.test.ts                                      1.0    3.0
system/settings/browser.test.ts                                   1.0    1.7
system/settings/contents.test.ts                                  1.0    2.2
system/settings/editors-draft.test.ts                            29.2   35.9
system/settings/editors-writer.test.ts                           16.2   22.4
system/settings/folders.test.ts                                   7.0   10.0
system/settings/origins.test.ts                                   1.5    3.8
system/settings/rows.test.ts                                     12.4   16.8
system/settings/search.test.ts                                    2.6    6.1
system/settings/write.test.ts                                     7.1   16.1
workbench/drag.test.ts                                            6.5   11.2
workbench/layout/instance.test.ts                                 1.9    3.2
workbench/layout/layout-close.test.ts                            11.0   16.4
workbench/layout/layout-parts.test.ts                             2.6    5.4
workbench/layout/layout-store.test.ts                             7.4   11.8
workbench/layout/layout.test.ts                                   1.4    1.9
workbench/layout/nested.test.ts                                   8.4    9.7
workbench/layout/open/floats-store.test.ts                        9.3   14.3
workbench/layout/open/floats.test.ts                              3.2    4.5
workbench/layout/open/kept-panes.test.ts                          7.5    8.9
workbench/layout/open/landing.test.ts                             7.5   11.5
workbench/layout/open/locked.test.ts                              6.5   10.1
workbench/layout/open/new-text-file.test.ts                       0.9    1.9
workbench/layout/open/pinned.test.ts                              8.1   15.2
workbench/layout/open/preview.test.ts                            12.8   17.0
workbench/layout/open/session-lock.test.ts                        7.8   16.5
workbench/layout/open/show-in-files.test.ts                      12.3   25.0
workbench/layout/pages.test.ts                                    7.4   13.6
workbench/layout/saved/layout-carry.test.ts                       0.9    1.4
workbench/layout/saved/layout-floats.test.ts                      4.2    9.0
workbench/layout/saved/layout-locked.test.ts                      3.9    5.4
workbench/layout/saved/layout-pinned.test.ts                      4.1    6.2
workbench/layout/saved/layout-saved.test.ts                       2.9    4.7
workbench/layout/saved/layout-shared.test.ts                     10.4   13.7
workbench/layout/saved/layout-system.test.ts                      3.8    5.8
workbench/layout/saved/refusals/layout-parse-refusals.test.ts     2.0    3.5
workbench/layout/saved/refusals/layout-parse-root-refusals.test.ts    3.1    4.0
workbench/layout/saved/refusals/layout-refusals.test.ts           1.1    1.8
workbench/layout/saved/refusals/layout-workbench-refusals.test.ts    1.6    3.5
workbench/navigation/arrangement.test.ts                          9.9   15.1
workbench/navigation/catalogue.test.ts                            6.3    7.7
workbench/navigation/editor-status.test.ts                        0.8    1.6
workbench/navigation/editor-text.test.ts                          0.9    1.6
workbench/navigation/notice-sources.test.ts                      12.2   14.2
workbench/navigation/notices.test.ts                              1.5    3.0
workbench/navigation/pages.test.ts                                2.9    4.9
workbench/navigation/rail.test.ts                                 1.2    2.6
workbench/navigation/registry.test.ts                            15.0   34.9
workbench/navigation/status.test.ts                               6.7    8.2
workbench/palette.test.ts                                         7.0   12.5
workbench/rail-badges.test.ts                                    14.1   17.7
workbench/selection.test.ts                                       6.2   11.3
workbench/ui-load.test.ts                                         7.4   10.4
workbench/ui-shared.test.ts                                       8.7   12.3
workbench/ui.test.ts                                              7.1   12.9
```

## Every file of `tests/state`

One row per `.ts` file of the worktree plus the three that are gone. "Tests before" and "Tests after" are the vitest counts of the base run and the final run; "-" means the file did not exist or holds no test. A file marked "read, kept whole" was read test by test and not edited, and its head comment is the old one (58 unchanged files keep their old head; each of the 167 changed files opens with `// Layer 2, client-state tests.` or `// Layer 2, client-state test helper.`). The detail of every changed file follows the table.

| File | Tests before | Tests after | State |
|---|---|---|---|
| tests/state/boards/board/board-docs.test.ts | 3 | 3 | read, kept whole |
| tests/state/boards/board/board-filter-menu.test.ts | 6 | 6 | read, kept whole |
| tests/state/boards/board/board-filters.test.ts | 38 | 37 | changed |
| tests/state/boards/board/board-fixture.ts | - | - | helper, read, kept whole |
| tests/state/boards/board/board-more.test.ts | 4 | 2 | changed |
| tests/state/boards/board/board-software.test.ts | 7 | 6 | changed |
| tests/state/boards/board/board-words.test.ts | 35 | 33 | changed |
| tests/state/boards/board/board.test.ts | 36 | 34 | changed |
| tests/state/boards/board/personal.test.ts | 20 | 20 | read, kept whole |
| tests/state/boards/board/side-fixture.ts | - | - | helper, read, kept whole |
| tests/state/boards/career.test.ts | 14 | 8 | changed |
| tests/state/boards/collection/collection-fields.test.ts | 56 | 56 | read, kept whole |
| tests/state/boards/collection/collection.test.ts | 64 | 53 | changed |
| tests/state/boards/collection/view-reads.test.ts | 7 | 7 | read, kept whole |
| tests/state/boards/focus/focus-config.test.ts | 51 | 51 | read, kept whole |
| tests/state/boards/focus/focus-lanes.test.ts | 45 | 45 | read, kept whole |
| tests/state/boards/focus/focus-side-project.test.ts | 1 | 1 | read, kept whole |
| tests/state/boards/focus/focus.test.ts | 51 | 43 | changed |
| tests/state/boards/person.test.ts | 7 | 6 | changed |
| tests/state/boards/pins.test.ts | 13 | 13 | read, kept whole |
| tests/state/boards/project-context.test.ts | 2 | 2 | read, kept whole |
| tests/state/boards/structure/forces.test.ts | 15 | 13 | changed |
| tests/state/boards/structure/graph.test.ts | 25 | 25 | read, kept whole |
| tests/state/boards/structure/layout.test.ts | 21 | 20 | changed |
| tests/state/boards/structure/lines.test.ts | 12 | 11 | changed |
| tests/state/boards/structure/map-fixture.ts | - | - | helper, read, kept whole |
| tests/state/client/client-state.test.ts | 8 | 7 | changed |
| tests/state/client/clock.test.ts | 4 | 4 | read, kept whole |
| tests/state/client/config-seed.test.ts | 33 | 33 | read, kept whole |
| tests/state/client/entities.test.ts | 7 | 5 | changed |
| tests/state/client/fetch-record.ts | - | - | new helper (recording fetch stub shared by system/machine/hpc.test.ts and sessions/terminal/pty/pty-fixture.ts) |
| tests/state/client/queries.test.ts | 32 | 29 | changed |
| tests/state/client/selectors.test.ts | 58 | 57 | changed |
| tests/state/client/socket-stub.ts | - | - | helper, read, kept whole |
| tests/state/client/socket-timing.test.ts | 1 | - | deleted (a measurement) |
| tests/state/client/terminal/terminal-close.test.ts | 21 | 21 | changed |
| tests/state/client/terminal/terminal-start.test.ts | 20 | 20 | changed |
| tests/state/client/terminal/terminal-tabs-fixture.ts | - | - | helper, changed |
| tests/state/client/terminal/terminal-tabs.test.ts | 36 | 36 | changed |
| tests/state/client/writes.test.ts | 31 | 34 | changed |
| tests/state/feeds/feeds.test.ts | 25 | 26 | changed |
| tests/state/feeds/idents.test.ts | 16 | 16 | read, kept whole |
| tests/state/feeds/inbox-store.test.ts | 15 | 17 | changed |
| tests/state/feeds/inbox.test.ts | 11 | 11 | changed |
| tests/state/feeds/lead-application.test.ts | 26 | 25 | changed |
| tests/state/feeds/leads.test.ts | 60 | 57 | changed |
| tests/state/feeds/linkedin.test.ts | 18 | 18 | changed |
| tests/state/feeds/radar.test.ts | 43 | 41 | changed |
| tests/state/forms/form-drafts.test.ts | 127 | 119 | changed |
| tests/state/forms/form-values.test.ts | 93 | 91 | changed |
| tests/state/forms/manifest-draft.test.ts | 15 | 19 | changed |
| tests/state/forms/schema-modelled.test.ts | 15 | 15 | changed |
| tests/state/forms/schema.test.ts | 82 | 81 | changed |
| tests/state/life/accounts-store.test.ts | 34 | 30 | changed |
| tests/state/life/calendar-store.test.ts | 10 | 9 | changed |
| tests/state/life/calendar.test.ts | 24 | 23 | changed |
| tests/state/life/memories-message.test.ts | 27 | 22 | changed |
| tests/state/life/notes.test.ts | 38 | 42 | changed |
| tests/state/life/present.test.ts | 81 | 78 | changed |
| tests/state/life/slides.test.ts | 22 | 21 | changed |
| tests/state/sessions/agents.test.ts | 30 | 22 | changed |
| tests/state/sessions/changes.test.ts | 26 | 23 | changed |
| tests/state/sessions/folds.test.ts | 48 | 51 | changed |
| tests/state/sessions/hooks.test.ts | 3 | 4 | changed |
| tests/state/sessions/latex/building.test.ts | 13 | 13 | read, kept whole |
| tests/state/sessions/latex/folder.test.ts | 31 | 30 | changed |
| tests/state/sessions/latex/latex-fixture.ts | - | - | helper, read, kept whole |
| tests/state/sessions/latex/project.test.ts | 23 | 17 | changed |
| tests/state/sessions/source.test.ts | 64 | 63 | changed |
| tests/state/sessions/source/source-options.test.ts | 13 | 13 | changed |
| tests/state/sessions/source/symbols.test.ts | 10 | 10 | changed |
| tests/state/sessions/source/view-source.test.ts | 9 | 25 | changed |
| tests/state/sessions/source/wrap.test.ts | 13 | 13 | read, kept whole |
| tests/state/sessions/terminal/commands-fixture.ts | - | - | helper, read, kept whole |
| tests/state/sessions/terminal/commands-output.test.ts | 24 | 23 | changed |
| tests/state/sessions/terminal/commands-pane.test.ts | 1 | 1 | changed |
| tests/state/sessions/terminal/commands.test.ts | 43 | 43 | read, kept whole |
| tests/state/sessions/terminal/composer.test.ts | 42 | 41 | changed |
| tests/state/sessions/terminal/pty-io.test.ts | 44 | - | moved to sessions/terminal/pty/pty-io.test.ts |
| tests/state/sessions/terminal/pty/pty-fixture.ts | - | - | new helper (FakeSocket, connected, serving; split out of sessions/terminals.test.ts) |
| tests/state/sessions/terminal/pty/pty-io.test.ts | - | 33 | moved from sessions/terminal/pty-io.test.ts, then edited |
| tests/state/sessions/terminal/pty/pty-socket.test.ts | - | 29 | new test file (the socket cases split out of sessions/terminals.test.ts) |
| tests/state/sessions/terminal/terminal-marks.test.ts | 11 | 10 | changed |
| tests/state/sessions/terminal/terminal-row.test.ts | 17 | 17 | changed |
| tests/state/sessions/terminal/terminal-tabs.test.ts | 57 | 54 | changed |
| tests/state/sessions/terminal/viewport.test.ts | 9 | 9 | read, kept whole |
| tests/state/sessions/terminals.test.ts | 64 | 33 | changed |
| tests/state/sessions/transcript.test.ts | 27 | 26 | changed |
| tests/state/shared/answers.test.ts | - | 14 | new test file (failedAnswer, refusedAnswer, refusalSentence once) |
| tests/state/shared/instance-fixture.ts | - | - | helper, changed |
| tests/state/shared/instance-state-feeds.test.ts | 280 | 146 | changed |
| tests/state/shared/instance-state-files.test.ts | 518 | 312 | changed |
| tests/state/shared/instance-state-sources.test.ts | 360 | 170 | changed |
| tests/state/shared/instance-state.test.ts | 473 | 235 | changed |
| tests/state/shared/stores/shell.test.ts | 2 | 2 | read, kept whole |
| tests/state/shared/words/appearance.test.ts | 142 | 67 | changed |
| tests/state/shared/words/format.test.ts | 15 | 15 | read, kept whole |
| tests/state/shared/words/generation.test.ts | 5 | 3 | changed |
| tests/state/shared/words/themes.test.ts | 25 | 12 | changed |
| tests/state/shared/words/tones.test.ts | 99 | 58 | changed |
| tests/state/shared/words/wrap-tabs.test.ts | 13 | 5 | changed |
| tests/state/sources/datasets.test.ts | 17 | 4 | changed |
| tests/state/sources/explorer/acts/confirm.test.ts | 3 | 3 | read, kept whole |
| tests/state/sources/explorer/acts/drop.test.ts | 11 | 11 | read, kept whole |
| tests/state/sources/explorer/acts/folders.test.ts | 11 | 11 | changed |
| tests/state/sources/explorer/acts/keys.test.ts | 48 | 15 | changed |
| tests/state/sources/explorer/acts/selection.test.ts | 13 | 13 | read, kept whole |
| tests/state/sources/explorer/acts/store.test.ts | 19 | 19 | read, kept whole |
| tests/state/sources/explorer/acts/undo.test.ts | 12 | 12 | read, kept whole |
| tests/state/sources/explorer/clipboard.client.test.ts | 2 | 2 | read, kept whole |
| tests/state/sources/explorer/explorer.test.ts | 25 | 21 | changed |
| tests/state/sources/explorer/naming.test.ts | 17 | 17 | changed |
| tests/state/sources/explorer/ops.test.ts | 40 | 39 | changed |
| tests/state/sources/explorer/rows/rows.test.ts | 27 | 27 | read, kept whole |
| tests/state/sources/explorer/sections/open-editors-tabs.test.ts | 6 | 6 | changed |
| tests/state/sources/explorer/sections/sections.test.ts | 21 | 20 | changed |
| tests/state/sources/explorer/view/card-tree.test.ts | 8 | 7 | changed |
| tests/state/sources/explorer/view/view.test.ts | 10 | 8 | changed |
| tests/state/sources/explorer/watch.svelte.ts | - | - | helper, read, kept whole |
| tests/state/sources/files.test.ts | 49 | 27 | changed |
| tests/state/sources/follow.test.ts | 12 | 9 | changed |
| tests/state/sources/fs-channel.test.ts | 2 | 2 | changed |
| tests/state/sources/fs/file-language.test.ts | 15 | 7 | changed |
| tests/state/sources/fs/fs-answers.test.ts | 136 | 60 | changed |
| tests/state/sources/fs/fs-files.test.ts | 14 | 13 | changed |
| tests/state/sources/fs/fs-fixture.ts | - | - | helper, changed |
| tests/state/sources/fs/fs-notes.test.ts | 16 | 14 | changed |
| tests/state/sources/fs/fs-shape.test.ts | 41 | 35 | changed |
| tests/state/sources/fs/fs-text-fresh.test.ts | 3 | 2 | changed |
| tests/state/sources/fs/fs.test.ts | 14 | 10 | changed |
| tests/state/sources/fs/languages-selector.client.test.ts | 1 | 1 | read, kept whole |
| tests/state/sources/off-facets.ts | - | - | deleted (helper nothing imports any more) |
| tests/state/sources/repositories/capabilities/open-worktree.test.ts | 1 | 1 | read, kept whole |
| tests/state/sources/repositories/capabilities/repositories-badge.test.ts | 8 | 7 | changed |
| tests/state/sources/repositories/capabilities/store-actions.test.ts | 20 | 19 | changed |
| tests/state/sources/repositories/capabilities/store-wire.test.ts | 2 | 2 | read, kept whole |
| tests/state/sources/repositories/capabilities/view-state.test.ts | 10 | 8 | changed |
| tests/state/sources/repositories/diff/comment-draft.client.test.ts | 16 | 16 | changed |
| tests/state/sources/repositories/diff/diff-read.test.ts | 8 | 8 | read, kept whole |
| tests/state/sources/repositories/diff/diff-view.test.ts | 15 | 14 | changed |
| tests/state/sources/repositories/diff/diff.test.ts | 32 | 32 | read, kept whole |
| tests/state/sources/repositories/diff/hunks-git.test.ts | 5 | 5 | changed |
| tests/state/sources/repositories/diff/merge.test.ts | 17 | 16 | changed |
| tests/state/sources/repositories/diff/review-comment.test.ts | 35 | 31 | changed |
| tests/state/sources/repositories/diff/rooted.svelte.ts | - | - | helper, read, kept whole |
| tests/state/sources/repositories/history/change-tree.test.ts | 23 | 21 | changed |
| tests/state/sources/repositories/history/file-git.test.ts | 10 | 10 | changed |
| tests/state/sources/repositories/history/graph.test.ts | 18 | 14 | changed |
| tests/state/sources/repositories/layout-recorder.ts | - | - | helper, read, kept whole |
| tests/state/sources/repositories/view/answers.test.ts | 39 | 38 | changed |
| tests/state/sources/repositories/view/commit-action.test.ts | 11 | 11 | read, kept whole |
| tests/state/sources/repositories/view/diff-session.test.ts | 13 | 11 | changed |
| tests/state/sources/repositories/view/repositories.test.ts | 48 | 39 | changed |
| tests/state/sources/repositories/view/view-state.test.ts | 24 | 18 | changed |
| tests/state/sources/search/endpoint.test.ts | 33 | 21 | changed |
| tests/state/sources/search/hits.test.ts | 12 | 12 | read, kept whole |
| tests/state/sources/search/replace.test.ts | 24 | 24 | changed |
| tests/state/sources/search/search-fixture.ts | - | - | helper, read, kept whole |
| tests/state/sources/search/search.test.ts | 90 | 89 | changed |
| tests/state/sources/venues.test.ts | 37 | 21 | changed |
| tests/state/system/audit-message.test.ts | 5 | 6 | changed |
| tests/state/system/audit.test.ts | 8 | 7 | changed |
| tests/state/system/config-files.test.ts | 5 | 4 | changed |
| tests/state/system/deposit.test.ts | 30 | 16 | changed |
| tests/state/system/docs.test.ts | 91 | 59 | changed |
| tests/state/system/lines.test.ts | 78 | 40 | changed |
| tests/state/system/machine/hpc.test.ts | 80 | 33 | changed |
| tests/state/system/machine/processes.test.ts | 43 | 34 | changed |
| tests/state/system/machine/usage-refresh.test.ts | 21 | 12 | changed |
| tests/state/system/machine/usage.test.ts | 5 | 5 | read, kept whole |
| tests/state/system/settings/browser.test.ts | 4 | 3 | changed |
| tests/state/system/settings/contents.test.ts | 7 | 7 | changed |
| tests/state/system/settings/editors-draft.test.ts | 38 | 34 | changed |
| tests/state/system/settings/editors-writer.test.ts | 29 | 29 | changed |
| tests/state/system/settings/fixture.ts | - | - | helper, read, kept whole |
| tests/state/system/settings/folders.test.ts | 11 | 10 | changed |
| tests/state/system/settings/origins.test.ts | 7 | 7 | changed |
| tests/state/system/settings/rows.test.ts | 31 | 30 | changed |
| tests/state/system/settings/search.test.ts | 17 | 16 | changed |
| tests/state/system/settings/write.test.ts | 26 | 23 | changed |
| tests/state/workbench/drag.test.ts | 37 | 39 | changed |
| tests/state/workbench/layout/instance.test.ts | 87 | 50 | changed |
| tests/state/workbench/layout/layout-close.test.ts | 8 | 5 | changed |
| tests/state/workbench/layout/layout-fixture.ts | - | - | helper, read, kept whole |
| tests/state/workbench/layout/layout-parts.test.ts | 18 | 18 | changed |
| tests/state/workbench/layout/layout-store.test.ts | 39 | 36 | changed |
| tests/state/workbench/layout/layout.test.ts | 59 | 48 | changed |
| tests/state/workbench/layout/nested.test.ts | 41 | 37 | changed |
| tests/state/workbench/layout/open/floats-store.test.ts | 34 | 29 | changed |
| tests/state/workbench/layout/open/floats.test.ts | 42 | 40 | changed |
| tests/state/workbench/layout/open/kept-panes.test.ts | 22 | 20 | changed |
| tests/state/workbench/layout/open/landing.test.ts | 15 | 15 | read, kept whole |
| tests/state/workbench/layout/open/locked.test.ts | 26 | 21 | changed |
| tests/state/workbench/layout/open/new-text-file.test.ts | 3 | 3 | read, kept whole |
| tests/state/workbench/layout/open/pinned.test.ts | 18 | 15 | changed |
| tests/state/workbench/layout/open/preview.test.ts | 14 | 13 | changed |
| tests/state/workbench/layout/open/session-lock.test.ts | 4 | 2 | changed |
| tests/state/workbench/layout/open/show-in-files.test.ts | 36 | 35 | changed |
| tests/state/workbench/layout/pages.test.ts | 58 | 55 | changed |
| tests/state/workbench/layout/saved/layout-carry.test.ts | 17 | 17 | read, kept whole |
| tests/state/workbench/layout/saved/layout-floats.test.ts | 27 | 27 | changed |
| tests/state/workbench/layout/saved/layout-locked.test.ts | 5 | 5 | changed |
| tests/state/workbench/layout/saved/layout-pinned.test.ts | 10 | 9 | changed |
| tests/state/workbench/layout/saved/layout-saved.test.ts | 28 | 21 | changed |
| tests/state/workbench/layout/saved/layout-shared.test.ts | 8 | 8 | read, kept whole |
| tests/state/workbench/layout/saved/layout-system.test.ts | 36 | 36 | changed |
| tests/state/workbench/layout/saved/refusals/layout-parse-refusals.test.ts | 60 | 34 | changed |
| tests/state/workbench/layout/saved/refusals/layout-parse-root-refusals.test.ts | 56 | 40 | changed |
| tests/state/workbench/layout/saved/refusals/layout-refusals.test.ts | 109 | 65 | changed |
| tests/state/workbench/layout/saved/refusals/layout-workbench-refusals.test.ts | 83 | 33 | changed |
| tests/state/workbench/layout/saved/refusals/refusal-fixture.ts | - | - | helper, read, kept whole |
| tests/state/workbench/navigation/arrangement.test.ts | 92 | 57 | changed |
| tests/state/workbench/navigation/catalogue.test.ts | 104 | 61 | changed |
| tests/state/workbench/navigation/editor-status.test.ts | 5 | 4 | changed |
| tests/state/workbench/navigation/editor-text.test.ts | 6 | 6 | changed |
| tests/state/workbench/navigation/notice-sources.test.ts | 36 | 26 | changed |
| tests/state/workbench/navigation/notices.test.ts | 4 | 4 | changed |
| tests/state/workbench/navigation/pages.test.ts | 62 | 38 | changed |
| tests/state/workbench/navigation/rail.test.ts | 70 | 33 | changed |
| tests/state/workbench/navigation/registry.test.ts | 30 | 10 | changed |
| tests/state/workbench/navigation/status.test.ts | 41 | 32 | changed |
| tests/state/workbench/palette.test.ts | 51 | 31 | changed |
| tests/state/workbench/rail-badges-fixture.ts | - | - | helper, read, kept whole |
| tests/state/workbench/rail-badges.test.ts | 103 | 67 | changed |
| tests/state/workbench/selection.test.ts | 17 | 10 | changed |
| tests/state/workbench/ui-load.test.ts | 90 | 51 | changed |
| tests/state/workbench/ui-shared.test.ts | 11 | 10 | changed |
| tests/state/workbench/ui.test.ts | 41 | 26 | changed |

## Removals, folds, retitles and tags, file by file

Each entry names the behaviour a removed test guarded and the kept test that still holds it as `file:line` (or says why it guarded nothing). A holder under `tests/checks`, `tests/data`, `tests/server` or `tests/views` is another sweep's folder and is marked so, for the orchestrator to check once all sweeps have landed. Where an entry says "label", the head comment was rewritten to say once what the file tests and to open with its layer label. Entries of files read and kept whole carry their test count.

boards/board/board-docs.test.ts: read, kept whole (3)
boards/board/board-filter-menu.test.ts: read, kept whole (6)
boards/board/board-filters.test.ts: DEL "changes nothing when it is given no quick filter at all" | guarded: no quick filter leaves every item | held by board-filters.test.ts "leaves everything alone with no filter and no search" [state/boards/board/board-filters.test.ts:150] (same branch: empty filter set, no options) ; kept 37
boards/board/board-fixture.ts: read, kept whole (helper, 5 importers outside)
boards/board/board-more.test.ts: DEL "are none on a board that has remembered nothing" | guarded: empty more list | held by board-filters.test.ts "gives the empty state for anything that is not a map" [state/boards/board/board-filters.test.ts:248] (parseBoardState -> emptyBoardState incl more) and board-more "keeps the ids it wrote" (more:'alpha' -> []); DEL "reads an empty id and a duplicated one as written" | guarded: nothing (asserts that no dedupe/empty-filter happens; a card never has an empty/dup id; failure costs nothing) ; kept 2
boards/board/board-software.test.ts: DEL "names no software while the portfolio holds none" | guarded: card of a project with no related pair names no software | held by board-software.test.ts "names nothing on a project neither end of the link reaches" [state/boards/board/board-software.test.ts:89] (same branch: no pair reaches the project) ; kept 6
boards/board/board-words.test.ts: DEL "keeps an authors line that was written as one string" | guarded: authorLine of a string / empty list + lead | held by board-words.test.ts table "authorLine, an authors field of another type" rows 'a line' [state/boards/board/board-words.test.ts:271] and 'an empty list'; DEL "leaves out an events entry the reader only attended" | guarded: attend-only events not counted as dissemination | held by "finds the events and education entries that name the project" [state/boards/board/board-words.test.ts:226] (exact ids, 'other' absent) and "reads related as the strings of a list and role as the word attend" ; kept 33
boards/board/board.test.ts: DEL "shows the three project tiers on the projects board" | guarded: ids of the projects board | held by "puts the pinned first, then the config type order, then the title" [state/boards/board/board.test.ts:175] (exact id list, same set); DEL "sorts a type the order does not name after every type it does" | guarded: unnamed type last | held by same sort test (echo last in exact list); kept 34
boards/board/personal.test.ts: read, kept whole (20)
boards/board/side-fixture.ts: read, kept whole (helper, 1 importer outside)
boards/career.test.ts: DEL describe 'the host statuses' (4 tests): "are the keys of career_host_status, in the config order" (held by 'reads career_host_status only as a map of maps' [state/boards/career.test.ts:77] which keeps row order), "carry the words the config gives them and a tone rather than a hex" (constants of shipped vocab; tone derivation held by the same synthetic test, keys e..j tone), "name a glyph config/catalogs/glyphs.yml holds in every row" (shipped constants; resolution of glyph names: tests/checks/config/config-folder.test.ts [another sweep's folder]), "are empty for a config that holds no such vocabulary" (same null branch as the 'for held of [[{label}],"x",null]' loop of the synthetic test [state/boards/career.test.ts:77]); DEL describe 'the score dimensions' (2): "are the rows of career_score_dims with their badge letters" (constants; badge derivation held by synthetic 'reads career_score_dims only as a list of maps'), "are empty for a config that holds no such list" (same branch as that test's loop). Setup of the real vocab/config (loadConfig, setVocab(real), afterAll restore) removed: nothing left reads it. Head comment rewritten. kept 8
boards/collection/collection-fields.test.ts: read, kept whole (56)
boards/collection/view-reads.test.ts: read, kept whole (7)
boards/collection/collection.test.ts: DEL 10 (held by boards/collection/collection-fields.test.ts, same module, lower-level tables): "counts each value, in the order the entries first carry it" (held: fields "offers, counts and filters only the statuses that are words" [state/boards/collection/collection-fields.test.ts:105]); "reads an entry's status only when it is a word" (held: fields table 'the status of an entry' [state/boards/collection/collection-fields.test.ts:89] rows a word/a number); "keeps the entries of every selected status and no other" (held: fields "offers, counts and filters ..." [state/boards/collection/collection-fields.test.ts:105] ids(['x'],[])); "searches inside a list and inside a map, not only the top-level words" (held: fields "searches the words inside a list and a map of the fields" [state/boards/collection/collection-fields.test.ts:126]); "hides the entries of a status the facet bar has switched off" (held: fields ids([], ['x','']) [state/boards/collection/collection-fields.test.ts:105]); "falls back to the title when the entry does not carry the identity field" (held: fields table 'the identity value of an entry' [state/boards/collection/collection-fields.test.ts:140] rows null/nothing); describe entrySubtasks 2 tests "reads a list of flow maps, keyed by position, and drops a line with no do" / "reads a map of keys by its own keys, and an entry with no block as nothing" (held: fields 'the subtasks of an entry' [state/boards/collection/collection-fields.test.ts:195] 4 tests); "groups the projects a joint-work entry's person names" (held: fields table 'the person of a joint-work entry' [state/boards/collection/collection-fields.test.ts:41] + the funding case for the group shape); "resolves optionsFrom over a list of strings when inline options are absent" and "resolves optionsFrom over keyed maps and leaves out unassignable rows" (held: fields 'the select choices read from the config' [state/boards/collection/collection-fields.test.ts:262] 4 tests). Head comment rewritten, unused imports entryStatus/entrySubtasks removed. kept 54
boards/focus/focus-config.test.ts: read, kept whole (51)
boards/focus/focus-lanes.test.ts: read, kept whole (45)
boards/focus/focus-side-project.test.ts: read, kept whole (1)
boards/focus/focus.test.ts: DEL describe 'lanes' 2 tests: "reads the nine lanes of vocab.yml in three clusters, each hue already a tone" + "reads the ideas colour and the priority levels out of the same file" (constants of shipped vocab.yml; the readers are held by focus-config.test.ts 'lanes' [state/boards/focus/focus-config.test.ts:100], 'the holding colour', 'priorities and flames'); DEL "leaves holding and an unset focus off every lane" (held: "leaves a coauthor project in holding and an archive project with no focus off every lane" [state/boards/focus/focus.test.ts:356], same branch, laneItems has no tier branch); DEL "counts a blocked project of every tier, not only the ones on the board" (held: "counts a blocked project once even when it is waiting on somebody as well" [state/boards/focus/focus.test.ts:404]: archive blocked projects counted +3); DEL "takes a live lead inside the leads window, leaving one beyond it and a dismissed one" (held: "groups by category in the order of CATEGORIES" [state/boards/focus/focus.test.ts:505] exact list); DEL "leaves a submitted paper off, since its own deadline is met" (held: same exact list + "takes a project deadline that has passed" [state/boards/focus/focus.test.ts:497] exact overdue list); DEL "keeps a dated subtask on the command center and moves an undated one to the tasks" (held: "takes a pending subtask with its days and leaves the one already done" [state/boards/focus/focus.test.ts:546] + "groups an undated subtask by the kind of the entry that holds it"); DEL "reads the threshold of each feed out of refresh_stale_days" (constants 14/2/7 of shipped config; the threshold is exercised by "nudges the feeds that are past their threshold" [state/boards/focus/focus.test.ts:708]); RETITLE "counts the inbox the channel gave and the days since the last post, and warns on venue load" -> without "and warns on venue load" (false: no venue load in the test); head comment rewritten, unused imports removed. kept 36
boards/person.test.ts: DEL "joins every organisation the entry names, in its own order, the primary first" | guarded: organisations in affiliation order | held by "joins the entry, the organisations, the joint work and the projects" [state/boards/person.test.ts:162] (names KU Leuven then UZ Leuven in that order); kept 6
boards/pins.test.ts: read, kept whole (5 tests). The pins here are the session pins an instance keeps (openView, restateInstance), not the pinned-tab order that workbench/layout/open/pinned.test.ts and workbench/layout/saved/layout-pinned.test.ts hold, so no case repeats one of theirs.
boards/project-context.test.ts: read, kept whole (2)
boards/structure/forces.test.ts: DEL "audits that an empty node set settles to no node" (d3 over [] with no oculus branch: forces.ts createForces/settleForces/clampToBox loop over the list, layout.ts:240-241 mapPlacement; first run found no oculus code on this path); DEL "settles one node finite and inside the box" | guarded: a node outside the box comes back in | held by "puts a node outside the box back inside and takes out its speed out of the box" [state/boards/structure/forces.test.ts:278] (clampToBox itself, lowest level) and "parts five nodes placed on one point" (settleForces runs ticks); kept 13
boards/structure/graph.test.ts: read, kept whole (25)
boards/structure/layout.test.ts: DEL "leaves out an item that is null, as it does one that is a number" | guarded: null item in Graphviz answer does not throw/place | held by "places the node a position beside an item that is null names" [state/boards/structure/layout.test.ts:355] and "places no node for names that are not n and an index" ; kept 20
boards/structure/lines.test.ts: DEL "keep a keyed row with its label and colour, label a bare key by itself, and drop the rest" | guarded: venueTiers row reading | held by "drops a row whose key is not a string and keeps a colour only when it is a string" [state/boards/structure/lines.test.ts:153] (bare key, label, colour, dropped rows) and "is empty for anything that is not a list"; kept 11
boards/structure/map-fixture.ts: read, kept whole (helper)
client/client-state.test.ts: DEL "holds one instance of every store it names" | guarded: every store of the type is built | held by the TypeScript type of `createClientState` (src/lib/state/client/context.ts:204, checked by `npm run check`, which prints 0 errors) and by every other test that reads a store from the client; RETITLE "audit: replaces exactly the eleven stores..." -> "replaces exactly the eleven stores handed the query client and no other"; kept 7
client/clock.test.ts: read, kept whole (4)
client/config-seed.test.ts: read, kept whole (33)
client/entities.test.ts: DEL "hand back the payload of the latest message" + "hands back the latest usage payload" (pass-through: entities.svelte.ts:68-71 payload() returns messages[channel].payload; the version ordering is held by 'keeps the newer message and drops an older one' [state/client/entities.test.ts:40]; the schema reads are held by config-seed.test.ts); helper snapshot() and unused usage removed; head comment rewritten; kept 5
client/socket-stub.ts: read, kept (imported by config-seed.test.ts and system/machine/processes.test.ts)
client/socket-timing.test.ts: FILE DELETED (measurement: prints elapsed, asserts heard > 0 only)

### client/queries.test.ts
deleted: "audit: calls a query function that throws once..." (no revert turns it red per its comment); "audit: sends one request when the flag goes shown, hidden and shown inside one tick" (same); "builds no query for an empty key, in the cache of the client that docs reads through" (a pass-through; the cache read of docs is held by 'asks the endpoint once for a pair and holds the answer' [state/system/docs.test.ts:121]). retitled: peek/fetch/hold/mark hidden-scope test; Revert comment fixed.

### client/selectors.test.ts
deleted: "reads the window out of the config" (reads shipped config value 1000000; behaviour held by the context_window table "reads a context_window of %j as %j" [state/client/selectors.test.ts:286]). describe 'sessionFor and the context window' renamed 'sessionFor'. head Layer label.

### client/writes.test.ts
folded: 'the time a write waits' 3 tests (positive seconds -> ms, non-positive -> none, it.each of 6) into one it.each of 11 rows with names. Real 50 ms timers replaced by fake timers (vi.useFakeTimers + advanceTimersByTimeAsync) in both 'a write that no answer reaches' tests; first now checks pending at 49 ms and gives up at 50. Head Layer label.

### client/terminal/terminal-close.test.ts
retitled "audits that closes its tab as before and tries to stop nothing" -> "closes the tab of its last terminal and sends no stop for it"; Revert comment rewritten. Head Layer label.

### client/terminal/terminal-start.test.ts
folded: "posts nothing before the hub root is known, and never an empty folder" + "posts one start for each of three presses made before the hub root, once it is known" -> it.each rows 'one press' [state/client/terminal/terminal-start.test.ts:159] / 'three presses' ("posts one start per press, with %s made before the hub root, once it is known"). Head Layer label.

### client/terminal/terminal-tabs.test.ts
deleted/reshaped: "ends its terminals, and a terminal no tab owns is taken by a tab only when shown": the ending half duplicated client/terminal/terminal-close.test.ts "stops the running terminals the tab lists"; the other half kept as 'a terminal no tab owns' > "is taken by a tab only when it is shown, not when the payload lists it". Fetch stub, vi and afterEach removed. The two 'leaves a tab the reader is composing in open, its composer alone and its record kept' cases (the moved one at client/terminal/terminal-tabs.test.ts:138, the ended one at :193) are kept: they reach two different lines of src/lib/state/sessions/terminal/terminal-lists.ts (:123 for a moved terminal, :93 for an ended one), and sessions/terminal/terminal-tabs.test.ts holds only the pure state rule ('leaves a tab that owned one terminal owning none, composing').
### client/terminal/terminal-tabs-fixture.ts: head Layer label only.

### feeds/feeds.test.ts
deleted: "takes a feed its threshold from refresh_stale_days and none from anywhere else" and "never nudges a feed that the key does not name" (same staleAfter branches as the 'reads the limit of the inbox feed from %j' [state/feeds/feeds.test.ts:159] table, three rows added to it: {} -> Infinity; stale_days only -> Infinity; refresh_stale_days + stale_days -> 2). describe retitled 'missing or of the wrong type'. Kept 'feed state' (wiring of the feeds channel to client.feeds.feed).
### feeds/idents.test.ts: read, kept whole (9 tests +table).
### feeds/inbox-store.test.ts
deleted: "answers ok and no sentence when the endpoint took the command" (now row '{"ok":true}' [state/feeds/inbox-store.test.ts:43] of table "takes a command answered with a status below 400 and the body %s as taken", which absorbs the old loop test); "says the code of a refusal only when it is text" (same branch as the refusal test, now titled "...only when the code is text", and the non-text table). 
### feeds/inbox.test.ts
removed from 'reads the kind off the note': the kindTone assertions (constant lookup amber/red/teal/slate, InboxCard.svelte is the only consumer). Folded 3 senderParts tests into it.each 'reads the From line of %s' rows: 'a display name and an address' / 'a quoted display name with a comma inside it' / 'a bare address'.
### feeds/lead-application.test.ts
deleted: "names no lead for a lead with no title" (row ['  ', undefined] of the 'names no lead or the title %j as the lead %j in the tab state' table).
### feeds/leads.test.ts
deleted: "reads a declined lead, and a dismissed one a file may still hold, as declined" (isDeclined cases are in 'recognises closed statuses...' and 'reads a status that is not text'); "sends a dismissed lead to the expired list..." (isExpired(dismissed) in the first test, closed status in expired list in 'sorts live soonest first'); "is every line the meta carries as text..." + its describe (rows of 'reads the run log of the meta %j as %j' [state/feeds/leads.test.ts:278]); fitTone half of 'takes the first fit key...' (shipped leads_fit tones are constants; check tests/checks/config/config-folder.test.ts holds the shipped table; synthetic vocabulary table stays). loadConfig/engineDir import removed.
### feeds/linkedin.test.ts: head Layer label only, 7+6 tests kept whole.
### feeds/radar.test.ts
deleted: "groups in vocabulary order and sends unknown buckets to adjacent" (bucketsOf branch is held by 'groups an entry by the text of its bucket...' [state/feeds/radar.test.ts:126]); "split into the live and the dismissed" (held by 'puts an entry in the dismissed section only for the boolean true or the exact text true' [state/feeds/radar.test.ts:196]); the relevanceTone assertion inside 'sorts by found then relevance' (held by table 'draws the relevance %j in %j' [state/feeds/radar.test.ts:222]). BUCKETS const and RadarBucket import removed. retitled 'sorts ... and marks the entries found on the last run'; describe renamed 'the radar buckets that hold entries'.

### forms/form-drafts.test.ts
deleted: "keeps an empty collection name and an empty entry id as keys of their own" (formKey('', '') added to the keys list of "never gives the add form and an entry whose id is new or null-like one key"); "lets a second value typed into one field replace the first" (held by "forgets what it sent and keeps a value typed while it was on its way" [state/forms/form-drafts.test.ts:146], note typed twice); "leaves out what a saved record holds that no control could" (every case is a row of the parseDrafts tables in 'a saved record of the wrong shape'); "asks nothing of an instance that never held a form" (same branch as formsDirty after clear in "forgets a draft a cancel or a delete threw away" and ui.unsaved in "registers the client own drafts with the close guard"); key-order tests: "answers the collection before the entry", "answers the forms and the fields in the order the record holds them", "answers the added entries in the order the record holds them"; "answers a field as its value, kind and base, in that order, and nothing else" (extra key now row 'more keys than it wrote' [state/forms/form-drafts.test.ts:567, state/forms/form-drafts.test.ts:687] of the 'keeps a field holding %s' table); "answers a draft a plain object of its own" (the prototype assertions are in "skips an own __proto__ field of a draft and keeps the others"). Assertions removed: formsKey(...)===`one${FORMS_SUFFIX}` and addedKey(...)===`one${ADDED_SUFFIX}` (constants), Object.keys(...) order in 'reads the added entry %s'. FORMS_SUFFIX/ADDED_SUFFIX imports removed.
### forms/form-values.test.ts
deleted: describe 'controlValue' (1 test; every assertion is a row of the controlValue table [state/forms/form-values.test.ts:41] or of "holds a metalist as the rows that are maps" [:75]); describe 'savedValue' + test "calls two values the same when the save would write the same" folded into the savedValue/sameSaved tables (rows added: tags '' -> [], metalist trimming, tags 'a,b' vs 'a, b', text 'a,b' vs 'a, b', ' x' vs 'x', empty metalist row, three raw rows); controlValue 'raw' rows duplicating the rawFieldText table removed (7 rows: {} , [], ['a'], 'a', 3, null, undefined); "answers the parsed map keys in the order the text holds them" (engine behaviour); Object.keys order assertion in the metalist rows test. Head sentence adjusted ("open forms ... read first"). describe names: 'controlValue', 'savedValue and sameSaved'.
### forms/manifest-draft.test.ts
folded "reads nothing out of a record that is not a draft" into it.each (5 rows, 'reads %s of a saved record as %j'). head Layer label.
### forms/schema-modelled.test.ts
retitled "opens waiting-on as the model reads it when the manifest text holds a bare word, and validate reports it" -> "opens waiting-on with no list when the manifest text holds a bare word"; the validate finding assertion removed: held by tests/data/snapshot/validate.test.ts:281 (and validate-shapes.test.ts:251). NOT_IN_MODEL not-contain assertions removed (writableField results hold it). join import removed.
### forms/schema.test.ts
deleted: "holds the whole manifest, one field at a time" (46, shipped constant); "keeps the order the file has" (shipped first and last field; order held by "leaves out a field row that is no map, and keeps the order of the rest" [state/forms/schema.test.ts:314]); "resolves a literal list to itself" (shipped options, held by "offers a literal list of options before any source" [state/forms/schema.test.ts:413]); "shows a list as one item per line and reads it back as a list" (rows of the asList/asText tables [state/forms/schema.test.ts:471, :487]); "answers a field as its name, label, ... all present" (key order; presence held by toStrictEqual with bare()). assertions removed: sections.length===7, compute toMatchObject type/from, Object.keys order of a vocabulary choice. folded: pin loop into it.each (5 rows, 'for %s'). retitled "names seven sections and puts every field in one of them" -> "puts every field in one of the sections".

### life/accounts-store.test.ts
deleted: "says in words that a Remove got no answer, and does not reject" and "says in words that a Save answer could not be read, and does not reject" (Add and Connect cases give the same sentences through post/refusalWords; remove and saveHalf failure call-sites are in the 'general refusal of an Add, a Remove, a Connect and a Save' loop); "reads the setup answer the page draws from" (loadSetup success held by "holds a complete setup body as it came" [state/life/accounts-store.test.ts:391]); "holds nothing ... for a body that is JSON null" (null added to the loop of "...JSON null or not a setup map"). 
### life/calendar-store.test.ts
deleted: "says nothing when the endpoint took the command" (held by "takes a command answered below 400 as taken, whatever the body holds" [state/life/calendar-store.test.ts:173]; both commands go through command() in calendar.svelte.ts).
### life/calendar.test.ts
deleted: "carry the view the instance keeps" (pass-through of the view argument); assertions allDayContent/noEventsContent/height removed from "carry the payload's events..." (pass-through of catalog words and a constant), retitled "carry the payload's events, and none without a payload".
### life/memories-message.test.ts
deleted: "matches the server limit" (re-export, server/content/memories.ts re-exports MAX_UPLOAD_BYTES); "names no wire word in any of its sentences" (catalog-string test; sentences asserted in "has a sentence of its own for every word" [state/life/memories-message.test.ts:30]); "reads a refusal whose error is a number as the refusal sentence" (row '{"error":3}' added to the refusal loop); "reads a body that is JSON but no map as a list that is missing, or as the refusal sentence" (held by the images_not_a_list table [state/life/memories-message.test.ts:97] and the refusal loop [state/life/memories-message.test.ts:154]). The one vi.waitFor poll (50 ms) replaced by the query cache's own subscription (queries.client.getQueryCache().subscribe) over createQueries()+createMemories(); no timer left.
### life/notes.test.ts
deleted: "gives two notes started in two milliseconds two names" (held by the format test [state/life/notes.test.ts:53]); "is the number config/behavior.yml carries under notes" (rows of 'is the number %j when the config carries it' [state/life/notes.test.ts:122]); "is the built-in number before a configuration push, and for a broken one" (rows 'soon' [state/life/notes.test.ts:116, state/life/notes.test.ts:117] added to the built-in table, plus new "is a built-in number above zero before a configuration push"). folded: stamp 'never written' + 'infinite or before the epoch' -> it.each 5 rows; writesNow 3 tests -> it.each 4 rows.
### life/present.test.ts
deleted: "reads an empty deck out of a config that holds none" (table 'reads the deck %j as the empty deck'); "drops an order line that names a kind the deck has no slide of" (held by "keeps the order lines that name a kind and a ref that is text" [state/life/present.test.ts:597]); "leaves an unnamed slide of an archived project off the deck" (held by "offers an archived slide, which the deck with no selection does not show" [state/life/present.test.ts:332]); "places an archived slide a saved selection holds" (held by "is ticked by the saved selection when there is one, archived work included" [state/life/present.test.ts:339]); "shows only the slides a saved selection names" (held by "offers every slide the deck places, whatever a saved selection keeps" [state/life/present.test.ts:302]). folded: plainTitle 2 tests -> it.each 2 rows; parsePresentState default cases -> rows {} and {slide:7,overview:'yes'} of the wrong-type table. key-order Object.keys assertions removed (themes, framing e, ideas, tagTones); meta test checks the sorted key names instead of the order.
### life/slides.test.ts
deleted: "lists an archived slide the deck does not show, unticked" (given by "ticks the slides a deck with no saved selection shows, and no others" [state/life/slides.test.ts:29]: order KEYS contains delta, picked OPEN does not).

### sessions/agents.test.ts: read, kept whole (13 tests + tables; settle() is setTimeout(0)).
### sessions/changes.test.ts
deleted: "holds the refusal sentence for a refused request and stops waiting" (held by "answers a refusal as the refusal sentence, whatever text it carries" [state/sessions/transcript.test.ts:282, state/sessions/changes.test.ts:229]: same refused branch, rows/loading/error asserted there); "answers a refusal whose error is a number as the refusal sentence" (folded: '{"error":3}' added to the loop of the refusal test). head Layer label.
### sessions/hooks.test.ts
folded: "carries another port and never the first one" + "carries the origin whole, scheme and all, with or without a port" -> it.each 3 rows ('another port' [state/sessions/hooks.test.ts:38], 'no port', 'a scheme and a port'). head label.
### sessions/folds.test.ts
deleted: "titles a task terminal by its command, unless the reader gave it a title" (terminalChoices takes titles from terminalTabTitle, folds.ts:303; held by "is the title the reader gave, over everything else" [state/sessions/folds.test.ts:480] and "is the name of the command a task terminal runs"); "are the count its result reports, and nothing for a count that is not one" (rows added to the 'is the tokens of %s' table: 48200, negative, NaN, text, nothing); "is null for an agent whose result reports none" (row 'nothing' [state/sessions/folds.test.ts:151, state/sessions/folds.test.ts:447]); the listFilterOf assertions of "read the filter out of the instance state" (folded as a row into the wrong-shape table; null/[]/{states:'ended',query:7} held by "answers the shared unset filter itself..." [state/sessions/folds.test.ts:420] and the table), the toggled assertions kept as "toggle a value into a list that lacks it and out of one that holds it".
### sessions/latex/latex-fixture.ts: read, kept whole (every export imported by folder/building).
### sessions/latex/building.test.ts: read, kept whole (16 tests; each a different branch of run()/confirm()/under-way).
### sessions/latex/folder.test.ts
deleted: "asks again on every sessions push while a watched build runs, and stops when it ends" (same sequence and branch as project.test.ts "asks again on every sessions push while the terminal runs, and stops when it ends"; watch/wait path is keyed by targetKey for both forms, latex.svelte.ts:430 and :344). head label.
### sessions/latex/project.test.ts
deleted: "carries the refusal sentence for a refused request, not the text it gave" (held by wrong-type table row 'a refusal with a text of its own' [state/sessions/latex/project.test.ts:371]; same failedAnswer branch, answers.ts:132); "answers the refusal sentence for a refusal whose error is a number" folded as a row of the table; orphan trailing doc comment removed. head label.
### sessions/source.test.ts
removed: stateId assertion in "identifies a tab..." (same JSON.stringify identity the "distinguishes roots, paths, and delimiters" test asserts); "keeps the rendered half" + "keeps the blame half" folded into it.each (rows rendered, blame; Revert comment kept); last 4 lines of the language/indent test (wrong-shape indent, held by the indent table rows 'tabs that are a string' [state/sessions/source.test.ts:562], 'a size of 9'); Object.keys assertion after toStrictEqual in the draft table (toStrictEqual compares the same keys); indent row 'tabs and a size of 8' (same valid branch as size 4, size 8 stays in the status-bar test).
time: "does not when the write was refused" min 151 ms over 5 runs (load 4): the 403 without a `refused` field took the stale-token retry whose dynamic import of $app/navigation cost the time. The refusal now carries `refused: [{field:'path',reason:'readonly'}]` as the sibling test at "returns a path refusal without retrying" does; the case is now ~1 ms. Assertion unchanged.
head: Layer label.
### sessions/source/source-options.test.ts, symbols.test.ts, wrap.test.ts: read, kept whole.
### sessions/source/view-source.test.ts
rewritten as tables, same assertions: the feed-kind and registry-kind tests folded into one it.each of 8 rows (kind, key); the collection null cases folded into one table of 9 rows; the feed-path null cases into one table of 6 rows (all on 'leads': the kind only picks the key, which the 8-row table holds). Deleted: the real-config collection test (hard-coded 'funding/funding.yml' and 'registries/venues.yml', i.e. a constant of the hub; the synthetic 'events' case holds the branch [state/sessions/source/view-source.test.ts:25]); the "[null, 'one', {key:'funding'}, {key:'funding', file}]" case (same first-row-wins branch as the 'first entry whose file is not a path' row [state/sessions/source/view-source.test.ts:35]); the extra null kinds (venues/datasets/pillars/domains/radar) on {}, blank and number (same readAs(pathShape) branch as the leads rows [state/sessions/source/view-source.test.ts:58]).
### sessions/terminal/commands-pane.test.ts
TAGGED whole file slow (last line of head comment): starts a private tmux server and a shell in a real pane; also imports tmux-fixture.ts whose module load runs `tmux -V`. A whole-file tag keeps the file from loading under '!slow'. Kept (the one case joining the server's capture action with the commands store; task.test.ts covers the capture alone). Layer 4 -> Layer 2 label. Time of its one test over five runs with `--tagsFilter slow`: min 173.8 ms, max 182.0 ms.
### sessions/terminal/commands-output.test.ts
deleted: "reads the folders from the mark when the repository list was never read" (same input and same assertion as "reads the path an error names from the folder of the command that printed it" which already runs on an unseeded list). head label + pointer to commands-pane.test.ts.
### sessions/terminal/commands.test.ts: read, kept whole (46 tests; each press/answer/stale-answer case reaches its own branch of press/pressRestart/answer/settle, commands.svelte.ts:484-520).
### sessions/terminal/composer.test.ts
removed: the state loop [null, [], {}, {composer:'x'}] and the 'rm' agent assertion of "reads the agent, the workspace, ..." (the states joined the list of "answers the empty record itself for a state with no map under composer", the same COMPOSER_EMPTY branch; the agent branch is the table row 'an agent in the wrong case'); deleted "opens a split tab whose composer offers and starts in a folder outside every place" (same offeredPlaces/composerWorkspace branch as "offers a split folder no place holds first, by its path, and starts in it" [state/sessions/terminal/composer.test.ts:162]; splitState without held state is "opens a split and a fresh composer on a state that is no map" [state/sessions/terminal/composer.test.ts:473]); `split: 7` assertion (table row 'a workspace and a split that are numbers'); `split: ''` from the picks test (held by "reads the split folder as a string, and drops an empty one" [state/sessions/terminal/composer.test.ts:157]); two retitles to match.
### sessions/terminal/pty-io.test.ts
deleted: "is ok for a stop answered `{ ok: true }` at 200" (same BARE outcome through the same branch as the table rows 'an id' [state/sessions/terminal/pty/pty-io.test.ts:42], 'an empty map'); "names no terminal the server calls idle when `always` picks none" (readBusy defaults always to () => false, pty-io.ts:173; held by the busy table row with {"id":"b","busy":false}); "leaves out an item that is null and names the busy ones that follow it" (a null joined the first busy table row's list; same filter branch as {"id":3}). head label.
### sessions/terminal/terminal-marks.test.ts
deleted: "maps the eight names to their tokens" (a constant table; colorToken('chartreuse'), 'red' and 'yellow' are asserted in tests/views/sessions/terminal-style.test.ts:112-114, another sweep's folder, and chartreuse also by the tabMark case here); removed resultMark(task(137)) (same fail branch as exit 1), tabMark(task(2)) and markOf(task(2)) (same delegation to resultMark as task(0)). head label.
### sessions/terminal/terminal-row.test.ts: removed expect(ROW_MIN).toBe(80) (assertion over a constant; the widths are asserted against ROW_MIN and 80 in the lifts test); head label. viewport.test.ts: read, kept whole (8 tests, each a different branch of viewportOf/scrollTarget/store/wiring).
### sessions/terminal/terminal-tabs.test.ts
deleted: "drops an id that is not a terminal and keeps a repeated one once" (table row 'terminals that are a number, null, a word and a repeat' [state/sessions/terminal/terminal-tabs.test.ts:367]); "Split on a row puts the new terminal right of it in the tab order too" (terminal-row.test.ts "puts the new terminal right of the one split, in the row and in the tab" holds the order; composing false is asserted by "splits with the new terminal right of the row and the composer gone" [state/sessions/terminal/terminal-tabs.test.ts:178]; showingRow outside the row by "keeps the row for a press on any terminal of it" [state/sessions/terminal/terminal-tabs.test.ts:188]); "keeps the shown terminal's name as the label" (withLabel is `{ ...state, label }`, terminal-tabs.ts:371; the label of withStarted is asserted in "New in a tab owning one terminal" [state/sessions/terminal/terminal-tabs.test.ts:204]); in other tests: share 7 / 0.3 assertions (table rows 'a share of 0.3' [state/sessions/terminal/terminal-tabs.test.ts:344], 'a share of 0.95'; terminal-row "reads the old two-terminal shape" [state/sessions/terminal/terminal-row.test.ts:173]), null and ['a'] in the old-tab loop (table rows 'null' and 'a list'). head label. Compared with tests/state/client/terminal/terminal-tabs.test.ts: that file drives the store and src/lib/state/sessions/terminal/terminal-lists.ts, this one the pure functions of terminal-tabs.ts, and no case of one is a case of the other.
### sessions/terminals.test.ts (893 -> 431 lines) + NEW sessions/terminal/pty/{pty-fixture.ts, pty-socket.test.ts} + MOVED pty-io.test.ts into terminal/pty/
Split by concern at 893 lines (sessions/ and terminal/ both hold 10 items, so the new files live in a new terminal/pty/ folder mirroring src/lib/state/sessions/terminal/pty/; pty-io.test.ts moved there so terminal/ stays at 10 items): the socket cases (two messages, subscribing, frame check, pty chunk shapes) moved to pty-socket.test.ts with the FakeSocket/connected/serving helpers in pty-fixture.ts.
waits: 12 vi.waitFor polls replaced by the code's own signals: FakeSocket.sentCount(n) resolves on the send that makes the count; gated().posted(n) resolves on the fetch call that makes the count. The 8 `idle()` (20 ms real sleep) became settle() (one macrotask); control run in a scratch test file: after requests.answer(0) one settle() is enough for the subscribe to be written and for the second resize to be posted, 8 of 8 runs, so a negative assertion after settle() is as strong as after 20 ms.
deleted: "reports a refusal in the refusal sentence, never in the text the server gave" (held by "is the refusal sentence for a sentence in the body of a 500" [state/sessions/terminal/pty/pty-io.test.ts:88], same refusedAnswer branch); "hands on the list of the payload itself when every item is a terminal" (array identity; nothing observable); answer assertions in recover/task/chat start tests (postTerminal answer shape; "starts one with its kind..." [state/sessions/terminals.test.ts:130] keeps it and pty-io.test.ts holds the table [state/sessions/terminal/pty/pty-io.test.ts:42]). Layer label heads.
### sessions/transcript.test.ts
deleted: "answers a refusal whose error is a number as the refusal sentence" (folded: '{"error":3}' joined the bodies of "answers a refusal as the refusal sentence, whatever text it carries"); the local settle() and three inline setTimeout(0) waits replaced by settle() of fixtures/client.ts (same body); head corrected (it said nothing is fetched) + label.
### shared/words/generation.test.ts: deleted describe 'the readers of the three plain stores' (2 tests: reads src/*.ts as text with regexes, an assertion over source text) with functions()/calls()/dependent()/STORES/STATE/Fn and the node:fs/path/url imports; head rewritten (Layer label, no mention of the readers).

### shared/instance-* (done)
- instance-fixture.ts: removed inputs 'string','number','search 3, reveal empty','search s, reveal r, lead space'; deleted bookkeeping test 'has an answer for each input and none for another' (a test of the table, not behaviour); head Layer 2 helper.
- Shared-shape rule: searchRevealShape rows (wrong search/reveal, empty strings, blank reveal, padded search, no reveal) kept only in parseLinkedinState; openFormsShape rows kept only in parseOpenForms; fieldItemsShape rows (other items/duplicates/empty) kept only in parseCollectionState (lowest-level: tests/data/helpers/guards.test.ts:76-92 for strings()); countShape rows kept for opening only; booleans 'is a number' rows removed (same z.boolean().catch); constants (enum members equal to fallback), capitals, null/list variants of z.object failure removed; 'another key' rows removed (own __proto__ input strips unknown keys in every reader).
- instance-state.test.ts: parseDomainsState reader deleted (the same parseRevealState as the pillars reader, which stays [state/shared/instance-state.test.ts:298]); 4 manifest store readers replaced by describe 'the manifest editor over a held instance state' (manifestEdits 3, manifestDirty 5, settleManifest 4 rows). tests 235 pass.
- feeds: 381 tests (with instance-state.test) ; sources 170 tests: diffViewOf over no paths reader -> one test; heldDiff line rows (anyNumberShape passes any number) removed.
- files: opening counts 4 rows; revealing counts removed; setExpanded 'already open' held by tests/state/sources/explorer/explorer.test.ts:147.
- all four: the stale and missing answers are checked by control (a throw placed in the code under test turns them red); 863 tests pass in 4 files.

### shared/stores, shared/words (done)
- stores/shell.test.ts: read, kept whole (2 tests).
- words/format.test.ts: read, kept whole (15 tests).
- words/themes.test.ts (22->12 incl. wrap-tabs run): deleted 'passes over a row without a string key or label, and an empty key' (the it.each of rows [state/shared/words/themes.test.ts:63] holds each case; the empty-word lookup moved into the property-word test [state/shared/words/themes.test.ts:36]); deleted it.each 'reads %j, which is no list' (the first test holds non-list values [state/shared/words/themes.test.ts:19]); removed 5 same-branch rows from the row table; label types trimmed to one. Head label.
- words/wrap-tabs.test.ts: deleted 'is a key the first config load installs' (VOCAB_KEYS membership; held by 'holds exactly the expected top-level keys, and no more' [tests/checks/config/config-folder.test.ts:388], whose EXPECTED table lists the keys at :116 and :213), deleted describe 'the wrap_tabs option' (tracked yml value; catalog toggle held by tests/checks/config/options-walk.test.ts); wrong-value table 7->2 rows. Head label.
- words/appearance.test.ts 67 tests: tables trimmed of same-branch rows (themes non-list 6->2, terminalTheme 6->4, wallpaper non-map 6->2, number default 9->3, popover 7->4 rows, themes key 9->2, crt 10->3, show_tabs 10->3, editor_actions 8->2, code theme 9->2, font_px 14->6, terminal non-map 7->2, cursor_style 14->6, flag wrong values 9->3), deleted 'reads a terminal of mistyped keys...' (each key held by its own row of 'reads a font_px of %j as %j' [state/shared/words/appearance.test.ts:340] and 'reads a cursor_style of %j as %j' [:388]). Head label.
- words/tones.test.ts 58 tests: toneOf describe cut to 2 tests (paletteTone holds the rest); 'ignores a key of the wrong shape' (held by the per-key tables [state/shared/words/tones.test.ts:276]); real-config: deleted 'carries all fourteen keys' (the key list is held by 'holds exactly the expected top-level keys, and no more' [tests/checks/config/config-folder.test.ts:388], EXPECTED table :213), 'names a glyph held by glyphs.yml in every status legend row' ('uses glyph names for every configured icon' [tests/checks/config/config-folder.test.ts:505], which checks every status_legend icon against glyphs.yml), 'gives a hue to every type the portfolio uses', 'gives a hue to a status and a research domain' (shipped colour constants); MESSY tables trimmed; NAMES 5->2; __proto__ keys 5->3. Head label.
- words/generation.test.ts: done earlier.

### sources
- datasets.test.ts: deleted accessTone test (shipped colours, wrapper over dataAccessTone held by tones.test.ts), 'produces the hub access summary in descending count order' (same sort as the first accessSummary test), the 3 themeFacets/applyThemeFacets tests (held by venues.test.ts, same function [state/sources/venues.test.ts:81]), parseDataState test (held by shared/instance-state-sources.test.ts parseDataState [state/shared/instance-state-sources.test.ts:113]), describeOffFacets call. Head label. Removed beforeAll/setVocab. 
- off-facets.ts: DELETED (only importers datasets.test.ts and venues.test.ts; its cases are fieldItemsShape/strings cases held at tests/data/helpers/guards.test.ts:76-92 and instance-state wrong off rows).
- venues.test.ts: deleted 'saved venue state' (held by instance-state-sources parseVenuesState [state/shared/instance-state-sources.test.ts:128]), describeOffFacets call, 7 timeline rows (same branch); kept themeFacets tests (single copy). Head label.
- files.test.ts: deleted 'asks again once the files version moved' (same refetch path as 'keeps the held rows showing...' [state/sources/files.test.ts:111]), '' assertion duplicate, 7 endpoint rows (same branch / number pass-through), settle from fixtures. Head label.
- follow.test.ts: deleted followsSession, followView(valid/null/off), withFollow, withFollowPin, followRevealed (non-root) tests (held by shared/instance-state-files.test.ts readers [state/shared/instance-state-files.test.ts:193]); kept '/hub/' + '/tmp' cases, followedDirOf, root-line case. Head rewritten.
- fs-channel.test.ts: read, kept whole (2 tests; only test of server mergeFiles, src/lib/server/files/files-channel.ts; no socket/process/timer cause); settle from fixtures; head label.
### sources/explorer (done)
- acts/confirm, drop, selection, undo, store: read, kept whole. acts/folders: catalog literals -> t(...), literal platform sentence removed, label. acts/keys: deleted 'binds every action', 'binds Enter and F2...', 'tells Copy Path from Copy Relative Path by Shift'; hints test lost lines; 32 generated per-chord tests folded into it.each(macOS/another platform) looping chords. label.
- clipboard.client: read, kept whole (effect timing). watch.svelte.ts helper kept.
- ops.test.ts: deleted 'sends a second paste while one is in flight'; orphan comment removed; label.
- explorer.test.ts: deleted filesViewOf reading test, forms reading test (held by shared/instance-state-files.test.ts [state/shared/instance-state-files.test.ts:193]), patchedFilesView test, 'marks every row fixed while a filter draws them' (held by rows/rows.test.ts "fixes the open state of every row while a filter draws them" [state/sources/explorer/rows/rows.test.ts:431]); toggles test reduced to shownOf; filesLineTyped reduced to other-view case. head rewritten.
- naming.test.ts: bad-naming list 4 rows; filesViewOf({}).naming assertion removed; label.
- rows/rows.test.ts: read, kept whole (435 lines; every test has a distinct branch).
- sections/open-editors-tabs.test.ts: added the root '' row to 'names no file'; label.
- sections/sections.test.ts: deleted fileOfTab test (held by open-editors-tabs.test.ts 'names no file...' [state/sources/explorer/sections/open-editors-tabs.test.ts:56] incl. the root '' row); outlineFollower 30 ms settle replaced by awaiting latexOutline(READ,'') after a beforeAll warm-up; control: deliver-every-outline and stop-without-turn revert each turn the follower tests red; head label.
- view/card-tree.test.ts: deleted 'is not the key the tab keeps its forms or its own state under' (implied by the prefix test; literal constants); label.
- view/view.test.ts: deleted 'drops the answer of an ask the tab no longer holds' (held by workbench/layout/open/show-in-files.test.ts sameAsk test [state/workbench/layout/open/show-in-files.test.ts:419]), markedKeys test (held by sources/fs/fs-shape.test.ts markedKeys [state/sources/fs/fs-shape.test.ts:328]), bookmarkRows plan/none rows (held by fs-shape bookmarkRows tests [state/sources/fs/fs-shape.test.ts:351, :367]); label.
### sources/fs (done)
- file-language.test.ts: rewritten over a hand map (5 tests + 2 selector tests): deleted the tracked-map tests (research-tree names, stubs/svelte, whole name table over tracked, languages beyond first eighteen, Wren/Graphviz [held tests/data/helpers/files/languages.test.ts 'leaves Wren and Graphviz to plain text' [data/helpers/files/languages.test.ts:36]], big alias test [tracked map content; registry membership held tests/data/helpers/files/languages.test.ts 'names every language the code window registers'], inherited names [held same file 'is built once per read, as a Map...'], 'follows a map that gives the ending to another language' [same branch as the lookup tests], 'lists every language' (tracked) -> hand map, typeOfFile 'answers the kind alone' [held fs-shape.test.ts]). Controls: dropping the dotfile guard or the lowercase in languageOf turns two tests red.
- fs.test.ts: deleted describe 'the language a file is painted in' (tracked map constants), 'holds the sentence of a refused read, rather than an empty folder' and 'holds the refusal sentence of a refused workspaces read' (held fs-answers.test.ts refusal table [state/sources/fs/fs-answers.test.ts:50]). Retitled the 'audits' test. head Layer 2.
- fs-shape.test.ts: deleted language tests over tracked map (code file names, whole name, registered names), accented/zero byte typeOfFile test (held tests/data/helpers/files/text-kind.test.ts:18, :30 [another sweep's folder]), empty file/npz rows, TEXT_LIMIT constant, nameOf asserts (tests/data/helpers/files/paths.test.ts), expandedOf test (held shared/instance-state-files.test.ts READERS expandedOf [state/shared/instance-state-files.test.ts:195]); catalog setup removed.
- fs-answers.test.ts 136->64 tests: tables of refusals, catalog word and unreadable bodies tried on workspaces ('full') only, one refusal row on the other kinds (all go through readAnswer, fs-transport.ts:252); not-a-map rows 5->2; retry test deleted (held fs-notes.test.ts retry tests [state/sources/fs/fs-notes.test.ts:127, :144, :161]); bookmark forms describe deleted (same !read.ok branch as fs-notes 'closes no bookmark form over a read the server refused'); files-message rows 6->2; local settle replaced.
- fs-notes.test.ts: deleted 'keeps the bookmarks drawn and says why when the server refuses the read' (held fs-answers refusal row [state/sources/fs/fs-answers.test.ts:50]) and watcher test (held fs-answers 'files message' tests [state/sources/fs/fs-answers.test.ts:273]). label.
- fs-files.test.ts: deleted 'reads a file whose bytes are not text as a download' (held fs-shape 'reads the bytes and not the name' [state/sources/fs/fs-shape.test.ts:64]); kept the window-straddle case (wiring of TEXT_SNIFF_READ). label.
- fs-text-fresh.test.ts: second it.each row ('a family emptied') deleted (writer logic held by 'sends one config-value with the whole value and the row value as its base' [state/system/settings/editors-writer.test.ts:89] and 'keeps the draft and draws the refusal under the row' [:147]), single row made plain test; control: dropping cache:'no-cache' in readText turns it red. label.
- fs-fixture.ts: settle re-exported from fixtures/client.ts; label.
- languages-selector.client.test.ts: read, kept whole.
### sources/repositories (done)
- capabilities/open-worktree.test.ts: read, kept whole (the one wiring case with real stores). store-wire.test.ts: read, kept whole (3 ms per run, no process, timer or socket; the only test of store bodies against the route's field reads). repositories-badge.test.ts: deleted 'names the badge by what it counts in its hover words' (badgeOf title, the catalog sentence of registry.ts:150). store-actions.test.ts: deleted 'in a new window does the same, then opens the page address' (files-before-window held by capabilities/open-worktree.test.ts, address held by the root-held test). view-state.test.ts: deleted 'keeps the closed roots in the tab state...' (held shared/instance-state-sources.test.ts repositoriesViewOf reader [state/shared/instance-state-sources.test.ts:293]), 'names none for a repository nothing was cut from' (the non-cut group of the first cutGroups test).
- diff/: comment-draft.client: literals replaced by t(); diff-read.test.ts and diff.test.ts: read, kept whole; diff-view.test.ts: deleted 'reads each field of an instance state...' (held instance-state-sources heldDiff reader [state/shared/instance-state-sources.test.ts:156]), 3 non-map rows of against list, the wrong replace rows, POST preview test (held diff-read.test.ts 'posts a Replace Preview' [state/sources/repositories/diff/diff-read.test.ts:74]); hunks-git.test.ts: tagged slow whole file (spawnSync git per case), loop -> it.each; merge.test.ts: deleted 'writes an empty Result over a path neither side deleted' (last assertion of the takesDeletion test); review-comment.test.ts: deleted 'five real cases', blank '   ' row, 'asks for the terminal when it sends', 'one clipboard write at a time per box' (same sendOnce guard as 'one send at a time per box'), literals -> t().
- history/: change-tree: deleted 'keeps spaces...' and 'draws the paths of this repository...'; file-git: literals -> t(); graph: deleted commitCircles radius tests (constants), laneX/laneWidth constants -> relations.
- view/: answers: 'a text' row; commit-action: read, kept whole; diff-session: deleted 2 reader tests (held by instance-state-sources heldDiff [state/shared/instance-state-sources.test.ts:156]), determinism assertion; view-state: deleted mode describe (held instance-state-sources repositoriesViewOf [state/shared/instance-state-sources.test.ts:293]), diffViewOf default/reader/__proto__ tests (held diffViewOf readers [state/shared/instance-state-sources.test.ts:220]), reveal 'each reveal asked before' test; 2 ms real timer in readAll replaced by fake timers; repositories.test.ts 883 -> 734 lines: deleted repositoriesViewOf reader test, diffViewOf layout test, 3 pickerRoots variants, statusStyle (CSS hue constants), DU row, writes refusal test (held tests/state/client/writes.test.ts:209), shellIn already-there test, openChange merge/untracked/diff test (held diff-session.test.ts 'the diff a Changes row opens' [state/sources/repositories/view/diff-session.test.ts:133]), shownRoot dupes kept (harmless).
### sources/search (done)
- endpoint.test.ts: successful-body rows 5->1 plain test (answerOf null rows held by search.test.ts 'refuses an answer whose files are' [state/sources/search/search.test.ts:283] and 'refuses %j as an answer'); refused-body rows 9->5; deleted the 500 and 403 tests (status goes through the same refusedAnswer call as the 400 and 502 rows); deleted 'reads a state held without under' (under row added to search.test.ts 'reads a field of the wrong type as its default'); deleted 'says a folder the server found missing...' (missing word held by the refusal-word table, other text by the 'bad' row); 'says a refused folder...' now asserts t('search.refused_outside') and no stub reply. label.
- search.test.ts: literals -> t('search.refused_empty'), t('search.refused_unknown_root'); deleted 'reads a saved tab back and refuses what is not an answer' (held by the empty-state and wrong-type tests and the answerOf rows [state/sources/search/search.test.ts:379, :284, :290]) and 'keeps a failed root it can read and drops one it cannot' (rows of 'reads a failure with %s' [state/sources/search/search.test.ts:275], 'no root' row added); under:7 added to the wrong-type test. label.
- replace.test.ts: read in full, kept whole (24 tests, each a distinct branch); two false titles ('writes the count line back...') retitled; Revert comments proved by controls on search.svelte.ts (pick.kind guard, dismissHits unsay, toggleMode searchRunning, replaceHits unsay each turn a test red). label.
- hits.test.ts, search-fixture.ts: read, kept whole.
### cross-cutting: failedAnswer
- NEW tests/state/shared/answers.test.ts (14 tests): holds failedAnswer/refusedAnswer/refusalSentence branches once (word sentences distinct for OPS_REFUSALS and LATEX_REFUSALS, status sentence for non-word bodies, unreadable). Controls on shared/answers/answers.ts (swap two keys, drop unreadable branch, drop latex branch, drop word branch) each turn it red. Each store test keeps one refusal row and one unreadable row as the wiring case; the stores trimmed to that are listed in the 'failedAnswer wiring tables' entry under system below.
### system (done)
- audit-message: unknown-word loop -> it.each(3 rows); deleted 'names no wire word in any of its sentences' (catalog-string assertion). label.
- audit: deleted 'belongs to one client' (fixture isolation, costs nothing in the product). label.
- config-files: deleted CONFIG_SUFFIX/CATALOGS constants test; kept LOCAL_NAME vs server module.
- deposit: refusal rows 7->1 (failedAnswer table now in shared/answers.test.ts), catalog-word test deleted (shared), unreadable rows 4->2, no-state rows trimmed, no-state shapes 8->5, local settle -> fixture settle; label Layer 2.
- lines: deleted 'asks once for a recount pressed while a count is on its way' (same drop policy as 'sends nothing for a recount pressed while one is out, and keeps the old count showing' [state/system/lines.test.ts:87]), 'holds a row that is not a folder count...' and 'no total or no time' (the readCount tables [state/system/lines.test.ts:242, :258, :267]), final wiring table 8 rows; status/body tables folded into it.each; key-order assertions removed (toStrictEqual does not read order); readCount row tables trimmed to distinct branches; underSource second row ('src-old') deleted; control: recount 'replace' for 'drop' turns the recount test red; local settle -> fixture settle; label.
- machine/hpc: deleted 'derives queue presentation' (held by the tables [state/system/machine/hpc.test.ts:72, :147, :168]), first partitionMeters test (held by the last [state/system/machine/hpc.test.ts:201]), sinfo toggle test (toggledHpcState is generic over the key), 5-row command wrong-shape table (fields() held by tests/data/helpers/guards.test.ts), 'hands the map on whole', 'refuses an answer that is no JSON' (response.json pass-through), the jobLog tables (text() held by guards.test.ts), the second held-state describe (merged into one table), key-order test; walltime table 14->7; startLabel 6->2; efficiencyTone 10->5 (NaN row asserted incidental behaviour); stateTone 5->3; pill expectations -> t(); label.
- machine/processes: deleted 'rows that is a map' frame row, 'names a group by the label the terminal tab shows' (names asserted literally in the main arrange test), headLine rows 5->2 with t(), 'starts on cpu' (asserts a test constant), 'x' sort row, store tests 'names a terminal with no title by its name' and 'names the record command and pid for a group drawn from the record'; stop question uses t(); label.
- machine/usage-refresh: rows 17->8 (case, empty, null, map, string/number/JSON-null bodies share a branch); label. machine/usage: read, kept whole.
- settings/browser: decimal rule is decimalOf (write.ts), held by write.test.ts; rows trimmed to wiring (decimal trimmed, '-0' test deleted, one refusal text). settings/contents: NARROW constant assertion and 3 of the width rows deleted. settings/editors-draft: deleted shipped counts test, form-per-shipped-row test, swatch test, map-keyed duplicate/empty key test (keysOf is shared with the key/value form), flow reading duplicates; head count text removed. settings/editors-writer: default constant assertion deleted; local settle -> fixture. settings/folders: 'list no folder as a file'. settings/origins: '(cases 9, 10 and 30)' removed from the comment, label. settings/rows: deleted language map describe (catalog constants), terminal control constants, FILES constant assertion, localRows arity assertion, JS-prototype sanity asserts, 3 titleOf rows, a 'Revert' comment that named no revert. settings/search: deleted tautological holds loop, '@nonsense in the shipped catalog' (cannot fail), '@Modified' row; settings/write: non-decimal rows 7->3, empty rows 3->2, '-0' submit test (same as commit), 'writes nothing for the empty choice' (same as commit choice test), pure 'counts a state holding a typed text' (held via the ui.unsaved wiring test [state/system/settings/write.test.ts:362] and editors-writer [state/system/settings/editors-writer.test.ts:339, :345]), 2 JS-sanity asserts. settings/fixture: read, kept.
- docs: deleted 'audit: sends one request...' (passes with its behaviour removed), hub 'says the refusal sentence' (same branch as the project one), refusal table 8 rows (held by the refusal tables of shared/answers.test.ts [state/shared/answers.test.ts:39, :51]), 6 holds() tests folded into one it.each (7 rows), tables trimmed to distinct branches, manual-run key-order row/assertion removed; controls: enabled:true and unreached-without-file turn the two Revert-commented tests red; label.
- sessions/source/source-options, symbols: '(case N)' removed from 12 titles; label.
- failedAnswer wiring tables trimmed (each store keeps one refusal row, one unreadable row; word cases held by [state/shared/answers.test.ts:20, :31, :39]): sessions/agents (refusal table 4 rows deleted, unreadable 7->4, '{}' row deleted), sessions/changes (refusal loop 3->1, word test deleted, unreadable loop 4->1), sessions/transcript (same), sessions/latex/project (refusal rows 4->1, unreadable 4->2), sessions/terminal/pty/pty-io (start-shape rows 5->3, refusal rows 4->1, word test deleted, unreadable 4->2), sources/files (refusal rows 3->1, word and non-text tests deleted, unreadable 4->2), life/memories-message (refusal loop->1, word test deleted, unreadable loop 4->2). sessions/latex/folder: kept (one word test per flow: state, count, format).

### workbench/
- drag.test.ts: Alt float tests (2) folded into it.each (4 rows: no drop, middle of a body, strip, edge). Title 'floats at the pointer over %s, wherever the pointer was released'. label. 39 tests.
- layout/instance.test.ts: deleted 'uses a session pin...', 'stores the cursor only while a card is held', instanceText 'filter' test; stateId/cardCursor/withCardCursor/reconcile rows consolidated (proto const; rows key-order/duplicate/null-array removed); text/flag/label/number rows trimmed (NaN/Infinity dropped). Control on instance.ts:184 (tabsOf first pane only) turns 'lists every tab' red. 50 tests.
- layout/layout-close.test.ts: deleted 'closing the page another page shows forgets its tabs...' (same closePage forgetTabs branch as 'forgets every tab of its own tree and keeps the tabs of the page its leaf shows', layout-close:~120) and the tree-records pane close and page close tests (same clearInstanceState lambda in client/context.ts as the closeInstance tree-record test and the forms-key assertions of the pane/page tests). label. 5 tests.
- layout/layout-parts.test.ts: read, kept whole (18 tests). Head: label, and the false last sentence 'Each case names the change that turns it red' removed (3 cases name none).
- layout/layout-store.test.ts: 2 activate-for-same-state tests folded into it.each (rows: 'a view with no state', 'the same state'); deleted 'splits again when the tab it made was dragged into the pane being read' (besidePath samePath branch held at layout-parts.test.ts 'is nothing once the tab it was made for is back in the same pane' [state/workbench/layout/layout-parts.test.ts:259]; store wiring of the null branch stays in 'splits again once the pane the last one made is gone'), 'leaves the root pane alone, which is in no split' (pure refusal at layout.test.ts 'refuses the root...'; unchanged-change branch held by 'leaves the tree alone when the move performs nothing' [state/workbench/layout/layout-store.test.ts:317]), 'expands the pane a view is opened into rather than opening it out of sight' (same expandTo branch as 'expands every folded ancestor...'). label. 36 tests.
- layout/layout.test.ts: deleted closePane 'takes every tab of a leaf pane...', 'collapses a split...', 'empties the root pane...' (closeInstance of a last tab goes through removeTab to removeNode, the same code as closePane; held by the closeInstance tests 'cleans away an empty pane and renormalises what is left' [state/workbench/layout/layout.test.ts:102], 'collapses a split left with one child into that child' [:97], 'empties the root pane rather than removing it' [:109] in this file; 'is the whole pane' [:126] ties the two); splitWith right/left and bottom/top tests folded into one it.each (4 rows: 'right edge','left edge','bottom edge','top edge'; title 'splits a pane on its %s, the dropped tab in the new pane'); deleted splitWith 'adds a sibling to a split of the same direction...' (same splitLeaf branch as splitPane's test of that title; 'puts the sibling in front of the pane on the left edge' stays as the only before=true case); deleted 'folds a child of a split below the root' (rewrite depth held by 'resizes a split below the root') and checkLayout 'names the path of the node it is reporting' (shown by 'reports a repeated instance id'). label. 55 tests.
- layout/nested.test.ts: embedPage right-edge and top-edge tests folded into it.each (rows 'right edge' [state/workbench/layout/nested.test.ts:225],'top edge'; title 'splits the pane at the path and puts the page on its %s'); 'refuses a page the host already draws, here and through another page' cut to the direct half (the indirect half is embeddable(held.pages,'one','three') asserted in 'says a page may not show itself' [state/workbench/layout/nested.test.ts:212]); deleted store 'refuses to show a page inside itself or inside a page it shows' (same store showable branch as 'refuses a page whose own leaves draw a page the screen already draws'), 'starts from a workbench the default pages hold' (asserts a shipped default), 'ignores a touch on a page the list does not hold' (held by layout-parts.test.ts 'is not moved by a pane claimed for a page the strip does not hold' [state/workbench/layout/layout-parts.test.ts:160]), 'forgets a touched page once the screen no longer draws it' (held by layout-parts.test.ts 'is the page on screen when the page of that pane is drawn nowhere' [state/workbench/layout/layout-parts.test.ts:149]); retitled 'reads a version 4 envelope holding no leaf...' to 'reads an envelope holding no page leaf back as it was written' (serialiseLayout writes the current version). label. 37 tests.
- layout/pages.test.ts: deleted 'reads back every page and which one is current' (pure roundtrip incl. a LAYOUT_VERSION constant assert; held by the store test 'reads every page of a saved envelope back and the one that was current' [state/workbench/layout/pages.test.ts:169] and nested.test.ts 'is written and read back as it is' [state/workbench/layout/nested.test.ts:108]), store 'reads a version 2 envelope as page 1' (same parse branch as the pure 'reads a version 2 envelope of one workbench as one page'), 'ships one float, docked right at 0.3, holding hpc and usage' (asserts the shipped config); describe 'the version 4 envelope' renamed 'the saved envelope'; store test retitled (it is not about version 4); head text 'version 3 envelope' corrected. label. 55 tests (the whole file: 3 deleted, reset/floats tests kept).
- layout/open/floats.test.ts: deleted 'floats from a float id nowhere: a float is never floated again' (floatPane page lookup is the branch of 'answers its pages when the page, the path or the pane names nothing to float', page 'gone'), adoptFloats 'makes the float with the shipped instances when no page holds a tab of a view of it' (the not-found half is asserted by 'moves a tab of a view found on another page, and makes new the ones that are not found' [state/workbench/layout/open/floats.test.ts:328]). label. 35 it() calls
- layout/open/floats-store.test.ts: deleted 'are one float docked right at 0.3 holding hpc and usage, read from layout.yml' (asserts shipped config; the wiring tests that install the shipped floats keep asserting what they installed), 'makes the float with new hpc and usage instances when the page held no tab of them' (pure branch at floats.test.ts adoptFloats 'moves a tab of a view found on another page, and makes new the ones that are not found'), 'is left as it is by a browser whose layout was saved with floats' (same version gate as 'takes none a second time'), 'stays on the page it was on after a press in a float' (same touchPane isPage branch as 'never rests on a float'), 'is made from a locked pane of a page, saved and read back locked' (floatPane lock at floats.test.ts 'stays locked when the pane of a page is floated'; save and read back lock in 'keeps the lock across a dock, a move and a save and read back'); the two 'view opened while its tab is in a float' tests folded into it.each (rows 'a view' [state/workbench/layout/open/floats-store.test.ts:288], 'a view opened for something'; title 'activates the float's tab for %s, and makes no second instance anywhere'); stacked doc comments fixed. label. 29 tests.
- layout/open/kept-panes.test.ts: deleted 'goes through removeTab with the same rule' (closeInstance calls removeTab: same branch as 'keeps an empty documents pane when the last tab of a view opened for something closes'), Explorer 'leaves the right pane empty, a documents pane, when its only tab, a source tab, closes' (same store closeInstance wire as 'keeps the pane when a file tab closes itself through the store' and asserts the shipped arrangement's views); unused viewsOf/openView removed. label. 20 it blocks
- layout/open/landing.test.ts: read, kept whole (13 tests, head unchanged).
- layout/open/locked.test.ts: deleted 'lands in the pane again once it is unlocked' (split half repeated 'splits a new pane to the right of the reader when every pane is locked'; the unlock half is 'marks the pane and lifts the mark by removing the field'), 'stays when removeTab takes its last tab' (closeInstance calls removeTab: same as 'stays, empty and locked, when its last tab is closed' [state/workbench/layout/open/locked.test.ts:170]), store 'splits a new pane to the right when every pane is locked' (landing pure 'splits a new pane...' plus landing.test.ts store 'splits one pane to the right of the reader'), store 'locks and unlocks a pane through change and setLocked' (setLocked held by 'marks the pane...'; change is generic, layout-store.test.ts 'applies an operation to the page tree and saves...'), store 'keeps a locked pane empty when the store closes its last tab' (same keptPane locked branch as the pure close cases; store route held by kept-panes.test.ts [state/workbench/layout/open/kept-panes.test.ts:73, :224]). label. 21 tests.
- layout/open/pinned.test.ts: deleted 'opens at the end of a pane whose active tab is the last' (openedAt active+1 branch of 'opens to the right of the active tab'), 'activates the neighbour when the pane showed no other tab before' (pure: layout.test.ts 'moves active to the neighbour that took the closed tab place'; its assertions were not-b and either-of-two), 'leaves the active tab alone when a tab that is not active is closed' (layout.test.ts 'leaves active alone when another tab was closed'). label. 14 tests.
- layout/open/preview.test.ts: deleted 'reads the file it was retargeted to, and not the one it was opened on' (the sequence a then b is the second half of "throws away the first file's read when it lands after the tab was pointed at the second", which also asserts the b text and the saved text). label. 13 tests.
- layout/open/session-lock.test.ts: deleted the describe 'the words of the session lock' (2 tests asserting catalog strings 'Lock to this session', 'Unlock from this session' and 'Pin'; 'An audit of the catalog'), the catalog setup, the head sentence about them and the comment 'A preserved behaviour, run on the unchanged tree too.'. label. 2 tests.
- layout/open/new-text-file.test.ts: read, kept whole (3 tests, head unchanged).
- layout/open/show-in-files.test.ts: deleted 'reads an ask and an outcome out of a saved record, and nothing out of anything else' (filesViewOf readers held by the filesViewOf READERS table [state/shared/instance-state-files.test.ts:210] rows 'reveal asked zero' [:221], 'reveal with an empty root' [:222], 'revealed of an unknown kind' [:232], 'revealed without asked' [:235]); removed the line hubPathsOf({ link: 3, folder: ['a'] }) from 'takes a hub path from link, url and folder...' (non-string values held by 'reads a link, a url and a folder only when each is a string, trimmed and once' [state/boards/collection/collection-fields.test.ts:182]). label. 35 it blocks.
- layout/saved/layout-carry.test.ts: read, kept whole (16 tests, head unchanged).
- layout/saved/layout-floats.test.ts: read, kept whole (it.each table of 13 rows kept); doc comment of envelope() corrected from 'A version 5 envelope' to 'An envelope ... at LAYOUT_VERSION'; label.
- layout/open/floats-store.test.ts: retitled 'is saved as version 5 once the floats are taken in...' to 'is saved at the current version ...' (LAYOUT_VERSION is 6).
- layout/saved/layout-locked.test.ts: removed the constant assertions version toBe(LAYOUT_VERSION) and LAYOUT_VERSION toBe(6) from the unlocked-read test, retitled it 'reads a layout written without the field as unlocked', head sentence 'The version stays 5' (false: the version is 6) removed. label. 5 tests.
- layout/saved/layout-pinned.test.ts: deleted 'reads a pane with its active tab as the only one used' (the version 5 equality in the first test of the describe already gives a pane without recent and its active tab); removed the version toBe(6) assertion and its 'Revert: LAYOUT_VERSION back to 5' comment from the first test (the revert turned only the constant red). label. 9 tests.
- layout/saved/layout-saved.test.ts: version 2 envelope: the two 'keeps the main tree as the root when the panel holds nothing' tests folded into one it.each (rows 'a panel on the right' [state/workbench/layout/saved/layout-saved.test.ts:29], 'a hidden panel'); 'makes a row ... on the right' and 'makes a column ... along the bottom' folded into one it.each (rows 'right' [state/workbench/layout/saved/layout-saved.test.ts:29, state/workbench/layout/saved/layout-saved.test.ts:39, state/workbench/layout/saved/layout-saved.test.ts:216], 'bottom'; title 'makes a split of the two trees for a panel on the %s, at the share it had'); deleted v3 'folds the panel child of a hidden panel that holds tabs, on a page too' and v3 'makes a column of the two trees for a page whose panel sat along the bottom' (parseLayout reads a version 3 page through the same readDockedWorkbench as parseWorkbench; held by the version 2 fold test and the 'bottom' row), 'a saved tab naming a view that has been renamed' (an unknown view string is kept by readTree, held by 'keeps a view the registry may not know and the instance state' [state/workbench/layout/saved/layout-saved.test.ts:110]), the viewsOf constant assertion in 'says nothing about the default'. label. 25 tests.
- layout/saved/layout-shared.test.ts: read, kept whole (8 tests, head unchanged).
- layout/saved/refusals/layout-parse-refusals.test.ts: table 60 -> 34 rows (26 deleted incl. 'a page with fields it does not read', each a type variant of a field another row keeps: undefined/number/boolean values (kept: null), empty string and the JSON string/null/number texts (kept: 'not json', JSON array), version null (kept: string), pages none/string/null (kept: map, empty), current none/null/empty (kept: number, no page), page null/string (kept: number, list), page no id/no label/no workbench, workbench null/string, root null (kept: wrong-type rows), rail key null/list (kept: number, empty), 'two pages with two rail keys' (the keeping case 'a page with a rail key')). Shape facts: savedPageShape/pagesEnvelopeShape in saved/saved.ts:102-115. label (was 'Layer 4, test.').
- layout/saved/refusals/layout-parse-refusals.test.ts: also deleted 'a page with fields it does not read' (pagesText prints no extra field, so the row cannot fail on the dropped field; its rail part is 'a page with a rail key').
- layout/saved/refusals/layout-parse-root-refusals.test.ts: table 56 -> 40 rows (16 deleted): 'a root pane with a tab that has fields it does not read' and 'a focus with fields it does not read' (pagesText prints no extra field, so neither can fail; the 'keys of a ... read' rows hold the dropped fields), focus path holding Infinity/NaN/null (kept: negative, fraction, string), path a map (kept: string), focus null/string (kept: list, no path), v3 hidden panel / empty panel (readDockedWorkbench, held by layout-saved.test.ts v2 fold and empty-panel rows), v3 rail key and v3 label number (shared savedPageShape/railKey, held by layout-parse-refusals rows), v2 as text (held by 'an envelope as text' [state/workbench/layout/saved/refusals/layout-parse-refusals.test.ts:18]), v2 workbench list and v2 bad dock (same readDockedWorkbench as the v3 rows kept), v2 hidden panel holding tabs. label (was 'Layer 4, test.').
- layout/saved/refusals/layout-refusals.test.ts: table 109 -> 65 rows (44 deleted, each a variant of a check another row keeps: non-tree undefined/string; kind number/null/capitals; page leaf number/null; dir number; children string/map/null; split second child/no-kind child; sizes string/map/null/hold null/Infinity/-Infinity/list; three sizes; negative and zero size; folded string/map/null/index at the count/Infinity/NaN; tabs string/map/null; tab string/list; id number; view number/null; state absent; second tab no view; three repeats; active number/null/empty; pane at path in a split). label (was 'Layer 4, test.').
- layout/layout.test.ts: deleted the 8 checkLayout tests after 'passes a tree the shell can render' (every sentence is a row of layout-refusals.test.ts: 'a split with one child', 'a split with one size for two children', 'a split whose sizes do not sum to one', 'a split with a child under the minimum', 'a pane whose active is not one of its tabs', 'an empty pane whose active is a tab', 'a pane with a tab that repeats an id', 'a node whose kind is not one', 'a split with a direction that is not one', 'a split at a path inside' (node at [1] rows)). 
- layout/saved/layout-saved.test.ts: deleted the describe 'checkLayout over a folded split' (3 tests; sentences held by rows 'a split whose folded holds an index out of range' [state/workbench/layout/saved/refusals/layout-refusals.test.ts:137], 'a split whose folded holds every child', 'a split whose folded is a number' of layout-refusals.test.ts); unused imports removed.
- layout/saved/refusals/layout-workbench-refusals.test.ts: table 83 -> 33 rows (50 deleted): non-envelope undefined/array/text (shared asEnvelope, rows of layout-parse-refusals.test.ts); v2 as text; workbench null/string (kept: none, list); dock right/bottom/hidden (held by layout-saved.test.ts v2 right/bottom rows [state/workbench/layout/saved/layout-saved.test.ts:42] and the hidden-panel fold test [:50]), dock number/none/capitals (kept: 'not one'); panel share 0.25, null, none, NaN, Infinity, -Infinity, list, negative, one (kept: string, past one, zero); main tree null, panel tree null/string/empty/repeats an id of main, main with wrong size (layout-saved.test.ts refusal rows); all five valid-focus rows (layout-saved.test.ts 'carries the maximised pane of either tree', 'carries the maximised pane of the main tree when the panel is dropped', 'drops a pane maximised inside a hidden panel', 'drops a focus that named the panel when the panel held nothing') and all eleven invalid-focus rows (layout-saved.test.ts 'drops a focus that names no pane and one that is not a tree and a path'; the path element rules are rows of layout-parse-root-refusals.test.ts); checkWorkbench root not an object (layout-refusals 'a tree that is a number'), page leaf on its own page (layout-refusals 'a page leaf naming the page it is on'); checkPages two empty rail keys, empty current, own page leaf, page leaf twice, label in message. label (was 'Layer 4, test.').
- layout/saved/layout-saved.test.ts: also deleted checkWorkbench 'names the tree a problem is in, and reports a focus that names no pane' (rows 'the sentences of a workbench with a root that is wrong' [state/workbench/layout/saved/refusals/layout-workbench-refusals.test.ts:95] and '... a focus past the tree' of layout-workbench-refusals.test.ts).
- layout/saved/layout-system.test.ts: the two label tests (labels the page System; keeps a label the viewer gave) folded into one it.each inside the shapes describe.each (rows 'the name the rail shipped' [state/workbench/layout/saved/layout-system.test.ts:293], 'a name the viewer gave the page'; title 'labels the page for %s'); the other 34 tests read and kept whole. label.
- navigation/arrangement.test.ts: deleted 'reads the sessions arrangement as saved' and 'makes every page as the rulings lay it out' and 'draws the eleven buttons in the ruled order' (shipped config constants), 'takes a tab written as a view with a state' / 'takes a pane naming one view' / 'refuses a tree that is not a tree' / 'refuses a split whose sizes do not add up' / 'refuses a split with a direction or a size' (rows of the wrong-type table [state/workbench/navigation/arrangement.test.ts:554]: 'a pane whose tab is a map', 'a pane naming one view', 'a map with no root', 'a root of an unknown kind', 'a split whose sizes do not sum to one', 'a split with a child under the minimum', 'a split with a direction that is not one', etc.), the describe 'a Projects page saved before the Personal tab' (its 'keeps its three tabs' is the same found-by-key branch as 'shows the page the reader rearranged on the next press'; 'shows four tabs once the pages are reset' is a shipped-config constant and resetPages is held by layout/pages.test.ts), 'renames the page without untying it from its button' (same branch as 'saves the key with the page', which renames then finds by key). Edits of kept assertions: 'turns the shipped sessions arrangement' lost the root.kind and viewsOf constant list (checkWorkbench equal [] kept); 'mints a fresh instance id' `new Set(ids).size toBe(8)` -> `ids.length > 1` and `size toBe(ids.length)`; placement test `wanted toHaveLength(51)` -> `wanted.length > 0`; 'makes the Help page' lost the shipped Help tab list. Table pruned 24 rows (type variants of one zod field: top-level string/number, root array/string, kind number, view map/null, list null/list, tab state string/number, tab view number, sizes map/null/-Infinity/hold null/three, dir number/none, children map/null/hold pane-number, plus the two extra-field rows 'a split with a folded list' and 'a root with fields it does not read' since the 'keys of' rows hold the stripping). label. 57 tests.
- navigation/catalogue.test.ts: deleted describe 'the catalogue of the real config' (5 tests: shipped constants, or held by tests/checks/config/config-folder.test.ts: 'keys every catalogue group by the rail page it holds, in rail order, System after Help' [checks/config/config-folder.test.ts:479], 'gives every group a chord and a glyph, and no letter a key the workbench binds' (:623, which holds isChorded for every section and the chord list), 'names a configured group and a nonnegative order in every listed registration' (:681, which holds 'no view left out of a group' and so an empty direct list)); describe 'the readers of layout.yml' (3 tests, every sentence a row of the wrong-type table); 'carries the group's glyph when it has one' (the groupGlyph test needs arrange to carry the glyph); 'finds a view anywhere in an arrangement' (rows of the table [state/workbench/navigation/catalogue.test.ts:397]). Table pruned 33 rows (type variants of one field of readGroups/readChord/readDocs/nodeHolds/onCataloguePage). beforeEach and the application registry removed (only the real-config block used them). label. 61 tests.
- navigation/editor-status.test.ts: deleted 'asks a tab to run one editor action by its id' (the store keeps any ask it is handed, so it is the 'asks a tab that has said something' test with another kind; its comment named it an audit that tsc gives). label. 4 tests.
- navigation/editor-text.test.ts: read, kept whole (6 tests). label.
- navigation/notices.test.ts: read, kept whole. label.
- navigation/notice-sources.test.ts: deleted 'is told as a write that got no answer when it is given up for want of one' (a real 50 ms timer with a 5 s timeout, a Decision-1 cause; the give-up is held with fake timers by tests/state/client/writes.test.ts:54-80 and the unwritten-to-notice wiring by 'is told as a write that got no answer when the request never reached the server' [state/workbench/navigation/notice-sources.test.ts:314]), 'is not started by a poll the cluster did not answer' (notice-sources.ts:243 returns on any status but ok, which the first test's 'starting' poll and mid-run 'unreachable' poll hold), 'leaves out a record that is no session record' (row 'a record that is a list' [state/workbench/navigation/notice-sources.test.ts:342]), 'reads a run date that is not text as no run date' (rows 'a run date of null' [state/workbench/navigation/notice-sources.test.ts:368], 'a null date'). Table rows dropped 6 (no records / records map / hook string / no entities / entities string / feeds list). Unused imports removed. label. 26 tests.
- navigation/pages.test.ts: deleted describe 'what a tab is called' (its test's three sentences are rows 'a tab named by a label' [state/workbench/navigation/pages.test.ts:435], 'a tab named by an empty label' and 'a tab of a view the registry lacks...' of the wrong-type table). Table pruned 23 rows: tabNameOf state array/string and label list/null (kept: state null, no label, label number, empty, proto); railPageViews 15 rows that are parseArrangement refusals (node array/null/string, root list/null, pane view number/empty/list with number/empty list, tab state list/null, children map, sizes string/NaN/Infinity; parseArrangement's refusals are rows of navigation/arrangement.test.ts and the wiring 'none for a broken one' is `{ root: 'nothing' }` in 'are the views of the arrangement before the page is made'); resetPlan 4 'a reset over a node ...' rows (the 'broken' rail entry of 'rebuilds the pages of buttons the rail has' holds the refused-node branch at pages.ts:247 and its rebuilt branch). Table describe retitled 'the name a tab state gives and the views an arrangement node holds'. Two Revert comments of closeAsk corrected (unsaved question alone; a second question cannot be observed in closeAsk). label. 38 tests.
- navigation/rail.test.ts: deleted describe 'the rule over the rail list' (6 tests: readRail/arrangementKeys are held by tests/data/sources/config/rail.test.ts:80 'keeps the buttons the rule accepts and names each it leaves out, in order' (shape, label, glyph, page, page_unknown, repeated, glyph_unknown), :101 'checks no glyph against a vocabulary when it is given none', :76 and :58 for non-list values); 'reports each refused entry in the catalog words' (data :123), 'reports a rail that is not a list, and nothing for a config without the key' (data :115, :119), 'leaves out an entry whose glyph the vocabulary does not hold, as its finding says' (row 'pages with a glyph map' [state/workbench/navigation/rail.test.ts:91] for railPages, data :123 rail[10] for the finding), 'reads the shipped list in its order, System last' (labels constant; the key list in order is tests/shell/rail/rail-config.test.ts:30, another sweep's folder), 'reads what the tab holds as three strings per row' / 'sets the list beside what else the tab holds' / 'reads the file list whole, a broken entry included' (rows of the wrong-type table [state/workbench/navigation/rail.test.ts:233]). Table pruned 24 rows (variants of rail/arrangements/rows/glyph-map/draft/state types; the readRail ones are data rail.test.ts :76/:80). Kept: the shipped railFindings == [] (no other test runs railFindings over the shipped config). Helper outside tests/state now unused: tests/shell/rail/shipped-rail.ts export SHIPPED_RAIL_LABELS (grep). label. 33 tests.
- navigation/registry.test.ts: 30 -> 10 tests. Deleted 'registers a view and looks it up by id' (viewFor('probe-one').label is read by 'replaces an earlier registration'), 'has nothing for an id nobody registered' (viewFor('Partial') undefined in 'ignores a partial'), 'registers every view id the application has' and 'gives every view its exact group and order' (constant lists of ids, groups and orders; a configured group and nonnegative order is held by tests/checks/config/config-folder.test.ts:680 'names a configured group and a nonnegative order in every listed registration'), the registrations of Data, Lit Watch, Position Leads, Inbox, LinkedIn, the manual and a hub document, the slide catalog, the source editor, Venues, Pillars/Domains/Map, 'registers the Pillars view under that id alone' (label and glyph key constants and absences; every label and glyph resolves is 'names a label key the text catalog holds' / 'names a glyph key whose value...' which are kept), 'registers the one board component under all three of its ids' (a component identity), 'registers every configured rail count and its urgency tone' (typeof function and tone constants of Inbox.svelte:13, Leads.svelte:11, Linkedin.svelte:12; the look), 'audits that the Agents and Changes views carry a glyph of their own' (two named pairs of glyph keys). Kept test lost the constant COLLECTIONS list. Deleted the two glyph-uniqueness tests 'audits that every view of the catalogue carries a glyph of its own, the collections apart' and 'audits that every chorded group carries a glyph no view inside it carries' (the brief's cases at :505 and :522: assertions over the shipped configuration's glyph constants; two views with one glyph stop no view, key or command; no other test held the property); the unused catalogue.ts imports went with them. 30 -> 10 tests. label.
- navigation/status.test.ts: deleted describe 'the server item' (socketWords: three catalog words), 'reads a file tab state as its root key and path' (rows of the wrong-type table [state/workbench/navigation/status.test.ts:344]: 'a root and a path', 'an empty root', 'a path alone', 'null', 'an array', 'more keys than the two'), table rows 7 (tabFile undefined/string/number/empty map, path number/null, root list). 'names a C++ file C++, the new languages by their display names, and lists every language of the map' cut to 'lists every language of the language map' (display-name lists are constants of the language catalog); 'matches a language by the letters of its name in their order' lost its first three lines (verbatim 'lists Plain Text first and the rest by name'); 'holds no repository for a folder no repository contains, and for a key that is no folder' lost the key line (verbatim in 'reads a tab holding no file as the hub'). label. 32 tests.
- workbench/palette.test.ts: deleted 'opens the disclosure a feed entry may sit behind when it is revealed' (the state objects are in the table rows 'a lead with a title and a subject' [state/workbench/palette.test.ts:262], 'a radar entry with a title', 'a linkedin entry with a file and a subject that is a number'), 'indexes every nested string field of collection and feed entries' (rows 'a lead whose fields nest strings' [state/workbench/palette.test.ts:361], 'a collection entry with fields of every type'), describe 'the kind a result row draws' (kindWord: four catalog words), 'lists the views alone for an empty query and for one of spaces only' (its two lines are in 'lists the views alone, in index order, for no word', which now also asserts the blank query), 'lists the eleven commands, ...' (command-name list constants; the theme hint is the row 'themes in the order the list holds them' [state/workbench/palette.test.ts:257], the language availability the 'offers the language list' test), 'matches every command by two-letter prefix, ...' (the prefix filter ran in the test itself, over names). 'requires every word and ranks a title hit above a body-only hit' retitled 'requires every word of the query' (the title-first rank is 'ranks the item whose title matches above one whose text alone does'); 'parses a command prefix and its argument' lost its startsWith filter over the command list. Table pruned 14 rows (theme list type variants, lead/radar/linkedin title fallback variants). kindWord (src/lib/state/workbench/palette.ts:240) is imported by src/lib/shell/keys/Palette.svelte:48 so not unused, and is now untested (Doc text). label. 31 tests.
- workbench/rail-badges.test.ts: deleted 'reads one collection live-status rule and counts normalised entry fields' (every sentence is a row: 'a rule of a label', 'a rule of a tone', 'a rule of a match that holds numbers and words', 'entries counted by a status with spaces and capitals', 'a rule of a config with no nav_live') and 'reads split tones from config independently of type_color' (row 'a split of tones' [state/workbench/rail-badges.test.ts:661] of the projects table gives the same colors through the same branch). Tables pruned 34 rows (type variants: nav_live string/null, row null/string, match map/only numbers/blank word, label number, tone number, literal __proto__ key, status boolean/map, lead status null/list, deadline list/null/map, window Infinity, post date empty, cadence Infinity/negative, count negative/Infinity/fractional; projects badge: 'the shipped config' (constants held by 'assembles projects from the real registration hooks' [~state/workbench/rail-badges.test.ts:338]), scan string/null, type list, tier list, no tier, no type, split string/null, empty tones). rail-badges-fixture.ts read, not edited (badgeSnapshot, installBadges both still imported). 67 tests.
- workbench/selection.test.ts: deleted describe 'the pin a view instance keeps' (both tests are rows 'a session that is a string' [state/workbench/selection.test.ts:46], 'a map with no session', 'an empty session', 'a session that is a number', 'undefined', 'an array' of the pin table); table pruned 5 rows (null/string/number state, session list/null) and the describe retitled 'the pin a view instance keeps over the state it saved'. Selection describe read, kept whole. label. 10 tests.
- workbench/ui-shared.test.ts: deleted 'save their own records when the stored value cannot be read' (the stored value turning unreadable is 'write every record they hold when the stored value becomes unreadable after a save', which also keeps a record saved earlier). The other 9 tests read and kept. label.
- workbench/ui-load.test.ts: deleted the setter tests 'reads %s as no text scale' (NaN/Infinity/-Infinity) and 'rounds a text scale to a tenth and reads one as the default' (setTextScale and loadUi both go through boundedTextScale at ui.svelte.ts:432 and :559; rows 'a text scale of 1.24' [state/workbench/ui-load.test.ts:223], '1.25', '1.04', 'under the bound', 'over the bound', 'of infinity' hold the same branch). Table pruned 35 rows (non-map JSON texts, version string/zero, theme null/list/capitals, wallpaper null, icons/unicode combinations, text scale null/one/negative/-infinity/list, terminal size null/negative/zero/-infinity, code theme empty/null, hidden items map/null, quiet string, instances array with items/null/number/empty, dismissed lead ids, __proto__ null/number). 'the numbers a viewer sets' keeps setTerminalFont NaN/Infinity (the setter clamps at ui.svelte.ts:579, not the load path). head was 'Layer 4, test.' -> label. 51 tests.
- workbench/ui.test.ts: 41 -> 26 tests. Deleted (each held by a row of ui-load.test.ts's loadUi table or another kept test): 'reads a hidden list saved wrongly as the entries it can use, and one saved before it as none' (rows 'hidden items that repeat and hold empty and non-strings' [state/workbench/ui-load.test.ts:303], 'quiet that is a number', 'the version alone'), 'bounds a saved app scale and rejects a non-number' (rows 'a text scale over the bound' [state/workbench/ui-load.test.ts:238], 'a text scale that is a string'), 'bounds a saved terminal size and rejects a non-number' (rows 'a terminal size over the bound' [state/workbench/ui-load.test.ts:268], '... that is a string'), 'reads the wallpaper and the glyph mode back, each on its own' (rows 'a wallpaper that is true/false', 'icons that are true' and 'keeps a wallpaper the toggle turned off under a theme that shows one'), 'reads a choice saved under the older field name when no icons field is saved' and 'writes a choice read under the older field name back under icons at once' (rows 'icons that are absent beside unicode true/false', 'icons that are false beside unicode true'), 'takes the two flags from the config when the saved appearance predates them' (row 'the version alone' [state/workbench/ui-load.test.ts:130] and 'follows the theme while the toggle has not been pressed'), 'reads a wallpaper saved by the earlier envelope as no choice at all' (rows 'the earlier version with a wallpaper' [state/workbench/ui-load.test.ts:121], '... and instances'), 'reads back what it wrote' (row 'every field right' [state/workbench/ui-load.test.ts:152] is the envelope 'saves the seven appearance values' writes), 'saves and restores distinct source working and saved copies by instance id' and 'keeps two instances of the same view apart by their ids' (the instance records of 'saves the seven ...' and the row 'instances of every type' [state/workbench/ui-load.test.ts:328]; two-tab separation is ui-shared.test.ts), 'falls back to the default theme for a stored name the theme list does not hold' (rows 'a theme the list does not hold' [state/workbench/ui-load.test.ts:171], 'every field of the wrong type'), 'falls back whole on another version, on nothing readable, and on a broken shape' (rows 'a map with another version' [state/workbench/ui-load.test.ts:116], 'text that is not JSON', 'every field of the wrong type', 'instances that are a string'), 'loads an envelope saved before the field, every other value as saved' (subsumed by 'keeps the config default reaching a browser with a saved theme and instance state' [state/workbench/ui.test.ts:363], which also asserts theme and instance state), 'reads a saved id the list does not hold as no pick' (rows 'a code theme the list does not hold' [state/workbench/ui-load.test.ts:278], '... that is a number'). Removed EARLIER_VERSION. loadConfig is read once into SHIPPED instead of on every code-theme case. label. 26 tests.

- The shipped config is read once per file (a module constant) in workbench/navigation/arrangement.test.ts (SHIPPED), workbench/layout/open/kept-panes.test.ts (SHIPPED) and sources/explorer/explorer.test.ts (the catalog read once in the describe, not in beforeEach). A loadConfig call costs about 130 to 145 ms (measured as the minimum of the first test of explorer.test.ts and of 'mints a fresh instance id' in arrangement.test.ts when each called it), so the config is read once per file.

### Additional rows
- client/writes.test.ts: the table title 'is read from %s as %p' is 'is read from %s' ('%p' printed literally in the verbose output of the 11 rows).
- client/fetch-record.ts: new helper, a stubbed fetch that records each request (`asked`, `serving`); system/machine/hpc.test.ts and sessions/terminal/pty/pty-fixture.ts import it, so the stub that sessions/terminals.test.ts and hpc.test.ts each defined is written once.
- sessions/terminal/pty/pty-fixture.ts: FakeSocket is a class with no export (nothing imports it; `connected()` returns it).
- shared/instance-state-feeds.test.ts: the search/reveal rows (wrong values, empty strings, blank reveal, padded search, no reveal) are kept only on the LinkedIn reader, which shares `searchRevealShape` with the inbox, leads, radar, collection, data and venues readers (the shared-shape rule above); head rewritten to say so.
- tests/checks/tree/allow-duplication.txt: two entries removed (the writes.test.ts / notice-sources.test.ts pair, 9 lines; the terminals.test.ts / hpc.test.ts pair, 11 lines), nothing added; `tests/checks/tree/duplication.test.ts` passes in the test:checks run quoted above.

## Folds, old titles against rows

Each fold's old case titles and the rows of its table as the final run prints them (every row names itself in the title, and each row asserts what the case it replaced asserted). The run is `npx vitest run tests/state --tagsFilter '!slow'`, 5658 passed, 0 failed.

- tests/state/client/writes.test.ts
  - old titles: the time a write waits is the positive number of seconds the configuration names, in milliseconds; the time a write waits is none for a configuration that names no positive number; the time a write waits is read from a timeout_seconds of %p as %p (the table of six rows, whose title printed %p literally)
  - rows (11), as the verbose run prints them:
    - the time a write waits is read from thirty seconds
    - the time a write waits is read from half a second
    - the time a write waits is read from five seconds
    - the time a write waits is read from no configuration
    - the time a write waits is read from an empty configuration
    - the time a write waits is read from writes that is a list
    - the time a write waits is read from zero
    - the time a write waits is read from a negative number
    - the time a write waits is read from a number written as text
    - the time a write waits is read from infinity
    - the time a write waits is read from no timeout_seconds
- tests/state/client/terminal/terminal-start.test.ts
  - old titles: New Terminal on the bar posts nothing before the hub root is known, and never an empty folder; New Terminal on the bar posts one start for each of three presses made before the hub root, once it is known
  - rows (2), as the verbose run prints them:
    - New Terminal on the bar posts one start per press, with one press made before the hub root, once it is known
    - New Terminal on the bar posts one start per press, with three presses made before the hub root, once it is known
- tests/state/feeds/inbox.test.ts
  - old titles: the sender of a thread, split for its card reads the display name and the address of a From line; ... reads a quoted display name without its quotes, a comma inside it included; ... reads a bare address as an address with no name
  - rows (3), as the verbose run prints them:
    - the sender of a thread, split for its card reads the From line of a display name and an address
    - the sender of a thread, split for its card reads the From line of a quoted display name with a comma inside it
    - the sender of a thread, split for its card reads the From line of a bare address
- tests/state/forms/manifest-draft.test.ts
  - old titles: a reload reads nothing out of a record that is not a draft (one test over five records)
  - rows (5), as the verbose run prints them:
    - a reload reads a project with no name of a saved record as {"project":"","edits":{}}
    - a reload reads edits that are a list of a saved record as {"project":"alpha","edits":[]}
    - a reload reads no edits of a saved record as {"project":"alpha"}
    - a reload reads a string of a saved record as "alpha"
    - a reload reads a project and its edits of a saved record as {"project":"alpha","edits":{"title":"x"}}
- tests/state/sessions/hooks.test.ts
  - old titles: hooksSnippet carries another port and never the first one; hooksSnippet carries the origin whole, scheme and all, with or without a port
  - rows (3), as the verbose run prints them:
    - hooksSnippet carries the origin whole, for another port, and never the default port
    - hooksSnippet carries the origin whole, for no port, and never the default port
    - hooksSnippet carries the origin whole, for a scheme and a port, and never the default port
- tests/state/workbench/drag.test.ts
  - old titles: a tab dragged with Alt held floats on drop at the pointer, wherever the pointer was released; a tab dragged with Alt held floats over no drop at all, and over a strip or an edge
  - rows (4), as the verbose run prints them:
    - a tab dragged with Alt held floats at the pointer over no drop, wherever the pointer was released
    - a tab dragged with Alt held floats at the pointer over the middle of a body, wherever the pointer was released
    - a tab dragged with Alt held floats at the pointer over a strip, wherever the pointer was released
    - a tab dragged with Alt held floats at the pointer over an edge, wherever the pointer was released
- tests/state/workbench/layout/layout.test.ts
  - old titles: splitWith puts the new pane after the split one on the right edge and before it on the left; splitWith makes a column on the bottom edge and on the top edge
  - rows (4), as the verbose run prints them:
    - splitWith splits a pane on its right edge, the dropped tab in the new pane
    - splitWith splits a pane on its left edge, the dropped tab in the new pane
    - splitWith splits a pane on its bottom edge, the dropped tab in the new pane
    - splitWith splits a pane on its top edge, the dropped tab in the new pane
- tests/state/workbench/layout/nested.test.ts
  - old titles: embedPage splits the pane at the path and puts the page on the edge (the right edge); embedPage puts the page before the pane for the left and the top edge (asserts the top edge only)
  - rows (2), as the verbose run prints them:
    - embedPage splits the pane at the path and puts the page on its right edge
    - embedPage splits the pane at the path and puts the page on its top edge
- tests/state/workbench/layout/open/floats-store.test.ts
  - old titles: a view opened while its tab is in a float activates the float's tab, and makes no second instance anywhere; a view opened while its tab is in a float does the same for a view opened for something, by its record
  - rows (2), as the verbose run prints them:
    - a view opened while its tab is in a float activates the float's tab for a view, and makes no second instance anywhere
    - a view opened while its tab is in a float activates the float's tab for a view opened for something, and makes no second instance anywhere
- tests/state/workbench/layout/saved/layout-saved.test.ts
  - old titles: the version 2 envelope, read as one tree keeps the main tree as the root when the panel holds nothing; ... keeps the main tree as the root when the panel is hidden and holds nothing; ... makes a row of the two trees for a panel on the right, at the share it had; ... makes a column of the two trees for a panel along the bottom
  - rows (4), as the verbose run prints them:
    - the version 2 envelope, read as one tree keeps the main tree as the root when the panel holds nothing, for a panel on the right
    - the version 2 envelope, read as one tree keeps the main tree as the root when the panel holds nothing, for a hidden panel
    - the version 2 envelope, read as one tree makes a split of the two trees for a panel on the right, at the share it had
    - the version 2 envelope, read as one tree makes a split of the two trees for a panel on the bottom, at the share it had
- tests/state/workbench/layout/saved/layout-system.test.ts
  - old titles: ...as the rail shipped it labels the page System; ...as the rail shipped it keeps a label the viewer gave the page; ...as a row of two panes labels the page System; ...as a row of two panes keeps a label the viewer gave the page
  - rows (4), as the verbose run prints them:
    - the saved System page carried over a saved views page holding settings, the navigators and no system view as the rail shipped it labels the page for the name the rail shipped
    - the saved System page carried over a saved views page holding settings, the navigators and no system view as the rail shipped it labels the page for a name the viewer gave the page
    - the saved System page carried over a saved views page holding settings, the navigators and no system view as a row of two panes labels the page for the name the rail shipped
    - the saved System page carried over a saved views page holding settings, the navigators and no system view as a row of two panes labels the page for a name the viewer gave the page
- tests/state/workbench/layout/layout-store.test.ts
  - old titles: the store activates the instance a view already has rather than opening a second; the store activates the instance opened for the same state rather than opening a second
  - rows (2), as the verbose run prints them:
    - the store activates the instance a view already has for a view with no state rather than opening a second
    - the store activates the instance a view already has for the same state rather than opening a second
- tests/state/sessions/source.test.ts
  - old titles: source tab state keeps the rendered half per instance, off until the toggle turns it on; source tab state keeps the blame per instance, off until the toggle turns it on
  - rows (2), as the verbose run prints them:
    - source tab state keeps the rendered half per instance, off until the toggle turns it on
    - source tab state keeps the blame half per instance, off until the toggle turns it on
- tests/state/forms/schema.test.ts
  - old titles: the values and the text of a form over the wrong type opens a pin as ticked only when the project says true (a loop of five values in one test)
  - rows (5), as the verbose run prints them:
    - the values and the text of a form over the wrong type opens a pin as ticked only when the project says true, for true
    - the values and the text of a form over the wrong type opens a pin as ticked only when the project says true, for false
    - the values and the text of a form over the wrong type opens a pin as ticked only when the project says true, for the text true
    - the values and the text of a form over the wrong type opens a pin as ticked only when the project says true, for the number 1
    - the values and the text of a form over the wrong type opens a pin as ticked only when the project says true, for nothing
- tests/state/life/notes.test.ts
  - old titles: when a note says it was saved is nothing for a note that has never been written / for a time that is not a number / for a time that is infinite or before the epoch; the keystroke that writes its note at once is the first one into a note whose file is not there yet / is not the ones after it / is not any keystroke into a note that has a file already
  - rows (9), as the verbose run prints them:
    - when a note says it was saved is nothing for a note that has never been written
    - when a note says it was saved is nothing for a time that is not a number
    - when a note says it was saved is nothing for an infinite time
    - when a note says it was saved is nothing for a negative infinite time
    - when a note says it was saved is nothing for a time before the epoch
    - the keystroke that writes its note at once writes at once, or not, for a keystroke into a note whose file is not there yet
    - the keystroke that writes its note at once writes at once, or not, for a keystroke after the first into that note, which goes through the wait
    - the keystroke that writes its note at once writes at once, or not, for a first keystroke into a note that has a file already
    - the keystroke that writes its note at once writes at once, or not, for a later keystroke into a note that has a file already
- tests/state/feeds/feeds.test.ts
  - old titles: the refresh thresholds takes a feed its threshold from refresh_stale_days and none from anywhere else; the refresh thresholds never nudges a feed that the key does not name
  - rows (3), as the verbose run prints them:
    - the thresholds of a config whose values are missing or of the wrong type reads the limit of the inbox feed from {} as null
    - the thresholds of a config whose values are missing or of the wrong type reads the limit of the inbox feed from {"stale_days":{"inbox":30,"litwatch":14}} as null
    - the thresholds of a config whose values are missing or of the wrong type reads the limit of the inbox feed from {"refresh_stale_days":{"inbox":2},"stale_days":{"inbox":30}} as 2
- tests/state/system/audit-message.test.ts
  - old titles: the sentence one refused mute reads as gives a word it does not know the general sentence, and draws no wire word (with the loop over unknown words)
  - rows (6), as the verbose run prints them:
    - the sentence one refused mute reads as says nothing at all for a mute that was written
    - the sentence one refused mute reads as has a sentence of its own for every word the endpoint answers with
    - the sentence one refused mute reads as says the request never arrived when the fetch itself failed
    - the sentence one refused mute reads as gives no word the general sentence
    - the sentence one refused mute reads as gives an empty word the general sentence
    - the sentence one refused mute reads as gives a word it does not know the general sentence
- tests/state/sources/explorer/acts/keys.test.ts
  - old titles: thirty-two generated tests, one per action and chord and platform: the keymap as the tree routes it gives <action> on <chord> to the tree on macOS / on another platform
  - rows (2), as the verbose run prints them:
    - the keymap as the tree routes it gives every chord of the keymap on macOS to the tree
    - the keymap as the tree routes it gives every chord of the keymap on another platform to the tree
- tests/state/sessions/source/view-source.test.ts
  - old titles: answers each feed kind the path its own configuration key names; answers each registry view the path its own configuration key names; answers a collection key the file of its own entry, under the hub root; answers null for a configuration that names no file, and for an unknown collection; reads past a collections list holding anything but entries with a key and a file; answers nothing for a collections key that is a map, and for a row that is a list; answers the file of the first row that carries the key, whether or not the file is a path; trims a path, and reads an empty key like any other; answers nothing for a feed path that is a list or null, or that sits behind an own __proto__ key
  - rows (25), as the verbose run prints them:
    - the file a view is drawn from answers the leads view the path its configuration key leads_file names
    - the file a view is drawn from answers the radar view the path its configuration key radar_file names
    - the file a view is drawn from answers the linkedin view the path its configuration key linkedin_dir names
    - the file a view is drawn from answers the people view the path its configuration key people_file names
    - the file a view is drawn from answers the venues view the path its configuration key venues_file names
    - the file a view is drawn from answers the datasets view the path its configuration key datasets_file names
    - the file a view is drawn from answers the pillars view the path its configuration key pillars_file names
    - the file a view is drawn from answers the domains view the path its configuration key domains_file names
    - the file a view is drawn from answers a collection key the file of the entry that carries it, reading past other rows
    - the file a view is drawn from answers null for a collection with no collections list
    - the file a view is drawn from answers null for a collection with no key asked for
    - the file a view is drawn from answers null for a collection with a key no entry carries
    - the file a view is drawn from answers null for a collection with a collections list that is a string
    - the file a view is drawn from answers null for a collection with a collections key that is a map
    - the file a view is drawn from answers null for a collection with a row that is a list
    - the file a view is drawn from answers null for a collection with an entry with no file
    - the file a view is drawn from answers null for a collection with an entry whose file is an empty string
    - the file a view is drawn from answers null for a collection with a first entry whose file is not a path, before one that is
    - the file a view is drawn from answers null for a feed with no key
    - the file a view is drawn from answers null for a blank feed path
    - the file a view is drawn from answers null for a feed path that is a number
    - the file a view is drawn from answers null for a feed path that is a list
    - the file a view is drawn from answers null for a feed path that is null
    - the file a view is drawn from answers null for a feed path behind an own __proto__ key
    - the file a view is drawn from trims a path, and reads an empty collection key like any other
- tests/state/feeds/inbox-store.test.ts
  - old titles: what the inbox store commands answer answers ok and no sentence when the endpoint took the command; a refusal whose code is not text takes a command the endpoint answered with a status below 400 as taken, whatever the body (the old loop test); a refusal whose code is not text says the code of a refusal only when it is text
  - rows (6), as the verbose run prints them:
    - what the inbox store commands answer takes a command answered with a status below 400 and the body {"ok":true} as taken
    - what the inbox store commands answer takes a command answered with a status below 400 and the body {"error":3} as taken
    - what the inbox store commands answer takes a command answered with a status below 400 and the body [] as taken
    - what the inbox store commands answer takes a command answered with a status below 400 and the body null as taken
    - what the inbox store commands answer takes a command answered with a status below 400 and the body "x" as taken
    - what the inbox store commands answer answers a refusal in the catalog sentence carrying its code, only when the code is text
- tests/state/life/present.test.ts
  - old titles: plainTitle strips the markup and the escapes a deck title is written with (retitled); plainTitle decodes a named, a no-break and a numeric escape, the no-break space folded to a plain one (retitled); parsePresentState reads a pane place, with the first slide and a closed grid for what is missing (its default cases are rows of the wrong-type table)
  - rows (12), as the verbose run prints them:
    - plainTitle strips the markup and escapes a deck title is written with
    - plainTitle strips a named, a no-break and a numeric escape, the no-break space folded to a plain one
    - parsePresentState over input of the wrong type reads [] as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads "x" as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads 3 as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads null as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads {"slide":null} as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads {"slide":["a"],"overview":1} as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads {"overview":"true"} as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads {} as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads {"slide":7,"overview":"yes"} as the first slide and a closed grid
    - parsePresentState over input of the wrong type reads an empty slide key and an own __proto__ key as they stand
- tests/state/system/lines.test.ts
  - old titles: the line count store says the status when a failed answer carries no sentence; the line count store says the answer is not a count, and no parser message, when it is not JSON; the line count store says the answer is not a count when a 200 carries a page
  - rows (5), as the verbose run prints them:
    - the line count store says the status when a failed answer carries no error as a sentence
    - the line count store says the status when a failed answer carries an error that is a number as a sentence
    - the line count store says the status when a failed answer carries an empty error as a sentence
    - the line count store says the answer is not a count, and no parser message, for an HTML page
    - the line count store says the answer is not a count, and no parser message, for a JSON null
- tests/state/system/docs.test.ts
  - old titles: whether a root holds a file: reads a doubled separator and a trailing one as one; holds nothing in a folder whose name only begins like its own; reads a backslash as a separator, as a Windows path writes it; holds every file under the top of the file system; and the dot-segment tests (six holds() tests, one table of seven rows)
  - rows (7), as the verbose run prints them:
    - whether a root holds a file reads a doubled and a trailing separator as one
    - whether a root holds a file reads a dot segment as the folder it is in
    - whether a root holds a file reads a dot-dot segment as the folder above
    - whether a root holds a file reads a folder named like the start of its own as another folder
    - whether a root holds a file reads a file in a folder named like the start of the root as outside it
    - whether a root holds a file reads a backslash as a separator
    - whether a root holds a file reads every file as under the top of the file system


## Helpers and exports

Helpers under `tests/state` that a file outside `tests/state` imports keep every export (Decision 2): `workbench/layout/layout-fixture.ts` (16 importers), `boards/board/board-fixture.ts`, `sessions/terminal/commands-fixture.ts`, `workbench/rail-badges-fixture.ts`, `boards/board/side-fixture.ts`, `system/settings/fixture.ts`. `sources/off-facets.ts` was imported only by `sources/datasets.test.ts` and `sources/venues.test.ts` and is deleted (`grep -rn "off-facets" src tests` prints nothing).

Exports of `tests/state` helpers that no file imports (all present at the base too, so none is newly unused, none is touched): `board-fixture` `EMPTY_RELATIONS`, `ENGINE_CONFIG`, `jointWork`; `socket-stub` `StubSocket`; `commands-fixture` `Case`; `instance-fixture` `answersOf`, `inputsOf`; `fs-fixture` `StoreCase`; `layout-recorder` `Opened`; `refusal-fixture` `UUID`, `benchText`, `pagesText`, `stateText`, `treeText`. Each stays because a helper module under `tests/state` that a file outside it imports keeps every export; for the helpers no outside file imports the export list is as the base had it.

Helper exports outside `tests/state` that the sweep leaves with no importer, named for the sweep that owns the folder (T1d, `tests/shell`), not deleted: `tests/shell/rail/rail-fixture.ts` export `COLLECTIONS` (line 35; its only importer was `tests/state/workbench/navigation/catalogue.test.ts`), and `tests/shell/rail/shipped-rail.ts` export `SHIPPED_RAIL_LABELS` (line 21; its only importer was `tests/state/workbench/navigation/rail.test.ts`). The other six helpers the brief lists keep their importers.

## Doc text

Sentences outside the step's paths that the sweep makes false, as `grep -n` prints them, with their replacement for the orchestrator to apply at landing:

- `src/lib/state/life/memories.ts:11:// number; tests/state/life/memories-message.test.ts pins the two exports equal.` The test is deleted: both names are the one constant `MAX_UPLOAD_BYTES` of `src/lib/data/file-ops.ts:26`, re-exported at `src/lib/state/life/memories.ts:29` and `src/lib/server/content/memories.ts:50`, so there are no two exports to pin. Replace with `// number.`

`src` exports the sweep leaves with no importer outside their own file, for removal of the `export` keyword at landing (`spec.md:83`); each is still used inside its own file:

- `src/lib/state/forms/form-drafts.svelte.ts:51:export const FORMS_SUFFIX = '#forms';` becomes `const FORMS_SUFFIX = '#forms';` (its only outside importer was `tests/state/forms/form-drafts.test.ts`).
- `src/lib/state/forms/form-drafts.svelte.ts:56:export const ADDED_SUFFIX = '#added';` becomes `const ADDED_SUFFIX = '#added';` (same importer).
- `src/lib/state/system/config/config-files.ts:8:export const CONFIG_SUFFIX = '.yml';` becomes `const CONFIG_SUFFIX = '.yml';` (its only outside importer was `tests/state/system/config-files.test.ts`).
- `src/lib/state/system/config/view/contents.ts:7:export const NARROW = 700;` becomes `const NARROW = 700;` (its only outside importer was `tests/state/system/settings/contents.test.ts`; the `NARROW` in `src/lib/ui/controls/editor/diff/DiffEditor.svelte:141` is a separate local constant).

Source comments that name a `tests/state` test and are still true after the sweep (`grep -n "tests/state" src`): `src/lib/state/shared/words/text.ts:47`, `src/lib/state/workbench/navigation/registry.ts:13` and `:102`, `src/lib/state/life/present.ts:10`, `src/lib/state/system/config/config-files.ts:13`. All 49 comments in `tests/` outside `tests/state` that name a `tests/state` path name a file that exists, and the claim each makes about it was read and holds, except one that was already false before the sweep: `tests/data/file-ops.test.ts:7:// tests/state/sources/explorer/names.test.ts, and the input drawn, which is seen at the look.` names a file that exists in neither the base nor the worktree (`naming.test.ts` is in that folder and holds no such message test); that file is T1e's, so it is named here for T1e.

Sentences on the slow tier's form (`vite.config.ts:31-35`, `README.md:15`, `HELP.md:344` and `:346` on this tree, `agents/spec.md:56`): T1c's proposal (`agents/reviews/T1c-report.md`, section 9) rewrites each to the three tag forms and Decision 1's causes, which is what `tests/state` uses (two whole-file tags, no test or describe tags). It is true for this step, and T1b adds no sentence of its own. The two tags in `tests/state` use the new reason text (a cause, not "time out or fail on a loaded machine"), so T1c's note about other module tags with the old reason text does not touch them.

## Findings outside the brief

- Tables titled with `%j` print identical titles for inputs that serialise alike (`NaN`, `Infinity`, `-Infinity` and `null` all print `null`), so a failing row cannot be told from its twins in the verbose output. In the final run 18 test titles repeat inside their file, in 8 files (`client/selectors.test.ts` 6, `feeds/feeds.test.ts` 3, `life/notes.test.ts` 3, `feeds/leads.test.ts` 2, one each in `feeds/radar.test.ts`, `shared/words/appearance.test.ts`, `sources/search/endpoint.test.ts`, `sources/fs/fs-answers.test.ts`); the base run had 26. These are kept tables the sweep did not fold, so they are unchanged; naming the rows is a mechanical edit of those eight tables if wanted.
- Plain `npx tsc --noEmit -p .` reports 14 errors, all in files the sweep did not change (for example `src/lib/views/shared/card/card.ts` and `tests/views/**`) and none in `tests/state`; the project's own gate `npm run check` (svelte-check) reports `0 ERRORS` for the whole project (in the `checks.sh` output above). Whether `tsc` reports the same 14 on the base is not verified.

## Judgment calls

1. **Assertions removed from kept tests (brief item 4 against item 1).** Item 1 deletes a test of a constant, a label or a catalog string, a type, a pass-through or a re-export. Item 4 says no assertion of a kept test is loosened, widened or rewritten except to fold it into a table. A kept test that holds one behaviour assertion beside one assertion of a shipped constant puts the two against each other. I applied item 1 to the assertion, so the constant assertion was removed and the behaviour assertions stayed. The files where this happened are the entries above that say an assertion, a constant or a line was removed from a kept test (among them `workbench/navigation/arrangement.test.ts`, `registry.test.ts`, `status.test.ts`, `palette.test.ts`, `life/present.test.ts`, `life/calendar.test.ts`, `forms/form-drafts.test.ts`, `forms/schema.test.ts`, `forms/schema-modelled.test.ts`, `system/settings/rows.test.ts`, `write.test.ts`, `sessions/terminal/terminal-marks.test.ts`, `terminal-row.test.ts`, `layout-locked.test.ts`, `layout-pinned.test.ts`, `feeds/inbox.test.ts`). Four of them replace an assertion by a weaker one rather than only removing a constant, and these are the ones that need a ruling: in `workbench/navigation/arrangement.test.ts` 'mints a fresh instance id' `expect(new Set(ids).size).toBe(8)` is now `expect(ids.length).toBeGreaterThan(1)` and `expect(new Set(ids).size).toBe(ids.length)`; the placement test's `expect(wanted).toHaveLength(51)` is now `expect(wanted.length).toBeGreaterThan(0)`; 'turns the shipped sessions arrangement' lost its `root.kind` and `viewsOf` constant list; 'makes the Help page' lost its shipped tab list. Recommendation: keep all of them, since a count of shipped tabs is a constant of the configuration and the behaviour (distinct ids, a non-empty placement) is still asserted. The lazy option would be to restore every removed assertion so the brief reads literally, which leaves tests of constants in `npm test`; the better option is to keep the removals and let the orchestrator rule on the four rewrites. Restoring any one is a one-line edit.
2. **Timing method.** The brief asks for five verbose runs of each file. I took five runs of the whole folder with the JSON reporter, which prints the same per-test durations the verbose reporter does, and took each test's minimum over the five. This gives five samples per test at the load of five whole-folder runs, which is higher than a single file alone would see, so the minima are upper bounds and a test over 80 ms in a lone file run would also have shown over 80 ms here.
3. **Splitting `sessions/terminals.test.ts`.** At 893 lines it was within 20 lines of the 900-line limit, and `sessions/` and `sessions/terminal/` already held 10 items. The socket cases moved to `sessions/terminal/pty/pty-socket.test.ts` with `FakeSocket`, `connected` and `serving` in `pty/pty-fixture.ts`, and `pty-io.test.ts` moved into the new folder (`src/lib/state/sessions/terminal/pty/` has the same name) so `sessions/terminal` stays at 10 items. `terminals.test.ts` is 431 lines.
4. **`vi.waitFor` and fixed waits.** The brief names 13 `vi.waitFor` calls in `sessions/terminals.test.ts` and 1 in `life/memories-message.test.ts`; `grep -o "waitFor"` over the base prints 12 and 1. All 13 are replaced by the code's own signal (a send count on `FakeSocket`, the fetch call that makes a count, the query cache's subscription); the three fixed waits (`terminals.test.ts` idle at 20 ms, `sections.test.ts` settle at 30 ms, `view-state.test.ts` 2 ms timer) are a one-macrotask settle, an awaited outline and fake timers. Controls for the first two are in their entries.
5. **Tag form.** Both tagged files take the whole-file tag because every test left in them is slow; no test or describe tag is used in `tests/state`.
6. **`Revert:` comments.** `grep -rn "Revert:" tests/state` finds 509 (542 at the base). A revert was run as a control (the code under test changed, the test run, the change undone) for the tests named with "control" in their entries above: `instance`, `sections` follower, `file-language`, `fs-text-fresh`, `search`/`replace`, `shared/answers`, `system/lines`, `system/docs`. Also `workbench/layout/instance.test.ts` (a control on `instance.ts:184`), `sessions/terminals.test.ts` (the settle versus the 20 ms wait) and the four `shared/instance-*` files (a throw in the code for the stale and missing answers). The other `Revert:` comments were judged by reading the code path, not by running a revert, in the files I read; none of the other `workbench/` ones was run. A comment found false by reading was corrected or the test deleted.
7. **Five read-only git calls.** The builder runs no git command. Reading my own transcript I found five read-only calls: `git -C . status >/dev/null` (twice), `git diff --stat`, `git -C <worktree> status --short` and `git -C . rev-parse --show-toplevel >/dev/null`. None wrote anything.
8. **Brief details that did not match the tree.** The `vi.waitFor` count above; `registry.test.ts:468` and `:473` are at `:156` and `:161` after the sweep; the brief's "205 test files" counts `*.test.ts` and the `.ts` count (223) is also given in the counts table. The cases themselves matched the code, so no case was handed back.
