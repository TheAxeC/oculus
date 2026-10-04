# T2c report: the deletion sweep of tests/views, tests/shell, tests/ui and tests/themes

Everything in the brief is done. Nothing was run (no test, no verify list, no build, no npm command, no git command), as the brief says; the landing runs the verify list. Items that go to the orchestrator are under "Outside the write list" at the end.

## 1. The tests kept, per entry and part

Paths are under `tools/oculus/`.

- G1: none in my folders.
- G2: none in my folders.
- G3: none in my folders.
- G4: none in my folders.
- G5: `tests/ui/html.test.ts`, "is the sanitiser over the inline renderer, so no field reaches a card around it" (describe `inlineMarkdown`).
- G6: none in my folders.
- G7: none in my folders.
- G8: none in my folders.
- G9: none in my folders.
- G10: none in my folders.
- G11: none in my folders.
- G12: none in my folders.
- G13: none in my folders.
- G14: none in my folders.
- G15: none in my folders.
- G16 to G25, G27: none in my folders (their tests are the files `agents/guarded.md` names under `tests/checks/`).
- G26: none in my folders (`tests/checks/look/contrast.test.ts` is the named test; `tests/ui/theme/colours.test.ts`, `tests/themes/derive.test.ts` and `tests/ui/controls/editor/kit/badge.test.ts` are not it and are deleted).
- G28, a tab holding unsaved text asks before it closes: `tests/shell/panes/strip/tab-menu.test.ts`, "asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing".
- G28, closing a Terminal tab whose terminal runs a program asks first: `tests/shell/panes/strip/tab-menu.test.ts`, "asks about the terminal running a program among the tabs an item closes".
- G28, an unsaved edit survives a tab switch and a reload (form, manifest editor, file editor, review comment box): none in my folders.
- G28, closing a pane or a page that holds an unsaved edit asks first: none in my folders.
- G28, a move, a split or a reload stops no terminal: none in my folders.
- G28, a page that detaches stops the delivery and leaves the tmux session running: none in my folders.
- G29: none in my folders.
- G30: none in my folders.
- G31: none in my folders.

Choices made by reading, which the landing settles against the other sweeps:

- The two G28 tests exercise `createCloseQuestion` (`src/lib/shell/panes/strip/close-question.svelte.ts`, listed under G28's code) through `createTabMenu` on the real client stores. `tests/state/workbench/navigation/pages.test.ts` (`closeAsk`) and `tests/state/client/terminal/terminal-close.test.ts` hold the same parts one layer down; those files are in another sweep's folders.
- G5: in the node suite `sanitise` hands the text back unchanged, so the kept test shows that `inlineMarkdown` is the sanitiser over marked's inline renderer; it does not show DOMPurify's filtering. The other cases of the file (profile lists, href addresses, `codeSpans`, the check that `src/routes/+layout.ts` sets `ssr = false`) are deleted.
- No view test is kept (Z394). Cases in views that touched an entry (for example `editor-saving.client.test.ts`, `commit-box.test.ts`, `files-ops.test.ts`) are deleted.

## 2. Counts

Taken by `find tests/views tests/shell tests/ui tests/themes -name '*.test.ts' | wc -l`, the same with `-name '*.ts'`, `find ... -name '*.ts' -exec cat {} + | wc -l`, `grep -rl '@module-tag slow'`, and a TypeScript syntax-tree count of `it(` / `test(` calls with `.each` counted by its rows (a script in the session scratchpad, not in the tree; it counts `.each` over an array literal, over an `as const` array and over `Object.entries(<object literal>)`).

| | before | after |
|---|---|---|
| test files (`*.test.ts`) | 194 | 2 |
| `.ts` files | 216 | 7 |
| lines in `.ts` files | 51,995 | 287 |
| test cases | 2,826 | 3 |
| files of any kind in the four folders | 227 | 10 |
| files tagged slow | 4 | 0 |

After the step the four folders hold: `tests/ui/html.test.ts`, `tests/shell/panes/strip/tab-menu.test.ts`, `tests/shell/fixtures/Alpha.svelte`, `tests/shell/rail/rail-fixture.ts`, `tests/ui/controls/editor/monaco-diff.ts`, `tests/ui/frame/client-runtime.ts`, `tests/ui/menu/GroupContexts.svelte`, `tests/ui/menu/HeldContexts.svelte`, `tests/views/shared/real-text.ts`, `tests/views/system/workbench/workbench-fixture.ts`. `tests/themes/` is gone (its only file was deleted; the empty directories were removed). 217 files were removed, each by an explicit `rm -- '<path>'` line preceded by a print of the path and a check that it is not among the ten kept files; the check never fired.

## 3. Helpers kept because a file outside my folders imports them

Importers were found by resolving each relative import specifier against the importing file's directory over `tests/`, `utils/`, `src/`, `config/` and `vite.config.ts` (a first grep by file stem matched same-named files in other folders and was discarded).

- `tests/shell/fixtures/Alpha.svelte`: `tests/state/workbench/layout/open/kept-panes.test.ts`.
- `tests/shell/rail/rail-fixture.ts`: `tests/state/workbench/navigation/catalogue.test.ts` (imports `catalog`, `doc`, `probe`).
- `tests/ui/controls/editor/monaco-diff.ts`: `tests/server/git/diff-patch.test.ts`, `tests/state/sources/repositories/diff/diff.test.ts`, `tests/state/sources/repositories/diff/hunks-git.test.ts` (import `monacoLineChanges`).
- `tests/ui/frame/client-runtime.ts`: `vite.config.ts:65`.
- `tests/ui/menu/GroupContexts.svelte`: `tests/fixtures/client.ts:12`; it imports `tests/ui/menu/HeldContexts.svelte`, which stays with it.
- `tests/views/shared/real-text.ts`: `tests/state/sources/explorer/acts/folders.test.ts` and `tests/state/sources/explorer/acts/keys.test.ts` (import `installRealText`).
- `tests/views/system/workbench/workbench-fixture.ts`: `tests/state/system/config-files.test.ts:12` (imports `catalog`).

Deleted helpers (no kept file and no file outside the folders imports them): 17 `.ts` files and 8 `.svelte` files, among them `tests/ui/frame/fake-dom.ts`, `tests/views/shared/commands/commands-fixture.ts`, `tests/views/shared/pane-parts.ts`, `tests/shell/rail/shipped-rail.ts`, `tests/ui/controls/editor/monaco-sources.ts`, `tests/shell/fixtures/Beta.svelte`.

Exports deleted inside kept helpers (no file imports them):

- `rail-fixture.ts`: `COLLECTIONS` and its `collectionKeys` import, `count`, `buttonWith` deleted; the `export` keyword dropped from `config` and `component` (both are used inside the file).
- `workbench-fixture.ts`: `configured`, `words`, `read`, `READING`, `shippedTexts`, `FileLog`, `withFiles`, `shippedWith`, `itemOf`, `groupOf`, `buttonNamed`, `freshSuite` and the imports only they used deleted; the `export` keyword dropped from `config`.
- `monaco-diff.ts`: the `export` keyword dropped from `modelLines` and `MonacoLineChange` (used inside the file).

## 4. Changes that are not a deletion

- Comments rewrapped to 100 columns after words were deleted from them: `tests/shell/panes/strip/tab-menu.test.ts` lines 1 to 5, `tests/shell/fixtures/Alpha.svelte` lines 2 to 3. In `tests/ui/html.test.ts` the head comment lost the clauses about the deleted cases (profile, hrefs, `codeSpans`, the `ssr` check); the first word after the layer sentence changed case in two head comments because the words before it were deleted (`tab-menu.test.ts`: "The closes"; `workbench-fixture.ts`: "The real config").
- Head comments: `tab-menu.test.ts` lost its sentence about the stand-in `t`, its list of the deleted describes and "the clipboard itself"; `rail-fixture.ts` lost "the rail suites share: the views this suite registers of its own, and the renderers that draw the rail to HTML over them"; `workbench-fixture.ts` lost "What the workbench view suites share" and the two clauses about clients that no longer exist; `real-text.ts` lost "installed for a test that renders a view"; `Alpha.svelte` lost "for tests/shell/workbench.test.ts" and "which is what the test looks for".
- The `export` keyword removed from `config`, `component` (`rail-fixture.ts`), `config` (`workbench-fixture.ts`), `modelLines` and `MonacoLineChange` (`monaco-diff.ts`), as listed in section 3.
- Empty directories under the four folders removed, including `tests/themes/`.
- `tests/checks/tree/allow-duplication.txt`: 44 lines deleted, every one naming a file under the four folders that is deleted; 113 lines before (`wc -l`), 69 after; no other line touched; no remaining line names a path under the four folders.
- No assertion edited. The two kept tests in `tab-menu.test.ts` and the one in `html.test.ts` are byte-identical to their originals, and so are their `// Revert:` comments.

## Checks made after the last change

- `LC_ALL=C grep -n '[^ -~]'` over every file of the four folders and `allow-duplication.txt` prints nothing.
- A resolver over `tests/`, `src/`, `utils/`, `config/` and `vite.config.ts` finds no import that points at a file under the four folders that no longer exists.
- No comment line past column 100 in `tab-menu.test.ts` or `html.test.ts` (awk over the lines starting with `//`, `*` or `/*`).
- Not verified: that the kept files compile and pass, and that prettier accepts them; the verify list at landing does that.

## Outside the write list (for the orchestrator)

- `src/lib/ui/html.ts:24` says "tests/ui/html.test.ts reads that file and fails if the app ..." (the deleted `ssr = false` case). With only one case left in that file the sentence is false.
- Comments in `src` naming deleted tests: `src/lib/ui/tabs/TabFace.svelte:70` (`tests/ui/theme/colours.test.ts`), `src/lib/ui/controls/editor/kit/colours.ts:12` (`tests/ui/controls/editor/kit/theme.test.ts`), `src/lib/state/shared/words/tones.ts:5` (`tests/ui/theme/colours.test.ts`), `src/lib/state/system/deposit.svelte.ts:134` (`tests/views/boards/deposit.test.ts`), `src/lib/state/sessions/transcript.svelte.ts:225` (`tests/views/sessions/sessions.test.ts`), `src/lib/state/sessions/changes.svelte.ts:62` (`tests/views/system/history.test.ts`).
- `tests/checks/tree/allow-audits.txt` holds 107 lines naming cases under `tests/views/`; `tests/checks/tree/audits.test.ts` and `tests/checks/tree/negatives.test.ts` read `tests/views/`. They are in `tests/checks/`, outside this step's list and not entries of `agents/guarded.md`; whoever sweeps `tests/checks/` removes them.
- About 50 other test files and `DESIGN.md` carry a path to a deleted test in a comment (`grep -rnE "tests/(views|shell|ui|themes)/"` over `tools/oculus` excluding `.scratch`); they are in other sweeps' folders.
