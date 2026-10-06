# Step D14 brief check (brief read from disk, uncommitted; tree at f39fc8ed)

The brief says "on main at 9ec1e8ef". Main is now f39fc8ed (`git log --oneline 9ec1e8ef..HEAD` prints two ledger commits, Q35's prepare and launch). `git diff --stat 9ec1e8ef HEAD -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/package.json` prints nothing, so every premise below holds for either commit. `plan.md` has no "Goal" heading; I used its opening paragraph, the D14 line (`plan.md:412`) and the Rulings section as the goal. I opened no `local.yml`, read no `.vscode`, started no server and ran no git command that writes. Throwaway probes ran only under `$TMPDIR`.

## 1. Names

Names the step changes, each grepped over `src tests config HELP.md DESIGN.md README.md docs utils bin` with `--exclude=local.yml --exclude-dir=node_modules --exclude-dir=.scratch`: `latexCommand`, `startLatex`, `latexName`, `LATEX_STEPS`, `LatexStep`, `MANUSCRIPT`, `buildState`, `LatexAnswer`, `LatexTarget`, `handleLatex`, `latexState`, `MainState`, `LatexMain`, `LatexStore`, `createLatex`, `declaresClass`, `parseLog`, `api/latex`, `.latex(`, `project.latex.*`, `files.menu_*`, `server.latex.name`. The new names `rootOf` (only a test-local helper at `tests/state/workbench/navigation/arrangement.test.ts:591`), `mainsIn`, `auto_build`, `texcount`, `chktex`, `latex-utensils`, `menu_open_latex` and `views.latex` have no hit, so nothing collides.

Hits outside "Paths this step writes" that the change touches:

- `tests/routes/sessions/latex.test.ts:9-11,31,56-96` imports `handleLatex`, `LatexTarget`, `LatexAnswer`. `LatexTarget` must gain a root list for item 2, so this file changes. It is not in the paths.
- `tests/routes/sessions/terminal-actions.test.ts:228-306` holds the `latex` action tests, including `latexmk -pdf ... 'main.tex'` at 286. The brief calls them "the pty routes' latex tests" without a path.
- `tests/views/boards/project.test.ts:330-450` renders the project panel (`project.latex.build`, `.clean`, `.errors`, `.warnings`, `.open_pdf_tip`). Item 5 moves those rows into a shared component. Not in the paths.
- `src/routes/api/(sessions)/terminal/+server.ts` builds the `handleTerminal` options. `TerminalOptions` (`pty/routes.ts:101-115`) has `projectFor`, `hubFor`, `localFor` and no list of roots, so item 4's `root`/`path` form needs a new option passed from this file. `ls "src/routes/api/(files)/ops"` and its `+server.ts` show the pattern (`browserRoots(...)`). Not in the paths.
- `src/lib/views/sources/files/tree/Tree.svelte:430` is the only caller of `rowFacts` (`grep -rn rowFacts src`). `rowFacts(row, fixed, addable, explorer, languages)` has no listing argument, so item 6's "a folder whose held listing has a .tex file" needs a new argument and a change at this call site. Not in the paths. The component is 528 lines of the 540 limit (`wc -l`).
- `tests/checks/tree/allow-duplication.txt:46` names `tests/server/content/latex.test.ts` (an 11-line clone at lines 18 and 22, keyed by hash).
- `tests/checks/config/config-folder.test.ts:208-215` lists `CATALOG_FILES`. A new `views/academic/latex.yml` (the Slides view has `config/text/views/academic/slides.yml`) would need a row there.
- `tests/state/client/queries.test.ts:245` (`client.latex.state('')`) and `client-state.test.ts:28`. They stay true only if `state(id: string)` keeps its string form. Items 5 and 12 say "beside" without stating it.
- Catalog files: the brief's "the catalog file under `config/text/` that holds `project.latex.*` and `files.menu_*`" names one file. They are three: `config/text/views/boards/project.yml:112` (`project.latex.*`), `config/text/views/sources/files.yml:67-69` (`files.menu_*`), and `config/text/server.yml:40-41` (`server.latex.name`). The new view's own words (its label and glyph key, as `config/text/views/academic/slides.yml` ends with `views: slides: Slides, slides_glyph: section`) need a group in one file.
- `DESIGN.md:23` says "no lint panel and no other debugger". `DESIGN.md:394` and `HELP.md:150,154` are the LaTeX passages. The brief gives no line numbers, and the template asks for ranges numbered as on main.
- "Paths this step writes" puts several paths on one line (items for `Editor.svelte` plus `kit/`, the `config/` files, `package.json` plus lock, `DESIGN.md` plus `HELP.md`). The template says one path per line.

Findings (hits the change makes false or leaves unlisted):

1. `DESIGN.md:23` ("no lint panel") is made untrue or contested by item 10 (see check 4, finding C8). It is not in the paths.
2. The paths omit `src/routes/api/(sessions)/terminal/+server.ts`, `views/sources/files/tree/Tree.svelte`, `tests/routes/sessions/latex.test.ts`, `tests/routes/sessions/terminal-actions.test.ts` (unnamed), `tests/views/boards/project.test.ts`, `tests/checks/tree/allow-duplication.txt` (line 46) and, if a catalog file is added, `tests/checks/config/config-folder.test.ts`.
3. The catalog path line names a file that does not exist; the files are `views/boards/project.yml`, `views/sources/files.yml` and a place for the new view's words.
4. `DESIGN.md` and `HELP.md` carry no line ranges. The passages are `DESIGN.md:394` (and 23), `HELP.md:150,154`.

Overlap with steps in flight (from each brief's "Paths this step writes"; for the orchestrator's judgement):

- `src/lib/server/machine/pty/routes.ts`: D35 (item 9 of its brief) makes `hubFor`/`localFor` required and removes `loadLocalOrDefaults` from the pty routes. Today `routes.ts:183,296,338,407` use it, and 407 is inside `startLatex`, which D14 rewrites. `TerminalOptions` (101-115) is changed by both. `src/routes/api/(sessions)/terminal/+server.ts` is changed by both (D35's call lines, D14's new roots option).
- `src/lib/views/sources/source/Source.svelte`: Q85d (the instance-state readers, their imports, the `<script module>` block), Q66 (the gutter effect 210-222 and its import), D14 (save at 310-312, its import, and the hover props).
- `src/lib/state/sessions/latex.svelte.ts`: Q66 (comments at lines 12 and 141), D14 (rewrites the store).
- `package.json`, `package-lock.json`: L4 (`interactjs`).
- `config/catalogs/options.yml`: D35 (descriptions 124-262, from 585), L4 (the `floats` entry after `arrangements` at 336), D14 (one entry, place unstated).
- `DESIGN.md`: D35 224-235, L4 210 and 358-365, Q66 194, Q35 367 and 378, against D14's 394 (and 23). `HELP.md`: D35 216 and 236, L4 27-45 and 127, Q35 120, against D14's 150 and 154. Disjoint.
- `docs/diagrams/`: all steps (regenerated).
- Q85d also lists `tests/views/boards/project.test.ts` (new cases), which D14 edits.

## 2. The step line

- "D5's panel attached to any folder holding a `.tex` main file (funding texts, responses, grant documents)": items 1, 2, 4, 5. The real tree has such folders (probe output in check 3).
- "opened from the file browser": item 6.
- "several mains per folder each with its own build, clean and log": items 1, 4, 5. The Log control is in item 4 and in the row list of item 5.
- "(Axel 2026-09-26, library audit: the outline ... through `latex-utensils`)": item 8.
- "root and magic comments through `latex-utensils`": no item. Items 1 and 3 read magic comments and root by hand, and "Libraries checked" says "magic comments (one line each, read by `latex.ts`) ... stay hand-written". The ruling row (`agents/reviews/library-audit.md`, LA18 table: "D14 | LaTeX outline, root and magic comments | latex-utensils 7.0.0 ... | adopt", followed by "Lazy option in each row: the hand-built alternative") names the library for these two and calls the hand-built version the lazy option. Evidence that there may be a reason: a probe of `latexParser.parse` (installed under `$TMPDIR` from `npm pack latex-utensils@7.0.0`, no `npm install` in the repo) over every `.tex` under `funding applications projects` printed `{ ok: 227, bad: 4, slow: [] }`, the refused files including `funding/2024-fwo-postdoc-fbttr/fwo-postdoc/main.tex` (a real main of a folder the brief cites). Also the default parse drops comment nodes (`latexParser.parse('% !TEX root = ../a.tex ...').content` held no comment node; `enableComment` is an option). The brief records none of this as a decision.
- "`texcount` and `chktex` run as processes": items 9 and 10.
- Parity rows (`vscode-parity.md` "LaTeX"): build on save, item 7. Recipes, magic comments, root detection: items 1 and 3, decision 4 (the recipe cut has its reason). Errors and warnings with file and line, a list that opens each: item 5. Outline: item 8. Hover preview of math and images: item 11. Word count: item 9. The row "Formatting, linting (ChkTeX)": item 10 lints; formatting has no item and no reason. `command -v latexindent` prints `/usr/local/texlive/2025/bin/universal-darwin//latexindent`. The inventory's own rule is "a row left out by a brief says why".

Findings:

- S1. Root and magic comments are hand-written against a ruling that names the library for them (and names the hand-built version as the lazy option). Either the items use `latex-utensils` for them, or the departure (with the 4-of-231 refusal evidence) is put to Axel as a decision. A hybrid is possible: parser for sections, includes and comment nodes, with a fallback.
- S2. The parity row "Formatting, linting (ChkTeX)" has no item for formatting and no stated reason.

## 3. Premises

Commands run and what they printed:

- `wc -l` of the six files: `latex.ts` 347, `pty/routes.ts` 558, `latex.svelte.ts` 204, `terminals.svelte.ts` 887, `Latex.svelte` 247, `row-menu.ts` 276. Matches.
- latex.ts content (read in full): `mains`, `declaresClass`, `head` with `HEAD_BYTES = 65536`, `FIRST = 'main.tex'`, `parseLog`, `buildState`, `latexState` (400 / 404 / 404), `NO_STORE` on every answer. Matches.
- `pty/routes.ts`: `grep -n` prints `latexCommand` at 363, `startLatex` at 383, `latex` action at 483, `LATEX_STEPS` at 80. Matches, except the brief's `startLatex` range `:376-426`: the doc comment starts at 378 and the function ends at 428 (`awk` over 374-430).
- `terminals.svelte.ts`: `latex(id, main, step)` is at 542-550 with its doc comment from 537; the type at 137-143. The brief says `:540-549` and "lines 137 and 540-549". Off by two to three lines.
- `latex.svelte.ts`: `createLatex(entities, terminals, fs, queries)`, key `['latex', id]`, `redraw` calling `fs.bump(HUB_ROOT, ...)`. Matches.
- `Latex.svelte`: rows, Build, Clean, Open PDF, errors disclosure, warnings count. `Project.svelte:44,187` (`import Latex`, `<Latex {id} />`). Matches.
- `openSourceFile(client, { root, path, line })` is at `views/shared/links/source-file.ts:16`, called at `Search.svelte:69` inside `open` (67-70). `Source.svelte:310-312` is `save()`. Matches.
- KaTeX: `package.json:68` `"katex": "^0.18.7"`, installed 0.18.7; `markup.ts:15-16` imports `katex` and its css. Matches.
- Binaries: `command -v latexmk texcount chktex` prints three paths under `/usr/local/texlive/2025/bin/universal-darwin/`; `latexmk -v` prints 4.86a; `chktex --version` prints 1.7.9. Matches.
- Folder room: `git ls-files` item count gives `server/content` 8, `state/sessions` 10, `tests/server/content` 4, `tests/views/academic` 3, `ui/controls/editor` 10, `editor/kit` 8. **`src/lib/views/academic` holds 2 (`present`, `slides`), not 1.** Adding `latex/` makes 3, so nothing breaks.
- Real folders: my probe (`$TMPDIR/probe.py`, the rule of item 1, over `funding applications projects`) printed `folders with a main 82 several 24 outside manuscript 56`, and printed `funding/2024-fwo-postdoc-fbttr/fwo-postdoc ['main-old.tex', 'main.tex']` and `applications/archive/rejected/2025-maynooth-cs-zap ['motivatie.tex', 'onderwijs.tex', 'onderzoek.tex']`. `grep -l` shows `funding/2026-nwo-enw-xs/proposal-ls/main.tex` and `funding/2026-fwo-senior-meyfroidt/concept-note/concept-note.tex` declare a class. Matches.
- `% !TEX root`: `grep -rIl --include='*.tex' -E '^\s*%\s*!\s*[Tt][Ee][Xx]\s+root' funding applications projects | wc -l` prints 16. The 16 files all spell it `% !TeX root = ../../thesis.tex`; `abstract.tex` has the trailing space. Matches. Zero files carry a `program` comment (`grep ... program | wc -l` prints 0).
- `latex-utensils`: `npm view latex-utensils version license time.modified maintainers` prints `7.0.0`, `MIT`, `2026-04-14T09:09:17.397Z`, `tamuratak`; `dependencies` empty; `main = ./out/src/main.js` (CommonJS). Matches. The probe confirms names `section`, `section*`, `subsection`, `paragraph`, `part`, `input`, `include`, `subfile`, `import` (two group args) and 1-based `location.start.line`.
- `chktex -q -v0 -f $'%f:%l:%c:%n:%m\n' m.tex` over a file with `a ... b` printed `m.tex:3:9:11:You should use \ldots ...` (code 11) with exit 2, and a second file reached through `\input` printed `sec/b.tex:1:7:11:...`. "chktex follows `\input` by itself" matches. With the format written `'...\n'` in a shell, the `\n` is not translated (output shows literal `\n`); in a TypeScript string it is a newline, which is what is needed.
- `latexmk -h` lists `-pdf`, `-pdfxe`, `-pdflua`, `-c`. Matches.
- `.latexmkrc`: `find funding applications projects -name '.latexmkrc' -o -name latexmkrc` prints nothing.
- No `docs/adr` (check 7).

Findings:

- P1. "`src/lib/views/academic` holds 1 item (`present`)" is 2 (`present`, `slides`).
- P2. Line ranges `startLatex :376-426` (actual 378-428) and `terminals.svelte.ts :540-549` (actual 537-550) are off.
- P3. The brief says the Z192 decisions "are booked in `plan.md`'s Rulings". `grep -rn "Z192" tools/oculus/.scratch/migration` prints nothing in `plan.md`, `orchestrator-state.md` or `choices.md` (Z193 and Z195 are in `choices.md`; Z194 appears only in `briefs/D17.md`). They are not booked.
- P4. The catalog premise (one file for `project.latex.*` and `files.menu_*`) is false (check 1).
- P5. Sizes the brief does not state and the builder will hit: `Editor.svelte` 518 of 540, `Tree.svelte` 528 of 540, `Source.svelte` 477 of 540 (`wc -l`); `terminals.svelte.ts` 887 of 900 is stated.

## 4. Cases and checks

Each case against `agents/spec.md` and `DESIGN.md`:

- Cases 1, 2, 3, 4, 6, 7, 10, 11, 12: consistent with the rules file. Case 3 does not cover "neither id nor root" (the existing test `tests/routes/sessions/latex.test.ts:56` covers "no id" only), an unknown root key (`resolveRootPath` answers `outside`, so 404, which item 2 does not name), or a `root` without a `path`.
- Case 5 calls `latexCommand('build', 'm.tex', 'xelatex')`, a private function (`routes.ts:363`, no `export`). The existing tests reach it through `handleTerminal`. Not a conflict; the builder exports it or tests through the action.
- Case 8 is inconsistent with the real program. `texcount -inc -total -sum -brief -utf8 missing.tex` printed `!!! File not found or not readable: missing.tex !!!`, `0`, ` (errors:1)` with exit 0. A file with `\input{nothere}` printed `!!! File nothere not found in path [./]. !!!`, `1`, ` (errors:1)` with exit 0. A non-UTF-8 file printed `!!! File/text was not valid utf8 encoded. !!!`, `2`, ` (errors:1)` with exit 0. Item 9's "first integer of its output" is then a digit from the file name in the `!!!` line (a main named `chapter2.tex`), and its "502 with the process's error line" never fires, because the failure is on stdout with exit 0. A stub that exits non-zero does not model the program.
- Case 9: the real `chktex` case is skipped when `chktex` is not on PATH, so it can pass by skipping (the skip is printed, as the brief says). The stub case has two lines and does not check the root-relative file mapping of item 10 ("files relative to the root"), since the real `%f` is relative to the process's working folder (`sec/b.tex` above).
- Case 13 does not say where the logic lives or at what layer it is tested. `Source.svelte`'s save is a button press (`save()` at 310; the only save path, `grep saveSourceDraft` shows one caller), and `agents/spec.md` says the unit suite renders to a string and a press is seen at the look. If the logic sits in the component, the case cannot run as a test.
- Spec rule "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key": `latex.auto_build` has no case for an empty or other value, though item 7 says any other value counts as `on_save`. The view's instance state `{ root, path }` and the store key `['latex', root, path]` are not exercised empty or colliding with the `['latex', id]` key (case 15 covers an empty path only for mains).
- Spec rule "Every asynchronous path is exercised in flight, after close, and superseded by a later one": none of cases 1 to 19 does this for the outline, Count Words and Lint requests (a view closed or a Count Words pressed twice while a request is out), the build-on-save `rootOf` request (a second save while the first is out), or the store fetch for a folder target.
- Spec rule "A value from the hub or a feed that reaches HTML or a shell is untrusted": `outline=`, `count=` and `lint=` take a `<main>` from the query string and reach `texcount`/`chktex` arguments. Item 4 checks the main against `mainsIn` for the build, but items 8, 9 and 10 do not say the main is checked, and no case names a value that is not a main (`../x.tex`, a name starting with `-`). The hover builds an `<img>` source from `\includegraphics{<path>}` text in the file; no case names a path with a quote, `..` or an absolute path.
- `DESIGN.md:148` ("Untyped input": a value from outside the process is checked with a zod schema beside the reader in `server/content`, `server/machine`, `state/`) is not named by the brief ("The plan names no further standards"). The step adds the terminal message fields `root`/`path`, the query parameters, `texcount`/`chktex` output, and three new response shapes read by the store. Q85d, in flight, is applying this rule to the views.

Findings:

- C1. Case 8 and item 9 get the real `texcount` wrong (exit 0, errors on stdout). The brief's own rule needs a decision on how a failure is read and cases built from the real outputs above.
- C2. Items 8 to 10 do not say the `<main>` parameter is checked against `mainsIn`; no case for a non-main value.
- C3. No case for in flight / after close / superseded on the new asynchronous paths (spec rule).
- C4. Case 13 has no testable home; the rule for `latex.auto_build` empty or other value has no case.
- C5. The brief's "Look items" say "the project panel unchanged in what it shows", while item 5 says the project panel draws the shared rows, which carry Log, Count Words, Lint and the outline. The two statements disagree about what the project panel shows afterwards. The project form (`?id=`) also has no `outline`, `count` or `lint` forms (item 2 says `?id=` answers as today), so the shared rows have no target for those controls in the project panel.
- C6. `DESIGN.md:148` is not named; the new inputs have no stated validation (a builder following only the brief writes casts or hand checks that Q85d is removing).
- C7. Decisions 4, 5 and 6 of "Decisions taken in this brief" (no recipe list, build on save not shown, Count Words and Lint on a press) are user-visible behaviour and carry no Z id and no booking, as the brief claims for 1 to 3. The wire shape of item 4 (the `latex` action taking `root`/`path`, the `program` field on `MainState`, the `skipped` list of the outline answer) is not in any decision either (Z192 (2) names the GET forms only).
- C8. Rulings. `plan.md:592` (Rulings, 2026-09-13 00:45, Axel): "not built by his word: ... lint integration ... a lint panel", and `DESIGN.md:23` repeats "no lint panel". Item 10 builds a ChkTeX Lint whose issues join a problem list. Later rulings name ChkTeX (P1's parity row "Formatting, linting (ChkTeX) | none | D14", and the LA18 row "`texcount` and `chktex` as processes"), but neither the 09-13 ruling nor `DESIGN.md:23` is mentioned in the brief. This is two established rulings that collide; it is the user's to resolve, or the brief must cite the ruling that lifts the earlier one and carry `DESIGN.md:23` in its paths.
- C9. Duplicated work with X3a. `plan.md:176` (Z182 (a)): "X3a builds the Outline from Markdown and LaTeX headings." Item 8 builds a LaTeX section outline with `latex-utensils`. Neither brief says which one owns the parser, and `agents/spec.md` ("a parser, a fold or a rule exists once and is reused") applies. `grep -rli outline src` finds no outline in the tree yet, and X3a is not landed.
- C10. The new view reads its instance state `{ root, path }`. Q85d (in flight) is moving the per-view readers to `instanceText`/`instanceMap` in `state/workbench/layout/instance.ts`. The brief does not say how the new view reads it (a clone of the readers Q85d is deleting, or the new exports).
- C11. Item 11's hover needs a callback from the page (the ui layer imports no state and no view; image resolution uses `rootOf` and the file route). `Editor.svelte` is a `ui/` primitive; the brief lists `Source.svelte` only for "the save at 310-312 and its import", so the props that pass the callbacks are outside the stated lines.

## 5. The question

"The goal" is the part of the plan line D14 delivers: the panel on any folder with a main, opened from the file browser, several mains each with build, clean and log, plus the outline, root and magic comments, word count, lint, hover, build on save and a problem list.

Cases:

- 1 no. 2 no. 3 no. 4 no. 5 no (case 6 covers the wiring). 6 no. 7 no (the refusal path is untested, see check 6).
- 8 yes: it passes with a stub while the real `texcount` exits 0 on errors (check 4).
- 9 yes: it passes with a stub, and by skipping when `chktex` is absent.
- 10 yes: it passes with no widget drawn; only the look covers the hover.
- 11 no. 12 yes: it passes with no view drawn. 13 yes unless it is placed in a layer that exercises the save.

Items of "What to build":

- 1 no (cases 1, 2, 14, 15). 2 no (3, 15). 3 no (4, 17). 4 no (5, 6, 14).
- 5 yes: no case defines the problem-list order, the place text, the press-to-open, the Log control, the outline closing, so a view that draws rows only passes (the render test file is in the paths with no case behind it).
- 6 no (11). 7 yes (see case 13). 8 yes for the drawing (case 7 covers the server only). 9 yes (case 8). 10 yes (case 9).
- 11 yes: case 10 covers the finder only; the image path resolution (`.pdf, .png, .jpg, .jpeg` order, main folder or file folder) has no case.
- 12 yes: no check fails if the docs are not changed (the spec's grep rule is the only guard).
- 13 no: a missing import fails `npm run build`.

The step line's check, "Verify before you report" 1 to 4, is the suite plus the checks script: it cannot fail for a wrong view; the look items cover the DOM items, so the findings above are limited to what a string render can assert.

Findings: Q1 (items 5, 8-drawing, 11-resolution have no case with a result), Q2 (cases 8, 9, 10, 12, 13 as above), Q3 (item 12 has no check).

## 6. Implied inputs

Code step. Inputs the step implies and the brief leaves out of "Cases" (expected results are mine as proposals):

- I1. `outline=`, `count=`, `lint=` naming a file that is not a main, `../x.tex`, an absolute path, or a name starting with `-`: 400/404, no process started.
- I2. `texcount` reporting failure on stdout with exit 0 (outputs above): a 502 with the `!!!` line.
- I3. `texcount` or `chktex` not installed (spawn error ENOENT, no stderr line), and the 20 s timeout: the status and message are unstated (item 9 says "502 with the process's error line"; ENOENT has none).
- I4. A `chktex` line that does not split into five fields, a message or a file name holding `:`; a missing file (`chktex ... missing.tex` printed `chktex: WARNING -- Unable to open the TeX file` and exited 0): the issue list is empty or 502.
- I5. The outline of a file the parser refuses: 4 of 231 real `.tex` files (`funding/2024-fwo-postdoc-fbttr/fwo-postdoc/main.tex` among them) throw a `SyntaxError`. Item 8 defines `skipped: [<file>]`, but case 7 has no refused file. Also `\import{dir/}{file}` (two group args) and a `\input` that names a file outside the root.
- I6. Build on save: the save fails (`saveSourceDraft` returns `Promise<void>`; the outcome is only in the draft's `message`/`failed`), the `rootOf` request fails, a second save while the first request is out.
- I7. A folder `.latexmkrc` that sets `out_dir` or `aux_dir`: `buildState` reads `<base>.pdf` and `<base>.log` beside the main (no such file on the tree, so a theoretical hazard).
- I8. Hover: hostile math (`\href`, `\htmlClass` with `trust` false), an `\includegraphics` path with a quote, `..`, an absolute path or no existing file.
- I9. Place of a problem row: the log's `file` is relative to the build folder (`relFile` in `latex.ts:211`), chktex's file is relative to the main's folder, item 10 says root-relative, and item 2 gives `pdfPath` relative to the root for the folder form but to the project folder for `?id=` (`Latex.svelte:openPdf` joins `held.folder` and `pdfPath` under `HUB_ROOT`). The shared rows need one rule; the brief gives none.
- I10. Lifetime of Lint issues (kept until the next Lint, the next build, an edit?). Item 9 states it for the word count only.
- I11. `% !TeX root` is spelled `!TeX` in all 16 real files. Item 1 states the case rule for `program` only; item 3 and case 4 write `% !TEX root`. One reader for both comments should be stated.
- I12. `root` or `path` alone on `GET /api/latex`, and an unknown root key.

Findings: I1 to I12 are missing from "Cases".

## 7. ADRs

- `ls tools/oculus/docs/adr docs/adr` (from the repository root) prints `ls: docs/adr: No such file or directory` and `ls: tools/oculus/docs/adr: No such file or directory`. `find . -iname '*adr*' -type d` (excluding `node_modules`, `.git`, `.agents/worktrees`) prints nothing. `.agents/plan.yaml` has no `adr:` key (`grep -n adr` prints nothing). No record.
- Findings: none. The brief's statement matches.

## Declined to judge

- Whether the Z192 decisions and decisions 4 to 6 may be ruled in automode. The Self-rule text is not in the `plan-orchestration` skill file I could read (`ls` shows `SKILL.md` only and `grep -i "self.rule"` prints nothing); whether a config key and a new view name are among the kinds left to Axel is the orchestrator's reading.
- C8 and S1 are the user's call (a ruling clash and a departure from a library ruling); I report them with the evidence only.
- "As LaTeX Workshop reads them" (magic comments only in leading lines, and whether it also reads `TS-program`): checking needs a fetch, which the rules forbid.
- Whether the running oculus server has `texcount` and `chktex` on its PATH. `command -v` is for my shell; checking would need a server.
- Behaviour that needs a DOM (the hover widget, the menu entry, the view, the tab name) and the look items.
- Performance of `latexParser.parse` at 2,000 sections: not measured. Parsing all 231 real `.tex` files took under 1.5 s each (no entry in `slow`).

Agent usage: claude-sonnet-5-5 (my own model name; the runner's record is the session's to read), about 255,000 tokens (the context counter fell from 15,000,000 to 14,738,713 at the last read), about 85 tool uses (my own count), minutes not measured.

Usage (from the completion notice): claude-sonnet-5-5, 272,742 tokens, 109 tool uses, 15.3 min.

## Closed (2026-10-02, /spec D14 on main at 125203b5)

- Names 1: `DESIGN.md:23` is D36's under Z196 (b); D14 builds no lint. Names 2 to 4: the omitted paths, the catalog files and the DESIGN.md and HELP.md ranges are in "Paths this step writes".
- S1: magic comments, root and sections on `latex-utensils` (Z279), the comment block parsed alone (decision 5), a refused file listed in `skipped`. S2: formatting is item 12 (Z278, `tex-fmt`), lint is D36's (Z196).
- P1: `views/academic` holds 2, stated. P2: the ranges re-read at 125203b5 (`startLatex` 378-428, `latex` 537-550). P3: Z192 booked in `plan.md` Rulings, the state file's closed log and `choices.md`. P4: the catalog files named. P5: the sizes of `Editor.svelte`, `Tree.svelte`, `Source.svelte` stated with their limits.
- C1: item 10's failure rule from the real outputs, case 8 built from them. C2: item 14, case 9. C3: case 13's in-flight, after-close and superseded cases, case 14's second save. C4: `onSaved` in the store, a state test (case 14), `''` and another value counted as `on_save`. C5: the project panel shows the shared rows, the project form gains `outline` and `count`. C6: `DESIGN.md:148` named and zod required. C7: decisions 4 to 6 booked under Z192, the wire shapes listed as decision 2. C8: Z196 (b). C9: one reader (Z279), the Files Outline through it, case 17. C10: `instanceText`. C11: the props through `Source.svelte` named in the paths.
- Q1 to Q3: cases 11, 13, 15, 16, 19 and the look items; the docs remain a read at landing.
- I1: case 9. I2: case 8. I3: case 8 (missing, timeout). I4: lint is not built. I5: case 7. I6: case 14. I7: no `.latexmkrc` on the tree sets `out_dir` (`find` printed nothing); not built. I8: item 11 (`trust: false`), case 11. I9: decision 3. I10: lint is not built; the word count lasts until the next build (item 10). I11: item 3 reads `!TEX` in any case. I12: case 3.
