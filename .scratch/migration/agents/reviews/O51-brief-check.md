# O51 brief check

Base read: `git log -1 --format=%h` in ~/workspace/oculus prints `24e473e7`, the brief's base. `git status --short` shows only `.scratch/migration/orchestrator-state.md` modified and the brief untracked. `plan.md` has no Goal section: `grep -n "^## " .scratch/migration/plan.md` lists only "Steps, in execution order", "Could run in parallel", "Rulings", "Agents" and "Blocked, and by what". I used the goal stated in the task.

## 1. Names

Command: `grep -rn --exclude=local.yml --exclude-dir={node_modules,.git,.svelte-kit,build,.agents} -- "<name>" .` for each name, with hits in the brief and in `.scratch` patches left out. A hit under `.scratch/.../reviews` or in a patch is a record of earlier steps, and the change does not make it false.

1.1 `lockPane`: `src/lib/state/workbench/layout/saved/rerun.ts:41` reads `lockPane: { path: 0, page: 2 },` inside `PATH_OPERATIONS` (rerun.ts:31-45). This file is outside the write list.
- `againWith` (rerun.ts, `if (where === undefined) return () => args;`) reruns an operation that is not in this table with its raw path.
- The new store method beside `lockPane` takes a path. When another browser tab has moved the tree, a rerun would hide or show the row of whatever pane now sits at that path. It should name the pane by its tabs, or drop the operation.
- This breaks guarded entry G102: "an operation whose node the other tab removed is dropped" (`guarded.md:287-289`, Code: `rerun.ts` and the `write` it is handed in `layout.svelte.ts`).
- The brief names neither `rerun.ts` nor G102.
- The fix widens the step's paths (`rerun.ts`) and makes G102's test `layout-workspaces.test.ts` one the step must run. Reported as a widening.

1.2 `repane`: hits outside the write list are `open/preview.ts:11,58,70`, `open/pinned.ts:4,9,28,45` and `open/float/pages.ts:150,431,545`. Each is a call, so each carries the new field once `repane` does. `pinned.ts:4` stays true. None is made false.
- The brief's claim that `repane` is "the one place a rebuilt pane carries its fields" is false. See 3.3: `keptPane` in `tree.ts:179-187` carries the flags field by field. `tree.ts` is in the write list, but nothing in "What to build" names `keptPane`.
- `repane`'s own doc comment (`model.ts:353-359`, "the lock, the mark of an added pane and the mark of the documents pane always") lists the fields it carries. Adding `rowHidden` makes that list incomplete, and item 5 does not name this comment. The path is in the write list.

1.3 `setLocked`: outside the write ranges it appears at `pane-view.ts:434,460-461` (the `StripDeps` lock path of the strip menu). It is not made false, because the new item runs through the pane's `pick`. The hits at `layout.svelte.ts:72,681` and `index.ts:61` are in the write list.

1.4 `PANE_ONLY`: `pane-view.ts:332` (`stripMenu`'s `paneOnly` filter) is outside the ranges 128-178 and 280-296. It stays correct.
- `stripMenu`'s doc comment (`pane-view.ts:297-310`, "the pane menu's items that it has none of its own for") stays true.
- The output of `stripMenu` changes, yet the Read list (pane-view.ts 128-300) stops before the body of `stripMenu` (311-400). C7 and C12 run through that body.

1.5 `paneMenu`, `floatMenu`, `isPaneItem`: every hit in `src` is inside the write list (`PaneView.svelte:59-60,242,281`; `pane-view.ts:134,149,177,284`). `floatMenu`'s doc comment (`pane-view.ts:280-283`, "Close, the float's items, and the choice that lists the pages") becomes incomplete. Its range is in the write list, but item 5's list of comments to rewrite leaves it out.

1.6 `readPane`: the only hits outside `saved.ts` are unrelated functions with the same name (`ui/frame/toolbar/Toolbar.svelte:70`, `server/machine/pty/capture.ts:262`).

1.7 `rowHidden`, `pane_hide_tab_row`, `pane_show_tab_row`: no hit outside the brief. Nothing collides.

1.8 "Tab Row", "Hide Tab", "Show Tab": `plan.md:672`, `plan.md:2416` and `queue.md:6` are ledger lines and are not made false. There is no hit in `src`, `config` or `docs`.

1.9 `Pane`: the type is at `model.ts:59` and is in the write list. `server/machine/pty/sessions.ts:471` is an unrelated type of the same name.
- A pane built by a literal that carries the pane's flags: `tree.ts:179-187` `keptPane` (see 3.3).
- `float/pages.ts:470,494` build new single-tab panes, which correctly start shown.

1.10 HELP bullet: no existing line says it. `docs/HELP.md:68` ("Drag its strip to move it"), `:77` (breadcrumb) and `:80` (Tab stop) are outside 70-71 and stay true, provided the hidden row stays in the tab order (see 5.3).

1.11 `ui/menu/Menu.svelte` and `ui/menu/ContextMenu.svelte` are not on the brief's list but are implied by item 3. `grep -n "open" src/lib/ui/menu/Menu.svelte` shows `let open = $state(false);` at :131 and `bind:open` at :153, with no prop that hands the open state out. ContextMenu has the same internal `let open = $state(false);` (ContextMenu.svelte:49).
- Item 3 and C3 need the row to stay "while ... a menu opened from them is open". Doing that as state, as `spec.md:87` requires ("a reader-visible behaviour is state, not a DOM side effect"), needs an open-state prop on both primitives.
- Both files are outside the write list. Reported as a widening.

1.12 Item 4 allows "a folder is split", but the write list only takes "a file item 4's split makes". `wc -l` gives PaneView.svelte 517 against a limit of 520, so a split is close to certain. `ls src/lib/shell/panes/strip | wc -l` prints 10, and strip/ is where the concern lives (`spec.md:48`).
- Splitting strip/ moves existing files and edits their importers, none of which are in the write list.
- `ls src/lib/shell/panes/leaf | wc -l` prints 4 and `floats` prints 5. They have room but are not the concern's folder.
- Reported as a widening.

## 2. The step line

`grep -n "^- O51" .scratch/migration/plan.md` prints: `672:- O51 a per-pane Hide Tab Row in the pane menu; a pane with its row hidden shows the row while the pointer is at its top edge (ruling Headerless panes)`.

2.1 "per-pane": item 2 (the field on `Pane`, set per path) and C4.
2.2 "Hide Tab Row": item 1 (the text key `pane_hide_tab_row`) and C1.
2.3 "in the pane menu": item 1 (`paneMenu`, `floatMenu`, `PANE_ONLY`), C1, C6 and C7.
2.4 "a pane with its row hidden shows the row": item 3 and C2.
2.5 "while the pointer is at its top edge": item 3 (the 4 px band) and C2.
2.6 "(ruling Headerless panes)": cited in items 1 and 3. Rulings (b) and (c) need no requirement.
2.7 Every part of the line has a requirement. Requirements beyond the line, each one named as a decision or rule:
- the Show Tab Row counterpart (decision 2);
- the path bar hidden with the row (decision 4);
- floats included (decision 1);
- kept across a reload (decision 7);
- shown on keyboard focus and on a tab drag (item 3, from `HELP.md:80`);
- the size split (item 4, from spec.md);
- the HELP bullet (item 5, from `spec.md:70`).
None of them lacks a stated source.

## 3. Premises

3.1 Base: `git log -1 --format=%h` prints `24e473e7`. Holds.

3.2 `Pane` type at `model.ts:56-65`. Command: `grep -n "export type Pane = \|^};" src/lib/state/workbench/layout/model.ts` prints `59:export type Pane = {` and `68:};`, with the doc comment at 48-58. Wrong: the type is at lines 59-68. The field list (recent, keeps, locked, added, documents) holds (`model.ts:63-67`).

3.3 "`repane` (`model.ts:355-370`) is the one place a rebuilt pane carries its fields (`grep -n "from.locked" ...`: line 365 alone)". The grep prints `365:    if (from.locked === true) pane.locked = true;`, so the grep holds. The claim does not.
- `grep -rn "\.locked\b\|locked:" src/lib` prints `tree.ts:180: const locked = pane.locked === true;` and `tree.ts:184: if (locked) left.locked = true;`.
- `keptPane` (`tree.ts:179-187`, the empty pane left when a locked, documents or terminals pane loses its last tab) builds a fresh pane and copies `added`, `locked` and `documents` one by one. Unless it is changed, a hidden pane whose last tab closes comes back shown.
- `repane` itself is at 360-369, with its doc comment at 353-359.

3.4 `paneMenu` at `pane-view.ts:134-168`: the function runs 134-167 (`awk` print: `167: }`). The list "Close, Maximise or Restore, Fold, the two page choices, the splits and Float" leaves out Move into New Window (`pane-view.ts:163-165`, desktop only), which today is the last item.

3.5 `floatMenu` `:284-295`: holds. `PANE_ONLY` `:174` and `isPaneItem` `:177-178`: hold. Doc comments: paneMenu's is 129-133 (the brief says 130-133) and PANE_ONLY's is 169-173 (the brief says 170-173). These are off by one at the opening `/**` line.

3.6 `PaneStrip.svelte:231-240` (Menu), `PaneView.svelte:241-255` (items), `:378` (`pick`), `:379-382` (float item to `stripPick`): hold. `stripPick` is 279-305, and its `isPaneItem` branch is 281-284. The brief says 279-283.

3.7 `stripShape` `strip-shape.ts:39-67`, its three row kinds and the `{#if barred && !beside}` path row (`PaneStrip.svelte:172-177`): hold.

3.8 FloatLayer head comment "lines 23-27". `sed -n 1,45p` shows the sentence "A free float moves by a drag of the empty part of its tab strip and resizes by its edges and corners" at lines 22-26. Off by one.
- The same sentence says a free float resizes by its edges, which the brief does not carry over. `float-gesture.ts:47` is `const GRAB_PX = 6;` and `:124-126` is `edges: { left: true, right: true, top: true, bottom: true }, margin: GRAB_PX`. The 4 px band therefore lies inside the 6 px top resize margin (see 6.5).

3.9 `setLocked` `tree.ts:366-380`: the comment and function span 366-378. `lockPane` `layout.svelte.ts:680-682`, `:205`, `:820`: hold. `saved.ts:382-383` and `:19-23`: hold.

3.10 Sizes: `wc -l` prints PaneView.svelte 517, pane-view.ts 541, PaneStrip.svelte 316, model.ts 426, layout.svelte.ts 855, tree.ts 569 and saved.ts 666. Folder counts: `ls src/lib/shell/panes | wc -l` 10 and `ls src/lib/shell/panes/strip | wc -l` 10. All hold.

3.11 Tests: `grep -n "paneMenu\|stripShape\|stripMenu" .scratch/migration/agents/guarded.md` exits 1, and `grep -rln ... tests` exits 1. Holds.
- The brief's "no entry covers ..." leaves out G102, which covers `rerun.ts` and the `write` in `layout.svelte.ts` that the new store method runs through (see 1.1).
- G31's Code line names `src/lib/state/workbench/layout/saved/` (`guarded.md:102`), so `saved.ts`'s change also touches G31 (`layout-unread.test.ts`). `npm run test:quick` would select it as a related test.

3.12 HELP: lines 66-70 and 80 hold (`sed -n 60,82p docs/HELP.md`). Line 69 (the landing order) is inside the range but not in the brief's list.

3.13 `ls docs/adr` prints "No such file or directory". Holds.

3.14 The brief names no worktree and no base copy. `grep -n "worktree\|base copy\|-base" briefs/O51.md` shows only line 112 ("worktree's root"), line 118 ("the base copy's `unused-exports.txt`") and line 126.
- The standing demand at `orchestrator-state.md:145` says "every brief names, under 'What is on the tree', a base copy `.agents/worktrees/<step>-base/` ... and beside it `unused-exports.txt`".
- `spec.md:33` says "The brief names a base copy". Verify item 5 has no path to compare against.

3.15 The Read list (brief "Read, with sections or line ranges") leaves out code that items and cases depend on:
- `pane-view.ts` 300-400 (`stripMenu`, C7 and C12);
- `tree.ts` 172-187 (`keptPane`);
- `saved/rerun.ts`;
- `ui/menu/Menu.svelte`, `ui/menu/ContextMenu.svelte` and `ui/menu/menu-items.ts:122-160` (`menuClosing`, which returns the focus to the opener; see 4.1);
- `PaneBody.svelte` (the body menu under hidden actions);
- `float-gesture.ts`.
`spec.md:8` limits the builder to the listed files and ranges.

## 4. Cases and checks

4.1 C1 ("A pick hides the row") and C3 ("hides when the menu closes with the pointer off the row") contradict item 3's rule "They also show while the keyboard focus is inside them".
- `menu-items.ts:153-158` (`onCloseAutoFocus`) calls `focusQuietly(control)` on the opener whenever the menu closed by a pick or by Escape (`away` false), and `Menu.svelte:142` builds it with `menuClosing(() => button)`.
- After Hide Tab Row is picked from `...`, the focus is back on the `...` opener inside the row. Under item 3 the row then stays shown until the focus leaves. Under C3 the row stays after the menu closes by a pick or Escape.
- The brief has to say which rule wins, for example by limiting the focus rule to focus that arrived by keyboard. Settling it adds no path.

4.2 C11 contradicts item 3 for a pane with `show_tabs: none` and no row but with a path bar.
- `stripShape` returns `row: 'none'` (`strip-shape.ts:51-58`), and `PaneStrip.svelte:172` still draws the `.path` row when `barred`.
- Item 3 says "the row and its path bar show" at the edge. C11 says "with no row to draw nothing shows at the edge".
- The expected result is undefined for a file tab whose path bar is drawn.

4.3 Item 1 and spec.md: `spec.md:71` ("Every id or key a step introduces is checked empty, duplicated, and colliding") and the standing demand at `orchestrator-state.md:146` ("Every brief that introduces a key or id names it and lists its empty, duplicated and colliding cases as acceptance items").
- The brief never names the two menu item ids that join `PANE_ONLY`, and no case checks them against the existing ids. Those ids include `close`, `fold`, `float`, `tab-bar:`, `actions-at:`, and the prefixes `page:` and `embed:` that `isPaneItem` matches with `startsWith`.

4.4 C12 ("a pane never hidden draws exactly as on the unchanged tree") is checked "by reading" only, and is not looked at on TEST (brief line 51: "C12 is read"). Drawing the row over the view needs a positioned wrapper around `ContextMenu` and `PaneStrip`. `ContextMenu.svelte`'s head comment says "The wrapper takes no box of its own". Whether a new wrapper changes the flex layout of a shown row (`.pane` is `display: flex; flex-direction: column`, `PaneView.svelte:491-503`) is a visible fact, and `spec.md:60` and `:65` give that to the look.

4.5 Item 6 and C10 hold under `spec.md:59` if the envelope is taken as the one input of the row. The 'documents pane' row of the same table (`layout-saved.test.ts:78-80`) mixes a marked and an unmarked pane in the same way.

4.6 No case asks the builder to check, quote or explain a place the step does not change. C6 (float move, `float-gesture.ts`) and C9 (drag, `drag.svelte`) run through unchanged code, but only as a consequence of the overlay, which the step does change.

## 5. The question

The goal: a pane whose tab row the reader hides from its pane menu, shown while the pointer is at its top edge.

5.1 The step line's check: the line names no check of its own. The gate is the orchestrator's look on TEST for C1-C9 and C11. It cannot pass without the goal, provided the look runs C2 on a pane of a page.

5.2 Item 1: yes. The items can exist with a pick that does nothing, or one that returns early: `PaneView.svelte:414` `if (active === '') return;` comes before the split items. C1's look catches this only for a pane with a tab (see 6.1).

5.3 Item 2: yes. The field can be saved and carried without anything drawing differently. Item 3 and C2 close that.

5.4 Item 3: yes at the builder's stage. Under `spec.md:64-65` the builder proves it by reading only, so the look is the only proof.
- The words "draws no row" also allow an `{#if}` that removes the row from the DOM. That passes C2 and fails C8, because a row that is not in the DOM takes no Tab stop. Item 3 has to say the hidden row stays mounted and in the tab order.

5.5 Items 4, 5 and 7: yes. Each is a standards obligation that is independent of the goal.

5.6 Item 6 / C10: yes. It reads the saved field only. That is right for its scope.

5.7 C1: yes for the edge, which C1 does not test. C2 tests it.

5.8 C2: no. It is the goal. It is only partly proved for "the view's size unchanged": a terminal's reflow on a resize is hard to see on a look unless the look watches the terminal's columns.

5.9 C3, C4, C6, C7, C8, C9, C11: each could pass with the goal unmet elsewhere. Each guards one input and is not a gate for the goal.

5.10 C5: yes. It checks persistence only.

5.11 C12: yes. It is a regression check by reading (see 4.4).

## 6. Implied inputs

6.1 A pane with no tab: an empty documents, locked or terminals pane. Expected: Hide Tab Row is offered and its pick hides the row; the empty pane's line fills from the top. At risk: `PaneView.svelte:414` returns before any later branch. No case covers it.

6.2 The last tab closing in a hidden pane that stays (locked, documents or terminals; `tree.ts:179-187` `keptPane`). Expected: the pane stays hidden, as it stays locked. Without a change to `keptPane` the choice is lost silently. `tree.ts` is in the write list, but no item names `keptPane`.

6.3 Two browser tabs: a Hide or Show from one tab rerun on an arrangement another tab moved (G102). Expected: it is applied to the pane named by its tabs, or dropped. Without a `PATH_OPERATIONS` row it lands on whatever pane is at the old path. This widens the paths (see 1.1).

6.4 `show_tabs: none` with `editor_actions: strip` in the desktop app. `PaneStrip.svelte:118-120` hands `heading`, and so the pane menu, up to the window title bar strip, and the pane's row is `none`. Expected: unsettled. Either the item is offered and hides only the path bar, or it is not offered. C11 and item 3 disagree (see 4.2).

6.5 A free float: its top edge is also a resize margin (`float-gesture.ts:47` `GRAB_PX = 6`, `:124-126`). A float docked on the bottom has its `Sash` on its top edge (`FloatLayer.svelte:142-148`). Expected: hover in the band shows the row, and a press inside the 6 px margin, or on the sash, still resizes.

6.6 A tab dragged out of the shown row. Once the pointer leaves the row, the row hides while the drag is in flight. Expected: the drag goes on and the drop lands. If the row is unmounted mid-drag, the strip's pointer handlers go with it and the drag could be lost.

6.7 A wallpaper (`body.wall`). `PaneStrip.svelte:262-266` makes `.path` and `.title` transparent on a surface, and the tab strip is translucent over a wallpaper. Drawn over the view's text, the shown row would be hard to read. Expected: the row shown at the edge stands on a surface that keeps it readable.

6.8 A right-click in an empty pane's body under `editor_actions: hidden`. `PaneView.svelte:478-479` hands `stripItems` to `PaneBody`, so the body menu gains the item through `PANE_ONLY`. Expected: Show Tab Row is offered there and works. This is a reader-visible path that no case or HELP line names.

6.9 The new menu ids: empty, duplicated or colliding with an existing id or prefix (see 4.3). Expected: distinct ids that `isFloatItem` and `isPaneItem` route only to the new branch.

## 7. ADRs

7.1 `ls docs/adr` prints `ls: docs/adr: No such file or directory` (exit 1). There is no ADR, so the step touches none. The brief's statement holds.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O51.md` prints nothing, so the brief is ASCII.

8.1 `pane_hide_tab_row: Hide Tab Row`, found by `grep -n "pane_hide_tab_row: Hide Tab Row"` at line 23. Holds: ASCII, the ruling's words, and the key joins the `ui` group at `config/text/ui.yml:43-55`, where the `pane_` keys are (`spec.md:50`).

8.2 `pane_show_tab_row: Show Tab Row`, at line 23. Holds for the same reasons.

8.3 The field `rowHidden?: true`, found by `grep -n "rowHidden?: true"` at line 24. Holds. It is a key in a saved record under `~/.oculus` (`spec.md:18`), named in decision 7, so it is not silent.
- The brief's sentence "No config key, wire format or vocabulary is added" (line 31) is true for those three kinds. It leaves out that a saved-record key is added, which decision 7 covers.

8.4 The test row title 'the current version with a pane whose tab row is hidden', at line 28. Holds against `spec.md:44`: no history word, no package id.

8.5 The HELP bullet content, at line 27: "Hide Tab Row in the pane menu hides that pane's tab row, which shows while the pointer is at the pane's top edge, and Show Tab Row brings it back." It holds against `spec.md:21` (plain, ASCII, no 'not X but Y') and `spec.md:56` (one line). It leaves out two things a reader meets:
- the path bar hides with the row (decision 4);
- under `editor_actions: hidden` the item is in the strip's right-click menu, not a pane menu (C7).
`spec.md:70` asks that what a user does goes into HELP. These are omissions, not broken rules.

## Declined to judge

- Whether the drag system's strip hover (`Tabs.svelte` `onhoverindex`, `drag.svelte.ts`, `DropLayer.svelte`) delivers C9 through a 4 px band: I did not read those files, and a read would not settle it without the look.
- Whether `npm run diagrams` output changes: running it writes files, and this check changes nothing.
- The verify list's exact contents in `orchestrator-state.md:6`: I read the key line only, not the command block.
- Whether Title Case "Hide Tab Row" beside the sentence-case `pane_` labels ("Close pane", "Fold pane") is right: the ruling dictates the words, and no spec.md rule covers label casing.

Usage: a760fccefd58a7066, claude-opus-5-5, 216679 tokens, 58 tool uses, 8 min 23 s

## Closed

Each finding is closed by a change to `agents/briefs/O51.md` as written again on main at 81740255, after rulings 245 (a) and 246 (a).

- 1.1, 6.3: ruling 245 (a). Item 3 adds the `PATH_OPERATIONS` row in `rerun.ts` and G102's row in both orders; `rerun.ts` lines 31-45 and `layout-workspaces.test.ts` lines 241-283 join the paths; case C15; Verify 2 runs the G102 table.
- 1.2, 3.3, 6.2: item 2 has `keptPane` carry `rowHidden` and both doc comments name it; item 7 names the doc comments of `repane` (`model.ts:353-359`) and `keptPane` (`tree.ts:172-178`); "What is on the tree" names both places that carry the flags; case C14.
- 1.3, 1.6, 1.7, 1.8, 1.10, 3.1, 3.7, 3.9, 3.10, 3.12, 3.13, 4.5, 4.6, 5.1 to 5.3, 5.5 to 5.11, 7.1, 8.1, 8.2, 8.4: hold; no change.
- 1.4: the Read list takes `pane-view.ts` 128-400, so `stripMenu`'s body is read.
- 1.5: item 7 names `floatMenu`'s doc comment (`pane-view.ts:280-283`).
- 1.9, 3.2: the `Pane` type is named at `model.ts:59-68`, its doc comment 48-58.
- 1.11: ruling 246 (a). Item 4 gives `Menu.svelte` and `ContextMenu.svelte` a bindable `open` prop; both files join the paths; item 5 reads the menu's open state from it; item 7 names their head comments.
- 1.12: item 6 keeps the edge and the shown state in `PaneStrip.svelte` and `pane-view.ts`, and a split of `panes/` or `strip/` widens the paths to the moved files and their importers, named in the report.
- 3.4: `paneMenu` is named at 134-167 with Move into New Window as today's last item; item 1 puts the new item after it.
- 3.5: the doc comments are named at 129-133 and 169-173.
- 3.6: `stripPick` is named at 279-305, its `isPaneItem` branch at 281-284.
- 3.8, 6.5: the FloatLayer sentence is named at lines 22-26 with the resize by the edges; item 5 says a press on the 6 px margin or a docked float's sash still resizes; case C16.
- 3.11: "What is on the tree" names G31 and G102 beside G29; the Read list takes the three entries.
- 3.14: "What is on the tree" names the base copy `.agents/worktrees/migration-O51-base/` with `unused-exports.txt`; Verify 5 compares with that path.
- 3.15: the Read list takes `pane-view.ts` 300-400, `tree.ts` 170-190, `index.ts`, `rerun.ts`, the two menu files, `menu-items.ts` 100-179, `PaneBody.svelte`, `float-gesture.ts` 40-130 and `FloatLayer.svelte` 130-160.
- 4.1: item 5 keeps the row shown for focus that came by a key press only, and decision 8 says why; C1 and C3 name a pointer pick; case C21 covers a keyboard pick.
- 4.2, 6.4: item 5 says a pane whose row is `none` hides and shows its path bar alone, and one with neither shows nothing; decision 4 and case C11 say the same.
- 4.3, 6.9: item 1 names the ids `hide-tab-row` and `show-tab-row`; case C20 checks them empty, duplicated and colliding with every id and prefix and against `isFloatItem` and `isPaneItem` (`grep -rn "hide-tab-row\|show-tab-row" src config --exclude=local.yml` exits 1 on main).
- 4.4: C12 is taken on screen on TEST at landing, and says no new box changes a shown row's layout.
- 5.4: item 5 says the hidden row stays mounted and in the tab order.
- 6.1: item 1 puts the pick before `if (active === '') return;`; case C13.
- 6.6: item 5 keeps the row shown during a drag started from it; case C17.
- 6.7: item 5 sets the shown row on the pane's own background; case C18.
- 6.8: item 1 names the body menu; case C19.
- 8.3: the closing paragraph of "What to build" names the saved pane key `rowHidden`.
- 8.5: item 7 asks the HELP bullet to name the path bar and the strip's right-click menu under `editor_actions: hidden`; it is no longer dictated, so the builder words it.

Dictated lines added after the check, held line by line: `hide-tab-row` and `show-tab-row` (item 1: kebab ids as `move-to-page` and `show-a-page`, ASCII, holds); the G102 row title `a hide of the tab row of a pane the other tab moved lands on that pane` (item 3: ASCII, no history word, no package id, the table's shape of `a fold of a pane the other tab moved lands on that pane`, holds); the marker ` hidden` in `panesOf` (item 3: as ` folded`, holds).
