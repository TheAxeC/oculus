## Brief check of D25 (oculus/migration), read on main at 3949d212

Commands ran from `/Users/axelfaes/workspace/research-hub` or its `tools/oculus`. The brief is `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/D25.md` (uncommitted). `plan.md` has no `## Goal` section: its opening paragraph says it is the execution ledger for `tools/oculus/DESIGN.md`. So the goal D25 delivers is taken to be its own line, `plan.md:475-483`.

The most serious findings are listed first:
- Item 12 and case 19 give the wrong colours for the two Modern themes.
- Item 13 and case 20 do not match VS Code's language picker.
- Item 2 rests on a refresh that does not happen for Files roots.
- Item 14 needs `Diff.svelte`, which is not in the path list.
- Q91, also in flight, is not named as sharing paths with D25.
- Several "Paths this step writes" line ranges are narrower than the items need.

## Names

1. `editor.paint_limit_kb` (`git grep -n "paint_limit\|paintLimit\|editorPaintLimit"`). Hits outside the paths:
   - `DESIGN.md:408` names `ui/controls/editor/kit/latex-widget.ts`, which item 7's move makes false. `DESIGN.md:408` is outside the brief's DESIGN lines (85, 391-398).
   - `tests/data/helpers/editor.test.ts:13-14` expects 64. This is inside `tests/`, but the change makes it false and no item names it.
   - `HELP.md:261` and `config/text/views/system/workbench.yml:13` (`desc_behavior`) list what `behavior.yml` holds as "the source editor's `editor.paint_limit_kb`". Both become incomplete once six more `editor.*` keys exist, and item 19 names neither.
   - Still true after the change: `HELP.md:155`, `config/text/findings.yml:67`, `tests/checks/tree/boundaries.test.ts:62`, `tests/checks/config/config.test.ts:600-625`.
2. `selectors.svelte.ts`: the new selector also has to go into the type at `:98` (`paintLimit: () => number | null;`) and the returned object at `:501`. Both are outside the named range 140-160.
3. `zones.ts` and `LineBars.svelte` (`git grep -n "zones\b...\|LineBars"`). The brief names every importer, `tests/views/whole/type-scale.test.ts:330` included. These comments name the files by bare name and stay true after the move: `DiffEditor.svelte:12`, `Editor.svelte:27`, `LineBars.svelte:2-4`.
4. `kit/latex.ts` and `kit/latex-widget.ts`. Hits that become false besides the named importers:
   - the comments at `latex-editor.ts:4`, `latex-widget.ts:4`, `latex.ts:3`, `tests/views/academic/latex-editor.test.ts:5`;
   - the revert comments at `tests/ui/controls/editor/kit/latex-widget.test.ts:158, 281, 319, 367, 392`;
   - `DESIGN.md:408` (outside the paths, see finding 1).
5. `--c-scm-modified` (`git grep -n "c-scm-modified"`). Outside the paths: `tests/ui/theme/colours.test.ts:550`, `tests/state/sources/repositories/view/repositories.test.ts:354`, `tests/views/sources/repositories/changes/change-rows.test.ts:72`. None becomes false. `colours.test.ts:549-560` is the natural place for a check that every theme sets `--c-gutter-modified`, and the brief does not name it.
6. `detectIndent` and `DEFAULT_INDENT`. Hits:
   - `tests/state/workbench/navigation/editor-text.test.ts:37-38` expects `detectIndent('one\ntwo\n')` to equal `DEFAULT_INDENT`. Item 3 makes the answer null, so this assertion becomes false.
   - The doc comment at `editor-text.ts:30-35` becomes false (inside the paths).
   - `Source.svelte:108` imports `detectIndent`, outside Source.svelte's named ranges.
   - `Source.svelte:50` (head comment, "the one chosen from the bar, or the file's own") becomes false and is outside the ranges.
   - `Diff.svelte:91, 345` and `views/sources/source/Editor.svelte:38, 93` use `DEFAULT_INDENT` and stay true.
7. `ChangeRecord` (43 hits in 17 files). The new field is optional, and the tests assert records with `toMatchObject`, so none breaks. However, `DESIGN.md:143` and `:388` say an undo puts "the earlier value ... back through the writer the change came from". Item 10 makes that false for `config-value`, both lines are outside the DESIGN lines named, and item 19 does not name them. `HELP.md:150` (Settings Save, "undoable there") should be re-read.
8. `languageMatches`: `tests/state/workbench/navigation/status.test.ts:279-307` asserts the list from `languageMatches('')` with Plain Text first. If item 13's two entries go into `languageMatches`, as "`status.ts` stays under 900" implies, that test becomes false.
9. `readText`: no other hit is affected (`git grep -n "readText\b"`). There is an unrelated `readText` in `server/content/latex.ts:88`.

## The step line

Mapping of `plan.md:475-483` to the items:
- Per-language tab size and spaces-or-tabs: items 1 and 3.
- Word wrap with Alt+Z: items 1 and 5.
- Rulers: items 1 and 6.
- Minimap, whitespace, sticky scroll: items 1 and 6.
- A key and a Settings control for each: item 1.
- `.oculus/settings.yml`: items 2 and 3.
- "Used when a file gives nothing to detect" (Z74): item 3.
- Where a value comes from (Z89): item 4.
- Every other setting at Monaco's default, said in HELP.md: item 19.
- Z260: item 7. Z261: item 8. Z319 (1) and (2): items 9 and 10. Z293: item 18.
- Z289: D13a-1 is item 11, D13a-2 item 12, D27-1 item 13, D27-2 item 14, D27-5 item 15, A1-2 item 16, A1-3 item 17.

Findings:
1. **A1-1 held out.** This is true and booked:
   - `orchestrator-state.md:147` holds Z328 under "## Open items" (`:139`);
   - `plan.md:483` says "Held out (open item Z328)".

   Z328's recommended option (a) is a /diagnose run on a scratch copy that touches nothing of Axel's. Nothing in Z328 says why that route needs Axel's authority, so holding A1-1 out of this step may be the cheaper split rather than a stop. That is for the orchestrator to judge.
2. **D27-4 stated as met.** The claim holds by reading, but the citation is wrong:
   - `languages` has fields `key`/`value` and `holds: lists` (`config/catalogs/options.yml:568-574`). `isTable` (`draft.ts:71-73`) sends it to the `pairs` form at `draft.ts:132-138`.
   - The brief cites `draft.ts:146-153`, which is the `rollup` and `records` branch.
3. **"Shows where each value comes from" (Z89 (b)).** Item 4 covers only the language records, under the `editor.languages` row. That fits VS Code's "Also modified in". Nothing shows the source of a value for the open tab (for example, that a Python tab's 2 spaces came from a root file). The plan does not require more, so this is noted, not a gap.

## Premises

Checked with `sed -n`, `grep -n`, `wc -l`, `ls` and `git ls-files` on the files named. Everything not listed below reproduces, including:
- the line counts: Editor 538, Source 528, Palette 503, DiffEditor 492, DiffSection 479, selectors 535, fs 877, Item 318;
- `c-scm-modified:` count 16, `--c-blue:` set in 13 blocks, `Search.svelte` used in 20 files;
- the Monaco defaults (`editorOptions.js:1398`, `diffEditor.js:33-34`) and Shiki 4.4.3 at `:76-91` and `:146-150`;
- the Z319 (2) lines (`undo.ts:305-313`, `block-edit.ts:317-342`, `config-checks.ts:244-257`, `changes.ts:63-88`);
- Decision 1's VS Code defaults (from the installed VS Code 1.137 extensions' `configurationDefaults`): `[makefile]` insertSpaces false, `[markdown]` wordWrap on (from markdown-language-features), `[yaml]` tabSize 2.

Premises that do not reproduce:
1. **Item 12 and case 19 have the wrong VS Code colours for the Modern themes.**
   - `#1B81A8` and `#2090D3` are VS Code's registry defaults: `workbench.desktop.main.js` gives `editorGutter.modifiedBackground` as `{dark:"#1B81A8",light:"#2090D3",...}`.
   - The Modern themes override them. `grep` of `extensions/theme-defaults/themes/*.json` prints `dark_modern.json: "editorGutter.modifiedBackground":"#0078D4"` and `light_modern.json: "#005FB8"`.
   - So `body.vscode-dark-modern` should be `#0078D4` and `body.vscode-light-modern` `#005FB8`. Case 19's "VS Code Light Modern: #2090D3" is wrong.
2. **Item 13 does not match VS Code's picker** (`nls.keys.json` and `nls.messages.json` of the installed VS Code, module `vs/workbench/browser/parts/editor/editorStatus`):
   - VS Code marks the current language `'({0}) - Configured Language'` (key `languageDescription`). `'(current)'` exists only in `chatSpeechToTextActions`.
   - VS Code's list also has "Configure '{0}' language based settings..." (`configureModeSettings`), which maps onto D25's own `editor.languages`, and "Search Marketplace Extensions...".
   - "Configure File Association" in VS Code opens a second picker, "Select Language Mode to Associate with '{0}'" (`pickLanguageToConfigure`), not the Settings view.
   - VS Code's "Auto Detect" runs content detection. The brief uses the label for "the map's language".
   - The brief says "as VS Code's Select Language Mode does" for all of this.
3. **`@id:languages` also matches `editor.languages`.** `search.ts:2-3` says "`@id:<text>` keeps the rows whose key path holds the text", so after item 1 the search shows the file-association row and the indentation/wrap row together. This affects item 13 and case 20.
4. **Item 2's refresh premise is false for Files roots.** Item 2 says `.oculus/settings.yml` "is read again when the root's files are refreshed, as every file text is".
   - `refresh(root, version)` (`fs.svelte.ts:754-758`) has one caller, `Settings.svelte:94` for `ENGINE_ROOT` (`git grep -n "refresh("`).
   - `invalidate()` runs only after fs actions, roots or bookmark writes and file undo (`fs.svelte.ts:763, 819, 828`; `explorer/ops.svelte.ts:544`).
   - A source-tab save calls only `saved(root, path)`, which is wired to `latex.onSaved` (`state/client/context.ts:326`; `source.svelte.ts:428-431`).
   - Queries run with `staleTime: Infinity` (`queries.svelte.ts:46`).
   - So editing `.oculus/settings.yml` in a source tab (decision 7), or on disk, is not seen until the page reloads.
5. **Item 7: `outlineOf` gives nothing for LaTeX.** `outline.ts:134-137` returns `null` for every language but markdown; LaTeX headings come only from the async `latexOutline(reader, text)` (`:95`). Item 7's "each heading of `outlineOf`" is wrong for LaTeX.
6. **Item 14 needs a file outside the path list.** `FileHeader.svelte` gets `path`/`oldPath` only. `DiffSection.svelte` does not know `against`: it is in the subject held by `Diff.svelte` (`compare-words.ts:40-45`; `Diff.svelte:424-450` passes no subject). `Diff.svelte` (519 lines) has to change and is not in the paths.
7. **Line numbers that are off:**
   - `status.ts:271-289`: `languageMatches` is `:276-292`, so the named write range 240-290 ends before the function's close.
   - `draft.ts:133` and `config-value.ts:166-169` for "list (strings only)": the checks are `draft.ts:115` and `config-value.ts:156`.
   - `fs.svelte.ts:519`: the fetch is `:518`.
   - `catalogs.ts:172-178`: `:171-177`.
   - `BrowserControl.svelte:117`: `:118`.
8. **"No current mark" is partly wrong.** `Palette.svelte:366-368` passes `active: source?.status.language === found.choice.name`, and `PaletteRow.svelte:45, 53` draws it as an active ToolButton. The language in force is already marked visually, though not in words.
9. **The full-folder list is incomplete for `tests/`** (`git ls-files <dir> | ... | wc -l`). These are at 10 and unnamed: `tests/routes/edit` (where the undo route tests live), `tests/state/sessions`, `tests/state/sources`, `tests/state/workbench`, `tests/views/sources`, `tests/views/sources/repositories`. The natural homes of the tests for items 5, 9, 10, 14 and 17 are among them.
10. **Item 6's "a module beside it" has no room.** `ls src/lib/ui/controls/editor` lists 10 items. After the move it is 8, plus `bars/`, plus `options.ts`, which is 10 again. So "what it needs to give up ... moves into a module beside it" has no free slot except `options.ts` itself.

## Cases and checks

1. **Case 1** passes on the unchanged tree: `DEFAULT_INDENT` is `{ tabs: false, size: 4 }` (`editor-text.ts:22`). It does not show the key is read. A non-default value (`tab_size: 3` or `insert_spaces: false`) would.
2. **Case 19** asserts the wrong Modern-theme values (Premises 1).
3. **Case 20** asserts "(current)" and the Settings search, which do not match VS Code's picker (Premises 2 and 3). The case also leaves out `configureModeSettings`.
4. **Case 13** says "once the parser has loaded", and item 7 says LaTeX "answers none" until then. If the first `provideDocumentSymbols` comes before the lazy parser loads (`createLatexReader` loads on first read, `outline.ts:78-80`), sticky scroll stays empty until the next edit. The provider can return the `latexOutline` promise instead. As written, a test that preloads the parser passes while a freshly opened `.tex` file shows nothing.
5. **Case 14 and item 7, lexical rules.** The rules (`//`, `/* */` comments, `'{'` character literals) are C's, but they are applied to `r` (comments `#`) and `rite` (`lineComment: ';'`, `kit/rite/rite.ts:293`). A `{` in an R or rite comment would open a range. No case covers r or rite.
6. **DOM cases.** Cases 11, 15/16 (the unsaved mark), 22, 23 and 24 are DOM or CSS behaviours. The rules file says those are seen at the look, and a render-to-string test of them is an audit (`spec.md:60`). The brief makes every case a test and has no look list. X3c's brief has both.
7. **Spec rule `spec.md:66`, keys** (empty, duplicated, colliding with a reserved key): no case covers `editor.languages: {}` or `null`, a duplicated language key, or a key such as `__proto__` or `constructor`.
8. **Spec rule `spec.md:66`, asynchronous paths** (in flight, after close, superseded): no case covers the root file's read while a tab opens, after the tab closes, or superseded by a tab pointed at a file of another root; nor the LaTeX symbols request superseded by a newer text.
9. **Case 7 against `config.test.ts`.** `config.test.ts:600` builds `SOUND = { ...WORDS, editor: { paint_limit_kb: 64 } }` as "the keys a configuration needs to draw no finding". Whether a missing new key is a finding is not stated (see Implied inputs 1). If it is, those tests break.

## The question

For each item: could it pass without the goal being reached?

1. **Item 1:** no; the controls come from the catalog.
2. **Item 2:** yes. Pure parse and merge tests pass while the tab never re-reads the file after an edit (Premises 4).
3. **Item 3:** yes, when tested only as a pure function. Cases 1-6 can pass while `Source.svelte` hands it the wrong root, an empty root file or the shown language instead of the chosen one. One test through the tab's derived indentation would close this.
4. **Item 4:** yes. A module test of the listing passes while the Settings view never reads any root but `ENGINE_ROOT`.
5. **Item 5:** partly. The draft `wrap` field and the action list can be tested, but whether Alt+Z fires on macOS Option is seen only at the look.
6. **Item 6:** yes. A mapping test of `options.ts` passes while `Editor.svelte` never calls `updateOptions` on change. Case 11 needs a `*.client.test.ts` over the effect, and the brief does not say so.
7. **Item 7:** yes for LaTeX (Cases 4). The C family: no.
8. **Item 8:** trivially passes. The measurement at landing is the proof.
9. **Item 9:** no. The test fails on the unchanged tree by its own wording.
10. **Item 10:** no for the byte-for-byte case.
11. **Item 11:** yes, if the test asserts only the theme rule. The bridge drops a rule with no foreground (`if (!c) return;`, `index.mjs:77`) and keys rules by colour and style, so case 18 should be asserted through tokenization. Item 11 also names no `token` for the new rule.
12. **Item 12:** yes. Verify check 3 (equal grep counts) passes with any colour, including the wrong Modern values.
13. **Item 13:** yes. Case 20 as written passes against a picker that is not VS Code's (Premises 2).
14. **Item 14:** yes. A `FileHeader` test with a prop passes while `Diff.svelte` never passes it (Premises 6).
15. **Item 15:** yes. CSS; an audit until the look.
16. **Item 16:** yes. `commentSides(made, layout)` tested with a layout passes while the drawn layout is never measured.
17. **Item 17:** yes. CSS; seen at the look only.
18. **Item 18:** no; the "100%" text renders to string.
19. **Item 19:** no, but its list misses `HELP.md:98`, `:150` and `:261`, `DESIGN.md:143`, `:388`, `:408` and `:429`, and `desc_behavior` (Names 1, 4, 7).
20. **Case 26:** a reading, an audit by design.

## Implied inputs

Each of these is missing from "Cases":

1. **A missing new key** (`behavior.yml` without `editor.tab_size` and the others): the brief does not say whether it is a finding. Expected: the default with no finding, so `config.test.ts:600-625` stays true.
2. **A Files root with no `.oculus/settings.yml`** (404 through `fileText`, `refusedAnswer`): expected no override and no "Not read" line. Item 4's wording would print a "Not read" line for every root.
3. **An empty file, a comments-only file, a file without `languages:`, or `languages: null`/`{}`:** expected read, nothing set, nothing said.
4. **A root file over `TEXT_LIMIT`** (`fileText` truncates): expected "Not read" with a reason, never a partial parse.
5. **A file that is not readable** (403 or 500): expected "Not read" with the read error, not "the parser's first line".
6. **An unknown language name or an unknown field in a root file** (`klingon:`, `tabsize: 2`): `editor.languages` gets a finding (item 1) but the root file's handling is unstated. Expected: skipped, and said under the row.
7. **Out-of-range or mistyped record values:**
   - `tab_size: 0`, `9`, `2.5` or `-1`;
   - `insert_spaces: "yes"`;
   - `rulers: 80` (a scalar), `[72, "x"]`, `[-1]`, `[0]` or `[1e9]`;
   - global `editor.tab_size: 0` or `100` (item 1 gives the 1-8 range for records only);
   - `word_wrap: true`.

   Expected: the field is not read (whole field, or per entry for rulers; the brief should say which).
8. **A reserved key as a language name** (`__proto__`, `constructor`) in `editor.languages` or the root file. These reach a plain-object merge. Expected: not merged, and a finding.
9. **`Python` vs `python`** (case): expected an unknown-language finding.
10. **Which language picks the record:** for a language chosen from the status bar (a `.txt` switched to Python) and for a file over the paint limit shown as `plaintext`, item 3 does not say. Expected: the language in force for the tab.
11. **A tab with no root** (X3c's New Text File, an untitled text): expected no root file lookup.
12. **Alt+Z when the configured wrap is `bounded` or `wordWrapColumn`:** VS Code's toggle returns to the configured value on the second press. Item 5's off/on can end on `on` instead. Expected value unstated.
13. **A stored draft `wrap` of `'bounded'`, `1` or `true`:** expected `null` (the configured value).
14. **A malformed `replaced` on a log line** (offset negative, not an integer, past the file's end; before or after not strings). JS `slice` with a negative offset counts from the end, so an `after` text could match there. Expected: treated as absent and undone as now. Also undo of that undo (`undoes`, `DESIGN.md:388`): the brief does not say whether the second record carries `replaced`. Expected: yes, so the redo is byte-faithful.
15. **A CRLF file in item 10's prefix/suffix record:** expected the bytes back unchanged.
16. **A root label with spaces or markup** in item 4's link: Svelte escapes it, so the cost is low. No case.

## ADRs

None. `ls tools/oculus/docs/adr` prints "No such file or directory", as does `ls docs/adr`. `grep -n '^adr' .agents/plan.yaml` prints nothing (exit 1). `ls tools/oculus/docs` shows only `diagrams`.

## Shared paths with X3c

X3c's worktree (`.agents/worktrees/X3c`, base ddcd610c) holds only test changes so far (`git status --short`), so this compares X3c's brief items with D25's ranges. `git diff --stat ddcd610c 3949d212` touches only `.scratch` files, so both are cut from the same source.

1. **`source.svelte.ts`: the ranges overlap.** X3c item 16 changes the `rendered` default at `:106` and its doc comment at `:93-95`. Both fall inside D25's named 75-120, where D25 adds `wrap` after `:83` and `:112`. The hunks are 5-8 lines apart, so a clean merge is likely but not verified. D25 also needs the interface (around `:226`, `setSourceIndent`) and the returned object (around `:434-447`), outside its ranges.
2. **`Source.svelte`:** no overlap between D25's 160-185, 320-340 and 455-485 and X3c's areas (`title` `:149`, the toolbar and bar snippets around `:350-430`, `<Pane ... {bar}>` `:436`).
   - D25 also needs the import block (around `:100-140`), outside its ranges, where Q91 edits `:82`.
   - The file is 528 of 540 lines. Neither brief says how the two steps' additions stay under the limit, and `spec.md:45` says a file within 20 lines of its cap is split.
3. **`Palette.svelte`:** no overlap at 215-230. D25 really needs `:120-170` (count and values) and `:351-375` (the language list markup), outside its range. X3c item 13 changes how palette rows draw, mainly in `PaletteRow.svelte`.
4. **`status.ts`:** none. X3c is `repoStatus` `:169-206`, D25 is 240-290 (the function ends at `:292`).
5. **`fs.svelte.ts`:** none. X3c's home folder goes into `readWorkspaces` (`:488-503`) and its shape; D25 edits `:518`. The file is 877 of 900 lines and both steps add to it.
6. **`catalogs.ts`:** none (X3c `VOCAB_KEYS` `:19-34`, D25 `:155-185`).
7. **`options.yml`:** none (X3c's `wrap_tabs` in the appearance section around `:92-104`, D25 `:290-300`).
8. **`HELP.md` and `DESIGN.md`:**
   - `HELP.md:98` (the status bar line) is likely edited by both: X3c item 19 for the diff tab's status, D25 item 13 for the language picker. It is one line, so both edits conflict.
   - `DESIGN.md:429` (status bar, `:language`) is the same risk.
   - X3c's brief cites `DESIGN.md:389` as the palette, but `:389` is "Software as a project type".
9. **Tests:** X3c has already changed four test files: `tests/state/sessions/source.test.ts`, `tests/state/workbench/navigation/status.test.ts`, `tests/shell/keys/palette.test.ts`, `tests/views/sources/source.test.ts`. These are where D25's tests for items 5, 13 and 3 naturally go. Both appending at the end of a file conflicts. The brief's shared list leaves tests out.
10. **Q91 is in flight too and not named.** The dispatch block at `orchestrator-state.md:31` reads "X3c and Q91 building". Q91's paths include:
    - `Source.svelte:82`;
    - `views/sources/source/Gutter.svelte:3`, where D25 edits `:168`;
    - `tests/views/whole/type-scale.test.ts:229` and `:237`, where D25 edits `:330`;
    - `HELP.md`, `DESIGN.md` and `docs/diagrams/`;
    - the move of `views/sources/files/tree/`, which changes the path of D25's premise file `picks.svelte.ts`.

    The brief's sentence names X3c only.

## Declined to judge

- The TEST observations behind Z319 (1) and D27-5 ("read limits" with two clear controls): they need a browser and ports 8787/8790, which this check may not use.
- The vitest probe "ended 1 sending false": rerunning it would mean creating files, which this check may not do.
- Whether Monaco's `KeyMod.Alt | KeyCode.KeyZ` fires on macOS Option+Z: needs a browser.
- Whether the X3c and Q91 merges with D25 are clean in git: no merge was run, since that would change state.
- Whether the A1-1 hold-out is a legitimate stop: that is the orchestrator's ruling on Z328.

Usage: model claude-opus-5-5, 274600 tokens, 112 tool uses, 871 s (871463 ms).
