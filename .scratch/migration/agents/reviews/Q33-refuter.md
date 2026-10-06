# Step Q33 refuter report (on .agents/worktrees/q33, base 84bc4dde)

**Incident during this review, not caused by the builder: two unintended writes outside q33.** The scratchpad directory is shared with other agents in this session. I made a scratch copy at `<scratchpad>/rev`, but a folder of that name already existed and belonged to someone else. Its `node_modules` was a symlink into d16.
- My `rsync -a` of q33's `tools/oculus` wrote over files in that folder. It deleted nothing, but whoever owns it now has q33 files mixed into their copy. It also now holds my `tests/browser/zw-measure.spec.ts`.
- My `ln -s` created a stray symlink in the d16 worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/d16/tools/oculus/node_modules/node_modules -> .../q33/tools/oculus/node_modules`. I tried to remove it and the permission check refused. It is still there and needs deleting by someone allowed to (`rm` on that one symlink).

Nothing was written in the q33 worktree or the main checkout. `git status --short` in q33 matches the list at the start of the review.

## Verification (rerun by the reviewer)
All commands were run from `tools/oculus` in q33:
- **Node tests:** `npx vitest run --reporter=dot` gave `Test Files 228 passed (228)`, `Tests 3811 passed (3811)`. The ssh flake did not occur.
- **`npm run check`:** `COMPLETED 1155 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- **`npm run build`:** exit 0.
- **`npm run format:check`:** `All matched files use Prettier code style!`
- **`npx eslint .`:** exit 0.
- **ASCII gate (the perl form):** printed nothing.
- **File lengths:** `find src tests bin -type f | xargs wc -l | sort -n | tail -3` gives `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`. Largest changed component is ActivityRail.svelte at 517 lines; RailList.svelte is 120.
- **Browser specs:** `npx playwright test` over shell-defects, rail, tabs, pages, keyboard, appearance and nested gave `41 passed (37.3s)`.
- **Whole browser suite:** `npx playwright test` gave `141 passed (3.3m)`. This covers the report's "not rerun after the last ToolButton change" line.
- **Report figures that reproduced:** the foot heights (300 to 233.34 px default, 338 to 270.80 px mocha) and the rename grep (hits only in pane-view.ts, PaneView.svelte, ui.yml, nested.spec.ts, paneview.test.ts, shell-defects.spec.ts).

Reviewer measurements were run on scratch copies built from the q33 tree and from q33 with `git diff 84bc4dde` reverse-applied (main). The probe specs were `zz-measure.spec.ts` and `zz-behave.spec.ts`, which exist only in those copies.

## 1. Spec
- **Premise, item 6 (tabs shrink): the builder is right, the brief was wrong.**
  - Main, 10 tabs, at 520, 720 and 1280 px: every `.tab` computed `flex-shrink: 1`, yet each label had `clientWidth == scrollWidth`. Tab widths are the same on main and q33 (Status 103, Projects 195, Coauthor 217, Memories 124 px).
  - The fragments are tabs cut at the strip's scroll edge. At 720 px the strip's left edge is at 133 and the Domains tab spans 116 to 233 on both trees.
- **Item 6 marked DONE, but the defect Axel saw is still there.** The scroll-edge fragments measure the same on q33 as on main (report, Limitations 1). The step closes the item without fixing that defect. The reason given for not snapping, that it collides with the "moves by one tab width +/-6" check in `tabs.spec.ts`, is not a stop: the spec rules let a selector or assertion change together with the markup.
- **What the 16-character cut does to a name that showed whole.**
  - On main, "game-engine manual" drew whole in a 194 px tab (label 132 px). On q33 it draws "game-engine manu..." in a 195 px tab (label 133 px), at 720 and at 1280 px alike.
  - The tab never shrinks (`src/lib/ui/Tabs.svelte:397-402`, `flex: 0 0 auto`), so the cut saves no width. It swaps the last two letters for three dots, even on a wide strip with room to spare.
  - The demo rail has one more such name, "Research approach" (17 characters), which would draw as "Research approac...". Page-strip tabs are cut by the same rule.
  - The brief's wording ("does not shrink below its label up to 16 characters") reads as a width floor with an ellipsis only when there is no room. The build cuts every label past 16 characters regardless of room. The brief booked the 16-character floor as a decision; the always-cut form is the builder's choice.
- **Premise, item 8 (a different tone): the builder is right, the brief was wrong.** Main, light theme: glyph toggle pressed alone gave `bg rgb(189, 93, 56)`, `color rgb(0, 0, 0)`; with CRT pressed too, both toggles gave the same values. Dark theme was the same. Under latte and mocha (terminal themes), pressed toggles on main already had no fill and an accent colour.
- **Item 8: a user-visible decision taken on a wrong premise.** `src/lib/ui/ToolButton.svelte:218-225` removes the fill from every pressed rail toggle under every non-terminal theme. A premise found wrong is a stop that goes to Axel. The builder instead restyled all three toggles and listed it as decision 7.
- **Premise, item 3 (rail entries under the foot on a terminal theme): not reproduced.** On main, at 800, 600 and 450 px, under light, mocha, synthwave, latte and gruvbox light:
  - the last entry's bottom is 8 px above the foot's top (e.g. 448 and 456);
  - a hit test at the centre of every foot button returns the foot button;
  - the last entry is reachable.
  
  Measured on the demo hub only; the real hub's Personal group docs are not drawn on the demo.
- **Item 1:** matches the brief. After picking a theme with the pointer, main leaves a "Theme" bubble showing and q33 shows none.
- **Items 2, 4, 5 and 7:** match the brief.
- **A substitute mechanism outside the diff's items:** none found.

## 2. Proof
- **`tests/browser/shell-defects.spec.ts:171-172` can never fail.** It asserts the last entry's bottom is at or above the foot's top after scrolling the list to its end. The entry sits inside a scroll box that ends above the foot, so this holds on any tree, and it held on main at every size and theme I measured. The test fails at main only on the fade lines. Item 3's "foot never covers an entry" has no test that can go red.
- **Revert: `onfocusin={focused}` back to `{show}`, keeping `onpointerdown={hide}`, in a scratch copy.** The two click tests at `:33` and `:47` turn red; the keyboard test at `:55` stays green. The keyboard test is a real guard: it goes red if focus stops showing the bubble.
- **Revert: remove `scrollbar-width: none` from `RailList.svelte`.** `:128` "keep no bar" turns red. It is a real guard for the risk the global rule adds.
- **Revert: remove `flex: 0 0 auto` from `.tab` (`Tabs.svelte:402`).** All 13 tests stay green. That line is unproven, and measurement says it changes nothing.
- **Revert: remove `.tool.rail-control.active :global(.label)` (`ToolButton.svelte:223-225`).** `:421` stays green. The accent colour on a pressed toggle's label has no test.
- **"One page offers neither item" (`:306`):** passes on main, where one page gave no per-page items either. It guards the "present only when it has a page to offer" rule, and `paneview.test.ts` covers the same rule. It proves little on its own.
- **Tab test (`:316-375`):** only the label-text line fails at main. The width-floor lines pass on main, so the brief's "rendered width not below its floor" test is a guard, not a reproduction.
- **Other checks:** no test asserts a defect, no predicate was widened (`glyph.test.ts` got stricter), and no module-level mutable state was added (`fade` and `opened` are component `$state`).

## 3. Standards
- **Tooltip head comment made false:** `src/lib/ui/Tooltip.svelte:2-3` still says "or as soon as it takes focus". Focus now shows the bubble only under `:focus-visible` (line 111). The `focusable` prop doc at `:37` ("its tooltip opens on focus") is equally stale for a wrapper focused by a click.
- **Misleading justification:** the comment at `src/lib/ui/Tabs.svelte:397-399` says "a strip of shrunken tabs is a row of fragments". The builder's own measurement, and mine, show tabs did not shrink on main.
- **Hand re-wrapping:** `src/lib/shell/ActivityRail.svelte`, the diff hunks at 317, 381 and 402, re-wrap existing comments with no text change. Prettier does not do this and no item asks for it.
- **Report narration** (spec.md: "No narration of wrong turns"): the report's item 4 row says "that check was added after a screenshot of the build showed `[-] []<<[] [+] ]` overflowing"; the last limitation describes a scratch copy "has been removed".
- **HELP.md Doc text:**
  - Line 15 replacement: true of the tree.
  - Pane-menu line: true, though "fold" is offered only inside a split.
  - Tab-names line: true.
  - Palette line: true.
  - Line-7 addition: "Every scrolling box draws a thin scrollbar in the theme's colours" is false for the rail list and the tab strip, which draw no bar.
- **DESIGN.md Doc text:**
  - Line 225 replacement: true (`derive.ts:626-629`, `+layout.svelte:993-996`).
  - New decision line: true of the tree, but it does not say that Escape in a nested list closes the whole menu.
  - Existing DESIGN.md lines 283 and 292: not made false.
  - README.md: none of the grepped names appear in it.
- **Grepped names:**
  - `move_to_page`, `embed_page`, `pageMoveItems`, `embedPageItems`: still read by `pageListItems`.
  - `crt_on`, `ui.unicode`: read only by RailAppearance and specs.
  - `update_tasks`: still read by `UpdateTray.svelte:122,124` and `tasks.spec.ts:28`.
  - `text_reset`: read by `appearance.spec.ts:34`.
  - `rail-control`: `type-scale.test.ts` passes.
- **Other checks:** no catalog string missing, no raw control or raw hex, no non-ASCII, no dated comments or package ids in comments, and `ui/Menu.svelte` importing `$lib/state/text` passes `boundaries.test.ts`.

## 4. Behaviour
- **Pressed rail toggles, non-terminal themes (the report states only "no fill").**
  - Light, before: an orange block `rgb(189, 93, 56)` with a black glyph. After: no fill, glyph and label `rgb(173, 85, 51)`, border `rgb(189, 93, 56)`.
  - Dark, before: the same orange block. After: glyph and label `rgb(206, 122, 89)` on the rail's background.
  - Terminal themes: unchanged except the label now takes the accent colour.
  
  Pressed and unpressed now differ only by a thin border and the glyph's colour.
- **Escape in a nested list (stated in decision 6):** q33, keyboard path from the pane menu's opener, into "Move tab to page...", focus on Back, then Escape. The menu closes, focus goes to the opener, and the opener's "Pane" bubble shows. Not stated: there is no key that goes back; only the Back entry does.
- **Keyboard stop order at the foot (the report states only that the stop hand-off changed).**
  - Main, ArrowDown from text-smaller: text-larger, text-reset, crt.
  - q33: text-reset, text-larger, crt.
  - In q33 the three steps are drawn side by side (`text-smaller@4,674`, `text-reset@34,674`, `text-larger@65,674`, 28x34 each). ArrowRight and ArrowLeft do nothing (focus stays on text-smaller) and ArrowDown moves right along the row, so the arrow a reader expects for a visual row does not work.
- **Tab tooltip text (not stated with before and after).**
  - Main, bookmark tab: "Document". q33: "game-engine manual | Document".
  - Every tab with its own label, short or long, now repeats its name before the view name (`PaneView.svelte:108-109`).
  - A preview tab's tooltip changed from "The next single click replaces this tab; double-click to keep it." to "<label> | The next single click ...".
  - A cut tab's accessible name is its label alone (`Tabs.svelte:265`), so any badge text drops out of it. An uncut tab's name still includes the badge.
- **Hover after a click (not stated):** the bubble does not come back while the pointer stays on the control. It returns only after the pointer leaves and re-enters.
- **16-character cut (not stated):** it removes characters from names that fit whole at every width measured, while the fragments the reader reported are unchanged.
- **Scrollbar tokens (limitation 4 of the report):** they are set only when the theme is applied. Before that, and on the server-rendered first paint, every box draws the browser's default bar. Not measured visually.

## Not checked
- The real hub on port 8787: the Personal group docs under a terminal theme, where the item-3 overlap was reported.
- Visual contrast of the unfilled pressed toggles and of the Back entry.
- The fade over a wallpaper.
- Text scales other than 1.
- Scrollbar drawing inside terminal and editor panes.
- The seven-page pane-menu list near the window's bottom edge.

Reviewer usage: about 50 tool uses, about 20 minutes (15:26 to 15:46).
