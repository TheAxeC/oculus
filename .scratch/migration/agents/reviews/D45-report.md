NOT done: (1) the case 5 bound of 200 ms per `rootOf` call is not met in four of five runs: in each, one call took 445, 217, 223.8 or 395.1 ms, and every other call took at most 128 ms (section "Case 5"); a plain read of fresh files stalls the same way, so the cause is the machine's first access to a fresh file and not the walk, but the bound as written is exceeded; (2) nothing was run on a page: the page cases (10, 12, 17 to 22, 26 and the page parts of 11 and 17) are checked by runs of the state modules and by reading, and the look L1 to L17 is the orchestrator's; (3) LaTeX Workshop's `unimathsymbols` completion and the image preview of `\includegraphics` completion are not built, since they lie outside the kinds the two D43 rows of Inventory 1 name (open item D45-2); (4) two tests of `tests/checks/config/integrity.test.ts` ("the real hub") fail in this worktree because it has no `deck/` folder, and were not run on main. Everything else in the brief is built and the checks below pass.

# D45 report: LaTeX as VS Code's LaTeX Workshop, the LaTeX view redone

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D45`, oculus at `tools/oculus`. Number of full-list runs of `checks.sh`: 4 (the last one after the last edit of any file).

## Open items of the state file, verbatim

- Z681 (2026-10-07, M8's /spec, a clash between a design rule and an automode ruling): `tools/oculus/DESIGN.md:24` says "Not a rewrite of the data. The YAML in the hub is the source of truth and its shape does not change for oculus." Z672, which the orchestrator closed in automode, changes the hub's YAML for M8 (the hub's YAML checked and completed in the editor): it renames `options_from` to `from` in the `schema:` blocks of 16 hub files, adds `when:` conditions and new `schema:` blocks (career, literature radar), and changes values in the data itself (`access: public` to `open`, new venue categories, a new event role). A clash between a written design rule and a ruling is Axel's, so M8 waits. Options: (a) recommended: the sentence is reworded so that the hub's `schema:` blocks, which describe the data, may change to serve the editor's checks, while the records themselves keep their shape and change only where a value breaks its own rule (the Z468 departures); Z672 stands. Pro: one name for one thing across every schema, and the editor and the Findings view check the same declarations. Con: 16 hub files and the cockpit's two readers (`tools/cockpit/src/cockpit/selftest.py:595-621`, `page.py:706-709`) change. (b) the sentence stands and the hub's YAML keeps its keys: oculus reads `options_from` and `from` as two spellings of one key, and only the data departures are settled. Pro: no hub file's keys change. Con: three names for one thing stay, which Z672 called the lazy option. (c) the sentence stands strictly: no hub file changes at all, the data departures included, and M8 only reads. Pro: the hub untouched. Con: the Z468 departures stay as findings forever. The lazy option is (b).

## Open items raised by this step

- D45-1, overlap of texlab and D45 on one hover. texlab's hover kinds are Citation, Package, Command, EntryType, FieldType, Label and StringRef (`HoverData`, texlab `hover` crate). On a `\ref`-family command texlab's Label hover gives the label's rendered text; D45 gives the number the build assigned, the typeset block the label points at and a View on PDF button. On a `\usepackage` name texlab's Package hover gives the package's description; D45 gives a View documentation button that runs texdoc. Once D43 registers texlab beside the LaTeX extension, Monaco lists both hovers at one position. Options: (a) recommended: keep both, because they say different things (text and description against number, typeset block and buttons) and nothing LaTeX Workshop shows is lost; the cost is two hover sections at a `\ref`. (b) D43 drops texlab's Label and Package hovers when the LaTeX extension is registered; the cost is the lost package description and a rule in D43 that has to know D45's kinds. The cheaper option is (b), and it is the worse one, so (a) is recommended on merit.
- D45-2, two LaTeX Workshop completion extras are not built. `latex-workshop.intellisense.unimathsymbols.enabled` defaults to false and `latex-workshop.intellisense.includegraphics.preview.enabled` defaults to true (both read from LaTeX Workshop's `package.json`). Neither is a kind in the two D43 rows of Inventory 1 (hover: `\ref` with number, `\cite`, command signature; completion: commands, environments, packages, classes, paths, labels, citations, colours), which is what item 22 covers. Options: (a) recommended: book the `\includegraphics` image preview as a step after D43, since it rides on the `File` completion item texlab produces and the setting is on by default, and leave `unimathsymbols` unbuilt because its setting is off by default; (b) build neither. The cheaper option is (b); it leaves a default-on LaTeX Workshop feature missing, so it is the lazy one.
- D45-3, `tests/checks/tree/boundaries.test.ts` is edited (the brief's path list allows it "only if a new module needs its layer named"). Added: the layer lists name `data/helpers/files/address`, `data/prose/bib` and `data/sources/config/catalog/latex-tables`; the shell's allowed imports gain `state/sessions/latex/latex-state`, `state/shared/words/format` and `data/prose/latex` (the status bar's LaTeX item reads the build and the root of the file in front); the port list gains `latex`, `latexActions`, `float` and `windows` (the same pattern as the existing `documents`). The first three are new modules naming their layer. The last two groups let the shell read state it could not read before, so they widen a rule and are yours to rule on. Options: (a) recommended: keep the widening, since the status item has to read the build and the root and `documents` already sets that pattern; (b) pass the status item the values through the workbench and keep the lists as they were, which moves the reads into one more indirection without removing them. The cheaper option is (a); it is also the better one on merit, so the recommendation is not taken for its cost.

## First run on the unchanged tree, then the result on the final tree, case by case

The first run was made before any code changed, on the unchanged worktree and on `$TMPDIR/d45-basecopy` (the base copy with `node_modules` linked). The probe files are in the scratchpad: `probe-root.ts`, `probe-root-new.ts`, `probe-d45-baseroot.ts`, `probe-d45-line.ts`, `probe-d45-endpoint.ts`, `probe-d45-out.ts`, `probe-d45-log.ts`, `probe-d45-deps.ts`, `probe-case24.ts`, `probe-case27.ts`, `probe-case28.ts`, `probe-addr.ts`, `probe-closure.ts`, `kill.mjs`. The guarded tests' first runs are `first-g35.out` and `first-settings.out` in `scratchpad/d45-builder/`.

1. Root, magic. First run: the magic comment and the trailing-space comment two folders up answer `main.tex` and `thesis.tex`; outside the root, missing, `.md` and a cycle answer null; the base answer has no `how` field. Final tree (`node probe-d45-rootfinal.ts`): `how: magic` for both; null for outside, missing, md and cycle.
2. Root, self. First run: `fig.tex` and `figs/fig-concept.tex` answer themselves, no `how`. Final tree: `how: self` for both.
3. Root, included. First run: `introduction.tex`, `body.tex`, `body_2col.tex` and the class-macro chapter with an `.fls` all answer null (fail); the class-macro chapter without an `.fls` answers null (as the brief expects); the `.bib` answers `main.tex` only through the folder rule. Final tree: `main.tex`, `main.tex`, `main_2col.tex` and `thesis.tex` with `how: included`; no `.fls` answers null; the `.bib` answers `main.tex` with `how: included`.
4. Root, folder. First run passes, no `how`. Final tree: `how: folder` for one main; null for two.
5. Root walk cost. See "Case 5" below.
6. Build line. First run: `terminal-actions.test.ts` 7 of 18 fail, the first as `expected 'latexmk' '-synctex=1' '-interaction=nonstopmode' '-file-line-error' '-pdf' '-outdir=<dir>' '-auxdir=<dir>' '<dir>/main'` and `received latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'`. Final tree (`node probe-d45-line.ts <worktree> <dir>`):
   - default: `'latexmk' '-synctex=1' '-interaction=nonstopmode' '-file-line-error' '-pdf' '-outdir=/hub/d' '-auxdir=/hub/d' '/hub/d/main'`
   - `% !TEX program = xelatex`: recipe `latexmk (xelatex)`, the same line with `'-xelatex'` in place of `'-pdf'`
   - `% !LW recipe = pdflatex -> bibtex -> pdflatex * 2`: four commands joined by `&&`, `'pdflatex' ... && 'bibtex' 'main' && 'pdflatex' ... && 'pdflatex' ...`
   - a main named `my thesis's.tex` in a folder `sp ace`: the word is `'<dir>/my thesis'"'"'s'`, and running that line with `latexmk` wrote `my thesis's.pdf` and `my thesis's.synctex.gz` (the document had an undefined command, so exit 12 as expected).
   - an unknown recipe: `{"refused":"latex-recipe","names":["nope"]}`; force: `'-g'` first in the latexmk arguments.
7. No TeX installed. First run: `grep -rIn "onPath\|programFound\|X_OK\|accessSync" src/lib/server/machine/pty` in the base prints nothing, so the base starts the terminal and the shell reports `command not found`. Final tree: with no `latexmk` the route answers 400 `{"error":"latex-program","names":["latexmk","texlive","latexmk"]}` and the terminal list holds 0 terminals (a probe over the route with a PATH that holds no `latexmk`).
8. Engine missing. First run: as case 7. Final tree: `planOf` with `xelatex` not found answers `{"refused":"latex-program","names":["xelatex","texlive","xetex"]}` (`probe-d45-line.ts`); the route probe with a PATH that holds no `xelatex` answers `names` `["xelatex","texlive","xetex"]` and starts 0 terminals.
9. A build that never ends. First run: base `LATEX_STEPS = ['build', 'clean']` (`pty/routes.ts:90`), so no stop and no `-g`; an interrupt to the process group of `latexmk` ended `perl` and `pdflatex` in 76 ms with exit 12 (`kill.mjs`); without `-g` latexmk answered "Nothing to do", with `-g` it ran. Final tree: `pty/latex.ts:204` `stopBuild`, `:235-244` clean refusal while building, `:250-258` a kept running terminal answers the running build; `recipes.ts:207` adds `-g` for latexmk tools only when forced; `builds.ts` forces on `ask.retry`, after `failed` and after `stopped`; G35 tests "stops the build terminal of the main and no other terminal", "makes latexmk build again with -g when the page says so" and "refuses a clean while the main builds, and runs it once the build ended" pass.
10. A save during a build. First run: not run (page case). Final tree (a probe over the real `builds.ts` with stubbed dependencies): after the first save 1 build and status building; after five more saves still 1 build started; after the first ended 2 builds and status building with `building()` true; after the second ended status succeeded and `building()` false.
11. `on_file_change`. First run: the base catalog entry reads `default: on_save` and `values: [on_save, never]` (`config/catalogs/options.yml:531-533` of the base), so a write from outside the editor builds nothing. Final tree (same probe): baseline 0 builds; ten notices and one changed file give 1 build; more changes while it runs give 1, then 2 after it ended; unchanged times and an unfollowed root give no build; a write inside the 2000 ms quiet window after the editor's own save gives no build; `dependenciesOf` on the probe project lists `chap/one.tex` and `main.tex` and not `main.aux` or the PDF.
12. The PDF open while rebuilt. First run: not run (page case). Final tree, by reading: `viewer.svelte.ts:200-212` `open()` keeps the position when the key is the same; `viewer.svelte.ts:422-428` keeps a drawn document when its replacement cannot be read and drops it only when the file is gone; `File.svelte:262-264` calls `viewer.open(src, key)`.
13. An empty document. First run: exit 12, no PDF, `main.log:64:No pages of output.`; the base has no rule for it (`grep -rIn "No pages" src` in the base prints nothing). Final tree: `server/content/latex.ts:212` `NO_PAGES` and `:300`; `parseLog` and `buildStateIn` give the problem "No pages of output." with `pdf: null` (`probe-d45-log.ts`).
14. Forward search. First run: `synctex view -i 3:1:<abs chap/one.tex> -o <abs main.pdf>` gave page 1, x 150.926254, y 156.585541; line 99 gave 2 records; the base endpoint has no forward action. Final tree (`probe-d45-endpoint.ts`, POST `/api/latex` `forward`): the same page 1, x 150.926254, y 156.585541; line 99 gives 2 places; a file not in the build gives `places: []`; a copy with no `.synctex.gz` gives 404 `synctex-no-file`.
15. Inverse search. First run: `synctex edit -o 1:151:157:<pdf>` gave `./chap/one.tex`, Line 3, Column -1; names with a space and a colon worked; a copy that was not rebuilt answered the original folder's file. Final tree: `inverse` `1:151:157` gives `chap/one.tex` line 3 with no column; the stale copy gives 403 `synctex-outside`.
16. Output folder. First run: `-outdir=out` built and `synctex` worked against `out/main.pdf`; `latexmk -c` kept the PDF and the `.synctex.gz`; the base has no `out_dir` (`grep -rIl "outdir\|outDir\|out_dir" src/lib/server` in the base prints nothing). Final tree: a build under `out/` is found by forward and inverse search; `out_dir` or `aux_dir` set to `../../x` answers `latex-folder` naming `latex.out_dir` or `latex.aux_dir`.
17. A `.tex` in a folder added to the workspace that is not a project. First run: not run (page case). Final tree, by reading: `latex-tab.svelte.ts:102-106` `applies` tests the language by name, `onDisk`, root and path and never a project; `Source.svelte:244` passes `language: () => language`.
18. A file over the paint limit. First run: not run (page case). Final tree, by reading: `applies` takes the language by name, so a file drawn as plaintext keeps the bar, keys, build, View PDF and SyncTeX; the kit registers providers under the language a model is drawn in (`language/lsp.ts:15-17`), so hover, completion and section D, which are registered through it, are off for that file.
19. Clean while building. First run: not run (page case). Final tree: the G35 test "refuses a clean while the main builds, and runs it once the build ended" passes; the route refusal is `latex-building` (`pty/latex.ts:241-243`); the words are `refused_building` in `config/text/views/academic/latex.yml:115`.
20. Two browser tabs on one root. First run: not run (page case). Final tree, by reading: `pty/latex.ts:250-258` answers a running kept terminal as it is, so two tabs never start two `latexmk` in one folder; each tab's `builds.ts` coalesces polls through `entry.polling` and `entry.again`.
21. A saved `latex` tab `{ root, path, label }`. First run: not run (page case). Final tree, by reading: `tex-root.svelte.ts:83-90` `mainOfPin` takes the first main of the folder when the pin names none.
22. A request answered after its view or tab closed. First run: not run (page case). Final tree (`actions.ts` driven by a probe): a later forward search answered first and then the earlier one gives one `openBeside` and `revealFor` page 9; an asker that closed before the answer gives no effect; an inverse search with the PDF tab closed gives no effect; an inverse search with the PDF tab open calls `openAway` on the source page with `avoid` the PDF tab; `takeRoot` (`views/shared/latex/root-answer.ts`) makes an earlier root answer change nothing.
23. texdoc. First run: the base endpoint has no `texdoc` action. Final tree: `texdocName` accepts `amsmath` and `pgf-tikz` and refuses `a;b`, `../x`, the empty name, `a b` and `--help`; the route answers 400 `texdoc-name` for `a;b`, `../x` and the empty name; a stub `texdoc` on PATH logged its arguments as `-I amsmath` (a list of arguments, no shell).
24. New settings. First run: `first-settings.out` shows 17 of 81 tests failing across `config.test.ts` ("settingFindings") and `settings.test.ts` (15 `latexBuild` tests and "reads the auto build by its entry"). Final tree: duplicated recipe or tool names keep the first row and give the finding `latex.recipes:repeat` or `latex.tools:repeat`; an empty name gives `unnamed`; a missing tool or no tools gives a `choice` problem; wrong words give `choice` problems naming `latex.recipe_default` and `latex.auto_clean`; the two tests files pass (see Verify, item 5).
25. File address. First run: `fileUrl` and `fileAddress` both gave `/api/file/hub/my%20dir/a%20b%23c/d.tex` (`probe-addr.ts`). Final tree: one helper, `data/helpers/files/address.ts:11` `fileBytesUrl`, gives the same address; `grep -rIn --exclude=local.yml -E "fileUrl\b|file-url|sourceFileUrl|fileAddress" src tests config docs HELP.md DESIGN.md | wc -l` prints 0.
26. A PDF's ways to open. First run: not run (page case); the base has `menu_open_browser: Open in Browser Tab` (`config/text/views/sources/files.yml:107`) and no float jump. Final tree: `File.svelte:274-282` lists Open in New Tab, Open in New Window, Open in Browser and, where the open map has an application for the file, Open in Program; the socket test `jump` passes 3 tests (sent once with the write token, nothing with no token or a wrong shape, no replay); `actions.ts:262-263` sends the jump from a float and `:272-283` a main page opens the source on it; `browser-windows.svelte.ts:21` `HEARTBEAT = 1000` and `:24` `SILENT = 3500`.
27. A LaTeX tab served by a language server. First run (`probe-case27.ts` on the base copy): `language=latex version=false served=true` gives `["add served","dispose served"]`, so the LaTeX extension is dropped. Final tree: `language=latex served=true` gives `["add latex","add served","dispose latex","dispose served"]`.
28. `.pdf` in Open in Program. First run (`probe-case28.ts` on the base copy): `.pdf -> undefined`. Final tree: `.pdf -> com.apple.Preview`, findings 0 (`config/behavior.yml:233`).

## Case 5, root walk times

Brief bound: at most 200 ms per call. Each run builds the probe folders fresh and then calls `rootOf` for every case and every look file once.

- First run on the unchanged tree: `3 body` 178.2 ms, every other call at most 2.7 ms.
- Final tree, five runs: run 1 L3 93.7 ms; run 2 "1 magic trailing space" 445 ms and "3 included" 127.8 ms; run 3 "1 outside" 217 ms; run 4 "4 folder one main" 223.8 ms with every other call at most 7.2 ms; run 5 "1 magic" 395.1 ms and "3 class macro with fls" 80.0 ms. The warm maximum is 19 ms.
- Look files, run 5 (`$TMPDIR/d45-probes/case5-run5.txt`): L1 2.8 ms, L3 12.4 ms, L4 1.3 ms, L5 `body.tex` 4.9 ms, L5 `body_2col.tex` 3.3 ms, L6 0.6 ms, L7 3.2 ms, L8 0.5 ms.
- Control: 400 fresh files read with `statSync` and `readFileSync` and nothing else stall the same way, with a maximum of 254, 247 and 152 ms in three runs and 1.9 ms in a fourth. The stall is the machine's first access to a freshly written file, so the walk is not its cause; the bound is not met in four of five runs because of it.
- The walk never reads above the served root: `fileInside` (`root.ts:59-62`) tests `inside(real, bound)` before any file is read and `foldersUp` stops at the bound.

Look files on the unchanged `root.ts`: L1 `main.tex`, L3 null, L4 `thesis.tex`, L5 `body.tex` and `body_2col.tex` null, L6 `main.tex`, L7 null, L8 `main.tex`. On the final tree: L1 self, L3 `main.tex` included, L4 `thesis.tex` magic, L5 `main.tex` and `main_2col.tex` included, L6 self, L7 `figs/test-figs.tex` included, L8 self.

## DONE / NOT DONE

"Built" means the code is on the tree and the checks below pass. "By reading" marks a behaviour that needs a page; the lines that carry it are named.

| Item | State | Where it is and what proves it |
| --- | --- | --- |
| 1 Root detection | Built, run | `server/content/latex/root.ts:289` `rootOf`; cases 1 to 4 and the look files run |
| 2 Recipes and tools | Built, run | `recipes.ts:158` `chooseRecipe`, `:272` `planOf`; G35 tests; case 6 |
| 3 Output and auxiliary folders | Built, run | `recipes.ts:125` `foldersOf`; case 16; `../../x` refused |
| 4 A build that can be stopped | Built, test | `pty/latex.ts:204` `stopBuild`; G35 test of `stop` |
| 5 Clean and retry, auto clean | Built, by reading | `builds.ts:332` `cleanBeforeRetry`, `:281` `autoClean` |
| 6 Auto build | Built, run | `builds.ts:510` `schedule`, `:524` `poll`; cases 10 and 11 |
| 7 Saving before a build | Built, by reading | `builds.ts:411`: `if (ask.reader && ask.retry !== true) await deps.saveAll();` |
| 8 Build state for the page | Built, by reading | `state/sessions/latex/latex-state.ts`, `latex.svelte.ts` |
| 9 Literate sources | Built, by reading | `recipes.ts:37` `LITERATE_RECIPES`; `config/sources.yml:110` lists `.rnw`, `.jnw` and `.pnw` in `latex`; `find projects -maxdepth 6` for those three extensions prints nothing, so no real file exercises it |
| 10 The PDF.js viewer | Built, by reading | `views/sources/file/pdf/viewer.svelte.ts:103` `PdfViewer`, `Controls.svelte`, `side-panel.ts`, `viewer.css`; `package.json` `"pdfjs-dist": "6.4.299"` |
| 11 Opened beside, refreshed in place | Built, by reading | `File.svelte:262-264`, `viewer.svelte.ts:200-212` |
| 12 SyncTeX | Built, run | `server/content/latex/synctex.ts:108` `forward`, `:121` `inverse`, `:138` `placedIn`; cases 14 to 16 |
| 13 Forward search | Built, run | `state/sessions/latex/actions.ts:208`; cases 14 and 22 |
| 14 Inverse search | Built, run | `actions.ts:245`; cases 15, 22 and 26 |
| 15 A PDF's ways to open | Built, by reading | `File.svelte:274-282`, `shell/browser-windows.svelte.ts`; socket test passes |
| 16 Breadcrumb bar controls | Built, by reading | `views/sources/source/latex/LatexButtons.svelte`, `actions/BarActions.svelte`; `bar-actions.test.ts` passes |
| 17 Editor actions and keys | Built, by reading | `latex-tab.svelte.ts:348-353` and the rest of its `add(...)` list; `shell/keys/keys.ts:57,200` Cmd+Alt+X |
| 18 The TeX view | Built, by reading | `views/academic/latex/Latex.svelte:7,11` `id: 'latex'`, `order: 5`; `Commands.svelte`, `Problems.svelte`, `Structure.svelte`, `Symbols.svelte`, `tex-root.svelte.ts` |
| 19 Status bar item | Built, by reading | `shell/status/LatexItem.svelte`, `status-items.ts:40` `'latex'` last of `LEFT_ITEMS` |
| 20 Failure notice | Built, by reading | `builds.ts:263` `noticeFailure`, called at `:318` |
| 21 Markers and problems | Built, run | `latex.svelte.ts:454` `latexDiagnostics`; `server/content/latex.ts:212` `NO_PAGES`; case 13 |
| 22 Hover and completion kinds texlab does not give | Built in part | built: `\ref`-family hover, `\usepackage` hover, `\envname` completion, sub and superscript completion (`kit/latex/references.ts`, `latex-suggest.ts`, `latex-widget.ts`, `latex-editing.ts`); not built: the two extras of open item D45-2 |
| 23 Paint limit | Built, by reading | `latex-tab.svelte.ts:102-106`; `tab-language.svelte.ts` |
| 24 Section D providers beside a served extension | Built, run | `kit/latex/latex-editing.ts` and `kit/latex/editing/` (`edit.ts`, `environments.ts`, `pairs.ts`, `sectioning.ts`, `selection.ts`, `shortcuts.ts`); case 27 |
| 25 Math Symbols and Math Preview | Built, by reading | `views/academic/latex/Symbols.svelte`, `views/academic/math-preview/MathPreview.svelte` |
| 26 Citation browser and BibTeX | Built, by reading | `data/prose/bib.ts:162` `lazyRewrites`, `server/content/latex/bib.ts`, `endpoint.ts` action `format` |
| 27 texdoc | Built, run | `server/content/latex/texdoc.ts:20` `texdocName`, `:25` `texdoc`, `:34` `packagesOf`; `endpoint.ts:124`; case 23 |
| 28 Reveal Output Folder | Built, by reading | `actions.ts:330` `revealOutput`; `latex-tab.svelte.ts:351-353` |
| 29 One file address | Built, run | `data/helpers/files/address.ts:11` `fileBytesUrl`; the grep of case 25 prints 0 |
| 30 Removed surfaces | Built, run | `grep -rIn --exclude=local.yml -E "ROW_LATEX|menu_latex|autoBuildShape|Open in Browser Tab" ... | wc -l` prints 0; the three removed files are listed below |
| 31 Settings and their readers | Built, test | `data/sources/config/settings.ts:700` `latexBuild`; `config/catalogs/options.yml:527-533`; G13 tests pass; case 24 |
| 32 Docs | Built, by reading | the marks in "Text and head comments" below |

### The verify list, item by item

1. `npm run diagrams` exited 0 (`$TMPDIR/d45-probes/diagrams-final.txt`), then `checks.sh` printed the output below, last line `checks: 1 commands passed`, exit 0. Full-list runs: 4. Run 4 is the last, made after the last edit of any file, and its output is quoted below. `npm run diagrams` ran right before each of the four.
2. Tests run by name while working were the files covering the change. `npx vitest run tests/checks` (the tree checks, which `test:quick` does not run) was run twice after the last code edit, the second time with `--testTimeout 600000 --hookTimeout 600000`: `Test Files  1 failed | 16 passed (17)`, `Tests  2 failed | 241 passed (243)`, the 2 failures being "validates with no findings" and "reads the portfolio deck with every named deck found" of `tests/checks/config/integrity.test.ts` ("the real hub"), whose message is `deck folder deck is not in /Users/axelfaes/workspace/research-hub/.agents/worktrees/D45` (`ls -d deck` in the worktree: no such file). Run at the default 5000 ms timeout, `tests/checks/diagrams/diagrams.test.ts` has 3 tests that time out here (`Test timed out in 5000ms`, Graphviz drawing 120 s in all); with the long timeout they pass.
3. Limits: a walk over every `.ts`, `.svelte`, `.css` and `.js` file under `src` against 880 lines and 520 for components finds one file over, `src/lib/views/structure/map/Graph.svelte` at 524, which `cmp` shows identical to the base. Largest changed source file `src/lib/server/root/context.ts` 879; largest changed component `src/lib/views/sources/source/Source.svelte` 519; `src/lib/state/workbench/layout.svelte.ts` 840; `src/lib/state/sessions/terminals.svelte.ts` 839. `sh utils/folder-check.sh` exits 0. `sh utils/unused-exports.sh` prints 1067 names against the base's 1077; a comparison by file and name finds no name that the base's `unused-exports.txt` lacks.
4. The ASCII gate of `agents/spec.md:97`, run as written (`LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)`), prints 0 lines (`| wc -l`); `bin`, which its `find` list names, does not exist in this tree (`ls bin`: No such file or directory). A byte scan of `docs/*.md`, `HELP.md` and `DESIGN.md` for anything outside `\x20-\x7E` prints nothing.
5. Guarded tests on the unchanged tree: `terminal-actions.test.ts` (G35) `Tests  7 failed | 11 passed (18)`, the 7 being "builds one main file with latexmk in the manuscript folder", "builds again in the terminal it kept, and cleans in another", "runs the recipe asked for as one line of its tools joined by &&", "makes latexmk build again with -g when the page says so", "stops the build terminal of the main and no other terminal", "refuses a clean while the main builds, and runs it once the build ended" and "checks the citations of a main file with checkcites in a terminal of its own"; `settings.test.ts` and `config.test.ts` (G13) `Tests  17 failed | 64 passed (81)`, the 17 being "words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files", "reads the auto build by its entry" and 15 `latexBuild` cases. After the change `npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/data/sources/config/settings.test.ts tests/checks/config/config.test.ts` prints `Test Files  3 passed (3)`, `Tests  99 passed (99)`. The preserved behaviours pass: `npx vitest run tests/routes/sessions tests/views/sources/bar-actions.test.ts tests/checks/config/config-folder.test.ts tests/server/machine/runs/schedules/run.test.ts tests/server/machine/runs/commands/run.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts tests/data/sources/config/settings.test.ts tests/checks/config/config.test.ts` prints `Test Files  7 passed (7)`, `Tests  121 passed (121)`. No test was written for a case that is not under G35 or G13.
6. Each case's run or reading: the section above.
7. `grep -rIn --exclude=local.yml -E "fileUrl\b|file-url|sourceFileUrl|fileAddress|ROW_LATEX|menu_latex|autoBuildShape|Open in Browser Tab" src tests config docs HELP.md DESIGN.md | wc -l` prints 0 (the brief allows the one helper's own name; none appears).
8. A pass over the comment lines and test titles that are not in the base, over every changed or new file, for history words (`previously`, `formerly`, `used to`, `no longer`, `earlier`, `originally`, `revert`, `legacy`, `the old`, `renamed`, `migrat`, `workaround`, `hack`, step ids, `bug`, `regress`, `temporary`, `for now`, `TODO`, `now`, `replace`) returned 28 lines, each read; all state present behaviour. One phrase named a former view and is reworded: `docs/views.md:75` now reads "A saved `latex` tab that names a folder and no main file opens on the first main file of that folder."

`checks.sh`, run 4, verbatim:

```
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 175 changed file(s), from git since HEAD
test:quick: 105 test file(s), 10 essential
        tests/data/sources/config/settings.test.ts: changed
        tests/routes/sessions/latex.test.ts: changed
        tests/routes/sessions/terminal-actions.test.ts: changed
        tests/server/machine/hpc/actions.test.ts: named for a changed file
        tests/data/helpers/files/nesting.test.ts: imports at depth 1
        tests/data/snapshot/cluster-folder.test.ts: imports at depth 1
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/career.test.ts: imports at depth 1
        tests/data/sources/collections.test.ts: imports at depth 1
        tests/data/sources/config/catalog/options.test.ts: imports at depth 1
        tests/data/sources/config/languages.test.ts: imports at depth 1
        tests/data/sources/config/local.test.ts: imports at depth 1
        tests/data/sources/config/rail.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/data/sources/present.test.ts: imports at depth 1
        tests/data/sources/registries.test.ts: imports at depth 1
        tests/routes/docs/deck.test.ts: imports at depth 1
        tests/routes/edit/audit-mute.test.ts: imports at depth 1
        tests/routes/files/project-files.test.ts: imports at depth 1
        tests/routes/machine/commands.test.ts: imports at depth 1
        tests/routes/sessions/compose.test.ts: imports at depth 1
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 1
        tests/routes/sessions/terminal.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/core/git-failure.test.ts: imports at depth 1
        tests/server/edit/config-key.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/machine/apps/manifest.test.ts: imports at depth 1
        tests/server/machine/hpc/submit.test.ts: imports at depth 1
        tests/server/machine/lsp/choices.test.ts: imports at depth 1
        tests/server/machine/lsp/relay.test.ts: imports at depth 1
        tests/server/machine/pty/channel.test.ts: imports at depth 1
        tests/server/machine/pty/sessions.test.ts: imports at depth 1
        tests/server/machine/runs/commands/placeholders.test.ts: imports at depth 1
        tests/server/machine/runs/commands/run.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/file.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/record.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/run.test.ts: imports at depth 1
        tests/server/machine/runs/schedules/watch.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/feeds/literature-merge.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/state/sessions/source.test.ts: imports at depth 1
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 1
        tests/state/system/apps/methods.test.ts: imports at depth 1
        tests/state/system/apps/store-cache.test.ts: imports at depth 1
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 1
        tests/state/workbench/navigation/pages.test.ts: imports at depth 1
        tests/views/shared/explorer/opening-apps.test.ts: imports at depth 1
        tests/views/sources/bar-actions.test.ts: imports at depth 1
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/routes/apps/app-files.test.ts: imports at depth 2
        tests/routes/apps/app-open.test.ts: imports at depth 2
        tests/routes/apps/app-store.test.ts: imports at depth 2
        tests/routes/apps/approve.test.ts: imports at depth 2
        tests/routes/docs/literature.test.ts: imports at depth 2
        tests/routes/docs/memories.test.ts: imports at depth 2
        tests/routes/edit/app-gate.test.ts: imports at depth 2
        tests/routes/edit/deck-slides.test.ts: imports at depth 2
        tests/routes/edit/rail.test.ts: imports at depth 2
        tests/routes/edit/roots.test.ts: imports at depth 2
        tests/routes/edit/undo/undo.test.ts: imports at depth 2
        tests/routes/files/file-undo.test.ts: imports at depth 2
        tests/routes/files/file.test.ts: imports at depth 2
        tests/routes/files/fs.test.ts: imports at depth 2
        tests/routes/files/history.test.ts: imports at depth 2
        tests/routes/files/open.test.ts: imports at depth 2
        tests/routes/files/search.test.ts: imports at depth 2
        tests/routes/files/source.test.ts: imports at depth 2
        tests/routes/git/deposit.test.ts: imports at depth 2
        tests/routes/machine/hpc.test.ts: imports at depth 2
        tests/routes/machine/schedules.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/core/changes.test.ts: imports at depth 2
        tests/server/edit/app-store.test.ts: imports at depth 2
        tests/server/edit/deck-acts.test.ts: imports at depth 2
        tests/server/edit/writes-collection.test.ts: imports at depth 2
        tests/server/files/search.test.ts: imports at depth 2
        tests/server/machine/approvals/approvals.test.ts: imports at depth 2
        tests/server/machine/lsp/cpp-file.test.ts: imports at depth 2
        tests/server/machine/lsp/library.test.ts: imports at depth 2
        tests/server/machine/lsp/lifetime.test.ts: imports at depth 2
        tests/server/machine/lsp/servers.test.ts: imports at depth 2
        tests/server/machine/usage/refresh.test.ts: imports at depth 2
        tests/server/sessions/transcripts.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-saved.test.ts: imports at depth 2
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks
        tests/checks/config/config.test.ts: changed, run by npm run test:checks
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.9 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      eslint (1.8 s)
ok      svelte-check (5.6 s): 1791349807265 COMPLETED 414 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.4 s): Duration  15.18s (transform 13.98s, setup 0ms, import 25.80s, tests 32.22s, environment 93ms)
test:quick: 19.0 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```

## Item 22, the texlab kinds

Read from texlab's source, which names the kinds exactly: `CompletionItemData` at `$TMPDIR/texlab-completion-lib.rs:46-64` and `HoverData` at `$TMPDIR/texlab-hover-lib.rs:29-37`.

- Hover kinds texlab gives (7): Citation, Package, Command, EntryType, FieldType, Label, StringRef.
- Completion kinds texlab gives (17): Command, CommandLikeDelimiter, BeginEnvironment, Citation, Environment, GlossaryEntry, Label, Color, ColorModel, File, Directory, Argument, Package, DocumentClass, EntryType, Field, TikzLibrary.
- Against the two D43 rows: `\cite` hover is Citation; command signature is Command; `\ref` hover is Label, which gives the label's rendered text. Commands, environments, packages, classes, paths, labels, citations and colours are Command, Environment and BeginEnvironment, Package, DocumentClass, File and Directory, Label, Citation, Color and ColorModel.
- Built by D45 because texlab does not give them: the `\ref`-family hover with the build's number, the typeset block and a View on PDF button; the `\usepackage` hover with a View documentation button (texdoc); `\envname` completion (53 environment rows); sub and superscript completion.
- Not built, outside the two rows: `unimathsymbols` completion and the `\includegraphics` image preview (open item D45-2).

## Files, with line counts

The first number is the line count of the file now. NEW 49, CHANGED 123, REMOVED 3 (`ls` and `wc -l` over the difference of the tree against `D45-base`).

```
NEW 49
 1464 config/catalogs/latex.yml
   10 config/text/views/academic/math-preview.yml
   18 src/lib/data/helpers/files/address.ts
  180 src/lib/data/prose/bib.ts
   23 src/lib/data/sources/config/catalog/latex-editing.ts
  133 src/lib/data/sources/config/catalog/latex-tables.ts
   53 src/lib/server/content/latex/bib.ts
   56 src/lib/server/content/latex/pdfjs-assets.ts
  291 src/lib/server/content/latex/recipes.ts
  142 src/lib/server/content/latex/synctex.ts
   48 src/lib/server/content/latex/texdoc.ts
  266 src/lib/server/machine/pty/latex.ts
   70 src/lib/shell/browser-windows.svelte.ts
  103 src/lib/shell/status/LatexItem.svelte
  375 src/lib/state/sessions/latex/actions.ts
  615 src/lib/state/sessions/latex/builds.ts
  206 src/lib/state/sessions/latex/calls.ts
  409 src/lib/state/sessions/latex/latex-state.ts
  517 src/lib/state/sessions/latex/latex.svelte.ts
   53 src/lib/state/workbench/layout/open/float/browser.ts
   15 src/lib/ui/controls/editor/kit/latex/editing/edit.ts
  174 src/lib/ui/controls/editor/kit/latex/editing/environments.ts
  233 src/lib/ui/controls/editor/kit/latex/editing/pairs.ts
  112 src/lib/ui/controls/editor/kit/latex/editing/sectioning.ts
   62 src/lib/ui/controls/editor/kit/latex/editing/selection.ts
   89 src/lib/ui/controls/editor/kit/latex/editing/shortcuts.ts
  259 src/lib/ui/controls/editor/kit/latex/latex-editing.ts
   68 src/lib/ui/controls/editor/kit/latex/latex-suggest.ts
  115 src/lib/ui/controls/editor/kit/latex/references.ts
   90 src/lib/views/academic/latex/Commands.svelte
   74 src/lib/views/academic/latex/Problems.svelte
  192 src/lib/views/academic/latex/Structure.svelte
  164 src/lib/views/academic/latex/Symbols.svelte
  171 src/lib/views/academic/latex/commands.ts
  166 src/lib/views/academic/latex/tex-root.svelte.ts
   97 src/lib/views/academic/math-preview/MathPreview.svelte
   54 src/lib/views/shared/latex/followed.svelte.ts
   37 src/lib/views/shared/latex/math.ts
    7 src/lib/views/shared/latex/opened.ts
   19 src/lib/views/shared/latex/root-answer.ts
   34 src/lib/views/shared/latex/state-words.ts
  305 src/lib/views/sources/file/pdf/Controls.svelte
  185 src/lib/views/sources/file/pdf/side-panel.ts
  166 src/lib/views/sources/file/pdf/viewer.css
  608 src/lib/views/sources/file/pdf/viewer.svelte.ts
   64 src/lib/views/sources/source/latex/LatexButtons.svelte
   45 src/lib/views/sources/source/latex/LatexDialogs.svelte
  444 src/lib/views/sources/source/latex/latex-tab.svelte.ts
   10 src/routes/api/(files)/pdfjs/[...file]/+server.ts
CHANGED 123
  574 DESIGN.md
  171 HELP.md
  256 config/behavior.yml
  262 config/catalogs/glyphs.yml
  261 config/catalogs/icons.yml
 1286 config/catalogs/options.yml
  183 config/layout.yml
  134 config/sources.yml
  181 config/text/app.yml
  234 config/text/findings.yml
  178 config/text/statusbar.yml
  206 config/text/views/academic/latex.yml
  130 config/text/views/boards/project.yml
   56 config/text/views/sources/file.yml
  259 config/text/views/sources/files.yml
  203 config/text/views/system/workbench.yml
   65 docs/configuration.md
  331 docs/diagrams/channels.dot
 1833 docs/diagrams/channels.svg
   74 docs/diagrams/layer-data.dot
  356 docs/diagrams/layer-data.svg
  156 docs/diagrams/layer-server.dot
  764 docs/diagrams/layer-server.svg
  117 docs/diagrams/layer-shell.dot
  524 docs/diagrams/layer-shell.svg
  173 docs/diagrams/layer-state.dot
  855 docs/diagrams/layer-state.svg
  110 docs/diagrams/layer-ui.dot
  528 docs/diagrams/layer-ui.svg
  179 docs/diagrams/layer-views.dot
  809 docs/diagrams/layer-views.svg
   90 docs/diagrams/layers.dot
  493 docs/diagrams/layers.svg
  228 docs/diagrams/writes.dot
 1107 docs/diagrams/writes.svg
   95 docs/files-and-search.md
  263 docs/views.md
   82 docs/window.md
 8464 package-lock.json
  109 package.json
   88 src/lib/data/helpers/files/paths.ts
  626 src/lib/data/model/index.ts
  438 src/lib/data/model/model-processes.ts
  714 src/lib/data/model/model-sessions.ts
  586 src/lib/data/prose/latex.ts
   98 src/lib/data/sources/config.ts
  321 src/lib/data/sources/config/catalogs.ts
  770 src/lib/data/sources/config/settings.ts
   73 src/lib/data/sources/deck/files.ts
  606 src/lib/data/sources/deck/read.ts
  376 src/lib/server/content/latex.ts
  580 src/lib/server/content/latex/endpoint.ts
  149 src/lib/server/content/latex/outline.ts
  305 src/lib/server/content/latex/root.ts
  217 src/lib/server/core/channels.ts
  272 src/lib/server/edit/writes/config/config-checks.ts
   68 src/lib/server/machine/pty/refusal.ts
  510 src/lib/server/machine/pty/routes.ts
  791 src/lib/server/machine/pty/sessions.ts
  879 src/lib/server/root/context.ts
  205 src/lib/server/root/socket.ts
  660 src/lib/server/root/watch/portfolio.ts
  476 src/lib/shell/Workbench.svelte
  279 src/lib/shell/frames/FrameLayer.svelte
  311 src/lib/shell/keys/keys.ts
  492 src/lib/shell/keys/workbench-keys.svelte.ts
  348 src/lib/shell/panes/PaneBody.svelte
   53 src/lib/shell/panes/floats/FloatWindow.svelte
  181 src/lib/shell/panes/strip/tab-menu-state.svelte.ts
  301 src/lib/shell/panes/strip/tab-menu.ts
  237 src/lib/shell/status/StatusBar.svelte
  132 src/lib/shell/status/status-items.ts
  806 src/lib/state/boards/collection.ts
  618 src/lib/state/client/context.ts
  589 src/lib/state/sessions/source.svelte.ts
  727 src/lib/state/sessions/terminal/commands.svelte.ts
  248 src/lib/state/sessions/terminal/pty/pty-io.ts
  839 src/lib/state/sessions/terminals.svelte.ts
  168 src/lib/state/shared/answers/answers.ts
   83 src/lib/state/shared/answers/terminal-words.ts
  165 src/lib/state/sources/explorer/sections/outline.ts
  371 src/lib/state/sources/fs-transport.ts
  123 src/lib/state/system/config/editors/origins.ts
  840 src/lib/state/workbench/layout.svelte.ts
  127 src/lib/state/workbench/layout/open/show.ts
  180 src/lib/state/workbench/navigation/editor-status.svelte.ts
  518 src/lib/state/workbench/navigation/pages.ts
  441 src/lib/ui/controls/ToolButton.svelte
  496 src/lib/ui/controls/editor/Editor.svelte
  131 src/lib/ui/controls/editor/chords.ts
  160 src/lib/ui/controls/editor/commands.ts
  308 src/lib/ui/controls/editor/kit/latex/latex-widget.ts
  454 src/lib/ui/controls/editor/kit/load.ts
  121 src/lib/ui/controls/editor/types.ts
  126 src/lib/ui/controls/tool-button.ts
  101 src/lib/ui/display/Glyph.svelte
  227 src/lib/ui/tabs/tab-frames.svelte.ts
  258 src/lib/views/academic/latex/Latex.svelte
   60 src/lib/views/boards/project/Latex.svelte
  135 src/lib/views/shared/card/card.ts
  236 src/lib/views/shared/explorer/tree/control/picks.svelte.ts
  576 src/lib/views/shared/explorer/tree/menu/row-menu.ts
  175 src/lib/views/shared/latex/Main.svelte
   72 src/lib/views/shared/latex/Problems.svelte
   46 src/lib/views/shared/latex/Rows.svelte
   41 src/lib/views/shared/latex/places.ts
  222 src/lib/views/sources/document/Document.svelte
  392 src/lib/views/sources/file/File.svelte
  519 src/lib/views/sources/source/Source.svelte
  149 src/lib/views/sources/source/actions/BarActions.svelte
   45 src/lib/views/sources/source/language/extension.ts
  125 src/lib/views/sources/source/language/latex-editor.ts
   82 src/lib/views/sources/source/language/tab-language.svelte.ts
  137 src/lib/views/sources/source/status/ask-perform.ts
  265 src/routes/+page.svelte
   27 src/routes/api/(sessions)/latex/+server.ts
  560 tests/checks/config/config-folder.test.ts
  617 tests/checks/config/config.test.ts
  701 tests/checks/tree/boundaries.test.ts
  645 tests/data/sources/config/settings.test.ts
   64 tests/data/sources/config/wrong-settings.ts
   88 tests/routes/sessions/latex.test.ts
  449 tests/routes/sessions/terminal-actions.test.ts
REMOVED 3
      src/lib/state/sessions/latex.svelte.ts
      src/lib/views/shared/latex/Outline.svelte
      src/lib/views/shared/links/file-url.ts
```

## Judgment calls the brief left open

- The PDF viewer lives in the frame layer (`frames.provide(instance.id, made)` at `File.svelte:253`), so its document, page, zoom and scroll survive a tab move.
- The viewer keeps its own back stack of the places an internal link left, since the window's history is not the viewer's.
- `-g` is passed only to latexmk tools, and only when the page forces a retry, after a failed or stopped build, or when the folder holds a PDF with no `.synctex.gz`.
- An inverse search opens the source with `openAway`, in a pane other than the PDF's (`avoid` the PDF tab), so the source never lands on top of the PDF.
- The Chrome float page says it is alive every 1000 ms and the main page takes the float back after 3500 ms of silence.
- The quiet window after the editor's own save is 2000 ms (`builds.ts:53` `QUIET_MS`), the length of the `files` channel throttle.
- texdoc has two commands: one that asks for a name and one that picks among the root's `\usepackage` names.
- Cmd+Alt+X (Ctrl+Alt+X off macOS) is read from `event.code` (`shell/keys/keys.ts`), since Option and X type another character on macOS.
- `toggleEquation` follows LaTeX Workshop's wiki on star toggling.
- The settings words `settings_origin_repeat` and `settings_origin_unnamed` (`config/text/views/system/workbench.yml:186-187`) name the two new skipped-row reasons in `state/system/config/editors/origins.ts`.
- The wire types of terminals moved to `data/model/model-processes.ts` and `model-sessions.ts` is 714 lines; `server/root/context.ts` is 879 lines with a reader loop; `postWithToken` is in `terminal/pty/pty-io.ts`; `macrosOf` moved to `data/prose/latex.ts`; `toggled` (`views/shared/latex/opened.ts`) and `takeRoot` (`views/shared/latex/root-answer.ts`) are shared helpers; the LaTeX tables reader is `data/sources/config/catalog/latex-tables.ts`; `latexAutoBuild`, `Macros` and `LatexLayout` are not exported.
- The state's ports for notices and layout are structural types (`LatexLayout` has `holding(id)`), so `state/sessions/latex` imports no workbench module.
- The `jump` socket message is `{type:'jump', root, file, line, column?}`, accepted only from a socket that carried the write token, sent once to subscribers of the channel `jump` with no replay.
- The boundaries test is widened (open item D45-3).

## Host- and user-visible changes, before and after

- Build command: before `latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'`; after `'latexmk' '-synctex=1' '-interaction=nonstopmode' '-file-line-error' '-pdf' '-outdir=<dir>' '-auxdir=<dir>' '<dir>/main'` for the default recipe, a recipe chosen by comment or by the page, and `-g` when forced.
- `latex.auto_build`: before `on_save` (values `on_save`, `never`); after `on_file_change` (values `on_file_change`, `on_save`, `never`), with `auto_build_interval_ms: 1000`.
- `config/behavior.yml` `latex:` gains `recipes` (9), `tools` (10), `recipe_default: first`, `out_dir: "%DIR%"`, `aux_dir: "%OUTDIR%"`, `clean_and_retry: true`, `auto_clean: never`, `synctex_path`, `reverse_synctex: ctrl_click`, `texcount_autorun: never`, `context_menu`; `open.program_ext` gains `".pdf": com.apple.Preview` (`behavior.yml:233`).
- A missing `latexmk` or engine: before the terminal started and the shell printed `command not found`; after a refusal naming the program and where it comes from, with no terminal.
- A PDF: before Chrome's own viewer in a frame; after the PDF.js viewer that keeps page, zoom and scroll across a rebuild, with SyncTeX in both directions.
- The file tab's menu item "Open in Browser Tab" is "Open in Browser"; a PDF also offers Open in New Tab, Open in New Window (a float; with oculus in Chrome a new browser tab at `/?float=<id>`) and Open in Program (Preview).
- The Files row menu's "Open LaTeX" is gone; the `latex` view is listed in the `explorer` group at order 5 and opened by Cmd+Alt+X or the status item; the keys sheet reads `s1-s5` (`HELP.md:46`).
- A LaTeX source tab's breadcrumb bar and the palette carry Build, Build with Recipe, Clean, Kill Build, View PDF, Build Log, SyncTeX from Cursor, texdoc, Reveal Output Folder and the editing commands of section D.
- The status bar has a `latex` item, last of the left group.
- A failed build posts "The LaTeX build of {0} failed." with Open Compiler Log and Show Problems.
- A cross-window message `jump` lets a float's Cmd+click open the source line in the main page.

## Text and head comments of "What is on the tree"

Rewritten: `views/academic/latex/Latex.svelte`; `state/sessions/latex/latex.svelte.ts` (the old `state/sessions/latex.svelte.ts` is removed); `server/content/latex.ts`; `server/content/latex/root.ts`; `views/sources/file/File.svelte` (:32-45 and :53); `views/sources/source/Source.svelte` (the head comment at the old :83-85); `views/sources/source/actions/BarActions.svelte` (:1-17); `views/sources/source/language/extension.ts` (:1-5); `views/sources/source/language/tab-language.svelte.ts` (:1-6); `shell/keys/keys.ts` (:98-104); `shell/status/status-items.ts` (:1-23); `views/shared/explorer/tree/control/picks.svelte.ts` (:164-170); `state/sessions/terminal/commands.svelte.ts` (:31); `shell/panes/floats/FloatWindow.svelte` (:1-8); `shell/Workbench.svelte` (:20-23); `shell/panes/strip/tab-menu.ts` (:3 and :87); `views/shared/explorer/tree/menu/row-menu.ts` (:7); `views/sources/document/Document.svelte` (:46).

Still true: `views/boards/project/Project.svelte` (:21-23; a comment-line diff against the base prints 0 lines).

`DESIGN.md`: :531, :533, :535, :568 and :574 rewritten; :570-573 still true; :235 is also rewritten and was not on the brief's list. `HELP.md`: :46 rewritten (`s1-s5`); rows 66-75 added for the LaTeX keys; the views row for `latex` added at :107; the keys table rows :64 and :65 (Cmd+Shift+B, Cmd+Alt+T) and the "Six views" sentence (:143) are still true (the six views opened for something are the same six, with MathPreview where `latex` stood). `docs/views.md`: the TeX view section added at :70-77; :237 and :251 rewritten; :253-264 added. `docs/window.md`: :15, :41, :59 and :82 rewritten. `docs/configuration.md`: the `catalogs/latex.yml` row added at :17. `docs/files-and-search.md`: :43 rewritten. The oculus `README.md`: `grep -c -i latex README.md` prints 0, still true.

## Wrong or impossible in the brief

- L7 expects `figs/fig-concept.tex` of `funding/2026-fwo-senior-transplant/proposal/` to build alone. The real file has no `\documentclass`; it is a fragment that `figs/test-figs.tex` (an article) inputs, so the root is `figs/test-figs.tex` with `how: included` (final-tree run of `probe-root-new.ts`, row L7), and Build builds `test-figs.tex`. Only the synthetic standalone figure of case 2 answers itself.
- Case 5's 200 ms bound cannot hold on this machine for the first read of a freshly written file (section "Case 5"); the walk itself stays under 20 ms warm.
- Verify item 4's `find` list names a `bin` folder that does not exist in this tree.
- Verify item 7 allows "the one helper's own name"; the grep prints nothing at all.



## Repair round 1

Not done, not verified, and open, first:

- The host side of the owner id (`src/desktop/preload.cjs`, `src/desktop/windows/bridge.ts`, `src/desktop/windows/windows.ts`, `src/desktop/decide/links.ts`) was not run in the app, which I do not start. It is verified by reading, `npm run check`, and `npx vitest run tests/server/desktop --tagsFilter '!slow'` ("Test Files  2 passed | 1 skipped (3)", "Tests  16 passed | 5 skipped (21)"). No test names the `owner` parameter. The browser path of the same id is run in hidden Electron (items 1, 16, 19 below).
- `npm run test:checks` ends with 2 failures, both in `tests/checks/config/integrity.test.ts` ("the real hub > validates with no findings" and "reads the portfolio deck with every named deck found"). The message is `deck folder deck is not in /Users/axelfaes/workspace/research-hub/.agents/worktrees/D45`; `ls -d deck` in the worktree root answers "No such file or directory" and the main checkout has `deck/`. These two read the real hub root, which a worktree does not hold. Whether they fail the same way on the base tree is not verified. The other 241 tests of `tests/checks` pass, including `boundaries.test.ts`, `order.test.ts`, `config.test.ts`, `config-folder.test.ts` and `diagrams.test.ts`.
- `npm run test:quick` passes (last run 22.7 s, limit 45.0 s). An earlier run of this round took 54.7 s and reported "over the time limit" on the same passing tests, the cause of the difference between the two runs is not determined.
- The time bound of case 5 (item 21) is met in the five final runs and not met by a plain cold read of one file on this machine (numbers in item 21).
- Decisions for Axel, each with its recommendation (recommended option is the better one, the cheaper one is named):
  1. A float placed in a window, opened in a browser page that has no tab for it, was drawn there as a free float (`layout.svelte.ts` `floats()` mapped every window place to `centred()`). That mapping made a browser float tab close at once (see item 19), so I removed it: `floats()` now returns the saved list, `FloatLayer.svelte` draws only the non-window ones (`FloatLayer.svelte:59`), and `browser-windows.svelte.ts` frees a window float whose tab holds no lock after `LOAD_WAIT = 10_000` ms, which draws it as a free float again. Visible effect: such a float is absent for up to 10 s after a main page loads, then appears as a free float. Option (a), recommended: keep. Option (b), the cheaper one: put the mapping back and give a browser float tab a separate reading of its own float; it keeps the float on screen at once but the float tab and the main page then read one saved float two ways.
  2. The main page id in a browser is the browser tab's session id (`oculus.layout.tab`), reused as the `owner` of a float page. A duplicated tab copies session storage and so the id; `holdBrowserTabId` (`storage.ts`) holds a Web Lock per id and the copy forgets the id and reloads. Option (a), recommended: keep. Option (b), the cheaper one: leave duplicated tabs sharing an id, so a jump opens its source in both.
  3. A float page with no `owner` in its address (typed by hand) says `latex.jump_failed` and sends nothing. The float window drew no notices at all, so the notice would never have been seen; `Workbench.svelte` now mounts `<Bell drawn={false} />` beside `FloatWindow`, so every notice of a float window shows as a toast. Option (a), recommended: keep. Option (b), the cheaper one: no toast host in the float window and the failure unseen.

Standing-rule events, stated as they are:

- Item 22: I ran three git commands, all read-only and none changed the tree: `git status` twice with its output discarded, and `git diff --no-index --stat` once to compare one file against the base copy. I ran none after that; the final steps use `diff` against `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D45-base/tools/oculus`. `npm run test:quick` itself reads git ("190 changed file(s), from git since HEAD") as its own selection.
- `npx vitest run tests/server/desktop` without `--tagsFilter '!slow'` was run twice and started the slow-tagged harness that launches an Electron app; both runs were killed by pid with their Electron process (45287). It is now run only with the filter, as above.
- The scratch engine copy at `$TMPDIR/d45r2/hub/tools/oculus` has its own `config/local.yml` (`hub:` the scratch hub under `$TMPDIR/d45r2/hubdata`, `port: 8795`). It is not the real `local.yml`, and every grep over `config/` carried `--exclude=local.yml`.
- Two `pdflatex` processes (about 29 minutes of CPU each), their two `latexmk` parents and one tmux session were left by the scratch server's builds in `$TMPDIR/d45r2/hubdata/projects/active/alpha/manuscript`; I killed them by pid and ran `tmux kill-server` against the scratch socket `$TMPDIR/d45r2/tmux`. A second pair appeared in the later float runs and was killed the same way. `ps aux | grep "[d]45r2"` and `lsof -nP -iTCP:8795 -sTCP:LISTEN` print nothing now. The cause of the hang is not determined; the same `main.tex` compiles in a few seconds with `pdflatex -interaction=nonstopmode` (exit 0). Two leftover `vite-node` processes of an earlier probe (51836, 51697) were killed too.

### The 22 items

Each probe below ran in hidden Electron windows (`show: false`, `backgroundThrottling: false`, `userData` under `$TMPDIR/d45r2/userData`) against one scratch vite server on port 8795, stopped by its pid (`$TMPDIR/d45r2/server.pid`). The probe is `$TMPDIR/d45r2/probe.cjs`, outside the tree; its outputs are `$TMPDIR/d45r2/out-float.txt`, `out-dup.txt`, `out-pdfui.txt`, `out-status.txt`, `out-menu-true.txt`, `out-menu-false.txt`.

1. Jump to the owning page only. Done. `Jump.owner` (`src/lib/data/model/index.ts:228-229`), parsed in `src/lib/server/root/socket.ts` (head comment :17-19, shape :99) and sent by the float page (`src/lib/state/sessions/latex/actions.ts:270-271`), read by every main page through `jumpOf` (`actions.ts:78,146,284`; `context.ts:420`: `entities.payloadOf(message, 'jump')`), which acts only when `place?.owner !== pageId` is false (`actions.ts:285`). The float page learns its owner from `?float=<id>&owner=<id>` (`float/browser.ts:21-23`, `ownerOf`; `+page.svelte:36,61`). Run `probe.cjs float`, two main pages A and B and one float page on one server, a Ctrl-click on the float's PDF:
   `RESULT main page A (the owner) after the click: {"jumpsHeard":[{"owner":"mpng2u","root":"hub","file":"projects/active/alpha/manuscript/main.tex","line":6}],"focusCalls":1}`
   `RESULT main page B after the click: {"jumpsHeard":[{"owner":"mpng2u",...,"line":6}],"focusCalls":0}`
   `RESULT layout writes by browser tab after the click: [{"tab":"mpng2u","call":"openView","n":1}]`
   Both pages heard the frame; only A opened a tab and took focus, and the only layout write is A's. A float page with no owner: `RESULT float page with no owner after the click: {"notice":true,"jumpsHeardBeforeAndAfter":[[1,1],[1,1]]}` (a notice is shown, no frame is sent). The app host passes the id through `windows.ts:174-175` (`&owner=`), `bridge.ts:123-131`, `preload.cjs:23-24`, `desktop.ts` (`openFloatWindow(id, bounds, owner)`, `desktopOf` reads `owner`), `links.ts:34` (accepts `owner`); not run in the app (see the top).
2. Build failure notice. Done: `latex.failed_notice` is `'The LaTeX build of {0} failed.'` (`config/text/views/academic/latex.yml:61`), shown at `builds.ts:324` with the actions `latex.open_compiler_log` ("Open Compiler Log", `latex.yml:89`, `builds.ts:272`) and `latex.show_problems` ("Show Problems", `latex.yml:145`, `builds.ts:277`). Checked by reading and by the 69 tests of the three files named under item 6 and the config checks (`tests/checks/config`); the toast of a failed build is not drawn in Electron by me: not verified beyond that.
3. Docs name `jump`. Done: `DESIGN.md:121` ("The socket", rewritten) and the head comment of `socket.ts:7,17-19` (rewritten), the owner sentence at `DESIGN.md:533` and `docs/views.md:259` (rewritten).
4. `texcount_autorun` text. Done: `config/catalogs/options.yml:591` ("on_save counts the words of the main file after each save of a LaTeX file") and `config/behavior.yml:133` carry the same wording; `grep -rIn --exclude=local.yml "texcount_autorun" config src tests docs HELP.md DESIGN.md` lists the key in `config/behavior.yml:133,145` and `config/catalogs/options.yml:588-591`, its reader `settings.ts:726-727` and its tests.
5. Kept under Z690; no change.
6. The stop test starts a second main's terminal. Done: `tests/routes/sessions/terminal-actions.test.ts:284` (row "stops the build terminal of the main and no other terminal") builds `main.tex`, builds `second.tex` (the `second.tex` fixture is written in the test's setup) and starts a checkcites terminal, posts `stop`, and asserts `driver.calls.filter((args) => args[0] === 'send-keys')` equals `[['send-keys', '-t', 'oculus-<build id>', '--', 'C-c']]`, so neither the second main's terminal nor the checkcites terminal got an interrupt. `npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/routes/sessions/latex.test.ts tests/data/sources/config/settings.test.ts`: "Test Files  3 passed (3)", "Tests  69 passed (69)".
7. pdfjs. `grep -rIl "isEvalSupported" node_modules/pdfjs-dist` prints nothing; `node_modules/pdfjs-dist/package.json:3` is `"version": "6.4.299"`, so that version has no `isEvalSupported` option and the viewer has none to set. Scripting is off because no scripting manager is given: `node_modules/pdfjs-dist/web/pdf_viewer.mjs:8013` reads `this._scriptingManager = options.scriptingManager || null;` and `:8106-8108` is `get enableScripting() { return !!this._scriptingManager; }`; `src/lib/views/sources/file/pdf/viewer.svelte.ts:356-364` builds the `PDFViewer` with no `scriptingManager`.
8. The `jump` socket test was a scratch file outside the tree (`$TMPDIR/d45-probes/socket-jump.test.ts`). No test row is added for it: the brief names G35 (terminals and latex) and G13 (settings) for tests, and neither covers the socket payload check. The payload check is the parse of item 10.
9. Edits to existing assertions, allow lists and predicates, from `diff` of each changed test file against the base copy (one row per changed line; lines added with no counterpart are listed as "added"):

   | File | Before | After |
   |---|---|---|
   | `terminal-actions.test.ts` (fixture) | `id === 'alpha' ? { title: 'Alpha Study', folder: LATEX_PROJECT } : null` | the same with a trailing comma, and `programFound: () => true` added to the options |
   | `terminal-actions.test.ts` (setup) | no `second.tex` | `second.tex` written beside `main.tex` (`\documentclass{article}`) |
   | `terminal-actions.test.ts` 'builds one main file ...' | `toEqual(["latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'"])` | `toEqual([latexmkLine()])`, the Workshop default line with `-synctex=1`, `-outdir=`, `-auxdir=` and the absolute main |
   | `terminal-actions.test.ts` 'builds again in the terminal it kept ...' | `respawns()` equal to `[['respawn-pane','-k','-t',session,"latexmk -pdf -interaction=nonstopmode -file-line-error 'main.tex'"]]` | `toEqual([['respawn-pane', '-k', '-t', session, latexmkLine()]])` |
   | `terminal-actions.test.ts` | none | `LATEX_ROWS`, five rows run by one `it.each` (:247, :351) |
   | `settings.test.ts` import | `latexAutoBuild,` | `latexBuild,` |
   | `settings.test.ts` defaults map | `'latex.auto_build': 'never'` last of the `latex.*` rows | ten rows added: `auto_build_interval_ms` 2500, `recipe_default` last_used, `out_dir` out, `aux_dir` aux, `clean_and_retry` false, `auto_clean` on_built, `synctex_path` /a/synctex, `reverse_synctex` double_click, `texcount_autorun` on_save, `context_menu` true |
   | `settings.test.ts` describe | `'latexFormatting and latexAutoBuild'` | `'latexFormatting and the auto build'` |
   | `settings.test.ts` auto build, line 1 | `expect(latexAutoBuild(mapWith({ latex: { auto_build: 'on_save' } }))).toBe('on_save')` | `expect(auto({ auto_build: 'on_save' })).toBe('on_save')`, `auto` being `latexBuild(mapWith({ latex })).autoBuild` |
   | `settings.test.ts` auto build, line 2 | `expect(latexAutoBuild(mapWith({ latex: {} }))).toBe('never')` | `expect(auto({})).toBe('never')` (one line added: `auto({ auto_build: 'on_file_change' })` is `'on_file_change'`) |
   | `settings.test.ts` auto build, wrong value | `toStrictEqual({ value: 'never', problems: ['latex.auto_build: choice'] })` | `toStrictEqual({ value: BUILD_DEFAULTS, problems: ['latex.auto_build: choice'] })`, the whole answer of `latexBuild`, still strict |
   | `wrong-settings.ts` | `auto_build: 'x'` last of the `latex` block | eleven wrong keys and a tools list and a recipes list added after it |
   | `config.test.ts` | the `latex.*` key list had no `latex.aux_dir` ... | eighteen keys added to the list of keys the real configuration must carry: `latex.aux_dir`, `.auto_build_interval_ms`, `.auto_clean`, `.clean_and_retry`, `.context_menu`, `.out_dir`, `.recipe_default`, `.recipes`, `.recipes[2]`, `.recipes[3].tools`, `.reverse_synctex`, `.synctex_path`, `.texcount_autorun`, `.tools`, `.tools[2].name`, `.tools[3]`, `.tools[4].command`, `.tools[5].args` |
   | `config-folder.test.ts` | no `catalogs/latex.yml`, no `views/academic/math-preview.yml` | both added to the expected file lists (`'catalogs/latex.yml': ['latex_editing']`) |
   | `latex.test.ts` | `import type { LatexFormatting } ...` and no `building` option | `latexBuild` imported, `engineDir` and `loadConfig` imported, `building: () => latexBuild(loadConfig(engineDir()).config)` added to the options |
   | `boundaries.test.ts` import allow list, shell row | none of the next three | `'state/sessions/latex/latex-state'`, `'state/shared/words/format'`, `'data/prose/latex'` added |
   | `boundaries.test.ts` import allow list, other rows | none of the next three | `'data/helpers/files/address'`, `'data/prose/bib'`, `'data/sources/config/catalog/latex-tables'` added |
   | `boundaries.test.ts` `SHELL_STORES` | ends `'documents'` | `'latex'`, `'latexActions'`, `'float'`, `'windows'`, `'pageId'` added |
   | `boundaries.test.ts` comments | the paragraphs on `data/helpers/files/apps`, `data/prose` readers and `SHELL_STORES` | rewrapped and extended for the names added above |

   No assertion was weakened: every `toStrictEqual` or `toEqual` stayed strict, and no allow list lost an entry.
10. `jump` joins `payloadShapes` and is parsed. Done: `src/lib/state/client/payloads.ts:120-126` (`jumpShape`, z.object with `owner`, `root`, `file`, `line`, `column?`) and `:147` (`jump: jumpShape` in `payloadShapes`); the page reads it through `entities.payloadOf` (`entities.svelte.ts:55`, which runs `readAs(payloadShapes[channel], ...)`), never a cast; the socket client already drops a frame whose payload fails (`socket.svelte.ts:418-419`).
11. Doc text for G35 (for `agents/guarded.md`, which I do not edit):
   - Code line: add `src/lib/server/machine/pty/latex.ts` after `src/lib/server/machine/pty/routes.ts`: "Code: the operations of `src/lib/server/machine/pty/routes.ts` that start or end a process or send it input, each a unit: start, recover, task, latex, command, rerun, restart, chat, compose, steer, interrupt, fork, stop, clear, resume; `src/lib/server/machine/pty/latex.ts` (the latex action: the build line, the recipe chain, `-g`, `stop`, `clean`, `checkcites`); `tmux.ts`, `sessions.ts`, `channel.ts`."
   - Test line, the latex part, replacing "latex `tests/routes/sessions/terminal-actions.test.ts`, 'builds one main file with latexmk in the manuscript folder'" and the D37 latex entry: "latex `tests/routes/sessions/terminal-actions.test.ts`: 'builds one main file with latexmk in the manuscript folder', 'builds again in the terminal it kept, and cleans in another', and the table `it.each(LATEX_ROWS)` with the rows 'runs the recipe asked for as one line of its tools joined by &&', 'makes latexmk build again with -g when the page says so', 'stops the build terminal of the main and no other terminal', 'refuses a clean while the main builds, and runs it once the build ended', 'checks the citations of a main file with checkcites in a terminal of its own', and the table 'POST /api/terminal, a refusal'."
   - The five new `it`s are one table test (`terminal-actions.test.ts:247-353`), named by its row titles above.
12. PDF viewer controls are `ui/` primitives. Done: new `src/lib/views/sources/file/pdf/PdfControl.svelte` draws `ToolButton` (a button, an outline entry `cell`, a thumbnail `cell` with `current`), mounted with Svelte's `mount` at `viewer.svelte.ts:449` (Retry, Build) and `side-panel.ts:98-` (`#control`, used at :155 for entries and :190 for thumbnails); `ToolButton.svelte` gained `current` (`aria-current`). The control provides the tip counter it is given (`tips`, `File.svelte:106,247`). The boundary check `lets no view or shell component style a primitive own class` passes (its `:global(.tool...)` rule is replaced by a wrapper `.row:hover .entry`). Run `probe.cjs pdfui`, a 3-page PDF with an outline:
   `RESULT note over a PDF that is not built: {"plainButtons":0,"toolButtons":["Read again","Build"]}`
   `RESULT outline entries: {"entries":["First","Second","Third","One"],"plainButtons":0,"text":"First Second Third One"}`
   `RESULT thumbnails: {"thumbs":3,"withCanvas":3,"plainButtons":0,"current":["1"]}`
   `RESULT thumbnail 2 pressed, current thumbnail: {"current":["2"],"scrollTop":1340}`
   (Retry is the button labelled "Read again": `config/text/views/sources/file.yml:51`, `retry: Read again`.)
13. One `oneLine`, one bounded read. Done: `oneLine` is exported by `src/lib/data/prose/latex.ts:382` and used by `server/content/latex.ts:29,291,297,310,323`; one bounded read `readBounded` with one limit `READ_MAX_BYTES = 2 * 1024 * 1024` at `server/content/latex/reader.ts:21-26`, used by `root.ts:39,92`, `outline.ts:25,75,111`, `texdoc.ts:9,35`; `grep -rn "OUTLINE_MAX_BYTES" src tests config` prints nothing. The `oneLine` of the deck (`data/sources/deck/slide-text.ts:89`) and of the turns store (`server/sessions/stores/turns.ts:303`) are other concerns with other rules.
14. `ask.force` reaches the server. Done: `builds.ts:102` (`force?: boolean` in `Ask`), `:424-427` (`const force = ask.force === true || ask.retry === true || after === 'failed' || after === 'stopped'`, sent in `.latex(target, main, 'build', { recipe, last, force })`), asked by the "no SyncTeX file" notice at `actions.ts:232` (`build(root, file, { force: true })`). The server side is the `makes latexmk build again with -g when the page says so` row (passing).
15. `docs.ts` `routeUrl`. Done: `server/content/docs.ts:51,232` builds through `fileBytesUrl` of `data/helpers/files/address.ts:11`.
16. A PDF in a float reloads after a build. Done in `File.svelte:274-287` (`built` holds the root of the PDF; the held `LatexState` of that root is read again, which moves the PDF's time and bumps the viewer's address, keeping page, zoom and scroll). Run `probe.cjs float` (the cache cleared first, a 3-page PDF rebuilt to 4 pages while the float page shows it):
   `RESULT float viewer before the build: {"pages":3,"scrollTop":1331,"pageWidth":1037,"scroller":3998}`
   `RESULT float viewer after the build, waited for 4 pages: {"reached4":true,"pages":4,"scrollTop":1330,"pageWidth":1037,"scroller":5328}`
   The page stayed (scrollTop 1331 to 1330) and the zoom stayed (page width 1037).
17. `stateOf` and the manuscript folder. Done: `latex-state.ts:381-384` (`const dir = joinPath(body.folder, MANUSCRIPT)`, issue files placed against it; `MANUSCRIPT` from `data/prose/latex.ts`). Probe on a project with `latex.out_dir: out` and an error in `chap/one.tex` (`$TMPDIR/d45-probes/r17.txt`):
   `server answer: folder projects/manuscripts/alpha | pdfPath manuscript/out/main.pdf | error file "chap/one.tex"`
   `state.dir projects/manuscripts/alpha/manuscript (the main's folder, not the output folder)`
   `problem row: file projects/manuscripts/alpha/manuscript/chap/one.tex line 2 | exists under the hub: true | Undefined control sequence.`
   `pdfPath projects/manuscripts/alpha/manuscript/out/main.pdf true`
   The Show Problems rows name real files under the main's folder.
18. Status item only for a LaTeX source with a root or a build's PDF. Done: `LatexItem.svelte:9-12` and its reset of the root. `probe.cjs status`:
   `status item, active tab main.tex (a root): {"drawn":true,...}`; `loose.tex (no root): {"drawn":false,...}`; `main.pdf (a build): {"drawn":true,...}`; `unrelated.pdf (no build): {"drawn":false,...}`.
19. Presence by Web Lock. Done: `browser-windows.svelte.ts:32-58` (the float page holds `oculus-float:<id>` for its life; a main page requests it after `LOAD_WAIT` and frees the float when it is granted); the heartbeat and its `BroadcastChannel` are gone (`grep -rIn "BroadcastChannel\|HEARTBEAT" src tests config docs DESIGN.md` prints nothing). `probe.cjs float`:
   `RESULT locks held on the server origin: ["oculus-float:fl1","oculus-page:mpng2u","oculus-page:s7d881"]`
   `RESULT float still in a window place after 9 s with the float page open and hidden: ["window"]`
   `RESULT lock state before closing the float page: {"held":["oculus-float:fl1",...],"pending":["oculus-float:fl1","oculus-float:fl1"]}`
   `RESULT lock state after closing the float page: {"held":["oculus-page:mpng2u","oculus-page:s7d881"],"pending":[]}`
   `RESULT float after its page was closed: {"floats":["free"],...}`
   The float page's window closing at once (the earlier `Object has been destroyed`) was `layout.floats()` mapping a window place to a free one in a browser page; the change is decision 1 above. A duplicated tab (`probe.cjs dup`): `RESULT page ids: ... {"idA":"8g07ph","idAfter":"8g07ph","idCopy":"mygihe","copyIsNew":true}` and `RESULT locks held ...: ["oculus-page:8g07ph","oculus-page:mygihe"]`.
20. `latex.context_menu`. Done: `latex-tab.svelte.ts:299-301` (`menu: 'navigation'` for Build and SyncTeX from Cursor when `contextMenu` is true). Right-click in the editor, real mouse events, Monaco's shadow-root menu read, both values:
   true: `["Build LaTeX project","Show the PDF at the caret (SyncTeX)","Go to Symbol...","Change All Occurrences","Format Document","Cut","Copy","Paste","Command Palette"]`
   false: `["Go to Symbol...","Change All Occurrences","Format Document","Cut","Copy","Paste","Command Palette"]`
21. `rootOf` cold versus warm. The walk (`root.ts:29` head, `Walk` :59, `headOf` :73, `textOf` :88, `closureIn` :207, `onlyMain` :285, `mainOfPdf` :341, `rootOf` :368) holds what a call has read in one `Walk` and reads each file at most once per call, and stops once the root is decided. Read counts with `fs.readFileSync` and `fs.openSync` wrapped, one call each (scratch probe, outside the tree):
   `loose fragment, three mains share an include null | opens or reads per path: zz.tex=1 a.tex=1 chap1.tex=1 shared.tex=1 deep.tex=1 a2.tex=1 hit.tex=1 b.tex=1 chap2.tex=1 c.tex=1 | most for one path: 1`
   `fragment held by the second main {"main":"<b>/a2.tex","how":"included"} | ... | most for one path: 1`
   `a main {"main":"<b>/a.tex","how":"self"} | opens or reads per path: a.tex=1 | most for one path: 1`
   Plain cold read of 31 files versus `rootOf` over 16 cases, three runs each, before the change (`$TMPDIR/d45-probes/r21-before.txt`): plain read max single 0.2 ms, 220.0 ms and 0.7 ms; `rootOf` warmed by the read max single 5.8, 7.3 and 6.6 ms. After the change, five runs of `rootOf` on a freshly written tree, slowest call: 8.2, 197.8, 7.8, 95.7 and 198.0 ms (`r21-after.txt`); the last five (`$TMPDIR/d45-probes/r21-final.txt`): 170.9, 157.6, 100, 9.6 and 9.2 ms. The control, a plain `readFileSync` of the same files, took a maximum single read of 221.8 ms, 227.0 ms (`r21-after.txt`) and 130.2 ms (this turn) on a first touch of a freshly written file, so a cold first read alone exceeds the 200 ms bound on this machine in those runs; `rootOf` stays at or under that control's maximum. The 200 ms bound is unchanged.
22. Git. See "Standing-rule events": three read-only git commands, none after that; none now.

### Gates, last run on the final tree

- `npm run check`: `COMPLETED 3302 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. `npm run lint` and `npm run format:check`: no findings.
- `sh utils/unused-exports.sh` against the base `unused-exports.txt`, compared by name: `unused-exports names added vs base: [] removed: 11`. Names of this round that would have been added and were not: `READ_MAX_BYTES` (no longer exported, `reader.ts:21`), `centred` (no longer exported, `float/pages.ts:69`, and gone from `layout/index.ts`), `forgetBrowserTabId` (replaced by `holdBrowserTabId`, used by `+page.svelte`).
- `sh utils/size-check.sh` and `sh utils/folder-check.sh`: exit 0, no output. Largest file touched this round: `builds.ts` 620 lines, `viewer.svelte.ts` 618 lines (limit 880); components: `File.svelte` 416 lines (limit 520).
- The ASCII gate of `test:quick` is "ok"; a scan of every changed text file for non-ASCII found 0 lines.
- Edited comments rewrapped at 100 columns: `builds.ts:14-26`, `latex-state.ts:381-384`, `links.ts:5-10`, `side-panel.ts:4-10`, `PdfControl.svelte:2-9`, `viewer.svelte.ts:69`.
- `npm run diagrams` (exit 0; rewrote `docs/diagrams/layers`, `layer-*`, `channels`, `writes`) then `npm run test:quick` once on the final tree:
  `ok      eslint (7.9 s)`, `ok      svelte-check (9.4 s): ... 0 ERRORS 0 WARNINGS`, `ok      vitest (22.0 s): Duration  17.83s`, `test:quick: 22.7 s (limit 45.0 s); every command passed`. It does not cover `tests/checks`, slow tests or the app (its own last lines).
- `npm run test:checks`: "Test Files  1 failed | 16 passed (17)", "Tests  2 failed | 241 passed (243)", the two being the `integrity.test.ts` cases named at the top.

### Docs and head comments touched

- Rewritten: `DESIGN.md:121`, `DESIGN.md:533`, `DESIGN.md:574` (owner, Web Lock, page lock), `docs/views.md:259`, head comments of `socket.ts`, `browser-windows.svelte.ts`, `float/browser.ts`, `root.ts`, `LatexItem.svelte`, `side-panel.ts`, `PdfControl.svelte`, `FloatWindow.svelte`, `Workbench.svelte`, `builds.ts` (rewrapped), the `LayoutDesktop` and `floats()` comments of `layout.svelte.ts`, the comments of `storage.ts` (`browserTabId`, `holdBrowserTabId`), `config/text/views/academic/latex.yml` (`failed_notice`), `config/behavior.yml:133`, `config/catalogs/options.yml:591`, the `boundaries.test.ts` comments.
- Still true, checked by `grep -n "float\|jump\|window" HELP.md README.md docs/window.md docs/files-and-search.md docs/configuration.md`: `HELP.md`, `README.md`, `docs/window.md` (its "Move into New Window (in the app)" sentences are identical to the base, and the menu flag is `client.desktop !== undefined` at `PaneView.svelte:217,234`), `docs/files-and-search.md`, `docs/configuration.md`.
