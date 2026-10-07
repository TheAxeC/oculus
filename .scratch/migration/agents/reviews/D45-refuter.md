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
