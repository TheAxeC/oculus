# D36 report (repair round 1): linters (ChkTeX, ruff, ESLint, ShellCheck)

## State after this round

All ten rulings are built in `.agents/worktrees/D36/tools/oculus` and verified by the commands below. The brief's page checks (no app, browser or dev server was started) are NOT done and are named under "Not done, not verified". Two tests I had added (the lint store's statuses, the tab's Fix All) and two documentation-address rows had no entry in `agents/guarded.md`; they are not in the tree, and a guarded entry for them is raised below as an open item for Axel. `agents/reviews/D36-report.md` inside the worktree is the earlier report: it is superseded by this message and its figures no longer hold, so it should not be landed.

## Open items of the state file (verbatim, as `orchestrator-state.md` reads now)

`sed -n 167,172p orchestrator-state.md`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

Open item 16 (D39's `lsp-edit` closed-paths question, options (a), (b), (c), recommendation (c)) is no longer on that list. `sed -n 192p orchestrator-state.md` under "Closed items":

```
- 2026-10-08: open item 16 (what a language server's edit refuses as closed, Z730 O5's premise found false) ruled (b) by Axel: `lsp-edit` refuses a file under `privateFolders` (the hub's `secrets` and `~/.oculus`), the rule the YAML server already withholds files by (`isPrivateFile`), and `apps.closed_paths` stays an app setting. (a) and (c), which tie the app setting to editor edits, were not chosen; the lazy option was keeping the false sentence.
```

D36 touches none of D39's paths.

New open item raised by D36 (a new guarded entry needs Axel's yes, `agents/spec.md:57`): two behaviours the repair rulings changed have no entry in `agents/guarded.md`, so the tree carries no test for them.
- Behaviour A: a documentation address a linter names reaches the page's opener, a marker link or the Problems link only when `webAddress` passes it (http or https). Behaviour B: the lint store reports a status only for a linter that answered, and a tab's Fix All is enabled only while the tab holds the text the findings were read from.
- Option (a): add one entry for A (rows: the ruff reader, the ESLint reader, `webAddress`) and one for B (the store's statuses, `lintActions`), and land the four scratch test files kept in `$TMPDIR/d36r1/kept-tests/`. They pass on the final tree (23 passed in 4 files, `$TMPDIR/d36r1/proof`) and fail on the tree as first handed back (7 failed, `$TMPDIR/d36r1/proof0`). Option (b): no entry; A is held by the readers' run quoted below and `methods.test.ts` (47 passed, the check's existing test), B by the look on TEST.
- Recommendation (a). The lazy option is (b).
- The text of the entries and the four scratch files go into the brief if Axel says (a); D36 wrote no test for them.

## Not done, not verified

1. No page was opened. Cases 1 (marker in every editor), 5 (marker going), 6, 7, 7a, 10, 11, 21, 25 to 29 and the look of the status items in 12, 13 and 22 are checked by reading the code and by the runs below, and their rows say "page". None was seen on screen.
2. The three guarded ESLint tests and the `lint.eslint` switch test use a stand-in `eslint` package in a scratch repository, with oculus's own `eslint-child.mjs` as the child. The real ESLint ran in node through the route (cases 3, 4a, 4b, 22, 23), not inside vitest.
3. The route's answer for `lint.eslint: false` while a lint is in flight is covered by `eslint-switch.test.ts` with an idle child only.
4. `test:quick` ran in 39.4 s against its 45 s limit while D39's builder was running vitest in its own worktree on the same machine; two earlier runs of the same command passed in 58.4 s and 49.5 s ("over the time limit" printed, exit 0) under the same load.

## The ten rulings

| # | State | Where, and the command that shows it |
|---|---|---|
| 1 | DONE | `lint.svelte.ts:228-235` `statuses` returns only linters whose slot has a status. `LanguageItems.svelte:149-203` draws an item from the statuses it gets; `statusbar.yml:138` `lint_tip_ran` ("{0} ran on this file. Select to run the linters again.") is the `ok` case only. `lint-fixes.ts:404-412` lists Run Again for every held file. Scratch store test on the first-handed tree: `AssertionError: expected [ { linter: 'ruff', …(1) } ] to deeply equal []` at `lint.test.ts:37:47`, `:50:47`, `:59:52`, and `expected [] to deeply equal [ 'oculus.lint.rerun' ]` at `lint-actions.test.ts:65:46`; on the final tree `Test Files  4 passed (4)  Tests  23 passed (23)` |
| 2 | DONE | one check, `webAddress` at `src/lib/data/hub-address.ts:45` (moved from `state/system/apps/methods.ts`, which imports it at `:16`, used `:284`). Readers: `readers.ts:19` import, `:132-133` `documented`, `:159` ruff, `:347` ESLint. Views: `lint-fixes.ts:315` and `:365`, `Problems.svelte:153`, `:172`, `:185`, `:375`, `problem-marks.svelte.ts:73`; `lint-model.ts:6` re-exports it. The readers' run is quoted under "Documentation addresses" |
| 3 | DONE | `lint-fixes.ts:418-420` `disabled: !fresh(client, instance, file, linter) || !rows.some(...)`, `fresh` at `:55-67`. Scratch test on the first-handed tree: `expected false to be true` at `lint-actions.test.ts:94:64`; passes on the final tree |
| 4 | DONE | `eslint-life.test.ts:142` 'ends a child that does not answer within the time of a lint, answers timeout and starts a new child for the next' (`hang.js`, stepped clock, `LIMIT_MS`). On the unchanged tree it cannot run: `Error: Cannot find module '.../src/lib/server/machine/runs/lint/runs.ts' imported from .../tests/server/machine/runs/lint/lint-fixture.ts`, `> tests/server/machine/runs/lint/lint-fixture.ts:10:1` and `> tests/server/machine/runs/lint/eslint-life.test.ts:19:1` (the module under test does not exist there) |
| 5 | DONE | `tests/server/root/eslint-switch.test.ts:86` runs the real `createServerContext` (`context.ts:276` `make.createEslints`, `:345` `if (!lintSettings(make.loadConfig(engine).config).on.eslint) eslint.endAll()`) over a scratch copy of the engine's config folder, calls the captured `built` hook with `lint.eslint` true (child stays) and false (child ends, exit seen). Unchanged tree: `Error: Cannot find module '../../../src/lib/server/machine/runs/lint/eslint.ts'`, `> tests/server/root/eslint-switch.test.ts:25:1` |
| 6 | DONE | `HeldEslints` takes `exited(pid)` (`eslint.ts:63`, `:71-74`, called `:144`, option `:218`, passed `:256`); `lint-fixture.ts` has `exitWatch()` (`:238`), `steppedClock().armed(ms)`, and `until` is gone: `grep -rn "until(" tests/server/machine/runs/lint tests/server/root/eslint-switch.test.ts` prints nothing. `context.ts:156`, `:181` carry the `createEslints` dependency the switch test injects `exited` through |
| 7 | DONE | per configuration folder, kept. `DESIGN.md:166` ("The approval and the running ESLint belong to one configuration folder and its one `eslint.config.*` file, so a repository with a root configuration and a nested one asks for each on its own, and a change to one voids only its own approval."), `docs/files-and-search.md:93` (same sentence), `lint-config.svelte.ts:3-5` and `LintConfigRows.svelte:3-5` head comments. Row: `eslint-trust.test.ts:110` 'asks for a nested configuration on its own, and its approval covers that folder alone' |
| 8 | DONE, no code change | the installed ChkTeX suppresses both warnings of the merged comment; the run is quoted under "ChkTeX suppression comment" |
| 9 | DONE | the six comments rewrapped to 100 columns (`approvals.ts`, `relay.ts`, `editor-status.svelte.ts`, `extension.ts`, `LanguageItems.svelte`, `Palette.svelte`); `DESIGN.md:575` reads "the ChkTeX findings of a LaTeX tab come from the ChkTeX linter."; `docs/files-and-search.md:99` and `docs/configuration.md:13` say the switches take `true` or `false`. `test:checks` `comment-width.test.ts` passes in the third list run |
| 10 | DONE | this message |

## Documentation addresses (ruling 2), the readers' run

`node r1-docs.mts` (`readRuff` and `readEslint` over rows whose URL is each of three addresses):

```
ruff url javascript:alert(1) {"code":"F401","href":null}
ruff url file:///etc/passwd {"code":"F401","href":null}
ruff url https://docs.astral.sh/ruff/rules/unused-import {"code":"F401","href":"https://docs.astral.sh/ruff/rules/unused-import"}
eslint docs javascript:alert(1) {"code":"no-undef","href":null}
eslint docs file:///etc/passwd {"code":"no-undef","href":null}
eslint docs https://eslint.org/docs/rules/no-undef {"code":"no-undef","href":"https://eslint.org/docs/rules/no-undef"}
```

Scratch row tests (kept in `kept-tests/`) on the first-handed tree: `expected { line: 1, column: 1, …(7) } to not have property "href"` at `eslint-trust.test.ts:123:41`, `expected { Object (line, column, ...) } to not have property "href"` at `lint-route.test.ts:165:29`.

## ChkTeX suppression comment (ruling 8)

A scratch `.tex` line carrying both warnings 12 and 2 (`See Fig. \ref{a}`), the installed ChkTeX at `/usr/local/texlab...` is `/usr/local/texlive/2025/bin/universal-darwin/chktex`. Without the comment the route answers rows 12 and 2 (case 2 below). With the merged comment `% chktex 12 chktex 2` at the line's end (the form `chktexDisable` writes for two codes) ChkTeX prints no warning for the line, so both are suppressed and `chktexDisable` needed no change. The input and run are in `$TMPDIR/d36r1/chk/a.tex`.

## The cases' first run on the unchanged tree

The unchanged tree is `.agents/worktrees/D36-base/tools/oculus`. On it: `ls "src/routes/api/(machine)"` prints `debug hpc lines schedules usage` (no lint route); `ls src/lib/server/machine/runs` prints `commands schedules seeds`; `grep -n "^lint:" config/behavior.yml` finds nothing; `grep -n "linter" src/lib/shell/status/status-items.ts` finds nothing; `sed -n 23p DESIGN.md` reads "It has no lint panel and no other debugger."; `texlab/settings.ts:47` reads `chktex: { onOpenAndSave: false, onEdit: false },`. So cases 1 to 31 have no behaviour to run on it, and the new test files fail there as quoted under "Tests".

## Cases 1 to 31 on the final tree

Node runs are scripts in `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d36r1/cases/` (`c1-4.mts`, `c4a-4b.mts`, `c9-31.mts`, `c23.mts`, `r1-eslint.mts`, `r1-shellcheck.mts`, `r1-docs.mts`, `r1-d9.mts`, `r1-case12.mts`) that call `handleLint` over scratch trees under `cases/work/`; their output is in `out2-*.txt` there, run after the last source change. "page" means checked by reading plus the look on landing.

| Case | Final tree: command or reading and output |
|---|---|
| 1 | `c1-4.mts`: ruff on `import os`: `{"line":1,"column":8,"endLine":1,"endColumn":10,"severity":"warning","message":"`os` imported but unused","code":"F401","href":"https://docs.astral.sh/ruff/rules/unused-import","noqa":1,"fixes":[{"kind":"fix","title":"Remove unused import: `os`",...` `print(undefined_name)`: `F821`, `"severity":"error"`. `def f(:`: two `error` rows with no `code`. Marker in every editor of the file: page, `problem-marks.svelte.ts:109` holds the file per mounted editor |
| 2 | `c1-4.mts`: the four-line file gives rows with `"code":"12"`, `"code":"2"` at column 9 and `"code":"18"` at column 29, all `warning`. With a tab and `U+00E9` before `Fig.` the columns are 12 and 12 (ChkTeX's byte column converted to UTF-16 columns). With `-e 9` in `chktexArgs` the `\begin` mismatch is `"severity":"error"`; with the default arguments the same row is `"warning"` |
| 3 | real ESLint, `r1-eslint.mts` over oculus's own `eslint.config.js`, approvals file under `$TMPDIR`: `case3 lint before approval {"ok":false,"state":"not_approved"}`; `case3 config` answers `"approved":false` and `"key":"eslint-config:39dcbfe1a426f67d421debfd1cd7277746d8023f6f9151b7af573bd24cdf8a90"`; after the approval the first lint `{"ok":true,"rows":0,"ms":16653}` (cold start), the second lint of another file `{"ok":true,"rows":0,"ms":122}`. Rows from a scratch config, `c4a-4b.mts`: `no-var` with `href` `https://eslint.org/docs/latest/rules/no-var`; `fatal.js` (`let x = ;`) `{"line":1,"col":9,"endLine":0,"endCol":0,"sev":"error","nfix":0}`, no code |
| 4 | real ShellCheck 0.x at `/opt/homebrew/bin/shellcheck`, `r1-shellcheck.mts`. `#!/bin/bash\necho $1`: `{"line":2,"column":6,"endLine":2,"endColumn":8,"severity":"info","message":"Double quote to prevent globbing and word splitting.","code":"SC2086","href":"https://www.shellcheck.net/wiki/SC2086","fixes":[{"kind":"fix","title":"","edits":[{"line":2,"column":6,"endLine":2,"endColumn":6,"text":"\""},{"line":2,"column":8,"endLine":2,"endColumn":8,"text":"\""}]}]}`. A file with `if then`: `SC1073` and `SC1072`, `severity error`, `"fixes":[]`. `cd /tmp` alone: `SC2164` `warning` with the fix ` \|\| exit`. A line `echo "<U+1F600>" $1`: `"column":11,"endColumn":13` (ShellCheck's code point column 10 shown as UTF-16 column 11). Backticks: `SC2006` and `SC2116`, `info`. The fix title is empty and the tab's action draws `titleOf` (`lint-fixes.ts:246`) |
| 4a | ESLint `no-unused-expressions` over `a +\nb +\nc;`: `{"line":1,"col":1,"endLine":3,"endCol":3,...}`; a row with no end (`fatal.js` above) has `"endLine":0` and `problem-marks.svelte.ts:49-57` draws it over the word at its column. The drawn range: page |
| 4b | `c1-4.mts` ruff on `s = "<U+1F600>"; import os`: F401 `"column":18,"endColumn":20` and its fix `{"line":1,"column":11,"endLine":1,"endColumn":20,"text":""}`. `c4a-4b.mts`: ESLint `no-var` fixes applied to a CRLF file give `"let a = 1;\r\nlet b = 2;\r\nexport { a, b };\r\n"`, to a BOM file `"let a = 1;\nexport { a };\n"`, and a U+2028 in line 1 leaves the second finding on editor line 2 |
| 4c | `def f(:` and `let x = ;`: no `code`, `"fixes":[]`; `lint-fixes.ts:285` `if (code === undefined) continue;` offers no Disable and no Show documentation |
| 5 | `c1-4.mts` `case5 fixed`: after the file is fixed the answer holds only the `I001` row of this machine's ruff configuration, and `r1-shellcheck.mts` `case5 clean file` `{"ok":true,"rows":[],"hash":"c7eb..."}`; the store replaces a linter's slot with each answer; the marker going: page |
| 6 | `problem-marks.svelte.ts:71` maps `info` to `MarkerSeverity.Info`; Show Infos is the Problems view's existing filter. Page |
| 7 | `state/client/context.ts:618` `lint.forgetOutside(roots)` beside `commands.forgetOutside` and `latex.forgetOutside`; `served-roots.client.test.ts` 6 passed. The store's rows leaving: page |
| 7a | `lint.svelte.ts:101-108` `canonical` names a file by `tabOfFile(served, ...)`, the deepest served root; one slot per file. Page |
| 8 | after ruling 1. `lint.svelte.ts:165-173` `hold` lints on the first hold of a clean tab only (`before > 0` returns, `if (tab.clean) runAll(file)`); `:189-196` `reloaded` lints a clean tab and not the reload a save caused; `:199` `saved`; `state/client/context.ts:467` calls `lint.saved`. A restored tab with unsaved text is not linted and has no status: scratch store test 'has none for a restored tab with unsaved text, which is not linted' passes on the final tree and fails on the first-handed tree at `lint.test.ts:50:47`. The status bar then draws no item for it: `Source.svelte:368` passes the store's statuses only |
| 9 | `c9-31.mts`: `case9 first run pid 5317 alive before second: true`, `case9 first answer {"ok":false,"state":"failed","reason":"stopped"}`, `case9 second answer {"ok":true,"rows":[],...}`, `case9 first pid alive after second: false` |
| 10 | `lint.svelte.ts:176` `release` forgets the file and bumps its counters (`:126-133`, `:160`: an answer in flight writes nothing); `LintRuns.stopFile` stops the process. Page |
| 11 | the store is per page (`createLint` in the client context). Page |
| 12 | `r1-case12.mts` with `lint.ruff_path` and `lint.shellcheck_path` naming no file: `{"ok":false,"state":"not_found"}` for both. The item reads `ShellCheck: not found` (`statusbar.yml:134` `lint_not_found: '{0}: not found'`) with the tooltip `statusbar.yml:141` "ShellCheck was not found. Install it with brew install shellcheck, or name its absolute path, or one starting with ~, in lint.shellcheck_path." Warning tone: page |
| 13 | ruff over a `pyproject.toml` that does not parse: `{"ok":false,"state":"failed","reason":"Cause: Failed to parse .../pyproject.toml"}`. A scratch ShellCheck exiting 3 and 4: `{"ok":false,"state":"failed","reason":"shellcheck: bad invocation"}`. A failed slot holds no rows |
| 13a | a scratch program writing 20 MB: `{"ok":false,"state":"failed","reason":"too_large"}` |
| 14 | a scratch program that sleeps, `limitMs` 700: `{"ok":false,"state":"timeout","ms":702}` |
| 15 | `not json` and `{"a":1}`: `{"ok":false,"state":"failed","reason":"unreadable"}` each |
| 16 | a scratch chktex exiting 0 with `ChkTeX: Unable to open file x.tex` on stderr: `{"ok":false,"state":"failed","reason":"ChkTeX: Unable to open file x.tex"}` |
| 17 | `eslint-life.test.ts:128` 'answers failed for a lint in flight when the child exits, and starts a new child for the next' (7 tests in the file pass) |
| 18 | `lint-route.test.ts:36` and `c9-31.mts`: `case18 no token 403` |
| 19 | `c9-31.mts`: climbs `404 outside`, unknown root `404 outside`, folder `404 not_a_file`, gone `404 missing`, no program started |
| 20 | `c9-31.mts`: `a; touch x.py` `{"status":200,"x_created":false}` with the whole path as the last argument; `$(touch x).sh` the same |
| 21 | `canonical` returns null for a root not served or a path no linter takes; `tab-language.svelte.ts` composes marks and fixes for a file on disk only. Page |
| 22 | `eslint-trust.test.ts` 4 passed: before the approval `not_approved`, no `config.marker`, no `starts.txt`, `running()` empty; a changed configuration asks again and ends the child; `revoke` ends the child. Real ESLint: `r1-eslint.mts` `case22 running before approval []`, `case22 revoke {...,"approved":false,...}`, `case22 running after revoke []`. The item `ESLint: not approved`: page |
| 23 | `r1-eslint.mts`: `tools/cockpit/assets/js/mathconfig.js` (no `eslint.config.*` above): `{"ok":false,"state":"no_config"}`; a folder with only `.eslintrc.json`: `{"ok":false,"state":"no_config"}`; a file the configuration ignores (`gen/out.js`): `{"ok":true,"rows":[],"hash":"4a8a..."}`; the control `src.js` returns the `no-var` row. After ruling 1 a `no_config` and an `off` answer draw no item (`LanguageItems.svelte:154-156` returns null), and a tab with no answer has no status at all (`lint.svelte.ts:228-235`) |
| 24 | real ShellCheck, `r1-shellcheck.mts`: `x.zsh`, `x.bib`, `x.sty`, `x.cls` each `{"status":400,"body":{"ok":false,"error":"not_taken"}}`; `x.slurm` (`#!/bin/bash\n#SBATCH -n 1\necho $1`) is taken: `{"line":3,"column":6,"endLine":3,"endColumn":8,"severity":"info",...,"code":"SC2086",...}`. No item for the four refused: `lintersOf(path)` is empty, so `statuses` returns `[]` |
| 24a | `c9-31.mts`: a link inside the root 200 with the target `.../a.py` as last argument; a link out 404. Root `my root-...`, folder `sub dir`, file `a:b.tex` with a `.chktexrc` beside, real chktex: row `"code":"12"` at line 3 column 9; the recorded arguments end `"-l",".../sub dir/.chktexrc","-q","-I0","-f%l:%c:%d:%k:%n:%m","",".../sub dir/a:b.tex"` |
| 25 | `lint-fixes.ts:359-361` `pushUndoStop`, `executeEdits('oculus.lint', ...)`, `pushUndoStop`: one undo step; nothing is written until a save. Page |
| 26 | `lint-fixes.ts` builders: ruff `# noqa: CODE` at the `noqa` row's line (`:107-114`, `, CODE` merged into an existing `# noqa:`), ESLint and ShellCheck comments above with the line's indentation, ChkTeX `% chktex N`, ESLint `/* eslint-disable RULE */` at the file's top. Page |
| 27 | the documentation action `oculus.lint.documentation` (`lint-fixes.ts:34`, built `:315`, opens `:365`) opens only an address `webAddress` passes; ChkTeX 2's fix is `{"text":"~"}` (case 2). Problems link: `Problems.svelte:375`. Page |
| 28 | `oculus.lint.fix_all.<id>` (`lint-fixes.ts:416`), one `pushUndoStop` pair; listed only for a linter whose status is `ok` (`:421` filter) and enabled per ruling 3. Page |
| 29 | `fresh()` (`lint-fixes.ts:55-67`): offered only while the tab is loaded, `draft.text === draft.saved` and the slot's hash is `draft.base`. Scratch test 'runs Fix All only in a clean tab whose text the findings were read from' passes on the final tree |
| 30 | `c9-31.mts`: `case30 ruff off {"ok":false,"state":"off"}`; `lintItem` returns null for `off` (`LanguageItems.svelte:154-156`), so no ruff item; back to `true` the next save lints (`lint.svelte.ts:199`). `lint.chktex_args` read per request: case 2's `-e 9` run; the route reads `lintSettings(...)` per request. A wrong value: `settings.test.ts` 70 passed, eight `answers the default for a wrong lint.%s and names the key` rows |
| 31 | `c9-31.mts`: a 20 MB `.py`: `{"status":200,"ok":true,"rows":0,"ms":212}` |

## Decision 9: ChkTeX columns through the route

`node r1-d9.mts` runs the installed ChkTeX directly (`-I0 -f%l:%c:%n`) and the route (`handleLint` with the shipped `chktexArgs`) on real lines of `projects/manuscripts` in this worktree and prints both columns:

```
btfno/manuscript/ReproducibilityChecklist.tex:214 code 36 {"status":200,"chktexByteColumns":[54],"routeColumns":[47]}
dongho-ecg-clustering/notes/thesis/main.tex:124 code 2 {"status":200,"chktexByteColumns":[398,1048],"routeColumns":[397,1044]}
dries-bttr-ecg/notes/thesis/chapters/2_Background.tex:59 code 46 {"status":200,"chktexByteColumns":[33,70,82,311,334],"routeColumns":[33,70,82,309,332]}
dries-bttr-ecg/notes/thesis/chapters/3_Related_work.tex:9 code 13 {"status":200,"chktexByteColumns":[591],"routeColumns":[589]}
dries-bttr-ecg/notes/thesis/chapters/samenvatting.tex:38 code 12 {"status":200,"chktexByteColumns":[13,349],"routeColumns":[13,345]}
```

The five numbers are 54 to 47, 398 to 397, 311 to 309, 591 to 589 and 349 to 345.

## DONE / NOT DONE

Run from `tools/oculus` of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, after the last change. Full-list runs this round: 3, each: `npm run diagrams`, `checks.sh`, `npm run test:checks`, `npx vitest run tests/server/machine/runs/lint/` and the per-entry files; `checks.sh` was also run once alone for its time. The lines below are from the third.

| Item | State | Proof (command, output whole) |
|---|---|---|
| 1. Items 1 to 9 of the rulings | DONE | the table above |
| 2. `npm run diagrams`, then `checks.sh` | DONE | `npm run diagrams` exit 0; `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` exit 0 and printed `$ npm run test:quick`, `test:quick: 97 changed file(s), from git since HEAD`, `test:quick: 121 test file(s), 10 essential`, `ok      ASCII gate (0.5 s)`, `ok      prettier (0.9 s): All matched files use Prettier code style!`, `ok      svelte-kit sync (2.2 s)`, `ok      eslint (9.9 s)`, `ok      svelte-check (9.5 s): 1791493445588 COMPLETED 439 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (38.6 s): Duration  33.81s (transform 31.07s, setup 0ms, import 60.84s, tests 70.83s, environment 629ms)`, `test:quick: 39.4 s (limit 45.0 s); every command passed`, `test:quick: not covered: tests outside the selection, tests/checks, slow tests,` / `            build, lint of unchanged files; npm run test:landing runs them`, `checks: 1 commands passed` |
| 3. `npm run test:checks` | DONE | `Test Files  17 passed (17)` `Tests  248 passed (248)` exit 0. Not covered: the other 121 unit files outside the selection, and every page |
| 3b. `npx vitest run tests/server/machine/runs/lint/` | DONE | `Test Files  3 passed (3)` `Tests  20 passed (20)` (`eslint-life` 7, `eslint-trust` 4, `lint-route` 9) |
| 4. Per-entry tests, each alone | DONE | `Test Files  1 passed (1)` each: G28 `channel.test.ts` 12, `tab-menu.test.ts` 4, `held-unsaved.test.ts` 1, `terminal-close.test.ts` 3, `manifest-draft.test.ts` 3, `autosave.client.test.ts` 23, `source-disk.client.test.ts` 4, `source.test.ts` 25, `comment-draft.client.test.ts` 1, `pages.test.ts` 5, `workspaces-real.test.ts` 2; G69 `served-roots.client.test.ts` 6; G61 `config-cache.test.ts` 3; `config.test.ts` 31; `config-folder.test.ts` 25; `options.test.ts` 3; `settings.test.ts` 70; `approvals.test.ts` 7; `compose.test.ts` 16; `latex-approvals.test.ts` 19; `servers.test.ts` 6; `svelte-trust.test.ts` 2; G32's seven files `normalise` 1, `resources` 1, `docs` 2, `feeds` 1, `manifests` 1, `personal` 2, `present` 4; `state/system/apps/methods.test.ts` 47; `server/root/eslint-switch.test.ts` 1 |
| 5. Limits | DONE | no changed `.ts`, `.mts`, `.mjs` over 880 and no `.svelte` over 520 (largest: `settings.ts` 845, `relay.ts` 852, `context.ts` 839 and 837, `Palette.svelte` 520); `sh utils/folder-check.sh` exit 0 |
| 6. Unused exports | DONE | `diff D36-base/tools/oculus/unused-exports.txt <now>` prints `39d38 < src/lib/server/content/latex/tools.ts: TOOL_TIMEOUT_MS` and `47a47 > src/lib/server/core/program.ts: TOOL_TIMEOUT_MS`: the one entry moved with `run`; no line is added |
| 7. ASCII gate, YAML | DONE | the spec's perl command over `src tests config` prints nothing, exit 0 (`bin` does not exist in this tree and is left out of `find`); `grep -c '[^ -~]'` over `DESIGN.md HELP.md docs/*.md` prints 0 for each; `yaml.safe_load` of `behavior.yml`, `glyphs.yml`, `icons.yml`, `options.yml`, `app.yml`, `statusbar.yml`, `search.yml`, `source.yml` exit 0 |
| 8. Greps | DONE | `grep -rn "from './tools.ts'" src/lib/server/content/latex` prints `endpoint.ts:53:import { readCount } from './tools.ts';` only (no `run`); `grep -rn "no lint panel" DESIGN.md HELP.md docs` prints nothing; `find` for `.ruff_cache` and `.eslint_d` under the scratch folders and the worktree prints nothing |
| 9. No process left | DONE | `pgrep -fl "ruff\|chktex\|shellcheck\|eslint"` prints nothing; `ps -axo pid,command` filtered for `worktrees/D36/` and `d36r1` prints nothing. Port 8790 is listened on by pid 7018, which this run did not start |
| 10. Prose | DONE | see "History words and prose" |
| 11. Page checks | NOT DONE | no app was started |

## Files and line counts

Changed, new or removed against `.agents/worktrees/D36-base/tools/oculus` (`cmp` over `config docs src tests utils DESIGN.md HELP.md`); the number is the line count now:

```
DESIGN.md 579 | HELP.md 188 | docs/configuration.md 69 | docs/files-and-search.md 134 | docs/views.md 279 | docs/window.md 82
docs/diagrams/{channels,layer-server,layer-shell,layer-state,layer-views,layers}.{dot,svg} regenerated by npm run diagrams
config/behavior.yml 279 | catalogs/glyphs.yml 276 | catalogs/icons.yml 275 | catalogs/options.yml 1402 | text/app.yml 250 | text/statusbar.yml 219 | text/views/sources/search.yml 156 | text/views/sources/source.yml 167
src/lib/data/hub-address.ts 56 | data/model/index.ts 654 | model-machine.ts 718 | data/sources/config.ts 102 | config/settings.ts 845
src/lib/server/core/program.ts 126 (new)
src/lib/server/content/latex/{endpoint 600, recipes 272, synctex 142, texdoc 42, tools 27}.ts
src/lib/server/machine/approvals/approvals.ts 357 | lsp/adapters/texlab/{adapter 79, links 70}.ts | lsp/adapters/web/approval.ts 57 | lsp/relay.ts 852 | pty/latex/{approval 225, latex 464}.ts
src/lib/server/machine/runs/lint/{chktex-fixes 141, eslint-child.mjs 77, eslint 294, linters 127, readers 365, routes 363, runs 39, text 47} (all new)
src/lib/server/root/context.ts 839 | root/process/server-context.ts 153
src/routes/api/(machine)/lint/+server.ts 34 (new)
src/lib/state/client/context.ts 837 | state/system/apps/methods.ts 323 | problem-sources.ts 162 | problems.svelte.ts 325 | workbench/navigation/editor-status.svelte.ts 191 | workbench/palette.ts 443
src/lib/state/system/machine/lint/{lint-answer 52, lint-model 8, lint-words 16, lint.svelte 308} (all new)
src/lib/shell/keys/Palette.svelte 520 | palette-modes.ts 260 | palette-open.ts 81 | lint-config.svelte.ts 75 (new) | rows/ChoiceRows.svelte 165 | rows/ApprovalAsk.svelte 32 (new) | rows/LintConfigRows.svelte 93 (new)
src/lib/shell/status/LanguageItems.svelte 294 | status-items.ts 157
src/lib/views/sources/search/Problems.svelte 425 | source/Source.svelte 494 | language/{extension 71, tab-language.svelte 99}.ts | language/lint-fixes.ts 428 (new) | language/problem-marks.svelte.ts 139 (new; command-marks.svelte.ts removed) | status/{ask-perform 140, tab-asks.svelte 177}.ts
tests/checks/config/{config-folder 629, config 665}.test.ts | checks/source/keys.test.ts 575 | checks/tree/boundaries.test.ts 765 | data/sources/config/settings.test.ts 741 | wrong-settings.ts 81 | server/machine/approvals/approvals.test.ts 138 | server/root/context-fixture.ts 184
tests/server/machine/runs/lint/{lint-route.test 135, eslint-life.test 157, eslint-trust.test 136, lint-fixture 256} (new) | tests/server/root/eslint-switch.test.ts 138 (new)
```

Paths outside the brief's "Paths this step writes" list, each with its reason:
- `src/lib/data/hub-address.ts`, `src/lib/state/system/apps/methods.ts`: ruling 2 names the tree's one `webAddress` and says to move or export it to where the readers and views may import it; `data/hub-address.ts` is the layer both the server and the state may import, `methods.ts` now imports it.
- `src/lib/state/system/machine/lint/lint-answer.ts` (zod shapes of the route's answers), `lint-model.ts` (re-exports, since views and shell may import state modules and not `data/model`), `lint-words.ts` (names and ChkTeX fix titles drawn by the bar, palette and fixes).
- `src/lib/shell/keys/lint-config.svelte.ts`, `rows/ApprovalAsk.svelte`, `rows/LintConfigRows.svelte`: `Palette.svelte` is 520 of 520 lines, so the `:eslint-config` list lives in partials; `ApprovalAsk.svelte` is the confirm `ChoiceRows.svelte` and `LintConfigRows.svelte` both ask (a copy in each is a clone `tests/checks/tree/duplication.test.ts` fails on). `palette-open.ts` gained `landOn`, moved out of `Palette.svelte`.
- `src/lib/views/sources/source/Source.svelte`: it composes the linters' facts for the status bar and palette actions.
- `tests/checks/config/config-folder.test.ts` (`behavior.yml` gains `lint`), `tests/checks/tree/boundaries.test.ts` (the shell's row gains `lint-model` and `lint-words`, `SHELL_STORES` gains `lint`), `tests/server/root/context-fixture.ts` (the context has two more members).
- `docs/window.md` and `DESIGN.md:185`: the status bar and layer table name linters.
- `tests/server/root/eslint-switch.test.ts` is a new file beside `config-cache.test.ts`: the brief allows a row in `config-cache.test.ts` or the context fixture; this file builds the real context with the dependencies the switch needs, which the fixture's context does not.

## Tests

New files, each failing on the unchanged tree (the base's `src`, `config`, `utils` with the final tests copied in, `$TMPDIR/d36r1/red`):

```
lint-route.test.ts    G1 (case 18), G2 (19, 24a link out), G7 (20, 24a spaces)
  Error: Cannot find module '../../../../../src/lib/server/machine/runs/lint/runs.ts' imported from .../tests/server/machine/runs/lint/lint-fixture.ts
  > tests/server/machine/runs/lint/lint-fixture.ts:10:1  > tests/server/machine/runs/lint/lint-route.test.ts:17:1
eslint-life.test.ts   G36 (7 rows)      > tests/server/machine/runs/lint/eslint-life.test.ts:19:1   (same error)
eslint-trust.test.ts  G55 (4 rows)      > tests/server/machine/runs/lint/eslint-trust.test.ts:17:1  (same error)
eslint-switch.test.ts G36 (1 row)       Error: Cannot find module '../../../src/lib/server/machine/runs/lint/eslint.ts'  > tests/server/root/eslint-switch.test.ts:25:1
```

Nothing was removed or broken to produce it: the module under test does not exist on that tree. Each file's head comment says what it does not cover.

Existing tests changed (failing line on the same red tree, `$TMPDIR/d36r1/red-out2.txt`, `Test Files  9 failed | 2 passed (11)`, `Tests  15 failed | 138 passed | 8 skipped (161)`):

| File | Change | Failing line on the unchanged tree |
|---|---|---|
| `settings.test.ts` (G13) | `describe 'lintSettings'` with 10 cases; eight `lint.*` defaults in `DEFAULTS` | `settings.test.ts:390:26`, `:405:11`, `:425:38` ... `AssertionError: expected { Object (threw) } to strictly equal { value: { on: { …(4) }, …(2) }, …(1) }`, 10 failed |
| `wrong-settings.ts` | a `lint:` block of eight wrong values | read by `config.test.ts` below |
| `config.test.ts` | `settingFindings` key list gains the eight `lint.*` keys | `config.test.ts:417:34 AssertionError: expected [ 'calendar.days_ahead', …(63) ] to deeply equal [ 'calendar.days_ahead', …(71) ]` |
| `config-folder.test.ts` | `'lint'` among `behavior.yml`'s keys | `config-folder.test.ts:335:44` and `:621:48` `expected [ 'agents', 'apps', …(112) ] to deeply equal [ ... …(113) ]` |
| `keys.test.ts` | four `COMPUTED_PREFIXES` entries and the imports | `keys.test.ts:422:37 TypeError: Cannot read properties of undefined (reading 'map')` |
| `approvals.test.ts` (G31) | `isLatexmkrcApproved(file, X)` becomes `isConfigApproved(file, 'latexmkrc', X)` | `approvals.test.ts:88:57 AssertionError: expected false to be true` |
| `boundaries.test.ts` | two rule lists widened | none: `Test Files  1 passed (1)  Tests  11 passed (11)` on the unchanged tree; it lets the new shell files pass |
| `context-fixture.ts` | the context gains `lintRuns`, `eslint` and closes them | none: a fixture |

The edited assertion lines are `approvals.test.ts:20`, `:88-91`, `:102`, `:135` (`isLatexmkrcApproved` to `isConfigApproved(file, 'latexmkrc', ...)`); no threshold, tolerance or predicate was loosened, and `DEFAULTS` gained keys with no value changed.

## Doc text for `agents/guarded.md` (lines as now: G1 7-9, G2 10-12, G7 25-27, G55 37-39, G36 65-67)

G1, line 8 (Code): add `; the lint route: `src/routes/api/(machine)/lint/+server.ts`, `src/lib/server/machine/runs/lint/routes.ts`` before the final full stop. Line 9 (Test): append `; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses a request without the write token and runs nothing (G1)'`.

G2, line 11 (Code): append `; the lint route: `src/lib/server/machine/runs/lint/routes.ts` (the file's path is resolved inside its root before any program starts)`. Line 12 (Test): append `; lint: `tests/server/machine/runs/lint/lint-route.test.ts`, 'refuses %s before any program starts (G2)' for a path that climbs out of the root, a root no list names, a folder and a file that is gone, and 'lints a link inside the root as its target and refuses a link that leads out (G2)'`.

G7, line 26 (Code): append `; `src/lib/server/machine/runs/lint/linters.ts`, `src/lib/server/machine/runs/lint/routes.ts``. Line 27 (Test): append `; linters: `tests/server/machine/runs/lint/lint-route.test.ts`, 'starts a program with %s as one argument and runs no shell (G7)' for a name holding a semicolon and a space and one holding a command substitution, and 'passes a root and a file path holding spaces, and the rc file beside the file, each as one argument (G7)'`.

G55, line 37 (text): replace "A language server, a LaTeX build's latexmk step and a weave tool" with "A language server, a linter, a LaTeX build's latexmk step and a weave tool". Line 38 (Code): insert `` `src/lib/server/machine/runs/lint/eslint.ts`, `src/lib/server/machine/runs/lint/routes.ts` (the ESLint child starts only under an approved `eslint-config:` text), `` before "and `src/lib/server/machine/approvals/approvals.ts`". Line 39 (Test): append `. `tests/server/machine/runs/lint/eslint-trust.test.ts`, describe 'the lint route before an ESLint configuration is approved': 'starts no child and imports nothing until the configuration is approved, then lints', 'asks again when the configuration text changes, ending the child', 'ends the child when the approval is taken back', 'asks for a nested configuration on its own, and its approval covers that folder alone'`.

G36, line 65 (text): append ` The ESLint oculus holds for a repository's configuration folder ends too: after 15 minutes without a lint, when no served root holds its folder, when the approval it started under changes or is taken back, when `lint.eslint` is switched off, and with the oculus server; a child that exits while a lint is in flight fails that lint, a child that does not answer within the time of a lint is ended and that lint answers `timeout`, and the next lint starts a new child.` Line 66 (Code): append `, `src/lib/server/machine/runs/lint/eslint.ts` (the held ESLint), `src/lib/server/machine/runs/lint/eslint-child.mjs`, `src/lib/server/root/context.ts` (the `built` hook that ends them)` before the final full stop. Line 67 (Test): append `. `tests/server/machine/runs/lint/eslint-life.test.ts`, describe 'the life of a held ESLint', one `it` per row: 'ends after 15 minutes without a lint and not a moment before'; 'keeps one child for the lints of a folder and restarts the idle wait at each'; 'ends when no served root holds its folder'; 'ends when the approval it started under is not the one in force'; 'ends with the server and starts no child afterwards'; 'answers failed for a lint in flight when the child exits, and starts a new child for the next'; 'ends a child that does not answer within the time of a lint, answers timeout and starts a new child for the next'. `tests/server/root/eslint-switch.test.ts`, 'ends every held ESLint child from the hook the portfolio watcher runs'`.

G31's Code line names `approvals.ts`; its test passes (7); its text is unchanged.

## Ids and keys

| Id or key | Run | Output |
|---|---|---|
| owners `lint-chktex`, `lint-ruff`, `lint-eslint`, `lint-shellcheck` | `grep -n 'return `lint-' src/lib/state/system/problem-sources.ts` | `:26 return `lint-${linter}`;` the only definition; `COMMAND_OWNER = 'command'` (`:21`) and `LATEX_OWNER = 'oculus-latex'` (`:22`) unchanged |
| approval kind `eslint-config:` | `grep -n "'eslint-config'" src/lib/server/machine/approvals/approvals.ts` | `:207 export type ConfigKind = 'svelte-config' \| 'latexmkrc' \| 'eslint-config';` the `svelte-config:`, `interpreter:` and `latexmkrc:` keys unchanged (`approvals.test.ts` 7, `latex-approvals.test.ts` 19, `svelte-trust.test.ts` 2 pass) |
| status item id `linter` | `grep -n` | `status-items.ts:59 'linter',`, `glyphs.yml:237 linter: "ln"`, `icons.yml:236 linter: list-checks` |
| route `/api/lint` | `ls "src/routes/api/(machine)"` | `debug hpc lines lint schedules usage` |
| `lint.*` keys | `grep -n "^lint:" -A9 config/behavior.yml` | `:186-194`: `chktex`, `ruff`, `eslint`, `shellcheck` true; `chktex_path`, `ruff_path`, `shellcheck_path` empty; `chktex_args: [-wall, -n22, -n30, -e16, -q]`; eight entries in `options.yml` from line 700 |
| palette list `:eslint-config` | `grep -n "eslint-config"` | `palette.ts:70`, `:377`; `palette-modes.ts:34` |
| palette commands | `grep -rn "oculus.lint" src` | `oculus.lint.rerun` (`lint-fixes.ts:409`, "Linters: Run Again"), `oculus.lint.fix_all.<id>` (`:416`, "{0}: Fix All Auto-fixable Problems"), `oculus.lint.documentation` (`:34`) |

## Judgment calls

1. The lint answer carries the SHA-256 of the bytes the rows were read from; the tab's `draft.base` is the same hash, so a fix is offered only for a clean tab whose text is the linted text.
2. A path outside the roots, a missing root or a folder answers 404, not 403: `postWithToken` retries a 403 after renewing the token.
3. The ESLint approval text is `[configuration folder real path, [[config file name, SHA-256 of its bytes]]]`, kept under `eslint-config:`; it covers the one `eslint.config.*` file ESLint is given, not the files it imports.
4. `eslint-child.mjs` resolves `eslint` from the repository's own folder with `createRequire`; a configuration folder without `node_modules/eslint` up to the root answers `no_config`.
5. The `lint:` words live in `config/text/views/sources/source.yml`, since `config/text/views/sources` is full (ten items).
6. `Palette.svelte` is at 520 lines, so the list is `lint-config.svelte.ts` plus `rows/LintConfigRows.svelte`; the shell's row and `SHELL_STORES` were widened rather than reading the lint store through `editorStatus`.
7. The lint run stops on the server with the same key as a new run (`LintRuns.begin`); `stop` is posted only for a file released with a run in flight.
8. A save marks its file so the reload that follows is not linted a second time; the mark ends when the runs the save started have answered.
9. `HeldEslints` takes an `exited(pid)` option beside the clock; `ContextDependencies` gains `createEslints` so the switch test builds the real context with that option.
10. ChkTeX gets `-q -I0 -f<format>` after the settings' own arguments and `-l <rc>` when an rc file is beside the file or in the root, unless the arguments hold `-l`.
11. Ruff runs with `--no-cache --force-exclude`, so it writes no `.ruff_cache` and honours the repository's excludes.
12. `Disable <rule> for the entire file` exists for ESLint only.
13. The documentation action and the code link open `row.href` in a new browser tab through the page's link opener, only for an `http:` or `https:` address with no user name or password (`webAddress`, 2048 characters at most).
14. Test titles and head comments name the guarded entry they belong to (`(G1)`, `(G2)`, `(G7)`, `(G36)`, `(G55)`). I read these as entry ids, which name a guarantee and not a package, session or date; the base tree has the same form once (`tests/state/system/lsp/edits.test.ts:4`, `(G8)`). If the spec's "package id" sentence covers them, they come out of nine lines.

## User-visible changes and the looks to take

State to put it in: the TEST workbench page, a source tab each of a `.py`, a `.tex`, an oculus `.ts` (under an approved configuration) and a `.sh` file of a served root; the Problems view; the status bar.

| Place | Before | After |
|---|---|---|
| `.py` tab with `import os` unused, saved | no marker | a warning marker over `os`, `F401`, source `Ruff`; Quick Fix "Remove unused import: `os`" and "Disable F401 for this line"; the right group of the status bar shows `Ruff` once ruff has answered |
| `.tex` tab with `See Fig. \ref{a}` | texlab's own markers only | ChkTeX warnings 12 and 2 over the space after `Fig.`, source `ChkTeX`; Quick Fix "Convert to non-breaking space (~)" |
| oculus `.ts` tab, ESLint configuration not approved | nothing | the item `ESLint: not approved` in the warning tone; pressing it opens `:eslint-config ` listing the configuration file and "Approve and run this repository's ESLint configuration"; the next lint draws the findings |
| `.sh` tab | nothing | `ShellCheck` item once it answered; the markers and the quick fixes of the cases above |
| a tab before its first answer, a restored tab with unsaved text, a tab of an unserved root, a switched-off linter | n/a | no linter item at all; "Linters: Run Again" is still in the tab's actions |
| Problems view | rows of servers, commands, LaTeX | also the linters' rows; the rule is a link and the row menu has Show Documentation only for an http or https page |
| Settings | no linter keys | a "Linting" section with the eight `lint.*` keys |
| Palette | no linter commands | `:eslint-config`, `Linters: Run Again`, `<Linter>: Fix All Auto-fixable Problems` (disabled while the tab holds unsaved text or the linter has no fix) |

The look on landing must also show: the same markers in a second editor of the same file; a changed text leaving the markers where they were until the save; an `info` row drawn as an Info marker and hidden by Show Infos off; Fix All as one undo step and disabled in a tab with unsaved text.

## Wrong or impossible in the brief

1. The brief puts the `:eslint-config` list in `ChoiceRows.svelte` beside `:svelte-config`; the approve row lives in `LintConfigRows.svelte` because the list is built from the lint store, and `ChoiceRows.svelte` changed only to use the shared `ApprovalAsk.svelte`.
2. "`lint-<id>` markers under the existing `command-marks.svelte.ts`": the file is renamed `problem-marks.svelte.ts` because it holds the commands' and the linters' markers.
3. The brief's path list omits the files `tests/checks` fail on without a change (`config-folder.test.ts`, `boundaries.test.ts`, the duplication clone, the layer rows); each is widened with its reason above.
4. This machine's ruff reports rules beyond the defaults (`I001` on a file with `import os` and one more line) from a configuration outside the scratch tree.
5. Ruling 3 says `lint-fixes.ts:415`, ruling 2 says `lint-fixes.ts:363`: the lines are now `:418-420` and `:365`.

## History words and prose

The spec's list (`agents/spec.md:42`): 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands', plus package ids and dates. `python3 -I $TMPDIR/d36r1/addedlines.py code` greps every added or changed comment line and test title in `src tests config docs` with `\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b|\b[A-Z][0-9]{1,3}[a-z]?\b|\b20[0-9]{2}-[0-9]{2}` (case-insensitive); 38 hits: `before` 20, `G2` 3, `G7` 2, `G36` 2, `G1` 2, `E501` 2, `I0` 2, `G55` 1, `F821` 1, `F8` 1, `F401` 1, `E902` 1. No hit for `used to`, `no longer`, `still`, `previously`, `as before`, `always`, `the step adds`, `after this package lands`, or a date. Each hit judged:
- `before`, order inside one sequence or one operation, not a comparison with an earlier state of the code (20): `hub-address.ts:2`, `program.ts:21`, `:24`, `:91`, `relay.ts:24`, `chktex-fixes.ts:18` (before a column), `routes.ts:13`, `:51`, `:102`, `runs.ts:2` ("the one before it" is the previous run), `ApprovalAsk.svelte:3`, `status-items.ts:12` (before the language item), `lint-answer.ts:1`, `lint-model.ts:4`, `lint-fixes.ts:89` (text before a character), `eslint-life.test.ts:74` ("not a moment before" the 15 minutes), `eslint-trust.test.ts:1` and `:39`, `lint-fixture.ts:238`, `lint-route.test.ts:53`.
- `G1`, `G2`, `G7`, `G36`, `G55`: guarded-entry ids, judgment call 14.
- `E501`, `F401`, `F821`, `E902`: ruff rule codes; `I0`: ChkTeX's `-I0` flag; `F8`: the F8 key.
Prose mode over the added or changed lines of `.md` and `.yml`: the added words are one `before` in `docs/files-and-search.md:95` ("after the language server's items and before the language", position on the bar); the other hits in changed lines are words already in those lines in the base (`diff` of counts: `DESIGN.md` 40 before, 9 no longer, 14 still in both; `files-and-search.md` 11 before in the base and 12 now).
Each new or changed sentence in `DESIGN.md:166`, `:575`, `docs/files-and-search.md:87-99`, `docs/window.md:82`, `docs/configuration.md:13`, `HELP.md:118` was read against `agents/spec.md`'s prose rules; no hit for hard wrapping (one line a paragraph), em dash, negation-contrast or history. `docs/files-and-search.md:95` says "one item for each linter that has answered for the source tab's file".

## The d.ts and doc judgments

Rewritten: `DESIGN.md` 23, 166, 185, 476, 575; `HELP.md:118`; `docs/views.md:81`; `docs/files-and-search.md` (the "Linters" section and the texlab sentence); `docs/configuration.md:13`; `docs/window.md:82`; `relay.ts:23-25`; the head comments of the files in the table above. Still true, read and unchanged: `DESIGN.md` Auth paragraph (the lint route is a token-guarded POST like the others) and the LaTeX build paragraph at 537 (the runner moved to `core/program.ts`, the build behaves the same).

## Commands outside the brief's allowance

- Two read-only git commands from the original build: one `git status` and one `git -C /nonexistent status`; neither read or changed a tree.
- `npm run test:quick` (inside `checks.sh`) reads git itself: its first line is `test:quick: 97 changed file(s), from git since HEAD`.
- `ls -la ~/.oculus` once this round (a directory listing; nothing was opened or read).
- `pkill -f nothing` once by mistake, on a pattern none of my processes carried; `pgrep -fl nothing` printed nothing afterwards, and every process started by me exited normally.
- Scratch under `$TMPDIR/d36r1` only: case scripts, `red`, `proof`, `proof0` trees, `kept-tests`; nothing inside the worktree outside `tools/oculus`, no `.scratch/` file edited.
