# Brief: X3c, the tab strip brought to VS Code's editor tabs: pinned tabs, the tab's right-click menu, the session pin relabelled, wrapped tabs as a setting, breadcrumbs over a file tab, the full path in a file tab's tooltip, Open Editors dragging the tabs into order, and the Files tree's breadcrumb removed

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The plan names no further standards. No ADR touches the step: the repository has no `docs/adr` folder and the configuration block has no `adr:` key (`ls docs/adr` fails; `grep -n '^adr' .agents/plan.yaml` prints nothing).

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The plan line and the rulings

"X3c the tab strip brought to VS Code's editor tabs, every row of P1's Editor tabs table (split from X3 on 2026-09-25), after Q81 lands, the tab's right-click menu built here on Q81's bits-ui menus (Z47 1 (a)); in full in `agents/briefs/X3c.md` (ruling The queue) (ruling Z47)" (`plan.md:215`). The full line, kept in this file before it was rewritten, adds: "VS Code's pinned tab is called "Pin", and oculus's session pin is relabelled "Lock to this session", its state unchanged (Z47 2 (a)); wrapped tabs are a key `wrap_tabs: false` in `config/appearance.yml` with a toggle in the Settings view's Appearance section (Z47 3 (a)); breadcrumbs show the path of a file tab (the source tab, a document, a PDF) above its body as `Breadcrumb.svelte` segments, a segment opening the Files view at that folder, symbols waiting for D23 (Z47 4 (a))".

- P1's Editor tabs table (`agents/reviews/vscode-parity.md:96-107`): pinned tabs; the tab context menu (close others, to the right, all); editor actions at the strip's end; breadcrumbs; wrapped tabs. Preview tabs, the dirty dot with close on hover, and split right and down are already there.
- Pinned tabs (Axel, 2026-09-25, `orchestrator-state.md` closed log "X3c, two shapes of the tab strip" (1) (a)): `pinned?: true` on `Instance` beside `preview`, the layout version raised with a migration, a pinned tab drawn first with a pin in place of its close control and kept by Close Others and Close All, as VS Code does.
- Z47 (the user): 1 (a) after Q81, the tab menu on bits-ui; 2 (a) "Pin" and "Lock to this session"; 3 (a) `wrap_tabs: false` in `config/appearance.yml` with a toggle in the Appearance section (this supersedes the 2026-09-25 per-browser toggle); 4 (a) breadcrumbs over a file tab now, symbols after D23.
- Z152 (the user): X3c after Q88c. Q81 and Q88c have landed (`plan.md:275`, `:299`, ticked).
- Z161 (automode): U3 changed only `TabFace.svelte`'s `.cells` size and focus ring; the rest of the strip is X3c's.
- Z262 (automode): the tab tooltip names the full path; Open Editors drag reorders tabs; the Files tree's breadcrumb goes once X3c's file-tab breadcrumbs are in.
- Z267 (the user): no separate path bar; the path shows in X3c's tooltip and breadcrumbs.

## Carried into this brief before dispatch

These widenings of the step's line in `plan.md` were booked after this brief was written. Before the builder is launched, each becomes an item under "What to build", its cases under "Cases" and its files under "Paths this step writes", with its premise checked on main's head; each defect's full look record is in `agents/reviews/owed-looks.md` under its id.

- Widened 2026-10-02 (Z288, the orchestrator, automode): a path breadcrumb on a file tab in place of its name row, at VS Code's measured size; the tab's buttons (Save, Revert, star, Open in Program, Preview, Blame) at the strip's right end with the second row removed; a long palette result on one line with an ellipsis; a click on a rail button never writes a rail reorder.
- Widened 2026-10-02 (Z289, the orchestrator, automode): a Markdown preview table keeps its first column readable in a narrow pane (M3-4); the Markdown preview is off by default and never takes over half a narrow pane (D13a-4); Editor Actions Position names VS Code's places with a check on the chosen one, and Hidden hides a float's More too (Q88c-15); New Text File opens an untitled text file (Q88c-16); closing a tab activates the tab active before it (Q88c-17); Float and Return to Page keep a terminal's scroll position (L4-1); a Terminal tab is titled by its process (L4-2).
- Widened 2026-10-02 (Z292, the orchestrator, automode): a palette row whose title is longer than the row keeps to one line, cut with an ellipsis, as VS Code's quick pick does, so it never draws over the next row (R18-look-1, `src/lib/shell/keys/Palette.svelte`).
- Widened 2026-10-02 (Z293, the orchestrator, automode): at a large text size in a narrow pane a tab keeps its title readable before the strip's arrows and actions take their width, as VS Code's tabs shrink to fit (U3-look-1).
- Widened 2026-10-02 (Z294, the orchestrator, automode): the strip scrolls the active tab into view whenever a tab becomes active, as VS Code's does (Q78-look-1).
- Widened 2026-10-02 (Z295, the orchestrator, automode): the status bar keeps its branch and sync items while a diff tab is on screen, the tab's file read in the repository its state names by folder as well as under a served root, as VS Code keeps them for a diff editor (A1-look-1, `src/lib/state/workbench/navigation/status.ts:176-178`).

## What is on the tree (read on main at a9c0d38d)

All paths below `tools/oculus/` unless they start with `.agents/`.

- `Instance` is `{ id, view, state, preview?: true }` (`state/workbench/layout/model.ts:18`); `LAYOUT_VERSION = 5` (`:131`). No pin of a tab exists. The session pin of a view is `pinInstance(id, session, label)` and `unpinInstance` (`state/workbench/layout/instances.ts:54`, `:116-140`), offered by `views/shared/sessions/SessionPicker.svelte:77-78` with the words `sessions.pin_pane` "Pin this pane" and `sessions.unpin_pane` "Unpin this pane" (`config/text/views/sessions/session-list.yml:43`, `:67`). (`sessions.pin_label` "Pin" in `SessionDetail.svelte:315` is the session's scoring pin, not this one, and stays.)
- The pane's tabs are built in `shell/panes/PaneView.svelte:162-190` (482 lines): label, glyph, `preview`, `hint` (the preview sentence, or the view's name when the state carries its own label), badges. `Tab` is `ui/tabs/tab-strip.ts:8-30` (137 lines). `TabFace.svelte` (316) draws a face; `Tabs.svelte` (361) the strip; `tab-scroll.svelte.ts` (161) its scrolling; `shell/panes/strip/PaneStrip.svelte` (184) the pane's top row under `show_tabs` and `editor_actions` (`config/appearance.yml:76-78`, catalog `config/catalogs/options.yml:92-104`): Split Right, the lock mark, the pane menu's `...`.
- A right-click on a tab is stopped and opens nothing (`PaneView.svelte:277-281` `onTab`); the strip's own right-click menu (`stripMenu`, Q88c) is the pane's (`:232-245`, `ContextMenu` at `:411`). The close guard is `askAndClose` (`:300`), used by the close control, Delete and the pane menu.
- A tab is moved to a pane and index by `transferInstance(id, path, index, page)` (`state/workbench/layout.svelte.ts:181`); the strip's drag uses it.
- A tab names a file when its state carries a root key and a path: `fileOfTab(tab)` (`state/sources/explorer/sections/open-editors.ts:42`). The Open Editors section (`views/sources/files/sections/OpenEditors.svelte`) lists them per pane, with no drag.
- `ui/tabs/Breadcrumb.svelte` (96) is drawn only by the Files view, over the tree, for the selected row (`views/sources/files/Files.svelte:66`, `:400-408`, label `files.breadcrumb`). No file tab draws one.
- `git grep -n "wrap_tabs\|wrapTabs" -- src config ':!config/local.yml'` prints nothing.

## What to build

1. **Pinned tabs**: `pinned?: true` on `Instance`; `LAYOUT_VERSION` 6, with a migration step that reads a version-5 layout unchanged (no tab pinned); a pinned tab is never a preview (pinning keeps a preview tab); in a pane the pinned tabs come first, in their order, then the rest; a pinned tab draws a pin glyph in place of its close control, and a press on the pin unpins it; a drag of an unpinned tab into the pinned run pins it and a drag of a pinned tab out of it unpins it, as VS Code does; Close Others, Close to the Right, Close Saved and Close All leave pinned tabs open; the close control's own close and Cmd+W close a pinned tab as any other. Pin Editor and Unpin Editor are commands of the palette with VS Code's key, Cmd+K Shift+Enter, toggling the active tab.
2. **The tab's right-click menu** (bits-ui `ContextMenu`, as the pane strip's): a right-click on a tab opens it for that tab, with the items in VS Code's order and words: Close, Close Others, Close to the Right, Close Saved, Close All; then for a tab naming a file Copy Path, Copy Relative Path and Reveal in Files View; then Keep Open (a preview tab only) and Pin or Unpin; then Split Right and Split Down. Every close goes through `askAndClose`, so a tab with unsaved text or a running program asks first. `onTab` stops only the pane menu, not the tab's.
3. **The session pin relabelled**: `sessions.pin_pane` reads "Lock to this session" and `sessions.unpin_pane` "Unlock from this session"; the state and its functions are unchanged; HELP.md's words follow.
4. **Wrapped tabs**: `wrap_tabs: false` in `config/appearance.yml` with its catalog entry (a toggle, section Appearance) so the Settings view draws it; when true the strip wraps its tabs onto as many rows as they need and does not scroll, as VS Code's `workbench.editor.wrapTabs`; the pane's actions stay at the end of the first row.
5. **Breadcrumbs over a file tab**: a tab that names a file (`fileOfTab`) draws `Breadcrumb.svelte` above its body: the root's label, then each folder, then the file; a press on a folder segment or the root opens the Files view rooted at that folder (the Files tab's `top`), a press on the file segment reveals it in the Files view. Symbols are not drawn (D23). A tab naming no file draws none. Under `show_tabs: none` the breadcrumb still draws.
6. **The full path in a file tab's tooltip**: a tab naming a file has `hint` the file's full path (the root's folder joined with the path, `~` for the home folder), and a preview tab's hint names both the path and the preview sentence.
7. **Open Editors drags the tabs**: a row of the Open Editors section drags onto another row and the tab moves to that place in that pane through `transferInstance` (another pane's row moves it into that pane); a pinned tab dropped among unpinned rows unpins, as item 1 says.
8. **The Files tree's breadcrumb removed** (Z262): `Files.svelte` no longer draws `Breadcrumb` or computes `crumbs`; `files.breadcrumb` goes from the text catalog if nothing else uses it.
9. **Editor actions at the strip's end**: the row is met by the actions Q88c placed (Split Right, the lock mark, `...`) under `editor_actions`; this step adds nothing there and the report says so with the file and line.
10. **Words and docs**: every new sentence a key of the text catalog; HELP.md's tab strip, Files view and session lock passages and DESIGN.md's lines on the layout model and the strip updated.

## Cases

- C1. A version-5 saved layout reads into version 6 with no tab pinned and every other field equal (deep equality); a version-6 layout with a pinned tab reads back pinned.
- C2. Pinning the third of four tabs puts it first; pinning a preview tab clears `preview`; unpinning puts it first among the unpinned.
- C3. Close Others on an unpinned tab with one pinned tab in the pane: the pinned tab and the chosen one stay; Close All keeps the pinned tab; Close to the Right of a pinned tab closes the unpinned ones to its right.
- C4. Close Others when one of the closed tabs holds unsaved text: the close question first (the existing guard), nothing closed on No.
- C5. The tab menu's items for a file tab, a non-file tab and a preview tab: the lists in item 2's order, Keep Open only for the preview, Pin or Unpin by state (over the menu's item function).
- C6. Copy Relative Path of `projects/x/README.md` under the hub root: the text `projects/x/README.md`; Copy Path: the absolute path.
- C7. `sessions.pin_pane` and `sessions.unpin_pane` read the new words; `pinInstance` behaves as before (a preserved behaviour).
- C8. `wrap_tabs` read as `false` by default and `true` when set; a non-boolean value is a config finding and reads as `false`; the Settings view lists the toggle in Appearance.
- C9. The strip's layout function with `wrap_tabs: true`: no scroll offset, rows as needed (over the pure function the strip uses).
- C10. The breadcrumb segments of a source tab on `projects/x/manuscript/main.tex` in the hub root: root label, `projects`, `x`, `manuscript`, `main.tex`; the target of the `x` segment is a Files tab rooted at `projects/x`; a tab with no file has no segments.
- C11. The hint of a file tab is its full path; of a preview file tab, the path and the preview sentence; of a non-file tab, as before (a preserved behaviour).
- C12. Open Editors: a row dragged before another row in the same pane calls `transferInstance` with that pane's path and the target's index; onto a row of another pane, that pane's path.
- C13. The Files view draws no breadcrumb.
- C14. A drag of an unpinned tab into the pinned run pins it; a pinned tab dragged past the run unpins it.
- C15. Cmd+K Shift+Enter toggles the active tab's pin; the palette lists Pin Editor and Unpin Editor.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted. A case of a code step becomes a test of the step, run on the unchanged tree first; no prototype script stands in for the test. A behaviour that needs a DOM (a press, a drag, a right-click, wrapping) is seen at the look, and its test is stated over the pure functions, the layout store and the menu's item function.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/state/workbench/layout/model.ts`
- `tools/oculus/src/lib/state/workbench/layout/instances.ts`
- `tools/oculus/src/lib/state/workbench/layout/saved/` (the version 6 migration)
- `tools/oculus/src/lib/state/workbench/layout.svelte.ts`
- `tools/oculus/src/lib/state/workbench/palette.ts` (the two commands, if commands are listed there)
- `tools/oculus/src/lib/shell/panes/PaneView.svelte`
- `tools/oculus/src/lib/shell/panes/strip/` (`PaneStrip.svelte`, `strip-shape.ts`, and a new `tab-menu.ts` for the tab menu's items)
- `tools/oculus/src/lib/shell/panes/PaneBody.svelte` (the breadcrumb above the body)
- `tools/oculus/src/lib/ui/tabs/` (`TabFace.svelte`, `Tabs.svelte`, `tab-strip.ts`, `tab-scroll.svelte.ts`, `Breadcrumb.svelte`)
- `tools/oculus/src/lib/shell/keys/` (the Cmd+K Shift+Enter chord)
- `tools/oculus/src/lib/views/sources/files/Files.svelte`
- `tools/oculus/src/lib/views/sources/files/sections/OpenEditors.svelte`
- `tools/oculus/src/lib/state/sources/explorer/sections/open-editors.ts`
- `tools/oculus/config/appearance.yml` (the `wrap_tabs` key), `tools/oculus/config/catalogs/options.yml` (its entry)
- `tools/oculus/config/text/ui.yml`, `tools/oculus/config/text/views/sessions/session-list.yml`, `tools/oculus/config/text/views/sources/files.yml`, `tools/oculus/config/text/app.yml` (the key sheet)
- `tools/oculus/HELP.md`, `tools/oculus/DESIGN.md`
- `tools/oculus/tests/` (the tests of the cases)
- `tools/oculus/.scratch/migration/agents/reviews/X3c-report.md`

## Decisions taken in this brief (each reversible, none silent)

1. The tab menu's items and order are VS Code's tab context menu's, less what oculus has no part for (Reopen Editor With, Compare, Share).
2. Unlock's word is "Unlock from this session", the pair of Z47's "Lock to this session".
3. The breadcrumb draws under `show_tabs: none` too, as VS Code's breadcrumbs are a setting apart from the tabs.
4. A preview tab's tooltip carries the path first, then the preview sentence, so the path is never hidden.

## Libraries checked

`libraries: check` (`.agents/plan.yaml:15`). The menu is bits-ui (Z47 1 (a), already a dependency); the breadcrumb and the strip are the project's own. No library would replace code this step writes: none found. The builder adds no dependency.

## Read, with sections or line ranges

1. `src/lib/state/workbench/layout/model.ts` whole, `instances.ts` whole, `saved/saved.ts:430-520`.
2. `src/lib/shell/panes/PaneView.svelte` whole, `strip/PaneStrip.svelte` and `strip-shape.ts` whole.
3. `src/lib/ui/tabs/` whole.
4. `src/lib/views/sources/files/sections/OpenEditors.svelte`, `state/sources/explorer/sections/open-editors.ts` whole; `Files.svelte:60-120` and `:380-420`.
5. `agents/reviews/vscode-parity.md:96-107`.

## What it must do

As "What to build" says, items 1 to 10. Every sentence a reader sees is a key of the text catalog; no sentence is written in code.

## Conventions

The rules file's. ASCII only in `src` and `tests`. Comments say what and why, never when or which step. Files under the size limit the checks enforce (`PaneView.svelte` is 482 lines: the tab menu's items go in `strip/tab-menu.ts`), folders under the item limit (`shell/panes/` holds 10 items). The ledger is not written beyond the report.

## Verify before you report

Run from the worktree's root, each must hold, each output piped through the filter the rules file names:

1. The plan's verify list, run as `sh ~/.claude/skills/land/templates/checks.sh tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree's root, prints `$ <command>` and the output of each command, then `checks: 7 commands passed`, and exits 0; the lines it prints are what the report quotes.
2. `grep -n "Breadcrumb" tools/oculus/src/lib/views/sources/files/Files.svelte` prints nothing.
3. Each new or changed test of a behaviour the change adds or changes fails on the unchanged tree, in the form it has after its last change, and the report quotes that failure; each new or changed test of a behaviour the change preserves passes after the change and, where it can run there, on the unchanged tree, and the report quotes those runs. A test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof, and this brief says which it is.

Look items on landing (TEST, the orchestrator): a pinned tab, the tab menu on a file tab, wrapped tabs, the breadcrumb over a source tab and a press on a folder segment, a file tab's tooltip, an Open Editors drag.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/X3c-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim. Then the cases' first run: each case with its result on the unchanged tree, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling. Then the DONE / NOT DONE table with the checks above and their output verbatim. Then files with line counts, every judgment call the brief left open, every host- or user-visible change with its before and after, and anything in the brief that was wrong or impossible, with the evidence.
