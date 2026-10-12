# Step D69 refuter report (on .agents/worktrees/D69, base ff113f762)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All runs from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D69/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. `npm run diagrams` was not run, since it writes into the tree; the diagrams check below covers stale diagrams.

```
npm run test:quick -- --base ff113f762
test:quick: 19 changed file(s), from git since ff113f762
test:quick: 12 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.4 s)
ok      svelte-kit sync (1.9 s)
ok      svelte-check (5.7 s): 1791765927936 COMPLETED 478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (11.7 s): Duration  7.34s (transform 9.34s, setup 0ms, import 17.05s, tests 8.01s, environment 2ms)
test:quick: 12.2 s (limit 45.0 s); every command passed

LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <the 14 changed text files and the two .dot files>
(no output), rc=0

sh utils/unused-exports.sh  -> "Unused exports (244)"; diff against D69-base/tools/oculus/unused-exports.txt -> no output, rc=0

wc -l: DESIGN.md 681, HELP.md 474, AppItems.svelte 64, LanguageItems.svelte 298, SourceItems.svelte 191, StatusBar.svelte 396, ToolButton.svelte 485, Editor.svelte 517, DiffEditor.svelte 491, kit/load.ts 511, options.ts 233, MenuOpener.svelte 275, wrapped.ts 24, kit/theme/wall.css 25
sh utils/folder-check.sh -> no output, rc=0

npx vitest run tests/ui tests/shell tests/views/sources
 Test Files  8 passed (8)
      Tests  36 passed (36)
```

Commands the builder's report quotes as evidence:

```
npm run check -> COMPLETED 3787 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx eslint src/lib/ui/controls src/lib/shell/status src/lib/ui/menu -> no output, rc=0
npx vitest run tests/checks/tree -> Test Files 3 passed (3), Tests 39 passed (39)
npx vitest run tests/checks/diagrams --testTimeout=600000 -> Test Files 1 passed (1), Tests 46 passed (46), Duration 266.98s
npx vitest run tests/checks/config ->
     x validates with no findings
     x reads the roots of sources.yml without a finding
     x names a group of its own and a path under the hub for every document
 Test Files  2 failed | 2 passed (4)
      Tests  3 failed | 79 passed (82)
folders: kit/theme holds 5 items (colours.ts, rename.css, semantic.ts, theme.ts, wall.css), shell/status holds 9: matches the report
git status --short (after every run above): the same 16 modified and 3 untracked paths as before the review
```

The three config failures are not caused by the step. The worktree's sparse checkout (`/Users/axelfaes/workspace/research-hub/.git/worktrees/D69/info/sparse-checkout`) lists no `/.oculus/`, and `ls .oculus` in the worktree root prints "No such file or directory". The failures follow from that: `reads the roots` fails on `expect(ROOTS.length).toBeGreaterThan(0)` (0 roots), and every integrity finding names ".oculus/config/catalogs/vocab.yml in the hub". The tests import nothing the step changes. They will run correctly on main, where `.oculus/config/` exists.

## Verdicts

Items of the brief's "What to build":

- 1: violated. These parts hold: the hover, suggest, parameter hints and rename box go to per-editor nodes on the body (`options.ts:196-233`, `Editor.svelte:226-243`, `DiffEditor.svelte:192-222`); the right-click menu goes to the page node through the layout override (`contextmenu.js:183-186` with `fixedOverflowWidgets` true, then `contextViewService.js` `getContainer`); the override is in force before any service call (see the priming trace under "Declined to judge"); the depth is 50; DESIGN.md:246 is extended; each component is under 520 lines. These parts are violated: the code action list is not on a body node (Spec 1); keys typed in a peek's widgets go to the wrong editor (Spec 2); the Quick Fix list is cut to three rows (Behaviour 1). Spec 3 records the one-node shape being replaced, with evidence that holds.
- 2: violated, narrowly. The flex layout, the reversed markup, the 40vw cap, `overflow: clip` and the inert marking hold by reading. The linter item, which holds several buttons in one capped span, overlaps instead of ending in an ellipsis (Behaviour 5).

Cases of the brief's "Cases":

- 1: met by reading. With `fixedOverflowWidgets: true`, `contextmenu.js:183-186` sets `useWindowContainerForShadowRoot`, so `contextViewService.js` draws the menu in `layoutService.getContainer(window)`, which is the page node (`options.ts:106-145`). The menu is placed by `layout2d` against the viewport (`contextview.js:244-268`), outside every pane and blur. The look settles it.
- 2: met by reading, by the same path.
- 3: met by reading. Hover and suggest are fixed content widgets in the editor's body node (`contentWidgets.js:155`, `:272`).
- 4: met by reading. The nodes are fixed on the body, outside `FloatWindow`/`FloatLayer`, and `layout2d` keeps the menu inside the viewport.
- 5: met for the right-click menu and the suggest list by reading. Both inner editors of the diff editor and the peek's editor (`embeddedCodeEditorWidget.js:29`) take the node. The merge editor is `Editor.svelte`.
- 6: met for the right-click menu by reading. The page node has z-index 50; floats are at 5+2*rank inside the root stacking context.
- 7: partial. In a source tab, Enter and Escape are met by reading: the relay's copy reaches `StandaloneKeybindingService` on the container (`standaloneServices.js:233-241`), and the editor's context still holds `renameInputVisible`. Tab is a different case. `tab-out.ts` still sees the copy, but the browser's own Tab from the rename input now moves focus to whatever follows the body node (Behaviour 4).
- 8: met by reading. In grow mode the left group keeps its max-content width while the right group has room (`StatusBar.svelte` `.group`, right group `flex: 1 1 0`). The right order is reversed back by `row-reverse`; the base and new item orders were compared line by line (`diff <(sort base) <(sort new)` shows only comment lines differ).
- 9: met by reading. The right group's hypothetical size is clamped up to its min-content (widest item, at most 40vw), so the left group shrinks only once the right group is at that width. The two together never pass 80vw. The look settles it at 600 px.
- 10: met by reading. RepoItems' branch item is a `Menu status`, which renders `.opener.status` with a `.label` child (`MenuOpener.svelte:77-100`). The app item is a `ToolButton status` with a `.label` child (`ToolButton.svelte:112`). Both are capped and get the ellipsis. The Tooltip `.tip` span (`inline-flex; min-width: 0`) passes the cap through.
- 11: met by reading. The debug `Menu status` sits in the left group like the others, and `.bar.debugging` is unchanged.
- 12: met by reading. The second row starts at offsetTop 22 (the buttons are `--status-height` 22 px) against a group clientHeight of 21 (a 22 px bar minus its 1 px border), so `wrapped.ts:18` marks it inert. `overflow: clip` makes no scroll container. The menu is built from `STATUS_ITEMS`, and a hide re-runs the mark through the MutationObserver.

## 1. Spec

- `src/lib/ui/controls/editor/options.ts:98-145` and the report's "Wrong in the brief" 4: "Not changed: `Diff.svelte` is at 520 lines and `merge/Pane.svelte` is shared by three tinted views". **What is wrong:** Item 1 asks for "every other widget Monaco draws outside the text ... in the diff editor ..., the merge editor ..., in every theme, wallpaper on or off ... never cut by ... the diff list ... and drawn above every float". The code action list (lightbulb and Cmd+.) is not on a body node, and neither is the post-paste selector. `codeActionController.js:246,311` passes `this._editor.getDomNode()` to `actionWidget.js:57-69`, which calls `showContextView(..., container, false)`, so the list is `position: fixed` inside `.monaco-editor`. The override is never asked about it. This leaves three defects:
  - Under the wallpaper it is clipped by the blur at `views/sources/repositories/diff/Diff.svelte:518` and `ui/frame/Pane.svelte:85` (left as is).
  - In every theme it is drawn inside the page area's stacking context (`shell/Workbench.svelte:505`, `isolation: isolate`), so under every float.
  - Under the wallpaper in a source pane, its z-index of 2575 is confined by the new `isolation: isolate` (`kit/theme/wall.css:8-10`). A later neighbouring pane's positioned content paints over it.

  The deferral reasons do not block the work. Removing `backdrop-filter` from `Diff.svelte` lowers its line count, and the `::before` layer can go in a stylesheet as `wall.css` does for the editor. A tinted Pane's blur moved to a pseudo-element changes all three tinted views alike. The z-order needs the list's container routed to the page node. The report shows no attempt at either. The report's first line ("Everything in the brief is built ... one hazard is left open") and "NOT DONE: nothing inside the brief's scope is left" present this part as done. **Failure scenario:** a Python file in the left pane of two under a wallpaper theme, a Ruff finding near the pane's right edge, Cmd+. opens the list: its part over the right pane is painted under the right pane's editor. The same list in a pane under a free float is drawn under the float. **Verdict:** item 1 violated.
- `src/lib/ui/controls/editor/options.ts:202-207` with `Editor.svelte:240-243` (`widgets.tie(() => [made], () => made)`): **What is wrong:** the peek's `EmbeddedCodeEditorWidget` takes the parent's node (`embeddedCodeEditorWidget.js:29`), so its widgets (a rename box, a focused hover) are drawn there. The relay dispatches their keys on the parent editor's root. The keybinding service resolves the context from that target (`standaloneServices.js:236`), which is the parent's context. `renameInputVisible` is bound on the embedded editor's own context, so `acceptRenameInput` (`rename.js:351-357`) does not match. Before the step those keys had a target inside the embedded editor. `sides` also leaves the embedded editor out, so its widgets are not placed again on an ancestor scroll. Item 1 names the peek and asks that keys in a widget "behave as today". **Failure scenario:** a peek of references in the same file, F2 on a name inside the peek's editor, type a new name, press Enter: nothing is renamed. **Verdict:** item 1 violated.
- `options.ts:196-233`, DESIGN.md:246 ("each editor has one node of its own ... and the context view has one for the page"): **What is wrong:** the brief named one node on the body. The builder made one per editor plus one for the page. Its evidence reproduces: `view.js:731-760` counts focus anywhere in an editor's `overflowWidgetsDomNode` as that editor's widget focus, and `abstractCodeEditorService.js:66-79` returns the last editor with widget focus. A shared node would make every editor hold widget focus whenever any widget does. This is a premise correction for the booking, with nothing to repair. **Failure scenario:** none on the tree. With the brief's one node, `acceptRenameInput` would run on whichever editor Monaco lists last.

## 2. Proof

- Report, "Visible changes", code action list: "source editor whole under a wallpaper (the blur containing block is gone)". **What is wrong:** by reading, the list is no longer clipped by the box, but it is painted under any later positioned sibling (Spec 1, third defect), and it is cut to three rows (Behaviour 1). The landing's look is read against this line. **Failure scenario:** the look checks the list in the source editor alone, sees it unclipped near a pane's left edge, and books item 1 as met.
- Report, "Visible changes" and "Wrong in the brief" 4: "no code-action provider answers for those models (`kit/lsp/client.ts:622-632`, `views/sources/source/language/lint-fixes.ts:372`), so the list should not open there". **What is wrong:** monaco-lsp-client also registers its own `LspCodeActionProvider` for `toMonacoLanguageSelector(capability.documentSelector)`, which is `{ language: "*" }` when the server names no selector (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js:1457-1458`, `:2037`). The report does not read that provider. Whether it answers for a diff or merge model depends on how the relay routes a request for a model it never opened, which is not settled by reading. The deferral in Spec 1 rests on this claim. **Failure scenario:** a Python diff in the Repositories view with a server running, Cmd+. on a changed line: if the server answers, the list opens and is clipped by `.files` under the wallpaper.

## 3. Standards

- `src/lib/ui/controls/editor/options.ts:98-101`: "Its layout service answers the container its context view (the right-click menu, the code action list, the hovers of its action bars) is drawn in". **What is wrong:** this is false for the code action list (Spec 1). DESIGN.md:246 says Monaco's widgets "(the right-click menu, hover, suggest, parameter hints, the rename box and the like, ... and in a peek) are drawn on nodes on the body as well ... all at one depth above the floats". That is false for the code action list and the post-paste selector. Its "the editor relays the keys typed in it to the editor's own root" is wrong for a peek, whose keys go to the parent's root (Spec 2). The rule broken is the rules file, "What every package obeys": a sentence the change makes false is a defect. **Failure scenario:** a reader debugging a cut Quick Fix list reads DESIGN.md and the comment and looks for the cause outside the editor kit.
- `options.ts:192-193`: "and it is stopped at the node, so no handler hears it twice". **What is wrong:** the capture-phase listeners on window and document hear the original before the node stops it, and then hear the copy (`shell/panes/PaneBody.svelte:137`, `:247`; `ui/menu/Tooltip.svelte:204`). All three are idempotent, so nothing visible changes, but the sentence is false. **Failure scenario:** a later capture listener that counts keys, written on the strength of this comment, counts a widget key twice.
- `options.ts:193` (85 columns, followed by "letters", which fits), `StatusBar.svelte:31` (92 columns, followed by "items", which fits) and `:28` (94 columns, followed by "wraps", 100): **What is wrong:** the rules file, "What every package obeys", says a comment edited by the step is rewrapped as a whole paragraph at 100 columns, so that no line inside a sentence ends short. **Failure scenario:** none at run time; the next edit of the paragraph carries the ragged wrap.
- Report, "Slip to know": the builder ran one `git status` in the worktree. **What is wrong:** this breaks the rules file, "Where you work" (no git command, read-only ones included). It has no effect on the diff. **Failure scenario:** none on the tree.

## 4. Behaviour

- `options.ts:79-93` (the page node is `width: 0; height: 0`): **What is wrong:** `actionList.js:2519-2521` sizes the code action list from `this._layoutService.getContainer(targetWindow).clientHeight`, which is now 0. That makes `availableHeight` negative, and `actionList.js:2531` then caps the list at `actionLineHeight * 3 + chromeHeight`. Before the step the value came from the focused editor's container height. Code action lists set no filter and no section toggle, so they always take this branch (`actionList.js:1239-1244`, `:2499`). The report does not state this change. **Failure scenario:** a Python tab with a Ruff finding that offers a fix, fix-all and documentation, Cmd+.: three rows show with a scrollbar, and the rest must be scrolled to.
- `options.ts:209-216`: **What is wrong:** every editor whose box is inside a scrolled ancestor gets `render(true)` on each animation frame. `codeEditorWidget.js:1249-1255` and `view.js:565-575` force every view part to redraw. This happens whether or not a widget is open. A diff list of N files means 2N forced full redraws per scroll frame. The report states the mechanism (judgment call 4) but not the cost. The cost was not measured by the reviewer. **Failure scenario:** scrolling the diff list of a commit with 40 files, each sized editor redraws in full every frame.
- `options.ts:209-216` with sized diff editors: **What is wrong:** a hover or suggest list whose anchor line is scrolled out of the diff list's visible area stays drawn at the anchor's page position, over the list's header or the neighbouring pane. Before the step `.files` clipped it. A sized editor's own viewport covers all its content, so Monaco does not hide the widget. The report says only "moved". **Failure scenario:** a hover open on a line of the second file, then the list is scrolled up by the wheel: the hover rides up over the pane's toolbar.
- `options.ts:202-207`, focus in a body node: **What is wrong:**
  - A Tab that neither Monaco nor `tab-out.ts` takes now moves focus to the next focusable after the body node, not after the editor. The rename box is still cancelled on blur (`rename.js:326`), but focus lands at the start of the page.
  - The window `focusin` runs `rememberPane` with no pane (`workbench-keys.svelte.ts:516-525`), so while a widget holds focus `focusedPaneElement` (`:346-361`) falls back to the first pane or the active main pane.

  The report states neither. **Failure scenario:** F2, then Tab: focus goes to the first control of the page instead of the control after the editor.
- `StatusBar.svelte` (`.group > :global(*) { max-width: var(--status-item-max) }`) with `LanguageItems.svelte:231-244`: **What is wrong:** `span[data-status="linter"]` holds one `ToolButton` per linter and is capped at 40vw as one item. Each button sits in a Tooltip `.tip` span with `min-width: 0` (`Tooltip.svelte:303-306`). The `.tip` spans shrink below their buttons, while the buttons keep their content width, so the buttons overlap each other and the item to their right. The label does not end in an ellipsis. **Failure scenario:** a Python tab (Ruff and the writing rules, `config/behavior.yml:183`) in a window about 450 px wide. **Verdict:** item 2 violated.
- `StatusBar.svelte` right group, markup reversed: **What is wrong:** Tab now walks the right group from right to left. Ruling Z826 allows this, but the report's "Visible changes" does not list it with a before and after for the look. **Failure scenario:** the look reads Tab order as a regression, or misses it.

## Declined to judge

- Every on-screen outcome of the twelve cases. No page was run, by the brief and the rules file; the look at landing settles them.
- Whether the priming `create` runs before every service call. By reading it does, and nothing contradicts it:
  - `start()` (`kit/load.ts:221-236`) imports Monaco, sets `MonacoEnvironment` and creates the primed editor before `addKeybindingRules`.
  - The module-level code of `vs/index.js` reaches services only through `languages.register` (ModesRegistry), `registerTokensProviderFactory` (lazy) and `onLanguage` / `onLanguageEncountered`, both through `withServices`, which waits for `initialize` (`standaloneServices.js:744-753`).
  - `ILayoutService` is a Delayed singleton (`standaloneLayoutService.js`), so `initialize` replaces it (`standaloneServices.js:716-723`).
  - The oculus modules that import Monaco internals statically (`data/helpers/files/apps/when.ts`, `data/helpers/keys/keys.ts`) touch no service.
- Whether the widgets' text sizes change. The body node's inherited font size is the body's, not `.editor`'s `--fs-sm`, for any widget text that inherits. This is visual and settled at the look.
- Monaco rules scoped to the editor's theme-type class (`.monaco-editor.hc-black .suggest-widget`, `.monaco-editor.hc-light ...`) no longer reach widgets on the body nodes. Whether oculus ever runs an hc base was not checked.
- The quick input (Go to Line, Go to Symbol) is drawn through `EditorScopedLayoutService` inside the editor's box (`standaloneQuickInputService.js:29`), not on the body. It stays inside the editor's bounds, and whether item 1 means it to move was not judged.
- Whether Chromium gives a wrapping row flex group with `overflow: clip` the min-content of its widest item. Judged by the flexbox specification's reading; the look at 600 px settles it.
- The report's reuse greps (`overflowWidgetsDomNode` found only in `options.ts`; `capture: true` found only in `viewer.svelte.ts`) no longer reproduce after the step's own lines. No decision rests on them, so they are not findings.
- An A/B or a size figure: none was claimed.

Reviewer usage: agent id not visible to the reviewer (read it from the runner's record), served model claude-opus-5-5; tokens, tool uses and minutes are left for the session.
