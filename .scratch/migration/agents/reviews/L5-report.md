Everything in the brief is done. Three things for the orchestrator are listed first under "Judgment calls": I wrote files outside the brief's path list, one user-visible choice is open (where "Open on this page" lands), and the token `--accent-bg-txt` no longer has a reader.

## DONE / NOT DONE

| # | Item | Status | Command and output (verbatim) |
|---|---|---|---|
| 1 | Node suite | DONE | `npx vitest run --reporter=dot` gave `Test Files  292 passed (292)` and `Tests  4648 passed (4648)` |
| 2 | Type check | DONE | `npm run check` gave `COMPLETED 1338 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | Build | DONE | `npm run build` gave `build-exit=0` |
| 4 | Format | DONE | `npm run format:check` gave `All matched files use Prettier code style!` |
| 5 | Lint | DONE | `npm run lint` gave `lint-exit=0` |
| 6 | ASCII gate | DONE | the perl gate over `src tests bin config` printed nothing (`gate-exit=0`) |
| 7 | Size and folder checks | DONE | `sh bin/size-check.sh` gave `size-exit=0`; `sh bin/folder-check.sh` gave `folder-exit=0` |
| 8 | Whole browser suite | DONE | `npm run build`, then `npx playwright test` gave `341 passed (7.5m)`, `EXIT=0`. The one `✘` line in the log is `files-forms.spec.ts:631`, which carries `test.fail()` and counts as passed. |
| 9 | revert-check | DONE | Run over all 23 changed test files: `142 reverts, 1 unproven, 149 unchecked`. The one unproven directive was the terminal-palette case in rail.spec.ts (GREEN under its revert). I rewrote that case so it checks the badge does not overlap the stand-in, added a second directive, and reran `node bin/revert-check.mjs tests/browser/shell/rail.spec.ts`: `11 reverts, 0 unproven, 2 unchecked`. The first run's other 141 directives were red; after the rail.spec rerun, 0 are unproven. The 149 unchecked cases are cases I did not change that had no directive on main (for example 41 in workbench.test.ts, 26 in drag.test.ts, 26 in shell-defects.spec.ts). The two loop-named type-scale cases are run by hand, as the file's own comment says: removing `font-size: var(--fs-xxs);` from RailPages.svelte gave `FAIL ... sets every pass-through role in src/lib/shell/rail/RailPages.svelte`; with the line restored, `195 passed`. |
| 10 | Temp dirs do not grow | DONE | `ls -d $TMPDIR/oculus-* \| wc -l` gave `7015` before any run and `7015` after the last run |

Brief items 1 to 7:
- **Rail 48 px wide:** `--rail-width: 48px` in tokens.css. Each item is a 48 by 48 px box with a 24 px icon (`--fs-3xl`), no border and no fill, muted (`--muted-txt`) until hovered or focused, then `--ink-txt`.
- **Page on screen:** its icon is in the text colour with an inset 2 px accent bar on the left edge.
- **Tooltip and name:** the name is the aria-label; the tooltip reads "Projects, key 2", and when the button has a badge the badge title follows in brackets. The tooltip is centred beside the item.
- **Badge:** one badge per button, the first counted view in tab order. It is a 16 px pill at top 24 px, right 8 px, inside the button, and takes no pointer.
- **Foot:** Bookmarks, Search and Update, icons only. Bookmarks is a `Menu` whose list is drawn on the body beside the button. With no bookmarks the menu shows the single choice "No bookmarks". The BOOKMARKS group is gone.
- **Terminal themes:** stand-ins are drawn at `--fs-lg` inside the 48 px square with no brackets, and the badge moves to top 31 px, right 2 px so it sits clear of the text.
- **Drag to reorder:** a 2 px accent line marks where the button will land; the drop writes `rail:` through the rail write, the same write Settings uses, so undo works the same way.
- **Right-click on a page button:** Hide writes `rail:` without the entry. Settings shows the Views and Settings page and scrolls the rail list into view. Shift+F10 or the context menu key opens the same menu.
- **Catalogue:** dragging an entry onto a pane opens the view there. Its right-click menu has "Open on this page" and "Open beside on this page". A plain press still opens the view on the page you came from.
- **Tests:** all listed tests are in place (files below).

## Activity bar parity ("Activity bar" and "Measured on vscode.dev")

VS Code values below are from its source, `activityaction.css` and `activitybarpart.css`, downloaded with curl from raw.githubusercontent.com: width 48, action height 48, icon 24 px, badge top 24 / right 8 / height 16 / 9 px text, weight 600, 2 px left border on the checked item.

| VS Code row | Built or left out | Why |
|---|---|---|
| Measured: bar 44 px, items 36 by 36 | Built at 48 px bar and 48 px items | 44/36 is vscode.dev's compact mode; the brief rules about 48, and 48/48 is the desktop default in activitybarpart.css. |
| Measured: active item as a soft tile (web); desktop 2 px left bar | Built: 2 px left bar | Axel's ruling. |
| Measured: badge 16 by 16, 9 px text, lower right, inside | Built | The top 24 px / right 8 px placement is the desktop CSS. Text is `--fs-xxs` (9.5 px) because the type scale has no 9 px step. |
| Icon-only items in a 44 to 48 px bar | Built | |
| Name on hover, with the shortcut | Built | "Projects, key 2", plus the badge title when there is a badge; centred beside the item. |
| Active marker | Built | |
| One badge per item, inside, lower right | Built | Also under terminal themes, placed below the stand-in. |
| Drag to reorder items | Built | Writes `rail:`. |
| Right-click to hide or show an item | Hide built; show through the menu's Settings choice | A hidden page needs a label and a glyph to come back, and the arrangement carries neither, so it is re-added in the Settings rail list. |
| Move the bar left or right | Left out | The brief: oculus has one side. |
| Accounts and Manage at the foot, with badges | Built as Bookmarks, Search and Update | None of the three has a count, so none draws a badge. |

## Judgment calls (each reversible)

1. **Files written outside the brief's paths:**
   - `ui/menu/Menu.svelte` is split into `MenuList.svelte` (the list) plus a new `ContextMenu.svelte`, so the Bookmarks menu, the page-button menu and the catalogue menu share one list.
   - `MenuOpener.svelte` gained a `rail` look.
   - `Tooltip.svelte` centres a beside tooltip, and its body-drawing code moved to the new `ui/frame/on-body.ts`, which MenuList uses too.
   - `state/workbench/drag.svelte.ts` gained a `view` drag kind and `startView`, with a sink `open`.
   - Rail writes go through the page: `routes/+page.svelte` gained `editRail`, passed on through `shell/Workbench.svelte`. `tests/checks/tree/boundaries.test.ts` forbids the shell from reading the `writes` and `entities` stores.
   - `state/workbench/navigation/rail.ts` gained `railRefusal`, shared with `RailEditor.svelte`; RailEditor also handles `reveal: 'rail'`.
   - `docs/diagrams/layers.*` was regenerated with `node bin/diagrams.mjs`.
2. **"Open on this page" lands where views land on that page, usually the catalogue's own pane, so the new tab covers the catalogue.** The brief does not say which pane; this is the user-visible choice left open.
3. **`--accent-bg-txt` is no longer read by any component.** Only derive.ts, tokens.css and the two theme tests name it. Removing it is a theme-vocabulary change outside this step.
4. **A refused rail write** shows the sentence `workbench.rail_refused` in a small line beside the rail's foot for 6 seconds. There is no notification centre yet (that is L6).
5. **Badge colours:** the badge defaults to the accent with `--on-accent`, as VS Code does (it was chip with accent text). A view's tone still overrides it.
6. **Focus:** keyboard focus draws a 1 px inset accent outline, VS Code's focus border. VS Code's own active-item focus bar was not copied, because it would make a focused item look like the page on screen.
7. **Foot order:** Bookmarks, Search, Update. The Bookmarks icon is `star`, via the new key `ui.bookmarks_glyph`, the glyph the file view's bookmark control uses. Each menu choice shows the bookmark's label, with `root/path` as its hover text.
8. **New text keys:**
   - `ui.drag_open` ("Opening {0}"), the drag ghost for a view.
   - `ui.page_badge_tip` ('{0} ({1})').
   - `ui.rail_hide`, `ui.rail_settings`.
   - `ui.bookmarks_none`, `ui.bookmarks_none_tip`.
   - `workbench.catalogue_open_here`, `workbench.catalogue_open_beside`.
   - `workbench.catalogue_hint` was extended.
9. **Test changes:**
   - Three specs clicked at page position (5, 5) to put the focus in no pane. That spot is now the first rail button, which made the digit-1 case in pages.spec pass without testing anything. They now use `GROUND = { x: 50, y: 2 }` from helpers/rail.ts.
   - files.spec reads bookmarks through the new helpers `bookmarkFiles()` and `openBookmark()`.
10. **Limitations:**
    - Hiding the page on screen leaves that page shown, with no button in force.
    - A release on the same button after a drag shorter than 6 px counts as a click.
    - Reordering has no keyboard path on the rail; the Settings rail list's up and down controls are that path.
    - Centring now applies to every tooltip placed beside its control (the compact menu openers too).

## What a reader sees, before and after (for the look on TEST)

- **Rail, any page:** before, 98 px wide, glyph over name, a row of badges under each button, and the button in force filled with an accent tint and outline. After, 48 px wide with icons only, muted until hovered. The button in force is bright with a 2 px accent bar on the left, and each button carries at most one small count on its icon's lower right.
- **Bookmarks:** before, a group of buttons in the list. After, a star icon at the foot; pressing it opens a menu of bookmark names beside the rail.
- **Foot:** before, Search and Update had their names under the glyphs. After, icons only; the names show on hover.
- **Right-click a page button:** new menu with Hide and Settings.
- **Drag a page button up or down:** new; an accent line shows the landing place, and layout.yml is rewritten.
- **Views and Settings page:** a catalogue entry can be dragged onto the Settings or Pages pane and opens there. Right-clicking an entry offers Open on this page and Open beside on this page.
- **Terminal theme (mocha):** stand-ins such as `[d]` sit in 48 px squares; the one in force is in the accent text colour with the bar, and the badge sits under the text.

## Screenshots

Taken in the served build at 1280x800, 2x, then removed from the tree:
- **Light:** grey line icons on the page colour. Projects shows an orange 2 px left bar and a dark icon. Filled badges "7" (red tone), "1" (purple) and "1" (orange) sit on the icons' lower right, inside their squares. The foot shows star, cmd and refresh.
- **Dark:** the same layout, with light grey muted icons and white for the page in force.
- **Mocha:** ASCII stand-ins `[F] [d] [^] [ ] (>) <> [P]...`; `[d]` is orange with the bar, and the badges sit below the stand-ins without covering them.
- **Hover:** "Focus, key 1" in a bubble beside the item, vertically centred.
- **Bookmarks menu:** "cathedra manual" and "game-engine manual" beside the star, drawn over the pane.
- **Context menu:** Hide and Settings at the pointer.
- **Drag:** a 2 px orange line at the top of the Projects button, with the dragged Inbox button faded.
- **Keyboard focus:** a 1 px accent frame inside the Inbox item, with its tooltip.

## Files changed (lines on main -> lines now)

- src: `shell/Workbench.svelte` 342->354, `shell/panes/DropLayer.svelte` 110->113, `shell/panes/PaneView.svelte` 432->435, `shell/rail/ActivityRail.svelte` 410->333, `shell/rail/RailFoot.svelte` new 106, `shell/rail/RailPages.svelte` new 299, `shell/rail/RailList.svelte` 123->123, `shell/rail/rail.ts` 61->140, `state/workbench/drag.svelte.ts` 281->316, `state/workbench/navigation/rail.ts` 109->120, `themes/tokens.css` 141->142, `ui/controls/ToolButton.svelte` 306->302, `ui/frame/on-body.ts` new 15, `ui/menu/ContextMenu.svelte` new 102, `ui/menu/Menu.svelte` 425->166, `ui/menu/MenuList.svelte` new 366, `ui/menu/MenuOpener.svelte` 117->153, `ui/menu/Tooltip.svelte` 267->274, `ui/menu/menu-items.ts` 42->49, `views/system/workbench/Catalogue.svelte` 240->296, `views/system/workbench/RailEditor.svelte` 238->256, `routes/+page.svelte` 149->167
- config: `text/ui.yml` 55->62, `text/views/system/workbench.yml` 60->62
- docs: `diagrams/layers.dot` 467->470, `diagrams/layers.svg` 2491->2500
- tests: `browser/helpers/rail.ts` 196->234, `browser/helpers/serve.ts` 292->292, `browser/shell/boot.spec.ts` 29->29, `browser/shell/keyboard.spec.ts` 291->291, `browser/shell/rail.spec.ts` 202->about 425, `browser/shell/settings.spec.ts` 167->173, `browser/shell/shell-defects.spec.ts` 600->615, `browser/shell/views.spec.ts` 302->364, `browser/sources/files.spec.ts` 843->839, `browser/workbench/layout.spec.ts` 158->158, `browser/workbench/pages.spec.ts` 249->216, `checks/source/text.test.ts`, `shell/rail/activity-rail.test.ts`, `shell/rail/rail-config.test.ts` 138->132, `shell/rail/rail.test.ts` 189->280, `shell/workbench.test.ts`, `state/workbench/drag.test.ts` 268->320, `state/workbench/navigation/rail.test.ts`, `ui/controls/glyph.test.ts`, `ui/wall.test.ts` 198->199, `views/system/workbench/catalogue.test.ts`, `views/system/workbench/settings.test.ts`, `views/whole/type-scale.test.ts` 300->304
- The test files listed without counts changed only their revert line numbers. The rail.spec count is approximate: it was 412 before the last edit to the terminal-palette case and was not re-counted.

## Doc text

Each line below is as `grep -n` printed it, followed by its replacement.

DESIGN.md:149 `**Shell** (\`shell/\`): the workbench. An activity rail on the left whose buttons switch pages and carry their pages' badges, and a status bar along the foot, drawn from words the page hands in; one tree of panes with tabs, split any way and any depth; sashes between the children of every split, and one control on each child that collapses it to the split's edge and shows it again. The shell renders the layout tree and mounts the view of every tab a pane has shown, the active one drawn and the rest hidden (\`shell/panes/TabView.svelte\`), until the tab closes or leaves the pane; a tab never shown mounts nothing, and there is no cap. A view kept hidden draws at no size; \`onShown\` in \`ui/shown.ts\` tells a view when it comes back to a size, and then the Map measures its labels again and a confirm takes the keyboard again. It does not import any view by name; views register themselves in a registry keyed by \`ViewId\`.`
Replacement: change "whose buttons switch pages and carry their pages' badges" to "drawn as VS Code's activity bar, whose icons switch pages and carry one badge each, the first count their page holds". The rest of the line is unchanged.

DESIGN.md:191, in the sentence "`derive.ts` also derives, for every theme, `--accent-bg`, a fifth of the accent in the page's colour, which the rail button of the page on screen fills with; `--accent-bg-txt`, the accent made readable on that surface first, which the toggle's glyph and name are drawn in, so no other accent text changes;"
Replacement: change "which the rail button of the page on screen fills with" to "which a selected tree row fills with", and "which the toggle's glyph and name are drawn in, so no other accent text changes" to "which no component draws in now". The rest of the line is unchanged.

DESIGN.md:193, its last sentence: `A tooltip's bubble is drawn on the document body rather than inside the surface its control sits on.`
Replacement: `A tooltip's bubble, and a menu's list opened at a point or beside the rail (\`ui/menu/MenuList.svelte\` through \`onBody\` of \`ui/frame/on-body.ts\`), is drawn on the document body rather than inside the surface its control sits on.`

DESIGN.md:245, the sentence `The Views catalogue on the Views and Settings page opens a view on the page shown before that page, which the layout store tracks and does not save; a catalogue moved onto another page opens on that page.`
Replacement: the same sentence, followed by `An entry dragged onto a pane of the page on screen opens there, through the drag a tab takes (a \`view\` drag of \`state/workbench/drag.svelte.ts\`), and its right-click menu offers Open on this page and Open beside on this page.`

DESIGN.md:258 `- A group's documents join its chord after its views, so a digit reaches a configured document as it reaches a view, and the rail's heading over the reader's own bookmarks reads "Bookmarks". Two fixes of delivered work, made on main.`
Replacement: `- A group's documents join its chord after its views, so a digit reaches a configured document as it reaches a view, and the rail's Bookmarks menu at its foot lists the reader's own bookmarks by name. Two fixes of delivered work, made on main.`

DESIGN.md:267, the clause `which is what a save of the rail list or a bookmark taken away does,`
Replacement: `which is what a save of the rail list or Hide on a page button does,`. The rest of the line is unchanged.

DESIGN.md:278, the sentences `The foot's controls, Search and Update, are stacked with a visible name, and the up and down arrows move along the whole rail (\`railStop\` in \`shell/rail/rail.ts\`). The button of the page on screen fills with \`--accent-bg\` and draws its border in the accent and its glyph and name in \`--accent-bg-txt\`, under every theme. A \`MenuItem\` may carry \`items\`: picking it shows them in \`ui/menu/Menu.svelte\` in place of the menu's list`
Replacement: `The rail is VS Code's activity bar: 48 px wide (\`--rail-width\`), 48 px square items with a 24 px icon, muted until hovered, the page on screen in the text colour with a 2 px accent bar on its left edge, the name and digit as a tooltip centred beside the item, and one 16 px badge inside the item over the icon's lower right corner (\`shell/rail/RailPages.svelte\`). A page button dragged along the rail, and Hide in its right-click menu (\`ui/menu/ContextMenu.svelte\`), rewrite \`rail:\` through the rail write, which the page reaches for the rail. The foot's controls, Bookmarks (a menu of the bookmarks by name), Search and Update, are icons with their names as tooltips (\`shell/rail/RailFoot.svelte\`), and the up and down arrows move along the whole rail (\`railStop\` in \`shell/rail/rail.ts\`). A \`MenuItem\` may carry \`items\`: picking it shows them in \`ui/menu/MenuList.svelte\` in place of the menu's list`. The rest of the line is unchanged.

HELP.md:13, the sentence `A button draws the badges of the views its page holds, in the order of the page's tabs, the arrangement's views before the page is first made.`
Replacement: `A button is an icon, named by its page on hover with the digit that reaches it, and carries one badge: the count of the first view of its page that counts anything, in the order of the page's tabs, the arrangement's views before the page is first made. Drag a button up or down the rail to move it; right-click it to hide it or to open the rail list in Settings. Both rewrite \`rail:\`.`

HELP.md:15, add at the end: `Dragging an entry onto a pane of the Views and Settings page opens it there, and an entry's right-click menu offers Open on this page and Open beside on this page.`

HELP.md:17 `Under the page buttons sit the bookmarks, the reader's own from \`~/.oculus/bookmarks.yml\`, which the Files view adds and takes away, each opened as a tab of its own. At the foot of the rail are Search, which opens the palette, and Update, which opens the update tray, each drawn with its name under its glyph. The button of the page on screen is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Icons) are in the Settings view.`
Replacement: `At the foot of the rail are Bookmarks, a menu of the reader's own bookmarks from \`~/.oculus/bookmarks.yml\` by name, which the Files view adds and takes away, each opened as a tab of its own; Search, which opens the palette; and Update, which opens the update tray. Each is an icon with its name as the tooltip. The button of the page on screen draws its icon in the text colour with an accent bar on its left edge. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Icons) are in the Settings view.`

`grep -n "stacked\|98 px\|BOOKMARKS" DESIGN.md HELP.md README.md` found nothing beyond the lines above.

# Repair round 1

Everything in the repair list is done. One check was not clean in every run: the node case `tests/checks/bin/revert-check.test.ts > removes its copy of the tree when it is stopped by a signal` failed in 2 of 6 runs. Those were one whole-suite run and one run of the file alone. It passed in the other whole-suite run and in three runs alone, so the table below records it as an intermittent failure. This round changed neither that test nor `bin/revert-check.mjs`, but that the step has no part in it is inferred, not verified.

## What each numbered item came to

1. **Badge colour.** Every rail badge is drawn in `--accent` with `--on-accent` (black or white, whichever reads better). The tone style is gone from the rail; tones still colour tabs and the catalogue. The contrast test now measures `--on-accent` on `--accent`. On the light theme that pair is 4.79:1, the lowest of the 17 themes, measured with a vitest probe over `themeTokens`.
2. **Badge text.** It is set in `--font-ui`, weight 600, at the new fixed token `--rail-badge-text: 9px`. The browser case measures `9px`, `600` and the body's font family.
3. **Rail surface.** New derived token `--rail-bg`, with `--on-rail-bg` beside it:
   - `railSurface` in `derive.ts` moves the page colour toward black (toward white when the panel is darker than the page) until it stands at 1.1:1 or more from both the page and the panel.
   - Measured per theme, apart from the page and the panel respectively: light `#e2e6ea` (1.15 and 1.25), dark `#1e2431` (1.21 and 1.12), mocha `#0d0d15` (1.10 and 1.18); all 17 themes clear 1.1.
   - The rail and its fades paint on it, and over a wallpaper the rail mixes `--rail-bg` in at the panes' share.
   - `--rail-bg` is one of the grounds the text colours must read on, the contrast test measures every `-txt` colour on it, and the colours test counts it as a surface.
   - The browser case checks that the rail's background differs from the pane's and the body's under light, dark and mocha (mocha carries the wallpaper).
4. **Tooltip arrow.** A bubble placed beside its control carries a 6 px triangle pointing at the item, drawn in the border and fill colours.
5. **Bookmarks menu.** It opens upward to the right of the star, its bottom edge level with the star's bottom (within 1 px), and moves to stay inside the window. The list is hidden until it has been measured and placed, and takes the keyboard after that.
6. **No stray tooltips.**
   - A pointer that arrives with a button held (a drag) opens no tooltip.
   - A menu handing the focus back to its opener uses `focusQuietly` (in `ui/menu/tooltip-target.ts`), which marks the control, so that focus opens no tooltip.
   - Keyboard moves the reader makes still open one (proven with ArrowDown).
7. **Icon size.** The icon uses the new fixed token `--rail-icon: 24px`, so it stays 24 px at any text scale, measured 24 by 24 at a text scale of 1.5. I chose to keep the item and the badge fixed at every text scale, as VS Code does. Terminal stand-ins still use `--fs-lg`, which scales.

Kept as ruled:
- The focus outline stays in the accent.
- The terminal themes keep their stand-ins.

8. **The catalogue is never covered.**
   - Open on this page calls the new layout operation `openAway` (`state/workbench/layout/open/away.ts`). The view goes to the pane where views land if that pane is not the catalogue's, otherwise to the first other pane. When the catalogue's pane is the page's only pane, it opens beside it.
   - Open beside on this page calls `openNextTo`, which opens a new pane to the right of the catalogue.
   - A drop on the middle or the strip of the catalogue's own pane is redirected through `openAway`. The drag carries its source instance in `from`, the sink gained `holds` and `away`, and the layout store gained `paneHolds`.
9. **Settings when no rail page holds it** opens on the page on screen, as before; the comment in `ActivityRail.svelte` already says so.
10. **The refusal line** is kept. Its CSS comment now ends "it stands until notifications take its place."
11. **Hide on the page on screen** keeps that page shown, with no button in force.
12. **Tests added** (every directive is red; revert-check results are in the table):
    - The renamed files.spec case has a directive. Two other files.spec cases changed last round were also missing one; they have one now.
    - The Settings reveal has its own case with a short window, asserting the view scrolled and the list heading is in view.
    - Shift+F10 on a catalogue entry has a browser case.
    - The Open beside branch has its own revert.
    - Undo from History after a drag and after a Hide has a case, with a revert of `undo.ts:225`.
    - "The rail draws no BOOKMARKS group" has a browser case with a revert that re-adds a heading.
    - Items 1 to 8 have cases, including one that the catalogue shows several tones while every rail badge is one colour, and one that no tooltip opens during a drag.
    - A node case holds the rail surface's separation in every theme.
13. **`Document.svelte:16-18`** now says "the rail's Bookmarks menu lists". I grepped for BOOKMARKS and other mentions of rail bookmarks and also corrected `BookmarkStar.svelte:4-5` and a comment in `files.spec.ts:321`.
14. **`dataBookmark`** is removed from ToolButton: the prop, its doc comment and the attribute. `grep -n ookmark src/lib/ui/controls/ToolButton.svelte` prints nothing.
15. **`--accent-bg-txt`** is removed from `tokens.css` and `derive.ts`.
    - The contrast test's head comment and its pair are rewritten; it now measures `--on-accent` on `--accent` and every `-txt` colour on `--rail-bg`.
    - `theme.test.ts` checks `--rail-bg` in its place, with a revert of `tokens.css:24`.
    - The `--accent-bg` comments now say the selected tree row fills with it.
    - `grep -rn accent-bg-txt src tests config` prints nothing.
16. **The badge span** is one element per line.

## Verification

| # | Item | Command | Output |
|---|---|---|---|
| 1 | Node suite | `npx vitest run --reporter=dot` | Last run: `Test Files  292 passed (292)` / `Tests  4649 passed (4649)`. Across the round, `revert-check.test.ts > removes its copy of the tree when it is stopped by a signal` failed in 2 of 6 runs (one whole suite, one alone) and passed in the other 4. |
| 2 | Type check | `npm run check` | `COMPLETED 1339 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | Build | `npm run build` | `build=0` |
| 4 | Format | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | Lint | `npm run lint` | `lint=0` |
| 6 | ASCII gate | perl gate | printed nothing, `gate=0` |
| 7 | Size and folder | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | `size=0`; `folder=0` |
| 8 | Browser suite | `npx playwright test` | `341` before, now `351 passed (8.2m)`, `EXIT=0`. The one ✘ line is the `test.fail()` case `files-forms.spec.ts:631`. |
| 9 | revert-check | first run over the 19 changed test files | `134 reverts, 2 unproven, 160 unchecked` |
| 9 | | the two unproven fixed; rerun `node bin/revert-check.mjs tests/ui/theme.test.ts tests/checks/look/contrast.test.ts` | `5 reverts, 0 unproven` |
| 9 | | rerun `node bin/revert-check.mjs tests/browser/shell/rail.spec.ts tests/browser/sources/files.spec.ts` | `30 reverts, 0 unproven, 19 unchecked` |
| 9 | | net | 0 unproven. The unchecked cases are ones this round did not change and that had no directive on main, plus the rail.spec describe block's own name. |
| 10 | Temp dirs | `ls -d $TMPDIR/oculus-* \| wc -l` | `7015` before, `7015` after |

The two directives the first revert-check run left unproven:
- The contrast case's name held a template, so revert-check could not find the case. It has a plain name now.
- The Settings case stayed green under its revert, because the rail list was already in view. It now asserts the pane was scrolled.

## Screenshots against VS Code

Taken with Playwright at 1280x800, 2x, under light, dark and mocha: the rail, a hover, the Bookmarks menu, the context menu, after Escape, and during a drag.
- **Surface:** the rail is a grey strip (`#e2e6ea`) in light, apart from the pane and the ground. In dark it is its own slate (`#1e2431`), and in mocha it is darker than the ground and the panes. VS Code's activity bar reads the same way, as a surface of its own.
- **Badges:** every badge is one filled pill in the accent with black text ("7", "1", "1"), over the icon's lower right corner and inside the item. Under mocha it sits under the stand-in. This matches VS Code's single badge colour; the colour is the accent rather than VS Code's blue, as the ruling allows.
- **Tooltip:** "Academic Life, key 3 (1 undecided)" is centred beside the item with a triangle pointing at it, as VS Code's hover is drawn.
- **Bookmarks menu:** "cathedra manual" and "game-engine manual" rise from the star, their bottom level with the star's, like VS Code's Accounts and Manage menus.
- **After Escape:** the focus is back on Inbox with no tooltip showing.
- **During a drag:** no tooltip shows, the insertion line sits between two buttons, and the dragged Inbox button is faded.
- **Focus ring:** accent coloured, kept as ruled; VS Code's is blue.

## Files changed this round

- src: `shell/rail/ActivityRail.svelte`, `shell/rail/RailPages.svelte`, `shell/rail/RailList.svelte`, `shell/rail/rail.ts` (unchanged except line references), `ui/menu/Menu.svelte`, `ui/menu/MenuList.svelte`, `ui/menu/ContextMenu.svelte`, `ui/menu/Tooltip.svelte`, `ui/menu/tooltip-target.ts`, `ui/menu/MenuOpener.svelte`, `ui/controls/ToolButton.svelte`, `themes/tokens.css`, `themes/derive.ts`, `state/workbench/drag.svelte.ts`, `state/workbench/layout.svelte.ts`, `state/workbench/layout/index.ts`, new `state/workbench/layout/open/away.ts`, `views/system/workbench/Catalogue.svelte`, `views/sources/document/Document.svelte`, `views/shared/links/BookmarkStar.svelte`.
- tests: `browser/shell/rail.spec.ts`, `views.spec.ts`, `shell-defects.spec.ts`, `boot.spec.ts`; `browser/sources/files.spec.ts`; `browser/workbench/pages.spec.ts`, `layout.spec.ts`, `tabs.spec.ts`; `checks/look/contrast.test.ts`; `ui/colours.test.ts`, `ui/theme.test.ts`, `ui/controls/glyph.test.ts`; `shell/rail/rail.test.ts`, `rail-config.test.ts`; `state/workbench/drag.test.ts`, `layout/pages.test.ts`, `navigation/arrangement.test.ts`; `views/whole/type-scale.test.ts`; `views/system/workbench/catalogue.test.ts`.
- Several of these test files changed only because a revert directive pointed at a line that moved. Each moved directive was matched by line content.
- `docs/diagrams`: `node bin/diagrams.mjs` was rerun and the diagram test passes.

## Doc text

DESIGN.md:149, current:
`**Shell** (\`shell/\`): the workbench. An activity rail on the left whose buttons switch pages and carry their pages' badges, and a status bar along the foot, drawn from words the page hands in; one tree of panes with tabs, split any way and any depth; sashes between the children of every split, and one control on each child that collapses it to the split's edge and shows it again. The shell renders the layout tree and mounts the view of every tab a pane has shown, the active one drawn and the rest hidden (\`shell/panes/TabView.svelte\`), until the tab closes or leaves the pane; a tab never shown mounts nothing, and there is no cap. A view kept hidden draws at no size; \`onShown\` in \`ui/shown.ts\` tells a view when it comes back to a size, and then the Map measures its labels again and a confirm takes the keyboard again. It does not import any view by name; views register themselves in a registry keyed by \`ViewId\`.`
Replacement: the same line, with "An activity rail on the left whose buttons switch pages and carry their pages' badges" changed to "An activity rail on the left, drawn as VS Code's activity bar on a surface of its own, whose icons switch pages and carry one badge each, the first count their page holds".

DESIGN.md:191, current:
`\`tokens.css\` and \`themes.css\` port from the cockpit unchanged: colours, type scale, radii, fifteen theme blocks that override tokens and nothing else. VS Code Dark Modern and Light Modern are two more blocks, authored for oculus rather than ported, which is why a contrast failure in one of them is fixed in the block and a failure in a ported one is a finding about the port. The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. \`derive.ts\` also derives, for every theme, \`--accent-bg\`, a fifth of the accent in the page's colour, which the rail button of the page on screen fills with; \`--accent-bg-txt\`, the accent made readable on that surface first, which the toggle's glyph and name are drawn in, so no other accent text changes; \`--scroll-track\`, the panel; and \`--scroll-thumb\`, halfway between \`--muted\` and \`--line\` and moved in lightness until it clears 3:1 on the track, which the contrast test also measures. For every hue it also derives \`--c-<hue>-lane\`, half the hue and half the panel, which the header of a Focus lane and of the Funding, Jobs and Teaching columns fills with (\`views/boards/focus/lanes/LaneHead.svelte\`), and \`--c-<hue>-lane-txt\`, the hue's text colour made readable on that surface first, which the header's name and count are drawn in, so no other hue text changes. The contrast test measures \`--c-<hue>-lane-txt\` on its own \`--c-<hue>-lane\` and on nothing else. \`tests/browser/boards/focus-look.spec.ts\` proves in the page, under light, dark and dracula with and without the wallpaper, that every word of every lane and column header sits on its own lane surface at 4.5:1 or better. The contrast test also reads src/ for a lane text token used outside the header's shape. \`tests/checks/look/lane-distance.test.ts\` holds every pair of headers that touch with every cluster open and every column drawn at a CIEDE2000 of 10 or more under every theme; a collapsed cluster or a hidden column is not held. \`tokens.css\` gives those four the default theme's derived values on \`:root\`, so the first paint draws them before a theme is applied, and one rule in the page root draws every scrolling box's thin bar in the two scrollbar tokens. Primitives use tokens only; a raw hex in a component is a test failure.`
Replacement: the same line, with "which the rail button of the page on screen fills with; `--accent-bg-txt`, the accent made readable on that surface first, which the toggle's glyph and name are drawn in, so no other accent text changes;" changed to "which a selected tree row fills with; `--rail-bg`, the activity rail's own surface, the page moved toward black or white until it stands at 1.1:1 or more from both the page and the panel (`RAIL_RATIO`), which every text colour is also made readable on and the contrast test also measures;". The rest of the line is unchanged.

DESIGN.md:193, current (the whole line):
`The wallpaper is one image behind everything, served by \`api/wallpaper\` from a directory \`appearance.yml\` names under the hub and nothing outside it. It is on where a theme's class carries \`rice\`, or under every theme where the config says \`all\`; the body then carries \`wall\`, and each component that paints a surface declares under that class what its surface does. The shell's pane box and the box a view fills both paint nothing (the shell's keeps its border), and a view that draws its text straight into its box asks the box for the translucent surface instead, so no text is read off the picture with nothing between. Everything the box holds that paints a surface of its own keeps \`panel_opacity\` of its colour with \`panel_blur\` of backdrop blur behind it, and so does the rail and the tab strip: one translucent layer over the picture and never two, since two such layers read as one nearly solid one. A surface inside one of those paints nothing in turn, the current tab inside the strip included. A floating surface keeps \`popover_opacity\`, which is higher because it is read through a pane as well as through the picture: the menus, the palette, the update tray, the key sheet, the confirm box and the tooltip. The small controls stay solid, being what text is read off: the buttons, the chips, the inputs, the meter, the disclosure, the ticker, a menu's items, a table's rows and every hover response. The colour is still the token the contrast test measured. The wallpaper toggle in the Settings view starts on whatever the theme answers and holds a value of its own only once pressed, so saving any other appearance value leaves it alone. A blurred surface is the containing block and the stacking context of every fixed thing inside it, so a pane's tab strip carries depth 1 over its pane body and stays under the drag layer at 10. A tooltip's bubble is drawn on the document body rather than inside the surface its control sits on.`
Replacement: the same line with two changes.
- "and so does the rail and the tab strip" becomes "and so does the tab strip, and the rail keeps the same share of its own `--rail-bg`".
- The last sentence becomes "A tooltip's bubble, and a menu's list opened at a point or beside the rail (`ui/menu/MenuList.svelte` through `onBody` of `ui/frame/on-body.ts`), is drawn on the document body rather than inside the surface its control sits on."

DESIGN.md:245, current:
`- Pages: the workbench is one of several pages, each a whole arrangement with a name, and the saved layout is the list of pages plus which one is current, so the layout tree of "Layout as data" is unchanged and gains a level above it. The rail's buttons are the pages of \`rail:\`, each tied to its arrangement by key; a browser with no saved layout draws no page until the configuration names the first, and starts on it; the Pages view makes, renames and closes pages. The Views catalogue on the Views and Settings page opens a view on the page shown before that page, which the layout store tracks and does not save; a catalogue moved onto another page opens on that page. Switching pages unmounts the hidden page's views, which rebuild from the stores when it returns (a terminal repaints its scrollback), so nothing is drawn twice and no hidden terminal holds a client. The digits 1 to 9 show the rail page of their place, Ctrl with a digit switches the tab in the focused pane, and \`v\`, \`c\` or \`m\` before a digit opens a view.`
Replacement: the same line, with this inserted after "a catalogue moved onto another page opens on that page.": "An entry is also opened on the catalogue's own page: dragged onto a pane there (a `view` drag of `state/workbench/drag.svelte.ts`), or through its right-click menu's Open on this page and Open beside on this page. None of them covers the catalogue. A view asked for in the catalogue's own pane opens in another pane of the page, or beside the catalogue when its pane is the page's only one (`openAway` and `openNextTo` of `state/workbench/layout/open/away.ts`)."

DESIGN.md:258, current:
`- A group's documents join its chord after its views, so a digit reaches a configured document as it reaches a view, and the rail's heading over the reader's own bookmarks reads "Bookmarks". Two fixes of delivered work, made on main.`
Replacement:
`- A group's documents join its chord after its views, so a digit reaches a configured document as it reaches a view, and the rail's Bookmarks menu at its foot lists the reader's own bookmarks by name. Two fixes of delivered work, made on main.`

DESIGN.md:267, current: the whole line as `grep -n` prints it, beginning `- Tab moves the focus and Ctrl with a bracket cycles a pane's tabs.` and ending `and in words that Tab is the browser's.` (reproduced in full in round 0's Doc text; unchanged since).
Replacement: the same line, with "which is what a save of the rail list or a bookmark taken away does," changed to "which is what a save of the rail list or Hide on a page button does,".

DESIGN.md:278, current: the whole line, beginning `- The shell's tooltips, rail and tab strip.` and ending `and an empty query lists the views alone.` It contains the two sentences replaced below.
Replacement: the same line with two changes.
- The sentences "The foot's controls, Search and Update, are stacked with a visible name, and the up and down arrows move along the whole rail (`railStop` in `shell/rail/rail.ts`). The button of the page on screen fills with `--accent-bg` and draws its border in the accent and its glyph and name in `--accent-bg-txt`, under every theme." become: "The rail is VS Code's activity bar on a surface of its own, `--rail-bg`. It is 48 px wide (`--rail-width`), with 48 px square items and a 24 px icon (`--rail-icon`, fixed at every text scale). Icons are muted until hovered. The page on screen draws in the text colour with a 2 px accent bar on its left edge. The name and digit form a tooltip centred beside the item, with an arrow pointing at it. Each item carries one 16 px badge, in the accent with its black or white at 9 px in the UI face (`--rail-badge-text`), inside the item over the icon's lower right corner (`shell/rail/RailPages.svelte`). No tooltip opens during a drag or on a focus a closing menu gives back (`focusQuietly` in `ui/menu/tooltip-target.ts`). A page button dragged along the rail, and Hide in its right-click menu (`ui/menu/ContextMenu.svelte`), rewrite `rail:` through the rail write, which the page reaches for the rail. The foot's controls, Bookmarks, Search and Update, are icons with their names as tooltips (`shell/rail/RailFoot.svelte`). Bookmarks is a menu of the bookmarks by name that rises from the star. The up and down arrows move along the whole rail (`railStop` in `shell/rail/rail.ts`)."
- "shows them in `ui/menu/Menu.svelte`" becomes "shows them in `ui/menu/MenuList.svelte`".

HELP.md:13, current:
`The rail draws one button per entry of the \`rail:\` list of \`config/layout.yml\`, each \`{label, glyph, page}\`, where \`page\` names an arrangement under \`arrangements:\`. A button shows its page: made from its arrangement the first time and shown as it was left after that. A browser with no saved layout starts on the first of them, and draws no page until the configuration has named it. A button draws the badges of the views its page holds, in the order of the page's tabs, the arrangement's views before the page is first made. Every view, and every hub document of the \`docs\` key, is listed in the Views catalogue on the Views and Settings page, under its \`nav_groups\` group; the groups, their order and their letters are those two keys.`
Replacement: the same line, with "A button draws the badges of the views its page holds, in the order of the page's tabs, the arrangement's views before the page is first made." changed to "A button is an icon; hovering it shows its page's name and the digit that reaches it. It carries one badge, in the accent: the count of the first view of its page that counts anything, in the order of the page's tabs, the arrangement's views before the page is first made. Drag a button up or down the rail to move it; right-click it (or press Shift+F10) to hide it or to open the rail list in Settings. Both rewrite `rail:`, and History undoes either. Hiding the page on screen leaves it on screen."

HELP.md:15, current:
`In the catalogue on the Views and Settings page a click shows the page the reader was on before that page and opens the view there, where views land, which is the pane whose tab was activated last; after a load straight onto the Views and Settings page it opens on the first rail page. A catalogue the reader has moved onto a page of their own opens the view on that page. A view already open is activated where it is rather than opened twice. A shift-click opens it in a new pane to the right, on that same page, and the next shift-click joins that pane as a tab while it is still open.`
Replacement: the same line, followed by: "Dragging an entry onto a pane of the page the catalogue is on opens it there. An entry's right-click menu, or Shift+F10, offers Open on this page, which opens it in another pane of that page (beside the catalogue when the catalogue's pane is the only one), and Open beside on this page, which opens it in a new pane beside the catalogue. A drop on the catalogue's own pane goes to another pane, so the catalogue is never covered."

HELP.md:17, current:
`Under the page buttons sit the bookmarks, the reader's own from \`~/.oculus/bookmarks.yml\`, which the Files view adds and takes away, each opened as a tab of its own. At the foot of the rail are Search, which opens the palette, and Update, which opens the update tray, each drawn with its name under its glyph. The button of the page on screen is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Icons) are in the Settings view.`
Replacement:
`At the foot of the rail are Bookmarks, a menu rising from the star that lists the reader's own bookmarks from \`~/.oculus/bookmarks.yml\` by name, which the Files view adds and takes away, each opened as a tab of its own; Search, which opens the palette; and Update, which opens the update tray. Each is an icon with its name as the tooltip. The rail has a surface of its own, and the button of the page on screen draws its icon in the text colour with an accent bar on its left edge. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. The appearance controls (Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Icons) are in the Settings view.`
