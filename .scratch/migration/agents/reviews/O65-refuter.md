# O65 refuter report

## 1. Verification lines

Commands were run in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O65` unless another directory is named.

- Verify list (brief check 1; `npm run diagrams` declined, see section 4): `npm run test:quick -- --base 3a35d993`
  ```
  test:quick: 35 changed file(s), from git since 3a35d993
  test:quick: 10 test file(s)
  ok      ASCII gate (0.7 s)
  ok      prettier (1.0 s): All matched files use Prettier code style!
  ok      svelte-kit sync (13.6 s)
  ok      eslint (30.6 s)
  ok      vitest (33.1 s): Duration  24.92s ...
  ok      svelte-check (33.6 s): ... COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (34.0 s): Duration  25.83s ...
  test:quick: 47.7 s; every command passed
  ```
- Check 2, after the change: `npx vitest run tests/ui/controls/editor/kit/comment-rules.test.ts --reporter verbose` printed `Tests  32 passed (32)`, with rows `'julia'`, `'latex'` and `'make' has a comment rule` passing. Not rerun on the unchanged tree, because that run needs an export the rules exclude (section 4). The base read instead with `git show 3a35d993:src/lib/ui/controls/editor/kit/rite/settings.ts`: it configures only rite, cmake, both Fortran forms, jinja and svelte. Monaco's `definitions/julia/julia.js` `conf` has no `comments`, and Monaco has no definition for latex, bibtex, shellscript, make, matlab, ocaml or common-lisp. So exactly nine rows fail at the base, which matches the builder's `Tests  9 failed | 23 passed (32)`.
- Check 3: `grep -rn "leftOut\b\|fitOneRow\|DROP_ORDER\|one-row\.ts\|'./one-row'\|data-left-out" src docs tests` printed nothing, exit 1.
- Check 4: `wc -l` gives `StatusBar.svelte` 450 and `diff/DiffEditor.svelte` 513, both under the component limit of 520. The largest source file is `load.ts` at 694, and `workbench-keys.svelte.ts` is 603, both under 880. `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts --testTimeout 120000` printed `Test Files  2 passed (2)`, `Tests  21 passed (21)`. `sh utils/folder-check.sh` exited 0.
- Check 5: `sh utils/unused-exports.sh`, compared with `diff ../migration-O65-base/unused-exports.txt <out>`:
  ```
  < Unused exports (230)
  > Unused exports (231)
  > src/lib/ui/controls/editor/chords.ts: editorChords
  ```
  Same as the report. `editorChords` is read by `utils/diagrams/palette.mjs:106` through `ssrLoadModule`, which knip does not follow, so keeping the export is justified.
- Check 6: a grep of the added comment lines and test titles for the words of spec.md:44 found `before` at four lines: the `workbench-keys.svelte.ts` comment, `configuration.ts:5-6`, `monaco-modules.d.ts:13` and `latex-settings.ts:6`. Each names an order of events or Monaco's `autoCloseBefore`, so none is history. No package id or date was found.
- Check 7: `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 60000` printed `Test Files  1 passed (1)`, `Tests  1 passed (1)`. With the default timeout the same file timed out at 5000 ms on this loaded machine. The test is tagged slow, and the report says the same.
- Check 8: `grep -rn "RemovedChord\|removedChords\|LATEX_CHORD_SECONDS\|keys\.palette\|palette: true\|run from the palette" src tests config docs README.md --exclude=local.yml` exits 1. A wider grep for "gave up", "give up" and "gives up" finds three stale comments; see T1.
- `npx vitest run tests/checks/source/keys.test.ts --testTimeout 120000` printed `Tests  10 passed (10)`, so the catalog has no orphan key after `keys.palette` was removed.
- ASCII: the added lines of the diff, the two new files and the report through `LC_ALL=C grep -n '[^ -~]'` printed nothing.
- Copied settings against their sources, fetched with curl into the reviewer's scratchpad: LaTeX Workshop `v10.19.0` (`syntax/latex-language-configuration.json`, `syntax/bibtex-language-configuration.json`, `package.json`); VS Code `main` (`extensions/{shellscript,make,diff,julia}/language-configuration.json`); MathWorks `main` (`language-configuration.json`, `LICENSE`); OCaml Platform `master` (`languages/ocaml.json`, `LICENSE`). A node script loaded the worktree's TypeScript through jiti and compared `languageConfiguration(upstream)` with what `registerSettings` gives: every one of the eight languages printed `equal: true` with the same field set, and `lw-latex raw equal: true lw-bibtex raw equal: true`. The reader drops no element: brackets 70/70, auto-closing 26/26, OCaml onEnter 2/2, MATLAB onEnter 3/3. The license lines read `MIT License / Copyright (c) 2023 MathWorks` and `ISC License / Copyright (c) 2019 OCaml Labs`, as the head comment credits.

## 2. Verdicts

### Items of "What to build"

1. Holds, by reading. Every item is drawn, and the bar is `overflow-x: auto`, `overscroll-behavior-x: contain`, `overflow-anchor: none` and `scrollbar-width: none`. The wheel goes through `horizontalWheelDelta` (`StatusBar.svelte:194-201`). Svelte 5 makes only `touchstart` and `touchmove` passive (`node_modules/svelte/src/utils.js:261`), so `preventDefault` takes effect. The right group's `margin-left: auto` keeps it at the right edge while there is room. `one-row.ts`, `leftOut`, `DROP_ORDER` and the sentences that named them are gone. The look is owed.
2. Holds, with P1. The data equals the upstream files, and the reader keeps `noIndent` and reads `autoCloseBefore`. Julia's brackets and pairs depend on the timer ordering P1 covers.
3. Holds. One table, its rows from `SHIKI_LANGUAGES` (32 ids, `rite` included), and Monaco's own `conf` read from its definitions, or from `setupMode` for json.
4. Holds by reading. The count of 49 files reproduces. Monaco binds `deleteAllRight` with `when: writable && textInputFocus` (`linesOperations.js:690-694`) and `workbench.action.showHover` with no `when` (`hoverService.js:97-101`); both confirm the reading behind item 6. See P3.
5. Holds for its text: the two new chords, seconds that depend on the platform, and the scopes of `.bib`, `.sty` and `.cls` (checked against LaTeX Workshop's `package.json`). See B1 for J2.
6. Violated, T1. The key behaviour is built, but three comments that still say the chords are "given up" so that Cmd+K opens the palette from inside the editor were not rewritten, and item 6 orders them rewritten.

### Cases

- C1, C2, C3, C4, C14, C15, C16: not verifiable here; they are looks. The reading is consistent with each.
- C5: met by reading. The look is owed.
- C6: met by reading and by the table rows. The `.slurm` look is owed. The `.jl` brackets depend on P1.
- C7: met. 32 rows pass after the change; the failure on the unchanged tree confirmed by reading the base `settings.ts`.
- C8: not verifiable (look).
- C9, C10, C11, C12: not verifiable (look). The bindings are present in `latex-tab.svelte.ts:408-429` and `rows.ts:209-220`.
- C13: partial. The three files are met by reading. Cmd+Alt+C in `.bib` takes an editor key that VS Code with LaTeX Workshop leaves to Monaco; see B1.
- C17: met by reading. The look is owed.
- C18, C19, C20, C21, C22: met by reading.
- C23: not verifiable (look).
- C24, C25, C26, C27, C28, C30: not verifiable (look).
- C29: met by reading, and named in the report. Not verified in the app.
- C31: met. G25 passes after the change.

## 3. Findings

### Spec

- **S1. The builder ran git commands.** spec.md, "Where you work": "You never run a git command, read-only ones included ... The brief names a base copy". The report quotes `git show HEAD:<file>`, an export by `git archive HEAD`, `git diff -U0` and `git diff --stat`. The base copy `.agents/worktrees/migration-O65-base/` existed for this purpose. No result depends on these runs: the reviewer reproduced the base reading and the check results by the allowed routes. A breach of the rules file to record against the step.
- **S2. The verify list ran twice in full.** spec.md, "Token discipline", allows one run after the last change. The first run was green and was followed by a code change.
- **S3. A premise of the brief does not reproduce, and the report does not name it.** The brief quotes "the LaTeX tab's keys that take an editor key (Cmd+L, Cmd+Alt+[ and ])". Cmd+Alt+C also takes an editor key: Monaco's `toggleFindCaseSensitive`, mac `CtrlCmd|Alt|KeyC` (`findModel.js:28-31`), with `kbExpr: EditorContextKeys.focus` (`findController.js:886`). The report's five errors in the brief all reproduce (`jsonMode.js` exports no `conf`; the merge is field by field, the later entry winning, `languageConfigurationRegistry.js:181-206`; F7 and Shift+F7 are `wordHighlight` keys, `wordHighlighter.js:748-763`; Enter cannot be a configured key and LaTeX Workshop's tab focus mode off macOS is `ctrl+l ctrl+m`; LaTeX Workshop scopes promote and demote to `latex|latex-expl3|doctex|rsweave|jlweave|pweave`). This sixth error was not named, and it bears on B1.
- Judged with no finding: each file outside the write list is needed and named in the report (`src/monaco-modules.d.ts`, `kit/latex/latex-editing.ts`, `data/sources/config/catalog/latex-tables.ts`, `config/catalogs/latex.yml`, `shell/keys/palette-page.ts`). Leaving out configured text chords on `l`, `w` and `m` follows from item 5. Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M are the two chords item 5 names. None is a new user-visible key outside the brief. No dependency was added. No ADR folder (`ls docs/adr`: "No such file or directory").

### Proof

- **P1. The Julia ordering is shown by nothing, and no test reaches it.** `kit/rite/settings.ts:353-356`:
  ```
  monaco.languages.onLanguageEncountered('julia', () => {
      void import('monaco-editor/languages/definitions/julia/julia.js').then(() => {
          setTimeout(() => monaco.languages.setLanguageConfiguration('julia', julia), 0);
  ```
  The comment at `:340-345` says the timer "runs after every one of those steps". That holds only if the app's import and Monaco's own `loader: () => import('./julia.js')` resolve to one module record in one task. In development Monaco is pre-bundled (`node_modules/.vite/deps` holds separate `monaco-editor_*` entries for deep imports), so the two `import()` promises can resolve in different tasks. Nothing ran this; the test's stub `onLanguageEncountered` never calls the callback. Failure scenario: in a `.jl` file Monaco's `conf` lands after VS Code's, `'` auto-closes and a backtick does not, and item 2 fails for brackets and pairs. A registration whose order does not depend on timing would close it.
- **P2. The test file holds a mutable object at file scope.** `tests/ui/controls/editor/kit/comment-rules.test.ts:20`: `const modes = vi.hoisted(() => new Map<string, Configuration>());`. spec.md's "No globals" principle holds in test fixtures and helpers too. Today only the json row writes it. The record could live in the mocked module.
- **P3. Item 4's completeness was not checked against the runtime registry.** The report rests completeness on the grep, whose 49 files reproduce. Failure scenario: a default binding registered by a route the grep does not match is missing from the table the look presses through. At the look, compare the table with the Keyboard Shortcuts view's editor rows.

### Standards

- **T1. Three comments still say the Cmd+K chords are given up to the palette** (spec.md:70 and item 6):
  - `src/lib/shell/keys/Palette.svelte:28-30`
  - `src/lib/state/workbench/palette.ts:5-7`
  - `src/lib/state/workbench/navigation/editor-status.svelte.ts:14-16`
  Failure scenario: a maintainer reads that Cmd+K opens the palette from inside the editor, which is now false.
- **T2. `src/monaco-modules.d.ts:173-178` declares an export nothing reads** (`export const conf`); `settings.ts:354` only awaits the import. The file's head comment says each subpath is declared as the part the tree uses, which is false for this entry.
- No history in comments, no non-ASCII, no secret, no file over its limit. The license credits are present and match the sources.

### Behaviour

- **B1. The builder's J2 is wrong on two counts, and its real gap is inside the step line.** At `latex-tab.svelte.ts:297-327`, `if (!bib) {` guards view, synctex and math preview, so a `.bib` file binds only Cmd+Alt+B and C. LaTeX Workshop `v10.19.0` binds `cmd+alt+b`, `cmd+alt+c` and `cmd+alt+v` for `latex-class` and `latex-package` too, so `.sty` and `.cls` match it on B, C and V. The real differences: in `.bib`, Cmd+Alt+B and C are bound where LaTeX Workshop binds neither; in `.sty` and `.cls`, Cmd+Alt+J and M are bound where LaTeX Workshop binds them only for `latex|latex-expl3|doctex` and `latex|context|...`. Cmd+Alt+C in `.bib` takes Monaco's Alt+Cmd+C (`toggleFindCaseSensitive`), which is inside the step line, and C13 is partial for it. Before: in a `.bib` tab with the find widget open, Cmd+Alt+C runs Clean. After a fix: it toggles case-sensitive find, as in VS Code. A repair must keep B, C and V bound in `.sty` and `.cls`.
- **B2. Some visible changes are missing their before in "Before and after":**
  - In `.bib`, Cmd+L Cmd+Enter and Cmd+L Cmd+W no longer run (bound at the base, `latex-tab.svelte.ts:392-396`).
  - In `.sty` and `.cls`, the text and math chords are no longer keyed (bound at the base, `:402`), and Ctrl+Shift+M there now toggles tab focus mode.
  - A configured text chord on `m` is now left out on macOS too.
  - In `.slurm`, `"`, `'` and the backtick auto-close outside strings.
  - The palette page has a new sentence, "Pin Editor and Unpin Editor stand in the palette for the chord VS Code binds them to" (`config/text/palette-page.yml` `editor_intro`, `docs/palette.md:142`), which open item 259 may change.

## 4. Declined to judge

- `npm run diagrams` and `npm run docs:palette`: both write into the worktree; the halves that do not write were run.
- The builder's run of the table test on an unchanged tree made with `git archive HEAD`: a git command outside the three allowed; judged by reading the base `settings.ts`.
- The builder's `git show HEAD:<file>`, `git diff -U0` and `git diff --stat` readings: the same facts read with `git show 3a35d993:<path>` and `git diff 3a35d993`.
- Every case marked "Look": C1 to C4, C8 to C12, C14 to C16, C23 to C28 and C30.
- C29's behaviour in the desktop app: read only.

Usage: a9ee849e1a46ad40f, claude-opus-5-5, 285514 tokens, 70 tool uses, 24 min 12 s
