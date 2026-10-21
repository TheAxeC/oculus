# O39 part A, repair round 1

This round carries the findings of the review `agents/reviews/O39-refuter.md` that are inside O39's part A, each with what must hold when it is done. Work in `.agents/worktrees/migration-O39` only, under `agents/briefs/O39.md` (read from the main checkout, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/O39.md`), this file and `agents/spec.md`. No git command of any kind. Every edit with the editing tool, never by a script, `sed`, `python` or `prettier --write` on a single file (`npm run format` once at the end is allowed). No script of your own. No breakage testing in any form. The other limits of your launch hold: no `local.yml` read, no app, Electron, server or browser started, ports 8787 and 8790 untouched.

There is one repair round and no second. Every item below is done in this round; a shortcut, a deferral or a narrower reading is a finding against the round.

## Items

1. **The window's start colours follow the page's theme (Behaviour 3).** The host fills a window with the start theme's background when it makes the window, as now. From then on, the window's background and the page's strip fill are the background of the theme the page draws: when the page sends the title colours for a drawn theme (`desktop?.bridge.titleColours` in `src/lib/shell/window/appearance.svelte.ts`), it sends that theme's background with them, and the host sets the window's background colour to it (`setBackgroundColor`), so the host's fill and the page's strip never read two different themes. `strip-colours.ts` computes the fill from the drawn theme. A background that is not a hex colour sets nothing. The `window-guard.test.ts` cases cover the host side; the report states the before and after.

2. **One start-theme rule, in its own module (Standards 1).** `startTheme` and the config form of `windowThemeClass` move out of `src/lib/data/helpers/editor/code-themes.ts` into a module of `src/lib/data/helpers/` named for what it holds (the theme a window starts on), with its head comment; `code-themes.ts` keeps only the code themes and its head comment says so. The page's `windowThemeClass()` in `src/lib/state/shared/words/appearance.ts` and the host's read go through the one rule, so the last step of the name-to-class lookup is written once. Every importer, `tests/checks/tree/boundaries.test.ts`'s rows and its head comment included, is changed with it.

3. **Head comments and pages the step made false (Standards 2, 3, 4).**
   - `tests/checks/tree/boundaries.test.ts:75-77`: the sentence on `data/helpers/editor/code-themes` says what the module holds now (the code themes read from the config's rows, each with its group), and the new start-theme module gets its sentence wherever the table names a module of `data/helpers` that the desktop host and the page share.
   - `docs/apps.md:283`: an app's `themes` are drawn under a heading of the app's title in the Settings view's choice and in Cmd-K's `:theme`; "the theme picker" goes.
   - "the picker" is renamed "the theme list" (or "the icon theme list" for an icon theme) in `src/lib/state/shared/words/appearance.ts:352,435,443,450,625`, `src/lib/state/system/apps/shell/shell.svelte.ts:405` and `src/lib/state/shared/words/tones.ts:196`, and in any other hit of `grep -rn --exclude=local.yml "picker" src config docs DESIGN.md HELP.md README.md` that names the theme or icon theme list; each hit is listed in the report with what was done, a hit that names another picker (a folder picker, a colour picker) kept and named.

4. **`CLAUDE.md` (Spec 2, Standards 5).** The section "Reports and claims" or "Working on the code" gains the hub rule on credentials in oculus's words: credentials and tokens are the user's; they are never printed, quoted in a report or a commit, or copied into a project folder. The ASCII bullet names the repository's own check, the perl form of `tests/tiers/run.mjs` (`ASCII_GATE`), in place of the `grep` form, so accented letters in names pass as the bullet says.

5. **The group words are not restated in the convert script (Standards 6).** `UI_GROUPS` in `utils/migrations/convert-vscode-themes.ts` goes. `--check` compares each `code: vscode` row's `group` with its theme's `uiTheme` by consistency: every row of one `uiTheme` kind carries one group, `hc-black` and `hc-light` share one, and the light, dark and high contrast groups differ from each other; a row that breaks this is named with its `uiTheme` and its group. Renaming a heading in `config/defaults/appearance.yml` then needs no edit of code. The report quotes `--check` on the shipped rows.

6. **The proof the report lacks (Proof 1, 2, 3; Behaviour 4).** The rewritten report:
   - says `tests/data/helpers/code-theme-pairs.test.ts` is tagged slow, so `npm test` and `test:quick` leave it out and `test:landing` runs it, and quotes its run alone;
   - quotes the failing line of `tests/checks/config/config-folder.test.ts`'s changed case on the base copy, run from a scratch copy under `$TMPDIR` as the first runs were;
   - quotes the grep of the added comment lines and test titles for history words, each hit judged;
   - quotes the greps of each removed or renamed name (`WINDOW_BACKGROUND`, `WINDOW_FILL`, `SYMBOLS`, `APP_THEME`, `VSCODE_THEMES`, `code_themes_vscode_dark`, `code_themes_vscode_light`, `picker`, `UI_GROUPS`, the moved start-theme functions) across `src`, `tests`, `config`, `docs`, `utils`, `HELP.md`, `DESIGN.md` and `README.md`, each hit with what was done;
   - lists every paragraph of `DESIGN.md`, `HELP.md`, `README.md`, `docs/` and the options catalogs the step touches or names, marked still true or rewritten;
   - gives a table of every edited assertion of an existing test with its before and after;
   - gives, for each new key and field (`group`, `code`, `app_theme`, `code_themes.high_contrast`, `code_themes.hidden`), the empty value, a value of the wrong type, a duplicate and a name that collides, each with what the code does, from a run or a test;
   - states the Oculus card the new `.oculus/project.yml` gives on a server whose workspace names the `oculus` folder: the board it shows on and its `building` chip, before (no card) and after.

## Not in this round

- Open items 185 (the six VS Code and Shiki pairs) and 186 (`app_theme` and the apps' themes) are Axel's. When he rules, the ruling is sent to you in this round if you are still working, or carried out at landing.
- The `guarded.md` entries for the new tests and the path list's `utils/diagrams/drawing/labels.mjs`: the orchestrator's, at landing.

## Verify before you report

From `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`: `npm run format`; then `npm run diagrams && npm run test:quick -- --base e9fd29162` once (one rerun only after a red line in a file this round changed); `npm run check` (0 errors, 0 warnings); `npx vitest run` over every test file the step adds or changes, and `tests/checks/tree/boundaries.test.ts`, `tests/checks/diagrams --testTimeout 0 --hookTimeout 0` and `tests/checks/config`; `node utils/migrations/convert-vscode-themes.ts --check`; `sh utils/unused-exports.sh` compared with `.agents/worktrees/O39-base/unused-exports.txt`; the perl character gate of `spec.md` over every file changed. Each with its lines quoted.

## Report

Rewrite `tools/oculus/.scratch/migration/agents/reviews/O39-report.md` in the worktree under a new heading "Repair round 1" after the first report, ASCII only: the first line says anything of this round NOT done, or "Everything in round 1 is done"; then each item above with what changed, its `file:line` and the command that shows it; the checks above with their output; the files changed in the round with line counts; every host- or user-visible change of the round with its before and after. Your final message is the round's section.
