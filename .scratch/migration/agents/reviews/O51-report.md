# O51 report: a per-pane Hide Tab Row in the pane menu

Everything in the brief, the cases ruling (`agents/briefs/O51-cases.md`, round 0) and the repair brief (`agents/briefs/O51-round1.md`) is done.

**What is not proven:** cases C1 to C9, C11 to C14, C16 to C19 and C21 happen on screen. Each is checked here only by reading the lines it runs through. Their proof is the look on the TEST page at landing, against "What the look on landing should show" below.

**Open item for the coordinator:** no caller binds `Menu.svelte`'s `open` any more (see judgment call 8). Ruling 246 keeps the bindable as built; my recommendation is to keep it.

## Repair round 1

1. **B1, a menu in the path bar.**
   - Change: `PaneStrip.svelte` drops `listOpen` and `bind:open={listOpen}`. It adds `expanded` (`:149`) and an `$effect` (`:161-186`). While the row is hidden, the effect watches the top's subtree with a `MutationObserver` (subtree, childList, `aria-expanded`). It sets `expanded` when a control inside the top matches `[aria-haspopup][aria-expanded='true']` (`OPEN_TRIGGER`, `:142`). This is the mark bits-ui gives an open dropdown's trigger (`node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1470-1471`). `MenuOpener.svelte:107` spreads the mark onto the button.
   - `showing` (`:159`) is now `pointed || menuOpen || expanded || keyed || carrying`. The right-click menu stays read through `menuOpen` (`:234`), because bits-ui's context-menu trigger carries no `aria-expanded`: its props set `data-state` only (`menu.svelte.js:1559`).
   - The `...` list is covered only while the row draws it. When the settings hand it up to the window strip, it is drawn outside the top, which is the old `listOpen && shape.actions`.
   - The same selector already marks an open menu in `TreeActions.svelte:44` and `Card.svelte:131`.
   - Code path for the PDF open menu (`pdf/Controls.svelte:258-267`, drawn in `.bar-actions`, `PaneStrip.svelte:302`):
     - The pointer at the band sets `pointed`; the rows show and carry `data-pane-top` (`:249`).
     - A press on the open button: bits-ui sets `aria-expanded="true"` on it, the observer sets `expanded`, and `showing` holds.
     - The pointer moves into the list on the body, `pointerleave` clears `pointed`, and `showing` still holds through `expanded`. The rows keep `data-pane-top`, so `FrameLayer.svelte` `coveredTop` (`:78-86`) keeps the clip at the row's bottom.
     - The menu closes, `aria-expanded` turns `"false"`, `expanded` clears, and the row hides unless the pointer is back.
2. **T1, the HELP sentence.** `docs/HELP.md:71` now reads: "They show again over the view while the pointer is at the pane's top edge or over the row, while a menu opened from the row or its path bar is open, while the focus is in the row and a key brought it there, and while a tab of the pane is dragged."
3. **S1, the place.** The bullet is at `docs/HELP.md:71`, right after the "A pane from the arrangement stays ... Lock Group" bullet (`:70`). `git diff 87e9c76c -- docs/HELP.md` shows a single `+` line there and nothing removed.
4. **T2.** `type TopRow` (`pane-view.ts:102`) and `type PaneDeps` (`:347`) are local. `grep -rn "TopRow\|PaneDeps" src tests` outside `pane-view.ts` prints nothing.
5. **B2.**
   - The look list below names the 4 px clip and the clip below the shown row.
   - `docs/apps.md:84` gains: "While the pane holding the app hides its tab row (Hide Tab Row), the page's top 4 px lie under the band that shows the row again and take no pointer; while the row shows, it covers the page's top the same way. The page keeps its size."
6. **S2.** The greps are quoted under "Names changed or added". The still-true / rewritten list is under "Comments and documents". Reading for that list found two comments in `pane-view.ts` that were not exact, and both are rewritten:
   - The head now says `panePicked` runs the picks, not Close and the float items.
   - The `paneMenu` doc now says the row item is offered where the pane draws a row or a path bar.
   - The PaneStrip head paragraph names the path bar's menus.
7. **P2, P3.**
   - Judgment call 1 now gives the wrapper depth as three `display: contents` boxes.
   - The last limitation now names a view's own z-indexed element at the pane's edge.

## DONE / NOT DONE

| Deliverable | Status | Proof |
| --- | --- | --- |
| Item 1, menu items, ids, keys, `PANE_ONLY`, the pick | DONE | `npm run test:quick`: `every command passed` |
| Item 2, `rowHidden` through model, tree, store, `readPane` | DONE | G29 row: `Tests  6 passed (6)` |
| Item 3, `PATH_OPERATIONS` row and G102 row | DONE | `Tests  6 passed / 14 skipped (20)` |
| Item 4, bindable `open` on both menu primitives | DONE | svelte-check `0 ERRORS 0 WARNINGS` |
| Item 5, the hidden row and its edge | DONE, look | read below |
| Item 6, sizes and folders | DONE | `wc -l`, `ls / wc -l` below |
| Item 7, comments, HELP bullet | DONE | read below; HELP:71 |
| Item 8, the G29 row | DONE | Verify 2 |
| Item 9, diagrams | DONE | `npm run diagrams` |
| Rulings 1 to 4 (frame clip, stacking, sash, `none`) | DONE, look | read below |
| Round 1, items 1 to 7 | DONE | section above |

Runs:
- The verify list (`npm run diagrams`, `npm run format`, `npm run test:quick`) ran once after the last change of round 1, and passed.
- Whole-suite commands: none.
- Scoped runs in round 1: prettier and eslint on `PaneStrip.svelte` and `pane-view.ts` (exit 0).

## First run of every case on the unchanged tree

Before any product change, `grep -rn "hide-tab-row\|show-tab-row\|rowHidden" src config --exclude=local.yml` printed nothing (`grep exit 1`).

| Case | Lines read on the unchanged tree | Result |
| --- | --- | --- |
| C1 | `paneMenu`, `pane-view.ts:134-167`, last item Move into New Window | no Hide Tab Row; fails |
| C2 | `PaneStrip.svelte:147-177` row and bar in the column | no hidden row; fails |
| C3 | `Menu.svelte:131`, `ContextMenu.svelte:49` inner `$state` | open state unreadable; fails |
| C4 | `Pane`, `model.ts:59-68` | no per-pane field; fails |
| C5 | `readPane`, `saved.ts:382-391` | not read; fails |
| C6 | `floatMenu`, `pane-view.ts:284-295` | no item; fails |
| C7 | `PANE_ONLY`, `pane-view.ts:174` | no hide ids; fails |
| C8, C9, C17, C21 | no hidden row exists | fails |
| C10 | test row, quoted below | fails |
| C11 | `stripShape`, `strip-shape.ts:39-67` | no hidden state; fails |
| C12 | `paneMenu`, `floatMenu`, `stripMenu` | the baseline; holds |
| C13 | `PaneView.svelte:414` returns for `active === ''` | no item; fails |
| C14 | `keptPane`, `tree.ts:179-187` | no field to keep; fails |
| C15 | test row, quoted below | fails |
| C16 | `GRAB_PX = 6`, `float-gesture.ts:47`; `FloatLayer.svelte:144` | no band; fails for the band part |
| C18 | `.path` on a wallpaper `PaneStrip.svelte:257-260` | no row over a view; fails |
| C19 | `PaneBody.svelte:336-342` | no Show Tab Row; fails |
| C20 | `isFloatItem` `:267-278`, `isPaneItem` `:177-179` | ids absent; fails |

C10, `npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts -t "reads" --reporter=verbose`:

```
 x |unit| tests/state/workbench/layout/saved/layout-saved.test.ts > a saved envelope of the current version > reads 'the current version with a pane whose...' 4ms
   -> expected [ { root: { kind: 'split', ...(3) } } ] to deeply equal [ { root: { kind: 'split', ...(3) } } ]
-           "rowHidden": true,
      Tests  1 failed | 5 passed (6)
```

C15, `npx vitest run tests/state/workbench/layout/saved/layout-workspaces.test.ts -t "two browser tabs that change the panes" --reporter=verbose`:

```
 x |unit| ... 'a hide of the tab row of a pane the o...', 'the first' applied first 11ms
   -> client.layout.hideTabRow is not a function
 x |unit| ... 'a hide of the tab row of a pane the o...', 'the second' applied first 6ms
   -> client.layout.hideTabRow is not a function
      Tests  2 failed | 4 passed | 14 skipped (20)
```

## What changed, per item

1. **`pane-view.ts`:**
   - `HIDE_TAB_ROW` and `SHOW_TAB_ROW` (`:94-95`), local.
   - `type TopRow` (`:102`) and `topRow` (`:108-111`), `rowItems` (`:114-119`).
   - `paneMenu` ends with `...rowItems(facts.row, t)` (`:203`); `floatMenu(place, pages, t, windows, row)` ends with it (`:342`).
   - `PANE_ONLY` holds both ids (`:212-220`).
   - `panePicked` (`:364-385`) runs Maximise, Restore, Fold, Hide or Show Tab Row and Show a Page before the items that need the active tab. `type PaneDeps` (`:347`) is local.
   - `ui.yml:51` and `:57` hold the two keys.
   - `PaneView.svelte` `pick` (`:403-407`): float items go to `stripPick`, Close to `closeAll` (`:393-401`), the rest to `panePicked`.
2. **The saved field:**
   - `model.ts`: `rowHidden?: true` (`:69`), doc `:53-56`; `repane` carries it (`:370`).
   - `tree.ts`: `keptPane` carries it (`:185`); `setRowHidden` (`:381-393`).
   - `index.ts:62` exports it.
   - `layout.svelte.ts`: `hideTabRow` typed (`:208`), defined (`:687-690`), returned (`:829`).
   - `saved.ts`: read at `:386-387`, head `:19-25`.
3. **Rerun:** `rerun.ts:42` adds `hideTabRow: { path: 0, page: 2 }`, and the G102 row is added with `panesOf` marking ` hidden`.
4. **Menu open state:** `Menu.svelte:129` and `ContextMenu.svelte:59` hold `open = $bindable(false)`, still bound to bits-ui (`:156`, `:144`).
5. **`PaneStrip.svelte`, the hidden row:**
   - `.top` and `.rows` are `display: contents` while the row shows (`:352-355`).
   - While hidden, `.top` is height 0 at `z-index: 1` (`:362-368`), the band is 4 px (`:247`, `:372-378`), and `.rows` lies over the view on `var(--panel)`, moved up by `translateY(-100%)` (`:382-391`) and shown by `.shown` (`:393-395`).
   - `showing` (`:159`) is `pointed` (`:241-242`), `menuOpen` (`:234`), `expanded` (`:161-186`), `keyed` (`:193-201`) or `carrying`.
6. **Sizes:** `PaneView.svelte` is 513 lines, and `panePicked` and `stripHovered` (`pane-view.ts:625-638`) take the moved logic. No file was added.
7. **Comments and help:** the comments are listed below, and the HELP bullet is at `docs/HELP.md:71`.
8. **G29 row:** `layout-saved.test.ts` adds the row with `rowHidden` set to `true`, `false`, `"yes"` and absent.
9. **Diagrams:** `npm run diagrams` was run.

Rulings:
1. `FrameLayer.svelte` `coveredTop` (`:78-86`) and `clip-path: inset(<cut>px 0 0 0)` (`:123`) clip the frame by the box marked `data-pane-top` (`PaneStrip.svelte:247` band, `:249` rows). A pane never hidden marks none, so its cut is 0.
2. `PaneView.svelte:509-512`: `isolation: isolate` on the pane and its body, only while the row is hidden.
3. The sash at `z-index: 1` sits outside the isolated pane, so within its reach it takes the press.
4. `topRow` gives `none` and `rowItems('none')` is empty.

## Names changed or added (greps)

Base copy, before writing: `grep -rn "\b<name>\b" migration-O51-base/src migration-O51-base/tests | wc -l` printed `0` for each of `topRow`, `rowItems`, `panePicked`, `stripHovered`, `setRowHidden`, `coveredTop`, `TopRow`, `PaneDeps` and `OPEN_TRIGGER`.

Key calls on the base:
- `grep -rn "data-pane-top\|clipPath\|clip-path" src` found only `FieldSelect.svelte:106` (`clip-path: inset(50%)`, a style rule), nothing for a frame.
- `grep -rn "aria-expanded='true'\]" src` found the CSS uses in `TreeActions.svelte:44`, `Card.svelte:131` and `LaneCard.svelte:147`, all `:has(...)` styles. No script helper reads the mark, so the strip's observer is new. The selector matches the two `:has` rules.

Users in the worktree, `grep -rn "\b<name>\b" src tests`:
- `topRow`: `pane-view.ts:108`, `PaneView.svelte:69, 269`.
- `rowItems`: `pane-view.ts:114, 203, 342`.
- `panePicked`: `pane-view.ts:3, 364`, `PaneView.svelte:28, 64, 406`.
- `stripHovered`: `pane-view.ts:7, 625`, `PaneView.svelte:67, 382, 385`.
- `setRowHidden`: `layout.svelte.ts:73, 689`, `index.ts:62`, `tree.ts:386`.
- `coveredTop`: `FrameLayer.svelte:78, 98`.
- `TopRow`: `pane-view.ts` alone (`:102, 108, 114, 181, 336`).
- `PaneDeps`: `pane-view.ts` alone (`:347, 367`).
- `OPEN_TRIGGER`: `PaneStrip.svelte:142, 172`.

Changed constructs:
- **PaneStrip's `locked` prop replaced by `shape`:** `grep -rn "PaneStrip" src tests` finds one mount, `PaneView.svelte:426`. Its props are `{shape}`, `hidden`, `menuRead`, `onmenupick` and `carrying`, with no `locked=`. The other hits are `setPaneStrip`/`PaneStripKey` in `ui.svelte.ts` (another name) and comments.
- **`stripShape(`:** its only caller is `PaneView.svelte:264`.
- **`PAGE` and `EMBED` made local:** `pane-view.ts:36` and `:39`. `grep -rn -A12 "from './pane-view'..." src tests | grep -E "\bPAGE\b|\bEMBED\b|TopRow|PaneDeps"` exits 1. The importers of `pane-view` are `PaneView.svelte`, `strip-tab.ts` and `open-view.svelte.ts`, and none takes them. The other `PAGE` hits (`hooks.server.ts`, `changes.ts`, `figshare.ts`, test fixtures) are their own constants.
- **`floatMenu(`:** its only caller is `pane-view.ts:186`, which passes `facts.row`.
- **`listOpen`:** `grep -rn "listOpen" src tests` prints nothing.

## Comments and documents (still true / rewritten)

| Comment or document | Verdict |
| --- | --- |
| `pane-view.ts` head | rewritten (round 1: `panePicked` named for the picks it runs) |
| `HIDE_TAB_ROW`/`SHOW_TAB_ROW`, `TopRow`, `topRow`, `rowItems` docs | new, true |
| `paneMenu` doc | rewritten (round 1: offered where a row or bar is drawn) |
| `paneMenu` facts `row` doc | new, true |
| `PANE_ONLY` doc | rewritten, true |
| `isPaneItem` doc | still true |
| `isFloatItem` doc | still true |
| `floatMenu` doc | rewritten, true |
| `PaneDeps`, `panePicked`, `stripHovered` docs | new, true |
| `PaneView.svelte` head | rewritten, true (pane menu `:24-29`, top row `:31-42`, strip menu `:54-55`) |
| `PaneView.svelte` `stripHover`, `closeAll` docs | `stripHover` new; `closeAll` moved with its doc, true |
| `PaneStrip.svelte` head | rewritten (round 1: path bar menus) |
| `PaneStrip.svelte` state docs, `showing`, effect, `focusIn`, `focusOut` | new or rewritten in round 1, true |
| `PaneStrip.svelte` style comments | new, true |
| `FrameLayer.svelte` head, `coveredTop` doc | new paragraph and doc, true |
| `FrameLayer.svelte` `place` doc | still true |
| `model.ts` `Pane` doc, `repane` doc | rewritten, true |
| `tree.ts` `keptPane` doc | rewritten, true |
| `tree.ts` `setRowHidden` doc | new, true |
| `tree.ts` `setLocked` doc | still true |
| `layout.svelte.ts` `hideTabRow` type and function docs | new, true |
| `saved.ts` head, `readPane` comment | rewritten, true |
| `rerun.ts` `PATH_OPERATIONS` doc | still true |
| `Menu.svelte`, `ContextMenu.svelte` heads and `open` docs | rewritten, true (a caller may bind) |
| `docs/HELP.md:71` | rewritten in round 1 and moved |
| `docs/apps.md:84` | sentence added in round 1 |
| Other documents | none: `grep -rl -i "pane menu\|tab row\|path bar\|editor_actions\|Move into New Window\|frame layer\|FrameLayer\|Lock Group" docs` outside `docs/diagrams/` lists only `HELP.md` and `apps.md` |

## Cases, before and after

| Case | After: lines it runs through | Result |
| --- | --- | --- |
| C1 | `paneMenu` `:203`; `pick` `PaneView.svelte:406`; `panePicked:373-374`; `row` `:268-274` | holds by reading; look |
| C2 | `.top.hidden` `:362-368`, band `:372-378`, `pointed` `:241`, `.shown .rows` `:393` | holds by reading; look |
| C3 | `menuOpen` `:234`, `expanded` `:161-186`, in `showing` `:159`; a pointer pick gives focus back without a ring | holds by reading; look |
| C4 | `setRowHidden` `tree.ts:386-393`; `row` per pane | holds by reading; look |
| C5 | `change` saves; `saved.ts:387`; C10 green | holds; look |
| C6 | `floatMenu` `:342`; `[data-tab-strip]` inside `.rows` | holds by reading; look |
| C7 | `PANE_ONLY` `:212-220`; `stripPick` `PaneView.svelte:315-319` | holds by reading; look |
| C8 | `focusIn` `:193-195`, `focusOut` `:198-201` | holds by reading; look |
| C9 | frames inert during a drag; document listeners, no capture; `onhoverindex` | holds by reading; look |
| C10 | the row passes | `Tests  6 passed (6)` |
| C11 | `stripShape` in `PaneView.svelte:263-266`; `topRow` `none` | holds by reading; look |
| C12 | menus gain only the last item; `display: contents` while shown | holds by reading; look |
| C13 | `panePicked:373` before the active-tab items | holds by reading; look |
| C14 | `tree.ts:185`, `model.ts:370` | holds by reading; look |
| C15 | the row passes in both orders | `Tests  6 passed / 14 skipped (20)` |
| C16 | band in a float's 6 px margin; sash above the isolated pane | holds by reading; look |
| C17 | `carrying={own >= 0}` `PaneView.svelte:433` | holds by reading; look |
| C18 | `.rows` on `var(--panel)` `:389` | holds by reading; look |
| C19 | `paneItems` Show Tab Row; `stripPick`, `isPaneItem`, `pick` | holds by reading; look |
| C20 | see below | holds by reading |
| C21 | `menuClosing` gives focus back before the pick; `keyed` set by the ring | holds by reading; look |

C20: `hide-tab-row` and `show-tab-row` are non-empty and distinct. Neither equals or starts with an id or prefix in `pane-view.ts` or `strip/open-view.svelte.ts` (`open-view:`, `open-view-list`, `open-view-group:`). `isFloatItem` (`:313-324`) matches neither. `isPaneItem` (`:223-225`) matches both.

## What the look on landing should show (TEST page)

- **A pane of a page:**
  - The `...` menu ends with Hide Tab Row.
  - Picked by the pointer, the row and path bar go and the view starts at the pane's top.
  - The pointer at the top 4 px brings them back over the view, and the view keeps its size.
  - Moving off them hides them.
- **The `...` menu from the shown row:** it ends with Show Tab Row, and while it is open, with the pointer in the list, the row stays.
- **A pane showing a PDF:**
  - With the row out of view, the frame's top 4 px are clipped and show the pane's background, since the band lies over them.
  - With the row shown, the frame is clipped down to the row's bottom edge, and the row and bar are pressable over it.
  - The bar's open-PDF menu opened from the shown row keeps the row and the clip while the pointer is in its list. When the menu closes with the pointer away, the row hides.
- **A Document tab and an App tab:** the same clip as the PDF.
- **Two panes:** hiding one leaves the other alone. A reload keeps it, and `~/.oculus/layouts.json` holds `"rowHidden": true` on that pane only.
- **A free float:**
  - The item is last in its menu, and the row shows at its top edge.
  - A drag of the shown strip's empty part moves the float.
  - A press on its 6 px edge resizes it, and so does a press on a docked float's sash.
- **`editor_actions: hidden`:** the item is in the strip's right-click menu. An empty pane's body right-click offers Show Tab Row while its row is hidden.
- **The keyboard:**
  - Tab into a hidden pane's strip shows the row, and Tab out hides it.
  - Enter on Hide Tab Row in the `...` menu keeps the row while the focus is on the opener.
  - A pointer click on a tab, then the pointer down into the view, hides the row.
- **Tab drags:** a tab dragged from another pane to the hidden pane's top edge shows the row, and a drop on the strip lands there. A tab dragged out of a shown row keeps it shown until the drop.
- **A wallpaper:** the shown row is readable over the view.
- **A pane never hidden:** it draws as before.

## Verify lines (after the last change of round 1)

1. `npm run diagrams`, then `npm run format` (every file unchanged), then `npm run test:quick` once:
```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.1 s)
ok      svelte-check (11.9 s): 1792693104695 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (12.4 s)
ok      vitest slow (31.7 s): Duration  18.03s (transform 8.75s, setup 0ms, import 11.29s, tests 6.50s, environment 0ms)
ok      vitest (44.5 s): Duration  30.99s (transform 65.18s, setup 0ms, import 107.76s, tests 1.68s, environment 429ms)
ok      vitest checks (45.5 s): Duration  31.79s (transform 26.44s, setup 0ms, import 33.49s, tests 38.20s, environment 1ms)
test:quick: 47.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
2. G29 `-t "reads"`: `Tests  6 passed (6)`. G102 `-t "two browser tabs that change the panes"`: `Tests  6 passed | 14 skipped (20)`. Their failures on the unchanged tree are quoted above.
3. The ASCII check (the brief's perl form) over every changed file except the `.svg`s, plus this report: it printed nothing, `ascii exit 0`.
4. Sizes:
   - `wc -l`: `PaneView.svelte` 513, `PaneStrip.svelte` 469, `pane-view.ts` 649, `FrameLayer.svelte` 332, `layout.svelte.ts` 864.
   - `ls src/lib/shell/panes | wc -l` gives 10, and `ls src/lib/shell/panes/strip | wc -l` gives 10.
   - Lines over 100 columns in `PaneStrip.svelte` are only the three `eslint-disable-next-line` comments (`:271`, `:277`, `:320`), two of them base lines reindented.
5. `sh utils/unused-exports.sh` (exit 0), diffed with the base list. No line is added; one line is shorter because `pane-view.ts` now imports `Drop` and `Dragging`:
```
322c322
< src/lib/state/workbench/drag.svelte.ts: Drop, DragSink, DragKind, Dragging
---
> src/lib/state/workbench/drag.svelte.ts: DragSink, DragKind
```
6. The history-word grep over the added lines of `src tests config docs/HELP.md docs/apps.md` has two hits, and neither is history:
   - `pane-view.ts` "picked before the items" is about the order of the checks.
   - `model.ts` "dragged onto it still goes in" is the base sentence on a locked pane, rewrapped.

Files changed (`git diff --numstat 87e9c76c`; `diff -rq` against `migration-O51-base` lists the same `src`, `tests` and `config` files and nothing in `utils`):

| File | + | - |
| --- | --- | --- |
| `src/lib/shell/frames/FrameLayer.svelte` | 32 | 3 |
| `src/lib/shell/panes/PaneView.svelte` | 118 | 122 |
| `src/lib/shell/panes/pane-view.ts` | 127 | 19 |
| `src/lib/shell/panes/strip/PaneStrip.svelte` | 193 | 40 |
| `src/lib/state/workbench/layout/index.ts` | 1 | 0 |
| `src/lib/state/workbench/layout/model.ts` | 14 | 9 |
| `src/lib/state/workbench/layout/saved/rerun.ts` | 1 | 0 |
| `src/lib/state/workbench/layout/saved/saved.ts` | 8 | 4 |
| `src/lib/state/workbench/layout/tree.ts` | 17 | 2 |
| `src/lib/state/workbench/layout.svelte.ts` | 9 | 0 |
| `src/lib/ui/menu/ContextMenu.svelte` | 16 | 5 |
| `src/lib/ui/menu/Menu.svelte` | 8 | 5 |
| `tests/state/workbench/layout/saved/layout-saved.test.ts` | 30 | 0 |
| `tests/state/workbench/layout/saved/layout-workspaces.test.ts` | 12 | 2 |
| `config/text/ui.yml` | 2 | 0 |
| `docs/HELP.md` | 1 | 0 |
| `docs/apps.md` | 1 | 1 |
| `docs/diagrams/layer-shell.dot`, `.svg`, `layers.dot`, `.svg` | 6 | 6 |

Edits to existing test lines: only `panesOf` in `layout-workspaces.test.ts`, and no assertion, allow list or predicate changed.
- Before: `return folded.includes(at) ? \`${name} folded\` : name;`
- After: `const shown = folded.includes(at) ? \`${name} folded\` : name;` and `return node.kind === 'pane' && node.rowHidden === true ? \`${shown} hidden\` : shown;`

## The saved field

The four readings are the C10 row (`saved.ts:387`):
- `rowHidden: true` reads as `rowHidden: true`.
- `rowHidden: false` reads without the field.
- `rowHidden: "yes"` reads without the field.
- A pane with no field reads without the field.

A pane read without the field shows its row. Showing the row again deletes the field (`tree.ts:390-391`).

## Judgment calls

1. **The strip's right-click `ContextMenu` moved from `PaneView.svelte` into `PaneStrip.svelte`** (props `menuRead`, `onmenupick`), so the strip holds that menu's open state. The strip's content now sits under three `display: contents` boxes while the row shows (`.context` > `.top` > `.rows`), where it sat under one (`.context`). A grep finds no selector or DOM walk that depends on the strip's parent.
2. **`PaneView.svelte` computes `stripShape` and passes it down as `shape`**, replacing `locked`, because ruling 4 needs it for the pane menu.
3. **`HIDE_TAB_ROW`, `SHOW_TAB_ROW`, `PAGE`, `EMBED`, `TopRow` and `PaneDeps` are local**, because nothing outside `pane-view.ts` reads them (spec.md's export rule, Verify 5).
4. **`setRowHidden` is a separate function parallel to `setLocked`**, because a shared helper needs `delete next[flag]`, which `no-dynamic-delete` refuses.
5. **A right-click on the band or the shown row** opens the strip's right-click menu, and the row stays shown while it is open.
6. **The HELP bullet names every condition the code keeps the row for**, which is more than the brief's four points.
7. **The open-menu watch reads the DOM mark bits-ui sets**, as the repair brief asks. spec.md prefers state to a DOM read; the round-1 brief rules on this one. It runs only while the row is hidden, so a pane never hidden has no observer.
8. **No caller binds `Menu.svelte`'s `open` any more.** The watch covers the `...` list, so `listOpen` went. The bindable stays as ruling 246 asks, and `ContextMenu.svelte`'s is bound by the strip. The coordinator decides between:
   - (a) Keep it as ruled. This is my recommendation: one prop, and it is how a caller learns the list is open.
   - (b) Take it back out of `Menu.svelte`. This is cheaper to read but goes against the ruling.

## Limitations

- **Not seen on screen:** every behaviour of item 5, rulings 1 to 3 and round-1 item 1 rests on reading and on the look at landing.
- **One frame late:** the frame clip follows the row one animation frame late, because the frame layer places frames once per `requestAnimationFrame`.
- **The 4 px band:** it takes the top 4 px of a hidden pane's view for the pointer. Over a frame, those 4 px are clipped (`docs/apps.md:84`).
- **C21:** it rests on the browser marking the restored focus `:focus-visible` after a pick by Enter. Not verified on screen.
- **Pointer resting on the row:** a row hidden by a key while the pointer rests on it stays shown until the pointer moves off.
- **`show_tabs: none` with `editor_actions: hidden`:** a pane with no lock and no path bar offers neither item. Its saved `rowHidden` is kept and applies again when a row or a path bar returns.
- **Menus not drawn by a `Menu` trigger:** a menu in the row or path bar keeps the row shown only when its trigger carries `[aria-haspopup][aria-expanded='true']`. Every `Menu` and bits-ui dropdown does. A view-made popup without that mark would not keep the row.
- **Stacking:** a hidden pane and its body are stacking contexts. So a view's own z-indexed element at the pane's edge, which in a pane never hidden could paint over a neighbouring sash's reach, stays under it in a hidden pane. Elements portalled to the body (menus, Monaco's overflow widgets) are not affected.
