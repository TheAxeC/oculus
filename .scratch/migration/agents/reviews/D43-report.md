NOT DONE: these are only checkable on a page and are left for the look on TEST, with texlab installed first (it is not on this machine):
- Cases 1 (console read), 5, 12 (marker absence at the look), 14 (Outline), 18 to 26 and 36.
- The new ask dialog and the warning-tone status item.
- Whether Monaco's fuzzy filter shows `\upalpha` for `\alph` (case 24).
- The brief says to write `agents/reviews/D43-report.md`. My launch prompt says the report is this message, so no report file was written.

Everything else in the brief is built and verified below. The full verify list ran twice (the first run was red on prettier for `config/catalogs/unimath.yml`, which got a `.prettierignore` entry) and the second run is green.

**Constraint slips (no residue)**
- I ran the whole unit suite once from a scratch attempt. That started an Electron test harness and created `build-app/` and `.svelte-kit-app/`. I killed the processes and removed both folders.
- I ran two read-only git commands: `git -C . status | head -0`, and `git diff --stat -- DESIGN.md docs README.md HELP.md`.
- `checks.sh` itself reads git ("100 changed file(s), from git since HEAD"). That is the script's own behaviour.
- `ls` of the worktree shows no `build-app`, `.svelte-kit-app` or `tests/zz-scratch`. The only process matching vite/electron is pid 7018, `vite dev` from `/Users/axelfaes/workspace/research-hub/tools/oculus`, the main checkout, not mine.

**Open items of the state file** (`orchestrator-state.md` lines 166-171 of the main checkout, copied now)
```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## First run of every case on the unchanged tree
Source: scratch tests in the session scratchpad `d43b/`, not kept in the tree. Output is in `first-runs.txt`.

| Case | First run on the unchanged tree |
|---|---|
| 1 | Relay answers a hover after the root left with `error -32602 "the document is not open"`. Transport delivers that error, not null. A request sent after `root_gone` is forwarded (1 sent). |
| 2 | `REQUEST_CANCELLED` is delivered as `result:null`. |
| 3 | After the root is served again the relay sends `starting`, and a hover reaches the new child (hover counts `[0,1,1]`, 3 spawns). |
| 4 | Two roots, one removed: the other root's child gets the hover (counts `[0,1]`). |
| 5 | Entries are `pyright,clangd,typescript,svelte,yaml`. `forLanguage('latex')` is undefined. |
| 6-8a, 10-14, 16, 16a | There is no texlab entry: `forId('texlab')` throws "no language server entry texlab". |
| 9 | `latexBuild` keys are `recipes,tools,recipeDefault,outDir,auxDir,autoBuild,autoBuildIntervalMs,cleanAndRetry,autoClean,synctexPath,reverseSynctex,texcountAutorun,contextMenu`. There is no `texlab_path` and no problem. |
| 15 | By reading: `held/documents.ts:31-33` `openingTarget` returns null when `resolvePageUri(uri, roots)` is null, and `relay.ts:591` returns before any server is made. D43 does not touch either. |
| 17 | A python server delivers `["texlab","latex","ChkTeX"]` unfiltered. |
| 18-23, 25-26, 36 | Page only. No code exists on the unchanged tree. |
| 24a | `unimathsymbols.json` has 2415 entries (334,627 bytes). `config/catalogs/unimath.yml` does not exist. |
| 27, 28 | Build and clean both answer 200 and start 1 terminal, with and without a `.latexmkrc` (no gate exists). |
| 29-31 | `approve-latex` answers 400 `not-an-action`. |
| 32, 40 | `approveLatex` and `latexmkrcKey` are undefined. |
| 33-35, 38, 39 | The code does not exist. |
| 37 | A `.Rnw` build answers 200 and starts 1 terminal. |

## The same cases after the change (scratch runs, this session)
- **Case 1.** Transport delivered `[{"id":11,"result":null}]`. A request after `root_gone` forwards 0 messages (`CASE1b`). The relay still answers the error, which the transport turns into null.
- **Case 2.** `result:null`.
- **Case 3.** The transport sends `["textDocument/didOpen","textDocument/hover"]` after `starting` and `ready`. The relay run is unchanged: `spawned: 3, hover counts [0,1,1]`.
- **Case 4.** `spawned 2, hover counts [0,1]`.
- **Case 5.** Entries `pyright,clangd,typescript,svelte,yaml,texlab`, and `forLanguage(latex)` is texlab.
- **Case 6.** PATH with no texlab: `spawned 0`, state `not_found`. The note is `texlab is not installed on the PATH oculus was started with`. The tooltip's `brew install texlab` is the catalog word `statusbar.ls_install_texlab`, read through the new `t(facts.words.install` row.
- **Case 7.** `~/bin/texlab` (HOME set to a scratch folder): spawned `<home>/bin/texlab`, equal to the expected path.
- **Case 8.** Each row gives `spawned 0` and `not_found`, and the PATH's texlab is not tried:
  - Missing file: `texlab is not installed at <path>, which latex.texlab_path names`.
  - Relative `bin/texlab`: `texlab is not installed at bin/texlab: latex.texlab_path takes an absolute path or one that starts with ~`.
  - A folder and a non-executable file: same note shape as the missing file.
- **Case 8a.** Read-only lsp folder: `spawned 0`, state `failed` code `lsp_folder`. The note is `cannot make the folder <lsp>/texlab/bin for the TeX programs texlab finds: EACCES: permission denied, mkdir ...`.
- **Case 12.** A root with a `.latexmkrc` that writes `marker.txt`: `spawned 1`, PATH equals the links folder, links `["kpsewhich","latex"]` (latexmk was on PATH and is not linked), `marker.txt exists: false`. The stub never executes anything, so the look must read the marker's absence with a real texlab.
- **Case 14.** `.Rnw`, `.rnw`, `.jnw` and `.pnw` tabs each give `spawned 0`. `refuses` gives true for those four and false for `.tex` and `.bib`.
- **Case 16.** Output:
  - `out_dir %DIR%` gives pdf, aux and log `"."`.
  - `out_dir build` with `aux_dir %OUTDIR%` gives `"build"` for all three.
  - `%DIR%/build` gives `"build"`.
  - `out_dir %DOC%` leaves `pdfDirectory` out.
  - `aux_dir %DOC_EXT%` leaves aux and log out.
  - Always `chktex` off, `latexFormatter` and `bibtexFormatter` `none`, `build.onSave` false.
- **Case 16a.** `didChangeConfiguration` count: 0 before any change; 0 after `settingsChanged` with the same answer; 1 after `out_dir=build`; 1 after `settingsChanged` again.
- **Case 17.** The page receives `["texlab","ChkTeX"]`.
- **Case 24.** The data has no `alpha` entry. Typing `\upalph` offers `upalpha` (insert `\upalpha`, detail `α`) with 2415 items listed; option off gives 0 items; no backslash gives 0.
- **Case 24a.** 2415 symbols, lost 0, value-for-value true, 986 rows above U+FFFF, 0 findings. The only non-ASCII character in the file is `ü`. `Angstrom` documentation is `\mathring{\mathrm{a}}, ångström capital a with ring`.
- **Config push bytes** (config + text JSON): base 675,821; now 924,988. The `latex_unimath` rows are 245,697 bytes of that. The cap is 334,627.
- **Case 25a.** For `fig (1)[a]_b.png` in `my figs`: `![fig \(1\)\[a\]\_b\.png](http://localhost:5173/api/file/repo/my%20figs/fig%20%281%29%5Ba%5D_b.png)`.
- **Case 25.**
  - `.pdf`, `.eps`, the folder and a missing file get none.
  - `UP.JPG` and `c.jpeg` get one.
  - A list object keeps its shape.
  - A call outside `\includegraphics` is unchanged.
  - Option off is unchanged.
- **Case 32 at the route.** With a non-JSON approvals file, `approve-latex` answers 409 `{"error":"approvals-unwritable","names":["latex-approvals.json is not JSON: ..."]}`, the bytes are unchanged, and 0 terminals started.

## DONE / NOT DONE

| Row | Command | Result |
|---|---|---|
| Last code change, then diagrams | `npm run diagrams` | regenerated; `tests/checks/diagrams` passes inside `npm run test:checks` |
| Verify list | `sh .../land/templates/checks.sh .../orchestrator-state.md` (run 2) | exit 0, lines below |
| Per-file tests | `npx vitest run <file> --project unit` | servers 6, lifetime 26, relay 5, versions 2, choices 3, approvals 7, terminal-actions 20, latex-approvals 14, settings 60, config-cache 3, served-roots.client 6 (run without `--project`), config 31, config-folder 24 passed and 1 skipped |
| Tree checks | `npm run test:checks` | 17 files passed, 240 tests passed, 8 skipped |
| Type check | `npx svelte-check --tsconfig ./tsconfig.json --output machine` | 3495 files, 0 errors, 0 warnings |
| Lint | `npx eslint` over the changed files | no output |
| Format | `npx prettier --check` over the changed files | all use Prettier code style |
| ASCII gate | the spec's perl over `src tests config` | prints nothing. The spec's `find` also names `bin`, which this tree does not have. Docs: no non-ASCII. |
| YAML | `yaml.safe_load` over 9 changed `.yml` | ok |
| Size | `wc -l` | longest source file 868 (`terminals.svelte.ts`), longest component 517 (`Workbench.svelte`) |
| Folders | `sh utils/folder-check.sh` | exit 0 (`kit/latex/` holds 8 items) |
| Unused exports | `sh utils/unused-exports.sh` against the base file | no diff |
| History words | grep of added comment lines and test titles | hits listed below, each judged |
| Failing lines on the unchanged tree | new/changed tests run against a scratch copy of the base src | 28 fail, listed below |
| Docs prose | greps for non-ASCII, spaced hyphens, em dashes and filler words over added doc lines | no hits in the added text |

Lines `checks.sh` printed on run 2:
```
$ npm run test:quick
test:quick: 100 changed file(s), from git since HEAD
test:quick: 119 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (1.6 s)
ok      svelte-check (5.2 s): ... COMPLETED 435 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.9 s): Duration  20.54s
test:quick: 24.4 s (limit 45.0 s); every command passed
checks: 1 commands passed
```
Run 1 was red on prettier for `config/catalogs/unimath.yml`, which prettier would spread from 2417 to 8717 lines. I added it to `.prettierignore`.

**What the green results do not cover:**
- `test:quick` does not run `tests/checks`, which I ran separately, or the slow tests.
- Nothing here ran with texlab installed or in a browser.

**History-word hits.** All hits are ordering or current state, not comparison with an earlier state: "before the page sees them" in `relay.ts` and `servers.ts`, "before it starts" in `approval.ts`, `pty-io.ts`, `latex-state.ts` and `model-machine.ts`, "the step still needs approved", "placeholder still in a text", "made before its first case", "Before any such build" in `LatexItem.svelte`, and "the clean before a retry" in `builds.ts`. Test titles carry "(case N)", as the existing titles do.

**Failing lines on the unchanged tree.** Run in `d43b/basecopy` (base src, my test files copied in, `node_modules` linked). 28 tests in 7 files fail:

| File | Failing | First failing line |
|---|---|---|
| `settings.test.ts` | 5 | `expected { value: { recipes: [], …(12) } } to strictly equal {…(15)}`; the texlab_path / unimath_symbols / includegraphics_preview rows: `to match object` |
| `servers.test.ts` | 2 | `expected [] to have a length of 1 but got +0`; `ENOENT … texlab/bin` |
| `lifetime.test.ts` | 1 | `expected [] to have a length of 1 but got +0` |
| `approvals.test.ts` | 5 | `TypeError: approveLatex is not a function` |
| `latex-approvals.test.ts` | 12 | case 28 `expected { resumes: null, task: true, …(14) } to be undefined`; 29, 30, 31, 33, 34, 37, 38, 39 `TypeError: Cannot read properties of undefined (reading 'texts' / 'latexmkrc' / 'weave')`; `not-a-main` `expected { error: 'not-an-action' } to deeply equal { error: 'not-a-main' }`; unreadable latexmkrc `expected 200 to be 400` |
| `config.test.ts` | 1 | `expected [ 'calendar.days_ahead', …(60) ] to deeply equal […(63)]` |
| `config-folder.test.ts` | 2 | `expected [ 'agents', 'apps', …(111) ] to deeply equal […(112)]`; `ENOENT … unimath.yml` |

The case 27 and case 35 rows pass on both trees, because on the unchanged tree a step with no gate starts at once, which is what those cases expect.

## Files (lines now; `n` = new file)
- **Config and catalogs:**
  - `config/catalogs/unimath.yml` 2417 n; `config/catalogs/options.yml` 1351; `config/behavior.yml` 264; `config/sources.yml` 137.
  - `config/text/findings.yml` 237; `config/text/statusbar.yml` 203; `config/text/views/academic/latex.yml` 211; `config/text/views/sources/source.yml` 134; `config/text/views/system/workbench.yml` 210.
  - `.prettierignore` 30.
- **Documents:**
  - `DESIGN.md` 579; `docs/configuration.md` 69; `docs/files-and-search.md` 109; `docs/views.md` 277; `docs/window.md` 82; `HELP.md` 188; `README.md` 48.
  - `docs/diagrams/`: 14 of 18 files regenerated.
- **Data and shared:**
  - `data/model/index.ts` 643; `model-machine.ts` 628; `data/prose/languages.ts` 162; `latex.ts` 599; `lsp-servers.ts` 262.
  - `data/shapes/catalog-files.ts` 400; `data/sources/config.ts` 100; `settings.ts` 809.
  - `catalog/latex-editing.ts` 36; `catalog/latex-tables.ts` 162.
- **Server:**
  - `content/latex/recipes.ts` 304; `edit/writes/config/config-checks.ts` 276; `machine/approvals/approvals.ts` 356.
  - `lsp/held/held.ts` 691; `held/process.ts` 253; `lsp/relay.ts` 852; `lsp/relay-options.ts` 53 n; `lsp/servers.ts` 741.
  - `lsp/adapters/texlab/adapter.ts` 79 n; `links.ts` 70 n; `settings.ts` 52 n.
  - `pty/latex/approval.ts` 217 n; `pty/latex/latex.ts` 388; `pty/routes.ts` 522.
  - `root/context.ts` 810; `root/watch/portfolio.ts` 681.
- **State and shell:**
  - `shell/commands/Asks.svelte` 13 n; `LatexAsk.svelte` 89 n; `shell/status/LanguageItems.svelte` 204; `LatexItem.svelte` 132; `shell/Workbench.svelte` 517.
  - `state/sessions/latex/builds.ts` 732; `latex-state.ts` 422; `latex.svelte.ts` 653; `pty-io.ts` 238; `terminals.svelte.ts` 868.
  - `state/shared/answers/answers.ts` 172; `state/sources/fs.ts` 63.
- **Editor kit and views:**
  - `kit/grammars.ts` 93; `kit/latex/latex-pictures.ts` 121 n; `kit/latex/latex-unimath.ts` 63 n.
  - `kit/lsp/client.ts` 693; `hosts.ts` 215; `transport.ts` 858; `transport/messages.ts` 142; `transport/records.ts` 42 n; `transport/roots.ts` 32 n.
  - `views/shared/latex/followed.svelte.ts` 54; `views/sources/files/sections/Outline.svelte` 282.
  - `views/sources/source/language/` `extension.ts` 64, `latex-editor.ts` 146, `lsp.ts` 571, `symbols.ts` 122.
  - `views/sources/source/latex/latex-tab.svelte.ts` 459.
- **Tests:**
  - `tests/checks/config/config-folder.test.ts` 628; `config.test.ts` 657; `tests/checks/source/keys.test.ts` 552; `tests/checks/tree/boundaries.test.ts` 757.
  - `tests/data/sources/config/settings.test.ts` 681; `wrong-settings.ts` 71.
  - `tests/routes/sessions/latex-approvals.test.ts` 476 n; `terminal-actions.test.ts` 528; `terminal-fixture.ts` 243.
  - `tests/server/machine/approvals/approvals.test.ts` 136; `lsp/choices.test.ts` 100; `lifetime.test.ts` 574; `lsp-fixture.ts` 299; `servers.test.ts` 229.
  - `tests/server/root/context-fixture.ts` 176.

## Id and key rule: what the code does
- **`latexmkrc:<sha256 hex>`** is a new key kind that collides with no other kind.
  - Its text is `JSON.stringify([repo real path, [[file real path, SHA-256 of its bytes], ...]])` in path order.
  - The set is every `.latexmkrc` and `latexmkrc` in the main's real folder and each folder above it up to the served root or hub, plus `$XDG_CONFIG_HOME/latexmk/latexmkrc` (else `~/.config/latexmk/latexmkrc`) and `~/.latexmkrc`.
  - A link is hashed by the bytes it leads to and listed under its own path. An unreadable file, a dangling link included, refuses the step with `latexmkrc-unread` naming it.
  - An empty set never asks.
  - The gate applies to a clean and to a plan holding a latexmk step. Tectonic, a pdflatex chain, `checkcites` and `stop` have no gate.
- **Weave text** is a `command:` key over `JSON.stringify({ repo, weave: [folder real path, [{name, command, args}, ...]] }, null, 1)`.
  - The `weave` member keeps it apart from a chain and a debug launch.
  - The text holds every tool of the recipe as `latex.tools` writes it, `latexmk` included. The ask lists only the weave ones (a program none of latexmk, latex, pdflatex, xelatex, lualatex, bibtex, biber, makeindex, makeglossaries, tectonic).
- **`approve-latex`** recomputes both texts. A shown non-null text that differs from the recomputed one is refused with `latex-changed` and nothing is written, whether or not that text is already approved.
  - `not-a-main` is refused when the main is not a main of the folder.
  - One `approveLatex` call writes both entries in one load and one store, so two approvals of one text write one entry.
  - An unreadable or unwritable file answers 409 `approvals-unwritable` with the reason, and neither entry is written.

## Judgment calls
- **`approve-latex` body.** The recomputation needs the step and the recipe, so the body carries `step`, `recipe` and `last` beside `main` and `texts`. The target is `id` or `root`+`path`, not a `target` object.
- **Case 9.** A non-string `texlab_path` reports kind `text` (not `path`).
- **Case 24.** There is no `alpha` row in the data. The entry is `upalpha`, with the glyph `α` and documentation naming "alpha". `\alph` fuzzy-matching `\upalpha` is a look item.
- **Test file split.** `terminal-actions.test.ts` would have been 933 lines (the check line is 900). I moved the approval rows to a new `tests/routes/sessions/latex-approvals.test.ts` with their own setup, and put the shared route options in `terminal-fixture.ts` (`latexRouteOptions`, `LATEX_PROJECT`, `latexHome`, `approvalsFile`).
- **`latexHomesFor`** is a new `TerminalOptions` seam so tests never read the reader's `~`.
- **`unimath.yml` and prettier.** `config/catalogs/unimath.yml` is in `.prettierignore`, with a comment.
- **Unused-export gate.** Exports used only by tests were un-exported to hold the baseline (`latexmkrcKey`, `latexmkrcSet`, `latexmkrcText`, `weaveText`, `escapedAlt`, `pictureAddress`, `pictureMarkdown`, `typedPath`, `withPictures`, `unimathItems`, the types `RcFile`, `RcSet`, `UnimathRow`, `LatexApproving`, `LINKED_PROGRAMS`, `linksFolder`). The approvals test builds its texts as literals, and the route test asserts the real server's latexmkrc and weave texts.
- **Other judgment calls:**
  - `readLatexUnimath` lives in `catalog/latex-tables.ts` (`catalog/` has 10 items). `latexUnimathFindings` lives in `latex-editing.ts`.
  - `isLatexLanguage` reaches the views through `state/sources/fs.ts`, since the views row of the boundaries test does not allow `data/prose/latex`.
  - `relay-options.ts` was split out of `relay.ts`, and `transport/roots.ts` and `transport/records.ts` out of `transport.ts`, to stay under 880 lines.
  - `Setup.resolved` and the facts `refusedExtensions` are internal additions.
  - A changed `latex.texlab_path` takes effect at the next start.
  - The unread-file state of `LatexAsk` has a Cancel button (`ui.confirm_cancel`) because no close word exists.
  - Unimath and texlab can offer the same command, since Monaco does not de-duplicate.
  - The LaTeX status item shows the approval of the followed root, or the longest-waiting entry when no root is followed.
  - A LaTeX tab also gets texlab-backed Find All References and disabled Call and Type Hierarchy items, like other servers.
  - `state/sessions/latex/actions.ts` (path 60) is unchanged, because a pressed clean that needs approval gives no error text, so `clean` there posts no toast.
- **Paths outside the brief's list that I touched:**
  - Test-and-check files: `tests/checks/source/keys.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/config/config-folder.test.ts`, `tests/checks/config/config.test.ts`, `tests/data/sources/config/wrong-settings.ts`, `tests/routes/sessions/terminal-fixture.ts`, `tests/routes/sessions/latex-approvals.test.ts`.
  - Config and docs: `.prettierignore`, `config/text/findings.yml`, `config/text/views/system/workbench.yml`, `docs/configuration.md`, `docs/window.md`.
  - Source: `src/lib/data/model/model-machine.ts`, `src/lib/data/model/index.ts`, `src/lib/data/prose/latex.ts`, `src/lib/data/sources/config.ts`, `src/lib/data/sources/config/catalog/latex-editing.ts`, `src/lib/state/sources/fs.ts`.

## Reader-visible before and after
- **`.tex` and `.bib` tabs.**
  - Before: D45's providers only, with the heading reader in the Outline.
  - After: texlab serves both, giving `\cite`, `\ref` and package completion, hovers, Go to Definition, References and Rename, problems for undefined references and citations, and the Outline tree once it answers.
  - texlab not found shows `texlab: not found`, with `brew install texlab` in the tooltip.
  - A `.bib` tab is language `bibtex` ("BibTeX" on the status bar), keeps the LaTeX extension, and a Markdown fence named `bibtex` is painted.
- **Build or clean with a latexmkrc or a weave tool unapproved.**
  - Before: ran at once.
  - After: a pressed Build or Clean opens `LatexAsk` listing the files and tools and starts nothing. "Approve and Build" or "Approve and Clean" writes the approvals and runs the step once.
  - An automatic build or clean waits, and the LaTeX status item is in the warning tone with `statusbar.latex_unapproved_tip`. A press on it opens the list.
  - A changed file gives `latex-changed` and the list is shown again. An unreadable one says it cannot be approved.
- **Two options.** `\` offers the Unicode math symbols with their glyph while `latex.unimath_symbols` is true (the default). `latex.includegraphics_preview` (default false) shows the picture beside a `.png` or `.jpg` file suggested inside `\includegraphics`.
- **New setting.** `latex.texlab_path`.
- **Root removed with a tab open.** The tab's requests are answered null and no "document is not open" reaches the console (case 1, for the look).

## Doc text (for `agents/guarded.md`)
**G55** (replaces the current text):
```
- G55. A language server, a LaTeX build's latexmk step and a weave tool run no code of a repository (its config files, its packages, its interpreter, its latexmkrc, its woven chunks) before the processes approval of that code.
  Code: `src/lib/server/machine/lsp/adapters/web/svelte-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/typescript-adapter.ts`, `src/lib/server/machine/lsp/adapters/web/approval.ts`, `src/lib/server/machine/lsp/adapters/web/config-files.ts`, `src/lib/server/machine/lsp/adapters/texlab/links.ts`, `src/lib/server/machine/pty/latex/approval.ts`, `src/lib/server/machine/pty/latex/latex.ts`, `src/lib/server/machine/pty/routes.ts` (the `approve-latex` action) and `src/lib/server/machine/approvals/approvals.ts`.
  Test: the current Svelte lines unchanged (`tests/server/machine/lsp/svelte-trust.test.ts`, tagged slow); `tests/server/machine/lsp/servers.test.ts`, 'links latex and kpsewhich to the programs its PATH finds, tectonic only when found, never latexmk, and drops a link whose program is gone'; `tests/routes/sessions/latex-approvals.test.ts`, describe 'POST /api/terminal, the approvals of a latex step', one `it` per row: 'starts a build and a clean at once when no latexmkrc is read (case 27)', 'answers what a .latexmkrc beside the main asks for, for a build and for a clean (case 28)', 'writes the approval under latexmkrc:<hex>, and the next build starts (case 29)', 'asks again when the file changed after the approval (case 30)', 'refuses an approval of texts whose files changed meanwhile and writes nothing (case 31)', 'refuses an approval for a file that is not a main of the folder', 'reads ~/.config/latexmk/latexmkrc without XDG_CONFIG_HOME and $XDG_CONFIG_HOME/latexmk/latexmkrc with it (case 33)', 'hashes a latexmkrc that is a link by the bytes it leads to and lists it by its own path (case 34)', 'refuses a step whose latexmkrc cannot be read, naming the file (case 34)', 'asks no latexmkrc approval for a recipe with no latexmk step, a checkcites or a stop (case 35)', 'asks once for a weave recipe per repository, folder and tools, and again for a changed tool (case 37)', 'asks for a recipe tool that runs a program of its own, and for none of the TeX recipes (case 37)', 'lists a weave recipe and an unapproved latexmkrc in one ask, and one approval writes both (case 38)', 'asks both of two pages that press Build at once, and two approvals of one text write one entry (case 39)'; `tests/server/machine/approvals/approvals.test.ts`, describe 'the latexmkrc and weave approvals of a LaTeX step': 'keys a latexmkrc set under latexmkrc: and the SHA-256 of its text', 'keeps the weave text apart from a chain and a debug launch under command:', 'writes both entries once, however many times the same texts are approved'.
```
**G36** (replaces the current text, with its Code and Test lines kept and one Test title added):
```
- G36. A language server oculus started ends: 60 s after the last tab of its root and language closed on a page, or the page closed, when no tab or page took it over; at once when its root is no longer served; and with the oculus server. None is started twice for one page and root: one pyright serves a page's Python tabs of a root, one clangd its C and C++ tabs, one TypeScript server its TypeScript and JavaScript tabs, one Svelte server its Svelte tabs, one yaml-language-server its YAML tabs (a `.yml` and a `.yaml` tab of one root share it) and one texlab its LaTeX and BibTeX tabs (a `.tex` and a `.bib` tab of one root share it).
  Code: `src/lib/server/machine/lsp/held/process.ts`, `src/lib/server/machine/lsp/relay.ts`.
  Test: `tests/server/machine/lsp/lifetime.test.ts`, describe 'the life of a language server', the current rows and 'is one texlab for a tex tab and a bib tab of one root on one page, which ends 60 s after the last closed'.
```
Titles added under other entries:
- G7: `servers.test.ts`, 'starts texlab by its absolute path with no arguments, the root one working folder whatever it holds, and the links folder as its whole PATH'.
- G13: `settings.test.ts`, the `texlab_path`, `unimath_symbols` and `includegraphics_preview` rows of 'latexBuild'.
- G31: `approvals.test.ts`, 'refuses to write over an approvals file that is not JSON and leaves it (case 32)' and 'writes neither entry when the file cannot be written, and names the reason (case 40)'.

## Wrong or impossible in the brief
- **Case 24.** `\alph` cannot offer `\alpha`: the data has no `alpha` row, only `upalpha` and its kin.
- **Cases 28 and 29.** The approval body needs `step`, `recipe` and `last` beside `main` and `texts`. The target is `id` or `root`+`path`.
- **Placement of the approval rows.** The brief puts them in `terminal-actions.test.ts`, which would pass the size line. The rows are in `latex-approvals.test.ts` instead.
- **Report file.** The brief says to write `D43-report.md`. This message is the report.
- **ASCII gate command.** The spec's `find` names `bin`, which does not exist in this tree.

## Next
The orchestrator installs texlab (`brew install texlab`), then the look on TEST covers the page-only cases above and the new ask dialog.
