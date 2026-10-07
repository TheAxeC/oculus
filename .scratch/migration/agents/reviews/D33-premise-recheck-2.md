D33 premise recheck on main at 8bd2070c

Main moved during this recheck to d5d7f727b ("Give the PDF viewer its own box inside the frame"). `git diff --stat 8bd2070c7 d5d7f727b -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/docs` printed only `src/lib/views/sources/file/pdf/viewer.svelte.ts | 13`, which is not a D33 path, so every fact below holds at both commits. Plan line numbers are read at d5d7f727b.

I changed no file. I ran no state-changing git command. I did not open or grep `config/local.yml`, started no server and touched no port. Paths are under `tools/oculus/` unless they start with `.scratch/`.

**Read first**
- The diagnosis's fix still matches main's text. Its line numbers moved by +10, and `plan.md:596` still cites `workbench-keys.svelte.ts:358-367`; `reconcilePane` is now :402-412. The patch was not dry-run cleanly: `patch --dry-run` stopped with "malformed patch at line 10", because of the hunk header counts in the record. The context lines were matched by reading the file (item 1.4).
- D45 left three things D33 has to settle:
  - the TeX view's Problems section, which D45's brief kept "until D33" (`agents/briefs/D45.md:168`, `:385`);
  - "Show Problems" on a failed build, which opens the TeX view (`state/client/context.ts:419-424`);
  - the Explorer group at orders 0, 1, 2, 3 and 5, with order 4 free. D11's brief still claims orders 3 and 4 (`agents/briefs/D11.md:173`, `:186`, `:479`), and References holds 3.
- `shell/status/` is now full at 10 items, so a new status component needs a split. `state/system/machine/lsp/` is full at 10, so `documents.svelte.ts` can grow but no new file can go beside it.
- The diagnosis's "Outside this part" finding is not booked anywhere: `grep -n "Cards.svelte\|Settings view has Z446" plan.md orchestrator-state.md queue.md` printed nothing. The Settings cards carry `data-card` but draw no cursor (`views/system/workbench/editors/Cards.svelte:123`; `grep -rln cardCursor src/lib/views/system/workbench | wc -l` printed 0).
- Six steps are being prepared at once (`queue.md`: "Being prepared: X3e, D11, D15, M8, D43 and D33"). D11 writes most of D33's shell files (section 3).

## 1. Premises

**Authority** (`grep -n "^- D33 " plan.md` and the ruling greps)
- The step line is `plan.md:594`. The sub-bullets are :595 (Z446), :596 (Z461), :597 (Step 0, the diagnosis) and :598 (waits for D45). Holds.
- Rulings: Z86 `:822`, Z182 `:965` and `:179`, Z196 `:977`, Z281 `:1065`, Z298 `:1090`, Z446 `:1226`, Z458 to Z460 `:1239-1241`, Z461 `:1242`, Z468 `:1249`, Z503 `:1284`. Moved, in the numbers of the earlier recheck.
- The dependencies are ticked: D14 `:505`, D17 `:533`, D23 `:548`, D23c `:553`, D23b `:559` (`grep -n "^- ✅ D17 \|..."`). Holds.
- The step text still does not name Z458, Z459, Z460, Z196, Z281 or Z298. Holds, so the brief must carry them.

**Sub-bullet :595 (Z446)**
- `cardCursor` is at `state/workbench/layout/instance.ts:64`, with `withCardCursor` :69 and `reconcileCardCursor` :78 (grep). Holds.
- `Inbox.svelte:67` reads `const cursor = $derived(cardCursor(instance.state))`, and :139 hands down `cursor={cursor === thread.id}`. Holds.
- `Audit.svelte`:
  - It is 300 lines and has no `cardCursor` (grep printed only :30, :54, :61, :115, :125).
  - :115 is `<li data-card={finding.signature}>`, and :125 is the plain `<span class="where">`.
  - Both lists are keyed `` `${finding.signature}:${index}` `` (sed 100-200).
  - Holds.
- `activateCursor` at `shell/keys/key-dom.ts:54-61` clicks `.title button, [data-card-toggle]`. Holds.
- 17 views read `cardCursor(instance.state)`: `grep -rln ... | wc -l` printed 17. Holds.

**Sub-bullet :596 (Z461)**
- The citation `workbench-keys.svelte.ts:358-367` is false. `reconcilePane` is now :402-412, with its doc comment at :402 (grep -n).

**Step 0, :597 (the diagnosis's facts at main)**
- `workbench-keys.svelte.ts` is 498 lines, changed by 639820b91 and 0753a5e76 (`git log`).
- Lines: `lastFocusedPane` :86, `lastPagePane` :87, `observedPane` :88, `cardObserver` :89, `cards` :322, `moveCard` :361, `cursorIn` :375, `writeCursor` :380, `reconcilePane` :403, `observePane` :415, `syncCards` :437, `stopCards` :446, `rememberPane` :452.
- `Workbench.svelte` calls `keyboard.syncCards()` at :241 and `return keyboard.stopCards` at :242.
- Moved by +10 lines (D45's `tex-view` and D23b's `workspace-symbol` actions, and the `frameSlot` change). The bodies of `moveCard`, `reconcilePane`, `observePane`, `syncCards`, `stopCards` and `rememberPane` read exactly as the fix's context (`sed -n 355,475p`). Holds; only the lines moved.
- `clear-cursor` is now `keys.ts:251` (was :228/:229). `horizontalCursor` is :77 and `rowCursor` :84 (were :74 and :81). Moved.
- `Card.svelte:69-70` sets `data-card` and `data-cursor`. `Collection.svelte:208` holds `carry`. Holds.

**Sub-bullet :598 (waits for D45)**
- `config/layout.yml:82` now reads `[files, repositories, search, latex]`. Holds; D45 wrote it.
- `config/text/app.yml:12` is still the one-line keys sheet, now reading `s1-s5`. Holds.
- `LEFT_ITEMS` "at status-items.ts:30" moved: it is now multi-line at :31-40 with `latex` last. `itemName` is :67.
- `DESIGN.md:568` is still the status bar paragraph and now names `LatexItem.svelte`. Holds.
- "Source.svelte (520 of 520), which D45 splits": `wc -l` prints 517, so D45 left 3 lines of room. Moved.

**Language-server diagnostics (D23, D23b)**
- The transport receives them at `kit/lsp/transport.ts:729-737` (was :643-652). `#pageOf` is :751-754 and keeps `oculus-file:` and library addresses. The file is 871 lines, 9 under the limit. Moved.
- `client.ts` is 640 lines (was 547):
  - `#diagnostics` :195; `services.diagnostics` :448, called only when `place !== null`;
  - `#mark` :479-486, owner `markerOwner(this.language)`;
  - `#forget` :498-508, which returns before the store for a library registration (:505).
  - Moved.
- The wiring is `views/sources/source/language/lsp.ts:198`, `diagnostics: documents.setDiagnostics`. Moved from :194.
- `documents.svelte.ts` is 101 lines, unchanged:
  - The head comment :2-3 still names "the Problems view and the Explorer's decorations" as later readers.
  - `diagnosticsOf` is :70 and `countsOf` :74.
  - It still has no method listing every file it holds.
  - Holds.
- Readers: only `Outline.svelte:122`, and `countsOf` has no caller. The other two `countsOf` (`diff-hunks.ts:249`, `Diff.svelte:65`) are unrelated. Holds.
- The relay still forwards `publishDiagnostics` only for a document the server holds open. The rule is now `server/machine/lsp/relay.ts:774-776` (was :802-804); the file is 839 lines. Moved.
- Servers are per page. `held/held.ts:5` says the relay makes a server "for each page, root and registry entry".
- Languages that now feed the store: python, c, cpp, javascript, typescript, svelte (`lsp-servers.ts:79, :97, :115, :133`). New with D23b: javascript, typescript, svelte.
- Push diagnostics only: `grep -rn "textDocument/diagnostic" src/lib` finds none. Only `workspace/diagnostic/refresh` is answered, at `held/held.ts:309`.

**Command errors (D17, Z281, Z298)**
- `FOUND_MAX` :70, `ERROR_LINE` :74-75 (same regex), `errorMatch` :95, `openAt` :587, `note` :591-625, `readEnded` :634, `capture` :648, `commandDiagnostics` :662-671, declared :207, exported :721. The file is 727 lines. Holds.
- New with D45: `ranCommand` (:529-531) is `one?.task === true && one.job?.source !== 'latex'`. LaTeX build terminals are therefore never read for command errors, so LaTeX rows cannot appear twice through this path.
- The `CommandDiagnostic` type moved to `data/model/model-sessions.ts:703-714`, which is now 714 lines (was :865-876 of 876). Moved.
- Its doc comment ("relative to the command's folder or absolute as written") is still stale. `note` stores `pathUnder(job.repo, whole)`, or `whole` when the file is outside the repository (:613-617).
- Nothing reads `commandDiagnostics` outside its own file. Holds.
- The press path:
  - `grid-links.ts:16`, `:24`, `:39` calls `deps.openAt`.
  - The client context wires `openFile: (repo, path, line) => repositories.openFile(...)` at `context.ts:556` (was :468).
  - `repositories.svelte.ts:305` `openFile(root, path, line?)` takes no column.
  - `tabOfFile` is `file-git.ts:85`.
  - Moved and holds.

**LaTeX build log (D14, then D45)**
- `state/sessions/latex.svelte.ts` is gone. D45 split it into `state/sessions/latex/` (actions 388, builds 632, calls 206, latex-state 412, latex.svelte.ts 540 lines). Moved.
- `LatexDiagnostic` is `latex-state.ts:134-141`, `{ root, file, line?, severity, message, source: 'latex' }`, with no column. Holds in shape.
- `latexDiagnostics()` is `latex/latex.svelte.ts:476-498`. It reads only the cached `queries.entries<LatexState>`, so only roots the page has read contribute. It dedupes on root, file, line, severity and message. Holds.
- Its one reader is `views/sources/source/language/latex-editor.ts:66-69`. The marker owner `oculus-latex` is at `kit/latex/latex-widget.ts:54`. Moved.
- New with D45, two more lists of the same problems:
  - the TeX view's section `views/academic/latex/Problems.svelte` (74 lines), mounted at `Latex.svelte:212-213`;
  - the project panel's toggle `views/shared/latex/Main.svelte:129-142` with `shared/latex/Problems.svelte`.
  - The words are `latex.yml:108-112`, and `show_problems` is :145.
- A failed build's notice action "Show Problems" (`latex/builds.ts:286-289`) opens the TeX view (`context.ts:419-424`).

**Existing Problems surfaces**
- No Problems view and no Next Problem binding. `grep -rn -i "next problem|marker.next|problems view" src config` lists only three comments:
  - `kit/lsp/hosts.ts:146` (was :129-131);
  - `documents.svelte.ts:2`;
  - `navigation/status.ts:215`.
  - Holds.
- The `findings` item:
  - the comment `status.ts:213-217`, `findingsCount` :218, `allFindings` :230;
  - the drawing `StatusBar.svelte:104-115`;
  - the words `statusbar.yml:40-41` (were :38-39), with `item_findings` at :9;
  - the feed `src/routes/+page.svelte:171-173` (was :158-160).
  - Moved.

**Files view decorations**
- `decorations.ts` is 143 lines, with `statusFold` :93 and `decorationOf` :126. Holds.
- `Tree.svelte` is 385 lines, with the decoration at :330-340. Holds.
- `FileRow.svelte` is 162 lines, with the tone at :49-52 and the letter at :85-86. Holds.
- `TreeItem.svelte` is 494 lines. Holds.
- `colours.ts:400` maps `list.errorForeground` and :422 maps `list.warningForeground`. Holds.

**Status bar and opening**
- `status-items.ts` is 135 lines. `RIGHT_ITEMS` gained `svelte_config` (D23b), and `LEFT_ITEMS` gained `latex` (D45). Moved.
- `StatusBar.svelte` is 237 lines.
- `shell/status/` holds 10 items: Bell, LanguageItems, LatexItem, NoticeCentre, NoticeEntry, RepoItems, SourceItems, status-items.ts, StatusBar, Toast (`git ls-files`). Full; it was 9.
- Glyphs: `cross`, `warn` and `info` are at `glyphs.yml:76, 78, 86` and `icons.yml:75, 77, 85` (x-circle, alert-triangle, info). There is still no `error` glyph. Holds.
- `openSourceFile` takes `column` (`source-file.ts:15-22`), and the file is unchanged since c0a4af9c. Holds.
- `openSourceFile` has 24 callers outside tests (was 23): `grep -rn openSourceFile src/lib | grep -v .test. | wc -l`. Moved.
- `SourceTabState`'s `line?` :40, `column?` :45 and `library?` :50 are in `state/sessions/source.svelte.ts`, now 607 lines. `sourceTabState` is :173 and `libraryTabState` :191. Moved.
- The editor commands are `{ kind: 'goto'; line; column? }` and `{ kind: 'word'; line; column }` at `ui/controls/editor/types.ts:78-79`. Moved; the `goto` command gained `column?`.

**Audit, Z458 to Z460**
- `AuditFinding` is `data/model/index.ts:320-326` and still has no `file`. The file is 633 lines. Moved from :304-310.
- The `dataCardToggle` doc line ("Marks the project-card control...") is `tool-button.ts:107`, in 128 lines. Moved from :103.
- `ToolButton.svelte` is 443 lines, with the prop at :39 and `data-card-toggle` at :86.
- The LaneCard name button `<ToolButton plain cut {label} onclick={onopen} />` is `LaneCard.svelte:108`, in 231 lines. Holds.
- `server/content/audit/scan.ts:12` is the signature head comment, and `server/content/audit.ts` is absent. Holds.
- `DESIGN.md:500` is the Audit passage. Holds.
- `HELP.md:56` is the Enter row. Holds.
- The Audit text is now `docs/views.md:195-197` (was :185-187). Moved.
- The `add({` counts are still 26 (`projects.ts`) and 6 (`publications.ts`). Holds.
- `signatureOf` (`audit/rules.ts:143-150`) reads scope, where, kind, key and args, so a new `file` field keeps every mute (Z458's premise). Holds.
- The client shape `auditShape` (`payloads.ts:108-110`) is `listShape`, so it needs no change for `file`.

**Registry, groups, keys**
- The glob is `src/routes/views.ts:45`. `BadgeClient` is `registry.ts:29`, `Registration` :74 and `ViewRegistration` :124. `rail-badges.svelte.ts` is 294 lines. Holds.
- The Explorer group orders are now Files 0, Repositories 1, Search 2, References 3 and `latex` 5 (`Latex.svelte:11`). Changed: Z503's TeX view is in.
- `keyOf` (`catalogue.ts:163-169`) still answers only for `at < 9`, from the place in the list. So s1 to s5 are Files, Repositories, Search, References and TeX today.
- `DESIGN.md:471` ("There is no panel beside the tree") holds.
- `DESIGN.md:23` still says "It has no lint panel"; D36 rewrites it. Holds.
- No Cmd+Shift+M exists in `src/lib/shell`, `state/workbench` or HELP. `grep -rn "KeyM"` shows two LaTeX-tab bindings:
  - Math Preview Cmd+Alt+M (`latex-tab.svelte.ts:333`);
  - the math chord, Ctrl+Shift+M on macOS and Cmd(Ctrl)+M off it (`:384-386`).
  - New with D45.

**Folder counts and sizes** (`git ls-files ... | cut -d/ -f1 | sort -u | wc -l`; limit 10)
- Folder counts:
  - `views/sources` 10, full;
  - `views/sources/search` 6;
  - `views/system` 8;
  - `views/academic` 4;
  - `views/shared/links` 8 (was 9; `file-url.ts` removed);
  - `views/shared/explorer/tree` 9;
  - `state/system` 8;
  - `state/system/machine` 5;
  - `state/system/machine/lsp` 10, full (was 7);
  - `state/sources/explorer/rows` 5;
  - `state/client` 10;
  - `shell/keys` 8 (was 10; `rows/` folder made);
  - `shell/status` 10, full;
  - `ui/controls` 10;
  - `kit/lsp` 10;
  - `server/machine/lsp` 10;
  - `views/sources/source/language` 6;
  - `config/text/views/sources` 10, full;
  - `config/text/views/system` 8;
  - `data/model` 10.
- `extension.ts` is now 45 lines (was 30).

**Guarded entries and tests**
- G8, G13, G28, G29, G31, G35, G37 and G47 are present (`grep -n "^- G8\.\|..." agents/guarded.md`).
- No entry covers the card cursor, the stores or the status items.
- `grep -rln -E "errorMatch|decorationOf|statusFold|createDocuments|reconcileCardCursor|withCardCursor|findingsCount|latexDiagnostics|commandDiagnostics|setDiagnostics|LEFT_ITEMS|itemName" tests` exits 1. Holds.

**VS Code** (spot-check; `package.json` version printed 1.137.0)
- `grep -o ... | wc -l` over `workbench.desktop.main.js` found:
  - `problems.decorations.enabled` 1;
  - `workbench.actions.view.toggleProblems` 2;
  - `"status.problems"` 2;
  - `problems.sortOrder` 2;
  - `problems.defaultViewMode` 2;
  - `problems.autoReveal` 2;
  - `problems.showCurrentInStatus` 3;
  - `problems.visibility` 19.
- The survey's facts on these hold. The last three settings were not named before.

## 2. Changes since the earlier recheck (c0a4af9c)

`git log --oneline c0a4af9c..HEAD -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/docs` printed `0753a5e76` (D45), `639820b91` (D23b), `eede45985` (PR4) and, at the new head, `d5d7f727b` (PDF viewer only). Per path (`git log --format=%h c0a4af9c..HEAD -- <path>`, hunks from `git diff -U0`):

**Shell**
- `shell/keys/workbench-keys.svelte.ts` (639820b91, 0753a5e76): the `tex-view` and `workspace-symbol` actions (:209-227), the app doc comment (:62-65) and `frameSlot` reading `closest('[data-frame-of]')` (:292-301). The card cursor code is unchanged in text and moved by +10 lines.
- `shell/keys/keys.ts` (both): `tex-view` and `workspace-symbol` added to `KeyAction`, `showsTexView` (Cmd+Alt+X) and Cmd+T in `appKey`.
- `shell/Workbench.svelte` (both): `client.float`, the `lspEdits.publish()` effect at :233-237 (which moves the `syncCards` effect to :239-243), and `<Bell drawn={false} />` in a float window.
- `shell/status/status-items.ts`: D23b adds `svelte_config` (:42, :88-89); D45 adds `latex` and reflows `LEFT_ITEMS` to :31-40, with the head comment :7-25 and `itemName` :83-84.
- `shell/status/StatusBar.svelte` (D45): the `LatexItem` import :22 and the block at :150-152.
- New `shell/status/LatexItem.svelte` (D45).

**Model and controls**
- `data/model/index.ts` (both): re-exports. `AuditFinding` moved to :320.
- `data/model/model-sessions.ts` (D45): LaTeX types moved to `model-processes.ts`; `CommandDiagnostic` is now :703.
- `ui/controls/tool-button.ts` and `ToolButton.svelte` (D45): two new props, so the `dataCardToggle` doc line is now :107.

**Language servers** (all D23b)
- `kit/lsp/client.ts`: library hosting, `declared` commands, the `applyEdit` host and the line moves above.
- `kit/lsp/transport.ts`: the edits move to `transport/edits.ts`; `publishDiagnostics` is at :729.
- `server/machine/lsp/relay.ts`: the held folder; the rule moves to :774.
- `views/sources/source/language/lsp.ts`: the n-way servers; the wiring is at :198.

**LaTeX and commands** (D45)
- `state/sessions/latex.svelte.ts` was split into `state/sessions/latex/`.
- `latex-editor.ts` was rewritten.
- `state/sessions/terminal/commands.svelte.ts`: the :31-32 comment and `ranCommand`'s latex exclusion (:530).

**Source tab and client state**
- `state/sessions/source.svelte.ts` (both): 598 to 607 lines.
- `views/sources/source/Source.svelte` (both): 520 to 517.
- `ui/controls/editor/*` (both): `goto` gains `column?`.
- `state/client/context.ts` (both): the LaTeX hooks at :401-440 (Show Problems :419), the lsp edits store and the documents store at :537.
- `state/workbench/palette.ts` (D23b).

**Config**
- `config/layout.yml:82` (D45): `latex` appended.
- `config/text/app.yml`: :12 (D45, s1-s5 and the LaTeX keys) and D23b's insertions at :23-27, :34-35, :45-74.
- `config/text/statusbar.yml`: D23b at :21, :79-80, :109-113; D45 at :13 (`item_latex`) and :54-60.
- `glyphs.yml` and `icons.yml` (both).

**Documents**
- `DESIGN.md`:
  - PR4: :478, :574;
  - D23b: :23, :123, :165, :510, :522, :571-572;
  - D45: :121, :235, :531, :533, :535, :568, :574.
- `HELP.md`:
  - PR4: :103;
  - D23b: :68-70 and :99;
  - D45: :46, :66-75 (the LaTeX keys, among them Ctrl+Shift+M at :75) and :110 (the `latex` row).
- `docs/views.md`:
  - PR4: :101-102;
  - D23b: :69;
  - D45: :71-78 (TeX view), :239, :253-265.
- `docs/window.md`:
  - PR4: :7;
  - D23b: :7, :74;
  - D45: :15, :41, :59, :82 (the status bar paragraph, now naming the LaTeX item).
- `docs/files-and-search.md`: D23b :71; D45 :43.
- `.scratch/migration/agents/guarded.md` (8d9cdd605, eede45985, 639820b91, 0753a5e76): G55 is new, and the G36 and G47 text changed. None of them touches D33's units.

**Unchanged since c0a4af9c** (empty log): `instance.ts`, `Audit.svelte`, `LaneCard.svelte`, `server/content/audit/`, `documents.svelte.ts`, `navigation/status.ts`, `source-file.ts`, `repositories.svelte.ts`, `state/sources/explorer/rows/`, `TreeItem.svelte`, `catalogue.ts`, `registry.ts`, `rail-badges.svelte.ts`, `Outline.svelte`.

## 3. Paths this step writes

D33 has no brief yet. The set below follows the recommendations in section 5. Each path is marked new or existing, followed by the queued steps known to write it. Those are read from `agents/briefs/X3e.md:420-530`, `D11.md:367-416`, `D28.md:246-286` and `M6.md:275-318`, and for D43 and M8 from their rechecks, since they have no brief. D15's brief has no write list (7 lines). M7, D41, D39, D36 and D40 have only plan lines.

**The Problems view**
- `src/lib/views/sources/search/Problems.svelte` (new). The folder goes from 6 to 7 items, since `views/sources` is full. None.
- `src/lib/views/sources/search/problem-rows.ts` (new: sort, group, filter, count words; 8 items). None.
- `src/lib/state/system/problems.svelte.ts` (new: joins the three sources, maps a repository path to a root key; `state/system` goes from 8 to 9). None.
- `src/lib/state/system/machine/lsp/documents.svelte.ts` (a listing of every file, and the head comment :2-3). None in the queue. D43's recheck names this folder for `symbols.ts` only.
- `src/lib/state/client/context.ts` (the store beside `documents` at :537). D11 writes it (the debug store at the commands block), D28 (the source store), M6 (whole file). Simple if the regions stay apart.
- `src/lib/state/workbench/rail-badges.svelte.ts` (the tab badge). None.
- `config/text/views/sources/search.yml` (a `problems` group, since `config/text/views/sources` is full), or `config/text/views/system/problems.yml` (new). None.
- `config/catalogs/glyphs.yml` and `icons.yml` (the view's glyph, if a new one). X3e and D11 write both.
- `config/layout.yml:82` (the Explorer pane). None in the queue. D11 leaves the arrangement alone (`D11.md:479`).
- `src/lib/state/workbench/palette.ts` (Focus on Problems View, if added). X3e writes it.

**Keys and the card cursor**
- `src/lib/shell/keys/keys.ts` (Cmd+Shift+M). D11 writes it.
- `src/lib/shell/keys/workbench-keys.svelte.ts` (the toggle, and the diagnosis's fix at :86-89, :361-367, :402-412, :436-450). D11 writes it.
- `src/lib/shell/Workbench.svelte` (the toggle's option, if passed). D11 writes it.
- `config/text/app.yml:12` (s1 to s6, Cmd+Shift+M). D11 writes :12; X3e writes app.yml. This is a same-line conflict with D11.

**The status bar**
- `src/lib/shell/status/status-items.ts` (`LEFT_ITEMS` :31-40, `itemName`, head comment). D11 writes it.
- `src/lib/shell/status/StatusBar.svelte` (an inline block beside `findings` at :104-115, since the folder is full). D11 writes it.
- `config/text/statusbar.yml` (`item_problems` beside `item_findings` :9, and the words). D11 writes beside :9. Adjacent insertions.
- `src/lib/state/workbench/navigation/status.ts` (the comment :213-217, and any page-fed words). None.
- `src/routes/+page.svelte` (:171-173, if the words are page-fed). D11 writes :177-190.

**Files decorations**
- `src/lib/state/sources/explorer/rows/decorations.ts`. None.
- `src/lib/views/shared/explorer/rooted-tree.svelte.ts`. None.
- `src/lib/views/shared/explorer/tree/Tree.svelte` (:330-340). X3e writes :203-208, :271, :281-293 and :356-384: separate regions.
- `src/lib/views/shared/explorer/tree/FileRow.svelte`. None.

**Opening at the range (choice 5 (a))**
- `src/lib/state/sessions/source.svelte.ts`. X3e writes it. D28 moves it to `state/sessions/source/source.svelte.ts`, and M6 writes it at D28's path. Not simple: order matters.
- `src/lib/views/shared/links/source-file.ts`. M6 writes it.
- `src/lib/ui/controls/editor/types.ts` and `commands.ts`. M6 writes both.
- `src/lib/ui/controls/editor/Editor.svelte`. D11 and D28 write it.
- `src/lib/views/sources/source/Source.svelte` (517 lines). X3e, D11, D28 and M6 write it.
- `src/lib/state/sources/repositories/repositories.svelte.ts` (`openFile` gaining a column). X3e writes it.

**Command errors as editor marks (choice 6 (a))**
- `src/lib/views/sources/source/language/extension.ts`. D43 writes it (`D43-premise-recheck.md:227`).
- Possibly a new file in `views/sources/source/language/` (6 to 7 items). None.

**The Audit and the Focus lane (Z446, Z458 to Z460)**
- `src/lib/views/system/audit/Audit.svelte`. None.
- `src/lib/data/model/index.ts` (`AuditFinding` :320-326). D11 writes :509.
- `src/lib/server/content/audit/rules.ts`, `projects.ts`, `publications.ts` and `scan.ts` (:12). None.
- `src/lib/ui/controls/tool-button.ts:107`. None.
- `src/lib/views/boards/focus/lanes/LaneCard.svelte:108`. None.
- `config/text/views/system/audit.yml`. None.

**The Settings cards (choice 11 (a))**
- `src/lib/views/system/workbench/editors/Cards.svelte`. None.

**The TeX view and Show Problems (choice 10)**
- `src/lib/views/academic/latex/Latex.svelte` and `Problems.svelte`. None.
- `src/lib/state/client/context.ts:419-424` (listed above).
- `config/text/views/academic/latex.yml`. None known. D43's latex config work touches `behavior.yml` and `options.yml`, not this file.

**Documents**
- `DESIGN.md`:
  - :568 (status bar) is also written by D43 (`D43-premise-recheck.md` :568). A same-line conflict.
  - :500 (Audit), and a new Problems and decorations passage.
  - D11 writes 114, 153, 245, 279, 328 and 358-432; D28 writes 114, 116 and 395-398; M6 writes 151, 324, 362, 394, 400, 405, 421 and 428.
- `HELP.md`:
  - :56 (Enter row), a key row for Cmd+Shift+M and Next Problem, a views row after :109 or :110, and :110 under choice 10.
  - D11 writes 54-94, 102 and 120-122; D28 writes 165 and 267; M6 writes 97, 114-118, 121 and 124-129.
  - The key rows conflict with D11's 54-94.
- `docs/views.md`: a new Problems section, :197 (Audit), :71-78 and :257 (TeX view, choice 10). None known.
- `docs/window.md:82` (the status bar paragraph). None known.
- `docs/files-and-search.md`: the decorations, and a Problems passage away from :71, which D43 and M8 write.
- `docs/diagrams/` (regenerated). Every step writes it.
- `.scratch/migration/agents/reviews/D33-report.md` (new).
- `agents/guarded.md`: only if Axel rules a new entry; the orchestrator writes it.

**Summary of shares**
- D11 shares the most: `keys.ts`, `workbench-keys.svelte.ts`, `Workbench.svelte`, `status-items.ts`, `StatusBar.svelte`, `statusbar.yml`, `app.yml:12`, `context.ts`, `index.ts`, `Editor.svelte`, `Source.svelte`, `glyphs.yml`, `icons.yml`, HELP and DESIGN, and the Explorer orders.
- X3e shares `Tree.svelte` (other regions), `source.svelte.ts`, `palette.ts`, `app.yml`, `glyphs.yml`, `icons.yml`, `Source.svelte` and `repositories.svelte.ts`.
- D28 and M6 share the source-tab files. D28 moves `source.svelte.ts`.
- D43 shares `extension.ts` and `DESIGN.md:568`.
- No known writer: M8, beyond `files-and-search.md` and DESIGN :23 and :571; D15, M7, D41, D39, D36 and D40. D36 and D40 come after D33 and feed its view.

## 4. Libraries

Each capability, and whether a library could replace code the step would write by hand:
- **The tree, group-by-file list and virtual scrolling.** Nothing new: `@zag-js/tree-view` ^1.44.0 and `@tanstack/virtual-core` ^3.17.11 are already used by `ui/tree/TreeView.svelte` and `ui/tree/list/virtual.ts` (grep). The table mode reuses `ui/Table.svelte`. None found beyond what is there.
- **The fuzzy text filter.** `fuzzysort` 4.0.2 is already a dependency (`package.json`), used by `state/shared/words/fuzzy.ts`. Reuse it. Maintainer and release not read.
- **The glob filter** (`!exclude` and a path glob, as VS Code's Problems filter). Node's `path.matchesGlob` (used at `server/machine/lsp/held/watch.ts:17`) does not run in the page. Candidates:
  - picomatch 4.0.7: MIT; maintainers mrmlnc, jonschlinkert, doowb, danez; released 2026-08-24; engines node >=12 (`npm view`). It is CommonJS with a `posix.js` entry, and its only `process` use is guarded (`grep` of `lib/utils.js:23`), so it loads in the page through Vite. It is in `node_modules` only as a transitive dependency (`npm explain picomatch`: through fdir from knip, svelte-language-server and svelte-check), so a direct dependency would be new and needs naming. It would replace a hand-written glob-to-RegExp. The filter syntax, the `!` split and which field is matched stay hand-written.
  - minimatch 10.2.6: BlueOak-1.0.0; isaacs; released 2026-07-27; engines node 18, 20 or >=22.
  - No ruling covers this capability. The library audit's row for X3a's nesting patterns rejected both libraries for `${capture}` (`library-audit.md:207`), a different capability. D23's brief kept `path.matchesGlob` for the server-side watcher (`D23.md:684`).
- **Severity constants.** `vscode-languageserver-protocol` 3.18.4 is already a dependency (`DiagnosticSeverity`). Nothing new.
- **Compact counts** (`1K`, `10K+`). `Intl.NumberFormat` is built in, and VS Code's thresholds are a few lines. None found.
- **Command errors as markers.** `monaco-editor` 0.57.0 `setModelMarkers` is already used (`client.ts:481`). None new.
- **Files decorations, the card cursor fix, the Audit cursor and the status item.** None found; these are oculus's own shell and state code.

## 5. Choices

**User-visible, or changing an established decision**

1. **Where the Problems view sits, and the Explorer orders.** Today: Files 0, Repositories 1, Search 2, References 3, TeX 5 (Z503). D11's brief claims 3 and 4 for `debug` and `debug-console`, against References at 3.
   - (a) Problems at order 4 (s5), between References and the TeX view, added to `layout.yml:82` after `search`; D11 takes 6 and 7.
     - Pros: next to the files and editor its rows open; a key; the TeX view's s6 and D11's views fit in nine places.
     - Cons: the TeX view's chord moves from s5 to s6; a changed arrangement reaches only new or Reset pages.
   - (b) Problems at order 6, after the TeX view.
     - Pros: no existing chord moves.
     - Cons: it sits after a view of one file type.
   - (c) The System group.
     - Cons: it would be the eleventh view and get no key.
   - (d) A bottom default float.
     - Cons: it reads against `DESIGN.md:471`, and `floats:` reaches only an empty saved layout.
   - Recommendation: (a), with D11's orders corrected in its brief in the same ruling. One ruling settles all three steps. The lazy option: no arrangement place and no key.

2. **Its key.**
   - (a) Cmd+Shift+M (Ctrl+Shift+M off macOS), as `workbench.actions.view.toggleProblems`, plus the s chord.
   - (b) The chord only.
   - Whether Chrome on macOS keeps Cmd+Shift+M for itself is not verified. On macOS the key differs from the LaTeX math chord, which is Ctrl+Shift+M there (`latex-tab.svelte.ts:385`). Off macOS it differs from that chord's Ctrl+M.
   - Recommendation: (a), checked on TEST and in the app. The lazy option: (b).

3. **Sort, grouping, filter, view mode and VS Code's `problems.*` settings** (`decorations.enabled`, `sortOrder`, `defaultViewMode`, `autoReveal`, `showCurrentInStatus`, `visibility`; bundle counts in section 1).
   - (a) VS Code's defaults fixed and stated in HELP.md or DESIGN.md, as the Settings ruling's form: a tree by file; files by worst severity, then path; rows by severity, then position; a filter box; Show Errors, Warnings and Infos; Active File Only; Collapse All; View as Table; Copy and Copy Message; a tab badge.
   - (b) `problems.*` keys in `behavior.yml` and `options.yml` with G13 readers.
     - Pros: closer to VS Code's Settings.
     - Cons: more keys than any ruling asks for.
   - (c) A tree and a text filter only.
   - Recommendation: (a), which follows the Settings ruling's fixed-choice form. The lazy options: (c), and no filter.

4. **The status bar item.** `status.ts:213-217` calls the `findings` item "VS Code's Problems count".
   - (a) A new `problems` item after `sync` and before `findings`, drawn as VS Code's (`cross` N, `warn` N, `info` N only when non-zero), its press toggling the view; `findings` stays and its comment is rewritten.
   - (b) The `findings` item becomes Problems, and the hub's findings become a source of the view.
     - Cons: Z86 names only D23 and D17.
   - (c) Both counts in one number.
   - Recommendation: (a). The lazy option: (c).

5. **The range a press selects.**
   - (a) `SourceTabState` gains an end line and end column, and the press selects the range, as VS Code's `openFileAtElement`.
     - Cons: D28 and M6 also change that type, and D28 moves the file.
   - (b) The column plus D23c's word selection.
     - Cons: loses a range of several words, or an empty one.
   - Recommendation: (a), sequenced after D28 or before it with D28 carrying it. The lazy option: (b).

6. **Command errors as editor marks.**
   - (a) Markers in an open file under their own owner, so F8 reaches them.
   - (b) The view only.
   - Recommendation: (a), as VS Code's problem matchers do. The lazy option: (b).

7. **Files decorations.**
   - VS Code's form: a count badge or `9+`, the error or warning colour, a dot on a bubbling folder, errors and warnings only, the problem colour over git's, and letters joined `", "` (`2, M`).
   - Which sources decorate: all three (VS Code decorates every marker owner).
   - Recommendation: as VS Code, infos left out. The lazy option: colour only.

8. **Rows for a file outside every served root, and library files.** Library diagnostics never reach the page's store (`client.ts:446-448`, `:505`).
   - (a) List them under the path as written. A library row opens the read-only library tab, through a new hand-off from the client for `place === null`; any other such row is not openable.
   - (b) Drop them.
   - Recommendation: (a). The lazy option: (b).

9. **The words a row shows for its origin.** VS Code shows the marker's `source` and `code`.
   - The vocabulary in force: the server's own `source`, `command:<name>`, and `latex`.
   - (a) Show `source(code)` as VS Code does, with `command:` kept as the command's name only.
   - (b) Show the raw source strings.
   - Recommendation: (a).

10. **The TeX view's Problems section, the project panel's toggle and Show Problems** (D45's brief :168 "until D33", :385).
    - (a) Show Problems opens the Problems view, filtered to the root's files. The TeX view's section is removed, as D45's brief planned. The project panel keeps its count, which opens the Problems view.
      - Pros: one list, as D45 intended.
      - Cons: undoes a D45 surface Axel saw on TEST.
    - (b) Keep every list, and Show Problems opens the Problems view.
      - Pros: nothing removed.
      - Cons: three lists of one thing.
    - (c) Leave D45 as it is.
      - Cons: the notice never reaches the Problems view.
    - Whether LaTeX Workshop's own side bar has a Problems section was not checked.
    - Recommendation: (a), with that fact checked at /spec. The lazy option: (c).

11. **The Settings view's cards** (`Cards.svelte:123`, `data-card` with no cursor drawn; found by the diagnosis, unbooked).
    - (a) Folded into D33 under Z468: draw the cursor there as on the Audit.
    - (b) An open item for Axel.
    - (c) Left (the lazy option).
    - Recommendation: (a), since Z468 folds every keyboard-on-a-findings-list item into D33.

12. **A guarded entry and tests.**
    - (a) Ask Axel for an entry over the Problems fold.
    - (b) None. A wrong row costs no work, no installation and no configuration; the look and the diagnosis's red commands are the checks.
    - Recommendation: (b), which agrees with the diagnosis and `spec.md:57`.

13. **Problems from other windows.** Language servers and the documents store are per page (`held/held.ts:5`), so an app pop-out window's diagnostics are not in the main window's view.
    - (a) Per page, said in HELP.
    - (b) Gathered across pages over the relay: a new wire message.
    - Recommendation: (a). This rests on reading the code, not on a run.

14. **Next Problem across files.** Monaco's F8 stays in one file. The `hosts.ts:146` comment holds back a jump into another file.
    - (a) F8 and Shift+F8 walk the Problems view's order across files, as VS Code's `editor.action.marker.nextInFiles`.
    - (b) Unchanged.
    - Recommendation: (a). The lazy option: (b).

**Internal choices the brief can take** (each with my recommendation)
- The store is `state/system/problems.svelte.ts`, built over `documents`, `commands.commandDiagnostics()` and `latex.latexDiagnostics()`, one fold reused by the view, the status item, the badge and the decorations. A repository path is mapped to a root key through `tabOfFile`.
- `documents.svelte.ts` gains one listing method. Its head comment is rewritten.
- The status item is an inline block in `StatusBar.svelte`, since `shell/status` is full.
- The view and its row helper go in `views/sources/search/`, and the words as a `problems` group in `search.yml`.
- The card cursor fix is the diagnosis's diff applied at the +10 offset. The `moveCard` guard is kept.
- Audit rows take the card id `<signature>:<n>` (Q118's Decision 3), so duplicate signatures each hold a cursor.
- The stale doc comment at `model-sessions.ts:706` is corrected. The `documents.svelte.ts:2-3` and `status.ts:213-217` comments are rewritten.
- D33 is dispatched after D11 lands, or with D11's shared lines (`app.yml:12`, `status-items.ts`, `keys.ts`, `workbench-keys.svelte.ts`) judged at the second landing. Shell files are written by both, so this order is safer.

## 6. Cases

**Must pass, from the step text and the rulings**
- A pyright, clangd, TypeScript or Svelte diagnostic on an open file is listed under its file. A press opens the file at the line (and range).
- A task terminal line `src/x.ts:3:5: error: boom` is listed under `src/x.ts`. A press opens it at 3:5.
- A task terminal that ended with no pane reading it still gives its rows, through `capture` (Z298).
- A LaTeX build's errors and warnings, bad boxes as warnings, are listed (Z196 and D45 item 21). A problem with no file is the main file's, and one with no line opens the top.
- The status bar shows the error and warning counts. A press toggles the view.
- A Files row of a file with errors shows the error colour and a count; its folders bubble.
- An Audit row under the cursor draws `data-cursor`; the arrows move it; Enter opens the finding's file (Z458).
- A finding with an empty `file` has no link, and Enter does nothing.
- Enter on a Focus lane card acts (Z459).
- The `dataCardToggle` doc line names any card (Z460).
- The cursor kept across a reload: the diagnosis's `red.mjs` per view through `views.sh`, `red2.mjs`, `panechange.mjs`, `red3.mjs` and `filter.mjs`, all green. Inbox is checked on TEST, where the mail account exists.

**Implied, with the expected result**
- A file's last tab closes: its language-server rows go, since the relay sends only open documents (`relay.ts:774-776`).
- A file served under both `c` and `cpp`: each diagnostic is listed once per language that sent it, never merged.
- A diagnostic with no severity counts as an error (`countsOf`). Hints are not listed, as VS Code does not list them. Infos are listed under their toggle.
- A command error with an absolute path outside every root is listed and not openable (choice 8). One inside a repository that is no served root (`tabOfFile` null) is the same.
- More than 500 errors from one terminal: 500 are kept (`FOUND_MAX`), and the count says 500.
- A Rerun replaces the terminal's rows. A closed terminal's rows go (`commandDiagnostics` filters listed terminals).
- A LaTeX build terminal is never read as a command, so its rows appear once (`ranCommand`, :530).
- LaTeX rows exist only for roots whose state the page holds (`latexDiagnostics` reads the query cache); a root never opened in the page lists nothing.
- Under D43, texlab's `source: latex` rows against D45's build rows: not doubled, which is D43's C4.
- Counts over 999 read `1K`, over 9999 `10K+`. Zero problems read `0 0`, with the tooltip "No Problems".
- A file with a git `M` and two errors shows the problem colour and `2, M`. A file with only infos has no decoration.
- A root removed from the served roots: its rows go (`root_gone`).
- Two Audit findings with one signature: each holds its own cursor (`<signature>:<n>`).
- A cursor on a muted row while the muted list is collapsed: the row is not drawn, so the cursor is kept with no mark, and J and K do nothing (the `moveCard` guard). Escape clears it.
- A restored cursor whose card was removed between sessions: the same.
- A search that hides the held row clears it (`filter.mjs`).
- Cmd+Shift+M in Chrome on macOS: not verified whether Chrome takes it first.
- A filter of `!**/node_modules/**` hides those files' rows.
- An app pop-out window's diagnostics: listed in that window's page only (choice 13).

## Declined to judge

- **The VS Code facts.** Only the version and eight setting and command strings were re-read. The badge `9+`, the weights, the sort function `KFr`, the counts `1K` and `10K+` and the strings were not, since they do not depend on main.
- **Whether Chrome on macOS reserves Cmd+Shift+M, and whether Monaco binds a key there.** No browser was driven.
- **Whether LaTeX Workshop's own side bar has a Problems section.** Choice 10 rests on it; it was not read.
- **The diagnosis's red commands.** Not run: no server was started. Causes A and B are read from code whose text is unchanged; the run was not repeated.
- **Briefs that do not exist.** D43 and M8 are judged from their rechecks, and D15 has no write list. M7, D41, D39, D36 and D40 are judged from their plan lines only.

Agent: ab4dc39ae8a5346b0, claude-opus-5-5. Tokens, tool uses and time were not measured.
