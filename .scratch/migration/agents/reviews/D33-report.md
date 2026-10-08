NOT done: ruling 5 (a served root removed takes its rows with it). I stopped at the ruling's first step, as it says: a project command can run in a repository that is not itself a served root (a git repository nested under a served root), so the ruling's rule for command rows would drop rows of a live repository. Nothing of ruling 5 is changed in the tree, for the LaTeX store as well. The place that shows it, the options and a recommendation are under "Ruling 5: the finding", and it needs to be booked as an open item for Axel (I do not edit the state file). The other 16 rulings are done. Page checks still have no run (this round runs no page); each is proven by a reading or a unit-level run and has its look on landing named in "Case table".

## Not done, in detail

1. Ruling 5, both halves: the LaTeX store forgetting the targets and diagnostics of a root that leaves the served roots (`state/sessions/latex/latex.svelte.ts`), and a command row going when its repository leaves the served roots. Case 8 stays as the refuter found it. No before/after run exists for either source.
2. Cases with no page run on the final tree. Each is proven by a reading and by the look on landing named in its row of the case table (builders run no page): 6, 8, 14, 15, 21b, 25a to 25d, 26a to 26e, 28 (the row with no file and the mute-control focus), 33 (two panes each holding a restored cursor), the c/cpp part of 5, and, from this round, the table's press (ruling 3), the table with closed files (ruling 2) and the toggle keeping the view's state (ruling 6): their runs are node runs over the functions that decide them, and the page behaviour is the look on landing.
3. One full-list `checks.sh` run in the first build was red once: `tests/state/sessions/source.test.ts` "takes the new text into a clean tab, with its edits, and keeps no unsaved mark" failed at `source.test.ts:466`. The file then passed repeatedly alone, I did not find the cause and did not run it on the base, so whether it also fails there is not verified. In this round the file passed alone (25 tests) and inside the full-list run.

## Open items

Copied from `orchestrator-state.md` ("Open items") at the moment of writing:

- Open item 9 (2026-10-08), D33's test of the list that shrinks: the diagnosis of D33's Proof 1 (`agents/reviews/D33-diagnosis.md`, second heading) found the cause in `ui/tree/list/VirtualRows.svelte` (the window a `$state` written by a `$effect.pre`, so a list that shrinks inside an effect is read past its end: `TypeError` in Changes, Graph, Console and the Explorer tree, `each_key_duplicate` under the Problems guard). The fix goes into D33's round 1. Its test (`tests/ui/tree/list/virtual-rows.client.test.ts`, with a 420-line test-only DOM helper `mini-dom.ts` that mounts the component) has no guarded entry, and spec.md keeps DOM behaviour with the look. (a) a guarded entry G65 for VirtualRows' window, the three files landing with D33; (b) no test, the fix resting on the diagnosis's red command and the look, the lazy option. Recommended: (a), since a list that throws stops that view updating.

New, to be booked by the coordinator (from ruling 5, section "Ruling 5: the finding"): which rule drops a command's rows when a served root is removed.

## Round 1: one line per ruling

All paths are under `tools/oculus` in the worktree `.agents/worktrees/D33`. The node runs (`n30` to `n34`, scratch scripts under the scratchpad run with `node --import ./register.mjs <file>.ts`) read the code as it is in the tree now; prettier then reformatted `problem-rows.ts`, whitespace only. Every other command was run after the last code change.

1. DONE. The strip's file tabs get their counts from a function the page provides: `src/lib/shell/panes/strip/file-problems.ts` (26 lines: `FileProblems`, `provideFileProblems`, `useFileProblems`), called at `src/routes/+page.svelte:86` with `problemMarkOf(problems.fileCounts(...), 'file')` and `problemWords`, read at `src/lib/shell/panes/PaneView.svelte:89` and handed to `stripTab` as `facts.problemsOf` (`PaneView.svelte:198`, `strip-tab.ts:32`, `:45`). `tabProblem` and its call are gone (`grep -rn tabProblem src tests DESIGN.md docs` prints nothing). `SHELL_STORES` and the rest of `tests/checks` are unchanged (`diff -rq` of `tests` against the base lists only `root-drag.test.ts`), and `npm run test:checks` passes: `Test Files  17 passed (17)`, `Tests  243 passed (243)`. `DESIGN.md:475` now says the page hands the panes `provideFileProblems`.
2. DONE. `rowEntriesOf(files)` (`views/sources/search/problem-rows.ts:148`) returns every row of the filtered files whatever the tree folded; `Problems.svelte:119` builds `rowEntries` from it and the table reads `rowEntries` (`:178`, `:187`); the all-filtered-out message comes from `entries.length === 0` with rows held (`:261`), which is the tree's own message for both layouts. Node run `n33` over a fold of two files (2 rows each), both closed:

```
tree lines (entriesOf, both closed): 2 = file,file
table rows (rowEntriesOf): 4 = a.py:m3 a.py:m9 b.py:m1 b.py:m4
filter that hides everything: files 0 | tree lines 0 | table rows 0 | message shown: No results found with provided filter criteria.
same closed fold, filter text "b.py": table rows 2 (only b.py rows)
```

3. DONE. One handler serves both layouts: `pressed(row, event)` (`Problems.svelte:147`) is the `onclick` of the table's message button (`:276`) and of the tree row (`:344`), `show(row, true)` the `ondblclick` of both (`:277`, `:347`); a single press (`event.detail !== 0`) previews with the keyboard kept in the view, Enter (`detail === 0`) or a double press keeps. No page run (look on landing in the case table, row 1).
4. DONE. `docs/views.md:81` states the view is per page, each page and pop-out window listing its own, with the defaults (empty filter, Show Errors, Warnings and Infos on, Show Active File Only off, every root, the tree) and the toggle keeping them; `docs/files-and-search.md:11` names the tab strip's decoration (name colour and count, `9+` from ten) and Open Editors' beside the tree's.
5. NOT DONE, stopped at the ruling's first step. See "Ruling 5: the finding".
6. DONE. `toggleView(layout, ui, view, page)` (`shell/keys/keys.ts:179-206`): hiding reads `ui.instanceState(active.id)`, closes the instance (which forgets its state, as the tab's close button does) and writes the state under the record `hidden-view:<page>:<view>` in the ui store; the next show opens the view, then, if that record exists, clears it and gives it to the instance opened unless that instance already holds a state. Both callers pass the ui store (`workbench-keys.svelte.ts:229`, `StatusBar.svelte:178`); no module variable. Node run `n30` over a stub layout and ui store:

```
show (nothing kept)    open: i1 | records: []
reader sets state      open: i1 | records: [["i1",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
toggle hides           open: none | records: [["hidden-view:p1:problems",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
toggle shows (new id)  open: i2 | records: [["i2",{"filter":"error","hideInfos":true,"scope":"r","asTable":true}]]
state of the new instance: {"filter":"error","hideInfos":true,"scope":"r","asTable":true}
close button then show open: i3 | records: []
```

7. DONE. The table states are under "User-visible changes, before and after" (rulings 3, 2 and 6 first).
8. DONE. `DESIGN.md:475`: "A Problems row and F8 open their place through `openPlace`, and a search hit or a reference through `openSourceFile` (`src/lib/views/shared/links/source-file.ts`)"; no caller was moved.
9. DONE. `docs/window.md:82` lists the left items in the `LEFT_ITEMS` order (`shell/status/status-items.ts:37-45`: host, branch, sync, problems, findings, debug, ...), the problems item before the findings item.
10. DONE. The comments at `shell/status/status-items.ts` (paragraph at lines 14-29), `views/shared/latex/Main.svelte` (lines 2-11) and `views/academic/latex/Latex.svelte` (lines 25-27) are rewrapped as paragraphs at 100 columns; `comment-width.test.ts` is in `npm run test:checks` (passed).
11. DONE. `views/sources/files/sections/OpenEditors.svelte`: `.problems` has its own comment ("The count of the errors or warnings of the row's file, before the unsaved mark...") and the unsaved-mark comment stands above `.dirty` again.
12. DONE. `endsBeforeStart(start, end)` (`state/sessions/source/draft.ts:276`) is the one rule (`end.line < start.line` or the same line and `end.column < start.column`); `openedAt` in `views/sources/source/status/tab-state.ts:54-62` reads through it, and `placed` in `draft.ts` (`:296`) drops such an end when a state is written, so the head comments at `tab-state.ts:7` and `draft.ts:59` are true. Node run `n31`:

```
read  {"line":3,"column":4,"endLine":3,"endColumn":2} -> {"line":3,"column":4,"endLine":0,"endColumn":0}
read  {"line":3,"column":4,"endLine":3,"endColumn":6} -> {"line":3,"column":4,"endLine":3,"endColumn":6}
read  {"line":3,"column":4,"endLine":2,"endColumn":9} -> {"line":3,"column":4,"endLine":0,"endColumn":0}
write (sourceTabState) of the first and third: {"root":"r","path":"a.py","label":"a.py","line":3,"column":4}; of the second: ...,"endLine":3,"endColumn":6}
```

13. DONE. `Problems.svelte:2-5` names the real place; `grep -rn "group: 'explorer'" -A1 src/lib/views` prints Files 0, Repositories 1, Search 2, References 3, LaTeX 5, Debug 6, Debug Console 7 and Problems 8, so the comment reads "the last of the eight views of the Explorer page's group (orders 0, 1, 2, 3, 5, 6 and 7 are Files, Repositories, Search, References, LaTeX, the debug view and the debug console)". `COMMAND_OWNER = 'command'` and `LATEX_OWNER = 'oculus-latex'` are defined once, `state/system/problem-sources.ts:17-18`, used there for the rows, imported by `views/sources/source/language/command-marks.svelte.ts:12` and `views/sources/source/language/latex-editor.ts:15`; `ui/controls/editor/kit/latex/latex-widget.ts` (layer `ui`, which may not import `state`) takes the owner as `LatexEditorDeps.owner`, which `latex-editor.ts:75` fills. `grep -rn "'oculus-latex'" src/lib` prints `problem-sources.ts:18` and `ui/controls/editor/kit/latex/latex-editing.ts:62`; the second is `SOURCE`, the undo source name of that file's edit commands, a different use of the same word that the ruling does not name, so it stays. `grep -rn "= 'command'" src/lib/state/system src/lib/views/sources` prints only `problem-sources.ts:17`.
14. DONE. `tests/views/shared/explorer/root-drag.test.ts:76` `vi.stubGlobal('Element', Box)` in a `beforeEach`, `:80` `vi.unstubAllGlobals()` in an `afterEach`; the module-level assignment is gone. `npx vitest run tests/views/shared/explorer/root-drag.test.ts`: `Test Files  1 passed (1)`, `Tests  2 passed (2)`. On the base: the file does not exist there, and the subject `dragging.svelte.ts` is identical to the base (`diff -q` prints nothing), so I ran the changed file against an unchanged copy of the base's `src` (a scratch copy of `D33-base/tools/oculus` in the scratchpad with the tree's `vite.config.ts` and `node_modules`): `Test Files  1 passed (1)`, `Tests  2 passed (2)`. Both rows pass on the base: they guard behaviour the base already has (G57), and the change is to the setup, which no row asserts, so there is no failing line to quote.
15. DONE. No code change for this ruling. I ran the full verify list once after the last change (section "DONE / NOT DONE"). Git: see "Deviations" for the read-only git calls I made by mistake.
16. DONE. `SCROLLBACK_LINES = 2000` moved to `data/model/model-machine.ts:197` (exported through `data/model/index.ts:601`) and is imported by `server/machine/pty/sessions.ts:24` (use `:718`), `server/machine/pty/channel.ts:34` (use `:363`) and `state/sessions/terminal/commands.svelte.ts:52`; the server's own declaration is removed (`grep -rn "SCROLLBACK_LINES" src` lists those and nothing else). `hold` (`commands.svelte.ts:659`) keeps the last `SCROLLBACK_LINES` lines through `lastLines` (`:86`, line ends `\r\n`, `\r` and `\n` as the output is read), for a scrollback and for a joined chunk. Node run `n32` (an unlisted terminal gets 3000 error lines, one `src/x.ts:K:1: error: eK` per line, then is listed; `commandDiagnostics()` keeps the first 500 rows of what was held):

```
SCROLLBACK_LINES 2000 | lines handed to note for the unlisted terminal: 3000
diagnostics read after the terminal is listed: 500 | first line number: 1001 | lines kept: 2000
chunked terminal: 3000 lines in two chunks; first line number read: 1001 | lines kept: 2000
short output (10 lines) kept whole: 9 diagnostics
```

(the 10th line of the short output is the unfinished last line, which is the tail and no row yet.)
17. DONE. `ui/tree/list/VirtualRows.svelte`: `windowed` and the `$effect.pre` are gone; `onChange` counts in `moved` (`:79`, `:93-96`); `drawn` is a `$derived.by` (`:106`) that reads `moved`, calls `configure(count, size, margin, key, kept)` and returns `rowWindow(virtualizer, held)`; `configure` takes `keptRows`; the head comment of `rowWindow` in `ui/tree/list/virtual.ts:42` is rewritten. `GONE` and `entryAt` are removed from `problem-rows.ts` (`grep -rn "entryAt\|GONE" src` prints only `state/workbench/layout.svelte.ts:91,340`, the workbench's own constant), and `Problems.svelte` reads `entries[at]` directly in `key`, `label` and the row snippet. Test run before and after the fix with the three files: red `TypeError: Cannot read properties of undefined (reading 'id')` with past-end key `[3]`, then `Tests  1 passed (1)`; both quoted, with the files' full text, under "Tests not landed"; the files are out of the tree. `sh utils/unused-exports.sh` prints 371 lines against the base's 371 after its two error lines, the one differing line is `state/workbench/layout/index.ts`, where the base lists `instanceFlag` and this tree does not, and no line names `entryAt`, `rowEntriesOf`, `RowEntry`, `provideFileProblems`, `COMMAND_OWNER`, `LATEX_OWNER`, `endsBeforeStart`, `SCROLLBACK_LINES` or `toggleView`. `grep -rl "VirtualRows\|list/virtual" tests` prints nothing, and no test file names a caller view (Changes, Graph, Console, Tree, Problems) except `tests/checks/tree/allow-styling.ts`, which `npm run test:checks` ran.

## Ruling 5: the finding

The ruling asks to read first whether a project command can run in a repository that is not a served root, and to stop and hand back the finding if it can. It can.

- `server/machine/runs/commands/repo.ts:22-27`: a command's repository is accepted when it lies inside a served root (`inside(repo, root)`) and either equals a served root or holds a `.git` folder. So a git repository nested under a served root is accepted without being a served root itself. `routes.ts:79` and `:99` and `run.ts:104` all call `repositoryOf(folder, rootsFor())`, and `rootsFor` is the configured repository roots (`server/root/context.ts:347-348`).
- Run over a temp folder (`n34`, a served root `S` holding `S/nested/.git`): `repositoryOf(S)` gives `{"repo":S}`, `repositoryOf(S/nested)` gives `{"repo":S/nested}`, and with no served root `repositoryOf(S/nested)` gives `{"error":"repo is not under a root the file browser serves"}`.
- The page records that repository as the row's root: `CommandDiagnostic.root` is "The repository the command belongs to" (`data/model/model-sessions.ts:712-716`) and is `job.repo` (`state/sessions/terminal/commands.svelte.ts:715`). The page's git roots are not the served roots either (`server/root/watch/git.ts:168 rootsOf` and `subrepositories`; `server/sessions/stores/hooks.ts:132`).

So the ruling's rule ("a command row goes when `CommandDiagnostic.root` is no longer a served root") would drop the rows of a nested repository the moment they are listed, while its file is still under a served root. I changed nothing of ruling 5, for the LaTeX store half too.

Options, with the lazy one named:
- (a) A command row goes when its repository lies under no served root (the test `repositoryOf` itself applies: inside any served root), and the LaTeX store forgets the targets and diagnostics of a root that is not a served root. Both sources then lose a removed root's rows at the cause and keep a nested repository's rows. This is the better option.
- (b) The ruling as written (repository equals a served root): wrong for nested repositories, so a command run in one lists nothing.
- (c) A filter in `latexProblems` and `commandProblems` that skips rows of unserved roots: the lazy option, since the store would keep the dead targets and diagnostics.
Recommended: (a). It changes no user-visible shape beyond the ruling's own intent.

## DONE / NOT DONE

| Row | State | Command and output |
|---|---|---|
| Rulings 1 to 4, 6 to 17 | DONE | each line above |
| Ruling 5 | NOT DONE | "Ruling 5: the finding" |
| prettier | DONE | `npx prettier --check .` ends `All matched files use Prettier code style!` |
| eslint | DONE | `npx eslint .` exit 0 |
| svelte-check | DONE | `npx svelte-check --tsconfig ./tsconfig.json --output machine` ends `COMPLETED 3403 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run diagrams` | DONE | exit 0, regenerated `docs/diagrams/*.dot` and `*.svg` (run after the last change) |
| Layer and size checks | DONE | `npm run test:checks`: `Test Files  17 passed (17)`, `Tests  243 passed (243)` |
| `sh utils/folder-check.sh` | DONE | exit 0; `ls` counts: `state/system` 10, `shell/status` 10, `shell/panes` 10, `shell/panes/strip` 8 |
| `sh utils/unused-exports.sh` | DONE | ruling 17 line |
| ASCII gate (`spec.md:99`) | DONE | the perl command over `src tests config` prints nothing; `LC_ALL=C grep -n '[^ -~]'` over `DESIGN.md HELP.md docs/views.md docs/window.md docs/files-and-search.md` prints nothing |
| YAML parse of the 7 changed `.yml` | DONE | `yaml.safe_load` of each, `ok` x7 |
| The three greps over `src` | DONE | `latex/Problems\|problemRows\|problemFile`, `data-card={at}`, `Marks the project-card control`: each prints nothing |
| Full list | DONE | `sh .../land/templates/checks.sh .../orchestrator-state.md` from `tools/oculus` in the worktree, after the last change: `ok  ASCII gate`, `ok  prettier`, `ok  svelte-kit sync`, `ok  eslint`, `ok  svelte-check (24.6 s): ... COMPLETED 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok  vitest (39.5 s)`, `test:quick: 40.1 s (limit 45.0 s); every command passed`, `checks: 1 commands passed` |
| Guarded tests, each alone | DONE | the 18 files below, each `npx vitest run <file>`, all `passed`; plus `tests/server/machine/pty/channel.test.ts` 12, `sessions.test.ts` 1 and `tests/views/sources/bar-actions.test.ts` 11, which import files this round changed |
| Page cleanup | DONE | `lsof -nP -iTCP:8805 -sTCP:LISTEN` exit 1; `ls config/local.yml` "No such file or directory"; `ps -axo pid,ppid,command \| grep -E "d33b\|D33"` prints nothing; no page, server, browser or tmux was started this round |

What the green results do not cover: no page was run, so the page behaviour of the table's press, the table with closed files, the toggle and the VirtualRows window is proven by node runs and the unit test over the component, with the look on landing named in the case table. `tests/checks` is not exercised against the nested-repository case of ruling 5.

## Run counts

Full-list `checks.sh` runs this round: 1, after the last change (the last change is the `DESIGN.md` sentence on the toggle; `npm run diagrams`, `npm run test:checks`, `folder-check`, `unused-exports`, the ASCII gate and the YAML parse ran after it).

## Guarded tests

Each file run alone with `npx vitest run <file>` after the last change: `tests/data/sources/manifests.test.ts`, `registries.test.ts`, `collections.test.ts`, `career.test.ts`, `feeds.test.ts`, `docs.test.ts`, `present.test.ts`, `tests/routes/docs/deck.test.ts`, `tests/data/sources/personal.test.ts`, `tests/data/snapshot/normalise.test.ts`, `tests/state/sessions/source.test.ts`, `source-disk.client.test.ts`, `autosave.client.test.ts`, `tests/shell/panes/strip/tab-menu.test.ts`, `tests/state/workbench/navigation/pages.test.ts`, `tests/checks/config/arrangements.test.ts`, `tests/checks/config/config.test.ts`, `tests/views/shared/explorer/root-drag.test.ts`: 18 files, every one `Test Files  1 passed (1)` (`guarded3.out`, 36 `passed` lines, no `FAIL`).

### Guarded test G57

- File: `tools/oculus/tests/views/shared/explorer/root-drag.test.ts`, 106 lines, written from `agents/reviews/X3e-root-drag-test.patch`; titles `writes no order for a drag from another tab over a tree whose own drag never ended` and `still takes the drop of the tree's own drag`.
- `npx vitest run tests/views/shared/explorer/root-drag.test.ts`: `Test Files  1 passed (1)`, `Tests  2 passed (2)`. The subject (`views/shared/explorer/tree/control/dragging.svelte.ts`) is byte-identical to the base.

## User-visible changes, before and after

Round 1 (rulings 3, 2 and 6):

| Where | Before | After |
|---|---|---|
| Problems view as a table, one press on a row | opened the file as a kept tab and moved the keyboard into the editor (`show(problem, true)`) | previews the file at the range with the keyboard kept in the view, as a single press on a tree row does; Enter or a double press keeps the tab with the keyboard in the editor; one handler (`pressed`) serves the tree and the table |
| Problems view as a table, files the tree has closed | rows of a file the reader closed, or that Collapse All closed, were missing from the table (it listed the tree's open lines) | the table lists every row of the filtered files whatever the tree folded; with every row filtered out it says "No results found with provided filter criteria." as the tree does (node run `n33`) |
| Hiding the Problems view with Cmd+Shift+M (Ctrl+Shift+M off macOS) or the status item, then showing it again | the view came back with an empty filter, all Show toggles at their defaults, every root and the tree | it comes back with the filter text, the Show toggles, the root scope and View as Table it had when hidden, for that page; the tab's own close button forgets them (node run `n30`); the kept state is saved with the other instance records, so it survives a reload |
| Problem counts on the tab strip's file tabs (rulings 1 and 4) | the strip got them by passing the whole client to a state function, a route the shell's boundary check could not follow; the docs named the tree's and Open Editors' decorations only | the same counts through a function the page provides; `docs/files-and-search.md` names all three |
| A place whose end is before its start, on the same line too (ruling 12) | only an end on an earlier line was dropped | such an end is no end, both when a state is written and when a saved tab is read |
| A command's output that arrives before its terminal is listed (ruling 16) | held whole, up to 8 terminals | held to the last 2000 lines per terminal, the server's scrollback |

Since the first build:

| Where | Before | After |
|---|---|---|
| Explorer group | Files, Repositories, Search, TeX | plus a Problems view (`s8`), VS Code's Problems panel for the page, defaults fixed, filter with glob terms through picomatch |
| Status bar | findings only | a Problems item (`cross` N, `warn` N, `info` N when non-zero; `1K`, `10K+`; tooltip) before findings |
| Keys | Monaco's F8 wrapped inside one file; no Problems key | Cmd+Shift+M (Ctrl+Shift+M off macOS) toggles the view; F8 and Shift+F8 walk the Problems order across files, wrapping; Monaco's own F8 is freed |
| Opening a row or a search hit | went to the place once per line and column; Go to Definition selected the name | a single press previews, Enter or a double press keeps; the place is stamped on each open, so a press after the caret moved goes back; a reload does not go again; a range selects |
| Command errors | listed nowhere | Problems rows and editor marks under one marker owner |
| Files tree, Open Editors, tab strip | git letter only | error or warning count (`9+` from ten) in the worst colour, a dot on folders, tooltip "N problems in this file" |
| TeX view | its own Problems section and project-panel list | removed; the panel's count and the build notice's Show Problems open the Problems view scoped to the root |
| Audit | no cursor on rows, place was text | `data-cursor` outline on the cursor row; the place is a button that opens the finding's file; Enter presses it; each finding carries `file` |
| Focus lane | Enter opened nothing | Enter on a card opens its project |
| Settings | 202 card elements, 32 distinct ids; no Enter into a card | unique ids, `o` and arrows mark one card, Enter focuses its first field and changes no value |
| Card cursor across a reload | cleared at once; Focus and 14 other views lost it | kept in the saved instance state and drawn after the reload (cases 31 and 32 GREEN on the final tree of the first build; this round touched no card-cursor code) |
| A list that shrinks inside an effect (Changes, Graph, Console, Explorer tree, Problems) | read rows past its end and threw | draws only the rows of the list as it is now (ruling 17) |

## Files

Line counts after the change (`wc -l`); no source file is over 880 and no component over 520 among those this step changed (`Workbench.svelte` 519, `context.ts` 844, `commands.svelte.ts` 830). The one `.svelte` file over 520 lines in the tree, `views/structure/map/Graph.svelte` (524), is identical to the base (`diff -q` prints nothing).

New files: `state/system/problems.svelte.ts` 317, `state/system/problem-sources.ts` 122, `state/sessions/source/place.ts` 95, `shell/panes/strip/file-problems.ts` 26, `views/sources/search/Problems.svelte` 385, `views/sources/search/problem-rows.ts` 203, `views/sources/source/language/command-marks.svelte.ts` 66, `tests/views/shared/explorer/root-drag.test.ts` 106. Deleted: `views/academic/latex/Problems.svelte`, `views/shared/latex/Problems.svelte`.

Largest changed files: `state/client/context.ts` 844, `state/sessions/terminal/commands.svelte.ts` 830, `data/model/model-sessions.ts` 730, `state/sessions/source/source.svelte.ts` 725, `data/model/index.ts` 666, `ui/controls/editor/kit/lsp/client.ts` 659, `state/sessions/latex/builds.ts` 637, `shell/keys/workbench-keys.svelte.ts` 547, `shell/panes/PaneView.svelte` 515.

### `diff -rq` against the base: changed paths

`diff -rq D33-base/tools/oculus D33/tools/oculus` (excluding `node_modules`, `.svelte-kit*`, `local.yml`, `diagrams`) lists these changed (M) paths: `DESIGN.md`, `HELP.md`, `config/layout.yml`, `config/text/app.yml`, `statusbar.yml`, `views/academic/latex.yml`, `views/sources/files.yml`, `views/sources/search.yml`, `views/system/audit.yml`, `docs/files-and-search.md`, `docs/views.md`, `docs/window.md`, `package.json`, `data/model/index.ts`, `model-machine.ts`, `model-sessions.ts`, the four `server/content/audit` files, `server/machine/pty/channel.ts` and `sessions.ts`, `shell/Workbench.svelte`, `shell/keys/key-dom.ts`, `keys.ts`, `workbench-keys.svelte.ts`, `shell/panes/PaneView.svelte`, `strip/strip-tab.ts`, `shell/status/StatusBar.svelte`, `status-items.ts`, `state/client/context.ts`, `state/sessions/latex/builds.ts`, `latex-state.ts`, `latex.svelte.ts`, `state/sessions/source/draft.ts`, `source.svelte.ts`, `state/sessions/terminal/commands.svelte.ts`, `state/sources/explorer/rows/decorations.ts`, `state/system/audit.ts`, `documents.svelte.ts`, `state/workbench/navigation/registry.ts`, `status.ts`, `state/workbench/rail-badges.svelte.ts`, the editor `chords.ts`, `commands.ts`, `kit/latex/latex-widget.ts`, `kit/lsp/client.ts`, `hosts.ts`, `services.ts`, `types.ts`, `ui/controls/tool-button.ts`, `ui/tabs/TabFace.svelte`, `tab-strip.ts`, `ui/tree/list/VirtualRows.svelte`, `virtual.ts`, and the views files `Latex.svelte`, `LaneCard.svelte`, `RootedTree.svelte`, `rooted-tree.svelte.ts`, `FileRow.svelte`, `Tree.svelte`, `Main.svelte`, `places.ts`, `source-file.ts`, `OpenEditors.svelte`, `Editor.svelte`, `Source.svelte`, `SourceBody.svelte`, `language/extension.ts`, `latex-editor.ts`, `lsp.ts`, `tab-language.svelte.ts`, `status/tab-state.ts`, `Audit.svelte`, `Cards.svelte`, `editors/Editor.svelte`, `Rollup.svelte`, and `src/routes/+page.svelte`. `state/workbench/navigation/pages.ts` is identical to the base again.

Paths outside the first brief's write list (widened by the round brief where noted):

| Path | Why |
|---|---|
| `config/text/views/sources/files.yml` | the decoration words (`problems_one_title`, `problems_title`, `problems_many`, `problem_join`) |
| `src/lib/state/sessions/latex/builds.ts`, `latex.svelte.ts` | `showProblems(target)` drops the main-file argument because the view scopes by root |
| `src/lib/state/sessions/latex/latex-state.ts` | `LatexIssue` is no longer exported (nothing outside reads it) |
| `src/lib/state/sessions/source/source.svelte.ts` | `nextAsked` (the go-again counter the brief puts in the source store) |
| `src/lib/state/sessions/source/place.ts` (new) | `openPlace`, `PlaceOpener`; the shell's F8 and the state's walk need it below `views/` |
| `src/lib/state/sessions/terminal/commands.svelte.ts` | held output for a terminal the page has not heard of (`unplaced`, `UNPLACED_MAX = 8`, `hold`, `readUnplaced`), bounded to `SCROLLBACK_LINES` lines by ruling 16 |
| `src/lib/data/model/model-machine.ts`, `data/model/index.ts`, `server/machine/pty/sessions.ts`, `server/machine/pty/channel.ts` | `SCROLLBACK_LINES` moved to the data model so the server and the page read one number (ruling 16) |
| `src/lib/state/system/problem-sources.ts` (new) | the three sources and the two marker owners, split from the store so `state/system` keeps the store under the size limit |
| `src/lib/state/workbench/navigation/registry.ts` | `problemsBadge` keys of the status words |
| `src/lib/shell/panes/strip/file-problems.ts` (new), `shell/panes/PaneView.svelte`, `strip/strip-tab.ts`, `src/routes/+page.svelte` | the page-provided function for the strip's file marks (ruling 1) |
| `src/lib/shell/status/StatusBar.svelte`, `shell/keys/workbench-keys.svelte.ts` | pass the ui store to `toggleView` (ruling 6) |
| `src/lib/ui/tree/list/VirtualRows.svelte`, `virtual.ts` | the drawn window derived (ruling 17) |
| `src/lib/ui/controls/editor/kit/latex/latex-widget.ts`, `views/sources/source/language/latex-editor.ts`, `command-marks.svelte.ts` | the marker owners defined once (ruling 13) |
| `src/lib/views/shared/explorer/RootedTree.svelte`, `src/lib/views/sources/source/language/tab-language.svelte.ts` | hand `problemOf` to the tree; compose the command-marks extension |
| `package.json`, `package-lock.json` | picomatch 4.0.7 and `@types/picomatch` 4.0.3 |
| `tests/views/shared/explorer/root-drag.test.ts` | G57, path list widened by the coordinator |

## Judgment calls, internal and reversible

- The walk (F8) is files in fold order and, inside a file, rows by position, so F8 after the caret goes to the next row down the file; the Problems view lists rows by severity then position. Node `n21` shows both.
- `openPlace` lives in `state/sessions/source/place.ts` taking a `PlaceOpener`, because `shell/` cannot import a view and the store's `open` needs it.
- The store's `open(row, { kept, focus, leaving })` and its types are local to `problems.svelte.ts`.
- Command output a pane hands over before the terminal is listed is held (up to 8 terminals, each to the last 2000 lines) and read when the terminal is listed.
- The hidden Problems view's state is one record in the ui store under `hidden-view:<page>:<view>`; it is saved with the instance records, so it survives a reload, and the next show removes it. Reversible: it is written and read only in `toggleView`.
- `placed` in `draft.ts` drops a reversed end when a state is written, as `openedAt` does when one is read, so a state never carries an end the reader would ignore.
- `LatexEditorDeps.owner` is a new required key of the LaTeX editor's deps, since `ui/` may not import the state module that owns the word.

## Architecture note

`shell/` reads problems only through what the page hands it: `StatusWords.problems` and `walkProblem` from `+page.svelte`, and the function `provideFileProblems` provides (`shell/panes/strip/file-problems.ts`), which `PaneView.svelte` reads and `stripTab` calls for the file a tab shows. No shell file names the problems store or receives the client for it, and `tests/checks` is unchanged. The ruling-1 shape replaces the earlier `tabProblem(facts.client, instance)`, which passed the whole client to a state function.

## Head comments and documents touched

Rewritten or written this round: `shell/panes/strip/file-problems.ts`, `shell/status/status-items.ts`, `views/shared/latex/Main.svelte`, `views/academic/latex/Latex.svelte`, `views/sources/files/sections/OpenEditors.svelte`, `views/sources/search/Problems.svelte`, `problem-rows.ts`, `ui/tree/list/VirtualRows.svelte` (the comment on `drawn`), `ui/tree/list/virtual.ts` (`rowWindow`), `shell/keys/keys.ts` (`toggleView`), `state/sessions/source/draft.ts` (`endsBeforeStart`, `placed`), `views/sources/source/language/command-marks.svelte.ts`, `state/system/problem-sources.ts`, `problems.svelte.ts` (the owner words), `state/sessions/terminal/commands.svelte.ts` (`hold`, `lastLines`), `data/model/model-machine.ts` (`SCROLLBACK_LINES`), `ui/controls/editor/kit/latex/latex-widget.ts` (`owner`), `DESIGN.md:475`, `docs/views.md:81`, `docs/files-and-search.md:11`, `docs/window.md:82`. `state/workbench/navigation/pages.ts` lost the sentence about `tabProblem`. Written in the first build and unchanged since: the rest of the list in the first report (the status bar, the editor commands, the tab strip files, the Audit, the cards).

The history-word scan this round (`grep -nEi "no longer|previously|used to|instead of|formerly|was moved|earlier|reverted|workaround"` over the files above) found only uses that describe behaviour: "an earlier line" and "an earlier column" in `endsBeforeStart`, "an earlier press" and "earlier has not seen" in comments already in the base's `commands.svelte.ts`, and base lines of `strip-tab.ts:2`, `draft.ts:121`, `model-machine.ts:117` and `:359`.

Edits to existing assertions: none. `diff -rq` against the base lists `tests/views/shared/explorer/root-drag.test.ts` as the only test path.

## Edits outside the brief

- The files in the outside-list table above.
- Nothing else: no page, server, browser or tmux was started this round, and no `tests/checks` file was edited.

## Deviations with no effect

- Two read-only git calls, which the round brief forbids: `git --version` once (output discarded) and `git diff --stat -- docs` once. No repository state changed. The first build also ran one `git diff --stat`, one `git -C . --version` and one `git diff --no-index --stat /dev/null /dev/null`, read-only.
- To run the changed `root-drag.test.ts` on the base's source I made a scratch copy of `D33-base/tools/oculus` in the scratchpad (`basecopy`, `node_modules` a symlink to the worktree's); it is outside the tree and nothing runs from it.
- One temp folder for the `n34` run, removed at once.

## Anything wrong in the brief

- Ruling 5: the rule "a command row goes when `CommandDiagnostic.root` is no longer a served root" does not hold for a git repository nested under a served root (see "Ruling 5: the finding").
- Ruling 12 says "wherever `draft.ts` reads it"; `draft.ts` only writes the end (`placed`), and the one reader is `openedAt` in `tab-state.ts`. Both now use `endsBeforeStart`.
- Ruling 13 lists `latex-widget.ts` as importing the owner word; it is in layer `ui`, which `tests/checks/tree/boundaries.test.ts` does not let import `state`, so the word reaches it through `LatexEditorDeps.owner`.
- Ruling 14 asks to run the changed row on the base; `root-drag.test.ts` does not exist in the base, and its subject is identical to the base's, so both rows pass there (ruling 14 line).
- The state file's open items now hold item 9 only (D33's test of the list that shrinks), whose option (a) would land the three test files with D33; they stay out of the tree until Axel rules.

## Tests not landed

The three files of the test of the list that shrinks. No entry of `agents/guarded.md` covers VirtualRows (open item 9), so they are not in the tree: `ls tests/ui` lists no `tree` folder (it prints controls, frame, html.test.ts, menu, tabs), and `diff -rq` against the base lists `tests/views/shared/explorer/root-drag.test.ts` as the only test path. Each was written in the tree at its path, run, and taken out.

Run before the fix (the tree with the old `windowed` state and `$effect.pre`), `npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts`:

```

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D33/tools/oculus

 > |client| tests/ui/tree/list/virtual-rows.client.test.ts (1 test | 1 failed) 19ms
   x asks for no row past the end when a list of 20 shrinks to 3 inside an effect 18ms

------- Failed Tests 1 -------

 FAIL  |client| tests/ui/tree/list/virtual-rows.client.test.ts > asks for no row past the end when a list of 20 shrinks to 3 inside an effect
AssertionError: expected { ...(3) } to deeply equal { thrown: '', ...(2) }

- Expected
+ Received

  {
    "drawn": [
      "row 0",
      "row 1",
      "row 2",
+     "row 3",
+     "row 4",
+     "row 5",
+     "row 6",
+     "row 7",
+     "row 8",
+     "row 9",
    ],
    "past": {
      "body": [],
-     "key": [],
+     "key": [
+       3,
+     ],
    },
-   "thrown": "",
+   "thrown": "TypeError: Cannot read properties of undefined (reading 'id')
+
+     in <unknown>
+     in VirtualRows.svelte
+     in ShrinkingRows.svelte
+     in undefined
+ ",
  }

 > tests/ui/tree/list/virtual-rows.client.test.ts:39:73
     37|         thrown = String(error);
     38|     }
     39|     expect({ thrown, past, drawn: body.textContent.match(/row \d+/g) }...
       |                                                                         ^
     40|         thrown: '',
     41|         past: { key: [], body: [] },

------------------------[1/1]-


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  12:37:43
   Duration  1.12s (transform 376ms, setup 0ms, import 970ms, tests 19ms, environment 24ms)
```

Run after the fix, the same command:

```

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D33/tools/oculus


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  12:38:06
   Duration  1.02s (transform 401ms, setup 0ms, import 916ms, tests 11ms, environment 12ms)
```

### tests/ui/tree/list/virtual-rows.client.test.ts

```
// Layer 3, primitive tests. ui/tree/list/VirtualRows.svelte over a list that shrinks while rows
// past its new end are drawn, the list written from inside an effect, mounted on the document of
// tests/ui/tree/list/mini-dom.ts: the list asks its caller for no key and no item body at an index
// past the end, throws nothing, and draws the rows left.
//
// It does not cover scrolling or measuring, which the look does.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, it, onTestFinished, vi } from 'vitest';
import { cell } from '../../frame/rooted.svelte.ts';
import { documentGlobals } from './mini-dom.ts';
import ShrinkingRows from './ShrinkingRows.svelte';

const rowsOf = (count: number) =>
    Array.from({ length: count }, (_, at) => ({ id: `r${String(at)}`, name: `row ${String(at)}` }));

afterEach(() => {
    vi.unstubAllGlobals();
});

it('asks for no row past the end when a list of 20 shrinks to 3 inside an effect', () => {
    const { globals, body } = documentGlobals();
    for (const [name, value] of Object.entries(globals)) vi.stubGlobal(name, value);
    const rows = cell(rowsOf(20));
    const past = { key: [] as number[], body: [] as number[] };
    const list = mount(ShrinkingRows, { target: body, props: { rows: () => rows.get(), past } });
    onTestFinished(() => {
        void unmount(list);
    });
    flushSync();
    expect(body.textContent.match(/row \d+/g)).toHaveLength(10);
    let thrown = '';
    try {
        rows.set(rowsOf(3));
        flushSync();
    } catch (error) {
        thrown = String(error);
    }
    expect({ thrown, past, drawn: body.textContent.match(/row \d+/g) }).toEqual({
        thrown: '',
        past: { key: [], body: [] },
        drawn: ['row 0', 'row 1', 'row 2']
    });
});
```

### tests/ui/tree/list/ShrinkingRows.svelte

```
<script lang="ts">
    // A caller of ui/tree/list/VirtualRows.svelte for the case in virtual-rows.client.test.ts. It
    // reads its items by index, as the Changes, Graph, Console, Tree and Problems views do, and
    // takes its list in from an effect, as a view does whose store a language client writes from
    // inside an editor's effect. Every index it is asked for that the list no longer holds is
    // written down, for the key and for an item's body apart.

    import type { Attachment } from 'svelte/attachments';
    import VirtualRows from '../../../../src/lib/ui/tree/list/VirtualRows.svelte';

    type Row = { id: string; name: string };
    type Props = {
        rows: () => Row[];
        past: { key: number[]; body: number[] };
    };

    let { rows, past }: Props = $props();

    let list: Row[] = $state.raw([]);
    $effect(() => {
        list = rows();
    });

    function key(at: number): string {
        if (at >= list.length) past.key.push(at);
        return list[at].id;
    }

    function rowAt(at: number): Row {
        if (at >= list.length) past.body.push(at);
        return list[at];
    }
</script>

<ul data-scroll>
    <VirtualRows count={list.length} {key} {item} />
</ul>

{#snippet item(at: number, measure: Attachment<HTMLElement>)}
    {@const row = rowAt(at)}
    {#if row.id !== ''}
        <li {@attach measure}>{row.name}</li>
    {/if}
{/snippet}
```

### tests/ui/tree/list/mini-dom.ts

```
// Layer 4, test helper. The smallest document Svelte's client runtime and @tanstack/virtual-core
// need to mount ui/tree/list/VirtualRows.svelte in the client project, which has no DOM: nodes, a
// parser for the template markup the Svelte compiler emits, and a fixed layout in which an element
// marked `data-scroll` (the scroll box) is BOX px high and every other element ROW px high, all at
// the top of the page. A case hands `documentGlobals()` to `vi.stubGlobal` and unstubs them after.

export const ROW = 20;
export const BOX = 100;

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'wbr']);

class MiniNode {
    static ELEMENT_NODE = 1;
    static TEXT_NODE = 3;
    static COMMENT_NODE = 8;
    static DOCUMENT_FRAGMENT_NODE = 11;
    nodeType = 0;
    nodeName = '';
    parentNode: MiniNode | null = null;
    childNodes: MiniNode[] = [];
    get ownerDocument(): unknown {
        return doc;
    }
    get firstChild(): MiniNode | null {
        return this.childNodes[0] ?? null;
    }
    get lastChild(): MiniNode | null {
        return this.childNodes.at(-1) ?? null;
    }
    get nextSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        return parent.childNodes[parent.childNodes.indexOf(this) + 1] ?? null;
    }
    get previousSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        const at = parent.childNodes.indexOf(this);
        return at > 0 ? parent.childNodes[at - 1] : null;
    }
    get parentElement(): MiniElement | null {
        return this.parentNode instanceof MiniElement ? this.parentNode : null;
    }
    get isConnected(): boolean {
        return (this as MiniNode) === doc.body || (this.parentNode?.isConnected ?? false);
    }
    get textContent(): string {
        return this.childNodes.map((child) => child.textContent).join('');
    }
    set textContent(value: string) {
        for (const child of [...this.childNodes]) child.parentNode = null;
        this.childNodes = [];
        if (value !== '') this.appendChild(new MiniText(value));
    }
    insertBefore(node: MiniNode, ref: MiniNode | null): MiniNode {
        const moved = node.nodeType === 11 ? [...node.childNodes] : [node];
        for (const one of moved) {
            one.parentNode?.removeChild(one);
            const at = ref === null ? this.childNodes.length : this.childNodes.indexOf(ref);
            if (at < 0) throw new Error('insertBefore: the reference is not a child');
            this.childNodes.splice(at, 0, one);
            one.parentNode = this;
        }
        return node;
    }
    appendChild(node: MiniNode): MiniNode {
        return this.insertBefore(node, null);
    }
    removeChild(node: MiniNode): MiniNode {
        const at = this.childNodes.indexOf(node);
        if (at < 0) throw new Error('removeChild: not a child');
        this.childNodes.splice(at, 1);
        node.parentNode = null;
        return node;
    }
    remove(): void {
        this.parentNode?.removeChild(this);
    }
    before(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        for (const node of nodes) parent.insertBefore(asNode(node), this);
    }
    after(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        const next = this.nextSibling;
        for (const node of nodes) parent.insertBefore(asNode(node), next);
    }
    append(...nodes: (MiniNode | string)[]): void {
        for (const node of nodes) this.appendChild(asNode(node));
    }
    replaceWith(...nodes: (MiniNode | string)[]): void {
        this.before(...nodes);
        this.remove();
    }
    contains(node: MiniNode | null): boolean {
        for (let at = node; at !== null; at = at.parentNode) if (at === this) return true;
        return false;
    }
    cloneNode(deep = false): MiniNode {
        const copy = this.shallow();
        if (deep) for (const child of this.childNodes) copy.appendChild(child.cloneNode(true));
        return copy;
    }
    shallow(): MiniNode {
        return new MiniFragment();
    }
    addEventListener(): void {
        // No event reaches a node of this document.
    }
    removeEventListener(): void {
        // No event reaches a node of this document.
    }
    dispatchEvent(): boolean {
        return true;
    }
}

function asNode(node: MiniNode | string): MiniNode {
    return typeof node === 'string' ? new MiniText(node) : node;
}

class MiniCharacterData extends MiniNode {
    data: string;
    constructor(data: string) {
        super();
        this.data = data;
    }
    get nodeValue(): string {
        return this.data;
    }
    set nodeValue(value: string) {
        this.data = value;
    }
    override get textContent(): string {
        return this.data;
    }
    override set textContent(value: string) {
        this.data = value;
    }
}

class MiniText extends MiniCharacterData {
    override nodeType = 3;
    override nodeName = '#text';
    override shallow(): MiniNode {
        return new MiniText(this.data);
    }
}

class MiniComment extends MiniCharacterData {
    override nodeType = 8;
    override nodeName = '#comment';
    override shallow(): MiniNode {
        return new MiniComment(this.data);
    }
}

class MiniFragment extends MiniNode {
    override nodeType = 11;
    override nodeName = '#document-fragment';
}

class MiniStyle {
    props = new Map<string, string>();
    setProperty(name: string, value: string): void {
        this.props.set(name, value);
    }
    removeProperty(name: string): void {
        this.props.delete(name);
    }
    getPropertyValue(name: string): string {
        return this.props.get(name) ?? '';
    }
    get cssText(): string {
        return [...this.props].map(([name, value]) => `${name}: ${value};`).join(' ');
    }
    set cssText(value: string) {
        this.props.clear();
        for (const part of value.split(';')) {
            const [name, ...rest] = part.split(':');
            if (name.trim() !== '') this.props.set(name.trim(), rest.join(':').trim());
        }
    }
}

class MiniElement extends MiniNode {
    override nodeType = 1;
    localName: string;
    namespaceURI = 'http://www.w3.org/1999/xhtml';
    attributes = new Map<string, string>();
    style = new MiniStyle();
    scrollTop = 0;
    scrollLeft = 0;
    constructor(tag: string) {
        super();
        this.localName = tag.toLowerCase();
        this.nodeName = tag.toUpperCase();
    }
    get tagName(): string {
        return this.nodeName;
    }
    getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
    }
    setAttribute(name: string, value: string | number | boolean): void {
        this.attributes.set(name, String(value));
    }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
    }
    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }
    get className(): string {
        return this.getAttribute('class') ?? '';
    }
    set className(value: string) {
        this.setAttribute('class', value);
    }
    get classList(): {
        add: (n: string) => void;
        remove: (n: string) => void;
        toggle: (n: string, on?: boolean) => void;
        contains: (n: string) => boolean;
    } {
        const names = (): string[] => this.className.split(/\s+/).filter((n) => n !== '');
        const write = (list: string[]): void => this.setAttribute('class', list.join(' '));
        return {
            add: (n) => write([...new Set([...names(), n])]),
            remove: (n) => write(names().filter((one) => one !== n)),
            toggle: (n, on) =>
                (on ?? !names().includes(n))
                    ? write([...new Set([...names(), n])])
                    : write(names().filter((one) => one !== n)),
            contains: (n) => names().includes(n)
        };
    }
    get dataset(): Record<string, string> {
        return new Proxy(
            {},
            {
                get: (_, key: string) => this.getAttribute(`data-${key}`) ?? undefined,
                set: (_, key: string, value: string) => {
                    this.setAttribute(`data-${key}`, value);
                    return true;
                }
            }
        );
    }
    /** The element or its nearest ancestor matching `[name]` or a tag name. */
    closest(selector: string): MiniElement | null {
        const attribute = /^\[([\w-]+)\]$/.exec(selector)?.at(1);
        const matches =
            attribute === undefined ? this.localName === selector : this.hasAttribute(attribute);
        return matches ? this : (this.parentElement?.closest(selector) ?? null);
    }
    get offsetHeight(): number {
        return this.hasAttribute('data-scroll') ? BOX : ROW;
    }
    readonly offsetWidth = 200;
    getBoundingClientRect(): {
        top: number;
        left: number;
        bottom: number;
        right: number;
        width: number;
        height: number;
        x: number;
        y: number;
    } {
        const height = this.offsetHeight;
        return { top: 0, left: 0, bottom: height, right: 200, width: 200, height, x: 0, y: 0 };
    }
    focus(): void {
        // Focus moves nothing in this document.
    }
    override shallow(): MiniNode {
        const copy = make(this.localName);
        for (const [name, value] of this.attributes) copy.setAttribute(name, value);
        return copy;
    }
}

class MiniHTMLElement extends MiniElement {}

class MiniTemplate extends MiniHTMLElement {
    content: MiniNode = new MiniFragment();
    set innerHTML(html: string) {
        this.content = parse(html);
    }
    override shallow(): MiniNode {
        const copy = new MiniTemplate('template');
        copy.content = this.content.cloneNode(true);
        return copy;
    }
}

function make(tag: string): MiniElement {
    return tag.toLowerCase() === 'template' ? new MiniTemplate(tag) : new MiniHTMLElement(tag);
}

function decode(text: string): string {
    return text
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&');
}

/** Parse the markup the Svelte compiler emits for a template: elements, text and comments. */
function parse(html: string): MiniFragment {
    const root = new MiniFragment();
    const open: MiniNode[] = [root];
    let at = 0;
    while (at < html.length) {
        const top = open[open.length - 1];
        if (html.startsWith('<!--', at)) {
            const end = html.indexOf('-->', at + 4);
            top.appendChild(new MiniComment(html.slice(at + 4, end)));
            at = end + 3;
        } else if (html.startsWith('</', at)) {
            at = html.indexOf('>', at) + 1;
            open.pop();
        } else if (html[at] === '<') {
            const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(at))?.at(1);
            if (tag === undefined) throw new Error(`no tag at ${String(at)} of ${html}`);
            at += tag.length + 1;
            const element = make(tag);
            for (;;) {
                const rest = html.slice(at);
                const close = /^\s*(\/?)>/.exec(rest);
                if (close !== null) {
                    at += close[0].length;
                    top.appendChild(element);
                    if (close[1] !== '/' && !VOID.has(tag.toLowerCase())) open.push(element);
                    break;
                }
                const attribute = /^\s*([^\s=/>]+)(?:="([^"]*)")?/.exec(rest);
                if (attribute === null) throw new Error(`no attribute at ${String(at)} of ${html}`);
                element.setAttribute(attribute[1], decode(attribute.at(2) ?? ''));
                at += attribute[0].length;
            }
        } else {
            const end = html.indexOf('<', at);
            const text = html.slice(at, end < 0 ? html.length : end);
            top.appendChild(new MiniText(decode(text)));
            at += text.length;
        }
    }
    return root;
}

/** An observer that never reports, since nothing in this document changes size. */
class MiniResizeObserver {
    observe(): void {
        // Nothing is resized.
    }
    unobserve(): void {
        // Nothing is resized.
    }
    disconnect(): void {
        // Nothing is resized.
    }
}

const doc = {
    body: new MiniHTMLElement('body'),
    activeElement: null as MiniElement | null,
    defaultView: undefined as unknown,
    createElement: (tag: string) => make(tag),
    createElementNS: (_: string, tag: string) => make(tag),
    createTextNode: (value: string) => new MiniText(value),
    createComment: (value: string) => new MiniComment(value),
    createDocumentFragment: () => new MiniFragment(),
    importNode: (node: MiniNode, deep?: boolean) => node.cloneNode(deep),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};

const win = {
    document: doc,
    ResizeObserver: MiniResizeObserver,
    onscrollend: null,
    setTimeout: (run: () => void, ms?: number) => setTimeout(run, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    requestAnimationFrame: (run: () => void) => setTimeout(run, 0),
    cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    getComputedStyle: () => ({ direction: 'ltr', getPropertyValue: () => '' }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};
doc.defaultView = win;

/** The globals Svelte and the virtualizer read, and the body a case mounts into. */
export function documentGlobals(): { globals: Record<string, unknown>; body: HTMLElement } {
    doc.body.textContent = '';
    return {
        body: doc.body as unknown as HTMLElement,
        globals: {
            window: win,
            document: doc,
            navigator: { userAgent: 'mini-dom' },
            Node: MiniNode,
            Element: MiniElement,
            HTMLElement: MiniHTMLElement,
            HTMLTemplateElement: MiniTemplate,
            Text: MiniText,
            Comment: MiniComment,
            DocumentFragment: MiniFragment,
            ResizeObserver: MiniResizeObserver,
            requestAnimationFrame: win.requestAnimationFrame,
            cancelAnimationFrame: win.cancelAnimationFrame,
            getComputedStyle: win.getComputedStyle
        }
    };
}
```

## First run on the unchanged tree, by case

First run on the unchanged tree (worktree before any edit; dev server 8805 from the worktree; fixtures: root `ordo` under the scratch HOME holding src/x.py y.py x.ts plain.txt lib.py use.py and .oculus/commands.yml). Raw outputs: first1.out .. first6.out, first-views.out, first-scripts.out in the scratchpad.
- 1: no view, no status item: `grep -rn "id: 'problems'" src` prints nothing; page status items host,branch,publish,findings,hpc,usage,server,sessions,unsaved,bell; pyright draws 3 error squiggles in x.py (first1.out); nothing lists them.
- 2: boom runs after "Approve and Run"; `commandDiagnostics()` has no reader (`grep -rn commandDiagnostics src | grep -v commands.svelte.ts` prints nothing); no list shows `src/plain.txt:3:6`.
- 3: `latexDiagnostics()` has one reader, language/latex-editor.ts:68; no list but the TeX view's Problems section.
- 4: no store; documents.svelte.ts `countsOf` counts a missing severity as an error (reading :74-82), no listing method.
- 5: documents store keyed [root,path] then language; `#forget` removes a file's diagnostics at its last model (client.ts:497-508) (reading).
- 6,7,8,9,10,11,13,15: no store and no view to run: absent (grep above).
- 10 (glob part only): picomatch 4.0.7 in node_modules: `**/node_modules/**` true for node_modules/a/b.js; `src/?.ts` true x.ts false xy.ts; `src/[xy].ts` y.ts true xy.ts false; `src/{x,y}.ts` x.ts true xy.ts false; `[abc` and `{a,` match literally and throw nothing (node -e run).
- 12: no packNumber: `grep -rn "10K+" src` prints nothing.
- 14: library diagnostics dropped: client.ts:446-448 hands them over only when place !== null, #forget returns at :505 for a library (reading).
- 16: node run of resolveKey (n1.ts via loader): Cmd+Shift+M mac -> null; Ctrl+Shift+M non-mac -> null; mac Ctrl+Shift+M -> null; F8 -> null; Shift+F8 -> null. Page: Cmd+Shift+M and chord s 8 open nothing (first1.out).
- 17: Monaco's F8 walk in x.py: Ln 8 Col 1 -> 4:12 -> 6:14 -> 7:7 -> 4:12 -> 6:14: it wraps in the file, no cross to another file.
- 18: after typing 'zz' in x.py and F8: caret 6:16, tabs unchanged (one file).
- 19: search hit src/x.py:7 pressed twice after the caret was moved by hand: caret stays at 6:1, does not return to line 7 (first3.out).
- 20: after a reload the x.py tab goes to line 7 again (first3.out: caret moved to 6:1, after reload and showing the tab 7:1).
- 21: Go to Definition (F12 on `helper` in use.py) opens lib.py with the name selected: "Ln 1, Col 11 (6 selected)" (first4.out).
- 21a: tabFacts({line:3,column:4,endLine:1}) -> {line:3,column:4} with no end key (n2.ts); no end, asked, wentTo, focus key exists.
- 21b: no range type; a second preview open of another row replaces the preview tab (reading opening.ts:154).
- 22: plain.txt opened after the boom run: 0 error squiggles, 0 warning squiggles (first2.out).
- 23,24: Files row of x.py draws " | x.py | U" (git letter only, name colour rgb(0,0,0)); strip tab " | x.py" with no count (first1.out).
- 25: views/academic/latex/Problems.svelte and views/shared/latex/Problems.svelte exist; Latex.svelte:46 imports and :208 mounts it; `show_problems` opens the TeX view (context.ts:429-435).
- 25a-25d: no store: absent.
- 26: Audit pane, key o: the row has no data-cursor; saved cursor? none drawn (first5.out): rows [{id df6599a9d3c0, cursor false}] before and after o.
- 26a-26e: the Audit reads no cursor (grep -c cardCursor Audit.svelte prints 0).
- 27: no card-id function (`grep` prints nothing); the row id is the signature; both lists keyed signature:index (Audit.svelte:159,177).
- 28: Enter with cursor on the Audit row: nothing opens, tabs unchanged (first5.out); rows have no file (AuditFinding has no `file`).
- 28a: AuditFinding has no `file`; rules.ts has no helper (exports listed above).
- 29: Focus lane: o marks card eeg-saad-challenge; Enter opens nothing (tabs Focus, Live HPC, Usage before and after).
- 30: Settings page: 202 [data-card] elements with 32 distinct ids, first ids 0..9; o saves cursor settings:0 and draws no mark; Escape clears it (first6.out).
- 30a: no view, status item, owner `command`, tab keys or Audit file exist yet (greps).
- 31: red.mjs Focus: RED ("part 1 FAIL (saved [] ...) part 2 FAIL (drawn [])"); views list: all RED except usage, project, gallery GREEN (first-views.out).
- 32: red2 RED, panechange GREEN (as the brief says), red3 RED (after the reload: saved [], mark not drawn), filter GREEN (first-scripts.out).
- 33: after a reload the restored cursor is cleared at once (red.mjs): the case cannot be observed.

The red command on Focus, first run on the unchanged tree (`first-views.out` line 1): `focus: [held in an instance of view focus] part 1: FAIL part 2: FAIL RED`
After the change, the same command on the final tree: `part 1, the held cursor kept in the saved instance state after the reload: PASS`, `part 2, the held row marked data-cursor in its pane after the reload: PASS`, `GREEN` (`red.mjs Focus`). The 19 views of `views2.sh` all print `part 1: PASS part 2: PASS GREEN`; `red2`, `panechange`, `red3` and `filter` print GREEN (cases 31 and 32; run with `pagerun2.sh` on the final tree, after the last code change).

## Case table: proof by case

Page runs are quoted as made: `n..` are my scripts under the scratchpad; `pagerun1` is the first post-change battery and `pagerun13` the last one. "Node" is a scratch `.ts` run under node 24.

| Case | Proof | Look on landing (view, state, what to see) |
|---|---|---|
| 1 | page `n10`: row pressed, `Ln 7, Col 21 (14 selected)`; `n13`: `x.py 3(preview)` italic; `n18` Enter: `plain.txt 2` kept, no `(preview)` | none open |
| 2 | page `n3`: rows `boom \| stay [Ln 3, Col 6]`, press gives `Ln 3, Col 11 (5 selected)`; capture path by reading `commands.svelte.ts` `readEnded`/`readUnplaced` | none open |
| 3 | page `n7`: `Problems view PROBLEMS \| ordo \| main.tex \| doc/... \| 1 \| Undefi \| latex [Ln 3, Col 1]`; line-less row opens line 1 and a never-read root lists nothing by reading `problem-sources.ts` `latexProblems` | a LaTeX root with a failed build and no line in the log: its row opens line 1 |
| 4 | reading `problem-sources.ts:29-33` (`severityOf`: undefined and 1 are errors, 2 warning, 3 info, 4 gives null and the row is dropped at `:43`) and `documents.svelte.ts` `countsOf` | a pyright file with an info and a hint: Show Infos lists the info only |
| 5 | page `n13`: `status after x.py closed (case 5: its rows go) 1  0`; c/cpp once-per-language by reading `documents.svelte.ts` `listDiagnostics` | a `.c` file under both `c` and `cpp` servers: each diagnostic listed once |
| 6 | reading `problemTarget`: node `n21`: `unserved row opens nothing: null` | run a command printing `/etc/x:1:1: error: y`: its row lists the path and a press opens nothing |
| 7 | page `n16` (fixture reset): `after flip 1  0`, `after the clean rerun 0  0`; `n22`: `after boom 1  0`, `after the terminal closed 0  0`, view text `No problems have been detected in the workspace.` | none open |
| 8 | NOT built this round: ruling 5 stopped at its first step (see "Ruling 5: the finding"); the rows of a removed root stay listed until it is ruled | remove a served root with rows listed: its rows are still listed |
| 9 | node `n21`: files `/tmp/x(1 error) \| a.py(2e 1w) \| b.py(1w) \| src/c.py(1i)`, rows of a.py `e10 e20 w2` | none open |
| 10 | node `n4`: `"**/node_modules/**" -> node_modules/a/b.js`; `"!**/node_modules/**" -> src/x.ts src/y.ts src/xy.ts`; `"src/?.ts"`, `"src/[xy].ts"`, `"src/{x,y}.ts"` -> `src/x.ts src/y.ts`; `"boom, !**/node_modules/**" -> src/x.ts src/y.ts src/xy.ts`; `"[abc"` and `"{a,"` -> nothing and no throw; `""` keeps all; page `pagerun1` filter lines agree | none open |
| 11 | page `n13`: `active file only, no source tab: rows 0`, text `No problems have been detected in the workspace.` | none open |
| 12 | node `n21`: `0=0 999=999 1000=1K 1500=1K 9999=9K 10000=10K+`; page `n22`: status `0  0`; tooltip words by reading `statusbar.yml:45-49` (`problems_none: No Problems`, `Errors: {0}`, `Warnings: {0}`, `Infos: {0}`) | hover the status item with 0 problems: `No Problems`; with 1 error and 2 warnings: `Errors: 1, Warnings: 2` |
| 13 | page `pagerun1`: table `SEVERITY MESSAGE SOURCE FILE POSITION` with the same rows; `n13`: menu `["Copy","Copy Message"]`, Copy puts tab-indented JSON with `resource`, `owner`, `code`, `severity`, `message`, `source`, `startLineNumber`.. on the clipboard, Copy Message `"missing_one" is not defined`; round 1: node `n33` (the table's rows for a fold with both files closed) and the table's single press by reading `Problems.svelte:276-277` | none open |
| 14 | reading `client.ts:310-315` and `:524-525` (library diagnostics handed to the store and cleared at the last model) | Go to Definition into a stdlib file with a diagnostic: Problems lists it under the library name; a press opens the read-only tab; close the tab and the row goes |
| 15 | reading: the store is built per client in `context.ts`, so a pop-out page has its own | pop out a pane with a source tab: its Problems view lists that window's rows only |
| 16 | node `n1`: `mac Cmd+Shift+M: {"kind":"toggle-problems"}`, `non-mac Ctrl+Shift+M: {"kind":"toggle-problems"}`, `mac Ctrl+Shift+M: null` (the LaTeX math chord keeps it); page `pagerun1` `n2`: `Cmd+Shift+M once: Problems selected true`, `twice: ... false`; the app taking the chord first is the look | in the desktop app and in Chrome: Cmd+Shift+M opens and closes the view |
| 17 | page `pagerun1` `n2`: F8 walks `y.py 1 -> x.py 3` rows and wraps, Shift+F8 walks back; node `n21`: `a.py 20:1 fwd b.py:5`, `last row of last file fwd (wraps) a.py:2`, `no rows at all walk: false`, a filter does not enter the walk (the walk reads `fold()`) | none open |
| 18 | page `n14`: `tabs after the step into y.py ... x.py 3(dirty)`, `back on x.py: text ... # unsaved-marker` | none open |
| 19 | page `n9`: `the hit pressed again after the caret moved: Ln 7, Col 1`; two opens within a millisecond: reading `source.svelte.ts` `nextAsked` (`++asked`) | none open |
| 20 | page `n19`: `caret after the reload and showing the tab: Ln 1, Col 1`, `a press on the same row after the reload: Ln 7, Col 1` (first run on the base: `7:1` after the reload) | none open |
| 21 | page `n8`: `after F12: Ln 1, Col 11 (6 selected)`, the same as the first run; word-at-column by reading `commands.ts` | none open |
| 21a | node `n2`/`n11`: a restored `endLine` before `line`, a string `asked`, a numeric `focus` each read as none (`tabFacts` returns zeros and `focus: true`); clamp by reading `ui/controls/editor/commands.ts:22-23` and `:28-30` (`getLineCount`, `getLineMaxColumn`); round 1: node `n31` reads `{line 3, column 4, endLine 3, endColumn 2}` and `{... endLine 2, endColumn 9}` as no end and `{... endLine 3, endColumn 6}` with its end | a tab opened at line 500 of a 20-line file after a shrink: it lands on the last line |
| 21b | reading `place.ts` `openPlace` (`opener.layout.holds(tab) \|\| kept ? undefined : { preview: true }`) | Problems view with three rows of one file: press row 1, then row 3; one italic tab, caret at row 3 |
| 22 | page `n16`: `marks with the error {"errors":1,...}`, `marks after the clean rerun {"errors":0,...}`; F8 reaching it by the same walk as 17 | none open |
| 23 | page `pagerun1`: `["dot",...,"ordo"],["dot",...,"src"],["count","3","3 problems in this file","rgb(204, 32, 32)","x.py"]`; node `n21`: `9+` for 12 warnings (`{"count":"9+","title":"12 problems in this file"}`), nothing for infos only, `2, M` joining by reading `FileRow.svelte:115-116` (`files.problem_join` is `, `) | a file with warnings and a git M: `9+` in the warning colour and `2, M` order; its folder dot in warning colour |
| 24 | page `n18`: Open Editors `{"row":" plain.txt src 2","count":"2","colour":"rgb(204, 32, 32)"}` and strip `{"count":"2","colour":"rgb(204, 32, 32)"}` | none open |
| 25 | page `n7`: the TeX view text has no Problems section; `after Show Problems: ... Problems 1*`; `n12`: `TeX view problem mentions: []`; `latex.yml` `none_followed` by reading | a failed build: Show Problems scopes the view to the root |
| 25a to 25d | readings: `problems.svelte.ts` keys rows by `[root, path]`; `Problems.svelte` keeps its state in the instance; no run | two roots with `main.tex`, scope chip on one; a restored Problems tab before any build; the view in two panes with different filters |
| 26 | page `n5`: `after o {"n":1,"cursor":["df6599a9d3c0"]...}`, `outline solid`, `after Escape ... "cursor":[]` | none open |
| 26a to 26e | readings of `Audit.svelte`; no run | Audit with 0, 1 and several findings, muted section open and closed, a search that hides the row, a narrow pane, the terminal theme, two Audit tabs |
| 27 | node `n21`: `[a,b,a,a]: ["a","b","a:2","a:3"] []: [] [a]: ["a"]` | none open |
| 28 | page `n5`: `after Enter ... " data.yml"` opens in the documents pane and the row stays marked; no-file row, Tab onto a mute control and Space not run | an Audit row with no file: Enter does nothing; Tab to a mute control: Space presses it (do not press a mute) |
| 28a | node `n20`: file below hub `"sub/p.yml"`, folder `""`, missing `""`, symlink leaving the hub `""`, symlink inside the hub `"stay.yml"`, file outside `""`, path climbing out `""`; the table is in the next section | none open |
| 29 | page `n5`: `Focus after Enter {"cursor":["eeg-saad-challenge"],"tabs":["Focus","EEG-sAAD","Live HPC","Usage"]}` | a ghost card: Enter opens its project |
| 30 | page `n5`: `Settings cards {"count":203,"distinct":203,...}` (first run on the base: 202 elements, 32 distinct), `o` -> `appearance.yml:themes\|\|0.`, `o o` -> `\|\|1.`, `Enter` focuses an `INPUT` in the cursor card, `values unchanged by Enter: true`; the id function is inside `Cards.svelte` (`idOf`), so no node run reaches it | a checkbox, a select and a nested record list card: Enter focuses the first field and changes nothing |
| 31, 32 | GREEN, see above | landing look on Focus, Lit Watch, LinkedIn and Inbox per the brief |
| 33 | page `n6`: `after reload: saved ["focus:no-such-card"] drawn []`, `Shift+J: saved ["focus:no-such-card"] drawn []`, `o: ... drawn ["eeg-saad-challenge"]`, `Escape: saved [] drawn []`; two restored panes by reading `syncCards` | two panes each holding a cursor, reload, press into the second: the first is cleared |

### Case 30a: ids and keys the step adds

| Id or key | Check | Result |
|---|---|---|
| view id `problems` | `grep -rn "id: 'problems'" src/lib` | one hit, `views/sources/search/Problems.svelte:7`; `config/text/views/academic/latex.yml:109` keeps a word group `problems: problems`, which is a text key, not a view id; a saved TeX view state may hold `problems` in its `closed` list; by reading `isClosed(name)` (`Latex.svelte:58`) a name that no section asks for is never used (not run) |
| status item `problems` | `grep -n "problems" src/lib/shell/status/status-items.ts` | one entry in `LEFT_ITEMS` (`:40`) and one `itemName` case (`:91`); no other item has the id |
| marker owners `command` and `oculus-latex` | `grep -rn "'oculus-latex'\|COMMAND_OWNER\|LATEX_OWNER" src/lib` and `grep -rn "= 'command'" src/lib/state/system src/lib/views/sources` | each is defined once, `problem-sources.ts:17-18`, and imported by `command-marks.svelte.ts` and `latex-editor.ts`; `lsp-<language>` (`problem-sources.ts`) unchanged (see ruling 13) |
| tab-state keys `endLine`, `endColumn`, `asked`, `wentTo`, `focus` | `grep -n` in `draft.ts` | declared once at `draft.ts:62-72`; no key of the same name existed in `SourceTabState` or in the instance state; bad values each read as none (node `n2`) |
| `AuditFinding.file` | `data/model/index.ts` | `file: string`, empty for none (node `n20`); two findings with one file stay two rows because the card id is the signature and `<signature>:<n>` |
| Settings card ids | page `n5` | 203 cards, 203 distinct ids |

## `add({` sites and their `file`

`projects.ts` has 26 sites and `publications.ts` 6 (`grep -c "add({"`). Lines are today's lines.

| Site | Kind | `file` |
|---|---|---|
| `projects.ts:156` | todo (project document) | `fileOf(hub, path)` of the document |
| `projects.ts:168`, `:179` | todo (collection intro and entry) | `fileOf(hub, collection.file)` |
| `projects.ts:213`, `:228`, `:238`, `:258`, `:277` | data (gaps) | `fileOf(hub, project.file)` |
| `projects.ts:247` | data (no Data section) | `fileOf(hub, join(folder, 'README.md'))` |
| `projects.ts:299`, `:319`, `:328` | conform (no README, non-canonical folder, `code/` without a README) | `NO_FILE` |
| `projects.ts:309` | conform (retired document) | `fileOf(hub, join(folder, name))` |
| `projects.ts:352`, `:363`, `:375`, `:385`, `:398`, `:426`, `:438` | manifest, readability | `fileOf(hub, project.file)` |
| `projects.ts:470` | data (collection file missing) | `NO_FILE` |
| `projects.ts:485`, `:496`, `:504`, `:514`, `:529` | data (collection entries) | `fileOf(hub, collection.file)` |
| `publications.ts:175`, `:205`, `:221`, `:230`, `:251`, `:273` | publink | `file`, the website file `join(hub, rules.publicationsFile)` passed through `fileOf` |

This follows the table of `Q118.md` item 4 at today's lines. The head comment of `scan.ts` (lines 15 and 16) says a finding names its file outside the signature.
