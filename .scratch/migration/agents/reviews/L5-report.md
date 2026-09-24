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
