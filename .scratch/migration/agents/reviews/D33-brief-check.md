# Step D33 brief check (on main at ede54286140fc714090e8d6484e5f785f3097b04)

`git rev-parse HEAD` printed `ede54286140fc714090e8d6484e5f785f3097b04`. `git diff --stat 3bf3bf4c6 HEAD -- src config docs DESIGN.md HELP.md tests README.md package.json` (from `tools/oculus`) printed nothing; `git log --oneline 3bf3bf4c6..HEAD` printed only d8f32d576, 9b28520de and ede542861 (M8's preparation, launch and case ruling). I changed no file, ran only read-only git, never opened `config/local.yml`, started no server and touched no port. `plan.md` has no Goal section: `grep -n '^#' plan.md` prints only `# Migration plan`, `## Packages, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`; its head paragraph names `tools/oculus/DESIGN.md` as what the ledger carries out, so "the goal" below is the part of DESIGN.md's migration that D33's line and rulings deliver.

Findings are numbered F1 to F50 across the report.

## 1. Names

The grep was `grep -rn --exclude=local.yml -w "<name>" src tests config docs HELP.md DESIGN.md README.md .scratch/migration/agents/guarded.md` from `tools/oculus`, one run per name. A second run over docs and guarded.md only (`grep -rn -E "data-card|cardCursor|LEFT_ITEMS|dataCardToggle|AuditFinding|SourceTabState|openSourceFile|reconcilePane|syncCards|statusFold|decorationOf|findingsCount|commandDiagnostics|latexDiagnostics|show_problems|problemRows" docs DESIGN.md HELP.md README.md .scratch/migration/agents/guarded.md`) printed nothing.

- `SourceTabState`: hits only in `draft.ts` (:46, :224, :225, :242, :247), which is on the write list. No hit outside the list.
- `openSourceFile`: hits outside the list are `shared/latex/Main.svelte:87` (the main file link; Main.svelte is on the list), `shared/links/SourceButton.svelte:23`, `academic/latex/Latex.svelte:162,166` (on the list), `boards/person/Person.svelte:126`, `sources/file/File.svelte:196`, `boards/personal/Personal.svelte:92`, `search/Search.svelte:149`, `doc/MarkdownPreview.svelte:75` and `source-file.ts:66` (`openReference`). None is made false: each gets `asked` stamped and keeps its arguments. `openLibraryFile` (`source-file.ts:35-46`) is not routed through `openSourceFile`, which section 5 covers (F25).
- `asked`: 906 hits in `src`, all of them the plain word or unrelated locals (`ui/tabs/Tabs.svelte:126`, `desktop/windows/bridge.ts:201`). None is a tab-state key, so nothing collides.
- `endLine`: `state/system/machine/lsp/symbols.ts:65,109,150`, `repositories/diff/diff-hunks.ts:114-118` and `files/sections/Outline.svelte:133`. These are other types of the same name and are not made false.
- `openedAtShape`: `tab-state.ts:15` and `:28` only (on the list).
- `documents.svelte.ts`'s new listing: a new name with nothing to grep. The head comment `:2-4` ("the Problems view and the Explorer's decorations read later") is named in item 1 and is on the list.
- `commandDiagnostics`: `commands.svelte.ts:221`, `:708` and `:771`, a file the step does not write; nothing there is made false.
- `latexDiagnostics`: `latex.svelte.ts:121,490,548`, and the reader `language/latex-editor.ts:68`. Not made false.
- `problemRows` and `problemFile`: hit only in the two deleted `Problems.svelte` files and in `places.ts`. All three are on the list.
- `placeOf`: about 60 hits are unrelated functions of the same name (`kit/lsp/uris.ts`, `transport.ts`, `server/content/latex/endpoint.ts`, `latex-state.ts:410`, `explorer/follow.ts:56`, `row-ops.ts:129` and others). Only `views/shared/latex/places.ts:32` goes; brief verify item 6 rightly does not grep this name.
- `show_problems`: `latex/builds.ts:292` and `latex.yml:145`. Both stay true, since Show Problems remains and opens the new view.
- `LEFT_ITEMS`: `status-items.ts:34,64,67` only (on the list).
- `findingsCount`: `navigation/status.ts:218`, and `src/routes/+page.svelte:22,174`, which the list holds only conditionally. The page call stays true.
- `decorationOf` and `statusFold`: `decorations.ts:5-6,93,126`, `Tree.svelte:60,363` and `rooted-tree.svelte.ts:19,144`, all on the list.
- `AuditFinding`: outside the list, `state/system/audit.svelte.ts:7-48` (re-export and store). Not made false; no test builds the type (`grep -rln "auditFindings\|content/audit\|signatureOf\|auditSearch\|findingsOfKind" tests` printed only `boundaries.test.ts` and `keys.test.ts`, which do not build one).
- `dataCardToggle`: outside the list, `ui/controls/ToolButton.svelte:39,86` and `views/shared/card/CardActions.svelte:160`. Not made false.
- `data-card`: `Audit.svelte:115` and `Cards.svelte:123` (on the list); `grep -rn --exclude=local.yml -E "data-card|data-status" config` printed nothing.
- `reconcilePane` and `syncCards`: `workbench-keys.svelte.ts:84,415,430,438,449,494` and `Workbench.svelte:268`, all on the list.
- The `problems` view id: `grep -rn "'problems'" src` hits `commands/routes.ts:112`, `commands/files.ts:157` and `debug/launch.ts:155`, which are unrelated `in` checks. It also hits `Latex.svelte:212-213` (`isClosed('problems')`), which goes with the section. A saved TeX view state keeps a dead `problems` section key, which is harmless. No view, rail or status id collides.
- The status item id `problems` and `item_problems`: no hit. `grep -rn "STATUS_ITEMS" src` shows the hidden set is ui state, so no config vocabulary names status items.
- Catalog sentences and head comments the change makes false, outside what the brief names:
  - `config/text/views/academic/latex.yml:87`, `none_followed: Open a LaTeX file, or pick a root, to list its commands, structure and problems.` This is false once item 8 removes the TeX view's problem list. latex.yml is on the list, but neither item 8 nor the premises name this line (F1).
  - `config/text/app.yml:12`, the keys sheet, holds "Enter | expand the card under the cursor". Items 9 and 10 make it incomplete (Enter opens the Audit finding's file, the lane card's project and the Settings field). The sheet lists F5, F9, F10 and F11 but would get no F8 or Shift+F8 row. Item 3 names app.yml:12 only for `s1-s8` and the toggle key (F2).
  - `config/text/views/sources/search.yml:1`, "Oculus text owned by the Search view: the query row, the count line and the results grouped by file". It is already silent on References, and a `problems` group widens the gap (F3).
  - `views/boards/focus/lanes/LaneCard.svelte:8-11` head comment. Q118 item 6 asked that it say Enter presses the name. The write list limits LaneCard to line 108 (F4).
- Files the build needs that are not on the write list:
  - The strip tab is drawn by `ui/tabs/TabFace.svelte` (`:29-30` head comment, `:107` `class:gone`) from the `Tab` type at `ui/tabs/tab-strip.ts:42`. Its facts are built in `shell/panes/PaneView.svelte:182-198`, which is 512 lines (`wc -l`). None of these is on the list, so item 7's tab decorations (N3) cannot be built within it (F5).
  - Monaco binds F8 and Shift+F8 itself (`node_modules/monaco-editor/esm/vs/editor/contrib/gotoError/browser/gotoError.js:222`, `:243`). oculus frees Monaco keys only in `ui/controls/editor/chords.ts:74-76` (`freedKeys`, applied at `kit/load.ts:219-221`). The workbench hears keys through `<svelte:window onkeydown>` (`Workbench.svelte:353`), which a key Monaco handles never reaches. Item 3's "Monaco's own F8 and Shift+F8 are replaced" therefore needs `chords.ts`, which is not on the list (F6).
  - `ui/controls/editor/kit/lsp/services.ts:62`, `open(target: Target, line: number, column?: number)`, is the type the opener in `hosts.ts:141-143` calls. Passing a range (item 5) and the library hand-off (item 1) change it, and it is not on the list (F7).
  - Item 10's "Enter moves the keyboard into the card's first field, through a `data-card-toggle` on that field or the existing `activateCursor` rule" has two problems. `activateCursor` (`shell/keys/key-dom.ts:54-61`) calls `control.click()`, which does not focus an input and toggles a checkbox. The first field is drawn by `views/system/workbench/editors/FieldControl.svelte` through the `ui/forms` controls (`grep -n import FieldControl.svelte`: Checkbox, NumberInput, TextArea, Select, TextInput and others). Neither `key-dom.ts` nor `FieldControl.svelte` is on the list, and FieldControl.svelte is M8's (F8).

Findings: F1, F2, F3, F4, F5, F6, F7, F8.

## 2. The step line

The step line is `plan.md:616`, read by `grep -n '^- D33 ' plan.md`, with its sub-bullets at :617-622.

- "a Problems view as VS Code's": item 2.
- "D23's diagnostics": item 1, first source.
- "the errors of D17's commands": item 1, second source, and case 2's `capture` (Z298).
- "grouped by file": item 1's fold and item 2's tree by file.
- "a press opening the file at the line": item 2's press and item 5.
- "its count on the status bar": item 4.
- "after D23 and D17": `grep -n -E "^- ✅ (D17|D23|D45|D11|D28) " plan.md` prints all five ticked (:501, :538, :551, :566, :594).
- "the Files view's problem decorations on its rows (Z182 (a))": item 7.
- Sub-bullet Z446 (Audit rows draw the cursor; Enter acts): item 9.
- Sub-bullet Z461 (the cursor survives a reload): item 11.
- Sub-bullet Step 0 (the diagnosis): item 11 and cases 31-33.
- Sub-bullets "waits for D45", "runs after D11 and D28" and the recheck at 3bf3bf4c6: met by the ticks above; the Explorer order goes to item 2 (order 8, `s8`).
- Z86 (`plan.md:847`): items 1 and 2.
- Z182 (:179, :990): item 7.
- Z196 (:1002, with :521 "D14 keeps the build log's errors and warnings and publishes them as diagnostics for D33"): item 1, LaTeX source, and the registration for D36.
- Z281 (:1090): item 1, second source (`ERROR_LINE`).
- Z298 (:1115): case 2.
- Z446 (:1251), Z458 (:1264), Z459 (:1265), Z460 (:1266): item 9.
- Z461 (:1267): item 11.
- Z468 (:1274): items 9 and 11. Z468 folds Q121 into D33 as "the card cursor across a reload, reproduced on TEST first". The reproduction was the diagnosis's, on a scratch server, and the brief names no reproduction on TEST and no part of the look for it (F9).
- Z468 also folds Q118 "whole" ("YOU ARE NOT allowed to just drop the content"). Q118's Cases section (`agents/briefs/Q118.md:96-135`) has 28 cases. D33 keeps the equivalents of Q118 cases 1, 2, 10, 13, 20, 21, 25 and 28 (D33 cases 26-29). It drops:
  - Q118 cases 3-9: boundaries, the empty state, one finding, the muted section open and closed, search hiding the row, Show muted;
  - Q118 case 12 (a row removed while it holds the cursor) and cases 14-19 (Shift+J and Shift+K, pointer over the marked row, a wrapped row, the terminal theme, a press into another pane, two Audit tabs);
  - Q118 cases 22-24 (Enter with no cursor, Tab focus on another row's mute, a press on the place or the mute);
  - Q118 case 26 (each site's file at the look) and case 27 (a file outside the hub or a folder gives the empty text);
  - item 6's LaneCard head comment;
  - the look's caution that no mute is pressed, since a mute writes Axel's `config/behavior.yml`.
  (F10)
- Z503 (:1309): item 2 leaves the TeX view at order 5.
- Z702 (:1507):
  - (1): item 2 and `layout.yml:82`;
  - (2): item 3, though case 16 does not carry its "checked on TEST and in the app" (F11);
  - (3): item 2 and the guide in item 12;
  - (4): item 4;
  - (5): item 5;
  - (6): item 6;
  - (7): item 7;
  - (8): items 1 and 2;
  - (9): item 2;
  - (10): item 8;
  - (11): item 10;
  - (12): the Cases preamble;
  - (13): item 1 and item 12;
  - (14): item 3.
- Z716 (:1521): N1 item 2; N2 item 5; N3 item 7; N4 item 10; the library goes to item 2's filter and "Libraries checked".

Findings: F9, F10, F11.

## 3. Premises

Each line below is a command run on main at ede5428, with its output against the brief.

- Language-server diagnostics:
  - `sed -n 727,738p transport.ts`: the publishDiagnostics branch at :729-737. Holds.
  - `#pageOf` :751-754. Holds.
  - `client.ts:445-448`: `if (place !== null) services.diagnostics(...)`. Holds.
  - `#mark` :479-486 and `#forget` :497-508. Holds; `:505` reads `if (reg.library !== undefined) return;`.
  - `markers.ts:11-13` `markerOwner`. Holds.
  - `lsp.ts:198` `diagnostics: documents.setDiagnostics`. Holds.
  - `documents.svelte.ts` is 101 lines; the head comment :2-4 names the Problems view; `diagnosticsOf` :70 and `countsOf` :74. Holds.
  - `relay.ts:774-776`. Holds.
  - `held/held.ts:5`. Holds.
- Command errors:
  - `commands.svelte.ts` is 777 lines, with `FOUND_MAX` :75, `ERROR_LINE` :79, `errorMatch` :100, `ranCommand` :575-577, `openAt` :633, `note` :637, `readEnded` :680, `capture` :694, `commandDiagnostics` :708-718 and the export :771. Holds.
  - `model-sessions.ts` is 730 lines, with `CommandDiagnostic` :712-723 and the doc comment at :715. Holds.
  - The press chain `grid-links.ts:39`, `context.ts:611`, `repositories.svelte.ts:313`, and `tabOfFile` `file-git.ts:85`. Holds.
- LaTeX:
  - `latex.svelte.ts` is 554 lines; `LatexDiagnostic` is `latex-state.ts:134-141`; `OWNER` at `latex-widget.ts:54`, set :282, cleared :305. Holds.
  - `academic/latex/Problems.svelte` 74 lines, imported `Latex.svelte:46`, mounted :208-215. Holds.
  - `shared/latex/Main.svelte:20` and `:125-143`, with `shared/latex/Problems.svelte` 72 lines. Holds.
  - `latex.yml:108-112` and `:145`. Hold. Of those keys, `problem`, `problems` and `problem_counts` stay: their readers are `Main.svelte:129,133` (`grep -rn "latex\.<key>'" src`), and only `problems_head` and `problems_unbuilt` lose their reader.
  - `builds.ts:292-293` and `context.ts:429-435`. Hold.
- The Explorer group:
  - `grep -rn "group: 'explorer'" -A2 src/lib/views`: orders 0, 1, 2, 3, 5, 6, 7. Holds.
  - `keyOf` `catalogue.ts:163-169`. Holds.
  - `layout.yml:82` and `app.yml:12` (`s1-s7`). Hold.
  - `grep -rn "KeyM" src/lib`: only `latex-tab.svelte.ts:333`, `:385-386`. Holds.
  - Monaco's `toggleTabFocusMode.js:18-19` is CtrlCmd+M, and WinCtrl+Shift+M on macOS. Holds.
  - `grep -rn F8 src/lib` finds no F8 binding. Holds.
- The status bar:
  - `LEFT_ITEMS` `status-items.ts:34-44` and `itemName` :70. Holds.
  - `StatusBar.svelte` is 307 lines with the findings block :143-155. Holds.
  - `statusbar.yml` :9, :10, :41, :44. Holds.
  - `status.ts:213-217` and `:218`. Holds.
  - `git ls-files src/lib/shell/status | wc -l` printed 10. Holds.
- Opening at a place:
  - `sed -n 46,66p draft.ts` shows the fields `line?` at :51, `column?` :56, `library?` :61, `id?` :63 and `head?` :65. The brief has :50, :55, :60, :62, :64, which are doc-comment lines, two of them in the middle of a comment. Differs (F12).
  - `sourceTabState` :219, `libraryTabState` :237 and `placed` :247 hold.
  - `grep -n "export type TabState" tab-state.ts` printed `44`. TabState is :44-56 against the brief's :45-57. Differs (F12).
  - `openedAtShape` :15-18. Holds.
  - `Source.svelte` is 478 lines, with :142 the destructure. Holds.
  - `SourceBody.svelte` is 208 lines, with :49-52, :95-96, :147-148. Holds.
  - `views/sources/source/Editor.svelte` is 300 lines. `grep -n` prints the props `line?` :73 and `column?` :75 (the brief has :74-75) and the default `line = 0` at :117 (the brief has :118). Differs (F12).
  - The effect :176-193 with `placed` at :141, :185-186. Holds.
  - `types.ts:78-79` and `commands.ts:21-45`. Hold; `goto` and `word` both end in `made.focus()` (`commands.ts:26`, `:45`).
  - `source-file.ts` is 67 lines with :15 and :17-29. Holds.
  - `hosts.ts:129-148`, with its comment at :144-146. Holds.
- Files decorations:
  - `decorations.ts` is 143 lines (:93, :126). Holds.
  - `rooted-tree.svelte.ts:143`. Holds.
  - `Tree.svelte` is 425 lines with :361-371. Holds.
  - `FileRow.svelte` is 162 lines (:49-52, :84-86). Holds.
  - `TreeItem.svelte` is 515 lines. Holds.
  - `colours.ts:400` and `:422`. Hold.
  - `OpenEditors.svelte:225` is 287 lines. Holds. Its row is `TreeItem` with `tone` (`TreeItem.svelte:176-177` has `warn` and `error`).
  - `strip-tab.ts:28-29`, `:40-47` (66 lines). Holds.
  - "drawn by `shell/panes/strip/PaneStrip.svelte`" differs. `PaneStrip.svelte:125` hands the tabs to `ui/tabs/Tabs.svelte`, which draws each with `ui/tabs/TabFace.svelte` (`Tabs.svelte:318`; `TabFace.svelte:107` `class:gone`), and `stripTab` is called with its facts in `shell/panes/PaneView.svelte:182-198` (F13, the same defect as F5).
- The Audit and the lane:
  - `Audit.svelte` is 300 lines with no `cardCursor`, `:115` and `:125`, and keys at :159 and :177. Holds.
  - `AuditFinding` `index.ts:330-336` (662 lines). Holds.
  - `grep -rn "add({" server/content/audit/ | cut -d: -f1 | sort | uniq -c`: 26 in projects.ts, 6 in publications.ts, 1 in rules.ts (the `add` method itself). Holds.
  - `tool-button.ts:107-108`, `LaneCard.svelte:108`, `key-dom.ts:54-61`. Hold.
  - `grep -rln "cardCursor(instance.state)" views | wc -l` printed 17. Holds.
- Settings cards: `grep -n "data-card\|<Cards"` gives `Cards.svelte:123` and `:130`, `Rollup.svelte:67` and `Editor.svelte:108`, and `grep -rln cardCursor views/system/workbench | wc -l` printed 0. Holds.
- The card cursor code: `grep -n` printed `lastFocusedPane` :93, :94, :95, `cardObserver` :96, `focusedPaneElement` :316, `cards` :334, `moveCard` :373, `cursorIn` :387, `writeCursor` :392, doc :414 with `reconcilePane` :415, `observePane` :427, `syncCards` :449, `stopCards` :458 and `rememberPane` :464. `Workbench.svelte` is 515 lines with :266-270, and `keys.ts:290`. Holds.
- Glyphs: `glyphs.yml:77`, `:79`, `:87` and `icons.yml:76`, `:78`, `:86`, with no `error` key. Holds.
- Folders: `git ls-files <dir> | sed | cut -d/ -f1 | sort -u | wc -l` printed search 6, language 6, state/system 8, shell/status 10, ui/tree 10, config/text/views/sources 10 and editors 6. Holds.
- Guarded entries:
  - `ls tests/checks/config/arrangements.test.ts` exists, and the grep over `tests` for the ten names printed nothing. Holds.
  - G28's Code line (`guarded.md:54`) names `draft.ts`, and also `state/client/context.ts` and `views/sources/files/sections/OpenEditors.svelte`, both on D33's write list. The brief names only `draft.ts`. Its tests run anyway in verify item 3 (F14).
  - G32's Code line (`guarded.md:147`) names `src/lib/data/model/`, and D33 writes `data/model/index.ts` and `model-sessions.ts`. The brief names no G32 and verify item 3 runs none of its tests, against spec.md "What every package obeys" ("A step whose change touches an entry's code runs that entry's test") (F14).
- `context.ts:592` is `const documents = createDocuments();`, and the file is 771 lines. Holds.
- The standing demand at `orchestrator-state.md:126` has two requirements:
  - The brief names the worktree and the base copy `.agents/worktrees/D33-base/tools/oculus/` under "What is on the tree". The brief names neither there; only verify item 4 names the base's `unused-exports.txt`, and no worktree path is given (`grep -n "base copy\|D33-base\|worktree" D33.md` printed :126, :130, :238, :243, :246, :247, :252).
  - The brief lists under "What is on the tree" the DESIGN.md, HELP.md and README.md paragraphs and the head comments that describe the changed behaviour. That list is absent. Item 12 names documents, but it misses `latex.yml:87` (F1), `app.yml:12`'s Enter row (F2) and `docs/files-and-search.md:85` ("Go to Definition into another file opens it with the name selected", which the opener's range touches). It also misses the head comments of `Audit.svelte:28-31` ("the view has no selection of its own"), `LaneCard.svelte:8-11`, `TabFace.svelte:29-30`, `key-dom.ts:53`, `Editor.svelte:69-71` ("acted on once per line and column"), `tab-state.ts:1-7` and `source-file.ts:9-14`.
  (F15)

Findings: F12, F13, F14, F15.

## 4. Cases and checks

- Cases 1-15 (the store and the view): consistent with spec.md "What every package obeys", with no test and a pure-function check by a node 24 scratch run. Gaps are in sections 5 and 6.
- Cases that check a place the step does not change, each reached only through the new store:
  - case 3 checks "a bad box as a warning" and "a problem with no file is the main file's", which is the LaTeX state's existing classification (`latex.svelte.ts` and `latex-state.ts` are not written);
  - case 7 checks the 500 cap, the Rerun replacement and the closed terminal, which are `commands.svelte.ts` (`FOUND_MAX` :75, `commandDiagnostics` :708-718), also not written;
  - case 18 checks the autosave on blur (`autosave.svelte.ts`, G60) and D28's changed line (`save/DiskNote.svelte`), both unchanged.
  (F16)
- Cases 16-22 (keys and the range): consistent. Case 16 omits Z702 (2)'s "in the app", and the standing demand at `orchestrator-state.md:44` ("never reruns a case that starts the app") makes that the look's, which the brief does not say (part of F11).
- Cases 23-30: consistent. Case 27 is the only case for an id the step introduces. The state file's demand (`orchestrator-state.md:127`, "Every brief that introduces a key or id names it and lists its empty, duplicated and colliding cases as acceptance items") goes unmet for:
  - the view id `problems`;
  - the status item `problems`;
  - the marker owner `command`;
  - the saved tab-state keys `asked`, `endLine` and `endColumn`;
  - `AuditFinding.file`;
  - the Settings card ids.
  (F17)
- Cases 31-33: consistent with spec.md's ban on breakage testing. The brief carries no breakage testing: :126 allows the red commands on the unchanged tree and on the worktree only, and bans runs with the fix or part of it removed. That matches `no-breakage-testing.md`.
- Page runs against the rules file and the standing demands:
  - The runs start task terminals (cases 2, 7, 22). The brief sets `HOME` but no `TMUX_TMPDIR`. oculus calls tmux with no socket unless one is given (`src/lib/server/machine/pty/tmux.ts:44-46`, `socket === undefined || socket === '' ? ['-u'] : ['-u', '-S', socket]`), so the worktree's server would make its sessions on Axel's default tmux socket. That breaks `orchestrator-state.md:62` ("Never run tmux without `-L` or a private `-S` socket") and :217 (a scratch oculus with its own `config/local.yml`, `HOME` and `TMUX_TMPDIR`) (F18).
  - Case 31 runs `views.sh` over every view, its list including `linkedin`. `ls -d theaxec.github.io` exists in the main checkout, but `git ls-files theaxec.github.io` printed nothing, so the step's worktree has no `theaxec.github.io/_linkedin` (`config/sources.yml:79`). The diagnosis added four synthetic posts to its scratch hub (`D33-diagnosis.md`, "Where the probes run"). In the worktree that would be a write under a hub data folder, which spec.md "Where you work" bans unless the brief names the path. Without the posts the view prints `ERROR no rows drawn`, so case 31's "on every view ... GREEN" cannot hold as written (F19).
  - Case 30 moves the cursor over the Settings view's cards while the worktree holds its own `config/local.yml`. The standing demand (`orchestrator-state.md:54`, "never open the Config view's `local.yml` card or the Settings view's `local.yml` tree node") is not restated for the builder's runs (F20).
  - ":126 ... the unchanged tree as the defect's reproduction (the base copy's dev server)" names a second server with no port, no `local.yml` and no `node_modules`; the base copy is a `git archive` of four folders. Verify item 7 asks for that run's RED line (F21).
  - Ports 8787 and 8790 are named as untouched, Chrome is headless with a fresh `--user-data-dir`, and the worktree's `local.yml` is written as one line and deleted, with verify item 8 checking `lsof -iTCP:8805` and `ls config/local.yml`. These hold. 8805 is no other step's (`grep -rn 8805 agents/briefs/*.md` outside D33.md printed nothing).

Findings: F16, F17, F18, F19, F20, F21.

## 5. The question

"The goal" here is DESIGN.md's Problems view as VS Code's: the store, the view, the keys, the status item, the decorations, the TeX lists moved, and the Audit, lane and Settings cursors with the reload fix.

- The step line names no check of its own (its trailing tags are rulings). The verify list stands in for one: items 1-6 and 8 are hygiene and removal checks that pass without any Problems view (yes); item 7 is only as strong as the cases.
- Case 1, no: it needs the range selected and the keyboard in the view. As written, item 5 cannot make that hold, see F23.
- Cases 2-11, 13-15, 18, 21-24, 26-29, 32-33: no, except as noted below.
- Case 10: yes. It passes with a matcher that handles only `**`, and nothing tests `?`, `[...]`, `{a,b}`, several terms or a term mixing text and glob (F22).
- Case 12: yes. It checks 1000 and 10000 only. The brief's library list names `Intl.NumberFormat` for the compact counts, which reads 1500 as `1.5K` and 9999 as `10K`. VS Code 1.137.0's `packNumber` (`grep -o '.\{160\}10K+.\{160\}' workbench.desktop.main.js`) is `e>9999?"10K+":e>999?e.toString().charAt(0)+"K":e.toString()`, which reads 1500 as `1K` and 9999 as `9K` (F23, with item 4).
- Case 16: yes. It runs only Cmd+Shift+M in headless Chrome on macOS. Whether Chrome on macOS or the Electron app takes Cmd+Shift+M first is not checked (recheck 3 left it "not verified"), and Ctrl+Shift+M off macOS is not run (F24).
- Case 17: yes. Monaco's own `editor.action.marker.nextInFiles` (F8) already crosses into another model through the opener (`hosts.ts:129-148`). If the next file is open in a tab and Monaco's marker order agrees with the view's, the case passes with Monaco's F8 still bound. The fixture needs a next file with no open model, or one whose place in the view's order (worst severity, then path) differs from Monaco's (F25).
- Case 19 and item 5: yes for library targets. `openSourceFile` stamps `asked`, but a library reference opens through `openLibraryFile` and `libraryTabState` (`lsp.ts:185-191`, `source-file.ts:35-46`, `draft.ts:237-243`), which item 5 does not extend. So case 14's range and a second press on a library reference can fail while case 19, run on a served file, passes (F26).
- Case 20 and item 5: no, but the brief's mechanism is wrong. `placed` is a plain component-local `let placed = '';` (`Editor.svelte:141`), and nothing clears the opened place (`grep -n "line\b\|column\b" Source.svelte SourceBody.svelte`). After a reload the editor mounts with `placed` empty and goes to the place again whatever `asked` holds. "The `asked` value is saved with the tab state, so a reload does not go to the place again" does not follow: the value already gone to has to persist (F27).
- Case 1 and item 2's N1: `goto` and `word` both call `made.focus()` (`commands.ts:26`, `:45`). A single press's go-to therefore moves the keyboard into the editor, and N1's "keyboard kept in the view" needs a go-to that does not focus, carried in the tab state, which items 2 and 5 never name (F28).
- Case 13: yes. "Copy copies a row as VS Code does (path, range, severity, source, message)" passes with a text line. VS Code 1.137.0 copies the marker as tab-indented JSON (`toString(){return JSON.stringify({...this.marker,resource:this.marker.resource.path,relatedInformation:...},null,"\t")}`) (F29).
- Case 25: yes. "Filtered to the root" is not given a mechanism, and a path filter cannot tell two roots' files with the same relative path apart (F30).
- Case 30: yes. It passes when the first field is a text box reached some way, while Enter through `activateCursor`'s `.click()` on a card whose first field is a checkbox changes a setting (F8 covers the path; the missing input is in section 6).
- Case 31: as written, it cannot pass for `linkedin` (F19).
- Item 1: no. Item 3: yes, see F25. Item 4: yes, see F23. Item 5: see F26, F27, F28. Item 6: no. Item 7: no, but it cannot be built within the paths (F5). Item 8: no. Item 9: no. Item 10: see F8. Item 11: no. Item 12: no.

Findings: F22, F23, F24, F25, F26, F27, F28, F29, F30.

## 6. Implied inputs

A code step. Each input below is missing from "Cases", with the result it should have.

- F31. A diagnostic whose range ends past the file's last line, or a stale range after the text shrank: the selection is clamped to the file's end and nothing throws. The `word` path calls `held.getLineMaxColumn(line)` only after clamping the line (`commands.ts:21-45`), and a new range command needs the same.
- F32. A row for a file renamed or deleted while listed: command and LaTeX rows stay under the old path until the next run, and a press opens the tab marked gone (X3e, D28). The language-server rows go with the file's model.
- F33. The same file under two served roots (a project root nested in the hub root): command rows map to the root `tabOfFile` picks, each language-server row is listed once under its own root key, and Show Problems for one root lists only that root's rows.
- F34. A filter with a malformed glob. A scratch run of `picomatch/posix.js` under node 24 printed `"[abc" ok`, `"{a," ok` and `"(" ok`, with no throw, `[abc` matching the literal `[abc`. So the view lists rows or says none match, and nothing throws.
- F35. F8 with no problems, with no Problems view open, with the view filtered or Show Warnings off, and onto a row that opens nothing (a file in no served root) or a library row: nothing moves on no problems; the brief has to say whether F8 follows the filter and toggles, and a row that opens nothing is skipped.
- F36. A Problems tab restored from a saved layout before any source has sent rows: the empty message ("No problems have been detected in the workspace.", VS Code's, present in `nls.messages.json`), no error, the filter and toggles restored, and the rows drawn as the sources arrive.
- F37. An Audit `file` naming a path through a symlink that leaves the hub, a folder, or a collection or website file outside the hub (Q118 case 27): the helper answers the empty text, and no open reaches a path G2 refuses.
- F38. Settings card ids across nested Cards and roll-up groups. `Cards.svelte:130-140` nests with `path={[...path, { index: at, field: name }]}`, and `Rollup.svelte:67` draws one `Cards` per group (`group={at}`). Two record fields of one card at the same indices, and card 0 of two roll-up groups, must give two ids, so the "index path" must include the field name and the group.
- F39. Enter on a Settings card whose first field is a checkbox, a select or a nested record list: the keyboard moves into the field and no value changes.
- F40. Two single presses on two problems of one file. `layout/open/opening.ts:154` runs `if (preview && isPreview(existing)) keepPreview(existing.id)`, so the second preview open of the same file keeps the tab. VS Code keeps one preview tab, still a preview, and the brief must say which holds.
- F41. `asked` across a reload and within one millisecond. A page-wide counter restarts after a reload and can repeat a saved value, and the time can repeat within a millisecond (Decision 5 allows either). A press after a reload must still go to the place, and two opens in one millisecond must both go.
- F42. A library file's last tab closes. `#forget` returns before clearing for a library (`client.ts:505`, `if (reg.library !== undefined) return;`), so the new hand-off must drop the library rows too.
- F43. Go to Definition into another file after the opener passes the range: the name is still selected, as `docs/files-and-search.md:85` says.
- F44. Two panes each holding a restored cursor after a reload. The diagnosis's `syncCards` hunk takes the first `[data-pane]` holding a cursor in DOM order; the brief must say which pane becomes the remembered one, and that a press into the other clears the first.
- F45. A restored tab state with `endLine` before `line`, `endColumn` with no `endLine`, or a non-number `asked`: each is read as none, as `openedAtShape` reads a bad line (`tab-state.ts:15-18`).
- F46. The Problems view open in two panes, or in a page and a float: each keeps its own filter, and the brief must say whose order F8 walks.
- F47. LaTeX rows exist only for roots whose state the page holds (recheck 2 section 6): a root never opened in the page lists nothing.

Findings: F31 to F47.

## 7. ADRs

- `ls tools/oculus/docs/adr docs/adr` printed "No such file or directory" for both, and `grep -n adr .agents/plan.yaml` exited 1. No record.

Findings: none.

## 8. Dictated text

- "Errors: N, Warnings: N, Infos: N" with only the non-zero ones, or "No Problems" (`grep -n '"No Problems"' D33.md` finds :61 and :88): holds. These are VS Code 1.137.0's strings (`nls.messages.json` 17156 `Errors: {0}`, 17159 `Warnings: {0}`, 17157 `Infos: {0}`, 17139 `No Problems`, joined ", " in `getMarkersTooltip`).
- "1 problem in this file" and "N problems in this file" (`grep -n 'problem in this file' D33.md` finds :64): holds, VS Code's 17211 and 17212.
- "Total N Problems" (`grep -n '"Total N Problems"' D33.md` finds :57): holds as VS Code's 17158. It reads "Total 1 Problems" at one, which is VS Code's wording; no rule of spec.md or the hub's "Writing docs" is broken.
- `audit.open_place_tip` "Open {0}" (`grep -n open_place_tip D33.md` finds :66): holds.
- Show Errors, Show Warnings, Show Infos, Show Active File Only, Collapse All, View as Table, Copy Message and `[Ln l, Col c]` (`grep -n 'Copy Message' D33.md` finds :56 and :89): hold. All are in VS Code 1.137.0's `nls.messages.json` (a python scan printed every one, `missing []`).
- `scan.ts:12`'s head comment "says a finding names its file outside the signature" (:66): not verbatim text, so it holds.
- The diagnosis's doc comments, dictated at :68 ("with the record's doc comment", "The record's text of each hunk is under 'Fix and test'"):
  - No history words: `grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously)\b"` over the hunk's comment lines exited 1.
  - ASCII: `LC_ALL=C grep -n '[^ -~]'` exited 1.
  - No "not X but Y".
  - One line breaks the width rule. `awk` over the `+` lines printed `101: +     * held cursor marks the pane the keyboard is in, so while no pane is remembered (none pressed or` (the `syncCards` doc comment, `D33-diagnosis.md:242`). Copied as written it breaks spec.md "The working rules"/"What every package obeys" (a comment rewrapped at 100 columns) and G23 (`tests/checks/source/comment-width.test.ts`) (F48).

Findings: F48.

## 9. Shared paths (M8, in flight from d8f32d576)

M8's write list is `agents/briefs/M8.md:140-169`. Files both steps write:

- `config/text/statusbar.yml`: M8 adds `server_yaml` near :91, and D33 writes :9-12 and :41-46. No line written by both.
- `DESIGN.md`: M8 writes 23, 24, 44, 165 and 572; D33 writes 471-472, 500 and 569. No line written by both; 569 and 572 have two unchanged lines between them.
- `docs/files-and-search.md`: M8 writes 15-17, 81 and 83-85; D33 writes 9-13 and 57-61. No line written by both; D33's :13 and M8's :15 have one unchanged line (:14) between them, so the merge stays simple only while neither edit reaches :14.
- `docs/views.md`: M8 writes 247; D33 writes 73, 86, 203-205 and 265. No line written by both.
- `docs/diagrams/`: both regenerate.
- `package.json` and `package-lock.json`: both write them. M8 adds `yaml-language-server` 1.24.0 and `ajv` 8.20.0 (`M8.md:78`, `:166`); D33 adds `picomatch` 4.0.7 and possibly `@types/picomatch`. In the lock, `node_modules/picomatch` carries `"devOptional": true` at `package-lock.json:6708`. Both changes remove that line, since yaml-language-server needs `picomatch ^4.0.4` (`M8.md:41`) and D33 makes it a direct dependency. That is the same line written by both, an identical change. D33's "Shared with the steps in flight" omits both files and says "No line is written by both" (F49).
- `src/lib/views/system/workbench/editors/Editor.svelte`: both write it. M8 writes `:73` and D33 writes near `:108` (item 10). Not named in D33's shared section. If F8's field route is taken, `FieldControl.svelte` (M8's `:301`) is shared too (F50).
- M8's decision 4 (`M8.md:180`, "picomatch is not added as oculus's dependency") stops being true once D33 lands. That is M8's text, not D33's.

Findings: F49, F50.

## 10. Libraries

- picomatch 4.0.7:
  - `npm view picomatch@4.0.7 version license maintainers` printed `4.0.7`, `MIT` and mrmlnc, jonschlinkert, doowb and danez; `npm view picomatch@4.0.7 time --json` printed `"4.0.7": "2026-08-24T14:36:23.690Z"`. These hold.
  - "in `node_modules` today only through fdir" differs: `npm explain picomatch` prints fdir 6.5.0 (peerOptional), knip 6.39.0, tinyglobby 0.2.17, vitest 4.1.11, vite 8.3.0 and @rollup/plugin-commonjs 29.0.3 (F13 covers the premise list; this one is booked as part of F14's premise class: see below).
  - "CommonJS with a `posix.js` entry whose one `process` use is guarded" differs. `cat posix.js` is one line, `module.exports = require('./lib/picomatch');`, with no `process`. The one `process` use is `lib/utils.js:23-24` (`if (typeof process !== 'undefined' && process.platform)`, guarded), reached from `index.js`, the package's `main`, through `utils.isWindows()`. `grep -rn "process\|require('path')\|require('os')"` over `lib/*.js` and the entries found nothing else, so it runs in a browser bundle without Node globals through either entry. The conclusion holds and the description is wrong.
- picomatch ships no types: `package.json` has no `types` field and `ls *.d.ts` found none. `npm view @types/picomatch` gives 4.0.3, MIT, Microsoft's types maintainer, released 2026-04-03, the only 4.x line at 4.0.3. The brief leaves it unpinned ("at the version matching 4"), against spec.md "No dependency the brief did not name".
- `Intl.NumberFormat` does not give VS Code's counts (F23).
- `fuzzysort` 4.0.2 is in `package.json`, as are `@zag-js/tree-view`, `@tanstack/virtual-core`, `vscode-languageserver-protocol` and Monaco 0.57.0 (`grep -o '"version": "[^"]*"' node_modules/monaco-editor/package.json` printed `0.57.0`).

Findings, numbered here so each can be closed by name:
- The two picomatch description errors: the "only through fdir" claim and the "`posix.js` ... `process`" claim (part of F13's class of premise errors; booked here under F13 as well).
- `@types/picomatch` unpinned: folded into F49's package.json item for closing, since the same lines carry it.

To keep every finding closable by name, the two above are listed under the existing numbers F13 and F49 and add no new number.

## Declined to judge

- Whether Chrome on macOS lets a page take Cmd+Shift+M before its profile menu does. Settling it needs a key sent in a non-headless Chrome, which I may not run; it is the look's (F24 asks the brief to say so).
- Whether VS Code's Problems text filter matches fuzzily as `fuzzysort` does. I did not read VS Code's filter matcher; item 2's choice of `fuzzysort` stands on the brief's word.
- Whether `.click()` in `activateCursor` focuses any of the `ui/forms` controls through a handler of their own. I read only the import list of `FieldControl.svelte`, not each control. F8 rests on the DOM rule that `HTMLElement.click()` moves no focus.
- Whether M8's `Editor.svelte:73` and D33's change near `:108` stay far enough apart, which depends on how D33's builder passes the cursor down.
- The leads (the survey, rechecks 2 and 3 and the diagnosis) were read as leads. Every fact above was taken again on the tree; the survey's sections 5 to 8 were not compared line by line with the brief.

Agent usage: a0a67ffbec5451994, claude-opus-5-5, 335,815 tokens, 131 tool uses, 19.6 min.
