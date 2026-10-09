# D51 report

NOT done: the look on the TEST page in the running app (cases 8 and 10). A builder starts no app, so case 8 was checked by a scratch run of the editor's theme code over the generated rules and case 10 by reading `chosenTheme`; the landing look still has to take both. Everything else in the brief is done, and the five rulings of `D51-cases.md` are carried out as listed below.

The same text is in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D51/tools/oculus/.scratch/migration/agents/reviews/D51-report.md`.

## Open items of the state file (verbatim from `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout, read at the moment of writing)

- 25. D50: who may write an app in the hub's `.oculus/apps`. Ruling (9) moves the apps folder of `~/.oculus` into the hub, and my automode choice Z751(c) reads `<hub>/.oculus/apps` as the machine apps folder, so those apps keep every channel and may stay approved while they change. `docs/apps.md:11` gives the reason a root app gets fewer channels: whoever writes a repository, a `git pull` included, writes its apps. The hub is a git repository, so under Z751(c) a pull of the hub writes an app that reads every channel, and one kept approved runs the pulled change unasked until the server ends. (a) Recommended: Z751(c) kept, and `docs/apps.md` says a machine app lives in the hub's own `.oculus/apps`, which only the hub's owner writes, and a root app in any other root; your apps keep the channels they have. (b) The hub's `.oculus/apps` read as the hub root's apps, with a root app's fewer channels, no keeping approved while it changes and files opened only from the hub; an app of yours that reads a channel a root app is not offered stops working. (c) Apps left in `~/.oculus`, against ruling (9). (a) costs the least to build; it is recommended because ruling (9) moves your apps without taking channels from them, and the docs then state the pull risk plainly. D50 waits for this ruling.

- 26. D50: four lines of the hub's registries name `tools/oculus/config/...` as the home of a key that moves into the hub's `.oculus/config/`: `registries/data.yml:28` and `registries/venues.yml:27` (the help the edit form shows for `themes`), `registries/domains.yml:1` (the `domains` map) and `registries/resources.yml:1` (`slurm.resource`). The rules file lets a builder reword hub text by hand only where a ruling of yours asks for it (`agents/spec.md:103`), and ruling (17) does not. (a) Recommended: you rule that D50 rewords these four lines by hand to name `.oculus/config/` of the hub, the report listing each before and after. (b) The lines are left naming the engine's file, which is false after D50; this is the lazy option. D50 waits for this ruling.

## The ruling carried (`tools/oculus/.scratch/migration/agents/briefs/D51-cases.md`)

1. Case 13, option A. When every `--muted` candidate is skipped, `--muted` is `--ink` at 0.7 composited over `--panel`, VS Code's `descriptionForeground` rule. The block's comment names that source: `body.vscode-solarized-light` in `vscode.css` carries "--muted: --ink at 0.7 over --panel, the rule of VS Code descriptionForeground." Option C (keeping oculus's slate `#64748b`) was the lazy option and is not used.
2. `--bg` is the theme's `sideBar.background`, else its registered default; the rest of `--bg`'s list is read only when that default is `null`. Every other token keeps item 2's order. The new `--bg` of the four themes is listed under "Visible changes".
3. `derive.ts`'s nudge applies to every theme. The theme by theme before and after of each `-txt` value that changes is under "Visible changes".
4. The registration forms beyond the brief's list (`qe.white`, `qe.black`, `qe.fromHex("#808080").transparent(a)`, the diff tints' colour objects) are resolved into the converter's `WORKBENCH` table as hexes and alphas; the comment above the table names each form and the helper that carries it (`via`, `fade`).
5. The contrast test was run again after the last change, and passed 40 of 40 (quoted below, load average 8.9). Its timeout is untouched. Plain `npx vitest run tests/checks` under a load of 7 to 14 timed out five other tests at the default 5000 ms; they are named in the quoted outputs under "DONE / NOT DONE".

## The cases

Scratch commands run from the session scratchpad `d51/` (outside the worktree), against the unchanged tree for the first run and against the final tree for the second. The converter did not exist on the unchanged tree, so the first run of a converter case is the scratch probe `probe.ts`, which applies the brief's rules to the 19 files. Command for the final run of the mapping cases: `node cases.ts` (an exporting copy of the converter's mapping, `conv.ts`).

### First run, on the unchanged tree

1. The six files. `node probe.ts "Dark Modern" "Abyss" "Monokai" "Quiet Light" "Red" "High Contrast"` reproduced every value quoted under "What is on the tree" (Dark Modern `--bg` `#181818`, `--panel` `#1F1F1F`, `--card` `#202020`, `--ink` `#CCCCCC`, `--muted` `#9D9D9D`, `--line` `#2B2B2B`, `--accent` `#0078D4`; Abyss; Monokai; Quiet Light `--line` `#cccccc` from the registered `panel.border`; Red `--line` `#611414`, `--muted` `#a33f3f`; Dark High Contrast). No block text could be quoted, since the converter did not exist.
2. `2026-dark.json`. `node c239.ts`: chain keys 2026-dark 298, dark_modern 129, dark_vs 37, resolved 334, tokenColors resolved 118; `foreground` `#bfbfbf` (dark_modern `#CCCCCC`), `editor.background` `#121314` (dark_modern `#1F1F1F`, dark_vs `#1E1E1E`), `sideBar.background` `#191A1B` (dark_modern `#181818`); a key only `dark_vs` holds comes through (`editorIndentGuide.background1=#404040`). The chain on disk is 2026-dark, dark_modern, dark_plus, dark_vs (`grep -o '"include": *"[^"]*"'` over the `theme-defaults/themes` files).
3. JSON. `node c239.ts`: `JSON.parse` read all 19 files; the ten `theme-defaults` files carry `$schema` `vscode://schemas/color-theme`.
4. `--from` on a missing folder and a missing `include`. Not runnable, the converter did not exist; the probe's loader threw `missing theme file <path>` for a missing include.
5. Run twice, `--check`. `node utils/migrations/convert-vscode-themes.ts --check` gave `Cannot find module` with code `MODULE_NOT_FOUND`, exit 1; `ls src/lib/themes | grep -i vscode` was empty.
6. Contrast test. `npx vitest run tests/checks/look/contrast.test.ts` gave `Tests 1 failed | 22 passed (23)`; the failure was `finds lane text painted only over its own lane surface under src/` with `Test timed out in 5000ms`; a rerun with `-t "finds lane text"` timed out after 21278 ms at load average 14.7. The changed test's text-on-tint pairs on the unchanged tree: `node tintbase.ts <base tree> tokens.css themes.css` (the base `derive.ts`, the 17 rows of the base `appearance.yml`, `--ink-txt` and the six `--c-code-*-txt` on the three tints, 21 pairs per theme) printed:
   ```
   light 18, dark 4, vscode-dark-modern 16, vscode-light-modern 18, mocha 18, gruvbox 12, nord 3, synthwave 14, tokyoneon 10, tokyonight 18, rosepine 18, everforest 18, dracula 11, kanagawa 11, solarized 1, latte 18, gruvboxlight 18
   pairs under 4.5:1 of 357: 226
   ```
7. Picker. `grep -n 'class: "vscode' config/appearance.yml` gave two rows.
8. Editor rules under Monokai. `node c8.ts` (a scratch copy of `theme.ts`): `vscode-monokai` had no block and resolved to `:root` (editor background `#ffffff`, foreground `#0f172a`, type light); every theme got the same 11 fixed rules.
9. The Modern blocks. The probe's values against the hand-written ones, listed under "Visible changes".
10. Saved `vscode-dark-modern`. By reading: `chosenTheme` in `src/lib/state/shared/words/appearance.ts` returns the saved name when the list holds it.
11. Scope ranking. Dark Modern keyword `#569cd6` (not `#C586C0`); Monokai keyword `#F92672`, name `#A6E22E` (not `#66D9EF`); Tomorrow Night Blue meta `#ff9da4` from the comma-separated scope.
12. High contrast and plus themes. Dark High Contrast `--line` `#6fc3df`, `--accent` `#f38518`; Light High Contrast, every chrome token from registered defaults; Dark+, Light+, Visual Studio Dark and Visual Studio Light `--card` from the registered `editorWidget.background`.
13. `--muted`. Solarized Dark `#6b8389` (3.74 against ink's 4.75), Monokai Dimmed `#8f8f8f` (5.15 against 9.88), Solarized Light `#64748b` (4.41 against ink's 4.13).
14. A row with no block. `node c14.ts`: `vscode-monokai` in a scratch config copy had no block and resolved to the light theme, so it was measured as `:root`.

### The case the brief's rules got wrong

Case 13, Solarized Light. Rule (items 2 and 3): `--muted` is the first held candidate of `tab.inactiveForeground`, `descriptionForeground`, `editorLineNumber.foreground`, skipping any whose contrast on `--panel` is at or above `--ink`'s, then the registered defaults, then oculus's `:root`. Result: the theme holds only `tab.inactiveForeground` `#586e75` (4.99, skipped); the defaults `#717171` (4.53) and the rest are skipped; `:root`'s `#64748b` (4.41) is taken, stronger than `--ink`'s 4.13. Ruling: option A (above). Second finding in the same hand-back: the four plus and Visual Studio themes got `--bg` equal to `--panel`; ruling 2 above.

### Final run, after the change

1. `node cases.ts`, case 1 block:
   ```
   Dark Modern: --bg #181818 | --panel #1f1f1f | --card #202020 | --chip #202020 | --ink #cccccc | --muted #9d9d9d | --line #2b2b2b | --accent #0078d4 | --tab-active-txt #ffffff | --tab-inactive-txt #9d9d9d | --tab-active-border #1f1f1f | --c-code-comment #6a9955 | --c-code-keyword #569cd6 | --c-code-string #ce9178 | --c-code-number #b5cea8 | --c-code-name #dcdcaa | --c-code-meta #569cd6
   Abyss: --bg #060621 | --panel #000c18 | --card #262641 | --chip #262641 | --ink #6688cc | --muted #406385 | --line #2b2b4a | --accent #596f99 | --c-code-comment #384887 | --c-code-keyword #225588 | --c-code-string #22aa44 | --c-code-number #f280d0 | --c-code-name #ddbb88 | --c-code-meta #225588
   Monokai: --bg #1e1f1c | --panel #272822 | --card #1e1f1c | --chip #1e1f1c | --ink #f8f8f2 | --muted #ccccc7 | --line #414339 | --accent #99947c | --tab-inactive-txt #ccccc7 | --c-code-comment #88846f | --c-code-keyword #f92672 | --c-code-string #e6db74 | --c-code-number #ae81ff | --c-code-name #a6e22e | --c-code-meta #f92672
   Quiet Light: --bg #f2f2f2 | --panel #f5f5f5 | --card #f5f5f5 | --chip #f5f5f5 | --ink #333333 | --muted #6d705b | --line #cccccc | --accent #9769dc | --c-code-comment #aaaaaa | --c-code-keyword #4b69c6 | --c-code-string #448c27 | --c-code-number #9c5d27 | --c-code-name #aa3731 | --c-code-meta #91b3e0
   Red: --bg #330000 | --panel #390000 | --card #300000 | --chip #300000 | --ink #f8f8f8 | --muted #a33f3f | --line #611414 | --accent #bd4444 | --c-code-comment #e7c0c0 | --c-code-keyword #f12727 | --c-code-string #cd8d8d | --c-code-number #ea580c | --c-code-name #ffb454 | --c-code-meta #ec0d1e
   Dark High Contrast: --bg #000000 | --panel #000000 | --card #0c141f | --chip #0c141f | --ink #ffffff | --muted #b3b3b3 | --line #6fc3df | --accent #f38518 | --c-code-comment #7ca668 | --c-code-keyword #569cd6 | --c-code-string #ce9178 | --c-code-number #b5cea8 | --c-code-name #dcdcaa | --c-code-meta #569cd6
   ```
   These are the mapping's values before the contrast nudge; the nudged values the blocks carry are in `vscode.css`, and each block's comment names its nudged tokens. Red's `--c-code-number` `#ea580c` comes from oculus's base (the Red block's comment names it), and Dark High Contrast's `--card` `#0c141f` from the registered `editorWidget.background` (that block's comment names it).
2. `node c239.ts`: the include chain is followed with the includer winning (the three values of the first run above); `vscode-dark-2026` holds 118 rules in `vscode-rules.json` (`node -e` over the file), the 118 resolved `tokenColors`.
3. `node c239.ts`: all 19 files parse. An invalid file stops the run: with `ext3/theme-defaults/themes/2026-dark.json` replaced by `{ "colors": ` and `node utils/migrations/convert-vscode-themes.ts --from <ext3>`:
   ```
   convert-vscode-themes: <scratch>/ext3/theme-defaults/themes/2026-dark.json is not valid JSON: Unexpected end of JSON input
   invalid json exit 1
   ```
4. Missing folder and missing include, against the real tree (`shasum` of `vscode.css` and `vscode-rules.json` before and after: `c201abe72cf9 d4655f7c66f2` both times):
   ```
   convert-vscode-themes: the extensions folder /nonexistent does not exist; name it with --from <extensions folder>
   missing folder exit 1
   convert-vscode-themes: the theme file <scratch>/ext3/theme-defaults/themes/nothere.json does not exist, included by <scratch>/ext3/theme-defaults/themes/2026-dark.json
   missing include exit 1
   ```
5. Run twice and hash: `node utils/migrations/convert-vscode-themes.ts` twice, then `shasum`:
   ```
   c201abe72cf98a028774e4a72dd7aec1637e1ec9  src/lib/themes/vscode.css
   d4655f7c66f2d24a8880d89996cd4a61de6b696f  src/lib/themes/vscode-rules.json
   ```
   identical after both runs. `node utils/migrations/convert-vscode-themes.ts --check` printed `19 themes up to date`, exit 0. `npx prettier --check src/lib/themes/vscode.css src/lib/themes/vscode-rules.json` printed `All matched files use Prettier code style!`. `--check` with no output files: in the scratch tool root `c14root`, with `vscode.css` and `vscode-rules.json` removed and the base `appearance.yml` (two `vscode-*` rows), it printed 19 lines `block vscode-<slug> is missing`, 19 lines `rules of vscode-<slug> is missing`, 17 lines `block vscode-<slug> has no appearance.yml row`, and exited 1 (`node utils/migrations/convert-vscode-themes.ts --check; echo "exit $?"`).
6. `npx vitest run tests/checks/look/contrast.test.ts` after the last change: `Test Files 1 passed (1)`, `Tests 40 passed (40)`, `Duration 2.56s`, load average 8.9 (`uptime`: 15:10). The lane-text case passed. The test in its changed form measures the text-on-tint pairs and passes on all 36 rows; on the unchanged tree the same measurement fails 226 pairs (case 6 above).
7. `grep -c "^  - { name: vscode" config/appearance.yml` prints 19. The 17 new rows are in the brief's order after `vscode-light-modern`.
8. Editor rules, `node c8b.ts` (a scratch copy of the final `theme.ts` and `colours.ts`, the final `vscode-rules.json`, and `ownRules(cls) ?? textmate.tokenColors` as `kit/load.ts` does):
   ```
   vscode-monokai               bg #272822 fg #f8f8f2 type dark | rules 50 own | keyword {"foreground":"#fb92b8"} | support.type {"foreground":"#66d9ef","fontStyle":"italic"} | bad 0
   vscode-quiet-light           bg #f5f5f5 fg #333333 type light | rules 55 own | keyword {"foreground":"#3450a7"} | support.type {"foreground":"#7a3e9d"} | bad 0
   vscode-red                   bg #390000 fg #f8f8f8 type dark | rules 40 own | keyword {"foreground":"#f57373"} | support.type null | bad 0
   vscode-dark-high-contrast    bg #000000 fg #ffffff type dark | rules 54 own | keyword {"foreground":"#569cd6"} | support.type {"foreground":"#4ec9b0"} | bad 0
   vscode-light-high-contrast   bg #ffffff fg #292929 type light | rules 68 own | keyword {"foreground":"#0f4a85"} | support.type {"foreground":"#185e73"} | bad 0
   vscode-dark-plus             bg #1e1e1e fg #d4d4d4 type dark | rules 65 own | keyword {"foreground":"#6eaadb"} | support.type {"foreground":"#4ec9b0"} | bad 0
   vscode-dark-modern           bg #1f1f1f fg #cccccc type dark | rules 65 own | keyword {"foreground":"#76afdd"} | support.type {"foreground":"#4ec9b0"} | bad 0
   dark                         bg #121a2b fg #e7ecf3 type dark | rules 11 fixed | keyword {"foreground":"#947aff"} | support.type {"foreground":"#6691f0"} | bad 0
   (light)                      bg #ffffff fg #0f172a type light | rules 11 fixed | keyword {"foreground":"#481cff"} | support.type {"foreground":"#124bc9"} | bad 0
   ```
   Monokai's `support.type` is cyan and italic. Its `keyword` is `#fb92b8`, the theme's `#F92672` nudged to 4.5:1 on the diff tints (item 6 of the brief). A theme without an entry (`dark`, the light default) keeps the 11 fixed rules, and a chosen Shiki code theme goes through `rulesOf` as before. The diff tints and Source Control colours come from the block: `--c-scm-*` in `vscode.css`. The look in the running app is not taken.
9. `node c9.ts` (blocks of the base `themes.css` against the generated `vscode.css`): the lists under "Visible changes".
10. Saved appearance. By reading: the row `vscode-dark-modern` stays in `appearance.yml` (`grep -n "name: vscode-dark-modern" config/appearance.yml`), so `chosenTheme` returns the saved name.
11. `node cases.ts` case 11 block:
    ```
    Dark Modern: --c-code-keyword #569cd6
    Monokai: --c-code-keyword #f92672 | --c-code-name #a6e22e
    Tomorrow Night Blue: --c-code-meta #ff9da4
    ```
12. `node cases.ts` case 12 block:
    ```
    Dark High Contrast: --line #6fc3df | --accent #f38518
    Light High Contrast base tokens: --c-scm-conflict-bg,--c-scm-added-bg,--c-scm-deleted-bg | registered: --panel (editor.background), --bg (sideBar.background), --card (editorWidget.background), --ink (foreground), --muted (descriptionForeground), --line (contrastBorder), --accent (contrastActiveBorder)
    Dark+: --bg #252526 | --card #252526
    Light+: --bg #f3f3f3 | --card #f3f3f3
    Dark (Visual Studio): --bg #252526 | --card #252526
    Light (Visual Studio): --bg #f3f3f3 | --card #f3f3f3
    ```
    The Light High Contrast block's comment (`vscode.css` line 679) names each defaulted token and the three oculus-base tint tokens.
13. `node cases.ts` case 13 block:
    ```
    Solarized Dark: --ink #839496 | --muted #6b8389 | --panel #002b36
    Solarized Light: --ink #657b83 | --muted #93a0a0 | --panel #fdf6e3
    Monokai Dimmed: --ink #c5c8c6 | --muted #8f8f8f | --panel #1e1e1e
    ```
    All three are below `--ink`'s contrast on `--panel`.
14. Converter side, in a scratch tool root (`c14root`, `node_modules` linked, a copy of the converter, the generated files and `appearance.yml` with a `vscode-bogus` row): `node utils/migrations/convert-vscode-themes.ts --check` printed `19 themes up to date` (exit 0) before the row and `appearance.yml row vscode-bogus has no block` (exit 1) after it. The `themes.ts` side: `themeTokens` throws `appearance.yml theme vscode-bogus: class vscode-bogus has no block in the sheets` (`tests/checks/look/themes.ts:49-51`); `c14b.ts` runs the same word-in-`blocks` test over the real sheets and printed `vscode-bogus appearance.yml theme vscode-bogus: class vscode-bogus has no block in the sheets` and `vscode-monokai has a block`. `themes.ts` cannot be imported by Node (its `generation.svelte.ts` import uses a rune), so the throw is read at those lines, and the path where every row has a block runs in `contrast.test.ts` over the 36 rows.

## DONE / NOT DONE

| Row | Status | Command |
|---|---|---|
| Converter, 19 themes, both outputs | DONE | `node utils/migrations/convert-vscode-themes.ts` |
| Second run changes no byte | DONE | `shasum` twice, case 5 |
| `--check` exits 0 | DONE | `node utils/migrations/convert-vscode-themes.ts --check` |
| Prettier on both outputs | DONE | `npx prettier --check src/lib/themes/vscode.css src/lib/themes/vscode-rules.json` |
| `derive.ts` tint grounds, all themes | DONE | contrast test 40 of 40 |
| 17 picker rows | DONE | `grep -c "^  - { name: vscode" config/appearance.yml` prints 19 |
| Editor rules per VS Code theme | DONE in code and a scratch run | `node c8b.ts` |
| Look in the running app, cases 8 and 10 | NOT DONE | needs the app, a builder starts none |
| `wc -l` | DONE | table below |
| Folder sizes | DONE | `ls src/lib/themes \| wc -l` prints 8, `ls utils \| wc -l` prints 10, `ls utils/migrations \| wc -l` prints 4 |
| `sh utils/folder-check.sh` | DONE | exit 0, no output |
| `sh utils/unused-exports.sh` | DONE | 364 lines, `diff` against `.agents/worktrees/D51-base/tools/oculus/unused-exports.txt` prints nothing; the step adds no line |
| ASCII gate | DONE | the perl command of `agents/spec.md:99` over `src tests config` printed nothing, exit 0 (`bin` does not exist in this tree; `DESIGN.md`, `docs/views.md` and the converter were also passed through it, nothing printed) |

Quoted outputs.

`npm run diagrams && npm run test:quick -- <the 16 changed source, test, config and style paths>` after the last change to those paths (`npm run diagrams` exit 0; `docs/diagrams` regenerated: `layer-ui.dot`, `layer-ui.svg`, `layers.dot`, `layers.svg` differ from the base, because `theme.ts` imports `vscode-rules.json`):
```
test:quick: 16 changed file(s), from the given paths
test:quick: 12 test file(s), 10 essential
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (11.3 s)
ok      svelte-check (11.6 s): 1791551839264 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (17.1 s): Duration  10.86s (transform 14.56s, setup 0ms, import 23.86s, tests 5.04s, environment 3ms)
test:quick: 17.8 s (limit 45.0 s); every command passed
```

`npx vitest run tests/checks/look/contrast.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts`:
```
 Test Files  5 passed (5)
      Tests  114 passed (114)
   Duration  41.22s (transform 20.26s, setup 0ms, import 66.47s, tests 16.62s, environment 1ms)
```

`npm run test:checks` (`vitest run tests/checks --testTimeout 0 --hookTimeout 0`), after the last change to code and comments:
```
 Test Files  17 passed (17)
      Tests  265 passed (265)
```

`npx vitest run tests/checks` (the default 5000 ms timeout), load average 7.4 at the start and 13.6 at the end: `Test Files 3 failed | 14 passed (17)`, `Tests 5 failed | 260 passed (265)`. All five failures are `Error: Test timed out in 5000ms`, none an assertion: `names no package id, date or session in any comment` (6420 ms), `places every folder of every layer the tree holds, and every sub-folder of an inner order` (5308 ms), `are what the source gives now, each file byte for byte` (6463 ms), `are named stale, every one at once, when an import and a publish are added` (109881 ms), `reads a label node by the box Graphviz drew for it, the two halves through it its own` (97606 ms). Each of the five passes under `npm run test:checks`. The history test passes alone in 4.1 s (`npx vitest run tests/checks/source/history.test.ts`: `Tests 3 passed (3)`). Whether the base tree times out the same five under the same load is not verified: the base copy has no `node_modules`.

`node utils/migrations/convert-vscode-themes.ts --check`:
```
19 themes up to date
check exit 0
```

`LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (the command of `agents/spec.md:99`): no output, `ascii exit 0`.

Prose checked against `agents/spec.md`'s rules: the sentences added to `DESIGN.md` (lines 72, 244, 521, 565), `docs/views.md:243`, the `code_theme` help in `config/catalogs/options.yml:146` and the comments are plain, one line per paragraph in the Markdown, no em dash, no history word. A grep of the added comment lines for `before|used to|no longer|still|always|previously|formerly|now|again|already|originally|anymore`, plan ids and years found hits only in text that belongs to the code's behaviour (for example `look.ts` "the theme before it in force", "the answer always resolves", `load.ts` "once it is in force"), each in text that was already in the file and rewrapped; none is a statement of history. The Markdown lines depart from the 100-column wrap because the docs keep one paragraph per line.

## The terms

no glossary (`ls tools/oculus/docs` prints `apps.md configuration.md debugging.md diagrams files-and-search.md source-control.md terminals.md views.md window.md`).

## The files with line counts

`wc -l` after the change (base in brackets where it changed):

| File | Lines |
|---|---|
| `utils/migrations/convert-vscode-themes.ts` (new) | 808 |
| `src/lib/themes/vscode.css` (new, generated) | 711 (limit 880) |
| `src/lib/themes/vscode-rules.json` (new, generated) | 3687 |
| `src/lib/themes/themes.css` | 776 (846) |
| `src/lib/themes/tokens.css` | 272 (272) |
| `src/lib/themes/derive.ts` | 317 (295) |
| `src/lib/ui/theme.ts` | 124 (119) |
| `src/routes/+layout.svelte` | 49 (48) |
| `src/lib/ui/controls/editor/kit/load.ts` | 493 (486) |
| `src/lib/ui/controls/editor/kit/look.ts` | 66 (65) |
| `src/lib/ui/controls/editor/kit/theme/theme.ts` | 206 (181) |
| `tests/checks/look/themes.ts` | 56 (45) |
| `tests/checks/look/contrast.test.ts` | 263 (254) |
| `tests/checks/source/code.ts` (outside the write list) | 222 (221) |
| `config/appearance.yml` | 97 (80) |
| `config/catalogs/options.yml` (outside the write list) | 1454 (1454) |
| `src/desktop/decide/window-options.ts` | 38 (38) |
| `DESIGN.md` | 586 (586) |
| `docs/views.md` | 283 (283) |
| `docs/diagrams/layer-ui.dot`, `layer-ui.svg`, `layers.dot`, `layers.svg` | regenerated |

`diff -rq` of the base copy against the worktree (excluding `node_modules`, `.svelte-kit`) lists exactly these files; the other lines it prints (`.gitignore`, `.prettierrc`, `assets`, `demo`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.scratch`) are files the base copy does not hold. `diff -rq tools/oculus .agents/worktrees/D51/tools/oculus -x node_modules -x .svelte-kit -x local.yml -x .scratch -x build -x dist` lists as `Only in` just the three new files and main's own `.DS_Store`, `.agents`, `.svelte-kit-app` and `build-app`. No scratch file is in the worktree.

Paths outside the brief's write list, with the reason:

- `tests/checks/source/code.ts` (two lines): `tests/checks/source/history.test.ts` reads every file under `src`, `tests`, `utils` and `config` through `fileKinds`, which threw `src/lib/themes/vscode-rules.json does not parse: no reader is known for its language`. The brief fixes the JSON file's path, so the reader now accepts a `.json` file as code with no comments (`JSON.parse`, so an invalid file still throws), and the head comment says so.
- `DESIGN.md:521`: the sentence on how the editor primitive builds its TextMate theme said each scope takes the code hue of its role, which a VS Code theme now replaces with its own rules; it carries the clause "(under a VS Code theme, the rules of that theme from `themes/vscode-rules.json`)".
- `config/catalogs/options.yml:146`: the `code_theme` help says `tokens` takes the syntax colours from the UI theme's own code tokens; it carries "(a VS Code theme brings its own TextMate rules)". `tests/checks/config/config.test.ts` and `config-folder.test.ts` pass.

## Each paragraph and head comment of "What is on the tree"

- No ADR: still true (`find . -name adr -type d -not -path '*/node_modules/*'` prints nothing).
- The base copy: still true.
- `src/lib/themes/` holds six items: rewritten, it holds eight (`ls src/lib/themes`: `code.css derive.ts parse.ts slide.css themes.css tokens.css vscode-rules.json vscode.css`).
- `themes.css` head comment and the tab-colours paragraph: rewritten. The head comment now says the fourteen ported blocks are the file's, that the VS Code themes are generated into `vscode.css` by the converter, and the tab-colours paragraph is gone with the Modern blocks.
- The code colours are six tokens: rewritten. `grep -c "c-code" src/lib/themes/themes.css` still prints 0, and `vscode.css` sets the six hues of each of the 19 blocks; under a VS Code theme the editor takes that theme's rules from `vscode-rules.json` through `ownRules`, otherwise the fixed `RULES`.
- The editor's chrome (`colours.ts`, `theme.ts`): still true; the colour map and the base colours come from the tokens in both cases.
- `derive.ts` and `parse.ts`: `parse.ts` still true; `derive.ts` rewritten, `--ink-txt` and the six `--c-code-*-txt` are nudged on the three Source Control tints as well, and its head comment names the three stylesheets and the tints.
- Who reads the sheets: rewritten. `+layout.svelte` imports `vscode.css` after `themes.css`; `theme.ts` imports it raw, its head comment speaks of three stylesheets, and `applyTheme`, `themeClasses` and `tokenNames` default to the three joined (`THEME_SHEETS`); `tests/checks/look/themes.ts` reads `vscode.css` and refuses a class word without a block; the contrast test's head comment names the generated values and the tint pairs.
- The picker: rewritten, 19 `vscode-*` rows.
- `DESIGN.md:72`, `:244`, `:565`, `tokens.css:5-6` and `:59`: rewritten (and `:521`, above).
- `utils/` holds 10 items and `utils/migrations/` three converters: `utils/` still true; `utils/migrations/` rewritten, four. The converter runs from `tools/oculus` as `node utils/migrations/convert-vscode-themes.ts [--from <extensions folder>] [--check]`, its head comment says so, and prettier is the project's own dependency (`package.json:44`).
- VS Code's theme files, the 19 entries: still true.
- The JSON bullet: rewritten in one place; `tokenColors` is a list in 17 of the 19 files, and `dark_modern.json` and `light_modern.json` hold none (`python3` over the two files: `tokenColors` absent), so a missing list reads as empty. The include chain is 2026-dark, dark_modern, dark_plus, dark_vs, as the bullet says.
- VS Code's registered defaults: rewritten; the workbench also registers `qe.white`, `qe.black`, `qe.fromHex("#808080").transparent(a)` and the two diff colour objects (ruling 4).
- The mapping run on six real files: still true except Monokai/Dark Modern values that changed by the rulings listed under "Visible changes".
- Folder sizes: rewritten, `src/lib/themes` 8, `utils` 10, `utils/migrations` 4.
- Guarded entries (G26, G12, G13, G24): still true; the contrast test gained the tint pairs; no guarded entry names the converter.

## Judgment calls

1. A missing `tokenColors` list is read as `[]`; a present one that is not a list stops the run.
2. `vscode-rules.json` is `{ "generated": "<comment>", "themes": { "vscode-<slug>": [ { "scope": [...], "foreground"?, "fontStyle"? }, ... ] } }`, the comment because JSON has none.
3. `--check` prints one line per differing block or theme, then one per `vscode-*` row without a block and per block without a row, and exits 1; with nothing to say it prints `19 themes up to date`.
4. Errors print `convert-vscode-themes: <message>` and exit 1 before anything is written; `build` lists the themes first, so a missing `--from` folder stops before the git extension's path is read.
5. `--muted`'s candidate skip and the `--ink` at 0.7 fallback are the rulings; `--bg`'s lead key is `sideBar.background`, implemented as the `lead` option of the converter's `pick`.
6. `ownRules(classes)` takes the first class word that has an entry (`Object.hasOwn`), so a body with `dark vscode-red` reads Red's rules; `kit.paint(token, code, classes)` takes the body's class string and `kit/look.ts` passes `document.body.className`.
7. The converter's `WORKBENCH` table of registered defaults holds the 23 workbench keys the mapping names, by type; the comment above it says `sideBar.foreground` and `tab.activeBorder` are registered with no default.
8. A `.json` file is read as code with no comments by `tests/checks/source/code.ts`, rather than excluding `vscode-rules.json` from the history audit by name, so any future JSON under `src` is audited the same way.
9. Dark Modern keeps the red and amber tints and `--shadow: none` that the converter sets for dark types.
10. `docs/views.md` names the 19 themes and the command; `config/text/views/system/workbench.yml:114` ("From the theme takes the syntax colours of the UI theme") stays true for a VS Code theme and is unchanged.

## Visible changes, with before and after

### `--bg` of the plus and Visual Studio themes (ruling 2)

These themes are new in the picker. Their `--bg` is the side bar VS Code draws:

| Theme | `--bg` | `--panel` |
|---|---|---|
| Dark+ (`vscode-dark-plus`) | `#252526` | `#1e1e1e` |
| Light+ (`vscode-light-plus`) | `#f3f3f3` | `#ffffff` |
| Dark (Visual Studio) (`vscode-dark-visual-studio`) | `#252526` | `#1e1e1e` |
| Light (Visual Studio) (`vscode-light-visual-studio`) | `#f3f3f3` | `#ffffff` |

(`node c9.ts`.) Under the brief's original order `--bg` was `editor.background`, equal to `--panel`.

### The 17 new picker rows

`vscode-light-2026`, `vscode-light-plus`, `vscode-light-visual-studio`, `vscode-quiet-light`, `vscode-solarized-light`, `vscode-abyss`, `vscode-dark-2026`, `vscode-dark-plus`, `vscode-dark-visual-studio`, `vscode-kimbie-dark`, `vscode-monokai`, `vscode-monokai-dimmed`, `vscode-red`, `vscode-solarized-dark`, `vscode-tomorrow-night-blue`, `vscode-dark-high-contrast`, `vscode-light-high-contrast`, labelled "vscode ..." in lower case as the two existing rows are. Each Settings theme list shows them after `vscode light modern`.

### The editor under a VS Code theme

Before: every theme gave the editor the same 11 fixed rules in six hues. After: under `code_theme: tokens` a VS Code theme's source tab, diff and merge editor use that theme's own scoped rules (`vscode-rules.json`, 30 to 118 rules per theme, listed by `node -e` over the file), each foreground nudged to 4.5:1 on `--panel` and the three tints; a chosen Shiki theme and a non-VS-Code theme are unchanged.

### Dark Modern and Light Modern blocks (hand-written to generated; `node c9.ts`)

```
vscode-dark-modern
  changed --card #262626 -> #202020
  changed --chip #262626 -> #202020
  changed --c-scm-added-bg #2d382f -> #383e2a
  changed --c-scm-deleted-bg #3b231f -> #4c1919
  changed --c-scm-conflict-bg #412829 -> #29133d
  new     --tab-inactive-txt #9d9d9d
  new     --tab-active-border #1f1f1f
  new     --c-code-comment #6a9955
  new     --c-code-keyword #569cd6
  new     --c-code-meta #569cd6
  new     --c-code-name #dcdcaa
  new     --c-code-number #b5cea8
  new     --c-code-string #ce9178
vscode-light-modern
  changed --card #f3f3f3 -> #f8f8f8
  changed --muted #616161 -> #868686
  changed --chip #f3f3f3 -> #f8f8f8
  changed --c-scm-conflict #a31515 -> #ad0707
  changed --c-scm-added-bg #d8dfc9 -> #ebf1dd
  changed --c-scm-deleted-bg #e9c8c8 -> #ffcccc
  changed --c-scm-conflict-bg #e7cbcb -> #e1caea
  new     --tab-active-txt #3b3b3b
  new     --c-code-comment #008000
  new     --c-code-keyword #0000ff
  new     --c-code-meta #800000
  new     --c-code-name #795e26
  new     --c-code-number #098658
  new     --c-code-string #a31515
```

`--bg` of Dark Modern stays `#181818`, so `WINDOW_BACKGROUND` in `window-options.ts` still matches; Light Modern's `--tab-inactive-txt` stays `#717171` (the mapped `#868686` is nudged to 4.5:1). The conflict tints now come from `:root` and `body.dark`'s base tokens, since the mapping has no VS Code key for a conflict tint.

### Each `-txt` value that changes in the 17 existing themes (ruling 3)

Computed by `change.ts`: the base `derive.ts` and the base sheets against the final `derive.ts` and the final sheets, over the 17 rows of the base `appearance.yml`; 258 derived tokens change. The `vscode-dark-modern` and `vscode-light-modern` lines also include the effect of their new generated block values (the list above). The format is `theme (count): token before -> after`.

```
light (12): --c-code-comment-txt #666d7a -> #535963 | --c-code-comment-lane-txt #40454d -> #40454c | --c-code-keyword-txt #6b47ff -> #481cff | --c-code-keyword-lane-txt #2d00ea -> #2c00e7 | --c-code-meta-txt #067994 -> #046076 | --c-code-meta-lane-txt #045062 -> #034f62 | --c-code-name-txt #2563eb -> #124bc9 | --c-code-name-lane-txt #0e3a9b -> #0d399a | --c-code-number-txt #b94509 -> #9b3907 | --c-code-number-lane-txt #7e2f06 -> #7d2e05 | --c-code-string-txt #117f39 -> #0c632c | --c-code-string-lane-txt #0c5b28 -> #0a5927
dark (8): --c-code-meta-txt #0898bb -> #089fc4 | --c-code-meta-lane-txt #32d0f6 -> #3bd2f7 | --c-code-name-txt #5d8bf0 -> #6691f0 | --c-code-name-lane-txt #95b3f5 -> #94b2f4 | --c-code-number-txt #f25b0d -> #f26116 | --c-code-number-lane-txt #f8b08a -> #f8af89 | --c-code-string-txt #16a34a -> #17ab4e | --c-code-string-lane-txt #28e26c -> #27e26c
vscode-dark-modern (56): --on-c-code-comment #ffffff -> #000000 | --on-c-code-name #ffffff -> #000000 | --accent-txt #008ffc -> #0089f2 | --c-amber-s-txt #af8d26 -> #a78624 | --c-amber-s-lane-txt #bf9a29 -> #c09a29 | --c-blue-txt #5d8bf0 -> #5384ef | --c-blue-lane-txt #95b3f5 -> #94b2f5 | --c-code-comment-txt #8a909d -> #8ab377 | --c-code-comment-lane #45484f -> #445c3a | --c-code-comment-lane-txt #b6bac2 -> #bcd3b1 | --c-code-keyword-txt #947aff -> #76afdd | --c-code-keyword-lane #4d3d8f -> #3a5d7a | --c-code-keyword-lane-txt #c5b7ff -> #b7d5ed | --c-code-meta-txt #08a0c5 -> #76afdd | --c-code-meta-lane #135868 -> #3a5d7a | --c-code-meta-lane-txt #45d4f7 -> #b7d5ed | --c-code-name-txt #5d8bf0 -> #dcdcaa | --c-code-name-lane #224185 -> #7d7d64 | --c-code-name-lane-txt #95b3f5 -> #101006 | --c-code-number-txt #f25b0d -> #b5cea8 | --c-code-number-lane #843b15 -> #6a7663 | --c-code-number-lane-txt #f9b694 -> #f7faf6 | --c-code-string-txt #16a34a -> #d39d86 | --c-code-string-lane #1a6134 -> #76584b | --c-code-string-lane-txt #43e57f -> #eed9d0 | --c-crimson-txt #e86374 -> #e75a6c | --c-cyan-txt #08a0c5 -> #0898bb | --c-cyan-lane-txt #45d4f7 -> #46d4f7 | --c-gold-txt #d17f09 -> #c87908 | --c-gold-lane-txt #f5a22b -> #f6a22b | --c-green-d-txt #1ba658 -> #1a9e54 | --c-green-d-lane-txt #46e08a -> #47e08a | --c-grey-d-txt #8a909d -> #848b99 | --c-gutter-modified-txt #008ffc -> #0089f2 | --c-magenta-txt #d757e4 -> #d54ee2 | --c-magenta-lane-txt #e182eb -> #e182ea | --c-mauve-txt #be7799 -> #bb7094 | --c-orange-txt #f25b0d -> #ea580c | --c-orange-lane-txt #f9b694 -> #f9b795 | --c-pink-txt #ed5aa3 -> #ec4899 | --c-pink-lane-txt #f7b5d6 -> #f6add1 | --c-purple-txt #a77bf2 -> #a172f2 | --c-purple-lane-txt #bfa0f5 -> #c0a0f6 | --c-red-txt #e56262 -> #e45a5a | --c-red-lane-txt #ef9f9f -> #efa0a0 | --c-red-d-txt #e86767 -> #e65e5e | --c-red-d-lane-txt #ed8a8a -> #ec8a8a | --c-red-s-txt #dd6b6b -> #db6363 | --c-rose-txt #e5649d -> #e25292 | --c-rose-lane-txt #efa1c3 -> #efa0c3 | --c-scm-conflict-txt #e7787b -> #e4676b | --c-scm-conflict-lane-txt #f3bdbe -> #f3bdbf | --c-slate-txt #8091a9 -> #7a8ca5 | --c-teal-txt #0ea699 -> #0d9d90 | --c-teal-lane-txt #12decd -> #12decc | --c-violet-txt #947aff -> #8c70ff
vscode-light-modern (50): --on-c-code-keyword #000000 -> #ffffff | --on-c-code-meta #000000 -> #ffffff | --on-c-code-number #000000 -> #ffffff | --on-c-code-string #000000 -> #ffffff | --on-muted #ffffff -> #000000 | --muted-txt #616161 -> #717171 | --scroll-thumb #939393 -> #919191 | --c-code-comment-txt #666d7a -> #006a00 | --c-code-comment-lane #b5b8bf -> #7fbf7f | --c-code-comment-lane-txt #40454d -> #004b00 | --c-code-keyword-txt #6b47ff -> #0000ff | --c-code-keyword-lane #bdadff -> #7f7fff | --c-code-keyword-lane-txt #2d00ea -> #00008e | --c-code-meta-txt #067994 -> #800000 | --c-code-meta-lane #83c8d8 -> #bf7f7f | --c-code-meta-lane-txt #045062 -> #570000 | --c-code-name-txt #2563eb -> #695120 | --c-code-name-lane #92b1f5 -> #bcae92 | --c-code-name-lane-txt #0e3a9b -> #513e18 | --c-code-number-txt #b94509 -> #066844 | --c-code-number-lane #f4ab85 -> #84c2ab | --c-code-number-lane-txt #7e2f06 -> #044b31 | --c-code-string-txt #117f39 -> #a31515 | --c-code-string-lane #8ad1a4 -> #d18a8a | --c-code-string-lane-txt #0c5b28 -> #6c0e0e | --c-crimson-txt #d11e35 -> #da1f37 | --c-gold-txt #975c06 -> #a16207 | --c-gold-lane-txt #653e04 -> #663e04 | --c-green-d-txt #147a41 -> #158346 | --c-green-d-lane-txt #0e562e -> #0d572e | --c-grey-d-txt #666d7a -> #6b7280 | --c-grey-d-lane-txt #40454d -> #41454d | --c-honey-txt #935f06 -> #9d6506 | --c-honey-lane-txt #7f5205 -> #7f5204 | --c-indigo-txt #5053ef -> #595cf0 | --c-lime-txt #477309 -> #4d7d09 | --c-orange-txt #b94509 -> #c3490a | --c-orange-lane-txt #7e2f06 -> #7f2f06 | --c-pink-txt #cd1570 -> #d61675 | --c-red-s-txt #d51c1c -> #de1e1e | --c-red-s-lane-txt #c21919 -> #c31a1a | --c-red-t-txt #d70707 -> #e10707 | --c-rose-txt #cb216d -> #d42372 | --c-scm-added-txt #4a690a -> #51720b | --c-scm-added-lane-txt #364d07 -> #364c07 | --c-scm-conflict-txt #a31515 -> #ad0707 | --c-scm-conflict-lane #d18a8a -> #d68383 | --c-scm-conflict-lane-txt #6c0e0e -> #680404 | --c-violet-txt #6b47ff -> #7351ff | --c-violet-lane-txt #2d00ea -> #2d00e9
mocha (10): --c-code-comment-txt #9096a2 -> #a6abb4 | --c-code-comment-lane-txt #b6bac2 -> #b6bac1 | --c-code-keyword-txt #9c84ff -> #b4a2ff | --c-code-keyword-lane-txt #c5b7ff -> #c4b6ff | --c-code-meta-txt #08a0c5 -> #09b7e2 | --c-code-name-txt #6691f1 -> #8babf4 | --c-code-name-lane-txt #94b2f5 -> #94b1f4 | --c-code-number-txt #f36920 -> #f6905a | --c-code-string-txt #17ab4e -> #1ac55a | --c-code-string-lane-txt #39e478 -> #37e478
gruvbox (12): --c-code-comment-txt #959ba6 -> #a5aab3 | --c-code-comment-lane-txt #bbbfc6 -> #bbbec5 | --c-code-keyword-txt #a48fff -> #ac99fe | --c-code-keyword-lane-txt #c5b7fe -> #c4b7fe | --c-code-meta-txt #09a8cf -> #09b7e2 | --c-code-meta-lane-txt #5ad8f7 -> #58d8f8 | --c-code-name-txt #6f98f1 -> #8aabf3 | --c-code-name-lane-txt #9db9f5 -> #9cb8f4 | --c-code-number-txt #f47634 -> #f6905a | --c-code-number-lane-txt #f9bd9e -> #f9bd9d | --c-code-string-txt #18b452 -> #1ac65a | --c-code-string-lane-txt #5de991 -> #5ce990
nord (6): --c-code-meta-txt #2acef5 -> #33d0f5 | --c-code-meta-lane-txt #9ee8fa -> #9de8fa | --c-code-number-txt #f8aa82 -> #f8b08b | --c-code-number-lane-txt #fbd7c5 -> #fbd7c4 | --c-code-string-txt #1dd862 -> #1ee066 | --c-code-string-lane-txt #aef4c8 -> #adf4c7
synthwave (11): --c-code-comment-txt #959ba6 -> #abafb8 | --c-code-comment-lane-txt #bbbfc6 -> #bbbec6 | --c-code-keyword-txt #9c84ff -> #b4a2ff | --c-code-keyword-lane-txt #c5b7ff -> #c4b6ff | --c-code-meta-txt #09a8cf -> #0abfec | --c-code-name-txt #6f98f1 -> #94b2f4 | --c-code-name-lane-txt #9db9f5 -> #9db8f4 | --c-code-number-txt #f46f2a -> #f79c6d | --c-code-number-lane-txt #fabd9e -> #f9bc9d | --c-code-string-txt #18b452 -> #1bcf5e | --c-code-string-lane-txt #4be785 -> #4ae784
tokyoneon (12): --c-code-comment-txt #7f8694 -> #a0a5af | --c-code-comment-lane-txt #b1b5bd -> #b0b4bc | --c-code-keyword-txt #8c70ff -> #ac98ff | --c-code-keyword-lane-txt #bdadff -> #bcacff | --c-code-meta-txt #0891b2 -> #09b0d9 | --c-code-meta-lane-txt #2acef5 -> #29cdf6 | --c-code-name-txt #5384ef -> #81a5f3 | --c-code-name-lane-txt #8aacf4 -> #8aabf3 | --c-code-number-txt #ea580c -> #f58347 | --c-code-number-lane-txt #f9b18b -> #f8b08a | --c-code-string-txt #16a34a -> #19bd56 | --c-code-string-lane-txt #1fe066 -> #1de166
tokyonight (11): --c-code-comment-txt #848b99 -> #9fa5b0 | --c-code-comment-lane-txt #b0b5bd -> #afb4bd | --c-code-keyword-txt #947aff -> #ac98ff | --c-code-keyword-lane-txt #bdadff -> #c4b6ff | --c-code-meta-txt #0898bb -> #09afd8 | --c-code-meta-lane-txt #3cd2f6 -> #3bd1f6 | --c-code-name-txt #5d8bf0 -> #82a5f3 | --c-code-name-lane-txt #95b3f5 -> #94b2f4 | --c-code-number-txt #f25b0d -> #f58247 | --c-code-string-txt #16a34a -> #19bd56 | --c-code-string-lane-txt #31e373 -> #2fe372
rosepine (12): --c-code-comment-txt #848b99 -> #9fa5b0 | --c-code-comment-lane-txt #b6bac2 -> #b5b9c2 | --c-code-keyword-txt #947aff -> #ac98ff | --c-code-keyword-lane-txt #c5b7ff -> #c4b6ff | --c-code-meta-txt #0898bb -> #09b7e2 | --c-code-meta-lane-txt #46d4f7 -> #45d4f7 | --c-code-name-txt #5d8bf0 -> #82a5f3 | --c-code-name-lane-txt #95b3f5 -> #94b2f4 | --c-code-number-txt #f25b0d -> #f58850 | --c-code-number-lane-txt #f9b694 -> #f8b593 | --c-code-string-txt #16a34a -> #1ac65a | --c-code-string-lane-txt #3ae479 -> #38e478
everforest (11): --c-code-comment-txt #a6abb4 -> #b6bac1 | --c-code-comment-lane-txt #c7cacf -> #c6c9cf | --c-code-keyword-txt #ad99ff -> #bdadff | --c-code-meta-txt #0ab8e2 -> #0cc7f4 | --c-code-meta-lane-txt #81e2f9 -> #81e1f9 | --c-code-name-txt #8bacf4 -> #9db9f5 | --c-code-name-lane-txt #b0c6f7 -> #afc6f6 | --c-code-number-txt #f6905b -> #f7a378 | --c-code-number-lane-txt #fac4a8 -> #facab1 | --c-code-string-txt #1ac65a -> #1cd862 | --c-code-string-lane-txt #89efaf -> #88efaf
dracula (10): --c-code-comment-txt #a0a5b0 -> #b0b4bd | --c-code-comment-lane-txt #bbbfc7 -> #c0c3ca | --c-code-keyword-txt #ad99ff -> #bdadff | --c-code-meta-txt #09b0d9 -> #0bc6f4 | --c-code-meta-lane-txt #63dbf8 -> #62daf7 | --c-code-name-txt #799ff2 -> #9eb9f5 | --c-code-number-txt #f58347 -> #f7a377 | --c-code-number-lane-txt #f9bd9e -> #f9bd9d | --c-code-string-txt #19bd56 -> #1bcf5e | --c-code-string-lane-txt #65ea97 -> #65ea96
kanagawa (12): --c-code-comment-txt #959ba6 -> #a5aab3 | --c-code-comment-lane-txt #c1c4cb -> #c0c4ca | --c-code-keyword-txt #a48fff -> #ac99fe | --c-code-keyword-lane-txt #cdc2fe -> #ccc1fe | --c-code-meta-txt #09a8cf -> #09b7e2 | --c-code-meta-lane-txt #64dbf8 -> #62daf8 | --c-code-name-txt #6f98f1 -> #81a5f2 | --c-code-name-lane-txt #9db9f5 -> #a5bff5 | --c-code-number-txt #f47634 -> #f58951 | --c-code-number-lane-txt #fac4a8 -> #f9c3a7 | --c-code-string-txt #18b452 -> #1ac65a | --c-code-string-lane-txt #66ea97 -> #65ea97
solarized (1): --ink-txt #98a5a5 -> #9da9a9
latte (12): --c-code-comment-txt #616874 -> #525862 | --c-code-comment-lane-txt #40454d -> #444951 | --c-code-keyword-txt #633dff -> #491dff | --c-code-keyword-lane-txt #2d00ea -> #2d00e8 | --c-code-meta-txt #06718a -> #046076 | --c-code-meta-lane-txt #045062 -> #034f62 | --c-code-name-txt #1b5cea -> #124bc9 | --c-code-name-lane-txt #0e3a9a -> #0d399a | --c-code-number-txt #af4209 -> #913607 | --c-code-number-lane-txt #7e2f06 -> #7d2e06 | --c-code-string-txt #0f7635 -> #0b622b | --c-code-string-lane-txt #0b5a28 -> #095826
gruvboxlight (12): --c-code-comment-txt #5d636f -> #4e545d | --c-code-comment-lane-txt #3c4048 -> #40444c | --c-code-keyword-txt #633dff -> #4113ff | --c-code-keyword-lane-txt #2900d5 -> #2900d4 | --c-code-meta-txt #056981 -> #03586d | --c-code-meta-lane-txt #034959 -> #024759 | --c-code-name-txt #1556e6 -> #1147bf | --c-code-name-lane-txt #0d3691 -> #0c3590 | --c-code-number-txt #af4209 -> #913607 | --c-code-number-lane-txt #742c06 -> #7d2e06 | --c-code-string-txt #0f7635 -> #0b622b | --c-code-string-lane-txt #0a5124 -> #084f22
total changed derived tokens 258
```

### Text-on-tint results

The 226 failing pairs across the 17 existing themes (case 6) are 0 after the change on all 36 rows: `npx vitest run tests/checks/look/contrast.test.ts` prints `Tests 40 passed (40)`.

## Anything in the brief that was wrong or impossible

1. The two Modern files hold no `tokenColors` list; the brief says it is a list in every file. Evidence: `python3` over `dark_modern.json` and `light_modern.json` printed `tokenColors` absent. The converter reads a missing list as empty.
2. The text-on-tint failures are 226 pairs across all 17 existing themes (case 6), not the 12, 10 and 12 pairs of three themes the brief names. Ruling 3 widens the nudge to every theme.
3. The workbench registers forms the brief's list lacks (`qe.white`, `qe.black`, `qe.fromHex(...).transparent(a)`, two colour objects); ruling 4.
4. Case 13 under the brief's `--muted` rule, and `--bg` for the plus and Visual Studio themes: rulings 1 and 2.
5. The brief's write list does not include `tests/checks/source/code.ts`, `DESIGN.md:521` or `config/catalogs/options.yml:146`, which the step cannot be correct without (the history test fails on a `.json` file under `src`; two sentences said the editor takes only the six hues); the three edits are listed above.
6. The brief says `src/lib/themes` takes two files; it takes two plus `vscode.css` and `vscode-rules.json`, eight items, under the limit of ten.
7. The lane-text case of the contrast test timed out on the unchanged tree at 5000 ms (21.3 s, load average 14.7) and passed after the change (load average 8.9). Plain `npx vitest run tests/checks` timed out five other tests under load (named above); `npm run test:checks` passes all 265.

