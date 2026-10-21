# O39 part A, builder report

Everything in part A is done.

The layers overview is drawn by the rule of `utils/diagrams/drawing/apart.mjs`, laid out left to right, under ruling Overview drawing: `npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0` gives "Test Files 2 passed (2)", "Tests 48 passed (48)".

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md`, "Open items":

```
- none
```

## The cases' first run

Run from `tools/oculus` on the unchanged tree before any change (the file cases), and on a scratch copy of the base `$TMPDIR/o39-first/oculus` (the base's `src`, `config`, `tests` and `utils` with the worktree's build files beside them; `diff -rq` of the base's `src` and the copy's `src`: no output) for the tests.

- The new plan configuration: `python3 ~/.local/share/ordo-stable/skills/ordo-init/templates/check_config.py .` printed `error: no .agents/plan.yaml in /Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O39/tools/oculus`, exit 1. `test -e` on the three pages: `exists .scratch/ROADMAP.md`, `exists .scratch/migration/orchestrator-state.md`, `exists .scratch/migration/agents/spec.md`. `yaml.safe_load`: `FileNotFoundError: [Errno 2] No such file or directory: '.agents/plan.yaml'`.
- The `.gitignore` lines: the orchestrator's case, since the builder runs no git.
- The manifest: `FileNotFoundError: [Errno 2] No such file or directory: '.oculus/project.yml'`.
- The layer rule: `npx vitest run tests/checks/tree/boundaries.test.ts`: "Test Files 1 passed (1)", "Tests 11 passed (11)".
- Prettier: `npx prettier --check .agents/plan.yaml .oculus/project.yml`: `[error] No files matching the pattern were found: ".agents/plan.yaml".` and the same for `.oculus/project.yml`.
- The rules file: `readlink AGENTS.md` exit 1; `ls: CLAUDE.md: No such file or directory`.
- A grouped row and a loose row in the Settings choice, `tests/state/system/settings/theme-groups.test.ts`, 'draws a row with a group under its heading and a row with none before the groups': `AssertionError: expected [] to deeply equal [ [ 'a', 'VS Code, dark' ] ]`.
- A `group` that is a number or empty, `tests/checks/config/config.test.ts`, 'names a theme row whose group is a number or empty, and draws it before the groups': `AssertionError: expected [] to deeply equal [ <ellipsis>(2) ]`.
- The Rice Pack app theme in both lists: theme-groups.test.ts, "draws an app's theme under the app's title, in the list and in the choice": `AssertionError: expected [ [ 'light', undefined ], <ellipsis>(1) ] to deeply equal [ [ 'light', '' ], <ellipsis>(1) ]`; `tests/shell/keys/theme-rows.test.ts`, "draws an app's theme under the app's title": `AssertionError: expected { <ellipsis>(2) } to deeply equal { loose: [], groups: [ { <ellipsis>(2) } ] }`.
- A workspace file that removes `vscode-dark-modern`: theme-groups.test.ts, 'keeps a VS Code code theme whose UI row a workspace file took out': `AssertionError: expected 'vscode-dark-modern' to be 'Dark Modern' // Object.is equality`.
- The convert script's check: `node utils/migrations/convert-vscode-themes.ts --check`: `19 themes up to date`, exit 0.
- The code theme groups with oculus's own config: theme-groups.test.ts, "draws each VS Code theme in its row's group, with its row's words": `AssertionError: expected [ [ 'VS Code, dark', 12 ], <ellipsis>(1) ] to deeply equal [ [ 'VS Code, dark', 11 ], <ellipsis>(2) ]`; "draws oculus's own rows under their groups, in the order the rows give them": `AssertionError: expected [] to deeply equal [ [ 'Oculus', 2 ], <ellipsis>(5) ]`.
- Cmd-K's `:theme`: theme-rows.test.ts, 'draws a heading per group in the Settings order with nothing typed, and starts on the theme in force': `AssertionError: expected [ 'light', 'dark', <ellipsis>(47) ] to deeply equal []`; 'draws only the VS Code, dark heading and its two rows for monokai': `AssertionError: expected { <ellipsis>(2) } to deeply equal { loose: [], groups: [ { <ellipsis>(2) } ] }`; 'draws a row with no group before the groups, and starts on the row the text names whole': `AssertionError: expected { <ellipsis>(2) } to deeply equal { loose: [ 'plain' ], <ellipsis>(1) }`.
- The theme words: `python3` with `yaml.safe_load` over `config/defaults/appearance.yml`: `49 rows; 49 labels start with vscode or a lower-case letter; first: ['light', 'dark', 'vscode dark modern']`. theme-groups.test.ts, 'draws the high contrast themes of both kinds under their own headings': `AssertionError: expected [ 'VS Code, dark', <ellipsis>(3) ] to deeply equal [ 'VS Code, dark', <ellipsis>(5) ]`.
- The duplicates: `tests/data/helpers/code-theme-pairs.test.ts`, 'keeps a Shiki theme only when it colours some scope differently from its VS Code theme': `TypeError: Cannot read properties of undefined (reading 'hidden')`; theme-groups.test.ts, 'leaves out a Shiki theme code_themes.hidden names, which is then no code theme': `AssertionError: expected [ 'vscode-light-2026', <ellipsis>(83) ] to not include 'dark-plus'`.
- The start theme and the window: `tests/server/desktop/window-guard.test.ts` failed whole: `Error: Cannot find module '../../../src/desktop/windows/start-colours.ts' imported from .../o39-first/oculus/tests/server/desktop/window-guard.test.ts`.
- The data rule: `grep -n "vscode-dark-modern\|#181818\|#cccccc\|-high-contrast\|includes('light')" src/lib/data/helpers/editor/code-themes.ts src/lib/state/shared/words/appearance.ts src/desktop/decide/window-options.ts`:

```
src/lib/state/shared/words/appearance.ts:109:const APP_THEME = 'vscode-dark-modern';
src/lib/data/helpers/editor/code-themes.ts:37:    'vscode-dark-modern',
src/lib/data/helpers/editor/code-themes.ts:46:    'vscode-dark-high-contrast',
src/lib/data/helpers/editor/code-themes.ts:47:    'vscode-light-high-contrast'
src/lib/data/helpers/editor/code-themes.ts:61:            dark: !id.includes('light'),
src/desktop/decide/window-options.ts:44: * background of the app's dark theme (vscode.css, `vscode-dark-modern`), so no white shows while a
src/desktop/decide/window-options.ts:47:export const WINDOW_BACKGROUND = '#181818';
src/desktop/decide/window-options.ts:71:const SYMBOLS = '#cccccc';
```

- The false help: `grep -n "theme picker\|toggle of the" config/options/appearance.yml DESIGN.md` printed `config/options/appearance.yml:18`, `:34`, `:48`, `:53`, `:58` and `DESIGN.md:254`.
- The two existing config cases the change rewords, 'names a code theme that is no listed id, one finding per value, case included' and 'names a bad code theme in a config that has no themes list', and 'names an id of a code_themes list that Shiki does not bundle': the first two `AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]` (the finding's words), the third `AssertionError: expected [] to deeply equal [ <ellipsis>(2) ]`.

The whole first test run, the five test files on the scratch copy of the base, saved in `$TMPDIR/o39-first-tests-2.txt`: "Test Files 5 failed (5)", "Tests 16 failed | 37 passed (53)". Per file: `theme-groups.test.ts` 7 tests, 7 failed; `theme-rows.test.ts` 4 tests, 4 failed; `code-theme-pairs.test.ts` 1 test, 1 failed; `config.test.ts` 41 tests, 4 failed (the 37 that pass are its other cases); `window-guard.test.ts` 0 tests, failed at its import.

No case got the brief's rules wrong.

## DONE / NOT DONE

| Check | Command | Result |
| --- | --- | --- |
| Format | `npm run format` | exit 0; it rewrote 9 files, then every later edit was checked by `npx prettier --check .`: "All matched files use Prettier code style!" |
| Quick tier | `npm run diagrams && npm run test:quick`, run three times | first: `FAILED eslint (14.0 s)` (6 errors in `ArgumentRows.svelte`, `code-theme-pairs.test.ts`, `theme-groups.test.ts`, all files of this step) and `test:quick: 54.9 s (limit 45.0 s); failed: eslint`; second, after the eslint fixes: `test:quick: 38.4 s (limit 45.0 s); every command passed`; third, after the last edit (the overview drawing), over 50 changed files: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check (7.3 s): ... 0 ERRORS 0 WARNINGS`, `ok eslint (7.4 s)`, `ok vitest (39.5 s)`, `test:quick: 41.8 s (limit 45.0 s); every command passed` |
| Type check | `npm run check` | `COMPLETED 4248 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Changed tests | `npx vitest run tests/state/system/settings/theme-groups.test.ts tests/shell/keys/theme-rows.test.ts tests/data/helpers/code-theme-pairs.test.ts tests/checks/config/config.test.ts tests/server/desktop/window-guard.test.ts` | "Test Files 5 passed (5)", "Tests 68 passed (68)" |
| YAML | `python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ('.agents/plan.yaml', '.oculus/project.yml', 'config/defaults/appearance.yml', 'config/options/appearance.yml')]"` | exit 0 |
| Character gate | the perl gate of `spec.md:101` over the 40 changed text files, and over the three regenerated `.svg` | no output, exit 0 |
| Config, contrast checks | `npx vitest run tests/checks/config tests/checks/look --testTimeout 0 --hookTimeout 0` | "Test Files 6 passed (6)", "Tests 173 passed / 9 skipped (182)" |
| Diagram checks (G25) | `npm run diagrams`, then `npx vitest run tests/checks/diagrams --testTimeout 0 --hookTimeout 0`, run before and again after the third quick run | "Test Files 2 passed (2)", "Tests 48 passed (48)" both times; `docs/diagrams/layers.dot` begins `graph [bgcolor="transparent", rankdir=LR, newrank=true, ... layout=nop2 ...` |
| Gates over the overview change | the perl character gate over `utils/diagrams/graphs.mjs`, `utils/diagrams/diagrams.mjs`, `utils/diagrams/drawing/apart.mjs`, `utils/diagrams/drawing/labels.mjs`, `DESIGN.md`, `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg`; `npx prettier --check .`; `npx eslint` over the four `utils/diagrams` files | gate no output, exit 0; "All matched files use Prettier code style!"; eslint exit 0, no output |
| Quick tier's selection, run directly after the second quick run | `npx vitest run --tagsFilter '!slow'` over the 103 files the second quick run selected | "Test Files 97 passed / 6 skipped (103)", "Tests 1132 passed / 51 skipped (1183)" |
| Lint of the theme work | `npx eslint` over the 27 changed `src`, `tests` and `utils` files | exit 0 (one warning: `utils/migrations/convert-vscode-themes.ts` is outside the eslint configuration, as on the base) |
| Unused exports | `sh utils/unused-exports.sh`, compared with `.agents/worktrees/O39-base/unused-exports.txt` | `diff` no output, exit 0 |
| Folder sizes | `sh utils/folder-check.sh` | exit 0 |

The quick tier ran three times: the second after red lines in files this step changed, the third the rerun the dispatch allowed after the overview ruling, over the tree as it stands. Every whole-suite command run: `npm run format` once; `npm run diagrams && npm run test:quick` three times; `npm run diagrams` four times more; `npm run check` twice; the quick selection once; `tests/checks/config tests/checks/diagrams tests/checks/look` once, `tests/checks/config tests/checks/look` once; `tests/checks/diagrams` or its `diagrams.test.ts` while the overview options were run, and twice over the tree as it stands (the G25 row).

The part A cases after the change, from `tools/oculus`:

- The new plan configuration: `check_config.py .`: `ok: .agents/plan.yaml carries every required key, no unknown key, and every page it names exists`, exit 0, with notes that `worktree_paths`, `adr`, `design_bar`, `design_references`, `worker_effort`, `reviewer_effort`, `self_rule`, `next_entry` and `repair_reviewer` take their defaults; of these the hub's `oculus` block sets only `worktree_paths`, which item 1 leaves out. `test -e`: 0 for `.scratch/ROADMAP.md`, `.scratch/migration/orchestrator-state.md`, `.scratch/migration/agents/spec.md`. `yaml.safe_load`: exit 0.
- The manifest: `['title', 'type', 'tier', 'status', 'eli5', 'next', 'links']`; `eli5` 202 characters, `next` 193.
- The layer rule: `npx vitest run tests/checks/tree/boundaries.test.ts`: "Test Files 1 passed (1)", "Tests 11 passed (11)".
- Prettier: `npx prettier --check .agents/plan.yaml .oculus/project.yml`: "All matched files use Prettier code style!", exit 0.
- The rules file: `readlink AGENTS.md`: `CLAUDE.md`; `ls -l AGENTS.md`: `AGENTS.md -> CLAUDE.md`; the character gate over `CLAUDE.md`: no output. Read against item 4: it holds the git rules, the rules of reports and claims, the working rules for code, the plan rules, the writing rules and the pointer to `README.md`, `DESIGN.md` and `HELP.md`, and no research rule, hub path, date or incident.
- The test cases: the five test files pass (row "Changed tests"); the comparison of the pairs, from `npx vitest run tests/data/helpers/code-theme-pairs.test.ts --reporter=verbose`:

```
vscode-dark-plus and dark-plus over 16434 scopes: 5345 differ, first comment #84b070 / #6a9955; comment.ballerina #84b070 / #6a9955; comment.berry #84b070 / #6a9955; comment.blade #84b070 / #6a9955; comment.block #84b070 / #6a9955
vscode-light-plus and light-plus over 16434 scopes: 4234 differ, first comment #006a00 / #008000; comment.ballerina #006a00 / #008000; comment.berry #006a00 / #008000; comment.blade #006a00 / #008000; comment.block #006a00 / #008000
vscode-monokai and monokai over 16434 scopes: 6157 differ, first comment #b1aea0 / #88846f; comment.ballerina #b1aea0 / #88846f; comment.berry #b1aea0 / #88846f; comment.blade #b1aea0 / #88846f; comment.block #b1aea0 / #88846f
vscode-red and red over 16434 scopes: 4780 differ, first constant #c78686 / #994646; constant.asciidoc #c78686 / #994646; constant.binary.nushell #c78686 / #994646; constant.block.nextflow #c78686 / #994646; constant.boolean.true.emacs.lisp #c78686 / #994646
vscode-solarized-dark and solarized-dark over 16434 scopes: 9708 differ, first comment #a1b3b8 / #586e75; comment.ballerina #a1b3b8 / #586e75; comment.berry #a1b3b8 / #586e75; comment.blade #a1b3b8 / #586e75; comment.block #a1b3b8 / #586e75
vscode-solarized-light and solarized-light over 16434 scopes: 9708 differ, first comment #505d5d / #93a1a1; comment.ballerina #505d5d / #93a1a1; comment.berry #505d5d / #93a1a1; comment.blade #505d5d / #93a1a1; comment.block #505d5d / #93a1a1
```

  Every pair differs, so `code_themes.hidden` is `[]` and every Shiki id stays a code theme; the test asserts `hidden` equals the list of identical pairs.
- The convert script's check: `node utils/migrations/convert-vscode-themes.ts --check`: `19 themes up to date`, exit 0. Read: `rowProblems` takes the `code: vscode` rows through `codeThemeInfo(loadConfig(ROOT).config)` and compares each row's `group` with `UI_GROUPS[ui]` of the theme's `uiTheme`, naming a row without a rules entry, a rules entry without a row and a group that differs.
- The data rule: the grep prints nothing, exit 1.
- The false help: the grep prints nothing, exit 1.
- The theme words: `49 rows; 0 without a label; 0 labels start with vscode or a lower-case letter`.

## Files

From `diff -rq .agents/worktrees/O39-base/tools/oculus <worktree>/tools/oculus -x node_modules -x .svelte-kit -x local.yml`; the base copy holds only `config`, `DESIGN.md`, `HELP.md`, `src`, `tests` and `utils`, so the `docs/diagrams` files are compared with the main checkout's `tools/oculus/docs` (`diff -rq`), and the build files the base lacks (`package.json`, `.prettierrc` and the others) are unchanged. Lines before and after (`wc -l`):

| File | Before | After |
| --- | --- | --- |
| `.agents/plan.yaml` (new) | 0 | 19 |
| `.gitignore` | 11 | 13 |
| `.oculus/project.yml` (new) | 0 | 8 |
| `AGENTS.md` (new, symlink to `CLAUDE.md`) | - | - |
| `CLAUDE.md` (new) | 0 | 51 |
| `DESIGN.md` | 768 | 768 |
| `HELP.md` | 542 | 543 |
| `config/defaults/appearance.yml` | 119 | 127 |
| `config/options/appearance.yml` | 179 | 201 |
| `config/text/findings.yml` | 375 | 377 |
| `config/text/views/system/workbench.yml` | 257 | 256 |
| `docs/diagrams/layers.dot` | 92 | 95 |
| `docs/diagrams/layers.svg` | 505 | 522 |
| `docs/diagrams/layer-data.dot` | 94 | 94 |
| `docs/diagrams/layer-data.svg` | 465 | 465 |
| `docs/diagrams/layer-shell.dot` | 164 | 164 |
| `docs/diagrams/layer-shell.svg` | 755 | 755 |
| `src/desktop/app.ts` | 380 | 383 |
| `src/desktop/decide/window-options.ts` | 128 | 126 |
| `src/desktop/windows/find-bar.ts` | 120 | 123 |
| `src/desktop/windows/print.ts` | 75 | 79 |
| `src/desktop/windows/show.ts` | 142 | 145 |
| `src/desktop/windows/start-colours.ts` (new) | 0 | 48 |
| `src/desktop/windows/windows.ts` | 531 | 541 |
| `src/lib/data/helpers/editor/code-themes.ts` | 76 | 179 |
| `src/lib/data/sources/config/catalog/schemas/engine.ts` | 232 | 232 |
| `src/lib/data/sources/config/catalogs.ts` | 370 | 375 |
| `src/lib/data/sources/config/sections/themes.ts` | 74 | 84 |
| `src/lib/server/edit/writes/config/config-sources.ts` | 69 | 69 |
| `src/lib/shell/keys/lists/argument-list.svelte.ts` | 112 | 114 |
| `src/lib/shell/keys/palette-modes.ts` | 461 | 490 |
| `src/lib/shell/keys/rows/ArgumentRows.svelte` | 93 | 136 |
| `src/lib/shell/window/strip-colours.ts` | 44 | 49 |
| `src/lib/state/shared/words/appearance.ts` | 609 | 640 |
| `src/lib/state/system/config/editors/sources.ts` | 161 | 184 |
| `src/lib/themes/parse.ts` | 88 | 117 |
| `src/lib/ui/forms/choice/choices.ts` | 72 | 76 |
| `src/lib/ui/theme/theme.ts` | 156 | 169 |
| `tests/checks/config/config-folder.test.ts` | 808 | 810 |
| `tests/checks/config/config.test.ts` | 735 | 786 |
| `tests/data/helpers/code-theme-pairs.test.ts` (new) | 0 | 115 |
| `tests/server/desktop/window-guard.test.ts` | 236 | 291 |
| `tests/shell/keys/theme-rows.test.ts` (new) | 0 | 124 |
| `tests/state/system/settings/theme-groups.test.ts` (new) | 0 | 189 |
| `utils/diagrams/diagrams.mjs` | 210 | 212 |
| `utils/diagrams/drawing/apart.mjs` | 747 | 747 |
| `utils/diagrams/drawing/labels.mjs` | 450 | 450 |
| `utils/diagrams/graphs.mjs` | 578 | 583 |
| `utils/migrations/convert-vscode-themes.ts` | 393 | 396 |

Paths beyond the brief's first list, each accepted into it by the orchestrator with ruling Overview drawing: `utils/diagrams/graphs.mjs` (`rankdir=LR` and the `layersDot` comment), `utils/diagrams/diagrams.mjs` (`generate()` draws `layers` through `drawnApart()`, and its comments), `utils/diagrams/drawing/apart.mjs` (its head comment), `utils/diagrams/drawing/labels.mjs` (its head comment names the overview among the diagrams apart.mjs draws, so it stays true), and the following, each needed by an item of the brief: `src/lib/data/sources/config/catalogs.ts` (the first page load carries the shipped theme rows, `app_theme` and `code_themes`, so the page reads the VS Code code themes from oculus's rows), `config/text/findings.yml` (the two new findings and the reworded `code_theme` finding), `src/lib/themes/parse.ts` (`windowColours`, `isHexColour`), `src/lib/ui/theme/theme.ts` (`windowColoursOf`, the page's read of the same rule), `src/lib/ui/forms/choice/choices.ts` (`choiceGroups` made generic for the palette rows), `src/lib/shell/keys/rows/ArgumentRows.svelte` (the `:theme` headings; the brief names `Palette.svelte` and `PaletteRow.svelte` "as needed", and the rows are drawn in this partial of `Palette.svelte`), `src/desktop/windows/start-colours.ts` and `src/desktop/app.ts` (the host's read of the start colours), `config/defaults/appearance.yml` past lines 1-58 (`app_theme`, `code_themes`), `tests/checks/config/config-folder.test.ts` (its list of the top-level keys of `defaults/appearance.yml` gains `app_theme` and `code_themes`), and `docs/diagrams/` (written by `npm run diagrams`).

Tests that need a `guarded.md` entry, for the orchestrator to write (a new entry needs Axel's yes):

- `tests/state/system/settings/theme-groups.test.ts`, describes 'the groups of the UI theme choice' and 'the groups of the code theme choice', every case: no entry covers the Settings view's theme groups. Proposed: "The UI theme and code theme choices draw each theme under its group: a row's `group`, an app's title, a VS Code code theme's row group read from oculus's shipped rows, the Shiki themes under their three headings, and no id `code_themes.hidden` names."
- `tests/shell/keys/theme-rows.test.ts`, describe 'the rows of :theme', every case: the same proposed entry, its `:theme` half, or one of its own: "Cmd-K's `:theme` gives its rows in the Settings order of the groups, the loose rows first, and starts on the theme in force or the row the typed text names whole."
- `tests/data/helpers/code-theme-pairs.test.ts`, 'keeps a Shiki theme only when it colours some scope differently from its VS Code theme': proposed under the first entry above, or under G12 (the shipped config reads right).
- `tests/server/desktop/window-guard.test.ts`, 'leaves the colours to the system and Electron when the start theme gives none' and describe 'the colours of the theme a window starts on', its three cases: G47 covers the window's safety, not its colours. Proposed: "A desktop window is filled, before its page paints, with the background and symbol colour of the theme it starts on, read from that theme's stylesheet block, and with nothing when the block gives no hex colour."
- `tests/checks/config/config.test.ts`, the two new cases, and `config-folder.test.ts`: held whole under G12 and G13 (`guarded.md:350`).

## Judgment calls the brief left open

- The three terminal labels that carried "(light)" (`latte`, `rosepinedawn`, `kanagawalotus`) became "Latte", "Rose Pine Dawn" and "Kanagawa Lotus", since their group heading "Terminal, light" says it.
- The converter tells a row's group from VS Code's `uiTheme` by a table, `UI_GROUPS` in `convert-vscode-themes.ts` (`vs` "VS Code, light", `vs-dark` "VS Code, dark", `hc-black` and `hc-light` "VS Code, high contrast"); it is the check of the data, not a source of it.
- The finding `code_themes_unbundled` covers an id of either list, `high_contrast` or `hidden`, that Shiki does not bundle.
- The window buttons' symbol colour is the start theme's `--titlebar-txt`, else its `--ink`; the fill is its `--bg`; a value that is not a hex colour gives none, and the host then leaves the colour to the system and Electron.
- The page's strip fill (`strip-colours.ts`) is computed from the config in force by the same start rule (`windowThemeClass()` of `appearance.ts` with `windowColoursOf` of `ui/theme/theme.ts`), while the host fills a window once, when it makes it.
- The pair comparison matches each scope alone, as a one-level scope stack, and compares the foreground colour only; a rule that names parent scopes takes no part.
- A `:theme` heading is a bits-ui `Command.GroupHeading` styled as a line of the group's words at the hint's size and muted colour over a rule, right-aligned, as VS Code's Color Theme list draws its separators.
- Inside the loose rows and inside each group, a row the typed text names whole comes first, and the selection starts on it (`startRow` in `palette-modes.ts`), so Enter after a whole name keeps working with the rows grouped.
- `app_theme` lives on `Look` (`appearance.ts`, `lookShape`), since the `FROZEN` list of `tests/checks/tree/boundaries.test.ts:458` allows no new module-level `let` in that file.
- The manifest's `next` names closing the migration plan and the next open item of `.scratch/ROADMAP.md`, since O39 is the plan's last open step, and the step of taking the ledger out of the history before the repository is made public.
- `CLAUDE.md` follows the shape of cathedra's `CLAUDE.md` (one bolded rule per bullet, grouped by section); it writes "the user" where the hub file writes "Axel", for a repository that may be made public.

## Host- and user-visible changes

- Settings, the choice of `theme`: before, one flat list; after, the rows with no group first, then a heading per group in the order of its first row: Oculus 2, VS Code, dark 11, VS Code, light 6, VS Code, high contrast 2, Terminal, dark 21, Terminal, light 7, and an app's themes under its title.
- Cmd-K `:theme`: before, one flat list; after, the same groups under headings, which the arrow keys pass over; a group the typed words filter out whole has no heading.
- Theme words: before, lower case with "vscode " before every VS Code theme ("vscode dark modern"); after, capitalised without it ("Dark Modern"), in both lists and in the code theme choice. All 49 label changes are listed by the `yaml.safe_load` comparison with the base.
- Settings, the choice of `code_theme`: before, the VS Code themes under "VS Code, dark" and "VS Code, light" by a name rule; after, each under its row's group (11, 6 and 2 under high contrast), and `github-dark-high-contrast` and `github-light-high-contrast` under a new heading "Shiki, high contrast" instead of Shiki, dark and Shiki, light. A workspace file that takes `vscode-dark-modern` out of `themes` keeps it as a code theme.
- New config keys in `config/defaults/appearance.yml`, each described in `config/options/appearance.yml`: `group` and `code` on a theme row, `app_theme: vscode-dark-modern`, `code_themes.high_contrast` and `code_themes.hidden: []`.
- Findings: new `appearance.group` ("the theme {0} names a group that is not words; it is drawn before the groups") and `appearance.code_themes_unbundled` ("{0} names {1}, which is no theme Shiki bundles; it changes nothing"); the `code_theme` finding now ends its list with "the id of a Shiki theme the choice offers".
- Text keys: `settings.code_themes_vscode_dark` and `settings.code_themes_vscode_light` removed; `settings.code_themes_shiki_high_contrast: Shiki, high contrast` added.
- The desktop window before its page paints (main, float, find bar, print, audience): before, always `#181818` with window button symbols `#cccccc`; after, the background and symbol colour of the theme it starts on (the `theme` option, else `app_theme`, else the first theme listed; an app's theme takes the start theme's), from that theme's block: `#181818` / `#cccccc` with the shipped config, `#181825` / `#cdd6f4` for `mocha`, `#f1f5f9` / `#0f172a` for `light`. The find bar's `setBackgroundColor` is called only when a colour is found.
- The page's strip fill: before, the constant `#181818`; after, the start theme's `--bg`, and no fill layer when it gives none.
- Help text: `config/options/appearance.yml` lines 18, 34, 48, 53 and 58 and `DESIGN.md:254` no longer name a theme picker or toggles that do not exist; they name the Settings view's choice, `:theme` and an app's theme command, and the Settings view for the three `rice` keys.
- `DESIGN.md` and `HELP.md` say where the groups come from and how both lists draw them; `HELP.md:94` says how `:theme` draws its headings.
- The layers overview gains an arrow from `desktop` to `themes` (2 imports) and new counts (`desktop` to `data` 8 to 10, `desktop` to `server` 11 to 14, `shell` to `state` 184 to 185, `shell` to `ui` 108 to 111); the shell and data layer diagrams change their counts.
- The layers overview `docs/diagrams/layers.svg`, shown in `DESIGN.md`: before, Graphviz's top-to-bottom layout with curved arrows; after, laid out left to right by `drawnApart()`, each arrow leaving and reaching its layers at ports of its own on level runs and upright tracks, as `channels.svg` is drawn (1850 by 325 points). `DESIGN.md:204` says so and points at the `layersDot` comment and the head comment of `apart.mjs`.
- New repository files: `.agents/plan.yaml` (single-project form), `.oculus/project.yml`, `CLAUDE.md` with `AGENTS.md -> CLAUDE.md`, and `.gitignore` gains `.agents/*` and `!.agents/plan.yaml`.

## What in the brief was wrong or impossible

- (Corrected in the main checkout's brief, line 17: "Ordo has neither (`ls`, corrected after the builder's report)".) The worktree's `briefs/O39.md:17` says Ordo, cathedra, officium and scotoma each have a `CLAUDE.md` with an `AGENTS.md` symlink, and item 3 of "Read first" (`:193`) names `~/workspace/ordo/CLAUDE.md`. `ls ~/workspace/ordo/CLAUDE.md ~/workspace/ordo/AGENTS.md`: "No such file or directory" for both; `ls ~/workspace/scotoma/AGENTS.md`: "No such file or directory". Cathedra's `CLAUDE.md` and `AGENTS.md -> CLAUDE.md` exist (`ls -la`), and its shape was used.
- The brief's verify item 1 runs `npm run test:quick -- <every file the step changes>`; the run used `npm run diagrams && npm run test:quick` as the dispatch said, and the tier took the 44 changed files from the tree itself ("test:quick: 44 changed file(s), from git since HEAD").
- The brief named no change to the diagrams, while the import ruling (4) requires made Graphviz draw two of the overview's arrows along each other (`layers: desktop to data along server to data for 52`); ruling Overview drawing settled it, and the overview is now drawn by the rule of `apart.mjs`.

# Repair round 1

Everything in round 1 is done. Two things are verified by reading the code only, not by a run: the three red paths of `convert-vscode-themes.ts --check` (item 5), and the page side of item 1 (`strip-colours.ts` paints on a canvas in a browser, and the launch forbids starting the app).

## Open items

Open items 185 (the six VS Code and Shiki pairs) and 186 (`app_theme` offering the apps' themes) are with Axel. No ruling reached this round, and nothing was done on either. The `app_theme` finding passes a saved app theme's name without a finding (`themes.ts:72`, `appThemeFinding`), and what a window starts on for such a value is left to 186.

## Item 1: the window fill and the strip follow the drawn theme

- The page sends the drawn theme's background with the strip's colours: `StripColours` is `{ color, symbolColor, background }` (`src/lib/shell/window/strip-colours.ts:28`). The background is the body's `--bg`, painted on the 1x1 canvas when `CSS.supports('color', ...)` accepts it, and empty otherwise (`strip-colours.ts:53`). The strip's fill layer is that same background, so the strip and the fill come from one theme. `windowColoursOf` is removed from `src/lib/ui/theme/theme.ts`, which now equals the base (`cmp` with `O39-base`: no output).
- The bridge carries it: `titleColours(color, symbolColor, background)` (`src/lib/state/shared/stores/desktop.ts:99`, `src/desktop/preload.cjs:35`, `src/lib/shell/window/appearance.svelte.ts:112`).
- The host fills the window: the `TITLE_COLOURS` handler calls `setBackgroundColor(fill)` when `drawnFill(background)` is a hex colour, on every system, and then the overlay colours off macOS (`src/desktop/windows/bridge.ts:259-260`). `drawnFill` accepts only a hex colour and returns null for anything else, which sets nothing (`src/desktop/decide/window-options.ts:61`).
- The find bar's own view keeps the fill it was made with. Only the window takes the drawn fill.
- Case: `tests/server/desktop/window-guard.test.ts:195`, "fills the window with the background of the theme its page drew, a hex colour on every system". It checks `#1e1e2e` and `#F1F5F9`, and null for `'red'`, `'rgb(30, 30, 46)'`, `'#12345'`, `'#1e1e2g'`, `' #1e1e2e'`, `'#1e1e2e; color: red'`, `''`, `30`, `null`, `undefined` and `['#1e1e2e']`.
- The page and the host now agree for an app's theme too. `themeClass(name, offers, inApp)` draws the start theme for an app's theme that is pending or missing: `app_theme` in the desktop window, and the first theme in a browser (`src/lib/state/shared/words/appearance.ts:431-436`). `startClass(inApp)` is the class of that start theme (`appearance.ts:444`).
- The workbench draws `startClass(inApp)` when an offered app theme's file does not load (`appearance.svelte.ts:95`). Before, that case drew the class `app-theme` with no sheet.
- `inApp` is passed through `terminalTheme`, `wallpaperOnTheme`, `drawConfiguredTheme` (`src/lib/ui/theme/app-theme.ts:177`) and `src/lib/state/workbench/ui.svelte.ts:308`.
- Cases:
  - `window-guard.test.ts:337-366`, an `it.each` over 7 configs: `themeClass(configuredTheme(true), NO_OFFERS, true)` equals `windowThemeClass(merged)`, the app's theme row included.
  - `window-guard.test.ts:367`, "draws an app's theme no acting app offers, or not yet, in the start theme of its page".

## Item 2: the start-theme rule in its own module

- `startTheme` and `windowThemeClass` are in `src/lib/data/helpers/editor/start-theme.ts:17` and `:34`, each written once, with a head comment.
- `code-themes.ts` holds only the code themes, and its head comment says so: `grep -n "export function" code-themes.ts` lists `unreadLists`, `codeThemeInfo`, `codeThemeIds`, `isCodeTheme`, `unbundledIds` and `shippedThemeOptions`.
- The module sits in `data/helpers/editor/` because `src/lib/data/helpers` already holds ten items (`ls src/lib/data/helpers | wc -l`: 10), the folder limit. `editor/` holds 3 (`ls`).
- Who reads the one rule:
  - The page's `chosenTheme` (`appearance.ts:127`) and `startClass` (`appearance.ts:447`) call `startTheme`.
  - The host reads `windowThemeClass` (`src/desktop/windows/start-colours.ts:17`, `:49`).
  - The page's own `windowThemeClass()` is removed, since item 1 left it with no reader (`grep -rn windowThemeClass src`: only `start-colours.ts` and `start-theme.ts`).
- `boundaries.test.ts:313` adds the row `'data/helpers/editor/start-theme'`. Its head comment names the module at lines 36 and 78-81.

## Item 3: head comments and pages, and "the picker"

- `tests/checks/tree/boundaries.test.ts:75-81`: the code-themes sentence says the module holds "the code themes read from the config's theme rows and Shiki's bundled themes, each with its group". The start-theme sentence follows it.
- `docs/apps.md:283`: "`themes` name a VS Code colour theme file; it is drawn under a heading of the app's title in the Settings view's choice of theme and in Cmd-K's `:theme`, its row reading `<label> (<app title>)`."
- Every theme hit of `grep -rn --exclude=local.yml "picker" src config docs DESIGN.md HELP.md README.md` was renamed:
  - `appearance.ts` (the docs of `setAppearance`, `themes`, `appThemeWords`, `themeLabel`, `appThemeLabels`, `themeNamed`, and the icon theme's words, now "the icon theme list");
  - `src/lib/state/shared/words/tones.ts:196`;
  - `src/lib/state/system/apps/shell/shell.svelte.ts:405`;
  - `src/lib/state/client/socket.svelte.ts:365`;
  - the head of each of the 9 sheets in `src/lib/themes/rice/` ("the theme list's rows are the `themes:` rows of config/defaults/appearance.yml");
  - `tests/checks/look/themes.ts:1-4, 77`;
  - `tests/state/workbench/options-pages.test.ts:2`, and its title "writes the theme chosen in the theme list, shown on the other page after the push".
- The grep now gives no theme-list hit. The hits that contain "theme" are the editor colour keys `pickerGroup.border` and `pickerGroup.foreground` (`colours.ts:210, 337`), the wallpaper picker (`config/defaults/appearance.yml:86`, `DESIGN.md:250`), Monaco's colour picker (`DESIGN.md:250`) and the repository picker (`DESIGN.md:739`).
- These hits name other pickers and are kept: the folder and file picker (`server/files/fs/picker.ts`, `pickerLine`, `createPicker`, the `files.picker_*` texts), the wallpaper picker (`WallpaperPicker.svelte`, `wallpapers.svelte.ts`), the repository and branch picker (`status.ts`, `RepoItems.svelte`, `status-items.ts`), the agents' composer pickers (`agents.ts`, `Composer.svelte`, `AgentPickers.svelte`, `catalog-words.ts`), the attach, session and workspace pickers, the glyph, hue and colour pickers of Settings (`Control.svelte`, `FieldControl.svelte`), the LSP interpreter and database pickers (`lsp.svelte.ts`), and Monaco's colour picker.

## Item 4: CLAUDE.md

- `CLAUDE.md:30`: "**Credentials are the user's.** Credentials and tokens, the ones oculus reads for an account included, are never printed, quoted in a report or a commit, or copied into a project folder."
- `CLAUDE.md:49`, the ASCII bullet, ends: "The check is the repository's ASCII gate, the perl command `ASCII_GATE` of `tests/tiers/run.mjs`, which `npm run test:quick` and `npm run test:landing` run over `src`, `tests` and `config`: it passes an accented letter in a name under `config/` and prints every other line that holds a byte outside printable ASCII."

## Item 5: UI_GROUPS removed from the convert script

- `UI_GROUPS` is gone (`grep -rnw UI_GROUPS src tests config docs utils HELP.md DESIGN.md README.md`: no output).
- `UI_KINDS` (`utils/migrations/convert-vscode-themes.ts:310`) names only the kinds: `vs`, `vs-dark`, and `hc-black` with `hc-light` as one kind. No group words appear in the script.
- `groupProblems` (`:327`) names a row by its id, its `uiTheme` and its group in each of these cases:
  - a row with no group: "appearance.yml row <id> (uiTheme <ui>) has no group";
  - a kind whose rows carry more than one group: "...has the group "<g>"; the rows of uiTheme <kind> carry "<g1>", "<g2>"";
  - a group that another kind carries too: "...has the group "<g>", which the rows of uiTheme <other> carry too".
- `rowProblems` appends these to the rules-entry checks (`:379`).
- `node utils/migrations/convert-vscode-themes.ts --check`: "19 themes up to date", exit 0. The three red paths are verified by reading the code above only. `groupProblems` is not exported, and an export read only by a test is not allowed.
- `DESIGN.md:248` says the check compares the groups with each other and never with words in the script.

## Item 6: the proof

**The slow pairs test.**
- `tests/data/helpers/code-theme-pairs.test.ts:95` is `describe(..., { tags: ['slow'] }, ...)`.
- `npm test` is `vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'` (`package.json:15`), and test:quick runs vitest with `--tagsFilter '!slow'` (`tests/tiers/quick.mjs:278-279`). Both leave it out: `npx vitest run tests/data/helpers/code-theme-pairs.test.ts --tagsFilter '!slow'` gives "Test Files 1 skipped (1)", "Tests 1 skipped (1)".
- `test:slow` is `vitest run --tagsFilter slow ...` (`package.json:20`), and `test:landing` runs `npm run test:slow` (`tests/tiers/landing.mjs:59`).
- The test run alone: `npx vitest run tests/data/helpers/code-theme-pairs.test.ts --tagsFilter slow --reporter=verbose` gives "Tests 1 passed (1)". It prints, for each pair:
  - "vscode-dark-plus and dark-plus over 16434 scopes: 5345 differ, first comment #84b070 / #6a9955"
  - "vscode-light-plus and light-plus ...: 4234 differ, first comment #006a00 / #008000"
  - "vscode-monokai and monokai ...: 6157 differ, first comment #b1aea0 / #88846f"
  - "vscode-red and red ...: 4780 differ, first constant #c78686 / #994646"
  - "vscode-solarized-dark and solarized-dark ...: 9708 differ, first comment #a1b3b8 / #586e75"
  - "vscode-solarized-light and solarized-light ...: 9708 differ, first comment #505d5d / #93a1a1"

**The changed `config-folder` case on the base copy.** The worktree's `tests/checks/config/config-folder.test.ts` was copied into `$TMPDIR/o39-first/oculus`, whose `src` and `config` equal the base (`diff -rq`: no output). `npx vitest run tests/checks/config/config-folder.test.ts` gave:
```
FAIL ... > holds exactly the expected top-level keys, and no more
AssertionError: expected [ 'agents', 'apps', 'apps_dir', ...(91) ] to deeply equal [ Array(96) ]
FAIL ... > reads each file on its own and finds its own keys there and nowhere else
AssertionError: expected [ 'code_theme', 'crt', ...(10) ] to deeply equal [ 'app_theme', 'code_theme', ...(12) ]
Tests  2 failed | 28 passed | 2 skipped (32)
```
The base's test file was put back afterwards (`cmp`: "RESTORED").

**History words.** The grep ran over the `+` comment lines and test titles of `diff -U0` from the base to the worktree, for every changed and new `.ts`, `.cjs`, `.mjs`, `.svelte` and `.css` file. It searched for the `spec.md:44` words: before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package, a step id `O[0-9]{2}` and a date.
- 27 hits. Each "before" is the order of drawing ("drawn before the groups", "the glyph drawn before its words") or a moment while the program runs ("before its page paints", "before it writes", "before the hub's settings file").
- "is still offered" (`themes.ts:5`) says that a row with a missing glyph is offered anyway.
- "still wanted" (`app-theme.ts`) is the draw a caller still wants.
- The `boundaries.test.ts` hits are sentences of the base that were rewrapped.
- No hit is history.

**Removed and renamed names.** Each was grepped with `grep -rn --exclude=local.yml -w <name> src tests config docs utils HELP.md DESIGN.md README.md`, leaving out the SVGs:
- `WINDOW_BACKGROUND`, `WINDOW_FILL`, `APP_THEME`, `VSCODE_THEMES`, `code_themes_vscode_dark`, `code_themes_vscode_light`, `UI_GROUPS` and `windowColoursOf`: no hit.
- `SYMBOLS`: one hit, `src/lib/ui/controls/editor/kit/rite/rite.ts:146`, the rite grammar's word for `+5`, `.5` and `inf`. It is another name and is kept.
- `picker`: see item 3.
- `startTheme` and `windowThemeClass`: their only importers are `start-theme.ts` itself, `appearance.ts:39`, `start-colours.ts:17` and `window-guard.test.ts:29`. Each prose mention (`appearance.ts:116, 440`, `start-colours.ts:12`) names `data/helpers/editor/start-theme.ts`.

**Paragraphs of the docs the step touches or names.** Read in full; each one is still true or was rewritten.
- `DESIGN.md:204` (the layers diagram): still true.
- `DESIGN.md:248` (themes): rewritten this round. It now covers the start-theme module, the drawn fill (`strip-colours.ts`), the page drawing the start theme for an app's theme (`themeClass`, `startClass`) and the consistency check.
- `DESIGN.md:254` (glyphs): rewritten this round, since "a setting of the Settings view's Themes section" was false. `rice.icons` is in the section `Terminal themes` (`config/options/appearance.yml:58`).
- `DESIGN.md:718` (`:theme` headings): still true.
- `DESIGN.md:755` (the strip and the window): rewritten this round for `drawnFill`, `setBackgroundColor` and one theme for the fill and the strip.
- `HELP.md:94` (`:theme`): still true.
- `HELP.md:498` (the `appearance.yml` bullet): still true.
- `HELP.md:509` (the theme list): rewritten this round. It now says the window follows the drawn theme, and that the page draws the start theme for an app's theme until the offers are known, when none offers it, or when its file does not load.
- `docs/apps.md:283`: rewritten.
- `README.md`: the step changes nothing in it (`diff` with the main checkout: no output).
- The options catalog `config/options/appearance.yml`:
  - `themes`, the `label`, `group`, `class` and `glyph` fields, `theme`, `rice.icons`, `rice.brackets`, `rice.monospace`, `wallpaper.themes` and `code_theme`: still true.
  - The `code` field: rewritten with its finding, and the rule that tokens and an earlier class make no code theme.
  - `app_theme`: rewritten. The drawn fill is added, and a workspace file's empty value or one that is not words is a finding, with oculus's value standing.
  - `code_themes.high_contrast` and `code_themes.hidden`: rewritten with the not-a-list finding. `high_contrast` also says that an id both lists name is not offered.
- `config/text/findings.yml`: adds `code`, `app_theme` and `code_themes_list`.
- `config/text/views/apps/apps.yml:144` ("so the default theme is drawn"): still true. The default is what an empty `theme` draws, which is the start theme.

**Edited assertions of existing tests.**

| file:line | before | after |
| --- | --- | --- |
| config-folder.test.ts:129-136 | key list without the two keys | adds `'app_theme'` and `'code_themes'` |
| config.test.ts:769 | "...nor the id of a Shiki theme; ..." | "...nor the id of a Shiki theme the choice offers; ..." |
| config.test.ts:626-636 | `BASE = { text, glyphs }` | `BASE` adds `options` and `code_themes` |
| window-guard.test.ts:260-261 | `color: WINDOW_BACKGROUND`, `symbolColor: '#cccccc'` | `COLOURS.background`, `COLOURS.symbol` |
| window-guard.test.ts:268 | `windowFrame(platform)` | `windowFrame(platform, COLOURS)` |
| options-pages.test.ts | title "writes the theme the picker chose, ..." | "writes the theme chosen in the theme list, ..." |
| boundaries.test.ts:313 | no row | `'data/helpers/editor/start-theme'` |
| look/themes.ts:85 (helper) | `themeClass(name, NO_OFFERS)` | `themeClass(name, NO_OFFERS, false)` |

**Edge values, from tests.**

| key | empty | wrong type | duplicate | colliding name |
| --- | --- | --- | --- | --- |
| `group` | `''`: finding, drawn before the groups (config.test.ts:675) | `5`: same (config.test.ts:675) | rows sharing a group: one heading (theme-groups.test.ts:100, 134) | an app's title: one heading with the app's themes (:147); a Shiki heading's words: one heading (:256) |
| `code` | `''`: finding, no code theme (config.test.ts:730; theme-groups.test.ts:227) | `5`: same (same lines) | two rows of one class: listed once, first row's words and group (theme-groups.test.ts:227) | class `tokens`: no code theme; class `monokai`: the row takes the id and Shiki's `monokai` is left out (:227) |
| `app_theme` | oculus's config: finding (config.test.ts:757); workspace file: refused, oculus's value stands, window `#181818` (window-guard.test.ts:323) | `5`: the same pair (config.test.ts:758; window-guard.test.ts:324) | two rows of its name: the first row's class (window-guard.test.ts:329; the it.each row at :352) | `A` against row `a`: finding (config.test.ts:756); an app's choice: no finding (:754, open item 186); `gone`: finding, window on the first theme (:755; window-guard.test.ts:319) |
| `code_themes.high_contrast` | `[]`: no finding, the id under dark (config.test.ts:718; theme-groups.test.ts:277) | a string: finding, changes nothing (config.test.ts:724; theme-groups.test.ts:278); item `5`: finding, other items read (:725; :281) | repeated id: no finding, read once (theme-groups.test.ts:280) | an id `hidden` also names: not offered (theme-groups.test.ts:282); an unbundled id: finding (config.test.ts:701) |
| `code_themes.hidden` | `[]`: no finding, `dark-plus` offered (config.test.ts:718; theme-groups.test.ts:221) | `null`: finding (config.test.ts:724); a string: `dark-plus` stays offered (theme-groups.test.ts:283) | `['red','red']`: no finding (config.test.ts:719); `['dark-plus','dark-plus',5]`: left out (theme-groups.test.ts:287) | `vscode-dark-plus`: the VS Code theme stays (theme-groups.test.ts:289); `gone`: finding (config.test.ts:701) |

**The Oculus card.**
- Before: there is no card. No `tools/oculus/.oculus/project.yml` exists in the main checkout or the base (`ls`: "No such file or directory").
- After: `.oculus/project.yml` holds `tier: personal`, `type: active` and `status.chips: [building]`.
  - The board for the tier `personal` is the view `personal` (`config/defaults/layout.yml:272-288`), pinned in the rail (`:76`). It groups by chip, and `building` is its first group (`#d4a017`).
  - The chip `building` is in the vocabulary (`config/catalogs/vocab.yml:122`).
  - So the card is on the Personal board under "building". This is read from the config only, not seen in a run, and it shows only once the hub scans the repository's folder, which is part B's.

## Checks

- `npm run format`: ran twice, and the second run changed no file (every line "(unchanged)").
- `npm run diagrams && npm run test:quick -- --base e9fd29162`, one run, exit 0:
```
test:quick: 74 changed file(s), from git since e9fd29162
test:quick: 114 test file(s), 9 essential
ok      ASCII gate (0.8 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (9.2 s)
ok      svelte-check (22.6 s): 1792543692486 COMPLETED 531 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (54.3 s): Duration  47.64s ...
test:quick: 56.5 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```
  The run is over the time limit of 45 s, at 56.5 s.
- `npm run check`: "COMPLETED 4249 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS".
- `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/look tests/checks/tree/boundaries.test.ts tests/server/desktop/window-guard.test.ts tests/state/workbench/options-pages.test.ts tests/data/helpers/code-theme-pairs.test.ts tests/shell/keys/theme-rows.test.ts tests/state/system/settings/theme-groups.test.ts tests/checks/diagrams tests/checks/config --testTimeout 0 --hookTimeout 0`: "Test Files 14 passed (14)", "Tests 279 passed | 9 skipped (288)". The skipped ones include the slow pairs test, which is quoted above.
- `node utils/migrations/convert-vscode-themes.ts --check`: "19 themes up to date", exit 0.
- `sh utils/unused-exports.sh` against `.agents/worktrees/O39-base/unused-exports.txt`: 342 lines each, and `diff` gives no output.
- The perl character gate of `spec.md` over every changed file, including `CLAUDE.md`, `DESIGN.md`, `HELP.md`, `docs/apps.md`, `.oculus/project.yml` and `.agents/plan.yaml`: no output, exit 0.
- After the test:quick run, three edits followed, all to comments or doc prose:
  - the `rice.icons` section in `DESIGN.md:254`;
  - the head comment of `start-theme.ts`;
  - one comment rewrapped in `convert-vscode-themes.ts:305-307`.
  For these files `npx prettier --check` gives "All matched files use Prettier code style!", the gate gives no output, `--check` gives "19 themes up to date", and `npx vitest run tests/server/desktop/window-guard.test.ts tests/checks/tree/boundaries.test.ts` gives "Tests 36 passed (36)".

## Files changed in the round

Each count is against the round's snapshot `.agents/worktrees/migration-O39-round-1`. A file not in the snapshot is counted against the base copy, and `docs/apps.md` against the main checkout.

- New: `src/lib/data/helpers/editor/start-theme.ts` +44.
- Code, desktop host and page side:
  - `src/desktop/decide/window-options.ts` +12 -1
  - `src/desktop/preload.cjs` +2 -2
  - `src/desktop/windows/bridge.ts` +16 -10
  - `src/desktop/windows/start-colours.ts` +4 -2
  - `src/lib/shell/window/strip-colours.ts` +28 -15
  - `src/lib/shell/window/appearance.svelte.ts` +15 -7
  - `src/lib/state/shared/stores/desktop.ts` +5 -3
- Code, the start theme, code themes and findings:
  - `src/lib/data/helpers/editor/code-themes.ts` +42 -54
  - `src/lib/data/sources/config/sections/themes.ts` +57 -11
  - `src/lib/state/shared/words/appearance.ts` +35 -37
  - `src/lib/state/workbench/ui.svelte.ts` +1 -1
  - `src/lib/ui/theme/app-theme.ts` +3 -3
  - `src/lib/ui/theme/theme.ts` +1 -14 (now equal to the base)
  - `src/lib/themes/parse.ts` +4 -3
- Comments only:
  - `src/lib/state/shared/words/tones.ts` +1 -1
  - `src/lib/state/system/apps/shell/shell.svelte.ts` +5 -5
  - `src/lib/state/client/socket.svelte.ts` +4 -4
  - the 9 sheets of `src/lib/themes/rice/`: +1 -1 each, `gruvbox.css` +2 -1 and `singles.css` +2 -2
- Script: `utils/migrations/convert-vscode-themes.ts` +59 -22.
- Config:
  - `config/options/appearance.yml` +4 -4
  - `config/text/findings.yml` +3 -0
- Pages:
  - `CLAUDE.md` +2 -1
  - `DESIGN.md` +3 -3
  - `HELP.md` +1 -1
  - `docs/apps.md` +1 -1
- Generated diagrams:
  - `docs/diagrams/layers.dot` and `layers.svg`: +3 -3 each
  - `layer-shell.dot` and `layer-shell.svg`: +2 -2 each
  - `layer-data.dot` and `layer-data.svg`: +1 -1 each
  - `layer-state.dot` and `layer-state.svg`: +1 -1 each
- Tests:
  - `tests/server/desktop/window-guard.test.ts` +87 -2
  - `tests/state/system/settings/theme-groups.test.ts` +107 -3
  - `tests/checks/config/config.test.ts` +47 -0
  - `tests/checks/tree/boundaries.test.ts` +51 -47 (one row and the head comment; the rest is rewrapping)
  - `tests/checks/look/themes.ts` +5 -5
  - `tests/state/workbench/options-pages.test.ts` +2 -2

Paths beyond the brief's list, each needed by an item:
- item 1: `bridge.ts`, `preload.cjs`, `desktop.ts`, `ui.svelte.ts` and `app-theme.ts`;
- item 3: `socket.svelte.ts`, `tones.ts`, `shell.svelte.ts`, the 9 rice sheets, `options-pages.test.ts` and `docs/apps.md`;
- item 2: `start-theme.ts`.

## Host- and user-visible changes in the round

- The desktop window's fill:
  - Before: the start theme's background for the whole life of the window. Dark Modern's `#181818` stayed behind a page drawn in Latte, at a resize or an overscroll.
  - After: the window takes the background of the theme the page drew, at each draw, on every system. The find bar's view keeps its fill from creation.
- The strip's fill layer:
  - Before: the start theme's `--bg`.
  - After: the drawn theme's `--bg`, the same value the host fills the window with.
- An app's theme in the desktop window, while the apps have not sent their offers, or when no acting app offers it:
  - Before: the page drew the first theme of the list (the light theme with the shipped config) while the host filled with `app_theme` (`#181818`).
  - After: the page draws the `app_theme` start (`vscode-dark-modern` with the shipped config). In a browser it is still the first theme.
- An offered app's theme whose file does not load:
  - Before: the class `app-theme` with no sheet, which is the `:root` light tokens.
  - After: the start theme. This is verified by reading `appearance.svelte.ts:95` only.
- New findings:
  - `appearance.code`: "the theme {0} names a code that is not vscode; its class is no code theme".
  - `appearance.app_theme`: "app_theme is {0}, which names neither a theme of themes nor an app's theme; a window of the desktop app starts on the first theme".
  - `appearance.code_themes_list`: "{0} is not a list of words; an item that is not words, and the whole value when it is no list, changes nothing".
- Code themes:
  - A theme row whose class is `tokens` no longer makes a code theme.
  - A row whose class an earlier row took is listed once.
  - A Shiki id that a row's class takes (`monokai`) is offered once, as the row's theme.
- The help texts of `code`, `app_theme`, `code_themes.high_contrast` and `code_themes.hidden` say the above.
- `convert-vscode-themes.ts --check` names a breaking row with its `uiTheme` and its group, where it compared against fixed words before.
- `CLAUDE.md` gains the credentials rule and names the perl gate.

# Repair round 2

Everything in round 2 is done. Three things the orchestrator must know before landing, each stated again below where it belongs:

- Limits of the launch were broken twice by test runs. `test:quick -- --base e9fd29162` ran four times, where one run and one rerun were allowed (run 2 was red in `app-theme-start.test.ts`, a file this round adds; run 3 was green; run 4 followed the change that took the module-level state out of `appearance.ts`, see item 4). And one vitest run named the folder `tests/server/desktop`, which holds the slow-tier `start.test.ts`: that file starts the worktree's Electron under `app-harness.ts` (no window, a recorder for every screen call) on port 8817 with a scratch HOME. Its first row timed out at 600 s. `ps -axo pid,etime,command | grep -iE "electron|app-harness|oculus-|tmux -S"` afterwards shows no process of this worktree, and `lsof -nP -iTCP:8817 -sTCP:LISTEN` shows nothing listening. The run rewrote the gitignored `build-app/` (dated 10:53). Ports 8787 and 8790 were not touched.
- `knip` names one new unused export, `vscodeRows` of `code-themes.ts`; its importer is `utils/migrations/convert-vscode-themes.ts:40`, which `--production` does not read.
- The `config` channel's payload has a new field, `codeThemeClasses` (item 4). It is internal to oculus's server and page, and is listed as a decision.

## Open items

None raised by this round. Open items 185, 189 and 190 and the review's small findings are the orchestrator's at landing; this round did none of them.

## Item 1: ruling 188, Theme and Code theme are separate

What is there now:

- `config/defaults/appearance.yml:111` holds `code_themes.vscode`, 19 rows `{ class, label, group }`. No `themes:` row carries `code`, and the head comment of `themes:` (`appearance.yml:7`) no longer speaks of code themes.
- `src/lib/data/helpers/editor/code-themes.ts` reads only the merged `code_themes.vscode`: `vscodeRows` (`:104`), `vscodeProblems` (`:130`), `codeThemeInfo` (`:153`), `codeThemeIds` (`:178`) and `isCodeTheme` (`:186`) take the classes that have TextMate rules (`ruled`) from their caller. `VSCODE_CODE`, `shippedRows` and `shippedThemeOptions` are gone.
- `src/lib/data/places/code-rules.ts` (new, 25 lines) reads the keys of `vscode-rules.json` for the server (`vscodeRuleIds`).
- Findings (`config/text/findings.yml:61-65`, raised by `src/lib/data/sources/config/sections/themes.ts:40-49`): a value that is not a list, a row with no class, a repeated class, `tokens`, a class with no rules entry. `appearance.code` is gone.
- `config/options/appearance.yml` drops the `code` field of `themes`, adds `code_themes.vscode` (`:159-167`), and rewrites `themes`, `code_theme` and `code_themes` help. `catalogs.ts` and `schemas/engine.ts` no longer read code themes out of the options catalog.
- `utils/migrations/convert-vscode-themes.ts --check` compares `code_themes.vscode` with `vscode-rules.json` (`:377-382`).

Command: `node utils/migrations/convert-vscode-themes.ts --check` prints `19 themes up to date`, exit 0.

## Item 2: ruling 186, an app's theme is drawn from the first paint

What is there now:

- The first load carries the files. `firstAppThemes` (`src/lib/server/machine/apps/routes/theme.ts:52`) reads the file of the theme `theme` names and of the one `app_theme` names, through `appThemeOf` (`:32`), which returns before it opens a file for an app that is not approved and enabled (`heldChoice`, `choice.ts`). The four page loads carry the result as `appThemes` (`src/routes/+page.server.ts:71`, and the `find`, `present/show` and `present/print` loads).
- The page converts it before first paint, on every page:
  - The workbench: `+page.ts:31` hands `appThemes` on, `+page.svelte:329` gives it to `Workbench.svelte` (prop `appThemes`, `:158`), and `useAppearance` (`src/lib/shell/window/appearance.svelte.ts:77`, `:124`) hands the file to the first draw of the theme through `firstDrawFile` (`src/lib/ui/theme/app-theme.ts:158`). `drawTheme` draws a draw's `file` with no request (`app-theme.ts:201`). A later draw of the same theme loads it from the server.
  - The find bar and the presenter's pages: `drawConfiguredTheme(document, inApp, files)` (`app-theme.ts:224`) draws from the offers the files make (`fileOffers`, `src/lib/data/helpers/files/apps/choices.ts:81`).
- The host fills a new window with that theme's colours. The server tells the host the same files over the parent port (`{ kind: 'app-themes', files }`, `src/lib/server/root/process/parent.ts:28`, sent from `src/server.ts:121`), the host holds them (`src/desktop/server/process.ts:126`), and `startColours` (`src/desktop/windows/start-colours.ts:82`) converts the file with `vscode-map.ts`.
- `app_theme` may name an app's theme. The start rule is `windowStart` (`src/lib/data/helpers/editor/start-theme.ts:39`). The finding text is at `findings.yml:57`, the help at `config/options/appearance.yml:42`, and `HELP.md:509` is rewritten.
- The start theme is drawn only when the file does not resolve or the app is not approved and enabled: `themeClass` and `startChoice` in `src/lib/state/shared/words/appearance.ts`, and in `drawConfiguredTheme` an app's theme with no file is not offered.

Command: `npx vitest run tests/server/desktop/app-theme-start.test.ts` (in the step 4 run below) passes 6 tests.

## Item 3: ruling 187, the refusal of a workspace folder inside a hub is removed

What is there now:

- `noProject` and `project_in_hub` are gone from `folders.ts`, `follow.ts`, `roots.ts` and `findings.yml`.
- A workspace folder whose manifest the hub's scan reads is that scan's one project, with no finding, matched by real path:
  - For the primary hub, `readHubManifests` builds the set of real paths the scan read (`src/lib/data/sources/manifests.ts:466`), and `workspaceFound` (`:433`) skips a root whose manifest is in it.
  - For the other hubs, `repositoriesOf` (`src/lib/server/files/roots.ts:130`) leaves out a root whose manifest another hub's scan reads. It uses `readElsewhere` (`:100`) and `scannedFiles` (`manifests.ts:392`), and walks only the scan rules whose real base holds a wanted manifest.
- Writes go to the file the project was read from. `homeOf` accepts a workspace-folder project, and `holding` (`src/lib/server/edit/writes/hubs.ts:240`) takes, in order: the own hub by containment, the bookmarks, the primary's workspace-folder manifest by real path, then another hub by containment.
- `primaryConfig` takes the hub settings (`roots.ts:154`), and its five callers pass them.
- `DESIGN.md:709`, `HELP.md:533`, and the comments of `folders.ts`, `roots.ts`, `writes.ts` and `hubs.ts` are rewritten. The tests follow the new rule (table below).

Commands: `npx vitest run tests/data/hubs tests/routes/edit/undo/undo.test.ts tests/data/sources/manifests/manifests.test.ts` (in the step 4 run).

## Item 4: no module-level state for the code theme classes and the carried app themes

`boundaries.test.ts` "holds no process-wide state under src" refuses a module-level binding not in `FROZEN`. The work of items 1 and 2 holds no such binding, and `FROZEN` is unchanged:

- The classes ride the config:
  - `setAppearance(config, classes)` (`appearance.ts:363`) computes the code theme in force against them.
  - The classes come from the page data (`install.ts:37`) and from every `config` push (`socket.svelte.ts:382`). The push carries them as `ConfigPayload.codeThemeClasses` (`src/lib/data/model/index.ts:287`), filled by the watcher (`portfolio.ts:650`) and the seed (`+page.server.ts:77`), and checked by the payload schema (`payloads.ts:36`).
  - The Settings view hands them to `listsOf` (`Settings.svelte:200`, `sources.ts:64`, `:127`).
- The carried files are not installed anywhere:
  - A page with no `apps` channel draws from `fileOffers(files)`.
  - The workbench's once-per-theme record is a `Set` inside `firstDrawFile`'s closure, made once per `useAppearance` call.
  - `setCodeThemeClasses`, `codeThemeClasses()`, `setAppThemeFiles` and `takeAppThemeFile` are gone.

Command: `npx vitest run tests/checks/tree/boundaries.test.ts` passes, inside the step 4 run.

## The cases, before the round and after

Runs before the round are from the scratch copy `$TMPDIR/o39-r2-before-cases/oculus` (the base copy with the snapshot laid over, and this round's test files copied in). Commands:

```
npx vitest run tests/data/hubs/hub-folders.test.ts tests/data/hubs/workspace-findings.test.ts tests/data/hubs/workspace-projects.test.ts tests/routes/edit/undo/undo.test.ts tests/checks/config/config.test.ts tests/data/helpers/code-theme-pairs.test.ts
npx vitest run tests/state/system/settings/theme-groups.test.ts tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/shell/keys/theme-rows.test.ts
```

Ruling 188 (`theme-groups.test.ts`, `config.test.ts`, `code-theme-pairs.test.ts`):

- Cases: a rename, a theme row removed, a code row removed, a row with no rules entry, and the shipped 19 rows unchanged.
- Before: every one of these files stops at its import: `Error: Cannot find module '../../../../src/lib/data/places/code-rules.ts' imported from .../tests/state/system/settings/theme-groups.test.ts`, and the same line for `config.test.ts` and `code-theme-pairs.test.ts`. No assertion line can be shown, because the module the cases read the rules through does not exist before the round.
- After: they pass in the step 4 run.
- The shipped rows: the 19 `code: vscode` rows of the snapshot's `appearance.yml` and the 19 `code_themes.vscode` rows of the worktree, as `{class, label, group}`, are identical. `theme-groups.test.ts` asserts the same against the config, with `expect(rows).toHaveLength(19)` and one group and label per class.

Ruling 186 (`app-theme-start.test.ts`, 6 tests):

- Cases: `theme` names an app's theme; `app_theme` names one with `theme` empty; the workbench's first draw from the file and a later draw that loads; an app not approved; an app disabled; an unresolved file.
- Before: `Error: Cannot find module '/src/lib/data/places/code-rules.ts' imported from .../tests/server/desktop/app-theme-start.test.ts`.
- After: 6 pass.
- For "an app not approved or disabled reads no file", the test asserts `heldChoice(apps, choice) === 'closed'`, the answer on which `appThemeOf` returns before `resolveTheme` (`theme.ts:33-34`). A read of the file system is not spied on.

Ruling 187 (before, on the scratch copy):

- `hub-folders.test.ts`, 2 rows: `AssertionError: expected [ [ 'inner', ...(1) ] ] to deeply equal []`.
- `workspace-findings.test.ts` "raises no finding and is a root of the workspace wherever it lies": `AssertionError: expected [ { ...(3) }, { ...(3) }, { ...(3) } ] to deeply equal []`.
- `workspace-projects.test.ts`:
  - The oculus case: `expected [ 'site', 'spark' ] to deeply equal [ 'oculus', 'site', 'spark' ]`.
  - The folder holding a hub: `expected [ 'site', 'spark' ] to deeply equal [ 'holder', 'site', 'spark' ]`.
  - The nested repository in a scan folder (named directly, and through a link) and the second hub's scan: `expected [ { ...(3) } ] to deeply equal []`, three times.
- `undo.test.ts`, the write and undo of the oculus case: all 12 rows fail. The rows are 6 writes (manifest editor field, snooze, follow-up done, Pin, subtask tick, added line) in the primary hub and in a second hub. Each fails with `<label>: expected 404 to be 200`.
- After: all pass in the step 4 run.

## Greps of the removed names

Command, after the round: `grep -rn --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=.svelte-kit-app --exclude-dir=build-app --exclude-dir=.scratch "<name>" .`

| Name | Before the round (files) | After the round |
|---|---|---|
| `code: vscode` | HELP.md, DESIGN.md, appearance.yml (defaults), convert-vscode-themes.ts, code-themes.ts | none; the rows moved to `code_themes.vscode`, and the texts are rewritten |
| `VSCODE_CODE` | sections/themes.ts, code-themes.ts | none; the finding `appearance.code` is removed |
| `shippedRows` | code-themes.ts | none |
| `shippedThemeOptions` | catalogs.ts, code-themes.ts | none; the catalog reads no code themes |
| `noProject` | DESIGN.md, workspace-findings.test.ts, roots.ts, folders.ts, follow.ts, deposit-routes.ts | `deposit-routes.ts:130,208,220,240` only, an unrelated function of the deposit route, kept |
| `project_in_hub` | DESIGN.md, findings.yml, hub-folders.test.ts, workspace-findings.test.ts, folders.ts | none |
| `setCodeThemeClasses`, `codeThemeClasses()`, `setAppThemeFiles`, `takeAppThemeFile` | none | none |

## Paragraphs of the pages and catalogs

- `DESIGN.md:248` (themes): rewritten for `code_themes.vscode`, `app_theme` naming an app's theme, the first paint, the parent port and the classes carried by the first load and the `config` channel.
- `DESIGN.md:709` (workspace folders): rewritten for the real-path rule and the writes.
- `HELP.md:509` (theme list): rewritten.
- `HELP.md:533`: a new bullet on a workspace folder as a project.
- `HELP.md:498`: still true.
- `README.md`: not touched. There is no README.md in the snapshot, and the worktree's was not changed this round.
- `docs/apps.md`: not touched. `diff` with the snapshot is empty.
- `docs/diagrams/`: `layers`, `layer-data`, `layer-server` and `layer-ui` are regenerated by `npm run diagrams`, with import counts only.
- `config/options/appearance.yml`:
  - Rewritten: `themes` (`:18`), `theme` (`:35`), `app_theme` (`:42`), `code_theme` (`:156`) and the `code_themes` group text (`:206`).
  - Added: `code_themes.vscode` (`:159-167`).
  - Removed: the `code` field.
  - Still true: `code_themes.high_contrast` and `code_themes.hidden`.
- `config/text/findings.yml`:
  - Removed: `project_in_hub` and `appearance.code`.
  - Rewritten: `app_theme` (`:57`).
  - Added: the five `code_themes_vscode_*` texts (`:61-65`).

## Edited assertions of existing tests

| File | Before | After |
|---|---|---|
| `tests/data/hubs/hub-folders.test.ts`, 2 rows | `findings: [['inner', 'findings.workspace.project_in_hub']]` | `findings: []`; the row reads "...lies inside a hub as a project, with no finding" |
| `tests/data/hubs/workspace-findings.test.ts` | three `project_in_hub` findings for a folder inside, holding or lying in a hub | `workspaceFindings` is `[]`, and the roots list holds every folder |
| `tests/checks/config/config.test.ts` | "names a theme row whose code is empty, not words or not vscode": three `appearance.code` findings | "names a code_themes.vscode that is no list, and each row with no class, a repeated class, tokens or a class with no rules": five `code_themes.vscode` findings, and `code_theme: vscode-nowhere` read as a wrong `code_theme` |
| `tests/checks/config/config.test.ts`, `app_theme` row | "...a window of the desktop app starts on the first theme" | "...a window of the desktop app whose theme names no theme it can draw starts on the first theme of themes" |
| `tests/server/desktop/window-guard.test.ts` | `themeClass(configuredTheme(true), NO_OFFERS, true)` is `windowThemeClass(merged)` | `{ cls: themeClass(configuredTheme(true, offers), offers, true) }` equals `windowStart(merged, [])`, with `offers = fileOffers(files ?? {})` and a row for an app's theme carried with no file |
| `tests/server/desktop/window-guard.test.ts` | `themeClass(choice, NO_OFFERS, true)` is `vscode-dark-modern` (an app's theme not yet known) | `themeClass(choice, fileOffers({ [choice]: null }), true)` is `vscode-dark-modern`; a new row asserts `themeClass(choice, NO_OFFERS, true)` is `app-theme`, a theme the page loads |
| `tests/server/desktop/window-guard.test.ts`, start colours | `startColours(engine, state)` | `startColours(engine, {}, state)`, the same expected colours |
| `tests/data/helpers/code-theme-pairs.test.ts` | `codeThemeIds(config)` | `codeThemeIds(config, new Set(vscodeRuleIds()))`, the same expectation |
| `tests/data/sources/manifests/manifests.test.ts` | `repositoriesOf(open)` imported | a local `repositoriesOf` over `primaryConfig(MERGED, open, settings).repositories`, the same expectations |

Call sites with no assertion change pass the classes or the new payload field: `setAppearance(config, vscodeRuleIds())` in `rail-fixture.ts`, `settings/fixture.ts`, `workbench-fixture.ts`, `look/themes.ts` and `theme-rows.test.ts`, and `codeThemeClasses: []` in `app-editor-close.test.ts` and `options-pages.test.ts`.

## Checks

1. `npm run format`: it rewrote `tests/checks/config/config.test.ts` and `tests/shell/keys/theme-rows.test.ts` (the wrapping of a `setAppearance` call). Every other file is unchanged.
2. `npm run diagrams && npm run test:quick -- --base e9fd29162` (run 4, see the first lines): every command passed.
   ```
   ok      ASCII gate (0.9 s)
   ok      prettier (1.4 s): All matched files use Prettier code style!
   ok      svelte-kit sync (2.2 s)
   ok      eslint (18.3 s)
   ok      svelte-check (43.8 s): ... COMPLETED 531 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest (100.9 s): Duration  91.06s ...
   test:quick: 103.3 s (limit 45.0 s); every command passed
   test:quick: over the time limit
   test:quick: not covered: tests outside the selection, tests/checks, slow tests,
               build, lint of unchanged files; npm run test:landing runs them
   ```
3. `npm run check`: `COMPLETED 4252 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
4. The step 4 vitest run. It covers every changed test file and fixture, `tests/checks/tree/boundaries.test.ts`, `tests/checks/diagrams`, `tests/checks/config`, `tests/data/helpers/code-theme-pairs.test.ts` and `tests/checks/look`, with `--testTimeout 0 --hookTimeout 0`:
   ```
    Test Files  27 passed (27)
         Tests  439 passed | 9 skipped (448)
   ```
   The 9 skipped are the real-hub rows behind `skipIf(!REAL.asked)` in `integrity.test.ts` and `config-folder.test.ts`, present in the base copy (`grep -c "skipIf(!REAL.asked)"` gives 1 and 2 there).
5. `node utils/migrations/convert-vscode-themes.ts --check`: `19 themes up to date`, exit 0.
6. `sh utils/unused-exports.sh`, compared with `diff` against `.agents/worktrees/O39-base/unused-exports.txt`:
   ```
   < Unused exports (229)
   > Unused exports (230)
   > src/lib/data/helpers/editor/code-themes.ts: vscodeRows
   ```
   `vscodeRows` is imported by `utils/migrations/convert-vscode-themes.ts:40`, which `knip --production` does not read. Every other new export has a production importer.
7. The perl gate of `spec.md` over the 82 changed files that are not `.svg` printed nothing. The same gate over `find src tests config -type f ! -name local.yml` also printed nothing.

YAML: `yaml.safe_load` was run on `config/text/findings.yml` and both `appearance.yml` files after their last change, and all loaded. Those files did not change after that.

## Files changed in the round

The line counts are against the snapshot. A file the snapshot does not hold is counted against the base copy, and the diagrams against the main checkout.

Config and pages:

| File | Lines |
|---|---|
| `config/defaults/appearance.yml` | 127 -> 147 |
| `config/options/appearance.yml` | 201 -> 206 |
| `config/text/findings.yml` | 380 -> 383 |
| `DESIGN.md` | 768 -> 768 |
| `HELP.md` | 543 -> 544 |
| `utils/migrations/convert-vscode-themes.ts` | 433 -> 458 |

Diagrams (regenerated):

| File | Lines |
|---|---|
| `docs/diagrams/layers.dot` / `.svg` | 95 / 522, unchanged in length |
| `docs/diagrams/layer-data.dot` / `.svg` | 94 -> 97 / 465 -> 482 |
| `docs/diagrams/layer-server.dot` / `.svg` | 159 / 781, unchanged in length |
| `docs/diagrams/layer-ui.dot` / `.svg` | 143 / 684, unchanged in length |

Source, desktop and data:

| File | Lines |
|---|---|
| `src/desktop/app.ts` | 383 -> 385 |
| `src/desktop/server/process.ts` | 152 -> 162 |
| `src/desktop/windows/start-colours.ts` | 50 -> 99 |
| `src/server.ts` | 149 -> 166 |
| `src/lib/data/helpers/editor/code-themes.ts` | 167 -> 208 |
| `src/lib/data/helpers/editor/start-theme.ts` | 44 -> 59 |
| `src/lib/data/helpers/files/apps/choices.ts` | 71 -> 111 |
| `src/lib/data/model/index.ts` | 862 -> 866 |
| `src/lib/data/places/code-rules.ts` | new, 25 |
| `src/lib/data/sources/config/catalog/schemas/engine.ts` | 232 -> 233 |
| `src/lib/data/sources/config/catalogs.ts` | 375 -> 374 |
| `src/lib/data/sources/config/sections/themes.ts` | 130 -> 175 |
| `src/lib/data/sources/manifests.ts` | 450 -> 485 |

Source, server:

| File | Lines |
|---|---|
| `src/lib/server/edit/writes.ts` | 752 -> 753 |
| `src/lib/server/edit/writes/config/config-sources.ts` | 69 -> 71 |
| `src/lib/server/edit/writes/hubs.ts` | 251 -> 258 |
| `src/lib/server/files/project/project-files.ts` | 260 -> 260 |
| `src/lib/server/files/roots.ts` | 121 -> 170 |
| `src/lib/server/files/workspace/folders.ts` | 294 -> 283 |
| `src/lib/server/files/workspace/follow.ts` | 130 -> 124 |
| `src/lib/server/machine/apps/routes/choice.ts` | 28 -> 41 |
| `src/lib/server/machine/apps/routes/theme.ts` | 41 -> 73 |
| `src/lib/server/machine/pty/routes.ts` | 516 -> 510 |
| `src/lib/server/machine/pty/start/chat.ts` | 135 -> 142 |
| `src/lib/server/machine/runs/seeds/task-start.ts` | 126 -> 126 |
| `src/lib/server/root/config-seed.ts` | 48 -> 49 |
| `src/lib/server/root/process/parent.ts` | 131 -> 171 |
| `src/lib/server/root/watch/portfolio.ts` | 838 -> 840 |

Source, page:

| File | Lines |
|---|---|
| `src/lib/shell/window/appearance.svelte.ts` | 144 -> 163 |
| `src/lib/shell/Workbench.svelte` | 449 -> 456 |
| `src/lib/state/client/shapes/payloads.ts` | 298 -> 299 |
| `src/lib/state/client/socket.svelte.ts` | 453 -> 455 |
| `src/lib/state/shared/page/install.ts` | 29 -> 39 |
| `src/lib/state/shared/words/appearance.ts` | 638 -> 657 |
| `src/lib/state/system/config/editors/sources.ts` | 184 -> 187 |
| `src/lib/ui/theme/app-rules.ts` | 21 -> 21 |
| `src/lib/ui/theme/app-theme.ts` | 182 -> 242 |
| `src/lib/views/system/workbench/Settings.svelte` | 404 -> 405 |

Routes:

| File | Lines |
|---|---|
| `src/routes/+page.server.ts` | 78 -> 91 |
| `src/routes/+page.svelte` | 329 -> 330 |
| `src/routes/+page.ts` | 30 -> 34 |
| `src/routes/find/+page.server.ts` | 17 -> 22 |
| `src/routes/find/+page.svelte` | 131 -> 134 |
| `src/routes/find/+page.ts` | 7 -> 10 |
| `src/routes/present/print/+page.server.ts` | 18 -> 23 |
| `src/routes/present/print/+page.svelte` | 142 -> 142 |
| `src/routes/present/print/+page.ts` | 9 -> 10 |
| `src/routes/present/show/+page.server.ts` | 18 -> 23 |
| `src/routes/present/show/+page.svelte` | 289 -> 289 |
| `src/routes/present/show/+page.ts` | 9 -> 10 |

Tests:

| File | Lines |
|---|---|
| `tests/checks/config/config.test.ts` | 833 -> 862 |
| `tests/checks/look/themes.ts` | 95 -> 96 |
| `tests/checks/tree/boundaries.test.ts` | 848 -> 848 (one comment line; FROZEN and the rows unchanged) |
| `tests/data/helpers/code-theme-pairs.test.ts` | 115 -> 116 |
| `tests/data/hubs/hub-folders.test.ts` | 284 -> 284 |
| `tests/data/hubs/workspace-findings.test.ts` | 46 -> 48 |
| `tests/data/hubs/workspace-projects.test.ts` | new, 163 |
| `tests/data/sources/manifests/manifests.test.ts` | 751 -> 757 |
| `tests/routes/edit/undo/undo.test.ts` | 767 -> 818 |
| `tests/routes/edit/write-fixture.ts` | 513 -> 546 |
| `tests/server/desktop/app-theme-start.test.ts` | new, 270 |
| `tests/server/desktop/window-guard.test.ts` | 376 -> 394 |
| `tests/shell/keys/theme-rows.test.ts` | 124 -> 129 |
| `tests/shell/panes/strip/app-editor-close.test.ts` | 175 -> 176 |
| `tests/shell/rail/rail-fixture.ts` | 46 -> 47 |
| `tests/state/system/settings/fixture.ts` | 25 -> 26 |
| `tests/state/system/settings/theme-groups.test.ts` | 293 -> 344 |
| `tests/state/workbench/options-pages.test.ts` | 167 -> 168 |
| `tests/views/system/workbench/workbench-fixture.ts` | 59 -> 62 |

Every source file is within 880 lines and every Svelte file within 520.

Paths written beyond the brief's list, each needed by an item:

- The pages and loads that carry and hand on the app theme files (item 2): `routes/find`, `routes/present/*`, `+page.ts` and `+page.svelte`.
- The parent port (item 2): `server.ts`, `parent.ts`, `process.ts` and `app.ts`.
- The `config` channel field (item 4): `model/index.ts`, `payloads.ts`, `socket.svelte.ts`, `config-seed.ts`, `portfolio.ts`, `Settings.svelte` and `sources.ts`.
- `app-rules.ts`: the import of `APP_THEME_CLASS`, which now lives in `choices.ts`.
- The callers of `primaryConfig` (item 3): `chat.ts`, `pty/routes.ts`, `task-start.ts`, `project-files.ts` and `writes.ts`.
- The test fixtures named above.

## Decisions taken that the brief does not name

- `ConfigPayload.codeThemeClasses`, a field of the `config` channel's payload (internal to oculus's server and page). It carries the keys of `vscode-rules.json` with every push, so the page reads the code theme in force without a module-level store.
- The message `{ kind: 'app-themes', files }` on the server's parent port.
- `APP_THEME_CLASS` moves to `data/helpers/files/apps/choices.ts`, so the host and the page read one constant.
- `repositoriesOf` is no longer exported. `primaryConfig` takes the hub settings.
- `holding` takes the primary's workspace-folder manifest by real path before another hub's containment.
- `appThemeOf` and the type `VscodeRow` are no longer exported.
- `app-theme-start.test.ts` loads its modules after `vi.resetModules()`, so the quick tier's shared module graph does not hand it empty stylesheets.

## Host- and user-visible changes

- A theme in a workspace file:
  - Before: a `themes:` row with `code: vscode` made a code theme.
  - After: a code theme is a row of `code_themes.vscode`. Renaming or removing a code theme changes only the Code theme choice, and removing a theme row changes only the Theme choice.
- New findings: `code_themes.vscode` not a list, a row with no class, a repeated class, `tokens`, a class with no rules. The finding `appearance.code` is gone.
- `theme` or `app_theme` naming an app's theme:
  - Before: the page loaded the file after first paint, and the host filled the window with the `app_theme` row's colours.
  - After: the page draws it from the first paint, and the desktop app fills a new window with its colours. When the app is not approved and enabled, or the file does not resolve, the start theme is drawn.
- `app_theme` naming an app's theme:
  - Before: a finding.
  - After: allowed, and only a name that is neither a theme of `themes` nor an app's theme is a finding.
- An app's theme on the workbench before the `apps` channel has sent anything:
  - Before: the start theme's class.
  - After: the class `app-theme`, drawn from the carried file or loaded.
- A workspace folder inside a hub:
  - Before: a `project_in_hub` finding, and no project.
  - After: a project with no finding. When the hub's scan reads its manifest, it is that scan's one project (no second card). An edit, and its undo, writes the manifest it was read from.

## New tests and their guarded.md entries

- `tests/server/desktop/app-theme-start.test.ts`:
  - The two closed rows sit under G77 (an app's contribution acts only for an approved, enabled app).
  - The first-paint rows need a new entry: "An app's colour theme the `theme` or `app_theme` option names is drawn from the page's first paint, and a new desktop window is filled with its colours, for an approved, enabled app whose file resolves; otherwise the start theme is drawn."
- `tests/data/hubs/workspace-projects.test.ts`, and the rewritten `workspace-findings.test.ts` and hub-folders rows, sit under G32 (what the hub shows is what its files say). One manifest is one project, wherever its folder lies.
- The 12 rows added to `tests/routes/edit/undo/undo.test.ts` sit under G9 (each write is logged, and its undo puts the file back).
- The rows added to `tests/state/system/settings/theme-groups.test.ts` and `tests/checks/config/config.test.ts`:
  - The `code_themes.vscode` findings sit under G13 (a wrong config value is a finding naming the key).
  - The shipped rows reading with no finding sit under G12.
  - The two lists' separation needs the theme-group entry proposed in round 1's report.

## What the tests do not cover

- `useAppearance` itself is not run by a test: it is an effect in a component. The test covers its parts: `firstDrawFile` hands the file to the first draw and to no later one, and `drawTheme` draws a handed file with no request. Whether `Workbench.svelte` passes `data.appThemes` through is verified by `npm run check` (types) and by reading `+page.svelte:329` and `Workbench.svelte:337`.
- The desktop host's fill from an app's theme is covered by `startColours` in `app-theme-start.test.ts`. The parent-port message from `server.ts` to `process.ts` is not run by a test in this round.
- `tests/server/desktop/start.test.ts` (slow tier) timed out on its first row in the run named above. Whether it passes on this tree is not verified.
