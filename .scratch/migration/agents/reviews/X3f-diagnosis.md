# Diagnosis: a double click on a file row leaves the tab a preview

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says; no output quoted here holds a secret. vitest's pass and fail marks are written `PASS` and `FAIL`, its separator lines are left out, and the time of each test is cut. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding.

## Symptom

From the task of this diagnosis, X3f's look on TEST: "A double click on a file row usually opens nothing". With Files active, a double click on `engine/catalogs/icons.yml` and on `engine/behavior.yml` opened no tab and left Files active. On `glyphs.yml`, already open as a preview, it left the tab a preview. The first double click after a reload, on agents.yml, opened and kept its tab. A single click opens the preview. The brief is `agents/briefs/X3f.md` (items 1 and 2), the review `agents/reviews/X3f-refuter.md`.

## Where the probes run

The scratch copy `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree`, a detached worktree of the hub at `6c3781d10` with `tools/oculus/.scratch/migration/agents/reviews/X3f-backed-out.patch` applied by `git apply --3way` (49 files), then `npm ci` in `tools/oculus` and `npm install --no-save jsdom@26.1.0` (jsdom is no dependency of oculus; `cmp` showed `package.json` and `package-lock.json` unchanged after the install). The harness of the red command is the folder `tests/diag/` of the copy, written for this diagnosis and given whole in the appendix at the end of this record. The paths redirected under `$TMPDIR`: none; no command of the red command touches the home folder, the installed skills or a server.

Taken from inside the step's worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3f` (at `6c3781d10`):

```
M  tools/oculus/DESIGN.md
M  tools/oculus/HELP.md
M  tools/oculus/config/text/views/sources/doc.yml
M  tools/oculus/config/text/views/sources/document.yml
M  tools/oculus/config/text/views/sources/file.yml
M  tools/oculus/config/text/views/sources/files.yml
M  tools/oculus/config/text/views/sources/source.yml
M  tools/oculus/docs/diagrams/channels.dot
M  tools/oculus/docs/diagrams/channels.svg
M  tools/oculus/docs/diagrams/layer-state.dot
M  tools/oculus/docs/diagrams/layer-state.svg
M  tools/oculus/docs/diagrams/layer-views.dot
M  tools/oculus/docs/diagrams/layer-views.svg
M  tools/oculus/docs/diagrams/layers.dot
M  tools/oculus/docs/diagrams/layers.svg
M  tools/oculus/src/lib/shell/panes/PaneBody.svelte
M  tools/oculus/src/lib/shell/panes/PaneView.svelte
M  tools/oculus/src/lib/state/sources/explorer/file-type.ts
M  tools/oculus/src/lib/state/sources/explorer/follow.ts
M  tools/oculus/src/lib/state/sources/fs.svelte.ts
M  tools/oculus/src/lib/state/sources/fs.ts
M  tools/oculus/src/lib/state/workbench/layout.svelte.ts
M  tools/oculus/src/lib/state/workbench/layout/index.ts
A  tools/oculus/src/lib/state/workbench/layout/open/armed-keep.svelte.ts
M  tools/oculus/src/lib/state/workbench/layout/open/opening.ts
M  tools/oculus/src/lib/state/workbench/layout/open/preview.ts
M  tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
M  tools/oculus/src/lib/views/shared/explorer/RootedTree.svelte
M  tools/oculus/src/lib/views/shared/explorer/opening.ts
M  tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts
M  tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte
M  tools/oculus/src/lib/views/shared/explorer/tree/control/pressing.ts
M  tools/oculus/src/lib/views/shared/explorer/tree/menu/row-menu.ts
M  tools/oculus/src/lib/views/shared/links/BookmarkStar.svelte
A  tools/oculus/src/lib/views/shared/links/FileTab.svelte
M  tools/oculus/src/lib/views/shared/links/ProgramButton.svelte
A  tools/oculus/src/lib/views/shared/links/SaidLine.svelte
A  tools/oculus/src/lib/views/shared/links/StripActions.svelte
M  tools/oculus/src/lib/views/shared/prose/Markdown.svelte
A  tools/oculus/src/lib/views/shared/prose/RenderedMarkdown.svelte
M  tools/oculus/src/lib/views/sources/doc/Doc.svelte
A  tools/oculus/src/lib/views/sources/doc/MarkdownPreview.svelte
M  tools/oculus/src/lib/views/sources/document/Document.svelte
M  tools/oculus/src/lib/views/sources/file/File.svelte
M  tools/oculus/src/lib/views/sources/source/Editor.svelte
D  tools/oculus/src/lib/views/sources/source/Preview.svelte
M  tools/oculus/src/lib/views/sources/source/Source.svelte
D  tools/oculus/src/lib/views/sources/source/StripActions.svelte
A  tools/oculus/src/lib/views/sources/source/read-again.ts
0a9b2cb164f312fd74fc75032d73def626b54019  -
```

## Red command

```
cd /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree/tools/oculus && npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
```

The command mounts the real `PaneView` and `PaneBody` (the keep layer and `KEEP_WINDOW_MS`), the real Files view (`RootedTree`, `Tree`, `FileRow`, `TreeItem`, the opener of `rooted-tree.svelte.ts` and `openRow`), the real `Source.svelte` with a Monaco stand-in (`fake-kit.ts`, whose `setModel` removes and rebuilds `.monaco-editor > .native-edit-context` as Monaco removes its view), and the real client state with `fs.readFileKind`, under jsdom in vitest's `client` project. One pane holds the Files tab and a kept README.md tab, as on TEST. `fetch` is stubbed, and a read of `/api/file/...` waits on a gate the test opens, which sets when the kind read answers. A press is dispatched in Chrome's order (pointerdown, mousedown, focus of the pressed treeitem, pointerup, mouseup, click, and dblclick on the second press), each event to the element the CSS puts under the pointer at that moment: the keep layer while it is drawn, else the row while the Files tab is shown, else the shown tab's editor input. A click whose mousedown and mouseup targets differ goes to their common ancestor. Each test prints the pane's tabs (`(preview)` marks a preview tab), the active tab, whether the layer is drawn, whether the strip draws the active tab's actions (`actions=active` or `none`) and where the focus is.

The test of this symptom is `symptom 1: the first read answers while the second press is down; the double click keeps the tab`. The first press goes down and up on the agents.yml row; the second goes down on the row 150 ms later; the gate opens while it is down, so the preview tab opens and the layer is drawn under the pointer; the second press is then released. The test asserts that the tab is open and kept.

Runs on the tree without the fix, with the output of each quoted (the result line of this test in each run, and the lines the test printed in run 1; the other tests are under the other diagnoses):

```
run 1: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
read answered while the second press is down: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
press 2: down=row up=layer click=div[body] focus=row
tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)

run 2: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)

run 3: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
```

Red in 3 of 3 runs. The line `press 2: down=row up=layer click=div[body]` is the symptom: the second press went down on the row, the layer was drawn before it was released, and the release and the click landed on the layer and the pane body. The row's `dblclick` needs the release on the row, and the layer listens to `pointerdown` only, so nothing took the second press and the tab stayed a preview: the form seen on `glyphs.yml`.

## No red command

For the form "no tab opened, Files left active" (icons.yml and behavior.yml on TEST) no red command was built. Each way tried, with what it gave:

- The red command's harness with the real Files view and the real Source, over a sweep of the kind read's delay (5, 60, 150, 300 and 700 ms), the hold of each press (0 and 80 ms) and the gap between the presses (80, 200 and 350 ms), four files in a row each: `tests/diag/focus.client.test.ts` and `tests/diag/files-real.client.test.ts`, 30 timings. Every double click of every timing opened a tab; the only wrong outcome was the preview left by the race above (the sweep's log on the tree without the fix, its 120 result lines read by a script that sorts each line by whether the pressed file's tab is open and kept, open as a preview, or missing: 117 kept, 3 left a preview, 0 missing).
- The same with the focus moved to the pressed treeitem as Chrome moves it, and without: no tab missing in either.
- The same with the real `Source.svelte`, with the real `ui/controls/editor/Editor.svelte` over the Monaco stand-in, and with a stand-in view that only hands up actions: no tab missing in any.
- A root refresh (`client.fs.refresh('hub', 7)`, what a push from the server for the root does) while the kind read of a double click is out, the test `X3f observed form: a push marks the root while the read is out` in the red command's file: it passes on the tree without the fix (`tabs=[files:-, source:icons.yml, source:README.md] active=source:icons.yml`, quoted in the runs above), so a refresh during the read does not lose the tab.

Why the copy could not reproduce it: every path in the harness from a press on a row to `openView` awaits `readFileKind` and then opens a tab; no outcome of the read the harness can give (fast, slow, refreshed while out) ends without one. What is left is what the harness cannot hold: the TEST server's own answers (a kind read that fails or never answers on a loaded server, a socket push of another kind) and Chrome's own event handling. Telling those apart needs the network panel and `document.activeElement` on TEST during the double click, which this diagnosis may not open. That form is "cause not found" below.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The strip press that brings the Files tab to the front (`DIAG_STRIP=no`) | red: `tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true` | cut |
| The real `Source.svelte`, for the real `Editor.svelte` over the Monaco stand-in (`DIAG_SOURCE=editor`) | red: the same line | cut |
| The real `Source.svelte`, for a stand-in that hands up actions and holds an editor input (`DIAG_SOURCE=fake`) | red: the same line | cut |
| The real Files view, for a list item that calls `openRow` on click and on dblclick as `Tree.svelte` does (`DIAG_FILES=fake`) | red: `tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=BODY` | cut for the red; put back for the fix runs, since the fix is in the row (`TreeItem.svelte`, `FileRow.svelte`) that the stand-in replaces |
| The kept README.md tab (`DIAG_README=no`) | the layout splits Files into a pane of its own: `not one pane: {"kind":"split","dir":"row",...` | put back: without it the case is a different one (the tree stays on screen beside the file) |

The runs of each cut alone, on the tree without the fix:

```
== DIAG_STRIP=no
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=editor
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
== DIAG_FILES=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
== DIAG_README=no
   -> not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"a5b9a2ec-99dc-4e93-86ad-c: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:icons.yml'
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
   -> not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"c3897dc4-e673-49d6-928b-9: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:agents.yml'
   -> not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"fa88d86c-54a6-408d-8aaa-d editor input focused=false: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:agents.yml'
AssertionError: not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"a5b9a2ec-99dc-4e93-86ad-c: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:icons.yml'
AssertionError: not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"c3897dc4-e673-49d6-928b-9: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:agents.yml'
AssertionError: not one pane: {"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"files-1","view":"files","state":{}}],"active":"files-1"},{"kind":"pane","tabs":[{"id":"fa88d86c-54a6-408d-8aaa-d editor input focused=false: expected 'not one pane: {"kind":"split","dir":"...' to contain 'active=source:agents.yml'
```

The shrunk case, as it stands: the real `PaneView` and `PaneBody` with the keep layer, the real `openRow` over the real `fs.readFileKind` with the gated read, a file row that calls `openRow` on click and on dblclick, one pane holding the Files tab and a kept tab, and a second press whose release comes after the read answered. The shrunk run (`DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no`), on the tree without the fix:

```
DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  3 failed | 1 passed (4)
```

## Hypotheses

1. If the read answering while the second press is down draws the layer under the pointer, so that the release and the dblclick never reach the row and the layer never sees a pointerdown, then taking the second press on the row when it goes down (a `mousedown` with `detail === 2`) turns the red command green. Falsified by: the red command still red with that change.
2. If the keep is refused (`armKeep` not called, or `stillPreview` false for the opened tab), so no layer is drawn, then nothing about the release matters and the layer is the place to look. Falsified by: `layer=true` in the red command's output while the tab is a preview.
3. If a push that marks the root while the kind read is out cancels the read, so that no tab opens (the "no tab" form), then a root refresh during the read leaves no tab. Falsified by: a tab opened and kept with the refresh during the read.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 2 | none: the red command's own output | `read answered while the second press is down: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true` | falsified |
| 1 | probe 1 below | `press 2: down=row up=div[body] click=div[body] focus=row`, `tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false`, `PASS ... symptom 1` | still standing |
| 3 | the test `X3f observed form: a push marks the root while the read is out` (no change to the code) | `tabs=[files:-, source:icons.yml, source:README.md] active=source:icons.yml layer=false`, `PASS` on the tree without the fix | falsified |

Probe 1, made on the tree without the fix and undone after its run (`git diff --stat -- tools/oculus/src` printed nothing after the undo):

```
diff --git a/tools/oculus/src/lib/ui/tree/TreeItem.svelte b/tools/oculus/src/lib/ui/tree/TreeItem.svelte
index 9711ffd87..3031ad31f 100644
--- a/tools/oculus/src/lib/ui/tree/TreeItem.svelte
+++ b/tools/oculus/src/lib/ui/tree/TreeItem.svelte
@@ -193,7 +193,9 @@
             tabindex={inTree ? -1 : undefined}
             bind:this={button}
             onclick={pressed}
-            {ondblclick}
+            onmousedown={(event: MouseEvent) => {
+                if (event.button === 0 && event.detail === 2) ondblclick?.(event);
+            }}
         >
             <!-- The words describe the element that takes the focus: the row in a tree, whose
                  button takes none, and the button outside one. -->
```

```
npx vitest run --project client tests/diag/red.client.test.ts -t "symptom 1" --reporter=verbose
press 2: down=row up=div[body] click=div[body] focus=row
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=row
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
      Tests  1 passed | 3 skipped (4)
```

## Cause

For the form "the double click left the tab a preview": hypothesis 1. In one pane, when the file's kind is read only after the second press has gone down on the row and before it is released, `openRow` opens the preview tab and arms the keep while the button is down; `PaneBody` draws the layer at once, so the release, the click and the dblclick land on the layer and the pane body. `FileRow` keeps a tab only on the row's `dblclick` (`FileRow.svelte`: `ondblclick={row.kind === 'file' ? () => onkeep(row) : undefined}`), and the layer keeps a tab only on a `pointerdown` (`PaneBody.svelte`, `layerPressed`), so neither sees the second press. Probe 1 turns the red command green, and it is red without it (the runs above).

For the form "no tab opened, Files left active": cause not found. No red command could be built; every way tried is under "No red command" above, and hypothesis 3, the one cause of that form the harness could hold, is falsified. The condition: the harness gives every outcome of the kind read it can produce and each opens a tab, and what is left (the TEST server's answers, Chrome's own handling) needs TEST, which this diagnosis may not open. It goes to the user as an open item, quoted in the hand-over.

## Fix and test

Test, run on the tree without the fix: the red command's test `symptom 1`, quoted under "Red command" above (red in 3 of 3 runs).

Fix (the row takes the second press when it goes down; `FileRow` passes the press's time so that the kept tab takes the keyboard, which is the fix of the second diagnosis; HELP.md names the new case):

```
diff --git a/tools/oculus/HELP.md b/tools/oculus/HELP.md
index 85938181e..e21b62a9f 100644
--- a/tools/oculus/HELP.md
+++ b/tools/oculus/HELP.md
@@ -164,7 +164,7 @@ The LaTeX view and the project tab's LaTeX panel draw the same rows. A main file
 
 Every text file of the file browser opens in `source`. What counts as text is the file's own first bytes: no extension list decides it, so a script nobody gave an extension opens for editing and an archive somebody called a `.txt` is a download. Whether it can be saved is the file's mode on this machine: a file this machine locks, and one too long to have been read whole, are drawn as a read-only window under a line saying why, and neither takes a keystroke.
 
-A single click in the tree opens a preview tab, drawn in italics: the next single click in that pane is pointed at the file it names instead of opening a second tab, so a walk through a folder leaves one tab and not twenty. Clicking the same file a second time keeps its tab; so do a double click on the tab itself, typing into it, dragging it and splitting the pane around it. A double click on the row keeps it where the tree stays on screen beside the file, in a split pane; in one pane the first click has already put the file where the tree was, so the second press lands on the tab, in its editor or its frame, and keeps the tab the first click opened. The second press is taken for 500 ms after the first click, selects no word in the editor, and leaves the keyboard in the kept tab's editor or frame. A file the server says is gone opens in the source tab, which says it cannot be opened and offers Read again.
+A single click in the tree opens a preview tab, drawn in italics: the next single click in that pane is pointed at the file it names instead of opening a second tab, so a walk through a folder leaves one tab and not twenty. Clicking the same file a second time keeps its tab; so do a double click on the tab itself, typing into it, dragging it and splitting the pane around it. A double click on the row keeps it where the tree stays on screen beside the file, in a split pane; in one pane the first click has already put the file where the tree was, so the second press lands on the tab, in its editor or its frame, and keeps the tab the first click opened; a file still being read when the second press goes down keeps its tab from the row. The second press is taken for 500 ms after the first click, selects no word in the editor, and leaves the keyboard in the kept tab's editor or frame. A file the server says is gone opens in the source tab, which says it cannot be opened and offers Read again.
 
 The source tab's editor takes its options from `behavior.yml`: `editor.tab_size` and `editor.insert_spaces` for a file with no indented line, `editor.word_wrap` (`off`, `on`, `wordWrapColumn` or `bounded`), `editor.minimap`, `editor.render_whitespace` and `editor.sticky_scroll`, each a control in the Settings view's Editor group. `editor.languages` holds a record per language name with `tab_size`, `insert_spaces`, `word_wrap` and `rulers` (the columns that draw a vertical line), and a repository's `.oculus/settings.yml` can hold a `languages:` map of the same records, which overrides `editor.languages` for the files served from that root; its `editor:` key is not read, and an entry that cannot be read is skipped and listed under the Languages row. A value is taken in this order. Indentation: the choice made on the status bar for the tab, then the file's own when it indents with spaces or tabs, then the root's record, then `editor.languages`, then `editor.tab_size` and `editor.insert_spaces`; a file that indents with tabs keeps its tabs and takes its width from the same order. Word wrap: the tab's Alt+Z, then the root's record, then `editor.languages`, then `editor.word_wrap`. Alt+Z (View: Toggle Word Wrap, listed among the editor's palette actions) turns the wrap off when it is on, returns it to the configured value when it is off and the configured value wraps, and sets it on when both are off; the tab keeps the result across a reload. Rulers: the root's record, then `editor.languages`, then none. The minimap, whitespace and sticky scroll are the global keys alone, and the diff editor takes the configured word wrap, rulers, whitespace and sticky scroll of the file's language with no minimap. Sticky scroll pins the headings of a Markdown or LaTeX file, the blocks TypeScript, JavaScript, JSON, CSS, SCSS, Less and HTML give, and the braces of C, C++, Java, Dart, R and Rite. Every other editor setting stays at Monaco's default.
 
diff --git a/tools/oculus/src/lib/ui/tree/TreeItem.svelte b/tools/oculus/src/lib/ui/tree/TreeItem.svelte
index 9711ffd87..cc0e68bf9 100644
--- a/tools/oculus/src/lib/ui/tree/TreeItem.svelte
+++ b/tools/oculus/src/lib/ui/tree/TreeItem.svelte
@@ -76,7 +76,7 @@
         id,
         nav,
         onclick,
-        ondblclick,
+        onpressagain,
         detail,
         words,
         field,
@@ -193,7 +193,9 @@
             tabindex={inTree ? -1 : undefined}
             bind:this={button}
             onclick={pressed}
-            {ondblclick}
+            onmousedown={(event: MouseEvent) => {
+                if (event.button === 0 && event.detail === 2) onpressagain?.(event);
+            }}
         >
             <!-- The words describe the element that takes the focus: the row in a tree, whose
                  button takes none, and the button outside one. -->
diff --git a/tools/oculus/src/lib/ui/tree/item-props.ts b/tools/oculus/src/lib/ui/tree/item-props.ts
index cd3d56f70..c60245764 100644
--- a/tools/oculus/src/lib/ui/tree/item-props.ts
+++ b/tools/oculus/src/lib/ui/tree/item-props.ts
@@ -60,7 +60,12 @@ export type TreeItemProps = {
     nav?: TreeNav;
     /** What pressing the row does; a row with none is drawn as text. */
     onclick?: (event: MouseEvent) => void;
-    ondblclick?: (event: MouseEvent) => void;
+    /**
+     * The second press of a double click, taken when it goes down: what the row opens with a
+     * first press may cover the row before that press is released, and the release and the
+     * browser's dblclick then never reach the row.
+     */
+    onpressagain?: (event: MouseEvent) => void;
     /** What the row says after its name, muted: a path, a time. */
     detail?: Snippet;
     /** The name drawn by the caller, in the place of the label's text. */
diff --git a/tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte b/tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte
index fd3c5a44c..8c312f2a1 100644
--- a/tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte
+++ b/tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte
@@ -33,7 +33,11 @@
             hit: { segment: string | null; twisty: boolean }
         ) => void;
         /** The row opened as a tab that stays. */
-        onkeep: (row: TreeRow) => void;
+        /**
+         * Open the file as a kept tab. A pointer press passes its time, and the tab takes the
+         * keyboard.
+         */
+        onkeep: (row: TreeRow, pressedAt?: number) => void;
         onbookmark: (row: TreeRow) => void;
     };
 
@@ -106,7 +110,7 @@
             glyph="launch"
             compact
             tabindex={reach}
-            onclick={() => onkeep(row)}
+            onclick={(event: MouseEvent) => onkeep(row, event.timeStamp)}
         />
     {/if}
 {/snippet}
@@ -127,7 +131,9 @@
     words={row.chain !== undefined || row.hits !== undefined ? words : undefined}
     end={lettered ? end : undefined}
     onclick={(event: MouseEvent) => onpress(row, event, hitOf(event))}
-    ondblclick={row.kind === 'file' ? () => onkeep(row) : undefined}
+    onpressagain={row.kind === 'file'
+        ? (event: MouseEvent) => onkeep(row, event.timeStamp)
+        : undefined}
     {actions}
 />
 
diff --git a/tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte b/tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte
index 0c5bbaf16..6797fd3c3 100644
--- a/tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte
+++ b/tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte
@@ -336,9 +336,9 @@
                                               row.kind
                                           )}
                                     onpress={pressed}
-                                    onkeep={(one: TreeRow) => {
+                                    onkeep={(one: TreeRow, pressedAt?: number) => {
                                         onselect(one);
-                                        onopen(one, false);
+                                        onopen(one, false, pressedAt);
                                     }}
                                     {onbookmark}
                                 />
```

Runs after the fix, three in a row:

```
run 1: npx vitest run --project client tests/diag/red.client.test.ts
 PASS |client| tests/diag/red.client.test.ts > X3f observed form: a push marks the root while the read is out > a double click opens and keeps the tab when the root is marked during the read
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  4 passed (4)
run 2: npx vitest run --project client tests/diag/red.client.test.ts
 PASS |client| tests/diag/red.client.test.ts > X3f observed form: a push marks the root while the read is out > a double click opens and keeps the tab when the root is marked during the read
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  4 passed (4)
run 3: npx vitest run --project client tests/diag/red.client.test.ts
 PASS |client| tests/diag/red.client.test.ts > X3f observed form: a push marks the root while the read is out > a double click opens and keeps the tab when the root is marked during the read
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  4 passed (4)
```

The lines of the red command's run with the fix (`--reporter=verbose`):

```
press 2: down=row up=row click=row focus=row
tabs=[files:-, source:icons.yml, source:README.md] active=source:icons.yml layer=false actions=active focus=editor
read answered while the second press is down: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor
press 2: down=row up=editor click=div[body] focus=editor
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor
press 2: down=row up=row click=row focus=row
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor editor input focused=true
press 2: down=layer up=layer click=editor focus=editor
preview: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
walked preview: tabs=[files:-, source:icons.yml(preview), source:agents.yml, source:README.md] active=source:icons.yml layer=true actions=active focus=row
```

The shrunk case with the fix, with the real Files view put back (`DIAG_SOURCE=fake DIAG_STRIP=no`): `Tests  4 passed (4)`. The original, unshrunk case is the red command itself, quoted above. The sweeps of "No red command" with the fix (`npx vitest run --project client tests/diag/focus.client.test.ts tests/diag/files-real.client.test.ts`): `Tests  64 passed (64)`.

The project's gates on the copy with the fix, the folder `tests/diag` moved out first: `npm run test:quick -- --base 6c3781d10` printed `ok` for svelte-kit sync, prettier, the ASCII gate, vitest, eslint and svelte-check and `every command passed` (it took 66.2 s against its 45 s limit on that run, 22.8 s and 45.0 s on the two runs before it with the same fix and comments); `npx vitest run` of `tests/checks/source/comment-width.test.ts`, `history.test.ts`, `tests/checks/tree/boundaries.test.ts`, `size.test.ts`, `duplication.test.ts`, `tests/checks/imports/order.test.ts` and `cycles.test.ts` printed `Tests  64 passed (64)`; `sh utils/folder-check.sh` exited 0; `sh utils/unused-exports.sh` printed the same 381 lines with and without the fix (`diff` printed nothing).

What the fix leaves to the look on TEST, not verified here: Chrome's own order of a mousedown on the row with `detail === 2` (jsdom has no native double-click counting; the harness sets `detail`), and that the release of that press, which now lands in the kept tab's editor (`press 2: down=row up=editor`), selects nothing there.

No test reaches it: the defect sits in the browser's event targeting (which element the release and the dblclick reach once the layer is drawn under the pointer). A test under the project's rules runs in the client runtime with no DOM (`agents/spec.md:65`: "every other behaviour that needs a DOM stays with the look"), and the red command above needs jsdom, which is no dependency of oculus (`agents/spec.md:55`: a new dependency is a report). No test is written: the failure costs nothing under the project's test rule. `agents/spec.md:57` allows a test only as the test of an entry of `agents/guarded.md`, and a step that needs a new entry asks Axel; `agents/guarded.md:3` says "Views have no entry: the look on TEST covers them", and no entry names `TreeItem.svelte`, `FileRow.svelte`, `opening.ts` or `PaneBody.svelte` (`grep -n -i "armed\|keep\|preview\|focus" agents/guarded.md` matched none of them). The red command, given whole in the appendix, is the round's check.

## Cleanup

Under the third diagnosis: one scratch copy served the three.

# Diagnosis: after a double click the keyboard is not in the editor

## Symptom

From the task of this diagnosis, X3f's look on TEST: "After a double click the keyboard is not in the editor". On the kept agents.yml tab, `document.activeElement` is BODY and there is no `.monaco-editor.focused`. The task asks that D37's cause (`agents/reviews/D37-diagnosis.md`: the keep's redraw remakes the editor's model, and a focus given before it is dropped) be checked by probe.

## Where the probes run

The same scratch copy as the first diagnosis of this record: `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree`, at `6c3781d10` with `X3f-backed-out.patch` applied, `npm ci`, jsdom installed with `--no-save`, the harness in `tests/diag/` (appendix). The paths redirected under `$TMPDIR`: none. The step's worktree printed the `git status --short` and the `shasum` quoted under the first diagnosis (`0a9b2cb164f312fd74fc75032d73def626b54019  -`).

## Red command

```
cd /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree/tools/oculus && npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
```

The command mounts the real `PaneView` and `PaneBody` (the keep layer and `KEEP_WINDOW_MS`), the real Files view (`RootedTree`, `Tree`, `FileRow`, `TreeItem`, the opener of `rooted-tree.svelte.ts` and `openRow`), the real `Source.svelte` with a Monaco stand-in (`fake-kit.ts`, whose `setModel` removes and rebuilds `.monaco-editor > .native-edit-context` as Monaco removes its view), and the real client state with `fs.readFileKind`, under jsdom in vitest's `client` project. One pane holds the Files tab and a kept README.md tab, as on TEST. `fetch` is stubbed, and a read of `/api/file/...` waits on a gate the test opens, which sets when the kind read answers. A press is dispatched in Chrome's order (pointerdown, mousedown, focus of the pressed treeitem, pointerup, mouseup, click, and dblclick on the second press), each event to the element the CSS puts under the pointer at that moment: the keep layer while it is drawn, else the row while the Files tab is shown, else the shown tab's editor input. A click whose mousedown and mouseup targets differ goes to their common ancestor. Each test prints the pane's tabs (`(preview)` marks a preview tab), the active tab, whether the layer is drawn, whether the strip draws the active tab's actions (`actions=active` or `none`) and where the focus is.

The test of this symptom is `symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard`. Both presses go down and up on the agents.yml row (the first double click after a reload, when no kind is held yet) and the gate opens only after the dblclick; the test then waits up to 2 s for the kept tab's editor input to hold the focus, and asserts that the tab is kept and its editor input has the focus.

Runs on the tree without the fix, with the output of each quoted (the result line of this test in each run, and the lines the test printed in run 1):

```
run 1: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
press 2: down=row up=row click=row focus=row
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=row editor input focused=false
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)

run 2: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)

run 3: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)
```

Red in 3 of 3 runs. `layer=false ... focus=row editor input focused=false`: the tab is kept, by `openRow` with `preview: false`, and the focus is still on the treeitem of the Files view, which is now hidden. Chrome takes the focus off an element that is hidden, and `document.activeElement` is then BODY, the form seen on TEST; that last step is Chrome's and is not reproduced by jsdom. With the stand-in row of the shrunk case, which takes no focus, the test's failure line reads `tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=BODY editor input focused=false` (the `DIAG_FILES=fake` run, quoted under "Shrunk case").

## No red command

not applicable

## Shrunk case

The same cuts as the first diagnosis, each run alone on the tree without the fix (the lines of this test):

```
== DIAG_STRIP=no
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=editor
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)
== DIAG_FILES=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
   -> tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=BODY editor input focused=false: expected 'tabs=[files:-, source:agents.yml, sou...' to contain 'editor input focused=true'
      Tests  3 failed | 1 passed (4)
== DIAG_README=no
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
```

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The strip press (`DIAG_STRIP=no`) | red: `layer=false actions=active focus=row editor input focused=false` | cut |
| The real `Source.svelte`, for the real `Editor.svelte` over the Monaco stand-in (`DIAG_SOURCE=editor`) | red: the same | cut |
| The real `Source.svelte`, for a stand-in holding an editor input (`DIAG_SOURCE=fake`) | red: the same | cut |
| The real Files view, for the stand-in row (`DIAG_FILES=fake`) | red: `focus=BODY editor input focused=false` | cut for the red; put back for the fix runs, since the fix passes through `FileRow`, `Tree` and the opener of `rooted-tree.svelte.ts`, which the stand-in replaces |
| The kept README.md tab (`DIAG_README=no`) | the layout splits: `not one pane: ...` | put back |

The shrunk case, as it stands: the real `PaneView` and `PaneBody`, the real `openRow` over the gated `fs.readFileKind`, a file row that calls `openRow` on click and on dblclick, a source stand-in with an editor input, one pane holding the Files tab and a kept tab, and both presses ending before the read answers. No editor is remade in it (the stand-in has no model), and it stays red. The shrunk run, on the tree without the fix:

```
DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
      Tests  3 failed | 1 passed (4)
```

## Hypotheses

1. If, when both presses reach the row before the kind is read, the tab is kept by `openRow` (`opener.keepPreview`, and `openOpened` keeping the preview it finds) and not by the layer, so the layer is never drawn and `focusKept` in `PaneBody.svelte` never runs, then giving the kept tab's editor input the focus from `openRow`'s keep branch turns the red command green. Falsified by: the red command still red with that change.
2. If (D37's cause) the keep's redraw remakes the editor's model, `setModel(null)` removing the editor's view and with it the input `focusKept` focused, then the focus is lost on the layer path too, and the test of the layer path with the real `Editor.svelte` over the Monaco stand-in ends with the focus off the editor. Falsified by: that test ending with the focus in the new editor input although the editor was remade.
3. If Chrome's default focus for the layer's press runs after `focusKept` and moves the focus to BODY, then the layer path loses the focus in Chrome only. Falsified by: `document.activeElement` in the kept tab's editor after a layer-path double click in Chrome.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | probe 2 below | `PASS ... symptom 2`, `Tests  2 failed | 2 passed (4)` (symptoms 1 and 3 stay red) | still standing |
| 2 | none: the test `the kept tab holds the focus in its editor input (read 5 ms, gap 150 ms)` of `tests/diag/focus.client.test.ts`, the layer path with the real `Editor.svelte` over the Monaco stand-in | `press 2: down=layer up=layer click=editor focus=editor`, `focus=editor editor element replaced=true before connected=false models made 1->2, removed 0->1`, `PASS` | falsified in the harness: the editor is remade as D37 found, and `focusKept`'s wait for `tick()` already lands the focus in the new input |
| 3 | not probed: it needs Chrome, which this diagnosis may not open | none | not tested |

Probe 2, made on the tree without the fix and undone after its run (`git diff --stat -- tools/oculus/src` printed nothing after the undo):

```
diff --git a/tools/oculus/src/lib/views/shared/explorer/opening.ts b/tools/oculus/src/lib/views/shared/explorer/opening.ts
index 39b9472f0..6f30d95c4 100644
--- a/tools/oculus/src/lib/views/shared/explorer/opening.ts
+++ b/tools/oculus/src/lib/views/shared/explorer/opening.ts
@@ -74,7 +74,18 @@ export async function openRow(
     const type = await opener.readFileKind(row.root, row.path);
     const tab = tabForKind(type.kind, row.root, row.path, row.size);
     const id = opener.openView(tab.view, tab.state, undefined, { preview });
-    if (!preview) opener.keepPreview(id);
+    if (!preview) {
+        opener.keepPreview(id);
+        const until = performance.now() + 2000;
+        const give = (): void => {
+            const input = document.querySelector<HTMLElement>(
+                `[data-tab-view="${id}"] .monaco-editor .native-edit-context`
+            );
+            if (input !== null) input.focus();
+            else if (performance.now() < until) setTimeout(give, 10);
+        };
+        queueMicrotask(give);
+    }
     else if (pressedAt !== undefined) opener.armKeep?.(id, pressedAt);
 }
```

```
npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 PASS |client| tests/diag/red.client.test.ts > X3f observed form: a push marks the root while the read is out > a double click opens and keeps the tab when the root is marked during the read
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  2 failed | 2 passed (4)
```

The run of hypothesis 2, on the tree without the fix:

```
npx vitest run --project client tests/diag/focus.client.test.ts -t "keyboard after" --reporter=verbose
press 2: down=layer up=layer click=editor focus=editor
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor editor element replaced=true before connected=false models made 1->2, removed 0->1
 PASS |client| tests/diag/focus.client.test.ts > X3f symptom 2, the keyboard after a double click (real Editor, Monaco stand-in) > the kept tab holds the focus in its editor input (read 5 ms, gap 150 ms)
press 2: down=row up=row click=row focus=row
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=row editor element replaced=true before connected=undefined models made 2->3, removed 2->2
 FAIL |client| tests/diag/focus.client.test.ts > X3f symptom 2, the keyboard after a double click (real Editor, Monaco stand-in) > the kept tab holds the focus in its editor input (read 300 ms, gap 150 ms)
      Tests  1 failed | 1 passed | 30 skipped (32)
```

The second case of that run is hypothesis 1 again with the real editor: a read of 300 ms puts both presses on the row, and the focus stays on the row.

## Cause

Hypothesis 1. When the file's kind is not held (the first file opened after a reload, as agents.yml was on TEST) and both presses of the double click reach the row before it is read, the tab is opened and kept by `openRow` (`opening.ts`: `if (!preview) opener.keepPreview(id);`), and nothing gives it the keyboard: only `layerPressed` in `PaneBody.svelte` calls `focusKept`, and the layer is never drawn on this path. The focus stays on the treeitem of the hidden Files view, which Chrome turns into BODY. Probe 2 turns the red command's test green, and it is red without it (the runs above).

D37's mechanism happens (the editor is remade by the keep's redraw), but in the harness it does not lose the focus on the layer path, so it is not this symptom's cause here. Whether Chrome loses the layer path's focus some other way (hypothesis 3) is not verified; the check is a layer-path double click on TEST (a file whose kind is held, so the first click opens the preview at once) with `document.activeElement` read after it.

## Fix and test

Test, run on the tree without the fix: the red command's test `symptom 2`, quoted under "Red command" above (red in 3 of 3 runs).

Fix: the keep and the keyboard are one request. The armed-keep store holds the kept tab that asked for the keyboard (`askFocus`, `focusAsked`, `focusGiven`); the layer's press asks for it, and so does `openRow` when a pointer press (one that passes `pressedAt`) keeps a tab, through the opener of `rooted-tree.svelte.ts`. `PaneBody` gives the keyboard to the asked tab once it is the pane's active tab and its view holds an editor input or a frame, watching the view until one is drawn, and ends the ask when another tab of the pane is shown. A key that opens a kept tab (`keyed.ts`, `open-background`, which keeps the focus in the tree) passes no `pressedAt` and asks nothing. `FileRow` and `Tree` pass the press's time; that part is in the first diagnosis's diff.

```
diff --git a/tools/oculus/src/lib/shell/panes/PaneBody.svelte b/tools/oculus/src/lib/shell/panes/PaneBody.svelte
index 5ccf927f9..6cf9cccc1 100644
--- a/tools/oculus/src/lib/shell/panes/PaneBody.svelte
+++ b/tools/oculus/src/lib/shell/panes/PaneBody.svelte
@@ -16,8 +16,10 @@
     // (state/workbench/layout/open/armed-keep.svelte.ts). In one pane the first press of a double
     // click has replaced the tree with the file, so the second press lands on the tab, in an editor
     // or a frame. The layer takes that press, keeps the tab and stops the press, so the editor
-    // selects no word and a frame gets no click, and once the kept tab is drawn the keyboard goes
-    // into its editor or frame, as a double click on a file of an editor's explorer puts it.
+    // selects no word and a frame gets no click. A tab a double click kept, on the layer or on the
+    // row when the file was read only after both presses, asks for the keyboard
+    // (`focusAsked`), and once the pane has drawn the tab's editor or frame the keyboard goes
+    // there, as a double click on a file of an editor's explorer puts it.
     // The layer stays up until the pointer is released, so the release and the click land on it
     // too. The keep ends when the double-click time (`KEEP_WINDOW_MS`) runs out, at any press
     // outside the layer, at any key, and when another tab of the pane is the active one.
@@ -39,7 +41,17 @@
     import { useState } from '$lib/state/client/use';
 
     const {
-        layout: { armedKeep, currentPage, disarmKeep, floats, keepPreview, pages },
+        layout: {
+            armedKeep,
+            askFocus,
+            currentPage,
+            disarmKeep,
+            floats,
+            focusAsked,
+            focusGiven,
+            keepPreview,
+            pages
+        },
         drag: { dragging, hover },
         registry: { viewFor }
     } = useState();
@@ -135,21 +147,16 @@
     });
 
     /**
-     * Put the keyboard in what the kept tab shows: the input of its code editor (the edit context
+     * What takes the keyboard in a tab's view: the input of its code editor (the edit context
      * element Monaco uses where the browser has EditContext, else its input textarea), else its
-     * frame.
-     * It waits for the keep's redraw, since the redraw remakes an editor's model and a focus given
-     * before it is dropped.
+     * frame; null while the view has drawn neither.
      */
-    async function focusKept(id: string): Promise<void> {
-        await tick();
-        const view = body?.querySelector<HTMLElement>(`[data-tab-view=${JSON.stringify(id)}]`);
-        if (view === null || view === undefined || view.hidden) return;
-        const input =
+    function inputOf(view: HTMLElement): HTMLElement | null {
+        return (
             view.querySelector<HTMLElement>('.monaco-editor .native-edit-context') ??
             view.querySelector<HTMLElement>('.monaco-editor textarea.inputarea') ??
-            view.querySelector<HTMLElement>('iframe');
-        input?.focus();
+            view.querySelector<HTMLElement>('iframe')
+        );
     }
 
     /**
@@ -167,9 +174,46 @@
         keepPreview(id);
         disarmKeep();
         pressing = true;
-        void focusKept(id);
+        askFocus(id);
     }
 
+    // A tab a double click kept takes the keyboard once this pane shows it, whether the second
+    // press landed on the layer or both presses reached the row before the file was read. It
+    // waits for the keep's redraw, which remakes an editor's model, and for a view that mounts
+    // with the keep, whose editor is built after the editor has loaded: until the view holds an
+    // input, every change inside it is a new try, and the ask ends once one is focused or when
+    // another tab of the pane is shown.
+    $effect(() => {
+        const asked = focusAsked();
+        if (asked === null || !instances.some((one) => one.id === asked)) return;
+        if (asked !== active) {
+            untrack(() => focusGiven(asked));
+            return;
+        }
+        let watch: MutationObserver | undefined;
+        let ended = false;
+        const give = (view: HTMLElement): boolean => {
+            const input = inputOf(view);
+            if (input === null) return false;
+            input.focus();
+            watch?.disconnect();
+            focusGiven(asked);
+            return true;
+        };
+        void tick().then(() => {
+            const view = body?.querySelector<HTMLElement>(
+                `[data-tab-view=${JSON.stringify(asked)}]`
+            );
+            if (ended || view === null || view === undefined || view.hidden || give(view)) return;
+            watch = new MutationObserver(() => give(view));
+            watch.observe(view, { childList: true, subtree: true });
+        });
+        return () => {
+            ended = true;
+            watch?.disconnect();
+        };
+    });
+
     /** The pointer over the body: an edge of it, or its middle, which is the end of the strip. */
     function bodyHover(event: PointerEvent): void {
         const carried = dragging();
diff --git a/tools/oculus/src/lib/state/workbench/layout.svelte.ts b/tools/oculus/src/lib/state/workbench/layout.svelte.ts
index d39bc1eef..da799bf54 100644
--- a/tools/oculus/src/lib/state/workbench/layout.svelte.ts
+++ b/tools/oculus/src/lib/state/workbench/layout.svelte.ts
@@ -222,6 +222,15 @@ export type LayoutStore = Omit<Instances, 'forgetTabs'> & {
     armKeep: (id: string, owner: string, pressedAt: number) => void;
     /** End the armed keep, or only one an owner armed. */
     disarmKeep: (owner?: string) => void;
+    /**
+     * The kept tab that takes the keyboard once its pane draws it
+     * (layout/open/armed-keep.svelte.ts).
+     */
+    focusAsked: () => string | null;
+    /** Ask that a tab a double click kept take the keyboard. */
+    askFocus: (id: string) => void;
+    /** End the ask for one tab: its pane gave it the keyboard. */
+    focusGiven: (id: string) => void;
 };
 
 export function createLayout(ui: UiStore): LayoutStore {
@@ -827,6 +836,9 @@ export function createLayout(ui: UiStore): LayoutStore {
         armedKeep: keeps.armed,
         armKeep: keeps.arm,
         disarmKeep: keeps.disarm,
+        focusAsked: keeps.focusAsked,
+        askFocus: keeps.askFocus,
+        focusGiven: keeps.focusGiven,
         registerOpened: (rule) => {
             openedRule = rule;
         },
diff --git a/tools/oculus/src/lib/state/workbench/layout/open/armed-keep.svelte.ts b/tools/oculus/src/lib/state/workbench/layout/open/armed-keep.svelte.ts
index 8748a2bdd..07f019305 100644
--- a/tools/oculus/src/lib/state/workbench/layout/open/armed-keep.svelte.ts
+++ b/tools/oculus/src/lib/state/workbench/layout/open/armed-keep.svelte.ts
@@ -13,6 +13,11 @@
 // ends at the first of: the press that uses it, the end of the window, `disarm` (called for any
 // press elsewhere, any key, the tab leaving the pane's front and the owner closing), and a new
 // arm.
+//
+// The store also holds the kept tab that asked for the keyboard: a tab a double click kept, either
+// by the press on the layer or, when the file was read only after both presses reached the row,
+// by the row. The pane showing that tab puts the keyboard in its editor or frame once it has drawn
+// one, and the ask ends then, at a newer ask, or when the pane shows another tab.
 
 import type { Instance } from '../model.ts';
 import { isPreview } from './preview.ts';
@@ -37,6 +42,12 @@ export type ArmedKeeps = {
     arm: (id: string, owner: string, pressedAt: number) => void;
     /** End the keep; with an owner, only a keep that owner armed. */
     disarm: (owner?: string) => void;
+    /** The kept tab that takes the keyboard once its pane draws it, or null. */
+    focusAsked: () => string | null;
+    /** Ask that the kept tab `id` take the keyboard; a newer ask replaces it. */
+    askFocus: (id: string) => void;
+    /** The pane gave the keyboard to `id`, or the ask is dropped: it ends the ask for `id`. */
+    focusGiven: (id: string) => void;
 };
 
 /** The armed keeps of one layout, `find` answering the instance with an id. */
@@ -46,6 +57,7 @@ export function createArmedKeeps(
 ): ArmedKeeps {
     let held = $state.raw<ArmedKeep | null>(null);
     let timer: ReturnType<typeof setTimeout> | undefined;
+    let asked = $state.raw<string | null>(null);
 
     function disarm(owner?: string): void {
         if (owner !== undefined && held?.owner !== owner) return;
@@ -63,5 +75,16 @@ export function createArmedKeeps(
         timer = setTimeout(() => disarm(), left);
     }
 
-    return { armed: () => held, arm, disarm };
+    return {
+        armed: () => held,
+        arm,
+        disarm,
+        focusAsked: () => asked,
+        askFocus: (id) => {
+            asked = id;
+        },
+        focusGiven: (id) => {
+            if (asked === id) asked = null;
+        }
+    };
 }
diff --git a/tools/oculus/src/lib/views/shared/explorer/opening.ts b/tools/oculus/src/lib/views/shared/explorer/opening.ts
index 39b9472f0..833630197 100644
--- a/tools/oculus/src/lib/views/shared/explorer/opening.ts
+++ b/tools/oculus/src/lib/views/shared/explorer/opening.ts
@@ -33,6 +33,8 @@ export type Opener = {
      * click, and the second click of a double click lands on the tab, not on the row.
      */
     armKeep?: (id: string, pressedAt: number) => void;
+    /** Give the keyboard to a tab a pointer press kept, once its pane draws it. */
+    askFocus?: (id: string) => void;
 };
 
 /** The store calls opening a file beside the pane being read needs. */
@@ -62,8 +64,10 @@ export function tabForKind(
 /**
  * Open one file as its own tab, in the view that can show it. A single click opens the pane's
  * preview tab and a double click keeps the tab it opened. A press passes the time it was made at
- * (`pressedAt`, in the timeline of `performance.now()`), and the preview tab it opens then keeps
- * the next press on the tab for as long as a double click's second press can take.
+ * (`pressedAt`, in the timeline of `performance.now()`): the preview tab a single press opens then
+ * keeps the next press on the tab for as long as a double click's second press can take, and the
+ * tab a double click keeps takes the keyboard. A key that opens a kept tab passes no time, and the
+ * keyboard stays where it is.
  */
 export async function openRow(
     opener: Opener,
@@ -74,8 +78,10 @@ export async function openRow(
     const type = await opener.readFileKind(row.root, row.path);
     const tab = tabForKind(type.kind, row.root, row.path, row.size);
     const id = opener.openView(tab.view, tab.state, undefined, { preview });
-    if (!preview) opener.keepPreview(id);
-    else if (pressedAt !== undefined) opener.armKeep?.(id, pressedAt);
+    if (!preview) {
+        opener.keepPreview(id);
+        if (pressedAt !== undefined) opener.askFocus?.(id);
+    } else if (pressedAt !== undefined) opener.armKeep?.(id, pressedAt);
 }
 
 /** Open one file in the view that can show it, in a new pane beside the one being read. */
diff --git a/tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts b/tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts
index c4ec55ba0..3684b8450 100644
--- a/tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts
+++ b/tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts
@@ -71,7 +71,7 @@ export function createRootedTree(client: ClientState, input: RootedInput) {
     const {
         explorer,
         fs: { bookmarks, entries, heldEntries, listing, readFileKind },
-        layout: { armKeep, disarmKeep, keepPreview, openView, showInFiles },
+        layout: { armKeep, askFocus, disarmKeep, keepPreview, openView, showInFiles },
         selectors: { configMap, gitFor, gitRoots },
         ui: { instanceState }
     } = client;
@@ -95,6 +95,9 @@ export function createRootedTree(client: ClientState, input: RootedInput) {
         showInFiles,
         armKeep: (id: string, pressedAt: number) => {
             if (!closed) armKeep(id, input.owner(), pressedAt);
+        },
+        askFocus: (id: string) => {
+            if (!closed) askFocus(id);
         }
     };
```

Runs after the fix: the three runs quoted under the first diagnosis's "Fix and test" (`PASS ... symptom 2` in each, `Tests  4 passed (4)`), and the verbose line:

```
tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor editor input focused=true
```

The shrunk case with the real Files view put back (`DIAG_SOURCE=fake DIAG_STRIP=no`): `Tests  4 passed (4)`. The test of hypothesis 2 with the fix: both cases `PASS` (`Tests  2 passed | 30 skipped (32)`), the 300 ms case ending `focus=editor editor element replaced=true before connected=undefined models made 2->3, removed 2->2`. The project's gates are quoted under the first diagnosis.

No test reaches it: the focus is a DOM behaviour, which `agents/spec.md:65` leaves to the look, and the red command needs jsdom, no dependency of oculus. No test is written: the failure costs nothing under the project's test rule (`agents/spec.md:57`, `agents/guarded.md:3`, no entry for the armed keep, `openRow` or `PaneBody`). The store's ask (`askFocus`, `focusAsked`, `focusGiven`) is client state that a `*.client.test.ts` could test with no DOM, under a new entry of `agents/guarded.md`, which needs Axel's yes. The red command is the round's check.

## Cleanup

Under the third diagnosis.

# Diagnosis: a file tab loses its strip actions when it is kept or walked

## Symptom

From the task of this diagnosis, X3f's look on TEST: "The strip's file actions are missing on some file tabs". glyphs.yml and icons.yml drew Save, Revert, the star and Blame; agents.yml (kept) and behavior.yml (preview) drew none.

## Where the probes run

The same scratch copy as the first diagnosis of this record: `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree`, at `6c3781d10` with `X3f-backed-out.patch` applied, `npm ci`, jsdom installed with `--no-save`, the harness in `tests/diag/` (appendix). The paths redirected under `$TMPDIR`: none. The step's worktree printed the `git status --short` and the `shasum` quoted under the first diagnosis (`0a9b2cb164f312fd74fc75032d73def626b54019  -`).

## Red command

```
cd /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree/tools/oculus && npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
```

The command mounts the real `PaneView` and `PaneBody` (the keep layer and `KEEP_WINDOW_MS`), the real Files view (`RootedTree`, `Tree`, `FileRow`, `TreeItem`, the opener of `rooted-tree.svelte.ts` and `openRow`), the real `Source.svelte` with a Monaco stand-in (`fake-kit.ts`, whose `setModel` removes and rebuilds `.monaco-editor > .native-edit-context` as Monaco removes its view), and the real client state with `fs.readFileKind`, under jsdom in vitest's `client` project. One pane holds the Files tab and a kept README.md tab, as on TEST. `fetch` is stubbed, and a read of `/api/file/...` waits on a gate the test opens, which sets when the kind read answers. A press is dispatched in Chrome's order (pointerdown, mousedown, focus of the pressed treeitem, pointerup, mouseup, click, and dblclick on the second press), each event to the element the CSS puts under the pointer at that moment: the keep layer while it is drawn, else the row while the Files tab is shown, else the shown tab's editor input. A click whose mousedown and mouseup targets differ goes to their common ancestor. Each test prints the pane's tabs (`(preview)` marks a preview tab), the active tab, whether the layer is drawn, whether the strip draws the active tab's actions (`actions=active` or `none`) and where the focus is.

The test of this symptom is `symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on`. It opens agents.yml as a preview, keeps it by a double click (the layer path), opens behavior.yml as a new preview, then walks that preview to icons.yml with a single click; after each it reads whether the strip draws the active tab's actions.

Runs on the tree without the fix, with the output of each quoted (the result line of this test in each run, and the lines the test printed in run 1):

```
run 1: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
press 2: down=layer up=layer click=editor focus=editor
preview: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
walked preview: tabs=[files:-, source:icons.yml(preview), source:agents.yml, source:README.md] active=source:icons.yml layer=true actions=none focus=row
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)

run 2: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)

run 3: npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)
```

Red in 3 of 3 runs. A preview just opened draws its actions (`preview: ... actions=active`, `new preview: ... actions=active`); the tab once kept draws none (`kept: ... actions=none`), and the preview once walked to another file draws none (`walked preview: ... actions=none`). On TEST: agents.yml was kept, behavior.yml was a preview walked to from another file, and glyphs.yml and icons.yml were tabs as first opened.

## No red command

not applicable

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The strip press (`DIAG_STRIP=no`) | red: `kept: ... actions=none` | cut |
| The real `Source.svelte`, for the real `Editor.svelte` over the Monaco stand-in (`DIAG_SOURCE=editor`) | red: the same | cut |
| The real `Source.svelte`, for a stand-in that only calls `handUp` as `Source.svelte:304` does and holds an editor input (`DIAG_SOURCE=fake`) | red: the same | cut |
| The real Files view, for the stand-in row (`DIAG_FILES=fake`) | red: the same | cut |
| The kept README.md tab (`DIAG_README=no`) | the layout splits (`no Files tab face`) | put back |

The runs of each cut alone, on the tree without the fix:

```
== DIAG_STRIP=no
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=editor
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)
== DIAG_SOURCE=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)
== DIAG_FILES=fake
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  3 failed | 1 passed (4)
== DIAG_README=no
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
```

The shrunk case, as it stands: the real `PaneView` (which provides the tab actions and passes `tabActions.of(active)` to the strip), a stand-in view that calls `handUp(useTabActions(), () => instance.id, actions)`, one pane holding the Files tab and a kept tab, and a keep or a walk of a preview tab. The shrunk run (`DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no`), on the tree without the fix:

```
DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
walked preview: tabs=[files:-, source:icons.yml(preview), source:agents.yml, source:README.md] active=source:icons.yml layer=true actions=none focus=editor
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
      Tests  3 failed | 1 passed (4)
```

## Hypotheses

1. If keeping a preview tab (`kept` of `preview.ts`) or walking it (`retarget`) gives the view a copy of its instance under the same id, so that `handUp`'s effect, whose `id` getter reads `instance.id`, runs again, its cleanup takes the actions back and its body hands nothing up, then handing the actions up in the effect's body turns the red command green. Falsified by: no second run of the effect at a keep or a walk, or the red command still red with that change.
2. If the keep or the walk remounts the view, and the old view's teardown clears the snippet the new view handed up, then the log shows a second `handUp` start for the tab. Falsified by: one start per tab in the log.
3. If the strip reads a stale map (`tabActions.of(active)` not following a `set`), then handing the actions up again changes nothing. Falsified by: the red command green when the effect hands them up again.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1, 2 | probe 3a below: logging tagged `DIAG-5c1e` at `handUp`'s start, its effect and its cleanup | one `handUp init` per tab; at the keep and at the walk `effect run <same id>` after `clear <same id>`, and nothing handed up | 2 falsified; 1 still standing |
| 1, 3 | probe 3b below: hand the actions up in the effect's body | `PASS ... symptom 3`, `Tests  2 failed | 2 passed (4)` (symptoms 1 and 2 stay red) | 3 falsified; 1 still standing |

Probe 3a, made on the tree without the fix and undone after its run (`git diff --stat -- tools/oculus/src` printed nothing after the undo):

```
diff --git a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
index 58319a8e5..5153b83f1 100644
--- a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
+++ b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
@@ -62,8 +62,13 @@ export function useTabActions(): TabActions | undefined {
  */
 export function handUp(handed: TabActions | undefined, id: () => string, actions: Snippet): void {
     untrack(() => handed?.set(id(), actions));
+    console.log(`DIAG-5c1e handUp init ${untrack(id)}`);
     $effect(() => {
         const mine = id();
-        return () => handed?.clear(mine, actions);
+        console.log(`DIAG-5c1e handUp effect run ${mine}`);
+        return () => {
+            console.log(`DIAG-5c1e handUp clear ${mine}`);
+            handed?.clear(mine, actions);
+        };
     });
 }
```

```
npx vitest run --project client tests/diag/red.client.test.ts -t "symptom 3" --reporter=verbose
DIAG-5c1e handUp init 1e6989a1-68e4-41f4-afd9-338e62e0694a
DIAG-5c1e handUp effect run 1e6989a1-68e4-41f4-afd9-338e62e0694a
DIAG-5c1e handUp clear 1e6989a1-68e4-41f4-afd9-338e62e0694a
DIAG-5c1e handUp effect run 1e6989a1-68e4-41f4-afd9-338e62e0694a
DIAG-5c1e handUp init 853e3fb1-c9c5-4a5d-935e-72363d858be7
DIAG-5c1e handUp effect run 853e3fb1-c9c5-4a5d-935e-72363d858be7
DIAG-5c1e handUp clear 853e3fb1-c9c5-4a5d-935e-72363d858be7
DIAG-5c1e handUp effect run 853e3fb1-c9c5-4a5d-935e-72363d858be7
preview: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
walked preview: tabs=[files:-, source:icons.yml(preview), source:agents.yml, source:README.md] active=source:icons.yml layer=true actions=none focus=row
DIAG-5c1e handUp clear 853e3fb1-c9c5-4a5d-935e-72363d858be7
DIAG-5c1e handUp clear 1e6989a1-68e4-41f4-afd9-338e62e0694a
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=none focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
      Tests  1 failed | 3 skipped (4)
```

The first id is agents.yml's tab: its effect runs again at the keep, after its cleanup. The second is behavior.yml's preview: its effect runs again at the walk to icons.yml, after its cleanup. The view is not mounted again (no second `init`).

Probe 3b, made on the tree without the fix and undone after its run:

```
diff --git a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
index 58319a8e5..72441afc9 100644
--- a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
+++ b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
@@ -64,6 +64,7 @@ export function handUp(handed: TabActions | undefined, id: () => string, actions
     untrack(() => handed?.set(id(), actions));
     $effect(() => {
         const mine = id();
+        untrack(() => handed?.set(mine, actions));
         return () => handed?.clear(mine, actions);
     });
 }
```

```
npx vitest run --project client tests/diag/red.client.test.ts --reporter=verbose
 PASS |client| tests/diag/red.client.test.ts > X3f observed form: a push marks the root while the read is out > a double click opens and keeps the tab when the root is marked during the read
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 1: the first read answers while the second press is down; the double click keeps the tab
 FAIL |client| tests/diag/red.client.test.ts > X3f red > symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard
 PASS |client| tests/diag/red.client.test.ts > X3f red > symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on
      Tests  2 failed | 2 passed (4)
```

## Cause

Hypothesis 1. `handUp` in `src/lib/ui/tabs/tab-actions.svelte.ts` hands the actions up once, at the component's start, and its effect only takes them back:

```
    untrack(() => handed?.set(id(), actions));
    $effect(() => {
        const mine = id();
        return () => handed?.clear(mine, actions);
    });
```

Keeping a preview tab and walking it to another file the same view shows replace the tab's instance with a copy under the same id. `Source.svelte:304` passes `() => instance.id`, which reads the instance, so the effect runs again: the cleanup clears the snippet, which is still the one handed up, and the body hands nothing up. `FileTab.svelte:35` calls `handUp` with `() => id`, its `id` prop, and the fix in `handUp` covers it too; that tab's run was not probed. Probe 3a shows the effect running again after its cleanup with the same id; probe 3b turns the red command's test green, and it is red without it.

## Fix and test

Test, run on the tree without the fix: the red command's test `symptom 3`, quoted under "Red command" above (red in 3 of 3 runs).

Fix (the effect hands up what its cleanup takes back; the head comment said a walk always changes the view, which is false for a walk the same view shows, and is rewritten):

```
diff --git a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
index 58319a8e5..9f9b5e492 100644
--- a/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
+++ b/tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts
@@ -7,9 +7,12 @@
 // A pane provides one of these to the views it holds. A view drawn where no pane provides one (a
 // case that renders the view alone) hands its actions to nobody.
 //
-// A preview tab walked from one file to another keeps its instance id and changes its view, so the
-// view that takes the tab's place can hand up its actions before the view it replaces is torn
-// down. A view therefore takes back only the snippet it handed up: `clear` leaves a newer one.
+// A preview tab walked from one file to another keeps its instance id. When the walk changes its
+// view, the view that takes the tab's place can hand up its actions before the view it replaces is
+// torn down, so a view takes back only the snippet it handed up: `clear` leaves a newer one. When
+// the walk keeps its view, and when the tab is kept, the view stays mounted and its instance is
+// replaced by a copy under the same id, which runs `handUp`'s effect again: the effect hands the
+// actions up again after its cleanup took them back.
 
 import { getContext, setContext, untrack, type Snippet } from 'svelte';
 
@@ -57,13 +60,17 @@ export function useTabActions(): TabActions | undefined {
 
 /**
  * Hand a view's actions up to the pane while the view is mounted. They are handed over as the
- * component starts, since a render on the server runs no effect, and taken back by the cleanup.
- * Called while a component is initialised, with what `useTabActions()` answered.
+ * component starts, since a render on the server runs no effect, and again by the effect each
+ * time it runs: `id` reads the tab's instance, which keeping a preview tab or walking it to
+ * another file replaces with a copy under the same id, so the effect runs again, and its cleanup
+ * has just taken the actions back. Called while a component is initialised, with what
+ * `useTabActions()` answered.
  */
 export function handUp(handed: TabActions | undefined, id: () => string, actions: Snippet): void {
     untrack(() => handed?.set(id(), actions));
     $effect(() => {
         const mine = id();
+        untrack(() => handed?.set(mine, actions));
         return () => handed?.clear(mine, actions);
     });
 }
```

Runs after the fix: the three runs quoted under the first diagnosis's "Fix and test" (`PASS ... symptom 3` in each, `Tests  4 passed (4)`), and the verbose lines:

```
preview: tabs=[files:-, source:agents.yml(preview), source:README.md] active=source:agents.yml layer=true actions=active focus=row
kept: tabs=[files:-, source:agents.yml, source:README.md] active=source:agents.yml layer=false actions=active focus=editor
new preview: tabs=[files:-, source:behavior.yml(preview), source:agents.yml, source:README.md] active=source:behavior.yml layer=true actions=active focus=row
walked preview: tabs=[files:-, source:icons.yml(preview), source:agents.yml, source:README.md] active=source:icons.yml layer=true actions=active focus=row
```

The shrunk case with the fix (`DIAG_FILES=fake DIAG_SOURCE=fake DIAG_STRIP=no ... -t "symptom 3"`): `Tests  1 passed | 3 skipped (4)`. The project's gates are quoted under the first diagnosis.

No test reaches it: not applicable; the defect is an effect's timing, which `agents/spec.md:65` puts in a `*.client.test.ts` with no DOM, and the shrunk case needs no DOM beyond the component. No test is written: the failure costs nothing under the project's test rule: `agents/spec.md:57` allows a test only as the test of an entry of `agents/guarded.md`, and no entry names `tab-actions.svelte.ts`; a new entry needs Axel's yes (`agents/guarded.md:3`). Under such an entry the test would mount a component calling `handUp` with an instance prop, replace the prop with a same-id copy, flush, and assert that the `TabActions` still holds the snippet; it is red on the tree without the fix by probe 3a's mechanism. The red command is the round's check.

## Cleanup

```
$ grep -rn --exclude-dir=node_modules -e DIAG-5c1e /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.R5Wx0U/tree  (run after tests/diag was removed; it printed nothing and exited 1)
```

The harness folder `tests/diag` was removed before the grep. The scratch copy was removed with `git worktree remove --force "$tmp/tree"` from the main checkout (exit 0; `git worktree list | grep -c diagnose` printed 0), and `$tmp`, which held the logs, the diffs, the backups of the probed files and the copies of `package.json` and `package-lock.json`, was removed (`ls -d "$tmp"`: No such file or directory). No credential or `.env` file was copied into `$TMPDIR`. The step's worktree was not touched. The red command run again on the original case: carried by the round as its check, from the appendix.

## Appendix: the red command's harness

The files of `tools/oculus/tests/diag/` the red command uses, as they stood when the runs above were made. To run it on a tree: copy them there, run `npm install --no-save jsdom@26.1.0` in `tools/oculus`, then the red command. `DIAG_FILES=fake`, `DIAG_SOURCE=fake` or `editor`, `DIAG_STRIP=no` and `DIAG_README=no` select the cuts of the shrunk case. The harness is a diagnosis tool, not a test of the project: it waits on fixed sleeps, its lines pass 100 columns and it carries the tag `DIAG-5c1e` in its logging, so it is not committed as it stands.

### `tests/diag/red.client.test.ts`

```ts
// @vitest-environment jsdom
// Scratch red command of the X3f diagnosis with the REAL Files view (RootedTree, Tree, FileRow,
// TreeItem, rooted-tree.svelte.ts's opener, the real readFileKind over a stubbed fetch), the real
// PaneView and PaneBody, and a source stand-in. Presses are dispatched in Chrome's order; hit
// testing follows the CSS (the keep layer covers the pane body; else the row while Files is shown,
// else the shown tab's editor).

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/ui/controls/editor/kit/load.ts', async (original) => ({
    ...(await original<object>()),
    loadEditor: async () => (await import('./fake-kit.ts')).fakeKit
}));
import { engineDir, glyphCatalog, loadConfig, textCatalog, vocabCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, t } from '../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../src/lib/state/shared/words/tones.ts';
import { setAppearance } from '../../src/lib/state/shared/words/appearance.ts';
import { emptyClient, type ClientState } from '../fixtures/client.ts';
import { STATE_KEY } from '../../src/lib/state/client/use.ts';
import { TIP_KEY, createTipIds } from '../../src/lib/ui/menu/tip-ids.ts';
import MonacoSource from './MonacoSource.svelte';
import FakeSource from './FakeSource.svelte';
import FakeFiles from './FakeFiles.svelte';
const cut = { files: process.env.DIAG_FILES === 'fake', source: process.env.DIAG_SOURCE ?? 'real', readme: process.env.DIAG_README !== 'no', strip: process.env.DIAG_STRIP !== 'no' };
import RealSource, { registration as sourceRegistration } from '../../src/lib/views/sources/source/Source.svelte';
export const real = { source: true };
import { fakeKit, made } from './fake-kit.ts';
import Harness from './Harness.svelte';
import Files, { registration as filesRegistration } from '../../src/lib/views/sources/files/Files.svelte';
import { sourceTabState } from '../../src/lib/state/sessions/source.svelte.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
setAppearance(config);

(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
};
// jsdom lays nothing out: every box is 800 by 600, so the virtual list draws its rows.
Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600, toJSON() {} } as DOMRect;
};
for (const key of ['offsetHeight', 'clientHeight']) Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => 600 });
for (const key of ['offsetWidth', 'clientWidth']) Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => 800 });
(globalThis as { matchMedia?: unknown }).matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
(Element.prototype as { scrollTo?: unknown }).scrollTo ??= function () {};
(Element.prototype as { scrollIntoView?: unknown }).scrollIntoView ??= function () {};

class FakePointerEvent extends MouseEvent {
    pointerId = 1;
    pointerType = 'mouse';
    isPrimary = true;
}

export const timing = { readDelay: 5, hold: 0, gap: 150 };
/** A read of a file's head waits on `held` while it is set; `open()` lets every waiting read answer. */
export const gate: { held: Promise<void> | null; open: () => void } = { held: null, open: () => undefined };
function closeGate(): void {
    gate.held = new Promise((done) => {
        gate.open = () => {
            gate.held = null;
            done();
        };
    });
}
/** Run between a press's down and its release. */
export const between: { run: (() => Promise<void>) | null } = { run: null };
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
async function flush(): Promise<void> {
    for (let i = 0; i < 5; i++) await Promise.resolve();
    flushSync();
}
function stamped<E extends Event>(event: E): E {
    Object.defineProperty(event, 'timeStamp', { value: performance.now() });
    return event;
}
const init = (detail: number) => ({ bubbles: true, cancelable: true, composed: true, button: 0, detail });
const paneBody = (): HTMLElement => document.querySelector('[data-pane-body]') as HTMLElement;

function rowButton(name: string): Element | null {
    const fake = document.querySelector(`[data-row="${name}"]`);
    if (fake !== null) return fake;
    for (const item of document.querySelectorAll('[role="treeitem"]')) {
        if (item.getAttribute('aria-label') === name) return item.querySelector('button.main .name') ?? item;
    }
    return null;
}

function hit(name: string): Element {
    const layer = paneBody().querySelector('[data-keep-layer]');
    if (layer !== null) return layer;
    const row = rowButton(name);
    if (row !== null && row.closest('[data-tab-view]')?.hasAttribute('hidden') === false) return row;
    return paneBody().querySelector('[data-tab-view]:not([hidden]) .native-edit-context') ?? paneBody();
}

function common(a: Element, b: Element): Element {
    if (!a.isConnected) return b;
    let node: Element | null = a;
    while (node !== null && !node.contains(b)) node = node.parentElement;
    return node ?? document.body;
}

function label(el: Element): string {
    if (el.hasAttribute('data-keep-layer')) return 'layer';
    if (el.closest('[role="treeitem"]') !== null) return 'row';
    if (el.classList.contains('native-edit-context')) return 'editor';
    return el.tagName.toLowerCase() + (el.hasAttribute('data-pane-body') ? '[body]' : '');
}

/** The browser's focus on a press: the nearest focusable ancestor of the press's target, else body. */
function focusOnPress(target: Element): void {
    let node: Element | null = target;
    while (node !== null) {
        if (node instanceof HTMLElement && (node.tabIndex >= 0 || node.hasAttribute('tabindex') || node instanceof HTMLButtonElement)) {
            node.focus();
            return;
        }
        node = node.parentElement;
    }
    (document.activeElement as HTMLElement | null)?.blur();
}

async function press(name: string, detail: number, log: string[]): Promise<Element> {
    const down = hit(name);
    const pd = stamped(new FakePointerEvent('pointerdown', { ...init(detail), buttons: 1 }));
    down.dispatchEvent(pd);
    await flush();
    if (!pd.defaultPrevented) {
        const md = stamped(new MouseEvent('mousedown', { ...init(detail), buttons: 1 }));
        down.dispatchEvent(md);
        await flush();
    }
    if (emulateFocus.on) focusOnPress(down);
    await flush();
    if (timing.hold > 0) await sleep(timing.hold);
    if (between.run !== null) {
        const run = between.run;
        between.run = null;
        await run();
    }
    await flush();
    const up = hit(name);
    up.dispatchEvent(stamped(new FakePointerEvent('pointerup', init(detail))));
    await flush();
    if (!pd.defaultPrevented) {
        (up.isConnected ? up : hit(name)).dispatchEvent(stamped(new MouseEvent('mouseup', init(detail))));
        await flush();
    }
    const at = common(down, up.isConnected ? up : hit(name));
    at.dispatchEvent(stamped(new MouseEvent('click', init(detail))));
    await flush();
    log.push(`press ${detail}: down=${label(down)} up=${label(up)} click=${label(at)} focus=${focusName()}`);
    return at;
}
export const emulateFocus = { on: false };

function focusName(): string {
    const el = document.activeElement;
    if (el === null) return 'null';
    if (el.classList.contains('native-edit-context')) return 'editor';
    if (el.closest('[role="treeitem"]') !== null) return 'row';
    return el.tagName;
}

async function doubleClick(name: string, log: string[], gap = timing.gap): Promise<void> {
    await press(name, 1, log);
    await sleep(gap);
    const at = await press(name, 2, log);
    at.dispatchEvent(stamped(new MouseEvent('dblclick', init(2))));
    await flush();
    await sleep(timing.readDelay + 50);
    await flush();
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const entry = (name: string, kind: 'file' | 'dir' = 'file') => ({ name, kind, size: 10, mtime: 1 });

let client: ClientState;
let app: ReturnType<typeof mount>;
const asked: string[] = [];

beforeEach(() => {
    asked.length = 0;
    vi.stubGlobal('fetch', async (input: string | URL | Request) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        asked.push(url);
        if (url === '/api/fs') {
            return json({ home: '/h', current: 'default', workspaces: [{ name: 'default', roots: [{ key: 'hub', dir: '/h/hub', fixed: true }] }], dropped: [] });
        }
        if (url.startsWith('/api/fs?root=hub&path=')) {
            const path = decodeURIComponent(url.split('path=')[1].split('&')[0]);
            if (path === '') return json({ entries: [entry('agents.yml'), entry('behavior.yml'), entry('glyphs.yml'), entry('icons.yml')] });
            return json({ entries: [] });
        }
        if (url.startsWith('/api/file/hub/')) {
            if (gate.held !== null) await gate.held;
            else await sleep(timing.readDelay);
            return new Response('a: 1\n', { status: 200, headers: { 'content-type': 'text/plain' } });
        }
        return json({ error: 'not here' }, 404);
    });
    document.body.innerHTML = '';
    client = emptyClient();
    client.registry.registerView({ ...filesRegistration, component: (cut.files ? FakeFiles : Files) as never });
    if (cut.source === 'real') client.registry.registerView({ ...sourceRegistration, component: RealSource as never });
    else client.registry.registerView({ label: 'views.source', glyph: 'views.source_glyph', order: 0, id: 'source', group: '', listed: false, component: (cut.source === 'editor' ? MonacoSource : FakeSource) as never });
    client.layout.apply({
        root: {
            kind: 'pane',
            tabs: [
                { id: 'files-1', view: 'files', state: {} },
                ...(cut.readme ? [{ id: 'readme-1', view: 'source', state: sourceTabState('hub', 'README.md') }] : [])
            ],
            active: 'files-1'
        }
    });
    app = mount(Harness, { target: document.body, context: new Map<unknown, unknown>([[STATE_KEY, client], [TIP_KEY, createTipIds()]]) });
    flushSync();
});

afterEach(() => {
    unmount(app);
    vi.unstubAllGlobals();
});

function seen(): string {
    const pane = client.layout.layout();
    if (pane.kind !== 'pane') return `not one pane: ${JSON.stringify(pane).slice(0, 200)}`;
    const tabs = pane.tabs
        .map((tab) => `${tab.view}:${(tab.state as { path?: string }).path ?? '-'}${tab.preview === true ? '(preview)' : ''}`)
        .join(', ');
    const active = pane.tabs.find((tab) => tab.id === pane.active);
    const toolbar = [...document.querySelectorAll('[role="toolbar"]')].find((el) => el.getAttribute('aria-label') === t('file.toolbar') && !paneBody().contains(el));
    const fake = document.querySelector('[data-fake-actions]');
    const actions = fake ?? (toolbar === undefined ? null : { getAttribute: () => pane.active });
    return `tabs=[${tabs}] active=${active === undefined ? '-' : `${active.view}:${(active.state as { path?: string }).path ?? '-'}`} layer=${paneBody().querySelector('[data-keep-layer]') !== null} actions=${actions === null ? 'none' : actions.getAttribute('data-fake-actions') === pane.active ? 'active' : 'other'} focus=${focusName()}`;
}

async function toFiles(log: string[]): Promise<void> {
    if (!cut.strip) {
        client.layout.activateInstance('files-1');
        flushSync();
        return;
    }
    // The reader presses the Files tab in the strip.
    const face = [...document.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.includes('Files'));
    if (face === undefined) throw new Error('no Files tab face');
    face.dispatchEvent(stamped(new FakePointerEvent('pointerdown', { ...init(1), buttons: 1 })));
    await flush();
    face.dispatchEvent(stamped(new MouseEvent('mousedown', { ...init(1), buttons: 1 })));
    face.dispatchEvent(stamped(new FakePointerEvent('pointerup', init(1))));
    face.dispatchEvent(stamped(new MouseEvent('mouseup', init(1))));
    face.dispatchEvent(stamped(new MouseEvent('click', init(1))));
    await flush();
    await sleep(20);
    await flush();
    if (client.layout.layout().kind === 'pane' && (client.layout.layout() as { active: string }).active !== 'files-1') {
        client.layout.activateInstance('files-1');
        flushSync();
        log.push('strip press did not activate Files; activated through the store');
    }
}



async function ready(log: string[]): Promise<void> {
    await sleep(30);
    await flush();
    if (!cut.files) await press('hub', 1, log);
    await sleep(30);
    await flush();
    await toFiles(log);
}

function editorFocused(): boolean {
    const el = document.activeElement;
    return el !== null && el.classList.contains('native-edit-context') && el.closest('[data-tab-view]:not([hidden])') !== null;
}

describe('X3f observed form: a push marks the root while the read is out', () => {
    it('a double click opens and keeps the tab when the root is marked during the read', async () => {
        const log: string[] = [];
        await ready(log);
        closeGate();
        await press('icons.yml', 1, log);
        await sleep(100);
        const at = await press('icons.yml', 2, log);
        at.dispatchEvent(stamped(new MouseEvent('dblclick', init(2))));
        await flush();
        client.fs.refresh('hub', 7);
        await flush();
        gate.open();
        await sleep(80);
        await flush();
        const result = seen();
        console.log(['DIAG-5c1e observed', ...log, `asked: ${asked.filter((u) => u.startsWith('/api/file')).join(' ')}`, result].join('\n'));
        expect(result, result).toContain('active=source:icons.yml');
        expect(result, result).not.toContain('(preview)');
    });
});

describe('X3f red', () => {
    it('symptom 1: the first read answers while the second press is down; the double click keeps the tab', async () => {
        const log: string[] = [];
        await ready(log);
        closeGate();
        await press('agents.yml', 1, log);
        await sleep(100);
        // The second press goes down on the row; the read answers before it is released.
        between.run = async () => {
            gate.open();
            await sleep(20);
            await flush();
            log.push(`read answered while the second press is down: ${seen()}`);
        };
        const at = await press('agents.yml', 2, log);
        at.dispatchEvent(stamped(new MouseEvent('dblclick', init(2))));
        await flush();
        await sleep(50);
        await flush();
        const result = seen();
        console.log(['DIAG-5c1e red 1', ...log, result].join('\n'));
        expect(result, result).toContain('active=source:agents.yml');
        expect(result, result).not.toContain('source:agents.yml(preview)');
    });

    it('symptom 2: both presses reach the row before the read answers; the kept tab has the keyboard', async () => {
        const log: string[] = [];
        await ready(log);
        closeGate();
        await press('agents.yml', 1, log);
        await sleep(100);
        const at = await press('agents.yml', 2, log);
        at.dispatchEvent(stamped(new MouseEvent('dblclick', init(2))));
        await flush();
        gate.open();
        // Wait for the editor of the kept tab to take the keyboard, up to 2 s.
        const until = performance.now() + 2000;
        while (!editorFocused() && performance.now() < until) {
            await sleep(10);
            await flush();
        }
        const result = `${seen()} editor input focused=${editorFocused()}`;
        console.log(['DIAG-5c1e red 2', ...log, result].join('\n'));
        expect(result, result).toContain('active=source:agents.yml');
        expect(result, result).not.toContain('source:agents.yml(preview)');
        expect(result, result).toContain('editor input focused=true');
    });

    it('symptom 3: a source tab keeps its strip actions when kept and when its preview is walked on', async () => {
        const log: string[] = [];
        await ready(log);
        await press('agents.yml', 1, log);
        await sleep(50);
        await flush();
        const preview = seen();
        await sleep(100);
        await press('agents.yml', 2, log);
        await sleep(50);
        await flush();
        const kept = seen();
        await toFiles(log);
        await press('behavior.yml', 1, log);
        await sleep(50);
        await flush();
        const first = seen();
        await sleep(600);
        await toFiles(log);
        await press('icons.yml', 1, log);
        await sleep(50);
        await flush();
        const walked = seen();
        const result = [`preview: ${preview}`, `kept: ${kept}`, `new preview: ${first}`, `walked preview: ${walked}`].join('\n');
        console.log(['DIAG-5c1e red 3', ...log, result].join('\n'));
        expect(preview, result).toContain('actions=active');
        expect(kept, result).toContain('actions=active');
        expect(first, result).toContain('actions=active');
        expect(walked, result).toContain('actions=active');
    });
});
```

### `tests/diag/FakeFiles.svelte`

```svelte
<script lang="ts">
    // Scratch harness: the Files tab's stand-in. A row's click and dblclick go through openRow as
    // tree/control/pressing.ts and Tree.svelte's onkeep send them, with the opener
    // views/shared/explorer/rooted-tree.svelte.ts builds.
    import { openRow } from '$lib/views/shared/explorer/opening';
    import { useState } from '$lib/state/client/use';
    import type { Instance } from '$lib/state/workbench/layout';
    import { files } from './files';

    let { instance }: { instance: Instance } = $props();
    const {
        fs: { readFileKind },
        layout: { armKeep, keepPreview, openView }
    } = useState();
    const opener = {
        openView,
        keepPreview,
        readFileKind,
        armKeep: (id: string, pressedAt: number) => armKeep(id, instance.id, pressedAt)
    };
</script>

<ul>
    {#each files as row (row.path)}
        <li
            data-row={row.path}
            onclick={(event: MouseEvent) => void openRow(opener, row, true, event.timeStamp)}
            ondblclick={() => void openRow(opener, row, false)}
        >
            {row.name}
        </li>
    {/each}
</ul>
```

### `tests/diag/FakeSource.svelte`

```svelte
<script lang="ts">
    // Scratch harness: a source tab's stand-in. It hands its strip actions up exactly as
    // views/sources/source/Source.svelte does, and draws an editor-shaped element.
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import type { Instance } from '$lib/state/workbench/layout';

    let { instance }: { instance: Instance } = $props();

    handUp(useTabActions(), () => instance.id, stripActions);
</script>

{#snippet stripActions()}
    <span data-fake-actions={instance.id}>actions</span>
{/snippet}

<div class="monaco-editor" data-fake-editor>
    <div class="native-edit-context" tabindex="0"></div>
</div>
```

### `tests/diag/files.ts`

```ts
// Scratch harness: the rows of the stand-in Files tab and the read of a file's kind, answered after
// `readDelay` ms as the route answers the head of a file.
import type { TreeRow } from '../../src/lib/state/sources/fs';

const row = (path: string): TreeRow =>
    ({ root: 'hub', path, name: path.split('/').pop() ?? path, kind: 'file', depth: 0, size: 10 }) as unknown as TreeRow;

export const files: TreeRow[] = ['agents.yml', 'icons.yml', 'behavior.yml', 'glyphs.yml'].map(row);

export const timing = { readDelay: 5 };

export function readFileKind(): Promise<{ kind: 'text' }> {
    return new Promise((done) => setTimeout(() => done({ kind: 'text' }), timing.readDelay));
}
```

### `tests/diag/Harness.svelte`

```svelte
<script lang="ts">
    // Scratch harness: the page's one pane, drawn by the real PaneView (strip, body, catch layer)
    // inside the page's tooltip group.
    import PaneView from '$lib/shell/panes/PaneView.svelte';
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';
    import { useState } from '$lib/state/client/use';
    const { layout } = useState();
    const node = $derived(layout.layout());
</script>

<TooltipGroup>
    <PaneView {node} />
</TooltipGroup>
```

### `tests/diag/MonacoSource.svelte`

```svelte
<script lang="ts">
    // Scratch harness: a source tab's stand-in that draws the real ui/controls/editor/Editor.svelte
    // with the model name taken from the instance, as views/sources/source/ hands it down, and hands
    // its strip actions up as Source.svelte does.
    import Editor from '$lib/ui/controls/editor/Editor.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import type { Instance } from '$lib/state/workbench/layout';

    let { instance }: { instance: Instance } = $props();

    handUp(useTabActions(), () => instance.id, stripActions);
</script>

{#snippet stripActions()}
    <span data-fake-actions={instance.id}>actions</span>
{/snippet}

<Editor
    text={'a: 1\n'}
    language="yaml"
    model={instance.id}
    path={(instance.state as { path?: string }).path ?? ''}
/>
```

### `tests/diag/fake-kit.ts`

```ts
// Scratch harness: a Monaco stand-in for ui/controls/editor/kit/load.ts. It keeps Monaco's one DOM
// behaviour the diagnosis needs, observed in the page by D37's probe 1 (StandaloneEditor
// _detachModel removes the view's `.monaco-editor` element; attaching a model builds a new one with
// its input): setModel(null) removes the editor element and setModel(model) builds a new one holding
// `.native-edit-context`. Every other member answers a no-op.

export const made = { created: 0, removed: 0 };

function noop(): unknown {
    return new Proxy(function () {}, {
        get: (_t, key) => (key === 'then' ? undefined : key === Symbol.toPrimitive ? () => 0 : noop()),
        apply: () => noop()
    });
}

function model(text: string) {
    let value = text;
    return new Proxy(
        {
            getValue: () => value,
            setValue: (next: string) => (value = next),
            getLineCount: () => value.split('\n').length,
            getLanguageId: () => 'yaml',
            dispose: () => undefined,
            onDidChangeContent: () => ({ dispose: () => undefined })
        } as Record<string | symbol, unknown>,
        { get: (target, key) => (key in target ? target[key] : key === 'then' ? undefined : noop()) }
    );
}

function editor(box: HTMLElement) {
    let held: unknown = null;
    const target: Record<string | symbol, unknown> = {
        setModel: (next: unknown) => {
            const old = box.querySelector(':scope > .monaco-editor');
            if (old !== null) {
                old.remove();
                made.removed += 1;
            }
            held = next;
            if (next === null) return;
            const shell = document.createElement('div');
            shell.className = 'monaco-editor';
            const input = document.createElement('div');
            input.className = 'native-edit-context';
            input.tabIndex = 0;
            shell.append(input);
            box.append(shell);
            made.created += 1;
        },
        getModel: () => held,
        getOption: () => 18,
        dispose: () => undefined
    };
    return new Proxy(target, {
        get: (t, key) => (key in t ? t[key] : key === 'then' ? undefined : noop())
    });
}

export const fakeKit = {
    monaco: new Proxy(
        {
            editor: new Proxy(
                {
                    create: (box: HTMLElement) => editor(box),
                    createModel: (text: string) => model(text),
                    getModel: () => null
                } as Record<string | symbol, unknown>,
                { get: (t, key) => (key in t ? t[key] : key === 'then' ? undefined : noop()) }
            ),
            Uri: { from: (parts: { path: string }) => ({ toString: () => parts.path }) }
        } as Record<string | symbol, unknown>,
        { get: (t, key) => (key in t ? t[key] : key === 'then' ? undefined : noop()) }
    ),
    mac: true,
    paint: () => Promise.resolve('oculus'),
    ensureLanguage: () => Promise.resolve(),
    formatting: noop()
};
```
