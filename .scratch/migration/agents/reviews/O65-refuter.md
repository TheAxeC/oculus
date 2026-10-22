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

## Repair round 1, refuted

All commands below were run in `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O65` unless another directory is named. Node is `$HOME/.nvm/versions/node/v24.21.0/bin`.

```
$ npm run test:quick -- --base 3a35d993     (npm run diagrams declined, see Declined to judge)
test:quick: 43 changed file(s), from git since 3a35d993
test:quick: 22 test file(s)
ok      ASCII gate (1.1 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (26.6 s)
ok      vitest slow (61.7 s): Duration  40.66s (transform 11.14s, setup 0ms, import 30.36s, tests 8.39s, environment 1ms)
ok      vitest checks (87.2 s): Duration  66.37s (transform 3.97s, setup 0ms, import 18.44s, tests 101.98s, environment 1ms)
ok      vitest (91.6 s): Duration  70.95s (transform 183.71s, setup 0ms, import 219.04s, tests 6.24s, environment 1.94s)
ok      eslint (93.1 s)
ok      svelte-check (95.6 s): 1792709293278 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 122.4 s; every command passed

$ npx vitest run tests/checks/diagrams/diagrams.test.ts -t "are what the source gives now" --testTimeout 300000
 Test Files  1 passed (1)
      Tests  1 passed | 46 skipped (47)
(the committed docs/diagrams equal what the source gives now; docs/diagrams/layers.dot cites kit/load.ts:133, which is `import(/* @vite-ignore */ asked)`)

$ npx vitest run tests/ui/controls/editor/kit/comment-rules.test.ts tests/views/sources/source/latex-keys.client.test.ts --reporter verbose
 ... 32 rows '<id> has a comment rule' passed
 <check mark> Julia's settings > keep VS Code's brackets and auto-closing pairs when Monaco gives its own after them
 <check mark> an app's settings of a language > win over the settings oculus gives the language
 <check mark> 'a TeX file' / 'a .bib file' / 'a package' / 'a class' takes the keys LaTeX Workshop binds there
 Test Files  2 passed (2)
      Tests  38 passed (38)

(in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o65/base-run; its src, config and utils equal the base copy by diff -rq, its two test files equal the worktree's by cmp)
$ npx vitest run --config base-run.config.ts tests/ui/controls/editor/kit/comment-rules.test.ts tests/views/sources/source/latex-keys.client.test.ts
 FAIL rows 'shellscript' 'bibtex' 'diff' 'julia' 'latex' 'common-lisp' 'make' 'matlab' 'ocaml' has a comment rule: AssertionError: expected undefined to be defined
 FAIL Julia's settings > ...: AssertionError: expected [ [ '{', '}' ], [ '[', ']' ], <horizontal ellipsis>(1) ] to deeply equal undefined
 FAIL an app's settings of a language > ...: AssertionError: expected undefined to deeply equal { lineComment: '#' }
 FAIL 'a TeX file' ...: expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(8) ] to deeply equal [ 'build', 'clean', 'demote', <horizontal ellipsis>(10) ]
 FAIL 'a .bib file' ...: expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(5) ] to deeply equal [ 'math.mathbf', 'text.textbf' ]
 FAIL 'a package', 'a class' ...: expected [ 'build', 'clean', 'demote', <horizontal ellipsis>(8) ] to deeply equal [ 'build', 'clean', 'view' ]
 Test Files  2 failed (2)
      Tests  15 failed | 23 passed (38)

$ grep -rn "leftOut\b\|fitOneRow\|DROP_ORDER\|one-row\.ts\|'./one-row'\|data-left-out" src docs tests
exit 1 (nothing printed)
$ grep -rn "RemovedChord\|removedChords\|LATEX_CHORD_SECONDS\|keys\.palette\|palette: true\|run from the palette\|ABOVE_MONACO\|onLanguageEncountered('julia'" src tests config docs README.md --exclude=local.yml
exit 1 (nothing printed)
$ grep -rn "setTimeout" src/lib/ui/controls/editor/kit/rite/settings.ts
exit 1 (nothing printed)
$ grep -rn "julia/julia.js" src tests
src/monaco-modules.d.ts:177:declare module 'monaco-editor/languages/definitions/julia/julia.js' {
tests/ui/controls/editor/kit/comment-rules.test.ts:171:        const { conf } = await import('monaco-editor/languages/definitions/julia/julia.js');

$ wc -l (every changed file; the largest)
 708 src/lib/ui/controls/editor/kit/load.ts
 835 src/lib/state/workbench/palette.ts
 540 src/lib/shell/keys/Palette.svelte        (component; over 520, see Findings)
 513 src/lib/ui/controls/editor/diff/DiffEditor.svelte
 505 src/lib/views/sources/source/latex/latex-tab.svelte.ts
 451 src/lib/shell/status/StatusBar.svelte
 (git show 3a35d993:src/lib/shell/keys/Palette.svelte | wc -l: 540)

$ sh utils/unused-exports.sh > <scratchpad>/o65-refute-unused.txt; diff .agents/worktrees/migration-O65-base/unused-exports.txt <that file>
1c1
< Unused exports (230)
---
> Unused exports (231)
199a200
> src/lib/ui/controls/editor/chords.ts: editorChords
(same as the report; none of this round's exports is listed)

$ history words over added comment lines and test titles (git diff 3a35d993 added lines plus the three new files; before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O<nn>|a date)
5 hits: workbench-keys.svelte.ts "which Monaco takes before it bubbles here" (an order); configuration.ts and latex-settings.ts "autoCloseBefore" (a field); register.ts "what `before` put in" (a parameter); settings.ts "a rank higher still" (degree). None is history.

$ npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 120000
 Test Files  1 passed (1)
      Tests  1 passed (1)

$ ruling 3's greps
grep -rn "gave up\|give up\|gives up\|given up\|freed" src docs config tests --exclude=local.yml
  key-related hits only: kit/load.ts:2, chords.ts:1-2 and :94, keys/monaco-keys.ts:5, :14, :42, :68, shell/Workbench.svelte:308, views/system/help/keys/Keys.svelte:19, state/workbench/navigation/editor-status.svelte.ts:16; each speaks of F1, F8 and Shift+F8 (`freedKeys`) and is true. Every other hit is about requests, timeouts, floats or layout room.
grep -rn "old chord\|removed chord" src tests docs config --exclude=local.yml
  exit 1
grep -rn "gave up\|old chord\|removed chord" src tests docs config --exclude=local.yml
  src/lib/server/content/literature/handler.ts:136 and :170 only

$ npx vitest run tests/checks/source/history.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts --testTimeout 300000
 FAIL comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
 +   "tests/data/snapshot/reference-hub.ts:4",
 +   "tests/data/snapshot/references.test.ts:544",
 Test Files  1 failed | 4 passed (5)
      Tests  1 failed | 38 passed (39)
(in the base run copy) npx vitest run --config base-run.config.ts tests/checks/source/comment-width.test.ts
 + "tests/data/snapshot/reference-hub.ts:4", "tests/data/snapshot/references.test.ts:544"
 Tests  1 failed | 1 passed (2)
cmp of both files with .agents/worktrees/migration-O65-base/: equal; git show 3a35d993:tests/checks/source/comment-width.test.ts | diff - <worktree file>: no difference; git status --short lists nothing under tests/checks or tests/data/snapshot. Line lengths: 101 and 101.

$ LaTeX Workshop v10.19.0 package.json keybindings, fetched with curl from raw.githubusercontent.com and printed (key, mac, command, when); the rows that bear on ruling 5:
 cmd+alt+b / cmd+alt+c: editorLangId =~ /^build$|^latex$|^latex-class$|^latex-package$|^context$|^latex-expl3$|^doctex$|.../   (no bibtex)
 cmd+alt+v: /^latex$|^latex-class$|^latex-package$|.../                                                                         (no bibtex)
 cmd+alt+j: /^latex$|^latex-expl3$|^doctex$/
 cmd+alt+m: /^latex$|^context$|^latex-expl3$|^doctex$|.../                                                                    (no class, package)
 cmd+alt+[ / ]: /^latex$|^latex-expl3$|^doctex$|.../
 cmd+l cmd+enter, cmd+l cmd+w, cmd+l cmd+l, cmd+l ctrl+shift+m: latex variants only
 cmd+l cmd+<b,i,u,e,r,t,s,c,n,6,-> and ctrl+shift+m cmd+<...>: /^bibtex$|^latex$|.../                                          (no class, package)

$ ASCII
git diff 3a35d993 | grep "^+" | LC_ALL=C grep -c '[^ -~]'          -> 0
LC_ALL=C grep -n '[^ -~]' over the three new files                -> nothing
LC_ALL=C grep -c '[^ -~]' .scratch/migration/agents/reviews/O65-report.md (worktree copy) -> 3

$ git status --short | wc -l after every run: 43, the same set as before the review.
```

### Verdicts

Items of the brief's "What to build", for the whole diff since 3a35d993:

- 1: holds, by reading. The round touched only the head comment of `StatusBar.svelte` (rewrapped, same words). The verdict and evidence of the first review stand. The look is owed.
- 2: holds. The data in `latex-settings.ts` and in the language tables of `settings.ts` did not change in the round. Julia now gets VS Code's settings through `ILanguageConfigurationService` at rank 101 (`settings.ts:353-362`, `load.ts:319-324,371-372`), which beats Monaco's own settings at rank 100. Monaco's merge (`languageConfigurationRegistry.js` `cmp` and `combineLanguageConfigurations`) puts higher priority last and takes `entry.field || result.field`. Monaco's Julia `conf` holds `brackets`, `autoClosingPairs` and `surroundingPairs`. oculus's Julia (`settings.ts:145-168`) holds all three plus `comments`, so it wins each field. The Julia row passes.
- 3: holds. Its 32 rows pass, and on the base run copy the nine named ids fail.
- 4: holds by reading. The round did not change it. Two of the report's citations are stale, see Findings.
- 5: holds. `LATEX_SCOPES` (`editor-keys.ts:40-54`) matches LaTeX Workshop v10.19.0's scopes key by key:
  - build, clean and view: tex, cls and sty, not bib.
  - synctex, mathPreview, promote, demote, item, surround, selectLine and tabFocus: tex only.
  - text and math: tex and bib, not cls or sty.
  - The four latex-keys rows pass, and all four fail on the base.
- 6: holds. T1 is closed: the three comments are rewritten, and ruling 3's greps leave no false hit.

Cases of the brief's "Cases":

- C1, C2, C3, C4, C14, C15, C16: not verifiable here. Each is a look at landing, and the reading is consistent with each.
- C5: met by reading of the `latex` settings. The look is owed.
- C6: met by the table rows and by reading.
  - `.jl` brackets and pairs are met by the Julia row, through Monaco's own registry class.
  - The `.slurm` look is owed.
- C7: met. On the base run copy 9 rows fail with the nine ids named; after the change all 32 pass.
- C8: not verifiable (look). The reading is unchanged from the first review.
- C9, C10, C11, C12: not verifiable (look). The bindings are at `latex-tab.svelte.ts:422-451` and `rows.ts:221-251`.
- C13: met by reading. In `.bib`, Cmd+Alt+C is no longer keyed (row 'a .bib file'), so the press reaches `toggleFindCaseSensitive`: on mac it is `CtrlCmd|Alt|KeyC` (`findModel.js:28-30`), and `findController.js:886-891` registers it. The look is owed for the rest.
- C17, C18, C19, C21, C22: met by reading.
- C20: met. The '.bib', 'package' and 'class' rows show it, and the reading agrees.
- C23, C24, C25, C26, C27, C28, C30: not verifiable (look).
- C29: met by reading. It is not verified in the app.
- C31: met. G25's test passes, and the round did not change `docs/palette.md` (diff of the snapshot copy: 0 lines).

The seven points the brief asked to judge:

1. **Ruling 1.**
   - Same service: yes, by reading Monaco's code. `StandaloneServices.get` (`standaloneServices.js:687-701`) calls `initialize({})` only while not initialized. `languageSettings()` runs after `monaco.editor.create(<detached>, { model: null }, {...widgets.services, diffProviderFactoryService, editorProgressService})` (`load.ts:348-357`), so the overrides were applied once and stay in force. The service is a singleton of that one instantiation service (`registerSingleton(ILanguageConfigurationService, ..., Delayed)`, `languageConfigurationRegistry.js:362`). Monaco's public `setLanguageConfiguration` reaches the same `StandaloneServices.get(ILanguageConfigurationService)` at priority 100 (`standaloneLanguages.js:88-95`). Monaco's own Julia settings reach it through `_.contribution.js:42-45`, `onLanguageEncountered` then `setLanguageConfiguration`. The deep import resolves to the same file through the package's `"./*": "./esm/vs/*.js"` export, and `pageDiffs` and `keys/suggest.ts:55-60` already rely on that.
   - Rank 101 beats Monaco's Julia settings field by field: yes (item 2).
   - The test row reaches a stand-in, not `load.ts`'s path. `monacoStandIn()` wraps a fresh `new LanguageConfigurationRegistry()`, which is Monaco's own merge code. Its rank 100 is a constant copied into the test (`MONACO_RANK`, `comment-rules.test.ts:73`), which I checked against `standaloneLanguages.js:94`. `languageSettings()` in `load.ts` is reached by no test. Every language's settings go through that one call, so the C5 look (Cmd+/ in `.tex`) shows the wiring.
2. **Rank 102 for app settings (`register.ts`).**
   - It is inside the step's part. Without it, ruling 1's rank 101 would make an app's settings (given at 100) lose to oculus's for `shellscript`, `make`, `common-lisp` and both Fortran forms. Those ids reach an app's kit, since `languageKit` drops only highlight.js names (`data/prose/languages.ts:69-113`).
   - For those ids the behaviour is unchanged: the app won at the base by order at equal rank, and wins now by rank.
   - It changed for a language Monaco configures itself and an app adds (for example `go`, `rust`, `sql`, `shell`, `html`; none is in `REGISTERED`). See Behaviour below.
3. **Ruling 5.** Every scope matches, as item 5 above says. `.bib` leaves Cmd+Alt+C to Monaco's find case toggle, and nothing else in the tree binds Alt+Cmd+C (`grep -rn "'KeyC'"` over `src/lib/data/helpers/keys`, `src/lib/shell` and `src/desktop` finds only `editor-keys.ts:16`). Off macOS the same `cmd: true` presses become Ctrl. Monaco's off-macOS case toggle is Alt+C (`findModel.js:29`), so it does not collide.
4. **The tooltips.** See Spec below.
   - `bar_build_bare` comes from ruling 5, because Build has no key in `.bib`.
   - The `({0})` change goes beyond the rulings.
   - Both are user-visible, and the report states both with before and after.
5. **`comment-width.test.ts`.** The failure reproduces on the worktree and on the base run copy, with the same two lines. This step has no part in it.
   - Both files are byte-equal to the base copy.
   - The check is unchanged from the base.
   - No line the step wrote is flagged.
6. **Ruling 7's "Before and after".** It covers every change I found, with one exception: the change for apps that add a language Monaco configures (Behaviour below). Ruling 3's three greps reproduce as the report quotes them.
7. **Open item 259.** The round changed nothing about it:
   - `config/text/palette-page.yml` and `docs/palette.md` are unchanged from the snapshot (0 diff lines).
   - `state/workbench/palette.ts` changed only in its comments at `:5-8` and `:93`.

### Findings

- **Spec, a test no ruling orders.**
  - Place: `tests/ui/controls/editor/kit/comment-rules.test.ts:204-213`: `describe("an app's settings of a language", () => { it('win over the settings oculus gives the language', ...`.
  - What is wrong: spec.md "What every package obeys" says "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test. A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled." Rulings 1 and 5 ordered the Julia row and the LaTeX key rows. Nothing orders this row. It was written, and its guarded entry is only "Proposed, under the next free number" in the report's Doc text.
  - Failure scenario: the row lands with no entry Axel approved, and `guarded.md` no longer lists every test.
  - Verdict: none.
- **Spec, a change beyond the rulings: the tooltips' `({0})`.**
  - Place: `config/text/views/academic/latex.yml:11` and `:19`: `bar_build_title: Build the LaTeX project ({0})`, `bar_view_title: View the PDF ({0})`.
  - What is wrong: ruling 5 needed only `bar_build_bare` for a `.bib` tab. The base strings held fixed text, "(Cmd+Alt+B)", and ignored the hint `LatexButtons.svelte` already passed. Now the tooltip reads "(Alt+Cmd+B)" on macOS and "(Ctrl+Alt+B)" elsewhere. That order agrees with the Keys view (`bindings.ts` `chordLabel`) and the palette (`chords.ts:114-122` `pressHint`), but `docs/HELP.md:161` writes "Cmd+Alt+B". The report states the change with before and after under "Changes beyond the rulings" and "Before and after", and `LatexButtons.svelte` is named as outside the paths.
  - Failure scenario: a macOS user sees "Alt+Cmd+B" in the tooltip and "Cmd+Alt+B" in HELP.md for the same key.
  - Verdict: none.
- **Standards, a changed component over the size limit.**
  - Place: `src/lib/shell/keys/Palette.svelte`, 540 lines, changed by ruling 3 at `:28-35`.
  - What is wrong: check 4 of the brief's "Verify before you report" requires "a component at or under 520". spec.md "What every package obeys" says "A file the step changes that would pass 880 or 520 is split by concern in the step". The file is 540 at the base and in the worktree. The size check passes only because it refuses above 540 (`size.test.ts:30`, `count > line`). The report gives the count and calls the size check passed, but does not name the breach. The round brief ordered the edit.
  - Failure scenario: the step lands a changed component past 520 with no split, and the next edit to it has no room.
  - Verdict: no item is made violated; check 4 is red for this file. The orchestrator must choose between a split at landing and an open item.
- **Standards, leftovers of the timer design in the Julia row.**
  - Place: `comment-rules.test.ts:107-110`: `onLanguageEncountered: (_id, met) => { met(); ...`. Also `:174`: `await new Promise((resolve) => setTimeout(resolve, 0));`.
  - What is wrong: `registerSettings` no longer calls `onLanguageEncountered`, so the stand-in member and its doc comment at `:75-80` serve nothing. That is code larger than its job (spec.md, the principles). The wait at `:174` is a fixed sleep, and spec.md "What every package obeys" says "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin". Ruling 1 named the stub's callback when the code still deferred; the rank design defers nothing.
  - Failure scenario: a reader concludes that `registerSettings` reacts to a language being met or defers to a timer, and neither happens. A future deferral longer than one task would pass the row.
  - Verdict: none.
- **Standards, file-scope mutable state in the new test.**
  - Place: `tests/views/sources/source/latex-keys.client.test.ts:53-54`: `let client: ClientState;`, `let stops: (() => void)[] = [];`.
  - What is wrong: this is the same kind of file-scope mutable value that ruling 2 (P2) moved out of `comment-rules.test.ts`, under spec.md "No globals ... This holds in test fixtures and helpers too". The tree has 48 test files with a file-scope `let` (`grep -rln "^let " tests | wc -l`). The rule's text speaks of state "shared across module graphs", which this is not. Whether P2's standard applies here is the orchestrator's reading.
  - Failure scenario: a later case added to this file reads `client` from the previous case after a `beforeEach` change, and the cases stop being independent.
  - Verdict: none.
- **Standards, the verify list run beyond the rules file's allowance.**
  - Place: report, "Verification" 1: "This round it was started four times: the first run went to its end and failed ...; the second and third were stopped before their end because a change followed".
  - What is wrong: spec.md "Token discipline" allows one run after the last change, plus one more after a red fix. Two runs were started before the last change. This is the same kind of finding as S2 of the first review.
  - Failure scenario: tokens spent on runs whose results were discarded.
  - Verdict: none.
- **Standards, stale `file:line` citations in the report.**
  - Place: report, "Item 4", `kit/load.ts:315` (`import('monaco-editor')`, now `load.ts:328`) and `load.ts:346-348` (the `freedKeys` binding, now `load.ts:360`).
  - What is wrong: spec.md "Working rules" says "Every count, line count, timing and `file:line` in the report is taken after your last change". The round added 13 lines to `load.ts`.
  - Failure scenario: at the look, the orchestrator opens `load.ts:346` to check the freed keys and finds the language registration.
  - Verdict: none.
- **Standards, non-ASCII in the builder's copy of the report.**
  - Place: `.scratch/migration/agents/reviews/O65-report.md` in the worktree, at lines 64, 65 and 129 (the ellipsis character in quoted vitest output).
  - What is wrong: the brief's Report section requires a character outside ASCII to be written by its name in angle brackets. The copy saved on main already has `<horizontal ellipsis>` in its place.
  - Failure scenario: none after the orchestrator's save; the worktree copy would fail the character-set check if it were used.
  - Verdict: none.
- **Behaviour, an app's settings for a language Monaco configures itself now always win, and "Before and after" does not say so.**
  - Place: `src/lib/ui/controls/editor/kit/languages/register.ts:27`: `const APP_RANK = OCULUS_RANK + 1;`. Also `:49-53`: `settings.register(language.id, languageConfiguration(language.configuration), APP_RANK)`.
  - What is wrong: at the base an app's settings went through `setLanguageConfiguration` at 100 when the kit was applied. For a language Monaco configures itself (any of its basic languages outside oculus's highlight.js list, such as `go`, `rust`, `sql`, `shell` or `html`), Monaco gave its own settings at 100 later, when the first model of that language opened. Those won for every field they hold until the apps' kit changed again (`_.contribution.js:42-45`; later order wins at equal priority, `languageConfigurationRegistry.js` `cmp`). Now the app's settings win from the start, at 102. The register.ts head comment says so, but the report's "Before and after" names only Shell, Make, Common Lisp and the Fortran forms ("the app's settings still win"). Ruling 6 asked for every user-visible change.
  - Failure scenario: an app adds `go` with its own brackets or auto-closing pairs. At the base, opening a `.go` file switched those to Monaco's; now the app's stay. The look neither tries this nor knows it changed.
  - Verdict: ruling 6 not fully met; no item of the brief is made violated.

### Declined to judge

- **`npm run diagrams` and `npm run docs:palette`.** Both write into the worktree. I ran instead the in-memory staleness case of `tests/checks/diagrams/diagrams.test.ts` and `tests/checks/diagrams/palette.test.ts`, which compare without writing, and both pass.
- **The builder's run of the Julia row and the LaTeX key rows on the round-0 code.** The report quotes "1 failed | 32 passed (33)" and "3 failed | 1 passed (4)". Reproducing them needs a run copy of the round snapshot, which this review does not write. I judged by reading the snapshot's `settings.ts` and `latex-tab.svelte.ts`, and both readings give the quoted failures.
- **Whether the page's Vite pre-bundle serves `languageConfigurationRegistry` and `standaloneServices` from the same module instances as `monaco-editor`.** This is settled only on a running page. The deep imports resolve to the same files, and `pageDiffs` and `keys/suggest.ts` already use the same pattern. The C5 look on `.tex` settles it.
- **The builder's statement "This round ran no git command".** Only the session transcript settles it.
- **Every case marked "Look"** (C1 to C4, C8 to C12, C14 to C16, C23 to C28, C30), and C29 in the desktop app.
- **Open item 259.** It is Axel's to rule on; only whether the round touched it was judged.

Usage: a2f74dc039b54f0ee, claude-opus-5-5, 291871 tokens, 87 tool uses, 15 min 42 s
