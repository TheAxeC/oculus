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

## Repair round 1, refuted

Three of the ten rulings are not fully closed. Ruling 7's theme-type class is never put on any node. Ruling 4 leaves the rename box and Monaco's other overflow widgets floating when an ancestor of the editor scrolls, which brief item 1 forbids. Ruling 5's Tab rule takes away Tab movement inside a focused hover. Item 2 holds.

All runs were from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D69/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. I did not run `npm run diagrams`, since it writes; the diagrams check below covers stale diagrams. The round's delta is the files newer than `touch -t 202610120302.41`: `options.ts`, `Editor.svelte`, `DiffEditor.svelte`, `kit/load.ts`, `kit/theme/wall.css`, `kit/theme/widgets.css` (new), `workbench-keys.svelte.ts`, `Tooltip.svelte`, `ToolButton.svelte`, `MenuOpener.svelte`, `StatusBar.svelte`, `SourceItems.svelte`, `wrapped.ts`, `monaco-modules.d.ts`, `DESIGN.md`, `HELP.md` and the diagrams. I read that delta against `git diff ff113f762`. `git status --short` had the same 23 entries after every rerun.

```
npm run test:quick -- --base ff113f762
test:quick: 23 changed file(s), from git since ff113f762
test:quick: 12 test file(s), 10 essential
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.3 s)
ok      svelte-kit sync (1.8 s)
ok      svelte-check (5.7 s): 1791768750291 COMPLETED 478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (13.4 s): Duration  9.23s (transform 11.86s, setup 0ms, import 20.51s, tests 9.29s, environment 4ms)
test:quick: 13.8 s (limit 45.0 s); every command passed

LC_ALL=C xargs perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' < <the 20 changed text files, .svg left out>
(no output), rc=0

sh utils/unused-exports.sh -> "Unused exports (244)"; diff against D69-base/tools/oculus/unused-exports.txt -> no output, rc=0

wc -l: DESIGN.md 681, HELP.md 474, workbench-keys.svelte.ts 582, AppItems.svelte 64, LanguageItems.svelte 298, SourceItems.svelte 191, StatusBar.svelte 397, wrapped.ts 24, DiffEditor.svelte 491, Editor.svelte 516, kit/load.ts 520, wall.css 25, widgets.css 6, options.ts 382, ToolButton.svelte 485, MenuOpener.svelte 275, Tooltip.svelte 389, monaco-modules.d.ts 55
sh utils/folder-check.sh -> no output, rc=0

npx vitest run tests/ui tests/shell tests/views/sources
 Test Files  8 passed (8)
      Tests  36 passed (36)
```

Commands the round's report quotes as evidence:

```
npx eslint src -> no output, rc=0
npm run check -> COMPLETED 3787 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/tree --testTimeout=120000 -> Test Files 3 passed (3), Tests 39 passed (39)
npx vitest run tests/checks/diagrams --testTimeout=600000 -> Test Files 1 passed (1), Tests 46 passed (46), Duration 271.46s
npx vitest run tests/checks/config ->
     x validates with no findings
     x reads the roots of sources.yml without a finding
     x names a group of its own and a path under the hub for every document
 Test Files  2 failed | 2 passed (4), Tests 3 failed | 79 passed (82)
python3 /tmp/rewrap_all.py -> not rerun: the permission classifier refused it (see "Declined to judge")
```

The three config failures are the same ones the first review traced to the worktree's sparse checkout, which holds no `.oculus/`. The rules file says such failures are not the step's.

### Verdicts

The ten rulings of the round:

- **1, every context view in the page node: closed, by reading.**
  - The import resolves to the same file Monaco uses. The exports map `"./*": "./esm/vs/*.js"` resolves `monaco-editor/platform/contextview/browser/contextViewService` to `esm/vs/platform/contextview/browser/contextViewService.js`. That is the file `standaloneServices.js` imports, and it is the only importer.
  - It is one module instance by Rollup's and Vite's rules (one id; one esbuild optimize run with splitting). That was not seen at runtime (see "Declined to judge").
  - A second copy would still work. The instance is built by hand, and `ContextViewHandler`'s constructor needs only `mainContainer`, `onDidLayoutContainer`, `getContainer` and `activeContainer`, which the layout service gives. It lives as long as the page, as Monaco's services do.
  - The override is honoured. `initialize` replaces the `SyncDescriptor` registered for `contextViewService` (`standaloneServices.js:716-723`), and the priming `create` runs before `addKeybindingRules` (`kit/load.ts:237-246`).
  - Every caller of `showContextView` now draws in the page node:
    - the right-click menu as `FIXED_SHADOW`, its shadow host a direct child of the page node;
    - the code action list and the post-paste selector as `FIXED` (`codeActionController.js:311`, `postEditWidget.js:91-110`);
    - select boxes and input-box messages as `ABSOLUTE` (`selectBoxCustom.js:380-401`, `inputBox.js:288`);
    - the hover service's views through `layoutService.getContainer` (`hoverService.js:280-343`).
  - Placement is right. `doLayout` subtracts the view's own page origin, and the page node sits at (0, 0) (`contextview.js:244-268`).
  - Closing on a click outside belongs to each delegate and does not depend on the container: the menu's blur and window mousedown (`contextMenuHandler.js:72-90`), the action widget's block and focus tracker (`actionWidget.js:168-205`).
- **2, the peek: closed, by reading.**
  - In a peek, `focused` records the embedded editor, which comes last in `getEditors()` order.
  - `owner()` dispatches on its root. The copy's context resolves from that root to the embedded editor's scoped context, where `renameInputVisible` is bound, so `acceptRenameInput` runs. The embedded editors join `group()`.
- **3, the page node's size and pointer: closed, by reading.**
  - The page node is fixed at 100% by 100%, so `actionList.js:2520` reads the window's height.
  - `[data-editor-widgets] > *` is enough for the pointer:
    - the direct children are `.context-view`, `.shadow-root-host` and Monaco's `overflowingContentWidgets` and `overflowingOverlayWidgets` divs, which have no size of their own;
    - deeper nodes inherit `auto`, and inside a shadow root `:host { all: initial }` gives `auto` too.
- **4, an ancestor's scroll: partly closed.**
  - Hover, suggest, parameter hints, the right-click menu and the code action list close, and no `render` call is left.
  - A scroll inside a widget does not close it: `target.contains(box)` is false for a node on the body.
  - The rename box and Monaco's other overflow widgets are neither closed nor moved (Spec 1).
  - The "no child, no command" check never fires (Proof 1).
- **5, focus: closed as ruled.**
  - `widgetBox` resolves a widget's pane through `focusedPaneElement` (callers `:155`, `:457`, `:518`) and `rememberPane` (window `focusin` and `pointerdown`, `Workbench.svelte:356-361`).
  - The ruled Tab rule removes Tab movement inside a focused hover (Behaviour 1).
- **6, the linter item: closed, by reading.** Three rules together keep each button inside its wrapper and end its label in an ellipsis: `Tooltip.svelte:317-327`, the existing `.tip > :first-child { flex: 1 1 auto; min-width: 0 }`, and the label rules in `ToolButton.svelte` and `MenuOpener.svelte`. The focus ring is inset (`outline-offset: -1px`, `ToolButton.svelte:421-424`), so `overflow: clip` does not cut it.
- **7, the widgets' look: not closed.** The font size holds. The theme-type class is never applied (Spec 2).
- **8, the sentences: partly closed.** Standards 1 and 2.
- **9, the report: partly closed.** Spec 2 and Proof 2.
- **10:** nothing to do.

Items of the brief's "What to build", for the whole diff since the base:

- **1: violated.**
  - These parts hold by reading:
    - every context view is in the page node (ruling 1);
    - the hover, suggest, parameter hints and rename box are on the per-box nodes;
    - the depth is 50, above the floats;
    - the keys relay reaches the owning editor, a peek's included, with no character typed twice or dropped: the original is stopped at the node, the copy is a synthetic event and inserts no text;
    - the pane is resolved for a widget;
    - the page node is window-sized and takes no pointer;
    - the font size is right;
    - DESIGN.md:246 is extended;
    - each component is at or under 520 lines.
  - These parts are violated:
    - widgets left floating on an ancestor's scroll (Spec 1);
    - the theme-type class never applied (Spec 2);
    - Tab in a focused hover (Behaviour 1).
- **2: holds.** The flex layout, the reversed markup, the 40vw cap, `overflow: clip`, the inert marking in `wrapped.ts`, and the linter item under ruling 6, by reading.

Cases:

- **1, 2:** met by reading. The menu is drawn in the page node through `PageContextView` with `useWindowContainerForShadowRoot` true, placed by `layout2d` in the viewport.
- **3:** met by reading. Hover and suggest are fixed content widgets on the per-box node. In a light theme no `.monaco-editor.vs` widget rule was found missing.
- **4:** met by reading. The nodes are on the body, outside `FloatWindow` and `FloatLayer`, and the menu opens inside the viewport.
- **5:** met by reading for the menu and the suggest list in the diff editor's sides, the merge editor (`Editor.svelte`) and a peek, whose editor takes the parent's node.
- **6:** met by reading. The page node's z-index is 50, above the floats at 5+2*rank.
- **7:** met under ruling 5. Enter and Escape reach `acceptRenameInput` and `cancelRenameInput` through the copy on the owning editor's root. Tab returns the focus to the editor, as ruled.
- **8 to 11:** met by reading, as in the first review. Case 10's linter variant is now met under ruling 6.
- **12:** met by reading. `wrapped.ts` marks items on a later row inert, and `overflow: clip` makes no scroll container.

### Findings

**Spec 1.** `src/lib/ui/controls/editor/options.ts:91-95` and `:338-347`.

```ts
const CLOSING = ['editor.action.hideHover', 'hideSuggestWidget', 'closeParameterHints'] as const;
...
function close(): void {
    ...
    for (const command of CLOSING) editor.trigger('oculus', command, null);
```

- **What is wrong.** Brief item 1 still holds under the round: "A widget open when an ancestor of the editor scrolls ... is closed or moved with the text, never left floating where the text was." The round dropped `render(true)` and closes only the hover, the suggest list and the parameter hints. Several widgets on the per-box node are left at their old window position, since Monaco places a fixed widget once:
  - the rename box, which the report says is "not closed (it holds typed text)";
  - the message widget (`messageController.js`);
  - the standalone colour picker;
  - the paste-as button (`postEditWidget.js`);
  - the glyph hover;
  - the inline completion hints.

  Ruling 4's wording ("Nothing is drawn again for an editor with no widget open") allows a redraw or a relayout for an editor that has a widget open. The report's "Visible changes" does not say that the rename box floats.
- **Failure scenario.** A sized diff editor in the Repositories diff list. F2 on a name, then wheel-scroll the list. The rename box stays where the line was, drawn over another file's header or the pane's toolbar.
- **Verdict:** item 1 violated.

**Spec 2.** `options.ts:363-370`, called at `Editor.svelte:242` and `DiffEditor.svelte:222`.

```ts
tie() {
    const root = group().at(0)?.getDomNode();
    if (root === null || root === undefined) return;
```

- **What is wrong.** `tie()` runs right after `create(box, { ..., model: null, ... })` (`Editor.svelte:229-242`), and in the diff editor before `made.setModel(pair)` (`DiffEditor.svelte:222`, `:227`). `getDomNode()` returns null while an editor has no model (`codeEditorWidget.js:1062-1066`), so `group()` is empty and `tie` returns before the observer is set.
- **Result.** No node, the page node included, ever carries `vs`, `vs-dark`, `hc-black` or `hc-light`, and nothing follows a theme change. `tie` and `followTheme` have no other caller (`grep -rn "\.tie()\|followTheme" src`).
- **Even a later `tie` would fail.** `setModel` builds a new View with a new root each time (`codeEditorWidget.js:1497`, `view.js:109`), and `Editor.svelte:352`, `:360` and the diff editor's text replacement do that, so an observer on the first root would go stale.
- **Claims this makes false.** Ruling 7's row; "Names for ruling 7" ("copied from the class list of the box's first editor root ... followed through a MutationObserver"); and the "Visible changes" line "in a theme whose base is high contrast ... the widgets take the high-contrast rules".
- **Failure scenario.** An app colour theme with an `hc-black` base. The suggest list and its details lack Monaco's `.monaco-editor.hc-black .suggest-widget` and `.suggest-details` rules, a case the first review raised and ruling 7 was written to close.
- **Verdict:** item 1 violated; ruling 7 not closed.

**Proof 1.** `options.ts:343` (`if (node.childElementCount === 0) return;`) and the report's row 4: "when the box's node has children, runs ... an editor whose node has no child gets no command".

- **What is wrong.** Every editor that has a model appends its `overflowingContentWidgets` and `overflowingOverlayWidgets` divs to its `overflowWidgetsDomNode` (`view.js:194-196`), so the node always has at least two children. The check never returns, and every ancestor scroll frame runs the three commands on every editor of every box under the scrolled element.
- **What still holds.** "Nothing is drawn again" holds by reading: there is no render call, and the commands return early on closed widgets (`suggestController.js:561-565`, `parameterHints.js:49`, `hoverActions.js:147`).
- **Side effect.** `hideSuggestWidget` reads `this.widget.value` (`suggestController.js:130`, `:564`), which builds an editor's suggest widget early if its idle build has not run yet.
- **Decision resting on it.** Ruling 4's acceptance of "no work for an editor with no widget open". The check is also code larger than its job (Standards).
- **Failure scenario.** Scrolling a diff list of 40 files runs 240 command triggers per frame, while the comment "Close what the editors of the box have open, and draw nothing again" and the report tell a reader none run. The cost was not measured.

**Proof 2.** Report, first section "Judgment calls" 4: "calls `render(true)` on each side editor".

- **What is wrong.** The round's "Corrections to the first report" do not replace this line. Only row 4 of the round table says `render(true)` is gone.
- **Failure scenario.** The look at landing reads the judgment calls and expects widgets to move with the text on a scroll.

**Standards 1.** Sentences the round touched that are false after it. This breaks the rules file, "What every package obeys": a sentence the change makes false is a defect.

- DESIGN.md:246: "carry the class `monaco-editor` and the theme type class of the editor's root" (Spec 2), and "a scroll of any ancestor of the box closes the editor's open widgets" (false for the rename box and the widgets in Spec 1).
- `options.ts:17-18`: "the theme type class of the editor's root".
- `options.ts:25-26`, `Editor.svelte` head ("an ancestor of the box that scrolls closes the open widgets") and `DiffEditor.svelte` head: the same false scroll claim.
- `options.ts:186`: "Follow the editors once they are made: the theme type class of their root."
- `options.ts:338`: "and draw nothing again", which describes the dead check of Proof 1.

Failure scenario: a reader debugging a high-contrast suggest list, or a floating rename box, trusts DESIGN.md and looks elsewhere.

**Standards 2.** `options.ts:330`, 102 columns:

```ts
        /** The innermost editor of the box that takes the focus is the one the next widget is for. */
```

- **What is wrong.** The rules file, "What every package obeys", wants a comment rewrapped at 100 columns. The report says "no changed line of a comment is over 100 columns". `/tmp/rewrap_all.py` only treats lines starting with `//` or `*` as comments, so a one-line `/** ... */` is outside what it checks.
- **Failure scenario.** None at run time. The claim misleads the landing.

**Behaviour 1.** `options.ts:176-179`.

```ts
} else if (press.key === 'Tab') {
    press.preventDefault();
    editor.focus();
}
```

- **What is wrong.** A focused hover takes Tab to move between its own focusable parts: its container (`hoverWidget.js:19`), its action links "Quick Fix..." and "View Problem" (`hoverWidget.js:41`, `contentHoverStatusBar.js:29`), the verbosity buttons (`markdownHoverParticipant.js:250`) and `contentHoverRendered.js:236`. Monaco keeps the hover open on Tab for exactly that (`contentHoverController.js:237`). No keybinding takes that Tab and `tab-out.ts` does not either, so `forward` now prevents it and puts the focus in the editor's text.
- **Before the step**, the hover sat inside the editor's box and Tab walked its parts. The same applies to the suggest details when focused.
- This matches ruling 5's wording, but brief item 1 ("keys typed in a widget behave as today") still holds. Returning the focus only when a Tab would leave the widget would satisfy both. The report states "Tab out of ... a focused hover: the focus is in the editor" with no before and after for this loss.
- **Failure scenario.** A Ruff finding, Cmd+K Cmd+I twice to focus its hover, then Tab to reach "Quick Fix...". The focus jumps to the editor's text instead, and the next key hides the hover.
- **Verdict:** item 1 violated, for that part.

### Declined to judge

- **Every on-screen outcome of the cases.** No page was run, as the brief and the rules file require. The look at landing settles them.
- **Vite at runtime.** Whether Vite's dev optimizer pre-bundles the new subpath in the same run as `monaco-editor`. The main checkout's `node_modules/.vite/deps/_metadata.json` (written 11 October, 20:27) lists `monaco-editor` but neither subpath the tree already imports (`.../contextkey`, `.../keyCodes`), so that cache predates them. The rules (`registerMissingImport` re-runs one optimize with splitting) give one instance, and a second copy would still work, as ruling 1's verdict says. A dev server run would settle it.
- **`python3 /tmp/rewrap_all.py`.** The permission classifier refused it. I read it instead: without an argument it only prints, and Standards 2 shows a line it does not check.
- **Typing in a scrolled list.** Whether Chrome scrolls an ancestor list to reveal the caret while the reader types in a sized diff editor, which would close a suggest list as it opens. Only the look can show it.
- **Ruling 1's exceptions.** The report counts more as staying in the editor's box than the ruling's one exception, the quick input: also the find widget, lightbulb, CodeLens, sticky scroll and inline completions. The brief's item 1 keeps the find box in the editor. Whether the ruling meant the others to move is the orchestrator's call.
- **Different theme types.** Whether the page node following one editor's theme matters when editors of different theme types exist. Monaco's theme is global (one `setTheme` for every editor), and per Spec 2 nothing follows a theme at all, so the point does not arise on this tree.

Reviewer usage: agent id not visible to the reviewer (read it from the runner's record); served model claude-opus-5-5. Tokens, tool uses and minutes are left for the session.

## Closed

The first review's findings were closed in repair round 1 (`agents/briefs/D69-round1.md`, rulings 1 to 10). The findings of the run over round 1 were closed at landing, in the gate worktree at main's head, as follows.

- **Spec 1, widgets left floating on an ancestor's scroll.** `options.ts` `close()` still closes the context view, the hover, the suggest list and the parameter hints, and when a widget is still shown after that (the rename box, a message, the paste-as button, the colour picker) calls `render(true)` on the box's editors, which places each fixed widget against the text again. Seen at the look: the rename box and the "can't be renamed" message stayed open at their line after a scroll of the box's parent, and the rename input kept the focus.
- **Spec 2, the theme type class never applied.** `followTheme()` now reads the class from any editor root on the page (Monaco's theme is one for the page) and puts it on every widgets node; it runs from `tie(editors)`, which takes the editors and listens to `onDidChangeModel` on each (Monaco builds the root when an editor takes a model), and from the painter's `onPainted` in `kit/load.ts`, which fires after a theme is defined. The MutationObserver is removed. Seen at the look: both nodes carried `vs` under the light theme and `vs-dark` under the dark theme, with the root.
- **Proof 1, the dead `childElementCount` check.** Replaced by `shows(node)`, which tests whether a widget under the node's containers is visible (`checkVisibility` with visibility and opacity), so an editor with nothing open gets no command and no draw.
- **Proof 2, the report's judgment call 4.** After the landing fix `render(true)` runs again, but only when a widget other than the closed ones stays open after a scroll; the booking states this, which replaces judgment call 4.
- **Standards 1, false sentences.** DESIGN.md's widget paragraph, the head of `options.ts`, the doc comments of `tie` and `close`, and the heads of `Editor.svelte` and `DiffEditor.svelte` rewritten to what the code does after the fixes.
- **Standards 2, a 102-column comment.** Rewritten to "The innermost editor of the box that takes the focus is the one a widget is for." (93 columns); `awk 'length>100'` over the three editor files prints only the import line of `ContextViewService` in `options.ts`, which Prettier keeps on one line.
- **Behaviour 1, Tab in a focused hover.** `forward` takes the node and returns the focus to the editor only when the Tab would leave the widget (`leaves()`: the widget is the element one level under the node's containers, a Tab leaves from its last visible focusable part, a Shift+Tab from its first, any Tab from a widget with none). Seen at the look: in a Ruff hover, Tab from "View Problem" went to "Quick Fix...", and the next Tab put the focus in the editor's text.
- **Declined to judge, ruling 1's exceptions.** Ruling 1 was written for the context views the layout-service override did not reach; what Monaco places in the text on purpose (the find widget, the peek zone, the lightbulb, CodeLens, inline completions, the sticky scroll) stays in the box as brief item 1 keeps the find widget there. No change.
