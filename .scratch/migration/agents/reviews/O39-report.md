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
