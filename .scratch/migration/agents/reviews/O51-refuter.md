# Refutation of O51

## Verification lines

1. `npm run test:quick -- --base 87e9c76c` (worktree root):
```
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.8 s)
ok      svelte-check (8.3 s): 1792692143862 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (24.2 s): Duration  14.50s (transform 6.19s, setup 0ms, import 8.00s, tests 6.35s, environment 0ms)
ok      vitest checks (37.5 s): Duration  27.77s (transform 20.73s, setup 0ms, import 25.92s, tests 35.49s, environment 1ms)
ok      vitest (38.3 s): Duration  28.57s (transform 65.92s, setup 0ms, import 99.34s, tests 1.84s, environment 299ms)
test:quick: 40.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
2. `npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts -t "reads" --reporter=verbose`: six rows passed, the last `reads 'the current version with a pane whose...' 0ms`; `Tests  6 passed (6)`.
   `npx vitest run tests/state/workbench/layout/saved/layout-workspaces.test.ts -t "two browser tabs that change the panes" --reporter=verbose`: `'a hide of the tab row of a pane the o...', 'the first' applied first 26ms`, `'the second' applied first 26ms`, the four fold rows passing; `Tests  6 passed | 14 skipped (20)`.
3. ASCII gate (the brief's perl form) over the brief's fifteen files plus `src/lib/shell/frames/FrameLayer.svelte`, `docs/diagrams/layer-shell.dot` and `docs/diagrams/layers.dot`: printed nothing, `ascii exit 0`.
4. `wc -l`: pane-view.ts 649, PaneView.svelte 513, PaneStrip.svelte 443, FrameLayer.svelte 332, model.ts 431, tree.ts 584, index.ts 147, layout.svelte.ts 864, saved.ts 670, rerun.ts 251, Menu.svelte 198, ContextMenu.svelte 169, layout-saved.test.ts 179, layout-workspaces.test.ts 313. `ls src/lib/shell/panes | wc -l` 10, `ls src/lib/shell/panes/strip | wc -l` 10.
5. `sh utils/unused-exports.sh` (exit 0) diffed with `../migration-O51-base/unused-exports.txt`: one line changed, no line added:
```
322c322
< src/lib/state/workbench/drag.svelte.ts: Drop, DragSink, DragKind, Dragging
---
> src/lib/state/workbench/drag.svelte.ts: DragSink, DragKind
```
6. `git diff 87e9c76c -- src tests config docs/HELP.md | grep "^+" | grep -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"`: two hits, `pane-view.ts` "so those are picked before the items" (order of checks) and `model.ts` "dragged onto it still goes in" (the base sentence about a locked pane, rewrapped). Neither is history.
7. Premises spot-checked on the base copy: `grep -rn "hide-tab-row\|show-tab-row" src config --exclude=local.yml` exit 1; Menu.svelte 195, ContextMenu.svelte 158, PaneView.svelte 517, layout.svelte.ts 855, pane-view.ts 541, PaneStrip.svelte 316; `let open = $state(false)` at Menu.svelte:131 and ContextMenu.svelte:49; `if (active === '') return;` at PaneView.svelte:414; `lockPane: { path: 0, page: 2 }` at rerun.ts:41; `GRAB_PX = 6` at float-gesture.ts:47; both pane folders 10 items; `ls docs/adr`: "No such file or directory". All reproduce.

## Verdicts, items of "What to build"

1. Holds. `paneMenu` ends with `...rowItems(facts.row, t)` after Move into New Window (pane-view.ts:199-204); `floatMenu` ends with it (:342); ids `hide-tab-row` and `show-tab-row` (:94-95); keys at ui.yml:51 and :57; both ids in `PANE_ONLY` (:212-220); the pick runs in `panePicked` (:364-385) before the active-tab branches; `isFloatItem` (:313-324) matches neither. The constants are module-local, not exported. The brief names "exported constants", but spec.md's unused-export principle and the brief's own Verify 5 refuse an export with no importer outside its file. Nothing outside pane-view.ts reads them, so local is right under spec.md, which no brief overrides. `PAGE` and `EMBED` lost their only importer, PaneView.svelte:53-54 on the base (grep on the base copy), when the pick moved, so making them local follows the same rule. The report states this as judgment call 3.
2. Holds. model.ts:69 `rowHidden?: true` with its doc comment (:53-56); `repane` carries it (:370), doc names it; `keptPane` carries it (tree.ts:185), doc names it; `setRowHidden` (tree.ts:381-393) deletes the field to show; exported at index.ts:62; `hideTabRow` typed, defined through `change`, and returned (layout.svelte.ts:207-208, 687-690, 829); `readPane` reads `value.rowHidden === true` alone (saved.ts:386-387); head comment names it (saved.ts:19-25); `serialiseLayout` writes the tree raw (saved.ts:503-511).
3. Holds. rerun.ts:42 `hideTabRow: { path: 0, page: 2 }`; the G102 row and `panesOf`'s ` hidden` mark are in place, and the table's `flatMap` runs both orders (verification 2).
4. Holds. `open = $bindable(false)` in Menu.svelte:129 and ContextMenu.svelte:59, still `bind:open` to bits-ui (Menu.svelte:155-156, ContextMenu.svelte:144); head comments say a caller may bind it. `grep` over every `<Menu`/`<ContextMenu` caller finds no caller passing `open` and no prop spread, so unbound callers are unchanged.
5. Partial. The hidden top, the band, the out-of-view rows, the four show conditions, the mounted row, the `none` row and the panel background are built as asked (PaneStrip.svelte:141-174, 205-256, 323-369). One part of the bullet "a menu opened from the row is open" is not met: a menu drawn in the path bar is not tracked (Behaviour finding B1).
6. Holds. PaneView.svelte 513 and layout.svelte.ts 864. No file was added and no folder grew. The pane menu's pick and the strip's drag-hover rule moved into pane-view.ts as `panePicked` and `stripHovered`, with their comments moved into the doc comments. This split by concern sits beside the existing `stripPicked`.
7. Partial. Every comment the brief lists is rewritten and rewrapped. The HELP bullet sits after the Float bullet (line 69), not after line 70 (finding S1). Two of its sentences are false in cases the code produces (finding T1).
8. Holds. The 'reads $name' row covers `true`, `false`, `"yes"` and absent, and is asserted with `toEqual` (layout-saved.test.ts:146-165, 172), so a raw copy of `false` or `"yes"` would fail.
9. Holds as far as the diff shows: only the four diagram files changed, and only in import counts (layer-shell 2 to 3 and 56 to 57; layers 187 to 188), matching the new imports in PaneView.svelte (shell/titlebar) and pane-view.ts (state). I did not rerun `npm run diagrams` (see Declined).

Cases ruling: ruling 1 holds by reading (FrameLayer.svelte:78-86, 98-110, 123; PaneStrip.svelte:220, 222). Ruling 2 holds (PaneStrip.svelte:336-342; PaneView.svelte:509-512). The pane itself is also isolated, beyond "the body isolated"; this is what ruling 3 rests on, and the head comment and report state it. Ruling 3 holds by reading: the sash is z-index 1 outside the isolated pane (Sash.svelte:115), and its reach is `--sash-reach: 1px` (tokens.css:270), so the rest of the band hears the hover. Ruling 4 holds (pane-view.ts:108-119). Ruling 6 holds.

## Verdicts, cases

- C1: met by reading for the menus and the pick: pane-view.ts:199-204 (last item), PaneView.svelte:266-274 (`row` hidden gives Show Tab Row), :403-407, then pane-view.ts:373-374. That the row hides and shows on screen is not verifiable here; the look on TEST settles it.
- C2: met by reading for the view's size: `.top.hidden` has height 0 and `.rows` is absolute (PaneStrip.svelte:336-369). Show-on-hover and hide-on-leave rest on pointer boundary events on `.top` (:214-215) and are not verifiable; the look settles it.
- C3: met by reading for the `...` menu and the right-click menu (`listOpen`/`menuOpen` in `showing`, :157-159, :207, :319). Hiding after the close rests on boundary events and is not verifiable without the look. A path-bar menu is not covered (B1).
- C4: met. `setRowHidden` sets one pane at a path (tree.ts:386-393), and `row` reads each pane's own node (PaneView.svelte:268-274).
- C5: met by reading and by the C10 row: `change` saves, `serialiseLayout` writes the field raw, `readPane` reads it. The reload is seen at the look.
- C6: met by reading for the menu (pane-view.ts:342) and the pick (`panePicked` with the float id as page; `change` and `apply` go through `at(page)` as `lockPane` does, layout.svelte.ts:574-580, 616-619). The move by the shown strip keeps `[data-tab-strip]` (Tabs.svelte:306) inside `.rows`. That a drag moves the float is not verifiable without the look.
- C7: met by reading: `PANE_ONLY` gives `paneOnly` (pane-view.ts:419-421, 454), then `stripPick`, `isPaneItem`, `pick` (PaneView.svelte:315-319).
- C8: not verifiable. It rests on `:focus-visible` (PaneStrip.svelte:166-174); the look settles it.
- C9: met by reading for the mechanism: the drag listens on the document with no pointer capture (drag.svelte.ts:461-462), frames are inert during a drag (FrameLayer `inert`), and the band hears `pointerenter`. The drop is not verifiable without the look.
- C10: met. The test passes after the change; its failure on the unchanged tree was not rerun (see Declined).
- C11: met by reading: `stripShape` is now computed in PaneView.svelte:262-266 with the same arguments PaneStrip used, and `shape.lock` draws the mark (PaneStrip.svelte:282-291). For `none` with no path bar, `topRow` gives `none` and nothing is hidden.
- C12: met by reading. The menus only gain the last item, and the `paneOnly` group only under `editor_actions: hidden`. `.top` and `.rows` are `display: contents` when not hidden (PaneStrip.svelte:326-329), and `grep` finds no selector or DOM walk depending on the strip's parent (no `.pane >`, `[data-pane] >`, `parentElement` or `firstElementChild` in shell/ui tabs/menu). Isolation and the clip apply only when hidden. Exact drawing is confirmed at the look.
- C13: met by reading: `holdsTab` false and `row` shown on a `tabs` row; `panePicked` runs Hide before the active-tab branches (pane-view.ts:373-374).
- C14: met by reading (tree.ts:185, model.ts:370).
- C15: met. The test passes in both orders after the change; the unchanged-tree failure was not rerun. Reading shows that the 'the first applied first' order needs the `PATH_OPERATIONS` row: with the raw path `[2]` on two panes, `paneAt` gives null and nothing changes.
- C16: met by reading: interactjs `margin: GRAB_PX` on the float node (float-gesture.ts:122-124) hears a press on the band, which bubbles to the node; ruling 3 covers the sash. The look settles it on screen.
- C17: met by reading (`carrying={own >= 0}`, PaneView.svelte:433). Not verifiable on screen.
- C18: met by reading: `.rows` is on `var(--panel)`, which is opaque in every theme (`grep -- "--panel:"`). Readability is settled at the look.
- C19: met by reading: PaneBody's menu takes `stripItems` with `paneOnly`, and its pick goes to `stripPick`, `isPaneItem`, `pick`.
- C20: met. Both ids are non-empty and distinct, and neither equals or starts with any id or prefix in pane-view.ts or open-view.svelte.ts (grep of `= '` lines). `isFloatItem` (pane-view.ts:313-324) matches neither; `isPaneItem` (:223-225) matches both.
- C21: not verifiable. The ordering reads right: `menuClosing` gives the focus back before the pick, so `keyed` is set before `hideTabRow`. Whether the opener matches `:focus-visible` after Enter is a browser answer; the look settles it.

## Spec

- S1. docs/HELP.md:69. The bullet is inserted after the Float bullet (base line 68). Brief item 7 says "gains one bullet after line 70", and the write list names "`docs/HELP.md` lines 70-71". Base line 70 is the "A pane from the arrangement stays ... Lock Group" bullet (`git show 87e9c76c:docs/HELP.md | sed -n 64,72p`). The report's file table marks it "yes, line 69", which is outside the named range. Failure scenario: the bullet lands between Float and the landing-order bullet instead of where the brief placed it. This can be fixed at landing by moving the line.
- S2. The report lacks spec.md's required evidence for changed names and helpers. It quotes no grep after changing names or constructs: PaneStrip's `locked` prop replaced by `shape`, `PAGE` and `EMBED` unexported, the `floatMenu` signature. It quotes no grep for reuse before writing `topRow`, `rowItems`, `panePicked`, `stripHovered`, `setRowHidden` and `coveredTop`. It gives no "still true / rewritten" list for every head and doc comment of a touched function and every doc describing the behaviour; it lists only the rewritten ones. My greps find no stale reference: PaneStrip has one user (PaneView.svelte:426); `PAGE`/`EMBED` had no importer but PaneView on the base; `floatMenu` is called only at pane-view.ts:186. So the state is right, and the report's evidence is missing.
- Note for landing: G29 in `agents/guarded.md` names its 'reads $name' rows by title. The new row, 'the current version with a pane whose tab row is hidden', is not yet listed there. The builder may not edit `.scratch/`, so this is the orchestrator's booking.

## Proof

- P1. The report gives the "seen failing first" lines for C10 and C15 with their failing output. I did not reproduce them (see Declined). The quoted failures are what a reading of the base predicts: base `readPane` drops `rowHidden`, and the base store has no `hideTabRow`.
- P2. Report, judgment call 1: "The DOM is the same two wrappers deep, both `display: contents`." This is inaccurate. Before, the strip's content sat under one wrapper (`.context`). After, it sits under three (`.context` > `.top` > `.rows`, ContextMenu.svelte:149, PaneStrip.svelte:209-222), all `display: contents` when not hidden. No decision rests on it beyond C12, which holds.
- P3. Report, last limitation: "a view's own raised element (a Monaco widget) inside a hidden pane no longer paints over a neighbouring sash's reach." Monaco's overflow widgets are appended to `document.body` (ui/controls/editor/options.ts:109-125, `fixedOverflowWidgets: true, overflowWidgetsDomNode: node`), outside the pane's stacking context, so the example is wrong. The general point about a view's own z-indexed element at the pane's edge stands. Not decision-bearing.
- No test asserts a known defect, no predicate was widened, no file-scope mutable was added. The `panesOf` edit is listed with its before and after. Reading both new rows: each fails with its behaviour taken out (see C10 and C15).

## Standards

- T1. docs/HELP.md:69, the quoted sentence: "they show while the pointer is at the pane's top edge, while a menu opened from them is open, and while the keyboard's focus is in them." Two parts are false in states the code produces.
  - The focus part: `keyed` is set only when the focused control matches `:focus-visible` (PaneStrip.svelte:166-168). A tab clicked in the shown row holds the focus, the pointer moves down into the view without a click, `pointed` turns false, and the row hides with the focus still in it.
  - The menu part: a menu drawn in the path bar is not tracked (B1).
  The sentence was added beyond the four points item 7 asks for (report judgment call 6).
- T2. pane-view.ts:102 `export type TopRow` and :347 `export type PaneDeps`. `grep -rn "PaneDeps\|TopRow\b" src tests` outside pane-view.ts prints nothing. spec.md: an export with no importer outside its own file and its tests is removed or made local. knip does not flag them, and the module already exports `StripDeps` the same way (:498), so the severity is low.
- No non-ASCII (verification 3). No history wording (verification 6). Every file is under its size limit (verification 4). Edited comment paragraphs are at or under 100 columns; the only longer added lines are the two reindented base `eslint-disable` comments. The layer rules hold: shell/panes imports shell/titlebar and state, and the boundaries test is in the green list.

## Behaviour

- B1. A menu drawn in the hidden row's path bar does not keep the row shown. Ruling 246 and brief item 5 ask the row to stay while "a menu opened from the row is open". `showing` (PaneStrip.svelte:157-159) counts only the `...` list (`listOpen`) and the right-click menu (`menuOpen`). The PDF viewer hands a `Menu` into the bar's actions: "the four ways to open the PDF", src/lib/views/sources/file/pdf/Controls.svelte:258-267, drawn in `.bar-actions` (PaneStrip.svelte:274-278).
  - Failure scenario: a pane showing a PDF with its row hidden. The pointer goes to the top edge, the row and path bar show, and the user clicks the bar's open-PDF menu. When the pointer moves into the list, which is in a portal on the body, `.top` gets `pointerleave` and `pointed` becomes false. The row and bar slide out of view, and the frame clip falls back to 4 px, while the list stays open over a bar that is gone.
  - The same holds for any other `Menu` a view hands into `barActions`. The report's before and after does not mention it.
- B2. In a hidden pane, the frame clip also hides the top 4 px of a frame's drawing while the row is out of view. `clip-path: inset(4px 0 0 0)` (FrameLayer.svelte:123) shows the pane background where a PDF page's, a Document's or an App's top 4 px were. Ruling 1 asks for the clip. However, the report's "What the look on landing should show" list does not name this visible difference, so the look has no line to check it against. An app's top 4 px also takes no pointer in that state, which an app builder could meet; `docs/apps.md` is not touched.
- B3. The strip's right-click ContextMenu moved from PaneView into PaneStrip. By reading, a right-click on the same area still opens the same menu: the wrapper now holds `.top`, which holds the same Tabs, title row and path bar, with the same `label`, `read={tabMenu.read}` and `onpick={tabMenu.pick}`. The heading handed up to the window strip was outside the wrapper before and is outside it now. New: in a hidden pane, the 4 px band is inside the wrapper, so a right-click on the band opens the strip menu (stated, report judgment call 5).
- B4. Stacking against floats, menus and the sash. Floats, menus (portalled) and Modal (portalled, Modal.svelte head) stand outside the pane, so they are unaffected. The pane and body isolation applies only while the row is hidden (PaneView.svelte:509-512). The stated effect on a view's element at the pane's edge versus a neighbouring sash is in the report (see P3 for its wrong example).
- B5. A pane never hidden: by reading, it draws as before (C12). The frame layer now always writes `clipPath = ''` for such a pane, which draws nothing.

## Declined to judge

- The failing-first runs of C10 and C15 on the unchanged tree. Rerunning them needs the new test rows placed beside the base code, which means writing into the base copy or checking out the base. I change nothing, and only `git diff`, `git status --short` and `git show` are allowed. The command that would settle it is the two named vitest runs in a checkout of 87e9c76c with the two test files from this worktree.
- `npm run format` and `npm run diagrams` were not run, because both write into the worktree. Prettier's check in the list passed. Whether the committed diagrams equal a fresh `npm run diagrams` is settled by running it and then `git diff 87e9c76c -- docs/diagrams`.
- Every on-screen behaviour named "not verifiable" above: hover show and hide, `:focus-visible` after a pointer pick and after Enter, boundary events while a bits-ui menu is open, a float's move and resize, the drop on a shown strip, the wallpaper. Each is settled by the look on TEST in the state the case names.
- How many times the builder ran the list. That needs the builder's transcript; the report says once.

Usage: a914ccedd6c86f1fa, claude-opus-5-5, 244440 tokens, 76 tool uses, 12 min 55 s

## Repair round 1, refuted

### Verification lines

1. `npm run test:quick -- --base 87e9c76c` (worktree root):
```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.2 s)
ok      svelte-check (11.2 s): 1792693482058 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (29.6 s): Duration  16.51s (transform 6.73s, setup 0ms, import 8.74s, tests 7.61s, environment 0ms)
ok      vitest checks (42.4 s): Duration  29.40s (transform 23.40s, setup 0ms, import 29.35s, tests 34.83s, environment 1ms)
ok      vitest (42.7 s): Duration  29.65s (transform 64.81s, setup 0ms, import 103.53s, tests 2.34s, environment 284ms)
test:quick: 45.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```
2. `npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts -t "reads" --reporter=verbose` (the <CHECK MARK> and <HORIZONTAL ELLIPSIS> of the output written by name):
```
 <CHECK MARK> |unit| ... > reads 'the current version with every page a<HORIZONTAL ELLIPSIS>' 3ms
 <CHECK MARK> |unit| ... > reads 'the current version with a documents <HORIZONTAL ELLIPSIS>' 0ms
 <CHECK MARK> |unit| ... > reads 'rail pages: the paths read for a rail<HORIZONTAL ELLIPSIS>' 0ms
 <CHECK MARK> |unit| ... > reads 'Files and LaTeX tabs: the state is ke<HORIZONTAL ELLIPSIS>' 0ms
 <CHECK MARK> |unit| ... > reads 'Files and LaTeX tabs: the state is ke<HORIZONTAL ELLIPSIS>' 0ms
 <CHECK MARK> |unit| ... > reads 'the current version with a pane whose<HORIZONTAL ELLIPSIS>' 0ms
      Tests  6 passed (6)
```
   `npx vitest run tests/state/workbench/layout/saved/layout-workspaces.test.ts -t "two browser tabs that change the panes" --reporter=verbose`:
```
 <CHECK MARK> ... 'a fold of a pane the other tab moved <HORIZONTAL ELLIPSIS>', 'the first' applied first 55ms
 <CHECK MARK> ... 'a fold of a pane the other tab moved <HORIZONTAL ELLIPSIS>', 'the second' applied first 28ms
 <CHECK MARK> ... 'a fold of a pane the other tab closed<HORIZONTAL ELLIPSIS>', 'the first' applied first 14ms
 <CHECK MARK> ... 'a fold of a pane the other tab closed<HORIZONTAL ELLIPSIS>', 'the second' applied first 26ms
 <CHECK MARK> ... 'a hide of the tab row of a pane the o<HORIZONTAL ELLIPSIS>', 'the first' applied first 22ms
 <CHECK MARK> ... 'a hide of the tab row of a pane the o<HORIZONTAL ELLIPSIS>', 'the second' applied first 24ms
      Tests  6 passed | 14 skipped (20)
```
3. ASCII gate (the brief's perl form) over the brief's fifteen files plus `src/lib/shell/frames/FrameLayer.svelte`, `docs/apps.md`, `docs/diagrams/layer-shell.dot`, `docs/diagrams/layers.dot`: printed nothing, `ascii exit 0`.
4. `wc -l`: pane-view.ts 649, PaneView.svelte 513, PaneStrip.svelte 469, FrameLayer.svelte 332, model.ts 431, tree.ts 584, index.ts 147, layout.svelte.ts 864, saved.ts 670, rerun.ts 251, Menu.svelte 198, ContextMenu.svelte 169, layout-saved.test.ts 179, layout-workspaces.test.ts 313. `ls src/lib/shell/panes | wc -l` 10; `ls src/lib/shell/panes/strip | wc -l` 10.
5. `sh utils/unused-exports.sh` (exit 0) diffed with `../migration-O51-base/unused-exports.txt` (diff exit 1), no line added:
```
322c322
< src/lib/state/workbench/drag.svelte.ts: Drop, DragSink, DragKind, Dragging
---
> src/lib/state/workbench/drag.svelte.ts: DragSink, DragKind
```
6. `git diff 87e9c76c -- src tests config docs/HELP.md docs/apps.md | grep "^+" | grep -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"`: two hits, the same as round 0: `+ * has its row hidden or shown whether or not it holds a tab, so those are picked before the items` (order of checks) and `+ * last tab goes, and a tab opened from its own strip or dragged onto it still goes in. `rowHidden`` (base sentence on a lock, rewrapped). Neither is history.
7. The round's delta: `diff -u` of each snapshot file against the worktree changes three files only, `docs/HELP.md` (bullet moved after base line 70 and reworded), `src/lib/shell/panes/pane-view.ts` (head comment, `paneMenu` doc, `TopRow` and `PaneDeps` unexported) and `src/lib/shell/panes/strip/PaneStrip.svelte` (`listOpen` and `bind:open={listOpen}` removed, `OPEN_TRIGGER`, `expanded` and a `MutationObserver` effect added, head paragraph reworded); the other seventeen paths of `files.txt` are identical. Outside `files.txt`, `git diff 87e9c76c -- docs/apps.md` adds one bullet extension at line 84.
8. Report claims rerun: `grep -rn "TopRow\|PaneDeps" src tests | grep -v pane-view.ts` exit 1; `grep -rn "listOpen" src tests` exit 1; `git diff 87e9c76c -- docs/HELP.md` one `+` line, none removed, the bullet at line 71 after the "A pane from the arrangement stays" bullet at line 70; `grep -rl -i "pane menu\|tab row\|path bar\|editor_actions\|Move into New Window\|frame layer\|FrameLayer\|Lock Group" docs` outside `docs/diagrams/` lists `docs/HELP.md` and `docs/apps.md`; the name greps (`topRow`, `rowItems`, `panePicked`, `stripHovered`, `setRowHidden`, `coveredTop`, `TopRow`, `PaneDeps`, `OPEN_TRIGGER`): 0 hits each on the base copy, and the worktree hits equal the report's lists line for line. `node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1470-1471` gives the dropdown trigger `"aria-haspopup": "menu"` and `"aria-expanded"`; the context-menu trigger's props (`:1554-1563`) carry `data-state` and no `aria-expanded` (the report cites `:1559`, the attribute line beside it); `MenuOpener.svelte:107` spreads `{...held}`, the trigger props, onto the button.

### Verdicts, items of "What to build" (whole diff since 87e9c76c)

1. Holds. `paneMenu` ends with `...rowItems(facts.row, t)` (pane-view.ts:203), `floatMenu` with the same (:342); ids at :94-95, module-local (spec.md's export rule; nothing outside the file reads them); keys at ui.yml:51 and :57; both ids in `PANE_ONLY`; `pick` (PaneView.svelte:403-407) sends every id but the float items and Close to `panePicked`, which runs Hide and Show before the active-tab branches.
2. Holds. `rowHidden?: true` (model.ts:69) with its doc; `repane` (:370) and `keptPane` (tree.ts:185) carry it and their docs name it; `setRowHidden` (tree.ts:381-393) deletes the field to show; exported (index.ts:62); `hideTabRow` typed, defined through `change` and returned (layout.svelte.ts:207-208, 687-690, 829); `readPane` reads `=== true` alone (saved.ts:386-387), head comment names it.
3. Holds. rerun.ts:42 `hideTabRow: { path: 0, page: 2 }`; the G102 row passes in both orders (verification 2).
4. Holds as built. `open = $bindable(false)` in Menu.svelte and ContextMenu.svelte, still `bind:open` to bits-ui (Menu.svelte:156, ContextMenu.svelte:144); `grep -rn "bind:open" src` shows the strip binds ContextMenu's (PaneStrip.svelte:234) and no caller binds Menu's. An unbound `$bindable` with a fallback is local state, so every caller is unchanged (svelte-check 0 errors). See S1 below on Menu's prop having no reader.
5. Holds by reading, with the clash in S1. The fourth bullet's menu clause now covers every menu whose trigger in the top carries `[aria-haspopup][aria-expanded='true']`: the `...` list and a view's bar menus (PDF open menu in `pdf/Controls.svelte:258`, `ActionStrip`'s More Actions via `FileBarActions`). The bullet's "read from the bound `open` of item 4" and the item's sentence "never a read of the page" are no longer met for the `...` list (S1).
6. Holds. PaneView.svelte 513, layout.svelte.ts 864, no file added, both folders 10.
7. Holds. HELP bullet at line 71 after base line 70; its conditions match `showing` (PaneStrip.svelte:159). Every listed comment rewritten and rewrapped (round-1 lines at or under 100 columns, `awk` length check; the only lines over 100 are the three `eslint-disable` comments at :271, :277, :320).
8. Holds. The row covers `true`, `false`, `"yes"` and absent with `toEqual`.
9. Holds as far as the diff shows: round 1 changed no import, and the four diagram files are identical between the snapshot and the worktree. `npm run diagrams` not rerun (Declined).

Cases ruling 1 to 6: unchanged in round 1 (FrameLayer.svelte, PaneView.svelte identical to the snapshot); the first report's verdicts stand: ruling 1 holds by reading, ruling 2 holds, ruling 3 holds by reading, ruling 4 holds (`topRow`, `rowItems`), ruling 6 holds.

### Verdicts, cases

- C1: met by reading (pane-view.ts:203, PaneView.svelte:406, `panePicked`). On screen: the look on TEST, `...` menu of a page pane, pick Hide Tab Row, then Show Tab Row from the row shown at the edge.
- C2: partial by reading (view size: `.top.hidden` height 0, `.rows` absolute, PaneStrip.svelte:362-395); hover show and hide not verifiable. Look: pointer into the top 4 px and off again.
- C3: met by reading for the `...` list and the right-click menu, and now for a path-bar menu: `expanded` (PaneStrip.svelte:168-186) holds while the trigger carries `aria-expanded="true"`, `menuOpen` (:234) for the right-click menu. Not verifiable on screen. Look: open the `...` list and the PDF open menu from the shown row, move into each list, close by pick and by a press outside.
- C4: met (tree.ts:386-393, `row` per pane).
- C5: met by reading and the C10 row. Look: reload, and `rowHidden: true` on that pane alone.
- C6: met by reading (pane-view.ts:342). Look: a free float's menu, its edge, a drag of the shown strip.
- C7: met by reading (`PANE_ONLY`, `stripPick`, `isPaneItem`).
- C8: not verifiable (`:focus-visible`, PaneStrip.svelte:193-201). Look: Tab into and out of a hidden pane's strip.
- C9: met by reading for the mechanism. Look: drag a tab from another pane to the hidden pane's edge and drop on the strip.
- C10: met (verification 2). Failing first not reproduced (Declined).
- C11: met by reading (`stripShape` in PaneView.svelte:263-266, `shape.lock`, `topRow` `none`). Look: locked pane, `single`, `none`.
- C12: met by reading (`.top`, `.rows` `display: contents` while shown; clip and isolation only while hidden). Look: a pane never hidden.
- C13: met by reading. Look: an empty documents pane.
- C14: met by reading (tree.ts:185, model.ts:370).
- C15: met (verification 2). Failing first not reproduced (Declined).
- C16: met by reading. Look: a hidden float's band hover, a press on its 6 px margin and on a bottom-docked float's sash.
- C17: met by reading (`carrying={own >= 0}`). Look: drag a tab out of the shown row.
- C18: met by reading (`.rows` on `var(--panel)`). Look: wallpaper on.
- C19: met by reading. Look: right-click in an empty hidden pane's body under `editor_actions: hidden`.
- C20: met (ids non-empty, distinct; `isFloatItem` matches neither; `isPaneItem` both).
- C21: not verifiable (`:focus-visible` after a pick by Enter). Look: Enter on Hide Tab Row in the `...` menu, then Tab away.

### Findings of the first report

- S1 (HELP place): closed (HELP.md:71 after line 70; one `+` line).
- S2 (report evidence): closed (greps reproduced, still-true list present).
- Note on G29 booking: open, the orchestrator's at landing (round brief's last line); the builder may not write it.
- P1 (failing-first lines): not reproduced, as before (Declined).
- P2: closed (report:318, three `display: contents` boxes).
- P3: closed (report:338).
- T1: closed. HELP.md:71's conditions equal `showing`: pointer at the edge or over the row (`pointed`), a menu from the row or its path bar (`menuOpen`, `expanded`), focus a key brought (`keyed`), a tab of the pane dragged (`carrying`).
- T2: closed (`type TopRow`, `type PaneDeps` local; grep exit 1).
- B1: closed by reading; the on-screen proof is the look above (C3).
- B2: closed (report:228-229 names the 4 px clip and the clip below the shown row; docs/apps.md:84 extended).
- B3, B4, B5: observations, unchanged by round 1; they stand as written.

### Spec

- S1. A rule clash the round brief introduced, between `O51-round1.md` item 1 and brief item 5. `src/lib/shell/panes/strip/PaneStrip.svelte:168-186`:
```
    $effect(() => {
        if (!hidden || top === undefined) return;
        const node = top;
        const read = (): void => {
            expanded = node.querySelector(OPEN_TRIGGER) !== null;
        };
        const watch = new MutationObserver(read);
```
  Brief item 5: "Whether the row shows is state of the pane strip, never a read of the page (`spec.md`: a reader-visible behaviour is state, not a DOM side effect)", and its menu bullet says the open state is "read from the bound `open` of item 4". The round brief directs the strip to read `aria-expanded` from the DOM, "in place of or beside `listOpen`", and the builder chose "in place of", so the `...` list, which round 0 read as state through `bind:open`, is now also a DOM read. spec.md says a brief overrides nothing in it and that a disagreement between the brief and the rules is stopped and reported; the builder followed the round brief and named it as judgment call 7. Failure scenario: none on screen; the rule the brief and spec.md state is not met, and a later reader of the tree finds a reader-visible behaviour driven by a DOM scrape of a library's ARIA attribute, which a bits-ui change of that attribute would silently break (no test covers it, none may be written outside an entry). Options for the orchestrator: (a) keep the DOM read as the round brief directed; (b) a state route: `Menu.svelte` reports its `open` to an optional context the strip provides (spec.md names a context object as the way a dependency is passed in), so the `...` list and a view's bar menus reach the strip as state; whether a `Menu` inside a snippet a view hands down through PaneView into PaneStrip resolves the strip's context is not verified. My judgment: (b) is the one that meets brief item 5 and spec.md; (a) is the cheaper one.
- S2. Ruling 246's stated purpose no longer applies to `Menu.svelte`. Menu.svelte:129 `open = $bindable(false)` and its head comment "which a caller may bind to know when the list is open"; `grep -rn "bind:open" src` shows no caller binds it. Ruling 246 (a) gave both primitives the prop "so the pane strip keeps a hidden row shown while its menu is open"; after round 1 only `ContextMenu`'s serves that. The prop is the size of the `$state` it replaced plus a doc line, so it is not code much larger than its job, and the brief (item 4) and the ruling still ask for it; it now has no reader, which spec.md's YAGNI line ("nothing is built for a need the plan does not name") would otherwise refuse. The builder raised it as an open item with a recommendation to keep it. It is a premise of Axel's ruling found changed, so it goes to him with S1: under S1 (b) the prop is replaced by the context report; under S1 (a) it is kept or removed by his ruling.
- S3. docs/apps.md:84. The round brief asks for "one sentence beside the frame rules"; the builder added three: "While the pane holding the app hides its tab row (Hide Tab Row), the page's top 4 px lie under the band that shows the row again and take no pointer; while the row shows, it covers the page's top the same way. The page keeps its size." Each is true of `coveredTop` and the `clip-path` (FrameLayer.svelte:78-86, :123), and the clipped part is cut rather than covered, which a reader meets as the same thing. Failure scenario: none beyond the count; can be left or trimmed at landing.

### Proof

- P1. Report DONE row "Item 9, diagrams | DONE | `npm run diagrams`" (report:47) quotes no line of a run; spec.md asks each DONE row to quote the last line of the final run that proves it. Rows 5, 7 and the rulings row give "read below", which is the look's proof as spec.md allows. Nothing rests on row 9: the diagram files are byte-identical between the round-1 snapshot and the worktree, and round 1 changed no import.
- The failing-first lines of C10 and C15 are quoted in the report and not reproduced here (Declined).
- No test asserts a known defect; no assertion, allow list or predicate changed in round 1 (the two test files are identical to the snapshot).

### Standards

None. Round-1 comment paragraphs are rewrapped at or under 100 columns (`awk 'length($0)>100'` lists only the three base or reindented `eslint-disable` lines); ASCII gate clean; no history wording; `OPEN_TRIGGER`'s selector matches the existing CSS marks in `TreeActions.svelte:44` and `Card.svelte:131`.

### Behaviour

None found by reading. What was checked:
- The `...` list keeps the row shown: the `heading` snippet's `Menu` sits inside `.top` while `shape.actions` holds; under `shape.up` (`strip-shape.ts:51-58`) `actions` is false and the opener is drawn in the window strip outside `.top`, which equals round 0's `listOpen && shape.actions`.
- No `aria-expanded` control inside the top keeps the row shown wrongly: the selector needs `aria-haspopup` too, so `Disclosure`, `FoldLine`, `TreeItem` and a `ToolButton` with `expanded` (no `aria-haspopup`) do not match; `Menu`'s list and its submenu triggers (`menu.svelte.js:1209`) are inside `DropdownMenu.Portal` on the body (Menu.svelte:178), and the right-click list is portalled too, so no submenu trigger is in the top's subtree; the context-menu trigger wraps the top from outside and carries no `aria-expanded`. The bar actions in the tree today (`File.svelte:432`, `Source.svelte:444` via `BarActions`, `Document.svelte:202`, `MarkdownPreview.svelte:100`, `Doc.svelte:265`) hold `FileBarActions`, `ActionStrip`, `PdfControls` and `ToolButton`s; `grep -rln "Popover\|Dialog.Trigger\|Select.Trigger" src/lib` lists only `FieldSelect.svelte`, `Toolbar.svelte` and `fit.ts`, none of them in a bar.
- The observer: disconnected in the teardown on every rerun and on destroy, so no leak; it runs only while `hidden`. The effect reads `hidden` and `top` and writes `expanded` without reading it, so no loop. `observe` is set before the first `read()`, so an `aria-expanded` change after the effect starts is heard.
- Stale `expanded`: none. Showing the hidden row again by hover does not touch the observer. `hidden` turning false runs the teardown, which sets `expanded = false`; `hidden` turning true again calls `read()` at once, so a menu still open at that moment is picked up.
- `hidden` turning false while a menu is open: `.edge` is unmounted, `.rows` loses `data-pane-top`, the frame's cut goes to 0, `expanded` is reset, and `showing` no longer matters because `shown` needs `hidden`. Nothing is left wrong.
- Timing: the attribute is set in Svelte's flush after bits-ui's `open` changes, and the observer's microtask runs before the focus moves into the portalled list (`afterTick`) or the pointer leaves the row, so `keyed` or `pointed` clearing does not hide the row for a frame by reading. The on-screen check is C3's look.
- Cost: `childList` with `subtree` re-runs `querySelector` on each DOM batch in the top while hidden, the breadcrumb's caret-symbol updates included. The query covers a small subtree and nothing is drawn from it.

### Declined to judge

- The failing-first runs of the C10 and C15 rows on the unchanged tree: they need the two test files placed beside the base code, which means writing into the base copy or checking out 87e9c76c; I change nothing, and only `git diff`, `git status --short` and `git show` are allowed. Settled by the two vitest runs in a checkout of 87e9c76c with the two test files from this worktree.
- `npm run format` and `npm run diagrams`: both write. Prettier's check in the list passed; whether the committed diagrams equal a fresh run is settled by `npm run diagrams` then `git diff 87e9c76c -- docs/diagrams`.
- Every on-screen behaviour named "not verifiable" and each "Look" above: hover show and hide, `:focus-visible` after a pointer pick and after Enter, boundary events while a bits-ui menu is open (bits-ui's modal menu may stop pointer events on the body while open, so a pointer returning to the row during an open menu may not set `pointed`), a float's move and resize, the drop on a shown strip, the wallpaper. Settled by the look on TEST.
- Whether a `Menu` instantiated inside a snippet a view hands down resolves the context of the component that renders it (S1 option b): not verified; settled by a small Svelte check in a scratch project, outside this review's allowance.
- How many times the builder ran the list in round 1, and its scoped prettier and eslint runs: needs the builder's transcript; the report says once.

Usage: a0e5d4a6e03b9c695, claude-opus-5-5, 194879 tokens, 35 tool uses, 7 min 34 s

## Closed

- S1 (round 1): fixed at landing on main, inside brief item 5 and spec.md: the strip's top provides a context through which `Menu.svelte` reports its `open` while it is open, so the `...` list and a menu a view hands into the path bar reach the strip as state; the `aria-expanded` read and its `MutationObserver` are removed.
- S2 (round 1): closed by S1's fix: `Menu.svelte`'s `open` is read by the report to the strip's context, and stays bindable as brief item 4 and ruling 246 ask.
- S3 (round 1): trimmed at landing to one sentence in `docs/apps.md:84`.
- P1 (round 1): `npm run diagrams` runs at landing in the gate, its output the booking's.
- The new G29 row booked in `agents/guarded.md` at landing.
- The first run's findings S1, S2, P2, P3, T1, T2, B1, B2: closed in round 1, as the review over the round gives; B3 to B5 are observations with no change asked.
