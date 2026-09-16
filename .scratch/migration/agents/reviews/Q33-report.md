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
