Everything in the brief is done, with the rulings of `O189-cases.md` and the seven items of `O189-round-1.md`. Cases 13, 14 and 18 have their last proof in the look at landing, as the brief says.

## Repair round 1

Nothing of the seven items is undone. `npm run test:quick` was run once and did not print `every command passed`: one test timed out, and its file rerun alone passes (check 1 below).

| Item | What changed | Where now |
|---|---|---|
| 1 | Two rules: a cell with `xterm-fg-257`, no `xterm-bg-257` and no `xterm-cursor-block` is drawn in `var(--ink)`, its dim form in half of it. The comment states both accepted effects. No private member of xterm is used | `grid.css:25-37` |
| 2 | No selector changed. Both cells are named in the first rule's comment and in "Host- and user-visible changes" with their before and after | `grid.css:13-17` |
| 3 | `CONTRAST_FLOOR`, the head of `tokens.css` and the head of `vscode-map.ts` each say that text is held to the floor, dim text to half of it measured in its full colour, and that a powerline, box or block glyph is exempt. `CONTRAST_FLOOR` also says that the inverse text drawn in the panel's colour is at the contrast of the theme's panel and ink | `grid-look.ts:32-40`, `tokens.css:5-11`, `vscode-map.ts:24-31` |
| 4 | "Dim text the rule recolours takes half of that colour, as xterm draws dim text in a palette or a default colour." | `grid.css:15-16` |
| 5 | `floor.mjs` rerun with the rows asked for; the row on inverse text with its own foreground, case 18 and the look table are corrected | below, and in their sections |
| 6 | No code. The row on bold text and a bold sample in the look table are added. Premise checked: `OptionsService.ts:20` `drawBoldTextInBrightColors: true`; the installed workbench registers `"terminal.integrated.drawBoldTextInBrightColors":{...,type:"boolean",default:!0}` | "Host- and user-visible changes", "The look at landing" |
| 7 | The space is back in both section comments, so `git diff -U0 -- src/lib/themes/rice/tokyo.css` shows no line starting with `/*` but the head's | `rice/tokyo.css:87,163` |

Choices inside the items, each reversible: the new rules carry no important declaration, since `xterm-fg-257` is a class and the cell has no inline colour, and their four and five class-level selectors outrank xterm's two and three, whichever sheet loads last. The rule also draws in the ink an inverse cell on the default background under a find mark, where xterm measures the ink on the mark too; the comment says so.

### Item 5, `floor.mjs 1` and `floor.mjs 4.5`

In Dark Modern's panel, ink and sixteen colours:

```
                                                      floor.mjs 1                                                  | floor.mjs 4.5
inverse black:                                        class="xterm-bg-0 xterm-fg-257" style=""                     | the same
inverse red:                                          class="xterm-bg-1 xterm-fg-257" style=""                     | class="xterm-bg-1" style="color:#f0f0f0;"
inverse truecolor foreground #101010:                 class="xterm-fg-257" style="background-color:#101010;"       | the same
inverse 256-colour 236:                               class="xterm-bg-236 xterm-fg-257" style=""                   | the same
dim inverse black:                                    class="xterm-dim xterm-bg-0 xterm-fg-257" style=""           | the same
dim inverse red:                                      class="xterm-dim xterm-bg-1 xterm-fg-257" style=""           | the same
block glyph, inverse black:                           class="xterm-bg-0 xterm-fg-257" style=""                     | the same
powerline glyph, inverse, truecolor background #c80000: class="xterm-bg-257" style="color:#c80000;"                | the same
block glyph, inverse, truecolor background #c80000:   class="xterm-bg-257" style="color:#c80000;"                  | the same
dim inverse, truecolor background #000000:            class="xterm-dim xterm-bg-257" style="color:#000000;"        | the same
inverse, default colours:                             class="xterm-bg-257 xterm-fg-257" style=""                   | class="xterm-bg-257" style="color:#555555;"
inverse dim, default colours:                         class="xterm-dim xterm-bg-257 xterm-fg-257" style=""         | class="xterm-dim xterm-bg-257" style="color:#848484;"
blue:                                                 class="xterm-fg-4" style=""                                  | class="" style="color:#4e8ed3;"
bold blue:                                            class="xterm-bold xterm-fg-12" style=""                      | the same
bold red:                                             class="xterm-bold xterm-fg-9" style=""                       | the same
```

The new rule matches the 4.5 lines that hold `xterm-fg-257` and no `xterm-bg-257`: inverse black, truecolor `#101010`, 236 and the block glyph in the ink, dim inverse black and dim inverse red in half the ink. xterm brings inverse red to `#f0f0f0` itself.

### The round's case, `node .agents/scratch/pairs.mjs $PWD`

49 rows by sixteen colours, with xterm's own `Color.ts` (`rgba.ensureContrastRatio`, `contrastRatio`):

```
plain: 784 pairs, 678 recoloured inline by xterm, 106 given xterm-fg-257 (0 of them readable in the panel's colour)
  panel's colour: 106 under 4.5 in 40 rows, 42 under 2, lowest 1.00 vscode-monokai-dimmed black #1e1e1e
  the rule: 0 under 4.5, lowest 4.50 vscode-monokai-dimmed yellow #b3b42b
  pairs no colour lifts to 4.5: none
dim, drawn at half: 784 pairs, 471 recoloured inline by xterm, 313 given xterm-fg-257 (244 of them readable in the panel's colour)
  panel's colour: 233 under 2.25 in 46 rows, 183 under 2, lowest 1.00 vscode-solarized-light bright-white #fdf6e3
  the rule: 216 under 2.25, lowest 1.27 tokyoneon red #ff007c
  pairs no colour lifts to 2.25: none
dim default text on the panel, half the ink: 5 of 49 rows under 2.25, lowest 1.88 vscode-solarized-light ink on panel #fdf6e3
```

The first two lines of each block are the tree as this round found it (the panel's colour) and the tree with the rule. The plain case is met: no pair under 4.5:1.

Open, for a ruling: dim. xterm measures dim text in its full colour against 2.25 and then draws a class colour at half, so a dim cell that passes the measure can be drawn under 2.25. The rule draws the ruled half of the ink, and 216 of the 784 dim pairs are drawn under 2.25:1 (233 with the panel's colour), the lowest 1.27:1. The five rows of the last line are the same arithmetic for ordinary dim text. The round asks for the dim form as it is built; drawing dim inverse text in the full ink would clear 2.25 for every pair and leave it not dim.

### The round's checks

`npm run diagrams` ran right before check 1 and changed no file further (six diagram files, 8 lines, as after the first run).

1. `npm run test:quick` (TMPDIR unset, one run): prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (`593 FILES 0 ERRORS 0 WARNINGS`), vitest checks and vitest slow `ok`; `FAILED  vitest (51.2 s)`, `Test Files  1 failed | 19 passed | 16 skipped (36)`, `Tests  1 failed | 206 passed | 148 skipped (355)`; `test:quick: 84.1 s; failed: vitest`. The one failure is `tests/server/machine/runs/schedules/commands.test.ts > reads a hand change of the commands file into the payload`, `Test timed out in 5000ms`: it waits for a file watcher to see a written file. The same test failed the same way in the first of the two runs before this round. `npx vitest run` of that file alone: `Test Files  1 passed (1)`, `Tests  3 passed (3)`. It reaches the step's files only through `sessions.ts` in its fixture, starts no terminal and no file this round changed is in its imports (`grid.css`, `grid-look.ts`, `tokens.css`, `vscode-map.ts`, `tokyo.css`).
2. `node utils/migrations/convert-vscode-themes.ts --check`, exit 1:

```
block vscode-light-modern differs
block vscode-light-plus differs
block vscode-light-visual-studio differs
block vscode-quiet-light differs
block vscode-dark-plus differs
block vscode-dark-visual-studio differs
block vscode-red differs
```

3. `ASCII_GATE`: `gate output bytes: 0 exit 0`; `LC_ALL=C grep -n '[^ -~]'` over the five source files prints nothing.
4. `sh utils/unused-exports.sh` against the base's list: no difference.

`git status --short` is the same before and after the checks. No test is added. The round's programs are `floor.mjs` (rewritten with the rows above) and `pairs.mjs`, at the end of this report.

## Open items of the state file

None when the brief was written.

## The rulings the step was built with

1. Ruling 1 of `O189-cases.md`: on macOS a value names UTF-8 only as `UTF-8` with the hyphen, in either case; on every other platform with or without it. A well-formed name of a locale the machine lacks is carried as set.
2. Ruling 2: the rule of `grid.css` is taken with its effect on inverse text with a truecolor background of its own; no private member of xterm is used.
3. Ruling 3: the rule leaves out `.xterm-cursor-block`, dim inverse text takes half the panel's colour, and a locale pair goes through `tmuxValue`.

## The cases' first run (unchanged tree)

| Case | Checked by | Result |
|---|---|---|
| 1-4 | `ls src/lib/data/places` (no locale file); `node .agents/scratch/case7.mjs $PWD`; `locale charmap` under each environment, below | No start carries a locale. Case 4 was wrong for `LANG=en_US.utf8` on macOS (ruling 1) |
| 5 | `sh .agents/scratch/case5.sh $PWD`, below | US-ASCII in each |
| 6 | `sh .agents/scratch/case6.sh $PWD none ...`, below | `pypython ../` |
| 7 | `node .agents/scratch/case7.mjs $PWD` | five vectors, none with a locale pair |
| 8-11 | `tokens.mjs` and `ansi.mjs`: `rows: 49 by number of the sixteen held: {"0":49}` | no block holds an `--ansi-*` token |
| 12 | `node .agents/scratch/case12.mjs $PWD` | `none` for each `uiTheme`; `no --ansi-yellow` for the four app themes |
| 13 | Reading `grid-look.ts`: `reflowLook` reads `gridLook()` on the frame after a theme change | look at landing |
| 14 | Reading: `terminal-marks.ts` gives yellow `--c-gold`; `decoration-colors.ts:41` gives `terminal.ansiYellow` `--c-gold-txt` | as the brief says; look at landing |
| 15 | `tokens.mjs` saved: 49 rows, 17469 token values | the base of the comparison |
| 16 | `node utils/migrations/convert-vscode-themes.ts --check`, exit 1, and a run in a scratch copy | the seven blocks of the brief; the copy differed in them and the version alone |
| 17 | Reading `gridOptions`: no `minimumContrastRatio`; `OptionsService.ts:42` of xterm defaults to 1 | not set |
| 18 | `node .agents/scratch/floor.mjs 1` and `4.5`, below | one sentence of item 3 was wrong (ruling 2) |

`env -i PATH=$PATH <variables> locale charmap`:

```
LANG=nl_BE.UTF-8 => UTF-8
LC_CTYPE=UTF-8 => UTF-8
LANG=C LC_CTYPE=UTF-8 => UTF-8
LC_ALL=C LANG=nl_BE.UTF-8 => US-ASCII
LC_CTYPE=C => US-ASCII
LC_ALL= LANG=nl_BE.UTF-8 => UTF-8
LC_ALL= LANG=en_US.UTF-8 => UTF-8
LC_CTYPE= LANG=en_US.UTF-8 => UTF-8
LANG= => US-ASCII
LANG=C => US-ASCII
LANG=en_US.utf8 => US-ASCII
LANG=C.utf8 => US-ASCII
LC_CTYPE=utf8 => US-ASCII
LANG=en_US.utf-8 => utf-8
LANG=C.UTF-8 => UTF-8
LANG=xx_YY.UTF-8 => US-ASCII
```

Case 5:

```
server [] process []: LANG=[] LC_ALL=[] LC_CTYPE=[] set:0 charmap=US-ASCII
server [] process [LANG=nl_BE.UTF-8]: LANG=[] LC_ALL=[] LC_CTYPE=[] set:0 charmap=US-ASCII
server [LC_ALL=C] process [LC_ALL=C]: LANG=[] LC_ALL=[C] LC_CTYPE=[] set:1 charmap=US-ASCII
server [LC_CTYPE=C] process [LC_CTYPE=C]: LANG=[] LC_ALL=[] LC_CTYPE=[C] set:1 charmap=US-ASCII
```

Case 6, the variables given as `-e` pairs:

```
[none] <U+203A> pypython ../
[LANG=en_US.UTF-8] <U+203A> python ../
[LANG=en_US.utf8] <U+203A> pypython ../
[LANG=en_US.UTF8] <U+203A> pypython ../
[LANG=C.utf8] <U+203A> pypython ../
[LC_CTYPE=utf8] <U+203A> pypython ../
[LANG=en_US.utf-8] <U+203A> python ../
[LC_CTYPE=utf-8] <U+203A> python ../
[LC_CTYPE=UTF-8] <U+203A> python ../
[LANG=C.UTF-8] <U+203A> python ../
```

Case 18, `floor.mjs 1` | `floor.mjs 4.5` (xterm 6.0.0's DOM renderer in jsdom, Dark Modern's panel and ink):

```
black text: class="xterm-fg-0" style=""                                    | class="" style="color:#878787;"
truecolor #303030: class="" style="color:#303030;"                         | class="" style="color:#868686;"
black on red: class="xterm-bg-1 xterm-fg-0" style=""                       | class="xterm-bg-1" style="color:#f0f0f0;"
inverse, default colours: class="xterm-bg-257 xterm-fg-257" style=""       | class="xterm-bg-257" style="color:#555555;"
inverse dim, default: class="xterm-dim xterm-bg-257 xterm-fg-257" style="" | class="xterm-dim xterm-bg-257" style="color:#848484;"
inverse, background red: class="xterm-bg-257 xterm-fg-1" style=""          | class="xterm-bg-257" style="color:#942323;"
inverse, truecolor bg #204080: class="xterm-bg-257" style="color:#204080;" | the same
inverse, truecolor bg #c8c8c8: class="xterm-bg-257" style="color:#c8c8c8;" | class="xterm-bg-257" style="color:#545454;"
inverse, foreground red: class="xterm-bg-1 xterm-fg-257" style=""          | class="xterm-bg-1" style="color:#f0f0f0;"
```

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| Item 1, the locale: `src/lib/data/places/terminal-locale.ts`, `startTerminal`, its comments | DONE | cases 1 to 7 |
| Item 1, the usage refresh session takes no pair | DONE | `machine/usage/refresh.ts` is unchanged (`git diff --stat`), and it calls `startArgs`, which adds no pair |
| Item 2, the sixteen tokens of 49 rows, `gridLook` reads them alone | DONE | cases 8 to 11; `grep -rn -e '--ansi-' src --include='*.ts' --include='*.svelte'`: `grid-look.ts:27-28` reads them, `vscode-map.ts:28,251` writes them, nothing else |
| Item 2, `mapTheme`, the converter, `vscode.css`, the head comments | DONE | cases 12 and 16 |
| Item 2, no other token changes; `vscode-rules.json` unchanged | DONE | case 15; `git diff --stat -- src/lib/themes/vscode-rules.json` prints nothing |
| Item 2, `colorToken` local | DONE | `grep -rn colorToken src`: `terminal-marks.ts:27,65,83` |
| Item 3, the floor and the inverse rule | DONE | cases 17 and 18; the drawn result is the look's |
| Verify list | DONE | below |

### The cases after the change

Cases 1 to 4, `node .agents/scratch/case1.mjs $PWD`:

```
{} darwin ["LANG=en_US.UTF-8"] linux ["LANG=C.UTF-8"]
{"LANG":"nl_BE.UTF-8"} darwin ["LANG=nl_BE.UTF-8"] linux ["LANG=nl_BE.UTF-8"]
{"LC_CTYPE":"UTF-8"} darwin ["LC_CTYPE=UTF-8"] linux ["LC_CTYPE=UTF-8"]
{"LANG":"C","LC_CTYPE":"UTF-8"} darwin ["LC_CTYPE=UTF-8","LANG=C"] linux ["LC_CTYPE=UTF-8","LANG=C"]
{"LC_ALL":"C","LANG":"nl_BE.UTF-8"} darwin ["LANG=en_US.UTF-8","LC_ALL="] linux ["LANG=C.UTF-8","LC_ALL="]
{"LC_CTYPE":"C"} darwin ["LANG=en_US.UTF-8","LC_CTYPE="] linux ["LANG=C.UTF-8","LC_CTYPE="]
{"LC_ALL":"","LANG":"nl_BE.UTF-8"} darwin ["LANG=nl_BE.UTF-8"] linux ["LANG=nl_BE.UTF-8"]
{"LANG":""} darwin ["LANG=en_US.UTF-8"] linux ["LANG=C.UTF-8"]
{"LANG":"C"} darwin ["LANG=en_US.UTF-8"] linux ["LANG=C.UTF-8"]
{"LANG":"en_US.utf8"} darwin ["LANG=en_US.UTF-8"] linux ["LANG=en_US.utf8"]
{"LANG":"C.utf8"} darwin ["LANG=en_US.UTF-8"] linux ["LANG=C.utf8"]
{"LANG":"en_US.utf-8"} darwin ["LANG=en_US.utf-8"] linux ["LANG=en_US.utf-8"]
{"LC_ALL":"en_US.utf8","LC_CTYPE":"UTF-8"} darwin ["LANG=en_US.UTF-8","LC_ALL=","LC_CTYPE="] linux ["LC_ALL=en_US.utf8","LC_CTYPE=UTF-8"]
{"LANG":"xx_YY.UTF-8"} darwin ["LANG=xx_YY.UTF-8"] linux ["LANG=xx_YY.UTF-8"]
{"LANG":"nl_BE.UTF-8@euro"} darwin ["LANG=nl_BE.UTF-8@euro"] linux ["LANG=nl_BE.UTF-8@euro"]
{"LANG":"en_US.ISO8859-1"} darwin ["LANG=en_US.UTF-8"] linux ["LANG=C.UTF-8"]
{"LC_ALL":"nl_BE.UTF-8","LC_CTYPE":"C","LANG":"C"} darwin ["LC_ALL=nl_BE.UTF-8","LC_CTYPE=C","LANG=C"] linux ["LC_ALL=nl_BE.UTF-8","LC_CTYPE=C","LANG=C"]
```

Case 5, `sh .agents/scratch/case5.sh $PWD`:

```
server [] process []: LANG=[en_US.UTF-8] LC_ALL=[] LC_CTYPE=[] set:1 charmap=UTF-8
server [] process [LANG=nl_BE.UTF-8]: LANG=[nl_BE.UTF-8] LC_ALL=[] LC_CTYPE=[] set:1 charmap=UTF-8
server [LC_ALL=C] process [LC_ALL=C]: LANG=[en_US.UTF-8] LC_ALL=[] LC_CTYPE=[] set:2 charmap=UTF-8
server [] process [LANG=en_US.utf8]: LANG=[en_US.UTF-8] LC_ALL=[] LC_CTYPE=[] set:1 charmap=UTF-8
server [LC_CTYPE=C] process [LC_CTYPE=C]: LANG=[en_US.UTF-8] LC_ALL=[] LC_CTYPE=[] set:2 charmap=UTF-8
server [] process [LC_CTYPE=UTF-8]: LANG=[] LC_ALL=[] LC_CTYPE=[UTF-8] set:1 charmap=UTF-8
```

Case 6, `sh .agents/scratch/case6b.sh $PWD`, zsh started through `startTerminal` under four environments of the process:

```
process [] <U+203A> python ../
process [LC_ALL=C] <U+203A> python ../
process [LANG=en_US.utf8] <U+203A> python ../
process [LANG=nl_BE.UTF-8] <U+203A> python ../
```

Case 7, `case7.mjs` after the change against its output on the unchanged tree: in each of the five vectors (shell, task, app, account, resumed) the one difference is `"-e","LANG=en_US.UTF-8"` inserted after the `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` pair; the account's `CLAUDE_CONFIG_DIR` pair, the git pairs, the task's `OCULUS_ARG_1` pair and everything after `--` are the same words.

Cases 8 to 11, `palettes.mjs` (each row's own block against its source: the brief's table, the theme file of `@shikijs/themes`, the brief's given palettes, the list of `var(...)`, the theme files of the installed VS Code):

```
49 rows, 0 differ; by source {"table light":6,"table dark":7,"VS Code theme file":6,"table hcDark":1,"table hcLight":1,"@shikijs/themes":18,"own hues":4,"given in the brief":6}
```

and the rows the cases name, `ansi.mjs`:

```
light [:root]: #000000 #cd3131 #107c10 #949800 #0451a5 #bc05bc #0598bc #555555 #666666 #f14c4c #14ce14 #b5ba00 #3b8eea #d670d6 #29b8db #a5a5a5
dark [dark]: #000000 #cd3131 #0dbc79 #e5e510 #2472c8 #bc3fbc #11a8cd #e5e5e5 #666666 #f14c4c #23d18b #f5f543 #3b8eea #d670d6 #29b8db #e5e5e5
vscode-dark-modern [vscode-dark-modern]: #000000 #cd3131 #0dbc79 #e5e510 #2472c8 #bc3fbc #11a8cd #e5e5e5 #666666 #f14c4c #23d18b #f5f543 #3b8eea #d670d6 #29b8db #e5e5e5
vscode-monokai [vscode-monokai]: #333333 #c4265e #86b42b #b3b42b #6a7ec8 #8c6bc8 #56adbc #e3e3dd #666666 #f92672 #a6e22e #e2e22e #819aff #ae81ff #66d9ef #f8f8f2
vscode-light-high-contrast [vscode-light-high-contrast]: #292929 #cd3131 #136c13 #949800 #0451a5 #bc05bc #0598bc #555555 #666666 #cd3131 #00bc00 #b5ba00 #0451a5 #bc05bc #0598bc #a5a5a5
synthwave [synthwave]: var(--muted) #fe4450 #72f1b8 #f3e70f #03edf9 #ff7edb #03edf9 var(--ink) var(--muted) #fe4450 #72f1b8 #fede5d #03edf9 #ff7edb #03edf9 var(--ink)
phosphoramber [phosphoramber]: var(--muted) var(--c-red) var(--c-green) var(--c-gold) var(--c-blue) var(--c-magenta) var(--c-cyan) var(--ink) var(--muted) var(--c-red) var(--c-green) var(--c-gold) var(--c-blue) var(--c-magenta) var(--c-cyan) var(--ink)
rows: 49 by number of the sixteen held: {"16":49}
```

Case 12, `case12.mjs`: with all sixteen keys each of the four `uiTheme`s holds its own sixteen, `#100000` to `#1f0000`; with none:

```
vs-dark none: #000000 #cd3131 #0dbc79 #e5e510 #2472c8 #bc3fbc #11a8cd #e5e5e5 #666666 #f14c4c #23d18b #f5f543 #3b8eea #d670d6 #29b8db #e5e5e5
vs none: #000000 #cd3131 #107c10 #949800 #0451a5 #bc05bc #0598bc #555555 #666666 #f14c4c #14ce14 #b5ba00 #3b8eea #d670d6 #29b8db #a5a5a5
hc-black none: #000000 #cd0000 #00cd00 #cdcd00 #0000ee #cd00cd #00cdcd #e5e5e5 #7f7f7f #ff0000 #00ff00 #ffff00 #5c5cff #ff00ff #00ffff #ffffff
hc-light none: #292929 #cd3131 #136c13 #949800 #0451a5 #bc05bc #0598bc #555555 #666666 #cd3131 #00bc00 #b5ba00 #0451a5 #bc05bc #0598bc #a5a5a5
app yellow #ff000080: --panel: #0a1520 --ansi-yellow: #850a10
app yellow #00000000: --panel: #0a1520 --ansi-yellow: #e5e510
app yellow red: --panel: #0a1520 --ansi-yellow: #e5e510
app yellow undefined: --panel: #0a1520 --ansi-yellow: #e5e510
```

Case 13: by reading, `gridLook` reads the tokens off the body on each look and `reflowLook` is untouched; look at landing.

Case 14: `node .agents/scratch/case14.mjs $PWD` prints `[ 'decorationProperty' ] [ '--c-gold-txt' ]`; the row `yellow: '--c-gold'` of `COLOR_TOKENS` is unchanged (`git diff -- src/lib/state`); look at landing.

Case 15, `case15.mjs` over the two dumps, the derived tokens included: `19726 values compared, 0 differ; 1568 values of --ansi-* tokens` (49 rows, sixteen own and sixteen resolved each; none derived). `git diff -U0 -- src/lib/themes/vscode.css | grep '^[+-]' | grep -v -- '--ansi-'` prints comment lines alone.

Case 16, `--check` is in the verify list below. `diff` of the committed `vscode.css` with the one a run wrote into `.agents/scratch/copy` (`19 themes of VS Code 1.145.2`): the version of the head, `--muted`, `--tab-inactive-txt` and the comments naming them in `vscode-light-modern`, `-light-plus`, `-light-visual-studio`, `-quiet-light`, `-dark-plus` and `-dark-visual-studio`, and `--titlebar-bg` in `vscode-red`. `vscode-rules.json` of the run differs in the version of `generated` alone.

Case 17: `gridOptions` sets `minimumContrastRatio: CONTRAST_FLOOR` (4.5); `applyLook` is not in the diff.

Case 18: `floor.mjs 4.5` prints the right column quoted under the first run, so xterm's part is as read: black text and `#303030` are lightened, black on red is measured against the red. The `xterm-bg-257` rules of `grid.css` match each `xterm-bg-257` span with no `xterm-fg-*` class and no `xterm-cursor-block`, which in that output are the inverse lines of default foreground. An inverse cell with a colour of its own and the default background is measured by xterm with the ink on that colour: where the ink fails xterm writes a colour inline (inverse red), and where it clears, the `xterm-fg-257` rules of `grid.css` draw the ink (inverse black, `#101010`, 236; "Repair round 1", item 5 and the round's case). Look at landing.

### The verify list, as printed

`npm run diagrams` ran right before each run of `test:quick`. `test:quick` ran twice.

1. `npm run test:quick` (TMPDIR unset). The first run failed one test, `tests/server/machine/runs/schedules/commands.test.ts > reads a hand change of the commands file into the payload`, with `Test timed out in 5000ms` (load average 12.10 right after); it watches a schedules file, imports no file the step changes but `sessions.ts` through its fixture's `stopTerminal`, and `npx vitest run` of that file alone passed its 3 tests, this one in 82 ms. After it the sentence of `tokens.css`'s head about the contrast test was made exact, and the second run, on the final tree, passed:

```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.4 s)
ok      svelte-check (8.2 s): 1795393424113 COMPLETED 593 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (51.0 s): Duration  39.16s (transform 42.54s, setup 0ms, import 107.89s, tests 39.41s, environment 162ms)
ok      vitest checks (82.6 s): Duration  71.06s (transform 25.41s, setup 0ms, import 48.69s, tests 156.38s, environment 5ms)
ok      vitest slow (83.6 s): Duration  72.18s (transform 19.61s, setup 0ms, import 66.18s, tests 217.35s, environment 5ms)
test:quick: 85.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

2. `npm run check`: `COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
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

4. `ASCII_GATE`: `gate output bytes: 0 exit 0`. `LC_ALL=C grep -n '[^ -~]'` over every file touched under `src`, `utils` and `docs` prints nothing.
5. `sh utils/unused-exports.sh`: `diff` with the base's list prints nothing, 336 lines in both. The step added no line and removed none (`colorToken` was used by the grid, so the base does not list it; `localeEnv` is imported by `sessions.ts`).

Guarded tests whose code the step changes: `npx vitest run tests/checks/look tests/server/desktop/platform-steps.test.ts tests/server/desktop/app-theme-start.test.ts` (G26, G85 and G118) on the final tree: `Test Files  3 passed (3)`, `Tests  79 passed (79)`.

The step adds or changes no test: `diff -rq` of `tests` with the base copy prints nothing. No assertion, allow list or predicate is edited.

## Files

From `diff -rq` of `config`, `src`, `tests` and `utils` with the base copy, and `git status` for `docs`; lines at base, lines now.

| File | Base | Now |
|---|---|---|
| `src/lib/data/places/terminal-locale.ts` (new, the folder now holds seven) | - | 40 |
| `src/lib/server/machine/pty/sessions.ts` | 837 | 844 |
| `src/lib/state/sessions/terminal/terminal-marks.ts` | 100 | 100 |
| `src/lib/themes/rice/catppuccin.css` | 240 | 310 |
| `src/lib/themes/rice/everforest.css` | 128 | 164 |
| `src/lib/themes/rice/flexoki.css` | 122 | 157 |
| `src/lib/themes/rice/gruvbox.css` | 122 | 157 |
| `src/lib/themes/rice/kanagawa.css` | 187 | 240 |
| `src/lib/themes/rice/phosphor.css` | 126 | 161 |
| `src/lib/themes/rice/rosepine.css` | 190 | 242 |
| `src/lib/themes/rice/singles.css` | 372 | 479 |
| `src/lib/themes/rice/tokyo.css` | 240 | 312 |
| `src/lib/themes/themes.css` | 116 | 134 |
| `src/lib/themes/tokens.css` | 353 | 376 |
| `src/lib/themes/vscode-map.ts` | 616 | 656 |
| `src/lib/themes/vscode.css` | 944 | 1261 |
| `src/lib/views/sessions/terminal/grid/grid-look.ts` | 217 | 235 |
| `src/lib/views/sessions/terminal/grid/grid.css` | 8 | 37 |
| `utils/migrations/convert-vscode-themes.ts` | 500 | 501 |
| `docs/diagrams/layers.dot`, `layers.svg` | two counts in each: server to data 676 to 677, views to state 1603 to 1602 | |
| `docs/diagrams/layer-server.dot`, `layer-server.svg` | one count in each: server/machine to data 217 to 218 | |
| `docs/diagrams/layer-views.dot`, `layer-views.svg` | one count in each: views/sessions to state 110 to 109 | |
| `.scratch/migration/agents/reviews/O189-report.md` | | |

Outside the brief's write list: the four files `layer-server` and `layer-views`, which `npm run diagrams` writes with the two it names (the import of the locale file and the grid's dropped import of `terminal-marks.ts` are counted there too, and `tests/checks/diagrams/diagrams.test.ts` fails on a stale one).

## Comments: still true or rewritten

| Place | State |
|---|---|
| `sessions.ts` head and `startTerminal`'s comment | rewritten |
| `grid-look.ts` head | still true; `ANSI`, `CONTRAST_FLOOR`, `gridLook` and `gridOptions` written or rewritten |
| `terminal-marks.ts` head, `colorToken` | still true; `COLOR_TOKENS` rewritten |
| `vscode-map.ts` head, `WORKBENCH` | rewritten; `mapTheme`'s comment still true |
| `tokens.css`, `themes.css`, the nine rice heads, `vscode.css`, the converter's head and `headOf` | rewritten |
| `grid.css` first comment | still true; the two comments of the inverse rules are written |
| `docs/HELP.md:258` ("A terminal starts with git's credential settings for the git hosts you signed in to.") | still true, and it does not name the locale; not written, as the brief says |
| `docs/apps.md:491` ("The page gets every custom property of oculus's `tokens.css`") | still true, now with the sixteen |
| `README.md` | names neither (`grep -n -i 'ansi\|locale\|LANG\b\|contrast' README.md` prints nothing) |

`grep -rn 'colorToken\|COLOR_TOKENS\|localeEnv\|terminal-locale' src tests utils docs README.md` (docs/diagrams left out): `sessions.ts:12,35,633,682`, `terminal-marks.ts:12,27,28,65,83`, `terminal-locale.ts:28`. No hit names the grid as a reader of `colorToken`.

The words of the history rule over the added lines (`git diff -U0 -- src utils | grep '^+' | grep -n -E -i '\b(before|used to|no longer|still|always|as before|previously|the step|after this|now|earlier|was|were)\b'`): `still read as what they are` (phosphor.css) and `the ones before it in place` (singles.css), both existing text rewrapped, a present state and a layout; `const before`, `registered.length - before`, `registered.splice(before` (code, the length ahead of the sixteen picks); `was picked as the nearest` (vscode.css, existing generated text); `were not picked for` (grid-look.ts, a palette drawn on a theme it was not chosen for); `was not measured` (grid.css, what xterm leaves out of its measure); `Before a theme is applied` (grid-look.ts, existing, the order at start). None compares with an earlier state of the code.

## Judgment calls, each reversible

1. `registered` gets the one phrase `the sixteen terminal colours (terminal.ansi*)` only when all sixteen come from registered defaults; a theme that sets some of the keys has each missing one named. No shipped theme is in that state.
2. The sixteen lines come last in a block, after the code hues, and ahead of the tokens of the converter's `ADDED`.
3. A one-line comment, "The sixteen terminal colours.", leads the sixteen in each hand-written block; the generated blocks carry none, like their other tokens.
4. `synthwave`'s four missing slots and the four palettes of own hues are `var(...)`, so they follow a later change of those tokens.
5. `LC_ALL`, `LC_CTYPE` and `LANG` are handed on in that order.
6. The sentence of `tokens.css`'s head about the contrast test now says the terminal's colours have no pair in it.

## Host- and user-visible changes

| What | Before | After |
|---|---|---|
| `env` in a new terminal, oculus's process with no locale | no `LANG` | `LANG=en_US.UTF-8` (macOS), `LANG=C.UTF-8` (elsewhere) |
| The same, process under `LANG=nl_BE.UTF-8` | no `LANG` | `LANG=nl_BE.UTF-8` |
| The same, process and tmux server under `LC_ALL=C` | `LC_ALL=C` | `LANG=en_US.UTF-8`, `LC_ALL=` empty |
| zsh with a prompt character outside ASCII, `python ../` and Tab | `pypython ../` | `python ../` |
| An ssh that forwards `LANG` and `LC_*` (`SendEnv LANG LC_*`) | sent no `LANG` | sends the `LANG` above; a host without that locale prints its usual locale warning. By reading; no ssh was run |
| A terminal running at the change | its environment | keeps it; a respawned pane keeps the pairs of its start. A new terminal has the locale |
| The sixteen colours, a VS Code theme or an app's theme | the interface hues of `tokens.css`, a colour and its bright twin one hue (Dark Modern's yellow `#a16207`) | the theme's own or VS Code's defaults (`#e5e510`, bright `#f5f543`) |
| The sixteen, Oculus Light and Dark | the interface hues | VS Code's light and dark defaults |
| The sixteen, a rice theme | the interface hues | its published palette; `phosphor`, `phosphoramber`, `tokyoneon`, `oxocarbon` as they were |
| Copy as HTML | text in the interface hues | text in the theme's terminal colours; the addon reads xterm's ANSI colours and no floor, so a colour the grid lightened is copied as the palette's own (`SerializeAddon.ts:565`, `:625`, by reading) |
| Text under 4.5:1 | as the program or the palette gave it | lightened or darkened to 4.5:1, dim text to half of it, measured in its full colour; a powerline, box or block glyph is never measured |
| Inverse text, default colours | the panel's colour on the ink | the same, by `grid.css` |
| Inverse text, background of its own, default text colour | in that background's colour on the ink | in the panel's colour on the ink where the floor recolours it, and always for a truecolor background (ruling 2) |
| Inverse glyph with a truecolor background (powerline U+E0B0, block U+2588 and the like under `ESC[7;48;2;200;0;0m`) | `#c80000` on the ink | the panel's colour on the ink (ruling 2; CSS cannot tell it from a cell the floor recoloured) |
| Dim inverse text with a truecolor background (`ESC[2;7;48;2;0;0;0m`) | `#000000` on the ink, undimmed | half the panel's colour on the ink (rulings 2 and 3) |
| Inverse text with its own foreground and the default background, where the ink fails the floor on that colour (`ESC[7;31m` in Dark Modern) | the panel's colour on red | the colour xterm writes, `#f0f0f0` on `#cd3131` |
| The same, where the ink clears the floor (`ESC[7;30m` in Dark Modern) | the panel's colour on the old black slot, `--muted` | the ink on black; dim, half the ink; a powerline, box or block glyph of such a cell too |
| An inverse cell on the default background under a find mark | the panel's colour on the mark | the ink on the mark, or the colour xterm writes where the ink fails on it |
| Bold text in one of the eight names (`ESC[1;34m`) | the same hue as plain, since a name and its bright twin were one | the bright twin's colour, in xterm as in VS Code (`drawBoldTextInBrightColors` on by default in both): bold blue takes `#3b8eea` in Dark Modern where blue text is `#4e8ed3` (after the floor); in Solarized (rice) bold blue is `#839496` and bold green `#586e75`, in One Dark bold red is `#be5046` and bold white `#5c6370`, all ahead of the floor |
| A terminal over a wallpaper | no floor | the floor is measured against the panel's colour, since the grid's background is that colour with no alpha, and never against the picture |
| The colours of the built CSS | - | the sheets hold six lower-case digits; vite 8.3.0's minifier (lightningcss, `min.mjs` below over `tokens.css`, `themes.css`, `vscode.css` and five rice sheets) writes 16, 16, 304, 48, 96, 64, 32 and 32 declarations, the same colours, some shortened (`#000000` to `#000`) and one as a name, Dark High Contrast's bright red `#ff0000` to `red`. xterm reads a three-digit hex itself and a name through its canvas (`Color.ts:151-206`, by reading); no build was run |
| An app's page | every custom property of `tokens.css` | the sixteen too |

Sharp edges, none inside what the brief lets the step change:

- A tmux server that holds a non-UTF-8 `LC_ALL` or `LC_CTYPE` which oculus's own process does not set wins over the `LANG` given: `server LC_ALL=C, process none: LANG=[en_US.UTF-8] LC_ALL=[C] LC_CTYPE=[] set:2 charmap=US-ASCII`. The brief empties only what the process sets. It takes a tmux server started under another environment than oculus's.
- `LANG=xx_YY.UTF-8`, a locale the machine lacks, is carried as set and gives US-ASCII (ruling 1).
- The colours of the six VS Code themes with keys of their own were read from the files of 1.145.2, while the head of `vscode.css` names 1.137.0 for the blocks; the head says the defaults' version. A later run of the converter moves the seven blocks of case 16.

## The look at landing

| Case | View and state | What should be seen |
|---|---|---|
| 13 | a terminal running `for i in {0..15}; do print -P "%F{$i}colour $i%f"; done`, then the theme changed to Monokai, Phosphor Amber and Oculus Light | the lines already drawn take the new theme's sixteen; in Monokai yellow `#b3b42b`, bright yellow `#e2e22e` |
| 14 | a terminal's menu, Change Color, yellow; an app's file decoration with `terminal.ansiYellow` | the mark and the menu in the interface's gold, as on the base; the decoration as on the base |
| 18 | Dark Modern: `printf '\e[30mblack\e[0m \e[38;2;48;48;48mgrey\e[0m \e[30;41mon red\e[0m \e[7minverse\e[0m \e[2;7mdim inverse\e[0m \e[7;48;2;32;64;128mown\e[0m\n'`, then a wallpaper on | black and grey readable, text on red light, the three inverse words in the panel's colour on the ink, the dim one at half; the block cursor still blinks with its own colours; the terminal over the wallpaper is drawn |
| 18, inverse colours | Dark Modern, then Dark High Contrast: `printf '\e[7;30mblack\e[0m \e[7;31mred\e[0m \e[7;38;2;16;16;16mtruecolor\e[0m \e[7;38;5;236m236\e[0m \e[2;7;30mdim black\e[0m \e[2;7;31mdim red\e[0m \e[7;30m\342\226\210\342\226\210\e[0m\n'` | Dark Modern: black, truecolor, 236 and the block in the ink on their colour, dim black and dim red at half the ink, red in `#f0f0f0`; Dark High Contrast: black readable in the ink on black |
| 18, glyphs and dim on a truecolor background | Dark Modern: `printf '\e[7;48;2;200;0;0m\342\226\210 text\e[0m \e[2;7;48;2;0;0;0mdim\e[0m\n'` | the block and the text in the panel's colour on the ink, the dim word at half the panel's colour on the ink |
| 18, bold | Dark Modern, Solarized (rice) and One Dark: `printf '\e[34mblue\e[0m \e[1;34mbold blue\e[0m \e[31mred\e[0m \e[1;31mbold red\e[0m \e[32mgreen\e[0m \e[1;32mbold green\e[0m\n'` | each bold word in the bright twin's colour, as VS Code draws it; in Solarized bold blue and bold green grey, at 4.5:1 |
| 8, the built CSS | a built page in Dark High Contrast: `print -P '%F{9}bright red%f'` | bright red `#ff0000`, whose token the build writes as `red` |

## Anything in the brief that was wrong or impossible

1. Case 4, `LANG=en_US.utf8` on macOS: ruling 1.
2. Item 3's sentence that inverse text with its own background is recoloured only "where the floor recolours it": ruling 2.
3. "Paths this step writes" names `layers.dot` and `layers.svg` of the diagrams; `npm run diagrams` writes `layer-server` and `layer-views` too.
4. The rule that a program making temporary folders runs with `TMPDIR` in the worktree does not fit the tests with a private tmux server: `.agents/scratch/tmp` is 85 bytes long here, the socket path passes the length a Unix socket takes, and those tests time out. They were run with `TMPDIR` unset, as `test:quick` is: `tests/server/machine/pty` and `tests/routes/sessions/website.test.ts`, 112 passed; `terminals-tmux`, `hooks-server`, `keys` and `window-guard`, 64 passed.

## Programs

Under `.agents/scratch/`, removed before this report; each prints only. No edit to a file of the diff was made by a program; `npm run diagrams` wrote the diagrams. Three more (`heads.py`, `wrap.py`, `want.py`) printed wrapped comment text and the sixteen lines to type.

`tokens.mjs <root>`:

```js
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
const root = process.argv[2];
const { parseBlocks, resolveTheme } = await import(`${root}/src/lib/themes/parse.ts`);
const { deriveTokens } = await import(`${root}/src/lib/themes/derive.ts`);
const dir = `${root}/src/lib/themes`;
const sheet = (name) => readFileSync(`${dir}/${name}`, 'utf8');
const css = ['tokens.css', 'themes.css', ...readdirSync(`${dir}/rice`).sort().map((n) => `rice/${n}`), 'vscode.css'].map(sheet).join('\n');
const blocks = parseBlocks(css);
const rows = parse(readFileSync(`${root}/config/defaults/appearance.yml`, 'utf8')).themes;
const out = {};
for (const row of rows) {
    const cls = row.class.split(/\s+/).filter((one) => one !== '' && one !== 'rice');
    if (cls.length > 1) throw new Error(`two palette classes: ${row.class}`);
    const block = cls[0] ?? ':root';
    if (!(block in blocks)) throw new Error(`no block ${block}`);
    const theme = resolveTheme(blocks, row.class);
    out[row.name] = { block, own: blocks[block], theme, derived: deriveTokens(theme) };
}
console.log(JSON.stringify(out));
```

`ansi.mjs <dump>`:

```js
import { readFileSync } from 'node:fs';
const dump = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const N = ['black','red','green','yellow','blue','magenta','cyan','white'];
const names = [...N.map((n) => `--ansi-${n}`), ...N.map((n) => `--ansi-bright-${n}`)];
const counts = {};
for (const [name, row] of Object.entries(dump)) {
    const held = names.filter((n) => n in row.own);
    (counts[held.length] ??= []).push(name);
    if (held.length) console.log(`${name} [${row.block}]: ${names.map((n) => row.own[n] ?? '-').join(' ')}`);
}
console.log('rows:', Object.keys(dump).length, 'by number of the sixteen held:', JSON.stringify(Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v.length]))));
```

`palettes.mjs <dump> <brief>`:

```js
import { readFileSync } from 'node:fs';
const dump = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const brief = readFileSync(process.argv[3], 'utf8');
const N = ['black','red','green','yellow','blue','magenta','cyan','white'];
const tokens = [...N.map((n) => `--ansi-${n}`), ...N.map((n) => `--ansi-bright-${n}`)];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const keys = [...N.map((n) => `terminal.ansi${cap(n)}`), ...N.map((n) => `terminal.ansiBright${cap(n)}`)];
const column = (at) => keys.map((k) => new RegExp(`\\| ${k.replace('.', '\\.')} \\|(.*)\\|`).exec(brief)[1].split('|')[at].trim().toLowerCase());
const shiki = { mocha: 'catppuccin-mocha', macchiato: 'catppuccin-macchiato', frappe: 'catppuccin-frappe', latte: 'catppuccin-latte', gruvbox: 'gruvbox-dark-hard', gruvboxlight: 'gruvbox-light-hard', nord: 'nord', rosepine: 'rose-pine', rosepinemoon: 'rose-pine-moon', rosepinedawn: 'rose-pine-dawn', everforest: 'everforest-dark', everforestlight: 'everforest-light', dracula: 'dracula', kanagawa: 'kanagawa-wave', kanagawadragon: 'kanagawa-dragon', kanagawalotus: 'kanagawa-lotus', solarized: 'solarized-dark', synthwave: 'synthwave-84' };
const vars = ['--muted','--c-red','--c-green','--c-gold','--c-blue','--c-magenta','--c-cyan','--ink'].map((t) => `var(${t})`);
const own16 = [...vars, ...vars];
const code = '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions';
const hasAnsi = { 'vscode-abyss': 'theme-abyss/themes/abyss-color-theme.json', 'vscode-monokai': 'theme-monokai/themes/monokai-color-theme.json', 'vscode-monokai-dimmed': 'theme-monokai-dimmed/themes/dimmed-monokai-color-theme.json', 'vscode-solarized-dark': 'theme-solarized-dark/themes/solarized-dark-color-theme.json', 'vscode-solarized-light': 'theme-solarized-light/themes/solarized-light-color-theme.json', 'vscode-tomorrow-night-blue': 'theme-tomorrow-night-blue/themes/tomorrow-night-blue-color-theme.json' };
const light = ['light-2026','light-modern','light-plus','light-visual-studio','quiet-light'].map((n) => `vscode-${n}`);
const counts = {};
let bad = 0;
for (const [name, row] of Object.entries(dump)) {
    let want, source;
    if (name === 'light') [want, source] = [column(1), 'table light'];
    else if (name === 'dark') [want, source] = [column(0), 'table dark'];
    else if (name in hasAnsi) {
        const raw = readFileSync(`${code}/${hasAnsi[name]}`, 'utf8');
        want = keys.map((k) => new RegExp(`"${k.replace('.', '\\.')}"\\s*:\\s*"([^"]+)"`).exec(raw)[1].toLowerCase());
        want = want.map((h) => (h.length === 4 ? `#${h.slice(1).replace(/./g, '$&$&')}` : h));
        source = 'VS Code theme file';
    } else if (name === 'vscode-dark-high-contrast') [want, source] = [column(2), 'table hcDark'];
    else if (name === 'vscode-light-high-contrast') [want, source] = [column(3), 'table hcLight'];
    else if (light.includes(name)) [want, source] = [column(1), 'table light'];
    else if (name.startsWith('vscode-')) [want, source] = [column(0), 'table dark'];
    else if (name in shiki) {
        const { default: theme } = await import(`@shikijs/themes/${shiki[name]}`);
        want = keys.map((k, i) => theme.colors[k]?.toLowerCase() ?? own16[i]);
        source = '@shikijs/themes';
    } else if (['phosphor','phosphoramber','tokyoneon','oxocarbon'].includes(name)) [want, source] = [own16, 'own hues'];
    else {
        const line = new RegExp(`^- \`${name}\`, from (.*)$`, 'm').exec(brief)[1];
        want = line.slice(line.indexOf(': #')).match(/#[0-9a-f]{6}/g);
        if (want.length === 8) want = [...want, ...want];
        source = 'given in the brief';
    }
    const have = tokens.map((t) => row.own[t]);
    const off = tokens.filter((t, i) => have[i] !== want[i]);
    if (want.length !== 16 || off.length > 0) { bad += 1; console.log('DIFFERS', name, source, off.join(' ')); }
    counts[source] = (counts[source] ?? 0) + 1;
}
console.log(`${Object.keys(dump).length} rows, ${bad} differ; by source ${JSON.stringify(counts)}`);
```

`case15.mjs <dump> <dump>`:

```js
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2, 4).map((f) => JSON.parse(readFileSync(f, 'utf8')));
let seen = 0, off = 0, ansi = 0;
for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    for (const part of ['own', 'theme', 'derived']) {
        const [x, y] = [a[name]?.[part] ?? {}, b[name]?.[part] ?? {}];
        for (const t of new Set([...Object.keys(x), ...Object.keys(y)])) {
            if (/^--ansi-/.test(t)) { ansi += 1; if (part === 'derived') { off += 1; console.log('derived', t); } continue; }
            seen += 1;
            if (x[t] !== y[t]) { off += 1; console.log(name, part, t, x[t], y[t]); }
        }
    }
}
console.log(`${seen} values compared, ${off} differ; ${ansi} values of --ansi-* tokens`);
```

`case1.mjs <root>`:

```js
const { localeEnv } = await import(`${process.argv[2]}/src/lib/data/places/terminal-locale.ts`);
for (const env of [
    {}, { LANG: 'nl_BE.UTF-8' }, { LC_CTYPE: 'UTF-8' }, { LANG: 'C', LC_CTYPE: 'UTF-8' },
    { LC_ALL: 'C', LANG: 'nl_BE.UTF-8' }, { LC_CTYPE: 'C' }, { LC_ALL: '', LANG: 'nl_BE.UTF-8' },
    { LANG: '' }, { LANG: 'C' }, { LANG: 'en_US.utf8' }, { LANG: 'C.utf8' }, { LANG: 'en_US.utf-8' },
    { LC_ALL: 'en_US.utf8', LC_CTYPE: 'UTF-8' }, { LANG: 'xx_YY.UTF-8' }, { LANG: 'nl_BE.UTF-8@euro' },
    { LANG: 'en_US.ISO8859-1' }, { LC_ALL: 'nl_BE.UTF-8', LC_CTYPE: 'C', LANG: 'C' }
]) console.log(JSON.stringify(env), 'darwin', JSON.stringify(localeEnv(env, 'darwin')), 'linux', JSON.stringify(localeEnv(env, 'linux')));
```

`case5.mjs <root> <socket> <answer file>`:

```js
import { readFileSync, existsSync, rmSync } from 'node:fs';
const [, , root, socket, out] = process.argv;
const { startTerminal, stopTerminal } = await import(`${root}/src/lib/server/machine/pty/sessions.ts`);
rmSync(out, { force: true });
const command = `printf 'LANG=[%s] LC_ALL=[%s] LC_CTYPE=[%s] set:%s charmap=%s' "$LANG" "$LC_ALL" "$LC_CTYPE" "$(env | grep -cE '^(LANG|LC_)')" "$(locale charmap)" > ${out}.part; mv ${out}.part ${out}; sleep 30`;
const started = await startTerminal(
    { kind: 'shell', cwd: root, cols: 80, rows: 24 },
    { socket, command, credentials: { env: () => [] } }
);
const end = Date.now() + 8000;
while (!existsSync(out) && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
console.log(existsSync(out) ? readFileSync(out, 'utf8') : 'no answer');
await stopTerminal(started.id, { socket });
```

`case5.sh <root>` (the server of the sharp edge above is the same with `one "LC_ALL=C" ""`):

```sh
cd "$1"; S=$1/.agents/scratch
one() { # server env, process env
    sock=$S/s.sock
    env -i PATH="$PATH" HOME="$HOME" $1 tmux -S "$sock" -f /dev/null new-session -d -s keep 'sleep 120'
    echo "server [$1] process [$2]: $(env -i PATH="$PATH" HOME="$HOME" SHELL=/bin/zsh $2 node "$S/case5.mjs" "$PWD" "$sock" "$S/answer.txt" 2>&1)"
    tmux -S "$sock" kill-server; rm -f "$sock"
}
one "" ""
one "" "LANG=nl_BE.UTF-8"
one "LC_ALL=C" "LC_ALL=C"
one "" "LANG=en_US.utf8"
one "LC_CTYPE=C" "LC_CTYPE=C"
one "" "LC_CTYPE=UTF-8"
```

`case6.sh <root> <variables>...` (first run) and `case6b.sh <root>` with `case6b.mjs` (after the change):

```sh
cd "$1"; shift; S=$PWD/.agents/scratch; sock=$S/z.sock
mkdir -p $S/z/in $S/z/other;
for vars in "$@"; do
    env -i PATH="$PATH" HOME="$S" tmux -u -S "$sock" -f /dev/null new-session -d -s keep 'sleep 60'
    set --; [ "$vars" = none ] || for v in $vars; do set -- "$@" -e "$v"; done
    tmux -u -S "$sock" new-session -d -s t -x 80 -y 24 -c $S/z/in "$@" -- env PROMPT="$(printf '\342\200\272 ')" /bin/zsh -f -i
    sleep 1
    tmux -u -S "$sock" send-keys -t t -l "PROMPT=\$'\\xe2\\x80\\xba '"; tmux -u -S "$sock" send-keys -t t Enter
    tmux -u -S "$sock" send-keys -t t -l 'autoload -U compinit; compinit -D; clear'; tmux -u -S "$sock" send-keys -t t Enter
    sleep 1.5
    tmux -u -S "$sock" send-keys -t t -l 'python ../'; sleep 0.3; tmux -u -S "$sock" send-keys -t t Tab; sleep 1.2
    echo "[$vars] $(tmux -u -S "$sock" capture-pane -p -t t | grep python | LC_ALL=C perl -pe 's/\xe2\x80\xba/<U+203A>/g')"
    tmux -u -S "$sock" kill-server; rm -f "$sock"
done
```

```sh
cd "$1"; S=$PWD/.agents/scratch; sock=$S/z.sock; mkdir -p $S/z/in $S/z/other
for vars in "" "LC_ALL=C" "LANG=en_US.utf8" "LANG=nl_BE.UTF-8"; do
    env -i PATH="$PATH" HOME="$S" tmux -u -S "$sock" -f /dev/null new-session -d -s keep 'sleep 60'
    t=$(env -i PATH="$PATH" HOME="$HOME" SHELL=/bin/zsh $vars node $S/case6b.mjs "$PWD" "$sock")
    sleep 1
    tmux -u -S "$sock" send-keys -t $t -l "PROMPT=\$'\\xe2\\x80\\xba '"; tmux -u -S "$sock" send-keys -t $t Enter
    tmux -u -S "$sock" send-keys -t $t -l 'autoload -U compinit; compinit -D; clear'; tmux -u -S "$sock" send-keys -t $t Enter
    sleep 1.5
    tmux -u -S "$sock" send-keys -t $t -l 'python ../'; sleep 0.3; tmux -u -S "$sock" send-keys -t $t Tab; sleep 1.2
    echo "process [$vars] $(tmux -u -S "$sock" capture-pane -p -t $t | grep python | LC_ALL=C perl -pe 's/\xe2\x80\xba/<U+203A>/g')"
    tmux -u -S "$sock" kill-server; rm -f "$sock"
done
```

```js
const [, , root, socket] = process.argv;
const { startTerminal } = await import(`${root}/src/lib/server/machine/pty/sessions.ts`);
const started = await startTerminal({ kind: 'shell', cwd: `${root}/.agents/scratch/z/in`, cols: 80, rows: 24 }, { socket, argv: ['/bin/zsh', '-f', '-i'], credentials: { env: () => [] } });
console.log(`oculus-${started.id}`);
```

`case7.mjs <root>`:

```js
const root = process.argv[2];
const { startTerminal } = await import(`${root}/src/lib/server/machine/pty/sessions.ts`);
const credentials = { env: () => ['GIT_CONFIG_COUNT=1', 'GIT_CONFIG_KEY_0=credential.https://example.org.helper', 'GIT_CONFIG_VALUE_0=x'] };
const base = { cwd: '/', cols: 80, rows: 24 };
const chain = [{ name: 'build', cwd: '/' }];
const starts = {
    shell: [{ ...base, id: '000001-shell', kind: 'shell' }, { command: 'cat' }],
    task: [{ ...base, id: '000002-shell', kind: 'shell' }, { command: 'make "$OCULUS_ARG_1"', task: { repo: '/', name: 'build', source: 'oculus', token: 't', chain }, taskEnv: { OCULUS_ARG_1: 'v;' } }],
    app: [{ ...base, id: '000003-app', kind: 'app', app: 'demo' }, { argv: ['run', 'x'] }],
    account: [{ ...base, id: '000004-claude', kind: 'claude', env: { CLAUDE_CONFIG_DIR: '/accounts/a' } }, { argv: ['claude', 'hi'] }],
    resumed: [{ ...base, id: '000005-claude', kind: 'claude', resume: { tool: 'claude', id: '00000000-0000-0000-0000-000000000000' } }, { programs: { claude: 'claude', codex: 'codex' } }]
};
for (const [name, [request, options]] of Object.entries(starts)) {
    const calls = [];
    await startTerminal(request, { ...options, credentials, run: async (args) => (calls.push(args), '') }).catch(() => {});
    console.log(`${name}: ${JSON.stringify(calls[0])}`);
}
```

`case12.mjs <root>`:

```js
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const map = await import(`${root}/src/lib/themes/vscode-map.ts`);
const read = (n) => readFileSync(`${root}/src/lib/themes/${n}.css`, 'utf8');
const sheets = { tokens: read('tokens'), themes: read('themes') };
const context = { git: map.GIT_DEFAULTS, bases: map.basesOf(sheets.tokens, sheets.themes) };
const names = ['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White'];
const keys = [...names.map((n) => `terminal.ansi${n}`), ...names.map((n) => `terminal.ansiBright${n}`)];
const all = Object.fromEntries(keys.map((k, i) => [k, `#${(i + 16).toString(16)}0000`]));
const ansi = (entries) => entries.filter(([n]) => n.startsWith('--ansi-')).map(([, v]) => v).join(' ') || 'none';
for (const ui of ['vs-dark', 'vs', 'hc-black', 'hc-light']) {
    console.log(`${ui} all: ${ansi(map.mapTheme({ colors: all, tokenColors: [] }, ui, context).entries)}`);
    console.log(`${ui} none: ${ansi(map.mapTheme({ colors: {}, tokenColors: [] }, ui, context).entries)}`);
}
for (const yellow of ['#ff000080', '#00000000', 'red', undefined]) {
    const colors = { 'editor.background': '#0a1520', ...(yellow && { 'terminal.ansiYellow': yellow }) };
    const { css } = map.themeSheet({ colors, tokenColors: [] }, 'vs-dark', sheets, 'app-x');
    console.log(`app yellow ${yellow}: ${/--panel: [^;]+/.exec(css)?.[0]} ${/--ansi-yellow: [^;]+/.exec(css)?.[0] ?? 'no --ansi-yellow'}`);
}
```

`case14.mjs <root>`:

```js
const root = process.argv[2];
const deco = await import(`${root}/src/lib/data/helpers/files/apps/tools/decoration-colors.ts`);
console.log(Object.keys(deco), Object.values(deco).filter((f) => typeof f === 'function').map((f) => f('terminal.ansiYellow')));
```

`floor.mjs <ratio>` (the powerline glyph is the character U+E0B0 in the program):

```js
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
const dom = new JSDOM('<body><div id="t" data-terminal></div></body>', { pretendToBeVisual: true });
const w = dom.window;
w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
w.IntersectionObserver = class { constructor(f) { this.f = f; } observe() { this.f([{ isIntersecting: true, intersectionRatio: 1 }]); } disconnect() {} };
w.ResizeObserver = class { observe() {} disconnect() {} };
Object.defineProperty(w.HTMLElement.prototype, 'offsetWidth', { get() { return 8 * Math.max(1, this.textContent.length); } });
Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { get() { return 16; } });
w.HTMLElement.prototype.getBoundingClientRect = function () { return { width: 8 * Math.max(1, this.textContent.length), height: 16, top: 0, left: 0, right: 0, bottom: 0 }; };
w.HTMLCanvasElement.prototype.getContext = () => null;
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver', 'getComputedStyle', 'IntersectionObserver', 'ResizeObserver', 'Event', 'KeyboardEvent', 'MouseEvent'])
    Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true, writable: true });
globalThis.self = w;
const { Terminal } = createRequire(import.meta.url)('@xterm/xterm');
const term = new Terminal({ cols: 60, rows: 14, allowProposedApi: true, minimumContrastRatio: Number(process.argv[2]),
    theme: { background: '#1f1f1f00', foreground: '#cccccc', black: '#000000', red: '#cd3131' } });
term.open(w.document.getElementById('t'));
const lines = [
    ['black text', '\x1b[30mX'], ['truecolor #303030', '\x1b[38;2;48;48;48mX'],
    ['black on red', '\x1b[30;41mX'], ['inverse, default colours', '\x1b[7mX'],
    ['inverse dim, default colours', '\x1b[2;7mX'], ['inverse, background red', '\x1b[7;41mX'],
    ['inverse, truecolor background #204080', '\x1b[7;48;2;32;64;128mX'],
    ['inverse, truecolor background #c8c8c8', '\x1b[7;48;2;200;200;200mX'],
    ['inverse, foreground red', '\x1b[7;31mX'], ['powerline glyph inverse', '\x1b[7m<U+E0B0>'], ['plain', 'X']
];
await new Promise((r) => term.write(lines.map(([, s]) => `${s}\x1b[0m`).join('\r\n'), r));
await new Promise((r) => setTimeout(r, 300));
const rows = [...w.document.querySelectorAll('.xterm-rows > div')];
lines.forEach(([name], i) => {
    const span = rows[i]?.querySelector('span');
    console.log(`${name}: class="${span?.className ?? ''}" style="${span?.getAttribute('style') ?? ''}"`);
});
process.exit(0);
```

`min.mjs`:

```js
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.resolve('vite'));
const { transform } = require('lightningcss');
for (const f of ['tokens.css', 'themes.css', 'vscode.css', 'rice/kanagawa.css', 'rice/singles.css', 'rice/tokyo.css', 'rice/phosphor.css', 'rice/flexoki.css']) {
    const raw = readFileSync(`src/lib/themes/${f}`, 'utf8');
    const out = transform({ filename: f, code: Buffer.from(raw), minify: true }).code.toString();
    const pick = (s) => [...s.matchAll(/(--ansi-[a-z-]+):\s*([^;}]+)/g)].map((m) => `${m[1]}:${m[2]}`);
    const [a, b] = [pick(raw.replace(/\/\*[\s\S]*?\*\//g, '')), pick(out)];
    const off = new Set(a.map((x, i) => (x === b[i] ? null : `${x} -> ${b[i]}`)).filter(Boolean));
    console.log(f, a.length, b.length, 'changed:', [...off].join(' | ') || 'none');
}
```

`floor.mjs <ratio>` of repair round 1: the program above with 20 rows in place of 14, the theme `{ background: '#1f1f1f00', foreground: '#cccccc', ...ansi }` and these two lists (`<U+2588>` and `<U+E0B0>` stand for the escapes of those characters in the program):

```js
const ansi = { black: '#000000', red: '#cd3131', green: '#0dbc79', yellow: '#e5e510', blue: '#2472c8', magenta: '#bc3fbc', cyan: '#11a8cd', white: '#e5e5e5', brightBlack: '#666666', brightRed: '#f14c4c', brightGreen: '#23d18b', brightYellow: '#f5f543', brightBlue: '#3b8eea', brightMagenta: '#d670d6', brightCyan: '#29b8db', brightWhite: '#e5e5e5' };
const lines = [
    ['inverse black', '\x1b[7;30mX'], ['inverse red', '\x1b[7;31mX'],
    ['inverse truecolor foreground #101010', '\x1b[7;38;2;16;16;16mX'],
    ['inverse 256-colour 236', '\x1b[7;38;5;236mX'],
    ['dim inverse black', '\x1b[2;7;30mX'], ['dim inverse red', '\x1b[2;7;31mX'],
    ['block glyph, inverse black', '\x1b[7;30m<U+2588>'],
    ['powerline glyph, inverse, truecolor background #c80000', '\x1b[7;48;2;200;0;0m<U+E0B0>'],
    ['block glyph, inverse, truecolor background #c80000', '\x1b[7;48;2;200;0;0m<U+2588>'],
    ['dim inverse, truecolor background #000000', '\x1b[2;7;48;2;0;0;0mX'],
    ['inverse, default colours', '\x1b[7mX'], ['inverse dim, default colours', '\x1b[2;7mX'],
    ['blue', '\x1b[34mX'], ['bold blue', '\x1b[1;34mX'], ['bold red', '\x1b[1;31mX']
];
```

`pairs.mjs <root>` of repair round 1:

```js
import { readFileSync, readdirSync } from 'node:fs';
import { transformWithOxc } from 'vite';
import { parse } from 'yaml';
const root = process.argv[2];
const path = `${root}/node_modules/@xterm/xterm/src/common/Color.ts`;
const { code } = await transformWithOxc(readFileSync(path, 'utf8'), path);
const { rgba, rgb, contrastRatio } = await import(`data:text/javascript,${encodeURIComponent(code)}`);
const { parseBlocks, resolveTheme } = await import(`${root}/src/lib/themes/parse.ts`);
const dir = `${root}/src/lib/themes`;
const sheet = (name) => readFileSync(`${dir}/${name}`, 'utf8');
const blocks = parseBlocks(['tokens.css', 'themes.css', ...readdirSync(`${dir}/rice`).sort().map((n) => `rice/${n}`), 'vscode.css'].map(sheet).join('\n'));
const N = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const names = [...N, ...N.map((n) => `bright-${n}`)];
const read = (theme, value) => {
    const inner = /^var\((--[a-z-]+)\)$/.exec(value)?.[1];
    if (inner) return read(theme, theme[inner]);
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)[1];
    return (parseInt(hex.length === 3 ? hex.replace(/./g, '$&$&') : hex, 16) * 256 + 255) >>> 0;
};
const lum = (n) => rgb.relativeLuminance(n >> 8);
const on = (a, b) => contrastRatio(lum(a), lum(b));
const hex = (n) => `#${(n >>> 8).toString(16).padStart(6, '0')}`;
const half = (bg, fg) => rgba.blend(bg, (((fg >>> 8) << 8) | 0x80) >>> 0);
function survey(floor, dim) {
    const out = { pairs: 0, inline: 0, class257: 0, panel: [], ink: [], inlineLow: [], changed: 0, panelReadable: 0 };
    for (const row of parse(readFileSync(`${root}/config/defaults/appearance.yml`, 'utf8')).themes) {
        const theme = resolveTheme(blocks, row.class);
        const [ink, panel] = [read(theme, theme['--ink']), read(theme, theme['--panel'])];
        for (const name of names) {
            const colour = read(theme, theme[`--ansi-${name}`]);
            out.pairs += 1;
            const adjusted = rgba.ensureContrastRatio(colour, ink, floor);
            const tag = { row: row.name, name, colour: hex(colour) };
            if (adjusted !== undefined) {
                out.inline += 1;
                const ratio = on(adjusted, colour);
                out.panel.push({ ...tag, ratio });
                out.ink.push({ ...tag, ratio });
                if (ratio < floor) out.inlineLow.push({ ...tag, ratio });
                continue;
            }
            out.class257 += 1;
            const [p, i] = dim ? [half(colour, panel), half(colour, ink)] : [panel, ink];
            out.panel.push({ ...tag, ratio: on(p, colour), panel: true });
            out.ink.push({ ...tag, ratio: on(i, colour) });
            if (on(panel, colour) >= floor) out.panelReadable += 1;
        }
    }
    return out;
}
const plainDim = parse(readFileSync(`${root}/config/defaults/appearance.yml`, 'utf8')).themes.map((row) => {
    const theme = resolveTheme(blocks, row.class);
    const [ink, panel] = [read(theme, theme['--ink']), read(theme, theme['--panel'])];
    return { row: row.name, name: 'ink on panel', colour: hex(panel), ratio: on(half(panel, ink), panel) };
});
const low = (list) => list.reduce((a, b) => (b.ratio < a.ratio ? b : a));
const say = (one) => `${one.ratio.toFixed(2)} ${one.row} ${one.name} ${one.colour}`;
for (const [label, floor, dim] of [['plain', 4.5, false], ['dim, drawn at half', 2.25, true]]) {
    const s = survey(floor, dim);
    const under = (list) => list.filter((one) => one.ratio < floor);
    console.log(`${label}: ${s.pairs} pairs, ${s.inline} recoloured inline by xterm, ${s.class257} given xterm-fg-257 (${s.panelReadable} of them readable in the panel's colour)`);
    console.log(`  panel's colour: ${under(s.panel).length} under ${floor} in ${new Set(under(s.panel).map((o) => o.row)).size} rows, ${s.panel.filter((o) => o.ratio < 2).length} under 2, lowest ${say(low(s.panel))}`);
    console.log(`  the rule: ${under(s.ink).length} under ${floor}, lowest ${say(low(s.ink))}`);
    console.log(`  pairs no colour lifts to ${floor}: ${s.inlineLow.map(say).join('; ') || 'none'}`);
}
console.log(`dim default text on the panel, half the ink: ${plainDim.filter((o) => o.ratio < 2.25).length} of ${plainDim.length} rows under 2.25, lowest ${say(low(plainDim))}`);
```

`shiki.mjs`:

```js
const themes = 'catppuccin-mocha catppuccin-macchiato catppuccin-frappe catppuccin-latte gruvbox-dark-hard gruvbox-light-hard nord rose-pine rose-pine-moon rose-pine-dawn everforest-dark everforest-light dracula kanagawa-wave kanagawa-dragon kanagawa-lotus solarized-dark synthwave-84'.split(' ');
const N = ['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White'];
const keys = [...N.map((n) => `terminal.ansi${n}`), ...N.map((n) => `terminal.ansiBright${n}`)];
for (const name of themes) {
    const { default: theme } = await import(`@shikijs/themes/${name}`);
    console.log(`${name}: ${keys.map((k) => theme.colors[k] ?? '-').join(' ')}`);
}
```
