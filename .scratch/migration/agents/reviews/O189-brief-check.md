# Brief check of O189 (read only, main at dcd715bd2)

Ranked by consequence: Q1 (a set `LC_ALL`/`LC_CTYPE` defeats the `LANG` pair, case 4 passes without the goal), I1 (the floor redraws inverse text grey), C1 (item 4's three tests have no entry in guarded.md), C2 (docs/HELP.md may not be written), Q2 (the theme-row test cannot see a missing theme), N1 (`colorToken` loses its only importer), N2/P1 (the usage refresher starts a session outside `startTerminal`), I2 (apps receive the tokens), P2 (no test asserts the vectors), C3 (no base copy named), C4 (case 17 cannot be run), P4 (decision 4 is false for Gruvbox), C5 (item 4's second sentence), I3 to I9.

## Names

Commands: `grep -rnE "colorToken|COLOR_TOKENS|COLOR_NAMES|\bANSI\b|--ansi" src tests config docs README.md utils --exclude=local.yml`; `grep -rnE "fixedEnv|startArgs|GRID_ENV|DISABLE_ALTERNATE_SCREEN" src tests docs README.md utils`; `grep -rnw WORKBENCH src tests utils docs`; `grep -rnE "buildGrid|gridOptions|gridLook|reflowLook|minimumContrast" src tests docs`; `grep -rn tokenNames src tests`.

- **N1.** `colorToken` is imported by `grid-look.ts:10` alone; the other hits are `terminal-marks.ts:27,65,83`, and tests have none. Once the grid stops reading it, it is an export with no importer, which spec.md ("every export the step ... leaves without a caller ... is removed or made local") makes a code change. The brief allows `terminal-marks.ts` "its comments alone". `COLOR_NAMES` keeps an importer (`terminal-list.ts:38`). Change: the path reads "its comments, and `colorToken` made local". Not visible.
- **N2.** `src/lib/server/machine/usage/refresh.ts:11,97` calls `startArgs` itself. See P1.
- **N3.** `docs/apps.md:491` "The page gets every custom property of oculus's `tokens.css`" stays true and grows. See I2.
- **N4.** `src/lib/data/places/platform.ts:1-6` ("The programs that differ between the platforms") becomes false if the locale goes there. The brief allows either place. Change: name a new file, or say the head comment is rewritten. Not visible.
- Hits that stay true: `model-machine.ts:259,442`, `terminal-list.ts:38,393,407,419,644`, `decoration-colors.ts:39-44`, `runs/commands/run.ts:80` (another `ANSI`, an escape-sequence pattern), `tests/state/system/apps/app-keys.test.ts:257` (another `WORKBENCH`), `derive.ts:55`, `hooks.server.ts:12,111`, `start-colours.ts:45-107`, `app-theme.ts:41-67`, `TerminalGrid.svelte:14,81,294,424`. Test files that name the theme sheets (by grep, most not opened): `contrast.test.ts`, `themes.ts`, `config.test.ts`, `code-theme-pairs.test.ts`, `app-theme-start.test.ts`, `window-guard.test.ts`, `hooks-server.test.ts`. None is shown to assert the list of mapped tokens (`grep -rnE "mapTheme|themeSheet" tests` hits `hooks-server.test.ts` only, which builds its block with `themeSheet`).
- `docs/HELP.md:258` stays true ("A terminal starts with git's credential settings ..."); it becomes incomplete, not false. See C2.

## The step line

Parts (1), (2) and (3) are in "What to build". One part has a gap: "every terminal oculus starts (a shell, an agent, a task)" is bound to `startTerminal`, and the usage refresher's agent session is not started there (P1).

## Premises

- **P1 (false).** "`startTerminal` is the one starter of a local tmux session." `sed -n 75,97p src/lib/server/machine/usage/refresh.ts`: `usageStartArgs` ends `return startArgs(id, { kind: 'claude', cwd: hub, cols: COLS, rows: ROWS }, command);`, run at `:207`. `startArgs` is the one builder of the vector and has two callers. Smallest change: correct the sentence, and say whether the usage session takes the pair (judgment: it need not, since no one types in it and it is captured with `-u`). Not visible.
- **P2 (false).** "The exact argument vectors of a start are asserted in tests (`grep -rln "'-e'" tests`), among them ..." That grep gives git-failure, connection-args, approvals, workspace, recover/safety (all another `-e`), `commands-fixture.ts:76` (skips `-e` words) and `tests/routes/git/credentials.test.ts:294` (keeps only `GIT_CONFIG*` words). It gives nothing in `tests/routes/sessions/`, `tests/server/machine/pty/` or `runs/schedules/`, and `grep -n "'-e'\|startArgs\|new-session\|tmux" tests/server/core/credentials.test.ts` prints nothing. The session tests compare `lineOf(started)` (the words after `--`) or single words. Change: the sentence becomes "no test was found that asserts the whole vector of a start", and the write-list row "the test files whose asserted argument vectors the pair changes" goes. Not visible.
- **P3 (imprecise).** "`vscode-rules.json` differs as well": `--check` prints the seven `block` lines and no `rules of` line (exit 1). A run in a scratch copy differs from the committed rules only in the version of the `generated` sentence (1.137.0 against 1.145.2). Change: say so. Not visible.
- **P4 (decision 4 contradicts the table).** "The one of the project the sheet's head names is taken." `gruvbox.css:1` names morhetz/gruvbox. Its `colors/gruvbox.vim:275-297` sets `terminal_color_0 = s:bg0` (hard: dark #1d2021, light #f9f5d7), where the `@shikijs/themes` file gives black #3c3836 and #ebdbb2. Everforest light white also differs: `everforest.vim:545` uses bg3, Shiki gives #939f91. Change: either take morhetz's `g:terminal_color_*`, or word decision 4 as "the family's VS Code theme file where `@shikijs/themes` holds it, else the project's own file". Visible: the black slot used as a background in Gruvbox.
- Line numbers: `startArgs` is at 558, not 560.
- Confirmed:
  - The table: 16 rows, 0 differ against `workbench.desktop.main.js` of 1.145.2.
  - `terminal.integrated.minimumContrastRatio` default 4.5.
  - Six theme files, 16 distinct keys each; no other extension theme file has one.
  - `@shikijs/themes` 4.4.3: sixteen in every listed file, twelve in synthwave-84.
  - "Palettes given here": tokyonight, tokyostorm, tokyolight, onedark, flexoki and flexokilight equal the fetched files, in order.
  - `grid-look.ts` 217 lines, `vscode-map.ts` 616, the converter 500, `sessions.ts` 837.
  - Folder counts 10, 6, 10. `Color.ts:288`. xterm 6.0.0. No `docs/adr`. Every `--panel` is hex.
  - The four kept themes and synthwave declare all eight tokens in their own block.
  - The zsh case on a private socket: `pypython ../` with no `LANG`, `python ../` with the pair.
  - `respawn-pane` keeps the pair, and a later duplicate pair wins.

## Cases and checks

- **C1.** Item 4 orders a theme-row test, a mapping test and one test per locale branch. spec.md: "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it." `grep -n "checks/look\|look/themes\|app-theme-start\|pty/sessions.ts\|GRID_ENV" guarded.md`: the nearest are G26 (readable text pairs), G118 (first paint) and G85 ("each platform branch runs the program its platform has", with `SHELL` and the packager). None covers a locale, a terminal palette or the `ansi` mapping, and `guarded.md` is not in the write list. Change: either the orchestrator gets Axel's yes for named entries before dispatch and adds them, or item 4 and the three test rows of the write list go and the cases stay runs. Not visible in the app, but it stops the builder.
- **C2.** Item 1 and the write list have `docs/HELP.md` written. spec.md: no step rewrites it "except the step whose brief is to write them and a line Axel ruled into a step's brief"; `plan.md:3703` (Help redesigned) says the same. Rulings 770 to 774 (`plan.md:3773-3778`) name no HELP line. Change: drop HELP.md from item 1 and the write list; the report names line 258. Visible (Help page).
- **C3.** The brief names no base copy and no base unused-exports list (`grep -n "base copy\|unused-exports" O189.md` prints nothing). spec.md "Where you work" and the unused-exports rule need both, and `orchestrator-state.md:132` requires them in every brief. Case 15 ("on both trees") and the report's file table rest on it. Change: name both paths. Not visible.
- **C4.** Case 17 says "a grid built by `buildGrid`". `gridOptions` is not exported, and `buildGrid` needs a DOM the suite lacks; the case is not in the look list (13, 14, 18). `applyLook` sets only `theme` and `fontFamily`, so the case can be read. Change: "by reading". Not visible.
- **C5.** Item 4's "each VS Code theme's six files' own colours" is garbled. The theme files exist only in an installed VS Code, so a committed test cannot read them. Change: "a resolved theme given to `mapTheme` with all sixteen, with none, and of each of the four `uiTheme`s". Not visible.
- **C6.** Case 16: `--check` compares the text inside `{}` alone (`blocksOf`), so it cannot see a block comment or the head, and for the seven differing blocks it says only "differs". The scratch-run half is what proves the sixteen lines. Change: say the scratch run's diff covers all 19 blocks and their comments, and that its only other lines are the differences of today. Not visible.
- Cases 13, 14 and 18 and cases 1 to 3 and 5 to 12 are consistent with the rules file apart from the above.
- Case 14's second half and "an app's decoration" check places the step does not change; both follow from ruling 771, so keep them as "as now".

## The question

- **Q1. Case 4 and item 1 pass without the goal.** Private `-S` server, tmux 3.7c, `locale charmap` of the new pane:
  - server env `LC_ALL=C LANG=en_US.UTF-8`, pair `-e LANG=en_US.UTF-8`: `LC_ALL=C LANG=en_US.UTF-8 US-ASCII`
  - server env `LC_CTYPE=C`, the same pair: `US-ASCII`
  - server env `LC_ALL=C`, `-e LANG=nl_BE.UTF-8` (the UTF-8 branch, the user's server started elsewhere): `US-ASCII`
  - with `-e LC_ALL=` added (and `-e LC_CTYPE=` where set): `UTF-8`

  So the result case 4 expects ("`LANG=en_US.UTF-8` on macOS ... and nothing else") leaves the ghost characters, and so does a running tmux server whose environment holds `LC_ALL=C`. Change: each start carries all three names, an unset one empty. In the default branch that is `LANG=<default>`, `LC_ALL=`, `LC_CTYPE=`; in the UTF-8 branch, the process's values and the rest empty. Cases 1 to 4 are rewritten, and a case 5 row is added with a server started under `LC_ALL=C`, asserting `locale charmap`. Visible: `env` in a terminal, and a user's `LC_ALL=C` is overridden, which 770's wording ("a pair of the start") does not name.
- **Q2. The item 4 theme test passes for a theme with no terminal colours.** `themeTokens` uses `resolveTheme`, which merges over `:root`, and `:root` holds the sixteen. Shown with a token only `:root` has: `node bc189/d.ts` gives "own undefined resolved #cc3e44" for tokyonight's `--seti-red`. Change: read the sixteen off the row's own block (`blocks[word]`, `:root` for the empty class), not off `themeTokens`. Not visible.
- Case 5: could pass without the goal (it reads the shell's `LANG`). Add `locale charmap` = UTF-8. Case 6: could not (it is the symptom).
- Cases 1 to 3: the function alone; not the goal by themselves, carried by 5 and 6. Case 7: could pass (it checks presence only).
- Cases 8 to 12: could not for the values they name, but they read the sheet, not the grid. Case 13's look reaches the grid.
- Cases 14 to 16: preservation, not the goal.
- Case 17: could pass (a constant); case 18's look is what shows it. Case 18 does not exercise inverse text (I1).
- The step line itself carries no check. Items 1 to 3 are reached by 5 and 6, by 8 to 13, and by 18.

## Implied inputs

- **I1. Inverse text under the floor.** xterm's DOM renderer measures an inverse cell's default foreground as `colors.foreground` against a background that is `colors.foreground` too (`DomRendererRowFactory.ts`, the `CM_DEFAULT` branches; in `lib/xterm.mjs`: `default:this._applyMinimumContrast(f,it,p.foreground,x,tt,Qi)||fi&&V.push(`xterm-fg-${257}`)`). The ratio is 1, so the text is recoloured and the inverse class is never reached. Computed with `ensureContrastRatio`'s algorithm: Dark Modern #1f1f1f on #cccccc (10.26:1) becomes #555555 (4.64); Light #ffffff on #0f172a (17.85) becomes #818691 (4.89); Phosphor #0a120c (13.15) becomes #246539 (4.85). It affects `less` and tmux status lines, selected menu rows, and a program that draws its cursor inverse. It stays above 4.5 but is fainter than today in every theme, against the purpose of 773. Case 18 does not cover it. Change: add the input with its expected result and put it in the look; whether a weaker inverse is accepted is for the orchestrator or Axel. Visible.
- **I2. Apps.** `AppFrame.svelte:131` hands an app's page every name of `tokenNames()` (`theme.ts:172`, all `:root` properties), so every app gets `--ansi-*` in the theme's values. This contradicts "Nothing else reads them" and is a public shape. Change: list it as a decision ("apps' pages receive them; `docs/apps.md:491` still true"). Visible to app authors.
- **I3. Built CSS.** The project's build shortens colours (`build/client/.../0.IWBk5tZ_.css` has `--diff-added-outline:#0000`), and lightningcss run on `#ff0000` gives `red`. So Dark High Contrast's bright red reads `red` in the built app; xterm's `css.toColor` takes it through a canvas. Expected: drawn the same. Item 4's "is a hex colour" reads the sheets, where it holds. Change: one line. Not visible.
- **I4. Copy as HTML** uses `_themeService.colors.ansi` (`SerializeAddon.ts:565,625`). Expected: the theme's new sixteen, without the floor. Visible. Add to the report's before and after.
- **I5. Wallpaper.** The box is painted at `--terminal-on-wall` (`tokens.css:317`) while the floor is measured against solid `--panel`. Expected: 4.5 against the panel, not against what shows through. Change: one line. Visible.
- **I6. Running terminals and respawned panes.** A session started before the update has no pair, and a respawn keeps the session's environment. Expected: only new starts change. Change: one line. Visible.
- **I7. ssh.** `/etc/ssh/ssh_config:55` `SendEnv LANG LC_*`: an ssh typed in a terminal now sends the pair. Expected: as from Terminal.app, and a host without that locale may print a setlocale warning. With Q1's empty names the result of forwarding empty `LC_*` values was not run. Visible on remote hosts.
- **I8. Empty values in the process.** "Each of the three variables the process has set" does not say whether `LC_ALL=` (set, empty) beside `LANG=nl_BE.UTF-8` is carried. Q1's rule settles it.
- **I9. Desktop app.** `desktop/app.ts:353-357` merges the login shell's environment (`loginEnvironment`), so a `LANG` exported there makes the process UTF-8; a shell that does not answer in 10 s leaves none. Expected: both branches as item 1. Nothing to change.
- No change needed:
  - `rice-plain`, `rice-sans` and `crt` declare no colour token.
  - An app theme's block sets all sixteen on `body.app-theme`, with no competitor.
  - `:root` against `body.<class>` is inheritance against declaration.
  - `var()` in `parseBlocks` is text, and `derive.ts:238` takes hex values of `COLOUR_TOKEN` names only.
  - A grid built before a theme takes the light column.
  - Detached windows run the same component.
  - Stream terminals have no tmux session.
  - An app's variables are `env NAME=...` words after `--` (`terminals.ts:165-173`), which win over the pair.

## ADRs

none (`ls docs/adr`: No such file or directory; no `adr` key in `.agents/plan.yaml`).

## Dictated text

no dictated text (token names and colour values only; no sentence is given word for word for a file).

## Declined to judge

- Whether weaker inverse text (I1) and overriding a set `LC_ALL` (Q1) need Axel's word under 773 and 770.
- Which published Gruvbox palette a reader expects (P4).
- The unused-exports state after the change. `sh utils/unused-exports.sh` at the base lists `terminal-marks.ts: resultMark, tabMark`; that `colorToken` joins them follows from its importers and was not run after a change.

## Usage

Agent a4d05a14db5bd64bf, claude-opus-5-5, 284488 tokens, 60 tool uses, 528 s.

## Closed

- Q1 and I8: item 1's second bullet and cases 1 to 5; the override of an explicit `LC_ALL=C` follows ruling 770's "every terminal" and is decision 1.
- I1: item 3's second bullet, case 18 and the look; decision 6.
- C1: item 4 is gone and its cases are runs, so no test is added; the write list names no test.
- C2: `docs/HELP.md` is out of item 1 and of the write list; the report names its line.
- Q2 and C5: cases 8 to 12 read the theme's own block and `mapTheme` on resolved themes.
- N1: `colorToken` is made local. N4: a new file for the locale.
- P1 and N2: the premise corrected; the usage session takes no pair (item 1, last bullet).
- P2: the premise corrected, the write-list row gone. P3: the premise corrected. P4: decision 4 reworded.
- C3: the base copy and the unused-exports list are named. C4: case 17 by reading. C6: case 16.
- I2: decision 7. I3, I5, I6, I7: the report's before and after and cases 13 and 18. I4: the report's before and after. I9: none needed.
- Dictated text: none, before and after these changes.
