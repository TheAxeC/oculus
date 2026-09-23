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
