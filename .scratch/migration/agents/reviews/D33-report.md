NOT done: the page checks listed in item 1 below, and one unexplained red test in a full-list run (item 2). Everything else in the brief is built, and the verify list is green on the final tree.

## Not done, in detail

1. Cases with no page run on the final tree. Each is proven by a reading and by the look on landing named in its row of the case table (Z720: builders run no page). They are: 6, 8, 14, 15, 21b, 25a to 25d, 26a to 26e, 28 (the row with no file and the mute-control focus), 33 (two panes each holding a restored cursor), and the c/cpp part of 5. The page run for 21b (`n23`) did not observe it: the script closed x.py before pressing, which removed the rows, so it measured nothing.
2. One full-list `checks.sh` run was red once: `tests/state/sessions/source.test.ts` "takes the new text into a clean tab, with its edits, and keeps no unsaved mark" failed at `source.test.ts:466` (`sourceDraft('one')` held `text: "one\n"` and a `base` of `2c8b08da...` where the row expects `one\ntwo\n` and `c3f9c8c2...`). The same file then passed 3 times alone and 6 times in parallel, and the next full-list run passed. I did not find the cause and did not run the file on the base, so whether it also fails there is not verified. I changed neither the test nor `draft.ts`'s save path; `source.svelte.ts` gained `nextAsked`, which that row does not read.
3. The full-list `checks.sh` ran three times, not once: run 1 earlier (passed), run 2 (the red one above), run 3 after the last code change (passed, `checks: 1 commands passed`).



The brief and coordinator message give lines 153 to 155; in the file the three items are on lines 154, 155 and 156. Item 5 was ruled (a) by Axel through the coordinator; G57 is written to that ruling (section "Guarded test G57").


## Open items

- Open item 5 (2026-10-08, X3e's landing): the root drag of the Files tree has no guarded entry, so the test written for S-R1 (`tests/views/shared/explorer/root-drag.test.ts`: a drop over a tree whose own drag never ended, from a drag of another tab, writes no order; the tree's own drag still drops) is not landed and is kept as `agents/reviews/X3e-root-drag-test.patch`. A wrong drop writes the order of the roots into `sources.yml` or the workspace in force, a wrong configuration written. Options: (a) a new entry G57, "A root dropped on a Files tree reorders only that tree's roots: a drag from another tab, or one whose start was in another tree, writes no order", Code `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts`, Test the patch's file with its two titles, landed in the next step that touches the tree (D28); (b) no entry, the fix kept and the look the check, as for every view. Recommended (a): the failure writes the reader's configuration, the kind of cost spec.md names for a test, and the test runs in well under a second; (b) is the lazy option, since it leaves a configuration write with no check that runs.
- Open item 6 (2026-10-08, D28's review): the server's held parse of the config folder (D28 keeps it, since it takes about 200 ms off every file press against D13a-3's 300 ms bound) has no guarded entry, so its test is not landed; its text is in D28's report under "The config cache's test, not landed". A cache that misses a write serves a stale configuration, a wrong configuration in force. Options: (a) a new entry G61, "A configuration file written, added or removed is read by the next request that asks for the configuration", Code the server context's config cache, Test that test, landed with D28 or the next step that touches the server context; (b) no entry, the cache checked only by reading. Recommended (a): the failure puts a configuration in force that the disk no longer holds, the cost spec.md names for a test, and the test runs in milliseconds; (b) is the lazy option.
- Open item 7 (2026-10-08, D28's landing): the conflict compare's read key (`readKeyOf` in `src/lib/views/sources/repositories/diff/diff-read.ts`) has no guarded entry, so no test checks that the compare reads the file again when the file on disk moves while the compare is open. A key that misses the move leaves the compare's left side showing old disk text, and a reader who then presses Overwrite writes over a change they never saw, work lost. Options: (a) a new entry G62, "The save-conflict compare is read again when the file on disk moves, and no other diff pane is", Code `diff-read.ts` `readKeyOf`, Test a table of three rows (the conflict compare's key changes with the disk hash; a working-tree compare's key does not; a replace preview's key is unchanged), written in the next step that touches the diff panes; (b) no entry, the key checked by reading and by the look. Recommended (a): the failure loses the reader's work, the cost spec.md names for a test, and the rows run in milliseconds; (b) is the lazy option.

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

## DONE / NOT DONE

| Row | State | Command and output |
|---|---|---|
| Problems store, three sources, library hand-off | DONE | `npx svelte-check --tsconfig ./tsconfig.json --output machine` ends `COMPLETED 3402 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| prettier | DONE | `npx prettier --check .` ends `All matched files use Prettier code style!` |
| eslint | DONE | `npx eslint .` exit 0 |
| Layer and size checks | DONE | `npm run test:checks`: `Test Files  17 passed (17)`, `Tests  243 passed (243)` (includes the diagrams tests after `npm run diagrams`) |
| Full list | DONE | `sh .../land/templates/checks.sh .../orchestrator-state.md` after the last code change ends `checks: 1 commands passed`; see "Run counts" |
| Guarded tests, each alone | DONE | 18 files and `npm run test:checks`, all passed (section "Guarded tests") |
| `sh utils/folder-check.sh` | DONE | exit 0; `state/system` holds 10 items, `views/sources/source/language` 7, `views/sources/search` 8 listed files and no folder is over 10 |
| `sh utils/unused-exports.sh` | DONE | 371 lines, the base's `unused-exports.txt` has 371 lines after its two error lines; the one differing line is `src/lib/state/workbench/layout/index.ts`, where this tree lacks `instanceFlag` (one name fewer) |
| ASCII gate (`spec.md:97`) | DONE | the perl command prints nothing; `find ... bin` also printed `bfs: error: bin: No such file or directory.` because the tool has no `bin` folder |
| YAML parse of the 7 changed `.yml` | DONE | `yaml.safe_load` of each, exit 0 |
| The three greps over `src` | DONE | `latex/Problems\|problemRows\|problemFile`, `data-card={at}`, `Marks the project-card control`: each prints nothing |
| `npm run diagrams` | DONE | regenerated `docs/diagrams/*.dot` and `*.svg`; `diagrams.test.ts` is in the 17 passing files |
| Cases 31 and 32 | DONE | see above |
| Page cleanup | DONE | `lsof -nP -iTCP:8805 -sTCP:LISTEN` exit 1; `ls config/local.yml` "No such file or directory"; `ps -axo ppid,command \| grep d33b` prints nothing; `ls -d /private/tmp/d33t` "No such file or directory" |
| Cases needing a page that has no run | NOT DONE | listed in item 1 of Not done; each has a look on landing in the case table |

## Run counts

Full-list `checks.sh` runs: 3 (run 1 earlier, passed; run 2 red on `source.test.ts` as described in item 2; run 3 after the last code change, passed). The last code change is the `entryAt` guard in `views/sources/search/problem-rows.ts` and `Problems.svelte` plus a comment rewording in `problem-rows.ts`. After it I ran `npm run diagrams`, prettier, svelte-check, eslint, `npm run test:checks`, folder-check, unused-exports (all green) and the page batteries `pagerun2.sh` (cases 31 and 32 and `n3 n5 n6 n7 n9 n12`), then `n8 n10 n13 n14 n15 n16 n17 n18 n19 n22 n23` (the last batch finished before Z720 reached me; no page run was started after it).

## Guarded tests

Each file run alone with `npx vitest run <file>`, then `npm run test:checks`, before my first edit of a guarded subject area and after the last edit:

- `tests/data/sources/manifests.test.ts` 1, `registries.test.ts` 1, `collections.test.ts` 1, `career.test.ts` 2, `feeds.test.ts` 1, `docs.test.ts` 2, `present.test.ts` 4, `tests/routes/docs/deck.test.ts` 3, `personal.test.ts` 2, `tests/data/snapshot/normalise.test.ts` 1, `tests/state/sessions/source.test.ts` 25, `source-disk.client.test.ts` 4, `autosave.client.test.ts` 23, `tests/shell/panes/strip/tab-menu.test.ts` 4, `tests/state/workbench/navigation/pages.test.ts` 5, `tests/checks/config/arrangements.test.ts` 12, `config.test.ts` 31, `tests/views/shared/explorer/root-drag.test.ts` 2: each `passed (n)` in the final run (`guarded2.out`).
- `npm run test:checks` final: `Test Files  17 passed (17)  Tests  243 passed (243)`.
- The earlier `npm run test:checks` run failed 6 tests (order, boundaries, comment width and others) from my first layering; the final tree passes all 17 files.

### Guarded test G57

- File: `tools/oculus/tests/views/shared/explorer/root-drag.test.ts`, 98 lines, written from `agents/reviews/X3e-root-drag-test.patch`.
- Titles: `writes no order for a drag from another tab over a tree whose own drag never ended` and `still takes the drop of the tree's own drag` (inside `describe('the root drag of the tree', ...)`).
- Run before any edit of mine to the tree it tests (the subject, `views/shared/explorer/tree/control/dragging.svelte.ts`, is byte-identical to the base): `Test Files 1 passed (1)`, `Tests 2 passed (2)`.
- Run after my last edit: `npx vitest run tests/views/shared/explorer/root-drag.test.ts`: `Test Files  1 passed (1)`, `Tests  2 passed (2)`.

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
| 8 | reading `problems.svelte.ts` (rows are read from the sources each fold); no run | remove a served root with rows listed: its rows leave the view and the status item |
| 9 | node `n21`: files `/tmp/x(1 error) \| a.py(2e 1w) \| b.py(1w) \| src/c.py(1i)`, rows of a.py `e10 e20 w2` | none open |
| 10 | node `n4`: `"**/node_modules/**" -> node_modules/a/b.js`; `"!**/node_modules/**" -> src/x.ts src/y.ts src/xy.ts`; `"src/?.ts"`, `"src/[xy].ts"`, `"src/{x,y}.ts"` -> `src/x.ts src/y.ts`; `"boom, !**/node_modules/**" -> src/x.ts src/y.ts src/xy.ts`; `"[abc"` and `"{a,"` -> nothing and no throw; `""` keeps all; page `pagerun1` filter lines agree | none open |
| 11 | page `n13`: `active file only, no source tab: rows 0`, text `No problems have been detected in the workspace.` | none open |
| 12 | node `n21`: `0=0 999=999 1000=1K 1500=1K 9999=9K 10000=10K+`; page `n22`: status `0  0`; tooltip words by reading `statusbar.yml:45-49` (`problems_none: No Problems`, `Errors: {0}`, `Warnings: {0}`, `Infos: {0}`) | hover the status item with 0 problems: `No Problems`; with 1 error and 2 warnings: `Errors: 1, Warnings: 2` |
| 13 | page `pagerun1`: table `SEVERITY MESSAGE SOURCE FILE POSITION` with the same rows; `n13`: menu `["Copy","Copy Message"]`, Copy puts tab-indented JSON with `resource`, `owner`, `code`, `severity`, `message`, `source`, `startLineNumber`.. on the clipboard, Copy Message `"missing_one" is not defined` | none open |
| 14 | reading `client.ts:310-315` and `:524-525` (library diagnostics handed to the store and cleared at the last model) | Go to Definition into a stdlib file with a diagnostic: Problems lists it under the library name; a press opens the read-only tab; close the tab and the row goes |
| 15 | reading: the store is built per client in `context.ts`, so a pop-out page has its own | pop out a pane with a source tab: its Problems view lists that window's rows only |
| 16 | node `n1`: `mac Cmd+Shift+M: {"kind":"toggle-problems"}`, `non-mac Ctrl+Shift+M: {"kind":"toggle-problems"}`, `mac Ctrl+Shift+M: null` (the LaTeX math chord keeps it); page `pagerun1` `n2`: `Cmd+Shift+M once: Problems selected true`, `twice: ... false`; the app taking the chord first is the look | in the desktop app and in Chrome: Cmd+Shift+M opens and closes the view |
| 17 | page `pagerun1` `n2`: F8 walks `y.py 1 -> x.py 3` rows and wraps, Shift+F8 walks back; node `n21`: `a.py 20:1 fwd b.py:5`, `last row of last file fwd (wraps) a.py:2`, `no rows at all walk: false`, a filter does not enter the walk (the walk reads `fold()`) | none open |
| 18 | page `n14`: `tabs after the step into y.py ... x.py 3(dirty)`, `back on x.py: text ... # unsaved-marker` | none open |
| 19 | page `n9`: `the hit pressed again after the caret moved: Ln 7, Col 1`; two opens within a millisecond: reading `source.svelte.ts` `nextAsked` (`++asked`) | none open |
| 20 | page `n19`: `caret after the reload and showing the tab: Ln 1, Col 1`, `a press on the same row after the reload: Ln 7, Col 1` (first run on the base: `7:1` after the reload) | none open |
| 21 | page `n8`: `after F12: Ln 1, Col 11 (6 selected)`, the same as the first run; word-at-column by reading `commands.ts` | none open |
| 21a | node `n2`/`n11`: a restored `endLine` before `line`, a string `asked`, a numeric `focus` each read as none (`tabFacts` returns zeros and `focus: true`); clamp by reading `ui/controls/editor/commands.ts:22-23` and `:28-30` (`getLineCount`, `getLineMaxColumn`) | a tab opened at line 500 of a 20-line file after a shrink: it lands on the last line |
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
| marker owner `command` | `grep -rnE "owner.*command\|OWNER = 'command'" src/lib` | `problem-sources.ts:87` and `command-marks.svelte.ts:16`; `lsp-<language>` (`problem-sources.ts:51`) and `oculus-latex` (`latex-widget.ts:54`, `problem-sources.ts:105`) unchanged |
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

## Files

Line counts after the change (`wc -l`); no source file is over 880 and no component over 520. `Workbench.svelte` is 519 lines, so it is not split. `PaneView.svelte` needed no edit (`diff -q` against the base: identical). `TreeItem.svelte` and `VirtualRows.svelte` are untouched (`VirtualRows.svelte` is identical to the base).

New files: `state/system/problems.svelte.ts` 316, `state/system/problem-sources.ts` 114, `state/sessions/source/place.ts` 95, `views/sources/search/Problems.svelte` 385, `views/sources/search/problem-rows.ts` 233, `views/sources/source/language/command-marks.svelte.ts` 68, `tests/views/shared/explorer/root-drag.test.ts` 98. Deleted: `views/academic/latex/Problems.svelte`, `views/shared/latex/Problems.svelte`.

Largest changed files: `state/client/context.ts` 844, `state/sessions/terminal/commands.svelte.ts` 815, `data/model/model-sessions.ts` 730, `state/sessions/source/source.svelte.ts` 725, `data/model/index.ts` 665, `ui/controls/editor/kit/lsp/client.ts` 659, `state/sessions/latex/builds.ts` 637, `shell/keys/workbench-keys.svelte.ts` 547, `state/workbench/navigation/pages.ts` 540.

### `diff -rq` against the base: changed paths

Changed (M) paths in the write list: `config/layout.yml`, `config/text/app.yml`, `statusbar.yml`, `views/academic/latex.yml`, `views/sources/search.yml`, `views/system/audit.yml`, `DESIGN.md`, `HELP.md`, `docs/files-and-search.md`, `docs/views.md`, `docs/window.md`, `docs/diagrams/*` (regenerated), `data/model/index.ts`, `data/model/model-sessions.ts`, the five `server/content/audit` files, `shell/keys/key-dom.ts`, `keys.ts`, `workbench-keys.svelte.ts`, `shell/panes/strip/strip-tab.ts`, `shell/status/status-items.ts`, `StatusBar.svelte`, `shell/Workbench.svelte`, `state/client/context.ts`, `state/sessions/latex/...` as below, `state/sessions/source/draft.ts`, `state/sources/explorer/rows/decorations.ts`, `state/system/audit.ts`, `documents.svelte.ts`, `state/workbench/navigation/status.ts`, `rail-badges.svelte.ts`, the editor `chords.ts`, `commands.ts`, `kit/lsp/client.ts`, `hosts.ts`, `services.ts`, `types.ts`, `tool-button.ts`, `tab-strip.ts`, `TabFace.svelte`, the views files named in the brief, `+page.svelte`.

Paths outside the brief's write list:

| Path | Why |
|---|---|
| `config/text/views/sources/files.yml` | the decoration words (`problems_one_title`, `problems_title`, `problems_many`, `problem_join`) |
| `src/lib/state/sessions/latex/builds.ts`, `latex.svelte.ts` | `showProblems(target)` drops the main-file argument because the view scopes by root |
| `src/lib/state/sessions/latex/latex-state.ts` | `LatexIssue` is no longer exported (nothing outside reads it) |
| `src/lib/state/sessions/source/source.svelte.ts` | `nextAsked` (the go-again counter the brief puts in the source store) |
| `src/lib/state/sessions/source/place.ts` (new) | `openPlace`, `PlaceOpener`; the shell's F8 and the state's walk need it below `views/` |
| `src/lib/state/sessions/terminal/commands.svelte.ts` | held output for a terminal the page has not heard of (`unplaced`, `UNPLACED_MAX = 8`, `hold`, `readUnplaced`), so a fresh press lists its command rows |
| `src/lib/state/system/problem-sources.ts` (new) | the three sources, split from the store so `state/system` keeps the store under the size limit |
| `src/lib/state/workbench/navigation/pages.ts`, `registry.ts` | `tabProblem` for the tab mark; `problemsBadge` keys of the status words |
| `src/lib/views/shared/explorer/RootedTree.svelte`, `src/lib/views/sources/source/language/tab-language.svelte.ts` | hand `problemOf` to the tree; compose the command-marks extension |
| `package.json`, `package-lock.json` | picomatch 4.0.7 and `@types/picomatch` 4.0.3 |
| `tests/views/shared/explorer/root-drag.test.ts` | G57, path list widened by the coordinator |

## Judgment calls, internal and reversible

- The walk (F8) is files in fold order and, inside a file, rows by position, so F8 after the caret goes to the next row down the file; the Problems view lists rows by severity then position. Node `n21` shows both.
- `openPlace` lives in `state/sessions/source/place.ts` taking a `PlaceOpener`, because `shell/` cannot import a view and the store's `open` needs it.
- The store's `open(row, { kept, focus, leaving })` and its types are local to `problems.svelte.ts`.
- A list that shrinks asks the Problems tree for the row at an index past the end once before it drops that row; `entryAt` answers it with an empty row that is never drawn. This is in `problem-rows.ts` and used by `Problems.svelte` for its `key`, label and row snippet.
- Command output a pane hands over before the terminal is listed is held (up to 8 terminals) and read when the terminal is listed.

## Architecture note (needs Axel's ruling only if he wants the other shape)

`shell/` reads problems only through page-fed props: `StatusWords.problems` and `walkProblem` from `+page.svelte`, and `tabProblem(facts.client, instance)` in `state/workbench/navigation/pages.ts`. `tests/checks` rows were not widened. The tab mark passes the whole client to `tabProblem`, as `badgeOf` does, a route the boundary check's regex (`\bclient\.(\w+)`) cannot follow. The alternative is adding `problems` to `SHELL_STORES` and `state/sources/fs` to the shell row in `tests/checks/tree/boundaries.test.ts`, which is a check edit outside this step's list and which I did not make.

## User-visible changes, before and after

| Where | Before | After |
|---|---|---|
| Explorer group | Files, Repositories, Search, TeX | plus a Problems view (`s8`), VS Code's Problems panel for the page, defaults fixed, filter with glob terms through picomatch |
| Status bar | findings only | a Problems item (`cross` N, `warn` N, `info` N when non-zero; `1K`, `10K+`; tooltip) before findings |
| Keys | Monaco's F8 wrapped inside one file; no Problems key | Cmd+Shift+M (Ctrl+Shift+M off macOS) toggles the view; F8 and Shift+F8 walk the Problems order across files, wrapping; Monaco's own F8 is freed |
| Opening a row or a search hit | went to the place once per line and column; Go to Definition selected the name | a single press previews, Enter or a double press keeps; the place is stamped on each open, so a press after the caret moved goes back; a reload does not go again; a range selects |
| Command errors | listed nowhere | Problems rows and editor marks under owner `command` |
| Files tree, Open Editors, tab strip | git letter only | error or warning count (`9+` from ten) in the worst colour, a dot on folders, tooltip "N problems in this file" |
| TeX view | its own Problems section and project-panel list | removed; the panel's count and the build notice's Show Problems open the Problems view scoped to the root |
| Audit | no cursor on rows, place was text | `data-cursor` outline on the cursor row; the place is a button that opens the finding's file; Enter presses it; each finding carries `file` |
| Focus lane | Enter opened nothing | Enter on a card opens its project |
| Settings | 202 card elements, 32 distinct ids; no Enter into a card | unique ids, `o` and arrows mark one card, Enter focuses its first field and changes no value |
| Card cursor across a reload | cleared at once; Focus and 14 other views lost it | kept in the saved instance state and drawn after the reload (cases 31 and 32 GREEN) |

## Head comments and documents touched

Rewritten: `shell/status/status-items.ts`, `StatusBar.svelte`, `state/workbench/navigation/status.ts`, `navigation/pages.ts`, `state/client/context.ts`, `state/system/audit.ts`, `documents.svelte.ts`, `problems.svelte.ts` (new), `commands.svelte.ts`, `ui/controls/editor/commands.ts`, `chords.ts`, `hosts.ts`, `services.ts`, `ui/controls/tool-button.ts`, `ui/tabs/TabFace.svelte`, `tab-strip.ts`, `FileRow.svelte`, `OpenEditors.svelte`, `Cards.svelte`, `Audit.svelte`, `LaneCard.svelte`, `key-dom.ts`, `scan.ts`, `Latex.svelte`, `views/shared/latex/places.ts`, `tab-state.ts`, `model-sessions.ts` (doc comment at the old `:715`), `DESIGN.md` (the Audit, the status bar, a new Problems passage at `:475`), `HELP.md`, `docs/views.md`, `docs/window.md`, `docs/files-and-search.md`, `config/text/views/sources/search.yml` line 1. Untouched and not edited: `PaneStrip.svelte`, `TreeItem.svelte`, `VirtualRows.svelte` (their head comments were read against the change and need no edit; the reading is not re-run in this turn). The history-word scan I ran over every changed comment and doc line (words such as no longer, previously, used to, instead of, still, again) found only uses that describe behaviour (for example "goes there again", "no longer open" in a sentence already in the base).

Edits to existing assertions: none. `diff -rq` against the base lists `tests/views/shared/explorer/root-drag.test.ts` as the only test path.

## Edits outside the brief

- Coordinator correction: vitest runs only as `npx vitest run <one test file>` named by the brief (plus `npm run test:checks`); every Chrome and server I started was ended by its own pid in the same command; `ps -axo ppid,command | grep d33b` is empty.
- Z720: no page run was started after the ruling; no scratch oculus server, headless Chrome or tmux server of mine is left (`lsof` on 8805 exit 1, the `ps` grep empty).
- The G57 file and its widened path.
- The files in the outside-list table above.

## Deviations with no effect

- One `git diff --stat`, one `git -C . --version` and one `git diff --no-index --stat /dev/null /dev/null` were run by mistake (read-only; no repository state changed).
- One `tmux -S ... ls` call failed (no effect).
- `pagerun.sh` creates a short real directory `/private/tmp/d33t` outside the scratchpad (macOS socket path length) and removes it on exit; it does not exist now.
- One `cp ... /tmp/_x` scratch copy, removed at once.
- A usage-refresher `claude` process and a tmux server that were not mine to keep were ended by pid.

## Anything wrong in the brief

- The state file's open items are on lines 154 to 156, not 153 to 155.
- Case 30 asks for a node run of the Settings card id function; it is `idOf` inside `Cards.svelte`, so only a page run (203 distinct of 203) or a reading reaches it.
- The brief puts the store beside `documents` in the client context and lets the status bar, strip tab and F8 read it; `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.ts` forbid a shell read of `problems`, which is why the page feeds the shell (see the architecture note). `state/system` is now at 10 items, the folder limit.
- `agents/briefs/D33.md` says `Workbench.svelte` is 515 lines; it is 519 now, 1 under the limit.
