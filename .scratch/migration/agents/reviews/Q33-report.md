Everything in the brief is done. Two of its premises turned out wrong (items 6 and 8, see "Wrong in the brief"), and the part of item 3 about entries under the foot under a rice theme does not reproduce as a geometric overlap on the demo. Each is stated below with the measurement behind it.

## DONE / NOT DONE

All commands were run from `tools/oculus` in the worktree `.agents/worktrees/q33`, against the final tree.

| Item | State | Proof (command, output) |
|---|---|---|
| 1 Tooltips put away on a press | DONE | `npx playwright test tests/browser/shell-defects.spec.ts`: "a click on a rail entry leaves no bubble, and hovering again shows it" and "a click on a tab leaves no bubble" pass. Against a copy of main's src (same spec) both failed: `Expected: 0 Received: 1`. |
| 2 Scrollbars in the theme | DONE | "a scrolling view draws a thin bar in the theme tokens, light and dark" passes; at main it failed with `Expected: "thin" Received: "auto"`. "the rail list and the tab strip keep no bar" passes (a guard; it also passed at main). |
| 3 The rail list | DONE, with the limit below | "under the default theme / under a terminal theme the list fades where it goes on and no entry sits under the foot" pass; at main both failed on `[data-fade="below"]` not found. The last-entry-under-the-foot assertion also held at main at 800 px, so it does not reproduce (see Limitations). |
| 4 The rail foot labelled | DONE | "every foot control carries its visible name, and no two share a glyph" passes; at main it failed on the first visible name. It also asserts the three rice text steps fit their boxes with no `::before`; that check was added after a screenshot of the build showed `[-] []<<[] [+] ]` overflowing. |
| 5 The pane menu | DONE | "a layout of seven pages adds two items, each opening its page list with Back" passes; at main it failed with `Expected: 6 Received: 16`. "one page offers neither item" passes (a guard). |
| 6 Tabs keep their names | DONE as the brief states it; its premise is wrong | "with ten tabs open a label keeps 16 characters and a longer one ends in an ellipsis" passes; at main it failed with `Expected: "game-engine manu..." Received: "game-engine manual"`. |
| 7 The palette | DONE | "an empty query lists the views alone, each row its kind then its label" passes; at main it failed with `row.first` empty. |
| 8 The two theme defects | DONE; the premise about tone is wrong | "under the light theme the glyph toggle and the CRT toggle draw one tone, and no fill" passes; at main it failed with `Expected: "rgba(0, 0, 0, 0)" Received: "rgb(189, 93, 56)"`. The rice case is the terminal-theme test of item 3. |
| Tests 1: browser spec per item | DONE | `tests/browser/shell-defects.spec.ts` (446 lines, 13 tests). Final run of the new spec plus rail, tabs, pages, keyboard, appearance, nested, icons, views and layout: `53 passed (40.2s)`. |
| Tests 2: node tests for pure parts | DONE | `npx vitest run --reporter=dot`: `Test Files 228 passed (228)`, `Tests 3811 passed (3811)`. |
| Tests 3: selectors kept or specs changed | DONE | Changed with the markup: `nested.spec.ts` (clicks "Show a page here..." before a page; the last case also asserts that item is absent), `keyboard.spec.ts:262` (the stop now passes from text reset to `text-larger`, since the row order is smaller, reset, larger), `rail.spec.ts:145` (button `t('app.update')`). Node string audits changed too: `tests/shell/rail.test.ts` (foot names are visible labels, not aria-labels), `tests/shell/workbench.test.ts` (tab tooltip is now "Pinned session \| Status"), `tests/ui/glyph.test.ts` (bracket rule also excludes `.rail-control`). |
| Tests 4: reverts named | DONE | Listed under "Reverts" below. |
| Verify 1 `npm test` | PASS | `228 passed`, `3811 passed` |
| Verify 2 `npm run check` | PASS | `COMPLETED 1155 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 3 `npm run build` | PASS | exit 0 |
| Verify 4 `npm run format:check` | PASS | `All matched files use Prettier code style!` |
| Verify 5 `npm run lint` | PASS | exit 0, no findings |
| Verify 6 ASCII gate (the perl form) | PASS | 0 lines printed |
| Verify 7 file lengths | PASS | tail: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts` |
| Verify 8 browser specs | PASS | Listed and neighbouring specs on the final build: `53 passed`. The whole suite `npx playwright test` gave `141 passed (2.8m)` one build earlier; the only change since is the rice-bracket selector in ToolButton, whose affected specs (rail, icons, focus-buttons, shell-defects) passed at `25 passed` on that build. |

**Reverts that turn a test red:**
- **Tooltips:** `onpointerdown={hide}` and `onfocusin={focused}` → `onfocusin={show}` in `ui/Tooltip.svelte` turns both click tests red.
- **Scrollbars:** removing the `:global(*)` rule in `routes/+layout.svelte` turns the scrollbar test red. Removing the two tokens from `derive.ts` turns "the scrollbar tokens" in `tests/ui/theme.test.ts` red.
- **Rail list:** replacing `<RailList>` with a plain `.views` div turns both rail-list tests red. Changing `listFade` turns "the fades of the rail list" in `tests/shell/rail.test.ts` red.
- **Foot:** removing `stacked` from a foot control, or putting `glyph="refresh"` back on text reset, turns the foot test red.
- **Pane menu:** putting `...elsewhere, ...shows` back into PaneView's items turns the seven-page test red. Removing `menuLevel` or `pageListItems` turns the new node describes in `tests/shell/paneview.test.ts` red.
- **Tabs:** drawing `{tab.label}` instead of the `labelHead` form turns the tab test and "a tab label past the floor" in `tests/ui/primitives.test.ts` red.
- **Palette:** `return [...index]` in `match` turns the palette spec and the three new `match` cases red. Removing the kind span turns the palette spec red.
- **Toggle tone:** removing `.tool.rail-control.active` turns the toggle test red.

## Wrong in the brief

1. **Item 6 premise.** The brief says `.tab` sets no `flex-shrink`, so tabs shrink and labels are cut. On main they do not shrink: a flex item's automatic minimum is its min-content width, and the label is `nowrap`.
   - Measured on a main copy with 10 tabs at 1280 px, then split at 800 px: every label had `clientWidth == scrollWidth` (e.g. "Memories:62/62").
   - The fragments in the screenshot are tabs cut by the strip's scroll position at its two edges: a sliver of a tab beside the scroll controls.
   - What I built is the brief's shape: `.tab { flex: 0 0 auto }`, and a label longer than 16 characters drawn as its first 16 plus the catalog's `ui.tab_cut` (`'{0}...'`), with the whole name as the tab's `aria-label` and in its tooltip.
   - The edge slivers remain (see Limitations). Snapping to whole tabs is the likely fix, but it collides with `tabs.spec.ts`'s "moves by one tab width ±6", so I did not do it.
2. **Item 8 premise.** The brief says the glyph toggle draws a different tone from the CRT toggle. It does not: under the light theme with both pressed, both computed `background rgb(189, 93, 56)`.
   - The orange is the filled active state, main `src/lib/ui/ToolButton.svelte:209-213`: `.tool.active { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }`, with `--accent: #bd5d38` at `src/lib/themes/tokens.css:18`.
   - The state file's observation fits a stored `unicode: true` (pressed under a rice theme) showing as a solid orange block on the light theme.
   - The fix is at that rule: `.tool.rail-control.active` draws no fill, with its glyph, name and border in the accent. So the CRT, Wallpaper and Glyphs toggles look the same under every theme, and match what rice already did.
3. **Item 3, rice.** On the demo at 800 px under default, mocha, nord, latte and synthwave, and at 600 px under synthwave, no entry's box overlapped the foot with the list scrolled to its end (e.g. mocha: last entry bottom 448, foot top 456). What the state file describes matches an entry cut at the list's clipping edge right above the borderless rice foot. The fade now marks that edge.

## Doc text (not applied; lines for the orchestrator)

HELP.md:
- **Line 15, replace** "…and at the foot of the rail the appearance controls: the theme list, the two text-size steps and the reset, the CRT overlay, the wallpaper where the theme has one, and the toggle between the glyph vocabulary and its ASCII stand-ins." **with** "…and at the foot of the rail the appearance controls, each drawn with its name under its glyph: Search, Update, Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Glyphs, the toggle between the glyph vocabulary and its ASCII stand-ins. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it."
- **New line after line 29** ("- **Show a page.** …"): "- **The pane menu.** Close, maximise or restore, fold, split right and split down, and two choices that open a list of pages in place of the menu, Move tab to page... and Show a page here..., each offered only when there is a page to offer, with Back first in the list."
- **New line after the line above:** "- **Tab names.** A tab keeps its width when the strip overflows, and the strip scrolls with its two controls. A name longer than sixteen characters is drawn as its first sixteen and an ellipsis; the tooltip carries it whole."
- **New line after line 7** ("Down the left is the rail. …"): "A control's tooltip opens when the pointer rests on it and when the keyboard brings the focus to it; a click puts it away. Every scrolling box draws a thin scrollbar in the theme's colours."
- **New line after line 60** ("Tab and Shift-Tab are the browser's: …"): "Cmd-K opens the palette. With nothing typed it lists the views; a word typed searches the projects, the collection entries and the feed entries as well. Each result names what it is, View, Project, Collection or Feed, before its title."

DESIGN.md:
- **Line 225, replace** "…The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. Primitives use tokens only; a raw hex in a component is a test failure." **with** "…The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. `derive.ts` also derives the two scrollbar colours for every theme, `--scroll-thumb` halfway between `--muted` and `--line` and `--scroll-track` the panel, and one rule in the page root draws every scrolling box's thin bar in them. Primitives use tokens only; a raw hex in a component is a test failure."
- **Line 283** (dated decision "every control has an immediate tooltip") is a log entry and stays. **New line after line 322** (the last decision line): "- 2026-09-16, the shell's defects seen on the page. A pointer press puts a tooltip away and a focus shows one only when `:focus-visible` holds, so a click never leaves a bubble over what it opened. The rail's list is `shell/RailList.svelte`: it fills the height above the foot and draws a fade at an edge with more past it, from `listFade` in `shell/rail.ts` over the list's scroll numbers. The foot's controls are stacked with a visible name, the three text steps one row under one name, and text reset draws `note_back`. A rail toggle that is on draws no fill, only the accent. A `MenuItem` may carry `items`: picking it shows them in `ui/Menu.svelte` in place of the menu's list after a Back choice (`menuLevel` in `ui/menu-items.ts`), which is how the pane menu offers its per-page moves and shows as two choices (`pageListItems` in `shell/pane-view.ts`). A tab never shrinks, and a label past `LABEL_FLOOR` (16, `ui/tab-strip.ts`) is drawn cut with `ui.tab_cut` and named whole. The palette's rows draw their kind in words, and an empty query lists the views alone."

## Files changed (lines added / removed, from `git diff --numstat`)

- **New:** `src/lib/shell/RailList.svelte` (120), `tests/browser/shell-defects.spec.ts` (446)
- **Config:** `config/text/app.yml` +6/-0, `config/text/ui.yml` +8/-3
- **Shell:** `src/lib/shell/ActivityRail.svelte` +20/-36 (now 517 lines), `src/lib/shell/Palette.svelte` +4/-1, `src/lib/shell/PaneView.svelte` +14/-11, `src/lib/shell/RailAppearance.svelte` +66/-37, `src/lib/shell/pane-view.ts` +33/-2, `src/lib/shell/rail.ts` +21/-0
- **State and themes:** `src/lib/state/palette.ts` +17/-2, `src/lib/themes/derive.ts` +19/-0
- **UI:** `src/lib/ui/Menu.svelte` +58/-6, `src/lib/ui/Tabs.svelte` +12/-1, `src/lib/ui/ToolButton.svelte` +17/-3, `src/lib/ui/Tooltip.svelte` +14/-2, `src/lib/ui/menu-items.ts` +18/-2, `src/lib/ui/tab-strip.ts` +24/-3
- **Routes:** `src/routes/+layout.svelte` +9/-0
- **Browser specs:** `tests/browser/keyboard.spec.ts` +4/-3, `tests/browser/nested.spec.ts` +10/-5, `tests/browser/rail.spec.ts` +1/-1
- **Node tests:** `tests/shell/paneview.test.ts` +79/-0, `tests/shell/rail.test.ts` +70/-24, `tests/shell/workbench.test.ts` +2/-2, `tests/state/palette.test.ts` +34/-0, `tests/ui/glyph.test.ts` +2/-1, `tests/ui/primitives.test.ts` +49/-1, `tests/ui/theme.test.ts` +26/-0

Rename grep (`grep -rn "move_to_page\|embed_page\|pageMoveItems\|embedPageItems\|pageListItems" src tests config HELP.md DESIGN.md README.md`): hits only in `pane-view.ts`, `PaneView.svelte`, `ui.yml`, `nested.spec.ts`, `paneview.test.ts` and `shell-defects.spec.ts`, all carried. `grep` for `update_tasks|crt_on|ui.unicode'|ui.wallpaper'|text_reset`: the remaining readers are the update tray dialog (still "Update tasks") and specs that locate by the same keys, which still resolve.

## Foot height (`nav.rail .controls` box height, window 1280x800, demo hub)

- **Before (main build):** 300 px under the default theme, 338 px under mocha.
- **After:** 233.34 px under the default theme, 270.80 px under mocha.

## Decisions the orchestrator may reverse

1. **Foot names:** `ui.crt_on`, `ui.wallpaper` and `ui.unicode` now read CRT, Wallpaper and Glyphs; new keys `app.update: Update` and `app.text: Text`. The Update button's accessible name is "Update"; "Update tasks" stays the tray's title.
2. **Tab cut is by characters, not width:** it counts graphemes through `Intl.Segmenter`. The ellipsis is three ASCII dots from `ui.tab_cut`, because a CSS `ch` cap left 18-character labels whole (measured: "game-engine manual" is 132 px against a 16ch box of 136 px).
3. **Tab tooltips carry the whole name** (`ui.tab_hint: '{0} | {1}'`), composed in `PaneView`: an own-labelled tab reads "name | view name", and a preview tab reads "name | preview words".
4. **Scrollbar tokens are derived, not authored:** `derive.ts` gives the thumb halfway between `--muted` and `--line`, and the track as `--panel`, set on the root like the `-txt` tokens. Before `applyTheme` runs, the bar is the browser's own.
5. **Fade drawing:** the fade is a 28 px overlay gradient of `--bg`, or of `--panel` at `--wall-panel` opacity over a wallpaper. It uses `background-image`, which `tests/ui/colours.test.ts` does not check; the only colours are surface tokens. A CSS mask was not used, because it would hide the group flyout's fixed list drawn inside the list.
6. **Menu nesting is generic:** `MenuItem.items` works for any menu, with a Back choice drawn by `Menu.svelte` from `ui.menu_back`. Escape closes the whole menu rather than going back.
7. **Pressed rail toggles:** no fill, and the glyph, border and name are in `--accent-txt` under every theme.
8. **Rice brackets:** the terminal-palette brackets are no longer drawn around any `.rail-control`, stacked or not.
9. **New `RailList.svelte`:** split out of `ActivityRail.svelte` to keep that component near 500 lines.

## Limitations

- Tabs cut by the strip's scroll position at its edges, which is what the reader saw as fragments, still show (see "Wrong in the brief" 1).
- The overlap of rail entries and the foot under a rice theme was not reproduced as geometry on the demo. The test asserts it holds, and it held at main too.
- The keyboard-focus tooltip test, the no-bar test and the one-page pane menu test are guards; each passes at main as well.
- The scrollbar track is an opaque panel colour, so over a wallpaper a scrolling box's thin track is not translucent. Not measured visually beyond the dark/light spec.
- The text-reset stop hand-off now lands on text larger rather than CRT.
- The stacked Menu opener (Theme) keeps its fixed 34 px height; its label fits at text scale 1. Larger text scales were not measured.
- The whole browser suite (141) was not rerun after the last ToolButton selector change; the ten specs above were (53 passed).
- A scratch copy of main's src, used to show each test failing at main, was built under the scratchpad and has been removed.


# Repair round 1

Everything in repair round 1 is done. The only departure from a ruling is item 1: the strip hides the one tab its far edge crosses, a mechanism the ruling does not name (reason and reversal under decision D1).

The node suite was red on two runs before a clean one, each time on one timing test in an untouched file:
- `tests/server/git.test.ts` timed out at 5000 ms in the run after the full browser suite.
- `tests/server/hpc/ssh.test.ts`'s SIGTERM-budget case failed in the next run.
- Load average was 18.29 when measured (`uptime`).
- The two files run alone: `Test Files 2 passed`, `Tests 36 passed`. The third full run: `229 passed`, `3831 passed`.
- `git diff HEAD -- tests/server src/lib/server` is empty.

## Items

| # | Item | State | Proof |
|---|---|---|---|
| 1 | Tabs: cut removed, strip rests on whole tabs | DONE | `LABEL_FLOOR`, `labelHead`, `ui.tab_cut`, `ui.tab_hint`, the `aria-label` change and `flex: 0 0 auto` are gone; `Tabs.svelte`, `tab-strip.ts`, `workbench.test.ts` and `primitives.test.ts` restart from main. Browser test "an overflowing strip rests on whole tabs after each scroll control and a wheel" passes; node tests: `tests/ui/tab-strip.test.ts`, 16 pass. |
| 2 | Pressed rail toggle draws a tinted surface | DONE | Two browser tests "under the light theme / under a terminal theme a pressed toggle fills with the accent tint and names itself in the accent text" pass. The contrast test measures `--accent-txt` on `--accent-bg` in all 17 themes. |
| 3 | Overlap assertion named an audit | DONE | Split into "under X the list fades at an edge with more entries past it" (proof) and "audit: under X the last entry, scrolled to, ends above the foot". |
| 4 | Text row arrow keys | DONE | Browser test "left and right move along the Text row, up and down leave it" passes; 7 node cases in `tests/shell/activity-rail.test.ts` pass. |
| 5 | Stale comments | DONE | `Tooltip.svelte` head comment and `focusable` doc rewritten. The three `ActivityRail.svelte` comment hunks match main word for word; `git diff -U0` hunks are now only the import, the stop order, `<RailList>` open and close, and the `.ring` and `.views` styles. |
| 6 | Tooltip returns after leave and re-enter | DONE | Kept as it was. Stated in `Tooltip.svelte`'s head comment, under Behaviour and in the Doc text. |
| 7 | First-paint token defaults | DONE | `tokens.css` `:root` sets `--accent-bg: #e6d6d2`, `--scroll-thumb: #a3aebd`, `--scroll-track: #fff`. The node test "are given on :root the values the default theme derives, for the first paint" compares all three to `applyTheme('light')`. |
| 8 | Doc text | DONE | Below. |
| 9 | Behaviour before and after | DONE | Below. |

## Verification (all from `tools/oculus` in the q33 worktree)

1. `npx vitest run --reporter=dot`: `Test Files 229 passed (229)`, `Tests 3831 passed (3831)`.
2. `npm run check`: `COMPLETED 1156 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0.
6. The ASCII gate (perl form): 0 lines.
7. `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`. Largest changed component is `Tabs.svelte`, 585 lines.
8. `npx playwright test`, the whole suite on the final build: `145 passed (3.3m)`.

## Reverts per new or changed test

Reverts A, B and C were applied together in one scratch copy, and D and E together in a second; each copy was built and `shell-defects.spec.ts` run on it. Both copies are removed.
- **Revert A:** delete the `opacity: 0; pointer-events: none` body of `.tab.cut` in `Tabs.svelte`. Result: "an overflowing strip rests on whole tabs..." red (`whole: false`).
- **Revert B:** delete `.tool.rail-control.active :global(.label)` in `ToolButton.svelte`. Result: both pressed-toggle tests red (`crt.name` `rgb(95, 111, 133)` against `rgb(149, 73, 44)` on light; `rgb(144, 148, 169)` against `rgb(245, 169, 127)` on mocha).
- **Revert C:** `ringKeys` back to `nextStop(..., 'column')`. Result: "left and right move along the Text row..." red (text-reset not focused after ArrowRight).
- **Revert D:** `scrollOne` back to one first-tab width, and the settle timer removed. Result: the whole-tab test red (`whole: false`).
- **Revert E:** unrevert A, B, C in that copy. Result: the other 16 tests stayed green.

Reverts named but not run in a copy:
- `tests/ui/tab-strip.test.ts` goes red if `tabEdgeStep`, `tabEdgeRest`, `revealOffset` or `cutTabs` return the unsnapped offset or an all-false mask.
- `tests/shell/activity-rail.test.ts` arrow cases go red if `railStop` is replaced by `nextStop` over the flat ring.
- The first-paint test in `tests/ui/theme.test.ts` goes red if any of the three `:root` lines in `tokens.css` is removed or changed.
- The contrast pair goes red for a theme where `everywhere(accent, tint)` in `derive.ts` loses the tint argument. Computed with the tint: ratios 4.51 (gruvboxlight) to 6.60 (rosepine). Without it the current test still passes, since that pair is new. Not run.
- `tabs.spec.ts`'s changed assertion goes red if `scrollOne` is reverted to the one-width scroll, whenever the first tab and the tab it lands on differ in width. Not run in a copy.
- `keyboard.spec.ts:262` (stop passes to text-larger) and `nested.spec.ts` (the list choice) are unchanged from round 0.

## Behaviour: every user-visible change, before (main) and after

- **Tooltip after a press.**
  - Before: a click focused the control and its bubble stayed while it held focus; picking a theme left a "Theme" bubble.
  - After: a press hides the bubble. It returns only after the pointer leaves and rests on the control again (as VS Code does). Keyboard focus (`:focus-visible`) still shows it.
- **Scrollbars.**
  - Before: every scrolling box drew the browser's default light bar on every theme.
  - After: every box draws a thin bar, thumb halfway between `--muted` and `--line`, track the panel, set for all 17 themes and on `:root` for the first paint. The rail list and the tab strip draw no bar.
- **Rail list.**
  - Before: the list was cut at its bottom edge with no sign it scrolled.
  - After: it fills the height above the foot, with a 28 px fade at the top or bottom edge while more entries are past that edge (none at the ends). The bottom fade is visible at 800 px on the demo under light and mocha.
- **Rail foot.**
  - Before: glyphs alone, names in tooltips, update and text reset both drew `refresh`. Keyboard order was smaller, larger, reset, and ArrowDown walked them.
  - After:
    - each control draws its glyph over a visible name: Search, Update, Theme, CRT, Wallpaper, Glyphs;
    - the three text steps sit in one row under "Text" in the order smaller, reset, larger, and text reset draws `note_back`;
    - ArrowLeft and ArrowRight move along the row and stop at its ends; ArrowDown and ArrowUp leave it, entering it from above or below at its first step.
  - The Update button's accessible name changed from "Update tasks" to "Update".
  - Foot height at 1280x800: 300 to 233.34 px (default theme), 338 to 270.80 px (mocha). Measured before the tint change, which does not change heights.
- **Pressed rail toggle.**
  - Before: light and dark themes drew a solid accent block with a black glyph; terminal themes drew no fill and an accent glyph.
  - After, every theme: a fill of `--accent-bg` (20% accent into the page), a 1 px accent border, and glyph and name in `--accent-txt`. Light: fill `#e6d6d2`, text `#95492c`, ratio 4.56. Mocha: fill `#443537`, text `#f5a97f`, ratio 6.00.
  - Unpressed toggles keep a transparent fill.
  - Side effect: `--accent-txt` is now made readable on that tint first, which darkens it slightly where the old value fell short on the tint. Light `#ad5533` to `#95492c`; vscode-light-modern `#005fb8` to `#0059ad`; latte `#b64300` to `#a23b00`; gruvboxlight `#af3a03` to `#a43602`; dark `#ce7a59` to `#cd7959`; vscode-dark-modern `#008ffc` to `#0893fe`. The other eleven themes are unchanged. This colours every accent-coloured text in the app, not only the rail.
- **Terminal-theme brackets.** Rail controls no longer draw the `[ ]` pair. Before, the foot's glyph-only controls drew `[ glyph ]`; after, the stand-in draws alone.
- **Pane menu.**
  - Before: one "Move tab to <page>" and one "Show <page> here" per page (16 items at seven pages on a root pane).
  - After: the fixed items plus "Move tab to page..." and "Show a page here...", each only when it has a page to offer (6 items at seven pages). Picking one replaces the list with Back and the same per-page items as before.
  - Escape anywhere, the nested list included, closes the whole menu and returns focus to the opener, which then shows its "Pane" bubble. No key goes back; only the Back entry does.
- **Tab strip.**
  - Before: scroll controls moved by the first tab's width, the wheel stopped anywhere, and revealing the active tab used `scrollIntoView` nearest, so tabs were sliced at both edges.
  - After:
    - a control moves the left edge to the next tab's start (or the strip's end);
    - a wheel or trackpad scroll settles 120 ms after it stops on the next tab edge in the direction it moved;
    - the active tab, and a tab reached with the arrow keys, is brought in whole;
    - the one tab the far edge still crosses is not drawn (opacity 0, no pointer) and stays in the tab list and the focus order.
  - Tab names, tooltips and accessible names are as on main.
- **Palette.**
  - Before: every row was a lone button in the 5rem column, and an empty query listed every view, project, collection entry and feed entry.
  - After: each row draws its kind in words (View, Project, Collection, Feed), then the label button filling the row. An empty query lists the views alone; typing a word adds the rest.

## Decisions the orchestrator may reverse

1. **D1, hiding the edge tab.** The strip hides the one tab its far edge crosses. With tabs of unequal width, resting on a tab edge can make only one edge whole, and the ruling's test requires no cut at either edge. Reversal: drop `.tab.cut`; the left edge is then always whole and the right edge may cut a tab.
2. **Settle timing and direction.** The strip settles 120 ms after the last scroll event, in the direction last moved, so a small wheel nudge moves a whole tab.
3. **The tint.** `--accent-bg` is 20% accent mixed into `--bg`, not into the rail's translucent panel over a wallpaper. Terminal themes take the fill and a 1 px accent border too.
4. **`--on-accent-bg`.** It is derived only so the colours test's surface rule covers `--accent-bg`; nothing paints with it.
5. **Arrow rule.** The row does not wrap under Left and Right. Entering the row from above or below lands on its first step in the ring.

## Doc text

**HELP.md**
- **Line 15, replace** "…and at the foot of the rail the appearance controls: the theme list, the two text-size steps and the reset, the CRT overlay, the wallpaper where the theme has one, and the toggle between the glyph vocabulary and its ASCII stand-ins." **with** "…and at the foot of the rail the appearance controls, each drawn with its name under its glyph: Search, Update, Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Glyphs, the toggle between the glyph vocabulary and its ASCII stand-ins. A toggle that is on is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. In the Text row the left and right arrows move along the row, and the up and down arrows leave it."
- **New line after line 7** ("Down the left is the rail. …"): "A control's tooltip opens when the pointer rests on it and when the keyboard brings the focus to it. A click puts it away, and it comes back once the pointer has left the control and rested on it again. Every scrolling box draws a thin scrollbar in the theme's colours, except the rail's list and the tab strips, which draw none and scroll by wheel, trackpad and their own controls."
- **New line after line 29** ("- **Show a page.** …"): "- **The pane menu.** Close, maximise or restore, fold where the pane sits in a split, split right and split down, and two choices that open a list of pages in place of the menu, Move tab to page... and Show a page here..., each offered only when there is a page to offer. Back, first in the list, returns to the menu; Escape closes the whole menu."
- **New line after the line above:** "- **Tabs past the strip's width.** The strip scrolls rather than shrinking its tabs, and it rests only on whole tabs: its two controls move to the next tab's edge, a wheel or trackpad scroll settles on a tab's edge when it stops, and the tab being shown is brought in whole. A tab the far edge would cut is not drawn until the strip moves to it."
- **New line after line 60** ("Tab and Shift-Tab are the browser's: …"): "Cmd-K opens the palette. With nothing typed it lists the views; a word typed searches the projects, the collection entries and the feed entries as well. Each result names what it is, View, Project, Collection or Feed, before its title."

**DESIGN.md**
- **Line 225, replace** "…The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. Primitives use tokens only; a raw hex in a component is a test failure." **with** "…The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. `derive.ts` also derives three surfaces for every theme: `--accent-bg`, a fifth of the accent in the page's colour, which a pressed toggle in the rail fills with and on which `--accent-txt` is made readable first; and the scrollbar's `--scroll-thumb`, halfway between `--muted` and `--line`, and `--scroll-track`, the panel. `tokens.css` gives the three the default theme's derived values on `:root`, so the first paint draws them before a theme is applied. One rule in the page root draws every scrolling box's thin bar in the two scrollbar tokens. Primitives use tokens only; a raw hex in a component is a test failure."
- **New line after line 322** (the last decision line): "- 2026-09-16, the shell's defects seen on the page. A pointer press puts a tooltip away and a focus shows one only when `:focus-visible` holds, so a click never leaves a bubble over what it opened; the bubble returns once the pointer has left the control and rested on it again. The rail's list is `shell/RailList.svelte`: it fills the height above the foot and draws a fade at an edge with more past it, from `listFade` in `shell/rail.ts` over the list's scroll numbers. The foot's controls are stacked with a visible name, the three text steps one row under one name, answering the left and right arrows inside the row and the up and down arrows to leave it (`railStop` in `shell/rail.ts`), and text reset draws `note_back`. A rail toggle that is on fills with `--accent-bg`, draws its border in the accent and its glyph and name in `--accent-txt`, under every theme. A `MenuItem` may carry `items`: picking it shows them in `ui/Menu.svelte` in place of the menu's list after a Back choice (`menuLevel` in `ui/menu-items.ts`), and Escape closes the whole menu from either list; this is how the pane menu offers its per-page moves and shows as two choices (`pageListItems` in `shell/pane-view.ts`). An overflowing tab strip rests only on whole tabs: a scroll control moves to the next tab's edge, a free scroll settles on the next edge in the direction it moved, the shown tab is revealed whole, and the one tab the far edge still crosses is not drawn, all by `tabEdgeStep`, `tabEdgeRest`, `revealOffset` and `cutTabs` in `ui/tab-strip.ts`; tab names are drawn whole. The palette's rows draw their kind in words, and an empty query lists the views alone."

## Files changed (lines added / removed)

- **New:** `src/lib/shell/RailList.svelte` (120), `tests/browser/shell-defects.spec.ts` (555), `tests/ui/tab-strip.test.ts` (111).
- **Config:** `config/text/app.yml` +6/-0, `config/text/ui.yml` +6/-3.
- **Shell:** `src/lib/shell/ActivityRail.svelte` +16/-31, `src/lib/shell/Palette.svelte` +4/-1, `src/lib/shell/PaneView.svelte` +8/-8, `src/lib/shell/RailAppearance.svelte` +66/-37, `src/lib/shell/pane-view.ts` +33/-2, `src/lib/shell/rail.ts` +51/-0.
- **State and themes:** `src/lib/state/palette.ts` +17/-2, `src/lib/themes/derive.ts` +37/-1, `src/lib/themes/tokens.css` +6/-0.
- **UI:** `src/lib/ui/Menu.svelte` +58/-6, `src/lib/ui/Tabs.svelte` +110/-8, `src/lib/ui/ToolButton.svelte` +20/-3, `src/lib/ui/Tooltip.svelte` +23/-6, `src/lib/ui/menu-items.ts` +18/-2, `src/lib/ui/tab-strip.ts` +93/-2.
- **Routes:** `src/routes/+layout.svelte` +9/-0.
- **Browser specs:** `tests/browser/keyboard.spec.ts` +4/-3, `tests/browser/nested.spec.ts` +10/-5, `tests/browser/rail.spec.ts` +1/-1, `tests/browser/tabs.spec.ts` +16/-7 (the one-tab-width assertion is now "the left edge rests on a tab's start or the strip's end").
- **Node tests:** `tests/contrast.test.ts` +4/-1, `tests/shell/activity-rail.test.ts` +55/-3, `tests/shell/paneview.test.ts` +79/-0, `tests/shell/rail.test.ts` +70/-24, `tests/state/palette.test.ts` +34/-0, `tests/ui/colours.test.ts` +2/-2 (`--accent-bg` added to the fill surfaces), `tests/ui/glyph.test.ts` +2/-1, `tests/ui/theme.test.ts` +35/-0.
- **Back to main's content:** `src/lib/shell/PaneView.svelte`'s tab hint, `tests/ui/primitives.test.ts`, `tests/shell/workbench.test.ts`.

## Limitations

- **Gap at the strip's far edge.** Hiding the edge-crossing tab leaves a gap up to one tab wide beside the scroll control. During a smooth scroll, tabs appear and disappear as they cross an edge.
- **Settle timing.** A trackpad fling that stops is moved again, 120 ms later, to the next edge in its direction, so the strip can travel up to one tab further than the gesture.
- **Pressed toggle over a wallpaper.** `--accent-bg` is an opaque fill, so over a wallpaper a pressed toggle is a solid box on the translucent rail. Not checked visually beyond the light and dark screenshots.
- **Accent text shift.** The tint-first derivation shifts `--accent-txt` in six themes app-wide (listed above). The contrast test passes for all 17 themes; no visual pass beyond the rail was made.
- **Round 0 limitations still true:**
  - the item-3 overlap does not reproduce on the demo (the audit test records it);
  - "one page offers neither item" and the keyboard-focus tooltip test are guards;
  - the scrollbar track is opaque over a wallpaper.
- **Reviewer's stray symlink.** The reviewer's report says it left `.agents/worktrees/d16/tools/oculus/node_modules/node_modules`. I did not touch it; it is outside this worktree.


# Repair round 2

Everything in repair round 2 is done.

One addition the round did not ask for, a decision you may reverse: pressing a tab face now also brings that tab in whole (`press` in `Tabs.svelte`). Without it, pressing the tab that is already showing, where the far edge crosses it, changed nothing: the reveal only runs when the showing tab changes.

## Items

| # | Item | State | Proof |
|---|---|---|---|
| 1 | D1 reversed | DONE | `.tab.cut`, the cut state and the hiding are gone, and `cutTabs` is removed. The one remaining need, re-revealing the showing tab after a resize leaves an edge across it, uses a single-tab `crossed()` in `ui/tab-strip.ts`. The browser test "an overflowing strip rests with a tab start at its left edge, and shows the active tab whole" asserts the left edge in four places: after revealing the tab just opened, after each of four control presses, after pressing a tab the far edge crosses, and after a wheel scroll. It asserts the active tab whole after both reveals. The test passes. |
| 2 | Settle on the nearest tab start | DONE | `tabEdgeRest(spans, scrollLeft, max)` takes no direction and picks the nearest resting offset. New cases in `tests/ui/tab-strip.test.ts`: in the gap 102..204 (middle 153), 152 goes to 102 and 154 goes to 204; in the gap 204..290, 246 goes to 204 and 248 goes to 290. A sweep asserts no rest is further than half the gap plus 1 px from the stop. 15 tests pass. |
| 3 | `--accent-txt` back to main's derivation | DONE | `derive.ts` computes `--accent-txt` as on main. The pressed toggle uses `--accent-bg-txt`, the accent made readable on `--accent-bg` first. `tokens.css` `:root` carries `--accent-bg-txt: #95492c` for the first paint, and the contrast test measures `--accent-bg-txt` on `--accent-bg` in all 17 themes. |

**Item 3 comparison against main:** a script compared `deriveTokens` from the worktree against main's `derive.ts` (saved from `git show HEAD`). It reports `accent-txt identical to main in all 17 themes`.
- The six themes that had shifted are back: light `#95492c` → `#ad5533` (main's value), dark `#cd7959` → `#ce7a59`, vscode-dark-modern `#0893fe` → `#008ffc`, vscode-light-modern `#0059ad` → `#005fb8`, latte `#a23b00` → `#b64300`, gruvboxlight `#a43602` → `#af3a03`.
- `--accent-bg-txt` on `--accent-bg` ranges from 4.51 (gruvboxlight) to 6.60 (rosepine); light is `#95492c` on `#e6d6d2` at 4.56.

## Commands (from `tools/oculus`)

- `npx vitest run --reporter=dot`: `Test Files 229 passed (229)`, `Tests 3830 passed (3830)`. No timeout on this run, so nothing was rerun alone.
- `npm run check`: `COMPLETED 1156 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- perl ASCII gate: 0 lines
- `npx playwright test` (full suite, final build): `145 passed (2.9m)`

## Reverts for the new or changed tests

Each revert pair was applied in a scratch copy under `scratchpad/q33-builder`, which was built, run and removed.
- **Copy r2a:** `scrollOne` back to one first-tab width, the settle timer removed, and `--accent-bg-txt` back to `--accent-txt` in `ToolButton.svelte`. Two tests went red:
  - the whole-tab test, at `:427` `expect((await view(list)).edge).toBe(true)` after the first control press (`Received: false`);
  - "under the light theme a pressed toggle fills with the accent tint…", at `:551` (`Expected "rgb(149, 73, 44)"`, `Received "rgb(173, 85, 51)"`).
- **Copy r2b:** reveal back to `scrollIntoView({ inline: 'nearest' })` and the settle timer removed. The whole-tab test went red at `:449`, the left-edge assertion after the wheel (`Received: false`). The two reveal assertions stayed green in that copy, so the test does not isolate the reveal revert.
- **Not run in a copy:**
  - the node cases at 152 and 246 go red under the previous directional `tabEdgeRest`, which sends 152 to 204 and 246 to 290;
  - the `crossed` cases go red if it returns `false` for a tab across either edge;
  - the first-paint test in `tests/ui/theme.test.ts` goes red if the `--accent-bg-txt` line leaves `tokens.css` or changes.

## Doc text lines this round changes (in full)

HELP.md:
- **New line after line 29** (replaces the round-1 "Tabs past the strip's width" line): "- **Tabs past the strip's width.** The strip scrolls rather than shrinking its tabs, and it rests with a tab's start at its left edge: its two controls move to the next tab's start, a wheel or trackpad scroll settles on the nearest tab start when it stops, and a tab being shown or pressed is brought in whole. The far edge may show part of a tab."
- **Line 15 replacement**, unchanged from round 1: "…and at the foot of the rail the appearance controls, each drawn with its name under its glyph: Search, Update, Theme, the Text row of smaller, reset and larger, CRT, Wallpaper where the theme has one, and Glyphs, the toggle between the glyph vocabulary and its ASCII stand-ins. A toggle that is on is filled with a tint of the accent. The list above the foot scrolls on its own, and a fade at its top or bottom edge says more entries are past it. In the Text row the left and right arrows move along the row, and the up and down arrows leave it."

DESIGN.md:
- **Line 225 replacement** (replaces round 1's): "…The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. `derive.ts` also derives, for every theme, `--accent-bg`, a fifth of the accent in the page's colour, which a pressed toggle in the rail fills with, and `--accent-bg-txt`, the accent made readable on that surface first, which the toggle's glyph and name are drawn in, so no other accent text changes; and the scrollbar's `--scroll-thumb`, halfway between `--muted` and `--line`, and `--scroll-track`, the panel. `tokens.css` gives those four the default theme's derived values on `:root`, so the first paint draws them before a theme is applied. One rule in the page root draws every scrolling box's thin bar in the two scrollbar tokens. Primitives use tokens only; a raw hex in a component is a test failure."
- **New decision line after line 322** (replaces round 1's): "- 2026-09-16, the shell's defects seen on the page. A pointer press puts a tooltip away and a focus shows one only when `:focus-visible` holds, so a click never leaves a bubble over what it opened; the bubble returns once the pointer has left the control and rested on it again. The rail's list is `shell/RailList.svelte`: it fills the height above the foot and draws a fade at an edge with more past it, from `listFade` in `shell/rail.ts` over the list's scroll numbers. The foot's controls are stacked with a visible name, the three text steps one row under one name, answering the left and right arrows inside the row and the up and down arrows to leave it (`railStop` in `shell/rail.ts`), and text reset draws `note_back`. A rail toggle that is on fills with `--accent-bg`, draws its border in the accent and its glyph and name in `--accent-bg-txt`, under every theme. A `MenuItem` may carry `items`: picking it shows them in `ui/Menu.svelte` in place of the menu's list after a Back choice (`menuLevel` in `ui/menu-items.ts`), and Escape closes the whole menu from either list; this is how the pane menu offers its per-page moves and shows as two choices (`pageListItems` in `shell/pane-view.ts`). An overflowing tab strip rests with a tab's start at its left edge: a scroll control moves to the next start (`tabEdgeStep`), a free scroll settles on the nearest start when it stops (`tabEdgeRest`), so it never travels more than half a tab past the gesture, and a tab that is shown or pressed is brought in whole (`revealOffset`); the far edge may cross a tab, as VS Code's strip does, and tab names are drawn whole. The palette's rows draw their kind in words, and an empty query lists the views alone."
- HELP.md's line-7 addition, pane-menu line and palette line are unchanged from round 1.

## Files this round changed

Totals are cumulative against main (`git diff --numstat`); the new file's count is its length.
- `src/lib/ui/Tabs.svelte` (578 lines; +104/-9 against main): hiding, `heading` and `lastLeft` removed; settle on the nearest start; `crossed` used by `resized`; `press` reveals a pressed tab.
- `src/lib/ui/tab-strip.ts` (+84/-2 against main): `tabEdgeRest` without direction, `cutTabs` replaced by `crossed`, head comment.
- `src/lib/themes/derive.ts` (+36/-0 against main): `--accent-txt` as on main, new `--accent-bg-txt`.
- `src/lib/themes/tokens.css` (+7/-0 against main): `--accent-bg-txt` default.
- `src/lib/ui/ToolButton.svelte` (+20/-3 against main): the pressed toggle uses `--accent-bg-txt`.
- `tests/contrast.test.ts` (+4/-1 against main): measures `--accent-bg-txt` on `--accent-bg`.
- `tests/ui/theme.test.ts` (+35/-0 against main): the first-paint test includes `--accent-bg-txt`.
- `tests/ui/tab-strip.test.ts` (new, 116 lines): nearest-settle and `crossed` cases.
- `tests/browser/shell-defects.spec.ts` (555 lines): whole-tab test rewritten, head comment, toggle test reads `--accent-bg-txt`.

## Limitations

- A tab the far edge crosses shows in part and takes the pointer; pressing it brings it in whole.
- A settle can move the strip back by up to half a tab from where a gesture stopped.
- The reveal assertions in the browser test did not go red on their own revert (copy r2b); the settle revert made that run red instead.


# Repair round 3

Everything in repair round 3 is done.

## Items

| # | Item | State | Proof |
|---|---|---|---|
| 1 | Strip end rests on a start | DONE | See item 1 below. The tenth-tab and scroll-control browser tests pass. |
| 2 | Gesture settle | DONE | See item 2 below. Four browser cases pass. |
| 3 | Reveal proven on its own | DONE | Three browser cases pass; each revert run (see "Reverts run"). |
| 4 | Control step proven apart from the settle | DONE | See item 4 below. |
| 5 | Thumb at 3:1 on its track | DONE | See item 5 below. |
| 6 | False sentences | DONE | See item 6 below. |
| 7 | Behaviour and Limitations with before and after | DONE | Below. |

**Item 1, the strip's end.**
- **Trailing space.** `trailingSpace(spans, width, fits)` in `ui/tab-strip.ts` sizes a `.tail` span after the last tab so the largest scroll offset is a tab's start.
- **Starts only.** `rests()` holds only tab starts at or below the largest offset, plus 0. `tabEdgeStep`, `tabGestureRest` and `revealOffset` all return from that set.
- **Measured** on the final build, 10 tabs at 720 px (probe spec, since removed): `at 1036 = max 1036`, and 1036 is tab 8's start (`starts [0,105,207,403,623,815,917,1036,1127,1253]`). Trailing space is 102.28 px.
- **Edge predicates** in `shell-defects.spec.ts` (`edge()`) and `tabs.spec.ts` (`atTabEdge`) no longer accept `max - 1`.
- **Tests:**
  - "the tenth tab opens at the strip end with a tab start at the left edge" asserts offset > 0, left edge on a start, active tab whole, and the right control disabled.
  - "a scroll control lands the left edge on a tab start at once, to both ends" walks the left control to 0 and the right control to the end, asserting a start after every press.

**Item 2, the gesture settle.** `ui/tab-scroll.svelte.ts`:
- `wheel()` records `gestureFrom` at the gesture's first event, applies the delta, and restarts a 300 ms timer (`SETTLE_MS`), so a new wheel event cancels a pending settle.
- `settle()` jumps with `scrollTo({ left })`, no smooth scroll.
- The destination is `tabGestureRest(spans, from, scrollLeft, max)`:
  - under 16 px of travel (`GESTURE_MIN`), back to the start the gesture left;
  - otherwise, the next start in the direction travelled, at or past the current offset.
- Scroll events no longer start a settle.
- **Browser cases:**
  - "a continuous trackpad gesture never steps back and settles on a start past it": 60 events of deltaX 3 every 16 ms; offsets never decrease; the final offset is a start at or past the last one.
  - "a gesture that pauses for 250 ms is not settled during the pause": 15 events, a 250 ms pause, 15 more. Offsets never decrease; the offset at the pause's end equals where the first half left it; the final offset is a start past that point.
  - "one wheel notch on a wide tab moves one tab": from Coauthor's start (Coauthor is over 200 px wide), one deltaY 100 event settles on Archive's start.
  - "a nudge of 10 px returns to the start it left".
- **Node cases** (`tests/ui/tab-strip.test.ts`): 15 px back, 16 px on, a 100 px notch across a 196 px tab both ways, a gesture ending exactly on a start, and running into either end.

**Item 3, the reveal.**
- "a tab activated from the rail is brought in whole with a start at the left edge": 720 px, strip at 0, Archive opened from the rail.
- "the showing tab stays whole when the window narrows from 900 to 640 px" and "…from 720 to 560 px": strip at 0, Map activated from the rail (it lands at the right edge), then the window narrows.
- `resized()` now reveals the showing tab whenever it was whole at the last measure and is not whole after the resize, crossed or wholly out of view. A scroll by the reader that took it out of view clears that flag, so a later resize leaves it where it is.

**Item 4, the control step.** The step is instant (`scrollTo({ left })` after `tick()`). The control test reads the offset with `expect.poll(..., { timeout: 250 })` straight after each press. Since only wheel events start a settle now, a settle cannot move the strip in that test.

**Item 5, the scrollbar thumb.**
- `derive.ts` computes `--scroll-thumb = readable(mix(muted, line, 0.5), panel, SCROLL_THUMB_RATIO)`, with `SCROLL_THUMB_RATIO = 3` exported.
- `tests/contrast.test.ts` "keeps the scrollbar thumb at 3:1 on its track in every theme" checks all 17 themes.
- Measured by a scratch script over `deriveTokens`: from 3.00 (vscode-dark-modern) to 3.26 (synthwave). Light is 3.12 (`#8593a7` on `#fff`), dark 3.13, solarized 3.06, rosepine 3.17, kanagawa 3.11.
- The `:root` default in `tokens.css` is now `#8593a7`, matching light's derived value (the first-paint test in `tests/ui/theme.test.ts` passes).

**Item 6, false sentences.**
- `+layout.svelte`'s comment now says `tokens.css` gives the two tokens the default theme's values on `:root`, so the first paint draws the same bar.
- `Tabs.svelte`'s head comment states the start-only rest with the trailing space and says the far edge may cross a tab.
- `tests/ui/colours.test.ts:6` now reads "the seven `--on-<surface>` on `--<surface>` pairs".
- `tabs.spec.ts`'s title is now "the scroll controls appear on overflow, move to the next tab start, and follow the active tab".
- The Doc text below cites no prior art.

The scroll mechanics moved out of `Tabs.svelte` (578 to 490 lines) into the new `ui/tab-scroll.svelte.ts` (193 lines): one controller per strip, created by the component, with its state inside the returned object.

## Verification (from `tools/oculus`, final tree)

- `npx vitest run --reporter=dot`: `Test Files 229 passed (229)`, `Tests 3835 passed (3835)`, with no timeouts.
- `npm run check`: `COMPLETED 1157 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- The perl ASCII gate prints 0 lines.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `970 tests/state/layout.test.ts`, `979 tests/state/board.test.ts`
- `npx playwright test` (full suite): `153 passed (2.9m)`

## Reverts run (scratch copies under `scratchpad/q33-builder`, each built with `vite build`, then removed)

**How copies were grouped:** reverts share a copy only when no target test depends on another revert in that copy. For the two resize cases, only the test file was copied again into c2 and c4 and rerun; the builds did not change.

| Revert | Copy | Target test | Result |
|---|---|---|---|
| R1: `tail = 0` (no trailing space) | c1 | the tenth tab opens at the strip end… | red |
| R1 | c1 | a scroll control lands the left edge… | red |
| R1 | c1 | `tabs.spec.ts` (right control not disabled at the end) | red |
| R3: settle does nothing | c1 | a continuous trackpad gesture… | red |
| R2: `step` as `scrollBy` of the first tab's width | c2 | a scroll control lands the left edge… | red (the case's own settle cannot run) |
| R4: `SETTLE_MS = 120` | c2 | a gesture that pauses for 250 ms… | red |
| R8: `resized()` never reveals | c2 | both "narrows" cases | red |
| R5: settle to the nearest start (the round-2 rule) | c3 | one wheel notch on a wide tab moves one tab | red |
| R7: no reveal when the showing tab changes | c3 | a tab activated from the rail… | red |
| R6: no 16 px minimum (always the next start) | c4 | a nudge of 10 px returns… | red |
| R9: `resized()` reveals only a tab still partly in view | c4 | narrows from 720 to 560 px | red |
| R9 | c4 | narrows from 900 to 640 px | green, as expected: that resize crosses Map, which R9 still reveals |

In c1 to c3, other tab cases also went red through the combined reverts; each row names the case whose only dependency is that revert.

Not run in a copy:
- **Node cases in `tests/ui/tab-strip.test.ts`:** the 15 px and 16 px settle cases go red without `GESTURE_MIN`. The "never rests at a start past the largest offset" and strip-end cases go red if `rests()` again adds `max` and clamped starts.
- **Contrast thumb test:** goes red if `readable(..., SCROLL_THUMB_RATIO)` is removed; the pre-change values were 1.70 to 3.13 per the review.

## Behaviour (before this round, then after)

- **Strip end.**
  - Before: the largest offset was the end of the last tab, so at the end a tab could cross the left edge (10 tabs at 720 px: tab 6 showing 17 px), and the right control's last press could move 16 px.
  - After: the strip carries empty space after its last tab (102 px in that case), so the end rests with tab 8's start at the left edge, and every press moves to a tab start.
- **Wheel and trackpad settle.**
  - Before: 120 ms after any scroll event, a smooth scroll moved the strip to the nearest start. A gesture pausing over 120 ms was pulled back mid-gesture; a notch under half a wide tab returned to where it started.
  - After: only wheel events start a settle. It runs 300 ms after the last wheel event, as an instant jump. Under 16 px of travel returns to the start the gesture left; 16 px or more goes on to the next start in the direction of travel, so one notch of 100 px always moves at least one tab. The strip can end up to one tab further on than the gesture carried it.
- **Scroll controls.**
  - Before: a smooth scroll to the next tab edge.
  - After: an instant jump to the next tab start.
- **Resize.**
  - Before: the showing tab was brought back only when a resize left an edge across it; a narrowing that put it wholly out of view left it there.
  - After: it is brought back whenever it was whole before the resize and is not after, crossed or out of view. A showing tab the reader scrolled away from stays out of view on resize.
- **Scrollbar thumb.**
  - Before: thumb on track from 1.70 to 3.13; light 2.25 (`#a3aebd` on `#fff`).
  - After: from 3.00 to 3.26; light 3.12 (`#8593a7` on `#fff`). The thumb is darker on light themes and lighter on dark ones.

## Limitations

- **Empty space at the end.** At the end of an overflowing strip, the space after the last tab can be almost as wide as the visible part. The case above leaves 102 px empty to the right of the last tab.
- **Pauses longer than 300 ms.** A trackpad gesture pausing longer than 300 ms is settled during the pause, as two gestures would be.
- **Synthetic events only.** The gesture figures and tests use synthetic `WheelEvent`s dispatched on the list; no real trackpad or mouse was used, and momentum scrolling on real hardware is not checked.
- **Preventing the page scroll.** The wheel handler calls `preventDefault`. Whether it stops the page scrolling under a real wheel over the strip depends on Svelte not attaching the listener as passive; not checked.
- **The far edge.** The far edge may cross a tab; that tab shows in part and takes the pointer, and a press on it brings it in whole.

## Doc text lines this round changes (in full)

**HELP.md**, new line after line 29. It replaces rounds 1 and 2's "Tabs past the strip's width" line:

> - **Tabs past the strip's width.** The strip scrolls rather than shrinking its tabs, and it rests only with a tab's start at its left edge, keeping empty space after the last tab so its end rests on a start too. Its two controls jump to the next tab start; a wheel or trackpad scroll settles 300 ms after it stops, back to where it began when it moved less than 16 px and on to the next tab start in the direction it moved otherwise; a tab being shown or pressed is brought in whole, and so is the shown tab when a narrower window crosses it or takes it out of sight. The far edge may show part of a tab.

**HELP.md**, the new line after line 7 (the round-1 addition, unchanged apart from the thumb):

> A control's tooltip opens when the pointer rests on it and when the keyboard brings the focus to it. A click puts it away, and it comes back once the pointer has left the control and rested on it again. Every scrolling box draws a thin scrollbar in the theme's colours, its thumb at 3:1 or more on its track, except the rail's list and the tab strips, which draw none and scroll by wheel, trackpad and their own controls.

**DESIGN.md**, line 225 replacement (replaces round 2's):

> …The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. `derive.ts` also derives, for every theme:
> - `--accent-bg`, a fifth of the accent in the page's colour, which a pressed toggle in the rail fills with;
> - `--accent-bg-txt`, the accent made readable on that surface first, which the toggle's glyph and name are drawn in, so no other accent text changes;
> - the scrollbar's `--scroll-track`, the panel;
> - `--scroll-thumb`, halfway between `--muted` and `--line`, nudged in lightness until it clears 3:1 on the track, which the contrast test also measures.
>
> `tokens.css` gives those four the default theme's derived values on `:root`, so the first paint draws them before a theme is applied. One rule in the page root draws every scrolling box's thin bar in the two scrollbar tokens. Primitives use tokens only; a raw hex in a component is a test failure.

**DESIGN.md**, new decision line after line 322 (replaces round 2's):

> - 2026-09-16, the shell's defects seen on the page.
>   - **Tooltip.** A pointer press puts a tooltip away and a focus shows one only when `:focus-visible` holds, so a click never leaves a bubble over what it opened; the bubble returns once the pointer has left the control and rested on it again.
>   - **Rail list.** The rail's list is `shell/RailList.svelte`: it fills the height above the foot and draws a fade at an edge with more past it, from `listFade` in `shell/rail.ts` over the list's scroll numbers.
>   - **Rail foot.** The foot's controls are stacked with a visible name, the three text steps one row under one name, answering the left and right arrows inside the row and the up and down arrows to leave it (`railStop` in `shell/rail.ts`), and text reset draws `note_back`.
>   - **Pressed toggle.** A rail toggle that is on fills with `--accent-bg`, draws its border in the accent and its glyph and name in `--accent-bg-txt`, under every theme.
>   - **Nested menu.** A `MenuItem` may carry `items`: picking it shows them in `ui/Menu.svelte` in place of the menu's list after a Back choice (`menuLevel` in `ui/menu-items.ts`), and Escape closes the whole menu from either list; this is how the pane menu offers its per-page moves and shows as two choices (`pageListItems` in `shell/pane-view.ts`).
>   - **Tab strip.** An overflowing tab strip rests only with a tab's start at its left edge, so no name is cut at that edge. It carries empty space after its last tab so its largest offset is a start (`trailingSpace`). A scroll control jumps to the next start (`tabEdgeStep`). A wheel or trackpad gesture settles 300 ms after its last event, back to the start it left when it travelled less than 16 px and on to the next start in its direction otherwise (`tabGestureRest`), so a settle never pulls against the gesture and one notch moves a tab. The shown tab is brought in whole when it changes, when it is pressed, and when a change of width crosses it or takes it out of sight (`revealOffset`). All of this is `ui/tab-strip.ts`'s arithmetic, driven by `ui/tab-scroll.svelte.ts`. The far edge may cross a tab, and tab names are drawn whole.
>   - **Palette.** The palette's rows draw their kind in words, and an empty query lists the views alone.

The HELP line-15 replacement, pane-menu line and palette line are unchanged from round 1.

## Files this round changed

Line counts; the diffs are against main.
- `src/lib/ui/tab-scroll.svelte.ts`: new, 193 lines.
- `src/lib/ui/Tabs.svelte`: 490 lines, +53/-46.
- `src/lib/ui/tab-strip.ts`: 166 lines, +106/-2.
- `src/lib/themes/derive.ts`: +41/-0.
- `src/lib/themes/tokens.css`: +7/-0.
- `src/routes/+layout.svelte`: +10/-0.
- `tests/ui/tab-strip.test.ts`: 146 lines.
- `tests/browser/shell-defects.spec.ts`: 680 lines.
- `tests/browser/tabs.spec.ts`: +16/-8.
- `tests/contrast.test.ts`: +14/-2.
- `tests/ui/colours.test.ts`: +3/-3.
