# Brief check of D69, two clipping defects

Main's head is a86225c4c (`git log -1 --oneline` printed `a86225c4c Land D63, apps in the shell`). I changed nothing.

**Verdict: the brief is not ready to dispatch.** Five problems.

1. **Item 1 cannot be built from Monaco options alone.** Monaco 0.57 draws the right-click menu in a place that neither `fixedOverflowWidgets` nor `overflowWidgetsDomNode` moves out of the editor's own chain of ancestors. On the current tree the menu is only cut off under the wallpaper, where a blurred surface around the editor becomes the box that `position: fixed` elements are placed in and clipped by. The brief names neither cause, and its write list leaves out the files that hold the blur.
2. **Four premises do not reproduce:**
   - Editor.svelte:494 and DiffEditor.svelte:460 are the `overflow: hidden` of `.plain`, not of the editor's box.
   - Pane.svelte:121 is the title's ellipsis, not the pane's clip.
   - peeks.ts creates no editor.
   - Not every status item is a `ToolButton`: eight of them are `Menu`s.
3. **The new module cannot go where the brief puts it.** The editor folder already holds 10 tracked items, so `utils/folder-check.sh` would refuse an eleventh. `options.ts`, already in that folder, is the module for this concern.
4. **The right group needs its markup reversed, and the write list misses files.** `row-reverse` draws the group's items in reverse order unless the markup order is reversed too, which VS Code does in its source. That reaches SourceItems.svelte, LanguageItems.svelte and AppItems.svelte. MenuOpener.svelte also needs the width cap and is not in the write list either.
5. **Cases 1 and 2 can pass without the fix.** The theme is not named, so on a theme without the wallpaper the menu is already whole on the unchanged tree. The pane positions chosen let the menu flip back inside the pane.

## 1. Names

Command:
`grep -rn --exclude=local.yml "data-status-group\|status-group\|\.tool\.status\|tool.status\|fixedOverflowWidgets\|overflowWidgetsDomNode\|contextmenu: true" src tests config docs HELP.md DESIGN.md README.md | grep -v "^src/lib/ui/controls/ToolButton.svelte\|^src/lib/shell/status/StatusBar.svelte"`

Output: two hits, both inside the write list.
- `src/lib/ui/controls/editor/Editor.svelte:223: contextmenu: true,`
- `src/lib/ui/controls/editor/diff/DiffEditor.svelte:203: contextmenu: true,`

No test names `data-status`, StatusBar, SourceItems or AppItems (`grep -rln "data-status\|StatusBar\|SourceItems\|AppItems" tests` printed nothing).

Documents that describe the behaviour, from `grep -n -i "status bar..."` and `grep -n -i "right-click|context menu|hover..."` over DESIGN.md, HELP.md and docs:

| Sentence | Still true after the change? |
|---|---|
| DESIGN.md:666, "every item is a status `ToolButton` or `Menu`" | Yes. It also contradicts the brief's premise (see check 3). |
| DESIGN.md:246, "A blurred surface is the containing block and the stacking context of every fixed thing inside it, which is why a tooltip, a menu, ... are drawn on the document body through bits-ui's `Portal`" | Yes. It is the cause of defect 1 (check 3). The step should extend it to Monaco's widgets, or it stays silent about them. |
| DESIGN.md:499 and 511; docs/apps.md:193 and 465; HELP.md:84 and 402 (the bar's right-click menu lists and hides items; window progress is in the left group) | Yes. |
| DESIGN.md:361 (frames ordered under every floating pane and every menu) | Yes, but z-order becomes a choice if widgets move to the body (see "Other findings"). |

The comment at StatusBar.svelte:337-338 becomes false and is in scope. No sentence in DESIGN.md, HELP.md or docs describes how the status bar's groups clip.

## 2. The step line

`grep -n '^- D69 two clipping' plan.md` gives line 773. It is tagged with ruling Z819 (plan.md:1809), which took option (a), a new step D69 (self-rule). plan.md has no section headed Goal (`grep -n -i '^#.*goal\|^Goal\|\*\*Goal' plan.md` printed nothing); its top paragraph is the ledger's description.

How each part of the step line maps to the brief:
- **Right-click menu and other pop-up widgets of the source and diff editors, cut at the pane's right and bottom edges:** item 1, cases 1, 2 and 4.
- **"apps' `editor/context` entries among them, cannot be reached":** covered only by "every entry reachable" in case 1. No case puts an app's entries at the bottom of a long menu.
- **"drawn whole over the page wherever the editor sits, a docked float included":** item 1, case 3. "Wherever the editor sits" also covers the merge editor (Merge.svelte:240 and MergeSide.svelte:100 use the same Editor component, inside a tinted Pane at Merge.svelte:190) and free floats. Neither has a case.
- **"as VS Code draws them over the workbench":** item 1, with no requirement on z-order against floats.
- **Status bar cuts mid-word and hides items after it, apps' items and window progress among them:** item 2 and case 5. Case 5 does not require the apps' items and the window progress to be drawn at 1512 px (check 5).
- **"which items give way follows what VS Code's status bar does":** the VS Code bullet and item 2. Brief decision 1 departs from VS Code for the left group under Z819. That is stated and acceptable.

Every part of the line has a requirement. The apps' menu entries and "wherever the editor sits" have only a partial case.

## 3. Premises

| Claim | Command | Result |
|---|---|---|
| Editor.svelte 519 lines | `wc -l` | 519. Holds. |
| `editor.create` at :219-223 with `contextmenu: true` | `grep -n` | `219: const made = loaded.monaco.editor.create(box, {`, `223: contextmenu: true,`. Holds. |
| Editor.svelte sets `overflow: hidden` on its box at :494 | `sed -n 455,519p` | **Wrong.** :494 is inside `.plain`, the `<pre>` drawn before Monaco loads. The box `.monaco` (`:467`, rules `:485-489`) has no overflow rule. |
| DiffEditor.svelte 491 lines, `contextmenu: true` at :203 | `wc -l`, `grep -n` | Holds. |
| DiffEditor.svelte `overflow: hidden` at :460 | `sed -n 450,470p` | **Wrong** in the same way: :460 is `.plain`. |
| Neither editor passes the two options | `grep -rn "fixedOverflowWidgets\|overflowWidgetsDomNode" src` | Prints nothing (rc=1). Holds for oculus. **But** Monaco forces `clonedOptions.fixedOverflowWidgets = true` on both inner editors of the diff editor (`node_modules/monaco-editor/esm/vs/editor/browser/widget/diffEditor/components/diffEditorEditors.js:160`), so the diff editor already runs with fixed overflow widgets. |
| Pane.svelte:121 clips the pane | `sed -n 110,130p` | **Wrong.** :121 is `.title { overflow: hidden; text-overflow: ellipsis }`. The pane body is `overflow: auto` at :157. Other ancestors of the source editor that clip: `views/sources/source/Editor.svelte:316` (`.editor-wrap`), `shell/panes/PaneBody.svelte:329`, `shell/panes/PaneView.svelte:493`, `shell/Workbench.svelte:512`. For a free float there is also `FloatWindow.svelte:50`, and for a docked float `FloatLayer.svelte:159`. |
| The peek is the third Monaco editor, in peeks.ts | `cat -n peeks.ts` | **Wrong.** peeks.ts (119 lines) only creates models (`:80 monaco.editor.createModel`). The peek's editor is Monaco's `EmbeddedCodeEditorWidget`, which takes `{ ...parentEditor.getRawOptions(), overflowWidgetsDomNode: parentEditor.getOverflowWidgetsDomNode() }` (`embeddedCodeEditorWidget.js:29`). It inherits whatever the source editor is given, so peeks.ts needs no change. |
| StatusBar.svelte 377 lines; bar `overflow: hidden`; each `.group` `min-width: 0; overflow: hidden`; the comment as quoted | `cat -n` | Holds (:322-344, comment at :337-338). |
| Each item is a `ToolButton` with `status` | `grep -n "<Menu\|<ToolButton" src/lib/shell/status/*.svelte` | **Wrong.** These are `Menu status` (drawn by `ui/menu/MenuOpener.svelte`, `.opener.status` at :235-261): RepoItems.svelte:158, 173 and 216 (repository, branch, publish); SourceItems.svelte:134, 148 and 162 (indent, encoding, line ending); LanguageItems.svelte:230 (language server); StatusBar.svelte:226 (debug). The branch name is the likeliest long label. |
| The `ToolButton` status label has no width cap and no ellipsis | `sed -n 228,282p ToolButton.svelte` | Holds. The same is true of `MenuOpener.svelte`'s `.opener.status`. |
| VS Code statusbarpart.css quotes | `curl` of raw main, then `grep` | All hold: the part at :6-14 (`height: 22px; display: flex; overflow: hidden`), `.right-items` at :49-52 (both comments verbatim), `.left-items` `flex-grow: 1` at :54-55, `.statusbar-item` `max-width: 40vw` at :57-64, the `.statusbar-item-label` rules `white-space: pre; text-overflow: ellipsis; overflow: hidden` at :97-109. VS Code also reverses the right group's markup: statusbarPart.ts:510 and 525, `// reversing due to flex: row-reverse`. The brief does not say this. |

### Where Monaco draws the right-click menu

This is read from `node_modules/monaco-editor/esm`, version 0.57.0.

The call is `contextmenu.js:183-186`:
```js
domForShadowRoot: useShadowDOM ? this._editor.getOverflowWidgetsDomNode() ?? this._editor.getDomNode() : undefined,
useWindowContainerForShadowRoot: useShadowDOM && this._editor.getOption(EditorOption.fixedOverflowWidgets),
```
`useShadowDOM` defaults to true (`editorOptions.js:3447`).

`contextViewService.js` `showContextView` then does this:
- When the container differs from `layoutService.getContainer(window)`, it uses `FIXED_SHADOW` positioning.
- `const contextViewContainer = useWindowContainerForShadowRoot && container ? this.layoutService.getContainer(getWindow(container)) : container ?? this.layoutService.activeContainer;`

The standalone layout service gives `activeContainer` as `getFocusedCodeEditor() ?? getActiveCodeEditor()` and then `.getContainerDomNode()` (`standaloneLayoutService.js`). That is the box passed to `create`.

The menu view is `position: fixed`, inside a shadow host that is itself `position: fixed`. It is placed against the window's viewport (`contextview.js` `doLayout`, `layout2d(viewport, ...)`) and corrected by its own page origin.

What each option does to the menu:
- **Today** (`fixedOverflowWidgets` false, no overflow node): the menu is fixed inside `.monaco-editor`. A fixed element ignores `overflow` on its ancestors unless one of them is a containing block for fixed elements (transform, filter, `backdrop-filter`, `contain`, `container-type`).
- **`fixedOverflowWidgets: true`:** the menu moves to the focused editor's container box, which is inside the same ancestors. It does not reach the page. This is already the diff editor's case, because Monaco forces the option there.
- **`overflowWidgetsDomNode` alone (fixed false):** the menu moves into that node, so a node on the body would take it out. But the content widgets (hover, suggest) then stay `position: absolute` with coordinates relative to the editor (`contentWidgets.js:155` and `:272`), so they would be drawn in the wrong place inside a node on the body.
- **Override passed with the first editor:** `monaco.editor.create` and `createDiffEditor` take an override argument, honoured only on the first call of the page (`standaloneServices.js:705-726`, `if (initialized) return`). An `ILayoutService` override whose `getContainer` and `activeContainer` return a node on the page would draw the menu there, together with `fixedOverflowWidgets: true` and an `overflowWidgetsDomNode` on that node. It also moves anything else Monaco places through the layout service, such as quick input. The node needs the class `monaco-editor`, because Monaco's colour variables are written for `.monaco-editor, .monaco-diff-editor, .monaco-component` (`standaloneThemeService.js:339`), its widget CSS is scoped under `.monaco-editor`, and so is oculus's `kit/theme/rename.css:5`.
- **Removing the containing blocks (CSS):** move the blur of every editor ancestor that has one onto a pseudo-element behind it. With nothing turning fixed elements into clipped ones, the default menu is whole, and with `fixedOverflowWidgets: true` the hover and suggest are whole too.

Which ancestors are containing blocks on the current tree? `grep -rn "container-type\|contain:\|transform:\|backdrop-filter\|[^-]filter:\|will-change\|perspective" src` finds none on an editor ancestor in a theme without the wallpaper. Under the wallpaper (`body.wall`) these are:
- `ui/controls/editor/Editor.svelte:507` (`.editor` itself)
- `ui/controls/editor/diff/DiffEditor.svelte:479`
- `views/sources/repositories/diff/Diff.svelte:516-518` (`.files`, which wraps DiffSection and also has `overflow: auto` at :507)
- `ui/frame/Pane.svelte:83-86` (`.pane.tinted`, which the merge editor's Pane uses)

The wallpaper is on for the terminal themes by default (`config/appearance.yml:58-66`, `themes: rice`, `file: "wallhaven-83"`, and the folder `.oculus/wallpaper` exists on the hub). The theme of D63's look is not in D63-landing.md; it is not verified which theme it ran.

So, by reading: on a theme without the wallpaper the menu is already whole today, while the hover and suggest (absolute, inside `.monaco-editor`) are cut in every theme. Under the wallpaper all of them are cut. "Both changes are Monaco options and CSS" (brief :54) is right only if the CSS includes the four blur rules above. Two of those are in files outside the write list: Diff.svelte and Pane.svelte.

## 4. Cases and checks against spec.md

- "Nothing here is a test" agrees with spec.md:58 (a test exists only as the test of an entry in `guarded.md`, and `grep -n -i "options.ts\|StatusBar\|ToolButton\|Editor.svelte" guarded.md` finds none for these files), with :64 (a behaviour that needs a DOM is proved at the look) and with :63 (a builder runs no page). Consistent.
- Verify item 4 conflicts with spec.md:47 together with the brief's write list. Command: `git ls-files src/lib/ui/controls/editor | sed ... | cut -d/ -f1 | sort -u | wc -l` printed `10` (bars, chords.ts, commands.ts, diff, Editor.svelte, gutter, kit, options.ts, tab-out.ts, types.ts). A new module in that folder makes 11, and `utils/folder-check.sh` refuses it. `options.ts` (54 lines, "the options a parent hands the editors ... `monacoOptions`") is the module that already holds the options the editors share. Spec.md:86 says reuse what exists.
- Case 4 names the peek as a place the step changes through peeks.ts, which the step does not and cannot change (check 3). The peek is reached through the source editor's options.
- Verify item 3: the base copy `.agents/worktrees/D69-base/tools/oculus/unused-exports.txt` does not exist yet (`ls` says no such file). That is expected before /spec creates the worktree.
- Verify item 2's ASCII gate is the simpler form; spec.md:100 says its own form replaces it. The two give the same result for these files, since none is under `config/`.

## 5. Could each case or item pass without the goal being reached?

- **Case 1:** yes. With no theme named, on a theme without the wallpaper the menu is already fixed and whole on the unchanged tree. Also, in the right pane of two, near the right edge, `layout2d` flips the menu leftward inside the window, and it can land inside a 300 px pane. It should use the left pane, so the menu must spill over the neighbour, under a wallpaper theme. It should also show the hover and the suggest list, which are cut in every theme today.
- **Case 2:** yes, for the same reasons. A pane whose bottom edge is near the window's bottom makes the menu open upward inside the pane. It should be the top pane of a vertical split, under a wallpaper theme.
- **Case 3:** yes on a theme without the wallpaper for the menu. The hover is checked, which helps. The theme is not named.
- **Case 4:** yes on a theme without the wallpaper for the diff editor's menu, since Monaco already forces fixed widgets there. It does not say inline or side by side. It does not name the diff list under the wallpaper (Diff.svelte:516).
- **Case 5:** partly. It does not require the left group's apps' items and window progress to be drawn at 1512 px, which is the reported defect. It does not require the right group's visible order to be unchanged, and `row-reverse` without reversed markup reverses it.
- **Case 6:** it does not require the right group's remaining item to be whole. With `min-width: 0` (StatusBar.svelte:342) a wrapping group narrower than its first item still draws that item on its one line, and the clip cuts it.
- **Case 7:** yes, if only `ToolButton` gets the cap while `Menu` status items (a long branch name, RepoItems.svelte:173) stay uncapped. It also does not say which item has 200 characters (only an app's item text or a branch name can).
- **Item 1:** yes, as written. "Monaco options" (`fixedOverflowWidgets`) can be set and seen to work on a theme without the wallpaper, while the menu stays cut under the wallpaper and in the diff editor's list.
- **Item 2:** as written, its trigger "when the window is narrower than the left group alone" cannot be met without cutting. A wrapping right group always keeps one item on its line. To cut nothing, the right group must keep its narrowest width at its widest item, as VS Code's does, and the left group must wrap once the window is narrower than the left group plus that item. With the 40% cap the two together never exceed 80% of the window.

## 6. Implied inputs

Each one has happened or costs something if wrong.

- **Terminal themes with the wallpaper (`body.wall`).** Expected: the menu, hover, suggest and parameter hints are whole in the source editor, the diff editor (the diff list's blur at Diff.svelte:516), the merge editor (tinted Pane at Pane.svelte:85) and floats. Missing, and the likely input of the reported defect.
- **Light themes and dark themes without the wallpaper.** Expected: hover and suggest whole. Today only they are cut; the menu is already whole by reading. Missing.
- **The wallpaper's translucent panes.** Moving the blur onto a pseudo-element must keep one translucent layer (the DESIGN.md:246 rule). Expected: the editor's surface looks the same. Missing.
- **The CRT overlay** (`themes.css:761-781`, z 9998 and 9999 on the body). It stays above the menus, as it does above oculus's own (Monaco's context view is z 2575, `contextview.js`). Low cost. Not needed as a case unless widgets get a depth above 9999.
- **A free float moved to the window's right or bottom edge.** Expected: the menu opens inward, inside the window. Missing (case 3 covers a docked float only).
- **The bar while debugging.** The debug item (`Menu status`) joins the left group. Expected: it gives way whole like the others, the orange bar unchanged. Missing.
- **The bar's right-click menu listing items that have wrapped away.** The choices are built from `STATUS_ITEMS` and the apps' items (StatusBar.svelte:87-100), not from what is drawn. Expected: a wrapped item is listed and checked, and hiding a drawn item lets a wrapped one come back. Item 2 asks for it, with no case. The window progress is not in that list, so once it wraps away nothing shows it is there.
- **Keyboard focus moving to an item that has wrapped away.** Wrapped buttons stay in the page and are still tab stops. Focusing one scrolls the `overflow: hidden` group or bar, which is a scroll container, so the bar shows its second row and keeps it. Expected: the bar never shows a second row (`overflow: clip` makes no scroll container). Whether a wrapped item is skipped by Tab is a choice for the reader (see "Other findings"). Missing.
- **The diff editor in inline and side-by-side mode** (`useInlineViewWhenSpaceIsLimited`, DiffEditor.svelte:192). Expected: whole in both, including the original side next to the sash. Missing.
- **The merge editor** (Merge.svelte:240, MergeSide.svelte:100). Expected: whole. Missing.

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both. `ls tools/oculus/docs` printed `apps.md diagrams`. None exists.

## 8. Dictated text

`grep -n '"' D69.md` gives one line of dictated text for a file: D69.md:81, the report's first line `"Everything in the brief is done"`. It holds, matching spec.md:81. The brief dictates no code or comment text; ":22 The comment above `.group` says what is now true" is a requirement, not text.

## Other findings

- **Missing from the write list:**
  - `src/lib/ui/menu/MenuOpener.svelte`, for the `.opener.status` cap and ellipsis.
  - `src/lib/shell/status/SourceItems.svelte`, `LanguageItems.svelte` and `AppItems.svelte`, for the right group's reversed markup.
  - `src/lib/views/sources/repositories/diff/Diff.svelte` and `src/lib/ui/frame/Pane.svelte`, for the wallpaper blur.
  - `options.ts` in place of a new module.
  - `peeks.ts` should come off the list.
- **Missing from the "Read" list:** MenuOpener.svelte, SourceItems.svelte, LanguageItems.svelte, RepoItems.svelte, Tooltip.svelte (it puts an `inline-flex` span between the item's span and the button, :233 and :301), Diff.svelte, `views/sources/source/Editor.svelte`, and DESIGN.md:246.
- **The width cap has to hold through four nested elements.** It has to work through `.group > span[data-status] > Tooltip span > button > span.label`. `.group > :global(*)` sets `flex: 0 0 auto` (StatusBar.svelte:350-353). The label needs `min-width: 0` and the ellipsis rules, and the button needs `max-width: 40vw`.
- **Moved widgets lose the editor's key handlers.** If widgets move into a node outside `.editor`, keys typed in them (the rename box) no longer pass through the editor's capture handlers (`onkeydowncapture={keys.before}`, `onkeydown={keys.after}`, Editor.svelte:464-465; `tab-out.ts:57` and `:66`). The node needs the class `monaco-editor`, or the context guard (`shell/context-guard.ts`, `KEEPS = '... .monaco-editor ...'`) cancels the browser's menu there. With the node on the body, Monaco's focus tracking includes it (`view.js:747`).
- **A widget drawn on the body does not follow an ancestor's scroll.** Monaco only re-places fixed widgets when the editor itself renders (`contentWidgets.js:272`), so if the source view's column or the diff list (`.files.several { overflow: auto }`) scrolls, a hover stays where it was. "Follow a scroll of the editor" (item 1) covers only the editor's own scroll.
- **User-visible choices the brief leaves to the builder (spec.md:18):**
  - (a) z-order: should the menu of an editor in the page be drawn over a free float that overlaps it? Today the page area is its own stacking context (`Workbench.svelte` `.area { isolation: isolate }`), under floats at depth 5 and up (`float-geometry.ts:171`).
  - (b) Tab order in the right group once its markup is reversed: right to left, or kept left to right some other way?
  - (c) Should a wrapped item stay a tab stop?
  - (d) Which mechanism is used: a layout-service override at the first create, or the blur moved off editor ancestors. The second agrees with DESIGN.md:246's rule and needs no Monaco service override.
- **HELP.md is not in the write list.** Spec.md:69 asks for user-facing behaviour as HELP.md bullets. Items leaving the bar whole, and the right-click menu bringing them back, may warrant one bullet.

## Declined to judge

- **The 609 px and 766 px figures, and which item said "Indexing".** They come from the look and cannot be rerun without a page. The language-server item's text is lowercase `'{0}: indexing {1} of {2}'` (`config/text/statusbar.yml:119`) and is in the right group (SourceItems.svelte:176 to LanguageItems), so the cut "Indexi" in the left group may have been an app's window progress. Not verified.
- **Whether D63's look ran under the wallpaper.** D63-landing.md:31 does not say.
- **Whether Monaco's widget colours read under the wallpaper once moved.** It depends on the mechanism chosen; settled only at the look.

Usage: ad3b6d05a2013035b, claude-opus-5-5, 210,006 tokens, 74 tool uses, 9.7 min.
