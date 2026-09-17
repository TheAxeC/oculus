# Step Q38 builder report

Everything in the brief is done.

Open items for Axel: none were raised. The decisions below are mine and can all be reversed.

Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/q38 (all paths below are under tools/oculus). Scratch and screenshots: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q38-builder/

## DONE / NOT DONE

| Item | State | Proof (command and output) |
|---|---|---|
| 1. Tab strip at VS Code's measures and marks (`ui/Tabs.svelte`) | DONE | `npx playwright test tests/browser/tabs.spec.ts`: "a tab stands at the editor tab height..." passed. Height is 35 and grows with the text (35 x scale after Text larger). The shown tab has a 1px top border in `--accent`, the others a transparent one. The close control's opacity is 1 on the shown tab, 0 on the others, and 1 on hover. |
| 1. Dirty dot | DONE | Same spec, "a tab holding unsaved text shows a dot...": after typing into the Tasks add form the dot shows and the cross is hidden. Hovering swaps them. The dot stays when the tab is not shown, and the clean tab has none. |
| 2. Pane header (`shell/PaneView.svelte`) | DONE | Same spec, "the pane header splits...": the split button has `tabindex=-1`, both header buttons have transparent border and background at rest, pane-menu items are still drawn in `--ink-txt`, and pressing split makes 2 panes. Node test `tests/shell/workbench.test.ts`: 3 split buttons, each before its pane menu, with the `split_right` and `more` glyphs. |
| 3. Sashes (`shell/SplitView.svelte`) | DONE | Same spec, "a sash draws nothing at rest...": the sash box is still 6px wide. `elementFromPoint` finds the sash 1px outside the gap on both sides but not 5px out. Line colour: transparent at rest, accent on hover, transparent again on leaving. With `--sash-delay` set to 60s, a hover still shows nothing after 500ms and a drag shows the accent at once. |
| 4. Page strip (`shell/PageStrip.svelte`) | DONE | Same spec, "the page strip draws its tabs in the same look...": page tabs are 30px, the shown one has the accent top border, close opacity 0 or 1 as on pane tabs. The page strip background is `--card`; the pane strip background is `--bg`. |
| Keyboard of the tab strip and page strip unchanged | DONE | The Tabs keyboard code is untouched. `keyboard.spec.ts` (8 passed) covers one stop per strip, arrows, Tab and Shift-Tab back to the stop, and Delete. `pages.spec.ts` (6) covers Ctrl+Shift+arrows. `shell-defects.spec.ts` (24) covers the Q33 and Q39 scroll cases and keyboard focus. |
| Node tests: tab marks | DONE | `tests/ui/primitives.test.ts`, "the marks a tab carries" (current, inactive, dirty with dot, glyph before label, preview). Workbench tests cover pinned, the dirty mark from `unsaved`, and the header actions. |
| `npx vitest run --reporter=dot` | DONE | `Test Files 246 passed (246)`, `Tests 4120 passed (4120)` |
| `npm run check` | DONE | `COMPLETED 1209 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | exit 0 |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | exit 0, no output |
| ASCII gate (the perl command) | DONE | printed nothing |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -3` | DONE | `970 tests/state/layout.test.ts`, `980 tests/state/board.test.ts` (neither is mine). Tabs.svelte is 574 lines. |
| Browser specs | DONE | `npm run build` then `npx playwright test` on tabs, shell-defects, pages, layout, rail, unsaved-forms and keyboard: `66 passed (1.3m)` (tabs 6, shell-defects 24, pages 6, layout 4, rail 5, unsaved-forms 13, keyboard 8). I added `keyboard.spec.ts` to the brief's list. |
| Screenshots in light, dark and gruvbox at 1600 wide | DONE | Listed below. |

## Reverts run (each turned its test red; the file was then restored with a byte check)

Browser, `tests/browser/tabs.spec.ts`:
- **Tab measures test:**
  - `--tab-height` set to 32px: red on the shown-tab look.
  - `border-top-color: var(--accent)` removed: red, same assertion.
  - `.tab.current .close` removed: red.
  - `.tab:hover .close` removed: red on the hover poll.
- **Dirty test:**
  - `dirty: false` in PaneView: red.
  - the `.tab.dirty:not(:hover) .dot` rule removed: red.
- **Header test:**
  - ToolButton removed: red, element not found.
  - `.opener` rules widened back to every button under the opener: red on the menu item colour.
  - bare-look declarations removed: red on the border and background check.
- **Page strip test:**
  - `--tab-height: var(--page-tab-height)` removed: red.
  - card background removed: red.
- **Sash test:**
  - transparent rest rule removed: red at rest.
  - hover background removed: red on the hover poll.
  - hover delay removed: red on the 500ms check.
  - `.sash.dragging .line` selector removed: red on the drag poll.
  - `width: var(--sash-hit)` removed: red on `found(box.x - 1)`.

Node:
- `primitives.test.ts`:
  - `class:current` removed: red.
  - `class:dirty` removed: red.
  - dot block set to `{#if false}`: red.
  - glyph before the label removed: red.
- `workbench.test.ts`:
  - `dirty: false`: red.
  - split button without `tabindex`: red.
  - split button relabelled: red.
  - menu glyph pointed back at `ui.pane_menu_glyph`: red.
  - split glyph swapped: red.
  - `class:current` removed: the pinned test went red.
- `tests/ui/wall.test.ts`: its two new SOLID entries are an audit over the source, not DOM coverage.

## Screenshots (in shots/)

- **Before:** `before-{light,dark,gruvbox}.png` (full window), `before-*-top.png` (strips), `before-*-sash-crop.png`.
- **After:** the same three sets, plus `after-*-zoom.png` (2x strips with an inactive tab hovered), `after-*-zoom-dirty-hover.png` (the dirty tab hovered, showing the cross), `after-*-sash-rest.png` and `after-*-sash-hovered.png` (2x).
- There are no 2x zoom or hover-state shots of the before state; the before crops come from the 1x full screenshots.
- Each shows a page with two panes side by side. The left pane has Status plus a dirty Tasks tab; the right has Projects and Focus. A second page is open.

Measured in the screenshot run (`getComputedStyle` and `getBoundingClientRect`):

| Measure | Before | After | VS Code |
|---|---|---|---|
| Tab height | 29.25px (27.75 in gruvbox) | 35px in all three themes | 35px |
| Gap between tabs | 2px | none | none |
| Shown tab's top border | `--line` colour | 1px accent | 1px accent |
| Page tab height | 29.25px | 30px | no page strip |
| Label font | 13.5px (12.5 in rice) | 13.5px (12.5 in rice) | 13px |
| Sash line on hover | `--line` colour | accent (2px) | accent |
| Sash slot | 6px | 6px | 4px hit area |

## Visible changes, before and after

- **Tabs:**
  - Before: rounded tabs with a 2px gap; only the shown tab had a border box; hovering a label turned it accent; every close control was always visible.
  - After: square tabs, 35px tall, edge to edge with a 1px `--line` border on the right. The shown tab sits on `--panel` with a 1px accent top line and no line under it; the others use muted text on `--bg`.
  - The close control is a 20px box centred in 28px of room kept on every tab. It shows on the shown tab, on hover and on a dirty tab, with a `--chip` fill on hover. Labels no longer change colour on hover.
- **Dirty dot:** a filled dot (the lucide `circle` icon filled by CSS; `*` in terminal themes) replaces the cross until the tab is hovered.
- **Pane header:** before, one boxed opener with the `list` icon. After, a bare split-right icon button (`columns-2`, `||` in terminal themes) and a bare `...` opener (`ellipsis`). Both get a `--chip` fill on hover.
- **Sash:** before, a 1px `--line` line always visible. After, nothing at rest; a 2px accent line after 300ms of hover and at once while dragging or with keyboard focus; the pointer finds it across 10px.
- **Page strip:** before, 4px padding on `--bg` with the old tab look. After, no padding, the same tab look at 30px on `--card` (card at the wallpaper fraction over a wallpaper).

Differences from VS Code that I kept:
- The page strip is a second strip above the panes.
- Tab count badges and split cells stay after the label, inside the tab height.
- A folded pane's thin strip (`FOLD_PX` 28) is untouched.
- Preview tabs are italic, which matches VS Code.
- A pinned tab (session pin) is drawn like any other tab under its own label. VS Code's pinned tabs have no equivalent here.
- The Q33 scroll controls stand in for VS Code's thin scrollbar (HELP.md line 9 says the tab strips draw no bar).
- The label stays at `--fs-lg` (13.5px), because tokens.css requires every font size to come from its nine steps.
- Panes keep their border, 10px radius, 4px area padding and 6px gap.
- Every pane's shown tab gets the accent line; VS Code greys it in unfocused groups.

## Doc text

HELP.md: add after the "Tabs past the strip's width." bullet:
`- **How a strip is drawn.** Tabs stand edge to edge at one height, the shown tab on the pane's surface with an accent line along its top. A tab's close control shows on the shown tab and under the pointer; a tab holding text no save has taken shows a dot in its place until the pointer is over it. The right end of a pane's strip holds its split-right button and the pane menu's ... opener. The page strip is drawn the same way, lower and on the card surface. A handle between panes shows nothing until the pointer rests on it or drags it, and it can be caught a little past the gap.`

DESIGN.md: add under "Decisions taken":
`- 2026-09-17, tabs, pages and panes drawn like VS Code's. \`ui/Tabs.svelte\` draws editor tabs at the \`--tab-*\` tokens of \`themes/tokens.css\` (VS Code's 35 px tab, 10 px lead, 28 px close room, grown with \`--text-scale\`): a line between tabs, the shown tab on \`--panel\` with a \`--accent\` top line, the close control shown on the shown tab and under the pointer, and a \`Tab.dirty\` tab, which \`shell/PaneView.svelte\` sets from \`ui.unsaved\`, showing the \`dirty\` glyph in its place. The strip's right end is the pane header: a split-right \`ToolButton\` out of the focus order and the menu opener on the \`more\` glyph, both bare. \`shell/PageStrip.svelte\` sets \`--tab-height\` to \`--page-tab-height\` (30 px) and puts its strip on \`--card\`. \`shell/SplitView.svelte\` draws each sash with no line at rest, a \`--sash-line\` accent line after \`--sash-delay\` of hover and at once in a drag or on focus, and a \`--sash-hit\` reach on a \`::before\` layer outside the flow, so \`SASH_PX\` and every size are unchanged. Package Q38.`

## Files changed (lines added/removed; total lines now)

| File | Added / removed | Lines now |
|---|---|---|
| `src/lib/ui/Tabs.svelte` | +116 / -20 | 574 |
| `src/lib/ui/tab-strip.ts` | +2 | 128 |
| `src/lib/shell/PaneView.svelte` | +18 / -2 | 403 |
| `src/lib/shell/SplitView.svelte` | +63 | 262 |
| `src/lib/shell/PageStrip.svelte` | +16 / -1 | 358 |
| `src/lib/themes/tokens.css` | +19, new tokens only | 114 |
| `config/text/ui.yml` | +3: `dirty_glyph`, `pane_more_glyph`, `split_right_glyph` | 62 |
| `config/glyphs.yml` | +7: `more`, `split_right`, `dirty`, and stand-ins for the two new characters, at the ends under their own comment | 286 |
| `config/icons.yml` | +4, at the end | 151 |
| `tests/browser/tabs.spec.ts` | +269 / -1 | 343 |
| `tests/shell/workbench.test.ts` | +57 / -1 | 774 |
| `tests/ui/primitives.test.ts` | +61 | 790 |
| `tests/ui/wall.test.ts` | +4 | 191 |

The grep for the new token and key names across src, tests, config, HELP.md, DESIGN.md and README.md hits only the changed files. It also shows `ui.pane_menu_glyph` is still read by `views/sessions/SessionWorkspace.svelte:132` and `TerminalRows.svelte:65`.

## Decisions you can reverse

1. The pane opener reads a new key, `ui.pane_more_glyph: more`. `ui.pane_menu_glyph` stays `list`, because the Sessions view's row menus use it and views were outside this step. Changing that key instead would turn those row menus into `...` as well.
2. Page strip: 30px tall and on `--card`. Neither is a VS Code measure; the brief only asked for its own height and background.
3. Sash: 10px hit area, 2px line, 300ms delay; these do not grow with the text size.
4. The split button is drawn only while the pane shows a tab, instead of drawing it disabled with no reason given.
5. Stand-ins in terminal themes: `...` for more, `||` for split (ToolButton adds its own brackets there), `*` for the dirty dot (the existing a bullet stand-in).
6. All new browser tests are in `tabs.spec.ts`, so the colour and look helpers live in one file instead of a new helper file.
7. `tests/ui/wall.test.ts` was not on the brief's path list. I edited it to list the two new hover fills (`.close:hover`, the header action hover) as solid hover responses, the same class of entry already there.

## Limitations

- `ui/Sash.svelte` was outside my paths, so the new sash look lives in `SplitView.svelte` and depends on Sash's class names (`.sash`, `.line`, `.dragging`, `.row`, `.col`). The Source view's editor/preview handle keeps the old always-visible 1px line.
- `Tabs.svelte` depends on Tooltip's `.tip` and Menu's `.menu` class names to reach the header buttons. The browser test catches a rename.
- The sash reach sits 2px over each neighbouring pane's edge on `z-index: 1`, so those 2px of a pane's edge belong to the sash.
- The dirty dot is not announced to a screen reader; the close control's name is still "Close tab".
- Page tabs never show a dirty dot, even though closing a page asks about unsaved text.
- Over a wallpaper, a shown tab paints nothing (as before), so only its borders and the gap in the line under it mark it out.
- The label is 0.5px larger than VS Code's 13px.
- `Tabs.svelte` is at 574 lines, near the ~600 guide for a component.
