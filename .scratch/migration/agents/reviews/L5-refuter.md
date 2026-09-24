Verification lines (run from .agents/worktrees/L5/tools/oculus, Node v24.21.0)

- `ls -d $TMPDIR/oculus-* | wc -l` before the runs: `7015`; after every run below: `7015`
- `npx vitest run --reporter=dot`: `Test Files  292 passed (292)` / `Tests  4648 passed (4648)`
- `npm run check`: `COMPLETED 1338 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `build=0`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint=0`
- The perl ASCII gate over `src tests bin config`: printed nothing
- `sh bin/size-check.sh`: `size=0`; `sh bin/folder-check.sh`: `folder=0`
- `npx playwright test` (whole suite, port 8792 was free): `1 failed` / `340 passed (9.1m)`, EXIT=1. The failure was `tests/browser/sources/files-sections.spec.ts:53 a note is opened from its section, typed into, saved on its own, and deleted` (`expect(locator('[data-fs-note]')).toHaveCount(0)`, received 1). The diff does not touch that file. Rerun alone three times: `9 passed (13.9s)`, `9 passed (13.4s)`, `9 passed (10.7s)`. It fails only under the load of the whole suite, so I do not count it against this step. The report's `341 passed` was not reproduced in one run.
- `node bin/revert-check.mjs` over the 12 changed node test files: `96 reverts, 0 unproven, 85 unchecked`
- `node bin/revert-check.mjs tests/browser/shell/rail.spec.ts`: `11 reverts, 0 unproven, 2 unchecked`
- `node bin/revert-check.mjs tests/browser/shell/views.spec.ts tests/browser/shell/settings.spec.ts`: `17 reverts, 0 unproven, 6 unchecked`
- `node bin/revert-check.mjs` over the pages, files, shell-defects, keyboard, boot and layout specs: `19 reverts, 0 unproven, 56 unchecked`
- Totals: 143 reverts, 0 unproven. That agrees with the report's 142 plus its rewritten rail.spec case.

## Spec

1. Files outside the brief's path list. The brief allows `src/lib/shell/rail/`, Catalogue.svelte, the drop handling in `shell/panes/`, ToolButton.svelte, tokens.css, `config/text/` and the tests. The diff also writes:
   - `src/lib/ui/menu/Menu.svelte`, split into `MenuList.svelte`, with a new `ContextMenu.svelte`
   - `MenuOpener.svelte` and `Tooltip.svelte`
   - the new `src/lib/ui/frame/on-body.ts`
   - `src/lib/ui/menu/menu-items.ts`, where `MenuGroup` moved out of Menu's module script
   - `src/lib/state/workbench/drag.svelte.ts`
   - `src/lib/state/workbench/navigation/rail.ts` (`railRefusal`)
   - `src/lib/views/system/workbench/RailEditor.svelte` (the `reveal: 'rail'` handling)
   - `src/routes/+page.svelte` and `src/lib/shell/Workbench.svelte` (`editRail`)
   - `docs/diagrams/layers.dot` and `layers.svg`

   The report names each one. My judgement on each:
   - The Menu split is justified. One list now serves the opener and the right-click menu. The pane menu and every other `Menu` caller keep the same props: `grep -rn "Menu from '\$lib/ui/menu/Menu.svelte'"` finds 12 callers, and check and build are clean.
   - The rail write through the page is forced by `boundaries.test.ts`. The shell may not reach `writes`.
   - Tooltip centring changes every tooltip placed `beside`, not only the rail's. That includes the compact menu openers in pane strips. It is a visible change outside the rail, and the report says so.
   - The drag store gaining a `view` kind is the drop path the brief asked for.
   - The diagram regeneration follows from the new imports.
2. Silent choice, the rail's Settings item. `src/lib/shell/rail/ActivityRail.svelte:120-124`:
   ```
   const holder = pages.find((entry) => railPageViews(...).includes(SETTINGS_VIEW));
   if (holder !== undefined) openRailPage(holder.page, holder.label, holder.node);
   openView(SETTINGS_VIEW, { reveal: 'rail' }, currentPage().id);
   ```
   When no rail page holds Settings, Settings opens on the page on screen. That is a choice the brief did not settle, and the report does not list it among its decisions.
3. Silent choice, the refusal line. `ActivityRail.svelte:270-272` and `:305-318` add a fixed line with a red border beside the rail's foot, `role="alert"`, cleared after 6 s (`REFUSAL_MS`). The report lists it as judgment 4. It is a new user-visible element the brief did not name.
4. Silent choice, badge colours. `RailPages.svelte:268-269` defaults the badge to `--accent` / `--on-accent`, and a view's tone overrides it. In the served build that gives three colours on one rail: light theme `rgb(189, 93, 56)` with black text, `rgb(124, 92, 255)` with black text, and `rgb(180, 83, 9)` with white text. Reported as judgment 5.
5. Where Open on this page lands. `Catalogue.svelte:115-118`: `openHere` calls `openView(view, state, page)` or `openBeside(view, state, page)`, so the view lands where a view lands on that page. The report names this (judgment 2): usually the catalogue's own pane, so the new tab covers the catalogue. It stays open for the orchestrator.
6. Right-click on a page button offers Hide and Settings, not Show. The brief asked for "Hide ... and Settings", so this matches the brief. The parity row "Right-click to hide or show" is only half met. The report says so.
7. The focus outline (`ToolButton.svelte:252-257`, `MenuOpener.svelte` `.opener.rail:focus-visible`) is a 1 px inset accent line. It is not in the brief, and the report names it (judgment 6).
8. Hide on the page on screen leaves that page shown with no button in force. The report lists this as a limitation. It was not fixed and is not booked as a question.

## Proof

1. No new case is unproven. Every new or renamed case in the diff is red under its named revert, with one exception: the renamed case `tests/browser/sources/files.spec.ts` "a file is bookmarked from its own tab, and the rail's Bookmarks menu lists the reader's own bookmark" has no directive (`unchecked` in my run). It was rewritten onto `bookmarkFiles`/`openBookmark`, so it is a changed case with no revert named.
2. "Settings shows the rail list": the second half of `rail.spec.ts:394` has no revert of its own. The only directive is `ActivityRail.svelte:117 => void write((rail) => rail);`, which reverts Hide. Removing the `reveal` handling at `RailEditor.svelte:55-70` is not shown to turn anything red. The rail list may already be in view when the Settings tab opens.
3. The keyboard path to the catalogue's context menu (Shift+F10 or the context menu key on an entry) has no browser case. `views.spec.ts` presses only `click({ button: 'right' })`. The rail's Shift+F10 is covered in `rail.spec.ts:414`.
4. The Open beside branch of `openHere` (`Catalogue.svelte:116`) has no revert. The case's one directive reverts the `else` branch at `:118`.
5. Undo of a drag or a Hide ("with undo as today" in the brief) is not tested anywhere in the diff.
6. The old BOOKMARKS group being gone is proven only by the SSR case in `tests/shell/rail/activity-rail.test.ts` ("no bookmark in the list above it"). By the spec's rule, a check over rendered text is an audit, not browser coverage.
7. The click spot in three specs changed to `GROUND = { x: 50, y: 2 }` (`tests/browser/helpers/rail.ts:34`) in keyboard.spec, views.spec and pages.spec. The reason holds: on the new rail, (5, 5) is the first page button. The new spot is the 2 to 4 px gap between the 48 px rail and the first pane. That is correct today, but it depends on the work area's margin staying about 4 px. No check loosened was found in the changed lines I scanned: settings, keyboard, boot, layout, rail-config, files and the helpers.
8. Counts: node suite, check, format, lint, size, folder and the temporary-folder count all match the report. The browser count does not match (1 load flake, see above).

## Standards

1. A comment the diff makes false. `src/lib/views/sources/document/Document.svelte:16-18`: "opened from the reader's bookmarks file, which the rail's BOOKMARKS group draws." That group no longer exists. This line is missing from the report's grep and from its "Doc text" section.
2. A dead prop. `src/lib/ui/controls/ToolButton.svelte:60, :99, :134`, `dataBookmark` and `data-bookmark={dataBookmark}`, has no caller left: `grep -rn dataBookmark src` finds only ToolButton. The bookmark buttons that passed it are gone.
3. `--accent-bg-txt` is no longer read by any component. Its only mentions are `src/lib/themes/tokens.css:23`, `src/lib/themes/derive.ts:198, :239`, `tests/ui/theme.test.ts:220` and `tests/checks/look/contrast.test.ts:8, :55`. The contrast test's head comment (`:8`, "`--accent-bg-txt` on the pressed-toggle") is now false, and `:55` measures a pair nothing draws. `--accent-bg` itself is still read, by `src/lib/ui/tree/TreeItem.svelte:259`. The builder put this outside the step. This step orphaned the token, so either the removal is done here or the comment and the measured pair are corrected.
4. One element per line. `src/lib/shell/rail/RailPages.svelte:223`: `{#if badge.glyph !== ''}<Glyph name={badge.glyph} />{/if}{badge.text}` puts an element and a block on one line inside the badge span.
5. Checked and clean:
   - History in comments: `git diff | grep` for package ids and dates found none.
   - ASCII.
   - Sizes: MenuList.svelte 366, ActivityRail.svelte 333, RailPages.svelte 299.
   - The folder limit.
   - Every new string goes through `t()`: `ui.rail_hide`, `ui.rail_settings`, `ui.bookmarks_none`, `ui.bookmarks_none_tip`, `ui.drag_open`, `ui.page_badge_tip`, `workbench.catalogue_open_here`, `workbench.catalogue_open_beside`.
   - Every new component has its head comment.
   - Long lines in the tests are revert directives or Prettier's test titles.
6. The glyph name `star` comes from the text catalog key `ui.bookmarks_glyph`. That follows the precedent of `ui.close_glyph` and `ui.dirty_glyph`, and it matches `file.bookmark_glyph: star` and `files.bookmark_glyph: star`, as brief decision 2 asked.
7. Comments cite VS Code source files (`activitybarpart.css`, `activityaction.css`) as the reason for the sizes: `tokens.css:77-78`, `ToolButton.svelte:177`, `RailPages.svelte:252`, `ActivityRail.svelte:276`. The spec's rule against prior art as justification names the cockpit, and this brief measures against VS Code, so I record it only as a note.

## Behaviour

1. Reorder has no keyboard path on the rail (`RailPages.svelte:119-145`: pointer only). The Settings rail list's up and down controls are the only keyboard route. The report says so. The brief's "keyboard access to every new control" is not met for reorder.
2. The Bookmarks menu is reached by the arrows (stop `bookmarks`, `ActivityRail.svelte:134`) and opens on Enter through `MenuOpener`. The page-button context menu opens on Shift+F10 (proven in the browser). The catalogue's context menu has the same handler (`ContextMenu.svelte:69-73`) but is not proven in the browser.
3. A hidden page on screen. `boot()` opens a Status page that is on no rail button. The rail then draws every button muted, with no bar and nothing marking that the page on screen is off the rail (my light-window screenshot). The same happens after Hide on the page on screen.
4. A tooltip that stays up. After the context menu closes, the focus goes back to its button (`ContextMenu.svelte:75-80`), and the rail tooltip opens on that focus. It stayed on screen through a following drag in my run (dark-drag.png shows "Projects, key 2 (...)" beside the rail during the drag). VS Code does not show an item's hover while a drag is under way.
5. Settings when no rail page holds Settings: it opens on the page on screen (Spec item 2). The report does not state this.
6. Two visible changes the report states only in passing:
   - Every pane-strip compact menu opener's tooltip is now vertically centred.
   - `catalogue_hint` gained a sentence ("Drag a view onto a pane, or right-click it, to open it on this page.").
7. Icon size and text scale: the icon is `--fs-3xl`, `calc(24px * var(--text-scale, 1))`, while the item stays a fixed 48 px (`--rail-width`) and the badge sits at a fixed `top: 24px; right: 8px`. At a larger text scale the icon grows toward the box edge and under the badge. Not measured.

## Screenshots against VS Code

Taken with Playwright at 1280x800, device scale 2, from the served build. The config and spec are in `$TMPDIR/l5shots`, and the images are in `$TMPDIR/l5shots/out`: light, dark and mocha, each as the whole window, the rail, hover, keyboard focus, context menu, Bookmarks menu and a drag in progress.

What I measured in the browser under light and dark, with Projects shown:
- The rail is 48 px wide and each item is 48 by 48.
- The svg icon is 24 by 24, centred.
- A badge box is 16 by 16 at x 24, y 24 relative to its item, inside the item. Its font is 9.5 px.
- A muted item is `rgb(95,111,133)` in light and `rgb(148,163,184)` in dark. The item in force is `rgb(15,23,42)` in light and `rgb(231,236,243)` in dark, with box-shadow `rgb(189,93,56) 2px 0px 0px 0px inset`.
- The hover tooltip for an item at y 96 to 144 is at y 109, height 21.6: centred, 6 px right of the rail.
- The foot items are 48 by 48 at y 656, 704 and 752.
- Under mocha there is no svg. The stand-ins (`[F] [d] [^]` and so on) are drawn in the item, and the badge is at x 30, y 31 relative to the item. The item in force is drawn in the accent `rgb(245,169,127)` with the 2 px bar.

These match the parity file: 48 px bar and items, 24 px icon, muted then bright, 2 px left bar, 16 px badge inside at the lower right.

The differences I see from VS Code's activity bar:
- **Badge colour:** VS Code draws every activity badge in one colour (the badge background with white text). Oculus draws each in its view's tone, so one rail shows red-brown, purple and orange badges, with black text on the first two.
- **Badge text:** 9.5 px in the monospace number font (`--font-num`), weight 600. VS Code uses 9 px in the UI font.
- **Bar background:** the rail's background is the page colour (`--bg`), with a 1 px inset line on its right edge. VS Code's activity bar has its own background, set off from the side bar and editor, most visibly in dark themes. In the light screenshot the rail and the area around the panes are one surface.
- **Focus:** a 1 px accent frame inside the item, which in dark reads as a brown box around the whole item. VS Code's focus border is its focus colour (blue by default), not the accent.
- **Tooltip:** a plain bubble 6 px to the right with no pointer. VS Code's hover beside an activity item has a pointer arrow toward the item.
- **Bookmarks menu:** opens beside the star with its top at the star's top, running downward over the panes. VS Code's Accounts and Manage menus at the foot open upward from the item.
- **Hover:** VS Code shows the hover on pointer hover. Oculus also shows it on focus, including focus that returns after a menu closes.
- **Terminal themes (mocha):** ASCII stand-ins in brackets instead of icons, with the badge moved under the stand-in. This is outside VS Code's model and within the brief's item 4.

The previous defect Axel named, badges floating outside the buttons, is gone. Every badge box measured lies inside its item's box under all three themes.

## Not checked

- Undo of a rail drag or Hide in the change log.
- Hiding the last rail page, or a Hide the rule refuses, and what the refusal line then shows.
- Dropping a catalogue view that is already open on another page.
- Text scale above 1.
- Short windows where the page list scrolls.
- The wallpaper look of the refusal line and the Bookmarks menu.
- The base build's screenshots for a before image.
- Axel's own Chrome and the TEST page. That look is the orchestrator's.

## Usage

Not measured. About 190k tokens of context read, over roughly 45 tool calls, including three revert-check runs of about 4 to 9 minutes each and one full browser suite run of 9.1 minutes.
