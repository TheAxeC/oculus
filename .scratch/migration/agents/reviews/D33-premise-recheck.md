D33 premise recheck against main at c0a4af9c. I ran read-only commands only. I changed no file. Two git commands are worth naming: `git apply --check` (it checks a patch fed on stdin and writes nothing) and `git merge-base --is-ancestor`. I never opened, printed or grepped `config/local.yml`. Paths are under `tools/oculus/src/lib/` unless they start with `config/`, `tests/`, `docs/`, `DESIGN.md`, `HELP.md` or `.scratch/`.

**Not done or open, read first**
- **D43 has no brief.** `ls agents/briefs | grep D43` prints nothing. The D43 shares below are judged from `agents/reviews/D43-premise-survey.md` sections 2 and 6, not from a "Paths this step writes" list.
- **The VS Code facts were spot-checked, not re-read in full.** Five of them were checked in the bundle: version 1.137.0, `problems.decorations.enabled`, `"status.problems"` left at priority 50, `toggleProblems`, `problems.sortOrder` and `defaultViewMode`. The rest (badge `9+`, weights, nls strings, `KFr`) do not depend on main's head and were not re-read.
- **The D33 step text is still stale.** The second sub-bullet still cites `workbench-keys.svelte.ts:358-367`; it is :393-402 now. The step line and its sub-bullets still do not name Z458, Z459 or Z460 (read with `sed -n 587,590p plan.md`).
- **Three steps claim places in the Explorer group** (details under "Shared with D45 and D43", D45 item 8): D11's brief, D33's recommendation (a) and D45's Z503.

## Authority read
- The D33 step line: now `plan.md:587`. Its two Z468 sub-bullets are now :588 and :589. A new Step 0 line at :590 books the diagnosis (`grep -n "^- D33 " plan.md`, `sed -n 587,590p`).
- Z86: now :813. Z182: now :956 and :179.
- Z446: now :1217. Z461: now :1233. Z468: now :1240.
- Z458, Z459, Z460: now :1230-1232.
- Z196: now :968 and :504. Z281: now :1056. Z298: now :1081.
- D40, D43, D45, D36: now :512, :516, :519, :591.
- D23 (:542) and D17 (:527) are both ticked, so D33's dependencies are met.

## 1. Where diagnostics live today

**Language-server diagnostics**
- The arrival point is now `kit/lsp/transport.ts:643-652` (file is 819 lines, was 897). `#pageOf` (:666-669) now keeps a library address (`oculus-lib:`) as well as `oculus-file:`, and drops anything else.
- The transport hands `host.diagnostics(page, place | null, items)` to the client.
- The client keeps its private copy as now: `#diagnostics` keyed by address at `client.ts:164`, set at :396 (file is 547 lines).
- Markers are set by `#mark`, now at :429-435. The owner is `lsp-<language>` (`markers.ts:11-13`, holds). `toMarkers` is at `markers.ts:30`, holds.
- `services.diagnostics(...)` is now `client.ts:398`, and it is called only when `place !== null`. The wiring to `documents.setDiagnostics` is now `views/sources/source/language/lsp.ts:194`.
- The documents store holds: `state/system/machine/lsp/documents.svelte.ts`, 101 lines, unchanged.
  - It is `client.documents` (`context.ts:193`, created :452).
  - Its head comment :2-3 holds. The keys (:42-44, :52-68) hold.
  - `diagnosticsOf` (:70-72) and `countsOf` (:74-82) hold, and a missing severity still counts as an error.
  - It still has no method that lists every file it holds.
- Readers: `Outline.svelte` only, now at :122. `countsOf` still has no caller; the only other `countsOf` is the unrelated one in `diff-hunks.ts:249`.
- Lifetime, with the same three triggers:
  - `#unregister` calls `#forget`, now at :242. `#forget` is now :448-458.
  - A disconnect, now :336.
  - A server going `failed` or `not_found`, now :376.
- Addition the survey did not state: the relay forwards `publishDiagnostics` only for a document a server holds open (`server/machine/lsp/relay.ts:802-804`, `held.docs.get(docKey(...))`, and it returns when that is undefined). This was also true at fb7f076f (:804 there). So diagnostics of files not open never reach the page at all, not only after a tab closes.

**Command errors (D17)**
- These hold:
  - `ERROR_LINE` at `state/sessions/terminal/commands.svelte.ts:74-75`, with the same regex. `errorMatch` at :95.
  - `FOUND_MAX` at :70. `note` at :591-625. `capture` at :648-660.
  - `commandDiagnostics` at :662-671, declared at :207 and exported at :721. The file is 727 lines.
- `readEnded` is now :634-640.
- The `CommandDiagnostic` type at `data/model/model-sessions.ts:865-876` holds. That file is 876 of 880 lines.
- The survey's "file relative to the repo, or absolute" holds in the code: `note` stores `pathUnder(job.repo, whole)`, or `whole` (:613-617). The type's own doc comment (:868) says "relative to the command's folder", which the code does not do. That is a stale comment.
- Nothing reads `commandDiagnostics`: `grep -rn commandDiagnostics src tests` lists only commands.svelte.ts. This holds.
- They are still not Monaco markers. This holds.
- The press path holds:
  - `grid-links.ts:24-39` calls `openAt` (commands :587-589).
  - That calls `repositories.openFile` (`context.ts:468`; `repositories.svelte.ts:305-316`), which still takes a line and no column.
  - `tabOfFile` is at `file-git.ts:85-90`.

**LaTeX build log (D14)**
- Every fact holds:
  - `LatexDiagnostic` at `state/sessions/latex.svelte.ts:125-132`, with no column.
  - `latexDiagnostics()` at :753-777.
  - Its one reader is `latex-editor.ts:35-38`.
  - The owner `oculus-latex` is at `latex-widget.ts:38`, and the markers at :208-231.
  - The problems toggle in `views/shared/latex/Main.svelte:51-173`, and the words in `latex.yml:31-33`.
  - The file is 813 lines.

**Existing Problems list or count**
- There is still no Problems view, no `editor.problems` and no Next Problem binding: the survey's grep finds only two comments.
- The Next Problem comment is now `kit/lsp/hosts.ts:129-131`.
- The `findings` item holds:
  - the comment and `findingsCount` at `status.ts:213-224`, and `allFindings` at :226-236;
  - the drawing at `StatusBar.svelte:103-115` with glyph `warn`;
  - the words at `statusbar.yml:38-39`;
  - `LEFT_ITEMS` at `status-items.ts:30`;
  - the feed at `routes/+page.svelte:160`.

**What a Problems view must read**
- The three keys and the severities hold.
- Now: D23c's library diagnostics never reach the documents store. They stay in the client's `#diagnostics` and become markers on a library tab only; `#forget` returns early for a library registration (`client.ts:455`). The survey's "reaches the page under the library address", taken from D23c's brief, did not land in that form. A Problems view that wants library rows would need a new path from the client.

## 2. The Files view's rows and decorations
- Holds:
  - `decorations.ts`, 143 lines: `statusFold` at :93, `decorationOf` at :126.
  - The fold in `rooted-tree.svelte.ts:143-150`.
  - `FileRow.svelte`, 162 lines: the tone at :50-52, the letter at :85-86, `nameStyle` at :129, `end` at :131.
  - `colours.ts:400` and `:422`.
- Now: the decoration is passed at `Tree.svelte:330-340`. The file is 385 lines, because PR3 added one `title` line at :313. `TreeItem` is `ui/tree/TreeItem.svelte`, 494 lines.
- Rows still carry `row.root` and `row.path` (Tree.svelte :335).

## 3. The status bar and opening a file
- Adding an item still takes:
  - `LEFT_ITEMS` at :30 and `RIGHT_ITEMS` at :33-46;
  - `itemName` at :55-96;
  - a `shown()` block in `StatusBar.svelte`, 233 lines;
  - `statusWords` at `status.ts:239`, called at `+page.svelte:158`;
  - `shell/status/` holds 9 items.
- Glyphs `cross`, `warn` and `info` are at `glyphs.yml:76,78,86` and `icons.yml:75,77,85`. There is no `error` glyph. Holds.
- `openSourceFile` now takes a column: `views/shared/links/source-file.ts:17-29`, `SourceFile` with `column?`.
  - `SourceTabState` now has `column?` and `library?` (`state/sessions/source.svelte.ts:34-53`, 598 lines, was 505).
  - `sourceTabState(root, path, line, column)` is at :172; `libraryTabState` at :190.
  - New: `openLibraryFile` and `openReference` (source-file.ts:35-67).
- `grep -rn openSourceFile src/lib | grep -v .test. | wc -l` now prints 23, not 26.
- D23c landed the column selection as a new editor command kind `{ kind: 'word'; line; column }` (`ui/controls/editor/types.ts:58`, `commands.ts:25-43`), not as `goto` with `select?`. `Editor.svelte:176-190` sends `word` when a column is set.
- `repositories.openFile` still drops a column. Holds.
- An end range (survey choice 5 (a)) now touches:
  - `SourceTabState`, which G28 guards;
  - `Source.svelte:164-165` and `:456`. That file is at 520 of 520.
  - `Editor.svelte:176-190`;
  - `types.ts` and `commands.ts`.

## 4. The Audit view's card cursor (Z446)
- Holds:
  - `cardCursor`, `withCardCursor` and `reconcileCardCursor` at `instance.ts:64`, `:69` and `:78`.
  - The Inbox at `Inbox.svelte:67` and `:139`. `cardCursor(instance.state)` appears in 17 views.
  - `Audit.svelte` is 300 lines with `grep -c cardCursor` 0. `data-card` at :115, `.where` at :125, `instanceState` at :61, and the keys at :159 and :177.
  - `activateCursor` at `key-dom.ts:54-61`.
- Holds:
  - `AuditFinding` at `data/model/index.ts:304-310`. The file is now 611 lines.
  - The `dataCardToggle` doc line at `tool-button.ts:103` (124 lines). `ToolButton.svelte` is 440 lines.
  - `audit/scan.ts:12`. `server/content/audit.ts` is absent.
  - `DESIGN.md:500`. `HELP.md:56`.
  - The LaneCard name button at `LaneCard.svelte:108`.
  - The `add({` counts: 26 and 6.
  - `reconcilePane` at :393-402.
- Now: the Audit text is `docs/views.md:185-187`, not :179-181.

## 5. The reload sub-bullet and the diagnosis's conclusion
- `workbench-keys.svelte.ts` is unchanged since before the survey: 488 lines, last touched by 10ac00c6, which is an ancestor of fb7f076f.
- Every line the diagnosis cites holds: `lastFocusedPane` through `cardObserver` at :83-86, `cards` :312, `moveCard` :351, `cursorIn` :365, `writeCursor` :370, `reconcilePane` :393, `observePane` :405, `syncCards` :427, `stopCards` :436, `rememberPane` :442-450, and `Workbench.svelte:233-234`.
- Other citations hold: `horizontalCursor` and `rowCursor` at `keys.ts:74` and `:81`, `Card.svelte:69-70`, and Settings `Cards.svelte:123` `data-card={at}` with no `cardCursor` under `views/system/workbench`.
- `clear-cursor` is now `keys.ts:229`, not :228.
- The fix still applies: `sed -n 189,265p D33-diagnosis.md | git apply --check --recount -v -` printed `Checking patch .../workbench-keys.svelte.ts...` with exit 0.
- Causes A and B as stated still hold on this tree. They are read from unchanged code; I re-ran no red command.

## 6. Registry, groups, keys, folder counts, file sizes, guarded entries
- Registration:
  - The glob at `routes/views.ts:45` holds.
  - The `Registration` type is now `registry.ts:74-121` (`ViewRegistration` :124). `BadgeClient` is :29-52.
  - The badges file is `state/workbench/rail-badges.svelte.ts`, 294 lines.
  - `nav_groups` at `layout.yml:25-37` holds.
  - `keyOf` is now `catalogue.ts:163-169`, still `at < 9`. The digit read is now `keys.ts:237-250`.
- Explorer group: files 0, repositories 1, search 2, references 3, so `s5` is free today. Holds.
  - The arrangement is `layout.yml:76-82`, pane line :82. Holds.
  - The keys sheet `config/text/app.yml:12` now reads `s1-s4`.
- Holds:
  - `DESIGN.md:471` ("There is no panel").
  - floats at `layout.yml:112-113`.
  - The System group: 10 views, orders 0-9, `processes` 9.
  - No Cmd+Shift+M.
- Folder counts (`git ls-files -co --exclude-standard`, direct entries): every row of the survey's table holds.
  - `views/sources` 10, `views/sources/search` 6, `views/system` 8, `views/system/audit` 1, `views/shared` 10.
  - `explorer/tree` 9, `shared/links` 9.
  - `state` 10, `state/sources` 10, `explorer/rows` 5, `state/system` 8, `machine/lsp` 7.
  - `state/client` 10, `state/workbench` 10, `navigation` 10, `layout` 10, `sessions/terminal` 10.
  - `shell/status` 9, `shell/keys` 10, `ui/controls` 10, `data/model` 10.
  - `config/text/views` 10, `config/text/views/sources` 10, `config/text/views/system` 8.
  - Added: `ui/controls/editor/kit/lsp` 10 (full), `views/sources/source` 8, `server/machine/lsp` 9.
- File sizes (`wc -l`): every row holds except Tree.svelte 385 (was 384), `data/model/index.ts` 611 (609), References.svelte 368 (364) and Outline.svelte 255 (242).
  - Added: `client.ts` 547, `transport.ts` 819, `source.svelte.ts` 598, `Source.svelte` 520 of 520, `Editor.svelte` 292, `model-sessions.ts` 876 of 880, `lsp.svelte.ts` 395.
- Guarded entries: G8 (audit-mute test), G13, G16, G20, G21, G24, G28, G29, G31 and G37 hold. No test names the store, the parser, the folds or the cursor functions: `grep -rln -E "errorMatch|decorationOf|statusFold|createDocuments|reconcileCardCursor|withCardCursor|findingsCount|latexDiagnostics|commandDiagnostics|setDiagnostics" tests` exits 1.

## 7. Choices
The facts the choices rest on hold, with these changes:
- Choice 1: three steps now claim places in the Explorer group (detail under "Shared with D45 and D43", D45 item 8).
- Choice 5: D23c's mechanism is the `word` command, not `goto select`.
- Choice 8: library rows have no page-side source today (section 1).

## 8. Shared paths with PR3 and D23c
No longer current. PR3 (a2901490) and D23c (c0a4af9c) have landed. `git worktree list` shows main only, and the `dispatch:` block of `orchestrator-state.md` is empty. D33 builds on what landed, so no merge with either remains.

## Open points of the survey
- The first point holds: the step line is stale and Z458-Z460 are not named.
- The second point holds.
- The third point: D45's brief keeps the `latexDiagnostics()` shape with `source: 'latex'` (item 21, decision 7), but moves `latex.svelte.ts` into `state/sessions/latex/`.

## Changed since the survey
- D23c landed.
  - Diagnostics arrive at `transport.ts:643-652` with a library path. The transport is split into `kit/lsp/transport/`, and the kit folder is now full at 10.
  - Library diagnostics stay client-side as markers only.
  - The client's line numbers moved (listed in section 1).
  - `SourceTabState` gained `column?` and `library?`. `openSourceFile` takes a column. `openLibraryFile` and `openReference` are new.
  - The `word` editor command is new. `openSourceFile` now has 23 callers.
  - `Outline.svelte` is 255 lines, with its diagnostics read at :122. `References.svelte` is 368 lines.
- PR3 landed.
  - `Tree.svelte` gained one line; the decoration is at :330-340.
  - `index.ts` is 611 lines. The Audit text moved to `docs/views.md:185-187`.
- The keys sheet reads `s1-s4`.
- The plan's line numbers moved, and D33 has a Step 0 line (:590).
- The diagnosis fix still applies cleanly.

## Shared with D45 and D43

D33's write set is taken from the survey's recommendations; it has no brief yet. The judgments below assume those recommendations.

**D45** (`agents/briefs/D45.md:306-349`). These are not simple:
1. **`config/layout.yml:82`, the Explorer side pane `[files, repositories, search]`.** D45 adds `latex` and D33 (a) adds `problems`, on the same line. This always conflicts.
2. **`config/text/app.yml:12`.** The keys sheet is one line. D45 changes the `s` range and adds Cmd+Alt+B/C/V/J/M/X; D33 adds Cmd+Shift+M and the range. This always conflicts.
3. **`shell/status/status-items.ts:30`.** `LEFT_ITEMS` is one line. D45 appends `latex` last; D33 inserts `problems` before `findings`. Both also edit `itemName` (:55-96) and the head comment (:5-23). Conflicts.
4. **`shell/status/StatusBar.svelte`.** D45 draws a new `LatexItem.svelte` after the server item; D33 draws a block near the findings item (:103-115). The blocks are probably separate hunks, but both rewrite the head comment :7-13. Not simple unless one leaves the comment.
5. **`shell/status/` folder count.** It is 9 today. D45 brings it to 10 with `LatexItem.svelte`, so any new D33 file there needs a split. This depends on order.
6. **`config/text/statusbar.yml`.** Both add an `item_` name near :9 and words. These are adjacent insertions; judge once placed.
7. **`shell/keys/keys.ts`.** D45's Show TeX View and D33's Cmd+Shift+M both join the workbench key resolution beside `defaultCommand` (:89-103). Adjacent; not simple.
8. **Explorer group orders.** This is a design collision, not a text conflict.
   - D45 is ruled to order 5 (Z503).
   - D33's recommendation (a) is order 4.
   - D11's brief claims order 3 for `debug` and order 4 for `debug-console` (`agents/briefs/D11.md:173`, `:186`), and References already holds 3.
   - The places need one ruling before either brief is written.
9. **Documentation lines.** Both rewrite the status bar paragraph (`DESIGN.md:568`, `docs/window.md:82`) and the views lists (`HELP.md`, `docs/views.md`). Each paragraph is one line, so both edit the same line and it conflicts.
   - D45's own HELP and DESIGN line numbers predate Q125 (`git merge-base --is-ancestor e7952e16 f073b0494` says Q125 came after), so its recheck renumbers them.
10. **`views/sources/source/Source.svelte`** (520 of 520). D45 writes its LaTeX wiring and splits the file. D33 needs it only for choice 5 (a), the range, or for command markers drawn through the tab. If D33 needs it, this is not simple, and D33 should be built after D45's split.

These are simple:
- **`state/sessions/latex.svelte.ts`.** D45 moves it into `state/sessions/latex/`. D33 reads `latexDiagnostics()` through `client.latex` and does not write the file. Only a type import path follows the move, which whichever step lands second fixes.
- **`state/client/context.ts`.** D45 writes :320-335; any D33 store would go at about :452.
- **`state/sessions/terminal/commands.svelte.ts`.** D45 edits the :31 comment; D33's work is around :587-671.
- **`config/behavior.yml` and `options.yml`.** D45 edits the LaTeX block; a `problems.*` key from D33 goes elsewhere.
- **`docs/diagrams/`.** Regenerated after the merge.
- Not judged until both place their rows: `glyphs.yml`, `icons.yml` and `state/workbench/palette.ts`.

**D43** (from its survey, section 2 items 1-15). These are not simple:
- **`views/sources/source/language/extension.ts`** (30 lines). D43 combines `served` with `latexEditor`. If D33 brings command errors into the editor as an extension (choice 6 (a)), both change the one function.
- **`DESIGN.md:568`.** D43 changes "the Python interpreter or the compile database"; D33 adds the problems item to the same one-line paragraph.

These are simple:
- **`kit/lsp/client.ts`.** D43 edits `formatOnType` at :219. D33 would edit `#forget`/hosting at :395-458, if it changes them at all.
- **`config/text/statusbar.yml`.** D43's `server_texlab` sits by the language server words (about :76-89), away from D33's words.
- **`docs/files-and-search.md:71`.** D43's language server paragraph; D33's Problems passage would be separate.
- **`Outline.svelte`.** D43 rewrites :93-178; D33 only reads `diagnosticsOf`, unless D33 changes its signature.
- **`state/system/machine/lsp/`** (7 items). D43 writes `symbols.ts`; D33 writes `documents.svelte.ts`.

Not a merge, but D33 needs it: texlab's diagnostics flow into the documents store under `latex` (or `bibtex` if D43 chooses C5 (a)) with no D33 code. Two things go with that:
- Because of the relay rule (`relay.ts:802-804`), D43's undefined and unused labels in files not open never reach D33's list.
- D43's C4 (a), dropping texlab's `source: "latex"` diagnostics, is what keeps build errors from showing twice in the Problems view.

Agent usage: this recheck, claude-opus-5-5, about 225,000 tokens (from the context counter: 15,000,000 at start, about 14,776,000 at the end), 60 tool uses, time not measured.

Agent: a27c6b96e19cd7774, claude-opus-5-5, 233,058 tokens, 77 tool uses, 7.2 min.
