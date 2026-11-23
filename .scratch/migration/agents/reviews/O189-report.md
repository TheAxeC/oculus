NOT done: items 1, 2 and 3 are not built. The first run found a case the brief's own rule gets wrong (case 4, `LANG=en_US.utf8` on macOS), so the step stopped there with no code changed, as the brief says. One sentence of item 3 is shown false by a run as well, and is handed back with it.

## Open items of the state file

None when the brief was written.

## What is handed back

### 1. Case 4, `LANG=en_US.utf8`: the rule of item 1 gives a macOS terminal with no UTF-8 locale

The rule: a value "is UTF-8 when its value names UTF-8, in either case, with or without the hyphen (`en_US.UTF-8`, `C.utf8`, ...)", and then the start carries the process's own variables as they are. For `LANG=en_US.utf8` (and for `C.utf8`, the rule's own example) it carries `LANG=en_US.utf8`, and the C library of macOS has no locale of that name, so the pane is US-ASCII and has the bug of ruling 770. glibc takes `utf8`; macOS takes the hyphenated name alone.

`env -i PATH=$PATH <variables> locale charmap`:

```
LANG=en_US.utf8 => US-ASCII
LANG=C.utf8 => US-ASCII
LC_CTYPE=utf8 => US-ASCII
LANG=en_US.utf-8 => utf-8
LANG=en_US.UTF-8 => UTF-8
LC_CTYPE=UTF-8 => UTF-8
```

`sh .agents/scratch/case6.sh $PWD ...` (case 6, the variables as `-e` pairs, zsh in a private tmux server):

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

Options (the function has the platform already):

- A. On macOS a value names UTF-8 only with the hyphen, in either case; on every other platform with or without it. `LANG=en_US.utf8` on macOS is then no UTF-8 locale and the start carries `LANG=en_US.UTF-8`; on Linux it carries `LANG=en_US.utf8`. Pro: every case of the brief keeps its result but this one, and the terminal has the locale. Con: one more branch on the platform. Recommended (a judgment).
- B. The rule as written. Pro: one test of the name on every platform. Con: such a macOS terminal keeps the bug. This is the lazy option.
- C. The machine's `locale -a` decides. Pro: it covers a name the machine has no locale for (`LANG=xx_YY.UTF-8` gave `pypython` too, and stays so under A). Con: a process per start, and the choice is no longer a pure function of an environment and a platform, which item 1 asks for.

### 2. Item 3: the rule named for `grid.css` also recolours text the floor does not

The brief: "A rule of `grid.css` can do it (a span of `xterm-bg-257` with no `xterm-fg-*` class); text inverse with a background colour of its own may then be drawn in the panel's colour as well where the floor recolours it." For inverse text whose own background is a truecolor value, xterm writes no `xterm-fg-*` class whether or not the floor recolours it, and the recoloured and the plain colour are the same form of inline style, so no selector separates the two. `node .agents/scratch/floor.mjs 4.5` (xterm 6.0.0's DOM renderer in jsdom, Dark Modern's panel and ink):

```
inverse, default colours: class="xterm-bg-257" style="color:#555555;"
inverse, truecolor background #204080: class="xterm-bg-257" style="color:#204080;"
inverse, truecolor background #c8c8c8: class="xterm-bg-257" style="color:#545454;"
```

With the rule, the second line is drawn in the panel's colour on the ink, where the floor leaves it `#204080`.

- A. Take the rule with that effect: inverse text with a truecolor background of its own and the default text colour is drawn in the panel's colour on the ink. Pro: one rule, readable in every theme, no internals of xterm. Con: that text loses its own hue. Recommended (a judgment).
- B. Seed xterm's private contrast cache with "ink on ink needs no change" after each theme set, and keep a `grid.css` rule for dim inverse text alone, whose measure does not read the cache. Pro: the truecolor text keeps its colour. Con: a private member of xterm, set again after every theme change, and the next xterm release may break it unseen.

## The cases' first run (unchanged tree)

Every program is under `.agents/scratch/` in the worktree and is kept there for the resumed run.

| Case | Checked by | Result |
|---|---|---|
| 1-4 | `ls src/lib/data/places` (no locale file); `node .agents/scratch/case7.mjs $PWD` with no locale: no pair of the three. `locale charmap` under each environment, below | No start carries a locale. Case 4 is wrong for `LANG=en_US.utf8` on macOS (above); every other value of cases 2 to 4 reads as the brief says |
| 5 | `sh .agents/scratch/case5.sh $PWD`, below | US-ASCII in each |
| 6 | `sh .agents/scratch/case6.sh $PWD none`, above | `pypython ../` |
| 7 | `node .agents/scratch/case7.mjs $PWD`, saved as `case7-before.txt` | five vectors, none with a locale pair |
| 8-11 | `node .agents/scratch/tokens.mjs $PWD` and `ansi.mjs`: `rows: 49 by number of the sixteen held: {"0":49}` | no block holds an `--ansi-*` token. `phosphoramber` has `--c-gold: #ffd966`, `--muted: #b88a2e`; `synthwave` has `--muted: #848bbd`, `--ink: #f4eee4` |
| 12 | `node .agents/scratch/case12.mjs $PWD` | `none` for each `uiTheme` with all keys and with none; `no --ansi-yellow` for the four app themes |
| 13 | Reading `grid-look.ts`: `reflowLook` reads `gridLook()` on the frame after a theme change | look at landing |
| 14 | Reading: `terminal-marks.ts` gives yellow `--c-gold`; `decoration-colors.ts:41` gives `terminal.ansiYellow` `--c-gold-txt` | as the brief says; look at landing |
| 15 | `tokens.mjs` saved as `tokens-before.json`: 49 rows, 17469 token values | the base of the comparison |
| 16 | `node utils/migrations/convert-vscode-themes.ts --check`, below; a run in a scratch copy, below | the seven blocks; the copy differs in them and the version alone |
| 17 | Reading `gridOptions`: no `minimumContrastRatio`; `OptionsService.ts:42` of xterm defaults to 1 | not set |
| 18 | `node .agents/scratch/floor.mjs 1` and `4.5`, below | look at landing; the brief's readings of the DOM renderer hold but for the sentence of item 3 above |

`env -i PATH=$PATH <variables> locale charmap`, the values of cases 2 to 4:

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

Case 16, `--check` (exit 1):

```
block vscode-light-modern differs
block vscode-light-plus differs
block vscode-light-visual-studio differs
block vscode-quiet-light differs
block vscode-dark-plus differs
block vscode-dark-visual-studio differs
block vscode-red differs
```

The run into a scratch copy printed `19 themes of VS Code 1.145.2`; `diff` of its `vscode.css` with the committed one shows the version of the head, `--muted`, `--tab-inactive-txt` and the comments naming them in the first six blocks, and `--titlebar-bg` in `vscode-red`; `vscode-rules.json` differs in the version of `generated` alone.

Case 18, `floor.mjs 1` then `floor.mjs 4.5`, the lines that differ or matter:

```
black text: class="xterm-fg-0" style=""                                    | class="" style="color:#878787;"
truecolor #303030: class="" style="color:#303030;"                         | class="" style="color:#868686;"
black on red: class="xterm-bg-1 xterm-fg-0" style=""                       | class="xterm-bg-1" style="color:#f0f0f0;"
inverse, default colours: class="xterm-bg-257 xterm-fg-257" style=""       | class="xterm-bg-257" style="color:#555555;"
inverse dim, default: class="xterm-dim xterm-bg-257 xterm-fg-257" style="" | class="xterm-dim xterm-bg-257" style="color:#848484;"
inverse, background red: class="xterm-bg-257 xterm-fg-1" style=""          | class="xterm-bg-257" style="color:#942323;"
inverse, foreground red: class="xterm-bg-1 xterm-fg-257" style=""          | class="xterm-bg-1" style="color:#f0f0f0;"
```

The palettes: `node .agents/scratch/shiki.mjs` printed all sixteen of the seventeen theme files the brief names and twelve of `synthwave-84` (no black, white, bright black, bright white), from `@shikijs/themes` 4.4.3. The sixteen `terminal.ansi*` registrations read from `workbench.desktop.main.js` of 1.145.2 match the brief's table in all four columns, and `terminal.integrated.minimumContrastRatio` is registered with `default:4.5`.

## DONE / NOT DONE

| Deliverable | State |
|---|---|
| First run of every case on the unchanged tree | DONE, above |
| Item 1, the locale | NOT DONE, waits on ruling 1 |
| Item 2, the sixteen colours | NOT DONE, not started: the step stops before any code |
| Item 3, the floor | NOT DONE, waits on ruling 2 |
| Verify list | NOT RUN, nothing is built |

## Files

`git status --short`: this report alone.

## Judgment calls for the resumed run, reversible

1. The `grid.css` rule leaves `.xterm-cursor-block` out, so a declaration marked important does not override the blink animation's text colour, and gives dim inverse text half of the panel's colour, as xterm draws it today.
2. The locale pairs go through `tmuxValue`, so a value ending in `;` reaches the pane as it is.
