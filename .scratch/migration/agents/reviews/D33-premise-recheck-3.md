# D33 premise recheck 3, on main at 3bf3bf4c6

I changed no file. The only git commands I ran were read-only (`rev-parse`, `log`, `show`, `diff`). I did not open, print, grep or hash `config/local.yml`, I started no server, and I touched no port. The diagnosis's red commands need a dev server, so they were not run (item 3). Paths are under `tools/oculus/` unless they start with `.scratch/` or `~`.

## 0. Main's head

- `git rev-parse HEAD` printed `3bf3bf4c6876e35dd3a198d65892c2f27c719053`.
- `git status --short` printed one line, ` M tools/oculus/.scratch/migration/plan.md`. That change is two Agents lines the session added (`git diff`).
- `git log --oneline 8bd2070c..HEAD -- tools/oculus/src tools/oculus/config tools/oculus/docs tools/oculus/DESIGN.md tools/oculus/HELP.md` printed seven commits:
  - 3bf3bf4c6, D28;
  - 1ae5e7c8d, X3e;
  - d098915b5 and c88b76443, D11;
  - 0d440a6ef and a84214dad, D15;
  - d5d7f727b.

**Read first**
- Every premise of D33's line, of Z702 and of recheck 2 still holds or has moved. None is false, apart from two stale citations:
  - the plan sub-bullet `plan.md:616` still cites `workbench-keys.svelte.ts:358-367`; `reconcilePane` is now :414-424;
  - M6's brief places `SourceTabState` in `source.svelte.ts`; it is in `draft.ts`.
- D11 took Explorer orders 6 and 7, as Z702 (1) expects. Problems at order 8 gets the chord `s8`.
- `SourceTabState` is now `src/lib/state/sessions/source/draft.ts:46-66`. The line and column pass through a new component on their way to the editor: `Source.svelte`, then `SourceBody.svelte` (new with D28), then `views/sources/source/Editor.svelte`.
- That editor's go-to effect runs "once per line and column" (`Editor.svelte:176-193`). A second press on a Problems row the tab already went to does nothing.
  - M6's brief (section 2) adds `asked` to `SourceFile` and `SourceTabState` to fix exactly this, and it rewrites the same lines D33's range work rewrites.
  - D33 and M6 therefore share lines in `draft.ts`, `tab-state.ts`, `source-file.ts` and that `Editor.svelte`. This is new choice N2.
- Two files are 5 lines under their limit: `shell/Workbench.svelte` (515 of 520) and `ui/tree/TreeItem.svelte` (515 of 520, after X3e).
- Z702 (11) cannot be built as worded. The Settings cards' ids collide: `Cards.svelte:123` is `data-card={at}`, and `Cards` nests itself and is drawn by `Rollup.svelte` and `Editor.svelte`. This is new choice N4.
- The fact Z702 (10) rested on, unchecked in recheck 2, is now verified. LaTeX Workshop 10.19.0 (`~/.vscode/extensions/james-yu.latex-workshop-10.19.0/package.json`) contributes only the views Commands, Structure and Math Symbols. It sends its build errors to VS Code's Problems through `createDiagnosticCollection('LaTeX')` and the others (grep of its `out/`).
- Four new choices are in section 5 (N1 to N4), and one library choice is in section 6.

## 1. Premises

**Authority** (`grep -n "^- D33 \|^- D36 " plan.md`, `sed -n 605,625p plan.md`, `grep -n` per ruling)
- The step line is `plan.md:614`. Its sub-bullets are:
  - :615 (Z446, the Audit cursor);
  - :616 (Z461, the reload);
  - :617 (Step 0, the diagnosis);
  - :618 (waits for D45);
  - :619 (recheck 2, closed as Z702).
- D36 is :620. Moved.
- Rulings:
  - Z86 :844; Z182 :987 and :179; Z468 :1271; Z702 :1504; Z704 :1506.
  - Z196 :999; Z281 :1087; Z298 :1112.
  - Z446 :1248; Z458 to Z460 :1261-1263; Z461 :1264; Z503 :1306.
  - Moved.
- Dependencies, each ticked:
  - D17 :549, D23 :564, D45 :536;
  - D11 :499, D28 :592, X3e :196, D15 :543.
  - Holds.
- The step text still names none of Z458, Z459, Z460, Z196, Z281 or Z298, so the brief must carry them. Holds.
- `:616` cites `workbench-keys.svelte.ts:358-367`, and `:619` cites :402-412. Both are stale; `reconcilePane` is :414-424 (doc comment :414).

**Z702 (1), the Explorer orders and the arrangement** (`grep -rn "group: 'explorer'" -A2 src/lib/views`)
- The orders are:
  - Files 0 (`views/sources/files/Files.svelte:10`);
  - Repositories 1 (`Repositories.svelte:12`);
  - Search 2 (`views/sources/search/Search.svelte:9`);
  - References 3 (`References.svelte:10`);
  - latex 5 (`views/academic/latex/Latex.svelte:11`);
  - debug 6 (`views/system/machine/debug/Debug.svelte:11`);
  - debug-console 7 (`debug/Console.svelte:11`).
- So D11 took 6 and 7, as Z702 (1) expects. Holds.
- `keyOf` is `state/workbench/navigation/catalogue.ts:163-169` and answers only while `at < 9`. Problems at order 8 is the eighth place, so it gets `s8`. Holds.
- `config/layout.yml:82` reads `- { kind: pane, view: [files, repositories, search, latex] }`. D11 put its views in no arrangement, so Z702's "after the TeX view" means appending `problems` there. Holds.
- `config/text/app.yml:12` now reads `s1-s7` (D11). Moved.

**Z702 (2), the toggle key** (`grep -rn "KeyM" src/lib`, `grep -n "Shift+M" HELP.md`)
- Only the LaTeX tab binds `KeyM`:
  - Cmd+Alt+M at `views/sources/source/latex/latex-tab.svelte.ts:333`;
  - the math chord at :385-386 (Ctrl+Shift+M on macOS, Cmd or Ctrl+M off it), described at `HELP.md:75`.
- Monaco 0.57.0's `toggleTabFocusMode` is CtrlCmd+M, and WinCtrl+Shift+M on macOS (`node_modules/monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js:18-19`). So Cmd+Shift+M on macOS and Ctrl+Shift+M off it are free in Monaco.
- The desktop menu (`src/desktop/windows/menu.ts`, grep `accelerator`) binds no Cmd+Shift+M.
- Whether Chrome on macOS takes Cmd+Shift+M first is not verified.
- No F8 binding exists anywhere (`grep -rn "F8" src/lib`). Holds.

**Z702 (4), the status bar**
- `LEFT_ITEMS` is `shell/status/status-items.ts:34-44`: host, branch, sync, findings, debug, hpc, usage, server, latex. `sync` is :37 and `findings` :38. D11 put `debug` at :39, after `findings`. Moved.
- `itemName` is :70 (`sync` :76, `findings` :78, `debug` :80), and the head comment is :1-28.
- `StatusBar.svelte` is 307 lines. The findings block is :143-155 and the debug block starts at :156.
- `config/text/statusbar.yml`: `item_findings` :9, `item_debug` :10, `findings_name` :41, `findings_tip` :44.
- `state/workbench/navigation/status.ts`: the "VS Code's Problems count" comment is :213-217, `findingsCount` :218, `allFindings` :230.
- The feed is `src/routes/+page.svelte:174`.
- `shell/status` holds 10 items (`git ls-files`), so it is full. Holds.
- `DESIGN.md:569` is the status bar paragraph and now names the debug item. `docs/window.md:82` names it too. Moved.

**Z702 (5), opening at a range** (`grep -rn "export type SourceTabState"`, sed of each file)
- `SourceTabState` is `src/lib/state/sessions/source/draft.ts:46-66`. Its fields:
  - `line?` :50, `column?` :55, `library?` :60, `id?` :62, `head?` :64.
- The functions in the same file: `sourceTabState` :219-230, `libraryTabState` :237-243, `placed` :245-248.
- `views/sources/source/status/tab-state.ts`: `openedAtShape` :15-18, `openedAt` :26-30, `TabState` :45-57, `tabFacts` :59-71.
- The chain to the editor:
  - `views/sources/source/Source.svelte` (478 lines) reads `line` and `column` at :142 and hands them to `SourceBody` at :429;
  - `SourceBody.svelte` (208 lines) takes them as props at :49-52, then uses them at :95-96 and :147-148;
  - `views/sources/source/Editor.svelte` (300 lines) has the prop at :74-75, the default at :118, and the go-to effect at :176-193, keyed `placed === "${line}:${column}"`.
- The editor commands are `goto` with `column?` and `word` at `ui/controls/editor/types.ts:78-79`, run in `commands.ts:21-45`.
- `views/shared/links/source-file.ts` holds `SourceFile` :15, `openSourceFile` :17-29 and `openLibraryFile` :35-46. `openSourceFile` has 24 callers outside tests.
- The Monaco opener `ui/controls/editor/kit/lsp/hosts.ts:129-148` passes the start position only.
- `repositories.openFile` (`state/sources/repositories/repositories.svelte.ts:313`) takes no column.
- All of these moved with D28.

**Z702 (6), markers and their owners** (`grep -rn "setModelMarkers\|markerOwner" src/lib`)
- Language servers use the owner `lsp-<language>` (`kit/lsp/markers.ts:11-13`). It is set by `#mark` at `client.ts:479-486`, cleared by `#unmark` at :489-494, and `#forget` is :497-508.
- LaTeX uses the owner `oculus-latex` (`kit/latex/latex-widget.ts:54`), set at :282 and cleared at :305.
- Nothing else sets markers. Command errors still have none. Holds.
- `views/sources/source/language/extension.ts` (52 lines) composes the extensions; D11 added the rite hover there. The folder holds 6 items.

**D17's command errors** (`grep -n` over `state/sessions/terminal/commands.svelte.ts`, 777 lines)
- `FOUND_MAX` :75, `ERROR_LINE` :79, `errorMatch` :100, the store member :221.
- `ranCommand` :575-577 still leaves out LaTeX build terminals.
- `openAt` :633, `note` :637-670, `readEnded` :680, `capture` :694, `commandDiagnostics` :708-718, the export :771.
- `CommandDiagnostic` is `data/model/model-sessions.ts:712-723`. Its doc comment at :715 is still stale: `note` stores a path inside the repository or the absolute path.
- The press path: `views/sessions/terminal/grid/grid-links.ts:39`, then `state/client/context.ts:611`, then `repositories.openFile`. `tabOfFile` is `file-git.ts:85-90`.
- Moved. D11 added `afterPress` and X3e changed `folderNamed`; neither touches the diagnostics.

**The LaTeX source**
- `latexDiagnostics` is `state/sessions/latex/latex.svelte.ts:490` (member :121, export :548; the file is 554 lines).
- `LatexDiagnostic` is `latex-state.ts:134-141`, with no column.
- Its one reader is `views/sources/source/language/latex-editor.ts:68`.
- Moved.

**Language server diagnostics** (`git log 8bd2070c..HEAD` over `kit/lsp`, `state/system/machine/lsp` and `relay.ts` printed nothing)
- `transport.ts:729-737`, `#pageOf` :751-754, `client.ts:446-448` (the store gets only `place !== null`), `relay.ts:774-776`, `lsp.ts:198`.
- `documents.svelte.ts` is 101 lines. Its head comment :2-4 names the Problems view as a later reader. It has `diagnosticsOf` :70 and `countsOf` :74, and still no listing of every file.
- `held/held.ts:5` still says one server per page, root and registry entry.
- Holds.

**Z702 (7), the Files decorations**
- `state/sources/explorer/rows/decorations.ts` (143 lines) is unchanged, with `statusFold` :93 and `decorationOf` :126.
- `views/shared/explorer/tree/Tree.svelte` is now 425 lines. The decoration call is :361-371; X3e's hunks are all elsewhere (`git diff -U0`).
- `FileRow.svelte` is 162 lines, with the tone at :49-52 and the letter at :85-86.
- The tree item is `src/lib/ui/tree/TreeItem.svelte`, now 515 lines: X3e added the drag, 21 lines. So the badge and the folder dot belong in `FileRow`'s `end` snippet, not in `TreeItem`.
- `rooted-tree.svelte.ts:143` derives the fold.
- `colours.ts:400` and `:422` hold the error and warning colours.
- `decorationOf` has one reader, `Tree.svelte` (grep). Open Editors draws no git decoration, only `gone` in the error tone (`OpenEditors.svelte:225`).

**Z702 (8), (9), (13) and (14)**
- Library diagnostics still never reach the store (`client.ts:446-448`, `:505`).
- The source and code of a diagnostic are as recheck 2 read them.
- Servers are still per page.
- `hosts.ts:146` is still the Next Problem comment. Monaco's F8 already crosses into another open model through the opener at :129-148. Holds.

**Z702 (10), the TeX view's Problems section**
- `views/academic/latex/Problems.svelte` (74 lines) is imported at `Latex.svelte:46` and mounted at :208-215.
- The project panel's toggle is `views/shared/latex/Main.svelte:125-143`, with `shared/latex/Problems.svelte` (72 lines) imported at :20.
- `views/shared/latex/places.ts`'s `problemRows`, `problemFile` and `placeOf` are read only by those two components (grep).
- Words:
  - `config/text/views/academic/latex.yml:108-112`, with `show_problems` at :145;
  - the notice action is `latex/builds.ts:292-293`;
  - Show Problems opens `latex` at `context.ts:429-435`.
- D45's brief :168 and :385 say "until D33".
- The documents that describe these lists: `HELP.md:115`, `docs/views.md:73` and `docs/views.md:265`.
- Moved. The LaTeX Workshop fact is verified (Read first).

**The Audit and the Focus lane (Z446, Z458 to Z460)**
- `Audit.svelte` is unchanged at 300 lines:
  - it has no `cardCursor`;
  - `<li data-card={finding.signature}>` is :115 and the plain `.where` span :125;
  - both lists are keyed `` `${finding.signature}:${index}` `` at :159 and :177.
  - Holds.
- `Inbox.svelte:67` still reads the cursor, and 17 views read `cardCursor(instance.state)` (`grep -rln | wc -l` printed 17). Holds.
- `AuditFinding` is `data/model/index.ts:330-336`, still with no `file`; the file is 662 lines. Moved.
- `tool-button.ts:107-108` is the `dataCardToggle` doc line and prop (128 lines). Holds.
- `LaneCard.svelte:108` is `<ToolButton plain cut {label} onclick={onopen} />`. Holds.
- `server/content/audit/scan.ts:12` holds, and `server/content/audit.ts` is absent. Holds.
- The `add({` counts are still 26 and 6. Holds.
- `DESIGN.md:500` and `HELP.md:56` hold.
- The Audit text is `docs/views.md:203-205`. Moved.

**Z702 (11), the Settings cards**
- `views/system/workbench/editors/Cards.svelte:123` draws `data-card={at}`, an index.
- `Cards` nests itself (:130), and `Rollup.svelte:67` and `Editor.svelte:108` each draw one.
- So one Settings pane holds many cards with the same id. `cards(pane)` sees them all, and `activateCursor`'s `querySelector` finds the first.
- No `.title button` and no `[data-card-toggle]` exists in a Settings card, so Enter does nothing there.
- `grep -rln cardCursor src/lib/views/system/workbench | wc -l` printed 0.
- This is new choice N4.

**The diagnosis's two causes**
- Every function they name has unchanged text at main's head:
  - `lastFocusedPane` :93, `lastPagePane` :94, `observedPane` :95, `cardObserver` :96;
  - `focusedPaneElement` :316, `cards` :334, `moveCard` :373, `cursorIn` :387, `writeCursor` :392;
  - `reconcilePane` :414-424, `observePane` :427, `syncCards` :448-456, `stopCards` :458-462, `rememberPane` :464-473.
- The source was `git diff 8bd2070c HEAD` of the file: D11 adds only options, `swallow` and `inEditor`.
- `Workbench.svelte:266-270` holds the effect `currentPage(); keyboard.syncCards(); return keyboard.stopCards;`.
- In `keys.ts`: `clear-cursor` :290, `horizontalCursor` :87, `rowCursor` :94.
- `key-dom.ts:54-61`, `ui/frame/Card.svelte:69-70`, `Collection.svelte:208` and `instance.ts:64`, `:69`, `:78` hold.
- `git log fb7f076f..HEAD` over `instance.ts`, `Card.svelte`, `key-dom.ts` and `layout/saved` printed only D45. The landed steps add no `data-card` (`git diff 8bd2070c HEAD -- tools/oculus/src | grep '^+' | grep data-card` printed nothing).
- Cause A (`reconcilePane` clears a cursor whose row is not drawn yet) and cause B (no remembered pane after a reload) hold as a reading of the code.

**Folder counts** (`git ls-files <dir> | cut -d/ -f1 | sort -u | wc -l`; the limit is 10)
- `views/sources` 10, `views/sources/search` 6, `views/sources/source` 10, `views/sources/source/language` 6.
- `state/system` 8, `state/system/machine` 6, `state/system/machine/lsp` 10.
- `state/sessions` 10, `state/sessions/source` 4.
- `shell/status` 10, `shell/keys` 8, `state/client` 10, `state/workbench` 10, `state/workbench/navigation` 10.
- `ui/controls/editor` 10, `ui/tree` 10, `data/model` 10.
- `views/shared/explorer/tree` 9, `state/sources/explorer/rows` 5.
- `config/text/views/sources` 10, `config/text/views/system` 8, `config/catalogs` 9.

**Sizes** (`wc -l`; the limits are 880, and 520 for a component)
- Near their limit:
  - `Workbench.svelte` 515;
  - `TreeItem.svelte` 515;
  - `context.ts` 771;
  - `commands.svelte.ts` 777;
  - `model-sessions.ts` 730;
  - `transport.ts` 871;
  - `relay.ts` 839.
- Others:
  - `keys.ts` 354; `client.ts` 640; `lsp.ts` 543;
  - `rail-badges.svelte.ts` 294; `status.ts` 406; `palette.ts` 436; `+page.svelte` 276;
  - `search.yml` 125; `statusbar.yml` 189; `app.yml` 241;
  - `DESIGN.md` 576; `HELP.md` 185; `docs/views.md` 273.

**Glyphs**
- In `glyphs.yml`: `cross` :77, `warn` :79, `info` :87.
- In `icons.yml`: `cross` :76, `warn` :78, `info` :86.
- There is still no `error` glyph. Moved by one line.

## 2. What D11, X3e and D28 changed that D33 depends on

**D11** (c88b76443, d098915b5)
- It took Explorer orders 6 and 7 as Z702 (1) expects. The keys sheet now reads `s1-s7`.
- It added the `debug` status item after `findings`: `status-items.ts:39`, `StatusBar.svelte:156` onward, and `DESIGN.md:569` and `docs/window.md:82` rewritten to name it. Z702 (4)'s place, after `sync` and before `findings`, is still free.
- It added F5, F9, F10, F11 and Shift+F11 to `keys.ts`, and `debugKey`, `debugging` and `riteOnScreen` options to `workbench-keys.svelte.ts:61-66`. These make `Workbench.svelte` 515 lines.
- It added the rite hover to `extension.ts`, a "Debugging" section to HELP.md (:163), and `docs/views.md:79-86`.
- It binds no F8 and sets no marker.

**X3e** (1ae5e7c8d)
- Diagnostics are untouched. `Tree.svelte`'s decoration code is unchanged and moved to :361-371.
- `TreeItem.svelte` is now 515 lines.
- The strip's tab carries its file and a `gone` fact (`shell/panes/strip/strip-tab.ts:28-29`, `:40-47`), which makes tab decorations possible (N3).
- Open Editors draws `gone` (`OpenEditors.svelte:225`).
- The `files` payload names folders, which the LaTeX and commands stores now read through `folderNamed`.

**D28** (3bf3bf4c6)
- The source store moved into `state/sessions/source/`: `source.svelte.ts` 717 lines, `draft.ts` 343, `disk.svelte.ts` 199, `autosave.svelte.ts` 173.
- `SourceTabState` and `sourceTabState` are in `draft.ts`. `Source.svelte` was split, and `SourceBody.svelte` carries the line and column.
- Adding an end line and an end column (Z702 (5)) touches these places:
  - `draft.ts` (the type :46-66, `placed` :245-248, `sourceTabState` :219, `libraryTabState` :237);
  - `tab-state.ts` (`openedAtShape` :15-18, `TabState` :45-57);
  - `Source.svelte:142` and the `SourceBody` call at :429;
  - `SourceBody.svelte:49-52`, `:95-96`, `:147-148`;
  - `views/sources/source/Editor.svelte:74-75`, `:118`, `:176-193`;
  - `types.ts:78-79` (a range selection, as `goto` with an end or a command of its own);
  - `commands.ts:21-45`;
  - `source-file.ts:15-46`;
  - the opener in `hosts.ts:129-148`, so an F8 step into another file selects the range.
- The go-to effect goes once per line and column (`Editor.svelte:176-193`). A repeated press on a row already gone to does nothing (N2).
- The F8 walk across files:
  - a step that moves to another file's tab blurs the editor it leaves, so under `editor.autosave: on_focus_change` that tab is saved, by G60's rule;
  - a step into a file whose tab is marked changed or gone opens that tab as D28 draws it (`save/DiskNote.svelte`);
  - opening matches a tab by root and path (`stateId`, `instance.ts:132-141`), so no tab is retargeted.
- G28's Code line now names `draft.ts` and `source/source.svelte.ts`, and G60's names `draft.ts`. A D33 change to `draft.ts` must therefore run G28's and G60's tests.
- The status bar: D28 changed no status file. `git log 8bd2070c..HEAD -- src/lib/shell/status config/text/statusbar.yml src/lib/state/workbench/navigation/status.ts src/routes/+page.svelte` printed only D11's two commits.

**D15** (a84214dad) added three lines to `Workbench.svelte` (`settleBeforeWindow`). It touches no other D33 path.

## 3. The card-cursor fix at main's head

- It applies unchanged. A script compared each hunk's old lines with the file: `python3 -I` over the diagnosis's `diff` block and `workbench-keys.svelte.ts`. Each of the five old-line blocks occurs exactly once, starting at the head lines below.
  - hunk 1 (`drawnCursor` after `cardObserver`): 94;
  - hunk 2 (the `moveCard` guard): 374;
  - hunk 3 (`reconcilePane`): 411;
  - hunk 4 (`syncCards`): 445;
  - hunk 5 (`stopCards`): 459.
- In function terms, the fix lands at :93-96, :373-379, :414-424, :448-456 and :458-462.
- The record's hunk header counts are still malformed: the first header says 6 old lines for a body of 3. The brief should give the fix as edits at these lines, not as a patch to apply.
- Whether the red command is still red is not verified. `red.mjs`, `red2.mjs`, `panechange.mjs`, `red3.mjs`, `filter.mjs` and `views.sh` need a dev server and headless Chrome. This recheck may start no server, and the record's scripts name port 8796, which I may not touch. Every line the two causes rest on reads the same at main's head (section 1), so the defect is expected to reproduce. Only a run proves it.
- The brief must give the scripts a port of the step's own in place of 8796.
- Inbox still has no run; the look on TEST is its check.

## 4. Tests and guarded entries

**Behaviours under an existing entry** (`agents/guarded.md`)
- G28, if D33 changes `draft.ts` (Z702 (5)). The Code line names `src/lib/state/sessions/source/draft.ts`. Its tests to run:
  - `tests/state/sessions/source.test.ts` (describe 'an untitled source tab' and the table 'a source tab over a file that changes on disk');
  - `tests/state/sessions/source-disk.client.test.ts` ('the channel of a source tab');
  - `tests/state/sessions/autosave.client.test.ts`;
  - `tests/shell/panes/strip/tab-menu.test.ts`;
  - `tests/state/workbench/navigation/pages.test.ts`.
- G60, for the same change: `tests/state/sessions/autosave.client.test.ts`, the table 'the autosave store'.
- G54, for `config/layout.yml:82`: `tests/checks/config/arrangements.test.ts`, 'the arrangements of config/layout.yml'. Its Test line says "written by Q125", and the file exists.
- G12: `tests/checks/config/config.test.ts`.
- G37, only if D33 changes the `handUp` call in a file view (Source): `tests/views/sources/bar-actions.test.ts`, 'the place a file tab hands its actions to'.
- G8 is not touched. Z458's `file` field changes the audit scan, not the `audit-mute` write, and `signatureOf` (`audit/rules.ts`) reads no `file`.
- G2 is not touched. D33 adds no route; a library row opens through the existing `lsp` read.
- The tree checks:
  - G16 `tests/checks/tree/boundaries.test.ts`, G20 `size.test.ts`, G21 `duplication.test.ts`;
  - G22 `source/history.test.ts`, G23 `comment-width.test.ts`, G24 `keys.test.ts`;
  - G25 `diagrams/diagrams.test.ts`.

**No test exists today for any D33 unit.** `grep -rln` over `tests` for these names printed nothing: `problems_head`, `latex/Problems`, `showProblems`, `problem_counts`, `findingsCount`, `LEFT_ITEMS`, `statusFold`, `decorationOf`, `tabFacts`, `openedAt`, `sourceTabState`, `kind: 'word'`, `cardCursor`, `dataCardToggle`. So removing the TeX view's section deletes no test.

**Z702 (12), no new guarded entry, still stands.**
- No D33 behaviour can lose work, break an installation or accept a wrong configuration. The one path near lost work is a press or an F8 step that leaves a tab with unsaved text, and G28 and G60 already guard it. Those tests run.
- It leaves these untested, with the look and the diagnosis's scripts as their only check:
  - the fold that joins the three sources and maps a repository path to a root key;
  - the sort, the grouping, the filter and the count words (`1K`, `10K+`);
  - the Files decorations fold;
  - the range selection;
  - the F8 walk;
  - command errors as markers;
  - the status item;
  - the Audit and Settings cursors;
  - the reload fix.

**Breakage testing**
- Neither recheck 2 nor the survey asks for it. `grep -n -i "revert\|without the fix\|without it\|mutation\|undone\|go red\|fails without\|break"` over both and recheck 1 found only an unrelated "capture" line.
- The diagnosis record does contain runs the brief must not carry:
  - probe 5's "undone: ... RED";
  - probe 10's "Undone (main plus fix A) ... RED";
  - "`panechange.mjs` is red without the change";
  - every run on "main plus fix A", a tree with half the fix in place.
- The brief may run the scripts only on the step's worktree (all green). It may run `red.mjs` on main's unchanged head as the defect's reproduction. It must never run them on a tree with the fix, or part of it, removed.
- Part B's red therefore cannot be shown on main's head: `panechange.mjs` is green there, because cause A has already cleared the cursor. Part B is judged by reading the fix and by the look.

## 5. New choices Z702 does not settle

**N1. What a press on a row does.** User-visible: keys and focus.
- VS Code 1.137.0 (its `openFileAtElement` and the `MARKER_OPEN_ACTION_ID` and `MARKER_OPEN_SIDE_ACTION_ID` rules, read from the bundle):
  - a single click opens the file as a preview and keeps the focus in Problems;
  - a double click opens a kept tab;
  - Enter opens a kept tab with the focus in the editor;
  - a side action opens it beside. Its key was not read.
- oculus's Search view opens a kept tab with the focus (`Search.svelte:149`).
- (a) As VS Code: a single press opens the preview tab and keeps the keyboard in the view, and Enter or a double press opens a kept tab with the keyboard in the editor. A keystroke in a preview tab already keeps it (`Source.svelte:31`).
  - Pros: the list can be walked without leaving it, as in VS Code.
  - Cons: it differs from the Search view.
- (b) Every press opens a kept tab with the keyboard in the editor, as Search does.
  - Pros: no new behaviour.
  - Cons: walking ten rows opens ten tabs.
- (c) The lazy option: single press only, no Enter behaviour.
- Recommendation: (a).

**N2. Going to a place the tab already went to, and the order with M6.**
- `Editor.svelte:176-193` goes once per line and column. A second press on the same row after the caret has moved does nothing, and neither does F8 landing on a place already gone to.
- M6's brief (section 2) adds `asked: Date.now()` to `SourceFile` and `SourceTabState` for exactly this, and changes the same effect and `openedAtShape`.
- (a) D33 is prepared after M6 lands. It passes `asked` on every press and F8 step, and adds the end line and end column in the same shape.
  - Pros: one mechanism; the merge question disappears.
  - Cons: D33 waits for M6.
- (b) D33 adds its own way to go again.
  - Cons: two mechanisms over one effect, and a merge with M6's lines that is not simple.
- (c) The lazy option: leave it, and a repeated press does nothing.
- Recommendation: (a).

**N3. Problem decorations beyond the Files tree.** User-visible.
- In VS Code 1.137.0, `workbench.editor.decorations.colors` and `workbench.editor.decorations.badges` both default to true (read from the bundle), and its Open Editors list draws the explorer's decorations.
- X3e gave the strip tab its file (`strip-tab.ts:28-29`). Open Editors is a section of the Files view, which D33's line names ("the Files view's problem decorations on its rows").
- (a) Open Editors rows and file tabs both get the problem colour and count, as VS Code.
  - Pros: VS Code's defaults.
  - Cons: widens the step into the shell's strip.
- (b) Open Editors only.
  - Pros: inside the step's own words.
  - Cons: tabs differ from VS Code.
- (c) The Files tree only. This is the lazy option, since it leaves the Files view's Open Editors rows undone.
- Recommendation: (a).
- Git colours on tabs are a different concern (source control). Under Z468 they are folded into an existing step, not this one.

**N4. The Settings cards' cursor (Z702 (11)).** The id is internal; what Enter does is user-visible.
- The ids collide (section 1), and Enter has nothing to press.
- (a) Each card gets an id unique in the pane, made of the file, the option key and its index path. Enter moves the keyboard into the card's first field.
  - Pros: the cursor marks one card, and Enter does something.
  - Cons: an Enter behaviour no ruling names. VS Code's Settings editor was not read for this.
- (b) Unique ids, and Enter does nothing.
- (c) The lazy option: the ids as they are, so the cursor marks every card at that index.
- Recommendation: (a).

**Not choices, for the brief**
- `Workbench.svelte` (515) is split by concern if the toggle adds lines.
- `TreeItem.svelte` (515) is not touched; the badge and the dot go in `FileRow.svelte`.
- The Problems store takes sources by registration, so D36, D40, D43 and M8's YAML server add rows without editing the store.
- Monaco's own F8 and Shift+F8, which cross files through the opener at `hosts.ts:129-148`, are replaced by the walk over the view's order, so there is one F8.

## 6. Libraries

The plan's configuration has `libraries: check` (`.agents/plan.yaml:15`).

**Already dependencies, reused**
- `@zag-js/tree-view` ^1.44.0 and `@tanstack/virtual-core` ^3.17.11 (`package.json:68`, `:58`), through `ui/tree/TreeView.svelte`, `list/virtual.ts` and `list/VirtualRows.svelte`. They serve the tree by file and the long list.
- `ui/Table.svelte` serves View as Table.
- `fuzzysort` 4.0.2 (`package.json:77`; MIT; farzher; released 2026-08-13 by `npm view fuzzysort time`), through `state/shared/words/fuzzy.ts`. It serves the text filter.
- `vscode-languageserver-protocol` 3.18.4 for the severities.
- `Intl.NumberFormat` for the compact counts.

**Marker aggregation**
- Monaco 0.57.0's `monaco.editor.getModelMarkers` and `onDidChangeMarkers` (already a dependency) join every owner's markers. They cover only files with a model open in the page, and only after Monaco has loaded, while command and LaTeX rows exist for files no tab holds. They cannot be the store. No other library was found for it.

**The filter's glob (`!exclude`, a path glob): a candidate**
- `picomatch` 4.0.7: MIT; maintainers mrmlnc, jonschlinkert, doowb and danez; released 2026-08-24 (`npm view picomatch version license maintainers` and `time`).
  - It is in `node_modules` only through fdir, from knip and svelte-check (`npm explain picomatch`), so using it means a new direct dependency.
  - It would replace a hand-written glob-to-RegExp.
- `minimatch` 10.2.6: BlueOak-1.0.0; isaacs; released 2026-07-27.
- No glob matcher runs in the page today. `matchesGlob` appears only in `server/machine/lsp/held/watch.ts` (grep), and Node's `path.matchesGlob` does not run in a browser.
- No ruling covers this choice.
- Options:
  - (a) picomatch as a direct dependency;
  - (b) minimatch (a less common licence, one maintainer);
  - (c) the lazy option: a filter without globs, short of the "filter box" Z702 (3) names.
- Recommendation: (a).

## 7. Paths D33 writes, as named on main now

Each path is under `tools/oculus/` unless it starts with `.scratch/`.

**The Problems view and its store**
- `src/lib/views/sources/search/Problems.svelte` (new; the folder goes from 6 to 7 items)
- `src/lib/views/sources/search/problem-rows.ts` (new; 8 items)
- `src/lib/state/system/problems.svelte.ts` (new; `state/system` goes from 8 to 9)
- `src/lib/state/system/machine/lsp/documents.svelte.ts`
- `src/lib/ui/controls/editor/kit/lsp/client.ts` (:446-448, library rows, Z702 (8))
- `src/lib/views/sources/source/language/lsp.ts` (:198)
- `src/lib/state/client/context.ts` (the store beside `documents` at :592; Show Problems at :429-435)
- `src/lib/state/workbench/rail-badges.svelte.ts`
- `src/lib/state/workbench/palette.ts` (only if Focus on Problems View is added)
- `config/text/views/sources/search.yml`
- `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml` (only for a new glyph)
- `config/layout.yml` line 82

**Keys and the card cursor**
- `src/lib/shell/keys/keys.ts`
- `src/lib/shell/keys/workbench-keys.svelte.ts`
- `src/lib/shell/Workbench.svelte` (515 lines; split if it grows)
- `config/text/app.yml` line 12

**The status bar**
- `src/lib/shell/status/status-items.ts`
- `src/lib/shell/status/StatusBar.svelte`
- `config/text/statusbar.yml`
- `src/lib/state/workbench/navigation/status.ts` (:213-217)
- `src/routes/+page.svelte` (:174, only if the counts are fed by the page)

**The Files decorations**
- `src/lib/state/sources/explorer/rows/decorations.ts`
- `src/lib/views/shared/explorer/rooted-tree.svelte.ts`
- `src/lib/views/shared/explorer/tree/Tree.svelte`
- `src/lib/views/shared/explorer/tree/FileRow.svelte`
- Under N3 (a) or (b): `src/lib/views/sources/files/sections/OpenEditors.svelte`
- Under N3 (a): `src/lib/shell/panes/strip/strip-tab.ts`, `src/lib/shell/panes/PaneView.svelte` and the strip's drawing component

**Opening at a range**
- `src/lib/state/sessions/source/draft.ts`
- `src/lib/views/sources/source/status/tab-state.ts`
- `src/lib/views/sources/source/Source.svelte`
- `src/lib/views/sources/source/SourceBody.svelte`
- `src/lib/views/sources/source/Editor.svelte`
- `src/lib/ui/controls/editor/types.ts`
- `src/lib/ui/controls/editor/commands.ts`
- `src/lib/views/shared/links/source-file.ts`
- `src/lib/ui/controls/editor/kit/lsp/hosts.ts`
- `src/lib/state/sources/repositories/repositories.svelte.ts` (only if command rows open through `openFile`)

**Command errors as marks**
- `src/lib/views/sources/source/language/extension.ts`
- A new file in `src/lib/views/sources/source/language/` (6 to 7 items)
- `src/lib/data/model/model-sessions.ts` (the stale comment at :715)

**The Audit and the Focus lane**
- `src/lib/views/system/audit/Audit.svelte`
- `src/lib/data/model/index.ts` (:330-336)
- `src/lib/server/content/audit/rules.ts`, `projects.ts`, `publications.ts` and `scan.ts`
- `src/lib/ui/controls/tool-button.ts` (:107)
- `src/lib/views/boards/focus/lanes/LaneCard.svelte` (:108)
- `config/text/views/system/audit.yml`

**The Settings cards**
- `src/lib/views/system/workbench/editors/Cards.svelte`, with `Rollup.svelte` and `Editor.svelte` in the same folder if the id needs the option key

**The TeX view**
- `src/lib/views/academic/latex/Latex.svelte`
- `src/lib/views/academic/latex/Problems.svelte` (deleted)
- `src/lib/views/shared/latex/Main.svelte`
- `src/lib/views/shared/latex/Problems.svelte` (deleted)
- `src/lib/views/shared/latex/places.ts`
- `config/text/views/academic/latex.yml`

**Documents**
- `DESIGN.md` lines 500 and 569, and a new passage. Line 23 only if the Problems view is named there; "no lint panel" there is D36's.
- `HELP.md`: line 56, the key rows 23-92, a views row after line 117, line 115.
- `docs/views.md`: lines 73, 203-205 and 265, and a new "Problems" section after line 86.
- `docs/window.md` line 82
- `docs/files-and-search.md` lines 9-13 and 57-61
- `docs/diagrams/`
- `.scratch/migration/agents/reviews/D33-report.md`

**Shared with M6** (`agents/briefs/M6.md:275-346`; its line numbers are from e6d00fb0f, which M6's recheck corrects)
- `src/lib/state/sessions/source/draft.ts`. M6's brief names `source/source.svelte.ts`, but the type is in `draft.ts`. Both change the `SourceTabState` body and `placed`/`sourceTabState`: the same lines.
- `views/sources/source/status/tab-state.ts`, `openedAtShape` :15-18. M6's brief says "openedAtShape reads the three". Same lines.
- `views/shared/links/source-file.ts`. Both change `SourceFile` :15 and the `openSourceFile` call. Same lines.
- `views/sources/source/Editor.svelte`, the effect at :176-193. Same lines.
- `views/sources/source/Source.svelte`. D33 changes the destructure at :142 and the props. M6 changes the load effect. The regions differ, but both depend on the props.
- `ui/controls/editor/types.ts` and `commands.ts`. M6's `goto` column is already on main (`types.ts:78`, `commands.ts:21-26`). If M6 still writes there, it is the same lines as D33's range at :78-79 and :21-45.
- `state/client/context.ts`. M6 writes :294-304 and :374-395 (`fsForms`); D33 writes :429-435 and :592. Different lines.
- `HELP.md`. M6's collection-view rows now live in `docs/views.md`. D33's rows are 56, the key rows and after 117. Not the same lines.
- `DESIGN.md`. M6's lines at head are 163, 388, 455, 507, 519, 550 and 567 (grep of each sentence). D33 writes 500 and 569. Line 567 is two lines from 569; not the same line.
- `docs/views.md`. If M6 rewrites the Funding section (:87), it sits next to D33's new section at :86. Adjacent, not the same line.
- `docs/diagrams/` is written by both.
- Not simple: the first four of these, which is N2's reason for D33 after M6.

**Shared with M8** (`agents/briefs/M8.md:138-166`, numbered at d5d7f727b)
- `config/text/statusbar.yml`. M8 adds `server_yaml` beside `server_svelte` at :91; D33 writes :9 and :41-44. Different lines.
- `DESIGN.md`:
  - M8 writes 23, 24, 44 and 165;
  - M8's "571" is now 572, the language servers paragraph;
  - D33 writes 500 and 569.
  - Different lines, unless D33 writes 23, which would be the same line.
- `docs/files-and-search.md`. M8's 69-71 is now the "Language servers" section at :83-86; D33 writes :9-13 and :57-61. Different lines.
- `docs/views.md`. M8 writes the Settings paragraph (its 239, now near :235); D33 writes elsewhere. Different lines.
- `docs/diagrams/` is written by both.
- Not shared: M8's `config/text/views/sources/source.yml`, `server/machine/lsp/*` and `views/system/workbench/settings/*`, against D33's `editors/Cards.svelte`.
- After M8, its YAML server sends diagnostics into the documents store under the language `yaml`. D33's view then lists them with no code change. A schema error in an open YAML file is then counted both by the new `problems` item and by M8's findings in the `findings` item, as Z702 (4)'s two items allow.

Usage: tokens not measured (about 295,000 by the context counter); about 120 tool uses; minutes not measured.

Usage: a0bfab6bc1676fec4, claude-opus-5-5, 318,224 tokens, 129 tool uses, 15.2 min.
