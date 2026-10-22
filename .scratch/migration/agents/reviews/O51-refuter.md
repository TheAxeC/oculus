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
