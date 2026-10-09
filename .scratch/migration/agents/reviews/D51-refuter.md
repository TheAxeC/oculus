# Step D51 refuter report (on .agents/worktrees/D51, base 207d4725b)

A page this report cites is named with its section. A finding in code keeps its `file:line`. Every command ran from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D51/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground, at load averages of 10 to 20 throughout.

I did not run `npm run diagrams`, because it writes `docs/diagrams/`. The diagrams test (G25, `tests/checks/diagrams/diagrams.test.ts`) compares the committed diagrams with the source in memory, and it passes under `npm run test:checks`.

Scratch work is in `$TMPDIR/d51r` (`cmp.ts`, `modern.ts`, `paint.ts`, `rules.ts`, `r13.ts`, a scratch extensions copy `app/` and a scratch tool root `root/`). No file in the worktree, the base copy, main or the ledger changed. `git status --short` at the end prints the same 24 paths as at the start, and the `shasum` of both generated files is the same before and after every converter run.

## Verification (rerun by the reviewer)

```
npm run test:quick -- --base 207d4725b
test:quick: 24 changed file(s), from git since 207d4725b
test:quick: 13 test file(s), 10 essential
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (2.3 s)
ok      svelte-kit sync (6.8 s)
ok      eslint (8.6 s)
ok      svelte-check (28.1 s): 1791553285912 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.9 s): Duration  19.66s (transform 23.74s, setup 0ms, import 41.33s, tests 8.14s, environment 4ms)
test:quick: 36.2 s (limit 45.0 s); every command passed

npx vitest run tests/checks/look/contrast.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts   (load 16.5)
 Test Files  3 failed | 2 passed (5)
      Tests  3 failed | 111 passed (114)
(rerun:) x passes every config file through the schema it is matched to 8250ms / Error: Test timed out in 5000ms.
         x reads every findingText key as a whole literal, except where a documented rule computes it 5841ms / Error: Test timed out in 5000ms.
each file alone:
 contrast.test.ts      x finds lane text painted only over its own lane surface under src/ 9908ms  Error: Test timed out in 5000ms.  Tests 1 failed | 39 passed (40)  (load 16.4)
 config-folder.test.ts Tests 25 passed (25)
 config.test.ts        Tests 31 passed (31)
 keys.test.ts          Tests 8 passed (8)
 size.test.ts          Tests 10 passed (10)
npx vitest run tests/checks/look/contrast.test.ts --testTimeout 0 --reporter verbose
 every "keeps every pair at 4.5:1 in the <theme> theme" passes for the 36 rows (light, dark, the 19 vscode-*, the 13 rice themes, solarized), and the lane text case passes in 612ms
      Tests  40 passed (40)

npx vitest run tests/checks   (default 5000 ms timeout, load 16.4 to 13.3)
 Test Files  5 failed | 12 passed (17)
      Tests  8 failed | 257 passed (265)
 all 8 failures are timeouts: history "names no package id..." 8980ms, boundaries "holds the server folders" 8094ms and "holds the state folders" 8752ms, comment-width "ends by the hundredth column..." 5193ms, keys "reads every findingText key..." 6013ms, diagrams "are what the source gives now..." 11163ms, "are named stale..." 120198ms, "reads a label node..." 120554ms
npm run test:checks   (vitest run tests/checks --testTimeout 0 --hookTimeout 0)
 Test Files  17 passed (17)
      Tests  265 passed (265)

ASCII gate (agents/spec.md, the perl command over src tests bin config utils, ! -name local.yml): no output, ascii exit 0
LC_ALL=C grep -c '[^ -~]' DESIGN.md docs/views.md utils/migrations/convert-vscode-themes.ts .scratch/migration/agents/reviews/D51-report.md: 0 each
sh utils/folder-check.sh: exit 0
sh utils/size-check.sh: exit 0
sh utils/unused-exports.sh: 364 lines; diff against .agents/worktrees/D51-base/tools/oculus/unused-exports.txt: no output, exit 0
python3 yaml.safe_load(config/appearance.yml, config/catalogs/options.yml): yaml ok
ls src/lib/themes | wc -l: 8 | ls utils | wc -l: 10 | ls utils/migrations | wc -l: 4
wc -l: vscode.css 711, convert-vscode-themes.ts 808, vscode-rules.json 3687, themes.css 776, derive.ts 317, ui/theme.ts 124, kit/load.ts 493, kit/theme/theme.ts 206, look/themes.ts 56, contrast.test.ts 262, source/code.ts 222, appearance.yml 97
grep -c "^  - { name: vscode" config/appearance.yml: 19 | grep -c "c-code" src/lib/themes/themes.css: 0

node utils/migrations/convert-vscode-themes.ts --check
19 themes up to date
check exit 0
(VS Code version: PlistBuddy CFBundleShortVersionString = 1.137.0)

shasum before, then two runs, shasum after each (the converter writes only the two generated files):
c201abe72cf98a028774e4a72dd7aec1637e1ec9  src/lib/themes/vscode.css
d4655f7c66f2d24a8880d89996cd4a61de6b696f  src/lib/themes/vscode-rules.json
wrote .../vscode.css and .../vscode-rules.json: 19 themes of VS Code 1.137.0   run1 exit 0   (same two hashes)
wrote ...: 19 themes of VS Code 1.137.0                                          run2 exit 0   (same two hashes)
npx prettier --check src/lib/themes/vscode.css src/lib/themes/vscode-rules.json: All matched files use Prettier code style!
No "clears only" line is printed, so no rule or tab label is left under 4.5:1.

Error runs against a scratch copy of the 13 theme extensions and git ($TMPDIR/d51r/app/...); the copy unchanged gives "19 themes up to date", exit 0:
--from /nonexistent: convert-vscode-themes: the extensions folder /nonexistent does not exist; name it with --from <extensions folder>   exit 1
2026-dark.json replaced by '{ "colors": ' (--check): convert-vscode-themes: <scratch>/theme-defaults/themes/2026-dark.json is not valid JSON: Unexpected end of JSON input   exit 1
2026-dark.json with include ./nothere.json (--check): convert-vscode-themes: the theme file <scratch>/theme-defaults/themes/nothere.json does not exist, included by <scratch>/theme-defaults/themes/2026-dark.json   exit 1
The two theme-file errors ran with --check so that a run could never write. build() runs before the check branch (convert-vscode-themes.ts:772), so the error path is the same one a writing run takes. The real files' hashes are unchanged.

Scratch tool root ($TMPDIR/d51r/root: a copy of the converter and the four theme sheets, linked node_modules):
 no vscode.css or vscode-rules.json, the base appearance.yml: --check exit 1; 55 lines: 19 "block ... is missing", 19 "rules of ... is missing", 17 "has no appearance.yml row"
 final outputs and rows: 19 themes up to date, exit 0
 a row vscode-bogus added: appearance.yml row vscode-bogus has no block, exit 1

The builder's scratch probes in the session scratchpad d51/, rerun:
 node cases.ts (imports conv.ts; diff against the final converter shows only exports, import paths, ROOT and comment wording): the case 1, 11, 12 and 13 blocks print byte for byte as the report quotes them
 node c8b.ts: the nine lines the report quotes, identical (vscode-monokai support.type {"foreground":"#66d9ef","fontStyle":"italic"}, keyword #fb92b8; dark and (light) 11 fixed rules)
 node c239.ts: chain keys 2026-dark 298 | dark_modern 129 | dark_vs 37 | resolved 334 | tokenColors resolved 118; foreground resolved #bfbfbf, editor.background #121314, sideBar.background #191A1B; all 19 files parse
 node tintbase.ts <base> tokens.css themes.css: light 18, dark 4, vscode-dark-modern 16, vscode-light-modern 18, mocha 18, gruvbox 12, nord 3, synthwave 14, tokyoneon 10, tokyonight 18, rosepine 18, everforest 18, dracula 11, kanagawa 11, solarized 1, latte 18, gruvboxlight 18 / pairs under 4.5:1 of 357: 226
 Present but not rerun, since my own runs above cover them: c9.ts, change.ts, c14.ts, c14b.ts, c13.ts, probe.ts, muted.ts, pairs.ts, tint.ts, tint2.ts. None was missing.

Reviewer's own runs:
 cmp.ts (the base derive.ts over the base sheets against the final derive.ts over the final sheets, the 17 base rows): total 258; for the 15 themes other than the two Modern ones the resolved block is identical and every change comes from derive.ts alone, all of them --ink-txt, --c-code-*-txt or --c-code-*-lane-txt ("non-tint by rule 0"); vscode-dark-modern 56 changes, 12 from derive.ts alone; vscode-light-modern 50, 12 from derive.ts alone
 modern.ts (base themes.css blocks against vscode.css): dark modern --card/--chip #262626 -> #202020, --c-scm-added-bg #2d382f -> #383e2a, --c-scm-deleted-bg #3b231f -> #4c1919, --c-scm-conflict-bg #412829 -> #29133d, new --tab-inactive-txt #9d9d9d, --tab-active-border #1f1f1f and the six code hues; light modern --card/--chip #f3f3f3 -> #f8f8f8, --muted #616161 -> #868686, --c-scm-conflict #a31515 -> #ad0707, the three tints, new --tab-active-txt #3b3b3b and the six code hues. window-options.ts:38 WINDOW_BACKGROUND = '#181818' and vscode.css:294 --bg: #181818
 paint.ts (the real painter() of kit/load.ts through jiti with the $lib alias, stub Monaco and Shiki parts):
  dark vscode-monokai | tokens | rules 50 | keyword #fb92b8 | support.type #66d9ef italic | bg #272822
  vscode-monokai | nord | rules 1 | keyword #81a1c1 (the Shiki theme's)
  dark | tokens | rules 11 | rice mocha | tokens | rules 11 | vscode-red | not-a-theme | rules 40 (an unknown id paints as tokens)
 rules.ts: themes 19, rules 1100, font-style only 78, pairs under 4.5 0, worst 4.50 (every rule foreground on --panel and the three tints of its block)
 r13.ts: Solarized Dark ink 4.75 muted 3.74; Solarized Light ink 4.13 muted 2.50; Monokai Dimmed ink 9.88 muted 5.15
 0.30 ms per JSON.parse of vscode-rules.json (170561 bytes), the cost the history audit gains
```

## Verdicts

Items of the brief's "What to build":

- 1: violated, Spec 1. Everything else holds: the run line and head comment, `--from` with the macOS default, the label from `package.nls.json` and the `uiTheme` from `package.json`, `JSON.parse`, the `include` chain with the includer winning and the included rules first, `semanticTokenColors` ignored, both outputs with their head comments, the prettier form, `--check` naming blocks and rows, the second run byte-identical, and `mapTheme` pure. The violation is that the missing-theme-file error does not name the flag.
- 2: holds. The scratch runs reproduce cases 1, 11, 12 and 13; `pick` at convert-vscode-themes.ts:341-367 reads own keys, then the scopeless rule, then registered defaults; `--chip` follows `--card` (435); dark themes take `color-scheme`, `--shadow` and the four tints (471-474); `slugOf` gives `[a-z0-9-]`.
- 3: holds. The git defaults are read at run time (`readGit`, 593-609). I checked all 28 `WORKBENCH` entries against `workbench.desktop.main.js` (point 4 below). Base fallbacks and registered sources are named in each block comment, and tab tokens are left out when the theme lacks the key.
- 4: holds. `derive.ts` nudges on the three tints for every theme (derive.ts:270-299); the contrast test measures `CODE_TEXT` on `TINTS` (contrast.test.ts:39-40, 65); `themes.ts:46-53` refuses a class word with no block; the threshold is unchanged; contrast 40 of 40.
- 5: holds. The 17 rows are in the brief's order and labels (appearance.yml:14-30); `+layout.svelte:12` imports the sheet; `THEME_SHEETS` is the default in `applyTheme`, `themeClasses` and `tokenNames`; the Modern rows are kept.
- 6: violated, Behaviour 1 (a rule's `fontStyle: ""` is dropped). The rest holds: `ownRules` (theme.ts:195-206), its use in `paintNow` (load.ts:429-432), the colour map and the base colours from the tokens, and an unchanged path under a Shiki theme and under a non-VS-Code theme (paint.ts).
- 7: holds. Every sentence the item names is rewritten. Two wording findings are Standards 1 and 2.
- 8: holds. `vscode.css` has 711 lines (limit 880), the JSON 3687, `themes.css` 846 -> 776, and the folders 8 and 4 items.

Cases of the brief's "Cases":

- 1: met. `node cases.ts`, and the same values in vscode.css.
- 2: met. `c239.ts`, `readTheme` (553-576), and vscode.css:253-256 (Dark 2026's own `--bg` #191a1b, `--panel` #121314 and `--ink` #bfbfbf win over dark_modern's).
- 3: met. All 19 parse (the scratch copy gives "19 themes up to date"); the invalid file stops the run naming it, exit 1.
- 4: met. Both runs above stop with the path, exit 1. The flag is missing from the theme-file message (Spec 1).
- 5: met. Two hashes identical; `--check` exit 1 naming 19 + 19 + 17 on the tree without outputs; `--check` exit 0 after; prettier passes.
- 6: met. 40 of 40 with no timeout; light Modern `--tab-inactive-txt` #717171 "from #868686" (vscode.css:46, 66); 226 failing tint pairs on the unchanged tree, reproduced with `tintbase.ts` over the base derive.ts.
- 7: met by reading. The rows are in order (appearance.yml:14-30), and `applyTheme` with `themeClass` sets the class. What the picker shows on screen is left to the look.
- 8: partial. `paint.ts` drives the real `painter` and gives Monokai its own rules (support.type cyan italic), the base colours from the block, Shiki and non-VS-Code themes unchanged. Missing: rules that reset a font style with `fontStyle: ""` are lost (Behaviour 1). The drawn editor, the diff tints and the status bar remain for the look.
- 9: met. `modern.ts` gives exactly the report's list; `--bg` #181818 matches `WINDOW_BACKGROUND`.
- 10: met by reading. `chosenTheme` (appearance.ts:91-99) keeps a saved name the list holds, and the row `vscode-dark-modern` is at appearance.yml:12. The page itself is for the look.
- 11: met. `cases.ts`: keyword #569cd6, Monokai name #a6e22e, Tomorrow Night Blue meta #ff9da4.
- 12: met. #6fc3df and #f38518. Light High Contrast takes only the three tints from base, every chrome token from registered defaults. The four themes take `--card` #252526 or #f3f3f3, and the block comments name the sources (vscode.css:76-83, 109-117, 325-332, 364-372, 640-647, 679-687).
- 13: met. `r13.ts`: muted below ink for all three; Solarized Light's comment names the 0.7 rule (vscode.css:181).
- 14: met. The converter side was run (`appearance.yml row vscode-bogus has no block`, exit 1). The `themes.ts` side was checked by reading `themes.ts:46-53`, since `themes.ts` imports a rune module that Node cannot load.

## 1. Spec

- `utils/migrations/convert-vscode-themes.ts:557-559`: "fail(`the theme file ${file} does not exist${chain.length > 0 ? `, included by ${chain.at(-1)}` : ''}`)". What is wrong: item 1 says "a missing folder or theme file stops it at the start with the path and the flag that sets it". The folder message names `--from`; the theme-file message names only the path. Failure scenario: someone runs the converter with a VS Code whose `package.json` lists a theme file missing from the install, reads "the theme file ... does not exist", and is not told that `--from` points it at another install. Verdict: item 1 violated. Fix at landing: append "; name the extensions folder with --from".
- `src/lib/ui/controls/editor/kit/look.ts:42`: "await kit.paint(token, code, document.body.className);". What is wrong: `kit/look.ts` is not in the brief's write list, which names `kit/load.ts` and `kit/theme/theme.ts`. The report lists it in its file table (look.ts 66 (65)) without marking it as outside the list. The rules file's "Where you work" requires such a path to be marked with the reason. The change itself is needed, since `paintCode` is the one caller of `kit.paint` (grep: Editor.svelte:251, DiffEditor.svelte:241, look.ts:62, all through `paintCode`). Failure scenario: the orchestrator's shared-path check reads only the three outside paths the report names and misses a fourth. No other in-flight step changes look.ts (`cmp` of D41, D46, D47, D48 and D52 against their bases). No verdict.

## 2. Proof

- none. Every count I reran reproduces: 258 derived changes, 226 failing pairs, 19 rows, the hashes and the Modern lists. The report's "23 workbench keys" (judgment call 7) is 28 in `WORKBENCH`, and `contrast.test.ts` is 262 lines, not 263. No decision rests on either number.

## 3. Standards

- `DESIGN.md:244`: "The VS Code themes are generated, not authored: ...". What is wrong: this is a negation contrast, which `agents/spec.md` "The working rules that bind every package", Prose, bans ("no 'not X but Y' construction (state the thing directly)"). Failure scenario: Axel reads the AI-tell construction his rules ban in a sentence the step wrote. Fix at landing: "The VS Code themes are generated: ...". No verdict.
- `docs/views.md:243`: "The theme list holds the 19 colour themes of VS Code (vscode dark modern, vscode light modern, light 2026, light+, ...)". What is wrong: two themes are named by their labels, and 17 by their labels without the "vscode " prefix the picker shows ("vscode light 2026"). This breaks the hub's "No synonym cycling" rule (one name per thing). Failure scenario: a reader looks for "light 2026" in the Settings list and finds "vscode light 2026". Fix at landing: give all 19 as labelled, or drop "vscode " from the first two. No verdict.
- `utils/migrations/convert-vscode-themes.ts:554-555`: "if (chain.includes(file)) fail(`the include chain of ${file} loops: ...`);". What is wrong: this guards an input that no VS Code theme has (no shipped file includes itself). Without the guard, a loop would end in a stack overflow that the `catch` at 805-807 still reports with exit 1. That is code larger than its job under `agents/spec.md` "The principles every package is judged on" (YAGNI). Failure scenario: none for a user; a reader carries two lines for a case that has not happened. Minor; the orchestrator may keep it as a clearer message. No verdict.

## 4. Behaviour

- `utils/migrations/convert-vscode-themes.ts:494-506`: "const fontStyle = rule.settings?.fontStyle?.trim() ?? ''; ... if (fontStyle !== '') out.fontStyle = fontStyle; if (out.foreground !== undefined || out.fontStyle !== undefined) rules.push(out);". What is wrong: a TextMate rule's `fontStyle: ""` means "no style" and resets a style a broader rule set. Shiki's engine reads it as `fontStyle = 0 /* None */` (`node_modules/@shikijs/vscode-textmate/dist/index.js:305-306`), and a missing key as unset, which inherits. The converter drops every `""`, which is 102 rules across eight themes (a Python count over the resolved files). So the inherited style comes back where VS Code draws none:
  - Quiet Light: `comment.block.preprocessor` resets `comment`'s italic. In `vscode-rules.json` it is `{"scope":["comment.block.preprocessor"],"foreground":"#565656"}` with no `fontStyle`, so oculus draws it italic where VS Code draws it upright.
  - Solarized Dark and Solarized Light: `markup.heading.setext` resets `markup.heading`'s bold. The generated rule is `{"scope":["markup.heading.setext"],"foreground":"#6eb3e4"}`, so it is drawn bold.
  - Tomorrow Night Blue: `markup.heading` carries both a bold rule and a `""` rule.
  
  Item 6 asks for each scoped rule with its `fontStyle`, and case 8 for "the theme's own rules". The report does not state this change. Failure scenario: under `vscode-quiet-light`, a C file's `#if 0` block comment, or a Markdown setext heading under Solarized, is drawn in a style VS Code does not use. Fix: keep `fontStyle` whenever the theme sets it, the empty string included, and keep a rule whose only setting is `fontStyle: ""`. Verdict: item 6 violated, case 8 partial.

## Declined to judge

- The drawn result on TEST (Focus, a source tab, a diff and the status bar under the seven themes the brief names; the picker; the saved Dark Modern). This needs the app, which a reviewer does not start.
- Whether the 170 KB `vscode-rules.json`, imported statically by `kit/theme/theme.ts:29`, reaches the workbench's first bundle. `Workbench.svelte:50` imports `onMac` from `kit/load.ts`, and whether the bundler drops the JSON from that bundle needs a build, which is on the landing list only.
- Whether the five tests that time out at the default 5000 ms also time out on the unchanged tree under the same load. The base copy has no `node_modules`. All 265 pass with no timeout, and the step adds 0.3 ms of JSON parsing to the history audit.
- How a later D50 interacts with the converter. D50 is not in flight and waits on open items 25 and 26. If it moves the `themes:` list out of the engine's `config/appearance.yml`, `--check`'s row comparison (`APPEARANCE_PATH`, convert-vscode-themes.ts:46) reads the wrong file.

Points the orchestrator asked about:

1. **The three paths outside the write list.** Each is needed. Before the change, `tests/checks/source/code.ts` threw on any `.json` file; `vscode-rules.json` is the only `.json` under src, tests, utils and config (`find`). Treating JSON as all code fits the language, which has no comments, so the audit has nothing to read in it. It does widen the audit to any future `.json`, whose strings pass unread, as strings in `.ts` already do. An exemption by file name would be the check-made-to-pass-by-exempting the rules ban. On every run, the history test exercises the new branch through the real JSON file. `DESIGN.md:521` and `options.yml:146` became false without their clauses. There is a fourth path outside the list, `kit/look.ts` (Spec 2).
2. **Ruling 3's 258 changes.** I reproduced all 258 with my own `cmp.ts`, and the lists for light, mocha, solarized and vscode-dark-modern match the report byte for byte. The 15 non-Modern blocks are unchanged, and every one of their changes comes from the derive.ts rule (ink, code `-txt` and code `-lane-txt` only). In the two Modern themes, 12 changes each come from the rule and the rest from the new block values, as the report says.
3. **The Modern blocks.** Every changed value is listed, and `--bg` #181818 matches `WINDOW_BACKGROUND`.
4. **The registered defaults.** All 28 `WORKBENCH` entries match the registrations: `qi` = contrastBorder, `Gl` = focusBorder, `Mo` = foreground, `uR` = tab.activeForeground, `pi` = transparent, `RMe` = rgba(155,185,85,.2) and `LMe` = rgba(255,0,0,.2). `sideBar.foreground` and `tab.activeBorder` are registered null. The `--muted` fallback is at 396-400, `settle({...ink, a: 0.7}, over())` over `--panel`. The `--bg` lead is at 359-362 and 379.
5. **The editor's own rules.** All callers are updated, and `paint.ts` shows that a chosen Shiki theme and a non-VS-Code theme get the same rules as before. No test covers `paint`; no guarded entry names it.
6. **The contrast test.** Each row measures: every `-txt` on the four surfaces (a tab `-txt` on `--bg` and `--panel`), a hue `-txt` on its own `-bg`, a `-lane-txt` on its lane, and now `--ink-txt` and the code `-txt` tokens on the three tints. `MINIMUM` 4.5 is untouched, and the diff only adds pairs and adds `VSCODE` to the reference check. The editor's 1100 rule foregrounds are measured by no test. My `rules.ts` finds none under 4.5.
7. **The five timed-out tests.** history, comment-width, keys, boundaries and diagrams are each touched by the step (`code.ts`, a changed config, a changed import graph). Alone at default timeouts: keys and boundaries pass; history, comment-width and diagrams time out at loads 10 to 17, with no assertion failing. All pass under `--testTimeout 0`.
8. **Cases 8 and 10.** The load.ts wiring of case 8 was settleable without the app, and I settled it with `paint.ts`. Case 10's code path is settled by reading; only the page remains.
9. **Sizes.** The size check does not read `.css`, so `vscode.css`'s 711 lines rest on `wc -l`, as item 8 asks. The folder check reads `src/lib/themes` at 8 items. The converter, at 808 lines, is measured by the size check.
10. **Files other steps write.** The changed line ranges are D41 DESIGN.md 23/166/575-576 and views.md 73/213; D46 DESIGN.md 142 and options.yml 857-860; D47 DESIGN.md 225/456, views.md 161/175 and options.yml 832; D48 DESIGN.md 552, views.md 7/23 and options.yml 1230; D52 views.md 97-109 and 253/257. D51's are DESIGN.md 72/244/521/565, views.md 243 and options.yml 146. None overlaps, and no hunk's meaning depends on another step's code. D46's `kit/load.ts` hunks (64, 222-226) are independent of D51's (14-22, 71, 80-88, 418-432, 487). The state file's `shared_paths` for D51 lacks DESIGN.md:521, options.yml:146 and `look.ts`.

Reviewer usage: agent id not visible to me, claude-opus-5-5, about 290,000 tokens, about 75 tool uses, about 45 minutes.
