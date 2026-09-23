One check is not green: `npx vitest run --reporter=dot` has 1 failing case, `tests/views/system/help.test.ts > the manual itself > names every view the rail lists, by its id` (`expected [ 'catalogue', 'pages', 'settings' ] to deeply equal []`). It fails because HELP.md has no rows for the three new views, and the brief forbids me editing HELP.md. It turns green once the HELP.md rows in "Doc text" below are applied. Everything else in the brief is done.

Open items for Axel (not decided by the brief):
1. **The tracked layout.yml still has `bookmarks:`.** It stays so the one-time server read has entries to move. The first server start on a machine moves them into `~/.oculus/bookmarks.yml` and removes the key from the tracked `config/layout.yml`. After that start, two cases in `tests/checks/config/config-folder.test.ts` fail until that file change is committed and `EXPECTED` loses `bookmarks`:
   - "holds exactly the expected top-level keys"
   - "reads each file on its own and finds its own keys there"

   The other way is to delete the key in this commit, but then the move never sees the two manuals.
2. **The status bar words** avoid "unsaved", "socket" and "sessions", so they do not clash with other controls' accessible names:
   - "server: up / down / waiting"
   - "usage: ..."
   - "HPC: ..."
   - "live agents: N"
   - "unwritten tabs: N"
3. **"New page" in the Pages view switches to the new page**, as the removed strip's control did.
4. **A rail label does not rename a page already made.** An existing page with no rail key whose name equals the label is adopted by that button.
5. **View badges now show in the catalogue only.** The rail draws no badges.
6. **Drag.** The pointer way to show a page inside another is now a drag from a Pages row's name. Reordering pages by drag or by keys is gone, with the move keys.

## Verification

| # | Command | Result (verbatim) | State |
|---|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files  2 failed \| 288 passed (290)` / `Tests  2 failed \| 4586 passed (4588)`. Failures: `tests/checks/tree/scratch.test.ts > ... is swept by every file under tests that takes one` (`Test timed out in 5000ms.`) and help.test (above). Scratch.test rerun alone: `Test Files  1 passed (1)` / `Tests  9 passed (9)`. help.test rerun alone: `Tests  1 failed \| 15 passed (16)` | NOT DONE (help.test, waits on the Doc text) |
| 2 | `npm run check` | `COMPLETED 1326 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | DONE |
| 3 | `npm run build` | `exit 0` | DONE |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` | DONE |
| 5 | `npm run lint` | `lint exit 0` | DONE |
| 6 | the perl ASCII gate | no output, `perl exit 0` | DONE |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | `size exit 0`, `folder exit 0` | DONE |
| 8 | listed browser cases, each red under its revert (from the revert-check logs) | see the list below the table | DONE |
| 9 | `npm run build` then `npx playwright test` | `321 passed (8.6m)`, `exit 0` | DONE |
| 10 | `node bin/revert-check.mjs <files>` | three node files: `18 reverts, 0 unproven, 88 unchecked`. All changed browser specs: `100 reverts, 4 unproven, 128 unchecked`. The three specs holding those 4, rerun after the fixes: `20 reverts, 0 unproven, 34 unchecked`. Earlier node runs over the other added or changed node files: 0 unproven. | DONE (see note) |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before the final runs, 7015 after | DONE |

Browser cases for row 8, each red under its revert:
- pages.spec:
  - "a rail button shows its page, and a second press shows it as it was left"
  - "a rail page the reader rearranged is the same page after a reload"
  - "no strip of pages is drawn over the panes"
  - "the Pages view makes a page, renames it, shows another and closes one"
  - "closing a page of several tabs asks first"
- keyboard.spec: "a bare digit shows the rail page of its place"
- views.spec: "the catalogue opens a view into the page on screen, and a chord and a digit still open one"
- settings.spec:
  - "the Settings view changes the theme"
  - "the Settings view edits the rail list, its typing is unsaved, and the rail follows"
  - "each status bar item opens its view"
  - "the unsaved count opens the first unsaved tab on its own page"
- rail.spec: "the BOOKMARKS group lists the two manuals moved out of layout.yml and a bookmark of Files"

Note on row 10:
- revert-check exits 1 on unchecked cases. The unchecked ones are cases that existed before and that this step does not change.
- I mapped every changed line of workbench.test, registry.test and config-folder.test to its case. Each changed case is red under its revert or named "audits ...". The rest of the changed lines are comments, or cases this step deleted.
- The 4 unproven cases in the full browser run, and what now makes each red:
  - focus-buttons.spec ×2: the run reported "the case did not run" for both. Both are red on the rerun.
  - shell-defects accent case: it was templated over `${name}`, so no case carried that name. It is now one literal-named case over light and mocha.
  - rail.spec paint case: it was GREEN under `ActivityRail.svelte:343 => z-index: 0`. That rule did nothing, because the tooltip bubble is drawn on the body. The rule is removed from ActivityRail's wallpaper block, and the case now reverts `src/lib/ui/menu/Tooltip.svelte:185 => void node;`, which is red.

## Judgment calls
- **Where a rail page lives.** It is a `Page` with an optional `rail` key, saved in `oculus.layout.v1`.
  - `openRailPage(key, label, node)` switches to the page with that key.
  - If there is none, it adopts a page with no key whose name is the label.
  - If there is none of those either, it creates the page from the arrangement.
  - When the saved layout holds two pages with one key, the first page keeps it and `checkPages` reports the duplicate.
- **Saving the rail list.** It is edited from Settings and saved through a new `rail` write:
  - `server/edit/writes/rail.ts`, a list edit of the bytes with a read-back guard
  - undo support in `undo.ts`
  - a History kind `kind_rail`

  The shared reparse guard is now `readBack` / `othersThan` in `list-edit.ts`, used by deck-edit and audit-mute. `railFindings` reports a hand-edited bad entry in Findings.
- **The one-time bookmark move** is `moveLayoutBookmarks` in `server/files/fs/bookmarks.ts`, called from `server/core/context.ts:263-274`. The rail shows only the bookmarks file.
- **New glyphs:**
  - catalogue: "▣", ASCII "[V]", icon layout-grid
  - sliders: "⛭", ASCII "[S]", icon sliders-horizontal
  - pages: "❐", ASCII "[G]", icon layers
- **Views and Settings** is the `views` arrangement, holding the catalogue, Settings and Pages views.
- **A fresh browser** still opens on Page 1 with the Status view, which no rail button owns.

## Reader-visible before and after
- **Page strip.** Before: a strip of page tabs across the top, with new, rename and close. After: no strip. The Pages view on the Views and Settings page has one row per page with show, rename and close, the close asking first for a page of several tabs, an unsaved mark, and New page.
- **Rail.** Before: a button per view under group headings, with flyouts, bookmarks from layout.yml and the file, and a foot of Search, Update, Theme, Text, CRT, Wallpaper and Glyphs. After:
  - 13 page buttons: Focus, Projects, Academic Life, Pillars, Feeds, References, Present, Explorer, Sessions, Info/more, Calendar, Inbox, Views and Settings
  - a BOOKMARKS group from the bookmarks file only
  - a foot of Search and Update

  The appearance controls are in the Settings view. Every view is listed in the catalogue, docs included.
- **Keys.** Before: 1-9 switched pages and Ctrl+Shift+Left/Right moved a page. After: 1-9 shows the rail page of that place. The move keys are gone. The chords (`v`, `c`, `m`, `s`, `y` plus a digit) are unchanged and count the catalogue's order.
- **Status bar** (new, under the window): server, usage, HPC, live agents and unwritten tabs. Each opens its view (status, usage, hpc, session-list). The unwritten count activates the first unsaved tab on its own page and is disabled at 0.
- **Bookmarks.** Before: two in layout.yml plus the reader's file. After: one list, the file. The layout.yml pair is moved into it at the first server start.

## Folder splits
- `src/lib/views/system/workbench/`: Catalogue, Settings, Appearance, RailEditor, Pages, StatusBar
- `src/lib/state/workbench/navigation/`: arrangement.ts, moved from state/workbench, plus catalogue.ts, rail.ts and pages.ts
- `tests/views/system/workbench/`
- `tests/state/workbench/navigation/`

## Files (worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/L3/tools/oculus`; lines main -> worktree)

Measured with `cmp` against the main checkout. O32's files are excluded; I did not touch them.

Added:
- src/lib/data/sources/config/rail.ts 124
- src/lib/state/workbench/navigation/: arrangement.ts 64, catalogue.ts 220, pages.ts 69, rail.ts 115
- src/lib/views/system/workbench/: Appearance 144, Catalogue 216, Pages 300, RailEditor 237, Settings 45, StatusBar 129
- src/lib/server/edit/writes/rail.ts 116
- config/text/views/system/workbench.yml 60
- tests: routes/edit/rail 154, server/files/bookmarks-move 168, state/workbench/navigation/{arrangement 299, catalogue 388, pages 93, rail 222}, views/system/workbench/{catalogue 105, pages 99, settings 120, status-bar 101, workbench-fixture 40}, browser/shell/settings.spec 116

Removed:
- src/lib/shell/closing.ts
- shell/panes/page-strip.ts
- shell/panes/PageStrip.svelte
- shell/rail/RailAppearance.svelte
- state/workbench/arrangement.ts
- tests/shell/panes/pagestrip.test.ts
- tests/state/workbench/arrangement.test.ts

Changed, source:
- ActivityRail.svelte 535->344
- rail.ts 224->61
- Workbench.svelte 317->319
- +page.svelte 222->139
- layout.svelte.ts 473->470
- model.ts 160->157
- saved.ts 403->425
- layout/index.ts 100->99
- keys.ts 179->178
- workbench-keys.svelte.ts 422->427
- context.ts (client) 233->243
- writes.svelte.ts 496->508
- list-edit.ts 144->195
- deck-edit.ts 87->73
- audit-mute.ts 102->89
- writes.ts 495->538
- bodies.ts 320->342
- undo.ts 291->313
- bookmarks.ts 110->234
- server/core/context.ts 355->384
- portfolio.ts 388->393
- Tabs.svelte 385->360
- tokens.css 143->141
- no line-count change: FoldedPane, PageLeaf, pane-view.ts, PaneView, drag.svelte.ts

Changed, config:
- layout.yml 119->165
- glyphs.yml 285->293
- icons.yml 146->150
- app.yml 66->66
- findings.yml 89->98
- ui.yml 63->57
- history.yml 48->49

Changed, other:
- docs/diagrams: channels, layers and writes, .dot and .svg, regenerated with `node bin/diagrams.mjs`
- node tests and allow lists, plus 26 browser specs; per-file counts are in the `cmp` listing

## Doc text (HELP.md and DESIGN.md, from `grep -n` / `sed -n` on the worktree)

HELP.md:
- **7**, "Across the top of the work area is the page strip." Replace with: "Along the bottom is the status bar."
- **13**, the whole paragraph. Replace with: "The rail draws one button per entry of the `rail:` list of `config/layout.yml`, each `{label, glyph, page}`, where `page` names an arrangement under `arrangements:`. A button shows its page: made from its arrangement the first time and shown as it was left after that. Every view, and every hub document of the `docs` key, is listed in the catalogue on the Views and Settings page, under its `nav_groups` group."
- **15**, the whole paragraph. Replace with: "In the catalogue a click opens the view where views land, which is the pane whose tab was activated last. A view already open is activated where it is rather than opened twice. A shift-click opens it in a new pane to the right."
- **17**, the whole paragraph. Replace with: "Under the page buttons sit the bookmarks, the reader's own from the Files view, each opened as a tab of its own. At the foot of the rail are Search, which opens the palette, and Update, which opens the update tray. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls are in the Settings view."
- **23**, "The strip across the top switches between pages, makes one, renames one and closes one. The digits 1 to 9 switch pages directly." Replace with: "The rail's buttons switch to their pages. The Pages view on the Views and Settings page lists every page and makes, renames, shows and closes one, asking first when the page holds more than one tab. The digits 1 to 9 show the rail page of that place."
- **32**, "and to another page by way of the strip." Replace with: "and a page's name dragged from the Pages view onto a pane's edge shows that page there."
- **35**, delete "The page strip scrolls the same way."
- **36**, delete these three sentences:
  - "the page strip's shown tab keeps its own accent because it says which page is shown."
  - "a page holding such a tab shows the dot and says the same in the page strip."
  - "The page strip is drawn the same way, lower and on the card surface."

  Then add: "the Pages view marks a page holding such a tab as unsaved."
- **44**, `| 1-9 | switch page |` becomes `| 1-9 | show the rail's page of that place |`.
- **50**, `| v1-v9 | open a view of the rail by its place |` becomes `| v1-v9 | open a view of the small groups of the Views catalogue by its place |`.
- **65**, `| Ctrl+Shift+Left / Right | move the page |`: delete the row.
- **71**, "A group's documents follow its views in its chord" becomes "A group's documents follow its views in its chord, in the catalogue's order".
- **After line 119**, add three rows:
  - `| \`catalogue\` | Views | Every view and hub document by group, each opened into the page on screen; a shift-click opens it beside. |`
  - `| \`settings\` | Settings | The theme, text size, CRT, wallpaper and glyphs, and the rail list, edited and saved to \`config/layout.yml\`. |`
  - `| \`pages\` | Pages | Every page, with show, rename and close, and New page. |`
- **After line 71**, add a paragraph: "The status bar along the bottom reads the server connection, the usage refresher, the Live HPC poll, the live agents and the count of tabs holding unwritten text. Each item opens its view, and the count shows the first such tab on its own page."
- **161**, "the rail groups, the hub documents" becomes "the rail's pages, the view groups, the hub documents".
- **169**, "a view's file in the folder of its rail group" becomes "a view's file in the folder of its view group".

DESIGN.md:
- **46**, "a view's strings, in the folder of its rail group" becomes "... of its view group".
- **60**, "one folder per rail group" becomes "one folder per view group".
- **75**, "(the rail's groups, the board chrome" becomes "(the rail's pages, the view groups, the board chrome".
- **149**, "An activity rail on the left selecting what the rail lists" becomes "An activity rail on the left whose buttons switch pages, and a status bar along the foot".
- **158**, add `state/workbench/navigation` to the shell row's allowed list.
- **160**, add `data/sources/config/rail` to the state row's allowed list.
- **191**, "which a pressed toggle in the rail fills with" becomes "which the rail button of the page on screen fills with".
- **193**, two changes:
  - "The toggle in the rail starts on whatever the theme answers" becomes "The wallpaper toggle in the Settings view starts on whatever the theme answers".
  - "the page strip carries depth 2 over every pane strip, the rail carries depth 5 over the panes beside it, and all stay under" becomes "and it stays under".
- **237**, "bookmarks in `layout.yml`" becomes "bookmarks in `~/.oculus/bookmarks.yml`, the two `layout.yml` once held moved there at the server's first start". Also, "the rail draws a large `nav_groups` group as one button with a flyout, so it does not grow one icon per view" becomes "the rail draws one button per page of `rail:`, and every view is listed in the catalogue".
- **244**, three changes:
  - "switching the strip to it" becomes "switching to it".
  - "closed from the strip" becomes "closed from the Pages view".
  - "a bare digit is still the strip's page" becomes "a bare digit is the rail page of its place".

  Also, "a page tab dragged out of the strip onto a pane's edge" becomes "a page's name dragged from the Pages view onto a pane's edge".
- **245**, four changes:
  - "A strip of page names runs across the top of the work area; the rail stays what it is. A page is made by a control at the end of the strip and named from its menu; the saved arrangements of `layout.yml` open as pages." becomes "The rail's buttons are the pages of `rail:`, each tied to its arrangement by key; the Pages view makes, renames and closes pages."
  - "The digits 1 to 9 switch pages" becomes "The digits 1 to 9 show the rail page of their place".
  - "`v`, `c` or `m` before a digit opens a view" is unchanged.
  - "Ctrl+Shift with an arrow" is no longer in the text.
- **251**, "drawn in that rail group after the group's views" becomes "listed in the catalogue under that group after its views".
- **256**, "with the open count as its rail badge" becomes "with the open count as its catalogue badge".
- **278**, three changes:
  - "The foot's controls are stacked with a visible name, the three text steps one row under one name answering the left and right arrows inside the row and the up and down arrows to leave it (`railStop` in `shell/rail/rail.ts`), and text reset draws `note_back`. A rail toggle that is on fills with `--accent-bg` and draws its border in the accent and its glyph and name in `--accent-bg-txt`, under every theme." becomes "The foot's controls, Search and Update, are stacked with a visible name, and the up and down arrows move along the whole rail (`railStop` in `shell/rail/rail.ts`). The button of the page on screen fills with `--accent-bg` and draws its border in the accent and its glyph and name in `--accent-bg-txt`, under every theme."
  - "for the pane strips and the page strip alike" becomes "for the pane strips".
  - "this is how the pane menu offers its per-page moves" is unchanged.
- **286**, delete these, and remove "the page strip at 30 px on `--card`" and "the page strip as a second strip" from the "Kept against VS Code" list:
  - "The page strip's current tab keeps its own accent because it says which page is shown."
  - "and from any of its instances for a page tab"
  - "`shell/panes/PageStrip.svelte` gives Tabs `low` (`--tab-height-low`, 30 px) and `surface=\"card\"`, which keeps its own tint over a wallpaper."

## Next
- Apply the Doc text. help.test then passes; rerun `npx vitest run --reporter=dot tests/views/system/help.test.ts`.
- Rule on open item 1, the `bookmarks:` key and the config-folder `EXPECTED` update after the first start.
- If main has moved at landing, regenerate `docs/diagrams` with `node bin/diagrams.mjs`.

# Repair round 1

Every numbered item of the round, 1 to 13, is built. Four things are still not green or need a ruling:
- **HELP.md not yet edited.** `npx vitest run --reporter=dot` has 2 failing cases, both in `tests/views/system/help.test.ts`: "names every view the catalogue lists, by its id" and "describes every configuration file in the words the Config view shows". Both pass once the HELP.md Doc text below is applied; the brief forbids me editing HELP.md.
- **Premise found wrong in item 12, for Axel.** The ruling says the rail badges include "the sessions waiting count" that `badgeOf` served the old rail. No registration carries that count.
  - `grep -rln "badge:" src/lib/views` lists Calendar, Inbox, Leads, Hpc, Audit, Collection, Projects, LaneCard and Repositories.
  - `grep -rn "waitingCount" src/lib` finds only `selectors.svelte.ts`, whose count feeds the window title, not a badge.
  - So no rail button shows a waiting count. I did not add a session-list badge: that is a new user-visible choice.
- **Reading taken in item 12.** A rail page not made yet draws the badges of the views its arrangement will hold, so a button shows badges before its first press. The alternative reading is that such a button draws none.
- **Test harness choice.** `boot()` in `tests/browser/helpers/rail.ts` now seeds a saved layout of one Status page before the first load. That keeps every spec not about the first load on the neutral page it was written for. A new `bootFresh()` loads with no saved layout; the fresh-start case uses it. The other way was to rewrite some 60 cases around the Focus board.

## What each item came to

1. **Bookmarks move removed.**
   - `moveLayoutBookmarks`, its call in `core/context.ts` and `bookmarks-move.test.ts` are gone; `bookmarks.ts` and `context.ts` are back to their base text.
   - The `bookmarks:` key and its comment are out of `config/layout.yml`, and `bookmarks` is out of config-folder `EXPECTED`. The bookmark-roots case of config-folder is removed with the key it read.
   - `tests/browser/helpers/serve.ts` writes the served HOME's `~/.oculus/bookmarks.yml` with the two manuals. The rail.spec BOOKMARKS case checks the two manuals and a bookmark added from Files, red under `ActivityRail.svelte:273 => {#if false}`.
   - `config/sources.yml` and `Document.svelte` no longer name the layout.yml key.
   - Two context.test directives aimed at the wrong lines are now correct (217, 237).
2. **Fresh start on the first rail page.**
   - `layout.svelte.ts` gains `startOnRailPage` and a `fresh` flag. The flag is set by `loadLayout` when nothing was saved and cleared by any save. `Workbench.svelte:148` calls it once the rail list arrives.
   - Browser case "a browser with no saved layout opens on the first rail page, and digit 1 shows it again" is red under `Workbench.svelte:148 => delete`. A node case is in `tests/state/workbench/layout/pages.test.ts`.
3. **Status words.**
   - Server item: "server: up / down / waiting". Live item: "live sessions: N". Unsaved item: "unsaved tabs: N".
   - 31 Save-button lookups and 3 saved-message lookups in 9 specs now use `exact: true`. The status bar tests read the words through `t()` and also as literals.
4. **One parser for the rail list.**
   - `railRows` and `glyphNames` in `src/lib/data/sources/config/rail.ts` are used by `railDraft`, `configRail`, `railLists`, undo, the write target and the RailEditor.
   - `railPages` passes the glyph list, so an unknown glyph draws no button.
   - Node case red under `navigation/rail.ts:36 => ... without glyphs`. Browser case "a rail entry hand-edited to a glyph the vocabulary does not hold draws no button" is red under the same revert.
5. **Shared close question.**
   - `src/lib/ui/controls/CloseQuestion.svelte` holds the block; PaneView and Pages both draw it.
   - The allow-duplication entry `3ed93ba68ad5` is gone.
6. **Toggle cases.** Browser cases for CRT (red under `Appearance.svelte:94`) and for keeping the real glyphs on mocha (red under `Appearance.svelte:112`).
7. **Status bar in the shell.**
   - The bar is `src/lib/shell/status/StatusBar.svelte`, drawn by `Workbench.svelte`.
   - The page hands in `status` words from `src/lib/state/workbench/navigation/status.ts` and imports no status bar. The shell counts the unsaved tabs itself from the layout and ui stores.
   - The boundary rows and SHELL_STORES are unchanged.
   - Tests: `tests/state/workbench/navigation/status.test.ts` and `tests/shell/status/status-bar.test.ts`.
8. **False comments and strings.** Every file the review lists is reworded, `list-edit.ts` is reflowed, and the workbench.test case name is fixed.
   - `isFlyout` is renamed to `isChorded`.
   - The Menu's rail, stacked and beside looks, `menuPlacement` and their primitives cases are removed: no caller used them after the flyouts went.
   - Case names reworded in keys, help, memories, calendar, audit and rail-badges tests, with allow-audits updated. Browser wording is fixed in icons, nested, tabs and files specs.
   - The re-grep for rail wording leaves these lines on purpose:
     - Sessions list, which calls itself the rail: `selection.svelte.ts:3,8`, `writes.svelte.ts:37`, `bodies.ts:18`, `Terminal.svelte:21,110,210`, `terminal.yml no_terminal`, `session-list.yml detail_empty/restore_tip`.
     - Wording still true of the activity rail: bookmarks, width, list, pages and the Present page.
     - The module names `rail-badges.ts` and `rail-badges.svelte.ts`. The badges are drawn on rail buttons again under item 12, so the name holds.
9. **Shortcut words.** `ui.page_shortcut` and `workbench.catalogue_key` now read "{0}, key {1}". Literal checks "Page i, key 9" and "Focus, key v1" are added.
10. **Doc text.** In full below.
11. **Behaviour.** Before and after below.
12. **Rail badges.**
    - `railPageViews` in `navigation/pages.ts` gives the page's views in tab order, each once. The views come from the made page or, before that, from its arrangement.
    - `ActivityRail.svelte` draws them in `[data-rail-badges]`.
    - Node cases are in the navigation pages test and `tests/shell/rail/rail.test.ts`. Browser case "a rail page button draws the badges of the views its page holds" is red under `ActivityRail.svelte:253 => {#if false}`.
13. **Catalogue target.**
    - The layout store tracks `previousPage()`, which is not saved.
    - `Catalogue.svelte` `showTarget()` shows the previous page, or the first rail page when there is none, then opens the view there; shift opens beside there.
    - views.spec cases are red under `Catalogue.svelte:95 => delete` and `Catalogue.svelte:87 => delete`. layout.spec shift-click is rewritten.
    - Chords and digits still open on the page on screen.
    - The hint text now reads "A click opens the view on the page you came from and shows that page; a shift-click opens it in a pane beside, on that page."

## Verification

| # | Command | Output | State |
|---|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 1 failed \| 289 passed (290)`, `Tests 2 failed \| 4585 passed (4587)`; both failures are the help.test cases above | NOT DONE (waits on HELP.md) |
| 2 | `npm run check` | `COMPLETED 1328 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | DONE |
| 3 | `npm run build` | `exit 0` | DONE |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` | DONE |
| 5 | `npm run lint` | `exit 0` | DONE |
| 6 | perl ASCII gate | no output, `perl exit 0` | DONE |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | `size exit 0`, `folder exit 0` | DONE |
| 8 | listed browser cases red under revert | see items 1, 2, 4, 6, 12 and 13 above | DONE |
| 9 | `npx playwright test` | `327 passed (6.8m)`, `exit 0` | DONE |
| 10 | `node bin/revert-check.mjs` over changed browser specs | full run `84 reverts, 2 unproven`; the two re-aimed and rerun: settings plus shell-defects `10 reverts, 0 unproven` | DONE |
| 10 | `node bin/revert-check.mjs` over the 24 node test files aimed at files changed this round | `176 reverts, 4 unproven`; the 4 were settings.test directives shifted one line, re-aimed and rerun: `8 reverts, 0 unproven, 0 unchecked` | DONE |
| 10 | `node bin/revert-check.mjs` over the new and rewritten node files (27 files) | `151 reverts, 3 unproven`; after re-aiming: catalogue plus rail route `31 reverts, 0 unproven`, rail.test `43 reverts` in the combined run, 0 unproven | DONE |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before, 7015 after | DONE |

## Before and after for item 11
- **Rail landmark name.** Before: "Views". After: "Pages" (`ui.rail`).
- **Shift-click.** Before, on a rail button it opened a view beside. After, the rail opens pages only, and shift-click opens beside from the catalogue, on the page the reader came from.
- **Rail hover words.** Before: the view's name. After: "Focus, key 1" for the first nine buttons and the label alone after them.
- **First load of Axel's saved pages.**
  - A browser with a saved layout keeps every page as it is. `startOnRailPage` acts only when nothing was saved.
  - On the first press of a rail button, a saved page with no rail key whose name equals that button's label becomes the button's page.
  - With the 13 labels, that takes his page named "Sessions" (`ui.page_sessions`, the page the older layout migration made) for the Sessions button. It also takes any page he named Focus, Projects, Academic Life, Pillars, Feeds, References, Present, Explorer, Info/more, Calendar, Inbox or Views and Settings. Other pages stay unowned and are reached from the Pages view.
- **Catalogue press.** Before: opened on the Views and Settings page itself. After: shows the page the reader was on before and opens the view there. After a load straight onto Views and Settings, it uses the first rail page.
- **Fresh browser.** Before: "Page 1" with the Status view, no button active. After: the Focus page, button active.
- **Rail badges.** Before this round: none. After: each page button draws the badges of its page's views.

## Files changed this round
From `find src tests config docs -newer L3-refuter.md`, lines in parentheses.

**Added:**
- src/lib/shell/status/StatusBar.svelte (94)
- src/lib/state/workbench/navigation/status.ts (62)
- src/lib/ui/controls/CloseQuestion.svelte (28)
- tests/shell/status/status-bar.test.ts (57)
- tests/state/workbench/navigation/status.test.ts (95)

**Removed:**
- src/lib/views/system/workbench/StatusBar.svelte
- tests/views/system/workbench/status-bar.test.ts
- tests/server/files/bookmarks-move.test.ts

**Changed, config:**
- config/appearance.yml (61), config/layout.yml (159), config/sources.yml (100)
- config/text/ui.yml (57)
- config/text/views/sources/doc.yml (10), config/text/views/sources/document.yml (10)
- config/text/views/system/config.yml (24), config/text/views/system/workbench.yml (60)
- docs/diagrams: all six files regenerated with `node bin/diagrams.mjs`

**Changed, source:**
- data: accounts/leads.ts (49), sources/config/rail.ts (149)
- server: content/docs.ts (416), core/context.ts (355), edit/list-edit.ts (194), edit/writes.ts (531), edit/writes/rail.ts (115), edit/writes/undo.ts (301), files/fs/bookmarks.ts (110)
- shell: panes/PaneView.svelte (432), rail/ActivityRail.svelte (410), Workbench.svelte (332)
- state: feeds/inbox.ts (141), life/calendar.svelte.ts (90), life/calendar.ts (69), system/audit.svelte.ts (60), system/docs.svelte.ts (181)
- state/workbench: layout.svelte.ts (516), layout/open/opening.ts (170), navigation/catalogue.ts (220), navigation/pages.ts (83), navigation/rail.ts (109), rail-badges.svelte.ts (256), rail-badges.ts (111)
- themes/derive.ts (266)
- ui: controls/ToolButton.svelte (306), menu/menu-items.ts (42), menu/Menu.svelte (425), menu/MenuOpener.svelte (117), menu/Tooltip.svelte (267), tabs/Tabs.svelte (360)
- views registry.ts (160)
- views, registration heads: Slides, Deposit, Person, Project, Inbox, Calendar, Agents, SessionDetail, Terminal, Timeline, Transcript, Data, Doc, Document, Files, Repositories
- views/system/workbench: Catalogue.svelte (237), Pages.svelte (296), RailEditor.svelte (238)
- routes: +page.server.ts (40), +page.svelte (140)

**Changed, tests:**
- browser specs: board, collection, focus-buttons, boot, icons, keyboard, rail, settings, shell-defects, views, files-forms, files, history, layout, nested, pages, tabs, unsaved-forms
- browser helpers: rail.ts (196), serve.ts (292)
- node checks: config-folder, allow-audits, allow-duplication, boundaries, type-scale
- node tests: context, docs, rail route, keys, activity-rail, rail-config, rail.test, workbench.test, calendar-store, calendar, audit, layout pages, navigation arrangement/catalogue/pages/rail, rail-badges, primitives, project, calendar view, memories, help, catalogue, registry, settings

## Doc text (grep -n from the worktree; replacements in full)

HELP.md
- `HELP.md:7:Down the left is the rail. Across the top of the work area is the page strip. Everything else is the pane tree: one tree per page, made of splits and panes, each pane a stack of tabs, each tab one view.`
  - Replace with: "Down the left is the rail, and along the bottom is the status bar. Everything else is the pane tree: one tree per page, made of splits and panes, each pane a stack of tabs, each tab one view."
- `HELP.md:13:The rail draws one button per view, under the heading of the group the view belongs to. A group of more than four entries is drawn as one button with a list beside it instead, so the rail never grows an icon per view. The groups, their order, their letters and the hub documents they carry are the `nav_groups` and `docs` keys of `config/layout.yml`.`
  - Replace with: "The rail draws one button per entry of the `rail:` list of `config/layout.yml`, each `{label, glyph, page}`, where `page` names an arrangement under `arrangements:`. A button shows its page: made from its arrangement the first time and shown as it was left after that. A browser with no saved layout starts on the first of them. A button draws the badges of the views its page holds, in the order of the page's tabs, the arrangement's views before the page is first made. Every view, and every hub document of the `docs` key, is listed in the Views catalogue on the Views and Settings page, under its `nav_groups` group; the groups, their order and their letters are those two keys."
- `HELP.md:15:A click opens the view where views land, which is the pane whose tab was activated last; a view already open is activated where it is rather than opened twice. A shift-click opens it in a new pane to the right of that one, and the next shift-click joins that pane as a tab while it is still open.`
  - Replace with: "In the catalogue a click shows the page the reader was on before the Views and Settings page and opens the view there, where views land, which is the pane whose tab was activated last; after a load straight onto the Views and Settings page it opens on the first rail page. A view already open is activated where it is rather than opened twice. A shift-click opens it in a new pane to the right, on that same page, and the next shift-click joins that pane as a tab while it is still open."
- `HELP.md:17:` (the whole paragraph from "A group also carries the hub documents")
  - Replace with: "Under the page buttons sit the bookmarks, the reader's own from `~/.oculus/bookmarks.yml`, which the Files view adds and takes away, each opened as a tab of its own. At the foot of the rail are Search, which opens the palette, and Update, which opens the update tray, each drawn with its name under its glyph. The button of the page on screen is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Glyphs) are in the Settings view."
- `HELP.md:23:A page is a whole working surface with a name: its own tree, its own tabs, its own arrangement. The strip across the top switches between pages, makes one, renames one and closes one. The digits 1 to 9 switch pages directly.`
  - Replace with: "A page is a whole working surface with a name: its own tree, its own tabs, its own arrangement. The rail's buttons switch to their pages. The Pages view on the Views and Settings page lists every page and makes, renames, shows and closes one, asking first when the page holds more than one tab, and marks a page holding unsaved text. The digits 1 to 9 show the rail page of that place."
- `HELP.md:32:- **Drag.** A tab moves inside its pane, to another pane, and to another page by way of the strip.`
  - Replace with: "- **Drag.** A tab moves inside its pane and to another pane, and a page's name dragged from the Pages view onto a pane's edge shows that page there."
- `HELP.md:35:` delete the sentence "The page strip scrolls the same way."
- `HELP.md:36:` five changes:
  - "The shown tab of the one pane the rail opens a view into carries an accent line" becomes "The shown tab of the one pane a view opens into carries an accent line".
  - "the page strip's shown tab keeps its own accent because it says which page is shown." is deleted.
  - "a folded pane the rail opens into carries the accent" becomes "a folded pane a view opens into carries the accent".
  - "a page holding such a tab shows the dot and says the same in the page strip." becomes "the Pages view marks a page holding such a tab as unsaved."
  - "The page strip is drawn the same way, lower and on the card surface." is deleted.
- `HELP.md:44:| 1-9 | switch page |` becomes `| 1-9 | show the rail's page of that place |`.
- `HELP.md:50:| v1-v9 | open a view of the rail by its place |` becomes `| v1-v9 | open a view of the small groups of the Views catalogue by its place |`.
- `HELP.md:65:| Ctrl+Shift+Left / Right | move the page |`: delete the row.
- `HELP.md:71:` the sentence "A group's documents follow its views in its chord" becomes "A group's documents follow its views in its chord, in the catalogue's order". Then add a new paragraph after line 71: "The status bar along the bottom reads the server connection (`server: up`, `down` or `waiting`), the usage refresher, the Live HPC poll, the live sessions (`live sessions: N`) and the tabs holding text no save has taken (`unsaved tabs: N`). Each item opens its view; the last shows the first such tab on its own page and is not pressable at 0."
- After `HELP.md:119:| `history` | History | ...`, add three rows:
  - "| `catalogue` | Views | Every view and hub document by group, with its key and badge; a press opens it on the page the reader came from and a shift-press beside there. |"
  - "| `settings` | Settings | The theme, text size, CRT, wallpaper and glyphs, and the rail list, edited and saved to `config/layout.yml`. |"
  - "| `pages` | Pages | Every page, with show, rename and close, and New page. |"
- `HELP.md:123:` two changes:
  - "Five views are opened for something rather than listed in the rail:" becomes "Five views are opened for something rather than listed in the Views catalogue:".
  - "(one Markdown document of the hub, from a group of the rail)" becomes "(one Markdown document of the hub, from a group of the catalogue)".
- `HELP.md:161:| `layout.yml` | How things are arranged: the rail groups, the hub documents, the board chrome, the tab rollups, the live badges and the saved arrangements. |`
  - Replace with: "| `layout.yml` | How things are arranged: the rail's pages and the arrangements each starts as, the view catalogue's groups, the hub documents, the board chrome, the tab rollups and the live badges. |" (the Config view's `desc_layout` now reads this).
- `HELP.md:169:` the phrase "a view's file in the folder of its rail group" becomes "a view's file in the folder of its view group".

DESIGN.md
- `DESIGN.md:46:` "a view's strings, in the folder of its rail group" becomes "a view's strings, in the folder of its view group".
- `DESIGN.md:59:      shell/                        LAYER 3, the workbench: rail/, panes/, keys/, Workbench.svelte` becomes "LAYER 3, the workbench: rail/, panes/, keys/, status/, Workbench.svelte".
- `DESIGN.md:60:` "one folder per rail group" becomes "one folder per view group".
- `DESIGN.md:71:` "A view's rail group is its folder:" becomes "A view's group in the Views catalogue is its folder:".
- `DESIGN.md:75:` "(the rail's groups, the board chrome" becomes "(the rail's pages and their arrangements, the view catalogue's groups, the board chrome".
- `DESIGN.md:149:` "An activity rail on the left selecting what the rail lists;" becomes "An activity rail on the left whose buttons switch pages and carry their pages' badges, and a status bar along the foot, drawn from words the page hands in;".
- `DESIGN.md:158:` add `state/workbench/navigation` to the shell row's allowed list.
- `DESIGN.md:160:` add `data/sources/config/rail` to the state row's allowed list.
- `DESIGN.md:191:` "which a pressed toggle in the rail fills with" becomes "which the rail button of the page on screen fills with".
- `DESIGN.md:193:` two changes:
  - "The toggle in the rail starts on whatever the theme answers" becomes "The wallpaper toggle in the Settings view starts on whatever the theme answers".
  - "a pane's tab strip carries depth 1 over its pane body, the page strip carries depth 2 over every pane strip, the rail carries depth 5 over the panes beside it, and all stay under the drag layer at 10" becomes "a pane's tab strip carries depth 1 over its pane body and stays under the drag layer at 10".
- `DESIGN.md:237:` two changes:
  - "bookmarks in `layout.yml`, the two user manuals of cathedra and game-engine first" becomes "bookmarks in the reader's own `~/.oculus/bookmarks.yml`".
  - "the rail draws a large `nav_groups` group as one button with a flyout, so it does not grow one icon per view" becomes "the rail draws one button per page of `rail:`, and every view is listed in the Views catalogue".
- `DESIGN.md:243:` "(shift-click on the rail, a session detail" becomes "(shift-click in the Views catalogue, a session detail".
- `DESIGN.md:244:` four changes:
  - "switching the strip to it" becomes "switching to it".
  - "closed from the strip" becomes "closed from the Pages view".
  - "a bare digit is still the strip's page" becomes "a bare digit is the rail page of its place".
  - "a page tab dragged out of the strip onto a pane's edge" becomes "a page's name dragged from the Pages view onto a pane's edge".
- `DESIGN.md:245:` two changes:
  - "A strip of page names runs across the top of the work area; the rail stays what it is. A page is made by a control at the end of the strip and named from its menu; the saved arrangements of `layout.yml` open as pages." becomes "The rail's buttons are the pages of `rail:`, each tied to its arrangement by key; a browser with no saved layout starts on the first; the Pages view makes, renames and closes pages. The Views catalogue opens a view on the page shown before the Views and Settings page, which the layout store tracks and does not save."
  - "The digits 1 to 9 switch pages" becomes "The digits 1 to 9 show the rail page of their place".
- `DESIGN.md:251:` "drawn in that rail group after the group's views" becomes "listed in the catalogue under that group after its views".
- `DESIGN.md:256:` "with the open count as its rail badge" becomes "with the open count as its badge".
- `DESIGN.md:262:` "the Position Leads view, its rail badge and the ticker" becomes "the Position Leads view, its badge and the ticker".
- `DESIGN.md:267:` "which is what the reader's own press does to the text reset" becomes "which is what a save of the rail list or a bookmark taken away does".
- `DESIGN.md:278:` three changes:
  - "The foot's controls are stacked with a visible name, the three text steps one row under one name answering the left and right arrows inside the row and the up and down arrows to leave it (`railStop` in `shell/rail/rail.ts`), and text reset draws `note_back`. A rail toggle that is on fills with" becomes "The foot's controls, Search and Update, are stacked with a visible name, and the up and down arrows move along the whole rail (`railStop` in `shell/rail/rail.ts`). The button of the page on screen fills with".
  - "for the pane strips and the page strip alike" becomes "for the pane strips".
  - Add after "(`pageListItems` in `shell/panes/pane-view.ts`)": "The close question a pane and the Pages view ask is `ui/controls/CloseQuestion.svelte`."
- `DESIGN.md:286:` three changes:
  - "so one pane strip says where the rail opens a view" becomes "so one pane strip says where a view opens".
  - These are deleted: "The page strip's current tab keeps its own accent because it says which page is shown.", "and from any of its instances for a page tab", and "`shell/panes/PageStrip.svelte` gives Tabs `low` (`--tab-height-low`, 30 px) and `surface=\"card\"`, which keeps its own tint over a wallpaper."
  - "the page strip at 30 px on `--card`," and "the page strip as a second strip," are removed from the "Kept against VS Code" list.

## Next
- Apply the Doc text, then rerun `npx vitest run --reporter=dot tests/views/system/help.test.ts`.
- Rule on the sessions waiting count (item 12 premise) and on unmade pages drawing their arrangement's badges.
- At landing: copy the two manuals into this machine's `~/.oculus/bookmarks.yml`, and rerun `node bin/diagrams.mjs` if main moved.
