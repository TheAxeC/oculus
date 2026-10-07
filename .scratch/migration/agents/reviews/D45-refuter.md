# Step D45 refuter report (on .agents/worktrees/D45, base f8e54615)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/D45/tools/oculus` with Node v24.21.0 first on PATH.

```
npm run diagrams
  exit 0; md5 of `git status --short` identical before and after
npm run test:quick -- --base f8e54615
  test:quick: 176 changed file(s), from git since f8e54615
  test:quick: 105 test file(s), 10 essential
  ok ASCII gate, prettier, svelte-kit sync, eslint
  svelte-check ... 414 FILES 0 ERRORS 0 WARNINGS
  vitest (17.1 s): Duration 14.26s
  test:quick: 17.7 s (limit 45.0 s); every command passed
npx vitest run tests/checks --reporter=dot --testTimeout 600000 --hookTimeout 600000
  Test Files  1 failed | 16 passed (17)
  Tests  2 failed | 241 passed (243)
  (the 2 are the "real hub" tests of tests/checks/config/integrity.test.ts; the worktree has no deck/)
npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/data/sources/config/settings.test.ts tests/checks/config/config.test.ts tests/views/sources/bar-actions.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts tests/routes/sessions/latex.test.ts tests/checks/tree/boundaries.test.ts
  Test Files  7 passed (7)
  Tests  123 passed (123)
sh utils/folder-check.sh
  exit 0
sh utils/unused-exports.sh, compared by file and name with D45-base's unused-exports.txt
  no new name; removed: latexCommand, the old latex.svelte.ts types, sourceFileUrl, ROW_LATEX
line limits over every changed or new file under src (880 source, 520 component)
  no file over
ASCII gate over src, tests, config: 0 lines
LC_ALL=C grep '[^ -~]' DESIGN.md HELP.md docs/*.md: 0 lines
grep -rIn --exclude=local.yml -E "fileUrl\b|file-url|sourceFileUrl|fileAddress|ROW_LATEX|menu_latex|autoBuildShape|Open in Browser Tab" src tests config docs HELP.md DESIGN.md
  0 lines
history-word scan over added lines (previously|formerly|used to|no longer|originally|revert|legacy|the old|renamed|migrat|workaround|hack|D<nn>|Z<nnn>|bug|regress|temporary|for now|TODO)
  5 hits, each a description of present behaviour ("leaves the old document shown", "no longer holds" of the docs list, "Revert File")

Case 5, the builder's probe (scratchpad/d45-builder/probe/root-cases.mts), four runs:
  max per run: 7.0 ms | 145.0 ms | 206.7 ms | 202.4 ms ("3 body")
Case 1 fall-through, my probe on $TMPDIR (folder f with one main and dead root comments):
  miss {"main":"f/main.tex","how":"folder"}
  out  {"main":"f/main.tex","how":"folder"}
  md   {"main":"f/main.tex","how":"folder"}
  a (cycle a<->b) null
Case 6, my probe (planOf over a copy of config/ without local.yml, shellWord-joined, then sh -c in $TMPDIR/.../sp ace):
  default latexmk :: 'latexmk' '-synctex=1' '-interaction=nonstopmode' '-file-line-error' '-pdf' '-outdir=<T>/sp ace' '-auxdir=<T>/sp ace' '<T>/sp ace/my thesis'"'"'s'
  program xelatex latexmk (xelatex) :: same with '-xelatex'
  LW chain pdflatex -> bibtex -> pdflatex * 2 :: four commands joined by &&
  LW unknown {"refused":"latex-recipe","names":["nope"]}
  exit 0; pdf true synctex true
Cases 14, 15, 16, 23, the builder's endpoint probe over a fresh $TMPDIR build (config from the copied folder):
  14 forward chap/one.tex:3   200 {"places":[{"page":1,"x":150.926254,"y":156.585541,...}]}
  14 forward line 99          200 two places
  14 forward file not in build 200 {"places":[]}
  15 inverse 1:151:157        200 {"source":{"file":"chap/one.tex","line":3}}
  15 inverse stale copy       403 {"error":"synctex-outside"}
  14 forward, no synctex file 404 {"error":"synctex-no-file"}
  16 ../../x out_dir / aux_dir {"refused":"latex-folder","names":["latex.out_dir"]} / [...aux_dir]
  23 texdoc a;b, ../x, empty  400 {"error":"texdoc-name"}; amsmath 200; stub log: -I amsmath
Project panel paths with an output folder, my probe (buildStateIn with out = manuscript/out, then stateOf for a project target):
  server pdfPath manuscript/out/main.pdf errors ["chap/one.tex"]
  client dir projects/p/manuscript/out ... error files ["projects/p/manuscript/out/chap/one.tex"]
```

The report's "socket test `jump` passes 3 tests" is the scratch file `$TMPDIR/d45-probes/socket-jump.test.ts`, which imports `../../../src/...` and is not in the tree. It was not rerun. Every probe ran on copies under `$TMPDIR` or in the scratchpad. No page, server, Electron or browser was started.

## Verdicts

Items of the brief's "What to build":

- 1: holds. Probes for cases 1 to 4 rerun; a dead root comment falls through to the folder rule; a cycle answers none, as item 1 says.
- 2: holds. Case 6 probe; G35 tests pass.
- 3: holds for the build, rerun; violated for the project panel's paths, see Behaviour 2.
- 4: holds. `pty/latex.ts` `stopBuild`, the G35 tests pass; see Proof 2 on the test.
- 5: holds, by reading `builds.ts` `cleanBeforeRetry` and `autoClean`.
- 6: holds, by the report's builds probe (not rerun) and the catalog entry.
- 7: holds. `builds.ts` `start`: `if (ask.reader && ask.retry !== true) await deps.saveAll();`.
- 8: holds; see Standards 5 on `force`.
- 9: holds, by reading.
- 10: holds in effect. Proof 3 covers the two brief options the report does not account for; Standards 3 covers the raw buttons.
- 11: violated, Behaviour 1: a viewer in a window of its own is never refreshed after a build.
- 12: holds, rerun.
- 13: holds. The forward notice offers Build; force reaches the server only by the server's own `built && !synced` rule (Standards 5).
- 14: violated, Spec 1: the jump opens the source in every main page, not in the one the float belongs to.
- 15: holds by reading; Behaviour 4 is a risk to the ChromeTab float.
- 16: holds by the report's reading and `bar-actions.test.ts` passing; the reviewer did not read `LatexButtons.svelte`.
- 17: holds, by reading the `add(...)` list of `latex-tab.svelte.ts` and the keys diff.
- 18: holds. Registration `id: 'latex'`, `group: 'explorer'`, `order: 5`; Cmd+Alt+X calls `showTexView`.
- 19: violated, Behaviour 3: the item keeps the last root for a file that has none.
- 20: violated, Spec 2 and Proof 1: the notice words differ from the dictated text.
- 21: holds, by reading `server/content/latex.ts` `NO_PAGES`; the report's log probe was not rerun.
- 22: holds as ruled by Z690 (D45-2 folded into D43).
- 23: holds, by reading `applies` in `latex-tab.svelte.ts`.
- 24: holds, by the report's case 27 probe (not rerun).
- 25: holds, by the report; `Symbols.svelte` and `MathPreview.svelte` not read.
- 26: holds, by the report; `bib.ts` not read.
- 27: holds, rerun.
- 28: holds, by reading `actions.ts` `revealOutput`.
- 29: holds for the four helpers named; Standards 6 covers a fifth copy.
- 30: holds, grep rerun 0 lines.
- 31: violated, Behaviour 5: `latex.context_menu` is read and does nothing.
- 32: violated, Spec 3 and Spec 4: `DESIGN.md` "The socket" and the `texcount_autorun` text are false.

Cases of the brief's "Cases":

- 1: met. Rerun, plus the fall-through probe above. The brief contradicts itself on a cycle: item 1 says "a cycle answering none", case 1 says "the folder rule's answer or none". The code answers none, which both allow.
- 2: met, rerun.
- 3: met, rerun.
- 4: met, rerun.
- 5: unmet. Reproduced: 206.7 ms and 202.4 ms in two of four runs. The cause, the first read of a fresh file, is the report's attribution and is not verified here.
- 6: met, rerun with the folder `sp ace` and the main `my thesis's.tex`.
- 7: met, by the report's route probe; not rerun.
- 8: met, by the report's probe; not rerun.
- 9: partial. Stop, the clean refusal and `-g` are tested by G35. The spinner, the x and "ends within 2 s" are not run.
- 10: met, by the report's `builds.ts` probe; not rerun.
- 11: met, by the report's probe; not rerun.
- 12: partial. In a page's own pane it holds by reading `viewer.svelte.ts` `open` and `#load`. Behaviour 1 covers a viewer in a window of its own.
- 13: met, by the report's log probe; not rerun.
- 14: met, rerun.
- 15: met for `1:151:157` and the stale copy, rerun. Names with a space and a colon were not rerun.
- 16: met for the refusals (rerun) and the out-folder build (the report's probe).
- 17: not verifiable. It needs a page run on a folder added to the workspace. The reading of `applies` supports it.
- 18: not verifiable. It needs a page with a 21 MB file. The reading supports it.
- 19: met. The G35 test 'refuses a clean while the main builds, and runs it once the build ended' passes.
- 20: met by reading. `pty/latex.ts` `startLatex` answers a running kept terminal without a second start.
- 21: met by reading. `tex-root.svelte.ts` `mainOfPin` takes the folder's first main.
- 22: met, by the report's actions probe; not rerun.
- 23: met, rerun.
- 24: met. The G13 tests pass (rerun).
- 25: met. Grep rerun; one helper at `data/helpers/files/address.ts:11`.
- 26: partial. G29 passes (rerun). Spec 1, Behaviour 1 and Behaviour 4 apply. The ChromeTab float was never run.
- 27: met, by the report's probe; not rerun.
- 28: met. `config/behavior.yml:233` `".pdf": com.apple.Preview`.

## 1. Spec

1. `src/lib/state/sessions/latex/actions.ts:275-283`:
   ```
   if (float === null) {
       socket.listen('jump', (message) => {
           const place = message.payload as Jump;
           layout.openView('source', sourceTabState(place.root, place.file, place.line, place.column));
           focus();
   ```
   - What is wrong: `Hub.send` delivers the jump to every page subscribed to `jump`, and every main page opens the source and calls `focus()`. Item 14 asks for the file to open "in the main page of oculus that the float belongs to". The message carries no page or float identity, so the receiver cannot tell.
   - Failure scenario: Axel has oculus in the desktop app and in a Chrome tab on the same server, or two Chrome tabs. A Cmd+click in a PDF window opens the `.tex` line in both main pages, and both try to take focus.
   - Verdict: item 14 violated; case 26 partial.

2. `config/text/views/academic/latex.yml:61`: `failed_notice: 'The build of {0} failed.'`, with `open_compiler_log: Open compiler log` (:89) and `show_problems: Show problems` (:145).
   - What is wrong: item 20 dictates "The LaTeX build of {0} failed." and the actions "Open Compiler Log and Show Problems" (closing the brief check, Dictated text 3).
   - Failure scenario: the reader sees words other than the dictated ones.
   - Verdict: item 20 violated.

3. `DESIGN.md:121` (The socket), unchanged by the diff: "The socket accepts nothing from the page except subscriptions and, from a socket whose subscription carried the write token ..., terminal input and the frames of an `lsp:<language>` channel". Its channel list has no `jump`.
   - What is wrong: the diff adds a third accepted message. `socket.ts:6` was rewritten to say "DESIGN.md's 'The socket' names two of the exceptions" instead of the design text being updated. Item 32 asks for the docs to describe the jump between windows; `DESIGN.md:533` does, but :121 stays false.
   - Failure scenario: a reader auditing what the socket accepts reads :121 and misses the jump.
   - Verdict: item 32 violated.

4. `config/behavior.yml:133` "texcount_autorun: on_save counts the words of the main file after each build", and `config/catalogs/options.yml:591` "on_save counts the words of the main file after each build, so the status bar's tooltip has the number".
   - What is wrong: `builds.ts:584-597` `onSaved` counts on each save of a LaTeX file, before and independent of any build: `const counts = settings.texcountAutorun === 'on_save'; ... if (counts) void deps.count(target, found.main);`. `docs/views.md` says "after a save", which is right.
   - Failure scenario: the Settings description tells Axel a count follows each build, and it does not.
   - Verdict: item 32 violated.

5. `tests/checks/tree/boundaries.test.ts:380-403`, SHELL_STORES gains `'latex', 'latexActions', 'float', 'windows'`.
   - What is wrong: the report's D45-3 named this port-list widening beside the shell row. Z690 (D45-3) rules only the shell row (`latex-state`, `format`, `data/prose/latex`). The four added stores have their sentence in the doc comment, but no ruling covers the widening.
   - Failure scenario: a widened check lands with no ruling.
   - Verdict: none on an item; this is an open item for the orchestrator.

## 2. Proof

1. `agents/reviews/D45-report.md`, "Host- and user-visible changes": "A failed build posts "The LaTeX build of {0} failed." with Open Compiler Log and Show Problems."
   - What is wrong: the catalog ships different words (Spec 2), so the report states a text that is not on the tree.
   - Failure scenario: the look on TEST is read against words the page never shows.
   - Verdict: item 20.

2. `tests/routes/sessions/terminal-actions.test.ts:261` 'stops the build terminal of the main and no other terminal'.
   - What is wrong: when the stop is posted, the clean was refused and only one terminal exists (`expect(driver.starts()).toHaveLength(1)`). A stop that sent C-c to every terminal would pass, so the "and no other terminal" half of the title is not tested.
   - Failure scenario: a later change that interrupts every kept LaTeX terminal stays green.
   - Verdict: item 4's proof is partial.

3. `src/lib/views/sources/file/pdf/viewer.svelte.ts:400-406` `pdfjs.getDocument({ url, cMapUrl, cMapPacked, standardFontDataUrl, wasmUrl })`, and the report's row for item 10 ("Built, by reading").
   - What is wrong: item 10 asks for `isEvalSupported: false` and `enableScripting: false`; neither is passed and the report does not say why. The effect holds:
     - `grep -c isEvalSupported` of `node_modules/pdfjs-dist/build/pdf.mjs` and `pdf.worker.mjs` prints 0, so 6.4.299 has no such option.
     - Scripting is off because no `scriptingManager` is given: `pdf_viewer.mjs:8107-8108` `get enableScripting() { return !!this._scriptingManager; }`.
   - Failure scenario: a reader of the report cannot tell whether the two safety options were met.
   - Verdict: none; item 10 holds in effect.

4. The report under item 15 and case 26: "socket test passes" and "the socket test `jump` passes 3 tests".
   - What is wrong: no such test is in the tree. It is `$TMPDIR/d45-probes/socket-jump.test.ts`, a scratch file, and the report reads as if it were a tree test.
   - Failure scenario: the orchestrator counts a guarded check that does not exist.

5. Spec.md, the test rules, on edits to existing assertions: "The report lists every edit to an existing assertion, allow list or predicate with its before and after, made from a `diff` of each changed test file and allow list against the base copy, one row per changed line".
   - What is wrong: the report has no such table. The edits it should list include:
     - `settings.test.ts` 'reads the auto build by its entry', `toStrictEqual({ value: 'never', ...` becoming `toMatchObject({ value: { autoBuild: 'never' }, ...`;
     - the changed expected lines of `terminal-actions.test.ts`;
     - `config.test.ts`'s key list;
     - `config-folder.test.ts`;
     - the boundaries allow lists.
   - Failure scenario: a loosened assertion would not be visible to the lander.

6. `D  src/lib/views/shared/latex/Outline.svelte`, staged in the worktree's index (`git status --short`; the other deletions are unstaged ` D`).
   - What is wrong: a `git rm` was run in the worktree. The spec's rule is that agents never run a git command. Who ran it is not established by this read.
   - Failure scenario: the landing picks up an index state nobody accounted for.

## 3. Standards

1. `src/lib/state/sessions/latex/actions.ts:277` `const place = message.payload as Jump;`.
   - What is wrong: DESIGN.md "Untyped input". Every other Hub channel's payload is checked on the client (`state/client/payloads.ts:124-139` `payloadShapes`; `socket.svelte.ts:418`). `jump` is not in that table, so its payload is taken by a cast.
   - Failure scenario: a malformed jump (any page that carries the token) reaches `sourceTabState` unchecked.

2. `tests/routes/sessions/terminal-actions.test.ts:228-308`, five new `it`s for the G35 unit `latex`.
   - What is wrong: spec.md, the test rules: "An entry keeps one test per unit ..., written as a table where a unit has several outcomes", and guarded.md names the test by file and title. `agents/guarded.md` G35's Test line names only 'builds one main file with latexmk in the manuscript folder' and 'builds again in the terminal it kept, and cleans in another' for `latex`. G35's Code line still says "the operations of `src/lib/server/machine/pty/routes.ts`", while the latex operation now lives in `pty/latex.ts`.
   - Failure scenario: guarded.md no longer names the tests or the file that carry G35.

3. `src/lib/views/sources/file/pdf/viewer.svelte.ts:436` and `side-panel.ts:113,148`, `document.createElement('button')` for Retry and Build, the outline entries and the thumbnails.
   - What is wrong: spec.md: "Every control a reader presses is a `ui/` primitive ... never a raw `<button>`". The box is plain DOM, but Svelte's `mount` can place a `ToolButton` in it.
   - Failure scenario: these controls miss the focus, tooltip and accessible-name behaviour that the primitives carry.

4. `src/lib/data/prose/latex.ts`: a second `oneLine`, and a second `readBounded` with its own 2 MB constant beside `server/content/latex/root.ts` `READ_MAX_BYTES`.
   - What is wrong: copies of one rule.
   - Failure scenario: the two limits drift apart.

5. `src/lib/state/sessions/latex/builds.ts:465-467`:
   ```
   ask: LatexBuildAsk = {}
   ...
   return start(target, main, { recipe: ask.recipe, reader: true });
   ```
   - What is wrong: `ask.force` is dropped. `actions.ts:226` passes `{ force: true }` for the "no SyncTeX file" Build, and it never reaches the server. It works only because `pty/latex.ts` forces on `built && !synced`.
   - Failure scenario: the code says a forced build is asked when none is.

6. `src/lib/server/content/docs.ts:230-236` `routeUrl` builds `/api/file/<root>/<path>` with its own segment rule (split on `[\\/]`, drop `.`).
   - What is wrong: item 29 is "widened to the copies found since". This copy stays outside `data/helpers/files/address.ts`, and the report does not name it.
   - Failure scenario: a change of escaping in the helper misses the rendered documents' links.

## 4. Behaviour

1. `src/lib/state/sessions/latex/latex.svelte.ts:353-361` `redraw`. It is the only caller of `fs.bump` for a PDF: `grep -rn "bump(" src/lib` lists only it and `Latex.svelte:124`. It runs only from `load` of a state the page already holds:
   ```
   if (before === undefined || next.root === '') return;
   ```
   - What is wrong: a page that holds no LaTeX state for the root never moves the PDF's version, so its viewer never reloads. Item 15's Open in New Window makes the PDF tab a float drawn by a separate page (the app's float window, or the ChromeTab at `/?float=<id>`). That page has no status bar, no TeX view and no source tab, and nothing in `File.svelte` reads `latex.state`.
   - Failure scenario: Axel opens the PDF in a window of its own beside the source, saves, the build succeeds, and the window keeps showing the old PDF.
   - The report does not state it.
   - Verdict: item 11 violated; cases 12 and 26 partial.

2. `src/lib/state/sessions/latex/latex-state.ts:388` `const base = joinPath(body.folder, folderOf(main.pdfPath));` and :402 `const dir = mains.length > 0 ? folderOf(mains[0].pdfPath) : ...`. These lines are unchanged from the base, but the diff made `pdfPath` include the output folder (`server/content/latex.ts:365`).
   - The probe above, with `out` as the output folder: error files `projects/p/manuscript/out/chap/one.tex` and dir `projects/p/manuscript/out`.
   - Failure scenario: with `latex.out_dir: out`, the project panel's problem rows open files that do not exist. Show Problems from a project build's notice (`context.ts` `showProblems`, `path: latex.state(target).dir`) pins the TeX view to `manuscript/out`, which holds no main.
   - Verdict: item 3 partial.

3. `src/lib/shell/status/LatexItem.svelte:37` `if (live && found !== null) root = found;`, with `drawn = root !== null && (latexTab || pdfTab || building)`.
   - What is wrong: a LaTeX file with no root, or any PDF that is not a build's (`rootOfPdf` answers null), leaves the previous root in place, and the item is drawn for it. Item 19 and `docs/window.md` say it shows "while the active tab is a LaTeX source or the PDF of a build".
   - Failure scenario: after editing `thesis.tex`, Axel opens a downloaded paper's PDF. The status bar shows the thesis build's check and tooltip, and a press opens the TeX view for the thesis.
   - Verdict: item 19 violated.

4. `src/lib/shell/browser-windows.svelte.ts:21,24,40,58`: the float page says it is there by `setInterval(say, 1000)`, and the main page takes the float back after 3500 ms of silence.
   - What is wrong: Chrome throttles chained timers of a page hidden for more than five minutes to about once a minute (Chrome's intensive wake-up throttling). A float opened with `window.open(address, '_blank')` is a tab in the same window, so it is hidden whenever Axel looks at the main tab.
   - Failure scenario: after five minutes in the main tab, the float's heartbeat stops reaching the main page within 3.5 s. The main page calls `freeFloat`, and the float tab then closes itself (`FloatWindow.svelte` `window.close()`).
   - This was not run here; Chrome's throttling is from its documentation, not a measurement. The report names the heartbeat as its choice and does not discuss throttling.
   - Verdict: case 26 at risk.

5. `src/lib/data/sources/config/settings.ts:729` `contextMenu: read.flag('latex.context_menu')`.
   - `grep -rn "contextMenu" src/lib` finds no other reader, and no LaTeX editor action sets the `menu` field `Editor.svelte:261` uses for the right-click menu.
   - `options.yml` says "true adds Build and SyncTeX from Cursor to the editor's right-click menu of a LaTeX file".
   - Failure scenario: Axel turns it on in Settings and nothing changes.
   - The report does not state it.
   - Verdict: item 31 violated.

## Declined to judge

- The page cases 17 and 18 and the page parts of 9, 12 and 26 were not run. They need a scratch server on port 8799 with an Electron script, which this review did not start; the readings above are what support them.
- The report's probes for cases 7, 8, 10, 11, 13, 22 and 27 were not rerun. Their verdicts rest on the report's quoted output.
- These files were not read: `LatexButtons.svelte`, `LatexDialogs.svelte`, `Commands.svelte`, `Problems.svelte`, `Structure.svelte`, `Symbols.svelte`, `MathPreview.svelte`, `kit/latex/*` and `kit/latex/editing/*`, `data/prose/bib.ts`, `server/content/latex/bib.ts`, `latex-editing.ts`, `latex-tables.ts`, `config/catalogs/latex.yml`, the glyph and icon catalogs and `package-lock.json`. Items 16, 24, 25, 26 and the section D providers are judged only by the report and the tests that ran.
- The cause of the case-5 outliers, which the report puts on the first read of a fresh file. A run on a warmed tree, or a control read without `rootOf`, would settle it.
- Whether openAway's "first other pane in tree order" equals item 14's "the pane the PDF was opened beside" when a page has three or more panes. Nothing records that pane, so only a page run would show the difference.

Reviewer usage: agent-aafbba4d13fda558e, claude-opus-5-5, tokens not measured (about 640k of the context budget used across the run, including before compaction), about 110 tool uses (not counted exactly), minutes not measured.

Agent: x.

## Repair round 1, refuted

The round leaves seven defects open. Three are unmet behaviours I reproduced with my own runs:
- a failed build reloads the PDF in a float;
- one external write started three `latexmk` processes in one folder;
- in the desktop app, the jump brings the window focused last to the front, which need not be the window the float belongs to.

The other four:
- a jump from a float whose owner page has closed does nothing and shows no notice;
- the status item no longer shows while a build runs;
- one hard-coded `#fff` colour;
- a third copy of the bounded read in `bib.ts`.

Case 5 is not reproduced. The section below follows the template's shape.

```
# from the worktree's tools/oculus, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
npm run diagrams
  exit 0; md5 of `git status --short` and of the diagrams diff identical before and after
npm run test:quick -- --base f8e54615
  190 changed file(s); 106 test file(s), 10 essential; ascii, prettier, eslint ok; svelte-check "415 FILES 0 ERRORS 0 WARNINGS"; vitest ok
  "test:quick: 29.0 s (limit 45.0 s); every command passed" (second run 19.8 s)
npm run test:checks
  "Tests 2 failed | 241 passed (243)"; both failures are integrity.test.ts "deck folder deck is not in .../worktrees/D45" (the worktree has no deck/)
npx vitest run tests/server/desktop --tagsFilter '!slow'
  "Test Files 2 passed | 1 skipped (3)", "Tests 16 passed | 5 skipped (21)"
npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/routes/sessions/latex.test.ts tests/data/sources/config/settings.test.ts
  "Test Files 3 passed (3)", "Tests 69 passed (69)"            (G35, G13)
npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/views/sources/bar-actions.test.ts tests/ui/tabs/tab-actions.client.test.ts
  "Test Files 3 passed (3)", "Tests 18 passed (18)"            (G29, G37)
sh utils/folder-check.sh -> exit 0; sh utils/size-check.sh -> exit 0
sh utils/unused-exports.sh against the base listing: added names [], 11 names fewer
ASCII gate over src tests config (local.yml excluded): 0 lines; LC_ALL=C grep '[^ -~]' DESIGN.md HELP.md docs/*.md: 0
grep -rIn --exclude=local.yml -E "fileUrl\b|file-url|sourceFileUrl|fileAddress|ROW_LATEX|menu_latex|autoBuildShape|Open in Browser Tab" src tests config docs HELP.md DESIGN.md | wc -l -> 0
grep -rIl isEvalSupported node_modules/pdfjs-dist | wc -l -> 0 (pdfjs-dist "version": "6.4.299")
node_modules/pdfjs-dist/web/pdf_viewer.mjs:8013 "this._scriptingManager = options.scriptingManager || null;"; viewer.svelte.ts names no scriptingManager

# G35 stop row on the unchanged tree (base copy with the current test file copied in)
npx vitest run tests/routes/sessions/terminal-actions.test.ts -> "Tests 7 failed | 11 passed (18)"; the stop row "expected 400 to be 404"

# Electron probes: scratch server on 8799, HOME and hub under $TMPDIR (path resolved by pwd -P), windows show:false
probe.cjs float dup (the builder's, rerun):
  owner A focusCalls:1, B focusCalls:0; the only layout write is A's openView
  float page with no owner: notice shown, no frame sent
  float viewer: 3 pages -> 4 after a build, scrollTop 1331 -> 1330, pageWidth 1037 unchanged
  float in window place while its page lives; lock pending in the mains; float free after its page closed
  duplicated tab takes a new id (7bvfbw against xezrx9)
  side result: one external write to main.tex -> three tmux build sessions oculus-a20e2e-shell, oculus-d88b46-shell, oculus-f64d81-shell created 10:38:09; latexmk pids 65307, 65308, 65317
probe.cjs status pdfui menu (rerun):
  status item: main.tex drawn true, loose.tex false, main.pdf true, unrelated.pdf false
  note over an unbuilt PDF: plainButtons 0, toolButtons ["Read again","Build"]
  outline: entries First, Second, Third, One, plainButtons 0; thumbnails 3, withCanvas 3, plainButtons 0, current ["1"] -> ["2"] after pressing 2
  context_menu false: no Build/SyncTeX entries
probe.cjs menu with latex.context_menu: true in the scratch behavior.yml:
  ["Build LaTeX project","Show the PDF at the caret (SyncTeX)","Go to Symbol...", ...]
probe2.cjs (mine):
  main page id before and after three reloads: ["6fjmqj","6fjmqj","6fjmqj","6fjmqj"]
  float place before the float tab reload [["fl1","window"]]; 9 s after it [["fl1","free"]]; the float tab then: {"closes":1,"drawn":true}
probe3.cjs (mine; one main with main.tex open, one float with the PDF, external write of a document with \undefinedcmd):
  most latexmk at once: 1; main page showed "The LaTeX build of main.tex failed.": true
  float viewer page counts seen: [3,4]; at the end: 4; tmux pane of the build: dead=1 status=12; pdfinfo main.pdf Pages: 4
probe4.cjs (mine; owner A opens float, main B opens, A closed, Ctrl-click in the float):
  B heard {"owner":"7nnhoa",...,"line":6}; B focusCalls 0; layout writes []; float notice false

# failed build writes a PDF (scratch folder, real HOME): latexmk exit 12, main.pdf 12487 bytes

# case 5 (scratchpad refute-d45-r1/), load average about 6
  rootOf first touch, max per run (ms): 296.0, 126.3, 114.2, 157.6, 8.1, 278.8
  control, plain cold read, max single (ms): 131.6, 102.6, 0.4; warmed rootOf 7.8 to 8.1
  look files, three runs: every file at or under 28.0 ms; the round's r21-final.txt reads "slowest ms over 0 look files"
# item 17: r17.probe.ts -> state.dir projects/manuscripts/alpha/manuscript, problem file exists under the hub: true, pdfPath .../out/main.pdf true
```

The scratch-HOME pdflatex hang has an environmental cause and is not a D45 defect. `$TMPDIR` ends in `/`, so `$TMPDIR/x` gives a HOME containing `//`. With such a HOME, kpathsea spins. With the same empty HOME resolved through `pwd -P`, `kpsewhich article.cls` answers in 0.11 s and `pdflatex main.tex` exits 0. All probe3 and probe4 runs used the resolved path.

### Verdicts

Items, over the whole diff since f8e54615. "Carried" means the first report's verdict stands and I did not rerun it in this round.

- 1: holds. Cases 1 to 4 rerun (`final.ts`).
- 2: holds. G35 passes (rerun); the build line is the `latexmkLine()` table.
- 3: holds. The item 17 probe was rerun: `dir` and the problem files are relative to the main's folder, and the PDF is under `out/`.
- 4: holds. G35 passes. The stop row now starts a build of `main.tex`, a build of `second.tex` and a checkcites terminal, and asserts that only the build of main.tex gets `C-c`. Its failure on the unchanged tree is my run (Findings, Proof 2).
- 5: holds by reading `cleanBeforeRetry`. Its `building` status during a retry feeds Findings, Behaviour 1.
- 6: holds (carried). See Findings, Behaviour 2 on concurrent auto builds.
- 7: holds (carried).
- 8: holds. `builds.ts:424-427` and `:472` send `force`.
- 9: holds (carried).
- 10: holds. No `isEvalSupported` in pdfjs-dist 6.4.299 (grep 0 files). No scripting manager is passed (`pdf_viewer.mjs:8013`). Controls, outline and thumbnails have 0 plain buttons (pdfui probe).
- 11: violated, Findings Behaviour 1. A float reloads the PDF of a failed build.
- 12: holds (carried).
- 13: holds. The notice's Build passes `{ force: true }` and `force` reaches the server.
- 14: violated, Findings Behaviour 3 and Behaviour 4.
  - Between two browser pages the owner check holds (rerun).
  - In the app, the window focused last is brought forward.
  - With the owner closed, a jump does nothing and says nothing.
- 15: holds by reading and G47 passing. Findings Behaviour 5 covers a float tab's reload.
- 16: holds. `bar-actions.test.ts` passes (rerun).
- 17: holds. The context-menu entries appear with `latex.context_menu` true and are absent with false (rerun both).
- 18: holds (carried).
- 19: violated, Findings Spec 1. The item is not drawn while a build runs and another tab is active.
- 20: holds. The text "The LaTeX build of main.tex failed." was seen in probe3. `open_compiler_log` and `show_problems` are at `config/text/views/academic/latex.yml:89,145`. I did not reread that the notice's actions use these two strings.
- 21: holds (carried).
- 22: holds as ruled (Z690).
- 23: holds (carried).
- 24: holds (carried).
- 25: holds (carried).
- 26: holds (carried). Findings Standards 2 covers `bib.ts`'s own read.
- 27: holds (carried).
- 28: holds (carried).
- 29: holds. `docs.ts` `routeUrl` goes through `fileBytesUrl`; the grep prints 0 lines.
- 30: holds. The grep prints 0 lines.
- 31: holds. `context_menu` works both ways (rerun). The `texcount_autorun` text at `config/behavior.yml:133` and in `options.yml` now says "after each save of a LaTeX file".
- 32: holds for `DESIGN.md:121` and `:574` (read). `docs/window.md:82` keeps "or while a build runs", which the code no longer does; that is the item 19 defect (Findings Spec 1).

Cases:

- 1 to 4: met, rerun (`final.ts`).
- 5: unmet, Findings Proof 1.
- 6: met. G35 passes.
- 7, 8: met (carried).
- 9: partial (carried). Stop and the clean refusal are tested; the spinner, the x and the 2 s end are not run.
- 10: met (carried).
- 11: met. In probe3 one write with one following page started one `latexmk`.
- 12: unmet, Findings Behaviour 1. After a successful build the float keeps its place (rerun: scrollTop 1331 to 1330, pageWidth unchanged). After a failed build the float draws the failed PDF ([3,4]).
- 13: met (carried).
- 14, 15: met (carried).
- 16: met (carried).
- 17: not verifiable (carried). It needs a page run on a folder added to the workspace.
- 18: not verifiable (carried).
- 19: met. G35 passes.
- 20: unmet, Findings Behaviour 2.
- 21, 22, 23: met (carried).
- 24: met. G13 passes (rerun).
- 25: met. The grep prints 0.
- 26: partial.
  - The ChromeTab float now runs: lock, return after close, owner jump.
  - Findings Behaviour 3 to 5 apply.
  - The desktop app's float window was not run.
- 27, 28: met (carried).

### Findings

**Spec 1.** `src/lib/shell/status/LatexItem.svelte:57`:
```
const drawn = $derived(root !== null && (latexTab || pdfTab));
```
- What is wrong: the brief's item 19 says the item "shows while the active tab is a LaTeX source or a PDF of a build, or a build runs". The round dropped the third clause. Round item 18 asked only that a LaTeX file with no root, or another PDF, hide the item, so this change goes beyond the finding.
- `docs/window.md:82` still says "or while a build runs, as a spinner", which is now false.
- Failure scenario: the reader starts a build and switches to a Markdown tab. The spinner and the failure x are gone from the status bar until a LaTeX tab is active again.
- Verdict: item 19 violated.

**Proof 1.** Case 5, the round's section on round item 21 ("met in the five final runs", "`rootOf` stays at or under the control's max"):
- Not reproduced. Two of my six runs have a first touch of 278.8 and 296.0 ms. The control's largest single cold read is 131.6 ms, so the excess is not the first read alone.
- The round's final runs timed no look files (`r21-final.txt`: "slowest ms over 0 look files"). My look run has every file at or under 28.0 ms.
- Decision that rests on it: whether case 5's 200 ms bound is met. It is not met on this machine under load (load average about 6). The round's claim that a cold read alone explains the excess is contradicted by the control.
- Verdict: case 5 unmet.

**Proof 2.** G35 stop row (`tests/routes/sessions/terminal-actions.test.ts`, the stop row of `LATEX_ROWS`):
- The round did not quote the row's failure on the unchanged tree, which spec.md's guarded-test rule asks for.
- My run of the current file on the base copy gives "Tests 7 failed | 11 passed (18)", with the stop row at "expected 400 to be 404". The row reads correctly.
- No item's verdict changes.

**Proof 3.** `tests/server/desktop/window-guard.test.ts:26-37` against `src/desktop/decide/links.ts:30-38`:
- `floatOf` now accepts `owner` beside `float`, and `?float=f1&x=1` is still refused.
- The G47 table has no row for `?float=f1&owner=<id>`. No test in `tests/` names the jump's `owner`: `grep -rln owner tests` lists only config, boundaries and layout files, which use the word in other senses.
- Failure scenario: a later edit that drops `owner` from `floatOf` sends every float window's address to the browser. No test fails.
- Verdict: item 14's proof is partial.

**Standards 1.** `src/lib/views/sources/file/pdf/PdfControl.svelte:111-114`:
```
canvas { display: block; background: #fff; }
```
- What is wrong: spec.md's rule that colours come from `themes/tokens.css`. This is the only raw hex in a component under `src/lib` (grep from the previous part of this run).
- Failure scenario: a theme with its own page colour still draws white thumbnails.
- Verdict: item 10 holds in substance; this is a standards finding.

**Standards 2.** `src/lib/server/content/latex/bib.ts:16` and `:25-31`:
```
const BIB_MAX_BYTES = 8 * 1024 * 1024; ... function readBib(path) { ... statSync(path).size > BIB_MAX_BYTES ? null : readFileSync(path, 'utf8') ... }
```
- What is wrong: round item 13 asked for one bounded read with one byte limit. `reader.ts:21-24` holds `readBounded` with 2 MB, used by `root.ts`, `outline.ts` and `texdoc.ts`. `bib.ts` keeps its own copy with 8 MB.
- Failure scenario: a change to how an oversized or unreadable file is answered reaches three readers and misses the citation browser.
- Verdict: round item 13 partial.

**Behaviour 1.** `src/lib/state/sessions/latex/latex.svelte.ts:353-361`:
```
const status = builds.buildOf({ root: next.root, path: next.dir }, main.main).status;
if (status === 'failed' || status === 'stopped') continue;
fs.bump(next.root, main.pdfPath);
```
- What is wrong: `buildOf` reads only this page's own builds, so a page that did not start the build (a float page, another tab) reads IDLE and bumps.
- latexmk writes a PDF on failure (exit 12, 12487 bytes). probe3 shows the float viewer going from 3 to 4 pages on a build that failed (tmux pane status 12).
- By reading, in the page that started the build, `clean_and_retry` keeps the status `building` during the retry, so a `files` message there bumps too.
- Brief decision 5 and case 12 say a failed build leaves the old document shown.
- Failure scenario: a typo that breaks the build replaces the reader's last good PDF in a float window with a partial one.
- Verdict: item 11 violated, case 12 unmet.

**Behaviour 2.** `src/lib/server/machine/pty/latex.ts:250-263`:
```
const kept = await keptLatex(folder.dir, name, options);
if (kept !== null) { ... }
const terminal = await startTerminal(...)
```
- What is wrong: check-then-start with nothing in between that serialises concurrent requests. The same pattern was in `routes.ts` at the base.
- In the float-dup probe, one external write to `main.tex`, with three pages following the root under `on_file_change`, created three tmux build sessions in the same second and three `latexmk` (pids 65307, 65308, 65317) in one folder.
- Case 20 says "never two `latexmk` at once in one folder (the server's kept terminal answers the running build)". The brief's "one terminal per main file and step" is broken too.
- Failure scenario: two oculus tabs on one manuscript. Every save from another editor runs two latexmk processes that write the same `.aux` and PDF.
- Verdict: case 20 unmet (the first report met it by reading).

**Behaviour 3.** `src/desktop/windows/bridge.ts:142-149`:
```
ipcMain.on(FOCUS_MAIN, (event) => { ... const main = windows.lastMain(); if (main !== null) { main.win.show(); main.win.focus(); } });
```
- What is wrong: the owner's page opens the source, but the window brought forward is the main window focused last (`windows.ts:417`), not the owner's window. The app has New Window (`app.ts` `newWindow`).
- Brief item 14: "that window is brought to the front where the host allows it". I checked this path by reading only; the app was not started.
- Failure scenario: two app windows, the float opened from window 1, window 2 focused last. A Ctrl-click opens the source in window 1 and raises window 2.
- Verdict: item 14 violated on the app path.

**Behaviour 4.** `src/lib/state/sessions/latex/actions.ts` `inverse` together with the main page's `jump` listener (`if (place?.owner !== pageId) return;`):
- What is wrong: probe4 opens main A, then the float with `owner` A, then main B, and closes A. A Ctrl-click in the float is heard by B, ignored by B (focusCalls 0, no layout write), and the float shows no notice. The `latex.jump_failed` text is said only when `owner` is null or the send fails.
- Failure scenario: the reader closes the tab that opened the float and keeps working in another oculus tab. Ctrl-click in the float does nothing, with no explanation.
- The reader's own reload keeps the id (probe2: 6fjmqj across three reloads), so a reload does not cause this.
- Verdict: item 14 partial on this path.

**Behaviour 5.** `src/lib/shell/browser-windows.svelte.ts` (the main page takes the lock `oculus-float:<id>` and calls `layout.freeFloat(id)`) and `FloatWindow.svelte`'s `window.close()`:
- What is wrong: probe2 reloads the float's browser tab. Within 9 s the float's place goes from `window` to `free` in the main page, and the reloaded float page calls `window.close()` (closes:1). The lock is free between unload and load, and a main page whose request is already pending takes it at once.
- Z695 (1) ruled a float's absence of up to 10 s after it opens. Nothing in the report or `DESIGN.md:574` states that a reload returns the float.
- Failure scenario: Cmd-R in the PDF's ChromeTab closes that tab and puts the PDF back into the main page.
- Verdict: case 26 partial. This is a user-visible behaviour the report should have stated, or the code should keep the window through a reload.

What holds, checked this round:
- Web Lock design, float-dup probe rerun: lock pending while the float lives, return after close, the duplicated tab takes a new id.
- `holdBrowserTabId` keeps the id across three reloads (probe2).
- Z695 (1): `floats()` returns the stored floats unmapped, and `FloatLayer` draws only those not in `window`.
- `jump` is parsed through `payloadShapes` (`payloads.ts:120`, `:147`).
- `ask.force` (`builds.ts:424-427`, `:472`).
- `routeUrl` through `address.ts`.
- Project panel paths with `out_dir: out` (r17 probe).
- PDF viewer `ui/` primitives (pdfui probe).
- G35 table test; the test-edit table: every removed assertion (`latexmk -pdf ...` in `lineOf` and `respawns`, `latexAutoBuild` in settings) is replaced by an assertion of equal strength against `latexmkLine()` or a `toStrictEqual` with `BUILD_DEFAULTS`.
- `agents/guarded.md` G35 text is unchanged in the main checkout. The proposed text is in the round report's item 11, for the orchestrator.
- `model-sessions.ts` 714 lines (876 at the base) and `model-processes.ts` 438. The terminal types moved between the two. I did not judge whether the report names this move.

### Declined to judge

- The desktop app paths (focus, a float window's owner, item 26 in the app) were checked by reading only. The standing rules forbid starting oculus's desktop app.
- Cases 17 and 18 still need a page run, on a folder added to the workspace and on a 21 MB file. Not run.
- The notice's two actions were not reread against `latex.yml:89,145`.
- Whether `model-sessions.ts` to `model-processes.ts` is a size split named in the report was not checked against the report.
- Everything I started is stopped:
  - the scratch server on 8799 (`lsof -nP -iTCP:8799 -sTCP:LISTEN` prints nothing);
  - the scratch tmux servers;
  - no process matches `pgrep -lf "d45rv|latexmk|pdflatex|kpsewhich"`;
  - `$TMPDIR/d45rv*` is removed (`ls` finds none).

Reviewer usage: afa4681f60c7525d3, claude-opus-5-5, about 480k tokens by the session's counter (15,000,000 to 14,515,950), tool uses not counted across the context compaction (about 30 in the second part), minutes not verified.

Agent: x.
