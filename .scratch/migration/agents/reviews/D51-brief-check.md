# Step D51 brief check (on main at 18012277c)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D51.md`. The brief says it was read at 34935a601. `git diff --stat 34935a601 HEAD` lists only nine files, all under `tools/oculus/.scratch/migration/`, so the tree the premises describe is the same at head. All scratch work is under `$TMPDIR/d51check` (`map.py`, `gen.py`, `contrast.mjs`, `existing.mjs`, `diffmod.py`). Nothing in the tree was changed.

## 1. Names

- `vscode-dark-modern` / `vscode-light-modern` (classes kept, blocks moved out of `themes.css`). Command: `grep -rn -i "seventeen\|sixteen\|fourteen\|two VS Code\|vscode-dark-modern\|vscode-light-modern\|dark modern\|light modern\|dark_modern\|light_modern\|Modern block\|Modern theme" src tests config docs DESIGN.md HELP.md README.md utils --exclude=local.yml`. Hits outside the write list:
  - `src/lib/state/shared/words/appearance.ts:83` `const APP_THEME = 'vscode-dark-modern';`: still true, since the name is kept.
  - `src/lib/themes/parse.ts:15` (an example class name): still true.
  - `src/lib/shell/rail/ActivityRail.svelte:326` ("Modern themes draw the bar in the side bar's colour"): still true.
  - `docs/window.md:7` ("a page in the app with no stored theme starts on vscode dark modern"): still true.
  - `docs/views.md:243`: "The theme list includes vscode dark modern and vscode light modern." This is the guide sentence that lists the themes. Item 6 asks for that list to be completed, but the brief writes `docs/window.md`, which holds no list.
  - `src/lib/themes/tokens.css:6` "sixteen blocks". The write list names line 5 only, and the sentence runs over lines 5-6.
  - `src/lib/themes/tokens.css:59` "keeps the code readable in all seventeen": false once there are 34 themes. This line is outside the write list.
- `themes.css` as the one sheet of theme blocks. Command: `grep -rn "themes\.css\|tokens\.css" src tests utils config --exclude=local.yml`. Hits outside the write list:
  - `tests/checks/look/contrast.test.ts:12-15`: "a colour is an authored value in tokens.css or themes.css, and a failure is a finding about that value or about derive.ts". This becomes false: a value in `vscode.css` is generated, and a failure there is a finding about the converter's mapping. The file is outside the write list.
  - `src/lib/views/sessions/terminal/grid/grid-look.ts:28`: still true (it names rice blocks).
  - `src/lib/server/machine/apps/oculus.js:21`: still true.
  - Inside the write list but under-described: `src/lib/ui/theme.ts:7-10` ("The two stylesheets reach this module as text ... The caller may pass its own two sheets"). In the same file, `applyTheme`, `themeClasses` and `tokenNames` each default to `tokensCss` and `themesCss` only (theme.ts:78-118). The write-list line says only "(the raw import)".
- `themes.css` head comment, lines 12-16: the tab-colour paragraph ("The tab colours of the two VS Code Modern blocks are the ten tab keys ...") becomes false along with the first sentence. Item 6 names only "the sentence on two hand-written VS Code blocks".
- New names (`vscode.css`, `convert-vscode-themes`, the 17 new classes). Command: `grep -rn "vscode-\(2026\|dark-plus\|...\|tomorrow\)\|convert-vscode-themes\|vscode\.css" .` over the hub, excluding node_modules, .agents and .git. No hit outside `.scratch/`. The `U2-vscode.css` hits in `.scratch` are an unrelated review file.
- `appearance.yml` rows: read by `state/shared/words/appearance.ts` (`setAppearance`, `themes`) and `data/sources/config/themes.ts` (glyph and repeat findings only). Neither checks that a row's class has a block (see 5.2).

Findings:
1. `docs/views.md:243` holds the theme list item 6 asks for, and it is outside the write list. `docs/window.md` holds no list. Both guides are also removed by D49 (`plan.md:707`), so the brief should say which applies if D49 lands first.
2. `tokens.css:6` ("sixteen") and `tokens.css:59` ("all seventeen") become false. The write list names line 5 only.
3. `contrast.test.ts:12-15` (head comment) becomes false and is outside the write list.
4. `themes.css:12-16` (the tab paragraph) becomes false. Item 6 names only the first sentence.
5. `ui/theme.ts`: the head comment (7-10) and the two-sheet defaults of `applyTheme`, `themeClasses` and `tokenNames` all have to take `vscode.css`. Otherwise:
   - the Settings view's class words (`Settings.svelte:131`) lack the 19 classes;
   - `/find`, `/present/show` and `/present/print` (which call `applyTheme` with the defaults) derive a VS Code theme's tokens from `:root` alone.

   The write-list line "(the raw import)" understates this.

## 2. The step line

- "a converter that reads a VS Code theme file (`colors` and `tokenColors`, following `include`)": item 1.
- "writes oculus's theme block": items 1 and 2.
- "and the editor's colour rules into the tree": item 2, but only as the six `--c-code-*` hues.
- "every theme VS Code ships that oculus does not have added through it (... among them)": item 5.
- "each checked by the contrast test": items 4 and 5.
- "the hand-written-themes sentence of `themes.css` and `DESIGN.md` rewritten": item 6.

Findings:
1. "The editor's colour rules" is served only partly. VS Code's `tokenColors` hold dozens of scoped rules with font styles, for example Monokai's `support.type` #66D9EF italic, `variable.parameter` and `storage.type`. The brief collapses them to six hues. `theme.ts:36-76` then paints every keyword-like scope with one colour and every name-like scope with another, so under `vscode-monokai` the editor does not draw Monokai's code colours. oculus already has a path for a theme's own scoped rules: `codeRules` in `ui/controls/editor/kit/theme/theme.ts:171-181` is used for a Shiki code theme. The brief does not say why six hues meet the step line. The orchestrator should rule on it: either six hues (stated as the reading of the step line), or the theme's scoped rules written for the editor with each foreground nudged on `--panel`.

## 3. Premises

Matches, each by its command:
- `ls src/lib/themes | wc -l` = 6; `wc -l` gives code.css 60, derive.ts 295, parse.ts 87, slide.css 19, themes.css 846, tokens.css 272.
- `grep -n "^body\|^/\* ---" themes.css`: dark 18-41, dark Modern 43-79, light Modern 81-107, rice 798-, CRT 819-. All match.
- `grep -c "c-code" themes.css` = 0.
- `appearance.yml:69-70` (code_theme) and `:9-26` (17 rows) match.
- colours.ts 531 and theme.ts 181 lines.
- `+layout.svelte:11`, `ui/theme.ts:15`, `tests/checks/look/themes.ts:27-31`, `window-options.ts:35` (`#181818`) match.
- DESIGN.md:72, :244 and :565: the quoted sentences match.
- `grep -o "\-\-tab-[a-z-]*" themes.css`: the three tab tokens, in the Modern blocks and the head comment. tokens.css sets none of them.
- `ls utils | wc -l` = 10; `utils/migrations` holds 3.
- `grep -n "migrations" agents/guarded.md`: no hit.
- `node src/desktop/package.ts` is in `package.json:23`. Node v24.21.0 imported `derive.ts` directly in my scratch run.
- `culori` is at `package.json:74`, and `grep -n jsonc package.json` prints nothing.
- `.agents/plan.yaml` has no `adr` key.
- The quoted plan line equals `plan.md:708` byte for byte (Python comparison: True).
- The 19 themes, their uiTheme and path (Python over each `package.json`): match.
- The include chain 2026-dark -> dark_modern -> dark_plus -> dark_vs: matches.
- The mapping for the six quoted files: reproduced by my own resolver (`map.py`: includes followed, includer wins, `tokenColors` of included files first). Every quoted value matches, including Red's composites #a33f3f, #611414 and #bd4444, and Quiet Light's scopeless `--ink` #333333.
- `.agents/worktrees/D51-base` does not exist yet (`ls .agents/worktrees`). It is made at preparation.

Findings:
1. The "label" column is the `id` field. `package.json`'s `label` is a placeholder (`%themeLabel%`, `%darkModernThemeLabel%`) resolved by `package.nls.json`. For four themes VS Code shows a different label: "Dark (Visual Studio)", "Light (Visual Studio)", "Dark High Contrast" and "Light High Contrast" (`cat theme-*/package.nls.json`).
2. "The files are JSON with comments and trailing commas" and "`tokenColors` is a list or a path to a file": wrong for the installed app. All 19 files are one line of strict JSON (`json.loads` succeeds on each), and none gives `tokenColors` as a path. Each `theme-defaults` file has a `$schema` string `vscode://schemas/color-theme`, which holds `//` (see 6.1).
3. "`hc_black.json` names five colours": it names 11 (the `colors` dump).
4. "The dark Modern block the converter writes differs from the hand-written one in `--card` and `--chip`": wrong (`diffmod.py`).
   - Dark Modern changes in 16 values: `--card` and `--chip` #262626 to #202020. The seven Source Control values move to `body.dark`'s: added #81b88b to #16a34a, modified #e2c08d to #b45309, deleted #c74e39 to #dc2626, conflict #e4676b to #a21caf, added-bg #2d382f to #0d2e28, deleted-bg #3b231f to #351521, conflict-bg #412829 to #29133d. `--tab-inactive-txt` #9d9d9d and `--tab-active-border` #1f1f1f are added, plus six `--c-code-*` values.
   - Light Modern: `--card` and `--chip` #f3f3f3 to #f8f8f8, and `--muted` #616161 to #868686. The seven Source Control values move to `:root`'s (added #587c0c to #16a34a, and so on). `--tab-active-txt` #3b3b3b is added, plus six code values.

   Decision 1's "the visible change is `--card` and `--chip` of the dark block" is therefore wrong. The hand-written Source Control colours are VS Code's own registered defaults, and the converter replaces them with oculus's palette.
5. "Quiet Light, Red and the High Contrast themes lack keys" understates the fallback (`map.py` over all 19):
   - Default High Contrast Light holds none of the seven chrome keys. Its `colors` holds three keys.
   - Dark+, Light+, Visual Studio Dark, Visual Studio Light and Kimbie Dark lack `--muted` and `--line`; Tomorrow Night Blue lacks `--muted`.
   - Only 2026 Dark and 2026 Light hold `gitDecoration.*`, and only 2026 Dark holds `diffEditor.insertedLineBackground`. No file holds `merge.incomingContentBackground`.
   - No file holds `contrastBorder` or `contrastActiveBorder` (`grep -o '"contrast[A-Za-z]*"'` prints nothing). So decision 3's "a high-contrast theme's `--line` and `--accent` take `contrastBorder` and `contrastActiveBorder` first" never applies.
6. The reason decision 3 (and Z747's "Not chosen") gives, that VS Code's registered defaults "sit in its compiled workbench and are no file the converter can read", is wrong as stated. `out/vs/workbench/workbench.desktop.main.js` holds them, for example `"sideBar.background",{dark:"#252526",light:"#F3F3F3",hcDark:"#000000",hcLight:"#FFFFFF"}` and `"contrastBorder",{light:null,dark:null,hcDark:"#6FC3DF",hcLight:"#0F4A85"}` (`grepjs.py`). Reading minified JavaScript is fragile. A table of these defaults per theme type, kept in the converter under VS Code's MIT licence, would be the first fallback before oculus's base. Z747 dismissed that option on this wrong premise.
7. "Each run as `node tools/oculus/utils/migrations/<file> [--check]` and saying so in its head comment": true of `convert-decks.mjs` only. `migrate-joint-work.mjs:21` and `rename-program-to-pillar.ts:11` are run from `tools/oculus` as `node utils/migrations/<file> <hub>` and have no `--check`.

## 4. Cases and checks

- Cases 1-4, 6, 9 and 10 are consistent with the rules file. Cases 1-5 are scratch runs with no new test, which fits "What every package obeys" (a test exists only for a guarded entry).
- Cases 7 and 8 need a page, and the brief sends them to the landing look, which fits "A builder runs no page".

Findings:
1. Case 5, "non-zero after one byte of `vscode.css` is changed in a scratch copy", is a fault injected into a copy to see whether a check catches it. `agents/spec.md` "What every package obeys" says: "Code is never deliberately broken to see whether a test catches it: no run with the behaviour removed, no mutation, no fault injected into a copy". The global no-breakage rule says the same. An input case gives the same coverage: `--check` run on the unchanged tree, where `vscode.css` does not exist, must exit non-zero and name all 19 blocks.
2. Verify 3 says `node utils/migrations/convert-vscode-themes.ts --check` "(from the hub's root as its head comment says)". The section header says "Run from `tools/oculus`". From the hub's root the path is `tools/oculus/utils/...`, so the command and the parenthetical disagree.
3. Verify 2 names `tests/checks/tree/size.test.ts` among the checks of item 7. Neither it nor `utils/size-check.sh` measures `.css`: the `find` matches `*.ts *.svelte *.mjs *.js *.sh` only. So `vscode.css`'s 880-line limit rests on `wc -l` alone (Verify 6).

## 5. The question

- Case 1: no. It pins the six quoted outputs.
- Case 2: no.
- Case 3: no. It reads a synthetic file, but see 6.1.
- Case 4: no.
- Case 5: yes. See 5.6.
- Case 6: yes. See 5.1 and 5.2.
- Case 7: no, at the look.
- Case 8: yes. It checks that "the editor's background, text and syntax colours are the block's", which is true of any block. It does not check that the diff and Source Control colours are the theme's (5.4).
- Case 9: no. It lists values.
- Case 10: no.
- The step line's check (contrast): yes, see 5.1.
- Items 1-7: yes for items 1-4, as below. No for items 5-7.

Findings:
1. Item 4 and case 6 pass by construction for the chrome. `derive.ts` nudges every `-txt` token on the four surfaces, and my run of derive.ts over all 19 generated blocks (`gen.py` and `contrast.mjs`, the test's own pairs) found 0 failing pairs. The test does not measure code or ink text on the diff tints, which the diff and merge editors draw (`colours.ts:504-505`, `--c-scm-*-bg`). Those pairs fall under 4.5:1 in 13 of the 19 new blocks, for example:
   - Solarized Light: `--ink-txt` on `--c-scm-deleted-bg` 3.82;
   - Quiet Light: `--c-code-keyword-txt` on `--c-scm-deleted-bg` 3.42;
   - Light 2026: keyword on added-bg 3.97.

   The gap already exists today (`existing.mjs`): `light` 12 pairs, `vscode-dark-modern` 10, `vscode-light-modern` 12. D51 maps the tints, so it is the step that sets those values. The orchestrator should rule whether G26's test gains these pairs here or the gap is booked as a separate concern.
2. The contrast test measures picker rows, not blocks. `NAMES` comes from `appearance.yml` (`tests/checks/look/themes.ts:36`), and `resolveTheme` returns `:root` for a class with no block (`parse.ts:80-86`). So a row whose class misses its block, from a slug mismatch, passes as the light theme, and a block with no row is never measured. No case checks that the 19 rows and the 19 blocks name the same classes.
3. The fallbacks hide wrong themes (`gen.py`, `contrast.mjs`):
   - Default High Contrast Light is oculus `light` in every chrome token.
   - Default High Contrast draws `body.dark`'s navy `--line` #243049 (1.59:1 on #000000) and `:root`'s orange `--accent` #bd5d38, where VS Code draws #6FC3DF borders.
   - Dark+ and Visual Studio Dark have `--bg`, `--panel`, `--card` and `--chip` all #1E1E1E, under `body.dark`'s slate muted and navy line.
   - Light+ and Visual Studio Light are all #FFFFFF under `:root`'s slate. Their `--card` comes from `sideBarSectionHeader.background` `#0000`, which is fully transparent.

   Every case passes with these. Case 8's look covers HC dark but not HC Light or Dark+.
4. Source Control: 17 of the 19 themes take oculus's palette for every Source Control token, and the Modern themes lose VS Code's own values (3.4). `--c-scm-conflict-bg` from `merge.incomingContentBackground` is also the wrong meaning: that key is VS Code's incoming-change colour, which oculus itself paints from `--c-blue 33` (`colours.ts:460`). It fires for no installed theme.
5. `--muted`'s key list starts with `tab.inactiveForeground`, so secondary text reads stronger than body text on `--panel` in three themes:
   - Solarized Dark: muted 5.61 against ink 4.75;
   - Solarized Light: 4.99 against 4.13;
   - Monokai Dimmed: 11.70 against 9.88.

   The contrast test passes on all three.
6. `--check` proves only that the committed file equals a fresh run against the installed VS Code. That holds right after a run by construction. It cannot run where VS Code is absent, and it says nothing about the mapping. It is not proof of items 2-4.
7. Item 2 does not say how a token's several scopes rank. The quoted values follow "first scope of the list that some rule holds, then the last such rule". The other reading, the last rule holding any of the scopes, gives Dark Modern keyword #C586C0 (`keyword.control`) for #569cd6, and Monokai name #66D9EF for #A6E22E.

The tokens the brief does not map, under the new themes:
- `--c-code-*` in the rice blocks: no theme block sets one (`grep -c c-code themes.css` = 0), so the rice themes are unchanged.
- Seti: derived per theme from `--panel` against `--ink` (`derive.ts:245-252`), so it stays right.
- The orange status bar: `:root`'s `--c-orange`, and `--on-c-orange` on `--c-orange-hover` is measured. It stays right.
- The Focus lanes: derived from hue and `--panel` and measured. They stay right.
- Not mapped and not in the step line: the 16 `terminal.ansi*` keys six themes ship (`grep -o '"terminal.ansi'` counts), and the palette hues Monaco paints from (`--c-blue` 12 keys, `--c-orange` 11), which stay `:root`'s.

## 6. Implied inputs

Findings (each missing from "Cases"):
1. `//` inside a string in a one-line file. This happens: the `$schema` value `vscode://schemas/color-theme` in all 10 `theme-defaults` files. A comment stripper that ignores strings drops the rest of the line, which is the whole file. Expected: string contents kept and the file parsed as it is.
2. Labels from `package.nls.json`, through `%placeholder%` in `package.json` (happens for all 19). Expected: the brief states where the slug and the row label come from (see 8.1).
3. A scope given as a comma string. This happens in Monokai, Monokai Dimmed and Tomorrow Night Blue, and Tomorrow Night Blue's only `meta.tag` sits in one. Expected: split on commas and trimmed, giving Tomorrow Night Blue meta #FF9DA4; read whole, meta falls back.
4. Hex of 3 or 4 digits, including alpha 00. This happens: `#833` (Red `button.background`), `#FFF`, and `#0000` (`sideBarSectionHeader.background`, which becomes `--card` for Dark+, Light+, Visual Studio Dark and Visual Studio Light). Expected: expanded first. A fully transparent value should count as no value and go to the next key, or the brief should state that `--card` equals `--panel` for these four.
5. Rules with no usable foreground. This happens: fontStyle-only rules in every theme, and `"foreground": ""` in Monokai Dimmed. Expected: such a rule is never "the last rule" for a code token.
6. `semanticTokenColors` (happens in dark_plus, dark_vs, hc_black, light_plus and light_vs). Expected: ignored, since `kit/theme/semantic.ts` colours semantic tokens from the TextMate rules, and the converter's head comment says so.
7. A VS Code update that adds, renames or removes a theme (will happen). Expected: the converter or `--check` names any block without a row and any row without a block, since such a row silently resolves to `:root` (5.2). The `vscode.css` head comment names the VS Code version it was generated from (1.137.0 today, read from `Info.plist`).
8. The generated file and prettier. Expected: `vscode.css` is what `npm run format` leaves unchanged, checked by a prettier check of the file. Otherwise the verify list's format step rewrites it and `--check` then fails. The same holds for the comment-width check (G23) and the history check (G22) on its comments.
9. uiTheme comes from `package.json`, not from the file's own `type` (Monokai and 2026 Dark carry `type`; most themes do not). Expected: the pure mapping takes uiTheme as an input.
10. A base that lacks the token (low cost). `body.dark` sets no `--accent`. Expected: the fallback is the token as `body.dark` resolves over `:root` (#bd5d38), stated.
11. Slugs must match `parse.ts:17`'s `body\.[a-z0-9-]+`. Expected: `+` and parentheses are never in a class. Otherwise `parseBlocks` skips the block and the row resolves to `:root`.

Not happened and low cost, so not required: `editor.background` with an alpha (composite over the base's `--panel`), an include relative to another folder, a `settings` key in place of `tokenColors`, and a saved name of a removed row (`chosenTheme` falls back, `appearance.ts:91-99`).

## 7. ADRs

- `.agents/plan.yaml` has no `adr` key, and `find . -name adr -type d -not -path '*/node_modules/*'` prints nothing. No record.

Findings: none.

## 8. Dictated text

- The quoted plan line (`grep -n "plan.md:708" D51.md`, line 11): holds, equal to `plan.md:708`.
- The ruling quote, line 13: holds (`plan.md:1609`, item 11).
- "Everything in the brief is done" (`grep -n` finds line 153): holds.
- "no glossary" (line 157): holds. `ls tools/oculus/docs` has no `glossary.md`.
- Item 5's class names and labels (`grep -n "vscode-2026-dark" D51.md` finds line 66): break the brief's own decision 5 ("`vscode-` and VS Code's label as a slug") and its label rule ("vscode " and VS Code's label in lower case).

Findings:
1. The classes and labels of item 5 do not follow the stated rule from either source of "label":
   - From the `id`: "Light 2026" gives `vscode-light-2026`, not `vscode-2026-light`; "Default High Contrast" gives `vscode-default-high-contrast`, not `vscode-high-contrast`; and the label would be "vscode light 2026" beside the class `vscode-2026-light`.
   - From the shown label: "Dark (Visual Studio)" and "Dark High Contrast".

   "Dark+" cannot be a class (see 6.11). The brief should give the table of id, class and label outright.
2. Item 5's list is not in the order its rule names (light, dark, high contrast, each by label). Case 7 checks "the order of item 5". The order also depends on which label is sorted, because "Light (Visual Studio)" and "Visual Studio Light" sort to different places.

## Declined to judge

- Whether six code hues are an acceptable reading of "the editor's colour rules" (2.1), and whether a table of VS Code's registered defaults should precede oculus's base as the fallback (3.6, 5.3). Both are design rulings for the orchestrator under self-rule, or for Axel if he takes them.
- How the new themes look on screen. The figures above are computed ratios and token values, not a look on TEST.
- Whether D49 lands before D51, which decides where the theme list lives (1.1).

Agent usage: this brief-check agent (id not visible to me), claude-opus-5-5, about 250,000 tokens, 62 tool uses, minutes not measured.

Usage (filled by the orchestrator from the completion notice): a3f85385ee8a110b3, claude-opus-5-5, 261,325 tokens, 73 tool uses, 15.3 min.

## Closed

Each finding is closed by a change to `agents/briefs/D51.md`, the choices booked as Z750 (which replaces Z747).

- 1.1 (`docs/views.md:243` holds the theme list): item 7 writes `docs/views.md:243`, the path list names it, and `docs/window.md` and `HELP.md` leave the path list (HELP.md names no theme). Whichever of D51 and D49 lands second carries the other's text.
- 1.2 (`tokens.css:6` and `:59`): item 7 and the path list name `tokens.css` lines 5-6 and 59.
- 1.3 (`contrast.test.ts:12-15`): item 4 rewrites the head comment, and the path list names the file.
- 1.4 (`themes.css:12-16`): item 7 drops the tab paragraph with the first sentence; "What is on the tree" names it.
- 1.5 (`ui/theme.ts` defaults): item 5 has `applyTheme`, `themeClasses` and `tokenNames` take `vscode.css` by default and the head comment speak of three sheets; "What is on the tree" names the readers.
- 2.1 (the editor's colour rules): new item 6, each VS Code theme's own scoped rules in `vscode-rules.json`, nudged to 4.5:1, taken by `kit/load.ts` under `code_theme: tokens`; decision 6; case 8 checks Monokai's `support.type`.
- 3.1 (label is the id): the table of 19 themes gives the label VS Code shows from `package.nls.json` beside the id; item 5's table and decision 5 use the shown label.
- 3.2 (strict JSON, no tokenColors path): premises corrected; item 1 parses with `JSON.parse`; case 3 replaced; the comment stripper and the path form dropped.
- 3.3 (`hc_black.json` names 11 colours): corrected.
- 3.4 (the Modern blocks change in more than `--card`): the paragraph after the mapping run lists what the first mapping changed; decision 1 no longer names one change; case 9 lists the final values.
- 3.5 (the fallback understated): the premises list each theme's missing keys and the absent `contrastBorder` keys.
- 3.6 (the registered defaults are readable): item 3 takes VS Code's registered defaults first, the git extension's file read at run time and the workbench's as a table in the converter; decision 3; Z747 replaced by Z750.
- 3.7 (how the converters are run): item 1 and Verify 3 run from `tools/oculus`, as `migrate-joint-work.mjs` and `rename-program-to-pillar.ts` say; the premise corrected.
- 4.1 (case 5 was a fault injected into a copy): case 5 now runs `--check` on the unchanged tree, where the outputs do not exist.
- 4.2 (Verify 3's directory): the parenthetical removed.
- 4.3 (the size test reads no `.css`): item 8 checks `vscode.css` by `wc -l`, and the premise says so.
- 5.1 (text on the diff tints): item 4 has `derive.ts` nudge `--ink-txt` and the code `-txt` tokens on the three tints for every theme and the contrast test measure those pairs; decision 7; case 6 quotes the unchanged tree's failures.
- 5.2 (a row without a block passes as light): item 4 has `themes.ts` fail such a row and item 1 has `--check` name it; case 14.
- 5.3 (fallbacks hide wrong themes): closed by 3.6's change; case 12 checks Default High Contrast, Default High Contrast Light and the four themes with the transparent `#0000`.
- 5.4 (Source Control): the git defaults come from the git extension (item 3); `--c-scm-conflict-bg` keeps the base's value, `merge.incomingContentBackground` dropped (item 2).
- 5.5 (`--muted` stronger than `--ink`): item 2 skips such a candidate; case 13.
- 5.6 (`--check` proves only equality with a run): kept as that fact check; the mapping is proved by cases 1, 2, 11, 12 and 13.
- 5.7 (the scope ranking): item 2 states it; case 11 checks Dark Modern's keyword and Monokai's name.
- 6.1 to 6.11 (implied inputs): 6.1 the `//` in `$schema`, case 3; 6.2 labels from `package.nls.json`, the theme table and item 1; 6.3 comma-separated scopes, item 2 and case 11; 6.4 three- and four-digit hex and alpha `00`, item 2 and case 12; 6.5 rules with no foreground, item 2; 6.6 `semanticTokenColors` ignored, item 1; 6.7 a VS Code update, `--check` naming rows and blocks that do not match and the version in the head comments, item 1; 6.8 the prettier form and the comment checks, item 1 and case 5; 6.9 `uiTheme` from `package.json`, item 1; 6.10 `body.dark` over `:root` for `--accent`, item 3; 6.11 the class characters, item 2.
- 8.1 and 8.2 (classes, labels and order of item 5): item 5 gives the table outright in its order, and decision 5 states the rule it follows.
- Dictated text added after the check, held line by line: the 17 rows of item 5's table (each class `vscode-` and `[a-z0-9-]`, each label "vscode " and the shown label in lower case, ASCII, matching the rows' form at `config/appearance.yml:12-13`): holds.
- Declined to judge, terminal ANSI colours and the Monaco palette hues: not in the step line, left as they are; D51 maps the tokens its line names.
