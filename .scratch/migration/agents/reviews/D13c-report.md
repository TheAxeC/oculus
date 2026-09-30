# D13c report: the code theme, `code_theme:` in `config/appearance.yml` and its control in the Settings view

Everything in the brief is done. Two things are the orchestrator's and not verified here: the look on TEST (the source tab, a diff and the merge editor, each before and after a pick, case 4), and the console behaviour of a code theme whose import fails in a real browser (see "Sharp edges").

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md`, section "Open items")

- none.

## The cases' first run on the unchanged tree

Each case was written as a test first and run on the tree before any source change. No case was found where the brief's own rules give a wrong result, so nothing was handed back before building. Result per case (red = the test failed on the unchanged tree, green = it passed):

| Case | Test | First run |
|---|---|---|
| 1 | `paint.test.ts` existing "defining only oculus in the second colours" (paint with no code theme); `theme.test.ts` "is tokens with no key..." | paint half green (unchanged behaviour), `codeThemeDefault` half red (function absent) |
| 2 | `paint.test.ts` "paints dark-plus rules over the tokens colours, defining only oculus"; `theme.test.ts` "is the configured value..." | red, red |
| 3 | `paint.test.ts` "drops a scope-less entry and a scoped entry background, keeping the foreground" (nord and github-light) | red |
| 4 | `ui.test.ts` "saves a pick under the one key and reads it back from the same storage"; the repaint of open editors is for the look | red; look not taken |
| 5 | `ui.test.ts` "keeps a pick of tokens over a configured code theme"; `paint.test.ts` "follows a switch back to tokens with the tokens rules again" | red, red |
| 6 | `config.test.ts` "names a code theme that is no listed id..." (`not-a-theme`); `theme.test.ts` | red, red |
| 7 | same tests with `5` | red, red |
| 8 | `ui.test.ts` "reads a saved id the list does not hold as no pick" | red |
| 9 | `ui.test.ts` "loads an envelope saved before the field, every other value as saved" | red |
| 10 | `paint.test.ts` "makes a new highlighter for a switch to a code theme, and none for the same theme again" | red |
| 11 | `paint.test.ts` "follows a switch of the UI theme with the code theme kept" | red |
| 12 | `paint.test.ts` "answers a load that fails as a rejection, keeps the theme in force and asks again later" | red |
| 13 | `code-theme-menu.test.ts` (all four cases); `settings.test.ts` "draws the code theme menu..." and "draws a picked code theme under its own display name" | red (module absent), red, red |
| 14 | read | read: `grep -n "codeTheme\|code_theme" src/lib/data/prose/*.ts src/lib/views/shared/code/Code.svelte src/lib/state/shared/words/languages.ts` prints nothing, before and after the step |
| 15 | `ui.test.ts` "follows a live edit of the key in a browser that has not picked, through any other save" | red |
| 16 | `ui.test.ts` "keeps the config default reaching a browser with a saved theme and instance state" | red |
| 17 | `config.test.ts` (`''` and `null`); `theme.test.ts` | red, red |
| 18 | `config.test.ts` (`Dark-Plus`, `TOKENS`); `theme.test.ts` | red, red |
| 19 | `config.test.ts` "names a bad code theme in a config that has no themes list" | red |
| 20 | `config.test.ts` "audit: reports code_theme defined in two files like any other key" | green (the merge treats every key alike); named an audit since no revert of this step turns it red |
| 21 | `paint.test.ts` "leaves the last asked paint in force when an earlier load is in flight" | red |
| 22 | `paint.test.ts` "loads a code theme once however often it is painted" | red |
| 23 | `paint.test.ts` "paints tokens for an id the list does not hold" | green on the unchanged tree (it ignores the second argument and paints tokens); the P9 revert below turns it red |
| 24 | `ui.test.ts` "saves no pick for the empty string or an id the list does not hold" | red |
| 25 | `config.test.ts` "carries code_theme with the other appearance keys, and only when the config holds it" | red |
| 26 | `ui.test.ts` "is separate from the UI theme of the same name" | red |

The run: `npx vitest run --reporter=verbose` over the seven test files gave `Test Files  7 failed (7)`, `Tests  27 failed | 130 passed (157)`.

## DONE / NOT DONE

| Item | Proof | State |
|---|---|---|
| 1 `config/appearance.yml` section and head comment | `tests/checks/config/config-folder.test.ts` (key listed), `config.test.ts` (`themeFindings` says nothing for the shipped file) | DONE |
| 2 `code_theme` in `VOCAB_KEYS` | `config.test.ts` "carries code_theme with the other appearance keys..."; `tones.test.ts` "carries all eleven keys..." | DONE |
| 3 `src/lib/data/helpers/code-themes.ts`, boundary row, DESIGN.md state row | `boundaries.test.ts` (B1 and B2 reverts red); `ls src/lib/data/helpers | wc -l` prints 10 | DONE |
| 4 `themeFindings` reports `code_theme`, words `findings.appearance.code_theme` | `config.test.ts` (3 cases) | DONE |
| 5 `codeTheme` variable, `codeThemeDefault()`, allow-list entry | `theme.test.ts` (2 cases), `boundaries.test.ts` | DONE |
| 6 `Ui.codeTheme`, `codeTheme()`, `setCodeTheme`, `loadUi`, head comments | `ui.test.ts` (9 new cases and the changed envelope case) | DONE |
| 7 control: `code-theme-menu.ts`, `Appearance.svelte`, `ui.code_theme`, `ui.code_theme_tokens` | `settings.test.ts` (2 new cases), `code-theme-menu.test.ts` (4 cases) | DONE |
| 8 paint: `load.ts`, `theme.ts`, `look.ts` | `paint.test.ts` (9 new cases through the real shiki and the real theme files) | DONE |
| 9 editors and their parents pass `codeTheme` | `npm run check` (0 errors); drawn behaviour is for the look | DONE, look owed |
| 10 docs: DESIGN.md (config paragraph, state row, editor theme), HELP.md (rail paragraph, `settings` row, `appearance.yml` row) | `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` prints nothing; `tests/views/system/help.test.ts` passes | DONE |
| 11 tests | see the revert table | DONE |

### Revert runs (each made once in the source, the test seen red, the source put back)

Run by `scratchpad/reverts.py`, which replaces one string in the named source file, runs the test file, and restores the file; afterwards `find . -name "*.revertbak"` prints nothing. Failing test names quoted from the run.

| Revert | Test red under it |
|---|---|
| P1 `const id = ''` in `paintNow` (load.ts) | "paints dark-plus rules over the tokens colours, defining only oculus" (and 7 others) |
| P2 `codeRules` returns `theme.tokenColors ?? []` | "drops a scope-less entry and a scoped entry background, keeping the foreground" |
| P3/P4 `id` left out of the signature | "makes a new highlighter for a switch to a code theme, and none for the same theme again", "follows a switch back to tokens with the tokens rules again" |
| P5 `rulesOf` returns the stored rules without `structuredClone` | "follows a switch of the UI theme with the code theme kept" |
| P6 `rules.set(id, [])` before the load | "answers a load that fails as a rejection, keeps the theme in force and asks again later" |
| P7 cache condition replaced by `true` | "loads a code theme once however often it is painted" |
| P8 queue replaced by `queue = paintNow(read, code)` | "leaves the last asked paint in force when an earlier load is in flight" |
| P9 `const id = code` | "paints tokens for an id the list does not hold" (and 3 others) |
| T1 `codeTheme = String(config.code_theme ?? CODE_TOKENS)` | "is tokens with no key, and for a value that is no listed id, case included" |
| T2 the `codeTheme = ...` line removed from `setAppearance` | "is the configured value: tokens, or the id of a listed theme" |
| U0 `setCodeTheme` saves `{ ...store.current }` | "saves the seven appearance values and one blob per instance under the one key" |
| U1 `codeTheme()` answers `?? 'tokens'` | "is the configured default for a browser that saved nothing, before and after a load" |
| U2 `save` freezes `codeThemeDefault()` into the envelope | "follows a live edit of the key in a browser that has not picked, through any other save" |
| U3 `loadUi` falls back to the default instead of null | "keeps the config default reaching a browser with a saved theme and instance state" |
| U4 `loadUi` reads `codeTheme: null` | "saves a pick under the one key and reads it back from the same storage" |
| U5 tokens saved as null | "keeps a pick of tokens over a configured code theme" |
| U6 `codeTheme: id` saved unchecked | "saves no pick for the empty string or an id the list does not hold" |
| U7 any saved string kept | "reads a saved id the list does not hold as no pick" |
| U8 `loadUi` returns false without the field | "loads an envelope saved before the field, every other value as saved" (and 11 others) |
| U9 `setCodeTheme` also sets `theme` | "is separate from the UI theme of the same name" |
| C2 the check in `themeFindings` disabled | "names a code theme that is no listed id, one finding per value, case included" |
| C3 early return before the check returns `[]` | "names a bad code theme in a config that has no themes list" |
| C4 check without `Object.hasOwn` | "says nothing for an absent code_theme, tokens or a listed id" |
| C5 `code_theme` out of `VOCAB_KEYS` | "carries code_theme with the other appearance keys, and only when the config holds it"; `tones.test.ts` "carries all eleven keys the client state reads at first load" |
| CF `code_theme:` removed from `appearance.yml` | `config-folder.test.ts` "holds exactly the expected top-level keys, and no more" and "reads each file on its own and finds its own keys there and nowhere else" |
| S1 menu block removed from `Appearance.svelte` | "draws the code theme menu and the theme in force, From the theme under tokens", "draws a picked code theme under its own display name" |
| S2 `codeThemeLabel` answers the id | "draws a picked code theme under its own display name" |
| M1 tokens item last | "audits that the list opens with From the theme, then 44 dark and 21 light themes by display name" |
| M2 flat list | "audits that a rule sits above the dark group and above the light group, none above the first item" |
| M3 `active: false` on every item | "audits that the one in force is marked active, and only that one" |
| M4 a second tokens item | "audits that every id is unique and none but the first is tokens" |
| B1 `data/helpers/code-themes` out of the state row | `boundaries.test.ts` "holds across src/lib" |
| B2 `codeTheme` out of the mutable-variable allow-list | `boundaries.test.ts` "holds no process-wide state under src" |

A test no revert turns red and therefore named an audit: `config.test.ts` "audit: reports code_theme defined in two files like any other key" (case 20, the merge is key-agnostic). The four cases of `code-theme-menu.test.ts` are named "audits that ..." because `tests/checks/tree/audits.test.ts` requires that name of every case under `tests/views` that draws nothing; each of them fails under its revert (M1 to M4).

### The verify list, verbatim from `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, run after `npm run diagrams`

```
$ npm test
 Test Files  338 passed | 19 skipped (357)
      Tests  5147 passed | 557 skipped (5704)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790726338395 COMPLETED 2345 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 3.56s
built in 9.09s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

(The build lines are quoted without the tool's check-mark glyph; the last command above printed nothing.)

Earlier runs of the list on this step were red in files I changed and were fixed and the list rerun: `tests/state/shared/words/tones.test.ts` (eleven keys now) and `tests/views/system/help.test.ts` (the manual carries the Config view's description), `comment-width.test.ts` (three comment lines past column 100), and `npm run lint` (six unnecessary conditionals). No red line in a file the step does not change remains.

Not run: `tests/ui/controls/editor/theme.test.ts` (tagged slow, unchanged; `theme.ts` gained `codeRules` and `editorTheme` is untouched). Not measured: the size of the first chunk after `shiki/themes` joined it (the build passed; no chunk size was compared).

Greps after the change (`grep -rn "code_theme\|codeTheme" src tests config DESIGN.md HELP.md docs` lists the files of this step only; no false comment remains: the head comments of `load.ts`, `look.ts`, `theme.ts`, `Editor.svelte`, `DiffEditor.svelte`, `views/sources/source/Editor.svelte`, `appearance.ts`, `catalogs.ts`, `ui.svelte.ts`, `Appearance.svelte` and `themes.ts` were each rewritten, and "the six appearance values" is gone: `grep -rn "six appearance" src tests DESIGN.md HELP.md` prints nothing).

## Files (line counts after the step)

New: `src/lib/data/helpers/code-themes.ts` 36, `src/lib/views/system/workbench/code-theme-menu.ts` 26, `tests/views/system/workbench/code-theme-menu.test.ts` 68.

Changed: `config/appearance.yml` 66, `config/text/findings.yml` 104, `config/text/ui.yml` 82, `config/text/views/system/config.yml` 25, `src/lib/data/sources/config/catalogs.ts` 204, `src/lib/data/sources/config/themes.ts` 80, `src/lib/state/shared/words/appearance.ts` 220, `src/lib/state/workbench/ui.svelte.ts` 432, `src/lib/views/system/workbench/Appearance.svelte` 170, `src/lib/ui/controls/editor/kit/load.ts` 217, `kit/theme.ts` 176, `kit/look.ts` 50, `Editor.svelte` 517, `DiffEditor.svelte` 397, `src/lib/views/sources/source/Editor.svelte` 218, `merge/Merge.svelte` 325, `merge/MergeSide.svelte` 159, `diff/Diff.svelte` 505, `diff/DiffSection.svelte` 344, `tests/checks/config/config-folder.test.ts` 679, `config.test.ts` 747, `tests/checks/tree/boundaries.test.ts` 605, `tests/state/workbench/ui.test.ts` 641, `tests/views/system/workbench/settings.test.ts` 331, `tests/ui/theme/theme.test.ts` 272, `tests/ui/controls/editor/paint.test.ts` 308, `DESIGN.md` 323, `HELP.md` 300, and `docs/diagrams/` (regenerated by `npm run diagrams`).

Paths outside the brief's list that the step had to write (a named thing is its whole; each is forced by a check that went red):
- `config/text/views/system/config.yml` (`desc_appearance`): the Config view's words for `appearance.yml` now name the code theme; `tests/views/system/help.test.ts` requires HELP.md to carry that sentence verbatim, and HELP.md's `appearance.yml` row does.
- `tests/state/shared/words/tones.test.ts`: the first frame now carries eleven keys.
- `tests/views/sources/repositories/repositories.test.ts`: the `DiffSection` fixture passes `codeTheme: 'tokens'`, since `DiffSection` and `MergeSide` take it as a required prop (as they take `look`).

## Judgment calls the brief left open (each reversible)

1. Extra exports: `isCodeTheme(value)` in `code-themes.ts` (one rule for the finding, the store's pick check and the store's load check) and `codeThemeLabel(active, t)` in `code-theme-menu.ts` (the opener's value words, testable without a DOM). `appearance.ts` re-exports `CODE_TOKENS`, `codeThemeInfo` and `isCodeTheme` so the view reads the list through the state layer.
2. The painter's new inputs are two `PaintParts` fields: `codeIds` (the ids the paint may be asked for) and `loadTheme(id)` (the real one is `bundledThemes[id]()` unwrapped to its `default`, imported in `load.ts`). `EditorKit.paint` is typed `Paint = (read, code?) => Promise<string>`; an omitted or unlisted code paints `tokens`, so `load.ts` names no `tokens` constant (the ui layer may not import the data helper).
3. `codeRules(theme)` lives in `kit/theme.ts` and drops a rule with no `scope` and any `background`; a rule left with no setting is dropped as well.
4. Shiki normalises the registration it is handed in place (it inserts a scope-less rule of the base colours at the front of `tokenColors`). The painter therefore caches the rules as the file gave them and hands each paint a `structuredClone`; without the copy the second paint would carry the first paint's base colours (revert P5).
5. The Code theme menu sits in its own row after the theme row, with the glyph name `code` (a name in `glyphs.yml`), placement `down`, and a value span `data-code-theme` after it.
6. The finding's words: `code_theme is {0}, which is neither tokens nor the id of a Shiki theme; the editor colours code from the tokens instead`, with `{0}` the value as JSON (`"nord-x"`, `5`, `""`, `null`), so an empty value and a non-string are visible. The key `code_theme` is checked with `Object.hasOwn`, so `code_theme:` with no value (YAML null) is a finding and an absent key is not.
7. The menu's order within a group is Shiki's own order; checked with a script over `shiki/themes` that it equals the order by display name within both groups (44 dark, 21 light), so "by label" and "in its order" give one list.
8. The editors and the two partials repaint on a combined key `JSON.stringify([look, codeTheme])`, computed once as a `$derived` named `painting`.
9. `dark-plus`'s display name is `Dark Plus` (the test asserts that, not `Dark+`).

## User-visible changes, before and after (what the look on TEST is read against)

- `config/appearance.yml`: before, no code theme key; after, a `code_theme: tokens` section after `crt:` with its comment. Editing it to `nord` or `dark-plus` and saving reaches an open page on the config push, in every browser that has not picked.
- Settings view, Appearance section (open the Settings view on TEST): before, rows Theme, Text, CRT/Wallpaper/Icons; after, a row after the theme row with a "Code theme" menu button (glyph `code`) and beside it the value in force, "From the theme" on a fresh browser. Open the menu: "From the theme" first, a rule, 44 dark themes by name (Andromeeda first), a rule, 21 light themes; the one in force is checked. Pick "Nord": the value reads "Nord".
- The source tab, a diff pane (Repositories) and the merge editor (a conflicted path): before, syntax colours always from the UI theme's `--c-code-*` tokens; after a pick of a Shiki theme, the syntax colours are that theme's, repainted in place without reopening the editor; the editor background, gutter and chrome stay the UI theme's; picking "From the theme" returns the token colours. Reload the page: the pick stays. Switch the UI theme with a pick in force: the background and chrome follow the UI theme, the syntax colours stay the picked theme's.
- Markdown code blocks and the read-only code windows are unchanged by the pick (case 14, read).
- Not visible but stored: the pick is saved as `codeTheme` in the `oculus.ui.v1` envelope (version stays 2); it is `null` until a pick is made.

## Sharp edges and limits

1. A dark Shiki theme under a light UI theme paints its own foregrounds on the light panel with no contrast adjustment (decision 3 of the brief); the look on TEST is where to read how bad it is (for example `dark-plus` under the `light` UI theme, and `github-light` under `dark`).
2. A code theme whose file fails to import rejects `kit.paint`, and the editors call it as `void loaded.paint(token, codeTheme)` and `void kit.paint(token, code)` in `look.ts`, so in a real browser the failure would surface as an unhandled promise rejection in the console while the theme in force stays. The unit tests hold the rejection, the theme in force, and the next paint (case 12); the console behaviour is not verified.
3. `code-theme-menu.test.ts` sits under `tests/views`, where the tree check `audits.test.ts` names every case that renders nothing an audit, so its four cases carry "audits that". The menu's open list is drawn in a portal the unit render never draws, so no case draws the list; the look does.
4. The whole list of 65 themes (44 dark, 21 light) is in one menu, as the brief specifies; no search field.

## Anything in the brief wrong or impossible

Nothing was impossible. Two points of the brief needed more than it said: the tests of the step touch three files outside its path list (`tones.test.ts`, `repositories.test.ts`, `config/text/views/system/config.yml`, listed above), and the builder cases sit under a folder whose tree check forces the "audits" name (sharp edge 3).

## Repair round 1

All six findings are fixed. Sharp edge 2 above (an unhandled rejection from a failed code theme import) no longer holds; finding 1 replaces it.

1. Failed import: `paintCode(kit, code, failed)` in `src/lib/ui/controls/editor/kit/look.ts:38` calls `kit.paint`, catches a rejection, calls `failed()` and always resolves. `repaint` (look.ts:51-60) now takes `done(painted: boolean)` and calls `done(true)` before the paint and `done(false)` through `paintCode` when it fails. Both mount calls (`Editor.svelte:197`, `DiffEditor.svelte:174`) use `paintCode` with `() => (painted = null)`, and both repaint effects (`Editor.svelte:371`, `DiffEditor.svelte:295`) pass `(ok) => (painted = ok ? wanted : null)`, so the next change of the look or of the code theme paints again; a second pick of the same theme changes neither and does not repaint. No words, no status line. New test file `tests/ui/controls/editor/look.test.ts` (2 cases, stand-in kit whose paint rejects). Red runs, one revert each:
   - Revert: drop the try/catch in `paintCode`. Failing line: `AssertionError: promise rejected "Error: import failed" instead of resolving` at `look.test.ts:20:69` ("resolves when the paint rejects, and tells the editor to forget what it painted").
   - Revert: call `failed()` after a successful paint. Failing line: `AssertionError: expected null to be 'look' // Object.is equality` at `look.test.ts:33:25` ("leaves the painted key alone when the paint succeeds, and passes the code theme on"); the first case fails too, at line 20 as above.
   - `repaint`'s frame and the effects are not unit-tested (no DOM); they are for the look.
2. `isCodeTheme` reads `codeThemeIds()` (`src/lib/data/helpers/code-themes.ts:32`). The list copy in `kit/load.ts` stays. Covered by the existing `theme.test.ts` `codeThemeDefault` cases and `ui.test.ts` pick cases (both pass); no new test.
3. `paint.test.ts` "leaves the last asked paint in force when an earlier load is in flight" now waits (`Promise.race` of the dark-plus paint and a 500 ms timer) before releasing nord's gate, so under the revert dark-plus has settled and nord's late load lands last. Awaiting the dark-plus paint alone would deadlock under the correct code, since the queue holds it behind nord; the timer ends that wait. Red under `queue = paintNow(read, code)`: `AssertionError: expected undefined to be 'd4d4d4' // Object.is equality` at `paint.test.ts:292:59`.
4. `HELP.md:145` (`settings` row) now says the appearance values (theme, code theme, text size, CRT, wallpaper, icons) are each kept per browser, and the rail list is edited and saved to `config/layout.yml`. `tests/views/system/help.test.ts` passes (in `npm test`).
5. `DESIGN.md:85` now reads "which the Settings view's Code theme menu overrides per browser, just as its CRT toggle overrides `crt.default`".
6. User-visible change added: once a code theme is picked in the Settings view, the browser keeps that pick, and "From the theme" saves `tokens` as a pick. Before the pick a browser follows `code_theme:` in `config/appearance.yml` live; after it, an edit of `code_theme:` no longer reaches that browser (it reaches browsers that have not picked). Red-run assertion lines of the round's tests are quoted in items 1 and 3; the tests changed in the main round have their failing test names in the revert table above, and the lines of the ones this round touches are the two quoted here.

Checks after the round (`npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`):

```
$ npm test
 Test Files  339 passed | 19 skipped (358)
      Tests  5149 passed | 557 skipped (5706)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790727742415 COMPLETED 2346 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 3.72s
built in 9.30s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

An earlier run of the list this round was red in `tests/checks/tree/duplication.test.ts` (the two repaint effects held the same 14 lines after formatting); collapsing the two callbacks into `done` fixed it and the list above is the rerun.
