# Brief: X3f, a file row's double click and Open Preview as VS Code's, and every file tab's controls at the strip's end

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full, the files this brief names under "Read, with sections or line ranges". No ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The plan line (`plan.md:192`)

"X3f a file tab's actions on every file tab, and a file row opening as VS Code's (Axel's report 2026-10-04 of X3c's item 12): (A) a double click on a file in the Files tree opens it as a kept tab, as VS Code's; (B) every file tab draws Save, Revert, the star, Open in Program, Preview and Blame at the strip's end where they apply to its file, whatever the file (today only the source view hands them up, `views/sources/source/Source.svelte:300-304` through `ui/tabs/tab-actions.svelte.ts`, and a file that opens in another view draws none); (C) Open Preview on a Markdown file opens its rendered preview, as VS Code's (today it opens the source view, `views/shared/explorer/tree/menu/row-menu.ts:492-493`). X3f's /spec reproduces each on TEST and finds each cause read-only before the brief."

## What is on the tree (read on main at e6ef64e28)

Paths are under `tools/oculus/` in the worktree `.agents/worktrees/X3f`. The base copy of the tree is `.agents/worktrees/X3f-base/tools/oculus/` (`src`, `tests`, `utils`, `config`), and beside it `unused-exports.txt`, the output of `sh utils/unused-exports.sh` on main at the base. Read a file as it was at the base there.

- (A) The tree's double click is wired: `src/lib/views/shared/explorer/tree/FileRow.svelte:130` passes `ondblclick={row.kind === 'file' ? () => onkeep(row) : undefined}` to `TreeItem`, and `src/lib/views/shared/explorer/tree/Tree.svelte:336-339` answers `onkeep` with `onselect(one); onopen(one, false)`. A single press goes through `src/lib/views/shared/explorer/tree/control/pressing.ts:51` (`deps.onopen(row, true)`), and `openRow` in `src/lib/views/shared/explorer/opening.ts:55-60` awaits `readFileKind`, opens with `{ preview }` and keeps the tab when `preview` is false.
- (A) The cause, reproduced on TEST (tab 812137347, the Files tab of the TEST page, one pane holding Files and the opened files): a single press on `applications/applications.yml` in the tree, then a read of `document.elementFromPoint` at the same point 250 ms later, found the second point on `DIV|presentation|lines-content monaco-editor-background`, the editor of the preview tab the first press opened, and the strip's selected tab was `applications.yml`. The views a file opens in (`source`, `file`, `document`, `doc`) register with `group: ''`, so they open through `openOpened` (`src/lib/state/workbench/layout/open/opening.ts:121`, `:197-253`), which lands where `landingFor` says (`layout/open/landing.ts:28-67`): on TEST the reader is in the pane holding the Files view, and that pane already holds opened tabs, so the file lands in it (`landing.ts:54-57`). So within a human double click the first press has replaced the tree with the file and the second press lands on the editor: the row's `dblclick` never fires and the file stays a preview tab. Axel's report (ruling Z418, "a double click on a file opens nothing") is this symptom as a reader sees it: the first press already showed the file, and the second press changes nothing, the tab staying a preview. Double clicks sent by the browser tool, both presses within a few milliseconds, landed before the read returned and kept the tab (`CLAUDE.md`, `docs/HPC-UTwente-howto.md`, `applications/VacancyPages.xlsx`, each read afterwards with `data-tab-preview` absent).
- (A) The second press lands wherever the opened view draws: in Monaco for a text file, inside an `<iframe>` for a PDF (`File.svelte:238`) and for an HTML document (`Document.svelte:121-127`). A click inside a frame never reaches the page's window, so a listener on the window cannot see it; a layer over the pane's body can.
- (A) `src/lib/state/workbench/layout/open/opening.ts:135-139` says the second click "lands on the tab the tree opened"; it is false for the same reason and is rewritten.
- (A) `HELP.md:167` and `DESIGN.md:395` both say that in one pane "the second click lands on the tab and keeps it". The probe above shows the second click lands on the editor, not the tab; both sentences are false on the tree and are rewritten by this step.
- (B) Only the source view hands its controls up: `src/lib/views/sources/source/Source.svelte:300-304` calls `useTabActions()` and `handed?.set(instance.id, stripActions)`, with `clear` in the effect's cleanup; `src/lib/ui/tabs/tab-actions.svelte.ts` is the store; `src/lib/shell/panes/PaneView.svelte:126` provides it and `:423` draws `tabActions.of(active)`. `grep -rn "useTabActions()" src/lib` prints only `tab-actions.svelte.ts:50` and `Source.svelte:300`.
- (B) The controls of the source tab are `src/lib/views/sources/source/StripActions.svelte` (95 lines): Save and Revert while `editing`, the star (`views/shared/links/BookmarkStar.svelte`) while `bookmarkable`, Open in Program (`views/shared/links/ProgramButton.svelte`) while `program`, the Preview chip while `previewable`, the Blame chip while `blameable`; `Source.svelte:386-391`, inside the `stripActions` snippet (`:382-399`), decides each.
- (B) The file view draws its own row of controls under the breadcrumb: `src/lib/views/sources/file/File.svelte:193-205`, the `tools` snippet: the star, Open in a browser tab (`file.open_outside`), and Open in Program while `openable`. Seen on TEST on the `VacancyPages.xlsx` tab: the three icons in a row under `hub > applications > VacancyPages.xlsx`, none at the strip's end.
- (B) The document view (an HTML file) draws its own row: `src/lib/views/sources/document/Document.svelte:117-126`, the `tools` snippet: Open in a browser tab (`document.open_outside`) only.
- (B) The doc view (a hub document from the views catalogue, `src/lib/views/sources/doc/Doc.svelte`, 121 lines) draws no controls; `fileOfTab` in `src/lib/state/workbench/navigation/pages.ts:360-366` reads it as the file `{ root: HUB_ROOT, path }`, so it is a file tab with a breadcrumb.
- (B) `HELP.md:49` says "The active file tab's Save, Revert, star, Open in Program, Preview and Blame sit at the right end of the pane's strip ... the source tab has no row of controls of its own". After this step it holds for every file tab; the sentence is rewritten to say so.
- (C) Reproduced on TEST (tab 812137347): Open Preview from the row menu of `docs/AGENT-APPROACH.md` in the Files tree opened a tab labelled `AGENT-APPROACH.md` showing the Markdown source in the editor, with the Preview chip off, and no rendered view.
- (C) Open Preview is offered for a Markdown row only (`src/lib/views/shared/explorer/tree/menu/row-menu.ts:268`, `facts.markdown`), labelled `files.menu_preview: Open Preview` (`config/text/views/sources/files.yml:100`), and picking it runs `deps.keepPreview(deps.openView('source', sourceTabState(row.root, row.path)))` (`row-menu.ts:492-493`): a source tab with its rendered half off (`rendered: z.boolean().catch(false)`, `src/lib/state/sessions/source.svelte.ts:111`). VS Code's Open Preview opens a tab of the rendered Markdown alone, labelled `Preview <name>`, with Open Source among its title actions.
- (C) The rendered half is `src/lib/views/sources/source/Preview.svelte` (79 lines): it takes the text, drops a YAML front matter block (`FRONT_MATTER`), and draws it through `shared/prose/Markdown.svelte` with `blockMarkdown`. A source tab reads a file's text at `/api/file/<root>/<path>` (`src/lib/state/sessions/source.svelte.ts:164`).
- Views register themselves: `src/routes/views.ts:43` globs `$lib/views/**/*.svelte` and reads each module's `registration`. Folder counts (`git ls-tree --name-only HEAD <dir>/ | wc -l`): `views/sources/` 10 and `views/sources/source/` 10, the folder limit; `views/sources/doc/`, `file/` and `document/` 1 each; `views/shared/prose/` 6; `views/shared/links/` 7; `state/workbench/layout/open/` 9; `shell/panes/` 10, the limit.
- The view boundary (`agents/spec.md`: `views/` imports no shell and no other view; `tests/checks/tree/boundaries.test.ts:181-190`, `ownPartials`, and `:138`): a view imports only its own folder, `ui/`, `state/` and `views/shared/`. So code shared by the source, file, document, doc and Markdown preview views lives under `views/shared/`; none of them imports another's folder. `src/lib/views/sources/source/Editor.svelte:29` imports `./Preview.svelte` and its head comment at `:25` names `StripActions.svelte`.
- The text a source save changes is read again already: `fs.fileText(root, path)` (`state/sources/fs.svelte.ts:497`) holds the query `['fs','text',root,key]`, which `fs.markText` marks on every source save (`state/client/context.ts:329-331`), and reads through `readText` with `cache: 'no-cache'`. `fs.fileVersion` moves only on a PDF rebuild (`fs.bump`'s one caller is `state/sessions/latex.svelte.ts:506`), and nothing polls the disk (`fs.svelte.ts:12-19`).
- A rename or move restates the open file tabs through `followedFileTab` (`state/sources/explorer/follow.ts:110`), which knows `source`, `file` and `document` only.
- A preview tab walked by single presses keeps its instance id and changes its view (`retarget`, `layout/open/preview.ts`; `PaneBody.svelte:113` keys each view by `instance.id`), so the new view's component is made before the old one is destroyed: a view whose cleanup calls `TabActions.clear(id)` (`ui/tabs/tab-actions.svelte.ts:25`) deletes the controls the new view just set.
- Tests: `grep -n -i "preview\|tab-actions\|row-menu\|opening" agents/guarded.md` names no entry over this step's behaviours, so this step writes no test, and each behaviour is proved at the look. G12 (`agents/guarded.md:68-69`, every shipped config file reads with no finding) covers the `config/text/` files this step writes, so its test runs with the tree checks (`npm run test:checks`, which also holds the boundary check and the text-key check).
- No ADR folder exists (`ls docs/adr tools/oculus/docs/adr`: no such file or directory), so no ADR touches this step.

## What to build

1. **(A) A double click on a file row keeps the tab it opens, in one pane as in two.** The second press of a double click that started on a file row keeps the tab the first press opened, wherever in the page that second press lands (the editor of the new tab, a PDF or HTML frame, the tab face, the tree). Build it as a catch layer over the pane body that shows the opened tab: when `openRow` (`explorer/opening.ts`) opens a preview tab from a single press, it arms a keep for that instance through a new layout call (beside `keepPreview`, in a module of its own under `state/workbench/layout/open/`, exposed by `state/workbench/layout.svelte.ts` and put in the tree's opener in `views/shared/explorer/rooted-tree.svelte.ts:80`). While the keep is armed, `shell/panes/PaneBody.svelte` draws a transparent layer over the body of the pane whose active tab is that instance, above any frame. The next press on that layer (`pointerdown`, primary button) keeps the tab through `keepPreview`, is stopped so it reaches nothing under it (Monaco selects no word, the frame gets no click), and disarms. The keep is disarmed, and the layer gone, at the first of: that press, 500 ms after the first press (a named constant with its reason in a comment: the double-click interval macOS and Windows ship with), any press elsewhere in the page, any key, the tab closing, retargeted or no longer active, and the Files tab closing. A pane that does not show the opened tab draws no layer, so with the tree in another pane the second press lands on the row and its `ondblclick` keeps the tab as today. The row's own `ondblclick` stays for the case where both presses land before the read returns. Either path, or both, ends with exactly one kept tab of the file and no preview tab of it: a press whose `openRow` resolves after the tab was kept never turns it back into a preview and never opens a second tab, and an `openRow` that resolves after the Files tab closed arms nothing.
2. **(B) Every file tab hands its controls up to the strip's end.** The file view (`File.svelte`), the document view (`Document.svelte`) and the doc view (`Doc.svelte`) hand their controls up through `useTabActions()` as `Source.svelte:300-304` does, and draw no row of controls of their own. What each tab draws, where it applies to its file:
   - Save and Revert: a source tab whose text may be written (unchanged).
   - The star: every file tab whose file is served and is not read at a commit: source (unchanged), file, document, doc.
   - Open in Program: every file tab whose extension `open.program_ext` names an application for: source (unchanged), file (unchanged condition `openable`), document, doc.
   - Preview: a source tab of a Markdown file while its text may be written (unchanged).
   - Blame: a source tab of a file in a repository once loaded (unchanged); a picture, a PDF, a download, an HTML document and a hub document draw none, as VS Code draws blame in a text editor only.
   - Open in a browser tab: the file view and the document view, as today, now at the strip's end.
   - The new Markdown preview tab of item 3: the star, Open in Program where configured, and Open Source.
   One strip-actions component under `views/shared/links/` draws them for every file tab (the source tab's `StripActions.svelte` moves there and widens; no view imports another view's folder), so the order and the look are the same on every file tab: Save, Revert, the star, Open in a browser tab, Open in Program, Open Source, Preview, Blame. The line saying why a bookmark or an open was refused stays in each view, as the source tab keeps it under the editor. A view takes its controls away only when they are the ones it set: `TabActions.clear` (`ui/tabs/tab-actions.svelte.ts`) takes the snippet it is clearing and leaves a newer one, so a preview tab retargeted from one view to another keeps the new view's controls (the new view sets them before the old one is destroyed). Source.svelte uses the same call.
3. **(C) Open Preview opens the rendered Markdown alone, as VS Code's.** A new unlisted view `markdown-preview` (registered as `file` and `doc` are, `group: ''`, `listed: false`), in `src/lib/views/sources/doc/MarkdownPreview.svelte`, shows one Markdown file rendered, through one shared rendering component under `views/shared/prose/` (front matter left out, the same `blockMarkdown` call, the same document styles), which `source/Preview.svelte` and the new view both use; the rendering moves there and is never copied, and `source/Editor.svelte:29` imports it from there. Its state is `{ root, path, label }`, so `fileOfTab` reads it as a file tab and the breadcrumb is drawn over it. Its tab label is `Preview <name>`, from a new catalog line. It reads the file's text through `fs.fileText(root, path)`, the read a source save marks, so a save from a source tab redraws it; a write from outside oculus is seen when the tab is opened again, as no file is polled. A read that answers after the tab closed or was retargeted is dropped (the query is held per file, not per tab). A file that cannot be read says so with `source.cannot_open`; a saved state with no root or no path says so with a none line, as `file.none` and `doc.none` do. `followedFileTab` (`state/sources/explorer/follow.ts:110`) follows a `markdown-preview` tab on a rename or move as it follows a source tab, its label restated to `Preview <new name>`. `row-menu.ts:492-493` opens this view, kept: `deps.keepPreview(deps.openView('markdown-preview', { root, path, label }))`; opening it a second time for the same file activates the tab already open. Its strip actions (item 2) include Open Source, which opens the file's source tab as a single click's open does, kept.
4. **Docs.** `HELP.md:167` and `DESIGN.md:395` say what a double click does in one pane after item 1 (the second press keeps the tab the first opened, wherever it lands). `HELP.md:49` says every file tab's controls sit at the strip's end. The `files` row of `HELP.md`'s view table, or the paragraph that names Open Preview if there is one, says Open Preview opens the rendered file in a tab of its own. `DESIGN.md:427` (the strip's controls and `views/sources/source/StripActions.svelte`), `DESIGN.md:391` (`views/sources/source/Preview.svelte` as the renderer), `HELP.md:161` (the prose surfaces, which gain the Markdown preview tab), `layout/open/opening.ts:135-139` and `source/Editor.svelte:25` are rewritten to match. Every other paragraph and head comment the change makes false is rewritten (the grep spec.md asks for).

## Cases

1. TEST page, the Files tab in one pane with the files it opens: a single press on a text file opens one preview tab of it (italic, `data-tab-preview`), the tree hidden.
2. Same pane: a double click at human speed (second press 150 to 400 ms after the first, landing on the opened editor) leaves one kept tab of the file (`data-tab-preview` absent) and no preview tab of it.
3. Same pane: a double click whose two presses land before the read returns (the browser tool's double click) leaves one kept tab of the file and no second tab.
4. A double click on a file already open as a kept tab activates that tab; no second tab opens.
5. A double click on a picture, a PDF (the second press landing in its frame) or another binary file (`applications/VacancyPages.xlsx`) leaves one kept file tab.
6. A double click on an HTML file, the second press landing in its frame, leaves one kept document tab.
7. A single press, then a second single press on the opened editor after the double-click window: the tab stays a preview tab.
8. Files in a pane beside the editors: a single press on one file, then within 500 ms a press on another row: the second row's preview replaces the first, and nothing is kept (no layer is drawn over the Files pane).
9. Files in a pane beside the editor's pane: a double click keeps the tab in the pane the file opened in (unchanged).
10. A double click on a folder row opens and closes the folder as today and keeps nothing.
11. The Files tab closed within 500 ms of a press, then a press on the opened tab's body inside the 500 ms: the keep was disarmed at the close, so the press reaches the editor and the tab stays a preview.
12. A source tab of a Markdown file in a repository, writable: the strip's end draws Save, Revert, the star, Open in Program where configured, Preview and Blame (unchanged).
13. A source tab read at a commit (`head` set): no star, no Save or Revert (unchanged).
14. The `VacancyPages.xlsx` file tab: the star, Open in a browser tab and Open in Program where configured at the strip's end, and no row of controls under the breadcrumb.
15. A PDF or a picture file tab: as case 14.
16. An HTML document tab: the star, Open in a browser tab, and Open in Program where configured, at the strip's end; no row under the breadcrumb.
17. A hub document tab (`doc`, opened from the views catalogue): the star and Open in Program where configured.
18. A pane holding a source tab and a file tab: switching between them draws only the active tab's controls; closing a tab drops its controls.
19. A refused bookmark write or program open on a file, document or doc tab: the refusal's words are shown in that view, as the source tab shows them.
20. Open Preview on `CLAUDE.md` in the Files tree: a kept tab labelled `Preview CLAUDE.md` showing the rendered Markdown alone, the breadcrumb `hub > CLAUDE.md` over it, the star, Open in Program where configured and Open Source at the strip's end.
21. Open Preview twice on one file: the second activates the tab the first opened.
22. Open Preview on a Markdown file with a YAML front matter block: the block is not drawn.
23. Open Preview on a file removed after the menu opened: the tab says the file cannot be opened (`source.cannot_open`).
24. A Markdown file saved from its source tab while its preview tab is open: the preview tab shows the saved text.
25. Open Source on the preview tab: the file's source tab opens kept, or is activated when open.
26. A page reloaded with a Markdown preview tab open: the tab comes back with its file (the saved layout keeps its state).
27. Open Preview is offered on a Markdown row and on no other row (unchanged).
28. A preview tab walked by single presses from a `.md` file to `VacancyPages.xlsx` and back: each step's strip end draws the active view's controls and none of the one before.
29. Two panes, each showing a different file tab: each strip end draws its own active tab's controls.
30. A file tab in a float (the float's strip): its controls at the float's strip end; a double click from a Files view in a float keeps the tab (the float is one pane).
31. The second press of a double click on a text file in one pane: no word is selected in the editor.
32. A single press, then a press on the opened tab's body 600 ms later: the tab stays a preview and the press reaches the editor.
33. A file removed before the press's read returns: the cannot-open line, no kept empty tab.
34. A file reached through a symlink, and a file whose name holds a space or a `#`: the star, Open in Program and the Markdown preview act on the served root and path and read the file.
35. A Markdown file renamed while its preview tab is open: the tab follows it, labelled `Preview <new name>`.
36. A `markdown-preview` tab restored from a saved layout whose state has no root or path: the none line.
37. A preview tab's read still out when the tab closes: nothing is drawn or thrown when it answers.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted. No case of this step becomes a test: no entry of `agents/guarded.md` covers this code, so each case is checked by reading the code on the unchanged tree and noted, and the orchestrator's look on TEST at landing is its proof. Cases 2, 7, 11 and 32 are the timing cases the look drives with a press, a wait and a press.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/views/shared/explorer/tree/control/pressing.ts`
- `tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte`
- `tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte`
- `tools/oculus/src/lib/views/shared/explorer/opening.ts`
- `tools/oculus/src/lib/views/shared/explorer/tree/menu/row-menu.ts`
- `tools/oculus/src/lib/views/sources/source/StripActions.svelte` (moved to `views/shared/links/`)
- `tools/oculus/src/lib/views/sources/source/Editor.svelte`
- `tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts`
- `tools/oculus/src/lib/views/shared/prose/` (the shared Markdown document component)
- `tools/oculus/src/lib/ui/tabs/tab-actions.svelte.ts`
- `tools/oculus/src/lib/shell/panes/PaneBody.svelte`
- `tools/oculus/src/lib/state/workbench/layout.svelte.ts`
- `tools/oculus/src/lib/state/workbench/layout/open/` (one new module for the armed keep, and `opening.ts:135-139`)
- `tools/oculus/src/lib/state/sources/explorer/follow.ts`
- `tools/oculus/src/lib/views/sources/source/Source.svelte`
- `tools/oculus/src/lib/views/sources/source/Preview.svelte`
- `tools/oculus/src/lib/views/sources/file/File.svelte`
- `tools/oculus/src/lib/views/sources/document/Document.svelte`
- `tools/oculus/src/lib/views/sources/doc/Doc.svelte`
- `tools/oculus/src/lib/views/sources/doc/MarkdownPreview.svelte` (new)
- `tools/oculus/src/lib/views/shared/links/` (the shared strip-actions component)
- `tools/oculus/config/text/views/sources/files.yml`, `config/text/views/sources/file.yml`, `config/text/views/sources/document.yml`, and the catalog file of the group the new view's label and Open Source join
- `tools/oculus/HELP.md`
- `tools/oculus/DESIGN.md`
- `tools/oculus/docs/diagrams/` (whatever `npm run diagrams` rewrites)
- `tools/oculus/.scratch/migration/agents/reviews/X3f-report.md`

The step writes these paths and nothing else; a path outside them that the step needs is named in the report with the reason.

## Decisions taken in this brief (each reversible, none silent)

1. The double click's second press is caught by a layer over the pane showing the opened tab for 500 ms after a single press that opened a preview, since in one pane the tree is gone before the second press and the second press may land in a frame; the tab still lands where `landingFor` puts it today. A press on the opened tab within 500 ms of opening it therefore keeps the tab rather than placing the caret, as a double click does. Opening files in a pane other than the Files view's, as VS Code keeps its Explorer beside the editors, would change where every file lands and is not taken here.
2. The Markdown preview tab shows the file as saved (it is read again on every save from a source tab), not the unsaved text of an open source tab; VS Code's follows the editor's buffer. Reversible by reading the source draft of the same file when one is open.
3. The preview tab is a view of its own, `markdown-preview`, in `views/sources/doc/` (beside the other view that renders a Markdown file alone; `views/sources/` itself is full); its view id is saved in the layout as every view id is.
4. Blame is drawn on source tabs only, as VS Code's.
5. The hub document view (`doc`) is a file tab under this step (its breadcrumb already reads it as one), so it gets the star and Open in Program.

## Libraries checked

None found: the double click and the strip's controls are wiring between existing modules, and the Markdown rendering is the `blockMarkdown` call (marked and the sanitiser) the tree already uses. No new dependency. The builder adds no dependency this brief does not name; a library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `src/lib/views/shared/explorer/tree/control/pressing.ts` whole, `tree/Tree.svelte:1-40` and `:300-345`, `tree/FileRow.svelte:100-135`, `explorer/opening.ts` whole: the press path.
2. `src/lib/state/workbench/layout/open/opening.ts:1-120` and `layout/open/preview.ts` whole: where a tab lands and how a preview is kept.
2a. `src/lib/state/workbench/layout/open/landing.ts` whole, `src/lib/shell/panes/PaneBody.svelte` whole, `src/lib/views/shared/explorer/rooted-tree.svelte.ts:60-95`, `tests/checks/tree/boundaries.test.ts:130-195`, `src/lib/state/sources/fs.svelte.ts:490-505`, `src/lib/state/sources/explorer/follow.ts:100-125`.
3. `src/lib/ui/tabs/tab-actions.svelte.ts` whole, `src/lib/shell/panes/PaneView.svelte:120-130` and `:415-430`: how a view hands its controls up.
4. `src/lib/views/sources/source/Source.svelte:290-310` and `:380-402`, `source/StripActions.svelte` whole, `source/Preview.svelte` whole.
5. `src/lib/views/sources/file/File.svelte` whole, `document/Document.svelte` whole, `doc/Doc.svelte` whole.
6. `src/lib/views/shared/explorer/tree/menu/row-menu.ts:255-275` and `:460-496`.
7. `src/lib/state/workbench/navigation/pages.ts:340-366` (`fileOfTab`).
8. `HELP.md:44-50` and `:160-170`, `DESIGN.md:395`.

## Conventions

On top of `agents/spec.md`: every string from `config/text/` through `t()`; every control a `ui/` primitive; a component at or under 520 lines (`Source.svelte` is 502 and `File.svelte` 319, so a change that would pass 520 splits the file by concern); no history in comments.

## Verify before you report

Run from `tools/oculus` in the worktree:

1. `npm run test:quick` once, after the last change, with `npm run diagrams` right before it; it prints each command and `test:quick: <seconds> s (limit 45.0 s); every command passed`. The report quotes its final lines.
2. `npm run test:checks` once, after the last change; it ends with every file passed (the boundary check, the text-key check and G12's `tests/checks/config/config.test.ts` among them). The report quotes its final lines.
2b. The ASCII gate of `agents/spec.md` over every file you touched prints nothing.
3. `sh utils/unused-exports.sh`, compared with `.agents/worktrees/X3f-base/unused-exports.txt`: each added line quoted with what was done to it.
4. `grep -rn "useTabActions()" src/lib` names `Source.svelte`, `File.svelte`, `Document.svelte`, `Doc.svelte` and `MarkdownPreview.svelte` (or the shared component they use); this shows the wiring only, and cases 18, 28 and 29 at the look show the behaviour.
5. This step adds or changes no test; the report says so in one line.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/X3f-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim. Then the cases' first run: each case with its result on the unchanged tree, read from the code. Then the DONE / NOT DONE table with the checks above and their output verbatim, and the number of runs of the verify list. Then files with line counts (from `diff -rq` against the base copy), every judgment call the brief left open, every host- or user-visible change with its before and after (the view, the state to put it in and what should differ, which the look is read against), the 'still true' or 'rewritten' list of every paragraph and head comment that describes the changed behaviour, and anything in the brief that was wrong or impossible, with the evidence.
