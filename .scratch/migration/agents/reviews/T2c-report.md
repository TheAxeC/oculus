# T2c report: deletion sweep of tests/views, tests/shell, tests/ui, tests/themes

Everything in the brief is done. Nothing was run (no test, verify list, build, npm or git command), as the brief says; the counts below come from `find`, `wc` and a counting script in the session scratchpad.

## Open items for the orchestrator

1. `tools/oculus/tests/checks/tree/allow-audits.txt` is outside this step's write list. It has 107 lines that name `tests/views/...` cases, and every one of those test files is now deleted. `tests/checks/tree/audits.test.ts:325` and `:330` assert that each line of that file is held by a case in `tests/views`, so that check is red until the file is handled. `audits.test.ts` is not an entry of `agents/guarded.md`, so the checks sweep may delete both; this was read, not run. I did not edit it.
2. 59 files outside my folders (`src`, `tests/`, `config`, `bin`, `utils`, root files) still mention a path under `tests/views`, `tests/shell` or `tests/ui` in a comment or a string (`grep -rlE "tests/(views|shell|ui|themes)/" src tests config bin utils *.ts *.json *.md`, minus my folders). None of them imports a deleted file (checked below). Those comments are outside this step's write list and are not edited.

## 1. Per entry G1 to G32

An entry's test is chosen by reading, not running. "None in my folders" means no test in the four folders holds that unit.

- G1 (token on write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar routes): none in my folders.
- G2 (path outside the roots, routes fs, ops, open, source, search, history, project-files, file/[root]): none in my folders. `tests/shell/panes/strip/untitled-save.test.ts` refuses a name that leaves the root, but it tests `src/lib/views/sources/source/save/untitled-save.ts`, which G2's Code line does not name; deleted.
- G3 (`config/local.yml` never served): none in my folders.
- G4 (callback with a wrong `state`, calendar/callback and mail/callback): none in my folders.
- G5 (hub or feed text reaches HTML only through the sanitiser, unit `src/lib/ui/html.ts`): `tests/ui/html.test.ts`, describe `inlineMarkdown`, test `is the sanitiser over the inline renderer, so no field reaches a card around it`. The other 18 tests of that file (profile lists, href addresses, `codeSpans`, the `ssr = false` read) are deleted. `tests/views/whole/sanitise.test.ts` also touches G5 but is a view test and is deleted per the brief.
- G6 (`confirm: true` in git-routes.ts and deposit-routes.ts): none in my folders.
- G7 (values reach a command as arguments, routes commands, hpc, open): none in my folders.
- G8 (each write kind changes only its file and key): none in my folders.
- G9 (each write is logged and undoable, file save keeps a copy and is atomic): none in my folders.
- G10 (file operations do what they name): none in my folders.
- G11 (server starts on a clean checkout): none in my folders.
- G12 (shipped config files and catalogs read with no finding): none in my folders.
- G13 (wrong config value refused with a finding naming the key, default used): none in my folders. Tests here use `loadConfig` only to load the shipped catalog.
- G14 (real hub builds with no findings): none in my folders.
- G15 (manifest with a broken field still shows its project): none in my folders.
- G16 to G27: their tests are named in `agents/guarded.md` and live under `tests/checks/`; none in my folders. `tests/ui/theme/colours.test.ts` and `tests/themes/derive.test.ts` are not G26's test (`tests/checks/look/contrast.test.ts`) and are deleted.
- G28 (unsaved edit survives, closing a tab, pane or page that holds one asks first, closing a Terminal tab whose terminals run asks first). Units and parts in my folders:
  - `shell/panes/strip/close-question.svelte.ts`, part "unsaved text asks first": `tests/shell/panes/strip/tab-menu.test.ts`, describe `the closes of the tab menu, through its state`, test `asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing`.
  - `shell/panes/strip/close-question.svelte.ts`, part "a terminal running a program asks first": same file and describe, test `asks about the terminal running a program among the tabs an item closes`.
  - `state/forms/`, `state/sessions/source.svelte.ts`, `state/sources/repositories/review-comment.ts`, `state/client/context.ts`, `state/sessions/terminal/terminal-tabs.ts`, `server/machine/pty/channel.ts`: none in my folders. Files in my folders that import `context.ts`, `source.svelte.ts` or `terminal-tabs.ts` (`tab-scope.client.test.ts`, `give-back.client.test.ts`, `source-said.client.test.ts`, `source-actions.test.ts`, `workbench-keys.test.ts`) test other behaviour (tab-scope reads, dialog focus, a bookmark refusal, strip controls, the n key) and are deleted.
  - The other 3 tests of `tab-menu.test.ts`'s closes describe (answering yes closes, unsaved names with a terminal, a saved tab closes at once) and the other 4 describe blocks are deleted.
- G29 (saved layout of an earlier version is read): none in my folders.
- G30 (deposit commit refused while the secret scan finds a secret): none in my folders.
- G31 (record file that does not read is never overwritten): none in my folders.
- G32 (each parser of the hub's files reads a well-formed file): none in my folders.

## 2. Counts, before and after

Measured from `tools/oculus`: test files `find <folders> -name '*.test.ts' | wc -l`, `.ts` files `find <folders> -name '*.ts' | wc -l`, lines `find <folders> -name '*.ts' -exec cat {} + | wc -l`, slow-tagged files `grep -rl '@module-tag slow'`. Test cases: a node script in the session scratchpad blanks comments and strings, counts `it(` and `test(` calls (with `.skip`, `.only`, `.concurrent`) and counts the rows of each `it.each([...])` literal array; the one `it.each(Object.entries(SAMPLES))` in `tests/ui/controls/editor/kit/grammars.test.ts` is counted by its 31 entries by hand.

| | before | after |
|---|---|---|
| test files | 194 | 2 |
| `.ts` files | 216 | 7 |
| lines in `.ts` files | 51,995 | 291 |
| test cases | 2,217 (2,105 calls + 81 `.each` rows + 31 SAMPLES rows) | 3 |
| slow-tagged files | 4 | 0 |
| non-`.ts` files (`.svelte`) | 11 | 3 |

Folders: `tests/themes` held one file and no longer exists; `tests/views`, `tests/shell` and `tests/ui` keep the files below.

Kept files: `tests/ui/html.test.ts` (1 test), `tests/shell/panes/strip/tab-menu.test.ts` (2 tests), `tests/ui/frame/client-runtime.ts` (named by the brief), and the helpers of section 3. 217 files were removed by explicit path, and the folders left empty were removed with `find <folders> -depth -type d -empty -delete`.

## 3. Helpers kept because a file outside my folders imports them

Importers were found by `grep -rnE "(tests/|\.\./)(shell|views|ui|themes)/" tests utils src bin vite.config.ts package.json`, minus my folders, and each hit read.

- `tests/ui/controls/editor/monaco-diff.ts`: `tests/server/git/diff-patch.test.ts:27`, `tests/state/sources/repositories/diff/diff.test.ts:30`, `tests/state/sources/repositories/diff/hunks-git.test.ts:18` (import `monacoLineChanges`).
- `tests/shell/fixtures/Alpha.svelte`: `tests/state/workbench/layout/open/kept-panes.test.ts:32`.
- `tests/shell/rail/rail-fixture.ts`: `tests/state/workbench/navigation/catalogue.test.ts:25` (imports `catalog`, `doc`, `probe`).
- `tests/ui/menu/GroupContexts.svelte`: `tests/fixtures/client.ts:12`. It imports `tests/ui/menu/HeldContexts.svelte`, which is kept for that reason.
- `tests/views/shared/real-text.ts`: `tests/state/sources/explorer/acts/keys.test.ts:19`, `tests/state/sources/explorer/acts/folders.test.ts:20`.
- `tests/views/system/workbench/workbench-fixture.ts`: `tests/state/system/config-files.test.ts:12` (imports `catalog`).
- `tests/ui/frame/client-runtime.ts`: kept by the brief (`vite.config.ts:65`).

Helpers deleted because no kept file and no file outside my folders imports them: every other `.ts` helper (fixtures, harnesses, `fake-dom.ts`, `monaco-sources.ts`, `scope-watch.svelte.ts`, `give-back.svelte.ts`, `alpha-view.ts`, `shipped-rail.ts`, `press-on-render.ts` and the rest) and the `.svelte` probes and harnesses (`ActionsHost`, `Beta`, `ShownProbe`, `OpenGlyphList`, `LaidOutTooltip`, `OpenMenu`, `TreeHarness`, `SnippetProbe`). Judgment call the orchestrator may reverse: the brief defines a helper as a `.ts` file, and I treated the `.svelte` test fixtures as helpers too, since they exist only to serve tests; leaving them would leave unreferenced files. After the deletions, the relative imports of every kept file resolve to an existing file (checked with `ls` on each import path of the 10 kept files; no unresolved line printed).

## 4. Changes that are not a deletion

Each is a removal of words or an adjustment that follows from a deletion; no word was added and no assertion was edited.

- `tests/ui/html.test.ts`: the file now holds the head comment (the clauses and the last sentence about the deleted tests removed, the remaining sentences rewrapped at 100 columns), 3 imports and the one test. The `readFileSync` import, the import list of constants and `codeSpans`, and the four deleted describe blocks are gone.
- `tests/shell/panes/strip/tab-menu.test.ts`: the head comment keeps its first sentence and its last paragraph with the deleted subjects cut out and is rewrapped at 100 columns; the paragraph about the stand-in `t` is removed; the import of `tab-menu.ts` and the helpers `words`, `PLAIN`, `labels` that only the deleted tests used are removed.
- `tests/ui/controls/editor/monaco-diff.ts`: the `export` keyword removed from `MonacoLineChange` and `modelLines`, which no file imports (`grep -rnE "modelLines|MonacoLineChange" tests src` outside the file finds only an unrelated `modelLines` in `src/lib/state/sources/repositories/diff/diff-patch.ts`). Both remain in the file because `monacoLineChanges` uses them.
- `tests/shell/rail/rail-fixture.ts`: removed `COLLECTIONS`, `count`, `buttonWith` and the `collectionKeys` import (no importer); removed the `export` keyword from `config` and `component` (no importer; both are used inside the file); the head comment lost the clause "and the renderers that draw the rail to HTML over them".
- `tests/views/system/workbench/workbench-fixture.ts`: removed every export but `catalog` (`configured`, `words`, `read`, `READING`, `shippedTexts`, `FileLog`, `withFiles`, `shippedWith`, `itemOf`, `groupOf`, `buttonNamed`, `freshSuite`), the imports they alone used, and the `export` keyword of `config`; the head comment lost the clauses describing the removed helpers.
- `tests/shell/fixtures/Alpha.svelte`: the comment "A view for tests/shell/workbench.test.ts, registered like a real one." became "A view registered like a real one."
- `tests/checks/tree/allow-duplication.txt`: 44 lines deleted, each naming a file I deleted; 113 lines before, 69 after (`wc -l`); `grep -nE 'tests/(views|shell|ui|themes)/'` over it prints nothing. No other line changed.
- Folders left empty by the deletions were removed, including `tests/themes`.

Comment check on the edited files: `grep -nEi "before|used to|no longer|still|always|as before|previously|the step adds|after this"` over the five edited kept files hits `tab-menu.test.ts:35` ("read before the pick") and `:99` (the test title "asks before Close Others"); both describe behaviour, neither compares with an earlier state. `LC_ALL=C grep -n '[^ -~]'` over the 10 kept files prints nothing. Head comments of kept files that mention "suites" in general (`rail-fixture.ts:1`, `workbench-fixture.ts:1`) name no deleted test and were left.
