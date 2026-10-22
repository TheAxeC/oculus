# Brief check of O65 (`.scratch/migration/agents/briefs/O65.md`, read on main at 5a88d90c)

## Names

The names were grepped with `grep -rn "<name>" src tests docs README.md .scratch/migration/agents/guarded.md` and `grep -rn --exclude=local.yml "<name>" config`. These are the hits outside "Paths this step writes":

- `fitOneRow`, `DROP_ORDER`, `data-left-out`, `leftOut`: no hit outside the three status files. `grep -rln --exclude=local.yml "leftOut|fitOneRow|DROP_ORDER|data-left-out|one-row" config` exits 1. Two other functions match the brief's own unanchored grep: `leftOutTabs` (`src/lib/shell/panes/PaneView.svelte:91`, `src/lib/state/workbench/layout/index.ts:118`) and `leftOutSources` (`src/lib/data/snapshot/normalise-parts/retrieval.ts:196`, `src/lib/data/snapshot/validate-kinds.ts:7,15,46`). The brief names only `leftOutTabs`. The change does not make either one false.
- `one-row`: `tests/server/machine/pty/channel.test.ts:78` ("the one-row pane of the screen", a terminal pane) and `.scratch/migration/agents/guarded.md:170` (it matches inside `clone-rows.test.ts`). Neither is made false. However, the brief's verification 3, `grep -rn "leftOut\b\|fitOneRow\|DROP_ORDER\|one-row" src docs tests`, prints `tests/server/machine/pty/channel.test.ts:78` on any tree, so "prints nothing" can never hold. The grep needs `one-row\.ts\|'./one-row'` in place of `one-row`, and `data-left-out` added.
- Inside the written files, sentences the brief does not list: the two CSS comments of `StatusBar.svelte`, `:356-358` ("The bar and its groups clip, which scrolls nothing, so the focus never brings a clipped row into view") and `:378-381` ("the items that do not fit are left out whole (one-row.ts)"), both made false. The DROP_ORDER doc comment `status-items.ts:72-73` goes with the constant. Item 1 names only "the head comments of `StatusBar.svelte` and `status-items.ts`". `status-items.ts`'s head comment (lines 1-29) does not mention leaving items out.
- `registerSettings`: `src/lib/ui/controls/editor/kit/load.ts:101,358` (the import and the call) and the two references to `kit/rite/settings.ts` in `src/lib/ui/controls/editor/kit/rite/rite.ts:7,284`. All stay true. The head comment of `settings.ts:4`, "The languages Monaco registers itself (C, C++, Lua, Ruby, SCSS, Java, Dart) keep its own settings", is in the write list. It is already incomplete, and julia (below) makes it false.
- `LATEX_CHORD_SECONDS`, `cmd_item`, `cmd_surround`: only `editor-keys.ts`, `latex-tab.svelte.ts`, `rows.ts` and `config/text/views/academic/latex.yml`, all in the write list. `latexPresses` (`src/lib/data/helpers/keys/oculus-keys.ts:18,84`) reads first presses only. The new second presses do not reach it, so it stays true.
- Help lines: `docs/HELP.md:122` and `:160-169` are in the write list. The following hits are outside it and become false only if an item 4 fix changes what the editor gives up: `docs/HELP.md:128` ("A key the editor gives up to the palette (Cmd+K and the chords under it)"), `docs/HELP.md:173` ("Cmd+K | palette"), the head comment of `src/lib/ui/controls/editor/keys/monaco-keys.ts:1-6`, and `docs/palette.md:155-161`. That page is written by `npm run docs:palette` (`utils/diagrams/palette.mjs:30`) from `removedChords`, not by `npm run diagrams`, and `docs/palette.md` is not in the write list.
- `latex-settings`, `expandLineSelection`, `toggleTabFocusMode`: no hit anywhere.
- `config/catalogs/latex.yml:4` reads "follow LaTeX Workshop 10.19.0 (MIT License, Copyright (c) 2016 James Yu)". The brief says this line "already credits it", but it credits 10.19.0, while the brief has the new file credit 10.20.0. See Premises.

## The step line

This is how each part of `plan.md:706` maps to the brief:

- "the status bar scrolls left and right when its items do not fit": item 1, C1 to C4. It is carried.
- "the languages latex, bibtex, shellscript, make, matlab, ocaml, common-lisp and diff get their comment, bracket, auto-closing and surrounding settings in `.../rite/settings.ts`": item 2, C5, C6, C8.
  - The line names `settings.ts`. The brief puts LaTeX Workshop's settings in a new `latex-settings.ts` (decision 4). This departs from the path the line names, and decision 4 discloses it.
  - Item 2 also goes past the line (indentation rules, folding markers, `autoCloseBefore`, the word pattern). Those are user-visible changes, and no case covers them; see Implied inputs.
- "with a table test that every language the editor registers has a comment rule": item 3, C7. It is not carried as written. A ninth registered id, `julia`, has no comment rule (see Premises), so the test fails on nine ids and passes only if julia also gets a comment rule. No item asks for one.
- "every default key Monaco binds is pressed in a `.tex`, a `.slurm` and a `.yml` file in Chrome and each that fails is fixed at its cause": item 4, C13.
  - Moving the presses to the orchestrator's look is consistent with the rules file. `spec.md:64` says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says". `spec.md:60` makes keys part of the look on TEST, and `spec.md:65` says a press "is seen at the look on landing". A builder cannot press keys in Chrome, so this is the only lawful way to carry "pressed in Chrome".
  - My judgment is that the brief carries "pressed" but not yet "every" and "each that fails is fixed":
    - (a) The table's method misses keys. Item 4 says to read "each `kbOpts` and each `registerCommandAndKeybindingRule`". Monaco 0.57 also registers keys through Action2's `keybinding:` property and through `KeybindingsRegistry.registerKeybindingRule`. Running `grep -rlF -- "keybinding: {" node_modules/monaco-editor/esm/vs` lists 6 files, among them `editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js:17-19`, the very key item 5 is about. `registerKeybindingRule(` appears in 7 files, including `snippetController2.js`, `rename.js`, `referencesController.js`, `inlineCompletions/.../commands.js` and `coreCommands.js`. The tree already reads Monaco's whole keybinding registry at run time (`src/lib/ui/controls/editor/keys/monaco-keys.ts`, listed in the Keyboard Shortcuts view). The brief does not name it as the complete list the look can be checked against.
    - (b) The table has no column for the `when` state a press needs (suggest widget open, find widget focused, a selection, snippet mode), so the look cannot set up those rows.
    - (c) The brief does not say what happens to a row that fails at the look. The rules file's "Nothing left undone" section says it is fixed at landing or in a repair round. The brief should say so, so that "fixed at its cause" does not rest on reading alone.
- "the LaTeX tab's keys that take an editor key (Cmd+L, Cmd+Alt+[ and ]) are set against what VS Code with LaTeX Workshop binds": item 5, C9 to C12.
  - It is carried for macOS. On Linux, LaTeX Workshop binds `ctrl+l ctrl+m` for `toggleTabFocusMode`, and the brief's fixed constant `LATEX_CHORD_SECONDS` with Ctrl+Shift+M cannot hold both platforms (see Implied inputs).
  - Cmd+Alt+[ and ] also take Monaco's `editor.fold` and `editor.unfold` on macOS (`folding/browser/folding.js:588-595`, `:510-517`). LaTeX Workshop takes them too, so "stay" matches it.

Every item and case serves some part of the line; no part has no requirement. The status bar part is fully carried. The table test is not, because of julia.

## Premises

Rerun on main at 5a88d90c (`git log --oneline -1`: `5a88d90c Book rulings 250, 251 and 254 and add step O65`). These hold:

- `wc -l`: StatusBar.svelte 426, one-row.ts 49, status-items.ts 225, settings.ts 44, editor-keys.ts 70, latex-tab.svelte.ts 450, rows.ts 317, load.ts 694, grammars.ts 104, chords.ts 152.
- In StatusBar.svelte: `{@attach fitOneRow}` at `:193`; `data-left-out` with `display: none` at `:400-402`; `overflow: clip` at `:371` and `:386` (inside `:363-388`); the head comment at `:30-36`; `row-reverse` at `:390-393`.
- In status-items.ts: `leftOut` at `:114` (it ends at `:130`); `DROP_ORDER` at `:78`.
- In load.ts: `:346-348` (freedKeys) and `:354-358` (register by id, then `registerSettings`).
- `SHIKI_IDS` at `grammars.ts:24-57`, 32 ids.
- editor-keys.ts: `:11-31`, `:50-54`, `:57-59`.
- latex-tab.svelte.ts: `:374-412`.
- rows.ts: `:214-215`.
- `docs/HELP.md:122`, `:165-169`, `:168`.
- `freedKeys` at `chords.ts:93-95`.
- `spec.md:60` and `:64`.
- The highest guarded entry is G120.
- `grep -rln "registerSettings\|leftOut\|fitOneRow" tests` exits 1.
- `ls docs/adr`: "No such file or directory".

These do not hold:

1. **Julia has no comment rule, so the test fails for nine ids, not eight.** Monaco 0.57 registers `julia`, but its `conf` has no `comments` (`node_modules/monaco-editor/esm/vs/languages/definitions/julia/julia.js:1-20`: brackets, autoClosingPairs and surroundingPairs only). `registerSettings` gives none either (`grep -rn julia src --include='*.ts'` finds nothing in the editor kit). I extracted each language's comment rule from its definitions file with awk. For the 32 `SHIKI_LANGUAGES` ids:
   - Monaco configures a comment rule for 17: c and cpp (`definitions/cpp/cpp.js`), css, dart, ini, java, javascript (through `typescript.js`'s conf), json (`features/json/jsonMode.js:137-140`), lua, markdown, python, r, ruby, scss, typescript, xml, yaml.
   - `registerSettings` covers 6: rite, cmake, both Fortran forms, jinja, svelte.
   - The remaining 9 have no rule: the brief's eight plus julia.
   - VS Code's `extensions/julia/language-configuration.json` (curl) gives `lineComment "#"` and `blockComment ["#=", "=#"]`.
   - Monaco merges configurations field by field (`editor/common/languages/languageConfigurationRegistry.js:181-206`, `entry.comments || result.comments`), so a comment rule set at start survives Monaco's later lazy `conf`.
   - Monaco configures none of the eight ids: it has `shell`, not `shellscript` (`definitions/shell/register.js`), and no latex, bibtex, make, matlab, ocaml, lisp or diff definition (`ls node_modules/monaco-editor/esm/vs/languages/definitions`).
2. **The bracket count is 70, not 73.** `curl .../LaTeX-Workshop/master/syntax/latex-language-configuration.json` parsed with python gives `brackets 70`, first `['{', '}']`, last `['\Biggl\Vert', '\Biggr\Vert']`. These are also right: 26 auto-closing pairs, 22 of them closing with the empty string; surrounding pairs `{} [] () "" '' `' $$`; `autoCloseBefore`; indentation rules for `\begin`/`\end`; folding markers; and a word pattern with flag `u` and no `onEnterRules`. The bibtex file matches the brief.
3. **LaTeX Workshop "10.20.0" has no tag.** `raw.githubusercontent.com/James-Yu/LaTeX-Workshop/v10.20.0/...` and `/10.20.0/...` answer 404. The tags API lists `v10.19.0` first. `master`'s package.json says 10.20.0. Both configuration files are byte-identical at `v10.19.0` and `master` (`shasum` d0855dab3798 and 3c9185aa28be), and `v10.19.0`'s package.json already binds `cmd+l cmd+l` and `cmd+l ctrl+shift+m`. The tree credits 10.19.0 (`config/catalogs/latex.yml:4`). The brief should name 10.19.0, or a commit, so that the two credits agree.
4. **The LaTeX Workshop key bindings and `when` clauses are as the brief says, with three details it leaves out:**
   - The text chords and math chords (Cmd+L Cmd+B and so on, Ctrl+Shift+M Cmd+B and so on) also apply in `bibtex`.
   - `expandLineSelection` (`cmd+l cmd+l`) applies only to latex, context, latex-expl3, doctex and the weave languages, not to bibtex, `latex-class` (.cls) or `latex-package` (.sty).
   - `toggleTabFocusMode` (`cmd+l ctrl+shift+m`; off macOS `ctrl+l ctrl+m`) also leaves out `context`. `latex-workshop.bind.enter.key` defaults to true.
5. **The guarded.md grep exits 0, not 1.** `grep -n "one-row\|leftOut\|registerSettings\|rite/settings\|LATEX_CHORD" .scratch/migration/agents/guarded.md` prints line 170, which matches `clone-rows`. The substance holds: no entry covers these names.
6. **Cmd+K is not taken "as VS Code's workbench takes them".** Item 4's exemption reads "a press that oculus takes where VS Code's workbench takes it too (Cmd+K as a chord's first key, F1, F8) stays".
   - In VS Code, Cmd+K is the first key of chords that do reach the editor: Cmd+K Cmd+C adds a line comment, and Cmd+K Cmd+0 folds all. In oculus, Cmd+K opens the palette (`chords.ts:1-8`, `docs/HELP.md:173`). All 31 Cmd+K chords (`chords.ts:50-80`) run only from the palette.
   - Ctrl+K on macOS (Monaco's `deleteAllRight`, which VS Code keeps in the editor) and Shift+F8 are also freed, and the exemption list does not name them.
   - The basis for keeping Cmd+K is D46's line ("Cmd+K stays as it is", `plan.md:925`), not VS Code parity. Under the step line's standard ("work as VS Code's do") these chords fail. That is a clash between the O65 line and D46 which the brief settles silently on a false premise. It should be raised as an open item, or the brief should cite D46 and give each freed key (Ctrl+K included) its own row verdict.
7. **The status bar scroll can reuse an existing helper.** `horizontalWheelDelta` (`src/lib/ui/tabs/tab-strip.ts:173`, used by `tab-scroll.svelte.ts:196`) already turns a wheel's vertical travel into sideways travel for the tab strip, which already uses `overflow-x: auto; scrollbar-width: none` (`Tabs.svelte:415-416`). "Libraries checked" does not point the builder at it, and the rules file requires reuse ("a parser, a fold or a rule exists once and is reused").
8. **A JSON-to-Monaco reader for language configuration files already exists.** `languageConfiguration` in `src/lib/ui/controls/editor/kit/languages/configuration.ts:169-190` is used by `register.ts:17` for app languages. It drops `noIndent` from a `lineComment` object (`:80-94`) and does not read `autoCloseBefore`. The brief neither names it for reuse nor warns that reusing it loses make's `noIndent` and LaTeX Workshop's `autoCloseBefore`.
9. **The standard Monaco checks against is not fixed.** Monaco's `CommentRule.lineComment` accepts `{ comment, noIndent }` (`node_modules/monaco-editor/monaco.d.ts:7267`), so make's setting can be given whole. VS Code ships its own `latex` configuration as well (`extensions/latex/package.json`), and LaTeX Workshop's overrides it when installed. The brief's choice of LaTeX Workshop follows the ruling.
10. **No "LaTeX tab's own tests that touch typing" exist** (item 2, C8). `find tests/ui/controls/editor -type f` lists `reach-text.test.ts`, `lsp-transport.test.ts` and `lsp-ended-answers.test.ts`. `grep -rln 'begin{' tests` finds only the fixture `main.tex`, and no test imports `kit/latex/*` (`grep -rln "latex-editing\|editing/environments\|kit/latex\|latex-tab" tests` finds only `tests/checks/tree/boundaries.test.ts`).
11. **Verification 1 and verification 5 name rules that do not exist.**
    - Verification 1 says "each output piped through the filter the rules file names". `grep -n -i "filter\|pipe" .scratch/migration/agents/spec.md` prints nothing.
    - Verification 5 reads sentences "against the standards pages' rules on list items and sentence length". `spec.md` has no such rule; its only related line is "short bullets" for `docs/HELP.md` (`spec.md:70`).
12. **The brief names no base copy.** The state file's standing demand (`orchestrator-state.md:155`) requires each brief to name `.agents/worktrees/<step>-base/` and `unused-exports.txt` under "What is on the tree". O51 and O61 do (`briefs/O51.md:23`, `briefs/O61.md:26`). The O65 brief has neither, and no unused-exports comparison in its verify list (`grep -n "base copy\|unused-exports" briefs/O65.md` prints nothing). The same demand asks for the head comments and docs paragraphs that describe the behaviour. The brief lists `HELP.md:122` and the two head comments, but not the two CSS comments in Names.

## Cases and checks

Each case was read against `spec.md`.

- **C7** is consistent with the test rules (`spec.md:58-59`, `:79`) and ruling 250. Its expected first run, "fails ... with the eight ids named", is wrong: it fails with nine (julia).
- **C8** asks the builder to run "the LaTeX tab's tests that touch typing". None exist (Premises 10). Typing is a DOM behaviour, so it is seen at the look (`spec.md:65`), and the builder may write no new test (`spec.md:59`). C8 has to be "Look", plus a reading of `latex-editing.ts:179-198` (the Enter action) and of the `@(`, `@[`, `@{` and `\envname` suggestions.
- **C6** says each language is checked "by reading its row of the table test". The table test checks only `comments`, so it does not show brackets, auto-closing or surrounding pairs. Those are read in `registerSettings`, not in the test.
- **C11** (Cmd+L selects the line in a `.yml`) checks behaviour the step does not change. It is a regression guard and holds today.
- **C3** and **C4** check what the step must keep. They are fine as looks.
- Inconsistent with `spec.md` beyond C8: item 4's "a fix of item 4 reaches" write-list entry is open-ended. That is allowed by naming each path in the report. Its docs (`docs/HELP.md:128`, `:173`, `docs/palette.md`) are outside the list.
- No case covers the collision check `spec.md:72` requires for the two new second presses. `config/catalogs/latex.yml:142-157` maps each chord character to Cmd+character (`latexChordSecond`, `editor-keys.ts:37-47`), so a configured text chord `l` would collide with the new Cmd+L Cmd+L. The brief should state what the reader of `latex-tables.ts` does with such a row.

## The question

Could each check pass without the goal being reached?

- **C1**: yes. A wheel turn and a swipe can scroll to the bell while a swipe past the bar's end triggers Chrome's back gesture (no `overscroll-behavior` anywhere: `grep -rn overscroll-behavior src` prints nothing). The case should add "a swipe past either end does not navigate".
- **C2**: no for reaching each item. With `row-reverse` the Tab order jumps from the left group to the bell and walks back, as today; the case does not say whether that is wanted while the bar scrolls.
- **C3**: yes, if "as today" is judged from memory. The look needs a before view, which the report's before-and-after section gives.
- **C4**: no.
- **C5**: no for `.tex`, provided "typing `{`" is tried at a place not after `\begin`, `\left` or `\bigl`. LaTeX Workshop's empty-close pairs leave `{` unclosed there, and the case does not say so.
- **C6**: yes. It passes with comment rules alone.
- **C7**: yes for the rows of Monaco-configured ids. Those rows assert only that an id is in the test's own list, which is an assertion over a constant (`spec.md:65`). A wrong list, such as julia listed as configured, passes. Each `definitions/<id>/<id>.js` exports `conf` (for example `julia.js:510` `export { conf, language }`). The rows could import Monaco's own `conf` and check its `comments`, which would fail for julia and follow a Monaco upgrade.
- **C8**: yes. The tests it runs do not exist.
- **C9**: no on macOS. It is not checked on Linux.
- **C10**: no.
- **C11**: yes. It passes on the unchanged tree.
- **C12**: yes if read in `rows.ts` alone. A label in a list proves nothing (`spec.md:65`), so the look carries it.
- **C13**: yes. It passes with an incomplete table (Step line (a) and (b)).
- **The step line's own check** ("pressed ... in Chrome"): yes, through the incomplete table and the `when` states left unset.
- **Item 1**: yes. See C1, plus the scroll position and menus in Implied inputs.
- **Item 2**: yes. Julia is left out, the version is uncertain, and MATLAB's block comment is wrong (Implied inputs).
- **Item 3**: yes. See C7.
- **Item 4**: yes. The enumeration misses keys, and the Cmd+K, Ctrl+K and Shift+F8 verdicts rest on a false premise.
- **Item 5**: yes on Linux. The `.bib`, `.sty` and `.cls` behaviour is unstated.

## Implied inputs

These are inputs the step implies but the Cases do not name, each with its expected result.

1. **A swipe past the end of the bar.** A sideways trackpad swipe that reaches the bar's left or right end must not trigger Chrome's swipe-back navigation on macOS. Expected: the bar stops at its end and the page stays (for example `overscroll-behavior-x: contain` on the bar). A history-back navigation leaves the workbench, which costs the reader his place.
2. **An item that appears or leaves while the bar is scrolled.** Examples are the LaTeX item during a build, the debug item, a sessions count, or an app's item. Expected: the scroll position is kept, clamped to the new width, with no jump to either end.
3. **A resize from narrow to wide while scrolled to the bell.** Expected: the bar draws as in C3, offset 0, bell at the right edge. **A resize from wide to narrow**: the bar opens at its left end, as item 1 says.
4. **A menu or tooltip opened from an item while the bar is scrolled or the item is half out of view.** Examples are the branch picker and the repository list. Expected: the menu anchors to the visible part, and a wheel turn while it is open closes it or moves it with the item.
5. **The debug colouring and the wallpaper on a scrolled bar.** `.bar.debugging` (`StatusBar.svelte:404-414`) and `body.wall .bar` with `backdrop-filter` (`:416-424`). Expected: the orange and the translucent ground fill the whole visible bar at any scroll offset.
6. **App status items in both groups** (`AppItems.svelte:32,46`). Expected: they scroll with the rest in their present order, and hiding one from the menu works as in C4.
7. **Chrome's global thin scrollbars** (Q33) on the bar. Expected: none drawn, and the bar stays 22 px.
8. **Julia.** A `.jl` file: Cmd+/ comments with `#` (VS Code's `extensions/julia/language-configuration.json`). This is missing from the items and the cases and is needed for the step line's table test.
9. **MATLAB block comments.** Shift+Alt+A over a selection of several lines in a `.m` file. MATLAB's `%{` and `%}` must each stand alone on their own line. Monaco's block comment `["%{", "%}"]` (item 2) writes `%{ line1` ... `lineN %}`, which MATLAB reads as two line comments and leaves the middle lines as code. MathWorks' own extension (`mathworks/MATLAB-extension-for-vscode/main/language-configuration.json`, curl) uses `["\n%{\n", "\n%}\n"]` and also lists `%{` `%}` as brackets. Expected: a multi-line toggle gives valid MATLAB. The brief's invented settings for the three languages VS Code does not ship (decision 3) could take those extensions' files instead: MathWorks for MATLAB, the OCaml Platform's `languages/ocaml.json` for OCaml. That would match "as VS Code's do".
10. **`.el` and `.scm` files.** These open as `lisp`, which is `common-lisp` (`config/defaults/sources.yml:91`). The Common Lisp block comment `#| |#` is wrong for Emacs Lisp. Expected: the row says which comment each extension gets.
11. **A `.tex` file whose language is `latex` but whose tab is not a LaTeX tab.** `applies` needs `onDisk`, a root and a path (`latex-tab.svelte.ts:101-106`); examples are a file at HEAD or an untitled buffer. Expected: Cmd+L selects the line through Monaco, Cmd+/ comments with `%`, and no LaTeX chord is bound.
12. **`.sty` and `.cls` files.** They open as `latex` (`sources.yml:90`), so they get LaTeX tab chords. In LaTeX Workshop they are `latex-package` and `latex-class`, where no text chord and no Cmd+L Cmd+L applies, so a plain Cmd+L selects the line in VS Code. Expected: the brief says whether oculus keeps the chords there, as a decision.
13. **A `.bib` file in a LaTeX tab** (`latex-tab.svelte.ts:107`). In LaTeX Workshop, Cmd+L Cmd+B applies in bibtex, but Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M do not. Expected: the row for `.bib` says what Cmd+L and the two new chords do.
14. **Linux.** LaTeX Workshop binds `ctrl+l ctrl+m` for tab focus mode off macOS. `latexMathFirst` is already platform-dependent (`editor-keys.ts:50-54`), but `LATEX_CHORD_SECONDS` is a constant. Expected: on Linux, Ctrl+L then Ctrl+M toggles tab focus mode, and the Keyboard Shortcuts view shows it.
15. **A configured text chord on `l`, `w` or Enter** colliding with the chord second presses (`spec.md:72`). Expected: the row is left out with a finding, or the stated rule decides.
16. **LaTeX Workshop's empty-close pairs and oculus's `@(`, `@[`, `@{` suggestions** (`config/catalogs/latex.yml:69-79`). Expected: typing `@(` and taking the suggestion leaves no stray `)`. Also `\envname` and `\begin{` completion (`latex-suggest.ts:48`), and Enter in a list (`latex-editing.ts:179-198`). Expected as before. The new `\begin` indentation rules newly indent the line after `\begin{x}` and outdent `\end{`; the before-and-after section should state this as a visible change.
17. **LaTeX Workshop's word pattern.** Double-click, Cmd+D and word navigation on `\textbf{word}`, and the word range oculus's own LaTeX completions use. Expected: the word excludes the backslash, as in VS Code with LaTeX Workshop; the completions still replace the typed word.
18. **A key Monaco binds only under a `when` the editor never meets in a source tab**, such as `inDiffEditor` (F7 and Shift+F7) or the accessibility-help and reference-peek contexts. Expected: the row names the `when` and says "not met in a source tab". It is not counted as a failure.
19. **Commands that need a language provider** (F12, Shift+F12, F2, Cmd+., Shift+Alt+F) in `.tex`, `.slurm` and `.yml`. Expected: the row names the standard (stock VS Code with LaTeX Workshop) and whether oculus's language server for that file is running at the look.
20. **Keys Chrome reserves** (Cmd+W, Cmd+T, Cmd+N, Cmd+Shift+T, Cmd+Q) **and keys the desktop app's menu takes** (`docs/HELP.md:137-140`, "(in the app)"). Expected: the row names Chrome or the app's menu as what takes the press, and is not counted as a failure where VS Code's own window takes it too.
21. **A Makefile's tab indentation.** It is already handled: `config/defaults/behavior.yml:128` has `makefile: { insert_spaces: false }`, as VS Code's `[makefile]` default does. Make's `noIndent` comment (C6) is covered only if the setting is given as `{ comment: '#', noIndent: true }`.

## ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". There is no ADR folder.

## Dictated text

The brief dictates no words for a file. `grep -n '"[^"]*"' .scratch/migration/agents/briefs/O65.md` finds only quotations of the step line and of report phrases, such as "Everything in the brief is done" on line 113. The two places where it dictates facts are:

- `grep -n "head comment names" briefs/O65.md` finds line 25: the new `latex-settings.ts` head comment must name "LaTeX Workshop 10.20.0, its two files, the MIT License and Copyright (c) 2016 James Yu". It holds against the rules file (a head comment of what and why, with no history). The version fact is wrong against the tree (Premises 3).
- Item 5 asks for words as new keys beside `cmd_item` and `cmd_surround` and leaves the words to the builder. That holds, since `spec.md` wants every string to come from a catalog key with a reader.

`LC_ALL=C grep -n '[^ -~]' briefs/O65.md` prints nothing, so the brief is ASCII.

## Declined to judge

- Whether Monaco 0.57 handles LaTeX Workshop's empty-close auto-closing pairs exactly as VS Code does. I read only that the same core code is present (`editor/common/languages/languageConfiguration.js:122-123`, `cursor/cursorTypeEditOperations.js:306-307`). Behaviour needs typing in a page, which is the look.
- The full count and list of Monaco 0.57's default key bindings. I counted only which registration forms exist (`grep -rF` over `node_modules/monaco-editor/esm/vs`: `kbOpts` in 38 files, `registerCommandAndKeybindingRule` in 6, `registerKeybindingRule(` in 7, `keybinding: {` in 6, `keybinding: [` in 2; the counts include `.d.ts`). Building the table is the builder's work.
- Whether a GitHub release named 10.20.0 exists outside the tags. The releases API call returned an empty list, which may be a rate limit; the tag list and the 404s are what I checked.
- How the status bar's `row-reverse` right group behaves in an overflowing scroll container in Chrome. That is a layout question for the look.
- Whether the hub or a project can override `config/catalogs/latex.yml`'s chords (Cases, collision). I read only that oculus's catalog holds them and that `latex-tables.ts` drops a row it cannot use.

Usage: a6b632fc3fe084af5, claude-opus-5-5, 244624 tokens, 103 tool uses, 16 min 38 s

## Closed

Each finding is closed by a change to `agents/briefs/O65.md`, except one, which is Axel's:

1. Cmd+K and Ctrl+K against "as VS Code's do" (Premises 6): a clash between ruling 250 and D46 (ruling 28), raised as open item 258 in the state file with options (a), (b) and (c). Item 4 now says F1, F8 and Shift+F8 stay the workbench's, as VS Code's workbench takes them, and that Cmd+K, its chords and Ctrl+K follow Axel's ruling on 258. O65 waits on that ruling before its preparation commit. Ruled 2026-10-22 by Axel: (b). The brief carries it as item 6 (Cmd+K is the editor's chord key inside the editor, Ctrl+K on macOS Delete All Right, the palette outside it), with its premises under "What is on the tree" (how Cmd+K reaches the palette today), cases C24 to C31, decisions 9 and 10, verify check 7 (`npm run docs:palette` and G25's test), and the paths of item 6; item 4's Cmd+K rows are pressed like every other. The brief dictates no new line of text for item 6: it says what each sentence must say and leaves the words to the builder.
2. Julia (Premises 1): item 2 gives `julia` VS Code's settings, item 3 and C7 name nine ids, and C6 has a `.jl` row; the Monaco facts are under "What is on the tree".
3. 70 brackets, not 73 (Premises 2): corrected, rerun by the session (`brackets 70 autoClosing 26`).
4. The version (Premises 3): the brief names the tag `v10.19.0` throughout (decision 7); the session confirmed the two files equal `master`'s by shasum and that no `v10.20.0` tag answers (404).
5. LaTeX Workshop's scopes and Linux (Premises 4, Implied inputs 12, 13, 14): item 5 follows the `.bib`, `.sty` and `.cls` scopes and makes `LATEX_CHORD_SECONDS` platform-dependent; C20 and C21.
6. The guarded.md grep (Premises 5): the premise now says it prints only line 170, a match inside `clone-rows.test.ts`.
7. `horizontalWheelDelta` (Premises 7): item 1 reuses it; "Read" names `tab-strip.ts`.
8. `languageConfiguration` (Premises 8, 9): item 2 reads the files through it, extended to keep `noIndent` and read `autoCloseBefore`; `configuration.ts` joins the write list; decision 8.
9. No typing tests (Premises 10): C8 is a reading with the look as proof, and the premise says no such test exists.
10. Verification 1's filter and verification 5's rules (Premises 11): "read by its own exit"; verification 5 replaced by the unused-exports compare, the history-word grep and the name grep (Verify 5 to 7).
11. Base copy (Premises 12): named under "What is on the tree", compared in Verify 5.
12. The `one-row` grep (Names): Verify 3 now greps `one-row\.ts`, `'./one-row'` and `data-left-out`.
13. The CSS comments and the DROP_ORDER doc comment (Names): listed under "What is on the tree" and in item 1.
14. Help lines and `docs/palette.md` a fix of item 4 makes false (Names): listed under "What is on the tree", with `docs/HELP.md` lines 125-130 and 170-175 and `docs/palette.md` in the write list.
15. Item 4's enumeration, `when` states and failures at the look (Step line (a), (b), (c)): item 4 reads all four registration forms, checks against `monaco-keys.ts`'s run-time registry, adds the `when` and its look state, names rows never met in a source tab, Chrome's and the app menu's keys, and says a row failing at the look is fixed at landing or in a repair round.
16. C1, C2, C3, C5, C6, C11, C12 (The question): C1 adds no back navigation, C2 the order, C3 the before view, C5 where `{` closes, C6 how each part is read, C11 marked a guard, C12 the look as proof.
17. C7 asserting over a constant: item 3's rows read Monaco's own `conf` instead of a list in the test.
18. Implied inputs 1 to 7 (status bar): item 1 and C1, C14, C15, C16.
19. Implied inputs 8, 9, 10 (julia, MATLAB, `.el`/`.scm`): item 2, decision 3 (MATLAB and OCaml from the extensions' files, both checked by the session with curl), decision 6, C17, C18.
20. Implied input 11 (a `.tex` file outside a LaTeX tab): C19.
21. Implied input 15 (a configured chord on `l`, `w` or Enter): item 5 and C22; `latex-tables.ts:12` leaves out a row it cannot use, read by the session. The finding cited `spec.md:72` for this, which is the rule on writes that re-parse; the case stands on its own.
22. Implied inputs 16, 17 (empty-close pairs and `@(`, the word pattern, the `\begin` indentation): item 2's report list, C8, C23.
23. Implied inputs 18 to 20 (`when` never met, language servers, Chrome and the app menu): item 4.
24. Implied input 21 (Makefile tabs and `noIndent`): item 2 gives make's comment as `{ comment: '#', noIndent: true }`.
