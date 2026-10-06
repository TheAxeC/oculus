# Step X3c brief check (on main at e1d7de25)

This is the report of the `spec` skill's fresh brief-check agent ("Steps / The brief check") on `tools/oculus/.scratch/migration/agents/briefs/X3c.md`, the uncommitted working-tree copy. It changes no file. `tools/oculus/` is shortened to `oculus/` in the paths below. Facts about VS Code are read from the installed VS Code 1.137.0 (`/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js`, its `.css`, and `nls.messages.json` for the menu words). That is a local read, with no web use. I name the certainty of each VS Code fact where it is given.

## 1. Names

- **`Instance` gains `pinned`.** Command: `git grep -n "id: [a-z.]*\.id, view\|{ id: held.id, view\|view: instance.view, state" -- src`.
  - `src/lib/state/workbench/layout/open/floats.ts:70` `return { id: tab.id, view: tab.view, state: tab.state };` (`kept`). This is outside the paths. A tab put in a float loses `pinned` silently. The change makes the head comment of `kept` ("a tab put in a float is one the reader means to keep") incomplete, and the brief says nothing about a pinned tab that is floated.
  - `open/preview.ts:59` (`kept` of a preview tab) is outside the paths. Its claim stays true, because a pinned tab is never a preview.
  - `saved/saved.ts:54-59` (`tabIdShape`) and `:314-317` are inside the paths. They must read `pinned`, and neither range is in the brief's "Read" list, which names `saved.ts:430-520`.
- **`LAYOUT_VERSION` raised to 6.** Command: `git grep -n "LAYOUT_VERSION" -- src tests`.
  - `saved.ts:460` `return typeof version === 'number' && version < LAYOUT_VERSION;` (`needsFloats`). It is inside the paths, and the change turns it wrong: a version-5 envelope already holds floats, but would be read as floatless, and `layout.svelte.ts:389`/`:427` would take the shipped floats in again.
  - `saved.ts:477` (the version gate) and `saved.ts:499` `const floats = version === LAYOUT_VERSION ? readFloats(held.floats, pages) : [];` are inside the paths. With the change, a version-5 envelope's floats are dropped.
  - `tests/state/workbench/layout/saved/layout-locked.test.ts:60` `expect(LAYOUT_VERSION).toBe(5);` is inside `tests/`. The change makes it false.
  - `DESIGN.md:375` "the envelope is `{ version: 5, pages, current, floats }` ... saved as `locked: true` inside the version 5 envelope" is inside the paths, and the change makes it false.
  - The brief's item 1 says only "a migration step that reads a version-5 layout unchanged". It names none of the three version comparisons.
- **`sessions.pin_pane` and `sessions.unpin_pane` (new words).** Command: `git grep -n "Pin this pane\|Unpin this pane\|pin_pane\|unpin_pane" -- src tests config HELP.md DESIGN.md README.md`.
  - `SessionPicker.svelte:77-78` is outside the paths. The keys stay the same, so nothing there becomes false.
  - The tests in `tests/views/sessions/*.test.ts` read `catalog[...]`, so they are not made false.
  - `HELP.md:113` "The view's toolbar holds the follow toggle and the pin" and "It follows the session the pane is pinned to" are inside the paths and become stale wording. Item 3 covers them.
- **`wrap_tabs` (new key).** Command: `git grep -n "show_tabs" -- src tests`, used as the template a new appearance key follows.
  - `src/lib/data/sources/config/catalogs.ts:22-36` `VOCAB_KEYS` (and its head comment `:15-21`, which lists the appearance keys the page installs) is outside the paths. Without an entry, the first load does not carry the key.
  - `src/lib/state/shared/words/appearance.ts:195-226` (the reader `setAppearance`) is outside the paths.
  - `tests/checks/config/config-folder.test.ts:107-117` `EXPECTED['appearance.yml']` is inside `tests/` and needs the key.
- **The Files breadcrumb removed.** Command: `git grep -n -i "breadcrumb\|crumbs" -- src tests config HELP.md DESIGN.md README.md`.
  - `src/lib/state/sources/explorer/view/place.ts:171` `crumbsOf` is outside the paths. Its only users are `Files.svelte:91`/`:197-198` and `tests/state/sources/explorer/explorer.test.ts:187-196`. After item 8 it is either reused for the file-tab breadcrumb (its output is exactly C10's segments) or left an export with no caller, which `spec.md`'s principles forbid.
  - `HELP.md:113` "A breadcrumb naming the selected row sits above the tree." is inside the paths; item 10 covers it.
- **The tab's right-click.** `HELP.md:44` "A right-click on a tab is left to the tab." and `PaneView.svelte:36-43` are inside the paths and need rewriting.
- **Cmd+K Shift+Enter.** Command: `git grep -n "key === 'k'\|Cmd+K\|Cmd-K" -- src`.
  - `src/lib/shell/keys/workbench-keys.svelte.ts:93-97` `if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); ... options.openPalette('') ...}` is inside `shell/keys/`. It conflicts with the brief: see Premises.
  - `DESIGN.md:389`, `HELP.md:82` and `HELP.md:91` ("Cmd-K opens the palette ... the editor's own Cmd-K commands ... each named Editor with its old keys beside it") and `config/text/app.yml:12` are inside the paths, and the chord makes them false.
- **Close All with pinned tabs.** `src/lib/views/sources/files/control/editor-closing.ts` and `OpenEditors.svelte:118-126` (`closing(openIds(groups))`, the Open Editors "Close All"). The first is outside the paths and the second inside. The brief does not say whether this Close All keeps pinned tabs. VS Code's `workbench.action.closeAllEditors` keeps them (`get excludeSticky(){return!0}` in the bundle).

Findings:
1. `saved.ts:460` and `:499` compare against `LAYOUT_VERSION` with `<` and `===`. If the bump is done without changing them, version-5 floats are dropped and the shipped floats are taken in a second time. The brief does not name either line.
2. `layout-locked.test.ts:60` and `DESIGN.md:375` pin version 5, and the brief does not name them.
3. `floats.ts:70` drops `pinned`, which the brief does not cover.
4. `VOCAB_KEYS` (`catalogs.ts:22-36`) and the reader (`appearance.ts:195-226`) are needed for `wrap_tabs` and are outside the path list.
5. `crumbsOf` (`place.ts:171`) is left without a caller unless it is reused. Its file is outside the path list.
6. The Open Editors Close All (`editor-closing.ts`) behaviour with pinned tabs is not stated.

## 2. The step line

- "the tab strip brought to VS Code's editor tabs": items 1 to 9 cover the features.
  - The look against VS Code's stylesheet has no item. Z161 ("the rest of the strip is X3c's") and `agents/reviews/U2-audit.md:1138` ("The tab strip is X3c's.") leave the strip's visual audit to this step. `spec.md`, "The principles", last bullet, says such a view "is judged on its look ... measured against VS Code's own stylesheet".
- "every row of P1's Editor tabs table":
  - pinned tabs: item 1;
  - context menu: item 2;
  - editor actions: item 9;
  - breadcrumbs: item 5;
  - wrapped tabs: item 4;
  - preview, dirty dot and split: stated as already there.
- "after Q81 lands", the menu on bits-ui (Z47 1 (a)): item 2.
- "Pin" and "Lock to this session", with the state unchanged (Z47 2 (a)): items 1, 2 and 3.
- `wrap_tabs: false` with a toggle in Appearance (Z47 3 (a)): item 4.
- Breadcrumbs over a file tab ("the source tab, a document, a PDF"), a segment opening the Files view at that folder, symbols after D23 (Z47 4 (a)): item 5. Part of it has no item: see Implied inputs, the `doc` tab.
- Widened by Z262 (`plan.md:216`): the tooltip with the full path is item 6, the Open Editors drag is item 7, and the Files breadcrumb removed is item 8.
- Widened by the Settings ruling (`plan.md:217`): "the tab options outside its rows and Z70 (preview, open position, editor limit) fixed at VS Code's defaults, said in HELP.md". **No item.**
- Ruled 2026-09-25 (`plan.md:219`): `pinned?: true`, the version raised, Close Others and Close All keep pinned tabs: item 1. Its per-browser wrap toggle is superseded by Z47 3 (a), as the brief says.
- Z152 and Z267: the order and the "no path bar" are stated.
- Booked for X3c in the state file's closed log (`orchestrator-state.md:183`): "in a pane about 140 px wide ... a tab's close control cannot be reached". **No item.**

Findings:
1. The `plan.md:217` widening has no item. The behaviour it fixes, read from VS Code 1.137:
   - `openPositioning` defaults to `"right"`, so a new tab opens to the right of the active one. oculus appends at the strip's end: `tree.ts:218-223` `openInstance` (`[...node.tabs, instance]`), used by `opening.ts:92`, `:183`, `:186` and `:247`. `tree.ts` and `opening.ts` are not in the path list.
   - `enablePreview` defaults to `true`, and `limit.enabled` to `false`. Both already match oculus and need only the HELP.md sentence.
   - Read literally, "the tab options outside its rows" also covers settings where oculus differs from VS Code's default today: `focusRecentEditorAfterClose` defaults to `true`, while oculus focuses the neighbour (`Z74-inventory.md:` section 4f wrongly calls VS Code's default `false`); `closeEmptyGroups` `true`; `revealIfOpen` `false`; `doubleClickTabToToggleEditorGroupSizes` `"expand"`.
2. The strip's look against VS Code's stylesheet (Z161, `U2-audit.md:1138`) has no item.
3. The unreachable close control in a narrow pane (`orchestrator-state.md:183`) has no item.

## 3. Premises

Every command was run on main at e1d7de25. A path relative to `oculus/` is given relative to it.

- `Instance` at `model.ts:18` and `LAYOUT_VERSION = 5` at `:131`: read; matches.
- `pinInstance`/`unpinInstance` at `instances.ts:54` and `:116-140`: read; matches (116 and 132).
- `SessionPicker.svelte:77-78` and `session-list.yml:43`/`:67`: grep; matches.
- `SessionDetail.svelte:315` `pin_label`: matches.
- `PaneView.svelte:162-190` and its 482 lines: matches.
- `Tab` "`tab-strip.ts:8-30`": `sed -n 30,35p` shows the type closing at line 34. This is a small mismatch: the range is 8-34.
- `TabFace` 316, `Tabs` 361, `tab-scroll` 161 and `PaneStrip` 184 lines: `wc -l` matches.
- `appearance.yml:76-78`: `git show HEAD:tools/oculus/config/appearance.yml | grep -n` gives 76 and 78. Matches.
- `options.yml:92-104`: matches (92 and 98).
- `onTab` at `:277-281`, `stripMenu` at `:232-245`, `ContextMenu` at `:411` and `askAndClose` at `:300`: matches.
- `transferInstance` at `layout.svelte.ts:181`: matches. That line is its type; the body is `instances.ts:295`.
- `fileOfTab` at `open-editors.ts:42`: matches. The Open Editors section has no drag: matches.
- `Breadcrumb.svelte` (96 lines) is used only by Files (`:66`, `:400-408`): matches.
- `git grep -n "wrap_tabs\|wrapTabs" -- src config ':!config/local.yml'` prints nothing (exit 1). Matches.
- `ls docs/adr` fails, and `grep -n '^adr' .agents/plan.yaml` prints nothing (exit 1). Matches.
- `libraries: check` at `.agents/plan.yaml:15`: matches.
- Verify list: the state file's yaml block holds 7 commands. Matches "checks: 7 commands passed".

The brief's text relies on further premises that are wrong or absent:
- **"Cmd+W close[s] a pinned tab".** No Cmd+W binding exists (`git grep -n "Cmd+W\|key === 'w'" -- src` prints nothing). The keyboard close is Delete on the focused tab (`Tabs.svelte:195-198`; `DESIGN.md:402`; `HELP.md:89`; `app.yml:12` "Delete | close the focused tab").
- **"Cmd+K Shift+Enter".** Cmd+K and Ctrl+K open or close the palette at once, with `preventDefault`, before `resolveKey` runs (`workbench-keys.svelte.ts:93-97`). The editor gives up every Monaco Cmd+K chord, and the palette lists those actions as Editor items with the old chord as a hint (`ui/controls/editor/chords.ts:1-2`, `palette.ts:5-8`, `DESIGN.md:389`). A live Cmd+K Shift+Enter chord does not fit the tree as it stands.
- **The palette has no command kind.** `palette.ts:44` has `kind: 'view' | 'project' | 'collection' | 'feed' | 'editor'`, and `HELP.md:91` names those words. "Pin Editor" needs a kind word, which a reader sees.
- **"`~` for the home folder".** The client never learns the home folder. `FsRoot` is `{ key, dir, fixed }` (`place.ts:55`); `expandHome` is server-only (`server/files/files.ts:204-208`); `git grep -n -i "home" -- src/lib/data/model src/lib/state/sources/fs*.ts src/lib/state/client` finds no home field. Item 6 therefore needs a wire field and a server change, and no such path is listed.
- **A "document" tab.** The `doc` view (a `docs:` entry) holds `{ id, path, label }` with no `root` (`navigation/catalogue.ts:29-31`), so `fileOfTab` returns null for it. The `document` view holds `root` (`layout/instance.ts:91-103`).
- **Existing helpers the brief does not name**, so a builder may rebuild them:
  - `showFolderInFiles` and `showInFiles` (`layout/open/show-in-files.ts:32`, `:56`), which are exactly item 5's two targets;
  - `rowPaths`/`absoluteOf` (`row-menu.ts:255`, `place.ts:199`) for Copy Path;
  - `writes.revealPath` (Reveal in Finder, `row-menu.ts:273`, `:351`);
  - `crumbsOf` (`place.ts:171`).
- **Folder and size limits.** Only `shell/panes/` at 10 items and `PaneView` at 482 lines are named.
  - Command: `ls -A <dir> | wc -l` and `git ls-files -co --exclude-standard`. These folders are also at the 10-item limit, so a new file there is refused: `src/lib/state/workbench/` (10), `src/lib/state/workbench/layout/` (10), `tests/state/workbench/layout/` (10), `tests/state/workbench/layout/saved/` (10), `tests/shell/panes/` (10), `tests/views/sources/files/` (10), `tests/ui/` (10), `tests/state/workbench/` (10).
  - Room is left in `tests/shell/panes/strip/` (2), `tests/ui/tabs/` (1), `tests/state/workbench/layout/open/` (7), `tests/views/sources/files/sections/` (1) and `src/lib/state/workbench/layout/open/` (8).
  - The size rule (`tests/checks/tree/size.test.ts:28-29`) checks a `.ts` file at 900 lines and a component at 540. Files near the line: `layout.svelte.ts` 830, `Palette.svelte` 503 and `Files.svelte` 494 (the last will shrink).

Findings:
1. The Cmd+W premise is false.
2. The Cmd+K Shift+Enter chord collides with Cmd+K opening the palette (`workbench-keys.svelte.ts:93-97`).
3. The palette has no command kind.
4. The client has no home folder for `~`.
5. `doc` tabs carry no root.
6. Four existing helpers are not named.
7. Six full `src` and `tests` folders beyond `shell/panes/` and two near-cap files are not named.
8. The `tab-strip.ts` range is 8-34, not 8-30.

## 4. Cases and checks

- **Item 1 and the cases on closing ("the close control's own close and Cmd+W close a pinned tab as any other").**
  - The sentence contradicts itself: the same item replaces a pinned tab's close control with the pin.
  - It also contradicts VS Code's default, which `plan.md:217` fixes. `workbench.editor.preventPinnedEditorClose` defaults to `"keyboardAndMouse"`. With that default, a keyboard close of an active pinned editor opens the first unpinned editor instead of closing (the bundle's `F7n`: `if(p&&u.isSticky(p)){let m=u.getEditors(0,{excludeSticky:!0})[0];if(m)return u.openEditor(m);...}`). A close from the menu, which passes arguments, does close it. I am sure of this; it was read from the code.
  - The oculus keyboard close is Delete.
- **C3 (Close Others, Close to the Right, Close All):** consistent with VS Code (all `excludeSticky:!0` in `closeOtherEditors`, `closeEditorsToTheRight`, `closeEditorsInGroup` and `closeUnmodifiedEditors`). VS Code also keeps the chosen tab and takes it out of preview (`for(let c of r)c&&n.pinEditor(c)`), which no case states.
- **C5 and item 2, the tab menu.** VS Code 1.137's tab menu, in its groups, is:
  - Close, Close Others (disabled with one tab), Close to the Right, Close Saved, Close All;
  - Copy Path, Copy Relative Path, Share;
  - Reveal in Finder, Reveal in Explorer View;
  - Keep Open (shown while preview is enabled, disabled on a non-preview tab), Pin or Unpin;
  - Split Right, then a "Split & Move" submenu (Split Up, Split Down, Split Left, Split Right, Move Above, Move Below, Move Left, Move Right, Split in Group);
  - Move into New Window, Copy into New Window.

  The brief differs from this in five places:
  - It omits Reveal in Finder, which oculus has (`writes.revealPath`, the Files row menu).
  - It omits Compare, which oculus has (Select for Compare and Compare with Selected, `HELP.md:113`). Decision 1 says it leaves out only "what oculus has no part for".
  - It hides Keep Open on a non-preview tab, where VS Code shows it disabled.
  - It offers "Split Right and Split Down", where VS Code shows Split Right plus the Split & Move submenu, and oculus's `splitInstance` takes every edge (`vscode-parity.md` Pane header row; `HELP.md:44`).
  - Its "Reveal in Files View" names an action oculus already calls "Show in Files" (`HELP.md:113`). That is two names for one action.
- **C8** ("a non-boolean value is a config finding"): this does not match the reader the key will join.
  - `appearance.ts:15-16` says each key "repairs a value of the wrong type to its default", and `show_tabs` and `editor_actions` raise no finding (`appearance.ts:201-205`).
  - The Settings view shows such a row as a mismatch (`rows.ts:147`, `:257`, `workbench.settings_mismatch_toggle`).
  - Either the finding is new behaviour the brief must name with its route, or the case follows the existing rule.
- **C15:** inconsistent with `DESIGN.md:389` and `HELP.md:91`, as in Premises.
- **Item 4** ("the pane's actions stay at the end of the first row"): VS Code's stylesheet places them at the end of the last row: `.tabs-and-actions-container.wrapping .editor-actions{position:absolute;bottom:0;right:0}`, with the last tab given `margin-right:var(--last-tab-margin-right)`. Sure; read from the 1.137 CSS.
- **Item 5 placed in `PaneBody.svelte`.**
  - `PaneBody`'s `.body` element turns the pointer into a drop edge or centre over its own `getBoundingClientRect()` (`PaneBody.svelte:79-95`), and its head comment scopes it to the views, the drop report and the empty line. A breadcrumb inside `.body` enlarges the drop rect and the top-edge zone.
  - VS Code draws breadcrumbs in the editor group's title area: `.breadcrumbs-below-tabs` under multiple tabs, and inside the title row next to the label under `showTabs: single` (the bundle's `breadcrumbsInHeader || ... createInstance(pce, i /* the label container */ ...)` and `(r||i.partOptions.showTabs!=="single")&&(this.breadcrumbsContainer=x(c,E(".breadcrumbs-below-tabs"))...`).
  - That puts them in the strip's domain (`strip/`, where `stripShape` already decides the row per `show_tabs`), not the body's.
  - `shell/panes/` is full, so a new component must go in `strip/`.
- **`spec.md`, "Read first", item 1** ("It names the sections of `tools/oculus/DESIGN.md` the package is measured against"): the brief names none. The relevant ones are "Layout as data" and `DESIGN.md:375`, the keys at `:402`, and the palette at `:389`.
- **`spec.md`, "The principles", last bullet** ("Where oculus does something VS Code does not, or does it better, that is kept: the brief lists each such thing before the build"): the brief lists none. Examples on the tree: the close question for a terminal running a program (`askAndClose`); Delete closing the focused tab; Ctrl+] and Ctrl+[; an empty pane that stays (VS Code's `closeEmptyGroups` defaults to `true`); the count badges on tabs (`U2-audit.md:64` "Better and kept"); the session lock.
- **`spec.md`, "What every package obeys", the line on keys and asynchronous paths:**
  - Every key introduced is "exercised empty, duplicated, and colliding". `wrap_tabs` empty or null and `pinned` with a non-true value are not cases.
  - Every asynchronous path is exercised in flight, after close and superseded. The clipboard write of Copy Path and Copy Relative Path, and the Close Others or Close Saved guard through `busyTerminals`, are not cases.

Findings:
1. The keyboard and close rule of item 1 contradicts itself and contradicts `preventPinnedEditorClose`'s default.
2. Item 2's list differs from VS Code 1.137 in five places: Reveal in Finder, Compare, Keep Open disabled rather than hidden, the Split & Move submenu, and the "Show in Files" name.
3. C8 does not match the established reader.
4. C15 does not match `DESIGN.md:389`.
5. Item 4 places the actions on the first row, which is the wrong row.
6. Item 5 puts the breadcrumb in `PaneBody`, inside the drop rect, away from where VS Code draws it.
7. The brief names no DESIGN.md sections.
8. The brief has no list of things oculus keeps.
9. The key and asynchronous-path cases that `spec.md` requires are missing.

## 5. The question

"The goal" is the part of the plan's goal X3c delivers: the tab strip and its tabs behave and look as VS Code's editor tabs, with the ruled oculus differences.

- C1: yes, it could pass without the goal. A fixture with no float and no locked pane passes while `needsFloats` (`<`) and `readFloats` (`===`) drop or duplicate a real browser's floats. The fixture must hold a float, a locked pane, and the check of `needsFloats(raw)` being false for version 5.
- C2: no, as long as it runs over the layout store.
- C3: no.
- C4: no.
- C5: yes. It runs over the item function, so the menu could be right while a right-click on a tab still opens the strip's menu or nothing. The look item covers this.
- C6: no.
- C7: yes for the words, which are an audit. No for `pinInstance`.
- C8: partly. It holds for the reader. "The Settings view lists the toggle" over a string render is an audit.
- C9: yes. A pure function can report "no scroll offset" while the CSS still does not wrap, and "rows as needed" cannot be computed without widths. The look item covers wrapping. C9's rows half is an audit.
- C10: yes. The segments function can be right while nothing draws above the tab. The look item covers this.
- C11: no.
- C12: yes. "the target's index" read as the row's index in the Open Editors group passes on a pane holding only file tabs, and moves the tab to the wrong place when the pane also holds a terminal or another non-file tab.
- C13: it passes trivially by a source grep, which is an audit. A render of `Files` without the `nav` would prove it.
- C14: no, over the layout store.
- C15: yes. A test over `resolveKey` can pass while `workbench-keys.svelte.ts:93-97` takes Cmd+K first and opens the palette.
- The check on the step's line (`checks.sh`, 7 commands): yes. It is green whatever the tab strip does.
- Item 9's check ("the report says so with the file and line"): yes. VS Code's strip end also carries the active editor's own title actions (for example Open Preview to the Side for Markdown, or Open Changes), which oculus draws in the source tab's own bar inside the body. P1's row is "part", and nothing in item 9 settles it. I am sure the menu exists in VS Code; whether P1's row means those actions is an inference.

Findings: C1, C9, C12, C13, C15, item 9 and the line's check, each with how it passes as given above.

## 6. Implied inputs

This is a code step. Each input below is missing from "Cases"; the expected result I propose follows it.
- A saved tab with `pinned` set to anything but `true` (false, "yes", 1) reads as unpinned, as `preview` does (`saved.ts:317`).
- A saved tab with both `pinned: true` and `preview: true` reads as pinned with the preview flag dropped.
- A saved version-6 pane whose pinned tabs are not first: the order is either restored on read or refused. The brief must say which.
- A version-4 envelope still reads and takes the shipped floats once. A version-5 envelope keeps its floats and is not given the shipped floats again.
- A pinned tab floated (`floats.ts:70`), moved to another page (`moveInstanceToPage` then `openInstance`, which appends after unpinned tabs), or split to an edge (`splitInstance`): whether the pin stays.
- Delete on a focused pinned tab: under VS Code's default, it is not closed, and the first unpinned tab is shown.
- A pinned tab with unsaved text: VS Code shows its close-with-dirty action, not the unpin action. The bundle's tab action is `{id:cX ...}` under `T.and(n4.toNegated(), zB.toNegated(), hN)`, where `zB` is "activeEditorIsDirty".
- A new tab or a preview opened while the active tab is pinned: it lands after the pinned run, to the right of the active tab (`openPositioning: "right"`).
- Close Others or Close to the Right on a preview tab: the kept tab stops being a preview.
- Close Others or Close Saved over a terminal tab running a program: the busy question names it, as in `askAndClose`.
- The Open Editors Close All with a pinned tab: the pinned tab stays.
- Copy Path while the roots are unread, or for a root the workspace no longer serves: say what is copied. A refused clipboard write: the words shown. A second copy while the first is in flight.
- The tooltip for a file outside the home folder (no `~`), and for a root whose folder is unknown.
- The breadcrumb for a tab whose root is not among the shown roots (`Files.svelte:197-198` guards this for its own crumbs), for a file at a root's top (root and file only), and for a `doc` tab (no root).
- An Open Editors drop onto its own row, and onto a group line.
- `wrap_tabs: true` under `show_tabs: single` or `none` is ignored. VS Code: "This value is ignored when `workbench.editor.showTabs` is not set to 'multiple'", read from the 1.137 description.
- A drop on the second row of a wrapped strip: `insertionIndex(midpoints, x)` (`tab-strip.ts:42`) reads `x` only.
- `wrap_tabs:` empty or null reads as `false`.
- Pin Editor or Unpin Editor with no active tab, with the active tab in a float, and from the palette opened inside the source editor.

Findings: all of the above are missing from "Cases".

## 7. ADRs

- There is no record. `ls docs/adr` prints "No such file or directory". `.agents/plan.yaml` has no `adr:` key (`grep -n '^adr'` prints nothing). `git ls-files | grep -i "/adr/"` prints nothing.

Findings: none.

## Declined to judge

- What VS Code 1.137 draws for breadcrumbs under `showTabs: none` (decision 3). The title-control code for "none" was not traced in the bundle. Tracing that class would settle it.
- Whether VS Code's Open Editors view shows the unpin action on a pinned row. Not found in the bundle with the searches I ran.
- Whether the version bump is the right design, given that `locked` and `preview` were both added inside a version without a bump (`DESIGN.md:375`). The bump is Axel's ruling of 2026-09-25, so this is his call.
- How widely the `plan.md:217` widening reaches: only the three named options (preview, open position, editor limit), or every `workbench.editor.*` default where oculus differs (`focusRecentEditorAfterClose`, `closeEmptyGroups`, `revealIfOpen`, `doubleClickTabToToggleEditorGroupSizes`). That is a reading of a ruling.
- Whether the Cmd+K Shift+Enter key should become a live chord (which changes how Cmd+K behaves everywhere) or a hint beside a palette item, as the editor's given-up chords are. It is a keybinding a reader sees.
- Shared paths with steps in flight (S4 also writes `config/text/app.yml` and `HELP.md`). The brief check does not compare these.

Agent usage: claude-opus-5-5 (served model to be read from the runner's record), about 300,000 tokens (15,000,000 at start, 14,701,009 left at the last reading), about 108 tool uses, minutes not measured.

Usage (completion notice): claude-opus-5-5, 318,282 tokens, 113 tool uses, 17.0 min.

## Closed

Each finding is closed in `agents/briefs/X3c.md` as rewritten at `/spec X3c` on main at e752624e, the choices among them booked as Z324 (automode).

- 1.1 and 1.2: item 1 names the three version comparisons of `saved.ts` (now `:462`, `:481`, `:505`), `layout-locked.test.ts:60` and `DESIGN.md:375`; C1 holds a float, a locked pane and `needsFloats`.
- 1.3: item 1, a pinned tab keeps its pin across a float, a page move and a split (`floats.ts:70` in the paths); C35.
- 1.4: item 4 names `VOCAB_KEYS`, `setAppearance` and `config-folder.test.ts`; both source files in the paths.
- 1.5: item 5 builds the segments from `crumbsOf`, kept; `place.ts` in the paths.
- 1.6: item 1 and C3, the Open Editors Close All keeps pinned tabs; `editor-closing.ts` in the paths.
- 2.1: item 14 (a new tab opens to the right of the active one, `tree.ts` and `opening.ts` in the paths) and item 10's HELP.md sentence; `focusRecentEditorAfterClose` is item 22; `closeEmptyGroups` and `revealIfOpen` are in "What oculus keeps".
- 2.2: item 18, the strip measured against VS Code's stylesheet; C23.
- 2.3: item 17 and C22, the close control in a 140px pane.
- 3.1: item 1 names Delete, the keyboard close; no Cmd+W.
- 3.2 and 3.3: item 1 and decision 5, palette items of kind `editor` with the chord as a hint (Z324); C15.
- 3.4: item 6, the server's roots answer gains the home folder; its three files in the paths; C11.
- 3.5: item 5, `fileOfTab` reads a `doc` tab under the hub root; C10.
- 3.6: the four helpers named under "What is on the tree" and used by items 2 and 5.
- 3.7: the full folders and near-cap files listed under "What is on the tree".
- 3.8: `tab-strip.ts:8-34`.
- 4.1: item 1 and decision 6, Delete on a pinned tab follows `preventPinnedEditorClose`; C36.
- 4.2: item 2 follows VS Code 1.137's menu with Reveal in Finder, Compare, Keep Open disabled, the Split & Move submenu, and the name Show in Files; decision 1; C5.
- 4.3: C8 follows the reader's repair rule, no finding.
- 4.4: C15 rewritten.
- 4.5: item 4, the actions at the end of the last row.
- 4.6: item 5, the breadcrumb in `shell/panes/strip/`, outside `PaneBody`'s drop box.
- 4.7: the DESIGN.md sections named in the brief's first paragraph.
- 4.8: the section "What oculus keeps where it differs from VS Code".
- 4.9: C8 (empty, null), C34 (`pinned` not true), C6 (the clipboard in flight and refused), C4 (the busy guard).
- 5: C1, C9, C12, C13 and C15 rewritten as section 5 says; C7 and C13 marked audits; item 9 met by item 12.
- 6: C34 to C37 and the extra inputs of C3, C4, C6, C10, C11, C12 and C15; the order of a version-6 pane with pinned tabs not first is restored on read (item 1).
