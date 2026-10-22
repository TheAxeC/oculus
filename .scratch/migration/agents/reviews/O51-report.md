# O51 report: a per-pane Hide Tab Row in the pane menu

Everything in the brief is done, under the cases ruling `agents/briefs/O51-cases.md` (round 0). Cases C1 to C9, C11 to C14, C16 to C19 and C21 are on screen: each is checked here by reading the lines it runs through, and its proof is the look on landing on TEST, against "Before and after" below.

## DONE / NOT DONE

| Deliverable | Status | Proof (last line of the run) |
| --- | --- | --- |
| Item 1, the menu items, ids, keys, `PANE_ONLY`, the pick | DONE | `npm run test:quick`: `test:quick: 81.6 s; every command passed` |
| Item 2, `rowHidden` on `Pane`, `repane`, `keptPane`, `setRowHidden`, `hideTabRow`, `readPane` | DONE | Verify 2, G29 row: `Tests  6 passed (6)` |
| Item 3, `PATH_OPERATIONS` row and G102 row | DONE | Verify 2, G102: `Tests  6 passed / 14 skipped (20)` |
| Item 4, bindable `open` on `Menu.svelte` and `ContextMenu.svelte` | DONE | svelte-check in the list: `0 ERRORS 0 WARNINGS` |
| Item 5, the hidden row and its edge | DONE (on screen: the look) | read below; the list green |
| Item 6, sizes and folders | DONE | `wc -l`: `PaneView.svelte` 513, `layout.svelte.ts` 864; `ls src/lib/shell/panes | wc -l` 10, `ls src/lib/shell/panes/strip | wc -l` 10 |
| Item 7, comments and the help bullet | DONE | read below |
| Item 8, the G29 row | DONE | Verify 2 |
| Item 9, diagrams regenerated | DONE | `npm run diagrams` printed the eleven files; `docs/diagrams/layer-shell.*` and `layers.*` changed (import counts) |
| Ruling 1, the frame clip in `FrameLayer.svelte` | DONE (on screen: the look) | read below |
| Ruling 2, the stacking | DONE (on screen: the look) | read below |
| Ruling 3, the sash's press | DONE (on screen: the look) | read below |
| Ruling 4, no item on a pane with nothing at its top | DONE | `topRow`, `pane-view.ts:108-111` |

Runs: the verify list (`npm run diagrams`, `npm run format`, `npm run test:quick`) once, green the first time. Whole-suite commands: none. Scoped runs while working: the two saved-layout files, `armed-keep.client.test.ts`, eslint and svelte-check over the changed files.

## First run of every case on the unchanged tree

Product code unchanged at this run (only the two test files carried the new rows). `grep -rn "hide-tab-row\|show-tab-row\|rowHidden" src config --exclude=local.yml` printed nothing, `grep exit 1`.

| Case | Lines read on the unchanged tree | Result |
| --- | --- | --- |
| C1 | `paneMenu`, `pane-view.ts:134-167`: last item Move into New Window (`:163-165`), else Float (`:162`), else Split Down (`:161`) | no Hide Tab Row; fails |
| C2 | `PaneStrip.svelte:147-177` draws the row and path bar in the pane's column; `PaneView.svelte:439-480` puts the body under them | no hidden row, no edge band; fails |
| C3 | `Menu.svelte:131`, `ContextMenu.svelte:49`: `let open = $state(false)`, handed to no caller | open state unreadable; fails |
| C4 | `Pane`, `model.ts:59-68`: `recent`, `keeps`, `locked`, `added`, `documents` | no per-pane field; fails |
| C5 | `readPane`, `saved.ts:382-391`: reads `locked`, `added`, `documents` | `rowHidden` not read; fails |
| C6 | `floatMenu`, `pane-view.ts:284-295`: Close, `floatItems`, `moveChoice` | no Hide Tab Row; fails |
| C7 | `PANE_ONLY`, `pane-view.ts:174`; `stripMenu` `paneOnly`, `:331-333` | no hide ids; fails |
| C8 | no hidden row exists | fails |
| C9 | no hidden row exists | fails |
| C10 | test row, quoted below | fails |
| C11 | `stripShape`, `strip-shape.ts:39-67`: tabs, title or none | no hidden state; fails |
| C12 | `paneMenu` `:151-166`, `floatMenu` `:290-294`, `stripMenu` `:346-398` | the baseline; holds |
| C13 | `pick`, `PaneView.svelte:414` returns for `active === ''` | no hide item; fails |
| C14 | `keptPane`, `tree.ts:179-187`: copies `added`, `locked`, `documents` | no field to keep; fails |
| C15 | test row, quoted below | fails |
| C16 | `GRAB_PX = 6`, `float-gesture.ts:47`, used at `:126`; sash `FloatLayer.svelte:144` | resizes hold; no band; fails for the band part |
| C17 | no row shown at the edge exists | fails |
| C18 | `.path` on a wallpaper `PaneStrip.svelte:257-260`; tab strip `Tabs.svelte:400-406` | no row over a view; fails |
| C19 | `PaneBody.svelte:336-342` with `stripItems` from `PaneView.svelte:471-480` | no Show Tab Row; fails |
| C20 | `isFloatItem` `pane-view.ts:267-278`, `isPaneItem` `:177-179` | the ids do not exist; fails |
| C21 | no hidden row exists | fails |

C10 on the unchanged tree, `npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts -t "reads" --reporter=verbose`:

```
 x |unit| tests/state/workbench/layout/saved/layout-saved.test.ts > a saved envelope of the current version > reads 'the current version with a pane whose...' 4ms
   -> expected [ { root: { kind: 'split', ...(3) } } ] to deeply equal [ { root: { kind: 'split', ...(3) } } ]
-           "rowHidden": true,
      Tests  1 failed | 5 passed (6)
```

C15 on the unchanged tree, `npx vitest run tests/state/workbench/layout/saved/layout-workspaces.test.ts -t "two browser tabs that change the panes" --reporter=verbose`:

```
 x |unit| ... 'a hide of the tab row of a pane the o...', 'the first' applied first 11ms
   -> client.layout.hideTabRow is not a function
 x |unit| ... 'a hide of the tab row of a pane the o...', 'the second' applied first 6ms
   -> client.layout.hideTabRow is not a function
      Tests  2 failed | 4 passed | 14 skipped (20)
```

The first run found that the rule of item 5 fails for a pane showing a frame (a PDF, a Document, an App tab): the frame layer draws every frame above the page area, so the band and the shown row lay under the frame. That was handed back; the cases ruling settled it with option (a), the frame clip (ruling 1 below).

## What changed, per item

1. `src/lib/shell/panes/pane-view.ts`: `HIDE_TAB_ROW = 'hide-tab-row'` and `SHOW_TAB_ROW = 'show-tab-row'` beside `MOVE_LIST` (`:94-95`); `TopRow` (`'shown' | 'hidden' | 'none'`) and `topRow(shape, barred, hidden)` (`:108-111`); `rowItems` (`:114-119`). `paneMenu` takes `row` and ends with `...rowItems(facts.row, t)` (`:203`), after Move into New Window; `floatMenu(place, pages, t, windows, row)` ends with it too (`:342`). `PANE_ONLY` holds both ids (`:212-220`), so `isPaneItem` (`:223`) matches them and `stripMenu`'s `paneOnly` carries them under `editor_actions: hidden`. The pane menu's pick, all but Close and the float items, is `panePicked` (`:364-385`): Maximise, Restore, Fold, Hide or Show Tab Row and Show a Page run before the items that need the active tab, so a pane with no tab hides and shows its row. `config/text/ui.yml` gains `pane_hide_tab_row: Hide Tab Row` (`:51`) and `pane_show_tab_row: Show Tab Row` (`:57`). `PaneView.svelte` `pick` (`:403-407`): float items to `stripPick`, Close to `closeAll` (`:393-401`, its question unchanged), the rest to `panePicked` with the layout store; a float's pick reaches `hideTabRow` with the float's id as its page, which `change` writes through `at(page)` and `writeHost` as it does `lockPane`.
2. `model.ts`: `rowHidden?: true` on `Pane` (`:69`), its doc comment saying what it does (`:53-56`); `repane` carries it (`:370`), its doc names it. `tree.ts`: `keptPane` carries it (`:185`), its doc names it; `setRowHidden` beside `setLocked` (`:381-393`), deleting the field to show the row. `index.ts` exports `setRowHidden` (`:62`). `layout.svelte.ts`: `hideTabRow(path, hidden, page?)` typed (`:208`), defined through `change` (`:687-690`), returned (`:829`). `saved.ts`: `readPane` reads `value.rowHidden === true` alone (`:386-387`); the head comment names the field (`:19-25`).
3. `rerun.ts:42`: `hideTabRow: { path: 0, page: 2 }`. `layout-workspaces.test.ts`: the row `a hide of the tab row of a pane the other tab moved lands on that pane`, `panesOf` marking ` hidden`.
4. `Menu.svelte`: `open = $bindable(false)` (`:129`), still bound to bits-ui (`:156`), a prop doc, the head comment saying a caller may bind it. `ContextMenu.svelte`: the same (`:59`, `:144`). Every caller that does not bind it is unchanged (the default is the closed state the inner `$state` had).
5. `PaneStrip.svelte`: the strip's top is `div.top` holding `div.rows` (the tab row or title row and the path bar), both `display: contents` while the row shows, so a never-hidden pane lays out as before (`:326-329`). While `hidden`: `.top` is a block of height 0 at `z-index: 1` (`:336-342`), the band `div.edge` is 4 px along the pane's top (`:219-221`, `:346-352`), and `.rows` is laid over the view on `var(--panel)`, moved up by `translateY(-100%)` and clipped by the pane's box (`:356-369`). The row stays mounted and in the focus order (only the band has an `{#if}`). It shows while `showing` (`:157-159`) holds: `pointed` (pointer enter and leave on `.top`, `:214-215`), `menuOpen` (the right-click menu, now drawn by the strip, bound at `:207`), `listOpen && shape.actions` (the `...` list, bound at `:319`, counted only while the row draws it), `keyed` (`focusIn`, `:166-168`, reads the focus ring `:focus-visible` of the focused control; `focusOut`, `:171-174`), or `carrying` (a tab of this pane being dragged, `PaneView.svelte:433`). The pane decides `hidden` only while it draws a row or a path bar (`topRow`), so a `none` row hides its path bar alone.
6. `PaneView.svelte` is 513 lines. To stay at 520 the pane menu's pick went to `panePicked` and the strip's drag-hover rule to `stripHovered` (`pane-view.ts:625-638`, `PaneView.svelte:383-386`), both in `pane-view.ts`, whose head comment names them. No file was made or moved; the two pane folders keep ten items.
7. Comments made true and rewrapped at 100 columns: `PaneStrip.svelte` head (`:25-37`), `PaneView.svelte` head (the pane menu `:25-29`, the top row `:31-42`, the strip menu `:54-55`), `pane-view.ts` head (`:1-7`) and the docs of `paneMenu`, `floatMenu`, `PANE_ONLY`, `repane`, `keptPane`, `Menu.svelte`, `ContextMenu.svelte`, `FrameLayer.svelte` head (`:24-30`). `docs/HELP.md:69`, after the Float bullet: "Hide Tab Row (pane menu) hides that pane's tab row and its path bar, so the view fills the pane; they show while the pointer is at the pane's top edge, while a menu opened from them is open, and while the keyboard's focus is in them. With `editor_actions: hidden` the item is in the strip's right-click menu. Show Tab Row brings the row back. A pane that draws no tab row and no path bar does not offer it."
8. `layout-saved.test.ts`: the row `the current version with a pane whose tab row is hidden` (four panes: `rowHidden` `true`, `false`, `"yes"`, absent), `QUARTERS` and `hiddenPane`.
9. `npm run diagrams` before the list.

Ruling 1, the frame clip: `FrameLayer.svelte` `coveredTop` (`:78-86`) finds the slot's pane (`[data-pane]`) and its own box marked `data-pane-top` (the band while the row is out of sight, `PaneStrip.svelte:220`; the shown rows, `:222`), and `place()` writes `clip-path: inset(<cut>px 0 0 0)` (`:123`), the cut part of the place key (`:98-110`). A pane never hidden marks no box, so the cut is 0 and `clipPath` is the empty inline value, which draws as before. The frame keeps its size and its document.

Ruling 2, the stacking: `PaneView.svelte:509-512`, on a pane whose row is hidden only, the pane and its body (`[data-pane-body]`) are `isolation: isolate`, so the view's own depths stay inside the body and the top at `z-index: 1` stands over them.

Ruling 3, the sash: the hidden pane being a stacking context of its own, a sash at `z-index: 1` outside it (a split's, or a docked float's, `Sash.svelte:115`) paints and takes the press above everything inside the pane, the band included, within its reach.

Ruling 4: `topRow` gives `none` when the shape's row is `none` and there is no path bar, and `rowItems('none')` is empty, so neither item is offered there; the saved `rowHidden` stays and draws as hidden whenever the settings give the pane a row or a path bar again.

## Cases, before and after

| Case | Before | After: lines it runs through | Result after |
| --- | --- | --- | --- |
| C1 | no item | `paneMenu` `:203` last; pick `PaneView.svelte:406` to `panePicked:373-374`, `hideTabRow`; next open: `row` `PaneView.svelte:268-274` gives `hidden`, `rowItems` Show Tab Row | holds by reading; look |
| C2 | no hidden row | `.top.hidden` height 0 (`PaneStrip.svelte:336`), band `:346-352`, `pointed` `:214`, `.shown .rows` `:367`; rows absolute, so the body keeps its size | holds by reading; look |
| C3 | open not readable | `listOpen` `:319`, `menuOpen` `:207` in `showing` `:157-159`; a pointer pick gives the focus back without a ring, so `keyed` stays false | holds by reading; look |
| C4 | no field | `setRowHidden` sets one pane's field (`tree.ts:386-393`); `row` per `PaneView` | holds by reading; look |
| C5 | not saved | `change` saves; `readPane` `saved.ts:387`; C10 row green | holds; look |
| C6 | no item | `floatMenu` `:342`; float pick to `panePicked`; strip `[data-tab-strip]` drawn in `.rows`, so `float-gesture.ts`'s `allowFrom` still matches | holds by reading; look |
| C7 | no item | `PANE_ONLY` `:212-220` into `stripMenu`'s `paneOnly`; `stripPick` `isPaneItem` to `pick` (`PaneView.svelte:315-319`) | holds by reading; look |
| C8 | no hidden row | `focusIn` `:166-168` sets `keyed` from the ring; `focusOut` `:171-174` clears it | holds by reading; look |
| C9 | no hidden row | frames take no pointer during a drag (`FrameLayer.svelte` `inert`); `pointerenter` on the band (the drag uses document listeners, no capture); `Tabs`' `onhoverindex` reports the index | holds by reading; look |
| C10 | fails (quoted) | the row passes | `Tests  6 passed (6)` |
| C11 | row by shape | the rows drawn are `stripShape`'s, now read in `PaneView.svelte:263-266` and handed down; the lock mark from `shape.lock`; `none` with no path bar: `topRow` `none`, nothing hidden | holds by reading; look |
| C12 | baseline | `paneMenu` and `floatMenu` gain only the last item; `stripMenu` changes only by its `paneOnly` group under `hidden`; `.top` and `.rows` are `display: contents` while the row shows | holds by reading; look |
| C13 | no item, returns at `active === ''` | `holdsTab` false, `row` `shown`; `panePicked:373` before the active-tab items | holds by reading; look |
| C14 | no field | `keptPane` `tree.ts:185`, `repane` `model.ts:370` | holds by reading; look |
| C15 | fails (quoted) | the row passes in both orders | `Tests  6 passed / 14 skipped (20)` |
| C16 | resizes | the band inside a free float's 6 px margin hears hover; interactjs reads the margin from the float element, so a press there resizes; a docked float's sash is outside the isolated pane and above it | holds by reading; look |
| C17 | no row | `carrying={own >= 0}` (`PaneView.svelte:433`) keeps `showing` until `dragging()` ends | holds by reading; look |
| C18 | no row over a view | `.rows` on `var(--panel)` (`PaneStrip.svelte:363`); the strip and path bar's own wallpaper fills lie on it | holds by reading; look |
| C19 | no item | `stripItems` with `paneItems` holding Show Tab Row under `hidden`; `PaneBody` hands the pick to `stripPick`, `isPaneItem`, `pick` | holds by reading; look |
| C20 | ids absent | see below | holds by reading |
| C21 | no row | the menu answers a pick once the focus is back (`menu-items.ts` `menuClosing`); after a pick by Enter the opener's focus has its ring, so `keyed` is true when `hideTabRow` runs, and `focusOut` clears it | holds by reading; look |

C20: `hide-tab-row` and `show-tab-row` are non-empty and distinct. Neither equals or starts with any id or prefix of `pane-view.ts` (`page:`, `embed:`, `move-to-page`, `show-a-page`, `close`, `maximise`, `restore`, `fold`, `split_right`, `split_down`, `split-up`, `split-down`, `split-left`, `split-right`, `float`, `float-free`, `float-return`, `window-pane`, `window-float`, `float-restore`, `switch-main`, `dock-left`, `dock-right`, `dock-bottom`, `open-file`, `new-terminal`, `new-text-file`, `lock`, `unlock`, `tab-bar`, `tab-bar:`, `actions-at`, `actions-at:`) or of `strip/open-view.svelte.ts` (`open-view:`, `open-view-list`, `open-view-group:`, `:31-37`). `isFloatItem` (`:313-324`) compares with the float ids alone, so it matches neither; `isPaneItem` (`:223-225`) matches both through `PANE_ONLY`.

What the look on landing should show, on TEST:

- A pane of a page, default settings: the `...` menu ends with Hide Tab Row. Picked by the pointer, the row and path bar go and the view starts at the pane's top. The pointer at the pane's top 4 px brings them back over the view, the view not resized (a terminal keeps its lines). Moving down off them hides them.
- The `...` menu opened from the shown row now ends with Show Tab Row. While it is open, with the pointer moved into the list, the row stays.
- Repeat on a pane showing a PDF, a Document and an App tab. The row must show over the frame and be pressable.
- Two panes: hiding one leaves the other alone. A reload keeps it, and `~/.oculus/layouts.json` holds `"rowHidden": true` on that pane only.
- A free float: the item is last in its menu, the row shows at its top edge, and a drag of the shown strip's empty part moves it. A press on its 6 px edge resizes, and so does a press on a bottom-docked float's sash.
- `editor_actions: hidden`: the item is in the strip's right-click menu. An empty pane's body right-click offers Show Tab Row while its row is hidden.
- The keyboard: Tab into a hidden pane's strip shows the row, and Tab out hides it. Enter on Hide Tab Row in the `...` menu keeps the row while the focus is on the opener.
- A tab dragged from another pane to the hidden pane's top edge shows the row, and a drop on the strip lands there. A tab dragged out of a shown row keeps it shown until the drop.
- A wallpaper: the shown row is readable over the view.
- A pane never hidden draws as before.

## Verify lines (after the last change)

1. `npm run diagrams` printed the diagram files, then `npm run format` (no change), then `npm run test:quick` once:
```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (16.1 s)
ok      vitest slow (38.8 s): Duration  23.00s (transform 11.92s, setup 0ms, import 14.76s, tests 8.02s, environment 0ms)
ok      svelte-check (61.3 s): 1792691703410 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (67.3 s): Duration  51.51s (transform 41.96s, setup 0ms, import 51.25s, tests 63.59s, environment 1ms)
ok      vitest (79.2 s): Duration  63.78s (transform 173.66s, setup 0ms, import 227.59s, tests 1.86s, environment 1.36s)
test:quick: 81.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
2. G29: every row of 'reads $name' passes, the new one last: `reads 'the current version with a pane whose...' 0ms`, `Tests  6 passed (6)`. G102: `'a hide of the tab row of a pane the o...', 'the first' applied first 32ms`, `'the second' applied first 41ms`, the two fold rows in both orders passing, `Tests  6 passed | 14 skipped (20)`. Each new row's failure on the unchanged tree is quoted above.
3. The ASCII gate over the sixteen files the step changes, `FrameLayer.svelte` included: prints nothing, `ascii exit 0`.
4. `wc -l`: `pane-view.ts` 649, `PaneView.svelte` 513, `PaneStrip.svelte` 443, `FrameLayer.svelte` 332, `model.ts` 431, `tree.ts` 584, `index.ts` 147, `layout.svelte.ts` 864, `saved.ts` 670, `rerun.ts` 251, `Menu.svelte` 198, `ContextMenu.svelte` 169. No folder gains a file.
5. `sh utils/unused-exports.sh` against the base list: no line added; one line shorter, `src/lib/state/workbench/drag.svelte.ts: DragSink, DragKind` (was `Drop, DragSink, DragKind, Dragging`, since `pane-view.ts` now imports `Drop` and `Dragging`). The four exports the step first left without an importer outside `pane-view.ts` (`PAGE`, `EMBED`, `HIDE_TAB_ROW`, `SHOW_TAB_ROW`) were made local.
6. History words over the comment lines and test titles added or changed: two hits. `pane-view.ts`, "so those are picked before the items": the order of the checks in `panePicked`, not history. `model.ts:53`, "dragged onto it still goes in": the base sentence about a locked pane, rewrapped, about behaviour. Neither is history.
7. The cases: the table above.

Files changed (`diff -rq` against `.agents/worktrees/migration-O51-base/` over `src`, `tests`, `utils`, `config`; `docs` from `git status --short`), lines added and removed:

| File | + | - | In the write list |
| --- | --- | --- | --- |
| `src/lib/shell/frames/FrameLayer.svelte` | 32 | 3 | by ruling 1 |
| `src/lib/shell/panes/PaneView.svelte` | 118 | 122 | yes |
| `src/lib/shell/panes/pane-view.ts` | 127 | 19 | yes |
| `src/lib/shell/panes/strip/PaneStrip.svelte` | 166 | 39 | yes |
| `src/lib/state/workbench/layout/index.ts` | 1 | 0 | yes |
| `src/lib/state/workbench/layout/model.ts` | 14 | 9 | yes |
| `src/lib/state/workbench/layout/saved/rerun.ts` | 1 | 0 | yes, line 42 |
| `src/lib/state/workbench/layout/saved/saved.ts` | 8 | 4 | yes |
| `src/lib/state/workbench/layout/tree.ts` | 17 | 2 | yes |
| `src/lib/state/workbench/layout.svelte.ts` | 9 | 0 | yes |
| `src/lib/ui/menu/ContextMenu.svelte` | 16 | 5 | yes |
| `src/lib/ui/menu/Menu.svelte` | 8 | 5 | yes |
| `tests/state/workbench/layout/saved/layout-saved.test.ts` | 30 | 0 | yes |
| `tests/state/workbench/layout/saved/layout-workspaces.test.ts` | 12 | 2 | yes, in 241-283 |
| `config/text/ui.yml` | 2 | 0 | yes, lines 51 and 57 |
| `docs/HELP.md` | 1 | 0 | yes, line 69 |
| `docs/diagrams/layer-shell.dot`, `.svg`, `layers.dot`, `.svg` | 7 | 6 in all | yes, by `npm run diagrams` |

`PaneView.svelte`'s large count is the `crumbs` block moved above the derived values that read it and the strip's props reindented when its `ContextMenu` moved into `PaneStrip.svelte`.

Edits to existing test lines (no assertion, allow list or predicate changed): `layout-workspaces.test.ts` `panesOf`, before `return folded.includes(at) ? \`${name} folded\` : name;`, after `const shown = folded.includes(at) ? \`${name} folded\` : name;` and `return node.kind === 'pane' && node.rowHidden === true ? \`${shown} hidden\` : shown;`; its doc comment names the hidden mark. Everything else in both test files is added.

## The saved field

- A saved pane with `rowHidden: true` reads with `rowHidden: true`.
- A pane with `rowHidden: false` reads without the field.
- A pane with `rowHidden: "yes"` reads without the field.
- A pane with no `rowHidden` reads without the field.

These four readings are the C10 row (`saved.ts:387`). A pane read without the field shows its row. Showing the row again deletes the field (`tree.ts:390-391`), so a pane never hidden and a pane shown again read the same.

## Judgment calls the brief did not cover (each reversible)

1. The strip's right-click `ContextMenu` moved from `PaneView.svelte` into `PaneStrip.svelte` (props `menuRead`, `onmenupick`), so the strip holds that menu's open state itself, beside the `...` list's; the pane still decides the items and the picks. The DOM is the same two wrappers deep, both `display: contents`.
2. `PaneView.svelte` reads the strip's shape (`stripShape`) and hands it to `PaneStrip.svelte` (prop `shape`, replacing `locked`), since ruling 4 makes the pane menu depend on whether the pane draws a row or a path bar; the strip still calls `useStripActions` for its hand-up.
3. `HIDE_TAB_ROW` and `SHOW_TAB_ROW` are module constants beside `MOVE_LIST`, not exported: item 1 says "exported", but nothing outside `pane-view.ts` reads them and Verify 5 refuses a new unused export. `PAGE` and `EMBED` became local for the same reason once the pick moved.
4. `setRowHidden` is written as `setLocked` is, two parallel eight-line functions: a shared helper needs `delete next[flag]`, which the lint refuses (`@typescript-eslint/no-dynamic-delete`).
5. A right-click on the band or the shown row opens the strip's right-click menu (the band is inside its wrapper), and that keeps the row shown.
6. The help bullet also names the menus and the keyboard keeping the row, and the pane that offers neither item, beyond the four points the brief lists.
7. The edits were made by exact-string replacements (each asserting a single match) and the Edit tool; no script file was written.

## Wrong in the brief, and limitations

- The brief's item 5, built as written, left a pane showing a frame unusable; ruled as above (ruling 1).
- The base copy named by the brief held only `unused-exports.txt` at the first run; ruled (ruling 5).
- Item 1's "exported constants" is at odds with Verify 5; judgment call 3.
- On screen, nothing here is seen: every behaviour of item 5 and rulings 1 to 3 rests on reading and on the look on landing.
- The frame clip follows the row one animation frame late: the frame layer reads places once per animation frame (`FrameLayer.svelte`, the `requestAnimationFrame` loop), so a frame covers a freshly shown row for one frame.
- The band takes the top 4 px of a hidden pane's view for the pointer (decision 6): a press there lands on the band or the shown row, never on the view's first line.
- `keyed` reads the browser's own answer for a focus ring (`:focus-visible`), including for the focus a closing menu gives back. A browser that marks the opener's focus differently after a pick by Enter changes C21. Not verified on screen.
- A pane whose row is hidden and whose pointer rests over the row when it hides (the pick made by key with the mouse left on the row) stays shown until the pointer moves off.
- Under `show_tabs: none` with `editor_actions: hidden`, a pane with no lock and no path bar draws nothing at its top and offers neither item (ruling 4); a saved `rowHidden` there is kept and applies when a row or a path bar returns.
- A hidden pane and its body are stacking contexts, so a view's own raised element (a Monaco widget) inside a hidden pane no longer paints over a neighbouring sash's reach, as it could before in a pane never hidden.
