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

# Repair round 1, refuted

Verification lines (run from .agents/worktrees/L5/tools/oculus, Node v24.21.0)

- `ls -d $TMPDIR/oculus-* | wc -l` before the runs: `7015`. After every run below: `7015`.
- `npx vitest run --reporter=dot`, first run: `Test Files  1 failed | 291 passed (292)` / `Tests  1 failed | 4648 passed (4649)`. The failure was `tests/server/watch/git.test.ts:679` (`expect(latest(client.got)[added].branch).toBe('work')`), a git-watcher timing case in a file the step does not touch. Rerun of that file alone: `Tests  22 passed (22)`. Second whole run: `Test Files  292 passed (292)` / `Tests  4649 passed (4649)`.
- `npm run check`: `COMPLETED 1339 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `build=0`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint=0`
- Perl ASCII gate over `src tests bin config`: printed nothing, `gate=0`
- `sh bin/size-check.sh`: `size=0`. `sh bin/folder-check.sh`: `folder=0`.
- `npx playwright test`, run in two halves because a single run would exceed my tool timeout. Port 8792 was free before each half.
  - `tests/browser/shell tests/browser/workbench tests/browser/sessions`: `183 passed (3.4m)`, EXIT=0.
  - `tests/browser/boards tests/browser/sources tests/browser/views`: `168 passed (4.2m)`, EXIT=0.
  - Total 351, which matches the report's `351 passed`.
- `node bin/revert-check.mjs` over the 11 changed node test files: `72 reverts, 0 unproven, 93 unchecked`.
- `node bin/revert-check.mjs tests/browser/shell/rail.spec.ts`: `23 reverts, 0 unproven, 3 unchecked`. The 3 unchecked are two cases with no directive on the base and the describe block "Settings from a page button menu".
- `node bin/revert-check.mjs tests/browser/shell/views.spec.ts tests/browser/sources/files.spec.ts`: `21 reverts, 0 unproven, 22 unchecked`. Every unchecked case is one the round did not change.
- `node bin/revert-check.mjs` over the boot, shell-defects, layout, pages and tabs specs: `21 reverts, 0 unproven, 39 unchecked`.
- Total: 137 reverts, 0 unproven.
- The flaky case, run alone five times with `npx vitest run tests/checks/bin/revert-check.test.ts -t 'removes its copy of the tree when it is stopped by a signal'`: `1 passed | 18 skipped` five times out of five.
  - This step cannot cause it. `git diff 4b0a7ad5 --stat -- bin tests/checks/bin` prints nothing, and the case copies a synthetic `fixture()` tree, not oculus's.
  - The race is in `bin/revert-check.mjs` itself. `copyTree` makes the folder at `:256` (`mkdtempSync`) and then runs a synchronous `cpSync`. The signal handlers are installed only at `:420`, after `copyTree` returns.
  - The test sends SIGTERM as soon as the folder appears (`:551-552`). A SIGTERM that lands during `cpSync` kills the process before any handler exists, so the copy stays behind. Under load the copy takes longer, which widens that window.

## Spec

1. The rail surface fix reaches far past the rail. `src/lib/themes/derive.ts:406-411`:
   ```
   const rail = page && panel ? railSurface(page, panel) : '';
   ...
   const grounds = [chip, card, panel, page, rail].filter((ground) => Boolean(ground));
   ```
   Adding the rail to `grounds` makes `everywhere()` nudge every `-txt` colour until it reads on the rail as well, and those colours are used throughout the app.
   - I compared base `deriveTokens` (4b0a7ad5) with the current one theme by theme, using a node probe in my scratchpad over `tokens.css` and `themes.css`. Text tokens changed per theme: light 58, vscode-light-modern 52, latte 50, tokyoneon 27. Among them are `--muted-txt: #5f6f85 -> #566579` and `--accent-txt: #ad5533 -> #9d4d2e` under light, and `--muted-txt: #7c85b4 -> #828bb7` under tokyoneon, plus every hue's `-txt`.
   - The served page confirms it: a muted rail item under light computes to `rgb(86, 101, 121)`, which is `#566579`.
   - So under four themes every muted, accent and hue text in every view changed. The report does not say so.
   - This also goes against the pattern DESIGN.md:191 describes and that this round's Doc text deletes. `--accent-bg-txt` and `--c-<hue>-lane-txt` each derive a text colour for one surface "so no other accent text changes" / "so no other hue text changes".
   - The narrow fix is a rail-only text token, or measuring only the rail's own icon colours on `--rail-bg`.
2. The rail surface moves the two VS Code themes away from VS Code.
   - VS Code's own theme files, fetched with curl from `raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/`:
     - dark_modern: `"activityBar.background": "#181818"`, `"sideBar.background": "#181818"`, `"editor.background": "#1F1F1F"`, `"activityBar.border": "#2B2B2B"`.
     - light_modern: `"activityBar.background": "#F8F8F8"`, `"sideBar.background": "#F8F8F8"`, `"activityBar.border": "#E5E5E5"`.
   - In both, the bar is the side bar's colour and is set off by a border.
   - Before this round, oculus's rail under `vscode-dark-modern` was `--bg` = `#181818` and under `vscode-light-modern` `#f8f8f8`, which is exactly VS Code.
   - Measured in the served build now: `rgb(12, 12, 12)` and `rgb(233, 233, 233)`.
   - The ruling asked for the rail to look like VS Code's activity bar. Under VS Code's own themes it now looks less like it.
3. The tooltip arrow is on every tooltip placed beside its control, not only the rail's. `Tooltip.svelte:225` `class:beside={placement === 'beside'}`, and `MenuOpener.svelte:46` `placement={compact || rail ? 'beside' : 'below'}`. So every compact menu opener in a pane strip now draws a triangle. That is a visible change outside the rail, and the report does not name it.
4. `focusQuietly` is applied in `Menu.svelte:123,130` (`pick`, `escape`), so it changes every `Menu` in the app, not only the rail's. The behaviour is reasonable (no tooltip on a focus a closing menu gives back), but the report states it only for the rail.
5. `openNextTo` and `openAway` treat a view that is already open differently.
   - `openAway` leaves a view open in a third pane where it is (`away.ts:52-53`).
   - `openNextTo` always runs `split(id, own.path, 'right', page)` (`away.ts:34-37`), so "Open beside on this page" on a view already open elsewhere on the page moves it out of its pane.
   - Neither the brief nor a ruling settles this, and the report does not list it.
6. Ruling 7 pins the badge count at a fixed `--rail-badge-text: 9px` (`tokens.css:84`) at every text scale. A reader who raises the text scale for readability gets every other count larger and the rail counts unchanged. The report states this as the builder's own choice ("I chose to keep the item and the badge fixed"). It is a user-visible decision for the orchestrator.

## Proof

1. The report's claim "On the light theme that pair is 4.79:1, the lowest of the 17 themes" is false. My probe of `--on-accent` on `--accent` per theme gives `vscode-dark-modern #0078d4 #000000 4.64` below `light #bd5d38 #000000 4.79`.
2. The contrast test's changed pair is not a check removed while the thing it guarded remains.
   - `--accent-bg-txt` is gone from src, tests and config (`grep -rn accent-bg-txt src tests config` prints nothing; DESIGN.md:191 and :278 are covered by the Doc text).
   - `--on-accent-bg` on `--accent-bg`, the pair still drawn, is still measured.
   - The replacement pair, `--on-accent` on `--accent` (`contrast.test.ts:61`), was already measured by `tests/ui/colours.test.ts` "keeps every --on-<surface> on its surface at 4.5:1", since `--accent` is in its `SURFACES`. The new pair duplicates that check and adds no coverage.
3. `--rail-bg` added to `SURFACES` and `WALL_SURFACES` in `tests/ui/colours.test.ts:58-67,350` widens an allow-list. The widening is backed: the contrast test measures every `-txt` on `--rail-bg` (`contrast.test.ts:37`), and the new case at `:179` holds RAIL_RATIO, red under its revert. Not a loosening.
4. "Moves to stay inside the window" (report item 5) is not proven for the case it covers.
   - `MenuList.svelte:661-663`: `y: rise ? Math.min(rect.height, point.y - MARGIN)` clamps a rising list to the top margin. A list taller than the space above then runs down past the star, and nothing clamps its bottom.
   - The browser case `rail.spec.ts` "the Bookmarks menu opens upward from the star" uses a 800 px window with two bookmarks, so it never reaches the clamp.
5. The badge case asserts `size: '9px'`, but only the font family has a revert (`RailPages.svelte:267`). The fixed size has no directive of its own.
6. No case covers `openNextTo` on a view already open on the page, or a drop onto an edge of the catalogue's own pane.
7. The node suite had one failure in the first whole run, in an untouched git-watcher file (see verification lines). The report's six node runs mention only the revert-check signal case.

## Standards

1. `--on-rail-bg` (`derive.ts:254`) has no reader in any component: `grep -rn on-rail-bg src config tests` finds only its definition. It exists because `colours.test.ts:500` requires `measured` to equal `names.length * SURFACES.length`, so every surface needs an `--on-` pair. A token made only to satisfy a count is YAGNI, and the report presents it as a feature ("with `--on-rail-bg` beside it").
2. `src/lib/state/workbench/layout.svelte.ts:16-18` now breaks a sentence mid-way:
   ```
   // reader last acted in, where a view asked for lands, a view opened clear of one instance, the file
   // browser's ask, and the storage. None
   // of them holds a rune, so none of them is a second place an arrangement can change.
   ```
   The comment was not reflowed.
3. `tests/ui/theme.test.ts:217` is still named "the scrollbar tokens" / "are given on :root the values the default theme derives", but it now also checks `--accent-bg` and `--rail-bg`. The name was already partly stale before this round and got further from the truth.
4. Checked and clean:
   - ASCII.
   - Size and folder limits.
   - Head comment on the new `away.ts` ("Layer 2, client state").
   - No history in the new comments.
   - One element per line in the badge span (`RailPages.svelte:210-215`).
   - `dataBookmark` gone (`grep -n ookmark src/lib/ui/controls/ToolButton.svelte` prints nothing).
   - The Document.svelte and BookmarkStar.svelte comments corrected.

## Behaviour

1. The global text-colour change under light, vscode-light-modern, latte and tokyoneon (Spec 1). Every view's muted, accent and hue text is darker or shifted, not only the rail's.
2. Under vscode-dark-modern the rail badge is black text on `#0078d4`, measured `fg rgb(0, 0, 0)`. VS Code's theme sets `"activityBarBadge.foreground": "#FFFFFF"`. `contrastOn` picks black at 4.64 over white.
3. A rising Bookmarks list taller than the space above the star runs past the window's bottom (Proof 4). Not exercised.
4. Hide on the page on screen still leaves the page shown with no button in force. Ruled as kept (item 11), so it is not a finding here, only still true.

## Screenshots against VS Code

Taken with Playwright at 1280x800, 2x, from the served build, under light, dark, mocha, vscode-dark-modern and vscode-light-modern. The harness and config are in `$TMPDIR/l5r1shots` and the images in `$TMPDIR/l5r1shots/out` (`<theme>-rail`, `-badge`, `-hover`, `-bookmarks`, `-after-escape`, `-drag`, `-window`).

What they show:
- **Surfaces.** Light: rail `rgb(226,230,234)`, ground `rgb(241,245,249)`, pane white. Dark: rail `rgb(30,36,49)`, lighter than both the pane `rgb(18,26,43)` and the ground `rgb(11,17,32)`. Mocha: a translucent `rgba(13,13,21,0.76)` over the wallpaper.
- **Items and badges.** Every item is 48x48 with a 16x16 badge at x 24, y 72 relative to the window for the first badged item (x 30, y 79 under mocha), inside its item. The page in force is bright with a 2 px accent bar.
- **Tooltip.** The bubble is centred beside the item (y 109 for an item at 96-144) with a small triangle.
- **Bookmarks menu.** It rises from the star with its bottom level with the star's.
- **After Escape.** No tooltip; the 1 px accent focus frame shows on the star.
- **Drag.** An accent insertion line at the top of the target, the dragged item faded, and no tooltip.

Remaining visible differences from VS Code's activity bar:
- **Bar colour under VS Code's own themes.** Oculus: `#0c0c0c` (dark modern) and `#e9e9e9` (light modern). VS Code: `#181818` and `#F8F8F8`, the side bar's colour, set off by a 1 px border. Under light and dark, oculus's rail is a grey or slate strip distinct from both the ground and the panes. VS Code's Modern themes do not draw one.
- **Badge ink.** Black on the accent under light, dark and vscode-dark-modern. VS Code draws white.
- **Badge shape under mocha.** A square pill in the mono face, sitting under the stand-in, as ruled for terminal themes.
- **Item colours under vscode-dark-modern.** Muted `rgb(157,157,157)` and active `rgb(204,204,204)`. VS Code's theme sets `inactiveForeground #868686` and `foreground #D7D7D7`.
- **Focus frame.** Accent-coloured and drawn around the whole item. VS Code's focus border is its focus colour (blue). Kept as ruled.
- **Drag.** No image of the dragged icon follows the pointer; only the faded source and the insertion line show. VS Code shows the icon under the pointer.
- **Tooltip text.** The badge title is appended in brackets ("Academic Life, key 3 (1 undecided)"). VS Code writes the name and keybinding, then the badge text after a dash.
- **Arrow scope.** Also drawn on pane-strip compact menu tooltips (Spec 3).

## Not checked

- Axel's own Chrome and the TEST page (the orchestrator's look).
- A text scale above 1 for the badge's legibility, beyond the icon case.
- A window short enough for the Bookmarks menu to clamp.
- `openNextTo` on a view already open on the page.
- Dropping a catalogue entry on an edge of the catalogue's own pane.
- The eight themes I did not screenshot (the derived-token comparison covered all 17).
- DESIGN.md and HELP.md Doc text wording beyond the `--rail-bg` sentences.
- One of my commands wrote and deleted a file, `src/lib/themes/.derive-base-probe.ts`, in the same shell line. `git status --short` afterwards shows the same 38 entries as at the start (37 modified, `away.ts` untracked).

## Usage

Not measured. About 45 tool calls. The main costs were two whole node suite runs (about 110 s each), the browser suite in two halves (3.4 and 4.2 minutes), and four revert-check runs (the rail.spec one took 5:45).

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/L5-report.md`, "# Repair round 1", items 1 to 16):

- Spec 1, files outside the brief's paths: each forced by a boundary or named in the report; the paths are widened for this step and listed in the landing report.
- Spec 2 and Behaviour 5, Settings when no rail page holds it: opens on the page on screen, stated in the report and in `ActivityRail.svelte`.
- Spec 3, the refusal line: kept and stated; notifications (L6) take its place.
- Spec 4, badge colours: one colour, the accent, for every rail badge.
- Spec 7, the focus outline in the accent: kept as ruled.
- Proof 1 to 3 and 6: directives added for the renamed files.spec case and the Settings reveal; Shift+F10 on a catalogue entry and the absent BOOKMARKS group have browser cases.
- Proof 7, the click spot `GROUND`: correct on this layout; no change.
- Standards 1, `Document.svelte`: corrected, with `BookmarkStar.svelte` and a files.spec comment.
- Standards 3, `--accent-bg-txt`: removed from tokens, derive and tests.
- Standards 4, the badge span: one element per line.
- Behaviour 1, reorder by keyboard: the page button's menu (Shift+F10) reaches Settings, whose rail list moves an entry up or down; VS Code's activity bar reorders by drag alone.
- Behaviour 3 and 11, the page on screen off the rail: kept as ruled.
- Behaviour 4, a tooltip left up after a menu: `focusQuietly` and no tooltip during a drag, each with a case.
- Behaviour 7, the icon at a larger text scale: `--rail-icon: 24px`, fixed, with a case.
- The screenshot differences: one badge colour, the UI face, the tooltip arrow, the Bookmarks menu rising from the star, each with a case. The rail's own surface asked for in the round is replaced at landing (below).

The run over repair round 1, closed at landing on 2026-09-24:

- Spec 1, Spec 2 and Standards 1, the rail surface: `--rail-bg`, `--on-rail-bg`, `railSurface` and `RAIL_RATIO` are removed, so the text colours are what they were before the round under every theme. The rail is drawn in `--bg` with the 1 px `--line` border on its right edge, and over a wallpaper in the panel's colour at the panes' share: VS Code's Modern themes draw the activity bar in the side bar's colour with a border (`dark_modern.json` `#181818` / `#2B2B2B`, `light_modern.json` `#F8F8F8` / `#E5E5E5`), and oculus's `vscode-dark-modern` and `vscode-light-modern` now measure exactly those. The browser case asserts both colours under both themes, red under each of two reverts; the node case over the removed surface is gone with it.
- Spec 3 and 4, the tooltip arrow on every tooltip placed beside its control and `focusQuietly` in every `Menu`: kept, and stated in DESIGN.md.
- Spec 5, `openNextTo` moving a view already open elsewhere on the page: such a view is now activated where it is, as `openAway` leaves one; a browser case, red under its revert, asserts Settings stays above Pages after Open beside on this page.
- Spec 6, the fixed 9 px badge count: kept, stated in DESIGN.md as fixed with the item, as the icon is.
- Proof 1, the report's "4.79:1, the lowest" claim: false; the lowest `--on-accent` on `--accent` is `vscode-dark-modern` at 4.64:1. A record, no change.
- Proof 2, the duplicate `--on-accent` pair in the contrast test: removed; `tests/ui/colours.test.ts` measures it.
- Proof 4, a rising list taller than the space above: the list is capped at that space and scrolls (`MenuList.svelte`), with a case in a 200 px window, red under its revert.
- Proof 5, the badge size without a directive: `RailPages.svelte:268` now has one.
- Proof 6: `openNextTo` on an open view is covered (Spec 5). A drop on an edge of the catalogue's own pane opens a new pane beside it and leaves the catalogue shown; a browser case, red under its revert, is added at landing.
- Proof 7, `tests/server/watch/git.test.ts:679`: passed 22 of 22 in three runs alone on main and in both whole runs at landing.
- Standards 2, the comment in `layout.svelte.ts`: reflowed.
- Standards 3, the theme test's name: "the derived chrome tokens", its directive now on `--accent-bg`.
- Behaviour 2, black ink on the blue badge under `vscode-dark-modern` where VS Code draws white: kept. `--on-accent` is the black or white that reads better on the accent (4.64:1 against white's 4.53:1), the rule every filled chip follows; changing it for one theme would change every accent fill in it.
- Behaviour 3: closed by Proof 4.
- The verification note, the revert tool's "stopped by a signal" case: the race is closed in `bin/revert-check.mjs`. The signal handlers are installed before the copy's folder is made, so a signal that lands during the synchronous copy waits for it and removes the folder; the case keeps its revert on the handler line.
