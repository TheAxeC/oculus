# D69 report, two clipping defects

Everything in the brief is built, with the brief's mechanism replaced where items 1 to 3 of "Wrong in the brief" below show it cannot work; one hazard is left open, item 4 of that list (the code action list in the diff list and merge side panes). No page was run (spec.md:63), so no behaviour in the 12 cases is seen on screen: every statement about drawing below is a reading of Monaco 0.57.0 and oculus code, marked "not verified on screen", and the look at landing decides it.

## Open items of the state file (orchestrator-state.md:146-152, verbatim)

- Open item 58 (2026-10-12, D68's brief check; kind 3, Axel's rules file and a skill): two sentences outside oculus become false when D68 lands, and both are files the orchestrator may not edit on its own. `CLAUDE.md:102` says a personal project that grows its own repository gets "a `roots:` entry for the repository in `.oculus/config/sources.yml`"; after D68 it is a folder entry in the workspace file `.oculus/workspaces/research-hub.yml`. `.agents/skills/research-cockpit/SKILL.md:155` says the triage output goes to the `mail_dir` key of `tools/oculus/config/local.yml`; after D68 that key is in the hub's `.oculus/local.yml`. Options: (a) Axel approves the orchestrator rewriting both sentences at D68's landing to name the new places, recommended, since leaving them makes the next session follow a file that no longer exists; (b) Axel edits them himself; (c) they stay false, the lazy option. Blocks: D68's landing, not its build.
- Open item 59 (2026-10-12, D68's brief check; kind 1, outside the repository): records that name the roots `hub` and `engine` outside the repository. Pages saved in the browser (`oculus.layout` in localStorage) hold tabs addressed `hub:<path>` and `engine:<path>`, and `~/.oculus/changes.jsonl` and `~/.oculus/history` hold undo records with those keys. After D68 those keys are no folder: a saved tab of a hub file shows as unknown and an older undo record cannot be applied. No code may read the old form (no migration code), so the data is changed once or left. Options: (a) at D68's landing the orchestrator rewrites `~/.oculus/changes.jsonl` and `~/.oculus/history` once, `hub` to `research-hub` and `engine` to `oculus` with the path under oculus's folder, by a command that prints nothing of their content, and Axel lets the orchestrator do the same to his browser's saved pages once through his own Chrome page, recommended; (b) the `~/.oculus` records converted and the browser's pages left, so his open hub tabs show as unknown once and he reopens them; (c) both left, the lazy option. Blocks: D68's landing, not its build.

Neither touches D69.

## Cases, first run (a reading of the unchanged code, base = D69-base/tools/oculus)

Paths relative to `src/lib/`. All twelve cases fail or hold as the brief says; no case's rule is wrong.

1. Left pane 300 px, right-click near the right edge. Fails. The source editor is created with `contextmenu: true` and no overflow node (`ui/controls/editor/Editor.svelte:219-223`); Monaco draws the menu inside the editor box. The box `.monaco` is `position: absolute; inset: 0` (`Editor.svelte:485-489`) inside `.editor` (:477), and the pane around it clips (`shell/panes/PaneBody.svelte:329`, `shell/panes/PaneView.svelte:493` `overflow: hidden`). Under a wallpaper theme `.editor` has `backdrop-filter` (`Editor.svelte:506-507`), which makes it the containing block of the fixed menu, so the menu is cut to `.editor`. The app's `editor/context` entry is in the same menu, so it is cut the same way.
2. Top pane of a vertical split, right-click near the bottom edge. Fails by the same clips (`PaneBody.svelte:329`, `Workbench.svelte:512`, `.editor` blur at `Editor.svelte:506`).
3. Hover and suggest near the pane's right edge, light theme. Fails in every theme, wallpaper or not: both are content widgets drawn in the editor's DOM, and `PaneBody.svelte:329`/`PaneView.svelte:493` clip them.
4. Docked float and free float at the window's right edge. Fails: `shell/panes/floats/FloatWindow.svelte:50` and `FloatLayer.svelte:159,200` are `overflow: hidden`, so the menu is cut at the float and does not use the room outside it.
5. Diff editor inline and side by side, merge editor, peek. Fails. `ui/controls/editor/diff/DiffEditor.svelte:187` creates the diff editor with `contextmenu: true` (:203) and no overflow node; under a wallpaper `.diff-editor` blurs (:478-479); the inner editors of a peek inherit the parent's options (Monaco `embeddedCodeEditorWidget.js:29`), which have none. The merge view draws its sides with the same two components (`views/sources/repositories/merge/Merge.svelte`).
6. Free float overlapping a pane, menu opened from the pane under the float. Fails: the menu is inside the pane's stacking context, below the float (float depth is `5 + 2*rank`, `shell/panes/floats/float-geometry.ts:170-205`).
7. Rename box (F2): Escape closes, Enter renames, Tab as today. Holds today: the rename input is inside the editor box, the keybinding service hears its keys (Monaco `standaloneServices.js:226-286` listens on the editor's container node), and `shell/keys/tab-out.ts` sees Tab through the editor capture handlers. This is the case the node move endangers, see "Wrong in the brief" 3.
8. Window 1512 px with a Python tab, app items left and right, window progress. Fails: `.group` is `overflow: hidden` and `flex: 0 0 auto` items with `min-width: 0` (`shell/status/StatusBar.svelte:339-353`), so an item that does not fit is cut by the group's edge, mid-word, and the right group loses its first items (`justify-content: flex-end`, :346-348).
9. Narrow to 600 px step by step. Fails the same way: the right group's leftmost item is cut letter by letter (`StatusBar.svelte:339-348`), the left group's last likewise.
10. 200-character branch name (RepoItems `Menu status`) and 200-character app status item. Fails: neither `.tool.status` (`ui/controls/ToolButton.svelte:238`) nor `.opener.status` (`ui/menu/MenuOpener.svelte:235`) has a `max-width`, and the label is `white-space: nowrap` with no ellipsis, so one item takes the bar.
11. Debug item while a session runs. Holds as a drawing (the item is in the left group, `StatusBar.svelte:225`, and `.bar.debugging` colours the bar); it is cut mid-word like any other in a narrow window (:339-343).
12. Tab through the bar with wrapped items. Does not arise today (nothing wraps); an item cut by the group's edge is still a tab stop and stays checked in the bar's right-click menu. The case is the new behaviour.

## What to build

| Item | State | Code |
|---|---|---|
| 1. Widgets drawn on body nodes, above floats, not clipped | DONE, not verified on screen | `ui/controls/editor/options.ts` (`widgetNode`, `widgetServices`, `widgetsOf`), `Editor.svelte` and `DiffEditor.svelte` (`widgetsOf(box)`, `...widgets.options`, `widgets.tie`, `widgets?.dispose()`), `kit/load.ts` (priming `create`), `kit/theme/wall.css` |
| 1. Node carries `monaco-editor`, keys still seen by editor handlers and tab-out | DONE, not verified on screen | `options.ts` `WIDGET_CLASS`, `relay`, `copyOfKey` |
| 1. Widget open while an ancestor scrolls | DONE, not verified on screen | `options.ts` `scrolled` (capture `scroll` listener, `render(true)` on each side) |
| 1. Above every float, under dialogs and tooltips | DONE | `WIDGET_DEPTH = 50` (floats 5 + 2*rank, Modal 60-70, Tooltip 80) |
| 1. DESIGN.md:246 | DONE, rewritten | sentence extended |
| 2. Right group wraps whole items from its left end, markup reversed, visible order unchanged | DONE, not verified on screen | `StatusBar.svelte` (right group `flex: 1 1 0; flex-direction: row-reverse; flex-wrap: wrap`, markup reversed), `SourceItems.svelte`, `LanguageItems.svelte`, `AppItems.svelte` (right side reversed) |
| 2. Left group's last items leave after (Z819) | DONE, not verified on screen | `.group { flex-wrap: wrap }`, left group `flex: 0 1 auto` with no `min-width: 0` |
| 2. No item wider than 40% of the window, ellipsis | DONE, not verified on screen | `--status-item-max: 40vw` on `.bar`; `.group > *`, `ToolButton.svelte` `.tool.status`, `MenuOpener.svelte` `.opener.status` and their `:global(.label)` |
| 2. `overflow: clip` on bar and groups | DONE | `StatusBar.svelte` `.bar`, `.group` |
| 2. Wrapped item no tab stop, hidden from screen readers (Z826) | DONE, not verified on screen | `shell/status/wrapped.ts` `inertWhenWrapped`, attached to both groups |
| 2. Hide/show from the bar's right-click menu | Unchanged code path (the menu is built from `STATUS_ITEMS`, not from the DOM) | `StatusBar.svelte` menu |
| 2. Comment above `.group` | DONE, rewritten | `StatusBar.svelte` |
| HELP.md one bullet, DESIGN.md status sentence | DONE | `HELP.md` (new bullet before "On the status bar, switching the branch"), `DESIGN.md` (status bar bullet, line 666) |

NOT DONE: nothing inside the brief's scope is left. Not verified: every on-screen outcome of the 12 cases.

## Verify, with output

All run from `tools/oculus` of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Full runs of `npm run diagrams && npm run test:quick`: 2, the second after the last change (the output below is the second run's).

- `npm run diagrams` then `npm run test:quick`, last lines:
  ```
  ok      prettier (0.4 s): All matched files use Prettier code style!
  ok      ASCII gate (0.4 s)
  ok      svelte-kit sync (1.6 s)
  ok      eslint (7.0 s)
  ok      svelte-check (6.4 s): ... COMPLETED 478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (12.6 s): ...
  test:quick: 13.1 s (limit 45.0 s); every command passed
  ```
- ASCII gate over all 14 changed files (`LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <files>`): prints nothing.
- `sh utils/unused-exports.sh` printed "Unused exports (244)", and `diff` of its output against `D69-base/tools/oculus/unused-exports.txt` printed nothing (same). Exports added: `widgetServices` (importer `kit/load.ts`), `widgetsOf` and type `Widgets` (importers `Editor.svelte`, `DiffEditor.svelte`), `inertWhenWrapped` (importer `StatusBar.svelte`); no line added, nothing to remove.
- `sh utils/folder-check.sh`: no output, exit 0. Folders: `kit/theme/` now 5 items, `shell/status/` 9.
- `npx vitest run tests/ui tests/shell tests/views/sources`: `Test Files  8 passed (8)`, `Tests  36 passed (36)`.
- Also run: `npm run check` (0 errors), `npx eslint src/lib/ui/controls src/lib/shell/status src/lib/ui/menu` (no output), `npx vitest run tests/checks/tree` (size and boundaries pass after the label rule was written as `:global(.label)`, the form `.tool.cut > :global(.label)` already uses at `ToolButton.svelte:374`; the first form tripped the boundary check on `CrossLinks.svelte`'s `.member :global(.label)`), `npx vitest run tests/checks/diagrams --testTimeout=600000` (46 passed in 270 s; the default 5 s limit and a 120 s limit time out on it).
- `npx vitest run tests/checks/config`: 3 tests fail (`validates with no findings`, `reads the roots of sources.yml without a finding`, `names a group of its own and a path under the hub for every document`). They read the hub's configuration from the worktree; none of the 14 changed files is configuration. Not run on the base, so not verified as failing there too.
- Reuse grep: `grep -rn "ResizeObserver\|MutationObserver" src` found `ui/frame/toolbar/watch.ts` `watchToolbar(root, line, changed)`, which observes a root, the children of a line and the list of children; `wrapped.ts` calls it with the group as both. `grep -rn "overflowWidgetsDomNode\|fixedOverflowWidgets" src docs DESIGN.md HELP.md README.md` found only the new `options.ts`. `grep -rn "capture: true" src` found only `views/sources/file/pdf/viewer.svelte.ts:247`, a different listener.
- History-word grep over the added lines (`before|used to|no longer|still|always has been|previously|the step adds|after this|again|now|instead of|originally|anymore|D69`): hits judged. `wall.css` "drawn before it loads" and `load.ts` "before every other call" describe an order of operations, kept. "dispatched again" (Editor.svelte, options.ts) and "render again" describe repeating an action, kept. One "still lists it" and one "where they saw it before the widget left" were reworded. Test titles: none added.
- Comment lines over 100 columns in the changed files: none after the rewrap.
- Test added or changed by this step: none (no entry of `agents/guarded.md` covers these files).

## Files (diff -rq base worktree, tools/oculus)

Inside the write list:

| File | Lines |
|---|---|
| `DESIGN.md` | 681 |
| `HELP.md` | 474 |
| `src/lib/ui/controls/editor/Editor.svelte` (519 to 517) | 517 |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | 491 |
| `src/lib/ui/controls/editor/options.ts` (54 to 233) | 233 |
| `src/lib/shell/status/StatusBar.svelte` | 396 |
| `src/lib/shell/status/SourceItems.svelte` | 191 |
| `src/lib/shell/status/LanguageItems.svelte` | 298 |
| `src/lib/shell/status/AppItems.svelte` | 64 |
| `src/lib/ui/controls/ToolButton.svelte` | 485 |
| `src/lib/ui/menu/MenuOpener.svelte` | 275 |
| `docs/diagrams/layer-shell.dot`, `.svg`, `layers.dot`, `.svg` | regenerated by `npm run diagrams` |

Outside the write list, each needed:

| File | Lines | Reason |
|---|---|---|
| `src/lib/ui/controls/editor/kit/load.ts` | 511 | `start()` creates and disposes a detached editor with `widgetServices()` before any other Monaco call; the override is read only from the first editor created on the page (see "Wrong in the brief" 2) |
| `src/lib/ui/controls/editor/kit/theme/wall.css` (new) | 25 | The wallpaper blur on `.editor` and `.diff-editor` made each a containing block of fixed elements; the blur moves to a `::before` layer. The two components carried the same four rules, so they are shared in one file, which also keeps `Editor.svelte` under 520 lines |
| `src/lib/shell/status/wrapped.ts` (new) | 24 | The inert marking of wrapped items, so no component carries observers |

Unchanged on purpose: `rename.css`, `Merge.svelte`, `MergeSide.svelte`, `context-guard.ts` (its `KEEPS` list matches `.monaco-editor`, which the nodes carry), `RepoItems.svelte`, `LatexItem.svelte` (both in the left group).

## Judgment calls the orchestrator may reverse

1. One widgets node per editor on the body, plus one page-level node for the context view, instead of one shared node (reason in "Wrong in the brief" 1).
2. `WIDGET_DEPTH = 50`: above floats (5 + 2*rank), under Modal (60/65/70), FloatingList and Toolbar (70), Tooltip (80). No editor lives inside a modal (grep).
3. A key relay: a `keydown` listener on each node dispatches a copy inside the owning editor's `.monaco-editor` root and stops the original. The copy carries `keyCode` and `charCode`, which Monaco reads; the two `@typescript-eslint/no-deprecated` disables in `options.ts` say so, and `eslint` reports nothing.
4. Scroll follow: a passive capture `scroll` listener on `document`, rAF-throttled, calls `render(true)` on each side editor when the scrolled element contains the editor box. Monaco places fixed widgets only when the editor renders.
5. Blur on a `::before` layer with `isolation: isolate` on the editor box (`wall.css`), so the box is no containing block.
6. `--status-item-max: 40vw` set once on `.bar` and read by `.group > *`, `.tool.status` and `.opener.status`; outside the bar it is undefined and means no cap.
7. Right group `flex: 1 1 0` (takes the remainder, so it wraps before the left group), left group `flex: 0 1 auto`, neither with `min-width: 0` (the automatic minimum of a clipped, non-scroll container is its widest item, which is the brief's "narrowest width is its widest item").
8. Ellipsis labels carry `padding: 0.2em 0; margin: -0.2em 0` so `line-height: 1` and `overflow: hidden` do not clip descenders.
9. `inert` is set from layout (an item whose `offsetTop` is at or below the group's `clientHeight`) by observers, which is a DOM-side marking of a layout fact; the layout is the only place the fact exists.
10. Right-group markup order: DOM = Bell, unsaved, sessions, app right items (list reversed for the right side), SourceItems (language, LanguageItems [linter, svelte_config, compile_database, interpreter, language_server], line_ending, encoding, indent, caret, blame). Visible order is the order before the step.

## Visible changes, for the look at landing

All not verified on screen.

- Source editor, every theme, wallpaper on and off: right-click menu, hover, suggest, parameter hints and rename box are whole at the pane's right and bottom edge, drawn over the neighbouring pane, over a docked or free float and over a float overlapping the pane. Before: cut at the pane (case 1 to 6).
- Diff editor inline and side by side, merge editor, peek, under a terminal wallpaper theme and a light theme: menu and suggest whole. Before: cut.
- Rename box (F2) in the source editor and the diff editor: type, Backspace, Enter, Escape, Tab. Look for: Enter renames, Escape closes, Tab as before, no key typed twice, and the active pane's ring or focus state unchanged while the box has focus (focus is on a body node; the shell's pane-focus tracking was not read to the end, not verified).
- Wallpaper theme, editor background: the blur now comes from a layer under the text. Look for the same translucent pane with the same blur as before, in the source editor, the diff editor and the merge sides, and no seam at the box edge.
- Code action list (lightbulb, Cmd+.): source editor whole under a wallpaper (the blur containing block is gone). In the diff list and the merge side panes (`views/sources/repositories/diff/Diff.svelte:518`, `merge/Pane.svelte` blur) the containing block remains; no code-action provider answers for those models (`kit/lsp/client.ts:622-632`, `views/sources/source/language/lint-fixes.ts:372`), so the list should not open there. Look to confirm.
- Status bar, 1512 px, Python tab with app items: no item cut, right-group visible order unchanged, left-group order unchanged.
- Status bar narrowed to 600 px in steps: the right group's leftmost items disappear whole one at a time, then the left group's last items; no cut letter; the right group's last remaining item is whole; no second row ever visible.
- 200-character branch name and 200-character app status item: at most 40% of the window wide, ellipsis at the end, descenders (g, y, p) not clipped.
- Debug item while a session runs: leaves the row whole when the window is narrow; the bar stays orange.
- Tab through the bar with items wrapped away: focus skips them. Right-click the bar: wrapped item listed and checked; hiding a drawn item lets a wrapped one come back.

## Wrong in the brief (evidence, replacement)

1. A single shared overflow node for all editors is wrong. `node_modules/monaco-editor/esm/vs/editor/browser/view.js:731-760` (`CodeEditorWidgetFocusTracker`) counts focus anywhere inside an editor's `overflowWidgetsDomNode` as that editor's widget focus, and `abstractCodeEditorService.js:66-79` `getFocusedCodeEditor()` returns the first editor with text focus, else the last with widget focus. With a node shared by every editor, whichever editor Monaco lists last takes the rename's `acceptRenameInput` (`rename.js:351-373`) and the other focus-gated commands. Replacement: one node per editor, and one node for the page for the context view (judgment call 1).
2. "An override handed with every create" does nothing here. `standaloneServices.js` `get()` runs `initialize({})` if services are not initialised, and `initialize(overrides)` returns at once when they are; `kit/load.ts` `start()` calls `monaco.editor.addKeybindingRules(...)` (`standaloneEditor.js:160`, through `StandaloneServices.get`) before any editor exists, so the services are fixed without the override. Replacement: the priming `create` in `start()` (`load.ts:231-236`), the only place the override is read.
3. Keys typed in a widget moved outside the editor box are not heard by Monaco. `StandaloneKeybindingService` listens for `keydown` on the editors' container nodes only (`standaloneServices.js:226-286`, `addContainer(codeEditor.getContainerDomNode())`), and the rename box's Enter and Escape are keybinding commands (`rename.js:351-373`, `kbExpr: EditorContextKeys.focus`). Without a relay case 7 fails. Replacement: the relay (judgment call 3). The target is the `.monaco-editor` root because `shell/keys/workbench-keys.svelte.ts:551,560-566` decide `typingIn`/`inEditor` by `closest('.monaco-editor')`, and Monaco 0.57 types into an EditContext (`.native-edit-context`), not a textarea.
4. The code action list is not moved by the brief's mechanism: Monaco's action widget calls `contextViewService.showContextView(delegate, editorDom, false)` (`actionWidget.js:57-69`, `codeActionController.js:246,311`) with the editor's own DOM node as the container, which the layout service is never asked about. It is whole in the source editor because the blur containing block is gone (`wall.css`); it would still be clipped in the diff list and merge side panes, where nothing answers for it today (see "Visible changes"). Not changed: `Diff.svelte` is at 520 lines and `merge/Pane.svelte` is shared by three tinted views; a provider added for those models later makes this a defect.
5. The diff editor's two inner editors share one node (Monaco takes one `overflowWidgetsDomNode` and clones the options for both, `diffEditorEditors.js:140-160`). While a node widget holds DOM focus, both sides report widget focus, so the relay owner is the side that last had text focus (`focused` in `DiffEditor.svelte`), else the modified side. Whether Monaco's own focus-gated commands pick the right side in that state is not verified on screen.

## Slip to know

One read-only `git status` ran inside the worktree once, by mistake, with its output discarded. It changed no file of the plan or the code.
