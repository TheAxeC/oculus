Survey for D33's brief. Read-only: no file edited, no git command that changes state, no server, no test run, no skill, no agent. `tools/oculus/config/local.yml` was never opened, printed or grepped (every grep over `config/` used `--exclude=local.yml`). Paths are under `tools/oculus/` unless they start with `tools/` or `.agents/`.

Main's head: `git rev-parse --short HEAD` printed `fb7f076f`. `git status --short` printed `?? tools/oculus/.scratch/migration/agents/briefs/D23c.md`.

## Authority read

- The D33 step line is `plan.md:579`. It reads: "a Problems view as VS Code's: D23's diagnostics and the errors of D17's commands grouped by file, a press opening the file at the line, its count on the status bar; after D23 and D17 (Z86 (a)), and the Files view's problem decorations on its rows (Z182 (a))". It has two sub-bullets, both "Widened 2026-10-05 (ruling Z468, the user)":
  - `:580`: the Audit rows draw the card cursor, and Enter acts on the row (Z446).
  - `:581`: the card cursor survives a reload, the cause found with /diagnose (Z461).
- Rulings, found with `grep -nE "D33|Problems" plan.md`:
  - Z86 is `:803`, the user: "(a), a Problems view as VS Code's over D23's diagnostics and D17's command errors (D33)".
  - Z182 is `:946` and `:179`, the orchestrator under automode: "the Explorer's problem decorations are D33's".
  - Z446 is `:1207`, Z461 is `:1223`, Z468 is `:1230`.
  - Z468 folds into D33 the whole of Q118 ("the Audit rows draw the keyboard cursor, Enter opens the finding's file, Enter on a Focus lane card") and the whole of Q121 ("the card cursor across a reload, reproduced on TEST first").
- Lines that also bind D33 but are not on its step line:
  - Z196 (`:958`, `:502`): D14 "publishes [the build log's errors and warnings] as diagnostics for D33". So LaTeX is a third source of rows.
  - Z281 (`:1046`): command errors are "published as diagnostics in D14's shape for D33".
  - Z298 (`:1071`): an ended task terminal's captured output is read for diagnostics.
  - Q118's own rulings, which come with Z468's fold:
    - Z458 (`:1220`): each `AuditFinding` carries `file`; the place becomes a link; Enter presses it.
    - Z459 (`:1221`): the Focus `LaneCard` name button gets `dataCardToggle`.
    - Z460 (`:1222`): the `dataCardToggle` doc line is rewritten.
  - **The D33 sub-bullets do not name Z458, Z459 or Z460, so the brief must carry them explicitly.**
  - D36 (`:582`), D40 (`:510`), D43 (`:514`) and D45 (`:517`, "in the Problems list") all feed D33's view later.

## 1. Where diagnostics live today

**No store joins the three sources.** Each one has a different shape, a different key and its own reader. Each fact below was read with `grep -rn -iE "diagnostic|setModelMarkers|publishDiagnostics" src config --exclude=local.yml` and then `sed`/`cat -n` of each hit.

**Language-server diagnostics (D23)**
- They arrive at `ui/controls/editor/kit/lsp/transport.ts:754-757` (`textDocument/publishDiagnostics` becomes `host.diagnostics(place, ...)`). `place` comes from `placeOf(params.uri)`, and a URI that is not `oculus-file:` is dropped there.
- The client `ui/controls/editor/kit/lsp/client.ts` does two things with them:
  - It keeps a private copy, `#diagnostics` (`:153`, set at `:382`).
  - It sets Monaco markers per model under owner `lsp-<language>` (`#mark` at `:413-420`; `markerOwner` at `markers.ts:11-13`; the shape conversion `toMarkers` at `markers.ts:30-...`).
- It hands the diagnostics to the page through `services.diagnostics(root, path, language, items)` (`client.ts:383`). That is wired to `documents.setDiagnostics` at `views/sources/source/language/lsp.ts:156`.
- The page's store is `state/system/machine/lsp/documents.svelte.ts` (101 lines), held as `client.documents` (`state/client/context.ts:193`, created `:452`).
  - Its head comment, `:2-3`, names "the Problems view and the Explorer's decorations" as future readers.
  - It keys by `JSON.stringify([root key, path])` and then by language (`:42-44`, `:52-68`).
  - API: `diagnosticsOf(root, path)` (`:70-72`) and `countsOf(root, path)` (`:74-82`, counting errors, warnings and others; a missing severity counts as an error).
  - **It has no way to list every file it holds**, which a Problems view needs.
- Readers today: `grep -rn "countsOf\|diagnosticsOf\|setDiagnostics" src tests` finds only `views/sources/files/sections/Outline.svelte:116` (`diagnosticsOf`). `countsOf` has no caller.
- Lifetime: a file's diagnostics are taken out of the store when its last model closes (`#unregister` calls `#forget` at `client.ts:227`, `#forget` at `:432-440`), when the client disconnects (`:321`), and when a server goes `failed` or `not_found` (`:361`). So the store only ever holds files open in some tab.

**Command errors (D17)**
- The parser is `ERROR_LINE` at `state/sessions/terminal/commands.svelte.ts:74-75`: `/^(?<file>[^\s:][^:]*):(?<line>\d+)(?::(?<column>\d+))?:\s*(?<severity>error|warning)\b:?\s*(?<message>.*)$/i`. It is exposed by `errorMatch` at `:95-111`.
- They are held per terminal in `outputs.byId` and filled by `note()` (`:591-625`), capped at `FOUND_MAX = 500` (`:69-70`). An ended terminal no pane read is captured once and parsed (`capture` `:648-660`, `readEnded` `:633-639`).
- `commandDiagnostics()` (`:662-671`) returns them, of type `CommandDiagnostic` (`data/model/model-sessions.ts:865-876`): `{ root: <absolute repository path>, file: <relative to the repo, or absolute when outside it>, line, column?, severity: 'error'|'warning', message, source: 'command:<name>' }`.
- **`grep -rn commandDiagnostics src tests` lists only its declaration (`:207`), its body (`:662`) and its export (`:721`). Nothing reads it.**
- They are not Monaco markers anywhere, so Monaco's F8 never reaches them.
- A press on an error in the terminal goes through `grid-links.ts:29-39`, then `commands.openAt(repo, path, line)` (`:587-589`), then `repositories.openFile(repo, path, line)` (`state/client/context.ts:468`, `state/sources/repositories/repositories.svelte.ts:305-316`). That function builds the tab state inline, with a line and no column. The repository-to-root-key mapping is `tabOfFile` (`state/sources/repositories/file-git.ts:85-90`).

**LaTeX build log (D14)**
- `LatexDiagnostic` is at `state/sessions/latex.svelte.ts:125-132`: `{ root: <root key>, file: <against the root>, line?, severity, message, source: 'latex' }`. It has no column.
- `latexDiagnostics()` (`:753-777`) builds them from the cached `LatexState` query entries, so only folders whose LaTeX state the page has read contribute.
- Its one reader is `views/sources/source/language/latex-editor.ts:35-38`. That reader turns them into Monaco markers under owner `oculus-latex` (`ui/controls/editor/kit/latex/latex-widget.ts:38`, `:208-231`).
- The LaTeX row draws its own "N problems" toggle (`views/shared/latex/Main.svelte:51-173`; words `latex.problem`, `latex.problems`, `latex.problem_counts` at `config/text/views/academic/latex.yml:31-33`).
- `latex.svelte.ts` is 813 lines, 67 under 880.

**Existing Problems list or count**
- `grep -rniE "problems view|nextProblem|editor.action.marker|gotoError|editor\.problems" src config --exclude=local.yml` finds no Problems view, no `editor.problems` key and no Next Problem binding of oculus's own.
- Next Problem is Monaco's built-in action. Its only trace is the comment at `ui/controls/editor/kit/lsp/hosts.ts:125-128` (the opener returns false so Next Problem into another file does not loop). Whether F8 is reachable from a press was not verified.
- **The status bar already has a `findings` item, described as VS Code's Problems count:**
  - `state/workbench/navigation/status.ts:214-224`: "as VS Code's Problems count is the Problems view's".
  - It counts the Findings view's list: snapshot plus config plus apps findings (`allFindings` `:226-236`), and opens `findings`.
  - It is drawn at `shell/status/StatusBar.svelte:103-115` with glyph `warn`, words `statusbar.findings_name`/`findings_tip` (`config/text/statusbar.yml:38-39`).
  - It sits in `LEFT_ITEMS` at `shell/status/status-items.ts:30`.
  - It is fed by `findingsCount(...)` at `routes/+page.svelte:160`.

**What a Problems view must read**
- `client.documents`, which needs a method that lists every file and its diagnostics.
- `client.commands.commandDiagnostics()`, with the absolute repository path mapped to a root key through `tabOfFile`.
- `client.latex.latexDiagnostics()`.
- Later: D36's linters, D40, D43, and D45's replacement of D14's LaTeX state.
- The three keys differ: (root key, path, language); (absolute repo, repo-relative or absolute file); (root key, root-relative file). Severities differ too: the protocol's 1 to 4, and the strings 'error' and 'warning'.
- D23c will add one more case. Under its Part 1 item 3, a `publishDiagnostics` for a library file the page holds a token for "reaches the page under the library address" (`agents/briefs/D23c.md:41`, case 10), an `oculus-lib:` address with no root key and no path.

## 2. The Files view's rows and how a decoration is drawn

- `state/sources/explorer/rows/decorations.ts` (143 lines, pure) works by absolute path.
  - `statusFold(repos)` (`:93-119`) builds `{ files: Map<abs path, Mark>, folders: Map<abs path, Tone>, whole: [] }` from the `git` channel lists.
  - `decorationOf(fold, absPath, kind)` (`:126-143`) answers `{ mark: 'M'|'U'|'A'|'D'|'R'|'!' | '', tone: 'conflict'|'deleted'|'modified'|'added' }`.
  - A folder takes the strongest tone below it and gets no letter (`:8`, `:105-111`).
- The fold is derived in `views/shared/explorer/rooted-tree.svelte.ts:143-150` from `gitRoots()`.
- Each row is given `decoration` at `views/shared/explorer/tree/Tree.svelte:329-338` (the root's `dir` joined to `row.path`).
- `views/shared/explorer/tree/FileRow.svelte` (162 lines) draws it:
  - The colour is `--tone-txt: var(--c-scm-<tone>-txt)` on the name, through `TreeItem`'s `nameStyle` (`:50-52`, `:129`).
  - The letter is the `end` snippet `<span class="letter">` (`:84-88`, `:131`), styled at `:142-151`.
- Rows carry `row.root` (a root key) and `row.path`, so a problem lookup by root key and path fits the documents store without going through an absolute path.
- VS Code 1.137.0, read from `/Applications/Visual Studio Code.app/.../workbench.desktop.main.js` with python `find`:
  - The problems decoration provider (`fmo`) reads only warnings and errors (`severities:12`).
  - Its badge is the count, or `9+` from ten on. Its colour is `list.errorForeground` or `list.warningForeground` by the worst severity. Its weight is `100*severity`, and it bubbles up.
  - Its tooltip is "1 problem in this file" / "{0} problems in this file" (nls 17211, 17212).
  - When several decorations meet on one row, they are sorted by weight, the colour is taken from the heaviest, the letters are joined `", "`, and a folder that bubbles draws a dot (codicon ``, opacity 0.4).
  - The setting is `problems.decorations.enabled`, default true.
- oculus already maps those colours: `ui/controls/editor/kit/theme/colours.ts:400` `list.errorForeground` to `--c-red-txt` and `:422` `list.warningForeground` to `--c-amber-txt`.

## 3. The status bar and where a press opening a file goes

**Adding a status bar item** takes these places:
- An id in `LEFT_ITEMS` or `RIGHT_ITEMS` (`shell/status/status-items.ts:30-46`). The order is the drawn order; VS Code's order is in the head comment `:5-11`.
- A case in `itemName` (`:55-96`) with `statusbar.item_<id>` in `config/text/statusbar.yml` (170 lines). The right-click menu then lists it, and the ui store's hidden set keys it.
- A `{#if shown('<id>')}<span data-status="<id>"><ToolButton status ...>` block in `StatusBar.svelte` (233 lines).
- Its words: either page-fed through `statusWords` (`state/workbench/navigation/status.ts:239-256`, called at `routes/+page.svelte:158`), or read by the shell from a store the shell's boundary row names (`StatusBar.svelte:7-13`).
- `shell/status/` holds 9 items.

**VS Code's item**, from the bundle and `nls.messages.json`:
- Entry `status.problems`, left alignment, priority 50.
- Text `$(error) N $(warning) N`, with `$(info) N` added only when there are infos. Numbers over 999 read `1K`; over 9999 read `10K+`.
- Tooltip "Errors: {0}, Warnings: {0}, Infos: {0}" (only the non-zero ones), or "No Problems".
- Press: `workbench.actions.view.toggleProblems`.
- The view's tab badge reads "Total {0} Problems".
- oculus glyphs that exist for this: `cross` (lucide `x-circle`), `warn` (`alert-triangle`), `info` (`info`) at `config/catalogs/glyphs.yml:76,78,86` and `icons.yml:75,77,85`. There is no glyph named `error`.

**Opening a file at a line and column**
- `openSourceFile(client, { root, path, line })` (`views/shared/links/source-file.ts:16-28`) calls `sourceTabState(root, path, line)` (`state/sessions/source.svelte.ts:155-162`). `SourceTabState` has `line?` and no column (`:31-36`).
- `grep -rn openSourceFile src/lib | grep -v .test. | wc -l` prints 26.
- D23c (`agents/briefs/D23c.md:53-59`) adds `column?` to `SourceTabState`, `sourceTabState` and `openSourceFile`, and adds `goto` `select?: boolean` so the word at the column is selected.
- `repositories.openFile` (`repositories.svelte.ts:305-316`), which the command error links use, builds its state inline and is not in D23c's write list. A column passed through it is dropped.
- VS Code's Problems open (`openFileAtElement`) passes `selection: marker.range`, the whole start-to-end range, with `preserveFocus` on a single press and a range highlight. D23c selects only the word at the start column.

## 4. The Audit view's card cursor (Z446)

- `cardCursor(state)` is at `state/workbench/layout/instance.ts:64-66`. `withCardCursor` is `:69-75` and `reconcileCardCursor` is `:78-81`.
- The Inbox reads it with `const cursor = $derived(cardCursor(instance.state))` (`views/feeds/inbox/Inbox.svelte:67`) and hands `cursor={cursor === thread.id}` down (`:139`).
- `grep -rn "cardCursor(instance.state)" src/lib/views | wc -l` prints 17.
- `views/system/audit/Audit.svelte` (300 lines) does not read the cursor (`grep -c cardCursor` prints 0).
  - Its row is `<li data-card={finding.signature}>` (`:115`).
  - The place is a plain `<span class="where">` (`:125`).
  - Its own state is the ui store's, `instanceState(instance.id)` (`:61`).
  - Both lists are keyed `` `${finding.signature}:${index}` ``, so two rows can share one card id.
- Enter: `activateCursor` (`shell/keys/key-dom.ts:54-61`) clicks `.title button, [data-card-toggle]` inside the cursor's card.
- To draw the cursor, the view reads `cardCursor(instance.state)`, sets `data-cursor` on the matching `li`, and adds a style (an accent outline inset 1px, `--row-reveal: 1`). Enter also needs a `dataCardToggle` control in the row.
- **Q118's brief (`agents/briefs/Q118.md`) is the full design but its line numbers are stale**, read on main now:
  - `AuditFinding` is `data/model/index.ts:304-310` (brief says 258-264).
  - The `dataCardToggle` doc line is `ui/controls/tool-button.ts:103` (124 lines). `ToolButton.svelte` is 440 lines, not 539, so the split that Q118's Decision 4 relied on no longer applies.
  - The scan's head comment is `server/content/audit/scan.ts:12`; `server/content/audit.ts` does not exist.
  - The Audit passage is `DESIGN.md:500` (brief says :390).
  - HELP's Enter row is `HELP.md:56` (brief says :79).
  - The Audit text is `docs/views.md:179-181`; HELP's views table moved there.
  - LaneCard's name button is `views/boards/focus/lanes/LaneCard.svelte:108`.
  - `add({` counts: `server/content/audit/projects.ts` 26 and `publications.ts` 6, unchanged.
  - `reconcilePane` is now `workbench-keys.svelte.ts:393-402`. The plan line `:581` cites :358-367.

## 5. The reload sub-bullet (Z461), a lead only

- **How the cursor is stored.** The shell writes it with `options.layout.restateInstance(id, withCardCursor(state, cursor))` (`shell/keys/workbench-keys.svelte.ts:370-386`). That goes into the layout tree's instance `state` (`state/workbench/layout/instances.ts:113-126`), which is saved with the layout (`state: z.unknown().optional()` at `layout/saved/saved.ts:74`, restored at `:345`). A view reads it as `instance.state`.
- **Path that clears it before the first rows.**
  - `Workbench.svelte:231-235` runs `keyboard.syncCards()` in an effect on each page change, which includes the first mount after a reload.
  - `syncCards` (`:427-434`) picks `focusedPaneElement()` and, when that pane's instance holds a cursor, calls `observePane(pane)`.
  - `observePane` calls `reconcilePane(pane)` at once (`:408`).
  - `reconcilePane` (`:393-402`) compares the cursor with `cards(pane)`, which is the visible `[data-card]` elements filtered by `offsetParent !== null` (`:312-318`).
  - Before the view's channel has sent its first payload, the view draws no rows. `cards` is then `[]`, `reconcileCardCursor` drops the cursor, and `writeCursor(pane, null)` clears and saves.
  - Because the cursor is then null, `observePane` returns at `:409` without observing, so nothing restores the cursor when the rows arrive.
- **Second path.** `rememberPane` (`:442-451`) calls `writeCursor(lastFocusedPane ?? pane, null)`. After a reload `lastFocusedPane` is null, so the first press or focus into the pane holding the cursor clears that pane's own cursor.
- **Third case.** A pane that is not `focusedPaneElement()` is not observed at reload. Its cursor survives until that pane gets the second path.
- These are readings of the code. No run reproduced them; the diagnosis runs separately.

## 6. The views registry, groups, keys, folder counts, file sizes, guarded entries

**How a view is registered**
- Each view has a `<script module>` exporting `registration: ViewRegistration = { id, label, glyph, group, order, listed?, badge?... }` (type at `state/workbench/navigation/registry.ts:71-120`). Modules are collected by `import.meta.glob('$lib/views/**/*.svelte')` (`routes/views.ts:45`).
- A group is a `nav_groups` key in `config/layout.yml:25-37` with its `chord` letter.
- The key range: `keyOf` (`state/workbench/navigation/catalogue.ts:161-167`) gives a letter plus digit only for places 1 to 9 (`at < 9`), and `keys.ts:236-248` reads only digits `[1-9]`.
- A tab badge needs a hook over `BadgeClient` (`registry.ts:29-51`, whose stores come from `rail-badges.svelte.ts`, 294 lines).

**Explorer group** (chord `s`), from `grep -rn "group: 'explorer'" -A3 src/lib/views`:
- `files` order 0, `repositories` 1, `search` 2, `references` 3. So `s5` is free.
- The Explorer page's arrangement is `[files, repositories, search]` in the left pane and `view: []` in the right (`config/layout.yml:76-82`).

**The Panel**
- oculus has none. `DESIGN.md:471`: "There is no panel beside the tree". The only default float is `{ view: [hpc, usage], dock: right, size: 0.3 }` (`layout.yml:112-113`).
- The System group (`views`, chord `y`) already has 10 views, orders 0 to 9 (`grep -rln "group: 'views'" ... | xargs grep order`). Its tenth view (`processes`) already has no key, and an eleventh would have none.
- VS Code puts Problems in the Panel at `order: 0`, keybinding `primary: 3115` (Cmd+Shift+M), default view mode `tree`. Read from the bundle's `registerViews` and `problems.defaultViewMode`.
- `grep` over `shell/keys`, `state/workbench` and `HELP.md` finds no Cmd+Shift+M in oculus.

**Folder item counts**, by `git ls-files -co --exclude-standard` per folder (limit 10):

| Folder | Items |
|---|---|
| `views/sources` | 10 (full) |
| `views/sources/search` | 6 |
| `views/system` | 8 |
| `views/system/audit` | 1 |
| `views/shared` | 10 |
| `views/shared/explorer/tree` | 9 |
| `views/shared/links` | 9 |
| `state` | 10 |
| `state/sources` | 10 |
| `state/sources/explorer/rows` | 5 |
| `state/system` | 8 |
| `state/system/machine/lsp` | 7 |
| `state/client` | 10 |
| `state/workbench` | 10 |
| `state/workbench/navigation` | 10 |
| `state/workbench/layout` | 10 |
| `state/sessions/terminal` | 10 |
| `shell/status` | 9 |
| `shell/keys` | 10 |
| `ui/controls` | 10 |
| `data/model` | 10 |
| `config/text/views` | 10 |
| `config/text/views/sources` | 10 (full) |
| `config/text/views/system` | 8 |

A new `views/sources/problems/` folder or a new `config/text/views/sources/problems.yml` would make the parent folder 11. `views/sources/search` and `views/system` have room.

**File sizes** (`wc -l`, limits 880 for `.ts` and 520 for `.svelte`):

| File | Lines |
|---|---|
| `documents.svelte.ts` | 101 |
| `commands.svelte.ts` | 727 |
| `latex.svelte.ts` | 813 |
| `navigation/status.ts` | 406 |
| `status-items.ts` | 119 |
| `StatusBar.svelte` | 233 |
| `decorations.ts` | 143 |
| `rooted-tree.svelte.ts` | 235 |
| `Tree.svelte` | 384 |
| `FileRow.svelte` | 162 |
| `TreeItem.svelte` | 494 |
| `Audit.svelte` | 300 |
| `state/system/audit.ts` | 42 |
| `LaneCard.svelte` | 231 |
| `tool-button.ts` | 124 |
| `workbench-keys.svelte.ts` | 488 |
| `keys.ts` | 293 |
| `key-dom.ts` | 91 |
| `repositories.svelte.ts` | 528 |
| `client/context.ts` | 565 |
| `rail-badges.svelte.ts` | 294 |
| `registry.ts` | 223 |
| `Workbench.svelte` | 475 |
| `routes/+page.svelte` | 257 |
| `data/model/index.ts` | 609 |
| `audit/projects.ts` | 511 |
| `audit/publications.ts` | 269 |
| `audit/rules.ts` | 208 |
| `References.svelte` | 364 |
| `Outline.svelte` | 242 |
| `statusbar.yml` | 170 |

**Guarded entries**, from `grep` over `agents/guarded.md`:
- G8 covers the audit mute write (`tests/routes/edit/audit-mute.test.ts`), relevant if `AuditFinding` gains `file`.
- G28 covers `state/sessions/source.svelte.ts`.
- G29 and G31 cover `state/workbench/layout/saved/`, relevant if the reload fix touches the saved layout.
- G37 covers `views/shared/explorer/opening.ts`.
- G13 applies if a setting is added.
- The tree checks apply: G16, G20, G21, G24.
- **No entry covers the diagnostics stores, the error parser, the status bar, the Files decorations or the shell's card cursor.** `grep -rln "errorMatch|decorationOf|statusFold|createDocuments|reconcileCardCursor|withCardCursor|findingsCount|latexDiagnostics" tests` prints nothing. Any test D33 wants needs Axel's yes for a new entry first (spec.md:57).

## 7. User-visible choices no ruling settles

The standard is VS Code 1.137.0 as read above.

1. **Where the Problems view sits.**
   - (a) Explorer group, order 4 (chord `s5`), added to the Explorer page's left pane after Search. A press lands the file in the page's right pane.
     - Pros: it sits beside the files and the editor its rows open; it has a key; it matches how oculus places Search and References.
     - Cons: VS Code puts it in the Panel, which oculus does not have (`DESIGN.md:471`). A changed arrangement reaches only new or Reset pages.
   - (b) System group beside Findings and Audit.
     - Pros: it sits with the other finding lists.
     - Cons: it would be the eleventh view and get no key; it is away from the editor.
   - (c) A bottom-docked default float, like VS Code's Panel.
     - Pros: closest to VS Code's place.
     - Cons: `floats:` applies only to a browser with no saved layout; it covers the editor; it reads against DESIGN.md:471.
   - Recommendation: (a), with Cmd+Shift+M as in item 2. Lazy option: registering the view with no arrangement place and no key, so it is reached only from the catalogue.
2. **Its key.**
   - (a) Cmd+Shift+M (Ctrl+Shift+M off macOS) toggles the Problems view, as VS Code's `toggleProblems`, plus `s5`.
   - (b) `s5` only.
   - Pros of (a): VS Code's key, and it is free in oculus. Cons of (a): whether Chrome on macOS takes Cmd+Shift+M before the page was not verified.
   - Recommendation: (a), with the browser case checked at the look. Lazy option: (b).
3. **Sort, grouping and filter.**
   - (a) As VS Code's defaults, fixed and stated in HELP.md (the Settings ruling's form): a tree grouped by file, files ordered by worst severity then path then name (`KFr`), rows in a file by severity then position (`problems.sortOrder` default `severity`), a filter box (text, `!exclude`, glob), Show Errors / Warnings / Infos toggles, Show Active File Only, Collapse All, View as Table, Copy and Copy Message in a row menu, and a count badge on the tab.
   - (b) Tree and text filter only.
   - (c) No filter.
   - Recommendation: (a). It is what "as VS Code's" and spec.md:85 ask for. Lazy options: (c), then (b).
4. **The status bar item.**
   - (a) A new `problems` item placed in VS Code's slot after `sync` and before `findings`, drawn as VS Code's: `cross` N, `warn` N, `info` N only when there are infos; VS Code's tooltip words; a press toggles the view. The `findings` item stays.
   - (b) The `findings` item becomes the Problems item, and the hub's findings become one more source of the Problems view: one count, one list, as VS Code's single Problems count. Cons: a widening no ruling names (Z86 names D23 and D17); it changes the Findings view's role.
   - (c) The diagnostics count folded into the `findings` item's number. Cons: two different things under one count and one view.
   - Recommendation: (a), with (b) put to Axel as the alternative, since `status.ts:214-216` already calls the findings item VS Code's Problems count. Lazy option: (c).
5. **The range a press selects.**
   - (a) The source tab state takes an end line and end column beside D23c's column, and a Problems press selects the diagnostic's range, as VS Code's `openFileAtElement` does.
   - (b) D23c's column plus word selection.
   - Pros of (a): exact to VS Code for multi-word ranges. Cons of (a): a second shape change to `SourceTabState` right after D23c.
   - Recommendation: (a). Lazy option: (b), which loses the range of a multi-word or empty-word diagnostic.
6. **Command and LaTeX errors as editor marks.**
   - VS Code's problem matchers put task errors into the editor's markers too. Today command errors have no markers; LaTeX's do.
   - (a) Command errors become Monaco markers in the open file, so F8 reaches them.
   - (b) Problems view only.
   - Recommendation: (a), as VS Code. Lazy option: (b).
7. **Files decorations.**
   - Follow VS Code: count badge or `9+`, error or warning colour, a dot on folders, errors and warnings only, problem colour over git's when both apply, letters joined `", "` (for example `2, M`).
   - The open question is only whether infos are left out as VS Code does. Recommendation: left out, as VS Code. Lazy option: colour only, with no badge or dot.
8. **Rows for a file outside every served root** (a command error with an absolute path elsewhere, or D23c's library files).
   - (a) Listed under the path as written, not openable, or opening D23c's read-only tab when a token exists.
   - (b) Dropped.
   - Recommendation: (a). Lazy option: (b).

## 8. Shared paths with PR3 and D23c

The dispatch block (`orchestrator-state.md:27-40`) lists only PR3 in flight: builder `a348cc74b67ed634e`, base 272f60b4. D23c has a locked worktree, `git worktree list` showing `.agents/worktrees/D23c 951b61e3 [D23c] locked`, but no dispatch entry. Its brief is untracked.

**With D23c** (`agents/briefs/D23c.md:109-129`)
- Same files:
  - `views/shared/links/source-file.ts`, the column.
  - `state/sessions/source.svelte.ts`, the column and any end range from choice 5.
  - `state/workbench/navigation/editor-status.svelte.ts` and `ui/controls/editor/commands.ts` / `types.ts`, the `goto` select.
  - `ui/controls/editor/kit/lsp/`, if D33 changes `client.ts`'s `#forget` or markers.
  - `state/system/machine/lsp/lsp.svelte.ts` is D23c's; `documents.svelte.ts` in the same folder is not.
  - `config/text/views/sources/source.yml`.
  - `DESIGN.md` lines 123, 510 and 571-572, against D33's `:500` and any status bar or decorations lines.
  - `docs/files-and-search.md:69-72`.
  - `agents/guarded.md:10-12`.
- Same folder: `views/sources/search/` if Problems is placed there; D23c writes `References.svelte` in it.
- Order: D33 builds on D23c's column. D33 waits on D23 (`plan.md:1433`), so preparing it after D23c lands avoids a merge on `source-file.ts` and `source.svelte.ts`.

**With PR3** (`agents/briefs/PR3.md:207-232`)
- PR3 writes `HELP.md`, `DESIGN.md`, `docs/views.md` and `docs/files-and-search.md` as whole files. D33 writes the Enter row (`HELP.md:56`), the Audit passage (`DESIGN.md:500`, `docs/views.md:179-181`) and new Problems and status bar passages.
- PR3 writes `state/workbench/palette.ts`, `palette-source.svelte.ts` and `shell/keys/Palette.svelte` (a view adds its own palette commands). D33 is shared there if it adds Focus Problems or Next Problem to the palette.
- PR3 writes `views/shared/explorer/tree/menu/row-menu.ts`, `tree/row-ops.ts` and `tree/control/picks.svelte.ts`. D33 writes `tree/Tree.svelte` and `FileRow.svelte`: the same folder, different files.
- PR3 writes `state/shared/stores/shapes.ts`.
- PR3 edits G8's Code and Test lines in `agents/guarded.md`. D33's `AuditFinding.file` touches G8's mute write.
- Both rewrite `docs/diagrams/`.
- No shared file in `shell/status/`, `state/system/audit.ts`, `views/system/audit/`, `server/content/audit/`, `LaneCard.svelte`, `tool-button.ts`, `workbench-keys.svelte.ts` or `state/sources/explorer/rows/`.

## Open points for the orchestrator

- **The D33 step line and its sub-bullets cite stale line numbers and omit Z458, Z459 and Z460.** The brief must name those three rulings and the current lines listed in section 4.
- Q118's Decision 3 (one card id per row, `<signature>:<n>`) and its case 11 (reload) came from Q118's brief, not from a ruling. Under Z468 the reload case is now D33's own work, not "outside this step".
- D45 (LaTeX Workshop) may replace `latexDiagnostics()` before D33 is built. The brief's read of the LaTeX source has to be checked again at /spec.

Agent usage: aaafc47b28e659580, claude-opus-5-5, 301,794 tokens, 102 tool uses, 9.9 min.
