# Refuter report of O189

## Verification lines

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O189`; `git status --short | wc -l` printed 27 before and after the runs.

1. `npm run test:quick` (once):
```
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.5 s)
ok      svelte-check (11.0 s): 1795393863437 COMPLETED 593 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (60.9 s): Duration  47.49s (transform 53.08s, setup 0ms, import 130.30s, tests 48.14s, environment 142ms)
ok      vitest slow (91.6 s): Duration  78.39s (transform 24.32s, setup 0ms, import 73.88s, tests 235.97s, environment 5ms)
ok      vitest checks (91.9 s): Duration  78.63s (transform 30.23s, setup 0ms, import 58.83s, tests 170.54s, environment 6ms)
test:quick: 94.6 s; every command passed
```
2. `npm run check`: `1795393977220 COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `node utils/migrations/convert-vscode-themes.ts --check`:
```
block vscode-light-modern differs
block vscode-light-plus differs
block vscode-light-visual-studio differs
block vscode-quiet-light differs
block vscode-dark-plus differs
block vscode-dark-visual-studio differs
block vscode-red differs
exit 1
```
4. The `ASCII_GATE` perl command over `src tests bin config` without `local.yml`: no line. `LC_ALL=C grep -n '[^ -~]'` over the changed files, the new file and the report: no line.
5. `sh utils/unused-exports.sh` against `O189-unused-base.txt`: `same`, 336 lines.
6. Guarded tests (`tests/checks/look`, `platform-steps`, `app-theme-start`): `Test Files  3 passed (3)`, `Tests  79 passed (79)`.

The report's programs, rerun from the scratch folder:

- `case15.mjs`: `19726 values compared, 0 differ; 1568 values of --ansi-* tokens`
- `palettes.mjs`: `49 rows, 0 differ`
- `case1.mjs`, `case12.mjs`, `case14.mjs`: as quoted in the report
- `case5.sh`, `case6b.sh`: as quoted, on a private relative socket
- `case7.mjs` on both trees: the one difference is `"-e","LANG=en_US.UTF-8"` (`same-otherwise`)
- `floor.mjs 1` and `floor.mjs 4.5`: as quoted
- `min.mjs`: as quoted

My own palette program read the sheets against `@shikijs/themes/dist`, the VS Code bundle's registrations, the six theme files and the brief: `49 blocks 0 differ`. `WORKBENCH` against the bundle's four columns: `mismatches 0`. Each block holds sixteen distinct names, every value six lower-case digits or `var(--...)`.

## Verdicts

| Item | Verdict | Evidence |
|---|---|---|
| 1 | holds | cases 1 to 7 reproduced. `startTerminal` is the one place. `refresh.ts:97` calls `startArgs`, which adds no pair. `ENV_NAMES` and `TASK_ENV_PREFIX` let no request or task set one of the three. An app's `env` goes as `env NAME=...` in the argv (`apps/tools/run/terminals.ts:168-176`), so it wins over the pair |
| 2 | holds | 49 blocks equal to their sources; case 15 with 0 differences; `vscode-rules.json` not in the diff; `--ansi-` read only at `grid-look.ts:27-28` |
| 3 | violated | the option, the named value and the inverse-default rule are in. Inverse text with a colour of its own is drawn below 4.5:1 in 40 of 49 themes (Behaviour 1) |

| Case | Verdict | Evidence |
|---|---|---|
| 1 | met | `case1.mjs` |
| 2 | met | `case1.mjs` |
| 3 | met | `case1.mjs` |
| 4 | met | `case1.mjs`, under ruling 1 of `O189-cases.md` |
| 5 | met | `case5.sh`: `charmap=UTF-8` in each case it names |
| 6 | met | `case6b.sh`: one `python` in all four |
| 7 | met | `case7.mjs` diff |
| 8 | met | my program and `palettes.mjs` |
| 9 | met | the same |
| 10 | met | the own block holds `var(--c-gold)` and `var(--muted)` |
| 11 | met | the same |
| 12 | met | `case12.mjs`. One of sixteen keys given: 15 single notes in `registered`, `#f00` written `#ff0000` |
| 13 | not verifiable | look at landing. By reading, `reflowLook` is untouched, and `getPropertyValue` on the body gives a `var()` value substituted on the theme's block |
| 14 | partial | `case14.mjs` prints `--c-gold-txt`; `COLOR_TOKENS` unchanged; the drawn mark is the look's |
| 15 | met | `case15.mjs` |
| 16 | met | the converter run in a scratch copy: `vscode.css` differs from the committed one in those seven blocks' tokens and comments and the version alone; `vscode-rules.json` in the version alone |
| 17 | met | `grid-look.ts:87`; `applyLook` is not in the diff |
| 18 | partial | black, `#303030` and black on red run as the case says. "text on a coloured background of its own is measured against that background" is false for inverse text with its own colour (Behaviour 1). Wallpaper and drawn result are the look's |

`var()` values in the other readers hold up by reading:
- `deriveTokens` takes hex values of `COLOUR_TOKEN` names only (`derive.ts:55,239`).
- `themeGround` and `windowColours` read `--bg`, `--titlebar-txt` and `--ink` only.
- `tokenNames` takes names from `:root`, and `AppFrame.svelte:130-133` reads computed values off the body.
- Lightning CSS leaves both `grid.css` selectors and the `color-mix` whole.

`pick`'s new calls touch no other token. The splice covers only entries pushed after `before`, and no later step reads `registered` by position.

The grid.css rule, read against xterm 6.0.0's `DomRendererRowFactory.ts`:
- Not matched: a selected cell and a search mark (both get a `CM_RGB` background and no `xterm-bg-257`), and inverse default-colour powerline or box glyphs (they keep `xterm-fg-257`).
- No foreground-only decoration exists: the search addon sets `backgroundColor` only, and no `registerDecoration` call is in `src`, `tests` or `utils`.
- Invisible cells hold a space. Links and underlines follow the text colour. An outline, bar or underline cursor on an inverse cell is matched and readable; a block cursor is left out.
- No other class contains `xterm-fg-`.

## Spec

none beyond Behaviour 1, which names item 3

## Proof

1. `.scratch/migration/agents/reviews/O189-report.md`, "Case 18" and the row of the visible-changes table:
   > | Inverse text with its own foreground (`ESC[7;31m`) | the panel's colour on red | measured by xterm as the ink on red, `#f0f0f0` on `#cd3131` in Dark Modern |

   - Wrong: the row gives only the branch where the ink fails on the colour. `floor.mjs` tries no colour the ink clears, where xterm keeps `xterm-fg-257` and draws the panel's colour unmeasured. The look table has no inverse-coloured line.
   - Failure: the orchestrator reads that such text is floored and lands it; `ESC[7;30m` in Dark Modern is 1.27:1.
   - Names: item 3, case 18.
   - Fix: the case added to the run, the row and the look table.

## Standards

1. Sentences the diff makes false (spec.md: "A sentence in a document or a head comment that the change makes false is a defect of the change").
   - `src/lib/views/sessions/terminal/grid/grid-look.ts`, the comment of `CONTRAST_FLOOR`:
     > The least contrast the grid draws text at against its cell's background ... are lightened or darkened until they clear it.
   - `src/lib/themes/tokens.css` head:
     > the terminal's have no pair in it, since the grid keeps their contrast itself
   - `src/lib/themes/vscode-map.ts` head:
     > never nudged, since the grid keeps its own contrast

   - Reader misled: one adding a palette believes no pair of a theme can be unreadable, while 106 pairs of ansi colour and panel are drawn under 4.5:1 when inverse.
   - Names: item 3.
   - Fix: true once Behaviour 1 is fixed; otherwise each names the inverse exception.

2. `src/lib/views/sessions/terminal/grid/grid.css:14-15`:
   > Dim text takes half of it, as xterm draws dim text.

   - Wrong: xterm halves the palette and default classes (`DomRenderer.ts`, `.xterm-fg-N.xterm-dim`). It writes a truecolor foreground inline and undimmed; `floor.mjs` at ratio 1 prints `class="xterm-dim xterm-bg-257" style="color:#000000;"` for `ESC[2;7;48;2;0;0;0m`. The second rule matches exactly that cell.
   - Fix: say that dim text the rule recolours takes half, as xterm draws dim palette and default text.

## Behaviour

1. `src/lib/views/sessions/terminal/grid/grid-look.ts:87` with `grid.css:17-22`:
   ```
   minimumContrastRatio: CONTRAST_FLOOR
   ...
   [data-terminal] .xterm .xterm-bg-257:not([class*='xterm-fg-'], .xterm-cursor-block) {
   ```
   - What is wrong: for an inverse cell with the default background and its own foreground colour, xterm's `CM_DEFAULT` foreground branch measures the ink on that colour. Where the ink clears 4.5 it pushes `xterm-fg-257`, so the cell is drawn in the panel's colour, which was never measured. The brief describes only the both-default cell; the same cause holds here and nothing handles it. The new sixteen make it worse than today's hues, because today's black slot was `--muted` and the new black is near the panel.
   - Run, `floor.mjs 4.5` with rows added:
     ```
     inverse black: class="xterm-bg-0 xterm-fg-257" style=""
     inverse truecolor fg #101010: class="xterm-fg-257" style="background-color:#101010;"
     inverse 256-col 236: class="xterm-bg-236 xterm-fg-257" style=""
     ```
   - Count over the 49 rows and 16 colours (ink on the colour at 4.5 or more, panel on the colour under 4.5): `pairs: 106, rows: 40, worse: 101, below2: 42`, where "worse" is lower than the base's hue for that slot, and "below2" is under 2:1.
   - Failure scenarios, `printf '\e[7;30mX'` and the like, panel on colour, with the base's value:

     | Theme | Inverse colour | Now | Base |
     |---|---|---|---|
     | Dark High Contrast | black | 1.00 (invisible) | 10.02 |
     | Dark High Contrast | blue | 2.23 | 4.06 |
     | Dark Modern | black | 1.27 | 6.08 |
     | Oculus Dark | black | 1.21 | 6.78 |
     | Oculus Light | bright yellow | 2.10 | 4.92 |
     | Oculus Light | bright white | 2.46 | 17.85 |
     | Gruvbox | black | 1.27 | 4.02 |
     | Tokyo Night | black | 1.05 | 2.76 |

     By reading, an inverse default cell under a find mark goes the same way (the ink measured on `--accent-bg`, the panel's colour drawn), as on the base.
   - Names: item 3 ("The grid draws text at 4.5:1 or more, in every theme"), ruling 773, case 18.
   - Smallest fix: a rule of `grid.css` drawing `.xterm-fg-257:not(.xterm-bg-257, .xterm-cursor-block)` in `var(--ink) !important`, dim at half. That is the colour xterm measured and passed, so it is at 4.5 or more. Its one effect: an inverse powerline or box glyph with a colour of its own, which xterm never measures, turns from the panel's colour to the ink. The orchestrator decides on that effect, as with ruling 2.

2. `src/lib/views/sessions/terminal/grid/grid.css:17-22`, cells the rule recolours that the report's rows do not name.
   - (a) Glyphs xterm exempts from the floor (powerline U+E0A4 to U+E0D6, box and block U+2500 to U+259F), inverse, default foreground, truecolor background. `floor.mjs` prints `class="xterm-bg-257" style="color:#c80000;"` at both ratios for U+E0B0 and U+2588 under `ESC[7;48;2;200;0;0m`. Base: drawn `#c80000`. Now: the panel's colour. A separator or bar drawn as a fill loses its colour.
   - (b) Dim inverse text with a truecolor background. `ESC[2;7;48;2;0;0;0m` in Dark Modern was `#000000` on the ink (13.08:1) and is now half the panel's colour on the ink. Half the panel on the ink is under the dim floor of 2.25 in three themes: Solarized Light 2.22, Solarized Dark 2.14, Solarized (rice) 2.12.
   - Ruling 2 speaks of "text" and ruling 3 of "as xterm draws it now", which holds for dim default text and for neither (a) nor (b).
   - Names: item 3.
   - Smallest fix: a row in the report for each and the orchestrator's word that rulings 2 and 3 cover them. CSS cannot tell these cells from the ones the floor recoloured.

3. User-visible change the report does not state. xterm's `drawBoldTextInBrightColors` defaults to true (`OptionsService.ts:20`) and the grid does not set it, so bold text in one of the eight names now takes the bright twin's colour. On the base the twin was the same hue, so bold changed nothing.
   - `floor.mjs 4.5` with `ESC[1;34m`: `class="xterm-bold xterm-fg-12"`.
   - Failure scenario: the reader uses `ls` with bold blue folders or a bold green prompt. In Solarized (rice), VS Code Solarized Dark and VS Code Solarized Light bold blue is grey `#839496` and bold green grey `#586e75`; in One Dark bold white is `#5c6370` and bold red `#be5046` (all before the floor). The report's table and look never name bold text.
   - Names: the report's "Every host- or user-visible change".
   - Smallest fix: a row in the report and a bold sample in the look. Whether the option stays on is the user's shape; VS Code's own default was not checked here.

## Declined to judge

- Cases 13 and 14, the drawn part of 18, and the built page in Dark High Contrast: only a page shows them.
- Inverse default-colour text at the theme's own ink on panel (4.13:1 in VS Code Solarized Light, the one theme under 4.5): item 3 asks for it "as it is now".
- `LC_CTYPE=UTF-8` carried as set on Linux, and a pane whose tmux server holds an `LC_ALL` oculus's process does not set (`server [LC_ALL=C] process [LANG=nl_BE.UTF-8]: ... charmap=US-ASCII`): case 3 and ruling 1 fix the first, item 1 the second and the report names it. Linux was not run.
- Copy as HTML and the canvas reading of `red`: read in `SerializeAddon.ts` and `Color.ts` only.
- The published palettes the brief gives as values (tokyonight, tokyostorm, tokyolight, onedark, both flexoki): compared with the brief, not with their repositories.
- `docs/HELP.md`: never raised by rule.
- The two comments of `rice/tokyo.css`: known.
- The builder's second `test:quick`: it followed a later edit of `tokens.css`, so whether spec.md allows it depends on reading "after your last change".

## Usage

a273156eeab76f27e, claude-opus-5-5, 271716 tokens, 42 tool uses, 526 s
